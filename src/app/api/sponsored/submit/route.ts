import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission, generateUniqueSlug, notifyUsersByRole } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { z } from "zod";

const sponsoredSubmitSchema = z.object({
  advertiserName: z.string().min(2, "Name is required"),
  advertiserEmail: z.string().email("Valid email is required"),
  companyName: z.string().min(2, "Company name is required"),
  postTitle: z.string().min(5, "Post title must be at least 5 characters"),
  postContent: z.string().min(50, "Content must be at least 50 characters"),
  proposedCategory: z.string().optional(),
  budget: z.string().optional(),
  notes: z.string().optional(),
});

// POST: Public endpoint for advertisers to submit sponsored content
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = sponsoredSubmitSchema.parse(body);

    // Find or create a user for the advertiser
    let authorUser = await db.user.findUnique({
      where: { email: validated.advertiserEmail },
    });

    if (!authorUser) {
      const username = validated.advertiserEmail
        .split("@")[0]
        .replace(/[^a-zA-Z0-9]/g, "_");

      authorUser = await db.user.create({
        data: {
          email: validated.advertiserEmail,
          name: validated.advertiserName,
          username: `${username}_adv`,
          role: "READER",
        },
      });
    }

    const slug = await generateUniqueSlug(validated.postTitle, "Post");

    // Create the post with SPONSORED_REVIEW status
    const post = await db.post.create({
      data: {
        title: validated.postTitle,
        slug,
        content: validated.postContent,
        excerpt: validated.postContent.slice(0, 160) + "...",
        isSponsored: true,
        status: "SPONSORED_REVIEW",
        authorId: authorUser.id,
      },
    });

    // Add category if provided
    if (validated.proposedCategory) {
      const category = await db.category.findFirst({
        where: { slug: validated.proposedCategory },
      });
      if (category) {
        await db.postCategory.create({
          data: { postId: post.id, categoryId: category.id },
        });
      }
    }

    // Notify admins about new sponsored submission
    try {
      await notifyUsersByRole(
        "ADMIN",
        "New Sponsored Post Submission",
        `${validated.companyName} has submitted a sponsored post: "${validated.postTitle}"`,
        "info",
        "/dashboard/sponsored"
      );
    } catch (notifError) {
      console.error("Failed to send sponsored notification:", notifError);
    }

    return NextResponse.json(
      {
        message: "Sponsored post submitted successfully",
        postId: post.id,
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
    console.error("Sponsored submit error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
