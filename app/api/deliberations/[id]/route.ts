// app/api/deliberations/[id]/route.ts
import { NextResponse,NextRequest } from 'next/server';
import { prisma } from '@/lib/prismaclient';
import { getUserFromCookies } from "@/lib/serverutils";
import { emitBus } from "@/lib/server/bus";

export const dynamic = 'force-dynamic';


export async function GET(_req: Request, { params }:{ params:{ id:string }}) {
  const d = await prisma.deliberation.findUnique({ where: { id: params.id }, select: { hostType:true, hostId:true }});
  if (!d) return NextResponse.json({ error:'not found' }, { status:404 });
  return NextResponse.json(d);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUserFromCookies();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  // soft-archive — add a status field in schema if you want hard delete
  await prisma.deliberation.update({
    where: { id: params.id, createdById: String(user.userId) } as any,
    data: { updatedAt: new Date() }, // noop; replace with status: 'archived'
  }).catch(()=>{});

  emitBus("deliberations:created", { id: params.id }); // nudge hub to refresh
  return NextResponse.json({ ok: true });
}