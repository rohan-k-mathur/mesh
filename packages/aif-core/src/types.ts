// packages/aif-core/src/types.ts
export type AifNodeType = 'I' | 'RA' | 'CA' | 'L';
export type AttackType = 'REBUTS' | 'UNDERCUTS' | 'UNDERMINES';
export type TargetScope = 'conclusion' | 'inference' | 'premise';

export type InformationNode = {
  kind: 'I';
  id: string;
  text: string;
};

export type RANode = {
  kind: 'RA';
  id: string;
  conclusionClaimId: string;
  premiseClaimIds: string[];
  schemeKey?: string | null;
  implicitWarrant?: unknown;
};

export type CANode = {
  kind: 'CA';
  id: string;
  fromArgumentId: string;      // attacker RA
  toArgumentId?: string | null;// target RA (undercut)
  targetClaimId?: string | null;    // rebut
  targetPremiseId?: string | null;  // undermine
  attackType: AttackType;
  targetScope: TargetScope;
  cqKey?: string | null;
};

export type LNode = {
  kind: 'L';
  id: string;
  text?: string | null;
  authorId?: string | null;
  deliberationId?: string | null;
  illocution?: 'Assert'|'Question'|'Argue'|'Concede'|'Retract'|'Close';
  replyToMoveId?: string | null;
  contentClaimId?: string | null;
  argumentId?: string | null;
};

export type AifGraph = {
  claims: InformationNode[];
  arguments: RANode[];
  attacks: CANode[];
  locutions?: LNode[];
};
