// lib/dialogue/validate.ts
export type ReasonCode = 'R1_TURN_VIOLATION'|'R2_INVALID_SHAPE'|'R3_SELF_REPLY'|
  'R4_DUPLICATE_REPLY'|'R5_AFTER_SURRENDER'|'R6_INITIAL_MOVE_VIOLATION'|'R7_ACCEPT_ARGUMENT_REQUIRED';

export async function validateMove(input: {
  deliberationId: string;
  actorId: string;
  kind: 'ASSERT'|'WHY'|'GROUNDS'|'RETRACT'|'CONCEDE'|'CLOSE';
  targetType: 'argument'|'claim'|'card';
  targetId: string;
  replyToMoveId?: string | null;
  replyTarget?: string | null;
  payload: any;
}) : Promise<{ ok: true } | { ok: false; reasons: ReasonCode[] }> {
  const reasons: ReasonCode[] = [];

  // R3 self-reply (when precise replyTo available)
  if (input.replyToMoveId) {
    const m = await prisma.dialogueMove.findUnique({ where: { id: input.replyToMoveId }, select: { actorId: true, kind: true, payload: true }});
    if (m && m.actorId === input.actorId) reasons.push('R3_SELF_REPLY');

    // R7: trying to CONCEDE φ after ARGUE that answered a WHY φ → must ACCEPT_ARGUMENT instead
    if ((input.kind === 'CONCEDE' || input.payload?.as === 'CONCEDE') && m?.kind === 'GROUNDS') {
      // (You can refine by checking that m is the answer to a WHY for same cq/key/claim)
      reasons.push('R7_ACCEPT_ARGUMENT_REQUIRED');
    }
  }

  // R4 duplicate reply (signature already helps for WHY/GROUNDS; enforce for others)
  // Quick check: is there an existing move with same signature or same (replyToMoveId, kind, replyTarget)?
  // ... add your query here ...

  // R5: no attack after surrender — if target is surrendered/closed, block WHY/GROUNDS/ASSERT (attacks)
  // ... read branch state cache or scan for recent CONCEDE/CLOSE on same node/locus ...

  // R1, R2, R6 can be layered here or in Phase 1.3 (legal-moves)
  return reasons.length ? { ok:false, reasons } : { ok:true };
}
