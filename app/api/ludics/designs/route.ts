import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';

export async function GET(req: NextRequest) {
  const deliberationId = req.nextUrl.searchParams.get('deliberationId') || '';
  if (!deliberationId) return NextResponse.json({ ok:false, error:'missing deliberationId' }, { status:400 });

  const designs = await prisma.ludicDesign.findMany({
    where: { deliberationId },
    orderBy: { participantId: 'asc' },
    include: {
      acts: { include: { locus: true }, orderBy: { orderInDesign: 'asc' } },
    },
  });
  return NextResponse.json({ ok:true, designs });
}
