// app/api/library/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';
import { getUserFromCookies } from '@/lib/serverutils';

export async function GET(req: NextRequest) {
  const user = await getUserFromCookies();
  if (!user) return NextResponse.json({ error:'unauth' }, { status: 401 });
  const url = new URL(req.url);
  const q = (url.searchParams.get('q') || '').trim();
  const rows = await prisma.libraryPost.findMany({
    where: { uploader_id: user.userId ? BigInt(user.userId) : undefined, ...(q ? { title: { contains: q, mode: 'insensitive' } } : {}) },
    take: 20, orderBy: { created_at: 'desc' },
    select: { id:true, title:true, file_url:true, thumb_urls:true, stack_id:true },
  });
  return NextResponse.json({ items: rows });
}
