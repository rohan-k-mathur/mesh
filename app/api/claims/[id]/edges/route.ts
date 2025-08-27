// import { NextResponse } from 'next/server';
// import { z } from 'zod';
// import { prisma } from '@/lib/prismaclient';

// const EdgeSchema = z.object({
//   toClaimId: z.string(),
//   type: z.enum(['supports', 'rebuts']),
//   deliberationId: z.string().optional(),
// });

// function getUserId(req: Request) {
//   return (req.headers.get('x-user-id') ?? 'system').toString();
// }

// export async function POST(req: Request, { params }: { params: { id: string } }) {
//   try {
//     const body = await req.json();
//     const input = EdgeSchema.parse(body);

//     // Ensure both claims exist
//     const [from, to] = await Promise.all([
//       prisma.claim.findUnique({ where: { id: params.id } }),
//       prisma.claim.findUnique({ where: { id: input.toClaimId } }),
//     ]);
//     if (!from || !to) return NextResponse.json({ error: 'Claim not found' }, { status: 404 });

//     const edge = await prisma.claimEdge.create({
//       data: {
//         fromClaimId: from.id,
//         toClaimId: to.id,
//         type: input.type,
//         deliberationId: input.deliberationId ?? from.deliberationId ?? to.deliberationId ?? undefined,
//         createdById: getUserId(req),
//       },
//     });

//     return NextResponse.json({ edge });
//   } catch (err: any) {
//     return NextResponse.json({ error: err?.message ?? 'Invalid request' }, { status: 400 });
//   }
// }

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const fromId = params.id;
  const { toClaimId, type } = await req.json();
  if (!toClaimId || !["supports", "rebuts"].includes(type)) {
    return NextResponse.json(
      { error: "toClaimId + type required" },
      { status: 400 }
    );
  }
  // prevent self-loop
  if (toClaimId === fromId) {
    return NextResponse.json(
      { error: "cannot link a claim to itself" },
      { status: 400 }
    );
  }

  const edge = await prisma.claimEdge.create({
    data: { fromClaimId: fromId, toClaimId, type },
  });
  return NextResponse.json({ edge });
}
