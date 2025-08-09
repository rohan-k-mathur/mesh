// app/swapmeet/api/offers/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prismaclient";

export async function GET(req: NextRequest) {
  const stallId = req.nextUrl.searchParams.get("stallId");
  if (!stallId) return new Response("stallId required", { status: 400 });

  const rows = await prisma.offer.findMany({
    where: { stall_id: BigInt(stallId) },
    orderBy: { updated_at: "asc" },
    take: 50,
    select: {
      id: true, stall_id: true, item_id: true, buyer_id: true, seller_id: true,
      amount: true, currency: true, status: true, message: true,
      created_at: true, updated_at: true,
    },
  });

  // BigInt/Decimal safe serialization
  const out = rows.map(o => ({
    id: o.id.toString(),
    stallId: o.stall_id.toString(),
    itemId: o.item_id?.toString() ?? null,
    buyerId: o.buyer_id.toString(),
    sellerId: o.seller_id.toString(),
    amount: Number(o.amount),           // Decimal -> number for UI
    currency: o.currency,
    status: o.status,
    message: o.message,
    createdAt: o.created_at.toISOString(),
    updatedAt: o.updated_at?.toISOString() ?? new Date().toISOString(),
  }));

  return new Response(JSON.stringify(out), {
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
