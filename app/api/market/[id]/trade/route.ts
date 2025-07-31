import { NextRequest, NextResponse } from "next/server";
import { placeTrade } from "@/packages/server/src/prediction/service";
import { getUserFromCookies } from "@/lib/serverutils";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { z } from "zod";

const redisRest = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});
const ratelimit = new Ratelimit({
  redis: redisRest,
  limiter: Ratelimit.fixedWindow(10, "1 m"),
});

const schema = z.object({
  spendCents: z.number().int().positive(),
  side: z.enum(["YES", "NO"]),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await getUserFromCookies();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { success } = await ratelimit.limit(user.userId.toString());
  if (!success) return new NextResponse("Too Many", { status: 429 });
  const { spendCents, side } = parsed.data;
  const result = await placeTrade({
    marketId: params.id,
    userId: user.userId!,
    spendCents,
    side,
  });
  return NextResponse.json(result);
}
