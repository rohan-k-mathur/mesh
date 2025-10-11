import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';
import { z } from 'zod';
import { getCurrentUserId } from '@/lib/serverutils';
import { recomputeGroundedForDelib } from '@/lib/ceg/grounded';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const Body = z.object({
  deliberationId: z.string().min(6),
  toArgumentId: z.string().min(6),
  targetInferenceId: z.string().min(6),
  fromArgumentId: z.string().min(6).optional(),
  fromText: z.string().min(3).optional(),  // create a fresh arg if no fromArgumentId
});

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { deliberationId, toArgumentId, targetInferenceId, fromArgumentId, fromText } = parsed.data;
  
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Create or use existing attacking argument
  let fromId = fromArgumentId ?? null;
  if (!fromId) {
    if (!fromText) {
      return NextResponse.json(
        { ok: false, error: 'Either fromArgumentId or fromText is required' },
        { status: 400 }
      );
    }
    
    const newArg = await prisma.argument.create({
      data: {
        deliberationId,
        text: fromText,
        authorId: String(userId),
      },
      select: { id: true }
    });
    fromId = newArg.id;
  }

  // Verify the target argument exists
  const targetArg = await prisma.argument.findUnique({
    where: { id: toArgumentId },
    select: { id: true, deliberationId: true }
  });

  if (!targetArg) {
    return NextResponse.json(
      { ok: false, error: 'Target argument not found' },
      { status: 404 }
    );
  }

  if (targetArg.deliberationId !== deliberationId) {
    return NextResponse.json(
      { ok: false, error: 'Argument does not belong to this deliberation' },
      { status: 400 }
    );
  }

  // Create the ArgumentEdge
  const edge = await prisma.argumentEdge.create({
    data: {
      deliberationId,
      fromArgumentId: fromId!,
      toArgumentId,
      type: 'undercut',
      attackSubtype: 'UNDERCUT',
      targetScope: 'inference',
      targetInferenceId,
      createdById: String(userId),
    },
    select: { id: true }
  });

  // IMPORTANT: Also create a ConflictApplication for AIF compatibility
  // This ensures the undercut appears in the AIF graph
  const conflictApp = await prisma.conflictApplication.create({
    data: {
      deliberationId,
      conflictingArgumentId: fromId!,
      conflictedArgumentId: toArgumentId,
      legacyAttackType: 'undercut',
      legacyTargetScope: 'inference',
      createdById: String(userId),
    },
    select: { id: true }
  });

  // Recompute grounded semantics
  try {
    await recomputeGroundedForDelib(deliberationId);
  } catch (error) {
    console.error('Failed to recompute grounded semantics:', error);
    // Don't fail the request, but log the error
  }

  return NextResponse.json(
    {
      ok: true,
      edge: { id: edge.id },
      conflictApplication: { id: conflictApp.id },
      fromArgumentId: fromId,
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    }
  );
}
