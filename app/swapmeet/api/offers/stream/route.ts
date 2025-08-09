// app/swapmeet/api/offers/stream/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { Prisma } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AnyRow = Record<string, any>;

function encodeOffer(row: AnyRow) {
  // Works for both Prisma rows and Supabase payloads
  const id = row.id ?? row?.new?.id ?? row?.old?.id;
  const updated = row.updated_at ?? row?.new?.updated_at ?? row?.old?.updated_at ?? new Date();

  return {
    id: String(id),
    stallId: String(row.stall_id ?? row?.new?.stall_id ?? row?.old?.stall_id),
    itemId: row.item_id ?? row?.new?.item_id ?? row?.old?.item_id ? String(row.item_id ?? row?.new?.item_id ?? row?.old?.item_id) : null,
    buyerId: String(row.buyer_id ?? row?.new?.buyer_id ?? row?.old?.buyer_id),
    sellerId: String(row.seller_id ?? row?.new?.seller_id ?? row?.old?.seller_id),
    amount: Number((row.amount ?? row?.new?.amount ?? row?.old?.amount) as Prisma.Decimal | number | string),
    currency: String(row.currency ?? row?.new?.currency ?? row?.old?.currency ?? "usd"),
    status: String(row.status ?? row?.new?.status ?? row?.old?.status) as "PENDING"|"ACCEPTED"|"REJECTED"|"EXPIRED",
    message: (row.message ?? row?.new?.message ?? row?.old?.message) ?? null,
    createdAt: new Date(row.created_at ?? row?.new?.created_at ?? row?.old?.created_at ?? new Date()).toISOString(),
    updatedAt: new Date(updated).toISOString(),
  };
}

function write(ctrl: ReadableStreamDefaultController, s: string) {
  ctrl.enqueue(s);
}

export async function GET(req: NextRequest) {
  const stallId = req.nextUrl.searchParams.get("stallId");
  if (!stallId) return new Response("stallId required", { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // server-only
    { realtime: { params: { eventsPerSecond: 10 } } }
  );

  // Cursor from Last-Event-ID (ISO string)
  const lastEventId = req.headers.get("last-event-id");

  // Initial backfill (respect cursor)
  const recent = await prisma.offer.findMany({
    where: {
      stall_id: BigInt(stallId),
      ...(lastEventId ? { updated_at: { gt: new Date(lastEventId) } } : {}),
    },
    orderBy: { updated_at: "asc" },
    take: 50,
  });

  const stream = new ReadableStream({
    async start(ctrl) {
      let hb: any;

      try {
        // Standard SSE preface
        write(ctrl, `retry: 5000\n`); // suggest 5s reconnect backoff
        write(ctrl, `event: hello\ndata: ${JSON.stringify({ ok: true })}\n\n`);

        // Backfill snapshot
        for (const row of recent) {
          const safe = encodeOffer(row);
          write(ctrl, `id: ${safe.updatedAt}\n`);
          write(ctrl, `event: offer.snapshot\n`);
          write(ctrl, `data: ${JSON.stringify(safe)}\n\n`);
        }

        // Heartbeat
        hb = setInterval(() => write(ctrl, `: ping\n\n`), 15000);

        // Realtime subscription
        const channel = supabase
          .channel(`offers-stall-${stallId}`)
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "offers", filter: `stall_id=eq.${stallId}` },
            (payload) => {
              const event =
                payload.eventType === "INSERT" ? "offer.insert" :
                payload.eventType === "UPDATE" ? "offer.update" :
                "offer.delete";

              const safe = encodeOffer(payload);
              write(ctrl, `id: ${safe.updatedAt}\n`);
              write(ctrl, `event: ${event}\n`);
              write(ctrl, `data: ${JSON.stringify(safe)}\n\n`);
            }
          )
          .subscribe();

        // Clean shutdown on client abort
        // @ts-ignore
        req.signal?.addEventListener("abort", async () => {
          clearInterval(hb);
          await supabase.removeChannel(channel);
          ctrl.close();
        });
      } catch (e) {
        clearInterval(hb);
        // Don’t crash; close politely so client reconnects
        write(ctrl, `event: error\ndata: ${JSON.stringify({ message: "stream-error" })}\n\n`);
        ctrl.close();
      }
    },
    async cancel() {
      // in case cancel fires without abort
      // supabase client will be GC'ed per-route; no-op
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
