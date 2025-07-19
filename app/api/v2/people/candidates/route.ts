import { NextRequest, NextResponse } from "next/server";
import { getUserFromCookies } from "@/lib/serverutils";
import { prisma } from "@/lib/prismaclient";
import redis from "@/lib/redis";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const user = await getUserFromCookies();
  if (!user?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const k = Math.min(Number(req.nextUrl.searchParams.get("k") ?? "50"), 200);
  const uid = Number(user.userId);

  let ids: number[];
  const cached = await redis.get(`friendSuggest:${uid}`);
  if (cached) ids = JSON.parse(cached) as number[];
  else {
    const r = await prisma.userSimilarityKnn.findMany({
      where: { user_id: uid },
      orderBy: { sim: "desc" },
      take: k,
      select: { neighbour_id: true },
    });
    ids = r.map((x) => Number(x.neighbour_id));
  }

  const profiles = await prisma.user.findMany({
    where: { id: { in: ids.slice(0, k) } },
    select: { id: true, username: true, name: true, image: true },
  });

  return NextResponse.json(profiles);
}
