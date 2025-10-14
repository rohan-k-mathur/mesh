// components/evidence/SupportBar.tsx
"use client";
import * as React from 'react';

export function SupportBar({ value, label }: { value: number; label?: string }) {
  const v = Math.max(0, Math.min(1, value ?? 0));
  return (
    <div className="w-44">
      <div className="flex justify-between text-[11px] text-slate-600 mb-0.5">
        <span>{label ?? 'Support'}</span><span>{(v*100).toFixed(0)}%</span>
      </div>
      <div className="h-2 rounded bg-slate-200/70">
        <div className="h-2 rounded bg-emerald-500" style={{ width: `${v*100}%` }} />
      </div>
    </div>
  );
}
