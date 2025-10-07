// app/api/arguments/[id]/attacks/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { assertAttackLegality } from "@/lib/aif/guards";
import type { AttackType, TargetScope } from "@prisma/client";
import { EdgeType } from "@prisma/client";

type Payload = {
  deliberationId: string;
  createdById: string;
  fromArgumentId: string;
  attackType: AttackType;
  targetScope: TargetScope;
  toArgumentId?: string;
  targetClaimId?: string;
  targetPremiseId?: string;
  targetInferenceId?: string;
  cqKey?: string | null;
};

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const toArgumentIdParam = params.id; // convenience path param for "target RA"
    const body = (await req.json()) as Payload;

    // Prefer explicit toArgumentId in body; otherwise use :id
    const payload: Payload = {
      ...body,
      toArgumentId: body.toArgumentId ?? toArgumentIdParam,
    };

    assertAttackLegality(payload);

    const targetArg = await prisma.argument.findUnique({
  where: { id: payload.toArgumentId! },
  include: { premises: true },
});
if (!targetArg || targetArg.deliberationId !== payload.deliberationId) {
  throw new Error("TARGET_NOT_IN_DELIBERATION");
}
if (payload.attackType === "UNDERMINES") {
  const ok = targetArg.premises.some(p => p.claimId === payload.targetPremiseId);
  if (!ok) throw new Error("UNDERMINE_NOT_A_PREMISE");
}

    const created = await prisma.argumentEdge.create({
      data: {
        deliberationId: payload.deliberationId,
        fromArgumentId: payload.fromArgumentId,
        toArgumentId: payload.toArgumentId!, // Add required property
        type: EdgeType.rebut, // Use EdgeType enum value for attacks
        // type: "ATTACK", // Use EdgeType enum value for attacks
        attackType: payload.attackType,
        targetScope: payload.targetScope,
        targetInferenceId: payload.targetInferenceId ?? null,
        targetPremiseId: payload.targetPremiseId ?? null,
        targetClaimId: payload.targetClaimId ?? null,
        cqKey: payload.cqKey ?? null,
        createdById: payload.createdById,
      },
    });

    return NextResponse.json({ ok: true, edge: created }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
  }
}
