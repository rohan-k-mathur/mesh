import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const idsRaw = url.searchParams.get('ids') || '';
  const ids = [...new Set(idsRaw.split(',').map(decodeURIComponent).map(s => s.trim()).filter(Boolean))];
  if (!ids.length) return NextResponse.json({ items: [] });

  const claims = await prisma.claim.findMany({
    where: { id: { in: ids } },
    select: { id: true, text: true },
  });

  // keep client-friendly order (as requested), fall back to found set
  const byId = new Map(claims.map(c => [c.id, c]));
  const items = ids.map(id => byId.get(id)).filter(Boolean);
  return NextResponse.json({ items }, {
    headers: { 'Cache-Control': 'public, max-age=0, s-maxage=20, stale-while-revalidate=60' }
  });}
