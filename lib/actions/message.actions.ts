"use server";

import { prisma } from "@/lib/prismaclient";
import { supabase } from "@/lib/supabaseclient";
import { uploadAttachment } from "@/lib/storage/uploadAttachment";

type SendMessageArgs = {
  senderId: bigint;
  conversationId: bigint;
  text?: string;
  files?: File[];
};

export async function fetchMessages({
  conversationId,
  cursor,
  limit = 50,
}: {
  conversationId: bigint;
  cursor?: bigint;
  limit?: number;
}) {
  return prisma.message.findMany({
    where: {
      conversation_id: conversationId,
      ...(cursor ? { id: { lt: cursor } } : {}),
    },
    orderBy: { id: "desc" },
    take: limit,
    include: { sender: true, attachments: true },
  });
}

export async function sendMessage({
  senderId,
  conversationId,
  text,
  files,
}: SendMessageArgs) {
  if (!text && (!files || files.length === 0)) {
    throw new Error("Message must contain text or attachment");
  }

  return prisma.$transaction(async (tx) => {
    const member = await tx.conversationParticipant.findFirst({
      where: { conversation_id: conversationId, user_id: senderId },
      select: { user_id: true },
    });
    if (!member) throw new Error("Not a participant in this conversation");
    const message = await tx.message.create({
      data: { sender_id: senderId, conversation_id: conversationId, text },
    });

    let attachments: any[] = [];
    if (files?.length) {
      attachments = await Promise.all(
        files.map(async (f) => {
          const meta = await uploadAttachment(f);
          return tx.messageAttachment.create({
            data: {
              message_id: message.id,
              path: meta.path,
              type: meta.type,
              size: meta.size,
            },
          });
        })
      );
    }
        await tx.conversation.update({
           where: { id: conversationId },
           data: { updated_at: new Date() },
        });

    const channel = supabase.channel(`conversation-${conversationId.toString()}`);
    const payload = {
      id: message.id.toString(),
      conversationId: conversationId.toString(),
      text: message.text ?? null,
      createdAt: message.created_at.toISOString(),
      senderId: senderId.toString(),
      attachments: attachments.map((a) => ({
        id: a.id.toString(),
        path: a.path,
        type: a.type,
        size: a.size,
      })),
    };
    await channel.send({ type: "broadcast", event: "new_message", payload });
    supabase.removeChannel(channel);

    return payload;
  });
}
