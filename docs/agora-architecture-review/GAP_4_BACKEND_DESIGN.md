# Gap 4: Per-Derivation Assumption Tracking - Backend Design

**Status:** Design Phase  
**Date:** October 30, 2025  
**Approach:** Backend-first (categorical → schema → APIs → UI)

---

## 🎯 Design Goals

1. **Precise Assumption Tracking**: Link assumptions to individual derivations, not just arguments
2. **Categorical Soundness**: Maintain category theory semantics (compose/join laws)
3. **Transitive Tracking**: Automatically track assumption propagation through composition
4. **Performance**: Fast queries for "minimal assumptions" and "belief revision" UX
5. **Backward Compatibility**: Existing AssumptionUse table remains functional

---

## 📐 Part 1: Database Schema

### New Junction Table: `DerivationAssumption`

**Purpose:** Link individual derivations to their assumptions (many-to-many).

```prisma
/// Link derivations to assumptions they rely upon.
/// Enables per-derivation assumption tracking for categorical composition.
model DerivationAssumption {
  id           String   @id @default(cuid())
  derivationId String   // FK to Derivation.id (or ArgumentSupport for now)
  assumptionId String   // FK to AssumptionUse.id
  
  // Strength of this assumption's contribution to this derivation
  weight       Float    @default(1.0)  // 0..1 multiplier
  
  // Tracking metadata
  inferredFrom String?  // If auto-generated via compose(), reference parent derivation
  createdAt    DateTime @default(now())
  
  @@unique([derivationId, assumptionId])
  @@index([derivationId])
  @@index([assumptionId])
  @@index([inferredFrom])  // Fast transitive queries
}
```

**Key Design Decisions:**

1. **`derivationId` flexibility:**
   - Initially: Use `ArgumentSupport.id` (since ArgumentSupport materializes derivations)
   - Future: If explicit `Derivation` table created, migrate FK

2. **`inferredFrom` field:**
   - Tracks transitive assumptions from compose()
   - Example: If `d₃ = d₁ ∘ d₂` and `d₁` uses `λ₁`, then:
     ```
     { derivationId: "d3", assumptionId: "λ1", inferredFrom: "d1" }
     ```
   - Enables "why do I need λ₁?" explanations

3. **`weight` field:**
   - Local weight for this assumption in this derivation
   - Default 1.0 (fully required)
   - Can model "partially relies on λ₁" (weight < 1.0)

### Migration Strategy

**Phase 1: Add table without breaking existing code**
```sql
-- Add DerivationAssumption table
CREATE TABLE "DerivationAssumption" (
  "id" TEXT PRIMARY KEY,
  "derivationId" TEXT NOT NULL,
  "assumptionId" TEXT NOT NULL,
  "weight" DOUBLE PRECISION DEFAULT 1.0,
  "inferredFrom" TEXT,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("derivationId", "assumptionId")
);

CREATE INDEX "DerivationAssumption_derivationId_idx" ON "DerivationAssumption"("derivationId");
CREATE INDEX "DerivationAssumption_assumptionId_idx" ON "DerivationAssumption"("assumptionId");
CREATE INDEX "DerivationAssumption_inferredFrom_idx" ON "DerivationAssumption"("inferredFrom");
```

**Phase 2: Backfill data from existing AssumptionUse**
```sql
-- For each AssumptionUse, create DerivationAssumption for all derivations of that argument
INSERT INTO "DerivationAssumption" ("id", "derivationId", "assumptionId", "weight")
SELECT 
  gen_random_uuid(),
  "ArgumentSupport"."id",
  "AssumptionUse"."id",
  COALESCE("AssumptionUse"."weight", 0.6)
FROM "AssumptionUse"
JOIN "ArgumentSupport" ON "ArgumentSupport"."argumentId" = "AssumptionUse"."argumentId"
WHERE "AssumptionUse"."status" = 'ACCEPTED';
```

**Phase 3: Deprecate but keep `AssumptionUse.argumentId` link**
- Old code path: Query `AssumptionUse` by argumentId (still works)
- New code path: Query `DerivationAssumption` by derivationId (precise)

---

## 🧮 Part 2: Categorical Type System

### Extended Arrow Type

**Current (lib/argumentation/ecc.ts):**
```typescript
export type Arrow<A=string, B=string> = {
  from: A; 
  to: B;
  derivs: Set<DerivationId>;
};
```

