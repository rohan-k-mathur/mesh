// lib/client/evidential.ts
export type ClaimScore = { id: string; score?: number; bel?: number; pl?: number; accepted?: boolean };

export async function fetchClaimScores(params: {
  deliberationId: string;
  mode: 'min'|'product'|'ds';
  tau?: number|null;
  claimIds?: string[]; // optional: to limit the set
}) {
  const q = new URLSearchParams({ deliberationId: params.deliberationId, mode: params.mode });
  if (params.tau != null) q.set('tau', String(params.tau));
  if (params.claimIds?.length) q.set('ids', params.claimIds.join(','));

  const r = await fetch(`/api/evidential/score?${q.toString()}`, { cache: 'no-store' });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const j = await r.json();
  return (Array.isArray(j.items) ? j.items : []) as ClaimScore[];
}
