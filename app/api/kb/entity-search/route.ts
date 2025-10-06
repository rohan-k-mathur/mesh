import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prismaclient';

export const dynamic = 'force-dynamic'; export const revalidate = 0;

const Q = z.object({
  k: z.enum(['claim','argument','room','sheet']),
  q: z.string().trim().default(''),
  limit: z.coerce.number().int().min(1).max(20).default(8),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const p = Q.parse({ k: searchParams.get('k'), q: searchParams.get('q') ?? '', limit: searchParams.get('limit') ?? '8' });

  const like = p.q.length ? p.q : undefined;

  if (p.k === 'claim') {
    const rows = await prisma.claim.findMany({
      where: like ? { text: { contains: like, mode: 'insensitive' } } : undefined,
      select: { id:true, text:true, deliberationId:true },
      take: p.limit,
      orderBy: { id: 'desc' },
    });
    return NextResponse.json({ ok:true, items: rows.map(r => ({ id:r.id, label:r.text, roomId:r.deliberationId })) });
  }

  if (p.k === 'argument') {
    const rows = await prisma.argumentDiagram.findMany({
      where: like ? { title: { contains: like, mode: 'insensitive' } } : undefined,
      select: { id:true, title:true },
      take: p.limit,
      orderBy: { id: 'desc' },
    });
    return NextResponse.json({ ok:true, items: rows.map(r => ({ id:r.id, label:r.title ?? `argument:${r.id.slice(0,6)}…` })) });
  }

  if (p.k === 'room') {
    const rows = await prisma.deliberation.findMany({
      where: like ? { title: { contains: like, mode: 'insensitive' } } : undefined,
      select: { id:true, title:true },
      take: p.limit,
      orderBy: { id: 'desc' },
    });
    return NextResponse.json({ ok:true, items: rows.map(r => ({ id:r.id, label:r.title ?? `room:${r.id.slice(0,6)}…` })) });
  }

  if (p.k === 'sheet') {
    const rows = await prisma.debateSheet.findMany({
      where: like ? { title: { contains: like, mode: 'insensitive' } } : undefined,
      select: { id:true, title:true },
      take: p.limit,
      orderBy: { id: 'desc' },
    });
    return NextResponse.json({ ok:true, items: rows.map(r => ({ id:r.id, label:r.title ?? `sheet:${r.id.slice(0,6)}…` })) });
  }

  return NextResponse.json({ ok:false, error:'unsupported' }, { status:400 });
}
