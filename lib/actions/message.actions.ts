"use server";

import { prisma } from "../prismaclient";
import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabaseclient";
import { createMessageNotification } from "./notification.actions";

export async function getOrCreateConversation({
  userId,
  targetUserId,
}: {
  userId: bigint;
  targetUserId: bigint;
}) {
  const existing = await prisma.conversation.findFirst({
    where: {
      OR: [
        { user1_id: userId, user2_id: targetUserId },
        { user1_id: targetUserId, user2_id: userId },
      ],
    },
  });
  if (existing) return existing;
  return await prisma.conversation.create({
    data: { user1_id: userId, user2_id: targetUserId },
  });
}

export async function fetchConversations({
  userId,
}: {
  userId: bigint;
}) {
  return await prisma.conversation.findMany({
    where: { OR: [{ user1_id: userId }, { user2_id: userId }] },
    include: {
      user1: true,
      user2: true,
      messages: { orderBy: { created_at: "desc" }, take: 1 },
    },
    orderBy: { updated_at: "desc" },
  });
}

export async function fetchConversation({
  conversationId,
}: {
  conversationId: bigint;
}) {
  return await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { user1: true, user2: true },
  });
}

export async function fetchMessages({
  conversationId,
}: {
  conversationId: bigint;
}) {
  return await prisma.message.findMany({
    where: { conversation_id: conversationId },
    orderBy: { created_at: "asc" },
    include: { sender: true },
  });
}

export async function sendMessage({
  conversationId,
  senderId,
  text,
  path,
}: {
  conversationId: bigint;
  senderId: bigint;
  text: string;
  path: string;
}) {
  const message = await prisma.message.create({
    data: {
      conversation_id: conversationId,
      sender_id: senderId,
      text,
    },
    include: { sender: true },
  });
  await createMessageNotification({ conversationId, messageId: message.id, senderId });
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updated_at: new Date() },
  });
  try {
    const channel = supabase.channel(`conversation-${conversationId.toString()}`);
    await channel.send({
      type: "broadcast",
      event: "new-message",
      payload: {
        id: message.id.toString(),
        text: message.text,
        created_at: message.created_at,
        sender_id: message.sender_id.toString(),
        sender: {
          name: message.sender.name,
          image: message.sender.image,
        },
      },
    });
    supabase.removeChannel(channel);
  } catch (err) {
    console.error("Failed to broadcast message", err);
  }
  revalidatePath(path);
}
