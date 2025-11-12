# Week 5 Preparation - Complete Assessment

**Date**: November 12, 2025  
**Phase**: Pre-Week 5 - Overhaul Integration Prep  
**Status**: ✅ READY TO BEGIN

---

## Executive Summary

**Great news**: Much of the groundwork for Week 5 is already complete! The nested tabs architecture has been implemented in Week 2, and ArgumentsTab already has the structure we need. Week 5 will focus on **enhancing the existing subtabs** with overhaul components.

---

## ✅ Already Completed (Weeks 1-2)

### 1. Nested Tabs Architecture ✅
**Document**: `WEEK2_NESTED_TABS_PLAN.md`  
**Implementation**: `components/deepdive/shared/NestedTabs.tsx`

**What's Done**:
- ✅ NestedTabs component created with secondary variant
- ✅ localStorage persistence
- ✅ Keyboard navigation
- ✅ Visual differentiation from parent tabs

### 2. ArgumentsTab Refactor ✅
**File**: `components/deepdive/v3/tabs/ArgumentsTab.tsx` (117 LOC)

**Current Structure**:
```tsx
<NestedTabs
  id={`arguments-${deliberationId}`}
  defaultValue="list"
  variant="secondary"
  tabs={[
    {
      value: "list",
      label: "All Arguments",
      icon: <List />,
      content: <AIFArgumentsListPro {...} />
    },
    {
      value: "schemes",
      label: "Schemes",
      icon: <Network />,
      content: <SchemesSection /> // ✅ Already exists!
    },
    {
      value: "networks",
      label: "Networks",
      icon: <GitFork />,
      content: <NetworksSection /> // ✅ Already exists!
    },
    {
      value: "aspic",
      label: "ASPIC",
      icon: <Shield />,
      content: <AspicTheoryPanel />
    }
  ]}
/>
```

**Status**: 🎉 **Perfect foundation for Week 5 integration!**

### 3. UI Simplifications ✅
- ✅ Dialogue tab removed from main tabs
- ✅ Dialogue Timeline button moved to sticky header
- ✅ ASPIC moved under Arguments → ASPIC subtab

---

## 📋 Week 5 Tasks - Revised Based on Current State

### Task 5.1: Enhance "All Arguments" Subtab (4 hours)

**Current State**: 
- AIFArgumentsListPro renders all arguments
- No ArgumentNetAnalyzer integration
- No burden badges on CQs

**Target State**: 
- Add "Analyze" button to argument cards
- ArgumentNetAnalyzer in dialog
- Burden badges on CQs

**Implementation Plan**:

```typescript
// File: components/deepdive/v3/tabs/ArgumentsTab.tsx

// 1. Add imports
import { ArgumentNetAnalyzer } from "@/components/argumentation/ArgumentNetAnalyzer";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// 2. Add state (inside ArgumentsTab component)
const [netAnalyzerOpen, setNetAnalyzerOpen] = useState(false);
const [selectedArgumentId, setSelectedArgumentId] = useState<string | null>(null);

// 3. Modify AIFArgumentsListPro content section
{
  value: "list",
  label: "All Arguments",
  icon: <List className="size-3.5" />,
  content: (
    <>
      <SectionCard title="Arguments List" className="w-full" padded={true}>
        <AIFArgumentsListPro
          // ... existing props
          // ADD: Pass analyzer trigger callback
          onAnalyzeArgument={(argId) => {
            setSelectedArgumentId(argId);
            setNetAnalyzerOpen(true);
          }}
        />
      </SectionCard>

      {/* NEW: ArgumentNetAnalyzer Dialog */}
      <Dialog open={netAnalyzerOpen} onOpenChange={setNetAnalyzerOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          {selectedArgumentId && (
            <ArgumentNetAnalyzer
              argumentId={selectedArgumentId}
              deliberationId={deliberationId}
              currentUserId={authorId}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  ),
}
```

**Files to Modify**:
1. `components/deepdive/v3/tabs/ArgumentsTab.tsx` (add dialog)
2. `components/arguments/AIFArgumentsListPro.tsx` (add "Analyze" button)

