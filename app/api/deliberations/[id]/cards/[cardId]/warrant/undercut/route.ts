import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';
import { recomputeGroundedForDelib } from '@/lib/ceg/grounded';

export async function POST(
  req: NextRequest,
  { params }: { params: { delib: string; id: string } }
) {
  try {
    const deliberationId = params.delib;
    const cardId = params.id;
    const { counterClaimId } = (await req.json()) as { counterClaimId: string };
    if (!counterClaimId) {
      return NextResponse.json({ error: 'counterClaimId required' }, { status: 400 });
    }

    const card = await prisma.deliberationCard.findFirst({
      where: { id: cardId, deliberationId },
      select: { claimId: true, claimText: true },
    });
    if (!card) {
      return NextResponse.json({ error: 'Card not found in deliberation' }, { status: 404 });
    }

    // Ensure the target claim exists (cards now always have claimId, but fallback just in case)
let targetClaimId = card.claimId;
if (!targetClaimId) {
  const moid = crypto.createHash('sha256').update(card.claimText).digest('hex');
  const claim = await prisma.claim.upsert({
    where: { moid },
    update: {}, // nothing to update
    create: {
      text: card.claimText,
      createdById: 'system',
      deliberationId,
      moid,
    },
  });
  targetClaimId = claim.id;
  await prisma.deliberationCard.update({
    where: { id: cardId },
    data: { claimId: claim.id },
  });
}

const edge = await prisma.claimEdge.create({
  data: {
    fromClaimId: counterClaimId,
    toClaimId: targetClaimId,
    type: 'rebuts',
    attackType: 'UNDERCUTS',
    targetScope: 'inference',
    deliberationId,
  },
});

    try { await recomputeGroundedForDelib(deliberationId); } catch {}

    return NextResponse.json({ ok: true, edgeId: edge.id, targetClaimId });
  } catch (e: any) {
    console.error('[cards/warrant/undercut] failed', e);
    return NextResponse.json({ error: e?.message ?? 'failed' }, { status: 400 });
  }
}
