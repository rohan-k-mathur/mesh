import { prisma } from "@/lib/prismaclient";

const viewers = new Map<number, number>();

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const stallId = Number(params.id);
  if (!stallId) return new Response("Invalid stall", { status: 400 });

  viewers.set(stallId, (viewers.get(stallId) || 0) + 1);

  let tick: NodeJS.Timeout;
  const stream = new ReadableStream({
    start(controller) {
      let lastMsgId = 0n;
      tick = setInterval(async () => {
        const count = viewers.get(stallId) || 0;
        controller.enqueue(`data: ${JSON.stringify({ viewers: count })}\n\n`);

        const msgs = await prisma.stallMessage.findMany({
          where: { stall_id: BigInt(stallId), id: { gt: lastMsgId } },
          include: { user: { select: { name: true } } },
          orderBy: { id: "asc" },
        });
        if (msgs.length) {
          lastMsgId = msgs[msgs.length - 1].id;
          controller.enqueue(
            `data: ${JSON.stringify({ chat: msgs.map(m => ({ id: m.id.toString(), user: m.user.name, text: m.text, at: m.created_at })) })}\n\n`
          );
        }
      }, 3000);
    },
    cancel() {
      clearInterval(tick);
      const count = (viewers.get(stallId) || 1) - 1;
      if (count <= 0) viewers.delete(stallId);
      else viewers.set(stallId, count);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
