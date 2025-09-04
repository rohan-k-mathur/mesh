// app/api/knowledge-edges/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';
import { z } from 'zod';
import { getUserFromCookies } from '@/lib/serverutils';

const Body = z.object({
  deliberationId: z.string(),
  kind: z.enum(['SUPPLIES_PREMISE','REVISES','CHALLENGES','REBUTS','UNDERCUTS','UNDERMINES','SUPPORTS']),
  fromWorkId: z.string().optional(),
  fromClaimId: z.string().optional(),
  toWorkId: z.string().optional(),
  toClaimId: z.string().optional(),
  meta: z.any().optional(),
}).refine(b => (b.fromWorkId || b.fromClaimId) && (b.toWorkId || b.toClaimId), {
  message: 'Need a from* and a to* id',
});

export async function POST(req: NextRequest) {
  const user = await getUserFromCookies();
  if (!user?.userId) return NextResponse.json({ error:'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const parsed = Body.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  // Optional de-dupe (same from/to/kind)
  const { deliberationId, fromWorkId, fromClaimId, toWorkId, toClaimId, kind, meta } = parsed.data;
  const exists = await prisma.knowledgeEdge.findFirst({
    where: { deliberationId, fromWorkId, fromClaimId, toWorkId, toClaimId, kind },
    select: { id: true }
  });
  if (exists) return NextResponse.json({ ok:true, edgeId: exists.id, dedup:true }, { status: 200 });

  const edge = await prisma.knowledgeEdge.create({ data: parsed.data });
  return NextResponse.json({ ok:true, edge }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const deliberationId = req.nextUrl.searchParams.get('deliberationId') ?? '';
  const kind = req.nextUrl.searchParams.get('kind') ?? undefined;

  if (!deliberationId) return NextResponse.json({ ok:true, edges: [] });

  const edges = await prisma.knowledgeEdge.findMany({
    where: { deliberationId, ...(kind ? { kind: kind as any } : {}) },
    orderBy: { createdAt: 'desc' },
  });

  // Hydrate titles minimally
  const workIds = Array.from(new Set(edges.flatMap(e => [e.fromWorkId, e.toWorkId]).filter(Boolean) as string[]));
  const claimIds = Array.from(new Set(edges.flatMap(e => [e.fromClaimId, e.toClaimId]).filter(Boolean) as string[]));

  const [works, claims] = await Promise.all([
    workIds.length ? prisma.theoryWork.findMany({ where: { id: { in: workIds }}, select: { id:true, title:true, theoryType:true }}) : Promise.resolve([]),
    claimIds.length ? prisma.claim.findMany({ where: { id: { in: claimIds }}, select: { id:true, text:true }}) : Promise.resolve([]),
  ]);

  return NextResponse.json({ ok:true, edges, works, claims });
}
