# Session 2 Dev-Spec: Ludics Substrate — Lifecycle, Synthesis, and Production Readiness

**Session:** 2 (Phase 2 dev-planning)
**Date:** 2026-05-20
**Track:** Dev-spec / implementation-ready
**Predecessor:** [LUDICS_SESSION_1_DEV_SPEC.md](./LUDICS_SESSION_1_DEV_SPEC.md) (all 7 phases complete; 169/169 tests passing)
**Scope:** Six deliverables:
(§1) Staging migration + performance benchmarks — the first live-data gate;
(§2) `incarnationSet` manifest field — completes the §2.2 manifest spec from Session 1;
(§3) AI synthesis workflow — first end-to-end agent use of the Phase 1 tools;
(§4) Fossil retraction lifecycle — wires deletion events to `fossilize()`;
(§5) OQ-JSL formal proof pass — resolves the `confirmed-with-caveat` on C1;
(§6) Production readiness — rate limiting, cache warming, auth audit, fingerprint durability.
**Companions:**
[LUDICS_SESSION_1_DEV_SPEC.md](./LUDICS_SESSION_1_DEV_SPEC.md) ·
[LUDICS_TRIADS_CLOSURE_AND_CONFIDENCE_ERASURE_FUNCTOR.md](./LUDICS_TRIADS_CLOSURE_AND_CONFIDENCE_ERASURE_FUNCTOR.md) ·
[LUDICS_OPEN_COMPOSITION_JOINT.md](./LUDICS_OPEN_COMPOSITION_JOINT.md) ·
[packages/isonomia-mcp/src/server.ts](../../../packages/isonomia-mcp/src/server.ts) ·
[lib/models/schema.prisma](../../../lib/models/schema.prisma)

---

> **⚠ Post-review status (2026-05-21).** This spec was written 2026-05-20, one day before Phase 2e (OQ-JSL proof) and the Phase 2f pre-session resolved several open questions the spec had assumed. Sections marked **[CORRECTED post-2e/2f]** have been rewritten in place; §5 has been **archived** to [LUDICS_SESSION_2_DEV_SPEC.archived.md](./LUDICS_SESSION_2_DEV_SPEC.archived.md). Authoritative substrate references for the corrections: [LUDICS_OQ_JSL_PROOF.md](./LUDICS_OQ_JSL_PROOF.md) (Outcome B mis-attribution: Inc(B) is an antichain, ∨_⊥⊥ is per-cone) and [LUDICS_ORDER_RELATION_DEFINITION.md](./LUDICS_ORDER_RELATION_DEFINITION.md) (≤_⊆ is literal chronicle-set inclusion; Daimon Lock Lemma). The full review is [LUDICS_SESSIONS_1_2_SPEC_REVIEW.md](./LUDICS_SESSIONS_1_2_SPEC_REVIEW.md).

---

## 0. Frame

**What Phase 1 delivered.** Session 1 shipped all seven planned phases (1a–1g):
the five Prisma models (`LudicMove`, `WitnessRecord`, `Design`, `Behaviour`,
`DesignInclusion`), 14 new MCP tools, 17 new API routes, the `articulationLattice`
service, the fossil-record service, the briefing-fingerprint API, and a
scorecard extension covering coverage-exposure. 169/169 invariant tests pass
under Jest with mocked DB.

**What Phase 1 did not do.** Three classes of work were explicitly deferred:

1. **Live-data verification.** All 169 tests run against mocked Prisma and
   mocked HTTP clients. No Phase 1 code has been run against a real database
   with real `LudicMove` rows. The staging migration has not been generated or
   applied.

2. **Lifecycle wiring.** The `fossilize()` function exists but is not called
   anywhere in the request lifecycle. Argument deletion, locus removal, and
   design excision do not trigger fossil updates.

3. **Agent integration.** `compute_articulation_join` and
   `bind_participant_to_design` are independently correct but no agent
   workflow calls them in sequence. The synthesis path (join → commit) is
   unexercised end-to-end.

**Open questions carried in.**

- **OQ-JSL**: does $\vee_{\perp\perp}$ satisfy join-semilattice axioms beyond
  associativity + bottom? `compute_articulation_join` is correct for the
  loci-union closure case; the algebraic guarantee is conditional. Current
  C1 status: "Tier 1 confirmed-with-caveat."
- **OQ-C3-strong** (surjective counit $\varepsilon$): gates
  `get_ambler_derivations`; not blocking Phase 2.
- **`incarnationSet` manifest field**: listed in §2.2 of Session 1 but not
  wired into `manifestGenerator.ts` or the corpus fixtures.
- **Briefing-fingerprint persistence**: the in-memory `hashCache` Map does
  not survive server restarts; the `check` endpoint cannot reconstruct
  rule-level staleness after a restart.

**Priority ordering.** §7 gives the full table; briefly: Phase 2a (staging)
unblocks everything else; Phase 2d (fossil lifecycle) and Phase 2b
(`incarnationSet`) are the next highest-value items; Phase 2c (synthesis
workflow) is the first demo-worthy milestone; Phase 2f (production readiness)
gates external agent traffic; Phase 2e (OQ-JSL) is deferred.

---

## §1. Phase 2a — Staging Migration + Performance Benchmarks

### §1.1 Purpose

All Phase 1 code was written and tested against mocked DB. Before any of the
14 new tools can be used by a real agent, the schema must be applied to a
real database and the performance of the two expensive reads — stratum
labeling (`computeExposureMap`) and lattice traversal (`getArticulationLattice`)
— must be validated against the `large-real-db` fixture scale (143 arguments).

### §1.2 Migration steps

**Step 1: Apply schema to staging via `prisma db push`** *[CORRECTED post-review]*

Repo convention (`.github/copilot-instructions.md`, `AGENTS.md`) is `prisma db push`, **not** `prisma migrate dev`. Apply the schema directly:

```bash
DATABASE_URL=<staging-url> npx prisma db push
```

Verify post-push that `information_schema.tables` contains the five new models with the expected unique constraints and indexes:

- `"LudicMove"` with `@@unique([deliberationId, locus])`
- `"WitnessRecord"` with the T4 `participantId` column and `fossilizedAt`, `retractReason` nullable columns
- `"Design"`, `"Behaviour"`, `"DesignInclusion"`
- All `CREATE INDEX` statements for the `@@index` annotations

*(If a named migration file is needed for production deploy auditability, generate one separately with `prisma migrate diff` from a clean DB — but `db push` is the canonical apply step.)*

**Step 3: Seed a Ludics fixture**

Write a seeding script `scripts/seed-ludics-showcase.ts` that:
1. Selects an existing deliberation with ≥ 50 arguments (use the same
   deliberation that underpins `large-real-db`)
2. Creates `LudicMove` rows for each argument's main claim (locus =
   `⊢A.{i}`, `moveType = "positive"`, `stratumLabel = "latent"`)
