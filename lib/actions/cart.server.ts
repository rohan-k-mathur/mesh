"use server";

import { prisma } from "@/lib/prismaclient";

export async function addToCart(userId: bigint, itemId: bigint, qty = 1) {
  await prisma.cartItem.upsert({
    where: {
      user_id_item_id: {
        user_id: userId,
        item_id: itemId,
      },
    },
    update: {
      qty: { increment: qty },
    },
    create: {
      user_id: userId,
      item_id: itemId,
      qty,
    },
  });
}

export async function getCartCount(userId: bigint) {
  const c = await prisma.cartItem.aggregate({
    where: { user_id: userId },
    _sum: { qty: true },
  });
  return c._sum.qty ?? 0;
}
