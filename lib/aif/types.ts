// lib/aif/types.ts
export type AttackType = 'REBUTS' | 'UNDERCUTS' | 'UNDERMINES';
export type TargetScope = 'conclusion' | 'inference' | 'premise';

export type CreateArgumentPayload = {
  conclusionClaimId: string;
  premiseClaimIds: string[];
  schemeId?: string | null;
  implicitWarrant?: unknown;
};

export type AttackPayload = {
  fromArgumentId: string;
  attackType: AttackType;
  targetScope: TargetScope;
  targetArgumentId?: string;   // for undercuts (inference)
  targetClaimId?: string;      // for rebuttals (conclusion)
  targetPremiseId?: string;    // for undermines (premise)
  cqKey?: string | null;
};
