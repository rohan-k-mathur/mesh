// app/api/cqs/toggle/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prismaclient';
import { getCurrentUserId } from '@/lib/serverutils';
import { suggestionForCQ } from '@/lib/argumentation/cqSuggestions';
import { resolveClaimContext } from '@/lib/server/resolveRoom';
import { createClaimAttack } from '@/lib/argumentation/createClaimAttack';
import { getNLIAdapter } from '@/lib/nli/adapter';
import { bus } from '@/lib/bus';


const BodySchema = z.object({
  targetType: z.literal('claim'),
  targetId: z.string().min(1),
  schemeKey: z.string().min(1),
  cqKey: z.string().min(1),
  satisfied: z.boolean(),
  deliberationId: z.string().optional(),

  // Optional convenience for “Attach” button in CQ UI
  attachSuggestion: z.boolean().optional(),
  attackerClaimId: z.string().min(1).optional(),
});

type NliRel = 'entails'|'contradicts'|'neutral';

const NLI_THRESHOLD = 0.72; // conservative; tune later

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId().catch(() => null);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const {
    targetId, schemeKey, cqKey, satisfied,
    deliberationId: delibFromBody, attachSuggestion, attackerClaimId
  } = parsed.data;

  // Resolve deliberation/room from the claim if possible; fall back to body.deliberationId
  let { deliberationId, roomId } = await resolveClaimContext(targetId);
  if (!deliberationId && delibFromBody) {
    deliberationId = delibFromBody;
    const room = await prisma.deliberation.findUnique({
      where: { id: deliberationId },
      select: { roomId: true }
    });
    roomId = room?.roomId ?? null;
  }
  if (!deliberationId) {
    return NextResponse.json({ error: 'Unable to resolve deliberation/room for claim' }, { status: 404 });
  }

  // Scheme must exist
  const scheme = await prisma.argumentScheme.findUnique({
    where: { key: schemeKey }, select: { key: true }
  });
  if (!scheme) {
    return NextResponse.json({ error: 'Unknown schemeKey' }, { status: 400 });
  }

  // 1) Optional: attach suggested attack first (for the “Attach” CTA)
  let edgeCreated = false;
  if (attachSuggestion && !satisfied) {
    const suggest = suggestionForCQ(schemeKey, cqKey);
    if (!suggest) {
      return NextResponse.json({ error: 'No suggestion available for this CQ' }, { status: 400 });
    }
    if (!attackerClaimId) {
      return NextResponse.json({ error: 'attackerClaimId required to attach suggestion' }, { status: 400 });
    }
    await createClaimAttack({
      fromClaimId: attackerClaimId,
      toClaimId: targetId,
      deliberationId,
      suggestion: suggest,
    });
    edgeCreated = true;
  }
     // (Optional) permission guard — only author/mods may flip CQs
     const claim = await prisma.claim.findUnique({
       where: { id: targetId }, select: { createdById: true }
     });
     const isAuthor = String(claim?.createdById) === String(userId);
     // TODO: wire a real moderator check if you have one
     const isModerator = false;
     if (!isAuthor && !isModerator) {
       return NextResponse.json({ ok:false, error:'Only the claim author (or a moderator) can mark CQs satisfied/unsatisfied.' }, { status: 403 });
     }
   
     // 2) Upsert CQStatus (optimistic write; we might revert if a proof guard fails)
  // 2) Upsert CQStatus (optimistic write; we might revert if guard fails)
  const status = await prisma.cQStatus.upsert({
    where: {
      targetType_targetId_schemeKey_cqKey: {
        targetType: 'claim', targetId, schemeKey, cqKey,
      }
    },
    update: { satisfied, updatedAt: new Date() },
    create: {
      targetType: 'claim', targetId, schemeKey, cqKey,
      satisfied, createdById: String(userId), roomId,
    }
  });

  // 3) HARD GUARD: only when trying to set satisfied:true
  let hasEdge = false;
  let requiredAttack: 'rebut'|'undercut'|null = null;
  let nli: { relation: NliRel; score: number } | null = null;

  if (satisfied === true) {
    const suggest = suggestionForCQ(schemeKey, cqKey); // may be null
    requiredAttack = suggest?.type ?? null;

    // Helper: does any inbound attack exist?
    async function anyInboundAttack() {
             const e = await prisma.claimEdge.findFirst({
               where: {
                 toClaimId: targetId,
                 OR: [
                   { type: 'rebuts' },              // classic rebut
                   { attackType: 'UNDERCUTS' },     // specific undercut
                 ],
               },
               select: { id: true }
             });
             return !!e;
           }

    if (requiredAttack === 'rebut') {
      // Need an inbound rebut OR strong NLI contradiction (if attacker is known)
      const e = await prisma.claimEdge.findFirst({
        where: {
          toClaimId: targetId,
          OR: [{ type: 'rebuts' }, { attackType: 'REBUTS' as any }],
        },
        select: { id: true, fromClaimId: true }
      });
      hasEdge = !!e;

      if (!hasEdge && attackerClaimId) {
        // Run NLI only if we actually know who’s rebutting
        const adapter = getNLIAdapter();
        const [att, tgt] = await Promise.all([
          prisma.claim.findUnique({ where: { id: attackerClaimId }, select: { text: true } }),
          prisma.claim.findUnique({ where: { id: targetId },        select: { text: true } }),
        ]);
        if (att?.text && tgt?.text) {
          const [res] = await adapter.batch([{ premise: att.text, hypothesis: tgt.text }]);
          nli = res as { relation: NliRel; score: number };

          // Cache cheap, ignore dup errors
          await prisma.nLILink.create({
            data: {
              fromId: attackerClaimId, toId: targetId,
              relation: nli.relation, score: nli.score, createdById: String(userId),
            },
          }).catch(() => null);
        }
      }
    } else if (requiredAttack === 'undercut') {
             // Require an inbound undercut edge (prefer inference scope; optional)
             const e = await prisma.claimEdge.findFirst({
               where: { toClaimId: targetId, attackType: 'UNDERCUTS' /*, targetScope: 'inference' */ },
               select: { id: true }
             });
      hasEdge = !!e;
      nli = null; // not used for undercuts
    } else {
      // No specific attack type—accept any inbound attack
      hasEdge = await anyInboundAttack();
    }

    const allow =
      hasEdge ||
      (requiredAttack === 'rebut' && nli?.relation === 'contradicts' && (nli?.score ?? 0) >= NLI_THRESHOLD);

    if (!allow) {
      // Revert optimistic update
      await prisma.cQStatus.update({
        where: {
          targetType_targetId_schemeKey_cqKey: {
            targetType: 'claim', targetId, schemeKey, cqKey
          }
        },
        data: { satisfied: false, updatedAt: new Date() },
      });

      // Stable 409 payload your UI can map to a toast
      return NextResponse.json({
        ok: false,
        blocked: true,
        code: 'CQ_PROOF_OBLIGATION_NOT_MET',
        message: 'This CQ can only be marked addressed after you attach the appropriate counter (rebut/undercut) or provide a strong contradiction.',
        guard: {
          requiredAttack,
          hasEdge,
          nliRelation: nli?.relation ?? null,
          nliScore: nli?.score ?? null,
          nliThreshold: NLI_THRESHOLD,
        },
      }, { status: 409 });
    }
  }
  bus.emit('dialogue:moves:refresh', { deliberationId });
  bus.emit('claims:edges:changed', { deliberationId, targetId });
  return NextResponse.json({
    ok: true,
    status,
    edgeCreated,
    guard: {
      requiredAttack,
      hasEdge,
      nliRelation: nli?.relation ?? null,
      nliScore: nli?.score ?? null,
      nliThreshold: NLI_THRESHOLD,
    },
  });
}
