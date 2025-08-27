import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const claimId = params.id;
  const { uri, locatorStart, locatorEnd, excerptHash, snapshotKey, cslJson, note } = await req.json();
  if (!uri || !excerptHash) return NextResponse.json({ error: 'uri & excerptHash required' }, { status: 400 });

  const cit = await prisma.claimCitation.create({
    data: { claimId, uri, locatorStart, locatorEnd, excerptHash, snapshotKey, cslJson, note }
  });
  return NextResponse.json({ citation: cit });
}
