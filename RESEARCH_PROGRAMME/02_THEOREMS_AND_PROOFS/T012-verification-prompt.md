# Verification prompt — fully cross-check T012 (Reading-C conservativity)

> **Role.** Independent second reader; you did **not** author T012. Either sign off
> as *established* or return numbered defects (location + minimal repair, blocking
> vs non-blocking). Default to skepticism. Re-derive the ⋀-algebra; re-run the
> differential; build the multi-opponent AFs by hand.
>
> **Target.** [`T012-reading-c-conservative.md`](T012-reading-c-conservative.md) —
> multi-agent Reading C convergence ⟺ conjunction of bilateral Reading-A pairs;
> nesting- and polarity-shift-invariant; conservative for all `|W| ≥ 1`.
>
> **Scope — what T012 is NOT.** Abstract-AF, one-shot (rests on T015 LB1); shift =
> branch-reorder, not full mid-proof re-typing; `k`-unbounded by ⋀-algebra, not
> mechanised. ASPIC+/structured `B` out of scope. Flag any over-read of `&`=∀ or
> any hidden assumption that bilateralisation is unique.
>
> **Programme rules.** Read [`README.md`](README.md). Theorem must be stated, one-
> sitting-checkable, non-author-checked, tied to its Q-entry. Tests = evidence.
> Record verdict in a `## Cross-check notes` section on T012.

## 0. Source materials
- [`T012-reading-c-conservative.md`](T012-reading-c-conservative.md); [`C002`](../03_CONJECTURES/C002-reading-c-conservative.md); [`T015`](T015-additive-realizability-keystone.md) (`&`=∀); [`T005`](T005-grounded-ludics-keystone.md); session 21 §5; [`reading-c-conservativity.test.ts`](../../tests/bridge/reading-c-conservativity.test.ts).

## 1. Re-run tests
`node --max-old-space-size=2048 ./node_modules/.bin/jest tests/bridge/reading-c-conservativity.test.ts` — 4 tests: 3-agent, polarity-shift, general `|W|`, all green; `maxW ≥ 4`.

## 2. Clause 1 (fidelity) — load-bearing
Confirm RC(ρ,W)=⋀ᵢ bilat from `&`=∀ (T015 Step A); flag if superposed-design verdict could differ from ∀ over branches.

## 3. Clauses 2/3 (nesting/shift) — confirm ⋀ commutative+associative ⇒ permutation/bracket invariance; shift = reorder. Flag if shift needs more than reorder.

## 4. Clause 4 (conservativity) — confirm `∃ρ∀W`=grounded, both directions, all `k`; no daimon present in RC absent from all bilaterals.

## 5. Verdict — append `## Cross-check notes`: **SIGNED OFF** (T012→established, Q-002/C002 abstract-AF settled, T012 closes Q-002) or **DEFECTS** (numbered). Call out: bilateralisation non-uniqueness; shift-as-reorder over-read; `&`=∀ over-read.
