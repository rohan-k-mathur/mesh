import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';
import { z } from 'zod';
import { buildAttackGraph, preferredExtensions } from '@/lib/deepdive/af'; // same lib your /dialectic uses

const Q = z.object({
  semantics: z.enum(['preferred','grounded']).default('preferred'),
});
type SheetNode = {
  id: string;                   // render key (diagramId for sheet nodes; argumentId for deliberation)
  title: string | null;
  diagramId?: string | null;    // prefer for UI lookup
  claimId?: string | null;      // lets the reader bridge to /evidential
};
type SheetEdge = { fromId: string; toId: string; kind: 'support'|'rebut'|'undercut'; targetScope?: 'premise'|'inference'|'conclusion'|null };

// type SheetNode = { id: string; title: string | null; diagramId?: string | null };
// type SheetEdge = { fromId: string; toId: string; kind: 'support'|'rebut'|'undercut'; targetScope?: 'premise'|'inference'|'conclusion'|null };
 type AcceptanceLabel = 'accepted'|'rejected'|'undecided';

function groundedExtension(nodes: string[], attackMap: Map<string, Set<string>>): Set<string> {
  const attackersOf = (x: string) => {
    const res = new Set<string>();
    for (const [a, tos] of attackMap) if (tos.has(x)) res.add(a);
    return res;
  };
  let S = new Set<string>();
  for (;;) {
    const F = new Set<string>();
    for (const a of nodes) {
      const atks = attackersOf(a);
      const defended = [...atks].every(b => {
        for (const s of S) if (attackMap.get(s)?.has(b)) return true;
        return false;
      });
      if (defended) F.add(a);
    }
    if (F.size === S.size && [...F].every(x => S.has(x))) return F;
    S = F;
  }
}


