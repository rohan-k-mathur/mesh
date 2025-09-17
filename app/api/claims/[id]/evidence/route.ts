// app/api/claims/[id]/evidence/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { z } from "zod";

const RefSchema = z.object({
  kind: z.enum(["uri", "work", "stack:item"]),
  url: z.string().optional(),
  id: z.string().optional(),        // for 'work'
  stackId: z.string().optional(),   // not used yet
  itemId: z.string().optional(),    // for 'stack:item'
});

const Body = z.object({
  ref: RefSchema,
  role: z.enum(["primary", "secondary"]).optional().default("secondary"),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const claimId = params.id;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // 1) Resolve into Source via our resolver
  const payloadForResolver =
    parsed.data.ref.kind === "uri"       ? { ref: { kind: "uri", url: parsed.data.ref.url } } :
    parsed.data.ref.kind === "work"      ? { ref: { kind: "work", id: parsed.data.ref.id } } :
    parsed.data.ref.kind === "stack:item"? { ref: { kind: "stack:item", itemId: parsed.data.ref.itemId } } :
    null;

  if (!payloadForResolver) return NextResponse.json({ error: "Invalid ref" }, { status: 400 });

  const res = await fetch(new URL("/api/citations/resolve", req.url), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payloadForResolver),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json?.source?.id) return NextResponse.json({ error: json?.error || "resolve failed" }, { status: 400 });

  // 2) Attach citation to the claim
  await prisma.citation.create({
    data: {
      targetType: "claim",
      targetId: claimId,
      sourceId: json.source.id,
      // createdById: set by attach route; here we inline to keep it simple
      createdById: "system",
    },
  }).catch(() => null);

  // 3) Optional: keep EvidenceLink for counts/compat
  const uriForCount =
    parsed.data.ref.kind === "uri" ? parsed.data.ref.url ?? "" : (json.source.url ?? "");
  await prisma.evidenceLink.create({
    data: { claimId, kind: parsed.data.role, uri: uriForCount },
  }).catch(() => null);

  (globalThis as any).__meshBus__?.emitEvent?.("citations:changed", { targetType: "claim", targetId: claimId });

  const [evidenceCount, citationCount] = await Promise.all([
    prisma.evidenceLink.count({ where: { claimId } }),
    prisma.citation.count({ where: { targetType: "claim", targetId: claimId } }),
  ]);

  return NextResponse.json({ ok: true, counts: { evidence: evidenceCount, citations: citationCount } });
}
