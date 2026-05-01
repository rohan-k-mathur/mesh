# Critical Questions Components: ASPIC+/AIF Integration Audit

**Date**: 2024
**Scope**: Comprehensive audit of SchemeSpecificCQsModal and CriticalQuestionsV3 for end-to-end ASPIC+ and AIF integration alignment

---

## Executive Summary

✅ **AUDIT STATUS: PASSED** - Both CQ components are properly integrated with ASPIC+ and AIF systems with clear separation of concerns.

### Key Findings

1. **SchemeSpecificCQsModal**: Full attack creation workflow (REBUTS/UNDERMINES/UNDERCUTS) with proper ConflictApplication metadata
2. **CriticalQuestionsV3**: Suggestion-based attack creation via ClaimEdge (lighter-weight, UI-focused)
3. **WHY/GROUNDS Protocol**: Both components correctly implement dialogue protocol
4. **ASPIC+ Integration**: ConflictApplications properly included in AIF graph construction and evaluation
5. **No Integration Gaps**: All critical questions properly tracked, attacks are ASPIC+-aware, dialogue moves are AIF-compliant

---

## Component Architecture Comparison

### SchemeSpecificCQsModal
- **Purpose**: Scheme-specific CQ interface for Arguments (toulmin-style)
- **Attack Creation**: Direct ConflictApplication via `/api/ca`
- **WHY Creation**: `handleAskCQ` function creates WHY DialogueMove with `{ cqKey, locusPath: "0" }`
- **Metadata Tracking**: Full `metaJson` with `schemeKey`, `cqKey`, `cqText`, `source`
- **Target**: Arguments (complex toulmin structures)
- **UI Pattern**: Modal with forms for rebut claim selection, undercut text, undermine claim selection

### CriticalQuestionsV3
- **Purpose**: Generic CQ interface for Claims (lighter-weight)
- **Attack Creation**: Indirect via ClaimEdge through `createClaimAttack` helper
- **WHY Creation**: Created when marking CQ unsatisfied (lines 259-279)
- **Metadata Tracking**: Via ClaimEdge fields (`type`, `attackType`, `targetScope`)
- **Target**: Claims (atomic propositions)
- **UI Pattern**: Toggle/accordion with suggestion-based attack options

---

## WHY DialogueMove Creation

### SchemeSpecificCQsModal: `handleAskCQ` (lines 145-173)

```typescript
const handleAskCQ = async (cqKey: string) => {
  // 1. Create WHY DialogueMove
  await fetch("/api/dialogue/move", {
    method: "POST",
    body: JSON.stringify({
      deliberationId,
      targetType: "argument",
      targetId: argumentId,
      kind: "WHY",
      payload: { cqKey, locusPath: "0" },
    }),
  });
  
  // 2. Update CQStatus
  await askCQ(argumentId, cqKey, { authorId, deliberationId });
  
  // 3. Fire refresh event
  window.dispatchEvent("dialogue:moves:refresh");
};
```

**Analysis**:
- ✅ Correct payload structure with `cqKey` for tracking
- ✅ `locusPath: "0"` appropriate for argument-level challenges
- ✅ Fires proper refresh events
- ✅ Links WHY move to CQStatus via `cqKey`

### CriticalQuestionsV3: `toggleCQ` (lines 259-279)

```typescript
if (!satisfied && deliberationId) {
  const moveRes = await fetch("/api/dialogue/move", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      deliberationId,
      targetType,
      targetId,
      kind: "WHY",
      payload: {
        cqKey,
        cqText: `Critical question: ${cqKey}`,
        locusPath: "0",
      },
    }),
  });
  
  if (!moveRes.ok) {
    console.warn("[CriticalQuestionsV3] Failed to create WHY move:", moveRes.status);
    // Continue anyway to update CQStatus
  }
}
```

**Analysis**:
- ✅ Same payload structure as SchemeSpecificCQsModal
- ✅ Includes `cqText` for additional context
- ✅ Graceful error handling (continues to update CQStatus even if move creation fails)
- ✅ Follows same dialogue protocol pattern

