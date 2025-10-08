// app/api/arguments/[id]/attacks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prismaclient';
import { assertAttackLegality } from 'packages/aif-core/src/guards';

const Body = z.object({
  deliberationId: z.string(),
  createdById: z.string(),
  fromArgumentId: z.string(),
  attackType: z.enum(['REBUTS','UNDERCUTS','UNDERMINES']),
  targetScope: z.enum(['conclusion','inference','premise']),
  toArgumentId: z.string().optional(),      // for undercuts
  targetClaimId: z.string().optional(),     // for rebuts
  targetPremiseId: z.string().optional(),   // for undermines
  cqKey: z.string().optional().nullable()
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const parsed = Body.safeParse(await req.json().catch(()=>null));
  if (!parsed.success) return NextResponse.json({ ok:false, error: parsed.error.flatten() }, { status:400 });
  const p = parsed.data;
  // ensure target id consistency with path param
  const targetArgumentId = params.id;

  try {
    assertAttackLegality({ ...p, toArgumentId: p.toArgumentId ?? targetArgumentId });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e.message }, { status: 400 });
  }

  const edge = await prisma.argumentEdge.create({
    data: {
      deliberationId: p.deliberationId,
      fromArgumentId: p.fromArgumentId,
      toArgumentId: p.toArgumentId ?? targetArgumentId,
      attackType: p.attackType,
      targetScope: p.targetScope,
      targetClaimId: p.targetClaimId ?? null,
      targetPremiseId: p.targetPremiseId ?? null,
      cqKey: p.cqKey ?? null,
      createdById: p.createdById,
    }
  });

  return NextResponse.json({ ok:true, edgeId: edge.id }, { status: 201 });
}
