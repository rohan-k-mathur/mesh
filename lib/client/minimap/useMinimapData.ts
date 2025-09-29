'use client';
import useSWR from 'swr';
import { useMemo } from 'react';
// import { adaptGraphToMinimap, type GraphResp } from './adapters';
import { computeFogForNodes, applyOpenWhyCounts } from './decorate';
import { adaptGraphToMinimap, type GraphResp } from '@/components/dialogue/command-card/adapters';
const fetcher = (u: string) => fetch(u, { cache: 'no-store' }).then(r => r.json());

export function useMinimapData(deliberationId: string, opts?: {
  semantics?: 'grounded'|'preferred'|null;
  supportDefense?: boolean;
  focus?: string|null;
  radius?: number;
  maxNodes?: number;
}) {
  const params = new URLSearchParams();
  if (opts?.semantics) params.set('semantics', opts.semantics);
  if (opts?.supportDefense) params.set('supportDefense', '1');
  if (opts?.focus) params.set('focus', opts.focus);
  if (opts?.radius != null) params.set('radius', String(opts.radius));
  if (opts?.maxNodes != null) params.set('maxNodes', String(opts.maxNodes));

  const graphKey = `/api/deliberations/${encodeURIComponent(deliberationId)}/graph${params.toString() ? `?${params}` : ''}`;
  const movesKey = `/api/deliberations/${encodeURIComponent(deliberationId)}/moves?limit=500`;
  const dialKey  = `/api/deliberations/${encodeURIComponent(deliberationId)}/dialectic?lens=preferred`;

  const { data: g }   = useSWR<GraphResp>(graphKey, fetcher);
  const { data: mv }  = useSWR<{ items: any[] }>(movesKey, fetcher);
  const { data: dia } = useSWR<{ stats: Record<string, { openWhy: number }> }>(dialKey, fetcher);

  const composed = useMemo(() => {
    if (!g) return { nodes: [], edges: [] as any[] };
    const { nodes: baseNodes, edges } = adaptGraphToMinimap(g);

    // Fog based on WHY/GROUNDS
    const fog = computeFogForNodes(baseNodes.map(n => n.id), (mv?.items ?? []).map(m => ({
      kind: m.kind, targetType: m.targetType, targetId: m.targetId, fromId: m.fromId, toId: m.toId
    })));

    // Open WHY counts from dialectic
    const withCounts = applyOpenWhyCounts(
      baseNodes.map(n => ({ ...n, fogged: fog[n.id] ?? true })),
      dia?.stats ?? {}
    );

    return { nodes: withCounts, edges };
  }, [g, mv, dia]);

  return { nodes: composed.nodes, edges: composed.edges, loading: !g };
}