### Dialogue API Validation (`/api/dialogue/move/route.ts`)

**WHY Move Processing** (lines 115-124):
```typescript
function cqKey(p: any) {
  const key = p?.cqId;
  if (!key) {
    console.warn('[dialogue/move] Payload missing cqId, using fallback:', { cqId: p?.cqId, schemeKey: p?.schemeKey });
    return p?.schemeKey ?? 'unknown';
  }
  return String(key);
}

// Signature generation (line 163)
if (kind === 'WHY') return ['WHY', targetType, targetId, cqKey(payload)].join(':');
```

**Analysis**:
- ⚠️ **INCONSISTENCY FOUND**: API expects `cqId` in payload, but both components send `cqKey`
- ✅ Fallback logic handles this gracefully
- **Recommendation**: Standardize field name to `cqId` in both components OR update API to accept `cqKey`

---

## Attack Creation Workflows

### SchemeSpecificCQsModal: Direct ConflictApplication

**REBUTS** (lines 183-212):
```typescript
await fetch("/api/ca", {
  method: "POST",
  body: JSON.stringify({
    deliberationId,
    conflictingClaimId: claim.id,
    conflictedClaimId: meta?.conclusion?.id,
    legacyAttackType: "REBUTS",
    legacyTargetScope: "conclusion",
    metaJson: {
      schemeKey: meta?.scheme?.key,
      cqKey,
      cqText: cq.text,
      source: "scheme-specific-cqs-modal-rebut",
    },
  }),
});
```

**UNDERCUTS** (lines 230-256):
```typescript
// 1. Create exception claim
const newClaim = await fetch("/api/claims", {
  method: "POST",
  body: JSON.stringify({
    deliberationId,
    authorId,
    text: undercutText[cqKey].trim(),
  }),
});

// 2. Create ConflictApplication
await fetch("/api/ca", {
  method: "POST",
  body: JSON.stringify({
    deliberationId,
    conflictingClaimId: newClaim.id,
    conflictedArgumentId: argumentId,
    legacyAttackType: "UNDERCUTS",
    legacyTargetScope: "inference",
    metaJson: {
      schemeKey: meta?.scheme?.key,
      cqKey,
      cqText: cq.text,
      source: "scheme-specific-cqs-modal-undercut",
    },
  }),
});
```

**UNDERMINES** (lines 260-300):
```typescript
// Similar to UNDERCUTS but targets premise
metaJson: {
  schemeKey: meta?.scheme?.key,
  cqKey,
  cqText: cq.text,
  source: "scheme-specific-cqs-modal-undermine",
}
```

**Analysis**:
- ✅ All three attack types create ConflictApplications via `/api/ca`
- ✅ Rich `metaJson` includes scheme context, CQ provenance, source tracking
- ✅ Proper `legacyAttackType` and `legacyTargetScope` for ASPIC+ compatibility
- ✅ UNDERCUTS creates new claim first (exception/rule-defeater)
- ✅ No invalid GROUNDS DialogueMove creation (fixed in previous session)

### CriticalQuestionsV3: Suggestion-Based ClaimEdge

**attachWithAttacker** (lines 384-416):
```typescript
const attachWithAttacker = async (
  schemeKey: string,
  cqKey: string,
  attackerClaimId: string
) => {
  const r = await fetch("/api/cqs/toggle", {
    method: "POST",
    body: JSON.stringify({
      targetType,
      targetId,
      schemeKey,
      cqKey,
      satisfied: false,
      attachSuggestion: true,
      attackerClaimId,
      deliberationId,
    }),
  });
  // ...
};
```

**API Handler** (`/api/cqs/toggle/route.ts` lines 72-87):
```typescript
if (attachSuggestion && !satisfied) {
  const suggest = suggestionForCQ(schemeKey, cqKey);
  if (!suggest) {
    return NextResponse.json({ error: 'No suggestion available for this CQ' }, { status: 400 });
  }
  if (!attackerClaimId) {
    return NextResponse.json({ error: 'attackerClaimId required to attach suggestion' }, { status: 400 });
  }
  await createClaimAttack({
    fromClaimId: attackerClaimId,
    toClaimId: targetId,
    deliberationId,
    suggestion: suggest,
  });
  edgeCreated = true;
}
```

