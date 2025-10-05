// // components/kb/ProvenanceChip.tsx
// 'use client';
// import * as React from 'react';
// import clsx from 'clsx';

// export function ProvenanceChip({
//   source,
//   updated,
//   mode,
//   tau,
//   href,
//   pinnedAt,
//   className,
// }: {
//   source: string;          // e.g., "deliberation", "argument", "sheet", "room_functor"
//   updated?: string | null; // ISO
//   mode?: 'product'|'min'|'ds';
//   tau?: number | null;
//   href?: string;
//   pinnedAt?: string | null;
//   className?: string;
// }) {
//   const parts = [
//     source,
//     ...(mode ? [mode] : []),
//     ...(tau!=null ? [`τ=${tau}`] : []),
//     ...(pinnedAt ? [`pinned ${new Date(pinnedAt).toLocaleDateString()}`] : []),
//     ...(updated ? [`updated ${new Date(updated).toLocaleDateString()}`] : []),
//   ].filter(Boolean);

//   const inner = (
//     <span
//       className={clsx(
//         'inline-flex items-center gap-1 text-[11px] px-1.5 py-[2px] rounded border bg-white/70',
//         pinnedAt ? 'border-amber-300 text-amber-700' : 'border-slate-200 text-slate-700',
//         className
//       )}
//     >
//       <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-500" />
//       {parts.join(' • ')}
//     </span>
//   );

//   return href ? (
//     <a href={href} target="_blank" rel="noopener noreferrer">
//       {inner}
//     </a>
//   ) : inner;
// }
'use client';
export function ProvenanceChip({ item }: { item: any }) {
  const src = item?.provenance?.source ?? '—';
  const eps = (item?.provenance?.endpoints ?? []) as string[];
  const mode = (item?.lens ?? '').toString();
  const live = item?.live !== false;

  return (
    <div className="inline-flex items-center gap-2 rounded border bg-white/70 px-2 py-1 text-[11px] text-slate-700">
      <span className="rounded bg-slate-100 px-1">{live ? 'live' : 'pinned'}</span>
      <span className="text-slate-500">•</span>
      <span>{src}</span>
      {mode && (<><span className="text-slate-500">•</span><span>lens:{mode}</span></>)}
      {!!eps.length && (
        <>
          <span className="text-slate-500">•</span>
          <span className="truncate max-w-[240px]" title={eps.join(', ')}>{eps[0]}{eps.length>1?' …':''}</span>
        </>
      )}
      {/* Context actions (first common one if present) */}
      {item?.actions?.openRoom && (
        <a href={item.actions.openRoom} className="ml-2 underline">open</a>
      )}
      {item?.actions?.openSheet && (
        <a href={item.actions.openSheet} className="underline">sheet</a>
      )}
      {item?.actions?.openTransport && (
        <a href={item.actions.openTransport} className="underline">transport</a>
      )}
    </div>
  );
}
