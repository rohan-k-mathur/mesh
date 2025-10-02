// app/api/agora/rooms/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(_req: NextRequest) {
  const rooms = await prisma.agoraRoom.findMany({
    select: { id: true, slug: true, title: true, summary: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
    take: 200,
  });

  const counts = await prisma.deliberation.groupBy({
    by: ['roomId'],
    _count: { roomId: true },
    where: { roomId: { in: rooms.map(r => r.id) } },
  });

  const countBy = new Map(counts.map(c => [c.roomId!, c._count.roomId]));
  return NextResponse.json({
    items: rooms.map(r => ({
      ...r,
      nDeliberations: countBy.get(r.id) ?? 0,
    })),
  }, { headers: { 'Cache-Control': 'no-store' } });
}
