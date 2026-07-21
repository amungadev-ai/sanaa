import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET: Track email opens and clicks
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaignId");
    const type = searchParams.get("type"); // "open" or "click"
    const url = searchParams.get("url");

    if (!campaignId || !type) {
      // Return transparent PNG even for invalid requests to avoid errors in email clients
      const transparentPng = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "base64"
      );
      return new Response(transparentPng, {
        headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
      });
    }

    const campaign = await db.emailCampaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      const transparentPng = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "base64"
      );
      return new Response(transparentPng, {
        headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
      });
    }

    if (type === "open") {
      // Increment open count
      await db.emailCampaign.update({
        where: { id: campaignId },
        data: { openCount: { increment: 1 } },
      });

      // Return 1x1 transparent PNG
      const transparentPng = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "base64"
      );
      return new Response(transparentPng, {
        headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
      });
    }

    if (type === "click") {
      // Increment click count
      await db.emailCampaign.update({
        where: { id: campaignId },
        data: { clickCount: { increment: 1 } },
      });

      // Redirect to the original URL
      if (url) {
        return NextResponse.redirect(decodeURIComponent(url), 302);
      }

      // Fallback: return transparent PNG if no URL provided
      const transparentPng = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "base64"
      );
      return new Response(transparentPng, {
        headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
      });
    }

    // Unknown type — return transparent PNG
    const transparentPng = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64"
    );
    return new Response(transparentPng, {
      headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Campaign tracking error:", error);
    // Always return an image to avoid breaking email clients
    const transparentPng = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64"
    );
    return new Response(transparentPng, {
      headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
    });
  }
}
