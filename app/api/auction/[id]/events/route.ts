import { prisma } from "@/lib/prismaclient";
export const runtime = "edge";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const auctionId = BigInt(params.id);

  const stream = new ReadableStream({
    async start(controller) {
      let lastBid = 0n;
      const tick = setInterval(async () => {
        const a = await prisma.auction.findUnique({
          where: { id: auctionId },
          include: { bids: { where: { id: { gt: lastBid } }, include: { bidder: true }, orderBy: { id: "asc" } } },
        });
        if (!a) return;
        if (a.state === "CLOSED" || Date.now() > a.ends_at.getTime()) {
          controller.enqueue(`data: ${JSON.stringify({ state: "CLOSED" })}\n\n`);
          clearInterval(tick);
          controller.close();
          return;
        }

        const remaining = a.ends_at.getTime() - Date.now();
        controller.enqueue(`data: ${JSON.stringify({ remainingMs: remaining })}\n\n`);

        if (a.bids.length) {
          lastBid = a.bids[a.bids.length - 1].id;
          controller.enqueue(`data: ${JSON.stringify({ bids: a.bids.map(b => ({
            id: b.id.toString(),
            user: b.bidder.name,
            amount: b.amount_cents,
          })) })}\n\n`);
        }
      }, 2000);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
