// app/api/kb/pages/[id]/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';
import { requireKbRole, fail } from '@/lib/kb/withSpaceAuth';

export const dynamic = 'force-dynamic'; export const revalidate = 0;

export async function GET(req:NextRequest, { params }:{ params:{ id:string } }) {
  try {
    const u = new URL(req.url);
    const as = (u.searchParams.get('as') ?? 'md').toLowerCase();
    const at = u.searchParams.get('at'); // snapshotId or ISO (Phase‑B)
    // Load page + blocks
    const page = await prisma.kbPage.findUnique({
      where: { id: params.id },
      select: { id:true, title:true, spaceId:true, summary:true, frontmatter:true, blocks:{
        orderBy:{ ord:'asc' },
        select:{ id:true, type:true, live:true, dataJson:true, pinnedJson:true }
      }}
    });
    if (!page) return NextResponse.json({ error:'not_found' }, { status:404 });
    await requireKbRole(req, { spaceId: page.spaceId, need: 'reader' });

    if (as === 'pdf') {
      // Optional: implement SSR-to-PDF using your renderer + Playwright/Puppeteer
      return NextResponse.json({ error:'pdf_not_implemented' }, { status:501 });
    }

    // MD export (simple): use pinnedJson if !live, otherwise embed raw text / minimal summaries
    const lines:string[] = [];
    lines.push(`# ${page.title}`);
    if (page.summary) lines.push('', page.summary);
    lines.push('', '---');

    for (const b of page.blocks) {
      if (b.type === 'text') {
        const md = (b.dataJson?.md ?? '').trim();
        if (md) { lines.push('', md); continue; }
      }
      if (b.type === 'image') {
        const src = b.dataJson?.src ?? '';
        const alt = b.dataJson?.alt ?? '';
        if (src) lines.push('', `![${alt}](${src})`);
        continue;
      }
      if (b.type === 'link') {
        const href = b.dataJson?.href ?? '';
        const text = b.dataJson?.text ?? href;
        if (href) lines.push('', `[${text}](${href})`);
        continue;
      }
      // structured → use pinned if available, else a compact textual form
      const env = b.live ? null : (b.pinnedJson ?? null);
      if (b.type === 'claim') {
        if (env?.data?.text) lines.push('', `> ${env.data.text}  \n> **Bel** ${Math.round((env.data.bel ?? 0)*100)}%`);
        else lines.push('', `> (Claim ${b.dataJson?.id ?? ''})`);
        continue;
      }
      if (b.type === 'room_summary') {
        const rows = env?.data?.claims ?? [];
        lines.push('', `### Room summary`);
        rows.forEach((c:any)=>lines.push(`- ${c.text} (${Math.round((c.bel ?? c.score ?? 0)*100)}%)`));
        continue;
      }
      if (b.type === 'argument') {
        lines.push('', `**Argument ${b.dataJson?.id ?? ''}** *(diagram omitted)*`);
        continue;
      }
      if (b.type === 'sheet') {
        lines.push('', `**Sheet ${b.dataJson?.id ?? ''}** *(see app for full detail)*`);
        continue;
      }
      if (b.type === 'transport') {
        const m = env?.data?.claimMap ?? {};
        const pairs = Object.entries(m);
        lines.push('', `**Transport** (${pairs.length} mapped pairs)`);
        pairs.slice(0,20).forEach(([a,b])=>lines.push(`- ${a} → ${b}`));
        continue;
      }
    }

    const body = lines.join('\n');
    return new NextResponse(body, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': 'no-store',
        'Content-Disposition': `attachment; filename="${page.title.replace(/\s+/g,'_')}.md"`
      }
    });
  } catch (e) { return fail(e); }
}
