import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';
import { getCurrentUserId } from '@/lib/serverutils';

type Move = {
  id: string;
  deliberationId: string;
  targetType: 'argument'|'claim';
  targetId: string;
  kind: 'ASSERT'|'WHY'|'GROUNDS'|'RETRACT';
  payload: any | null;
  actorId: string | null;
  createdAt: string; // ISO
};

function computeUnresolvedWhy(moves: Move[]) {
  const unresolved: Record<string, Move> = {};
  const byTarget: Record<string, Move[]> = {};
  for (const m of moves) {
    const k = `${m.targetType}:${m.targetId}`;
    (byTarget[k] ||= []).push(m);
  }
  for (const [k, arr] of Object.entries(byTarget)) {
    arr.sort((a,b) => +new Date(a.createdAt) - +new Date(b.createdAt));
    let lastWhy: Move | null = null;
    for (const m of arr) {
      if (m.kind === 'WHY') lastWhy = m;
      else if (m.kind === 'GROUNDS' || m.kind === 'RETRACT') lastWhy = null;
    }
    if (lastWhy) unresolved[k] = lastWhy;
  }
  return unresolved;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await prisma.dialogueMove.findMany({
    where: { deliberationId: params.id },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true, deliberationId: true, targetType: true, targetId: true,
      kind: true, payload: true, actorId: true, createdAt: true,
    },
  });

  const items: Move[] = rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() }));
  const unresolvedByTarget = computeUnresolvedWhy(items);

  return NextResponse.json({ ok: true, items, unresolvedByTarget });
}
