import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission, generateSlug, generateUniqueSlug } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { z } from "zod";

const createPostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  excerpt: z.string().optional(),
  featuredImage: z.string().optional(),
  coverImageAlt: z.string().optional(),
  status: z.enum(["DRAFT", "PENDING_REVIEW", "PUBLISHED", "SCHEDULED"]).default("DRAFT"),
  isFeatured: z.boolean().optional(),
  isSponsored: z.boolean().optional(),
  allowComments: z.boolean().optional().default(true),
  readingTime: z.number().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  ogImage: z.string().optional(),
  scheduledAt: z.string().optional(),
  categoryIds: z.array(z.string()).optional(),
  tagIds: z.array(z.string()).optional(),
});

// GET: List posts (paginated, filtered by status, category, author, search)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status") || undefined;
    const categoryId = searchParams.get("categoryId") || undefined;
    const authorId = searchParams.get("authorId") || undefined;
    const search = searchParams.get("search") || undefined;
    const tagId = searchParams.get("tagId") || undefined;
    const isFeatured = searchParams.get("isFeatured") || undefined;
    const dateFrom = searchParams.get("dateFrom") || undefined;
    const dateTo = searchParams.get("dateTo") || undefined;
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};

    // Non-authenticated or READER users can only see PUBLISHED posts
    if (!session?.user?.role || session.user.role === "READER") {
      where.status = "PUBLISHED";
    } else {
      if (status) where.status = status;
    }

    if (authorId) where.authorId = authorId;
    if (isFeatured === "true") where.isFeatured = true;
    if (categoryId) {
      where.categories = { some: { categoryId } };
    }
    if (tagId) {
      where.tags = { some: { tagId } };
    }
    // Date range filtering on publishedAt
    if (dateFrom || dateTo) {
      const publishedAtFilter: Record<string, Date> = {};
      if (dateFrom) {
        publishedAtFilter.gte = new Date(dateFrom);
      }
      if (dateTo) {
        publishedAtFilter.lte = new Date(dateTo + "T23:59:59");
      }
      where.publishedAt = publishedAtFilter;
    }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { excerpt: { contains: search } },
        { content: { contains: search } },
      ];
    }

    const orderBy: Record<string, string> = {};
    orderBy[sortBy] = sortOrder;

    const [posts, total] = await Promise.all([
      db.post.findMany({
        where,
        include: {
          author: {
            select: { id: true, name: true, username: true, image: true, role: true },
          },
          categories: {
            include: {
              category: { select: { id: true, name: true, slug: true, color: true } },
            },
          },
          tags: {
            include: {
              tag: { select: { id: true, name: true, slug: true } },
            },
          },
          _count: {
            select: { comments: true, bookmarks: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      db.post.count({ where }),
    ]);

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("List posts error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Create post — EDITOR, ADMIN
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session.user.role, "EDITOR")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validated = createPostSchema.parse(body);

    const slug = await generateUniqueSlug(validated.title, "Post");

    // Calculate reading time (rough estimate: 200 words per minute)
    const wordCount = validated.content.split(/\s+/).length;
    const readingTime = validated.readingTime || Math.max(1, Math.ceil(wordCount / 200));

    const post = await db.post.create({
      data: {
        title: validated.title,
        slug,
        content: validated.content,
        excerpt: validated.excerpt,
        featuredImage: validated.featuredImage,
        coverImageAlt: validated.coverImageAlt,
        status: validated.status,
        isFeatured: validated.isFeatured || false,
        isSponsored: validated.isSponsored || false,
        allowComments: validated.allowComments ?? true,
        readingTime,
        seoTitle: validated.seoTitle,
        seoDescription: validated.seoDescription,
        ogImage: validated.ogImage,
        scheduledAt: validated.scheduledAt ? new Date(validated.scheduledAt) : null,
        publishedAt: validated.status === "PUBLISHED" ? new Date() : null,
        authorId: session.user.id,
        categories: validated.categoryIds
          ? { create: validated.categoryIds.map((categoryId: string) => ({ categoryId })) }
          : undefined,
        tags: validated.tagIds
          ? { create: validated.tagIds.map((tagId: string) => ({ tagId })) }
          : undefined,
      },
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

    // Create initial revision
    await db.postRevision.create({
      data: {
        postId: post.id,
        title: post.title,
        content: post.content,
        changeNote: "Initial version",
        version: 1,
        authorId: session.user.id,
      },
    });

    // Send push notification to readers if post is directly published
    if (validated.status === "PUBLISHED") {
      try {
        const { sendPushToRole } = await import("@/lib/web-push-server");
        await sendPushToRole("READER", {
          title: "New Story Published!",
          body: post.title,
          url: `/post/${post.slug}`,
          type: "new_post",
        });
      } catch (pushError) {
        // Push failures should not block post creation
        console.error("[Posts] Push notification failed for new post", post.id, pushError);
      }
    }

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Create post error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
