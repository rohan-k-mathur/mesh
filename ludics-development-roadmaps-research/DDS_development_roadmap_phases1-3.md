# Development Roadmap: "Designs, disputes and strategies" Implementation
## Based on Faggian & Hyland (2002) Research Paper

---

## PART 1: CURRENT IMPLEMENTATION ANALYSIS

### 1.1 LudicsPanel Component Overview

**File**: `components/deepdive/LudicsPanel.tsx`
**Lines**: 2,036 lines
**Role**: Main orchestrator for all ludics-related UI and operations

#### Key Responsibilities:
1. Design compilation and stepping
2. Orthogonality checking
3. Trace visualization
4. NLI (Natural Language Inference) analysis
5. Stable sets computation
6. Commitment tracking
7. Scoped design management
8. Judge/referee operations

---

### 1.2 Direct Subcomponents (from ludics-react package)

Located in: `packages/ludics-react/`

#### Core Tree/Graph Components:
1. **LociTree** - Tree visualization of loci structure
   - Handles acts, polarity, expressions
   - Supports additive branch picking
   - Focus management and heatmaps
   
2. **TraceRibbon** - Linear trace visualization
   - Shows step sequence with badges
   - Displays status (CONVERGENT/DIVERGENT/ONGOING)
   - Highlights decisive indices

3. **DefenseTree** - Defense structure visualization
   - Shows design relationships
   - Highlights decisive windows

4. **ActInspector** - Detailed act examination
   - Shows pos/neg act pairs
   - Expression details

5. **CommitmentsPanel** - Commitment management per participant
   - Tracks entitled/obligated commitments
   - Per-owner (Proponent/Opponent)

6. **JudgeConsole** - Referee operations
   - Force concession
   - Close branch
   - Manual concession triggers

#### Utility Components:
7. **LociTreeWithControls** - Enhanced tree with toolbar
8. **LudicsForest** - Multi-tree forest view

---

### 1.3 Supporting Components (local)

Located in: `components/dialogue/` and `components/ludics/`

1. **narrateTrace** (`components/dialogue/narrateTrace`)
   - Converts trace to human-readable narrative
   - Generates step-by-step text

2. **mergeDesignsToTree** (`packages/ludics-react/mergeDesignsToTree`)
   - Merges multiple designs into unified tree
   - Handles P/O design fusion

3. **CommitmentDelta** (`components/dialogue/CommitmentDelta`)
   - Shows commitment changes over trace

4. **NLCommitPopover** (`components/dialogue/NLCommitPopover`)
   - Natural language commitment creation UI

5. **InsightsBadge, PolarityBadge** (`components/ludics/InsightsBadges`)
   - Visual indicators for metrics

6. **InsightsTooltip** (`components/ludics/InsightsTooltip`)
   - Hover details for complexity metrics

---

### 1.4 Core Packages

#### packages/ludics-core/

**Key Types** (`packages/ludics-core/types`):
```typescript
type StepResult = {
  pairs: Array<{ 
    posActId: string; 
    negActId: string; 
    locusPath?: string; 
    ts?: number 
  }>;
  status: 'ONGOING' | 'CONVERGENT' | 'DIVERGENT' | 'STUCK';
  endedAtDaimonForParticipantId?: string;
  endorsement?: { 
    locusPath: string; 
    byParticipantId: string; 
    viaActId: string 
  };
  decisiveIndices?: number[];
  usedAdditive?: Record<string, string>;
}
```

**VE Path Checking** (`packages/ludics-core/ve/pathCheck`):
- `isPath()` - Validates if sequence forms valid path
- `dualPath()` - Computes dual of path
- Used for reversibility checking (⊙ failures)

---

### 1.5 API Routes

All routes in `app/api/ludics/`

#### Design Operations:
1. **GET /api/ludics/designs** 
   - Fetches designs for deliberation
   - Filters by scope
   - Returns design list with acts

2. **POST /api/ludics/compile**
   - Compiles dialogue moves into designs
   - Parameters: deliberationId, scopingStrategy, forceRecompile
   - Supports scoping strategies: legacy, topic, actor-pair, argument

3. **POST /api/ludics/sync-to-aif**
   - Syncs designs to AIF (Argument Interchange Format)
   - Maintains compatibility with AF systems

#### Interaction Operations:
4. **POST /api/ludics/step**
   - Steps through design interaction
   - Parameters: dialogueId, posDesignId, negDesignId
   - Optional: testers (for IH/TC attachment)
   - Returns: StepResult with trace

5. **GET /api/ludics/orthogonal**
   - Checks orthogonality of P/O designs
   - Returns: orthogonal boolean, trace, acts
   - Can filter by phase (neutral, focus-P, focus-O)

6. **POST /api/ludics/acts**
   - Appends acts to design
   - Used for daimon appending
   - Parameters: designId, acts[], enforceAlternation

#### Analysis Operations:
7. **GET /api/ludics/insights**
   - Computes complexity metrics
   - Returns: LudicsInsights object
   - Cached with invalidation endpoint

8. **POST /api/ludics/insights/invalidate**
   - Invalidates insights cache
   - Called after design modifications

#### Judge Operations:
9. **POST /api/ludics/judge/force**
   - Referee interventions
   - Actions: FORCE_CONCESSION, CLOSE_BRANCH
   - Parameters: dialogueId, action, target, data

10. **POST /api/ludics/concession**
    - Records participant concession
    - Parameters: dialogueId, concedingParticipantId, anchorLocus, proposition

11. **POST /api/ludics/additive/pick**
    - Locks additive choice
    - Parameters: dialogueId, posDesignId, negDesignId, parentPath, childSuffix

#### Related APIs:
12. **POST /api/nli/batch**
    - Natural Language Inference analysis
    - Detects contradictions in premise/hypothesis pairs

13. **GET /api/af/stable**
    - Computes stable extensions (Abstract Argumentation)
    - Can filter by scope

14. **GET /api/works** + **GET /api/works/:id/ludics-testers**
    - Work (IH/TC) management
    - Generates tester designs from theories

---

### 1.6 Prisma Models

Located in: `prisma/schema.prisma`

#### Core Design Models:

**LudicsDesign**:
```prisma
model LudicsDesign {
  id                String              @id @default(uuid())
  deliberationId    String
  participantId     String              // "Proponent" | "Opponent"
  scope             String?             // For scoped designs
  scopeMetadata     Json?
  extJson           Json?
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  
  acts              LudicsAct[]
  loci              LudicsLocus[]
  // ... relations
}
```

**LudicsAct**:
```prisma
model LudicsAct {
  id          String        @id @default(uuid())
  designId    String
  kind        String        // "INITIAL" | "POSITIVE" | "NEGATIVE" | "DAIMON"
  polarity    String        // "P" | "O"
  expression  String?
  locusId     String?
  isAdditive  Boolean       @default(false)
  extJson     Json?
  createdAt   DateTime      @default(now())
  
  design      LudicsDesign  @relation(fields: [designId], ...)
  locus       LudicsLocus?  @relation(fields: [locusId], ...)
  // ... indices, relations
}
```

**LudicsLocus**:
```prisma
model LudicsLocus {
  id          String        @id @default(uuid())
  designId    String
  path        String        // "0", "0.1", "0.1.2", etc.
  extJson     Json?
  createdAt   DateTime      @default(now())
  
  design      LudicsDesign  @relation(fields: [designId], ...)
  acts        LudicsAct[]
  // ... indices
}
```

#### Trace/Run Models:

**LudicsRun** (stores StepResult):
```prisma
model LudicsRun {
  id                              String    @id @default(uuid())
  dialogueId                      String
  posDesignId                     String?
  negDesignId                     String?
  status                          String    // ONGOING | CONVERGENT | DIVERGENT | STUCK
  endedAtDaimonForParticipantId   String?
  extJson                         Json?     // Contains: pairs, decisiveIndices, etc.
  createdAt                       DateTime  @default(now())
  updatedAt                       DateTime  @updatedAt
  // ... indices
}
```

#### Commitment Models:

**CommitmentStore**:
```prisma
model CommitmentStore {
  id              String              @id @default(uuid())
  dialogueId      String
  ownerId         String              // Participant owning the store
  extJson         Json?
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt
  
  commitments     Commitment[]
  // ... relations
}
```

**Commitment**:
```prisma
model Commitment {
  id              String              @id @default(uuid())
  storeId         String
  label           String
  basePolarity    String              // pos | neg
  baseLocusPath   String
  entitled        Boolean             @default(false)
  extJson         Json?
  createdAt       DateTime            @default(now())
  
  store           CommitmentStore     @relation(fields: [storeId], ...)
  // ... indices
}
```

---

### 1.7 LudicsForest Component (Advanced Visualization)

**File**: `components/ludics/LudicsForest.tsx`
**Lines**: 463 lines
**Role**: Multi-scope design visualization orchestrator

#### Key Features:

**View Modes**:
1. **Forest View** - Shows all designs independently (grouped by scope)
   - Paginated scope display (20 scopes per page)
   - Cross-scope reference tracking
   - Metadata display per scope
   
2. **Split-Screen View** - Proponent vs Opponent side-by-side
   - Dual perspective visualization
   - Synchronized highlighting
   
3. **Merged View** - Legacy unified tree (backward compat)
   - Uses LociTreeWithControls
   - Combines P/O designs into single tree

**Scoping Strategy Support**:
- Legacy (monolithic)
- Topic-based (recommended)
- Actor-pair
- Argument-thread (fine-grained)

**Performance Optimizations**:
- Batch semantic data fetching (`/api/ludics/designs/semantic/batch`)
- Paginated scope rendering
- Pre-enriched design data to avoid redundant fetches
- Selective SWR revalidation

**Metadata Tracking**:
- Move counts per scope
- Actor counts (proponent/opponent)
- Cross-scope references with visual indicators
- Referenced scopes display

#### Subcomponents:

**DesignTreeView** (`components/ludics/DesignTreeView.tsx`):
- Single design visualization
- Three view modes:
  - **Tree**: Ludics tree structure (via LociTree)
  - **Scheme**: Argument schemes view (ArgumentSchemeView)
  - **Both**: Side-by-side synchronized display
- Semantic annotation support
- Step index highlighting
- Trace integration

**buildTreeFromDesign** (`components/ludics/buildTreeFromDesign.ts`):
- Converts single design → LociNode tree
- Preserves semantic annotations
- Polarity assignment per participant
- Handles daimon (†) acts
- Ensures proper locus hierarchy

**ArgumentSchemeView** (`components/ludics/ArgumentSchemeView.tsx`):
- Displays argument schemes per design
- Shows premises/conclusions
- Scheme classification
- Participant-specific rendering

#### API Integration:

**Design Fetching**:
- `GET /api/ludics/designs?deliberationId=...`
  - Returns: designs[], grouped{}, scopes[], scopeMetadata{}
  
**Semantic Enrichment**:
- `POST /api/ludics/designs/semantic/batch`
  - Input: { designIds: string[] }
  - Returns: { ok: boolean, designs: Record<id, enrichedDesign> }
  
**Compilation**:
- `POST /api/ludics/compile`
  - Input: { deliberationId, scopingStrategy, forceRecompile }
  - Triggers full recompilation with selected strategy

**Trace Fetching**:
- `GET /api/ludics/step?deliberationId=...&phase=neutral&maxPairs=1024`
  - Returns trace for visualization

#### Data Flow:
```
User selects scoping strategy
  ↓
Click "Recompile"
  ↓
POST /api/ludics/compile { scopingStrategy }
  ↓
GET /api/ludics/designs (with grouped/scopes/metadata)
  ↓
LudicsForest renders paginated scopes
  ↓
Batch fetch semantics for visible designs
  ↓
POST /api/ludics/designs/semantic/batch
  ↓
DesignTreeView renders each design
  ↓
buildTreeFromDesign → LociTree OR ArgumentSchemeView
```

#### Key Observations:

**Alignment with Paper**:
- ✅ **Forest view = Strategy collection view**
  - Each design shown independently (not merged)
  - Aligns with "designs as independent strategies"
  
- ✅ **Scope grouping = Localized arenas**
  - Each scope is essentially an atomic arena
  - Cross-scope references tracked
  
- ❌ **Still missing**:
  - No dispute visualization per design
  - No view extraction per design
  - No innocence checking per design
  - No propagation validation per design

**Strengths**:
1. Proper separation of P/O designs (no forced merging)
2. Scoped design support (Phase 4 integration)
3. Semantic enrichment pipeline
4. Performance-optimized batch fetching
5. Multiple visualization perspectives

**Gaps**:
1. No dispute-based representation option
2. No view-stable strategy display
3. No chronicle extraction visualization
4. No strategy saturation indicators
5. No orthogonality testing per scope-pair

---

### 1.8 Current Architecture Summary

