import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import redisClient from "@/lib/redis";
import { getUserFromCookies } from "@/lib/serverutils";

const schema = z.object({
  itemId: z.string().uuid(),
  signal: z.enum([1, -1]),
  ts: z.number().int(),
});

const redisRest = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const ratelimit = new Ratelimit({
  redis: redisRest,
  limiter: Ratelimit.tokenBucket(100, "60 s"),
});

export async function POST(req: NextRequest) {
  const user = await getUserFromCookies();
  if (!user?.userId) return new NextResponse("Unauthorized", { status: 401 });
  const body = await req.json();
  const parse = schema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: "Invalid" }, { status: 422 });
  }
  const { success } = await ratelimit.limit(user.userId.toString());
  if (!success) return new NextResponse("Too Many", { status: 429 });
  const redisId = await redisClient.xadd(
    "discovery_feedback",
    "*",
    "viewerId",
    user.userId.toString(),
    "itemId",
    body.itemId,
    "signal",
    body.signal.toString(),
    "ts",
    body.ts.toString(),
  );
  return NextResponse.json({ ok: true, queuedId: redisId });
}