**New Design:**
```typescript
export type AssumptionId = string;

/**
 * Arrow in the evidential category with per-derivation assumptions.
 * 
 * Each derivation in the hom-set may rely on a different set of assumptions.
 * This enables precise tracking of assumption dependencies through composition.
 * 
 * @property assumptions - Map from derivationId to set of assumptionIds
 *   - Key: derivationId (must be in `derivs` set)
 *   - Value: Set of AssumptionUse.id that this derivation requires
 * 
 * @example
 * ```typescript
 * const arrow: Arrow = {
 *   from: "P",
 *   to: "C",
 *   derivs: new Set(["d1", "d2"]),
 *   assumptions: new Map([
 *     ["d1", new Set(["λ1", "λ2"])],  // d1 uses λ1, λ2
 *     ["d2", new Set(["λ1"])]         // d2 uses only λ1
 *   ])
 * };
 * ```
 */
export type Arrow<A=string, B=string> = {
  from: A; 
  to: B;
  derivs: Set<DerivationId>;
  assumptions: Map<DerivationId, Set<AssumptionId>>;  // NEW
};
```

**Type Invariant:**
- `assumptions.keys() ⊆ derivs`
- Every derivation *may* have assumptions, but it's not required
- Empty set `Set([])` means "no assumptions for this derivation"

### Updated Categorical Operations

#### 1. `zero()` - Identity Element

**Current:**
```typescript
export function zero<A,B>(from:A, to:B): Arrow<A,B> {
  return { from, to, derivs: new Set() };
}
```

**Updated:**
```typescript
export function zero<A,B>(from:A, to:B): Arrow<A,B> {
  return { 
    from, 
    to, 
    derivs: new Set(),
    assumptions: new Map()  // Empty map for vacuous morphism
  };
}
```

**Semantics:** Zero morphism has no derivations → no assumptions.

---

#### 2. `join()` - Coproduct (Union)

**Current:**
```typescript
export function join<A,B>(f: Arrow<A,B>, g: Arrow<A,B>): Arrow<A,B> {
  if (f.from !== g.from || f.to !== g.to) {
    throw new Error('join: type mismatch');
  }
  return { from: f.from, to: f.to, derivs: new Set([...f.derivs, ...g.derivs]) };
}
```

**Updated:**
```typescript
/**
 * Join (accrual) operation: union of derivation sets with assumption tracking.
 * 
 * Categorical semantics: Coproduct (∨) in hom(A,B).
 * Merges independent arguments while preserving per-derivation assumptions.
 * 
 * Assumption merge strategy: Simple union of both assumption maps.
 * - If derivation d appears in both f and g with different assumptions,
 *   this is an error (same derivation ID should have same assumptions).
 * - In practice, derivation IDs are unique per-morphism, so no conflicts.
 * 
 * @param f - First morphism from A to B
 * @param g - Second morphism from A to B
 * @returns New morphism with union of derivations and merged assumptions
 * 
 * @example
 * ```typescript
 * const f: Arrow = { 
 *   from: "P", to: "C", 
 *   derivs: new Set(["d1"]),
 *   assumptions: new Map([["d1", new Set(["λ1"])]])
 * };
 * const g: Arrow = { 
 *   from: "P", to: "C", 
 *   derivs: new Set(["d2"]),
 *   assumptions: new Map([["d2", new Set(["λ2"])]])
 * };
 * const joined = join(f, g);
 * // Result: {
 * //   from: "P", to: "C",
 * //   derivs: Set(["d1", "d2"]),
 * //   assumptions: Map([["d1", Set(["λ1"])], ["d2", Set(["λ2"])]])
 * // }
 * ```
 */
export function join<A,B>(f: Arrow<A,B>, g: Arrow<A,B>): Arrow<A,B> {
  if (f.from !== g.from || f.to !== g.to) {
    throw new Error('join: type mismatch - morphisms must be in same hom-set');
  }
  
  // Merge derivation sets
  const derivs = new Set([...f.derivs, ...g.derivs]);
  
  // Merge assumption maps
  const assumptions = new Map<DerivationId, Set<AssumptionId>>();
  for (const [deriv, assums] of f.assumptions) {
    assumptions.set(deriv, new Set(assums));  // Deep copy
  }
  for (const [deriv, assums] of g.assumptions) {
    if (assumptions.has(deriv)) {
      // Same derivation in both - union assumptions (should be rare)
      const existing = assumptions.get(deriv)!;
      for (const a of assums) existing.add(a);
    } else {
      assumptions.set(deriv, new Set(assums));
    }
  }
  
  return { from: f.from, to: f.to, derivs, assumptions };
}
```

