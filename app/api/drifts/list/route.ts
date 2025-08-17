import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { getUserFromCookies } from "@/lib/serverutils";
import { jsonSafe } from "@/lib/bigintjson";

export async function GET(req: NextRequest) {
  try {
    const me = await getUserFromCookies();
    if (!me?.userId) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");
    if (!conversationId) {
      return NextResponse.json({ ok: false, error: "conversationId required" }, { status: 400 });
    }
    const convoId = BigInt(conversationId);

    // Ensure participant
    const member = await prisma.conversationParticipant.findFirst({
      where: { conversation_id: convoId, user_id: me.userId },
      select: { id: true },
    });
    if (!member) return new NextResponse("Forbidden", { status: 403 });

    const drifts = await prisma.drift.findMany({
      where: { conversation_id: convoId },
      select: {
        id: true,
        conversation_id: true,
        title: true,
        is_closed: true,
        is_archived: true,
        message_count: true,
        last_message_at: true,
        anchor_message_id: true,
        kind: true,
       root_message_id: true,
      },
      orderBy: { updated_at: "desc" },
    });

    const myPrefs = await prisma.driftMember.findMany({
      where: { user_id: me.userId, drift_id: { in: drifts.map(d => d.id) } },
      select: { drift_id: true, collapsed: true, pinned: true, muted: true, last_read_at: true },
    });
    const myById = new Map(
      myPrefs.map(m => [
        m.drift_id.toString(),
        {
          collapsed: m.collapsed,
          pinned: m.pinned,
          muted: m.muted,
          lastReadAt: m.last_read_at ? m.last_read_at.toISOString() : null,
        },
      ])
    );

    const items = drifts.map(d => ({
      anchorMessageId: d.anchor_message_id.toString(),
      drift: {
        id: d.id.toString(),
        conversationId: d.conversation_id.toString(),
        title: d.title,
        isClosed: d.is_closed,
        isArchived: d.is_archived,
        messageCount: d.message_count,
        lastMessageAt: d.last_message_at ? d.last_message_at.toISOString() : null,
        anchorMessageId: d.anchor_message_id.toString(),
      },
      my: myById.get(d.id.toString()) ?? { collapsed: true, pinned: false, muted: false, lastReadAt: null },
    }));

    return NextResponse.json(jsonSafe({ ok: true, items }), { status: 200 });
  } catch (e: any) {
    console.error("[GET /api/drifts/list] error", e);
    return NextResponse.json({ ok: false, error: e?.message ?? "Internal error" }, { status: 500 });
  }
}
