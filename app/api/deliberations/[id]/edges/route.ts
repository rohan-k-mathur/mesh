import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prismaclient';
import { getCurrentUserId } from '@/lib/serverutils';
import { asUserIdString } from '@/lib/auth/normalize';

const Body = z.object({
  fromArgumentId: z.string().min(1),
  toArgumentId: z.string().min(1),
  type: z.enum(['support', 'rebut', 'undercut']),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userIdStr = asUserIdString(userId);
  const deliberationId = params.id;
  const { fromArgumentId, toArgumentId, type } = Body.parse(await req.json());

  // Ensure both arguments belong to the same deliberation
  const [from, to] = await Promise.all([
    prisma.argument.findUnique({ where: { id: fromArgumentId }, select: { deliberationId: true } }),
    prisma.argument.findUnique({ where: { id: toArgumentId }, select: { deliberationId: true } }),
  ]);
  if (!from || !to || from.deliberationId !== deliberationId || to.deliberationId !== deliberationId) {
    return NextResponse.json({ error: 'Argument mismatch' }, { status: 400 });
  }

  const edge = await prisma.argumentEdge.create({
    data: { deliberationId, fromArgumentId, toArgumentId, type, createdById: userIdStr },
  });
  return NextResponse.json({ ok: true, edge });
}
