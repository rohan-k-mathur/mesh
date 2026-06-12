# Implementation Tracks

> Pointer document. The research programme decides *what*; implementation
> tracks decide *how*. This document indexes the implementation specs that
> operationalise resolved or partially-resolved research items, and records
> the back-references so the research side stays linked to its downstream
> engineering work.

This file is **append-only** in the same discipline as the open-questions
registry. When a new implementation track is opened, append it here with
its upstream research dependencies and downstream code surfaces. When a
track ships, mark its phases complete; do not delete.

---

## Schemes — Layered ontology implementation track

**Opened:** 2026-05-27, following [`../Development and Ideation Documents/ARCHITECTURE/SCHEMES_ONTOLOGY_DECISION.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_ONTOLOGY_DECISION.md) (Outcome A — LAYERED) and [T003 — Schemes Layered Coherence](02_THEOREMS_AND_PROOFS/T003-schemes-layered-coherence.md).

**Architectural premises** (from the implementation overview, P1–P5):

- P1 — Layered scheme ontology is the data model
- P2 — Soundness as a runtime invariant, not a DB constraint
- P3 — Non-injectivity of $\mathcal{B}$ is a UX problem
- P4 — `inheritCQs: false` is incoherent and must be retired or reclassified
- P5 — Three layers conceptual now, materialised later

### Spec index

| # | Spec | Layer / Surface | Research items operationalised |
|---|------|-----------------|--------------------------------|
| 1 | [`SCHEMES_IMPL_OVERVIEW.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_IMPL_OVERVIEW.md) | — (architectural preamble) | T003, C006, C007, C008 |
| 5 | [`SCHEMES_IMPL_AUDIT_PROTOCOLS.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_IMPL_AUDIT_PROTOCOLS.md) | data-producing audits | Q-018, Q-019, Q-020 |
| 2 | [`SCHEMES_IMPL_ADMIN_TIGHTENING.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_IMPL_ADMIN_TIGHTENING.md) | C007 — authoring | T003 (WF1/WF2/WF3); Q-012 resolution; Q-019 retirement |
| 3 | [`SCHEMES_IMPL_PROTOCOL_SOUNDNESS.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_IMPL_PROTOCOL_SOUNDNESS.md) | C008 — runtime / room protocol | T003 (soundness inclusion); LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md §2.1 (latent stratum) |
| 4 | [`SCHEMES_IMPL_VERIFIER.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_IMPL_VERIFIER.md) | C006 — behaviour-equality, non-redundancy, AIF identity | Q-021 (route b); Q-014 (input to ontology-vs-folksonomy decision); Q-020 (input to fingerprint scope) |

**Implementation order:** 1 → 5 → 2 / 3 / 4 in parallel.

### Research-side back-references

Each of the following research entries now carries an `implementation-spec:` line pointing into this track:

