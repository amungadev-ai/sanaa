import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET: Fetch user by username (public profile)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    const user = await db.user.findUnique({
      where: { username },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        bio: true,
        createdAt: true,
        _count: {
          select: { posts: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get published posts by this user
    const posts = await db.post.findMany({
      where: { authorId: user.id, status: "PUBLISHED" },
      include: {
        author: {
          select: { id: true, name: true, username: true, image: true },
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
      orderBy: { publishedAt: "desc" },
    });

    return NextResponse.json({ ...user, posts });
  } catch (error) {
    console.error("Get user by username error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
