import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

// GET: Analytics overview for dashboard
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session.user.role, "EDITOR")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get("days") || "30");
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Total page views (last N days)
    const totalPageViews = await db.pageView.count({
      where: { createdAt: { gte: startDate } },
    });

    // Unique visitors (last N days) — based on distinct IPs
    const uniqueVisitorRows = await db.pageView.findMany({
      where: {
        createdAt: { gte: startDate },
        ip: { not: null },
      },
      select: { ip: true },
      distinct: ["ip"],
    });
    const uniqueVisitors = uniqueVisitorRows.length;

    // Page views trend (daily for last 14 days or requested days)
    const trendDays = Math.min(days, 14);
    const trendStartDate = new Date(now);
    trendStartDate.setDate(trendStartDate.getDate() - trendDays);
    trendStartDate.setHours(0, 0, 0, 0);

    const dailyStats = await db.dailyStat.findMany({
      where: { date: { gte: trendStartDate } },
      orderBy: { date: "asc" },
    });

    // Fill in missing days with zero
    const viewsTrend: { date: string; views: number }[] = [];
    for (let i = trendDays; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const stat = dailyStats.find(
        (s) => s.date.toISOString().slice(0, 10) === d.toISOString().slice(0, 10)
      );
      viewsTrend.push({
        date: d.toISOString().slice(0, 10),
        views: stat?.pageViews || 0,
      });
    }

    // Top 10 posts by views
    const topPosts = await db.post.findMany({
      where: {
        status: "PUBLISHED",
        views: { gt: 0 },
      },
      orderBy: { views: "desc" },
      take: 10,
      select: {
        id: true,
        title: true,
        slug: true,
        views: true,
        publishedAt: true,
        author: { select: { name: true } },
      },
    });

    // Views by category breakdown
    const categoriesWithViews = await db.category.findMany({
      where: { isActive: true },
      include: {
        posts: {
          include: {
            post: {
              select: { views: true, status: true },
            },
          },
        },
      },
    });

    const viewsByCategory = categoriesWithViews
      .map((cat) => {
        const totalViews = cat.posts.reduce((sum, pc) => {
          if (pc.post.status === "PUBLISHED") {
            return sum + pc.post.views;
          }
          return sum;
        }, 0);
        return {
          category: cat.name,
          views: totalViews,
          color: cat.color,
        };
      })
      .filter((c) => c.views > 0)
      .sort((a, b) => b.views - a.views);

    // Top referrers
    const referrerData = await db.pageView.findMany({
      where: {
        createdAt: { gte: startDate },
        referrer: { not: null },
      },
      select: { referrer: true },
    });

    const referrerCounts: Record<string, number> = {};
    for (const row of referrerData) {
      if (!row.referrer) continue;
      try {
        const url = new URL(row.referrer);
        const host = url.hostname.replace(/^www\./, "");
        referrerCounts[host] = (referrerCounts[host] || 0) + 1;
      } catch {
        // Invalid URL, skip
        referrerCounts[row.referrer] = (referrerCounts[row.referrer] || 0) + 1;
      }
    }

    const topReferrers = Object.entries(referrerCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([host, count]) => ({ referrer: host, views: count }));

    // Average daily views
    const avgDailyViews = days > 0 ? Math.round(totalPageViews / days) : 0;

    // Top post overall
    const topPost = topPosts[0] || null;

    return NextResponse.json({
      totalPageViews,
      uniqueVisitors,
      avgDailyViews,
      topPost: topPost
        ? { id: topPost.id, title: topPost.title, views: topPost.views }
        : null,
      viewsTrend,
      topPosts,
      viewsByCategory,
      topReferrers,
    });
  } catch (error) {
    console.error("Analytics overview error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
