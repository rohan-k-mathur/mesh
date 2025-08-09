// app/api/offers/stream/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function writeSSE(ctrl: ReadableStreamDefaultController, chunk: any) {
  ctrl.enqueue(typeof chunk === "string" ? chunk : JSON.stringify(chunk));
}

export async function GET(req: NextRequest) {
  const stallId = req.nextUrl.searchParams.get("stallId");
  if (!stallId) return new Response("stallId required", { status: 400 });

  // IMPORTANT: service role is server-only; never expose to client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // server env var
    { realtime: { params: { eventsPerSecond: 10 } } }
  );

  // initial backfill
  const recent = await prisma.offer.findMany({
    where: { stall_id: BigInt(stallId) },
    orderBy: { updated_at: "asc" },
    take: 50,
  });

  const stream = new ReadableStream({
    async start(ctrl) {
      // SSE headers are set on Response
      // Send a small header so clients know it’s SSE
      writeSSE(ctrl, `event: hello\ndata: ${JSON.stringify({ ok: true })}\n\n`);

      // backfill snapshot
      for (const row of recent) {
        writeSSE(ctrl, `id: ${row.updated_at?.toISOString()}\n`);
        writeSSE(ctrl, `event: offer.snapshot\n`);
        writeSSE(ctrl, `data: ${JSON.stringify(row)}\n\n`);
      }

      // heartbeat
      const hb = setInterval(() => writeSSE(ctrl, `: ping\n\n`), 15000);

      // subscribe to table changes
      const channel = supabase
        .channel(`offers-stall-${stallId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "offers", filter: `stall_id=eq.${stallId}` },
          (payload) => {
            const kind =
              payload.eventType === "INSERT" ? "offer.insert"
              : payload.eventType === "UPDATE" ? "offer.update"
              : "offer.delete";
            const body = payload.new ?? payload.old ?? {};
            writeSSE(ctrl, `id: ${new Date().toISOString()}\n`);
            writeSSE(ctrl, `event: ${kind}\n`);
            writeSSE(ctrl, `data: ${JSON.stringify(body)}\n\n`);
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            // no-op
          }
        });

      // close handlers
      // @ts-ignore
      req.signal?.addEventListener("abort", async () => {
        clearInterval(hb);
        await supabase.removeChannel(channel);
        // supabase.realtime.disconnect() // optional; per-route instance is fine to GC
        ctrl.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
