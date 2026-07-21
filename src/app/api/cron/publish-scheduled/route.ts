import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET: Publish scheduled posts whose time has come
// This endpoint is called by Vercel Cron
export async function GET(request: NextRequest) {
  // Verify CRON_KEY for security
  const authHeader = request.headers.get("authorization")
  const cronKey = process.env.CRON_KEY

  if (cronKey && authHeader !== `Bearer ${cronKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Find all posts that are SCHEDULED and scheduledAt <= now
  const postsToPublish = await db.post.findMany({
    where: {
      status: "SCHEDULED",
      scheduledAt: { lte: new Date() },
    },
    select: {
      id: true,
      title: true,
      slug: true,
    },
  })

  // Publish each one and send push notification
  let published = 0
  for (const post of postsToPublish) {
    await db.post.update({
      where: { id: post.id },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    })
    published++

    // Send push notification to readers about the newly published post
    try {
      const { sendPushToRole } = await import("@/lib/web-push-server")
      await sendPushToRole("READER", {
        title: "New Story Published!",
        body: post.title,
        url: `/post/${post.slug}`,
        type: "new_post",
      })
    } catch (pushError) {
      // Push failures should not block the cron job
      console.error("[Cron] Push notification failed for post", post.id, pushError)
    }
  }

  return NextResponse.json({ published, checked: postsToPublish.length })
}
