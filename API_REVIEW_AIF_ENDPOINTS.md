# API Review: AIF Endpoints Architecture

**Purpose**: Review of 5 core AIF API endpoints to understand data flow before Phase 4 Task 2 (DebateSheet UI enhancements)  
**Date**: November 2, 2025  
**Status**: Complete architecture review

---

## Executive Summary

The Mesh codebase has **5 core AIF API endpoints** that serve different layers of the argumentation stack:

1. **`/api/deliberations/[id]/arguments/aif`** - **Primary list view** (paginated Arguments with AIF metadata)
2. **`/api/deliberations/[id]/aif`** - **Full graph export** (JSON-LD with I/RA/CA/PA nodes)
3. **`/api/deliberations/[id]/dialogue-state`** - **Dialogue status** (attack response tracking)
4. **`/api/aif/batch`** - **Import handler** (JSON-LD → Prisma)
5. **`/api/aif/graph-with-dialogue`** - **Dialogue-aware graph** (AIF + DM-nodes + commitment stores)

**Key Finding for Phase 4 Task 2**: The `/arguments/aif` endpoint already computes **ALL metadata** needed for DebateSheet UI:
- ✅ Scheme key/name (from `Argument.schemeId → ArgumentScheme`)
- ✅ CQ required/satisfied counts (from `CQStatus` table)
- ✅ Attack counts by type (REBUTS, UNDERCUTS, UNDERMINES from `ConflictApplication`)
- ✅ Preference counts (preferred/dispreferred by from `PreferenceApplication`)

**Recommendation**: Reuse `/arguments/aif` endpoint logic in DebateSheet components rather than duplicating queries.

---

## 1. `/api/deliberations/[id]/arguments/aif` ⭐ PRIMARY

**Purpose**: Paginated list of Arguments with rich AIF metadata (used by `AIFArgumentsListPro`)

**File**: `app/api/deliberations/[id]/arguments/aif/route.ts` (320 lines)

**Request**:
```typescript
GET /api/deliberations/:id/arguments/aif?cursor=xxx&limit=20&sort=createdAt:desc&claimId=xxx
```

**Response**:
```typescript
{
  items: AifRow[],
  nextCursor: string | null,
  hasMore: boolean
}

type AifRow = {
  id: string;
  deliberationId: string;
  authorId: string;
  createdAt: string;
  text: string;
  mediaType: 'text'|'image'|'video'|'audio' | null;

  // AIF metadata (Phase 2+)
  aif: {
    scheme?: { id, key, name, slotHints } | null;
    conclusion?: { id, text } | null;
    premises?: Array<{ id, text, isImplicit }> | null;
    implicitWarrant?: { text } | null;
    attacks?: { REBUTS: number; UNDERCUTS: number; UNDERMINES: number };
    preferences?: { preferredBy: number; dispreferredBy: number };
    cq?: { required: number; satisfied: number };
  };
};
```

### Metadata Computation Logic

#### 1. Scheme Metadata ✅
```typescript
// From Argument.schemeId → ArgumentScheme
const schemeIds = pageRows.map(r => r.schemeId).filter(Boolean);
const schemes = await prisma.argumentScheme.findMany({
  where: { id: { in: schemeIds } },
  select: {
    id: true, key: true, name: true, slotHints: true,
    cqs: { select: { cqKey, text, attackType, targetScope } }
  }
});

// Result: { id, key, name, slotHints }
```

**Key Points**:
- ✅ Fetches scheme via `Argument.schemeId` (legacy field)
- ✅ Includes `slotHints` (JSON structure for scheme template)
- ✅ Pre-fetches CQs for `required` count (scheme.cqs.length)

#### 2. CQ Status ✅
```typescript
// From CQStatus table (supports both argumentId AND targetType/targetId)
const cqStatuses = await prisma.cQStatus.findMany({
  where: {
    OR: [
      { argumentId: { in: argIds } },
      { targetType: "argument", targetId: { in: argIds } }
    ]
  },
  select: { argumentId, targetId, cqKey, status }
});

// Build: { argId -> { satisfied, seen: Set<cqKey> } }
const cqMap = {};
for (const s of cqStatuses) {
  const keyArgId = s.argumentId ?? s.targetId ?? '';
  cqMap[keyArgId] ??= { satisfied: 0, seen: new Set() };
  if (s.status === 'answered' && s.cqKey && !cqMap[keyArgId].seen.has(s.cqKey)) {
    cqMap[keyArgId].satisfied += 1;
    cqMap[keyArgId].seen.add(s.cqKey);
  }
}

// Result per arg: { required: scheme.cqs.length, satisfied: cqMap[id].satisfied }
```

