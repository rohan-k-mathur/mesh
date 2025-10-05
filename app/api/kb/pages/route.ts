// app/api/kb/pages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';
import { getUserFromCookies } from '@/lib/serverutils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_STORE = { headers: { 'Cache-Control': 'no-store' } } as const;

export async function POST(_req: NextRequest) {
  const user = await getUserFromCookies();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const userId = String((user as any).userId ?? user.id);

  // 1) Ensure personal space (owner)
  const label = 'Personal Space';
  let space = await prisma.kbSpace.findFirst({
    where: { createdById: userId, title: label },
    select: { id: true },
  });

  if (!space) {
    space = await prisma.kbSpace.create({
      data: {
        title: label,
        slug: `personal-${userId.slice(0, 4)}-${Math.random().toString(36).slice(2, 6)}`,
        createdById: userId,
        visibility: 'private' as any,
      },
      select: { id: true },
    });

    // Make sure the creator is listed as an owner member
    await prisma.kbSpaceMember.upsert({
      where: { spaceId_userId: { spaceId: space.id, userId } },
      update: { role: 'owner' as any },
      create: { spaceId: space.id, userId, role: 'owner' as any },
    });
  }

  // 2) Create a draft page in that space
  const page = await prisma.kbPage.create({
    data: {
      spaceId: space.id,
      slug: `untitled-${Math.random().toString(36).slice(2, 6)}`,
      title: 'Untitled',
      summary: null,
      visibility: 'private' as any,
      tags: [],
      frontmatter: { eval: { mode: 'product', tau: null, imports: 'off' } },
      createdById: userId,
    },
    select: { id: true },
  });

  return NextResponse.json({ id: page.id }, NO_STORE);
}
