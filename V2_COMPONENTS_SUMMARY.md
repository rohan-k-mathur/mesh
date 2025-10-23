# V2 Component Improvements Summary

This document summarizes the newly created V2/V3 components with enhanced UI/UX.

## AttackMenuProV2

**File**: `components/arguments/AttackMenuProV2.tsx`
**Lines**: 840+
**Status**: ✅ Complete, lint-free

### Key Improvements

#### Visual Enhancements
- **Modern Card-Based Design**: Each attack type (Rebut, Undercut, Undermine) is presented in a beautiful gradient card with colored borders
  - Rebut: Rose gradient (from-rose-50 to-rose-100) with rose-200 border
  - Undercut: Amber gradient (from-amber-50 to-amber-100) with amber-200 border
  - Undermine: Slate gradient (from-slate-50 to-slate-100) with slate-300 border

- **Collapsible Cards**: Each attack card can expand/collapse individually, reducing visual clutter
  - Smooth animations with `animate-in slide-in-from-top-2 duration-300`
  - ChevronDown icon with rotation transition
  - Only one card needs to be open at a time

- **Enhanced Icons**: Every section has meaningful icons
  - ShieldX for Rebut (direct contradiction)
  - ShieldAlert for Undercut (reasoning exception)
  - Shield for Undermine (premise attack)
  - Target icons for showing attack targets
  - Sparkles for selected claims
  - Zap for action buttons

#### UX Improvements
- **Target Summary Card**: Top of modal shows the argument being challenged with:
  - Indigo gradient background
  - Premise count display
  - Truncated ID for reference
  - Clear "Target Argument" label

- **Tab System**: Attack types and Critical Questions in separate tabs
  - "Formal Attacks" tab with Swords icon
  - "Critical Questions" tab with HelpCircle icon
  - Clean slate-200 background with white active state

- **Loading States**: 
  - Skeleton loading for attack cards before mounted
  - Spinning indicator on submit buttons
  - "Posting rebuttal..." / "Posting undercut..." / "Posting undermine..." feedback

- **Success Indicators**:
  - CheckCircle2 icon appears next to attack name when ready
  - Character counter for undercut textarea
  - "Ready to post" badge when valid

- **Better Button States**:
  - Gradient backgrounds on all action buttons
  - Active state with scale-95 transform
  - Clear disabled states with opacity-50
  - Shadow-md hover states

#### Functional Improvements
- **Lazy Mounting**: Content only mounts when dialog opens (performance)
- **Auto-focus**: Dialog title gets focus on open (accessibility)
- **CQ Integration**: Automatically detects and attaches CQ metadata to attacks
- **Real-time Validation**: Buttons disabled until all required fields filled
- **Smart CQ Detection**:
  - For Rebut: Finds unsatisfied CQs on target conclusion
  - For Undercut: Looks for inference/reasoning/warrant CQs
  - For Undermine: Finds unsatisfied CQs on target premise
  - Attaches CQ context metadata to ConflictingArgument

### Component Structure
```
AttackMenuProV2 (wrapper)
  ├── Dialog with gradient background
  ├── Target summary card
  ├── Tabs (Attacks | CQs)
  │   ├── Attacks Tab
  │   │   ├── Rebut Card (collapsible)
  │   │   │   ├── Target display
  │   │   │   ├── Claim picker
  │   │   │   └── Submit button
  │   │   ├── Undercut Card (collapsible)
  │   │   │   ├── Info banner
  │   │   │   ├── Exception textarea
  │   │   │   └── Submit button
  │   │   └── Undermine Card (collapsible)
  │   │       ├── Premise selector
  │   │       ├── Target display
  │   │       ├── Claim picker
  │   │       └── Submit button
  │   └── CQs Tab
  │       ├── Guide card (indigo)
  │       └── CriticalQuestionsV2 embedded
  └── SchemeComposerPicker modals (2)
```

### API Integration
- All attacks post to `/api/ca` with proper metadata
- UNDERCUT also posts assumption via `/api/arguments/:id/assumptions`
- Triggers `claims:changed` and `arguments:changed` events
- Proper error handling with user-friendly alerts

---

## CriticalQuestionsV3

**File**: `components/claims/CriticalQuestionsV3.tsx`
**Lines**: 710+
**Status**: ✅ Complete, lint-free

### Key Improvements

#### Visual Enhancements
- **Card-Based Layout**: Each CQ is a beautiful rounded card instead of flat checkbox list
  - Satisfied CQs: Emerald gradient (from-emerald-50 to-emerald-100) with emerald-200 border
  - Unsatisfied CQs: White background with slate-200 border, hover effects

