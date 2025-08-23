// app/api/proposals/candidates/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prismaclient";
import { getUserFromCookies } from "@/lib/serverutils";

const q = z.object({
  rootMessageId: z.union([z.string(), z.number(), z.bigint()]).transform(v => BigInt(v)),
  limit: z.coerce.number().min(1).max(100).default(100),
});

function facetPreview(content: any): { title?: string; text?: string } {
  try {
    // Heuristic: if content is array of blocks, pull first heading/textish block
    const blocks = Array.isArray(content) ? content : content?.blocks ?? [];
    const firstText = blocks.find((b: any)=> /text|paragraph/i.test(b?.type))?.text
      || blocks.find((b:any) => b?.text)?.text;
    const heading = blocks.find((b:any)=> /title|heading/i.test(b?.type))?.text;
    const text = (firstText || "").toString().replace(/\s+/g, " ").trim();
    return { title: heading, text: text.slice(0, 160) };
  } catch {
    return {};
  }
}

export async function GET(req: NextRequest) {
  const me = await getUserFromCookies();
  if (!me?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = Object.fromEntries(new URL(req.url).searchParams.entries());
  const { rootMessageId, limit } = q.parse(sp);

  const root = await prisma.message.findUnique({
    where: { id: rootMessageId },
    select: { id: true, conversation_id: true },
  });
  if (!root) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const part = await prisma.conversationParticipant.findFirst({
    where: { conversation_id: root.conversation_id, user_id: me.userId },
    select: { user_id: true },
  });
  if (!part) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const drift = await prisma.drift.findFirst({
    where: { conversation_id: root.conversation_id, root_message_id: root.id, kind: "PROPOSAL" as any },
    select: { id: true },
  });
  if (!drift) return NextResponse.json({ items: [] });

  // Fetch candidates: TEXT or FACET from messages inside the proposal drift
  const msgs = await prisma.message.findMany({
    where: { drift_id: drift.id, is_redacted: false } as any,
    orderBy: { created_at: "desc" },
    take: limit,
    select: {
      id: true,
      text: true,
      created_at: true,
      sender_id: true,
      sender: { select: { id: true, name: true, image: true } },
      defaultFacetId: true,
      facets: {
        select: { id: true, kind: true, content: true },
      } as any,
    } as any,
  });

  const items = msgs.flatMap((m) => {
    const base = {
      messageId: m.id.toString(),
      authorId: m.sender_id.toString(),
      authorName: m.sender?.name ?? `User ${m.sender_id}`,
      createdAt: (m as any).created_at,
    };

    // Prefer facet if exists; otherwise TEXT
    if (Array.isArray((m as any).facets) && (m as any).facets.length > 0) {
      const defId = (m as any).defaultFacetId ?? (m as any).facets[0]?.id;
      const facet = (m as any).facets.find((f: any) => f.id === defId) ?? (m as any).facets[0];
      const { title, text } = facetPreview((facet as any).content);
      return [{
        ...base,
        kind: "FACET",
        facetId: facet.id.toString(),
        previewTitle: title ?? "Facet",
        preview: text ?? "",
      }];
    }

    if (m.text) {
      return [{
        ...base, kind: "TEXT", previewTitle: "Text", preview: m.text.slice(0, 200)
      }];
    }

    return []; // no candidate content
  });

  return NextResponse.json({
    driftId: drift.id.toString(),
    items,
  });
}
