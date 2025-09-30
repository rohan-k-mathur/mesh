import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';
import { z } from 'zod';
import { getCurrentUserId } from '@/lib/serverutils';

const Body = z.object({
  deliberationId: z.string(),
  items: z.array(z.object({
    assumptionId: z.string(),
    role: z.enum(['premise','warrant','value','context']).default('premise'),
    weight: z.number().min(0).max(1).optional(),
    metaJson: z.any().optional()
  })).max(100)
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const argId = params.id;
  const body = Body.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const { deliberationId, items } = body.data;
  await prisma.assumptionUse.deleteMany({ where: { argumentId: argId } }); // replace on save
  if (items.length) {
    await prisma.assumptionUse.createMany({
      data: items.map(i => ({ ...i, deliberationId, argumentId: argId }))
    });
  }
  return NextResponse.json({ ok: true, count: items.length });
}
