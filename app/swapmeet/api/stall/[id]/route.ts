import { getStall } from "@/lib/actions/stall.server";
import { NextResponse } from "next/server";
import { jsonSafe } from "@/lib/bigintjson";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const stall = await getStall(Number(params.id));
  return NextResponse.json(jsonSafe(stall), {
    headers: { "Cache-Control": "no-store" },
  });
}
