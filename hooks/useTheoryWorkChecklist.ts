// hooks/useTheoryWorkChecklist.ts
'use client';

import useSWR from 'swr';

const fetcher = (u: string) => fetch(u, { cache: 'no-store' }).then(r => {
  if (!r.ok) throw new Error(`Checklist fetch failed: ${r.status}`);
  return r.json();
});

export type WorkStatus = 'DRAFT'|'ACTIVE'|'PUBLISHED'|'ARCHIVED';
export type TheoryType = 'DN'|'IH'|'TC'|'OP';

export type Stat = { required: number; filled: number; open: string[] };

export interface ChecklistResponse {
  work: { id: string; title: string; theoryType: TheoryType; status: WorkStatus };
  dn: Stat; ih: Stat; tc: Stat; op: Stat;
  theses: { dn: string[]; ih: string[]; tc: string[]; op: string[] };
  claims: {
    count: number;
    byRole: Record<string, number>;
    cq: {
      required: number;
      satisfied: number;
      completeness: number; // 0..1
      openByScheme: { schemeKey: string; required: number; satisfied: number; open: string[] }[];
    };
    evidence: { count: number };
    // Optional: server may later include ids sorted by CQ openness
    ids?: string[];
  };
  dialogue?: {
    hasClosableLoci?: boolean;
    legalMoves?: { kind: string; force?: string; relevance?: string; targetType?: string; targetId?: string }[];
    sampleTargetId?: string; // optional helper the API may return
  };
  publishable: boolean;
}

export function useTheoryWorkChecklist(id?: string) {
  const key = id ? `/api/theory-works/${id}/checklist` : null;
  const { data, error, isLoading, mutate } = useSWR<ChecklistResponse>(key, fetcher);

  const theory = data?.work?.theoryType;
  const activeStat =
    theory === 'DN' ? data?.dn :
    theory === 'IH' ? data?.ih :
    theory === 'TC' ? data?.tc :
    theory === 'OP' ? data?.op : undefined;

  const structureProgress = activeStat
    ? (activeStat.required > 0 ? activeStat.filled / activeStat.required : 0)
    : 0;

  return {
    data,
    error,
    isLoading,
    mutate,
    structureProgress,
    activeOpen: activeStat?.open ?? [],
    cqProgress: data?.claims?.cq?.completeness ?? 0,
  };
}
