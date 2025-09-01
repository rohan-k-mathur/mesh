'use client';
import useSWR from 'swr';

const fetcher = (u: string) => fetch(u, { cache: 'no-store' }).then(r => r.json());

export function useCQSummaryBatch(deliberationId: string, claimIds: string[]) {
  // stable, sorted param to avoid key churn
  const csv = [...new Set(claimIds)].sort().join(',');
  const key = claimIds.length
    ? `/api/deliberations/${deliberationId}/cq/summary?claimIds=${encodeURIComponent(csv)}`
    : null;

  const { data, error, isLoading, mutate } =
    useSWR<{ items: { claimId: string; required: number; satisfied: number; completeness: number; openByScheme: Record<string, string[]> }[] }>(key, fetcher, { revalidateOnFocus: false });

  const byId = new Map<string, (typeof data.items)[number]>();
  if (data?.items) for (const it of data.items) byId.set(it.claimId, it);

  return { byId, isLoading, error, mutate };
}
