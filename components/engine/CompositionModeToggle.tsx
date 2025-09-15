// components/engine/CompositionModeToggle.tsx
'use client';
import * as React from 'react';

export function CompositionModeToggle({
  value, onChange,
}: { value: 'assoc'|'partial'|'spiritual'; onChange: (v:any)=>void; }) {
  const modes: Array<{k:'assoc'|'partial'|'spiritual'; tip:string}> = [
    { k:'assoc', tip:'Strict composition' },
    { k:'partial', tip:'Block on dir collisions' },
    { k:'spiritual', tip:'Auto-shift (ρL/ρR) on collision' },
  ];
  return (
    <div className="inline-flex gap-1">
      {modes.map(m => (
        <button
          key={m.k}
          className={`px-2 py-1 text-xs rounded border ${value===m.k?'bg-indigo-50 border-indigo-200':'bg-white border-slate-200'}`}
          title={m.tip}
          onClick={()=>onChange(m.k)}
        >
          {m.k}
        </button>
      ))}
    </div>
  );
}

