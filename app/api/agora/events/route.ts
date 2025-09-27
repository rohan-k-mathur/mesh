// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prismaclient";

// /* ------------------------------- helpers ------------------------------- */

// type FeedEvent = { id: string; ts: number; type: string; [k: string]: any };


// // in-memory ring as a cheap start; upgrade to Outbox (Phase D)
// const RING = (globalThis as any).__agoraRing__ ??= { buf: [] as FeedEvent[], cap: 2048 };


// function niceDomain(url?: string | null, fallback?: string | null) {
//   if (fallback) return fallback || null;
//   if (!url) return null;
//   try { return new URL(url).hostname.replace(/^www\./, "") || null; }
//   catch { return null; }
// }
// function titleFromUrl(url: string) {
//   try {
//     const u = new URL(url);
//     const domain = u.hostname.replace(/^www\./, "");
//     const tail = decodeURIComponent(u.pathname.split("/").filter(Boolean).pop() || "").slice(0, 80);
//     return tail ? `${domain} · ${tail}` : domain;
//   } catch { return url; }
// }
// function humanSourceTitle(source: any) {
//   const t = (source?.title || "").trim();
//   const url = source?.url || "";
//   if (t && !/^https?:\/\//i.test(t)) return t;
//   if (url && url.includes("doi.org")) {
//     try {
//       const u = new URL(url);
//       const doi = decodeURIComponent(u.pathname.replace(/^\/+/, ""));
//       return `doi:${doi}`;
//     } catch {}
//   }
//   return url ? titleFromUrl(url) : (source?.platform || "Source");
// }
// function trimSnippet(s?: string | null, n = 100) {
//   if (!s) return "";
//   const x = s.replace(/\s+/g, " ").trim();
//   return x.length > n ? `${x.slice(0, n)}…` : x;
// }
// // NEW: drop placeholder-only previews like “Sources:”
// function cleanPreview(s?: string | null) {
//   if (!s) return "";
//   const x = s.replace(/\s+/g, " ").trim();
//   return /^sources:\s*$/i.test(x) ? "" : x;
// }

// /* -------------------------------- route -------------------------------- */
// export async function GET(req: NextRequest) {
//   // const url = new URL(req.url);
//   // const limit = Math.min(parseInt(url.searchParams.get("limit") || "30", 10), 100);
//     const url = new URL(req.url);
//   const since = Number(url.searchParams.get('since') || 0);
//   const limit = Math.max(0, Math.min(200, Number(url.searchParams.get('limit') || 50)));
//   const all: FeedEvent[] = RING.buf;

  
//   const [moves, cites, receipts] = await Promise.all([
//     prisma.dialogueMove.findMany({
//       orderBy: { createdAt: "desc" },
//       take: Math.ceil(limit * 0.6),
//       select: { id: true, deliberationId: true, targetType: true, targetId: true, kind: true, createdAt: true },
//     }),
//     prisma.citation.findMany({
//       orderBy: { createdAt: "desc" },
//       take: Math.ceil(limit * 0.3),
//       include: { source: true },
//     }),
//     ((prisma as any).ludicDecisionReceipt?.findMany?.({
//       orderBy: { createdAt: "desc" },
//       take: Math.ceil(limit * 0.3),
//       select: {
//         id: true, deliberationId: true, kind: true, subjectType: true, subjectId: true, createdAt: true, rationale: true,
//       },
//     }).catch(() => []) ?? []),
//   ]);

//   /* ------------------------- enrich citation context ------------------------- */
//   const commentIds = cites
//     .filter((c) => c.targetType === "comment")
//     .map((c) => { try { return BigInt(c.targetId); } catch { return null; } })
//     .filter(Boolean) as bigint[];

//   const comments = commentIds.length
//     ? await prisma.feedPost.findMany({
//         where: { id: { in: commentIds } },
//         select: { id: true, content: true, parent_id: true },
//       })
//     : [];
//   const commentMap = new Map<string, { content: string | null; parent_id: bigint | null }>();
//   comments.forEach((r) => commentMap.set(String(r.id), { content: r.content, parent_id: r.parent_id }));

//   const rootIds = Array.from(new Set(comments.map((c) => (c.parent_id ?? c.id).toString()))).map((s) => BigInt(s));
//   const roots = rootIds.length
//     ? await prisma.feedPost.findMany({ where: { id: { in: rootIds } }, select: { id: true, stack_id: true } })
//     : [];
//   const rootMap = new Map<string, string | null>();
//   roots.forEach((r) => rootMap.set(String(r.id), r.stack_id));

