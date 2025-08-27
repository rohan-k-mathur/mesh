'use client';
import useSWR from 'swr';
import { useEffect, useState } from 'react';

export default function TopologyWidget({ deliberationId }: { deliberationId: string }) {
  const { data } = useSWR(`/api/deliberations/${deliberationId}/clusters`, (u)=>fetch(u).then(r=>r.json()));
  const items = data?.items ?? [];
  const [blind, setBlind] = useState<boolean>(false);

  useEffect(() => {
    const saved = localStorage.getItem('discus_blind_mode');
    if (saved) setBlind(saved === '1');
  }, []);
  useEffect(() => {
    localStorage.setItem('discus_blind_mode', blind ? '1' : '0');
  }, [blind]);

  if (!items.length) return null;

  return (
    <div className="rounded border p-3 text-sm">
      <div className="mb-2 flex items-center justify-between">
        <div className="font-medium">Topology</div>
        <label className="text-xs flex items-center gap-1">
          <input type="checkbox" checked={blind} onChange={e=>setBlind(e.target.checked)} />
          Blind mode
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((c: any) => (
          <div key={c.id} className="px-2 py-1 rounded bg-slate-50 border text-xs">
            {blind ? 'Cluster' : c.label} · U:{c.userCount} · A:{c.argumentCount}
          </div>
        ))}
      </div>
      <div className="text-[11px] text-neutral-500 mt-1">
        {blind ? 'Identities and labels hidden.' : 'Aggregated counts only; identities not shown.'}
      </div>
    </div>
  );
}
