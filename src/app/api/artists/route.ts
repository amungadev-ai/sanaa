import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission, generateUniqueSlug } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { z } from "zod";

const ARTIST_TYPES = [
  "MUSICIAN", "WRITER", "PAINTER", "PHOTOGRAPHER", "FILMMAKER",
  "DANCER", "ACTOR", "SCULPTOR", "CURATOR", "DJ", "PRODUCER", "OTHER",
] as const;

const createArtistSchema = z.object({
  name: z.string().min(1, "Name is required"),
  stageName: z.string().optional(),
  bio: z.string().min(1, "Bio is required"),
  shortBio: z.string().optional(),
  image: z.string().optional(),
  coverImage: z.string().optional(),
  websiteUrl: z.string().optional(),
  socialLinks: z.string().optional(), // JSON string
  artistType: z.enum(ARTIST_TYPES),
  location: z.string().optional(),
  country: z.string().optional(),
  isActive: z.boolean().optional().default(true),
  isFeatured: z.boolean().optional().default(false),
  categoryIds: z.array(z.string()).optional(),
  postIds: z.array(z.string()).optional(),
  eventIds: z.array(z.string()).optional(),
});

// GET: List artists (paginated, filterable by artistType, featured, search)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const artistType = searchParams.get("artistType") || undefined;
    const isFeatured = searchParams.get("featured") === "true" ? true : undefined;
    const search = searchParams.get("search") || undefined;
    const country = searchParams.get("country") || undefined;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { isActive: true };

    if (artistType) where.artistType = artistType;
    if (isFeatured !== undefined) where.isFeatured = isFeatured;
    if (country) where.country = country;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { stageName: { contains: search } },
        { shortBio: { contains: search } },
        { location: { contains: search } },
      ];
    }

    const [artists, total] = await Promise.all([
      db.artist.findMany({
        where,
        include: {
          categories: {
            include: { category: { select: { id: true, name: true, slug: true, color: true } } },
          },
        },
        orderBy: [
          { isFeatured: "desc" },
          { name: "asc" },
        ],
        skip,
        take: limit,
      }),
      db.artist.count({ where }),
    ]);

    return NextResponse.json({
      artists,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("List artists error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Create artist — EDITOR+ only
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session.user.role, "EDITOR")) {
      return NextResponse.json({ error: "Forbidden — Editor role required" }, { status: 403 });
    }

    const body = await request.json();
    const validated = createArtistSchema.parse(body);

    const slug = await generateUniqueSlug(validated.name, "Artist");

    const artist = await db.artist.create({
      data: {
        name: validated.name,
        slug,
        stageName: validated.stageName,
        bio: validated.bio,
        shortBio: validated.shortBio,
        image: validated.image,
        coverImage: validated.coverImage,
        websiteUrl: validated.websiteUrl,
        socialLinks: validated.socialLinks,
        artistType: validated.artistType,
        location: validated.location,
        country: validated.country,
        isActive: validated.isActive ?? true,
        isFeatured: validated.isFeatured ?? false,
        categories: validated.categoryIds
          ? { create: validated.categoryIds.map((categoryId: string) => ({ categoryId })) }
          : undefined,
        posts: validated.postIds
          ? { create: validated.postIds.map((postId: string) => ({ postId })) }
          : undefined,
        events: validated.eventIds
          ? { create: validated.eventIds.map((eventId: string) => ({ eventId })) }
          : undefined,
      },
      include: {
        categories: {
          include: { category: { select: { id: true, name: true, slug: true } } },
        },
        posts: {
          include: { post: { select: { id: true, title: true, slug: true, featuredImage: true, publishedAt: true } } },
        },
        events: {
          include: { event: { select: { id: true, title: true, slug: true, startDate: true, coverImage: true } } },
        },
      },
    });

    return NextResponse.json(artist, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Create artist error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
