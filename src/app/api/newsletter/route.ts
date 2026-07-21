import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { z } from "zod";
import { randomBytes } from "crypto";

const subscribeSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().optional(),
});

// POST: Subscribe to newsletter (public)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = subscribeSchema.parse(body);

    // Check if already subscribed
    const existing = await db.newsletterSubscriber.findUnique({
      where: { email: validated.email },
    });

    if (existing) {
      if (existing.status === "ACTIVE") {
        return NextResponse.json(
          { message: "Already subscribed!", subscribed: true },
          { status: 200 }
        );
      }
      // Reactivate if previously unsubscribed
      await db.newsletterSubscriber.update({
        where: { email: validated.email },
        data: { status: "ACTIVE", name: validated.name || existing.name },
      });
      return NextResponse.json(
        { message: "Resubscribed successfully!", subscribed: true },
        { status: 200 }
      );
    }

    // Generate unique unsubscribe token
    const token = randomBytes(32).toString("hex");

    // Create new subscriber
    await db.newsletterSubscriber.create({
      data: {
        email: validated.email,
        name: validated.name || null,
        status: "ACTIVE",
        token,
      },
    });

    return NextResponse.json(
      { message: "Subscribed successfully!", subscribed: true },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }
    console.error("Newsletter subscribe error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET: List newsletter subscribers (ADMIN+ only, paginated)
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
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [subscribers, total] = await Promise.all([
      db.newsletterSubscriber.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.newsletterSubscriber.count({ where }),
    ]);

    return NextResponse.json({
      subscribers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("List subscribers error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
