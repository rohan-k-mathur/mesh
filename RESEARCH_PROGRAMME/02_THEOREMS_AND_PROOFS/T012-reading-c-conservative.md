# T012 — Reading-C conservativity: multi-agent convergence verdicts coincide with bilateral Reading A, nesting- and shift-invariant

- **status:** established (2026-06-28; cross-checked, signed off — no blocking defects; abstract-AF fragment, rests on T015 one-shot `&`=∀, shift = branch-reorder). Participant axis of the additive frontier.
- **closes:** Q-002 / [C002](../03_CONJECTURES/C002-reading-c-conservative.md) on the abstract-AF fragment (the general fidelity theorem; promotes the three-agent + polarity-shift base cases)
- **depends-on:** [T005](T005-grounded-ludics-keystone.md) (grounded base case); [T015](T015-additive-realizability-keystone.md) (the `&` = ∀ shared additive layer); C001/T002 (the bridge objects)
- **proved-by:** drafted 2026-06-28
- **cross-checked-by:** independent second reader, 2026-06-28 (signed off; no blocking defects)
- **last-reviewed:** 2026-06-28
- **source-of-proof:** this file
- **corroborating-computation:**
  [`../../tests/bridge/reading-c-conservativity.test.ts`](../../tests/bridge/reading-c-conservativity.test.ts)
  (three-agent, polarity-shift, and general `|W|` ≤ 6 nesting/permutation invariance,
  every AF on `n ≤ 3`). Evidence only.
- **build-instructions:** `node --max-old-space-size=2048 ./node_modules/.bin/jest tests/bridge/reading-c-conservativity.test.ts`

> Methodology. The participant-axis companion of T015: the *semantics* axis lifted
> grounded→stable/preferred via `⊕`/`&`; this lifts bilateral Reading A → multi-
> agent Reading C via the **same** `&`=∀ primitive. Test-then-prove: base cases
> corroborated (session 21 §5), this entry is the human-checked general argument.

## Vocabulary

A **Reading C deliberation** `(D_P, W, B)`: a Proponent design `D_P`, a witness set
`W = {w₁,…,w_k}` (`|W| = k ≥ 1`), Opponent borne by `σ(D_P)^⊥`. A **bilateralisation**
`bilat(D_P, W, B)` is a nesting of pairwise Reading-A interactions `⟨D_P ∣ w_i⟩`.
The **verdict** is the daimon's existence (and locus). On the dispute substrate `D_P`
is a Proponent resolution `ρ`, `W` a set of CON tests `{τ₁,…,τ_k}`, and `⟨ρ ∣ τ⟩⇓†`
is `interact(ρ,τ)=CONVERGENT`. Reading C: `ρ` orthogonal to the `&`-superposition
`τ₁ & ⋯ & τ_k`; by T015's Step-A finding `&` = ∀, so RC(ρ,W) = `∀i. ⟨ρ∣τ_i⟩⇓†`.

## Theorem

For finite `F`, every Reading-C deliberation, and every faithful bilateralisation:

1. **(Verdict fidelity)** RC(ρ, W) = `⋀ᵢ bilat(ρ, w_i)` — convergence under Reading C
   ⟺ convergence in each bilateral pair.
2. **(Nesting invariance)** the bilateralisation verdict is independent of bracketing
   and order: any nesting of `{w₁,…,w_k}` gives the same `⋀ᵢ`.
3. **(Polarity-shift neutrality)** changing the active witness mid-interaction does
   not change the verdict.
4. **(Conservativity)** for any `k ≥ 1` (incl. `k ≥ 3`), acceptance `∃ρ ∀W` coincides
   with the bilateral grounded verdict; no deliberation has a Reading-C daimon absent
   from every bilateralisation, or vice versa.

## Proof

**(1).** `&` is the kernel's exclusive superposition; orthogonality to `τ₁&⋯&τ_k`
holds iff each branch converges (T015 LB; Step A). So RC(ρ,W) = ⋀ᵢ⟨ρ∣τ_i⟩⇓† = ⋀ᵢ
bilat(ρ,wᵢ). □

**(2).** ⋀ is commutative and associative, so `⋀ᵢ` is invariant under every
permutation/bracketing of `W` — any nesting yields the same boolean. □

**(3).** A shift swaps the active branch; per (1) each branch contributes
independently to the conjunction, so reordering active witnesses leaves ⋀ fixed. □

**(4).** Acceptance = `∃ρ ⋀ᵢ⟨ρ∣τ_i⟩` = `∃ρ ∀τ` = grounded (T005), independent of `k`.
A daimon under RC ⟹ all bilaterals converge; absent in some bilateral ⟹ no RC
daimon. Equivalence in both directions. □

## Scope

Abstract AF, `n ≤ 3` exhaustive, `|W| ≤ 6` exercised; clauses elementary (⋀
algebra), so `k`-unbounded. **Honest limit:** rests on T015's one-shot LB; the shift
is modelled as branch-reordering (the verdict-relevant content), not a full mid-
proof polarity re-typing. ASPIC+ witnesses + structured `B` are future work.

## Cross-check

Done — see `## Cross-check notes`. Open items carried as non-blocking: (a) `&`=∀
vs. a genuine superposed single design; (b) shift as reorder vs. re-typing; (c)
k-unbounded mechanisation.

## Cross-check notes

**SIGNED OFF** — independent second reader, 2026-06-28. §§1–4 of the verification
prompt discharged; T012 → `established` (abstract-AF, rests on T015 one-shot
`&`=∀, shift = branch-reorder; pending mechanisation). Q-002 / C002 abstract-AF
fragment settled; T012 closes Q-002.

**§1 Corroboration.** Re-ran `jest tests/bridge/reading-c-conservativity.test.ts`
(max-old-space 2048): 4 tests, **0 skips**, all green — 3-agent superposed verdict
= conjunction of pairs (nesting-invariant), polarity-shift verdict-neutral,
general `|W|` order-invariant and `⟺` grounded. `maxW ≥ 4` assertion holds, so
`|W| ≥ 4` is genuinely exercised; non-vacuity (both convergent and divergent
triples) asserted in-test.

**§2 Clause 1 (fidelity), load-bearing.** RC(ρ,W)=⋀ᵢ bilat reduces to T015 Step A
(`&`=∀): orthogonality to `τ₁&⋯&τ_k` holds iff every branch converges. T015 is
`established`/signed-off, so the reduction is sound. No over-read: superposed-
design verdict = ∀ over branches is exactly T015's exclusive-superposition
finding, not a fresh assumption; T012 inherits T015's one-shot LB as its limit.

**§3 Clauses 2/3.** ⋀ commutative+associative ⇒ permutation/bracket invariance —
trivially true; nesting choice cannot change a boolean conjunction. Shift = active-
branch reorder; each branch contributes independently, so ⋀ fixed. Confirmed by
the polarity-shift test. Over-read avoided: shift-as-reorder vs. full mid-proof
re-typing flagged in §Scope as the honest limit, not silently assumed unique.

**§4 Clause 4 (conservativity).** `∃ρ∀W` = grounded (T005), both directions, all
`k`: confirmed by hand and by the acceptance test (RC-accept = `acceptableBy`
`Interaction` on every ≥3-attacker AF, `n≤3`). No RC daimon absent from all
bilaterals, none present in a bilateral but absent from RC. Bilateralisation
non-uniqueness is NOT assumed — every faithful nesting yields the same ⋀, so
uniqueness is derived, not required.

Non-blocking: tests evidence over `n≤3` (`|W|≤6`); clauses pen-proof for
k-unbounded; ASPIC+/structured-`B` and full re-typing shift remain future work.
