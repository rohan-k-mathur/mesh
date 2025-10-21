// lib/dialogue/legalMovesServer.ts
import { prisma } from '@/lib/prismaclient';
import { stepInteraction } from '@/packages/ludics-engine/stepper';
import type { MoveKind } from './types'; // (ok to remove if unused)
import { legalAttacksFor } from '@/lib/dialogue/legalMoves';

export type Move = {
  kind: 'ASSERT'|'WHY'|'GROUNDS'|'RETRACT'|'CONCEDE'|'CLOSE'|'THEREFORE'|'SUPPOSE'|'DISCHARGE';
  label: string;
  payload?: any;
  disabled?: boolean;
  reason?: string;
  force?: 'ATTACK'|'SURRENDER'|'NEUTRAL';
  relevance?: 'likely'|'unlikely'|null;
  postAs?: { targetType: 'argument'|'claim'|'card'; targetId: string };
};

type Input = {
  deliberationId: string;
  targetType: 'argument'|'claim'|'card';
  targetId: string;
  locusPath?: string | null | undefined;
  actorId?: string | null;
};

function cqKey(p: any) {
  const key = p?.cqId;
  if (!key) {
    console.warn('[legalMovesServer] Payload missing cqId:', { cqId: p?.cqId, schemeKey: p?.schemeKey });
    return p?.schemeKey ?? 'unknown';
  }
  return String(key);
}
function exprOf(p: any) { return String(p?.expression ?? p?.brief ?? p?.note ?? '').trim(); }

export async function computeLegalMoves(input: Input): Promise<{ moves: Move[]; meta: any }> {
  const { deliberationId, targetType, targetId, locusPath, actorId } = input;

  // Pull WHY/GROUNDS history to detect open critical questions
  const wg = await prisma.dialogueMove.findMany({
    where: { deliberationId, targetType, targetId, kind: { in: ['WHY','GROUNDS'] } },
    orderBy: { createdAt: 'asc' },
    select: { id:true, kind:true, payload:true, actorId:true, createdAt:true },
  });

  type Row = { id:string; kind:'WHY'|'GROUNDS'; payload:any; createdAt: Date };
  const latestByKey = new Map<string, Row>();
  for (const r of wg as Row[]) {
    const key = cqKey(r.payload);
    const prev = latestByKey.get(key);
    if (!prev || r.createdAt > prev.createdAt) latestByKey.set(key, r);
  }
  const openWhyKeys = [...latestByKey.entries()].filter(([,v]) => v.kind === 'WHY').map(([k])=>k);
  const anyGrounds = [...latestByKey.values()].some(v => v.kind === 'GROUNDS');

  // Check if surrendered/closed at this locus
  const lastTerminator = await prisma.dialogueMove.findFirst({
    where: {
      deliberationId, targetType, targetId,
      kind: { in: ['CONCEDE','CLOSE'] },
      ...(locusPath ? { payload: { path: ['locusPath'], equals: locusPath } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    select: { id:true }
  });
  const isClosed = !!lastTerminator;

  // Author of the target (only author may answer WHY on their item)
  let targetAuthorId: string | null = null;
  if (targetType === 'argument') {
    const a = await prisma.argument.findFirst({ where: { id: targetId }, select: { authorId:true } });
    targetAuthorId = a?.authorId ?? null;
  } else if (targetType === 'claim') {
    const c = await prisma.claim.findFirst({ where: { id: targetId }, select: { createdById:true } });
    targetAuthorId = c?.createdById ?? null;
  }

  const moves: Move[] = [];

  if (!isClosed) {
    // GROUNDS: only author answers open WHYs
    for (const key of openWhyKeys) {
      const disabled = !!(actorId && targetAuthorId && String(actorId) !== String(targetAuthorId));
      moves.push({
        kind: 'GROUNDS',
        label: `Answer ${key}`,
        payload: { cqId: key, locusPath: locusPath || '0' },
        disabled,
        reason: disabled ? 'Only the author may answer this WHY' : undefined
      });
    }

    // WHY (when none open): anyone but author
    if (openWhyKeys.length === 0) {
      // Optional: hint from shape
      let label = 'Ask WHY';
      const text =
        targetType === 'argument'
          ? (await prisma.argument.findFirst({ where: { id: targetId }, select: { text:true } }))?.text ?? null
          : (await prisma.claim.findFirst({ where: { id: targetId }, select: { text:true } }))?.text ?? null;
      if (text) {
        const { options } = legalAttacksFor(text);
        if (options.length) label = `WHY — ${options[0].label}`;
      }
      const disabled = !!(actorId && targetAuthorId && String(actorId) === String(targetAuthorId));
      moves.push({
        kind: 'WHY',
        label,
        payload: { locusPath: locusPath || '0' },
        disabled,
        reason: disabled ? 'You cannot ask WHY on your own item' : undefined
      });
    }
  }

  // Concede (R7: if WHY on a claim was answered, accept the argument, not the bare claim)
  const concede: Move[] = [];
  if (!isClosed) {
    if (targetType === 'claim' && anyGrounds) {
      const args = await prisma.argument.findMany({
        where: { deliberationId, claimId: targetId },
        orderBy: { createdAt: 'desc' },
        select: { id:true }
      });
      if (args.length) {
        concede.push({
          kind: 'CONCEDE',
          label: 'Accept argument',
          postAs: { targetType: 'argument', targetId: args[0].id },
          payload: { locusPath: locusPath || '0' },
        });
      }
    } else {
      concede.push({ kind: 'CONCEDE', label: 'Concede', payload: { locusPath: locusPath || '0' } });
    }
  }

  // Retract is always available
  const retract: Move = { kind: 'RETRACT', label: 'Retract', payload: { locusPath: locusPath || '0' } };

  // † closability via stepper hint
  try {
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
        posDesignId: pos.id, negDesignId: neg.id,
        phase: 'neutral', maxPairs: 256
      }).catch(() => null);
      const hints = new Set(trace?.daimonHints?.map((h:any) => h.locusPath) ?? []);
      if (locusPath && hints.has(locusPath)) {
        moves.push({ kind: 'CLOSE', label: 'Close (†)', payload: { locusPath } });
      }
    }
  } catch {}

  // Tag forces
  const all: Move[] = [
    ...(isClosed ? [] : moves),
    ...concede,
    retract,
  ].map(m => ({
    ...m,
    force: (m.kind === 'WHY' || m.kind === 'GROUNDS') ? 'ATTACK'
         : (m.kind === 'CONCEDE' || m.kind === 'RETRACT' || m.kind === 'CLOSE') ? 'SURRENDER'
         : 'NEUTRAL'
  }));

  return {
    moves: all,
    meta: { openWhyKeys, isClosed, anyGrounds, targetAuthorId }
  };
}
