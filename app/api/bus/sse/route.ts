import { NextRequest } from 'next/server';
import { bus } from '@/lib/server/bus';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const deliberationFilter = url.searchParams.get('deliberationId') ?? undefined;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const send = (evt: any) => {
        if (deliberationFilter && evt?.deliberationId !== deliberationFilter) return;
        controller.enqueue(encoder.encode(`event: msg\ndata: ${JSON.stringify(evt)}\n\n`));
      };
      const handler = (e: any) => send(e);

      bus.on('dialogue:moves:refresh', handler);
      bus.on('dialogue:cs:refresh', handler);
      bus.on('claims:edges:changed', handler);
      bus.on('cqs:changed', handler);
      bus.on('cards:changed', handler);
      bus.on('decision:changed', handler);
      bus.on('votes:changed', handler);

      // send a hello
      send({ type: 'hello', ts: Date.now(), deliberationId: deliberationFilter });

      return () => {
        bus.off('dialogue:moves:refresh', handler);
        bus.off('dialogue:cs:refresh', handler);
        bus.off('claims:edges:changed', handler);
        bus.off('cqs:changed', handler);
        bus.off('cards:changed', handler);
        bus.off('decision:changed', handler);
        bus.off('votes:changed', handler);
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
