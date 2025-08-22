"use client";

import React, { useMemo } from "react";
import useSWR, { SWRConfiguration } from "swr";
import { supabase } from "@/lib/supabaseclient";
import { registry } from "@/lib/portfolio/registry";
import type { ComponentName } from "@/lib/portfolio/types";
import type { DataSource } from "@/lib/portfolio/datasource";
import { zDataSource } from "@/lib/portfolio/datasource";
import type { Mapping, PropMapping } from "@/lib/portfolio/mapping";
import { zMapping } from "@/lib/portfolio/mapping";
import { evaluatePropMapping } from "@/lib/portfolio/transformers";
import { EmbedEnvProvider } from "@/components/portfolio/EmbedEnv";

type RepeaterProps = {
  of: ComponentName;
  source: DataSource;
  map: Mapping;
  layout?: "grid" | "column";
  limit?: number;
  className?: string;
};
class CellBoundary extends React.Component<
  { children: React.ReactNode },
  { err?: any }
> {
  constructor(props: any) {
    super(props);
    this.state = {};
  }
  static getDerivedStateFromError(err: any) {
    return { err };
  }
  render() {
    if (this.state.err) {
      return (
        <div className="text-xs text-red-600 p-1">
          Render error: {String(this.state.err)}
        </div>
      );
    }
    return this.props.children as any;
  }
}


const SWR_OPTS: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  shouldRetryOnError: false,
  dedupingInterval: 30_000,
};

function useRows(source: DataSource) {
  const parsed = useMemo(() => zDataSource.safeParse(source), [source]);
  if (!parsed.success)
    return { rows: [], isLoading: false, error: parsed.error };

  switch (source.kind) {
    case "static":
      return { rows: source.value, isLoading: false, error: null };

    case "url": {
      const key = useMemo(
        () =>
          JSON.stringify({
            k: "url",
            href: source.href,
            path: source.path ?? null,
          }),
        [source.href, source.path]
      );
      const { data, error, isLoading } = useSWR(
        key,
        async () => {
          const res = await fetch(source.href, { cache: "no-store" });
          const json = await res.json();
          if (!source.path)
            return Array.isArray(json) ? json : json?.items ?? [];
          return source.path
            .split(".")
            .reduce((acc: any, k) => (acc == null ? undefined : acc[k]), json);
        },
        SWR_OPTS
      );
      return { rows: Array.isArray(data) ? data : [], isLoading, error };
    }

    case "supabase": {
      const key = useMemo(
        () =>
          JSON.stringify({
            k: "supabase",
            table: source.table,
            filter: source.filter ?? null,
            fields: source.fields ?? null,
            orderBy: source.orderBy ?? null,
            limit: source.limit ?? null,
          }),
        [
          source.table,
          source.filter,
          source.fields,
          source.orderBy,
          source.limit,
        ]
      );
      const { data, error, isLoading } = useSWR(
        key,
        async () => {
          let q = supabase
            .from(source.table)
            .select(source.fields?.join(",") || "*");
          if (source.filter)
            for (const [k, v] of Object.entries(source.filter))
              q = (q as any).eq(k, v as any);
          if (source.orderBy) {
            const [col, dir] = source.orderBy.split(":");
            q = (q as any).order(col, { ascending: (dir ?? "asc") === "asc" });
          }
          if (source.limit) q = (q as any).limit(source.limit);
          const { data: rows, error: err } = await q;
          if (err) throw err;
          return rows ?? [];
        },
        SWR_OPTS
      );
      return { rows: data ?? [], isLoading, error };
    }
  }
}

function Repeater({
  source,
  of,
  map,
  layout = "grid",
  limit,
  className,
}: RepeaterProps) {
  const def = registry[of];
  if (!def)
    return (
      <div className="text-xs text-red-600">
        Unknown component: {String(of)}
      </div>
    );

  const mapping = useMemo(() => {
    const parsed = zMapping.safeParse(map);
    return (parsed.success ? parsed.data : map) as Record<string, PropMapping>;
  }, [map]);

  const { rows, isLoading, error } = useRows(source);
  const list = Array.isArray(rows) ? rows : [];
  const take = useMemo(
    () =>
      typeof limit === "number" ? Math.min(limit, list.length) : list.length,
    [limit, list.length]
  );
  const cols = layout === "grid" ? 2 : 1;
  const rowCount = Math.max(1, Math.ceil(take / cols)); // how many rows we need

  const Comp = def.component as any;

  // columns = 2 for grid, 1 for column; you can expose this later

  return (
    <div
    className={`w-full h-full min-w-0 min-h-0 ${
      layout === "grid" ? "grid gap-3" : "flex flex-col gap-3"
    } ${className ?? ""}`}
    style={
      layout === "grid"
        ? {
            gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`,
            // ✅ explicit rows so tracks don't collapse after first paint
            gridTemplateRows: `repeat(${rowCount}, minmax(0,1fr))`,
            gridAutoFlow: "row dense",
          }
        : undefined
    }
    >
      {isLoading && !list.length && (
        <div className="text-xs text-slate-400">Loading…</div>
      )}
      {error && (
        <div className="text-xs text-red-600">Data error: {String(error)}</div>
      )}

      {list.slice(0, take).map((row, idx) => {
        // compute child props once
        let childProps: Record<string, any> = { ...def.defaultProps };
        for (const [target, spec] of Object.entries(mapping)) {
          childProps[target] = evaluatePropMapping(spec, row);
        }
        childProps = { ...(def.viewerDefaults ?? {}), ...childProps };
        if (def.normalize) childProps = def.normalize(childProps);

        return (
            <div
              key={idx}
              className="relative w-full h-full min-w-0 min-h-0 overflow-hidden"
              // ✅ isolate layout/paint without size containment (keeps % heights working)
              style={{ contain: "layout paint" }}
            >
              <CellBoundary>
                <EmbedEnvProvider value={{ inRepeater: true, fit: "cover" }}>
                  <Comp {...childProps} />
                </EmbedEnvProvider>
              </CellBoundary>
            </div>
          );
        })}
        {!isLoading && !list.length && (
          <div className="text-xs text-slate-400">No data</div>
        )}
      </div>
    );
}

// 👇 prevent gratuitous re-renders if props are identical
export default React.memo(Repeater);
