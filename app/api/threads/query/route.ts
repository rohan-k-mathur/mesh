// app/api/threads/query/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { getUserFromCookies } from "@/lib/serverutils";

const s = (b: bigint) => b.toString();

export async function POST(req: NextRequest) {
  try {
    const me = await getUserFromCookies();
    if (!me?.userId) return new NextResponse("Unauthorized", { status: 401 });

    const { conversationId, rootIds } = await req.json();
    const convId = BigInt(conversationId);
    const roots = (Array.isArray(rootIds) ? rootIds : []).map((r: string) => BigInt(r));

    // membership
    const isMember = await prisma.conversationParticipant.findFirst({
      where: { conversation_id: convId, user_id: me.userId },
      select: { user_id: true },
    });
    if (!isMember) return new NextResponse("Forbidden", { status: 403 });

    const drifts = await prisma.drift.findMany({
      where: { conversation_id: convId, kind: "THREAD", root_message_id: { in: roots } },
      orderBy: { last_message_at: "desc" },
    });

    const items = drifts.map((d) => ({
      drift: {
        id: s(d.id),
        kind: d.kind,
        title: d.title,
        messageCount: d.message_count,
        lastMessageAt: d.last_message_at ? d.last_message_at.toISOString() : null,
        rootMessageId: d.root_message_id ? s(d.root_message_id) : null,
        anchorMessageId: d.anchor_message_id ? s(d.anchor_message_id) : null,
        isClosed: !!d.closed_at,
        isArchived: !!d.archived_at,
      },
      my: { collapsed: true, pinned: false, muted: false, lastReadAt: null },
    }));

    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    console.error("[POST /api/threads/query] error", e);
    return NextResponse.json({ ok: false, error: e?.message ?? "Internal error" }, { status: 500 });
  }
}
