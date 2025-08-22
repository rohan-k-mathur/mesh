// lib/portfolio/transformers.ts
import type { TransformerSpec } from "./mapping";
import { normalizeSupabasePublicUrl } from "@/lib/utils";

function getByPath(obj: any, path: string): any {
  if (!path) return undefined;
  return path.split(".").reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

export function applyTransformChain(value: any, chain: TransformerSpec[]): any {
  let v = value;
  for (const step of chain) {
    try {
      switch (step.t) {
        case "split":
          v = typeof v === "string" ? v.split(step.sep ?? ",") : v;
          break;
        case "join":
          v = Array.isArray(v) ? v.join(step.sep ?? ",") : v;
          break;
        case "pick":
          v = Array.isArray(v) ? v[step.index ?? 0] : v;
          break;
        case "map":
          v = Array.isArray(v) ? v.map((it) => getByPath(it, step.path)) : getByPath(v, step.path);
          break;
        case "toNumber":
          v = typeof v === "string" ? Number(v) : Number(v);
          if (Number.isNaN(v)) v = undefined;
          break;
        case "toBoolean":
          v =
            typeof v === "boolean"
              ? v
              : typeof v === "string"
              ? ["true", "1", "yes", "y"].includes(v.toLowerCase())
              : Boolean(v);
          break;
        case "trim":
          v = typeof v === "string" ? v.trim() : v;
          break;
        case "lowercase":
          v = typeof v === "string" ? v.toLowerCase() : v;
          break;
        case "uppercase":
          v = typeof v === "string" ? v.toUpperCase() : v;
          break;
        case "fallback":
          if (v == null || (typeof v === "string" && !v.trim())) v = step.value;
          break;
        case "normalizeUrl":
          if (typeof v === "string") v = encodeURI(v);
          if (Array.isArray(v)) v = v.map((s) => (typeof s === "string" ? encodeURI(s) : s));
          break;
        case "supabasePublic":
          if (typeof v === "string") v = normalizeSupabasePublicUrl(v);
          if (Array.isArray(v)) v = v.map((s) => (typeof s === "string" ? normalizeSupabasePublicUrl(s) : s));
          break;
      }
    } catch {
      // swallow individual transform errors; let the rest continue
    }
  }
  return v;
}

export function evaluatePropMapping(mapping: string | { path: string; transform?: TransformerSpec[] }, row: any) {
  if (typeof mapping === "string") return getByPath(row, mapping);
  const base = getByPath(row, mapping.path);
  return applyTransformChain(base, mapping.transform ?? []);
}
