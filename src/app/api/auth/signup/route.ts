import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, generateSlug } from "@/lib/auth-helpers";
import { sendVerificationEmail, sendWelcomeEmail } from "@/lib/email";
import { z } from "zod";
import crypto from "crypto";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// POST: Public reader sign-up
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = signupSchema.parse(body);

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Generate username from email
    let username = email
      .split("@")[0]
      .replace(/[^a-zA-Z0-9]/g, "_")
      .substring(0, 20);

    // Ensure username is unique
    const existingUsername = await db.user.findUnique({
      where: { username },
    });

    if (existingUsername) {
      username = `${username}_${Date.now().toString(36)}`;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user with READER role
    const user = await db.user.create({
      data: {
        email,
        name,
        username,
        password: hashedPassword,
        role: "READER",
        isActive: true,
        emailVerified: null, // Will be set after email verification
      },
    });

    // Generate email verification token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await db.verificationToken.create({
      data: {
        identifier: `verify-email_${user.id}`,
        token,
        expires,
      },
    });

    // Send verification email
    const emailSent = await sendVerificationEmail(user.email, user.name, token);

    if (!emailSent) {
      console.log(`[DEV] Verification token for ${email}: ${token}`);
      console.log(`[DEV] Verify URL: https://sanaathrumylens.co.ke/auth/verify-email?token=${token}`);
    }

    // Also send welcome email (independent of verification)
    await sendWelcomeEmail(user.email, user.name);

    return NextResponse.json({
      message: "Account created successfully! Please check your email to verify your account.",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
      },
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Sign-up error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
