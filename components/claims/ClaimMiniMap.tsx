'use client';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ClaimMiniMap({ deliberationId }: { deliberationId: string }) {
  const { data, error, isLoading } = useSWR(`/api/claims/summary?deliberationId=${deliberationId}`, fetcher, { refreshInterval: 0 });

  if (isLoading) return <div className="text-sm text-slate-500">Loading claims…</div>;
  if (error || data?.error) return <div className="text-sm text-rose-600">Failed to load claims</div>;

  const claims = (data?.claims ?? []) as { id: string; text: string; moid?: string; counts: { supports: number; rebuts: number } }[];

  return (
    <div className="mt-4 rounded-lg border border-slate-200 p-3">
      <div className="text-sm font-medium mb-2">Claim mini‑map</div>
      <div className="space-y-2">
        {claims.map((c) => (
         <div key={c.id} className="flex items-start gap-3" title={`Claim MOID: ${c.moid ?? '—'}`}>
<div className="flex-1 text-sm line-clamp-2">{c.text}</div>
            <div className="shrink-0 flex items-center gap-2">
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">+{c.counts.supports}</span>
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">−{c.counts.rebuts}</span>
            </div>
          </div>
        ))}
        {claims.length === 0 && <div className="text-xs text-slate-500">No claims yet.</div>}
      </div>
    </div>
  );
}
