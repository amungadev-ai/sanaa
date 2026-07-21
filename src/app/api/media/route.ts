import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { uploadToCDN, isCDNUrl } from "@/lib/cdn";
import sharp from "sharp";

// Image types that should be converted to WebP
const CONVERTIBLE_TYPES = ["image/jpeg", "image/png", "image/gif"];
// Types that should NOT be converted (already optimized or special format)
const SKIP_CONVERSION_TYPES = ["image/webp", "image/svg+xml", "image/avif"];

// GET: List media (paginated)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const skip = (page - 1) * limit;

    // Build where clause for search
    const where = search
      ? {
          OR: [
            { originalName: { contains: search, mode: "insensitive" as const } },
            { filename: { contains: search, mode: "insensitive" as const } },
            { altText: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [media, total] = await Promise.all([
      db.media.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          uploader: { select: { id: true, name: true, username: true } },
        },
      }),
      db.media.count({ where }),
    ]);

    return NextResponse.json({
      media,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("List media error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Convert an image buffer to WebP format using sharp.
 * Returns the converted buffer and new MIME type.
 * Skips SVG and already-WebP/AVIF files.
 */
async function convertToWebP(
  buffer: Buffer,
  originalMimeType: string
): Promise<{ buffer: Buffer; mimeType: string; converted: boolean }> {
  // Skip non-convertible types
  if (SKIP_CONVERSION_TYPES.includes(originalMimeType)) {
    return { buffer, mimeType: originalMimeType, converted: false };
  }

  // Only convert supported raster image types
  if (!CONVERTIBLE_TYPES.includes(originalMimeType)) {
    return { buffer, mimeType: originalMimeType, converted: false };
  }

  try {
    const webpBuffer = await sharp(buffer, {
      // Handle animated GIFs properly
      animated: originalMimeType === "image/gif",
    })
      .webp({
        quality: 82,          // Good balance of quality vs size
        effort: 4,            // Reasonable encoding speed
        alphaQuality: 90,     // Preserve transparency quality
      })
      .toBuffer();

    // Only use WebP if it's actually smaller (or within 5% — still worth it for WebP's decoding speed)
    const sizeRatio = webpBuffer.length / buffer.length;
    if (sizeRatio > 1.05) {
      // WebP is significantly larger — keep original
      return { buffer, mimeType: originalMimeType, converted: false };
    }

    return { buffer: webpBuffer, mimeType: "image/webp", converted: true };
  } catch (err) {
    console.error("WebP conversion failed, using original:", err);
    return { buffer, mimeType: originalMimeType, converted: false };
  }
}

// POST: Upload image to CDN (cdn.sanaathrumylens.co.ke)
// Now with automatic WebP conversion for SEO/performance
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session.user.role, "EDITOR")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const altText = formData.get("altText") as string | null;
    const folder = (formData.get("folder") as string) || "misc";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml", "image/avif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, GIF, WebP, SVG, AVIF" },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size: 10MB" },
        { status: 400 }
      );
    }

    const originalSize = file.size;
    const originalMimeType = file.type;
    const originalName = file.name;

    // Read file into buffer for processing
    const arrayBuffer = await file.arrayBuffer();
    let processedBuffer = Buffer.from(arrayBuffer);
    let finalMimeType = originalMimeType;
    let wasConverted = false;

    // Convert to WebP for better performance/SEO (skip SVG and already-optimized formats)
    if (CONVERTIBLE_TYPES.includes(originalMimeType)) {
      const result = await convertToWebP(processedBuffer, originalMimeType);
      processedBuffer = result.buffer;
      finalMimeType = result.mimeType;
      wasConverted = result.converted;
    }

    // Generate filename with .webp extension if converted
    let uploadFilename: string | undefined;
    if (wasConverted) {
      const baseName = originalName.replace(/\.[^.]+$/, "");
      uploadFilename = `${baseName}.webp`;
    }

    // Upload to CDN
    const cdnResult = await uploadToCDN(processedBuffer, {
      folder: folder as 'posts' | 'artists' | 'events' | 'profiles' | 'ads' | 'misc',
      filename: uploadFilename,
      mimeType: finalMimeType,
    });

    // Create media record in database with CDN URL
    const media = await db.media.create({
      data: {
        filename: cdnResult.filename,
        originalName: originalName, // Keep original name for user reference
        mimeType: finalMimeType,     // Store actual MIME type (may be webp now)
        size: cdnResult.size,        // Actual size on CDN
        url: cdnResult.url,
        altText,
        uploadedBy: session.user.id,
      },
    });

    // Return additional info about conversion for the UI
    return NextResponse.json({
      ...media,
      originalSize,             // Original file size before conversion
      converted: wasConverted,   // Whether WebP conversion happened
    }, { status: 201 });
  } catch (error) {
    console.error("Upload media error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
