'use client';

import useSWR from 'swr';
import { useEffect, useMemo } from 'react';

type MovesRes = { items: any[]; unresolvedByTarget: Record<string, any> };
const EMPTY_MOVES: MovesRes = { items: [], unresolvedByTarget: {} };

const fetchJSON = async <T,>(url: string): Promise<T> => {
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
};

const normId = (raw?: string | string[] | null) =>
  Array.isArray(raw) ? (raw[0]?.trim() ?? '') : typeof raw === 'string' ? raw.trim() : '';

export function useDialogueMoves(deliberationId?: string | string[] | null) {
  const id = useMemo(() => normId(deliberationId), [deliberationId]);

  const { data = EMPTY_MOVES, isLoading, error, mutate } = useSWR<MovesRes>(
    id ? ['moves', id] : null,
    // args: ['moves', id]
    async (_key, _id: string) =>
      fetchJSON<MovesRes>(`/api/deliberations/${encodeURIComponent(_id)}/moves`),
    { revalidateOnFocus: false, fallbackData: EMPTY_MOVES }
  );

  const moves = useMemo(() => (Array.isArray(data.items) ? data.items : []), [data]);
  const unresolvedByTarget = useMemo(
    () => new Map<string, any>(Object.entries(data.unresolvedByTarget ?? {})),
    [data]
  );

  useEffect(() => {
    const onRefresh = () => mutate();
    window.addEventListener('dialogue:moves:refresh', onRefresh as any);
    return () => window.removeEventListener('dialogue:moves:refresh', onRefresh as any);
  }, [mutate]);

  return { id, moves, unresolvedByTarget, isLoading, error, mutate };
}

/** Top-level hook (call from your component), not nested inside another function */
export function useOpenCqs(
  deliberationId?: string | string[] | null,
  targetId?: string | null
) {
  const id = useMemo(() => normId(deliberationId), [deliberationId]);
  const tid = typeof targetId === 'string' ? targetId.trim() : '';

  const { data } = useSWR<{ ok: boolean; cqOpen: string[] }>(
    id && tid ? ['open-cqs', id, tid] : null,
    // args: ['open-cqs', id, tid]
    async (_key, _id: string, _tid: string) =>
      fetchJSON<{ ok: boolean; cqOpen: string[] }>(
        `/api/dialogue/open-cqs?deliberationId=${encodeURIComponent(_id)}&targetId=${encodeURIComponent(_tid)}`
      ),
    { revalidateOnFocus: false, fallbackData: { ok: true, cqOpen: [] } }
  );

  return new Set<string>(Array.isArray(data?.cqOpen) ? data!.cqOpen : []);
}
