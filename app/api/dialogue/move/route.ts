import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';

const WHY_TTL_HOURS = 24;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const deliberationId = searchParams.get('deliberationId')!;
  const targetType = searchParams.get('targetType') || undefined;
  const targetId = searchParams.get('targetId') || undefined;

  if (!deliberationId) return NextResponse.json({ moves: [] });

  const moves = await prisma.dialogueMove.findMany({
    where: { deliberationId, ...(targetType && { targetType }), ...(targetId && { targetId }) },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json({ moves });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  let { deliberationId, targetType, targetId, kind, payload, actorId } = body as {
    deliberationId?: string,
    targetType?: 'argument'|'claim',
    targetId?: string,
    kind?: 'ASSERT'|'WHY'|'GROUNDS'|'RETRACT'|string,
    payload?: any,
    actorId?: string,
  };

  if (!deliberationId || !targetType || !targetId || !kind) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  // Normalize "CONCEDE" to existing enum without schema change
  if (kind === 'CONCEDE') {
    kind = 'ASSERT';
    payload = { ...(payload || {}), as: 'CONCEDE' };
  }

  // WHY auto-deadline if none provided
  if (kind === 'WHY') {
    const d = new Date();
    d.setHours(d.getHours() + WHY_TTL_HOURS);
    payload = { ...(payload || {}), deadlineAt: payload?.deadlineAt || d.toISOString() };
  }

  const move = await prisma.dialogueMove.create({
    data: { deliberationId, targetType, targetId, kind: kind as any, payload: payload as any, actorId: actorId || 'unknown' },
  });

  return NextResponse.json({ ok: true, move });
}
