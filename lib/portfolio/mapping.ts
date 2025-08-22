// lib/portfolio/mapping.ts
import { z } from "zod";

export const zTransformer = z.discriminatedUnion("t", [
  z.object({ t: z.literal("split"), sep: z.string().default(",") }),
  z.object({ t: z.literal("pick"), index: z.number().int().default(0) }),
  z.object({ t: z.literal("map"), path: z.string().min(1) }), // dot-path into arrays/objects
  z.object({ t: z.literal("toNumber") }),
  z.object({ t: z.literal("toBoolean") }),
  z.object({ t: z.literal("join"), sep: z.string().default(",") }),
  z.object({ t: z.literal("trim") }),
  z.object({ t: z.literal("lowercase") }),
  z.object({ t: z.literal("uppercase") }),
  z.object({ t: z.literal("fallback"), value: z.any() }),
  z.object({ t: z.literal("normalizeUrl") }),
  z.object({ t: z.literal("supabasePublic") }),
]);

export type TransformerSpec = z.infer<typeof zTransformer>;

export const zPropMapping = z.union([
  z.string(), // simple dot-path
  z.object({
    path: z.string().min(1),
    transform: z.array(zTransformer).default([]),
  }),
]);

export type PropMapping = z.infer<typeof zPropMapping>;

export const zMapping = z.record(zPropMapping);
export type Mapping = z.infer<typeof zMapping>;
