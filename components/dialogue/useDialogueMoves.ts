'use client';
import useSWR from 'swr';
const fetcher = (u:string)=>fetch(u,{cache:'no-store'}).then(r=>r.json());

export function useDialogueMoves(deliberationId: string) {
  const { data, isLoading, error, mutate } = useSWR(
    deliberationId ? `/api/deliberations/${deliberationId}/moves` : null,
    fetcher,
    { revalidateOnFocus: false }
  );
  const moves = (data?.items ?? []) as any[];
  const unresolvedByTarget = new Map<string, any>(
    Object.entries(data?.unresolvedByTarget ?? {})
  );
  return { moves, unresolvedByTarget, isLoading, error, mutate };
}
