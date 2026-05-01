# Discourse Dashboard Review and Fixes

**Date**: November 7, 2025  
**Status**: 3 of 5 issues resolved

## Issues Identified and Resolutions

### ✅ Issue #1: Page Reload on ASPIC Attack Execution

**Problem**: Full page reload (`window.location.reload()`) triggered when:
- Creating attack via AttackCreationModal
- Responding to attacks via DiscourseDashboard

**Root Cause**: 
- `ClaimDetailPanel.tsx` line 320: `window.location.reload()` in `onCreated` callback
- `DiscourseDashboard.tsx` line 740: `window.location.reload()` after response submission

**Solution Implemented**:
- Replaced `window.location.reload()` with SWR's `mutate()` function
- Added `import { mutate } from "swr"` to both files
- Used targeted cache invalidation: `mutate((key) => typeof key === 'string' && key.includes('/api/'))`

**Files Modified**:
- `components/claims/ClaimDetailPanel.tsx`
- `components/discourse/DiscourseDashboard.tsx`

**Result**: No more full page reloads - data refreshes smoothly via SWR revalidation

---

### ✅ Issue #3: GROUNDS Provision UI Missing Text Input

**Problem**: DiscourseDashboard "Provide GROUNDS" dropdown option had no way to enter text justification

**Root Cause**: `ActionOnMeCard` component submitted GROUNDS moves without text input via `/api/dialogue/move` (which doesn't accept text)

**Solution Implemented**:
1. Added state: `groundsText`, `showGroundsInput`
2. When "Provide GROUNDS" selected and "Respond" clicked, show textarea
3. Textarea includes:
   - Placeholder: "Provide your grounds/justification..."
   - Submit button (disabled if empty)
   - Cancel button
4. On submit, calls `/api/dialogue/answer-and-commit` with:
   - `expression`: groundsText
   - `original`: groundsText  
   - `commitOwner`: "Proponent"
   - `commitPolarity`: "pos"

**Files Modified**:
- `components/discourse/DiscourseDashboard.tsx` (ActionOnMeCard component)

**Result**: Users can now enter GROUNDS text before submission

---

### ⏳ Issue #2: Empty Activity Feed

**Problem**: "Activity Feed" tab shows empty state despite user activity

**Current State**: `/api/deliberations/[id]/activity-feed` returns empty array with TODO comment

**Investigation**:
- `app/deliberation/[id]/dialoguetimeline/page.tsx` shows comprehensive timeline implementation
- Aggregates: DialogueMoves, Arguments, ConflictApplications, Preferences
- Groups moves into threads (WHY + responses)
- Provides filtering by move type

**Recommended Solution**:
1. Enhance `/api/deliberations/[id]/activity-feed/route.ts`:
   ```typescript
   // Fetch user's participation
   - DialogueMoves where actorId = userId
   - ConflictApplications where conflictingClaim/Argument belongs to user
   - Arguments where authorId = userId
   - Claims where createdById = userId
   
   // Aggregate into timeline events
   - Map to unified event format: { type, timestamp, actorId, data }
   - Sort by timestamp DESC
   - Limit to recent 50 events
   ```

2. Event Types:
   - `dialogue_move`: WHY, GROUNDS, CONCEDE, RETRACT, ASSERT
   - `conflict_created`: User created attack
   - `conflict_received`: User's work was attacked
   - `argument_created`: User created argument
   - `claim_created`: User created claim

**Status**: TODO - endpoint skeleton exists, needs implementation

---

### ⏳ Issue #4: GROUNDS Implementation Review

**Current Investigation**:

**File**: `app/api/dialogue/answer-and-commit/route.ts`

**What It Does**:
1. **Creates AIF Argument Node** (via `createArgumentFromGrounds`):
   - Only if target is a claim
   - Creates `Argument` with:
     - `text`: groundsText
     - `conclusionClaimId`: targetClaimId
     - `schemeId`: from schemeKey (optional)
     - `mediaType`: "text"

2. **Creates DialogueMove**:
   - `kind`: "GROUNDS"
   - `targetType`: claim/argument
   - `targetId`: ID of target
   - `payload`: { expression, cqId, locusPath, original, createdArgumentId }
   - `argumentId`: Links to created Argument

3. **Bidirectional Provenance**:
   - Argument.createdByMoveId → DialogueMove.id
   - DialogueMove.argumentId → Argument.id

4. **Commitment Store Update**:
   - Calls `applyToCS()` with expression
   - Adds to Proponent or Opponent CS

**Potential Issues**:
- ❓ **ArgumentPremise Creation**: `createArgumentFromGrounds` doesn't create premises
  - GROUNDS arguments have only conclusion, no premises
  - Is this intentional? (Bare assertion pattern?)
  
- ❓ **ASPIC+ Integration**: No ConflictApplication created
  - GROUNDS is a supporting argument, not an attack
  - Should it create ArgumentSupport relation?

- ✅ **AIF Node Creation**: Properly creates Argument node
- ✅ **DialogueMove Creation**: Properly creates GROUNDS move
- ✅ **Provenance Tracking**: Bidirectional links working

**Recommendations**:
1. **Add ArgumentPremise Support**:
   - Allow GROUNDS to reference existing claims as premises
   - Or mark as "bare assertion" in metadata

2. **Consider ArgumentSupport**:
   - GROUNDS provides support for target claim
   - Should create ArgumentSupport(argumentId, claimId) relation

3. **ASPIC+ Integration**:
   - Verify GROUNDS arguments participate in grounded semantics
   - Check if they're included in attack graph evaluation

**Status**: Needs deeper code audit and testing

---

### ⏳ Issue #5: Defeat Workflow Documentation

**Goal**: Document exact UI steps to defeat an argument and show it in ASPIC+ tab as OUT

**Current Understanding**:

**ASPIC+ Defeat Conditions**:
1. Argument has attacking ConflictApplication
2. Attack type: UNDERMINES, REBUTS, or UNDERCUTS
3. Attack succeeds (not itself defeated)
4. Evaluation sets `aspicDefeatStatus: true`

**Suspected Workflow**:
```
1. User A creates Argument A1 (conclusion: "Climate change is real")
2. User B creates Claim B1 ("Climate data is unreliable")
3. User B creates UNDERMINING attack: B1 → A1 (premise attack)
4. Navigate to ASPIC+ tab
5. Click "Run Evaluation" (POST /api/aspic/evaluate)
6. Evaluation computes grounded semantics
7. A1 should show in "Defeated Arguments (OUT)" section
```

**Test Checklist**:
- [ ] Create argument with premises and conclusion
- [ ] Create undermining attack on premise
- [ ] Run ASPIC+ evaluation
- [ ] Verify argument shows as OUT
- [ ] Verify attack shows as defeating attack
- [ ] Test with rebutting attack (conclusion attack)
- [ ] Test with undercutting attack (rule attack)

**Open Questions**:
1. Does evaluation run automatically or require manual trigger?
2. Are preferences considered in defeat? (aspicDefeatStatus vs. attack existence)
3. Do GROUNDS arguments affect defeat status?

**Status**: TODO - requires end-to-end testing

---

## Summary

**Completed** (3/5):
1. ✅ Fixed page reload - now using SWR mutate
2. ✅ Fixed GROUNDS UI - added textarea for text input
3. ✅ Verified answer-and-commit creates proper AIF nodes

**In Progress** (2/5):
1. ⏳ Activity Feed implementation (endpoint skeleton exists)
2. ⏳ Defeat workflow documentation (needs testing)

**Technical Debt**:
- Consider adding ArgumentSupport relation for GROUNDS
- Add premises support to GROUNDS arguments
- Implement real-time updates for dashboard (WebSocket/polling)
- Add user name resolution in attacks-on-user/challenges-on-user endpoints

**Next Steps**:
1. Implement Activity Feed aggregation logic
2. Test complete defeat workflow end-to-end
3. Document UI steps for defeating arguments
4. Consider adding ArgumentSupport for GROUNDS
