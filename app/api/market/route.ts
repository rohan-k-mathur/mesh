import { NextRequest, NextResponse } from "next/server";
import { createMarket } from "@/lib/actions/prediction.actions";
import { serializeBigInt } from '@/lib/utils';


// export async function POST(req: NextRequest) {
//   const body = await req.json();
//   const result = await createMarket({
//     question: body.question,
//     closesAt: body.closesAt,
//     liquidity: body.liquidity ?? 100,
//   });
//   return NextResponse.json(result);
// }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const market = await createMarket(body);     // BigInts inside
    return NextResponse.json(serializeBigInt(market)); // ✓
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: (err as Error).message },
      { status: 500 }
    );
  }
}