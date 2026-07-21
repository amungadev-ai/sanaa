import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET: Public endpoint to list authors (users with content-creating roles)
// Used by the search page for the author filter
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || undefined;
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 20);

    const AUTHOR_ROLES = ["EDITOR", "ADMIN"];

    const where: Record<string, unknown> = {
      role: { in: AUTHOR_ROLES },
      isActive: true,
    };

    if (search && search.length >= 2) {
      where.OR = [
        { name: { contains: search } },
        { username: { contains: search } },
      ];
    }

    const authors = await db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        bio: true,
        role: true,
        _count: {
          select: { posts: true },
        },
      },
      orderBy: { name: "asc" },
      take: limit,
    });

    return NextResponse.json({
      authors: authors.map((a) => ({
        id: a.id,
        name: a.name,
        username: a.username,
        image: a.image,
        bio: a.bio,
        role: a.role,
        postCount: a._count.posts,
      })),
    });
  } catch (error) {
    console.error("List authors error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
