# Phase 8B: ASPIC+ Theory Visualization UI

**Status**: Planning → Implementation  
**Target**: DeepDivePanelV2 ASPIC tab  
**Start Date**: November 6, 2025  
**Estimated Duration**: 1-2 weeks (4 chunks)  
**Priority**: HIGH (Foundation for Phase 5 Ludics)

---

## Table of Contents

1. [Overview](#overview)
2. [Strategic Context](#strategic-context)
3. [Architecture](#architecture)
4. [Implementation Chunks](#implementation-chunks)
5. [Component Specifications](#component-specifications)
6. [API Integration](#api-integration)
7. [Testing Strategy](#testing-strategy)
8. [Success Criteria](#success-criteria)

---

## Overview

### Mission Statement

Create user-facing UI components that visualize the complete ASPIC+ argumentation theory for a deliberation, making formal logic **transparent**, **educational**, and **actionable**.

### Current State

**Backend** (Phase 0-1f): ✅ **COMPLETE**
- `lib/aspic/arguments.ts` - Argument construction
- `lib/aspic/attacks.ts` - Attack computation (undermining/rebutting/undercutting)
- `lib/aspic/defeats.ts` - Defeat resolution with preferences
- `lib/aspic/semantics.ts` - Grounded extension computation
- `lib/aspic/rationality.ts` - Rationality postulate validation
- `lib/aif/translation/aifToAspic.ts` - AIF → ASPIC+ translation
- `/api/aspic/evaluate` - Complete evaluation endpoint
- `/api/aif/evaluate` - AIF-to-ASPIC+ evaluation endpoint

**Frontend**: ⚠️ **GAP**
- ASPIC+ runs invisibly in backend
- Users see indicators (badges, attack types) but not the theory itself
- No way to view: arguments, attacks, defeats, grounded extension, rationality status

**User Need**:
- "Why was this argument defeated?"
- "What's the formal theory behind this deliberation?"
- "Are there logical inconsistencies?"
- "How do preferences affect the outcome?"

### Solution

Build 4 core UI components in the ASPIC tab (DeepDivePanelV2):

1. **AspicTheoryViewer** - Display complete theory structure
2. **AttackGraphVisualization** - Interactive argument graph
3. **GroundedExtensionPanel** - Evaluation results (IN/OUT/UNDEC)
4. **RationalityChecklist** - Validate theory quality

---

## Strategic Context

### Why Before Phase 5?

**Phase 5 (Ludics Interactive Features)** builds commitment stores as ASPIC+ theories:
- Commitment Store = Argumentation Theory
- Convergence = Consistent theory (no contradictions)
- Divergence = Inconsistent theory (logical conflict)
- Faxing = Modifying theory
- Delocalization = Exploring alternative theories

**Users need to understand ASPIC+ theories BEFORE manipulating them.**

### Benefits

1. **Transparency** 🔍 - See formal logic behind decisions
2. **Education** 📚 - Learn formal argumentation visually
3. **Debugging** 🐛 - Validate AIF → ASPIC+ translation
4. **Research** 🔬 - Export formal theories for external tools
5. **Ludics Foundation** 🔗 - Prepares users for Phase 5 concepts

### Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Complex UI (too technical) | Medium | Progressive disclosure, tooltips, "explain" mode |
| Performance (large graphs) | Low | Pagination, lazy loading, WebGL for graphs |
| Backend stability | Low | Backend is complete & tested (28/28 tests pass) |
| Integration with existing code | Low | Additive only (new tab, no breaking changes) |

---

## Architecture

### Component Hierarchy

```
DeepDivePanelV2.tsx
├─ TabsContent value="aspic"
│  └─ AspicTheoryPanel (NEW)
│     ├─ AspicTheoryViewer (Chunk 1)
│     │  ├─ LanguageSection
│     │  ├─ RulesSection
│     │  │  ├─ StrictRulesList
│     │  │  └─ DefeasibleRulesList
│     │  ├─ KnowledgeBaseSection
│     │  │  ├─ AxiomsList
│     │  │  ├─ PremisesList
│     │  │  └─ AssumptionsList
│     │  └─ ContrariesSection
│     │
│     ├─ AttackGraphVisualization (Chunk 2)
│     │  ├─ GraphCanvas (D3/Cytoscape)
│     │  ├─ ArgumentNodeTooltip
│     │  ├─ AttackEdgeTooltip
│     │  └─ GraphControls (zoom, filter, layout)
│     │
│     ├─ GroundedExtensionPanel (Chunk 3)
│     │  ├─ InArgumentsList (✅ Justified)
│     │  ├─ OutArgumentsList (❌ Defeated)
│     │  ├─ UndecidedArgumentsList (⚠️ Undecided)
│     │  └─ ExtensionStats
│     │
│     └─ RationalityChecklist (Chunk 4)
│        ├─ WellFormednessChecks
│        │  ├─ ContraryWellFormedness
│        │  ├─ ClosureChecks (transposition, contraposition)
│        │  └─ ConsistencyChecks
│        └─ RationalityPostulates
│           ├─ SubArgumentClosure
│           ├─ StrictClosure
│           ├─ DirectConsistency
│           └─ IndirectConsistency
```

### Data Flow

```
User clicks ASPIC tab
  ↓
AspicTheoryPanel fetches /api/aspic/evaluate?deliberationId=xxx
  ↓
API computes ASPIC+ semantics:
  1. Construct all arguments from AIF graph
  2. Compute attacks (undermining/rebutting/undercutting)
  3. Resolve to defeats (with preferences)
  4. Compute grounded extension
  5. Assign IN/OUT/UNDEC labels
  ↓
Return complete theory + semantics
  ↓
Components render:
  - AspicTheoryViewer: displays theory structure
  - AttackGraphVisualization: renders interactive graph
  - GroundedExtensionPanel: shows justified/defeated args
  - RationalityChecklist: validates theory quality
```

### API Response Format

```typescript
// GET /api/aspic/evaluate?deliberationId=xxx
{
  theory: {
    system: {
      language: Set<string>,           // ["p", "q", "r", ...]
      contraries: Map<string, Set<string>>, // { "p": ["¬p"], ... }
      strictRules: Rule[],             // [...strict inference rules]
      defeasibleRules: Rule[],         // [...defeasible rules]
      ruleNames: Map<string, string>   // { "r1": "Modus Ponens", ... }
    },
    knowledgeBase: {
      axioms: Set<string>,             // ["p", "q"]
      premises: Set<string>,           // ["r", "s"]
      assumptions: Set<string>,        // ["t"]
      premisePreferences: Array<{preferred, dispreferred}>,
      rulePreferences: Array<{preferred, dispreferred}>
    }
  },
  semantics: {
    arguments: Argument[],             // All constructed arguments
    attacks: Attack[],                 // All attack relations
    defeats: Defeat[],                 // Successful attacks
    groundedExtension: {
      inArguments: Set<string>,        // Justified (IN)
      outArguments: Set<string>,       // Defeated (OUT)
      undecidedArguments: Set<string>  // Undecided (UNDEC)
    },
    justificationStatus: Map<string, 'in' | 'out' | 'undec'>
  },
  rationality: {
    wellFormed: boolean,
    violations: string[],
    postulates: {
      subArgumentClosure: boolean,
      strictClosure: boolean,
      directConsistency: boolean,
      indirectConsistency: boolean
    }
  }
}
```

---

## Implementation Chunks

### Chunk 1: AspicTheoryViewer (3 days)

**Goal**: Display complete theory structure in readable format

**Components to Create**:
- `components/aspic/AspicTheoryPanel.tsx` (main container)
- `components/aspic/AspicTheoryViewer.tsx` (theory display)
- `components/aspic/LanguageSection.tsx` (language formulas)
- `components/aspic/RulesSection.tsx` (strict + defeasible rules)
- `components/aspic/KnowledgeBaseSection.tsx` (axioms, premises, assumptions)
- `components/aspic/ContrariesSection.tsx` (contrariness function)

**API Integration**:
- Create `/api/aspic/evaluate` route handler (or use existing)
- Fetch theory for current deliberation
- Cache with SWR (revalidate on demand)

**UI Design**:
```tsx
┌─────────────────────────────────────────────────────┐
│  ASPIC+ Argumentation Theory                        │
│  ──────────────────────────────────────────────────│
│                                                     │
│  📖 Language (15 formulas)                         │
│  ├─ p, q, r, s, t, u, v, w, x, y, z, ¬p, ¬q... │
│  └─ [Expand All]                                   │
│                                                     │
│  ⚖️ Rules (8 total)                                │
│  ├─ Strict Rules (3)                               │
│  │  ├─ r1: p → q (Modus Ponens)                   │
│  │  ├─ r2: p, q → r (Conjunction)                 │
│  │  └─ r3: p → ¬¬p (Double Negation)             │
│  └─ Defeasible Rules (5)                           │
│     ├─ d1: bird ⇒ flies (Birds fly)               │
│     ├─ d2: penguin ⇒ ¬flies (Penguins don't)     │
│     └─ ... [Show More]                             │
│                                                     │
│  📚 Knowledge Base (12 items)                      │
│  ├─ Axioms (3): p, q, r                           │
│  ├─ Premises (7): s, t, u, v, w, x, y             │
│  └─ Assumptions (2): a1, a2                        │
│                                                     │
│  🔀 Contraries (8 pairs)                           │
│  ├─ p ↔ ¬p                                        │
│  ├─ flies ↔ ¬flies                                │
│  └─ ... [Show All]                                 │
│                                                     │
│  [Export JSON] [Export LaTeX] [Copy to Clipboard] │
└─────────────────────────────────────────────────────┘
```

**Key Features**:
- Collapsible sections (expand/collapse)
- Formula highlighting (hover to see usage)
- Rule explanations (tooltip on hover)
- Export buttons (JSON, LaTeX, plain text)

**Estimated Lines**: ~300 lines

---

### Chunk 2: AttackGraphVisualization (3 days)

**Goal**: Interactive graph showing arguments, attacks, and defeat status

**Components to Create**:
- `components/aspic/AttackGraphVisualization.tsx` (graph container)
- `components/aspic/ArgumentNode.tsx` (graph node component)
- `components/aspic/AttackEdge.tsx` (graph edge component)
- `components/aspic/GraphControls.tsx` (zoom, filter, layout controls)
- `components/aspic/ArgumentDetailPanel.tsx` (click node → show details)

**Technology Options**:

**Option A: React Flow** (Recommended)
- Pros: React-native, easy to use, performant
- Cons: Less flexible layouts than D3

**Option B: D3.js**
- Pros: Maximum flexibility, force-directed layout
- Cons: More complex React integration

**Option C: Cytoscape.js**
- Pros: Rich layouts, graph algorithms built-in
- Cons: Steeper learning curve

**Recommendation**: Start with **React Flow** for speed, migrate to D3 if needed.

**UI Design**:
```tsx
┌─────────────────────────────────────────────────────┐
│  Attack Graph Visualization                         │
│  ──────────────────────────────────────────────────│
│                                                     │
│  Controls: [Zoom In] [Zoom Out] [Fit View]         │
│           [Layout: Force] [Filter: All]            │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │                                               │ │
│  │      ┌───┐  undermines  ┌───┐               │ │
│  │      │A1 │──────────────>│A2 │               │ │
│  │      └───┘               └───┘               │ │
│  │       ✅                   ❌                │ │
│  │                                               │ │
│  │      ┌───┐   undercuts   ┌───┐              │ │
│  │      │A3 │──────────────>│A4 │              │ │
│  │      └───┘               └───┘              │ │
│  │       ✅                   ⚠️               │ │
│  │                                               │ │
│  │      ┌───┐    rebuts     ┌───┐              │ │
│  │      │A5 │──────────────>│A6 │              │ │
│  │      └───┘               └───┘              │ │
│  │       ❌                   ✅               │ │
│  │                                               │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  Legend:                                            │
│  ✅ IN (Justified)  ❌ OUT (Defeated)  ⚠️ UNDEC   │
│  ──────> Attack  ======> Defeat                   │
└─────────────────────────────────────────────────────┘
```

**Node Styling**:
```tsx
// Color by justification status
const getNodeColor = (status: 'in' | 'out' | 'undec') => {
  switch (status) {
    case 'in': return 'bg-green-100 border-green-500';   // Justified
    case 'out': return 'bg-red-100 border-red-500';      // Defeated
    case 'undec': return 'bg-amber-100 border-amber-500'; // Undecided
  }
};

// Size by argument complexity
const getNodeSize = (arg: Argument) => {
  const complexity = arg.premises.length + arg.subArguments.length;
  return 40 + (complexity * 5); // Base 40px + 5px per element
};
```

**Edge Styling**:
```tsx
// Color by attack type
const getEdgeColor = (attackType: AttackType) => {
  switch (attackType) {
    case 'undermining': return '#6B7280';  // Gray
    case 'rebutting': return '#DC2626';    // Red
    case 'undercutting': return '#F59E0B'; // Amber
  }
};

// Dashed if attack doesn't succeed (not a defeat)
const getEdgeStyle = (isDefeat: boolean) => ({
  strokeDasharray: isDefeat ? '0' : '5,5',
  strokeWidth: isDefeat ? 3 : 2
});
```

**Interactions**:
- **Click node** → Show ArgumentDetailPanel (premises, conclusion, sub-args)
- **Hover node** → Tooltip with argument structure
- **Click edge** → Show AttackDetailPanel (type, target, defeat status)
- **Hover edge** → Tooltip with attack explanation
- **Drag node** → Reposition (save layout)
- **Double-click node** → Expand to show sub-arguments

**Key Features**:
- Force-directed layout (arguments repel, attacks attract)
- Filter controls (show only IN/OUT/UNDEC, by attack type)
- Layout presets (force, hierarchical, circular)
- Mini-map for large graphs
- Export SVG/PNG

**Estimated Lines**: ~400 lines

---

### Chunk 3: GroundedExtensionPanel (2 days)

**Goal**: Display evaluation results with clear IN/OUT/UNDEC categorization

**Components to Create**:
- `components/aspic/GroundedExtensionPanel.tsx` (main panel)
- `components/aspic/ArgumentStatusCard.tsx` (single argument display)
- `components/aspic/ExtensionStats.tsx` (summary statistics)
- `components/aspic/JustificationExplanation.tsx` (why IN/OUT/UNDEC)

**UI Design**:
```tsx
┌─────────────────────────────────────────────────────┐
│  Grounded Extension                                 │
│  ──────────────────────────────────────────────────│
│                                                     │
│  Summary: 15 total arguments                        │
│  ✅ 8 Justified (IN)  ❌ 5 Defeated (OUT)  ⚠️ 2 Undecided │
│                                                     │
│  ✅ Justified Arguments (IN)                       │
│  ┌─────────────────────────────────────────────┐   │
│  │ A1: p → q  [View Details]                   │   │
│  │ Premises: p                                  │   │
│  │ Conclusion: q                                │   │
│  │ Status: DEFENDED (no undefeated attackers)   │   │
│  └─────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────┐   │
│  │ A3: bird ⇒ flies  [View Details]            │   │
│  │ Premises: bird                               │   │
│  │ Conclusion: flies                            │   │
│  │ Status: DEFENDED (attacker A4 is OUT)        │   │
│  └─────────────────────────────────────────────┘   │
│  ... [Show 6 more]                                  │
│                                                     │
│  ❌ Defeated Arguments (OUT)                       │
│  ┌─────────────────────────────────────────────┐   │
│  │ A2: penguin ⇒ flies  [View Details]         │   │
│  │ Premises: penguin                            │   │
│  │ Conclusion: flies                            │   │
│  │ Status: DEFEATED by A4 (penguin ⇒ ¬flies)  │   │
│  └─────────────────────────────────────────────┘   │
│  ... [Show 4 more]                                  │
│                                                     │
│  ⚠️ Undecided Arguments (UNDEC)                   │
│  ┌─────────────────────────────────────────────┐   │
│  │ A7: p ∧ ¬p  [View Details]                  │   │
│  │ Premises: p, ¬p                             │   │
│  │ Conclusion: ⊥                                │   │
│  │ Status: UNDECIDED (mutual defeat cycle)      │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  [Export Results] [Show Attack Chains]              │
└─────────────────────────────────────────────────────┘
```

**Justification Explanation Logic**:
```typescript
function getJustificationExplanation(
  arg: Argument,
  status: 'in' | 'out' | 'undec',
  attacks: Attack[],
  extension: GroundedExtension
): string {
  if (status === 'in') {
    const attackers = attacks.filter(a => a.attacked === arg.id);
    if (attackers.length === 0) {
      return "No attackers (defended by default)";
    }
    const defeatedAttackers = attackers.filter(
      a => extension.outArguments.has(a.attacker)
    );
    return `Defended: All ${attackers.length} attackers are defeated`;
  }
  
  if (status === 'out') {
    const defeaters = attacks.filter(
      a => a.attacked === arg.id && extension.inArguments.has(a.attacker)
    );
    return `Defeated by: ${defeaters.map(d => d.attacker).join(', ')}`;
  }
  
  // UNDEC
  return "Undecided: Part of mutual defeat cycle or undefended";
}
```

**Key Features**:
- Expandable argument cards (show structure on click)
- Explanation tooltips (hover "Why?" → see reason)
- Search/filter arguments (by conclusion, premises)
- Sort by complexity, status, premise count
- Export list as CSV/JSON

**Estimated Lines**: ~250 lines

---

### Chunk 4: RationalityChecklist (2 days)

**Goal**: Validate theory quality using rationality postulates

**Components to Create**:
- `components/aspic/RationalityChecklist.tsx` (main checklist)
- `components/aspic/PostulateCard.tsx` (single postulate display)
- `components/aspic/ViolationDetails.tsx` (drill-down on failures)
- `components/aspic/RationalityReport.tsx` (comprehensive report)

**Backend Integration**:
```typescript
// lib/aspic/rationality.ts already exists!
import {
  checkRationalityPostulates,
  checkWellDefinedness,
  generateRationalityReport
} from '@/lib/aspic/rationality';

// Use in API response
const rationality = checkRationalityPostulates(extension, args, theory);
const wellDefined = checkWellDefinedness(theory);
```

**UI Design**:
```tsx
┌─────────────────────────────────────────────────────┐
│  Rationality Validation                             │
│  ──────────────────────────────────────────────────│
│                                                     │
│  Overall Status: ✅ RATIONAL (all postulates met)  │
│                                                     │
│  📋 Well-Formedness Checks                         │
│  ├─ ✅ Contrary Well-Formedness                    │
│  │   No axioms have contraries                     │
│  │   No strict conclusions have contraries          │
│  ├─ ✅ Transposition Closure                       │
│  │   All strict rules closed under transposition    │
│  └─ ✅ Contraposition Closure                      │
│      Unary strict rules closed under contraposition │
│                                                     │
│  🎯 Rationality Postulates                         │
│  ├─ ✅ Sub-argument Closure                        │
│  │   All sub-arguments of IN args are IN           │
│  │   [Details: 8/8 arguments pass]                 │
│  ├─ ✅ Strict Closure                              │
│  │   Extension closed under strict rules           │
│  │   [Details: 3/3 rules checked]                  │
│  ├─ ✅ Direct Consistency                          │
│  │   No contradictory conclusions in extension     │
│  │   [Details: 0 conflicts found]                  │
│  └─ ✅ Indirect Consistency                        │
│      Closure under strict rules is consistent      │
│      [Details: 15 conclusions checked]             │
│                                                     │
│  [Generate Report] [Export PDF] [View Violations]  │
└─────────────────────────────────────────────────────┘
```

**Violation Display** (when postulate fails):
```tsx
┌─────────────────────────────────────────────────────┐
│  ❌ Direct Consistency FAILED                      │
│  ──────────────────────────────────────────────────│
│                                                     │
│  Found 2 contradictory conclusions in extension:    │
│                                                     │
│  Violation 1:                                       │
│  ├─ A3 concludes: flies                            │
│  ├─ A5 concludes: ¬flies                           │
│  └─ Both are IN the grounded extension             │
│     → Extension contains logical contradiction      │
│                                                     │
│  Violation 2:                                       │
│  ├─ A7 concludes: p                                │
│  ├─ A9 concludes: ¬p                               │
│  └─ Both are IN the grounded extension             │
│     → Extension contains logical contradiction      │
│                                                     │
│  Recommendation: Check preference ordering          │
│  ├─ Add preference: A3 > A5 or A5 > A3            │
│  └─ Or modify contraries function                  │
│                                                     │
│  [View Detailed Analysis] [Suggest Fixes]           │
└─────────────────────────────────────────────────────┘
```

**Key Features**:
- Green/red status indicators (✅/❌)
- Expandable postulate explanations (click → see definition)
- Violation drill-down (show specific arguments involved)
- Fix suggestions (when violations detected)
- Generate comprehensive PDF report

**Estimated Lines**: ~300 lines

---

## Component Specifications

### AspicTheoryPanel (Main Container)

**File**: `components/aspic/AspicTheoryPanel.tsx`

**Props**:
```typescript
interface AspicTheoryPanelProps {
  deliberationId: string;
  initialView?: 'theory' | 'graph' | 'extension' | 'rationality';
}
```

**State**:
```typescript
const [view, setView] = useState<'theory' | 'graph' | 'extension' | 'rationality'>('theory');
const [theory, setTheory] = useState<AspicTheory | null>(null);
const [semantics, setSemantics] = useState<AspicSemantics | null>(null);
const [rationality, setRationality] = useState<RationalityCheck | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
```

**Data Fetching**:
```typescript
const { data, error, isLoading } = useSWR(
  `/api/aspic/evaluate?deliberationId=${deliberationId}`,
  fetcher,
  {
    revalidateOnFocus: false,
    dedupingInterval: 60000, // Cache for 1 minute
  }
);
```

**Layout**:
```tsx
<div className="space-y-4">
  {/* Header with view tabs */}
  <div className="flex justify-between items-center">
    <h2 className="text-lg font-bold">ASPIC+ Argumentation Theory</h2>
    <Tabs value={view} onValueChange={setView}>
      <TabsList>
        <TabsTrigger value="theory">Theory</TabsTrigger>
        <TabsTrigger value="graph">Graph</TabsTrigger>
        <TabsTrigger value="extension">Extension</TabsTrigger>
        <TabsTrigger value="rationality">Rationality</TabsTrigger>
      </TabsList>
    </Tabs>
  </div>

  {/* Content based on view */}
  {loading && <LoadingSpinner />}
  {error && <ErrorDisplay error={error} />}
  
  {view === 'theory' && <AspicTheoryViewer theory={theory} />}
  {view === 'graph' && (
    <AttackGraphVisualization 
      arguments={semantics.arguments}
      attacks={semantics.attacks}
      defeats={semantics.defeats}
      extension={semantics.groundedExtension}
    />
  )}
  {view === 'extension' && (
    <GroundedExtensionPanel
      arguments={semantics.arguments}
      extension={semantics.groundedExtension}
      attacks={semantics.attacks}
    />
  )}
  {view === 'rationality' && (
    <RationalityChecklist
      theory={theory}
      extension={semantics.groundedExtension}
      rationality={rationality}
    />
  )}
</div>
```

---

### AspicTheoryViewer

**File**: `components/aspic/AspicTheoryViewer.tsx`

**Props**:
```typescript
interface AspicTheoryViewerProps {
  theory: AspicTheory;
  highlightFormula?: string;  // Optional: highlight usage
}
```

**Key Features**:
- Collapsible sections (SectionCard from existing components)
- Formula highlighting (hover → show where used)
- Rule explanations (tooltip with natural language)
- Copy to clipboard for each section

**Example Rule Display**:
```tsx
<div className="flex items-start gap-2">
  <Badge variant="outline">r1</Badge>
  <div className="flex-1">
    <div className="font-mono text-sm">
      p, q → r
    </div>
    <div className="text-xs text-gray-500 mt-1">
      Modus Ponens: If p and q, then r
    </div>
  </div>
  <Button size="sm" variant="ghost" onClick={() => copyRule('r1')}>
    <Copy className="h-3 w-3" />
  </Button>
</div>
```

---

### AttackGraphVisualization

**File**: `components/aspic/AttackGraphVisualization.tsx`

**Props**:
```typescript
interface AttackGraphVisualizationProps {
  arguments: Argument[];
  attacks: Attack[];
  defeats: Defeat[];
  extension: GroundedExtension;
  onNodeClick?: (arg: Argument) => void;
  onEdgeClick?: (attack: Attack) => void;
}
```

**Technology Stack**:
- **React Flow** for graph rendering
- **@xyflow/react** (latest version)
- Custom node/edge components

**Node Component**:
```tsx
const ArgumentNode = ({ data }: { data: Argument & { status: 'in' | 'out' | 'undec' } }) => {
  const colors = {
    in: 'bg-green-100 border-green-500',
    out: 'bg-red-100 border-red-500',
    undec: 'bg-amber-100 border-amber-500',
  };
  
  return (
    <div className={`px-3 py-2 rounded-lg border-2 ${colors[data.status]}`}>
      <div className="text-xs font-mono">{data.id}</div>
      <div className="text-sm font-semibold">{data.conclusion}</div>
      {data.status === 'in' && <span className="text-xs">✅</span>}
      {data.status === 'out' && <span className="text-xs">❌</span>}
      {data.status === 'undec' && <span className="text-xs">⚠️</span>}
    </div>
  );
};
```

**Edge Component**:
```tsx
const AttackEdge = ({ data }: { data: Attack & { isDefeat: boolean } }) => {
  const colors = {
    undermining: '#6B7280',
    rebutting: '#DC2626',
    undercutting: '#F59E0B',
  };
  
  return (
    <g>
      <path
        stroke={colors[data.type]}
        strokeWidth={data.isDefeat ? 3 : 2}
        strokeDasharray={data.isDefeat ? '0' : '5,5'}
        markerEnd="url(#arrowhead)"
      />
      {data.type && (
        <text className="text-xs fill-gray-600">
          {data.type}
        </text>
      )}
    </g>
  );
};
```

---

### GroundedExtensionPanel

**File**: `components/aspic/GroundedExtensionPanel.tsx`

**Props**:
```typescript
interface GroundedExtensionPanelProps {
  arguments: Argument[];
  extension: GroundedExtension;
  attacks: Attack[];
}
```

**Layout**:
```tsx
<div className="space-y-4">
  {/* Summary Stats */}
  <ExtensionStats
    inCount={extension.inArguments.size}
    outCount={extension.outArguments.size}
    undecCount={extension.undecidedArguments.size}
  />
  
  {/* IN Arguments */}
  <SectionCard title="✅ Justified Arguments (IN)">
    {inArguments.map(arg => (
      <ArgumentStatusCard
        key={arg.id}
        argument={arg}
        status="in"
        explanation={getJustificationExplanation(arg, 'in', attacks, extension)}
      />
    ))}
  </SectionCard>
  
  {/* OUT Arguments */}
  <SectionCard title="❌ Defeated Arguments (OUT)">
    {outArguments.map(arg => (
      <ArgumentStatusCard
        key={arg.id}
        argument={arg}
        status="out"
        explanation={getJustificationExplanation(arg, 'out', attacks, extension)}
      />
    ))}
  </SectionCard>
  
  {/* UNDEC Arguments */}
  {undecArguments.length > 0 && (
    <SectionCard title="⚠️ Undecided Arguments">
      {undecArguments.map(arg => (
        <ArgumentStatusCard
          key={arg.id}
          argument={arg}
          status="undec"
          explanation={getJustificationExplanation(arg, 'undec', attacks, extension)}
        />
      ))}
    </SectionCard>
  )}
</div>
```

---

### RationalityChecklist

**File**: `components/aspic/RationalityChecklist.tsx`

**Props**:
```typescript
interface RationalityChecklistProps {
  theory: AspicTheory;
  extension: GroundedExtension;
  rationality: RationalityCheck;
}
```

**Layout**:
```tsx
<div className="space-y-4">
  {/* Overall Status */}
  <Card className={rationality.isRational ? 'border-green-500' : 'border-red-500'}>
    <CardHeader>
      <CardTitle>
        {rationality.isRational ? '✅ RATIONAL' : '❌ NOT RATIONAL'}
      </CardTitle>
    </CardHeader>
  </Card>
  
  {/* Well-Formedness */}
  <SectionCard title="📋 Well-Formedness Checks">
    <PostulateCard
      name="Contrary Well-Formedness"
      passed={rationality.contraryWellFormedness}
      violations={rationality.violations.filter(v => v.includes('Contrary'))}
    />
    <PostulateCard
      name="Transposition Closure"
      passed={rationality.transpositionClosure}
      violations={rationality.violations.filter(v => v.includes('Transposition'))}
    />
    <PostulateCard
      name="Contraposition Closure"
      passed={rationality.contrapositionClosure}
      violations={rationality.violations.filter(v => v.includes('Contraposition'))}
    />
  </SectionCard>
  
  {/* Rationality Postulates */}
  <SectionCard title="🎯 Rationality Postulates">
    <PostulateCard
      name="Sub-argument Closure"
      passed={rationality.subArgumentClosure}
      description="All sub-arguments of IN arguments are also IN"
      violations={rationality.violations.filter(v => v.includes('Sub-argument'))}
    />
    <PostulateCard
      name="Strict Closure"
      passed={rationality.strictClosure}
      description="Extension closed under strict rules"
      violations={rationality.violations.filter(v => v.includes('Strict'))}
    />
    <PostulateCard
      name="Direct Consistency"
      passed={rationality.directConsistency}
      description="No contradictory conclusions in extension"
      violations={rationality.violations.filter(v => v.includes('Direct'))}
    />
    <PostulateCard
      name="Indirect Consistency"
      passed={rationality.indirectConsistency}
      description="Closure under strict rules is consistent"
      violations={rationality.violations.filter(v => v.includes('Indirect'))}
    />
  </SectionCard>
</div>
```

---

## API Integration

### Endpoint: GET /api/aspic/evaluate

**Purpose**: Compute complete ASPIC+ semantics for a deliberation

**Query Parameters**:
- `deliberationId` (required): Deliberation to evaluate

**Response** (see [Architecture](#api-response-format) section for full structure)

**Implementation** (if not exists):

**File**: `app/api/aspic/evaluate/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { evaluateAifWithAspic } from "@/lib/aif/translation/aifToAspic";
import { checkRationalityPostulates } from "@/lib/aspic/rationality";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const deliberationId = searchParams.get("deliberationId");

    if (!deliberationId) {
      return NextResponse.json(
        { error: "deliberationId is required" },
        { status: 400 }
      );
    }

    // 1. Fetch AIF graph from database
    const aifNodes = await prisma.aifNode.findMany({
      where: { deliberationId },
      include: { edges: true },
    });

    // Convert to AIFGraph format
    const aifGraph = {
      nodes: aifNodes,
      edges: aifNodes.flatMap(n => n.edges || []),
    };

    // 2. Translate to ASPIC+ and compute semantics
    const result = evaluateAifWithAspic(aifGraph);

    // 3. Check rationality
    const rationality = checkRationalityPostulates(
      result.semantics.groundedExtension,
      result.semantics.arguments,
      result.theory
    );

    // 4. Return complete result
    return NextResponse.json({
      theory: result.theory,
      semantics: result.semantics,
      rationality,
    });
  } catch (error: any) {
    console.error("Error evaluating ASPIC+ theory:", error);
    return NextResponse.json(
      {
        error: "Failed to evaluate ASPIC+ theory",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
```

---

## Testing Strategy

### Unit Tests

**File**: `tests/components/aspic/AspicTheoryViewer.test.tsx`

```typescript
describe("AspicTheoryViewer", () => {
  it("should display language formulas", () => {
    const theory = createMockTheory();
    render(<AspicTheoryViewer theory={theory} />);
    expect(screen.getByText("p")).toBeInTheDocument();
  });

  it("should display strict rules", () => {
    const theory = createMockTheory();
    render(<AspicTheoryViewer theory={theory} />);
    expect(screen.getByText(/p → q/)).toBeInTheDocument();
  });

  it("should collapse/expand sections", async () => {
    const theory = createMockTheory();
    render(<AspicTheoryViewer theory={theory} />);
    const rulesSection = screen.getByText("Rules");
    fireEvent.click(rulesSection);
    // Assert section collapsed
  });
});
```

### Integration Tests

**File**: `tests/integration/aspic-ui-integration.test.tsx`

```typescript
describe("ASPIC UI Integration", () => {
  it("should fetch and display theory for deliberation", async () => {
    const deliberationId = "test-delib-123";
    
    // Mock API response
    mockFetch(`/api/aspic/evaluate?deliberationId=${deliberationId}`, {
      theory: mockTheory,
      semantics: mockSemantics,
      rationality: mockRationality,
    });

    render(<AspicTheoryPanel deliberationId={deliberationId} />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText("ASPIC+ Argumentation Theory")).toBeInTheDocument();
    });

    // Verify theory displayed
    expect(screen.getByText(/Language/)).toBeInTheDocument();
  });
});
```

### E2E Tests

**File**: `tests/e2e/aspic-tab.spec.ts`

```typescript
test("User can view ASPIC+ theory in DeepDivePanelV2", async ({ page }) => {
  // Navigate to deliberation
  await page.goto("/room/test-delib-123");

  // Click ASPIC tab
  await page.click('button:has-text("ASPIC")');

  // Wait for theory to load
  await page.waitForSelector('text=ASPIC+ Argumentation Theory');

  // Verify sections present
  await expect(page.locator('text=Language')).toBeVisible();
  await expect(page.locator('text=Rules')).toBeVisible();
  await expect(page.locator('text=Knowledge Base')).toBeVisible();

  // Switch to graph view
  await page.click('button:has-text("Graph")');
  await page.waitForSelector('.react-flow');

  // Verify graph rendered
  const nodes = await page.locator('.react-flow__node').count();
  expect(nodes).toBeGreaterThan(0);
});
```

---

## Success Criteria

### Phase 8B Complete When:

**Chunk 1 (AspicTheoryViewer)**:
- ✅ Theory structure displayed (language, rules, KB, contraries)
- ✅ Collapsible sections work
- ✅ Export functions (JSON, text) work
- ✅ No TypeScript errors
- ✅ Unit tests pass

**Chunk 2 (AttackGraphVisualization)**:
- ✅ Graph renders with React Flow
- ✅ Nodes colored by justification status
- ✅ Edges styled by attack type
- ✅ Click interactions work (node → detail panel)
- ✅ Layout controls work (zoom, fit, layouts)
- ✅ Unit tests pass

**Chunk 3 (GroundedExtensionPanel)**:
- ✅ IN/OUT/UNDEC arguments displayed
- ✅ Justification explanations shown
- ✅ Search/filter works
- ✅ Export works
- ✅ Unit tests pass

**Chunk 4 (RationalityChecklist)**:
- ✅ All postulates checked
- ✅ Violations displayed with details
- ✅ Report generation works
- ✅ Unit tests pass

**Integration**:
- ✅ All components work together in AspicTheoryPanel
- ✅ SWR data fetching works
- ✅ No performance issues (< 1s load for typical deliberation)
- ✅ Responsive design (works on mobile)
- ✅ Integration tests pass
- ✅ E2E tests pass

**Documentation**:
- ✅ Component README created
- ✅ API documentation updated
- ✅ User guide section added to `/docs/cq-dialogue-ludics-flow.md`

---

## Timeline

### Week 1: Core Components

**Day 1-2**: Chunk 1 (AspicTheoryViewer)
- Create component structure
- Implement data display
- Add export functions
- Write unit tests

**Day 3-4**: Chunk 2 (AttackGraphVisualization)
- Set up React Flow
- Create node/edge components
- Implement interactions
- Write unit tests

**Day 5**: Integration & Testing
- Integrate Chunks 1-2
- End-to-end testing
- Bug fixes

### Week 2: Evaluation & Polish

**Day 6-7**: Chunk 3 (GroundedExtensionPanel)
- Create extension display
- Add justification explanations
- Implement search/filter
- Write unit tests

**Day 8-9**: Chunk 4 (RationalityChecklist)
- Create postulate cards
- Add violation displays
- Implement report generation
- Write unit tests

**Day 10**: Final Integration & Documentation
- Integrate all chunks
- Performance optimization
- Update documentation
- Create demo video

---

## Next Steps

### Immediate (After Approval):

1. **Create Component Directory**:
   ```bash
   mkdir -p components/aspic
   touch components/aspic/AspicTheoryPanel.tsx
   touch components/aspic/AspicTheoryViewer.tsx
   ```

2. **Create API Endpoint** (if doesn't exist):
   ```bash
   mkdir -p app/api/aspic/evaluate
   touch app/api/aspic/evaluate/route.ts
   ```

3. **Install Dependencies**:
   ```bash
   yarn add @xyflow/react
   yarn add -D @types/d3  # If using D3 later
   ```

4. **Start Chunk 1**:
   - Create AspicTheoryPanel skeleton
   - Implement SWR data fetching
   - Create AspicTheoryViewer with mock data

### After Phase 8B:

**Phase 5: Ludics Interactive Features**
- Users will understand ASPIC+ theories
- Commitment stores make sense
- Faxing/delocalization can leverage ASPIC+ UI

---

## Open Questions

1. **Graph Library**: Confirm React Flow vs D3 vs Cytoscape?
   - **Recommendation**: Start with React Flow

2. **Performance**: Large deliberations (> 100 arguments)?
   - **Mitigation**: Pagination, virtualization, WebGL rendering

3. **Export Formats**: What formats needed beyond JSON?
   - LaTeX? GraphML? TPTP? Prolog?

4. **Mobile Support**: Full-featured or simplified view?
   - **Recommendation**: Responsive, but graph may be desktop-only

5. **Real-time Updates**: Should theory refresh automatically?
   - **Recommendation**: Manual refresh button initially, auto-refresh later

---

## Appendix

### Related Documentation

- `/docs/cq-dialogue-ludics-flow.md` - CQ integration guide
- `/docs/arg-computation-research/PHASE_1D_CONFLICT_APPLICATION_ENHANCEMENT.md` - ASPIC+ implementation
- `/lib/aspic/README.md` - ASPIC+ library documentation (create if missing)

### Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **TailwindCSS** - Styling
- **SWR** - Data fetching
- **React Flow** - Graph visualization
- **Shadcn/ui** - UI components (Button, Card, Tabs, etc.)

### Team Resources

- **ASPIC+ Theory**: See research papers in `/docs/arg-computation-research/`
- **Existing Components**: Reuse SectionCard, Collapsible, Badge from `/components/ui/`
- **API Patterns**: Follow existing `/api/` structure

---

**End of Phase 8B Roadmap** ✅

Ready to start implementation? Let me know which chunk to begin with!
