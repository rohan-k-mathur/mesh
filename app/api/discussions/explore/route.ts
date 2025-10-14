// app/api/discussions/explore/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Cache for 1 minute

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit') ?? 20)));
  const cursor = url.searchParams.get('cursor'); // offset-based for simplicity
  const sort = url.searchParams.get('sort') ?? 'hot'; // hot, new, top

  const offset = cursor ? parseInt(cursor, 10) : 0;

  let orderBy: any = { updatedAt: 'desc' }; // default 'new'
  
  if (sort === 'hot') {
    // Hot = recent activity + reply count
    // We'll order by lastActiveAt desc, with high reply count as tiebreaker
    orderBy = [{ lastActiveAt: 'desc' }, { replyCount: 'desc' }];
  } else if (sort === 'top') {
    // Top = most replies all time
    orderBy = [{ replyCount: 'desc' }, { createdAt: 'desc' }];
  } else if (sort === 'new') {
    orderBy = { createdAt: 'desc' };
  }

  // Get count for total (optional, for pagination UI)
  const total = await prisma.discussion.count();

  const items = await prisma.discussion.findMany({
    orderBy,
    skip: offset,
    take: limit + 1,
    select: {
      id: true,
      title: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      lastActiveAt: true,
      replyCount: true,
      viewCount: true,
      createdById: true,
      conversationId: true,
    },
  });

  const hasMore = items.length > limit;
  const page = items.slice(0, limit).map(i => ({
    ...i,
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
    lastActiveAt: i.lastActiveAt?.toISOString() ?? i.updatedAt.toISOString(),
  }));

  const nextCursor = hasMore ? String(offset + limit) : null;

  return NextResponse.json({
    items: page,
    nextCursor,
    total,
    sort,
  });
}