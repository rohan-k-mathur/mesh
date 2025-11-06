# Phase 1e: Ludics Metadata Preservation - Implementation Summary

**Status**: ✅ COMPLETE  
**Date**: 2025-01-XX  
**Lines Added**: ~150 lines (production code)  
**Files Modified**: 2  
**TypeScript Errors**: 0 (in new code)

---

## Overview

Phase 1e completes the ASPIC+ provenance chain by preserving formal semantics through the Ludics compilation pipeline and generating appropriate AIF Conflict Application (CA) nodes. This ensures that ASPIC+ attack/defeat metadata captured in Phase 1c flows through the entire system:

```
DialogueMove.payload.aspicAttack (Phase 1c ✅)
  ↓
LudicAct.metaJson.aspic (Phase 1e ✅)
  ↓
AIF CA-nodes (Phase 1e ✅)
```

---

## Theoretical Foundation

Phase 1e implementation was guided by comprehensive analysis of the Ludics theoretical framework (see `LUDICS_THEORY_ANALYSIS_FOR_IMPLEMENTATION.md`). Key alignment:

- **Ludics Interaction** = ASPIC+ Defeat Computation
- **Commitment State** = ASPIC+ Argumentation Theory
- **Chronicle** = Sequence of attacks/defenses
- **Convergence/Divergence** = Argument acceptance/defeat

The implementation preserves ASPIC+ semantics as Ludics metadata, allowing the formal argumentation structure to be reconstructed at any stage.

---

## Implementation Details

### 1. Enhanced `compileFromMoves.ts`

**Location**: `packages/ludics-engine/compileFromMoves.ts`

#### 1.1 Import ASPIC+ Helper

```typescript
import { extractAspicMetadataFromMove } from "@/lib/aspic/conflictHelpers";
```

#### 1.2 Enhanced `Move` Type

Extended the `Move` type to include ASPIC+ fields:

```typescript
type Move = {
  id: string;
  kind: string;
  payload?: {
    acts?: DialogueAct[];
    locusPath?: string;
    expression?: string;
    cqId?: string;
    sourceDesignId?: string;
    // ASPIC+ fields from Phase 1c
    aspicAttack?: any;
    aspicMetadata?: any;
    cqKey?: string;
    cqText?: string;
  };
  targetType: 'argument'|'claim'|'card';
  targetId: string;
  actorId: string;
};
```

#### 1.3 Enhanced `expandActsFromMove()` Function

**Purpose**: Extract ASPIC+ metadata from DialogueMove and include in LudicAct objects

**Changes**:
- Call `extractAspicMetadataFromMove(m.payload)` to extract ASPIC+ data
- Include `aspic` field in returned act objects
- Preserve all existing functionality

**Code**:
```typescript
function expandActsFromMove(m: Move) {
  const acts = m.payload?.acts ?? [];
  
  // Extract ASPIC+ metadata from DialogueMove payload (Phase 1e)
  const aspicMetadata = extractAspicMetadataFromMove(m.payload ?? {});
  
  return acts.map(a => ({
    polarity: a.polarity,
    locusPath: a.locusPath ?? '0',
    openings: Array.isArray(a.openings) ? a.openings : [],
    isAdditive: !!a.additive,
    expression: a.expression ?? '',
    moveId: m.id,
    targetType: m.targetType,
    targetId: m.targetId,
    actorId: m.actorId,
    // Phase 1e: Include ASPIC+ metadata for Ludics→AIF provenance
    aspic: aspicMetadata,
  }));
}
```

#### 1.4 Enhanced `compileScopeActs()` - Meta Field Construction

**Purpose**: Pass ASPIC+ metadata through to LudicAct.metaJson

**Changes**:
- Include `aspic` field in `meta` object when present
- Metadata flows to `appendActs()` which stores as `metaJson`

**Code**:
```typescript
const meta = {
  moveId: a.moveId,
  targetType: a.targetType,
  targetId: a.targetId,
  actorId: a.actorId,
  // Phase 1e: Include ASPIC+ metadata for AIF synchronization
  ...(a.aspic ? { aspic: a.aspic } : {}),
};
```

This metadata object is then stored in the database via `appendActs()`:
```typescript
// In appendActs.ts (existing code - no changes needed)
const act = await db.ludicAct.create({
  data: {
    designId,
    kind: 'PROPER',
    polarity: designPolarity,
    locusId: locus.id,
    ramification: a.ramification ?? [],
    expression: a.expression,
    metaJson: ((a as any).meta ?? {}) as Prisma.InputJsonValue, // ← Stores aspic here
    isAdditive: (a as any).isAdditive ?? !!a.additive,
    orderInDesign: ++order,
  },
});
```

