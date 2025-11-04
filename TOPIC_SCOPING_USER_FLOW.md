# Topic-Based Scoping: User Flow Explanation

**Date:** November 4, 2025  
**Status:** Implementation Complete  
**Purpose:** Clarify how topic scoping works from actual user interactions (not seeding)

---

## Executive Summary

**Topic-based scoping** groups dialogue moves by their **target argument's root ID**. When users interact with the UI to make assertions, ask questions, or provide evidence, each action creates a `DialogueMove` that targets a specific `Argument`. The compilation process then groups moves targeting the same "conversation thread" into independent ludic designs.

**Key Insight:** Each root argument = one topic = one P/O design pair.

---

## User Flow: From UI Interaction to Scoped Design

### Step 1: User Makes an Assertion (ASSERT Move)

**UI Action:** User clicks "Make a claim" or "Start new argument"

```typescript
// User input in UI
{
  deliberationId: "delib_climate_policy",
  text: "Carbon taxes are more effective than cap-and-trade",
  actorId: "alice"
}
```

**Backend: POST /api/dialogue/move**
```typescript
// Creates DialogueMove
const move = await prisma.dialogueMove.create({
  data: {
    deliberationId: "delib_climate_policy",
    targetType: "argument",           // ← Targeting an argument
    targetId: "arg_carbon_tax_001",   // ← This is the ROOT argument
    kind: "ASSERT",
    illocution: "Assert",
    actorId: "alice",
    payload: {
      text: "Carbon taxes are more effective than cap-and-trade",
      claimId: "claim_xyz"
    },
    signature: "...",
  }
});
```

**Result:**
- `DialogueMove` created with `targetType: "argument"` and `targetId: "arg_carbon_tax_001"`
- This move will be grouped into **topic scope: `topic:arg_carbon_tax_001`**

---

### Step 2: Another User Challenges (WHY Move)

**UI Action:** User Bob clicks "Challenge this" or "Ask why?" button on Alice's argument

```typescript
// UI triggers
{
  deliberationId: "delib_climate_policy",
  targetType: "argument",
  targetId: "arg_carbon_tax_001",  // ← Same root argument
  kind: "WHY",
  actorId: "bob"
}
```

**Backend: POST /api/dialogue/move**
```typescript
const challengeMove = await prisma.dialogueMove.create({
  data: {
    deliberationId: "delib_climate_policy",
    targetType: "argument",
    targetId: "arg_carbon_tax_001",   // ← SAME root as Alice's ASSERT
    kind: "WHY",
    illocution: "Question",
    actorId: "bob",
    payload: {
      text: "Why is a carbon tax more effective?",
      questionType: "justification"
    },
  }
});
```

**Result:**
- Another `DialogueMove` targeting **the same argument** (`arg_carbon_tax_001`)
- This move is **grouped into the same topic scope** as Alice's ASSERT
- Topic scope now has 2 moves: Alice's ASSERT + Bob's WHY

---

### Step 3: Alice Provides Evidence (GROUNDS Move)

**UI Action:** Alice clicks "Provide evidence" on Bob's challenge

```typescript
// UI triggers
{
  deliberationId: "delib_climate_policy",
  targetType: "argument",
  targetId: "arg_carbon_tax_001",  // ← Still same root
  kind: "GROUNDS",
  actorId: "alice",
  payload: {
    text: "Studies show carbon taxes reduce emissions by 15%",
    claimId: "claim_evidence_123",
    sourceUrl: "https://ipcc.ch/report"
  }
}
```

**Backend: Creates Support Argument**
```typescript
// First, create supporting argument
const supportArg = await prisma.argument.create({
  data: {
    deliberationId: "delib_climate_policy",
    parentId: "arg_carbon_tax_001",   // ← Links to parent
    schemeId: "scheme_expert_opinion",
    // ...
  }
});

// Then create DialogueMove
const groundsMove = await prisma.dialogueMove.create({
  data: {
    deliberationId: "delib_climate_policy",
    targetType: "argument",
    targetId: "arg_carbon_tax_001",   // ← SAME root argument
    kind: "GROUNDS",
    illocution: "Argue",
    actorId: "alice",
    payload: {
      text: "Studies show carbon taxes reduce emissions by 15%",
      createdArgumentId: supportArg.id,
    },
    argumentId: supportArg.id,  // ← Links to created argument
  }
});
```

