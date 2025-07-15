import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import redis from "@/lib/redis";
import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";

const execFileAsync = promisify(execFile);
const explainMap = JSON.parse(
  fs.readFileSync("config/explain_map.json", "utf8")
);

const redisRest = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});
const ratelimit = new Ratelimit({
  redis: redisRest,
  limiter: Ratelimit.tokenBucket(60, "60 s"),
});

function localize(feature: string, lang: "en" | "es") {
  const entry = (explainMap as any)[feature];
  if (!entry) return lang === "en" ? "Personalized for you" : "Personalizado para ti";
  return entry[lang] || (lang === "en" ? "Personalized for you" : "Personalizado para ti");
}

export async function GET(
  req: NextRequest,
  { params }: { params: { targetId: string } }
) {
  const viewerId = req.nextUrl.searchParams.get("viewerId");
  if (!viewerId) return NextResponse.json({ error: "viewerId required" }, { status: 400 });
  const { success } = await ratelimit.limit(viewerId);
  if (!success) return new NextResponse("Too Many", { status: 429 });

  const cacheKey = `why:${viewerId}:${params.targetId}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    return NextResponse.json(JSON.parse(cached as string));
  }

  try {
    const { stdout } = await execFileAsync("python3", [
      "services/explainer/explain.py",
      viewerId,
      params.targetId,
    ]);
    const shap = JSON.parse(stdout.trim());
    const features = Object.keys(shap).sort(
      (a, b) => Math.abs(shap[b]) - Math.abs(shap[a])
    ).slice(0, 2);
    const reason_en = features.map((f) => localize(f, "en")).join(" ");
    const reason_es = features.map((f) => localize(f, "es")).join(" ");
    const body = { reason_en, reason_es };
    await redis.setex(cacheKey, 120, JSON.stringify(body));
    return NextResponse.json(body);
  } catch (err) {
    return NextResponse.json({ error: "Internal" }, { status: 500 });
  }
}