3. Creates a `Behaviour` at locus `⊢A.0` (the root)
4. Creates **three `Design` rows** realizing a multi-cone `B` (the post-2e generic case, |Inc(B)| ≥ 2):
   - `baseCone0` (`derivedBy = null`, loci = `[⊢A.0, ⊢A.1, ⊢A.2]`) — base of cone 0
   - `extensionCone0` (`derivedBy = "extend"`, loci = `[⊢A.0..⊢A.4]`) — literal chronicle-set extension of `baseCone0` preserving the daimon skeleton (Daimon Lock Lemma; Phase 2f Reading A: union, `closureSteps = 0`)
   - `baseCone1` (`derivedBy = null`, loci = `[⊢A.0, ⊢A.5, ⊢A.6]`) — alternative incarnation, branches disjoint from cone 0 ⇒ distinct cone
   - One `DesignInclusion` edge **same-cone only** (`baseCone0 ⊂ extensionCone0`). *[CORRECTED post-2e/2f]* — `DesignInclusion` edges are valid only **same-cone**; cross-cone edges are semantically impossible (Phase 2e Cross-Cone Incompatibility) and the seed script asserts cone-locality before inserting (refusing to write if violated).
5. Creates three `WitnessRecord` rows (marking three moves as `stratumLabel = "walked"`)
6. *[OBSOLETE]* The "optional second cone" item is now folded into Step 4 above — multi-cone B is the generic post-2e case, not an exception.

This gives the minimum viable data to smoke-test all 14 MCP tools.

### §1.3 Performance benchmarks

**Target SLAs** (from §7.1 of the Session 1 spec):

| Operation | Target | Measured on |
| --- | --- | --- |
| `computeExposureMap` (stratum-labeling pass) | < 500ms p95 | 143-arg deliberation, cold |
| `getArticulationLattice` (Hasse BFS) | < 200ms p95 | Behaviour with ≥ 10 designs |
| `getFossilRecord` | < 100ms p95 | 50 fossil records |

**Instrumentation.** Add timing wrappers in `server/ludics/exposureMap.ts`
and `server/ludics/articulationLattice.ts`:

```typescript
const t0 = performance.now();
// ... existing logic
const elapsed = performance.now() - t0;
if (elapsed > 300) {
  console.warn("[perf] computeExposureMap slow", { deliberationId, elapsed });
}
```

**Test file:** `__tests__/integration/phase2a-staging-smoke.test.ts`

This is an **integration test** (requires a real DB connection; skip in CI
without `DATABASE_URL` set). Add a `describe.skip` guard:

```typescript
const HAS_DB = Boolean(process.env.DATABASE_URL);
describe.skipIf(!HAS_DB)("Phase 2a staging smoke", () => { ... });
```

Test plan (~12 tests):

1. Migration applied: all 5 new tables exist in `information_schema.tables`
2. `LudicMove` unique constraint: inserting duplicate `(deliberationId, locus)` throws
3. `WitnessRecord` unique constraint on `dialogueMoveId`
4. `computeExposureMap` returns within 500ms for the seeded large deliberation
5. `computeExposureMap` returns correct stratum distribution (> 0 walked, > 0 witnessable)
6. `getArticulationLattice` returns within 200ms for the seeded behaviour
7. `getArticulationLattice` returns the correct Hasse edges from the seeded `DesignInclusion`
8. `getFossilRecord` returns 0 fossils initially; returns 3 after three `fossilize()` calls
9. `getBehaviourAtLocus` returns the seeded behaviour's 2 designs
10. `getDeliberationSchema` coverage ratio matches seeded witness count / total loci count
11. `computeBriefingFingerprint` computes a stable hash for the seeded deliberation across two calls
12. MCP tool `get_fossil_record` end-to-end via HTTP: `GET /api/v3/ludics/fossil-record?deliberationId=<id>` returns `{ fossils: [], totalFossils: 0 }`
13. *[ADDED post-review]* **Cone-locality invariant.** Inserting a `DesignInclusion` edge between two designs in different cones is rejected at the seed-script / service layer (not silently accepted by the schema).
14. *[ADDED post-review]* **Stratum relabel after write.** After a `bind_participant_to_design` call promotes a `latent` move to `walked`, the `stratumLabel` of neighbour moves at depth ≤ `stratifyDepth` is re-derived from σ(𝒟_P)^⊥ (witnessable → walked promotion, latent → witnessable promotion). Test: seed three latent neighbours, bind one, assert the other two are relabeled `witnessable`.
15. *[ADDED post-review]* **R1 fingerprint invalidation** — fire a hub-mutation write; assert `lastMaterialChangeRule === "R1"`.
16. *[ADDED post-review]* **R2 fingerprint invalidation** — extend `refusalSurface.cannotConcludeBecause`; assert `lastMaterialChangeRule === "R2"`.
17. *[ADDED post-review]* **R3 fingerprint invalidation** — shift top-5 `loadBearingRanking` by ≥1 position; assert `lastMaterialChangeRule === "R3"`.
18. *[ADDED post-review]* **R4 fingerprint invalidation** — inject a hub-targeting CQ into top-15; assert `lastMaterialChangeRule === "R4"`.
19. *[ADDED post-review]* **R5 fingerprint invalidation** — add ≥10 unaddressed structural objections; assert `lastMaterialChangeRule === "R5"`. (Threshold is `≥ 10` per §5.3 R5 of the Session 1 spec — see B5 review note on intra-spec coherence with §3.3 metrics table.)

### §1.4 Deliverables

| File | Type |
| --- | --- |
| `prisma/migrations/<ts>_add_ludics_generative_substrate/migration.sql` | DB migration |
| `scripts/seed-ludics-showcase.ts` | Seeding script |
| `__tests__/integration/phase2a-staging-smoke.test.ts` | Integration tests (12) |

---

## §2. Phase 2b — `incarnationSet` Manifest Field

### §2.1 Purpose

§2.2 of the Session 1 spec lists `incarnationSet` (poset bottom + minimal
elements via `find_minimal_incarnations`) as a structural manifest field.
It is not yet wired into `manifestGenerator.ts` or the corpus fixtures.
This phase completes the §2.2 manifest definition and adds the final
scorecard dimension: **articulation recall**.

### §2.2 Type changes (`eval/ai-epi/types.ts`)

**Add `DesignSummary` interface:**

```typescript
export interface DesignSummary {
  designId: string;
  loci: string[];          // locus addresses this design spans
  moveCount: number;
  rank: number;            // 0 = minimal (bottom); higher = larger incarnation
}
```

**Add `IncarnationSetManifest` interface:** *[CORRECTED post-2e/2f]*

```typescript
export interface IncarnationSetManifest {
  // Inc(B) is an antichain (Phase 2e Outcome B). There is no global bottom |B|;
  // each cone has its own minimal incarnation. `incarnations` is the full antichain.
  incarnations: DesignSummary[];          // |incarnations| === |Inc(B)| === number of cones
  totalIncarnations: number;              // === incarnations.length; kept for explicit consumer assertion
  // Optional per-cone structure when MCP needs explicit cone identity
  // (see OQ-2 in LUDICS_SESSIONS_1_2_SPEC_REVIEW.md §7). Empty until
  // cones are surfaced by the lattice tools.
  cones?: Array<{ coneId: string; bottomIncarnation: DesignSummary }>;
}
```

*Removed:* `bottom: DesignSummary | null` — reified the obsolete unique-bottom-of-Inc(B) assumption disproved by [LUDICS_OQ_JSL_PROOF.md](./LUDICS_OQ_JSL_PROOF.md).

**Extend `Manifest`:**

```typescript
export interface Manifest {
  // ... existing fields ...
  incarnationSet: IncarnationSetManifest;
}
```

**Extend `Fixture`:**

