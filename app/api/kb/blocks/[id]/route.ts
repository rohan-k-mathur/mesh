import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';
import { requireKbRole, fail } from '@/lib/kb/withSpaceAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Look up page for auth
    const blk = await prisma.kbBlock.findUnique({ where: { id: params.id }, select: { pageId: true, live: true, dataJson: true, pinnedJson: true } });
    if (!blk) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    await requireKbRole(req, { pageId: blk.pageId, need: 'editor' });

    const body = await req.json().catch(()=> ({} as any));
    const data: any = {};

    if (typeof body?.ord === 'number') data.ord = Math.max(1, Math.floor(body.ord));
    if (body?.dataJson && typeof body.dataJson === 'object') data.dataJson = body.dataJson;

    if (typeof body?.live === 'boolean') {
      data.live = body.live;
      if (body.live === false) {
        // pin: client can send pinnedJson; if absent, we snapshot current dataJson
        data.pinnedJson = body?.pinnedJson && typeof body.pinnedJson === 'object'
          ? body.pinnedJson
          : (blk.pinnedJson ?? blk.dataJson ?? {});
      } else {
        // unpin
        data.pinnedJson = null;
      }
    }

    const row = await prisma.kbBlock.update({
      where: { id: params.id }, data,
      select: { id:true, ord:true, type:true, live:true, dataJson:true, pinnedJson:true, updatedAt:true }
    });
    return NextResponse.json({ ok: true, block: row });
  } catch (e) { return fail(e); }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const blk = await prisma.kbBlock.findUnique({ where: { id: params.id }, select: { pageId: true } });
    if (!blk) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    await requireKbRole(req, { pageId: blk.pageId, need: 'editor' });
    await prisma.kbBlock.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e) { return fail(e); }
}
