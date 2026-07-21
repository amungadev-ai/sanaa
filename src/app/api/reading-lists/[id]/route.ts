import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const updateListSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  isPublic: z.boolean().optional(),
});

// GET: Get a single reading list with items
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const skip = (page - 1) * limit;

    const list = await db.readingList.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, username: true, image: true } },
        items: {
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
        },
        _count: { select: { items: true } },
      },
    });

    if (!list) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    // Private lists are only visible to the owner
    if (!list.isPublic && (!session?.user?.id || session.user.id !== list.userId)) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    return NextResponse.json({
      list: {
        id: list.id,
        name: list.name,
        description: list.description,
        isPublic: list.isPublic,
        slug: list.slug,
        user: list.user,
        createdAt: list.createdAt,
        updatedAt: list.updatedAt,
        items: list.items.map((item) => ({
          id: item.id,
          note: item.note,
          createdAt: item.createdAt,
          post: item.post,
        })),
        pagination: {
          page,
          limit,
          total: list._count.items,
          totalPages: Math.ceil(list._count.items / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get reading list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH: Update a reading list (owner only)
export async function PATCH(
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
    const validated = updateListSchema.parse(body);

    // If name is being changed, check for duplicate name
    if (validated.name && validated.name !== list.name) {
      const existingName = await db.readingList.findFirst({
        where: { userId: session.user.id, name: validated.name, id: { not: id } },
      });
      if (existingName) {
        return NextResponse.json(
          { error: "You already have a list with this name" },
          { status: 409 }
        );
      }
    }

    const updated = await db.readingList.update({
      where: { id },
      data: {
        ...(validated.name !== undefined && { name: validated.name }),
        ...(validated.description !== undefined && { description: validated.description }),
        ...(validated.isPublic !== undefined && { isPublic: validated.isPublic }),
      },
      include: {
        _count: { select: { items: true } },
      },
    });

    return NextResponse.json({
      list: {
        id: updated.id,
        name: updated.name,
        description: updated.description,
        isPublic: updated.isPublic,
        slug: updated.slug,
        itemCount: updated._count.items,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Update reading list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a reading list (owner only)
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

    await db.readingList.delete({ where: { id } });

    return NextResponse.json({ message: "List deleted successfully" });
  } catch (error) {
    console.error("Delete reading list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
