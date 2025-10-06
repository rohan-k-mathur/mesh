import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';
import { requireKbRole, fail } from '@/lib/kb/withSpaceAuth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const Body = z.object({
  order: z.array(z.string().min(6)).min(1),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { order } = Body.parse(await req.json());
    // Ensure caller can edit this page
    await requireKbRole(req, { pageId: params.id, need: 'editor' });

    // Sanity: only ids that belong to this page (ignore stray ids)
    const rows = await prisma.kbBlock.findMany({
      where: { pageId: params.id },
      select: { id: true },
    });
    const pageIds = new Set(rows.map(r => r.id));
    const filtered = order.filter(id => pageIds.has(id));

    // Apply new ord in a transaction
    await prisma.$transaction(
      filtered.map((id, idx) =>
        prisma.kbBlock.update({ where: { id }, data: { ord: idx } })
      )
    );

    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    return fail(e);
  }
}
