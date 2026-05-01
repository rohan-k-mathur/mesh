# Phase 2: UI Modernization — Implementation Plan

**Timeline:** 2 weeks (Nov 3 - Nov 17, 2025)  
**Status:** 🟡 In Progress  
**Current Line Count:** `LudicsPanel.tsx` = 1,260 lines  
**Target:** <400 lines

---

## Overview

Phase 2 refactors the monolithic `LudicsPanel.tsx` into smaller, composable components and replaces custom UI with `@/components/ui` equivalents to align with the project's design system.

### Goals
1. ✅ Reduce `LudicsPanel.tsx` from 1,260 lines → <400 lines
2. ✅ Extract 4 sub-components (TraceViewer, TreePanel, CommitmentsView, ActionsToolbar)
3. ✅ Replace duplicate UI components (ChipBar → Badge, Segmented → Tabs)
4. ✅ Add 5+ Ludics commands to command palette
5. ✅ Show Ludics badges on ArgumentCardV2

---

## Week 1: Component Refactor (Nov 3-10)

### Task 2.1: Extract LudicsTraceViewer Component
**Lines:** ~150-200 (trace ribbon + step details)  
**Files:**
- Create: `components/ludics/LudicsTraceViewer.tsx`
- Modify: `components/deepdive/LudicsPanel.tsx`

**What to extract:**
```tsx
// Current inline TraceRibbon usage (lines ~800-900)
// - TraceRibbon component rendering
// - Step selection state
// - Narrative text display
// - Decisive step highlighting
```

**Component API:**
```tsx
interface LudicsTraceViewerProps {
  trace: StepResult | null;
  selectedStepIdx: number | null;
  onStepSelect: (idx: number | null) => void;
  deliberationId: string;
}
```

**DoD:**
- [ ] Component renders TraceRibbon with proper step highlighting
- [ ] Narrative text displays for selected steps
- [ ] Decisive steps show visual indicators
- [ ] No functionality lost from original inline code

---

### Task 2.2: Extract LudicsTreePanel Component
**Lines:** ~200-250 (tree visualization + controls)  
**Files:**
- Create: `components/ludics/LudicsTreePanel.tsx`
- Modify: `components/deepdive/LudicsPanel.tsx`

**What to extract:**
```tsx
// Current LociTree section (lines ~900-1000)
// - LociTree/LociTreeWithControls rendering
// - Tree mode tabs (Merged/Separate/Defense)
// - Tree data merging logic
// - Focus/selection handling
```

**Component API:**
```tsx
interface LudicsTreePanelProps {
  designs: any[];
  treeMode: "merged" | "separate" | "defense";
  onTreeModeChange: (mode: string) => void;
  selectedAct: any | null;
  onActSelect: (act: any) => void;
  deliberationId: string;
}
```

**DoD:**
- [ ] Component renders all three tree modes (merged/separate/defense)
- [ ] Tree mode switching works via Tabs component
- [ ] Act selection/focus preserved
- [ ] No performance regression

---

### Task 2.3: Extract LudicsCommitmentsView Component
**Lines:** ~150-200 (commitments panel + delta)  
**Files:**
- Create: `components/ludics/LudicsCommitmentsView.tsx`
- Modify: `components/deepdive/LudicsPanel.tsx`

**What to extract:**
```tsx
// Current CommitmentsPanel section (lines ~1000-1100)
// - CommitmentsPanel rendering (Proponent/Opponent)
// - CommitmentDelta rendering
// - NLCommitPopover integration
// - Commitment state fetching
```

**Component API:**
```tsx
interface LudicsCommitmentsViewProps {
  deliberationId: string;
  selectedAct: any | null;
  onCommit?: (label: string, path: string) => Promise<void>;
}
```

**DoD:**
- [ ] Component displays both Proponent/Opponent commitments
- [ ] CommitmentDelta shows changes correctly
- [ ] NLCommitPopover opens on user action
- [ ] Commitment fetching uses SWR

