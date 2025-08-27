import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';
import { mintClaimMoid } from '@/lib/ids/mintMoid';
import { recomputeGroundedForDelib } from '@/lib/ceg/grounded';

export async function POST(req: NextRequest, { params }: { params: { delib: string; id: string } }) {
  try {
    const deliberationId = params.delib;
    const cardId = params.id;
    const { counterClaimId } = await req.json() as { counterClaimId: string };
    if (!counterClaimId) return NextResponse.json({ error: 'counterClaimId required' }, { status: 400 });

    const card = await prisma.deliberationCard.findFirst({
      where: { id: cardId, deliberationId },
      select: { claimText: true },
    });
    if (!card) return NextResponse.json({ error: 'Card not found in deliberation' }, { status: 404 });

    const moid = mintClaimMoid(card.claimText);
    let target = await prisma.claim.findUnique({ where: { moid } });
    if (!target) {
      target = await prisma.claim.create({
        data: {
          text: card.claimText,
          createdById: 'system',
          moid,
          deliberationId,
        },
      });
    }

    const edge = await prisma.claimEdge.create({
      data: {
        fromClaimId: counterClaimId,
        toClaimId: target.id,
        type: 'rebuts',
        attackType: 'UNDERCUTS',
        deliberationId,
      } as any,
    });

    try { await recomputeGroundedForDelib(deliberationId); } catch {}

    return NextResponse.json({ ok: true, edgeId: edge.id, targetClaimId: target.id });
  } catch (e: any) {
    console.error('[delib/cards/warrant/undercut] failed', e);
    return NextResponse.json({ error: e?.message ?? 'failed' }, { status: 400 });
  }
}
