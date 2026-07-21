import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/auth-helpers";
import { sendPushToUser, sendPushToRole } from "@/lib/web-push-server";
import { z } from "zod";

const sendPushSchema = z.object({
  userId: z.string().optional(),
  minRole: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Body is required"),
  url: z.string().optional(),
  type: z.string().optional(),
  icon: z.string().optional(),
  badge: z.string().optional(),
});

// POST: Send a push notification (ADMIN+ role required)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session.user.role, "ADMIN")) {
      return NextResponse.json(
        { error: "Forbidden — Admin role required to send push notifications" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = sendPushSchema.parse(body);

    const payload = {
      title: validated.title,
      body: validated.body,
      url: validated.url,
      type: validated.type,
      icon: validated.icon,
      badge: validated.badge,
    };

    let result;

    if (validated.userId) {
      // Send to a specific user
      result = await sendPushToUser(validated.userId, payload);
    } else if (validated.minRole) {
      // Send to all users with a minimum role
      result = await sendPushToRole(validated.minRole, payload);
    } else {
      return NextResponse.json(
        { error: "Either userId or minRole must be provided" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "Push notification sent",
      sent: result.sent,
      failed: result.failed,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Send push error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
