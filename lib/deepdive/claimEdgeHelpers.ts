// lib/deepdive/claimEdgeHelpers.ts
import { prisma } from '@/lib/prismaclient';
import { ClaimAttackType, ClaimEdgeType } from '@prisma/client';

// singular → enum (plural)
function normalizeType(t?: string | null): ClaimEdgeType {
  const v = (t || '').toLowerCase();
  return v === 'rebut' || v === 'rebuts' ? ClaimEdgeType.rebuts : ClaimEdgeType.supports;
}

/** derive rich attack kind from type+scope if ArgumentEdge has no attackType col */
function deriveAttackEnum(type?: string | null, scope?: string | null): ClaimAttackType {
  const s = (scope || '').toLowerCase();
  if (s === 'inference') return ClaimAttackType.UNDERCUTS;
  if (s === 'premise')   return ClaimAttackType.UNDERMINES;
  return normalizeType(type) === ClaimEdgeType.rebuts ? ClaimAttackType.REBUTS : ClaimAttackType.SUPPORTS;
}

function scopeFrom(attack: ClaimAttackType, t: ClaimEdgeType): 'premise'|'inference'|'conclusion'|null {
  if (attack === ClaimAttackType.UNDERCUTS)  return 'inference';
  if (attack === ClaimAttackType.UNDERMINES) return 'premise';
  if (attack === ClaimAttackType.REBUTS || t === ClaimEdgeType.rebuts) return 'conclusion';
  return null;
}

export async function maybeUpsertClaimEdgeFromArgumentEdge(edgeId: string) {
  // NOTE: ArgumentEdge has no attackType column in your DB; do not select it.
  const e = await prisma.argumentEdge.findUnique({
    where: { id: edgeId },
    select: {
      id: true,
      type: true,            // 'support' | 'rebut' | 'undercut' | 'concede'
      targetScope: true,     // may be null
      fromArgument: { select: { claimId: true, deliberationId: true } },
      toArgument:   { select: { claimId: true } },
    },
  });
  if (!e?.fromArgument?.claimId || !e?.toArgument?.claimId) return;

  const typeEnum = normalizeType(e.type);
  // Map legacy 'undercut'/'concede' to rich attack enum via scope/type
  const attackEnum = deriveAttackEnum(e.type, e.targetScope);
  const scope = e.targetScope ?? scopeFrom(attackEnum, typeEnum);

  await prisma.claimEdge.upsert({
    where: {
      unique_from_to_type_attack: {
        fromClaimId: e.fromArgument.claimId,
        toClaimId:   e.toArgument.claimId,
        type:        typeEnum,
        attackType:  attackEnum,
      },
    },
    update: { targetScope: scope ?? undefined },
    create: {
      deliberationId: e.fromArgument.deliberationId!,   // ✅ set it
      fromClaimId: e.fromArgument.claimId,
      toClaimId:   e.toArgument.claimId,
      type:        typeEnum,
      attackType:  attackEnum,
      targetScope: scope ?? undefined,
    },
  });
}
