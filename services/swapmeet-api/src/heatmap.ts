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
    select: { x: true, y: true, visitors: true },
  });
}

export async function getRandomBusySection() {
  const sections = await prisma.section.findMany({
    where: { visitors: { gt: 0 } },
    orderBy: { visitors: "desc" },
    take: 10,
  });
  if (sections.length === 0) return null;
  const pick = sections[Math.floor(Math.random() * sections.length)];
  return { x: pick.x, y: pick.y };
}
