"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ComponentDefinition, PropSpec } from "@/lib/portfolio/registry";

type Props = {
  def: ComponentDefinition<any>;
  value: Record<string, any>;
  onChange: (patch: Record<string, any>) => void;
  /** optional: hide certain fields (e.g., embed) */
  excludeKeys?: string[];
};

export default function AutoInspector({ def, value, onChange, excludeKeys = [] }: Props) {
  const entries = Object.entries(def.spec).filter(([k]) => !excludeKeys.includes(k));

  return (
    <div className="flex flex-col  text-sm">
      {entries.map(([key, spec]) => (
        <Field
          key={key}
          k={key}
          spec={spec as PropSpec}
          val={value[key]}
          onChange={(v) => onChange({ [key]: v })}
        />
      ))}
    </div>
  );
}

function Field({
  k, spec, val, onChange,
}: { k: string; spec: PropSpec; val: any; onChange: (v: any) => void }) {
  switch (spec.kind) {
    case "string":
      return (
        <label className="block">
          <div className="text-xs mb-1">{spec.label}</div>
          {spec.textarea ? (
            <textarea className="w-72 h-24 border rounded p-2 bg-white" value={val ?? ""} onChange={e => onChange(e.target.value)} />
          ) : (
            <Input value={val ?? ""} onChange={e => onChange(e.target.value)} />
          )}
        </label>
      );

    case "string[]":
      return (
        <label className="block">
          <div className="text-xs mb-1">{spec.label}</div>
          <textarea
            className="w-72 h-24 border rounded p-2 bg-white"
            value={Array.isArray(val) ? val.join("\n") : ""}
            onChange={(e) => onChange(e.target.value.split("\n").map(s => s.trim()).filter(Boolean))}
          />
          {spec.help && <div className="text-[11px] text-slate-500 mt-1">{spec.help}</div>}
        </label>
      );

    case "number":
      return (
        <label className="block">
          <div className="text-xs mb-1">{spec.label}</div>
          <Input
            type="number"
            value={val ?? 0}
            min={spec.min}
            max={spec.max}
            step={spec.step ?? 1}
            onChange={(e) => onChange(Number(e.target.value))}
          />
        </label>
      );

    case "boolean":
      return (
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={!!val} onChange={(e) => onChange(e.target.checked)} />
          <span className="text-xs">{spec.label}</span>
        </label>
      );

    case "enum":
      return (
        <label className="block">
          <div className="text-xs mb-1">{spec.label}</div>
          <Select value={String(val ?? spec.options[0])} onValueChange={(v) => onChange(v)}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {spec.options.map((opt) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
            </SelectContent>
          </Select>
        </label>
      );

    default:
      return null;
  }
}
