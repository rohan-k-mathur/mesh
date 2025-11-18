# AIF-ASPIC+ Translation Layer: Developer Guide

**Version**: 1.0  
**Last Updated**: 2025-01-20  
**Audience**: Developers, contributors

---

## Table of Contents

1. [Overview](#overview)
2. [Theoretical Foundation](#theoretical-foundation)
3. [Architecture](#architecture)
4. [Implementation Details](#implementation-details)
5. [API Reference](#api-reference)
6. [Testing Strategy](#testing-strategy)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The **AIF-ASPIC+ Translation Layer** provides bidirectional conversion between:

- **AIF (Argument Interchange Format)**: Graph-based representation with PA-nodes (Preference Applications)
- **ASPIC+ Knowledge Base**: Structured preference orderings (≤' for premises, ≤ for rules)

This translation layer enables ASPIC+ defeat computation to use preferences created through the AIF UI.

### Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| **AIF → ASPIC+** | `lib/aspic/translation/aifToASPIC.ts` | Populates KB preferences from PA-nodes |
| **ASPIC+ → AIF** | `lib/aspic/translation/aspicToAIF.ts` | Creates PA-nodes from KB preferences |
| **Integration** | `lib/aspic/translation/integration.ts` | Orchestrates translation + evaluation |
| **Types** | `lib/aspic/types.ts` | Shared type definitions |

---

## Theoretical Foundation

The translation follows **Definition 4.1** and **Definition 4.2** from Bex, Prakken, Reed (2013):

### Definition 4.1: AIF → ASPIC+

Given an AIF argument graph G = (V, E) with PA-nodes:

**Clause 5 (Premise Preferences)**:
```
≤' = {(vi, vj) | vi, vj ∈ K, ∃PA-node pa: I-node(vi) →[preferred] pa →[dispreferred] I-node(vj)}
```

**Translation**:
- Find all PA-nodes where `preferredClaimId` and `dispreferredClaimId` are set
- Extract claim texts (formulas) from I-nodes
- Add tuple `(preferred_formula, dispreferred_formula)` to `knowledgeBase.premisePreferences`

---

**Clause 6 (Rule Preferences)**:
```
≤ = {(ri, rj) | ri, rj ∈ R, ∃PA-node pa: RA-node(ri) →[preferred] pa →[dispreferred] RA-node(rj)}
```

**Translation**:
- Find all PA-nodes where `preferredArgumentId` and `dispreferredArgumentId` are set
- Map arguments to their schemes (defeasible rules in ASPIC+)
- Add tuple `(preferred_rule, dispreferred_rule)` to `knowledgeBase.rulePreferences`

---

### Definition 4.2: ASPIC+ → AIF

Given ASPIC+ theory T = (AS, KB):

**For premise preferences** (φ, ψ) ∈ ≤':
```
Create PA-node with:
  I-node(φ) →[preferred] PA →[dispreferred] I-node(ψ)
```

**For rule preferences** (r, r') ∈ ≤:
```
Create PA-node with:
  RA-node(r) →[preferred] PA →[dispreferred] RA-node(r')
```

**Translation**:
- For each preference tuple in KB, create corresponding `PreferenceApplication` record
- Link PA-nodes to existing Claims (I-nodes) and Arguments (RA-nodes)
- Skip duplicates (idempotent operation)

---

## Architecture

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                           │
│                  (PreferenceAttackModal.tsx)                     │
└──────────────────────┬──────────────────────────────────────────┘
                       │ POST /api/pa
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Prisma Database                             │
│               (PreferenceApplication model)                      │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       │ populateKBPreferencesFromAIF()
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│                   ASPIC+ Knowledge Base                          │
│         { premisePreferences: [...],                             │
│           rulePreferences: [...] }                               │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       │ computeDefeats()
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Defeat Computation                            │
│           (lib/aspic/defeats.ts)                                 │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       │ computeGroundedExtension()
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│                   Evaluation Results                             │
│    { groundedExtension, attacks, defeats, metrics }              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Details

### File: `lib/aspic/translation/aifToASPIC.ts`

#### Main Function: `populateKBPreferencesFromAIF()`

```typescript
export async function populateKBPreferencesFromAIF(
  deliberationId: string
): Promise<{
  premisePreferences: Array<{ preferred: string; dispreferred: string }>;
  rulePreferences: Array<{ preferred: string; dispreferred: string }>;
}> {
  // 1. Fetch all PA records for deliberation
  const paRecords = await prisma.preferenceApplication.findMany({
    where: { deliberationId },
    select: {
      id: true,
      preferredClaimId: true,
      dispreferredClaimId: true,
      preferredArgumentId: true,
      dispreferredArgumentId: true,
      preferredSchemeId: true,
      dispreferredSchemeId: true,
    },
  });

  const premisePrefs: Array<{ preferred: string; dispreferred: string }> = [];
  const rulePrefs: Array<{ preferred: string; dispreferred: string }> = [];

  for (const pa of paRecords) {
    // Clause 5: I-node to I-node → premise preference ≤'
    if (pa.preferredClaimId && pa.dispreferredClaimId) {
      const preferred = await getFormulaFromClaim(pa.preferredClaimId);
      const dispreferred = await getFormulaFromClaim(pa.dispreferredClaimId);
      if (preferred && dispreferred) {
        premisePrefs.push({ preferred, dispreferred });
      }
    }

    // Clause 6: RA-node to RA-node → rule preference ≤
    if (pa.preferredArgumentId && pa.dispreferredArgumentId) {
      const preferredRule = await getRuleIdFromArgument(pa.preferredArgumentId);
      const dispreferredRule = await getRuleIdFromArgument(pa.dispreferredArgumentId);
      if (preferredRule && dispreferredRule) {
        rulePrefs.push({ preferred: preferredRule, dispreferred: dispreferredRule });
      }
    }
  }

  return {
    premisePreferences: premisePrefs,
    rulePreferences: rulePrefs,
  };
}
```

**Key Design Decisions**:

1. **Batch Fetching**: Single query for all PA-nodes (avoids N+1 problem)
2. **Null Handling**: Skips incomplete PA-nodes gracefully
3. **Text Extraction**: Maps claim IDs → formula text (ASPIC+ uses strings)
4. **Rule Mapping**: Maps argument IDs → scheme IDs (schemes are rules in ASPIC+)

---

#### Helper: `getFormulaFromClaim()`

```typescript
async function getFormulaFromClaim(claimId: string): Promise<string | null> {
  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
    select: { text: true },
  });
  return claim?.text ?? null;
}
```

**Purpose**: Extracts formula text from AIF I-node (Claim)

**Performance**: Could be optimized with `Promise.all()` for parallel fetching

---

#### Helper: `getRuleIdFromArgument()`

```typescript
async function getRuleIdFromArgument(argumentId: string): Promise<string | null> {
  const argument = await prisma.argument.findUnique({
    where: { id: argumentId },
    include: { scheme: true },
  });

  if (!argument?.scheme) return null;

  // Use scheme ID as rule ID (schemes are defeasible rules in ASPIC+)
  return argument.scheme.id;
}
```

**Mapping Logic**:
- Arguments in AIF are built from **argumentation schemes**
- Schemes correspond to **defeasible rules** in ASPIC+
- We use scheme ID as the rule identifier

**Edge Case**: Arguments without schemes are skipped (typically strict rules or premises)

---

#### Utility: `computeTransitiveClosure()`

```typescript
export function computeTransitiveClosure(
  prefs: Array<{ preferred: string; dispreferred: string }>
): Array<{ preferred: string; dispreferred: string }> {
  // Build adjacency map: entity → set of worse entities
  const graph = new Map<string, Set<string>>();

  for (const { preferred, dispreferred } of prefs) {
    if (!graph.has(preferred)) graph.set(preferred, new Set());
    graph.get(preferred)!.add(dispreferred);

    // Ensure both nodes exist in graph
    if (!graph.has(dispreferred)) graph.set(dispreferred, new Set());
  }

  // Floyd-Warshall style transitive closure
  let changed = true;
  while (changed) {
    changed = false;
    for (const [a, aWorse] of graph) {
      for (const b of aWorse) {
        const bWorse = graph.get(b);
        if (bWorse) {
          for (const c of bWorse) {
            if (!aWorse.has(c)) {
              aWorse.add(c);
              changed = true;
            }
          }
        }
      }
    }
  }

  // Convert back to array format
  const result: Array<{ preferred: string; dispreferred: string }> = [];
  for (const [preferred, worseSet] of graph) {
    for (const dispreferred of worseSet) {
      result.push({ preferred, dispreferred });
    }
  }

  return result;
}
```

**Purpose**: Ensures transitivity (A < B, B < C ⟹ A < C)

**Algorithm**: Iterative graph traversal (similar to Floyd-Warshall)

**Complexity**: O(n³) where n = number of entities

**Use Case**: Optional—can be applied to ensure mathematical consistency

---

#### Utility: `detectPreferenceCycles()`

```typescript
export function detectPreferenceCycles(
  prefs: Array<{ preferred: string; dispreferred: string }>
): string[][] {
  // Build adjacency map
  const graph = new Map<string, Set<string>>();
  for (const { preferred, dispreferred } of prefs) {
    if (!graph.has(preferred)) graph.set(preferred, new Set());
    graph.get(preferred)!.add(dispreferred);
  }

  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recStack = new Set<string>();

  function dfs(node: string, path: string[]): void {
    visited.add(node);
    recStack.add(node);
    path.push(node);

    const neighbors = graph.get(node) ?? new Set();
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        dfs(neighbor, path);
      } else if (recStack.has(neighbor)) {
        // Cycle detected
        const cycleStart = path.indexOf(neighbor);
        cycles.push(path.slice(cycleStart));
      }
    }

    recStack.delete(node);
    path.pop();
  }

  for (const node of graph.keys()) {
    if (!visited.has(node)) {
      dfs(node, []);
    }
  }

  return cycles;
}
```

**Purpose**: Validates preferences for cycles (A < B < C < A)

**Algorithm**: Depth-first search with recursion stack tracking

**Complexity**: O(n + m) where n = entities, m = preferences

**Use Case**: Pre-evaluation validation to warn users

---

### File: `lib/aspic/translation/aspicToAIF.ts`

#### Main Function: `createPANodesFromASPICPreferences()`

```typescript
export async function createPANodesFromASPICPreferences(
  deliberationId: string,
  theory: { knowledgeBase: KnowledgeBase },
  userId: string
): Promise<{ created: number; skipped: number }> {
  let created = 0;
  let skipped = 0;

  // 1. Create PA-nodes for premise preferences (≤')
  for (const pref of theory.knowledgeBase.premisePreferences) {
    const preferredClaim = await getClaimIdFromFormula(pref.preferred, deliberationId);
    const dispreferredClaim = await getClaimIdFromFormula(pref.dispreferred, deliberationId);

    if (!preferredClaim || !dispreferredClaim) {
      skipped++;
      continue;
    }

    // Check if PA-node already exists
    const existing = await prisma.preferenceApplication.findFirst({
      where: {
        deliberationId,
        preferredClaimId: preferredClaim,
        dispreferredClaimId: dispreferredClaim,
      },
    });

    if (existing) {
      skipped++;
      continue;
    }

    await prisma.preferenceApplication.create({
      data: {
        deliberationId,
        createdById: userId,
        preferredClaimId: preferredClaim,
        dispreferredClaimId: dispreferredClaim,
      },
    });

    created++;
  }

  // 2. Create PA-nodes for rule preferences (≤)
  for (const pref of theory.knowledgeBase.rulePreferences) {
    const preferredArg = await getArgumentIdFromRuleId(pref.preferred, deliberationId);
    const dispreferredArg = await getArgumentIdFromRuleId(pref.dispreferred, deliberationId);

    if (!preferredArg || !dispreferredArg) {
      skipped++;
      continue;
    }

    const existing = await prisma.preferenceApplication.findFirst({
      where: {
        deliberationId,
        preferredArgumentId: preferredArg,
        dispreferredArgumentId: dispreferredArg,
      },
    });

    if (existing) {
      skipped++;
      continue;
    }

    await prisma.preferenceApplication.create({
      data: {
        deliberationId,
        createdById: userId,
        preferredArgumentId: preferredArg,
        dispreferredArgumentId: dispreferredArg,
      },
    });

    created++;
  }

  return { created, skipped };
}
```

**Key Features**:

1. **Idempotency**: Checks for existing PA-nodes before creating
2. **Reverse Mapping**: Formula text → Claim ID, Rule ID → Argument ID
3. **Graceful Handling**: Skips preferences that can't be mapped
4. **Metrics**: Returns counts of created vs skipped PA-nodes

---

### File: `lib/aspic/translation/integration.ts`

#### High-Level Orchestration: `evaluateWithAIFPreferences()`

```typescript
export async function evaluateWithAIFPreferences(
  deliberationId: string,
  theory: ArgumentationTheory,
  ordering: PreferenceOrdering = "last-link"
) {
  // STEP 1: Translate AIF PA-nodes → ASPIC+ KB preferences
  const { premisePreferences, rulePreferences } = await populateKBPreferencesFromAIF(
    deliberationId
  );

  // STEP 2: Update theory with preferences
  theory.knowledgeBase.premisePreferences = premisePreferences;
  theory.knowledgeBase.rulePreferences = rulePreferences;

  // STEP 3: Construct arguments
  const args = constructArguments(theory);

  // STEP 4: Compute attacks
  const attacks = computeAttacks(args, theory);

  // STEP 5: Compute defeats (with preferences)
  const defeats = computeDefeats(attacks, theory, ordering);

  // STEP 6: Compute extensions
  const extension = computeGroundedExtension(args, defeats);

  return {
    theory,
    arguments: args,
    attacks,
    defeats,
    groundedExtension: extension,
    metrics: {
      argumentCount: args.length,
      attackCount: attacks.length,
      defeatCount: defeats.length,
      computationTimeMs: 0, // TODO: Add timing
    },
  };
}
```

**Entry Point**: This is the main function called by API endpoints

**Pipeline**:
1. Translation (AIF → ASPIC+)
2. Theory enrichment
3. Argument construction
4. Attack computation
5. **Defeat computation (where preferences matter)**
6. Extension semantics

---

## API Reference

### POST /api/pa

**Purpose**: Create a new preference application (PA-node)

**Request Body**:
```typescript
{
  deliberationId: string;              // Required
  preferredArgumentId?: string;        // One of these pairs required
  dispreferredArgumentId?: string;
  preferredClaimId?: string;
  dispreferredClaimId?: string;
  preferredSchemeId?: string;
  dispreferredSchemeId?: string;
  justification?: string;              // Optional (Phase 4.3 fix)
  orderingPolicy?: "last-link" | "weakest-link";  // Optional (Phase 4.2)
  setComparison?: "elitist" | "democratic";       // Optional (Phase 4.2)
}
```

**Response**:
```typescript
{ ok: true, id: string }  // Created PA-node ID
```

**Example**:
```bash
curl -X POST /api/pa \
  -H "Content-Type: application/json" \
  -d '{
    "deliberationId": "delib123",
    "preferredArgumentId": "arg-abc",
    "dispreferredArgumentId": "arg-xyz",
    "justification": "Expert source is more credible",
    "orderingPolicy": "last-link"
  }'
```

---

### GET /api/aspic/evaluate

**Purpose**: Evaluate deliberation with ASPIC+ and return defeat graph

**Query Parameters**:
- `deliberationId`: string (required)
- `ordering`: "last-link" | "weakest-link" (optional, default: "last-link")

**Response**:
```typescript
{
  ok: true;
  deliberationId: string;
  ordering: string;
  theory: {
    argumentCount: number;
    ruleCount: number;
    premiseCount: number;
  };
  attacks: Array<{
    from: string;
    to: string;
    type: "rebut" | "undercut";
  }>;
  defeats: Array<{
    from: string;
    to: string;
    type: string;
    preferenceApplied: boolean;  // Did preferences block this attack?
  }>;
  defeatStatistics: {
    totalAttacks: number;
    totalDefeats: number;
    preferenceIndependent: number;  // Defeats that would happen anyway
    preferenceDependent: number;    // Defeats enabled by preferences
    blocked: number;                // Attacks blocked by preferences
  };
  groundedExtension: {
    inArguments: string[];
    outArguments: string[];
    undecidedArguments: string[];
  };
  metrics: {
    argumentCount: number;
    attackCount: number;
    defeatCount: number;
    computationTimeMs: number;
  };
}
```

**Example**:
```bash
curl "/api/aspic/evaluate?deliberationId=delib123&ordering=last-link"
```

---

### GET /api/arguments/[id]/defeats

**Purpose**: Get defeat information for specific argument

**Query Parameters**:
- `deliberationId`: string (required)

**Response**:
```typescript
{
  ok: true;
  argumentId: string;
  defeatsOn: Array<{
    defeater: string;
    type: string;
    preferenceApplied: boolean;
  }>;
  defeatsBy: Array<{
    defeated: string;
    type: string;
    preferenceApplied: boolean;
  }>;
}
```

**Example**:
```bash
curl "/api/arguments/arg-abc/defeats?deliberationId=delib123"
```

---

## Testing Strategy

### Unit Tests

**File**: `__tests__/aspic/translation.test.ts`

#### Test Coverage Matrix

| Category | Test Name | Purpose |
|----------|-----------|---------|
| AIF → ASPIC+ | `populates premise preferences from claim PA-nodes` | Verifies Clause 5 |
| AIF → ASPIC+ | `populates rule preferences from argument PA-nodes` | Verifies Clause 6 |
| AIF → ASPIC+ | `skips incomplete PA-nodes gracefully` | Error handling |
| ASPIC+ → AIF | `creates PA-nodes from premise preferences` | Reverse translation |
| ASPIC+ → AIF | `skips duplicate PA-nodes` | Idempotency |
| ASPIC+ → AIF | `creates PA-nodes from rule preferences` | Reverse translation |
| Round-Trip | `AIF → ASPIC → AIF preserves preferences` | Consistency |
| Validation | `computes transitive closure correctly` | Utility function |
| Validation | `detects preference cycles` | Cycle detection |

---

### Integration Tests

**Example 33 from Modgil & Prakken**:

```typescript
describe("Example 33 from Modgil & Prakken", () => {
  test("evaluates correctly with last-link ordering", async () => {
    // Setup from Example 33:
    // - Arguments: A, B, C
    // - Attacks: A attacks B, B attacks C
    // - Preferences: B > A (rule preference)

    const theory = setupExample33();

    const result = await evaluateWithAIFPreferences(
      testDelibId,
      theory,
      "last-link"
    );

    // Expected: B defeats A (B > A), C is in grounded extension
    expect(result.defeats.some(d => d.defeater.id === "B" && d.defeated.id === "A")).toBe(true);
    expect(result.defeats.some(d => d.defeater.id === "A" && d.defeated.id === "B")).toBe(false);
    expect(result.groundedExtension.inArguments.has("C")).toBe(true);
  });
});
```

---

## Performance Considerations

### Bottlenecks

1. **Database Queries**:
   - `populateKBPreferencesFromAIF()` makes N+1 queries for formula/rule lookups
   - **Solution**: Batch queries with `Promise.all()` or single JOIN query

2. **Transitive Closure**:
   - O(n³) complexity for large preference graphs
   - **Solution**: Skip closure computation for <100 preferences; warn for larger sets

3. **Repeated Evaluation**:
   - Full re-evaluation on every API call
   - **Solution**: Cache evaluation results; invalidate on PA create/delete

---

### Optimization Strategies

#### 1. Batch Database Queries

**Before** (N+1 problem):
```typescript
for (const pa of paRecords) {
  const preferred = await getFormulaFromClaim(pa.preferredClaimId);  // N queries
}
```

**After** (single query):
```typescript
const claimIds = paRecords.map(pa => pa.preferredClaimId).filter(Boolean);
const claims = await prisma.claim.findMany({
  where: { id: { in: claimIds } },
  select: { id: true, text: true },
});
const claimMap = new Map(claims.map(c => [c.id, c.text]));
```

---

#### 2. Caching Strategy

```typescript
// Cache key: deliberationId + ordering policy
const cacheKey = `eval:${deliberationId}:${ordering}`;

// Check cache
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

// Compute evaluation
const result = await evaluateWithAIFPreferences(...);

// Cache for 5 minutes
await redis.set(cacheKey, JSON.stringify(result), "EX", 300);

return result;
```

**Invalidation**: Clear cache when PA-nodes are created/deleted

---

#### 3. Incremental Evaluation

For large deliberations (>1000 arguments):

1. **Track Changes**: Record which arguments/preferences changed
2. **Partial Re-computation**: Only recompute affected subgraph
3. **Differential Updates**: Update defeats incrementally

**Implementation**: Future work (Phase 7 in roadmap)

---

## Troubleshooting

### Issue: "Preferences not affecting defeats"

**Diagnosis Checklist**:

1. **Verify translation ran**:
   ```typescript
   console.log("Premise prefs:", theory.knowledgeBase.premisePreferences);
   console.log("Rule prefs:", theory.knowledgeBase.rulePreferences);
   ```
   Expected: Non-empty arrays

2. **Check PA-node structure**:
   ```sql
   SELECT * FROM "PreferenceApplication" WHERE "deliberationId" = 'delib123';
   ```
   Ensure both `preferred*Id` and `dispreferred*Id` fields are set

3. **Verify attacks exist**:
   ```typescript
   console.log("Attacks:", attacks.length);
   ```
   Preferences only matter if arguments attack each other

4. **Check ordering policy match**:
   - PA-node has `orderingPolicy: "weakest-link"`
   - But evaluation uses `ordering: "last-link"`
   - Solution: Use same ordering for both

---

### Issue: "Cycle detected in preferences"

**Diagnosis**:
```typescript
const cycles = detectPreferenceCycles(premisePreferences);
console.log("Cycles found:", cycles);
```

**Solution**:
1. Review preference chain: A > B > C > A
2. Determine which preference is incorrect
3. Delete problematic PA-node
4. Re-evaluate

---

### Issue: "Performance degradation with >100 preferences"

**Diagnosis**:
```typescript
const startTime = Date.now();
const result = await evaluateWithAIFPreferences(...);
console.log("Evaluation took:", Date.now() - startTime, "ms");
```

**Solutions**:
1. **Skip transitive closure** for large graphs
2. **Enable caching** (Redis/memory)
3. **Batch database queries** (see optimization section)
4. **Profile with Chrome DevTools** to identify hotspots

---

## Code Examples

### Example 1: Manual Translation (AIF → ASPIC+)

```typescript
import { populateKBPreferencesFromAIF } from "@/lib/aspic/translation/aifToASPIC";

async function myEvaluationFunction(deliberationId: string) {
  // 1. Get preferences from AIF
  const { premisePreferences, rulePreferences } = await populateKBPreferencesFromAIF(
    deliberationId
  );

  // 2. Build theory (assumes you have this function)
  const theory = await buildTheoryFromDeliberation(deliberationId);

  // 3. Inject preferences
  theory.knowledgeBase.premisePreferences = premisePreferences;
  theory.knowledgeBase.rulePreferences = rulePreferences;

  // 4. Continue with ASPIC+ evaluation
  const args = constructArguments(theory);
  const attacks = computeAttacks(args, theory);
  const defeats = computeDefeats(attacks, theory, "last-link");

  return { args, attacks, defeats };
}
```

---

### Example 2: Creating PA-Nodes Programmatically

```typescript
import { createPANodesFromASPICPreferences } from "@/lib/aspic/translation/aspicToAIF";

async function exportPreferencesToAIF(deliberationId: string, userId: string) {
  // 1. Build ASPIC+ theory with preferences
  const theory: ArgumentationTheory = {
    system: { /* ... */ },
    knowledgeBase: {
      premises: new Set(["p1", "p2"]),
      axioms: new Set(),
      premisePreferences: [
        { preferred: "p1", dispreferred: "p2" }  // p1 > p2
      ],
      rulePreferences: [
        { preferred: "rule1", dispreferred: "rule2" }  // rule1 > rule2
      ],
    },
  };

  // 2. Export to AIF PA-nodes
  const { created, skipped } = await createPANodesFromASPICPreferences(
    deliberationId,
    theory,
    userId
  );

  console.log(`Created ${created} PA-nodes, skipped ${skipped} duplicates`);
}
```

---

### Example 3: Cycle Detection and Handling

```typescript
import { detectPreferenceCycles } from "@/lib/aspic/translation/aifToASPIC";

async function validatePreferences(deliberationId: string) {
  const { premisePreferences } = await populateKBPreferencesFromAIF(deliberationId);

  const cycles = detectPreferenceCycles(premisePreferences);

  if (cycles.length > 0) {
    console.warn("Preference cycles detected:");
    cycles.forEach((cycle, i) => {
      console.log(`Cycle ${i + 1}:`, cycle.join(" > "), "> ...");
    });

    // Optionally: Remove one preference from each cycle to break it
    // (Not implemented here—would require choosing which preference to remove)
  }
}
```

---

## Architecture Decisions

### Why Not Store Preferences Directly in Arguments?

**Decision**: Preferences are stored in separate `PreferenceApplication` model, not as fields on `Argument`

**Rationale**:
1. **Separation of Concerns**: Arguments are logical structures; preferences are meta-level judgments
2. **AIF Compliance**: AIF specifies PA-nodes as separate graph elements
3. **Flexibility**: Preferences can relate claims, arguments, or schemes
4. **Auditability**: Easy to track who created which preferences and when

---

### Why Use Scheme IDs as Rule IDs?

**Decision**: Map `argument.schemeId` → ASPIC+ rule ID

**Rationale**:
1. **Conceptual Mapping**: Argumentation schemes ARE defeasible inference rules
2. **Existing Data**: Schemes already have IDs in database
3. **Consistency**: Scheme preferences (`preferredSchemeId`) align naturally

**Alternative Considered**: Generate synthetic rule IDs from argument structure
- Rejected: Would require complex serialization and makes debugging harder

---

### Why Lazy Evaluation Instead of Eager?

**Decision**: Evaluation happens on-demand via API call, not automatically on PA create

**Rationale**:
1. **Performance**: Large deliberations are expensive to evaluate
2. **User Control**: Users may create multiple preferences before evaluating
3. **Caching**: Can cache evaluation results between PA changes

**Alternative Considered**: Trigger evaluation on every PA create
- Rejected: Would cause poor UX with long waits after each preference

---

## Future Work

### Phase 5: Advanced Features

- **Weighted Preferences**: Add confidence scores (0-1 scale)
- **Preference Schemes**: Formalize justification patterns
- **Conflict Resolution UI**: Interactive cycle breaking
- **Bulk Operations**: CSV import/export for preferences

### Phase 6: Visualization

- **Preference Graph View**: Interactive graph with nodes and edges
- **Cycle Highlighting**: Visual warning for circular preferences
- **Transitive Closure Display**: Show inferred preferences
- **Evaluation Animation**: Step-through of defeat computation

### Phase 7: Optimization

- **Incremental Evaluation**: Only recompute affected subgraph
- **Preference Caching**: Redis-backed cache with TTL
- **Parallel Evaluation**: Worker threads for large deliberations
- **Index Optimization**: Database indexes on `preferredArgumentId`, `dispreferredArgumentId`

---

## References

- **Modgil & Prakken (2014)**: [A General Account of Argumentation with Preferences](https://doi.org/10.1016/j.artint.2013.08.003)
- **Bex, Prakken, Reed (2013)**: [AIF Formal Analysis Using the ASPIC Framework](https://www.researchgate.net/publication/262271677)
- **Dung (1995)**: [On the Acceptability of Arguments](https://doi.org/10.1016/0004-3702(94)00041-X)
- **User Guide**: `docs/user-guides/ASPIC_Preferences_Guide.md`
- **Phase 4 Roadmap**: `ASPIC_PHASE4_PREFERENCES_ROADMAP_V2.md`

---

## Contact

For questions or contributions:
- **GitHub Issues**: [Create an issue](https://github.com/rohan-k-mathur/mesh/issues)
- **Developer Docs**: See `AGENTS.md` for contribution guidelines
- **Slack**: #argumentation-dev channel

---

**Last Updated**: 2025-01-20  
**Version**: 1.0  
**Status**: Production-ready
