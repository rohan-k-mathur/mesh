# C003 — The walked / witnessable / latent exposure map monotonically refines Prakken-2024 expansion strength

- **status:** partially-resolved (2026-06-24, cross-check signed off) — positive for a **sharpened** strength function `μ_S*`; the **literal** lexicographic encoding `μ_S♭ = (w, x, ℓ)` of the §Statement is **refuted** for the faithful *count* reading of `μ_P`. See [T013](../02_THEOREMS_AND_PROOFS/T013-exposure-map-stratified-strength.md) and §Resolution below.
- **ring:** inner
- **depends-on:** —
- **linked-open-questions:** Q-003
- **last-reviewed:** 2026-06-24

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

## Resolution (2026-06-24, cross-check signed off — [T013](../02_THEOREMS_AND_PROOFS/T013-exposure-map-stratified-strength.md))

**Positive for a sharpened `μ_S`; the literal encoding is refuted.** Two coupled findings:

1. **Refutation of the literal `μ_S♭ = (w, x, ℓ)`.** Read lexicographically, no
   stratum vector `(w, x, ℓ)` can satisfy clause 1 against the *count* reading
   `μ_P(e) = |SA(e)|` (the multiplicity-sensitive, faithful reading of Prakken's
   *"number of ways"*). This is the **Impossibility Lemma**: a lexicographic order
   on `ℕ^k` (`k ≥ 2`) never refines the `L¹`-sum order — witness `(0,0,2) <_lex
   (1,0,0)` but `2 > 1`. The substrate realizes both profiles (two latent
   successful attackers vs. one walked), so clause 1 genuinely fails for `μ_S♭`.
   (`μ_S♭` *does* satisfy clause 1 for the degenerate **indicator** reading
   `μ_P ∈ {0,1}`, which discards the very multiplicity the stratification is meant
   to refine.)
2. **Positive for the Prakken-subordinate `μ_S*`.** Set
   `μ_S*(e) = (μ_P(e), w(e), x(e))` — Prakken's count leads, then walked, then
   witnessable (`ℓ` recovered as `μ_P − w − x`, so the full walked-witnessable-
   latent decomposition is carried). Then **clause 1** holds (leading coordinate is
   `μ_P`), **clause 2** holds (a walked-vs-latent tie at equal `μ_P`:
   `(1,0,0) <_lex (1,1,0)`), and **clause 3** holds on the **accrual fragment**
   `E↑(F) = {e ⊑ e′ : SA(e) ⊆ SA(e′)}` (on the full lattice `μ_P` is non-monotone
   by reinstatement, so clause 3 is properly scoped there). Clause 3 rides on
   **LB1** (the exposure stratum `κ(b)` is computed against the *fixed* live
   deliberation state, making it intrinsic to the move).

The conjecture's *intent* (the participant-access stratification monotonically
refines Prakken) is **vindicated**, as an **orthogonal tie-breaker subordinate to
Prakken's count**; its *literal strength function* is **corrected**. The worked
tie-break is encodable in `ArgumentEdge` + `DialogueMove` + `WitnessRecord` with
no new tables (T013 §5). This also discharges the `κ ∘ proj_des` stratum map that
[Q-004](../01_OPEN_QUESTIONS_REGISTRY.md#q-004)'s drainage corollary quantifies
over (T013 §7). **The [T013 cross-check](../02_THEOREMS_AND_PROOFS/T013-verification-prompt.md) signed off 2026-06-24 (all of §§1–6 re-derived; no defects), so this resolution is no longer provisional.**

## Bibliography

- Prakken 2024, *An abstract and structured account of dialectical argument
  strength*, *Artificial Intelligence* 335:104193.
- Van Woerkom, Grossi, Prakken & Verheij 2024, JAIR.
- [`../../Development and Ideation Documents/ARCHITECTURE/Ludics Generative Substrate Documents/LITERATURE_REVIEW_ROUND_2.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LITERATURE_REVIEW_ROUND_2.md) §2.4 (R-C8)
- [`../../Development and Ideation Documents/ARCHITECTURE/Ludics Generative Substrate Documents/LITERATURE_REVIEW_ROUND_1.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LITERATURE_REVIEW_ROUND_1.md) §2 (C4)
