import { prisma } from '@/lib/prismaclient';
import { NextResponse } from 'next/server';
import { getUserFromCookies } from '@/lib/serverutils';
import { z } from 'zod';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getUserFromCookies();
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const schema = z.object({
    slug: z.string().min(1).optional(),
    html: z.string().optional(),
    css: z.string().optional(),
    tsx: z.string().nullable().optional(),
    payload: z.any().optional(),
    snapshot: z.string().nullable().optional(),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  await prisma.portfolioPage.update({
    where: { id: BigInt(params.id), owner_id: BigInt(user.userId) } as any,
    data: parsed.data,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await getUserFromCookies();
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  await prisma.portfolioPage.delete({ where: { id: BigInt(params.id), owner_id: BigInt(user.userId) } as any });
  return NextResponse.json({ ok: true });
}
