// app/api/works/[id]/hermeneutic/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prismaclient';
import { getUserFromCookies } from '@/lib/serverutils';

export const dynamic = 'force-dynamic';

const PutSchema = z.object({
  corpusUrl: z.string().url().optional().or(z.literal('')).optional(),
  facts: z.array(z.object({
    id: z.string(),
    text: z.string(),
    source: z.string().optional(),
    justification: z.enum(['PERCEPTION','INSTRUMENT','INTERPRETIVE','TESTIMONY']).optional(),
  })).optional(),
  hypotheses: z.array(z.object({
    id: z.string(),
    text: z.string(),
    notes: z.string().optional(),
  })).optional(),
  plausibility: z.array(z.object({
    hypothesisId: z.string(),
    score: z.number().min(0).max(1),
  })).optional(),
  selectedIds: z.array(z.string()).optional(),
});

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const workId = params.id;
  const [work, hp] = await Promise.all([
    prisma.theoryWork.findUnique({ where: { id: workId }, select: { id: true, authorId: true, theoryType: true } }),
    prisma.workHermeneuticProject.findUnique({ where: { workId } }),
  ]);
  if (!work) return NextResponse.json({ error: 'Work not found' }, { status: 404 });

  return NextResponse.json({
    ok: true,
    work: { id: work.id, theoryType: work.theoryType },
    hermeneutic: hp ?? {
      id: null,
      workId,
      corpusUrl: '',
      facts: [],
      hypotheses: [],
      plausibility: [],
      selectedIds: [],
    },
  });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const workId = params.id;
  const user = await getUserFromCookies();
  if (!user?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const work = await prisma.theoryWork.findUnique({ where: { id: workId } });
  if (!work) return NextResponse.json({ error: 'Work not found' }, { status: 404 });
  if (String(work.authorId) !== String(user.userId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = PutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
  }

  const payload = parsed.data;
  const hp = await prisma.workHermeneuticProject.upsert({
    where: { workId },
    create: {
      workId,
      corpusUrl: payload.corpusUrl || null,
      facts: payload.facts ?? [],
      hypotheses: payload.hypotheses ?? [],
      plausibility: payload.plausibility ?? [],
      selectedIds: payload.selectedIds ?? [],
    },
    update: {
      corpusUrl: payload.corpusUrl || null,
      facts: payload.facts ?? [],
      hypotheses: payload.hypotheses ?? [],
      plausibility: payload.plausibility ?? [],
      selectedIds: payload.selectedIds ?? [],
    },
  });

  return NextResponse.json({ ok: true, hermeneutic: hp });
}
