// // components/arguments/SchemeComposer.tsx
// import React from 'react';

// type Scheme = {
//   id: string; key: string; name: string;
//   slotHints?: { premises?: { role: string; label: string }[] } | null;
//   cqs?: { cqKey: string; text: string; attackType: 'REBUTS'|'UNDERCUTS'|'UNDERMINES'; targetScope: 'conclusion'|'inference'|'premise'; }[];
// };

// type CQItem = Scheme['cqs'][number] & { status: 'open'|'answered' };

// type Props = {
//   deliberationId: string;
//   authorId: string;
//   // The claim this RA will support — minimally its id; if you have a picker, pass that result in.
//   conclusionClaim: { id: string; text?: string };
//   defaultSchemeKey?: string;
//   onCreated?: (argumentId: string) => void;
// };

// export function SchemeComposer(props: Props) {
//   const { deliberationId, authorId, conclusionClaim, defaultSchemeKey, onCreated } = props;
//   const [schemes, setSchemes] = React.useState<Scheme[]>([]);
//   const [schemeKey, setSchemeKey] = React.useState<string>(defaultSchemeKey || '');
//   const [premiseIds, setPremiseIds] = React.useState<string[]>([]);
//   const [creating, setCreating] = React.useState(false);
//   const [argumentId, setArgumentId] = React.useState<string | null>(null);
//   const [cqs, setCqs] = React.useState<CQItem[]>([]);
//   const [err, setErr] = React.useState<string | null>(null);

//   React.useEffect(() => {
//     let abort = new AbortController();
//     fetch('/api/schemes', { signal: abort.signal })
//       .then(r => r.ok ? r.json() : Promise.reject(r))
//       .then(d => setSchemes(d.items ?? d ?? []))
//       .catch(() => void 0);
//     return () => abort.abort();
//   }, []);

//   const selected = schemes.find(s => s.key === schemeKey) || null;

//   async function createArgument() {
//     setErr(null);
//     if (!premiseIds.length) { setErr('Add at least one premise.'); return; }
//     setCreating(true);
//     try {
//       const res = await fetch('/api/arguments', {
//         method: 'POST',
//         headers: { 'Content-Type':'application/json' },
//         body: JSON.stringify({
//           deliberationId,
//           authorId,
//           conclusionClaimId: conclusionClaim.id,
//           premiseClaimIds: premiseIds,
//           schemeId: selected?.id ?? null,
//           implicitWarrant: null
//         })
//       });
//       const json = await res.json();
//       if (!res.ok) throw new Error(json?.error || 'Failed to create argument');
//       setArgumentId(json.argumentId || json.argument?.id);
//       onCreated?.(json.argumentId || json.argument?.id);
//       // Load CQs for live chips
//       if (json.argumentId) {
//         const r = await fetch(`/api/arguments/${json.argumentId}/cqs`);
//         const q = await r.json();
//         setCqs((q.items ?? []).map((x: any) => ({ ...x, status: x.status || 'open' })));
//       }
//     } catch (e: any) {
//       setErr(e.message);
//     } finally {
//       setCreating(false);
//     }
//   }

//   async function askCQ(cqKey: string) {
//     if (!argumentId) return;
//     await fetch(`/api/arguments/${argumentId}/cqs/${encodeURIComponent(cqKey)}/ask`, {
//       method: 'POST',
//       headers: { 'Content-Type':'application/json' },
//       body: JSON.stringify({ authorId, deliberationId })
//     });
//     setCqs(cs => cs.map(c => c.cqKey === cqKey ? { ...c, status: 'open' } : c));
//   }

//   return (
//     <div className="scheme-composer">
//       <div className="row">
//         <div className="cell">
//           <label className="lbl">Scheme</label>
//           <select className="sel" value={schemeKey} onChange={(e)=>setSchemeKey(e.target.value)}>
//             <option value="">(choose a scheme)</option>
//             {schemes.map(s => <option key={s.key} value={s.key}>{s.name}</option>)}
//           </select>
//           {selected?.slotHints?.premises?.length ? (
//             <div className="hint">
//               {selected.slotHints.premises.map(p => (
//                 <span key={p.role} className="chip hint">{p.label}</span>
//               ))}
//             </div>
//           ) : null}
//         </div>
//       </div>

//       <div className="row">
//         <div className="cell">
//           <label className="lbl">Conclusion</label>
//           <div className="box">{conclusionClaim.text ?? conclusionClaim.id}</div>
//         </div>
//       </div>

//       <div className="row">
//         <div className="cell">
//           <label className="lbl">Premises (claim IDs)</label>
//           <PremiseEditor value={premiseIds} onChange={setPremiseIds} />
//           <div className="subtle">Use your real ClaimPicker here; this version accepts IDs for speed.</div>
//         </div>
//       </div>

//       <div className="row actions">
//         <button className="btn primary" disabled={creating || !schemeKey || !premiseIds.length} onClick={createArgument}>
//           {creating ? 'Creating…' : 'Create Argument'}
//         </button>
//         {err && <span className="err">{err}</span>}
//       </div>

//       {argumentId && !!cqs.length && (
//         <div className="cq-panel">
//           <div className="lbl">Critical Questions</div>
//           <div className="chips">
//             {cqs.map(c => (
//               <button
//                 key={c.cqKey}
//                 className={`chip cq ${c.status === 'answered' ? 'ok' : 'warn'}`}
//                 title={`${c.attackType} → ${c.targetScope}`}
//                 onClick={() => askCQ(c.cqKey)}
//               >
//                 {c.text}{c.status === 'answered' ? ' ✓' : ''}
//               </button>
//             ))}
//           </div>
//         </div>
//       )}

