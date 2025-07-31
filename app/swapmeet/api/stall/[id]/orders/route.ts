import { prisma } from '@/lib/prismaclient';
import { jsonSafe } from '@/lib/bigintjson';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: { stallId: string } }
) {
  const orders = await prisma.order.findMany({
    where: { stall_id: BigInt(params.stallId) },
    include: { item: { select: { name: true } } },
    orderBy:  { created_at: 'desc' },
  });
  return NextResponse.json(jsonSafe(orders));
}

export async function POST(
  req: NextRequest,
  { params }: { params: { stallId: string } }
) {
  const body       = await req.json();       // { itemId, qty }
  const order = await prisma.order.create({
    data: {
      stall_id: BigInt(params.stallId),
      item_id:  BigInt(body.itemId),
      qty:      body.qty ?? 1,
    },
    select: { id: true, status: true },
  });
  return NextResponse.json(jsonSafe(order), { status: 201 });
}
