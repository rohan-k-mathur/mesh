// app/api/works/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const deliberationId = sp.get('deliberationId') ?? undefined;
  const authorId       = sp.get('authorId') ?? undefined;
  const theoryType     = sp.get('theoryType') as ('DN'|'IH'|'TC'|'OP'|null) ?? null;
  const withIntegrity = sp.get('withIntegrity') === '1';


  const where: any = {};
  if (deliberationId) where.deliberationId = deliberationId;
  if (authorId) where.authorId = authorId;
  if (theoryType) where.theoryType = theoryType;


  
  const works = await prisma.theoryWork.findMany({
    where,
    select: { id:true, title:true, theoryType:true, standardOutput:true, authorId:true, createdAt:true },
    orderBy: { createdAt: 'desc' },
  });

  if (!withIntegrity || !works.length) return NextResponse.json({ ok:true, works });

  const integ = await Promise.all(
    works.map(w => fetch(new URL(`/api/works/${w.id}/integrity`, req.url)).then(r=>r.json()).catch(()=>null))
  );
  const byId = new Map(works.map((w,i) => [w.id, integ[i]]));
  return NextResponse.json({ ok:true, works: works.map(w => ({ ...w, integrity: byId.get(w.id) })) });
}
