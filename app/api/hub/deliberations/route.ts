// app/api/hub/deliberations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  const calls = (url.searchParams.get("calls") || "any") as "any" | "open";
  const tags = (url.searchParams.get("tags") || "").split(",").filter(Boolean);

  const where: any = {};
  if (q) {
    where.OR = [
      { id: { contains: q, mode: "insensitive" } },
      { hostId: { contains: q, mode: "insensitive" } },
    ];
  }
  // (future) apply tags filter when deliberation.tags exist

  const rows = await prisma.deliberation.findMany({
    where,
    orderBy: [{ updatedAt: "desc" }],
    take: 40,
    select: { id: true, hostType: true, hostId: true, createdAt: true, updatedAt: true },
  });

  const items = await Promise.all(
    rows.map(async (d) => {
      try {
        const claimIds = await prisma.claim.findMany({
          where: { deliberationId: d.id },
          select: { id: true },
        }).then(xs => xs.map(x => x.id));

        const openCQs = claimIds.length
          ? await prisma.cQStatus.count({
              where: { targetType: "claim", targetId: { in: claimIds }, satisfied: false },
            })
          : 0;

        return {
          id: d.id,
          title: null,
          host: { type: d.hostType, id: d.hostId },
          tags: [],
          call: calls === "open" ? null : null,
          stats: { claims: claimIds.length, openCQs },
          updatedAt: d.updatedAt.toISOString(),
        };
      } catch {
        return {
          id: d.id,
          title: null,
          host: { type: d.hostType, id: d.hostId },
          tags: [],
          call: null,
          stats: { claims: 0, openCQs: 0 },
          updatedAt: d.updatedAt.toISOString(),
        };
      }
    }),
  );

  return NextResponse.json({ items });
}
