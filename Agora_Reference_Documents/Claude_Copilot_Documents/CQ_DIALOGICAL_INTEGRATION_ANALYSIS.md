# Critical Questions & Dialogical Moves Integration Analysis

**Date:** October 21, 2025  
**Author:** GitHub Copilot  
**Purpose:** Assess current integration of CQs and dialogical moves across components, identify gaps, and propose integration plan

---

## Executive Summary

**Current State:** CQs and dialogical moves (WHY/GROUNDS) are **partially integrated** into new components. The integration exists but is **incomplete** and **inconsistent**.

**Key Findings:**
- ✅ **ClaimMiniMap** - FULLY integrated with CriticalQuestionsV2 + LegalMoveChips
- ✅ **AIFArgumentsListPro** - Has LegalMoveToolbar for dialogical moves  
- ⚠️ **CommandCard** - Has dialogical move support but **NOT connected to CQs**
- ❌ **CegMiniMap** - **NO CQ or dialogical move integration**
- ❌ **AttackMenuPro** - **NO CQ integration**, only attack types
- ❌ **GraphExplorer** - **NO CQ or dialogical move integration**

**Recommendation:** Integrate CQs and dialogical moves into CommandCard, CegMiniMap, and other "new" components to achieve feature parity with ClaimMiniMap.

---

## Component Integration Matrix

| Component | Type | CQs | Dialogical Moves | Status | Priority |
|-----------|------|-----|------------------|--------|----------|
| **ClaimMiniMap** | New/Active | ✅ Full | ✅ Full (LegalMoveChips) | 🟢 Complete | - |
| **AIFArgumentsListPro** | New/Active | ❌ None | ✅ Partial (LegalMoveToolbar) | 🟡 Partial | High |
| **CegMiniMap** | New/Active | ❌ None | ❌ None | 🔴 None | **Critical** |
| **CommandCard** | New/Active | ❌ None | ✅ Partial (adapters exist) | 🟡 Partial | **Critical** |
| **AttackMenuPro** | New/Active | ❌ None | ❌ None | 🔴 None | High |
| **GraphExplorer** | New/Active | ❌ None | ❌ None | 🔴 None | Medium |
| **SchemeComposer** | New/Active | ❌ None | ✅ Full (LegalMoveToolbarAIF) | 🟡 Partial | High |
| **DeepDivePanelV2** | New/Active | ❌ None | ✅ Partial (CommandCard) | 🟡 Partial | High |
| **DialogicalPanel** | Legacy | ✅ Old Version | ✅ Full | 🟠 Legacy | - |
| **ArgumentsList** | Legacy | ✅ Old Version | ❌ None | 🟠 Legacy | - |

**Legend:**
- 🟢 Complete: Fully integrated with current systems
- 🟡 Partial: Some integration but incomplete
- 🔴 None: No integration
- 🟠 Legacy: Old component, will be phased out

---

## Detailed Component Analysis

### 1. ClaimMiniMap ✅ FULLY INTEGRATED

**File:** `components/claims/ClaimMiniMap.tsx`

**Integration Status:** ✅ Complete

**Features:**
- Imports `CriticalQuestionsV2`
- Imports `LegalMoveChips`
- Displays CQ status badges: `CQ 75%` (satisfaction percentage)
- Displays dialogical status: `G:1` (GROUNDS count), `?2` (open WHY count)
- "CQs" button opens Dialog with CriticalQuestions component
- "Moves" button shows LegalMoveChips for dialogical actions
- Enrichment logic computes WHY/GROUNDS pairing