```typescript
export interface Fixture {
  // ... existing fields ...
  manifestFields?: {
    openExposurePoints: number;
    coverageRatio: number;
    fossilCount: number;
    incarnationSet: IncarnationSetManifest;   // NEW
  };
}
```

**New LLM output field (on `LLMBriefingOutput`):** *[CORRECTED post-2e/2f]*

```typescript
claimedIncarnationCount?: number;
// How many distinct incarnations (Inc(B) members) the LLM identifies for the
// main-claim behaviour. Graded against incarnationSet.incarnations.length.
claimedMinimalPremiseLociCountPerCone?: number[];
// Per-cone: how many loci the LLM identifies as the minimum-commitment locus
// set for each incarnation it surfaces. Aligned positionally with the
// incarnations array. Graded against each incarnation's loci.length.
```

*Removed:* the original single-number `claimedMinimalPremiseLociCount` — conflated all cones into one count and assumed a global bottom.

**New confidentMisstatement kinds:** *[CORRECTED post-2e/2f]*

```typescript
export type ConfidentMisstatementKind =
  | "hub-topology-collapsed"
  | "refused-conclusion-asserted"
  | "cq-priority-inverted"
  | "coverage-exposure-zero"
  | "incarnation-undercount"            // LLM identifies fewer loci than a cone's incarnation
  | "miscount-across-cones"             // NEW post-2e: LLM claims |Inc(B)| = 1 when |Inc(B)| ≥ 2
  | "incarnation-conflation";           // NEW post-2e: LLM merges multiple incarnations into one position
```

**Extend `Phase1ScorecardReport`:** *[CORRECTED post-2e/2f]*

```typescript
export interface Phase1ScorecardReport {
  // ... existing fields ...
  articulationRecall: ArticulationRecallScore;
}

export interface ArticulationRecallScore {
  // Per-cone metric: each entry corresponds to one incarnation in Inc(B).
  perCone: Array<{
    coneIndex: number;                    // 0-based index into incarnationSet.incarnations
    coneLociCount: number;                // incarnationSet.incarnations[i].loci.length
    claimedLociCount: number;             // from claimedMinimalPremiseLociCountPerCone[i] (0 if absent)
    recall: number;                       // min(claimed, cone) / cone; 1 when coneLociCount===0
    undercount: boolean;                  // claimed < cone
  }>;
  meanRecall: number;                     // mean(perCone[*].recall); 1 when perCone empty
  incarnationCountRecall: number;         // min(claimedIncarnationCount, |Inc(B)|) / |Inc(B)|
  miscountAcrossCones: boolean;           // claimedIncarnationCount < |Inc(B)| AND |Inc(B)| ≥ 2
}
```

*Removed:* the single-number `recall = claimedMinimalLociCount / bottomLociCount`, which presupposed a unique global bottom.

### §2.3 `manifestGenerator.ts` changes

Add a helper `buildIncarnationSetManifest` that calls
`findMinimalIncarnations` from `server/ludics/articulationLattice.ts`
via the service function directly (not via HTTP — the manifest generator
runs server-side):

```typescript
async function buildIncarnationSetManifest(
  fixture: Fixture
): Promise<IncarnationSetManifest> {
  const raw = fixture.manifestFields?.incarnationSet;
  if (raw) return raw;  // use authored value for corpus fixtures
  // live path (Phase 2a+ only): query DB
  // for now return a zero-default
  return { bottom: null, minimals: [], totalIncarnations: 0 };
}
```

In `generateManifest`:

```typescript
incarnationSet: await buildIncarnationSetManifest(fixture),
```

### §2.4 Scorecard changes (`eval/ai-epi/scorecard/phase1.ts`) *[CORRECTED post-2e/2f]*

**`detectConfidentMisstatements` extensions:**

```typescript
const incs = manifest.incarnationSet.incarnations;

// miscount-across-cones: LLM under-counts the number of distinct incarnations
if (
  incs.length >= 2 &&
  typeof output.claimedIncarnationCount === "number" &&
  output.claimedIncarnationCount < incs.length
) {
  misstatements.push({
    kind: "miscount-across-cones",
    detail: `claimed ${output.claimedIncarnationCount} incarnations; Inc(B) has ${incs.length} (antichain — each cone has its own bottom).`,
  });
}

// incarnation-undercount: per-cone, LLM under-counts a cone's minimum-commitment loci
for (let i = 0; i < incs.length; i++) {
  const claimed = output.claimedMinimalPremiseLociCountPerCone?.[i];
  if (
    incs[i].loci.length > 0 &&
    typeof claimed === "number" &&
    claimed < incs[i].loci.length
  ) {
    misstatements.push({
      kind: "incarnation-undercount",
      detail: `cone ${i}: claimed ${claimed} loci; incarnation has ${incs[i].loci.length}.`,
    });
  }
}
```

**`scorePhase1` — per-cone articulation recall:**

```typescript
const incs = manifest.incarnationSet.incarnations;
const perCone = incs.map((inc, i) => {
  const claimed = output.claimedMinimalPremiseLociCountPerCone?.[i] ?? 0;
  const denom = inc.loci.length;
  return {
    coneIndex: i,
    coneLociCount: denom,
    claimedLociCount: claimed,
    recall: denom === 0 ? 1 : Math.min(claimed, denom) / denom,
    undercount: claimed < denom,
  };
});
const meanRecall = perCone.length === 0 ? 1 : perCone.reduce((s, c) => s + c.recall, 0) / perCone.length;
const claimedIncCount = output.claimedIncarnationCount ?? 0;
const articulationRecall: ArticulationRecallScore = {
  perCone,
  meanRecall,
  incarnationCountRecall: incs.length === 0 ? 1 : Math.min(claimedIncCount, incs.length) / incs.length,
  miscountAcrossCones: incs.length >= 2 && claimedIncCount < incs.length,
};
```

### §2.5 `mockClient.ts` changes *[CORRECTED post-2e/2f]*

For each fixture, emit a perfect-recall vector aligned to the `incarnations` antichain:

```typescript
const incs = manifest.incarnationSet.incarnations;
output.claimedIncarnationCount = incs.length;
output.claimedMinimalPremiseLociCountPerCone = incs.map(i => i.loci.length);
```

For the adversarial `miscount-across-cones` fixture, emit `claimedIncarnationCount = 1` when `incs.length >= 2`. For the adversarial under-count fixture, emit `claimedMinimalPremiseLociCountPerCone = incs.map(_ => 0)`.

### §2.6 Corpus fixture updates *[CORRECTED post-2e/2f]*

All five v2 fixtures need an `incarnationSet` entry inside `manifestFields`.
**Multiple incarnations are generic post-2e**, not exceptional — Inc(B) is
an antichain and most non-trivial behaviours decompose into multiple cones.
Authored values (consistent with existing `openExposurePoints` / `fossilCount`):

| Fixture | `incarnations.length` (= |Inc(B)|) | Per-cone `loci.length` | `totalIncarnations` |
| --- | --- | --- | --- |
| `large-real-db.json` (143 args, diffuse) | 8 | varies (12, 9, 7, 6, 6, 5, 5, 4) | 8 |
| `small-coequal-hubs-db.json` (9 args) | 2 | [3, 3] | 2 |
| `small-diffuse-hubs-db.json` (12 args) | 3 | [4, 3, 3] | 3 |
| `small-refusal-rich-db.json` (3 args) | 1 | [2] | 1 |
| `small-single-hub-db.json` (4 args) | 1 | [2] | 1 |