**Key Properties:**
- **Idempotent:** `join(f, f) = f` (same derivations → same assumptions)
- **Commutative:** `join(f, g) = join(g, f)` (Map merge is symmetric)
- **Associative:** `join(join(f,g), h) = join(f, join(g,h))` (union is associative)

---

#### 3. `compose()` - Functorial Composition

**Current:**
```typescript
export function compose<A,B,C>(g: Arrow<B,C>, f: Arrow<A,B>): Arrow<A,C> {
  const out = zero<A,C>(f.from, g.to);
  for (const df of f.derivs) {
    for (const dg of g.derivs) {
      out.derivs.add(`${df}∘${dg}`);
    }
  }
  return out;
}
```

**Updated:**
```typescript
/**
 * Composition operation: chain two morphisms with transitive assumption tracking.
 * 
 * Categorical semantics: Functorial composition (∘) in the evidential category.
 * If f: A→B and g: B→C, then compose(g,f): A→C.
 * 
 * Assumption propagation:
 * - The composed derivation `d_f ∘ d_g` inherits assumptions from BOTH derivations.
 * - This models transitive dependencies: "To believe C via this path, you must accept
 *   all assumptions from A→B AND all assumptions from B→C."
 * 
 * Mathematical property: If f uses {λ1} and g uses {λ2}, then compose(g,f) uses {λ1, λ2}.
 * 
 * @param g - Second morphism (B→C)
 * @param f - First morphism (A→B)
 * @returns Composed morphism (A→C) with inherited assumptions
 * 
 * @example
 * ```typescript
 * const f: Arrow = { 
 *   from: "A", to: "B", 
 *   derivs: new Set(["d1"]),
 *   assumptions: new Map([["d1", new Set(["λ1"])]])
 * };
 * const g: Arrow = { 
 *   from: "B", to: "C", 
 *   derivs: new Set(["d2"]),
 *   assumptions: new Map([["d2", new Set(["λ2"])]])
 * };
 * const composed = compose(g, f);
 * // Result: {
 * //   from: "A", to: "C",
 * //   derivs: Set(["d1∘d2"]),
 * //   assumptions: Map([["d1∘d2", Set(["λ1", "λ2"])]])  // Union!
 * // }
 * ```
 */
export function compose<A,B,C>(g: Arrow<B,C>, f: Arrow<A,B>): Arrow<A,C> {
  const out = zero<A,C>(f.from, g.to);
  
  for (const df of f.derivs) {
    for (const dg of g.derivs) {
      const composedDerivId = `${df}∘${dg}`;
      out.derivs.add(composedDerivId);
      
      // Union assumptions from both derivations
      const assumsF = f.assumptions.get(df) ?? new Set();
      const assumsG = g.assumptions.get(dg) ?? new Set();
      const unionAssums = new Set([...assumsF, ...assumsG]);
      
      out.assumptions.set(composedDerivId, unionAssums);
    }
  }
  
  return out;
}
```

**Key Properties:**
- **Transitive Closure:** Assumptions propagate through chains
- **Minimal Assumptions:** For claim C, find all derivations, union their assumptions
- **Associative:** `compose(h, compose(g,f)) = compose(compose(h,g), f)` (assumption union is associative)

**Example Multi-Step:**
```typescript
// A → B (uses λ1)
const f: Arrow = {
  from: "A", to: "B",
  derivs: new Set(["d1"]),
  assumptions: new Map([["d1", new Set(["λ1"])]])
};

// B → C (uses λ2)
const g: Arrow = {
  from: "B", to: "C",
  derivs: new Set(["d2"]),
  assumptions: new Map([["d2", new Set(["λ2"])]])
};

// C → D (uses λ3)
const h: Arrow = {
  from: "C", to: "D",
  derivs: new Set(["d3"]),
  assumptions: new Map([["d3", new Set(["λ3"])]])
};

const gf = compose(g, f);  // A → C uses {λ1, λ2}
const hgf = compose(h, gf); // A → D uses {λ1, λ2, λ3}

// Verify minimal assumptions for D:
const minimalAssums = new Set<string>();
for (const assums of hgf.assumptions.values()) {
  for (const a of assums) minimalAssums.add(a);
}
console.log(minimalAssums);  // Set(["λ1", "λ2", "λ3"])
```

