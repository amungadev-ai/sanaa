import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

// GET: Post-level analytics (views over time for a specific post)
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
    const postId = searchParams.get("postId");

    if (!postId) {
      return NextResponse.json({ error: "postId is required" }, { status: 400 });
    }

    const post = await db.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        title: true,
        slug: true,
        views: true,
        status: true,
        publishedAt: true,
        createdAt: true,
        author: { select: { name: true } },
        categories: {
          include: {
            category: { select: { name: true, slug: true } },
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Page views for this post's path over last 30 days
    const postPath = `/posts/${post.slug}`;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const pageViewsForPost = await db.pageView.findMany({
      where: {
        path: { contains: post.slug },
        createdAt: { gte: thirtyDaysAgo },
      },
      orderBy: { createdAt: "asc" },
    });

    // Group by day
    const viewsByDay: Record<string, number> = {};
    for (const pv of pageViewsForPost) {
      const day = pv.createdAt.toISOString().slice(0, 10);
      viewsByDay[day] = (viewsByDay[day] || 0) + 1;
    }

    // Fill in missing days
    const viewsOverTime: { date: string; views: number }[] = [];
    for (let i = 30; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().slice(0, 10);
      viewsOverTime.push({
        date: dayStr,
        views: viewsByDay[dayStr] || 0,
      });
    }

    // Referrers for this post
    const referrerData = await db.pageView.findMany({
      where: {
        path: { contains: post.slug },
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
        referrerCounts[row.referrer] = (referrerCounts[row.referrer] || 0) + 1;
      }
    }

    const topReferrers = Object.entries(referrerCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([host, count]) => ({ referrer: host, views: count }));

    return NextResponse.json({
      post,
      viewsOverTime,
      totalViews: post.views,
      topReferrers,
      totalPageViewRecords: pageViewsForPost.length,
    });
  } catch (error) {
    console.error("Analytics posts error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
