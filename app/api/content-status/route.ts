import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const targetType = url.searchParams.get('targetType');
  const targetId = url.searchParams.get('targetId');
  if (!targetType || !targetId) return NextResponse.json({ error: 'targetType & targetId required' }, { status: 400 });
  const row = await prisma.contentStatus.findUnique({ where: { targetType_targetId: { targetType, targetId } } as any });
  return NextResponse.json({ status: row?.currentStatus ?? 'OK', decidedById: row?.decidedById ?? null });
}
