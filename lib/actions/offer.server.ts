"use server";
import { prisma } from "@/lib/prismaclient";
import { Prisma } from "@prisma/client";

export async function createOffer(params: {
  stallId: bigint; itemId?: bigint | null; buyerId: bigint; sellerId: bigint;
  amount: number; message?: string | null;
}) {
  // minimal validation
  if (params.amount <= 0) throw new Error("invalid amount");

  const row = await prisma.offer.create({
    data: {
      stall_id: params.stallId,
      item_id: params.itemId ?? null,
      buyer_id: params.buyerId,
      seller_id: params.sellerId,
      amount: new Prisma.Decimal(params.amount),
      currency: "usd",
      status: "PENDING",
      message: params.message ?? null,
    },
    select: {
      id: true, stall_id: true, item_id: true, buyer_id: true, seller_id: true,
      amount: true, currency: true, status: true, message: true,
      created_at: true, updated_at: true,
    },
  });

  return {
    id: row.id.toString(),
    stallId: row.stall_id.toString(),
    itemId: row.item_id?.toString() ?? null,
    buyerId: row.buyer_id.toString(),
    sellerId: row.seller_id.toString(),
    amount: Number(row.amount),
    currency: row.currency,
    status: row.status,
    message: row.message,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function setOfferStatus(offerId: bigint, next: "ACCEPTED" | "REJECTED") {
  const row = await prisma.offer.update({
    where: { id: offerId },
    data: { status: next, version: { increment: 1 } },
    select: {
      id: true, stall_id: true, item_id: true, buyer_id: true, seller_id: true,
      amount: true, currency: true, status: true, message: true,
      created_at: true, updated_at: true,
    },
  });

  return {
    id: row.id.toString(),
    stallId: row.stall_id.toString(),
    itemId: row.item_id?.toString() ?? null,
    buyerId: row.buyer_id.toString(),
    sellerId: row.seller_id.toString(),
    amount: Number(row.amount),
    currency: row.currency,
    status: row.status,
    message: row.message,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}
