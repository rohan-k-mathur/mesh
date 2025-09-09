export type LocusPath = string;          // "0.1.2"
export type Polarity = 'P' | 'O';
export type TravelStatus = 'ONGOING'|'CONVERGENT'|'DIVERGENT';

export type ProperAct = {
  kind: 'PROPER';
  polarity: Polarity;
  locus: LocusPath;           // MUST exist / be created in LudicLocus
  ramification: string[];     // child suffixes or named slots
  expression?: string;
  additive?: boolean;         // additive gate at THIS locus
  meta?: Record<string, unknown>;
};

export type DaimonAct = {
  kind: 'DAIMON';
  expression?: string;        // optional reason/label for †
};

export type DialogueAct = ProperAct | DaimonAct;

export type TracePair = {
  posActId: string;
  negActId: string;
  ts: number;
  actor?: string;
};

export type Endorsement = {
  locusPath: string;
  byParticipantId: string;
  viaActId: string;
};

export type StepResult = {
  status: 'ONGOING'|'CONVERGENT'|'DIVERGENT';
  pairs: { posActId: string; negActId: string; ts: number }[];
  endedAtDaimonForParticipantId?: string;
  endorsement?: Endorsement;
  decisiveIndices?: number[];                 // 👈 NEW
  usedAdditive?: Record<string, string>;      // 👈 optional convenience for UI
};

export type FocusPhase = 'focus-P'|'focus-O'|'neutral';
