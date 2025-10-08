// // components/arguments/ArgumentCard.tsx
// import React from 'react';
// import { AttackMenu } from './AttackMenu';

// type Label = 'IN'|'OUT'|'UNDEC';

// type CQ = {
//   cqKey: string; text: string;
//   attackType: 'REBUTS'|'UNDERCUTS'|'UNDERMINES';
//   targetScope: 'conclusion'|'inference'|'premise';
//   status: 'open'|'answered';
// };

// type Claim = { id: string; text: string };

// type Argument = {
//   id: string;
//   conclusion: Claim;
//   premises: Claim[];
//   schemeKey?: string | null;
//   label?: Label; // optional AF label if you computed it
// };

// type Props = {
//   deliberationId: string;
//   authorId: string;
//   arg: Argument;
//   defaultExpanded?: boolean;
//   onAnyChange?: () => void; // call to refetch parent lists after edits
// };

// export function ArgumentCard({ deliberationId, authorId, arg, defaultExpanded, onAnyChange }: Props) {
//   const [expanded, setExpanded] = React.useState(!!defaultExpanded);
//   const [cqs, setCqs] = React.useState<CQ[]>([]);
//   const [loadingCqs, setLoadingCqs] = React.useState(false);

//   React.useEffect(() => {
//     let abort = new AbortController();
//     setLoadingCqs(true);
//     fetch(`/api/arguments/${arg.id}/cqs`, { signal: abort.signal })
//       .then(r => r.ok ? r.json() : Promise.reject(r))
//       .then(d => setCqs(d.items ?? []))
//       .catch(() => void 0)
//       .finally(() => setLoadingCqs(false));
//     return () => abort.abort();
//   }, [arg.id]);

//   async function ask(cqKey: string) {
//     await fetch(`/api/arguments/${arg.id}/cqs/${encodeURIComponent(cqKey)}/ask`, {
//       method: 'POST', headers: { 'Content-Type':'application/json' },
//       body: JSON.stringify({ authorId, deliberationId })
//     });
//     setCqs(cs => cs.map(c => c.cqKey === cqKey ? { ...c, status: 'open' } : c));
//   }

//   async function answer(cqKey: string) {
//     // Simple path: mark answered without creating a defeating RA; the SchemeComposer flow can do the “answer with grounds” variant
//     await fetch(`/api/arguments/${arg.id}/cqs/${encodeURIComponent(cqKey)}/answer`, {
//       method: 'POST', headers: { 'Content-Type':'application/json' },
//       body: JSON.stringify({ authorId, deliberationId })
//     });
//     setCqs(cs => cs.map(c => c.cqKey === cqKey ? { ...c, status: 'answered' } : c));
//     onAnyChange?.();
//   }

//   return (
//     <div className={`arg-card ${expanded ? 'open' : ''}`} aria-expanded={expanded}>
//       <div className="head">
//         <span className={`badge ${arg.label?.toLowerCase() || 'undec'}`}>{arg.label ?? 'UNDEC'}</span>
//         <div className="title">{arg.conclusion.text}</div>
//         <div className="actions">
//           <button className="ghost" onClick={()=>setExpanded(x=>!x)}>{expanded ? 'Hide' : 'Show'} details</button>
//         </div>
//       </div>

//       {expanded && (
//         <>
//           <div className="premises">
//             <div className="col">
//               <div className="h">Premises</div>
//               <ul>
//                 {arg.premises.map(p => <li key={p.id}>• {p.text}</li>)}
//               </ul>
//             </div>

//             <div className="col warrant">
//               <div className="h">Warrant</div>
//               <div className="box" id={`warrant-${arg.id}`}>Reasoning step (RA). Undercuts attach here.</div>
//             </div>

//             <div className="col">
//               <div className="h">Actions</div>
//               <AttackMenu
//                 deliberationId={deliberationId}
//                 authorId={authorId}
//                 target={{ id: arg.id, conclusion: arg.conclusion, premises: arg.premises }}
//                 onCreated={onAnyChange}
//               />
//             </div>
//           </div>

