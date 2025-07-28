// app/swapmeet/api/offers/route.ts
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const stall = Number(url.searchParams.get("stall"));
  // TODO: replace with real query
  return NextResponse.json(
    stall
      ? [{ id: 1, price: 20, user: "alice", mine: false }]
      : [],
    { headers: { "Cache-Control": "no-store" } },
  );
}
