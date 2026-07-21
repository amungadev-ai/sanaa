import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

// GET: Return calendar data for a given month
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
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString());

    // Calculate month boundaries
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1); // First day of next month

    // Fetch scheduled posts
    const scheduledPosts = await db.post.findMany({
      where: {
        scheduledAt: {
          gte: startDate,
          lt: endDate,
        },
        status: { in: ["SCHEDULED", "PENDING_REVIEW", "APPROVED", "DRAFT"] },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        scheduledAt: true,
      },
    });

    // Fetch published posts
    const publishedPosts = await db.post.findMany({
      where: {
        publishedAt: {
          gte: startDate,
          lt: endDate,
        },
        status: "PUBLISHED",
      },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        publishedAt: true,
      },
    });

    // Fetch events
    const events = await db.event.findMany({
      where: {
        startDate: {
          lt: endDate,
        },
        endDate: {
          gte: startDate,
        },
        isActive: true,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        startDate: true,
        endDate: true,
        eventType: true,
        city: true,
      },
    });

    // Format calendar items
    const items = [
      ...scheduledPosts.map((post) => ({
        id: post.id,
        title: post.title,
        date: post.scheduledAt!.toISOString(),
        type: "post_scheduled" as const,
        status: post.status,
        color: "#f59e0b", // amber
        href: `/dashboard/posts/${post.id}/edit`,
      })),
      ...publishedPosts.map((post) => ({
        id: post.id,
        title: post.title,
        date: post.publishedAt!.toISOString(),
        type: "post_published" as const,
        status: post.status,
        color: "#d97706", // orange
        href: `/dashboard/posts/${post.id}/edit`,
      })),
      ...events.map((event) => ({
        id: event.id,
        title: event.title,
        date: event.startDate.toISOString(),
        type: "event" as const,
        status: "ACTIVE",
        color: "#e11d48", // rose
        href: `/dashboard/events`,
      })),
    ];

    // Mini stats
    const postsThisMonth = publishedPosts.length + scheduledPosts.length;
    const eventsThisMonth = events.length;
    const pendingReviews = await db.post.count({
      where: { status: "PENDING_REVIEW" },
    });

    return NextResponse.json({
      items,
      stats: {
        postsThisMonth,
        eventsThisMonth,
        pendingReviews,
      },
    });
  } catch (error) {
    console.error("Calendar data error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
