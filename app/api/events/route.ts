import { NextRequest } from "next/server";
import { bus } from "@/lib/server/bus";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const deliberationFilter = url.searchParams.get("deliberationId") ?? undefined;

  // Topics you want to fan out. Add/remove as needed.
  const topics: string[] = [
    "dialogue:moves:refresh",
    "dialogue:changed",
    "citations:changed",
    "comments:changed",
    "deliberations:created",
    "decision:changed",
    "votes:changed",
    "xref:changed",
    "stacks:changed",
  ];

  const encoder = new TextEncoder();

  // We'll store a cleanup closure here so both `cancel` and `abort` can invoke it
  let cleanup: () => void = () => {};

  const stream = new ReadableStream({
    start(controller) {
      // Safe send wrapper — never throw if controller is already closed.
      const send = (payload: any) => {
        // Optional per-room filtering
        if (deliberationFilter && payload?.deliberationId && payload.deliberationId !== deliberationFilter) {
          return;
        }
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
          );
        } catch {
          // controller already closed; ignore
        }
      };

      // Register bus handlers
      const handlers = topics.map((t) => {
        const h = (detail: any) => {
          // Normalize payload to include `type` and `ts` so clients can rely on it
          const evt = { type: t, ts: Date.now(), ...(detail || {}) };
          send(evt);
        };
        (bus as any).on(t, h);
        return { t, h };
      });

      // Heartbeat every 15s; useful for proxies that kill idle connections
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "ping", ts: Date.now() })}\n\n`));
        } catch {
          // stream closed
        }
      }, 15_000);

      // Initial hello
      send({ type: "hello", ts: Date.now(), deliberationId: deliberationFilter });

      // Compose cleanup
      cleanup = () => {
        clearInterval(heartbeat);
        handlers.forEach(({ t, h }) => (bus as any).off?.(t, h));
        try { controller.close(); } catch {}
      };

      // Abort from client/network (NextRequest has an AbortSignal)
      try {
        (req as any).signal?.addEventListener?.("abort", cleanup);
      } catch {
        // ignore
      }
    },

    cancel() {
      // Reader canceled the stream; make sure everything is torn down
      try { cleanup(); } catch {}
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
