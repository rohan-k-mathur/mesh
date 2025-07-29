import { prisma } from "@/lib/prismaclient";

export async function createAuction(
  stallId: number,
  itemId: number,
  reserve: number,
  minutes = 30,
) {
  const ends = new Date(Date.now() + minutes * 60_000);
  return prisma.auction.create({
    data: {
      stall_id: BigInt(stallId),
      item_id: BigInt(itemId),
      reserve_cents: reserve,
      ends_at: ends,
    },
  });
}

export async function placeBid(
  auctionId: number,
  userId: number,
  amount: number,
) {
  const a = await prisma.auction.findUnique({
    where: { id: BigInt(auctionId) },
    include: { bids: true },
  });
  if (!a || a.state !== "LIVE" || Date.now() > a.ends_at.getTime())
    throw new Error("closed");
  const highest = Math.max(
    a.reserve_cents,
    ...a.bids.map((b) => b.amount_cents),
  );
  if (amount <= highest) throw new Error("too low");
  return prisma.bid.create({
    data: {
      auction_id: BigInt(auctionId),
      bidder_id: BigInt(userId),
      amount_cents: amount,
    },
  });
}
