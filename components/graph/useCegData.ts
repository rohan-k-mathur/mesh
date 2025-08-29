// components/graph/useCegData.ts
'use client';

import { useEffect, useState } from 'react';

export type CegNode = {
  id: string;
  type: 'claim';
  text: string;
  label?: 'IN'|'OUT'|'UNDEC';
  approvals: number;
  schemeIcon?: string | null;
};

export type CegEdge = {
  id: string;
  source: string;
  target: string;
  type: 'supports'|'rebuts';
  attackType?: 'SUPPORTS'|'REBUTS'|'UNDERCUTS'|'UNDERMINES';
  targetScope?: 'premise'|'inference'|'conclusion'|null;
};

export function useCegData(deliberationId: string) {
  const [nodes, setNodes] = useState<CegNode[]>([]);
  const [edges, setEdges] = useState<CegEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string|null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr(null);
    fetch(`/api/deliberations/${deliberationId}/graph`, { cache: 'no-store' })
      .then(r => r.json())
      .then(json => {
        if (!alive) return;
        setNodes(Array.isArray(json.nodes) ? json.nodes : []);
        setEdges(Array.isArray(json.edges) ? json.edges : []);
      })
      .catch(e => { if (alive) setErr(e?.message ?? 'Failed to load graph'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [deliberationId]);

  return { nodes, edges, loading, err };
}
