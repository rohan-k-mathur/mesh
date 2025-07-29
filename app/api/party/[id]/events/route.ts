import { prisma } from "@/lib/prismaclient";
export const runtime = "edge";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const partyId = params.id;
  const stream = new ReadableStream({
    async start(controller) {
      const tick = setInterval(async () => {
        const rows = await prisma.partyPresence.findMany({
          where: { party_id: partyId },
        });
        controller.enqueue(
          `data: ${JSON.stringify({ cursors: rows.map(r => ({ userId: r.user_id.toString(), x: r.x, y: r.y })) })}\n\n`
        );
      }, 1000);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store",
      Connection: "keep-alive",
    },
  });
}
