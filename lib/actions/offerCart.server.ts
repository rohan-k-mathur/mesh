"use server";

import { prisma } from "@/lib/prismaclient";

export async function addOfferToCart(userId: bigint, offerId: bigint, deadline: Date) {
  await prisma.cart.upsert({
    where: { offer_id: offerId },
    update: { deadline },
    create: { user_id: userId, offer_id: offerId, deadline },
  });
}

export async function viewCart(userId: bigint) {
  return prisma.cart.findMany({
    where: { user_id: userId },
    orderBy: { added_at: "desc" },
    select: {
      id: true,
      deadline: true,
      offer: {
        select: { id: true, price_cents: true, item: { select: { id: true, name: true } } },
      },
    },
  });
}

export async function createEscrow(cartId: bigint, txRef: string) {
  return prisma.escrow.create({
    data: { cart_id: cartId, state: "HELD", tx_ref: txRef },
  });
}

export async function releaseEscrow(cartId: bigint) {
  return prisma.escrow.update({
    where: { cart_id: cartId },
    data: { state: "RELEASED" },
  });
}