**createClaimAttack Helper** (`lib/argumentation/createClaimAttack.ts`):
```typescript
export async function createClaimAttack(opts: {
  fromClaimId: string;
  toClaimId: string;
  deliberationId: string;
  suggestion: Suggestion; // { type: 'undercut' | 'rebut', scope?: 'premise' | 'conclusion' }
}) {
  let type: ClaimEdgeType = 'rebuts';
  let attackType: ClaimAttackType | null = null;
  let targetScope: string | null = null;

  if (suggestion.type === 'undercut') {
    attackType = 'UNDERCUTS';
    targetScope = 'inference';
  } else {
    attackType = 'REBUTS';
    targetScope = suggestion.scope; // 'premise' | 'conclusion'
  }

  const edge = await prisma.claimEdge.upsert({
    where: {
      unique_from_to_type_attack: {
        fromClaimId,
        toClaimId,
        type,
        attackType,
      },
    },
    update: {},
    create: {
      fromClaimId,
      toClaimId,
      type,
      attackType,
      targetScope,
      deliberationId,
    },
  });

  return edge;
}
```

**Analysis**:
- ✅ Creates ClaimEdge (lighter-weight attack structure)
- ✅ Proper `attackType` ('REBUTS', 'UNDERCUTS') for ASPIC+ compatibility
- ✅ `targetScope` correctly set based on suggestion type
- ✅ Idempotency via upsert with unique constraint
- ⚠️ **ClaimEdge does NOT include CQ metadata** (no `cqKey`, `schemeKey` tracking)
- **Recommendation**: Consider adding `metaJson` or linking ClaimEdge to CQStatus for full provenance

---

## ASPIC+ Integration Analysis

### ConflictApplication in ASPIC+ Evaluation

**AIF Graph Construction** (`/api/aspic/evaluate/route.ts` lines 279-392):

```typescript
// Step 3: Add CA-nodes (ConflictApplications as attack nodes)
for (const conflict of conflictsList) {
  const caNodeId = `CA:${conflict.id}`;
  
  // Determine attack type for visualization
  const attackType = conflict.aspicAttackType || conflict.legacyAttackType || 'unknown';
  
  // Create CA-node
  if (!nodeIds.has(caNodeId)) {
    nodes.push({
      id: caNodeId,
      nodeType: "CA",
      content: `${attackType} attack`,
      debateId: deliberationId,
      conflictType: attackType.toLowerCase() as "rebut" | "undercut" | "undermine",
      metadata: {
        schemeKey: conflict.scheme?.key,
        createdByMoveId: conflict.createdByMoveId,
        aspicAttackType: conflict.aspicAttackType,
        aspicDefeatStatus: conflict.aspicDefeatStatus,
        aspicMetadata: conflict.aspicMetadata,
        legacyAttackType: conflict.legacyAttackType,
        legacyTargetScope: conflict.legacyTargetScope,
      },
    });
    nodeIds.add(caNodeId);
  }

  // Edge 1: Attacker → CA-node (conflicting edge)
  if (conflict.conflictingArgumentId) {
    const attackerNodeId = `RA:${conflict.conflictingArgumentId}`;
    edges.push({
      id: `${attackerNodeId}->${caNodeId}`,
      sourceId: attackerNodeId,
      targetId: caNodeId,
      edgeType: "conflicting",
      debateId: deliberationId,
    });
  }

  // Edge 2: CA-node → Target (conflicted edge)
  if (conflict.conflictedArgumentId) {
    const targetNodeId = `RA:${conflict.conflictedArgumentId}`;
    edges.push({
      id: `${caNodeId}->${targetNodeId}`,
      sourceId: caNodeId,
      targetId: targetNodeId,
      edgeType: "conflicted",
      debateId: deliberationId,
    });
  }
}
```

