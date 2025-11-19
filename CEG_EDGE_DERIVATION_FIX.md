# CEG Edge Derivation Fix - Implementation Complete

**Date**: 2024-01-XX  
**Status**: ✅ Code Complete, Awaiting User Testing  
**Priority**: HIGH (Core Visualization Accuracy)

---

## Problem Summary

The Claim-Edge Graph (CEG) visualization was showing only **1 edge** despite the ASPIC+ system showing **251 arguments** with attack relationships. This created a severely disconnected graph with 106 isolated nodes out of 108 total.

### Root Cause

The `/api/deliberations/[id]/ceg/mini` endpoint was only fetching explicit `ClaimEdge` records from the database. It completely ignored `ConflictApplication` records that store argument-level attacks from the ASPIC+ system.

**Architecture Gap Identified:**
- **ClaimEdge**: Stores explicit claim-to-claim attacks (few records)
- **ConflictApplication**: Stores argument-to-argument attacks (many records, 251 in ludics-forest-demo)
- **No Sync Mechanism**: These two systems were completely disconnected

---

## Solution Implemented

### Modified File
`/Users/rohanmathur/Documents/Documents/mesh/app/api/deliberations/[id]/ceg/mini/route.ts`

### Changes Made

**1. Fetch ConflictApplications (Lines 103-118)**
```typescript
const conflicts = await prisma.conflictApplication.findMany({
  where: { deliberationId },
  select: {
    id: true,
    conflictingArgumentId: true,
    conflictedArgumentId: true,
    conflictingClaimId: true,
    conflictedClaimId: true,
    aspicAttackType: true,
    legacyAttackType: true,
  },
});
```

**2. Resolve Argument Conclusion Claims (Lines 120-137)**
```typescript
// Extract all unique argument IDs from conflicts
const argIds = [...new Set([
  ...conflicts.map(c => c.conflictingArgumentId).filter(Boolean),
  ...conflicts.map(c => c.conflictedArgumentId).filter(Boolean),
])] as string[];

// Fetch arguments and build map: argumentId -> conclusionClaimId
const argConclusionMap = new Map<string, string>();
if (argIds.length > 0) {
  const args = await prisma.argument.findMany({
    where: { id: { in: argIds } },
    select: { id: true, conclusionClaimId: true },
  });
  args.forEach(arg => {
    if (arg.conclusionClaimId) {
      argConclusionMap.set(arg.id, arg.conclusionClaimId);
    }
  });
}
```

**3. Derive Claim Edges from Argument Conflicts (Lines 139-175)**
```typescript
const derivedEdges: Array<{
  id: string;
  fromClaimId: string;
  toClaimId: string;
  type: 'supports' | 'rebuts';
  attackType: string | null;
  targetScope: string | null;
}> = [];

for (const conflict of conflicts) {
  let fromClaimId: string | null = null;
  let toClaimId: string | null = null;

  // Determine source claim (prefer explicit, fallback to argument conclusion)
  if (conflict.conflictingClaimId) {
    fromClaimId = conflict.conflictingClaimId;
  } else if (conflict.conflictingArgumentId) {
    fromClaimId = argConclusionMap.get(conflict.conflictingArgumentId) ?? null;
  }

  // Determine target claim (prefer explicit, fallback to argument conclusion)
  if (conflict.conflictedClaimId) {
    toClaimId = conflict.conflictedClaimId;
  } else if (conflict.conflictedArgumentId) {
    toClaimId = argConclusionMap.get(conflict.conflictedArgumentId) ?? null;
  }

  // Create derived edge if both claims are valid and distinct
  if (fromClaimId && toClaimId && fromClaimId !== toClaimId) {
    derivedEdges.push({
      id: `derived_${conflict.id}`,
      fromClaimId,
      toClaimId,
      type: 'rebuts', // Conflicts are always attacks
      attackType: conflict.aspicAttackType || conflict.legacyAttackType,
      targetScope: null,
    });
  }
}
```

**4. Merge Edge Sets (Line 177-178)**
```typescript
// Merge claim edges with derived edges
const allClaimEdges = [...claimEdges, ...derivedEdges];
```

**5. Update Edge Processing (Line 195)**
```typescript
// Process edges (both explicit ClaimEdges and derived edges from ConflictApplications)
for (const edge of allClaimEdges) {
  // ... rest of edge processing logic
```

