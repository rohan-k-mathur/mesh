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

/**
 * Response type for hom-set API (materializes hom-sets with confidence scores)
 */
export type HomSetResponse = {
  ok: boolean;
  deliberationId: string;
  mode: 'min' | 'product' | 'ds';
  support: Record<string, number>; // claimId → confidence score
  hom: Record<string, { args: string[] }>; // "I|claimId" → list of argument IDs
  nodes: Array<{
    id: string;
    text: string;
    score: number;
    topContributors?: Array<{ argumentId: string; contribution: number }>;
  }>;
  arguments: Array<{
    id: string;
    text: string;
    conclusionClaimId: string;
    base?: number;
  }>;
  meta?: {
    claims: number;
    supports: number;
    edges: number;
    conclusions: number;
  };
};

/**
 * Fetch hom-sets (sets of arguments supporting each claim) with confidence scores.
 * 
 * This API materializes the categorical hom-sets hom(A,B) = {arguments from A to B}
 * and computes confidence scores using the specified accrual mode.
 * 
 * @param params - Configuration for hom-set retrieval
 * @param params.deliberationId - The deliberation/room to query
 * @param params.mode - Confidence accrual mode ('min' = weakest-link, 'product' = probabilistic, 'ds' = Dempster-Shafer)
 * @param params.imports - How to handle imported arguments ('off' = local only, 'materialized' = copied imports, 'virtual' = read-only view, 'all' = both)
 * 
 * @returns Promise resolving to hom-set structure with confidence scores
 * 
 * @example
 * ```typescript
 * const result = await fetchHomSets({
 *   deliberationId: 'room123',
 *   mode: 'product',
 *   imports: 'all'
 * });
 * 
 * // Access hom-set for claim C:
 * const supportingArgs = result.hom['I|claimC'].args; // ['arg1', 'arg2', ...]
 * const confidence = result.support['claimC']; // 0.85
 * ```
 */
export async function fetchHomSets(params: {
  deliberationId: string;
  mode?: 'min' | 'product' | 'ds';
  imports?: 'off' | 'materialized' | 'virtual' | 'all';
}): Promise<HomSetResponse> {
  const mode = params.mode ?? 'product';
  const imports = params.imports ?? 'off';
  const q = new URLSearchParams({ mode, imports });

  const r = await fetch(
    `/api/deliberations/${params.deliberationId}/evidential?${q.toString()}`,
    { cache: 'no-store' }
  );
  
  if (!r.ok) {
    throw new Error(`Failed to fetch hom-sets: HTTP ${r.status}`);
  }
  
  return r.json();
}
