// CanvasRenderer.tsx
"use client";
import dynamic from "next/dynamic";
import React from "react";
import type { ComponentName, ComponentPropsMap } from "@/lib/portfolio/types";
import { normalizeSupabasePublicUrl } from "../utils";



// const Registry = {
//   GalleryCarousel: dynamic(() => import("@/components/cards/GalleryCarousel"), { ssr: false }),
// } as const;

// One registry only (typed)
const Registry: Record<ComponentName, React.ComponentType<any>> = {
    GalleryCarousel: dynamic(
      () => import("@/components/cards/GalleryCarousel").then(m => m.default || m),
      { ssr: false }
    ),
  };

// export function normalizeSupabasePublicUrl(u: string) {
//   const fixed = u.includes("/storage/v1/object/public/")
//     ? u
//     : u.replace("/storage/v1/object/", "/storage/v1/object/public/");
//   return encodeURI(fixed);
// }

// 2) Strong “Absolute” unions so `component` isn’t optional
type AbsBase = { id: string; x: number; y: number; width: number; height: number };

type AbsText   = AbsBase & { type: 'text';   content: string };
type AbsImage  = AbsBase & { type: 'image';  src: string; natW?: number; natH?: number };
type AbsVideo  = AbsBase & { type: 'video';  src: string };
type AbsLink   = AbsBase & { type: 'link';   href: string };
type AbsComp   = AbsBase & { type: 'component'; component: ComponentName; props: ComponentPropsMap[ComponentName] };

type Absolute = AbsText | AbsImage | AbsVideo | AbsLink | AbsComp;

interface Props {
  elements: Absolute[];
  bgClass?: string;
}

export default function CanvasRenderer({ elements, bgClass = "bg-white" }: Props) {
  return (
    <div className={`relative min-h-screen w-full ${bgClass}`}>
      {elements.map((el) => {
        const style: React.CSSProperties = {
          position: "absolute",
          left: el.x, top: el.y, width: el.width, height: el.height,
        };

        switch (el.type) {
          case "text":
            return <div key={el.id} style={style} className="whitespace-pre-wrap">{el.content}</div>;
          case "image":
            return <img key={el.id} src={el.src} alt="" style={{ ...style, objectFit: "contain" }} />;
          case "video":
            return (
              <div key={el.id} style={style}>
                <iframe src={el.src} width={el.width} height={el.height} allow="autoplay; encrypted-media" allowFullScreen />
              </div>
            );
          case "link":
            return <a key={el.id} href={el.href} style={style} className="underline break-words">{el.href}</a>;
            case "component": {
              if (el.component === "GalleryCarousel") {
                const raw  = (el.props?.urls ?? []) as string[];
                             const urls = raw.map(normalizeSupabasePublicUrl).filter(Boolean);
            
                const Comp = Registry.GalleryCarousel;
                return (
                  <div key={el.id} style={style} className="overflow-hidden">
                  {urls.length ? (
                    <Comp
                      embed
                      unoptimized
                      urls={urls}
                      caption={el.props?.caption}
                      animation={el.props?.animation}
                    />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-slate-400 text-sm">
                      No images
                    </div>
                  )}
                  </div>
                );
              }
              return null;
            }
        }
      })}
    </div>
  );
}
