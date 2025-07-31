"use server";

import { prisma } from "@/lib/prismaclient";

export async function spawnSection() {
  const sections = await prisma.$queryRaw<{ x: number; y: number }[]>
    `SELECT x, y FROM section
     ORDER BY visitors DESC,
       (SELECT count(*) FROM stall s WHERE s.section_id = section.id) DESC
     LIMIT 10`
  ;
  if (!sections.length) {
    return { x: 0, y: 0 };
  }
  return sections[Math.floor(Math.random() * sections.length)];
}
