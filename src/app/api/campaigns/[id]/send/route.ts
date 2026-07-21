import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { createTransport } from "nodemailer";

// POST: Send campaign to all active subscribers
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session.user.role, "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const campaign = await db.emailCampaign.findUnique({ where: { id } });
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    if (campaign.status === "SENT") {
      return NextResponse.json(
        { error: "Campaign already sent" },
        { status: 400 }
      );
    }

    // Get all active subscribers
    const subscribers = await db.newsletterSubscriber.findMany({
      where: { status: "ACTIVE" },
      select: { email: true, name: true, token: true },
    });

    if (subscribers.length === 0) {
      return NextResponse.json(
        { error: "No active subscribers to send to" },
        { status: 400 }
      );
    }

    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    // If SMTP not configured, simulate send for dev
    if (!smtpUser || !smtpPass) {
      console.log(`[DEV] Would send campaign "${campaign.subject}" to ${subscribers.length} subscribers`);

      await db.emailCampaign.update({
        where: { id },
        data: {
          status: "SENT",
          sentAt: new Date(),
          recipientCount: subscribers.length,
        },
      });

      return NextResponse.json({
        message: "Campaign sent (dev mode — no SMTP configured)",
        recipientCount: subscribers.length,
      });
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
            const trackingBaseUrl = `${process.env.NEXTAUTH_URL}/api/campaigns/track?campaignId=${campaign.id}`;

            // Build the base HTML
            let htmlContent = `
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

            // Wrap all href links with click tracking (skip already-tracked links)
            htmlContent = htmlContent.replace(
              /href="(?!https?:\/\/[^\s"]*\/api\/campaigns\/track)([^"]+)"/g,
              (match, url) => {
                return `href="${trackingBaseUrl}&type=click&url=${encodeURIComponent(url)}"`;
              }
            );

            // Add open tracking pixel before the closing </div>
            const trackingPixel = `<img src="${trackingBaseUrl}&type=open" width="1" height="1" alt="" style="display:none" />`;
            htmlContent = htmlContent.replace(
              /<\/div>\s*$/,
              `${trackingPixel}</div>`
            );

            await transporter.sendMail({
              from: `"Sanaa Through My Lens" <${smtpUser}>`,
              to: subscriber.email,
              subject: campaign.subject,
              html: htmlContent,
            });
            sentCount++;
          } catch (emailError) {
            console.error(`Failed to send to ${subscriber.email}:`, emailError);
          }
        })
      );

      // Delay between batches (500ms)
      if (i + batchSize < subscribers.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    await db.emailCampaign.update({
      where: { id },
      data: {
        status: "SENT",
        sentAt: new Date(),
        recipientCount: sentCount,
      },
    });

    return NextResponse.json({
      message: "Campaign sent successfully",
      recipientCount: sentCount,
    });
  } catch (error) {
    console.error("Send campaign error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
