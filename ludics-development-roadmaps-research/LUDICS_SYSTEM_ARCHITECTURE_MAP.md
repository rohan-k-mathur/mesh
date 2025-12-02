# Ludics System Architecture Map & Modernization Plan

**Date**: November 27, 2025 (Updated)  
**Last Major Update:** November 4, 2025 (Phase 4 Scoped Designs)  
**Status**: Architecture Review & Modernization Planning  
**Purpose**: Map current Ludics implementation and plan integration with modern AIF/argument/debate systems

---

## Executive Summary

The Ludics system implements dialogical logic theory (Jean-Yves Girard's Ludics) for formal interaction analysis in deliberations. **The implementation is functional but isolated** from the recently modernized AIF/argument systems and hasn't been updated to integrate with:

- **AIF (Argument Interchange Format)** node/edge system
- **Dialogue moves** and command-card architecture  
- **Debate sheets** and DebateNode structure
- **Current commitment store** and assumption tracking systems
- **Modern React patterns** (SWR, server components, updated UI libraries)

**Key Finding**: Ludics has its own parallel tracking system (designs, acts, loci, traces) that **should be integrated as metadata/annotations** on the main argument/dialogue graph rather than remaining a separate subsystem.

---

## 1. Current Ludics Architecture

### 1.1 Core Components

#### **UI Layer** (Components)
```
components/deepdive/LudicsPanel.tsx
  ├─ Main interface (lives in DeepDivePanelV2 as a tab)
  ├─ Uses: useSWR for data fetching
  ├─ Depends on: DialogueTargetContext (for commitment anchoring)
  └─ Renders:
      ├─ TraceRibbon (step-by-step interaction visualization)
      ├─ LociTree / LociTreeWithControls (tree visualization)
      ├─ CommitmentsPanel (per-participant stores)
      ├─ DefenseTree (decisive step analysis)
      ├─ JudgeConsole (moderator actions)
      └─ ActInspector (individual action details)

components/ludics/*
  ├─ BehaviourInspectorCard.tsx (orthogonality/behaviour analysis)
  ├─ LociTreeWithControls.tsx (tree with composition modes)
  ├─ UniformityPill.tsx (uniformity status indicator)
  ├─ BehaviourHUD.tsx (behavior metrics overlay)
  ├─ LocusControls.tsx (locus manipulation tools)
  └─ TensorProbeCard.tsx (tensor product analysis)

components/dialogue/*
  ├─ narrateTrace.ts (converts trace → human-readable log)
  ├─ CommitmentDelta.tsx (shows commitment changes)
  ├─ NLCommitPopover.tsx (natural language commitment creator)
  └─ LudicsBadge.tsx (status badges for ludics state)
```

#### **Package Layer** (Core Logic)
```
packages/ludics-core/
  ├─ types.ts (StepResult, DaimonHint, Act, Locus)
  ├─ ve.ts (virtual evaluation/verification)
  ├─ ve/pathCheck.ts (path checking, duality)
  ├─ paths.ts (locus path utilities)
  └─ errors.ts (LudicError definitions)

packages/ludics-engine/
  ├─ stepper.ts (MAIN: interaction traversal, orthogonality)
  ├─ compileFromMoves.ts (DialogueMove → LudicDesign/Acts)
  ├─ orthogonal.ts (orthogonality checker)
  ├─ decisive.ts (decisive step computation)
  ├─ uniformity.ts (uniformity verification)
  ├─ concession.ts (concession handling)
  ├─ faxClone.ts (delocation/shift operations)
  └─ policies.ts (composition modes: assoc/partial/spiritual)

packages/ludics-react/
  ├─ LociTree.tsx (tree visualization component)
  ├─ TraceRibbon.tsx (interaction ribbon display)
  ├─ DefenseTree.tsx (defensive strategy tree)
  ├─ JudgeConsole.tsx (judge/moderator UI)
  ├─ CommitmentsPanel.tsx (commitment store UI)
  ├─ ActInspector.tsx (action detail inspector)
  └─ mergeDesignsToTree.ts (design merger for unified view)

packages/ludics-rest/
  └─ zod.ts (API validation schemas)
```

#### **API Layer** (Backend Routes)
```
app/api/ludics/
  ├─ step/route.ts (run interaction step)
  ├─ compile-step/route.ts (compile moves → step once)
  ├─ orthogonal/route.ts (check orthogonality)
  ├─ compile/route.ts (DialogueMove → Designs)
  ├─ acts/route.ts (add acts to design)
  ├─ designs/route.ts (fetch designs)
  ├─ designs/by-deliberation/route.ts (designs by delib)
  ├─ fax/route.ts (fax/delocation operations)
  ├─ fax/clone/route.ts (clone with shift)
  ├─ fax/branch/route.ts (branch operations)
  ├─ delocate/route.ts (rename loci to avoid collisions)
  ├─ additive/pick/route.ts (additive choice locking)
  ├─ uniformity/check/route.ts (uniformity verification)
  ├─ concession/route.ts (concession handling)
  ├─ judge/force/route.ts (forced judge actions)
  └─ examples/dialogues-in-ludics/route.ts (demo/examples)
```

#### **Library Layer** (Helpers & Utils)
```
lib/ludics/
  ├─ ensureBaseline.ts (ensure baseline designs exist)
  ├─ appendActs.ts (append acts to design)
  ├─ visibility.ts (act visibility validation)
  ├─ locks.ts (compile locking for concurrency)
  └─ delocate.ts (delocation implementation)

lib/dialogue/
  ├─ legalMovesServer.ts (uses ludics stepper)
  └─ legalAttackCuesFor.ts (ludics-aware move suggestions)
```

#### **Database Schema** (Prisma Models)
```prisma
model LudicDesign {
  id              String   @id @default(cuid())
  deliberationId  String
  participantId   String   // "Proponent" | "Opponent"
  rootLocusId     String
  semantics       String   @default("ludics-v1")
  hasDaimon       Boolean
  version         Int
  extJson         Json     // { role: 'pro' | 'opp', ... }
  
  acts            LudicAct[]
  chronicle       LudicChronicle[]
  tracesPos       LudicTrace[] @relation("PosDesign")
  tracesNeg       LudicTrace[] @relation("NegDesign")
}

model LudicAct {
  id             String   @id @default(cuid())
  designId       String
  kind           String   // "PROPER" | "DAIMON"
  polarity       String?  // "P" | "O"
  locusId        String?
  ramification   String[] // child loci opened
  expression     String?
  isAdditive     Boolean
  orderInDesign  Int
  metaJson       Json?    // { justifiedByLocus, schemeKey, cqId, delocated, ... }
  
  design         LudicDesign
  locus          LudicLocus?
  chronicle      LudicChronicle[]
}

model LudicLocus {
  id         String   @id @default(cuid())
  dialogueId String   // = deliberationId
  path       String   // "0", "0.1", "0.1.2", etc.
  
  acts       LudicAct[]
  designs    LudicDesign[]
  
  @@unique([dialogueId, path])
}

model LudicTrace {
  id                              String   @id @default(cuid())
  deliberationId                  String
  posDesignId                     String
  negDesignId                     String
  status                          String   // "ONGOING" | "CONVERGENT" | "DIVERGENT"
  endedAtDaimonForParticipantId   String?
  steps                           Json     // { pairs: [{posActId, negActId, locusPath, ts}], ... }
  extJson                         Json?    // { usedAdditive, decisiveIndices, ... }
  
  posDesign  LudicDesign @relation("PosDesign", ...)
  negDesign  LudicDesign @relation("NegDesign", ...)
}

model LudicChronicle {
  id         String @id @default(cuid())
  designId   String
  order      Int
  actId      String
  
  design     LudicDesign
  act        LudicAct
  
  @@unique([designId, order])
}
```

### 1.2 Data Flow

```
User Action (DeepDivePanelV2 → Ludics tab)
    ↓
LudicsPanel renders
    ↓
useCompileStep hook:
  POST /api/ludics/compile-step { deliberationId }
    ↓
  1. POST /api/ludics/compile (compileFromMoves)
     - Reads DialogueMove rows
     - Expands moves → acts (via payload.acts[] or legacy expansion)
     - Creates/updates LudicDesign + LudicAct rows
     - Maintains alternation, justification pointers
    ↓
  2. Fetch designs from DB (Proponent/Opponent)
    ↓
  3. POST /api/ludics/step
     - stepInteraction() in stepper.ts
     - Traverses positive/negative acts
     - Detects convergence/divergence
     - Computes decisive indices
     - Returns StepResult (trace + status)
    ↓
Returns: { proId, oppId, trace }
    ↓
LudicsPanel displays:
  - TraceRibbon (pairs visualization)
  - LociTree (unified/split tree view)
  - CommitmentsPanel (per-participant)
  - DefenseTree (decisive step analysis)
  - Daimon hints (closed loci suggestions)
```

### 1.3 Integration Points (Current)

#### **With Dialogue System**
- `compileFromMoves.ts` reads `DialogueMove` rows
- Moves with `payload.acts[]` are preferred
- Legacy moves (ASSERT/WHY/GROUNDS) get expanded
- `metaJson` stores: `justifiedByLocus`, `schemeKey`, `cqId`

#### **With Commitments**
- `CommitmentsPanel` renders commitment stores
- Uses `DialogueTargetContext` for anchoring commitments to arguments/claims
- API: `/api/commitments/apply` (not directly in ludics/)

#### **With DeepDivePanelV2**
- LudicsPanel is a **tab** in DeepDivePanelV2
- Shares `deliberationId` context
- Uses `useCompileStep` hook to auto-compile on mount

#### **With Arguments** (Indirect)
- DialogueMove → acts may reference `targetType: 'argument'`
- No direct link to AIF nodes/edges yet
- Schemes stored as `metaJson.schemeKey` in acts

---

### 1.4 Phase 4 Scoped Designs Architecture (November 2025)

**Implementation Date:** November 4, 2025  
**Status:** ✅ Complete (Backend + Forest UI)  
**Scope:** Multi-scope deliberation support

#### Overview

Phase 4 extended the Ludics system to support **multi-scope deliberations** where different topics, actor pairs, or arguments are tracked in separate P/O design pairs. This enables:

- Topic-based deliberations (e.g., Climate + Budget + Healthcare)
- Actor-pair interactions (e.g., Alice-vs-Bob, Alice-vs-Carol)
- Argument-level scoping (each argument as separate scope)

#### Schema Extensions

```prisma
model LudicDesign {
  id              String   @id
  deliberationId  String
  participantId   String   // "Proponent" | "Opponent"
  
  // Phase 4 additions:
  scope           String?  // "topic:climate" | "actors:Alice-Bob" | null
  scopeType       String?  // "topic" | "actor-pair" | "argument" | null
  scopeMetadata   Json?    // { label: "Climate Policy", topicId: "..." }
  
  // ... existing fields
}
```

**Backward Compatibility:**
- `scope: null` → Legacy mode (single P/O pair)
- Existing deliberations continue working unchanged

#### Scoping Strategies

Four strategies implemented in `compileFromMoves()`:

| Strategy | Grouping Logic | Example |
|----------|---------------|---------|
| **legacy** | All moves → 1 scope | 2 designs (P + O) |
| **topic** | By deliberation topic | 2N designs (N topics) |
| **actor-pair** | By interacting actors | 2N designs (N pairs) |
| **argument** | By argument ID | 2N designs (N arguments) |

#### Updated Data Flow (Multi-Scope)

```
DialogueMoves
    ↓
POST /api/ludics/compile { deliberationId, scopingStrategy }
    ↓
computeScopes(strategy, moves)  // Group moves by scope
    ↓
For each scope:
  ├─ Create P + O designs with scope metadata
  ├─ Compile moves → acts for this scope only
  └─ Store scope, scopeType, scopeMetadata
    ↓
Result: 2N designs (N scopes × 2 polarities)
    ↓
Forest View: LudicsForest.tsx renders N trees side-by-side
```

**Example (Topic Scoping):**
```typescript
// 15 moves across 3 topics
await compileFromMoves(delibId, { scopingStrategy: 'topic' });

// Result: 6 designs
// ├─ scope: "topic:climate" → Climate:P, Climate:O
// ├─ scope: "topic:budget"  → Budget:P, Budget:O
// └─ scope: "topic:health"  → Health:P, Health:O
```

#### Per-Scope Operations

All Ludics operations now accept scope parameters:

**Step Interaction:**
```typescript
// GET /api/ludics/step?deliberationId={id}&scope={scopeKey}
// Only steps the specified scope (finds P/O pair in that scope)

const climateDesigns = designs.filter(d => d.scope === 'topic:climate');
const { trace } = await stepInteraction({
  deliberationId,
  posDesignId: climateDesigns.find(d => d.participantId === 'Proponent').id,
  negDesignId: climateDesigns.find(d => d.participantId === 'Opponent').id,
});
```

**Orthogonality Check:**
```typescript
// GET /api/ludics/orthogonal?deliberationId={id}&scope={scopeKey}
// Checks if P and O designs in this scope are orthogonal

await checkOrthogonal(deliberationId, { scope: 'topic:climate' });
// → true/false for Climate scope only
```

**Stable Extensions:**
```typescript
// GET /api/af/stable?deliberationId={id}&scope={scopeKey}
// Computes stable extensions for arguments in this scope

const extensions = await fetch('/api/af/stable?scope=topic:budget');
```

#### UI Components Updated

**LudicsForest.tsx** (NEW)
- Renders multiple trees side-by-side
- One tree per scope
- Color-coded by scope type
- Click to focus on individual scope

**LudicsPanel.tsx** (UPDATED - Weeks 1-2)
- Scope selector dropdown
- Per-scope command buttons (Compile, Step, Orthogonality)
- Per-scope results tracking (NLI, Stable Sets)
- Scope-aware testers attachment

**Tree Visualization:**
```
Before (Legacy):        After (Multi-Scope Forest):
   [P+O Tree]           [Climate P+O] [Budget P+O] [Health P+O]
```

#### API Routes with Scope Support

| Endpoint | Scope Parameter | Behavior |
|----------|----------------|----------|
| `/api/ludics/compile` | `scopingStrategy` (body) | Creates 2N designs |
| `/api/ludics/step` | `scope` (query) | Steps single scope |
| `/api/ludics/orthogonal` | `scope` (query) | Checks single scope |
| `/api/af/stable` | `scope` (query) | AF for single scope |
| `/api/ludics/designs` | N/A | Returns all designs (filter client-side) |

#### Scope Metadata Structure

```typescript
// Topic scoping
scopeMetadata: {
  label: "Climate Policy",
  topicId: "T_abc123",
  topicName: "Climate Change"
}

// Actor-pair scoping
scopeMetadata: {
  label: "Alice vs Bob",
  actors: ["Alice", "Bob"],
  pairKey: "Alice-Bob"
}

// Argument scoping
scopeMetadata: {
  label: "Argument: Carbon tax is effective",
  argumentId: "A_xyz789",
  argumentTitle: "Carbon tax is effective"
}
```

#### Week 1-2 UI Enhancements (November 26-27, 2025)

**Week 1: Critical Fixes** ✅
- Added scope selector to LudicsPanel header
- Updated Compile button to accept `scopingStrategy`
- Made Step button scope-aware (finds P/O in active scope)
- Per-scope orthogonality check

**Week 2: Command Enhancements** ✅
- Append Daimon: Locus/scope picker with available loci
- NLI Analysis: Per-scope contradiction tracking
- Stable Sets: Per-scope extension computation
- Testers Attach: Scope-filtered design attachment

**Result:** All LudicsPanel commands now fully scope-aware with per-scope state tracking and UI feedback.

#### Common Patterns

**Filter designs by scope:**
```typescript
const activeScope = scopes[selectedIndex];
const scopeDesigns = designs.filter(d => (d.scope ?? 'legacy') === activeScope);
const pro = scopeDesigns.find(d => d.participantId === 'Proponent');
const opp = scopeDesigns.find(d => d.participantId === 'Opponent');
```

**Batch operations:**
```typescript
const results = await Promise.all(
  scopes.map(async (scope) => ({
    scope,
    orthogonal: await checkOrthogonal(deliberationId, { scope })
  }))
);
```

**Scope label display:**
```typescript
const scopeLabel = design.scopeMetadata?.label ?? design.scope ?? 'Legacy (All)';
```

#### Migration Path

No migration required. To enable scoping for existing deliberation:

```typescript
// 1. Delete old designs (optional - can coexist)
await prisma.ludicDesign.deleteMany({ where: { deliberationId } });

// 2. Recompile with scoping strategy
await compileFromMoves(deliberationId, { scopingStrategy: 'topic' });

// 3. UI automatically detects scopes and shows forest view
```

#### Performance Considerations

- **Compilation:** O(N) where N = number of scopes (embarrassingly parallel)
- **Stepping:** Each scope stepped independently (can parallelize)
- **Rendering:** Forest view uses virtualization for >10 scopes
- **Database:** Indexed on `(deliberationId, scope, participantId)` for fast queries

---

## 2. Gaps & Obsolescence Analysis

### 2.1 **Isolation from AIF System**

**Problem**: Ludics maintains parallel graph structures (designs, acts, loci) **separate from** the AIF node/edge system that now tracks arguments, premises, schemes, CQs, attacks.

**Consequence**:
- Ludics doesn't see AIF metadata (scheme applications, CQ status, attack subtypes)
- AIF diagrams don't show Ludics interaction traces
- Two separate "sources of truth" for argument structure

**Roadmap Says** (ludics_roadmap.md):
- "Acts as the truth (first-class)" → but acts aren't linked to AifNode
- "Behaviours service" → should consume AIF graph data

### 2.2 **Outdated UI Patterns**

**Problems**:
- `LudicsPanel.tsx` is 1200+ lines, **not using** modern composition patterns
- Direct `fetch()` calls mixed with `useSWR` inconsistently
- `ChipBar`, `Segmented` components **duplicated** from older UI (should use `@/components/ui`)
- **No server components** usage (all client-side fetching)

**Current Standards**:
- DeepDivePanelV2 uses: `SectionCard`, `Collapsible`, SWR consistently
- New components: `ArgumentActionsSheet`, `AIFAuthoringPanel`, `DialogueAwareGraphPanel`

### 2.3 **Missing Integration with Command Card System**

**Problem**: Ludics moves are compiled from `DialogueMove` rows, but the new **command-card system** (`CommandCard`, `movesToActions`, `performCommand`) doesn't have Ludics-aware actions.

**Gap**:
- No "Add Ludics Act" command
- No "Commit at Locus" command (partial: `NLCommitPopover` exists but not in command palette)
- No visual feedback in command cards for ludics state

### 2.4 **No DebateSheet Integration**

**Problem**: Ludics has its own tree visualization (LociTree) but **doesn't use DebateNode/DebateEdge** structures that now represent curated argument graphs.

**Opportunity**:
- DebateNodes could annotate which loci they occupy
- Ludics traces could be **overlaid** on DebateSheet diagrams
- Decisive steps could highlight DebateEdges as critical

### 2.5 **Stale Documentation**

**Issues**:
- `AgoraLudics.md` is minimal (3 lines)
- Main roadmap (`ludics_roadmap.md`) is **aspirational**, not tracking **what's implemented**
- No migration guide for integrating with AIF

---

## 3. Modernization Plan

### Phase 1: **Foundation — Link Ludics to AIF** (2 weeks)

#### Goals
- Make Ludics acts **first-class citizens** in the AIF graph
- Enable bidirectional sync: DialogueMove ↔ LudicAct ↔ AifNode

#### Tasks

**3.1.1 Extend AifNode Schema**
```prisma
model AifNode {
  // ... existing fields ...
  ludicActId  String?  // link to LudicAct
  ludicAct    LudicAct? @relation(...)
  
  // For locus annotation
  locusPath   String?  // e.g., "0.1.2"
  locusRole   String?  // "opener" | "responder" | "daimon"
}

model LudicAct {
  // ... existing fields ...
  aifNode     AifNode? @relation(...)
}
```

**3.1.2 Update `compileFromMoves.ts`**
- When creating acts, **also create AifNodes** (or update existing)
- Set `AifNode.nodeKind = "LUDIC_ACT"` (new enum value)
- Link `AifNode.ludicActId = act.id`
- Populate `locusPath`, `locusRole`

**3.1.3 Sync API Endpoint**
```
POST /api/ludics/sync-to-aif
  - For a deliberationId, scan LudicAct rows
  - Create/update AifNode for each act
  - Create AifEdge between acts (justifiedBy → edge)
  - Return: { nodesCreated, edgesCreated }
```

**3.1.4 Migration Script**
```bash
npx tsx scripts/migrate-ludics-to-aif.ts --deliberationId <id>
npx tsx scripts/migrate-ludics-to-aif.ts --all
```

#### DoD
- [ ] Schema migration applied
- [ ] `compileFromMoves` creates AifNodes
- [ ] Sync endpoint tested on 3 deliberations
- [ ] Migration script documented

---

### Phase 2: **UI Modernization — Integrate with Current Components** (2 weeks)

#### Goals
- Replace duplicated UI components with `@/components/ui` equivalents
- Refactor LudicsPanel into smaller, composable components
- Add Ludics awareness to command-card system

#### Tasks

**3.2.1 Component Refactor**
```
components/ludics/
  ├─ LudicsTraceViewer.tsx (replaces inline TraceRibbon usage)
  ├─ LudicsTreePanel.tsx (refactor tree section)
  ├─ LudicsCommitmentsView.tsx (replaces CommitmentsPanel inline)
  └─ LudicsActionsToolbar.tsx (compile/step/orthogonality buttons)

components/deepdive/LudicsPanel.tsx
  - Reduce to <400 lines
  - Use SectionCard, Collapsible, SWR consistently
  - Remove ChipBar/Segmented duplicates → use ui/badge, ui/tabs
```

**3.2.2 Command Card Integration**
```typescript
// lib/dialogue/ludics-commands.ts
export const ludicsCommands: CommandCardAction[] = [
  {
    id: "ludics:compile",
    label: "Compile Ludics Designs",
    icon: Layers,
    execute: async ({ deliberationId }) => {
      await fetch("/api/ludics/compile", { method: "POST", body: JSON.stringify({ deliberationId }) });
    }
  },
  {
    id: "ludics:commit-at-locus",
    label: "Commit at Locus",
    icon: Target,
    requiresTarget: true,
    execute: async ({ deliberationId, targetId, locusPath }) => {
      // Open NLCommitPopover programmatically
    }
  },
  // ... more commands
];
```

**3.2.3 Unified Status Badges**
- Add `LudicsBadge` to ArgumentCardV2 (already exists in `components/dialogue/LudicsBadge.tsx`)
- Show: orthogonality status, decisive step indicator, commitment anchors

#### DoD
- [ ] LudicsPanel <400 lines
- [ ] Command card has 5+ Ludics actions
- [ ] ArgumentCardV2 shows ludics badges
- [ ] No duplicate UI components

---

### Phase 3: **DebateSheet Integration — Overlay Ludics on Graphs** (1.5 weeks)

#### Goals
- Annotate DebateNodes with locus paths
- Visualize Ludics traces on AIF diagrams
- Enable "drill-down" from diagram to ludics details

#### Tasks

**3.3.1 Extend DebateNode Schema**
```prisma
model DebateNode {
  // ... existing fields ...
  locusPath     String?  // e.g., "0.1.2"
  ludicRole     String?  // "positive" | "negative" | "neutral"
  ludicMetaJson Json?    // { decisiveStep: boolean, orthogonal: boolean, ... }
}
```

**3.3.2 Update DebateSheet Generation**
```typescript
// scripts/generate-debate-sheets.ts
// When creating DebateNode from Argument:
//   1. Check if Argument has linked AifNode with ludicActId
//   2. If yes, fetch LudicAct → get locusPath
//   3. Set DebateNode.locusPath = act.locus.path
//   4. Set ludicRole based on act.polarity
```

**3.3.3 Diagram Overlay Component**
```tsx
// components/aif/LudicsOverlay.tsx
export function LudicsOverlay({ deliberationId, nodes }: { deliberationId: string; nodes: DebateNode[] }) {
  const { data: trace } = useSWR(`/api/ludics/orthogonal?dialogueId=${deliberationId}`, fetcher);
  
  // Render:
  //   - Highlight decisive steps (bold edges)
  //   - Show orthogonality status per node
  //   - Display convergence/divergence badges
}
```

**3.3.4 Integrate in AifDiagramViewerDagre**
```tsx
<AifDiagramViewerDagre>
  {showLudicsOverlay && <LudicsOverlay deliberationId={delibId} nodes={nodes} />}
</AifDiagramViewerDagre>
```

#### DoD
- [ ] DebateNode has locus annotations
- [ ] LudicsOverlay component renders on diagrams
- [ ] Clicking node shows ludics details (ActInspector)
- [ ] Trace ribbon syncs with diagram highlighting

---

### Phase 4: **Roadmap Alignment — Implement Missing Features** (3 weeks)

#### Goals
- Implement remaining roadmap items (Milestone A-E from `ludics_roadmap.md`)
- Focus on: additivity, delocation, uniformity, behaviors

#### Priority Tasks (from roadmap)

**A2: Directories & Additivity (local)** ✅ Partially Done
- [x] Directory persisted & exposed
- [x] `isAdditive` flag on openers
- [ ] Radio behavior in LociTree (needs UI update)
- [ ] Divergence on 2nd child tested

**A3: Daimon Hints** ✅ Done
- [x] `daimonHints[]` in StepResult
- [x] UI † chip
- [x] Tests for closed-locus suggestion

**A4: Behaviours Service** ❌ Not Started
- [ ] `/api/behaviours/:id` endpoint
- [ ] Behaviour Inspector UI (BehaviourInspectorCard exists but not wired)
- [ ] Saturation tests

**B5: Delocation Helper** ✅ Partially Done
- [x] `delocate()` helper exists
- [x] Collision detector in stepper
- [ ] UI shift buttons in Behaviour Inspector
- [ ] Re-check after shift tests

**B6: Consensus Testers** ✅ Partially Done
- [x] Tester library scaffold (`testers.ts`)
- [x] Herd-to template
- [ ] Drawer integration (attach testers UI exists but minimal)
- [ ] "Draw by consensus" label

**B7: Composition Mode** ✅ Done
- [x] Engine flag (`assoc`/`partial`/`spiritual`)
- [x] Panel toggle (in LudicsPanel)
- [x] Mode-specific tests

**C8-C9: Exponentials + Uniformity** ❌ Not Started
- [ ] Copy endpoint (with fresh children)
- [ ] Saturation tests
- [ ] Uniformity oracle (`/api/uniformity/check` exists but not fully tested)

**D10-D11: Behaviours in Product** ❌ Not Started
- [ ] Commitments as designs (data model change)
- [ ] Pairwise runner for contradictions
- [ ] Arrow inspector (optional)

#### DoD
- [ ] Roadmap status updated with completion %
- [ ] All A-milestone tasks completed
- [ ] B6-B7 fully integrated
- [ ] C8-C9 prototyped (can defer to Phase 5)

---

### Phase 5: **Documentation & Polish** (1 week)

#### Tasks

**3.5.1 Developer Docs**
```markdown
docs/ludics/
  ├─ ARCHITECTURE.md (this document, refined)
  ├─ API_REFERENCE.md (all endpoints documented)
  ├─ INTEGRATION_GUIDE.md (how to add ludics to new features)
  └─ GLOSSARY.md (ludics terms for engineers)
```

**3.5.2 Update AgoraLudics.md**
- Expand from 3 lines to full overview
- Link to roadmap, architecture doc, glossary

**3.5.3 Component Storybook**
- Add stories for: `LudicsTraceViewer`, `LudicsTreePanel`, `LudicsOverlay`

**3.5.4 Integration Tests**
```typescript
// tests/e2e/ludics-integration.spec.ts
test("Ludics compiles from dialogue moves", async () => { ... });
test("Ludics acts sync to AIF nodes", async () => { ... });
test("Diagram shows ludics overlay", async () => { ... });
```

#### DoD
- [ ] All docs written & reviewed
- [ ] Storybook stories added
- [ ] E2E tests passing
- [ ] AgoraLudics.md updated

---

## 4. Risk Mitigation

### 4.1 **Data Migration Risks**

**Risk**: Existing deliberations have LudicAct/Design data; schema changes could break.

**Mitigation**:
- Make new fields **optional** (`ludicActId?`, `locusPath?`)
- Run migration script on staging first
- Keep old compile path as fallback for 1 sprint

### 4.2 **Performance Concerns**

**Risk**: Syncing acts → AIF nodes on every compile could be slow.

**Mitigation**:
- Batch AifNode creation (use `createMany`)
- Only sync if `AifNode.ludicActId IS NULL` (incremental)
- Add index: `CREATE INDEX aifnode_ludicactid_idx ON AifNode(ludicActId)`

### 4.3 **UI Complexity**

**Risk**: Adding ludics overlays to diagrams could clutter UI.

**Mitigation**:
- Make overlays **toggleable** (checkbox in diagram controls)
- Use subtle styling (dashed edges, small badges)
- Defer full integration to Phase 3 (after core refactor)

---

## 5. Success Metrics

### 5.1 **Integration**
- ✅ 100% of LudicAct rows have corresponding AifNode
- ✅ Command card has ≥5 ludics actions
- ✅ DebateSheet diagrams show ludics traces (toggleable)

### 5.2 **Code Quality**
- ✅ LudicsPanel <400 lines (currently 1200+)
- ✅ No duplicated UI components (ChipBar, Segmented)
- ✅ All ludics packages use consistent patterns (SWR, error boundaries)

### 5.3 **Roadmap Progress**
- ✅ Milestone A: 100% complete
- ✅ Milestone B: ≥80% complete
- ⏳ Milestone C: ≥50% complete (defer full exponentials)
- ⏳ Milestone D: Prototyped (can iterate in Phase 6+)

### 5.4 **Documentation**
- ✅ 4 new docs in `docs/ludics/`
- ✅ AgoraLudics.md expanded from 3 lines to ≥50 lines
- ✅ Storybook has 5+ ludics stories

---

## 6. Next Steps (Immediate Actions)

### Week 1: Foundation
1. **Schema Design** (1 day)
   - Draft Prisma changes for AifNode.ludicActId, DebateNode.locusPath
   - Review with team
2. **Migration Script** (2 days)
   - Write `scripts/migrate-ludics-to-aif.ts`
   - Test on 3 deliberations locally
3. **Sync Endpoint** (2 days)
   - Implement `/api/ludics/sync-to-aif`
   - Wire into compile-step flow

### Week 2: UI Refactor
1. **Component Extraction** (3 days)
   - Split LudicsPanel → smaller components
   - Replace duplicated UI
2. **Command Card Integration** (2 days)
   - Add `ludics-commands.ts`
   - Wire into CommandCard

### Week 3: DebateSheet Integration
1. **Schema & Generation** (2 days)
   - Update DebateNode schema
   - Modify `generate-debate-sheets.ts`
2. **Overlay Component** (2 days)
   - Build LudicsOverlay
   - Integrate in AifDiagramViewerDagre
3. **Testing** (1 day)
   - Manual QA on 5 deliberations
   - Fix bugs

### Week 4-6: Roadmap Alignment
- Tackle remaining milestones (A2-A4, B5-B7)
- Weekly checkpoint: update roadmap status
- Adjust scope based on findings

### Week 7: Documentation & Polish
- Write docs, add tests, update AgoraLudics.md
- Team review & sign-off

---

## 7. Appendix: File Reference

### Key Files to Modify

**Schema**:
- `lib/models/schema.prisma` (AifNode, DebateNode, LudicAct)

**Core Logic**:
- `packages/ludics-engine/compileFromMoves.ts` (add AIF sync)
- `packages/ludics-engine/stepper.ts` (ensure AIF metadata in trace)

**UI**:
- `components/deepdive/LudicsPanel.tsx` (refactor)
- `components/ludics/*` (new components)
- `components/aif/LudicsOverlay.tsx` (new)

**API**:
- `app/api/ludics/sync-to-aif/route.ts` (new)
- `app/api/ludics/compile-step/route.ts` (update)

**Scripts**:
- `scripts/migrate-ludics-to-aif.ts` (new)
- `scripts/generate-debate-sheets.ts` (update)

**Docs**:
- `AgoraLudics.md` (expand)
- `docs/ludics/` (new directory)

### Dependencies to Review
- `packages/ludics-react` → ensure React 18 compat
- `packages/ludics-core` → no external deps (good)
- `useSWR` version → check if latest (currently using v2.x)

---

## Conclusion

The Ludics system is **architecturally sound** but **operationally isolated**. The modernization plan prioritizes:

1. **Integration** (Phase 1): Link to AIF graph
2. **Usability** (Phase 2): Modernize UI, add command actions
3. **Visibility** (Phase 3): Overlay on diagrams
4. **Completeness** (Phase 4): Finish roadmap features
5. **Sustainability** (Phase 5): Document for future maintainers

**Timeline**: 7 weeks (can compress to 5 if Phase 4 is scoped down).

**Outcome**: Ludics becomes a **first-class annotation layer** on the argument graph, not a parallel subsystem.
