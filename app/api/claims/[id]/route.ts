//app/api/claims/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;
  const claim = await prisma.claim.findUnique({
    where: { id },
    select: { id: true, text: true, deliberationId: true, moid: true, createdAt: true },
  });
  if (!claim) return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
  return NextResponse.json({ claim });
}
