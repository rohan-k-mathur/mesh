// app/api/arguments/[id]/cqs/[cqKey]/answer/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { assertCreateArgumentLegality, assertAttackLegality } from "@/lib/aif/guards";

const sig = (d:string,t:string,id:string,k:string,x?:string)=>`GROUNDS:${d}:${t}:${id}:${k}:${x??""}`;

export async function POST(req: Request, { params }: { params: { id: string; cqKey: string } }) {
  try {
    const body = await req.json();
    const { authorId, deliberationId, replyToMoveId, attackerArgument, targetPremiseId } = body;

    const arg = await prisma.argument.findUnique({
      where: { id: params.id },
      include: { scheme: { include: { cqs: true } }, conclusion: true, premises: true },
    });
    if (!arg?.scheme) return NextResponse.json({ ok:false, error:"Argument or scheme not found" }, { status: 404 });

    const cq = arg.scheme.cqs.find(q => q.cqKey === params.cqKey);
    if (!cq) return NextResponse.json({ ok:false, error:"CQ not found on scheme" }, { status: 404 });

    const result = await prisma.$transaction(async (tx) => {
      // 1) mark answered
      const status = await tx.cQStatus.upsert({
        where: { CQStatus_argumentId_cqKey: { argumentId: arg.id, cqKey: cq.cqKey } },
        update: { status: "answered" },
        create: { argumentId: arg.id, cqKey: cq.cqKey, status: "answered" },
      });

      // 2) optional: create L-move (GROUNDS)
      const move = authorId && deliberationId
        ? await tx.dialogueMove.create({
            data: {
              deliberationId,
              kind: "GROUNDS",
              illocution: "Argue",
              targetType: "argument",
              targetId: arg.id,
              actorId: authorId,
              signature: sig(deliberationId, "argument", arg.id, cq.cqKey, String(Date.now())),
              replyToMoveId: replyToMoveId ?? null,
              payload: { cqId: cq.cqKey }
            },
          })
        : null;

      // 3) optional: create defeating RA + CA (typed by CQ)
      let attacker: any = null;
      let edge: any = null;

      if (attackerArgument) {
        const a = {
          deliberationId, authorId,
          conclusionClaimId: attackerArgument.conclusionClaimId,
          premiseClaimIds: attackerArgument.premiseClaimIds ?? [],
          schemeId: attackerArgument.schemeId ?? null,
          implicitWarrant: attackerArgument.implicitWarrant ?? null,
        };
        assertCreateArgumentLegality(a);

        attacker = await tx.argument.create({
          data: {
            deliberationId: a.deliberationId,
            authorId: a.authorId,
            text: "",
            schemeId: a.schemeId,
            conclusionClaimId: a.conclusionClaimId,
            implicitWarrant: a.implicitWarrant,
          },
        });
        if (a.premiseClaimIds.length) {
          await tx.argumentPremise.createMany({
            data: a.premiseClaimIds.map((cid: string) => ({ argumentId: attacker.id, claimId: cid, isImplicit: false })),
            skipDuplicates: true,
          });
        }

        const payload = {
          deliberationId, createdById: authorId, fromArgumentId: attacker.id,
          attackType: cq.attackType, targetScope: cq.targetScope,
          toArgumentId: arg.id, cqKey: cq.cqKey,
          targetClaimId: cq.attackType === "REBUTS" ? arg.conclusionClaimId : undefined,
          targetPremiseId: cq.attackType === "UNDERMINES"
            ? (targetPremiseId ?? arg.premises[0]?.claimId)
            : undefined,
        };
        assertAttackLegality(payload as any);

        edge = await tx.argumentEdge.create({
          data: {
            deliberationId,
            fromArgumentId: attacker.id,
            toArgumentId: arg.id,
            attackType: payload.attackType!,
            targetScope: payload.targetScope!,
            targetClaimId: payload.targetClaimId ?? null,
            targetPremiseId: payload.targetPremiseId ?? null,
            cqKey: payload.cqKey ?? null,
            createdById: authorId,
          },
        });

        if (move) await tx.dialogueMove.update({ where: { id: move.id }, data: { argumentId: attacker.id } });
      }

      return { status, move, attacker, edge };
    });

    return NextResponse.json({ ok:true, ...result }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ ok:false, error: e.message }, { status: 400 });
  }
}
