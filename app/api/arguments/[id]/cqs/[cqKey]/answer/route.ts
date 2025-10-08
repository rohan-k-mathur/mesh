// app/api/arguments/[id]/cqs/[cqKey]/answer/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { assertCreateArgumentLegality, assertAttackLegality } from "packages/aif-core/src/guards";

export async function POST(req: Request, { params }: { params: { id: string; cqKey: string } }) {
  try {
    const body = await req.json();
    const { authorId, deliberationId, replyToMoveId, attackerArgument, targetPremiseId } = body;

    const arg = await prisma.argument.findUnique({
      where: { id: params.id },
      include: { scheme: { include: { cqs: true } }, conclusion: true, premises: true },
    });
    if (!arg?.scheme) return NextResponse.json({ ok:false, error:"Argument or scheme not found" }, { status: 404 });

    const cq = arg.scheme.cqs.find((q) => q.cqKey === params.cqKey);
    if (!cq) return NextResponse.json({ ok:false, error:"CQ not found on scheme" }, { status: 404 });

    const result = await prisma.$transaction(async (tx) => {
      const status = await tx.cQStatus.upsert({
        where: { argumentId_cqKey: { argumentId: arg.id, cqKey: cq.cqKey! } },
        update: { status: "answered" },
        create: { argumentId: arg.id, cqKey: cq.cqKey!, status: "answered" },
      });

      const grounds = authorId && deliberationId
        ? await tx.dialogueMove.create({
            data: {
              deliberationId, authorId,
              type: "GROUNDS", illocution: "Argue" as any,
              replyToMoveId: replyToMoveId ?? null,
              kind: "GROUNDS", actorId: authorId,
              targetType: "argument", targetId: arg.id,
              signature: ["GROUNDS", arg.id, cq.cqKey, Date.now()].join(":"),
              argumentId: null
            },
          })
        : null;

      let attacker: any = null;
      let edge: any = null;

      if (attackerArgument) {
        const payload = {
          deliberationId, authorId,
          conclusionClaimId: attackerArgument.conclusionClaimId,
          premiseClaimIds: attackerArgument.premiseClaimIds ?? [],
          schemeId: attackerArgument.schemeId ?? null,
          implicitWarrant: attackerArgument.implicitWarrant ?? null,
          text: attackerArgument.text ?? ""
        };
        assertCreateArgumentLegality(payload as any);

        attacker = await tx.argument.create({
          data: {
            deliberationId, authorId, text: payload.text,
            schemeId: payload.schemeId,
            conclusionClaimId: payload.conclusionClaimId,
            implicitWarrant: payload.implicitWarrant,
          },
        });
        if (payload.premiseClaimIds.length) {
          await tx.argumentPremise.createMany({
            data: payload.premiseClaimIds.map((cid: string) => ({
              argumentId: attacker.id, claimId: cid, isImplicit: false,
            })),
            skipDuplicates: true,
          });
        }

        const ap = {
          deliberationId,
          createdById: authorId,
          fromArgumentId: attacker.id,
          attackType: cq.attackType,
          targetScope: cq.targetScope,
          toArgumentId: arg.id,
          cqKey: cq.cqKey!,
          targetClaimId: cq.attackType === "REBUTS" ? arg.conclusionClaimId : undefined,
          targetPremiseId: cq.attackType === "UNDERMINES" ? (targetPremiseId ?? arg.premises[0]?.claimId) : undefined,
        } as const;

        // undermines must hit a real premise
        if (ap.attackType === "UNDERMINES") {
          const premIds = new Set(arg.premises.map(p => p.claimId));
          if (!ap.targetPremiseId || !premIds.has(ap.targetPremiseId)) {
            throw new Error("UNDERMINES must target an existing premise of the argument");
          }
        }
        assertAttackLegality(ap as any);

        edge = await tx.argumentEdge.create({
          data: {
            deliberationId, fromArgumentId: attacker.id, toArgumentId: arg.id,
            attackType: ap.attackType, targetScope: ap.targetScope,
            targetClaimId: ap.targetClaimId ?? null, targetPremiseId: ap.targetPremiseId ?? null,
            cqKey: ap.cqKey, createdById: authorId,
          },
        });

        if (grounds) await tx.dialogueMove.update({ where: { id: grounds.id }, data: { argumentId: attacker.id } });
      }

      return { status, grounds, attacker, edge };
    });

    return NextResponse.json({ ok:true, ...result }, { status: 201 });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e.message }, { status: 400 });
  }
}
