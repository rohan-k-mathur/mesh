// app/api/arguments/batch/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const ids = (url.searchParams.get('ids') ?? '')
    .split(',').map(s => s.trim()).filter(Boolean);
  const deliberationId = url.searchParams.get('deliberationId') ?? undefined;

  if (!ids.length) return NextResponse.json({ items: [] });

  const rows = await prisma.argument.findMany({
    where: { id: { in: ids }, ...(deliberationId ? { deliberationId } : {}) },
    select: {
      id: true,
      text: true,
      claimId: true,
      outgoingEdges: {
        where: { type: { in: ['rebut', 'undercut'] } },
        select: { type: true, targetScope: true },
      },
    },
  });

  // keep request order
  const byId = new Map(rows.map(r => [r.id, r]));
  const items = ids.map(id => {
    const r = byId.get(id);
    return r ? {
      id: r.id,
      claimId: r.claimId,
      text: r.text,
      edgesOut: (r.outgoingEdges ?? []).map(e => ({
        type: e.type === 'rebut' ? 'rebuts' : 'undercuts',
        targetScope: e.targetScope ?? undefined,
      }))
    } : { id, claimId: null, text: '', edgesOut: [] };
  });

  return NextResponse.json({ items }, { headers: { 'Cache-Control': 'no-store' } });
}
