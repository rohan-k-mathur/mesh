// lib/dialogue/validate.ts
import { prisma } from '@/lib/prismaclient';

export type ReasonCode =
  | 'R1_TURN_VIOLATION'        // optional: alternation/focus rules
  | 'R2_INVALID_SHAPE'         // e.g., GROUNDS w/o an open WHY for this cq key
  | 'R3_SELF_REPLY'            // replying to your own move when not allowed
  | 'R4_DUPLICATE_REPLY'       // same reply to same target/key
  | 'R5_AFTER_SURRENDER'       // attacking a surrendered/closed branch
  | 'R6_INVALID_INITIAL'       // illegal first move in a thread
  | 'R7_ACCEPT_ARGUMENT_REQUIRED'; // concession where protocol requires accepting the argument

type Kind = 'ASSERT'|'WHY'|'GROUNDS'|'RETRACT'|'CONCEDE'|'CLOSE';
type TargetType = 'argument'|'claim'|'card';

export async function validateMove(input: {
  deliberationId: string;
  actorId: string;
  kind: Kind;
  targetType: TargetType;
  targetId: string;
  replyToMoveId?: string | null;
  replyTarget?: 'claim'|'argument'|'premise'|'link'|'presupposition' | null;
  payload: any;
}): Promise<{ ok:true } | { ok:false; reasons: ReasonCode[] }> {
  const reasons: ReasonCode[] = [];
  const { deliberationId, actorId, kind, targetType, targetId, replyToMoveId, payload } = input;
  const locusPath = String(payload?.locusPath ?? '0');
  const cqKey = String(payload?.cqId ?? payload?.schemeKey ?? 'default');

  // R3: self-reply prohibition (only when we have precise ancestry)
  if (replyToMoveId) {
    const parent = await prisma.dialogueMove.findUnique({
      where: { id: replyToMoveId },
      select: { actorId: true, kind: true }
    });
    if (parent && String(parent.actorId) === String(actorId)) {
      reasons.push('R3_SELF_REPLY');
    }
    // R7: If you're conceding where the protocol expects acceptance of the *argument*
    if ((kind === 'CONCEDE' || input.payload?.as === 'CONCEDE') && parent?.kind === 'GROUNDS') {
      reasons.push('R7_ACCEPT_ARGUMENT_REQUIRED');
    }
  }

  // R2: GROUNDS requires an *open* WHY on same key/locus
  if (kind === 'GROUNDS') {
    const last = await prisma.dialogueMove.findMany({
      where: {
        deliberationId, targetType, targetId,
        kind: { in:['WHY','GROUNDS'] },
        // optional filter by locusPath if you scope WHY/GROUNDS per locus
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { kind:true, payload:true, createdAt:true }
    });
    const latestOnKey = last.find(r => String(r.payload?.cqId ?? r.payload?.schemeKey ?? 'default') === cqKey);
    if (!latestOnKey || latestOnKey.kind !== 'WHY') reasons.push('R2_INVALID_SHAPE');
  }

  // R5: no ATTACK after surrender/† at this locus
  if (kind === 'WHY' || kind === 'GROUNDS' || (kind === 'ASSERT' && !payload?.as)) {
    const lastTerminator = await prisma.dialogueMove.findFirst({
      where: {
        deliberationId, targetType, targetId,
        OR: [
          { kind:'CLOSE', payload: { path:['locusPath'], equals: locusPath } },
          { kind:'ASSERT', payload: { path:['as'], equals: 'CONCEDE' } },
        ],
      },
      orderBy: { createdAt:'desc' },
      select: { id:true }
    });
    if (lastTerminator) reasons.push('R5_AFTER_SURRENDER');
  }

  // R4: duplicate reply to same key/locus/expr (signature-level)
  // The insert path already de-dups on (deliberationId,signature); here we block the attempt proactively.
  if (['WHY','GROUNDS','CLOSE'].includes(kind)) {
    // Reconstruct the signature the route will compute
    const sig = [
      kind === 'WHY' ? 'WHY' : kind === 'GROUNDS' ? 'GROUNDS' : 'CLOSE',
      targetType, targetId,
      kind === 'WHY' ? cqKey
      : kind === 'GROUNDS' ? cqKey
      : locusPath
    ].join(':');
    const existing = await prisma.dialogueMove.findFirst({
      where: { deliberationId, signature: { startsWith: sig } },
      select: { id:true }
    });
    if (existing) reasons.push('R4_DUPLICATE_REPLY');
  }

  // R6/R1: optional—tighten first moves & alternation if/when you expose turns.

  return reasons.length ? { ok:false, reasons } : { ok:true };
}
