// app/api/deliberations/ensure/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { getCurrentUserId } from "@/lib/serverutils";
import { emitBus } from "@/lib/server/bus";
import { jsonSafe } from "@/lib/bigintjson";
import { ensureBaselineLudicsDesigns } from "@/lib/ludics/ensureBaseline";
import { onDeliberationCreated } from "@/lib/triggers/knowledgeGraphTriggers";
import { TargetType } from "@prisma/client";
import { z } from "zod";

const Allowed = new Set([
  "article",
  "post",
  "room_thread",
  "library_stack",
  "site",
  "inbox_thread",
] as const);

const Body = z.object({
  hostType: z.string(),
  hostId: z.string(),
  anchor: z
    .object({
      targetType: z.string().optional(),
      targetId: z.string().nullable().optional(),
      selectorJson: z.any().optional(),
      title: z.string().nullable().optional(),
      snippet: z.string().nullable().optional(),
    })
    .optional(),
});

export async function POST(req: NextRequest) {
  const me = await getCurrentUserId();
  if (!me) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Bad body" }, { status: 400 });

  let { hostType, hostId, anchor } = parsed.data;

  // Map synthetic host type "discussion" → enum-backed "inbox_thread"
  if (hostType === "discussion") {
    const discussion = await prisma.discussion.findUnique({
      where: { id: hostId },
      select: { conversationId: true },
    });
    if (!discussion) {
      return NextResponse.json({ error: "Discussion not found" }, { status: 404 });
    }

    let convId = discussion.conversationId;
    if (!convId) {
      // Ensure a conversation exists for this discussion
      const conv = await prisma.$transaction(async (tx) => {
        const c = await tx.conversation.create({ data: {} });
        await tx.discussion.update({ where: { id: hostId }, data: { conversationId: c.id } });
        return c;
      });
      convId = conv.id;
    }

    hostType = "inbox_thread";
    hostId = String(convId);
  }

  if (!Allowed.has(hostType as any)) {
    return NextResponse.json({ error: `Invalid hostType '${hostType}'` }, { status: 400 });
  }

  let d = await prisma.deliberation.findFirst({
    where: { hostType: hostType as any, hostId },
    select: { id: true },
  });

  let created = false;
  if (!d) {
    d = await prisma.deliberation.create({
      data: { hostType: hostType as any, hostId, createdById: String(me) },
      select: { id: true },
    });
    created = true;
    emitBus("deliberations:created", { id: d.id, hostType, hostId, source: "ensure" });
    // Trigger knowledge graph update
    onDeliberationCreated(d.id).catch(console.error);
    // 👇 Ensure baseline Ludics designs exist so DeepDivePanel has something to render.

   try {
      const { proId, oppId } = await ensureBaselineLudicsDesigns({
        deliberationId: d.id,
        participantId: String(me),
        seedActs: true,
      });
      
    } catch (e) {
      console.warn("[ludics] baseline seed failed:", e);
    }
   }
  let anchorId: string | undefined;
  if (anchor) {
    const a = await prisma.deliberationAnchor.create({
      data: {
        deliberationId: d.id,
        targetType: anchor.targetType ?? "unknown",
        targetId: anchor.targetId ?? null,
        selectorJson: anchor.selectorJson ?? null,
        title: anchor.title ?? null,
        snippet: anchor.snippet ?? null,
        createdById: String(me),
      },
      select: { id: true },
    });
    anchorId = a.id;
  }

 return NextResponse.json(jsonSafe({ id: d.id, created, anchorId }));
}
