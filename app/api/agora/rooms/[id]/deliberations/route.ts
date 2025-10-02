// app/api/agora/rooms/[id]/deliberations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const roomId = params.id;
  const exist = await prisma.agoraRoom.findUnique({ where: { id: roomId }, select: { id: true } });
  if (!exist) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const debates = await prisma.deliberation.findMany({
    where: { roomId },
    select: { id: true, title: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
    take: 200,
  });

  return NextResponse.json({
    items: debates.map(d => ({
      id: d.id,
      title: d.title ?? `debate:${d.id.slice(0,6)}…`,
      updatedAt: d.updatedAt,
      // A synthetic sheet is always available:
      syntheticSheetId: `delib:${d.id}`,
    })),
  }, { headers: { 'Cache-Control': 'no-store' } });
}
