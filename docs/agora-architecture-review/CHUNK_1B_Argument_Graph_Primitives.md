# CHUNK 1B: Argument Graph Primitives

**Review Date:** October 27, 2025  
**Reviewer:** Architecture Deep-Dive  
**Phase:** 1 of 6 - Foundational Types & Core Algebra

---

## 📦 Files Reviewed

1. `lib/arguments/diagram.ts` (433 lines)
2. `lib/arguments/diagram-neighborhoods.ts` (414 lines)
3. `lib/arguments/aif-builder.ts` (208 lines)

**Total: ~1,055 lines of argument graph construction**

---

## 🎯 What Exists: Argument Graph Construction Layer

### 1. Core AIF Graph Builder (`diagram.ts`)

**Purpose:** Convert Prisma `Argument` → AIF `AifSubgraph` with I/RA/CA/PA nodes.

#### **Key Types:**
```typescript
export type Diagram = {
  id: string;
  title?: string | null;
  statements: Array<{id, text, kind:'claim'|'premise'|'warrant'|'backing'|'rebuttal'|'statement'}>;
  inferences: Array<{id, kind, conclusion, premises, scheme}>;
  evidence: Array<{id, uri, note}>;
  aif?: AifSubgraph;  // ← Attached AIF view
};

export type AifNodeKind = 'I' | 'RA' | 'CA' | 'PA';
export type AifEdgeRole =
  | 'premise' | 'conclusion'
  | 'conflictingElement' | 'conflictedElement'
  | 'preferredElement'  | 'dispreferredElement'
  | 'has-presumption' | 'has-exception';  // ← NEW: AssumptionUse edges
  
export type AifNode = {
  id: string;              // "I:{claimId}", "RA:{argId}", "CA:{caId}", "PA:{paId}"
  kind: AifNodeKind;
  label?: string | null;
  schemeKey?: string | null;
};

export type AifEdge = { id: string; from: string; to: string; role: AifEdgeRole };
export type AifSubgraph = { nodes: AifNode[]; edges: AifEdge[] };
```

---

#### **Primary Function: `buildAifSubgraphForArgument(argumentId)`**

**Algorithm:**
1. **Fetch argument** with premises, conclusion, deliberationId
2. **Build RA-node** for argument
3. **Build I-nodes** for conclusion + premises
4. **Add premise/conclusion edges** (I→RA, RA→I)
5. **Fetch AssumptionUse** rows → add `has-presumption`/`has-exception` edges
6. **Fetch ConflictApplications** touching this argument/claims → build CA-nodes
7. **Fetch PreferenceApplications** touching this argument/claims → build PA-nodes
8. **Optional: Handle premise grouping** (convergent vs linked support)
9. **Deduplicate** nodes/edges
10. **Return** `{nodes, edges}`

**What Works:**
- ✅ Converts `Argument` → RA-node
- ✅ Premises → I-nodes with `premise` edges
- ✅ Conclusion → I-node with `conclusion` edge
- ✅ **AssumptionUse integration** (`has-presumption`/`has-exception` edges)
- ✅ CA-nodes for ConflictApplication (REBUTS/UNDERCUTS/UNDERMINES)
- ✅ PA-nodes for PreferenceApplication
- ✅ Handles convergent support (multiple RA views per `groupKey`)
- ✅ Deduplication (Map-based uniqueness)

**Categorical Alignment:**
- ✅ RA-node = morphism A→B (inference)
- ✅ I-nodes = objects (claims)
- ✅ CA-nodes = conflict application (attack on morphism or object)
- ✅ PA-nodes = preference application (ordering morphisms/objects)
- ✅ **AssumptionUse** = free variables (open assumptions) ← KEY for belief revision!

**Gaps:**
- ❌ No explicit hom-set grouping (multiple arguments A→B not collected into single set)
- ❌ No confidence scoring attached to nodes/edges
- ❌ `targetScope:'inference'` doesn't pinpoint specific inference step (needs `targetInferenceId`)