**Data Flow**:
```
Dialogue Moves (DB)
  ↓
  POST /api/ludics/compile (with scopingStrategy)
  ↓
LudicsDesign + LudicsAct + LudicsLocus (DB)
  ↓
  GET /api/ludics/designs (grouped by scope)
  ↓
LudicsPanel OR LudicsForest (React State)
  ↓
  POST /api/ludics/step (per scope pair)
  ↓
StepResult / LudicsRun (DB)
  ↓
TraceRibbon, LociTree, DesignTreeView (Visualization)
```

**View Hierarchy**:
```
LudicsPanel (main orchestrator)
  ├── LudicsForest (multi-design view)
  │   ├── DesignTreeView (per design)
  │   │   ├── LociTree (tree viz)
  │   │   └── ArgumentSchemeView (scheme viz)
  │   └── LociTreeWithControls (legacy merged)
  ├── TraceRibbon (interaction trace)
  ├── DefenseTree (defense structure)
  ├── CommitmentsPanel (commitments)
  └── JudgeConsole (referee tools)
```

**Current Computational Model**:
- **Design-centric**: Primary representation is tree of acts at loci
- **Stepping**: Pairwise interaction via step API
- **Traces**: Generated as side-effect, stored in LudicsRun.extJson
- **Orthogonality**: Computed via full stepping algorithm
- **Scoping**: Multiple independent arenas per deliberation
- **No explicit disputes/strategies**: Concepts embedded implicitly

**Forest View Innovation**:
- ✅ **Treats designs as independent entities** (aligns with paper)
- ✅ **Scope-based isolation** (atomic arenas)
- ✅ **Cross-scope reference tracking** (shows interactions between scopes)
- ❌ **Still operational rather than declarative** (no strategy validation)

---

### 1.9 Key Observations

#### Strengths:
1. ✅ Solid design/act/locus data model
2. ✅ Working step engine (produces traces)
3. ✅ Scoped design support (Phase 4 integration)
4. ✅ Visualization components (trees, ribbons)
5. ✅ Commitment tracking
6. ✅ Judge/referee tools
7. ✅ NLI integration
8. ✅ AF stable sets integration

#### Gaps (relative to paper):
1. ❌ No explicit **disputes** as first-class entities
2. ❌ No **views** computation/extraction
3. ❌ No **chronicles** as separate from traces
4. ❌ No **strategies** representation
5. ❌ No **innocent strategy** checking
6. ❌ No **propagation** validation
7. ❌ No **pull-back** construction
8. ❌ No **Views(S)** / **Plays(V)** operations
9. ❌ No **arena** abstraction
10. ❌ No player-based analysis (P/O split implicit)

#### Conceptual Gaps:
- Current: "Design → Step → Trace"
- Paper: "Design ↔ Strategy ↔ Disputes ↔ Views ↔ Chronicles"
- Missing: Dual representation, view extraction, strategy saturation

---

## PART 2: PHASE-BY-PHASE IMPLEMENTATION ROADMAP

This roadmap implements the theoretical foundations from the Faggian & Hyland paper
progressively, building from core abstractions to advanced features while maintaining
backward compatibility with the current system.

---

## PHASE 1: Core Abstractions (Views, Chronicles, Legal Positions)

**Duration**: 2-3 weeks
**Goal**: Establish foundational types and operations for the dual representation

### 1.1 Database Schema Extensions

**New Models**:

```prisma
// LudicsView - First-class view representation
model LudicsView {
  id              String        @id @default(uuid())
  designId        String
  player          String        // "P" | "O"
  viewSequence    Json          // Array of actions in view
  parentDisputeId String?       // Optional link to dispute
  extJson         Json?
  createdAt       DateTime      @default(now())
  
  design          LudicsDesign  @relation(fields: [designId], ...)
  parentDispute   LudicsDispute? @relation(fields: [parentDisputeId], ...)
  
  @@index([designId, player])
  @@index([parentDisputeId])
}

// LudicsChronicle - Explicit chronicle (branch) representation
model LudicsChronicle {
  id              String        @id @default(uuid())
  designId        String
  actionSequence  Json          // Ordered list of action IDs
  polarity        String        // Starting polarity
  isPositive      Boolean       // Ends on positive action?
  extJson         Json?
  createdAt       DateTime      @default(now())
  
  design          LudicsDesign  @relation(fields: [designId], ...)
  
  @@index([designId])
}

// LudicsDispute - First-class dispute representation
model LudicsDispute {
  id              String          @id @default(uuid())
  dialogueId      String
  posDesignId     String
  negDesignId     String
  actionPairs     Json            // Array of {posActId, negActId, locusPath}
  status          String          // ONGOING | CONVERGENT | DIVERGENT | STUCK
  length          Int             @default(0)
  isLegal         Boolean?        // Cached legality check
  extJson         Json?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  
  posDesign       LudicsDesign    @relation("PositiveDisputes", fields: [posDesignId], ...)
  negDesign       LudicsDesign    @relation("NegativeDisputes", fields: [negDesignId], ...)
  views           LudicsView[]
  
  @@index([dialogueId])
  @@index([posDesignId, negDesignId])
}

// LudicsPosition - Legal position validation
model LudicsPosition {
  id              String        @id @default(uuid())
  disputeId       String?
  sequence        Json          // Ordered action sequence
  isLinear        Boolean       @default(true)
  isLegal         Boolean       @default(false)
  player          String        // "P" | "O"
  validationLog   Json?         // Details of validation checks
  extJson         Json?
  createdAt       DateTime      @default(now())
  
  dispute         LudicsDispute? @relation(fields: [disputeId], ...)
  
  @@index([disputeId])
  @@index([isLegal])
}
```

**Extend Existing Models**:

```prisma
// Add to LudicsDesign
model LudicsDesign {
  // ... existing fields ...
  
  // New relations for dual representation
  chronicles      LudicsChronicle[]
  views           LudicsView[]
  positiveDisputes LudicsDispute[] @relation("PositiveDisputes")
  negativeDisputes LudicsDispute[] @relation("NegativeDisputes")
}

// Add to LudicsRun (extend with dispute reference)
model LudicsRun {
  // ... existing fields ...
  
  // Link to first-class dispute
  disputeId       String?       @unique
  dispute         LudicsDispute? @relation(fields: [disputeId], ...)
}
```

### 1.2 Core Type Definitions

**New TypeScript Types** (`packages/ludics-core/types.ts`):

```typescript
// Action representation (already exists, enhance)
export type Action = {
  focus: string;           // Address (locus path)
  ramification: number[];  // Indices of sub-addresses
  polarity: 'P' | 'O';
  actId?: string;          // Link to LudicsAct
};

// View - projection of play for a player
export type View = {
  id: string;
  player: 'P' | 'O';
  sequence: Action[];      // Actions visible to this player
  designId: string;
  parentDisputeId?: string;
};

// Chronicle - branch in design tree
export type Chronicle = {
  id: string;
  designId: string;
  actions: Action[];       // Ordered sequence
  polarity: 'P' | 'O';     // Starting polarity
  isPositive: boolean;     // Ends with positive action
};

// Position - sequence of actions in interaction
export type Position = {
  id: string;
  sequence: Action[];
  player: 'P' | 'O';       // Whose turn is next
  isLinear: boolean;       // No address appears twice
  isLegal: boolean;        // Satisfies visibility condition
  disputeId?: string;
};

// Dispute - interaction trace between designs
export type Dispute = {
  id: string;
  dialogueId: string;
  posDesignId: string;
  negDesignId: string;
  pairs: Array<{
    posActId: string;
    negActId: string;
    locusPath: string;
    ts?: number;
  }>;
  status: 'ONGOING' | 'CONVERGENT' | 'DIVERGENT' | 'STUCK';
  length: number;
  isLegal?: boolean;
};

// Legal position validation result
export type LegalityCheck = {
  isLinear: boolean;
  isParity: boolean;        // Parity alternates
  isJustified: boolean;     // Each move justified
  isVisible: boolean;       // Justifier in view
  errors: string[];
};
```

### 1.3 Core Operations

**View Extraction** (`packages/ludics-core/views.ts`):

```typescript
import type { Action, Position, View } from './types';

/**
 * Extract view for player X from position
 * Definition 3.5 from paper
 */
export function extractView(
  position: Position,
  player: 'P' | 'O'
): Action[] {
  const view: Action[] = [];
  
  for (const action of position.sequence) {
    if (action.polarity === player) {
      // Positive move: keep from other player's view + this move
      view.push(action);
    } else {
      // Negative move
      if (view.length === 0 || isInitial(action)) {
        // Initial negative move: just the move
        view.length = 0;
        view.push(action);
      } else {
        // Non-initial negative: justifier + this move
        const justifier = findJustifier(action, view);
        if (justifier) {
          view.length = 0;
          view.push(justifier);
          view.push(action);
        }
      }
    }
  }
  
  return view;
}

/**
 * Check if action is initial (not justified)
 */
function isInitial(action: Action): boolean {
  return action.focus === '0' || action.focus === '<>';
}

/**
 * Find justifier for an action in view
 */
function findJustifier(action: Action, view: Action[]): Action | null {
  // Action (ξi, J) is justified by (ξ, I) if i ∈ I
  const focusParts = action.focus.split('.');
  if (focusParts.length <= 1) return null;
  
  const parentFocus = focusParts.slice(0, -1).join('.');
  const childIndex = parseInt(focusParts[focusParts.length - 1], 10);
  
  // Find action with matching parent focus that includes child index
  for (let i = view.length - 1; i >= 0; i--) {
    const candidate = view[i];
    if (candidate.focus === parentFocus && 
        candidate.ramification.includes(childIndex)) {
      return candidate;
    }
  }
  
  return null;
}

/**
 * Extract proponent view from position
 */
export function extractProponentView(position: Position): Action[] {
  return extractView(position, 'P');
}

/**
 * Extract opponent view from position
 */
export function extractOpponentView(position: Position): Action[] {
  return extractView(position, 'O');
}
```

**Chronicle Extraction** (`packages/ludics-core/chronicles.ts`):

```typescript
import type { Action, Position, Chronicle, Dispute } from './types';
import { extractView } from './views';

/**
 * Extract chronicles from dispute (Proposition 3.6)
 * View extracts the identifying chronicle for each action
 */
export function extractChronicles(
  dispute: Dispute,
  player: 'P' | 'O'
): Chronicle[] {
  const chronicles: Chronicle[] = [];
  
  // Convert dispute to position
  const position: Position = disputeToPosition(dispute);
  
  // For each prefix of the position, extract the view
  for (let i = 0; i < position.sequence.length; i++) {
    const prefix: Position = {
      ...position,
      sequence: position.sequence.slice(0, i + 1)
    };
    
    const view = extractView(prefix, player);
    
    // View is a chronicle
    if (view.length > 0) {
      chronicles.push({
        id: `chronicle-${i}`,
        designId: player === 'P' ? dispute.posDesignId : dispute.negDesignId,
        actions: view,
        polarity: player,
        isPositive: view[view.length - 1].polarity === player
      });
    }
  }
  
  return chronicles;
}

/**
 * Convert dispute to position
 */
function disputeToPosition(dispute: Dispute): Position {
  const sequence: Action[] = [];
  
  // Convert pairs to action sequence
  for (const pair of dispute.pairs) {
    // Add positive action
    sequence.push({
      focus: pair.locusPath,
      ramification: [], // Will be filled from act data
      polarity: 'P',
      actId: pair.posActId
    });
    
    // Add negative action
    sequence.push({
      focus: pair.locusPath,
      ramification: [],
      polarity: 'O',
      actId: pair.negActId
    });
  }
  
  return {
    id: dispute.id,
    sequence,
    player: sequence.length % 2 === 0 ? 'O' : 'P',
    isLinear: true, // Will be validated
    isLegal: true,  // Will be validated
    disputeId: dispute.id
  };
}
```

**Legal Position Validation** (`packages/ludics-core/legality.ts`):

