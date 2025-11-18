# ASPIC+ Phase 4: Preference & Ordering System - Implementation Roadmap (V2)

**Date**: 2025-01-17  
**Status**: ⏳ Ready to begin  
**Duration**: 6 days  
**Version**: 2.0 (Post-Infrastructure Audit)

**Related Documents**:
- Theoretical Foundation: `docs/arg-computation-research/ASPIC_Argumentation with Preferences.md`
- AIF Integration: `docs/arg-computation-research/AIF Formal Analysis Using the ASPIC Framework.md`
- Infrastructure Audit: `ASPIC_PHASE4_INFRASTRUCTURE_AUDIT.md`
- Original Roadmap (archived): `ASPIC_PHASE4_PREFERENCES_ROADMAP.md`

---

## Executive Summary

### What Already Exists ✅

**AIF Preferences (PA-Nodes)**:
- ✅ `PreferenceApplication` Prisma model (line 2671 in schema.prisma)
- ✅ `POST /api/pa` endpoint for creating preferences
- ✅ `PreferenceAttackModal` UI (800+ lines) - full-featured PA creation
- ✅ `PreferenceBadge` displays aggregate preference counts
- ✅ AIF import/export with PA-node support (`lib/aif/import.ts`, `lib/aif/jsonld.ts`)

**ASPIC+ Defeat Logic**:
- ✅ Complete implementation in `lib/aspic/defeats.ts` (400+ lines)
- ✅ Last-link ordering (compare last defeasible rules)
- ✅ Weakest-link ordering (compare all rules + premises)
- ✅ Elitist set comparison (X < Y if ∃x∈X: ∀y∈Y, x < y)
- ✅ Democratic set comparison (X < Y if ∀x∈X: ∃y∈Y, x ≤ y)
- ✅ Reasonable ordering validation (strict & firm > fallible)
- ✅ Special cases: undercutting (always defeats), assumptions (always defeated)

### The Critical Gap ❌

**No translation layer** connecting AIF PA-nodes ↔ ASPIC+ KB preferences:
- ❌ `lib/aspic/defeats.ts` reads from `theory.knowledgeBase.premisePreferences` and `rulePreferences`
- ❌ These arrays are **never populated** from `PreferenceApplication` records
- ❌ No function implements Definition 4.1 (AIF → ASPIC+ translation)
- ❌ No function implements Definition 4.2 (ASPIC+ → AIF translation)

**Minor Gaps**:
- ⚠️ Ordering policy not stored in PA-nodes (always uses hardcoded default)
- ⚠️ Justification field collected in `PreferenceAttackModal` but not saved (bug)
- ⚠️ No API to evaluate with specific ordering policy
- ⚠️ No UI for selecting ordering policy

### Phase 4 Strategy

**Focus**: Build translation layer, not implementation from scratch

**Work Breakdown**:
- 50% **Translation Layer** - AIF ↔ ASPIC+ bidirectional conversion (Definition 4.1, 4.2)
- 25% **API Enhancement** - Expose defeat computation with ordering policies
- 20% **UI Enhancement** - Ordering selectors, preference preview, justification fix
- 5% **Schema Extension** - Add 3 optional fields to existing model

---

## Phase 4.1: Translation Layer (3 days) 🔥 PRIMARY WORK

### Overview

Build bidirectional translation between AIF PA-nodes and ASPIC+ preferences per Bex et al. formal definitions.

**Definition 4.1 (AIF → ASPIC+)**:
```
≤' = {(vi, vj) | vi, vj ∈ K, ∃PA-node: vi →[preferred] PA →[dispreferred] vj}
≤ = {(ri, rj) | ri, rj ∈ R, ∃PA-node: rai →[preferred] PA →[dispreferred] raj}
```

**Definition 4.2 (ASPIC+ → AIF)**:
```
For each (φ, ψ) ∈ ≤': Create PA-node with I-node(φ) →[preferred] PA →[dispreferred] I-node(ψ)
For each (r, r') ∈ ≤: Create PA-node with RA-node(r) →[preferred] PA →[dispreferred] RA-node(r')
```

### Files to Create

#### 1. `lib/aspic/translation/aifToASPIC.ts` (Day 1-2, ~350 lines)

```typescript
/**
 * AIF → ASPIC+ Translation (Definition 4.1)
 * Populates ASPIC+ KnowledgeBase preferences from AIF PreferenceApplication records
 */

import { prisma } from "@/lib/prismaclient";
import type { KnowledgeBase } from "@/lib/aspic/types";

/**
 * Main translation function: Fetch PA-nodes → populate KB preferences
 */
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

/**
 * Map Claim ID → formula text
 * AIF I-nodes contain claims; ASPIC+ KB uses formula strings
 */
async function getFormulaFromClaim(claimId: string): Promise<string | null> {
  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
    select: { text: true },
  });
  return claim?.text ?? null;
}

/**
 * Map Argument ID → Rule ID
 * Arguments are built from defeasible rules; extract the rule ID
 */
async function getRuleIdFromArgument(argumentId: string): Promise<string | null> {
  const argument = await prisma.argument.findUnique({
    where: { id: argumentId },
    include: { scheme: true },
  });

  if (!argument?.scheme) return null;

  // Use scheme ID as rule ID (schemes are defeasible rules in ASPIC+)
  return argument.scheme.id;
}

/**
 * Compute transitive closure of preferences
 * Ensures: A < B, B < C ⟹ A < C
 */
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

/**
 * Validate preferences (detect cycles)
 */
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

#### 2. `lib/aspic/translation/aspicToAIF.ts` (Day 2, ~250 lines)

```typescript
/**
 * ASPIC+ → AIF Translation (Definition 4.2)
 * Creates AIF PA-nodes from ASPIC+ KnowledgeBase preferences
 */

