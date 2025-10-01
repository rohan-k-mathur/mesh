import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { ClaimAttackType, ClaimEdgeType } from "@prisma/client";
import { z } from "zod";
import { since as startTimer, addServerTiming } from "@/lib/server/timing";
import { toAif } from "@/lib/export/aif";
import {
  projectToAF,
  grounded,
  preferred,
  labelingFromExtension,
} from "@/lib/argumentation/afEngine";
import { withDbRetry } from "@/lib/server/db-retry"; // 👈 add
import { Prisma } from "@prisma/client";

type GroupByArg = Parameters<typeof prisma.argumentApproval.groupBy>[0];

type Node = {
  id: string;
  type: "claim";
  text: string;
  label?: "IN" | "OUT" | "UNDEC";
  approvals: number;
  schemeIcon?: string | null;
    prior?: number; // NEW: evidential support(φ) ∈ [0,1] for confidence gating

};
type Edge = {
  id: string;
  source: string;
  target: string;
  type: "supports" | "rebuts";
  attackType?: "SUPPORTS" | "REBUTS" | "UNDERCUTS" | "UNDERMINES";
  targetScope?: "premise" | "inference" | "conclusion" | null;
};

const Query = z.object({
  lens: z.enum(["af", "bipolar"]).default("af"),
  focus: z.string().optional(), // claim id to center
  radius: z.coerce.number().int().min(0).max(3).default(1),
  maxNodes: z.coerce.number().int().positive().max(400).default(400),
});

function scopeFrom(t: {
  attackType?: string | null;
  type: "supports" | "rebuts";
}): "premise" | "inference" | "conclusion" | null {
  if (t.attackType === "UNDERCUTS") return "inference";
  if (t.attackType === "UNDERMINES") return "premise";
  if (t.type === "rebuts" || t.attackType === "REBUTS") return "conclusion";
  return null;
}
function iconForScheme(key?: string | null): string | undefined {
  if (!key) return undefined;
  switch (key) {
    case "expert_opinion":
      return "eo";
    case "good_consequences":
      return "gc";
    case "analogy":
      return "an";
    default:
      return "***";
  }
}

export const dynamic = "force-dynamic";
export const revalidate = 0;


// tiny evidential helpers (same algebra as /evidential)
type Mode = 'product'|'min';
const clamp01 = (x:number)=> Math.max(0, Math.min(1, x));
const compose = (xs:number[], mode:Mode)=> !xs.length ? 0 : (mode==='min' ? Math.min(...xs) : xs.reduce((a,b)=>a*b,1));
const join    = (xs:number[], mode:Mode)=> !xs.length ? 0 : (mode==='min' ? Math.max(...xs) : 1 - xs.reduce((a,s)=>a*(1-s),1));


