import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const idsParam = url.searchParams.get('ids') ?? '';
  const ids = [...new Set(idsParam.split(',').map(s => s.trim()).filter(Boolean))];
  if (ids.length === 0) return NextResponse.json({ items: [] });

  const rows = await prisma.claim.findMany({
    where: { id: { in: ids } },
    select: { id: true, text: true },
  });
  // keep order if you want, but not required
  return NextResponse.json({ items: rows });
}

