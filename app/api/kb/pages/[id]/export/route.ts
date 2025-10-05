// app/api/kb/pages/[id]/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';
import { requireKbRole, fail } from '@/lib/kb/withSpaceAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function fm(s: Record<string, any>) {
  const yaml = Object.entries(s)
    .map(([k, v]) => `${k}: ${typeof v === 'string' ? JSON.stringify(v) : JSON.stringify(v)}`)
    .join('\n');
  return `---\n${yaml}\n---\n`;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const url = new URL(req.url);
    const as = (url.searchParams.get('as') ?? 'md').toLowerCase();
    const at = url.searchParams.get('at'); // snapshotId or ISO; Phase‑A: ignore ISO pinning, ship live+snapshot
    const pageId = params.id;

    // Auth
    await requireKbRole(req, { pageId, need: 'reader' });

    // Page + blocks + (optional) snapshot
    const page = await prisma.kbPage.findUnique({
      where: { id: pageId },
      select: { id: true, title: true, summary: true, tags: true, spaceId: true },
    });
    if (!page) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });

    let blocks = await prisma.kbBlock.findMany({
      where: { pageId },
      orderBy: { order: 'asc' },
      select: { id: true, kind: true, data: true, pinnedJson: true },
    });

    let snapshotMeta: any = null;
    if (at && !/^\d{4}-\d{2}-\d{2}T/.test(at)) {
      // snapshot id path
      const snap = await prisma.kbSnapshot.findUnique({
        where: { id: at },
        select: { id: true, createdAt: true, manifestJson: true, pageId: true },
      });
      if (!snap || snap.pageId !== pageId) {
        return NextResponse.json({ ok: false, error: 'snapshot_not_found' }, { status: 404 });
      }
      snapshotMeta = { id: snap.id, createdAt: snap.createdAt };
      // Replace live blocks with pinned where present
      const byId = new Map(blocks.map((b) => [b.id, b]));
      const manifest = (snap.manifestJson ?? {}) as Record<string, any>;
      for (const bid of Object.keys(manifest)) {
        const live = byId.get(bid);
        if (live) live.pinnedJson = manifest[bid];
      }
    }

    if (as === 'pdf') {
      // Phase‑A: ship Markdown first; PDF will render the same HTML via a headless renderer in Phase‑B.
      return NextResponse.json({ ok: false, error: 'pdf_not_implemented' }, { status: 501 });
    }

    // Build Markdown
    const header = fm({
      title: page.title ?? `KB Page ${page.id}`,
      tags: page.tags ?? [],
      spaceId: page.spaceId,
      exportedAt: new Date().toISOString(),
      ...(snapshotMeta ? { snapshotId: snapshotMeta.id, snapshotAt: snapshotMeta.createdAt } : {}),
    });

    // Manifests for reproducibility
    const manifest = Object.fromEntries(
      blocks.map((b) => [b.id, b.pinnedJson ? b.pinnedJson : null])
    );
    const manifestFence = [
      '```json x-kb-manifest',
      JSON.stringify(manifest, null, 2),
      '```',
      '',
    ].join('\n');

    const lines: string[] = [];
    lines.push(`# ${page.title ?? `KB Page ${page.id}`}`);
    if (page.summary) lines.push(`> ${page.summary}\n`);

    for (const b of blocks) {
      const pinned = !!b.pinnedJson;
      const k = (b.kind as string).toLowerCase();
      if (k === 'text') {
        lines.push(String(b.data ?? ''));
      } else {
        // Compact serialization for structured blocks
        lines.push(`\n## Block: ${k} ${pinned ? '📌 (pinned)' : '• live'}`);
        lines.push('```json');
        lines.push(JSON.stringify({ id: b.id, kind: b.kind, data: b.data, pinned: b.pinnedJson ?? null }, null, 2));
        lines.push('```');
      }
    }

    const md = [header, manifestFence, lines.join('\n')].join('\n');
    return new NextResponse(md, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': 'private, no-store',
        'Content-Disposition': `attachment; filename="kb-${page.id}.md"`,
      },
    });
  } catch (err) {
    return fail(err);
  }
}
