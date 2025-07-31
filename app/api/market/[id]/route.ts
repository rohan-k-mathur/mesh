import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { serializeBigInt } from "@/lib/utils";
import { priceYes } from "@/lib/prediction/lmsr";
import { getUserFromCookies } from "@/lib/serverutils";

export const revalidate = 60;

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const market = await prisma.predictionMarket.findUnique({
    where: { id: params.id },
    include: { trades: true },
  });
  if (!market) return NextResponse.json({ message: "Not found" }, { status: 404 });
  const user = await getUserFromCookies().catch(() => null);
  const price = priceYes(market.yesPool, market.noPool, market.b);
  const canResolve =
    !!user &&
    market.state === "CLOSED" &&
    (market.creatorId === user.userId || market.oracleId === user.userId);
  return NextResponse.json(
    serializeBigInt({
      market,
      pools: { yes: market.yesPool, no: market.noPool },
      price,
      canResolve,
    }),
    { headers: { "Cache-Control": "public, max-age=60" } },
  );
}
