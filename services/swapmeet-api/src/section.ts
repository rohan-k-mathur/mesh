export interface StallSummary {
  id: number;
  name: string;
  live: boolean;
}

import { prisma } from "@/lib/prismaclient";

export async function getSection(x: number, y: number): Promise<{ stalls: StallSummary[] }> {
  const section = await prisma.section.findUnique({
    where: { x_y: { x, y } },       // composite unique ([x, y])
    select: {
      stalls: {
        select: {
          id: true,
          name: true,
          // grab the *first* (or newest) image URL
          images: {
            take: 1,
            orderBy: { created_at: "desc" },
            select: { url: true },
          },
        },
      },
    },
  });



  // const section = await prisma.section.findFirst({
  //   where: { x, y },
  //   include: { stalls: { select: { id: true, name: true } } },
  // });

  return {
    stalls:
      section?.stalls.map((s) => ({
        id: Number(s.id),
        name: s.name,
        img: s.images[0]?.url ?? null,  
        live: false,
      })) ?? [],
  };
}

export async function getNearestOpenSection(x: number, y: number): Promise<{ x: number; y: number } | null> {
  const rows = await prisma.$queryRaw<{ x: number; y: number }[]>`
    SELECT s.x, s.y
    FROM section s
    LEFT JOIN stalls st ON st.section_id = s.id
    GROUP BY s.id
    HAVING COUNT(st.id) < 9
    ORDER BY ABS(s.x - ${x}) + ABS(s.y - ${y})
    LIMIT 1
  `;
  return rows[0] ?? null;
}
