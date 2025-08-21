import { prisma } from '@/lib/prismaclient';
import { NextResponse } from 'next/server';
import { getUserFromCookies } from '@/lib/serverutils';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getUserFromCookies();
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });

  await prisma.stack.update({
    where: { id: params.id, owner_id: BigInt(user.userId) } as any,
    data: { name },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = await getUserFromCookies();
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  await prisma.stack.delete({ where: { id: params.id, owner_id: BigInt(user.userId) } as any });
  return NextResponse.json({ ok: true });
}
