// app/api/dialogue/legal-moves/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prismaclient';
import { stepInteraction } from '@/packages/ludics-engine/stepper';
import { legalAttacksFor } from '@/lib/dialogue/legalMoves'; // shape cues
import { getCurrentUserId } from '@/lib/serverutils';
import type { RCode, WCode } from '@/lib/dialogue/codes';
import { codeHelp } from '@/lib/dialogue/codes';

const Q = z.object({
  deliberationId: z.string().min(5),
  targetType: z.enum(['argument','claim','card']),
  targetId: z.string().min(5),
  locusPath: z.string().optional(),
});

export type Move = {
  kind: 'ASSERT'|'WHY'|'GROUNDS'|'RETRACT'|'CONCEDE'|'CLOSE'|'THEREFORE'|'SUPPOSE'|'DISCHARGE';
  label: string;
  payload?: any;
  disabled?: boolean;
  reason?: string;
  force?: 'ATTACK'|'SURRENDER'|'NEUTRAL';
  relevance?: 'likely'|'unlikely'|null;
  postAs?: { targetType: 'argument'|'claim'|'card'; targetId: string }; // R7 hint
};

  type Verdict = { code: string; context?: Record<string, any> };
  type MoveWithVerdict = Move & { verdict?: Verdict };

export async function GET(req: NextRequest) {
  const qs = Object.fromEntries(new URL(req.url).searchParams);
  const parsed = Q.safeParse(qs);
  if (!parsed.success) {
    return NextResponse.json({ ok:false, error: parsed.error.flatten() }, { status: 400 });
  }
    const { deliberationId, targetType, targetId, locusPath } = parsed.data;

  // --- parallelize independent reads ---
  const [targetTextRow, rows, targetAuthorRow, lastTerminator] = await Promise.all([
    targetType === 'claim'
      ? prisma.claim.findUnique({ where: { id: targetId }, select: { text: true } })
      : prisma.argument.findUnique({ where: { id: targetId }, select: { text: true } }),
  prisma.dialogueMove.findMany({
      where: { deliberationId, targetType, targetId, kind: { in: ['WHY','GROUNDS'] } },
      orderBy: { createdAt: 'asc' },
      select: { kind: true, payload: true, createdAt: true },
    }),
    targetType === 'argument'
      ? prisma.argument.findFirst({ where: { id: targetId }, select: { authorId: true } })
      : prisma.claim.findFirst({ where: { id: targetId }, select: { createdById: true } }),
    prisma.dialogueMove.findFirst({
      where: {
        deliberationId, targetType, targetId,
        OR: [
          { kind:'CLOSE', ...(locusPath ? { payload: { path:['locusPath'], equals: locusPath } } : {}) },
          { kind:'ASSERT', payload: { path:['as'], equals: 'CONCEDE' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      select: { id:true, kind:true, createdAt:true }
    })
  ]);
  const targetText = targetTextRow?.text ?? null;
 

  type Row = { kind:'WHY'|'GROUNDS'; payload:any; createdAt:Date };
  const latestByKey = new Map<string, Row>();
  for (const r of rows as Row[]) {
    const key = r?.payload?.cqId;
    if (!key) {
      console.warn('[legal-moves] Move missing cqId, skipping:', { id: (r as any)?.id, kind: r.kind, payload: r.payload });
      continue; // skip malformed moves
    }
    const prev = latestByKey.get(key);
    if (!prev || r.createdAt > prev.createdAt) latestByKey.set(key, r);
  }
  const openKeys = [...latestByKey.entries()].filter(([,v]) => v.kind === 'WHY').map(([k]) => k);
  const anyGrounds = [...latestByKey.values()].some(v => v.kind === 'GROUNDS');

  // Who can answer / who can ask?
  const targetAuthorId: string | null =
    (targetType === 'argument' ? (targetAuthorRow as any)?.authorId : (targetAuthorRow as any)?.createdById) ?? null;
 const actor = await getCurrentUserId().catch(() => null);
 const actorId = actor ? String(actor) : null;

  // Has surrender?
  // const lastTerminator = await prisma.dialogueMove.findFirst({
  //   where: {
  //     deliberationId, targetType, targetId,
  //     OR: [
  //       { kind:'CLOSE', ...(locusPath ? { payload: { path:['locusPath'], equals: locusPath } } : {}) },
  //       { kind:'ASSERT', payload: { path:['as'], equals: 'CONCEDE' } }, // CONCEDE normalized to ASSERT+as
  //     ],
  //   },
  //   orderBy: { createdAt: 'desc' },
  //   select: { id:true, kind:true, createdAt:true }
  // });
  // const isClosed = !!lastTerminator;
   const isClosed = !!lastTerminator;

  //const moves: Move[] = [];
    const moves: MoveWithVerdict[] = [];


  // GROUNDS for each open CQ — only author answers
  for (const k of openKeys) {
    const disabled = !!(actorId && targetAuthorId && actorId !== String(targetAuthorId));
    moves.push({
      kind: 'GROUNDS',
      label: `Answer ${k}`,
      payload: { cqId: k, locusPath: locusPath || '0' },
      disabled,
      reason: disabled ? 'Only the author may answer this WHY' : undefined,
       verdict: disabled
       ? { code: 'R4_ROLE_GUARD', context: { cqKey: k } }
       : { code: 'R2_OPEN_CQ_SATISFIED', context: { cqKey: k } }
    });
   
  }
  // Structural (Phase-2+) – offer once, not per CQ
  moves.push({ kind:'THEREFORE', label:'Therefore…', payload:{ locusPath: locusPath || '0' } });
  moves.push({ kind:'SUPPOSE',   label:'Suppose…',   payload:{ locusPath: locusPath || '0' } });
  moves.push({ kind:'DISCHARGE', label:'Discharge',  payload:{ locusPath: locusPath || '0' } });
 
  // WHY moves are ONLY offered through CriticalQuestions component with proper cqId
  // Generic WHY without cqId is no longer supported (causes malformed moves)
  // Users should use AttackMenuPro for structural attacks or CriticalQuestions for scheme-specific WHY

  // Concede / Retract (server will enforce invariants on POST)
  // — If claim has been answered by GROUNDS, hint to concede the *argument*
  if (targetType === 'claim' && anyGrounds) {
    const args = await prisma.argument.findMany({
      where: { deliberationId, conclusionClaimId: targetId },
      orderBy: { createdAt: 'desc' },
      select: { id:true }
    });
    if (args.length) {
    moves.push({
       kind: 'ASSERT',
        label: 'Accept argument',
        postAs: { targetType: 'argument', targetId: args[0].id },
        payload: { locusPath: locusPath || '0', as: 'ACCEPT_ARGUMENT' },
        verdict: { code: 'R7_ACCEPT_ARGUMENT', context:{ argumentId: args[0].id } }
      });
    }
  } else {
    moves.push({ kind:'CONCEDE', label:'Concede', payload: { locusPath: locusPath || '0' }});
  }
  moves.push({ kind:'RETRACT', label:'Retract', payload: { locusPath: locusPath || '0' } });



  // † when closable at locus
  if (locusPath) {
    const designs = await prisma.ludicDesign.findMany({
      where: { deliberationId },
      orderBy: [{ participantId: 'asc' }, { id: 'asc' }],
      select: { id:true, participantId:true },
    });
    const pos = designs.find(d => d.participantId === 'Proponent') ?? designs[0];
    const neg = designs.find(d => d.participantId === 'Opponent')  ?? designs[1] ?? designs[0];
    if (pos && neg) {
      const trace = await stepInteraction({
        dialogueId: deliberationId,
        posDesignId: pos.id, negDesignId: neg.id,
        phase: 'neutral', maxPairs: 256,
      }).catch(() => null);
      const closable = new Set(trace?.daimonHints?.map((h:any) => h.locusPath) ?? []);
      if (closable.has(locusPath)) {
        moves.push({ kind: 'CLOSE', label: 'Close (†)', verdict: { code: 'H2_CLOSABLE', context: { locusPath } }
, payload: { locusPath } });
      }
    }
  }

  // annotate force + soft relevance + disable ATTACK on closed
  for (const m of moves) {
    m.force =
      (m.kind === 'WHY' || m.kind === 'GROUNDS') ? 'ATTACK' :
      (m.kind === 'CONCEDE' || m.kind === 'RETRACT' || m.kind === 'CLOSE') ? 'SURRENDER' : 'NEUTRAL';
    m.relevance = m.force === 'ATTACK' ? (isClosed ? 'unlikely' : 'likely') : null;
    if (isClosed && m.force === 'ATTACK') { m.disabled = true; m.reason = 'This branch is already closed.';
      m.verdict = { code: 'R5_AFTER_SURRENDER', context: { locusPath } };
     }
  }

  return NextResponse.json({ ok:true, moves }, { headers: { 'Cache-Control': 'no-store' } });
}
