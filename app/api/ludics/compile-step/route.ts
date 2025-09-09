// app/api/ludics/compile-step/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';

export async function POST(req: NextRequest) {
  const { deliberationId, phase } = await req.json().catch(() => ({}));
  if (!deliberationId) {
    return NextResponse.json({ ok: false, error: 'deliberationId required' }, { status: 400 });
  }

  // 1) compile from moves
  await fetch(new URL('/api/ludics/compile', req.url), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ deliberationId }),
  }).catch(() => {});

  // 2) pick designs (Proponent → Opponent if present)
  const designs = await prisma.ludicDesign.findMany({
    where: { deliberationId },
    orderBy: { participantId: 'asc' },
    select: { id: true, participantId: true },
  });

  if (designs.length < 1) {
    return NextResponse.json({ ok: true, trace: null, status: 'EMPTY' });
  }
  const pro = designs.find(d => d.participantId === 'Proponent') ?? designs[0];
  const opp = designs.find(d => d.participantId === 'Opponent')  ?? designs[1] ?? designs[0];

  // 3) step once (or keep stepping under your stepper’s maxPairs)
  const res = await fetch(new URL('/api/ludics/step', req.url), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      dialogueId: deliberationId,
      posDesignId: pro.id,
      negDesignId: opp.id,
      phase: phase ?? 'neutral',
    }),
  }).then(r => r.json()).catch(() => null);

  return NextResponse.json({ ok: true, trace: res ?? null });
}
