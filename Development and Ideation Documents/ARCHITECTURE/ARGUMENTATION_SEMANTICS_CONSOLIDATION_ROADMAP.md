# Argumentation-Semantics Engine — Consolidation & Strengthening Roadmap

- **status:** draft (opened 2026-05-31)
- **kind:** implementation track (operationalises the §4 acceptability
  computation of the Ludics→Ambler runtime contract)
- **upstream research:**
  [Q-031](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md#q-031)
  (cyclic-defeat closure — the acceptability fixpoint over
  $\mathcal{P}_{\mathrm{fin}}(\mathsf{Inc}(B))$ is finite and exact),
  [Q-037](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md#q-037)
  (δ₁≅δ₂, propositional fragment),
  [Q-028a stratum-2](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md#q-028a)
  (higher-order generators — the only remaining guarded path).
- **runtime contract:**
  [`LUDICS_AMBLER_BRIDGE_RUNTIME_CONTRACT.md`](LUDICS_AMBLER_BRIDGE_RUNTIME_CONTRACT.md)
  §3 (deterministic projection), §4 (guarded fallback / acceptability).

---

## 0. Why this track exists (the problem in one paragraph)

The repo currently carries **at least four overlapping Dung-AF engines** plus
inline re-implementations inside route handlers. Grounded extension is
implemented ≥ 3 times; preferred extension ≥ 2 times; skeptical/credulous
labelling is reinvented per route. Two of the preferred-extension paths fall
back to an **unsound random/greedy approximation** above a node-count
threshold. The
[cyclic-defeat closure (Q-031)](../../RESEARCH_PROGRAMME/audits/q031-cyclic-defeat-collapse-2026-05-31.md)
removed the last theoretical excuse for approximation: the acceptability
computation is a **finite Knaster–Tarski fixpoint** over a finite lattice,
reached in $\leq |\mathsf{Inc}(B)|$ steps. The engine should therefore be
**single, exact, and labelling-based**. The fragmentation — not the
mathematics — is the main thing weakening the implementation.

### Inventory (the surface to consolidate)

| Location | Semantics | Liability |
|---|---|---|
| [`lib/aspic/semantics.ts`](../../lib/aspic/semantics.ts) | grounded only | structured (ASPIC+); no preferred/stable |
| [`lib/aspic/defeats.ts`](../../lib/aspic/defeats.ts) | — (defeat computation) | preference-based defeat never reaches preferred/stable |
| [`lib/argumentation/afEngine.ts`](../../lib/argumentation/afEngine.ts) | grounded + preferred | preferred = **random multi-start greedy** (unsound) |
| [`lib/agora/acceptance.ts`](../../lib/agora/acceptance.ts) | grounded + preferred | thin wrapper; reinvents labelling |
| [`lib/deepdive/af.ts`](../../lib/deepdive/af.ts) | preferred | exact ≤ 18 nodes, **heuristic > 18** (unsound) |
| [`app/api/deliberations/[id]/dialectic/route.ts`](../../app/api/deliberations/%5Bid%5D/dialectic/route.ts) | grounded (inline) | its *own* `groundedExtension` |
| [`app/api/sheets/[id]/route.ts`](../../app/api/sheets/%5Bid%5D/route.ts) | grounded + preferred | inline skeptical/credulous labelling |

---

## 1. Target architecture

A single module — **`lib/argumentation/`** — exporting one labelling-based
core and the standard derived predicates. Everything else calls into it.

```
lib/argumentation/
  types.ts          DefeatGraph, Labelling, Label = IN|OUT|UNDEC, Provenance
  labelling.ts      complete-labelling core (the primitive)
  semantics.ts      grounded | preferred | stable | semiStable (constraints on labellings)
  acceptance.ts     skeptical | credulous (derived from the extension set)
  instantiate.ts    ASPIC+ (attacks + preferences) → DefeatGraph  [rationality postulates]
  exact.ts          SAT/ASP reduction for exact preferred/stable at scale
  incremental.ts    monotone grounded relabelling on graph extension
  index.ts          public surface
```

**Design commitments**

- **C1 — Labelling is primitive.** Compute the **complete labelling**
  (Caminada–Gabbay) and derive grounded / preferred / stable / semi-stable as
  constraints on labellings, rather than enumerating extensions and back-deriving
  labels. UNDEC becomes first-class — required because the Q-031 verdict says an
  **odd attack cycle** legitimately resolves to UNDEC under grounded but yields
  two extensions under stable.
- **C2 — Exact, never approximate.** Grounded is poly-time (least fixpoint).
  Preferred/stable use the **stable-models / SAT reduction** (ASPARTIX-style),
  which is exact and scales past the current 18-node ceiling. Delete both
  approximation fallbacks.
- **C3 — Typed defeat graph with provenance.** Nodes carry whether they came
  from a **verified propositional projection** (in-fragment, contract §3) or an
  **unverified higher-order projection** (contract §4 — must never be persisted
  as canonical). The runtime contract *mandates* this distinction; nothing
  carries it today.
- **C4 — Level separation is a type invariant.** Acceptability is a
  $\mathcal{P}_{\mathrm{fin}}(\mathsf{Inc}(B))$ operation (contract §3
  "aggregation lives one level up"). The acceptability functor operates on the
  power-set level so Phase-2e Cross-Cone Incompatibility cannot be violated by a
  route handler merging designs inside $\mathsf{Inc}(B)$.

---

## 2. Phases

### Phase 0 — Consolidation (mechanical, critical path)

Removes correctness-drift risk immediately; no behaviour change intended.
**Status: ✅ done (2026-05-31).** Implemented in
[`lib/argumentation/index.ts`](../../lib/argumentation/index.ts).

- 0a. Create `lib/argumentation/index.ts` re-exporting the *current best* exact
  implementations (grounded from any correct copy; preferred from
  [`lib/deepdive/af.ts`](../../lib/deepdive/af.ts)'s exact ≤ 18 branch) behind
  the target public surface.
- 0b. Repoint [`dialectic/route.ts`](../../app/api/deliberations/%5Bid%5D/dialectic/route.ts)
  and [`sheets/route.ts`](../../app/api/sheets/%5Bid%5D/route.ts) to the new
  surface; delete their inline `groundedExtension` / labelling code.
- 0c. Repoint [`lib/agora/acceptance.ts`](../../lib/agora/acceptance.ts) to the
  new surface; keep its `'grounded'|'preferred'|'hybrid'` API as a thin adapter.
- 0d. Mark [`lib/deepdive/af.ts`](../../lib/deepdive/af.ts) and
  [`lib/argumentation/afEngine.ts`](../../lib/argumentation/afEngine.ts) as
  `@deprecated`, re-exporting from the new core. Do **not** delete until all
  call sites move (search-and-verify in 0e).
- 0e. `grep` for `groundedExtension|preferredExtensions|buildAttackGraph|computeGroundedExtension`
  across `app/`, `lib/`, `components/`; confirm every call site routes through
  the new surface.
- **Deliverable:** one engine of record; duplicates deprecated, not yet deleted.
- **Gate:** existing tests green; golden-output parity on a fixed set of AF
  fixtures before/after.

**Phase 0 outcome.** The canonical attack-map `groundedExtension` now lives in
`lib/argumentation/index.ts` (byte-identical to the two route copies it
replaced, so parity is by construction). All production call sites
(`dialectic`/`sheets` routes, `agora/acceptance`, `afAcceptance`,
`deepdive/selection`, and the `components/dialogue|graph|arguments` consumers)
import from `@/lib/argumentation`. `afEngine.ts` and `deepdive/af.ts` carry
`@deprecated` banners and remain the (re-exported) implementation homes until
Phase 4c deletion. The only remaining `./af` direct import is
`lib/agora/acceptance.ts` → `lib/agora/af.ts`, an unrelated `DebateNode`
projector.

### Phase 1 — Labelling core + exact semantics

**Status: ✅ done (2026-05-31).** Core in
[`lib/argumentation/labelling.ts`](../../lib/argumentation/labelling.ts) +
[`semantics.ts`](../../lib/argumentation/semantics.ts) +
[`types.ts`](../../lib/argumentation/types.ts). Golden-fixture parity and
property tests in
[`__tests__/afGoldenFixtures.test.ts`](../../lib/argumentation/__tests__/afGoldenFixtures.test.ts)
and [`__tests__/semantics.test.ts`](../../lib/argumentation/__tests__/semantics.test.ts)
(39 tests green).

- 1a. Implement `labelling.ts` complete-labelling core (C1).
- 1b. Derive `grounded` (least complete labelling — most UNDEC), `preferred`
  (maximal IN), `stable` (no UNDEC), `semiStable` (minimal UNDEC) as constraints.
- 1c. Implement `exact.ts` SAT/ASP reduction for preferred/stable (C2); wire it
  as the implementation behind 1b for graphs above a small exact-enumeration
  threshold. **Delete** the random/greedy fallbacks in
  [`af.ts`](../../lib/deepdive/af.ts) and
  [`afEngine.ts`](../../lib/argumentation/afEngine.ts).
- 1d. Property tests: grounded ⊆ every preferred; stable ⊆ preferred; on the
  even cycle → 2 stable extensions; on the odd cycle → grounded all-UNDEC, no
  stable extension. (These are the Q-031 verdict's worked cases.)
- **Deliverable:** all four semantics from one algorithm; no approximation.
- **Gate:** property tests + a benchmark showing exact preferred/stable past the
  old 18-node ceiling.

**Phase 1 outcome.** Grounded / preferred / stable / semi-stable now all derive
from one exact enumeration of *complete extensions*, seeded by the grounded
labelling so only the undecided core is branched over. The unsound fallbacks are
gone: `afEngine.preferred` and `deepdive/af.preferredExtensions` delegate to the
core (`semantics.preferredExtensions`), and `afEngine.grounded` delegates to
`labelling.groundedExtension` — single source of truth for every semantics.
Exactness past the old 18-node ceiling is covered by the `2^10`-stable-extension
test. Deviation from the roadmap text: 1c's exactness is achieved by a
grounded-seeded backtracking enumerator rather than an external SAT/ASP solver
(no new infra dependency); an ASPARTIX-style reduction remains a possible future
optimisation behind the same `semantics.ts` surface.

### Phase 2 — ASPIC+ instantiation contract

Makes preferences actually bind on preferred/stable (today they only reach
grounded via [`lib/aspic/`](../../lib/aspic/)).

**Status: ✅ done (2026-06-01).** Bridge in
[`lib/argumentation/instantiate.ts`](../../lib/argumentation/instantiate.ts);
[`lib/aspic/semantics.ts`](../../lib/aspic/semantics.ts) `computeGroundedExtension`
now delegates to the shared core. Tests in
[`__tests__/instantiate.test.ts`](../../lib/argumentation/__tests__/instantiate.test.ts);
existing ASPIC+ suites (`tests/aspic/semantics`, `rationality`, `core`,
`strictRules`, `transposition`) remain green as the regression gate.

- 2a. Implement `instantiate.ts`: ASPIC+ attacks +
  [`defeats.ts`](../../lib/aspic/defeats.ts) preference resolution → typed
  `DefeatGraph` consumed by the Dung core.
- 2b. Encode and test the **rationality postulates** (Caminada–Amgoud: closure,
  direct/indirect consistency, sub-argument closure) on the instantiated graph.
- 2c. Migrate [`lib/aspic/semantics.ts`](../../lib/aspic/semantics.ts) to derive
  grounded from the shared core rather than its own fixpoint loop.
- **Deliverable:** structured (ASPIC+) and abstract (Dung) layers share one
  defeat graph; preferences influence every semantics.
- **Gate:** postulate tests pass on the aspirin fact-base fixtures.

**Phase 2 outcome.** `instantiateDefeatGraph(args, defeats)` turns a
preference-resolved ASPIC+ `Defeat[]` relation (defeater → defeated) into the
representation-neutral `DefeatGraph`, so structured theories now get the *same*
exact grounded / preferred / stable / semi-stable as every other caller —
preferences carried by `defeats.ts` reach preferred/stable for the first time
(tested: a⇄b instantiates to two preferred/stable extensions; an asymmetric
preference-resolved defeat yields a single winner). `computeGroundedExtension`
keeps its `GroundedExtension` shape (incl. the `iterations` diagnostic, now fed
by the core's `groundedLabellingDetailed`) but no longer runs a private fixpoint
loop; its dead `characteristicFunction`/`computeDefeatedBy` helpers were removed.
Deviation: 2b's rationality postulates were already implemented in
[`lib/aspic/rationality.ts`](../../lib/aspic/rationality.ts) and exercised by
`tests/aspic/rationality.test.ts` — kept as-is (they operate on the ASPIC+
`GroundedExtension`, which is now core-derived), rather than re-encoded against
the raw `DefeatGraph`.

### Phase 3 — Typed bridge integration (level separation + provenance) ✅ done

> **Outcome.** The runtime contract's §3/§4 in-fragment vs unverified split is
> now a type-level invariant. `types.ts` `DefeatGraph` carries optional
> `preferences` and a per-argument `provenance` map (`verified-propositional` |
> `unverified-higher-order`, C3); absent entries default to verified so all
> Phase 1/2 callers and `instantiateDefeatGraph` stay backward-compatible. New
> `acceptability.ts` exposes (a) the level-separated aggregation layer — a
> branded `FiniteArgumentSet` for `𝒫_fin(Inc(B))` with the free-JSL join
> (`liftToPowerSet` / `joinArgumentSets` / `joinAll`, C4) so route handlers
> cannot merge designs inside `Inc(B)`; (b) the **acceptability functor**
> `acceptability(dg): Labelling` (the finite grounded fixpoint, Q-031); and
> (c) the contract §4 guard — `unverifiedArguments`, `isCanonicalPersistable`,
> `assertCanonicalPersistable` (throws), `partitionByProvenance`. All re-exported
> from `@/lib/argumentation`. Gate met: `acceptability.test.ts` feeds a
> λ-abstraction instance and asserts it is *labelled* but routed to the
> unverified path and refused as canonical (T-GUARD), and feeds odd/even
> cyclic-`Γ` instances and asserts they are in-fragment and resolved by the
> finite fixpoint (odd → all-UNDEC). 22 AF/bridge tests + 48 ASPIC+ regression
> tests green.

- 3a. `types.ts`: `DefeatGraph = { arguments, attacks, preferences, provenance }`
  where `provenance ∈ { verified-propositional, unverified-higher-order }` (C3).
- 3b. Define the **acceptability functor**
  `AF(𝒫_fin(Inc(B))) → Labelling` so aggregation is typed at the power-set
  level (C4); route handlers cannot merge designs inside $\mathsf{Inc}(B)$.
- 3c. Enforce contract §4: `unverified-higher-order` nodes are labelled and
  **never persisted as canonical bridge data**. Add a guard + test.
- **Deliverable:** the runtime contract's §3/§4 in-fragment vs unverified split
  is a type-level invariant, not a convention.
- **Gate:** a test that feeds a λ-abstraction (higher-order) instance and asserts
  it is routed to the unverified path (contract T-GUARD), and a cyclic-`Γ`
  instance and asserts it is **in fragment** and resolved by the finite
  acceptability fixpoint.

### Phase 4 — Performance & policy (incremental, deferrable) ✅ done

> **Outcome.** All three parts landed. (4a) `incremental.ts` recomputes the
> grounded labelling on graph extension by recomputing only the *affected
> region* — newly-added arguments, arguments whose attacker set changed, and the
> forward-reachable closure along attack edges — reusing the previous labels for
> the untouched part. It is exact, not approximate (C2): `relabelOnExtend` is
> proven bit-for-bit identical to a full recompute, asserted on 40 randomised
> extensions plus chain/cycle cases. (4b) The acceptance semantics is now a
> stored per-deliberation setting: schema enum `ArgumentSemantics { grounded |
> preferred | stable }` with `Deliberation.argumentSemantics @default(preferred)`
> (pushed via `prisma db push`), and `policy.ts` exposes
> `resolveSemanticsPolicy({ override, stored })` (precedence: query-param override
> → stored setting → default) and `policyLabelling(dg, policy)` as the single
> dispatch point. The two route handlers
> ([`sheets/[id]`](../../app/api/sheets/[id]/route.ts),
> [`deliberations/[id]/dialectic`](../../app/api/deliberations/[id]/dialectic/route.ts))
> now resolve the stored policy and delegate to `policyLabelling`, deleting their
> inline grounded/preferred branching. (4c) The deprecated `lib/deepdive/af.ts`
> and `lib/argumentation/afEngine.ts` engines were deleted; their still-needed
> adapter content (attack-map + edge-list ↔ `DefeatGraph` translation) moved into
> the non-deprecated `lib/argumentation/adapters.ts`, leaving zero references to
> the removed modules. Gate met: lint clean on all changed files; 14 new Phase 4
> tests + 112 AF/ASPIC+ tests green (the lone failure is the pre-existing
> DB-dependent `schemeInference.phase4` suite, unrelated to the engine).

- 4a. `incremental.ts`: monotone grounded relabelling on graph extension —
  adding arguments only shifts IN→UNDEC/OUT downstream, so deliberation updates
  relabel incrementally rather than recomputing.
- 4b. Surface the **semantics policy** (skeptical-grounded vs credulous-preferred
  vs stable) as a stored per-deliberation setting, replacing the scattered
  query-param defaults in the route handlers. The Q-031 verdict requires this:
  odd cycles have no grounded verdict and need an explicit policy.
- 4c. Delete the deprecated [`af.ts`](../../lib/deepdive/af.ts) /
  [`afEngine.ts`](../../lib/argumentation/afEngine.ts) once Phase 0e confirms
  zero remaining call sites.
- **Deliverable:** incremental relabelling + explicit policy; dead engines removed.
- **Gate:** lint clean; no remaining references to deprecated modules.

---

## 3. Sequencing

```
Phase 0 (consolidate)  ──►  Phase 1 (labelling core + exact)
                                  │
                                  ├──►  Phase 2 (ASPIC+ instantiation)
                                  └──►  Phase 3 (typed bridge integration)
                                            │
                                            └──►  Phase 4 (perf + policy + delete)
```

Phases 0–3 are the load-bearing work. The Q-031 closure guarantees all of it is
**finite and exact**, so there is no remaining justification for the
approximation fallbacks. Phase 4 is performance and cleanup.

## 4. Out of scope

- **Higher-order generators.** The unverified path of Phase 3 is *guarded*, not
  *closed*; making it canonical is
  [Q-028a stratum-2](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md#q-028a),
  gated on [Q-032](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md#q-032)
  / [Q-030](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md#q-030). This
  roadmap only ensures such inputs are *correctly refused as canonical*.
- **Confidence-graded argument strength** (weighted/probabilistic AF) — a
  separate research line, not part of consolidation.

## 5. References

- [`LUDICS_AMBLER_BRIDGE_RUNTIME_CONTRACT.md`](LUDICS_AMBLER_BRIDGE_RUNTIME_CONTRACT.md)
  §3–§5 (projection, fallback, open forks).
- [cyclic-defeat audit](../../RESEARCH_PROGRAMME/audits/q031-cyclic-defeat-collapse-2026-05-31.md)
  (the finite-acceptability-fixpoint result this track relies on).
- Dung, P. M. (1995). *On the acceptability of arguments…* AIJ 77(2).
- Caminada, M. & Gabbay, D. (2009). *A logical account of formal argumentation.*
  Studia Logica 93 (labelling-based semantics).
- Caminada, M. & Amgoud, L. (2007). *On the evaluation of argumentation
  formalisms.* AIJ 171 (rationality postulates).
- Modgil, S. & Prakken, H. (2013). *A general account of argumentation with
  preferences.* AIJ 195 (ASPIC+).
- Egly, U., Gaggl, S. A. & Woltran, S. (2010). *ASPARTIX: Answer-set programming
  argumentation reasoning tool* (exact preferred/stable via ASP).
