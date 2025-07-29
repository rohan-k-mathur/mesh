import { prisma } from "@/lib/prismaclient";

export async function getStall(id: number) {
  return prisma.stall.findUnique({
    where: { id: BigInt(id) },
    include: {
      items: true,
      owner: { select: { name: true, avatar: true } },
    },
  });
}
