import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// PATCH /api/flagged/[id] - Review a flagged content item
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;
  const body = await request.json();
  const { status, reviewNotes, takeAction } = body;

  if (!['REVIEWED', 'DISMISSED', 'ACTION_TAKEN'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const existing = await db.flaggedContent.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Flag not found' }, { status: 404 });
  }

  const flag = await db.flaggedContent.update({
    where: { id },
    data: {
      status,
      reviewNotes: reviewNotes || null,
      reviewedAt: new Date(),
      reviewedById: session.user.id,
    },
  });

  // If takeAction is true and content is a comment, reject/spam it
  if (takeAction && existing.contentType === 'COMMENT') {
    await db.comment.update({
      where: { id: existing.contentId },
      data: { status: 'REJECTED' },
    });
  }

  // If takeAction is true and content is a post, reject it
  if (takeAction && existing.contentType === 'POST') {
    await db.post.update({
      where: { id: existing.contentId },
      data: { status: 'REJECTED', rejectedReason: `Flagged content: ${existing.reason}` },
    });
  }

  return NextResponse.json({ flag });
}
