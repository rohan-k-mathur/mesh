import { prisma } from "@/lib/prismaclient";
import { jsonSafe } from "@/lib/bigintjson";
import { NextResponse, NextRequest } from "next/server";
import { ItemSchema } from "@/lib/zod-schemas";

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
// POST /api/items

export async function POST(
  req: NextRequest,
  { params }: { params: { stallId: string } },
) {
  
  const body   = await req.json();
  const parsed = ItemSchema.parse(body);

  const stall_id    = BigInt(params.stallId);
  const price_cents = Math.round(parsed.price * 100);

  const item = await prisma.item.create({
    data: {
      stall_id,
      name:        parsed.name,
      description: parsed.description,
      price_cents,
      stock:       parsed.stock,
      images:      parsed.images,
    },
    select: {
      id: true, name: true, price_cents: true, stock: true, images: true,
    },
  });

  return NextResponse.json(item, { status: 201 });
}