**Code Evidence:**
```typescript
// Line 13-14
import CriticalQuestions from '@/components/claims/CriticalQuestionsV2';
import { LegalMoveChips } from '@/components/dialogue/LegalMoveChips';

// Line 237-254: Enrichment logic
const whyMoves = movesForClaim.filter(m => m.kind === 'WHY');
const groundsMoves = movesForClaim.filter(m => m.kind === 'GROUNDS');
const openWhys = whyMoves.filter(w => 
  !groundsMoves.some(g => 
    g.payload.cqId === w.payload.cqId && 
    new Date(g.createdAt) > new Date(w.createdAt)
  )
);

// Line 418: LegalMoveChips
<LegalMoveChips
  deliberationId={deliberationId}
  targetType="claim"
  targetId={claim.id}
/>

// Line 497: CriticalQuestions modal
<CriticalQuestions
  targetType="claim"
  targetId={cqOpenFor}
  deliberationId={deliberationId}
/>
```

**Verdict:** ✅ **Perfect example to follow** - this is the gold standard

---

### 2. AIFArgumentsListPro ⚠️ PARTIAL INTEGRATION

**File:** `components/arguments/AIFArgumentsListPro.tsx`

**Integration Status:** 🟡 Partial (has dialogical moves, NO CQs)

**Current Features:**
- Dynamic import of `LegalMoveToolbar`
- Dynamic import of `AttackMenuPro`
- Displays argument cards with AIF metadata
- Shows CQ counts in metadata: `cq?: { required: number; satisfied: number }`
- Has LegalMoveToolbar at line 818

**Missing:**
- No CriticalQuestions component integration
- No way to open CQ dialog for arguments
- No CQ badges on argument cards
- CQ data is fetched but not actionable

**Code Evidence:**
```typescript
// Line 36: Has LegalMoveToolbar
const LegalMoveToolbar = dynamic(() => 
  import('@/components/dialogue/LegalMoveToolbar').then(m => m.LegalMoveToolbar), 
  { ssr: false }
);

// Line 59: AIF metadata includes CQ
type AifMeta = {
  scheme?: { ... };
  attacks?: { ... };
  cq?: { required: number; satisfied: number };  // ← CQ data present
  preferences?: { ... };
};

// Line 818: LegalMoveToolbar rendered
<LegalMoveToolbar
  deliberationId={deliberationId}
  targetType="argument"
  targetId={arg.id}
  onPerform={...}
/>
```

**Integration Gap:**
- CQ data is available in `AifMeta` type
- CQ counts are computed but not displayed
- No button or UI to open CriticalQuestions dialog
- No visual indication of CQ status on cards

**Recommendation:** Add CQ button to argument cards, similar to ClaimMiniMap's "CQs" button

---

### 3. CegMiniMap ❌ NO INTEGRATION

**File:** `components/deepdive/CegMiniMap.tsx`

**Integration Status:** 🔴 None

**Current Features:**
- Graph visualization of claims (CEG = Claim Evaluation Graph)
- Force/hierarchical/radial/cluster layouts
- Shows node labels (IN/OUT/UNDEC)
- Renders edges (attacks, supports)
- Click handlers for claim selection

**Missing:**
- No CriticalQuestions integration
- No dialogical move UI
- No CQ status badges on nodes
- No WHY/GROUNDS indicators
- No legal move buttons

**Code Evidence:**
```typescript
// Line 1-15: Component interface
interface CegMiniMapProps {
  deliberationId: string;
  selectedClaimId?: string | null;
  onSelectClaim?: (claimId: string) => void;
  width?: number;
  height?: number;
  viewMode?: 'graph' | 'clusters' | 'controversy' | 'flow';
}
// No CQ or dialogical props
```

**Integration Gap:**
- Graph nodes should show CQ badges (e.g., "CQ 75%")
- Nodes should show open WHY counts (e.g., "?2")
- Click on node could open CriticalQuestions dialog
- Hovering could show legal moves tooltip

**Recommendation:** **CRITICAL** - Add CQ overlays to graph nodes

---

### 4. CommandCard ⚠️ PARTIAL INTEGRATION

**File:** `components/dialogue/command-card/CommandCard.tsx`

**Integration Status:** 🟡 Partial (has dialogical move support, NOT connected to CQs)

