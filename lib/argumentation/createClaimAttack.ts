import { prisma } from '@/lib/prismaclient';
import type { ClaimEdgeType, ClaimAttackType } from '@prisma/client';

type RebutScope = 'premise' | 'conclusion';
type Suggestion =
  | { type: 'undercut'; scope?: never }
  | { type: 'rebut'; scope: RebutScope };

export async function createClaimAttack(opts: {
  fromClaimId: string;           // the attacking claim (you can wire this later)
  toClaimId: string;             // the target claim (the one with unmet CQ)
  deliberationId: string;        // resolved from the target claim
  suggestion: Suggestion;
}) {
  const { fromClaimId, toClaimId, deliberationId, suggestion } = opts;

  // Map suggestion → ClaimEdge fields
  let type: ClaimEdgeType = 'rebuts';
  let attackType: ClaimAttackType | null = null;
  let targetScope: string | null = null;

  if (suggestion.type === 'undercut') {
    attackType = 'UNDERCUTS';
    targetScope = 'inference';
  } else {
    attackType = 'REBUTS';
    targetScope = suggestion.scope; // 'premise' | 'conclusion'
  }

  // Idempotency: avoid duplicate edges by unique constraint
  // (fromClaimId, toClaimId, type, attackType) is unique per your schema
  const edge = await prisma.claimEdge.upsert({
    where: {
      unique_from_to_type_attack: {
        fromClaimId,
        toClaimId,
        type,
        attackType,
      },
    },
    update: {}, // nothing to update for now
    create: {
      fromClaimId,
      toClaimId,
      type,
      attackType,
      targetScope,
      deliberationId,
      // createdAt added by default
    },
  });

  return edge;
}
