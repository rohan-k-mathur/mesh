import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';
import { recomputeGroundedForDelib } from '@/lib/ceg/grounded';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const cqId = params.id;
  const body = await req.json();
  const { counterFromClaimId, createdById } = body as { counterFromClaimId: string; createdById: string };

  const cq = await prisma.criticalQuestion.findUnique({
    where: { id: cqId },
    include: { instance: true },
  });
  if (!cq) return NextResponse.json({ error: 'CQ not found' }, { status: 404 });

  // target is the instance target (we assume targetType='claim' for MVP)
  const targetClaimId = cq.instance.targetId;
  const instance = cq.instance;

  // map attackKind -> ClaimEdge fields
  const atk = cq.attackKind.toUpperCase(); // 'UNDERCUTS'|'UNDERMINES'|'REBUTS'
  const attackType = (['UNDERCUTS','UNDERMINES','REBUTS'].includes(atk) ? atk : 'REBUTS') as any;
  const type = 'rebuts'; // all three count as Dung-attack

  // get deliberationId if linked
  const targetClaim = await prisma.claim.findUnique({ where: { id: targetClaimId }, select: { deliberationId: true } });

  const edge = await prisma.claimEdge.create({
    data: {
      fromClaimId: counterFromClaimId,
      toClaimId: targetClaimId,
      type,
      attackType,
      deliberationId: targetClaim?.deliberationId ?? null,
    } as any,
  });

  await prisma.criticalQuestion.update({
    where: { id: cqId },
    data: { status: 'counter-posted', resolvedById: createdById },
  });

  await recomputeGroundedForDelib(targetClaim?.deliberationId ?? null);

  return NextResponse.json({ ok: true, edgeId: edge.id });
}