export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {

  const t = startTimer();
  const deliberationId = params.id;
  const url = new URL(req.url);

  const semantics =
    (url.searchParams.get("semantics") as "grounded" | "preferred" | null) ||
    null;
  const supportDefense = url.searchParams.get("supportDefense") === "1";
  const format = url.searchParams.get("format");

  const modeParam = (url.searchParams.get('mode') === 'min' ? 'min' : 'product') as 'min'|'product';
const confParam = url.searchParams.get('confidence');
// const tau = typeof confParam === 'string' ? Math.max(0, Math.min(1, parseFloat(confParam))) : null;


  // NEW: confidence gating inputs (optional)
  const tauParam = url.searchParams.get('confidence');
  const tau = (tauParam == null ? null : clamp01(Number(tauParam)));
  const confMode: Mode = (url.searchParams.get('mode') === 'min' ? 'min' : 'product');


  
  const focusClusterId = url.searchParams.get("focusClusterId") ?? null;
  const focusClusterIdsParam = url.searchParams.get("focusClusterIds") ?? null;
  const focusClusterIds = focusClusterIdsParam
    ? focusClusterIdsParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : focusClusterId
    ? [focusClusterId]
    : [];

  const parsed = Query.safeParse({
    lens: url.searchParams.get("lens") ?? undefined,
    focus: url.searchParams.get("focus") ?? undefined,
    radius: url.searchParams.get("radius") ?? undefined,
    maxNodes: url.searchParams.get("maxNodes") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { lens, focus, radius, maxNodes } = parsed.data;

  // Claims in this deliberation (id → text)
  const claims = await withDbRetry(
    () =>
      prisma.claim.findMany({
        where: { deliberationId },
        select: { id: true, text: true },
      }),
    "graph:claims"
  );
  const claimIds = new Set(claims.map((c) => c.id));

  // --- Build neighborhood set (BFS by claimEdge) ---
  let keepIds: Set<string>;
  if (focus && claimIds.has(focus)) {
    keepIds = new Set([focus]);
    let frontier = new Set([focus]);
    for (let r = 0; r < radius; r++) {
      if (keepIds.size >= maxNodes) break;
      const ids = Array.from(frontier);
      const edges = await withDbRetry(
        () =>
          prisma.claimEdge.findMany({
            where: {
              deliberationId,
              OR: [{ fromClaimId: { in: ids } }, { toClaimId: { in: ids } }],
            },
            select: { fromClaimId: true, toClaimId: true },
            take: 2000,
          }),
        `graph:bfs:r${r}`
      );
      const next = new Set<string>();
      for (const e of edges) {
        if (!keepIds.has(e.fromClaimId)) next.add(e.fromClaimId);
        if (!keepIds.has(e.toClaimId)) next.add(e.toClaimId);
      }
      next.forEach((id) => keepIds.add(id));
      frontier = next;
      if (keepIds.size >= maxNodes) break;
    }
    keepIds = new Set(Array.from(keepIds).slice(0, maxNodes));
  } else {
    keepIds = new Set(Array.from(claimIds).slice(0, maxNodes));
  }

  // --- Optional filter by cluster(s) → reduce to claims that participate in those clusters ---
  let allowedClaimIds: Set<string> | null = null;

  if (focusClusterId || focusClusterIds.length) {
    const clusterIds = focusClusterIds.length
      ? focusClusterIds
      : [focusClusterId!];

    const memberships = await withDbRetry(
      () =>
        prisma.argumentCluster.findMany({
          where: { clusterId: { in: clusterIds } },
          select: { argumentId: true },
        }),
      "graph:cluster-members"
    );
    const argIds = [...new Set(memberships.map((m) => m.argumentId))];

    if (argIds.length) {
      const argToClaim = await withDbRetry(
        () =>
          prisma.argument.findMany({
            where: { id: { in: argIds }, claimId: { not: null } },
            select: { claimId: true },
          }),
        "graph:cluster-args→claims"
      );
      allowedClaimIds = new Set(argToClaim.map((a) => a.claimId!));
      // 👇 apply cluster filter to the neighborhood
      keepIds = new Set([...keepIds].filter((id) => allowedClaimIds!.has(id)));
    } else {
      // Nothing in those clusters; empty result set
      const res = NextResponse.json(
        { nodes: [], edges: [], version: Date.now(), lens, capped: false },
        { headers: { "Cache-Control": "no-store" } }
      );
      addServerTiming(res, [{ name: "total", durMs: t() }]);
      return res;
    }
  }

  const keep = Array.from(keepIds);
  const nodesBase = await withDbRetry(
    () =>
      prisma.claim.findMany({
        where: { id: { in: keep } },
        select: { id: true, text: true, deliberationId: true },
      }),
    "graph:nodesBase"
  );

  // Labels
  const labels = await withDbRetry(
    () =>
      prisma.claimLabel.findMany({
        where: { deliberationId, claimId: { in: nodesBase.map((n) => n.id) } },
        select: { claimId: true, label: true },
      }),
    "graph:labels"
  );
  const labelBy = new Map(labels.map((l) => [l.claimId, l.label as any]));

  // Scheme icon (first instance)
  const schemeInstances = await withDbRetry(
    () =>
      prisma.schemeInstance.findMany({
        where: {
          targetType: "claim",
          targetId: { in: nodesBase.map((n) => n.id) },
        },
        select: { targetId: true, scheme: { select: { key: true } } },
      }),
    "graph:schemes"
  );
  const iconBy = new Map<string, string | undefined>();
  for (const si of schemeInstances)
    if (!iconBy.has(si.targetId))
      iconBy.set(si.targetId, iconForScheme(si.scheme?.key));

  // Approvals via promoted args (with resilient groupBy)
  const promotedArgs = await withDbRetry(
    () =>
      prisma.argument.findMany({
        where: { deliberationId, claimId: { in: nodesBase.map((n) => n.id) } },
        select: { id: true, claimId: true },
      }),
    "graph:promotedArgs"
  );
  // model ArgumentApproval {
  //   id             String   @id @default(cuid())
  //   deliberationId String
  //   argumentId     String
  //   userId         String
  //   createdAt      DateTime @default(now())

  //   deliberation Deliberation @relation(fields: [deliberationId], references: [id], onDelete: Cascade)
  //   argument     Argument     @relation(fields: [argumentId], references: [id], onDelete: Cascade)

  //   @@unique([argumentId, userId])
  //   @@index([deliberationId, userId])
  //   @@index([deliberationId, argumentId], name: "argapproval_delib_argument") // NEW
  // }
 let approvalsGrouped: Array<{ argumentId: string; _count: { _all: number } }> = [];

  if (promotedArgs.length) {
    try {
      const groupArgs = {
        by: ['argumentId'] as const,
        where: {
          deliberationId,
          argumentId: { in: promotedArgs.map(a => a.id) },
        },
        _count: { _all: true },
        orderBy: [{ argumentId: 'asc' }],
      } satisfies GroupByArg;

      // FIX: assign to the outer variable (do NOT shadow)
      approvalsGrouped = await prisma.argumentApproval.groupBy(groupArgs);
    } catch {
      // Fallback if the driver/protocol doesn’t like groupBy
      const raw = await prisma.argumentApproval.findMany({
        where: {
          deliberationId,
          argumentId: { in: promotedArgs.map(a => a.id) },
        },
        select: { argumentId: true },
      });
      const tmp = new Map<string, number>();
      for (const r of raw) tmp.set(r.argumentId, (tmp.get(r.argumentId) ?? 0) + 1);
      approvalsGrouped = [...tmp.entries()].map(([argumentId, n]) => ({
        argumentId,
        _count: { _all: n },
      }));
    }
  }

  const approvalsPerArg = new Map(approvalsGrouped.map(g => [g.argumentId, g._count._all]));

  const statRows = await withDbRetry(
    () =>
      prisma.claimStats.findMany({
        where: { deliberationId, claimId: { in: nodesBase.map((n) => n.id) } },

        select: { claimId: true, approvalsCount: true },
      }),

    "graph:claimStats"
  );
  const approvalsPerClaim = new Map<string, number>(
    statRows.map((s) => [s.claimId, s.approvalsCount ?? 0])
  );
  for (const a of promotedArgs)
    approvalsPerClaim.set(
      a.claimId!,
      (approvalsPerClaim.get(a.claimId!) ?? 0) +
        (approvalsPerArg.get(a.id) ?? 0)
    );

  // Edges among kept nodes
  const edgesRaw = await withDbRetry(
    () =>
      prisma.claimEdge.findMany({
        where: {
          deliberationId,
          fromClaimId: { in: nodesBase.map((n) => n.id) },
          toClaimId: { in: nodesBase.map((n) => n.id) },
        },
        select: {
          id: true,
          fromClaimId: true,
          toClaimId: true,
          type: true,
          attackType: true,
          targetScope: true,
        },
      }),
    "graph:edges"
  );

  
  const nodes = nodesBase.map<Node>((n) => ({
    id: n.id,
    type: "claim",
    text: n.text,
    label: (labelBy.get(n.id) as any) ?? "UNDEC",
    approvals: approvalsPerClaim.get(n.id) ?? 0,
    schemeIcon: iconBy.get(n.id) ?? null,
  }));

  const edges = edgesRaw.map<Edge>((e) => {
    const type = e.type === ClaimEdgeType.rebuts ? "rebuts" : "supports";
    const attackType =
      e.attackType === ClaimAttackType.REBUTS
        ? "REBUTS"
        : e.attackType === ClaimAttackType.UNDERCUTS
        ? "UNDERCUTS"
        : e.attackType === ClaimAttackType.UNDERMINES
        ? "UNDERMINES"
        : "SUPPORTS";
    const allowedScopes = ["premise", "inference", "conclusion"];
    let targetScope: "premise" | "inference" | "conclusion" | null | undefined =
      e.targetScope && allowedScopes.includes(e.targetScope)
        ? (e.targetScope as "premise" | "inference" | "conclusion")
        : scopeFrom({ attackType, type });
    return {
      id: e.id,
      source: e.fromClaimId,
      target: e.toClaimId,
      type,
      attackType,
      targetScope,
    };
  });

  // after you've built `nodes` and before/after AF labeling, compute prior for just these kept claims
const keepClaimIds = new Set(nodes.map(n => n.id));

let priorBy = new Map<string, number>();
if (tau !== null || modeParam) {
  // same helpers as evidential route
  const clamp01 = (x:number)=> Math.max(0, Math.min(1, x));
  const compose = (xs:number[], mode:'min'|'product')=> !xs.length ? 0 : (mode==='min' ? Math.min(...xs) : xs.reduce((a,b)=>a*b,1));
  const join    = (xs:number[], mode:'min'|'product')=> !xs.length ? 0 : (mode==='min' ? Math.max(...xs) : 1 - xs.reduce((a,s)=>a*(1-s),1));

  const supports = await prisma.argumentSupport.findMany({
    where: { deliberationId, claimId: { in: Array.from(keepClaimIds) } },
    select: { claimId:true, argumentId:true, base:true }
  });
  const aEdges = await prisma.argumentEdge.findMany({
    where: { deliberationId, type:'support' as any, toArgumentId: { in: Array.from(new Set(supports.map(s=>s.argumentId))) } },
    select: { fromArgumentId:true, toArgumentId:true }
  });
  const parents = new Map<string,string[]>();
  for (const e of aEdges) (parents.get(e.toArgumentId) ?? parents.set(e.toArgumentId, []).get(e.toArgumentId)!).push(e.fromArgumentId);

  const bases = new Map<string, number>(supports.map(s => [s.argumentId, s.base ?? 0.55]));
  const uses = await prisma.assumptionUse.findMany({
    where: { argumentId: { in: Array.from(new Set(supports.map(s=>s.argumentId))) } },
    select: { argumentId:true, weight:true },
  }).catch(()=>[] as any[]);
  const aW = new Map<string, number[]>();
  for (const u of uses) (aW.get(u.argumentId) ?? aW.set(u.argumentId, []).get(u.argumentId)!).push(clamp01(u.weight ?? 0.6));

  const byClaim = new Map<string, number[]>();
  for (const s of supports) {
    const b = bases.get(s.argumentId) ?? 0.55;
    const premIds = parents.get(s.argumentId) ?? [];
    const premBases = premIds.map(pid => bases.get(pid) ?? 0.5);
    const premFactor = premBases.length ? compose(premBases, modeParam) : 1;
    const aBases = aW.get(s.argumentId) ?? [];
    const assumpFactor = aBases.length ? compose(aBases, modeParam) : 1;
    const score = clamp01(compose([b, premFactor], modeParam) * assumpFactor);
    (byClaim.get(s.claimId) ?? byClaim.set(s.claimId, []).get(s.claimId)!).push(score);
  }
  priorBy = new Map(Array.from(byClaim.entries()).map(([cid, xs]) => [cid, +join(xs, modeParam).toFixed(4)]));
}

  
  if (format === "aif") {
    const aif = toAif(
      nodes.map((n) => ({ id: n.id, text: n.text, type: "claim" })),
      edges.map((e) => ({
        source: e.source,
        target: e.target,
        type: e.type,
        attackType: e.attackType,
        targetScope: e.targetScope ?? null,
      }))
    );
    return NextResponse.json(aif, { headers: { "Cache-Control": "no-store" } });
  }

  // Optional AF labeling (existing)
  if (semantics) {
    const afNodes = nodes.map((n) => ({ id: n.id }));
    const afEdges = edges.map((e) => {
      const isAttack = e.type === "rebuts" || e.attackType === "REBUTS" || e.attackType === "UNDERCUTS" || e.attackType === "UNDERMINES";
      return { from: e.source, to: e.target, type: isAttack ? "attack" : ("support" as const) };
    });
    const AF = projectToAF(afNodes as any, afEdges as any, {
      supportDefensePropagation: supportDefense,
      supportClosure: false,
    });
    const labeling =
      semantics === "grounded"
        ? labelingFromExtension(AF.A, AF.R, grounded(AF.A, AF.R))
        : (() => {
            const prefs = preferred(AF.A, AF.R);
            const INunion = new Set<string>();
            for (const E of prefs) for (const a of E) INunion.add(a);
            return labelingFromExtension(AF.A, AF.R, INunion);
          })();

    for (const n of nodes) {
      n.label = labeling.IN.has(n.id) ? "IN" : labeling.OUT.has(n.id) ? "OUT" : "UNDEC";
    }
  }


  // NEW: evidential prior per kept claim (same algebra as /evidential), then apply gating if τ provided.
  if (tau !== null) {
    const keptClaimIds = nodes.map(n => n.id);

    const supports = await prisma.argumentSupport.findMany({
      where: { deliberationId, claimId: { in: keptClaimIds } },
      select: { claimId: true, argumentId: true, base: true },
    });

    if (supports.length) {
      const edges = await prisma.argumentEdge.findMany({
        where: { deliberationId, type: 'support' },
        select: { fromArgumentId: true, toArgumentId: true },
      });
      const byTo = new Map<string, string[]>();
      for (const e of edges) {
        if (!byTo.has(e.toArgumentId)) byTo.set(e.toArgumentId, []);
        byTo.get(e.toArgumentId)!.push(e.fromArgumentId);
      }

      const uses = await prisma.assumptionUse.findMany({
        where: { argumentId: { in: supports.map(s => s.argumentId) } },
        select: { argumentId: true, weight: true },
      }).catch(() => [] as any[]);

      const assumpByArg = new Map<string, number[]>();
      for (const u of uses) {
        const val = clamp01(u.weight ?? 0.6);
        if (!assumpByArg.has(u.argumentId)) assumpByArg.set(u.argumentId, []);
        assumpByArg.get(u.argumentId)!.push(val);
      }

      const baseByArg = new Map<string, number>(supports.map(s => [s.argumentId, s.base ?? 0.55]));

      const scoresByClaim = new Map<string, number>();
      for (const cid of keptClaimIds) {
        const argRows = supports.filter(s => s.claimId === cid);
        const argScores: number[] = [];
        for (const s of argRows) {
          const base = baseByArg.get(s.argumentId) ?? 0.55;
          const premIds = byTo.get(s.argumentId) ?? [];
          const premBases = premIds.map(pid => baseByArg.get(pid) ?? 0.5);
          const premFactor = premBases.length ? compose(premBases, confMode) : 1;
          const aBases = assumpByArg.get(s.argumentId) ?? [];
          const assumpFactor = aBases.length ? compose(aBases, confMode) : 1;
          const score = clamp01(compose([base, premFactor], confMode) * assumpFactor);
          argScores.push(score);
        }
        const prior = argScores.length ? join(argScores, confMode) : 0;
        scoresByClaim.set(cid, +prior.toFixed(4));
      }

      // annotate + gate
      for (const n of nodes) {
        const prior = scoresByClaim.get(n.id) ?? 0;
        n.prior = prior;
        if (n.label === "IN" && prior < tau) {
          n.label = "UNDEC";
        }
      }
    } else {
      // no supports: annotate zero and gate everything that was IN
      for (const n of nodes) {
        n.prior = 0;
        if (n.label === "IN") n.label = "UNDEC";
      }
    }
  }


  const res = NextResponse.json(
    {
      nodes,
      edges,
      version: Date.now(),
      lens,
      capped: claimIds.size > keepIds.size,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
  addServerTiming(res, [{ name: "total", durMs: t() }]);
  return res;
}