//   const claimIds = cites.filter((c) => c.targetType === "claim").map((c) => c.targetId);
//   // const claims = claimIds.length
//   //   ? await prisma.claim.findMany({ where: { id: { in: claimIds } }, select: { id: true, text: true } })
//   //   : [];
//     const claims = claimIds.length
//   ? await prisma.claim.findMany({
//       where: { id: { in: claimIds } },
//       select: { id: true, text: true, deliberationId: true }, // 👈
//     })
//   : [];
// const claimTextMap  = new Map<string, string>();
// const claimRoomMap  = new Map<string, string>();
// claims.forEach((c) => {
//   claimTextMap.set(c.id, c.text || "");
//   if (c.deliberationId) claimRoomMap.set(c.id, c.deliberationId);
// });
//   const claimMap = new Map<string, string>();
//   claims.forEach((c) => claimMap.set(c.id, c.text || ""));



//   const stackIds = Array.from(new Set(
//     cites
//       .filter(c => c.targetType === "comment")
//       .map(c => {
//         const cm = commentMap.get(c.targetId);
//         const rootId = cm?.parent_id ? String(cm.parent_id) : c.targetId;
//         return rootMap.get(rootId) ?? null;
//       })
//       .filter(Boolean) as string[]
//   ));
  
//   // find rooms for those stacks (best effort)
//   const hostRooms = stackIds.length
//     ? await prisma.deliberation.findMany({
//         where: { hostId: { in: stackIds } }, // optionally also filter by hostType
//         select: { id: true, hostId: true },
//       })
//     : [];
//   const roomByHostId = new Map<string, string>();
//   hostRooms.forEach(r => roomByHostId.set(r.hostId, r.id));
//   /* ---------------------------- map → unified events ---------------------------- */
//   const moveEvents = moves.map((m) => ({
//     id: `mv:${m.id}`,
//     type: "dialogue:changed" as const,
//     ts: new Date(m.createdAt).getTime(),
//     title: `New move${m.kind ? ` (${m.kind})` : ""}`,
//     meta: m.deliberationId ? `room:${m.deliberationId.slice(0, 6)}…` : undefined,
//     chips: m.kind ? [m.kind] : [],
//     link: m.deliberationId ? `/deliberation/${m.deliberationId}` : undefined,
//     deliberationId: m.deliberationId,
//     targetType: m.targetType,
//     targetId: m.targetId,
//     icon: "move",
//   }));

//   const citeEvents = cites.map((c) => {
//     const src = (c as any).source || {};
//     const urlStr: string | null = src.url ?? null;
//     const domain = niceDomain(urlStr, null);
//     let deliberationId: string | undefined;

//     const titleTxt = humanSourceTitle(src);
//     const targetLabel =
//       c.targetType === "comment" ? "Comment" :
//       c.targetType === "claim"   ? "Claim"   :
//       (c.targetType as string);

//     // preview & context
//     let preview = "";
//     let stackId: string | null = null;
//     if (c.targetType === "comment") {
//       const cm = commentMap.get(c.targetId);
//       const rootId = cm?.parent_id ? String(cm.parent_id) : c.targetId;
//       const host = rootMap.get(rootId) ?? null;      // stack id
//       deliberationId = host ? roomByHostId.get(host) : undefined;
//       stackId = rootMap.get(rootId) ?? null;
//       preview = cleanPreview(trimSnippet(cm?.content, 100));
//     } else if (c.targetType === "claim") {
//       deliberationId = claimRoomMap.get(c.targetId);

//       preview = cleanPreview(trimSnippet(claimMap.get(c.targetId), 100));
//     }

//     const contextLink =
//       c.targetType === "comment" && stackId ? `/stacks/${stackId}#c=${c.targetId}` :
//       c.targetType === "claim" ? `/claim/${c.targetId}` :
//       undefined;

//     const quoteChip = c.quote ? `“${String(c.quote).slice(0, 120)}${String(c.quote).length > 120 ? "…" : ""}”` : null;
//     const noteChip  = c.note  ? `Note: ${String(c.note).slice(0, 80)}${String(c.note).length > 80 ? "…" : ""}` : null;
//     const kindChip  = src.kind ? String(src.kind) : null;            // 'pdf' | 'web' | 'dataset'
//     const platChip  = src.platform ? String(src.platform) : null;    // 'arxiv' | 'library' | 'web'

//     // de-dupe chips (avoid 'web' twice)
//     const rawChips = [
//       ...(quoteChip ? [quoteChip] : []),
//       ...(noteChip  ? [noteChip]  : []),
//       ...(kindChip  ? [kindChip]  : []),
//       ...(platChip && platChip !== kindChip ? [platChip] : []),
//       "source",
//     ];
//     const chips = Array.from(new Set(rawChips));

