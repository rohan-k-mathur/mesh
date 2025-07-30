import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';
import { ItemSchema } from '@/lib/zod-schemas';
import { broadcast } from '@/lib/sse';


// GET: list  ‑ already used in ItemsPanel
export async function GET(
    _req: Request,
    { params }: { params: { stallId } },
  ) {
    const items = await prisma.item.findMany({
      where: { stall_id: params.stallId },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(items);
  }




export async function POST(
  req: NextRequest,
  { params }: { params: { stallId: string } },
) {
  const body = await req.json();
  const data = ItemSchema.parse(body);

  const item = await prisma.item.create({
    data: { ...data, stallId: params.stallId },
  });

  broadcast(params.stallId, { type: 'ITEM_CREATED', payload: item });
  return NextResponse.json(item, { status: 201 });
}
