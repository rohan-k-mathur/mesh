# Deliberation Panel Audit & Redesign Plan

**Status**: 🎯 CANONICAL ROADMAP - V3 Migration + Overhaul Integration  
**Current Component**: `DeepDivePanelV2.tsx` (2,128 LOC)  
**Goal**: Modernize deliberation UI and integrate Phase 0-4 overhaul features  
**Timeline**: 12 weeks (Weeks 1-5 complete, Weeks 6-12 planned)

---

## Quick Reference

**Related Documents**:
- `DEEPDIVEPANEL_V3_MIGRATION_TRACKER.md` - Progress tracking and metrics
- `WEEK5_COMPLETION_SUMMARY.md` - Week 5 completion report (✅ COMPLETE)
- `DEEPDIVEPANEL_OVERHAUL_INTEGRATION_AUDIT.md` - Component inventory (~25 components)
- `DEEPDIVEPANEL_V3_OVERHAUL_INTEGRATION_PLAN.md` - Detailed integration steps (Weeks 5-8)
- `OVERHAUL_TEST_PAGES_AUDIT.md` - Test page validation (12 pages, all working)
- `OVERHAUL_INTEGRATION_SUMMARY.md` - Executive summary

**Quick Navigation**:
- [Current State Analysis](#current-state-analysis) - What we have now
- [Migration Timeline](#migration-strategy) - Week-by-week plan
- [Phase 4: Overhaul Integration](#phase-4-overhaul-integration-weeks-5-8) - **In Progress** (Week 5 complete)
- [UI/UX Redesign](#uiux-redesign-proposals) - Design proposals
- [Performance](#performance-optimizations) - Optimization strategy
- [Testing](#testing-strategy) - Test approach

---

## Executive Summary

**Situation**: DeepDivePanelV2 has grown to 2,128 LOC and needs modernization. Simultaneously, **Phases 0-4 of the Deliberation System Overhaul are complete** with ~25 production-ready components, ~15 API endpoints, and 12 validated test pages.

**Opportunity**: The V3 migration provides the perfect moment to integrate sophisticated argumentation features (nets, burden of proof, attack generation, scheme navigation) that have been built but not exposed to users.

**Strategy**: 
1. **Weeks 1-4** ✅ - Extract tabs and shared components from V2 (COMPLETE)
2. **Week 5** ✅ - Arguments Tab Enhancement (COMPLETE - 6.5h saved)
3. **Weeks 6-8** 🎯 - Attack Generation & Navigation (**NEXT**)
4. **Weeks 9-10** - Finalize V3 architecture
5. **Weeks 11-12** - Beta, rollout, cleanup

**Key Insight**: We're not building new features in Weeks 5-8. We're **exposing 36 hours of integration work to unlock months of completed development**.

**Total Migration Effort**: 
- Weeks 1-4: ~24 hours (tab extraction)
- Week 5: 1.5 hours actual (8h estimated - 81% time savings!)
- Weeks 6-8: ~28 hours remaining (overhaul integration) 
- Weeks 9-12: ~20 hours (polish and rollout)
- **Total**: ~73.5 hours over 12 weeks (revised from 80h)

---
## Current State Analysis

### Component Overview: DeepDivePanelV2.tsx

**Size**: 2,128 lines  
**Imports**: 73 components/utilities  
**Main Features**: 9 tabs with extensive functionality

#### Tab Structure (Current)
```
1. Debate (Main Discussion)
   - Proposition Composer
   - Claims MiniMap
   - Dialogue Inspector
   - Issues List
   - Assumptions Management
   
2. Arguments (AIF Arguments)
   - AIFArgumentsListPro
   - Argument Actions Sheet
   
3. Dialogue (Formal Dialogue System)
   - Ludics compilation
   - Behaviour Inspector
   - Legal moves tracking
   
4. Ludics (Game Theory)
   - Pro/Opp compilation
   - Behaviour trees
   
5. Admin (Management)
   - Works system
   - Approvals
   - Topology widget
   
6. Sources (Evidence)
   - Evidence List
   - Citation management
   
7. Thesis (Legal-style Arguments)
   - Thesis composer
   - Thesis list
   
8. ASPIC (Structured Argumentation)
   - ASPIC Theory Panel
   - Attack structures
   
9. Analytics (Metrics)
   - Categorical analysis
   - HomSet comparison
```

### Floating Sheets (3)
1. **Left Sheet**: Graph Explorer (Arguments + Claims)
   - AFMinimap visualization
   - Dialogue Actions
   - CommandCard
   
2. **Right Sheet**: Actions HUD
   - CQ Context Panel
   - Argument diagram viewer
   
3. **Terms Sheet**: Dictionary/Glossary

### Key UI Patterns Identified

#### ✅ **Strong Patterns to Preserve**
1. **SectionCard Component** - Unified card system with:
   - Title, subtitle, icon
   - Action buttons
   - Footer
   - Loading states
   - Tone variants (info/success/warn/danger)
   - Dense/padded modes

2. **Floating Sheets** - Side panels with:
   - Persistence (localStorage)
   - Badge counts
   - Glass morphism styling
   - Multiple width options

3. **StickyHeader** - Dynamic header with:
   - Scroll detection
   - Backdrop blur
   - Configuration controls

4. **Tab System** - Clear navigation between modes

5. **ChipBar** - Compact metadata display

#### ⚠️ **Patterns Needing Improvement**
1. **Tab Organization** - 9 tabs may be overwhelming
2. **Feature Discoverability** - Advanced features hidden in tabs
3. **Component Coupling** - Some tight coupling between sections
4. **State Management** - Multiple useState hooks (could use reducer)
5. **Performance** - 2,128 LOC with many renders

#### 🔴 **Anti-Patterns to Address**
1. **Monolithic File** - Single 2,128 line component
2. **Mixed Concerns** - API calls, state, rendering in one place
3. **Duplication** - Some repeated patterns across tabs
4. **Magic Numbers** - Hardcoded dimensions, limits
5. **Comment Clutter** - Old commented code (see lines 1920-1930)

---

## Phase 1-4 Integration Opportunities

### 🎯 **Critical Integrations Needed**

#### 1. **Argument Net Visualization** (Phase 4 - COMPLETED)
**Current**: Hidden in separate test page  
**Needed**: Integrate ArgumentNetAnalyzer into main debate flow

**Integration Points**:
- Add "Scheme Analysis" button to argument cards in Debate tab
- Show scheme count badge on multi-scheme arguments
- Optional "Scheme Network" subtab within Arguments tab
- Link to NetGraphWithCQs from argument popout

**UI Mockup**:
```
┌─ Argument Card ───────────────────────────────┐
│ Expert Opinion: Climate science is reliable   │
│ Confidence: 0.92 • Schemes: 3 [Net View →]   │
│                                                │
│ [Support] [Attack] [View CQs] [Analyze Net]  │
└────────────────────────────────────────────────┘
```

#### 2. **Scheme-Specific Critical Questions** (Phase 2 - COMPLETED)
**Current**: Available but not prominently featured  
**Needed**: Highlight CQ system in main flow

**Integration Points**:
- CQ badge on arguments with unanswered questions
- CQ response count in argument cards
- Dedicated "Critical Questions" subsection in Debate tab
- Moderator review dashboard in Admin tab

#### 3. **Scheme Detection Indicators** (Phase 1 - COMPLETED)
**Current**: Background detection, not surfaced  
**Needed**: Visual indicators of detected schemes

**Integration Points**:
- Scheme badge/chip on argument cards
- Confidence meter for scheme detection
- Tooltip with scheme definition on hover
- Link to scheme breakdown modal

#### 4. **Net-Aware Dialogue Moves** (Phase 3 - COMPLETED)
**Current**: Legal moves system exists  
**Needed**: Adapt for multi-scheme nets

**Integration Points**:
- Show net-specific moves in CommandCard
- Dependency-aware move suggestions
- Attack/support options per scheme in net

---

## Proposed Component Architecture

### Design Principle: **Modular Monolith**

Keep single entry point but extract concerns into focused sub-components.

### New Structure

```
DeepDivePanelV3/
├── index.tsx                    (150 LOC) - Main orchestrator
├── hooks/
│   ├── useDeliberationData.ts   (100 LOC) - Data fetching
│   ├── useDeliberationState.ts  (80 LOC)  - State management
│   ├── useSheetPersistence.ts   (40 LOC)  - localStorage
│   └── useTabNavigation.ts      (30 LOC)  - Tab state
├── tabs/
│   ├── DebateTab.tsx            (400 LOC) - Main discussion
│   ├── ArgumentsTab.tsx         (300 LOC) - Arguments + Schemes
│   ├── DialogueTab.tsx          (250 LOC) - Formal dialogue
│   ├── AnalyticsTab.tsx         (200 LOC) - Metrics
│   ├── AdminTab.tsx             (200 LOC) - Management
│   └── index.ts                 - Re-exports
├── sheets/
│   ├── GraphExplorerSheet.tsx   (350 LOC) - Left sheet
│   ├── ActionsHudSheet.tsx      (300 LOC) - Right sheet
│   └── GlossarySheet.tsx        (150 LOC) - Terms sheet
├── sections/
│   ├── PropositionSection.tsx   (150 LOC)
│   ├── ClaimsSection.tsx        (200 LOC)
│   ├── ArgumentsSection.tsx     (250 LOC) - w/ Net integration
│   ├── IssuesSection.tsx        (150 LOC)
│   └── AssumptionsSection.tsx   (100 LOC)
└── shared/
    ├── SectionCard.tsx          (100 LOC) - Extracted from V2
    ├── StickyHeader.tsx         (80 LOC)  - Extracted from V2
    ├── ChipBar.tsx              (40 LOC)  - Extracted from V2
    └── types.ts                 (50 LOC)  - Shared types

Total: ~3,000 LOC (organized into 25+ focused files)
```

**Benefits**:
- Each file under 400 LOC (maintainable)
- Clear separation of concerns
- Easy to test individual parts
- Parallel development possible
- Better code reuse

---

## UI/UX Redesign Proposals

### 1. **Consolidated Tab Structure** (9 → 6 tabs with nested sub-tabs)

**Current 9 Tabs**: Debate, Arguments, Dialogue, Ludics, Admin, Sources, Thesis, ASPIC, Analytics

**Proposed 6 Tabs** (with nested structure):
```
1. 💬 Debate         (Main discussion + Claims + Propositions)
2. 🎯 Arguments      (Arguments + Schemes + Nets + ASPIC)
   └─ Sub-tabs: Arguments, Schemes, Networks, ASPIC
3. 🎮 Dialogue       (Dialogue + Ludics combined)
   └─ Sub-tabs: Dialogue, Game Theory, Legal Moves
4. 📚 Knowledge      (Sources + Thesis + Dictionary)
   └─ Sub-tabs: Sources, Thesis, Glossary
5. 📊 Analytics      (Metrics + Reports)
6. ⚙️  Admin         (Settings + Moderation)
```

**Design Pattern**: Use nested tab-lists like ASPIC tab currently does:
- **ASPIC parent tab** contains **4 sub-tabs**: Theory, Graph, Extension, Rationality
- This hierarchical visual structure reduces "global" tab count
- Users see 6 main tabs, can drill into specialized sub-tabs
- Preserves all functionality while simplifying navigation

**Rationale**:
- **Debate**: Primary activity, keep focused
- **Arguments**: All argumentation features together (overhaul components go here)
- **Dialogue**: Game-theoretic features naturally grouped
- **Knowledge**: Reference materials consolidated
- **Analytics**: All metrics in one place
- **Admin**: Management functions separated

**Implementation Note**: The nested tab pattern already exists in ASPIC tab - replicate that structure for Arguments, Dialogue, and Knowledge tabs.

### 2. **Enhanced Argument Cards** (Phase 1-4 Integration)

```tsx
<ArgumentCard>
  {/* Header with scheme indicators */}
  <CardHeader>
    <SchemeBadge schemes={3} primaryScheme="Expert Opinion" />
    <ConfidenceMeter value={0.92} />
  </CardHeader>
  
  {/* Main content */}
  <CardBody>
    {argumentText}
  </CardBody>
  
  {/* Phase 1-4 Actions */}
  <CardActions>
    <Button variant="ghost">
      <Target /> Support
    </Button>
    <Button variant="ghost">
      <Shield /> Defend
    </Button>
    <Button variant="ghost" badge={5}>
      <HelpCircle /> CQs
    </Button>
    <Button variant="primary" badge="new">
      <Network /> Analyze Net
    </Button>
  </CardActions>
  
  {/* Expandable CQ section */}
  {expanded && (
    <CardExpanded>
      <ComposedCQPanel netId={netId} />
    </CardExpanded>
  )}
</ArgumentCard>
```

### 3. **Smart Sidebar System** (Instead of Multiple Floating Sheets)

**Concept**: Single dynamic sidebar that adapts to context

```
┌─ Main Content ────────────┬─ Smart Sidebar ────┐
│ Debate Tab                 │ 📍 Context Panel   │
│                            │                     │
│ [Argument Selected]        │ → Argument Details │
│                            │ → Legal Moves      │
│                            │ → CQ Responses     │
│                            │ → Net Visualization│
│                            │                     │
│ [Claim Selected]           │ → Claim Details    │
│                            │ → Top Arguments    │
│                            │ → Dialogue Actions │
│                            │                     │
│ [Nothing Selected]         │ → Mini Map         │
│                            │ → Recent Activity  │
│                            │ → Quick Stats      │
└────────────────────────────┴─────────────────────┘
```

**Benefits**:
- Context-aware (no need to manage 3 sheets)
- Always visible (no toggle buttons needed)
- Responsive (collapses on mobile)
- Discoverable (shows relevant actions)

### 4. **Progressive Disclosure** for Advanced Features

**Principle**: Show simple first, reveal complexity on demand

**Example - Scheme Analysis**:
```
Level 1 (Default):
  Argument card shows "Schemes: 3" badge
  
Level 2 (Hover/Click):
  Tooltip shows scheme names and confidence
  
Level 3 (Action):
  Opens ArgumentNetAnalyzer in modal/panel
  
Level 4 (Deep Dive):
  Full net visualization with all features
```

### 5. **Activity Stream** (New Feature)

Add persistent activity sidebar showing:
- Recent propositions
- New arguments
- CQ responses pending review
- Dialogue moves
- Net detections
- Scheme updates

**Mockup**:
```
┌─ Activity Stream ─────────┐
│ 🕐 2 min ago              │
│ [Alice] Posted Expert     │
│ Opinion argument          │
│                            │
│ 🕐 5 min ago              │
│ [Bob] Responded to CQ:    │
│ "How reliable is..."      │
│                            │
│ 🕐 8 min ago              │
│ [System] Detected 3-      │
│ scheme net in arg #42     │
└────────────────────────────┘
```

---

## Performance Optimizations

### Current Issues
1. **Heavy re-renders** - Many useState hooks at top level
2. **Unnecessary fetches** - Some SWR calls could be conditional
3. **Large bundle** - 73 imports, some may be unused
4. **No virtualization** - Lists render all items

### Proposed Solutions

#### 1. **State Management Consolidation**
```tsx
// Instead of 20+ useState hooks:
const [tab, setTab] = useState(...)
const [leftSheetOpen, setLeftSheetOpen] = useState(...)
const [rightSheetOpen, setRightSheetOpen] = useState(...)
// ... etc

// Use reducer:
const [state, dispatch] = useReducer(deliberationReducer, initialState)
```

#### 2. **Code Splitting by Tab**
```tsx
const DebateTab = lazy(() => import('./tabs/DebateTab'))
const ArgumentsTab = lazy(() => import('./tabs/ArgumentsTab'))
// Only load active tab
```

#### 3. **SWR Optimization**
```tsx
// Conditional fetching
const { data } = useSWR(
  tab === 'arguments' ? `/api/arguments?delibId=${id}` : null,
  fetcher
)
```

#### 4. **List Virtualization**
```tsx
// Already using CardListVirtuoso for some lists
// Expand to all long lists (claims, arguments, etc.)
<Virtuoso
  data={arguments}
  itemContent={(index, arg) => <ArgumentCard {...arg} />}
/>
```

---

## Migration Strategy

### Phase 0: Preparation (Week 1)
- [ ] Audit all imports and remove unused
- [ ] Document all current features and behaviors
- [ ] Create feature parity checklist
- [ ] Set up feature flags for gradual rollout

### Phase 1: Extract Shared Components (Week 2)
- [ ] Extract SectionCard to shared/
- [ ] Extract StickyHeader to shared/
- [ ] Extract ChipBar to shared/
- [ ] Create shared types.ts
- [ ] Update DeepDivePanelV2 to import shared components
- [ ] Verify no regressions

### Phase 2: Custom Hooks (Week 3)
- [ ] Create useDeliberationData hook
- [ ] Create useDeliberationState hook
- [ ] Create useSheetPersistence hook
- [ ] Create useTabNavigation hook
- [ ] Migrate V2 to use hooks
- [ ] Verify no regressions

### Phase 3: Tab Extraction (Week 4-5)
- [ ] Extract DebateTab component
- [ ] Extract ArgumentsTab component (with Net integration)
- [ ] Extract DialogueTab component
- [ ] Extract remaining tabs
- [ ] Update V2 to use tab components
- [ ] Verify feature parity

---

## Phase 4: Overhaul Integration (Weeks 5-8)

**Status**: 🎯 READY TO BEGIN  
**Context**: Phases 0-4 of Deliberation System Overhaul are **fully implemented** with production-ready components, APIs, and services  
**Opportunity**: Integrate sophisticated argumentation features into V3 tabs during migration  
**Source Documents**: 
- `DEEPDIVEPANEL_OVERHAUL_INTEGRATION_AUDIT.md` (component inventory)
- `DEEPDIVEPANEL_V3_OVERHAUL_INTEGRATION_PLAN.md` (detailed implementation)
- `OVERHAUL_TEST_PAGES_AUDIT.md` (validated test pages)

### Overhaul Features Summary

**What's Available** (Phases 0-4 Complete):

**Phase 0 - Burden of Proof** ✅
- `BurdenOfProofIndicators` components (badges, tooltips, comparisons)
- Burden metadata in schema (`burdenOfProof`, `requiresEvidence`)
- Educational guidance for evidence collection

**Phase 1 - Multi-Scheme Arguments (Nets)** ✅
- `ArgumentNetAnalyzer` - Full net analysis with tabs
- Net detection APIs (`/api/nets/detect`, `/api/nets/[id]/*`)
- Scheme composition tracking
- Dependency analysis

**Phase 2 - Multi-Entry Navigation** ✅
- `SchemeNavigator` - Unified 4-mode interface (wizard, clusters, conditions, search)
- `DichotomicTreeWizard` - Purpose/source filtering
- `ClusterBrowser` - Semantic scheme discovery
- `IdentificationConditionsFilter` - Expert-level filtering

**Phase 3 - Argument Generation** ✅
- `AttackSuggestions` + `AttackConstructionWizard` - AI-assisted attacks
- `SupportSuggestions` + `SupportConstructionWizard` - Support generation
- `EvidenceGuidance` - Requirements, validation, suggestions
- Quality scoring and validation

**Phase 4 - Net Visualization** ✅
- `SchemeNetVisualization` - Interactive graph visualization
- `NetGraphWithCQs` - Net-aware CQ display
- `ComposedCQPanel` - Grouped CQs by scheme
- Multiple layout algorithms (hierarchical, force-directed, circular)

**Total Assets Ready**:
- ~25 major components
- ~15 API endpoints
- 12 test/example pages validating features
- Comprehensive documentation

---

### Week 5: Arguments Tab Enhancement (8 hours)

**Goal**: Transform Arguments tab into intelligent net-aware platform  
**Risk**: Low (all components exist and tested)  
**Dependencies**: Week 4 complete (ArgumentsTab extracted) ✅  
**Status**: 🎉 **Easier than planned!** NetworksSection already integrated in Week 2

**Context Update (Nov 12, 2025)**:
- ✅ ArgumentsTab already refactored with nested tabs (Week 2)
- ✅ NetworksSection already integrated in Networks subtab
- ✅ SchemesSection already in Schemes subtab
- ✅ ASPIC moved to ASPIC subtab
- ✅ Dialogue tab removed, button in header
- **Result**: Week 5 reduced from 8h → ~6.5h (Task 5.2 already done!)

#### 5.1: ArgumentNetAnalyzer Integration (4 hours)

**Current State**: 
- ArgumentsTab has nested structure with 4 subtabs (List, Schemes, Networks, ASPIC)
- AIFArgumentsListPro renders arguments without net analysis option
- No ArgumentNetAnalyzer integration

**Target State**: Multi-scheme net analysis accessible from argument cards

**Implementation**:
```typescript
// File: components/deepdive/v3/tabs/ArgumentsTab.tsx
import { ArgumentNetAnalyzer } from "@/components/argumentation/ArgumentNetAnalyzer";
import { Dialog, DialogContent } from "@/components/ui/dialog";

// Add state
const [netAnalyzerOpen, setNetAnalyzerOpen] = useState(false);
const [selectedArgumentId, setSelectedArgumentId] = useState<string | null>(null);

// Replace CQ modal trigger
<Button onClick={() => {
  setSelectedArgumentId(arg.id);
  setNetAnalyzerOpen(true);
}}>
  Analyze Argument
</Button>

// Add dialog with analyzer
<Dialog open={netAnalyzerOpen} onOpenChange={setNetAnalyzerOpen}>
  <DialogContent className="max-w-6xl max-h-[90vh]">
    {selectedArgumentId && (
      <ArgumentNetAnalyzer
        argumentId={selectedArgumentId}
        deliberationId={deliberationId}
        currentUserId={currentUserId}
      />
    )}
  </DialogContent>
</Dialog>
```

**Testing Checklist**:
- [ ] Single-scheme arguments show CQs normally
- [ ] Multi-scheme arguments show net visualization
- [ ] Graph is interactive (click nodes/edges)
- [ ] CQs grouped by scheme and attack type
- [ ] Burden badges display correctly

**Reference**: Test page at `app/test/net-analyzer/page.tsx`

---

#### 5.2: NetworksSection Integration (2 hours)

**Current State**: No deliberation-level net overview

**Target State**: Collapsible section showing all detected nets

**Implementation**:
```typescript
// File: components/deepdive/v3/tabs/ArgumentsTab.tsx
import { NetworksSection } from "@/components/deepdive/v3/sections/NetworksSection";

// Add section below arguments list
<div className="space-y-4">
  <SectionCard title="Arguments" {...}>
    {/* existing arguments */}
  </SectionCard>
  
  {/* NEW: Networks overview */}
  <NetworksSection deliberationId={deliberationId} />
</div>
```

**Testing Checklist**:
- [ ] Section appears below arguments list
- [ ] Detects nets on load
- [ ] Click "Analyze Net" opens ArgumentNetAnalyzer
- [ ] Shows net type, complexity, confidence
- [ ] Empty state when no nets

**Reference**: Component at `components/deepdive/v3/sections/NetworksSection.tsx`

---

#### 5.3: Burden of Proof Badges (2 hours)

**Current State**: CQs display without burden indicators

**Target State**: Visual burden guidance on all CQs

**Implementation**:
```typescript
// File: components/deepdive/v3/tabs/ArgumentsTab.tsx
import { 
  BurdenOfProofBadge, 
  BurdenOfProofTooltip 
} from "@/components/argumentation/BurdenOfProofIndicators";

// In CQ rendering
{cqs.map(cq => (
  <div key={cq.id} className="flex items-start gap-2">
    <div className="flex-1">
      <p>{cq.text}</p>
    </div>
    <BurdenOfProofBadge 
      burden={cq.burdenOfProof} 
      requiresEvidence={cq.requiresEvidence}
    />
  </div>
))}
```

**Testing Checklist**:
- [ ] Badges appear on all CQs
- [ ] Correct color for burden type
- [ ] Tooltips explain burden meaning
- [ ] "Requires Evidence" badge when applicable
- [ ] Works in net analyzer and simple CQ view

**Reference**: Test page at `app/(app)/examples/burden-indicators/page.tsx`

**Week 5 Deliverables**:
- ✅ Net-aware Arguments tab (NetworksSection already integrated!)
- ✅ ArgumentNetAnalyzer accessible from arguments
- ✅ Burden of proof guidance on all CQs
- **Total**: ~6.5 hours (NetworksSection already done = -1.5h)

**Week 5 Summary**:
Task 5.1 (ArgumentNetAnalyzer) + Task 5.2 (Verification only) + Task 5.3 (Burden badges) = ~6.5 hours instead of 8 hours due to Week 2 nested tabs work already completing NetworksSection integration.

---

### Week 6: Attack Generation Integration (10 hours)

**Goal**: Add AI-assisted attack generation workflow  
**Risk**: Medium (workflow changes, UX testing needed)  
**Dependencies**: Week 5 complete  
**Status**: ✅ Task 6.1 COMPLETE (Nov 12, 2025)

#### 6.1: Attack Suggestions Integration (6 hours → 3 hours actual)

**Status**: ✅ COMPLETE  
**Time**: 3 hours (50% time savings due to existing components)  
**Completion Date**: November 12, 2025

**Current State**: Manual counterargument creation

**Target State**: CQ-based strategic attack suggestions

**Implementation Summary**:

**Files Modified**:
1. `components/arguments/AIFArgumentsListPro.tsx` (lines 480-523, 796-807, 1281)
   - Added `onGenerateAttack` prop to RowImpl and Row components
   - Added "Generate Attack" button with Swords icon and rose styling
   - Button conditionally rendered when `onGenerateAttack`, `meta?.conclusion?.id` exist
   - Passes both `argumentId` and `claimId` (conclusion) to callback

2. `components/deepdive/v3/tabs/ArgumentsTab.tsx` (lines 1-219)
   - Added state management for attack generation workflow:
     - `currentUserId` - fetched via `getUserFromCookies()` in useEffect
     - `attackTargetId` - stores argumentId being attacked
     - `attackTargetClaimId` - stores conclusion claimId
     - `selectedAttack` - stores chosen AttackSuggestion
     - `wizardOpen` - controls AttackConstructionWizard visibility
     - `attackRefreshKey` - triggers arguments list refresh
   - Added AttackSuggestions Dialog (max-w-4xl)
   - Added AttackConstructionWizard Dialog (max-w-6xl)
   - Integrated refresh workflow on attack completion

3. `components/argumentation/AttackSuggestions.tsx` (lines 41, 54, 69-93)
   - Added required `userId` prop
   - Added userId validation guard in loadSuggestions
   - Added debugging logs for API calls
   - Passes userId in POST body to `/api/arguments/suggest-attacks`

4. `app/api/arguments/suggest-attacks/route.ts` (lines 13, 17-23, 40-43)
   - Added authentication using `getUserFromCookies()`
   - Returns 401 if user not authenticated
   - Falls back to authenticated user's ID if userId not provided in body
   - Uses `effectiveUserId` for service calls

5. `app/server/services/ArgumentGenerationService.ts` (lines 145-148, 363-383, 570-595)
   - Updated `ArgumentWithSchemes` type to include `conclusion` relation
   - Modified `getArgumentWithSchemes()` to include both `conclusion` and `claim` relations
   - Updated `buildAttackSuggestion()` to prioritize `conclusion` over `claim` for claimId
   - Added defensive fallback chain: `conclusion?.id || conclusionClaimId || claim?.id || claimId`
   - Added detailed error logging for missing claim data

6. `components/argumentation/AttackConstructionWizard.tsx` (lines 73-84, 419-445)
   - Modified `useEffect` to use `suggestion.template` if present (avoids redundant API call)
   - Added defensive `|| []` checks on `constructionSteps` and `evidenceRequirements`
   - Prevents runtime errors when arrays are undefined

**Critical Learnings**:

**1. Database Schema Evolution - Legacy vs New Fields**
- **Issue**: Arguments have BOTH `claimId` (legacy, one-to-one) and `conclusionClaimId` (new, current)
- **Discovery**: Prisma query included `claim: true` relation but accessed wrong field
- **Root Cause**: `argument.claimId` was null, but `argument.conclusionClaimId` had valid ID
- **Fix**: Prioritize `conclusion` relation and `conclusionClaimId` field
- **Pattern**: When debugging null field errors, check Prisma schema for multiple similar fields

**2. ArgumentAttackModal vs AttackSuggestions**
- **Clarification**: ArgumentAttackModal (manual ASPIC+ attacks) is STILL USED
  - Accessed via "Attack" button in ArgumentCardV2 header
  - User manually selects attack type (Rebut/Undermine/Undercut)
  - User manually selects attacking claim/argument
- **New Feature**: AttackSuggestions (AI-assisted CQ-based attacks)
  - Accessed via "Generate Attack" button in AIFArgumentsListPro
  - System generates ranked attack strategies based on Critical Questions
  - User selects strategy and uses wizard for guided construction
- **Coexistence**: Both flows serve different purposes and remain active

**3. Authentication in API Routes**
- **Pattern**: Next.js App Router API routes require explicit authentication
- **Implementation**: 
  ```typescript
  const user = await getUserFromCookies();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  ```
- **Fallback**: Allow client to pass `userId` OR use authenticated user's ID
- **Testing**: curl tests fail without cookies - use browser testing instead

**4. Component Data Flow - Template Reuse**
- **Issue**: AttackConstructionWizard was refetching template via API
- **Optimization**: `suggestion.template` already populated by AttackSuggestions
- **Fix**: Check if template exists on suggestion, use directly if present
- **Benefit**: Eliminates redundant API call, faster wizard loading

**5. Defensive Programming for Optional Arrays**
- **Issue**: `template.constructionSteps.slice()` threw error when undefined
- **Pattern**: TypeScript types say it's required, but runtime data might not include it
- **Fix**: Add `|| []` fallback: `(template.constructionSteps || []).slice(0, 3)`
- **Lesson**: Always add defensive checks for array operations, even with strict types

**Testing Checklist**:
- ✅ "Generate Attack" button on all arguments with conclusions
- ✅ Authentication required (401 redirect for unauthenticated)
- ✅ Suggestions load correctly from API
- ✅ Suggestions ranked by strategic value
- ✅ Burden of proof shown for each strategy
- ✅ Modal displays attack suggestions with CQ questions
- ✅ "Use This Attack" button opens wizard
- ✅ Wizard loads with template data
- ✅ Construction steps display correctly
- ✅ Evidence requirements display correctly
- [ ] Complete wizard workflow (Overview → Premises → Evidence → Review)
- [ ] Quality validation enforced (40% minimum)
- [ ] Attack submission and list refresh
- [ ] Integration with ArgumentActionsSheet (Task 6.2)

**Known Issues**:
- None currently blocking - wizard workflow testing pending

**Reference Files**:
- Test pages: `app/(app)/examples/attack-submission/page.tsx`, `app/(app)/examples/evidence-guidance/page.tsx`
- Components: `AttackSuggestions.tsx`, `AttackConstructionWizard.tsx`, `AIFArgumentsListPro.tsx`
- Services: `ArgumentGenerationService.ts`
- API: `/api/arguments/suggest-attacks/route.ts`

**Time Breakdown**:
- Initial implementation: 1.5 hours (button, state, dialogs)
- Debugging prop threading: 0.5 hours
- Debugging userId authentication: 0.5 hours
- Debugging claimId null error: 0.5 hours (database inspection, schema review, fix)
- Testing and validation: 0.5 hours
- **Total**: ~3.5 hours vs 6 hours estimated (42% time savings)

**Success Factors**:
1. Existing components (AttackSuggestions, AttackConstructionWizard) already production-ready
2. Clear error messages led to quick diagnosis
3. Database diagnostic scripts (`inspect-argument-claim.ts`) helped identify schema issues
4. Incremental testing caught issues early

---

#### 6.2: ArgumentActionsSheet Enhancement (3 hours)

**Current State**: Basic action sheet

**Target State**: Enhanced with attack generator trigger

**Implementation**: Add "Strategic Attack" option to ArgumentActionsSheet with quality preview

**Testing Checklist**:
- [ ] Sheet shows attack quality estimate
- [ ] Links to attack wizard
- [ ] Preserves existing actions

---

#### 6.3: Visual Indicators (1 hour)

**Current State**: No visual cues for attack opportunities

**Target State**: Badge showing number of attack strategies available

**Implementation**: Add badge to argument cards showing available CQs/attacks

**Week 6 Deliverables**:
- ✅ AI-assisted attack generation (Task 6.1 COMPLETE - 3h actual vs 6h estimated)
- ⏳ Quality validation workflow (pending wizard testing)
- ⏳ Evidence guidance integrated (pending wizard testing)
- ⏳ ArgumentActionsSheet enhancement (Task 6.2 - 3h)
- ⏳ Visual indicators (Task 6.3 - 1h)
- **Progress**: Task 6.1 complete (3.5h), Tasks 6.2-6.3 pending (4h)
- **Total**: 3.5h / 10h (35% complete, 50% time savings on completed task)

---

### Week 7: Navigation & Support Generation (10 hours)

**Goal**: Enhance scheme discovery and add support generation  
**Risk**: Low (symmetric to attack generation)  
**Dependencies**: Week 6 complete

#### 7.1: SchemeNavigator Integration (4 hours)

**Current State**: Limited scheme selection interface

**Target State**: Unified 4-mode scheme navigator

**Implementation**: Replace scheme pickers with SchemeNavigator component (wizard, clusters, conditions, search modes)

**Testing Checklist**:
- [ ] All 4 modes accessible
- [ ] Mode switching persists
- [ ] Favorites and recents tracked
- [ ] Search with filters works

**Reference**: Test page at `app/test/scheme-navigator/page.tsx`

---

#### 7.2: SchemesSection Addition (2 hours)

**Current State**: No scheme reference in main panel

**Target State**: Educational "Argumentation Schemes" section

**Implementation**: Add collapsible SchemesSection to Arguments or Knowledge tab

**Reference**: Component at `components/deepdive/v3/sections/SchemesSection.tsx`

---

#### 7.3: Support Suggestions Integration (4 hours)

**Current State**: No support generation workflow

**Target State**: Symmetric to attack generation for supporting arguments

**Implementation**: Add SupportArgumentFlow to Debate tab with 7-step wizard

**Testing Checklist**:
- [ ] Support suggestions by scheme
- [ ] Evidence mapping to premises
- [ ] Batch generation option
- [ ] Quality validation

**Reference**: Test page at `app/test/support-flow/page.tsx`

**Week 7 Deliverables**:
- ✅ Enhanced scheme discovery
- ✅ Support argument generation
- ✅ Educational scheme reference
- **Total**: 10 hours

---

### Week 8: Polish & Advanced Features (8 hours)

**Goal**: Complete integration with visualization and analytics  
**Risk**: Low (polish work)  
**Dependencies**: Week 7 complete

#### 8.1: Net Visualization Enhancements (3 hours)

**Implementation**: Add enhanced graph layouts, export to PNG/SVG, filtering options

**Testing Checklist**:
- [ ] Multiple layout algorithms
- [ ] Node styling by explicitness
- [ ] Edge labeling by relationship
- [ ] Export functionality

**Reference**: Test page at `app/test/net-visualization/page.tsx`

---

#### 8.2: Evidence Integration Polish (3 hours)

**Implementation**: Refine evidence collection UI, add strength meters, improve validation

**Reference**: Test page at `app/(app)/examples/evidence-guidance/page.tsx`

---

#### 8.3: Analytics Integration (2 hours)

**Implementation**: Add net statistics to Analytics tab, scheme usage tracking, quality metrics

**Week 8 Deliverables**:
- ✅ Beautiful net visualizations
- ✅ Polished evidence workflow
- ✅ Comprehensive analytics
- **Total**: 8 hours

---

### Overhaul Integration Summary

**Total Effort**: 36 hours over 4 weeks (revised: ~32h based on actuals)  
**Progress**: Week 5 complete (1.5h), Week 6 Task 6.1 complete (3.5h)  
**Completed**: 5h / 36h (14%)  
**Time Savings**: 10.5 hours saved vs estimates (Week 5: 6.5h, Week 6.1: 2.5h)  
**Components Integrated**: ~25 major components  
**APIs Used**: ~15 endpoints  
**Risk**: Low (all components pre-tested)  
**Value**: Months of development work exposed to users

**Weekly Progress**:
- ✅ Week 5: Arguments Tab (1.5h actual vs 8h estimated) - 81% time savings
- ✅ Week 6.1: Attack Suggestions (3.5h actual vs 6h estimated) - 42% time savings
- ⏳ Week 6.2-6.3: ArgumentActionsSheet + Visual Indicators (4h remaining)
- ⏳ Week 7: Navigation & Support Generation (10h)
- ⏳ Week 8: Polish & Advanced Features (8h)

**Success Metrics**:
- [ ] 80% of users discover attack generator in first session
- [ ] Average attack quality score increases 15%
- [ ] CQ response rate increases 2x
- [ ] Scheme discovery time reduced 50%
- ✅ Integration faster than estimated (48% time savings so far)

**Feature Flags**:
```typescript
const OVERHAUL_FEATURES = {
  ENABLE_NET_ANALYZER: true,        // Week 5
  ENABLE_BURDEN_INDICATORS: true,   // Week 5
  ENABLE_ATTACK_GENERATOR: false,   // Week 6 (gradual rollout)
  ENABLE_SCHEME_NAVIGATOR: false,   // Week 7
  ENABLE_SUPPORT_GENERATOR: false,  // Week 7
  ENABLE_NET_VISUALIZATION: true,   // Week 8
} as const;
```

---

### Phase 5: Sheet Consolidation (Week 9)
- [ ] Extract GraphExplorerSheet
- [ ] Extract ActionsHudSheet
- [ ] Extract GlossarySheet
- [ ] Consider Smart Sidebar alternative
- [ ] Update V2 to use sheet components
- [ ] Verify no regressions

### Phase 6: Create DeepDivePanelV3 (Week 10)
- [ ] Create new V3 entry point
- [ ] Wire up all extracted components
- [ ] Implement state reducer
- [ ] Add code splitting
- [ ] Performance testing
- [ ] A/B testing setup

### Phase 7: Beta & Rollout (Week 11)
- [ ] Beta testing with select users
- [ ] Gather feedback
- [ ] Fix critical issues
- [ ] Gradual rollout via feature flag
- [ ] Monitor performance metrics
- [ ] Full rollout

### Phase 8: Cleanup (Week 12)
- [ ] Remove DeepDivePanelV2 once V3 is stable
- [ ] Update all imports across codebase
- [ ] Archive old components
- [ ] Update documentation

---

## Feature Flag Strategy

```typescript
// Feature flags for gradual rollout
const FEATURES = {
  USE_V3_PANEL: false,              // Main V3 toggle
  ENABLE_SMART_SIDEBAR: false,      // New sidebar system
  SHOW_SCHEME_INDICATORS: true,     // Phase 1 integration
  ENABLE_NET_ANALYZER: true,        // Phase 4 integration
  CONSOLIDATED_TABS: false,         // 6-tab layout
  ACTIVITY_STREAM: false,           // Activity sidebar
  CODE_SPLITTING: false,            // Lazy load tabs
} as const

// Usage
if (FEATURES.USE_V3_PANEL) {
  return <DeepDivePanelV3 {...props} />
} else {
  return <DeepDivePanelV2 {...props} />
}
```

---

## Design System Tokens

### Colors (Consistent with Phase 1-4)
```typescript
const THEME = {
  // Argument scheme colors
  scheme: {
    primary: 'indigo-600',
    secondary: 'purple-600',
    supporting: 'sky-600',
  },
  
  // Confidence indicators
  confidence: {
    high: 'emerald-600',
    medium: 'amber-600',
    low: 'rose-600',
  },
  
  // UI tones (already in SectionCard)
  tone: {
    default: 'slate-200',
    info: 'sky-200',
    success: 'emerald-200',
    warn: 'amber-200',
    danger: 'rose-200',
  },
}
```

### Spacing Scale
```typescript
const SPACING = {
  xs: '0.5rem',   // 8px
  sm: '0.75rem',  // 12px
  md: '1rem',     // 16px
  lg: '1.5rem',   // 24px
  xl: '2rem',     // 32px
  '2xl': '3rem',  // 48px
}
```

### Typography Scale
```typescript
const TYPOGRAPHY = {
  // Already using "Kolonia" for headers
  display: 'font-[Kolonia] text-4xl uppercase tracking-wide',
  h2: 'text-2xl font-semibold',
  h3: 'text-lg font-semibold',
  body: 'text-sm',
  caption: 'text-xs text-slate-600',
}
```

---

## API Optimizations

### Batch Requests
```typescript
// Instead of:
const args = await fetch(`/api/arguments?delibId=${id}`)
const claims = await fetch(`/api/claims?delibId=${id}`)
const propositions = await fetch(`/api/propositions?delibId=${id}`)

// Use:
const { args, claims, propositions } = await fetch(
  `/api/deliberations/${id}/full`
)
```

### Incremental Loading
```typescript
// Initial load - essential data only
const { metadata, recentActivity } = await fetch(
  `/api/deliberations/${id}?view=minimal`
)

// Load tab data on demand
const { arguments } = await fetch(
  `/api/deliberations/${id}/arguments`
) // Only when Arguments tab clicked
```

### WebSocket for Real-Time Updates
```typescript
// Subscribe to deliberation updates
const ws = useDeliberationSocket(deliberationId)

ws.on('new-argument', (arg) => {
  // Update local state without refetch
  mutate('/api/arguments', (data) => [...data, arg], false)
})
```

---

## Testing Strategy

### Unit Tests (New Components)
```typescript
// Example: SectionCard.test.tsx
describe('SectionCard', () => {
  it('renders with title', () => {
    render(<SectionCard title="Test" />)
    expect(screen.getByText('Test')).toBeInTheDocument()
  })
  
  it('applies tone styles correctly', () => {
    const { container } = render(
      <SectionCard tone="success" />
    )
    expect(container.firstChild).toHaveClass('ring-emerald-200')
  })
})
```

### Integration Tests (Tab Behavior)
```typescript
describe('DeepDivePanelV3', () => {
  it('switches tabs correctly', async () => {
    render(<DeepDivePanelV3 deliberationId="test-123" />)
    
    const argumentsTab = screen.getByText('Arguments')
    await userEvent.click(argumentsTab)
    
    expect(screen.getByText('AIFArgumentsListPro')).toBeVisible()
  })
})
```

### E2E Tests (Critical Flows)
```typescript
test('User can create argument and view its scheme net', async ({ page }) => {
  await page.goto('/deliberation/test-delib')
  
  // Create argument
  await page.click('[data-testid="compose-argument"]')
  await page.fill('[name="text"]', 'Test argument...')
  await page.click('[data-testid="submit-argument"]')
  
  // View net
  await page.click('[data-testid="analyze-net"]')
  await expect(page.locator('.net-graph')).toBeVisible()
})
```

---

## Success Metrics

### Performance Targets
- [ ] Initial load < 2s (currently ~3s)
- [ ] Tab switch < 200ms (currently ~500ms)
- [ ] Argument card render < 50ms
- [ ] Bundle size < 500KB (currently ~800KB)

### User Experience Targets
- [ ] 80% of users discover net analyzer within 1st session
- [ ] Average time to create argument < 60s
- [ ] 90% of users understand scheme indicators
- [ ] CQ response rate increases 2x

### Code Quality Targets
- [ ] No files > 400 LOC
- [ ] Test coverage > 70%
- [ ] Zero TypeScript errors
- [ ] Lighthouse score > 90

---

## Risk Analysis

### High Risk
- **Breaking existing workflows** - Users accustomed to current layout
  - *Mitigation*: Feature flag + gradual rollout + feedback loop
  
- **Performance regression** - More components = more overhead?
  - *Mitigation*: Performance budgets + monitoring + lazy loading

### Medium Risk
- **Incomplete feature parity** - Missing edge cases
  - *Mitigation*: Comprehensive testing + side-by-side comparison
  
- **State management bugs** - Reducer complexity
  - *Mitigation*: Unit tests + state machine diagrams

### Low Risk
- **Style inconsistencies** - Design tokens should prevent
- **Import errors** - TypeScript will catch
- **Dead code** - Linter will identify

---

## Open Questions

1. **Smart Sidebar vs Floating Sheets?**
   - Pro Sidebar: Always visible, context-aware
   - Pro Sheets: More screen real estate for main content
   - **Recommendation**: Try sidebar first, can fallback to sheets

2. **9 tabs → 6 tabs or keep 9?**
   - User feedback needed on current tab usage
   - Analytics: Which tabs are rarely used?
   - **Recommendation**: Consolidate but make it configurable

3. **Reducer vs Multiple useState?**
   - Reducer better for complex state
   - useState simpler for beginners to understand
   - **Recommendation**: Reducer for V3, document well

4. **Code splitting by default or opt-in?**
   - By default: Better initial load
   - Opt-in: Simpler to debug
   - **Recommendation**: By default for production, configurable in dev

5. **Backward compatibility timeline?**
   - Keep V2 for how long after V3 launch?
   - **Recommendation**: 2 months side-by-side, then deprecate V2

---

## Next Steps (Immediate)

### Week 1 Action Items
1. **Get stakeholder feedback** on this audit
2. **Prioritize features** - What's most important?
3. **Create GitHub project** for tracking migration
4. **Set up feature flags** in codebase
5. **Extract first shared component** (SectionCard) as proof of concept

### Week 2 Preview
- Complete shared component extraction
- Create useDeliberationData hook
- Start on tab extraction (DebateTab first)

---

## Appendix: Current Component Inventory

### Direct Dependencies (73 imports)
```typescript
// UI Components (18)
import { Tabs, TabsList, TabsContent, TabsTrigger } from "../ui/tabs"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible"
import { FloatingSheet, SheetToggleButton } from "../ui/FloatingSheet"
// ... etc

// Feature Components (35)
import DeliberationComposer from "./DeliberationComposer"
import ArgumentsList from "./ArgumentsList"
import { RepresentativeViewpoints } from "./RepresentativeViewpoints"
import AIFArgumentsListPro from '@/components/arguments/AIFArgumentsListPro'
// ... etc

// Utilities (10)
import useSWR, { mutate as swrMutate } from "swr"
import { useAuth } from "@/lib/AuthContext"
import { scrollIntoViewById } from "@/lib/client/scroll"
// ... etc

// Icons (10)
import { GalleryVerticalEnd, MessageSquare, Settings } from "lucide-react"
// ... etc
```

### State Variables (25+)
```typescript
const [sel, setSel] = useState<Selection | null>(null)
const [pending, setPending] = useState(false)
const [status, setStatus] = useState<string | null>(null)
const [tab, setTab] = useState<'debate' | ...>('debate')
const [confMode, setConfMode] = useState<'product' | 'min'>('product')
// ... 20 more
```

### API Endpoints Called (15+)
```
/api/ludics/compile-step
/api/works
/api/arguments/{id}
/api/arguments/{id}?view=diagram
/api/claims/{id}
/api/claims/{id}/top-argument
/api/dialogue/legal-moves
/api/nets/detect
/api/nets/{id}/cqs
// ... etc
```

---

## Conclusion

The DeepDivePanelV2 is a powerful component that has grown organically with the platform. With Phase 1-4 complete, we have an opportunity to:

1. **Modernize architecture** - Split into focused, testable components
2. **Integrate new features** - Surface scheme detection and net analysis
3. **Improve performance** - Reduce bundle size and optimize renders
4. **Enhance UX** - Progressive disclosure and smart context awareness

The migration can be done incrementally over 11 weeks with feature flags ensuring no disruption to existing users. The result will be a more maintainable, performant, and feature-rich deliberation experience.

**Recommendation**: Proceed with Phase 0 (Preparation) and get stakeholder sign-off on:
- 6-tab consolidated layout vs keep 9 tabs
- Smart Sidebar vs Floating Sheets
- Aggressive timeline (11 weeks) vs conservative (16 weeks)

Once these decisions are made, we can begin extraction and migration with confidence.

---

## Testing Learnings: Seed Scripts & Data Model Integration

**Date**: November 2025  
**Context**: Phase 1-4 feature testing with ArgumentNetAnalyzer and multi-scheme arguments

### Issue: "Analyze Net" Button Not Appearing

**Symptom**: Multi-scheme arguments (convergent, divergent, serial, hybrid nets) were not showing "Analyze Net" buttons in `AIFArgumentsListPro`, despite having `ArgumentSchemeInstance` records correctly created.

**Root Cause**: 
- `AIFArgumentsListPro` checks `meta?.scheme` condition (line 778) before showing button
- `meta.scheme` comes from legacy `Argument.schemeId` field (single value, one-to-one)
- Multi-scheme arguments were intentionally created **without** `schemeId` field because it can only hold one scheme ID
- Phase 1-4 architecture uses `ArgumentSchemeInstance` table (many-to-many) for multi-scheme support
- **Gap**: UI component still relied on legacy field, not new architecture

**Detection Method**:
1. Created seed data with `seed-multi-scheme-arguments-suite.ts` (890 LOC, 10 arguments)
2. User tested in UI and reported mixed results (some args show button, others don't)
3. Grep search found button condition: `{meta?.scheme && onAnalyzeArgument && (`
4. Traced `meta.scheme` back to `Argument.schemeId` field
5. Checked seed script - confirmed multi-scheme args had NO `schemeId`, only `ArgumentSchemeInstance` records

**Solution Applied**:
```typescript
// Before (multi-scheme args):
const climateArg = await prisma.argument.create({
  data: {
    id: "test-conv-climate-arg",
    // ... other fields
    // ❌ No schemeId field
  }
});

// After (multi-scheme args):
const climateArg = await prisma.argument.create({
  data: {
    id: "test-conv-climate-arg",
    // ... other fields
    schemeId: schemes.practicalReasoning?.id, // ✅ Primary scheme for legacy support
  }
});
```

**Fix Pattern**: For multi-scheme arguments, set `schemeId` to the **primary scheme** (identified by `isPrimary: true` in `ArgumentSchemeInstance` records). This maintains backward compatibility with legacy UI components while preserving full multi-scheme data in `ArgumentSchemeInstance`.

### Verified Test Results (Post-Fix)

✅ **Multi-scheme nets working**:
- `test-conv-climate-arg` (4 schemes, convergent) - 88% confidence
- `test-div-ai-arg` (3 schemes, divergent) - 85% confidence
- `test-hybrid-education-arg` (3 schemes, hybrid) - 84% confidence
- `test-multi-scheme-climate-arg` (3 schemes, serial) - from other seed

✅ **Single-scheme fallback working**:
- `test-single-space-arg` (Expert Opinion only)
- `test-single-energy-arg` (Practical Reasoning only)

✅ **Attack arguments working**:
- `test-attack-climate-rebuttal` (REBUTS, Consequences scheme)
- `test-attack-ai-undercut` (UNDERCUTS, Sign scheme)
- `test-attack-energy-undermine` (UNDERMINES, Consequences scheme)

### Key Learnings for Future Development

1. **Legacy Field Migration**: When adding new data models (e.g., `ArgumentSchemeInstance`), audit ALL UI components that reference old fields (`Argument.schemeId`). Don't assume they've been updated.

2. **Seed Script Best Practice**: Always populate legacy fields for backward compatibility, even when new architecture exists:
   ```typescript
   schemeId: primaryScheme?.id,  // Legacy support
   // PLUS create ArgumentSchemeInstance records for full data
   ```

3. **Testing Order**: Test UI integration IMMEDIATELY after creating seed data. Don't build all seed data first, then test at end. User caught this early by testing incrementally.

4. **Data Model Transition Pattern**: 
   - **Phase 1**: Create new table (`ArgumentSchemeInstance`)
   - **Phase 2**: Update APIs to read from both old and new
   - **Phase 3**: Update UI components to prefer new data
   - **Phase 4**: Migrate seed scripts and populate legacy fields
   - **Phase 5**: Eventually deprecate legacy field (future)

5. **Component Assumptions**: `AIFArgumentsListPro` assumes `meta?.scheme` exists. When adding features that create arguments programmatically (seed scripts, AI generation, bulk import), ensure ALL required fields are populated, not just new architecture.

6. **Grep for Conditions**: When debugging "button not showing" issues, grep for the button text and read surrounding conditions. Often reveals field dependencies.

### Related Files Modified

- `scripts/seed-multi-scheme-arguments-suite.ts` - Added `schemeId` to lines 209, 334, 457 (multi-scheme args)
- `scripts/seed-multi-scheme-arguments-suite.ts` - Added `schemeId` to lines 750, 801 (attack args)

### API Endpoints Tested

- ✅ `/api/nets/detect` - Multi-scheme net detection (convergent, divergent, serial, hybrid)
- ✅ `/api/nets/[id]/cqs` - Critical Questions generation (18 CQs for serial net, 12 for convergent)
- ✅ `ArgumentNetAnalyzer` component - Net visualization with React Flow
- ✅ `AIFArgumentsListPro` - "Analyze Net" button display condition

### Future Considerations

**Option A** (Current): Keep populating `schemeId` for backward compatibility  
**Option B** (Future): Update `AIFArgumentsListPro` to check `ArgumentSchemeInstance` count instead:
```typescript
// Future enhancement
const hasScheme = meta?.scheme || (schemeInstances?.length > 0);
{hasScheme && onAnalyzeArgument && (
  <Button>Analyze Net</Button>
)}
```

**Recommendation**: Keep Option A for now (populate legacy field). Defer Option B until full V3 migration when we can audit all components systematically and update them together.

---

````