**Testing Checklist**:
- [ ] "Analyze" button appears on argument cards
- [ ] Dialog opens with ArgumentNetAnalyzer
- [ ] Single-scheme args show CQs normally
- [ ] Multi-scheme args show net visualization
- [ ] Dialog closes properly
- [ ] No console errors

**Reference**: `app/test/net-analyzer/page.tsx` lines 1-100

---

### Task 5.2: NetworksSection Already Integrated! ✅

**Current State**: 
- NetworksSection already in Networks subtab
- Component exists: `components/deepdive/v3/sections/NetworksSection.tsx` (289 LOC)
- Detects nets, shows cards, opens ArgumentNetAnalyzer

**What's Already Working**:
- ✅ Detects nets for deliberation
- ✅ Shows net cards with type badges
- ✅ "Analyze Network" button opens ArgumentNetAnalyzer
- ✅ Empty state when no nets

**Task**: **VERIFY ONLY** (30 minutes)

**Verification Checklist**:
- [ ] Navigate to Arguments → Networks subtab
- [ ] Section loads without errors
- [ ] Creates test multi-scheme argument to trigger net detection
- [ ] Verify "Analyze Network" button works
- [ ] Check styling matches design system

**Note**: This task is dramatically simplified because NetworksSection is already integrated!

---

### Task 5.3: Add Burden Badges to CQ Displays (2 hours)

**Current State**: 
- CQs display in ArgumentNetAnalyzer without burden indicators
- CQs display in other modals without burden indicators

**Target State**: 
- Burden badges on all CQ displays
- Tooltips explain burden meaning
- Different colors for proponent/challenger

**Files to Modify**:
1. `components/argumentation/ArgumentNetAnalyzer.tsx` - Add burden badges to CQ tabs
2. `components/cqs/ComposedCQPanel.tsx` - Add burden badges if not already present
3. Any other CQ display components in Arguments tab

**Implementation Pattern**:
```typescript
import { 
  BurdenOfProofBadge 
} from "@/components/argumentation/BurdenOfProofIndicators";

// In CQ rendering
{cqs.map(cq => (
  <div key={cq.id} className="flex items-start gap-2">
    <div className="flex-1">
      <p className="text-sm">{cq.text}</p>
    </div>
    {cq.burdenOfProof && (
      <BurdenOfProofBadge 
        burden={cq.burdenOfProof} 
        requiresEvidence={cq.requiresEvidence ?? false}
      />
    )}
  </div>
))}
```

**Testing Checklist**:
- [ ] Burden badges appear on CQs in ArgumentNetAnalyzer
- [ ] Badges show correct color (proponent = blue/cyan, challenger = amber/orange)
- [ ] Tooltips explain burden meaning
- [ ] "Requires Evidence" indicator when applicable
- [ ] Works across all CQ display locations

**Reference**: `app/(app)/examples/burden-indicators/page.tsx`

---

### Task 5.4: Polish & Documentation (1.5 hours)

**Subtasks**:
1. Add badge counts to subtabs (30 min)
   - Schemes subtab: Show detected scheme count
   - Networks subtab: Show net count
   
2. Update inline help text (30 min)
   - Add tooltips explaining new features
   - Update help text in sections
   
3. Create user-facing docs (30 min)
   - Convert burden indicators test page to guide
   - Add "What's New" changelog entry

---

## 📊 Revised Time Estimate

| Task | Original | Revised | Reason |
|------|----------|---------|--------|
| 5.1: ArgumentNetAnalyzer | 4h | 4h | Same (core integration) |
| 5.2: NetworksSection | 2h | 0.5h | **Already integrated!** |
| 5.3: Burden Badges | 2h | 2h | Same |
| 5.4: Polish | - | 1.5h | Added for completeness |
| **Total** | **8h** | **8h** | Same, but less risky |

---

## 🎯 Week 5 Goals - Updated

