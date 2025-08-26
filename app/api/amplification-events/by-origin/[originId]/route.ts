import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';

export async function GET(_req: NextRequest, { params }: { params: { originId: string } }) {
  const evt = await prisma.amplificationEvent.findFirst({
    where: { originId: params.originId },
    orderBy: { createdAt: 'desc' },
    select: { id: true, kind: true, reason: true, payload: true, createdAt: true }
  });
  if (!evt) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true, event: evt });
}
