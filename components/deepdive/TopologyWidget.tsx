'use client';
import useSWR from 'swr';
import { useEffect, useState } from 'react';

const fetcher = (u: string) => fetch(u, { cache: 'no-store' }).then(r => r.json());

export default function TopologyWidget({ deliberationId }: { deliberationId: string }) {
  const { data } = useSWR(`/api/deliberations/${deliberationId}/clusters`, fetcher);
  const items = (data?.items ?? data?.clusters ?? []) as Array<{
    id: string;
    label?: string;
    userCount?: number;
    argumentCount?: number;
  }>;

  const [blind, setBlind] = useState<boolean>(false);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('discus_blind_mode') : null;
    if (saved) setBlind(saved === '1');
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem('discus_blind_mode', blind ? '1' : '0');
    } catch {}
  }, [blind]);

  if (!items.length) return null;

  return (
    <div className="rounded border p-3 text-sm">
      <div className="mb-2 flex items-center justify-between">
        <div className="font-medium">Topology</div>
        <label className="text-xs flex items-center gap-1">
          <input type="checkbox" checked={blind} onChange={e => setBlind(e.target.checked)} />
          Blind mode
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        {items.map((c) => (
          <div key={c.id} className="px-2 py-1 rounded bg-slate-50 border text-xs">
            {blind ? 'Cluster' : (c.label ?? 'Cluster')}
            {' · '}U:{c.userCount ?? 0}
            {' · '}A:{c.argumentCount ?? 0}
          </div>
        ))}
      </div>

      <div className="text-[11px] text-neutral-500 mt-1">
        {blind ? 'Identities and labels hidden.' : 'Aggregated counts only; identities not shown.'}
      </div>
    </div>
  );
}
