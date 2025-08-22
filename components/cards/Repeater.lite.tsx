"use client";

import React, { useMemo } from "react";
import { registry } from "@/lib/portfolio/registry";
import type { ComponentName } from "@/lib/portfolio/types";
import type { DataSource } from "@/lib/portfolio/datasource";
import type { Mapping, PropMapping } from "@/lib/portfolio/mapping";
import { zMapping } from "@/lib/portfolio/mapping";
import { evaluatePropMapping } from "@/lib/portfolio/transformers";

type RepeaterProps = {
  of: ComponentName;
  source: DataSource;
  map: Mapping;
  layout?: "grid" | "column";
  limit?: number;
  className?: string;
};

/** Ultra-stable preview:
 *  - static data only (URL/Supabase disabled in safe mode)
 *  - cheap <img> previews for GalleryCarousel
 *  - falls back to a minimal embed for other components
 *  - isolates layout/paint per cell (prevents layout thrash)
 */
export default function RepeaterLite({
  of,
  source,
  map,
  layout = "grid",
  limit,
  className,
}: RepeaterProps) {
  const def = registry[of];
  if (!def) return <div className="text-xs text-red-600">Unknown component: {String(of)}</div>;

  const mapping = useMemo(() => {
    const parsed = zMapping.safeParse(map);
    return (parsed.success ? parsed.data : map) as Record<string, PropMapping>;
  }, [map]);

  // Safe mode: static data only
  const list = source?.kind === "static" && Array.isArray(source.value) ? source.value : [];
  const max = typeof limit === "number" ? Math.min(limit, list.length) : list.length;
  const items = list.slice(0, max);
  const cols = layout === "grid" ? 2 : 1;
  const rowCount = Math.max(1, Math.ceil(items.length / cols));

  return (
    <div
      className={`w-full h-full min-w-0 min-h-0 ${
        layout === "grid" ? "grid gap-3" : "flex flex-col gap-3"
      } ${className ?? ""}`}
      style={
        layout === "grid"
          ? {
              gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`,
              gridTemplateRows: `repeat(${rowCount}, minmax(0,1fr))`,
            }
          : undefined
      }
    >
      {items.map((row, idx) => {
        let childProps: Record<string, any> = { ...def.defaultProps };
        for (const [target, spec] of Object.entries(mapping)) {
          childProps[target] = evaluatePropMapping(spec, row);
        }
        childProps = { ...(def.viewerDefaults ?? {}), ...childProps };
        if (def.normalize) childProps = def.normalize(childProps);

        // Known use-case: gallery cards
        if (of === "GalleryCarousel") {
          const urls = (childProps.urls ?? []) as string[];
          const src = urls?.[0];
          return (
            <div
              key={idx}
              className="relative w-full h-full min-w-0 min-h-0 overflow-hidden"
              style={{ contain: "layout paint" }}
            >
              {src ? (
                <img
                  src={src}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              ) : (
                <div className="w-full h-full grid place-items-center text-slate-400 text-xs">No image</div>
              )}
            </div>
          );
        }

        // Other components: extremely safe minimal render (no motion)
        return (
          <div
            key={idx}
            className="relative w-full h-full min-w-0 min-h-0 overflow-hidden"
            style={{ contain: "layout paint" }}
          >
            <div className="w-full h-full grid place-items-center text-slate-400 text-xs">
              Preview disabled (safe mode)
            </div>
          </div>
        );
      })}

      {!items.length && (
        <div className="text-xs text-slate-400">
          {source?.kind === "static" ? "No data" : "Safe mode: dynamic data disabled"}
        </div>
      )}
    </div>
  );
}
