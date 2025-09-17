// // app/api/citations/attach/route.ts
// import { NextRequest, NextResponse } from 'next/server';
// import { prisma } from '@/lib/prismaclient';
// import { z } from 'zod';

// const Attach = z.object({
//   targetType: z.enum(['argument','claim','card','comment','move']),
//   targetId: z.string().min(3),
//   sourceId: z.string().min(5),
//   locator: z.string().optional(),
//   quote: z.string().max(280).optional(),
//   note: z.string().max(500).optional(),
//   relevance: z.number().min(1).max(5).optional(),
//   createdById: z.string().min(1),
// });

// export async function POST(req: NextRequest) {
//   const parsed = Attach.safeParse(await req.json().catch(()=>null));
//   if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
//   const d = parsed.data;

//   try {
//     const row = await prisma.citation.create({
//       data: {
//         targetType: d.targetType, targetId: d.targetId, sourceId: d.sourceId,
//         locator: d.locator ?? null, quote: d.quote ?? null, note: d.note ?? null,
//         relevance: d.relevance ?? null, createdById: d.createdById,
//       },
//     }).catch(async (e: any) => {
//       // unique([targetType, targetId, sourceId, locator]) → return existing
//       if (e?.code === 'P2002') {
//         const existing = await prisma.citation.findFirst({
//           where: { targetType: d.targetType, targetId: d.targetId, sourceId: d.sourceId, locator: d.locator ?? null },
//         });
//         return existing;
//       }
//       throw e;
//     });

//     (globalThis as any).__meshBus__?.emitEvent?.('citations:changed', { targetType: d.targetType, targetId: d.targetId });
//     return NextResponse.json({ citation: row });
//   } catch (e: any) {
//     return NextResponse.json({ error: e?.message ?? 'attach failed' }, { status: 400 });
//   }
// }

// export async function DELETE(req: NextRequest) {
//   const url = new URL(req.url);
//   const id = url.searchParams.get('id');
//   if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
//   await prisma.citation.delete({ where: { id } }).catch(()=>{});
//   (globalThis as any).__meshBus__?.emitEvent?.('citations:changed', { id });
//   return NextResponse.json({ ok: true });
// }
// app/api/citations/attach/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { getCurrentUserId } from "@/lib/serverutils";

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const { targetType, targetId, sourceId, locator, quote, note, relevance } = await req.json();

  if (!targetType || !targetId || !sourceId) {
    return NextResponse.json({ error: "targetType, targetId, sourceId required" }, { status: 400 });
  }

  const cit = await prisma.citation.create({
    data: {
      targetType,
      targetId,
      sourceId,
      locator: locator ?? null,
      quote: quote ?? null,
      note: note ?? null,
      relevance: typeof relevance === "number" ? relevance : null,
      createdById: String(userId),
    },
  });

  try { (globalThis as any).__meshBus__?.emit?.("citations:changed", { targetType, targetId }); } catch {}
  return NextResponse.json({ citation: cit });
}

export async function DELETE(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const { citationId } = await req.json();
  if (!citationId) return NextResponse.json({ error: "citationId required" }, { status: 400 });
  await prisma.citation.delete({ where: { id: citationId } });
  try { (globalThis as any).__meshBus__?.emit?.("citations:changed", {}); } catch {}
  return NextResponse.json({ ok: true });
}
