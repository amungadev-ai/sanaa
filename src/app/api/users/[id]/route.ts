import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { hash, compare } from "bcryptjs";
import { z } from "zod";

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  username: z.string().min(3).regex(/^[a-zA-Z0-9_]+$/).optional(),
  role: z.enum(["ADMIN", "EDITOR", "READER"]).optional(),
  isActive: z.boolean().optional(),
  bio: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  password: z.string().min(8).optional(),
  currentPassword: z.string().optional(),
});

// GET: Get user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session.user.role, "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        role: true,
        image: true,
        bio: true,
        isActive: true,
        twoFactorEnabled: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { posts: true, comments: true, bookmarks: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH: Update user
// - Self-update: allow name, bio, image, username, password (with currentPassword verification)
// - Admin update: require ADMIN, allow all fields
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validated = updateUserSchema.parse(body);

    // Check user exists
    const existing = await db.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check username uniqueness
    if (validated.username && validated.username !== existing.username) {
      const usernameTaken = await db.user.findUnique({
        where: { username: validated.username },
      });
      if (usernameTaken) {
        return NextResponse.json(
          { error: "Username already taken" },
          { status: 409 }
        );
      }
    }

    const isSelfUpdate = session.user.id === id;

    if (isSelfUpdate) {
      // Self-update: allow name, bio, image, username, password (with currentPassword verification)
      const { role, isActive, password, currentPassword, ...selfFields } = validated;

      // If updating password, require currentPassword verification
      if (password) {
        if (!currentPassword) {
          return NextResponse.json(
            { error: "Current password is required to change password" },
            { status: 400 }
          );
        }

        if (!existing.password) {
          return NextResponse.json(
            { error: "Cannot change password for OAuth-only accounts" },
            { status: 400 }
          );
        }

        const isCurrentPasswordValid = await compare(currentPassword, existing.password);
        if (!isCurrentPasswordValid) {
          return NextResponse.json(
            { error: "Current password is incorrect" },
            { status: 400 }
          );
        }

        const hashedPassword = await hash(password, 12);
        const user = await db.user.update({
          where: { id },
          data: {
            ...selfFields,
            password: hashedPassword,
          },
          select: {
            id: true,
            email: true,
            name: true,
            username: true,
            role: true,
            image: true,
            bio: true,
            isActive: true,
            twoFactorEnabled: true,
            updatedAt: true,
          },
        });

        return NextResponse.json(user);
      }

      // No password change — just update self fields
      const user = await db.user.update({
        where: { id },
        data: selfFields,
        select: {
          id: true,
          email: true,
          name: true,
          username: true,
          role: true,
          image: true,
          bio: true,
          isActive: true,
          twoFactorEnabled: true,
          updatedAt: true,
        },
      });

      return NextResponse.json(user);
    } else {
      // Admin update: require ADMIN, allow all fields
      if (!hasPermission(session.user.role, "ADMIN")) {
        return NextResponse.json({ error: "Forbidden — ADMIN only" }, { status: 403 });
      }

      // Prevent self-deactivation
      if (id === session.user.id && validated.isActive === false) {
        return NextResponse.json(
          { error: "You cannot deactivate your own account" },
          { status: 400 }
        );
      }

      // For admin updates, strip out password/currentPassword fields
      const { password, currentPassword, ...adminFields } = validated;

      const user = await db.user.update({
        where: { id },
        data: adminFields,
        select: {
          id: true,
          email: true,
          name: true,
          username: true,
          role: true,
          image: true,
          bio: true,
          isActive: true,
          twoFactorEnabled: true,
          updatedAt: true,
        },
      });

      return NextResponse.json(user);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Update user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Deactivate user — ADMIN only
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session.user.role, "ADMIN")) {
      return NextResponse.json({ error: "Forbidden — ADMIN only" }, { status: 403 });
    }

    const { id } = await params;

    if (id === session.user.id) {
      return NextResponse.json(
        { error: "You cannot deactivate your own account" },
        { status: 400 }
      );
    }

    const existing = await db.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Soft delete — deactivate instead of removing
    await db.user.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ message: "User deactivated successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