The single-cone cases (`small-refusal-rich`, `small-single-hub`) are the exception, not the rule. The previous fixture distribution (4/5 with `minimals.length === 1`) reflected pre-2e priors and has been rebalanced to expose `miscount-across-cones` and per-cone recall in the regression harness.

### §2.7 Test file *[CORRECTED post-2e/2f]*

`__tests__/invariants/phase2b-incarnation-manifest.test.ts` (~22 tests):

- `IncarnationSetManifest` type: empty antichain, single-cone, multi-cone (≥ 2)
- `manifestGenerator` emits the authored `incarnationSet.incarnations` from fixture
- `scorecard` computes `articulationRecall.meanRecall === 1` when LLM claims correct per-cone counts
- `scorecard` computes `articulationRecall.meanRecall < 1` when LLM undercounts in any cone
- `scorecard` computes `articulationRecall.incarnationCountRecall < 1` when LLM under-counts |Inc(B)|
- `detectConfidentMisstatements` adds `incarnation-undercount` for each cone where claimed < cone.loci.length
- `detectConfidentMisstatements` adds `miscount-across-cones` when |Inc(B)| ≥ 2 AND `claimedIncarnationCount < |Inc(B)|`
- `detectConfidentMisstatements` does NOT add `miscount-across-cones` when |Inc(B)| === 1
- `detectConfidentMisstatements` does NOT add either kind when `claimedIncarnationCount` / per-cone array are absent
- `mockClient` emits a per-cone count array of the correct length and values
- Per-fixture: `articulationRecall.meanRecall === 1` in the happy path (5 tests)
- Multi-cone fixtures: `incarnationSet.incarnations.length` matches table in §2.6 (3 tests for the 3 multi-cone fixtures)
- Single-cone fixtures: `miscountAcrossCones === false` regardless of `claimedIncarnationCount` (2 tests)
- Adversarial `miscount-across-cones` fixture: misstatement is present
- Adversarial under-count fixture: per-cone undercount misstatements are present for every cone

### §2.8 Deliverables

| File | Change |
| --- | --- |
| `eval/ai-epi/types.ts` | `DesignSummary`, `IncarnationSetManifest`, `ArticulationRecallScore`, `incarnation-undercount` kind, `articulationRecall` on report |
| `eval/ai-epi/manifestGenerator.ts` | `buildIncarnationSetManifest`, wire into `generateManifest` |
| `eval/ai-epi/scorecard/phase1.ts` | `articulationRecall` computation + `incarnation-undercount` detection |
| `eval/ai-epi/llm/mockClient.ts` | `claimedMinimalPremiseLociCount` emission |
| 5 × `corpus/v2/fixtures/*.json` | `incarnationSet` inside `manifestFields` |
| `__tests__/invariants/phase2b-incarnation-manifest.test.ts` | 22 tests |

---

## §3. Phase 2c — AI Synthesis Workflow

### §3.1 Purpose

The articulation lattice tools (Cluster B) and the write seam
(`bind_participant_to_design`) were built to enable agents to produce
synthesis moves algebraically — finding the join of two positions and
committing to it — rather than prose blending. Phase 2c wires these tools
into a usable agent workflow and validates it with a test harness.

This phase does **not** require a live LLM call. The workflow is driven by a
`SynthesisProposalAgent` class that wraps the MCP tools in a deterministic,
testable sequence.

### §3.2 `SyntheticReadout` extension *[CORRECTED post-2e/2f]*

Extend `lib/deliberation/syntheticReadout.ts` to include the **per-cone incarnations** of the main-claim behaviour in the `SyntheticReadout` payload — there is no global bottom of Inc(B):

```typescript
// In SyntheticReadout interface:
incarnations?: Array<{
  behaviourId: string;
  designId: string;
  loci: string[];
  moveCount: number;
  coneId?: string;       // optional cone identity when surfaced by the lattice tools
}> | null;
```

Population: after the existing `computeSyntheticReadout` finishes, call `findMinimalIncarnations` for the behaviour at the root locus (`⊢A.0` or equivalent). Returns the full antichain. `null` if no `Behaviour` row exists (pre-Phase-1 deliberations).

*Removed:* the singular `bottomIncarnation` field — same singular-bottom defect as A4.2 / A9.1.

### §3.3 `SynthesisProposalAgent` *[CORRECTED post-2e/2f]*

New file: `server/ludics/synthesisProposalAgent.ts`

**Purpose.** Given a deliberation and two candidate design IDs, produce and commit a synthesis move by:
1. **Pre-flight cone check.** Resolve both designs' cones; if they are in different cones, **abort with `cross-cone-rejected`** (Phase 2e Cross-Cone Incompatibility — no join exists in B).
2. Calling `computeArticulationJoin(designIds)` from `articulationLattice.ts` — valid only when both designs are same-cone. The result is the literal chronicle-set union (Phase 2f Reading A); `closureSteps === 0` in the well-formed within-cone case.
3. Creating a new `Design` row with `derivedBy: "join"` and the returned `loci` set; creating same-cone `DesignInclusion` edges from each input design to the new join design.
4. Calling `create(...)` from `witnessRecord.ts` to bind the join result as a new `WitnessRecord` (with `schemeKey: "synthesis"` — see catalog note below — and a generated `canonicalText`).
5. Returning a discriminated result.

```typescript
export interface SynthesisProposalInput {
  deliberationId: string;
  designIds: [string, string];      // the two designs to join
  participantId: string;            // the agent's participant id (token-gated)
  canonicalText: string;            // agent-generated synthesis statement
}

export type SynthesisProposalResult =
  | {
      kind: "same-cone-join";
      witnessId: string;
      joinDesignId: string;
      newLoci: string[];            // loci added by literal union beyond either input alone
      closureSteps: 0;              // always 0 within a cone (Phase 2f Reading A)
    }
  | {
      kind: "same-cone-delocation-required";
      joinDesignId: string;         // candidate design row created but not yet bound
      newLoci: string[];            // negative-branch extensions per Daimon Lock Lemma
      delocationCandidateLocus: string;
    }
  | {
      kind: "cross-cone-rejected";
      reason: "cross-cone-incompatibility";
      cone1DesignId: string;
      cone2DesignId: string;
      // No join exists in B (Phase 2e). Caller should treat as “no synthesis available
      // at the Ludics layer.” Any Mesh-layer “discourse synthesis” operation is OQ-3
      // (LUDICS_SESSIONS_1_2_SPEC_REVIEW.md §7).
    };

export async function proposeSynthesis(
  input: SynthesisProposalInput
): Promise<SynthesisProposalResult>
```

**Invariant enforcement.** `proposeSynthesis` inherits all four I1–I4 checks from `create()` in `witnessRecord.ts` on the `same-cone-join` path. The `same-cone-delocation-required` path corresponds to a legitimate within-cone extension via negative branches (Daimon Lock Lemma) and is distinct from cross-cone rejection. The `cross-cone-rejected` path is terminal at the Ludics layer.

