import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const trackSchema = z.object({
  adId: z.string().min(1, 'adId is required'),
  type: z.enum(['impression', 'click']),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = trackSchema.parse(body);

    const existing = await db.ad.findUnique({
      where: { id: validated.adId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Ad not found' },
        { status: 404 }
      );
    }

    if (validated.type === 'impression') {
      await db.ad.update({
        where: { id: validated.adId },
        data: { impressions: { increment: 1 } },
      });
    } else {
      await db.ad.update({
        where: { id: validated.adId },
        data: { clicks: { increment: 1 } },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Ad track error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
