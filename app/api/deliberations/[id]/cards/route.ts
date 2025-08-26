import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prismaclient';
import crypto from 'crypto';

const SaveSchema = z.object({
  authorId: z.string(),
  status: z.enum(['draft','published']),
  claimText: z.string().min(2),
  reasonsText: z.array(z.string()).min(1),
  evidenceLinks: z.array(z.string().url()).optional().default([]),
  anticipatedObjectionsText: z.array(z.string()).optional().default([]),
  counterText: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  hostEmbed: z.enum(['article','post','room_thread']).optional(),
  hostId: z.string().optional(),
  cardId: z.string().optional(), // for updates
});

function hashMoid(payload: any) {
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const parsed = SaveSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const deliberationId = params.id;
  const {
    authorId, status, claimText, reasonsText, evidenceLinks,
    anticipatedObjectionsText, counterText, confidence, hostEmbed, hostId, cardId
  } = parsed.data;

  const moid = hashMoid({ claimText, reasonsText, evidenceLinks, counterText, anticipatedObjectionsText });

  if (cardId) {
    const updated = await prisma.deliberationCard.update({
      where: { id: cardId },
      data: {
        claimText, reasonsText, evidenceLinks,
        anticipatedObjectionsText, counterText: counterText ?? null,
        confidence: confidence ?? null,
        status, hostEmbed: hostEmbed ?? null, hostId: hostId ?? null,
        moid,
      },
    });
    return NextResponse.json({ ok: true, card: updated });
  }

  const created = await prisma.deliberationCard.create({
    data: {
      deliberationId,
      authorId,
      claimText,
      reasonsText,
      evidenceLinks,
      anticipatedObjectionsText,
      counterText: counterText ?? null,
      confidence: confidence ?? null,
      status,
      hostEmbed: hostEmbed ?? null,
      hostId: hostId ?? null,
      moid,
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, id: created.id });
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const cards = await prisma.deliberationCard.findMany({
    where: { deliberationId: params.id, status: 'published' },
    orderBy: { createdAt: 'desc' },
    include: { cardCitations: true },
  });
  return NextResponse.json({ cards });
}
