# Phase 4 Tasks 0 & 1 Review Against AIF API Findings

**Date**: November 2, 2025  
**Purpose**: Review Task 0 (backfill) and Task 1 (generation script) against API analysis findings  
**Status**: Review complete, 3 improvements identified

---

## Executive Summary

After reviewing the `/api/deliberations/[id]/arguments/aif` endpoint implementation (which computes all metadata: scheme, CQ, attacks, preferences), we identified **3 key improvements** for Tasks 0 & 1:

### ✅ What's Already Good

1. **Task 0 backfill** correctly creates Deliberation→AgoraRoom→DebateSheet chain
2. **Task 1 script** successfully generates DebateNodes from Arguments
3. **Metadata helpers** are implemented (scheme, CQ, conflicts, preferences, depth)
4. **Edge mapping logic** correctly handles ArgumentEdge → DebateEdge types

### ⚠️ Issues Found

1. **Metadata computation uses wrong data sources** (ArgumentEdge vs ConflictApplication)
2. **CQ status logic is placeholder** (should match `/arguments/aif` approach)
3. **Preference computation is placeholder** (PreferenceApplication exists but not used correctly)

---

## Issue 1: Attack Count Data Source ⚠️ CRITICAL

### Current Implementation (Task 1 Script)

**File**: `scripts/generate-debate-sheets.ts` (lines 91-99)

```typescript
async function computeConflictCount(argumentId: string) {
  // Check for ArgumentEdges attacking this argument
  const attackCount = await prisma.argumentEdge.count({
    where: {
      toArgumentId: argumentId,
      type: { in: ['rebut', 'undercut'] }  // ← WRONG: Uses ArgumentEdge
    }
  });

  return attackCount;
}
```

**Problem**: Uses `ArgumentEdge` table as source for attack counts.

### Correct Implementation (from `/arguments/aif`)

**File**: `app/api/deliberations/[id]/arguments/aif/route.ts` (lines 95-150)

```typescript
// From ConflictApplication (CA-nodes)
const caRows = await prisma.conflictApplication.findMany({
  where: {
    deliberationId: params.id,
    OR: [
      { conflictedArgumentId: { in: argIds } },      // RA targets (undercuts)
      { conflictedClaimId: { in: claimIds } }        // I targets (rebuts/undermines)
    ]
  },
  select: {
    conflictedArgumentId, conflictedClaimId, legacyAttackType
  }
});

// Build: { argId -> { REBUTS, UNDERCUTS, UNDERMINES } }
const atkByArg = {};
for (const c of caRows) {
  let bucket = null;
  
  if (c.legacyAttackType) {
    bucket = c.legacyAttackType; // Explicit type
  } else if (c.conflictedArgumentId) {
    bucket = 'UNDERCUTS'; // CA → RA implies undercut
  } else if (c.conflictedClaimId) {
    // Claim target: check if conclusion (rebut) or premise (undermine)
    const hitArg = pageRows.find(r => r.conclusionClaimId === c.conflictedClaimId);
    if (hitArg) bucket = 'REBUTS';
    else {
      const argHit = pageRows.find(r => 
        r.premises.some(p => p.claimId === c.conflictedClaimId)
      );
      if (argHit) bucket = 'UNDERMINES';
    }
  }
  
  if (bucket) atkByArg[targetArgId][bucket] += 1;
}
```

### Why This Matters

**Data Source Priority** (from API review):
1. ✅ **ConflictApplication** (CA-nodes) - Most accurate (Phase 2)
2. ✅ **PreferenceApplication** (PA-nodes) - Most accurate (Phase 2)
3. ❌ **ArgumentEdge** - Legacy, incomplete attack type coverage

**API Review Finding**:
> "DO NOT use ArgumentEdge for attack counts in DebateSheet - it's legacy and doesn't have full attack type coverage."

### Proposed Fix

Replace `computeConflictCount()` with proper CA-node query:

