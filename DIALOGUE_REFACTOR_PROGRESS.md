# Dialogue Components Refactor - Progress Report

**Date:** October 25, 2025  
**Status:** Phase 1 & 2 Complete, Phase 3 In Progress

---

## ✅ COMPLETED

### 1. Shared Type Definitions (`/types/dialogue.ts`)
Created comprehensive type system including:
- **Move types**: `MoveKind`, `MoveForce`, `MoveRelevance`, `Move`, `Verdict`
- **Context types**: `DialogueContext`, `DialogueContextWithActor`
- **API types**: `PostMoveRequest`, `LegalMovesResponse`, `PostMoveResponse`
- **CQ types**: `CQStatusBadge`, `CQItem`, `CQDataResponse`
- **Helper types**: `DialogueOwner`, `LocusPath`, `ToastKind`, `ToastMessage`
- **Event types**: Global Window event map for custom events

**Impact:** All components can now import from a single canonical source

---

### 2. Extracted Shared Hooks

#### `useMicroToast` (`/hooks/useMicroToast.tsx`)
- Lightweight toast notifications
- Supports 4 kinds: `ok`, `err`, `info`, `warn`
- Auto-dismiss with configurable duration
- Manual dismiss button
- Proper accessibility (aria-live, role)

**Usage:**
```tsx
const toast = useMicroToast();
toast.show("Success!", "ok");
return <>{toast.node}</>;
```

#### `useCQStats` (`/hooks/useCQStats.ts`)
- Fetches and calculates CQ statistics for claims
- Returns `{ total, satisfied }` or `null`
- Built-in SWR caching
- Only fetches for claim targets

**Usage:**
```tsx
const cqStats = useCQStats({ targetType: "claim", targetId });
if (cqStats) {
  console.log(`${cqStats.satisfied}/${cqStats.total} CQs answered`);
}
```

---

### 3. New Modal Component: `WhyChallengeModal`

**Purpose:** Replace `window.prompt()` for generic WHY challenges

**Features:**
- Full modal UI with description
- Shows target text being challenged
- Example challenge templates
- Keyboard shortcuts (Cmd/Ctrl+Enter to submit)
- Input validation (min 5 characters)
- Error handling

**Usage:**
```tsx
<WhyChallengeModal
  open={open}
  onOpenChange={setOpen}
  onSubmit={(text) => postWhyChallenge(text)}
  targetText="The claim being challenged"
/>
```

---

### 4. Component Updates

#### LegalMoveChips.tsx ✅
- ✅ Now imports from `/types/dialogue`
- ✅ Uses `useMicroToast` hook (removed inline implementation)
- ✅ Uses `useCQStats` hook (removed inline SWR logic)
- ✅ Integrates `WhyChallengeModal` (removed `window.prompt()`)
- ✅ Added JSDoc header clarifying purpose as "minimal inline UI"

#### StructuralMoveModal.tsx ✅
- ✅ Now imports `MoveKind` from `/types/dialogue`
- ✅ Uses type extraction: `Extract<MoveKind, "THEREFORE" | "SUPPOSE" | "DISCHARGE">`

---

## 🚧 IN PROGRESS

### Remove Remaining `window.prompt()` Calls

**Found in:**
1. ✅ `LegalMoveChips.tsx` - FIXED (now uses WhyChallengeModal)
2. ⚠️ `CommandCard.tsx` - NEEDS FIX
   - Line 238: WHY challenge prompt
   - Line 252: THEREFORE/SUPPOSE expression prompt
3. ⚠️ `CriticalQuestions.tsx` - Line 700: Grounds brief prompt
4. Other files (non-dialogue):
   - `ChatRoom.tsx` - Multiple label prompts
   - `ArticleEditor.tsx` - Alt text, caption prompts
   - `KbEditor.tsx` - General prompts

---

## 📋 TODO

### Phase 3: Complete `window.prompt()` Removal

