// packages/ludics-core/types.ts
export type LocusPath = string;
export type Polarity = 'P'|'O';
export type SemanticsVersion = 'ludics-v1'|'ludics-v2';

export type Ramification = string[]; // suffixes or names

export type ProperAct = {
  kind: 'PROPER';
  polarity: Polarity;
  locus: LocusPath;
  ramification: Ramification;
  expression?: string;
  additive?: boolean;
  meta?: Record<string, unknown>;
};
export type DaimonAct = { kind: 'DAIMON'; expression?: string };
export type DialogueAct = ProperAct | DaimonAct;

export type TracePair = { posActId: string; negActId: string; ts: number; actor?: string; };
export type TravelStatus = 'ONGOING'|'CONVERGENT'|'DIVERGENT';
