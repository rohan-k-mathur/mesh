# C003 — The walked / witnessable / latent exposure map monotonically refines Prakken-2024 expansion strength

- **status:** open
- **ring:** inner
- **depends-on:** —
- **linked-open-questions:** Q-003
- **last-reviewed:** 2026-05-27

## Statement

Let `E(F)` be the family of all expansions of an abstract argumentation
framework `F` (Prakken 2024). Let `μ_P : E(F) → ℕ` be Prakken's dialectical
strength counting function. Define a map

`κ : E(F) → {walked, witnessable, latent}`

assigning each expansion-element its substrate-participant-access stratum
(via the witness-record set of the live deliberation). Then there exists a
strength function `μ_S : E(F) → ℕ³` (ordered lexicographically) such that:

1. *Refinement.* For all expansions `e, e′ ∈ E(F)`, if `μ_S(e) ≤ μ_S(e′)`
   then `μ_P(e) ≤ μ_P(e′)`.
2. *Strict refinement on at least one pair.* There exist `e, e′` with
   `μ_P(e) = μ_P(e′)` but `μ_S(e) < μ_S(e′)`.
3. *Monotonicity under expansion extension.* If `e ⊑ e′` (Prakken's
   expansion-extension order), then `μ_S(e) ≤ μ_S(e′)` componentwise on the
   walked-witnessable-latent decomposition.

## Positive settlement

A proof of clauses 1–3 plus a worked deliberation in which a Prakken-tie
is broken by the stratification. The worked example must be encodable in
the existing argument-graph schema (no new tables).

## Negative settlement

Either:
- A pair `e, e′` where the monotonicity clause fails (this would refute the
  monotonicity of κ under expansion-extension), or
- A proof that no `μ_S` satisfying clause 1 can satisfy clause 2 (i.e. the
  stratification adds no discriminating power over `μ_P`).

## Bibliography

- Prakken 2024, *An abstract and structured account of dialectical argument
  strength*, *Artificial Intelligence* 335:104193.
- Van Woerkom, Grossi, Prakken & Verheij 2024, JAIR.
- [`../../Development and Ideation Documents/ARCHITECTURE/Ludics Generative Substrate Documents/LITERATURE_REVIEW_ROUND_2.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LITERATURE_REVIEW_ROUND_2.md) §2.4 (R-C8)
- [`../../Development and Ideation Documents/ARCHITECTURE/Ludics Generative Substrate Documents/LITERATURE_REVIEW_ROUND_1.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LITERATURE_REVIEW_ROUND_1.md) §2 (C4)
