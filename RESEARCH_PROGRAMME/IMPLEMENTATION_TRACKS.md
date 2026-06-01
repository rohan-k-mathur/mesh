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