**Key Points**:
- ✅ Dual-mode: Supports both `argumentId` (legacy) and `targetType='argument', targetId` (Phase 2)
- ✅ Deduplicates CQs by key (uses `Set` to track seen keys)
- ✅ Only counts `status='answered'` CQs as satisfied
- ⚠️ `required` count comes from scheme definition, not actual CQStatus rows

#### 3. Attack Counts ✅
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
    bucket = c.legacyAttackType; // Explicit type (REBUTS, UNDERCUTS, UNDERMINES)
  } else if (c.conflictedArgumentId) {
    bucket = 'UNDERCUTS'; // CA → RA implies undercut
  } else if (c.conflictedClaimId) {
    // Claim target: check if it's conclusion (rebut) or premise (undermine)
    const hitArg = pageRows.find(r => r.conclusionClaimId === c.conflictedClaimId);
    if (hitArg) bucket = 'REBUTS'; // Conclusion targeted
    else {
      // Check if claim is a premise of any argument
      const argHit = pageRows.find(r => 
        r.premises.some(p => p.claimId === c.conflictedClaimId)
      );
      if (argHit) bucket = 'UNDERMINES'; // Premise targeted
    }
  }
  
  // Increment count
  if (bucket && atkByArg[targetArgId]) {
    atkByArg[targetArgId][bucket] += 1;
  }
}
```

**Key Points**:
- ✅ Uses `ConflictApplication` as primary source (Phase 2)
- ✅ Fallback logic for legacy data without `legacyAttackType`
- ✅ Differentiates REBUTS (conclusion) vs UNDERMINES (premise)
- ✅ UNDERCUTS inferred from RA targets
- ⚠️ Does NOT use `ArgumentEdge.attackType` (legacy compatibility issue)

#### 4. Preference Counts ✅
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

const preferredBy = Object.fromEntries(prefA.map(x => [x.preferredArgumentId!, x._count._all]));
const dispreferredBy = Object.fromEntries(dispA.map(x => [x.dispreferredArgumentId!, x._count._all]));
```

