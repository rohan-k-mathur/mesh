"use client";
import React from "react";
import { z } from "zod";
import { zDataSource, DataSource } from "@/lib/portfolio/datasource";
import { zMapping, Mapping, TransformerSpec } from "@/lib/portfolio/mapping";
import AutoInspector from "@/components/portfolio/AutoInspector";
import { registry } from "@/lib/portfolio/registry";

const BUILT_INS: { label: string; spec: TransformerSpec }[] = [
  { label: "split(,)",        spec: { t: "split", sep: "," } },
  { label: "pick(0)",         spec: { t: "pick", index: 0 } },
  { label: "map(path)",       spec: { t: "map", path: "0.url" } },
  { label: "toNumber()",      spec: { t: "toNumber" } },
  { label: "toBoolean()",     spec: { t: "toBoolean" } },
  { label: "join(,)",         spec: { t: "join", sep: "," } },
  { label: "trim()",          spec: { t: "trim" } },
  { label: "lowercase()",     spec: { t: "lowercase" } },
  { label: "uppercase()",     spec: { t: "uppercase" } },
  { label: "fallback('')",    spec: { t: "fallback", value: "" } },
  { label: "normalizeUrl()",  spec: { t: "normalizeUrl" } },
  { label: "supabasePublic()",spec: { t: "supabasePublic" } },
];

type Props = {
  value: {
    source: DataSource;
    map: Mapping;
    of: string;
    layout?: "grid" | "column";
    limit?: number;
  };
  onChange: (next: Partial<Props["value"]>) => void;
};

