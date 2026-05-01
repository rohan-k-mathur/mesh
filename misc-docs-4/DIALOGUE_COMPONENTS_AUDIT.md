# Dialogue Components Audit Report
**Date:** October 25, 2025  
**Scope:** DialogueActionsModal, DialogueActionsButton, LegalMoveToolbar, LegalMoveChips + APIs/Helpers

---

## Executive Summary

### ✅ **STRENGTHS**
- **DialogueActionsModal** and **DialogueActionsButton** are well-architected, modern, and follow best practices
- **API endpoint** (`/api/dialogue/legal-moves`) has robust logic with testing mode, verdicts, and role guards
- Good separation of concerns between presentation (components) and business logic (API/helpers)
- Comprehensive move types supported (protocol, structural, CQs)
- SWR caching and proper loading states throughout

### ⚠️ **ISSUES FOUND**
1. **Component Duplication** - LegalMoveToolbar and LegalMoveChips have significant overlap
2. **Inconsistent Patterns** - Different components handle same moves differently
3. **Legacy Code** - Some deprecated patterns still in use
4. **Missing TypeScript Alignment** - Type definitions not fully aligned across components
5. **Server Helper Underutilized** - `legalMovesServer.ts` exists but API doesn't use it
6. **UX Inconsistencies** - Different UI patterns for the same actions

---

## Component-by-Component Analysis

### 1. **DialogueActionsModal.tsx** ✅ EXCELLENT

**Purpose:** Comprehensive modal for all dialogue actions with tabs

**Strengths:**
- ✅ Clean tab-based organization (Protocol, Structural, CQs)
- ✅ Proper loading/error states
- ✅ Good accessibility (aria labels, disabled states)
- ✅ Integrates NLCommitPopover for GROUNDS
- ✅ Integrates StructuralMoveModal for THEREFORE/SUPPOSE/DISCHARGE
- ✅ Event dispatching for real-time updates
- ✅ Move configuration centralized in `MOVE_CONFIG`
- ✅ Proper SWR usage with deduplication

**Issues:**
- ⚠️ Hardcoded move fetch logic - could use `legalMovesServer` helper
- ⚠️ Type cast `targetType as "argument" | "claim" | "card"` needed (Prisma enum issue)
- ⚠️ CQ actions filtering could be more robust
- ⚠️ No pagination for many CQs (minor)

**Recommendations:**
1. Extract move fetching to shared helper
2. Add error boundary for modal crashes
3. Consider caching move config

---

### 2. **DialogueActionsButton.tsx** ✅ VERY GOOD

**Purpose:** Trigger button that opens DialogueActionsModal

**Strengths:**
- ✅ Simple, focused component
- ✅ Three variants (default, compact, icon)
- ✅ Proper prop forwarding to modal
- ✅ Good documentation in JSDoc

**Issues:**
- ⚠️ Comment says "Keep modal open" but behavior contradicts (modal closes on some moves)
- ⚠️ No loading state on button itself
- ⚠️ Could benefit from keyboard shortcut support

**Recommendations:**
1. Add loading indicator when modal is processing
2. Clarify auto-close behavior in docs
3. Consider adding keyboard shortcuts (e.g., Cmd+K)

---

### 3. **LegalMoveToolbar.tsx** ⚠️ NEEDS MODERNIZATION

**Purpose:** Inline toolbar with challenge/resolve/more segmented control

**Strengths:**
- ✅ Segmented control is intuitive
- ✅ Shows WHY availability status
- ✅ Integrates CommandCard grid view
- ✅ Has toggle between grid and list views

**Issues:**
- ⚠️ **MAJOR:** Duplicates logic from LegalMoveChips and DialogueActionsModal
- ⚠️ Inline WHY prompt is clunky (should use modal)
- ⚠️ Type definition for `Move` differs from API
- ⚠️ `movesToActions` helper usage not clear
- ⚠️ Mixes state management patterns (inline WHY state vs. modals)
- ⚠️ "Grid View" vs "List View" terminology confusing (should be "Card View")
- ⚠️ No TypeScript strict mode compliance
- ⚠️ Custom `Pill` component could be shared

**Recommendations:**
1. **Consider deprecating** in favor of DialogueActionsButton
2. If keeping: extract shared logic to hooks
3. Replace inline prompt with StructuralMoveModal
4. Align types with API
5. Clarify CommandCard integration vs native rendering

---

### 4. **LegalMoveChips.tsx** ⚠️ NEEDS CLEANUP