**`schemeKey: "synthesis"` catalog note.** *[ADDED post-review]* `"synthesis"` is not currently in the substrate scheme catalog. Phase 2c must either (a) add it to the catalog with the CQs and validity conditions documented inline, or (b) drop the `schemeKey` for synthesis moves and add a `WitnessRecord.schemeKey` nullability path that the gate skips on `derivedBy === "join"`. Decision: track as OQ-2c-scheme; choose (a) if synthesis moves are graded by scheme-aware tooling, (b) otherwise.

### §3.4 MCP tool

Add a new MCP tool `propose_synthesis` to `packages/isonomia-mcp/src/server.ts`
(Cluster D extension):

```typescript
const ProposeSynthesisInput = z.object({
  deliberationId: z.string(),
  designIds: z.tuple([z.string(), z.string()]),
  canonicalText: z.string().min(10).max(2000),
});
```

**Output shape:** *[CORRECTED post-2e/2f]*

```jsonc
// Discriminated by `kind`; mirrors SynthesisProposalResult above.
{
  "kind": "same-cone-join",
  "witnessId": "wit_...",
  "joinDesignId": "des_...",
  "newLoci": [],
  "closureSteps": 0
}
// or
{
  "kind": "same-cone-delocation-required",
  "joinDesignId": "des_...",
  "newLoci": ["⊢A.3-neg"],
  "delocationCandidateLocus": "⊢A.3-neg"
}
// or
{
  "kind": "cross-cone-rejected",
  "reason": "cross-cone-incompatibility",
  "cone1DesignId": "des_...",
  "cone2DesignId": "des_..."
}
```

Token-gated (requires `MCP_API_TOKEN`).

### §3.5 Adversarial fixtures *[CORRECTED post-2e/2f]*

Add corpus fixtures (under `eval/ai-epi/corpus/v2/fixtures/`) covering the three discriminated outcomes:

- `synthesis-join-db.json` — same-cone, non-overlapping loci. Bottom-incarnation post-condition: the join's `loci` is the **literal union** of the two input designs' loci (Phase 2f Reading A), i.e. `|L_join| = |L_1 ∪ L_2| ≤ |L_1| + |L_2|` with equality only when `L_1 ∩ L_2 = ∅`. The cone's incarnation `loci` is a **subset** of `L_join` (not equal). `closureSteps` is always 0.
- `synthesis-delocation-db.json` — same-cone, but the join requires a negative-branch extension (Daimon Lock Lemma). Expected `kind: "same-cone-delocation-required"` with non-empty `newLoci` corresponding to negative-branch loci.
- `synthesis-cross-cone-db.json` *(NEW)* — two designs in disjoint cones. Expected `kind: "cross-cone-rejected"` with `reason: "cross-cone-incompatibility"`. Verifies the agent correctly bails out instead of attempting a non-existent join.

*Removed:* the original "`bottom.loci.length` must equal the **sum** of the two input designs' loci" condition — union, not sum; cone's incarnation ⊆ join's loci (not equal).

### §3.6 Test file *[CORRECTED post-2e/2f]*

`__tests__/invariants/phase2c-synthesis-workflow.test.ts` (~22 tests):

- `computeArticulationJoin` with two same-cone designs: returns `newLoci` as the set-difference from the literal union
- `computeArticulationJoin` with same-cone identical designs: returns the input unchanged; `closureSteps === 0`
- `computeArticulationJoin` with cross-cone designs: returns `kind: "cross-cone-rejected"` (or throws a typed error — chosen variant tested)
- `proposeSynthesis` same-cone-join: returns `kind: "same-cone-join"` with `witnessId`, `closureSteps === 0`
- `proposeSynthesis` same-cone-delocation: returns `kind: "same-cone-delocation-required"` when negative-branch extension required; no `witnessId`
- `proposeSynthesis` cross-cone: returns `kind: "cross-cone-rejected"` with both `coneNDesignId` set; **no** Design row created; **no** WitnessRecord created
- `proposeSynthesis` I1 enforcement (same-cone-join path): rejects when `ludicMoveId` not in current 𝒟_P
- `proposeSynthesis` I3 enforcement: rejects when `canonicalText` is empty
- `SyntheticReadout` extension: `incarnations` is populated (full antichain) when `Behaviour` row exists
- `SyntheticReadout` extension: `incarnations` is `null` when no `Behaviour` row
- MCP tool `propose_synthesis`: returns 401 when called without `MCP_API_TOKEN`
- MCP tool `propose_synthesis`: delegates correctly to `proposeSynthesis` and preserves the discriminated `kind`
- `synthesis-join-db` fixture: scorecard computes `articulationRecall.meanRecall === 1`
- `synthesis-delocation-db` fixture: result `kind === "same-cone-delocation-required"`
- `synthesis-cross-cone-db` fixture: result `kind === "cross-cone-rejected"`
- `closureSteps` substrate-violation alert: `articulationLattice.ts` logs **WARN** on any `closureSteps > 0` (post-2f Reading A: within-cone join is literal union; nonzero ⇒ substrate violation). *[CORRECTED post-2e/2f]*
- Idempotence: calling `proposeSynthesis` twice with identical designs on the same deliberation is detected (same `biorthoClass` hash → return existing design)
- Cone-locality invariant on `DesignInclusion`: `proposeSynthesis` never produces a cross-cone edge, even on the delocation path

### §3.7 Deliverables

| File | Change |
| --- | --- |
| `lib/deliberation/syntheticReadout.ts` | `incarnations` (antichain) in `SyntheticReadout` |
| `server/ludics/synthesisProposalAgent.ts` | NEW — `proposeSynthesis` with discriminated `SynthesisProposalResult` |
| `packages/isonomia-mcp/src/server.ts` | `propose_synthesis` MCP tool with discriminated output |
| `app/api/v3/ludics/propose-synthesis/route.ts` | NEW — POST handler |
| `eval/ai-epi/corpus/v2/fixtures/synthesis-join-db.json` | NEW — same-cone happy path |
| `eval/ai-epi/corpus/v2/fixtures/synthesis-delocation-db.json` | NEW — same-cone delocation path |
| `eval/ai-epi/corpus/v2/fixtures/synthesis-cross-cone-db.json` | NEW — cross-cone-rejected path |
| `__tests__/invariants/phase2c-synthesis-workflow.test.ts` | 22 tests |

---

## §4. Phase 2d — Fossil Retraction Lifecycle

### §4.1 Purpose

Phase 1 shipped `fossilize(witnessId, reason)` in `server/ludics/witnessRecord.ts`
and `get_fossil_record` in `server/ludics/fossilRecord.ts`. But `fossilize()`
is never called in the production request lifecycle — it only appears in test
fixtures. This phase wires retraction events into the three deletion paths:
argument deletion, locus removal, and design excision.

### §4.2 Retraction event map

| Event | `retractReason` value | Where to wire |
| --- | --- | --- |
| Argument deleted | `"argument_superseded"` | Argument delete route/service |
| `LudicMove` row deleted | `"locus_deleted"` | `LudicMove` delete (no public route yet; add guard) |
| `Design` row deleted (excision) | `"design_excised"` | `Design` delete (no public route yet; add guard) |
| Manual operator retract | `"manual_retract"` | `POST /api/v3/ludics/retract-witness` (new) |

### §4.3 Argument deletion hook *[CORRECTED post-review]*

**Sequencing.** The argument-deletion hook is **column-first**: do **not** ship a fuzzy `canonicalText contains` interim path. False-positive / false-negative risk on production text is non-trivial, and shipping both paths simultaneously creates two production write paths with divergent semantics. Step order:

