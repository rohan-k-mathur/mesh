// // import { prisma } from "@/lib/prismaclient";
// // import { NextResponse } from "next/server";

// // export async function GET() {
// //   const rows = await prisma.stall.findMany({
// //     where: { owner_id: 1n },
// //     select: { id: true, name: true },
// //     orderBy: { updated_at: "desc" },
// //   });
// //   return NextResponse.json(rows);
// // }
// // app/swapmeet/api/my-stalls/route.ts
// import { prisma } from "@/lib/prismaclient";
// import { NextResponse } from "next/server";

// export async function GET() {
//   const rows = await prisma.stall.findMany({
//     // 1.  use BigInt() if you don't bump tsconfig
//     where: { owner_id: BigInt(1) },

//     // 2.  only select fields that exist
//     select: { id: true, name: true },

//     // 3.  order by a real column (created_at or id)
//     orderBy: { created_at: "desc" },
//   });
//   return NextResponse.json(rows);
// }


import { prisma } from "@/lib/prismaclient";
import { NextResponse } from "next/server";
// import { getUserFromCookies } from "@/lib/serverutils"; // ← add later

export async function GET() {
  // const user = getUserFromCookies();        // TODO: real auth
  // const ownerId = BigInt(user?.id ?? 1);    // fallback for dev

  const rows = await prisma.stall.findMany({
    where: { owner_id: BigInt(1) },           // use BigInt(…) not 1n
    select: { id: true, name: true },         // visitors removed
    orderBy: { id: "desc" },                  // id or created_at exist
  });

  return NextResponse.json(rows);
}
