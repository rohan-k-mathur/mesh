import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prismaclient';
import { getCurrentUserId } from '@/lib/serverutils';
import { resolveClaimContext } from '@/lib/server/resolveRoom';

const Body = z.object({
  targetClaimId: z.string().min(1), // claim you’re responding to
  text: z.string().min(3),          // counter-claim text
});

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { targetClaimId, text } = parsed.data;

  // find deliberation for the target claim
  const { deliberationId } = await resolveClaimContext(targetClaimId);
  if (!deliberationId) {
    return NextResponse.json({ error: 'Unable to resolve deliberation for target' }, { status: 404 });
  }

  // create a simple claim in the same deliberation
  const claim = await prisma.claim.create({
    data: {
      text,
      createdById: String(userId),
      deliberationId,
      moid: `cq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, // quick unique
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, claimId: claim.id });
}
