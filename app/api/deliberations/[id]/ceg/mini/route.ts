// app/api/deliberations/[id]/ceg/mini/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const deliberationId = params.id;

  try {
    // Get all arguments with confidence
    const args = await prisma.argument.findMany({
      where: { deliberationId },
      select: {
        id: true,
        confidence: true,
        createdAt: true,
      },
    });

    const id2conf = new Map(
      args.map(a => [a.id, Math.max(0, Math.min(1, a.confidence ?? 0.7))])
    );

    // Get all edges
    const edges = await prisma.argumentEdge.findMany({
      where: { deliberationId },
      select: {
        type: true,
        fromArgumentId: true,
        toArgumentId: true,
        attackType: true,
      },
    });

    let support = 0;
    let counter = 0;
    let supportCount = 0;
    let counterCount = 0;

    for (const e of edges) {
      const w = id2conf.get(e.fromArgumentId) ?? 0.7;
      
      if (e.type === 'support') {
        support += w;
        supportCount++;
      } else if (e.type === 'rebut' || e.type === 'undercut') {
        counter += w;
        counterCount++;
      }
    }

    const total = support + counter || 1;

    return NextResponse.json({
      supportWeighted: support,
      counterWeighted: counter,
      supportPct: support / total,
      counterPct: counter / total,
      supportCount,
      counterCount,
      totalEdges: edges.length,
      totalArguments: args.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to compute CEG mini stats:', error);
    return NextResponse.json(
      { error: 'Failed to compute statistics' },
      { status: 500 }
    );
  }
}