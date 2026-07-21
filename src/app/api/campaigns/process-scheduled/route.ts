import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createTransport } from "nodemailer";

// POST: Process all scheduled campaigns that are due to be sent
// Protected with a simple API key check via x-cron-key header
export async function POST(request: NextRequest) {
  try {
    // API key check — allow if no CRON_KEY is set in env
    const cronKey = process.env.CRON_KEY;
    const requestKey = request.headers.get("x-cron-key");

    if (cronKey && requestKey !== cronKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find all scheduled campaigns that are due
    const scheduledCampaigns = await db.emailCampaign.findMany({
      where: {
        status: "SCHEDULED",
        scheduledAt: {
          lte: new Date(),
        },
      },
    });

    if (scheduledCampaigns.length === 0) {
      return NextResponse.json({
        message: "No scheduled campaigns to process",
        processed: 0,
      });
    }

    // Get all active subscribers (shared across campaigns)
    const subscribers = await db.newsletterSubscriber.findMany({
      where: { status: "ACTIVE" },
      select: { email: true, name: true, token: true },
    });

    if (subscribers.length === 0) {
      // Mark all campaigns as sent even if no subscribers
      await db.emailCampaign.updateMany({
        where: {
          id: { in: scheduledCampaigns.map((c) => c.id) },
        },
        data: {
          status: "SENT",
          sentAt: new Date(),
          recipientCount: 0,
        },
      });

      return NextResponse.json({
        message: "No active subscribers — campaigns marked as sent",
        processed: scheduledCampaigns.length,
        recipientCount: 0,
      });
    }

    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const results: {
      campaignId: string;
      subject: string;
      recipientCount: number;
      status: string;
    }[] = [];

    // Process each campaign
    for (const campaign of scheduledCampaigns) {
      // If SMTP not configured, simulate send for dev
      if (!smtpUser || !smtpPass) {
        console.log(
          `[DEV] Would send campaign "${campaign.subject}" to ${subscribers.length} subscribers`
        );

        await db.emailCampaign.update({
          where: { id: campaign.id },
          data: {
            status: "SENT",
            sentAt: new Date(),
            recipientCount: subscribers.length,
          },
        });

        results.push({
          campaignId: campaign.id,
          subject: campaign.subject,
          recipientCount: subscribers.length,
          status: "sent (dev mode)",
        });

        continue;
      }

      // Send emails in batches of 10 with delay
      const transporter = createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: { user: smtpUser, pass: smtpPass },
      });

      const batchSize = 10;
      let sentCount = 0;

      for (let i = 0; i < subscribers.length; i += batchSize) {
        const batch = subscribers.slice(i, i + batchSize);

        await Promise.all(
          batch.map(async (subscriber) => {
            try {
              const unsubscribeUrl = `${process.env.NEXTAUTH_URL}/api/newsletter/unsubscribe?token=${subscriber.token}`;
              const htmlContent = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background: #f97316; padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">Sanaa Through My Lens</h1>
                  </div>
                  <div style="padding: 24px;">
                    ${campaign.content}
                  </div>
                  <div style="padding: 16px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #eee;">
                    <p>You're receiving this because you subscribed to Sanaa Through My Lens newsletter.</p>
                    <a href="${unsubscribeUrl}" style="color: #999;">Unsubscribe</a>
                  </div>
                </div>
              `;

              await transporter.sendMail({
                from: `"Sanaa Through My Lens" <${smtpUser}>`,
                to: subscriber.email,
                subject: campaign.subject,
                html: htmlContent,
              });
              sentCount++;
            } catch (emailError) {
              console.error(
                `Failed to send to ${subscriber.email}:`,
                emailError
              );
            }
          })
        );

        // Delay between batches (500ms)
        if (i + batchSize < subscribers.length) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      await db.emailCampaign.update({
        where: { id: campaign.id },
        data: {
          status: "SENT",
          sentAt: new Date(),
          recipientCount: sentCount,
        },
      });

      results.push({
        campaignId: campaign.id,
        subject: campaign.subject,
        recipientCount: sentCount,
        status: "sent",
      });
    }

    return NextResponse.json({
      message: "Scheduled campaigns processed",
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error("Process scheduled campaigns error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
