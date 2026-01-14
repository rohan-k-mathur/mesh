# Commitment System Architecture

## Document Overview

This document provides comprehensive technical documentation for the Mesh platform's **Commitment System** — a dual-layer architecture that tracks participant commitments in formal dialogues. The system implements both **Dialogue Commitments** (tracking public debate claims) and **Ludics Commitments** (tracking formal proof obligations with game-theoretic semantics).

**Document Version**: 1.0  
**Last Updated**: December 2024  
**Related Documents**: `ASPIC_SYSTEM_ARCHITECTURE.md`, `ARGUMENTS_TAB_ARCHITECTURE.md`, `NCR_ISSUES_PROPOSITIONS_ARCHITECTURE.md`

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture Overview](#2-system-architecture-overview)
3. [Database Schema](#3-database-schema)
4. [Dialogue Commitment System](#4-dialogue-commitment-system)
5. [Ludics Commitment System](#5-ludics-commitment-system)
6. [Commitment-Ludics Bridge](#6-commitment-ludics-bridge)
7. [Component Architecture](#7-component-architecture)
8. [API Routes Reference](#8-api-routes-reference)
9. [Service Layer](#9-service-layer)
10. [Event System](#10-event-system)
11. [Data Flow Diagrams](#11-data-flow-diagrams)
12. [Theoretical Foundations](#12-theoretical-foundations)
13. [Type Definitions](#13-type-definitions)
14. [File Location Summary](#14-file-location-summary)

---

## 1. Executive Summary

The Mesh platform implements a **dual commitment tracking system** with intentionally separate purposes:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        COMMITMENT SYSTEM OVERVIEW                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────┐       ┌─────────────────────────────────┐  │
│  │   DIALOGUE COMMITMENTS      │       │    LUDICS COMMITMENTS           │  │
│  │                             │       │                                 │  │
│  │  • Track public claims      │       │  • Track proof obligations      │  │
│  │  • Per-participant stores   │ ───▶  │  • Game-theoretic semantics     │  │
│  │  • Simple flat structure    │       │  • Polarity-based (pos/neg)     │  │
│  │  • Derived from moves       │       │  • Locus-scoped inference       │  │
│  │                             │       │                                 │  │
│  └─────────────────────────────┘       └─────────────────────────────────┘  │
│                                                                              │
│                    CommitmentLudicMapping (Bridge)                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Design Principles

| Principle | Implementation |
|-----------|---------------|
| **Separation of Concerns** | Dialogue layer for debate tracking, Ludics layer for formal reasoning |
| **Provenance Tracking** | Every commitment traced back to its originating DialogueMove |
| **Defeasibility** | Commitments can be retracted (dialogue) or lose entitlement (ludics) |
| **Bridge Mechanism** | CommitmentLudicMapping enables promotion from informal to formal |
| **Performance** | Redis caching, indexed queries, pagination support |

---

## 2. System Architecture Overview

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACE LAYER                               │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────┐    ┌─────────────────────────────────────┐  │
│  │    CommitmentStorePanel    │    │       CommitmentsPanel (Ludics)     │  │
│  │  • Per-participant tabs    │    │  • Add facts/rules                  │  │
│  │  • Active/retracted view   │    │  • Forward-chaining inference       │  │
│  │  • Timeline visualization  │    │  • Contradiction detection          │  │
│  │  • "Promote to Ludics" btn │    │  • Entitlement toggling             │  │
│  └────────────────────────────┘    └─────────────────────────────────────┘  │
│                    │                                │                        │
│                    ▼                                ▼                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                              API LAYER                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────┐    ┌─────────────────────────────────────┐  │
│  │   Dialogue Commitment APIs │    │       Ludics Commitment APIs        │  │
│  │  • GET .../commitments     │    │  • POST /commitments/apply          │  │
│  │  • GET .../analytics       │    │  • GET /commitments/state           │  │
│  │  • GET .../diff            │    │  • POST /commitments/infer          │  │
│  │                            │    │  • POST /commitments/promote        │  │
│  └────────────────────────────┘    └─────────────────────────────────────┘  │
│                    │                                │                        │
│                    ▼                                ▼                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                            SERVICE LAYER                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────┐    ┌─────────────────────────────────────┐  │
│  │   getCommitmentStores()    │    │      Ludics Engine                  │  │
│  │   lib/aif/graph-builder    │    │  • applyToCS()                      │  │
│  │  • Derives from DialogMove │    │  • interactCE()                     │  │
│  │  • Redis caching           │    │  • interactCEScoped()               │  │
│  │  • Includes promotion      │    │  • checkSemanticDivergence()        │  │
│  └────────────────────────────┘    └─────────────────────────────────────┘  │
│                    │                                │                        │
│                    ▼                                ▼                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                           DATABASE LAYER (Prisma)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────┐    ┌─────────────────────────────────────┐  │
│  │   Dialogue Models          │    │      Ludics Models                  │  │
│  │  • DialogueMove            │◄───┼──• CommitmentLudicMapping          │  │
│  │  • Commitment              │    │  • LudicCommitmentElement           │  │
│  │  • Claim                   │    │  • LudicCommitmentState             │  │
│  │  • Argument                │    │  • LudicLocus                       │  │
│  └────────────────────────────┘    └─────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

| Layer | Responsibility | Key Technologies |
|-------|---------------|------------------|
| **UI Layer** | Display commitment stores, enable management | React, SWR, Tailwind |
| **API Layer** | REST endpoints for CRUD and analytics | Next.js API Routes |
| **Service Layer** | Business logic, derivation, inference | TypeScript functions |
| **Database Layer** | Persistence, relationships, indexing | Prisma, PostgreSQL |

---

## 3. Database Schema

### 3.1 Dialogue Layer Models

#### Commitment Model

**Location**: `lib/models/schema.prisma`

```prisma
model Commitment {
  id             String   @id @default(cuid())
  deliberationId String
  participantId  String
  proposition    String   @db.Text
  isRetracted    Boolean  @default(false)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@unique([deliberationId, participantId, proposition])
  @@index([deliberationId, participantId])
}
```

**Purpose**: Track participant commitments in formal dialogue games (public debate layer)

**Key Features**:
- Simple flat structure (no FKs to Claim/DialogueMove for flexibility)
- Unique constraint prevents duplicate commitments per participant
- Soft delete via `isRetracted` flag
- Fast indexed lookups by deliberation and participant

---

#### DialogueMove Model (Commitment Source)

**Location**: `lib/models/schema.prisma`

```prisma
model DialogueMove {
  id             String      @id @default(cuid())
  authorId       String?
  deliberationId String
  targetType     String      // 'argument' | 'claim'
  targetId       String
  kind           String      // 'ASSERT' | 'WHY' | 'GROUNDS' | 'RETRACT' | 'CONCEDE' ...
  payload        Json?
  actorId        String
  createdAt      DateTime    @default(now())
  replyToMoveId  String?
  polarity       String?     // 'P' | 'O' (Proponent/Opponent)
  locusId        String?

  // Relations
  deliberation   Deliberation @relation(fields: [deliberationId], references: [id])
  author         User?        @relation(fields: [authorId], references: [id])
  locus          LudicLocus?  @relation(fields: [locusId], references: [id])
  replyToMove    DialogueMove? @relation("MoveReplies", fields: [replyToMoveId], references: [id])
  replies        DialogueMove[] @relation("MoveReplies")

  @@index([deliberationId, createdAt])
  @@index([targetType, targetId])
  @@index([actorId])
}
```

**Purpose**: Source of truth for dialogue moves that create/modify commitments

**Commitment-Relevant Move Kinds**:

| Move Kind | Commitment Effect |
|-----------|-------------------|
| `ASSERT` | Adds claim to speaker's commitment store |
| `CONCEDE` | Adds opponent's claim to own commitment store |
| `RETRACT` | Marks commitment as retracted |
| `THEREFORE` | Adds conclusion to commitment store |
| `GROUNDS` | Provides justification (may create supporting commitments) |

---

### 3.2 Ludics Layer Models

#### LudicCommitmentElement Model

**Location**: `lib/models/schema.prisma`

```prisma
model LudicCommitmentElement {
  id                     String      @id @default(cuid())
  ownerId                String      // "Proponent" | "Opponent" | user ID
  basePolarity           String      // 'pos' | 'neg'
  baseLocusId            String
  baseLocus              LudicLocus  @relation(fields: [baseLocusId], references: [id])
  label                  String?     // The proposition content
  entitled               Boolean?    @default(true)
  extJson                Json?       // Extended metadata
  
  // Relations
  designs                LudicDesign[]
  LudicCommitmentState   LudicCommitmentState? @relation(fields: [ludicCommitmentStateId], references: [id])
  ludicCommitmentStateId String?
  commitmentMappings     CommitmentLudicMapping[]

  @@index([ownerId, basePolarity])
  @@index([baseLocusId])
}
```

**Purpose**: Individual commitment elements in the proof-theoretic system

**Key Features**:
- **Polarity-based**: `pos` = facts (assertions), `neg` = rules (implications)
- **Locus-addressed**: Scoped to specific positions in dialogue tree
- **Entitlement tracking**: Can be marked as "not entitled" for defeasibility
- **Design provenance**: Many-to-many with LudicDesign for derivation tracking

---

#### LudicCommitmentState Model

```prisma
model LudicCommitmentState {
  id        String                   @id @default(cuid())
  ownerId   String                   // Aggregate owner identifier
  updatedAt DateTime                 @default(now())
  extJson   Json?                    // Snapshot metadata
  elements  LudicCommitmentElement[]

  @@index([ownerId])
}
```

**Purpose**: Aggregate state container for a participant's ludics commitments

---

#### LudicLocus Model

```prisma
model LudicLocus {
  id              String       @id @default(cuid())
  dialogueId      String?
  path            String       @db.VarChar(255)  // "0", "0.1", "0.1.2"
  parentId        String?
  parent          LudicLocus?  @relation("LocusChildren", fields: [parentId], references: [id])
  children        LudicLocus[] @relation("LocusChildren")
  
  // Back-references
  commitmentElements LudicCommitmentElement[]
  dialogueMoves      DialogueMove[]

  @@unique([dialogueId, path])
  @@index([dialogueId, path])
  @@index([parentId])
}
```

**Purpose**: Tree structure for nested dialogue positions (loci)

**Path Convention**:
- Root: `"0"`
- First child: `"0.1"`
- Nested: `"0.1.2"`, `"0.1.2.1"`, etc.

---

### 3.3 Bridge Model

#### CommitmentLudicMapping Model

```prisma
model CommitmentLudicMapping {
  id                       String   @id @default(cuid())
  dialogueCommitmentId     String   // Reference to dialogue commitment
  deliberationId           String
  participantId            String
  proposition              String   @db.Text
  ludicCommitmentElementId String
  ludicOwnerId             String
  ludicLocusId             String
  promotedAt               DateTime @default(now())
  promotedBy               String   // User who initiated promotion
  promotionContext         Json?    // Additional metadata

  // Relations
  ludicCommitmentElement   LudicCommitmentElement @relation(fields: [ludicCommitmentElementId], references: [id])

  @@unique([dialogueCommitmentId, ludicCommitmentElementId])
  @@index([deliberationId, participantId])
  @@index([ludicOwnerId])
}
```

**Purpose**: Bridge between dialogue and ludics commitment systems

**Key Features**:
- Links dialogue proposition to ludics element
- Tracks who promoted and when
- Allows same dialogue commitment to be promoted to multiple loci

---

### 3.4 Schema Comparison Table

| Feature | Dialogue Commitments | Ludics Commitments |
|---------|---------------------|-------------------|
| **Purpose** | Track public claims | Track proof obligations |
| **Granularity** | Deliberation-wide | Locus-specific |
| **Structure** | Flat key-value | Graph with relations |
| **Provenance** | Implicit (via DialogueMove) | Explicit (via designs, locus) |
| **Logic** | Simple (committed/retracted) | Rich (polarity, entitlement, derivation) |
| **Performance** | Fast (indexed) | Complex (requires joins) |
| **Use Case** | UI display, basic tracking | Formal inference, contradiction detection |

---

## 4. Dialogue Commitment System

### 4.1 Core Concepts

The Dialogue Commitment System tracks **what each participant has publicly committed to** during a deliberation. This follows the Walton-Krabbe model of commitment stores in formal dialogue games.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     DIALOGUE COMMITMENT FLOW                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Participant A                          Participant B                       │
│   ┌─────────────────┐                    ┌─────────────────┐                │
│   │ Commitment      │                    │ Commitment      │                │
│   │ Store           │                    │ Store           │                │
│   │                 │                    │                 │                │
│   │ • Claim X ✓     │                    │ • Claim Y ✓     │                │
│   │ • Claim Z ✓     │◄───── CONCEDE ─────│ • Claim X ✓     │                │
│   │ • Claim W ✗     │                    │ (conceded from A)│               │
│   │   (retracted)   │                    │                 │                │
│   └─────────────────┘                    └─────────────────┘                │
│          │                                        │                         │
│          └────────────── ASSERT ─────────────────►│                         │
│          │                                        │                         │
│          │◄───────────── RETRACT ────────────────│                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Move Kinds and Their Effects

```typescript
export type MoveKind =
  | "ASSERT"           // Adds claim to commitment store
  | "WHY"              // Challenge for justification (no commitment change)
  | "GROUNDS"          // Provide supporting argument
  | "RETRACT"          // Removes claim from commitment store
  | "CONCEDE"          // Adds opponent's claim to own commitment store
  | "CLOSE"            // Close dialogue branch
  | "THEREFORE"        // Draw conclusion (creates commitment)
  | "SUPPOSE"          // Hypothetical assumption
  | "DISCHARGE"        // Close hypothetical
  | "ACCEPT_ARGUMENT"; // Accept argument structure

export type MoveForce = "ATTACK" | "SURRENDER" | "NEUTRAL";
```

### 4.3 Commitment Store Derivation

The system **derives** commitment stores from DialogueMove history rather than storing them directly. This ensures consistency and enables time-travel queries.

**Derivation Algorithm**:

```
getCommitmentStores(deliberationId, options):
  
  1. QUERY: Fetch all DialogueMoves for deliberation
     - JOIN with User (for participant names)
     - JOIN with Claim (for claim text)
     - JOIN with Argument (for argument conclusions)
     - JOIN with CommitmentLudicMapping (for promotion status)
     - ORDER BY createdAt ASC
  
  2. INITIALIZE: Create empty commitment store per participant
     stores = Map<participantId, CommitmentRecord[]>
  
  3. PROCESS moves chronologically:
     FOR each move in moves:
       SWITCH move.kind:
         CASE "ASSERT", "CONCEDE", "THEREFORE":
           ADD commitment to stores[move.actorId]
           SET isActive = true
         CASE "RETRACT":
           FIND matching commitment in stores[move.actorId]
           SET isActive = false
  
  4. ENRICH: Add promotion status from CommitmentLudicMapping
  
  5. RETURN: Array of CommitmentStore objects with pagination
```

### 4.4 Commitment Store Data Structure

```typescript
interface CommitmentStore {
  participantId: string;
  participantName: string;
  commitments: CommitmentRecord[];
  totalCommitments: number;
  hasMore: boolean;
}

interface CommitmentRecord {
  claimId: string;
  claimText: string;
  moveId: string;
  moveKind: "ASSERT" | "CONCEDE" | "RETRACT";
  timestamp: string | Date;
  isActive: boolean;           // false if retracted
  isPromoted?: boolean;        // true if promoted to ludics
  promotedAt?: string;
  ludicOwnerId?: string;
  ludicPolarity?: string;
}
```

### 4.5 Contradiction Detection (Dialogue Layer)

The dialogue layer includes basic contradiction detection without requiring ludics formalization:

```typescript
interface Contradiction {
  claimA: { id: string; text: string; moveId: string };
  claimB: { id: string; text: string; moveId: string };
  reason: string;
  confidence: number;  // 0-1
  type: "explicit_negation" | "semantic_opposition" | "contraries";
}
```

**Detection Strategies**:
1. **Explicit negation**: "X" vs "not X", "X" vs "¬X"
2. **Infix negation**: "can" vs "cannot", "should" vs "should not"
3. **Suffix negation**: "X is true" vs "X is false"
4. **Semantic opposition**: Detected via NLP/embedding similarity

---

## 5. Ludics Commitment System

### 5.1 Theoretical Background

The Ludics Commitment System is based on **Jean-Yves Girard's Ludics** framework — a proof-theoretic approach to dialogue and interaction. Unlike the flat dialogue commitment stores, ludics commitments have rich structure:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     LUDICS COMMITMENT STRUCTURE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        COMMITMENT STATE                              │    │
│  │                        (ownerId: "Proponent")                        │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │                                                                      │    │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │    │
│  │  │ POSITIVE (Facts) │  │ POSITIVE (Facts) │  │ NEGATIVE (Rules) │   │    │
│  │  │                  │  │                  │  │                  │   │    │
│  │  │ label: "contract"│  │ label: "paid"    │  │ label: "contract │   │    │
│  │  │ locus: "0"       │  │ locus: "0.1"     │  │   & paid ->      │   │    │
│  │  │ entitled: true   │  │ entitled: true   │  │   fulfilled"     │   │    │
│  │  │                  │  │                  │  │ locus: "0"       │   │    │
│  │  │                  │  │                  │  │ entitled: true   │   │    │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘   │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  INFERENCE: contract ∧ paid → fulfilled                                     │
│  DERIVED:   { fulfilled } ← Now entitled as derived fact                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Core Concepts

| Concept | Description | Example |
|---------|-------------|---------|
| **Polarity** | `pos` = facts, `neg` = rules | `pos: "contract"`, `neg: "A & B -> C"` |
| **Locus** | Position in dialogue tree | `"0"` (root), `"0.1.2"` (nested) |
| **Entitlement** | Whether commitment is defensible | `entitled: true` (can be challenged) |
| **Owner** | Participant holding commitment | `"Proponent"`, `"Opponent"`, user ID |
| **Design** | Derivation/proof structure | Links to source elements |

### 5.3 Polarity System

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         POLARITY SEMANTICS                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  POSITIVE (pos)                         NEGATIVE (neg)                       │
│  ─────────────                          ─────────────                        │
│  • Facts / Assertions                   • Rules / Implications               │
│  • "I claim X is true"                  • "If X then Y"                      │
│  • Can be challenged                    • Can be applied to derive facts     │
│  • Example: "contract"                  • Example: "contract & paid -> ok"   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    FORWARD-CHAINING INFERENCE                        │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │                                                                      │    │
│  │  GIVEN:                                                              │    │
│  │    Facts (pos):  { contract, delivered }                             │    │
│  │    Rules (neg):  { contract & delivered -> payment_due }             │    │
│  │                                                                      │    │
│  │  DERIVE:                                                             │    │
│  │    1. Match rule antecedent: "contract & delivered"                  │    │
│  │    2. All antecedents present in facts? YES                          │    │
│  │    3. Add consequent to derived facts: { payment_due }               │    │
│  │                                                                      │    │
│  │  RESULT:                                                             │    │
│  │    derivedFacts: [ { label: "payment_due" } ]                        │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.4 Locus Inheritance

Commitments at a locus **inherit** from ancestor loci:

```
                    Locus "0" (Root)
                    ┌───────────────┐
                    │ Facts: {A, B} │
                    │ Rules: {A->C} │
                    └───────┬───────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
        Locus "0.1"                 Locus "0.2"
        ┌───────────────┐          ┌───────────────┐
        │ Facts: {D}    │          │ Facts: {E}    │
        │ Inherited:    │          │ Inherited:    │
        │   {A, B, A->C}│          │   {A, B, A->C}│
        └───────┬───────┘          └───────────────┘
                │
                ▼
          Locus "0.1.1"
          ┌───────────────┐
          │ Facts: {F}    │
          │ Inherited:    │
          │   {A,B,D,A->C}│
          └───────────────┘
```

**Scoped Inference**: When running inference at a locus, the engine:
1. Collects all ancestor loci
2. Gathers commitments from each ancestor
3. Runs forward-chaining with combined fact/rule sets
4. Reports contradictions with source tracking (local vs inherited)

### 5.5 Entitlement System

Entitlement tracks whether a commitment is **defensible**:

```typescript
// Entitlement states
entitled: true   // Commitment is defensible, can be used in inference
entitled: false  // Commitment is challenged/defeated, excluded from inference

// Toggling entitlement via API
POST /api/commitments/entitlement
{
  elementId: "cel_123",
  entitled: false,
  reason: "Challenged by opponent"
}
```

**Use Cases**:
- Mark commitment as challenged after successful attack
- Temporarily disable commitment for what-if analysis
- Track defeasibility in ASPIC+ style reasoning

### 5.6 Ludics Engine Operations

#### applyToCS() — Apply Operations to Commitment State

```typescript
interface ApplyToCSOps {
  add?: Array<{
    label: string;           // Proposition content
    basePolarity: 'pos' | 'neg';
    baseLocusPath?: string;  // Default: "0"
    entitled?: boolean;      // Default: true
    derived?: boolean;       // If true, mark as derived
  }>;
  erase?: Array<{
    byLabel?: string;        // Erase by label match
    byLocusPath?: string;    // Erase by locus
  }>;
}

// Usage
POST /api/commitments/apply
{
  dialogueId: "dlg_123",
  ownerId: "Proponent",
  ops: {
    add: [
      { label: "contract", basePolarity: "pos" },
      { label: "delivered", basePolarity: "pos" },
      { label: "contract & delivered -> payment_due", basePolarity: "neg" }
    ]
  },
  autoPersistDerived: true
}
```

#### interactCE() — Forward-Chaining Inference

```typescript
interface InteractCEResult {
  derivedFacts: Array<{ label: string }>;
  contradictions: Array<{ a: string; b: string }>;
  blocked: boolean;          // true if contradiction blocks reasoning
  code?: 'CS_CONTRADICTION' | 'RULE_VALIDATION_ERROR';
}
```

**Algorithm**:
1. Load all entitled elements for owner
2. Partition into positive (facts) and negative (rules)
3. Parse rules into antecedent/consequent pairs
4. Forward-chain: For each rule, check if antecedents ⊆ facts
5. If match, add consequent to derived facts
6. Repeat until fixed-point
7. Check for contradictions: fact ∧ ¬fact

#### interactCEScoped() — Scoped Inference at Locus

```typescript
interface ScopedInferenceResult extends InteractCEResult {
  inheritedFrom: Array<{
    locusPath: string;
    elements: string[];
  }>;
  contradictionSources: Array<{
    contradiction: { a: string; b: string };
    source: 'local' | 'inherited';
    locusPath: string;
  }>;
}
```

**Key Difference**: Includes ancestor locus commitments in inference scope.

---

## 6. Commitment-Ludics Bridge

### 6.1 Bridge Overview

The bridge system allows **promotion** of dialogue commitments to the formal ludics layer for deeper analysis:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     COMMITMENT PROMOTION FLOW                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   DIALOGUE LAYER                           LUDICS LAYER                      │
│   ──────────────                           ────────────                      │
│                                                                              │
│   CommitmentStore                                                            │
│   ┌─────────────────┐                                                       │
│   │ Participant: A  │                                                       │
│   │                 │                                                       │
│   │ ┌─────────────┐ │    "Promote to Ludics"    ┌─────────────────────┐    │
│   │ │ "contract   │ │ ─────────────────────────▶│ LudicCommitmentElem │    │
│   │ │  is valid"  │ │                           │                     │    │
│   │ │  ✓ active   │ │                           │ label: "contract    │    │
│   │ │  ⬆ promote  │ │                           │        is valid"    │    │
│   │ └─────────────┘ │                           │ polarity: pos       │    │
│   │                 │                           │ locus: "0"          │    │
│   └─────────────────┘                           │ owner: "Proponent"  │    │
│                                                  └──────────┬──────────┘    │
│                                                             │               │
│                                                             ▼               │
│   ┌───────────────────────────────────────────────────────────────────┐    │
│   │                   CommitmentLudicMapping                           │    │
│   │                                                                    │    │
│   │  dialogueCommitmentId ──────────────▶ ludicCommitmentElementId    │    │
│   │  deliberationId: "del_123"           ludicOwnerId: "Proponent"    │    │
│   │  participantId: "user_456"           ludicLocusId: "loc_789"      │    │
│   │  proposition: "contract is valid"    promotedAt: 2024-12-13       │    │
│   │                                      promotedBy: "user_456"        │    │
│   └───────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Promotion API

```typescript
// POST /api/commitments/promote
interface PromoteCommitmentRequest {
  deliberationId: string;
  participantId: string;
  proposition: string;
  targetOwnerId: string;      // e.g., "Proponent", "Opponent"
  targetLocusPath?: string;   // default: "0" (root)
  basePolarity: 'pos' | 'neg';
}

interface PromoteCommitmentResponse {
  ok: boolean;
  mapping: {
    id: string;
    dialogueCommitmentId: string;
    ludicCommitmentElementId: string;
    promotedAt: string;
  };
  ludicElement: {
    id: string;
    label: string;
    basePolarity: string;
    baseLocusId: string;
  };
}
```

### 6.3 Export from Ludics

Derived facts can be **exported back** to the dialogue layer:

```typescript
// POST /api/commitments/export-from-ludics
interface ExportFromLudicsRequest {
  ludicElementId: string;
  targetDeliberationId: string;
  targetParticipantId: string;
  createDialogueMove?: boolean;  // If true, creates ASSERT move
}
```

### 6.4 Semantic Divergence Detection

Check if two owners have semantically contradictory commitments:

```typescript
// GET /api/commitments/semantic-divergence?ownerId1=Proponent&ownerId2=Opponent&locusPath=0
interface SemanticDivergenceResult {
  hasDivergence: boolean;
  divergences: Array<{
    owner1Element: string;
    owner2Element: string;
    type: 'direct_contradiction' | 'derived_contradiction' | 'semantic';
    confidence: number;
  }>;
}
```

---

## 7. Component Architecture

### 7.1 Component Hierarchy

```
DeepDivePanelV2
├── Tab: "Commitments"
│   └── CommitmentsTabContent
│       ├── CommitmentStorePanel (dialogue commitments)
│       │   ├── ParticipantTabs
│       │   │   └── CommitmentList
│       │   │       ├── CommitmentCard
│       │   │       │   ├── ClaimText
│       │   │       │   ├── StatusBadge (active/retracted)
│       │   │       │   ├── PromoteButton
│       │   │       │   └── MoveTimestamp
│       │   │       └── TimelineView (optional)
│       │   └── ContradictionIndicator
│       │
│       └── CommitmentAnalyticsDashboard (analytics)
│           ├── MetricsOverview
│           ├── TemporalChart
│           ├── ConsensusDistribution
│           └── AgreementMatrix
│
├── DialogueAwareGraphPanel
│   ├── DialogueControls
│   └── CommitmentStorePanel (optional sidebar)
│
└── Tab: "Ludics"
    └── LudicsPanel
        └── CommitmentsPanel (ludics commitments)
            ├── FactsSection
            │   ├── FactInput
            │   └── FactList
            ├── RulesSection
            │   ├── RuleInput (with syntax validation)
            │   └── RuleList
            ├── InferenceControls
            │   ├── RunInferenceButton
            │   └── ScopeSelector (locus)
            ├── DerivedFactsDisplay
            └── ContradictionWarnings
```

### 7.2 CommitmentStorePanel

**Location**: `components/chains/dialogues/CommitmentStorePanel.tsx`

**Purpose**: Display per-participant commitment tracking in dialogue visualizations

```typescript
interface CommitmentStorePanelProps {
  stores: CommitmentStore[];
  deliberationId?: string;
  onClaimClick?: (claimId: string) => void;
  onRefresh?: () => void;
  showTimeline?: boolean;
  className?: string;
}
```

**Features**:
- Per-participant tabs for easy navigation
- Color-coded claims (active vs retracted)
- Timeline view showing commitment evolution
- Contradiction detection with visual indicators
- "Promote to Ludics" button for bridging systems
- Tooltips with move timestamps

### 7.3 CommitmentAnalyticsDashboard

**Location**: `components/chains/dialogues/CommitmentAnalyticsDashboard.tsx`

**Purpose**: Comprehensive analytics for commitment activity

**Visualizations**:

| Component | Description |
|-----------|-------------|
| **MetricsOverview** | Total participants, commitments, retractions, participation rate |
| **TemporalChart** | Commitment velocity over time |
| **ConsensusDistribution** | Claims with highest agreement across participants |
| **RetractionAnalysis** | Retraction patterns and reasons |
| **AgreementMatrix** | Participant × Participant agreement scores |

### 7.4 CommitmentsPanel (Ludics)

**Location**: `components/ludics/CommitmentsPanel.tsx`

**Purpose**: Manage ludics commitments (facts and rules)

```typescript
interface CommitmentsPanelProps {
  dialogueId: string;
  ownerId: string;
  locusPath?: string;
  onInferenceComplete?: (result: InferenceResult) => void;
  showInheritedCommitments?: boolean;
}
```

**Features**:
- Add facts and rules with syntax validation
- Forward-chaining inference
- Contradiction detection with source tracking
- Entitlement toggling
- Scoped inference at specific loci
- Export to dialogue layer

---

## 8. API Routes Reference

### 8.1 Dialogue Commitment APIs

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/aif/dialogue/[deliberationId]/commitments` | GET | Fetch commitment stores with provenance |
| `/api/aif/dialogue/[deliberationId]/commitments/export` | GET | Export commitments as data |
| `/api/aif/dialogue/[deliberationId]/commitments/diff` | GET | Compare commitment stores |
| `/api/aif/dialogue/[deliberationId]/commitments/analytics` | GET | Fetch analytics |

#### GET `/api/aif/dialogue/[deliberationId]/commitments`

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `participantId` | string | Filter to specific participant |
| `asOf` | ISO timestamp | Time-travel query |
| `limit` | number | Max commitments per participant (default: 100) |
| `offset` | number | Pagination offset |

**Response**:
```typescript
{
  stores: Array<{
    participantId: string;
    participantName: string;
    commitments: CommitmentRecord[];
    totalCommitments: number;
    hasMore: boolean;
  }>;
  meta: {
    deliberationId: string;
    asOf: string;
    totalParticipants: number;
  };
}
```

#### GET `/api/aif/dialogue/[deliberationId]/commitments/analytics`

**Response**:
```typescript
{
  participation: {
    totalParticipants: number;
    activeParticipants: number;
    totalCommitments: number;
    activeCommitments: number;
    totalRetractions: number;
    participationRate: number;
    avgCommitmentsPerParticipant: number;
  };
  consensus: Array<{
    claimText: string;
    participants: string[];
    count: number;
  }>;
  temporal: {
    commitmentsByHour: Array<{ hour: string; count: number }>;
    peakHour: string;
    avgVelocity: number;
  };
  retractions: {
    totalRetractions: number;
    retractionRate: number;
    topRetractedClaims: Array<{ claim: string; count: number }>;
  };
  agreementMatrix: Record<string, Record<string, number>>;
  computedAt: string;
}
```

---

### 8.2 Ludics Commitment APIs

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/commitments/apply` | POST | Apply add/erase operations |
| `/api/commitments/state` | GET | List facts and rules |
| `/api/commitments/infer` | POST | Run forward-chaining inference |
| `/api/commitments/infer-scoped` | POST | Run scoped inference at locus |
| `/api/commitments/entitlement` | POST | Toggle entitlement |
| `/api/commitments/contradictions` | GET | Detect contradictions |
| `/api/commitments/semantic-divergence` | POST | Check semantic divergence |
| `/api/commitments/promote` | POST | Promote to ludics |
| `/api/commitments/export-from-ludics` | POST | Export to dialogue |
| `/api/commitments/elements` | GET | Get commitment elements |
| `/api/commitments/analyze` | POST | Analyze commitments |

#### POST `/api/commitments/apply`

**Request Body**:
```typescript
{
  dialogueId: string;
  ownerId: string;
  ops: {
    add?: Array<{
      label: string;
      basePolarity: 'pos' | 'neg';
      baseLocusPath?: string;
      entitled?: boolean;
      derived?: boolean;
    }>;
    erase?: Array<{
      byLabel?: string;
      byLocusPath?: string;
    }>;
  };
  autoPersistDerived?: boolean;
}
```

**Response**:
```typescript
{
  ok: boolean;
  csId: string;                              // Commitment state ID
  added: string[];                           // IDs of added elements
  erased: string[];                          // IDs of erased elements
  derivedFacts: Array<{ label: string }>;    // Inferred facts
  contradictions: Array<{ a: string; b: string }>;
  persistedDerivedIds: string[];             // IDs of persisted derived
  blocked: boolean;                          // True if contradiction blocks
  code?: 'CS_CONTRADICTION' | 'RULE_VALIDATION_ERROR';
}
```

#### POST `/api/commitments/infer-scoped`

**Request Body**:
```typescript
{
  dialogueId: string;
  ownerId: string;
  locusPath: string;           // e.g., "0.1.2"
  includeInherited: boolean;   // Include ancestor loci
}
```

**Response**:
```typescript
{
  derivedFacts: Array<{ label: string; source: 'local' | 'inherited' }>;
  contradictions: Array<{
    a: string;
    b: string;
    source: 'local' | 'inherited';
    locusPath: string;
  }>;
  inheritedFrom: Array<{
    locusPath: string;
    elements: string[];
  }>;
}
```

#### POST `/api/commitments/promote`

**Request Body**:
```typescript
{
  deliberationId: string;
  participantId: string;
  proposition: string;
  targetOwnerId: string;      // e.g., "Proponent", "Opponent"
  targetLocusPath?: string;   // default: "0"
  basePolarity: 'pos' | 'neg';
}
```

**Response**:
```typescript
{
  ok: boolean;
  mapping: {
    id: string;
    dialogueCommitmentId: string;
    ludicCommitmentElementId: string;
    promotedAt: string;
    promotedBy: string;
  };
  ludicElement: {
    id: string;
    label: string;
    basePolarity: string;
    ownerId: string;
    baseLocusId: string;
  };
}
```

---

## 9. Service Layer

### 9.1 getCommitmentStores()

**Location**: `lib/aif/graph-builder.ts`

**Purpose**: Build commitment stores by deriving from DialogueMove history

**Signature**:
```typescript
async function getCommitmentStores(
  deliberationId: string,
  options?: {
    participantId?: string;
    asOf?: Date;
    limit?: number;
    offset?: number;
  }
): Promise<CommitmentStore[]>
```

**Implementation Details**:
- Uses single optimized SQL query with joins
- Redis caching with 60-second TTL
- Processes moves chronologically
- Includes promotion status from CommitmentLudicMapping

### 9.2 computeCommitmentAnalytics()

**Location**: `lib/aif/commitment-analytics.ts`

**Purpose**: Compute comprehensive commitment analytics

**Metrics Computed**:
1. **Participation**: Active participants, commitment counts, participation rate
2. **Consensus**: Claims with highest agreement across participants
3. **Temporal**: Commitment velocity, peak hours
4. **Retractions**: Retraction rate, commonly retracted claims
5. **Agreement Matrix**: Pairwise participant agreement scores

### 9.3 Ludics Engine Functions

**Location**: `lib/ludics/commitment-engine.ts`

| Function | Purpose |
|----------|---------|
| `applyToCS()` | Apply add/erase operations to commitment state |
| `listFactsAndRules()` | Get facts and rules for owner at locus |
| `interactCE()` | Run forward-chaining inference |
| `interactCEScoped()` | Run scoped inference with locus inheritance |
| `getCommitmentsAtLocusWithInherited()` | Get local + inherited commitments |
| `checkSemanticDivergence()` | Check for contradictions between owners |
| `toggleEntitlement()` | Toggle element entitlement status |

### 9.4 Contradiction Detection

**Location**: `lib/aif/contradiction-detection.ts`

**Purpose**: Detect contradictions in dialogue commitments without ludics formalization

```typescript
function detectContradictions(
  commitments: CommitmentRecord[]
): Contradiction[]
```

**Detection Strategies**:
1. **Explicit Negation**: Pattern matching for "not", "¬", negation words
2. **Infix Negation**: Detect "cannot", "won't", "shouldn't"
3. **Suffix Negation**: "is false", "is untrue"
4. **Semantic Opposition**: Embedding-based similarity detection

---

## 10. Event System

### 10.1 Event Bus Integration

**Event Name**: `dialogue:cs:refresh`

**Payload**:
```typescript
{
  deliberationId: string;
  participantId?: string;
  ownerId?: string;
  source: 'dialogue' | 'ludics' | 'promotion';
}
```

### 10.2 Event Emitters

| Location | Trigger |
|----------|---------|
| `/api/aif/dialogue/[id]/move` | After commitment-relevant move (ASSERT, CONCEDE, RETRACT) |
| `/api/commitments/apply` | After applyToCS() completes |
| `/api/commitments/promote` | After successful promotion |
| `/api/commitments/entitlement` | After entitlement toggle |

### 10.3 Event Listeners

| Component | Action on Event |
|-----------|-----------------|
| `CommitmentStorePanel` | SWR revalidation via DialogueAwareGraphPanel |
| `CommitmentsPanel` | Refresh ludics commitment list |
| `EntailmentWidget` | Re-compute entailment status |
| `ContradictionIndicator` | Re-run contradiction detection |

---

## 11. Data Flow Diagrams

### 11.1 Dialogue Move → Commitment Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DIALOGUE MOVE → COMMITMENT FLOW                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────┐                                                           │
│   │   User UI   │                                                           │
│   │  (ASSERT)   │                                                           │
│   └──────┬──────┘                                                           │
│          │                                                                   │
│          ▼                                                                   │
│   ┌─────────────────────────────────────┐                                   │
│   │  POST /api/aif/dialogue/[id]/move   │                                   │
│   │  { kind: "ASSERT", targetId: ... }  │                                   │
│   └──────┬──────────────────────────────┘                                   │
│          │                                                                   │
│          ├─────────────────────────────────┐                                │
│          ▼                                  ▼                               │
│   ┌─────────────────┐            ┌─────────────────────┐                   │
│   │ Create          │            │ Upsert Commitment   │                   │
│   │ DialogueMove    │            │ (if commitment-     │                   │
│   │ record          │            │  relevant move)     │                   │
│   └──────┬──────────┘            └──────────┬──────────┘                   │
│          │                                   │                              │
│          └───────────────┬───────────────────┘                              │
│                          ▼                                                   │
│                   ┌─────────────────────────┐                               │
│                   │  Emit Event:            │                               │
│                   │  "dialogue:cs:refresh"  │                               │
│                   └──────────┬──────────────┘                               │
│                              ▼                                               │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    CommitmentStorePanel                              │   │
│   │                    (SWR revalidation)                                │   │
│   │   ┌────────────┐  ┌────────────┐  ┌────────────┐                    │   │
│   │   │ Part. A    │  │ Part. B    │  │ Part. C    │                    │   │
│   │   │ • Claim X ✓│  │ • Claim Y ✓│  │ • Claim Z ✓│                    │   │
│   │   └────────────┘  └────────────┘  └────────────┘                    │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 11.2 Ludics Commitment Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      LUDICS COMMITMENT FLOW                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────────┐                                                      │
│   │ CommitmentsPanel │                                                      │
│   │ (Add fact/rule)  │                                                      │
│   └────────┬─────────┘                                                      │
│            │                                                                 │
│            ▼                                                                 │
│   ┌────────────────────────────────────────┐                                │
│   │  POST /api/commitments/apply           │                                │
│   │  {                                     │                                │
│   │    dialogueId, ownerId,                │                                │
│   │    ops: { add: [{ label, polarity }] } │                                │
│   │  }                                     │                                │
│   └────────┬───────────────────────────────┘                                │
│            │                                                                 │
│            ▼                                                                 │
│   ┌────────────────────────────────────────┐                                │
│   │           applyToCS()                  │                                │
│   │                                        │                                │
│   │  1. Get/Create LudicCommitmentState    │                                │
│   │  2. Create LudicCommitmentElement      │                                │
│   │  3. Link to LudicLocus                 │                                │
│   └────────┬───────────────────────────────┘                                │
│            │                                                                 │
│            ▼                                                                 │
│   ┌────────────────────────────────────────┐                                │
│   │           interactCE()                 │                                │
│   │                                        │                                │
│   │  1. Load entitled facts & rules        │                                │
│   │  2. Forward-chain to derive            │                                │
│   │  3. Check for contradictions           │                                │
│   └────────┬───────────────────────────────┘                                │
│            │                                                                 │
│            ▼                                                                 │
│   ┌────────────────────────────────────────────────────────────────────┐    │
│   │  Response:                                                          │    │
│   │  {                                                                  │    │
│   │    ok: true,                                                        │    │
│   │    derivedFacts: [{ label: "payment_due" }],                        │    │
│   │    contradictions: [],                                              │    │
│   │    blocked: false                                                   │    │
│   │  }                                                                  │    │
│   └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 11.3 Commitment Promotion Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    COMMITMENT PROMOTION FLOW                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   DIALOGUE LAYER                              LUDICS LAYER                   │
│                                                                              │
│   ┌─────────────────┐                                                       │
│   │ CommitmentStore │                                                       │
│   │ Panel           │                                                       │
│   │                 │                                                       │
│   │ ┌─────────────┐ │                                                       │
│   │ │ "contract"  │ │                                                       │
│   │ │ [Promote ⬆] │─┼────────┐                                             │
│   │ └─────────────┘ │        │                                             │
│   └─────────────────┘        │                                             │
│                              ▼                                              │
│              ┌────────────────────────────────┐                            │
│              │  POST /api/commitments/promote │                            │
│              │  {                             │                            │
│              │    deliberationId,             │                            │
│              │    participantId,              │                            │
│              │    proposition: "contract",    │                            │
│              │    targetOwnerId: "Proponent", │                            │
│              │    basePolarity: "pos"         │                            │
│              │  }                             │                            │
│              └───────────────┬────────────────┘                            │
│                              │                                              │
│         ┌────────────────────┼────────────────────┐                        │
│         ▼                    ▼                    ▼                        │
│   ┌───────────┐       ┌─────────────┐      ┌──────────────┐               │
│   │ Verify/   │       │ applyToCS() │      │ Create       │               │
│   │ Create    │       │ Create      │      │ Commitment   │               │
│   │ Dialogue  │       │ LudicCommit │      │ LudicMapping │               │
│   │ Commitment│       │ Element     │      │              │               │
│   └───────────┘       └─────────────┘      └──────────────┘               │
│                              │                                              │
│                              ▼                                              │
│                       ┌─────────────────────────────────────┐              │
│                       │  LudicCommitmentElement             │              │
│                       │  ┌─────────────────────────────┐   │              │
│                       │  │ label: "contract"           │   │              │
│                       │  │ polarity: pos               │   │              │
│                       │  │ locus: "0"                  │   │              │
│                       │  │ owner: "Proponent"          │   │              │
│                       │  │ entitled: true              │   │              │
│                       │  └─────────────────────────────┘   │              │
│                       └─────────────────────────────────────┘              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 12. Theoretical Foundations

### 12.1 Commitment Store Semantics (Walton-Krabbe)

The Dialogue Commitment System implements formal dialogue game semantics based on **Douglas Walton and Erik Krabbe's** work on commitment in dialogue:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    WALTON-KRABBE COMMITMENT MODEL                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  CORE PRINCIPLE: A commitment store CS_i(t) represents the set of           │
│  propositions that participant i is publicly committed to at time t.        │
│                                                                              │
│  COMMITMENT OPERATIONS:                                                      │
│  ──────────────────────                                                      │
│                                                                              │
│  1. ASSERTION: CS_i(t+1) = CS_i(t) ∪ {p}                                    │
│     Participant i asserts p, adding it to their commitment store            │
│                                                                              │
│  2. CONCESSION: CS_i(t+1) = CS_i(t) ∪ {p}                                   │
│     Participant i concedes opponent's claim p                                │
│                                                                              │
│  3. RETRACTION: CS_i(t+1) = CS_i(t) \ {p}                                   │
│     Participant i withdraws commitment to p                                  │
│                                                                              │
│  DARK-SIDE COMMITMENTS:                                                      │
│  ──────────────────────                                                      │
│  Implicit commitments from argument structure:                               │
│  - If i asserts A as argument for B, then i is committed to A→B             │
│  - If i uses modus ponens with A and A→B, i is committed to B               │
│                                                                              │
│  CONSISTENCY REQUIREMENTS:                                                   │
│  ─────────────────────────                                                   │
│  - No participant should have {p, ¬p} ⊆ CS_i(t)                             │
│  - Contradictions may be challenged by opponent                              │
│  - Resolution requires retraction of one commitment                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Key References**:
- Walton, D. & Krabbe, E. (1995). *Commitment in Dialogue*
- Prakken, H. (2006). "Formal systems for persuasion dialogue"
- Hamblin, C. L. (1970). *Fallacies*

### 12.2 Ludics Commitment Model (Girard)

The Ludics Commitment System is based on **Jean-Yves Girard's Ludics** — a proof-theoretic approach to dialogue:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       GIRARD'S LUDICS MODEL                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  LOCUS SEMANTICS:                                                            │
│  ────────────────                                                            │
│  A locus ξ represents a position in the interaction tree.                    │
│  Loci form a tree structure with paths like "0", "0.1", "0.1.2".            │
│                                                                              │
│  POLARITY:                                                                   │
│  ─────────                                                                   │
│  • POSITIVE (⊕): Facts, assertions, data                                    │
│    - Represents what is known/claimed                                        │
│    - Can be used as premises in inference                                    │
│                                                                              │
│  • NEGATIVE (⊖): Rules, implications, co-data                               │
│    - Represents conditional knowledge                                        │
│    - Form: A₁ & A₂ & ... → C                                                │
│    - Applied to derive new facts                                             │
│                                                                              │
│  DESIGNS:                                                                    │
│  ────────                                                                    │
│  A design is a proof structure showing how commitments are derived.          │
│  Designs track the provenance of derived facts.                              │
│                                                                              │
│  INTERACTION:                                                                │
│  ────────────                                                                │
│  When positive meets negative at a locus:                                    │
│    - If antecedents of rule are satisfied → derive consequent               │
│    - If contradiction detected → interaction fails (fax)                     │
│                                                                              │
│  INHERITANCE:                                                                │
│  ────────────                                                                │
│  Commitments at a locus inherit from ancestor loci.                          │
│  ξ.α inherits from ξ, which inherits from root.                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Key References**:
- Girard, J.-Y. (2001). "Locus Solum: From the rules of logic to the logic of rules"
- Girard, J.-Y. (2011). *The Blind Spot: Lectures on Logic*

### 12.3 Forward-Chaining Inference

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FORWARD-CHAINING ALGORITHM                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  INPUT:                                                                      │
│    Facts = { f₁, f₂, ..., fₙ }     (positive commitments)                   │
│    Rules = { r₁, r₂, ..., rₘ }     (negative commitments, form: A → C)      │
│                                                                              │
│  ALGORITHM:                                                                  │
│    derived = ∅                                                               │
│    changed = true                                                            │
│                                                                              │
│    WHILE changed:                                                            │
│      changed = false                                                         │
│      FOR each rule r ∈ Rules:                                               │
│        antecedents = parse_antecedents(r)                                   │
│        consequent = parse_consequent(r)                                     │
│                                                                              │
│        IF antecedents ⊆ (Facts ∪ derived):                                  │
│          IF consequent ∉ (Facts ∪ derived):                                 │
│            derived = derived ∪ { consequent }                               │
│            changed = true                                                   │
│                                                                              │
│  OUTPUT:                                                                     │
│    derivedFacts = derived                                                   │
│                                                                              │
│  EXAMPLE:                                                                    │
│    Facts = { contract, delivered }                                          │
│    Rules = { "contract & delivered -> payment_due" }                        │
│                                                                              │
│    Iteration 1:                                                              │
│      - Rule matches: contract ∈ Facts, delivered ∈ Facts                    │
│      - Derive: payment_due                                                   │
│      - derived = { payment_due }                                            │
│                                                                              │
│    Iteration 2:                                                              │
│      - No new matches                                                        │
│      - Fixed point reached                                                   │
│                                                                              │
│    Result: derivedFacts = [ { label: "payment_due" } ]                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 12.4 Contradiction Detection

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CONTRADICTION DETECTION                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  DEFINITION:                                                                 │
│  A contradiction exists when both X and ¬X are in the commitment set.       │
│                                                                              │
│  DETECTION ALGORITHM:                                                        │
│                                                                              │
│    contradictions = []                                                       │
│                                                                              │
│    FOR each fact f₁ ∈ AllFacts:                                             │
│      FOR each fact f₂ ∈ AllFacts where f₂ ≠ f₁:                            │
│                                                                              │
│        // Explicit negation check                                            │
│        IF f₂ = "not " + f₁ OR f₂ = "¬" + f₁:                               │
│          contradictions.push({ a: f₁, b: f₂, type: 'explicit' })           │
│                                                                              │
│        // Semantic opposition check (embedding similarity)                   │
│        IF semantic_opposition(f₁, f₂) > THRESHOLD:                          │
│          contradictions.push({ a: f₁, b: f₂, type: 'semantic' })           │
│                                                                              │
│    RETURN contradictions                                                     │
│                                                                              │
│  BLOCKING BEHAVIOR:                                                          │
│  If contradictions.length > 0, inference is marked as 'blocked'.            │
│  User must resolve contradiction before further inference.                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 13. Type Definitions

### 13.1 Core Types

**Location**: `types/dialogue.ts`, `types/commitments.ts`

```typescript
// Move kinds that affect commitment stores
export type CommitmentMoveKind = 
  | "ASSERT" 
  | "CONCEDE" 
  | "RETRACT" 
  | "THEREFORE";

// All dialogue move kinds
export type MoveKind =
  | CommitmentMoveKind
  | "WHY"
  | "GROUNDS"
  | "CLOSE"
  | "SUPPOSE"
  | "DISCHARGE"
  | "ACCEPT_ARGUMENT";

// Move force (attack/surrender semantics)
export type MoveForce = "ATTACK" | "SURRENDER" | "NEUTRAL";

// Commitment record in dialogue store
export interface CommitmentRecord {
  claimId: string;
  claimText: string;
  moveId: string;
  moveKind: CommitmentMoveKind;
  timestamp: Date | string;
  isActive: boolean;
  isPromoted?: boolean;
  promotedAt?: Date | string;
  ludicOwnerId?: string;
  ludicPolarity?: string;
}

// Commitment store for a participant
export interface CommitmentStore {
  participantId: string;
  participantName: string;
  commitments: CommitmentRecord[];
  totalCommitments: number;
  hasMore: boolean;
}
```

### 13.2 Analytics Types

```typescript
export interface CommitmentAnalytics {
  participation: ParticipationMetrics;
  consensus: ClaimConsensus[];
  temporal: TemporalMetrics;
  retractions: RetractionAnalysis;
  agreementMatrix: ParticipantAgreementMatrix;
  topClaims: ClaimConsensus[];
  computedAt: string;
}

export interface ParticipationMetrics {
  totalParticipants: number;
  activeParticipants: number;
  totalCommitments: number;
  activeCommitments: number;
  totalRetractions: number;
  participationRate: number;
  avgCommitmentsPerParticipant: number;
  medianCommitmentsPerParticipant: number;
}

export interface ClaimConsensus {
  claimText: string;
  claimId: string;
  participants: string[];
  count: number;
  agreementPercentage: number;
}

export interface RetractionAnalysis {
  totalRetractions: number;
  retractionRate: number;
  topRetractedClaims: Array<{
    claimText: string;
    count: number;
  }>;
  averageTimeToRetraction: number;
}

export type ParticipantAgreementMatrix = Record<string, Record<string, number>>;
```

### 13.3 Ludics Types

```typescript
// Polarity for ludics commitments
export type LudicPolarity = 'pos' | 'neg';

// Ludics commitment element
export interface LudicCommitmentElement {
  id: string;
  ownerId: string;
  label: string;
  basePolarity: LudicPolarity;
  baseLocusId: string;
  baseLocusPath: string;
  entitled: boolean;
  derived?: boolean;
  extJson?: Record<string, unknown>;
}

// Ludics commitment state (aggregate)
export interface LudicCommitmentState {
  id: string;
  ownerId: string;
  elements: LudicCommitmentElement[];
  updatedAt: Date;
}

// Inference result
export interface InferenceResult {
  derivedFacts: Array<{ label: string; source?: string }>;
  contradictions: Array<{ a: string; b: string }>;
  blocked: boolean;
  code?: 'CS_CONTRADICTION' | 'RULE_VALIDATION_ERROR';
}

// Scoped inference result
export interface ScopedInferenceResult extends InferenceResult {
  inheritedFrom: Array<{
    locusPath: string;
    elements: string[];
  }>;
  contradictionSources: Array<{
    contradiction: { a: string; b: string };
    source: 'local' | 'inherited';
    locusPath: string;
  }>;
}
```

### 13.4 Bridge Types

```typescript
// Promotion request
export interface PromoteCommitmentRequest {
  deliberationId: string;
  participantId: string;
  proposition: string;
  targetOwnerId: string;
  targetLocusPath?: string;
  basePolarity: LudicPolarity;
}

// Commitment with promotion status
export interface CommitmentWithPromotionStatus {
  claimId: string;
  claimText: string;
  moveId: string;
  moveKind: string;
  timestamp: Date;
  isActive: boolean;
  isPromoted: boolean;
  promotedAt?: Date;
  ludicOwnerId?: string;
  ludicPolarity?: string;
  ludicElementId?: string;
}

// Commitment-Ludic mapping
export interface CommitmentLudicMappingRecord {
  id: string;
  dialogueCommitmentId: string;
  deliberationId: string;
  participantId: string;
  proposition: string;
  ludicCommitmentElementId: string;
  ludicOwnerId: string;
  ludicLocusId: string;
  promotedAt: Date;
  promotedBy: string;
  promotionContext?: Record<string, unknown>;
}
```

---

## 14. File Location Summary

### 14.1 Database

| File | Purpose |
|------|---------|
| `lib/models/schema.prisma` | All database models |

### 14.2 Components

| File | Purpose |
|------|---------|
| `components/chains/dialogues/CommitmentStorePanel.tsx` | Dialogue commitment UI |
| `components/chains/dialogues/CommitmentAnalyticsDashboard.tsx` | Analytics dashboard |
| `components/ludics/CommitmentsPanel.tsx` | Ludics commitment management |
| `components/chains/dialogues/ContradictionIndicator.tsx` | Contradiction display |

### 14.3 API Routes

| Route | Purpose |
|-------|---------|
| `app/api/aif/dialogue/[deliberationId]/commitments/route.ts` | Fetch commitment stores |
| `app/api/aif/dialogue/[deliberationId]/commitments/analytics/route.ts` | Commitment analytics |
| `app/api/aif/dialogue/[deliberationId]/commitments/diff/route.ts` | Compare stores |
| `app/api/commitments/apply/route.ts` | Apply ludics operations |
| `app/api/commitments/infer/route.ts` | Forward-chaining inference |
| `app/api/commitments/infer-scoped/route.ts` | Scoped inference |
| `app/api/commitments/promote/route.ts` | Promote to ludics |
| `app/api/commitments/entitlement/route.ts` | Toggle entitlement |
| `app/api/commitments/semantic-divergence/route.ts` | Divergence check |

### 14.4 Services

| File | Purpose |
|------|---------|
| `lib/aif/graph-builder.ts` | `getCommitmentStores()` |
| `lib/aif/commitment-analytics.ts` | `computeCommitmentAnalytics()` |
| `lib/aif/contradiction-detection.ts` | `detectContradictions()` |
| `lib/ludics/commitment-engine.ts` | Ludics engine functions |

### 14.5 Types

| File | Purpose |
|------|---------|
| `types/dialogue.ts` | MoveKind, dialogue types |
| `types/commitments.ts` | Commitment and bridge types |
| `types/ludics.ts` | Ludics-specific types |

---

## Summary

The Commitment System is a **dual-layer architecture** designed to support both informal dialogue tracking and formal proof-theoretic reasoning:

1. **Dialogue Layer**: Simple, fast commitment stores derived from DialogueMove history. Suitable for UI display and basic contradiction detection.

2. **Ludics Layer**: Rich, structured commitments with polarity, locus scoping, and entitlement tracking. Supports forward-chaining inference and formal reasoning.

3. **Bridge Mechanism**: CommitmentLudicMapping enables promotion from dialogue to ludics when deeper analysis is needed.

The system implements well-established theoretical foundations from dialogue game theory (Walton-Krabbe) and proof theory (Girard's Ludics), making it suitable for rigorous argumentation analysis.

---

*Document generated for Mesh Platform Architecture Documentation*

