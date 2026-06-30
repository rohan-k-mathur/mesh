# T012 — Reading-C conservativity, Agda mechanisation (k-unbounded)

Mechanisation of
[T012](../../../02_THEOREMS_AND_PROOFS/T012-reading-c-conservative.md)
(`established`, cross-checked 2026-06-28): for finite `F`, every
Reading-C deliberation `(ρ, W)` and every faithful bilateralisation, the
multi-agent convergence verdict coincides with the conjunction of
bilateral Reading-A pairs, is nesting- and shift-invariant, and acceptance
`∃ρ ∀W` coincides with the bilateral grounded verdict. Status:
**type-checks without postulates or holes** (`--safe --without-K`). This is
*evidence for* T012 under the Theorem Register policy — the parallel
mechanised check; T012 itself is already established by the human proof +
non-author cross-check.

It directly discharges the **"(c) k-unbounded mechanisation"** item carried
as non-blocking in the T012 cross-check: the corroborating tests
([`reading-c-conservativity.test.ts`](../../../../tests/bridge/reading-c-conservativity.test.ts))
exercise only `n ≤ 3`, `|W| ≤ 6`, whereas every clause here is proved by
induction over a witness list / nesting tree of **arbitrary length**, so it
holds for all `k = |W|`.

## What this proves

`W` is a list of CON tests `{τ₁,…,τ_k}`; `conv ρ τ` is the per-pair
bilateral verdict `⟨ρ∣τ⟩⇓†`. The Reading-C verdict is the
`&`-superposition orthogonality, which by **T015 Step A** (`&` = ∀) is the
conjunction over branches:

```
RC(ρ, W) = All (conv ρ) W       -- ∀ τ ∈ W. conv ρ τ
```

A **bilateralisation** is a binary nesting `Bilat` of pairwise interactions
(`leaf τ` = `⟨ρ∣τ⟩`, `node` = a nesting of two sub-deliberations);
`flatten` lists the witnesses it visits and `bverdict` is `conv` at leaves,
`_×_` at nodes. The four clauses (`module ReadingC`):

- **§2.1 `fidelity` (clause 1).** `bverdict ρ t ⇔ RC ρ (flatten t)` — the
  verdict of any bilateralisation equals the Reading-C verdict over its
  witnesses. Induction on the nesting tree; the load-bearing step is
  `All P (xs ++ ys) ⇔ All P xs × All P ys` (`all-++→` / `all-++←`).
- **§2.2 `nesting-invariant` (clause 2).** `flatten s ↭ flatten t →
  bverdict ρ s ⇔ bverdict ρ t` — any two bilateralisations whose witness
  lists are permutation-equal agree (bracketing- and order-independent).
  Pure re-bracketing of one order is the `refl` special case (`++`
  associativity makes the flattenings identical); reordering is the genuine
  permutation content, via `All-↭`.
- **§2.3 `shift-neutral` (clause 3).** `xs ↭ ys → RC ρ xs ⇔ RC ρ ys` — a
  polarity shift reorders the active-witness schedule; modelled as a
  permutation, the verdict is invariant (each branch contributes
  independently to the conjunction).
- **§2.4 conservativity (clause 4), k-unbounded.** `Accept w = ∃ρ. RC ρ w`.
  `conservativity : AcceptBilat t ⇔ Accept (flatten t)` — acceptance read
  off **any** bilateralisation equals Reading-C acceptance, both
  directions, so no deliberation has a Reading-C daimon absent from every
  bilateralisation, or vice versa. `Accept-↭` is order-invariance under the
  `∃`; `Accept-drop` shows the **same** `ρ` accepts each sub-deliberation —
  multi-party acceptance reduces to the bilateral parts with no emergent
  multi-agent witness.

The entire mathematical content lives in `module ListConj`: conjunction
over a list splits/joins across `++` and is invariant under permutation
(`All-↭`, by induction on the `↭` derivation). Everything else is a
corollary — which is exactly why the result is elementary and k-unbounded.

`module Model` (§3) instantiates on one PRO resolution (`⊤`), boolean tests
and `conv tt b = T b` (`T true = ⊤`, `T false = ⊥`), exhibiting both a
convergent (`ex-accept` / `ex-Accept`) and a divergent (`ex-diverge`)
deliberation, so the development is demonstrably non-vacuous.

## What is a parameter (the inherited obligations, not re-proved here)

In line with T012's honest scope and the T001/T002/C004 caveats:

- **`conv`** — the per-pair bilateral verdict `⟨ρ∣τ⟩⇓†`. Its settlement is
  **T005** (the grounded base case), held abstract; T012's content is the
  aggregation over `conv`, not the per-pair interaction.
- **`RC = All (conv ρ)`** — that the `&`-superposition reads off as `∀`
  over branches is **T015 Step A** (the one-shot LB), `established` and
  signed off, taken here as the bridge fact (human review).
- **Shift = schedule reorder** (clause 3), not a full mid-proof polarity
  re-typing — the abstract-AF / reorder limit flagged in T012 §Scope.
  ASPIC+/structured-`B` (handoff item 1) would re-do clauses 1–4 over a
  structured `bverdict`; the `⋀`-algebra mechanised here is the part that
  carries over unchanged.

## Build

Requires Agda 2.7.0.1+ and `agda-stdlib` v2.0 (pinned). Resolution is via
[`../mesh-substrate.agda-lib`](../mesh-substrate.agda-lib). From
`mechanisation/agda`:

```sh
agda T012/T012.agda
```

Expected output: clean, no errors, no warnings, no unsolved metas.

## Correspondence to the substrate / T012

| Toy (this file)                  | T012 object                                              |
|----------------------------------|----------------------------------------------------------|
| `Resolution` / `Test`            | PRO resolution `ρ` / CON test `τ`                        |
| `conv ρ τ`                       | the bilateral verdict `⟨ρ∣τ⟩⇓†` (T005 base case)         |
| `W = List Test`                  | the witness set `W = {τ₁,…,τ_k}`, `|W| = k`              |
| `RC ρ = All (conv ρ)`            | Reading-C verdict (`&`-superposition = ∀, T015 Step A)   |
| `Bilat` / `flatten` / `bverdict` | a faithful bilateralisation and its nested verdict       |
| `fidelity`                       | clause 1 (verdict fidelity)                              |
| `nesting-invariant`              | clause 2 (nesting / order invariance)                    |
| `shift-neutral`                  | clause 3 (polarity-shift neutrality)                     |
| `conservativity` / `Accept-*`    | clause 4 (conservativity, k-unbounded)                   |
| `ListConj.All-↭`                 | `⋀` permutation-invariance — the k-unbounded core        |
| `Model` (`conv = T`)             | non-vacuity witness (both verdicts)                      |
