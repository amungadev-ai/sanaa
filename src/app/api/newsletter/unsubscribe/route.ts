import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const unsubscribeSchema = z.object({
  token: z.string().min(1, "Unsubscribe token is required"),
});

// POST: Unsubscribe from newsletter
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = unsubscribeSchema.parse(body);

    const subscriber = await db.newsletterSubscriber.findUnique({
      where: { token: validated.token },
    });

    if (!subscriber) {
      return NextResponse.json(
        { error: "Invalid unsubscribe token" },
        { status: 404 }
      );
    }

    if (subscriber.status === "UNSUBSCRIBED") {
      return NextResponse.json({ message: "Already unsubscribed" });
    }

    await db.newsletterSubscriber.update({
      where: { id: subscriber.id },
      data: { status: "UNSUBSCRIBED" },
    });

    return NextResponse.json({ message: "Unsubscribed successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Newsletter unsubscribe error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