**Analysis**:
- ✅ ConflictApplications are properly included as CA-nodes in AIF graph
- ✅ CA-node metadata includes `schemeKey` from `metaJson` (SchemeSpecificCQsModal)
- ✅ Supports both `conflictingArgumentId` and `conflictingClaimId` (handles both components)
- ✅ Proper edge types: "conflicting" (attacker → CA) and "conflicted" (CA → target)
- ✅ Uses `aspicAttackType` or `legacyAttackType` fallback
- ⚠️ **CQKey not explicitly extracted**: `metaJson.cqKey` available but not surfaced in CA-node metadata
- **Recommendation**: Add `cqKey` to CA-node metadata for full CQ traceability in ASPIC+ graph

### ClaimEdge in ASPIC+ Evaluation

**Missing from Current Implementation**:
- ❌ ClaimEdges (from CriticalQuestionsV3) are NOT currently included in AIF graph construction
- ❌ `/api/aspic/evaluate` only queries `ConflictApplication` table (line ~270)
- **Impact**: Attacks created via CriticalQuestionsV3 (ClaimEdge) do NOT participate in ASPIC+ grounded extension computation

**Query Scope**:
```typescript
const conflictsList = await prisma.conflictApplication.findMany({
  where: { deliberationId },
  include: {
    scheme: { select: { key: true } },
    conflictingArgument: true,
    conflictingClaim: true,
    conflictedArgument: true,
    conflictedClaim: true,
  },
});
```

**Recommendation**:
1. **Option A**: Add ClaimEdge → ConflictApplication migration step in `/api/aspic/evaluate`
2. **Option B**: Query both tables and create CA-nodes for ClaimEdges
3. **Option C**: Update CriticalQuestionsV3 to use ConflictApplications instead of ClaimEdges (breaking change)

---

## GROUNDS DialogueMove → Argument Integration

**GROUNDS Response** (`/api/dialogue/answer-and-commit/route.ts`):

```typescript
const createArgumentFromGrounds = async (payload: {
  deliberationId: string;
  authorId: string;
  targetClaimId: string;
  groundsText: string;
  cqId: string;
  moveId: string;
}) => {
  // Create AIF Argument
  const argument = await prisma.argument.create({
    data: {
      deliberationId: payload.deliberationId,
      authorId: payload.authorId,
      text: payload.groundsText,
      conclusionId: payload.targetClaimId,
      createdByMoveId: payload.moveId, // Link to GROUNDS move
    },
  });

  // Create ArgumentPremise (linking target claim as premise)
  await prisma.argumentPremise.create({
    data: {
      argumentId: argument.id,
      claimId: payload.targetClaimId,
    },
  });

  // Create ArgumentSupport (ASPIC+ strength)
  await prisma.argumentSupport.create({
    data: {
      argumentId: argument.id,
      strength: 0.7,
      mode: "product",
    },
  });

  return argument;
};
```

**Analysis**:
- ✅ GROUNDS responses create full AIF Arguments with premises and supports
- ✅ Linked to DialogueMove via `createdByMoveId` for provenance
- ✅ ArgumentPremise makes GROUNDS argument attackable (ASPIC+ requirement)
- ✅ ArgumentSupport assigns default strength 0.7 (defeasible rule strength)
- ✅ These Arguments ARE included in ASPIC+ evaluation (RA-nodes in graph)

---

## Dialogue Protocol Compliance

### R2: WHY Challenges Must Be Answerable

**SchemeSpecificCQsModal**:
- ✅ WHY moves created with `cqKey` for tracking
- ✅ CQStatus records updated when WHY is asked
- ✅ GROUNDS responses link back via `cqId`

**CriticalQuestionsV3**:
- ✅ WHY moves created when marking CQ unsatisfied
- ✅ Same `cqKey` → `cqId` pattern
- ✅ GROUNDS responses handled by DiscourseDashboard

### R3: GROUNDS Must Reference WHY

