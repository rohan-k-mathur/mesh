"use server";
import { prisma } from "../prismaclient";
import { costToBuy } from "@/lib/prediction/lmsr";
import { getUserFromCookies } from "@/lib/serverutils";
import { Prisma } from "@prisma/client";
import { serializeBigInt } from "@/lib/utils";
import { NextResponse } from "next/server";


export interface CreateMarketArgs {
  question: string;
  closesAt: string;      // ISO datetime from the form
  liquidity?: number;    // optional, default handled below
}

export interface CreateMarketResult {
  postId: bigint;        // BigInt coming from PostgreSQL → JS bigint
}


export async function createMarket(
  { question, closesAt, liquidity = 100 }: CreateMarketArgs
): Promise<CreateMarketResult> {
  const user = await getUserFromCookies();
  if (!user) throw new Error("Not authenticated");


// 1. Create the shell realtime-post
const post = await prisma.realtimePost.create({
  data: {
    author_id: user.userId!,
    x_coordinate: new Prisma.Decimal(0),
    y_coordinate: new Prisma.Decimal(0),
    type: "PREDICTION",               // schema must include this enum value
    realtime_room_id: "global",
    locked: false,
  },
});

// 2. Create the market proper
const market = await prisma.predictionMarket.create({
  data: {
    postId: post.id,
    question,
    closesAt: new Date(closesAt),
    b: liquidity,
    creatorId: user.userId!,
  },
});


  // 3. Attach the market to the post & store serialised content
  await prisma.realtimePost.update({
    where: { id: post.id },
    data: {
      predictionMarket: { connect: { id: market.id } },
      content: JSON.stringify(serializeBigInt(market)),
    },
  });

  return { postId: post.id };
}

// export async function createMarket({ question, closesAt, liquidity }:{ question:string; closesAt:string; liquidity:number; }) {
//   const user = await getUserFromCookies();
//   if (!user) throw new Error("Not authenticated");

//   const post = await prisma.realtimePost.create({
//     data: {
//       author_id: user.userId!,
//       x_coordinate: new Prisma.Decimal(0),
//       y_coordinate: new Prisma.Decimal(0),
//       type: "PREDICTION",
//       realtime_room_id: "global",
//       locked: false,
//     },
//   });

//   const market = await prisma.predictionMarket.create({
//     data: {
//       postId: post.id,
//       question,
//       closesAt: new Date(closesAt),
//       b: liquidity,
//       creatorId: user.userId!,
//     },
//   });

//   await prisma.realtimePost.update({
//     where: { id: post.id },
//     data: {
//       predictionMarket: { connect: { id: market.id } },
//       content: JSON.stringify(serializeBigInt(market)),
//     },
//   });

//   // return { postId: post.id };
//   const { postId } = await createMarket(data); 
//   return NextResponse.json({ postId: postId.toString() });
// }

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