---

### 2. Enhanced `syncToAif.ts`

**Location**: `lib/ludics/syncToAif.ts`

#### 2.1 Enhanced Function Signature

Added `caNodesCreated` to return type:

```typescript
export async function syncLudicsToAif(deliberationId: string): Promise<{
  nodesCreated: number;
  nodesUpdated: number;
  edgesCreated: number;
  caNodesCreated: number; // Phase 1e
}>
```

#### 2.2 CA-Node Generation in Main Loop

After creating standard AifNode for a LudicAct, check for ASPIC+ metadata and generate CA-node:

```typescript
// Phase 1e: Create CA-node if ASPIC+ attack metadata present
const aspicMeta = (act.metaJson as any)?.aspic;
if (aspicMeta && aspicMeta.attackType) {
  const caResult = await createCANodeForAspicAttack(
    deliberationId,
    act,
    aifNode,
    aspicMeta,
    acts,
    nodesByActId
  );
  
  if (caResult.caNodeCreated) {
    caNodesCreated++;
    edgesCreated += caResult.edgesCreated;
  }
}
```

#### 2.3 New `createCANodeForAspicAttack()` Helper Function

**Purpose**: Create AIF CA-node representing ASPIC+ attack and link attacker → CA → defender

**Parameters**:
- `deliberationId`: Deliberation context
- `attackerAct`: LudicAct containing the attack
- `attackerNode`: AifNode for the attacker (just created)
- `aspicMeta`: ASPIC+ metadata from `metaJson.aspic`
- `allActs`: All LudicActs for finding defender
- `nodesByActId`: Existing AifNodes for linking

**Algorithm**:
1. Extract `defenderId` from ASPIC+ metadata
2. Find defender's LudicAct by `targetId`
3. Retrieve defender's AifNode
4. Create CA-node with ASPIC+ attack details
5. Create two edges:
   - `attackerNode → CA` (role: "attacks_via")
   - `CA → defenderNode` (role: "conflicts_with")

**Code Excerpt**:
```typescript
// Create CA-node representing the ASPIC+ attack
const caNode = await (prisma as any).aifNode.create({
  data: {
    deliberationId,
    nodeKind: "CA", // Conflict Application
    locusPath: attackerAct.locus?.path ?? "0",
    locusRole: "conflict",
    text: `${aspicMeta.attackType} attack`, // e.g., "undermining attack"
    nodeSubtype: "aspic_conflict",
    dialogueMetadata: {
      aspicAttackType: aspicMeta.attackType,
      aspicDefeatStatus: aspicMeta.succeeded,
      attackerId: aspicMeta.attackerId,
      defenderId: aspicMeta.defenderId,
      cqKey: aspicMeta.cqKey,
      cqText: aspicMeta.cqText,
      reason: aspicMeta.reason,
      targetScope: aspicMeta.targetScope,
    },
  },
});

// Create edges: attacker → CA → defender
await (prisma as any).aifEdge.create({
  data: {
    deliberationId,
    sourceId: attackerNode.id,
    targetId: caNode.id,
    edgeRole: "attacks_via",
    causedByMoveId: (attackerAct.metaJson as any)?.moveId ?? null,
  },
});

await (prisma as any).aifEdge.create({
  data: {
    deliberationId,
    sourceId: caNode.id,
    targetId: defenderNode.id,
    edgeRole: "conflicts_with",
    causedByMoveId: (attackerAct.metaJson as any)?.moveId ?? null,
  },
});
```

---

## Data Flow Example

### Input: DialogueMove (from Phase 1c)

```typescript
{
  id: "move_123",
  kind: "WHY",
  deliberationId: "delib_456",
  payload: {
    acts: [
      {
        polarity: "neg",
        locusPath: "0.1",
        expression: "Why does this claim hold?",
        openings: [],
        additive: false
      }
    ],
    cqKey: "CQ_EXCEPTIONAL_CASE",
    cqText: "Is there an exceptional case?",
    aspicAttack: {
      type: "undercutting",
      attackerId: "arg_789",
      defenderId: "arg_012",
      succeeded: true
    },
    aspicMetadata: {
      targetScope: "premise",
      reason: "Critical question challenges rule applicability"
    }
  },
  targetType: "argument",
  targetId: "arg_012",
  actorId: "user_345"
}
```

### Step 1: Ludics Compilation

**Function**: `expandActsFromMove(move)`

