import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const addItemSchema = z.object({
  postId: z.string().min(1, "Post ID is required"),
  note: z.string().max(300, "Note too long").optional(),
});

const removeItemSchema = z.object({
  postId: z.string().min(1, "Post ID is required"),
});

// POST: Add a post to a reading list (owner only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const list = await db.readingList.findUnique({ where: { id } });
    if (!list) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    if (list.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validated = addItemSchema.parse(body);

    // Check post exists
    const post = await db.post.findUnique({ where: { id: validated.postId } });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check for duplicate
    const existing = await db.readingListItem.findUnique({
      where: {
        readingListId_postId: {
          readingListId: id,
          postId: validated.postId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Post already in this list" },
        { status: 409 }
      );
    }

    const item = await db.readingListItem.create({
      data: {
        readingListId: id,
        postId: validated.postId,
        note: validated.note || null,
      },
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
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Add to reading list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Remove a post from a reading list (owner only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const list = await db.readingList.findUnique({ where: { id } });
    if (!list) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    if (list.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validated = removeItemSchema.parse(body);

    const item = await db.readingListItem.findUnique({
      where: {
        readingListId_postId: {
          readingListId: id,
          postId: validated.postId,
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found in list" }, { status: 404 });
    }

    await db.readingListItem.delete({
      where: { id: item.id },
    });

    return NextResponse.json({ message: "Post removed from list" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Remove from reading list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
