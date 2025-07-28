import { NextResponse } from "next/server";
import { getStall } from "swapmeet-api";
import { jsonSafe } from "@/lib/bigintjson";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const id = Number(params.id);
  if (Number.isNaN(id)) {
    return NextResponse.json({ message: "Invalid id" }, { status: 400 });
  }
  const stall = await getStall(id);
  if (!stall) return NextResponse.json({ message: "Not found" }, { status: 404 });

  return NextResponse.json(jsonSafe(stall), {
    headers: { "Cache-Control": "s-maxage=2, stale-while-revalidate=5" },
  });
}
