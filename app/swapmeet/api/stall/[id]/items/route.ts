/* app/api/stalls/[stallId]/items/route.ts */
import { prisma } from '@/lib/prismaclient';
import { ItemSchema, ItemPayload } from '@/lib/zod-schemas';
import { NextRequest, NextResponse } from 'next/server';
import { jsonSafe } from '@/lib/bigintjson';

/* ----------  GET  ---------- */
export async function GET(
  _req: NextRequest,
  { params }: { params: { stallId: string } }
) {
  const items = await prisma.item.findMany({
    where: { stall_id: BigInt(params.stallId) },
    select: {
      id: true,
      name: true,
      price_cents: true,
      stock: true,
      images: true,
      auction: { select: { id: true, reserve_cents: true, ends_at: true } },
    },
  });

  return NextResponse.json(jsonSafe(items), { headers: { 'Cache-Control': 'no-store' } });
}

/* ----------  POST  ---------- */
export async function POST(
  req: NextRequest,
  { params }: { params: { stallId: string } }
) {
  const body   = await req.json();
  const parsed = ItemSchema.parse(body) as ItemPayload;

  const item = await prisma.item.create({
    data: {
      stall_id:    BigInt(params.stallId),   // ← FK column
      name:        parsed.name,
      description: parsed.description,
      stock:       parsed.stock,
      images:      parsed.images,
      price_cents: parsed.price_cents,       // ← required Int
    },
    select: { id: true },
  });

  return NextResponse.json(jsonSafe(item), { status: 201 });
}
