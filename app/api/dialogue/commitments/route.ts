// app/api/dialogue/commitments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prismaclient';
import { getCurrentUserId } from '@/lib/serverutils';

const Q = z.object({ 
  deliberationId: z.string().min(5),
  limit: z.coerce.number().min(1).max(500).optional().default(100),
  offset: z.coerce.number().min(0).optional().default(0),
});

export async function GET(req: NextRequest) {
  const qs = Object.fromEntries(new URL(req.url).searchParams);
  const parsed = Q.safeParse(qs);
  if (!parsed.success) return NextResponse.json({ ok:false, error: parsed.error.flatten() }, { status: 400 });

  // Authorization check
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { deliberationId, limit, offset } = parsed.data;

  // Verify deliberation exists and user has access
  const deliberation = await prisma.deliberation.findUnique({
    where: { id: deliberationId },
    select: { id: true, roomId: true }
  });

  if (!deliberation) {
    return NextResponse.json({ ok: false, error: "Deliberation not found" }, { status: 404 });
  }

  // Check room access if deliberation has a roomId
  if (deliberation.roomId) {
    const roomMember = await prisma.roomMember.findFirst({
      where: {
        roomId: deliberation.roomId,
        userId: userId
      }
    });

    if (!roomMember) {
      return NextResponse.json({ ok: false, error: "Access denied" }, { status: 403 });
    }
  }

  // Get total count for pagination metadata
  const total = await prisma.commitment.count({
    where: { deliberationId, isRetracted: false }
  });

  // Fixed: Removed locusPath field that doesn't exist in Commitment schema
  const rows = await prisma.commitment.findMany({
    where: { deliberationId, isRetracted: false },
    orderBy: { createdAt: 'asc' },
    select: { participantId:true, proposition:true, createdAt:true },
    skip: offset,
    take: limit,
  });

  const byUser: Record<string, Array<{ proposition:string; createdAt:string }>> = {};
  for (const r of rows) {
    const u = String(r.participantId);
    byUser[u] ??= [];
    byUser[u].push({ proposition: r.proposition, createdAt: r.createdAt.toISOString() });
  }

  return NextResponse.json({ 
    ok:true, 
    commitments: byUser,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + rows.length < total
    }
  }, { headers: { 'Cache-Control': 'no-store' } });
}
