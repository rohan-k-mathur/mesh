import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { serializeBigInt } from "@/lib/utils";
import { priceYes } from "@/lib/prediction/lmsr";

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
  const price = priceYes(market.yesPool, market.noPool, market.b);
  return NextResponse.json(
    serializeBigInt({ market, pools: { yes: market.yesPool, no: market.noPool }, price }),
    { headers: { "Cache-Control": "public, max-age=60" } },
  );
}
