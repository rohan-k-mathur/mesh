import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prismaclient';

const Body = z.object({
  fromId: z.string().min(6),
  toId: z.string().min(6),
  kind: z.enum(['supports','rebuts','objects','undercuts','refines','restates','clarifies','depends_on']),
  thread: z.string().optional(),
  ord: z.number().int().positive().optional(),
  rationale: z.string().optional()
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const sheetId = params.id;
  const { fromId, toId, kind, thread, ord, rationale } = Body.parse(await req.json());
  const edge = await prisma.debateEdge.create({
    data: { sheetId, fromId, toId, kind, thread: thread ?? null, ord: ord ?? null, rationale: rationale ?? null },
    select: { id: true }
  });
  return NextResponse.json({ ok: true, edge });
}