**Result:**
- `supportArg` has `parentId: "arg_carbon_tax_001"` (forms argument tree)
- `DialogueMove` still targets **root argument** `arg_carbon_tax_001`
- Topic scope now has 3 moves: ASSERT + WHY + GROUNDS (all about carbon tax effectiveness)

---

### Step 4: Separate Topic Starts (Different Root Argument)

**UI Action:** User Carol starts a **completely different argument** about nuclear power

```typescript
// UI triggers
{
  deliberationId: "delib_climate_policy",  // ← Same deliberation
  text: "Nuclear energy is safer than fossil fuels",
  actorId: "carol"
}
```

**Backend: Creates NEW Root Argument**
```typescript
const nuclearArg = await prisma.argument.create({
  data: {
    deliberationId: "delib_climate_policy",
    parentId: null,  // ← No parent = ROOT argument
    schemeId: "scheme_expert_opinion",
    // ...
  }
});

const assertMove = await prisma.dialogueMove.create({
  data: {
    deliberationId: "delib_climate_policy",
    targetType: "argument",
    targetId: "arg_nuclear_safety_002",  // ← DIFFERENT root argument
    kind: "ASSERT",
    actorId: "carol",
    payload: {
      text: "Nuclear energy is safer than fossil fuels",
      claimId: "claim_nuclear_abc"
    },
  }
});
```

**Result:**
- NEW topic scope created: `topic:arg_nuclear_safety_002`
- This is **independent** from the carbon tax topic
- Now deliberation has **2 separate topic scopes**

---

## How Scoping Works During Compilation

### Compilation Trigger

```typescript
// User clicks "Recompile" in Ludics panel, OR
// Automatic compilation after new moves created

await compileFromMoves("delib_climate_policy", {
  scopingStrategy: "topic"  // ← User's selected strategy
});
```

### Behind the Scenes: `computeArgumentRoots()`

```typescript
async function computeArgumentRoots(
  moves: DialogueMoveRow[]
): Promise<Map<string, string>> {
  const rootMap = new Map<string, string>();
  
  // For each move, find its target argument's ROOT
  for (const m of moves) {
    if (m.targetType === 'argument') {
      // Key insight: all moves target arguments directly
      // The targetId IS the root for scoping purposes
      rootMap.set(m.targetId, m.targetId);
    }
  }
  
  return rootMap;
  // Result: Map of argumentId → rootArgumentId
  // e.g., "arg_carbon_tax_001" → "arg_carbon_tax_001"
  //       "arg_nuclear_safety_002" → "arg_nuclear_safety_002"
}
```

### Grouping Moves by Scope

```typescript
// In compileFromMoves.ts
const movesWithScopes = await computeScopes(moves, 'topic');

// movesWithScopes = [
//   { id: "move1", targetId: "arg_carbon_tax_001", scope: "topic:arg_carbon_tax_001", ... },
//   { id: "move2", targetId: "arg_carbon_tax_001", scope: "topic:arg_carbon_tax_001", ... },
//   { id: "move3", targetId: "arg_carbon_tax_001", scope: "topic:arg_carbon_tax_001", ... },
//   { id: "move4", targetId: "arg_nuclear_safety_002", scope: "topic:arg_nuclear_safety_002", ... },
// ]

const movesByScope = groupBy(movesWithScopes, m => m.scope);
// {
//   "topic:arg_carbon_tax_001": [move1, move2, move3],
//   "topic:arg_nuclear_safety_002": [move4]
// }
```

### Creating Designs per Scope

```typescript
for (const [scopeKey, scopeMoves] of Object.entries(movesByScope)) {
  // Create P design for this topic
  const P = await prisma.ludicDesign.create({
    data: {
      deliberationId: "delib_climate_policy",
      participantId: "Proponent",
      scope: "topic:arg_carbon_tax_001",  // ← Topic-specific scope
      scopeType: "topic",
      scopeMetadata: {
        type: "topic",
        label: "Carbon taxes are more effective than cap-and-trade",
        moveCount: 3,
        actors: {
          proponent: ["alice"],
          opponent: ["bob"],
          all: ["alice", "bob"]
        }
      }
    }
  });
  
  // Create O design for this topic
  const O = await prisma.ludicDesign.create({
    data: {
      deliberationId: "delib_climate_policy",
      participantId: "Opponent",
      scope: "topic:arg_carbon_tax_001",
      scopeType: "topic",
      scopeMetadata: { /* same metadata */ }
    }
  });
  
  // Compile acts from moves into these designs
  await compileScopeActs(scopeMoves, P, O);
}
```