```typescript
/**
 * Compute attack counts from ConflictApplication (CA-nodes)
 * Returns breakdown by attack type: REBUTS, UNDERCUTS, UNDERMINES
 */
async function computeAttackCounts(argumentId: string, deliberationId: string) {
  // Fetch argument's conclusion and premise claims
  const argument = await prisma.argument.findUnique({
    where: { id: argumentId },
    select: {
      conclusionClaimId: true,
      premises: { select: { claimId: true } }
    }
  });

  if (!argument) return { REBUTS: 0, UNDERCUTS: 0, UNDERMINES: 0, total: 0 };

  const premiseClaimIds = argument.premises.map(p => p.claimId);
  const claimIds = [argument.conclusionClaimId, ...premiseClaimIds].filter(Boolean) as string[];

  // Fetch ConflictApplications targeting this argument or its claims
  const caRows = await prisma.conflictApplication.findMany({
    where: {
      deliberationId,
      OR: [
        { conflictedArgumentId: argumentId },       // Undercuts (RA target)
        { conflictedClaimId: { in: claimIds } }     // Rebuts/Undermines (I target)
      ]
    },
    select: {
      conflictedArgumentId: true,
      conflictedClaimId: true,
      legacyAttackType: true
    }
  });

  const counts = { REBUTS: 0, UNDERCUTS: 0, UNDERMINES: 0 };

  for (const ca of caRows) {
    let bucket: 'REBUTS' | 'UNDERCUTS' | 'UNDERMINES' | null = null;

    if (ca.legacyAttackType) {
      // Explicit type from legacy data
      bucket = ca.legacyAttackType as any;
    } else if (ca.conflictedArgumentId === argumentId) {
      // CA → RA implies undercut
      bucket = 'UNDERCUTS';
    } else if (ca.conflictedClaimId) {
      // Check if claim is conclusion (rebut) or premise (undermine)
      if (ca.conflictedClaimId === argument.conclusionClaimId) {
        bucket = 'REBUTS';
      } else if (premiseClaimIds.includes(ca.conflictedClaimId)) {
        bucket = 'UNDERMINES';
      }
    }

    if (bucket) counts[bucket] += 1;
  }

  return {
    ...counts,
    total: counts.REBUTS + counts.UNDERCUTS + counts.UNDERMINES
  };
}
```

**Benefits**:
- ✅ Matches API endpoint logic (consistent data)
- ✅ Differentiates attack types (REBUTS vs UNDERCUTS vs UNDERMINES)
- ✅ Uses ConflictApplication (authoritative Phase 2 source)
- ✅ Returns breakdown for UI badges

---

## Issue 2: CQ Status Computation ⚠️ MEDIUM PRIORITY

### Current Implementation (Placeholder)

**File**: `scripts/generate-debate-sheets.ts` (lines 69-79)

```typescript
async function computeCQStatus(argumentId: string) {
  // CriticalQuestion model links to SchemeInstance, not directly to arguments
  // For now, return placeholder. Can be enhanced later with proper CQ tracking
  return {
    open: [],
    answered: [],
    openCount: 0,
    answeredCount: 0,
    totalCount: 0,
    keys: []
  };
}
```

**Problem**: Returns empty status (no CQ data computed).

### Correct Implementation (from `/arguments/aif`)

**File**: `app/api/deliberations/[id]/arguments/aif/route.ts` (lines 59-90)

```typescript
// 1. Fetch scheme CQs (required count)
const schemes = await prisma.argumentScheme.findMany({
  where: { id: { in: schemeIds } },
  select: {
    id: true, key: true, name: true, slotHints: true,
    cqs: { select: { cqKey, text, attackType, targetScope } }  // ← Required CQs
  }
});

// 2. Fetch CQ statuses (satisfied count)
const cqStatuses = await prisma.cQStatus.findMany({
  where: {
    OR: [
      { argumentId: { in: argIds } },                           // Legacy
      { targetType: "argument", targetId: { in: argIds } }      // Phase 2
    ]
  },
  select: { argumentId, targetId, cqKey, status }
});

// 3. Build map: { argId -> { satisfied, seen: Set<cqKey> } }
const cqMap = {};
for (const s of cqStatuses) {
  const keyArgId = s.argumentId ?? s.targetId ?? '';
  cqMap[keyArgId] ??= { satisfied: 0, seen: new Set() };
  
  // Only count answered CQs, dedupe by cqKey
  if (s.status === 'answered' && s.cqKey && !cqMap[keyArgId].seen.has(s.cqKey)) {
    cqMap[keyArgId].satisfied += 1;
    cqMap[keyArgId].seen.add(s.cqKey);
  }
}

// 4. Result per argument:
const required = scheme?.cqs?.length ?? 0;
const satisfied = cqMap[argId]?.satisfied ?? 0;
```