//           <div className="cqbar">
//             <div className="h">Critical Questions</div>
//             <div className="chips">
//               {loadingCqs && <span className="muted">Loading…</span>}
//               {cqs.map(q => (
//                 <span key={q.cqKey} className={`chip ${q.status === 'answered' ? 'ok' : 'open'}`} title={`${q.attackType} → ${q.targetScope}`}>
//                   {q.text}
//                   {q.status === 'answered' ? (
//                     <button className="link" onClick={()=>ask(q.cqKey)} title="Reopen as a challenge">Reopen</button>
//                   ) : (
//                     <button className="link" onClick={()=>answer(q.cqKey)} title="Mark answered (or answer with grounds via composer)">Answer</button>
//                   )}
//                 </span>
//               ))}
//             </div>
//           </div>
//         </>
//       )}

//       <style jsx>{`
//         .arg-card { border:1px solid #e5e7eb; border-radius:12px; background:#fff; overflow:hidden; }
//         .head { display:flex; gap:12px; align-items:center; padding:12px 14px; border-bottom:1px solid #f3f4f6; }
//         .badge { font-size:12px; border-radius:999px; padding:2px 8px; border:1px solid #e5e7eb; }
//         .badge.in { background:#ecfdf5; border-color:#a7f3d0; }
//         .badge.out { background:#fef2f2; border-color:#fecaca; }
//         .badge.undec { background:#f3f4f6; }
//         .title { flex:1; font-weight:600; color:#111827; }
//         .actions { display:flex; gap:8px; }
//         .ghost { background:transparent; border:1px solid #e5e7eb; border-radius:8px; padding:6px 10px; }
//         .premises { display:grid; grid-template-columns: 1.2fr 1fr 1fr; gap:16px; padding:12px 14px; }
//         .col .h { font-size:12px; text-transform:uppercase; color:#6b7280; margin-bottom:6px; }
//         .warrant .box { border:2px dashed #c7d2fe; background:#eef2ff; color:#1f2937; padding:10px; border-radius:10px; }
//         .cqbar { border-top:1px dashed #e5e7eb; padding:12px 14px; }
//         .chips { display:flex; gap:8px; flex-wrap:wrap; }
//         .chip { display:inline-flex; gap:8px; align-items:center; border:1px solid #e5e7eb; border-radius:999px; padding:4px 10px; background:#fff; }
//         .chip.open { background:#fff7ed; border-color:#fed7aa; }
//         .chip.ok { background:#ecfdf5; border-color:#a7f3d0; }
//         .link { background:transparent; border:0; text-decoration:underline; font-size:12px; color:#111827; cursor:pointer; }
//         .muted { color:#6b7280; font-size:12px; }
//       `}</style>
//     </div>
//   );
// }
// components/arguments/ArgumentCard.tsx
import * as React from 'react';
import { AttackMenu } from './AttackMenu';

type Prem = { id: string; text: string };
type Props = {
  id: string;
  conclusion: { id: string; text: string };
  premises: Prem[];
  openCQCount?: number;
  onAttack: (attack: { attackType: 'REBUTS'|'UNDERCUTS'|'UNDERMINES'; targetScope: 'conclusion'|'inference'|'premise'; premiseId?: string }) => void;
};

export function ArgumentCard({ id, conclusion, premises, openCQCount = 0, onAttack }: Props) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div className="border rounded-md p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="font-medium">{conclusion.text}</div>
        <div className="flex gap-2 items-center">
          {openCQCount > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100">{openCQCount} open CQ</span>}
          <button className="text-xs underline" onClick={()=>setExpanded(x=>!x)}>
            {expanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>

      {expanded ? (
        <>
          {/* WARRANT BOX (the RA/inference) */}
          <div className="border rounded p-2 bg-yellow-50">
            <div className="text-xs text-gray-600 mb-1">Warranted by:</div>
            <ul className="list-disc list-inside">
              {premises.map(p => <li key={p.id}>{p.text}</li>)}
            </ul>
          </div>

          {/* Attach undercuts to the warrant box */}
          <AttackMenu onSelect={(s) => {
            if (s.targetScope === 'premise') {
              const premId = window.prompt('Which premise id do you want to challenge?');
              onAttack({ ...s, premiseId: premId || undefined });
            } else {
              onAttack(s);
            }
          }}/>
        </>
      ) : (
        <div className="text-sm text-gray-600 truncate">
          Premises: {premises.map(p => p.text).join(' • ')}
        </div>
      )}
    </div>
  );
}
