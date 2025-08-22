// components/cards/Repeater.tsx
"use client";

import React, { useMemo } from "react";
import { registry } from "@/lib/portfolio/registry";
import type { ComponentName } from "@/lib/portfolio/types";

type DataSource =
  | { kind: "static"; value: any[] }
  | { kind: "url" | "supabase"; [k: string]: any }; // disabled in baseline, but tolerated

type Mapping = Record<string, string>; // propName -> dot path (e.g., "images" or "media.urls")

type Props = {
  of: ComponentName;              // e.g., "GalleryCarousel"
  source: DataSource;             // use { kind:"static", value:[...] }
  map: Mapping;                   // e.g., { urls:"images", caption:"title" }
  layout?: "grid" | "column";     // 2-cols grid or single column
  limit?: number;
  className?: string;
};

function getPath(obj: any, path?: string): any {
  if (!path) return undefined;
  return path.split(".").reduce((acc, k) => (acc == null ? undefined : acc[k]), obj);
}

export default function Repeater({
  of,
  source,
  map,
  layout = "grid",
  limit,
  className,
}: Props) {
  const def = registry[of];
  if (!def) return <div className="text-xs text-red-600">Unknown component: {String(of)}</div>;

  // baseline: static data only; disable dynamic in safe mode
  const rows = source?.kind === "static" && Array.isArray(source.value) ? source.value : [];
  const take = typeof limit === "number" ? Math.min(limit, rows.length) : rows.length;
  const list = rows.slice(0, take);

  const cols = layout === "grid" ? 2 : 1;
  const rowCount = Math.max(1, Math.ceil(list.length / cols));

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
      {list.map((row, idx) => {
        // compute props for the child from mapping (dot paths)
        const childProps: Record<string, any> = { ...def.defaultProps };
        for (const [propKey, path] of Object.entries(map)) {
          childProps[propKey] = getPath(row, path);
        }

        // Special-case: when repeating GalleryCarousel, render a cheap <img> for preview
        if (of === "GalleryCarousel") {
          const urls = Array.isArray(childProps.urls)
            ? (childProps.urls as string[])
            : childProps.urls
            ? [String(childProps.urls)]
            : [];
          const src = urls[0] ?? "";
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
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              ) : (
                <div className="w-full h-full grid place-items-center text-xs text-slate-400">
                  No image
                </div>
              )}
            </div>
          );
        }

        // Other components: very safe placeholder (no motion / dialogs)
        return (
          <div
            key={idx}
            className="relative w-full h-full min-w-0 min-h-0 overflow-hidden"
            style={{ contain: "layout paint" }}
          >
            <div className="w-full h-full grid place-items-center text-xs text-slate-400">
              Preview disabled
            </div>
          </div>
        );
      })}

      {!list.length && (
        <div className="text-xs text-slate-400">
          {source?.kind === "static" ? "No data" : "Safe mode: dynamic sources disabled"}
        </div>
      )}
    </div>
  );
}
