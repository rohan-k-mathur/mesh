// app/api/dialogue/legal-moves/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prismaclient';
import { stepInteraction } from '@/packages/ludics-engine/stepper';
import { getCurrentUserId } from '@/lib/serverutils';
const Q = z.object({
  deliberationId: z.string().min(5),
  targetType: z.enum(['argument','claim','card']),
  targetId: z.string().min(5),
  locusPath: z.string().optional(),  // 👈 NEW (optional)
});

type Move = {
  kind: 'ASSERT'|'WHY'|'GROUNDS'|'RETRACT'|'CONCEDE'|'CLOSE'; // 👈 allow CLOSE
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
  const { deliberationId, targetType, targetId, locusPath } = parsed.data;

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

    // Find target author to gate moves by role
  let targetAuthorId: string | null = null;
  if (targetType === 'argument') {
    const a = await prisma.argument.findFirst({ where: { id: targetId }, select: { authorId:true } });
    targetAuthorId = a?.authorId ?? null;
  } else if (targetType === 'claim') {
    const c = await prisma.claim.findFirst({ where: { id: targetId }, select: { createdById:true } });
    targetAuthorId = c?.createdById ?? null;
  }

  // (you may get actorId the same way as in /move)
  // const actorId = await getCurrentUserId().catch(() => null);
  const actor = await getCurrentUserId().catch(() => null);
  const actorId = actor ? String(actor) : null;

  // Answer each open CQ (GROUNDS)

  for (const k of openKeys) {
    moves.push({
      kind:'GROUNDS',
      label:`Answer ${k}`,
      payload:{ cqId:k },
      disabled: actorId && targetAuthorId && actorId !== String(targetAuthorId),
      reason: actorId && targetAuthorId && actorId !== String(targetAuthorId) ? 'Only the author may answer this WHY' : undefined
    });
  }

  if (!openKeys.length) {
    moves.push({
      kind:'WHY',
      label:'Ask WHY',
      disabled: actorId && targetAuthorId && actorId === String(targetAuthorId),
      reason: actorId && targetAuthorId && actorId === String(targetAuthorId) ? 'You cannot ask WHY on your own claim' : undefined
    });
  }

  // Concede / Retract are always available (UI can gate by role/phase)
  moves.push({ kind:'CONCEDE', label:'Concede' });
  moves.push({ kind:'RETRACT', label:'Retract' });


  // 2) If a concrete locusPath is given, ask the stepper whether † is legal there
  if (locusPath) {
    // find current designs; tolerate races by picking current P/O
    const designs = await prisma.ludicDesign.findMany({
      where: { deliberationId },
      orderBy: [{ participantId: 'asc' }, { id: 'asc' }],
      select: { id:true, participantId:true }
    });
    const pos = designs.find(d => d.participantId === 'Proponent') ?? designs[0];
    const neg = designs.find(d => d.participantId === 'Opponent')  ?? designs[1] ?? designs[0];
    if (pos && neg) {
      const trace = await stepInteraction({
        dialogueId: deliberationId,
        posDesignId: pos.id,
        negDesignId: neg.id,
        phase: 'neutral',
        maxPairs: 256
      }).catch(() => null);
      const closable = new Set(trace?.daimonHints?.map(h => h.locusPath) ?? []);
      if (closable.has(locusPath)) {
        moves.push({ kind: 'CLOSE', label: 'Close (†)', payload: { locusPath } });
      }
    }
  }

  

  return NextResponse.json({ ok:true, moves }, { headers: { 'Cache-Control': 'no-store' } });
}
