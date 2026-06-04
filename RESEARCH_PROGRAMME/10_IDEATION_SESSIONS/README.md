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