**Result:**
- **4 designs total** (2 topics × 2 polarities)
  - `topic:arg_carbon_tax_001` → P design (Alice's assertions)
  - `topic:arg_carbon_tax_001` → O design (Bob's challenges)
  - `topic:arg_nuclear_safety_002` → P design (Carol's assertions)
  - `topic:arg_nuclear_safety_002` → O design (empty for now)

---

## Detailed Example: Multi-Topic Deliberation

### Scenario: Climate Policy Debate

**Actors:**
- Alice (pro-climate action)
- Bob (skeptic)
- Carol (pro-nuclear)
- Dave (anti-nuclear)

### Timeline of User Actions

#### T1: Alice starts Topic A (Carbon Tax)
```
UI: Alice clicks "Make a claim"
→ Creates Argument arg_A (parentId: null)
→ Creates DialogueMove { kind: ASSERT, targetId: arg_A }
→ Scope: topic:arg_A
```

#### T2: Bob challenges Topic A
```
UI: Bob clicks "Challenge" on arg_A
→ Creates DialogueMove { kind: WHY, targetId: arg_A }
→ Scope: topic:arg_A (same as T1)
```

#### T3: Carol starts Topic B (Nuclear Safety)
```
UI: Carol clicks "Make a claim" (new thread)
→ Creates Argument arg_B (parentId: null)
→ Creates DialogueMove { kind: ASSERT, targetId: arg_B }
→ Scope: topic:arg_B (NEW scope)
```

#### T4: Alice defends Topic A
```
UI: Alice clicks "Provide evidence" on Bob's challenge
→ Creates Argument arg_A_support (parentId: arg_A)
→ Creates DialogueMove { kind: GROUNDS, targetId: arg_A }
→ Scope: topic:arg_A (back to first topic)
```

#### T5: Dave challenges Topic B
```
UI: Dave clicks "Challenge" on arg_B
→ Creates DialogueMove { kind: WHY, targetId: arg_B }
→ Scope: topic:arg_B (Carol's nuclear topic)
```

#### T6: Carol defends Topic B
```
UI: Carol clicks "Provide evidence"
→ Creates Argument arg_B_support (parentId: arg_B)
→ Creates DialogueMove { kind: GROUNDS, targetId: arg_B }
→ Scope: topic:arg_B
```

### Compilation Result

```typescript
// After compileFromMoves with scopingStrategy: "topic"

Deliberation: "delib_climate_policy"
├─ topic:arg_A (Carbon Tax Effectiveness)
│  ├─ LudicDesign P (Proponent)
│  │  ├─ Act 0.1: ASSERT "Carbon tax effective" (Alice, T1)
│  │  └─ Act 0.1.1.1: GROUNDS "Studies show 15% reduction" (Alice, T4)
│  └─ LudicDesign O (Opponent)
│     └─ Act 0.1.1: WHY "Why effective?" (Bob, T2)
│
└─ topic:arg_B (Nuclear Safety)
   ├─ LudicDesign P (Proponent)
   │  ├─ Act 0.1: ASSERT "Nuclear safer" (Carol, T3)
   │  └─ Act 0.1.1.1: GROUNDS "Safety data" (Carol, T6)
   └─ LudicDesign O (Opponent)
      └─ Act 0.1.1: WHY "Why safer?" (Dave, T5)
```

**Key Points:**
1. **2 independent topic scopes** (arg_A and arg_B)
2. **4 designs total** (2 scopes × 2 polarities)
3. Each scope has its **own act tree** (starts at 0.1)
4. Alice and Carol never interact directly (different topics)
5. Bob's challenge to Alice is **isolated** from Dave's challenge to Carol

---

## UI Affordances That Create Scopes

### Primary Scoping Actions

#### 1. **Starting New Root Arguments**
- **UI:** "Make a claim" button at deliberation level
- **Effect:** Creates `Argument` with `parentId: null`
- **Scope:** New `topic:arg_<id>` scope

#### 2. **Challenging Existing Arguments**
- **UI:** "Challenge" or "Ask why?" button on argument card
- **Effect:** Creates `DialogueMove` targeting that argument
- **Scope:** Joins existing `topic:arg_<root_id>` scope

#### 3. **Providing Support/Evidence**
- **UI:** "Provide evidence" or "Support this" button
- **Effect:** Creates child `Argument` + `DialogueMove` (GROUNDS)
- **Scope:** Stays in parent's `topic:arg_<root_id>` scope

#### 4. **Attacking/Undercutting**
- **UI:** "Attack this premise" button
- **Effect:** Creates attack edge + `DialogueMove`
- **Scope:** Depends on target - usually joins attacker's scope

### Scope Boundaries (What DOESN'T Cross Scopes)

#### Example: Cross-Topic Citation

```typescript
// Alice in Topic A (Carbon Tax) wants to cite Topic B (Nuclear Safety)
// Current implementation: Does NOT automatically merge scopes

// Move in Topic A:
{
  kind: "GROUNDS",
  targetId: "arg_A",  // ← Still targeting Topic A
  payload: {
    text: "Carbon tax is better because nuclear is unsafe",
    // Manual reference to Topic B (user types it)
  }
}
// Scope: topic:arg_A (no automatic link to Topic B)
```

**Phase 4 Enhancement:** Cross-scope references via delocation
- Explicitly link `topic:arg_A` → `topic:arg_B`
- Track in `design.referencedScopes: ["topic:arg_B"]`
- Use fax/delocation to "import" evidence from other scope

---

## Comparison: Legacy vs Topic Scoping

### Legacy Mode (scope: null)

**All moves in ONE global scope:**

```typescript
// Deliberation with 10 topics, 50 moves
await compileFromMoves(delibId, { scopingStrategy: "legacy" });

// Result: 2 designs
LudicDesign {
  scope: null,
  participantId: "Proponent",
  acts: [
    // Act 0.1: Alice on Topic A
    // Act 0.2: Carol on Topic B
    // Act 0.3: Alice on Topic A again
    // ... all 50 moves merged into one tree
  ]
}
```

**Problem:** Can't tell which topics converged vs diverged

---

### Topic Mode (scope: topic:arg_<id>)

**Each root argument = separate scope:**

```typescript
// Same deliberation
await compileFromMoves(delibId, { scopingStrategy: "topic" });

// Result: 20 designs (10 topics × 2 polarities)
LudicDesign {
  scope: "topic:arg_A",
  participantId: "Proponent",
  acts: [/* Only moves about Topic A */]
}

LudicDesign {
  scope: "topic:arg_B",
  participantId: "Proponent",
  acts: [/* Only moves about Topic B */]
}
// ... 18 more designs
```

**Benefit:** Can check orthogonality **per topic** → see which topics resolve

---

## Key Insights for Phase 4

### 1. Scope Boundaries Are Argument Roots

- **Boundary:** Root argument ID (`parentId: null`)
- **Crossing:** Requires explicit cross-scope reference
- **Delocation:** Needed when Topic A cites Topic B

### 2. Moves Always Target Arguments

- All `DialogueMove` have `targetType: "argument"`
- The `targetId` determines the scope
- Child arguments inherit parent's scope

### 3. Scope Metadata Tracks Context

```typescript
scopeMetadata: {
  type: "topic",
  label: "Carbon taxes are more effective",
  moveCount: 5,
  actors: {
    proponent: ["alice"],
    opponent: ["bob", "carol"],
    all: ["alice", "bob", "carol"]
  },
  timeRange: {
    start: "2025-11-01T10:00:00Z",
    end: "2025-11-04T15:30:00Z"
  }
}
```

### 4. Defense Trees Are Scope-Local

- Each design's act tree shows **only that topic's** argument structure
- Defense depth = how deeply argument thread was explored
- Trace convergence = whether **that specific topic** resolved

---

## Next: Phase 4 Implementation

With this understanding, we can now implement:

1. **Cross-Scope References** (delocation)
   - UI: "Cite evidence from other topic" button
   - Backend: Track `referencedScopes` in design
   - Compilation: Use fax to import acts from other designs

2. **Defense Tree Visualization**
   - Show argument tree **per scope**
   - Highlight scope boundaries
   - Mark cross-scope citations

3. **Scope-Level Trace Computation**
   - Per-scope orthogonality check
   - Independent convergence status
   - Cross-scope interaction detection

4. **Forest View Enhancements**
   - Scope cards with metadata
   - Drag-and-drop scope merging
   - Cross-scope link visualization

Ready to proceed with Phase 4 implementation! 🚀