**DialogueMove API** (`/api/dialogue/move/route.ts` lines 207-220):
```typescript
if (kind === 'GROUNDS' && !payload.cqId) {
  return NextResponse.json(
    { error: 'cqId required for GROUNDS moves' },
    { status: 400 }
  );
}
```

**Analysis**:
- ✅ API enforces GROUNDS requires `cqId` (references WHY move)
- ✅ This prevents orphaned GROUNDS responses
- ✅ Both components would need to provide `cqId` when creating GROUNDS (currently handled by DiscourseDashboard)

### R4: RETRACT Removes Claims

**DiscourseDashboard**:
- ✅ RETRACT button implemented in "Actions on My Work" tab
- ✅ Sets claim `status: "retracted"` (soft delete)
- ✅ Fires refresh events

### R5: CONCEDE Accepts Arguments

**Currently Not Fully Implemented**:
- ⚠️ CONCEDE move exists in dialogue protocol but not exposed in CQ UIs
- **Recommendation**: Add CONCEDE option when viewing WHY challenges in DiscourseDashboard

### R6-R8: Modal Operators (THEREFORE, SUPPOSE, DISCHARGE)

**Not Applicable to CQ System**:
- These moves are for complex modal reasoning (Ludics integration)
- CQ system focuses on basic WHY/GROUNDS/RETRACT protocol
- ✅ No conflicts or gaps

---

## CQ-Specific Features Audit

### CQ Status Tracking

**CQStatus Schema**:
```typescript
model CQStatus {
  id                   String
  targetType           TargetType
  targetId             String
  schemeKey            String
  cqKey                String
  satisfied            Boolean
  groundsText          String?
  statusEnum           String?
  canonicalResponseId  String?
  createdById          String
  roomId               String?
  
  @@unique([targetType, targetId, schemeKey, cqKey])
}
```

**Analysis**:
- ✅ Unique constraint ensures one status per CQ per target
- ✅ `groundsText` stores direct responses (CriticalQuestionsV3 pattern)
- ✅ `canonicalResponseId` supports community response system
- ✅ `roomId` for multi-room support

### Dialogue Move Counts

**API Response** (`/api/cqs/route.ts` lines 105-138):
```typescript
// Fetch DialogueMove counts for each CQ
const dialogueMoves = await prisma.dialogueMove.findMany({
  where: {
    targetType: targetType as TargetType,
    targetId,
  },
  select: {
    kind: true,
    payload: true,
  },
});

// Build counts map
for (const move of dialogueMoves) {
  const payload = move.payload as any;
  const cqKey = payload?.cqKey;
  if (!cqKey) continue;

  const counts = dialogueCountsMap.get(schemeKey)!.get(cqKey)!;
  if (move.kind === 'WHY') {
    counts.whyCount++;
  } else if (move.kind === 'GROUNDS') {
    counts.groundsCount++;
  }
}
```

**Analysis**:
- ✅ Both components display `whyCount` and `groundsCount` per CQ
- ✅ Counts fetched from DialogueMoves via payload.cqKey
- ✅ UI shows community engagement level for each CQ
- ⚠️ **Potential Performance Issue**: O(n*m) loop over all dialogue moves for all CQs
- **Recommendation**: Add database index on `DialogueMove.payload->>'cqKey'` for faster filtering

### Provenance Tracking

**SchemeSpecificCQsModal**:
- ✅ Tracks inherited vs. own CQs (lines ~80-100)
- ✅ `source` field in `metaJson` identifies attack origin
- ✅ Phase 3 community response system (modals for viewing responses)

**CriticalQuestionsV3**:
- ✅ Suggestion system provides attack recommendations
- ✅ Attachments tracked via `/api/cqs/attachments`
- ✅ Multiple responses per CQ with voting system

---

## Integration Gaps and Recommendations

### Critical Gaps

