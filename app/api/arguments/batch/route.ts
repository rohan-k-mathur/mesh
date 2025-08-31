import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const idsParam = url.searchParams.get('ids') || '';
  // optional guard: tie to a deliberation if you like
  const deliberationId = url.searchParams.get('deliberationId') || undefined;

  const ids = idsParam.split(',').map(s => s.trim()).filter(Boolean);
  if (!ids.length) return NextResponse.json({ items: [] });

  const rows = await prisma.argument.findMany({
    where: { id: { in: ids }, ...(deliberationId ? { deliberationId } : {}) },
    select: { id: true, text: true },
  });

  // Keep client order
  const textById = new Map(rows.map(r => [r.id, r.text]));
  const items = ids.map(id => ({ id, text: textById.get(id) ?? '' }));

  return NextResponse.json({ items }, { headers: { 'Cache-Control': 'no-store' } });
}
