import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission, generateUniqueSlug } from "@/lib/auth-helpers";
import { sendPushToRole } from "@/lib/web-push-server";
import { db } from "@/lib/db";
import { z } from "zod";

const communitySubmitSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title must be at most 200 characters"),
  content: z
    .string()
    .min(100, "Content must be at least 100 characters"),
  categoryIds: z
    .array(z.string())
    .min(1, "Select at least one category"),
  tagIds: z.array(z.string()).optional(),
});

// POST: Submit a community voice article (READER role)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Only READER users can submit community voice articles
    // Staff members should use the dashboard editor
    if (hasPermission(session.user.role, "EDITOR")) {
      return NextResponse.json(
        { error: "Staff members should use the dashboard editor" },
        { status: 403 }
      );
    }

    // Verify the user is at least a READER
    if (session.user.role !== "READER") {
      return NextResponse.json(
        { error: "Only reader accounts can submit community articles" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = communitySubmitSchema.parse(body);

    // Generate unique slug
    const slug = await generateUniqueSlug(validated.title, "Post");

    // Calculate reading time (rough estimate: 200 words per minute)
    const wordCount = validated.content.split(/\s+/).filter(Boolean).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    // Create the post as PENDING_REVIEW with isCommunityVoice flag
    const post = await db.post.create({
      data: {
        title: validated.title,
        slug,
        content: validated.content,
        status: "PENDING_REVIEW",
        isCommunityVoice: true,
        readingTime,
        authorId: session.user.id,
        categories: {
          create: validated.categoryIds.map((categoryId: string) => ({
            categoryId,
          })),
        },
        tags: validated.tagIds
          ? {
              create: validated.tagIds.map((tagId: string) => ({ tagId })),
            }
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

    // Notify editors about the new community submission
    try {
      const { notifyUsersByRole } = await import("@/lib/auth-helpers");
      await notifyUsersByRole(
        "EDITOR",
        "New Community Submission",
        `A new community voice article "${validated.title}" has been submitted and is awaiting review.`,
        "info",
        `/dashboard/posts?status=PENDING_REVIEW`
      );
    } catch {
      // Notification is best-effort
    }

    // Send push notification to editors about community submission
    try {
      await sendPushToRole("EDITOR", {
        title: "Community Submission",
        body: `A new community voice submission awaits review`,
        url: "/dashboard/posts",
        type: "new_post",
      });
    } catch (pushError) {
      console.error("Failed to send push notification for community submission:", pushError);
    }

    return NextResponse.json(
      {
        message: "Your submission has been received and is under review.",
        post,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Community submit error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
