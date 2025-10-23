# Quick Visual Guide: Scope Nesting & CQ Integration

**Last Updated**: October 22, 2025

---

## 1. Scope Nesting Visual Indicators

### SuppositionBanner Component

**When it appears**:
- Inside SUPPOSE scope (SUPPOSE posted, not yet DISCHARGED)
- Shows in DialogueInspector's Overview and Moves tabs

**What it looks like**:
```
┌────────────────────────────────────────────────────────┐
│ 📍  Inside Supposition                                 │
│     Suppose gas prices triple in the next five years   │
│     Locus: 0                                          │
└────────────────────────────────────────────────────────┘
  ↑ Purple-50 background, purple-500 left border
```

**Key visual elements**:
- 📍 Emoji indicator
- Purple color scheme (matches SUPPOSE/DISCHARGE)
- Shows full supposition text
- Optional locus path for debugging

---

### Nested Move Hierarchy

**Moves Tab with active SUPPOSE**:
```
All Moves (6)                                      [🔄 Refresh]

Move #1: ASSERT        [●]  abc12345    3:42 PM
Move #2: WHY           [⚔️]  def67890    3:43 PM

┌────────────────────────────────────────────────────────┐
│ 📍 SUPPOSE: Gas prices triple in the next five years   │
│ Opened: 10/22/2025, 3:45 PM                           │
└────────────────────────────────────────────────────────┘
  │
  ├──┬─────────────────────────────────────────────────
  │  │  Move #3: THEREFORE   [●]  ghi11223    3:46 PM
  │  │  Move #4: GROUNDS     [●]  jkl44556    3:47 PM
  │  │  Move #5: CLOSE       [●]  mno77889    3:48 PM
  └──┴─────────────────────────────────────────────────
      ↑ Indented with purple left border (nested moves)
```

**Visual indicators**:
| Element | Appearance | Meaning |
|---------|------------|---------|
| Purple banner | `bg-purple-100, border-l-4 purple-500` | SUPPOSE marker |
| Nested moves | Indented `ml-6`, `border-l-2 purple-300` | Inside scope |
| SUPPOSE/DISCHARGE cards | `bg-purple-50`, badge `bg-purple-200` | Structural moves |
| Regular nested moves | `bg-slate-50` | Normal moves in scope |

---

## 2. ArgumentCard CQ Integration

### CQ Badge Display

**Argument with CQs**:
```
┌─────────────────────────────────────────────────────────┐
│ ✓ "Climate change is caused by human activity"         │
│   [Argument from Expert Opinion]  [CQ 75%]             │
│                              [CQs]  [Expand ▶]         │
└─────────────────────────────────────────────────────────┘
  │                               │       │
  │                               │       └─ Expand/collapse button
  │                               └─ CQs button (opens dialog)
  └─ Scheme badge                  CQ percentage badge
```

**Badge breakdown**:
| Badge | Background | Text Color | Shows When |
|-------|------------|------------|------------|
| Scheme | `indigo-50` | `indigo-700` | Argument has scheme |
| CQ % | `amber-50` | `amber-700` | CQs exist (required > 0) |

**Percentage calculation**:
```
CQ 75%  =  3 satisfied / 4 total
CQ 100% =  All CQs satisfied (green theme possible)
CQ 0%   =  No CQs satisfied yet
```

---

### CQ Dialog

**Clicking [CQs] button opens**:
```
┌──────────────── Critical Questions ────────────────┐
│                                              [✕]   │
│                                                    │
│  E1: Is the expert credible?                      │
│      [✓ Satisfied]  [Grounds: "Dr. Smith..."]     │
│                                                    │
│  E2: Is the expertise relevant to this claim?     │
│      [✓ Satisfied]  [Grounds: "20 years..."]      │
│                                                    │
│  E3: Does expert consensus support this?          │
│      [✓ Satisfied]  [No grounds yet]              │
│                                                    │
│  E4: Is the expert biased?                        │
│      [ Not Satisfied]  [Ask WHY]                  │
│                                                    │
│  ────────────────────────────────────────────────  │
│  3 of 4 satisfied (75%)                           │
└────────────────────────────────────────────────────┘
```

**Features**:
- ✅ Shows all CQs for argument's conclusion claim
- ✅ Displays satisfaction status per CQ
- ✅ Shows grounds text if available
- ✅ "Ask WHY" button creates dialogue move
- ✅ Percentage summary at bottom

---

## 3. Where These Features Appear

### DialogueInspector

**Location**: `components/dialogue/DialogueInspector.tsx`

**When to use**: Debugging dialogue state, visualizing move history

