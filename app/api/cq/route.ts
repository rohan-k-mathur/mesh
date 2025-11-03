// app/api/cq/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';
const NO_STORE = { headers: { 'Cache-Control': 'no-store' } } as const;

export async function POST(req: NextRequest) {
  const b = await req.json().catch(()=> ({}));
  const { action, deliberationId, argumentId, schemeKey, cqKey, authorId, resolution, attachCA } = b ?? {};
  if (!deliberationId || !argumentId || !schemeKey || !cqKey) {
    return NextResponse.json({ ok:false, error:'Missing deliberationId|argumentId|schemeKey|cqKey' }, { status:400, ...NO_STORE });
  }

  if (action === 'open') {
    await prisma.cQStatus.upsert({
      where: { targetType_targetId_schemeKey_cqKey: { targetType: 'argument', targetId: argumentId, schemeKey, cqKey } },
      create: { targetType: 'argument', targetId: argumentId, argumentId, status:'open', schemeKey, cqKey, satisfied:false, createdById: String(authorId||'self') },
      update: { status:'open', satisfied:false },
    });
    return NextResponse.json({ ok:true }, NO_STORE);
  }

  if (action === 'resolve' || action === 'close') {
    await prisma.cQStatus.updateMany({
      where: { targetType: 'argument', targetId: argumentId, schemeKey, cqKey },
      data: { status: resolution === 'answered' ? 'answered' : 'closed', satisfied: resolution === 'answered' },
    }).catch(()=>{});

    // Optional: create a CA edge that embodies the answer/objection (if provided)
    if (attachCA?.attackType) {
      // ✨ PHASE 1: Create ATTACK DialogueMove first
      let attackMoveId: string | null = null;
      try {
        const targetType = attachCA.conflictedArgumentId ? 'argument' : 'claim';
        const targetId = attachCA.conflictedArgumentId ?? attachCA.conflictedClaimId;
        
        if (targetId) {
          const attackLabels: Record<string, string> = {
            'REBUTS': 'I challenge this conclusion',
            'UNDERCUTS': 'I challenge the reasoning',
            'UNDERMINES': 'I challenge this premise',
          };
          const expression = attackLabels[attachCA.attackType] || 'I challenge this';
          
          const attackMove = await prisma.dialogueMove.create({
            data: {
              deliberationId,
              targetType: targetType as any,
              targetId,
              kind: 'ATTACK',
              actorId: String(authorId || 'self'),
              payload: {
                cqKey,
                schemeKey,
                locusPath: '0',
                expression,
                attackType: attachCA.attackType,
              },
              signature: `ATTACK:${targetType}:${targetId}:cq_${cqKey}`,
              endsWithDaimon: false,
            },
          });
          attackMoveId = attackMove.id;
          
          console.log('[cq] Created ATTACK move for CQ resolution:', {
            attackMoveId: attackMove.id,
            cqKey,
            targetId,
          });
        }
      } catch (err) {
        console.error('[cq] Failed to create ATTACK move:', err);
      }
      
      await prisma.conflictApplication.create({
        data: {
          deliberationId,
          createdById: String(authorId || 'self'),
          legacyAttackType: attachCA.attackType,
          legacyTargetScope: attachCA.targetScope,
          conflictedArgumentId: attachCA.conflictedArgumentId ?? null,
          conflictingClaimId: attachCA.conflictingClaimId ?? null,
          conflictedClaimId: attachCA.conflictedClaimId ?? null,
          // Link to ATTACK move for dialogue provenance
          createdByMoveId: attackMoveId,
        }
      }).catch(()=>{});
    }
    return NextResponse.json({ ok:true }, NO_STORE);
  }

  return NextResponse.json({ ok:false, error:'Unsupported action' }, { status:400, ...NO_STORE });
}
