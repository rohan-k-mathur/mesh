// // app/api/arguments/route.ts
// import { NextRequest, NextResponse } from 'next/server';
// import { prisma } from '@/lib/prismaclient';
// import { assertCreateArgumentLegality } from 'packages/aif-core/src/guards';

// export async function POST(req: NextRequest) {
//   const body = await req.json().catch(()=> ({}));
//   assertCreateArgumentLegality(body);

//   const { deliberationId, authorId, conclusionClaimId, premiseClaimIds, schemeId, implicitWarrant, text } = body;

//   const created = await prisma.$transaction(async (tx) => {
//     // Ensure claims exist
//     const [conc, prems] = await Promise.all([
//       tx.claim.findUniqueOrThrow({ where: { id: conclusionClaimId }, select: { id: true } }),
//       tx.claim.findMany({ where: { id: { in: premiseClaimIds } }, select: { id: true } }),
//     ]);
//     if (prems.length !== premiseClaimIds.length) throw new Error("One or more premiseClaimIds not found");

//     const arg = await tx.argument.create({
//       data: {
//         deliberationId, authorId, text: text ?? "",
//         schemeId: schemeId ?? null,
//         conclusionClaimId: conc.id,
//         implicitWarrant: implicitWarrant ?? null,
//       },
//     });
//     await tx.argumentPremise.createMany({
//       data: premiseClaimIds.map((cid: string) => ({ argumentId: arg.id, claimId: cid, isImplicit: false })),
//       skipDuplicates: true
//     });
//     return arg;
//   });

//   return NextResponse.json({ ok: true, argumentId: created.id }, { status: 201 });
// }
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';
// import { getServerSession } from 'next-auth'; // if you use NextAuth
import { getUserFromCookies } from '@/lib/serverutils';
const NO_STORE = { headers: { 'Cache-Control': 'no-store' } } as const;

export async function POST(req: NextRequest) {
  const b = await req.json().catch(()=> ({}));
  let { deliberationId, authorId, conclusionClaimId, premiseClaimIds, schemeId, implicitWarrant, text } = b ?? {};
  const user = await getUserFromCookies();
  if (!user) return null;

  // Allow 'current' or empty → resolve from session
  if (!authorId || authorId === 'current') {
    // const session = await getServerSession(authOptions);
    authorId = user.userId;
  }
    
  if (!deliberationId || !authorId || !conclusionClaimId || !Array.isArray(premiseClaimIds) || premiseClaimIds.length === 0) {
    return NextResponse.json({ ok:false, error:'Invalid payload' }, { status:400, ...NO_STORE });
  }

  const created = await prisma.$transaction(async (tx) => {
    // Optional: assert the claims exist to avoid foreign key errors
    await tx.claim.findUniqueOrThrow({ where: { id: conclusionClaimId }, select: { id:true } });
    const prems = await tx.claim.findMany({ where: { id: { in: premiseClaimIds } }, select: { id: true } });
    if (prems.length !== premiseClaimIds.length) {
      throw new Error('One or more premiseClaimIds not found');
    }

    const a = await tx.argument.create({
      data: { deliberationId, authorId, conclusionClaimId, schemeId: schemeId ?? null, implicitWarrant: implicitWarrant ?? null, text: text ?? '' }
    });
    await tx.argumentPremise.createMany({
      data: premiseClaimIds.map((cid:string) => ({ argumentId: a.id, claimId: cid, isImplicit:false })), skipDuplicates:true
    });
    return a.id;
  });

  return NextResponse.json({ ok:true, argumentId: created }, NO_STORE);
}
