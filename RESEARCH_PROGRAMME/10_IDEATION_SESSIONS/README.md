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
| [`07-distributed-semantics-sheaf-cohomology-2026-06-07.md`](07-distributed-semantics-sheaf-cohomology-2026-06-07.md) | 4 — Distributed semantics | Planning **OPEN**; **0b GREEN + B2b + A0 + A1 + A2 done** — coherence theorem stated as [C014](../03_CONJECTURES/C014-plexus-transport-pseudofunctor.md)/[Q-042](../01_OPEN_QUESTIONS_REGISTRY.md#q-042); monodromy = non-invertible 2-cell holonomy; next = discharge C014 (path-provenance band property test) |
