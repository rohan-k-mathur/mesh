# 10 — Ideation Sessions & Conceptual Scaffolding

This folder is the **staging ground** for the directions named in
[`09_FUTURE_DIRECTIONS_BRAINSTORM.md`](../09_FUTURE_DIRECTIONS_BRAINSTORM.md).
It houses working sessions, scoping notes, and conceptual scaffolding for each
future direction *before* those ideas are mature enough to graduate into the
formal areas of the programme — the theorem files
([`02_THEOREMS_AND_PROOFS/`](../02_THEOREMS_AND_PROOFS)), the conjecture
registry ([`03_CONJECTURES/`](../03_CONJECTURES)), the open-questions registry
([`01_OPEN_QUESTIONS_REGISTRY.md`](../01_OPEN_QUESTIONS_REGISTRY.md)), or the
implementation tracks ([`IMPLEMENTATION_TRACKS.md`](../IMPLEMENTATION_TRACKS.md)).

## What belongs here

- **Session records** — the worked output of a focused thinking session on one
  fork or one direction (decisions, counterexamples, trade-offs, conclusions).
- **Conceptual scaffolding** — half-formed framings, candidate formalisms, and
  "what would each choice entail" analyses that aren't yet load-bearing.
- **Pre-integration drafts** — material destined for another part of the
  programme but not yet rigorous or stable enough to live there.

## What does NOT belong here

- Settled theorems with proofs → `02_THEOREMS_AND_PROOFS/`.
- Stated conjectures under active tracking → `03_CONJECTURES/`.
- Scheduled implementation work → `IMPLEMENTATION_TRACKS.md`.

When a session's output stabilises, **promote it** to the appropriate formal
area and leave a one-line pointer here noting where it went.

## Conventions

- One file per session: `NN-short-slug-YYYY-MM-DD.md`.
- Map each file back to its direction in the brainstorm (the six-direction
  spine: 1 foundational bridge, 2 separation, 3 quantitative core,
  4 distributed semantics, 5 mechanization, 6 philosophy bridge).
- Record decisions as **conjecture / resolved / parked**, mirroring the
  brainstorm's discipline of never promoting a conjecture to a premise.

## Index

