import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  const calls = (url.searchParams.get("calls") || "any") as "any" | "open";
  const tagsParam = (url.searchParams.get("tags") || "").split(",").filter(Boolean);

  const where: any = {};
  // If you later add tags to Deliberation, plug filter here.
  if (q) {
    where.OR = [
      { id: { contains: q, mode: "insensitive" } },
      { hostId: { contains: q, mode: "insensitive" } },
    ];
  }

  const rows = await prisma.deliberation.findMany({
    where,
    orderBy: [{ updatedAt: "desc" }],
    take: 40,
    select: { id: true, hostType: true, hostId: true, createdAt: true, updatedAt: true },
  });

  // per-deliberation stats
  const items = await Promise.all(rows.map(async (d) => {
    const [claims, openCQs] = await Promise.all([
      prisma.claim.count({ where: { deliberationId: d.id } }),
      prisma.cQStatus.count({ where: { targetType: "claim", satisfied: false } }),
    ]).catch(() => [0, 0] as const);

    // placeholder "call" and "tags" until you add those fields
    const call = calls === "open" ? null : null;
    const tags: string[] = [];

    return {
      id: d.id,
      title: null,
      host: { type: d.hostType, id: d.hostId },
      tags,
      call,
      stats: { claims, openCQs },
      updatedAt: d.updatedAt.toISOString(),
    };
  }));

  return NextResponse.json({ items });
}