import { prisma } from "@/lib/prismaclient";
import type { KnowledgeBase } from "@/lib/aspic/types";

/**
 * Main translation function: KB preferences → create PA-nodes
 */
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

/**
 * Map formula text → Claim ID (reverse of getFormulaFromClaim)
 */
async function getClaimIdFromFormula(
  formula: string,
  deliberationId: string
): Promise<string | null> {
  const claim = await prisma.claim.findFirst({
    where: {
      text: formula,
      deliberationId,
    },
    select: { id: true },
  });
  return claim?.id ?? null;
}

/**
 * Map Rule ID → Argument ID (reverse of getRuleIdFromArgument)
 */
async function getArgumentIdFromRuleId(
  ruleId: string,
  deliberationId: string
): Promise<string | null> {
  const argument = await prisma.argument.findFirst({
    where: {
      schemeId: ruleId,
      deliberationId,
    },
    select: { id: true },
  });
  return argument?.id ?? null;
}
```

#### 3. `lib/aspic/translation/integration.ts` (Day 3, ~200 lines)

```typescript
/**
 * High-level integration orchestration
 * Combines ASPIC+ evaluation with AIF preference translation
 */

import { populateKBPreferencesFromAIF } from "./aifToASPIC";
import { createPANodesFromASPICPreferences } from "./aspicToAIF";
import { constructArguments } from "@/lib/aspic/arguments";
import { computeAttacks } from "@/lib/aspic/attacks";
import { computeDefeats } from "@/lib/aspic/defeats";
import { computeGroundedExtension } from "@/lib/aspic/semantics";
import type { ArgumentationTheory, PreferenceOrdering } from "@/lib/aspic/types";

/**
 * Evaluate deliberation with AIF preferences
 * Main entry point combining translation + evaluation
 */
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

/**
 * Sync ASPIC+ preferences back to AIF
 * Creates PA-nodes for preferences not yet in AIF
 */
export async function syncPreferencesToAIF(
  deliberationId: string,
  theory: ArgumentationTheory,
  userId: string
) {
  const result = await createPANodesFromASPICPreferences(deliberationId, theory, userId);
  return result;
}
```

### Testing Strategy

#### Unit Tests (`__tests__/aspic/translation.test.ts`)

```typescript
describe("AIF → ASPIC+ Translation", () => {
  test("populates premise preferences from claim PA-nodes", async () => {
    // Create test PA-node: Claim A > Claim B
    const pa = await prisma.preferenceApplication.create({
      data: {
        deliberationId: testDelibId,
        preferredClaimId: claimA.id,
        dispreferredClaimId: claimB.id,
        createdById: testUserId,
      },
    });

    const { premisePreferences } = await populateKBPreferencesFromAIF(testDelibId);

    expect(premisePreferences).toContainEqual({
      preferred: claimA.text,
      dispreferred: claimB.text,
    });
  });

  test("populates rule preferences from argument PA-nodes", async () => {
    // Create test PA-node: Argument A > Argument B
    const pa = await prisma.preferenceApplication.create({
      data: {
        deliberationId: testDelibId,
        preferredArgumentId: argA.id,
        dispreferredArgumentId: argB.id,
        createdById: testUserId,
      },
    });

    const { rulePreferences } = await populateKBPreferencesFromAIF(testDelibId);

    expect(rulePreferences).toContainEqual({
      preferred: argA.schemeId,
      dispreferred: argB.schemeId,
    });
  });

  test("computes transitive closure correctly", () => {
    const prefs = [
      { preferred: "A", dispreferred: "B" },
      { preferred: "B", dispreferred: "C" },
    ];

    const closure = computeTransitiveClosure(prefs);

    expect(closure).toContainEqual({ preferred: "A", dispreferred: "C" });
  });

  test("detects preference cycles", () => {
    const prefs = [
      { preferred: "A", dispreferred: "B" },
      { preferred: "B", dispreferred: "C" },
      { preferred: "C", dispreferred: "A" }, // Cycle!
    ];

    const cycles = detectPreferenceCycles(prefs);

    expect(cycles.length).toBeGreaterThan(0);
    expect(cycles[0]).toContain("A");
    expect(cycles[0]).toContain("B");
    expect(cycles[0]).toContain("C");
  });
});

