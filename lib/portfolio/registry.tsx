// "use client";

// import { z } from "zod";
// import type { ComponentName } from "@/lib/portfolio/types";
// import dynamic from "next/dynamic";

// // ✅ LAZY import components to avoid cycles
// const GalleryCarousel = dynamic(() => import("@/components/cards/GalleryCarousel"), { ssr: false });
// const RepeaterComp    = dynamic(() => import("@/components/cards/Repeater"), { ssr: false });
// const RepeaterInsp    = dynamic(() => import("@/components/portfolio/RepeaterInspector"), { ssr: false });

// /** UI metadata */
// type Widget =
//   | { kind: "string";  label?: string; textarea?: boolean; placeholder?: string }
//   | { kind: "number";  label?: string; min?: number; max?: number; step?: number }
//   | { kind: "boolean"; label?: string }
//   | { kind: "enum";    label?: string; options: { label: string; value: string }[] }
//   | { kind: "string[]";label?: string; itemPlaceholder?: string };

// export type ComponentDef<P> = {
//   name: ComponentName;
//   component: React.ComponentType<P>;
//   defaultProps: P;
//   schema: z.ZodType<P>;
//   ui?: Record<string, Widget>;
//   Inspector?: React.FC<{ value: P; onChange: (patch: Partial<P>) => void }>;
//   normalize?: (p: P) => P;
//   viewerDefaults?: Partial<P>;
//   visible?: boolean;
// };

// // ---- Gallery ----
// const GallerySchema = z.object({
//   urls: z.array(z.string()).default([]),
//   caption: z.string().default(""),
//   animation: z.enum(["cylinder","cube","portal","towardscreen"]).default("cube"),
// }).strict();
// export type GalleryProps = z.infer<typeof GallerySchema>;

// const GalleryDef: ComponentDef<GalleryProps> = {
//   name: "GalleryCarousel",
//   component: GalleryCarousel as any,
//   defaultProps: { urls: [], caption: "", animation: "cube" },
//   viewerDefaults: { embed: true, unoptimized: true },

//   schema: GallerySchema,
//   ui: {
//     urls:    { kind: "string[]", label: "Image URLs", itemPlaceholder: "https://…" },
//     caption: { kind: "string",   label: "Caption", placeholder: "Optional caption" },
//     animation: {
//       kind: "enum", label: "Animation",
//       options: [
//         { label: "Cylinder", value: "cylinder" },
//         { label: "Cube",     value: "cube" },
//         { label: "Portal",   value: "portal" },
//         { label: "Toward Screen", value: "towardscreen" },
//       ],
//     },
//   },
//   visible: true,
// };

// // ---- Repeater ----
// const RepeaterSchema = z.object({
//   of: z.string(),
//   source: z.any(),
//   map: z.any(),
//   layout: z.enum(["grid","column"]).default("grid").optional(),
//   limit: z.number().int().positive().optional(),
// }).strict();
// export type RepeaterProps = z.infer<typeof RepeaterSchema>;

// const RepeaterDef: ComponentDef<RepeaterProps> = {
//   name: "Repeater",
//   component: RepeaterComp as any,                 // ✅ lazy component
//   defaultProps: { of: "GalleryCarousel", source: { kind: "static", value: [] }, map: {}, layout: "grid", limit: 6 },
//   schema: RepeaterSchema,
//   Inspector: (props) => <RepeaterInsp {...props as any} />,  // ✅ lazy inspector
//   ui: {
//     layout: { kind: "enum", label: "Layout", options: [
//       { label: "Grid",   value: "grid" },
//       { label: "Column", value: "column" },
//     ]},
//     limit: { kind: "number", label: "Limit", min: 1, max: 100, step: 1 },
//   },
//   visible: true,
// };

// export const registry: Record<ComponentName, ComponentDef<any>> = {
//   GalleryCarousel: GalleryDef,
//   Repeater: RepeaterDef,
// };

// lib/portfolio/registry.ts
"use client";

import { z } from "zod";
import type { ComponentName } from "@/lib/portfolio/types";
import dynamic from "next/dynamic";

// Components (lazy to avoid cycles)
const GalleryCarousel = dynamic(() => import("@/components/cards/GalleryCarousel"), { ssr: false });
const RepeaterComp    = dynamic(() => import("@/components/cards/Repeater"),         { ssr: false });
const GalleryInspector = dynamic(() => import("@/components/portfolio/GalleryInspector"), { ssr: false });


type Widget =
  | { kind: "string";  label?: string; textarea?: boolean; placeholder?: string }
  | { kind: "number";  label?: string; min?: number; max?: number; step?: number }
  | { kind: "boolean"; label?: string }
  | { kind: "enum";    label?: string; options: { label: string; value: string }[] }
  | { kind: "string[]";label?: string; itemPlaceholder?: string };

export type ComponentDef<P> = {
  name: ComponentName;
  component: React.ComponentType<P>;
  defaultProps: P;
  schema: z.ZodType<P>;
  ui?: Record<string, Widget>;
  normalize?: (p: P) => P;
  viewerDefaults?: Partial<P>;
  visible?: boolean;
};

// ---- Gallery ----
const GallerySchema = z.object({
  urls: z.array(z.string()).default([]),
  caption: z.string().default(""),
  animation: z.enum(["cylinder","cube","portal","towardscreen"]).default("cube"),
}).strict();
type GalleryProps = z.infer<typeof GallerySchema>;

const GalleryDef: ComponentDef<GalleryProps> = {
  name: "GalleryCarousel",
  component: GalleryCarousel as any,
  defaultProps: { urls: [], caption: "", animation: "cube" },
  schema: GallerySchema,
  ui: {
    urls:    { kind: "string[]", label: "Image URLs", itemPlaceholder: "https://…" },
    caption: { kind: "string",   label: "Caption", placeholder: "Optional caption" },
    animation: {
      kind: "enum", label: "Animation",
      options: [
        { label: "Cylinder", value: "cylinder" },
        { label: "Cube",     value: "cube" },
        { label: "Portal",   value: "portal" },
        { label: "Toward Screen", value: "towardscreen" },
      ],
    },
  },
  Inspector: (props) => <GalleryInspector {...props as any} />, // 👈 use it

  visible: true,
};

// ---- Repeater (baseline) ----
const RepeaterSchema = z.object({
  of: z.string(),
  source: z.object({ kind: z.literal("static"), value: z.array(z.any()) }).or(z.any()).default({ kind:"static", value: [] }),
  map: z.record(z.string()).default({ urls: "images", caption: "title" }),
  layout: z.enum(["grid","column"]).default("grid").optional(),
  limit: z.number().int().positive().optional(),
}).strict();
type RepeaterProps = z.infer<typeof RepeaterSchema>;

const RepeaterDef: ComponentDef<RepeaterProps> = {
  name: "Repeater",
  component: RepeaterComp as any,
  defaultProps: {
    of: "GalleryCarousel",
    source: { kind: "static", value: [] },
    map: { urls: "images", caption: "title" },
    layout: "grid",
    limit: 6,
  },
  schema: RepeaterSchema,
  ui: {
    layout: { kind: "enum", label: "Layout", options: [
      { label: "Grid",   value: "grid" },
      { label: "Column", value: "column" },
    ]},
    limit: { kind: "number", label: "Limit", min: 1, max: 100, step: 1 },
  },
  visible: true,
};

export const registry: Record<ComponentName, ComponentDef<any>> = {
  GalleryCarousel: GalleryDef,
  Repeater: RepeaterDef,
};