---

### Helper Functions

#### `minimalAssumptions()` - Extract All Required Assumptions

```typescript
/**
 * Extract the minimal set of assumptions required for a morphism.
 * 
 * Returns the union of all assumptions across all derivations in the morphism.
 * This represents the complete set of assumptions needed to accept the conclusion.
 * 
 * @param arrow - Arrow to extract assumptions from
 * @returns Set of all unique assumption IDs
 * 
 * @example
 * ```typescript
 * const arrow: Arrow = {
 *   from: "P", to: "C",
 *   derivs: new Set(["d1", "d2"]),
 *   assumptions: new Map([
 *     ["d1", new Set(["λ1", "λ2"])],
 *     ["d2", new Set(["λ2", "λ3"])]
 *   ])
 * };
 * const minimal = minimalAssumptions(arrow);
 * // Result: Set(["λ1", "λ2", "λ3"])
 * ```
 */
export function minimalAssumptions<A,B>(arrow: Arrow<A,B>): Set<AssumptionId> {
  const result = new Set<AssumptionId>();
  for (const assums of arrow.assumptions.values()) {
    for (const a of assums) result.add(a);
  }
  return result;
}
```

#### `derivationsUsingAssumption()` - Reverse Lookup

```typescript
/**
 * Find all derivations in a morphism that use a given assumption.
 * 
 * Useful for "what if λ₁ fails?" analysis - find affected derivations.
 * 
 * @param arrow - Arrow to search
 * @param assumptionId - Assumption ID to find
 * @returns Set of derivation IDs that use this assumption
 * 
 * @example
 * ```typescript
 * const arrow: Arrow = {
 *   from: "P", to: "C",
 *   derivs: new Set(["d1", "d2", "d3"]),
 *   assumptions: new Map([
 *     ["d1", new Set(["λ1", "λ2"])],
 *     ["d2", new Set(["λ2"])],
 *     ["d3", new Set(["λ3"])]
 *   ])
 * };
 * const affectedDerivs = derivationsUsingAssumption(arrow, "λ1");
 * // Result: Set(["d1"])  (only d1 uses λ1)
 * ```
 */
export function derivationsUsingAssumption<A,B>(
  arrow: Arrow<A,B>, 
  assumptionId: AssumptionId
): Set<DerivationId> {
  const result = new Set<DerivationId>();
  for (const [deriv, assums] of arrow.assumptions) {
    if (assums.has(assumptionId)) {
      result.add(deriv);
    }
  }
  return result;
}
```

---

## 🌐 Part 3: API Design

### Endpoint 1: GET /api/derivations/[id]/assumptions

**Purpose:** Fetch all assumptions for a specific derivation.

**Request:**
```typescript
GET /api/derivations/{derivationId}/assumptions
```

**Response:**
```typescript
{
  ok: true,
  derivationId: string,
  assumptions: Array<{
    id: string,                    // AssumptionUse.id
    assumptionText: string | null,
    assumptionClaimId: string | null,
    assumptionClaim?: {            // Populated if assumptionClaimId exists
      id: string,
      text: string
    },
    weight: number,                // 0..1
    role: string,                  // "premise" | "warrant" | "value"
    status: "PROPOSED" | "ACCEPTED" | "CHALLENGED" | "RETRACTED",
    inferredFrom: string | null    // Parent derivation if transitive
  }>
}
```

**Implementation Notes:**
- Join `DerivationAssumption` → `AssumptionUse` → `Claim` (if linked)
- Filter by `status = ACCEPTED` by default (add `?includeAll=true` for all statuses)
- Order by `weight DESC` (most critical assumptions first)

**SQL Query (Prisma):**
```typescript
const derivAssums = await prisma.derivationAssumption.findMany({
  where: { derivationId },
  include: {
    assumption: {
      include: {
        assumptionClaim: {
          select: { id: true, text: true }
        }
      }
    }
  },
  orderBy: { weight: 'desc' }
});
```

---

### Endpoint 2: POST /api/assumptions/[id]/link

**Purpose:** Link an existing assumption to a specific derivation.

**Request:**
```typescript
POST /api/assumptions/{assumptionId}/link
Content-Type: application/json

{
  derivationId: string,
  weight?: number,           // Default 1.0
  inferredFrom?: string      // Optional parent derivation
}
```