---

### Task 2.4: Extract LudicsActionsToolbar Component
**Lines:** ~100-150 (action buttons + keyboard hints)  
**Files:**
- Create: `components/ludics/LudicsActionsToolbar.tsx`
- Modify: `components/deepdive/LudicsPanel.tsx`

**What to extract:**
```tsx
// Current action buttons section (lines ~750-850)
// - Compile/Step/Orthogonal buttons
// - Loading states + disabled states
// - Keyboard shortcut hints (c/s/o/n)
// - Judge console toggle
```

**Component API:**
```tsx
interface LudicsActionsToolbarProps {
  onCompile: (phase?: string) => Promise<void>;
  onStep: () => Promise<void>;
  onCheckOrthogonal: () => Promise<void>;
  onAnalyzeNLI?: () => Promise<void>;
  isLoading?: boolean;
  showGuide?: boolean;
  onToggleGuide?: () => void;
}
```

**DoD:**
- [ ] Toolbar renders all action buttons
- [ ] Loading states disable buttons appropriately
- [ ] Keyboard shortcuts work (c/s/o/n/l)
- [ ] Consistent spacing/styling

---

### Task 2.5: Replace Custom UI Components
**Files:**
- Modify: All 4 new components + `LudicsPanel.tsx`

**Changes:**
1. **Replace `ChipBar` with `Badge`:**
   ```tsx
   // OLD (line 70-77):
   function ChipBar({ children }: { children: React.ReactNode }) {
     return <div className="inline-flex flex-wrap...">{children}</div>;
   }
   
   // NEW:
   import { Badge } from "@/components/ui/badge";
   <Badge variant="secondary">{children}</Badge>
   ```

2. **Replace `Segmented` with `Tabs`:**
   ```tsx
   // OLD (line 108-146):
   function Segmented<T>({ options, value, onChange }) { ... }
   
   // NEW:
   import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
   <Tabs value={value} onValueChange={onChange}>
     <TabsList>
       {options.map(opt => <TabsTrigger key={opt.value} value={opt.value}>{opt.label}</TabsTrigger>)}
     </TabsList>
   </Tabs>
   ```

**DoD:**
- [ ] All instances of `ChipBar` replaced with `Badge`
- [ ] All instances of `Segmented` replaced with `Tabs`
- [ ] Styling matches or improves on original
- [ ] No duplicate component definitions remain

---

### Task 2.6: Integrate Components into LudicsPanel
**Files:**
- Modify: `components/deepdive/LudicsPanel.tsx`

**Changes:**
```tsx
// NEW structure (~400 lines):
export default function LudicsPanel({ deliberationId }: Props) {
  // State + hooks (~100 lines)
  const { data: designs, ... } = useSWR(...);
  const { data: trace } = useSWR(...);
  const { data: insightsData } = useSWR(...);
  
  // Handlers (~100 lines)
  const compileStep = async () => { ... };
  const step = async () => { ... };
  
  return (
    <div className="...">
      {/* Insights section (Phase 1) */}
      <div className="mb-4">
        <InsightsBadge insights={insightsData?.insights} />
        {/* ... metrics grid ... */}
      </div>
      
      {/* Actions Toolbar */}
      <LudicsActionsToolbar
        onCompile={compileStep}
        onStep={step}
        onCheckOrthogonal={checkOrthogonal}
        isLoading={loading}
      />
      
      {/* Trace Viewer */}
      <LudicsTraceViewer
        trace={trace}
        selectedStepIdx={selectedIdx}
        onStepSelect={setSelectedIdx}
        deliberationId={deliberationId}
      />
      
      {/* Tree Panel */}
      <LudicsTreePanel
        designs={designs}
        treeMode={treeMode}
        onTreeModeChange={setTreeMode}
        selectedAct={selectedAct}
        onActSelect={setSelectedAct}
        deliberationId={deliberationId}
      />
      
      {/* Commitments View */}
      <LudicsCommitmentsView
        deliberationId={deliberationId}
        selectedAct={selectedAct}
      />
      
      {/* Judge Console (conditional) */}
      {showJudge && <JudgeConsole />}
    </div>
  );
}
```

