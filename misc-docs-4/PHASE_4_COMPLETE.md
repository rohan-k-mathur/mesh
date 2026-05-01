# Phase 4 Complete: Evidential API Integration

## Overview
Successfully updated the evidential API (`/api/deliberations/[id]/evidential/route.ts`) to use per-derivation assumption tracking instead of argument-level assumptions.

## Changes Made

### File: `app/api/deliberations/[id]/evidential/route.ts`

**Lines 95-132: Added Per-Derivation Data Fetching**
```typescript
// Gap 4: Per-derivation assumption tracking
// Fetch all derivations (ArgumentSupport) for these arguments
const derivations = await prisma.argumentSupport.findMany({
  where: { argumentId: { in: realArgIds } },
  select: { id: true, argumentId: true }
});

const derivationIds = derivations.map(d => d.id);
const derivByArg = new Map<string, string[]>();
for (const d of derivations) {
  (derivByArg.get(d.argumentId) ?? derivByArg.set(d.argumentId, []).get(d.argumentId)!).push(d.id);
}

// Fetch per-derivation assumptions
const derivAssumptions = await prisma.derivationAssumption.findMany({
  where: { derivationId: { in: derivationIds } }
});

// Map: derivationId -> assumption weights
const assumpByDeriv = new Map<string, number[]>();
for (const da of derivAssumptions) {
  (assumpByDeriv.get(da.derivationId) ?? assumpByDeriv.set(da.derivationId, []).get(da.derivationId)!)
    .push(clamp01(da.weight));
}

// Legacy fallback: argument-level assumptions (for backward compatibility)
const legacyUses = await prisma.assumptionUse.findMany({
  where: { argumentId: { in: realArgIds } },
  select: { argumentId:true, weight:true },
}).catch(()=>[] as any[]);
const legacyAssump = new Map<string, number[]>();
for (const u of legacyUses) {
  (legacyAssump.get(u.argumentId) ?? legacyAssump.set(u.argumentId,[]).get(u.argumentId)!)
    .push(clamp01(u.weight ?? 0.6));
}
```

**Lines 146-157: Updated Contribution Calculation**
```typescript
// Per-derivation assumption tracking:
let aBases: number[] = [];
if (real) {
  const derivIds = derivByArg.get(s.argumentId) ?? [];
  const derivAssumps: number[] = [];
  for (const dId of derivIds) {
    const weights = assumpByDeriv.get(dId) ?? [];
    if (weights.length) derivAssumps.push(...weights);
  }
  // Fallback to legacy argument-level if no per-derivation data
  aBases = derivAssumps.length ? derivAssumps : (legacyAssump.get(s.argumentId) ?? []);
}

const assumpFactor = aBases.length ? compose(aBases, mode) : 1;
const score = clamp01(compose([b, premFactor], mode) * assumpFactor);
```

## Key Features

### 1. Per-Derivation Granularity
- **Old approach**: One assumption set per argument
- **New approach**: Each derivation has its own assumption set
- **Benefit**: More precise tracking of which assumptions apply to which inferences

### 2. Aggregation Logic
For each argument:
1. Find all derivations of that argument
2. Collect assumption weights from each derivation
3. Aggregate all weights into a single array
4. Compute `assumpFactor` using existing `compose()` function

### 3. Backward Compatibility
- **Primary**: Use per-derivation assumptions if available
- **Fallback**: Use legacy argument-level assumptions
- **Default**: If no assumptions exist, `assumpFactor = 1.0`

This ensures existing deliberations work without migration.

## Testing

### Database Verification
Created 3 test DerivationAssumption records:
- `cmhf0s9nx00008cxe2pko9rvj` (weight: 0.6)
- `cmhf0s9zf00018cxew9aveyjc` (weight: 0.75)
- `cmhf0sa9k00028cxejg7wrrft` (weight: 0.9)

All linked to derivations and verified via database queries.

### Integration Points
- ✅ Fetches derivations per argument
- ✅ Fetches DerivationAssumption links
- ✅ Builds maps: `derivByArg` and `assumpByDeriv`
- ✅ Aggregates per-derivation weights
- ✅ Falls back to legacy if needed
- ✅ Computes assumption factor correctly

## Impact on Confidence Scoring

### Original Formula
```
score = compose([base, premiseFactor], mode) * assumpFactor
```

### Old Assumption Factor
```
assumpFactor = compose(argument.assumptions, mode)
```

### New Assumption Factor
```
// Aggregate across all derivations
derivationWeights = flatten([
  deriv1.assumptions,
  deriv2.assumptions,
  deriv3.assumptions
])
assumpFactor = compose(derivationWeights, mode)
```

### Example
**Argument A** has 2 derivations:
- Derivation D1: assumptions [0.8, 0.9]
- Derivation D2: assumptions [0.7]

**Old approach**: Would not track per-derivation
**New approach**: `aBases = [0.8, 0.9, 0.7]` → `assumpFactor = compose([0.8, 0.9, 0.7], mode)`

## Next Steps

### Phase 5: Client Wrappers
Create TypeScript client functions in `lib/client/evidential.ts`:
- `fetchDerivationAssumptions(derivationId)`
- `linkAssumptionToDerivation(assumptionId, derivationId, weight)`
- `fetchMinimalAssumptions(argumentId)`

### Phase 6: Documentation
- Update `CHUNK_2A_IMPLEMENTATION_STATUS.md`
- Create API documentation for all 4 endpoints
- Write migration guide
- Add usage examples

## Files Modified
- `app/api/deliberations/[id]/evidential/route.ts` (+50 lines)

## Files Created (Phase 4)
- `scripts/test-evidential-integration.ts` (comprehensive integration test)
- `scripts/verify-phase4.ts` (quick verification)
- `PHASE_4_COMPLETE.md` (this document)

## Status
✅ **Phase 4 Complete**: Evidential API now uses per-derivation assumption tracking with full backward compatibility.
