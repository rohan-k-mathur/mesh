import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prismaclient';
import { getCurrentUserId } from '@/lib/serverutils';
import { asUserIdString } from '@/lib/auth/normalize';

const Body = z.object({
  argumentId: z.string().min(1),
  approve: z.boolean().default(true),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userIdStr = asUserIdString(userId);
  const deliberationId = params.id;
  const { argumentId, approve } = Body.parse(await req.json());

  // Simple toggle
  if (approve) {
    await prisma.argumentApproval.upsert({
      where: { argumentId_userId: { argumentId, userIdStr } },
      create: { deliberationId, argumentId, userIdStr },
      update: {},
    });
  } else {
    await prisma.argumentApproval.deleteMany({ where: { argumentId, userId: userIdStr } });
  }
  return NextResponse.json({ ok: true });
}