**Tabs that show scope nesting**:
- ✅ **Overview tab**: Banner at top (if in scope)
- ✅ **Moves tab**: Banner + indented hierarchy
- ❌ Legal Actions tab: No banner (not relevant)
- ❌ CQs tab: No banner (shows CQ list)
- ❌ Raw Data tab: No banner (shows JSON)

**How to open DialogueInspector**:
```tsx
import { DialogueInspector } from "@/components/dialogue/DialogueInspector";

<DialogueInspector
  deliberationId="delib_123"
  targetType="claim"
  targetId="claim_456"
  locusPath="0"
/>
```

---

### AIFArgumentsListPro

**Location**: `components/arguments/AIFArgumentsListPro.tsx`

**When to use**: Browsing all arguments in a deliberation

**Renders ArgumentCard for each argument** → ArgumentCard shows CQ badge/button automatically

**How arguments appear in list**:
```
┌─ AIFArgumentsListPro ─────────────────────────────────┐
│                                                        │
│  ┌─ ArgumentCard #1 ──────────────────────────┐      │
│  │ ✓ Conclusion text                          │      │
│  │ [Scheme] [CQ 75%]        [CQs] [Expand ▶] │      │
│  └────────────────────────────────────────────┘      │
│                                                        │
│  ┌─ ArgumentCard #2 ──────────────────────────┐      │
│  │ ✓ Another conclusion                       │      │
│  │ [No scheme]              [Expand ▶]        │      │
│  └────────────────────────────────────────────┘      │
│                                       ↑ No CQ badge   │
│                                         (no scheme)   │
└────────────────────────────────────────────────────────┘
```

---

## 4. User Workflows

### Workflow A: Exploring a Supposition Scope

1. User creates SUPPOSE move via CommandCard
2. DialogueInspector shows purple banner:
   ```
   📍 Inside Supposition
      Suppose gas prices triple...
   ```
3. User posts moves (THEREFORE, GROUNDS, etc.)
4. Moves tab shows indented hierarchy
5. User posts DISCHARGE
6. Banner disappears (scope closed)

**Visual progression**:
```
Before SUPPOSE:
  Overview: No banner
  Moves: All at root level

After SUPPOSE:
  Overview: 📍 Banner appears
  Moves: New moves indented

After DISCHARGE:
  Overview: Banner gone
  Moves: Scope marked closed
```

---

### Workflow B: Reviewing Argument CQs

1. User browses arguments in AIFArgumentsListPro
2. Sees argument with `[CQ 75%]` badge
3. Clicks `[CQs]` button
4. Dialog opens showing 4 CQs (3 satisfied, 1 unsatisfied)
5. User reads unsatisfied CQ: "E4: Is the expert biased?"
6. User clicks "Ask WHY" to challenge
7. WHY dialogue move created with cqId="E4"
8. Author can respond with GROUNDS

**Visual states**:

| CQ Status | Badge Color | Button Available |
|-----------|-------------|------------------|
| All satisfied | `CQ 100%` green? | "View CQs" |
| Some satisfied | `CQ 75%` amber | "View CQs" |
| None satisfied | `CQ 0%` amber | "View CQs" |
| No CQs | (no badge) | (no button) |

---

## 5. Color Schemes

### Supposition/Scope Nesting

| Element | Tailwind Class | Hex Color | Purpose |
|---------|----------------|-----------|---------|
| Banner background | `bg-purple-50` | #faf5ff | Subtle indicator |
| Banner border | `border-purple-500` | #a855f7 | Strong accent |
| Banner text | `text-purple-900` | #581c87 | High contrast |
| Nested border | `border-purple-300` | #d8b4fe | Soft guide line |
| SUPPOSE marker bg | `bg-purple-100` | #f3e8ff | Highlight structural |
| SUPPOSE card bg | `bg-purple-50` | #faf5ff | Differentiate type |
| SUPPOSE badge | `bg-purple-200` | #e9d5ff | Extra emphasis |

**Why purple?**
- Distinct from other move types (blue=neutral, red=attack, green=surrender)
- Associated with "hypothetical" and "meta-reasoning"
- Matches existing SUPPOSE/DISCHARGE theming

---

### CQ Integration

| Element | Tailwind Class | Hex Color | Purpose |
|---------|----------------|-----------|---------|
| Scheme badge bg | `bg-indigo-50` | #eef2ff | Scheme indicator |
| Scheme badge text | `text-indigo-700` | #4338ca | High contrast |
| CQ badge bg | `bg-amber-50` | #fffbeb | Warning/attention |
| CQ badge text | `text-amber-700` | #b45309 | Warm emphasis |
| CQs button border | `border-indigo-300` | #a5b4fc | Actionable |
| CQs button text | `text-indigo-700` | #4338ca | Matches scheme |
| CQs button hover | `bg-indigo-50` | #eef2ff | Feedback |