1. **Land the `argumentId` schema change first** (§4.4). Apply via `prisma db push` against staging.
2. **Wire `bind_participant_to_design` to populate `argumentId`** when call-site context provides it (already in scope per Session 1 §2 four-call-site routing).
3. **Backfill `argumentId` on existing `LudicMove` rows** with a one-shot script (heuristic via `canonicalText` + scheme/deliberation match, manually reviewed). Mark un-backfilled rows as `argumentId = null` — they fall outside the `fossilizeByArgument` hook and remain manageable via the manual retract endpoint (§4.5).
4. **Only then ship the argument-delete hook**, gated on a non-null `argumentId`.

**Step 1 — Locate the argument delete path.**

```bash
grep -r "deleteArgument\|DELETE.*arguments\|argument.*delete" app/api/ server/ --include="*.ts" -l
```

**Step 2 — Add fossil trigger** (after `argumentId` column is live):

```typescript
import { fossilizeByArgument } from "@/server/ludics/witnessRecord";

// After argument deletion:
await fossilizeByArgument(argumentId, "argument_superseded");
```

`fossilizeByArgument` in `server/ludics/witnessRecord.ts` is **column-only**:

```typescript
export async function fossilizeByArgument(
  argumentId: string,
  reason: string
): Promise<{ fossilizedCount: number }> {
  // Strict: argumentId column on LudicMove. No fuzzy fallback.
  const result = await prisma.witnessRecord.updateMany({
    where: {
      ludicMove: { argumentId },
      fossilizedAt: null,
    },
    data: { fossilizedAt: new Date(), retractReason: reason },
  });
  return { fossilizedCount: result.count };
}
```

### §4.4 Schema addition: `argumentId` on `LudicMove`

Add an optional `argumentId` field to `LudicMove` in `lib/models/schema.prisma`:

```prisma
model LudicMove {
  // ... existing fields ...
  argumentId  String?   // optional back-reference to the Argument this move represents
                        // populated by bind_participant_to_design when available

  @@index([argumentId])
}
```

Apply via `npx prisma db push` *[CORRECTED post-review]* (repo convention; `migrate dev` is not used — see §1.2 Step 1).

Update `server/ludics/bindParticipant.ts` to optionally accept and store `argumentId` when provided by the call site.

**T4 leak acknowledgement.** Storing `argumentId` on `LudicMove` reverses the substrate's witness-side back-pointer direction (small T4 leak — see review A11.1). Accepted for query performance; the leak is contained to one column and is read-only from the dialectical layer.

### §4.5 Manual retract endpoint *[CORRECTED post-review]*

New route: `POST /api/v3/ludics/retract-witness`

```typescript
// Body: { witnessId: string }
// Response: 200 { ok: true, fossilizedAt: string, alreadyFossilized: false }
//        | 200 { ok: true, fossilizedAt: string, alreadyFossilized: true }  // idempotent success
//        | 404 { error: "WITNESS_NOT_FOUND" }
//        | 401 unauthorized
// Auth: token-gated (MCP_API_TOKEN or equivalent).
```

**Idempotence policy** *[CORRECTED post-review — resolves §4.6 intra-spec incoherence].* Both `fossilize()` (function-layer) **and** the endpoint return success on a repeated retract; the endpoint surfaces `alreadyFossilized: true` so the caller can distinguish a no-op from a fresh retraction. The previously-specified `409` on the endpoint contradicted the function-layer idempotence and has been dropped.

**Announcement-discipline integration** *[ADDED post-review]*: the manual retract endpoint emits a witness-side rescission event on the (deferred) A1–A4 announcement discipline channel — captured here as a single `console.info({ event: "witness_rescinded", witnessId, reason: "manual_retract" })` until the announcement layer ships. Decision tracked as OQ-4 (LUDICS_SESSIONS_1_2_SPEC_REVIEW.md §7).
### §4.6 End-to-end test

`__tests__/invariants/phase2d-fossil-lifecycle.test.ts` (~18 tests):

- `fossilize()` sets `fossilizedAt` and `retractReason` on the target row
- `fossilize()` is idempotent: calling twice does not change `fossilizedAt`
- `fossilizeByArgument` fossilizes all active witnesses for a given argumentId (**column-only**, no fuzzy fallback) *[CORRECTED post-review]*
- `fossilizeByArgument` with no matching witnesses returns `{ fossilizedCount: 0 }`
- `fossilizeByArgument` does **not** match witnesses whose `LudicMove.argumentId` is `null` (un-backfilled rows are out of scope; manual retract is the path) *[ADDED post-review]*
- `get_fossil_record` before any fossilization: `totalFossils === 0`
- `get_fossil_record` after fossilization: returns the fossil with correct `retractReason`
- `get_fossil_record` with `includeActive: true`: returns both active and fossilized records
- `get_fossil_record` with `ludicMoveId` filter: returns only fossils for that move
- Argument delete hook: after mock argument deletion, `getFossilRecord` shows fossil with `retractReason: "argument_superseded"`
- Manual retract endpoint: `POST /api/v3/ludics/retract-witness` returns 401 without token
- Manual retract endpoint: returns `{ ok: true, alreadyFossilized: false }` with valid token + active witnessId *[CORRECTED post-review]*
- Manual retract endpoint: returns `{ ok: true, alreadyFossilized: true }` when witnessId is already fossilized (idempotent success; **no 409**) *[CORRECTED post-review]*
- Manual retract endpoint: returns 404 for unknown witnessId
- Manual retract endpoint: emits a `witness_rescinded` event (console.info or announcement channel when available) *[ADDED post-review]*
- `retractReason` values: each of the four reasons is modeled in test fixtures
- `argumentId` column: `LudicMove` can be queried by `argumentId` after migration
- `fossilizeByArgument` produces correct `fossilizedCount` when 3 witnesses exist
- `bind_participant_to_design` passes `argumentId` through when provided
- `getFossilRecord` with `deliberationId` scopes to correct deliberation

### §4.7 Deliverables

| File | Change |
| --- | --- |
| `lib/models/schema.prisma` | `argumentId` on `LudicMove` |
| `server/ludics/witnessRecord.ts` | `fossilizeByArgument` export |
| `server/ludics/bindParticipant.ts` | optional `argumentId` field pass-through |
| `app/api/v3/ludics/retract-witness/route.ts` | NEW — manual retract endpoint |
| Argument delete service/route | Hook: `await fossilizeByArgument(...)` after delete |
| `__tests__/invariants/phase2d-fossil-lifecycle.test.ts` | 18 tests |

---

## §5. Phase 2e — Formal Proof Pass (OQ-JSL) *[ARCHIVED post-review]*

**Status:** ✅ **Executed 2026-05-21.** Outcome: **B — mis-attribution with structural refinement.** `(Inc(B), ≤_⊆, ∨_⊥⊥)` is **not** a join-semilattice in the way C1 originally claimed. Inc(B) is an **antichain**; (B, ≤_⊆) decomposes into disjoint cones; ∨_⊥⊥ is well-defined only **within a cone** (literal chronicle-set union — Phase 2f Reading A). C1 has been downgraded to **"Corrected"** in [LUDICS_CONSOLIDATION_AND_DEV_READINESS.md](./LUDICS_CONSOLIDATION_AND_DEV_READINESS.md).

