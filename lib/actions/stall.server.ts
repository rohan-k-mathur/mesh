 import { prisma } from "@/lib/prismaclient";

// export async function getStall(id: number) {
//   return prisma.stall.findUnique({
//     where: { id: BigInt(id) },
//     include: {
//       items: {
//         select: {
//           id: true,
//           name: true,
//           images: true,
//           price_cents: true,
//           stock: true,
//         },
//       },
//       images: {
//         orderBy: { position: "asc" },
//         select: { url: true, position: true },
//       },
//       owner: { select: { id: true, name: true, image: true } },
//             /* ❇️ NEW → make them available to the server page */
//             live:    true,
//             liveSrc: true,
//     },
//   });
// }


// lib/actions/stall.server.ts
export async function getStall(id: number) {
  return prisma.stall.findUnique({
    where: { id: BigInt(id) },
    select: {
      id:     true,
      name:   true,
      images: true,
      items:  true,
      owner:  { select: { id: true } },

      /* ❇️ NEW → make them available to the server page */
      live:    true,
      liveSrc: true,
    },
  });
}
