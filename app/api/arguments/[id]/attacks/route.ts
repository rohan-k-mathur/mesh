// app/api/arguments/[id]/attacks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';
import { z } from 'zod';
import type { ArgumentEdge, TargetType } from '@prisma/client';

const NO_STORE = { headers: { 'Cache-Control': 'no-store' } } as const;

const Body = z.object({
  deliberationId: z.string().min(4),
  createdById: z.string().min(1),
  fromArgumentId: z.string().min(4),
  attackType: z.enum(['REBUTS','UNDERCUTS','UNDERMINES']),
  targetScope: z.enum(['conclusion','inference','premise']),
  toArgumentId: z.string().nullable().optional(),
  targetClaimId: z.string().nullable().optional(),
  targetPremiseId: z.string().nullable().optional(),
  cqKey: z.string().nullable().optional(),
});

// --- NEW: GET -> list attacks pointing at this argument ---
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const items = await prisma.argumentEdge.findMany({
    where: { toArgumentId: params.id },
    select: {
      id: true, attackType: true, targetScope: true,
      fromArgumentId: true, toArgumentId: true,
      targetClaimId: true, targetPremiseId: true, cqKey: true
    }
  });
  return NextResponse.json({ ok: true, items }, NO_STORE);
}

// --- existing POST: keep your guards; only adjust CQ upsert ---
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const targetArgumentId = params.id;
  const parsed = Body.safeParse(await req.json().catch(()=>({})));
  if (!parsed.success) return NextResponse.json({ ok:false, error: parsed.error.flatten() }, { status: 400 });
  const p = parsed.data;

  // sanity: target must exist in this deliberation
  const targ = await prisma.argument.findFirst({
    where: { id: targetArgumentId, deliberationId: p.deliberationId },
    select: { id: true, conclusionClaimId: true }
  });
  if (!targ) return NextResponse.json({ ok:false, error:'TARGET_NOT_FOUND' }, { status: 404 });

  // per-type guards
  if (p.attackType === 'REBUTS') {
    if (!p.targetClaimId || p.targetClaimId !== targ.conclusionClaimId) {
      return NextResponse.json({ ok:false, error:'REBUT_REQUIRES_TARGET_CONCLUSION' }, { status: 400 });
    }
  }
  if (p.attackType === 'UNDERMINES') {
    if (!p.targetPremiseId) return NextResponse.json({ ok:false, error:'UNDERMINE_REQUIRES_PREMISE' }, { status: 400 });
    const prem = await prisma.argumentPremise.findFirst({
      where: { argumentId: targetArgumentId, claimId: p.targetPremiseId }
    });
    if (!prem) return NextResponse.json({ ok:false, error:'PREMISE_NOT_IN_ARGUMENT' }, { status: 400 });
  }

  // create edge
  const edge = await prisma.argumentEdge.create({
    data: {
      deliberationId: p.deliberationId,
      createdById: p.createdById,
      fromArgumentId: p.fromArgumentId,
      toArgumentId: targetArgumentId,
      type: (p.attackType === 'UNDERCUTS' ? 'undercut' : 'rebut') as ArgumentEdge['type'],
      attackType: p.attackType,
      targetScope: p.targetScope,
      targetClaimId: p.targetClaimId ?? null,
      targetPremiseId: p.targetPremiseId ?? null,
      cqKey: p.cqKey ?? null,
    }
  });

  // CQ status (use a consistent composite key; no schemeKey dependency)
  if (p.cqKey) {
    await prisma.cQStatus.upsert({
      where: {
        targetType_targetId_schemeKey_cqKey: {
          targetType: 'argument' as TargetType,
          targetId: targetArgumentId,
          schemeKey: "",
          cqKey: p.cqKey,
        }
      },
      update: { status: 'answered', argumentId: p.fromArgumentId },
      create: {
        targetType: 'argument' as TargetType,
        targetId: targetArgumentId,
        cqKey: p.cqKey,
        status: 'answered',
        argumentId: p.fromArgumentId,
        schemeKey: "", // Provide a valid schemeKey if available
        createdById: p.createdById
      }
    }).catch(()=>{});
  }

  return NextResponse.json({ ok:true, edgeId: edge.id }, { status: 201, ...NO_STORE });
}
