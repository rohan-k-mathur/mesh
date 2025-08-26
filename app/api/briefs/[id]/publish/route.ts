import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prismaclient';
import { writeLogbook } from '@/lib/governance/writers';

const PublishSchema = z.object({
  createdById: z.string(),
  compiledFromDeliberationId: z.string().optional(),
  sections: z.object({
    overview: z.string().optional(),
    positions: z.string().optional(),
    evidence: z.string().optional(),
    openQuestions: z.string().optional(),
    decision: z.string().optional(),
  }),
  citations: z.array(z.any()).optional().default([]),
  linkSources: z.array(z.object({
    sourceType: z.enum(['card','argument','post']),
    sourceId: z.string(),
  })).optional().default([]),
  roomId: z.string(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(()=> ({}));
  const p = PublishSchema.safeParse(body);
  if (!p.success) return NextResponse.json({ error: p.error.flatten() }, { status: 400 });

  const brief = await prisma.brief.findUnique({ where: { id: params.id } });
  if (!brief) return NextResponse.json({ error: 'brief_not_found' }, { status: 404 });

  const last = await prisma.briefVersion.findFirst({
    where: { briefId: brief.id }, orderBy: { number: 'desc' }
  });
  const nextNum = (last?.number ?? 0) + 1;

  const version = await prisma.$transaction(async (tx) => {
    const v = await tx.briefVersion.create({
      data: {
        briefId: brief.id,
        number: nextNum,
        compiledFromDeliberationId: p.data.compiledFromDeliberationId ?? null,
        sectionsJson: p.data.sections as any,
        citations: p.data.citations as any,
        createdById: p.data.createdById,
      },
    });
    if (p.data.linkSources?.length) {
      await tx.briefLink.createMany({
        data: p.data.linkSources.map(ls => ({
          briefVersionId: v.id, sourceType: ls.sourceType, sourceId: ls.sourceId
        })),
      });
    }
    await tx.brief.update({
      where: { id: brief.id },
      data: { status: 'published', currentVersionId: v.id },
    });
    return v;
  });

  await writeLogbook({
    roomId: p.data.roomId,
    entryType: 'NOTE',
    summary: `Brief published: ${brief.title} (v${version.number})`,
    payload: { briefId: brief.id, versionId: version.id },
  });

  return NextResponse.json({ ok: true, versionId: version.id, number: version.number, slug: brief.slug });
}
