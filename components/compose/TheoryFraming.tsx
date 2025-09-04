// 'use client';
// import * as React from 'react';
// import PracticalBuilder from '../practical/PracticalBuilder';
// import PracticalSummary from '../practical/PracticalSummary';

// type TheoryType = 'DN'|'IH'|'TC'|'OP';

// export function TheoryFraming({
//   value,
//   onChange,
//   className = '',
//   workId,
//   canEditPractical = true,
//   defaultOpenBuilder = false,
// }: {
//   value: { theoryType: TheoryType; standardOutput?: string };
//   onChange: (v: { theoryType: TheoryType; standardOutput?: string }) => void;
//   className?: string;

//   /** If present, enables PracticalSummary and (for DN/IH/TC) the PracticalBuilder. */
//   workId?: string;

//   /** If false, hides the PracticalBuilder even if workId exists (e.g., read-only view). */
//   canEditPractical?: boolean;

//   /** If true, builder starts expanded when it’s available. */
//   defaultOpenBuilder?: boolean;
// }) {
//   const t = value.theoryType;
//   const [openBuilder, setOpenBuilder] = React.useState(defaultOpenBuilder);

//   const requiresPractical = t === 'IH' || t === 'TC' || t === 'DN';

//   return (
//     <div className={`rounded border p-3 space-y-3 ${className}`}>
//       <div className="text-sm font-medium">Philosophical framing</div>

//       <label className="block text-xs text-neutral-600">Theory Type</label>
//       <select
//         className="border rounded px-2 py-1 text-sm"
//         value={t}
//         onChange={(e) => onChange({ ...value, theoryType: e.target.value as TheoryType })}
//       >
//         <option value="DN">DN — Descriptive–Nomological (empirical)</option>
//         <option value="IH">IH — Idealizing–Hermeneutic (interpret → idealize)</option>
//         <option value="TC">TC — Technical–Constructive (design an instrument)</option>
//         <option value="OP">OP — Ontic–Practical (as-if decision under uncertainty)</option>
//       </select>

//       {(t === 'IH' || t === 'TC') && (
//         <div>
//           <label className="block text-xs text-neutral-600 mb-1">
//             Standard Output (purpose of the instrument)
//           </label>
//           <input
//             className="w-full border rounded px-2 py-1 text-sm"
//             value={value.standardOutput ?? ''}
//             onChange={(e) => onChange({ ...value, standardOutput: e.target.value })}
//             placeholder="e.g., Maximize public health while preserving autonomy"
//           />
//           <div className="mt-1 text-[11px] text-neutral-500">
//             This is the “key to all further findings” (Lumer TIH9/TTC2).
//           </div>
//         </div>
//       )}

//       {(t === 'DN' || t === 'OP') && (
//         <div className="text-[11px] text-neutral-500">
//           DN: Provide empirical premises; OP: justify as-if decision via practical/Pascal reasoning (coming sprints).
//         </div>
//       )}

//       {/* --- Practical summary / builder wiring --- */}
//       {workId ? (
//         <div className="mt-2 space-y-2">
//           {/* Always show a read-only summary if a work exists */}
//           <PracticalSummary workId={workId} />

//           {/* For DN/IH/TC, expose the builder when editing is allowed */}
//           {requiresPractical && canEditPractical && (
//             <div className="rounded border p-2">
//               <div className="flex items-center justify-between">
//                 <div className="text-xs font-medium">
//                   Practical Justification (MCDA)
//                 </div>
//                 <button
//                   type="button"
//                   className="px-2 py-0.5 text-[11px] border rounded"
//                   onClick={() => setOpenBuilder((v) => !v)}
//                 >
//                   {openBuilder ? 'Hide' : 'Edit'}
//                 </button>
//               </div>
//               {openBuilder && (
//                 <div className="mt-2">
//                   <PracticalBuilder workId={workId} />
//                 </div>
//               )}
//             </div>
//           )}
//         </div>
//       ) : (
//         <div className="text-[11px] text-neutral-500">
//           Save this work to attach a Practical Argument and view its summary here.
//         </div>
//       )}
//     </div>
//   );
// }

// components/compose/TheoryFraming.tsx


'use client';
import * as React from 'react';
import useSWR from 'swr';
import PracticalBuilder from '../practical/PracticalBuilder';
import PracticalSummary from '../practical/PracticalSummary';
import HermeneuticBuilder from '../hermeneutic/HermeneuticBuilder';
import PascalBuilder from '../pascal/PascalBuilder';
import WorkIntegrityBadge from '../integrity/WorkIntegrityBadge';
import IntegrityBadge from '../integrity/IntegrityBadge';

type TheoryType = 'DN'|'IH'|'TC'|'OP';
const fetcher = (u:string) => fetch(u, { cache:'no-store' }).then(r=>r.json());


