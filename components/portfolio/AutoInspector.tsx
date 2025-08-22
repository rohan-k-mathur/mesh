"use client";

import React from "react";
import { z } from "zod";
import { registry } from "@/lib/portfolio/registry";

type Props<P> = {
  defKey: keyof typeof registry;
  value: P;
  onChange: (patch: Partial<P>) => void;
};

export default function AutoInspector<P>({ defKey, value, onChange }: Props<P>) {
  const def = registry[defKey as any];
  if (!def) return <div className="text-xs text-red-600">Unknown component: {String(defKey)}</div>;
  if (def.Inspector) {
    const C = def.Inspector as any;
    return <C value={value} onChange={onChange} />;
  }

  const ui = def.ui ?? {};
  function setK<K extends keyof P & string>(k: K, val: any) {
    onChange({ [k]: val } as Partial<P>);
  }

  return (
    <div className="space-y-3">
      {Object.entries(ui).map(([k, w]) => {
        const key = k as keyof P & string;
        const current = (value as any)?.[key];

        switch (w.kind) {
          case "string":
            return (
              <div key={k}>
                {w.label && <div className="text-xs text-slate-600 mb-1">{w.label}</div>}
                <input
                  className="border rounded px-2 py-1 text-sm w-full"
                  placeholder={w.placeholder}
                  value={current ?? ""}
                  onChange={(e) => setK(key, e.target.value)}
                />
              </div>
            );
          case "number":
            return (
              <div key={k}>
                {w.label && <div className="text-xs text-slate-600 mb-1">{w.label}</div>}
                <input
                  type="number"
                  className="border rounded px-2 py-1 text-sm w-full"
                  min={w.min}
                  max={w.max}
                  step={w.step ?? 1}
                  value={Number.isFinite(current) ? current : ""}
                  onChange={(e) => setK(key, e.target.value === "" ? undefined : Number(e.target.value))}
                />
              </div>
            );
          case "boolean":
            return (
              <label key={k} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!current}
                  onChange={(e) => setK(key, e.target.checked)}
                />
                {w.label ?? key}
              </label>
            );
          case "enum":
            return (
              <div key={k}>
                {w.label && <div className="text-xs text-slate-600 mb-1">{w.label}</div>}
                <select
                  className="border rounded px-2 py-1 text-sm w-full"
                  value={current ?? ""}
                  onChange={(e) => setK(key, e.target.value)}
                >
                  {w.options.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            );
          case "string[]":
            return (
              <div key={k}>
                {w.label && <div className="text-xs text-slate-600 mb-1">{w.label}</div>}
                <ArrayEditor
                  values={Array.isArray(current) ? current : []}
                  placeholder={w.itemPlaceholder}
                  onChange={(vals) => setK(key, vals)}
                />
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}

function ArrayEditor({
  values,
  onChange,
  placeholder,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = React.useState("");
  function add() {
    const v = draft.trim();
    if (!v) return;
    onChange([...values, v]);
    setDraft("");
  }
  function remove(i: number) {
    const next = [...values]; next.splice(i, 1); onChange(next);
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          className="border rounded px-2 py-1 text-sm flex-1"
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") add(); }}
        />
        <button className="px-2 py-1 text-sm rounded bg-white/60 lockbutton" onClick={add}>Add</button>
      </div>
      <div className="mt-2 space-y-1">
        {values.map((v, i) => (
          <div key={i} className="flex items-center gap-2">
            <input className="border rounded px-2 py-1 text-sm flex-1" value={v}
              onChange={(e) => {
                const next = [...values]; next[i] = e.target.value; onChange(next);
              }} />
            <button className="text-red-600" onClick={() => remove(i)}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}
