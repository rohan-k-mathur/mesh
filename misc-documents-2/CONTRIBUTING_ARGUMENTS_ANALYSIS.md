# Contributing Arguments Feature - End-to-End Analysis

**Date:** November 20, 2025  
**Feature:** "View contributing arguments" button in DebateSheetReader  
**Status:** ⚠️ INCORRECT IMPLEMENTATION - Needs Fix

---

## Current Flow

### 1. User Interaction
```tsx
// In ArgumentNetworkCard.tsx (line 212)
{node.claimId && (
  <button className="underline" onClick={() => onViewContributing(node.claimId)}>
    View contributing arguments
  </button>
)}
```
- Button appears on every argument card that has a `claimId`
- Clicking triggers `onViewContributing(claimId)` which opens contributingModal

### 2. Modal Display
```tsx
// In DebateSheetReader.tsx (lines 462-482)
{contributingModal.isOpen && contributingModal.claimId && (
  <div className="rounded border p-3 w-full max-w-4xl h-full bg-slate-100">
    <div className="text-sm font-semibold">Contributing arguments (I → φ)</div>
    <p className="text-[11px] text-neutral-600 mb-2">
      Mode: <code>{mode}</code>. These are the lines of support accrued by ∨ for this claim.
    </p>
    <ul className="space-y-2 text-sm">
      {(topByClaim.get(contributingModal.claimId) ?? []).map((c) => (
        <li key={c.argumentId} className="p-2 border rounded flex items-center justify-between">
          <div className="truncate">
            {argText(c.argumentId) ?? `Argument ${c.argumentId.slice(0,8)}…`}
          </div>
          <div className="text-[11px] tabular-nums">{Math.round(c.score*100)}%</div>
        </li>
      ))}
    </ul>
  </div>
)}
```

### 3. Data Computation (CURRENT - INCORRECT)
```tsx
// DebateSheetReader.tsx (lines 240-256)
const topByClaim = useMemo(() => {
  const m = new Map<string, { argumentId: string; score: number }[]>();
  if (fullData?.items) {
    for (const arg of fullData.items) {
      if (arg.aif?.conclusion?.id) {
        const claimId = arg.aif.conclusion.id;
        const list = m.get(claimId) ?? [];
        const score = typeof arg.support === 'number' ? arg.support : arg.support?.bel ?? 0;
        list.push({ argumentId: arg.id, score });
        list.sort((a, b) => b.score - a.score);
        m.set(claimId, list.slice(0, 5)); // Keep top 5
      }
    }
  }
  return m;
}, [fullData]);
```

---

## ❌ Problem Identified

### The Bug
The current implementation is **semantically incorrect**. It's showing:
- **What it shows:** All arguments that **conclude** a specific claim, sorted by their overall support score
- **What it should show:** All arguments that **contribute support to** a specific claim (i.e., arguments used as premises/evidence)

### Example Scenario
Let's say we have:
- **Claim φ**: "Climate change is anthropogenic"
- **Argument A**: [Premise P1, Premise P2] → **Concludes φ** (support: 0.85)
- **Argument B**: [Premise P3, Premise P4] → **Concludes φ** (support: 0.72)
- **Argument C**: [Premise P5] → **Concludes ψ** (support: 0.90)

**Current behavior (WRONG):**
When viewing contributing arguments for φ, shows:
```
1. Argument A (85%)  ← This is an argument CONCLUDING φ, not contributing to it
2. Argument B (72%)  ← Same - this concludes φ
```

**Correct behavior (SHOULD BE):**
When viewing contributing arguments for φ, should show:
```
1. Premise argument P1's evidence (scored contribution)
2. Premise argument P2's evidence (scored contribution)
3. Premise argument P3's evidence (scored contribution)
... etc
```

---

## 🔍 Backend Analysis

### API Computation (CORRECT)
The API endpoint `/api/deliberations/[id]/arguments/full/route.ts` **does compute this correctly**:

```typescript
// Lines 356-382: Compute contributions per claim
const contributionsByClaim = new Map<
  string,
  Array<{ argumentId: string; score: number }>
>();

for (const s of allSupports) {
  const real = !s.argumentId.startsWith("virt:");
  const b = real ? baseByArg.get(s.argumentId) ?? s.base : s.base;
  const premIds = real ? parents.get(s.argumentId) ?? [] : [];
  const premBases = real ? premIds.map((pid) => baseByArg.get(pid) ?? DEFAULT_PREMISE_BASE) : [];
  const premFactor = premBases.length ? compose(premBases, confidenceMode) : 1;

  // ... assumption calculations ...

  const score = clamp01(compose([b, premFactor], confidenceMode) * assumpFactor);

  contributionsByClaim.get(s.claimId)
    .push({ argumentId: s.argumentId, score });
}
```

This correctly computes:
- For each claim in the deliberation
- All arguments that derive/support that claim
- Their weighted contribution scores (base × premises × assumptions)

### ❌ Missing in API Response
**The problem:** `contributionsByClaim` is computed but **NOT returned in the API response**.

The response only includes (lines 476-522):
```typescript
return {
  id: r.id,
  text: r.text,
  support: conclusionSupport,  // Overall support for the conclusion
  acceptance: getAcceptanceLabel(conclusionClaimId),
  aif: {
    scheme: ...,
    conclusion: ...,
    premises: ...,
    attacks: ...,
    preferences: ...,
    cq: ...,
  },
  dialogueProvenance: ...,
}
```

