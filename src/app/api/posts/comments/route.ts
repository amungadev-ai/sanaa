import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET: Fetch approved comments for a post (public)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const postId = searchParams.get("postId");
    if (!postId) {
      return NextResponse.json({ error: "postId is required" }, { status: 400 });
    }

    const comments = await db.comment.findMany({
      where: { postId, status: "APPROVED", parentId: null },
      include: {
        author: { select: { id: true, name: true, username: true, image: true } },
        replies: {
          where: { status: "APPROVED" },
          include: {
            author: { select: { id: true, name: true, username: true, image: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("Get public comments error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
