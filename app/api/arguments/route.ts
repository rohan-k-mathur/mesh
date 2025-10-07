// // app/api/arguments/route.ts
// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prismaclient"; // adjust to your prisma singleton
// import { assertCreateArgumentLegality } from "@/lib/aif/guards";

// export async function POST(req: Request) {
//   try {
//     const body = await req.json();
//     const {
//       deliberationId,
//       authorId,
//       conclusionClaimId,
//       premiseClaimIds,
//       schemeId,
//       implicitWarrant,
//     } = body;

//     assertCreateArgumentLegality({
//       deliberationId,
//       authorId,
//       conclusionClaimId,
//       premiseClaimIds,
//       schemeId,
//       implicitWarrant,
//     });

//     const result = await prisma.$transaction(async (tx) => {
//       // Ensure all claims exist (IDs expected; extend to allow {text} creation if you want)
//       const conclusion = await tx.claim.findFirstOrThrow({
//         where: { id: conclusionClaimId },
//         select: { id: true },
//       });
//       const premises = await tx.claim.findMany({
//         where: { id: { in: premiseClaimIds } },
//         select: { id: true },
//       });
//       if (premises.length !== premiseClaimIds.length) {
//         throw new Error("One or more premiseClaimIds not found");
//       }

//       const argument = await tx.argument.create({
//         data: {
//           deliberationId,
//           authorId,
//           text: "", // optional narrative text; fill if you have it
//           schemeId: schemeId ?? null,
//           conclusionClaimId: conclusion.id,
//           implicitWarrant: implicitWarrant ?? null,
//         },
//       });

//       await tx.argumentPremise.createMany({
//         data: premiseClaimIds.map((cid: string) => ({
//           argumentId: argument.id,
//           claimId: cid,
//           isImplicit: false,
//         })),
//         skipDuplicates: true,
//       });

//       return tx.argument.findUniqueOrThrow({
//         where: { id: argument.id },
//         include: {
//           premises: { include: { claim: true } },
//           conclusion: true,
//         },
//       });
//     });

//     return NextResponse.json({ ok: true, argument: result }, { status: 201 });
//   } catch (e: any) {
//     return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
//   }
// }
// app/api/arguments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';
import { assertCreateArgumentLegality } from '@/lib/aif/guards';

export async function POST(req: NextRequest) {
  const body = await req.json();
  assertCreateArgumentLegality(body);

  const { conclusionClaimId, premiseClaimIds, schemeId, implicitWarrant } = body;

  const created = await prisma.$transaction(async (tx) => {
    const arg = await tx.argument.create({
      data: {
        conclusionClaimId,
        schemeId,
        implicitWarrant,
        deliberationId: body.deliberationId,
        authorId: body.authorId,
        text: body.text ?? "",
      },
    });
    await tx.argumentPremise.createMany({
      data: premiseClaimIds.map((cid: string) => ({ argumentId: arg.id, claimId: cid }))
    });
    return arg;
  });

  return NextResponse.json({ argumentId: created.id }, { status: 201 });
}