- **Rich Status Indicators**:
  - CheckCircle2 in emerald background for satisfied
  - Circle outline in slate for unsatisfied
  - Smooth transitions on state changes

- **Scheme Organization**:
  - Each scheme has header with Target icon and indigo theme
  - Progress indicator: "2 / 5 satisfied"
  - Clear separation with border-b-2

- **Collapsible Details**: Each CQ expands to show:
  - Quick satisfaction toggle
  - Grounds input with character counter
  - Attach counter-claim section
  - Legal moves panel (optional)
  - All with smooth slide-in animations

#### UX Improvements
- **Grounds Display**: When satisfied, grounds text shows in white card with Sparkles icon
- **Attachment Counter**: Shows "3 counter-claims attached" with Link2 icon
- **Action Grouping**:
  - "Mark as satisfied/unsatisfied" in slate-50 panel
  - "Provide Grounds" section with MessageCircle icon
  - "Attach Counter-Claim" section with Link2 icon
  - Optional "Show Legal Moves" collapsible

- **Smart Dialogs**:
  - Quick Compose: Create new claim and auto-attach
  - Scheme Picker: Search existing claims to attach
  - Clear "Create New" vs "Find Existing" buttons

- **Empty States**:
  - "No Critical Questions" state with HelpCircle icon
  - Error state with AlertCircle in red theme
  - Loading skeletons with pulse animation

#### Functional Improvements
- **Optimistic Updates**: UI updates immediately, rolls back on error
- **Event-Driven Sync**: Uses useBusEffect for multi-tab sync
  - Listens to: cqs:changed, claims:changed, arguments:changed, dialogue:moves:refresh
  - Legacy event listeners for backwards compat
- **SWR Caching**: Efficient data fetching with automatic revalidation
- **Search Integration**: Can search and attach existing claims (when implemented)
- **Legal Moves**: Shows available dialogue moves per CQ (when deliberationId provided)

### Component Structure
```
CriticalQuestionsV3
  ├── Error State (if fetch fails)
  ├── Loading State (skeletons)
  ├── Empty State (no CQs)
  └── Schemes List
      └── For each Scheme
          ├── Scheme Header (indigo theme)
          │   ├── Target icon
          │   ├── Scheme title
          │   └── Progress indicator
          └── CQs List
              └── For each CQ
                  ├── CQ Card (emerald if satisfied, white if not)
                  │   ├── Status icon (CheckCircle2 | Circle)
                  │   ├── Question text
                  │   ├── Grounds display (if satisfied)
                  │   ├── Attachment count
                  │   └── Expand/Collapse button
                  └── Expanded Panel (if expanded)
                      ├── Toggle satisfaction
                      ├── Grounds input (if unsatisfied)
                      │   ├── Textarea
                      │   ├── Character counter
                      │   └── Submit button
                      ├── Attach section
                      │   ├── Currently attached list
                      │   ├── "Create New" button
                      │   └── "Find Existing" button
                      └── Legal Moves (collapsible)
  ├── Quick Compose Dialog
  ├── Scheme Picker Modal
  └── (NLCommitPopover integration removed - needs more context)
```

### Data Flow
```
API Endpoints:
  GET /api/cqs?targetType=X&targetId=Y
  GET /api/cqs/attachments?targetType=X&targetId=Y
  GET /api/deliberations/:id/moves
  GET /api/claims/edges?deliberationId=X
  POST /api/cqs/:targetType/:targetId (toggle satisfaction)
  POST /api/cqs/:targetType/:targetId/attach (attach claim)
  POST /api/claims (create new claim)

Events Dispatched:
  - cqs:changed
  - claims:changed

Events Listened:
  - cqs:changed
  - claims:changed
  - arguments:changed
  - dialogue:moves:refresh
  - claims:edges:changed
```

---

## Comparison with Original Components

### AttackMenuProV2 vs AttackMenuPro

| Feature | Original | V2 |
|---------|----------|-----|
| Layout | Single column, all visible | Collapsible cards, focused |
| Visual Design | Basic colors | Gradient cards, modern UI |
| CQ Panel | Expandable panel | Dedicated tab |
| Loading States | Basic busy flag | Skeletons + button spinners |
| Status Feedback | None | CheckCircle2 indicators |
| Target Display | Inline text | Dedicated summary card |
| Button Design | Standard | Gradient with shadows |
| Icons | Basic | Rich icon set (15+) |
| Animations | None | Slide-in, rotate, scale |
| Lines of Code | 764 | 840 |

### CriticalQuestionsV3 vs CriticalQuestionsV2

