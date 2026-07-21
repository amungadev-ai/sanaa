import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET: Fetch artist by slug (for public pages)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const artist = await db.artist.findUnique({
      where: { slug },
      include: {
        categories: {
          include: { category: { select: { id: true, name: true, slug: true, color: true } } },
        },
        posts: {
          include: {
            post: {
              select: {
                id: true, title: true, slug: true, featuredImage: true,
                excerpt: true, publishedAt: true, status: true, readingTime: true,
                author: { select: { id: true, name: true, username: true } },
                categories: {
                  include: { category: { select: { id: true, name: true, slug: true, color: true } } },
                },
              },
            },
          },
        },
        events: {
          include: {
            event: {
              select: {
                id: true, title: true, slug: true, startDate: true, endDate: true,
                coverImage: true, city: true, country: true, venue: true,
                isFree: true, price: true,
              },
            },
          },
        },
      },
    });

    if (!artist || !artist.isActive) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    }

    return NextResponse.json(artist);
  } catch (error) {
    console.error("Get artist by slug error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