describe("ASPIC+ → AIF Translation", () => {
  test("creates PA-nodes from premise preferences", async () => {
    const theory: ArgumentationTheory = {
      system: createEmptyAS(),
      knowledgeBase: {
        ...createEmptyKB(),
        premisePreferences: [{ preferred: claimA.text, dispreferred: claimB.text }],
      },
    };

    const { created } = await createPANodesFromASPICPreferences(
      testDelibId,
      theory,
      testUserId
    );

    expect(created).toBe(1);

    const pa = await prisma.preferenceApplication.findFirst({
      where: {
        deliberationId: testDelibId,
        preferredClaimId: claimA.id,
        dispreferredClaimId: claimB.id,
      },
    });

    expect(pa).not.toBeNull();
  });

  test("skips duplicate PA-nodes", async () => {
    // Create PA-node manually
    await prisma.preferenceApplication.create({
      data: {
        deliberationId: testDelibId,
        preferredClaimId: claimA.id,
        dispreferredClaimId: claimB.id,
        createdById: testUserId,
      },
    });

    const theory: ArgumentationTheory = {
      system: createEmptyAS(),
      knowledgeBase: {
        ...createEmptyKB(),
        premisePreferences: [{ preferred: claimA.text, dispreferred: claimB.text }],
      },
    };

    const { created, skipped } = await createPANodesFromASPICPreferences(
      testDelibId,
      theory,
      testUserId
    );

    expect(created).toBe(0);
    expect(skipped).toBe(1);
  });
});

describe("Round-Trip Translation", () => {
  test("AIF → ASPIC → AIF preserves preferences", async () => {
    // Create initial PA-node
    const pa = await prisma.preferenceApplication.create({
      data: {
        deliberationId: testDelibId,
        preferredClaimId: claimA.id,
        dispreferredClaimId: claimB.id,
        createdById: testUserId,
      },
    });

    // Translate to ASPIC+
    const { premisePreferences } = await populateKBPreferencesFromAIF(testDelibId);

    // Translate back to AIF
    const theory: ArgumentationTheory = {
      system: createEmptyAS(),
      knowledgeBase: {
        ...createEmptyKB(),
        premisePreferences,
      },
    };

    await createPANodesFromASPICPreferences(testDelibId, theory, testUserId);

    // Verify PA-node still exists with same data
    const paAfter = await prisma.preferenceApplication.findFirst({
      where: {
        deliberationId: testDelibId,
        preferredClaimId: claimA.id,
        dispreferredClaimId: claimB.id,
      },
    });

    expect(paAfter).not.toBeNull();
    expect(paAfter?.id).toBe(pa.id); // Same PA-node (not duplicate)
  });
});
```

#### Integration Test (Example 33)

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

### Acceptance Criteria

- ✅ `populateKBPreferencesFromAIF()` correctly extracts premise and rule preferences
- ✅ `createPANodesFromASPICPreferences()` creates PA-nodes without duplicates
- ✅ Transitive closure computed correctly (A < B, B < C ⟹ A < C)
- ✅ Cycle detection warns about circular preferences
- ✅ Round-trip translation preserves preferences (AIF → ASPIC → AIF)
- ✅ Example 33 evaluates correctly with preferences
- ✅ All unit tests pass
- ✅ Integration test with real database passes

---

## Phase 4.2: Schema Extension & API Enhancement (1 day)

### Part A: Schema Migration (0.5 day)

**Update**: `lib/models/schema.prisma` (line 2671)

```prisma
model PreferenceApplication {
  // ... existing fields: id, deliberationId, schemeId, createdById, createdAt
  // ... preferredClaimId, preferredArgumentId, preferredSchemeId
  // ... dispreferredClaimId, dispreferredArgumentId, dispreferredSchemeId

  // NEW: ASPIC+ ordering metadata (optional - defaults to system-wide policy)
  orderingPolicy  String? // "last-link" | "weakest-link" | null (use deliberation default)
  setComparison   String? // "elitist" | "democratic" | null (use default elitist)
  justification   String? @db.Text // Fix bug: UI collects but doesn't save

  // ... existing relations
}
```

**Migration**:
```bash
npx prisma db push
npx prisma generate
```

**Rationale**:
- Minimal changes (3 optional fields)
- Backward compatible (existing PA-nodes work without metadata)
- Allows per-preference ordering overrides (advanced use case)
- Fixes justification bug

### Part B: API Endpoints (0.5 day)

#### 1. Update `app/api/pa/route.ts`

**Add to POST schema**:

```typescript
const CreatePA = z.object({
  deliberationId: z.string().min(6),
  schemeKey: z.string().optional(),
  
  // Preferred/dispreferred (existing fields)
  preferredArgumentId: z.string().optional(),
  preferredClaimId: z.string().optional(),
  preferredSchemeId: z.string().optional(),
  dispreferredArgumentId: z.string().optional(),
  dispreferredClaimId: z.string().optional(),
  dispreferredSchemeId: z.string().optional(),
  
  // NEW: ASPIC+ metadata
  orderingPolicy: z.enum(["last-link", "weakest-link"]).optional(),
  setComparison: z.enum(["elitist", "democratic"]).optional(),
  justification: z.string().optional(), // Fix bug
});

