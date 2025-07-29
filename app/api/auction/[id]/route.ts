import { prisma } from "@/lib/prismaclient";
import { jsonSafe } from "@/lib/bigintjson";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const id = Number(params.id);
  const a = await prisma.auction.findUnique({
    where: { id: BigInt(id) },
    include: {
      bids: { orderBy: { amount_cents: "desc" }, take: 10, include: { bidder: { select: { name: true } } } },
    },
  });
  return Response.json(jsonSafe(a), { headers: { "Cache-Control": "no-store" } });
}