//       <style jsx>{`
//         .scheme-composer { border:1px solid #e5e7eb; border-radius:10px; padding:16px; background:#fff }
//         .row { display:flex; gap:16px; margin-bottom:12px; }
//         .cell { flex:1; }
//         .lbl { font-size:12px; font-weight:600; color:#374151; display:block; margin-bottom:6px; text-transform:uppercase; letter-spacing:.02em }
//         .sel, .box, .input { width:100%; border:1px solid #d1d5db; border-radius:8px; padding:8px 10px; }
//         .box { background:#f9fafb }
//         .hint { margin-top:6px }
//         .chip.hint { margin-right:6px; background:#eef2ff; color:#4338ca; border-radius:999px; padding:2px 8px; font-size:12px; }
//         .actions { align-items:center }
//         .btn { border:1px solid #d1d5db; border-radius:8px; padding:8px 12px; background:#f3f4f6; }
//         .btn.primary { background:#111827; color:white; border-color:#111827; }
//         .err { color:#b91c1c; margin-left:10px; font-size:13px; }
//         .cq-panel { border-top:1px dashed #e5e7eb; padding-top:12px; margin-top:8px; }
//         .chips { display:flex; flex-wrap:wrap; gap:8px; }
//         .chip.cq { border:1px solid #e5e7eb; border-radius:999px; padding:4px 10px; background:#fff; font-size:13px; }
//         .chip.cq.warn { background:#fff7ed; border-color:#fed7aa; }
//         .chip.cq.ok { background:#ecfdf5; border-color:#a7f3d0; }
//         .subtle { color:#6b7280; font-size:12px; margin-top:6px; }
//       `}</style>
//     </div>
//   );
// }

// function PremiseEditor(props: { value: string[]; onChange: (v:string[])=>void }) {
//   const [text, setText] = React.useState(props.value.join(','));
//   React.useEffect(() => setText(props.value.join(',')), [props.value]);
//   return (
//     <input
//       className="input"
//       placeholder="premise-claim-id-1, premise-claim-id-2, …"
//       value={text}
//       onChange={(e) => {
//         setText(e.target.value);
//         props.onChange(
//           e.target.value.split(',').map(s => s.trim()).filter(Boolean)
//         );
//       }}
//     />
//   );
// }
// components/arguments/SchemeComposer.tsx
import * as React from 'react';
import { LegalMovesChipsAIF } from '../dialogue/LegalMoveChips-AIF';
import { AttackMenu } from './AttackMenu';

type Slot = { role: string; label: string; placeholder?: string; value?: string };
type Props = {
  schemeKey?: string | null;
  slots?: Slot[];
  cqs?: Array<{ cqKey: string; text: string; status: 'open'|'answered'; attackType: string; targetScope: string }>;
  onSubmit: (payload: {
    conclusionClaimId: string;
    premiseClaimIds: string[];
    schemeId?: string | null;
    implicitWarrant?: any;
    text?: string;
  }) => Promise<void>;
};

export function SchemeComposer({ schemeKey, slots = [], cqs = [], onSubmit }: Props) {
  const [conclusion, setConclusion] = React.useState('');
  const [premises, setPremises] = React.useState<string[]>([]);
  const [notes, setNotes] = React.useState('');

  return (
    <div className='flex flex-col gap-4'>
    <div className="border rounded-md p-4 space-y-3">
      <div className="text-sm text-gray-500">{schemeKey ? `Using scheme: ${schemeKey}` : 'Freeform argument'}</div>

      <div className="space-y-2">
        {slots.map((s, i) => (
          <label key={i} className="block">
            <span className="text-xs text-gray-600">{s.label}</span>
            <input className="w-full border rounded px-2 py-1"
                   placeholder={s.placeholder ?? s.label}
                   defaultValue={s.value ?? ''} />
          </label>
        ))}
      </div>

      <div className="space-y-2">
        <label className="block">
          <span className="text-xs text-gray-600">Conclusion (claim id or paste text → will be created upstream)</span>
          <input value={conclusion} onChange={e=>setConclusion(e.target.value)} className="w-full border rounded px-2 py-1"/>
        </label>

        <label className="block">
          <span className="text-xs text-gray-600">Premises (claim ids, comma-separated)</span>
          <input onChange={e=>setPremises(e.target.value.split(',').map(x=>x.trim()).filter(Boolean))}
                 className="w-full border rounded px-2 py-1"/>
        </label>

        <label className="block">
          <span className="text-xs text-gray-600">Notes / implicit warrant (optional)</span>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)} className="w-full border rounded px-2 py-1"/>
        </label>
      </div>

      {cqs.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {cqs.map(cq => (
            <span key={cq.cqKey} className={`px-2 py-0.5 rounded-full text-xs ${cq.status==='open' ? 'bg-rose-100' : 'bg-emerald-100'}`}
                  title={`${cq.text} (${cq.attackType.toLowerCase()}/${cq.targetScope})`}>
              {cq.status==='open' ? '⚠️' : '✅'} {cq.cqKey}
            </span>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <button className="px-3 py-1 rounded bg-black text-white"
                onClick={() => onSubmit({
                  conclusionClaimId: conclusion,
                  premiseClaimIds: premises,
                  schemeId: schemeKey ?? null,
                  implicitWarrant: notes ? { text: notes } : null
                })}>
          Add argument
        </button>
      </div>
    </div>
    <AttackMenu onSelect={console.log} />

      <LegalMovesChipsAIF allowed={['ASSERT','WHY','GROUNDS','REBUT','CONCEDE','RETRACT','CLOSE']} onPick={console.log} />
    </div>
  );
}