export function TheoryFraming({
  value,
  onChange,
  className = '',
  workId,
  canEditPractical = false,
  defaultOpenBuilder = false,
}: {
  value: { theoryType: TheoryType; standardOutput?: string };
  onChange: (v: { theoryType: TheoryType; standardOutput?: string }) => void;
  className?: string;
  workId?: string;                 // ← enable summary/builder when present
  canEditPractical?: boolean;
  defaultOpenBuilder?: boolean;
}) {
  const t = value.theoryType;

    // let summaries refresh when workId present
    const { data: herm } = useSWR(workId ? `/api/works/${workId}/hermeneutic` : null, fetcher, { revalidateOnFocus:false });
    const { data: pasc } = useSWR(workId ? `/api/works/${workId}/pascal` : null, fetcher, { revalidateOnFocus:false });
    const hermeneutic = herm?.hermeneutic;
    const pascal = pasc?.pascal;
  
    const [openIH, setOpenIH] = React.useState(defaultOpenBuilder && t==='IH');
    const [openPrac, setOpenPrac] = React.useState(defaultOpenBuilder && (t==='IH' || t==='TC'));
    const [openOP, setOpenOP] = React.useState(defaultOpenBuilder && t==='OP');

  return (
    <div className={`rounded border p-3 space-y-3 ${className}`}>
              <div className="flex items-center justify-between">

      <div className="text-sm font-medium">Theoretical framing</div>
      {workId && <WorkIntegrityBadge workId={workId} theoryType={t} />}
      </div>


      <label className="block text-xs text-neutral-600">Frame type (optional)</label>
      <select
        className="border rounded px-2 py-1 text-sm"
        value={t}
        onChange={(e) => onChange({ ...value, theoryType: e.target.value as TheoryType })}
      >
        <option value="DN">DN — Descriptive–Nomological (empirical)</option>
        <option value="IH">IH — Idealizing–Hermeneutic (interpret → idealize)</option>
        <option value="TC">TC — Technical–Constructive (design an instrument)</option>
        <option value="OP">OP — Ontic–Practical (as‑if decision under uncertainty)</option>
      </select>

      {(t === 'IH' || t === 'TC') && (
        <div>
          <label className="block text-xs text-neutral-600 mb-1">
            Standard Output (purpose of the instrument)
          </label>
          <input
            className="w-full border rounded px-2 py-1 text-sm"
            value={value.standardOutput ?? ''}
            onChange={(e) => onChange({ ...value, standardOutput: e.target.value })}
            placeholder="e.g., Maximize public health while preserving autonomy"
          />
          <div className="mt-1 text-[11px] text-neutral-500">
            This is the “key to all further findings” (Lumer TIH9/TTC2).
          </div>
        </div>
      )}
        {/* IH: Hermeneutic + Practical */}
        {workId && t === 'IH' && (
        <div className="space-y-3">
          {/* Hermeneutic summary header + toggle */}
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Hermeneutic (interpretive) phase</div>
            <button className="px-2 py-1 text-[11px] border rounded"
                    onClick={()=>setOpenIH(o=>!o)}>{openIH ? 'Hide' : 'Open'}</button>
          </div>
          {openIH && <HermeneuticBuilder workId={workId} onSaved={()=>{/* no-op */}} />}

          {/* Practical summary + toggle */}
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Practical justification</div>
            <button className="px-2 py-1 text-[11px] border rounded"
                    onClick={()=>setOpenPrac(o=>!o)}>{openPrac ? 'Hide' : 'Open'}</button>
          </div>
          <PracticalSummary workId={workId} />
          {openPrac && canEditPractical && <PracticalBuilder workId={workId} />}
        </div>
      )}

      {/* TC: Practical only */}
      {workId && t === 'TC' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Practical justification</div>
            <button className="px-2 py-1 text-[11px] border rounded"
                    onClick={()=>setOpenPrac(o=>!o)}>{openPrac ? 'Hide' : 'Open'}</button>
          </div>
          <PracticalSummary workId={workId} />
          {openPrac && canEditPractical && <PracticalBuilder workId={workId} />}
        </div>
      )}

      {/* OP: Pascal */}
      {workId && t === 'OP' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Pascal (as‑if) decision</div>
            <button className="px-2 py-1 text-[11px] border rounded"
                    onClick={()=>setOpenOP(o=>!o)}>{openOP ? 'Hide' : 'Open'}</button>
          </div>
          {pasc?.pascal?.decision?.bestActionId && (
            <div className="text-xs text-neutral-600">
              Best action: <b>{pasc.pascal.actions?.find((a:any)=>a.id===pasc.pascal.decision.bestActionId)?.label ?? pasc.pascal.decision.bestActionId}</b>
            </div>
          )}
          {openOP && <PascalBuilder workId={workId} />}
        </div>
      )}

      {/* DN guidance */}
      {t === 'DN' && (
        <div className="text-[11px] text-neutral-500">
          DN: Provide empirical premises (supply function). Link your results to IH/TC/OP via “supplies premise” edges (coming in the Supply drawer).
        </div>
      )}
    

      {workId && (
        <>
          <PracticalSummary workId={workId} className="mt-1" />
          {canEditPractical && (
            <PracticalBuilder
              workId={workId}
              canEdit
              defaultOpen={defaultOpenBuilder}
              purposeDefault={value.standardOutput ?? ''}
              className="mt-2"
            />
          )}
        </>
      )}

      
    </div>
  );
}
