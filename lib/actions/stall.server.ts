import { prisma } from "@/lib/prismaclient";

export async function getStall(id: number) {
  return prisma.stall.findUnique({
    where: { id: BigInt(id) },
    include: {
      items: { select: { id: true, name: true, price_cents: true } },
      owner: { select: { id: true, name: true, image: true } },
    },
  });
}
