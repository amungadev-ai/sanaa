import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/auth-helpers";
import { sendPushToUser } from "@/lib/web-push-server";
import { db } from "@/lib/db";
import { z } from "zod";

const createCommentSchema = z.object({
  content: z.string().min(1, "Comment content is required"),
  postId: z.string().min(1, "Post ID is required"),
  parentId: z.string().optional(),
});

// GET: List comments (filtered by status, post) — ADMIN+
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session.user.role, "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status") || undefined;
    const postId = searchParams.get("postId") || undefined;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (postId) where.postId = postId;

    const [comments, total] = await Promise.all([
      db.comment.findMany({
        where,
        include: {
          author: { select: { id: true, name: true, username: true, image: true } },
          post: { select: { id: true, title: true, slug: true } },
          moderatedBy: { select: { id: true, name: true } },
          _count: { select: { replies: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.comment.count({ where }),
    ]);

    return NextResponse.json({
      comments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("List comments error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Create comment (any authenticated user)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = createCommentSchema.parse(body);

    // Check post exists and allows comments
    const post = await db.post.findUnique({ where: { id: validated.postId } });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (!post.allowComments) {
      return NextResponse.json(
        { error: "Comments are disabled for this post" },
        { status: 400 }
      );
    }

    if (post.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "Cannot comment on unpublished posts" },
        { status: 400 }
      );
    }

    // Check parent comment exists if replying
    if (validated.parentId) {
      const parentComment = await db.comment.findUnique({
        where: { id: validated.parentId },
      });
      if (!parentComment || parentComment.postId !== validated.postId) {
        return NextResponse.json(
          { error: "Parent comment not found" },
          { status: 404 }
        );
      }
    }

    const comment = await db.comment.create({
      data: {
        content: validated.content,
        postId: validated.postId,
        authorId: session.user.id,
        parentId: validated.parentId,
        status: "PENDING",
      },
      include: {
        author: { select: { id: true, name: true, username: true, image: true } },
      },
    });

    // If this is a reply, send push notification to the parent comment author
    if (validated.parentId) {
      try {
        const parentComment = await db.comment.findUnique({
          where: { id: validated.parentId },
          select: { authorId: true },
        });
        if (parentComment && parentComment.authorId !== session.user.id) {
          await sendPushToUser(parentComment.authorId, {
            title: "New Reply",
            body: `${session.user.name || "Someone"} replied to your comment`,
            url: `/posts/${post.slug}`,
            type: "comment_reply",
          });
        }
      } catch (pushError) {
        console.error("Failed to send push notification for comment reply:", pushError);
      }
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Create comment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
