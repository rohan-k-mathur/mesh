// app/api/events/route.ts  (or /api/bus/sse)
import { NextRequest } from 'next/server';
import { bus } from '@/lib/server/bus';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const deliberationFilter = url.searchParams.get('deliberationId') ?? undefined;

  const stream = new ReadableStream({
    start(controller) {
      const enc = new TextEncoder();
      const send = (evt: any) => {
        if (deliberationFilter && evt?.deliberationId && evt.deliberationId !== deliberationFilter) return;
        controller.enqueue(enc.encode(`event: msg\ndata: ${JSON.stringify(evt)}\n\n`));
      };
      const handler = (e: any) => send(e);

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
        'xref:changed',
        'citations:changed',
        'dialogue:changed', // generic
      ] as const;

      topics.forEach(t => bus.on(t, handler));

      // hello + heartbeat
      send({ type: 'hello', ts: Date.now(), deliberationId: deliberationFilter });
      const hb = setInterval(() => controller.enqueue(enc.encode(`:hb ${Date.now()}\n\n`)), 30000);

      return () => {
        clearInterval(hb);
        topics.forEach(t => bus.off(t, handler));
      };
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-store, no-transform',
      Connection: 'keep-alive',
    },
  });
}
