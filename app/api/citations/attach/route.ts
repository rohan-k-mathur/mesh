import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/serverutils";
import { emitBus } from "@/lib/server/bus";

const Attach = z.object({
  targetType: z.enum(["argument", "claim", "card", "comment", "move", "proposition"]),
  targetId: z.string().min(1),
  sourceId: z.string().min(1),
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
    // Create (or fetch existing) + include source so we can enrich the bus event
    const row = await prisma.citation
      .create({
        data: {
          targetType: d.targetType,
          targetId: d.targetId,
          sourceId: d.sourceId,
          locator: d.locator ?? null,
          quote: d.quote ?? null,
          note: d.note ?? null,
          relevance: d.relevance ?? null,
          createdById: String(userId),
        },
        include: { source: true },
      })
      .catch(async (e: any) => {
        if (e?.code === "P2002") {
          return prisma.citation.findFirst({
            where: {
              targetType: d.targetType,
              targetId: d.targetId,
              sourceId: d.sourceId,
              locator: d.locator ?? null,
            },
            include: { source: true },
          });
        }
        throw e;
      });

    if (!row) throw new Error("citation missing");

    // Best-effort: stack context + preview of the target text
    let stackId: string | null = null;
    let targetPreview: string | null = null;
    let deliberationId: string | null = null;


if (d.targetType === "claim") {
  try {
    const cl = await prisma.claim.findUnique({
      where: { id: d.targetId },
      select: { deliberationId: true },
    });
    deliberationId = cl?.deliberationId ?? null;
  } catch {}
} else if (d.targetType === "proposition") {
  try {
    const prop = await (prisma as any).proposition.findUnique({
      where: { id: d.targetId },
      select: { deliberationId: true },
    });
    deliberationId = prop?.deliberationId ?? null;
  } catch {}
} else if (d.targetType === "comment" && stackId) {
  try {
    const delib = await prisma.deliberation.findFirst({
      where: { hostId: stackId },            // optionally add hostType filter if you want
      select: { id: true },
    });
    deliberationId = delib?.id ?? null;
  } catch {}
}


    // if (d.targetType === "comment") {
    //   try {
    //     const cm = await prisma.feedPost.findUnique({
    //       where: { id: BigInt(d.targetId) },
    //       select: { content: true, parent_id: true },
    //     });
    //     const rootId = cm?.parent_id ?? BigInt(d.targetId);
    //     const root = await prisma.feedPost.findUnique({
    //       where: { id: rootId },
    //       select: { stack_id: true },
    //     });
    //     stackId = root?.stack_id ?? null;
    //     targetPreview = (cm?.content || "").replace(/\s+/g, " ").trim().slice(0, 100);
    //   } catch {}
    // } else if (d.targetType === "claim") {
    //   try {
    //     const c = await prisma.claim.findUnique({ where: { id: d.targetId }, select: { text: true } });
    //     targetPreview = (c?.text || "").replace(/\s+/g, " ").trim().slice(0, 100);
    //   } catch {}
    // }

    // Domain/kind/platform (if you store them on Source)
    const url = row.source?.url ?? null;
    const domain = (() => {
      try { return url ? new URL(url).hostname.replace(/^www\./, "") : null; }
      catch { return null; }
    })();
    const kind = (row.source as any)?.kind ?? null;        // 'pdf' | 'web' | 'dataset' | …
    const platform = (row.source as any)?.platform ?? null; // 'arxiv' | 'library' | …

    // 🔊 Rich payload for Agora
    emitBus("citations:changed", {
      action: "attached",
      targetType: d.targetType,
      targetId: d.targetId,
      stackId,
      deliberationId,             

      sourceId: row.sourceId,
      title: row.source?.title ?? null,
      url,
      domain,
      kind,
      platform,
      locator: row.locator ?? null,
      quote: row.quote ?? null,
      note:       row.note    ?? null,   // 👈 add this

      targetPreview,
    });

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

  emitBus("citations:changed", { action: "deleted", citationId: parsed.data.citationId });

  return NextResponse.json({ ok: true, deleted: !!row });
}