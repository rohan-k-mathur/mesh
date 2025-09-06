// app/api/cqs/toggle/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';

type Body = {
  targetType: 'claim';
  targetId: string;
  schemeKey: string;
  cqKey: string;
  satisfied: boolean;
  deliberationId?: string;
  attachSuggestion?: boolean;
  attackerClaimId?: string;
  suggestion?: { type?: 'undercut' | 'rebut'; scope?: 'premise' | 'conclusion' };
};

export async function POST(req: Request) {
  const b = (await req.json()) as Body;
  if (b.targetType !== 'claim') {
    return NextResponse.json({ error: 'unsupported targetType' }, { status: 400 });
  }

  // 1) Mark CQ status
  await prisma.cQStatus.upsert({
    where: {
      targetType_targetId_schemeKey_cqKey: {
        targetType: 'claim',
        targetId: b.targetId,
        schemeKey: b.schemeKey,
        cqKey: b.cqKey,
      },
    },
    update: { satisfied: b.satisfied },
    create: {
      targetType: 'claim',
      targetId: b.targetId,
      schemeKey: b.schemeKey,
      cqKey: b.cqKey,
      satisfied: b.satisfied,
      createdById: 'system', // or real user if you thread auth here
      roomId: undefined,
    },
  });

  // 2) If we were asked to attach a counter/evidence, create edges and a GraphEdge with meta
  if (b.attachSuggestion && b.attackerClaimId) {
    const sgType = b.suggestion?.type ?? 'rebut';
    const scope  = b.suggestion?.scope; // 'premise' | 'conclusion' | undefined

    // Create an attacker edge at the claim layer
    await prisma.claimEdge.create({
      data: {
        fromClaimId: b.attackerClaimId,
        toClaimId: b.targetId,
        type: 'rebuts',
        attackType: sgType === 'undercut' ? 'UNDERCUTS' : 'REBUTS',
        targetScope: scope, // 'premise'|'conclusion' (undercut often targets 'inference')
        deliberationId: b.deliberationId,
      },
    }).catch(() => { /* idempotency / duplicates */ });

    // Resolve room for GraphEdge (optional but useful for analytics)
    let roomId = 'unknown';
    try {
      const claim = await prisma.claim.findUnique({
        where: { id: b.targetId },
        select: { deliberation: { select: { roomId: true } } },
      });
      roomId = claim?.deliberation?.roomId ?? roomId;
    } catch {}

    // GraphEdge with scheme/cq meta so the UI can unlock this exact checkbox
    await prisma.graphEdge.create({
      data: {
        fromId: b.attackerClaimId,
        toId: b.targetId,
        type: sgType === 'undercut' ? 'undercut' : 'rebut',
        scope: scope ?? (sgType === 'undercut' ? 'inference' : 'conclusion'),
        roomId,
        createdById: 'system',
        meta: { schemeKey: b.schemeKey, cqKey: b.cqKey },
      },
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