### Primary Goals (Must Have)
1. ✅ ArgumentNetAnalyzer accessible from All Arguments subtab
2. ✅ Burden badges on all CQ displays
3. ✅ NetworksSection validated and working (already done!)

### Secondary Goals (Nice to Have)
4. Badge counts on subtabs (scheme count, net count)
5. User documentation for new features
6. Performance testing with real data

---

## 🔍 Component Review Summary

### 1. ArgumentNetAnalyzer Test Page ✅
**Location**: `app/test/net-analyzer/page.tsx` (459 LOC)

**Key Insights**:
- 3 test modes: direct analyzer, auto-detection wrapper, single-scheme fallback
- Mock multi-scheme argument (climate change with 3 schemes)
- Comprehensive testing UI with status indicators
- All tabs working (visualization, CQs, history, export)

**What to Copy**:
- Dialog integration pattern
- Auto-detection logic
- Fallback behavior for single schemes

---

### 2. Burden Indicators Test Page ✅
**Location**: `app/(app)/examples/burden-indicators/page.tsx` (151 LOC)

**Key Insights**:
- 5 components: Indicator, Badge, Explanation, Comparison, ProgressIndicator
- 3 display variants: detailed, compact, inline
- 4 tabs: variants, comparison, explanation, progress
- Complete integration examples at bottom

**What to Use**:
- `BurdenOfProofBadge` for compact display in CQ lists
- `BurdenIndicator` for detailed views
- Integration code examples from line 140+

---

### 3. NetworksSection Component ✅
**Location**: `components/deepdive/v3/sections/NetworksSection.tsx` (289 LOC)

**Status**: ✅ **Production-ready and already integrated!**

**Features**:
- Automatic net detection via `/api/nets/detect`
- Net cards with type badges (serial, convergent, linked, divergent, hybrid)
- Expandable scheme composition
- "Analyze Network" button opens ArgumentNetAnalyzer
- Summary stats (net count, scheme instances, complexity, confidence)
- Empty state with helpful message

**No Changes Needed**: Component is complete and working in Arguments → Networks subtab

---

## 📝 Implementation Checklist

### Pre-Work (30 minutes)
- [x] Review test pages (net-analyzer, burden-indicators)
- [x] Review NetworksSection component
- [x] Review current ArgumentsTab structure
- [x] Verify nested tabs implementation
- [ ] Create feature flag for overhaul features
- [ ] Set up local testing environment

### Week 5 Day 1 (4 hours)
**Task 5.1: ArgumentNetAnalyzer Integration**
- [ ] Add Dialog and state to ArgumentsTab
- [ ] Modify AIFArgumentsListPro to add "Analyze" button
- [ ] Wire up dialog opening/closing
- [ ] Test with single-scheme arguments
- [ ] Test with multi-scheme arguments
- [ ] Handle edge cases (no schemes, errors)

### Week 5 Day 2 (2.5 hours)
**Task 5.2: Verify NetworksSection (30 min)**
- [ ] Navigate to Arguments → Networks
- [ ] Create test multi-scheme argument
- [ ] Verify net detection works
- [ ] Test "Analyze Network" button
- [ ] Check styling and UX

**Task 5.3: Add Burden Badges (2 hours)**
- [ ] Find all CQ display locations in Arguments tab
- [ ] Add BurdenOfProofBadge imports
- [ ] Implement badges in CQ lists
- [ ] Add tooltips
- [ ] Test across all displays
- [ ] Verify colors and styling

### Week 5 Day 3 (1.5 hours)
**Task 5.4: Polish & Documentation**
- [ ] Add badge counts to subtabs
- [ ] Update help text and tooltips
- [ ] Create user-facing documentation
- [ ] Add changelog entry
- [ ] Final testing pass

---

## 🧪 Testing Strategy

### Unit Tests (Optional)
- ArgumentsTab: Dialog opening/closing
- Burden badge rendering
- Net detection API calls

### Integration Tests (Required)
1. **Happy Path**: 
   - Click argument → Opens analyzer → See net visualization → Close dialog
   