export async function POST(req: NextRequest) {
  // ... existing validation ...
  
  const created = await prisma.preferenceApplication.create({
    data: {
      deliberationId: d.deliberationId,
      schemeId: scheme?.id ?? null,
      createdById: String(uid),
      preferredArgumentId: d.preferredArgumentId ?? null,
      preferredClaimId: d.preferredClaimId ?? null,
      preferredSchemeId: d.preferredSchemeId ?? null,
      dispreferredArgumentId: d.dispreferredArgumentId ?? null,
      dispreferredClaimId: d.dispreferredClaimId ?? null,
      dispreferredSchemeId: d.dispreferredSchemeId ?? null,
      
      // NEW fields
      orderingPolicy: d.orderingPolicy ?? null,
      setComparison: d.setComparison ?? null,
      justification: d.justification ?? null,
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, id: created.id }, NO_STORE);
}
```

#### 2. Create `app/api/aspic/evaluate/route.ts`

**New endpoint for ASPIC+ evaluation with ordering policy**:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { evaluateWithAIFPreferences } from "@/lib/aspic/translation/integration";
import { buildTheoryFromDeliberation } from "@/lib/aspic/theoryBuilder";
import { z } from "zod";

const NO_STORE = { headers: { "Cache-Control": "no-store" } } as const;

const EvaluateQuery = z.object({
  deliberationId: z.string().min(6),
  ordering: z.enum(["last-link", "weakest-link"]).optional().default("last-link"),
});

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const query = EvaluateQuery.safeParse({
    deliberationId: url.searchParams.get("deliberationId"),
    ordering: url.searchParams.get("ordering"),
  });

  if (!query.success) {
    return NextResponse.json(
      { error: query.error.flatten() },
      { status: 400, ...NO_STORE }
    );
  }

  const { deliberationId, ordering } = query.data;

  // Build ASPIC+ theory from deliberation
  const theory = await buildTheoryFromDeliberation(deliberationId);

  // Evaluate with AIF preferences
  const result = await evaluateWithAIFPreferences(deliberationId, theory, ordering);

  return NextResponse.json(
    {
      ok: true,
      deliberationId,
      ordering,
      theory: {
        argumentCount: result.arguments.length,
        ruleCount: theory.system.defeasibleRules.length,
        premiseCount: theory.knowledgeBase.premises.size,
      },
      attacks: result.attacks.map(a => ({
        from: a.attacker.id,
        to: a.attacked.id,
        type: a.type,
      })),
      defeats: result.defeats.map(d => ({
        from: d.defeater.id,
        to: d.defeated.id,
        type: d.attack.type,
        preferenceApplied: d.preferenceApplied,
      })),
      defeatStatistics: {
        totalAttacks: result.attacks.length,
        totalDefeats: result.defeats.length,
        preferenceIndependent: result.defeats.filter(d => !d.preferenceApplied).length,
        preferenceDependent: result.defeats.filter(d => d.preferenceApplied).length,
        blocked: result.attacks.length - result.defeats.length,
      },
      groundedExtension: {
        inArguments: Array.from(result.groundedExtension.inArguments),
        outArguments: Array.from(result.groundedExtension.outArguments),
        undecidedArguments: Array.from(result.groundedExtension.undecidedArguments),
      },
      metrics: result.metrics,
    },
    NO_STORE
  );
}
```

#### 3. Create `app/api/arguments/[id]/defeats/route.ts`

**Get defeats on/by specific argument**:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { evaluateWithAIFPreferences } from "@/lib/aspic/translation/integration";
import { buildTheoryFromDeliberation } from "@/lib/aspic/theoryBuilder";

const NO_STORE = { headers: { "Cache-Control": "no-store" } } as const;

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const argumentId = params.id;
  const url = new URL(req.url);
  const deliberationId = url.searchParams.get("deliberationId");

  if (!deliberationId) {
    return NextResponse.json(
      { error: "deliberationId required" },
      { status: 400, ...NO_STORE }
    );
  }

  const theory = await buildTheoryFromDeliberation(deliberationId);
  const result = await evaluateWithAIFPreferences(deliberationId, theory, "last-link");

  const defeatsOn = result.defeats.filter(d => d.defeated.id === argumentId);
  const defeatsBy = result.defeats.filter(d => d.defeater.id === argumentId);

  return NextResponse.json(
    {
      ok: true,
      argumentId,
      defeatsOn: defeatsOn.map(d => ({
        defeater: d.defeater.id,
        type: d.attack.type,
        preferenceApplied: d.preferenceApplied,
      })),
      defeatsBy: defeatsBy.map(d => ({
        defeated: d.defeated.id,
        type: d.attack.type,
        preferenceApplied: d.preferenceApplied,
      })),
    },
    NO_STORE
  );
}
```

### Testing

```typescript
describe("POST /api/pa with new fields", () => {
  test("saves justification field", async () => {
    const response = await fetch("/api/pa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deliberationId: testDelibId,
        preferredArgumentId: argA.id,
        dispreferredArgumentId: argB.id,
        justification: "Expert source is more credible",
      }),
    });

    expect(response.ok).toBe(true);
    const { id } = await response.json();

    const pa = await prisma.preferenceApplication.findUnique({ where: { id } });
    expect(pa?.justification).toBe("Expert source is more credible");
  });

  test("saves ordering policy and set comparison", async () => {
    const response = await fetch("/api/pa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deliberationId: testDelibId,
        preferredArgumentId: argA.id,
        dispreferredArgumentId: argB.id,
        orderingPolicy: "weakest-link",
        setComparison: "democratic",
      }),
    });

    expect(response.ok).toBe(true);
    const { id } = await response.json();

    const pa = await prisma.preferenceApplication.findUnique({ where: { id } });
    expect(pa?.orderingPolicy).toBe("weakest-link");
    expect(pa?.setComparison).toBe("democratic");
  });
});

