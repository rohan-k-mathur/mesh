# LociTreeWithControls Review & Enhancement Plan

**Date:** November 4, 2025  
**Context:** Comprehensive review after fixing DialogueMove → LudicAct integration

---

## Current State Analysis

### ✅ What Works (Minimally Functional)

1. **Basic Tree Rendering**
   - ✅ Fetches designs via SWR from `/api/ludics/designs`
   - ✅ Merges Proponent + Opponent designs into unified tree via `mergeDesignsToTree`
   - ✅ Renders LociTree with proper node hierarchy (now that WHY moves create child loci)
   - ✅ Shows act chips with polarity (P/O), expressions, additive markers (⊕)

2. **Composition Mode Toggle**
   - ✅ Supports 4 modes: `assoc`, `partial`, `spiritual`, `split`
   - ✅ Can switch modes and see visual labels via `MODE_LABEL`
   - ✅ Manual "Step with composition = X" button triggers `/api/ludics/step`

3. **Trace Integration**
   - ✅ `refreshTrace()` calls `/api/ludics/step` to get interaction pairs
   - ✅ Builds `heatmap` (locus → visit count) from trace pairs
   - ✅ Builds `stepIndexByActId` map for superscript step numbers on act chips
   - ✅ Detects `usedAdditive` (which branch was chosen in additive nodes)

4. **Focus & Navigation**
   - ✅ Tracks `focusPath` (most recent locus from trace)
   - ✅ Auto-scrolls to focused locus via `autoScrollOnFocus`
   - ✅ Keyboard navigation enabled via `enableKeyboardNav` (j/k keys in LociTree)
   - ✅ `onFocusPathChange` callback updates selected locus for controls

5. **Locus Controls Panel**
   - ✅ Shows "Controls for base `{selected}`"
   - ✅ **Copy (σ·i)** button → calls `/api/loci/copy` to duplicate locus structure
   - ✅ **∀ instantiate** input + button → calls `/api/loci/instantiate` with name (e.g., "a")
   - ✅ **UniformityPill** → shows uniformity status of child branches
   - ✅ `onRefresh` callback forces version bump → re-fetches tree

6. **Event-Driven Refresh**
   - ✅ Listens to `mesh:loci-updated` event (from Copy/Instantiate actions)
   - ✅ Listens to `dialogue:moves:refresh` event (from DialogueMove creation)
   - ✅ Bumps `version` state → forces LociTree re-render with `key={version}`

---

## ❌ Missing / Broken Features