//     return {
//       id: `ct:${c.id}`,
//       type: "citations:changed" as const,
//       ts: new Date((c as any).createdAt).getTime(),
//       title: `Added source: ${titleTxt}`,
//       meta: `${targetLabel}${c.locator ? ` · ${c.locator}` : ""}${domain ? ` · ${domain}` : ""}${preview ? ` · ${preview}` : ""}`,
//       chips,
//       link: urlStr || contextLink,
//       contextLink,
//       targetType: c.targetType,
//       targetId: c.targetId,
//       deliberationId,                    // 👈 NEW

//       icon: "link",
//     } as const;
//   });

//   const decisionEvents = (receipts as any[]).map((r) => ({
//     id: `dc:${r.id}`,
//     type: "decision:changed" as const,
//     ts: new Date(r.createdAt).getTime(),
//     title: `Decision (${r.kind})`,
//     meta: r.rationale || `${r.subjectType}:${String(r.subjectId).slice(0, 6)}…`,
//     chips: [r.subjectType],
//     link: `/deliberation/${r.deliberationId}`,
//     deliberationId: r.deliberationId,
//     icon: "check",
//   }));

//   const events = [...moveEvents, ...citeEvents, ...decisionEvents]
//     .sort((a, b) => b.ts - a.ts)
//     .slice(0, limit);

//   // return NextResponse.json({ events });

//   const items = since
//     ? all.filter((e) => e.ts > since).slice(-limit)
//     : all.slice(-limit);

//   return NextResponse.json({ ok: true, items });
// }
// app/api/agora/events/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";

export const dynamic = "force-dynamic";

type FeedEvent = { id: string; ts: number; type: string; [k: string]: any };
const RING = (globalThis as any).__agoraRing__ ??= { buf: [] as FeedEvent[], cap: 2048 };

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const since = Number(url.searchParams.get('since') || 0);
  const rawLimit = Number(url.searchParams.get('limit') || 50);
  const limit = Number.isFinite(rawLimit) ? Math.max(0, Math.min(200, rawLimit)) : 50;


  const ringItems = since
    ? RING.buf.filter((e) => Number.isFinite(e.ts) && e.ts > since).slice(-limit)
    : RING.buf.slice(-limit);

  // Fast path: ring has useful items or client asked for limit=0 probe
  if (ringItems.length || limit === 0) {
    return NextResponse.json({ ok: true, items: ringItems });
  }

  // Cold start bootstrap from DB (best-effort, condensed)
  const takeMoves = Math.ceil(limit * 0.6);
  const takeCites = Math.ceil(limit * 0.3);
  const takeRecs  = Math.ceil(limit * 0.3);

  const [moves, cites, receipts] = await Promise.all([
    prisma.dialogueMove.findMany({
      orderBy: { createdAt: "desc" }, take: takeMoves,
      select: { id:true, deliberationId:true, targetType:true, targetId:true, kind:true, createdAt:true },
    }),
    prisma.citation.findMany({
      orderBy: { createdAt: "desc" }, take: takeCites, include: { source: true },
    }),
    ((prisma as any).ludicDecisionReceipt?.findMany?.({
      orderBy: { createdAt: "desc" }, take: takeRecs,
      select: { id:true, deliberationId:true, kind:true, subjectType:true, subjectId:true, createdAt:true, rationale:true },
    }).catch(()=>[]) ?? []),
  ]);

  const moveEvents: FeedEvent[] = moves.map((m) => ({
    id: `mv:${m.id}`, type: "dialogue:changed",
    ts: new Date(m.createdAt).getTime(),
    title: `New move${m.kind ? ` (${m.kind})` : ""}`,
    deliberationId: m.deliberationId, targetType: m.targetType, targetId: m.targetId, icon: "move",
  }));

  const citeEvents: FeedEvent[] = cites.map((c:any) => ({
    id: `ct:${c.id}`, type: "citations:changed",
    ts: new Date(c.createdAt).getTime(),
    title: `Added source`, targetType: c.targetType, targetId: c.targetId,
    link: c?.source?.url ?? undefined, icon: "link",
  }));

  const decisionEvents: FeedEvent[] = (receipts as any[]).map((r) => ({
    id: `dc:${r.id}`, type: "decision:changed",
    ts: new Date(r.createdAt).getTime(),
    title: `Decision (${r.kind})`,
    deliberationId: r.deliberationId, icon: "check",
  }));

  const items = [...moveEvents, ...citeEvents, ...decisionEvents]
    .sort((a, b) => b.ts - a.ts)
    .slice(0, limit);

  return NextResponse.json({ ok: true, items });
}
