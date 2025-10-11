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
      await prisma.conflictApplication.create({
        data: {
          deliberationId,
          createdById: String(authorId || 'self'),
          legacyAttackType: attachCA.attackType,
          legacyTargetScope: attachCA.targetScope,
          conflictedArgumentId: attachCA.conflictedArgumentId ?? null,
          conflictingClaimId: attachCA.conflictingClaimId ?? null,
          conflictedClaimId: attachCA.conflictedClaimId ?? null,
        }
      }).catch(()=>{});
    }
    return NextResponse.json({ ok:true }, NO_STORE);
  }

  return NextResponse.json({ ok:false, error:'Unsupported action' }, { status:400, ...NO_STORE });
}