| Feature | Original | V3 |
|---------|----------|-----|
| Layout | Dense list | Spacious cards |
| CQ Cards | Checkbox rows | Collapsible cards |
| Satisfaction State | Checkbox | Icon + gradient bg |
| Grounds Display | Inline text | Card with icon |
| Actions | All visible inline | Collapsible sections |
| Dialogs | Multiple inline | Focused modals |
| Visual Hierarchy | Flat | Clear structure |
| Color System | Minimal | Rich gradients |
| Icons | Few | Icon per section |
| Animations | None | Smooth transitions |
| Lines of Code | 785 | 710 |

---

## Integration Guide

### Using AttackMenuProV2

```tsx
import { AttackMenuProV2 } from "@/components/arguments/AttackMenuProV2";

// In your component:
<AttackMenuProV2
  deliberationId={deliberation.id}
  authorId={currentUser.id}
  target={{
    id: argument.id,
    conclusion: { id: argument.conclusionId, text: argument.conclusionText },
    premises: argument.premises.map(p => ({ id: p.id, text: p.text }))
  }}
  onDone={() => {
    console.log("Attack posted!");
    // Refresh your data
  }}
/>
```

### Using CriticalQuestionsV3

```tsx
import CriticalQuestionsV3 from "@/components/claims/CriticalQuestionsV3";

// In your component:
<CriticalQuestionsV3
  targetType="claim"  // or "argument"
  targetId={claim.id}
  createdById={currentUser.id}
  deliberationId={deliberation.id}
  roomId={room.id}
  currentLens="default"
  currentAudienceId={audience?.id}
  prefilterKeys={["CQ_EXPERT_TRUSTWORTHY"]}  // optional
/>
```

### Migrating from V1/V2

Both new components are drop-in replacements with the same prop interfaces:
1. Update import paths
2. Verify `onDone` callback behavior (V2 may have timing differences)
3. Test CQ metadata attachment flow
4. Enjoy the new UI!

---

## Performance Considerations

### AttackMenuProV2
- ✅ Lazy mounting: Content only renders when dialog opens
- ✅ Single fetch for CQ metadata per attack type
- ✅ Abort controllers for all async operations
- ✅ Optimistic UI updates before API confirmation
- ⚠️ CQ detection makes 1-3 extra API calls per attack (cached by SWR in CQ tab)

### CriticalQuestionsV3
- ✅ SWR caching with focus/mount revalidation disabled
- ✅ Optimistic updates for instant feedback
- ✅ Event-driven invalidation (only refetch when needed)
- ✅ Efficient filtering with useMemo
- ✅ Lazy loading for legal moves
- ⚠️ Re-renders on every grounds input change (could add debouncing)

---

## Accessibility

### AttackMenuProV2
- ✅ Dialog auto-focuses title on open
- ✅ Keyboard navigation through tabs
- ✅ Clear focus indicators
- ✅ Disabled state properly communicated
- ✅ ARIA busy states on submit buttons
- ✅ Descriptive button labels

### CriticalQuestionsV3
- ✅ Semantic HTML structure
- ✅ Clear button labels
- ✅ Status communicated visually + textually
- ✅ Keyboard navigable
- ✅ Color not sole indicator (icons + text)
- ⚠️ Could add ARIA labels to expand/collapse buttons

---

## Next Steps

1. **Test in Real Deliberations**
   - Post all three attack types
   - Verify CQ metadata attachment
   - Test satisfaction flows
   - Check event propagation

2. **Performance Monitoring**
   - Watch for excessive re-renders
   - Monitor API call frequency
   - Test with large CQ lists (10+)

3. **User Feedback**
   - Gather feedback on collapsible vs always-visible
   - Test mobile responsiveness
   - Evaluate animation speeds

4. **Future Enhancements**
   - Add undo/redo for CQ satisfaction
   - Implement CQ templates system
   - Add bulk satisfaction operations
   - Create keyboard shortcuts
   - Add rich text for grounds input

---

## Files Changed

- ✅ Created: `components/arguments/AttackMenuProV2.tsx` (840 lines)
- ✅ Created: `components/claims/CriticalQuestionsV3.tsx` (710 lines)
- ⚠️ Not modified: Original `AttackMenuPro.tsx` (preserved for backwards compat)
- ⚠️ Not modified: Original `CriticalQuestionsV2.tsx` (preserved for backwards compat)

**Total New Code**: ~1,550 lines
**Lint Status**: ✅ All clear
**Type Safety**: ✅ Full TypeScript, strict mode
**Dependencies**: No new dependencies added
