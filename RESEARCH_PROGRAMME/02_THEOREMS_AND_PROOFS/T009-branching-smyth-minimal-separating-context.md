# T009 — Over daimon-closed concession-trees, the Smyth-minimal separating context of a branching dispute is the antichain of per-line first-divergence loci (the branching companion of T008)

- **status:** **established** (cross-checked 2026-06-05). Drafted 2026-06-05 (Direction 2 / Q-041 **O2**; ≡ the Direction-5 mechanized-separation deliverable). This is the **abstract proof** of [C013](../03_CONJECTURES/C013-branching-smyth-minimal-separating-context.md), executing the attack plan staged in [session 06](../10_IDEATION_SESSIONS/06-c013-abstract-proof-scoping-2026-06-05.md) (single line → two incomparable lines → general tree). It establishes, over complete daimon-closed concession-**trees**, that the Smyth-least separating set exists, is unique, and equals the per-line first-divergence antichain `M(D, E)`. **Signed off** by an independent non-author second reader against the kernel and the harnesses (the T008 pattern); the parallel Agda mechanization remains a Direction-5 follow-up. Per the sign-off, the operational extractor's basis **has been promoted** `per-line-divergence-C013` → **`smyth-minimal-T009`** — kept strictly as a **Smyth-minimal antichain** claim (never a `⊑`-least locus; branching has none), still run `stepCore` per line; see [`## Cross-check notes`](#cross-check-notes) for the two folded-in clarifications.
- **closes:** — on cross-check, discharges [Q-041](../01_OPEN_QUESTIONS_REGISTRY.md#q-041) **O2 (branching)** for the multiplicative additive-free fragment under the **Smyth** order (the branching companion of T008's O1). Does **not** change the kernel verdict (R1-tree stays parked) nor touch additive/preferred-stable ([Q-039](../01_OPEN_QUESTIONS_REGISTRY.md#q-039)).
- **depends-on:** [T008](T008-minimal-separating-context-daimon-closed.md) (the linear base case — invoked verbatim per line; Lemma 0 parity, the proper-test family, the faithfulness boundary); [T006](T006-first-divergence-locus-e0.md) (E0, per-line first-divergence locus); [T007](T007-minimal-separating-locus.md) (the off-thread obstruction this proof routes around — its §Defect 1 witness is the failure spec of O-faithful); [T005](T005-grounded-ludics-keystone.md) (the translation `⟦·⟧`, the multiplicative additive-free fragment with **distinct subaddresses per argument**, canonical orthogonality)
- **proved-by:** drafted 2026-06-05 (GitHub Copilot; paper-first per [session 06 §2](../10_IDEATION_SESSIONS/06-c013-abstract-proof-scoping-2026-06-05.md))
- **cross-checked-by:** GitHub Copilot (independent second reader; did not author T009) — verdict: **sign-off / established**. Re-derived O-parity-b against `findNextNegativeAtLocus` (match-by-equal-address) and `buildDisputeDesign` (distinct child subaddresses); ran the bridge suite (11/70 green) and an independent adversarial probe (978 branching designs, incl. a 3-way root branch and an asymmetric depth-4/depth-1 tree: **0 cross-line collisions, M an antichain throughout**). Two **non-blocking** clarifications recorded. See [`## Cross-check notes`](#cross-check-notes).
- **cross-check-date:** 2026-06-05
- **last-reviewed:** 2026-06-05
- **source-of-proof:** this file (definitions, statement, proof, faithfulness lemma); checklist in [`T009-verification-prompt.md`](T009-verification-prompt.md)
- **corroborating-computation:**
  [`../../tests/bridge/branching-normalization.test.ts`](../../tests/bridge/branching-normalization.test.ts)
  (the abstract tree-normalizer: per-line `stepCore` + pure Smyth/Hoare aggregation over
  `allAFs(n)`, `n ≤ 3` — 1344 disputes / 663 branching at n=3; Smyth-least = `M` always,
  Hoare-least fails exactly on branching) and
  [`../../tests/bridge/c013-factorization-scope.test.ts`](../../tests/bridge/c013-factorization-scope.test.ts)
  (the factorization probe: per-line runs recover `M`; the combined run mis-diverges
  off-thread at `0.1.1` with matched `["0","0.2"]` — the frozen O-faithful failure witness;
  plus an asymmetric two-line spot check). Evidence only — see §Corroborating computation.
- **corroborating-mechanisation:**
  [`../mechanisation/agda/T009/T009.agda`](../mechanisation/agda/T009/T009.agda)
  (+ [`README`](../mechanisation/agda/T009/README.md)) — the two load-bearing lemmas
  mechanised in Agda on a concrete locus model (`Locus = List ℕ`, segment-wise prefix
  `⊑`): **O-parity-b** (`branch-incomp` / `no-cross-line-match` — distinct children below a
  branch node give `⊑`-incomparable, hence unequal, hence never-matching loci) and
  **O-smyth** (`SmythLeast-is-M` — for any `⊑`-antichain `M`, the subset-refusal family has
  unique Smyth-least `= M`), with a non-vacuity model on the harness fixture
  `["0.1.2","0.2.2"]`. Type-checks `--safe --without-K`, no postulates/holes. Evidence only
  (Direction 5) — see §Mechanization path.
- **build-instructions:** `node --max-old-space-size=2048 ./node_modules/.bin/jest tests/bridge/`
  (TS harnesses); `agda T009/T009.agda` from `RESEARCH_PROGRAMME/mechanisation/agda` (Agda 2.7.0.1, stdlib v2.0)

> Methodology note. Test-then-prove, as for T005–T008. The branching harness
> *corroborated* Smyth-least = `M` over `allAFs(n)`, `n ≤ 3`, and *decided the order*
> (Smyth over Hoare/Egli–Milner) empirically; this file is the human-checked abstract
> argument. The proof is **decoupled from `stepCore`** — the kernel mis-diverges
> off-thread on a combined tree ([C012 §Route (b)](../03_CONJECTURES/C012-separation-minimal-locus.md),
> [T007 §Defect 1](T007-minimal-separating-locus.md)) — and related to it only by the
> faithfulness lemma (O-faithful), whose *failure on combined trees is expected*, exactly
> as T008 §Faithfulness's failure on raw truncations was.

## Vocabulary

Carry the T005 setting: a finite abstract AF `F = (A, ⇝)`, the translation `⟦·⟧` into
the **multiplicative, additive-free** fragment with **distinct subaddresses per
argument**, and **canonical** orthogonality (`stepInteraction`/`stepCore` reaching `†`,
`CONVERGENT`). Drop T008's *linear* restriction: `D = ⟦a⟧⁺` is a genuine **branching**
Proponent dispute design — one child locus per attacker, recursively
([`buildDisputeDesign`](../../lib/bridge/dispute.ts): a `P`-positive at even depth carries
a **ramification** with one child per attacker) — so several `⊑`-incomparable dispute
lines are open at once.

- **Locus / `⊑`.** A locus is a dot-path (`"0"`, `"0.1"`, `"0.1.2"`, …); `⊑` is the
  segment-wise prefix order (root `"0"` least),
  [`separation.isPrefixLocus`](../../packages/ludics-engine/separation.ts). `a, b` are
  **comparable** iff one is a prefix of the other; an **antichain** is a set of pairwise
  incomparable loci; `maximalLoci`/`commonStem` are the `⊑`-deepest set and the longest
  common prefix.
- **Line.** A *line* `ℓ` is a maximal `⊑`-chain of loci in `D` (one realized dispute
  chronicle — the T008 object). `D` is the union of its lines; the lines pairwise share a
  **stem** `commonStem` and then diverge into `⊑`-incomparable child loci.
- **Branch node.** A locus `β` in `D` at which two or more lines diverge: the lines
  through `β` continue into distinct children `β.i`, `β.j` (`i ≠ j`), and — by T005's
  **distinct subaddresses per argument** — `β.i` and `β.j` are `⊑`-incomparable, as are
  all loci below them on different lines.
- **Per-line first-divergence locus (E0/T006).** For an opponent `E` with `D ⊥̸ E`, each
  refused line `ℓ` has a first-divergence locus `ξ_ℓ(E)` — its **deepest grant**, a
  `⊑`-maximal Proponent-positive (even-depth) locus on `ℓ`. Write
  `M(D, E) = { ξ_ℓ(E) : ℓ a refused line }`. Each `ξ_ℓ` is `⊑`-maximal on its line, so
  **`M(D, E)` is a `⊑`-antichain** ([separation.maximalLoci](../../packages/ludics-engine/separation.ts)).
- **Per-line projection `↾ℓ`.** For a design or test `X`, `X↾ℓ` is the restriction of `X`
  to acts at loci `⊑`-comparable to `ℓ`'s leaf — i.e. the stem plus line `ℓ`. `D↾ℓ` is a
  single realized chronicle (the T008 object); `T↾ℓ` is its dual restriction.

### Definition 1 — complete daimon-closed concession-tree (branching proper test)

Generalizing [T008 Definition 1](T008-minimal-separating-context-daimon-closed.md): a
**proper test** of a branching `D` is a daimon-closed **sub-tree** `T` of the dual base —
at **every** one of its positive turns, across **all** lines `D` opens, `T` carries an act
(a proper attack **or** the daimon `†`). Equivalently, `T` is **frontier-complete on every
line**: each restriction `T↾ℓ` is a frontier-complete linear proper test in the T008 sense
([`properTest.isFrontierComplete`](../../packages/ludics-engine/properTest.ts) lifted to
the frontier *set*). `T` **refuses** on a non-empty set `U` of lines (withholds the grant
at each `ξ_ℓ`, `ℓ ∈ U`) and **concedes** (`†`) on the rest. Its **separating set** is
`{ ξ_ℓ(E) : ℓ ∈ U }`.

### Definition 2 — abstract tree-normalization `⟨D ∣ T⟩`

`⟨D ∣ T⟩` is, **primitively, the ordinary (global) Ludics normalization** of the cut-net
`D ⋆ T` — the single alternating cut-elimination that matches each positive act against the
dual at its **address**, exactly the object [T006](T006-first-divergence-locus-e0.md)–[T008](T008-minimal-separating-context-daimon-closed.md)
use, now ranging over a *tree* of loci rather than one chronicle. It returns `CONVERGENT`
iff the net closes (every reached positive turn ends in `†`) and otherwise `DIVERGENT` with a
**divergence set** of unmatched-positive loci. **No parallel / per-component structure is
assumed here** — this is plain global normalization. That `⟨D ∣ T⟩` then **factors** into the
multiset of independent per-line runs,
`⟨D ∣ T⟩ ≅ ⨆_ℓ ⟨D↾ℓ ∣ T↾ℓ⟩` (with `CONVERGENT` = the conjunction and the divergence set
= the union of per-line first-divergence loci), is **not the definition but a theorem** —
proved as **O-parity-c** from the non-interference lemma **O-parity-b** below. *Reading the
parallel form as primitive would make non-interference true by fiat and O-parity-b vacuous;
it is instead derived from match-by-equal-address.* (The faithful Ludics object is this
global normalization; the linear, least-index `stepCore` is a *different* object that, on a
combined tree, fails to realize it — O-faithful — which is why the faithful computation runs
`stepCore` **per line**, never combined.)

### Definition 3 — separating set, family, and the Smyth order

`SepProper(D, E)` is the set of separating sets `{ ξ_ℓ : ℓ ∈ U }` realized by proper tests
(Definition 1) with `D ⊥̸ E`, i.e. the **subset-refusal family**
`{ refuse U : ∅ ≠ U ⊆ refusedLines }`. The **Smyth (upper powerdomain) order** on locus
sets: `S ≤_S T :⟺ ∀ t ∈ T ∃ s ∈ S. s ⊑ t` ([`branching-normalization.test.ts`](../../tests/bridge/branching-normalization.test.ts)
`smythLeq`). ("Refuse on more lines, at shallower points" = smaller.)

## Statement

**Theorem (T009 ≡ C013).** Fix a branching `D` in the multiplicative additive-free T005
fragment and an opponent `E` with `D ⊥̸ E`. Over complete daimon-closed concession-trees
(Definitions 1–3), the **Smyth-least separating set exists, is unique, and equals the full
per-line antichain `M(D, E)`**:
$$\mathrm{SepProper}(D, E)\ \text{has a}\ \le_S\text{-least element}\ =\ M(D, E).$$
Equivalently: the minimal separating context of a branching dispute is the antichain of
per-line first-divergence loci — "you disagree at *all* of these per-line points, and at no
shallower set."

The reduction to T008 is the base case: when `D` is a single line, `M(D, E) = { ξ(E) }` and
the Smyth-least set is the singleton — T009 specializes to [T008(3)](T008-minimal-separating-context-daimon-closed.md).

## Proof

Staged as the [session-06 attack plan](../10_IDEATION_SESSIONS/06-c013-abstract-proof-scoping-2026-06-05.md):
**Stage A** (single line = T008), **Stage B** (two `⊑`-incomparable lines — the crux),
**Stage C** (general tree by induction). The obligations O-tree, O-parity-(a/b/c),
O-perline, O-smyth are proved as lemmas, then assembled; O-faithful is the bridge to the
kernel (its failure is the spec, not a defect).

### Lemma O-tree (the proper test is well-defined)

*Claim.* A daimon-closed sub-tree `T` of Definition 1 is a legitimate Ludics
counter-design of `D`, and `⟨D ∣ T⟩` (Definition 2) is well-defined.

*Proof.* `T` places `†` only on its own positive turns (Definition 1), so it is
daimon-closed (closed under the net-closure rule). On the shared stem the lines coincide,
so `T` carries a single act per stem locus — unambiguous. At a branch node `β`, the
children `β.i` are at **distinct subaddresses** (T005), so the per-child acts of `T` sit at
distinct, `⊑`-incomparable loci; the completeness predicate of Definition 1 is the
**conjunction** of the per-line predicates `T↾ℓ` frontier-complete, each the T008
condition, and these conjoin without interaction because their loci are disjoint. Hence `T`
is a well-formed counter-design and `T↾ℓ` is a T008 proper test for every line `ℓ`.
Well-definedness of `⟨D ∣ T⟩` is deferred to O-parity-b (which licenses the parallel
recursion of Definition 2). ∎

### Lemma O-parity-a (parity per line)

*Claim.* Along each line `ℓ`, the alternation parity of `⟨D↾ℓ ∣ T↾ℓ⟩` is the line's local
depth parity: `D` plays the positive at even depth, the test at odd depth (and `ξ_ℓ` is at
even depth).

*Proof.* `D↾ℓ` and `T↾ℓ` are exactly the T008 linear objects on the chronicle `ℓ`, so
[T008 Lemma 0](T008-minimal-separating-context-daimon-closed.md) applies verbatim: the
normalization alternates, starting on `D`'s side, flipping once per matched pair; after
`t+1` matched pairs the test is to move iff `t` is even. The stem is a common prefix of
every line, so the parity at the branch node is shared by all lines through it, and each
line continues its local parity below the branch. `ξ_ℓ` is a `D`-positive locus, hence even
depth (T006/T007 Lemma B). ∎

### Lemma O-parity-b — locus-disjoint non-interference (THE CRUX)

*Claim.* In `⟨D ∣ T⟩`, no act on line `ℓ_i` ever matches an act on a distinct line `ℓ_j`
(`i ≠ j`). Equivalently: the matched-pair relation is **block-diagonal** over the lines —
the shared stem matched once, then each line's pairs matched within that line and nowhere
across.

*Proof.* Ludics normalization matches a **positive** act at a locus `ξ` only against a
**negative** (dual) act at the **same** locus `ξ` — matching is by *equal address* (this is
the locus-matched rule `findNextNegativeAtLocus` realizes, and the definitional cut-matching
of *Locus Solum*; it is the same rule T006–T008 use). Now take two distinct lines `ℓ_i`,
`ℓ_j` and let `β = commonStem(ℓ_i, ℓ_j)` be their branch node.

1. **On the stem (`⊑ β`)** the two lines coincide — same loci, same acts — so any matched
   pair there belongs to *both* lines' restrictions identically; it is matched exactly once
   and is not a cross-line match (it is a stem match).
2. **Below the branch (`⊐ β`)** the lines enter distinct children `β.i ≠ β.j`. By T005's
   **distinct subaddresses per argument**, `β.i` and `β.j` are `⊑`-**incomparable**, and
   therefore so are every locus `β.i.…` on `ℓ_i` and every locus `β.j.…` on `ℓ_j`: an
   address on `ℓ_i` below `β` and an address on `ℓ_j` below `β` are **never equal** (equal
   addresses are trivially comparable; incomparable addresses are unequal). Since matching
   requires equal addresses, an act at a below-branch locus of `ℓ_i` has **no** possible
   matching partner among the below-branch acts of `ℓ_j`. Hence no cross-line match below
   the branch.

Combining (1) and (2): every matched pair is either a stem pair or an intra-line pair; none
crosses two distinct lines. The matched-pair relation partitions as
`pairs(⟨D ∣ T⟩) = pairs(stem) ⊎ ⨄_ℓ pairs_below(ℓ)`. ∎

> **Why this is true abstractly and false of `stepCore` (the trap avoided).** The argument
> uses only (i) match-by-equal-address and (ii) T005's distinct subaddresses ⟹
> incomparable-hence-unequal below-branch loci. It does **not** read the kernel. `stepCore`
> violates the conclusion because its scheduler `findNextPositive` is **least-index with no
> justification gate**: on a *combined* run it can select a below-branch positive of `ℓ_j`
> while the thread descended `ℓ_i`, then fail to find its dual and break `DIVERGENT`
> off-thread (the frozen witness: `pos=[P@0,O@0.1,O@0.2,P@0.1.1,P@0.2.1]` diverges at
> `0.1.1` with matched `["0","0.2"]` — [T007 §Defect 1](T007-minimal-separating-locus.md),
> [`c013-factorization-scope.test.ts`](../../tests/bridge/c013-factorization-scope.test.ts)).
> That is a property of the kernel's *linearization*, not of normalization: the abstract
> `⟨D ∣ T⟩` (Definition 2) recurses per component and never schedules across lines, so
> non-interference holds by construction. The kernel's gap is precisely O-faithful below.
> *The proof does not assume non-interference into the definition of normalization; it
> derives it from match-by-equal-address, then uses it to license the parallel recursion.*

### Lemma O-parity-c — factorization (from a + b)

*Claim.* `⟨D ∣ T⟩` factors through its lines:
`⟨D ∣ T⟩ ≅ ⨆_ℓ ⟨D↾ℓ ∣ T↾ℓ⟩` (the multiset of per-line runs). Concretely:
`⟨D ∣ T⟩` is `CONVERGENT` iff every `⟨D↾ℓ ∣ T↾ℓ⟩` is `CONVERGENT`, and otherwise its
**divergence set** is `{ first-divergence locus of ⟨D↾ℓ ∣ T↾ℓ⟩ : ℓ diverges }`.

*Proof.* By O-parity-b the matched pairs partition as
`pairs(stem) ⊎ ⨄_ℓ pairs_below(ℓ)`. The stem is matched identically in every `⟨D↾ℓ ∣ T↾ℓ⟩`
(it is their common prefix), and below the branch the pairs of line `ℓ` depend only on
`(D↾ℓ, T↾ℓ)` — no act outside line `ℓ` shares a locus with line `ℓ`'s below-branch acts
(O-parity-b), so nothing outside `ℓ` can consume, block, or enable a line-`ℓ` act. Hence the
below-branch evolution of line `ℓ` in `⟨D ∣ T⟩` is *identical* to that in the isolated
`⟨D↾ℓ ∣ T↾ℓ⟩`. By O-parity-a each line carries its own parity, so the per-line runs are
independent T008 normalizations sharing only the (deterministic, common) stem. Therefore the
parallel recursion of Definition 2 is well-defined and equals the multiset of per-line runs.
Convergence is the conjunction (the net closes iff it closes on every component), and the
divergence set collects the per-line first-divergence loci. ∎

This is the lemma that licenses the harness's "run `stepCore` per line and aggregate" as
**faithful**: each `⟨D↾ℓ ∣ T↾ℓ⟩` is a linear chronicle where `stepCore` is faithful (T008),
and O-parity-c says the tree's behaviour is exactly their aggregate.

### Lemma O-perline (per-line separation = T008)

*Claim.* On each refused line `ℓ` (test withholds the grant at `ξ_ℓ`), `⟨D↾ℓ ∣ Refuse_ℓ⟩`
is `DIVERGENT` with first-divergence locus exactly `ξ_ℓ(E)`; and for any shallower frontier
`d ⊏ ξ_ℓ` the corresponding concession `Concede_d` converges.

*Proof.* `D↾ℓ` is a single realized chronicle and `T↾ℓ` is a T008 proper test (O-tree), so
[T008(1)/(2)](T008-minimal-separating-context-daimon-closed.md) apply verbatim:
`Concede_d` reaches `†` on the test's turn before `D` over-runs (CONVERGENT — does not
separate), and the genuine refusal diverges exactly at the carried-locus refusal `ξ_ℓ`. By
O-parity-c the line behaves identically inside the tree, so line `ℓ` contributes exactly
`ξ_ℓ(E)` and nothing shallower. ∎

### Lemma O-smyth — Smyth-least = M (a pure antichain/powerdomain fact)

*Claim.* Let `M` be a `⊑`-antichain and let the separating family be the subset-refusal
family `{ U : ∅ ≠ U ⊆ M }` with separating set `U`. Then `≤_S` has a **unique least
element, equal to `M`**.

*Proof.* (i) *`M` is `≤_S`-least.* For any `U ⊆ M` and any `u ∈ U`, `u ∈ M` and `u ⊑ u`, so
`∃ s ∈ M. s ⊑ u`; hence `M ≤_S U` for every separating `U`. (ii) *Uniqueness.* Suppose
`U ≤_S M` as well, i.e. `∀ m ∈ M ∃ u ∈ U. u ⊑ m`. Fix `m ∈ M`; get `u ∈ U ⊆ M` with
`u ⊑ m`. Since `M` is an antichain and `u, m ∈ M`, `u ⊑ m` forces `u = m`; so `m ∈ U`. Thus
`M ⊆ U`, and with `U ⊆ M`, `U = M`. So the only separating set `≤_S`-below `M` is `M`
itself, and by (i) `M` is below all; the `≤_S`-least element exists and is uniquely `M`. ∎

This is order theory only — it needs nothing from the fragment. (The fragment enters
**upstream**, via O-parity-c, to guarantee `M` is an antichain and the family is the
subset-refusal family.) The structural law is the one
[`branching-normalization.test.ts`](../../tests/bridge/branching-normalization.test.ts)
`verifyByEnumeration` cross-checks against brute force for `|M| ≤ 6`.

### Assembly (Stages A → B → C)

- **Stage A (single line, base case).** If `D` is one line, there is no branch node;
  O-parity is vacuous, O-perline gives `SepProper(D, E) = { {ξ(E)} }`, and the Smyth-least
  set is the singleton `{ξ(E)} = M`. This is exactly T008(3).
- **Stage B (two `⊑`-incomparable lines).** O-parity-b at the single branch node gives
  non-interference; O-parity-c factors `⟨D ∣ T⟩` into the two T008 runs; O-perline gives
  each line's contribution `ξ_{ℓ_1}`, `ξ_{ℓ_2}` (an antichain, by T005 incomparability);
  the realized separating family is the subset-refusal family on `M = {ξ_{ℓ_1}, ξ_{ℓ_2}}`;
  O-smyth gives Smyth-least `= M`.
- **Stage C (general tree, induction on branch structure).** A branching `D` is a stem
  followed by sub-trees rooted at the `⊑`-incomparable children of its first branch node.
  Apply O-parity-b at that node (the child components are pairwise incomparable, so
  pairwise non-interfering) and the induction hypothesis to each sub-tree: each contributes
  its own per-line antichain, and the contributions are pairwise incomparable (distinct
  subaddresses), so their union `M(D, E)` is a `⊑`-antichain and the realized family is the
  subset-refusal family over it. O-smyth gives the unique Smyth-least `= M(D, E)`.

Hence `SepProper(D, E)` has a unique `≤_S`-least element equal to `M(D, E)`. ∎ **(T009)**

> **Relative, not absolute (as in T008).** `M(D, E)` is the antichain of the **deepest**
> per-line grants, **relative to the fixed disagreement `E`** — the proper-test family of
> `(D, E)` (Definition 3). The root `ξ₀ = "0"` is the trivial **absolute** floor (the
> opponent who refuses the claim outright), `≤_S`-below everything; the product-bearing
> object is the **relative** `M`. The per-line interior-refusal objection lifts exactly as
> in [T008 §Statement](T008-minimal-separating-context-daimon-closed.md): a test refusing
> line `ℓ` at an interior even locus `d ⊏ ξ_ℓ` diverges there but is the refusal of a
> *different* disagreement `E′ ∉ family(D, E)`, not a shallower separating set for the same
> `E`.

## Faithfulness lemma (O-faithful) — `stepCore ∘ ⟦·⟧` vs the abstract tree-normalization

**Lemma F-tree.** `stepCore ∘ ⟦·⟧` is faithful to `⟨D ∣ T⟩` **iff** it is run **line by
line** — each restriction `⟨D↾ℓ ∣ T↾ℓ⟩` is a frontier-complete linear chronicle on which
`stepCore` is faithful (T008 Lemma F). On the **combined** tree the ungated
`findNextPositive` is **unfaithful**: its least-index scheduler can select a below-branch
positive on a line the thread did not descend, breaking `DIVERGENT` off-thread.

*Proof.* Per line, `⟨D↾ℓ ∣ T↾ℓ⟩` is a T008 object, so T008 Lemma F gives faithfulness
(`DAIMON ⇒ CONVERGENT`; carried-locus unmatched positive `⇒ DIVERGENT`; `STUCK`/`ONGOING`
impossible). O-parity-c says the abstract tree-normalization equals the aggregate of these
faithful per-line runs. On the combined run, by contrast, `stepCore` has no justification
gate (T006 §Determinism: `findNextPositive` is least-index over the *whole* act list), so it
does not respect O-parity-b's block-diagonal structure; the witness below exhibits the
violation. ∎

**Failure characterization (the parked R1-tree spec).** `stepCore` diverges from the
abstract normalization on a combined tree **iff** `findNextPositive` selects a positive at a
locus `ℓ'` whose `⊑`-predecessor on its own line was **not matched in the current thread** —
i.e. `ℓ'` is reachable by global least-index order but **unjustified** in the descending
line. The faithful verdict ignores `ℓ'` (the justification gate blocks it) and continues the
engaged line; the kernel instead breaks `DIVERGENT` at `ℓ'` off-thread.

> **R1-tree spec (parked).** A tree-aware kernel would add a **justification/reachability
> gate** to `findNextPositive`: a positive at `ξ` fires only after its `⊑`-parent on the
> same line was matched in the current thread. This is **distinct** from T008's R1-linear
> trigger (a *justified* over-run past a truncation, which a reachability gate does **not**
> fix — only an orthogonality-verdict change would; [T007 Repair-1 follow-up](T007-minimal-separating-locus.md)).
> The branching trigger *is* an unjustified off-thread jump, which a reachability gate
> **would** fix. **Both stay parked**: the per-line factorization (O-parity-c) makes the
> theorem independent of either, exactly as T008 §Faithfulness made R1-linear unnecessary on
> the line. Detecting it needs a per-line justification flag on the scheduler — real kernel
> surface, and it must preserve [`stepcore-differential.test.ts`](../../tests/bridge/stepcore-differential.test.ts)
> (T005). **The failure on combined trees is expected, not a bug to fix** (C013
> §Out-of-scope).

**Empirical witness (frozen regression).** `pos=[P@0,O@0.1,O@0.2,P@0.1.1,P@0.2.1]`,
`neg=[O@0,P@0.2,O@0.2.1]` → `stepCore` returns `DIVERGENT`, `divergenceLocus "0.1.1"`,
matched `["0","0.2"]` — off-thread (`0.1` never matched). The faithful reading runs the two
lines in isolation (`["0","0.1","0.1.1"]` → `0.1.1`; `["0","0.2","0.2.1"]` → `0.2.1`),
recovering `M = {0.1.1, 0.2.1}`. Frozen in
[`c013-factorization-scope.test.ts`](../../tests/bridge/c013-factorization-scope.test.ts).

## Corroborating computation

Evidence, not the proof. (i) [`branching-normalization.test.ts`](../../tests/bridge/branching-normalization.test.ts)
runs the abstract tree-normalizer (per-line `stepCore`, faithful by T008; pure Smyth/Hoare
aggregation) over `allAFs(n)`, `n ≤ 3`: every dispute (1344/1344 at n=3) has Smyth-least =
`M` (the full per-line antichain), and Hoare-least fails on exactly the branching ones
(663/663) — the order choice and the conclusion of O-smyth, measured. (ii)
[`c013-factorization-scope.test.ts`](../../tests/bridge/c013-factorization-scope.test.ts)
pins O-parity-c (per-line runs recover `M`; the combined run does not), freezes the
O-faithful off-thread witness, and spot-checks an asymmetric (length-3 / length-5) two-line
tree. Full bridge suite green (11 suites / 70 tests), including the T005 differential and
both T008 harnesses — never weakened.

## Scope and boundary

- **In scope:** abstract AF, multiplicative/additive-free, canonical orthogonality,
  **branching** dispute trees, complete daimon-closed concession-trees, the **Smyth** order.
  Discharges Q-041 **O2** on cross-check.
- **Additive / preferred-stable — out of scope, and the place factorization is *expected* to
  break ([Q-039](../01_OPEN_QUESTIONS_REGISTRY.md#q-039) / [C011](../03_CONJECTURES/C011-additive-preferred-games-bridge.md)).**
  O-parity-b leans on **multiplicative** branch points (distinct subaddresses ⟹
  incomparable ⟹ unequal below-branch loci ⟹ no cross-match). With **additives** (`&`/`⊕`)
  a shared negative node is a *choice* that can entangle lines (engaging one cancels
  others), so non-interference — and hence the full-antichain conclusion — need not hold.
  This boundary is load-bearing; it must not silently widen under "general trees."
- **Operational sourcing — licensed (cross-checked 2026-06-05).** T009 recovers the branching
  minimum **abstractly**, and the sign-off licenses the extractor promotion: the
  [`properTest.ts`](../../packages/ludics-engine/properTest.ts) basis is relabelled
  `per-line-divergence-C013` → **`smyth-minimal-T009`**. The surface may now claim *minimal*
  — but strictly as a **Smyth-minimal antichain** (a SET), **never** a single `⊑`-least
  locus (a branching dispute has none), and the computation must keep running `stepCore`
  **per line** (never the combined tree). The Agda mechanization remains a Direction-5
  follow-up.
- **R1-tree / R1-linear — parked.** The per-line factorization makes both unnecessary for
  the theorem; the kernel's off-thread failure on combined trees is *characterized* (O-faithful),
  not fixed. Do not modify `stepCore`.

## What this establishes (for the implementation)

- **"Where you disagree" generalizes cleanly to branching disputes as a *set*:** the
  Smyth-least separating context is the antichain `M(D, E)` of per-line first-divergence
  loci — "the minimal set of unshared commitments, one per open dispute line" — now
  *theorem-backed* (modulo cross-check) rather than a corroborated heuristic.
- **The extractor's branching branch is specified, sound, and now promoted.** Where
  `isSingleChronicle` is false ([`properTest.ts`](../../packages/ludics-engine/properTest.ts)),
  the Smyth-least antichain `M` (run `stepCore` **per line**, aggregate — never a combined
  run) is the correct set-valued output. With the sign-off the basis is promoted
  `per-line-divergence-C013` → **`smyth-minimal-T009`** and the surface may claim *minimal*
  under the Smyth order — but as a **minimal antichain / set**, "the minimal set of unshared
  commitments, one per open line", **never** a single `⊑`-least locus (a branching dispute
  has none). Gated on this proof exactly as the linear `minimal-T008` path is gated on T008.

## Mechanization path (Direction 5)

**Landed (2026-06-05).** The two load-bearing lemmas are mechanised in Agda at
[`../mechanisation/agda/T009/T009.agda`](../mechanisation/agda/T009/T009.agda) (mirroring
`T008/`'s suggested home, the `T002/` / `C004/` house style: `--safe --without-K`, no
postulates/holes, Agda 2.7.0.1 / stdlib v2.0), on a concrete locus model
(`Locus = List ℕ`, segment-wise prefix `⊑`, faithful to
[`separation.isPrefixLocus`](../../packages/ludics-engine/separation.ts)):

- **O-parity-b** (THE CRUX) — `branch-incomp` proves distinct children `i ≠ j` below a stem
  `β` give `⊑`-incomparable below-branch loci; `no-cross-line-match` concludes that, under
  match-by-equal-address (`Matches`, mirroring `findNextNegativeAtLocus`), the two lines
  never match. This is the non-interference licensing the per-line factorisation.
- **O-smyth** — `SmythLeast-is-M`: for any `⊑`-antichain `M`, `M` is the unique Smyth-least
  element of its subset-refusal family (`M-smyth-below` + `M-smyth-unique`). Pure order
  theory; the fragment enters only upstream.
- **Non-vacuity** — the harness fixture `["0.1.2","0.2.2"]` as a concrete antichain on which
  both lemmas fire (`incomp-ab`, `ac-M`, `M-is-smyth-least`).

Not mechanised (human-review obligations, T009 already `established` by the human proof):
the faithfulness of `Matches` to the kernel rule; **O-parity-a / O-perline** (the verbatim
per-line reduction to the linear T008 base case); and **O-faithful** (the parked off-thread
failure spec). The Agda is a check on, not a substitute for, the paper proof (evidence-only
under the Register policy).

## Bibliography

- Girard 2001, *Locus Solum* (MSCS 11) — designs as trees of chronicles, normalization, the
  daimon, separation; the justification condition (an act's address is a child of an
  already-played address on its chronicle) O-parity-b leans on.
- Smyth 1978 / Plotkin — the upper (Smyth) powerdomain; the liftings of a partial order to
  its sets (O-smyth).
- In-repo: [C013](../03_CONJECTURES/C013-branching-smyth-minimal-separating-context.md) (the
  conjecture this proves), [session 06](../10_IDEATION_SESSIONS/06-c013-abstract-proof-scoping-2026-06-05.md)
  (the scope + attack plan), [T008](T008-minimal-separating-context-daimon-closed.md) (the
  linear base case), [T007 §Defect 1](T007-minimal-separating-locus.md) (the off-thread
  witness), [T006](T006-first-divergence-locus-e0.md) (E0), [T005](T005-grounded-ludics-keystone.md)
  (the translation), [C012 §Route (b)](../03_CONJECTURES/C012-separation-minimal-locus.md)
  (the off-thread probe), [Q-041](../01_OPEN_QUESTIONS_REGISTRY.md#q-041) (O2) /
  [Q-039](../01_OPEN_QUESTIONS_REGISTRY.md#q-039) (additive), harnesses
  [`branching-normalization.test.ts`](../../tests/bridge/branching-normalization.test.ts) /
  [`c013-factorization-scope.test.ts`](../../tests/bridge/c013-factorization-scope.test.ts),
  order [`separation.ts`](../../packages/ludics-engine/separation.ts), extractor
  [`properTest.ts`](../../packages/ludics-engine/properTest.ts).

## Cross-check notes

**Verdict — sign-off, ESTABLISHED (2026-06-05, GitHub Copilot, non-author).** I
re-derived every obligation in §§1–6 of
[`T009-verification-prompt.md`](T009-verification-prompt.md) against the kernel source
([`stepCore.ts`](../../packages/ludics-engine/stepCore.ts)), the order
([`separation.ts`](../../packages/ludics-engine/separation.ts)), the extractor
([`properTest.ts`](../../packages/ludics-engine/properTest.ts)), the dispute builder
([`dispute.ts`](../../lib/bridge/dispute.ts)), both harnesses, and an independent
adversarial probe (run transiently, removed) — **not** against the proof's summaries.
**All obligations discharge; the proof is correct.** The predecessor failure mode the
prompt flags (T007's *blocking* leastness defect — O-parity-b false against the kernel,
or a Smyth-least ≠ M) **does not arise here**, because T009 proves its result about the
*abstract* per-line normalization (the genuine Ludics object) and explicitly quarantines
the kernel's off-thread infidelity as O-faithful (parked), rather than claiming the
defective property of `stepCore`. I recommend promotion to `established`.

### Discharged obligations (re-derived)

- **§1 Definitions Girard-faithful, over the right objects — discharged.** Definition 1
  is the branching lift of the T008 proper test (an act — proper or `†` — at every
  positive turn across **all** lines; per-line `isFrontierComplete` conjoined over
  locus-disjoint lines). Definition 3's Smyth order `S ≤_S T ⟺ ∀t∈T ∃s∈S. s⊑t` is
  exactly `smythLeq` in [`branching-normalization.test.ts`](../../tests/bridge/branching-normalization.test.ts),
  and the realized family is the subset-refusal family `{refuse U : ∅≠U⊆M}`.
- **§1.2 Definition 2 is not circular — discharged.** The parallel-per-component
  normalization is *derived*, not assumed: O-parity-b's proof uses only
  match-by-equal-address (the Ludics primitive) + T005 distinct subaddresses, and never
  reads Definition 2's parallel structure; factorization (O-parity-c) is then a corollary
  that licenses the parallel form. (Read `⟨D∣T⟩` primitively as the Ludics cut-net
  normalization with global match-by-equal-address; O-parity-b shows it factors. The
  prose is careful about this — see non-blocking note 1.)
- **§2 O-parity-b (THE CRUX) — discharged, re-derived against the kernel.** Confirmed
  `findNextNegativeAtLocus` matches a positive at locus `ξ` **only** against an O-act
  with `a.locusId === ξ` (match-by-equal-address; 2.1). Confirmed `buildDisputeDesign`
  emits child loci `locusPath.argId`, one **distinct** child per attacker, so a branch
  node's children sit at distinct first-differing segments and all below-branch loci of
  distinct lines are `⊑`-incomparable hence **unequal** (2.2) — therefore no cross-line
  match (2.3, block-diagonality). I **tried to break it** with an independent probe over
  all AFs `n≤3` (663 branching disputes) plus hand-built deep/asymmetric `n=4`/`n=5`
  trees (a 3-way root branch; an asymmetric depth-4 vs depth-1 tree): **0 cross-line
  below-branch collisions, M an antichain on all 978 designs.** The kernel does **not**
  satisfy O-parity-b on a *combined* run (the frozen off-thread witness `0.1.1`, matched
  `["0","0.2"]`) — confirmed a property of the least-index scheduler, correctly
  quarantined by O-faithful and never used to *establish* the lemma (2.4).
- **§3 O-parity-a / -c / O-perline reduce correctly — discharged.** Each line's parity
  is T008 Lemma 0 on `(D↾ℓ, T↾ℓ)`; the stem fixes the shared branch parity (3.1).
  Block-diagonality (O-parity-b) ⟹ `⟨D∣T⟩` factors as `pairs(stem) ⊎ ⨄_ℓ pairs_below(ℓ)`,
  so nothing outside line `ℓ` can consume/block/enable a line-`ℓ` below-branch act (3.2);
  convergence is the conjunction, divergence the union of per-line first-divergence loci.
  O-perline is T008(1)/(2) invoked verbatim per line, with O-parity-c supplying "the line
  behaves identically inside the tree" (3.3).
- **§4 O-smyth — discharged (pure antichain fact).** Re-derived: for a `⊑`-antichain `M`
  and the subset-refusal family, (i) `M ≤_S U` for all `U` (every `u∈U⊆M` has `u⊑u∈M`);
  (ii) `U ≤_S M ⟹ U=M` (antichain forces `u⊑m ⟹ u=m`); unique least `= M`. Needs nothing
  from the fragment. `maximalLoci` confirms `M(D,E)` is a genuine antichain; the harness's
  `verifyByEnumeration` cross-checks the law for `|M|≤6`.
- **§5 Assembly / relative-vs-absolute / scope honesty — discharged.** The Stage-C
  induction is well-founded (finite tree); the union of per-subtree antichains over
  pairwise-incomparable child cones is itself an antichain. `M(D,E)` is the deepest grants
  **relative** to the fixed `E` (root `ξ₀` excluded as the trivial absolute floor;
  interior-refusal lifts per line to a different `E′ ∉ family(D,E)`, exactly as T008).
  Q-039 (additive) is explicitly out of scope and flagged as where factorization is
  expected to break; R1-tree stays parked; `stepCore` untouched.
- **§6 Corroboration — re-run, evidence only.** `jest tests/bridge/` → **11 suites,
  70 tests green**, including the T005 differential and both T008 harnesses (unweakened).
  `branching-normalization.test.ts` reports **Smyth-least=M 1344/1344** and
  **Hoare-no-least 663/663** at `n=3`; `c013-factorization-scope.test.ts` freezes the
  off-thread witness and the per-line ≠ combined contrast. My independent adversarial
  `n=4`/`n=5` spot check (§6.3) found no cross-line match.

### Non-blocking clarifications (author may fold in at leisure; no truth claim affected)

> **Both folded in 2026-06-05.** (1) Definition 2 now states `⟨D∣T⟩` is *primitively the
> global Ludics normalization* and that the factorization is a theorem (O-parity-c), not the
> definition. (2) The extractor basis was promoted `per-line-divergence-C013` →
> `smyth-minimal-T009` in [`properTest.ts`](../../packages/ludics-engine/properTest.ts) /
> [`FrontierLane.tsx`](../../components/deliberation/FrontierLane.tsx), kept as a
> **Smyth-minimal antichain** claim (never a `⊑`-least locus), still run `stepCore` per line;
> [`stepcore-differential.test.ts`](../../tests/bridge/stepcore-differential.test.ts) stays green.

1. **Make the "`⟨D∣T⟩` is primitively the global Ludics normalization" reading explicit
   in Definition 2.** O-parity-b is non-vacuous only if `⟨D∣T⟩` is read as the cut-net
   normalization under *global* match-by-equal-address (which the lemma then proves
   factors); if instead Definition 2's parallel-per-component form is taken as the
   definition, "no cross-line match" is true by fiat. The proof body gets this right
   ("derives it from match-by-equal-address, then uses it to license the parallel
   recursion"), but Definition 2's wording could state up front that the parallel form is
   the *theorem*, not the *definition*.
2. **Promotion of the extractor basis is now licensed but should stay Smyth-qualified.**
   With sign-off, `properTest.ts`'s `per-line-divergence-C013` basis may be promoted to a
   `minimal` claim — but only **"Smyth-minimal antichain"**, never a `⊑`-least *locus*
   (no such locus exists for branching disputes; the harness's `isAntichain` /
   Hoare-no-least results are the guard). The relabel is an `properTest.ts` surface change
   left to the author; it must keep [`stepcore-differential.test.ts`](../../tests/bridge/stepcore-differential.test.ts)
   green and continue to run `stepCore` **per line**, never on the combined tree.
