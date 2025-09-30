// // lib/agora/types.ts
// // Core domain types for DebateSheets, Argument Diagrams, Evidence, and Plexus.

// export type ID = string;

// /* ---------- Debate Sheets (Level 1: debate graph) ---------- */

// export type SheetScope = 'public' | 'room' | 'followers' | 'private';

// export interface DebateSheet {
//   id: ID;
//   title: string;
//   scope?: SheetScope;                 // default 'public'
//   roles: string[];                    // e.g., ['Proponent','Opponent','Moderator']
//   rulesetJson?: any;
//   createdAt?: string;                 // ISO timestamp
//   updatedAt?: string;                 // ISO timestamp
// }

// // Atom reference (used inside stacks or other objects)
// export type DebateSheetRef = { kind: 'sheet'; sheetId: ID }; // e.g., 'delib:<id>' or 'snapshot:<id>'

// export type DebateEdgeKind =
//   | 'supports'
//   | 'rebuts'
//   | 'objects'
//   | 'undercuts'
//   | 'refines'
//   | 'restates'
//   | 'clarifies'
//   | 'depends_on';

// export interface DebateEdge {
//   id: ID;
//   sheetId: ID;
//   fromId: ID;       // DebateNode.id
//   toId: ID;         // DebateNode.id
//   kind: DebateEdgeKind;
//   thread?: string;
//   ord?: number;
//   rationale?: string;
// }

// export interface DebateNode {
//   id: ID;
//   sheetId: ID;
//   title?: string;
//   summary?: string;

//   // Links to deeper structure
//   diagramId?: ID;
//   argumentId?: ID;
//   claimId?: ID;

//   // Optional embedded (when hydrated)
//   diagram?: ArgumentDiagram;

//   authorsJson?: any;
//   createdAt: string; // ISO
// }

// /* ---------- Argument Diagrams (Level 2: internal structure) ---------- */

// export type StatementRole = 'claim' | 'premise' | 'rebuttal' | 'evidence' | 'context';

// export interface Statement {
//   id: ID;
//   text: string;
//   role: StatementRole;
//   lang?: string;
//   tags?: string[];
// }

// export type InferenceKind = 'deductive' | 'inductive' | 'abductive' | 'analogical' | 'causal' | 'statistical';

// export interface Inference {
//   id: ID;
//   kind: InferenceKind;
//   premises: { statement: Statement }[];
//   conclusion: Statement | null;
//   rationale?: string;
//   schemeKey?: string;
//   cqKeys?: string[]; // critical questions bound to this inference/scheme
// }

// export interface EvidenceNode {
//   id: ID;
//   url: string;
//   title?: string;
//   citation?: string;
//   kind?: string;
//   reliability?: number;     // 0..1 or star-scale, your choice
//   addedById: ID;
//   addedAt: string;          // ISO
//   links?: EvidenceLink[];
// }

// export interface EvidenceLink {
//   id: ID;
//   evidenceId?: ID;
//   evidence?: EvidenceNode;  // optional hydration
//   targetKind: 'diagram' | 'claim' | 'argument' | 'node';
//   targetId?: ID;
//   selectors?: any;          // anchors/annotations
//   note?: string;
//   uri: string;
//   snapshotKey?: string;
//   argumentDiagramId?: ID;   // back-link
// }

// export interface ArgumentDiagram {
//   id: ID;
//   title?: string;
//   statements: Statement[];
//   inferences: Inference[];
//   cqStatus?: any;           // shape TBD (you already have CQs infra)
//   evidence: EvidenceLink[];
//   createdById: ID;
//   createdAt: string;        // ISO
// }

// /* ---------- Sheet-level status + outcomes ---------- */

// export interface LocusStatus {
//   id: ID;
//   sheetId: ID;
//   locusPath: string;        // e.g., '0', '1.2', etc.
//   open: boolean;
//   closable?: boolean;
// }

// export type AcceptanceLabel = 'accepted' | 'rejected' | 'undecided' | 'default-accepted' | 'default-rejected';

// export interface SheetAcceptance {
//   id: ID;
//   sheetId: ID;
//   semantics: 'grounded' | 'preferred' | 'weighted' | string;
//   labels: Record<ID, AcceptanceLabel>; // DebateNode.id -> label
// }

// export interface UnresolvedCQ {
//   id: ID;
//   sheetId: ID;
//   nodeId: ID;
//   cqKey: string;
// }

// export interface Outcome {
//   id: ID;
//   kind?: string;
//   summary?: string;
//   debateSheetId?: ID;
// }