**Purpose:** Inline chip buttons for legal moves

**Strengths:**
- ✅ Compact, space-efficient
- ✅ Good priority sorting (CLOSE first, then GROUNDS, WHY, etc.)
- ✅ Integrates NLCommitPopover properly
- ✅ Integrates StructuralMoveModal
- ✅ Custom toast system (`useMicroToast`)
- ✅ CQ status badge when `showCQButton` enabled

**Issues:**
- ⚠️ **MAJOR:** Significant overlap with LegalMoveToolbar
- ⚠️ `useMicroToast` should be extracted to shared hook
- ⚠️ Type for `Move` imported from API route (coupling)
- ⚠️ Generic WHY still uses `window.prompt()` (deprecated pattern)
- ⚠️ `useBusEffect` not imported from standard location
- ⚠️ Verdict context extraction `(m as any).verdict?.context` is fragile
- ⚠️ CQ stats calculation duplicated (should be in hook)
- ⚠️ Some commented-out code and legacy patterns

**Recommendations:**
1. Extract `useMicroToast` to `/hooks/useMicroToast.ts`
2. Remove `window.prompt()` for WHY - always use modal
3. Align types with shared definitions
4. Extract CQ stats to `useCQStats` hook
5. Remove commented code
6. Consider merging with LegalMoveToolbar or deprecating one

---

### 5. **API: `/api/dialogue/legal-moves/route.ts`** ✅ ROBUST

**Purpose:** Compute legal moves for a target

**Strengths:**
- ✅ Comprehensive business logic
- ✅ Testing mode for development (`DIALOGUE_TESTING_MODE`)
- ✅ Verdict codes for debugging (`R4_ROLE_GUARD`, `H1_GENERIC_CHALLENGE`, etc.)
- ✅ Parallel queries for performance
- ✅ Proper role-based guards
- ✅ CQ text fetching for enhanced labels
- ✅ Structural move support (THEREFORE, SUPPOSE, DISCHARGE)
- ✅ Closability computation via `stepInteraction`
- ✅ Post-target hints (R7 for accepting arguments)

**Issues:**
- ⚠️ Doesn't use `legalMovesServer.ts` helper (duplication)
- ⚠️ `MoveWithVerdict` type not exported
- ⚠️ Some complex logic inline (could be extracted)
- ⚠️ Generic WHY comment contradicts implementation
- ⚠️ DISCHARGE logic could be simplified

**Recommendations:**
1. **CRITICAL:** Consolidate with `legalMovesServer.ts` to avoid drift
2. Export `MoveWithVerdict` type
3. Extract closability logic to separate function
4. Remove contradictory comments about generic WHY
5. Add JSDoc for verdict codes

---

### 6. **Helper: `lib/dialogue/legalMovesServer.ts`** ⚠️ UNDERUTILIZED

**Purpose:** Server-side legal moves computation

**Strengths:**
- ✅ Reusable function signature
- ✅ Similar logic to API route

**Issues:**
- ⚠️ **CRITICAL:** NOT USED by the API route (duplication)
- ⚠️ Incomplete implementation (file cuts off at line 101)
- ⚠️ Types differ from API route
- ⚠️ No verdict codes
- ⚠️ Less comprehensive than API route

**Recommendations:**
1. **Consolidate** with API route - either:
   - a) Make API route use this helper, OR
   - b) Delete this helper and keep logic in API route
2. Add missing features (verdicts, DISCHARGE logic, etc.)
3. Align types perfectly with API

---

## Cross-Cutting Issues

### Type Misalignment

**Problem:** Different `Move` types across files:

```typescript
// API route
type Move = {
  kind: 'ASSERT'|'WHY'|'GROUNDS'|...;
  label: string;
  payload?: any;
  disabled?: boolean;
  reason?: string;
  force?: 'ATTACK'|'SURRENDER'|'NEUTRAL';
  relevance?: 'likely'|'unlikely'|null;
  postAs?: {...};
};

// LegalMoveToolbar
type Move = {
  kind: MoveKind; // different type!
  label: string;
  payload?: any;
  disabled?: boolean;
  reason?: string;
  force?: Force; // different type!
  relevance?: 'likely'|'unlikely'|null;
  postAs?: {...};
};

// legalMovesServer
export type Move = { /* similar but not identical */ };
```

**Solution:** Create shared type definition in `/types/dialogue.ts`

---

### Component Overlap Analysis