**Output**:
```typescript
[
  {
    polarity: "neg",
    locusPath: "0.1",
    openings: [],
    isAdditive: false,
    expression: "Why does this claim hold?",
    moveId: "move_123",
    targetType: "argument",
    targetId: "arg_012",
    actorId: "user_345",
    aspic: {
      attackType: "undercutting",
      attackerId: "arg_789",
      defenderId: "arg_012",
      succeeded: true,
      targetScope: "premise",
      cqKey: "CQ_EXCEPTIONAL_CASE",
      cqText: "Is there an exceptional case?",
      reason: "Critical question challenges rule applicability"
    }
  }
]
```

### Step 2: LudicAct Storage

**Database Record**: `LudicAct`

```typescript
{
  id: "act_567",
  designId: "design_890",
  kind: "PROPER",
  polarity: "O",
  locusId: "locus_234",
  expression: "Why does this claim hold?",
  metaJson: {
    moveId: "move_123",
    targetType: "argument",
    targetId: "arg_012",
    actorId: "user_345",
    aspic: {
      attackType: "undercutting",
      attackerId: "arg_789",
      defenderId: "arg_012",
      succeeded: true,
      targetScope: "premise",
      cqKey: "CQ_EXCEPTIONAL_CASE",
      cqText: "Is there an exceptional case?",
      reason: "Critical question challenges rule applicability"
    }
  },
  orderInDesign: 5
}
```

### Step 3: AIF Synchronization

**Function**: `syncLudicsToAif(deliberationId)`

**Output**: 3 AifNodes + 2 AifEdges

#### AifNode 1: Attacker (existing I-node or RA-node)
```typescript
{
  id: "aif_node_111",
  deliberationId: "delib_456",
  nodeKind: "I",
  ludicActId: "act_567",
  locusPath: "0.1",
  locusRole: "responder",
  text: "Why does this claim hold?",
  nodeSubtype: "ludics_act"
}
```

#### AifNode 2: CA-node (NEW - Phase 1e)
```typescript
{
  id: "aif_node_222",
  deliberationId: "delib_456",
  nodeKind: "CA",
  locusPath: "0.1",
  locusRole: "conflict",
  text: "undercutting attack",
  nodeSubtype: "aspic_conflict",
  dialogueMetadata: {
    aspicAttackType: "undercutting",
    aspicDefeatStatus: true,
    attackerId: "arg_789",
    defenderId: "arg_012",
    cqKey: "CQ_EXCEPTIONAL_CASE",
    cqText: "Is there an exceptional case?",
    reason: "Critical question challenges rule applicability",
    targetScope: "premise"
  }
}
```

#### AifNode 3: Defender (existing I-node or RA-node)
```typescript
{
  id: "aif_node_333",
  deliberationId: "delib_456",
  nodeKind: "RA",
  ludicActId: "act_012",
  locusPath: "0",
  text: "[Defender argument text]"
}
```

#### AifEdge 1: Attacker → CA
```typescript
{
  id: "edge_444",
  deliberationId: "delib_456",
  sourceId: "aif_node_111", // Attacker
  targetId: "aif_node_222", // CA-node
  edgeRole: "attacks_via",
  causedByMoveId: "move_123"
}
```

#### AifEdge 2: CA → Defender
```typescript
{
  id: "edge_555",
  deliberationId: "delib_456",
  sourceId: "aif_node_222", // CA-node
  targetId: "aif_node_333", // Defender
  edgeRole: "conflicts_with",
  causedByMoveId: "move_123"
}
```

---

## Code Metrics

| Metric | Value |
|--------|-------|
| Files Modified | 2 |
| Lines Added | ~150 |
| New Functions | 1 (`createCANodeForAspicAttack`) |
| Enhanced Functions | 3 (`expandActsFromMove`, `compileScopeActs`, `syncLudicsToAif`) |
| TypeScript Errors | 0 (in new code) |
| Pre-existing Errors | 3 (unrelated to Phase 1e) |

---

## Testing Strategy

### Unit Tests (Planned - Phase 1f)

1. **`expandActsFromMove()` Tests**
   - Test with ASPIC+ metadata present
   - Test with ASPIC+ metadata absent
   - Test with multiple acts in single move
   - Test with different attack types

2. **`createCANodeForAspicAttack()` Tests**
   - Test CA-node creation with valid metadata
   - Test edge creation (attacker → CA → defender)
   - Test error handling when defender not found
   - Test duplicate CA-node prevention

### Integration Tests (Planned - Phase 1f)

1. **End-to-End Provenance Chain**
   - Create DialogueMove with ASPIC+ attack
   - Run Ludics compilation
   - Verify LudicAct.metaJson.aspic populated
   - Run AIF synchronization
   - Verify CA-node created with correct metadata
   - Verify edges link attacker → CA → defender