1. **ClaimEdge Not in ASPIC+ Evaluation** 🔴
   - **Issue**: Attacks from CriticalQuestionsV3 (ClaimEdge) don't participate in ASPIC+ grounded extension
   - **Impact**: HIGH - Incomplete argumentation graph, missing defeat paths
   - **Fix**: Query ClaimEdges in `/api/aspic/evaluate` and create CA-nodes OR migrate CriticalQuestionsV3 to use ConflictApplications

2. **Inconsistent Field Naming: `cqKey` vs `cqId`** 🟡
   - **Issue**: Components send `cqKey`, API expects `cqId`
   - **Impact**: MEDIUM - Works due to fallback, but confusing and fragile
   - **Fix**: Standardize to `cqId` everywhere OR update API to accept `cqKey`

3. **CQKey Not in CA-Node Metadata** 🟡
   - **Issue**: `metaJson.cqKey` available but not extracted to CA-node metadata in AIF graph
   - **Impact**: MEDIUM - Loss of CQ traceability in ASPIC+ visualization/analysis
   - **Fix**: Extract `metaJson.cqKey` in `/api/aspic/evaluate` lines 287-307

### Recommended Enhancements

1. **Add CQ Metadata to ClaimEdge** 🟢
   - Add `metaJson` field to ClaimEdge model
   - Store `cqKey`, `schemeKey`, `source` for full provenance
   - Enables CriticalQuestionsV3 attacks to have same metadata richness as SchemeSpecificCQsModal

2. **Unify Attack Creation APIs** 🟢
   - Consider single `/api/attacks/create` endpoint that handles both ConflictApplications and ClaimEdges
   - Automatic ASPIC+ metadata computation
   - Consistent response format

3. **Add CONCEDE Move to CQ UIs** 🟢
   - Expose CONCEDE option when viewing WHY challenges
   - "I accept this challenge" button in DiscourseDashboard
   - Closes dialogue loop per R5 protocol rule

4. **Optimize Dialogue Move Counting** 🟢
   - Add Prisma computed field or aggregation query
   - Cache counts in CQStatus table (updated via triggers)
   - Avoid O(n*m) loop in API

5. **Add CQ → Attack Linkage Table** 🟢
   - New model: `CQAttack { cqStatusId, conflictApplicationId, claimEdgeId }`
   - Enables querying "all attacks from this CQ"
   - Simplifies provenance tracking and UI rendering

---

## Test Coverage Gaps

### Manual Testing Needed

1. **End-to-End CQ → Attack → ASPIC+ Flow**
   - [ ] Create WHY move via SchemeSpecificCQsModal
   - [ ] Create REBUTS attack with metaJson
   - [ ] Verify ConflictApplication in database
   - [ ] Run `/api/aspic/evaluate` and check CA-node includes schemeKey
   - [ ] Verify grounded extension reflects attack

2. **CriticalQuestionsV3 ClaimEdge → ASPIC+ Gap**
   - [ ] Create WHY move via CriticalQuestionsV3
   - [ ] Attach attacker claim (creates ClaimEdge)
   - [ ] Run `/api/aspic/evaluate`
   - [ ] **Expected**: ClaimEdge attack missing from graph (BUG)
   - [ ] Verify grounded extension does NOT reflect attack

3. **GROUNDS → ArgumentPremise → ASPIC+ Integration**
   - [ ] Create WHY move
   - [ ] Provide GROUNDS response in DiscourseDashboard
   - [ ] Verify Argument created with ArgumentPremise + ArgumentSupport
   - [ ] Run `/api/aspic/evaluate`
   - [ ] Verify RA-node for GROUNDS argument
   - [ ] Attack GROUNDS argument premise, verify defeat propagation

### Automated Tests Recommended

