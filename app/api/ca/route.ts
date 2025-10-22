// app/api/ca/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';
import { z } from 'zod';
import { getCurrentUserId } from '@/lib/serverutils';
import { TargetType } from '@prisma/client';
const NO_STORE = { headers: { 'Cache-Control': 'no-store' } } as const;

const CreateCA = z.object({
  deliberationId: z.string().min(6),
  schemeKey: z.string().optional(),              // optional catalog typing
  // exactly one of these must be set for each side
  conflictingClaimId: z.string().optional(),
  conflictingArgumentId: z.string().optional(),
  conflictedClaimId: z.string().optional(),
  conflictedArgumentId: z.string().optional(),
  // optional bridge for legacy AF counts
  legacyAttackType: z.enum(['REBUTS','UNDERCUTS','UNDERMINES']).optional(),
  legacyTargetScope: z.enum(['conclusion','inference','premise']).optional(),
  // NEW: metadata for CQ tracking
  metaJson: z.record(z.any()).optional(),
});

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId().catch(()=>null);
  if (!userId) return NextResponse.json({ error:'Unauthorized' }, { status:401, ...NO_STORE });

  const p = CreateCA.safeParse(await req.json().catch(()=>({})));
  if (!p.success) return NextResponse.json({ error: p.error.flatten() }, { status:400, ...NO_STORE });
  const d = p.data;

  const left = [d.conflictingClaimId, d.conflictingArgumentId].filter(Boolean).length;
  const right = [d.conflictedClaimId, d.conflictedArgumentId].filter(Boolean).length;
  if (left !== 1 || right !== 1) {
    return NextResponse.json({ error:'CA requires exactly one conflicting element and one conflicted element' }, { status:400, ...NO_STORE });
  }

  // resolve optional scheme
  const scheme = d.schemeKey
    ? await prisma.conflictScheme.findUnique({ where: { key: d.schemeKey }, select: { id:true, legacyAttackType:true, legacyTargetScope:true } })
    : null;

  const created = await prisma.conflictApplication.create({
    data: {
      deliberationId: d.deliberationId,
      ...(scheme?.id ? { scheme: { connect: { id: scheme.id } } } : {}),
      createdById: String(userId),
      conflictingClaimId: d.conflictingClaimId ?? null,
      conflictingArgumentId: d.conflictingArgumentId ?? null,
      conflictedClaimId: d.conflictedClaimId ?? null,
      conflictedArgumentId: d.conflictedArgumentId ?? null,
      // legacy AF bridge (optional)
      legacyAttackType: d.legacyAttackType ?? scheme?.legacyAttackType ?? null,
      legacyTargetScope: d.legacyTargetScope ?? scheme?.legacyTargetScope ?? null,
      // NEW: CQ tracking metadata
      metaJson: d.metaJson ?? {},
    },
    select: { id:true }
  });
  
  // Auto-create WHY dialogue move when AIF attack is created
  // This unifies the AIF graph system with the dialogical move system
  try {
    const targetType = d.conflictedArgumentId ? 'argument' : 'claim';
    const targetId = d.conflictedArgumentId || d.conflictedClaimId;
    
    if (targetId) {
      // Generate expression based on attack type
      const attackLabels = {
        'REBUTS': 'I challenge this conclusion',
        'UNDERCUTS': 'I challenge the reasoning',
        'UNDERMINES': 'I challenge this premise',
      };
      const expression = attackLabels[d.legacyAttackType as keyof typeof attackLabels] || 'I challenge this';
      
      // ✨ PHASE 3: Use real CQ information from metaJson if available
      const cqId = (d.metaJson as any)?.cqId || `aif_attack_${created.id}`;
      const cqText = (d.metaJson as any)?.cqText;
      const schemeKey = (d.metaJson as any)?.schemeKey;
      
      // Create WHY move linked to this attack
      await prisma.dialogueMove.create({
        data: {
          deliberationId: d.deliberationId,
          targetType: targetType as TargetType,
          targetId,
          kind: 'WHY',
          actorId: String(userId),
          payload: {
            cqId,
            schemeKey: schemeKey || undefined,
            locusPath: '0',
            expression: (d.metaJson as any)?.cqContext || expression,
            attackType: d.legacyAttackType,
            conflictApplicationId: created.id, // Link back to AIF attack
            cqText: cqText || undefined, // Include full CQ text for reference
          },
          signature: `WHY:${targetType}:${targetId}:${cqId}`,
        },
      });
      
      console.log('[ca] Auto-created WHY move for AIF attack:', {
        attackId: created.id,
        attackType: d.legacyAttackType,
        targetType,
        targetId,
        cqId,
        cqText: cqText ? cqText.substring(0, 50) + '...' : 'none',
      });
    }
  } catch (err) {
    console.error('[ca] Failed to auto-create WHY move:', err);
    // Don't fail the whole request if WHY creation fails
  }
  
  // inside POST, after create ConflictApplication (in same transaction if you prefer)
const { schemeKey, cqKey, conflictedArgumentId } = d as any;
if (schemeKey && cqKey && conflictedArgumentId) {
  await prisma.cQStatus.updateMany({
    where: { targetType: 'argument' as TargetType, targetId: conflictedArgumentId, schemeKey, cqKey },
    data: { status: 'answered', satisfied: true }
  }).catch(() => {});
}

  // Optional AF materialization (only when attacking an Argument)
  if (d.legacyAttackType && d.conflictedArgumentId && d.conflictingArgumentId) {
  await prisma.argumentEdge.create({
    data: {
      deliberationId: d.deliberationId,
      createdById: String(userId),
      fromArgumentId: d.conflictingArgumentId,
      toArgumentId:   d.conflictedArgumentId,
      type: d.legacyAttackType === 'UNDERCUTS' ? 'undercut' : 'rebut',
      attackType: d.legacyAttackType,
      targetScope: d.legacyTargetScope ?? (d.legacyAttackType === 'UNDERCUTS' ? 'inference' : 'conclusion'),
      targetClaimId: null, targetPremiseId: null, cqKey: null,
    }
  }).catch(()=>{});
}

  return NextResponse.json({ ok:true, id: created.id }, NO_STORE);
}

const ListCA = z.object({
  deliberationId: z.string().min(6).optional(),
  targetArgumentId: z.string().optional(),
  targetClaimId: z.string().optional(),
  limit: z.coerce.number().min(1).max(200).default(50),
});

export async function GET(req: NextRequest) {
  const u = new URL(req.url);
  const p = ListCA.safeParse({
    deliberationId: u.searchParams.get('deliberationId') ?? undefined,
    targetArgumentId: u.searchParams.get('targetArgumentId') ?? undefined,
    targetClaimId: u.searchParams.get('targetClaimId') ?? undefined,
    limit: u.searchParams.get('limit') ?? undefined,
  });
  if (!p.success) return NextResponse.json({ error: p.error.flatten() }, { status:400, ...NO_STORE });

  const { deliberationId, targetArgumentId, targetClaimId, limit } = p.data;
  const where: any = {};
  if (deliberationId) where.deliberationId = deliberationId;
  if (targetArgumentId) where.OR = [{ conflictedArgumentId: targetArgumentId }, { conflictingArgumentId: targetArgumentId }];
  if (targetClaimId) where.OR = [{ conflictedClaimId: targetClaimId }, { conflictingClaimId: targetClaimId }];

  const items = await prisma.conflictApplication.findMany({
    where, take: limit, orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ ok:true, items }, NO_STORE);
}
