import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prismaclient";
import crypto from "crypto";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const Body = z.object({
  fromId: z.string().min(6),
  toId: z.string().min(6),
  claimMap: z.record(z.string().min(6)).optional(), // { fromClaimId: toClaimId }
  topK: z.number().int().positive().max(20).default(5), // per-claim
});

export async function POST(req: NextRequest) {
  const { fromId, toId, claimMap: givenMap, topK } = Body.parse(await req.json());

  // If not provided, read persisted mapping
  let claimMap: Record<string,string> = givenMap ?? {};
  if (!givenMap) {
    const row = await prisma.roomFunctor.findFirst({
      where: { fromRoomId: fromId, toRoomId: toId },
      select: { claimMapJson: true }
    });
    claimMap = (row?.claimMapJson ?? {}) as Record<string,string>;
  }
  const fromClaimIds = Object.keys(claimMap);
  if (!fromClaimIds.length) {
    return NextResponse.json({ ok:true, proposals: [], note: "No mapped claims yet." });
  }

  // Pull supports in the source room for mapped claims (materialized confidence `base`)
  const supports = await prisma.argumentSupport.findMany({
    where: { deliberationId: fromId, claimId: { in: fromClaimIds } },
    select: { claimId: true, argumentId: true, base: true },
  });

  // Pick strongest topK per claim
  const byClaim = new Map<string, {argumentId:string;base:number}[]>();
  for (const s of supports) {
    const list = byClaim.get(s.claimId) ?? [];
    list.push({ argumentId: s.argumentId, base: s.base ?? 0.55 });
    byClaim.set(s.claimId, list);
  }
  for (const [k, v] of byClaim) v.sort((a, b) => (b.base - a.base));

  // Bring back argument text for preview
  const argIds = Array.from(new Set(supports.map(s => s.argumentId)));
  const argMeta = await prisma.argument.findMany({
    where: { id: { in: argIds } },
    select: { id:true, text:true }
  });
  const textById = new Map(argMeta.map(a => [a.id, a.text || `Argument ${a.id.slice(0,8)}…`]));

  // Proposed imports list (idempotent fingerprint)
  type Proposal = {
    fingerprint: string;
    fromArgumentId: string;
    fromClaimId: string;
    toClaimId: string;
    base: number;
    previewText: string;
  };
  const proposals: Proposal[] = [];
  for (const [fromClaimId, list] of byClaim) {
    const toClaimId = claimMap[fromClaimId];
    if (!toClaimId) continue;
    for (const item of list.slice(0, topK)) {
      const fingerprint = crypto.createHash("sha1")
        .update(`${fromId}|${toId}|${fromClaimId}|${toClaimId}|${item.argumentId}`)
        .digest("hex");
      proposals.push({
        fingerprint,
        fromArgumentId: item.argumentId,
        fromClaimId,
        toClaimId,
        base: +((item.base ?? 0.55).toFixed(4)),
        previewText: textById.get(item.argumentId) ?? "",
      });
    }
  }

  return NextResponse.json({ ok:true, proposals }, { headers: { "Cache-Control":"no-store" }});
}
