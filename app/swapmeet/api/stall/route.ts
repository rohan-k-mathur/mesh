import { prisma } from "@/lib/prismaclient";
import { NextResponse } from "next/server";
import { getUserFromCookies } from "@/lib/serverutils";



export async function POST(req: Request) {
  const body = (await req.json()) as { name?: string; sectionId?: unknown };
  const name = body.name?.trim();
  const sectionId = Number(body.sectionId);          // coerce to number

  /* 2 ▸ validate */
  if (!name || Number.isNaN(sectionId) || sectionId <= 0) {
    return NextResponse.json({ message: "Bad request" }, { status: 400 });
  }

    /* 3 ▸ auth  */
    const user = await getUserFromCookies();          // adjust if sync
    const ownerId = BigInt(user?.userId ?? 1);            // dev fallback

    // /* 4 ▸ fetch current user id */
    // const user = getUserFromCookies();                 // returns { id: bigint | number, … }
    // const ownerId = typeof user === "object" ? user.id : 1n;  // fallback for now

    
      /* 5 ▸ verify section exists --------------------------------------------- */
  const section = await prisma.section.findUnique({
    where: { id: BigInt(sectionId) },
    select: { id: true },
  });
  if (!section) {
    return NextResponse.json({ message: "Invalid section" }, { status: 400 });
  }

  

  /* 6 ▸ create the stall  -------------------------------------------------- */
  const stall = await prisma.stall.create({
    data: {
      name,
      section_id: section.id,
      owner_id: BigInt(ownerId),        // Prisma field expects bigint | number
    },
    select: { id: true },
  });

  return NextResponse.json({ id: Number(stall.id) });
 }
//   // const { name, sectionId } = await req.json();

//   // if (!name || !sectionId) {
//   //   return NextResponse.json({ message: "Missing fields" }, { status: 400 });
//   // }
//   const user = getUserFromCookies();
//   const sectionId = Number(body.sectionId);
// if (!name || Number.isNaN(sectionId) || sectionId <= 0) {
//   return NextResponse.json({ message: "Bad request" }, { status: 400 });
// }

//   const section = await prisma.section.findUnique({
//     where: { id: BigInt(sectionId) },
//     select: { id: true },
//   });

//   if (!section) {
//     return NextResponse.json({ message: "Invalid section" }, { status: 400 });
//   }

//   const stall = await prisma.stall.create({
//     data: {
//       name,
//       section_id: section.id,
//       owner_id: user, // TODO: replace with auth
//     },
//   });

//   return NextResponse.json({ id: Number(stall.id) });
// }

