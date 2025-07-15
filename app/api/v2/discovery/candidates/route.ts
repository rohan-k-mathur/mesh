import { NextRequest, NextResponse } from "next/server";
import { getUserFromCookies } from "@/lib/serverutils";
import { getOrSet } from "@/lib/redis";
import { knn } from "@/util/postgresVector";
import rateLimit from "next-rate-limit";

const limiter = rateLimit({ limit: 30, interval: 60 * 1000 });
export async function GET(req: NextRequest) {
  const user = await getUserFromCookies();
  if (!user?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const kParam = parseInt(req.nextUrl.searchParams.get("k") || "50", 10);
  const k = Math.min(Math.max(kParam, 1), 100);
  await limiter.checkNext(req, 30);
  const ttl = parseInt(process.env.CANDIDATE_CACHE_TTL || "30", 10);
  const results = await getOrSet(`candCache:${user.userId}:${k}`, ttl, () =>
    knn(String(user.userId), k + 1),
  );
  const filtered = results
    .filter((r) => r.userId !== Number(user.userId))
    .slice(0, k)
    .map((r) => ({ userId: r.userId, score: r.score }));
  return NextResponse.json(filtered);
}