| File | Direction | Status |
|------|-----------|--------|
| [`01-confidence-algebra-semiring-vs-quantale-2026-06-02.md`](01-confidence-algebra-semiring-vs-quantale-2026-06-02.md) | 3 — Quantitative core | Resolved (documentation); migration pending |
| [`02-foundational-bridge-dung-ludics-2026-06-02.md`](02-foundational-bridge-dung-ludics-2026-06-02.md) | 1 — Foundational bridge | Phase 0 done; Phase 1 closure re-founded + translation spec |
| [`02b-translation-spec-af-to-designs-2026-06-02.md`](02b-translation-spec-af-to-designs-2026-06-02.md) | 1 — Foundational bridge | Phase 1 translation spec (abstract AF → designs) |
| [`03-separation-locus-of-disagreement-2026-06-03.md`](03-separation-locus-of-disagreement-2026-06-03.md) | 2 — Separation | Problem statement; promoted to [C012](../03_CONJECTURES/C012-separation-minimal-locus.md) / [Q-040](../01_OPEN_QUESTIONS_REGISTRY.md#q-040) |
| [`04-separating-context-predicate-decision-2026-06-04.md`](04-separating-context-predicate-decision-2026-06-04.md) | 2 — Separation (→ 5 Mechanization) | **Resolved — lead R2** (abstract redefinition; R1 parked); feeds [Q-041](../01_OPEN_QUESTIONS_REGISTRY.md#q-041) |
| [`05-branching-normalization-o2-2026-06-04.md`](05-branching-normalization-o2-2026-06-04.md) | 2 — Separation (→ 5 Mechanization) | Scoping **OPEN** — O2 branching attack (tests as concession-trees; antichain order); feeds [Q-041](../01_OPEN_QUESTIONS_REGISTRY.md#q-041) |
| [`06-c013-abstract-proof-scoping-2026-06-05.md`](06-c013-abstract-proof-scoping-2026-06-05.md) | 2 — Separation (→ 5 Mechanization) | Scoping **OPEN** — [C013](../03_CONJECTURES/C013-branching-smyth-minimal-separating-context.md) abstract-proof scope/dev-spec (O-parity-b is the crux; paper-first then Agda; attack plan A→B→C); feeds [Q-041](../01_OPEN_QUESTIONS_REGISTRY.md#q-041) |
| [`07-distributed-semantics-sheaf-cohomology-2026-06-07.md`](07-distributed-semantics-sheaf-cohomology-2026-06-07.md) | 4 — Distributed semantics | Planning **OPEN**; **0b GREEN + B2b + A0–A2 + C014 discharges 1–2 + discharge-3 D1–D4 done** — coherence theorem [C014](../03_CONJECTURES/C014-plexus-transport-pseudofunctor.md)/[Q-042](../01_OPEN_QUESTIONS_REGISTRY.md#q-042); symbolic C014-T + live-faithfulness boundary complete ([D1](../C014-D1-plexus-bicategory-data-2026-06-08.md)–[D4](../C014-D4-faithfulness-boundary-2026-06-08.md)), 𝓟° = iso-closure, faithful region = existing strict materialization path; **H2 done** (probe refined to ECC inter-derivability, `drift` witness); **D5 done — promoted → [T010](../02_THEOREMS_AND_PROOFS/T010-plexus-coherence-pseudofunctor.md)** (**established** — cross-checked 2026-06-08); sub-program A coherence complete, production PRs gated on follow-through |
| [`08-distributed-semantics-quantitative-cohomology-2026-06-08.md`](08-distributed-semantics-quantitative-cohomology-2026-06-08.md) | 4 — Distributed semantics (sub-program B) | Planning **OPEN**; **symbolic spine COMPLETE 2026-06-08** (B-exp → B-poss-0 → B-poss-1 → rank argument → paper proof → **[T011](../02_THEOREMS_AND_PROOFS/T011-possibilistic-cohomology-iso-monodromy.md) established**) — `contextuality`/`cech` probe passes; **lead = possibilistic / Abramsky** route (= T010's monodromy obstruction cohomologically); Čech $H^1=1$ synthetic + realistic Condorcet-cycle / $0$ live via **holonomy-group rank** ($\log_2|G|$, exact for e.a.2); C015 cross-checked (D1 returned → repaired → re-check signed off) → **T011** closes [Q-043](../01_OPEN_QUESTIONS_REGISTRY.md#q-043) (i)+(ii); remaining = organic live witness (iii) + B-abelian (parked, per-edge-weight meaning decision) |
| [`09-mechanization-ludics-core-sequencing-2026-06-08.md`](09-mechanization-ludics-core-sequencing-2026-06-08.md) | 5 — Mechanization | Planning **OPEN**; **M0→M4 + M3-bridge done 2026-06-09** (only **M5** HoTT PoC + parked obligations remain) — sequences §5 from the **corroboration reflex** to the **constitutive Ludics core**. **M0** carrier. **M1** `interact` defined ([`Core`](../mechanisation/agda/ludics/Core.agda)). **M2** determinacy + fuel-monotonicity ⇒ orthogonality fuel-independent ([`Interaction`](../mechanisation/agda/ludics/Interaction.agda)); associativity *proper* parked (needs composition/cut). **M3** behavioural **separation** ([`Separation`](../mechanisation/agda/ludics/Separation.agda)). **M3-bridge** `interactL` + first-divergence locus on the T008/T009 `List ℕ` object ([`Locus`](../mechanisation/agda/ludics/Locus.agda)). **M4** behaviours + **internal completeness** `pol⁺(clo S)≡pol⁺ S` ([`Completeness`](../mechanisation/agda/ludics/Completeness.agda)). **Composition/cut track (M2-assoc)** ([`Composition`](../mechanisation/agda/ludics/Composition.agda)): relocation functorial, disjoint merge a strictly-associative monoid, cut + **(A) up-to-associator** (`cut-assoc`/`cut-assoc⁻¹`) + **pentagon**; **structural coherence complete**. **Round 2** ([`CutElim`](../mechanisation/agda/ludics/CutElim.agda)): `footprint-disjoint` + `normCut` + `normCut-commute` + `interact`-computed `normRun` + `normRun-commute` — obligation (B) CLOSED. **M5** ([`hott/Scheme.agda`](../mechanisation/agda/hott/Scheme.agda)): cubical, segregated — Expert-Opinion scheme as dependent type, CQs as eliminators, `behaviour-extensional = ua` / `behaviour-univalence = univalence` (the slogan cashed). **The M0→M5 sequence is COMPLETE** — both §5 flagships realized (constitutive finite Ludics core + HoTT scheme treatment). Post-sequence refinements (M1′ infinitary, Dir-2 fusion 1a/1b, Böhm-proper, cut-survivor trace) under [Q-046](../01_OPEN_QUESTIONS_REGISTRY.md) |
| [`10-scheme-rivalry-fourth-attack-2026-06-12.md`](10-scheme-rivalry-fourth-attack-2026-06-12.md) | Argumentation-scheme cluster (inner ring) | **NOT STARTED** — landing file only; header + read-first links + attack-plan spine pre-wired. Works [C009](../03_CONJECTURES/C009-scheme-rivalry-fourth-attack.md) / [Q-016](../01_OPEN_QUESTIONS_REGISTRY.md#q-016): is **scheme-rivalry** (disjoint behaviours `⟦S₁⟧ ∩ ⟦S₂⟧ = ∅`, no Pollock primitive applies) a genuine fourth attack category? Positive → `T-NNN` + `attackType` enum-widening; negative → trichotomy adequate, close Q-016 |
| [`11-lumer-practical-arguments-2026-06-12.md`](11-lumer-practical-arguments-2026-06-12.md) | Argumentation-scheme cluster (inner→core ring) | **WORKED 2026-06-12.** Diagnosis (alethic core / practical outputs / thin Walton schemes) accepted as a **standing observation**, not a premise. Spec sorted **foundational** (native `practical/*` representation + separate desirability register + completeness-as-assumption + profile-relativity) / **downstream** (divergence-locus typing, transport typing, probe, packet schema, evaluative culprit sets) / **parked** (Pascal subfamily, partition-invariance, welfare-ethical, MAXIMIN/HURWICZ, the fourth-layer *theorem*, the synthesis). Filed [Q-047](../01_OPEN_QUESTIONS_REGISTRY.md#q-047) (adoption umbrella), [Q-048](../01_OPEN_QUESTIONS_REGISTRY.md#q-048) (fourth-layer) + [C016](../03_CONJECTURES/C016-epistemological-principle-fourth-layer.md), [Q-049](../01_OPEN_QUESTIONS_REGISTRY.md#q-049) (T005 strategy-preservation under typed test space + completeness concession locus — candidate follow-on). Resolved the C009 tension and handed the **Burkholder/Pascal** candidate witness to [session 10](10-scheme-rivalry-fourth-attack-2026-06-12.md). CQ-generation migration recorded as **contingent**, not committed. No schema touched. **Superseded for engineering by [11b](11b-practical-reasoning-enhancements-2026-06-12.md).** |
| [`11b-practical-reasoning-enhancements-2026-06-12.md`](11b-practical-reasoning-enhancements-2026-06-12.md) | Argumentation-scheme cluster (inner ring) | **DECISION + BRAINSTORM 2026-06-12.** Engineering follow-on to session 11. **Programme declines to import the Lumer framework** (no `DesirabilityProfile` / `PracticalNetting` / Pascal subfamily / desirability monoid / per-instance CQ migration / fourth-layer build) and **strengthens the existing Walton machinery instead** — 8 ranked low-baggage moves: (1) reconcile PR to Walton's canonical 5 CQs [pure data]; (2) typed CQ→scheme cross-references (`refScheme`) — a finite-DAG handle on [Q-017](../01_OPEN_QUESTIONS_REGISTRY.md#q-017); (3) goal/value premise as a first-class contestable slot; (4) open-by-default raise-by-instantiation CQs; (5) factual/evaluative/structural read-model over `targetScope`; (6) alternatives as linked rival claims; (7) CQ-driven WHY wiring; (8) `value_based_pr` cluster hygiene. **This file is the build reference; the `docs/Lumer …` source docs are not a build spec.** [Q-047](../01_OPEN_QUESTIONS_REGISTRY.md#q-047) stays open-but-off-build-path. First move: item 1 (CQ-set reconciliation in [`scripts/schemes.seed.ts`](../../scripts/schemes.seed.ts)). |
| [`12-additive-frontier-preferred-stable-multiagent-2026-06-14.md`](12-additive-frontier-preferred-stable-multiagent-2026-06-14.md) | 1 — Foundational bridge (additive generalisations) | Scoping **OPEN** — names the **additive frontier** cluster: the `&`/`⊕` machinery shared by the *semantics* axis ([Q-039](../01_OPEN_QUESTIONS_REGISTRY.md#q-039) / [C011](../03_CONJECTURES/C011-additive-preferred-games-bridge.md), preferred/stable branching) and the *participant* axis ([Q-002](../01_OPEN_QUESTIONS_REGISTRY.md#q-002) / [C002](../03_CONJECTURES/C002-reading-c-conservative.md), multi-agent Reading C). Build shared `⟦·⟧₊` first → stable → preferred (maximality obstruction, realizability fallback) → Q-002. No proof; grades + build order + `T004→T012` collision fix |
| [`13-attack-ratification-layer-2026-06-14.md`](13-attack-ratification-layer-2026-06-14.md) | Deliberation-integrity cluster (attack admissibility / governance) — engineering | **DECISIONS RESOLVED 2026-06-14 — ready for dev spec.** Generalise AI-ratification to **human attacks**: a `ConflictApplication` is created immediately but only counts as a **defeat** once it clears a per-deliberation ratification policy; enforcement = one `ratificationStatus` filter at the already-built [`buildDeliberationGraph`](../../lib/aspic/deliberationEvaluation.ts) (+ `/api/aspic/evaluate`). **All 11 decisions settled:** asymmetric gating + *provisional* standing label (D2); parallel to the CQ-DISPUTED/CEG path, convergence later (D5); explicit `attackRatificationPolicy` on `DeliberationPref` seeded by `hostType` (`free`→`none`/else→`single`), uniform gating, mutable+grandfathered (D1/D3/D7/D9); any authenticated non-author, AI-excluded, **not sybil-resistant** in v1 (D4); provisional label + notification pipeline (D6); accept ratification debt (D11); `PROPOSED⇄EFFECTIVE`→`WITHDRAWN`, `REJECTED` deferred (D8); subsumes the raw-[`/api/ca`](../../app/api/ca/route.ts) gap (D10). **§3 semantics:** preserves grounded fixed point; in-bias; defeasible-periphery scoping. **Parked deps:** deliberation-creation UX (privacy typology + `moderator` governance), two-grounded-engine convergence. No schema touched yet |

## Beyond the six-direction spine

The [`12_RESEARCHER_COLLABORATION_PROSPECTUS.md`](../12_RESEARCHER_COLLABORATION_PROSPECTUS.md)
(seeded 2026-06-08) ranks these directions for a hypothetical dedicated
pure/applied-mathematics + logic collaborator and opens **two directions the
spine under-weights**, each filed as an open question rather than a session here
(no scoping session has run yet):

| Direction | Question | Status |
|-----------|----------|--------|
| 7 — Complexity of the primitives | [Q-044](../01_OPEN_QUESTIONS_REGISTRY.md#q-044) — cost/tractable-fragments/fast-paths of orthogonality testing, separation, closure, $H^1$-rank | **open** — unowned; the most implementation-relevant gap |
| 8 — Information geometry of confidence | [Q-045](../01_OPEN_QUESTIONS_REGISTRY.md#q-045) — Fisher–Rao geometry of the log-odds confidence space; aggregation as geodesic/Bregman | **open** — rides the resolved Session-01 log-odds fork |

When either gets a scoping session, add it to the index above with its `NN-…`
file and promote the prospectus pointer accordingly.
