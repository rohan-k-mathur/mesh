'use client';
import * as React from 'react';

 export function ActInspector(props: { pos?: any; neg?: any; onClose?: () => void; }) {
  const [complete, setComplete] = React.useState(false);
   if (!props.pos && !props.neg) return null;
  const Box = ({ label, a }: { label: string; a: any }) => (
    <div className="border bg-white rounded p-2 flex-1">
      <div className="text-xs opacity-70 mb-1">{label}</div>
      {a ? (
        <div className="text-sm space-y-1">
          <div><b>polarity:</b> {a.polarity ?? (a.kind === 'DAIMON' ? '†' : '-')}</div>
          <div><b>kind:</b> {a.kind}</div>
          <div><b>locus:</b> {a.locus?.path ?? '(none)'}</div>
          {a.expression && <div><b>expr:</b> {a.expression}</div>}
          {a.isAdditive && <div className="text-amber-700 text-xs">⊕ additive</div>}
          {complete && a.polarity==='O' && (
              <div className="text-[11px] text-indigo-700">
                Completion preview: add (−, {a.locus?.path ?? 'ξ'}, I)·z endings where missing. (Prop. 2.22) :contentReference[oaicite:11]{index=11}
              </div>
            )}
        </div>
      ) : <div className="text-xs opacity-70">—</div>}
    </div>
  );
  return (
    <div className="absolute right-12  w-[520px] max-w-[95vw] bg-indigo-50 shadow-xl panel-edge rounded-lg p-3 space-y-2 z-50">
      <div className="flex items-center justify-between">
        <strong className="text-sm">Act Inspector</strong>
        <button className="text-xs opacity-70" onClick={props.onClose}>close</button>
      </div>
              <div className="text-[11px]">
          <label className="inline-flex items-center gap-1">
            <input type="checkbox" checked={complete} onChange={e=>setComplete(e.target.checked)} />
            Preview completion (add missing (−, ξ, I) z)
          </label>
        </div>
      <div className="flex gap-2">{/* side-by-side */}
        <Box  label="Positive (P)" a={props.pos} />
        <Box label="Negative (O)" a={props.neg} />
      </div>
    </div>
  );
}
