import { prisma } from "@/lib/prismaclient";
import { jsonSafe } from "@/lib/bigintjson";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const stall = Number(url.searchParams.get("stall"));
  const items = Number.isNaN(stall)
    ? []
    : await prisma.item.findMany({
        where: { stall_id: BigInt(stall) },
        select: {
          id: true,
          name: true,
          price_cents: true,
          auction: {
            select: { id: true, reserve_cents: true, ends_at: true },
          },
        },
      });
  return NextResponse.json(jsonSafe(items), {
    headers: { "Cache-Control": "no-store" },
  });
}
