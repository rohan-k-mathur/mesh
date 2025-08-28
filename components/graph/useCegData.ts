'use client';
import useSWR from 'swr';

type RawMini =
  | { nodes: { id: string; text: string }[]; edges: any[] }
  | { claims: { id: string; text: string }[]; edges: any[] };

type LabelRow = { claimId: string; label: 'IN'|'OUT'|'UNDEC' };

const fetcher = (u: string) => fetch(u, { cache: 'no-store' }).then(r => r.json());

export type CegNode = { id: string; text: string; label?: 'IN'|'OUT'|'UNDEC' };
export type CegEdge = {
  id: string;
  source: string;
  target: string;
  // Your schema may use either or both of these:
  type?: 'supports' | 'rebuts';
  attackType?: 'SUPPORTS'|'REBUTS'|'UNDERCUTS'|'UNDERMINES';
  targetScope?: 'premise'|'inference'|'conclusion'|null;
};

export function useCegData(deliberationId: string) {
  const { data: mini } = useSWR<RawMini>(`/api/deliberations/${deliberationId}/ceg/mini`, fetcher);
  const { data: labelsResp } = useSWR<{labels: LabelRow[]}>(`/api/claims/labels?deliberationId=${deliberationId}`, fetcher);

  const nodes: CegNode[] = (mini?.nodes ?? (mini as any)?.claims ?? [])?.map((n: any) => ({
    id: n.id, text: n.text,
  })) ?? [];

  const labelMap = new Map<string, CegNode['label']>();
  for (const row of labelsResp?.labels ?? []) labelMap.set(row.claimId, row.label);

  const nodesWithLabels = nodes.map(n => ({ ...n, label: labelMap.get(n.id) ?? 'UNDEC' }));

  const edges: CegEdge[] = (mini as any)?.edges?.map((e: any, idx: number) => ({
    id: e.id ?? `e${idx}`,
    source: e.fromClaimId ?? e.source,
    target: e.toClaimId ?? e.target,
    type: e.type, // 'supports' | 'rebuts'
    attackType: e.attackType, // 'REBUTS'|'UNDERCUTS'|'UNDERMINES'|'SUPPORTS'
    targetScope: e.targetScope ?? e.scope ?? null,
  })) ?? [];

  return { nodes: nodesWithLabels, edges };
}
