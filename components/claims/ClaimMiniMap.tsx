'use client';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());



type ClaimRow = {
    id: string;
    text: string;
    counts: { supports: number; rebuts: number };
  };
  
  type LabelRow = { claimId: string; label: 'IN'|'OUT'|'UNDEC'; explainJson?: any };
  
  function Dot({ label }: { label: 'IN'|'OUT'|'UNDEC' }) {
    const cls =
      label === 'IN' ? 'bg-emerald-500' :
      label === 'OUT' ? 'bg-rose-500' : 'bg-slate-400';
    const title =
      label === 'IN' ? 'Warranted (grounded semantics)' :
      label === 'OUT' ? 'Defeated by an IN attacker' :
      'Undecided';
    return <span title={title} className={`inline-block w-2.5 h-2.5 rounded-full ${cls}`} />;
  }

  

export default function ClaimMiniMap({ deliberationId }: { deliberationId: string }) {
  const { data, error, isLoading } = useSWR(`/api/claims/summary?deliberationId=${deliberationId}`, fetcher, { refreshInterval: 0 });
  const { data: summary } = useSWR(
    `/api/claims/summary?deliberationId=${deliberationId}`,
    fetcher
  );
  const { data: labelsData } = useSWR(
    `/api/claims/labels?deliberationId=${deliberationId}`,
    fetcher
  );

  if (isLoading) return <div className="text-sm text-slate-500">Loading claims…</div>;
  if (error || data?.error) return <div className="text-sm text-rose-600">Failed to load claims</div>;

 // const claims = (data?.claims ?? []) as { id: string; text: string; moid?: string; counts: { supports: number; rebuts: number } }[];


  const claims: ClaimRow[] = (summary?.claims ?? []);
  const labels: Record<string, LabelRow> = Object.fromEntries(
    ((labelsData?.labels ?? []) as LabelRow[]).map(l => [l.claimId, l])
  );

  return (
    <div className="mt-4 rounded-lg border border-slate-200 p-3">
      <div className="text-sm font-medium mb-2">Claim mini‑map</div>
      <div className=" flex flex-wrap  gap-4">
        {claims.map((c) => {
          const lab = labels[c.id]?.label ?? 'UNDEC';
          const why = labels[c.id]?.explainJson;
          const tip = why ? JSON.stringify(why) : undefined;
          return (
            <div key={c.id} className="flex border rounded-lg border-slate-200 items-start p-1 gap-3 w-fit" title={tip}>
              <div className="mt-1"><Dot label={lab} /></div>
              <div className="flex-1 text-sm line-clamp-2">{c.text}</div>
              <div className="shrink-0 flex items-center gap-2">
                <span className="text-[11px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">+{c.counts.supports}</span>
                <span className="text-[11px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">−{c.counts.rebuts}</span>
              </div>
            </div>
          );
        })}
        {claims.length === 0 && <div className="text-xs text-slate-500">No claims yet.</div>}
      </div>
      <div className="text-[11px] text-slate-500 mt-4"> ● IN · ○ OUT · ◐ UNDEC (grounded semantics)</div>
    </div>
  );
}
