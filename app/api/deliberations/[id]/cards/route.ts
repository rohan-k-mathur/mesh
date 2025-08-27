import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prismaclient';
import { getCurrentUserId } from '@/lib/serverutils';
import crypto from 'crypto';

const SaveSchema = z.object({
  claimText: z.string().min(2),
  reasonsText: z.array(z.string()).min(1),
  evidenceLinks: z.array(z.string().url()).optional().default([]),
  anticipatedObjectionsText: z.array(z.string()).optional().default([]),
  counterText: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  status: z.enum(['draft','published']).default('draft'),
  hostEmbed: z.enum(['article','post','room_thread']).optional(),
  hostId: z.string().optional(),
  warrantText: z.string().optional(), // optional field we discussed
  cardId: z.string().optional(),
});

const canonicalize = (o: any) =>
  JSON.stringify(o, Object.keys(o).sort(), 2)
    .normalize('NFC')
    .replace(/\s+/g, ' ')
    .trim();

function mintMoid(payload: any) {
  const canon = canonicalize(payload);
  return crypto.createHash('sha256').update(canon).digest('hex');
}

// GET /api/deliberations/[id]/cards?status=published|draft
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const deliberationId = params.id;
  const url = new URL(req.url);
  const status = url.searchParams.get('status') ?? undefined;

  const where: any = { deliberationId };
  if (status) where.status = status;

  const rows = await prisma.deliberationCard.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {

      id: true,
      deliberationId: true,               // 👈 ChallengeWarrantCard needs this
      authorId: true,
      status: true,
      createdAt: true,
      claimText: true,
      reasonsText: true,
      evidenceLinks: true,
      anticipatedObjectionsText: true,
      counterText: true,
      confidence: true,
      hostEmbed: true,
      hostId: true,
      warrantText: true,                  // 👈 return it
    },
  });
  return NextResponse.json({ cards: rows });
}

// POST create/update card (server derives author)
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const deliberationId = params.id;
    const body = await req.json().catch(() => ({}));
    const input = SaveSchema.parse(body);

    // compute MOID from content fields (not status/host)
    const moid = mintMoid({
      claimText: input.claimText,
      reasonsText: input.reasonsText,
      evidenceLinks: input.evidenceLinks,
      anticipatedObjectionsText: input.anticipatedObjectionsText,
      counterText: input.counterText ?? null,
      confidence: input.confidence ?? null,
      warrantText: input.warrantText ?? null,
    });

    if (input.cardId) {
      // update existing
      const updated = await prisma.deliberationCard.update({
        where: { id: input.cardId },
        data: {
          claimText: input.claimText,
          reasonsText: input.reasonsText,
          evidenceLinks: input.evidenceLinks,
          anticipatedObjectionsText: input.anticipatedObjectionsText,
          counterText: input.counterText ?? null,
          confidence: input.confidence ?? null,
          status: input.status,
          warrantText: input.warrantText ?? null,
          hostEmbed: input.hostEmbed ?? null,
          hostId: input.hostId ?? null,
          moid,
          // warrantText: input.warrantText ?? null,
        },
      });
      return NextResponse.json({ ok: true, card: updated });
    }

    // create new card
    const created = await prisma.deliberationCard.create({
      data: {
        deliberationId,
        authorId: String(userId),
        claimText: input.claimText,
        reasonsText: input.reasonsText,
        evidenceLinks: input.evidenceLinks,
        anticipatedObjectionsText: input.anticipatedObjectionsText,
        counterText: input.counterText ?? null,
        confidence: input.confidence ?? null,
        status: input.status,
        hostEmbed: input.hostEmbed ?? null,
        warrantText: input.warrantText ?? null,
        hostId: input.hostId ?? null,
        moid,
        // warrantText: input.warrantText ?? null,
      },
    });
    return NextResponse.json({ ok: true, card: created });
  } catch (e: any) {
    console.error('[cards] failed', e);
    return NextResponse.json({ error: e?.message ?? 'Invalid request' }, { status: 400 });
  }
}
