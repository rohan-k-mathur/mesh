// app/api/arguments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';
import { assertCreateArgumentLegality } from 'packages/aif-core/src/guards';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(()=> ({}));
  assertCreateArgumentLegality(body);

  const { deliberationId, authorId, conclusionClaimId, premiseClaimIds, schemeId, implicitWarrant, text } = body;

  const created = await prisma.$transaction(async (tx) => {
    // Ensure claims exist
    const [conc, prems] = await Promise.all([
      tx.claim.findUniqueOrThrow({ where: { id: conclusionClaimId }, select: { id: true } }),
      tx.claim.findMany({ where: { id: { in: premiseClaimIds } }, select: { id: true } }),
    ]);
    if (prems.length !== premiseClaimIds.length) throw new Error("One or more premiseClaimIds not found");

    const arg = await tx.argument.create({
      data: {
        deliberationId, authorId, text: text ?? "",
        schemeId: schemeId ?? null,
        conclusionClaimId: conc.id,
        implicitWarrant: implicitWarrant ?? null,
      },
    });
    await tx.argumentPremise.createMany({
      data: premiseClaimIds.map((cid: string) => ({ argumentId: arg.id, claimId: cid, isImplicit: false })),
      skipDuplicates: true
    });
    return arg;
  });

  return NextResponse.json({ ok: true, argumentId: created.id }, { status: 201 });
}