describe("GET /api/aspic/evaluate", () => {
  test("evaluates with last-link ordering", async () => {
    const response = await fetch(
      `/api/aspic/evaluate?deliberationId=${testDelibId}&ordering=last-link`
    );

    expect(response.ok).toBe(true);
    const data = await response.json();

    expect(data.ordering).toBe("last-link");
    expect(data.attacks).toBeInstanceOf(Array);
    expect(data.defeats).toBeInstanceOf(Array);
    expect(data.defeatStatistics).toBeDefined();
  });

  test("evaluates with weakest-link ordering", async () => {
    const response = await fetch(
      `/api/aspic/evaluate?deliberationId=${testDelibId}&ordering=weakest-link`
    );

    expect(response.ok).toBe(true);
    const data = await response.json();

    expect(data.ordering).toBe("weakest-link");
  });
});
```

### Acceptance Criteria

- ✅ Schema migration successful (`npx prisma db push`)
- ✅ `POST /api/pa` accepts `justification`, `orderingPolicy`, `setComparison`
- ✅ `GET /api/aspic/evaluate` returns evaluation with specified ordering
- ✅ `GET /api/arguments/:id/defeats` returns defeats on/by argument
- ✅ Defeat statistics included in evaluate response
- ✅ All API tests pass

---

## Phase 4.3: UI Enhancement (1.5 days)

### Part A: Fix PreferenceAttackModal (0.5 day)

**File**: `components/agora/PreferenceAttackModal.tsx` (line ~200-300)

**Changes**:

1. **Add Justification to API Call** (fix bug):

```typescript
// BEFORE:
const response = await fetch("/api/pa", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    deliberationId,
    preferredArgumentId: ...,
    dispreferredArgumentId: ...,
    // justification is collected in UI but NOT sent (BUG!)
  }),
});

// AFTER:
const response = await fetch("/api/pa", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    deliberationId,
    preferredArgumentId: ...,
    dispreferredArgumentId: ...,
    justification, // FIX: Send justification
  }),
});
```

2. **Add Ordering Policy Selectors** (advanced section):

```typescript
// Add to modal state
const [orderingPolicy, setOrderingPolicy] = useState<"last-link" | "weakest-link" | null>(null);
const [setComparison, setSetComparison] = useState<"elitist" | "democratic" | null>(null);

// Add UI controls (collapsible "Advanced" section)
<Collapsible>
  <CollapsibleTrigger>
    <Button variant="ghost" size="sm">
      Advanced Options
      <ChevronDown className="h-4 w-4 ml-2" />
    </Button>
  </CollapsibleTrigger>
  <CollapsibleContent>
    <div className="space-y-4 p-4 border rounded-md">
      <div>
        <Label>Ordering Policy</Label>
        <Select value={orderingPolicy ?? undefined} onValueChange={v => setOrderingPolicy(v as any)}>
          <SelectTrigger>
            <SelectValue placeholder="Use default" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>Use default</SelectItem>
            <SelectItem value="last-link">Last-link (legal/normative)</SelectItem>
            <SelectItem value="weakest-link">Weakest-link (epistemic)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label>Set Comparison</Label>
        <Select value={setComparison ?? undefined} onValueChange={v => setSetComparison(v as any)}>
          <SelectTrigger>
            <SelectValue placeholder="Use default (elitist)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>Use default (elitist)</SelectItem>
            <SelectItem value="elitist">Elitist</SelectItem>
            <SelectItem value="democratic">Democratic</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  </CollapsibleContent>
</Collapsible>

// Send to API
const response = await fetch("/api/pa", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    deliberationId,
    preferredArgumentId,
    dispreferredArgumentId,
    justification,
    orderingPolicy, // NEW
    setComparison,  // NEW
  }),
});
```

### Part B: Enhance PreferenceBadge (0.5 day)

**File**: `components/aif/PreferenceBadge.tsx`

**Changes**:

1. **Add Tooltip with Details**:

```typescript
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

