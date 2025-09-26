// lib/dialogue/legalMovesServer.ts
import { prisma } from '@/lib/prismaclient';
import { stepInteraction } from '@/packages/ludics-engine/stepper';

export type LegalMove = {
  kind: 'ASSERT'|'WHY'|'GROUNDS'|'RETRACT'|'CONCEDE'|'CLOSE';
  label: string;
  payload?: any;
  disabled?: boolean;
  reason?: string;
  /** When a UI asks for claim moves but R7 requires conceding the *argument*,
   *  we return the correct posting target here. Client should POST with postAs.*. */
  postAs?: { targetType: 'argument'|'claim'|'card'; targetId: string };
};

type Input = {
  deliberationId: string;
  targetType: 'argument'|'claim'|'card';
  targetId: string;
  locusPath?: string | null | undefined;
  actorId?: string | null;
};

function cqKey(p: any) { return String(p?.cqId ?? p?.schemeKey ?? 'default'); }
function exprOf(p: any) { return String(p?.expression ?? p?.brief ?? p?.note ?? '').trim(); }

export async function computeLegalMoves(input: Input): Promise<{ moves: LegalMove[]; meta: any }> {
  const { deliberationId, targetType, targetId, locusPath, actorId } = input;

  // Pull WHY/GROUNDS history to detect open critical questions (R4) and answered ones (R7).
  const wg = await prisma.dialogueMove.findMany({
    where: { deliberationId, targetType, targetId, kind: { in: ['WHY','GROUNDS'] } },
    orderBy: { createdAt: 'asc' },
    select: { id:true, kind:true, payload:true, actorId:true, createdAt:true },
  });

  // Latest entry per CQ key
  type Row = { id:string; kind:'WHY'|'GROUNDS'; payload:any; createdAt: Date };
  const latestByKey = new Map<string, Row>();
  for (const r of wg as Row[]) {
    const key = cqKey(r.payload);
    const prev = latestByKey.get(key);
    if (!prev || r.createdAt > prev.createdAt) latestByKey.set(key, r);
  }
  const openWhyKeys = [...latestByKey.entries()].filter(([,v]) => v.kind === 'WHY').map(([k])=>k);
  const anyGrounds = [...latestByKey.values()].some(v => v.kind === 'GROUNDS');

  // R5: surrendered/closed?
  // Look for last CONCEDE/CLOSE for this target (+ optional locus)
  const lastTerminator = await prisma.dialogueMove.findFirst({
    where: {
      deliberationId, targetType, targetId,
      kind: { in: ['CONCEDE','CLOSE'] },
      ...(locusPath ? { payload: { path: ['locusPath'], equals: locusPath } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    select: { id:true, kind:true, createdAt:true }
  });
  const isClosed = !!lastTerminator;

  // Optional: author role check for WHY↔GROUNDS on claims/arguments
  let targetAuthorId: string | null = null;
  if (targetType === 'argument') {
    const a = await prisma.argument.findFirst({ where: { id: targetId }, select: { authorId:true } });
    targetAuthorId = a?.authorId ?? null;
  } else if (targetType === 'claim') {
    const c = await prisma.claim.findFirst({ where: { id: targetId }, select: { createdById:true } });
    targetAuthorId = c?.createdById ?? null;
  }

  const moves: LegalMove[] = [];

  // --- R5 gating ---
  if (!isClosed) {
    // GROUNDS can only answer open WHYs (R4)
    for (const key of openWhyKeys) {
      moves.push({
        kind: 'GROUNDS',
        label: `Answer ${key}`,
        payload: { cqId: key, locusPath: locusPath || '0' },
        disabled: !!(actorId && targetAuthorId && String(actorId) !== String(targetAuthorId)),
        reason: (actorId && targetAuthorId && String(actorId) !== String(targetAuthorId))
          ? 'Only the author may answer this WHY' : undefined
      });
    }

    if (openWhyKeys.length === 0) {
      // If there is no open WHY, anyone-but-author can ask WHY
      moves.push({
        kind: 'WHY',
        label: 'Ask WHY',
        payload: { locusPath: locusPath || '0' },
        disabled: !!(actorId && targetAuthorId && String(actorId) === String(targetAuthorId)),
        reason: (actorId && targetAuthorId && String(actorId) === String(targetAuthorId))
          ? 'You cannot ask WHY on your own claim' : undefined
      });
    }
  }

  // R7: if a WHY on a **claim** was answered by GROUNDS (argument),
  // then concession should target the *argument*, not the bare claim.
  const concedeMoves: LegalMove[] = [];
  if (!isClosed) {
    if (targetType === 'claim' && anyGrounds) {
      // Try to find candidate arguments attached to this claim
      const args = await prisma.argument.findMany({
        where: { deliberationId, claimId: targetId },
        orderBy: { createdAt: 'desc' },
        select: { id:true }
      });
      if (args.length) {
        concedeMoves.push({
          kind: 'CONCEDE',
          label: 'Accept argument',
          // UI should post to the *argument*, not the claim (R7)
          postAs: { targetType: 'argument', targetId: args[0].id },
          payload: { locusPath: locusPath || '0' },
        });
      } else {
        // Fallback: suppress conceding the claim if we know WHY has been answered,
        // but no argument was found/linked yet.
      }
    } else {
      // Normal concede on target (argument/claim/card)
      concedeMoves.push({ kind: 'CONCEDE', label: 'Concede', payload: { locusPath: locusPath || '0' } });
    }
  }

  // Retract is always available (protocol-wise); UI can further restrict.
  const retractMove: LegalMove = { kind: 'RETRACT', label: 'Retract', payload: { locusPath: locusPath || '0' } };

  // †: ask stepper whether CLOSE is legal at this locus
  let closable = false;
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
      if (locusPath && hints.has(locusPath)) closable = true;
      if (locusPath && closable) {
        moves.push({ kind: 'CLOSE', label: 'Close (†)', payload: { locusPath } });
      }
    }
  } catch {}

  // Assemble respecting R5 (isClosed → no attacks)
  const attackMoves = isClosed ? [] : moves;
  const out: LegalMove[] = [
    ...attackMoves,
    ...concedeMoves,
    retractMove,
  ];

  // R4 duplicate guard (cheap): mark GROUNDS duplicates (same cq + same expr + locus) as disabled
  // NOTE: POST will still validate strictly; this is just a nicer UX hint in GET.
  if (!isClosed) {
    for (const m of out) {
      if (m.kind === 'GROUNDS') {
        const key = cqKey(m.payload);
        const expr = exprOf(m.payload);
        const dup = await prisma.dialogueMove.findFirst({
          where: {
            deliberationId, targetType, targetId, kind: 'GROUNDS',
            payload: {
              path: [],
              array_contains: undefined, // noop for pgjson
            }
          },
          // Prisma can't express "same cqId + same locus + same expr" easily with pure JSON filters,
          // keep POST as the strict enforcement. Here we only annotate "possibly duplicate".
        }).catch(() => null);
        if (dup) {
          m.disabled = true;
          m.reason = 'A similar answer may already exist';
        }
      }
    }
  }

  return {
    moves: out,
    meta: { openWhyKeys, isClosed, anyGrounds, targetAuthorId, closable }
  };
}
