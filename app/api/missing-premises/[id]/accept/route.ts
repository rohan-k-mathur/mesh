import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';

export async function POST(_: NextRequest, { params }: { params: { id: string } }) {
  const row = await prisma.missingPremise.update({
    where: { id: params.id },
    data: { status: 'accepted', decidedAt: new Date() },
  });
  return NextResponse.json({ ok: true, premise: row });
}
