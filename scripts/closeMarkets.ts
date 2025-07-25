import { prisma } from "@/lib/prismaclient";

async function main() {
  const now = new Date();
  const markets = await prisma.predictionMarket.findMany({
    where: {
      closesAt: { lt: now },
      state: "OPEN",
    },
  });
  for (const market of markets) {
    await prisma.predictionMarket.update({
      where: { id: market.id },
      data: { state: "CLOSED" },
    });
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
