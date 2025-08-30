import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prismaclient';
import { getCurrentUserId } from '@/lib/serverutils';
import crypto from 'crypto';
import { mintClaimMoid } from '@/lib/ids/mintMoid';


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
  quantifier: z.enum(["SOME","MANY","MOST","ALL"]).optional(),
modality: z.enum(["COULD","LIKELY","NECESSARY"]).optional(),
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
      deliberationId: true,
      authorId: true,
      status: true,
      createdAt: true,
      claimId: true,             // ✅ include claimId
      claimText: true,
      reasonsText: true,
      evidenceLinks: true,
      anticipatedObjectionsText: true,
      counterText: true,
      confidence: true,
      hostEmbed: true,
      hostId: true,
      warrantText: true,
      // Optionally include claim fields:
      claim: {
        select: {
          id: true,
          text: true,
        },
      },
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
        },
      });
      return NextResponse.json({ ok: true, card: updated });
    }
    
         // create or reuse claim first
const moidClaim = crypto.createHash('sha256').update(input.claimText).digest('hex');
const claim = await prisma.claim.upsert({
  where: { moid: moidClaim },
  update: {},
  create: {
    text: input.claimText,
    createdById: String(userId),
    deliberationId,
    moid: moidClaim,
  },
});

// then create the card linked to that claim
const created = await prisma.deliberationCard.create({
  data: {
    deliberationId,
    authorId: String(userId),
    claimText: input.claimText,
    claimId: claim.id,
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
  },
});

// 👇 auto-create an Argument that carries qualifier info
await prisma.argument.create({
  data: {
    deliberationId,
    claimId: claim.id,
    text: input.claimText,
    quantifier: input.quantifier ?? null,
    modality: input.modality ?? null,
    confidence: input.confidence ?? null,
    createdById: String(userId),
  },
});


// Auto-harvest reasons -> supports edges
for (const r of input.reasonsText) {
  if (!r.trim()) continue;
  const moid = crypto.createHash('sha256').update(r.trim()).digest('hex');
  const reasonClaim = await prisma.claim.upsert({
    where: { moid },
    update: {},
    create: {
      text: r.trim(),
      createdById: String(userId),
      deliberationId,
      moid,
    },
  });
  await prisma.claimEdge.upsert({
    where: {
      unique_from_to_type_attack: {
        fromClaimId: reasonClaim.id,
        toClaimId: claim.id,
        type: 'supports',
        attackType: 'SUPPORTS',
      },
    },
    update: {},
    create: {
      deliberationId,
      fromClaimId: reasonClaim.id,
      toClaimId: claim.id,
      type: 'supports',
      attackType: 'SUPPORTS',
    },
  });
}
// Auto-harvest objections -> rebuts edges
for (const o of input.anticipatedObjectionsText) {
  if (!o.trim()) continue;
  try {
    const moid = crypto.createHash('sha256').update(o.trim()).digest('hex');
    const objClaim = await prisma.claim.upsert({
      where: { moid },
      update: {},
      create: {
        text: o.trim(),
        createdById: String(userId),
        deliberationId,
        moid,
      },
    });

    await prisma.claimEdge.upsert({
      where: {
        unique_from_to_type_attack: {
          fromClaimId: objClaim.id,
          toClaimId: claim.id,
          type: 'rebuts',
          attackType: 'REBUTS',
        },
      },
      update: { targetScope: 'conclusion' },
      create: {
        deliberationId,
        fromClaimId: objClaim.id,
        toClaimId: claim.id,
        type: 'rebuts',
        attackType: 'REBUTS',
        targetScope: 'conclusion',
      },
    });
  } catch (err) {
    console.error(`[auto-harvest objection] failed for "${o}"`, err);
    // you could also collect these in an array if you want to report partial failures
  }
}

// Auto-harvest warrant text -> ClaimWarrant
if (input.warrantText?.trim()) {
  try {
    await prisma.claimWarrant.upsert({
      where: { claimId: claim.id },
      update: { text: input.warrantText.trim() },
      create: {
        claimId: claim.id,
        text: input.warrantText.trim(),
        createdBy: String(userId),
      },
    });
  } catch (err) {
    console.error(`[auto-harvest warrant] failed for claim ${claim.id}`, err);
  }
}

     
return NextResponse.json({
  ok: true,
  card: created,
  harvested: { reasons: input.reasonsText.length, objections: input.anticipatedObjectionsText.length }
});
  } catch (e: any) {
    console.error('[cards] failed', e);
    return NextResponse.json({ error: e?.message ?? 'Invalid request' }, { status: 400 });
  }
}