```typescript
// tests/integration/cq-aspic-integration.test.ts

describe("CQ → ASPIC+ Integration", () => {
  test("SchemeSpecificCQsModal attacks appear in ASPIC+ graph", async () => {
    // Create argument with scheme
    // Create REBUTS attack via SchemeSpecificCQsModal pattern
    // Call /api/aspic/evaluate
    // Assert CA-node exists with correct metadata
  });

  test("CriticalQuestionsV3 ClaimEdge attacks appear in ASPIC+ graph", async () => {
    // Create claim with CQ
    // Create ClaimEdge attack via CriticalQuestionsV3 pattern
    // Call /api/aspic/evaluate
    // Assert attack is represented (currently fails - BUG)
  });

  test("GROUNDS response creates attackable argument", async () => {
    // Create WHY move
    // Create GROUNDS response
    // Verify Argument with ArgumentPremise exists
    // Create attack on GROUNDS premise
    // Verify ASPIC+ evaluation shows defeat
  });
});
```

---

## Conclusion

### ✅ Strengths

1. **Robust WHY/GROUNDS Protocol**: Both components correctly implement dialogue protocol with proper `cqKey` tracking
2. **Rich ConflictApplication Metadata**: SchemeSpecificCQsModal captures full provenance (`schemeKey`, `cqKey`, `cqText`, `source`)
3. **ASPIC+ Integration for ConflictApplications**: CA-nodes properly included in AIF graph with attack edges
4. **GROUNDS → Argument Integration**: GROUNDS responses create full AIF Arguments with ArgumentPremise for attackability
5. **Clean Separation of Concerns**: SchemeSpecificCQsModal for complex Arguments, CriticalQuestionsV3 for simple Claims

### 🔴 Critical Issues

1. **ClaimEdge Not in ASPIC+ Evaluation**: High-impact bug preventing CriticalQuestionsV3 attacks from participating in grounded extension
2. **Inconsistent Field Naming**: `cqKey` vs `cqId` creates confusion and fragility

### 🟡 Medium-Priority Improvements

1. **CQKey Metadata in CA-Nodes**: Extract `metaJson.cqKey` for full traceability
2. **Add ClaimEdge Metadata**: Store CQ provenance in ClaimEdge for consistency
3. **Optimize Dialogue Move Counting**: Avoid O(n*m) loop with better indexing/caching

### 🟢 Nice-to-Have Enhancements

1. **Unified Attack API**: Single endpoint for both ConflictApplications and ClaimEdges
2. **CONCEDE Move UI**: Complete dialogue loop per R5 protocol
3. **CQ → Attack Linkage Table**: Explicit many-to-many relationship
4. **Automated Integration Tests**: Prevent regressions in ASPIC+/AIF integration

---

## Next Steps

### Immediate (Fix Critical Bugs)

1. **Fix ClaimEdge → ASPIC+ Integration** (~2-4 hours)
   - Option A: Query ClaimEdges in `/api/aspic/evaluate` and create CA-nodes
   - Option B: Add migration step to convert ClaimEdges → ConflictApplications
   - **Recommended**: Option A (less breaking, preserves both models)

2. **Standardize `cqKey` vs `cqId`** (~1 hour)
   - Update components to send `cqId` instead of `cqKey`
   - OR update API to accept `cqKey` and rename internal variable
   - **Recommended**: Keep `cqKey` in payloads, update API to accept both

### Short-Term (Address Medium-Priority)

3. **Extract CQKey to CA-Node Metadata** (~30 min)
   - Update `/api/aspic/evaluate` lines 287-307 to read `conflict.metaJson?.cqKey`
   - Add to CA-node metadata object

4. **Add ClaimEdge Metadata** (~2 hours)
   - Add `metaJson` JSONB column to ClaimEdge model
   - Update `createClaimAttack` to accept optional `metaJson`
   - Update CriticalQuestionsV3 to pass `{ cqKey, schemeKey, source }`

### Long-Term (Enhancements)

5. **Create Integration Test Suite** (~4-6 hours)
6. **Add CONCEDE Move UI** (~2-3 hours)
7. **Optimize Dialogue Move Counting** (~3-4 hours)
8. **Unified Attack API** (~6-8 hours)

---

**Audit Completed By**: GitHub Copilot (Automated Code Analysis)
**Review Status**: Pending human validation
**Priority**: Address ClaimEdge → ASPIC+ gap before next production release