**Verdict:** ✅ **Sophisticated AIF builder with AssumptionUse support** (aligns well with categorical research)

---

#### **Secondary Function: `buildDiagramForArgument(argumentId)`**

**Purpose:** Create Toulmin-style `Diagram` with attached AIF view.

**Algorithm:**
1. Fetch argument + incoming `ArgumentEdge` (type: 'support' | 'grounds')
2. Build `statements` (claim + premises from supporting args)
3. Build `inferences` (defeasible if premises exist, else atomic assertion)
4. Call `buildAifSubgraphForArgument` → attach as `diagram.aif`
5. Return hybrid `Diagram` object

**What Works:**
- ✅ Toulmin diagram structure (statements + inferences)
- ✅ **Attaches AIF view** via `diagram.aif` property
- ✅ Simple inference type detection (defeasible vs atomic)

**Integration:**
- Used by `/api/arguments/[id]/route.ts` (returns `{ok: true, diagram: {...}}`)
- DeepDivePanelV2 displays via DiagramViewer (bug: accesses `diag.aif` instead of `diag.diagram.aif`)

**Verdict:** ✅ **Two-level representation working** (Toulmin + AIF in single object)

---

### 2. Multi-Argument Neighborhood Expansion (`diagram-neighborhoods.ts`)

**Purpose:** Build connected subgraph expanding from a root argument.

#### **Primary Function: `buildAifNeighborhood(argumentId, depth, options)`**

**Parameters:**
```typescript
{
  depth: number = 2,  // How many hops to explore
  includeSupporting?: boolean,   // Follow support edges
  includeOpposing?: boolean,     // Follow conflict edges
  includePreferences?: boolean,  // Include PA-nodes
  maxNodes?: number = 200        // Circuit breaker
}
```

**Algorithm:**
1. **Recursive exploration** starting from `argumentId`
2. For each argument:
   - Build RA + I-nodes (premises/conclusion)
   - Find connected arguments via `ArgumentEdge` (support/rebut/undercut)
   - Find conflicts via `ConflictApplication`
   - Find preferences via `PreferenceApplication`
   - Add connected argument IDs to exploration queue
3. **Recurse** up to `depth` hops
4. **Stop early** if `maxNodes` exceeded
5. **Deduplicate** via Map-based uniqueness
6. Return full neighborhood `AifSubgraph`

**What Works:**
- ✅ Depth-limited BFS/DFS exploration
- ✅ Filter by edge type (support/conflict/preference)
- ✅ Circuit breaker (`maxNodes`) prevents graph explosion
- ✅ Deduplication (nodes/edges tracked in Maps)
- ✅ Handles CA-nodes (conflicts between args/claims)
- ✅ Handles PA-nodes (preference ordering)

**Performance:**
- Early termination on `maxNodes` (default 200)
- Visited set prevents cycles
- Batched claim fetches (though could be optimized further)

**Categorical Semantics:**
- ✅ Exploring morphisms in category (following A→B→C chains)
- ✅ CA/PA nodes = higher-order structure (conflict/preference on morphisms)
- ❌ No explicit hom-set computation (still individual arguments, not sets)

**Verdict:** ✅ **Production-ready neighborhood builder** (handles scale, filters work)

---

#### **Helper Function: `getNeighborhoodSummary(argumentId)`**

**Purpose:** Quick count of connections without full expansion (for UI hints).

**Returns:**
```typescript
{
  supportCount: number,
  conflictCount: number,
  preferenceCount: number,
  totalConnections: number
}
```

**What Works:**
- ✅ Fast counts via `prisma.count()` (no full fetches)
- ✅ Useful for "X more arguments connected" badges in UI

**Verdict:** ✅ **Efficient summary** (good for progressive disclosure UI)

---

### 3. Alternative AIF Builder (`aif-builder.ts`)

**Purpose:** Corrected version addressing schema mismatches.

