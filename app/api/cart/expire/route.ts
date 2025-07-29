import { prisma } from "@/lib/prismaclient";

export async function POST() {
  const expired = await prisma.cart.deleteMany({
    where: {
      deadline: { lt: new Date() },
      escrow: { none: {} },
    },
  });
  return Response.json(expired);
}