**Authoritative records:**
- [LUDICS_OQ_JSL_PROOF.md](./LUDICS_OQ_JSL_PROOF.md) — full proof + structural refinement
- [LUDICS_ORDER_RELATION_DEFINITION.md](./LUDICS_ORDER_RELATION_DEFINITION.md) — Phase 2f pre-session: ≤_⊆ = literal chronicle-set inclusion (Reading A); Daimon Lock Lemma; Cross-Cone Incompatibility; OQ-C3-thin-cones flagged
- [LUDICS_SESSION_2_DEV_SPEC.archived.md](./LUDICS_SESSION_2_DEV_SPEC.archived.md) — verbatim archive of the original §5 prompt for provenance

**Downstream spec sections rewritten on the basis of this outcome:**
- §2 (`IncarnationSetManifest`) — singular `bottom` dropped; antichain treated as generic
- §3 (`proposeSynthesis`) — discriminated result; cross-cone-rejected mode distinct from within-cone delocation
- §6.3 (observability) — `closureSteps > 0` is a substrate violation, not a perf gauge
- Session 1 §1 Cluster B — `compute_articulation_join` discriminated result; backing-claim label updated to C1 "Corrected"

**Lessons captured for future spec discipline** (also recorded in [LUDICS_SESSIONS_1_2_SPEC_REVIEW.md](./LUDICS_SESSIONS_1_2_SPEC_REVIEW.md) §8): do not commit a spec section whose primary OQ is open at the time of writing; formal-proof spec prompts should branch into **three** buckets — *confirm / refute-local / refute-structural* — not just *confirm / counterexample-with-flag*.

---

## §6. Phase 2f — Production Readiness

### §6.1 Rate limiting on `bind_participant_to_design`

`bind_participant_to_design` is the write seam for the entire witnessing
layer. Unbounded writes could fill `WitnessRecord` with synthetic rows.
Add a rate-limit check at the top of `server/ludics/bindParticipant.ts`:

```typescript
import { rateLimit } from "@/lib/rateLimit";  // existing util or new thin wrapper

const BIND_LIMIT = { max: 10, window: "1m" };

// In bindParticipantToDesign():
const allowed = await rateLimit(`ludics:bind:${input.participantId}`, BIND_LIMIT);
if (!allowed) {
  return { error: "RATE_LIMITED", retryAfter: 60 };
}
```

If no `rateLimit` utility exists, implement a thin Redis (Upstash) wrapper:
`server/ludics/auth.ts` → `checkRateLimit(key, max, windowSeconds)`.