**Why amber for CQ badge?**
- Signals "needs attention" (like warnings)
- Distinct from green (satisfied) and red (errors)
- Works well with indigo scheme badge

---

## 6. Responsive Behavior

### SuppositionBanner

**Desktop** (> 768px):
```
┌────────────────────────────────────────────────────────┐
│ 📍  Inside Supposition                                 │
│     Full supposition text displays inline              │
│     Locus: 0.supp1                                    │
└────────────────────────────────────────────────────────┘
```

**Mobile** (< 768px):
```
┌──────────────────────┐
│ 📍  Inside Supp...   │
│     Text wraps to    │
│     multiple lines   │
│     Locus: 0.supp1  │
└──────────────────────┘
```

**Styling**:
- Uses `flex` with `min-w-0` to prevent overflow
- Text has `leading-relaxed` for readability
- Emoji size consistent across breakpoints

---

### ArgumentCard CQ Controls

**Desktop**:
```
┌─────────────────────────────────────────────────────┐
│ ✓ Conclusion text here                              │
│   [Scheme Badge]  [CQ 75%]     [CQs]  [Expand ▶]   │
└─────────────────────────────────────────────────────┘
```

**Tablet** (768px - 1024px):
```
┌────────────────────────────────┐
│ ✓ Conclusion text              │
│   [Scheme] [CQ 75%]            │
│        [CQs]  [Expand ▶]       │
└────────────────────────────────┘
```

**Mobile** (< 768px):
```
┌──────────────────────┐
│ ✓ Conclusion...      │
│   [Scheme] [CQ 75%] │
│                      │
│   [CQs] [Expand ▶]  │
└──────────────────────┘
```

**Tailwind classes used**:
- `flex-wrap` on badge container
- `shrink-0` on buttons (prevent squishing)
- `min-w-0` on conclusion text (allow truncation)
- `gap-2` spacing (consistent across sizes)

---

## 7. Keyboard Navigation

### SuppositionBanner

**Not interactive** - Purely informational
- No focus states
- Screen reader announces as `role="status"`
- Emoji has `aria-hidden="true"` (skipped)

---

### ArgumentCard CQ Button

**Keyboard accessible**:
- `Tab` to focus CQs button
- `Enter` or `Space` to activate
- Opens dialog (focus moves to dialog)
- `Esc` to close dialog (focus returns to button)

**ARIA attributes**:
```tsx
<button
  aria-label="View critical questions"
  onClick={() => setCqDialogOpen(true)}
>
  CQs
</button>
```

**Screen reader announces**: "View critical questions, button"

---

### Dialog Keyboard Shortcuts

