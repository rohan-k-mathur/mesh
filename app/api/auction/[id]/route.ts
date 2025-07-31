import { prisma } from '@/lib/prismaclient';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';  // prevent Next from caching the RSC

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { bid_cents } = await req.json();
  const auctionId = BigInt(params.id);

  /* lock row for update */
  const auction = await prisma.$transaction(async (tx) => {
    const a = await tx.auction.findUnique({
      where: { id: auctionId },
      include: { item: true },
      lock: { mode: 'update' },
    });

    if (!a || new Date(a.ends_at) < new Date()) return null;
    if (bid_cents <= a.current_bid_cents) return null;

    await tx.auction.update({
      where: { id: auctionId },
      data: { current_bid_cents: bid_cents },
    });
    return a;
  });

  if (!auction) return NextResponse.json({ error: 'bid rejected' }, { status: 400 });
  return NextResponse.json({ ok: true });
}
