# Verification prompt — fully cross-check T009 (the Smyth-minimal separating context over daimon-closed concession-trees, branching fragment)

> **Role.** You are an independent second reader. You did **not** author T009.
> Your job is to either (a) sign off on the theorem as *established*, or (b) return
> a numbered list of substantive defects, each with the precise location and the
> minimal repair you believe is required. Default to skepticism: a clean sign-off
> requires that *every* obligation below is discharged. Do **not** trust the
> proof's own summaries — re-derive against the kernel source and the harnesses.
> The author's [predecessor cross-check of T007 found a *blocking* leastness
> defect](T007-minimal-separating-locus.md#defect-1--blocking--lemma-as-leastness-is-false-against-the-kernel);
> the analogous failure mode here is **O-parity-b being false** (a tree with
> cross-line interaction, or a Smyth-least ≠ M). Hunt for it.
>
> **Target.** [`T009-branching-smyth-minimal-separating-context.md`](T009-branching-smyth-minimal-separating-context.md)
> — the claim that, in the multiplicative additive-free T005 fragment over a
> **branching** dispute design and quantifying over **complete daimon-closed
> concession-trees** (branching proper tests), the **Smyth-least separating set
> exists, is unique, and equals the per-line first-divergence antichain `M(D, E)`**.
> The five obligations are proved as lemmas O-tree / O-parity-(a/b/c) / O-perline /
> O-smyth, with O-faithful the bridge to the kernel.
>
> **Scope reminder — what T009 is and is NOT.** T009 is the **branching companion of
> [T008](T008-minimal-separating-context-daimon-closed.md)** (Q-041 **O2**; T008 is
> O1). It redefines the *objects* (separating context = daimon-closed concession-tree;
> the order = **Smyth** upper powerdomain), it does **not** change the kernel verdict
> (R1-tree parked). It is **decoupled from `stepCore`** — the abstract tree-normalization
> (Definition 2) is parallel-per-component; the kernel's off-thread mis-divergence on a
> *combined* tree is **expected** and is the content of O-faithful, **not** a defect to
> fix. The additive case ([Q-039](../01_OPEN_QUESTIONS_REGISTRY.md#q-039)) is **out of
> scope** and is exactly where O-parity-b is expected to break. A sign-off must confirm:
> the Smyth-least = M claim was a *conjecture, not a premise* (proved, not assumed); the
> factorization (O-parity-c) is genuine and not smuggled into the definition of
> normalization; and the relative-vs-absolute quantifier is honoured.
>
> **Programme rules you are bound by.** Read [`README.md`](README.md)
> (theorem-register policy) first. An entry must be (1) stated in formal vocabulary,
> (2) human-checkable in one sitting via lemmas, (3) cross-checked by a non-author,
> (4) tied to an open-question entry it retires or updates. Tests are **evidence, not
> proof**. Record your verdict in the format of the existing `## Cross-check notes`
> sections (see [T006](T006-first-divergence-locus-e0.md) /
> [T007](T007-minimal-separating-locus.md) / [T008](T008-minimal-separating-context-daimon-closed.md)
> for the model).

---

## 0. Source materials you must consult (do not work from T009 alone)

- **The theorem.** [`T009-branching-smyth-minimal-separating-context.md`](T009-branching-smyth-minimal-separating-context.md)
- **The conjecture it proves + its five obligations.** [`../03_CONJECTURES/C013-branching-smyth-minimal-separating-context.md`](../03_CONJECTURES/C013-branching-smyth-minimal-separating-context.md)
- **The scope/attack-plan it executes.** [`../10_IDEATION_SESSIONS/06-c013-abstract-proof-scoping-2026-06-05.md`](../10_IDEATION_SESSIONS/06-c013-abstract-proof-scoping-2026-06-05.md)
  — esp. §1 (per-obligation verdict; O-parity split a/b/c), §5 (missing corroboration), §6 (Q-039 boundary).
- **The linear base case (invoked verbatim per line).** [`T008-minimal-separating-context-daimon-closed.md`](T008-minimal-separating-context-daimon-closed.md)
  — Lemma 0 (parity), §Proof (1)/(2), §Faithfulness (Lemma F). T009's O-parity-a / O-perline / O-faithful **reduce to these per line**; confirm the reduction is exact.
- **The off-thread obstruction (the failure spec O-faithful claims).** [`T007-minimal-separating-locus.md`](T007-minimal-separating-locus.md)
  §Defect 1 + §Boundary — the witness `pos=[P@0,O@0.1,O@0.2,P@0.1.1,P@0.2.1]` → `DIVERGENT` at `0.1.1`, matched `["0","0.2"]`; and [`../03_CONJECTURES/C012-separation-minimal-locus.md`](../03_CONJECTURES/C012-separation-minimal-locus.md) §Route (b).
- **The warm-up.** [`T006-first-divergence-locus-e0.md`](T006-first-divergence-locus-e0.md) (E0; the determinism / least-index `findNextPositive` you must hold against O-parity-b).
- **The translation (the source of "distinct subaddresses per argument").** [`T005-grounded-ludics-keystone.md`](T005-grounded-ludics-keystone.md),
  [`../10_IDEATION_SESSIONS/02b-translation-spec-af-to-designs-2026-06-02.md`](../10_IDEATION_SESSIONS/02b-translation-spec-af-to-designs-2026-06-02.md),
  and [`../../lib/bridge/dispute.ts`](../../lib/bridge/dispute.ts) (`buildDisputeDesign`: the `ramification` = one child per attacker — confirm distinct child loci).
- **The pure kernel.** [`../../packages/ludics-engine/stepCore.ts`](../../packages/ludics-engine/stepCore.ts)
  — `findNextPositive` (least-index, **no justification gate**), `findNextNegativeAtLocus` (match by **equal locus**), the `DIVERGENT` break sites.
- **The pure order.** [`../../packages/ludics-engine/separation.ts`](../../packages/ludics-engine/separation.ts)
  — `isPrefixLocus` (segment-wise `⊑`), `comparableLoci`, `maximalLoci`, `commonStem`; and [`../../packages/ludics-engine/properTest.ts`](../../packages/ludics-engine/properTest.ts) (`isFrontierComplete`, `isSingleChronicle`).
- **The corroborating harnesses (evidence).** [`../../tests/bridge/branching-normalization.test.ts`](../../tests/bridge/branching-normalization.test.ts)
  and [`../../tests/bridge/c013-factorization-scope.test.ts`](../../tests/bridge/c013-factorization-scope.test.ts).

## 1. Definitions are Girard-faithful and over the right objects

1.1 Confirm Definition 1 (complete daimon-closed concession-tree) is the branching lift of
the T008 proper test: an act (proper or `†`) at **every** positive turn across **all** lines,
equivalently `T↾ℓ` frontier-complete for every line. Check `properTest.isFrontierComplete`
is the per-line guard and that the conjunction over lines is what Definition 1 asks.

1.2 Confirm Definition 2 (abstract tree-normalization) is **parallel-per-component**, and —
critically — that it is **not circular**: the parallel recursion is *licensed by O-parity-b*,
not assumed. Verify the proof derives non-interference from match-by-equal-address **before**
using it to define normalization. (If the definition presupposes factorization, that is a
blocking defect.)

1.3 Confirm Definition 3's Smyth order `S ≤_S T ⟺ ∀t∈T ∃s∈S. s⊑t` matches `smythLeq` in the
harness, and that the realized family is the **subset-refusal** family `{ refuse U : ∅≠U⊆M }`.

## 2. O-parity-b is true (THE CRUX — re-derive, do not trust)

2.1 **Match-by-equal-address.** Confirm against `stepCore` (`findNextNegativeAtLocus`) and
*Locus Solum* that a positive at locus `ξ` is matched only by a negative at the **same** `ξ`.

2.2 **Distinct lines ⟹ unequal below-branch addresses.** Confirm T005's distinct subaddresses
make `β.i`, `β.j` (`i≠j`) `⊑`-incomparable, hence every `β.i.…` and `β.j.…` unequal. Check
`buildDisputeDesign`'s `ramification` actually emits distinct child loci (no collision).

2.3 **Block-diagonality.** From 2.1+2.2, re-derive that the matched-pair relation partitions
as `pairs(stem) ⊎ ⨄_ℓ pairs_below(ℓ)` with no cross-line pair. **Try to break it:** construct
a small branching `(D, E)` (two or three lines, possibly asymmetric depths) and check by hand
that no below-branch act of one line can match an act of another. A single cross-match
witness **refutes T009** (the C013 negative-settlement shape) — report it precisely.

2.4 **The kernel does NOT satisfy O-parity-b, and that is fine.** Confirm the off-thread
witness (`0.1.1`, matched `["0","0.2"]`) is a property of `stepCore`'s least-index scheduler,
**not** of the abstract normalization, and that O-faithful correctly quarantines it. Verify
the proof never reads the kernel to *establish* O-parity-b.

## 3. O-parity-a / -c / O-perline reduce correctly

3.1 O-parity-a: each line's parity is T008 Lemma 0 on `(D↾ℓ, T↾ℓ)`; the stem fixes a shared
branch-depth parity. Confirm.

3.2 O-parity-c (factorization): from block-diagonality, `⟨D∣T⟩` = aggregate of per-line T008
runs; convergence = conjunction; divergence set = union of per-line first-divergence loci.
Confirm nothing outside line `ℓ` can consume/block/enable a line-`ℓ` below-branch act.

3.3 O-perline: on each refused line, T008(1)/(2) give divergence exactly at `ξ_ℓ` and
convergence at every shallower frontier. Confirm this is T008 invoked verbatim, with
O-parity-c supplying "the line behaves identically inside the tree."

## 4. O-smyth is a pure antichain fact

4.1 Re-derive: for a `⊑`-antichain `M` and the subset-refusal family, (i) `M ≤_S U` for all
`U` (every `u∈U⊆M` has `u⊑u∈M`); (ii) `U ≤_S M ⟹ U=M` (antichain forces `u⊑m ⟹ u=m`). Hence
unique least `= M`. Confirm it needs **nothing** from the fragment (the fragment enters only
upstream, via O-parity-c, to make `M` an antichain and the family the subset-refusal family).

4.2 Confirm `M(D,E)` is genuinely an antichain (per-line `ξ_ℓ` are `⊑`-maximal,
`separation.maximalLoci`) and that the harness's `verifyByEnumeration` cross-checks the law
for `|M|≤6`.

## 5. Assembly, relative-vs-absolute, and scope honesty

5.1 Stages A→B→C: base case = T008; two-line case = single branch node; general = induction on
branch structure. Confirm the induction is well-founded (finite tree) and each step applies
O-parity-b at the branch node + IH to sub-trees, and that the union of per-subtree antichains
is itself an antichain (distinct subaddresses).

5.2 **Relative, not absolute.** Confirm `M(D,E)` is the deepest grants relative to the fixed
`E`; the absolute floor `ξ₀` is excluded as the trivial opponent; the interior-refusal
objection lifts per line (a different `E′ ∉ family(D,E)`), exactly as T008 §Statement.

5.3 **Q-039 boundary not silently widened.** Confirm O-parity-b explicitly leans on
**multiplicative** branch points and that the proof flags the additive case as where
factorization is expected to fail — and does **not** claim general (additive) trees.

5.4 **No overclaim / gating.** Confirm the proof does **not** relabel the extractor's
`per-line-divergence-C013` basis as `minimal`, keeps R1-tree parked, and does not touch
`stepCore`. Confirm the registry linkage (Q-041 O2 discharged-on-cross-check; Q-039 out).

## 6. Corroborating computation (re-run, evidence only)

6.1 Run `node --max-old-space-size=2048 ./node_modules/.bin/jest tests/bridge/` → confirm
**11 suites / 70 tests green**, including the T005 differential and both T008 harnesses
(unweakened), `branching-normalization.test.ts`, and `c013-factorization-scope.test.ts`.

6.2 Confirm `c013-factorization-scope.test.ts` actually freezes the off-thread witness and the
per-line ≠ combined contrast (the O-parity-c / O-faithful evidence), and that
`branching-normalization.test.ts` reports Smyth-least=M on 1344/1344 and Hoare-no-least on
663/663 (the O-smyth evidence + order choice).

6.3 Optionally build an independent **n=4 adversarial tree** (asymmetric, deep branch) and
check by hand that per-line aggregation = `M` and no cross-line match arises — the spot check
the small corpus may miss.

## 7. Deliver your verdict

Either **sign off** (`established`, with any non-blocking clarifications recorded, in the
`## Cross-check notes` format), or return a **numbered defect list** — each with location,
why it fails (re-derived, not summarized), an empirical witness if applicable, and the minimal
repair. If O-parity-b fails on any tree, that tree **is** the deliverable (the C013
negative-settlement shape — restrict T009 to the characterized sub-fragment), exactly as
T007's refutation was.
