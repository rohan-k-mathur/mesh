# Critical Questions Counter-Claim Attach Fix

## Date
November 20, 2025

## Issue Summary
Counter-claim attachment flow in CriticalQuestionsV3 was failing with 400/500 errors when users tried to attach counter-claims to critical questions for the `claim_relevance` scheme.

## Root Causes

### 1. Missing Preset for `claim_relevance` Scheme
**Problem:** The `cqPresets.ts` file did not include attack presets for the `claim_relevance` scheme, causing `suggestionForCQ` to return `null`.

**Fix:** Added `claim_relevance` preset with two attack options:
- `rebut_off_topic`: Direct rebut targeting conclusion
- `undercut_context`: Undercut targeting inference

**File:** `/lib/argumentation/cqPresets.ts`

```typescript
{
  schemeKey: 'claim_relevance',
  shape: 'conditional',
  options: [
    { key:'rebut_off_topic', label:'Rebut (off-topic)', type:'rebut', targetScope:'conclusion',
      template:'This claim is not relevant to the topic of discussion.' },
    { key:'undercut_context', label:'Undercut (context mismatch)', type:'undercut', targetScope:'inference',
      template:'The claim does not address the specific context or scope of the deliberation.' },
  ]
}
```

### 2. Type Safety Issue in `suggestionForCQ`
**Problem:** Function was returning objects with a `scope` property for all attack types, but TypeScript discriminated union required `scope` to be absent for `undercut` attacks and present for `rebut` attacks.

**Fix:** Refactored function to return properly typed discriminated unions:
- Undercut: `{ type: 'undercut', ... }` (NO scope property)
- Rebut: `{ type: 'rebut', scope: 'premise' | 'conclusion', ... }` (WITH scope property)

**File:** `/lib/argumentation/cqSuggestions.ts`

```typescript
if (primary.type === 'undercut') {
  return {
    type: 'undercut' as const,
    template: primary.template,
    shape: presets[0].shape,
    options: presets.flatMap(p => p.options),
  };
} else {
  return {
    type: 'rebut' as const,
    scope: (primary.targetScope ?? 'conclusion') as 'premise' | 'conclusion',
    template: primary.template,
    shape: presets[0].shape,
    options: presets.flatMap(p => p.options),
  };
}
```

### 3. Variable Scope Issue in API Route
**Problem:** `proofMet` variable was declared inside `if (satisfied === true)` block but referenced in return statement outside that block, causing `ReferenceError: proofMet is not defined`.

**Fix:** Moved declaration to outer scope and changed assignment from `const` to assignment to existing variable.

**File:** `/app/api/cqs/toggle/route.ts`

```typescript
// Declare at outer scope
let proofMet = false;

if (satisfied === true) {
  // ... calculation logic ...
  proofMet = hasEdge || (requiredAttack === 'rebut' && ...);
}

// Now accessible in return statement
return NextResponse.json({
  guard: { proofMet, ... }
});
```

## Flow Verification

### Successful Flow
1. User clicks "Attach Counter-Claim" in CQ modal for `claim_relevance` scheme
2. `handlePickerSelect` correctly finds parent `schemeKey: 'claim_relevance'`
3. `attachWithAttacker` called with correct params
4. API `/api/cqs/toggle` receives request
5. `suggestionForCQ('claim_relevance', 'addresses_issue')` returns valid rebut suggestion
6. `createClaimAttack` creates ClaimEdge with:
   - `type: 'rebuts'`
   - `attackType: 'REBUTS'`
   - `targetScope: 'conclusion'`
7. Edge persisted to database successfully
8. CQ status updated and UI refreshed

### Key Data Structures
```typescript
// Suggestion object (rebut)
{
  type: 'rebut',
  scope: 'conclusion',
  template: 'This claim is not relevant to the topic of discussion.',
  shape: 'conditional',
  options: [...]
}

// ClaimEdge record
{
  fromClaimId: 'cmi6xaj8j0000g11spu05vm0w',
  toClaimId: 'cmi50v2tw000a8c0d9l97o8r8',
  type: 'rebuts',
  attackType: 'REBUTS',
  targetScope: 'conclusion',
  deliberationId: 'ludics-forest-demo',
  metaJson: {
    cqKey: 'addresses_issue',
    schemeKey: 'claim_relevance',
    source: 'critical-questions-v3-attach'
  }
}
```

## Files Modified

1. **`/lib/argumentation/cqPresets.ts`**
   - Added `claim_relevance` scheme preset

2. **`/lib/argumentation/cqSuggestions.ts`**
   - Fixed type discrimination for undercut vs rebut suggestions
   - Added documentation for type safety

3. **`/lib/argumentation/createClaimAttack.ts`**
   - Added documentation for attack mapping
   - Removed debug logging

4. **`/app/api/cqs/toggle/route.ts`**
   - Fixed `proofMet` variable scope issue
   - Removed debug logging

5. **`/components/claims/CriticalQuestionsV3.tsx`**
   - Removed debug logging from attach flow

## Testing Recommendations

1. Test counter-claim attachment for all scheme types:
   - `claim_relevance` ✅
   - `claim_clarity` (needs preset)
   - `claim_truth` ✅
   - `expert_opinion` ✅
   - `cause_to_effect` ✅

2. Verify both attack types work:
   - Rebut attacks (target conclusion/premise) ✅
   - Undercut attacks (target inference) ✅

3. Test edge cases:
   - Missing scheme preset (should show graceful error)
   - Duplicate edge creation (should be idempotent via upsert)
   - Invalid claim IDs (should return 404)

## Related Work

- This fix completes the CQ counter-claim attachment workflow
- Integrates with ASPIC+ attack system via ClaimEdge records
- Supports AIF diagram visualization of attack relationships
- Enables dialogue-aware graph building for support/attack networks
