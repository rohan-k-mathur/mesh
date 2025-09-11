'use client';
import * as React from 'react';
import useSWR from 'swr';

const fetcher = (u:string)=>fetch(u,{cache:'no-store'}).then(r=>r.json());

export function IssueBadge({
  deliberationId,
  argumentId,
  onClick,
}: {
  deliberationId: string;
  argumentId: string;
  onClick?: () => void;
}) {
  const { data } = useSWR<{ ok:true; counts: Record<string, number> }>(
    `/api/deliberations/${encodeURIComponent(deliberationId)}/issues/counts?argumentIds=${encodeURIComponent(argumentId)}`,
    fetcher,
    { revalidateOnFocus: false }
  );
  const n = data?.counts?.[argumentId] ?? 0;
  if (!n) return null;

  return (
    <button
      className="text-[10px] px-1.5 py-0.5 rounded border bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100"
      title={`${n} open issue${n>1?'s':''}`}
      onClick={onClick}
    >
      Issues {n}
    </button>
  );
}
