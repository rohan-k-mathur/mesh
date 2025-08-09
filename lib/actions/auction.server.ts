import { prisma } from "@/lib/prismaclient";
import { Prisma } from "@prisma/client";

export async function createAuction(
  stallId: number,
  itemId: number,
  reserve: number, // dollars
  minutes = 30,
) {
  const ends = new Date(Date.now() + minutes * 60_000);
  return prisma.auction.create({
    data: {
      stall_id: BigInt(stallId),
      item_id: BigInt(itemId),
      reserve: new Prisma.Decimal(reserve),   // ⬅️ was reserve_cents
      currency: "usd",
      ends_at: ends,
    },
  });
}

export async function placeBid(
  auctionId: number,
  userId: number,
  amount: number, // dollars
) {
  return prisma.$transaction(async (tx) => {
    const a = await tx.auction.findUnique({
      where: { id: BigInt(auctionId) },
      include: { bids: { orderBy: { amount: "desc" }, take: 1 } }, // ⬅️ amount not amount_cents
    });
    if (!a || a.state !== "LIVE" || Date.now() > a.ends_at.getTime()) throw new Error("closed");

    const highest = a.bids[0]?.amount ?? a.reserve;
    // compare numerically
    if (Number(amount) <= Number(highest)) throw new Error("too low");

    return tx.bid.create({
      data: {
        auction_id: BigInt(auctionId),
        bidder_id: BigInt(userId),
        amount: new Prisma.Decimal(amount), // ⬅️
      },
    });
  });
}