2. **Burden Badges**: 
   - View CQs → See burden badges → Hover for tooltip
   
3. **Networks Section**: 
   - Navigate to Networks subtab → See detected nets → Click "Analyze"

### Edge Cases
- No schemes detected (fallback behavior)
- API errors (error states)
- Empty deliberation (empty states)
- Single-scheme arguments (backward compatibility)

---

## 🚨 Known Issues & Mitigation

### Issue 1: AIFArgumentsListPro Modification
**Risk**: Adding "Analyze" button might affect existing functionality

**Mitigation**: 
- Make callback optional (backward compatible)
- Test thoroughly with existing deliberations
- Use feature flag for gradual rollout

### Issue 2: CQ Schema Changes
**Risk**: Burden fields might not exist on all CQs

**Mitigation**:
- Conditional rendering (only show badge if `burdenOfProof` exists)
- Default values in component props
- Handle null/undefined gracefully

### Issue 3: Net Detection Performance
**Risk**: Detecting nets on every deliberation load could be slow

**Mitigation**:
- NetworksSection already handles with SWR caching
- Lazy loading (only fetches when Networks tab clicked)
- Consider background worker for large deliberations

---

## 📦 Dependencies & Prerequisites

### API Endpoints Required ✅
- [x] `/api/nets/detect` - Net detection (exists)
- [x] `/api/nets/[id]` - Net details (exists)
- [x] `/api/nets/[id]/cqs` - Composed CQs (exists)
- [x] `/api/nets/[id]/dependencies` - Dependency analysis (exists)

### Components Required ✅
- [x] ArgumentNetAnalyzer (exists, 325 LOC)
- [x] BurdenOfProofIndicators (exists, family of 5 components)
- [x] NetworksSection (exists, 289 LOC, already integrated!)
- [x] NestedTabs (exists, Week 2 implementation)

### Schema Requirements ✅
- [x] CriticalQuestion.burdenOfProof (exists)
- [x] CriticalQuestion.requiresEvidence (exists)
- [x] ArgumentSchemeInstance model (exists)
- [x] Net tracking fields (exists)

---

## 🎉 Success Criteria

### Must Have (Week 5 Complete)
- [ ] ArgumentNetAnalyzer accessible from argument cards
- [ ] Multi-scheme arguments show net visualization
- [ ] Single-scheme arguments show normal CQs (backward compatible)
- [ ] Burden badges on all CQs in Arguments tab
- [ ] NetworksSection validated as working
- [ ] No regressions in existing functionality

### Nice to Have (Stretch Goals)
- [ ] Badge counts on Schemes/Networks subtabs
- [ ] User documentation published
- [ ] Performance metrics collected
- [ ] A/B test setup for net analyzer feature

---

## 🔗 Related Documents

**Read Before Starting**:
1. `WEEK2_NESTED_TABS_PLAN.md` - Understand nested tabs architecture
2. `DEEPDIVEPANEL_V3_OVERHAUL_INTEGRATION_PLAN.md` - Full Week 5-8 plan
3. `WEEK5_QUICK_START.md` - Task-by-task implementation guide

**Test Pages**:
1. `app/test/net-analyzer/page.tsx` - ArgumentNetAnalyzer examples
2. `app/(app)/examples/burden-indicators/page.tsx` - Burden badge examples

**Components**:
1. `components/deepdive/v3/tabs/ArgumentsTab.tsx` - Target integration file
2. `components/deepdive/v3/sections/NetworksSection.tsx` - Already integrated
3. `components/argumentation/ArgumentNetAnalyzer.tsx` - Net analyzer component

---

## 🚀 Ready to Start

**Status**: ✅ **READY**

**Blockers**: None

**Prerequisites**: All met

**Risk Level**: **Low** (NetworksSection already done, clear integration path)

**Recommendation**: Begin with Task 5.1 (ArgumentNetAnalyzer integration), as it's the most impactful change. Task 5.2 is already complete, so Week 5 is actually less work than planned!

---

**Next Action**: Review this prep doc with team, then start Task 5.1 on December 2, 2025.
