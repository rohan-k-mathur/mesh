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
  const vis      = (url.searchParams.get('vis') || 'ALL') as 'ALL' | 'PUBLIC' | 'PRIVATE';
  const sort     = url.searchParams.get('sort') || 'created_at:desc';

  const [field, dir] = sort.split(':') as [string, 'asc' | 'desc'];
  const orderBy = [{ [field || 'created_at']: (dir === 'asc' ? 'asc' : 'desc') as const }, { id: 'desc' as const }];

  const ownerId = BigInt(user.userId);
  const where: any = {
    owner_id: ownerId,
    ...(vis === 'PUBLIC' ? { is_public: true } : {}),
    ...(vis === 'PRIVATE' ? { is_public: false } : {}),
    ...(q ? { OR: [
      { name: { contains: q, mode: 'insensitive' } },
      { slug: { contains: q, mode: 'insensitive' } },
    ] } : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.stack.count({ where }),
    prisma.stack.findMany({
      where, orderBy, take: pageSize, skip: (page - 1) * pageSize,
      select: { id:true, name:true, slug:true, is_public:true, created_at:true, description:true },
    }),
  ]);

  const items = rows.map(r => ({
    id: r.id,
    name: r.name,
    slug: r.slug ?? '',
    is_public: r.is_public,
    created_at: r.created_at.toISOString(),
    description: r.description ?? null,
  }));

  return NextResponse.json({ items, total, page, pageSize });
}

const CreateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  slug: z.string().optional(),
  is_public: z.boolean().optional(),
  description: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  const user = await getUserFromCookies();
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const safe = await req.json().catch(() => ({} as unknown));
  const parsed = CreateSchema.safeParse(safe);

  const {
    name = 'Untitled Stack',
    slug = nanoid(),
    is_public = false,
    description = null,
  } = parsed.success ? parsed.data : {};

  const stack = await prisma.stack.create({
    data: {
      owner_id: BigInt(user.userId),
      name, slug, is_public, description,
      // order: [] // optional; fill if you have a default
    },
    select: { id: true },
  });

  return NextResponse.json({ id: stack.id }, { status: 201 });
}
