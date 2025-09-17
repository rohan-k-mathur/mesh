// // app/api/citations/resolve/route.ts
// export const runtime = 'nodejs';
// import { NextRequest, NextResponse } from 'next/server';
// import { prisma } from '@/lib/prismaclient';
// import crypto from 'crypto';

// function canonicalUrl(u?: string | null) {
//   if (!u) return null;
//   try {
//     const url = new URL(u);
//     url.hash = '';
//     if (url.searchParams.get('utm_source')) url.search = '';
//     return url.toString();
//   } catch { return u.trim(); }
// }
// function fp({ doi, url, title }: { doi?: string | null; url?: string | null; title?: string | null }) {
//   const base = (doi?.toLowerCase() || '') + '|' + (url?.toLowerCase() || '') + '|' + (title?.toLowerCase() || '');
//   return crypto.createHash('sha1').update(base, 'utf8').digest('hex');
// }

// export async function POST(req: NextRequest) {
//   try {
//     const { url, doi, libraryPostId, kind, title, platform, createdById } = await req.json();
//     if (!createdById) return NextResponse.json({ error: 'createdById required' }, { status: 400 });

//     const normUrl = canonicalUrl(url);
//     const fingerprint = fp({ doi, url: normUrl, title });

//     // try to find an existing row
//     const existing = await prisma.source.findFirst({
//       where: {
//         OR: [
//           ...(doi ? [{ doi }] : []),
//           ...(normUrl ? [{ url: normUrl }] : []),
//           { fingerprint },
//           ...(libraryPostId ? [{ libraryPostId }] : []),
//         ],
//       },
//     });

//     if (existing) {
//       // fill missing fields if we can
//       const upd = await prisma.source.update({
//         where: { id: existing.id },
//         data: {
//           doi: existing.doi ?? doi ?? undefined,
//           url: existing.url ?? normUrl ?? undefined,
//           title: existing.title ?? title ?? undefined,
//           platform: existing.platform ?? platform ?? undefined,
//           kind: existing.kind ?? kind ?? undefined,
//           libraryPostId: existing.libraryPostId ?? libraryPostId ?? undefined,
//           fingerprint: existing.fingerprint ?? fingerprint,
//         },
//       });
//       return NextResponse.json({ source: upd });
//     }

//     // create new
//     const created = await prisma.source.create({
//       data: {
//         kind: kind ?? (doi ? 'article' : 'web'),
//         title: title ?? (normUrl ?? doi ?? 'Untitled'),
//         url: normUrl ?? undefined,
//         doi: doi ?? undefined,
//         platform: platform ?? undefined,
//         libraryPostId: libraryPostId ?? undefined,
//         accessedAt: new Date(),
//         createdById,
//         fingerprint,
//       },
//     });
//     (globalThis as any).__meshBus__?.emitEvent?.('citations:changed', { targetType: null });

//     return NextResponse.json({ source: created });
//   } catch (e: any) {
//     return NextResponse.json({ error: e?.message ?? 'resolve failed' }, { status: 400 });
//   }
// }
// app/api/citations/resolve/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prismaclient";
import { getCurrentUserId } from "@/lib/serverutils";

// create a stable dedup key
function fingerprint({ url, doi, libraryPostId }: { url?: string; doi?: string; libraryPostId?: string }) {
  const s = (doi?.trim().toLowerCase() || "") + "|" + (url?.trim().toLowerCase() || "") + "|" + (libraryPostId || "");
  return crypto.createHash("sha1").update(s).digest("hex");
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { url, doi, libraryPostId, meta = {} } = body;

  if (!url && !doi && !libraryPostId) {
    return NextResponse.json({ error: "Provide url or doi or libraryPostId" }, { status: 400 });
  }

  const fp = fingerprint({ url, doi, libraryPostId });
  const existing = await prisma.source.findFirst({ where: { fingerprint: fp } });
  if (existing) return NextResponse.json({ source: existing });

  // Create minimal Source (metadata enrichment can run async elsewhere)
  const created = await prisma.source.create({
    data: {
      kind: meta.kind || "web",
      title: meta.title || null,
      authorsJson: meta.authorsJson || null,
      year: meta.year || null,
      container: meta.container || null,
      publisher: meta.publisher || null,
      doi: doi || null,
      url: url || null,
      platform: meta.platform || null,
      accessedAt: meta.accessedAt ? new Date(meta.accessedAt) : new Date(),
      archiveUrl: null,
      zoteroKey: meta.zoteroKey || null,
      libraryPostId: libraryPostId || null,
      fingerprint: fp,
      createdById: String(userId),
    },
  });

  // Optional: fire-and-forget Wayback snapshot (do not await)
  if (url) {
    fetch(`https://web.archive.org/save/${encodeURIComponent(url)}`).catch(() => {});
  }

  return NextResponse.json({ source: created });
}
