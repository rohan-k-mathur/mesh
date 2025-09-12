import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prismaclient';
import { getCurrentUserId } from '@/lib/serverutils';
import { resolveClaimContext } from '@/lib/server/resolveRoom';

const Body = z.object({
  deliberationId: z.string().min(5),             // required for Mode B
  text: z.string().min(1),
  targetClaimId: z.string().min(5).optional(),   // optional → Mode A if present
});

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { deliberationId: bodyDelibId, targetClaimId, text } = parsed.data;

  // Resolve effective deliberationId:
  // - If targetClaimId is provided, derive from that claim (Mode A).
  // - Otherwise use the body deliberationId (Mode B).
  let effectiveDelibId = bodyDelibId;

  if (targetClaimId) {
    const ctx = await resolveClaimContext(targetClaimId).catch(() => null);
    const targetDelibId = ctx?.deliberationId;
    if (!targetDelibId) {
      return NextResponse.json({ error: 'Unable to resolve deliberation for target' }, { status: 404 });
    }
    // If caller also sent a body deliberationId, ensure it matches the target’s room.
    if (bodyDelibId && bodyDelibId !== targetDelibId) {
      return NextResponse.json(
        { error: 'deliberationId mismatch with targetClaimId' },
        { status: 409 }
      );
    }
    effectiveDelibId = targetDelibId;
  }

  // Final guard (paranoia): ensure we have a deliberationId
  if (!effectiveDelibId) {
    return NextResponse.json({ error: 'Missing deliberationId' }, { status: 400 });
  }

  // Create claim (+ optional edge) atomically
  const result = await prisma.$transaction(async (tx) => {
    const claim = await tx.claim.create({
      data: {
        text,
        createdById: String(userId),
        deliberationId: effectiveDelibId,
        moid: `cq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      },
      select: { id: true },
    });

    if (targetClaimId) {
      await tx.claimEdge.create({
        data: { fromId: claim.id, toId: targetClaimId, kind: 'supports' },
      });
    }

    return claim;
  });

  return NextResponse.json({ ok: true, claimId: result.id, deliberationId: effectiveDelibId });
}