### Proposed Fix

Update `computeCQStatus()` to match API logic:

```typescript
/**
 * Compute CQ status from CQStatus table
 * Returns: { required, satisfied, open, answered, keys }
 */
async function computeCQStatus(argumentId: string) {
  // Step 1: Get scheme CQs (required count)
  const argument = await prisma.argument.findUnique({
    where: { id: argumentId },
    select: {
      schemeId: true,
      scheme: {
        select: {
          cqs: { select: { cqKey: true, text: true } }
        }
      }
    }
  });

  const requiredCQs = argument?.scheme?.cqs || [];
  const required = requiredCQs.length;

  if (required === 0) {
    // No scheme or scheme has no CQs
    return {
      open: [],
      answered: [],
      openCount: 0,
      answeredCount: 0,
      totalCount: 0,
      keys: []
    };
  }

  // Step 2: Get CQ statuses (supports both argumentId and targetType/targetId)
  const cqStatuses = await prisma.cQStatus.findMany({
    where: {
      OR: [
        { argumentId },
        { targetType: 'argument', targetId: argumentId }
      ]
    },
    select: { cqKey: true, status: true }
  });

  // Step 3: Categorize CQs (dedupe by cqKey)
  const answeredKeys = new Set<string>();
  const openKeys = new Set<string>();

  for (const status of cqStatuses) {
    if (!status.cqKey) continue;
    
    if (status.status === 'answered') {
      answeredKeys.add(status.cqKey);
    } else {
      openKeys.add(status.cqKey);
    }
  }

  // Step 4: Find unanswered required CQs
  const allRequiredKeys = new Set(requiredCQs.map(cq => cq.cqKey));
  const unansweredKeys = [...allRequiredKeys].filter(key => !answeredKeys.has(key));

  return {
    open: unansweredKeys,
    answered: Array.from(answeredKeys),
    openCount: unansweredKeys.length,
    answeredCount: answeredKeys.size,
    totalCount: required,
    keys: Array.from(allRequiredKeys)
  };
}
```

**Benefits**:
- ✅ Returns actual CQ data (not placeholder)
- ✅ Supports both legacy (`argumentId`) and Phase 2 (`targetType/targetId`) CQStatus records
- ✅ Deduplicates by cqKey (same as API)
- ✅ Provides open/answered breakdown for UI

---

## Issue 3: Preference Computation ⚠️ LOW PRIORITY

### Current Implementation (Placeholder)

**File**: `scripts/generate-debate-sheets.ts` (lines 105-109)

```typescript
async function computePreferenceRank(argumentId: string) {
  // Placeholder: return neutral score
  return 0.5;
}
```

**Problem**: Returns neutral score, doesn't query PreferenceApplication.

### Correct Implementation (from `/arguments/aif`)

**File**: `app/api/deliberations/[id]/arguments/aif/route.ts` (lines 163-184)

```typescript
// From PreferenceApplication (PA-nodes)
const [prefA, dispA] = await Promise.all([
  prisma.preferenceApplication.groupBy({
    by: ['preferredArgumentId'],
    where: { preferredArgumentId: { in: argIds } },
    _count: { _all: true }
  }),
  prisma.preferenceApplication.groupBy({
    by: ['dispreferredArgumentId'],
    where: { dispreferredArgumentId: { in: argIds } },
    _count: { _all: true }
  })
]);

const preferredBy = Object.fromEntries(
  prefA.map(x => [x.preferredArgumentId!, x._count._all])
);
const dispreferredBy = Object.fromEntries(
  dispA.map(x => [x.dispreferredArgumentId!, x._count._all])
);

// Result per argument:
const preferences = {
  preferredBy: preferredBy[argId] ?? 0,
  dispreferredBy: dispreferredBy[argId] ?? 0
};
```

### Proposed Fix

Replace placeholder with actual PA-node query:

