import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { z } from "zod";

const moderateCommentSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "SPAM"]),
});

// PATCH: Approve/Reject/Spam comment — ADMIN+
export async function PATCH(
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
    const body = await request.json();
    const validated = moderateCommentSchema.parse(body);

    const existing = await db.comment.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    const comment = await db.comment.update({
      where: { id },
      data: {
        status: validated.status,
        moderatedById: session.user.id,
      },
      include: {
        author: { select: { id: true, name: true, username: true } },
        moderatedBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(comment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Moderate comment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Delete comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await db.comment.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Author can delete own comment, admin+ can delete any
    const isAuthor = existing.authorId === session.user.id;
    const canModerate = hasPermission(session.user.role, "ADMIN");

    if (!isAuthor && !canModerate) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.comment.delete({ where: { id } });

    return NextResponse.json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Delete comment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
