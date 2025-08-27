import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';

/** Support vs Counter meters:
 * weight = sum(arg.confidence(default .7) * stanceProb)
 * v0 stanceProb = 1 for supports, 1 for rebuts (counter group)
 * self-endorsement exclusion is handled when computing representative views; here we aggregate globally
 */
export async function GET(_: Request, { params }: { params: { id: string } }) {
  const deliberationId = params.id;

  // Arguments & edges already captured in your schema
  const args = await prisma.argument.findMany({
    where: { deliberationId },
    select: { id: true, confidence: true }
  });

  const id2conf = new Map(args.map(a => [a.id, Math.max(0, Math.min(1, a.confidence ?? 0.7))]));
  const edges = await prisma.argumentEdge.findMany({
    where: { deliberationId },
    select: { type: true, fromArgumentId: true, toArgumentId: true }
  });

  let support = 0, counter = 0;
  for (const e of edges) {
    const w = id2conf.get(e.fromArgumentId) ?? 0.7;
    if (e.type === 'support') support += w; // stanceProb 1
    if (e.type === 'rebut' || e.type === 'undercut') counter += w; // stanceProb 1
  }

  // Normalize to 0..1 over total for a nicer meter; keep raw too
  const total = support + counter || 1;
  return NextResponse.json({
    supportWeighted: support,
    counterWeighted: counter,
    supportPct: support / total,
    counterPct: counter / total,
  });
}