**Key Points**:
- ✅ Uses `PreferenceApplication` table (PA-nodes)
- ✅ Separate counts for `preferredBy` and `dispreferredBy`
- ⚠️ Only counts preferences WHERE this argument is a target (not preferences involving this argument's claims/schemes)

### Performance Optimizations

1. **Batch Queries** (5 parallel queries):
   - Schemes (1 query for all schemeIds)
   - Claims (1 query for all conclusion + premise claimIds)
   - Attack counts (1 query with groupBy)
   - CQ statuses (1 query with OR for both argumentId and targetType/targetId)
   - Preference counts (2 queries: preferred and dispreferred)

2. **Pagination** (cursor-based):
   - Fetches `limit + 1` rows to detect `hasMore`
   - Skips expensive includes on first query
   - Hydrates metadata only for page rows (not cursor+1 row)

3. **Early Exit**:
   ```typescript
   if (pageRows.length === 0) {
     const page = makePage([], limit);
     return NextResponse.json(page, NO_STORE);
   }
   ```

---

## 2. `/api/deliberations/[id]/aif` - Full Graph Export

**Purpose**: Export complete AIF graph as JSON-LD (I/RA/CA/PA nodes with edges)

**File**: `app/api/deliberations/[id]/aif/route.ts` (150 lines, sketch implementation)

**Request**:
```typescript
GET /api/deliberations/:id/aif
```

**Response**:
```typescript
{
  ok: true,
  validation: { valid: boolean, errors: string[] },
  jsonld: {
    "@context": "https://aifdb.org/",
    "@graph": [
      // I-nodes (Claims)
      { "@id": "I:claimId", "@type": "aif:InformationNode", "aif:text": "..." },
      
      // RA-nodes (Arguments)
      { "@id": "RA:argId", "@type": "aif:RA", "aif:usesScheme": "expert_opinion" },
      
      // Premise edges (I → RA)
      { "@type": "aif:Premise", "aif:from": "I:claimId", "aif:to": "RA:argId" },
      
      // Conclusion edges (RA → I)
      { "@type": "aif:Conclusion", "aif:from": "RA:argId", "aif:to": "I:claimId" },
      
      // CA-nodes (Attacks)
      { "@id": "CA:conflictId", "@type": "aif:CA", "aif:fromArgument": "RA:...", "aif:toArgument": "RA:..." },
      
      // PA-nodes (Preferences)
      { "@id": "PA:prefId", "@type": "aif:PA", "aif:preferred": "RA:...", "aif:dispreferred": "RA:..." }
    ]
  }
}
```

### Construction Logic

```typescript
// 1. Fetch all entities
const [claims, args, cas, pas] = await Promise.all([
  prisma.claim.findMany({ where: { deliberationId }, select: { id, text } }),
  prisma.argument.findMany({
    where: { deliberationId },
    select: {
      id, conclusionClaimId,
      premises: { select: { claimId } },
      scheme: { select: { key } },
      implicitWarrant
    }
  }),
  prisma.conflictApplication.findMany({
    where: { deliberationId },
    select: {
      id, conflictingArgumentId, conflictedArgumentId,
      conflictingClaimId, conflictedClaimId,
      legacyAttackType, legacyTargetScope
    }
  }),
  prisma.preferenceApplication.findMany({
    where: { deliberationId },
    select: {
      id, scheme: { select: { key } },
      preferredKind, preferredArgumentId, preferredClaimId, preferredSchemeId,
      dispreferredKind, dispreferredArgumentId, dispreferredClaimId, dispreferredSchemeId
    }
  })
]);

// 2. Build AIF graph structure (for invariants)
const g = {
  claims: claims.map(c => ({ kind: "I", id: c.id, text: c.text })),
  arguments: args.map(a => ({
    kind: "RA", id: a.id,
    conclusionClaimId: a.conclusionClaimId,
    premiseClaimIds: a.premises.map(p => p.claimId),
    schemeKey: a.scheme?.key ?? null,
    implicitWarrant: a.implicitWarrant ?? null
  })),
  attacks: cas.map(x => ({
    kind: "CA", id: x.id,
    fromArgumentId: x.conflictingArgumentId ?? "UNKNOWN",
    toArgumentId: x.conflictedArgumentId ?? undefined,
    targetClaimId: x.conflictedClaimId ?? undefined,
    attackType: x.legacyAttackType ?? (x.conflictedArgumentId ? "UNDERCUTS" : "REBUTS"),
    targetScope: x.legacyTargetScope ?? (x.conflictedArgumentId ? "inference" : "conclusion")
  })),
  preferences: pas.map(p => ({
    kind: "PA", id: p.id, schemeKey: p.scheme?.key ?? null,
    preferred: p.preferredArgumentId ? { kind: "RA", id: p.preferredArgumentId } :
               p.preferredClaimId    ? { kind: "CLAIM", id: p.preferredClaimId } :
                                       { kind: "SCHEME", id: p.preferredSchemeId },
    dispreferred: p.dispreferredArgumentId ? { kind: "RA", id: p.dispreferredArgumentId } :
                 p.dispreferredClaimId    ? { kind: "CLAIM", id: p.dispreferredClaimId } :
                                            { kind: "SCHEME", id: p.dispreferredSchemeId }
  }))
};

// 3. Validate with aif-core invariants
const validation = validateAifGraph(g);
```

**Key Points**:
- ✅ Complete deliberation export (all nodes + edges)
- ✅ Includes invariant validation from `packages/aif-core`
- ✅ JSON-LD compatible format
- ⚠️ Sketch implementation (missing full JSON-LD emission logic)
- ⚠️ No pagination (could be expensive for large deliberations)

---

## 3. `/api/deliberations/[id]/dialogue-state` - Attack Response Tracking

**Purpose**: Dialogue status for an argument (attack/defense tracking from Phase 3)

**File**: `app/api/deliberations/[id]/dialogue-state/route.ts` (95 lines)

**Request**:
```typescript
GET /api/deliberations/:id/dialogue-state?argumentId=xxx
```

**Response**:
```typescript
{
  ok: true,
  state: {
    totalAttacks: number,          // Count of incoming ArgumentEdges with attack types
    answeredAttacks: number,       // Count of attacks with GROUNDS DialogueMove responses
    moveComplete: boolean,         // true if all attacks have been answered
    lastResponseAt: string | null  // ISO timestamp of most recent GROUNDS move
  }
}
```

### Computation Logic

```typescript
// 1. Get all incoming attacks
const attacks = await prisma.argumentEdge.findMany({
  where: {
    toArgumentId: argumentId,
    deliberationId,
    attackType: { in: ["REBUTS", "UNDERCUTS", "UNDERMINES"] }
  },
  select: { id, attackType, fromArgumentId }
});

const totalAttacks = attacks.length;

// 2. For each attack, check for GROUNDS response
let answeredAttacks = 0;
let lastResponseAt: Date | null = null;

for (const attack of attacks) {
  const groundsMove = await prisma.dialogueMove.findFirst({
    where: {
      deliberationId,
      targetType: "argument",
      targetId: argumentId,  // Defense targets the attacked argument
      kind: "GROUNDS"        // GROUNDS = defense move
    },
    select: { id, createdAt },
    orderBy: { createdAt: "desc" }
  });

  if (groundsMove) {
    answeredAttacks++;
    if (!lastResponseAt || groundsMove.createdAt > lastResponseAt) {
      lastResponseAt = groundsMove.createdAt;
    }
  }
}

const moveComplete = totalAttacks > 0 && answeredAttacks === totalAttacks;
```

**Key Points**:
- ✅ Uses `ArgumentEdge.attackType` (not ConflictApplication)
- ✅ Checks for `DialogueMove.kind='GROUNDS'` as defense indicator
- ✅ Supports dialogue move tracking (Phase 3)
- ⚠️ **N+1 query pattern**: Loops over attacks and queries DialogueMove for each
- ⚠️ Only tracks GROUNDS moves (doesn't handle other defense types like RETRACT, CONCEDE)

**Performance Concern**: Should batch-fetch all GROUNDS moves in single query:
```typescript
// Better approach:
const groundsMoves = await prisma.dialogueMove.findMany({
  where: {
    deliberationId,
    targetType: "argument",
    targetId: argumentId,
    kind: "GROUNDS"
  }
});
const answeredAttacks = Math.min(groundsMoves.length, totalAttacks);
```

---

## 4. `/api/aif/batch` - JSON-LD Import

**Purpose**: Import AIF JSON-LD data into Prisma (validation + upsert)

**File**: `app/api/aif/batch/route.ts` (200 lines)

**Request**:
```typescript
POST /api/aif/batch
Content-Type: application/json

{
  "@graph": [
    { "@id": "I:1", "@type": "aif:InformationNode", "aif:text": "..." },
    { "@id": "RA:1", "@type": "aif:RA", "aif:usesScheme": "expert_opinion" },
    { "@type": "aif:Premise", "aif:from": "I:1", "aif:to": "RA:1" },
    { "@type": "aif:Conclusion", "aif:from": "RA:1", "aif:to": "I:2" }
  ],
  "options": {
    "mode": "validate" | "upsert",
    "deliberationId": "xxx",  // Required for upsert
    "authorId": "xxx"         // Required for upsert
  }
}
```

**Response**:
```typescript
// mode='validate'
{
  ok: boolean,
  errors: Array<{ path: string, message: string }>,
  inferences: any[]
}

// mode='upsert'
{
  ok: true,
  upserted: true
}
```

### Validation Logic

```typescript
// 1. Extract nodes by type
const nodes = body['@graph'];
const ids = new Set(nodes.map(n => n['@id']));
const I = nodes.filter(n => n['@type'].includes('aif:InformationNode'));
const RA = nodes.filter(n => n['@type'].includes('aif:RA'));
const Prem = nodes.filter(n => n['@type'] === 'aif:Premise');
const Conc = nodes.filter(n => n['@type'] === 'aif:Conclusion');

// 2. Check structural invariants
if (!RA.length) errors.push({ path: '@graph', message: 'No aif:RA nodes found' });

for (const e of Prem) {
  if (!ids.has(e['aif:from'])) errors.push({ path: 'Premise', message: `missing I node ${e['aif:from']}` });
  if (!ids.has(e['aif:to'])) errors.push({ path: 'Premise', message: `missing RA node ${e['aif:to']}` });
}

for (const e of Conc) {
  if (!ids.has(e['aif:from'])) errors.push({ path: 'Conclusion', message: `missing RA node ${e['aif:from']}` });
  if (!ids.has(e['aif:to'])) errors.push({ path: 'Conclusion', message: `missing I node ${e['aif:to']}` });
}
```

### Upsert Logic

```typescript
// 1. Create Claims for all I-nodes
const IText = new Map(I.map(n => [n['@id'], n['aif:text']]));
const claimIdByNode = new Map();

for (const [nodeId, text] of IText) {
  const c = await tx.claim.create({
    data: { text, createdById: authorId, deliberationId }
  });
  claimIdByNode.set(nodeId, c.id);
}

// 2. Create Arguments for each RA
for (const r of RA) {
  const raId = r['@id'];
  const schemeKey = r['aif:usesScheme'] || r['as:appliesSchemeKey'] || null;
  
  // Find premise and conclusion edges
  const premEdges = Prem.filter(p => p['aif:to'] === raId);
  const concEdge = Conc.find(c => c['aif:from'] === raId);
  
  const conclusionClaimId = claimIdByNode.get(concEdge['aif:to']);
  const premiseClaimIds = premEdges.map(p => claimIdByNode.get(p['aif:from']));
  
  // Lookup scheme by key
  const scheme = schemeKey
    ? await tx.argumentScheme.findUnique({ where: { key: schemeKey } })
    : null;
  
  // Create Argument
  const a = await tx.argument.create({
    data: {
      deliberationId, authorId, text: '',
      conclusionClaimId,
      schemeId: scheme?.id ?? null
    }
  });
  
  // Create ArgumentPremise links
  await tx.argumentPremise.createMany({
    data: premiseClaimIds.map(cid => ({ argumentId: a.id, claimId: cid, isImplicit: false })),
    skipDuplicates: true
  });
  
  // Optional: Create CQStatus records if JSON-LD includes hasCriticalQuestion edges
}
```

**Key Points**:
- ✅ Two-phase: validate first, then upsert (prevents partial imports)
- ✅ Creates Claims → Arguments → ArgumentPremise in transaction
- ✅ Looks up ArgumentScheme by key (not ID)
- ✅ Supports CQ status upsert (via `hasCriticalQuestion` edges)
- ⚠️ No support for CA-nodes or PA-nodes import (only I/RA)
- ⚠️ No deduplication (creates new Claims/Arguments even if duplicates exist)

---

## 5. `/api/aif/graph-with-dialogue` - Dialogue-Aware Graph

**Purpose**: Complete AIF graph + dialogue move layer (DM-nodes, commitment stores)

**File**: `app/api/aif/graph-with-dialogue/route.ts` (80 lines)

**Request**:
```typescript
GET /api/aif/graph-with-dialogue?deliberationId=xxx&participantId=xxx&startTime=ISO&endTime=ISO&includeDialogue=true
```

**Response**:
```typescript
{
  nodes: AifNodeWithDialogue[],      // I/RA/CA/PA + optional DM-nodes
  edges: DialogueAwareEdge[],        // Edges with causedByMoveId
  dialogueMoves: DialogueMoveWithAif[], // Moves with AIF provenance
  commitmentStores: Record<userId, claimIds[]>, // Participant commitments
  metadata: {
    totalNodes: number,
    dmNodeCount: number,
    moveCount: number,
    generatedAt: string
  }
}
```

### Construction Logic (via `buildDialogueAwareGraph`)

**File**: `lib/aif/graph-builder.ts` (350 lines)

```typescript
export async function buildDialogueAwareGraph(
  deliberationId: string,
  options: {
    includeDialogue?: boolean,       // Include DM-nodes (default: false)
    participantFilter?: string,      // Filter to specific participant
    timeRange?: { start, end },      // Time range filter
    includeMoves?: "all" | "public"  // Which moves to include
  }
): Promise<AifGraphWithDialogue>
```

**Steps**:

1. **Fetch AIF nodes** (I/RA/CA/PA from hypothetical `AifNode` table):
   ```typescript
   const nodes = await prisma.aifNode.findMany({
     where: { deliberationId },
     include: {
       dialogueMove: includeDialogue,  // Link to DialogueMove that created this node
       outgoingEdges: true,
       incomingEdges: true
     }
   });
   ```

2. **Fetch AIF edges** (with dialogue provenance):
   ```typescript
   const edges = await prisma.aifEdge.findMany({
     where: { deliberationId },
     include: {
       causedByMove: includeDialogue  // Link to DialogueMove that created this edge
     }
   });
   ```

3. **Fetch dialogue moves** (if `includeDialogue=true`):
   ```typescript
   const dialogueMoves = await prisma.dialogueMove.findMany({
     where: {
       deliberationId,
       actorId: participantFilter,  // Optional filter
       createdAt: { gte: startTime, lte: endTime }  // Optional time range
     },
     orderBy: { createdAt: "asc" },
     include: {
       aifNode: true,           // The AIF node this move created
       createdAifNodes: true,   // All AIF nodes created by this move
       causedEdges: true        // All AIF edges created by this move
     }
   });
   ```

4. **Build commitment stores** (track participant commitments):
   ```typescript
   const commitmentStores: Record<userId, claimIds[]> = {};
   
   for (const move of dialogueMoves) {
     const actorId = move.actorId;
     commitmentStores[actorId] ??= [];
     
     // Add commitments (ASSERT, CONCEDE, THEREFORE)
     if (["ASSERT", "CONCEDE", "THEREFORE"].includes(move.kind)) {
       if (move.targetType === "claim" && move.targetId) {
         commitmentStores[actorId].push(move.targetId);
       }
     }
     
     // Remove commitments (RETRACT)
     if (move.kind === "RETRACT" && move.targetType === "claim") {
       const index = commitmentStores[actorId].indexOf(move.targetId);
       if (index > -1) commitmentStores[actorId].splice(index, 1);
     }
   }
   ```

5. **Filter DM-nodes** (if `includeDialogue=false`):
   ```typescript
   const filteredNodes = includeDialogue
     ? nodes
     : nodes.filter(n => n.nodeKind !== "DM");
   ```

**Key Points**:
- ✅ Unified graph with AIF + dialogue layer
- ✅ Commitment store tracking (ASSERT/CONCEDE/RETRACT)
- ✅ Time-based filtering (for episode/chapter analysis)
- ✅ Participant filtering (for individual view)
- ⚠️ Assumes `AifNode` and `AifEdge` tables exist (not in current schema)
- ⚠️ DM-nodes are hypothetical (current schema has `DialogueMove` table, not `AifNode.nodeKind="DM"`)

**Schema Gap**: The code references `prisma.aifNode` and `prisma.aifEdge` which **do not exist** in current schema. Phase 2 likely planned to create these tables but implementation is incomplete.

---

## Data Flow Comparison

### Current State (Phase 4):

```
┌─────────────────────────────────────────────────────────────┐
│ Database Tables                                             │
├─────────────────────────────────────────────────────────────┤
│ Argument (id, schemeId, conclusionClaimId, text)           │
│ ArgumentPremise (argumentId, claimId, isImplicit)          │
│ Claim (id, text)                                            │
│ ArgumentScheme (id, key, name, slotHints)                   │
│ ConflictApplication (conflictingArgumentId, conflictedArgumentId, legacyAttackType) │
│ PreferenceApplication (preferredArgumentId, dispreferredArgumentId) │
│ CQStatus (argumentId, targetType, targetId, cqKey, status) │
│ ArgumentEdge (fromArgumentId, toArgumentId, attackType)    │
│ DialogueMove (kind, targetType, targetId, actorId)         │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ API Endpoints (Current Usage)                               │
├─────────────────────────────────────────────────────────────┤
│ /arguments/aif          → AIFArgumentsListPro (DeepDivePanel) │
│ /dialogue-state         → DialogueStateBadge (Phase 3)        │
│ /aif                    → Export/validation (rare)            │
│ /aif/batch              → Import (rare)                       │
│ /graph-with-dialogue    → [NOT USED] (AifNode table missing) │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ UI Components                                               │
├─────────────────────────────────────────────────────────────┤
│ DeepDivePanelV2 → AIFArgumentsListPro → ArgumentCardV2     │
│   (Reads from Argument table via /arguments/aif)           │
│                                                              │
│ DebateSheetReader (Phase 4+)                                │
│   (Will read from DebateSheet → DebateNode → Argument)     │
└─────────────────────────────────────────────────────────────┘
```

### Proposed Flow (Phase 4 Task 2):

```
┌─────────────────────────────────────────────────────────────┐
│ DebateSheet (Phase 4+)                                      │
├─────────────────────────────────────────────────────────────┤
│ DebateSheet (sheetId, agoraRoomId)                         │
│ DebateNode (id, sheetId, argumentId, metadata)             │
│ DebateEdge (id, sheetId, fromNodeId, toNodeId, kind)       │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ Metadata Query Options                                      │
├─────────────────────────────────────────────────────────────┤
│ Option 1: Reuse /arguments/aif endpoint (RECOMMENDED)      │
│   • Fetch Arguments with aif.* metadata                    │
│   • Join to DebateNode via argumentId                      │
│   • No duplicated query logic                              │
│                                                              │
│ Option 2: New /debate-sheets/[id] endpoint                 │
│   • Fetch DebateNodes + ArgumentIds                        │
│   • Batch-query metadata (duplicate of /arguments/aif)    │
│   • More overhead, same data                               │
│                                                              │
│ Option 3: Pre-computed in DebateNode table                 │
│   • Store metadata in DebateNode.metadata JSONB            │
│   • Fast reads, stale data risk                            │
│   • Requires invalidation logic                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Findings for Phase 4 Task 2

### 1. Metadata is Already Computed ✅

The `/arguments/aif` endpoint **already computes all metadata** needed for DebateSheet UI:
- ✅ `aif.scheme` (key, name, slotHints)
- ✅ `aif.cq` (required, satisfied)
- ✅ `aif.attacks` (REBUTS, UNDERCUTS, UNDERMINES counts)
- ✅ `aif.preferences` (preferredBy, dispreferredBy counts)
- ✅ `aif.conclusion` (id, text)
- ✅ `aif.premises` (id, text, isImplicit)

**Recommendation**: Reuse this endpoint in `DebateSheetReader` instead of creating new queries.

### 2. Data Source Priority

**For metadata queries, use this priority**:
1. **ConflictApplication** (CA-nodes) for attack counts → Most accurate (Phase 2)
2. **PreferenceApplication** (PA-nodes) for preferences → Most accurate (Phase 2)
3. **CQStatus** table for CQ status → Supports both argumentId and targetType/targetId
4. **ArgumentScheme** table for scheme metadata → Includes CQs and slotHints
5. **ArgumentEdge** table → ONLY for dialogue-state tracking (has attackType field)

**DO NOT use ArgumentEdge for attack counts in DebateSheet** - it's legacy and doesn't have full attack type coverage.

### 3. Schema Gaps

**Missing tables** referenced in `/graph-with-dialogue`:
- `AifNode` (hypothetical unified table for I/RA/CA/PA/DM nodes)
- `AifEdge` (hypothetical unified table for edges)

**Current workaround**: Query separate tables (Claim, Argument, ConflictApplication, PreferenceApplication, DialogueMove) and assemble graph in memory.

**Phase 2 TODO**: Decide if we need `AifNode`/`AifEdge` tables or stick with domain tables + view layer.

### 4. Performance Notes

**Good**:
- ✅ Batch queries (5 parallel queries in `/arguments/aif`)
- ✅ Cursor-based pagination
- ✅ Early exit for empty results

**Bad**:
- ⚠️ N+1 query in `/dialogue-state` (loops over attacks, queries DialogueMove for each)
- ⚠️ No caching headers (all endpoints use `Cache-Control: no-store`)

**Optimization Opportunities**:
1. Add Redis caching for scheme metadata (rarely changes)
2. Batch-fetch DialogueMove responses in single query
3. Consider materialized view for attack counts (if performance becomes issue)

---

## Recommendations for Phase 4 Task 2

### 1. Reuse `/arguments/aif` Endpoint Logic

**Instead of creating new DebateSheet-specific queries**, reuse the existing metadata computation:

```typescript
// DebateSheetReader.tsx
const { data } = useSWR(
  `/api/deliberations/${deliberationId}/arguments/aif?limit=100`,
  fetcher
);

// Join with DebateNodes
const nodesWithMetadata = debateNodes.map(node => {
  const arg = data.items.find(a => a.id === node.argumentId);
  return {
    ...node,
    scheme: arg?.aif.scheme,
    cq: arg?.aif.cq,
    attacks: arg?.aif.attacks,
    preferences: arg?.aif.preferences
  };
});
```

**Benefits**:
- ✅ No duplicated query logic
- ✅ Consistent metadata across UI
- ✅ Already optimized (batch queries, pagination)

### 2. Add Metadata to DebateNode (Optional)

**If performance is critical**, consider pre-computing metadata during sheet generation:

```typescript
// scripts/generate-debate-sheets.ts
async function generateDebateSheet(deliberationId: string) {
  // ... existing code ...
  
  // Add metadata to node creation
  await prisma.debateNode.create({
    data: {
      sheetId,
      argumentId: arg.id,
      title: arg.text,
      metadata: {  // JSONB field
        schemeKey: metadata.schemeKey,
        cqStatus: metadata.cqStatus,
        conflictCount: metadata.conflictCount,
        preferenceRank: metadata.preferenceRank
      }
    }
  });
}
```

**Trade-offs**:
- ✅ Faster reads (no joins needed)
- ⚠️ Stale data risk (need invalidation when CA/PA/CQ changes)
- ⚠️ Storage overhead (duplicated data)

**Verdict**: Only do this if profiling shows metadata queries are bottleneck.

### 3. Create Scheme Badge Component

**Reusable component** for displaying scheme metadata:

```typescript
// components/aif/SchemeBadge.tsx
export function SchemeBadge({ scheme }: { scheme: AifRow['aif']['scheme'] }) {
  if (!scheme) return null;
  
  const colors = {
    expert_opinion: 'bg-blue-100 text-blue-700',
    popular_opinion: 'bg-green-100 text-green-700',
    popular_practice: 'bg-yellow-100 text-yellow-700',
    // ... more scheme colors
  };
  
  return (
    <span className={`px-2 py-1 rounded text-xs ${colors[scheme.key] || 'bg-gray-100'}`}>
      {scheme.name}
    </span>
  );
}
```

### 4. Create CQ Status Indicator

**Component** for displaying CQ open/answered status:

```typescript
// components/aif/CQStatusIndicator.tsx
export function CQStatusIndicator({ cq }: { cq: { required: number, satisfied: number } }) {
  if (cq.required === 0) return null;
  
  const allAnswered = cq.satisfied === cq.required;
  const noneAnswered = cq.satisfied === 0;
  
  return (
    <div className="flex items-center gap-1">
      <span className={`w-2 h-2 rounded-full ${
        allAnswered ? 'bg-green-500' :
        noneAnswered ? 'bg-orange-500' :
        'bg-yellow-500'
      }`} />
      <span className="text-xs text-gray-600">
        {cq.satisfied}/{cq.required} CQs
      </span>
    </div>
  );
}
```

### 5. Create Attack Count Badge

**Component** for displaying attack counts:

```typescript
// components/aif/AttackBadge.tsx
export function AttackBadge({ attacks }: { attacks: { REBUTS: number, UNDERCUTS: number, UNDERMINES: number } }) {
  const total = attacks.REBUTS + attacks.UNDERCUTS + attacks.UNDERMINES;
  if (total === 0) return null;
  
  return (
    <span className="px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
      {total} attack{total !== 1 ? 's' : ''}
    </span>
  );
}
```

---

## Next Steps

### Phase 4 Task 2: DebateSheet UI Enhancements

**Tasks**:
1. ✅ Review API endpoints (COMPLETE - this document)
2. 🔄 Create reusable UI components (SchemeBadge, CQStatusIndicator, AttackBadge)
3. 🔄 Update DebateSheetReader to display metadata
4. 🔄 Add filter controls (by scheme, open CQs, conflicted nodes)
5. 🔄 Mobile responsive design

**Files to Update**:
- `components/aif/SchemeBadge.tsx` (NEW)
- `components/aif/CQStatusIndicator.tsx` (NEW)
- `components/aif/AttackBadge.tsx` (NEW)
- `components/debate/DebateSheetReader.tsx` (UPDATE)
- `app/api/deliberations/[id]/arguments/aif/route.ts` (NO CHANGE - already complete)

---

## Appendix: Quick Reference

### Metadata Fields Available

| Field | Source | Computation | Used For |
|-------|--------|-------------|----------|
| `schemeKey` | `Argument.schemeId → ArgumentScheme.key` | Direct lookup | Scheme badge color |
| `schemeName` | `ArgumentScheme.name` | Direct lookup | Scheme badge text |
| `cq.required` | `ArgumentScheme.cqs.length` | Count | CQ status denominator |
| `cq.satisfied` | `CQStatus.status='answered'` | Count + dedupe by cqKey | CQ status numerator |
| `attacks.REBUTS` | `ConflictApplication → conclusion` | Count + bucket | Attack badge |
| `attacks.UNDERCUTS` | `ConflictApplication → inference` | Count + bucket | Attack badge |
| `attacks.UNDERMINES` | `ConflictApplication → premise` | Count + bucket | Attack badge |
| `preferences.preferredBy` | `PreferenceApplication.preferredArgumentId` | GroupBy count | Preference rank |
| `preferences.dispreferredBy` | `PreferenceApplication.dispreferredArgumentId` | GroupBy count | Preference rank |

### Endpoint URLs

| Endpoint | Purpose | Pagination | Auth |
|----------|---------|------------|------|
| `/api/deliberations/:id/arguments/aif` | Argument list with metadata | ✅ Cursor | ❌ |
| `/api/deliberations/:id/aif` | Full graph export (JSON-LD) | ❌ | ❌ |
| `/api/deliberations/:id/dialogue-state` | Attack response status | ❌ | ❌ |
| `/api/aif/batch` | JSON-LD import | ❌ | ❌ |
| `/api/aif/graph-with-dialogue` | Dialogue-aware graph | ❌ | ✅ |

---

**Document Status**: Complete v1.0  
**Next Action**: Proceed with Phase 4 Task 2 UI component creation  
**Reviewed**: All 5 endpoints analyzed  
**Last Updated**: November 2, 2025
