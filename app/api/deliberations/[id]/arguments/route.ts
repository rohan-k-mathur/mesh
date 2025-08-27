import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prismaclient';
import { getCurrentUserId } from '@/lib/serverutils';

// ---------- Zod schemas ----------
const CreateSchema = z.object({
  text: z.string().min(1).max(10_000),
  sources: z.array(z.string().url()).optional().default([]),
  confidence: z.number().min(0).max(1).optional(),
  isImplicit: z.boolean().optional(),
  quantifier: z.enum(['SOME','MANY','MOST','ALL']).optional(),
  modality: z.enum(['COULD','LIKELY','NECESSARY']).optional(),
  mediaType: z.enum(['text','image','video','audio']).optional().default('text'),
  mediaUrl: z.string().url().optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const deliberationId = params.id;

  const rows = await prisma.argument.findMany({
    where: { deliberationId },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      deliberationId: true,
      authorId: true,
      text: true,
      sources: true,
      confidence: true,
      isImplicit: true,
      quantifier: true,
      modality: true,
      mediaType: true,
      mediaUrl: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ arguments: rows });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const deliberationId = params.id;
    const body = await req.json().catch(() => ({}));
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const d = parsed.data;

    // If mediaType != 'text', a mediaUrl is strongly recommended
    if (d.mediaType !== 'text' && !d.mediaUrl) {
      return NextResponse.json({ error: 'mediaUrl required for non-text mediaType' }, { status: 400 });
    }

    const created = await prisma.argument.create({
      data: {
        deliberationId,
        authorId: String(userId),
        text: d.text,
        sources: d.sources ?? [],
        confidence: d.confidence ?? null,
        isImplicit: d.isImplicit ?? false,
        quantifier: d.quantifier ?? null,
        modality: d.modality ?? null,
        mediaType: d.mediaType ?? 'text',
        mediaUrl: d.mediaUrl ?? null,
      },
    });

    return NextResponse.json({ ok: true, argument: created });
  } catch (e: any) {
    console.error('[arguments] failed', e);
    return NextResponse.json({ error: e?.message ?? 'Invalid request' }, { status: 400 });
  }
}
