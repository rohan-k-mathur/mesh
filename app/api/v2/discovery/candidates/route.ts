import { NextRequest, NextResponse } from "next/server";
import { getUserFromCookies } from "@/lib/serverutils";
import { getRedis } from "@/lib/redis";
import { checkNext, check } from "@/lib/limiter";
import { getTwoTowerCandidates } from "@/lib/twoTower";
import { tasteFallbackCandidates } from "@/util/taste";
import { unionWithoutDuplicates } from "@/lib/union";
import { getOrSet } from "@/lib/redis";
import { knn } from "@/util/postgresVector";

export async function GET(req: NextRequest) {
  const user = await getUserFromCookies();

  if(!user){
    return;
  }
  else{

  if (!user?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const kParam = parseInt(req.nextUrl.searchParams.get("k") || "50", 10);
  const k = Math.min(Math.max(kParam, 1), 100);
  await checkNext(req, 30);
  const ttl = parseInt(process.env.CANDIDATE_CACHE_TTL || "30", 10);
  const results = await getOrSet(`candCache:${user.userId}:${k}`, ttl, () =>
    knn(String(user.userId), k + 1),
  );
  const filtered = results
    .filter((r) => r.userId !== Number(user.userId))
    .slice(0, k)
    .map((r) => ({ userId: r.userId, score: r.score }));
  //return NextResponse.json(filtered); 
  const redis = getRedis();
if (redis) {

  await check(req, `cand-${user.userId}`);
  const cacheKey = `candidates:v2:${user.userId}`;
  const cached = await redis.get(cacheKey);
  if (cached) return NextResponse.json(JSON.parse(cached));

  const ttList = await getTwoTowerCandidates(Number(user.userId), 400);
  const tasteList = await tasteFallbackCandidates(String(user.userId), 400);

  const final = unionWithoutDuplicates(ttList, tasteList).slice(0, 400);

  await redis.setex(cacheKey, 30, JSON.stringify(final));
  return NextResponse.json(final);
  }
}
}


