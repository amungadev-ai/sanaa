import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { z } from "zod";

const createAdSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  imageUrl: z.string().min(1, "Image URL is required"),
  linkUrl: z.string().min(1, "Link URL is required"),
  placement: z.enum(["HEADER_BANNER", "SIDEBAR", "IN_ARTICLE", "FOOTER", "BETWEEN_POSTS"]).default("SIDEBAR"),
  status: z.enum(["ACTIVE", "PAUSED", "EXPIRED", "DRAFT"]).default("DRAFT"),
  startDate: z.string(),
  endDate: z.string().optional(),
});

// GET: List ads (filtered by placement, status)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const placement = searchParams.get("placement") || undefined;
    const status = searchParams.get("status") || undefined;
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    const where: Record<string, unknown> = {};
    if (placement) where.placement = placement;
    if (status) where.status = status;

    // Public: only show active ads; admin can see all
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !hasPermission(session.user.role, "ADMIN")) {
      where.status = "ACTIVE";
    }

    const ads = await db.ad.findMany({
      where,
      orderBy: { createdAt: "desc" },
      ...(limit && limit > 0 ? { take: limit } : {}),
    });

    return NextResponse.json(ads);
  } catch (error) {
    console.error("List ads error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Create ad — ADMIN+
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session.user.role, "ADMIN")) {
      return NextResponse.json({ error: "Forbidden — Admin role required" }, { status: 403 });
    }

    const body = await request.json();
    const validated = createAdSchema.parse(body);

    const ad = await db.ad.create({
      data: {
        title: validated.title,
        description: validated.description,
        imageUrl: validated.imageUrl,
        linkUrl: validated.linkUrl,
        placement: validated.placement,
        status: validated.status,
        startDate: new Date(validated.startDate),
        endDate: validated.endDate ? new Date(validated.endDate) : null,
      },
    });

    return NextResponse.json(ad, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Create ad error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
