import { prisma } from "@/lib/prismaclient";

async function main() {
  const now = new Date();
  await prisma.predictionMarket.updateMany({
    where: { closesAt: { lt: now }, state: "OPEN" },
    data: { state: "CLOSED", closedAt: now },
  });
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
