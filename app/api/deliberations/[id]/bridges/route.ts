import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';
import { suggestBridges } from '@/lib/topology/bridgeSuggest';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const rows = await prisma.bridgeRequest.findMany({
    where: { deliberationId: params.id, status: 'open' },
    orderBy: { createdAt: 'desc' },
    select: { id: true, targetClusterId: true, status: true, expiresAt: true, createdAt: true },
  });
  return NextResponse.json({ items: rows });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const gaps = await suggestBridges(params.id);
  // create requests for top gaps, one per pair (idempotent-ish)
  const created: string[] = [];
  for (const g of gaps) {
    const exist = await prisma.bridgeRequest.findFirst({
      where: { deliberationId: params.id, targetClusterId: g.aId, status: 'open' },
      select: { id: true }
    });
    if (exist) continue;
    const br = await prisma.bridgeRequest.create({
      data: {
        deliberationId: params.id,
        requestedById: 'system',
        targetClusterId: g.aId, // we attach one side as “target”; UI will show pair label
        status: 'open',
        expiresAt: new Date(Date.now() + 1000*60*60*24*7),
      },
    });
    created.push(br.id);
  }
  return NextResponse.json({ ok: true, created });
}
