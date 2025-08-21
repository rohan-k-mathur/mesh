"use client";
import React from "react";
import { registry } from "@/lib/portfolio/registry";
import type { ComponentName } from "@/lib/portfolio/types";

type AbsBase = { id: string; x: number; y: number; width: number; height: number };
type AbsText   = AbsBase & { type: 'text';   content: string };
type AbsImage  = AbsBase & { type: 'image';  src: string; natW?: number; natH?: number };
type AbsVideo  = AbsBase & { type: 'video';  src: string };
type AbsLink   = AbsBase & { type: 'link';   href: string };
type AbsComp   = AbsBase & { type: 'component'; component: ComponentName; props: Record<string, unknown> };
type Absolute = AbsText | AbsImage | AbsVideo | AbsLink | AbsComp;

export default function CanvasRenderer({ elements, bgClass = "bg-white" }: { elements: Absolute[]; bgClass?: string; }) {
  return (
    <div className={`relative min-h-screen w-full ${bgClass}`}>
      {elements.map((el) => {
        const style: React.CSSProperties = { position: "absolute", left: el.x, top: el.y, width: el.width, height: el.height };

        switch (el.type) {
          case "text":  return <div key={el.id} style={style} className="whitespace-pre-wrap">{el.content}</div>;
          case "image": return <img key={el.id} src={el.src} alt="" style={{ ...style, objectFit: "contain" }} />;
          case "video": return <div key={el.id} style={style}><iframe src={el.src} width={el.width} height={el.height} allow="autoplay; encrypted-media" allowFullScreen /></div>;
          case "link":  return <a key={el.id} href={el.href} style={style} className="underline break-words">{el.href}</a>;
          case "component": {
            const def = registry[el.component];
            if (!def) return null;
            const Comp = def.component as any;
            let props: any = { ...(def.viewerDefaults ?? {}), ...(el.props || {}) };
            if (def.normalize) props = def.normalize(props);
            return (
              <div key={el.id} style={style} className="overflow-hidden">
                <Comp {...props} />
              </div>
            );
          }
        }
      })}
    </div>
  );
}
