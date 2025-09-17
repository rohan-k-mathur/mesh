// app/api/events/route.ts
import { NextRequest } from 'next/server';
import { bus } from '@/lib/bus';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      const send = (m:any) => controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(m)}\n\n`));
      const handlers = [
        ['dialogue:moves:refresh'], ['dialogue:cs:refresh'], ['claims:edges:changed'],
        ['cqs:changed'], ['cards:changed'], ['decision:changed'], ['votes:changed']
      ].map(([t]) => {
        const h = (payload:any)=> send({ type:t, ...payload });
        (bus as any).on(t, h);
        return { t, h };
      });

      // heartbeat
      const hb = setInterval(()=>controller.enqueue(new TextEncoder().encode(':hb\n\n')), 30000);

      return () => {
        handlers.forEach(({t,h}) => (bus as any).off(t, h));
        clearInterval(hb);
      };
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
