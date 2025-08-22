"use client";

import React from "react";
import { registry } from "@/lib/portfolio/registry";
import type { ComponentName } from "@/lib/portfolio/types";

export default function BlockPreviewClient({
  component,
  props,
}: {
  component: ComponentName;
  props: Record<string, unknown>;
}) {
  const def = registry[component];
  if (!def) {
    return <div className="w-full h-full grid place-items-center text-slate-500 text-xs">Unknown component: {String(component)}</div>;
  }
  const Comp = def.component as any;
  let p = { ...(def.viewerDefaults ?? {}), ...(props || {}) };
  if (def.normalize) p = def.normalize(p);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <Comp {...p} />
    </div>
  );
}
