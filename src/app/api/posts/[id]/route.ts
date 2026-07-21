import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { z } from "zod";

const updatePostSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  excerpt: z.string().nullable().optional(),
  featuredImage: z.string().nullable().optional(),
  coverImageAlt: z.string().nullable().optional(),
  status: z.enum(["DRAFT", "PENDING_REVIEW", "APPROVED", "PUBLISHED", "SCHEDULED", "ARCHIVED", "SPONSORED_REVIEW", "REJECTED"]).optional(),
  isFeatured: z.boolean().optional(),
  isSponsored: z.boolean().optional(),
  allowComments: z.boolean().optional(),
  readingTime: z.number().optional(),
  seoTitle: z.string().nullable().optional(),
  seoDescription: z.string().nullable().optional(),
  ogImage: z.string().nullable().optional(),
  scheduledAt: z.string().nullable().optional(),
  categoryIds: z.array(z.string()).optional(),
  tagIds: z.array(z.string()).optional(),
});

// GET: Get single post with author, categories, tags
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    const post = await db.post.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, username: true, image: true, role: true },
        },
        reviewedBy: {
          select: { id: true, name: true, username: true },
        },
        categories: {
          include: { category: { select: { id: true, name: true, slug: true, color: true, icon: true } } },
        },
        tags: {
          include: { tag: { select: { id: true, name: true, slug: true } } },
        },
        _count: {
          select: { comments: true, bookmarks: true, revisions: true },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Non-authenticated or READER can only see PUBLISHED posts
    if (
      post.status !== "PUBLISHED" &&
      (!session?.user?.role || session.user.role === "READER") &&
      post.authorId !== session?.user?.id
    ) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Increment view count for published posts
    if (post.status === "PUBLISHED") {
      await db.post.update({
        where: { id },
        data: { views: { increment: 1 } },
      });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error("Get post error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH: Update post (author can edit own, editor+ can edit any)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validated = updatePostSchema.parse(body);

    const existingPost = await db.post.findUnique({ where: { id } });
    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Permission check: author can only edit own, editor+ can edit any
    const isAuthor = existingPost.authorId === session.user.id;
    const canEditAny = hasPermission(session.user.role, "EDITOR");

    if (!isAuthor && !canEditAny) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Authors can't change status directly (must go through review)
    if (isAuthor && !canEditAny && validated.status && validated.status !== "DRAFT" && validated.status !== "PENDING_REVIEW") {
      return NextResponse.json(
        { error: "Authors can only set status to DRAFT or PENDING_REVIEW" },
        { status: 403 }
      );
    }

    // Handle category/tag updates
    const { categoryIds, tagIds, ...postData } = validated;

    // If title changed, update slug
    let slug = existingPost.slug;
    if (validated.title && validated.title !== existingPost.title) {
      const baseSlug = validated.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      // Check uniqueness
      const existing = await db.post.findFirst({
        where: { slug: baseSlug, NOT: { id } },
      });
      slug = existing ? `${baseSlug}-${Date.now()}` : baseSlug;
    }

    const updateData: Record<string, unknown> = {
      ...postData,
      slug,
    };

    if (validated.status === "PUBLISHED" && !existingPost.publishedAt) {
      updateData.publishedAt = new Date();
    }
    if (validated.scheduledAt) {
      updateData.scheduledAt = new Date(validated.scheduledAt);
    }

    // Recalculate reading time if content changed
    if (validated.content) {
      const wordCount = validated.content.split(/\s+/).length;
      updateData.readingTime = Math.max(1, Math.ceil(wordCount / 200));
    }

    // Update categories if provided
    if (categoryIds) {
      await db.postCategory.deleteMany({ where: { postId: id } });
      if (categoryIds.length > 0) {
        await db.postCategory.createMany({
          data: categoryIds.map((categoryId: string) => ({ postId: id, categoryId })),
        });
      }
    }

    // Update tags if provided
    if (tagIds) {
      await db.postTag.deleteMany({ where: { postId: id } });
      if (tagIds.length > 0) {
        await db.postTag.createMany({
          data: tagIds.map((tagId: string) => ({ postId: id, tagId })),
        });
      }
    }

    const post = await db.post.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: { id: true, name: true, username: true, image: true },
        },
        categories: {
          include: { category: { select: { id: true, name: true, slug: true } } },
        },
        tags: {
          include: { tag: { select: { id: true, name: true, slug: true } } },
        },
      },
    });

    // Create revision if content changed
    if (validated.content || validated.title) {
      const latestRevision = await db.postRevision.findFirst({
        where: { postId: id },
        orderBy: { version: "desc" },
      });
      const nextVersion = (latestRevision?.version || 0) + 1;

      await db.postRevision.create({
        data: {
          postId: id,
          title: post.title,
          content: post.content,
          changeNote: `Version ${nextVersion}`,
          version: nextVersion,
          authorId: session.user.id,
        },
      });
    }

    return NextResponse.json(post);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Update post error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Delete post (author own drafts, editor+ any)
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

    const existingPost = await db.post.findUnique({ where: { id } });
    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const isAuthor = existingPost.authorId === session.user.id;
    const canDeleteAny = hasPermission(session.user.role, "EDITOR");

    // Author can only delete own drafts
    if (isAuthor && !canDeleteAny && existingPost.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Authors can only delete their own drafts" },
        { status: 403 }
      );
    }

    if (!isAuthor && !canDeleteAny) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.post.delete({ where: { id } });

    return NextResponse.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Delete post error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