> **v2 TODO (B11)** *[ADDED post-review]*. Single-key rate limit by `participantId` leaves a cross-participant abuse vector (one tenant burning another's quota). v2 should adopt a **compound key**: `(tenant, participant) + (tenant, IP)` with separate buckets, e.g. via a token-bucket adapter. Track as OQ-5 (LUDICS_SESSIONS_1_2_SPEC_REVIEW.md §7).

### §6.2 Cache warming (BullMQ job)

`computeBriefingFingerprint` and `computeSyntheticReadout` are called on
every briefing request. Neither is warmed proactively — both run cold on
first access after a server restart or after an argument write.

Add a BullMQ job in `workers/` (or `jobs/`):

**New file: `jobs/warmLudicsCache.ts`**

```typescript
export const WARM_LUDICS_CACHE_JOB = "warm-ludics-cache";

export interface WarmLudicsCachePayload {
  deliberationId: string;
}

// Worker handler: calls computeBriefingFingerprint and computeSyntheticReadout
// for the given deliberation, populating both caches.
```

**Trigger:** Enqueue `WARM_LUDICS_CACHE_JOB` from the argument-write path
(wherever `prisma.argument.create` or `prisma.argument.update` is called for
arguments in a deliberation with a `Behaviour` row).

### §6.3 Observability

Add structured logging to the two expensive paths:

**`server/ludics/articulationLattice.ts` — `computeArticulationJoin`:** *[CORRECTED post-2e/2f]*

```typescript
console.log(JSON.stringify({
  event: "articulation_join",
  deliberationId,
  designIds,
  joinKind,                 // "same-cone-join" | "same-cone-delocation-required" | "cross-cone-rejected"
  closureSteps,             // post-2f Reading A: literal chronicle-set union ⇒ always 0 within a cone
  elapsed: performance.now() - t0,
}));
if (closureSteps > 0) {
  // Post-2f: within-cone ∨ = literal union (no closure rounds). closureSteps > 0 is a substrate violation,
  // not a performance signal. Alert and surface for investigation. Was previously framed as "unusual
  // position complexity" — that interpretation is stale.
  console.warn(JSON.stringify({
    event: "substrate_violation",
    kind: "closure_steps_nonzero",
    deliberationId,
    designIds,
    closureSteps,
  }));
}
```

**`server/ludics/exposureMap.ts` — `computeExposureMap`:**

```typescript
console.log(JSON.stringify({
  event: "exposure_map",
  deliberationId,
  walkedCount: strata.walked.length,
  witnessableCount: strata.witnessable.length,
  latentCount: strata.latent.length,
  elapsed: performance.now() - t0,
}));
```

These structured logs integrate with the existing logging pipeline. *[CORRECTED post-2e/2f]* `closureSteps > 0` is treated as a **substrate violation**, not unusual position complexity — within a cone, ∨_⊥⊥ is the literal chronicle-set union (Phase 2f Reading A) and requires zero closure rounds. The cross-cone case is rejected upstream by `proposeSynthesis`'s pre-flight cone check (§3.3) and never reaches `computeArticulationJoin`.

> **Policy on `closureSteps > 0`.** *[ADDED post-review]* Default is **soft alert** (warn + surface in observability dashboard); upgrade to hard error after one production cycle confirms zero occurrences. Tracked as OQ-6 (LUDICS_SESSIONS_1_2_SPEC_REVIEW.md §7).

### §6.4 Auth audit (`server/ludics/auth.ts`)

Several of the 14 new tools have inline auth logic (checking `MCP_API_TOKEN`
or `resolveCallerUserId`). Extract to a shared module:

**New file: `server/ludics/auth.ts`**

```typescript
export function resolveCallerParticipantId(headers: Headers): string | null
export function requireCallerParticipantId(headers: Headers): string  // throws 401
export async function checkRateLimit(key: string, max: number, windowSeconds: number): Promise<boolean>
```

Update all 14 new route files to import from `server/ludics/auth.ts` rather
than duplicating the auth check inline.

> **v2 TODO (B6)** *[ADDED post-review]*. Shared bearer token + caller `participantId` is sufficient for v1 but lacks per-session and per-tenant scoping. v2 should adopt **scoped session tokens** bound to `(deliberationId, participantId)` with a short TTL, ideally JWT-based to eliminate the server-side session lookup. Track as OQ-7 (LUDICS_SESSIONS_1_2_SPEC_REVIEW.md §7).

### §6.5 Briefing-fingerprint durability *[CORRECTED post-review]*

The in-memory `hashCache` in `server/ludics/briefingFingerprint.ts` does not survive server restarts **and** is not coherent across instances in a horizontally-scaled deployment. Both problems are solved by **dropping the L1 in-memory cache entirely** and using a single shared store (Redis Upstash, already in the stack) as the read-through cache backed by a durable Postgres table.

**New Prisma model** (`lib/models/schema.prisma`):

```prisma
/// Persists the material fields and rule label for each computed briefing
/// fingerprint hash, enabling the /check endpoint to reconstruct staleness
/// across server restarts and across instances.
model BriefingFingerprintHistory {
  id                 String   @id @default(cuid())
  deliberationId     String
  hash               String   @unique
  materialFieldsJson Json
  ruleLabel          String?  // null for the initial computation; R1–R5 for change events
  computedAt         DateTime @default(now())

  @@index([deliberationId, computedAt])
}
```

**Apply:** `npx prisma db push` *[CORRECTED post-review]*.

**`briefingFingerprint.ts` changes:**

1. **Drop the module-level `Map<hash, CacheEntry>`.** It cannot be made coherent in a multi-instance deployment and the staleness risk is not worth the per-hit latency savings.
2. On `computeBriefingFingerprint`: upsert into Redis (key `ludics:fp:<hash>`, value = materialFields JSON, TTL = 24h) AND upsert into `BriefingFingerprintHistory` (durable record). Redis is the hot read path; the table is the recoverable record.
3. On `checkBriefingFingerprint`: read from Redis first; on miss, query `BriefingFingerprintHistory` by `hash`, repopulate Redis, then run the staleness rules.
4. **Concurrent rule firing.** When R1 and R2 both fire on the same write, record the **first** rule that triggered (deterministic order: R1 → R2 → R3 → R4 → R5) and append a `secondaryRules: string[]` column for the rest. Track as OQ-5b until production confirms the policy.

*Removed:* the L1 in-memory + L2 DB split. Reason: L1 in-memory caches have no coherence story across instances (review B12); a single Redis read-through over a durable Postgres record gives the same hot-path latency without the staleness bug.

### §6.6 Test file

`__tests__/invariants/phase2f-production-readiness.test.ts` (~15 tests):

- Rate limiting: `bindParticipantToDesign` returns `RATE_LIMITED` after 10 calls within 1 min
- Rate limiting: different `participantId` values are rate-limited independently
- Rate limiting: the limit resets after the window expires (mock timer)
- Auth: `requireCallerParticipantId` throws 401 when header absent
- Auth: `resolveCallerParticipantId` returns null (not throws) when header absent
- Cache warming job: `WarmLudicsCachePayload` schema validates correctly
- Fingerprint durability: `checkBriefingFingerprint` reconstructs staleness from
  `BriefingFingerprintHistory` when in-memory cache is empty
- Fingerprint durability: `computeBriefingFingerprint` writes a DB row on first call
- Fingerprint durability: second call with same `contentHash` does not create a second row (upsert)
- Structured logging: `computeArticulationJoin` emits `closureSteps` in log output
- Structured logging: `computeArticulationJoin` emits a `substrate_violation` warn record when `closureSteps > 0` *[CORRECTED post-2e/2f]*
- Structured logging: `computeExposureMap` emits stratum counts in log output
- Auth audit: all 14 new route files import from `server/ludics/auth.ts` (static check)
- `propose_synthesis` route: returns 429 when rate limit exceeded
- `retract-witness` route: uses `requireCallerParticipantId` from `auth.ts`
- `BriefingFingerprintHistory`: new hash creates a new row (no upsert-update; hash collision ⇒ same materialFields by construction) *[CORRECTED post-review]*
- Redis read-through: `checkBriefingFingerprint` populates Redis on a Postgres-only hit *[ADDED post-review]*
- Coherence: after a restart, `checkBriefingFingerprint` resolves any previously-computed hash via Postgres without help from any in-memory cache *[ADDED post-review]*

### §6.7 Deliverables

| File | Change |
| --- | --- |
| `server/ludics/auth.ts` | NEW — shared auth + rate-limit helpers |
| `server/ludics/bindParticipant.ts` | Rate-limit call via `auth.ts` |
| `server/ludics/briefingFingerprint.ts` | DB-backed L2 cache using `BriefingFingerprintHistory` |
| `jobs/warmLudicsCache.ts` | NEW — BullMQ cache-warming job |
| `server/ludics/articulationLattice.ts` | Structured logging in `computeArticulationJoin` |
| `server/ludics/exposureMap.ts` | Structured logging in `computeExposureMap` |
| `lib/models/schema.prisma` | `BriefingFingerprintHistory` model |
| All 14 new route files | Import auth from `server/ludics/auth.ts` |
| `__tests__/invariants/phase2f-production-readiness.test.ts` | 15 tests |

---

## §7. Implementation Ordering

### Priority table

| Priority | Phase | Rationale | Estimated tests |
| --- | --- | --- | --- |
| **1** | **2a** — staging migration + benchmarks | Unblocks all live-data work; must run before Phase 2d wiring is meaningful | 12 |
| **2** | **2d** — fossil retraction lifecycle | Completes the write-path story; low code volume, high correctness value | 18 |
| **3** | **2b** — `incarnationSet` manifest field | Closes the §2.2 manifest spec gap; pure eval-layer work, no DB changes | 22 |
| **4** | **2c** — AI synthesis workflow | First end-to-end demo of Phase 1 tools in agent use | 20 |
| **5** | **2f** — production readiness | Required before external agent traffic; can be done in parallel with 2c | 15 |
| **6 (deferred)** | **2e** — OQ-JSL formal proof | Research task; does not block any of the above | — |

**Cumulative test projection:**

| After phase | New tests | Cumulative (from Session 1 baseline: 169) |
| --- | --- | --- |
| 2a | 12 | 181 |
| 2d | 18 | 199 |
| 2b | 22 | 221 |
| 2c | 20 | 241 |
| 2f | 15 | **256** |

### Parallelization notes

- Phase 2a must complete before Phase 2d (fossil wiring needs a real argument-delete path to hook into, which is confirmed in staging)
- Phase 2b is **fully parallel** with Phases 2a, 2c, 2d — it only touches `eval/ai-epi/` files and corpus fixtures
- Phase 2f §6.5 (fingerprint durability) requires the `BriefingFingerprintHistory` migration, which should be batched with the Phase 2d schema addition (§4.4) into a single migration run

### Schema migrations summary

All schema changes in Session 2 (consolidate into a single migration where possible):

| Change | Phase | Model affected |
| --- | --- | --- |
| `argumentId String?` on `LudicMove` | 2d | `LudicMove` |
| `BriefingFingerprintHistory` model | 2f | NEW |

Suggested single migration name: `"phase2_ludics_lifecycle_and_fingerprint_history"`

---

## Status

**Session 2 — ⏳ NOT STARTED**

Open questions to resolve at session start:
1. Confirm which file/function handles argument deletion in the production
   request path (needed to wire Phase 2d §4.3)
2. Confirm whether a `rateLimit` utility exists in `lib/` (needed for Phase 2f §6.1)
3. Confirm whether a BullMQ worker infrastructure exists in `workers/` or `jobs/`
   (needed for Phase 2f §6.2)

These can be resolved with targeted searches at the start of the session:
```bash
grep -r "deleteArgument\|\.delete.*argument\|argument.*\.delete" app/api/ server/ --include="*.ts" -l
grep -r "rateLimit\|rate.limit" lib/ server/ --include="*.ts" -l
ls workers/ jobs/
```
