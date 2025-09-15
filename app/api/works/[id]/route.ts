// app/api/works/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }:{ params:{ id:string }}) {
  const work = await prisma.theoryWork.findUnique({
    where: { id: params.id },
    select: { id:true, deliberationId:true, title:true, theoryType:true },
  });
  if (!work) return NextResponse.json({ error:'not found' }, { status:404 });
  return NextResponse.json({ ok:true, work });
}
