import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/flagged - List flagged content (ADMIN only)
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const userRole = session.user.role as string;
  const roleHierarchy: Record<string, number> = {
    ADMIN: 3, EDITOR: 2, READER: 1,
  };
  if ((roleHierarchy[userRole] || 0) < 3) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || undefined;
  const contentType = searchParams.get('contentType') || undefined;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (contentType) where.contentType = contentType;

  const flags = await db.flaggedContent.findMany({
    where,
    include: {
      reporter: { select: { id: true, name: true, email: true, image: true } },
      reviewedBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  // Enrich with the actual content
  const enrichedFlags = await Promise.all(
    flags.map(async (flag) => {
      let contentData: Record<string, unknown> | null = null;
      try {
        if (flag.contentType === 'COMMENT') {
          contentData = await db.comment.findUnique({
            where: { id: flag.contentId },
            select: {
              id: true,
              content: true,
              status: true,
              createdAt: true,
              author: { select: { id: true, name: true, image: true } },
              post: { select: { id: true, title: true, slug: true } },
            },
          }) as Record<string, unknown> | null;
        } else if (flag.contentType === 'POST') {
          contentData = await db.post.findUnique({
            where: { id: flag.contentId },
            select: {
              id: true,
              title: true,
              slug: true,
              status: true,
              excerpt: true,
              author: { select: { id: true, name: true, image: true } },
            },
          }) as Record<string, unknown> | null;
        }
      } catch {
        // Content may have been deleted
      }
      return { ...flag, contentData };
    })
  );

  const counts = await db.flaggedContent.groupBy({
    by: ['status'],
    _count: { id: true },
  });

  return NextResponse.json({ flags: enrichedFlags, counts });
}

// POST /api/flagged - Create a new flag (READER+)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const body = await request.json();
  const { contentType, contentId, reason, description } = body;

  if (!contentType || !contentId || !reason) {
    return NextResponse.json({ error: 'contentType, contentId, and reason are required' }, { status: 400 });
  }

  if (!['COMMENT', 'POST'].includes(contentType)) {
    return NextResponse.json({ error: 'Invalid contentType' }, { status: 400 });
  }

  if (!['SPAM', 'HARASSMENT', 'HATE_SPEECH', 'MISINFORMATION', 'INAPPROPRIATE', 'OTHER'].includes(reason)) {
    return NextResponse.json({ error: 'Invalid reason' }, { status: 400 });
  }

  // Check for duplicate flag by same user on same content
  const existing = await db.flaggedContent.findFirst({
    where: {
      contentType,
      contentId,
      reporterId: session.user.id,
      status: 'PENDING',
    },
  });

  if (existing) {
    return NextResponse.json({ error: 'You have already flagged this content' }, { status: 409 });
  }

  const flag = await db.flaggedContent.create({
    data: {
      contentType,
      contentId,
      reason,
      description: description || null,
      reporterId: session.user.id,
    },
  });

  return NextResponse.json({ flag }, { status: 201 });
}