// /* ---------- Stacks (belong to debates) ---------- */

// export type StackItem =
//   | { kind: 'pdf'; url: string; title?: string }
//   | { kind: 'link'; url: string; title?: string }
//   | { kind: 'note'; text: string }
//   | DebateSheetRef;

// /* ---------- Plexus (inter‑debate network) ---------- */

// export type PlexusEdgeKind = 'xref' | 'overlap' | 'stack_ref' | 'imports' | 'shared_author';

// export interface PlexusRoomNode {
//   id: ID;                       // deliberationId / sheetId
//   title?: string | null;
//   nArgs: number;
//   nEdges: number;
//   accepted: number;
//   rejected: number;
//   undecided: number;
//   tags?: string[];
//   updatedAt?: string;           // ISO
// }

// export interface PlexusEdge {
//   from: ID;
//   to: ID;
//   kind: PlexusEdgeKind;
//   weight: number;
// }

// export interface PlexusNetwork {
//   scope: 'public' | 'following';
//   version: number;
//   rooms: PlexusRoomNode[];
//   edges: PlexusEdge[];
// }

// lib/agora/types.ts

export type DebateEdgeKind =
  | 'supports'
  | 'rebuts'
  | 'objects'
  | 'undercuts'
  | 'refines'
  | 'restates'
  | 'clarifies'
  | 'depends_on';

export type StatementRole =
  | 'claim'
  | 'premise'
  | 'warrant'
  | 'backing'
  | 'rebuttal'
  | 'evidence'
  | 'context';

export type InferenceKind =
  | 'deductive'
  | 'inductive'
  | 'abductive'
  | 'analogical'
  | 'causal'
  | 'statistical';

export type DebateSheet = {
  id: string;
  title: string;
  scope?: 'public' | 'followers' | 'org' | 'private';
  roles: string[];
  rulesetJson?: any;
};

export type DebateSheetRef = { kind: 'sheet'; sheetId: string }; // e.g., 'delib:<id>' or 'snapshot:<id>'

export type Statement = {
  id: string;
  text: string;
  role: StatementRole;
  lang?: string;
  tags?: string[];
};

export type Inference = {
  id: string;
  kind: InferenceKind;
  premises: { statement: Statement }[];
  conclusion: Statement | null;
  rationale?: string;
  schemeKey?: string;
  cqKeys?: string[];
};

export type EvidenceNode = {
  id: string;
  url: string;
  title?: string;
  citation?: string;
  kind?: string;
  reliability?: number; // 0..1 if you compute this
  addedById: string;
  addedAt: Date;
  links?: EvidenceLink[];
};

export type EvidenceLink = {
  id: string;
  evidenceId?: string;
  evidence?: EvidenceNode;
  targetKind: 'diagram' | 'statement' | 'claim' | 'argument';
  targetId?: string;
  selectors?: any;     // annotation anchors
  note?: string;
  uri: string;         // canonical URI (url or doi:)
  snapshotKey?: string;

  argumentDiagramId?: string;
};

export interface ArgumentDiagram {
  id: string;
  title?: string;
  statements: Statement[];
  inferences: Inference[];
  cqStatus?: any;
  evidence: EvidenceLink[];
  createdById: string;
  createdAt: Date;
}

export interface DebateNode {
  id: string;
  sheetId: string;
  sheet: DebateSheetRef;
  title?: string;
  summary?: string;
  diagramId?: string;
  diagram?: ArgumentDiagram;
  argumentId?: string;
  claimId?: string;
  authorsJson?: any;
  createdAt: Date;
}

export type DebateEdge = {
  id: string;
  sheetId: string;
  sheet: DebateSheet;
  fromId: string;
  toId: string;
  kind: DebateEdgeKind;
  thread?: string;
  ord?: number;
  rationale?: string;
};

export type Outcome = { id: string; kind?: string; summary?: string; debateSheetId?: string };

export type LocusStatus = { id: string; sheetId: string; locusPath: string; open: boolean; closable?: boolean };

export type SheetAcceptance = { id: string; sheetId: string; semantics: string; labels: Record<string, string> };

export type UnresolvedCQ = { id: string; sheetId: string; nodeId: string; cqKey: string };
export type Acceptance   = { id: string; sheetId: string; nodeId: string; label: string };

// Stack content
export type StackItem =
  | { kind: 'pdf'; url: string; title?: string }
  | { kind: 'link'; url: string; title?: string }
  | { kind: 'note'; text: string }
  | DebateSheetRef;