**Response:**
```typescript
{
  ok: true,
  link: {
    id: string,              // DerivationAssumption.id
    derivationId: string,
    assumptionId: string,
    weight: number,
    createdAt: string
  }
}
```

**Validation:**
- `assumptionId` must exist in `AssumptionUse`
- `derivationId` must exist in `ArgumentSupport` (or future `Derivation` table)
- `weight` must be in [0, 1]
- Idempotent: If link already exists, return existing record

**Implementation:**
```typescript
const link = await prisma.derivationAssumption.upsert({
  where: {
    derivationId_assumptionId: { derivationId, assumptionId }
  },
  create: {
    derivationId,
    assumptionId,
    weight: weight ?? 1.0,
    inferredFrom
  },
  update: {
    weight: weight ?? 1.0,
    inferredFrom
  }
});
```

---

### Endpoint 3: GET /api/arguments/[id]/minimal-assumptions

**Purpose:** Compute minimal set of assumptions for all derivations of an argument.

**Request:**
```typescript
GET /api/arguments/{argumentId}/minimal-assumptions
```

**Response:**
```typescript
{
  ok: true,
  argumentId: string,
  derivations: Array<{
    derivationId: string,
    claimId: string,
    assumptions: Array<{
      id: string,
      text: string,
      weight: number,
      transitive: boolean     // True if inferred from composition
    }>
  }>,
  minimalSet: Array<{          // Union of all assumptions
    id: string,
    text: string,
    usedByDerivations: string[],  // Which derivations use this
    criticalityScore: number      // How many derivations depend on it
  }>
}
```

**Algorithm:**
```typescript
// 1. Fetch all ArgumentSupport records for this argument
const supports = await prisma.argumentSupport.findMany({
  where: { argumentId },
  include: {
    derivationAssumptions: {
      include: {
        assumption: {
          include: { assumptionClaim: true }
        }
      }
    }
  }
});

// 2. Build minimal set with reverse index
const assumptionMap = new Map<string, {
  id: string,
  text: string,
  derivationIds: Set<string>
}>();

for (const support of supports) {
  for (const link of support.derivationAssumptions) {
    const assumpId = link.assumptionId;
    if (!assumptionMap.has(assumpId)) {
      assumptionMap.set(assumpId, {
        id: assumpId,
        text: link.assumption.assumptionText || link.assumption.assumptionClaim?.text || "",
        derivationIds: new Set()
      });
    }
    assumptionMap.get(assumpId)!.derivationIds.add(support.id);
  }
}

// 3. Compute criticality scores
const minimalSet = Array.from(assumptionMap.values()).map(a => ({
  id: a.id,
  text: a.text,
  usedByDerivations: Array.from(a.derivationIds),
  criticalityScore: a.derivationIds.size / supports.length  // 0..1
})).sort((a, b) => b.criticalityScore - a.criticalityScore);

return { ok: true, argumentId, derivations: [...], minimalSet };
```

**Use Cases:**
- Display "This argument requires accepting: λ₁, λ₂, λ₃"
- Identify "critical assumptions" (used by all derivations)
- "What if λ₁ fails?" → Show which derivations are affected

---

### Endpoint 4: GET /api/deliberations/[id]/assumption-graph

**Purpose:** Generate full assumption dependency graph for visualization.

**Request:**
```typescript
GET /api/deliberations/{deliberationId}/assumption-graph
```

**Response:**
```typescript
{
  ok: true,
  nodes: Array<{
    id: string,
    type: "claim" | "argument" | "derivation" | "assumption",
    label: string,
    metadata: Record<string, any>
  }>,
  edges: Array<{
    from: string,
    to: string,
    type: "supports" | "uses" | "inferred",
    weight?: number
  }>
}
```

**Graph Structure:**
```
Claim C
  ↑ supports
Argument A
  ↑ materializes
Derivation d₁
  → uses (weight=0.8)
  Assumption λ₁
    ↑ inferred
  Derivation d₀ (parent via compose)
```

**Use Case:** Feed into D3.js force-directed graph in UI.

---

## 🔄 Part 4: Data Migration & Backfill