**DoD:**
- [ ] LudicsPanel.tsx is <400 lines
- [ ] All 4 sub-components imported and rendering
- [ ] All props passed correctly
- [ ] No visual regression (user confirms UI identical)

---

## Week 2: Command Integration (Nov 11-17)

### Task 2.7: Create Ludics Command Actions
**Files:**
- Create: `lib/dialogue/ludics-commands.ts`

**Commands to implement:**
```typescript
import type { CommandCardAction } from "@/components/dialogue/CommandCard";
import { Layers, Play, Target, Network, Eye } from "lucide-react";

export const ludicsCommands: CommandCardAction[] = [
  {
    id: "ludics:compile",
    label: "Compile Ludics Designs",
    description: "Compile dialogue moves into Ludics designs",
    icon: Layers,
    shortcut: "c",
    execute: async ({ deliberationId }) => {
      const res = await fetch("/api/ludics/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliberationId }),
      });
      if (!res.ok) throw new Error("Compile failed");
      return { success: true, message: "Designs compiled" };
    },
  },
  {
    id: "ludics:step",
    label: "Step Interaction",
    description: "Execute one step of the Ludics interaction",
    icon: Play,
    shortcut: "s",
    execute: async ({ deliberationId }) => {
      const res = await fetch("/api/ludics/step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliberationId }),
      });
      if (!res.ok) throw new Error("Step failed");
      return { success: true, message: "Step executed" };
    },
  },
  {
    id: "ludics:commit-at-locus",
    label: "Commit at Locus",
    description: "Open commitment dialog for specific locus",
    icon: Target,
    requiresTarget: true,
    execute: async ({ deliberationId, targetId, locusPath }) => {
      // Trigger NLCommitPopover programmatically
      window.dispatchEvent(new CustomEvent("ludics:commit", {
        detail: { deliberationId, locusPath },
      }));
      return { success: true, message: "Commit dialog opened" };
    },
  },
  {
    id: "ludics:check-orthogonality",
    label: "Check Orthogonality",
    description: "Analyze interaction for convergence/divergence",
    icon: Network,
    shortcut: "o",
    execute: async ({ deliberationId }) => {
      const res = await fetch(`/api/ludics/orthogonal?dialogueId=${deliberationId}`);
      if (!res.ok) throw new Error("Orthogonality check failed");
      const data = await res.json();
      return { 
        success: true, 
        message: `Status: ${data.status}`,
        data,
      };
    },
  },
  {
    id: "ludics:inspect-behaviour",
    label: "Inspect Behaviour",
    description: "View behaviour details for selected act",
    icon: Eye,
    requiresTarget: true,
    execute: async ({ targetId }) => {
      // Open BehaviourInspectorCard or similar
      window.dispatchEvent(new CustomEvent("ludics:inspect", {
        detail: { actId: targetId },
      }));
      return { success: true, message: "Inspector opened" };
    },
  },
];
```

**DoD:**
- [ ] File created with 5+ command definitions
- [ ] Each command has proper icon, label, description
- [ ] Execute functions call correct API endpoints
- [ ] Keyboard shortcuts match LudicsPanel (c/s/o)

---

### Task 2.8: Integrate Commands into Command Palette
**Files:**
- Modify: `components/dialogue/CommandCard.tsx` (or central registry)

**Changes:**
```tsx
// In command palette registration:
import { ludicsCommands } from "@/lib/dialogue/ludics-commands";

// Register commands:
const allCommands = [
  ...existingCommands,
  ...ludicsCommands,
];
```

