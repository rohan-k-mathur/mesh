# Commitments ↔ Ludics Integration Analysis

**Date:** November 27, 2025  
**Status:** 🔍 **ARCHITECTURAL DEEP DIVE**

---

## Executive Summary

**Question:** How do commitments (rules/facts) interact with ludics (designs, acts, steps, chronicles, loci, branches, depth, convergence/divergence)?

**Answer:** They operate at **different levels of abstraction** with **multiple integration points**:

1. **Commitments as Content** - Facts/rules are *expressions* on Ludics acts
2. **Loci as Anchors** - Commitments are spatially located at specific loci
3. **Inference as Metareasoning** - Commitments track *what's at stake* while Ludics tracks *how the game plays out*
4. **Contradictions Dual Paths** - Commitment-level (syntactic) vs Ludics-level (proof-theoretic)

---

## Architecture Layers

### Layer 0: Ludics (Game-Theoretic Substrate)
**Purpose:** Formal interaction protocol  
**Primitives:** Acts, loci, polarity, ramification  
**Output:** Convergence/divergence, chronicles, traces

### Layer 1: Commitments (Propositional Content)
**Purpose:** Track what participants are committed to  
**Primitives:** Facts, rules, inference, contradictions  
**Output:** Derived facts, consistency checks

### Layer 2: Dialogue (Natural Language)
**Purpose:** Human-readable argumentation  
**Primitives:** Claims, arguments, schemes, moves  
**Output:** Argument graphs, dialogue trees

---

## Integration Point 1: Loci as Spatial Anchors 🗺️

### Current Implementation ✅

**Schema:**
```prisma
model LudicCommitmentElement {
  id            String   @id
  label         String   // "congestion_high" or "A -> B"
  basePolarity  String   // "pos" (fact) | "neg" (rule)
  baseLocusId   String?  // ← ANCHOR TO LUDICS
  baseLocus     LudicLocus? @relation(fields: [baseLocusId])
  entitled      Boolean
  derived       Boolean
}

model LudicLocus {
  id         String @id
  dialogueId String
  path       String  // "0", "0.1", "0.2.1"
  
  commitmentElements LudicCommitmentElement[]
  acts               LudicAct[]
}
```

**How It Works:**
1. Fact/rule added at locus `@0.2` → stored with `baseLocusId` pointing to that locus
2. Locus tree shows which commitments are "in play" at each address
3. Sub-loci inherit commitments from parents (locality principle)

**Example:**
```
Locus 0 (root)
  Fact: traffic_flowing
  Rule: traffic_flowing -> low_congestion
  
Locus 0.1 (Opponent challenges traffic_flowing)
  Inherits: traffic_flowing (from parent)
  New Fact: weather_bad
  New Rule: weather_bad -> not traffic_flowing
  
  → Contradiction detected at 0.1!
  → Ludics marks this branch as DIVERGENT
```

---

## Integration Point 2: Acts Carry Commitment Content 📝

### Current Implementation ✅

**Schema:**
```prisma
model LudicAct {
  id           String   @id
  designId     String
  kind         String   // "PROPER" | "DAIMON"
  polarity     String   // "P" | "O"
  locusId      String?
  locus        LudicLocus?
  ramification String[] // child loci opened
  expression   String?  // ← COMMITMENT TEXT HERE
  metaJson     Json?    // { justifiedByLocus, cqId, schemeKey }
}
```

**Flow:**
```
User makes GROUNDS move
  ↓
compileFromMoves() creates LudicAct
  ↓
act.expression = "IPCC Report 2021 shows X"
  ↓
OPTIONAL: User clicks "Commit this as fact"
  ↓
Creates LudicCommitmentElement
  - label: "IPCC Report 2021 shows X"
  - baseLocusId: act.locusId
  - basePolarity: "pos"
```