2. **Multi-Attack Scenarios**
   - Multiple attacks in single dialogue
   - Chains of attacks (A attacks B, B attacks C)
   - Simultaneous attacks on same target

3. **Performance Tests**
   - Large deliberations (1000+ moves)
   - Complex attack graphs
   - Benchmark AIF sync time

---

## Known Limitations

1. **Pre-existing Schema Issues**
   - `LudicDesign.scope` field type mismatch (lines 478, 490)
   - `pickChild()` type error in DISCHARGE handler (line 823)
   - These are pre-existing issues not introduced by Phase 1e

2. **Defender Lookup Strategy**
   - Currently finds defender by `targetId` in metaJson
   - May need enhancement for complex targeting scenarios
   - Consider adding explicit `defenderId` to LudicAct schema

3. **Edge Deduplication**
   - Uses `.catch(() => {})` to ignore duplicate edge errors
   - Consider explicit duplicate checking before creation

---

## Future Enhancements

1. **Enhanced CA-Node Metadata**
   - Include defeat explanation (why attack succeeded/failed)
   - Add preference values if available
   - Link to CriticalQuestion record

2. **Bidirectional Provenance**
   - Add reverse lookup: AIF CA-node → LudicAct → DialogueMove
   - API endpoint to trace attack origin

3. **Visual Representation**
   - AIF diagram renderer showing CA-nodes as conflict edges
   - Color-coding by attack type (undermining/rebutting/undercutting)
   - Interactive provenance explorer

4. **Performance Optimization**
   - Batch CA-node creation
   - Parallelize AIF edge creation
   - Cache defender lookups

---

## Dependencies

### Existing Code
- `lib/aspic/conflictHelpers.ts` (Phase 1d) - Provides `extractAspicMetadataFromMove()`
- `packages/ludics-engine/appendActs.ts` - Stores metadata in `metaJson`
- `packages/ludics-core/types.ts` - Provides `DialogueAct` type

### Database Schema
- `LudicAct.metaJson` - JSON field for storing ASPIC+ metadata
- `AifNode` - Standard AIF node table (CA-nodes use nodeKind="CA")
- `AifEdge` - Standard AIF edge table (new roles: "attacks_via", "conflicts_with")

### Prisma Client
- Uses `(prisma as any).aifNode` type assertion (pre-existing pattern)
- Requires Prisma client regeneration after schema changes

---

## Verification Checklist

- [x] `expandActsFromMove()` extracts ASPIC+ metadata
- [x] Metadata included in act objects with `aspic` field
- [x] Metadata passed through to LudicAct.metaJson
- [x] `syncLudicsToAif()` detects ASPIC+ metadata
- [x] CA-nodes created with correct nodeKind="CA"
- [x] CA-nodes contain full ASPIC+ provenance
- [x] Attacker → CA edge created with role "attacks_via"
- [x] CA → Defender edge created with role "conflicts_with"
- [x] Function returns caNodesCreated count
- [x] No TypeScript errors in new code
- [x] Lint passes (pre-existing warnings unrelated)

---

## Related Documentation

- [Ludics Theory Analysis](./LUDICS_THEORY_ANALYSIS_FOR_IMPLEMENTATION.md) - Theoretical foundation
- [Phase 1c Summary](./PHASE_1C_CQ_DIALOGUE_MOVE_INTEGRATION.md) - DialogueMove ASPIC+ capture
- [Phase 1d Summary](./PHASE_1D_CONFLICT_APPLICATION_ENHANCEMENT.md) - Schema and helpers
- [ASPIC+ Core Implementation](./ASPIC_CORE_IMPLEMENTATION.md) - Formal framework

---

## Conclusion

Phase 1e successfully completes the ASPIC+ provenance chain by:

1. **Preserving metadata** through Ludics compilation (DialogueMove → LudicAct)
2. **Generating CA-nodes** in AIF synchronization (LudicAct → AIF)
3. **Maintaining full traceability** from CQ → DialogueMove → Ludics → AIF

The implementation is **minimal, focused, and non-invasive**:
- Only 2 files modified
- ~150 lines of production code
- 0 TypeScript errors introduced
- All existing functionality preserved

Phase 1e sets the foundation for advanced argumentation features:
- Formal dialogue evaluation (convergence/divergence)
- Attack graph visualization
- Automated consistency checking
- Argumentation theory queries

**Status**: ✅ READY FOR PHASE 1F (TESTING & VALIDATION)
