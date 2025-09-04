'use client';
import useSWR from 'swr';

const fetcher = (u: string) => fetch(u, { cache: 'no-store' }).then(r => r.json());

export type DialogueMove = {
  id: string;
  deliberationId: string;
  targetType: 'argument'|'claim';
  targetId: string;
  kind: 'ASSERT'|'WHY'|'GROUNDS'|'RETRACT'|string;
  payload?: any;
  createdAt: string;
  actorId?: string;
};

type MovesResponse = { moves: DialogueMove[] };

export function useDialogueMoves(deliberationId: string) {
  const { data, mutate, isLoading } = useSWR<MovesResponse>(
    `/api/dialogue/move?deliberationId=${encodeURIComponent(deliberationId)}`,
    fetcher
  );

  const moves = (data?.moves || []).slice().sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  // Group by targetId
  const byTarget = new Map<string, DialogueMove[]>();
  for (const m of moves) {
    const arr = byTarget.get(m.targetId) || [];
    arr.push(m);
    byTarget.set(m.targetId, arr);
  }

  // Latest per target (WHY/GROUNDS/RETRACT/CONCEDE only)
  const latestByTarget = new Map<string, DialogueMove>();
  for (const [tid, list] of byTarget.entries()) {
    const filtered = list.filter(
      (m) =>
        m.kind === 'WHY' ||
        m.kind === 'GROUNDS' ||
        m.kind === 'RETRACT' ||
        (m.kind === 'ASSERT' && m.payload?.as === 'CONCEDE')
    );
    if (filtered.length) latestByTarget.set(tid, filtered[filtered.length - 1]);
  }

  // Unresolved = only those whose latest is WHY
  const unresolvedByTarget = new Map<string, DialogueMove[]>();
  for (const [tid, last] of latestByTarget.entries()) {
    if (last.kind === 'WHY') unresolvedByTarget.set(tid, [last]);
  }
  return { moves, byTarget, latestByTarget, unresolvedByTarget, mutate, isLoading };
}
