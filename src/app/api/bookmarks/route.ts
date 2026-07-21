import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const addBookmarkSchema = z.object({
  postId: z.string().min(1, "Post ID is required"),
});

// GET: List user bookmarks
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const [bookmarks, total] = await Promise.all([
      db.bookmark.findMany({
        where: { userId: session.user.id },
        include: {
          post: {
            select: {
              id: true,
              title: true,
              slug: true,
              excerpt: true,
              featuredImage: true,
              publishedAt: true,
              readingTime: true,
              author: { select: { id: true, name: true, username: true, image: true } },
              categories: {
                include: { category: { select: { id: true, name: true, slug: true, color: true } } },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.bookmark.count({ where: { userId: session.user.id } }),
    ]);

    return NextResponse.json({
      bookmarks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("List bookmarks error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Add bookmark
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = addBookmarkSchema.parse(body);

    // Check post exists
    const post = await db.post.findUnique({ where: { id: validated.postId } });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check for duplicate
    const existing = await db.bookmark.findUnique({
      where: {
        userId_postId: {
          userId: session.user.id,
          postId: validated.postId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Post already bookmarked" },
        { status: 409 }
      );
    }

    const bookmark = await db.bookmark.create({
      data: {
        userId: session.user.id,
        postId: validated.postId,
      },
    });

    return NextResponse.json(bookmark, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Add bookmark error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