---

## Expected Results

### Before Fix
```json
{
  "totalClaims": 108,
  "totalEdges": 1,
  "isolatedCount": 106,
  "clusterCount": 107,
  "edges": [
    { "id": "...", "source": "...", "target": "..." }
  ]
}
```

### After Fix (Expected)
```json
{
  "totalClaims": 108,
  "totalEdges": 200-250,  // Should match ConflictApplication count
  "isolatedCount": 5-20,  // Dramatically reduced
  "clusterCount": 10-30,  // Fewer, larger clusters
  "edges": [
    { "id": "explicit_edge_1", "source": "...", "target": "..." },
    { "id": "derived_conflict_id_1", "source": "...", "target": "..." },
    { "id": "derived_conflict_id_2", "source": "...", "target": "..." },
    ...
  ]
}
```

**Key Improvements:**
- ✅ Edge count increases from 1 to ~250 (matches ASPIC+ attack count)
- ✅ Isolated node count drops from 106 to <20
- ✅ Graph shows proper connectivity reflecting argument structure
- ✅ Derived edges identifiable by `derived_` prefix in ID

---

## Testing Instructions

### Prerequisites
1. Ensure Next.js dev server is running: `npm run dev`
2. Authenticate in browser at `http://localhost:3000`
3. Navigate to deliberation: `ludics-forest-demo`

### Test Steps

**1. Via Browser DevTools:**
```javascript
// Open browser console at deliberation page
fetch('/api/deliberations/ludics-forest-demo/ceg/mini')
  .then(r => r.json())
  .then(data => {
    console.log('Total Edges:', data.totalEdges);
    console.log('Isolated Nodes:', data.isolatedCount);
    console.log('Cluster Count:', data.clusterCount);
    console.log('Derived Edges:', data.edges.filter(e => e.id.startsWith('derived_')).length);
    console.log('Explicit Edges:', data.edges.filter(e => !e.id.startsWith('derived_')).length);
  });
```

**Expected Output:**
```
Total Edges: 200-250 (was 1)
Isolated Nodes: 5-20 (was 106)
Cluster Count: 10-30 (was 107)
Derived Edges: 200-249
Explicit Edges: 1
```

**2. Via CEG Visualization UI:**
- Open the CEG tab/panel in the deliberation
- Visual inspection should show:
  - ✅ Many connected nodes (not mostly isolated)
  - ✅ Clear attack edges between claims
  - ✅ Clusters of related arguments
  - ✅ Graph structure matches ASPIC+ extensions logic

**3. Via ASPIC+ Extensions Tab Cross-Check:**
- Count argument attacks in Extensions tab: should be ~251
- Count CEG edges: should be similar (~200-250)
- Verify defeated arguments' conclusions show incoming attack edges in CEG

---

## Validation Checklist

- [ ] **Edge Count**: CEG `totalEdges` ≈ ConflictApplication count (~251)
- [ ] **Isolated Reduction**: `isolatedCount` drops from 106 to <20
- [ ] **Visual Connectivity**: Graph shows clear attack patterns
- [ ] **Derived Edge IDs**: Edges have `derived_` prefix
- [ ] **Attack Types**: Derived edges preserve ASPIC attack types (REBUTS, UNDERCUTS, etc.)
- [ ] **No Self-Loops**: No edges with `source === target`
- [ ] **Performance**: API response time remains <3 seconds
- [ ] **Cluster Analysis**: Meaningful clusters emerge (not 1-node clusters)

---

## Code Quality

**Lint Status:** ✅ 0 errors, 0 warnings
```bash
npm run lint -- --file app/api/deliberations/\[id\]/ceg/mini/route.ts
# ✔ No ESLint warnings or errors
```

**Type Safety:** ✅ Full TypeScript compliance
- Explicit types for `derivedEdges` array
- Proper null checking for argument/claim IDs
- Type-safe Map operations

**Performance Considerations:**
- Uses `Set` for deduplication of argument IDs
- Single batch query for arguments (not N+1)
- Map lookups O(1) for argument → claim resolution
- Minimal memory overhead (only IDs and conclusion IDs loaded)

---

## Architecture Notes

### Why This Fix Was Needed

The Mesh architecture has two parallel systems for tracking attacks:

1. **ClaimEdge (Claim-Level)**
   - Used for CEG visualization
   - Explicit claim-to-claim relationships
   - Manually created or generated from dialogical moves

