import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST: Record a page view
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path, referrer } = body;

    if (!path || typeof path !== "string") {
      return NextResponse.json({ error: "Path is required" }, { status: 400 });
    }

    // Skip tracking for dashboard, API, and auth routes
    if (
      path.startsWith("/dashboard") ||
      path.startsWith("/api") ||
      path.startsWith("/auth") ||
      path.startsWith("/_next")
    ) {
      return NextResponse.json({ tracked: false, reason: "excluded" });
    }

    // Get IP and user agent
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0]?.trim() : request.headers.get("x-real-ip") || null;
    const userAgent = request.headers.get("user-agent") || null;

    // Create the page view record
    await db.pageView.create({
      data: {
        path,
        referrer: referrer || null,
        userAgent,
        ip,
      },
    });

    // Update daily stat
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Try to upsert daily stat
    try {
      const existingStat = await db.dailyStat.findUnique({
        where: { date: today },
      });

      if (existingStat) {
        // Get unique IPs for today so far
        const todayStart = today;
        const uniqueIps = await db.pageView.findMany({
          where: {
            createdAt: { gte: todayStart },
            ip: { not: null },
          },
          select: { ip: true },
          distinct: ["ip"],
        });

        await db.dailyStat.update({
          where: { date: today },
          data: {
            pageViews: { increment: 1 },
            uniqueVisitors: uniqueIps.length,
          },
        });
      } else {
        // Create new daily stat
        // Find top post for today
        const topPostToday = await db.post.findFirst({
          where: {
            status: "PUBLISHED",
            publishedAt: { gte: today },
          },
          orderBy: { views: "desc" },
          select: { id: true },
        });

        await db.dailyStat.create({
          data: {
            date: today,
            pageViews: 1,
            uniqueVisitors: ip ? 1 : 0,
            topPostId: topPostToday?.id || null,
          },
        });
      }
    } catch (statError) {
      // Don't fail the tracking request if stat update fails
      console.error("Daily stat update error:", statError);
    }

    return NextResponse.json({ tracked: true });
  } catch (error) {
    console.error("Analytics track error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
