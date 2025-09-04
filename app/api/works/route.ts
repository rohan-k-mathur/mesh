import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const deliberationId = sp.get('deliberationId') ?? undefined;
  const authorId       = sp.get('authorId') ?? undefined;
  const theoryType     = sp.get('theoryType') as ('DN'|'IH'|'TC'|'OP'|null) ?? null;

  const where: any = {};
  if (deliberationId) where.deliberationId = deliberationId;
  if (authorId) where.authorId = authorId;
  if (theoryType) where.theoryType = theoryType;

  const works = await prisma.theoryWork.findMany({
    where,
    select: { id:true, title:true, theoryType:true, standardOutput:true, authorId:true, createdAt:true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ ok: true, works });
}