const normalizeEdgeKind = (k: string): 'support'|'rebut'|'undercut'|null => {
  // debateEdge.kind uses plurals/extra types; collapse to AF attacks/support
  if (k === 'supports' || k === 'support') return 'support';
  if (k === 'rebuts'   || k === 'objects' || k === 'rebut') return 'rebut';
  if (k === 'undercuts'|| k === 'undercut') return 'undercut';
  // refines/restates/clarifies/depends_on are non-attacking; ignore for AF
  return null;
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Sheet id semantics:
 * - If it looks like "delib:<id>", we treat <id> as deliberationId.
 * - Otherwise we assume it's directly a deliberationId (for convenience).
 */

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { semantics } = Q.parse(Object.fromEntries(new URL(req.url).searchParams));
  const rawId = decodeURIComponent(params.id || '').trim();
  if (!rawId) return NextResponse.json({ error: 'Missing sheet id' }, { status: 400 });

  // --- Mode A: explicit deliberation sheet via "delib:<id>" or a bare deliberation id
  const deliberationId = rawId.startsWith('delib:') ? rawId.slice(6) : rawId;

  // If a DebateSheet with this id exists, prefer the *sheet-backed* view.
  const sheet = await prisma.debateSheet.findUnique({
    where: { id: rawId },
    select: { id: true },
  });

  let nodes: SheetNode[] = [];
  let edges: SheetEdge[] = [];
  let acceptance: { semantics: string; labels: Record<string, AcceptanceLabel> } = { semantics, labels: {} };
  let resolvedDelibId: string | null = null;

  

  if (sheet) {
    // --- Mode B: real DebateSheet (DebateNode/DebateEdge)
    const [dNodes, dEdges] = await Promise.all([
      prisma.debateNode.findMany({
        where: { sheetId: rawId },
        select: { id: true, title: true, diagramId: true, argumentId: true, claimId: true },
      }),
      prisma.debateEdge.findMany({
        where: { sheetId: rawId },
        select: { fromId: true, toId: true, kind: true },
      }),
    ]);

    // Prefer diagramId for UI id (matches your DebateSheetReader and ArgumentPopout)
    // nodes = dNodes.map(n => ({
    //   id: n.diagramId ?? n.argumentId ?? n.id,
    //   title: n.title ?? n.diagramId ?? n.id,
    //   diagramId: n.diagramId ?? null,
    //   claimId: n.claimId ?? null,
    // }));

    // edges = dEdges
    //   .map(e => {
    //     const k = normalizeEdgeKind(e.kind);
    //     return k ? { fromId: e.fromId, toId: e.toId, kind: k, targetScope: k === 'undercut' ? 'inference' : k === 'rebut' ? 'conclusion' : null } : null;
    //   })
    //   .filter(Boolean) as SheetEdge[];
    // Build nodes + a mapping from DebateNode.id -> renderId (diagramId|argumentId|id)
const idMap = new Map<string,string>();
nodes = dNodes.map(n => {
  const renderId = n.diagramId ?? n.argumentId ?? n.id;
  idMap.set(n.id, renderId);
  return {
    id: renderId,
    title: n.title ?? renderId,
    diagramId: n.diagramId ?? null,
    claimId: n.claimId ?? null,
  };
});

// Map edges to render ids and normalize kinds
edges = dEdges
  .map(e => {
    const k = normalizeEdgeKind(e.kind);
    if (!k) return null;
    const fromId = idMap.get(e.fromId) ?? e.fromId;
    const toId   = idMap.get(e.toId)   ?? e.toId;
    return {
      fromId,
      toId,
      kind: k,
      targetScope: k === 'undercut' ? 'inference' : k === 'rebut' ? 'conclusion' : null
    };
  })
  .filter(Boolean) as SheetEdge[];

    // Acceptance on AF projection of sheet edges
    const ids = nodes.map(n => n.id);
    const attacks = edges
      .filter(e => e.kind === 'rebut' || e.kind === 'undercut')
      .map(e => ({ from: e.fromId, to: e.toId, type: e.kind }));
    const attackMap = buildAttackGraph(ids, attacks);
    let IN = new Set<string>();
    if (semantics === 'grounded') {
      IN = groundedExtension(ids, attackMap);
    } else {
      const exts = preferredExtensions(ids, attackMap) ?? [];
      if (exts.length) for (const n of exts[0]) if (exts.every(E => E.has(n))) IN.add(n);
    }
    const OUT = new Set<string>();
    for (const [att, tos] of attackMap) if (IN.has(att)) for (const t of tos) if (!IN.has(t)) OUT.add(t);
    const labels: Record<string, AcceptanceLabel> = {};
    for (const id of ids) labels[id] = IN.has(id) ? 'accepted' : OUT.has(id) ? 'rejected' : 'undecided';
    acceptance = { semantics, labels };

    // Try to derive a deliberation from any bridged argument
    const bridgedArg = dNodes.find(n => n.argumentId)?.argumentId;
    if (bridgedArg) {
      const arg = await prisma.argument.findUnique({ where: { id: bridgedArg }, select: { deliberationId: true } });
      resolvedDelibId = arg?.deliberationId ?? null;
    }
  } else {
    // --- Mode A (deliberation-backed)
    const [args, aEdges] = await Promise.all([
      prisma.argument.findMany({
        where: { deliberationId },
        select: { id: true, text: true, claimId: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.argumentEdge.findMany({
        where: { deliberationId },
        select: { fromArgumentId: true, toArgumentId: true, type: true, targetScope: true },
      }),
    ]);

    nodes = args.map(a => ({
      id: a.id,
      title: a.text?.slice(0, 140) || a.id,
      diagramId: a.id,
      claimId: a.claimId ?? null,            // <-- bridge for /evidential
    }));

    edges = aEdges.map(e => ({
      fromId: e.fromArgumentId,
      toId:   e.toArgumentId,
      kind:   (e.type === 'rebut' ? 'rebut' : e.type === 'undercut' ? 'undercut' : 'support'),
      targetScope: e.targetScope ?? (e.type === 'rebut' ? 'conclusion' : e.type === 'undercut' ? 'inference' : null),
    }));

    // AF acceptance on argument graph
    const A = nodes.map(n => n.id);
    const attacks = aEdges
      .filter(e => e.type === 'rebut' || e.type === 'undercut')
      .map(e => ({ from: e.fromArgumentId, to: e.toArgumentId, type: e.type as 'rebut'|'undercut' }));
    const attackMap = buildAttackGraph(A, attacks);
    let IN = new Set<string>();
    if (semantics === 'grounded') {
      IN = groundedExtension(A, attackMap);
    } else {
      const exts = preferredExtensions(A, attackMap) ?? [];
      if (exts.length) for (const n of exts[0]) if (exts.every(E => E.has(n))) IN.add(n);
    }
    const OUT = new Set<string>();
    for (const [att, tos] of attackMap) if (IN.has(att)) for (const t of tos) if (!IN.has(t)) OUT.add(t);
    const labels: Record<string, AcceptanceLabel> = {};
    for (const id of A) labels[id] = IN.has(id) ? 'accepted' : OUT.has(id) ? 'rejected' : 'undecided';
    acceptance = { semantics, labels };
    resolvedDelibId = deliberationId;
  }

  // Unresolved WHYs only when we know the deliberation
  let unresolved: Array<{ nodeId: string; cqKey: string }> = [];
  if (resolvedDelibId) {
    const mv = await prisma.dialogueMove.findMany({
      where: { deliberationId: resolvedDelibId },
      orderBy: { createdAt: 'asc' },
      select: { targetType:true, targetId:true, kind:true, payload:true, createdAt:true },
      take: 2000,
    });
    const byTarget = new Map<string, any[]>();
    for (const m of mv) {
      if (!m.targetType || !m.targetId) continue;
      const k = `${m.targetType}:${m.targetId}`;
      (byTarget.get(k) ?? byTarget.set(k, []).get(k)!).push(m);
    }
    for (const [_k, list] of byTarget) {
      list.sort((a, b) => +a.createdAt - +b.createdAt);
      const stack: any[] = [];
      for (const m of list) {
        if (m.kind === 'WHY') stack.push(m);
        if (m.kind === 'GROUNDS' || m.kind === 'RETRACT' || (m.kind === 'ASSERT' && (m.payload as any)?.as === 'CONCEDE')) {
          stack.pop();
        }
      }
      const tail = stack.at(-1);
      if (tail && tail.targetType === 'argument') {
        unresolved.push({ nodeId: String(tail.targetId), cqKey: String((tail.payload as any)?.cqId ?? 'default') });
      }
    }
  }

  const title = sheet ? `Debate sheet • ${rawId.slice(0,6)}…` : `Debate sheet • ${String(resolvedDelibId).slice(0,6)}…`;

  return NextResponse.json({
    sheet: {
      title,
      deliberationId,
      nodes,
      edges,
      acceptance,
      unresolved,
      loci: [{ id: `l0:${sheet ? rawId : resolvedDelibId}`, locusPath: '0', open: true, closable: false }],
    }
  }, { headers: { 'Cache-Control': 'no-store' } });
}