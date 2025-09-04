import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';
import { ClaimAttackType, ClaimEdgeType } from '@prisma/client';
import { z } from 'zod';
import { since as startTimer, addServerTiming } from '@/lib/server/timing';
import { toAif } from '@/lib/export/aif';
import { projectToAF, grounded, preferred, labelingFromExtension } from '@/lib/argumentation/afEngine';


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

const Query = z.object({
  lens: z.enum(['af','bipolar']).default('af'),
  focus: z.string().optional(),                      // claim id to center
  radius: z.coerce.number().int().min(0).max(3).default(1),
  maxNodes: z.coerce.number().int().positive().max(400).default(400),
});

function scopeFrom(t: { attackType?: string | null; type: 'supports'|'rebuts' }): 'premise'|'inference'|'conclusion'|null {
  if (t.attackType === 'UNDERCUTS')  return 'inference';
  if (t.attackType === 'UNDERMINES') return 'premise';
  if (t.type === 'rebuts' || t.attackType === 'REBUTS') return 'conclusion';
  return null;
}
function iconForScheme(key?: string | null): string | undefined {
  if (!key) return undefined;
  switch (key) {
    case 'expert_opinion':    return 'eo';
    case 'good_consequences': return 'gc';
    case 'analogy':           return 'an';
    default:                  return '***';
  }
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const t = startTimer();
  const deliberationId = params.id;
  const url = new URL(req.url);
// parse both single and multi-cluster focus
const semantics = (url.searchParams.get('semantics') as 'grounded'|'preferred'|null) || null;
const supportDefense = url.searchParams.get('supportDefense') === '1';
const format = url.searchParams.get('format'); // 'aif' -> export
const focusClusterId = url.searchParams.get('focusClusterId') ?? null;
const focusClusterIdsParam = url.searchParams.get('focusClusterIds') ?? null;
const focusClusterIds = focusClusterIdsParam
  ? focusClusterIdsParam.split(',').map(s => s.trim()).filter(Boolean)
  : (focusClusterId ? [focusClusterId] : []);

  const parsed = Query.safeParse({
    lens: url.searchParams.get('lens') ?? undefined,
    focus: url.searchParams.get('focus') ?? undefined,
    radius: url.searchParams.get('radius') ?? undefined,
    maxNodes: url.searchParams.get('maxNodes') ?? undefined,
    
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { lens, focus, radius, maxNodes } = parsed.data;

  // Pull all claim ids for the deliberation (cheap – indexed)
  const claims = await prisma.claim.findMany({
    where: { deliberationId },
    select: { id: true, text: true },
  });
  const claimIds = new Set(claims.map(c => c.id));

  // Neighborhood set
  let keepIds: Set<string>;
  if (focus && claimIds.has(focus)) {
    keepIds = new Set<string>([focus]);
    let frontier = new Set<string>([focus]);
    for (let r = 0; r < radius; r++) {
      if (keepIds.size >= maxNodes) break;
      const ids = Array.from(frontier);
      const edges = await prisma.claimEdge.findMany({
        where: {
          deliberationId,
          OR: [{ fromClaimId: { in: ids } }, { toClaimId: { in: ids } }],
        },
        select: { fromClaimId: true, toClaimId: true },
        take: 2000,  // guard
      });
      const next = new Set<string>();
      for (const e of edges) {
        if (!keepIds.has(e.fromClaimId)) next.add(e.fromClaimId);
        if (!keepIds.has(e.toClaimId))   next.add(e.toClaimId);
      }
      next.forEach(id => keepIds.add(id));
      frontier = next;
      if (keepIds.size >= maxNodes) break;
    }
    // clip
    keepIds = new Set(Array.from(keepIds).slice(0, maxNodes));
  } else {
    // fallback (legacy): show everything but cap by maxNodes
    keepIds = new Set(Array.from(claimIds).slice(0, maxNodes));
  }

  let allowedClaimIds: Set<string> | null = null;
  

if (focusClusterId) {
  // Find argument IDs in that cluster, map to claimIds (non-null), use those as focus
  const argIds = await prisma.argumentCluster.findMany({
    where: { clusterId: focusClusterId },
    select: { argumentId: true },
  });
  const argIdSet = new Set(argIds.map(a => a.argumentId));
  const claimIdsFromArgs = await prisma.argument.findMany({
    where: { id: { in: [...argIdSet] }, claimId: { not: null } },
    select: { claimId: true },
  });
  allowedClaimIds = new Set(claimIdsFromArgs.map(a => a.claimId!) );
}

if (focusClusterIds.length) {
  // gather all argumentIds for clusters
  const memberships = await prisma.argumentCluster.findMany({
    where: { clusterId: { in: focusClusterIds } },
    select: { argumentId: true },
  });
  const argIds = [...new Set(memberships.map(m => m.argumentId))];

  // map to claimIds
  const argToClaim = await prisma.argument.findMany({
    where: { id: { in: argIds }, claimId: { not: null } },
    select: { claimId: true },
  });
  allowedClaimIds = new Set(argToClaim.map(a => a.claimId!));
}

  const nodesBase = await prisma.claim.findMany({
    where: { id: { in: Array.from(keepIds) } },
    select: { id: true, text: true, deliberationId: true },
  });

  // Labels (optional)
  const labels = await prisma.claimLabel.findMany({
    where: { deliberationId, claimId: { in: nodesBase.map(n => n.id) } },
    select: { claimId: true, label: true },
  });
  const labelBy = new Map(labels.map(l => [l.claimId, l.label as any]));

  // Scheme icon (first instance)
  const schemeInstances = await prisma.schemeInstance.findMany({
    where: { targetType: 'claim', targetId: { in: nodesBase.map(n => n.id) } },
    select: { targetId: true, scheme: { select: { key: true } } },
  });
  const iconBy = new Map<string, string | undefined>();
  for (const si of schemeInstances) if (!iconBy.has(si.targetId)) iconBy.set(si.targetId, iconForScheme(si.scheme?.key));

  // Approvals via promoted args
  const promotedArgs = await prisma.argument.findMany({
    where: { deliberationId, claimId: { in: nodesBase.map(n => n.id) } },
    select: { id: true, claimId: true },
  });
  const approvalsGrouped = await prisma.argumentApproval.groupBy({
    by: ['argumentId'],
    where: { deliberationId, argumentId: { in: promotedArgs.map(a => a.id) } },
    _count: { argumentId: true },
  });
  const approvalsPerArg = new Map(approvalsGrouped.map(g => [g.argumentId, g._count.argumentId]));
  const statRows = await prisma.claimStats.findMany({
    where: { deliberationId, claimId: { in: nodesBase.map(n => n.id) } },
    select: { claimId: true, approvalsCount: true },
  });
  const approvalsPerClaim = new Map<string, number>(
    statRows.map(s => [s.claimId, s.approvalsCount ?? 0])
  );
    for (const a of promotedArgs) approvalsPerClaim.set(a.claimId!, (approvalsPerClaim.get(a.claimId!) ?? 0) + (approvalsPerArg.get(a.id) ?? 0));

  // Edges only among kept nodes
  const edgesRaw = await prisma.claimEdge.findMany({
    where: {
      deliberationId,
      fromClaimId: { in: nodesBase.map(n => n.id) },
      toClaimId:   { in: nodesBase.map(n => n.id) },
    },
    select: { id: true, fromClaimId: true, toClaimId: true, type: true, attackType: true, targetScope: true },
  });


// later when building nodes/edges:
const filteredClaims = allowedClaimIds
? claims.filter(c => allowedClaimIds!.has(c.id))
: claims;


  const nodes: Node[] = nodesBase.map(n => ({
    id: n.id,
    type: 'claim',
    text: n.text,
    label: labelBy.get(n.id) ?? 'UNDEC',
    approvals: approvalsPerClaim.get(n.id) ?? 0,
    schemeIcon: iconBy.get(n.id) ?? null,
  }));

  const edges: Edge[] = edgesRaw.map(e => {
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

  // AIF export (raw graph)
if (format === 'aif') {
  const aif = toAif(
    nodes.map(n => ({ id: n.id, text: n.text, type: 'claim' })),
    edges.map(e => ({
      source: e.source,
      target: e.target,
      type: e.type,
      attackType: e.attackType,
      targetScope: e.targetScope ?? null
    }))
  );
  return NextResponse.json(aif, { headers: { 'Cache-Control': 'no-store' } });
}

// Optional: Dung labeling (override existing labels) when semantics is requested
if (semantics) {
  // Build AF nodes/attacks from your claim graph
  const afNodes = nodes.map(n => ({ id: n.id }));
  const afEdges = edges.map(e => {
    const isAttack =
      e.type === 'rebuts' ||
      e.attackType === 'REBUTS' ||
      e.attackType === 'UNDERCUTS' ||
      e.attackType === 'UNDERMINES';
    return { from: e.source, to: e.target, type: isAttack ? 'attack' : 'support' as const };
  });

  const AF = projectToAF(afNodes as any, afEdges as any, { supportDefensePropagation: supportDefense, supportClosure: false });
  const labeling = (() => {
    if (semantics === 'grounded') {
      const E = grounded(AF.A, AF.R);
      return labelingFromExtension(AF.A, AF.R, E);
    } else {
      const prefs = preferred(AF.A, AF.R);
      const INunion = new Set<string>();
      for (const E of prefs) for (const a of E) INunion.add(a);
      return labelingFromExtension(AF.A, AF.R, INunion);
    }
  })();

  // override labels on nodes
  for (const n of nodes) {
    n.label = labeling.IN.has(n.id) ? 'IN' : labeling.OUT.has(n.id) ? 'OUT' : 'UNDEC';
  }
}

  const res = NextResponse.json({ nodes, edges, version: Date.now(), lens, capped: claimIds.size > keepIds.size }, {
    headers: { 'Cache-Control': 'no-store' },
  });
  addServerTiming(res, [{ name: 'total', durMs: t() }]);
  return res;
}
