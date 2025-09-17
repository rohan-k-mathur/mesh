// import { NextRequest, NextResponse } from 'next/server';
// import { z } from 'zod';
// import { prisma } from '@/lib/prismaclient';
// import { getCurrentUserId } from '@/lib/serverutils';
// import { getNLIAdapter } from '@/lib/nli/adapter';


// const PairSchema = z.object({
//   premise: z.string().min(1),
//   hypothesis: z.string().min(1),
//   fromId: z.string().optional(),
//   toId: z.string().optional(),
//   persist: z.boolean().optional(), // per-pair override
// });

// const BodySchema = z.object({
//   pairs: z.array(PairSchema).min(1).max(100),
//   persist: z.boolean().optional().default(false), // request-level default
// });

// export async function POST(req: NextRequest) {
//   const userId = await getCurrentUserId().catch(() => null);
//   if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

//   const parsed = BodySchema.safeParse(await req.json());
//   if (!parsed.success) {
//     return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
//   }

//   const { pairs, persist: persistDefault } = parsed.data;

//   const adapter = getNLIAdapter();
//   const results = await adapter.batch(
//     pairs.map(({ premise, hypothesis }) => ({ premise, hypothesis }))
//   );

//   // optional: normalize relation values
//   const norm = (s: string) =>
//     s === 'entailment' ? 'entails'
//     : s === 'contradiction' ? 'contradicts'
//     : s === 'neutral' ? 'neutral'
//     : s;

//   const writes: Promise<any>[] = [];
//   for (let i = 0; i < pairs.length; i++) {
//     const p = pairs[i], r = results[i];
//     const effectivePersist = (p.persist ?? persistDefault) && !!p.fromId && !!p.toId;
//     if (effectivePersist) {
//       writes.push(
//         prisma.nLILink.create({
//           data: {
//             fromId: p.fromId!, toId: p.toId!,
//             relation: norm(r.relation),
//             score: r.score,
//             createdById: String(userId),
//           },
//         }).catch(() => null)
//       );
//     }
//   }
//   if (writes.length) await Promise.all(writes);

//   return NextResponse.json({
//     adapter: adapter.name,
//     results: results.map(r => ({ relation: norm(r.relation), score: r.score })),
//   });
// }
// app/api/citations/batch/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const targetType = url.searchParams.get("targetType") || "";
  const ids = (url.searchParams.get("targetIds") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!targetType || !ids.length) return NextResponse.json({ items: [] });

  const rows = await prisma.citation.findMany({
    where: { targetType, targetId: { in: ids } },
    include: { source: true },
    orderBy: { createdAt: "asc" },
  });

  // Group by targetId for convenience
  const byTarget: Record<string, any[]> = {};
  for (const r of rows) {
    (byTarget[r.targetId] ??= []).push({
      id: r.id,
      targetId: r.targetId,
      locator: r.locator,
      quote: r.quote,
      note: r.note,
      relevance: r.relevance,
      createdAt: r.createdAt,
      source: r.source,
    });
  }
  return NextResponse.json({ items: byTarget });
}