**Current Features:**
- Renders 3x3 grid of action buttons
- Supports WHY, GROUNDS, CONCEDE, RETRACT, CLOSE moves
- Has `legalMovesToCommandCard` adapter (line 16 in adapters.ts)
- Used in DeepDivePanelV2 with legal moves

**Code Evidence:**
```typescript
// adapters.ts line 6
export type ServerMove = {
  kind: 'ASSERT'|'WHY'|'GROUNDS'|'RETRACT'|'CONCEDE'|'CLOSE';
  label: string;
  payload?: any;  // ← includes cqId
  // ...
};

// adapters.ts line 28-32: Maps WHY/GROUNDS
kind:
  m.kind === 'WHY' ? 'WHY' :
  m.kind === 'GROUNDS' ? 'GROUNDS' :
  m.kind === 'CONCEDE' ? 'CONCEDE' :
  m.kind === 'RETRACT' ? 'RETRACT' :
  m.kind === 'CLOSE' ? 'CLOSE' : 'WHY',
```

**Integration Gap:**
- CommandCard can render WHY/GROUNDS moves from `/api/dialogue/legal-moves`
- But there's **no CQ context** shown
- Users see "Answer E1" button but don't know what E1 is
- No way to view all CQs for the target
- No satisfaction status shown

**Current Usage in DeepDivePanelV2:**
```typescript
// Line 707: Adapts legal moves to CommandCard
const cardActions = useMemo(() => {
  if (!targetRef || !legalMoves?.moves) return [];
  return legalMovesToCommandCard(legalMoves.moves, targetRef, true);
}, [targetRef, legalMoves]);

// Line 910: Renders CommandCard
<CommandCard
  actions={cardActions}
  onPerform={handleCommandPerform}
/>
```

**Problem:** User sees "Answer E1" but has no idea:
- What question E1 is asking
- Which scheme it belongs to
- Whether other CQs are satisfied
- Full text of the critical question

**Recommendation:** **CRITICAL** - Add CQ context panel above/below CommandCard

---

### 5. AttackMenuPro ❌ NO INTEGRATION

**File:** `components/arguments/AttackMenuPro.tsx`

**Integration Status:** 🔴 None

**Current Features:**
- Dialog for attacking arguments
- Attack types: REBUT, UNDERCUT, UNDERMINE
- Uses `SchemeComposerPicker` to construct attacks
- "Counter" button triggers attack dialog

**Missing:**
- No CriticalQuestions integration
- No dialogical move UI
- Attacks are created but not paired with WHY moves
- No CQ satisfaction workflow

**Code Evidence:**
```typescript
// Line 23: Component interface
export function AttackMenuPro({
  deliberationId,
  authorId,
  target,  // ← Has conclusion and premises
  onDone,
}: {
  deliberationId: string;
  authorId: string;
  target: { id: string; conclusion: ClaimRef; premises: Prem[] };
  onDone?: () => void;
}) {
  // No CQ or dialogical move props
}
```

**Integration Gap:**
- Attacks could be paired with WHY moves
- CQs could guide attack construction
- Scheme-based attacks should trigger CQ workflow
- No connection to CriticalQuestions component

**Recommendation:** When user clicks "Counter", show CQs first before attack menu

---

### 6. GraphExplorer ❌ NO INTEGRATION

**File:** `components/graph/GraphExplorer.tsx` (assumed, not found in grep)

**Integration Status:** 🔴 None (component may not exist or be named differently)

**Note:** No grep matches found. Likely integrated into DeepDivePanelV2 or CegMiniMap.

---

### 7. SchemeComposer ⚠️ PARTIAL INTEGRATION

**File:** `components/arguments/SchemeComposer.tsx`

**Integration Status:** 🟡 Partial (has dialogical moves via LegalMoveToolbarAIF)

**Current Features:**
- Imports `LegalMoveToolbarAIF`
- Renders legal move toolbar at lines 554, 580
- Allows scheme-based argument construction

**Missing:**
- No CriticalQuestions integration
- CQs are generated when scheme is applied, but not shown
- No way to satisfy CQs during construction

