// app/api/arguments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prismaclient';
import { getCurrentUserId } from '@/lib/serverutils';
 import { buildDiagramForArgument } from '@/lib/arguments/diagram';


export const dynamic = 'force-dynamic';

const UpdateSchema = z.object({
  quantifier: z.enum(['SOME','MANY','MOST','ALL']).nullable().optional(),
  modality:   z.enum(['COULD','LIKELY','NECESSARY']).nullable().optional(),
});

const selectArg = {
  // core identity / linkage
  id: true,
  deliberationId: true,
  claimId: true,
  // content
  text: true,
  sources: true,
  confidence: true,
  isImplicit: true,
  // qualifiers / media
  quantifier: true,
  modality: true,
  mediaType: true,
  mediaUrl: true,
  // bookkeeping
  createdAt: true,
} as const;


export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const id = decodeURIComponent(String(params.id || '')).trim();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const u = new URL(req.url);
  const view = (u.searchParams.get('view') || '').toLowerCase();
  if (view === 'diagram') {
    // Option A: fetch a persisted diagram row (if you have this model)
    try {
      const diag = await prisma.argumentDiagram.findUnique({
        where: { id },
        include: {
          statements: true,
          inferences: { include: { premises: { include: { statement: true } }, conclusion: true } },
          evidence:   { include: { evidence: true } },
        },
      });
      if (diag) {
        return NextResponse.json({ ok: true, diagram: diag }, { headers: { 'Cache-Control': 'no-store' } });
      }
    } catch {}

    // Option B: compute a transient diagram from current data
    const computed = await buildDiagramForArgument(id);
    if (!computed) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ ok: true, diagram: computed }, { headers: { 'Cache-Control': 'no-store' } });
  }

  // 1) Try by argument id (authoritative)
  const arg = await prisma.argument.findUnique({ where: { id }, select: selectArg });
  if (arg) {
    return NextResponse.json({ argument: arg }, { headers: { 'Cache-Control': 'no-store' } });
  }

  // 2) (Optional, safe) If someone accidentally sent a claimId, return the most recent argument for that claim
  const alt = await prisma.argument.findFirst({
    where: { claimId: id },
    orderBy: { createdAt: 'desc' },
    select: selectArg,
  });
  if (alt) {
    return NextResponse.json({ argument: alt, via: 'claimId' }, { headers: { 'Cache-Control': 'no-store' } });
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  // Author-only policy; drop this section if you later decide to allow public updates.
  const userId = await getCurrentUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const owner = await prisma.argument.findUnique({
    where: { id: params.id },
    select: { authorId: true },
  });
  if (!owner) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (String(owner.authorId) !== String(userId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Partial update: only touch fields explicitly present; allow null to clear.
  const data: Record<string, any> = {};
  if ('quantifier' in parsed.data) data.quantifier = parsed.data.quantifier ?? null;
  if ('modality'   in parsed.data) data.modality   = parsed.data.modality   ?? null;

  if (!Object.keys(data).length) {
    return NextResponse.json({ ok: true, noop: true });
  }

  try {
    const updated = await prisma.argument.update({
      where: { id: params.id },
      data,
      select: selectArg,
    });
    return NextResponse.json({ ok: true, argument: updated });
  } catch (e: any) {
    // Prisma P2025 = record to update not found (race)
    if (e?.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    throw e;
  }
}
