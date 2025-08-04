import { prisma } from "@/lib/prismaclient";

export async function getHeatmap(
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
) {
  return prisma.section.findMany({
    where: {
      x: { gte: xMin, lte: xMax },
      y: { gte: yMin, lte: yMax },
    },
    select: {
      x: true,
      y: true,
      visitors: true,
      liveCount: true,
      auctionCount: true,
    },
  });
}

export async function getRandomBusySection() {
  const res = await prisma.$queryRawUnsafe<{ x: number; y: number }[]>(
    "SELECT x,y FROM section ORDER BY visitors DESC LIMIT 20 OFFSET floor(random()*20)"
  );
  if (!res.length) return null;
  const pick = res[Math.floor(Math.random() * res.length)];
  return { x: pick.x, y: pick.y };
}
