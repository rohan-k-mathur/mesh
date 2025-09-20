// app/api/bus/sse/route.ts
import { NextRequest } from "next/server";
import { bus } from "@/lib/server/bus";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const deliberationFilter = url.searchParams.get("deliberationId") ?? undefined;

  const topics = [
    'dialogue:moves:refresh',
    'dialogue:cs:refresh',
    'claims:edges:changed',
    'cqs:changed',
    'cards:changed',
    'decision:changed',
    'votes:changed',
    'deliberations:created',
    'comments:changed',
    "stacks:changed",
    'xref:changed',
    'citations:changed',
    'dialogue:changed', // generic
  ] as const;

  const encoder = new TextEncoder();
  let closed = false;
  let cleanup: () => void = () => {};

  const stream = new ReadableStream({
    start(controller) {
      const send = (payload: any) => {
        if (closed) return;
        if (deliberationFilter && payload?.deliberationId && payload.deliberationId !== deliberationFilter) {
          return;
        }
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        } catch {
          // Controller closed by runtime — flip flag & cleanup to stop timers/listeners.
          closed = true;
          try { cleanup(); } catch {}
        }
      };

      const handlers = topics.map((t) => {
        const h = (detail: any) => send({ type: t, ts: Date.now(), ...(detail || {}) });
        (bus as any).on(t, h);
        return { t, h };
      });

      const pingId = setInterval(() => send({ type: "ping", ts: Date.now() }), 15_000);
      send({ type: "hello", ts: Date.now(), deliberationId: deliberationFilter });

      cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(pingId);
        handlers.forEach(({ t, h }) => (bus as any).off?.(t, h));
        try { controller.close(); } catch {}
      };

      try { (req as any).signal?.addEventListener?.("abort", cleanup); } catch {}
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