'use client';
import * as React from 'react';

export function ActInspector(props: {
  pos?: any; neg?: any; onClose?: () => void;
}) {
  if (!props.pos && !props.neg) return null;
  const Box = ({ label, a }: { label: string; a: any }) => (
    <div className="border rounded p-2 flex-1">
      <div className="text-xs opacity-70 mb-1">{label}</div>
      {a ? (
        <div className="text-sm space-y-1">
          <div><b>polarity:</b> {a.polarity ?? (a.kind === 'DAIMON' ? '†' : '-')}</div>
          <div><b>kind:</b> {a.kind}</div>
          <div><b>locus:</b> {a.locus?.path ?? '(none)'}</div>
          {a.expression && <div><b>expr:</b> {a.expression}</div>}
          {a.isAdditive && <div className="text-amber-700 text-xs">⊕ additive</div>}
        </div>
      ) : <div className="text-xs opacity-70">—</div>}
    </div>
  );
  return (
    <div className="fixed bottom-4 right-4 w-[520px] max-w-[95vw] bg-white/95 backdrop-blur shadow-xl border rounded-lg p-3 space-y-2 z-50">
      <div className="flex items-center justify-between">
        <strong className="text-sm">Act Inspector</strong>
        <button className="text-xs opacity-70" onClick={props.onClose}>close</button>
      </div>
      <div className="flex gap-2">{/* side-by-side */}
        <Box label="Positive (P)" a={props.pos} />
        <Box label="Negative (O)" a={props.neg} />
      </div>
    </div>
  );
}