```typescript
import type { Position, Action, LegalityCheck } from './types';
import { extractView } from './views';

/**
 * Validate if position is legal (Definition 3.7)
 */
export function validateLegality(position: Position): LegalityCheck {
  const errors: string[] = [];
  
  // Check linearity: each address appears at most once
  const isLinear = checkLinearity(position, errors);
  
  // Check parity: polarity alternates
  const isParity = checkParity(position, errors);
  
  // Check justification: each move is justified
  const isJustified = checkJustification(position, errors);
  
  // Check visibility: justifier occurs in view
  const isVisible = checkVisibility(position, errors);
  
  return {
    isLinear,
    isParity,
    isJustified,
    isVisible,
    errors
  };
}

/**
 * Check linearity: no address appears twice
 */
function checkLinearity(position: Position, errors: string[]): boolean {
  const seen = new Set<string>();
  
  for (const action of position.sequence) {
    if (seen.has(action.focus)) {
      errors.push(`Address ${action.focus} appears multiple times`);
      return false;
    }
    seen.add(action.focus);
  }
  
  return true;
}

/**
 * Check parity alternation
 */
function checkParity(position: Position, errors: string[]): boolean {
  for (let i = 1; i < position.sequence.length; i++) {
    const prev = position.sequence[i - 1];
    const curr = position.sequence[i];
    
    if (prev.polarity === curr.polarity) {
      errors.push(`Parity not alternating at index ${i}`);
      return false;
    }
  }
  
  return true;
}

/**
 * Check justification: each non-initial move is justified
 */
function checkJustification(position: Position, errors: string[]): boolean {
  for (let i = 0; i < position.sequence.length; i++) {
    const action = position.sequence[i];
    
    if (action.focus === '0' || action.focus === '<>') {
      continue; // Initial move, no justification needed
    }
    
    // Find justifier
    const focusParts = action.focus.split('.');
    const parentFocus = focusParts.slice(0, -1).join('.');
    const childIndex = parseInt(focusParts[focusParts.length - 1], 10);
    
    let justified = false;
    for (let j = 0; j < i; j++) {
      const candidate = position.sequence[j];
      if (candidate.focus === parentFocus && 
          candidate.ramification.includes(childIndex)) {
        justified = true;
        break;
      }
    }
    
    if (!justified) {
      errors.push(`Action at ${action.focus} not justified`);
      return false;
    }
  }
  
  return true;
}

/**
 * Check visibility: justifier occurs in player's view
 */
function checkVisibility(position: Position, errors: string[]): boolean {
  for (let i = 0; i < position.sequence.length; i++) {
    const action = position.sequence[i];
    
    if (action.focus === '0' || action.focus === '<>') {
      continue; // Initial move
    }
    
    // Get view up to this action
    const prefix: Position = {
      ...position,
      sequence: position.sequence.slice(0, i)
    };
    
    const view = extractView(prefix, action.polarity);
    
    // Check if justifier is in view
    const focusParts = action.focus.split('.');
    const parentFocus = focusParts.slice(0, -1).join('.');
    const childIndex = parseInt(focusParts[focusParts.length - 1], 10);
    
    let inView = false;
    for (const viewAction of view) {
      if (viewAction.focus === parentFocus && 
          viewAction.ramification.includes(childIndex)) {
        inView = true;
        break;
      }
    }
    
    if (!inView) {
      errors.push(`Justifier for ${action.focus} not in view`);
      return false;
    }
  }
  
  return true;
}
```

### 1.4 API Endpoints

**View Extraction API** (`app/api/ludics/views/extract/route.ts`):

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractView, extractProponentView, extractOpponentView } from '@/packages/ludics-core/views';

