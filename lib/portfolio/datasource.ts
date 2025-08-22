// lib/portfolio/datasource.ts
import { z } from "zod";

/** Where Repeater rows come from */
export const zDataSource = z.union([
  z.object({
    kind: z.literal("static"),
    value: z.array(z.any()),
  }),
  z.object({
    kind: z.literal("url"),
    href: z.string().url(),
    method: z.enum(["GET"]).optional().default("GET"),
    path: z.string().optional(), // optional JSON pointer/dot path into the response
  }),
  z.object({
    kind: z.literal("supabase"),
    table: z.string().min(1),
    fields: z.array(z.string()).optional(),
    filter: z.record(z.any()).optional(),
    orderBy: z.string().optional(),
    limit: z.number().int().positive().optional(),
  }),
]);

export type DataSource = z.infer<typeof zDataSource>;
