

import { prisma } from '@/lib/prismaclient';
import { NextRequest } from 'next/server';
// Force Node runtime so Prisma works here.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
/**
 * Very small event emitter per party.
 * In production you’ll likely use Redis pub/sub or Supabase Realtime.
 */
export const channels = new Map<string, Set<(msg: string) => void>>();

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const partyId = params.id;
  const listeners = channels.get(partyId) ?? new Set();
  channels.set(partyId, listeners);

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: unknown) => {
        try {
          controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
        } catch {
          /* controller closed */
        }
      };

      listeners.add(send);
      send({ kind: 'hello', at: Date.now() });

      const keepAlive = setInterval(() => send({ _: '💓' }), 20_000);

      controller.oncancel = () => {
        clearInterval(keepAlive);
        listeners.delete(send);
      };
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      Connection: 'keep-alive',
      'Cache-Control': 'no-cache',
    },
  });
}