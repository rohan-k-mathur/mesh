import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';
import { toAif, fromAif } from '@/lib/export/aif';
import { ClaimEdgeType, ClaimAttackType } from '@prisma/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const deliberationId = params.id;
const [claims, edgesRaw] = await prisma.$transaction([
  prisma.claim.findMany({ where: { deliberationId }, select: { id: true, text: true } }),
  prisma.claimEdge.findMany({
    where: { deliberationId },
    select: { fromClaimId: true, toClaimId: true, type: true, attackType: true, targetScope: true },
  }),
]);
if (claims.length > 10_000) {
  return NextResponse.json({ error: 'too large to export' }, { status: 413 });
}
  // const claims = await prisma.claim.findMany({
  //   where: { deliberationId },
  //   select: { id: true, text: true },
  // });
  // const edgesRaw = await prisma.claimEdge.findMany({
  //   where: { deliberationId, fromClaimId: { in: claims.map(c => c.id) }, toClaimId: { in: claims.map(c => c.id) } },
  //   select: { fromClaimId: true, toClaimId: true, type: true, attackType: true, targetScope: true },
  // });

  const nodes = claims.map(c => ({ id: c.id, text: c.text, type: 'claim' as const }));
  const edges: { source: string; target: string; type: "supports" | "rebuts"; attackType: "SUPPORTS" | "REBUTS" | "UNDERCUTS" | "UNDERMINES" | undefined; targetScope: string | null }[] = edgesRaw.map(e => ({
    source: e.fromClaimId,
    target: e.toClaimId,
    type: e.type === ClaimEdgeType.rebuts ? "rebuts" : "supports",
    attackType:
      e.attackType === ClaimAttackType.REBUTS     ? "REBUTS"     :
      e.attackType === ClaimAttackType.UNDERCUTS  ? "UNDERCUTS"  :
      e.attackType === ClaimAttackType.UNDERMINES ? "UNDERMINES" :
      e.attackType === ClaimAttackType.SUPPORTS   ? "SUPPORTS"   :
      undefined,
    targetScope: (e.targetScope === "conclusion" || e.targetScope === "premise" || e.targetScope === "inference")
      ? e.targetScope
      : null,
  }));

  const aif = toAif(nodes, edges);
  return NextResponse.json(aif, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const deliberationId = params.id;
  const aif = await req.json().catch(() => null);
  if (!aif || !Array.isArray(aif.nodes) || !Array.isArray(aif.edges)) {
    return NextResponse.json({ error: 'Invalid AIF' }, { status: 400 });
  }

  const { nodes, edges } = fromAif(aif);

  // Upsert claims (very simple; consider slugging or hashing to avoid dupes)
  for (const n of nodes) {
    await prisma.claim.upsert({
      where: { id: n.id },
      update: { text: n.text },
      create: { id: n.id, deliberationId, text: n.text, createdById: "system", moid: "" },
    });
  }

  // Insert edges if not present
  for (const e of edges) {
    const type = e.type === 'supports' ? ClaimEdgeType.supports : ClaimEdgeType.rebuts;
    const attackType =
      e.type === 'supports' ? ClaimAttackType.SUPPORTS : ClaimAttackType.REBUTS;

    // naive idempotency: skip if exists
    const exists = await prisma.claimEdge.findFirst({
      where: {
        deliberationId,
        fromClaimId: e.source,
        toClaimId: e.target,
        type,
      },
      select: { id: true },
    });
    if (exists) continue;

    await prisma.claimEdge.create({
      data: {
        deliberationId,
        fromClaimId: e.source,
        toClaimId: e.target,
        type,
        attackType,
        targetScope: e.type === 'rebuts' ? 'conclusion' : null,
      },
    });
  }

  return NextResponse.json({ ok: true, imported: { nodes: nodes.length, edges: edges.length } });
}
