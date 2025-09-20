// app/api/bus/subscribe/route.ts
import { NextRequest } from "next/server";
import { bus } from "@/lib/server/bus";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const topics = (url.searchParams.get("topics") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // sensible defaults if none provided
  const listen = topics.length ? topics : [
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
  let closed = false;            // prevent post-close writes
  let cleanup: () => void = () => {};

  const stream = new ReadableStream({
    start(controller) {
      const send = (payload: any) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        } catch {
          // controller already closed
        }
      };

      const unsubs: Array<() => void> = [];
      for (const t of listen) {
        const h = (detail: any) => send({ type: t, ts: Date.now(), ...(detail || {}) });
        (bus as any).on(t, h);
        unsubs.push(() => (bus as any).off?.(t, h));
      }

      const ping = setInterval(() => send({ type: "ping", ts: Date.now() }), 15_000);

      // Initial hello
      send({ type: "hello", ts: Date.now(), topics: listen });

      cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(ping);
        unsubs.forEach((fn) => {
          try { fn(); } catch {}
        });
        try { controller.close(); } catch {}
      };

      // Abort from client
      try {
        (req as any).signal?.addEventListener?.("abort", cleanup);
      } catch {}
    },

    cancel() {
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
