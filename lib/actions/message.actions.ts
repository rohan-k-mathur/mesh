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

export async function fetchMessages(conversationId: bigint) {
  return prisma.message.findMany({
    where: { conversation_id: conversationId },
    orderBy: { created_at: "asc" },
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
              url: meta.url,
              type: meta.type,
              size: meta.size,
            },
          });
        })
      );
    }

    const channel = supabase.channel(`conversation-${conversationId.toString()}`);
    await channel.send({
      type: "broadcast",
      event: "new_message",
      payload: { message, attachments, senderId: senderId.toString() },
    });
    supabase.removeChannel(channel);

    return { message, attachments };
  });
}
