// 'use client';
// import useSWR from 'swr';

// const fetcher = (url: string) => fetch(url).then((r) => r.json());



// type ClaimRow = {
//     id: string;
//     text: string;
//     counts: { supports: number; rebuts: number };
//   };
  
//   type LabelRow = { claimId: string; label: 'IN'|'OUT'|'UNDEC'; explainJson?: any };
  
//   function Dot({ label }: { label: 'IN'|'OUT'|'UNDEC' }) {
//     const cls =
//       label === 'IN' ? 'bg-emerald-500' :
//       label === 'OUT' ? 'bg-rose-500' : 'bg-slate-400';
//     const title =
//       label === 'IN' ? 'Warranted (grounded semantics)' :
//       label === 'OUT' ? 'Defeated by an IN attacker' :
//       'Undecided';
//     return <span title={title} className={`inline-block w-2.5 h-2.5 rounded-full ${cls}`} />;
//   }

  

// export default function ClaimMiniMap({ deliberationId }: { deliberationId: string }) {
//   const { data: summary, error, isLoading } = useSWR(
//          `/api/claims/summary?deliberationId=${deliberationId}`,
//          fetcher,
//          { revalidateOnFocus: false, dedupingInterval: 1200 }
//        );

//   const { data: labelsData } = useSWR(
//     `/api/claims/labels?deliberationId=${deliberationId}`,
//     fetcher,
//     { revalidateOnFocus: false, dedupingInterval: 1200 }
//    );

//   if (isLoading) return <div className="text-sm text-slate-500">Loading claims…</div>;
//    if (error || summary?.error) return <div className="text-sm text-rose-600">Failed to load claims</div>;

//  // const claims = (data?.claims ?? []) as { id: string; text: string; moid?: string; counts: { supports: number; rebuts: number } }[];


//   const claims: ClaimRow[] = (summary?.claims ?? []);
//   const labels: Record<string, LabelRow> = Object.fromEntries(
//     ((labelsData?.labels ?? []) as LabelRow[]).map(l => [l.claimId, l])
//   );

//   return (
//     <div className="mt-3 rounded-lg border border-indigo-200 p-3 shadow-sm shadow-slate-500/30 mb-1">
//       <h3 className="flex text-[16px] font-semibold mb-2">Claim mini‑map</h3>
//       <div className=" flex flex-wrap  gap-3 ">
//         {claims.map((c) => {
//           const lab = labels[c.id]?.label ?? 'UNDEC';
//           const why = labels[c.id]?.explainJson;
//           const tip = why ? JSON.stringify(why) : undefined;
//           return (
//             <div key={c.id} className="flex border rounded-lg border-slate-200 items-start p-1 gap-3 w-fit bg-slate-50" title={tip}>
//               <div className="mt-1"><Dot label={lab} /></div>
//               <div className="flex-1 text-sm  line-clamp-2">{c.text}</div>
//               <div className="shrink-0 flex items-center gap-2">
//                 <span className="text-[11px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">+{c.counts.supports}</span>
//                 <span className="text-[11px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">−{c.counts.rebuts}</span>
//               </div>
//             </div>
//           );
//         })}
//         {claims.length === 0 && <div className="text-xs text-slate-500">No claims yet.</div>}
//       </div>
//       <div className="text-[11px] text-slate-500 mt-4 flex items-center gap-3">
//          <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> IN</span>
//          <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> OUT</span>
//          <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> UNDEC</span>
//          <span className="opacity-70">(grounded semantics)</span>
//        </div>    </div>
//   );
// }
'use client';
import { useState } from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type ClaimRow = {
  id: string;
  text: string;
  counts: { supports: number; rebuts: number };
};
type LabelRow = { claimId: string; label: 'IN'|'OUT'|'UNDEC'; explainJson?: any };

function Dot({ label }: { label: 'IN'|'OUT'|'UNDEC' }) {
  const cls = label === 'IN' ? 'bg-emerald-500' : label === 'OUT' ? 'bg-rose-500' : 'bg-slate-400';
  const title =
    label === 'IN' ? 'Warranted (grounded semantics)' :
    label === 'OUT' ? 'Defeated by an IN attacker' : 'Undecided';
  return <span title={title} className={`inline-block w-2.5 h-2.5 rounded-full ${cls}`} />;
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

  const [limit, setLimit] = useState(PAGE_SIZE);

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
        </>
      )}
    </div>
  );
}
