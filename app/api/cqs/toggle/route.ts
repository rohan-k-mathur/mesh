import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prismaclient';
import { getCurrentUserId } from '@/lib/serverutils';
import { suggestionForCQ } from '@/lib/argumentation/cqSuggestions';
import { resolveClaimContext } from '@/lib/server/resolveRoom';
import { createClaimAttack } from '@/lib/argumentation/createClaimAttack';

const BodySchema = z.object({
    targetType: z.literal('claim'),
    targetId: z.string().min(1),
    schemeKey: z.string().min(1),
    cqKey: z.string().min(1),
    satisfied: z.boolean(),
    deliberationId: z.string().optional(),   // 👈 allow fallback
    attachSuggestion: z.boolean().optional(),
    attackerClaimId: z.string().min(1).optional(),
  });

  export async function POST(req: NextRequest) {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
  
    const { targetId, schemeKey, cqKey, satisfied, attachSuggestion, attackerClaimId, deliberationId: delibFromBody } = parsed.data;
  
    // Resolve deliberation + room
    let { deliberationId, roomId } = await resolveClaimContext(targetId);
    if (!deliberationId && delibFromBody) {
      deliberationId = delibFromBody;
      const room = await prisma.deliberation.findUnique({
        where: { id: deliberationId },
        select: { roomId: true },
      });
      roomId = room?.roomId ?? null;
    }
    if (!deliberationId) {
      return NextResponse.json({ error: 'Unable to resolve deliberation/room for claim' }, { status: 404 });
    }
  
    // Validate scheme
    const scheme = await prisma.argumentScheme.findUnique({ where: { key: schemeKey }, select: { key: true } });
    if (!scheme) return NextResponse.json({ error: 'Unknown schemeKey' }, { status: 400 });
  
    // Upsert CQStatus
    const status = await prisma.cQStatus.upsert({
      where: {
        targetType_targetId_schemeKey_cqKey: { targetType: 'claim', targetId, schemeKey, cqKey },
      },
      update: { satisfied, updatedAt: new Date() },
      create: { targetType: 'claim', targetId, schemeKey, cqKey, satisfied, createdById: String(userId), roomId },
    });
  
    // Handle attach suggestion
    let edgeCreated = false;
    if (attachSuggestion && !satisfied) {
      const suggest = suggestionForCQ(schemeKey, cqKey);
      if (suggest && attackerClaimId) {
        await createClaimAttack({
          fromClaimId: attackerClaimId,
          toClaimId: targetId,
          deliberationId,
          suggestion: suggest,
        });
        edgeCreated = true;
      } else if (suggest && !attackerClaimId) {
        return NextResponse.json({ error: 'attackerClaimId required to attach suggestion' }, { status: 400 });
      }
    }
  
    return NextResponse.json({ ok: true, status, edgeCreated });
  }
  