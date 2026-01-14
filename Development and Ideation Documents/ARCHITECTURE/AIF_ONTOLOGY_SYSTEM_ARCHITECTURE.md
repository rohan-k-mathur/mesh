# AIF (Argument Interchange Format) Ontology System Architecture

## Overview

The Mesh platform implements a comprehensive **AIF (Argument Interchange Format)** ontology system for representing, exchanging, and reasoning over argumentation structures. This document provides detailed technical documentation of the system design, data model, and integration points.

AIF is a standardized representation format for argumentation based on:
- Reed, C., & Rowe, G. (2007). "Araucaria: Software for argument analysis, diagramming and representation"
- Chesñevar, C., et al. (2006). "Towards an argument interchange format"
- Rahwan, I., et al. (2007). "Laying the foundations for a World Wide Argument Web"
- Prakken, H. (2005). "Coherence and flexibility in dialogue games for argumentation"

The Mesh implementation extends AIF with:
- **AIF+**: Dialogue move integration (L-nodes, TA-nodes)
- **Mesh Extensions**: Commitment tracking, scheme hierarchies, ludics integration

---

## Table of Contents

1. [System Architecture Diagram](#system-architecture-diagram)
2. [Core AIF Node Types](#core-aif-node-types)
3. [Edge Types and Semantics](#edge-types-and-semantics)
4. [Type Definitions](#type-definitions)
5. [Database Models](#database-models)
6. [Graph Construction Pipeline](#graph-construction-pipeline)
7. [Export Formats](#export-formats)
8. [Argumentation Schemes](#argumentation-schemes)
9. [Dialogue Integration (AIF+)](#dialogue-integration-aif)
10. [Commitment Store System](#commitment-store-system)
11. [API Layer](#api-layer)
12. [ASPIC+ Translation](#aspic-translation)
13. [Validation System](#validation-system)

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                    USER INTERFACE                                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐│
│  │ ArgumentDiagram  │  │ SchemeComposer   │  │ CommitmentStore  │  │ DialoguePanel  ││
│  │   (Graph View)   │  │ (Scheme Browser) │  │    Panel         │  │ (L-nodes)      ││
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘  └───────┬────────┘│
└───────────┼─────────────────────┼─────────────────────┼────────────────────┼─────────┘
            │                     │                     │                    │
            ▼                     ▼                     ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                     API LAYER                                        │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐│
│  │                            /api/aif/*                                            ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ ││
│  │  │ /export      │  │ /import      │  │ /validate    │  │ /schemes             │ ││
│  │  │ JSON-LD, RDF │  │ Graph Import │  │ AIF Rules    │  │ Scheme Browser       │ ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────────────┘ ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ ││
│  │  │ /evaluate    │  │ /conflicts   │  │ /preferences │  │ /dialogue/*          │ ││
│  │  │ ASPIC+ Eval  │  │ CA-node mgmt │  │ PA-node mgmt │  │ Commitments/Analytics│ ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────────────┘ ││
│  └─────────────────────────────────────────────────────────────────────────────────┘│
└───────────────────────────────────────┬─────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                               ENGINE LIBRARY LAYER                                   │
│                                    /lib/aif/*                                        │
│  ┌────────────────────────────────────────────────────────────────────────────────┐ │
│  │                               CORE MODULES                                      │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │ │
│  │  │  types.ts   │ │ ontology.ts │ │ validate.ts │ │ jsonld.ts   │ │ export.ts │ │ │
│  │  │ (I/RA/CA/PA)│ │ (DM-nodes)  │ │(Edge Rules) │ │(Build Graph)│ │ (Format)  │ │ │
│  │  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └─────┬─────┘ │ │
│  │         │               │               │               │              │       │ │
│  │         └───────────────┴───────────────┼───────────────┴──────────────┘       │ │
│  │                                         │                                       │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌──────┴──────┐ ┌─────────────┐               │ │
│  │  │graphBuilder │ │ constants.ts│ │ontologyTypes│ │ serializers │               │ │
│  │  │    .ts      │ │ (Namespaces)│ │     .ts     │ │    .ts      │               │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘               │ │
│  └────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐ │
│  │                           DIALOGUE & COMMITMENT                                 │ │
│  │  ┌───────────────────┐  ┌───────────────────────┐  ┌─────────────────────────┐ │ │
│  │  │ commitment-helpers│  │ commitment-analytics  │  │commitment-ludics-types  │ │ │
│  │  │       .ts         │  │         .ts           │  │         .ts             │ │ │
│  │  └───────────────────┘  └───────────────────────┘  └─────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐ │
│  │                           TRANSLATION LAYER                                     │ │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐   │ │
│  │  │ translation/aifToAspic.ts                                                │   │ │
│  │  │ AIF Graph → ASPIC+ ArgumentationTheory                                   │   │ │
│  │  └─────────────────────────────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────┬─────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                               DATA PERSISTENCE LAYER                                 │
│                               (Prisma + PostgreSQL)                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐│
│  │                         CORE ARGUMENTATION MODELS                                ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐  ┌───────────────┐ ││
│  │  │    Claim     │  │   Argument   │  │ ConflictApplication │  │ Preference-   │ ││
│  │  │  (I-nodes)   │  │  (RA-nodes)  │  │   (CA-nodes)        │  │  Application  │ ││
│  │  └──────────────┘  └──────────────┘  └─────────────────────┘  └───────────────┘ ││
│  │                                                                                  ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐  ┌───────────────┐ ││
│  │  │ArgumentScheme│  │CriticalQuest-│  │   DialogueMove      │  │  AifNode      │ ││
│  │  │  (S-nodes)   │  │    ion       │  │    (L-nodes)        │  │  (Generic)    │ ││
│  │  └──────────────┘  └──────────────┘  └─────────────────────┘  └───────────────┘ ││
│  │                                                                                  ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐                    ││
│  │  │AssumptionUse │  │ClaimContrary │  │CommitmentLudicMapping│                   ││
│  │  │ (K_a / K_p)  │  │  (Contraries)│  │  (Ludics Bridge)    │                    ││
│  │  └──────────────┘  └──────────────┘  └─────────────────────┘                    ││
│  └─────────────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Core AIF Node Types

AIF defines a set of node types that capture different aspects of argumentation:

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              AIF NODE TYPE HIERARCHY                                 │
│                                                                                      │
│   ┌─────────────────────────────────────────────────────────────────────────────┐   │
│   │                           INFORMATION NODES                                  │   │
│   │                                                                              │   │
│   │   ┌─────────────────────────────────────────────────────────────────────┐   │   │
│   │   │  I-NODE (Information Node)                                           │   │   │
│   │   │  • Represents propositions, claims, statements                      │   │   │
│   │   │  • Contains propositional content (text)                            │   │   │
│   │   │  • Maps to: Claim model in Prisma                                   │   │   │
│   │   │                                                                      │   │   │
│   │   │  Properties:                                                         │   │   │
│   │   │  - id: Unique identifier                                             │   │   │
│   │   │  - claimText: The propositional content                              │   │   │
│   │   │  - metadata: Additional properties                                   │   │   │
│   │   │  - debateId: Parent deliberation                                     │   │   │
│   │   └─────────────────────────────────────────────────────────────────────┘   │   │
│   └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│   ┌─────────────────────────────────────────────────────────────────────────────┐   │
│   │                          SCHEME NODES (S-NODES)                              │   │
│   │                                                                              │   │
│   │   ┌─────────────────────────────────────────────────────────────────────┐   │   │
│   │   │  RA-NODE (Rule Application / Inference Node)                         │   │   │
│   │   │  • Represents inference from premises to conclusion                  │   │   │
│   │   │  • Links to ArgumentScheme (the pattern being applied)              │   │   │
│   │   │  • Maps to: Argument model in Prisma                                │   │   │
│   │   │                                                                      │   │   │
│   │   │  Properties:                                                         │   │   │
│   │   │  - schemeId: The argumentation scheme used                           │   │   │
│   │   │  - schemeType: deductive | defeasible | presumptive | inductive      │   │   │
│   │   │  - inferenceType: modus_ponens | expert_opinion | analogy | ...      │   │   │
│   │   └─────────────────────────────────────────────────────────────────────┘   │   │
│   │                                                                              │   │
│   │   ┌─────────────────────────────────────────────────────────────────────┐   │   │
│   │   │  CA-NODE (Conflict Application Node)                                 │   │   │
│   │   │  • Represents attack/conflict between arguments                      │   │   │
│   │   │  • Types: rebut | undercut | undermine                               │   │   │
│   │   │  • Maps to: ConflictApplication model in Prisma                      │   │   │
│   │   │                                                                      │   │   │
│   │   │  Properties:                                                         │   │   │
│   │   │  - conflictType: The type of conflict                                │   │   │
│   │   │  - schemeId: Optional conflict scheme                                │   │   │
│   │   └─────────────────────────────────────────────────────────────────────┘   │   │
│   │                                                                              │   │
│   │   ┌─────────────────────────────────────────────────────────────────────┐   │   │
│   │   │  PA-NODE (Preference Application Node)                               │   │   │
│   │   │  • Represents preference between arguments/claims                    │   │   │
│   │   │  • Used for defeat computation in ASPIC+                             │   │   │
│   │   │  • Maps to: PreferenceApplication model in Prisma                    │   │   │
│   │   │                                                                      │   │   │
│   │   │  Properties:                                                         │   │   │
│   │   │  - preferenceType: argument | rule | premise | source                │   │   │
│   │   │  - justification: Why this preference holds                          │   │   │
│   │   └─────────────────────────────────────────────────────────────────────┘   │   │
│   └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│   ┌─────────────────────────────────────────────────────────────────────────────┐   │
│   │                      AIF+ DIALOGUE NODES (EXTENSIONS)                        │   │
│   │                                                                              │   │
│   │   ┌─────────────────────────────────────────────────────────────────────┐   │   │
│   │   │  L-NODE (Locution Node)                                              │   │   │
│   │   │  • Represents a speech act / illocution                              │   │   │
│   │   │  • Links speaker to propositional content                            │   │   │
│   │   │  • Maps to: DialogueMove model in Prisma                             │   │   │
│   │   │                                                                      │   │   │
│   │   │  Illocution Types:                                                   │   │   │
│   │   │  - assert: Claim something is true                                   │   │   │
│   │   │  - question: Ask for information                                     │   │   │
│   │   │  - challenge: Challenge a claim (WHY?)                               │   │   │
│   │   │  - concede: Accept a claim                                           │   │   │
│   │   │  - retract: Withdraw a commitment                                    │   │   │
│   │   │  - disagree: Express disagreement                                    │   │   │
│   │   └─────────────────────────────────────────────────────────────────────┘   │   │
│   │                                                                              │   │
│   │   ┌─────────────────────────────────────────────────────────────────────┐   │   │
│   │   │  TA-NODE (Transition Application Node)                               │   │   │
│   │   │  • Represents dialogue protocol transitions                          │   │   │
│   │   │  • Links locutions to argumentation via protocol rules               │   │   │
│   │   │                                                                      │   │   │
│   │   │  Properties:                                                         │   │   │
│   │   │  - protocolRuleId: Which dialogue rule applies                       │   │   │
│   │   │  - schemeType: The inference type triggered                          │   │   │
│   │   └─────────────────────────────────────────────────────────────────────┘   │   │
│   └─────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Edge Types and Semantics

AIF uses typed edges to connect nodes with specific semantic relationships:

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              AIF EDGE TYPE SEMANTICS                                 │
│                                                                                      │
│   ┌───────────────────────────────────────────────────────────────────────────────┐ │
│   │                        ARGUMENT STRUCTURE EDGES                                │ │
│   │                                                                                │ │
│   │   PREMISE EDGE (I → RA)                                                       │ │
│   │   ┌─────────┐         ┌─────────┐                                             │ │
│   │   │ I-node  │─────────│ RA-node │   "I-node is a premise of RA-node"          │ │
│   │   │(Premise)│ premise │(Argument)│                                            │ │
│   │   └─────────┘         └─────────┘                                             │ │
│   │                                                                                │ │
│   │   CONCLUSION EDGE (RA → I)                                                    │ │
│   │   ┌─────────┐            ┌─────────┐                                          │ │
│   │   │ RA-node │────────────│ I-node  │  "RA-node concludes I-node"              │ │
│   │   │(Argument)│ conclusion │(Concl.) │                                         │ │
│   │   └─────────┘            └─────────┘                                          │ │
│   │                                                                                │ │
│   │   ⚠️ CONSTRAINT: I-nodes CANNOT connect directly to I-nodes                   │ │
│   │      All inferential relationships must go through RA-nodes                   │ │
│   └───────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
│   ┌───────────────────────────────────────────────────────────────────────────────┐ │
│   │                          CONFLICT EDGES                                        │ │
│   │                                                                                │ │
│   │   CONFLICTING EDGE (I/RA → CA)                                                │ │
│   │   ┌─────────┐            ┌─────────┐                                          │ │
│   │   │ I or RA │────────────│ CA-node │  "This node attacks..."                  │ │
│   │   │(Attacker)│conflicting│(Conflict)│                                         │ │
│   │   └─────────┘            └─────────┘                                          │ │
│   │                                                                                │ │
│   │   CONFLICTED EDGE (CA → I/RA)                                                 │ │
│   │   ┌─────────┐            ┌─────────┐                                          │ │
│   │   │ CA-node │────────────│ I or RA │  "...this target node"                   │ │
│   │   │(Conflict)│ conflicted│ (Target) │                                         │ │
│   │   └─────────┘            └─────────┘                                          │ │
│   │                                                                                │ │
│   │   ⚠️ CONSTRAINT: CA-node must have exactly 1 incoming conflicting              │ │
│   │      and exactly 1 outgoing conflicted edge                                    │ │
│   └───────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
│   ┌───────────────────────────────────────────────────────────────────────────────┐ │
│   │                         PREFERENCE EDGES                                       │ │
│   │                                                                                │ │
│   │   PREFERRED EDGE (I/RA → PA)                                                  │ │
│   │   ┌─────────┐           ┌─────────┐                                           │ │
│   │   │ I or RA │───────────│ PA-node │  "This node is preferred..."              │ │
│   │   │(Stronger)│ preferred │(Pref.)  │                                          │ │
│   │   └─────────┘           └─────────┘                                           │ │
│   │                                                                                │ │
│   │   DISPREFERRED EDGE (PA → I/RA)                                               │ │
│   │   ┌─────────┐            ┌─────────┐                                          │ │
│   │   │ PA-node │────────────│ I or RA │  "...over this node"                     │ │
│   │   │ (Pref.) │dispreferred│(Weaker) │                                          │ │
│   │   └─────────┘            └─────────┘                                          │ │
│   │                                                                                │ │
│   │   ⚠️ CONSTRAINT: PA-node must have exactly 1 incoming preferred                │ │
│   │      and exactly 1 outgoing dispreferred edge                                  │ │
│   └───────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
│   ┌───────────────────────────────────────────────────────────────────────────────┐ │
│   │                      DIALOGUE EDGES (AIF+)                                     │ │
│   │                                                                                │ │
│   │   ILLOCUTES EDGE (L → I/RA)                                                   │ │
│   │   ┌─────────┐           ┌─────────┐                                           │ │
│   │   │ L-node  │───────────│ I or RA │  "Speaker asserts/questions/..."          │ │
│   │   │(Locution)│ illocutes │(Content)│                                          │ │
│   │   └─────────┘           └─────────┘                                           │ │
│   │                                                                                │ │
│   │   REPLIES EDGE (L → L)                                                        │ │
│   │   ┌─────────┐           ┌─────────┐                                           │ │
│   │   │ L-node  │───────────│ L-node  │  "This move replies to that move"         │ │
│   │   │ (Reply) │  replies  │(Original)│                                          │ │
│   │   └─────────┘           └─────────┘                                           │ │
│   │                                                                                │ │
│   │   START/END EDGES (L ↔ TA)                                                    │ │
│   │   ┌─────────┐    start   ┌─────────┐                                          │ │
│   │   │ L-node  │───────────│ TA-node │  Protocol transition trigger              │ │
│   │   │(Trigger)│           │(Transit.)│                                          │ │
│   │   └─────────┘           └────┬────┘                                           │ │
│   │                              │ end                                             │ │
│   │                         ┌────▼────┐                                           │ │
│   │                         │ L-node  │  Protocol transition result               │ │
│   │                         │(Result) │                                           │ │
│   │                         └─────────┘                                           │ │
│   └───────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Type Definitions

### Core Types (`/lib/aif/types.ts`)

```typescript
// Node Types
export type NodeType = 'I' | 'L' | 'RA' | 'CA' | 'PA' | 'TA';

// Edge Types
export type EdgeType = 
  | 'premise'      // I → RA
  | 'conclusion'   // RA → I
  | 'presumption'  // I → RA/TA (defeasible premise)
  | 'conflicting'  // I/RA → CA
  | 'conflicted'   // CA → I/RA
  | 'preferred'    // I/RA → PA
  | 'dispreferred' // PA → I/RA
  | 'start'        // L → TA
  | 'end';         // TA → L

// Locution Types (Speech Acts)
export type IlocutionType = 
  | 'assert'    // Claim something is true
  | 'question'  // Ask for information
  | 'challenge' // Challenge a claim (WHY?)
  | 'concede'   // Accept a claim
  | 'retract'   // Withdraw commitment
  | 'disagree'; // Express disagreement

// Scheme Types
export type SchemeType = 'deductive' | 'defeasible' | 'presumptive' | 'inductive';

// Inference Types (Walton's Schemes)
export type InferenceType = 
  | 'modus_ponens' | 'modus_tollens'
  | 'expert_opinion' | 'cause_effect' | 'analogy'
  | 'sign' | 'example' | 'consequences' | 'generic';

// Conflict Types
export type ConflictType = 
  | 'rebut'              // Attack conclusion
  | 'undercut'           // Attack inference
  | 'undermine'          // Attack premise
  | 'logical_conflict'   // Direct contradiction
  | 'expert_unreliability' // Challenge expert
  | 'exception';         // Exception to rule

// Preference Types
export type PreferenceType = 'argument' | 'rule' | 'premise' | 'source';
```

### Node Interfaces

```typescript
interface BaseNode {
  id: string;
  nodeType: NodeType;
  content: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  creatorId?: string;
  debateId: string;
}

interface INode extends BaseNode {
  nodeType: 'I';
  claimText: string;
}

interface LNode extends BaseNode {
  nodeType: 'L';
  claimText: string;
  speakerId: string;
  ilocutionType: IlocutionType;
  propositionalContent?: string;
  targetMoveId?: string;
}

interface RANode extends BaseNode {
  nodeType: 'RA';
  schemeId?: string;
  schemeType?: SchemeType;
  inferenceType: InferenceType;
}

interface CANode extends BaseNode {
  nodeType: 'CA';
  schemeId?: string;
  conflictType: ConflictType;
}

interface PANode extends BaseNode {
  nodeType: 'PA';
  schemeId?: string;
  preferenceType: PreferenceType;
  justification?: string;
}

interface TANode extends BaseNode {
  nodeType: 'TA';
  schemeId?: string;
  schemeType?: SchemeType;
  inferenceType: InferenceType;
  protocolRuleId?: string;
}

type AnyNode = INode | LNode | RANode | CANode | PANode | TANode;
```

### Edge and Graph Interfaces

```typescript
interface Edge {
  id: string;
  sourceId: string;
  targetId: string;
  edgeType: EdgeType;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  debateId: string;
}

interface AIFGraph {
  nodes: AnyNode[];
  edges: Edge[];
  metadata?: {
    title?: string;
    description?: string;
    created?: string;
    modified?: string;
    protocol?: string;
    debateId?: string;
  };
}
```

---

## Database Models

### Argument (RA-node)

```prisma
model Argument {
  id              String @id @default(cuid())
  deliberationId  String
  conclusionClaimId String?
  schemeId        String?
  
  // Relations
  premises        ArgumentPremise[]
  conclusion      Claim?
  scheme          ArgumentScheme?
  
  // AIF metadata
  createdByMoveId String?
  createdByMove   DialogueMove?
}
```

### Claim (I-node)

```prisma
model Claim {
  id              String @id @default(cuid())
  text            String?
  deliberationId  String
  
  // AIF provenance
  introducedByMoveId String?
  introducedByMove   DialogueMove?
}
```

### ConflictApplication (CA-node)

```prisma
model ConflictApplication {
  id             String   @id @default(cuid())
  deliberationId String
  schemeId       String?
  
  // Conflicting element (attacker)
  conflictingClaimId    String?
  conflictingArgumentId String?

  // Conflicted element (target)
  conflictedClaimId    String?
  conflictedArgumentId String?

  // Attack semantics
  legacyAttackType  String?  // 'REBUTS'|'UNDERCUTS'|'UNDERMINES'
  legacyTargetScope String?  // 'conclusion'|'inference'|'premise'

  // ASPIC+ Integration
  aspicAttackType   String?  // 'undermining' | 'rebutting' | 'undercutting'
  aspicDefeatStatus Boolean? // true if attack succeeded as defeat
  aspicMetadata     Json?
}
```

### PreferenceApplication (PA-node)

```prisma
model PreferenceApplication {
  id             String   @id @default(cuid())
  deliberationId String
  schemeId       String?
  
  // Preferred element
  preferredClaimId    String?
  preferredArgumentId String?
  preferredSchemeId   String?

  // Dispreferred element
  dispreferredClaimId    String?
  dispreferredArgumentId String?
  dispreferredSchemeId   String?

  // ASPIC+ ordering
  orderingPolicy String?  // "last-link" | "weakest-link"
  weight         Float?   @default(1.0)
  justification  String?
  
  // Conflict tracking
  conflictStatus String?  @default("none")
}
```

### ArgumentScheme (S-node)

```prisma
model ArgumentScheme {
  id          String  @id @default(cuid())
  key         String  @unique
  name        String?
  summary     String
  
  // Formal structure (Walton-style)
  premises    Json?   // Array of premise templates
  conclusion  Json?   // Conclusion template
  
  // Taxonomy (Macagno)
  purpose          String?  // 'action' | 'state_of_affairs'
  source           String?  // 'internal' | 'external'
  materialRelation String?  // 'cause' | 'definition' | ...
  reasoningType    String?  // 'deductive' | 'inductive' | ...
  
  // Hierarchy
  parentSchemeId String?
  parentScheme   ArgumentScheme?
  childSchemes   ArgumentScheme[]
  clusterTag     String?
  inheritCQs     Boolean @default(true)
  
  // ASPIC+ mapping
  aspicMapping Json?  // { ruleType, ruleId, preferenceLevel }
  
  // Critical questions
  cqs CriticalQuestion[]
}
```

### DialogueMove (L-node)

```prisma
model DialogueMove {
  id             String   @id @default(cuid())
  deliberationId String
  authorId       String?
  
  // Locution
  kind       String    // 'ASSERT'|'WHY'|'GROUNDS'|'RETRACT'...
  illocution Illocution?
  
  // Target
  targetType String    // 'argument'|'claim'
  targetId   String
  payload    Json?
  
  // Threading
  replyToMoveId String?
  replyTarget   ReplyTarget?
  
  // AIF representation
  aifRepresentation String?
  aifNode           AifNode?
}
```

---

## Graph Construction Pipeline

The AIF graph is constructed from database records through a multi-stage pipeline:

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         AIF GRAPH CONSTRUCTION PIPELINE                              │
│                                                                                      │
│   Stage 1: Data Fetching (Prisma)                                                    │
│   ┌─────────────────────────────────────────────────────────────────────────────┐   │
│   │  buildAifGraphJSONLD() in /lib/aif/jsonld.ts                                 │   │
│   │                                                                              │   │
│   │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                 │   │
│   │  │ Arguments      │  │ Claims         │  │ Conflicts      │                 │   │
│   │  │ + premises     │  │ (for I-nodes)  │  │ (CA-nodes)     │                 │   │
│   │  │ + scheme       │  │                │  │                │                 │   │
│   │  └────────────────┘  └────────────────┘  └────────────────┘                 │   │
│   │                                                                              │   │
│   │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                 │   │
│   │  │ Preferences    │  │ DialogueMoves  │  │ AssumptionUse  │                 │   │
│   │  │ (PA-nodes)     │  │ (L-nodes)      │  │ (Presumptions) │                 │   │
│   │  └────────────────┘  └────────────────┘  └────────────────┘                 │   │
│   └──────────────────────────────────────────┬──────────────────────────────────┘   │
│                                              │                                       │
│                                              ▼                                       │
│   Stage 2: Node Assembly                                                             │
│   ┌─────────────────────────────────────────────────────────────────────────────┐   │
│   │  Create nodes with @id and @type following AIF JSON-LD conventions          │   │
│   │                                                                              │   │
│   │  ID Patterns:                                                                │   │
│   │  • I-nodes:  "I:{claimId}"                                                   │   │
│   │  • RA-nodes: "S:{argumentId}"                                                │   │
│   │  • CA-nodes: "CA:{conflictId}"                                               │   │
│   │  • PA-nodes: "PA:{preferenceId}"                                             │   │
│   │  • L-nodes:  "L:{moveId}"                                                    │   │
│   │                                                                              │   │
│   │  Type Annotations:                                                           │   │
│   │  • I-nodes:  ["aif:InformationNode"]                                         │   │
│   │  • RA-nodes: ["aif:RA", "as:{schemeKey}"]  (includes scheme type)           │   │
│   │  • CA-nodes: ["aif:CA"]                                                      │   │
│   │  • PA-nodes: ["aif:PA"]                                                      │   │
│   │  • L-nodes:  ["aif:L"]                                                       │   │
│   └──────────────────────────────────────────┬──────────────────────────────────┘   │
│                                              │                                       │
│                                              ▼                                       │
│   Stage 3: Edge Assembly                                                             │
│   ┌─────────────────────────────────────────────────────────────────────────────┐   │
│   │  Create edges linking nodes according to AIF semantics                       │   │
│   │                                                                              │   │
│   │  For each Argument:                                                          │   │
│   │  ┌────────────────────────────────────────────────────────────────────────┐ │   │
│   │  │  • Premise edges: I:{premiseClaimId} → S:{argumentId}                   │ │   │
│   │  │  • Conclusion edge: S:{argumentId} → I:{conclusionClaimId}              │ │   │
│   │  └────────────────────────────────────────────────────────────────────────┘ │   │
│   │                                                                              │   │
│   │  For each ConflictApplication:                                               │   │
│   │  ┌────────────────────────────────────────────────────────────────────────┐ │   │
│   │  │  • Conflicting edge: I/S:{attackerId} → CA:{conflictId}                 │ │   │
│   │  │  • Conflicted edge: CA:{conflictId} → I/S:{targetId}                    │ │   │
│   │  └────────────────────────────────────────────────────────────────────────┘ │   │
│   │                                                                              │   │
│   │  For each PreferenceApplication:                                             │   │
│   │  ┌────────────────────────────────────────────────────────────────────────┐ │   │
│   │  │  • Preferred edge: I/S:{preferredId} → PA:{prefId}                      │ │   │
│   │  │  • Dispreferred edge: PA:{prefId} → I/S:{dispreferredId}                │ │   │
│   │  └────────────────────────────────────────────────────────────────────────┘ │   │
│   │                                                                              │   │
│   │  For each DialogueMove (if includeLocutions):                                │   │
│   │  ┌────────────────────────────────────────────────────────────────────────┐ │   │
│   │  │  • Illocutes edge: L:{moveId} → I/S:{targetId}                          │ │   │
│   │  │  • Replies edge: L:{replyToId} → L:{moveId}                             │ │   │
│   │  └────────────────────────────────────────────────────────────────────────┘ │   │
│   └──────────────────────────────────────────┬──────────────────────────────────┘   │
│                                              │                                       │
│                                              ▼                                       │
│   Stage 4: Context & Serialization                                                   │
│   ┌─────────────────────────────────────────────────────────────────────────────┐   │
│   │  Wrap in JSON-LD document with @context                                      │   │
│   │                                                                              │   │
│   │  {                                                                           │   │
│   │    "@context": {                                                             │   │
│   │      "aif": "http://www.arg.dundee.ac.uk/aif#",                              │   │
│   │      "as": "http://mesh-platform.io/aif/schemes/",                           │   │
│   │      "mesh": "http://mesh-platform.io/ontology/aif#",                        │   │
│   │      ...                                                                     │   │
│   │    },                                                                        │   │
│   │    "nodes": [...],                                                           │   │
│   │    "edges": [...]                                                            │   │
│   │  }                                                                           │   │
│   └─────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Graph Builder Class

The `AIFGraphBuilder` class (`/lib/aif/graphBuilder.ts`) provides an incremental RDF graph builder:

```typescript
class AIFGraphBuilder {
  private triples: AIFTriple[] = [];
  private nodes: Set<string> = new Set();

  constructor(
    private baseURI: string = AIF_BASE_URI,
    private namespaces: Record<string, string> = AIF_NAMESPACES
  ) {}

  // Add a scheme with RDF triples
  addScheme(scheme: SchemeWithRelations, options: {
    includeHierarchy?: boolean;
    includeCQs?: boolean;
    includeMeshExtensions?: boolean;
  }): void;

  // Add scheme with inherited CQs
  addSchemeWithInheritedCQs(
    scheme: SchemeWithRelations,
    inheritedCQs: Array<{cqKey, text, attackType, inherited, fromScheme}>,
    options: {...}
  ): Promise<void>;

  // Add critical question
  private addQuestion(schemeURI: string, question: {...}, schemeKey: string): void;

  // Collect ancestors for transitive closure
  private collectAncestors(parentScheme: any): string[];

  // Build final graph
  build(): AIFExportGraph;
}
```

---

## Export Formats

The system supports multiple export formats for interoperability:

### 1. JSON-LD (Primary Format)

JSON-LD is the primary export format, providing linked data semantics:

```json
{
  "@context": {
    "aif": "http://www.arg.dundee.ac.uk/aif#",
    "as": "http://mesh-platform.io/aif/schemes/",
    "mesh": "http://mesh-platform.io/ontology/aif#",
    "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
    "rdfs": "http://www.w3.org/2000/01/rdf-schema#"
  },
  "nodes": [
    {
      "@id": "I:claim123",
      "@type": "aif:InformationNode",
      "aif:text": "Climate change is caused by human activity"
    },
    {
      "@id": "S:arg456",
      "@type": ["aif:RA", "as:expert_opinion"],
      "aif:usesScheme": "expert_opinion",
      "aif:name": "Argument from Expert Opinion"
    },
    {
      "@id": "CA:conflict789",
      "@type": "aif:CA",
      "aif:usesScheme": null
    }
  ],
  "edges": [
    {
      "@type": "aif:Premise",
      "aif:from": "I:premise1",
      "aif:to": "S:arg456"
    },
    {
      "@type": "aif:Conclusion",
      "aif:from": "S:arg456",
      "aif:to": "I:claim123"
    },
    {
      "@type": "aif:ConflictingElement",
      "aif:from": "S:counterArg",
      "aif:to": "CA:conflict789"
    },
    {
      "@type": "aif:ConflictedElement",
      "aif:from": "CA:conflict789",
      "aif:to": "S:arg456"
    }
  ]
}
```

### 2. RDF/XML

Traditional RDF serialization for semantic web tools:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
         xmlns:aif="http://www.arg.dundee.ac.uk/aif#"
         xmlns:mesh="http://mesh-platform.io/ontology/aif#">
  
  <aif:InformationNode rdf:about="I:claim123">
    <aif:text>Climate change is caused by human activity</aif:text>
  </aif:InformationNode>
  
  <aif:RA rdf:about="S:arg456">
    <aif:usesScheme>expert_opinion</aif:usesScheme>
  </aif:RA>
  
  <aif:Premise>
    <aif:from rdf:resource="I:premise1"/>
    <aif:to rdf:resource="S:arg456"/>
  </aif:Premise>
  
</rdf:RDF>
```

### 3. Turtle (TTL)

Compact RDF serialization:

```turtle
@prefix aif: <http://www.arg.dundee.ac.uk/aif#> .
@prefix mesh: <http://mesh-platform.io/ontology/aif#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

:I_claim123 a aif:InformationNode ;
    aif:text "Climate change is caused by human activity" .

:S_arg456 a aif:RA ;
    aif:usesScheme "expert_opinion" .

:edge1 a aif:Premise ;
    aif:from :I_premise1 ;
    aif:to :S_arg456 .

:edge2 a aif:Conclusion ;
    aif:from :S_arg456 ;
    aif:to :I_claim123 .
```

### Namespace Constants

```typescript
// /lib/aif/constants.ts

export const AIF_NAMESPACE = "http://www.arg.dundee.ac.uk/aif#";
export const MESH_NAMESPACE = "http://mesh-platform.io/ontology/aif#";
export const RDF_NAMESPACE = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
export const RDFS_NAMESPACE = "http://www.w3.org/2000/01/rdf-schema#";
export const OWL_NAMESPACE = "http://www.w3.org/2002/07/owl#";
export const XSD_NAMESPACE = "http://www.w3.org/2001/XMLSchema#";

export const BASE_URI = "http://mesh-platform.io/aif";
export const SCHEMES_BASE_URI = `${BASE_URI}/schemes`;

// AIF Core Classes
export const AIF_SCHEME_CLASS = `${AIF_NAMESPACE}Scheme`;
export const AIF_QUESTION_CLASS = `${AIF_NAMESPACE}Question`;
export const AIF_INODE_CLASS = `${AIF_NAMESPACE}I-node`;
export const AIF_RA_CLASS = `${AIF_NAMESPACE}RA`;
export const AIF_CA_CLASS = `${AIF_NAMESPACE}CA`;
export const AIF_PA_CLASS = `${AIF_NAMESPACE}PA`;
```

---

## Argumentation Schemes

Argumentation schemes are patterns of reasoning that connect premises to conclusions. The Mesh platform implements a comprehensive scheme taxonomy based on Walton's work.

### Scheme Structure

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           ARGUMENTATION SCHEME STRUCTURE                             │
│                                                                                      │
│   ┌───────────────────────────────────────────────────────────────────────────────┐ │
│   │  SCHEME: Expert Opinion                                                        │ │
│   │  Key: expert_opinion                                                           │ │
│   │                                                                                │ │
│   │  ┌─────────────────────────────────────────────────────────────────────────┐  │ │
│   │  │ FORMAL STRUCTURE                                                         │  │ │
│   │  │                                                                          │  │ │
│   │  │ Major Premise: Source E is an expert in subject domain S containing      │  │ │
│   │  │                proposition A.                                            │  │ │
│   │  │                                                                          │  │ │
│   │  │ Minor Premise: E asserts that proposition A is true (false).             │  │ │
│   │  │                                                                          │  │ │
│   │  │ Conclusion:    A is true (false).                                        │  │ │
│   │  └─────────────────────────────────────────────────────────────────────────┘  │ │
│   │                                                                                │ │
│   │  ┌─────────────────────────────────────────────────────────────────────────┐  │ │
│   │  │ CRITICAL QUESTIONS                                                       │  │ │
│   │  │                                                                          │  │ │
│   │  │ CQ1: Is E a genuine expert in S?                    [UNDERMINES]         │  │ │
│   │  │      → Attacks premise about expertise                                   │  │ │
│   │  │                                                                          │  │ │
│   │  │ CQ2: Is E reliable and unbiased?                    [UNDERCUTS]          │  │ │
│   │  │      → Attacks applicability of scheme                                   │  │ │
│   │  │                                                                          │  │ │
│   │  │ CQ3: Is A within E's area of expertise?             [UNDERMINES]         │  │ │
│   │  │      → Attacks premise about domain                                      │  │ │
│   │  │                                                                          │  │ │
│   │  │ CQ4: Do other experts agree with E?                 [REBUTS]             │  │ │
│   │  │      → Provides counter-conclusion                                       │  │ │
│   │  └─────────────────────────────────────────────────────────────────────────┘  │ │
│   │                                                                                │ │
│   │  ┌─────────────────────────────────────────────────────────────────────────┐  │ │
│   │  │ TAXONOMY (Macagno)                                                       │  │ │
│   │  │                                                                          │  │ │
│   │  │ • Source: external (authority-based)                                     │  │ │
│   │  │ • Material Relation: authority                                           │  │ │
│   │  │ • Reasoning Type: defeasible                                             │  │ │
│   │  │ • Rule Form: defeasible_MP                                               │  │ │
│   │  │ • Conclusion Type: is (factual)                                          │  │ │
│   │  └─────────────────────────────────────────────────────────────────────────┘  │ │
│   └───────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Scheme Hierarchy

Schemes are organized in a hierarchy enabling CQ inheritance:

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                            SCHEME HIERARCHY EXAMPLE                                  │
│                                                                                      │
│                              ┌──────────────────────┐                                │
│                              │ Defeasible Argument  │                                │
│                              │ (Root Scheme)        │                                │
│                              └──────────┬───────────┘                                │
│                                         │                                            │
│              ┌──────────────────────────┼──────────────────────────┐                 │
│              │                          │                          │                 │
│              ▼                          ▼                          ▼                 │
│   ┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐        │
│   │ Authority-Based  │       │ Causality-Based  │       │ Analogy-Based    │        │
│   │ clusterTag:      │       │ clusterTag:      │       │ clusterTag:      │        │
│   │ "authority"      │       │ "causality"      │       │ "analogy"        │        │
│   └────────┬─────────┘       └────────┬─────────┘       └────────┬─────────┘        │
│            │                          │                          │                   │
│      ┌─────┴─────┐              ┌─────┴─────┐              ┌─────┴─────┐            │
│      │           │              │           │              │           │            │
│      ▼           ▼              ▼           ▼              ▼           ▼            │
│ ┌─────────┐ ┌─────────┐  ┌─────────┐ ┌─────────┐  ┌─────────┐ ┌─────────┐          │
│ │ Expert  │ │ Witness │  │ Cause   │ │ Sign    │  │ Analogy │ │ Example │          │
│ │ Opinion │ │ Test.   │  │ Effect  │ │         │  │         │ │         │          │
│ └─────────┘ └─────────┘  └─────────┘ └─────────┘  └─────────┘ └─────────┘          │
│                                                                                      │
│   CQ Inheritance:                                                                    │
│   • Child schemes inherit parent's CQs if inheritCQs=true                            │
│   • Inherited CQs marked with sourceSchemeId for provenance                          │
│   • Child can add additional scheme-specific CQs                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Critical Question Types

```typescript
model CriticalQuestion {
  id           String          @id
  schemeId     String?
  cqKey        String?
  text         String
  
  // Attack mapping
  attackKind   String          // 'UNDERMINES'|'UNDERCUTS'|'REBUTS'
  attackType   AttackType?     // REBUTS | UNDERCUTS | UNDERMINES
  targetScope  TargetScope?    // conclusion | inference | premise
  
  // ASPIC+ integration
  aspicMapping Json?           // { ruleId?, premiseIndex?, defeasibleRuleRequired? }
  
  // Burden of proof
  burdenOfProof    BurdenOfProof @default(PROPONENT)
  requiresEvidence Boolean       @default(false)
  premiseType      PremiseType?  // ordinary | assumption | exception
}
```

---

## Dialogue Integration (AIF+)

AIF+ extends the core AIF ontology with dialogue support, enabling tracking of speech acts and commitment dynamics.

### Dialogue Move Types

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                          DIALOGUE MOVE TYPES (AIF+)                                  │
│                                                                                      │
│   ┌───────────────────────────────────────────────────────────────────────────────┐ │
│   │                      ASSERTIVE MOVES                                           │ │
│   │                                                                                │ │
│   │   ASSERT: Claim a proposition is true                                          │ │
│   │   ┌──────────────────────────────────────────────────────────────────────┐    │ │
│   │   │  Speaker S asserts proposition P                                      │    │ │
│   │   │  Effect: P added to S's commitment store                              │    │ │
│   │   │  AIF: L-node → I-node (illocutes)                                     │    │ │
│   │   └──────────────────────────────────────────────────────────────────────┘    │ │
│   │                                                                                │ │
│   │   GROUNDS: Provide argument for a claim                                        │ │
│   │   ┌──────────────────────────────────────────────────────────────────────┐    │ │
│   │   │  Speaker S grounds claim C with argument A                            │    │ │
│   │   │  Effect: Creates RA-node linking premises to C                        │    │ │
│   │   │  AIF: L-node → RA-node (illocutes)                                    │    │ │
│   │   └──────────────────────────────────────────────────────────────────────┘    │ │
│   └───────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
│   ┌───────────────────────────────────────────────────────────────────────────────┐ │
│   │                      CHALLENGE MOVES                                           │ │
│   │                                                                                │ │
│   │   WHY: Challenge a claim (request grounds)                                     │ │
│   │   ┌──────────────────────────────────────────────────────────────────────┐    │ │
│   │   │  Speaker S asks "Why P?" challenging claim P                          │    │ │
│   │   │  Effect: Places burden on P's proponent to provide grounds            │    │ │
│   │   │  AIF: L-node → CQ (triggers critical question)                        │    │ │
│   │   └──────────────────────────────────────────────────────────────────────┘    │ │
│   └───────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
│   ┌───────────────────────────────────────────────────────────────────────────────┐ │
│   │                      COMMITMENT MOVES                                          │ │
│   │                                                                                │ │
│   │   CONCEDE: Accept a proposition                                                │ │
│   │   ┌──────────────────────────────────────────────────────────────────────┐    │ │
│   │   │  Speaker S concedes proposition P                                     │    │ │
│   │   │  Effect: P added to S's commitment store                              │    │ │
│   │   │  AIF: L-node → I-node (commitsTo)                                     │    │ │
│   │   └──────────────────────────────────────────────────────────────────────┘    │ │
│   │                                                                                │ │
│   │   RETRACT: Withdraw a commitment                                               │ │
│   │   ┌──────────────────────────────────────────────────────────────────────┐    │ │
│   │   │  Speaker S retracts proposition P                                     │    │ │
│   │   │  Effect: P removed from S's commitment store                          │    │ │
│   │   │  AIF: L-node marks commitment as inactive                             │    │ │
│   │   └──────────────────────────────────────────────────────────────────────┘    │ │
│   └───────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
│   ┌───────────────────────────────────────────────────────────────────────────────┐ │
│   │                      STRUCTURAL MOVES                                          │ │
│   │                                                                                │ │
│   │   THEREFORE: Assert conclusion follows from premises                           │ │
│   │   SUPPOSE: Introduce hypothetical assumption                                   │ │
│   │   DISCHARGE: Close hypothetical context                                        │ │
│   │   CLOSE: End dialogue turn                                                     │ │
│   │   ACCEPT_ARGUMENT: Accept opponent's argument                                  │ │
│   └───────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Dialogue Ontology Constants

```typescript
// /lib/aif/ontology.ts

export const AIF_DIALOGUE_ONTOLOGY = {
  // Node Types
  DM_NODE: "aif:DialogueMoveNode",
  DM_WHY: "aif:DialogueMove_Why",
  DM_GROUNDS: "aif:DialogueMove_Grounds",
  DM_CONCEDE: "aif:DialogueMove_Concede",
  DM_RETRACT: "aif:DialogueMove_Retract",
  DM_CLOSE: "aif:DialogueMove_Close",
  DM_ACCEPT: "aif:DialogueMove_Accept",
  DM_THEREFORE: "aif:DialogueMove_Therefore",
  DM_SUPPOSE: "aif:DialogueMove_Suppose",
  DM_DISCHARGE: "aif:DialogueMove_Discharge",

  // Edge Types
  EDGE_TRIGGERS: "aif:triggers",      // WHY → CQ
  EDGE_ANSWERS: "aif:answers",        // GROUNDS → Argument
  EDGE_COMMITS_TO: "aif:commitsTo",   // CONCEDE → I-node
  EDGE_CAUSED_BY: "aif:causedByDialogueMove",
  EDGE_REPLIES_TO: "aif:repliesTo",   // Move → Move (threading)
  
  // Standard AIF edges
  EDGE_PREMISE: "aif:premise",
  EDGE_CONCLUSION: "aif:conclusion",
  EDGE_CONFLICT: "aif:conflictingElement",
  EDGE_PREFERENCE: "aif:preferredElement",
};
```

---

## Commitment Store System

The commitment store tracks what each participant has committed to during dialogue:

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                          COMMITMENT STORE ARCHITECTURE                               │
│                                                                                      │
│   Per-Participant Commitment Store:                                                  │
│   ┌───────────────────────────────────────────────────────────────────────────────┐ │
│   │  Participant: Alice                                                            │ │
│   │                                                                                │ │
│   │  Active Commitments:                                                           │ │
│   │  ┌──────────────────────────────────────────────────────────────────────────┐ │ │
│   │  │ Claim: "Climate change is real"                                          │ │ │
│   │  │ Source Move: ASSERT @ 10:30am                                            │ │ │
│   │  │ Status: ACTIVE                                                           │ │ │
│   │  └──────────────────────────────────────────────────────────────────────────┘ │ │
│   │  ┌──────────────────────────────────────────────────────────────────────────┐ │ │
│   │  │ Claim: "Scientists agree on this"                                        │ │ │
│   │  │ Source Move: CONCEDE @ 10:45am                                           │ │ │
│   │  │ Status: ACTIVE                                                           │ │ │
│   │  └──────────────────────────────────────────────────────────────────────────┘ │ │
│   │                                                                                │ │
│   │  Retracted Commitments:                                                        │ │
│   │  ┌──────────────────────────────────────────────────────────────────────────┐ │ │
│   │  │ Claim: "All scientists agree"                                            │ │ │
│   │  │ Retracted: RETRACT @ 11:00am                                             │ │ │
│   │  │ Reason: "Too strong - amended to 'most scientists'"                      │ │ │
│   │  └──────────────────────────────────────────────────────────────────────────┘ │ │
│   └───────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
│   Commitment Indicators (UI enrichment):                                             │
│   ┌───────────────────────────────────────────────────────────────────────────────┐ │
│   │  interface CommitmentIndicator {                                               │ │
│   │    claimId: string;                                                            │ │
│   │    participantCount: number;       // How many committed                       │ │
│   │    participants: Array<{                                                       │ │
│   │      id: string;                                                               │ │
│   │      name: string;                                                             │ │
│   │      isActive: boolean;            // Current commitment status                │ │
│   │    }>;                                                                         │ │
│   │    totalActive: number;                                                        │ │
│   │    totalRetracted: number;                                                     │ │
│   │  }                                                                             │ │
│   └───────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
│   Ludics Bridge (Optional):                                                          │
│   ┌───────────────────────────────────────────────────────────────────────────────┐ │
│   │  Dialogue commitments can be "promoted" to the formal ludics proof system:     │ │
│   │                                                                                │ │
│   │  CommitmentLudicMapping:                                                       │ │
│   │  • deliberationId, participantId, proposition                                  │ │
│   │  • targetOwnerId ("Proponent"/"Opponent")                                      │ │
│   │  • basePolarity ("pos"/"neg")                                                  │ │
│   │  → Creates LudicCommitmentElement in formal proof context                      │ │
│   └───────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Commitment Helper Functions

```typescript
// /lib/aif/commitment-helpers.ts

// Enrich AIF nodes with commitment indicators
function enrichNodesWithCommitments(
  nodes: AifNodeWithDialogue[],
  commitmentStores: Array<{
    participantId: string;
    participantName: string;
    commitments: Array<{
      claimId: string;
      claimText: string;
      isActive: boolean;
    }>;
  }>
): Array<AifNodeWithDialogue & { commitmentIndicator?: CommitmentIndicator }>;

// Get summary statistics
function getCommitmentSummary(nodes: Array<...>): {
  nodesWithCommitments: number;
  totalCommitments: number;
  totalParticipants: number;
  mostCommittedClaim: AifNodeWithDialogue | null;
};
```

---

## API Layer

The AIF system exposes a comprehensive REST API for graph export, import, validation, and scheme management:

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              AIF API ENDPOINTS                                       │
│                                                                                      │
│   /api/aif/                                                                          │
│   ├── export/                                                                        │
│   │   └── route.ts           # Export AIF graph as JSON-LD                          │
│   │                          # GET ?chainId=X&includeLocutions=true                 │
│   │                                                                                  │
│   ├── import/                                                                        │
│   │   └── route.ts           # Import AIF JSON-LD into workspace                    │
│   │                          # POST { jsonld: {...}, chainId: X }                   │
│   │                                                                                  │
│   ├── validate/                                                                      │
│   │   └── route.ts           # Validate AIF graph structure                         │
│   │                          # POST { graph: {...} }                                │
│   │                                                                                  │
│   ├── schemes/                                                                       │
│   │   ├── route.ts           # List/create argument schemes                         │
│   │   │                      # GET  ?clusterTag=X&parentSchemeId=Y                  │
│   │   │                      # POST { key, name, premises, conclusion, ... }        │
│   │   │                                                                              │
│   │   ├── [schemeId]/                                                                │
│   │   │   └── route.ts       # Get/update/delete individual scheme                  │
│   │   │                                                                              │
│   │   ├── [schemeId]/cqs/                                                            │
│   │   │   └── route.ts       # Get scheme's critical questions                      │
│   │   │                      # (includes inherited from parent)                     │
│   │   │                                                                              │
│   │   └── export/                                                                    │
│   │       └── route.ts       # Export scheme(s) as RDF/JSON-LD                      │
│   │                          # GET ?schemeId=X&format=jsonld|turtle|rdfxml          │
│   │                                                                                  │
│   ├── preferences/                                                                   │
│   │   └── route.ts           # Manage PA-nodes (preference orderings)               │
│   │                          # POST { preferredId, dispreferredId, scope }          │
│   │                                                                                  │
│   ├── conflicts/                                                                     │
│   │   └── route.ts           # Manage CA-nodes (conflicts)                          │
│   │                          # POST { attackerId, targetId, attackType }            │
│   │                                                                                  │
│   └── dialogue/                                                                      │
│       └── commitments/                                                               │
│           └── route.ts       # Get commitment stores for chain                      │
│                              # GET ?chainId=X&includeRetracted=false                │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Example API Responses

**GET /api/aif/export?chainId=123&includeLocutions=true**

```json
{
  "success": true,
  "data": {
    "@context": {
      "aif": "http://www.arg.dundee.ac.uk/aif#",
      "mesh": "http://mesh-platform.io/ontology/aif#"
    },
    "nodes": [...],
    "edges": [...],
    "metadata": {
      "chainId": "123",
      "exportedAt": "2024-01-15T10:30:00Z",
      "nodeCount": 45,
      "edgeCount": 67,
      "includesDialogue": true
    }
  }
}
```

**GET /api/aif/schemes?clusterTag=authority&includeCQs=true**

```json
{
  "success": true,
  "data": [
    {
      "id": "scheme_expert_opinion",
      "key": "expert_opinion",
      "name": "Argument from Expert Opinion",
      "summary": "If E is an expert who asserts A, then A may be accepted.",
      "premises": ["E is an expert in domain D", "A falls within D", "E asserts A"],
      "conclusion": "A is true",
      "parentSchemeId": "scheme_authority_base",
      "clusterTag": "authority",
      "inheritCQs": true,
      "aspicMapping": {
        "ruleTemplate": "d_expert({source}, {domain}, {claim})",
        "ruleType": "defeasible"
      },
      "cqs": [
        {
          "id": "cq_expert_1",
          "cqKey": "expertise_genuine",
          "text": "Is E a genuine expert in D?",
          "attackKind": "UNDERMINES",
          "attackType": "UNDERMINES",
          "targetScope": "premise",
          "inherited": false
        },
        {
          "id": "cq_authority_1",
          "cqKey": "source_reliable",
          "text": "Is the source reliable?",
          "attackKind": "UNDERCUTS",
          "attackType": "UNDERCUTS",
          "targetScope": "inference",
          "inherited": true,
          "fromSchemeId": "scheme_authority_base"
        }
      ]
    }
  ]
}
```

**POST /api/aif/validate**

```json
// Request
{
  "graph": {
    "nodes": [...],
    "edges": [...]
  }
}

// Response (validation errors)
{
  "success": false,
  "errors": [
    {
      "type": "INVALID_EDGE",
      "message": "Edge from I-node to I-node is not allowed",
      "edge": { "from": "I:1", "to": "I:2", "type": "premise" },
      "suggestion": "Use an RA-node or CA-node as intermediary"
    },
    {
      "type": "ORPHAN_NODE",
      "message": "Node has no incoming or outgoing edges",
      "nodeId": "S:orphan123"
    }
  ],
  "warnings": [
    {
      "type": "MISSING_SCHEME",
      "message": "RA-node has no associated argument scheme",
      "nodeId": "S:arg456"
    }
  ]
}
```

---

## ASPIC+ Translation

The system provides bidirectional translation between AIF and ASPIC+ representations:

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                        AIF ↔ ASPIC+ TRANSLATION                                      │
│                                                                                      │
│   ┌───────────────────────────────────────────────────────────────────────────────┐ │
│   │                       AIF → ASPIC+ MAPPING                                     │ │
│   │                                                                                │ │
│   │   AIF Node                    ASPIC+ Element                                   │ │
│   │   ─────────────────────────   ──────────────────────────────────               │ │
│   │   I-node (ordinary)      →    Premise (in knowledge base)                      │ │
│   │   I-node (assumption)    →    Assumption (in assumptions set)                  │ │
│   │   RA-node                →    Rule (strict or defeasible)                      │ │
│   │   CA-node (rebut)        →    Rebut attack (on conclusion)                     │ │
│   │   CA-node (undermine)    →    Undermine attack (on premise)                    │ │
│   │   CA-node (undercut)     →    Undercut attack (on defeasible rule)             │ │
│   │   PA-node                →    Preference ordering (≺ relation)                 │ │
│   │                                                                                │ │
│   │   Scheme Mapping (aspicMapping):                                               │ │
│   │   ┌──────────────────────────────────────────────────────────────────────┐    │ │
│   │   │  ArgumentScheme.aspicMapping = {                                      │    │ │
│   │   │    ruleTemplate: "d_expert({source}, {domain}, {claim})",             │    │ │
│   │   │    ruleType: "defeasible",   // 'd_' prefix                           │    │ │
│   │   │    premiseVars: ["source", "domain", "claim"],                        │    │ │
│   │   │    conclusionVar: "claim"                                             │    │ │
│   │   │  }                                                                    │    │ │
│   │   └──────────────────────────────────────────────────────────────────────┘    │ │
│   │                                                                                │ │
│   │   CQ Mapping (aspicMapping):                                                   │ │
│   │   ┌──────────────────────────────────────────────────────────────────────┐    │ │
│   │   │  CriticalQuestion.aspicMapping = {                                    │    │ │
│   │   │    // For UNDERMINES (attacks premise)                                │    │ │
│   │   │    premiseIndex: 0,            // Which premise to attack             │    │ │
│   │   │    // For UNDERCUTS (attacks rule)                                    │    │ │
│   │   │    defeasibleRuleRequired: true,                                      │    │ │
│   │   │    ruleId: "d_expert"          // Which rule to undercut              │    │ │
│   │   │  }                                                                    │    │ │
│   │   └──────────────────────────────────────────────────────────────────────┘    │ │
│   └───────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
│   ┌───────────────────────────────────────────────────────────────────────────────┐ │
│   │                     TRANSLATION FUNCTION                                       │ │
│   │                                                                                │ │
│   │   // /lib/aspic/translation/aifToAspic.ts                                      │ │
│   │                                                                                │ │
│   │   function translateAIFToASPIC(                                                │ │
│   │     aifGraph: AIFGraph,                                                        │ │
│   │     options: {                                                                 │ │
│   │       defaultRuleType?: 'strict' | 'defeasible';                               │ │
│   │       treatUnschemed?: 'defeasible' | 'strict' | 'skip';                       │ │
│   │       includeContraries?: boolean;                                             │ │
│   │     }                                                                          │ │
│   │   ): ASPICTheory {                                                             │ │
│   │     // 1. Extract knowledge base from I-nodes                                  │ │
│   │     const Kn = extractKnowledgeBase(aifGraph.nodes);                           │ │
│   │                                                                                │ │
│   │     // 2. Partition assumptions from ordinary premises                         │ │
│   │     const [assumptions, ordinaryPremises] = partitionAssumptions(Kn);          │ │
│   │                                                                                │ │
│   │     // 3. Extract rules from RA-nodes                                          │ │
│   │     const Rd = extractDefeasibleRules(aifGraph.nodes, aifGraph.edges);         │ │
│   │     const Rs = extractStrictRules(aifGraph.nodes, aifGraph.edges);             │ │
│   │                                                                                │ │
│   │     // 4. Build contrariness function from CA-nodes                            │ │
│   │     const contraries = buildContrariness(aifGraph);                            │ │
│   │                                                                                │ │
│   │     // 5. Build preference relation from PA-nodes                              │ │
│   │     const preferences = buildPreferences(aifGraph);                            │ │
│   │                                                                                │ │
│   │     return {                                                                   │ │
│   │       axioms: ordinaryPremises,                                                │ │
│   │       assumptions: assumptions,                                                │ │
│   │       strictRules: Rs,                                                         │ │
│   │       defeasibleRules: Rd,                                                     │ │
│   │       contraries: contraries,                                                  │ │
│   │       preferences: preferences                                                 │ │
│   │     };                                                                         │ │
│   │   }                                                                            │ │
│   └───────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
│   ┌───────────────────────────────────────────────────────────────────────────────┐ │
│   │                   ATTACK TYPE CORRESPONDENCE                                   │ │
│   │                                                                                │ │
│   │   ┌─────────────────────────────────────────────────────────────────────────┐ │ │
│   │   │                                                                         │ │ │
│   │   │   AIF CA-node                  ASPIC+ Attack                            │ │ │
│   │   │   ───────────────────────────  ─────────────────────────────────────    │ │ │
│   │   │                                                                         │ │ │
│   │   │   conflictType: "rebut"    →   Attack on argument conclusion            │ │ │
│   │   │   (CA → conclusion I-node)     AttackRelation.REBUT                     │ │ │
│   │   │                                                                         │ │ │
│   │   │   conflictType: "undermine" →  Attack on argument premise               │ │ │
│   │   │   (CA → premise I-node)        AttackRelation.UNDERMINE                 │ │ │
│   │   │                                                                         │ │ │
│   │   │   conflictType: "undercut" →   Attack on defeasible rule                │ │ │
│   │   │   (CA → RA-node)               AttackRelation.UNDERCUT                  │ │ │
│   │   │                                                                         │ │ │
│   │   └─────────────────────────────────────────────────────────────────────────┘ │ │
│   │                                                                                │ │
│   │   Defeat Resolution via PA-nodes:                                              │ │
│   │   ┌─────────────────────────────────────────────────────────────────────────┐ │ │
│   │   │  If PA-node prefers attacker over target:                               │ │ │
│   │   │    Attack becomes Defeat (attacker wins)                                │ │ │
│   │   │                                                                         │ │ │
│   │   │  If PA-node prefers target over attacker:                               │ │ │
│   │   │    Attack blocked (target survives)                                     │ │ │
│   │   │                                                                         │ │ │
│   │   │  If no PA-node: Use lastLink/weakestLink principle                      │ │ │
│   │   └─────────────────────────────────────────────────────────────────────────┘ │ │
│   └───────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### CQ-to-Attack Mapping

Critical questions are mapped to ASPIC+ attacks:

```typescript
// /lib/aspic/cqMapping.ts

interface CQAttackMapping {
  cqKey: string;
  schemeKey: string;
  
  // What the CQ attacks
  targetType: 'premise' | 'rule' | 'conclusion';
  premiseIndex?: number;     // For premise attacks
  ruleId?: string;           // For undercuts
  
  // Attack semantics
  attackType: 'REBUTS' | 'UNDERCUTS' | 'UNDERMINES';
  
  // Burden management
  burdenOfProof: 'PROPONENT' | 'OPPONENT' | 'SHARED';
  
  // UI guidance
  uiHint?: string;           // "Select the premise being questioned"
}

function mapCQToAspicAttack(
  cq: CriticalQuestion,
  scheme: ArgumentScheme,
  targetArgument: ASPICArgument
): AttackResult | null;
```

---

## Validation System

The validation system ensures AIF graphs conform to ontological constraints:

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                          AIF VALIDATION RULES                                        │
│                                                                                      │
│   ┌───────────────────────────────────────────────────────────────────────────────┐ │
│   │                       VALID EDGE CONNECTIONS                                   │ │
│   │                                                                                │ │
│   │   Source Type    Edge Type         Target Type    Validity                     │ │
│   │   ───────────    ─────────────     ───────────    ────────                     │ │
│   │   I-node         premise           RA-node        ✓ Valid                      │ │
│   │   I-node         premise           CA-node        ✗ Invalid                    │ │
│   │   I-node         conflicting       CA-node        ✓ Valid                      │ │
│   │   RA-node        conclusion        I-node         ✓ Valid                      │ │
│   │   RA-node        conflicting       CA-node        ✓ Valid                      │ │
│   │   CA-node        conflicted        I-node         ✓ Valid                      │ │
│   │   CA-node        conflicted        RA-node        ✓ Valid                      │ │
│   │   I-node         preferred         PA-node        ✓ Valid                      │ │
│   │   PA-node        dispreferred      I-node         ✓ Valid                      │ │
│   │   L-node         illocutes         I-node         ✓ Valid                      │ │
│   │   L-node         illocutes         RA-node        ✓ Valid                      │ │
│   │   L-node         replies           L-node         ✓ Valid                      │ │
│   │   I-node         ---any---         I-node         ✗ Invalid                    │ │
│   │   RA-node        ---any---         RA-node        ✗ Invalid                    │ │
│   └───────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
│   ┌───────────────────────────────────────────────────────────────────────────────┐ │
│   │                       STRUCTURAL CONSTRAINTS                                   │ │
│   │                                                                                │ │
│   │   1. RA-node Requirements:                                                     │ │
│   │      • Must have at least 1 incoming premise edge                              │ │
│   │      • Must have exactly 1 outgoing conclusion edge                            │ │
│   │      • Should have scheme annotation for full compliance                       │ │
│   │                                                                                │ │
│   │   2. CA-node Requirements:                                                     │ │
│   │      • Must have exactly 1 incoming conflicting edge                           │ │
│   │      • Must have exactly 1 outgoing conflicted edge                            │ │
│   │      • Conflicting and conflicted cannot be same node                          │ │
│   │                                                                                │ │
│   │   3. PA-node Requirements:                                                     │ │
│   │      • Must have exactly 1 incoming preferred edge                             │ │
│   │      • Must have exactly 1 outgoing dispreferred edge                          │ │
│   │      • Preferred and dispreferred cannot be same node                          │ │
│   │      • Both nodes should be comparable (same type/level)                       │ │
│   │                                                                                │ │
│   │   4. L-node Requirements (if dialogue enabled):                                │ │
│   │      • Must have at least 1 illocutes edge to I/RA-node                        │ │
│   │      • Must have participant attribution                                       │ │
│   │      • Should have timestamp for ordering                                      │ │
│   │                                                                                │ │
│   │   5. Graph-Level:                                                              │ │
│   │      • No cycles in RA chains (prevents infinite regression)                   │ │
│   │      • All nodes should be reachable from at least one I-node                  │ │
│   │      • CA-nodes should not form attack cycles without PA resolution            │ │
│   └───────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
│   ┌───────────────────────────────────────────────────────────────────────────────┐ │
│   │                       VALIDATION FUNCTIONS                                     │ │
│   │                                                                                │ │
│   │   // /lib/aif/validate.ts                                                      │ │
│   │                                                                                │ │
│   │   interface ValidationResult {                                                 │ │
│   │     valid: boolean;                                                            │ │
│   │     errors: ValidationError[];                                                 │ │
│   │     warnings: ValidationWarning[];                                             │ │
│   │   }                                                                            │ │
│   │                                                                                │ │
│   │   function validateEdge(edge: Edge, sourceNode: Node, targetNode: Node):       │ │
│   │     { valid: boolean; error?: string };                                        │ │
│   │                                                                                │ │
│   │   function validateGraph(graph: AIFGraph): ValidationResult;                   │ │
│   │                                                                                │ │
│   │   function validateAifJsonLd(jsonld: object): ValidationResult;                │ │
│   │                                                                                │ │
│   │   // Edge validity matrix                                                      │ │
│   │   const VALID_EDGE_CONNECTIONS: Record<EdgeType, {                             │ │
│   │     allowedSources: NodeType[];                                                │ │
│   │     allowedTargets: NodeType[];                                                │ │
│   │   }>;                                                                          │ │
│   └───────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Integration Points

### With ASPIC+ Engine

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                        AIF ↔ ASPIC+ INTEGRATION                                      │
│                                                                                      │
│   ┌─────────────────────┐                      ┌─────────────────────┐              │
│   │   AIF Ontology      │                      │   ASPIC+ Engine     │              │
│   │                     │                      │                     │              │
│   │  I-nodes, RA-nodes  │──── translate ─────→ │  Arguments          │              │
│   │  CA-nodes           │                      │  Attack relations   │              │
│   │  PA-nodes           │──── translate ─────→ │  Defeat ordering    │              │
│   │                     │                      │                     │              │
│   │  Schemes + CQs      │──── map ───────────→ │  Rules + Premises   │              │
│   │                     │                      │  Attack patterns    │              │
│   │                     │                      │                     │              │
│   │  (external format)  │                      │  (evaluation)       │              │
│   └─────────────────────┘                      └──────────┬──────────┘              │
│                                                           │                          │
│                                                           ▼                          │
│                                                ┌─────────────────────┐              │
│                                                │  Grounded Semantics │              │
│                                                │  Extension          │              │
│                                                │  • IN/OUT/UNDEC     │              │
│                                                └─────────────────────┘              │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### With UI Components

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                          UI COMPONENT MAPPING                                        │
│                                                                                      │
│   AIF Concept              UI Component                                              │
│   ───────────────────────  ─────────────────────────────────────────────────────    │
│   I-node                   ClaimCard, NodeBadge (type="information")                 │
│   RA-node                  ArgumentCard with SchemeIndicator                         │
│   CA-node                  AttackBadge, ConflictArrow                                │
│   PA-node                  PreferenceBadge, OrderingIndicator                        │
│   L-node                   DialogueMoveCard, CommitmentIndicator                     │
│   Scheme                   SchemeSelector, SchemePremisesForm                        │
│   CQ                       CriticalQuestionPanel, CQAttackButton                     │
│   Commitment               CommitmentBadge, CommitmentStorePanel                     │
│   Export                   ExportDialog with format selector                         │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## References

### Academic Sources

1. **Reed, C. & Rowe, G. (2007)**  
   "Araucaria: Software for Argument Analysis, Diagramming and Representation"  
   *Defines core AIF ontology*

2. **Chesñevar, C., McGinnis, J., Modgil, S., Rahwan, I., Reed, C., Simari, G., South, M., Vreeswijk, G., & Willmott, S. (2006)**  
   "Towards an Argument Interchange Format"  
   *The Knowledge Engineering Review, 21(4), 293-316*

3. **Rahwan, I. & Reed, C. (2009)**  
   "The Argument Interchange Format"  
   *In Argumentation in Artificial Intelligence*

4. **Walton, D., Reed, C., & Macagno, F. (2008)**  
   *Argumentation Schemes*  
   Cambridge University Press

5. **Modgil, S. & Prakken, H. (2013)**  
   "A general account of argumentation with preferences"  
   *Artificial Intelligence, 195, 361-397*  
   *(For ASPIC+ integration)*

### Mesh Platform Documentation

- [ASPIC_SYSTEM_ARCHITECTURE.md](./ASPIC_SYSTEM_ARCHITECTURE.md) - ASPIC+ implementation details
- [AIF_CORRESPONDENCE_PHASE2.md](../AIF_CORRESPONDENCE_PHASE2.md) - AIF-ASPIC mapping
- [AgoraFoundations.md](../AgoraFoundations.md) - Dialogue system foundations

---

## Appendix A: Complete Type Definitions

```typescript
// /lib/aif/types.ts - Core AIF Types

// Node Types
export type NodeType = 'I' | 'L' | 'RA' | 'CA' | 'PA' | 'TA';

// Edge Types
export type EdgeType = 
  | 'premise' 
  | 'conclusion' 
  | 'conflicting' 
  | 'conflicted'
  | 'preferred'
  | 'dispreferred'
  | 'illocutes'
  | 'replies';

// Illocution Types (speech acts)
export type IlocutionType = 
  | 'ASSERT' 
  | 'CONCEDE' 
  | 'RETRACT' 
  | 'WHY' 
  | 'GROUNDS'
  | 'THEREFORE'
  | 'SUPPOSE'
  | 'DISCHARGE'
  | 'CLOSE'
  | 'ACCEPT_ARGUMENT';

// Scheme Types
export type SchemeType = 
  | 'presumptive' 
  | 'deductive' 
  | 'inductive' 
  | 'abductive';

// Inference Types
export type InferenceType = 
  | 'strict' 
  | 'defeasible';

// Conflict Types
export type ConflictType = 
  | 'rebut' 
  | 'undercut' 
  | 'undermine';

// Preference Types
export type PreferenceType = 
  | 'last_link' 
  | 'weakest_link' 
  | 'explicit';

// Node Interfaces
interface BaseNode {
  id: string;
  type: NodeType;
  text?: string;
  metadata?: Record<string, unknown>;
}

interface INode extends BaseNode {
  type: 'I';
  text: string;
  claimId?: string;
  isAssumption?: boolean;
  isAxiom?: boolean;
}

interface LNode extends BaseNode {
  type: 'L';
  illocution: IlocutionType;
  participantId: string;
  timestamp?: Date;
  targetId?: string;
}

interface RANode extends BaseNode {
  type: 'RA';
  schemeKey?: string;
  schemeName?: string;
  inferenceType: InferenceType;
}

interface CANode extends BaseNode {
  type: 'CA';
  conflictType: ConflictType;
}

interface PANode extends BaseNode {
  type: 'PA';
  preferenceType: PreferenceType;
  preferenceScope?: 'argument' | 'rule' | 'premise';
}

interface TANode extends BaseNode {
  type: 'TA';
  transitionType: string;
}

// Edge Interface
interface Edge {
  id: string;
  type: EdgeType;
  from: string;  // Node ID
  to: string;    // Node ID
  metadata?: Record<string, unknown>;
}

// Graph Interface
interface AIFGraph {
  nodes: Array<INode | LNode | RANode | CANode | PANode | TANode>;
  edges: Edge[];
  context?: Record<string, string>;  // JSON-LD @context
  metadata?: {
    chainId?: string;
    exportedAt?: Date;
    version?: string;
  };
}
```

---

## Appendix B: Database Model Summary

| Model | Purpose | Key Fields |
|-------|---------|------------|
| `Argument` | Stores arguments (→ RA-nodes) | premises, claimId, schemeId |
| `Claim` | Stores propositions (→ I-nodes) | content, deliberationId |
| `ConflictApplication` | Stores attacks (→ CA-nodes) | attackType, targetType, resolutionStatus |
| `PreferenceApplication` | Stores orderings (→ PA-nodes) | preferredId, dispreferredId, scope |
| `ArgumentScheme` | Stores scheme templates | key, premises, conclusion, aspicMapping |
| `CriticalQuestion` | Stores CQs per scheme | attackKind, targetScope, aspicMapping |
| `DialogueMove` | Stores speech acts (→ L-nodes) | kind, illocution, payload |
| `AssumptionUse` | Tracks assumption instances | sourceType, inferredByAspic |

---

*End of AIF Ontology System Architecture Document*

**Version:** 1.0  
**Last Updated:** January 2025  
**Authors:** Mesh Platform Architecture Team
