// app/api/arguments/[id]/conflicts/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';
export async function GET(_req: Request, { params }: { params:{ id:string }}) {
  const id = params.id;
  const items = await prisma.conflictApplication.findMany({
    where: { OR: [
      { conflictingArgumentId: id }, { conflictedArgumentId: id },
    ]},
    select: { id: true, schemeId: true, conflictingKind: true, conflictedKind: true }
  });
  return NextResponse.json({ ok:true, items }, { headers: { 'Cache-Control':'no-store' } });
}

// app/api/arguments/[id]/preferences/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';
export async function GET(_req: Request, { params }: { params:{ id:string }}) {
  const id = params.id;
  const items = await prisma.preferenceApplication.findMany({
    where: {
      OR: [{ preferredArgumentId: id }, { dispreferredArgumentId: id }]
    },
    select: { id:true, schemeId:true, preferredArgumentId:true, dispreferredArgumentId:true }
  });
  return NextResponse.json({ ok:true, items }, { headers: { 'Cache-Control':'no-store' } });
}
