// app/api/deliberations/[id]/dialectic/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';
import type { Edge, NodeID } from '@/lib/deepdive/af';
import { buildAttackGraph, preferredExtensions } from '@/lib/deepdive/af';

// helpers for grounded labelling
function attackersOf(map: Map<NodeID, Set<NodeID>>, x: NodeID): Set<NodeID> {
  const res = new Set<NodeID>();
  for (const [a, tos] of map) if (tos.has(x)) res.add(a);
  return res;
}
function sAttacks(map: Map<NodeID, Set<NodeID>>, S: Set<NodeID>, y: NodeID): boolean {
  for (const a of S) if (map.get(a)?.has(y)) return true;
  return false;
}
function groundedExtension(nodes: NodeID[], map: Map<NodeID, Set<NodeID>>): Set<NodeID> {
  let S = new Set<NodeID>(); // start from ∅
  for (;;) {
    const F = new Set<NodeID>();
    for (const a of nodes) {
      const atks = attackersOf(map, a);
      const defended = [...atks].every(b => sAttacks(map, S, b));
      if (defended) F.add(a);
    }
    if (F.size === S.size && [...F].every(x => S.has(x))) return F; // fixpoint
    S = F;
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const deliberationId = params.id;
  const url = new URL(req.url);
  const lens = (url.searchParams.get('lens') ?? 'preferred').toLowerCase();

  /* ---------------- A) Build AF from arguments + defeating edges ---------------- */
  const [args, edgeRows] = await Promise.all([
    prisma.argument.findMany({ where: { deliberationId }, select: { id: true } }),
    prisma.argumentEdge.findMany({
      where: { deliberationId, type: { in: ['rebut', 'undercut'] } },
      select: { fromArgumentId: true, toArgumentId: true, type: true },
    }),
  ]);

  const nodes: NodeID[] = args.map(a => a.id);
  const edges: Edge[] = edgeRows.map(e => ({ from: e.fromArgumentId, to: e.toArgumentId, type: e.type as Edge['type'] }));

  const attackMap = buildAttackGraph(nodes, edges);

  /* ---------------- B) Label nodes: IN / OUT / UNDEC ---------------- */
  const status: Record<string, 'IN'|'OUT'|'UNDEC'> = {};
  for (const n of nodes) status[n] = 'UNDEC';

  if (nodes.length) {
    if (lens === 'grounded') {
      const ext = groundedExtension(nodes, attackMap);
      // IN: in grounded extension; OUT: attacked by an IN; else UNDEC
      for (const n of ext) status[n] = 'IN';
      for (const [att, tos] of attackMap) {
        if (status[att] === 'IN') for (const t of tos) if (status[t] !== 'IN') status[t] = 'OUT';
      }
    } else { // preferred (skeptical acceptance = in all preferred extensions)
      const exts = preferredExtensions(nodes, attackMap) ?? [];
      const inAll = new Set<string>();
      if (exts.length > 0) {
        const first = exts[0];
        for (const n of first) if (exts.every(s => s.has(n))) inAll.add(n);
      }
      for (const n of inAll) status[n] = 'IN';
      for (const [att, tos] of attackMap) {
        if (status[att] === 'IN') for (const t of tos) if (status[t] !== 'IN') status[t] = 'OUT';
      }
    }
  }

  /* ---------------- C) Per-target WHY stats (compat with old UI) ---------------- */
  const moves = await prisma.dialogueMove.findMany({
    where: { deliberationId },
    orderBy: { createdAt: 'asc' },
    select: { id: true, targetType: true, targetId: true, kind: true, payload: true, createdAt: true },
  });

  const byTarget = new Map<string, typeof moves>();
  for (const m of moves) {
    if (!m.targetType || !m.targetId) continue;
    const k = `${m.targetType}:${m.targetId}`;
    (byTarget.get(k) ?? byTarget.set(k, []).get(k)!).push(m);
  }

  const stats: Record<string, {
    openWhy: number;
    resolved: number;
    avgHoursToGrounds: number | null;
    lastWhyAt?: string;
    lastResponseAt?: string;
    dialScore: number;
  }> = {};

  for (const [k, list] of byTarget) {
    list.sort((a, b) => +a.createdAt - +b.createdAt);
    const openStack: any[] = [];
    let resolved = 0; const latencies: number[] = [];
    let lastWhyAt: string | undefined, lastRespAt: string | undefined;

    for (const m of list) {
      if (m.kind === 'WHY') { openStack.push(m); lastWhyAt = m.createdAt.toISOString(); }
      if (m.kind === 'GROUNDS' || m.kind === 'RETRACT' || (m.kind === 'ASSERT' && (m.payload as any)?.as === 'CONCEDE')) {
        const w = openStack.pop(); lastRespAt = m.createdAt.toISOString();
        if (w) { resolved++; latencies.push((+m.createdAt - +w.createdAt) / 36e5); }
      }
    }

    const openWhy = openStack.length;
    const avg = latencies.length ? (latencies.reduce((a,b)=>a+b,0)/latencies.length) : null;
    const dialScore = resolved / Math.max(1, resolved + openWhy);

    stats[k] = {
      openWhy, resolved,
      avgHoursToGrounds: avg ? Number(avg.toFixed(2)) : null,
      lastWhyAt, lastResponseAt: lastRespAt,
      dialScore: Number(dialScore.toFixed(3)),
    };
  }

  return NextResponse.json(
    { ok: true, lens, status, stats, now: new Date().toISOString() },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
