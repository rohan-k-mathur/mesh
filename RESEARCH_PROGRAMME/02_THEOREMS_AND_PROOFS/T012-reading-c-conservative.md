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
- **corroborating-mechanisation:**
  [`../mechanisation/agda/T012/T012.agda`](../mechanisation/agda/T012/T012.agda)
  (Agda 2.7.0.1, stdlib v2.0, `--safe --without-K`, no postulates/holes) mechanises
  all four clauses **k-unbounded** — `fidelity`, `nesting-invariant`, `shift-neutral`,
  `conservativity`/`Accept-↭`/`Accept-drop` — by induction over a witness list /
  nesting tree of arbitrary length, discharging the cross-check's non-blocking item
  (c). `conv` (per-pair verdict, T005) and `RC = All (conv ρ)` (the `&`=∀ bridge,
  T015 Step A) are parameters; the `⋀`-aggregation is the proved content. Evidence
  only (see [README](../mechanisation/agda/T012/README.md)).
- **build-instructions:** `node --max-old-space-size=2048 ./node_modules/.bin/jest tests/bridge/reading-c-conservativity.test.ts`; mechanisation: `agda T012/T012.agda` (from `RESEARCH_PROGRAMME/mechanisation/agda`)

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

**Update 2026-06-29 — first structured increment (handoff item 1).**
[`../mechanisation/agda/T012Struct/T012Struct.agda`](../mechanisation/agda/T012Struct/T012Struct.agda)
(`--safe --without-K`, no postulates/holes) lifts the ⋀-aggregation past abstract
AF **verbatim** — structured witnesses carry an ASPIC+ attack type
(rebut/undercut/undermine) + read-polarity, and clauses 1/2/4 reuse the SAME
`ReadingC` module — and replaces the branch-reorder shift with a genuine **mid-proof
re-typing**: `retype-neutral` proves clause 3 under an arbitrary per-witness
polarity-flip schedule (strictly stronger than the permutation shift), `retype-then`
composes it with reordering. It rides on the substrate cut-symmetry `conv-pol-sym`,
shown **non-vacuous** (`conv-pol-sym-fails`: a polarity-sensitive undercut verdict
breaks it) — so full re-typing is free for the symmetric/rebut fragment and
load-bearing for the asymmetric attacks. This does **not** close the lift: the
structured argument is modelled by attack-type + polarity only (no premise/rule/
conclusion trees), and `conv-pol-sym` is asserted, not derived from a kernel ⟦·⟧₊
model. See [README](../mechanisation/agda/T012Struct/README.md).

**Update 2026-06-29 — second structured increment (argument trees).**
[`../mechanisation/agda/T012Aspic/T012Aspic.agda`](../mechanisation/agda/T012Aspic/T012Aspic.agda)
models genuine ASPIC+ argument **trees** (premises with KB-kind / strict+defeasible
rules / conclusions over a contrariness relation) and **derives** the three attack
types from structure (faithful to lib/aspic/attacks.ts): `Undermines` (fallible
premise), `Rebuts` (defeasible conclusion), `Undercuts` (defeasible rule-name).
Proves the ASPIC+ restrictions as structural theorems — `firm-not-underminable`
(axioms protected), `strict-not-rebuttable`/`strict-not-undercuttable` (restricted
rebut) — and the re-typing **symmetry classification** grounding `conv-pol-sym`:
`rebut-sym` (rebut is the structural fixed point under symmetric contrariness) vs.
a `Witness` where undermine's role-flip reorients to a rebut (type not preserved).
`typeOf` derives T012Struct's `AType` from a structural attack. `--safe
--without-K`, no postulates/holes. Still open: wiring `typeOf` into T012Struct's
`convS` end-to-end, and deriving `conv-pol-sym` from a kernel ⟦·⟧₊ model.

**Update 2026-06-29 — item 1 self-contained portion CLOSED (end-to-end).**
[`../mechanisation/agda/T012End2End/T012End2End.agda`](../mechanisation/agda/T012End2End/T012End2End.agda)
wires the two increments into one pipeline: `swOf` turns any structural ASPIC+
attack into a T012Struct witness whose `atype` is the **derived** `typeOf`, and the
Reading-C development (verdict `rc`, full re-typing `rc-retyped`, with `fidelity`/
`nesting`/`conservativity` equally available) runs on a behaviour of genuine
undermine/rebut/undercut attacks — `derived-undermine`/`-rebut`/`-undercut` confirm
the types are computed from structure, not stipulated. `--safe --without-K`, no
postulates/holes. **The one remaining (blocked) piece** of the ASPIC+ lift: deriving
`conv-pol-sym` from a kernel ⟦·⟧₊ model, which needs Ludics substrate polarity
re-typing that does not yet exist (`Action.polarity` is static).

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

**Update 2026-06-29 — (c) k-unbounded mechanisation discharged.** The four
clauses are now mechanised in Agda for arbitrary `k = |W|`
([`../mechanisation/agda/T012/T012.agda`](../mechanisation/agda/T012/T012.agda),
`--safe --without-K`, no postulates/holes): `fidelity` (clause 1),
`nesting-invariant` (clause 2), `shift-neutral` (clause 3), and
`conservativity` + `Accept-↭` + `Accept-drop` (clause 4), each by induction
on a witness list / nesting tree of unbounded length. The `&`=∀ reading
(`RC = All (conv ρ)`, T015 Step A) and the per-pair `conv` (T005) remain
parameters — the human-review obligations — so this is evidence, not a
re-settlement; but cross-check item (c) is retired. Items (a) `&`=∀ vs a
genuine superposed single design and (b) shift-as-reorder vs re-typing
stand (the latter rides on the ASPIC+/structured-`B` lift, handoff item 1).
