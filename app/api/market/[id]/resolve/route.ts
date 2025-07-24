import { NextRequest, NextResponse } from "next/server";
import { resolveMarket } from "@/lib/actions/prediction.actions";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const result = await resolveMarket({ marketId: params.id, outcome: body.outcome });
  return NextResponse.json(result);
}
