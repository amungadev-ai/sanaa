import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission, generateUniqueSlug } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { z } from "zod";

const createEventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  excerpt: z.string().optional(),
  coverImage: z.string().optional(),
  eventType: z.enum(["IN_PERSON", "VIRTUAL", "HYBRID"]).default("IN_PERSON"),
  venue: z.string().optional(),
  location: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  timezone: z.string().default("Africa/Nairobi"),
  websiteUrl: z.string().optional(),
  ticketUrl: z.string().optional(),
  isFree: z.boolean().optional().default(false),
  price: z.string().optional(),
  isFeatured: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
  categoryIds: z.array(z.string()).optional(),
});

// GET: List events (paginated, filtered by date, city, category)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const city = searchParams.get("city") || undefined;
    const categoryId = searchParams.get("categoryId") || undefined;
    const upcoming = searchParams.get("upcoming") === "true";
    const search = searchParams.get("search") || undefined;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { isActive: true };

    if (city) where.city = city;
    if (upcoming) {
      where.startDate = { gte: new Date().toISOString() };
    }
    if (categoryId) {
      where.categories = { some: { categoryId } };
    }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { venue: { contains: search } },
        { city: { contains: search } },
      ];
    }

    const [events, total] = await Promise.all([
      db.event.findMany({
        where,
        include: {
          categories: {
            include: { category: { select: { id: true, name: true, slug: true, color: true } } },
          },
        },
        orderBy: { startDate: "asc" },
        skip,
        take: limit,
      }),
      db.event.count({ where }),
    ]);

    return NextResponse.json({
      events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("List events error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Create event — EDITOR+
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
    const validated = createEventSchema.parse(body);

    const slug = await generateUniqueSlug(validated.title, "Event");

    const event = await db.event.create({
      data: {
        title: validated.title,
        slug,
        description: validated.description,
        excerpt: validated.excerpt,
        coverImage: validated.coverImage,
        eventType: validated.eventType,
        venue: validated.venue,
        location: validated.location,
        city: validated.city,
        country: validated.country,
        latitude: validated.latitude,
        longitude: validated.longitude,
        startDate: new Date(validated.startDate),
        endDate: validated.endDate ? new Date(validated.endDate) : null,
        timezone: validated.timezone,
        websiteUrl: validated.websiteUrl,
        ticketUrl: validated.ticketUrl,
        isFree: validated.isFree ?? false,
        price: validated.price,
        isFeatured: validated.isFeatured ?? false,
        isActive: validated.isActive ?? true,
        categories: validated.categoryIds
          ? { create: validated.categoryIds.map((categoryId: string) => ({ categoryId })) }
          : undefined,
      },
      include: {
        categories: {
          include: { category: { select: { id: true, name: true, slug: true } } },
        },
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Create event error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
