import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const deliberationId = params.id;
  const url = new URL(req.url);
  const idsCsv = url.searchParams.get('argumentIds') || '';
  const ids = idsCsv.split(',').map(s => s.trim()).filter(Boolean);
  if (!ids.length) return NextResponse.json({ ok: true, counts: {} });

  const links = await prisma.issueLink.findMany({
    where: { argumentId: { in: ids }, issue: { deliberationId, state: 'open' } },
    select: { argumentId: true, issueId: true },
  });

  const counts: Record<string, number> = {};
  for (const id of ids) counts[id] = 0;
  for (const l of links) counts[l.argumentId] = (counts[l.argumentId] ?? 0) + 1;

  return NextResponse.json({ ok: true, counts });
}