**DoD:**
- [ ] Commands appear in command palette (Cmd+K or UI)
- [ ] Commands execute correctly
- [ ] Loading states work
- [ ] Error handling displays feedback

---

### Task 2.9: Add LudicsBadge to ArgumentCardV2
**Files:**
- Modify: `components/dialogue/ArgumentCardV2.tsx` (or similar)
- Use: `components/dialogue/LudicsBadge.tsx` (already exists per grep)

**Changes:**
```tsx
import { LudicsBadge } from "@/components/dialogue/LudicsBadge";

// Inside ArgumentCardV2 render:
<div className="flex items-center gap-2">
  {/* Existing badges */}
  <LudicsBadge 
    argumentId={argument.id}
    showOrthogonality={true}
    showDecisiveStep={true}
  />
</div>
```

**Badge should display:**
- 🟢 Orthogonality status (convergent/divergent/ongoing)
- ⭐ Decisive step indicator (if act is decisive)
- 🎯 Commitment anchor icon (if act has commitments)

**DoD:**
- [ ] LudicsBadge renders on ArgumentCardV2
- [ ] Badge shows correct states (orthogonal/decisive)
- [ ] Tooltip provides additional details
- [ ] Badge only shows when Ludics data exists

---

### Task 2.10: Testing & Validation
**Files:**
- All modified components

**Checks:**
1. **Line count:** `wc -l components/deepdive/LudicsPanel.tsx` < 400 ✅
2. **Component extraction:** All 4 components exist and render ✅
3. **UI consistency:** No duplicate `ChipBar`/`Segmented` definitions ✅
4. **Command palette:** 5+ Ludics commands available ✅
5. **Badges:** ArgumentCardV2 shows Ludics status ✅
6. **Functionality:** All existing features work (compile, step, orthogonal, trace, tree, commitments) ✅
7. **Performance:** No slowdowns in rendering or interactions ✅

**DoD:**
- [ ] All 7 checks pass
- [ ] User confirms UI is identical or improved
- [ ] No TypeScript errors
- [ ] No lint warnings
- [ ] Production build succeeds

---

## Phase 2 Definition of Done

**Must complete:**
- [x] LudicsPanel.tsx is <400 lines (current: 1,260)
- [ ] 4 sub-components extracted and working
- [ ] ChipBar replaced with Badge
- [ ] Segmented replaced with Tabs
- [ ] 5+ Ludics commands in command palette
- [ ] ArgumentCardV2 shows Ludics badges
- [ ] No visual or functional regression
- [ ] User approval

**Success metrics:**
- Code reduction: 1,260 → <400 lines (~68% reduction)
- Component modularity: 1 monolith → 5 composable components
- UI consistency: Custom components → design system components
- Developer UX: Command palette for all Ludics operations

---

## Notes

### Component Size Targets
| Component | Estimated Lines | Current Location |
|-----------|----------------|------------------|
| LudicsTraceViewer | ~150-200 | Lines 800-900 |
| LudicsTreePanel | ~200-250 | Lines 900-1000 |
| LudicsCommitmentsView | ~150-200 | Lines 1000-1100 |
| LudicsActionsToolbar | ~100-150 | Lines 750-850 |
| LudicsPanel (refactored) | ~350-400 | Main file |

### Dependencies
- `@/components/ui/badge` — Already exists ✅
- `@/components/ui/tabs` — Already exists ✅
- `@/components/dialogue/LudicsBadge` — Already exists ✅
- `@/components/dialogue/CommandCard` — Assume exists (common pattern)

### Risk Mitigation
- **Risk:** Breaking existing functionality during extraction
- **Mitigation:** Extract one component at a time, test after each extraction
- **Rollback:** Keep git commits atomic per component

### Future Work (Phase 3+)
- Phase 3: DebateSheet integration (annotate diagrams with Ludics data)
- Phase 4: Roadmap completion (additivity, behaviors service)
- Phase 5: Documentation for maintainers
