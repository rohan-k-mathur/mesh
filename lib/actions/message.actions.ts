"use server";

import { prisma } from "@/lib/prismaclient";
import { supabase } from "@/lib/supabaseclient";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { uploadAttachment } from "@/lib/storage/uploadAttachment";
import { jsonSafe } from "../bigintjson";
type SendMessageArgs = {
  senderId: bigint;
  conversationId: bigint;
  text?: string;
  files?: File[];
  clientId?: string; // ← new
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
  clientId,
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
    // const message = await tx.message.create({
    //   data: { sender_id: senderId, conversation_id: conversationId, text },
    //   include: { sender: { select: { name: true, image: true } } },

    // });
    // const message = await tx.message.create({
    //         data: { sender_id: senderId, conversation_id: conversationId, text },
    //         include: { sender: { select: { name: true, image: true } } },
    //       });
    // Idempotency: if clientId is present and this (conversation, clientId) already exists, reuse it.
     let message:
       | (typeof prisma.message)["prototype"]
       | { id: bigint; created_at: Date; sender_id: bigint; text: string | null };
 
     if (clientId) {
       const existing = await tx.message.findUnique({
         where: { conversation_id_client_id: { conversation_id: conversationId, client_id: clientId } },
         include: { sender: { select: { name: true, image: true } } },
       });
       if (existing) {
         message = existing;
       } else {
         message = await tx.message.create({
           data: { sender_id: senderId, conversation_id: conversationId, text, client_id: clientId },
           include: { sender: { select: { name: true, image: true } } },
         });
       }
     } else {
       message = await tx.message.create({
         data: { sender_id: senderId, conversation_id: conversationId, text },
         include: { sender: { select: { name: true, image: true } } },
       });
     }

    let attachments: any[] = [];
    // Only create attachments if we just created the message in this transaction.
    // (If the row already existed for this clientId, no-op to avoid dupes.)
    if (!clientId || (clientId && (message as any).client_id === clientId && files?.length)) {
      // Note: this still runs on first creation or when clientId wasn't used.
      // For strict idempotency, you could also check if attachments already exist for this message.
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
  senderId: senderId.toString(), // <- string
  clientId: clientId ?? null,
  attachments: attachments.map(a => ({
    id: a.id.toString(),
    path: a.path,
    type: a.type,
    size: a.size,
  })),
};
    const safe = jsonSafe(payload);    // bigint→number, Date→ISO string

    await supabase.channel(`conversation-${conversationId.toString()}`)
    .send({ type: "broadcast", event: "new_message", payload: safe });

  // return the same shape the client expects
  return safe;
  });
}
