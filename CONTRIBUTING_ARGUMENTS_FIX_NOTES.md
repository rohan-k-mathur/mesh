# Contributing Arguments - Follow-up Fixes

## Issues Identified

### 1. Duplicate Arguments with Same Score
**Problem:** Multiple ArgumentSupport records can exist for the same argumentId → claimId pair when there are multiple derivation paths.

**Solution Implemented:**
- Backend now groups by `argumentId` and counts occurrences
- Takes the **max score** when multiple derivations exist
- Returns `occurrences` count in the response

**Frontend Enhancement:**
- Shows `×N` badge when an argument appears multiple times
- Deduplicates display while preserving contribution info

### 2. All Scores Showing 70%
**Root Cause Analysis:**

The 70% is likely coming from one of these default values:
- `DEFAULT_ARGUMENT_CONFIDENCE = 0.55` (55%)
- `DEFAULT_ASSUMPTION_WEIGHT = 0.6` (60%)
- `DEFAULT_PREMISE_BASE = 0.5` (50%)

The computation is:
```typescript
score = base × premiseFactor × assumptionFactor

// If no assumptions:
// 0.55 × 1.0 × 1.0 = 0.55 (55%)

// If default assumption:
// 0.55 × 1.0 × 0.6 = 0.33 (33%)

// If legacy assumption with default:
// Could be: some_base × premises × 0.6 ≈ 0.7
```

**Possible causes for 70%:**
1. Arguments have base confidence of 0.7
2. Legacy AssumptionUse records with weight 0.7
3. Premise composition resulting in 0.7
4. Default values being used incorrectly

**To Debug:**
Add logging to see actual values:
```typescript
console.log('Contribution calculation:', {
  argumentId: s.argumentId,
  base: b,
  premIds: premIds.length,
  premFactor,
  assumpFactor,
  finalScore: score
});
```

### 3. Showing I-nodes vs RA-nodes
**Current Behavior:**
The `contributionsByClaim` map contains ALL ArgumentSupport records, which means it includes:
- **RA nodes (Arguments):** Actual arguments concluding the claim
- **I nodes (Claims):** Premise claims that support the argument structure

**Question for User:**
What should we show?

**Option A: Only Arguments (RA nodes)**
- Filter: `argumentId` must exist in `pageRows` (i.e., is an actual Argument)
- Pro: Shows only reasoning steps with full argument structure
- Con: Doesn't show atomic premise support

**Option B: Both Arguments and Claims**
- Current behavior
- Pro: Shows complete support picture
- Con: May be confusing to users

**Option C: Separate sections**
```
Contributing Arguments:
- Argument A (45%)
- Argument B (25%)

Premise Claims:
- Claim X (30%)
- Claim Y (20%)
```

**Recommended:** Option A (only show Arguments) unless user specifically wants to see claim-level support.

### Implementation for Option A (Arguments Only)

```typescript
// In route.ts, when building contributingArguments:
contributingArguments: conclusionClaimId
  ? (() => {
      const allContribs = contributionsByClaim.get(conclusionClaimId) ?? [];
      
      // Filter to only include actual arguments (not bare claims)
      const argOnlyContribs = allContribs.filter(c => 
        !c.argumentId.startsWith('virt:') && 
        textByArgumentId.has(c.argumentId) // Exists in current page arguments
      );
      
      // Group by argumentId and count occurrences
      const grouped = new Map<string, { score: number; count: number }>();
      for (const c of argOnlyContribs) {
        if (!grouped.has(c.argumentId)) {
          grouped.set(c.argumentId, { score: c.score, count: 1 });
        } else {
          const g = grouped.get(c.argumentId)!;
          g.count += 1;
          g.score = Math.max(g.score, c.score);
        }
      }
      
      return Array.from(grouped.entries())
        .map(([argId, data]) => ({
          argumentId: argId,
          contributionScore: data.score,
          argumentText: textByArgumentId.get(argId) ?? null,
          occurrences: data.count,
        }))
        .sort((a, b) => b.contributionScore - a.contributionScore)
        .slice(0, 10);
    })()
  : [],
```

## Next Steps

1. **Confirm with user:** What should be shown (Arguments only, Claims only, or both)?
2. **Debug 70% issue:** Add logging or examine actual ArgumentSupport/AssumptionUse data
3. **Consider adding claim text lookup:** If showing claims, need to fetch claim text for those IDs
4. **Add tooltips:** Explain what "contribution score" means vs "overall support"

## Data Flow Summary

```
ArgumentSupport table:
├─ claimId (the claim being supported)
├─ argumentId (the argument/claim providing support)
├─ base (base confidence of the argument)
└─ provenanceJson (import metadata)

Current API behavior:
1. Fetches all ArgumentSupport where claimId ∈ {claims in deliberation}
2. Computes contribution = base × premises × assumptions
3. Groups by claimId → list of { argumentId, score }
4. Returns top 10 for each argument's conclusion

Issue: argumentId can be either:
- An actual Argument record (RA node)
- A Claim ID (I node) - used for atomic support
```
