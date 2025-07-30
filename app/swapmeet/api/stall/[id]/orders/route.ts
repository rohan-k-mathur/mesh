// app/api/stalls/[stallId]/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';

export async function GET(
    _req: Request,
    { params }: { params: { stallId: string } },
  ) {
    const stallId = BigInt(params.stallId);           // Stall PK is BigInt
  
    const orders = await prisma.order.findMany({
      where: { stall_id: stallId },
      include: { item: true },                        // OK – relation name is `item`
      orderBy: { created_at: 'desc' },                // use snake_case
    });
  
    return NextResponse.json(orders);
  }

  