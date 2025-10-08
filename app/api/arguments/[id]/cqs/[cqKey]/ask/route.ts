// // app/api/arguments/[id]/cqs/[cqKey]/ask/route.ts
// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prismaclient";

// export async function POST(req: Request, { params }: { params: { id: string; cqKey: string } }) {
//   const body = await req.json().catch(()=> ({}));
//   const { authorId, deliberationId, replyToMoveId } = body ?? {};

//   const arg = await prisma.argument.findUnique({
//     where: { id: params.id },
//     include: { scheme: { include: { cqs: true } } },
//   });
//   if (!arg?.scheme) return NextResponse.json({ ok:false, error:"Argument or scheme not found" }, { status: 404 });

//   const cq = arg.scheme.cqs.find(q => q.cqKey === params.cqKey);
//   if (!cq) return NextResponse.json({ ok:false, error:"CQ not found on scheme" }, { status: 404 });

//   const [status, move] = await prisma.$transaction([
//     prisma.cQStatus.upsert({
//       where: { argumentId_cqKey: { argumentId: arg.id, cqKey: cq.cqKey! } },
//       update: { status: "open" },
//       create: { argumentId: arg.id, cqKey: cq.cqKey!, status: "open" },
//     }),
//     authorId && deliberationId
//       ? prisma.dialogueMove.create({
//           data: {
//             authorId, deliberationId,
//             type: "WHY",
//             illocution: "Question" as any,
//             replyToMoveId: replyToMoveId ?? null,
//             kind: "WHY",
//             actorId: authorId,
//             targetType: "argument",
//             targetId: arg.id,
//             signature: ["WHY", arg.id, cq.cqKey, Date.now()].join(":")
//           },
//         })
//       : (null as any),
//   ]);

//   return NextResponse.json({ ok:true, cq:{ cqKey: cq.cqKey, status: status.status }, whyMove: move ?? null }, { status: 201 });
// }
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';

export async function POST(req: Request, { params }: { params: { id: string; cqKey: string } }) {
  const body = await req.json().catch(()=> ({}));
  const { authorId, deliberationId } = body ?? {};
  const arg = await prisma.argument.findUnique({ where: { id: params.id }, include: { scheme:true } });
  if (!arg || !arg.scheme) return NextResponse.json({ ok:false, error:'Argument/scheme not found' }, { status:404 });

  const existing = await prisma.cQStatus.findFirst({ where: { argumentId: arg.id, cqKey: params.cqKey } });
  if (existing) {
    await prisma.cQStatus.update({ where: { id: existing.id }, data: { status: 'open' } });
  } else {
    await prisma.cQStatus.create({ data: { argumentId: arg.id, cqKey: params.cqKey, status:'open' } });
  }

  if (authorId && deliberationId) {
    await prisma.dialogueMove.create({
      data: {
        deliberationId, authorId, type:'WHY', illocution:'Question' as any,
        replyToMoveId: null, argumentId: null,
        kind:'WHY', actorId: authorId, targetType:'argument', targetId: arg.id,
        signature: ['WHY','argument',arg.id, params.cqKey].join(':'), payload: { cqId: params.cqKey }
      } as any
    }).catch(()=>void 0);
  }

  return NextResponse.json({ ok:true }, { headers:{'Cache-Control':'no-store'} });
}
