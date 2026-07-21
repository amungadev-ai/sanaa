import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

// GET: Return counts (total posts, comments, users, events, pending reviews, etc.)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session.user.role, "READER")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [
      totalPosts,
      publishedPosts,
      draftPosts,
      pendingReviewPosts,
      approvedPosts,
      totalComments,
      pendingComments,
      totalUsers,
      totalEvents,
      totalCategories,
      totalTags,
      totalSubscribers,
      totalMedia,
    ] = await Promise.all([
      db.post.count(),
      db.post.count({ where: { status: "PUBLISHED" } }),
      db.post.count({ where: { status: "DRAFT" } }),
      db.post.count({ where: { status: "PENDING_REVIEW" } }),
      db.post.count({ where: { status: "APPROVED" } }),
      db.comment.count(),
      db.comment.count({ where: { status: "PENDING" } }),
      db.user.count({ where: { isActive: true } }),
      db.event.count({ where: { isActive: true } }),
      db.category.count({ where: { isActive: true } }),
      db.tag.count(),
      db.newsletterSubscriber.count({ where: { status: "ACTIVE" } }),
      db.media.count(),
    ]);

    // Recent posts (last 5)
    const recentPosts = await db.post.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        createdAt: true,
        author: { select: { name: true } },
      },
    });

    // Recent comments (last 5)
    const recentComments = await db.comment.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      where: { status: "PENDING" },
      select: {
        id: true,
        content: true,
        createdAt: true,
        author: { select: { name: true, image: true } },
        post: { select: { id: true, title: true, slug: true } },
      },
    });

    // Upcoming events (next 5)
    const upcomingEvents = await db.event.findMany({
      take: 5,
      where: {
        isActive: true,
        startDate: { gte: new Date().toISOString() },
      },
      orderBy: { startDate: "asc" },
      select: {
        id: true,
        title: true,
        slug: true,
        startDate: true,
        city: true,
        eventType: true,
      },
    });

    return NextResponse.json({
      // Flat properties for frontend compatibility
      totalPosts,
      publishedPosts,
      draftPosts,
      pendingPosts: pendingReviewPosts,
      approvedPosts,
      totalComments,
      pendingComments,
      totalUsers,
      totalEvents,
      upcomingEvents: upcomingEvents.length,
      totalCategories,
      totalTags,
      totalSubscribers,
      totalMedia,
      // Nested counts object (legacy)
      counts: {
        totalPosts,
        publishedPosts,
        draftPosts,
        pendingReviewPosts,
        approvedPosts,
        totalComments,
        pendingComments,
        totalUsers,
        totalEvents,
        totalCategories,
        totalTags,
        totalSubscribers,
        totalMedia,
      },
      recentPosts,
      recentComments,
      upcomingEvents,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
