import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const stall = Number(url.searchParams.get("stall"));
  return NextResponse.json(
    stall
      ? [{ id: 1, name: "Mock item", price_cents: 1000 }]
      : [],
    { headers: { "Cache-Control": "no-store" } },
  );
}

