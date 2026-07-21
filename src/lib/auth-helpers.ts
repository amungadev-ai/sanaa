import { hash, compare } from "bcryptjs";
import { db } from "@/lib/db";
import { sendOTPEmail as sendOTPViaEmailService } from "@/lib/email";

// ============================================
// ROLE HIERARCHY
// ============================================

export const ROLE_HIERARCHY: Record<string, number> = {
  ADMIN: 3,
  EDITOR: 2,
  READER: 1,
};

export const DASHBOARD_ROLES = [
  "ADMIN",
  "EDITOR",
];

/**
 * Check if userRole has sufficient permission level
 */
export function hasPermission(
  userRole: string,
  requiredRole: string
): boolean {
  const userLevel = ROLE_HIERARCHY[userRole] ?? 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] ?? 0;
  return userLevel >= requiredLevel;
}

/**
 * Check if the role can access the dashboard
 */
export function canAccessDashboard(role: string): boolean {
  return DASHBOARD_ROLES.includes(role);
}

// ============================================
// PASSWORD HELPERS
// ============================================

/**
 * Hash a password using bcryptjs
 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hashStr: string
): Promise<boolean> {
  return compare(password, hashStr);
}

// ============================================
// OTP HELPERS
// ============================================

/**
 * Generate a 6-digit OTP code
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send OTP email using the email service
 */
export async function sendOTPEmail(
  email: string,
  code: string
): Promise<boolean> {
  return sendOTPViaEmailService(email, code);
}

// ============================================
// USER MANAGEMENT HELPERS
// ============================================

interface CreateDashboardUserData {
  email: string;
  name: string;
  username: string;
  password: string;
  role: string;
  bio?: string;
  image?: string;
}

/**
 * Create a dashboard user with hashed password
 * Only ADMIN can create dashboard users
 */
export async function createDashboardUser(data: CreateDashboardUserData) {
  const hashedPassword = await hashPassword(data.password);

  return db.user.create({
    data: {
      email: data.email,
      name: data.name,
      username: data.username,
      password: hashedPassword,
      role: data.role,
      bio: data.bio,
      image: data.image,
      emailVerified: new Date(),
    },
  });
}

// ============================================
// SLUG HELPER
// ============================================

/**
 * Generate a URL-friendly slug from text
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Generate a unique slug by appending a number if needed
 */
export async function generateUniqueSlug(
  text: string,
  model: "Post" | "Category" | "Tag" | "Event" | "Artist" | "ReadingList"
): Promise<string> {
  const baseSlug = generateSlug(text);
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await (db as Record<string, { findUnique: (args: { where: { slug: string } }) => Promise<unknown> }>)[model].findUnique({
      where: { slug },
    });
    if (!existing) break;
    counter++;
    slug = `${baseSlug}-${counter}`;
  }

  return slug;
}

// ============================================
// NOTIFICATION HELPERS
// ============================================

/**
 * Create a notification for a user
 */
export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: string = "info",
  link?: string
) {
  return db.notification.create({
    data: {
      userId,
      title,
      message,
      type,
      link: link || null,
    },
  });
}

/**
 * Create notifications for all users with a minimum role
 */
export async function notifyUsersByRole(
  minimumRole: string,
  title: string,
  message: string,
  type: string = "info",
  link?: string
) {
  const minLevel = ROLE_HIERARCHY[minimumRole] ?? 0;

  const users = await db.user.findMany({
    where: { isActive: true },
    select: { id: true, role: true },
  });

  const eligibleUsers = users.filter(
    (u) => (ROLE_HIERARCHY[u.role] ?? 0) >= minLevel
  );

  const notifications = eligibleUsers.map((user) => ({
    userId: user.id,
    title,
    message,
    type,
    link: link || null,
  }));

  if (notifications.length > 0) {
    await db.notification.createMany({ data: notifications });
  }

  return notifications.length;
}
