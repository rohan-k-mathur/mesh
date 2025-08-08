"use server";

import { prisma } from "@/lib/prismaclient";

export async function getOrCreateDM({
  userAId,
  userBId,
}: {
  userAId: bigint;
  userBId: bigint;
}) {
  const existing = await prisma.conversation.findFirst({
    where: {
      OR: [
        { user1_id: userAId, user2_id: userBId },
        { user1_id: userBId, user2_id: userAId },
      ],
    },
  });
  if (existing) return existing;
  return prisma.$transaction(async (tx) => {
    const convo = await tx.conversation.create({
      data: { user1_id: userAId, user2_id: userBId },
    });
    await tx.conversationParticipant.createMany({
      data: [
        { conversation_id: convo.id, user_id: userAId },
        { conversation_id: convo.id, user_id: userBId },
      ],
    });
    
    return convo;
  });
}

export async function createGroupConversation(
  creatorId: bigint,
  participantIds: bigint[],
  title?: string
) {
  const ids = Array.from(new Set([creatorId, ...participantIds]));
  if (ids.length < 3) throw new Error("Minimum 3 participants required");

  return prisma.$transaction(async (tx) => {
    const convo = await tx.conversation.create({
      data: { title, is_group: true },
    });
    await tx.conversationParticipant.createMany({
      data: ids.map((id) => ({ conversation_id: convo.id, user_id: id })),
    });
    return convo;
    
  });
}

export async function fetchConversations(userId: bigint) {
  return prisma.conversation.findMany({
    where: { participants: { some: { user_id: userId } } },
    include: {
      participants: { include: { user: true } },
      messages: { orderBy: { created_at: "desc" }, take: 1 },
    },
    orderBy: { updated_at: "desc" },
  });
}

export async function fetchConversation(
  conversationId: bigint,
  userId: bigint
) {
  const convo = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      participants: { some: { user_id: userId } },
    },
    include: { participants: { include: { user: true } } },
  });
  if (!convo) throw new Error("Conversation not found");
  return convo;
}
