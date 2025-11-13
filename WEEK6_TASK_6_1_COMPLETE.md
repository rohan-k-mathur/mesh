# Week 6 Task 6.1 - Attack Suggestions Integration

**Date**: November 12, 2025  
**Status**: ✅ Complete  
**Time**: ~30 minutes (vs. 6h estimated)

---

## Summary

Integrated AI-assisted attack generation workflow into the Arguments tab, allowing users to generate strategic counterarguments with a single click.

---

## Implementation

### Files Modified

1. **components/arguments/AIFArgumentsListPro.tsx** (+28 lines)
   - Added `onGenerateAttack` prop to component interface
   - Added "Generate Attack" button next to "Analyze Net" button
   - Button styled in rose/red theme to indicate offensive action

2. **components/deepdive/v3/tabs/ArgumentsTab.tsx** (+56 lines)
   - Imported `AttackSuggestions` and `AttackConstructionWizard` components
   - Added attack generation state management (4 state variables)
   - Added `onGenerateAttack` callback to AIFArgumentsListPro
   - Added Attack Suggestions dialog (claimId-based)
   - Added Attack Construction Wizard dialog (multi-step wizard)

---

## Changes Detail

### 1. Added "Generate Attack" Button

**Location**: `AIFArgumentsListPro.tsx` lines 792-805

```typescript
{/* Week 6 Task 6.1: Generate Attack button */}
{onGenerateAttack && (
  <button
    onClick={() => onGenerateAttack(a.id)}
    className="
      inline-flex items-center gap-2 px-3 py-1.5 btnv2 rounded-lg text-xs font-medium
      bg-rose-50 text-rose-700 border border-rose-200 
      hover:bg-rose-100 transition-all duration-200 shadow-sm hover:shadow
    "
    title="Generate strategic attacks for this argument"
  >
    <Swords className="w-4 h-4" />
    Generate Attack
  </button>
)}
```

**Visual Design**:
- 🌹 Rose/red color scheme (offensive action indicator)
- ⚔️ Swords icon (attack metaphor)
- Consistent styling with existing "Analyze Net" button
- Tooltip explains functionality

### 2. Attack Generation State

**Location**: `ArgumentsTab.tsx` lines 54-57

```typescript
// Week 6 Task 6.1: Attack generation state
const [attackTargetId, setAttackTargetId] = useState<string | null>(null);
const [selectedAttack, setSelectedAttack] = useState<AttackSuggestion | null>(null);
const [wizardOpen, setWizardOpen] = useState(false);
const [attackRefreshKey, setAttackRefreshKey] = useState(0);
```

**State Flow**:
1. **attackTargetId**: Tracks which argument user wants to attack
2. **selectedAttack**: Stores the chosen attack strategy from suggestions
3. **wizardOpen**: Controls wizard dialog visibility
4. **attackRefreshKey**: Triggers arguments list refresh after attack creation

### 3. Attack Suggestions Dialog

**Location**: `ArgumentsTab.tsx` lines 152-171

```typescript
<Dialog 
  open={!!attackTargetId && !wizardOpen} 
  onOpenChange={(open) => !open && setAttackTargetId(null)}
>
  <DialogContent className="max-w-4xl bg-white max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Generate Strategic Attack</DialogTitle>
    </DialogHeader>
    {attackTargetId && (
      <AttackSuggestions
        targetClaimId={attackTargetId}
        targetArgumentId={attackTargetId}
        onAttackSelect={(suggestion) => {
          setSelectedAttack(suggestion);
          setWizardOpen(true);
        }}
      />
    )}
  </DialogContent>
</Dialog>
```

**Functionality**:
- Shows only when attackTargetId is set AND wizard not open
- Displays ranked attack strategies
- Shows burden of proof for each strategy
- User selects strategy → opens wizard

### 4. Attack Construction Wizard Dialog

**Location**: `ArgumentsTab.tsx` lines 173-199

```typescript
<Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
  <DialogContent className="max-w-6xl bg-white max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Construct Attack</DialogTitle>
    </DialogHeader>
    {attackTargetId && selectedAttack && (
      <AttackConstructionWizard
        suggestion={selectedAttack}
        claimId={attackTargetId}
        deliberationId={deliberationId}
        onComplete={(attackId) => {
          setAttackRefreshKey((prev) => prev + 1);
          setWizardOpen(false);
          setAttackTargetId(null);
          setSelectedAttack(null);
        }}
        onCancel={() => {
          setWizardOpen(false);
          setSelectedAttack(null);
        }}
      />
    )}
  </DialogContent>
</Dialog>
```

**Workflow**:
1. User fills in attack premises
2. Adds supporting evidence
3. Reviews attack quality score
4. Submits attack
5. Arguments list refreshes automatically

---

## User Workflow

### Step-by-Step Flow

1. **Navigate to Arguments Tab**
   - DeepDivePanelV2 → Arguments Tab → All Arguments list

2. **Click "Generate Attack"**
   - Button appears on every argument card (rose/red color)
   - Opens Attack Suggestions dialog

3. **Review Attack Strategies**
   - See ranked list of attack types (REBUTS, UNDERCUTS, UNDERMINES)
   - Each strategy shows:
     - Attack type badge
     - Strategic value score
     - Burden of proof indicator
     - Expected difficulty
     - Based on Critical Questions

4. **Select Strategy**
   - Click on preferred attack strategy
   - Opens Attack Construction Wizard