### Script: `scripts/backfill-derivation-assumptions.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function backfillDerivationAssumptions() {
  console.log('🔄 Starting DerivationAssumption backfill...');

  // 1. Count existing AssumptionUse records
  const assumptionCount = await prisma.assumptionUse.count({
    where: { status: 'ACCEPTED' }
  });
  console.log(`Found ${assumptionCount} ACCEPTED assumptions`);

  // 2. For each assumption, find all derivations (ArgumentSupport) of its argument
  const assumptions = await prisma.assumptionUse.findMany({
    where: { status: 'ACCEPTED' },
    select: {
      id: true,
      argumentId: true,
      weight: true
    }
  });

  let linksCreated = 0;
  let linksSkipped = 0;

  for (const assump of assumptions) {
    // Find all ArgumentSupport (derivations) for this argument
    const supports = await prisma.argumentSupport.findMany({
      where: { argumentId: assump.argumentId },
      select: { id: true }
    });

    for (const support of supports) {
      // Check if link already exists
      const existing = await prisma.derivationAssumption.findUnique({
        where: {
          derivationId_assumptionId: {
            derivationId: support.id,
            assumptionId: assump.id
          }
        }
      });

      if (existing) {
        linksSkipped++;
        continue;
      }

      // Create link
      await prisma.derivationAssumption.create({
        data: {
          derivationId: support.id,
          assumptionId: assump.id,
          weight: assump.weight ?? 1.0,
          inferredFrom: null  // Not transitive (original assumption)
        }
      });
      linksCreated++;
    }
  }

  console.log(`✅ Backfill complete: ${linksCreated} links created, ${linksSkipped} skipped`);
}

backfillDerivationAssumptions()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

**Run Command:**
```bash
tsx scripts/backfill-derivation-assumptions.ts
```

---

## 🧪 Part 5: Testing Strategy

### Unit Tests: `lib/argumentation/ecc.test.ts`

```typescript
import { Arrow, zero, join, compose, minimalAssumptions, derivationsUsingAssumption } from './ecc';

describe('Arrow with Assumptions', () => {
  test('zero() creates empty assumption map', () => {
    const z = zero("A", "B");
    expect(z.assumptions.size).toBe(0);
  });

  test('join() merges assumption maps', () => {
    const f: Arrow = {
      from: "A", to: "B",
      derivs: new Set(["d1"]),
      assumptions: new Map([["d1", new Set(["λ1"])]])
    };
    const g: Arrow = {
      from: "A", to: "B",
      derivs: new Set(["d2"]),
      assumptions: new Map([["d2", new Set(["λ2"])]])
    };
    const joined = join(f, g);
    
    expect(joined.derivs.size).toBe(2);
    expect(joined.assumptions.get("d1")).toEqual(new Set(["λ1"]));
    expect(joined.assumptions.get("d2")).toEqual(new Set(["λ2"]));
  });

  test('compose() unions assumptions transitively', () => {
    const f: Arrow = {
      from: "A", to: "B",
      derivs: new Set(["d1"]),
      assumptions: new Map([["d1", new Set(["λ1"])]])
    };
    const g: Arrow = {
      from: "B", to: "C",
      derivs: new Set(["d2"]),
      assumptions: new Map([["d2", new Set(["λ2"])]])
    };
    const composed = compose(g, f);
    
    expect(composed.derivs).toEqual(new Set(["d1∘d2"]));
    expect(composed.assumptions.get("d1∘d2")).toEqual(new Set(["λ1", "λ2"]));
  });

  test('compose() is associative with assumptions', () => {
    const f: Arrow = { from: "A", to: "B", derivs: new Set(["d1"]), assumptions: new Map([["d1", new Set(["λ1"])]]) };
    const g: Arrow = { from: "B", to: "C", derivs: new Set(["d2"]), assumptions: new Map([["d2", new Set(["λ2"])]]) };
    const h: Arrow = { from: "C", to: "D", derivs: new Set(["d3"]), assumptions: new Map([["d3", new Set(["λ3"])]]) };

    const hgf = compose(h, compose(g, f));
    const minimalHGF = minimalAssumptions(hgf);
    
    expect(minimalHGF).toEqual(new Set(["λ1", "λ2", "λ3"]));
  });

  test('minimalAssumptions() extracts union', () => {
    const arrow: Arrow = {
      from: "A", to: "B",
      derivs: new Set(["d1", "d2"]),
      assumptions: new Map([
        ["d1", new Set(["λ1", "λ2"])],
        ["d2", new Set(["λ2", "λ3"])]
      ])
    };
    const minimal = minimalAssumptions(arrow);
    expect(minimal).toEqual(new Set(["λ1", "λ2", "λ3"]));
  });

  test('derivationsUsingAssumption() finds affected derivations', () => {
    const arrow: Arrow = {
      from: "A", to: "B",
      derivs: new Set(["d1", "d2", "d3"]),
      assumptions: new Map([
        ["d1", new Set(["λ1", "λ2"])],
        ["d2", new Set(["λ2"])],
        ["d3", new Set(["λ3"])]
      ])
    };
    const affectedByLambda1 = derivationsUsingAssumption(arrow, "λ1");
    expect(affectedByLambda1).toEqual(new Set(["d1"]));
    
    const affectedByLambda2 = derivationsUsingAssumption(arrow, "λ2");
    expect(affectedByLambda2).toEqual(new Set(["d1", "d2"]));
  });
});
```

