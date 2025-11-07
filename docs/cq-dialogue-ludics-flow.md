# Critical Questions to ASPIC+ Integration Flow

**Last Updated**: November 6, 2025  
**Status**: Production Ready ✅  
**Phases Complete**: 0-8 (Full CQ Dialogical Ludics Integration)

---

## Table of Contents

1. [Overview](#overview)
2. [User-Facing Guide: How Critical Questions Work](#user-facing-guide)
3. [Developer Guide: CQ Integration Architecture](#developer-guide)
4. [Data Flow Diagram](#data-flow-diagram)
5. [Component Reference](#component-reference)
6. [API Reference](#api-reference)
7. [Testing & Validation](#testing--validation)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The Critical Questions (CQ) system enables structured argumentation by allowing users to challenge arguments through scheme-specific questions. When a user asks a CQ, the system creates a chain of interconnected data structures that preserve semantic meaning from dialogue through to formal logic evaluation.

### Key Concepts

- **Critical Questions (CQs)**: Scheme-specific questions that challenge arguments
- **Dialogue Moves**: User actions (WHY, GROUNDS) that create structured dialogue
- **LudicActs**: Formal ludics representations of dialogue moves
- **AIF Nodes**: Argument Interchange Format nodes for graph structure
- **ASPIC+ Theory**: Abstract argumentation framework for semantic evaluation

### Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: User Interface (CQ Forms & Displays)              │
│  ├─ CriticalQuestionsV3.tsx                                 │
│  ├─ SchemeSpecificCQsModal.tsx                              │
│  └─ ArgumentCardV2.tsx (Attack displays)                    │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 2: Dialogue System (Moves & State)                   │
│  ├─ DialogueMove (Prisma model)                             │
│  ├─ /api/deliberations/[id]/moves (REST endpoint)           │
│  └─ CQStatus (tracking satisfaction state)                  │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 3: Ludics Engine (Formal Dialogue Structures)        │
│  ├─ LudicAct (Prisma model with metaJson.aspic)             │
│  ├─ LudicDesign (interaction designs)                       │
│  ├─ compileFromMoves (synthesizes acts from moves)          │
│  └─ stepInteraction (evaluates convergence/divergence)      │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 4: AIF Graph (Argument Structure)                    │
│  ├─ AifNode (I-nodes, S-nodes, CA-nodes)                    │
│  ├─ syncToAif (creates nodes from LudicActs)                │
│  └─ CA-nodes (Conflict Application nodes with metadata)     │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 5: ASPIC+ Semantics (Formal Evaluation)              │
│  ├─ aifToAspic (translates AIF → ASPIC+ theory)             │
│  ├─ Attack classification (undermining/rebutting/undercutting)│
│  └─ Evaluation (assumptions vs contraries)                  │
└─────────────────────────────────────────────────────────────┘
```

---

## User-Facing Guide

### How Critical Questions Work

#### 1. Viewing Critical Questions

When you view an argument that uses an argumentation scheme, you'll see a **"Critical Questions"** button. Click it to see scheme-specific questions designed to challenge the argument.

**Example**: Argument from Expert Opinion
- **Premise**: Dr. Smith says climate change is real
- **Conclusion**: Climate change is real
- **Critical Questions**:
  - ❓ How credible is Dr. Smith as an expert?
  - ❓ Is Dr. Smith's expertise relevant to climate science?
  - ❓ Do other experts agree with Dr. Smith?

#### 2. Asking WHY (Challenging a CQ)

Click **"Ask WHY"** to challenge that a CQ needs to be answered:

```
User Action: Click "Ask WHY" on "How credible is Dr. Smith?"

System Creates:
├─ DialogueMove (WHY)
├─ LudicAct (Opponent polarity, ASPIC+ metadata)
├─ CA-node (Conflict Application: UNDERMINES premise)
└─ Badge: "1 WHY" appears on CQ card
```

**What This Means**:
- You're signaling that this question is important and should be addressed
- The argument author is notified
- The CQ status changes to "Challenged"

#### 3. Providing GROUNDS (Answering a CQ)

Click **"Provide GROUNDS"** to answer a CQ with evidence:

```
User Action: 
- Enter text: "Dr. Smith has 20+ years of climate research"
- Click "Submit GROUNDS"

System Creates:
├─ DialogueMove (GROUNDS, with text payload)
├─ LudicAct (Proponent polarity, ASPIC+ metadata)
├─ I-node (Inference node with grounds text)
└─ Badge: "1 GROUNDS" appears on CQ card
```

**What This Means**:
- You've provided evidence/reasoning that addresses the question
- The grounds are visible to all participants
- The CQ status may change to "Satisfied" or "Partially Satisfied"

#### 4. Viewing Dialogue Activity

**CQ Cards Show Real-Time Activity**:
```
┌────────────────────────────────────────────┐
│ ❓ How credible is Dr. Smith?             │
│                                            │
│ 💬 [5 WHY] [3 GROUNDS]                    │
│    ↑         ↑                             │
│    5 people  3 responses                   │
│    challenged provided                     │
└────────────────────────────────────────────┘
```

**Attack Display Shows ASPIC+ Types**:
```
┌────────────────────────────────────────────┐
│ 🛡️ Undermine  ⚔️ UNDERMINES               │
│ Challenges: "Dr. Smith is an expert"      │
│                                            │
│ 💬 2 WHY, 1 GROUNDS    [🟢 Answered]      │
└────────────────────────────────────────────┘
```

#### 5. Understanding Attack Types (ASPIC+)

When a CQ creates an attack, it's classified by how it challenges the argument:

| Attack Type | Symbol | What It Challenges | Example |
|-------------|--------|-------------------|---------|
| **UNDERMINES** | 🔴 Gray | A premise is unacceptable | "Dr. Smith isn't actually an expert" |
| **UNDERCUTS** | 🟠 Amber | The reasoning is flawed | "Expertise doesn't imply correctness" |
| **REBUTS** | 🔴 Red | The conclusion is wrong | "Climate change isn't real despite experts" |

---

## Developer Guide

### CQ Integration Architecture

#### Phase Overview

The CQ system was implemented in 8 phases:

- **Phase 0**: Foundation (DialogueMove, basic CQ tracking)
- **Phase 1a-1f**: ASPIC+ implementation & metadata preservation
- **Phase 2**: Ludics dialogue engine integration
- **Phase 3**: Community responses & multi-layer CQ system
- **Phase 4**: CriticalQuestionsV3 UI integration
- **Phase 5**: SchemeSpecificCQsModal UI integration
- **Phase 6**: AttackMenuProV2 deprecation (soft deprecation)
- **Phase 7**: ASPIC+ translation enhancement (attack type classification)
- **Phase 8**: Visualization & UX polish (badges, tooltips, indicators)

#### Core Data Models

##### 1. CQStatus (Prisma Model)

Tracks the satisfaction state of a CQ for a specific argument or claim.

```typescript
model CQStatus {
  id         String     @id @default(cuid())
  targetType TargetType // "claim" | "argument"
  targetId   String
  schemeKey  String     // e.g., "argument-from-expert-opinion"
  cqKey      String     // e.g., "CQ_EXPERTISE"
  satisfied  Boolean    @default(false)
  
  // Multi-layer system (Phase 3)
  statusEnum       CQStatusEnum @default(OPEN)
  canonicalResponse CQResponse?
  responses        CQResponse[] @relation("AllResponses")
  
  // Metadata
  groundsText String? // DEPRECATED: use responses
  createdById String
  roomId      String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([targetType, targetId, schemeKey, cqKey])
}

enum CQStatusEnum {
  OPEN                  // No responses yet
  PENDING_REVIEW        // Has responses, awaiting moderation
  PARTIALLY_SATISFIED   // Some responses approved
  SATISFIED             // Canonical response chosen
  DISPUTED              // Conflicting responses
}
```

##### 2. DialogueMove (Prisma Model)

Represents a user action in structured dialogue.

```typescript
model DialogueMove {
  id             String   @id @default(cuid())
  deliberationId String
  kind           DialogueMoveKind // "WHY" | "GROUNDS" | "CLOSE" | ...
  
  // Target (what this move is about)
  targetType TargetType // "claim" | "argument"
  targetId   String
  
  // Payload (CQ metadata)
  payload Json? // { cqKey, cqText, attackType, targetScope }
  
  // Provenance
  participantId String
  createdAt     DateTime @default(now())
  
  @@index([deliberationId, kind])
  @@index([targetType, targetId])
}

enum DialogueMoveKind {
  WHY     // Challenge move
  GROUNDS // Response move
  CLOSE   // End dialogue
  RETRACT // Withdraw argument
  CONCEDE // Accept defeat
}
```

##### 3. LudicAct (Prisma Model)

Formal ludics representation of a dialogue move.

```typescript
model LudicAct {
  id       String      @id @default(cuid())
  designId String
  design   LudicDesign @relation(fields: [designId], references: [id])

  kind     LudicActKind       // ACTION, DAIMON, etc.
  polarity LudicPolarity?     // POSITIVE (+), NEGATIVE (-)
  locusId  String?
  locus    LudicLocus? @relation(fields: [locusId], references: [id])

  ramification String[]
  expression   String?
  
  // Phase 1e: ASPIC+ metadata preservation
  metaJson Json? // { aspic: { cqKey, cqText, attackType, targetScope } }
  
  isAdditive    Boolean @default(false)
  orderInDesign Int
  extJson       Json?
  
  // Back-relation to AIF
  aifNode AifNode?

  @@index([designId, orderInDesign])
  @@index([locusId])
}
```

**metaJson.aspic Structure**:
```json
{
  "aspic": {
    "cqKey": "CQ_EXPERTISE",
    "cqText": "How credible is E as an expert?",
    "attackType": "UNDERMINES",
    "targetScope": "premise",
    "attackerSymbol": "a1",
    "attackedSymbol": "p1"
  }
}
```

##### 4. AifNode (Prisma Model)

Argument Interchange Format node for graph structure.

```typescript
model AifNode {
  id             String   @id @default(cuid())
  deliberationId String
  nodeType       String   // "I", "S", "CA", "RA"
  text           String?
  
  // Metadata
  metadata Json? // Contains aspicAttackType for CA-nodes
  
  // Relations
  ludicActId String? @unique
  ludicAct   LudicAct?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([deliberationId, nodeType])
}
```

**CA-node metadata Structure**:
```json
{
  "aspicAttackType": "undermining",
  "ludicActId": "clxxx",
  "cqKey": "CQ_EXPERTISE",
  "attackType": "UNDERMINES",
  "targetScope": "premise"
}
```

#### Data Flow: CQ to ASPIC+

##### Step 1: User Asks WHY

**UI Component**: `CriticalQuestionsV3.tsx` or `SchemeSpecificCQsModal.tsx`

```typescript
// User clicks "Ask WHY" button
const handleAskCQ = async (cqKey: string, cqText: string) => {
  // 1. Create DialogueMove
  const moveRes = await fetch(`/api/deliberations/${deliberationId}/moves`, {
    method: "POST",
    body: JSON.stringify({
      kind: "WHY",
      targetType: "argument",
      targetId: argumentId,
      payload: {
        cqKey,
        cqText,
        attackType: "UNDERMINES",  // Determined by CQ scheme
        targetScope: "premise"      // Determined by CQ scheme
      }
    })
  });
  
  // 2. System compiles moves → LudicActs
  // 3. System syncs LudicActs → AIF nodes
  // 4. UI refreshes with new badges
};
```

##### Step 2: DialogueMove Compiled to LudicAct

**Backend**: `/api/deliberations/[id]/moves` POST handler

```typescript
// After creating DialogueMove, compile to LudicActs
import { compileFromMoves } from "@/lib/ludics/compileFromMoves";

// Fetch all moves for this deliberation
const moves = await prisma.dialogueMove.findMany({
  where: { deliberationId }
});

// Compile to Ludics designs
const { posDesign, negDesign } = await compileFromMoves(
  moves,
  deliberationId
);

// LudicActs created with ASPIC+ metadata preserved
// metaJson.aspic = { cqKey, cqText, attackType, targetScope }
```

**Key Function**: `synthesizeActs` (in `compileFromMoves`)

```typescript
function synthesizeActs(move: DialogueMove): LudicAct[] {
  const payload = move.payload as any;
  
  if (move.kind === "WHY") {
    // WHY → Opponent polarity (-)
    return [{
      polarity: "NEGATIVE",
      kind: "ACTION",
      metaJson: {
        aspic: {
          cqKey: payload.cqKey,
          cqText: payload.cqText,
          attackType: payload.attackType,
          targetScope: payload.targetScope
        }
      }
    }];
  }
  
  if (move.kind === "GROUNDS") {
    // GROUNDS → Proponent polarity (+)
    return [{
      polarity: "POSITIVE",
      kind: "ACTION",
      metaJson: {
        aspic: {
          cqKey: payload.cqKey,
          cqText: payload.cqText,
          groundsText: payload.groundsText
        }
      }
    }];
  }
}
```

##### Step 3: LudicAct Synced to AIF

**Backend**: `syncToAif` (triggered automatically)

```typescript
// lib/ludics/syncToAif.ts
export async function syncToAif(
  ludicAct: LudicAct,
  deliberationId: string
) {
  // 1. Create standard I-node for the act
  const iNode = await prisma.aifNode.create({
    data: {
      deliberationId,
      nodeType: "I",
      text: ludicAct.expression,
      ludicActId: ludicAct.id,
      metadata: {}
    }
  });
  
  // 2. Check for ASPIC+ metadata
  const aspicMeta = (ludicAct.metaJson as any)?.aspic;
  
  if (aspicMeta && aspicMeta.attackType) {
    // 3. Create CA-node (Conflict Application)
    const caNode = await prisma.aifNode.create({
      data: {
        deliberationId,
        nodeType: "CA",
        metadata: {
          aspicAttackType: classifyAttackType(aspicMeta.attackType),
          ludicActId: ludicAct.id,
          cqKey: aspicMeta.cqKey,
          attackType: aspicMeta.attackType,
          targetScope: aspicMeta.targetScope
        }
      }
    });
  }
  
  return iNode;
}

function classifyAttackType(type: string): string {
  // Maps dialogue attack types to ASPIC+ formal types
  if (type === "UNDERCUTS") return "undercutting";
  if (type === "REBUTS") return "rebutting";
  if (type === "UNDERMINES") return "undermining";
  return "rebutting"; // default
}
```

##### Step 4: AIF Translated to ASPIC+

**Backend**: `aifToAspic` (called during deliberation evaluation)

```typescript
// lib/aif/translation/aifToAspic.ts
export function aifToAspic(aifGraph: AifNode[]): AspicTheory {
  const rules: Rule[] = [];
  const assumptions = new Set<string>();
  const contraries = new Map<string, Set<string>>();
  
  // Process CA-nodes (Conflict Applications)
  for (const ca of aifGraph.filter(n => n.nodeType === "CA")) {
    const aspicAttackType = ca.metadata?.aspicAttackType;
    
    if (aspicAttackType === "undercutting") {
      // UNDERCUTS → assumptions (blocks inference)
      assumptions.add(attackerSymbol);
    } else {
      // REBUTS/UNDERMINES → contraries (conflicts)
      contraries.get(attackerSymbol)!.add(attackedSymbol);
    }
  }
  
  return {
    knowledge: rules.filter(r => r.type === "strict"),
    rules: rules.filter(r => r.type === "defeasible"),
    assumptions: Array.from(assumptions),
    contraries: Object.fromEntries(contraries)
  };
}
```

##### Step 5: ASPIC+ Evaluation

**Backend**: ASPIC+ semantics engine (future work)

```typescript
// Future: Evaluate argument strength using ASPIC+ theory
function evaluateAspicTheory(theory: AspicTheory): {
  acceptableArguments: string[];
  rejectedArguments: string[];
  conflicts: Conflict[];
} {
  // Implement grounded semantics
  // Return which arguments are rationally acceptable
}
```

---

## Data Flow Diagram

### Complete Flow: CQ → ASPIC+

```
┌──────────────────────────────────────────────────────────────────┐
│  USER INTERACTION                                                │
└──────────────────────────────────────────────────────────────────┘
                           │
     User clicks "Ask WHY" on CQ: "How credible is E?"
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│  1. DialogueMove Creation                                        │
│  POST /api/deliberations/[id]/moves                              │
│                                                                  │
│  {                                                               │
│    kind: "WHY",                                                  │
│    targetType: "argument",                                       │
│    targetId: "arg123",                                           │
│    payload: {                                                    │
│      cqKey: "CQ_EXPERTISE",                                      │
│      cqText: "How credible is E?",                               │
│      attackType: "UNDERMINES",                                   │
│      targetScope: "premise"                                      │
│    }                                                             │
│  }                                                               │
└──────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│  2. Ludics Compilation                                           │
│  compileFromMoves(moves) → LudicDesigns                          │
│                                                                  │
│  LudicAct {                                                      │
│    id: "act456",                                                 │
│    polarity: "NEGATIVE",  // WHY = Opponent                      │
│    kind: "ACTION",                                               │
│    metaJson: {                                                   │
│      aspic: {                                                    │
│        cqKey: "CQ_EXPERTISE",                                    │
│        cqText: "How credible is E?",                             │
│        attackType: "UNDERMINES",                                 │
│        targetScope: "premise"                                    │
│      }                                                           │
│    }                                                             │
│  }                                                               │
└──────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│  3. AIF Sync                                                     │
│  syncToAif(ludicAct) → AifNodes                                  │
│                                                                  │
│  I-Node {                                                        │
│    id: "inode789",                                               │
│    nodeType: "I",                                                │
│    text: "Challenges expert credibility",                        │
│    ludicActId: "act456"                                          │
│  }                                                               │
│                                                                  │
│  CA-Node {                                                       │
│    id: "ca012",                                                  │
│    nodeType: "CA",                                               │
│    metadata: {                                                   │
│      aspicAttackType: "undermining",                             │
│      ludicActId: "act456",                                       │
│      cqKey: "CQ_EXPERTISE"                                       │
│    }                                                             │
│  }                                                               │
└──────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│  4. ASPIC+ Translation                                           │
│  aifToAspic(aifNodes) → AspicTheory                              │
│                                                                  │
│  {                                                               │
│    knowledge: [],        // Strict rules                         │
│    rules: [              // Defeasible rules                     │
│      { id: "r1", body: ["p1"], head: "c1" }                     │
│    ],                                                            │
│    assumptions: ["a1"],  // UNDERCUTS → assumption               │
│    contraries: {         // REBUTS/UNDERMINES → contrary         │
│      "a1": ["p1"]        // a1 conflicts with p1                │
│    }                                                             │
│  }                                                               │
└──────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│  5. UI Update                                                    │
│                                                                  │
│  CQ Card:                                                        │
│  ┌──────────────────────────────────────┐                       │
│  │ ❓ How credible is E?               │                       │
│  │ 💬 [1 WHY]                          │                       │
│  └──────────────────────────────────────┘                       │
│                                                                  │
│  Attack Display:                                                 │
│  ┌──────────────────────────────────────┐                       │
│  │ 🛡️ Undermine  ⚔️ UNDERMINES         │                       │
│  │ [🟡 Challenged]                     │                       │
│  └──────────────────────────────────────┘                       │
│                                                                  │
│  LudicAct Inspector:                                             │
│  ┌──────────────────────────────────────┐                       │
│  │ ❓ Triggered by Critical Question    │                       │
│  │ "How credible is E?"                 │                       │
│  │ [UNDERMINES] → premise               │                       │
│  └──────────────────────────────────────┘                       │
└──────────────────────────────────────────────────────────────────┘
```

---

## Component Reference

### UI Components

#### CriticalQuestionsV3

**File**: `/components/claims/CriticalQuestionsV3.tsx`

**Purpose**: Main CQ interface for claims

**Features**:
- Displays scheme-specific CQs
- "Ask WHY" button for challenging
- "Provide GROUNDS" form for answering
- Real-time WHY/GROUNDS count badges
- CQ satisfaction status indicators

**Props**:
```typescript
interface CriticalQuestionsV3Props {
  targetType: "claim" | "argument";
  targetId: string;
  deliberationId?: string;
  authorId?: string;
  roomId?: string;
}
```

#### SchemeSpecificCQsModal

**File**: `/components/arguments/SchemeSpecificCQsModal.tsx`

**Purpose**: CQ interface for arguments (modal)

**Features**:
- Scheme-specific CQ display
- Attack type badges
- Target scope indicators
- Provenance tracking (inherited CQs)
- WHY/GROUNDS count badges

**Props**:
```typescript
interface SchemeSpecificCQsModalProps {
  argumentId: string;
  deliberationId: string;
  authorId: string;
  cqs: CQItem[];
  meta?: AifMeta;
  onRefresh: () => void;
  triggerButton?: React.ReactNode;
}
```

#### ArgumentCardV2

**File**: `/components/arguments/ArgumentCardV2.tsx`

**Purpose**: Displays arguments with attack information

**Features**:
- Attack list with ASPIC+ type badges
- WHY/GROUNDS dialogue activity
- Dialogue state indicators (Answered/Challenged)
- Expandable attack section

#### ActInspector

**File**: `/packages/ludics-react/ActInspector.tsx`

**Purpose**: Displays LudicAct details

**Features**:
- Polarity, kind, locus display
- **CQ context tooltip** (Phase 8, Task 2)
- Shows triggering CQ with attack type
- ASPIC+ metadata visualization

---

## API Reference

### CQ Status API

**Endpoint**: `GET /api/cqs`

**Query Parameters**:
- `targetType`: "claim" | "argument"
- `targetId`: string
- `scheme`: string (optional, filter by scheme)

**Response**:
```json
{
  "targetType": "argument",
  "targetId": "arg123",
  "schemes": [
    {
      "key": "argument-from-expert-opinion",
      "title": "Argument from Expert Opinion",
      "cqs": [
        {
          "id": "status456",
          "key": "CQ_EXPERTISE",
          "text": "How credible is E as an expert?",
          "satisfied": false,
          "whyCount": 5,
          "groundsCount": 3,
          "groundsText": null,
          "suggestion": {
            "type": "undercut",
            "scope": "premise"
          }
        }
      ]
    }
  ]
}
```

**Phase 8 Enhancement**: Added `whyCount` and `groundsCount` fields

### Dialogue Moves API

**Endpoint**: `POST /api/deliberations/[id]/moves`

**Request Body**:
```json
{
  "kind": "WHY",
  "targetType": "argument",
  "targetId": "arg123",
  "payload": {
    "cqKey": "CQ_EXPERTISE",
    "cqText": "How credible is E?",
    "attackType": "UNDERMINES",
    "targetScope": "premise"
  }
}
```

**Response**:
```json
{
  "move": {
    "id": "move789",
    "kind": "WHY",
    "createdAt": "2025-11-06T12:00:00Z"
  },
  "ludicAct": {
    "id": "act456",
    "polarity": "NEGATIVE"
  },
  "aifNode": {
    "id": "inode789",
    "nodeType": "I"
  }
}
```

### CA Nodes API

**Endpoint**: `GET /api/ca`

**Query Parameters**:
- `targetArgumentId`: string
- `deliberationId`: string (optional)

**Response**:
```json
{
  "items": [
    {
      "id": "ca012",
      "conflictingArgumentId": "arg456",
      "conflictedArgumentId": "arg123",
      "legacyAttackType": "UNDERMINES",
      "legacyTargetScope": "premise",
      "aspicAttackType": "undermining",
      "metadata": {
        "cqKey": "CQ_EXPERTISE",
        "ludicActId": "act456"
      }
    }
  ]
}
```

**Phase 8 Enhancement**: ArgumentCardV2 uses `aspicAttackType` for badges

---

## Testing & Validation

### Manual Testing Checklist

#### Phase 8: Visualization Features

**Task 1: WHY/GROUNDS Count Badges**
- [ ] Open argument with CQs
- [ ] Click "Ask WHY" on a CQ
- [ ] Verify "1 WHY" badge appears
- [ ] Click "Provide GROUNDS"
- [ ] Verify "1 GROUNDS" badge appears
- [ ] Check counts update in real-time

**Task 2: CQ Context Tooltips**
- [ ] Open LudicsPanel
- [ ] Click on a LudicAct created from CQ
- [ ] Verify ActInspector shows CQ context
- [ ] Check purple-themed "Triggered by CQ" section
- [ ] Verify CQ text, key, attack type displayed

**Task 3: ASPIC+ Attack Type Indicators**
- [ ] Open ArgumentCardV2 with attacks
- [ ] Expand attacks section
- [ ] Verify ⚔️ badges with color coding:
  - REBUTS (red)
  - UNDERCUTS (amber)
  - UNDERMINES (gray)
- [ ] Hover over badge to see tooltip

**Task 4: Documentation**
- [ ] Review `docs/cq-dialogue-ludics-flow.md`
- [ ] Verify diagrams are clear
- [ ] Check API examples work
- [ ] Test troubleshooting section

### Automated Testing

#### Integration Test: CQ → AIF Provenance

**File**: `__tests__/integration/cq-to-aif-provenance.test.ts`

```typescript
describe("CQ to AIF Provenance", () => {
  it("should preserve CQ metadata through full chain", async () => {
    // 1. Create DialogueMove with CQ payload
    const move = await createDialogueMove({
      kind: "WHY",
      payload: {
        cqKey: "CQ_EXPERTISE",
        cqText: "How credible is E?",
        attackType: "UNDERMINES"
      }
    });
    
    // 2. Compile to LudicAct
    await compileDeliberationMoves(deliberationId);
    const ludicAct = await findLudicActForMove(move.id);
    expect(ludicAct.metaJson.aspic.cqKey).toBe("CQ_EXPERTISE");
    
    // 3. Sync to AIF
    await syncToAif(ludicAct, deliberationId);
    const caNode = await findCANodeForLudicAct(ludicAct.id);
    expect(caNode.metadata.aspicAttackType).toBe("undermining");
    
    // 4. Translate to ASPIC+
    const theory = await aifToAspic(deliberationId);
    expect(theory.assumptions).toContain(attackerSymbol);
  });
});
```

#### Unit Tests

**compileFromMoves**:
```typescript
test("WHY move preserves CQ metadata in LudicAct", () => {
  const moves = [
    { kind: "WHY", payload: { cqKey: "CQ1", attackType: "UNDERMINES" } }
  ];
  const designs = compileFromMoves(moves);
  const act = designs.negDesign.acts[0];
  expect(act.metaJson.aspic.cqKey).toBe("CQ1");
});
```

**aifToAspic**:
```typescript
test("UNDERCUTS classified as assumptions", () => {
  const caNode = {
    nodeType: "CA",
    metadata: { aspicAttackType: "undercutting" }
  };
  const theory = aifToAspic([caNode]);
  expect(theory.assumptions.length).toBeGreaterThan(0);
});
```

---

## Troubleshooting

### Common Issues

#### Issue 1: CQ Badges Not Showing

**Symptom**: WHY/GROUNDS count badges don't appear on CQ cards

**Diagnosis**:
1. Check API response includes `whyCount`/`groundsCount`:
   ```bash
   curl http://localhost:3000/api/cqs?targetType=argument&targetId=arg123
   ```
2. Verify DialogueMoves have `payload.cqKey`:
   ```sql
   SELECT payload FROM "DialogueMove" 
   WHERE "targetId" = 'arg123';
   ```

**Solution**:
- Regenerate Prisma client: `npx prisma generate`
- Clear SWR cache: Refresh page with Cmd+Shift+R
- Check TypeScript errors: `npm run lint`

#### Issue 2: ASPIC+ Badges Missing

**Symptom**: ⚔️ attack type badges don't show in ArgumentCardV2

**Diagnosis**:
1. Check CA-nodes have `aspicAttackType`:
   ```bash
   curl http://localhost:3000/api/ca?targetArgumentId=arg123
   ```
2. Verify CA-node metadata:
   ```sql
   SELECT metadata FROM "AifNode" 
   WHERE "nodeType" = 'CA';
   ```

**Solution**:
- Re-run AIF sync: `POST /api/ludics/compile` with `forceRecompile: true`
- Check Phase 7 implementation: `lib/aif/translation/aifToAspic.ts`
- Verify `aspicAttackType` mapping in ArgumentCardV2

#### Issue 3: LudicAct CQ Context Not Showing

**Symptom**: ActInspector doesn't show "Triggered by CQ" section

**Diagnosis**:
1. Check LudicAct has `metaJson.aspic`:
   ```sql
   SELECT "metaJson" FROM "LudicAct" WHERE id = 'act456';
   ```
2. Verify ActInspector receives full LudicAct data

**Solution**:
- Check `compileFromMoves` preserves metadata
- Verify API response includes `metaJson`
- Restart TypeScript server: Cmd+Shift+P → "Restart TS Server"

#### Issue 4: Prisma Type Errors

**Symptom**: TypeScript shows "Property 'groundsText' does not exist"

**Diagnosis**:
- Prisma client types are cached/out of sync

**Solution**:
```bash
npx prisma generate
# Restart VS Code TypeScript server
# Or add @ts-expect-error comment with explanation
```

---

## Performance Considerations

### Database Query Optimization

**CQ Status Queries**:
- Uses compound index: `[targetType, targetId, schemeKey, cqKey]`
- Batches multiple scheme queries: `schemeKey: { in: keys }`
- Selects only needed fields (no `SELECT *`)

**DialogueMove Count Queries** (Phase 8):
- Filters by `targetType` and `targetId` (indexed)
- Counts in-memory (no aggregation query)
- Cached via SWR (30-second TTL)

**CA-Node Queries**:
- Uses `targetArgumentId` index
- Joins with LudicAct metadata efficiently
- Filters legacy attacks at query time

### Caching Strategy

**SWR (stale-while-revalidate)**:
```typescript
useSWR(`/api/cqs?targetType=${type}&targetId=${id}`, fetcher, {
  revalidateOnFocus: false,
  dedupingInterval: 30000  // 30 seconds
});
```

**Manual Cache Invalidation**:
```typescript
import { mutate } from "swr";

// After creating WHY move
await mutate(`/api/cqs?targetType=argument&targetId=${id}`);
```

---

## Future Enhancements

### Short-Term (Months 1-3)

1. **CQ Analytics Dashboard**
   - Most challenged CQs
   - Average time to satisfy
   - Response quality metrics

2. **Real-Time Updates**
   - WebSocket integration
   - Live badge count updates
   - Notification system

3. **CQ Templates**
   - Predefined response templates
   - Auto-suggest grounds text
   - Quality scoring

### Medium-Term (Months 4-6)

4. **ASPIC+ Evaluation Engine**
   - Compute grounded semantics
   - Show argument strength scores
   - Visualize attack/defense graphs

5. **Machine Learning**
   - Predict CQ relevance
   - Suggest likely challenges
   - Auto-classify attack types

6. **Cross-Deliberation Analysis**
   - Compare CQ patterns across arguments
   - Identify common objections
   - Track resolution strategies

### Long-Term (Months 7-12)

7. **Formal Verification**
   - Prove ASPIC+ soundness
   - Validate transformation correctness
   - Automated consistency checking

8. **Multi-Language Support**
   - Translate CQs
   - Localized scheme libraries
   - Cultural adaptation

---

## Glossary

**AIF (Argument Interchange Format)**: Graph-based representation of arguments with typed nodes (I-nodes, S-nodes, CA-nodes).

**ASPIC+ (Argumentation System for Practical Inference with Compound)**: Formal argumentation framework with strict/defeasible rules, assumptions, and contraries.

**CA-Node (Conflict Application)**: AIF node type representing an attack relationship between arguments.

**Critical Question (CQ)**: Scheme-specific question designed to challenge aspects of an argument.

**Dialogue Move**: Structured user action in deliberation (WHY, GROUNDS, CLOSE, etc.).

**LudicAct**: Formal ludics representation of dialogue action with polarity and locus.

**Ludics**: Mathematical framework for dialogue and interaction using designs and acts.

**Polarity**: Direction of ludics act (POSITIVE/Proponent or NEGATIVE/Opponent).

**Scheme**: Argumentation pattern with premises, conclusion, and critical questions.

**Target Scope**: Part of argument challenged (premise, inference, conclusion).

---

## Version History

- **v1.0** (2025-11-06): Initial documentation (Phase 8, Task 4 complete)
- **v0.9** (2025-11-05): Phase 8 Tasks 1-3 complete (badges, tooltips, indicators)
- **v0.8** (2025-11-04): Phase 7 complete (ASPIC+ translation enhancement)
- **v0.7** (2025-11-03): Phase 6 complete (AttackMenuProV2 deprecation)
- **v0.6** (2025-11-02): Phase 5 complete (SchemeSpecificCQsModal integration)
- **v0.5** (2025-11-01): Phase 4 complete (CriticalQuestionsV3 integration)
- **v0.1-0.4** (2025-10-20 to 2025-10-31): Phases 0-3 implementation

---

## Contact & Support

**Documentation Maintainer**: Mesh Development Team  
**Last Review**: November 6, 2025  
**Next Review**: December 2025 (after Phase 9)

For questions or issues:
1. Check [Troubleshooting](#troubleshooting) section
2. Review [Testing](#testing--validation) examples
3. Consult phase completion docs in `/PHASE_*_COMPLETE.md`
4. Submit issue with reproduction steps

---

**End of Documentation** ✅
