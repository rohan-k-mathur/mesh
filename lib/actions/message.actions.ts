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
  driftId?: bigint;
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
  driftId,
  clientId,
}: SendMessageArgs) {
  if (!text && (!files || files.length === 0)) {
    throw new Error("Message must contain text or attachment");
  }

  return prisma.$transaction(async (tx) => {
    // must be participant
    const member = await tx.conversationParticipant.findFirst({
      where: { conversation_id: conversationId, user_id: senderId },
      select: { user_id: true },
    });
    if (!member) throw new Error("Not a participant in this conversation");

    let message:
      | Awaited<ReturnType<typeof tx.message.create>>
      | Awaited<ReturnType<typeof tx.message.findUnique>>;
    let createdNow = false;

    if (clientId) {
      // idempotency: look up first
      const existing = await tx.message.findUnique({
        where: { conversation_id_client_id: { conversation_id: conversationId, client_id: clientId } },
        include: { sender: { select: { name: true, image: true } } },
      });
      if (existing) {
        message = existing;
      } else {
        message = await tx.message.create({
          data: {
            sender_id: senderId,
            conversation_id: conversationId,
            text,
            drift_id: driftId ?? undefined,
            client_id: clientId,
          },
          include: { sender: { select: { name: true, image: true } } },
        });
        createdNow = true;
      }
    } else {
      message = await tx.message.create({
        data: {
          sender_id: senderId,
          conversation_id: conversationId,
          text,
          drift_id: driftId ?? undefined,
        },
        include: { sender: { select: { name: true, image: true } } },
      });
      createdNow = true;
    }

    // attachments only on first creation
    let attachments: any[] = [];
    if (createdNow && files?.length) {
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

    // touch conversation always (ok either way)
    await tx.conversation.update({
      where: { id: conversationId },
      data: { updated_at: new Date() },
    });

    // drift counters only on first creation
    if (createdNow && driftId) {
      const updated = await tx.drift.update({
        where: { id: driftId },
        data: { message_count: { increment: 1 }, last_message_at: new Date() },
        select: { message_count: true, last_message_at: true },
      });
      // live counters
      supabase
        .channel(`conversation-${conversationId.toString()}`)
        .send({
          type: "broadcast",
          event: "drift_counters",
          payload: {
            driftId: driftId.toString(),
            messageCount: updated.message_count,
            lastMessageAt: updated.last_message_at?.toISOString() ?? null,
          },
        })
        .catch(() => {});
    }

    // broadcast only on first creation (avoid dupes)
    if (createdNow) {
      const payload = {
        id: message.id.toString(),
        conversationId: conversationId.toString(),
        text: message.text ?? null,
        createdAt: message.created_at.toISOString(),
        senderId: senderId.toString(),
        driftId: message.drift_id ? message.drift_id.toString() : null,
        clientId: clientId ?? null,
        attachments: attachments.map((a) => ({
          id: a.id.toString(),
          path: a.path,
          type: a.type,
          size: a.size,
        })),
      };
      const safe = jsonSafe(payload);
      await supabase
        .channel(`conversation-${conversationId.toString()}`)
        .send({ type: "broadcast", event: "new_message", payload: safe });
      return safe;
    }

    // If not createdNow (idempotent replay), return a minimal DTO (client hydrates by id)
    return jsonSafe({
      id: message.id.toString(),
      conversationId: conversationId.toString(),
      text: message.text ?? null,
      createdAt: message.created_at.toISOString(),
      senderId: senderId.toString(),
      driftId: message.drift_id ? message.drift_id.toString() : null,
      clientId: clientId ?? null,
      attachments: [] as any[],
    });
  });
}