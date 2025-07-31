import { prisma } from "@/lib/prismaclient";

export async function getStall(id: number) {
  return prisma.stall.findUnique({
    where: { id: BigInt(id) },
    include: {
      items: { select: { id: true,
        name: true,
        images: true,          // ← this line was missing
        price_cents: true,
        stock: true,
} },
      owner: { select: { id: true, name: true, image: true } },
    },
  });
}