**Dual Representation:**
- **Ludics Act** = *procedural* (what action was taken, where, by whom)
- **Commitment Element** = *declarative* (what's now true at that locus)

---

## Integration Point 3: Inference at Loci 🔗

### Current Behavior

**What Happens:**
1. User adds commitments at root locus `0`
2. Clicks "Infer" → `interactCE()` runs on ALL commitments for that owner
3. Derived facts appear (green background)
4. Contradictions flagged (red)

**What's MISSING:**
- ❌ Inference doesn't respect locus boundaries
- ❌ Facts at `0.2` can't reference facts at `0.1` (siblings isolated)
- ❌ No "scoped inference" per branch

### Proposed: Locus-Scoped Inference 🆕

**Idea:** Inference should follow locus tree hierarchy

**Example:**
```
Locus 0 (root)
  Facts: A, B
  Rules: A & B -> C
  Infer → Derives: C ✅

Locus 0.1 (child branch)
  Inherits: A, B, C (from parent 0)
  New Facts: D
  New Rules: C & D -> E
  Infer → Derives: E ✅ (uses inherited C)

Locus 0.2 (sibling branch)
  Inherits: A, B, C (from parent 0)
  New Facts: not C (contradiction!)
  Infer → Contradiction: C vs not C ⚠️
  → Ludics marks 0.2 as DIVERGENT
```

**Implementation:**
```typescript
// packages/ludics-engine/commitments.ts
export async function interactCEScoped(
  dialogueId: string,
  ownerId: string,
  focusLocusPath: string  // NEW: which locus to infer at
) {
  // 1. Collect facts/rules from focus locus
  const focusFacts = await getCommitmentsAtLocus(dialogueId, ownerId, focusLocusPath);
  
  // 2. Collect facts/rules from ancestor loci (inheritance)
  const ancestorPaths = getAncestorPaths(focusLocusPath); // ["0", "0.1"]
  const inheritedFacts = await getCommitmentsAtLoci(dialogueId, ownerId, ancestorPaths);
  
  // 3. Merge and run inference
  const allFacts = [...inheritedFacts, ...focusFacts];
  return runInferenceOn(allFacts);
}
```

---

## Integration Point 4: Convergence/Divergence via Commitments 🎯

### Theory (Girard's Ludics)

**Convergence (†):**
- Positive design meets negative design
- All ramifications match
- Interaction terminates successfully
- = **Logical proof succeeds**

**Divergence (⊥):**
- Ramification mismatch
- No matching action available
- Interaction fails
- = **Logical proof fails**

### Current: Syntactic Convergence ✅

**How It Works:**
```typescript
// packages/ludics-engine/step.ts
function checkConvergence(trace) {
  for each step:
    if posAct.ramification ≠ negAct.expectedRamification:
      return DIVERGENT
  
  if reaches DAIMON:
    return CONVERGENT
  
  return ONGOING
}
```

**Problem:** This only checks **structural** compatibility, not **semantic** consistency.

### Proposed: Semantic Convergence via Commitments 🆕

**Idea:** Divergence should also occur when commitments contradict

**Example:**
```
Proponent at 0.1:
  Commits: traffic_flowing
  
Opponent at 0.1:
  Commits: not traffic_flowing
  
→ Ludics marks 0.1 as DIVERGENT (commitment contradiction)
→ Even if ramifications match syntactically!
```

**Implementation:**
```typescript
// packages/ludics-engine/step.ts
async function stepWithCommitmentCheck(trace) {
  // 1. Normal syntactic step
  const nextStep = computeNextStep(trace);
  
  // 2. NEW: Check commitments at this locus
  const locus = nextStep.locus;
  const proCommitments = await listCS(dialogueId, 'Proponent', locus);
  const oppCommitments = await listCS(dialogueId, 'Opponent', locus);
  
  // 3. Run inference on both sides
  const proInfer = await interactCE(dialogueId, 'Proponent', locus);
  const oppInfer = await interactCE(dialogueId, 'Opponent', locus);
  
  // 4. Check for contradictions
  if (proInfer.contradictions.length > 0 || oppInfer.contradictions.length > 0) {
    return { status: 'DIVERGENT', reason: 'COMMITMENT_CONTRADICTION' };
  }
  
  // 5. Check for cross-participant contradictions
  const crossContradictions = findCrossContradictions(proInfer.derivedFacts, oppInfer.derivedFacts);
  if (crossContradictions.length > 0) {
    return { status: 'DIVERGENT', reason: 'CROSS_COMMITMENT_CONTRADICTION' };
  }
  
  return nextStep;
}
```

---

## Integration Point 5: Branches as Scopes 🌳

### Current: Flat Commitment Store

**Problem:**
```
Proponent has ONE commitment store
  Facts: [A, B, C, D, E, F, ...]
  Rules: [...]
  
All facts apply everywhere (no scoping)
```

**Issues:**
- Can't have different assumptions in different branches
- Can't explore hypothetical scenarios
- Can't backtrack without deleting facts

### Proposed: Branched Commitment Stores 🆕

**Idea:** Each locus has its own commitment store (with inheritance)

**Schema Extension:**
```prisma
model LudicCommitmentState {
  id           String @id
  ownerId      String  // "Proponent" | "Opponent"
  locusId      String? // NEW: scope to specific locus
  locus        LudicLocus? @relation(fields: [locusId])
  
  elements     LudicCommitmentElement[]
  
  @@unique([ownerId, locusId])
}
```

**Example:**
```
Locus 0 (root)
  Proponent CS:
    Facts: [A, B]
    Rules: [A -> C]
  
Locus 0.1 (explore: "what if A is false?")
  Proponent CS:
    Facts: [not A]  ← contradicts parent!
    Inherits: [B] from 0
    Infer: A -> C doesn't fire (A is false here)
  
Locus 0.2 (explore: "what if B is false?")
  Proponent CS:
    Facts: [not B]  ← different assumption
    Inherits: [A] from 0
    Infer: A -> C fires → C derived
```

**Benefits:**
- ✅ Hypothetical reasoning
- ✅ Counterfactual exploration
- ✅ Parallel what-if scenarios
- ✅ Clean backtracking (just abandon branch)

---

## Integration Point 6: Depth and Complexity Metrics 📊

### Current Metrics

**Ludics Insights:**
```typescript
{
  totalActs: 42,
  totalLoci: 18,
  maxDepth: 5,           // deepest locus path: "0.1.2.1.3"
  branchFactor: 2.3,     // avg children per locus
  convergenceRate: 0.67  // % of traces that converge
}
```

**Commitments Insights:**
```typescript
{
  totalFacts: 15,
  totalRules: 8,
  derivedFacts: 3,
  contradictions: 2,
  inferenceDepth: 4      // longest derivation chain
}
```

### Proposed: Combined Metrics 🆕

**Idea:** Correlate ludics structure with commitment complexity

**New Insights:**
```typescript
{
  // Commitment density per depth
  commitmentsByDepth: {
    0: { facts: 5, rules: 2 },      // root
    1: { facts: 3, rules: 1 },      // depth 1
    2: { facts: 7, rules: 5 },      // depth 2 ← most contested!
  },
  
  // Inference activity per branch
  inferenceFiredAt: ['0.1', '0.2.1', '0.3'],
  
  // Contradiction hotspots
  contradictionLoci: ['0.2', '0.3.1'],
  
  // Convergence correlation
  branchesWithContradictions: ['0.2', '0.3.1'],
  divergentTraces: ['trace-1', 'trace-3'],
  // → 100% correlation! Contradictions cause divergence
}
```

---

## Integration Point 7: Chronicles as Commitment Evolution 📖

### Current: Chronicles Track Acts

**Schema:**
```prisma
model LudicChronicle {
  id        String @id
  designId  String
  actId     String
  order     Int    // chronological sequence
  
  design    LudicDesign
  act       LudicAct
}
```

**Purpose:** Temporal order of actions taken

### Proposed: Commitment Chronicles 🆕

**Idea:** Track how commitments evolve over time

**Schema:**
```prisma
model CommitmentChronicle {
  id         String   @id
  csId       String   // commitment state
  operation  String   // "ADD_FACT" | "ADD_RULE" | "ERASE" | "SUSPEND" | "INFER"
  elementId  String?  // which fact/rule
  timestamp  DateTime
  triggeredBy String? // which act or move caused this
  derivedIds String[] // if INFER, which facts derived
  
  @@index([csId, timestamp])
}
```

**Use Cases:**
- 📊 Visualize commitment evolution over time
- 🔍 Debug: "Why was fact X derived?"
- 📝 Generate natural language summary: "At step 5, Proponent conceded A, which derived B and C via rule R1"
- ⏮️ Replay commitment history

---

## Integration Point 8: Concession as Commitment Update 🤝

### Current Implementation ✅

**Flow:**
```
User clicks "Concede P at locus L"
  ↓
/api/ludics/concession
  ↓
1. Add Ludics acts: (+, L, {L.1}, "P") then (−, L.1, [], "ACK")
2. Update commitment store: applyToCS(ownerId, { add: [{ label: P, basePolarity: 'pos', baseLocusPath: L }] })
  ↓
Commitment now visible in CommitmentsPanel
Inference can use it
```

**Code:** (`packages/ludics-engine/concession.ts`)
```typescript
export async function concede(params: {
  dialogueId: string,
  concedingParticipantId: string,
  anchorLocus: string,
  proposition: { text: string, baseLocus?: string },
}) {
  // 1. Add ludics acts
  await appendActs(design.id, [
    { kind:'PROPER', polarity:'P', locus: anchorLocus, ... },
    { kind:'PROPER', polarity:'O', locus: `${anchorLocus}.1`, ... }
  ]);
  
  // 2. Add to commitment store ✅
  await applyToCS(dialogueId, concedingParticipantId, {
    add: [{ 
      label: proposition.text, 
      basePolarity: 'pos',
      baseLocusPath: proposition.baseLocus ?? '0' 
    }]
  });
}
```

**This is the BRIDGE!** Ludics action → Commitment update

---

## Integration Point 9: Rules as Designs? 🤔

### Question

**Could rules BE designs?**

Example:
```
Rule: "A & B -> C"

As a Ludics design:
  Locus 0:
    Negative act: (−, 0, [1, 2])  "Expects A and B"
  Locus 0.1:
    Test for A
  Locus 0.2:
    Test for B
  If both succeed:
    Positive act: (+, 0.3, [], "C")  "Provides C"
```

**Benefit:** Rules become *executable designs* rather than text patterns.

**Challenge:** Need to define:
- How to "test" for a fact (orthogonality check?)
- How to "provide" a derived fact (design interaction?)
- Polarity assignments (rule as negative behavior?)

**Status:** 🔬 **Theoretical - needs research**

---

## Architectural Recommendations

### 🔴 High Priority (Immediate)

1. **Implement locus-scoped commitment stores**
   - Add `locusId` to `LudicCommitmentState`
   - Implement inheritance logic (child loci see parent commitments)
   - Update UI to show commitments per locus

2. **Add semantic divergence detection**
   - Check for contradictions during `step()` computation
   - Mark traces as DIVERGENT when commitments contradict
   - Show contradiction details in UI

3. **Integrate concession flow** (already exists, just document)
   - Ensure concession popover is visible
   - Add UI affordance: "This will add to your commitments"

### 🟡 Medium Priority (Phase 5)

4. **Implement commitment chronicles**
   - Track temporal evolution
   - Enable replay/debugging
   - Generate natural language summaries

5. **Add combined metrics**
   - Correlate ludics structure with commitment complexity
   - Show "hotspots" where inference/contradictions occur
   - Visual heatmap on loci tree

6. **Cross-participant contradiction detection**
   - Check if Proponent's derived facts contradict Opponent's
   - Flag these as logical conflicts
   - Suggest resolution strategies

### 🟢 Low Priority (Research)

7. **Rules as designs** (theoretical)
   - Explore encoding inference rules as ludics designs
   - Test orthogonality-based rule matching
   - Prototype "executable commitment store"

8. **Behavioral equivalence via commitments**
   - Two designs are equivalent if they have same commitment consequences
   - Use as alternative to syntactic orthogonality tests

---

## Current Integration State: Summary

### ✅ What Works

| Feature | Status | Location |
|---------|--------|----------|
| Loci as anchors | ✅ Working | `LudicCommitmentElement.baseLocusId` |
| Acts carry content | ✅ Working | `LudicAct.expression` |
| Concession → Commitment | ✅ Working | `packages/ludics-engine/concession.ts` |
| Basic inference | ✅ Working | `packages/ludics-engine/commitments.ts` |
| Contradiction detection | ✅ Working | `interactCE()` |
| UI separation | ✅ Working | Two panels side-by-side |

### ❌ What's Missing

| Feature | Priority | Complexity |
|---------|----------|------------|
| Locus-scoped stores | 🔴 High | Medium |
| Inheritance logic | 🔴 High | Medium |
| Semantic divergence | 🔴 High | Low |
| Commitment chronicles | 🟡 Medium | High |
| Combined metrics | 🟡 Medium | Low |
| Cross-participant checks | 🟡 Medium | Medium |
| Rules as designs | 🟢 Low | Very High |

---

## Concrete Next Steps

### Step 1: Add Locus Scoping (2-3 days)

**Schema migration:**
```prisma
model LudicCommitmentState {
  // Add optional locus scoping
  locusId  String?
  locus    LudicLocus? @relation(fields: [locusId])
  
  @@unique([ownerId, locusId])  // one state per owner per locus
}
```

**Backend changes:**
```typescript
// packages/ludics-engine/commitments.ts

// Add locus parameter
export async function applyToCS(
  dialogueId: string,
  ownerId: string,
  locusPath: string,  // NEW
  ops: { add?: AddOp[]; erase?: EraseOp[] }
) {
  const locus = await ensureLocus(dialogueId, locusPath);
  let cs = await prisma.ludicCommitmentState.findFirst({ 
    where: { ownerId, locusId: locus.id } 
  });
  // ... rest of logic
}

// Add inheritance for scoped inference
export async function interactCEScoped(
  dialogueId: string,
  ownerId: string,
  locusPath: string
) {
  // Collect facts from this locus + ancestors
  const ancestors = getAncestorPaths(locusPath);
  const facts = [];
  const rules = [];
  
  for (const path of [...ancestors, locusPath]) {
    const state = await listCS(dialogueId, ownerId, path);
    facts.push(...state.facts);
    rules.push(...state.rules);
  }
  
  // Run inference on merged set
  return runInference(facts, rules);
}
```

**UI changes:**
```tsx
// components/ludics/CommitmentsPanel.tsx

// Add locus selector
<Select value={selectedLocus} onChange={setSelectedLocus}>
  <option value="0">Root (0)</option>
  {availableLoci.map(l => (
    <option value={l.path}>{l.path}</option>
  ))}
</Select>

// Show inherited commitments differently
{inheritedFacts.map(f => (
  <div className="fact-inherited">
    {f.label}
    <span className="text-xs text-slate-500">from {f.sourceLocus}</span>
  </div>
))}
```

---

### Step 2: Semantic Divergence Check (1 day)

**Update stepper:**
```typescript
// packages/ludics-engine/step.ts

async function computeStep(trace) {
  // ... existing logic ...
  
  // NEW: Check commitments at current locus
  const currentLocus = trace.steps[trace.steps.length - 1].locus;
  
  const proState = await listCS(trace.deliberationId, 'Proponent', currentLocus);
  const oppState = await listCS(trace.deliberationId, 'Opponent', currentLocus);
  
  const proInfer = await interactCEScoped('Proponent', currentLocus);
  const oppInfer = await interactCEScoped('Opponent', currentLocus);
  
  // Check for contradictions
  const hasContradiction = 
    proInfer.contradictions.length > 0 ||
    oppInfer.contradictions.length > 0;
  
  if (hasContradiction) {
    return {
      status: 'DIVERGENT',
      reason: 'COMMITMENT_CONTRADICTION',
      details: { proInfer, oppInfer }
    };
  }
  
  // ... continue normal step ...
}
```

---

### Step 3: UI Integration (1 day)

**Show commitment status in trace:**
```tsx
// components/deepdive/LudicsPanel.tsx

{trace.steps.map((step, i) => (
  <div className="step-card">
    {/* Existing step details */}
    
    {/* NEW: Commitment status */}
    {step.commitmentStatus && (
      <div className="commitment-status">
        {step.commitmentStatus === 'CONTRADICTION' && (
          <span className="badge-red">
            ⚠️ Contradiction at this locus
          </span>
        )}
        <button onClick={() => showCommitmentsAt(step.locus)}>
          View commitments →
        </button>
      </div>
    )}
  </div>
))}
```

---

## Glossary: Commitments ↔ Ludics Terminology

| Commitments | Ludics | Relationship |
|-------------|--------|--------------|
| Fact | Content on positive act | Facts are *expressions* of claims |
| Rule | Inference pattern | Rules are *meta-level* (not in formal ludics) |
| Derived fact | Consequence of interaction | Could be modeled as orthogonality result |
| Contradiction | Divergence | Both detect inconsistency |
| Locus anchor | Address | Facts "live at" specific addresses |
| Inference | Normalization | Both compute consequences |
| Entitlement | Available for interaction | Suspended facts ≈ pruned branches |

---

## Philosophical Note: Two Levels of Logic

**Ludics (Game Logic):**
- "What moves are legal?"
- "Does the interaction converge?"
- "Are the strategies compatible?"
- **Formal:** Addresses, polarity, ramification

**Commitments (Propositional Logic):**
- "What am I claiming?"
- "What follows from my claims?"
- "Are my claims consistent?"
- **Informal:** Facts, rules, inference

**Both are needed:**
- Ludics alone = formal structure, no content
- Commitments alone = content, no procedure

**Together:**
- Ludics provides the *protocol* (how to argue)
- Commitments provide the *payload* (what to argue about)

---

**Status:** Ready for implementation  
**Estimated effort:** 4-5 days for Steps 1-3  
**Next:** Prioritize locus-scoped commitment stores