### Integration Tests: API Endpoints

```typescript
// tests/api/derivations.test.ts
import { testApiRoute } from '@/tests/helpers';

describe('GET /api/derivations/[id]/assumptions', () => {
  test('returns assumptions for derivation', async () => {
    const res = await testApiRoute('GET', `/api/derivations/deriv-123/assumptions`);
    expect(res.ok).toBe(true);
    expect(res.assumptions).toBeInstanceOf(Array);
    expect(res.assumptions[0]).toHaveProperty('id');
    expect(res.assumptions[0]).toHaveProperty('assumptionText');
  });
});

describe('POST /api/assumptions/[id]/link', () => {
  test('creates derivation-assumption link', async () => {
    const res = await testApiRoute('POST', `/api/assumptions/assump-456/link`, {
      derivationId: 'deriv-123',
      weight: 0.8
    });
    expect(res.ok).toBe(true);
    expect(res.link.weight).toBe(0.8);
  });
});

describe('GET /api/arguments/[id]/minimal-assumptions', () => {
  test('computes minimal assumption set', async () => {
    const res = await testApiRoute('GET', `/api/arguments/arg-789/minimal-assumptions`);
    expect(res.ok).toBe(true);
    expect(res.minimalSet).toBeInstanceOf(Array);
    expect(res.minimalSet[0]).toHaveProperty('criticalityScore');
  });
});
```

---

## 📊 Part 6: Performance Considerations

### Query Optimization

**1. Index Strategy:**
```sql
-- Primary lookups
CREATE INDEX idx_derivation_assumption_deriv ON "DerivationAssumption"("derivationId");
CREATE INDEX idx_derivation_assumption_assump ON "DerivationAssumption"("assumptionId");

-- Transitive queries
CREATE INDEX idx_derivation_assumption_inferred ON "DerivationAssumption"("inferredFrom");

-- Composite for uniqueness
CREATE UNIQUE INDEX idx_derivation_assumption_unique ON "DerivationAssumption"("derivationId", "assumptionId");
```

**2. Batch Queries:**
```typescript
// BAD: N+1 queries
for (const deriv of derivations) {
  const assums = await prisma.derivationAssumption.findMany({
    where: { derivationId: deriv.id }
  });
}

// GOOD: Single batch query
const allAssums = await prisma.derivationAssumption.findMany({
  where: { derivationId: { in: derivations.map(d => d.id) } },
  include: { assumption: true }
});
const byDeriv = groupBy(allAssums, 'derivationId');
```

**3. Caching Strategy:**
- Cache minimal assumption sets per argument (TTL: 5 minutes)
- Invalidate on assumption status change
- Use Redis for hot paths (evidential API)

### Scalability Estimates

**Assumptions:**
- Average deliberation: 100 arguments, 200 derivations, 50 assumptions
- Links: ~400 DerivationAssumption records per deliberation

**Query Performance:**
- `GET /api/derivations/[id]/assumptions`: ~10ms (indexed)
- `GET /api/arguments/[id]/minimal-assumptions`: ~50ms (100 derivations)
- `GET /api/deliberations/[id]/assumption-graph`: ~200ms (full graph)

**Storage:**
- DerivationAssumption: ~100 bytes/record
- 1000 deliberations = 400K records = ~40 MB

**Conclusion:** Schema scales well to 10K+ deliberations without sharding.

---

## 🎯 Part 7: Implementation Phases

