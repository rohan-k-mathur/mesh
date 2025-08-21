"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { ComponentName, DataSource } from "@/lib/portfolio/types";
import { registry } from "@/lib/portfolio/registry";

// tiny helpers
const getPath = (obj: any, path?: string) =>
  !path ? undefined : path.split(".").reduce((acc, k) => (acc == null ? undefined : acc[k]), obj);
const toArray = (v: any) => (Array.isArray(v) ? v.map(String) : v == null ? [] : [String(v)]);

export type RepeaterProps = {
  of: ComponentName;
  source: DataSource;
  map?: Record<string, string>;            // propName -> row path
  staticProps?: Record<string, any>;       // constant overrides
  layout?: "grid" | "column";
  limit?: number;
};

async function fetchRows(ds: DataSource): Promise<any[]> {
  try {
    switch (ds.kind) {
      case "static":
        return Array.isArray(ds.value) ? ds.value : [];
      case "url": {
        const r = await fetch(ds.href, { cache: "no-store" });
        const json = await r.json();
        return Array.isArray(json) ? json : (Array.isArray(json?.items) ? json.items : []);
      }
      case "supabase": {
        const { createClient } = await import("@supabase/supabase-js");
        const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
        let q = client.from(ds.table).select((ds.fields?.length ? ds.fields.join(",") : "*"), { head: false, count: "exact" });
        if (ds.filter) q = q.match(ds.filter as any);
        if (ds.limit)  q = q.limit(ds.limit);
        const { data, error } = await q;
        if (error) { console.warn("Repeater supabase error", error); return []; }
        return data ?? [];
      }
      default:
        return [];
    }
  } catch (e) {
    console.warn("Repeater fetch failed", e);
    return [];
  }
}

export default function Repeater({ of, source, map = {}, staticProps = {}, layout = "grid", limit = 6 }: RepeaterProps) {
  const def = registry[of];
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    let alive = true;
    fetchRows(source).then((data) => { if (alive) setRows(limit ? data.slice(0, limit) : data); });
    return () => { alive = false; };
  }, [JSON.stringify(source), limit]);

  const bindable = def?.bindableProps ?? [];

  return (
    <div className={layout === "grid" ? "grid grid-cols-2 gap-4 w-full h-full p-2" : "flex flex-col gap-4 w-full h-full p-2 overflow-auto"}>
      {rows.map((row, i) => {
        // Start with defaults
        let childProps: any = { ...def.defaultProps, ...staticProps };

        // Fill bindable props from row (typed by spec.kind)
        for (const key of bindable) {
          const spec = def.spec[key];
          const path = map[key];
          const v = getPath(row, path);
          if (spec?.kind === "string[]") childProps[key] = toArray(v);
          else childProps[key] = v;
        }

        // Viewer defaults + normalize
        childProps = { ...(def.viewerDefaults ?? {}), ...childProps };
        if (def.normalize) childProps = def.normalize(childProps);

        const Comp = def.component as any;
        return (
          <div key={i} className="relative w-full h-[240px]">
            <Comp {...childProps} />
          </div>
        );
      })}

      {!rows.length && (
        <div className="text-sm text-slate-500 grid place-items-center w-full h-full">
          No data yet — configure the Repeater source.
        </div>
      )}
    </div>
  );
}
