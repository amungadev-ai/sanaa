import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { z } from "zod";

const ARTIST_TYPES = [
  "MUSICIAN", "WRITER", "PAINTER", "PHOTOGRAPHER", "FILMMAKER",
  "DANCER", "ACTOR", "SCULPTOR", "CURATOR", "DJ", "PRODUCER", "OTHER",
] as const;

const updateArtistSchema = z.object({
  name: z.string().min(1).optional(),
  stageName: z.string().nullable().optional(),
  bio: z.string().min(1).optional(),
  shortBio: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  coverImage: z.string().nullable().optional(),
  websiteUrl: z.string().nullable().optional(),
  socialLinks: z.string().nullable().optional(),
  artistType: z.enum(ARTIST_TYPES).optional(),
  location: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  categoryIds: z.array(z.string()).optional(),
  postIds: z.array(z.string()).optional(),
  eventIds: z.array(z.string()).optional(),
});

// GET: Get artist by ID with categories, posts, events
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const artist = await db.artist.findUnique({
      where: { id },
      include: {
        categories: {
          include: { category: { select: { id: true, name: true, slug: true, color: true } } },
        },
        posts: {
          include: {
            post: {
              select: {
                id: true, title: true, slug: true, featuredImage: true,
                excerpt: true, publishedAt: true, status: true,
              },
            },
          },
        },
        events: {
          include: {
            event: {
              select: {
                id: true, title: true, slug: true, startDate: true,
                coverImage: true, city: true, country: true,
              },
            },
          },
        },
      },
    });

    if (!artist) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    }

    return NextResponse.json(artist);
  } catch (error) {
    console.error("Get artist error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH: Update artist — EDITOR+ only
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session.user.role, "EDITOR")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const validated = updateArtistSchema.parse(body);

    const existing = await db.artist.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    }

    const { categoryIds, postIds, eventIds, ...artistData } = validated;

    const updateData: Record<string, unknown> = { ...artistData };

    // Update slug if name changed
    if (validated.name && validated.name !== existing.name) {
      const baseSlug = validated.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      const slugExisting = await db.artist.findFirst({
        where: { slug: baseSlug, NOT: { id } },
      });
      updateData.slug = slugExisting ? `${baseSlug}-${Date.now()}` : baseSlug;
    }

    // Update categories if provided
    if (categoryIds) {
      await db.artistCategory.deleteMany({ where: { artistId: id } });
      if (categoryIds.length > 0) {
        await db.artistCategory.createMany({
          data: categoryIds.map((categoryId: string) => ({ artistId: id, categoryId })),
        });
      }
    }

    // Update posts if provided
    if (postIds) {
      await db.artistPost.deleteMany({ where: { artistId: id } });
      if (postIds.length > 0) {
        await db.artistPost.createMany({
          data: postIds.map((postId: string) => ({ artistId: id, postId })),
        });
      }
    }

    // Update events if provided
    if (eventIds) {
      await db.artistEvent.deleteMany({ where: { artistId: id } });
      if (eventIds.length > 0) {
        await db.artistEvent.createMany({
          data: eventIds.map((eventId: string) => ({ artistId: id, eventId })),
        });
      }
    }

    const artist = await db.artist.update({
      where: { id },
      data: updateData,
      include: {
        categories: {
          include: { category: { select: { id: true, name: true, slug: true } } },
        },
        posts: {
          include: { post: { select: { id: true, title: true, slug: true } } },
        },
        events: {
          include: { event: { select: { id: true, title: true, slug: true } } },
        },
      },
    });

    return NextResponse.json(artist);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Update artist error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Delete artist — ADMIN+ only
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session.user.role, "ADMIN")) {
      return NextResponse.json({ error: "Forbidden — Admin role required" }, { status: 403 });
    }

    const { id } = await params;

    const existing = await db.artist.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    }

    await db.artist.delete({ where: { id } });

    return NextResponse.json({ message: "Artist deleted successfully" });
  } catch (error) {
    console.error("Delete artist error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
