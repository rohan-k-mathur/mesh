import * as crypto from 'crypto';
import { prisma } from '@/lib/prismaclient';

const TTL_MS = 12 * 60 * 60 * 1000;

export function hashUrl(url: string) {
  return crypto.createHash('sha256').update(url.trim().toLowerCase()).digest('hex');
}

export async function getOrFetchLinkPreview(url: string, facetId?: bigint) {
  const urlHash = hashUrl(url);

  const existing = await prisma.linkPreview.findUnique({ where: { urlHash } });
  if (existing && Date.now() - existing.fetchedAt.getTime() < TTL_MS) return existing;

  // SSRF guard (very important)
  if (!isSafePublicUrl(url)) {
    return prisma.linkPreview.upsert({
      where: { urlHash },
      update: { status: 'blocked', fetchedAt: new Date(), facetId: facetId ?? undefined },
      create: { urlHash, url, status: 'blocked', facetId: facetId ?? undefined },
    });
  }

  try {
    const meta = await fetchWithTimeout(url, 4500, { method: 'GET', redirect: 'follow' })
      .then(r => r.ok ? r.text() : '');
    const og = parseOpenGraph(meta); // title/desc/image; include robots
    const status = og.robotsBlocked ? 'noindex' : 'ok';

    return prisma.linkPreview.upsert({
      where: { urlHash },
      update: { ...og, status, fetchedAt: new Date(), facetId: facetId ?? undefined },
      create: { urlHash, url, ...og, status, facetId: facetId ?? undefined },
    });
  } catch {
    return prisma.linkPreview.upsert({
      where: { urlHash },
      update: { status: 'error', fetchedAt: new Date(), facetId: facetId ?? undefined },
      create: { urlHash, url, status: 'error', facetId: facetId ?? undefined },
    });
  }
}