**Key Fixes Documented:**
```typescript
/**
 * KEY FIXES:
 * 1. ArgumentDiagram has NO argumentId - can't be queried by argument
 * 2. ArgumentEdge uses fromArgumentId/toArgumentId (not fromId/toId)
 * 3. Arguments use ArgumentPremise -> Claim structure (simple, no diagram)
 */
```

**Functions:**
- `buildAifNeighborhood(argumentId, options)` - Similar to `diagram-neighborhoods.ts` but with schema corrections
- `expandNeighborhood(...)` - Recursive helper
- `convertArgumentToAif(argument)` - Simple converter (RA + I-nodes only, no CA/PA)
- `mapEdgeTypeToAifRole(edgeType, attackType)` - Maps `EdgeType` → AIF role

**What Works:**
- ✅ Correct field names (`fromArgumentId`, not `fromId`)
- ✅ Handles `ArgumentPremise → Claim` structure
- ✅ Edge type filtering (`support|rebut|undercut|concede`)

**Gaps vs `diagram.ts`:**
- ❌ No CA-node support (conflicts not built)
- ❌ No PA-node support (preferences not built)
- ❌ No AssumptionUse integration
- ❌ Simpler than `buildAifSubgraphForArgument`

**Status:**
- Appears to be **alternative/older implementation**
- `diagram.ts` version is more complete
- May have been created to fix specific bugs then left behind

**Verdict:** ⚠️ **Redundant with `diagram.ts`** (recommend consolidating or removing)

---

## 🔗 Integration Map: How Graph Builders Connect

