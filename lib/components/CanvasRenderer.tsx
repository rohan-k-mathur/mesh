"use client";

import React from "react";
import { registry } from "@/lib/portfolio/registry";
import type { ComponentName } from "@/lib/portfolio/types";

type AbsBase  = { id: string; x: number; y: number; width: number; height: number };
type AbsText  = AbsBase & { type: "text";  content: string };
type AbsImage = AbsBase & { type: "image"; src: string; natW?: number; natH?: number };
type AbsVideo = AbsBase & { type: "video"; src: string };
type AbsLink  = AbsBase & { type: "link";  href: string };
type AbsComp  = AbsBase & { type: "component"; component: ComponentName; props: Record<string, unknown>; blockId?: string };
type Absolute = AbsText | AbsImage | AbsVideo | AbsLink | AbsComp;

/** Safe normalizer for Supabase public URLs (works whether `/public/` is present or not). */
function normalizeSupabasePublicUrl(u: string): string {
  const fixed = u.includes("/storage/v1/object/public/")
    ? u
    : u.replace("/storage/v1/object/", "/storage/v1/object/public/");
  return encodeURI(fixed);
}

/** Tiny error boundary so a bad child can’t blank the whole page. */
class CellBoundary extends React.Component<{ children: React.ReactNode }, { err?: any }> {
  constructor(p: any) { super(p); this.state = {}; }
  static getDerivedStateFromError(err: any) { return { err }; }
  render() {
    if (this.state.err) {
      return <div className="text-xs text-red-600 p-1">Render error: {String(this.state.err)}</div>;
    }
    return this.props.children as any;
  }
}

export default function CanvasRenderer({
  elements,
  bgClass = "bg-white",
}: {
  elements: Absolute[];
  bgClass?: string;
}) {
  return (
    <div className={`relative min-h-screen w-full ${bgClass}`}>
      {elements.map((el) => {
        const style: React.CSSProperties = {
          position: "absolute",
          left: el.x,
          top: el.y,
          width: el.width,
          height: el.height,
        };

        switch (el.type) {
          case "text":
            return (
              <div key={el.id} style={style} className="whitespace-pre-wrap">
                {el.content}
              </div>
            );

          case "image":
            return (
              <img
                key={el.id}
                src={el.src}
                alt=""
                style={{ ...style, objectFit: "contain", display: "block" }}
              />
            );

          case "video":
            return (
              <div key={el.id} style={style}>
                <iframe
                  src={el.src}
                  width={el.width}
                  height={el.height}
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                />
              </div>
            );

          case "link":
            return (
              <a
                key={el.id}
                href={el.href}
                style={style}
                className="underline break-words"
              >
                {el.href}
              </a>
            );

          case "component": {
            // ✅ Generic component rendering via registry
            const def = registry[el.component];
            if (!def) {
              return (
                <div key={el.id} style={style} className="text-xs text-red-600">
                  Unknown component: {String(el.component)}
                </div>
              );
            }

            const Comp = def.component as any;

            // Merge viewer defaults with saved props
            let props: any = { ...(def.viewerDefaults ?? {}), ...(el.props || {}) };

            // Special-case: normalize Gallery URLs if present
            if (el.component === "GalleryCarousel") {
              const raw = Array.isArray(props?.urls) ? (props.urls as string[]) : [];
              props = { ...props, urls: raw.map(normalizeSupabasePublicUrl) };
            }

            // Allow component-level normalizers too (if you add them)
            if (def.normalize) props = def.normalize(props);

            return (
              <div
                key={el.id}
                style={style}
                className="overflow-hidden"
                data-block-id={(el as any).blockId || undefined}
              >
                <CellBoundary>
                  <Comp {...props} />
                </CellBoundary>
              </div>
            );
          }
        }
      })}
    </div>
  );
}
