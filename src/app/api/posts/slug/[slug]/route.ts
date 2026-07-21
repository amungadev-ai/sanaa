import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET: Fetch post by slug (public, published only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const post = await db.post.findUnique({
      where: { slug },
      include: {
        author: {
          select: { id: true, name: true, username: true, image: true, bio: true },
        },
        categories: {
          include: { category: { select: { id: true, name: true, slug: true, color: true } } },
        },
        tags: {
          include: { tag: { select: { id: true, name: true, slug: true } } },
        },
        _count: {
          select: { comments: true, bookmarks: true },
        },
      },
    });

    if (!post || post.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Increment view count
    await db.post.update({
      where: { id: post.id },
      data: { views: { increment: 1 } },
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error("Get post by slug error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