export async function POST(req: NextRequest) {
  try {
    const { disputeId, player } = await req.json();
    
    // Fetch dispute
    const dispute = await prisma.ludicsDispute.findUnique({
      where: { id: disputeId },
      include: {
        posDesign: { include: { acts: true } },
        negDesign: { include: { acts: true } }
      }
    });
    
    if (!dispute) {
      return NextResponse.json({ ok: false, error: 'Dispute not found' }, { status: 404 });
    }
    
    // Convert to position and extract view
    const position = disputeToPosition(dispute);
    const view = player === 'P' 
      ? extractProponentView(position)
      : extractOpponentView(position);
    
    // Store view in database
    const savedView = await prisma.ludicsView.create({
      data: {
        designId: player === 'P' ? dispute.posDesignId : dispute.negDesignId,
        player,
        viewSequence: view,
        parentDisputeId: disputeId
      }
    });
    
    return NextResponse.json({ 
      ok: true, 
      view: savedView,
      sequence: view 
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
```

**Legal Position Validation API** (`app/api/ludics/positions/validate/route.ts`):

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { validateLegality } from '@/packages/ludics-core/legality';
import type { Position } from '@/packages/ludics-core/types';

export async function POST(req: NextRequest) {
  try {
    const { position } = await req.json() as { position: Position };
    
    // Validate legality
    const check = validateLegality(position);
    
    // Store position if legal
    if (check.isLinear && check.isParity && check.isJustified && check.isVisible) {
      const saved = await prisma.ludicsPosition.create({
        data: {
          disputeId: position.disputeId,
          sequence: position.sequence,
          isLinear: check.isLinear,
          isLegal: true,
          player: position.player,
          validationLog: check
        }
      });
      
      return NextResponse.json({ 
        ok: true, 
        isLegal: true,
        position: saved,
        check 
      });
    }
    
    return NextResponse.json({ 
      ok: true, 
      isLegal: false,
      check 
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
```

**Chronicle Extraction API** (`app/api/ludics/chronicles/extract/route.ts`):

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { extractChronicles } from '@/packages/ludics-core/chronicles';

export async function POST(req: NextRequest) {
  try {
    const { disputeId, player } = await req.json();
    
    // Fetch dispute
    const dispute = await prisma.ludicsDispute.findUnique({
      where: { id: disputeId }
    });
    
    if (!dispute) {
      return NextResponse.json({ ok: false, error: 'Dispute not found' }, { status: 404 });
    }
    
    // Extract chronicles
    const chronicles = extractChronicles(dispute, player);
    
    // Store chronicles
    const saved = await Promise.all(
      chronicles.map(c => 
        prisma.ludicsChronicle.create({
          data: {
            designId: c.designId,
            actionSequence: c.actions.map(a => a.actId).filter(Boolean),
            polarity: c.polarity,
            isPositive: c.isPositive
          }
        })
      )
    );
    
    return NextResponse.json({ 
      ok: true, 
      chronicles: saved,
      count: saved.length 
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
```

### 1.5 React Components

**ViewInspector Component** (`components/ludics/ViewInspector.tsx`):

```tsx
'use client';

import * as React from 'react';
import type { View, Action } from '@/packages/ludics-core/types';

export function ViewInspector({
  view,
  player
}: {
  view: View;
  player: 'P' | 'O';
}) {
  return (
    <div className="view-inspector border rounded-lg p-3 bg-white/70">
      <div className="flex items-center gap-2 mb-2">
        <span className={`px-2 py-1 rounded font-bold ${
          player === 'P' ? 'bg-sky-100 text-sky-700' : 'bg-rose-100 text-rose-700'
        }`}>
          {player} View
        </span>
        <span className="text-xs text-slate-600">
          {view.sequence.length} actions visible
        </span>
      </div>
      
      <div className="space-y-1">
        {view.sequence.map((action, idx) => (
          <div key={idx} className="text-xs font-mono bg-slate-50 p-2 rounded">
            <span className={action.polarity === 'P' ? 'text-sky-600' : 'text-rose-600'}>
              {action.polarity}
            </span>
            {' @ '}
            <code className="text-slate-700">{action.focus}</code>
            {' → ['}
            {action.ramification.join(', ')}
            {']'}
          </div>
        ))}
      </div>
    </div>
  );
}
```

**LegalityBadge Component** (`components/ludics/LegalityBadge.tsx`):

```tsx
'use client';

import * as React from 'react';
import type { LegalityCheck } from '@/packages/ludics-core/types';

export function LegalityBadge({
  check
}: {
  check: LegalityCheck;
}) {
  const isLegal = check.isLinear && check.isParity && 
                  check.isJustified && check.isVisible;
  
  return (
    <div className="legality-badge">
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
        isLegal 
          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
          : 'bg-rose-100 text-rose-700 border border-rose-200'
      }`}>
        {isLegal ? '✓ Legal Position' : '✗ Illegal Position'}
      </div>
      
      {!isLegal && check.errors.length > 0 && (
        <div className="mt-1 text-xs text-rose-600">
          {check.errors.map((err, i) => (
            <div key={i}>• {err}</div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 1.6 Integration Points

**Extend LudicsPanel**:
- Add "View Inspector" toggle button
- Show P/O views side-by-side when hovering over trace steps
- Display legality badges on TraceRibbon

**Extend DesignTreeView**:
- Add "Chronicles" tab to show all chronicles in design
- Visualize chronicle extraction from disputes

**Extend TraceRibbon**:
- Show view at each step (tooltip or inline)
- Add legality indicator per step

### 1.7 Testing Strategy

**Unit Tests** (`packages/ludics-core/__tests__/`):
- `views.test.ts` - View extraction edge cases
- `chronicles.test.ts` - Chronicle extraction accuracy
- `legality.test.ts` - Legal position validation

**Integration Tests**:
- API endpoint tests for view/chronicle extraction
- Database consistency checks

**Example Test**:
```typescript
describe('View Extraction', () => {
  it('should extract proponent view correctly', () => {
    const position: Position = {
      id: 'test',
      sequence: [
        { focus: '0', ramification: [1, 2], polarity: 'P' },
        { focus: '0.1', ramification: [], polarity: 'O' },
        { focus: '0.1.1', ramification: [], polarity: 'P' }
      ],
      player: 'O',
      isLinear: true,
      isLegal: true
    };
    
    const view = extractProponentView(position);
    
    expect(view).toHaveLength(2);
    expect(view[0].focus).toBe('0');
    expect(view[1].focus).toBe('0.1.1');
  });
});
```

### 1.8 Phase 1 Deliverables

✅ Database schema with View, Chronicle, Dispute, Position models
✅ Core algorithms: extractView, extractChronicles, validateLegality
✅ API endpoints for view/chronicle extraction and validation
✅ React components: ViewInspector, LegalityBadge
✅ Integration with existing LudicsPanel and TraceRibbon
✅ Comprehensive test suite

### 1.9 Phase 1 Success Metrics

- View extraction works for all existing traces
- Legal position validation catches known invalid sequences
- Chronicle extraction produces correct design branches
- UI displays views alongside traditional trace view
- Performance: view extraction < 100ms for traces up to 100 steps

---

## PHASE 2: Strategy Layer (Strategies, Innocence, Propagation)

**Duration**: 3-4 weeks
**Goal**: Implement innocent strategies and establish design ↔ strategy correspondence

### 2.1 Database Schema Extensions

**New Models**:

```prisma
// LudicsStrategy - First-class strategy representation
model LudicsStrategy {
  id              String              @id @default(uuid())
  designId        String
  player          String              // "P" | "O"
  isInnocent      Boolean             @default(false)
  satisfiesPropagation Boolean        @default(false)
  playCount       Int                 @default(0)
  extJson         Json?               // Stores: determinism map, saturation info
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt
  
  design          LudicsDesign        @relation(fields: [designId], ...)
  plays           LudicsPlay[]
  viewCache       LudicsStrategyView[]
  
  @@unique([designId, player])
  @@index([isInnocent, satisfiesPropagation])
}

// LudicsPlay - Individual play in a strategy
model LudicsPlay {
  id              String              @id @default(uuid())
  strategyId      String
  sequence        Json                // Array of actions
  length          Int                 @default(0)
  isPositive      Boolean             // Ends on positive action
  viewId          String?             // Cached view
  extJson         Json?
  createdAt       DateTime            @default(now())
  
  strategy        LudicsStrategy      @relation(fields: [strategyId], ...)
  view            LudicsStrategyView? @relation(fields: [viewId], ...)
  
  @@index([strategyId])
  @@index([isPositive])
}

// LudicsStrategyView - Views in strategy (view-stable check)
model LudicsStrategyView {
  id              String              @id @default(uuid())
  strategyId      String
  viewSequence    Json                // Array of actions
  determinedMove  Json?               // Next move determined by this view
  playCount       Int                 @default(0) // How many plays have this view
  extJson         Json?
  createdAt       DateTime            @default(now())
  
  strategy        LudicsStrategy      @relation(fields: [strategyId], ...)
  plays           LudicsPlay[]
  
  @@index([strategyId])
}

// LudicsInnocenceCheck - Cached innocence validation
model LudicsInnocenceCheck {
  id              String              @id @default(uuid())
  strategyId      String              @unique
  isInnocent      Boolean
  isDeterministic Boolean
  isViewStable    Boolean
  violationLog    Json?               // Details of violations if not innocent
  checkedAt       DateTime            @default(now())
  
  strategy        LudicsStrategy      @relation(fields: [strategyId], ...)
  
  @@index([isInnocent])
}

// LudicsPropagationCheck - Cached propagation validation
model LudicsPropagationCheck {
  id              String              @id @default(uuid())
  strategyId      String              @unique
  satisfiesProp   Boolean
  violations      Json?               // Details of propagation failures
  checkedAt       DateTime            @default(now())
  
  strategy        LudicsStrategy      @relation(fields: [strategyId], ...)
  
  @@index([satisfiesProp])
}
```

**Extend Existing Models**:

```prisma
// Add to LudicsDesign
model LudicsDesign {
  // ... existing fields ...
  
  // Strategy relation
  strategies      LudicsStrategy[]
}
```

### 2.2 Core Type Definitions

**Strategy Types** (`packages/ludics-core/strategies.ts`):

```typescript
import type { Action, Position, View } from './types';

// Strategy - collection of plays
export type Strategy = {
  id: string;
  designId: string;
  player: 'P' | 'O';
  plays: Play[];
  isInnocent: boolean;
  satisfiesPropagation: boolean;
};

// Play - sequence of actions in strategy
export type Play = {
  id: string;
  strategyId: string;
  sequence: Action[];
  length: number;
  isPositive: boolean;
  view?: View;
};

// Determinism check result
export type DeterminismCheck = {
  isDeterministic: boolean;
  violations: Array<{
    view: Action[];
    responses: Action[]; // Multiple responses to same view
  }>;
};

// Innocence check result
export type InnocenceCheck = {
  isInnocent: boolean;
  isDeterministic: boolean;
  isViewStable: boolean;
  violations: Array<{
    type: 'determinism' | 'view-stability' | 'saturation';
    details: string;
  }>;
};

// Propagation check result
export type PropagationCheck = {
  satisfiesPropagation: boolean;
  violations: Array<{
    views: [Action[], Action[]]; // Two views with same prefix
    issue: string; // Description of propagation failure
  }>;
};

// Views(S) operation result
export type ViewsResult = {
  strategyId: string;
  views: View[];
  isStable: boolean; // All views have p̄ = p
};

// Plays(V) operation result
export type PlaysResult = {
  plays: Play[];
  isSmallest: boolean; // Smallest innocent strategy containing V
};
```

### 2.3 Core Operations

**Strategy Construction** (`packages/ludics-core/strategy/construct.ts`):

```typescript
import type { Design, Strategy, Play } from '../types';
import { extractView } from '../views';
import { disputeToPosition } from '../chronicles';

/**
 * Construct strategy from design (Disp(D))
 * All disputes of design with orthogonal counter-designs
 */
export async function constructStrategy(
  design: Design,
  counterDesigns: Design[]
): Promise<Strategy> {
  const plays: Play[] = [];
  
  // Generate all disputes with counter-designs
  for (const counter of counterDesigns) {
    // Step through interaction
    const dispute = await stepDesigns(design, counter);
    
    // Convert to play
    const position = disputeToPosition(dispute);
    const play: Play = {
      id: `play-${plays.length}`,
      strategyId: design.id,
      sequence: position.sequence,
      length: position.sequence.length,
      isPositive: position.sequence.length > 0 && 
                  position.sequence[position.sequence.length - 1].polarity === design.participantId
    };
    
    plays.push(play);
  }
  
  return {
    id: design.id,
    designId: design.id,
    player: design.participantId === 'Proponent' ? 'P' : 'O',
    plays,
    isInnocent: false, // Will be checked
    satisfiesPropagation: false // Will be checked
  };
}

/**
 * Step through design interaction (simplified - actual impl uses step API)
 */
async function stepDesigns(pos: Design, neg: Design): Promise<Dispute> {
  // This would call the actual step API
  // Placeholder for structure
  return {
    id: `dispute-${pos.id}-${neg.id}`,
    dialogueId: pos.deliberationId,
    posDesignId: pos.id,
    negDesignId: neg.id,
    pairs: [],
    status: 'ONGOING',
    length: 0
  };
}
```

**Innocence Checking** (`packages/ludics-core/strategy/innocence.ts`):

```typescript
import type { Strategy, Play, InnocenceCheck, Action } from '../types';
import { extractView } from '../views';

/**
 * Check if strategy is innocent (Definition 4.8)
 * Innocent if: same view → same response
 */
export function checkInnocence(strategy: Strategy): InnocenceCheck {
  const violations: InnocenceCheck['violations'] = [];
  
  // First check determinism
  const detCheck = checkDeterminism(strategy);
  if (!detCheck.isDeterministic) {
    violations.push({
      type: 'determinism',
      details: `Found ${detCheck.violations.length} determinism violations`
    });
  }
  
  // Check view stability (Views(S) ⊆ S)
  const viewStable = checkViewStability(strategy);
  if (!viewStable) {
    violations.push({
      type: 'view-stability',
      details: 'Strategy contains plays not in Views(S)'
    });
  }
  
  // If deterministic and view-stable, check full innocence condition
  let isInnocent = detCheck.isDeterministic && viewStable;
  
  if (isInnocent) {
    // Check: sab+ ∈ S†, p+ ∈ S†, pa legal, p̄a = s̄a ⟹ pab ∈ S†
    isInnocent = checkInnocenceCondition(strategy);
    if (!isInnocent) {
      violations.push({
        type: 'saturation',
        details: 'Strategy not saturated (missing view-compatible plays)'
      });
    }
  }
  
  return {
    isInnocent,
    isDeterministic: detCheck.isDeterministic,
    isViewStable: viewStable,
    violations
  };
}

/**
 * Check determinism: s̄b, s̄c ∈ S† ⟹ b = c
 */
function checkDeterminism(strategy: Strategy): {
  isDeterministic: boolean;
  violations: Array<{ view: Action[]; responses: Action[] }>;
} {
  const violations: Array<{ view: Action[]; responses: Action[] }> = [];
  
  // Build map: view → set of next moves
  const viewToResponses = new Map<string, Set<string>>();
  
  for (const play of strategy.plays) {
    if (play.sequence.length < 2) continue;
    
    // For each prefix
    for (let i = 0; i < play.sequence.length - 1; i++) {
      const prefix = play.sequence.slice(0, i + 1);
      const nextMove = play.sequence[i + 1];
      
      // Extract view
      const view = extractView(
        { sequence: prefix, player: strategy.player } as any,
        strategy.player
      );
      
      const viewKey = JSON.stringify(view);
      const moveKey = JSON.stringify(nextMove);
      
      if (!viewToResponses.has(viewKey)) {
        viewToResponses.set(viewKey, new Set());
      }
      viewToResponses.get(viewKey)!.add(moveKey);
    }
  }
  
  // Check for multiple responses to same view
  for (const [viewKey, responses] of viewToResponses.entries()) {
    if (responses.size > 1) {
      violations.push({
        view: JSON.parse(viewKey),
        responses: Array.from(responses).map(r => JSON.parse(r))
      });
    }
  }
  
  return {
    isDeterministic: violations.length === 0,
    violations
  };
}

/**
 * Check if Views(S) ⊆ S (view stability)
 */
function checkViewStability(strategy: Strategy): boolean {
  // Extract all views from plays
  const views = new Set<string>();
  
  for (const play of strategy.plays) {
    for (let i = 1; i <= play.sequence.length; i++) {
      const prefix = play.sequence.slice(0, i);
      const view = extractView(
        { sequence: prefix, player: strategy.player } as any,
        strategy.player
      );
      views.add(JSON.stringify(view));
    }
  }
  
  // Check if all views are also plays (for view-stable strategies)
  // Simplified check: views should form valid prefixes of plays
  return true; // Full impl would check each view is a play
}

/**
 * Check full innocence condition (*) from Definition 4.8
 */
function checkInnocenceCondition(strategy: Strategy): boolean {
  // For each pair of plays with matching views, check responses match
  const plays = strategy.plays;
  
  for (let i = 0; i < plays.length; i++) {
    for (let j = i + 1; j < plays.length; j++) {
      const p1 = plays[i];
      const p2 = plays[j];
      
      // Find common prefix where views match
      for (let k = 1; k < Math.min(p1.sequence.length, p2.sequence.length); k++) {
        const view1 = extractView(
          { sequence: p1.sequence.slice(0, k), player: strategy.player } as any,
          strategy.player
        );
        const view2 = extractView(
          { sequence: p2.sequence.slice(0, k), player: strategy.player } as any,
          strategy.player
        );
        
        if (JSON.stringify(view1) === JSON.stringify(view2)) {
          // Same view - check if next moves match
          if (k < p1.sequence.length && k < p2.sequence.length) {
            const next1 = p1.sequence[k];
            const next2 = p2.sequence[k];
            
            if (JSON.stringify(next1) !== JSON.stringify(next2)) {
              return false; // Different responses to same view
            }
          }
        }
      }
    }
  }
  
  return true;
}
```

**Propagation Checking** (`packages/ludics-core/strategy/propagation.ts`):

```typescript
import type { Strategy, PropagationCheck, Action } from '../types';
import { extractView } from '../views';

/**
 * Check propagation condition (Definition 4.25)
 * If tκ, t′κ ∈ Views(S) and t = c * (ξ, I) * d, t′ = c * (ξ′, I′) * d′
 * then ξ = ξ′
 * 
 * Translation: Same prefix → same addresses
 */
export function checkPropagation(strategy: Strategy): PropagationCheck {
  const violations: PropagationCheck['violations'] = [];
  
  // Extract all views from strategy
  const views: Action[][] = [];
  for (const play of strategy.plays) {
    for (let i = 1; i <= play.sequence.length; i++) {
      const prefix = play.sequence.slice(0, i);
      const view = extractView(
        { sequence: prefix, player: strategy.player } as any,
        strategy.player
      );
      views.push(view);
    }
  }
  
  // Check each pair of views
  for (let i = 0; i < views.length; i++) {
    for (let j = i + 1; j < views.length; j++) {
      const v1 = views[i];
      const v2 = views[j];
      
      // Skip if views don't end at same locus
      if (v1.length === 0 || v2.length === 0) continue;
      const last1 = v1[v1.length - 1];
      const last2 = v2[v2.length - 1];
      if (last1.focus !== last2.focus) continue;
      
      // Find longest common prefix
      let commonLength = 0;
      for (let k = 0; k < Math.min(v1.length - 1, v2.length - 1); k++) {
        if (JSON.stringify(v1[k]) === JSON.stringify(v2[k])) {
          commonLength = k + 1;
        } else {
          break;
        }
      }
      
      // If there's a common prefix, check addresses match
      if (commonLength > 0) {
        // Extract continuation after common prefix
        const cont1 = v1.slice(commonLength);
        const cont2 = v2.slice(commonLength);
        
        if (cont1.length > 0 && cont2.length > 0) {
          // Check if first action after common prefix has same focus
          const action1 = cont1[0];
          const action2 = cont2[0];
          
          if (action1.focus !== action2.focus) {
            violations.push({
              views: [v1, v2],
              issue: `After common prefix, different foci: ${action1.focus} vs ${action2.focus}`
            });
          }
        }
      }
    }
  }
  
  return {
    satisfiesPropagation: violations.length === 0,
    violations
  };
}

/**
 * Reformulation: "In each slice, any address only appears once"
 */
export function checkLinearityInSlices(strategy: Strategy): boolean {
  for (const play of strategy.plays) {
    const seenAddresses = new Set<string>();
    
    for (const action of play.sequence) {
      if (seenAddresses.has(action.focus)) {
        return false; // Address appears twice in this slice
      }
      seenAddresses.add(action.focus);
    }
  }
  
  return true;
}
```

**Views(S) and Plays(V) Operations** (`packages/ludics-core/strategy/operations.ts`):

```typescript
import type { Strategy, Play, View, ViewsResult, PlaysResult } from '../types';
import { extractView } from '../views';

/**
 * Views(S) - Extract all views from strategy (Definition 4.10)
 */
export function computeViews(strategy: Strategy): ViewsResult {
  const viewsSet = new Set<string>();
  const views: View[] = [];
  
  for (const play of strategy.plays) {
    for (let i = 1; i <= play.sequence.length; i++) {
      const prefix = play.sequence.slice(0, i);
      const viewSeq = extractView(
        { sequence: prefix, player: strategy.player } as any,
        strategy.player
      );
      
      const viewKey = JSON.stringify(viewSeq);
      if (!viewsSet.has(viewKey)) {
        viewsSet.add(viewKey);
        views.push({
          id: `view-${views.length}`,
          player: strategy.player,
          sequence: viewSeq,
          designId: strategy.designId
        });
      }
    }
  }
  
  // Check if views are stable under view operation
  let isStable = true;
  for (const view of views) {
    const viewOfView = extractView(
      { sequence: view.sequence, player: strategy.player } as any,
      strategy.player
    );
    
    if (JSON.stringify(view.sequence) !== JSON.stringify(viewOfView)) {
      isStable = false;
      break;
    }
  }
  
  return {
    strategyId: strategy.id,
    views,
    isStable
  };
}

/**
 * Plays(V) - Generate plays from views (Definition 4.11)
 * Returns smallest innocent strategy containing V
 */
export function computePlays(views: View[]): PlaysResult {
  const plays: Play[] = [];
  
  // P₀(V) = {p ∈ V : p is minimal for ⊑}
  const minimalViews = findMinimalViews(views);
  
  for (const view of minimalViews) {
    plays.push({
      id: `play-${plays.length}`,
      strategyId: view.designId,
      sequence: view.sequence,
      length: view.sequence.length,
      isPositive: view.sequence.length > 0 &&
                  view.sequence[view.sequence.length - 1].polarity === view.player,
      view
    });
  }
  
  // Pₙ₊₁(V) = {pab : p ∈ Pₙ(V), ∃cab ∈ V, p̄a = c̄a, pa is legal}
  // Iteratively extend plays by matching views
  let prevSize = 0;
  let iterations = 0;
  const maxIterations = 100;
  
  while (plays.length > prevSize && iterations < maxIterations) {
    prevSize = plays.length;
    iterations++;
    
    const newPlays: Play[] = [];
    
    for (const play of plays) {
      // Try to extend this play
      for (const view of views) {
        // Check if view can extend play
        const canExtend = checkViewExtension(play, view);
        if (canExtend) {
          const extended = extendPlay(play, view);
          if (extended && !playExists(extended, [...plays, ...newPlays])) {
            newPlays.push(extended);
          }
        }
      }
    }
    
    plays.push(...newPlays);
  }
  
  return {
    plays,
    isSmallest: true // By construction, this is minimal
  };
}

/**
 * Find minimal views (not proper prefixes of other views)
 */
function findMinimalViews(views: View[]): View[] {
  return views.filter(v1 => {
    return !views.some(v2 => {
      if (v1.id === v2.id) return false;
      return isProperPrefix(v1.sequence, v2.sequence);
    });
  });
}

/**
 * Check if seq1 is proper prefix of seq2
 */
function isProperPrefix(seq1: any[], seq2: any[]): boolean {
  if (seq1.length >= seq2.length) return false;
  for (let i = 0; i < seq1.length; i++) {
    if (JSON.stringify(seq1[i]) !== JSON.stringify(seq2[i])) {
      return false;
    }
  }
  return true;
}

/**
 * Check if view can extend play
 */
function checkViewExtension(play: Play, view: View): boolean {
  // Simplified: check if view starts with play's view
  const playView = extractView(
    { sequence: play.sequence, player: view.player } as any,
    view.player
  );
  
  return isProperPrefix(playView, view.sequence);
}

/**
 * Extend play with view
 */
function extendPlay(play: Play, view: View): Play | null {
  // Simplified extension logic
  if (view.sequence.length <= play.sequence.length) return null;
  
  const extension = view.sequence[play.sequence.length];
  
  return {
    id: `play-${play.id}-ext`,
    strategyId: play.strategyId,
    sequence: [...play.sequence, extension],
    length: play.sequence.length + 1,
    isPositive: extension.polarity === view.player,
    view
  };
}

/**
 * Check if play already exists
 */
function playExists(play: Play, plays: Play[]): boolean {
  return plays.some(p => 
    JSON.stringify(p.sequence) === JSON.stringify(play.sequence)
  );
}
```

### 2.4 API Endpoints

**Innocence Checking API** (`app/api/ludics/strategies/innocence/route.ts`):

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { checkInnocence } from '@/packages/ludics-core/strategy/innocence';
import { constructStrategy } from '@/packages/ludics-core/strategy/construct';

export async function POST(req: NextRequest) {
  try {
    const { designId } = await req.json();
    
    // Fetch design
    const design = await prisma.ludicsDesign.findUnique({
      where: { id: designId },
      include: { acts: true, loci: true }
    });
    
    if (!design) {
      return NextResponse.json({ ok: false, error: 'Design not found' }, { status: 404 });
    }
    
    // Fetch counter-designs (for constructing strategy)
    const counterDesigns = await prisma.ludicsDesign.findMany({
      where: {
        deliberationId: design.deliberationId,
        participantId: { not: design.participantId }
      },
      include: { acts: true, loci: true }
    });
    
    // Construct strategy from design
    const strategy = await constructStrategy(design, counterDesigns);
    
    // Check innocence
    const innocenceCheck = checkInnocence(strategy);
    
    // Store result
    await prisma.ludicsInnocenceCheck.create({
      data: {
        strategyId: strategy.id,
        isInnocent: innocenceCheck.isInnocent,
        isDeterministic: innocenceCheck.isDeterministic,
        isViewStable: innocenceCheck.isViewStable,
        violationLog: innocenceCheck.violations
      }
    });
    
    return NextResponse.json({
      ok: true,
      isInnocent: innocenceCheck.isInnocent,
      check: innocenceCheck
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
```

**Propagation Checking API** (`app/api/ludics/strategies/propagation/route.ts`):

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { checkPropagation } from '@/packages/ludics-core/strategy/propagation';
import { constructStrategy } from '@/packages/ludics-core/strategy/construct';

export async function POST(req: NextRequest) {
  try {
    const { designId } = await req.json();
    
    // Fetch design and counter-designs
    const design = await prisma.ludicsDesign.findUnique({
      where: { id: designId },
      include: { acts: true, loci: true }
    });
    
    if (!design) {
      return NextResponse.json({ ok: false, error: 'Design not found' }, { status: 404 });
    }
    
    const counterDesigns = await prisma.ludicsDesign.findMany({
      where: {
        deliberationId: design.deliberationId,
        participantId: { not: design.participantId }
      },
      include: { acts: true, loci: true }
    });
    
    // Construct strategy
    const strategy = await constructStrategy(design, counterDesigns);
    
    // Check propagation
    const propCheck = checkPropagation(strategy);
    
    // Store result
    await prisma.ludicsPropagationCheck.create({
      data: {
        strategyId: strategy.id,
        satisfiesProp: propCheck.satisfiesPropagation,
        violations: propCheck.violations
      }
    });
    
    return NextResponse.json({
      ok: true,
      satisfiesPropagation: propCheck.satisfiesPropagation,
      check: propCheck
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
```

**Views(S) Operation API** (`app/api/ludics/strategies/views/route.ts`):

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { computeViews } from '@/packages/ludics-core/strategy/operations';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const strategyId = url.searchParams.get('strategyId');
    
    if (!strategyId) {
      return NextResponse.json({ ok: false, error: 'strategyId required' }, { status: 400 });
    }
    
    // Fetch strategy
    const strategy = await prisma.ludicsStrategy.findUnique({
      where: { id: strategyId },
      include: { plays: true }
    });
    
    if (!strategy) {
      return NextResponse.json({ ok: false, error: 'Strategy not found' }, { status: 404 });
    }
    
    // Compute views
    const result = computeViews(strategy as any);
    
    // Cache views
    for (const view of result.views) {
      await prisma.ludicsStrategyView.create({
        data: {
          strategyId: strategy.id,
          viewSequence: view.sequence
        }
      });
    }
    
    return NextResponse.json({
      ok: true,
      views: result.views,
      isStable: result.isStable,
      count: result.views.length
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
```

**Plays(V) Operation API** (`app/api/ludics/strategies/plays/route.ts`):

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { computePlays } from '@/packages/ludics-core/strategy/operations';

export async function POST(req: NextRequest) {
  try {
    const { views } = await req.json();
    
    if (!views || !Array.isArray(views)) {
      return NextResponse.json({ ok: false, error: 'views array required' }, { status: 400 });
    }
    
    // Compute plays from views
    const result = computePlays(views);
    
    return NextResponse.json({
      ok: true,
      plays: result.plays,
      isSmallest: result.isSmallest,
      count: result.plays.length
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
```

### 2.5 React Components

**StrategyInspector Component** (`components/ludics/StrategyInspector.tsx`):

```tsx
'use client';

import * as React from 'react';
import useSWR from 'swr';
import type { Strategy, InnocenceCheck, PropagationCheck } from '@/packages/ludics-core/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function StrategyInspector({
  designId
}: {
  designId: string;
}) {
  const [checkInProgress, setCheckInProgress] = React.useState(false);
  
  // Fetch innocence check
  const { data: innocenceData, mutate: refetchInnocence } = useSWR(
    `/api/ludics/strategies/innocence?designId=${designId}`,
    fetcher,
    { revalidateOnFocus: false }
  );
  
  // Fetch propagation check
  const { data: propagationData, mutate: refetchPropagation } = useSWR(
    `/api/ludics/strategies/propagation?designId=${designId}`,
    fetcher,
    { revalidateOnFocus: false }
  );
  
  const innocenceCheck = innocenceData?.check as InnocenceCheck | undefined;
  const propagationCheck = propagationData?.check as PropagationCheck | undefined;
  
  const runChecks = async () => {
    setCheckInProgress(true);
    try {
      await Promise.all([
        fetch('/api/ludics/strategies/innocence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ designId })
        }),
        fetch('/api/ludics/strategies/propagation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ designId })
        })
      ]);
      
      await Promise.all([refetchInnocence(), refetchPropagation()]);
    } finally {
      setCheckInProgress(false);
    }
  };
  
  return (
    <div className="strategy-inspector border rounded-lg p-4 bg-white/70 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800">Strategy Analysis</h3>
        <button
          onClick={runChecks}
          disabled={checkInProgress}
          className="px-3 py-1 text-xs rounded bg-slate-700 text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {checkInProgress ? 'Checking...' : 'Run Analysis'}
        </button>
      </div>
      
      {/* Innocence Badge */}
      {innocenceCheck && (
        <div className="innocence-section">
          <div className="text-xs font-semibold text-slate-600 mb-2">Innocence Check</div>
          <div className={`inline-flex items-center gap-2 px-3 py-2 rounded border ${
            innocenceCheck.isInnocent
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-amber-50 border-amber-200 text-amber-700'
          }`}>
            <span className="text-lg">{innocenceCheck.isInnocent ? '✓' : '⚠'}</span>
            <div>
              <div className="font-bold">
                {innocenceCheck.isInnocent ? 'Innocent Strategy' : 'Not Innocent'}
              </div>
              <div className="text-xs mt-1 space-y-0.5">
                <div>Deterministic: {innocenceCheck.isDeterministic ? '✓' : '✗'}</div>
                <div>View-Stable: {innocenceCheck.isViewStable ? '✓' : '✗'}</div>
              </div>
            </div>
          </div>
          
          {innocenceCheck.violations.length > 0 && (
            <div className="mt-2 text-xs text-amber-700 bg-amber-50 p-2 rounded">
              <div className="font-semibold mb-1">Violations:</div>
              {innocenceCheck.violations.map((v, i) => (
                <div key={i}>• {v.type}: {v.details}</div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Propagation Badge */}
      {propagationCheck && (
        <div className="propagation-section">
          <div className="text-xs font-semibold text-slate-600 mb-2">Propagation Check</div>
          <div className={`inline-flex items-center gap-2 px-3 py-2 rounded border ${
            propagationCheck.satisfiesPropagation
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}>
            <span className="text-lg">{propagationCheck.satisfiesPropagation ? '✓' : '✗'}</span>
            <div>
              <div className="font-bold">
                {propagationCheck.satisfiesPropagation 
                  ? 'Satisfies Propagation' 
                  : 'Propagation Violated'}
              </div>
            </div>
          </div>
          
          {propagationCheck.violations.length > 0 && (
            <div className="mt-2 text-xs text-rose-700 bg-rose-50 p-2 rounded">
              <div className="font-semibold mb-1">Violations:</div>
              {propagationCheck.violations.slice(0, 3).map((v, i) => (
                <div key={i}>• {v.issue}</div>
              ))}
              {propagationCheck.violations.length > 3 && (
                <div className="text-rose-600 italic">
                  ... and {propagationCheck.violations.length - 3} more
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Design ↔ Strategy Correspondence */}
      {innocenceCheck && propagationCheck && (
        <div className="correspondence-section border-t pt-3">
          <div className="text-xs font-semibold text-slate-600 mb-2">
            Design ↔ Strategy Correspondence
          </div>
          {innocenceCheck.isInnocent && propagationCheck.satisfiesPropagation ? (
            <div className="text-xs text-emerald-700 bg-emerald-50 p-2 rounded">
              ✓ This design corresponds to an <strong>innocent strategy with propagation</strong>.
              Full Design ↔ Strategy isomorphism holds (Proposition 4.27).
            </div>
          ) : (
            <div className="text-xs text-slate-700 bg-slate-50 p-2 rounded">
              This design does not satisfy full correspondence conditions.
              {!innocenceCheck.isInnocent && <div className="mt-1">• Missing: Innocence</div>}
              {!propagationCheck.satisfiesPropagation && <div>• Missing: Propagation</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

**PlaysList Component** (`components/ludics/PlaysList.tsx`):

```tsx
'use client';

import * as React from 'react';
import type { Play } from '@/packages/ludics-core/types';

export function PlaysList({
  plays,
  onSelectPlay
}: {
  plays: Play[];
  onSelectPlay?: (play: Play) => void;
}) {
  return (
    <div className="plays-list space-y-2">
      <div className="text-xs font-semibold text-slate-600 mb-2">
        Plays in Strategy ({plays.length})
      </div>
      
      <div className="max-h-64 overflow-y-auto space-y-1">
        {plays.map((play, idx) => (
          <button
            key={play.id}
            onClick={() => onSelectPlay?.(play)}
            className="w-full text-left p-2 rounded border bg-white hover:bg-slate-50 transition text-xs"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-slate-700">Play {idx + 1}</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                play.isPositive 
                  ? 'bg-sky-100 text-sky-700'
                  : 'bg-rose-100 text-rose-700'
              }`}>
                {play.isPositive ? '+' : '−'}
              </span>
            </div>
            <div className="text-[10px] text-slate-500">
              Length: {play.length} actions
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
```

### 2.6 Integration Points

**Extend LudicsForest**:
- Add "Strategy" tab to DesignTreeView
- Show StrategyInspector panel per design
- Display innocence/propagation badges in forest view

**Extend LudicsPanel**:
- Add "Analyze Strategies" button
- Show strategy analysis for active scope
- Highlight designs that satisfy correspondence

**New LudicsStrategyPanel Component**:
- Dedicated panel for strategy-level operations
- Views(S) / Plays(V) visualization
- Strategy comparison tools

### 2.7 Testing Strategy

**Unit Tests**:
- `innocence.test.ts` - Innocence checking edge cases
- `propagation.test.ts` - Propagation validation
- `operations.test.ts` - Views(S) and Plays(V) correctness

**Example Test**:
```typescript
describe('Innocence Checking', () => {
  it('should detect non-innocent strategy', () => {
    const strategy: Strategy = {
      id: 'test-strategy',
      designId: 'design-1',
      player: 'P',
      plays: [
        {
          id: 'play-1',
          sequence: [
            { focus: '0', ramification: [1], polarity: 'P' },
            { focus: '0.1', ramification: [], polarity: 'O' }
          ],
          length: 2,
          isPositive: false
        },
        {
          id: 'play-2',
          sequence: [
            { focus: '0', ramification: [1], polarity: 'P' },
            { focus: '0.2', ramification: [], polarity: 'O' } // Different response!
          ],
          length: 2,
          isPositive: false
        }
      ],
      isInnocent: false,
      satisfiesPropagation: true
    };
    
    const check = checkInnocence(strategy);
    
    expect(check.isInnocent).toBe(false);
    expect(check.isDeterministic).toBe(false);
    expect(check.violations.length).toBeGreaterThan(0);
  });
});
```

### 2.8 Phase 2 Deliverables

✅ Strategy, Play, and related type definitions
✅ Innocence checking algorithm (Definition 4.8)
✅ Propagation checking algorithm (Definition 4.25)
✅ Views(S) operation (Definition 4.10)
✅ Plays(V) operation (Definition 4.11)
✅ API endpoints for strategy analysis
✅ StrategyInspector and PlaysList components
✅ Integration with LudicsForest and LudicsPanel
✅ Comprehensive test suite

### 2.9 Phase 2 Success Metrics

- Innocence checking identifies all non-innocent strategies
- Propagation validation catches address reuse violations
- Views(S) / Plays(V) satisfy isomorphism properties
- Strategy analysis UI provides clear feedback
- Performance: strategy analysis < 500ms for designs with <50 acts

---

## PHASE 3: Correspondences & Isomorphisms

**Duration**: 3-4 weeks
**Goal**: Implement bidirectional transformations and prove Design ↔ Strategy correspondence

### 3.1 Database Schema Extensions

**New Models**:

```prisma
// LudicsCorrespondence - Cached correspondence mapping
model LudicsCorrespondence {
  id              String              @id @default(uuid())
  designId        String
  strategyId      String
  correspondenceType String           // "design-to-strategy" | "strategy-to-design"
  isVerified      Boolean             @default(false)
  isomorphisms    Json                // Which isomorphisms hold
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt
  
  design          LudicsDesign        @relation(fields: [designId], ...)
  strategy        LudicsStrategy      @relation(fields: [strategyId], ...)
  
  @@unique([designId, strategyId])
  @@index([isVerified])
}

// LudicsIsomorphismCheck - Cached isomorphism validation
model LudicsIsomorphismCheck {
  id              String              @id @default(uuid())
  correspondenceId String
  isomorphismType String              // "plays-views" | "views-plays" | "disp-ch" | "ch-disp"
  holds           Boolean
  evidence        Json?               // Proof/counterexample
  checkedAt       DateTime            @default(now())
  
  correspondence  LudicsCorrespondence @relation(fields: [correspondenceId], ...)
  
  @@unique([correspondenceId, isomorphismType])
  @@index([holds])
}

// LudicsDisputeCache - Precomputed disputes
model LudicsDisputeCache {
  id              String              @id @default(uuid())
  designId        String
  allDisputes     Json                // Array of all disputes Disp(D)
  disputeCount    Int                 @default(0)
  computedAt      DateTime            @default(now())
  
  design          LudicsDesign        @relation(fields: [designId], ...)
  
  @@unique([designId])
}

// LudicsChronicleCache - Precomputed chronicles
model LudicsChronicleCache {
  id              String              @id @default(uuid())
  strategyId      String
  allChronicles   Json                // Array of all chronicles Ch(S)
  chronicleCount  Int                 @default(0)
  computedAt      DateTime            @default(now())
  
  strategy        LudicsStrategy      @relation(fields: [strategyId], ...)
  
  @@unique([strategyId])
}
```

### 3.2 Core Type Definitions

**Correspondence Types** (`packages/ludics-core/correspondence.ts`):

```typescript
import type { Design, Strategy, Dispute, Chronicle, View, Play } from './types';

// Correspondence between design and strategy
export type Correspondence = {
  id: string;
  designId: string;
  strategyId: string;
  type: 'design-to-strategy' | 'strategy-to-design';
  isVerified: boolean;
  isomorphisms: IsomorphismResults;
};

// Results of all four isomorphism checks
export type IsomorphismResults = {
  playsViews: IsomorphismCheck;   // Plays(Views(S)) = S
  viewsPlays: IsomorphismCheck;   // Views(Plays(V)) = V
  dispCh: IsomorphismCheck;       // Disp(Ch(S)) = S
  chDisp: IsomorphismCheck;       // Ch(Disp(D)) = D
};

// Individual isomorphism check
export type IsomorphismCheck = {
  holds: boolean;
  checked: boolean;
  evidence?: any; // Proof or counterexample
};

// Disp(D) result
export type DispResult = {
  designId: string;
  disputes: Dispute[];
  count: number;
};

// Ch(S) result
export type ChResult = {
  strategyId: string;
  chronicles: Chronicle[];
  count: number;
};

// Transformation result
export type TransformResult = {
  source: 'design' | 'strategy';
  target: 'strategy' | 'design';
  sourceId: string;
  targetId: string;
  verified: boolean;
};
```

### 3.3 Core Operations

**Disp(D) Operation** (`packages/ludics-core/correspondence/disp.ts`):

```typescript
import type { Design, Dispute, DispResult } from '../types';
import { stepDesigns } from '../stepping';

/**
 * Disp(D) - Compute all disputes of design D
 * A dispute is an interaction D ⊢ E with orthogonal counter-design E
 */
export async function computeDisp(
  design: Design,
  counterDesigns?: Design[]
): Promise<DispResult> {
  const disputes: Dispute[] = [];
  
  // If no counter-designs provided, fetch all orthogonal designs
  if (!counterDesigns) {
    counterDesigns = await fetchOrthogonalDesigns(design);
  }
  
  // For each counter-design, compute dispute
  for (const counter of counterDesigns) {
    try {
      // Step through interaction until termination
      const dispute = await stepDesigns(design, counter);
      
      if (dispute) {
        disputes.push(dispute);
      }
    } catch (error) {
      console.warn(`Failed to compute dispute with ${counter.id}:`, error);
    }
  }
  
  return {
    designId: design.id,
    disputes,
    count: disputes.length
  };
}

/**
 * Fetch all designs orthogonal to given design
 */
async function fetchOrthogonalDesigns(design: Design): Promise<Design[]> {
  // Query designs in same deliberation with opposite polarity
  // that satisfy orthogonality condition
  const candidates = await prisma.ludicsDesign.findMany({
    where: {
      deliberationId: design.deliberationId,
      participantId: { not: design.participantId }
    },
    include: { acts: true, loci: true }
  });
  
  // Filter to orthogonal designs (would use orthogonality check API)
  const orthogonal: Design[] = [];
  for (const candidate of candidates) {
    const isOrth = await checkOrthogonality(design, candidate);
    if (isOrth) {
      orthogonal.push(candidate as any);
    }
  }
  
  return orthogonal;
}

/**
 * Check orthogonality between two designs
 */
async function checkOrthogonality(d1: Design, d2: Design): Promise<boolean> {
  // Call existing orthogonality API
  const response = await fetch('/api/ludics/orthogonality', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      posDesignId: d1.id,
      negDesignId: d2.id
    })
  });
  
  const result = await response.json();
  return result.ok && result.isOrthogonal;
}
```

**Ch(S) Operation** (`packages/ludics-core/correspondence/ch.ts`):

```typescript
import type { Strategy, Chronicle, ChResult } from '../types';
import { extractChronicles } from '../chronicles';

/**
 * Ch(S) - Extract all chronicles from strategy S
 * For innocent strategies, chronicles correspond to branches
 */
export function computeCh(strategy: Strategy): ChResult {
  const chronicles: Chronicle[] = [];
  
  // For each play in strategy
  for (const play of strategy.plays) {
    // Extract all chronicles from this play
    const playChronicles = extractChronicles(
      { sequence: play.sequence, player: strategy.player } as any
    );
    
    // Add to collection (deduplicate)
    for (const chronicle of playChronicles) {
      const exists = chronicles.some(c => 
        JSON.stringify(c.sequence) === JSON.stringify(chronicle.sequence)
      );
      
      if (!exists) {
        chronicles.push(chronicle);
      }
    }
  }
  
  return {
    strategyId: strategy.id,
    chronicles,
    count: chronicles.length
  };
}

/**
 * Ch(S) optimized - For innocent strategies, chronicles = branches
 */
export function computeChOptimized(strategy: Strategy): ChResult {
  if (!strategy.isInnocent) {
    return computeCh(strategy); // Fall back to general algorithm
  }
  
  // For innocent strategies, use branch structure
  const branches = extractBranches(strategy);
  
  const chronicles: Chronicle[] = branches.map((branch, idx) => ({
    id: `chronicle-${idx}`,
    sequence: branch,
    length: branch.length,
    designId: strategy.designId,
    isMaximal: true
  }));
  
  return {
    strategyId: strategy.id,
    chronicles,
    count: chronicles.length
  };
}

/**
 * Extract branches from innocent strategy
 */
function extractBranches(strategy: Strategy): any[][] {
  // Find all maximal plays (not proper prefixes of others)
  const maximalPlays = strategy.plays.filter(p1 => {
    return !strategy.plays.some(p2 => {
      if (p1.id === p2.id) return false;
      return isProperPrefix(p1.sequence, p2.sequence);
    });
  });
  
  return maximalPlays.map(p => p.sequence);
}

function isProperPrefix(seq1: any[], seq2: any[]): boolean {
  if (seq1.length >= seq2.length) return false;
  for (let i = 0; i < seq1.length; i++) {
    if (JSON.stringify(seq1[i]) !== JSON.stringify(seq2[i])) {
      return false;
    }
  }
  return true;
}
```

**Isomorphism Checkers** (`packages/ludics-core/correspondence/isomorphisms.ts`):

```typescript
import type { Strategy, View, IsomorphismCheck, IsomorphismResults } from '../types';
import { computeViews, computePlays } from '../strategy/operations';
import { computeDisp } from './disp';
import { computeCh } from './ch';

/**
 * Check Plays(Views(S)) = S (Proposition 4.18)
 */
export function checkPlaysViewsIsomorphism(strategy: Strategy): IsomorphismCheck {
  try {
    // Compute Views(S)
    const viewsResult = computeViews(strategy);
    const views = viewsResult.views;
    
    // Compute Plays(Views(S))
    const playsResult = computePlays(views);
    const reconstructedPlays = playsResult.plays;
    
    // Check if reconstructed strategy equals original
    const matches = playsEqual(strategy.plays, reconstructedPlays);
    
    return {
      holds: matches,
      checked: true,
      evidence: matches ? null : {
        originalCount: strategy.plays.length,
        reconstructedCount: reconstructedPlays.plays.length,
        difference: findPlayDifferences(strategy.plays, reconstructedPlays)
      }
    };
  } catch (error: any) {
    return {
      holds: false,
      checked: true,
      evidence: { error: error.message }
    };
  }
}

/**
 * Check Views(Plays(V)) = V (Proposition 4.18 dual)
 */
export function checkViewsPlaysIsomorphism(views: View[]): IsomorphismCheck {
  try {
    // Compute Plays(V)
    const playsResult = computePlays(views);
    
    // Compute Views(Plays(V))
    const strategy = {
      id: 'temp',
      designId: views[0]?.designId || '',
      player: views[0]?.player || 'P',
      plays: playsResult.plays,
      isInnocent: true,
      satisfiesPropagation: true
    };
    
    const viewsResult = computeViews(strategy);
    const reconstructedViews = viewsResult.views;
    
    // Check if reconstructed views equal original
    const matches = viewsEqual(views, reconstructedViews);
    
    return {
      holds: matches,
      checked: true,
      evidence: matches ? null : {
        originalCount: views.length,
        reconstructedCount: reconstructedViews.length
      }
    };
  } catch (error: any) {
    return {
      holds: false,
      checked: true,
      evidence: { error: error.message }
    };
  }
}

/**
 * Check Disp(Ch(S)) = S (Proposition 4.27)
 */
export async function checkDispChIsomorphism(strategy: Strategy): Promise<IsomorphismCheck> {
  try {
    // Compute Ch(S)
    const chResult = computeCh(strategy);
    const chronicles = chResult.chronicles;
    
    // Reconstruct design from chronicles
    const reconstructedDesign = chroniclesToDesign(chronicles, strategy.designId);
    
    // Compute Disp(reconstructedDesign)
    const dispResult = await computeDisp(reconstructedDesign);
    
    // Convert disputes back to strategy
    const reconstructedStrategy = disputesToStrategy(dispResult.disputes);
    
    // Check if reconstructed strategy equals original
    const matches = strategiesEqual(strategy, reconstructedStrategy);
    
    return {
      holds: matches,
      checked: true,
      evidence: matches ? null : {
        originalPlays: strategy.plays.length,
        reconstructedPlays: reconstructedStrategy.plays.length
      }
    };
  } catch (error: any) {
    return {
      holds: false,
      checked: true,
      evidence: { error: error.message }
    };
  }
}

/**
 * Check Ch(Disp(D)) = D (Proposition 4.27 dual)
 */
export async function checkChDispIsomorphism(design: Design): Promise<IsomorphismCheck> {
  try {
    // Compute Disp(D)
    const dispResult = await computeDisp(design);
    
    // Convert disputes to strategy
    const strategy = disputesToStrategy(dispResult.disputes);
    
    // Compute Ch(S)
    const chResult = computeCh(strategy);
    
    // Reconstruct design from chronicles
    const reconstructedDesign = chroniclesToDesign(chResult.chronicles, design.id);
    
    // Check if reconstructed design equals original
    const matches = designsEqual(design, reconstructedDesign);
    
    return {
      holds: matches,
      checked: true,
      evidence: matches ? null : {
        originalActs: design.acts?.length || 0,
        reconstructedActs: reconstructedDesign.acts?.length || 0
      }
    };
  } catch (error: any) {
    return {
      holds: false,
      checked: true,
      evidence: { error: error.message }
    };
  }
}

/**
 * Check all four isomorphisms
 */
export async function checkAllIsomorphisms(
  design: Design,
  strategy: Strategy
): Promise<IsomorphismResults> {
  // Extract views from strategy
  const viewsResult = computeViews(strategy);
  
  return {
    playsViews: checkPlaysViewsIsomorphism(strategy),
    viewsPlays: checkViewsPlaysIsomorphism(viewsResult.views),
    dispCh: await checkDispChIsomorphism(strategy),
    chDisp: await checkChDispIsomorphism(design)
  };
}

// Helper functions

function playsEqual(plays1: Play[], plays2: Play[]): boolean {
  if (plays1.length !== plays2.length) return false;
  
  const sorted1 = plays1.map(p => JSON.stringify(p.sequence)).sort();
  const sorted2 = plays2.map(p => JSON.stringify(p.sequence)).sort();
  
  for (let i = 0; i < sorted1.length; i++) {
    if (sorted1[i] !== sorted2[i]) return false;
  }
  
  return true;
}

function viewsEqual(views1: View[], views2: View[]): boolean {
  if (views1.length !== views2.length) return false;
  
  const sorted1 = views1.map(v => JSON.stringify(v.sequence)).sort();
  const sorted2 = views2.map(v => JSON.stringify(v.sequence)).sort();
  
  for (let i = 0; i < sorted1.length; i++) {
    if (sorted1[i] !== sorted2[i]) return false;
  }
  
  return true;
}

function strategiesEqual(s1: Strategy, s2: Strategy): boolean {
  return playsEqual(s1.plays, s2.plays);
}

function designsEqual(d1: Design, d2: Design): boolean {
  // Compare act structures
  if (!d1.acts || !d2.acts) return false;
  if (d1.acts.length !== d2.acts.length) return false;
  
  // Simplified comparison - full impl would check tree structure
  return true;
}

function findPlayDifferences(plays1: Play[], plays2: Play[]): any {
  return {
    inFirst: plays1.length - plays2.length,
    inSecond: plays2.length - plays1.length
  };
}

function disputesToStrategy(disputes: Dispute[]): Strategy {
  // Convert disputes to plays
  const plays: Play[] = disputes.map((dispute, idx) => ({
    id: `play-${idx}`,
    strategyId: dispute.posDesignId,
    sequence: dispute.pairs.map(p => p.posAction),
    length: dispute.pairs.length,
    isPositive: dispute.pairs.length > 0
  }));
  
  return {
    id: disputes[0]?.posDesignId || 'temp',
    designId: disputes[0]?.posDesignId || '',
    player: 'P',
    plays,
    isInnocent: false,
    satisfiesPropagation: false
  };
}

function chroniclesToDesign(chronicles: Chronicle[], designId: string): Design {
  // Reconstruct design tree from chronicles
  // Simplified - full impl would rebuild act tree
  return {
    id: designId,
    deliberationId: '',
    participantId: 'Proponent',
    acts: [],
    loci: []
  } as any;
}
```

**Bidirectional Transformations** (`packages/ludics-core/correspondence/transform.ts`):

```typescript
import type { Design, Strategy, TransformResult } from '../types';
import { computeDisp } from './disp';
import { computeCh } from './ch';
import { chroniclesToDesign, disputesToStrategy } from './isomorphisms';

/**
 * Transform Design → Strategy (via Disp)
 */
export async function designToStrategy(design: Design): Promise<TransformResult> {
  // Compute Disp(D)
  const dispResult = await computeDisp(design);
  
  // Convert disputes to strategy
  const strategy = disputesToStrategy(dispResult.disputes);
  
  // Store strategy
  const storedStrategy = await prisma.ludicsStrategy.create({
    data: {
      designId: design.id,
      player: design.participantId === 'Proponent' ? 'P' : 'O',
      isInnocent: false, // Will be checked separately
      satisfiesPropagation: false
    }
  });
  
  // Store correspondence
  await prisma.ludicsCorrespondence.create({
    data: {
      designId: design.id,
      strategyId: storedStrategy.id,
      correspondenceType: 'design-to-strategy',
      isVerified: false,
      isomorphisms: {}
    }
  });
  
  return {
    source: 'design',
    target: 'strategy',
    sourceId: design.id,
    targetId: storedStrategy.id,
    verified: false
  };
}

/**
 * Transform Strategy → Design (via Ch)
 */
export async function strategyToDesign(strategy: Strategy): Promise<TransformResult> {
  // Compute Ch(S)
  const chResult = computeCh(strategy);
  
  // Convert chronicles to design
  const design = chroniclesToDesign(chResult.chronicles, strategy.designId);
  
  // Store design (if new)
  const storedDesign = await prisma.ludicsDesign.upsert({
    where: { id: design.id },
    update: {},
    create: {
      id: design.id,
      deliberationId: design.deliberationId,
      participantId: design.participantId,
      // ... other fields
    }
  });
  
  // Store correspondence
  await prisma.ludicsCorrespondence.create({
    data: {
      designId: storedDesign.id,
      strategyId: strategy.id,
      correspondenceType: 'strategy-to-design',
      isVerified: false,
      isomorphisms: {}
    }
  });
  
  return {
    source: 'strategy',
    target: 'design',
    sourceId: strategy.id,
    targetId: storedDesign.id,
    verified: false
  };
}

/**
 * Verify correspondence (check all isomorphisms)
 */
export async function verifyCorrespondence(
  design: Design,
  strategy: Strategy
): Promise<boolean> {
  const isomorphisms = await checkAllIsomorphisms(design, strategy);
  
  const allHold = 
    isomorphisms.playsViews.holds &&
    isomorphisms.viewsPlays.holds &&
    isomorphisms.dispCh.holds &&
    isomorphisms.chDisp.holds;
  
  // Update correspondence record
  await prisma.ludicsCorrespondence.updateMany({
    where: {
      designId: design.id,
      strategyId: strategy.id
    },
    data: {
      isVerified: allHold,
      isomorphisms: isomorphisms
    }
  });
  
  return allHold;
}
```

### 3.4 API Endpoints

**Disp(D) API** (`app/api/ludics/correspondence/disp/route.ts`):

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { computeDisp } from '@/packages/ludics-core/correspondence/disp';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const designId = url.searchParams.get('designId');
    
    if (!designId) {
      return NextResponse.json({ ok: false, error: 'designId required' }, { status: 400 });
    }
    
    // Fetch design
    const design = await prisma.ludicsDesign.findUnique({
      where: { id: designId },
      include: { acts: true, loci: true }
    });
    
    if (!design) {
      return NextResponse.json({ ok: false, error: 'Design not found' }, { status: 404 });
    }
    
    // Check cache
    const cached = await prisma.ludicsDisputeCache.findUnique({
      where: { designId }
    });
    
    if (cached && Date.now() - cached.computedAt.getTime() < 3600000) {
      return NextResponse.json({
        ok: true,
        disputes: cached.allDisputes,
        count: cached.disputeCount,
        cached: true
      });
    }
    
    // Compute Disp(D)
    const result = await computeDisp(design as any);
    
    // Cache result
    await prisma.ludicsDisputeCache.upsert({
      where: { designId },
      update: {
        allDisputes: result.disputes,
        disputeCount: result.count,
        computedAt: new Date()
      },
      create: {
        designId,
        allDisputes: result.disputes,
        disputeCount: result.count
      }
    });
    
    return NextResponse.json({
      ok: true,
      disputes: result.disputes,
      count: result.count,
      cached: false
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
```

**Ch(S) API** (`app/api/ludics/correspondence/ch/route.ts`):

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { computeCh } from '@/packages/ludics-core/correspondence/ch';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const strategyId = url.searchParams.get('strategyId');
    
    if (!strategyId) {
      return NextResponse.json({ ok: false, error: 'strategyId required' }, { status: 400 });
    }
    
    // Fetch strategy
    const strategy = await prisma.ludicsStrategy.findUnique({
      where: { id: strategyId },
      include: { plays: true }
    });
    
    if (!strategy) {
      return NextResponse.json({ ok: false, error: 'Strategy not found' }, { status: 404 });
    }
    
    // Check cache
    const cached = await prisma.ludicsChronicleCache.findUnique({
      where: { strategyId }
    });
    
    if (cached && Date.now() - cached.computedAt.getTime() < 3600000) {
      return NextResponse.json({
        ok: true,
        chronicles: cached.allChronicles,
        count: cached.chronicleCount,
        cached: true
      });
    }
    
    // Compute Ch(S)
    const result = computeCh(strategy as any);
    
    // Cache result
    await prisma.ludicsChronicleCache.upsert({
      where: { strategyId },
      update: {
        allChronicles: result.chronicles,
        chronicleCount: result.count,
        computedAt: new Date()
      },
      create: {
        strategyId,
        allChronicles: result.chronicles,
        chronicleCount: result.count
      }
    });
    
    return NextResponse.json({
      ok: true,
      chronicles: result.chronicles,
      count: result.count,
      cached: false
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
```

**Isomorphism Checking API** (`app/api/ludics/correspondence/verify/route.ts`):

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { checkAllIsomorphisms, verifyCorrespondence } from '@/packages/ludics-core/correspondence/isomorphisms';

export async function POST(req: NextRequest) {
  try {
    const { designId, strategyId } = await req.json();
    
    // Fetch design and strategy
    const design = await prisma.ludicsDesign.findUnique({
      where: { id: designId },
      include: { acts: true, loci: true }
    });
    
    const strategy = await prisma.ludicsStrategy.findUnique({
      where: { id: strategyId },
      include: { plays: true }
    });
    
    if (!design || !strategy) {
      return NextResponse.json({ ok: false, error: 'Design or strategy not found' }, { status: 404 });
    }
    
    // Check all isomorphisms
    const isomorphisms = await checkAllIsomorphisms(design as any, strategy as any);
    
    // Verify correspondence
    const verified = await verifyCorrespondence(design as any, strategy as any);
    
    return NextResponse.json({
      ok: true,
      verified,
      isomorphisms,
      summary: {
        playsViews: isomorphisms.playsViews.holds,
        viewsPlays: isomorphisms.viewsPlays.holds,
        dispCh: isomorphisms.dispCh.holds,
        chDisp: isomorphisms.chDisp.holds
      }
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
```

**Design ↔ Strategy Transformation API** (`app/api/ludics/correspondence/transform/route.ts`):

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { designToStrategy, strategyToDesign } from '@/packages/ludics-core/correspondence/transform';

export async function POST(req: NextRequest) {
  try {
    const { sourceType, sourceId } = await req.json();
    
    if (sourceType === 'design') {
      // Fetch design
      const design = await prisma.ludicsDesign.findUnique({
        where: { id: sourceId },
        include: { acts: true, loci: true }
      });
      
      if (!design) {
        return NextResponse.json({ ok: false, error: 'Design not found' }, { status: 404 });
      }
      
      // Transform to strategy
      const result = await designToStrategy(design as any);
      
      return NextResponse.json({
        ok: true,
        transformation: result,
        message: 'Design transformed to strategy via Disp(D)'
      });
      
    } else if (sourceType === 'strategy') {
      // Fetch strategy
      const strategy = await prisma.ludicsStrategy.findUnique({
        where: { id: sourceId },
        include: { plays: true }
      });
      
      if (!strategy) {
        return NextResponse.json({ ok: false, error: 'Strategy not found' }, { status: 404 });
      }
      
      // Transform to design
      const result = await strategyToDesign(strategy as any);
      
      return NextResponse.json({
        ok: true,
        transformation: result,
        message: 'Strategy transformed to design via Ch(S)'
      });
      
    } else {
      return NextResponse.json({ ok: false, error: 'Invalid sourceType' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
```

### 3.5 React Components

**CorrespondenceViewer Component** (`components/ludics/CorrespondenceViewer.tsx`):

```tsx
'use client';

import * as React from 'react';
import useSWR from 'swr';
import type { Correspondence, IsomorphismResults } from '@/packages/ludics-core/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function CorrespondenceViewer({
  designId,
  strategyId
}: {
  designId: string;
  strategyId?: string;
}) {
  const [verifying, setVerifying] = React.useState(false);
  
  // Fetch correspondence
  const { data: corrData, mutate: refetch } = useSWR(
    designId && strategyId 
      ? `/api/ludics/correspondence?designId=${designId}&strategyId=${strategyId}`
      : null,
    fetcher,
    { revalidateOnFocus: false }
  );
  
  const correspondence = corrData?.correspondence as Correspondence | undefined;
  const isomorphisms = correspondence?.isomorphisms as IsomorphismResults | undefined;
  
  const verifyCorrespondence = async () => {
    if (!strategyId) return;
    
    setVerifying(true);
    try {
      await fetch('/api/ludics/correspondence/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ designId, strategyId })
      });
      
      await refetch();
    } finally {
      setVerifying(false);
    }
  };
  
  return (
    <div className="correspondence-viewer border rounded-lg p-4 bg-white/70 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800">
          Design ↔ Strategy Correspondence
        </h3>
        {strategyId && (
          <button
            onClick={verifyCorrespondence}
            disabled={verifying}
            className="px-3 py-1 text-xs rounded bg-indigo-700 text-white hover:bg-indigo-800 disabled:opacity-50"
          >
            {verifying ? 'Verifying...' : 'Verify Isomorphisms'}
          </button>
        )}
      </div>
      
      {correspondence?.isVerified ? (
        <div className="verified-badge bg-emerald-50 border border-emerald-200 rounded p-3">
          <div className="flex items-center gap-2 text-emerald-700">
            <span className="text-xl">✓</span>
            <div>
              <div className="font-bold">Correspondence Verified</div>
              <div className="text-xs mt-1">
                Design D ≅ Strategy S (Proposition 4.27)
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="unverified-badge bg-slate-50 border border-slate-200 rounded p-3">
          <div className="text-xs text-slate-600">
            Correspondence not yet verified. Click "Verify Isomorphisms" to check.
          </div>
        </div>
      )}
      
      {/* Isomorphism Checklist */}
      {isomorphisms && (
        <div className="isomorphisms-grid grid grid-cols-2 gap-3">
          <IsomorphismBadge
            name="Plays(Views(S)) = S"
            holds={isomorphisms.playsViews.holds}
            checked={isomorphisms.playsViews.checked}
          />
          <IsomorphismBadge
            name="Views(Plays(V)) = V"
            holds={isomorphisms.viewsPlays.holds}
            checked={isomorphisms.viewsPlays.checked}
          />
          <IsomorphismBadge
            name="Disp(Ch(S)) = S"
            holds={isomorphisms.dispCh.holds}
            checked={isomorphisms.dispCh.checked}
          />
          <IsomorphismBadge
            name="Ch(Disp(D)) = D"
            holds={isomorphisms.chDisp.holds}
            checked={isomorphisms.chDisp.checked}
          />
        </div>
      )}
    </div>
  );
}

function IsomorphismBadge({
  name,
  holds,
  checked
}: {
  name: string;
  holds: boolean;
  checked: boolean;
}) {
  if (!checked) {
    return (
      <div className="p-2 rounded border border-slate-200 bg-slate-50">
        <div className="text-[10px] font-mono text-slate-600">{name}</div>
        <div className="text-xs text-slate-500 mt-1">Not checked</div>
      </div>
    );
  }
  
  return (
    <div className={`p-2 rounded border ${
      holds
        ? 'bg-emerald-50 border-emerald-200'
        : 'bg-rose-50 border-rose-200'
    }`}>
      <div className="flex items-center gap-1.5">
        <span className={holds ? 'text-emerald-700' : 'text-rose-700'}>
          {holds ? '✓' : '✗'}
        </span>
        <div className="text-[10px] font-mono text-slate-700">{name}</div>
      </div>
    </div>
  );
}
```

**TransformationControls Component** (`components/ludics/TransformationControls.tsx`):

```tsx
'use client';

import * as React from 'react';

export function TransformationControls({
  designId,
  onTransform
}: {
  designId: string;
  onTransform?: (result: any) => void;
}) {
  const [transforming, setTransforming] = React.useState(false);
  
  const transformToStrategy = async () => {
    setTransforming(true);
    try {
      const response = await fetch('/api/ludics/correspondence/transform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType: 'design',
          sourceId: designId
        })
      });
      
      const result = await response.json();
      if (result.ok) {
        onTransform?.(result.transformation);
      }
    } finally {
      setTransforming(false);
    }
  };
  
  return (
    <div className="transformation-controls flex gap-2">
      <button
        onClick={transformToStrategy}
        disabled={transforming}
        className="px-3 py-1.5 text-xs rounded bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 flex items-center gap-1.5"
      >
        <span>→</span>
        <span>{transforming ? 'Transforming...' : 'Design → Strategy'}</span>
      </button>
      
      <div className="text-[10px] text-slate-500 flex items-center">
        via Disp(D)
      </div>
    </div>
  );
}
```

**DisputesList Component** (`components/ludics/DisputesList.tsx`):

```tsx
'use client';

import * as React from 'react';
import useSWR from 'swr';
import type { Dispute } from '@/packages/ludics-core/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function DisputesList({
  designId,
  onSelectDispute
}: {
  designId: string;
  onSelectDispute?: (dispute: Dispute) => void;
}) {
  const { data, isLoading } = useSWR(
    `/api/ludics/correspondence/disp?designId=${designId}`,
    fetcher,
    { revalidateOnFocus: false }
  );
  
  const disputes = (data?.disputes || []) as Dispute[];
  
  return (
    <div className="disputes-list space-y-2">
      <div className="text-xs font-semibold text-slate-600 mb-2">
        Disputes Disp(D) {data?.cached && '(cached)'}
      </div>
      
      {isLoading ? (
        <div className="text-xs text-slate-500">Loading disputes...</div>
      ) : (
        <div className="max-h-48 overflow-y-auto space-y-1">
          {disputes.map((dispute, idx) => (
            <button
              key={dispute.id}
              onClick={() => onSelectDispute?.(dispute)}
              className="w-full text-left p-2 rounded border bg-white hover:bg-slate-50 transition text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-slate-700">Dispute {idx + 1}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  dispute.status === 'CONVERGED'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {dispute.status}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Length: {dispute.length} pairs
              </div>
            </button>
          ))}
        </div>
      )}
      
      {!isLoading && disputes.length === 0 && (
        <div className="text-xs text-slate-500 italic">
          No disputes found (design may not have orthogonal counter-designs)
        </div>
      )}
    </div>
  );
}
```

### 3.6 Integration Points

**Extend LudicsPanel**:
- Add "Correspondence" tab
- Show CorrespondenceViewer for active design
- Display Disp(D) count and Ch(S) count
- Add transformation controls

**Extend LudicsForest**:
- Show correspondence badges per design
- Indicate verified/unverified status
- Quick-transform button per design

**Extend StrategyInspector** (from Phase 2):
- Add CorrespondenceViewer section
- Show isomorphism checklist
- Display transformation history

### 3.7 Testing Strategy

**Unit Tests**:
- `disp.test.ts` - Disp(D) computation correctness
- `ch.test.ts` - Ch(S) extraction accuracy
- `isomorphisms.test.ts` - All four isomorphism checks
- `transform.test.ts` - Bidirectional transformations

**Example Test**:
```typescript
describe('Isomorphism: Plays(Views(S)) = S', () => {
  it('should satisfy isomorphism for innocent strategy', () => {
    const strategy: Strategy = createInnocentStrategy();
    
    // Compute Views(S)
    const viewsResult = computeViews(strategy);
    
    // Compute Plays(Views(S))
    const playsResult = computePlays(viewsResult.views);
    
    // Check isomorphism
    const check = checkPlaysViewsIsomorphism(strategy);
    
    expect(check.holds).toBe(true);
    expect(playsResult.plays).toHaveLength(strategy.plays.length);
  });
  
  it('should detect violation for non-innocent strategy', () => {
    const strategy: Strategy = createNonInnocentStrategy();
    
    const check = checkPlaysViewsIsomorphism(strategy);
    
    expect(check.holds).toBe(false);
    expect(check.evidence).toBeDefined();
  });
});

describe('Design ↔ Strategy Correspondence', () => {
  it('should verify full correspondence for innocent design', async () => {
    const design = await createInnocentDesign();
    const strategy = await designToStrategy(design);
    
    const verified = await verifyCorrespondence(design, strategy);
    
    expect(verified).toBe(true);
  });
});
```

### 3.8 Phase 3 Deliverables

✅ Disp(D) operation with caching
✅ Ch(S) operation with branch optimization
✅ Four isomorphism checkers (Plays∘Views, Views∘Plays, Disp∘Ch, Ch∘Disp)
✅ Bidirectional transformation (Design ↔ Strategy)
✅ Correspondence verification algorithm
✅ 4 API endpoints (disp, ch, verify, transform)
✅ CorrespondenceViewer component with isomorphism badges
✅ TransformationControls and DisputesList components
✅ Integration with existing LudicsPanel and LudicsForest
✅ Comprehensive test suite

### 3.9 Phase 3 Success Metrics

- All four isomorphisms hold for innocent strategies with propagation
- Disp(D) computation completes in <2s for designs with <100 acts
- Ch(S) extraction accurate for all strategy types
- Correspondence verification identifies violations correctly
- Transformation Design → Strategy → Design preserves semantics
- UI clearly indicates verified/unverified correspondences

### 3.10 Implementation Notes

**Optimization Opportunities**:
- Cache Disp(D) results (disputes rarely change)
- For innocent strategies, Ch(S) = branches (O(n) instead of O(n²))
- Parallelize isomorphism checks (independent computations)
- Incremental verification (check only changed parts)

**Theoretical Guarantees**:
- Proposition 4.18: Plays(Views(S)) = S ↔ Views(Plays(V)) = V
- Proposition 4.27: Full correspondence D ≅ S when S is innocent with propagation
- Corollary: Disp and Ch are inverse operations for innocent designs

**Edge Cases**:
- Non-innocent strategies may fail Plays∘Views isomorphism
- Designs without orthogonal counter-designs have empty Disp(D)
- Infinite designs require truncation/approximation
- Partial chronicles from incomplete disputes

---

## Notes on Current Implementation Style

### Terminology Mapping:
- **Current "trace"** ≈ Paper "dispute" (but stored, not first-class)
- **Current "acts"** ≈ Paper "actions"
- **Current "locus path"** ≈ Paper "address"
- **Current "polarity"** ≈ Paper "player ownership"
- **Current "step pairs"** ≈ Paper "interaction pairs"

### Missing Abstractions:
1. No `View` type/operation
2. No `Chronicle` type (distinct from trace)
3. No `Strategy` type
4. No `Arena` type
5. No `Legal position` validation
6. No `Innocent strategy` type
7. No `Propagation` checker

### Implementation Philosophy:
- Current: **Operational** (run the stepping, observe results)
- Paper: **Declarative** (define properties, check correspondence)
- Need: **Hybrid** (both operational execution AND declarative validation)

---

## Next Steps for Roadmap

The roadmap will be divided into phases:

1. **Phase 1**: Core Abstractions (Views, Chronicles, Positions)
2. **Phase 2**: Strategy Layer (Strategies, Innocence, Propagation)
3. **Phase 3**: Correspondences (Disp/Ch operations, isomorphisms)
4. **Phase 4**: UI Integration (Dual perspectives, view-based debugging)
5. **Phase 5**: Advanced Features (Behaviours, types, saturation analysis)

Each phase will detail:
- Database schema changes
- API endpoints (new/modified)
- Core algorithms
- React components
- Integration points

---

**Status**: Part 1 Complete - Current Implementation Analyzed
**Next**: Part 2 - Phase-by-Phase Development Plan
