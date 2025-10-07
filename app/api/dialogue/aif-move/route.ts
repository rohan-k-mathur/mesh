// app/api/dialogue/aif-move/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';
import { assertCreateArgumentLegality } from '@/lib/aif/guards';
import { validateMove } from '@/lib/dialogue/validate';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { type, illocution, replyToMoveId, argument } = body;

  if (type === 'GROUNDS') {
    assertCreateArgumentLegality(argument);
  }

  return await prisma.$transaction(async (tx) => {
    let argId: string | undefined;

    if (type === 'GROUNDS') {
      const a = await tx.argument.create({
        data: {
          deliberationId: argument.deliberationId,
          authorId: argument.authorId,
          conclusionClaimId: argument.conclusionClaimId,
          schemeId: argument.schemeId ?? null,
          implicitWarrant: argument.implicitWarrant ?? null,
          text: argument.text ?? "",
        }
      });
      if (argument.premiseClaimIds?.length) {
        await tx.argumentPremise.createMany({
          data: argument.premiseClaimIds.map((cid: string) => ({ argumentId: a.id, claimId: cid, isImplicit:false })),
          skipDuplicates: true,
        });
      }
      argId = a.id;
    }

    const legal = await validateMove({
      deliberationId: argument.deliberationId,
      actorId: argument.authorId,
      kind: type,
      targetType: 'argument',
      targetId: argId ?? argument.conclusionClaimId, // fall back to claim assertion path
      replyToMoveId,
      payload: {},
    });
    if (!('ok' in legal) || !legal.ok) {
      return NextResponse.json({ ok:false, reasonCodes: legal.reasons }, { status: 409 });
    }

    const move = await tx.dialogueMove.create({
      data: {
        type, illocution,
        replyToMoveId: replyToMoveId ?? null,
        argumentId: argId ?? null,
        deliberationId: argument.deliberationId,
        actorId: argument.authorId,
        signature: `${type}:${argId ?? argument.conclusionClaimId}:${Date.now()}`,
      }
    });

    return NextResponse.json({ ok:true, moveId: move.id, argumentId: argId }, { status: 201 });
  });
}
