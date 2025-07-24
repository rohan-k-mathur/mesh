import { NextRequest, NextResponse } from "next/server";
import { createMarket } from "@/lib/actions/prediction.actions";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = await createMarket({
    question: body.question,
    closesAt: body.closesAt,
    liquidity: body.liquidity ?? 100,
  });
  return NextResponse.json(result);
}
