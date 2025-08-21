"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import { normalizeSupabasePublicUrl } from "@/lib/utils";
import type { ComponentName } from "./types";

/** ========== Describe props so UIs can be generated ========== */

export type PropSpec =
  | { kind: "string";  label: string; textarea?: boolean; bindable?: boolean }
  | { kind: "string[]";label: string; bindable?: boolean; help?: string }
  | { kind: "number";  label: string; min?: number; max?: number; step?: number }
  | { kind: "boolean"; label: string }
  | { kind: "enum";    label: string; options: string[] };

export type ComponentDefinition<P extends Record<string, any>> = {
  /** Display name + React component */
  name: ComponentName;
  component: ComponentType<P>;

  /** Default props used when the block is created */
  defaultProps: P;

  /** How to render an editor for props (auto if omitted) */
  spec: Record<keyof P & string, PropSpec>;

  /** Props that can be bound by Repeater (subset of spec keys) */
  bindableProps?: (keyof P & string)[];

  /** Optional: tweak props at render time (e.g., normalize URLs) */
  normalize?: (props: P) => P;

  /** Optional: default flags for viewer (e.g., `embed: true`) */
  viewerDefaults?: Partial<P>;

  icon?: string;

  label?: string;
};

/** ========== Components ========== */

const GalleryCarousel = dynamic(() => import("@/components/cards/GalleryCarousel"), { ssr: false });
const Repeater        = dynamic(() => import("@/components/cards/Repeater"),        { ssr: false });

/** Gallery metadata */
type GalleryProps = React.ComponentProps<typeof GalleryCarousel>;
export const GalleryDef: ComponentDefinition<GalleryProps> = {
  name: "GalleryCarousel",
  component: GalleryCarousel,
  defaultProps: { urls: [], caption: "", animation: "cube", embed: true },
  spec: {
    urls:      { kind: "string[]", label: "Image URLs", bindable: true, help: "For manual editing, enter one per line." },
    caption:   { kind: "string",   label: "Caption",    bindable: true },
    animation: { kind: "enum",     label: "Animation",  options: ["cube","cylinder","portal","towardscreen"] },
    embed:     { kind: "boolean",  label: "Embed (fill box)" },
    unoptimized: { kind: "boolean", label: "Unoptimized images" },
    sizes:     { kind: "string",   label: "Next.js <Image> sizes", textarea: false },
  },
  bindableProps: ["urls", "caption"],
  normalize: (p) => ({
    ...p,
    urls: Array.isArray(p.urls) ? p.urls.map(normalizeSupabasePublicUrl) : [],
  }),
  viewerDefaults: { embed: true, unoptimized: true },
  label: "Gallery",
  icon: "/assets/carousel.svg"
};

/** Repeater metadata (we still keep a dedicated panel for data mapping). */
type RepeaterProps = React.ComponentProps<typeof Repeater>;
export const RepeaterDef: ComponentDefinition<RepeaterProps> = {
  name: "Repeater",
  component: Repeater,
  defaultProps: {
    of: "GalleryCarousel",
    source: { kind: "static", value: [] },
    map: {},
    staticProps: {},
    layout: "grid",
    limit: 6,
  },
  spec: {
    of:         { kind: "enum", label: "Component", options: ["GalleryCarousel"] },
    layout:     { kind: "enum", label: "Layout", options: ["grid","column"] },
    limit:      { kind: "number", label: "Limit", min: 1, max: 100, step: 1 },
    // We intentionally do not auto‑render `source`/`map`/`staticProps` here –
    // RepeaterPropsPanel handles these with a richer UI.
  } as any,
};

export const registry: Record<ComponentName, ComponentDefinition<any>> = {
  GalleryCarousel: GalleryDef,
  Repeater: RepeaterDef,
};