### 1. **No Dialogue Integration in LociTree**
   - ❌ Acts are not clickable to open dialogue actions
   - ❌ No "WHY" button on acts to challenge them
   - ❌ No "GROUNDS" button to answer challenges
   - ❌ No commit modal integration (LudicsPanel has `commitAtPath` but LociTreeWithControls doesn't use it)
   - **Blocker:** LociTree doesn't expose `onActClick` or action buttons

### 2. **No AIF Node Linkage**
   - ❌ Acts don't show which AIF arguments/claims they correspond to
   - ❌ Can't click an act to jump to the argument card in AIFArgumentsListPro
   - ❌ No "provenance" metadata shown (which DialogueMove created this act?)
   - **Blocker:** LudicAct → AifNode → Argument linkage not surfaced in UI

### 3. **Controls Are Too Abstract**
   - ❌ "Copy (σ·i)" and "∀ instantiate" are ludics-theoretical operations
   - ❌ Most users don't know what these mean or when to use them
   - ❌ No tooltips or guidance explaining copy vs instantiate
   - ❌ No validation (e.g., can't copy a locus with no children)
   - **UX Issue:** Theoretical operations exposed without practical context

### 4. **Missing Act Inspection**
   - ❌ Can't click an act to see full details (ramification, openings, meta)
   - ❌ No "ActInspector" modal integration (exists in LudicsPanel but not here)
   - ❌ Can't see which CQ or scheme prompted an act
   - ❌ No delocation provenance shown (which design was "faxed" into this locus)
   - **Blocker:** LociTree doesn't call `onActClick` handler

### 5. **No Close/Daimon Suggestions**
   - ✅ `suggestCloseDaimonAt` prop exists (passed from LudicsPanel)
   - ❌ But no UI affordance to actually close a locus with daimon (†)
   - ❌ Should show "Close here" button when suggestion returns true
   - **Half-implemented:** Backend logic ready, frontend action missing

### 6. **Heatmap Not Visually Clear**
   - ✅ Heatmap data computed from trace
   - ❌ LociTree renders faint left stripe based on heat intensity
   - ❌ But no legend explaining what heat means (frequency? decisiveness?)
   - ❌ No color scale explanation
   - **UX Issue:** Visual indicator without semantic context

### 7. **Step Index Superscripts Unclear**
   - ✅ Shows tiny numbers on act chips (e.g., `P act¹²`)
   - ❌ No tooltip explaining "this act was used at step 12 in the trace"
   - ❌ Users may think it's an act ID suffix
   - **UX Issue:** Cryptic annotation without explanation

### 8. **Composition Mode Not Explained**
   - ✅ Toggle works, shows mode label
   - ❌ No description of what "assoc" vs "partial" vs "spiritual" mean
   - ❌ No guidance on when to use each mode
   - ❌ "Step with composition = X" button unclear purpose (is this trace generation?)
   - **UX Issue:** Advanced feature without onboarding

### 9. **No Convergence/Divergence Status**
   - ❌ Trace result includes `status: 'CONVERGENT' | 'DIVERGENT' | 'STUCK'`
   - ❌ But LociTreeWithControls doesn't display this
   - ❌ No visual indication of whether designs are orthogonal
   - ❌ No "Decisive indices" shown (which steps were decisive)
   - **Missing:** Core ludics verdict not surfaced

### 10. **No Commitment Integration**
   - ❌ LociTree has `onCommitHere` callback but it's not wired up
   - ❌ No commitment anchors (⚓) shown on acts
   - ❌ Can't create commitments from tree (unlike LudicsPanel)
   - **Blocker:** NLCommitPopover integration missing

---

## 🎯 Enhancement Roadmap: Make It Useful & Expressive

### Phase 1: Essential Dialogue Integration (High Priority)

**Goal:** Make acts actionable — users can challenge, answer, and commit from the tree

#### 1.1 Add Act Click Handler
```tsx
// LociTreeWithControls.tsx
const [selectedAct, setSelectedAct] = React.useState<string | null>(null);
const [actInspectorOpen, setActInspectorOpen] = React.useState(false);

// Pass to LociTree
<LociTree
  onActClick={(actId: string) => {
    setSelectedAct(actId);
    setActInspectorOpen(true);
  }}
  // ... other props
/>

{actInspectorOpen && selectedAct && (
  <ActInspector
    actId={selectedAct}
    onClose={() => setActInspectorOpen(false)}
  />
)}
```

**Requires:** Modify `LociTree.tsx` to accept `onActClick` and make act chips clickable

#### 1.2 Add Dialogue Action Buttons on Acts
```tsx
// LociTree node renderer: add buttons next to each act chip
{act.polarity === 'P' && (
  <button 
    onClick={() => openWhyModal(act.id)}
    className="text-xs px-1 py-0.5 rounded bg-amber-100 hover:bg-amber-200"
  >
    WHY?
  </button>
)}

{act.polarity === 'O' && (
  <button
    onClick={() => openGroundsModal(act.id)}
    className="text-xs px-1 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200"
  >
    GROUNDS
  </button>
)}
```

**Requires:** Wire up `WhyChallengeModal` and grounds response flow

#### 1.3 Add Commit Button on Loci
```tsx
// LociTree node: add "⚓ Commit" button in toolbar
<button
  onClick={() => openCommitModal(n.path)}
  className="text-xs px-1.5 py-0.5 rounded bg-indigo-100 hover:bg-indigo-200"
>
  ⚓ Commit
</button>
```

**Requires:** Add `NLCommitPopover` integration similar to LudicsPanel

#### 1.4 Show AIF Provenance
```tsx
// Fetch AIF nodes linked to acts
const { data: aifNodes } = useSWR(
  `/api/aif/nodes?deliberationId=${dialogueId}&hasLudicAct=true`,
  fetcher
);

// Build actId → argument/claim map
const actToArgument = React.useMemo(() => {
  const map = new Map();
  aifNodes?.nodes?.forEach(node => {
    if (node.ludicActId && node.sourceArgumentId) {
      map.set(node.ludicActId, { argId: node.sourceArgumentId, type: 'argument' });
    }
  });
  return map;
}, [aifNodes]);

// Show link icon on acts
{actToArgument.has(act.id) && (
  <button
    onClick={() => jumpToArgument(actToArgument.get(act.id).argId)}
    className="text-xs text-blue-600 hover:underline"
    title="View source argument"
  >
    🔗
  </button>
)}
```

---

### Phase 2: Visual Clarity & Guidance (Medium Priority)

**Goal:** Make the UI self-explanatory with tooltips, legends, and status indicators

#### 2.1 Add Composition Mode Tooltips
```tsx
<CompositionModeToggle
  value={mode}
  onChange={(m) => { setMode(m); setVersion(v => v + 1); }}
  tooltip={{
    assoc: "Associative: Full parallel composition (⊗)",
    partial: "Partial: Limited interaction zones",
    spiritual: "Spiritual: Abstract modal composition",
    split: "Split: Independent evaluation"
  }}
/>
```

#### 2.2 Add Heatmap Legend
```tsx
<div className="text-xs text-slate-600 mb-1 flex items-center gap-2">
  <div className="flex items-center gap-1">
    <div className="w-3 h-3 bg-rose-100 border" />
    <span>Low activity</span>
  </div>
  <div className="flex items-center gap-1">
    <div className="w-3 h-3 bg-rose-300 border" />
    <span>Medium</span>
  </div>
  <div className="flex items-center gap-1">
    <div className="w-3 h-3 bg-rose-500 border" />
    <span>High</span>
  </div>
  <span className="ml-2 text-slate-500">← Trace frequency</span>
</div>
```

#### 2.3 Show Convergence Status Badge
```tsx
// After refreshTrace, extract status
const [traceStatus, setTraceStatus] = React.useState<'CONVERGENT' | 'DIVERGENT' | 'STUCK' | null>(null);

// In refreshTrace callback:
setTraceStatus(j?.status ?? null);

// Render status badge
<div className="flex items-center gap-2">
  <CompositionModeToggle ... />
  {traceStatus && (
    <span className={`text-xs px-2 py-1 rounded border ${
      traceStatus === 'CONVERGENT' ? 'bg-emerald-100 border-emerald-300 text-emerald-700' :
      traceStatus === 'DIVERGENT' ? 'bg-rose-100 border-rose-300 text-rose-700' :
      'bg-amber-100 border-amber-300 text-amber-700'
    }`}>
      {traceStatus === 'CONVERGENT' ? '✓ Convergent' : 
       traceStatus === 'DIVERGENT' ? '✗ Divergent' : 
       '⚠ Stuck'}
    </span>
  )}
</div>
```

#### 2.4 Add Step Index Tooltip
```tsx
// In LociTree act chip renderer
<span 
  className="..." 
  title={stepIdx ? `Used at step ${stepIdx} in trace` : undefined}
>
  {label} {a.isAdditive ? '⊕' : ''}
  {typeof stepIdx === 'number' ? (
    <sup className="ml-1 text-[10px] text-indigo-600">{stepIdx}</sup>
  ) : null}
</span>
```

#### 2.5 Add Controls Help Text
```tsx
<div className="text-xs text-slate-600 mb-2 space-y-1">
  <p><strong>Copy (σ·i):</strong> Duplicate this locus structure for reuse</p>
  <p><strong>∀ instantiate:</strong> Create a universal quantifier binding at this locus</p>
  <p><em>Advanced operations — most users can ignore these.</em></p>
</div>
```

---

### Phase 3: Advanced Features (Lower Priority)

**Goal:** Surface deeper ludics semantics and enable power-user workflows

#### 3.1 Show Ramification Arrows
```tsx
// In act chip: show ramification targets
{act.ramification?.length > 0 && (
  <span className="text-[10px] text-slate-500 ml-1">
    → {act.ramification.join(', ')}
  </span>
)}
```

#### 3.2 Show Delocation Provenance
```tsx
// In act meta: detect delocation
{act.meta?.delocated && (
  <span 
    className="text-xs text-purple-600 ml-1"
    title={`Faxed from design ${act.meta.delocatedFromDesignId}`}
  >
    📠
  </span>
)}
```

#### 3.3 Add CQ/Scheme Badges
```tsx
// In act meta: show CQ context
{act.meta?.cqId && (
  <span className="text-xs px-1 py-0.5 rounded bg-blue-100 text-blue-700 ml-1">
    CQ: {act.meta.cqId}
  </span>
)}

{act.meta?.schemeKey && (
  <span className="text-xs px-1 py-0.5 rounded bg-purple-100 text-purple-700 ml-1">
    {act.meta.schemeKey}
  </span>
)}
```

#### 3.4 Add Decisive Step Highlighting
```tsx
// From trace: j.decisiveIndices = [3, 7]
const [decisiveIndices, setDecisiveIndices] = React.useState<number[]>([]);

// In refreshTrace:
setDecisiveIndices(j?.decisiveIndices ?? []);

// In act chip renderer: highlight decisive acts
const isDecisive = stepIdx && decisiveIndices.includes(stepIdx);

<span className={`... ${isDecisive ? 'ring-2 ring-yellow-400 bg-yellow-50' : ''}`}>
  {label} {isDecisive && '⭐'}
</span>
```

#### 3.5 Add Close/Daimon Action
```tsx
// When suggestCloseDaimonAt returns true for a locus:
{suggestCloseDaimonAt?.(n.path) && (
  <button
    onClick={() => closeLocus(n.path)}
    className="text-xs px-2 py-1 rounded bg-slate-800 text-white hover:bg-slate-900"
  >
    † Close
  </button>
)}

async function closeLocus(path: string) {
  // Call /api/ludics/close or similar
  await post('/api/dialogue/move', {
    deliberationId: dialogueId,
    targetType: 'claim', // or from context
    targetId: targetIdFromContext,
    kind: 'CLOSE',
    payload: { locusPath: path, expression: 'END' },
  });
  setVersion(v => v + 1); // refresh
}
```

---

## 🚀 Implementation Priority

### Immediate (This Week)
1. ✅ Fix WHY moves creating child loci (DONE)
2. ⬜ Add act click handler + ActInspector modal
3. ⬜ Add WHY/GROUNDS buttons on acts
4. ⬜ Add convergence status badge

### Short-Term (Next Week)
5. ⬜ Add commit button + NLCommitPopover
6. ⬜ Add AIF provenance links (🔗 icon)
7. ⬜ Add composition mode tooltips
8. ⬜ Add heatmap legend

### Medium-Term (Next Sprint)
9. ⬜ Add controls help text
10. ⬜ Add step index tooltips
11. ⬜ Add CQ/scheme badges on acts
12. ⬜ Add decisive step highlighting

### Long-Term (Future)
13. ⬜ Add ramification arrow visualization
14. ⬜ Add delocation provenance (📠 icon)
15. ⬜ Add close/daimon action button
16. ⬜ Add keyboard shortcuts (e.g., 'w' for WHY, 'g' for GROUNDS)

---

## 📊 Success Metrics

**Usability Goals:**
- ✅ Users can see their dialogue moves reflected as ludic acts (fixed)
- ⬜ Users can challenge acts directly from tree (not just from argument cards)
- ⬜ Users understand what composition modes do (tooltips)
- ⬜ Users can see convergence/divergence at a glance (status badge)
- ⬜ Users can jump between ludics tree ↔ AIF arguments (provenance links)

**Expressiveness Goals:**
- ⬜ Tree shows CQ/scheme context for each act
- ⬜ Tree highlights decisive steps in interaction
- ⬜ Tree shows delocation provenance (which evidence was "faxed")
- ⬜ Tree shows ramification structure (openings/responses)
- ⬜ Advanced users can copy/instantiate loci with guidance

---

## 🔧 Technical Debt to Address

1. **Type Safety:** `any` types in several places (designsResp, trace pairs, event handlers)
2. **Error Handling:** Silent `.catch(() => {})` in refreshTrace — should show toast
3. **Loading States:** No skeleton/spinner for tree while `!root`
4. **Accessibility:** Missing ARIA labels on controls buttons
5. **Performance:** `mergeDesignsToTree` runs on every render if designsArray changes
6. **Event Naming:** `mesh:loci-updated` vs `dialogue:moves:refresh` inconsistent

---

## 📝 Notes

- LociTreeWithControls is currently a "viewer" not an "editor" — it shows the tree but doesn't let you interact meaningfully
- Most ludics operations (copy, instantiate, step) are exposed but not explained
- The component is functional for debugging/inspection but not yet useful for end-users conducting deliberations
- Integration with dialogue layer (WHY/GROUNDS/COMMIT) is the #1 priority to make it actionable
- Once actionable, adding visual clarity (status badges, tooltips, legends) will make it self-explanatory

---

## Next Steps

1. **Immediate:** Add `onActClick` handler + ActInspector modal (1-2 hours)
2. **Next:** Add WHY/GROUNDS buttons on act chips (2-3 hours)
3. **Then:** Add convergence status badge (30 mins)
4. **After:** Add commit button + NLCommitPopover (1-2 hours)

**Total to "Minimally Actionable":** ~1 day of focused work

**Total to "Truly Useful":** ~3-4 days with all Phase 1 + Phase 2 features