**Code Evidence:**
```typescript
// Line 11
import { LegalMoveToolbarAIF } from "@/components/dialogue/LegalMoveToolbarAIF";

// Line 554, 580
<LegalMoveToolbarAIF
  deliberationId={deliberationId}
  targetType="argument"
  targetId={...}
  onPerform={...}
/>
```

**Recommendation:** Show CQs inline during scheme composition

---

### 8. DeepDivePanelV2 ⚠️ PARTIAL INTEGRATION

**File:** `components/deepdive/DeepDivePanelV2.tsx`

**Integration Status:** 🟡 Partial (uses CommandCard with legal moves)

**Current Features:**
- Imports `CommandCard`, `ClaimMiniMap`, `CegMiniMap`, `AIFArgumentsListPro`
- Uses `legalMovesToCommandCard` adapter (line 707)
- Renders CommandCard at lines 910, 1071
- Has ClaimMiniMap at line 1261 (which DOES have CQs)
- Has AIFArgumentsListPro at line 1338

**Integration Structure:**
```
DeepDivePanelV2
├── Left Sheet: Graph Explorer
│   ├── selectedClaim: ClaimInfo
│   ├── CommandCard (with legal moves) ← NO CQ CONTEXT
│   └── CegMiniMap ← NO CQs
└── Main Content
    ├── ClaimMiniMap ← ✅ HAS CQs
    └── AIFArgumentsListPro ← ⚠️ HAS LegalMoveToolbar, NO CQs
```

**Problem:** Inconsistent CQ integration across the panel:
- ClaimMiniMap: Full CQ support
- CommandCard: Legal moves without CQ context
- CegMiniMap: No CQ support
- AIFArgumentsListPro: CQ data but no UI

**Recommendation:** Unify CQ integration across all sub-components

---

## Legacy Components (To Be Phased Out)

### DialogicalPanel 🟠 LEGACY

**File:** `components/dialogue/DialogicalPanel.tsx`

**Integration Status:** 🟠 Legacy (uses OLD CriticalQuestions)

**Features:**
- Line 25: Imports OLD `CriticalQuestions` (not V2)
- Line 1318: Renders CriticalQuestions
- Has full dialogical move support
- Tree-based dialogue view

**Issue:** Uses outdated CriticalQuestions version

**Action:** Update to CriticalQuestionsV2 or deprecate

---

### ArgumentsList 🟠 LEGACY

**File:** `components/deepdive/ArgumentsList.tsx`

**Integration Status:** 🟠 Legacy (uses OLD CriticalQuestions)

**Features:**
- Line 58: Imports OLD `CriticalQuestions`
- Line 333: Renders CriticalQuestions
- Line 67: Imports AttackMenuPro
- Line 342: Renders AttackMenuPro

**Issue:** Uses outdated CriticalQuestions version

**Action:** Replace with AIFArgumentsListPro

---

## Integration Gaps Summary

### Critical Gaps (Must Fix)

1. **CegMiniMap** - Graph nodes need CQ badges and dialogical status
2. **CommandCard** - Legal moves need CQ context panel
3. **AttackMenuPro** - No CQ integration for guided attacks

### High Priority Gaps

4. **AIFArgumentsListPro** - Has CQ data but no UI
5. **SchemeComposer** - No CQ display during construction
6. **DeepDivePanelV2** - Inconsistent CQ integration across sub-components

### Medium Priority Gaps

7. **Legacy components** - Update to CriticalQuestionsV2 or deprecate

---

## Proposed Integration Plan

### Phase 1: Critical Fixes (Week 1)

#### Task 1.1: Add CQ Integration to CegMiniMap
**Goal:** Show CQ status on graph nodes

**Changes:**
1. Fetch CQ status for each claim node
2. Add CQ badge overlay to nodes (e.g., "CQ 75%" on node)
3. Add open WHY count (e.g., "?2" badge)
4. On node click → open CriticalQuestions dialog
5. Update node colors based on CQ satisfaction