| Feature | DialogueActionsModal | LegalMoveToolbar | LegalMoveChips |
|---------|---------------------|------------------|----------------|
| WHY move | ✅ Modal-based | ⚠️ Inline prompt | ⚠️ window.prompt |
| GROUNDS move | ✅ NLCommitPopover | ✅ NLCommitPopover | ✅ NLCommitPopover |
| Structural moves | ✅ StructuralMoveModal | ✅ StructuralMoveModal | ✅ StructuralMoveModal |
| CQ support | ✅ Dedicated tab | ❌ No | ⚠️ Via badges |
| UI paradigm | Modal | Inline segmented | Inline chips |
| CommandCard | ❌ | ✅ Optional | ❌ |
| Move priority | ❌ | ❌ | ✅ Sorted |
| Disabled moves | ✅ Shown grayed | ✅ "Show restricted" | ❌ Hidden |

**Recommendation:** Pick ONE canonical pattern:
- **Option A (RECOMMENDED):** Standardize on DialogueActionsButton + DialogueActionsModal
  - Deprecate LegalMoveToolbar and LegalMoveChips
  - Add "compact inline" variant to DialogueActionsButton
- **Option B:** Keep all three but clarify use cases:
  - DialogueActions* = Full-featured deliberation UI
  - LegalMoveToolbar = Quick inline for power users
  - LegalMoveChips = Minimalist read-only contexts

---

## Schema/Data Issues

### Missing Fields in API Response

The API returns moves but clients expect additional fields:

```typescript
// Client expects (from LegalMoveChips):
interface Move {
  verdict?: { code: string; context?: any }; // ✅ API provides
  relevance?: 'likely'|'unlikely'|null;      // ✅ API provides
  // But components also access:
  (m as any).verdict?.context?.cqText        // ⚠️ Unsafe cast
}
```

**Solution:** Formalize `MoveWithVerdict` type and export from API

---

## Recommended Action Plan

### **Phase 1: Type Consolidation** (1-2 hours)
1. Create `/types/dialogue.ts` with canonical types
2. Export from API route
3. Update all components to import from shared location
4. Remove duplicate type definitions

### **Phase 2: Helper Consolidation** (2-3 hours)
1. Decide: Keep `legalMovesServer.ts` or inline in API?
   - **Recommendation:** Keep in API route (simpler, less indirection)
2. Delete `legalMovesServer.ts` if not needed
3. Extract reusable logic (closability, role guards) to separate helpers

### **Phase 3: Component Cleanup** (3-4 hours)
1. Extract `useMicroToast` to shared hook
2. Extract `useCQStats` to shared hook
3. Remove `window.prompt()` from all components
4. Align WHY handling (always use modal or NLCommitPopover)

### **Phase 4: Deprecation Decision** (2-3 hours)
1. Document use cases for each component
2. Add deprecation warnings to LegalMoveToolbar/LegalMoveChips if standardizing on DialogueActions*
3. Update all usage sites to new pattern
4. OR: Document clear separation of concerns if keeping all three

### **Phase 5: Documentation** (1-2 hours)
1. Add JSDoc to all components
2. Create usage guide for developers
3. Document verdict codes
4. Add storybook examples

---

## Testing Checklist

- [ ] WHY move posts correctly with cqId
- [ ] GROUNDS opens NLCommitPopover with correct cqKey
- [ ] THEREFORE/SUPPOSE/DISCHARGE open StructuralMoveModal
- [ ] CLOSE only available when closable (daimon hint)
- [ ] Role guards work (author vs non-author)
- [ ] Testing mode allows self-challenges
- [ ] Event dispatching triggers refreshes
- [ ] SWR caching prevents duplicate requests
- [ ] Disabled moves show proper reasons
- [ ] Post-move auto-close works correctly
- [ ] CQ text appears in GROUNDS labels
- [ ] Accept argument (R7) appears when appropriate

---

## Conclusion

The dialogue components ecosystem is **mostly solid** but suffers from:
1. **Duplication** - Three components doing similar things
2. **Type inconsistency** - Need canonical shared types
3. **Helper underuse** - `legalMovesServer.ts` not integrated
4. **Legacy patterns** - `window.prompt()` still in use

**Priority fixes:**
1. ✅ Consolidate types → `/types/dialogue.ts`
2. ✅ Remove `window.prompt()` → always use modals
3. ✅ Decide on canonical component pattern
4. ✅ Extract shared hooks (`useMicroToast`, `useCQStats`)
5. ✅ Delete or integrate `legalMovesServer.ts`

**Overall Grade: B+** (Good foundation, needs cleanup)
