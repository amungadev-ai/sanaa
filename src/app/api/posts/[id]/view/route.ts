import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// In-memory deduplication: Set of "postIp" entries with timestamps
const viewDedup = new Map<string, number>();
const DEDUP_TTL = 30 * 60 * 1000; // 30 minutes

// Clean up old entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of viewDedup) {
    if (now - timestamp > DEDUP_TTL) {
      viewDedup.delete(key);
    }
  }
}, 10 * 60 * 1000);

// POST: Increment post view count with IP-based deduplication
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const post = await db.post.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Get IP from headers
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0]?.trim() : request.headers.get("x-real-ip") || "unknown";

    // Dedup key
    const dedupKey = `${id}:${ip}`;
    const now = Date.now();

    // Check if this IP already viewed this post within TTL
    const lastView = viewDedup.get(dedupKey);
    if (lastView && now - lastView < DEDUP_TTL) {
      return NextResponse.json({ viewed: false, reason: "deduplicated" });
    }

    // Mark as viewed
    viewDedup.set(dedupKey, now);

    // Increment view count
    await db.post.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    return NextResponse.json({ viewed: true });
  } catch (error) {
    console.error("Post view tracking error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
