import { prisma } from "@/lib/prismaclient";

async function updateCounts() {
  await prisma.$executeRaw`UPDATE section SET "liveCount" = 0, "auctionCount" = 0`;
  await prisma.$executeRaw`
    UPDATE section s
    SET "liveCount" = src.cnt
    FROM (
      SELECT section_id, COUNT(*)::int AS cnt
      FROM stalls
      WHERE live = true
      GROUP BY section_id
    ) src
    WHERE s.id = src.section_id
  `;
  await prisma.$executeRaw`
    UPDATE section s
    SET "auctionCount" = src.cnt
    FROM (
      SELECT st.section_id, COUNT(*)::int AS cnt
      FROM auctions a
      JOIN stalls st ON st.id = a.stall_id
      WHERE a.state = 'LIVE' AND a.ends_at > NOW()
      GROUP BY st.section_id
    ) src
    WHERE s.id = src.section_id
  `;
}

setInterval(() => {
  updateCounts().catch((e) => console.error("[sectionHeat]", e));
}, 30_000);

updateCounts().catch((e) => console.error("[sectionHeat]", e));
