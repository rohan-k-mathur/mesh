// app/api/dialogue/legal-moves/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prismaclient';

const Q = z.object({
  deliberationId: z.string().min(5),
  targetType: z.enum(['argument','claim','card']),
  targetId: z.string().min(5),
});

type Move = {
  kind: 'ASSERT'|'WHY'|'GROUNDS'|'RETRACT'|'CONCEDE';
  label: string;
  payload?: any;
  disabled?: boolean;
  reason?: string;
};

export async function GET(req: NextRequest) {
  const qs = Object.fromEntries(new URL(req.url).searchParams);
  const parsed = Q.safeParse(qs);
  if (!parsed.success) {
    return NextResponse.json({ ok:false, error: parsed.error.flatten() }, { status: 400 });
  }
  const { deliberationId, targetType, targetId } = parsed.data;

  // Open CQs for this target (WHY not superseded by later GROUNDS)
  const rows = await prisma.dialogueMove.findMany({
    where: { deliberationId, targetId, kind: { in: ['WHY','GROUNDS'] } },
    orderBy: { createdAt: 'asc' },
    select: { kind: true, payload: true, createdAt: true },
  });

  type Row = { kind:'WHY'|'GROUNDS'; payload:any; createdAt:Date };
  const latestByKey = new Map<string, Row>();
  for (const r of rows as Row[]) {
    const key = String(r?.payload?.cqId ?? r?.payload?.schemeKey ?? 'default');
    const prev = latestByKey.get(key);
    if (!prev || r.createdAt > prev.createdAt) latestByKey.set(key, r);
  }
  const openKeys = [...latestByKey.entries()].filter(([,v]) => v.kind === 'WHY').map(([k]) => k);

  const moves: Move[] = [];

  // Answer each open CQ (GROUNDS)
  for (const k of openKeys) {
    moves.push({ kind:'GROUNDS', label: `Answer ${k}`, payload: { cqId: k } });
  }

  // Always allow WHY when no open WHYs (simple policy)
  if (!openKeys.length) {
    moves.push({ kind:'WHY', label: 'Challenge' });
  }

  // Concede / Retract are always available (UI can gate by role/phase)
  moves.push({ kind:'CONCEDE', label:'Concede' });
  moves.push({ kind:'RETRACT', label:'Retract' });

  return NextResponse.json({ ok:true, moves }, { headers: { 'Cache-Control': 'no-store' } });
}