5. **Build Attack (Multi-Step Wizard)**
   - **Overview**: See attack strategy details
   - **Premises**: Fill in attack premises
   - **Evidence**: Add supporting evidence links
   - **Review**: Check quality score, preview argument

6. **Submit Attack**
   - Minimum 40% quality score required
   - Attack created in database
   - Arguments list refreshes
   - New attack appears in list

---

## Testing

### Lint Checks
```bash
npm run lint -- --file components/deepdive/v3/tabs/ArgumentsTab.tsx
```
✅ Result: No ESLint warnings or errors

```bash
npm run lint -- --file components/arguments/AIFArgumentsListPro.tsx
```
✅ Result: 1 pre-existing warning (unrelated to our changes)

### Manual Testing Checklist

- [ ] "Generate Attack" button appears on all argument cards
- [ ] Button opens Attack Suggestions dialog
- [ ] Suggestions ranked by strategic value
- [ ] Burden of proof shown for each strategy
- [ ] Selecting strategy opens wizard
- [ ] Wizard has 4 steps: Overview, Premises, Evidence, Review
- [ ] Quality score updates in real-time
- [ ] Minimum 40% quality enforced
- [ ] Attack submission works
- [ ] Arguments list refreshes after creation
- [ ] No console errors

---

## Component Hierarchy

```
DeepDivePanelV2.tsx
  └─> ArgumentsTab (v3)
       └─> AIFArgumentsListPro
            └─> "Generate Attack" button
                 ├─> AttackSuggestions dialog
                 │    └─> Strategy selection
                 │
                 └─> AttackConstructionWizard dialog
                      └─> Multi-step attack builder
```

---

## API Endpoints Used

1. **POST `/api/arguments/suggest-attacks`**
   - Input: `{ targetClaimId, targetArgumentId }`
   - Output: `{ suggestions: AttackSuggestion[] }`
   - Generates ranked attack strategies based on CQs

2. **POST `/api/arguments/construct`** (via wizard)
   - Input: Attack template, filled premises, evidence
   - Output: `{ argumentId: string }`
   - Creates attack argument in database

---

## Related Components

### Already Existing (Phase 0-4)
- ✅ `AttackSuggestions.tsx` (562 LOC) - Strategy selection UI
- ✅ `AttackConstructionWizard.tsx` (1018 LOC) - Multi-step attack builder
- ✅ `/api/arguments/suggest-attacks` - Attack strategy generation API

### Test Pages Available
- `/app/(app)/examples/attack-submission/page.tsx` - Attack wizard demo
- `/app/(app)/examples/evidence-guidance/page.tsx` - Evidence integration demo

---

## Time Savings

**Estimated**: 6 hours  
**Actual**: 30 minutes  
**Savings**: 5.5 hours (91% reduction!)

**Why So Fast?**
- AttackSuggestions and AttackConstructionWizard components already built in Phase 0-4
- Just needed to wire callbacks and add dialogs
- No new API endpoints required
- Followed existing pattern from ArgumentNetAnalyzer integration

---

## Next Steps

### Immediate (Browser Testing)
1. Navigate to ludics-forest-demo deliberation
2. Click Arguments tab
3. Click "Generate Attack" on any argument
4. Verify suggestions dialog opens
5. Select a strategy
6. Complete wizard steps
7. Verify attack created successfully

### Task 6.2 Preview: ArgumentActionsSheet Enhancement (3h)
- Add "Strategic Attack" option to existing actions sheet
- Show attack quality estimate
- Link to attack wizard
- Preserve existing attack/defense actions

### Task 6.3 Preview: Visual Indicators (1h)
- Badge showing number of available attack strategies
- Color-coded by difficulty
- Tooltip preview of best strategy

---

## Success Criteria

- [x] "Generate Attack" button on all arguments
- [x] Button opens Attack Suggestions dialog
- [x] Suggestions component integrated
- [x] Wizard component integrated
- [x] Callbacks wired correctly
- [x] State management implemented
- [x] Dialogs styled consistently
- [x] Lint checks passed
- [ ] Manual testing in browser (pending)
- [ ] Attack creation workflow end-to-end (pending)

---

## Sign-Off

**Status**: ✅ Complete (pending browser test)  
**Quality**: Lint passed, components integrated  
**Ready**: Yes - test in browser to verify workflow

**Prepared by**: GitHub Copilot  
**Date**: November 12, 2025

---

## Appendix: Design Decisions

### Why Rose/Red Color for Attack Button?
- Contrasts with indigo "Analyze Net" button
- Signals offensive/aggressive action
- Consistent with attack metaphor (⚔️ Swords icon)
- Aligns with red badge colors used for challenger burden

### Why Two Separate Dialogs?
- **Suggestions Dialog**: Quick strategy selection
- **Wizard Dialog**: Detailed attack construction
- Allows users to back out after seeing strategies
- Cleaner UX than combining into one large dialog

### Why `attackRefreshKey` Instead of SWR mutate?
- Simple counter trigger for refresh
- Avoids direct dependency on SWR internals
- Can be enhanced later with optimistic updates

---

## Related Documentation

- `WEEK5_COMPLETION_SUMMARY.md` - Week 5 completion (ArgumentNetAnalyzer)
- `DELIBERATION_PANEL_AUDIT_AND_REDESIGN.md` - Overall V3 migration roadmap
- `DEEPDIVEPANEL_V3_OVERHAUL_INTEGRATION_PLAN.md` - Weeks 5-8 detailed plan
