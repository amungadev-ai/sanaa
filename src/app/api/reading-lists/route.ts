import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { generateUniqueSlug } from "@/lib/auth-helpers";

const createListSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  description: z.string().max(500, "Description too long").optional(),
  isPublic: z.boolean().optional(),
});

// GET: List user's reading lists or public lists
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const isPublicQuery = searchParams.get("public") === "true";

    if (isPublicQuery) {
      // Get public lists from any user
      const lists = await db.readingList.findMany({
        where: { isPublic: true },
        include: {
          user: { select: { id: true, name: true, username: true, image: true } },
          items: {
            take: 3,
            include: {
              post: { select: { id: true, featuredImage: true } },
            },
            orderBy: { createdAt: "desc" },
          },
          _count: { select: { items: true } },
        },
        orderBy: { updatedAt: "desc" },
      });

      return NextResponse.json({
        lists: lists.map((list) => ({
          id: list.id,
          name: list.name,
          description: list.description,
          isPublic: list.isPublic,
          slug: list.slug,
          itemCount: list._count.items,
          coverImages: list.items.map((item) => item.post.featuredImage).filter(Boolean),
          user: list.user,
          createdAt: list.createdAt,
          updatedAt: list.updatedAt,
        })),
      });
    }

    // Get user's own lists
    const lists = await db.readingList.findMany({
      where: { userId: session.user.id },
      include: {
        items: {
          take: 3,
          include: {
            post: { select: { id: true, featuredImage: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: { select: { items: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({
      lists: lists.map((list) => ({
        id: list.id,
        name: list.name,
        description: list.description,
        isPublic: list.isPublic,
        slug: list.slug,
        itemCount: list._count.items,
        coverImages: list.items.map((item) => item.post.featuredImage).filter(Boolean),
        createdAt: list.createdAt,
        updatedAt: list.updatedAt,
      })),
    });
  } catch (error) {
    console.error("List reading lists error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Create a new reading list
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // READER+ can create lists
    const roleHierarchy: Record<string, number> = {
      ADMIN: 3, EDITOR: 2, READER: 1,
    };
    const userLevel = roleHierarchy[session.user.role] ?? 0;
    if (userLevel < 1) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const validated = createListSchema.parse(body);

    // Generate unique slug
    const slug = await generateUniqueSlug(validated.name, "ReadingList");

    // Add user-specific suffix if slug collision with same user's lists' names
    const existingName = await db.readingList.findFirst({
      where: { userId: session.user.id, name: validated.name },
    });
    if (existingName) {
      return NextResponse.json(
        { error: "You already have a list with this name" },
        { status: 409 }
      );
    }

    const list = await db.readingList.create({
      data: {
        name: validated.name,
        description: validated.description || null,
        isPublic: validated.isPublic ?? false,
        slug,
        userId: session.user.id,
      },
      include: {
        _count: { select: { items: true } },
      },
    });

    return NextResponse.json({
      list: {
        id: list.id,
        name: list.name,
        description: list.description,
        isPublic: list.isPublic,
        slug: list.slug,
        itemCount: list._count.items,
        createdAt: list.createdAt,
        updatedAt: list.updatedAt,
      },
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Create reading list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
