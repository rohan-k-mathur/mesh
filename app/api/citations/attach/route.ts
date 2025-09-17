// app/api/citations/attach/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/serverutils";
import { emitBus } from "@/lib/bus";
const Attach = z.object({
  targetType: z.enum(["argument", "claim", "card", "comment", "move"]),
  targetId: z.string().min(3),
  sourceId: z.string().min(5),
  locator: z.string().optional(),
  quote: z.string().max(280).optional(),
  note: z.string().max(500).optional(),
  relevance: z.number().min(1).max(5).optional(),
});

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const parsed = Attach.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;

  try {
    const row = await prisma.citation.create({
      data: {
        targetType: d.targetType, targetId: d.targetId, sourceId: d.sourceId,
        locator: d.locator ?? null, quote: d.quote ?? null, note: d.note ?? null,
        relevance: d.relevance ?? null, createdById: String(userId),
      },
    }).catch(async (e: any) => {
      // unique([targetType, targetId, sourceId, locator]) -> return the existing record
      if (e?.code === "P2002") {
        const existing = await prisma.citation.findFirst({
          where: { targetType: d.targetType, targetId: d.targetId, sourceId: d.sourceId, locator: d.locator ?? null },
        });
        return existing!;
      }
      throw e;
    });
    emitBus("citations:changed", { targetType, targetId });
    return NextResponse.json({ citation: row });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "attach failed" }, { status: 400 });
  }
}

const DelBody = z.object({ citationId: z.string().min(6) });
export async function DELETE(req: NextRequest) {
  const userId = await getCurrentUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const parsed = DelBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const row = await prisma.citation.delete({ where: { id: parsed.data.citationId } }).catch(() => null);
  (globalThis as any).__meshBus__?.emitEvent?.("citations:changed", { citationId: parsed.data.citationId });
  return NextResponse.json({ ok: true, deleted: !!row });
}
