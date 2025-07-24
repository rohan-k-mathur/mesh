"use server";
import { prisma } from "../prismaclient";
import { costToBuy } from "@/lib/prediction/lmsr";
import { getUserFromCookies } from "@/lib/serverutils";
import { Prisma } from "@prisma/client";

export async function createMarket({ question, closesAt, liquidity }:{ question:string; closesAt:string; liquidity:number; }) {
  const user = await getUserFromCookies();
  if (!user) throw new Error("Not authenticated");

  const post = await prisma.realtimePost.create({
    data: {
      author_id: user.userId!,
      x_coordinate: new Prisma.Decimal(0),
      y_coordinate: new Prisma.Decimal(0),
      type: "PREDICTION",
      realtime_room_id: "global",
      locked: false,
    },
  });

  const market = await prisma.predictionMarket.create({
    data: {
      postId: post.id,
      question,
      closesAt: new Date(closesAt),
      b: liquidity,
      creatorId: user.userId!,
    },
  });

  await prisma.realtimePost.update({
    where: { id: post.id },
    data: { predictionMarket: { connect: { id: market.id } }, content: JSON.stringify(market) },
  });

  return { postId: post.id };
}

export async function tradeMarket({ marketId, side, credits }:{ marketId:string; side:"YES"|"NO"; credits:number; }) {
  const user = await getUserFromCookies();
  if (!user) throw new Error("Not authenticated");
  const market = await prisma.predictionMarket.findUniqueOrThrow({ where:{ id: marketId } });
  if (market.state !== "OPEN") throw new Error("Market closed");
  let lo=0, hi=1000;
  for(let i=0;i<30;i++){
    const mid=(lo+hi)/2;
    const cost=costToBuy(side, mid, market.yesPool, market.noPool, market.b);
    cost>credits?hi=mid:lo=mid;
  }
  const shares=lo;
  const cost=Math.ceil(costToBuy(side, shares, market.yesPool, market.noPool, market.b));
  await prisma.$transaction(async tx => {
    await tx.trade.create({ data:{ marketId, userId:user.userId!, side, shares, cost, price: cost/shares } });
    await tx.predictionMarket.update({
      where:{ id: marketId },
      data: side === "YES" ? { yesPool: { increment: shares } } : { noPool:{ increment: shares } }
    });
  });
  return { shares, cost };
}