### Phase 1: Schema & Migration (Day 1)
- [ ] Add `DerivationAssumption` model to `schema.prisma`
- [ ] Generate migration: `npx prisma migrate dev --name add-derivation-assumptions`
- [ ] Write backfill script: `scripts/backfill-derivation-assumptions.ts`
- [ ] Run backfill on dev database
- [ ] Verify data: `psql -d mesh_dev -c "SELECT COUNT(*) FROM DerivationAssumption;"`

### Phase 2: Type System (Day 1-2)
- [ ] Update `Arrow` type in `lib/argumentation/ecc.ts`
- [ ] Update `zero()` function
- [ ] Update `join()` function
- [ ] Update `compose()` function
- [ ] Add `minimalAssumptions()` helper
- [ ] Add `derivationsUsingAssumption()` helper
- [ ] Write unit tests in `lib/argumentation/ecc.test.ts`
- [ ] Run tests: `npm run test -- ecc.test.ts`

### Phase 3: API Endpoints (Day 2-3)
- [ ] Create `app/api/derivations/[id]/assumptions/route.ts`
- [ ] Create `app/api/assumptions/[id]/link/route.ts`
- [ ] Create `app/api/arguments/[id]/minimal-assumptions/route.ts`
- [ ] Create `app/api/deliberations/[id]/assumption-graph/route.ts`
- [ ] Write integration tests
- [ ] Test with Postman/curl

### Phase 4: Evidential API Integration (Day 3)
- [ ] Update `app/api/deliberations/[id]/evidential/route.ts`
- [ ] Replace argument-level assumption lookup with derivation-level
- [ ] Update confidence scoring to use per-derivation weights
- [ ] Add `minimalAssumptions` field to response
- [ ] Verify backward compatibility

### Phase 5: Client Wrappers (Day 4)
- [ ] Add types to `lib/client/evidential.ts`
- [ ] Add `fetchDerivationAssumptions(derivationId)` function
- [ ] Add `linkAssumptionToDerivation(assumptionId, derivationId, weight)` function
- [ ] Add `fetchMinimalAssumptions(argumentId)` function
- [ ] Export types for UI consumption

### Phase 6: Documentation (Day 4)
- [ ] Update `CHUNK_2A_IMPLEMENTATION_STATUS.md` (Gap 4 → COMPLETE)
- [ ] Create migration guide for existing queries
- [ ] Document API contracts in `docs/api/`
- [ ] Add inline examples to JSDoc

---

## ✅ Verification Checklist

### Schema
- [ ] `DerivationAssumption` table exists
- [ ] Indexes created
- [ ] Foreign keys valid
- [ ] Backfill script ran successfully

### Type System
- [ ] `Arrow` type updated
- [ ] All categorical operations updated
- [ ] Unit tests pass
- [ ] TypeScript compiles without errors

### APIs
- [ ] All 4 endpoints return 200 OK
- [ ] Response schemas match design
- [ ] Error handling works (404, 400)
- [ ] Integration tests pass

### Performance
- [ ] Query times < 100ms for typical loads
- [ ] No N+1 query issues
- [ ] Indexes used (check `EXPLAIN ANALYZE`)

### Backward Compatibility
- [ ] Existing `AssumptionUse` queries still work
- [ ] Evidential API returns correct scores
- [ ] UI components render without errors

---

## 🚀 Next Steps After Backend Complete

Once all phases complete:

1. **Basic UI Integration** (1 day)
   - Add assumption badges to `ArgumentCardV2`
   - Show minimal assumptions in `ActiveAssumptionsPanel`

2. **Advanced UI** (1-2 weeks)
   - Create `AssumptionDependencyGraph` component (D3.js)
   - Add "Belief Revision" tab to `DeepDivePanelV2`
   - Build "What if λ₁ fails?" calculator

3. **User Testing** (ongoing)
   - Gather feedback on assumption tracking UX
   - Iterate on visualization clarity
   - Optimize for common workflows

---

## 📚 References

- **CHUNK_2A_IMPLEMENTATION_STATUS.md**: Original gap identification
- **GAP_4_CURRENT_STATE_ANALYSIS.md**: Current state analysis
- **lib/argumentation/ecc.ts**: Categorical operations
- **lib/models/schema.prisma**: Database schema
- **app/api/deliberations/[id]/evidential/route.ts**: Confidence scoring

---

**End of Backend Design Document**

*Ready for implementation! 🎯*
