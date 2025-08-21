import { prisma } from '@/lib/prismaclient';
import { NextResponse } from 'next/server';
import { getUserFromCookies } from '@/lib/serverutils';
import { nanoid } from 'nanoid';
import { z } from 'zod';

export async function GET(req: Request) {
  const user = await getUserFromCookies();
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const url = new URL(req.url);
  const page     = Math.max(parseInt(url.searchParams.get('page') || '1', 10), 1);
  const pageSize = Math.min(Math.max(parseInt(url.searchParams.get('pageSize') || '20', 10), 1), 100);
  const q        = (url.searchParams.get('q') || '').trim();
  const sort     = url.searchParams.get('sort') || 'created_at:desc';

  const [field, dir] = sort.split(':') as [string, 'asc'|'desc'];
  const orderBy = [{ [field || 'created_at']: (dir === 'asc' ? 'asc' : 'desc') as const }, { id: 'desc' as const }];

  const where: any = {
    owner_id: BigInt(user.userId),
    ...(q ? { slug: { contains: q, mode: 'insensitive' } } : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.portfolioPage.count({ where }),
    prisma.portfolioPage.findMany({
      where, orderBy, take: pageSize, skip: (page - 1) * pageSize,
      select: { id: true, slug: true, created_at: true, snapshot: true },
    }),
  ]);

  const items = rows.map(r => ({
    id: r.id.toString(),
    slug: r.slug,
    created_at: r.created_at.toISOString(),
    snapshot: r.snapshot ?? null,
  }));

  return NextResponse.json({ items, total, page, pageSize });
}

const CreateSchema = z.object({
  slug: z.string().optional(),
  html: z.string().optional(),
  css: z.string().optional(),
  tsx: z.string().nullable().optional(),
  payload: z.any().optional(),
});

export async function POST(req: Request) {
  const user = await getUserFromCookies();
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const safe = await req.json().catch(() => ({} as unknown));
  const parsed = CreateSchema.safeParse(safe);

  const {
    slug = nanoid(),
    html = "<!-- empty -->",
    css = "",
    tsx = null,
    payload = {},
  } = parsed.success ? parsed.data : {};

  const site = await prisma.portfolioPage.create({
    data: {
      owner_id: BigInt(user.userId),
      slug, html, css, tsx, payload,
    },
    select: { id: true },
  });

  return NextResponse.json({ id: site.id.toString() }, { status: 201 });
}
