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
    by: ['agoraRoomId'],
    _count: { agoraRoomId: true },
    where: { agoraRoomId: { in: rooms.map(r => r.id) } },
  });

  const countBy = new Map(counts.map(c => [c.agoraRoomId!, c._count.agoraRoomId]));
  return NextResponse.json({
    items: rooms.map(r => ({
      ...r,
      nDeliberations: countBy.get(r.id) ?? 0,
    })),
  }, { headers: { 'Cache-Control': 'no-store' } });
}
