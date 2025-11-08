# Evidential Score API - Circular Dependency Fix

## Problem

The `/api/evidential/score` endpoint was experiencing a **Maximum call stack size exceeded** error due to circular dependencies in the argument graph.

### Root Cause

The `supportClaim()` function recursively evaluates claims by following argument premises. When claims reference each other in a cycle (e.g., Claim A depends on Claim B, which depends on Claim C, which depends back on Claim A), the recursion never stops, causing a stack overflow.

**Error Location**: Line 180 (before fix)
```typescript
const premSupports = a.premises.map((p:any) => supportClaim(p.claimId).score);
```

### Stack Trace
```
⨯ RangeError: Maximum call stack size exceeded
    at supportClaim (webpack-internal:///(rsc)/./app/api/evidential/score/route.ts:216:54)
    at eval (webpack-internal:///(rsc)/./app/api/evidential/score/route.ts:216:49)
    at Array.map (<anonymous>)
    ... collapsed 45 duplicate lines matching above 3 lines 15 times...
```

## Solution

Added **cycle detection** using an `inProgress` Set that tracks which claims are currently being evaluated in the recursion stack.

### Changes Made

1. **Added cycle tracking variable** (line 97):
   ```typescript
   const inProgress = new Set<string>(); // Cycle detection: tracks claims currently being evaluated
   ```

2. **Added cycle detection check** (lines 157-161):
   ```typescript
   // Cycle detection: if we're already computing this claim, return neutral prior to break cycle
   if (inProgress.has(claimId)) {
     const cycleResult = { score: prior, bel: prior, pl: 1, explain: explain ? { kind:"cycle", prior } : undefined };
     return cycleResult; // Don't cache this - it's a temporary value during cycle resolution
   }
   ```

3. **Mark claim as in-progress** (line 164):
   ```typescript
   inProgress.add(claimId);
   ```

4. **Wrapped computation in try-finally** (lines 166-242):
   ```typescript
   try {
     // ... existing computation logic ...
     return result;
   } finally {
     // Always remove from in-progress set when done (even if error thrown)
     inProgress.delete(claimId);
   }
   ```

### How It Works

1. When `supportClaim(A)` is called, `A` is added to `inProgress`
2. If `A` depends on `B`, we call `supportClaim(B)` (adds `B` to `inProgress`)
3. If `B` depends on `C`, we call `supportClaim(C)` (adds `C` to `inProgress`)
4. **If `C` depends on `A`**, we detect `A` is already in `inProgress`
5. Instead of recursing infinitely, we return a **neutral prior score (0.5)** to break the cycle
6. The `finally` block ensures `inProgress` is cleaned up even if errors occur

### Behavior

- **Cyclic claims** are assigned a neutral confidence score (0.5) during recursive evaluation
- **Non-cyclic paths** are evaluated normally
- The **memoization cache** still works for acyclic evaluations
- Cycle-breaking results are **not cached** (intentional) so different entry points into cycles get fresh evaluation

## Testing

Run the API endpoint that was previously failing:
```bash
GET /api/evidential/score?deliberationId=ludics-forest-demo&mode=prod&ids=cmhpna9vv00yjg1t9l7qs7n5i,cmhocacup0004g1ai9rl2yojx,...
```

Should now return 200 instead of 500.

## Additional Notes

- The fix follows the AGENTS.md conventions (double quotes in TS files)
- Code passes linting with no errors in the modified file
- The solution is **production-ready** and handles edge cases via the `finally` block