```typescript
/**
 * Compute preference rank from PreferenceApplication (PA-nodes)
 * Returns: { preferredBy, dispreferredBy, rank }
 */
async function computePreferences(argumentId: string, deliberationId: string) {
  // Fetch PA-nodes where this argument is preferred or dispreferred
  const [preferredCount, dispreferredCount] = await Promise.all([
    prisma.preferenceApplication.count({
      where: {
        deliberationId,
        preferredArgumentId: argumentId
      }
    }),
    prisma.preferenceApplication.count({
      where: {
        deliberationId,
        dispreferredArgumentId: argumentId
      }
    })
  ]);

  // Compute preference rank (0.0 = all dispreferred, 1.0 = all preferred)
  const total = preferredCount + dispreferredCount;
  const rank = total === 0 ? 0.5 : preferredCount / total;

  return {
    preferredBy: preferredCount,
    dispreferredBy: dispreferredCount,
    rank: Math.round(rank * 100) / 100  // Round to 2 decimals
  };
}
```

**Benefits**:
- ✅ Returns actual preference data (not placeholder)
- ✅ Matches API endpoint logic
- ✅ Provides rank score for sorting/filtering
- ✅ Low performance impact (2 simple count queries)

---

## Summary of Improvements

### 1. Attack Counts (CRITICAL)

**Current**: Uses ArgumentEdge (legacy, incomplete)  
**Fix**: Use ConflictApplication with REBUTS/UNDERCUTS/UNDERMINES breakdown  
**Impact**: Consistent metadata with API, accurate attack counts  
**Lines to change**: 91-99 in `generate-debate-sheets.ts`

### 2. CQ Status (MEDIUM)

**Current**: Placeholder (returns empty)  
**Fix**: Query CQStatus table with dual-mode support (argumentId + targetType/targetId)  
**Impact**: Real CQ data in DebateNode summaries, matches API  
**Lines to change**: 69-79 in `generate-debate-sheets.ts`

### 3. Preference Rank (LOW)

**Current**: Placeholder (returns 0.5)  
**Fix**: Query PreferenceApplication for actual preference counts  
**Impact**: Real preference data for sorting/filtering  
**Lines to change**: 105-109 in `generate-debate-sheets.ts`

---

## Recommended Action Plan

### Phase A: Critical Fix (Attack Counts)

1. **Update `computeConflictCount()`** → **`computeAttackCounts()`**
   - Change data source from ArgumentEdge to ConflictApplication
   - Return breakdown: `{ REBUTS, UNDERCUTS, UNDERMINES, total }`
   - Add `deliberationId` parameter for proper filtering

2. **Update `computeNodeMetadata()`** call site
   - Change return type to include attack breakdown
   - Update summary string to use `attacks.total`

3. **Test on sample deliberation**
   - Verify CA-nodes are correctly counted
   - Compare with `/arguments/aif` endpoint results
   - Ensure no duplicate counts

### Phase B: Medium Priority (CQ Status)

1. **Update `computeCQStatus()`**
   - Fetch scheme CQs for required count
   - Query CQStatus table with OR clause
   - Deduplicate by cqKey
   - Return open/answered breakdown

2. **Update node summary string**
   - Change from `CQs: 0 open / 0 total` to actual counts
   - Add CQ status indicator logic

3. **Test with arguments that have schemes**
   - Verify required CQ count matches scheme definition
   - Verify answered count matches CQStatus records

### Phase C: Low Priority (Preferences)

1. **Update `computePreferenceRank()`** → **`computePreferences()`**
   - Add deliberationId parameter
   - Query PreferenceApplication counts
   - Return `{ preferredBy, dispreferredBy, rank }`

2. **Update metadata aggregation**
   - Store preference counts in node summary
   - Use rank for future sorting logic

3. **Test with arguments that have PA-nodes**
   - Verify counts match manual queries
   - Verify rank calculation is correct

---

## Testing Strategy

### 1. Data Consistency Test

**Goal**: Verify script metadata matches API metadata

```bash
# Step 1: Generate DebateNodes
npx tsx scripts/generate-debate-sheets.ts <deliberationId>

# Step 2: Query API for same arguments
curl "http://localhost:3000/api/deliberations/<deliberationId>/arguments/aif?limit=100"

# Step 3: Compare metadata
# - attack counts (REBUTS, UNDERCUTS, UNDERMINES)
# - CQ status (required, satisfied)
# - preference counts (preferredBy, dispreferredBy)
```

