import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';

// Optional: pull room policy to decide TTL. For MVP, 24h.
const WHY_TTL_HOURS = 24;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const deliberationId = searchParams.get('deliberationId')!;
  if (!deliberationId) return NextResponse.json({ moves: [] });

  const moves = await prisma.dialogueMove.findMany({
    where: { deliberationId },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json({ moves });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { deliberationId, targetType, targetId, kind, payload, actorId } = body as {
    deliberationId: string,
    targetType: 'argument'|'claim',
    targetId: string,
    kind: 'ASSERT'|'WHY'|'GROUNDS'|'RETRACT',
    payload?: any,
    actorId: string,
  };
  if (!deliberationId || !targetType || !targetId || !kind) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  let movePayload = payload ?? {};
  if (kind === 'WHY' && !movePayload.deadlineAt) {
    const d = new Date();
    d.setHours(d.getHours() + WHY_TTL_HOURS);
    movePayload.deadlineAt = d.toISOString();
  }

  const move = await prisma.dialogueMove.create({
    data: { deliberationId, targetType, targetId, kind, payload: movePayload as any, actorId },
  });

  // Auto-status flip (WORKSHOP) if strict and past due (MVP: check only on POST)
  // For production, handle in a cron that reads open WHY and flips when expired.

  return NextResponse.json({ ok: true, move });
}
