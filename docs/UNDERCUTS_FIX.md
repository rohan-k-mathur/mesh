# Undercuts Display Fix

## Problem
Undercuts were being posted successfully without errors but were not showing up in the ArgumentCard component.

## Root Cause
The system has **two parallel attack tracking systems**:

1. **ArgumentEdge** table - Traditional AF (Argumentation Framework)
   - Tracks argument-to-argument attacks
   - Created when both attacker and target are Arguments
   - Queried via `/api/arguments/[id]/attacks`

2. **ConflictApplication** table - Modern CA (Conflict Application) 
   - Tracks both claim-to-argument and argument-to-argument conflicts
   - Created when posting to `/api/ca`
   - Queried via `/api/ca?targetArgumentId=[id]`

## The Issue with Undercuts

When a user creates an UNDERCUT via `AttackMenuPro`:

```typescript
// User enters exception text (e.g., "However, the expert's opinion was given before...")
const exceptionClaimId = await createClaim(txt, ctrl.signal);

// Posts to /api/ca with:
await postCA({
  deliberationId,
  conflictingClaimId: exceptionClaimId,      // ← CLAIM, not argument!
  conflictedArgumentId: target.id,
  legacyAttackType: 'UNDERCUTS',
  legacyTargetScope: 'inference',
}, ctrl.signal);
```

The CA endpoint only creates an `ArgumentEdge` when BOTH of these are true:
```typescript
if (d.legacyAttackType && d.conflictedArgumentId && d.conflictingArgumentId) {
  await prisma.argumentEdge.create({ ... });
}
```

Since `conflictingArgumentId` is `null` (we're attacking with a claim, not an argument), no `ArgumentEdge` gets created.

## The Fix

Updated `ArgumentCard` to fetch from **both sources** and merge the results:

```typescript
// Fetch from both sources in parallel
const [edgesRes, caRes] = await Promise.all([
  fetch(`/api/arguments/${id}/attacks`, { cache: "no-store" }),
  fetch(`/api/ca?targetArgumentId=${id}`, { cache: "no-store" })
]);

// Convert ArgumentEdges
const edgeAttacks = (edgesData.items || []).map(edge => ({
  id: edge.id,
  attackType: edge.attackType,
  targetScope: edge.targetScope,
  fromArgumentId: edge.fromArgumentId,
  source: "edge"
}));

// Convert ConflictApplications
const caAttacks = (caData.items || [])
  .filter(ca => ca.conflictedArgumentId === id && ca.legacyAttackType)
  .map(ca => ({
    id: ca.id,
    attackType: ca.legacyAttackType,
    targetScope: ca.legacyTargetScope,
    fromArgumentId: ca.conflictingArgumentId,
    fromClaimId: ca.conflictingClaimId,
    source: "ca"
  }));

// Merge both sources
const allAttacks = [...edgeAttacks, ...caAttacks];
```

## Benefits of This Approach

1. **Complete Coverage**: Shows attacks from both the legacy AF system and modern CA system
2. **Backward Compatible**: Works with old ArgumentEdge-based attacks
3. **Forward Compatible**: Supports new CA-based attacks
4. **Flexible**: Handles all attack types regardless of whether attacker is a claim or argument

## Attack Type Coverage

| Attack Type | Via ArgumentEdge | Via ConflictApplication |
|------------|------------------|------------------------|
| REBUTS | ✅ (arg→arg) | ✅ (claim→arg) |
| UNDERCUTS | ✅ (arg→arg) | ✅ (claim→arg) ← **This was missing!** |
| UNDERMINES | ✅ (arg→arg) | ✅ (claim→arg) |

## Files Modified

1. `/components/arguments/ArgumentCard.tsx`
   - Updated `useEffect` for attack fetching
   - Updated `handleRefresh` callback
   - Added explanatory comments

2. `/docs/ARGUMENT_CARD_IMPROVEMENTS.md`
   - Documented the dual-source strategy
   - Explained when each source is used

## Testing Recommendations

1. Create an argument with premises
2. Expand the ArgumentCard
3. Click "Counter" → Choose "Undercut"
4. Enter exception text (e.g., "However, this rule has exceptions in special cases")
5. Post the undercut
6. **Verify**: The undercut count should now appear in the "Inference" section
7. **Verify**: Collapse and re-expand - undercut should persist

## Future Considerations

We may want to eventually:
- Migrate fully to ConflictApplication as the single source of truth
- Deprecate ArgumentEdge creation (use CA + materialization views instead)
- Add UI to distinguish between claim-based and argument-based attacks
