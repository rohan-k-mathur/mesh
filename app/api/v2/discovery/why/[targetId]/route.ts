import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import redis from "@/lib/redis";
import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import { intersection } from "lodash";
import { prisma } from "@/lib/prismaclient";
import { getRedis } from "@/lib/redis";

const execFileAsync = promisify(execFile);
const explainMap = JSON.parse(
  fs.readFileSync("config/explain_map.json", "utf8")
);
const chipTemplates = JSON.parse(
  fs.readFileSync("config/chip_templates.json", "utf8")
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
  const rediss = getRedis();
if (rediss) {
 
  const cached = await rediss.get(cacheKey);
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
    let chip: { en: string; es: string } | undefined;
    try {
      const viewerTraits = await prisma.user_taste_vectors.findUnique({
        where: { user_id: BigInt(viewerId) },
        select: { traits: true },
      });
      const creatorId = await prisma.feedPost.findUnique({
        where: { id: BigInt(params.targetId) },
        select: { author_id: true },
      });
      if (viewerTraits?.traits && creatorId) {
        const creatorTraits = await prisma.user_taste_vectors.findUnique({
          where: { user_id: creatorId.author_id },
          select: { traits: true },
        });
        const vg = (viewerTraits.traits as any).genres || [];
        const cg = (creatorTraits?.traits as any)?.genres || [];
        const overlap = intersection(vg, cg).sort();
        if (overlap.length > 0) {
          const term = String(overlap[0]).toLowerCase();
          chip = {
            en: chipTemplates.both_appreciate.en.replace("%{term}", term),
            es: chipTemplates.both_appreciate.es.replace("%{term}", term),
          };
        }
      }
    } catch {}
    const body: any = { reason_en, reason_es };
    if (chip) body.chip = chip;
    await rediss.setex(cacheKey, 120, JSON.stringify(body));
    return NextResponse.json(body);
  } catch (err) {
    return NextResponse.json({ error: "Internal" }, { status: 500 });
  }
}
}
