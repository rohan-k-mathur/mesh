import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';
import { ClaimAttackType, ClaimEdgeType } from '@prisma/client';

type Node = {
  id: string;
  type: 'claim';
  text: string;
  label?: 'IN'|'OUT'|'UNDEC';
  approvals: number;
  schemeIcon?: string | null;
};

type Edge = {
  id: string;
  source: string;
  target: string;
  type: 'supports' | 'rebuts';
  attackType?: 'SUPPORTS' | 'REBUTS' | 'UNDERCUTS' | 'UNDERMINES';
  targetScope?: 'premise' | 'inference' | 'conclusion' | null;
};

function scopeFrom(t: { attackType?: string | null; type: 'supports' | 'rebuts' }): 'premise'|'inference'|'conclusion'|null {
  if (t.attackType === 'UNDERCUTS')  return 'inference';
  if (t.attackType === 'UNDERMINES') return 'premise';
  if (t.type === 'rebuts' || t.attackType === 'REBUTS') return 'conclusion';
  return null;
}

function iconForScheme(key?: string | null): string | undefined {
  if (!key) return undefined;
  switch (key) {
    case 'expert_opinion':    return '/icons/scheme-expert-opinion.svg';
    case 'good_consequences': return '/icons/scheme-consequences.svg';
    case 'analogy':           return '/icons/scheme-analogy.svg';
    default:                  return '/icons/scheme-generic.svg';
  }
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const deliberationId = params.id;
  const url = new URL(req.url);
  const lens = url.searchParams.get('lens') ?? 'af';

  // 1) Claims in this deliberation
  const claims = await prisma.claim.findMany({
    where: { deliberationId },
    select: { id: true, text: true },
  });
  const claimIds = claims.map(c => c.id);

  // 2) Ground labels (optional)
  const labels = await prisma.claimLabel.findMany({
    where: { deliberationId, claimId: { in: claimIds } },
    select: { claimId: true, label: true },
  });
  const labelByClaim = new Map<string, 'IN'|'OUT'|'UNDEC'>(
    labels.map(l => [l.claimId, l.label as any])
  );

  // 3) Scheme badge (first instance per claim)
  const schemeInstances = await prisma.schemeInstance.findMany({
    where: { targetType: 'claim', targetId: { in: claimIds } },
    select: { targetId: true, scheme: { select: { key: true } } },
  });
  const schemeIconByClaim = new Map<string, string | undefined>();
  for (const inst of schemeInstances) {
    if (!schemeIconByClaim.has(inst.targetId)) {
      schemeIconByClaim.set(inst.targetId, iconForScheme(inst.scheme?.key));
    }
  }

  // 4) Approvals rolled up from promoted arguments (optional)
  const promotedArgs = await prisma.argument.findMany({
    where: { deliberationId, claimId: { not: null } },
    select: { id: true, claimId: true },
  });
  const approvalsGrouped = await prisma.argumentApproval.groupBy({
    by: ['argumentId'],
    where: { deliberationId, argumentId: { in: promotedArgs.map(a => a.id) } },
    _count: { argumentId: true },
  });
  const approvalsPerArg = new Map(approvalsGrouped.map(g => [g.argumentId, g._count.argumentId]));
  const approvalsPerClaim = new Map<string, number>();
  for (const a of promotedArgs) {
    const inc = approvalsPerArg.get(a.id) ?? 0;
    approvalsPerClaim.set(a.claimId!, (approvalsPerClaim.get(a.claimId!) ?? 0) + inc);
  }

  // 5) Materialized claim→claim edges (the only source of edges now)
  const claimEdges = await prisma.claimEdge.findMany({
    where: {
      deliberationId,                // ← ensure set in write paths
      fromClaimId: { in: claimIds },
      toClaimId:   { in: claimIds },
    },
    select: {
      id: true, fromClaimId: true, toClaimId: true,
      type: true,                  // enum ClaimEdgeType
      attackType: true,            // enum ClaimAttackType | null
      targetScope: true,           // string | null
    },
  });

  const nodes: Node[] = claims.map(c => ({
    id: c.id,
    type: 'claim',
    text: c.text,
    label: labelByClaim.get(c.id) ?? 'UNDEC',
    approvals: approvalsPerClaim.get(c.id) ?? 0,
    schemeIcon: schemeIconByClaim.get(c.id) ?? null,
  }));

  const edges: Edge[] = claimEdges.map(e => {
    // Enums serialize as their textual value in Prisma client
    const type = e.type === ClaimEdgeType.rebuts ? 'rebuts' : 'supports';
    const attackType =
      e.attackType === ClaimAttackType.REBUTS     ? 'REBUTS'     :
      e.attackType === ClaimAttackType.UNDERCUTS  ? 'UNDERCUTS'  :
      e.attackType === ClaimAttackType.UNDERMINES ? 'UNDERMINES' :
      'SUPPORTS';

    return {
      id: e.id,
      source: e.fromClaimId,
      target: e.toClaimId,
      type,
      attackType,
      targetScope: e.targetScope ?? scopeFrom({ attackType, type }),
    };
  });

  return NextResponse.json({ nodes, edges, version: Date.now(), lens });
}
