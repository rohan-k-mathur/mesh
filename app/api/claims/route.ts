import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prismaclient';
import { mintClaimMoid } from '@/lib/ids/mintMoid';
import { mintUrn } from '@/lib/ids/urn';
import { getCurrentUserId } from '@/lib/serverutils';
import { maybeUpsertClaimEdgeFromArgumentEdge } from '@/lib/deepdive/claimEdgeHelpers';
import { recomputeGroundedForDelib } from '@/lib/ceg/grounded';


const PromoteSchema = z.object({
  deliberationId: z.string().optional(),
  text: z.string().min(1).optional(),
  target: z
    .object({
      type: z.enum(['argument', 'card']),
      id: z.string(),
    })
    .optional(),
});

async function getTextFromTarget(target?: { type: 'argument' | 'card'; id: string }) {
  if (!target) return null;
  if (target.type === 'argument') {
        const a = await prisma.argument.findUnique({
            where: { id: target.id },
            select: { text: true, claimId: true, deliberationId: true },
          });
          return a?.text ?? null;
  }
  if (target.type === 'card') {
    const c = await prisma.deliberationCard.findUnique({
      where: { id: target.id },
      select: { claimText: true },
    });
    return c?.claimText ?? null;
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = PromoteSchema.parse(body);

    let text = input.text ?? null;
    if (!text) text = await getTextFromTarget(input.target);
    if (!text) {
      return NextResponse.json({ error: 'No text found to promote' }, { status: 400 });
    }

    const createdById = await getCurrentUserId();
    if (!createdById) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const moid = mintClaimMoid(text);
    const existing = await prisma.claim.findUnique({ where: { moid } });
    if (existing) {
            // If promoting an argument, back-link argument to existing claim
      if (input.target?.type === 'argument') {
        await prisma.argument.update({
          where: { id: input.target.id },
          data: { claimId: existing.id },
        });
        // retroactively upsert claimEdges
        const incident = await prisma.argumentEdge.findMany({
          where: {
            OR: [{ fromArgumentId: input.target.id }, { toArgumentId: input.target.id }],
          },
          select: { id: true },
        });
        for (const e of incident) {
          await maybeUpsertClaimEdgeFromArgumentEdge(e.id);
       }
       await recomputeGroundedForDelib(deliberationId);

      }
      return NextResponse.json({ claim: existing, created: false });
    }

    // Resolve deliberationId if not provided
    let deliberationId = input.deliberationId ?? null;
    if (!deliberationId && input.target) {
      if (input.target.type === 'argument') {
        deliberationId = (
                    await prisma.argument.findUnique({
                      where: { id: input.target.id },
                      select: { deliberationId: true },
                    })
                  )?.deliberationId ?? null;
      } else {
        deliberationId = (
          await prisma.deliberationCard.findUnique({
            where: { id: input.target.id },
            select: { deliberationId: true },
          })
        )?.deliberationId ?? null;
      }
    }

    const urnValue = mintUrn('claim', moid);

    // Build claim create payload
    const claim = await prisma.claim.create({
      data: {
        text,
        createdById: createdById.toString(),
        moid,
        ...(deliberationId ? { deliberation: { connect: { id: deliberationId } } } : {}),
        // If you have a Urn relation:
        urns: {
          create: {
            entityType: 'claim',
            urn: urnValue,
          },
        },
      },
    });

    
    // If this came from an argument, link it  upsert claimEdges
    if (input.target?.type === 'argument') {
      await prisma.argument.update({
        where: { id: input.target.id },
        data: { claimId: claim.id },
      });
      const incident = await prisma.argumentEdge.findMany({
        where: {
          OR: [{ fromArgumentId: input.target.id }, { toArgumentId: input.target.id }],
        },
        select: { id: true },
      });
      for (const e of incident) {
        await maybeUpsertClaimEdgeFromArgumentEdge(e.id);
      }
    }

    return NextResponse.json({ claim, created: true });
  } catch (err: any) {
    console.error('[claims/create] failed', err);
    return NextResponse.json({ error: err?.message ?? 'Invalid request' }, { status: 400 });
  }
}