**Implementation:**
```typescript
// CegMiniMap.tsx additions

// 1. Fetch CQ data
const { data: cqData } = useSWR(
  `/api/cqs?targetType=claim&deliberationId=${deliberationId}`,
  fetcher
);

// 2. Enrich nodes with CQ status
const enrichedNodes = useMemo(() => {
  return nodes.map(node => {
    const cqs = cqData?.filter(cq => cq.targetId === node.id) ?? [];
    const required = cqs.length;
    const satisfied = cqs.filter(cq => cq.satisfied).length;
    const percentage = required > 0 ? (satisfied / required) * 100 : 0;
    
    return {
      ...node,
      cqStatus: { required, satisfied, percentage },
    };
  });
}, [nodes, cqData]);

// 3. Render CQ badge on node
<g>
  <circle {...nodeProps} />
  <text x={x} y={y - 15} className="text-xs">
    {node.label}
  </text>
  {node.cqStatus && (
    <text x={x} y={y + 15} className="text-[10px] fill-indigo-600">
      CQ {Math.round(node.cqStatus.percentage)}%
    </text>
  )}
</g>

// 4. Click handler
const handleNodeClick = (nodeId: string) => {
  setCqDialogOpen(true);
  setSelectedClaimForCQ(nodeId);
};

// 5. CQ Dialog
{cqDialogOpen && (
  <Dialog open={cqDialogOpen} onOpenChange={setCqDialogOpen}>
    <DialogContent>
      <CriticalQuestions
        targetType="claim"
        targetId={selectedClaimForCQ}
        deliberationId={deliberationId}
      />
    </DialogContent>
  </Dialog>
)}
```

**Files to Edit:**
- `components/deepdive/CegMiniMap.tsx`
- Add SWR fetch for CQs
- Add CQ dialog state
- Update node rendering

---

#### Task 1.2: Add CQ Context to CommandCard
**Goal:** Show CQ details above/below CommandCard legal moves

**Changes:**
1. Add `CQContextPanel` component
2. Detect WHY/GROUNDS moves in CommandCard actions
3. Extract `cqId` from move payloads
4. Fetch CQ data for those cqIds
5. Display CQ text, scheme, satisfaction status

**Implementation:**
```typescript
// New file: components/dialogue/command-card/CQContextPanel.tsx

export function CQContextPanel({
  deliberationId,
  targetType,
  targetId,
  actions,
}: {
  deliberationId: string;
  targetType: 'claim' | 'argument';
  targetId: string;
  actions: CommandCardAction[];
}) {
  // 1. Extract cqIds from WHY/GROUNDS moves
  const cqIds = useMemo(() => {
    return actions
      .filter(a => a.kind === 'WHY' || a.kind === 'GROUNDS')
      .map(a => a.move?.payload?.cqId)
      .filter(Boolean);
  }, [actions]);

  // 2. Fetch CQ data
  const { data: cqs } = useSWR(
    cqIds.length > 0 
      ? `/api/cqs?targetType=${targetType}&targetId=${targetId}` 
      : null,
    fetcher
  );

  // 3. Filter to relevant CQs
  const relevantCQs = useMemo(() => {
    return cqs?.filter(cq => cqIds.includes(cq.cqKey)) ?? [];
  }, [cqs, cqIds]);

  if (relevantCQs.length === 0) return null;

  return (
    <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
      <h4 className="text-xs font-semibold text-amber-900 mb-2">
        Critical Questions Context
      </h4>
      <div className="space-y-2">
        {relevantCQs.map(cq => (
          <div key={cq.cqKey} className="text-xs">
            <div className="flex items-start gap-2">
              <span className="font-mono text-amber-700">{cq.cqKey}:</span>
              <span className="text-slate-700 flex-1">{cq.text}</span>
              {cq.satisfied && (
                <CheckCircle className="w-3 h-3 text-emerald-600" />
              )}
            </div>
            <div className="text-[10px] text-slate-500 ml-8">
              Scheme: {cq.schemeKey}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Update CommandCard usage in DeepDivePanelV2:**
```typescript
// DeepDivePanelV2.tsx line ~905