**Missing:** No field for `contributingArguments` or `derivations` per claim.

---

## 🎯 Conceptual Understanding

### What are "Contributing Arguments"?
In evidential/probabilistic argumentation frameworks:

1. **Argument**: A = [P1, P2, ...] → C
   - Has a **base confidence** (intrinsic strength)
   - Has **premises** (supporting claims)
   - Has **conclusion** (the claim it supports)

2. **Claim Support Calculation**:
   ```
   Support(Claim φ) = join(
     support(Arg1 → φ),
     support(Arg2 → φ),
     ...
   )
   ```
   Where each `support(ArgN → φ)` is computed as:
   ```
   base(ArgN) × compose(premises(ArgN)) × compose(assumptions(ArgN))
   ```

3. **Contributing Arguments to Claim φ**:
   - All arguments ArgN where ArgN concludes φ
   - Each has a scored contribution showing how much it adds to Support(φ)
   - These are the **derivations** or **lines of support**

### Current vs Correct Interpretation

| Aspect | Current (Wrong) | Correct |
|--------|----------------|---------|
| **Data source** | `arg.aif.conclusion.id === claimId` | `ArgumentSupport.claimId === claimId` |
| **Score shown** | Overall argument support | Contribution score (base × prems × assump) |
| **Semantics** | "Arguments concluding this claim" | "Arguments contributing support to this claim" |
| **Backend data** | Not using backend calculation | Should use `contributionsByClaim` from API |

---

## 🔧 Fix Plan

### Option 1: Add to API Response (RECOMMENDED)
**Pros:** Accurate, uses existing backend calculation, efficient  
**Cons:** Requires API change

```typescript
// In route.ts, add to response items:
return {
  id: r.id,
  // ... existing fields ...
  
  // NEW: Add contributing arguments for this argument's conclusion
  contributingArguments: conclusionClaimId 
    ? (contributionsByClaim.get(conclusionClaimId) ?? [])
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)  // Top 10 contributors
        .map(c => ({
          argumentId: c.argumentId,
          contributionScore: c.score,
          argumentText: textByArgumentId.get(c.argumentId) ?? null
        }))
    : []
};
```

**Changes needed:**
1. ✅ Update API route to include `contributingArguments` field
2. ✅ Update DebateSheetReader to use `arg.contributingArguments` instead of computing `topByClaim`
3. ✅ Update UI to show contribution scores (not overall support)

### Option 2: Create Separate API Endpoint
**Pros:** Cleaner separation, on-demand loading  
**Cons:** Extra HTTP request, slower UX

```typescript
// New endpoint: /api/claims/[claimId]/contributing-arguments
GET /api/claims/abc123/contributing-arguments?deliberationId=xyz&mode=product

Response:
{
  claimId: "abc123",
  claimText: "Climate change is anthropogenic",
  totalSupport: 0.87,
  contributors: [
    {
      argumentId: "arg1",
      argumentText: "CO2 levels correlate with temperature...",
      contributionScore: 0.45,
      base: 0.9,
      premiseFactor: 0.8,
      assumptionFactor: 0.7
    },
    ...
  ]
}
```

### Option 3: Frontend-Only Fix (NOT RECOMMENDED)
Reconstruct from ArgumentSupport records in the frontend. This would require:
1. Fetching all ArgumentSupport records for the deliberation
2. Fetching all premise relationships
3. Re-implementing the evidential calculation in the frontend

**Cons:** Duplicates logic, error-prone, inefficient

---

## 📊 Testing Checklist

Once fixed, verify:

- [ ] Click "View contributing arguments" on an argument card
- [ ] Modal shows correct title and mode
- [ ] Listed arguments are those that SUPPORT the claim (not just conclude it)
- [ ] Contribution scores are accurate (match backend calculation)
- [ ] Scores update when switching confidence modes (min/product/ds)
- [ ] Empty state shows correctly when no contributions exist
- [ ] Argument text displays correctly (not just IDs)
- [ ] Contribution scores sum to ≤ total claim support (in appropriate modes)

---

## 🚀 Recommended Implementation

### Phase 1: Backend Enhancement
1. Add `contributingArguments` field to API response
2. Include top 10 contributors per argument's conclusion
3. Add contribution score breakdown (optional: base, prem factor, assump factor)

### Phase 2: Frontend Update
1. Remove incorrect `topByClaim` calculation
2. Use `arg.contributingArguments` from API
3. Update modal to show contribution semantics clearly
4. Add visual indicators showing contribution vs total support

### Phase 3: UX Enhancement
1. Add tooltip explaining "contribution score" vs "total support"
2. Show visual breakdown: base × premises × assumptions
3. Link to contributing argument cards (click to expand)
4. Show premise claims for each contributing argument

---

## 📝 Summary

**Current State:** Feature exists but shows wrong data (arguments concluding a claim vs arguments supporting it)  
**Root Cause:** API computes correct data (`contributionsByClaim`) but doesn't return it  
**Fix Complexity:** Medium - requires API change + frontend update  
**Priority:** High - this is a core feature for understanding argument structure  

The fix will make the feature accurate and more useful for understanding how support flows through the argument network.
