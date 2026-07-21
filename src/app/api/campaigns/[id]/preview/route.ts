import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

// GET: Return rendered HTML preview of the campaign
export async function GET(
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

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${campaign.subject} — Preview</title>
      </head>
      <body style="margin: 0; padding: 20px; background: #f5f5f5; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <div style="background: #f97316; padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 22px; letter-spacing: 1px;">Sanaa Through My Lens</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Art Through My Lens</p>
          </div>
          ${campaign.preheader ? `<div style="padding: 12px 24px; background: #fff7ed; font-size: 13px; color: #92400e; font-style: italic;">${campaign.preheader}</div>` : ''}
          <div style="padding: 24px;">
            ${campaign.content}
          </div>
          <div style="padding: 16px 24px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #eee;">
            <p style="margin: 0;">This is a preview of your email campaign.</p>
            <p style="margin: 4px 0 0;">Sent from <strong>Sanaa Through My Lens</strong> · Nairobi, Kenya</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Preview campaign error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
