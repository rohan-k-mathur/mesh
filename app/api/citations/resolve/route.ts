// app/api/citations/resolve/route.ts
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prismaclient";
import { getCurrentUserId } from "@/lib/serverutils";

function canonicalUrl(u?: string | null) {
  if (!u) return null;
  try {
    const url = new URL(u);
    url.hash = "";
    // strip common marketing params; add more as you like
    ["utm_source","utm_medium","utm_campaign","utm_term","utm_content"].forEach(k => url.searchParams.delete(k));
    return url.toString();
  } catch {
    return u.trim();
  }
}

function inferPlatform(u?: string | null) {
  if (!u) return "web";
  try {
    const h = new URL(u).hostname;
    if (h.includes("arxiv")) return "arxiv";
    if (h.includes("substack")) return "substack";
    if (h.includes("youtube") || h.includes("youtu.be")) return "youtube";
    return "web";
  } catch { return "web"; }
}

function fpFrom(parts: { doi?: string | null; url?: string | null; libraryPostId?: string | null; workId?: string | null }) {
  const base = (parts.doi?.toLowerCase() || "")
             + "|" + (parts.url?.toLowerCase() || "")
             + "|" + (parts.libraryPostId || "")
             + "|" + (parts.workId || "");
  return crypto.createHash("sha1").update(base, "utf8").digest("hex");
}

/**
 * Accepts:
 *  - { ref: { kind:'uri'|'work'|'stack:item', ... }, meta? }
 *  - or plain { url?, doi?, libraryPostId?, workId?, meta? }
 * Returns a Source row (id, minimal fields).
 */
export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const meta = (body.meta ?? {}) as Partial<{
    kind: string; title: string; authorsJson: any; year: number;
    container: string; publisher: string; platform: string; accessedAt: string; zoteroKey: string;
  }>;

  // Normalize to a single "input"
  const input =
    body.ref ? body.ref :
    body.workId ? { kind: "work", id: String(body.workId) } :
    body.libraryPostId ? { kind: "stack:item", itemId: String(body.libraryPostId) } :
    body.doi ? { kind: "uri", url: `https://doi.org/${String(body.doi).trim()}` } :
    body.url ? { kind: "uri", url: String(body.url) } :
    null;

  if (!input) {
    return NextResponse.json({ error: "Provide ref/url/doi/libraryPostId/workId" }, { status: 400 });
  }

  let createdOrFound: any = null;

  // 1) URI (web/doi) path
  if (input.kind === "uri") {
    const norm = canonicalUrl(input.url) as string;
    const fingerprint = fpFrom({ url: norm });

    const existing = await prisma.source.findFirst({
      where: { OR: [{ fingerprint }, { url: norm }] },
    });

    if (existing) {
      // Fill missing metadata on existing
      const upd = await prisma.source.update({
        where: { id: existing.id },
        data: {
          url: existing.url ?? norm,
          title: existing.title ?? meta.title ?? null,
          platform: existing.platform ?? meta.platform ?? inferPlatform(norm),
          kind: existing.kind ?? meta.kind ?? "web",
          authorsJson: existing.authorsJson ?? (meta.authorsJson ?? undefined),
          year: existing.year ?? (meta.year ?? undefined),
          container: existing.container ?? (meta.container ?? undefined),
          publisher: existing.publisher ?? (meta.publisher ?? undefined),
          accessedAt: existing.accessedAt ?? (meta.accessedAt ? new Date(meta.accessedAt) : new Date()),
          fingerprint: existing.fingerprint ?? fingerprint,
        },
        select: { id: true, title: true, url: true },
      });
      createdOrFound = upd;
    } else {
      const row = await prisma.source.create({
        data: {
          kind: meta.kind ?? "web",
          title: meta.title ?? norm,
          url: norm,
          platform: meta.platform ?? inferPlatform(norm),
          authorsJson: meta.authorsJson ?? undefined,
          year: meta.year ?? undefined,
          container: meta.container ?? undefined,
          publisher: meta.publisher ?? undefined,
          accessedAt: meta.accessedAt ? new Date(meta.accessedAt) : new Date(),
          fingerprint,
          createdById: String(userId),
        },
        select: { id: true, title: true, url: true },
      });
      createdOrFound = row;

      // Optional: Wayback save (fire-and-forget)
      fetch(`https://web.archive.org/save/${encodeURIComponent(norm)}`).catch(() => {});
    }
  }

  // 2) Work path (internal work id → stable fingerprint)
  if (input.kind === "work") {
    const fingerprint = fpFrom({ workId: String(input.id) });
    const existing = await prisma.source.findFirst({ where: { fingerprint } });
    if (existing) {
      createdOrFound = existing;
    } else {
      createdOrFound = await prisma.source.create({
        data: {
          kind: "work",
          title: meta.title ?? null,
          url: `/works/${String(input.id)}`,
          platform: "internal",
          fingerprint,
          createdById: String(userId),
        },
        select: { id: true, title: true, url: true },
      });
    }
  }

  // 3) Stack item path (LibraryPost)
  if (input.kind === "stack:item") {
    const lp = await prisma.libraryPost.findUnique({
      where: { id: String(input.itemId) },
      select: { id: true, title: true },
    });
    if (!lp) return NextResponse.json({ error: "Library item not found" }, { status: 404 });

    const fingerprint = fpFrom({ libraryPostId: lp.id });
    const existing = await prisma.source.findFirst({
      where: { OR: [{ fingerprint }, { libraryPostId: lp.id }] },
      select: { id: true, title: true, url: true },
    });

    createdOrFound = existing
      ? existing
      : await prisma.source.create({
          data: {
            kind: meta.kind ?? "pdf",
            title: meta.title ?? lp.title ?? "PDF",
            platform: meta.platform ?? "library",
            libraryPostId: lp.id,
            fingerprint,
            createdById: String(userId),
          },
          select: { id: true, title: true, url: true },
        });
  }

  try { (globalThis as any).__meshBus__?.emitEvent?.("citations:changed", { sourceId: createdOrFound.id }); } catch {}
  return NextResponse.json({ source: createdOrFound });
}
