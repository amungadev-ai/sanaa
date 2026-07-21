import { NextRequest, NextResponse } from "next/server";
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