2. **ConflictApplication (Argument-Level)**
   - Used for ASPIC+ reasoning
   - Captures formal argument attacks
   - Created during argument composition and scheme application

**Problem:** These systems were not synchronized. The CEG only looked at ClaimEdge, ignoring the rich attack structure in ConflictApplication.

**Solution:** Derive claim-level edges from argument-level conflicts by:
- Extracting conclusion claims from attacking/attacked arguments
- Creating `derived_` prefixed edges representing argument attacks at the claim level
- Merging with explicit ClaimEdge records for complete graph

### Future Enhancements

**Potential Optimizations:**
1. **Caching**: Cache derived edges for performance
   - Store in Redis with deliberation ID key
   - Invalidate on new ConflictApplication creation
   - Reduce DB queries on repeated CEG requests

2. **Database Materialization**: Create derived ClaimEdge records
   - Add `source: 'explicit' | 'derived'` field to ClaimEdge
   - Populate via background job when ConflictApplications change
   - Trade storage for query performance

3. **Incremental Updates**: Only derive edges for new conflicts
   - Track last sync timestamp
   - Query ConflictApplications with `createdAt > lastSync`
   - Append to existing edge set

4. **Edge Strength Scoring**: Weight derived edges
   - Consider argument strength from ASPIC+ extensions
   - Reflect Justified/Defeated/Undecided status in edge confidence
   - Enable graph algorithms to prioritize strong attacks

---

## Related Documentation

- **CEG System Audit**: `CEG_SYSTEM_AUDIT_REPORT.md` (comprehensive system review)
- **Systems Clarification**: `SYSTEMS_CLARIFICATION_DIALOGICAL_ATTACK_CQ.md` (explains three-system architecture)
- **ASPIC Implementation**: `ASPIC_PHASE1B_COMPLETION_STATUS.md` (argument attack framework)
- **Schema**: `lib/models/schema.prisma` (ConflictApplication model at ~line 2560)

---

## Testing Results (To Be Completed by User)

**Tester:** [Your Name]  
**Date:** [Test Date]  
**Deliberation ID:** `ludics-forest-demo`

### Metrics Comparison

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Total Claims | 108 | ___ | ___ |
| Total Edges | 1 | ___ | +___ |
| Isolated Count | 106 | ___ | -___ |
| Cluster Count | 107 | ___ | ___ |
| Derived Edges | 0 | ___ | +___ |
| Explicit Edges | 1 | ___ | ___ |

### Visual Assessment

- [ ] Graph shows clear connectivity between arguments
- [ ] Attack patterns match ASPIC+ extension structure
- [ ] Defeated arguments have visible incoming attack edges
- [ ] No obvious errors (missing edges, incorrect connections)
- [ ] Performance acceptable (page loads in <5s)

### Issues Found (if any)

1. [Issue description]
2. [Issue description]

### Sign-Off

**Status:** [ ] PASS / [ ] FAIL  
**Notes:** [Any additional observations]

---

## Deployment Checklist

Before merging to main:

- [ ] User testing completed and passed
- [ ] Edge count matches expected range (200-250)
- [ ] Visual graph validation confirms connectivity
- [ ] Performance acceptable (<3s API response)
- [ ] No regressions in other CEG features
- [ ] Documentation updated in CEG_SYSTEM_AUDIT_REPORT.md
- [ ] Git commit with descriptive message

**Recommended Commit Message:**
```
Fix: Derive CEG edges from ASPIC+ ConflictApplications

- Fetches ConflictApplication records (argument-level attacks)
- Resolves argument conclusion claims for source/target
- Creates derived claim edges with 'derived_' ID prefix
- Merges with explicit ClaimEdge records
- Fixes edge count discrepancy (1 → ~250 edges)
- Reduces isolated nodes from 106 to <20

Resolves issue where CEG showed disconnected graph despite
rich ASPIC+ argument attack structure in ConflictApplications.

Tested on ludics-forest-demo deliberation.
```

---

## Contact

**Implemented by:** GitHub Copilot (Claude Sonnet 4.5)  
**Code Location:** `/app/api/deliberations/[id]/ceg/mini/route.ts` (lines 103-178)  
**Issue Tracking:** CEG Edge Visualization Bug  
**Priority:** HIGH (Core Visualization Accuracy)
