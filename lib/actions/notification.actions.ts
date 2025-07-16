"use server";

import { prisma } from "../prismaclient";

export async function createFollowNotification({ userId, actorId }: { userId: bigint; actorId: bigint; }) {
  await prisma.notification.create({
    data: { user_id: userId, actor_id: actorId, type: "FOLLOW" },
  });
}

export async function createMessageNotification({ conversationId, messageId, senderId }: { conversationId: bigint; messageId: bigint; senderId: bigint; }) {
  const convo = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!convo) return;
  const userId = convo.user1_id === senderId ? convo.user2_id : convo.user1_id;
  await prisma.notification.create({
    data: {
      user_id: userId,
      actor_id: senderId,
      type: "MESSAGE",
      conversation_id: conversationId,
      message_id: messageId,
    },
  });
}

export async function fetchNotifications({ userId }: { userId: bigint }) {
  return await prisma.notification.findMany({
    where: { user_id: userId },
    orderBy: { created_at: "desc" },
    include: { actor: true },
  });
}
