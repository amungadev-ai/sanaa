import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission, generateSlug } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { z } from "zod";

const createTagSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

// GET: List tags
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || undefined;

    const where: Record<string, unknown> = {};
    if (search) {
      where.name = { contains: search };
    }

    const tags = await db.tag.findMany({
      where,
      include: {
        _count: { select: { posts: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(tags);
  } catch (error) {
    console.error("List tags error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Create tag — EDITOR+
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
    const validated = createTagSchema.parse(body);

    const slug = generateSlug(validated.name);

    const existing = await db.tag.findFirst({
      where: { OR: [{ name: validated.name }, { slug }] },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Tag with this name already exists" },
        { status: 409 }
      );
    }

    const tag = await db.tag.create({
      data: { name: validated.name, slug },
    });

    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Create tag error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