<div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200">
  <h3 className="text-sm font-semibold text-indigo-900 mb-3">
    Quick Actions
  </h3>
  
  {/* NEW: CQ Context Panel */}
  <CQContextPanel
    deliberationId={deliberationId}
    targetType="claim"
    targetId={selectedClaim.id}
    actions={cardActions}
  />
  
  <CommandCard
    actions={cardActions}
    onPerform={handleCommandPerform}
  />
</div>
```

**Files to Create:**
- `components/dialogue/command-card/CQContextPanel.tsx`

**Files to Edit:**
- `components/deepdive/DeepDivePanelV2.tsx`
- Import and render CQContextPanel

---

#### Task 1.3: Add CQ Button to AttackMenuPro
**Goal:** Show CQs before/during attack construction

**Changes:**
1. Add "View Critical Questions" button in AttackMenuPro dialog
2. Fetch CQs for target argument
3. Show CQ panel above attack type selection
4. Optionally: suggest attack types based on unsatisfied CQs

**Implementation:**
```typescript
// AttackMenuPro.tsx additions

import CriticalQuestions from '@/components/claims/CriticalQuestionsV2';

export function AttackMenuPro({ ... }) {
  const [showCQs, setShowCQs] = useState(false);
  
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Challenge This Argument</DialogTitle>
        </DialogHeader>
        
        {/* NEW: CQ toggle button */}
        <button
          onClick={() => setShowCQs(!showCQs)}
          className="text-xs text-indigo-600 underline"
        >
          {showCQs ? 'Hide' : 'View'} Critical Questions
        </button>
        
        {/* NEW: CQ panel */}
        {showCQs && (
          <div className="my-4 p-3 bg-slate-50 rounded-lg">
            <CriticalQuestions
              targetType="argument"
              targetId={target.id}
              deliberationId={deliberationId}
            />
          </div>
        )}
        
        {/* Existing attack menu content */}
        <AttackMenuContent ... />
      </DialogContent>
    </Dialog>
  );
}
```

**Files to Edit:**
- `components/arguments/AttackMenuPro.tsx`

---

### Phase 2: High Priority Fixes (Week 2)

#### Task 2.1: Add CQ UI to AIFArgumentsListPro
**Goal:** Display CQ badges and "CQs" button on argument cards

**Changes:**
1. Add CQ badge to ArgumentCard display
2. Add "CQs" button next to "Counter" button
3. Open CriticalQuestions dialog on click

**Implementation:**
```typescript
// ArgumentCard.tsx additions

<div className="flex items-center gap-2">
  {/* Existing badges */}
  <span className="text-xs text-slate-600">
    +{arg.aif.preferences?.preferredBy || 0}
  </span>
  
  {/* NEW: CQ badge */}
  {arg.aif.cq && arg.aif.cq.required > 0 && (
    <span className="text-xs text-indigo-600">
      CQ {Math.round((arg.aif.cq.satisfied / arg.aif.cq.required) * 100)}%
    </span>
  )}
  
  {/* NEW: CQs button */}
  <button
    onClick={() => {
      setCqDialogOpen(true);
      setSelectedArgForCQ(arg.id);
    }}
    className="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 rounded"
  >
    CQs
  </button>
  
  <AttackMenuPro ... />
