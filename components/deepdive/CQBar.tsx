// // components/deepdive/CQBar.tsx
// 'use client';
// import useSWR from 'swr';
// const fetcher = (u:string)=>fetch(u,{cache:'no-store'}).then(r=>r.json());

// export default function CQBar({ claimId }:{ claimId:string }) {
//   const { data } = useSWR<{ required:number; satisfied:number; completeness:number }>(
//     `/api/claims/${claimId}/cq/summary`, fetcher, { revalidateOnFocus:false }
//   );
//   if (!data) return null;
//   const pct = Math.round(100 * (data.completeness || 0));
//   return (
//     <div className="mt-1 text-[11px] text-neutral-600">
//       CQ completeness
//       <div className="h-1.5 bg-slate-200 rounded mt-1">
//         <div className="h-1.5 bg-emerald-400 rounded" style={{ width: `${pct}%` }} />
//       </div>
//       <span className="ml-1">{data.satisfied}/{data.required}</span>
//     </div>
//   );
// }
'use client';
export default function CQBar({ satisfied, required, compact = false }: { satisfied: number; required: number; compact?: boolean }) {
  const pct = required ? Math.round((satisfied / required) * 100) : 0;
  return (
    <div className={compact ? 'w-32' : 'w-full'}>
      <div className="h-1.5 bg-slate-200 rounded">
        <div className="h-1.5 bg-emerald-400 rounded" style={{ width: `${pct}%` }} />
      </div>
      <div className="text-[11px] text-neutral-600 mt-0.5">
        CQ: {satisfied}/{required} ({pct}%)
      </div>
    </div>
  );
}
