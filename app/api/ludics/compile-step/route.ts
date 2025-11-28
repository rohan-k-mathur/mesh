// app/api/ludics/compile-step/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';
import { compileFromMoves } from '@/packages/ludics-engine/compileFromMoves';
import { stepInteraction } from 'packages/ludics-engine/stepper';

/**
 * POST /api/ludics/compile-step
 * Compiles dialogue moves into Ludics designs and runs the stepper.
 * 
 * Body: { deliberationId, phase?, compositionMode?, fuel? }
 * Returns: { ok, proId, oppId, trace }
 */
export async function POST(req: NextRequest) {
  const { deliberationId, phase = 'neutral', compositionMode = 'assoc', fuel = 2048 } =
    await req.json().catch(() => ({}));

  if (!deliberationId) {
    return NextResponse.json({ ok: false, error: 'deliberationId required' }, { status: 400 });
  }

  try {
    // 1) Compile from moves (direct function call, no internal fetch)
    // Note: withCompileLock inside compileFromMoves serializes concurrent calls
    await compileFromMoves(deliberationId).catch((e) => {
      console.warn('[compile-step] compile warning:', e?.message);
    });

    // 2) Wait for designs to be fully committed and lock to release
    await new Promise(resolve => setTimeout(resolve, 500));

    // 3) Pick designs
    const designs = await prisma.ludicDesign.findMany({
      where: { deliberationId },
      orderBy: { participantId: 'asc' },
      select: { id: true, participantId: true },
    });

    if (designs.length < 1) {
      return NextResponse.json({ ok: true, trace: null, status: 'EMPTY' });
    }

    const pro = designs.find(d => d.participantId === 'Proponent') ?? designs[0];
    const opp = designs.find(d => d.participantId === 'Opponent') ?? designs[1] ?? designs[0];

    // 4) Step interaction (direct function call, no internal fetch)
    const trace = await stepInteraction({
      dialogueId: deliberationId,
      posDesignId: pro.id,
      negDesignId: opp.id,
      phase: phase as 'neutral' | 'focus-P' | 'focus-O',
      compositionMode: compositionMode as 'assoc' | 'partial' | 'spiritual' | 'split',
      maxPairs: fuel,
    });

    return NextResponse.json({
      ok: true,
      proId: pro.id,
      oppId: opp.id,
      trace,
    });
  } catch (e: any) {
    console.error('[compile-step] Error:', e);
    return NextResponse.json(
      { ok: false, error: e?.message || 'Internal error' },
      { status: 500 }
    );
  }
}
