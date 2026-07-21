import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import { z } from "zod";
import crypto from "crypto";

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

// POST: Send password reset email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);

    // Find user by email
    const user = await db.user.findUnique({
      where: { email },
    });

    // Always return success to avoid revealing if email exists
    if (!user) {
      return NextResponse.json({ message: "If an account with that email exists, we've sent a reset link" });
    }

    // Generate a random token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 3600000); // 1 hour from now

    // Save token to VerificationToken model
    await db.verificationToken.create({
      data: {
        identifier: `reset-password_${user.id}`,
        token,
        expires,
      },
    });

    // Try to send email via the email service
    const emailSent = await sendPasswordResetEmail(email, token);

    if (!emailSent) {
      // SMTP not configured — log token for dev
      console.log(`[DEV] Password reset token for ${email}: ${token}`);
      console.log(`[DEV] Reset URL: https://sanaathrumylens.co.ke/auth/reset-password?token=${token}`);
    }

    return NextResponse.json({ message: "If an account with that email exists, we've sent a reset link" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
