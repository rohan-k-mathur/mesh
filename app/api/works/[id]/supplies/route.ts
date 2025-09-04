import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string }}) {
  const workId = params.id;
  const edges = await prisma.knowledgeEdge.findMany({
    where: {
      OR: [
        { toWorkId: workId },
        { toClaimId: { in: (await prisma.claim.findMany({
            where:{ deliberationId: (await prisma.theoryWork.findUnique({where:{id:workId}}))?.deliberationId },
            select: { id:true }
        })).map(c=>c.id) } }
      ]
    },
    orderBy: { createdAt: 'desc' },
  });
  // Optionally hydrate minimal titles
  const workIds = Array.from(new Set(edges.flatMap(e => [e.fromWorkId, e.toWorkId]).filter(Boolean) as string[]));
  const claimIds = Array.from(new Set(edges.flatMap(e => [e.fromClaimId, e.toClaimId]).filter(Boolean) as string[]));

  const [works, claims] = await Promise.all([
    prisma.theoryWork.findMany({ where: { id: { in: workIds } }, select: { id:true, title:true, theoryType:true }}),
    prisma.claim.findMany({ where: { id: { in: claimIds } }, select: { id:true, text:true }}),
  ]);
  return NextResponse.json({ ok:true, edges, works, claims });
}