export function PreferenceBadge({
  preferredBy,
  dispreferredBy,
  argumentId,
  deliberationId,
}: {
  preferredBy: number;
  dispreferredBy: number;
  argumentId: string;
  deliberationId: string;
}) {
  const [details, setDetails] = useState<any>(null);
  
  // Fetch defeat details on hover
  useEffect(() => {
    if (!argumentId) return;
    fetch(`/api/arguments/${argumentId}/defeats?deliberationId=${deliberationId}`)
      .then(r => r.json())
      .then(setDetails)
      .catch(console.error);
  }, [argumentId, deliberationId]);
  
  if (preferredBy === 0 && dispreferredBy === 0) return null;
  
  const net = preferredBy - dispreferredBy;
  const color = net > 0 ? "emerald" : net < 0 ? "red" : "neutral";
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge variant={color}>
            {preferredBy > 0 && `↑${preferredBy}`}
            {preferredBy > 0 && dispreferredBy > 0 && " / "}
            {dispreferredBy > 0 && `↓${dispreferredBy}`}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-sm">
          <div className="space-y-2 text-sm">
            <div>
              <strong>Preference Summary</strong>
            </div>
            <div>
              Preferred by: {preferredBy}
            </div>
            <div>
              Dispreferred by: {dispreferredBy}
            </div>
            {details && (
              <>
                <div className="border-t pt-2 mt-2">
                  <strong>Defeats</strong>
                </div>
                <div>
                  Defeats {details.defeatsBy.length} arguments
                </div>
                <div>
                  Defeated by {details.defeatsOn.length} arguments
                </div>
              </>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
```

### Part C: Create OrderingPolicySelector Component (0.5 day)

**New File**: `components/aspic/OrderingPolicySelector.tsx`

```typescript
/**
 * Global ordering policy selector for deliberation
 * Allows switching between last-link/weakest-link and elitist/democratic
 */

import { useState, useEffect } from "react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function OrderingPolicySelector({
  deliberationId,
  onOrderingChange,
}: {
  deliberationId: string;
  onOrderingChange?: (ordering: string) => void;
}) {
  const [orderingFamily, setOrderingFamily] = useState<"last-link" | "weakest-link">("last-link");
  const [setComparison, setSetComparison] = useState<"elitist" | "democratic">("elitist");
  const [impactPreview, setImpactPreview] = useState<any>(null);

  // Compute impact when ordering changes
  useEffect(() => {
    const ordering = `${orderingFamily}-${setComparison}`;
    
    // Fetch evaluation with current ordering
    fetch(`/api/aspic/evaluate?deliberationId=${deliberationId}&ordering=${orderingFamily}`)
      .then(r => r.json())
      .then(data => {
        setImpactPreview(data.defeatStatistics);
        onOrderingChange?.(ordering);
      })
      .catch(console.error);
  }, [orderingFamily, setComparison, deliberationId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preference Ordering Policy</CardTitle>
        <CardDescription>
          Controls how argument preferences are compared
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Label>Ordering Family</Label>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-semibold">Last-link:</p>
                <p className="text-sm">Compare only the last defeasible rule. Suitable for legal/normative reasoning.</p>
                <p className="font-semibold mt-2">Weakest-link:</p>
                <p className="text-sm">Compare all rules and premises. Suitable for epistemic reasoning.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Select value={orderingFamily} onValueChange={v => setOrderingFamily(v as any)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last-link">
                <div>
                  <div className="font-medium">Last-link</div>
                  <div className="text-xs text-muted-foreground">Legal/normative reasoning</div>
                </div>
              </SelectItem>
              <SelectItem value="weakest-link">
                <div>
                  <div className="font-medium">Weakest-link</div>
                  <div className="text-xs text-muted-foreground">Epistemic reasoning</div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Label>Set Comparison</Label>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-semibold">Elitist:</p>
                <p className="text-sm">X {"<"} Y if ∃x∈X: ∀y∈Y, x {"<"} y (has one element better than all of Y)</p>
                <p className="font-semibold mt-2">Democratic:</p>
                <p className="text-sm">X {"<"} Y if ∀x∈X: ∃y∈Y, x ≤ y (every element has something in Y it beats)</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Select value={setComparison} onValueChange={v => setSetComparison(v as any)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="elitist">
                <div>
                  <div className="font-medium">Elitist</div>
                  <div className="text-xs text-muted-foreground">One element better than all</div>
                </div>
              </SelectItem>
              <SelectItem value="democratic">
                <div>
                  <div className="font-medium">Democratic</div>
                  <div className="text-xs text-muted-foreground">Every element beats something</div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {impactPreview && (
          <div className="border-t pt-4 mt-4">
            <div className="text-sm font-medium mb-2">Impact Preview</div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div>Total attacks: {impactPreview.totalAttacks}</div>
              <div className="text-green-600">Total defeats: {impactPreview.totalDefeats}</div>
              <div className="text-red-600">Blocked by preferences: {impactPreview.blocked}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### Testing

```typescript
describe("PreferenceAttackModal with new fields", () => {
  test("sends justification to API", async () => {
    render(<PreferenceAttackModal sourceArgumentId={argA.id} deliberationId={testDelibId} />);
    
    // Fill in justification
    const textarea = screen.getByPlaceholderText(/reason/i);
    await userEvent.type(textarea, "Expert source is more credible");
    
    // Submit
    const submitButton = screen.getByRole("button", { name: /submit/i });
    await userEvent.click(submitButton);
    
    // Verify API called with justification
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/pa", expect.objectContaining({
        body: expect.stringContaining("Expert source is more credible"),
      }));
    });
  });

  test("sends ordering policy when selected", async () => {
    render(<PreferenceAttackModal sourceArgumentId={argA.id} deliberationId={testDelibId} />);
    
    // Expand advanced options
    const advancedToggle = screen.getByText(/advanced/i);
    await userEvent.click(advancedToggle);
    
    // Select weakest-link
    const orderingSelect = screen.getByLabelText(/ordering policy/i);
    await userEvent.selectOptions(orderingSelect, "weakest-link");
    
    // Submit
    const submitButton = screen.getByRole("button", { name: /submit/i });
    await userEvent.click(submitButton);
    
    // Verify API called with orderingPolicy
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/pa", expect.objectContaining({
        body: expect.stringContaining("weakest-link"),
      }));
    });
  });
});
```

### Acceptance Criteria

- ✅ `PreferenceAttackModal` sends `justification` to API (bug fixed)
- ✅ Advanced options section with ordering policy selectors
- ✅ `PreferenceBadge` shows defeat details in tooltip
- ✅ `OrderingPolicySelector` allows switching between policies
- ✅ Impact preview shows before/after defeat counts
- ✅ All UI tests pass

---

## Phase 4.4: Documentation & Testing (0.5 day)

### User Documentation

**Create**: `docs/user-guides/ASPIC_Preferences_Guide.md`

```markdown
# Understanding Preferences in ASPIC+

## What Are Preferences?

Preferences allow you to specify that one argument is stronger than another. This affects which attacks succeed as defeats during evaluation.

## Creating Preferences

1. Select an argument
2. Click "Add Preference"
3. Choose the target argument
4. Optionally, add a justification (e.g., "Expert source is more credible")
5. Submit

## Ordering Policies

### Last-link (Legal/Normative Reasoning)

Compares only the **last defeasible rule** in each argument.

**Use when**: The final inference step is most critical (e.g., legal reasoning where final rule application matters most)

**Example**:
- Argument A: Expert says X ⇒ Conclusion
- Argument B: Study shows Y ⇒ Conclusion
- If "Study" rule preferred over "Expert" rule, B defeats A

### Weakest-link (Epistemic Reasoning)

Compares **all defeasible rules and all premises**.

**Use when**: Uncertainty propagates through the chain (e.g., scientific reasoning where each step must be sound)

**Example**:
- Argument A: Weak premise + Strong rule
- Argument B: Strong premise + Weak rule
- Both dimensions must be better for A < B

## Set Comparisons

### Elitist

X < Y if X has **one element worse than all elements in Y**

**More restrictive**: Rarely concludes X < Y

### Democratic

X < Y if **every element in X is beaten by something in Y**

**More permissive**: Often concludes X < Y

## Example Walkthrough

(Include Example 33 from Modgil & Prakken paper here with diagrams)
```

### Developer Documentation

**Create**: `docs/developer-guides/AIF_ASPIC_Translation.md`

```markdown
# AIF-ASPIC+ Translation Layer

## Overview

The translation layer connects AIF PA-nodes (Preference Application) with ASPIC+ KB preferences per Bex, Prakken, Reed (2013) formal definitions.

## Definition 4.1: AIF → ASPIC+

Given AIF argument graph G = (V, E):

**Clause 5 (Premise Preferences)**:
```
≤' = {(vi, vj) | vi, vj ∈ K, ∃PA-node pa: vi →[preferred] pa →[dispreferred] vj}
```

**Implementation**: `lib/aspic/translation/aifToASPIC.ts::populateKBPreferencesFromAIF()`

## Definition 4.2: ASPIC+ → AIF

(Include implementation details, diagrams, code examples)
```

### Comprehensive Testing

**Final Integration Test**:

```typescript
describe("ASPIC+ Phase 4 Full Integration", () => {
  test("end-to-end: Create PA-node → Evaluate → Verify defeats", async () => {
    // 1. Create arguments
    const argA = await createTestArgument("A", deliberationId);
    const argB = await createTestArgument("B", deliberationId);

    // 2. Create preference: A > B
    const paResponse = await fetch("/api/pa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deliberationId,
        preferredArgumentId: argA.id,
        dispreferredArgumentId: argB.id,
        justification: "A has stronger evidence",
      }),
    });
    expect(paResponse.ok).toBe(true);

    // 3. Evaluate with last-link ordering
    const evalResponse = await fetch(
      `/api/aspic/evaluate?deliberationId=${deliberationId}&ordering=last-link`
    );
    const evalData = await evalResponse.json();

    // 4. Verify A defeats B (if A attacks B)
    const aDefeatsB = evalData.defeats.some(
      d => d.from === argA.id && d.to === argB.id
    );
    expect(aDefeatsB).toBe(true);

    // 5. Verify defeat statistics
    expect(evalData.defeatStatistics.totalAttacks).toBeGreaterThan(0);
    expect(evalData.defeatStatistics.totalDefeats).toBeLessThanOrEqual(
      evalData.defeatStatistics.totalAttacks
    );
  });

  test("changing ordering policy affects defeats", async () => {
    // Evaluate with last-link
    const lastLinkResponse = await fetch(
      `/api/aspic/evaluate?deliberationId=${deliberationId}&ordering=last-link`
    );
    const lastLinkData = await lastLinkResponse.json();

    // Evaluate with weakest-link
    const weakestLinkResponse = await fetch(
      `/api/aspic/evaluate?deliberationId=${deliberationId}&ordering=weakest-link`
    );
    const weakestLinkData = await weakestLinkResponse.json();

    // Defeat counts may differ
    expect(lastLinkData.defeatStatistics.totalDefeats).toBeDefined();
    expect(weakestLinkData.defeatStatistics.totalDefeats).toBeDefined();
  });

  test("justification is saved and retrieved", async () => {
    const paResponse = await fetch("/api/pa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deliberationId,
        preferredArgumentId: argA.id,
        dispreferredArgumentId: argB.id,
        justification: "A has peer-reviewed evidence",
      }),
    });

    const { id } = await paResponse.json();

    const pa = await prisma.preferenceApplication.findUnique({ where: { id } });
    expect(pa?.justification).toBe("A has peer-reviewed evidence");
  });
});
```

### Acceptance Criteria

- ✅ User guide created with ordering policy explanations
- ✅ Developer guide created with translation details
- ✅ API documentation updated
- ✅ All end-to-end tests pass
- ✅ Example 33 walkthrough documented with diagrams

---

## Timeline Summary

| Phase | Duration | Focus |
|-------|----------|-------|
| **4.1 Translation Layer** | 3 days | AIF ↔ ASPIC+ bidirectional conversion |
| **4.2 Schema & API** | 1 day | Minimal schema extension + API endpoints |
| **4.3 UI Enhancement** | 1.5 days | Modal fix + badge tooltip + ordering selector |
| **4.4 Documentation** | 0.5 days | User/developer guides + comprehensive tests |
| **Total** | **6 days** | Integration-focused implementation |

---

## Success Metrics

### Functional Requirements ✅

- ✅ AIF PA-nodes correctly translated to ASPIC+ KB preferences
- ✅ ASPIC+ preferences correctly translated to AIF PA-nodes
- ✅ Round-trip translation preserves preferences
- ✅ Last-link and weakest-link orderings both work
- ✅ Elitist and democratic set comparisons both work
- ✅ Defeats computed correctly given preferences
- ✅ UI allows creating preferences with justification
- ✅ UI allows selecting ordering policy
- ✅ API exposes evaluation with ordering parameter

### Non-Functional Requirements ✅

- ✅ Performance: Translation + evaluation completes in <2 seconds for 100 arguments
- ✅ Backward compatibility: Existing PA-nodes work without new metadata
- ✅ Code quality: All lint checks pass
- ✅ Test coverage: >80% for translation layer
- ✅ Documentation: User guide and developer guide complete

### Validation ✅

- ✅ Example 33 from Modgil & Prakken evaluates correctly
- ✅ Rationality postulates still hold after preference integration
- ✅ No regressions in existing ASPIC+ functionality
- ✅ AIF import/export preserves ordering metadata

---

## Risk Mitigation

### Risk: Translation Errors

**Mitigation**:
- Strict adherence to Definition 4.1 and 4.2
- Comprehensive unit tests with known examples
- Round-trip tests (AIF → ASPIC → AIF)
- Validation against Example 33

### Risk: Performance Degradation

**Mitigation**:
- Cache translated preferences (invalidate on PA create/delete)
- Batch database queries (avoid N+1)
- Index optimization on PreferenceApplication
- Lazy evaluation (only compute defeats when needed)

### Risk: User Confusion

**Mitigation**:
- Default to sensible policy (last-link + elitist)
- Hide advanced options behind "Advanced" disclosure
- Inline tooltips with examples
- Preview panel shows impact before applying
- Comprehensive user guide

### Risk: Breaking Changes

**Mitigation**:
- Schema changes are additive (optional fields only)
- API backward compatible (ordering parameter optional)
- Existing workflows continue to function
- Gradual rollout: Translation → API → UI

---

## Next Steps After Phase 4

### Phase 5: Advanced Features

- Weighted preferences (confidence scores)
- Preference scheme integration (formalize justifications)
- Conflict resolution UI (resolve A < B and B < A)
- Bulk preference operations (CSV import, templates)

### Phase 6: Visualization

- Graph view of preference orderings
- Highlight cycles
- Show transitive closure visually
- Animate evaluation with preferences

### Phase 7: Optimization

- Incremental evaluation (recompute only affected arguments)
- Preference caching strategies
- Parallel evaluation for large deliberations

---

## References

- Modgil, S., & Prakken, H. (2014). "A General Account of Argumentation with Preferences." *Artificial Intelligence*, 195, 361-397.
- Bex, F., Prakken, H., & Reed, C. (2013). "AIF Formal Analysis Using the ASPIC Framework." *COMMA*.
- Dung, P. M. (1995). "On the Acceptability of Arguments and Its Fundamental Role in Nonmonotonic Reasoning, Logic Programming and n-Person Games." *Artificial Intelligence*, 77(2), 321-357.

---

**End of Roadmap V2** ✅

Ready to begin Phase 4.1: Translation Layer implementation.