When CQ dialog is open:
- `Tab` / `Shift+Tab` - Navigate between CQs
- `Enter` - Activate "Ask WHY" button
- `Esc` - Close dialog
- Focus trap enabled (can't tab outside dialog)

---

## 8. Testing Quick Reference

### Visual Regression Tests

**Scope Nesting**:
```bash
# Test 1: Banner appearance
1. Create SUPPOSE
2. Screenshot DialogueInspector Overview tab
3. Verify purple banner visible

# Test 2: Nested hierarchy
1. Create SUPPOSE
2. Add 3 moves
3. Screenshot Moves tab
4. Verify indentation and borders

# Test 3: Banner removal
1. SUPPOSE exists
2. Post DISCHARGE
3. Refresh
4. Verify banner gone
```

**CQ Integration**:
```bash
# Test 4: CQ badge
1. View argument with scheme
2. Screenshot ArgumentCard
3. Verify "CQ X%" badge present

# Test 5: CQ dialog
1. Click CQs button
2. Screenshot dialog
3. Verify CriticalQuestionsV2 renders

# Test 6: No CQs
1. View argument without scheme
2. Screenshot ArgumentCard
3. Verify no CQ badge/button
```

---

### Unit Test Coverage

**SuppositionBanner.tsx**:
```typescript
describe("SuppositionBanner", () => {
  it("renders supposition text", () => {
    render(<SuppositionBanner suppositionText="Test" />);
    expect(screen.getByText("Test")).toBeInTheDocument();
  });

  it("shows locus path when provided", () => {
    render(<SuppositionBanner suppositionText="Test" locusPath="0.supp1" />);
    expect(screen.getByText(/Locus: 0\.supp1/)).toBeInTheDocument();
  });

  it("has correct ARIA attributes", () => {
    const { container } = render(<SuppositionBanner suppositionText="Test" />);
    expect(container.firstChild).toHaveAttribute("role", "status");
  });
});
```

**DialogueInspector.tsx** (supposition detection):
```typescript
describe("activeSupposition", () => {
  it("returns null when no SUPPOSE exists", () => {
    const moves = [{ kind: "ASSERT", ...}];
    // Test logic
  });

  it("returns supposition when SUPPOSE not discharged", () => {
    const moves = [{ kind: "SUPPOSE", createdAt: "...", ...}];
    // Test logic
  });

  it("returns null when SUPPOSE discharged", () => {
    const moves = [
      { kind: "SUPPOSE", createdAt: "2025-10-22T15:00:00Z", ...},
      { kind: "DISCHARGE", createdAt: "2025-10-22T15:05:00Z", ...}
    ];
    // Test logic
  });
});
```

**ArgumentCard.tsx** (CQ status):
```typescript
describe("CQ status computation", () => {
  it("returns null when no CQ data", () => {
    const { result } = renderHook(() => useMemo(() => {
      const cqData = null;
      // ... computation logic
    }, [cqData]));
    expect(result.current).toBeNull();
  });

  it("calculates percentage correctly", () => {
    const cqData = {
      cqs: [
        { satisfied: true },
        { satisfied: true },
        { satisfied: false },
        { satisfied: false },
      ]
    };
    // Expected: 50%
  });
});
```

---

## 9. Troubleshooting

### Banner Not Appearing

**Possible causes**:
1. ❌ No SUPPOSE move created yet
2. ❌ SUPPOSE already DISCHARGED
3. ❌ SUPPOSE at different locus
4. ❌ DialogueInspector not re-fetching moves

**Debug steps**:
```typescript
// Add console.log to activeSupposition computation
console.log("Supposes found:", supposes);
console.log("Most recent:", mostRecentSuppose);
console.log("Discharges:", discharges);
console.log("Active supposition:", activeSupposition);
```

---

### CQ Badge Not Showing

**Possible causes**:
1. ❌ Argument has no scheme
2. ❌ Scheme has no CQs defined
3. ❌ CQ API not returning data
4. ❌ `conclusion.id` is null/undefined

**Debug steps**:
```typescript
// In ArgumentCard component
console.log("Conclusion ID:", conclusion?.id);
console.log("CQ data:", cqData);
console.log("CQ status:", cqStatus);
```

**Check API response**:
```bash
curl http://localhost:3000/api/cqs?targetType=claim&targetId=claim_123
# Should return: { cqs: [...] } or { items: [...] }
```

---

### Nested Moves Not Indenting

**Possible causes**:
1. ❌ `isNested` prop not passed to MoveCard
2. ❌ Tailwind `ml-6` class not applied
3. ❌ CSS conflicting with margin-left

**Debug steps**:
```tsx
// In Moves tab render logic
{targetMoves
  .filter((m: any) => new Date(m.createdAt) >= new Date(activeSupposition.createdAt))
  .map((move: any, idx: number) => {
    console.log("Rendering nested move:", move.id, "isNested=true");
    return <MoveCard key={move.id} move={move} index={idx} isNested />;
  })}
```

**Inspect element** in browser:
- Check if `<NestedMoveContainer>` has `ml-6` class
- Check if `border-l-2 border-purple-300` applied
- Look for conflicting CSS rules

---

## 10. Performance Notes

### SuppositionBanner

- **Renders**: Only when `activeSupposition` is non-null
- **Re-renders**: When `activeSupposition` changes (moves refetch)
- **Memoization**: Uses `React.useMemo` for supposition detection
- **Cost**: O(n) to filter moves, but cached

**Optimization**: Move detection runs once per DialogueInspector mount/update, not per move card

---

### ArgumentCard CQ Fetching

- **Conditional fetch**: Only if `conclusion.id` exists
- **SWR caching**: Deduplicates across multiple ArgumentCards
- **Revalidation**: Automatic on focus/reconnect
- **Cost**: Network request cached for 30s (SWR default)

**Optimization**: If 10 arguments have same conclusion claim, only 1 API call made

---

## 11. Related Documentation

- **Full Implementation**: `SCOPE_NESTING_AND_CQ_INTEGRATION_COMPLETE.md`
- **UX Improvements**: `DIALOGUE_UX_IMPROVEMENTS_COMPLETE.md`
- **AIF Integration**: `AIF_DIALOGUE_INTEGRATION_COMPLETE.md`
- **SUPPOSE/DISCHARGE**: `SUPPOSE_DISCHARGE_SCOPE_TRACKING.md`
- **CQ System**: `CLAIM_LEVEL_CQ_SYSTEM.md`

---

**Last Updated**: October 22, 2025  
**Version**: 1.0  
**Quick Guide for**: Developers, Designers, QA Testers
