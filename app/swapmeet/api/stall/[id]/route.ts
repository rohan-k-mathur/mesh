import { getStall } from "@/lib/actions/stall.server";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const stall = await getStall(Number(params.id));
  return NextResponse.json(stall, {
    headers: { "Cache-Control": "no-store" },
  });
}
