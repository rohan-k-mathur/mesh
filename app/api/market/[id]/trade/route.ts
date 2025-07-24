import { NextRequest, NextResponse } from "next/server";
import { tradeMarket } from "@/lib/actions/prediction.actions";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const result = await tradeMarket({
    marketId: params.id,
    side: body.side,
    credits: body.credits,
  });
  return NextResponse.json(result);
}
