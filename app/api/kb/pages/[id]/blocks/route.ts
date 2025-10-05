import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';
import { z } from 'zod';

export const dynamic='force-dynamic'; export const revalidate=0;

const Create = z.object({
  type: z.enum([
    'text','image','link','claim','claim_set','argument','sheet','room_summary','transport','evidence_list','cq_tracker','plexus_tile'
  ]),
  data: z.any().default({}),
  citations: z.array(z.any()).optional(),
  ord: z.number().int().optional(),
  live: z.boolean().default(true),
});

const Reorder = z.object({
  order: z.array(z.object({ id:z.string().min(6), ord:z.number().int().min(0) })).min(1)
});

function norm(b:any){ return { id:b.id, pageId:b.pageId, ord:b.ord, type:b.type, live:b.live, data:b.dataJson ?? {}, pinned:b.pinnedJson ?? null, citations:b.citations ?? [] }; }

export async function GET(_:NextRequest,{ params }:{params:{id:string}}) {
  const list = await prisma.kbBlock.findMany({
    where:{ pageId: params.id },
    orderBy:{ ord:'asc' },
    select:{ id:true,pageId:true,ord:true,type:true,live:true,dataJson:true,pinnedJson:true,citations:true }
  });
  return NextResponse.json({ ok:true, blocks: list.map(norm) }, { headers:{'Cache-Control':'no-store'}});
}

export async function POST(req:NextRequest,{ params }:{params:{id:string}}) {
  const b = Create.parse(await req.json());
  const max = await prisma.kbBlock.aggregate({
    _max: { ord:true }, where: { pageId: params.id }
  });
  const ord = (b.ord ?? ((max._max.ord ?? -1) + 1));
  const row = await prisma.kbBlock.create({
    data: {
      pageId: params.id, ord, type: b.type as any, live: b.live,
      dataJson: b.data ?? {}, citations: b.citations ?? [], createdById: 'system'
    },
    select:{ id:true,pageId:true,ord:true,type:true,live:true,dataJson:true,pinnedJson:true,citations:true }
  });
  return NextResponse.json({ ok:true, block: norm(row) });
}

export async function PATCH(req:NextRequest,{ params }:{params:{id:string}}) {
  const b = Reorder.parse(await req.json());
  await prisma.$transaction(
    b.order.map(item =>
      prisma.kbBlock.update({ where: { id: item.id }, data: { ord: item.ord } })
    )
  );
  return NextResponse.json({ ok:true });
}
