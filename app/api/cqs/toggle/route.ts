import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prismaclient';
import { getCurrentUserId } from '@/lib/serverutils';
import { suggestionForCQ } from '@/lib/argumentation/cqSuggestions';
import { resolveClaimContext } from '@/lib/server/resolveRoom';
import { createClaimAttack } from '@/lib/argumentation/createClaimAttack';
import { getNLIAdapter } from '@/lib/nli/adapter';

const BodySchema = z.object({
  targetType: z.literal('claim'),
  targetId: z.string().min(1),
  schemeKey: z.string().min(1),
  cqKey: z.string().min(1),
  satisfied: z.boolean(),
  deliberationId: z.string().optional(),
  attachSuggestion: z.boolean().optional(),
  attackerClaimId: z.string().min(1).optional(),
});

const NLI_THRESHOLD = 0.72; // conservative; tune later

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const {
    targetId, schemeKey, cqKey, satisfied,
    attachSuggestion, attackerClaimId, deliberationId: delibFromBody
  } = parsed.data;

  // Resolve deliberation + room
  let { deliberationId, roomId } = await resolveClaimContext(targetId);
  if (!deliberationId && delibFromBody) {
    deliberationId = delibFromBody;
    const room = await prisma.deliberation.findUnique({
      where: { id: deliberationId }, select: { roomId: true },
    });
    roomId = room?.roomId ?? null;
  }
  if (!deliberationId) {
    return NextResponse.json({ error: 'Unable to resolve deliberation/room for claim' }, { status: 404 });
  }

  // Validate scheme exists
  const scheme = await prisma.argumentScheme.findUnique({ where: { key: schemeKey }, select: { key: true } });
  if (!scheme) return NextResponse.json({ error: 'Unknown schemeKey' }, { status: 400 });

  // Optionally attach suggestion first
  let edgeCreated = false;
  if (attachSuggestion && !satisfied) {
    const suggest = suggestionForCQ(schemeKey, cqKey);
    if (suggest && attackerClaimId) {
      await createClaimAttack({
        fromClaimId: attackerClaimId,
        toClaimId: targetId,
        deliberationId,
        suggestion: suggest,
      });
      edgeCreated = true;
    } else if (suggest && !attackerClaimId) {
      return NextResponse.json({ error: 'attackerClaimId required to attach suggestion' }, { status: 400 });
    }
  }

  // Upsert CQStatus early (optimistic), we may revise below if guard fails
  const status = await prisma.cQStatus.upsert({
    where: { targetType_targetId_schemeKey_cqKey: { targetType: 'claim', targetId, schemeKey, cqKey } },
    update: { satisfied, updatedAt: new Date() },
    create: { targetType: 'claim', targetId, schemeKey, cqKey, satisfied, createdById: String(userId), roomId },
  });

  // --- HARD GUARD only applies when trying to set satisfied:true ---
  let hasEdge = false;
  let nli: { relation: 'entails'|'contradicts'|'neutral'; score: number } | null = null;
  let requiredAttack: 'rebut'|'undercut'|null = null;

  if (satisfied === true) {
    const suggest = suggestionForCQ(schemeKey, cqKey); // may be null
    // If we know the intended attack, enforce it; else fall back to "some inbound attack"
    requiredAttack = suggest?.type ?? null;

    // 1) Check for a matching edge
    if (requiredAttack === 'rebut') {
      const e = await prisma.claimEdge.findFirst({
        where: {
          toClaimId: targetId,
          OR: [
            { type: 'rebuts' },
            { attackType: 'REBUTS' as any }, // your schema uses both in places
          ],
        },
        select: { id: true, fromClaimId: true },
      });
      hasEdge = !!e;

      // 2) If attackerClaimId was supplied, run NLI as an additional check (and cache)
      if (attackerClaimId) {
        const adapter = getNLIAdapter();
        const attacker = await prisma.claim.findUnique({ where: { id: attackerClaimId }, select: { text: true } });
        const target = await prisma.claim.findUnique({ where: { id: targetId }, select: { text: true } });
        if (attacker?.text && target?.text) {
          const [res] = await adapter.batch([{ premise: attacker.text, hypothesis: target.text }]);
          nli = res;
          // cache
          await prisma.nLILink.create({
            data: { fromId: attackerClaimId, toId: targetId, relation: res.relation, score: res.score, createdById: String(userId) },
          }).catch(() => null);
        }
      }
    } else if (requiredAttack === 'undercut') {
      const e = await prisma.claimEdge.findFirst({
        where: {
          toClaimId: targetId,
          OR: [
            { type: 'undercuts' as any },     // if you store it this way in some places
            { attackType: 'UNDERCUTS' as any }
          ],
        },
        select: { id: true },
      });
      hasEdge = !!e;
      // Under-cuts are about warrants, NLI on conclusion is weak evidence; we do not gate on NLI here.
      nli = null;
    } else {
      // Unknown/unspecified: accept any inbound attack edge as satisfying
      const e = await prisma.claimEdge.findFirst({
        where: {
          toClaimId: targetId,
          OR: [
            { type: 'rebuts' }, { attackType: 'REBUTS' as any },
            { type: 'undercuts' as any }, { attackType: 'UNDERCUTS' as any },
          ],
        },
        select: { id: true },
      });
      hasEdge = !!e;
    }

    // Decide if we allow satisfied:true
    const allow =
      hasEdge ||
      (requiredAttack === 'rebut' && nli?.relation === 'contradicts' && (nli?.score ?? 0) >= NLI_THRESHOLD);

    if (!allow) {
      // revert the optimistic upsert → set back to false
      await prisma.cQStatus.update({
        where: { targetType_targetId_schemeKey_cqKey: { targetType: 'claim', targetId, schemeKey, cqKey } },
        data: { satisfied: false, updatedAt: new Date() },
      });
      return NextResponse.json({
        ok: false,
        blocked: true,
        reason: 'CQ requires an attached attack (rebut/undercut) or a strong NLI contradiction.',
        details: {
          requiredAttack,
          hasEdge,
          nliRelation: nli?.relation ?? null,
          nliScore: nli?.score ?? null,
          nliThreshold: NLI_THRESHOLD,
        },
      }, { status: 409 });
    }
  }

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