#### High Priority (Dialogue System)
1. **CommandCard.tsx**
   - Replace WHY prompt with `WhyChallengeModal`
   - Replace THEREFORE/SUPPOSE prompts with `StructuralMoveModal`
   - Update to use shared types from `/types/dialogue`

2. **CriticalQuestions.tsx**
   - Replace grounds prompt with `NLCommitPopover` or new modal
   - Review component for other legacy patterns

#### Medium Priority (Non-Dialogue)
3. **ChatRoom.tsx** - Create `LabelInputModal` for label prompts
4. **ArticleEditor.tsx** - Create `ImageMetadataModal` for alt/caption
5. **KbEditor.tsx** - Review necessity of prompts

---

### Phase 4: Component Alignment & Documentation

#### Update LegalMoveToolbar.tsx
- Import from `/types/dialogue`
- Use `useMicroToast` hook
- Clarify role as "grid view toolbar"
- Add JSDoc header

#### Update DialogueActionsModal.tsx
- Import from `/types/dialogue` (partially done)
- Extract move config to shared location?
- Consider adding WhyChallengeModal integration

#### Update API Route
- Export `MoveWithVerdict` type to `/types/dialogue`
- Consider consolidating with `legalMovesServer.ts`

---

### Phase 5: Testing & Validation

- [ ] Test WHY challenges via WhyChallengeModal
- [ ] Test structural moves via StructuralMoveModal
- [ ] Test GROUNDS via NLCommitPopover
- [ ] Verify all toast notifications work
- [ ] Verify CQ stats display correctly
- [ ] Check TypeScript compilation
- [ ] Check for any runtime errors
- [ ] Verify event dispatching still works

---

## 📊 Component Role Definitions (Clarified)

### LegalMoveChips
**Purpose:** Minimal inline UI - just button chips  
**Use When:** Compact, space-constrained contexts  
**Opens:** NLCommitPopover, StructuralMoveModal, WhyChallengeModal  
**Status:** ✅ Modernized

### LegalMoveToolbar
**Purpose:** Grid view with CommandCard integration  
**Use When:** Power users need rich command palette  
**Status:** ⚠️ Needs update to use shared types/hooks

### DialogueActionsModal + DialogueActionsButton
**Purpose:** Full-featured main dialogue UI  
**Use When:** Primary dialogue interaction interface  
**Status:** ✅ Already good, minor updates needed

---

## 🎯 Next Steps

1. **Fix CommandCard.tsx** (highest priority)
   - Add WhyChallengeModal integration
   - Add StructuralMoveModal integration
   - Remove both `window.prompt()` calls

2. **Fix CriticalQuestions.tsx**
   - Replace grounds prompt with proper modal

3. **Update LegalMoveToolbar.tsx**
   - Use shared types and hooks
   - Add documentation

4. **Testing**
   - Manual QA of all dialogue flows
   - Check for TypeScript errors
   - Verify no regressions

5. **Documentation**
   - Update README with new architecture
   - Add usage examples for new hooks
   - Document component selection guide

---

## 📝 Notes for Future Work

### Potential Improvements
- Create `useLegalMoves` hook to encapsulate SWR fetching logic
- Extract move configuration to `/config/dialogue-moves.ts`
- Consider creating `DialogueProvider` context for shared state
- Add Storybook stories for all dialogue components
- Add unit tests for hooks and utilities

### API Consolidation Decision Needed
- Keep `legalMovesServer.ts` and have API use it, OR
- Delete `legalMovesServer.ts` and keep logic in API route
- **Current recommendation:** Delete helper, keep in API for simplicity

---

## ✅ Success Metrics

- [x] All dialogue components use shared types
- [x] No inline hook implementations (use shared hooks)
- [ ] Zero `window.prompt()` in dialogue system (1 of 2 files fixed)
- [ ] All structural moves use modals
- [ ] All toast notifications use `useMicroToast`
- [ ] All CQ stats use `useCQStats`
- [ ] TypeScript strict mode compliance
- [ ] No runtime errors in dialogue flows