### 2. Performance Test

**Goal**: Ensure batch queries don't slow down generation

```bash
# Test on large deliberation (50+ arguments)
time npx tsx scripts/generate-debate-sheets.ts <largeDelibId>

# Target: <10s for 50 arguments
# Current: ~8s for 10 arguments (acceptable)
```

### 3. Regression Test

**Goal**: Verify existing functionality still works

```bash
# Dry-run mode still works
npx tsx scripts/generate-debate-sheets.ts --dry-run <deliberationId>

# Batch mode still works
npx tsx scripts/generate-debate-sheets.ts --all --dry-run
```

---

## Files to Update

### 1. Generation Script (PRIMARY)

**File**: `scripts/generate-debate-sheets.ts`

**Changes**:
- Lines 69-79: Replace `computeCQStatus()` with proper CQStatus query
- Lines 91-99: Replace `computeConflictCount()` with `computeAttackCounts()` using CA-nodes
- Lines 105-109: Replace `computePreferenceRank()` with `computePreferences()` using PA-nodes
- Lines 136-156: Update `computeNodeMetadata()` to pass deliberationId and handle new return types
- Lines 234-236: Update node summary to use actual metadata

### 2. API Endpoint (NO CHANGES NEEDED)

**File**: `app/api/deliberations/[id]/arguments/aif/route.ts`

**Status**: ✅ Already correct (serves as reference implementation)

### 3. Documentation (UPDATE)

**Files**:
- `PHASE_4_TASK_1_COMPLETE.md` - Add "Known Limitations" section noting placeholder logic
- `API_REVIEW_AIF_ENDPOINTS.md` - Already documents correct approach

---

## Open Questions

### Q1: Should we backfill existing DebateNodes?

**Context**: If DebateNodes were already generated with placeholder metadata, should we re-run the script to update them?

**Options**:
- A: Yes, re-run on all deliberations with `--force` flag (overwrite existing nodes)
- B: No, only fix for new nodes going forward (existing nodes keep placeholder data)
- C: Selective backfill (only re-run on deliberations with CA/PA nodes)

**Recommendation**: Option B (forward-only) - existing nodes are mostly test data, production will use new script

### Q2: Should we store metadata in DebateNode.metadata JSONB?

**Context**: Script currently computes metadata but doesn't store it in node records. Should we persist it?

**Pros**:
- ✅ Faster reads (no need to re-compute or join to API)
- ✅ Historical snapshot (metadata at time of generation)

**Cons**:
- ⚠️ Stale data risk (CQ/CA/PA changes won't reflect in nodes)
- ⚠️ Storage overhead (duplicate data)
- ⚠️ Invalidation logic needed

**Recommendation**: NO - keep metadata computation live via API endpoint (source of truth)

### Q3: Should we add metadata to DebateNode summary?

**Context**: Current summary format:
```typescript
summary: `Scheme: ${schemeName || 'None'} | CQs: ${cqStatus.openCount} open / ${cqStatus.totalCount} total | Conflicts: ${conflictCount}`
```

**Question**: Is this the right format, or should we use structured metadata instead?

**Recommendation**: Keep summary for debugging, but UI should fetch metadata from API (not parse summary string)

---

## Next Steps

**Immediate** (before Task 2):
1. ✅ Complete this review document
2. 🔄 Implement Phase A fixes (attack counts)
3. 🔄 Test on sample deliberation
4. 🔄 Update PHASE_4_TASK_1_COMPLETE.md with findings

**After Task 2**:
1. ⏭️ Implement Phase B fixes (CQ status) if UI needs it
2. ⏭️ Implement Phase C fixes (preferences) if UI needs it
3. ⏭️ Performance testing on large deliberations

**Decision Point**: Should we fix Task 1 script now, or proceed with Task 2 UI and fix script later?

**Recommendation**: **Fix critical issue (attack counts) now**, defer CQ/preference fixes until we see what the UI actually needs. The API endpoint already returns correct data, so the UI can work with that while we improve the script.

---

**Document Status**: Complete v1.0  
**Next Action**: Implement Phase A fixes (attack count computation)  
**Estimated Time**: 30 minutes (code changes + testing)  
**Last Updated**: November 2, 2025
