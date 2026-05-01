# Phase 5 Complete: Client Wrappers

## Overview
Added TypeScript client wrapper functions to `lib/client/evidential.ts` for all 4 new Gap 4 endpoints. These functions provide type-safe, documented interfaces for UI components to interact with per-derivation assumption tracking.

## Functions Added

### 1. `fetchDerivationAssumptions(derivationId, includeAll?)`
**Purpose**: Fetch all assumptions for a specific derivation.

**Parameters**:
- `derivationId: string` - The ID of the derivation (ArgumentSupport)
- `includeAll?: boolean` - If true, includes CANDIDATE and REJECTED (default: false, only ACCEPTED)

**Returns**: `Promise<DerivationAssumption[]>`

**Type Definition**:
```typescript
export type DerivationAssumption = {
  id: string;
  derivationId: string;
  assumptionId: string;
  weight: number;
  status: "ACCEPTED" | "CANDIDATE" | "REJECTED";
  inferredFrom: string | null;
  createdAt: string;
  updatedAt: string;
  assumptionUse?: {
    id: string;
    claimId: string;
    claim: {
      text: string;
    };
  };
};
```

**Example Usage**:
```typescript
// Get accepted assumptions only
const assumptions = await fetchDerivationAssumptions("deriv123");

// Get all assumptions including candidates
const allAssumptions = await fetchDerivationAssumptions("deriv123", true);
```

**API Route**: `GET /api/derivations/[id]/assumptions?includeAll=true`

---

### 2. `linkAssumptionToDerivation(params)`
**Purpose**: Link an assumption to a derivation (or update existing link). Idempotent operation.

**Parameters**:
```typescript
{
  assumptionId: string;
  derivationId: string;
  weight: number;           // 0.0 to 1.0
  status?: "ACCEPTED" | "CANDIDATE" | "REJECTED";
  inferredFrom?: string;    // Optional: transitive assumption tracking
}
```

**Returns**: `Promise<DerivationAssumption>`

**Example Usage**:
```typescript
// Link assumption with high confidence
const link = await linkAssumptionToDerivation({
  assumptionId: "assump123",
  derivationId: "deriv456",
  weight: 0.9
});

// Link transitive assumption
const transitive = await linkAssumptionToDerivation({
  assumptionId: "assump789",
  derivationId: "deriv456",
  weight: 0.7,
  inferredFrom: "assump123"
});
```

**API Route**: `POST /api/assumptions/[id]/link`

**Body Validation** (Zod):
- `weight`: Must be between 0 and 1
- `status`: Must be valid enum value
- `inferredFrom`: Optional string or null

---

### 3. `fetchMinimalAssumptions(argumentId)`
**Purpose**: Compute the minimal set of assumptions for an argument with criticality scores.

**Parameters**:
- `argumentId: string` - The ID of the argument

**Returns**: `Promise<MinimalAssumptionsResponse>`

**Type Definition**:
```typescript
export type MinimalAssumptionsResponse = {
  ok: boolean;
  argumentId: string;
  minimalSet: Array<{
    assumptionId: string;
    assumptionText: string;
    usedByDerivations: string[];
    criticalityScore: number;  // 0.0 to 1.0
  }>;
  meta: {
    totalDerivations: number;
    uniqueAssumptions: number;
  };
};
```

**Example Usage**:
```typescript
const result = await fetchMinimalAssumptions("arg123");

console.log(`Argument has ${result.meta.totalDerivations} derivations`);
console.log(`Uses ${result.meta.uniqueAssumptions} assumptions`);

for (const assump of result.minimalSet) {
  console.log(`${assump.assumptionText}: ${assump.criticalityScore.toFixed(2)}`);
}
```

**API Route**: `GET /api/arguments/[id]/minimal-assumptions`

**Criticality Score Formula**:
```
criticalityScore = usedByDerivations.length / totalDerivations
```

---

### 4. `fetchAssumptionGraph(deliberationId)`
**Purpose**: Fetch complete assumption dependency graph for D3.js visualization.

**Parameters**:
- `deliberationId: string` - The ID of the deliberation

**Returns**: `Promise<AssumptionGraphResponse>`

**Type Definition**:
```typescript
export type AssumptionGraphResponse = {
  ok: boolean;
  deliberationId: string;
  nodes: Array<{
    id: string;
    type: "claim" | "argument" | "derivation" | "assumption";
    text?: string;
  }>;
  edges: Array<{
    source: string;
    target: string;
    type: "supports" | "uses" | "inferred";
    weight?: number;
  }>;
  meta: {
    claimNodes: number;
    argumentNodes: number;
    derivationNodes: number;
    assumptionNodes: number;
    totalEdges: number;
  };
};
```

**Example Usage**:
```typescript
const graph = await fetchAssumptionGraph("room123");

// Use with D3.js force simulation
const simulation = d3.forceSimulation(graph.nodes)
  .force("link", d3.forceLink(graph.edges).id(d => d.id))
  .force("charge", d3.forceManyBody())
  .force("center", d3.forceCenter());
```

**API Route**: `GET /api/deliberations/[id]/assumption-graph`

**Node Types**:
- `claim`: Deliberation claims
- `argument`: Supporting arguments
- `derivation`: Specific inference paths (ArgumentSupport)
- `assumption`: Background assumptions

**Edge Types**:
- `supports`: Argument → Claim
- `uses`: Derivation → Assumption
- `inferred`: Assumption → Assumption (transitive)

---

## Integration Points

### UI Components
These client wrappers can be used in:
- **Argument Cards**: Show assumptions per derivation
- **Assumption Panels**: Link/unlink assumptions
- **Criticality Views**: Display minimal assumption sets
- **Graph Visualizations**: Render dependency graphs with D3.js

### State Management
All functions return promises and can be integrated with:
- React Query/SWR for caching
- Redux/Zustand for state management
- React hooks for data fetching

### Error Handling
All functions throw errors with descriptive messages:
```typescript
try {
  const assumptions = await fetchDerivationAssumptions("invalid-id");
} catch (error) {
  console.error("Failed to fetch:", error.message);
  // "Failed to fetch derivation assumptions: HTTP 404"
}
```

---

## Files Modified
- `lib/client/evidential.ts` (+235 lines)

## Code Quality
- ✅ No TypeScript errors
- ✅ Full JSDoc documentation
- ✅ Type-safe interfaces
- ✅ Usage examples for each function
- ✅ Consistent error handling
- ✅ Follows existing code conventions

## Status
✅ **Phase 5 Complete**: All 4 client wrapper functions implemented with full TypeScript types and documentation.

## Next: Phase 6
Update documentation:
- Mark Gap 4 as COMPLETE in `CHUNK_2A_IMPLEMENTATION_STATUS.md`
- Create comprehensive API reference
- Write migration guide for existing code
- Add integration examples
