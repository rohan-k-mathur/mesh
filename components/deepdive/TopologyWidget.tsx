// TopologyWidget.tsx
'use client';
import useSWR from 'swr';
import { useEffect, useMemo, useState } from 'react';

async function fetcher(u: string) {
  const r = await fetch(u, { cache: 'no-store' });
  if (!r.ok) {
    // propagate a useful error for SWR
    const text = await r.text().catch(() => '');
    throw new Error(`Fetch ${r.status}: ${text || r.statusText}`);
  }
  return r.json();
}

type Cluster = {
  id: string;
  label?: string;
  userCount?: number;
  argumentCount?: number;
};

export default function TopologyWidget({ deliberationId }: { deliberationId: string }) {
  const { data, error, isLoading } = useSWR(
    deliberationId ? `/api/deliberations/${deliberationId}/clusters` : null,
    fetcher
  );

  // Normalize response shapes:
  // - { items: Cluster[] }
  // - { clusters: Cluster[] }
  // - { clusters: { items: Cluster[] } }
  const items: Cluster[] = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.clusters)) return data.clusters;
    if (data.clusters?.items && Array.isArray(data.clusters.items)) return data.clusters.items;
    return [];
  }, [data]);

  const [blind, setBlind] = useState(false);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('discus_blind_mode') : null;
    if (saved) setBlind(saved === '1');
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem('discus_blind_mode', blind ? '1' : '0');
    } catch {}
  }, [blind]);

  return (
    <div className="rounded border p-3 text-sm">
      <div className="mb-2 flex items-center justify-between">
        <div className="font-medium">Topology</div>
        <label className="text-xs flex items-center gap-1">
          <input
            type="checkbox"
            checked={blind}
            onChange={(e) => setBlind(e.target.checked)}
          />
          Blind mode
        </label>
      </div>

      {/* Status row */}
      {isLoading && (
        <div className="text-[12px] text-neutral-500">Loading clusters…</div>
      )}
      {error && (
        <div className="text-[12px] text-red-600">
          Failed to load clusters: {String(error.message || error)}
        </div>
      )}
      {!isLoading && !error && items.length === 0 && (
        <div className="text-[12px] text-neutral-500">
          No clusters yet for this deliberation.
        </div>
      )}

      {/* Chips */}
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {items.map((c) => (
            <div key={c.id} className="px-2 py-1 rounded bg-slate-50 border text-xs">
              {blind ? 'Cluster' : (c.label ?? 'Cluster')}
              {' · '}U:{c.userCount ?? 0}
              {' · '}A:{c.argumentCount ?? 0}
            </div>
          ))}
        </div>
      )}

      <div className="text-[11px] text-neutral-500 mt-1">
        {blind ? 'Identities and labels hidden.' : 'Aggregated counts only; identities not shown.'}
      </div>
    </div>
  );
}
