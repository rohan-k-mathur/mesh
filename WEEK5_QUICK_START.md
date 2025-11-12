# Week 5 Implementation Guide - Quick Start

**Phase**: Overhaul Integration - Arguments Tab Enhancement  
**Estimated Time**: 8 hours  
**Risk**: Low (all components tested)  
**Start Date**: December 2, 2025

---

## Pre-Flight Checklist

### Components Ready ✅
- [x] ArgumentNetAnalyzer (`components/argumentation/ArgumentNetAnalyzer.tsx`)
- [x] NetworksSection (`components/deepdive/v3/sections/NetworksSection.tsx`)
- [x] BurdenOfProofIndicators (`components/argumentation/BurdenOfProofIndicators.tsx`)

### Test Pages Validated ✅
- [x] `/app/test/net-analyzer/page.tsx` - Full ArgumentNetAnalyzer demo
- [x] `/app/(app)/examples/burden-indicators/page.tsx` - All burden variants
- [x] NetworksSection component integrated in V3 sections

### APIs Ready ✅
- [x] `/api/nets/detect` - Net detection
- [x] `/api/nets/[id]` - Net details
- [x] `/api/nets/[id]/cqs` - Composed CQs
- [x] `/api/nets/[id]/dependencies` - Dependency analysis

### Prerequisites ✅
- [x] Week 4 complete - ArgumentsTab extracted
- [x] Tab components in `components/deepdive/v3/tabs/`
- [x] Shared hooks available

---

## Task Breakdown

### Task 5.1: ArgumentNetAnalyzer Integration (4 hours)

**File**: `components/deepdive/v3/tabs/ArgumentsTab.tsx`

**What to Add**:
1. Import ArgumentNetAnalyzer and Dialog
2. Add state for net analyzer (open/closed, selected argument)
3. Replace "View CQs" button with "Analyze Argument"
4. Add Dialog wrapper with ArgumentNetAnalyzer

**Code Template**:
```typescript
import { ArgumentNetAnalyzer } from "@/components/argumentation/ArgumentNetAnalyzer";
import { Dialog, DialogContent } from "@/components/ui/dialog";

// State
const [netAnalyzerOpen, setNetAnalyzerOpen] = useState(false);
const [selectedArgumentId, setSelectedArgumentId] = useState<string | null>(null);

// Button
<Button onClick={() => {
  setSelectedArgumentId(arg.id);
  setNetAnalyzerOpen(true);
}}>
  Analyze Argument
</Button>

// Dialog
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

**Testing**:
- Single-scheme args show CQs normally
- Multi-scheme args show net graph
- Graph is interactive
- CQs grouped correctly
- Burden badges display

**Reference**: `app/test/net-analyzer/page.tsx` lines 1-989

---

### Task 5.2: NetworksSection Integration (2 hours)

**File**: `components/deepdive/v3/tabs/ArgumentsTab.tsx`

**What to Add**:
1. Import NetworksSection
2. Add section below arguments list
3. Wire deliberationId prop

**Code Template**:
```typescript
import { NetworksSection } from "@/components/deepdive/v3/sections/NetworksSection";

// In render
<div className="space-y-4">
  {/* Existing arguments */}
  <SectionCard title="Arguments">
    {/* ... */}
  </SectionCard>
  
  {/* NEW: Networks */}
  <NetworksSection deliberationId={deliberationId} />
</div>
```

**Testing**:
- Section appears below arguments
- Detects nets on page load
- Click "Analyze Net" opens ArgumentNetAnalyzer
- Shows net stats (type, complexity, confidence)
- Empty state when no nets

**Reference**: `components/deepdive/v3/sections/NetworksSection.tsx`

---

### Task 5.3: Burden of Proof Badges (2 hours)

**Files**: 
- `components/deepdive/v3/tabs/ArgumentsTab.tsx`
- Anywhere CQs are displayed

**What to Add**:
1. Import BurdenOfProofBadge
2. Add badge to CQ rendering
3. Ensure tooltips work

**Code Template**:
```typescript
import { 
  BurdenOfProofBadge 
} from "@/components/argumentation/BurdenOfProofIndicators";

// In CQ list
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

**Testing**:
- Badges on all CQs
- Correct colors (proponent vs challenger)
- Tooltips explain burden
- "Requires Evidence" badge when applicable
- Works in net analyzer and simple view

**Reference**: `app/(app)/examples/burden-indicators/page.tsx` lines 1-151

---

## Quick Commands

### Review Test Pages
```bash
# Open test pages in browser
open http://localhost:3000/test/net-analyzer
open http://localhost:3000/examples/burden-indicators

# Read test page code
cat app/test/net-analyzer/page.tsx
cat app/(app)/examples/burden-indicators/page.tsx
```

### Review Components
```bash
# Read component implementations
cat components/argumentation/ArgumentNetAnalyzer.tsx
cat components/deepdive/v3/sections/NetworksSection.tsx
cat components/argumentation/BurdenOfProofIndicators.tsx
```

### Lint Check
```bash
npm run lint -- --file components/deepdive/v3/tabs/ArgumentsTab.tsx
```

---

## Success Criteria

### Task 5.1 Success
- [ ] ArgumentNetAnalyzer opens from argument cards
- [ ] Single-scheme args fall back to simple CQ view
- [ ] Multi-scheme args show net graph
- [ ] Graph nodes clickable
- [ ] CQs grouped by scheme
- [ ] No console errors

### Task 5.2 Success
- [ ] NetworksSection visible in Arguments tab
- [ ] Detects existing nets in deliberation
- [ ] Shows net statistics
- [ ] "Analyze Net" button opens ArgumentNetAnalyzer
- [ ] Empty state shows helpful message

### Task 5.3 Success
- [ ] All CQs have burden badges
- [ ] Proponent burden = blue/cyan color
- [ ] Challenger burden = amber/orange color
- [ ] Tooltips explain burden meaning
- [ ] Evidence flag shows when required

---

## Troubleshooting

### Issue: Component not found
**Solution**: Check import paths, ensure Week 4 extraction complete

### Issue: API errors
**Solution**: Verify `/api/nets/*` endpoints work with curl:
```bash
curl http://localhost:3000/api/nets/detect -X POST \
  -H "Content-Type: application/json" \
  -d '{"argumentId":"test-arg-id"}'
```

### Issue: Dialog not opening
**Solution**: Check Dialog state management, ensure DialogContent has proper className

### Issue: Burden badges not showing
**Solution**: Verify CQ schema has `burdenOfProof` and `requiresEvidence` fields

---

## Time Estimates

| Task | Estimate | Actual |
|------|----------|--------|
| 5.1: ArgumentNetAnalyzer | 4h | ___ |
| 5.2: NetworksSection | 2h | ___ |
| 5.3: Burden Badges | 2h | ___ |
| **Total** | **8h** | ___ |

---

## Deliverables

By end of Week 5:
- ✅ Arguments tab is net-aware
- ✅ ArgumentNetAnalyzer integrated
- ✅ NetworksSection showing deliberation nets
- ✅ Burden badges on all CQs
- ✅ Test pages validated patterns work in production
- ✅ No regressions in existing functionality

---

## Next Week Preview

**Week 6** (10 hours):
- Attack Suggestions integration
- AttackConstructionWizard workflow
- Quality validation
- Evidence guidance

---

**Ready to Start**: Yes ✅  
**Blockers**: None  
**Questions**: Review with team before starting
