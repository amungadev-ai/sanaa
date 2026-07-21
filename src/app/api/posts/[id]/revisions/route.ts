import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const createRevisionSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  changeNote: z.string().optional(),
});

// GET: List revisions for a post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const post = await db.post.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const [revisions, total] = await Promise.all([
      db.postRevision.findMany({
        where: { postId: id },
        include: {
          author: { select: { id: true, name: true, username: true, image: true } },
        },
        orderBy: { version: "desc" },
        skip,
        take: limit,
      }),
      db.postRevision.count({ where: { postId: id } }),
    ]);

    return NextResponse.json({
      revisions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("List revisions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Create new revision
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const post = await db.post.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const body = await request.json();
    const validated = createRevisionSchema.parse(body);

    const latestRevision = await db.postRevision.findFirst({
      where: { postId: id },
      orderBy: { version: "desc" },
    });

    const nextVersion = (latestRevision?.version || 0) + 1;

    const revision = await db.postRevision.create({
      data: {
        postId: id,
        title: validated.title,
        content: validated.content,
        changeNote: validated.changeNote || `Version ${nextVersion}`,
        version: nextVersion,
        authorId: session.user.id,
      },
      include: {
        author: { select: { id: true, name: true, username: true } },
      },
    });

    return NextResponse.json(revision, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Create revision error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
