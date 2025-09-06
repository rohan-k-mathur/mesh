// app/api/cqs/attachments/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';
import { z } from 'zod';

const Q = z.object({
  targetType: z.enum(['claim']), // extend if you support more
  targetId: z.string().min(8),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = Q.safeParse({
    targetType: url.searchParams.get('targetType'),
    targetId: url.searchParams.get('targetId'),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: 'bad params' }, { status: 400 });
  }
  const { targetId } = parsed.data;

  // 1) GraphEdge meta (created by the “Attach” flow)
  const edges = await prisma.graphEdge.findMany({
    where: { toId: targetId },
    select: { meta: true },
    take: 2000,
  });

  // 2) Also accept explicit attacker ClaimEdges (rebuts/undercuts) to the target
  const claimEdges = await prisma.claimEdge.findMany({
    where: { toClaimId: targetId, OR: [{ type: 'rebuts' }, { attackType: 'UNDERCUTS' }] },
    select: { id: true, createdAt: true },
    take: 2000,
  });

  const attached: Record<string, boolean> = {};
  for (const e of edges) {
    const m = (e.meta ?? {}) as any;
    const key = m?.schemeKey && m?.cqKey ? `${m.schemeKey}:${m.cqKey}` : null;
    if (key) attached[key] = true;
  }
  // If there are generic attacker edges without explicit scheme metadata,
  // you’ll still gate via “isAttached overall” if you want (optional):
  if (claimEdges.length > 0) attached['__ANY__'] = true;

  return NextResponse.json({ attached });
}
