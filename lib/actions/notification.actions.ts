"use server";
import { getUserFromCookies } from "@/lib/serverutils";

import { prisma } from "../prismaclient";

export async function createFollowNotification({ userId, actorId }: { userId: bigint; actorId: bigint; }) {
  await prisma.notification.create({
    data: { user_id: userId, actor_id: actorId, type: "FOLLOW" },
  });
}

export async function createMessageNotification({
  conversationId,
  messageId,
  senderId,
}: {
  conversationId: bigint;
  messageId: bigint;
  senderId: bigint;
}) {
  // Prefer participants table (handles groups); fall back to DM fields
  const parts = await prisma.conversationParticipant.findMany({
    where: { conversation_id: conversationId },
    select: { user_id: true },
  });

  let recipientIds: bigint[] = [];

  if (parts.length > 0) {
    recipientIds = parts.map(p => p.user_id).filter(uid => uid !== senderId);
  } else {
    const convo = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { user1_id: true, user2_id: true },
    });
    if (!convo) return;
    recipientIds = [convo.user1_id, convo.user2_id]
      .filter((v): v is bigint => Boolean(v))
      .filter(uid => uid !== senderId);
  }

  if (recipientIds.length === 0) return;

  // Create one notification per recipient
  await Promise.all(
    recipientIds.map(uid =>
      prisma.notification.create({
        data: {
          user_id: uid,
          actor_id: senderId,
          type: "MESSAGE",
          conversation_id: conversationId,
          message_id: messageId,
        },
      })
    )
  );

  // (Optional) realtime broadcast so the page updates immediately
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { createClient } = await import("@supabase/supabase-js");
      const admin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      await Promise.all(
        recipientIds.map(uid =>
          admin
            .channel(`notif:${uid.toString()}`)
            .send({ type: "broadcast", event: "new", payload: {} })
        )
      );
    }
  } catch (e) {
    // swallow; polling will pick it up
  }
}


export async function createTradeExecutedNotif({ userId, actorId, marketId, tradeId }: { userId: bigint; actorId: bigint; marketId: string; tradeId: string }) {
  await prisma.notification.create({
    data: {
      user_id: userId,
      actor_id: actorId,
      type: "TRADE_EXECUTED",
      market_id: marketId,
      trade_id: tradeId,
    },
  });
}

export async function createMarketResolvedNotif({ userId, actorId, marketId, outcome, payout }: { userId: bigint; actorId: bigint; marketId: string; outcome: string; payout?: number }) {
  await prisma.notification.create({
    data: {
      user_id: userId,
      actor_id: actorId,
      type: "MARKET_RESOLVED",
      market_id: marketId,
    },
  });
}

export async function fetchNotifications({ userId }: { userId: bigint }) {
  return await prisma.notification.findMany({
    where: { user_id: userId },
    orderBy: { created_at: "desc" },
    include: { actor: true, market: true, trade: true },
  });
}

export async function deleteNotification(id: bigint) {
  const user = await getUserFromCookies();
  if (!user?.userId) throw new Error("Unauthorized");

  await prisma.notification.deleteMany({
    where: { id, user_id: user.userId },
  });
}

export async function clearNotifications() {
  const user = await getUserFromCookies();
  if (!user?.userId) throw new Error("Unauthorized");

  await prisma.notification.deleteMany({
    where: { user_id: user.userId },
  });
}
