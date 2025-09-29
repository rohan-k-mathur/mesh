
'use client';
import { useState } from 'react';
import useSWR from 'swr';
import React from 'react';
const fetcher = (url: string) => fetch(url).then((r) => r.json());
  import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
  } from '@/components/ui/dialog';
  import CriticalQuestions from '@/components/claims/CriticalQuestions';

type ClaimRow = {
  id: string;
  text: string;
  counts: { supports: number; rebuts: number };
   cq?: { required: number; satisfied: number };
};
type LabelRow = { claimId: string; label: 'IN'|'OUT'|'UNDEC'; explainJson?: any };

function Dot({ label }: { label: 'IN'|'OUT'|'UNDEC' }) {
  const cls = label === 'IN' ? 'bg-emerald-500' : label === 'OUT' ? 'bg-rose-500' : 'bg-slate-400';
  const title =
    label === 'IN' ? 'Warranted (grounded semantics)' :
    label === 'OUT' ? 'Defeated by an IN attacker' : 'Undecided';
  return <span title={title} className={`inline-block w-2.5 h-2.5 rounded-full ${cls}`} />;
}


  function CqMeter({ cq }: { cq?: { required: number; satisfied: number } }) {
    const r = cq?.required ?? 0, s = cq?.satisfied ?? 0;
    const pct = r ? Math.round((s / r) * 100) : 0;
    return (
      <span
        className="text-[10px] px-1 py-0.5 rounded border bg-white"
        title={r ? `${s}/${r} CQs satisfied` : 'No CQs yet'}
      >
        CQ {pct}%
      </span>
    );
  }

const PAGE_SIZE = 8;

export default function ClaimMiniMap({ deliberationId }: { deliberationId: string }) {
  const { data: summary, error, isLoading } = useSWR(
    `/api/claims/summary?deliberationId=${deliberationId}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 1200 }
  );
  const { data: labelsData } = useSWR(
    `/api/claims/labels?deliberationId=${deliberationId}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 1200 }
  );

  // wherever you define SWR hooks:
const { mutate: mutateSummary } = useSWR(`/api/claims/summary?deliberationId=${deliberationId}`, fetcher, { revalidateOnFocus: false });
const { mutate: mutateLabels }  = useSWR(`/api/claims/labels?deliberationId=${deliberationId}`,  fetcher, { revalidateOnFocus: false });

React.useEffect(() => {
  const h = () => {
    mutateSummary();
    mutateLabels();
  };
  window.addEventListener('claims:changed', h);
  return () => window.removeEventListener('claims:changed', h);
}, [mutateSummary, mutateLabels]);

  const [limit, setLimit] = useState(PAGE_SIZE);
  const [cqOpenFor, setCqOpenFor] = useState<string | null>(null);

  // Compute data unconditionally so hooks count/order is stable
  const claims: ClaimRow[] = (summary?.claims ?? []);
  const labels: Record<string, LabelRow> = Object.fromEntries(
    ((labelsData?.labels ?? []) as LabelRow[]).map(l => [l.claimId, l])
  );
  const visibleClaims = claims.slice(0, limit);
  const remaining = Math.max(0, claims.length - limit);
  const canShowMore = remaining > 0;
  const canCollapse = limit > PAGE_SIZE;

  const failed = Boolean(error || summary?.error);

  return (
    <div className="mt-3 rounded-lg border border-indigo-200 p-3 shadow-sm shadow-slate-500/30 mb-1">
      {isLoading ? (
        <div className="text-sm text-slate-500">Loading claims…</div>
      ) : failed ? (
        <div className="text-sm text-rose-600">Failed to load claims</div>
      ) : (
        <>
          <h3 className="flex text-[16px] font-semibold mb-2">Claim mini-map</h3>

          <div className="flex flex-wrap gap-3">
            {visibleClaims.map((c) => {
              const lab = labels[c.id]?.label ?? 'UNDEC';
              const tip = labels[c.id]?.explainJson ? JSON.stringify(labels[c.id]?.explainJson) : undefined;
              return (
                <div key={c.id} className="flex border rounded-lg border-slate-200 items-start p-1 gap-3 w-fit bg-slate-50" title={tip}>
                  <div className="mt-1"><Dot label={lab} /></div>
                  <div className="flex-1 text-sm line-clamp-2 max-w-[34rem]">{c.text}</div>
                  <div className="shrink-0 flex items-center gap-2">
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">+{c.counts.supports}</span>
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">−{c.counts.rebuts}</span>
                    <CqMeter cq={c.cq} />
                                          {/* NEW: open claim-level Critical Questions */}
                      <button
                        className="text-[11px] px-1.5 py-0.5 rounded border bg-white hover:bg-slate-50"
                        title="Open Critical Questions"
                        onClick={() => setCqOpenFor(c.id)}
                      >
                        CQs
                      </button>
                  </div>
                </div>
              );
            })}
            {claims.length === 0 && <div className="text-xs text-slate-500">No claims yet.</div>}
          </div>

          {(canShowMore || canCollapse) && (
            <div className="mt-3 flex items-center gap-2">
              {canShowMore && (
                <button
                  onClick={() => setLimit(n => n + PAGE_SIZE)}
                  className="text-xs px-2 py-1 rounded border border-slate-300 bg-white hover:bg-slate-50"
                  aria-label={`Show ${Math.min(PAGE_SIZE, remaining)} more claims`}
                >
                  Show more{remaining > PAGE_SIZE ? ` (+${PAGE_SIZE})` : ` (+${remaining})`}
                </button>
              )}
              {canCollapse && (
                <button
                  onClick={() => setLimit(PAGE_SIZE)}
                  className="text-xs px-2 py-1 rounded border border-slate-300 bg-white hover:bg-slate-50"
                >
                  Collapse
                </button>
              )}
              <span className="text-[11px] text-slate-500">
                Showing {visibleClaims.length} of {claims.length}
              </span>
            </div>
          )}

          <div className="text-[11px] text-slate-500 mt-4 flex items-center gap-3">
            <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> IN</span>
            <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> OUT</span>
            <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> UNDEC</span>
            <span className="opacity-70">(grounded semantics)</span>
          </div>

            {/* NEW: claim-level Critical Questions modal */}
            {cqOpenFor && (
              <Dialog open onOpenChange={(o) => { if (!o) setCqOpenFor(null); }}>
                <DialogContent className="bg-white rounded-xl sm:max-w-[880px]">
                  <DialogHeader>
                    <DialogTitle>Claim-level Critical Questions</DialogTitle>
                  </DialogHeader>
                  <div className="mt-2">
                    <CriticalQuestions
                      targetType="claim"
                      targetId={cqOpenFor}
                      createdById="current"
                      deliberationId={deliberationId}
                    />
                  </div>
                </DialogContent>
              </Dialog>
            )}
        </>
      )}
    </div>
  );
}