- [Q-012](01_OPEN_QUESTIONS_REGISTRY.md#q-012) — closed-by-rationale; implemented by Spec 2 (inheritance monotonicity + `inheritCQs` retirement)
- [Q-014](01_OPEN_QUESTIONS_REGISTRY.md#q-014) — open; Spec 4 verifier provides empirical input (catalogue-redundancy audit) and Spec 5 Q-018 audit provides the other input
- [Q-015](01_OPEN_QUESTIONS_REGISTRY.md#q-015) — open; explicitly out of scope for this implementation track but referenced as the downstream cross-instance soundness work
- [Q-018](01_OPEN_QUESTIONS_REGISTRY.md#q-018) — open; implemented by Spec 5 phase 5b
- [Q-019](01_OPEN_QUESTIONS_REGISTRY.md#q-019) — open; implemented by Spec 5 phase 5a + Spec 2 phase 2c
- [Q-020](01_OPEN_QUESTIONS_REGISTRY.md#q-020) — open; implemented by Spec 5 phase 5c + Spec 4 phase 4c (AIF round-trip)
- [Q-021](01_OPEN_QUESTIONS_REGISTRY.md#q-021) — open; implemented by Spec 4 (route (b) certificate-based verifier)
- [T003](02_THEOREMS_AND_PROOFS/T003-schemes-layered-coherence.md) — established; operationalised by Spec 2 (WF1/WF2/WF3 enforce the three coherence conditions) and Spec 3 (instance-close soundness gate enforces the soundness inclusion)
- [C006](03_CONJECTURES/C006-scheme-as-behaviour.md), [C007](03_CONJECTURES/C007-scheme-as-design-schema.md), [C008](03_CONJECTURES/C008-scheme-as-protocol-constraint.md) — confirmed (layered); the three layers correspond directly to specs 4 (C006), 2 (C007), 3 (C008) respectively

### Track-internal open items

These are *implementation-side* open items raised by the spec drafts;
they are downstream of, but not the same as, the research-side
Q-NNN entries.

- **Fingerprint scope** (Spec 4 §3.5, §4.3). The current fingerprint covers CQ-bundle structural fields + premise arity + `epistemicMode` (widened 2026-05-28 by [Q-020 audit](../audits/q020-external-fields-20260528.md) §4). Fingerprint scope is intentionally widenable; future widenings should cite an audit or worked counterexample. *(Framing reinforced 2026-05-27: Spec 4 §1 carries an upfront two-tier callout — fingerprint is necessary-but-not-sufficient; verifier is the sufficient check; "any reader who catches a code path that treats fingerprint match as equality is looking at a bug".)*

### Closed track-internal items

- **Disambiguate `ArgumentSchemeInstance` vs `SchemeInstance`** *(closed 2026-05-27)*. Verdict: the two tables are **orthogonal**, not alternatives. `ArgumentSchemeInstance` is per-argument scheme-assignment metadata (role/confidence/isPrimary/ruleType); `SchemeInstance` is the per-target filled-form record holding answered slot values, and `CriticalQuestion.instanceId` FKs to `SchemeInstance`. **`SchemeInstance` is therefore the canonical play-time anchor for the Spec 3 soundness gate.** Spec 3 §3.1 rewritten with the table-of-differences and propagation through §3.4, §4.1, §4.2, §4.3 (where §4.3 now adds an additive `status` column to `SchemeInstance`).
- **WF3 sibling false-positives — phase-ordering constraint** *(closed 2026-05-28 by audit data, superseding the 2026-05-27 phase-ordering rescue)*. Q-019 audit at [`audits/q019-inherit-cqs-false-20260528.md`](../audits/q019-inherit-cqs-false-20260528.md) returned **zero rows** (0 of 31 schemes use `inheritCQs: false`). No `sibling-navigational` uses exist in production, so the phase-ordering constraint that required Shape B before WF3's severity flip dissolves. Spec 2 §6 Phase 2b reverted to "WF3 flips on the original phase-2b schedule"; R2 in §7 marked closed; Shape B is now vestigial — only Shape A (retirement) ships in phase 2c.
- **Q-019 — `inheritCQs: false` audit** *(closed-by-experiment 2026-05-28)*. Spec 5 phase 5a executed via `npm run audit:q019` produced [`audits/q019-inherit-cqs-false-20260528.json`](../audits/q019-inherit-cqs-false-20260528.json) + [`.md`](../audits/q019-inherit-cqs-false-20260528.md). Zero rows. Q-019 registry entry flipped to `closed-by-experiment` citing the dated audit file.
- **Q-018 — OntoClean meta-property audit** *(closed-by-experiment 2026-05-28; first-pass single-analyst)*. Spec 5 phase 5b executed via `npm run audit:q018` then `:classify` then `:format` produced [`audits/q018-ontoclean-20260528.json`](../audits/q018-ontoclean-20260528.json) + [`.md`](../audits/q018-ontoclean-20260528.md). **0 rigid / 31 non-rigid / 0 anti-rigid**; 0 strict OntoClean violations; 1 soft violation (`scheme_test`); 3 duplicate-candidate pairs; 2 test placeholders in production; 4 dialogue-meta entries miscategorised; 9 of 31 schemes have no cluster tag. Verdict for [Q-014](01_OPEN_QUESTIONS_REGISTRY.md#q-014): catalogue is **folksonomy in practice, ontology in aspiration**. Anti-rigidity obstruction to the ontology reading is structurally void (no anti-rigid schemes exist), so Spec 3 phase 3d (Carneades `premiseType` defaults) is unobstructed. Spec 2 phase 2b WF1 back-test should prioritise the three duplicate pairs; Spec 4 phase 4a verifier test corpus seeded with the same three pairs.
- **Q-020 — External-catalogue field comparison** *(closed-by-experiment 2026-05-28; first-pass single-analyst)*. Spec 5 phase 5c produced [`audits/q020-external-fields-20260528.csv`](../audits/q020-external-fields-20260528.csv) + [`.md`](../audits/q020-external-fields-20260528.md). 51 fields across 7 catalogues: **19 exposed (37%), 11 representable-but-absent (22%), 12 intentional-exclusion (24%), 6 accidental-omission (12%), 3 externally-load-bearing-internally-irrelevant (6%)**. Substrate posture is principled minimalism (59% covered directly or by derivation). Six omissions cluster into five follow-on questions [Q-022 through Q-026](01_OPEN_QUESTIONS_REGISTRY.md#q-020-catalogue-comparison-follow-ons-q-022--q-026). Spec 4 §3.5 widens fingerprint domain to include `epistemicMode`; Spec 4 phase 4c soundness predicate refined to `import(export(scheme)) ≡_substrate-relevant scheme`.

### When to update this document

- A new implementation track opens (e.g. a separate track for `Ludics`
  substrate work): add a new top-level section with the same shape.
- A spec lands a major version (e.g. spec 2 phase 2c ships): update the
  spec index status column and add a `shipped-on:` date.
- A research item closes and prompts a new spec: add the spec to the
  index and the back-reference to the research-side entries section.
- A track-internal open item resolves: move it out of "Track-internal
  open items" and into a brief "Closed" subsection with the resolution.

---

## Ludics↔Ambler bridge — runtime contract track

**Opened:** 2026-05-31, following the positive close of
[Q-037](01_OPEN_QUESTIONS_REGISTRY.md#q-037) (δ₁ ≅ δ₂ on the settled fragment)
and the discovery-positive [Q-028a](01_OPEN_QUESTIONS_REGISTRY.md#q-028a)
stratum-1. This track operationalises the bridge's *computational content* — the
deterministic `Inc(B) → 𝒞/Γ` translation — and records the δ-scheduler decision.

**Architectural premises:**

- L1 — The deliberation runtime stays a **δ₂ (coroutine) engine**; Q-037 proved
  its presentation faithful to the δ₁ proof semantics via `ν` (normalisation), so
  **no scheduler rewrite**.
- L2 — Faithfulness is a **runtime invariant** (run the coroutine to quiescence,
  read off the surviving material design = the δ₁ design), not a DB constraint.
- L3 — The contract is **fragment-scoped** (flat / one-level-nested defeat over
  acyclic `Γ`, propositional generators); out-of-fragment inputs route to a
  guarded fallback, never to a false correctness assertion.
- L4 — **Aggregation is one level up** (`𝒫_fin(Inc(B))`), never a design-level
  merge — the generator/power-set separation C001b′ relies on.

### Spec index

| # | Spec | Layer / Surface | Research items operationalised |
|---|------|-----------------|--------------------------------|
| L | [`LUDICS_AMBLER_BRIDGE_RUNTIME_CONTRACT.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/LUDICS_AMBLER_BRIDGE_RUNTIME_CONTRACT.md) | challenge scheduler + `Inc(B)→𝒞/Γ` projection | Q-037 (δ scheduler decision); Q-028a stratum-1 (projection algorithm) |

**Implementation order:** the contract is a *standing invariant + projection
algorithm*, not a phased migration; wire the §6 test obligations (T-INV, T-PROJ,
T-CARD, T-GUARD, T-ACCUM) first, then enforce I1–I3 in the scheduler.

### Research-side back-references

- [Q-037](01_OPEN_QUESTIONS_REGISTRY.md#q-037) — closed positive on the settled
  fragment; operationalised by Spec L (§2 scheduler invariants, §6 T-INV).
- [Q-028a](01_OPEN_QUESTIONS_REGISTRY.md#q-028a) — stratum-1 discovery-positive;
  operationalised by Spec L §3 (the deterministic projection) + §6 T-PROJ.

### Track-internal open items

These gate the **unrestricted** contract (lifting Spec L §1 guards G1–G3); they
are downstream of the research forks, not new engineering decisions.

- **Defeat-depth bound threshold** (Spec L §4, §5). **CLOSED 2026-05-31.** Full
  [Q-031](01_OPEN_QUESTIONS_REGISTRY.md#q-031) closed the cyclic /
  unbounded-depth case: **no depth bound is needed** and **no μ-Ludics
  infrastructure** — guards G1/G2 lifted. Cyclic inputs are in fragment; cycle
  resolution is the finite acceptability fixpoint over
  $\mathcal{P}_{\mathrm{fin}}(\mathsf{Inc}(B))$, one level up. The configured
  depth-bound TODO at the config site is **removed**, not defaulted. See the
  [cyclic-defeat audit](../Development%20and%20Ideation%20Documents/ARCHITECTURE/ARGUMENTATION_SEMANTICS_CONSOLIDATION_ROADMAP.md)
  consumer track below, which operationalises this acceptability computation.
- **Higher-order projection** (Spec L §4, §5). The §3 projection is proven
  canonical only for propositional generators (Q-028a stratum-1). λ-abstraction
  generators stay *unverified* until Q-028a stratum-2; do not persist them as
  canonical bridge data.

---

## Argumentation-semantics engine — consolidation & strengthening track

**Opened:** 2026-05-31, downstream of the
[Q-031 cyclic-defeat closure](01_OPEN_QUESTIONS_REGISTRY.md#q-031). The closure
established that the acceptability computation over
$\mathcal{P}_{\mathrm{fin}}(\mathsf{Inc}(B))$ is a **finite, exact**
Knaster–Tarski fixpoint, which removes the last justification for the repo's
**approximate** Dung-AF fallbacks. This track consolidates the **four+
overlapping AF engines** into one exact, labelling-based core and wires the
runtime contract's §3/§4 in-fragment-vs-unverified split into the type system.

**Architectural premises:**

- A1 — **One engine of record** (`lib/argumentation/`); grounded/preferred/stable
  reinvented ≥ 3× across `lib/` and route handlers today.
- A2 — **Labelling is primitive** (complete labelling → derive all semantics);
  UNDEC first-class (the odd-cycle case from the Q-031 verdict).
- A3 — **Exact, never approximate** — delete the `>18 nodes → greedy/random`
  fallbacks; use a SAT/ASP reduction for exact preferred/stable at scale.
- A4 — **Level separation is a type invariant** — acceptability is a
  $\mathcal{P}_{\mathrm{fin}}(\mathsf{Inc}(B))$ operation (Spec L L4), never a
  design-level merge; provenance distinguishes verified-propositional from
  unverified-higher-order nodes (Spec L §4).

### Spec index

| # | Spec | Layer / Surface | Research items operationalised |
|---|------|-----------------|--------------------------------|
| AS | [`ARGUMENTATION_SEMANTICS_CONSOLIDATION_ROADMAP.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/ARGUMENTATION_SEMANTICS_CONSOLIDATION_ROADMAP.md) | Dung-AF engine + ASPIC+ instantiation + bridge acceptability | Q-031 (finite acceptability fixpoint); Q-037 (§4 fallback resolved); Q-028a stratum-2 (unverified higher-order guard) |

**Implementation order:** Phase 0 (consolidate) → Phase 1 (labelling core +
exact) → Phase 2 (ASPIC+ instantiation) ∥ Phase 3 (typed bridge integration) →
Phase 4 (perf + policy + delete deprecated engines).

### Research-side back-references

- [Q-031](01_OPEN_QUESTIONS_REGISTRY.md#q-031) — closed positive (propositional);
  operationalised by Spec AS Phase 1/3 (the finite acceptability fixpoint is the
  engine's preferred/stable computation, *not* μ-infrastructure).
- [Q-037](01_OPEN_QUESTIONS_REGISTRY.md#q-037) — closed positive; Spec L §4
  fallback is resolved (neither depth-bound nor μ), which Spec AS Phase 3
  enforces as the in-fragment cyclic path.
- [Q-028a](01_OPEN_QUESTIONS_REGISTRY.md#q-028a) — stratum-2 open; Spec AS
  Phase 3c keeps higher-order nodes on the *unverified* path (never persisted as
  canonical), the engineering counterpart of the still-guarded G3.

---

## Confidence algebra — log-odds semiring migration track

**Opened:** 2026-06-03, downstream of
[session 01 — confidence algebra: semiring vs. quantale](10_IDEATION_SESSIONS/01-confidence-algebra-semiring-vs-quantale-2026-06-02.md)
(Resolved, documentation-level) and the
[`09_FUTURE_DIRECTIONS_BRAINSTORM.md`](09_FUTURE_DIRECTIONS_BRAINSTORM.md) §3
decisions block. The session settled the algebra question: adopt a **log-odds /
weight-of-evidence semiring** for confidence, deprecate the noisy-OR `product`
reducer (algebraically unsound — `×` does not distribute over noisy-OR, so it is
not a semiring; see the session's counterexample at `h=0.5, f=0.6, g=0.7`),
reclassify `min` as the distributive-quantale skeptical projection, and **replace
Dempster–Shafer outright** with signed evidence. The decision is made; this track
operationalises it as a **non-destructive, flag-gated code migration**.

**Architectural premises:**

- M1 — **One composition law of record**: corroboration ⊕ = addition in log-odds
  space `w(c) = log(c/(1−c))` (identity `0` = `c=0.5` = "no evidence"); pro/con =
  signed addition (`w₊ + w₋`). Lawful, associative, monotone, unbounded stacking.
- M2 — **Persistence stays in `[0,1]`; the algebra lives at the reducer
  boundary.** The log-odds space is the *composition* space, not the *storage*
  space (see schema decision below). Convert `p → w` on read, add in ℝ, squash
  `w → p` on write/display. No destructive data migration in the critical path.
- M3 — **`min` survives as a named mode** (the distributive quantale / skeptical
  projection), not the default — *not* deleted, unlike `product`/`ds`.
- M4 — **Dempster–Shafer retires**: the `NegationMap` conflict-mass band and the
  Zadeh high-conflict normalisation are subsumed by signed evidence and removed
  only in the final, explicitly-gated phase.
- M5 — **Byte-parity discipline preserved**: the inline reducers in the route and
  the typed `eccAdapter` pipeline must stay parity-equal (or both update together
  with the parity suite) at every phase, behind `ECC_TYPED_PIPELINE`.

### Schema decision (resolved 2026-06-03) — store `[0,1]`, compose in log-odds

The one genuinely-open design question from the session hand-off
(`ArgumentSupport.strength`/`base` are `Float [0,1]`; log-odds is ℝ — store which?)
is resolved in favour of **keep `[0,1]` storage, convert at the reducer
boundary** (Option B), *not* migrating the persisted columns to ℝ. Rationale:

- **No destructive migration.** Existing
  [`ArgumentSupport`](../lib/models/schema.prisma) rows (`strength @default(0.6)`,
  `base Float?`, both `[0,1]`) stay valid as-written; the cutover touches *code*,
  not *data*. This is what keeps the track reversible and off the prod-DB critical
  path.
- **`[0,1]` is the human / UI / provenance scale.** Sliders, `clamp01`,
  `DEFAULT_ARGUMENT_CONFIDENCE`/`DEFAULT_PREMISE_BASE`
  ([`lib/config/confidence.ts`](../lib/config/confidence.ts)), and the import
  `provenanceJson` fingerprints all assume `[0,1]`; log-odds ℝ is not meaningfully
  displayable.
- **The algebra change is about *how you compose*, not *what you store*.** Atomic
  support strengths are *inputs*; composition (`composed=true` rows) is a
  **recomputable cache** (lazy-recompute,
  [`lib/evidential/lazy-recompute.ts`](../lib/evidential/lazy-recompute.ts)), so
  composed values can always be re-derived in log-odds on demand and squashed back
  to `[0,1]` for the cache — no need to persist unbounded magnitudes.
- **Precision guard.** Clamp `p` to `[ε, 1−ε]` (e.g. `ε = 1e−6`) before `logit` to
  keep `w` finite at the extremes; the squash `σ(w) = 1/(1+e^{−w})` is total.
- **Deferred, not foreclosed.** If a concrete need later arises to persist exact
  unbounded composed magnitude (e.g. audit of very-high-evidence chains), add a
  *nullable* `weight Float?` (log-odds) column then — an additive, non-breaking
  migration. Do **not** add it now; it is unjustified ahead of need.

### Phase plan (ordered; safest first)

| Phase | Scope | Reversible? | Gate |
|---|---|---|---|
| 0 | **This entry** — track opened, schema decision recorded, session promoted. | n/a (docs) | — |
| 1 | **DONE (2026-06-03).** Pure log-odds kernel [`lib/argumentation/logodds.ts`](../lib/argumentation/logodds.ts) (`weight`/`prob` inverse pair, `corroborate`, `corroborateProbs`, `combineSignedProbs`, `EPS`-clamp) + property tests [`tests/argumentation/logodds.test.ts`](../tests/argumentation/logodds.test.ts) (19/19 green: round-trip, identity at `p=0.5`, commutative-monoid corroboration, monotonicity, signed pro/con cancellation, no high-conflict pathology). No callers yet. | fully | — |
| 2 | **DONE (2026-06-03).** Added `"logodds"` to the `Mode` union at both reducer sites alongside the existing modes (no default change). Route ([`evidential/route.ts`](../app/api/deliberations/%5Bid%5D/evidential/route.ts)): `join` corroborates via `corroborateProbs` (compose stays product-style conjunction); `?mode=logodds` accepted. Typed adapter ([`eccAdapter.ts`](../lib/argumentation/eccAdapter.ts)): `monoidForMode` returns a weight-of-evidence monoid whose non-idempotent `join` adds log-odds — the pairwise fold in `confidence()` equals the route's n-ary corroboration (commutative+associative ⇒ parity). Parity suite [`tests/eccAdapter.test.ts`](../tests/eccAdapter.test.ts) extended (24/24 green; `0.6⊕0.6=0.6923` stacking, commutativity, premise/assumption product-compose). Note: cross-room `supportBand` import folding still gated to `min`/`product` only (deferred). | fully | parity 24/24 |
| 3 | **DONE (2026-06-03).** Flipped the *default* algebra to `logodds` behind a flag: [`evidential/route.ts`](../app/api/deliberations/%5Bid%5D/evidential/route.ts) reads `DEFAULT_CONFIDENCE_MODE` from `CONFIDENCE_DEFAULT_MODE=logodds` (else `product`); explicit `?mode=` (incl. `product`) is always honoured, so the change is no-mode-default only. Differential test [`tests/argumentation/logodds-differential.test.ts`](../tests/argumentation/logodds-differential.test.ts) (6/6 green) pins the product↔logodds delta: singleton parity; `p=0.5` is the log-odds identity but noisy-OR still raises to 0.75; below-neutral evidence *lowers* support under log-odds (0.3⊕0.3<0.3) vs the noisy-OR pathology that raises it to 0.51; log-odds is more conservative above neutral (0.6⊕0.6=0.6923 vs noisy-OR 0.84) and does not saturate toward 1 on weak agreement; symmetry about 0.5. | flag-revertible (env only) | diff 6/6 |
| 2 | Wire a new `"logodds"` value into the `Mode` union in **both** reducer sites — the inline `compose`/`join` in [`app/api/deliberations/[id]/evidential/route.ts`](../app/api/deliberations/%5Bid%5D/evidential/route.ts) and `composeScalar` in [`lib/argumentation/eccAdapter.ts`](../lib/argumentation/eccAdapter.ts) — **alongside** existing modes; extend `tests/eccAdapter.test.ts` parity to the new mode. No default change. | fully (additive) | Phase 1 green |
| 3 | Flip the **default** confidence mode to `"logodds"` behind a flag/config; `product` marked deprecated (kept, warns). Differential-test new-vs-old outputs on a fixture corpus to characterise the behaviour delta before anyone relies on it. | flag-revertible | Phase 2 green |
| 4 | **DONE (2026-06-03).** Retired Dempster–Shafer from the evidential pipeline. Removed the `ds` mode + `dsSupport`/bel-pl conflict band from [`evidential/route.ts`](../app/api/deliberations/%5Bid%5D/evidential/route.ts), [`arguments/full/route.ts`](../app/api/deliberations/%5Bid%5D/arguments/full/route.ts), and [`eccAdapter.ts`](../lib/argumentation/eccAdapter.ts) (`Mode` union, `monoidForMode` ds case, `negationMap`-driven `noisyOr`/conflict block, `EvidentialPayload.dsSupport`, `EvidentialInputs.negationMap`, `NegationEdge`). All `prisma.negationMap` reads removed (**code-only deprecation — table left in DB, no `prisma db push`; fully reversible**, per decision). The agora confidence picker swaps the **DS (Bel/Pl)** option for **corroboration (log-odds)** ([`ConfidenceControls.tsx`](../components/agora/ConfidenceControls.tsx), [`useConfidence.tsx`](../components/agora/useConfidence.tsx) migrates persisted `ds`→`product`); `logodds` wired through [`arguments/full`](../app/api/deliberations/%5Bid%5D/arguments/full/route.ts) + [`evidential/score`](../app/api/evidential/score/route.ts) + client types. **Signed-evidence collapse: DS→scalar now; `combineSignedProbs`/rebut-edge con wiring deferred** (decision). Library primitives `DS_MONOID`/`withDsScores`/`DSValue` kept in [`ecc.ts`](../lib/argumentation/ecc.ts) (lawful monoids, still tested). Deleted obsolete Playwright `ds-mode-toggle.test.ts`; removed the eccAdapter DS-parity test. Suites green: 133/133 (logodds, differential, eccAdapter, ecc). **Wider DS footprint left for a follow-up** (out of this phase's captured scope): `evidential/score` dormant `dsCombine`, `eccLoader`/`v3 ecc/confidence`, `kb/transclude`, `sheets/ruleset`, `isonomiaOpenapi` docs, `weightedBAF`. | **partly destructive — code-only NegationMap deprecation, table retained (reversible)** | Phase 3 validated in practice; suites 133/133 |
| 5a | **DONE (2026-06-03).** Retired the wider DS footprint Phase 4 left out of scope. Dead code removed: `dsCombine()` + both `mode==="ds"` branches + `"ds"` from the `Mode` union in [`evidential/score/route.ts`](../app/api/evidential/score/route.ts) (persisted/inbound `ds` now coerced to `prod`); `"ds"` dropped from `reduceImportedScores`/`combineLocalAndImported` in [`transportAggregator.ts`](../lib/argumentation/transportAggregator.ts). Dormant-reachable removed: `"ds"` from `Mode` + the `dsScoresByDeriv` map + `withDsScores`/`DSValue` imports + the `if (mode==="ds")` branch in [`eccLoader.ts`](../lib/argumentation/eccLoader.ts) (`evaluateConfidence` now returns `number | null`); `"ds"` dropped from `ALLOWED_MODES` in [`v3/.../ecc/confidence/route.ts`](../app/api/v3/deliberations/%5Bid%5D/ecc/confidence/route.ts) with inbound `ds`→`product` coercion. Zod enums narrowed (+`logodds`): [`kb/transclude/route.ts`](../app/api/kb/transclude/route.ts) (also removed dead `dsSupport` reads — Phase 4 dropped that field) and [`sheets/[id]/ruleset/route.ts`](../app/api/sheets/%5Bid%5D/ruleset/route.ts). UI pickers feeding `kb/transclude` swapped `ds`→`logodds`: [`app/kb/[id]/page.tsx`](../app/kb/%5Bid%5D/page.tsx), [`app/kb/spaces/[spaceId]/page.tsx`](../app/kb/spaces/%5BspaceId%5D/page.tsx), [`lib/kb/types.ts`](../lib/kb/types.ts). Docs de-DS'd: [`isonomiaOpenapi.ts`](../lib/api/isonomiaOpenapi.ts) (ecc_confidence + ecc_evidential enums/descriptions) and the [`.well-known/argument-graph`](../app/.well-known/argument-graph/route.ts) manifest. **DECISION (2026-06-03, user): OK to drop `ds` from the public MCP/Isonomia API** (recorded for traceability; inbound `ds` is coerced, not hard-rejected, for one deprecation cycle). `DS_MONOID`/`withDsScores`/`DSValue` + `tests/ecc.test.ts` kept (lawful primitives). Suites green: 146/146 (transportAggregator, ecc, eccAdapter, logodds, logodds-differential). **Still bearing a DS UI option (separate subsystems, NOT touched — report-only):** `app/test/plexus-features/page.tsx` (dev sandbox), `components/deepdive/v3/debate-sheet/DebateSheetHeader.tsx`+`ArgumentNetworkCard.tsx` ("UI only" DS toggle), display-type unions in `components/evidence/SupportBar.tsx` + `components/confidence/ConfidenceBreakdown.tsx`. | mostly non-breaking (dead/dormant); public-API enum narrowed w/ coercion | Phase 4 shipped; suites 146/146 |
| 5b | **Delete `product` and collapse `Mode` to `logodds`+`min`.** **DECISION (2026-06-03, user): delete `product` outright (not merely demote).** Order: (1) **DONE (2026-06-03)** — flipped the no-flag default to `logodds` at every `product` fallback site: [`evidential/route.ts`](../app/api/deliberations/%5Bid%5D/evidential/route.ts) `DEFAULT_CONFIDENCE_MODE` now `product` only when `CONFIDENCE_DEFAULT_MODE=product` else `logodds` (revert hatch kept for the bake); [`arguments/full/route.ts`](../app/api/deliberations/%5Bid%5D/arguments/full/route.ts) `confidenceMode = mode ?? "logodds"`; [`evidential/score/route.ts`](../app/api/evidential/score/route.ts) no-mode default → `logodds`; `.default('logodds')` in [`kb/transclude`](../app/api/kb/transclude/route.ts); UI initial state → `logodds` in [`useConfidence.tsx`](../components/agora/useConfidence.tsx) + both [kb](../app/kb/%5Bid%5D/page.tsx) [pages](../app/kb/spaces/%5BspaceId%5D/page.tsx). **NOTE: cross-room `supportBand` import folding is still gated to `min`/`product` (deferred), so the `logodds` default does not fold imported support yet — local confidence is fully log-odds.** v3 ecc routes (`eccLoader` typed pipeline) keep `product` default — they have no `logodds` mode (separate surface). Suites 146/146. **NOW BAKING — real-world testing before steps 2–3.** Then: (2) delete the `product`/noisy-OR branch from every `join()` + `Mode` union, collapsing to `min`+`logodds`; (3) coerce inbound/persisted `product`→`logodds` at the read boundary (same pattern as the `ds`→`product` migration). Update architecture doc §2.2 + §11.3 correction notes to the shipped state. | **destructive — gated, explicit go-ahead** | Phase 5a shipped + default-flip baked |
| 5b-followups | **DONE (2026-06-03).** Closed the two watch-items the default-flip left open. **(1) Cross-room imports now fold under `logodds`.** [`transportAggregator.ts`](../lib/argumentation/transportAggregator.ts) `reduceImportedScores`/`combineLocalAndImported` widened to `"min" | "product" | "logodds"`; the `logodds` branch corroborates via `corroborateProbs` (imported support stacks as signed weight of evidence). The empty-list→`0` sentinel is kept for **all** modes (0.5 is the log-odds identity, but `0` must stay the "no imports" flag so the `imported === 0` short-circuit still fires). `logodds` is the **signed-evidence exception**: the monotone `≥ local` band invariant is deliberately dropped — below-neutral (`< 0.5`) imports *lower* the total. Gate lifted at [`evidential/route.ts`](../app/api/deliberations/%5Bid%5D/evidential/route.ts) (both typed + legacy branches) and [`arguments/full/route.ts`](../app/api/deliberations/%5Bid%5D/arguments/full/route.ts). **(2) Log-odds monoid wired into the MCP/v3 surface.** New `LOGODDS_MONOID` + `withLogoddsScores` factory in [`ecc.ts`](../lib/argumentation/ecc.ts) (`key "logodds"`, `top 1`, `combine = ×`, `join = corroborateProbs`, `base() = 0.5`), registered in the closed registry (now 4 built-ins); `join` is associative+commutative so the pairwise fold in `confidence()` equals the route's n-ary `corroborateProbs`. [`eccLoader.ts`](../lib/argumentation/eccLoader.ts) `Mode` → `min|product|logodds`, `evaluateConfidence` branches to the log-odds monoid. v3 [`ecc/confidence`](../app/api/v3/deliberations/%5Bid%5D/ecc/confidence/route.ts) + [`ecc/aggregate`](../app/api/v3/deliberations/%5Bid%5D/ecc/aggregate/route.ts) routes: `logodds` added to the allow-list, **default flipped to `logodds`**, inbound `ds`→`logodds` coercion. [`isonomiaOpenapi.ts`](../lib/api/isonomiaOpenapi.ts) confidence + aggregate enums re-add `logodds` (default `logodds`). Suites **150/150** (4 new `logodds` tests across `transportAggregator` + `ecc`). Not touched: the v3 `ecc/evidential` route (separate surface, still `min|product`+`ds` allow-list). `DS_MONOID`/`withDsScores` kept. | fully (additive) | 150/150 green |

**Implementation order:** 0 → 1 → 2 → 3 → (4 ∥ doc cleanup) → 5. Phases 1–2 are
additive and carry no data risk; phase 3 is flag-revertible; phases 4–5 are
destructive and require explicit confirmation (model retirement, mode deletion).

### Spec index

| # | Spec | Layer / Surface | Research items operationalised |
|---|------|-----------------|--------------------------------|
| CA | *(this track)* — no separate architecture doc yet; the [session](10_IDEATION_SESSIONS/01-confidence-algebra-semiring-vs-quantale-2026-06-02.md) + this entry are the spec. | confidence reducers (route + typed pipeline), `ArgumentSupport` scoring, DS retirement | session 01 (resolved); brainstorm §3; CATEGORICAL_FOUNDATIONS §2.2 correction |

### Research-side back-references

- [session 01 — confidence algebra](10_IDEATION_SESSIONS/01-confidence-algebra-semiring-vs-quantale-2026-06-02.md)
  — Resolved (documentation-level); operationalised by this track's phases 1–5.
  The session's "open items / hand-off" promotion request is satisfied by Phase 0.
- [`09_FUTURE_DIRECTIONS_BRAINSTORM.md`](09_FUTURE_DIRECTIONS_BRAINSTORM.md) §3 —
  decisions block; the semiring-vs-quantale fork is closed in favour of the
  log-odds semiring, with the Lawvere-enrichment prize parked (it needs the
  idempotent quantale join = `min`; log-odds is non-idempotent).

### Track-internal open items

- **Lawvere-enrichment prize (parked).** The enrichment conjecture needs an
  idempotent complete-lattice join (the `min` quantale); the log-odds default is
  non-idempotent, so choosing stacking corroboration declines the structure the
  enrichment would enrich over. If pursued, it attaches to the surviving `min`
  mode (M3), not the default. To be promoted to [`03_CONJECTURES/`](03_CONJECTURES)
  if/when taken up — out of scope for this migration.
- **Composed-cache magnitude (deferred).** Whether to ever persist exact log-odds
  magnitude (nullable `weight Float?`) is left open per the schema decision; revisit
  only on a concrete audit need.

---

## Foundational program — research-direction sequencing (post-T005)

> Cross-track planning entry, not a code track. Records the sequencing decision
> taken on 2026-06-03 over the six directions of
> [`09_FUTURE_DIRECTIONS_BRAINSTORM.md`](09_FUTURE_DIRECTIONS_BRAINSTORM.md)
> once Direction 1's keystone landed
> ([T005](02_THEOREMS_AND_PROOFS/T005-grounded-ludics-keystone.md), established)
> and Direction 3's quantitative core shipped (log-odds adopted, DS retired —
> the Confidence algebra track above). Append-only: revise by adding a dated
> superseding sub-entry, do not edit in place.

### The decision (2026-06-03)

**Next focus: Direction 2 (separation as the locus-of-disagreement theorem), with
Direction 5 (mechanizing the Ludics core in Agda) as a parallel low-risk track.**

Full ordering:

> **2 (+5 in parallel) → 1 (remaining semantics) → 4 (after coherence) → 3's
> cut-elimination crown last.** Direction 6 (the philosophy bridge) stays a
> continuous honesty-check, not a scheduled phase.

### Rationale

- **Direction 3's load-bearing core is already shipped, so it no longer gates
  anything.** The quantitative claim the platform makes is now lawful: the
  log-odds (weight-of-evidence) semiring is adopted as the default confidence
  algebra and Dempster–Shafer is retired from the pipeline and public API
  (Confidence algebra track, Phases 1–5b, 150/150 green). What remains of
  Direction 3 — the graded substructural logic + cut-elimination "crown" — is
  the single highest-effort item in the whole program, and the **non-idempotent**
  log-odds choice *raised* its cost (it declines the idempotent quantale join the
  Lawvere-enrichment prize would have enriched over; see this track's parked
  open item). So 3's remainder is correctly scheduled **last**, not because it is
  unimportant but because it is the most expensive and now unblocks nothing.

- **Direction 2 is the most achievable load-bearing result still open.** It
  converts the platform's flagship "locate where you disagree" feature from a
  heuristic into a consequence of Girard's separation theorem (the Ludics
  analogue of Böhm's theorem). The required Ludics machinery already exists in
  the engine — interaction/orthogonality
  ([`packages/ludics-engine/stepper.ts`](../packages/ludics-engine/stepper.ts),
  [`checkOrthogonal.ts`](../packages/ludics-engine/checkOrthogonal.ts)) and the
  pure decision kernel
  ([`packages/ludics-engine/stepCore.ts`](../packages/ludics-engine/stepCore.ts)),
  which already locates the divergence address (`DIVERGENT` at a determinate
  `locusId`). It is self-contained, and it is a **prerequisite for Direction 1's
  realizability result** (the separating-context machinery is what a
  "minimal-commitment" reading of acceptance ultimately rests on).

- **The real theorem in Direction 2 is minimality, not uniqueness.** Uniqueness
  of the first-divergence address *within a single dispute* is the easy half.
  The load-bearing claim is **minimality across all opponent designs** — that the
  divergence locus is *the* minimal separating context (a minimal unshared
  commitment), not merely *a* separating one. That minimality argument is the
  paper. Per program discipline: if minimality resists, the precise obstruction
  is itself the result.

- **Direction 5 runs in parallel because it is low-risk and independently
  valuable.** A mechanized Ludics core (associativity of interaction, the
  separation theorem, internal completeness) in Agda is wanted by the
  proof-theory community and essentially does not exist in the literature; it is
  independent of the platform, and the discipline is already in hand (T002 and
  C004 are machine-checked). Crucially, **formalizing separation in Agda is both
  the Direction-5 deliverable and the strongest available check on Direction 2's
  minimality argument** — the two tracks corroborate each other.

- **1, 4, 6 in their slots.** Direction 1's remaining semantics (stable,
  preferred — [Q-039](01_OPEN_QUESTIONS_REGISTRY.md#q-039) /
  [C011](03_CONJECTURES/C011-additive-preferred-games-bridge.md)) follow Direction
  2 because they reuse its separating-context machinery. Direction 4 (sheaf /
  cohomology-of-disagreement) waits until cross-room coherence is settled — and
  **that coherence sub-program is now active** (sub-program A): the empirical 0b
  topology check is green, B2b showed the live obstruction is claim-map *monodromy*
  (= a coherence failure), and the coherence theorem is stated as
  [C014](03_CONJECTURES/C014-plexus-transport-pseudofunctor.md) /
  [Q-042](01_OPEN_QUESTIONS_REGISTRY.md#q-042) with discharges 1 (L1 strict-functor
  lemma) and 2 (L2 band origin-dedupe) landed and discharge 3 (the lax-functor
  pentagon) scoped in
  [`DEV_SPEC-c014-discharge3-plexus-coherence-pentagon-2026-06-07.md`](DEV_SPEC-c014-discharge3-plexus-coherence-pentagon-2026-06-07.md).
  The quantitative sheaf-cohomology bet (sub-program B) stays gated on that theorem.
  Direction
  6 is a continuous check, never a premise.

### Starting artifacts (Direction 2)

- Problem statement / scoping session:
  [`10_IDEATION_SESSIONS/03-separation-locus-of-disagreement-2026-06-03.md`](10_IDEATION_SESSIONS/03-separation-locus-of-disagreement-2026-06-03.md).
- Minimality conjecture:
  [`03_CONJECTURES/C012-separation-minimal-locus.md`](03_CONJECTURES/C012-separation-minimal-locus.md).
- Open-questions registry entry:
  [`Q-040`](01_OPEN_QUESTIONS_REGISTRY.md#q-040).

---

## Separation — minimal-disagreement operationalisation track

**Opened:** 2026-06-04, downstream of the Direction-2 separation result reaching a
proved-and-cross-checked state:
[T006](02_THEOREMS_AND_PROOFS/T006-first-divergence-locus-e0.md) (E0, established),
[T007](02_THEOREMS_AND_PROOFS/T007-minimal-separating-locus.md) (determinate
separating context + anchor-chain, established-narrowed after its cross-check
refuted the original leastness claim), and
[T008](02_THEOREMS_AND_PROOFS/T008-minimal-separating-context-daimon-closed.md)
(established, cross-checked — minimality **recovered abstractly** over complete
daimon-closed counter-designs; the kernel is faithful on proper tests, unfaithful
exactly on raw truncations). The R1-vs-R2 fork was ratified **lead R2** in
[session 04](10_IDEATION_SESSIONS/04-separating-context-predicate-decision-2026-06-04.md);
this track operationalises the *gate* T008 left: surface the provably-minimal locus
of disagreement on the contested-frontier surface **without** a kernel change, by
feeding `stepCore` only proper (frontier-complete) tests on the single-chronicle path.

**Architectural premises:**

- S1 — **No kernel change (R1 parked).** The extractor works by controlling *inputs*
  (proper tests), never by editing `stepCore`/`stepInteraction` or the orthogonality
  verdict (T008 §Faithfulness). T005's discharge test and the
  `stepInteraction == stepCore` witnesses cannot regress — the extractor only reads.
- S2 — **The prime invariant is enforced, not assumed.** Every test handed to
  `stepCore` is frontier-complete *by construction* and re-checked by a mandatory
  guard; "minimal" is claimed only on a single realized chronicle. Violating either
  re-opens the exact defect T007's cross-check found.
- S3 — **Honesty-gated surface, fail-closed.** The minimal-locus label fires only when
  `basis === "minimal-T008"` (single chronicle ∧ proper test); otherwise the surface
  degrades to "first point of divergence" (T006) or the existing
  `loadBearingnessRanking` heuristic — never an overclaim, never a thrown route.
- S4 — **Branching is the measured boundary, not a silent gap.** The linearity gate
  (`isSingleChronicle`) that refuses to claim minimality off the linear path is also
  the **empirical meter** for how load-bearing Q-041 O2 is — the input the session-04
  fork wanted before committing Direction-5/R1 effort.

### Spec index

| # | Spec | Layer / Surface | Research items operationalised |
|---|------|-----------------|--------------------------------|
| MD | [`DEV_SPEC-minimal-disagreement-extractor-2026-06-04.md`](DEV_SPEC-minimal-disagreement-extractor-2026-06-04.md) | pure extractor (`packages/ludics-engine/`) + additive `ContestedFrontier` field + `FrontierLane` copy gate | T008 (faithful region); T006 (`divergenceLocus`); Q-040 (operational sourcing); Q-041 (O2 boundary, measured) |

**Implementation order & status:** (1) **DONE (2026-06-04)** — pure module
[`packages/ludics-engine/properTest.ts`](../packages/ludics-engine/properTest.ts):
`buildProperTest` (Refuse/Concede_j, frontier-complete by construction),
`isFrontierComplete`/`assertFrontierComplete` (the mandatory pre-`stepCore` guard),
`isSingleChronicle` (O2 gate), `extractMinimalDisagreementLocus` (honesty-tagged,
fail-closed — `minimal-T008` only when single-chronicle ∧ frontier-complete ∧
`DIVERGENT`). (2) **DONE (2026-06-04)** — tests
[`tests/bridge/minimal-disagreement-extractor.test.ts`](../tests/bridge/minimal-disagreement-extractor.test.ts)
(12/12): frozen length-5/3 witnesses, truncation contrast, prime-invariant safety
net, branching gate, oracle agreement vs the daimon-closed harness over `allAFs(n)`,
`n ≤ 3`. Full bridge suite **8 suites / 52 tests green** (was 7/40); T005 differential
+ truncation contrast unmodified; lint clean. (3) **DONE (2026-06-04)** — additive
`ContestedFrontier.minimalDisagreement?` field
([`lib/deliberation/frontier.ts`](../lib/deliberation/frontier.ts), existing fields /
route / consumers untouched) + `basis`-gated copy in
[`components/deliberation/FrontierLane.tsx`](../components/deliberation/FrontierLane.tsx)
("Minimal unshared commitment" **only** for `basis === "minimal-T008"`, else "First
point of divergence", `heuristic-fallback` → renders nothing). (4) **GATED** —
round-trip `⟦·⟧` locus↔edge test and the live graph→chronicle derivation that would
make `minimal-T008` fire on the real surface; `minimalDisagreement` is currently set
`null` (fail-closed) because building a *verified* single chronicle from the prisma
graph is O2-adjacent work (real deliberations branch). No phase is destructive; all
are additive and read-only against the kernel.

**Independently cross-checked (2026-06-04, non-author):** re-ran the bridge suite
(8/52 green), confirmed the honesty gate renders "minimal" only on `minimal-T008`, the
guard refuses partial designs, and the extractor fails closed. The verified pure
pipeline is sound; the only residue is the gated live-surface wiring (phase 4).

**Branching (C013) extension — DONE (2026-06-04).** The set-valued branching path
landed alongside the [C013](03_CONJECTURES/C013-branching-smyth-minimal-separating-context.md)
conjecture: `smythMinimalSeparatingContext`
([`packages/ludics-engine/properTest.ts`](../packages/ludics-engine/properTest.ts))
returns the `⊑`-antichain of per-line first-divergence loci (the Smyth-least separating
set) via `maximalLoci` / `commonStem`
([`packages/ludics-engine/separation.ts`](../packages/ludics-engine/separation.ts)),
with `MinimalDisagreement` gaining an additive `loci?: string[]` set and a new
**`per-line-divergence-C013`** basis. **Honesty boundary held:** that basis is *never*
`minimal-T008` — each element is a genuine first-divergence locus (T006/T008 per line,
established) but the *set's* Smyth-minimality rests on C013 (corroborated, **not
proved**), so [`FrontierLane.tsx`](../components/deliberation/FrontierLane.tsx) renders
"Points of divergence — one per open line" (with the per-line set listed), never
"proven minimal". Tests: extractor suite **15/15** (+3 branching); full bridge **10
suites / 65 green**; lint clean. The graph→chronicle live wiring stays gated (phase 4);
this specifies and verifies the branching *output object* the gated path will emit.

**Promotion — DONE (2026-06-05, [T009](02_THEOREMS_AND_PROOFS/T009-branching-smyth-minimal-separating-context.md) `established`, cross-checked).**
The C013 abstract proof landed and was independently signed off, so the branching basis is
promoted `per-line-divergence-C013` → **`smyth-minimal-T009`**: the *set* is now the *proven*
Smyth-minimal separating context. The honesty boundary is preserved — it is a minimal
**antichain** (a SET), **never** a single `⊑`-least locus (branching has none) and never
`minimal-T008` — and the computation still runs `stepCore` **per line**, never combined
([`FrontierLane.tsx`](../components/deliberation/FrontierLane.tsx) now renders "Minimal
disagreement set — one per open line", proven the Smyth-minimal separating context). The
parallel Agda mechanization (`mechanisation/agda/T009/`) remains the Direction-5 follow-up.

### Research-side back-references

- [T008](02_THEOREMS_AND_PROOFS/T008-minimal-separating-context-daimon-closed.md) —
  established; this track is its operational follow-through (feed proper tests; the
  spec §2 contract restates T008 §Faithfulness as the extractor's invariant).
- [Q-040](01_OPEN_QUESTIONS_REGISTRY.md#q-040) — open (minimality refuted-as-stated,
  recovered abstractly for proper tests); this track is the *operational sourcing*
  the registry entry defers to "a verified extractor (feed proper tests) or R1."
- [Q-041](01_OPEN_QUESTIONS_REGISTRY.md#q-041) — open; the branching-gate test (spec
  §5.4) is the empirical measurement of O2's prevalence that should drive whether
  O2/Direction-5/R1 is the right next investment.

### Track-internal open items

- **Graph→chronicle translation (gated — the live-surface unblock).** The extractor is
  built and tested, but `computeContestedFrontier` sets `minimalDisagreement = null`
  until a *verified* single chronicle can be derived from the prisma argument graph.
  That derivation is O2-adjacent (real deliberations are branching) and is the next
  concrete step to make `minimal-T008` fire on the live surface; it lands with phase 4.
- **`⟦·⟧` locus↔edge invertibility** (spec §8, phase 4). Mapping `ξ` (a kernel locus
  path) back to the argument-graph edge/premise relies on the translation assigning
  distinct subaddresses per advanced argument
  ([session 02b §1](10_IDEATION_SESSIONS/02b-translation-spec-af-to-designs-2026-06-02.md));
  it holds on the chronicle but must be pinned by a round-trip test, not assumed.
- **Branching prevalence (feeds Q-041 sequencing).** **Synthetic baseline DONE
  (2026-06-04):** [`tests/bridge/branching-prevalence.test.ts`](../tests/bridge/branching-prevalence.test.ts)
  classifies every `(AF, claim)` dispute over `allAFs(n)`, `n ≤ 3`, single-chronicle
  vs branching via the extractor's own `isSingleChronicle` gate. Result over
  **non-trivial** disputes: n=2 → 58.3% single / **41.7% branching**; n=3 → 28.1%
  single / **71.9% branching** (leaf-line counts run into the tens — up to 54
  incomparable lines). Branching dominates and grows fast with AF size; since this
  enumerable corpus is *optimistic* for the linear path (real deliberations are
  richer and branch more), the `minimal-T008` linear path is a **minority case** and
  **O2 ([Q-041](01_OPEN_QUESTIONS_REGISTRY.md#q-041)) is load-bearing for the product,
  not a deferrable edge.** The **live-deliberation telemetry** (reading the prisma
  argument graph to count single-vs-branching on real frontiers) is the gated
  follow-up — it reads shared data, so it is a separate, confirmed step. This baseline
  is the empirical input the [session-04](10_IDEATION_SESSIONS/04-separating-context-predicate-decision-2026-06-04.md)
  fork wanted: it argues for prioritising O2 over treating linear-only as sufficient.
- **R1 remains parked.** The faithfulness failure spec (T008 §Faithfulness) is the
  exact change R1 would implement; this track makes it *unnecessary for the linear
  surface*. Reviving R1 stays a separate, guarded decision
  ([session 04 §6](10_IDEATION_SESSIONS/04-separating-context-predicate-decision-2026-06-04.md#6-decisions-recorded)).

