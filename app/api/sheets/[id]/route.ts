import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';
import { z } from 'zod';
import { buildAttackGraph, preferredExtensions } from '@/lib/deepdive/af'; // same lib your /dialectic uses

const Q = z.object({
  semantics: z.enum(['preferred','grounded']).default('preferred'),
});

type SheetNode = { id: string; title: string | null; diagramId?: string | null };
type SheetEdge = { fromId: string; toId: string; kind: 'support'|'rebut'|'undercut'; targetScope?: 'premise'|'inference'|'conclusion'|null };
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

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Sheet id semantics:
 * - If it looks like "delib:<id>", we treat <id> as deliberationId.
 * - Otherwise we assume it's directly a deliberationId (for convenience).
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const parsed = Q.safeParse(Object.fromEntries(new URL(req.url).searchParams));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const semantics = parsed.data.semantics;

  const rawId = decodeURIComponent(params.id || '').trim();
  if (!rawId) return NextResponse.json({ error: 'Missing sheet id' }, { status: 400 });
  const deliberationId = rawId.startsWith('delib:') ? rawId.slice(6) : rawId;

  // 1) Pull arguments + edges (rebut/undercut are attacks; support is support)
  const [args, aEdges] = await Promise.all([
    prisma.argument.findMany({
      where: { deliberationId },
      select: { id: true, text: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.argumentEdge.findMany({
      where: { deliberationId },
      select: { fromArgumentId: true, toArgumentId: true, type: true, targetScope: true },
    }),
  ]);

  const nodes: SheetNode[] = args.map(a => ({
    id: a.id,
    title: a.text?.slice(0, 140) || a.id,
    diagramId: a.id,
  }));

  const edges: SheetEdge[] = aEdges.map(e => ({
    fromId: e.fromArgumentId,
    toId:   e.toArgumentId,
    kind:   (e.type === 'rebut' ? 'rebut' : e.type === 'undercut' ? 'undercut' : 'support'),
    targetScope: e.targetScope ?? (e.type === 'rebut' ? 'conclusion' : e.type === 'undercut' ? 'inference' : null),
  }));

  // 2) Acceptance (preferred or grounded) on the argument attack graph
  const A = nodes.map(n => n.id);
  const attacks = aEdges
    .filter(e => e.type === 'rebut' || e.type === 'undercut')
    .map(e => ({ from: e.fromArgumentId, to: e.toArgumentId, type: 'attack' as const }));

  const attackMap = buildAttackGraph(A, attacks);
  let IN = new Set<string>();
  if (semantics === 'grounded') {
    IN = groundedExtension(A, attackMap);
  } else {
    // skeptical acceptance in preferred extensions: IN iff in all preferred sets
    const exts = preferredExtensions(A, attackMap) ?? [];
    if (exts.length) {
      const base = exts[0];
      for (const n of base) if (exts.every(E => E.has(n))) IN.add(n);
    }
  }
  const OUT = new Set<string>();
  for (const [att, tos] of attackMap) if (IN.has(att)) for (const t of tos) if (!IN.has(t)) OUT.add(t);

  const labels: Record<string, AcceptanceLabel> = {};
  for (const id of A) labels[id] = IN.has(id) ? 'accepted' : OUT.has(id) ? 'rejected' : 'undecided';

  // 3) Unresolved WHYs (per argument) – include cqKey when present
  const mv = await prisma.dialogueMove.findMany({
    where: { deliberationId },
    orderBy: { createdAt: 'asc' },
    select: { targetType:true, targetId:true, kind:true, payload:true, createdAt:true },
    take: 2000,
  });

  // Reuse simplified unresolved computation (stack of WHYs cleared by GROUNDS/RETRACT/CONCEDE)
  const unresolved: Array<{ nodeId: string; cqKey: string }> = [];
  const byTarget = new Map<string, any[]>();
  for (const m of mv) {
    if (!m.targetType || !m.targetId) continue;
    const k = `${m.targetType}:${m.targetId}`;
    (byTarget.get(k) ?? byTarget.set(k, []).get(k)!).push(m);
  }
  for (const [k, list] of byTarget) {
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

  // 4) Loci (stub) — mark a single open locus; you can enrich with your stepper † hints later
  const loci = [{ id: `l0:${deliberationId}`, locusPath: '0', open: true, closable: false }];

  // 5) Title (optional: you can fetch a deliberation title if present)
  const title = `Debate sheet • ${deliberationId.slice(0, 6)}…`;

  return NextResponse.json({
    sheet: {
      title,
      nodes,
      edges,
      acceptance: { semantics, labels },
      unresolved,
      loci,
    }
  }, { headers: { 'Cache-Control': 'no-store' } });
}
