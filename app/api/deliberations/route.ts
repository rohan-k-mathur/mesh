import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { getUserFromCookies } from "@/lib/serverutils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getUserFromCookies();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const url = new URL(req.url);
  const mine = url.searchParams.get("mine") === "1";
  const page = Math.max(parseInt(url.searchParams.get("page") || "1", 10), 1);
  const pageSize = Math.min(Math.max(parseInt(url.searchParams.get("pageSize") || "15", 10), 1), 100);
  const q = (url.searchParams.get("q") || "").trim();
  const host = (url.searchParams.get("host") || "").trim();
  const [field, dir] = (url.searchParams.get("sort") || "updatedAt:desc").split(":") as [string, "asc"|"desc"];

  const where: any = {};
  if (mine) where.createdById = String(user.userId);
  if (q) where.OR = [{ id: { contains: q } }, { hostId: { contains: q } }];
  if (host) where.hostType = host;

  const [total, rows] = await Promise.all([
    prisma.deliberation.count({ where }),
    prisma.deliberation.findMany({
      where,
      orderBy: [{ [field || "updatedAt"]: dir === "asc" ? "asc" : "desc" }, { id: "asc" }],
      take: pageSize,
      skip: (page - 1) * pageSize,
      select: { id: true, hostType: true, hostId: true, createdAt: true, updatedAt: true },
    }),
  ]);

  const items = rows.map(r => ({
    id: r.id,
    hostType: r.hostType,
    hostId: r.hostId,
    title: null as string | null, // fill if you store one
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    tags: [] as string[],        // fill when you add tags
  }));

  return NextResponse.json({ items, total, page, pageSize });
}
