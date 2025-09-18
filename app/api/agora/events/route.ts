import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";

// Map DB rows to a single shape. Keep each block defensive & light.
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "30", 10), 100);

  // Pull small batches per type, then merge/sort.
  const [moves, cites, receipts] = await Promise.all([
    prisma.dialogueMove.findMany({
      orderBy: { createdAt: "desc" },
      take: Math.ceil(limit * 0.6),
      select: { id: true, deliberationId: true, targetType: true, targetId: true, kind: true, createdAt: true },
    }),
    prisma.citation.findMany({
      orderBy: { createdAt: "desc" },
      take: Math.ceil(limit * 0.3),
      include: { source: true },
    }),
    // Use `as any` to avoid compile error if the model name differs in your generated client.
    (prisma as any).ludicDecisionReceipt?.findMany?.({
      orderBy: { createdAt: "desc" },
      take: Math.ceil(limit * 0.3),
      select: { id: true, deliberationId: true, kind: true, subjectType: true, subjectId: true, createdAt: true, rationale: true },
    }).catch(() => []) ?? [],
  ]);

  // Map → unified events
  const moveEvents = moves.map((m) => ({
    id: `mv:${m.id}`,
    type: "dialogue:changed" as const,
    ts: new Date(m.createdAt).getTime(),
    title: `${m.kind} on ${m.targetType}`,
    meta: `${m.targetType}:${m.targetId.slice(0, 6)}…`,
    chips: [`room:${m.deliberationId.slice(0, 6)}…`],
    link: `/deliberation/${m.deliberationId}`,
    deliberationId: m.deliberationId,
    targetType: m.targetType,
    targetId: m.targetId,
    icon: "move",
  }));

  const citeEvents = cites.map((c) => ({
    id: `ct:${c.id}`,
    type: "citations:changed" as const,
    ts: new Date((c as any).createdAt).getTime(),
    title: `Citation attached`,
    meta: (c.source?.title || c.source?.url || "Source") + (c.locator ? ` · ${c.locator}` : ""),
    chips: [c.targetType, (c as any).relevance ? `relevance:${(c as any).relevance}` : "source"],
    link: c.targetType === "claim" ? `/claim/${c.targetId}` : undefined,
    targetType: c.targetType,
    targetId: c.targetId,
    icon: "link",
  }));

  const decisionEvents = (receipts as any[]).map((r) => ({
    id: `dc:${r.id}`,
    type: "decision:changed" as const,
    ts: new Date(r.createdAt).getTime(),
    title: `Decision (${r.kind})`,
    meta: r.rationale || `${r.subjectType}:${String(r.subjectId).slice(0, 6)}…`,
    chips: [r.subjectType],
    link: `/deliberation/${r.deliberationId}`,
    deliberationId: r.deliberationId,
    icon: "check",
  }));

  const events = [...moveEvents, ...citeEvents, ...decisionEvents]
    .sort((a, b) => b.ts - a.ts)
    .slice(0, limit);

  return NextResponse.json({ events });
}
