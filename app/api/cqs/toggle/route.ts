import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prismaclient';
import { getCurrentUserId } from '@/lib/serverutils';
import { suggestionForCQ } from '@/lib/argumentation/cqSuggestions';
import { resolveClaimContext } from '@/lib/server/resolveRoom';
import { createClaimAttack } from '@/lib/argumentation/createClaimAttack';

const BodySchema = z.object({
  targetType: z.literal('claim'),
  targetId: z.string().min(1),        // claim id
  schemeKey: z.string().min(1),
  cqKey: z.string().min(1),
  satisfied: z.boolean(),
  attachSuggestion: z.boolean().optional(),
  // Optional: if you already know the attacking claim
  attackerClaimId: z.string().min(1).optional(),
});

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { targetId, schemeKey, cqKey, satisfied, attachSuggestion, attackerClaimId } = parsed.data;

  // Resolve deliberation + room for the target claim
  const { deliberationId, roomId } = await resolveClaimContext(targetId);
  if (!deliberationId || !roomId) {
    return NextResponse.json({ error: 'Unable to resolve deliberation/room for claim' }, { status: 404 });
  }

  // Optional: verify scheme exists (and CQ key, if you want)
  const scheme = await prisma.argumentScheme.findUnique({
    where: { key: schemeKey },
    select: { key: true },
  });
  if (!scheme) return NextResponse.json({ error: 'Unknown schemeKey' }, { status: 400 });

  // Upsert CQStatus with denormed roomId
  const status = await prisma.cQStatus.upsert({
    where: {
      targetType_targetId_schemeKey_cqKey: {
        targetType: 'claim',
        targetId,
        schemeKey,
        cqKey,
      },
    },
    update: { satisfied, updatedAt: new Date() },
    create: {
      targetType: 'claim',
      targetId,
      schemeKey,
      cqKey,
      satisfied,
      createdById: String(userId),
      roomId, // RLS denorm
    },
  });

  // If the CQ is unmet and user asked to attach, create the proper ClaimEdge
  if (attachSuggestion && satisfied === false) {
    const suggest = suggestionForCQ(schemeKey, cqKey);
    if (suggest) {
      // If you don't have an "attacker" claim yet, you can:
      //  a) create a lightweight counter-claim first, then attach; or
      //  b) use a known attackerClaimId provided by the caller.
      if (!attackerClaimId) {
        // Option A (no attacker available): skip edge creation silently
        // or return a 400 asking for attackerClaimId if you prefer strictness.
      } else {
        await createClaimAttack({
          fromClaimId: attackerClaimId,
          toClaimId: targetId,
          deliberationId,
          suggestion: suggest,
        });
      }
    }
  }

  return NextResponse.json({ ok: true, status });
}
