// import { getStall } from "@/lib/actions/stall.server";
// import { NextResponse } from "next/server";
// import { jsonSafe } from "@/lib/bigintjson";
// import { prisma } from "@/lib/prismaclient";
// export async function GET(
//   _req: Request,
//   { params }: { params: { id: string } },
// ) {
//   const stall = await prisma.stall.findUnique({
//     where: { id: BigInt(params.id) },
//     select: {
//       id:   true,
//       name: true,
//       owner: { select: { id: true } },
//       images: true,
//       // ❇️ make sure to expose the new fields
//       live: true,
//       liveSrc: true,
//     },
//   });

//   return NextResponse.json(stall);
// }// app/swapmeet/api/stall/[id]/route.ts

import { prisma } from "@/lib/prismaclient";
import { NextResponse, NextRequest } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  /** raw record --------------------------------------------------------- */
  const stall = await prisma.stall.findUnique({
    where: { id: BigInt(params.id) },
    select: {
      id:      true,                // BigInt  ❌
      name:    true,
      images:  true,
      owner:   { select: { id: true } }, // BigInt ❌
      live:    true,
      liveSrc: true,
    },
  });

  if (!stall) return NextResponse.json({ error: "not found" }, { status: 404 });

  /** cast BigInt → number ---------------------------------------------- */
  const safe = {
    ...stall,
    id: Number(stall.id),
    owner: stall.owner ? { id: Number(stall.owner.id) } : null,
  };

  return NextResponse.json(safe);   // ✅ serialises fine
}