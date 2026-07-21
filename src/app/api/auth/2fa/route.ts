import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { compare } from "bcryptjs";
import { generateOTP, sendOTPEmail } from "@/lib/auth-helpers";
import { z } from "zod";

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= maxAttempts) {
    return false;
  }

  record.count++;
  return true;
}

// POST: Verify 2FA OTP code (works both for login flow and session-based enable flow)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, email } = body;

    if (!code) {
      return NextResponse.json(
        { error: "Verification code is required" },
        { status: 400 }
      );
    }

    // Rate limiting
    const rateKey = `2fa_${email || 'session'}`;
    if (!checkRateLimit(rateKey)) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429 }
      );
    }

    // Case 1: Login 2FA flow — email provided, no session yet
    if (email) {
      const user = await db.user.findUnique({ where: { email } });

      if (!user) {
        return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
      }

      if (!user.twoFactorCode || !user.twoFactorExp) {
        return NextResponse.json(
          { error: "No verification code was sent. Please try signing in again." },
          { status: 400 }
        );
      }

      // Check if code expired
      if (new Date() > user.twoFactorExp) {
        await db.user.update({
          where: { id: user.id },
          data: { twoFactorCode: null, twoFactorExp: null },
        });
        return NextResponse.json(
          { error: "Verification code has expired. Please try signing in again." },
          { status: 400 }
        );
      }

      // Check if code matches
      if (user.twoFactorCode !== code) {
        return NextResponse.json(
          { error: "Invalid verification code" },
          { status: 400 }
        );
      }

      // Clear the code and sign in the user
      await db.user.update({
        where: { id: user.id },
        data: { twoFactorCode: null, twoFactorExp: null },
      });

      // Return success with user info — client will call signIn again
      return NextResponse.json({
        message: "2FA verification successful",
        twoFactorVerified: true,
        email: user.email,
      });
    }

    // Case 2: Session-based flow — enabling 2FA from profile settings
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.twoFactorCode || !user.twoFactorExp) {
      return NextResponse.json(
        { error: "No verification code was sent. Please request a new one." },
        { status: 400 }
      );
    }

    // Check if code expired
    if (new Date() > user.twoFactorExp) {
      await db.user.update({
        where: { id: user.id },
        data: { twoFactorCode: null, twoFactorExp: null },
      });
      return NextResponse.json(
        { error: "Verification code has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Check if code matches
    if (user.twoFactorCode !== code) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }

    // Mark 2FA as enabled and clear the code
    await db.user.update({
      where: { id: user.id },
      data: {
        twoFactorCode: null,
        twoFactorExp: null,
        twoFactorEnabled: true,
      },
    });

    return NextResponse.json({ message: "2FA enabled successfully", twoFactorEnabled: true });
  } catch (error) {
    console.error("2FA verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT: Enable 2FA — Generate and send verification code (session-based)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Generate a 6-digit OTP code
    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Save code to user record
    await db.user.update({
      where: { id: user.id },
      data: {
        twoFactorCode: code,
        twoFactorExp: expiresAt,
      },
    });

    // Send code via email
    const emailSent = await sendOTPEmail(user.email, code);

    const response: { message: string; devCode?: string } = {
      message: "Verification code sent",
    };

    // If email not sent, return the code in response (dev mode)
    if (!emailSent) {
      response.devCode = code;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("2FA enable error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Disable 2FA — Require current password verification
const disable2FASchema = z.object({
  currentPassword: z.string(),
});

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword } = disable2FASchema.parse(body);

    if (!currentPassword) {
      return NextResponse.json(
        { error: "Current password is required" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify current password
    if (!user.password) {
      return NextResponse.json(
        { error: "Cannot disable 2FA for OAuth-only accounts" },
        { status: 400 }
      );
    }

    const isPasswordValid = await compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    // Disable 2FA
    await db.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorCode: null,
        twoFactorExp: null,
      },
    });

    return NextResponse.json({ message: "2FA disabled successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("2FA disable error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
