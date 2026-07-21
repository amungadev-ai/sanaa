import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { z } from "zod";

const updateSettingsSchema = z.object({
  settings: z.array(z.object({
    key: z.string().min(1),
    value: z.string(),
    label: z.string().optional(),
    type: z.enum(["text", "json", "boolean", "number"]).optional(),
  })),
});

// GET: Get all settings — requires ADMIN+ authentication
export async function GET() {
  try {
    // Require authentication — settings may contain sensitive values
    const session = await getServerSession(authOptions);
    if (!session?.user?.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session.user.role, "ADMIN")) {
      return NextResponse.json({ error: "Forbidden — ADMIN+ required" }, { status: 403 });
    }

    const settings = await db.siteSetting.findMany({
      orderBy: { key: "asc" },
    });

    // Convert to key-value map for easy access
    const settingsMap: Record<string, { value: string; label: string | null; type: string }> = {};
    for (const setting of settings) {
      settingsMap[setting.key] = {
        value: setting.value,
        label: setting.label,
        type: setting.type,
      };
    }

    return NextResponse.json({ settings: settingsMap, raw: settings });
  } catch (error) {
    console.error("Get settings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT: Update settings — ADMIN only
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session.user.role, "ADMIN")) {
      return NextResponse.json({ error: "Forbidden — ADMIN only" }, { status: 403 });
    }

    const body = await request.json();
    const validated = updateSettingsSchema.parse(body);

    // Upsert each setting
    for (const setting of validated.settings) {
      await db.siteSetting.upsert({
        where: { key: setting.key },
        update: {
          value: setting.value,
          label: setting.label,
          type: setting.type || "text",
        },
        create: {
          key: setting.key,
          value: setting.value,
          label: setting.label,
          type: setting.type || "text",
        },
      });
    }

    const updatedSettings = await db.siteSetting.findMany({
      orderBy: { key: "asc" },
    });

    return NextResponse.json(updatedSettings);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Update settings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
