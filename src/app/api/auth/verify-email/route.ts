import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

// POST: Send email verification link
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = z.object({ email: z.string().email() }).parse(body);

    const user = await db.user.findUnique({ where: { email } });

    // Always return success to avoid revealing if email exists
    if (!user || user.emailVerified) {
      return NextResponse.json({ message: "If your email needs verification, we've sent a link" });
    }

    // Check rate limit — only allow one verification email per 5 minutes
    const recentToken = await db.verificationToken.findFirst({
      where: {
        identifier: `verify-email_${user.id}`,
        expires: { gt: new Date(Date.now() - 5 * 60 * 1000) },
      },
      orderBy: { expires: "desc" },
    });

    if (recentToken) {
      return NextResponse.json({ message: "Verification email already sent recently. Please check your inbox." });
    }

    // Generate token
    const crypto = require("crypto");
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Delete any existing verification tokens for this user
    await db.verificationToken.deleteMany({
      where: { identifier: `verify-email_${user.id}` },
    });

    // Save token
    await db.verificationToken.create({
      data: {
        identifier: `verify-email_${user.id}`,
        token,
        expires,
      },
    });

    // Send verification email
    const { sendVerificationEmail } = require("@/lib/email");
    const emailSent = await sendVerificationEmail(user.email, user.name, token);

    if (!emailSent) {
      console.log(`[DEV] Email verification token for ${email}: ${token}`);
      console.log(`[DEV] Verify URL: https://sanaathrumylens.co.ke/auth/verify-email?token=${token}`);
    }

    return NextResponse.json({ message: "If your email needs verification, we've sent a link" });
  } catch (error) {
    console.error("Send verification email error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET: Verify email with token
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Missing verification token" }, { status: 400 });
    }

    // Find the token
    const verificationToken = await db.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return NextResponse.json({ error: "Invalid or expired verification token" }, { status: 400 });
    }

    // Check if it's a verify-email token
    if (!verificationToken.identifier.startsWith("verify-email_")) {
      return NextResponse.json({ error: "Invalid token type" }, { status: 400 });
    }

    // Check if expired
    if (new Date() > verificationToken.expires) {
      await db.verificationToken.delete({ where: { token } });
      return NextResponse.json({ error: "Token has expired. Please request a new one." }, { status: 400 });
    }

    // Extract user ID from identifier
    const userId = verificationToken.identifier.replace("verify-email_", "");

    // Mark email as verified
    await db.user.update({
      where: { id: userId },
      data: { emailVerified: new Date() },
    });

    // Delete the used token
    await db.verificationToken.delete({ where: { token } });

    // Redirect to sign-in with success message
    return NextResponse.redirect(new URL("/auth/signin?verified=true", request.url));
  } catch (error) {
    console.error("Verify email error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
