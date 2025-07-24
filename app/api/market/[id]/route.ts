import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { serializeBigInt } from "@/lib/utils";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const market = await prisma.predictionMarket.findUnique({
    where: { id: params.id },
    include: { trades: true },
  });
  if (!market) return NextResponse.json({ message: "Not found" }, { status: 404 });
  return NextResponse.json(serializeBigInt(market));
}
