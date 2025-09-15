// app/api/works/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string }}) {
  const w = await prisma.theoryWork.findUnique({
    where: { id: params.id },
    select: { id: true, deliberationId: true, title: true, theoryType: true },
  });
  if (!w) return NextResponse.json({ error:'not found' }, { status: 404 });
  return NextResponse.json({ ok:true, work: w });
}