export default function RepeaterInspector({ value, onChange }: Props) {
  const [errors, setErrors] = React.useState<string[]>([]);

  function setSource(partial: Partial<DataSource>) {
    onChange({ source: { ...(value.source as any), ...partial } as DataSource });
  }

  function setMapKey(targetProp: string, upd: (prev: any) => any) {
    const current = value.map[targetProp] ?? "";
    const next = upd(current);
    onChange({ map: { ...value.map, [targetProp]: next } });
  }

  function addTransformer(targetProp: string, t: TransformerSpec) {
    setMapKey(targetProp, (prev) => {
      if (typeof prev === "string") return { path: prev, transform: [t] };
      const chain = Array.isArray(prev?.transform) ? prev.transform : [];
      return { path: prev?.path ?? "", transform: [...chain, t] };
    });
  }

  function removeTransformer(targetProp: string, idx: number) {
    setMapKey(targetProp, (prev) => {
      if (typeof prev === "string") return prev;
      const chain = [...(prev.transform ?? [])];
      chain.splice(idx, 1);
      return { ...prev, transform: chain };
    });
  }

  function updateTransformer(targetProp: string, idx: number, patch: Partial<TransformerSpec>) {
    setMapKey(targetProp, (prev) => {
      if (typeof prev === "string") return prev;
      const chain = [...(prev.transform ?? [])];
      chain[idx] = { ...(chain[idx] as any), ...patch } as any;
      return { ...prev, transform: chain };
    });
  }

  function validate() {
    const errs: string[] = [];
    const s = zDataSource.safeParse(value.source);
    if (!s.success) errs.push("Invalid source: " + s.error.issues.map((i) => i.message).join(", "));
    const m = zMapping.safeParse(value.map);
    if (!m.success) errs.push("Invalid mapping: " + m.error.issues.map((i) => i.message).join(", "));
    setErrors(errs);
  }

  React.useEffect(() => { validate(); /* eslint-disable-next-line */ }, [value.source, value.map]);

  // Simple UI
  return (
    <div className="mt-4 space-y-4">
      <div className="text-xs uppercase text-slate-500">Data source</div>
      <div className="flex flex-col gap-2">
        <select
          value={value.source.kind}
          onChange={(e) => {
            const k = e.target.value as DataSource["kind"];
            if (k === "static") setSource({ kind: "static", value: [] });
            if (k === "url")    setSource({ kind: "url", href: "https://example.com/data.json", path: "" });
            if (k === "supabase") setSource({ kind: "supabase", table: "projects" });
          }}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="static">Static</option>
          <option value="url">URL</option>
          <option value="supabase">Supabase</option>
        </select>

        {value.source.kind === "url" && (
          <div className="flex gap-2">
            <input
              className="border rounded px-2 py-1 text-sm w-[20rem]"
              placeholder="https://…"
              value={value.source.href}
              onChange={(e) => setSource({ href: e.target.value })}
            />
            <input
              className="border rounded px-2 py-1 text-sm w-[12rem]"
              placeholder="response.path"
              value={value.source.path ?? ""}
              onChange={(e) => setSource({ path: e.target.value })}
            />
          </div>
        )}
        {value.source.kind === "supabase" && (
          <div className="flex gap-2">
            <input className="border rounded px-2 py-1 text-sm" placeholder="table"
              value={value.source.table} onChange={(e) => setSource({ table: e.target.value })}/>
            <input className="border rounded px-2 py-1 text-sm w-[10rem]" placeholder="ownerId=123"
              onBlur={(e) => {
                const str = e.target.value.trim();
                if (!str) return setSource({ filter: undefined });
                const obj: Record<string, any> = {};
                str.split(",").forEach(pair => {
                  const [k, v] = pair.split("=").map(s => s.trim());
                  if (k) obj[k] = /^\d+$/.test(v) ? Number(v) : v;
                });
                setSource({ filter: obj });
              }} />
            <input className="border rounded px-2 py-1 text-sm w-[10rem]" placeholder="createdAt:desc"
              onChange={(e) => setSource({ orderBy: e.target.value })}/>
            <input type="number" min={1} className="border rounded px-2 py-1 text-sm w-[6rem]" placeholder="limit"
              onChange={(e) => setSource({ limit: Number(e.target.value) || undefined })}/>
          </div>
        )}
      </div>

      <div className="text-xs uppercase text-slate-500">Mapping</div>
      <div className="space-y-3">
        {Object.entries(value.map).map(([targetProp, spec]) => {
          const isSimple = typeof spec === "string";
          const path = isSimple ? spec : spec.path;
          const chain = isSimple ? [] : spec.transform ?? [];
          return (
            <div key={targetProp} className="border rounded p-2">
              <div className="text-xs text-slate-600 mb-1">{targetProp}</div>
              <input
                className="border rounded px-2 py-1 text-sm w-full"
                placeholder="row.path.to.value"
                value={path}
                onChange={(e) =>
                  setMapKey(targetProp, (prev) =>
                    typeof prev === "string"
                      ? e.target.value
                      : { path: e.target.value, transform: prev?.transform ?? [] }
                  )
                }
              />
              {!!chain.length && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {chain.map((t, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs bg-slate-100 rounded px-2 py-1">
                      <span>{t.t}</span>
                      {"sep" in t && (
                        <input
                          className="border rounded px-1 py-0.5 w-16 text-xs"
                          value={(t as any).sep ?? ""}
                          onChange={(e) => updateTransformer(targetProp, idx, { sep: e.target.value } as any)}
                        />
                      )}
                      {"index" in t && (
                        <input
                          type="number"
                          className="border rounded px-1 py-0.5 w-14 text-xs"
                          value={(t as any).index ?? 0}
                          onChange={(e) => updateTransformer(targetProp, idx, { index: Number(e.target.value) } as any)}
                        />
                      )}
                      {"path" in t && (
                        <input
                          className="border rounded px-1 py-0.5 w-28 text-xs"
                          value={(t as any).path ?? ""}
                          onChange={(e) => updateTransformer(targetProp, idx, { path: e.target.value } as any)}
                        />
                      )}
                      {"value" in t && (
                        <input
                          className="border rounded px-1 py-0.5 w-24 text-xs"
                          value={(t as any).value ?? ""}
                          onChange={(e) => updateTransformer(targetProp, idx, { value: e.target.value } as any)}
                        />
                      )}
                      <button className="text-red-600" onClick={() => removeTransformer(targetProp, idx)}>✕</button>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-2">
                <select
                  className="border rounded px-2 py-1 text-sm"
                  onChange={(e) => {
                    const i = Number(e.target.value);
                    if (Number.isFinite(i)) addTransformer(targetProp, BUILT_INS[i].spec);
                    e.currentTarget.selectedIndex = 0; // reset
                  }}
                >
                  <option>Add transform…</option>
                  {BUILT_INS.map((t, i) => <option key={i} value={i}>{t.label}</option>)}
                </select>
              </div>
            </div>
          );
        })}
      </div>
      <AutoInspector
  defKey={"Repeater" as any}
  value={value}
  onChange={(patch) => onChange(patch)}
/>

      {!!errors.length && (
        <div className="text-xs text-red-600">
          {errors.map((e, i) => <div key={i}>{e}</div>)}
        </div>
      )}
    </div>
  );
}
