export interface StallSummary {
  id: number;
  name: string;
  live: boolean;
}

import { prisma } from "@/lib/prismaclient";

export async function getSection(x: number, y: number): Promise<{ stalls: StallSummary[] }> {
  const section = await prisma.section.findFirst({
    where: { x, y },
    include: { stalls: { select: { id: true, name: true } } },
  });

  return {
    stalls:
      section?.stalls.map((s) => ({
        id: Number(s.id),
        name: s.name,
        live: false,
      })) ?? [],
  };
}
