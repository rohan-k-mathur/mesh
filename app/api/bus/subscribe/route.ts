// app/api/bus/subscribe/route.ts
import { NextRequest } from 'next/server';
import { bus } from '@/lib/bus';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      const enc = (data:any) => `data: ${JSON.stringify(data)}\n\n`;
      const send = (type:string, detail:any={}) => controller.enqueue(new TextEncoder().encode(enc({ type, ...detail })));

      const unsubs = [
        bus.on('dialogue:moves:refresh', (d) => send('dialogue:moves:refresh', d)),
        bus.on('dialogue:cs:refresh',     (d) => send('dialogue:cs:refresh', d)),
        bus.on('claims:edges:changed',    (d) => send('claims:edges:changed', d)),
        bus.on('cards:changed',           (d) => send('cards:changed', d)),
      ];

      // keep‑alive
      const ping = setInterval(() => controller.enqueue(new TextEncoder().encode(`: ping\n\n`)), 15000);

      // close
      (req as any).signal?.addEventListener?.('abort', () => {
        clearInterval(ping);
        unsubs.forEach(u => u());
        controller.close();
      });
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
