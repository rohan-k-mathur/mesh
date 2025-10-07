// app/api/arguments/[id]/cqs/[cqKey]/ask/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";

const sig = (d: string, t: string, id: string, k: string) => `WHY:${d}:${t}:${id}:${k}`;

export async function POST(req: Request, { params }: { params: { id: string; cqKey: string } }) {
  const { authorId, deliberationId, replyToMoveId } = await req.json().catch(() => ({}));

  const arg = await prisma.argument.findUnique({
    where: { id: params.id },
    include: { scheme: { include: { cqs: true } } },
  });
  if (!arg?.scheme) return NextResponse.json({ ok:false, error:"Argument or scheme not found" }, { status: 404 });

  const cq = arg.scheme.cqs.find(q => q.cqKey === params.cqKey);
  if (!cq) return NextResponse.json({ ok:false, error:"CQ not found on scheme" }, { status: 404 });

  const [status, move] = await prisma.$transaction([
    prisma.cQStatus.upsert({
      where: { CQStatus_argumentId_cqKey: { argumentId: arg.id, cqKey: cq.cqKey } },
      update: { status: "open" },
      create: { argumentId: arg.id, cqKey: cq.cqKey, status: "open" },
    }),
    authorId && deliberationId
      ? prisma.dialogueMove.create({
          data: {
            deliberationId,
            kind: "WHY",
            illocution: "Question",
            targetType: "argument",
            targetId: arg.id,
            actorId: authorId,
            signature: sig(deliberationId, "argument", arg.id, cq.cqKey),
            replyToMoveId: replyToMoveId ?? null,
            payload: { cqId: cq.cqKey }
          },
        })
      : (null as any),
  ]);

  return NextResponse.json({ ok:true, cq:{ cqKey: cq.cqKey, status: status.status }, whyMove: move ?? null }, { status: 201 });
}
