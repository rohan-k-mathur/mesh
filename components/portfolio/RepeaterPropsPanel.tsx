"use client";

import React, { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DataSource, ComponentName } from "@/lib/portfolio/types";
import { registry } from "@/lib/portfolio/registry";
import AutoInspector from "./AutoInspector";

type PropMapRule = string; // dot-path for now (you can expand to {kind:'path'|'literal', ...} later)
type GenericMap = Record<string, PropMapRule>;

export type RepeaterProps = {
  of: ComponentName;                 // target component name
  source: DataSource;                // where rows come from
  map?: GenericMap;                  // propName -> data path (dot)
  staticProps?: Record<string, any>; // constant overrides applied to each item
  layout?: "grid" | "column";
  limit?: number;
};

export default function RepeaterPropsPanel({
  value,
  onChange,
}: {
  value: RepeaterProps;
  onChange(next: Partial<RepeaterProps>): void;
}) {
  const def = registry[value.of];

  const bindables = (def?.bindableProps ?? []).map((k) => ({
    key: k,
    spec: def.spec[k],
  }));

  const ds = value.source;

  return (
    <div className="flex flex-col gap-2  text-sm">
      <div className="text-md uppercase text-slate-500">Repeater</div>

      {/* Which component are we repeating? */}
      <label className="block">
        <div className="text-[.8rem] mb-2">Component</div>
        <Select  value={value.of} onValueChange={(v) => onChange({ of: v as ComponentName })}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(registry).filter(name => name !== "Repeater").map((name) => (
              <SelectItem key={name} value={name}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>

      {/* Basic layout/limit (uses AutoInspector from registry to keep things uniform) */}
      <AutoInspector
        def={registry.Repeater as any}
        value={value}
        onChange={onChange}
        excludeKeys={["of"] /* we already render it above */}
      />

      <hr className="my-2" />

      {/* Data Source */}
      <div class
      ame="text-xs uppercase text-slate-500">Data source</div>
      <label className="block">
        <div className="text-xs mb-1">Kind</div>
        <Select
          value={ds.kind}
          onValueChange={(kind) => {
            if (kind === "static") onChange({ source: { kind, value: [] } });
            if (kind === "url")    onChange({ source: { kind, href: "" } });
            if (kind === "supabase") onChange({ source: { kind, table: "", limit: value.limit ?? 6 } });
          }}
        >
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="static">Static (paste JSON array)</SelectItem>
            <SelectItem value="url">Fetch from URL</SelectItem>
            <SelectItem value="supabase">Supabase table</SelectItem>
          </SelectContent>
        </Select>
      </label>

      {ds.kind === "static" && (
        <label className="block">
          <div className="text-xs mb-1">JSON array</div>
          <textarea
            className="w-72 h-32 border rounded p-2 bg-white font-mono text-xs"
            value={JSON.stringify(ds.value ?? [], null, 2)}
            onChange={(e) => {
              try {
                const v = JSON.parse(e.target.value);
                if (Array.isArray(v)) onChange({ source: { kind: "static", value: v } });
              } catch {}
            }}
          />
        </label>
      )}

      {ds.kind === "url" && (
        <label className="block">
          <div className="text-xs mb-1">Endpoint URL (returns array or {"{ items: [] }"})</div>
          <Input
            placeholder="https://example.com/api/list.json"
            value={ds.href}
            onChange={(e) => onChange({ source: { ...ds, href: e.target.value } })}
          />
        </label>
      )}

      {ds.kind === "supabase" && (
        <div className="flex flex-col gap-2">
          <label className="block">
            <div className="text-xs mb-1">Table</div>
            <Input
              placeholder="projects"
              value={ds.table}
              onChange={(e) => onChange({ source: { ...ds, table: e.target.value } })}
            />
          </label>
          <label className="block">
            <div className="text-xs mb-1">Filter (JSON)</div>
            <Input
              placeholder='{"ownerId": 123}'
              onChange={(e) => {
                try {
                  const f = JSON.parse(e.target.value || "{}");
                  onChange({ source: { ...ds, filter: f } });
                } catch {}
              }}
            />
          </label>
          <label className="block">
            <div className="text-xs mb-1">Fields (comma-separated)</div>
            <Input
              placeholder="id,title,images"
              onChange={(e) => {
                const fields = e.target.value.split(",").map(s => s.trim()).filter(Boolean);
                onChange({ source: { ...ds, fields } });
              }}
            />
          </label>
        </div>
      )}

      <hr className="my-2" />

      {/* Mapping (auto from target component’s bindable props) */}
      <div className="text-xs uppercase text-slate-500">Field mapping ({value.of})</div>
      {!bindables.length && (
        <div className="text-[12px] text-slate-500">No bindable props defined for {value.of}.</div>
      )}
      {bindables.map(({ key, spec }) => (
        <label key={key} className="block">
          <div className="text-xs mb-1">
            {spec?.label ?? key} <span className="text-[11px] text-slate-500">(row path)</span>
          </div>
          <Input
            placeholder={key === "urls" ? "images or media.urls" : key}
            value={value.map?.[key] ?? ""}
            onChange={(e) => onChange({ map: { ...(value.map ?? {}), [key]: e.target.value } })}
          />
        </label>
      ))}

      <div className="text-[11px] text-slate-500">Use dot‑paths (e.g., <code>media.urls</code>)</div>

      <hr className="my-2" />

      {/* Static overrides for non-bindable props (auto‑inspector) */}
      <div className="text-xs uppercase text-slate-500">Static overrides for {value.of}</div>
      <AutoInspector
        def={def}
        value={{ ...def.defaultProps, ...(value.staticProps ?? {}) }}
        onChange={(patch) => onChange({ staticProps: { ...(value.staticProps ?? {}), ...patch } })}
        excludeKeys={def.bindableProps ?? []}
      />
    </div>
  );
}