</div>
```

**Files to Edit:**
- `components/arguments/ArgumentCard.tsx`
- `components/arguments/AIFArgumentsListPro.tsx`

---

#### Task 2.2: Add CQ Display to SchemeComposer
**Goal:** Show CQs inline during scheme selection

**Changes:**
1. When scheme is selected, fetch its CQs
2. Display CQ preview below scheme card
3. Allow user to pre-satisfy CQs before submitting

**Files to Edit:**
- `components/arguments/SchemeComposer.tsx`

---

#### Task 2.3: Unify CQ Integration in DeepDivePanelV2
**Goal:** Consistent CQ integration across all sub-components

**Changes:**
1. Ensure CegMiniMap shows CQs (from Task 1.1)
2. Ensure CommandCard shows CQ context (from Task 1.2)
3. Ensure AIFArgumentsListPro shows CQ buttons (from Task 2.1)
4. Add CQ summary panel at top of DeepDivePanelV2

**Files to Edit:**
- `components/deepdive/DeepDivePanelV2.tsx`

---

### Phase 3: Cleanup (Week 3)

#### Task 3.1: Update Legacy Components
**Goal:** Migrate to CriticalQuestionsV2 or deprecate

**Changes:**
1. Update DialogicalPanel to use CriticalQuestionsV2
2. Update ArgumentsList to use CriticalQuestionsV2
3. Add deprecation warnings to old components

**Files to Edit:**
- `components/dialogue/DialogicalPanel.tsx`
- `components/deepdive/ArgumentsList.tsx`

---

## Testing Checklist

After integration, test these workflows:

### CegMiniMap Tests
- [ ] CQ badges appear on nodes
- [ ] Open WHY counts show on nodes
- [ ] Click node → CriticalQuestions dialog opens
- [ ] CQ satisfaction updates node color/badge

### CommandCard Tests
- [ ] CQContextPanel shows above CommandCard
- [ ] CQ text and scheme are visible
- [ ] WHY/GROUNDS moves reference correct CQs
- [ ] Satisfied CQs show checkmark

### AttackMenuPro Tests
- [ ] "View Critical Questions" button visible
- [ ] CQ panel toggles on/off
- [ ] CQs for target argument display correctly
- [ ] Attack suggestions based on unsatisfied CQs (optional)

### AIFArgumentsListPro Tests
- [ ] CQ badges show on argument cards
- [ ] "CQs" button opens dialog
- [ ] CriticalQuestions dialog loads correct argument CQs
- [ ] LegalMoveToolbar still functions

### End-to-End Tests
- [ ] User flow: ClaimMiniMap → CQs → WHY → GROUNDS works
- [ ] User flow: CegMiniMap → click node → CQs → WHY works
- [ ] User flow: AIFArgumentsListPro → CQs → WHY works
- [ ] User flow: AttackMenuPro → View CQs → construct attack works
- [ ] Bus events trigger UI updates across all components

---

## API Endpoints Required

All integrations depend on these endpoints:

1. **GET /api/cqs** - Fetch CQs for target
   - Query params: `targetType`, `targetId`, `deliberationId`
   
2. **POST /api/cqs/toggle** - Toggle CQ satisfaction
   
3. **GET /api/dialogue/legal-moves** - Fetch legal dialogical moves
   - Query params: `deliberationId`, `targetType`, `targetId`
   
4. **POST /api/dialogue/move** - Post WHY/GROUNDS/etc move
   
5. **GET /api/deliberations/{id}/moves** - Fetch all moves

All endpoints already exist and are functional.

---

## Summary

**Current State:**
- ✅ ClaimMiniMap is fully integrated (gold standard)
- ⚠️ AIFArgumentsListPro, CommandCard, SchemeComposer are partially integrated
- ❌ CegMiniMap, AttackMenuPro have NO integration

**Proposed Plan:**
- **Phase 1 (Week 1):** Fix critical gaps (CegMiniMap, CommandCard, AttackMenuPro)
- **Phase 2 (Week 2):** Complete high priority gaps (AIFArgumentsListPro, SchemeComposer, DeepDivePanelV2)
- **Phase 3 (Week 3):** Clean up legacy components

**Goal:** Achieve consistent CQ and dialogical move integration across ALL active components, matching the quality of ClaimMiniMap.

---

**Next Steps:**
1. Review this analysis with team
2. Prioritize tasks based on user needs
3. Start with Phase 1, Task 1.1 (CegMiniMap integration)
4. Test thoroughly after each task
5. Document new patterns in developer guide
