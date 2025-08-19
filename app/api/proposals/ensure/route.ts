import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prismaclient";
import { getUserFromCookies } from "@/lib/serverutils";

const bodySchema = z.object({
  rootMessageId: z.union([z.string(), z.number(), z.bigint()]).transform((v) => BigInt(v)),
});

function snippet(t: string | null | undefined, n = 42) {
  if (!t) return "Proposal";
  const s = t.replace(/\s+/g, " ").trim();
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

async function isParticipant(conversationId: bigint, userId: bigint) {
  // Prefer ConversationParticipant; fall back to DM tuple
  const part = await prisma.conversationParticipant.findFirst({
    where: { conversation_id: conversationId, user_id: userId },
    select: { user_id: true },
  });
  if (part) return true;
  const dm = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { user1_id: true, user2_id: true },
  });
  return !!dm && (dm.user1_id === userId || dm.user2_id === userId);
}

export async function POST(req: NextRequest) {
  try {
    const me = await getUserFromCookies();
    if (!me?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const json = await req.json().catch(() => ({}));
    const { rootMessageId } = bodySchema.parse(json);

    // Root message (for access + titling)
    const root = await prisma.message.findUnique({
      where: { id: rootMessageId },
      select: { id: true, text: true, conversation_id: true },
    });
    if (!root) return NextResponse.json({ error: "Root message not found" }, { status: 404 });

    if (!(await isParticipant(root.conversation_id, me.userId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // One proposal drift per (root, user) (tweak if you want shared proposals)
    let drift = await prisma.drift.findFirst({
      where: { root_message_id: root.id, kind: "PROPOSAL" as any, created_by: me.userId },
    });

    if (!drift) {
      drift = await prisma.drift.create({
        data: {
          conversation_id: root.conversation_id,
          root_message_id: root.id,
          created_by: me.userId,
          kind: "PROPOSAL" as any,          // ✅ uses your enum
          title: `Proposal: ${snippet(root.text, 42)}`,
        } as any,
      });
    }

    // Normalize to your DriftUI shape (client union is "DRIFT" | "THREAD")
    const payload = {
      id: (drift as any)?.id?.toString?.() ?? "",
      title: (drift as any)?.title || "Proposal",
      isClosed: Boolean((drift as any)?.is_closed ?? (drift as any)?.isClosed ?? false),
      isArchived: Boolean((drift as any)?.is_archived ?? (drift as any)?.isArchived ?? false),
      kind: "DRIFT" as const, // map DB PROPOSAL → UI "DRIFT"
      conversationId:
        (drift as any)?.conversation_id?.toString?.() ??
        (drift as any)?.conversationId?.toString?.() ??
        root.conversation_id.toString(),
      rootMessageId:
        (drift as any)?.root_message_id?.toString?.() ??
        (drift as any)?.rootMessageId?.toString?.() ??
        root.id.toString(),
      anchorMessageId: root.id.toString(), // handy for chips
      messageCount: Number((drift as any)?.message_count ?? (drift as any)?.messageCount ?? 0),
      lastMessageAt: (drift as any)?.last_message_at
        ? new Date((drift as any).last_message_at).toISOString()
        : ((drift as any)?.lastMessageAt ? new Date((drift as any).lastMessageAt).toISOString() : null),
    };

    return NextResponse.json({ ok: true, drift: payload });
  } catch (err: any) {
    console.error("[proposals/ensure] error", err);
    const msg =
      (Array.isArray(err?.issues) && err.issues[0]?.message) ||
      err?.message ||
      "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
