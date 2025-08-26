import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prismaclient';
import { getCurrentUserId } from '@/lib/serverutils';
import { asUserIdString } from '@/lib/auth/normalize';

const Body = z.object({
  text: z.string().min(1).max(5000),
  sources: z.array(z.string().url()).optional(),
  confidence: z.number().min(0).max(1).optional(),
  isImplicit: z.boolean().optional(),
    quantifier: z.enum(['SOME','MANY','MOST','ALL']).optional(),
  modality: z.enum(['COULD','LIKELY','NECESSARY']).optional(),
  mediaType: z.enum(['text','image','video','audio']).optional(),
  mediaUrl: z.string().url().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
    const deliberationId = params.id;
    const list = await prisma.argument.findMany({
      where: { deliberationId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, text: true, confidence: true, createdAt: true, authorId: true }
    });
    return NextResponse.json({ ok: true, arguments: list });
  }

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userIdStr = asUserIdString(userId);
  const deliberationId = params.id;
  const body = await req.json();
  const input = Body.safeParse(body);
  if (!input.success) return NextResponse.json({ error: input.error.flatten() }, { status: 400 });

  // (Optional) enforce slow-mode / rate-limit elsewhere (edge/middleware)
  const arg = await prisma.argument.create({
    data: {
      deliberationId,
      authorId: userIdStr,
      text: input.data.text,
      sources: input.data.sources ?? null,
      confidence: input.data.confidence ?? null,
      isImplicit: input.data.isImplicit ?? false,
            quantifier: input.data.quantifier ?? null,
      modality: input.data.modality ?? null,
      mediaType: input.data.mediaType ?? 'text',
      mediaUrl: input.data.mediaUrl ?? null,
    },
  });
  return NextResponse.json({ ok: true, argument: arg });
}
