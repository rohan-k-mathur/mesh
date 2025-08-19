import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prismaclient";
import { getUserFromCookies } from "@/lib/serverutils";

const bodySchema = z.object({
  rootMessageId: z.coerce.bigint(),
});

async function userInConversation(conversationId: bigint, userId: bigint) {
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

function snippet(s: string | null | undefined, max = 60) {
  if (!s) return "";
  const t = s.replace(/\s+/g, " ").trim();
 return t.length > max ? t.slice(0, max - 1) + "…" : t;
}

export async function POST(req: NextRequest) {
  const me = await getUserFromCookies();
  if (!me?.userId) return new NextResponse("Unauthorized", { status: 401 });

  const { rootMessageId } = bodySchema.parse(await req.json());

  // Fetch the root message and conversation for access checks   titling
  const root = await prisma.message.findUnique({
    where: { id: rootMessageId },
    select: {
      id: true,
      text: true,
      conversation_id: true,
      sender_id: true,
      conversation: { select: { id: true } },
    },
  });
  if (!root) return new NextResponse("Not Found", { status: 404 });
  if (!(await userInConversation(root.conversation_id, me.userId))) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // Find or create a proposal drift for this root message (per user)
  // NOTE: If your Drift model differs, adjust fields (kind/title/root_message_id).
  let drift = await prisma.drift.findFirst({
    where: {
      conversation_id: root.conversation_id,
      kind: "PROPOSAL",
      root_message_id: root.id,
      created_by: me.userId,
    },
    select: { id: true, title: true, is_closed: true, is_archived: true, kind: true },
  });

  if (!drift) {
    drift = await prisma.drift.create({
      data: {
        conversation_id: root.conversation_id,
        root_message_id: root.id,
        kind: "PROPOSAL",
        title: `Proposal: ${snippet(root.text, 42)}`,
        created_by: me.userId,
      },
      select: { id: true, title: true, is_closed: true, is_archived: true, kind: true },
    });
  }

  return NextResponse.json({
    ok: true,
    drift: {
      id: drift.id.toString(),
      title: drift.title,
      isClosed: Boolean((drift as any).is_closed ?? false),
      isArchived: Boolean((drift as any).is_archived ?? false),
      kind: drift.kind,
    },
  });
}
