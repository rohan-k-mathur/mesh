// app/api/deliberations/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }:{ params:{ id:string }}) {
  const d = await prisma.deliberation.findUnique({ where: { id: params.id }, select: { hostType:true, hostId:true }});
  if (!d) return NextResponse.json({ error:'not found' }, { status:404 });
  return NextResponse.json(d);
}