```
┌─────────────────────────────────────────────────────────────┐
│                    API ENDPOINTS                            │
│  /api/arguments/[id]/route.ts                               │
│    → buildDiagramForArgument(id)                            │
│    → returns {ok: true, diagram: {statements, aif}}         │
│                                                              │
│  /api/arguments/[id]/aif-neighborhood/route.ts              │
│    → buildAifNeighborhood(id, depth, options)               │
│    → returns {ok: true, neighborhood: {nodes, edges}}       │
│  ↓ uses                                                     │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│                    GRAPH BUILDERS                           │
│  lib/arguments/diagram.ts                                   │
│    • buildAifSubgraphForArgument(id)                        │
│      → Fetch Argument + AssumptionUse + CA + PA             │
│      → Build I/RA/CA/PA nodes + edges                       │
│      → Deduplicate → return AifSubgraph                     │
│                                                              │
│    • buildDiagramForArgument(id)                            │
│      → Fetch Argument + supporting ArgumentEdges            │
│      → Build Toulmin Diagram                                │
│      → Attach AifSubgraph as .aif property                  │
│                                                              │
│  lib/arguments/diagram-neighborhoods.ts                     │
│    • buildAifNeighborhood(id, depth, options)               │
│      → Recursive BFS/DFS with depth limit                   │
│      → Filter by edge type (support/conflict/preference)    │
│      → Circuit breaker (maxNodes)                           │
│      → Build full neighborhood AifSubgraph                  │
│                                                              │
│    • getNeighborhoodSummary(id)                             │
│      → Fast counts (no full fetch)                          │
│  ↓ reads                                                    │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE (Prisma)                        │
│  Argument + ArgumentPremise → Claim                         │
│  ConflictApplication (CA-nodes)                             │
│  PreferenceApplication (PA-nodes)                           │
│  AssumptionUse (presumptions/exceptions)                    │
│  ArgumentEdge (support/rebut/undercut/concede)              │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Strengths: What's Working Well

### 1. **Comprehensive AIF Construction**
- Full I/RA/CA/PA node type support
- AssumptionUse integration (`has-presumption`/`has-exception`)
- Handles complex structures (convergent support, preferences)

### 2. **Two-Level Representation**
- `buildDiagramForArgument` returns **both** Toulmin diagram + AIF view
- Satisfies research requirement for "debate-level + argument-internals"
- Used by DeepDivePanelV2 (via DiagramViewer)

### 3. **Neighborhood Expansion**
- Depth-limited exploration (prevents graph explosion)
- Filter by connection type (support/conflict/preference)
- Circuit breaker (`maxNodes`) for scale safety
- Efficient summary counts (`getNeighborhoodSummary`)

### 4. **Deduplication**
- Map-based uniqueness for nodes/edges
- No duplicate fetches within single build

### 5. **AssumptionUse Integration**
- Exports `has-presumption`/`has-exception` edges
- **Critical for categorical belief revision** (tracking free variables)
- Aligns with Ambler's open vs closed λ-terms

---

## ❌ Gaps: Categorical Semantics Alignment

### Gap 1: No Hom-Set Materialization
**Research says:** Morphisms A→B = **set of arguments** {arg1, arg2, arg3}

**Current state:**
- `buildAifSubgraphForArgument` builds **single** argument's RA-node
- Multiple arguments A→B are **separate** RA-nodes, not grouped
- No `hom(A,B)` collection

**Impact:**
- Cannot compute join (∨) operation (union of argument sets)
- Cannot represent "pile up GROUNDS to answer WHY" as semilattice join
- Each argument stands alone, no accrual algebra

**Fix needed:**
```typescript
// Missing function:
function buildHomSet(fromClaimId: string, toClaimId: string): {
  arguments: string[];  // All argument IDs for A→B
  morphism: AifNode;    // Composite "hom(A,B)" node
}
```

---

### Gap 2: No Confidence Scoring Attached
**Research says:** Each morphism has confidence `c(f) ∈ [0,1]`

**Current state:**
- AIF nodes/edges have no `confidence` or `weight` property
- `AssumptionUse` has optional `weight` field, but not used in AIF construction
- No integration with `rulesetJson.confidence.mode`

**Impact:**
- Cannot compute weakest-link vs probabilistic accrual
- Cannot rank arguments by strength
- No support bars in UI

**Fix needed:**
- Add `confidence?: number` to `AifNode` type
- Compute from `AssumptionUse.weight` + scheme metadata
- Integrate with `lib/client/evidential.ts` (review in Chunk 2)

---

### Gap 3: Internal Hom [A,B] Not Pinpointed
**Research says:** Warrant is object `[A,B]`, UNDERCUTS should target specific inference

**Current state:**
- ✅ CA-nodes have `conflictedArgumentId` (targets whole RA)
- ❌ No `targetInferenceId` to pinpoint **which** [A,B] within multi-step argument
- `legacyTargetScope:'inference'` is a hint, but not precise

**Impact:**
- Undercuts target entire argument, not specific inference step
- Can't represent "attack the warrant from premise P1 to C, but not from P2 to C"

**Fix needed:**
- Add `targetInferenceId: string?` to `ConflictApplication` schema
- Update `buildAifSubgraphForArgument` to attach CA to specific `has-premise`/`conclusion` edge

---

### Gap 4: Convergent Support Partially Implemented
**Current state:**
```typescript
// Line 192-211 in diagram.ts:
const byGroup = new Map<string, string[]>(); // groupKey -> [claimId]
for (const p of arg.premises) {
  const g = (p.groupKey as string|undefined) ?? '__linked__';
  const arr = byGroup.get(g) ?? [];
  arr.push(p.claimId);
  byGroup.set(g, arr);
}
if (byGroup.size > 1) {
  // re-wire to multiple RA "views"
}
```

**Status:**
- ✅ Code exists for convergent vs linked support
- ❌ `ArgumentPremise` schema has **no `groupKey` field** (casting `as any[]`)
- ❌ Logic is unreachable (byGroup.size will always be 1)

**Fix needed:**
- Add `groupKey: string?` to `ArgumentPremise` schema
- OR: Remove dead code if feature not needed

---

### Gap 5: Redundant Implementations
**Files:**
- `diagram.ts` - Full-featured, AssumptionUse support, CA/PA nodes
- `aif-builder.ts` - Simpler, no CA/PA, correct field names

**Status:**
- ⚠️ Two implementations for similar task
- `diagram.ts` is **superior** (more complete)
- `aif-builder.ts` may have been bugfix attempt

**Recommendation:**
- **Consolidate** into single implementation
- Extract shared logic to helpers
- Remove `aif-builder.ts` if not used

---

## 🎯 Recommendations for Chunk 1B

### Quick Win (1-2 days):

1. **Remove or consolidate `aif-builder.ts`:**
   - Audit API usage: Does anything call `aif-builder.ts` functions?
   - If not: Delete file
   - If yes: Migrate to `diagram.ts` equivalents

2. **Fix convergent support or remove dead code:**
   ```prisma
   // Add to ArgumentPremise if feature needed:
   model ArgumentPremise {
     // ... existing fields
     groupKey String?  // NEW: for convergent support
   }
   ```
   OR: Remove lines 192-211 from `diagram.ts` if not using

### Medium Term (1 week):

3. **Add confidence scoring to AIF nodes:**
   ```typescript
   export type AifNode = {
     id: string;
     kind: AifNodeKind;
     label?: string | null;
     schemeKey?: string | null;
     confidence?: number;  // NEW: [0,1] score
   };
   ```

4. **Create hom-set builder:**
   ```typescript
   export async function buildHomSet(
     fromClaimId: string,
     toClaimId: string,
     deliberationId: string
   ): Promise<{argumentIds: string[]; confidence: number}> {
     // Find all arguments with conclusion=toClaimId, premise includes fromClaimId
     // Return as set + compute join score
   }
   ```

### Strategic (aligns with Phase 0 roadmap):

5. **Add `targetInferenceId` to ConflictApplication schema**
6. **Integrate with `lib/client/evidential.ts` confidence framework** (Chunk 2)

---

## 📊 Chunk 1B Metrics

| Metric | Value | Status |
|--------|-------|--------|
| AIF Node Type Coverage | 100% (I/RA/CA/PA) | ✅ Complete |
| AssumptionUse Integration | 100% (has-presumption/exception) | ✅ Complete |
| Neighborhood Expansion | 100% (depth-limited BFS) | ✅ Complete |
| Two-Level Representation | 100% (Diagram + .aif) | ✅ Complete |
| Hom-Set Materialization | 0% (no grouping) | ❌ Missing |
| Confidence Scoring | 0% (no weights attached) | ❌ Missing |
| Internal Hom Precision | 50% (targets RA, not specific [A,B]) | ⚠️ Partial |
| Code Consolidation | Needs work (2 implementations) | ⚠️ Redundant |

---

## 🔍 Key Discoveries

### 1. **AssumptionUse is Deeply Integrated**
- `diagram.ts` line 76-90: Full AssumptionUse → AIF edge conversion
- Exports `has-presumption` / `has-exception` roles
- **This is the "free variables" tracking needed for belief revision!**
- Aligns perfectly with Ambler's open λ-terms with uncertain assumptions

### 2. **Two-Level Representation Already Works**
- `buildDiagramForArgument` returns `{statements, inferences, evidence, aif}`
- Toulmin view + AIF view in single object
- Used by DeepDivePanelV2 (bug: wrong property access, but structure is correct)

### 3. **Neighborhood Builder is Sophisticated**
- Depth limiting + circuit breaker
- Edge type filtering (support/conflict/preference)
- Efficient summary counts
- **Production-ready for large deliberations**

### 4. **Missing Hom-Set Algebra is the Key Gap**
- Individual arguments built correctly
- CA/PA nodes connect them
- **But no grouping of {arg1, arg2, arg3} as single morphism A→B**
- This is the **core categorical operation** needed for accrual (∨)

---

## Next Steps

**Proceeding to Chunk 2:** Evidential Category Implementation
- `lib/client/evidential.ts` (confidence framework)
- `lib/agora/` core logic
- `app/api/deliberations/[id]/evidential/route.ts`
- Integration with confidence measures + hom-sets

**Key Questions for Chunk 2:**
- Does `evidential.ts` implement join (∨) and composition (∘)?
- Is `rulesetJson.confidence.mode` wired through?
- How do confidence measures map to AIF nodes?
- Is `ArgumentSupport` table implemented?
