import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { stepInteraction } from '@/packages/ludics-engine/stepper';
import { prisma } from '@/lib/prismaclient';
import { normalizeTrace, alphaEquivalent } from '@/packages/ludics-engine/uniformity';

const Body = z.object({
  dialogueId: z.string().min(5),
  posDesignId: z.string().min(10),
  negDesignId: z.string().min(10),
  childA: z.string().min(1),   // e.g. "0.0"
  childB: z.string().min(1),   // e.g. "0.1"
  fuel: z.number().int().min(1).max(5000).default(1000),
});

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ ok:false, error: parsed.error.flatten() }, { status: 400 });

  const { dialogueId, posDesignId, negDesignId, childA, childB, fuel } = parsed.data;

  // Run with virtual negatives that focus the child
  const [ra, rb] = await Promise.all([
    stepInteraction({ dialogueId, posDesignId, negDesignId, maxPairs: fuel, virtualNegPaths: [childA] }),
    stepInteraction({ dialogueId, posDesignId, negDesignId, maxPairs: fuel, virtualNegPaths: [childB] }),
  ]);

  // Load acts to map ids -> locusPath
  const allIds = Array.from(new Set([
    ...ra.pairs.flatMap(p => [p.posActId, p.negActId]),
    ...rb.pairs.flatMap(p => [p.posActId, p.negActId]),
  ].filter(Boolean) as string[]));

  const acts = await prisma.ludicAct.findMany({ where: { id: { in: allIds } }, include: { locus: true } });
  const byId = new Map(acts.map(a => [a.id, a]));

  const na = normalizeTrace(ra.pairs, byId);
  const nb = normalizeTrace(rb.pairs, byId);
  const uniform = alphaEquivalent(na, nb);

  return NextResponse.json({
    ok: true,
    uniform,
    counterexample: uniform ? null : {
      childA, childB,
      a: na.map(p => p.locusPath),
      b: nb.map(p => p.locusPath),
    }
  }, { headers: { 'Cache-Control': 'no-store' } });
}
