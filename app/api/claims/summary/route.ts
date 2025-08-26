import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const deliberationId = url.searchParams.get('deliberationId');
  if (!deliberationId) return NextResponse.json({ error: 'deliberationId required' }, { status: 400 });

  const [claims, edges] = await Promise.all([
    prisma.claim.findMany({ where: { deliberationId }, select: { id: true, text: true, moid: true, createdAt: true } }),
    prisma.claimEdge.findMany({ where: { deliberationId }, select: { fromClaimId: true, type: true } }),
  ]);

  const counts: Record<string, { supports: number; rebuts: number }> = {};
  for (const c of claims) counts[c.id] = { supports: 0, rebuts: 0 };
  for (const e of edges) {
    if (!counts[e.fromClaimId]) counts[e.fromClaimId] = { supports: 0, rebuts: 0 };
    if (e.type === 'supports') counts[e.fromClaimId].supports++;
    else counts[e.fromClaimId].rebuts++;
  }

  return NextResponse.json({
    claims: claims.map((c) => ({ id: c.id, text: c.text, moid: c.moid, counts: counts[c.id] ?? { supports: 0, rebuts: 0 } })),
  });
}
