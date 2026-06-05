# C013 — Over daimon-closed concession-trees, the Smyth-minimal separating context of a branching dispute is the antichain of per-line first-divergence loci

- **status:** **RESOLVED (positive) — proved as [T009](../02_THEOREMS_AND_PROOFS/T009-branching-smyth-minimal-separating-context.md)** (`established`, cross-checked 2026-06-05), Direction 2 / Q-041 **O2**. The branching harness ([`tests/bridge/branching-normalization.test.ts`](../../tests/bridge/branching-normalization.test.ts)) corroborated the statement over `allAFs(n)`, `n ≤ 3` (663 branching disputes at n=3) and *decided the order* (Smyth over Hoare/Egli–Milner); the **abstract proof** is [T009](../02_THEOREMS_AND_PROOFS/T009-branching-smyth-minimal-separating-context.md), which discharges O-tree/O-parity(a/b/c)/O-perline/O-smyth with O-faithful the kernel bridge, signed off by an independent non-author reader. The operational extractor basis is promoted `per-line-divergence-C013` → `smyth-minimal-T009` (a Smyth-minimal **antichain**, never a `⊑`-least locus). The parallel Agda mechanization of the two load-bearing lemmas (O-parity-b, O-smyth) has **landed** ([`mechanisation/agda/T009/T009.agda`](../mechanisation/agda/T009/T009.agda), `--safe --without-K`, no postulates/holes).
- **ring:** core
- **depends-on:** [T008](../02_THEOREMS_AND_PROOFS/T008-minimal-separating-context-daimon-closed.md) (the linear base case: on a single chronicle the per-line minimum is `ξ(E)`, and the kernel is faithful on proper daimon-closed tests); [T006](../02_THEOREMS_AND_PROOFS/T006-first-divergence-locus-e0.md) (E0, per-line first-divergence locus); [T005](../02_THEOREMS_AND_PROOFS/T005-grounded-ludics-keystone.md) (the translation `⟦·⟧`, the additive-free fragment, canonical orthogonality); Girard 2001 (separation; tests as counter-designs; the daimon); Smyth/Plotkin (the upper powerdomain order)
- **linked-open-questions:** [Q-041](../01_OPEN_QUESTIONS_REGISTRY.md#q-041) (O2 — branching; this conjecture is its positive resolution under the Smyth order), [Q-040](../01_OPEN_QUESTIONS_REGISTRY.md#q-040) (the parent "where do you disagree" question)
- **scoping-session:** [session 05](../10_IDEATION_SESSIONS/05-branching-normalization-o2-2026-06-04.md) (the O2 scoping + empirical Smyth order choice); [session 06](../10_IDEATION_SESSIONS/06-c013-abstract-proof-scoping-2026-06-05.md) (the **abstract-proof scope/dev-spec**: per-obligation verdict — O-parity is the crux, split into a/b/c, **O-parity-b** the load-bearing non-interference lemma; paper-first then Agda; object model; staged attack plan A→B→C; missing corroboration added as [`c013-factorization-scope.test.ts`](../../tests/bridge/c013-factorization-scope.test.ts))
- **abstract-proof-scope:** [session 06](../10_IDEATION_SESSIONS/06-c013-abstract-proof-scoping-2026-06-05.md) — verdict: C013 still looks **true** after the scope pass; biggest risk is O-parity-b (locus-disjoint non-interference), true on the additive-free fragment
- **last-reviewed:** 2026-06-05

## Setting

Carry the T005/T008 setting: a finite abstract AF `F = (A, ⇝)`, the translation
`⟦·⟧` into the **multiplicative, additive-free** fragment with distinct subaddresses
per argument, and **canonical** orthogonality. Drop T008's *linear* restriction: `D`
is now a genuine branching Proponent dispute design `⟦a⟧⁺` — one child locus per
attacker, recursively — so several `⊑`-incomparable dispute lines are open at once.

- **Maximal lines.** A *line* is a maximal `⊑`-chain of loci in `D`; `D` is the union
  of its lines, which pairwise share a stem and then diverge. Each line, in isolation,
  is a single realized chronicle — the T008 object.
- **Per-line first-divergence loci.** For an opponent `E` non-orthogonal to `D`, each
  refused line `ℓ` has a first-divergence locus `ξ_ℓ(E)` (E0/T006, per line). Write
  `M(D, E) = { ξ_ℓ(E) : ℓ a refused line }`. Because each `ξ_ℓ` is a `⊑`-**maximal**
  Proponent-positive locus on its line, **`M(D, E)` is a `⊑`-antichain** (no element a
  prefix of another).
- **Proper test (branching).** Generalizing [T008 Definition 1](../02_THEOREMS_AND_PROOFS/T008-minimal-separating-context-daimon-closed.md):
  a **complete daimon-closed counter-design** of a branching `D` is a daimon-closed
  *sub-tree* — at **every** one of its positive turns, across **all** lines `D` opens,
  it carries an act (a proper attack **or** the daimon `†`). It refuses on some
  non-empty set `U` of lines (withholds the grant at each `ξ_ℓ`, `ℓ ∈ U`) and concedes
  (`†`) on the rest. Its **separating set** is `{ ξ_ℓ(E) : ℓ ∈ U }`.
- **The Smyth (upper powerdomain) order on separating sets.** For locus sets `S, T`:
  `S ≤_S T  :⟺  ∀ t ∈ T  ∃ s ∈ S.  s ⊑ t`. ("Refuse on more lines, at shallower
  points" = smaller.) This is the lifting of the prefix order `⊑`
  ([`separation.ts`](../../packages/ludics-engine/separation.ts), `isPrefixLocus`) to
  sets. *The harness rejected the alternatives:* the **Hoare** order `S ≤_H T ⟺ ∀s∈S
  ∃t∈T. s⊑t` has **no least** on every branching dispute (the incomparable singletons
  are Hoare-minimal with no infimum); Egli–Milner inherits that failure. Smyth is the
  unique lifting under which a branching minimal separating context exists.

## Statement (the load-bearing claim)

> **Conjecture (C013).** Fix a branching `D` and an opponent `E` with `D ⊥̸ E`. Over
> complete daimon-closed counter-designs (proper concession-trees), the
> **Smyth-least separating set exists, is unique, and equals the full per-line
> antichain `M(D, E)`**:
>
> $$\mathrm{SepProper}(D, E) \text{ has a } \le_S\text{-least element } = M(D,E).$$
>
> Equivalently: the minimal separating context of a branching dispute is the
> **antichain of per-line first-divergence loci** — "you disagree at *all* of these
> per-line points, and at no shallower set." Read at the platform: **the minimal
> unshared commitment generalizes from a single locus to the minimal *set* of
> commitments, one per open dispute line.**

The reduction to T008 is the base case: when `D` is a single line, `M(D, E) = { ξ(E) }`
and the Smyth-least set is the singleton — C013 specializes to T008(3).

## Abstract-proof obligations

The harness corroborates C013 by running `stepCore` **per line** (faithful — T008) and
aggregating purely; the *proof* must establish the same over **general** daimon-closed
concession-trees at the abstract Ludics level, decoupled from `stepCore` (which
mis-diverges off-thread on a combined tree — [C012 §Route (b)](C012-separation-minimal-locus.md)).
Five obligations, each a structural induction on the dispute tree (the Direction-5
mechanization target, `mechanisation/agda/` alongside T008):

1. **(O-tree) Branching proper test is well-defined.** Show the daimon-closed sub-tree
   of Definition (Setting) is a legitimate Ludics counter-design (closed under the
   net-closure rule, `†` placed only on the design's own turns), and that it is
   *frontier-complete on every line* (the per-line guard of
   [`properTest.isFrontierComplete`](../../packages/ludics-engine/properTest.ts)
   lifted to the tree). This is the object the order ranges over.

2. **(O-parity) Per-branch parity (Lemma 0, generalized).** [T008](../02_THEOREMS_AND_PROOFS/T008-minimal-separating-context-daimon-closed.md)
   Lemma 0 fixed whose turn it is by depth parity on a single chronicle. Generalize to
   a tree: along each line the alternation parity is the line's local depth parity, and
   the lines are independent below their shared stem. Formally: normalization of a
   concession-tree **factors** through its lines — the multiset of per-line runs — with
   no cross-line interaction below the branch point. *This is the lemma that licenses
   the harness's "run `stepCore` per line and aggregate" strategy as faithful.*

3. **(O-perline) Per-line separation = T008.** On each refused line `ℓ`, the sub-run is
   a single realized chronicle, so T008(1)/(2) apply verbatim: the concession at any
   shallower frontier on `ℓ` converges, and the genuine refusal diverges exactly at
   `ξ_ℓ(E)`. Hence each line contributes exactly its `ξ_ℓ(E)` and nothing shallower.

4. **(O-smyth) Smyth-least = M.** From O-parity + O-perline: a proper test refusing the
   line-set `U` separates with set `{ ξ_ℓ : ℓ ∈ U }`. Show (i) `M = { ξ_ℓ : all refused
   lines }` is `≤_S` every separating set (refusing *all* lines, each at its
   first-divergence locus, dominates any sub-refusal under Smyth); and (ii) uniqueness:
   any `≤_S`-least set equals `M` because the `ξ_ℓ` are a `⊑`-antichain (no shallower
   representative exists on any line). Conclude `SepProper(D,E)` has Smyth-least `M`.

5. **(O-faithful) Tree faithfulness lemma + its failure spec.** Generalize
   [T008 §Faithfulness](../02_THEOREMS_AND_PROOFS/T008-minimal-separating-context-daimon-closed.md):
   `stepCore ∘ ⟦·⟧` is faithful on a branching proper test **iff** run *line-by-line*
   (each line frontier-complete); on the **combined** tree the ungated
   `findNextPositive` mis-descends off-thread (C012 §Route (b)), so the faithful
   reading is the per-line factorization (O-parity), not a single combined run. State
   the exact failure trigger — the off-thread least-index selection — as the precise
   spec a tree-aware R1 would gate, kept **parked** (R1 stays out; the per-line
   factorization makes it unnecessary for the theorem, exactly as T008 §Faithfulness
   made it unnecessary on the line).

## Positive settlement

A proof discharging O-tree … O-faithful, corroborated (already) by
[`branching-normalization.test.ts`](../../tests/bridge/branching-normalization.test.ts).
On settlement, migrate to [`../02_THEOREMS_AND_PROOFS/`](../02_THEOREMS_AND_PROOFS/)
as the branching companion of T008 (a `T009`), `closes: Q-041` **O2** for the
multiplicative fragment, carrying the Smyth-order choice and the per-line factorization
as its scope. The Agda mechanization of O-parity/O-smyth is the strongest available
check and *is* the Direction-5 separation deliverable.

## Negative settlement

C013 is **order-relative**, and that is itself recorded as a result: under the
**Hoare** (lower powerdomain) lifting there is provably **no** least separating set on
any branching dispute (the harness shows this on 663/663 branching cases) — the
incomparable per-line singletons are Hoare-minimal with no infimum. So "no minimal
separating context for branching disputes" is a *true statement under Hoare* and a
*false one under Smyth*; the content of C013 is the claim that **Smyth is the right
order** (it matches the product intuition "you disagree at all these points" and it
admits the minimum). A genuine negative result would be a branching `(D, E)` for which
even the Smyth-least set is *not* `M` — e.g. some line's contribution is not its
first-divergence locus, or cross-line interaction (O-parity failure) makes the
factorization unfaithful. The harness searched `allAFs(n)`, `n ≤ 3` and found none;
a counterexample at larger `n`, or an O-parity failure on a tree shape the small
corpus misses, would restrict C013 to the characterized sub-fragment.

## Scope and non-goals

- **In scope:** abstract AF, multiplicative/additive-free, canonical orthogonality,
  **branching** dispute trees, complete daimon-closed concession-trees, the **Smyth**
  order. Closes Q-041 **O2** on positive settlement.
- **Out of scope:** additive / preferred-stable separation
  ([Q-039](../01_OPEN_QUESTIONS_REGISTRY.md#q-039) / [C011](C011-additive-preferred-games-bridge.md));
  R1 kernel-verdict change (parked — the per-line factorization makes it unnecessary
  for the theorem); the operational set-valued surface (a separate engineering step —
  the extractor already carries the `isSingleChronicle` gate that routes branching
  disputes here).

## What this would establish (for the implementation)

- **"Where you disagree" generalizes cleanly to branching disputes** as a *set*: the
  Smyth-least separating context is the antichain `M(D, E)` of per-line
  first-divergence loci — "the minimal set of unshared commitments, one per open
  dispute line." This is exactly the per-line minima the product would surface, now
  *theorem-backed* rather than a heuristic fallback.
- **The minimal-disagreement extractor's branching branch is specified.** Where
  `isSingleChronicle` is false ([`properTest.ts`](../../packages/ludics-engine/properTest.ts)),
  the sound output is the Smyth-least antichain `M` (run per line, aggregate) with a
  set-valued `basis` — the operational counterpart of C013, gated on its proof for the
  "minimal" label exactly as the linear path is gated on T008.

## Bibliography

- Girard 2001, *Locus Solum* (MSCS 11) — designs as trees of chronicles, the daimon,
  tests as counter-designs, separation.
- Smyth 1978 / Plotkin — the upper (Smyth) powerdomain; the standard liftings of a
  partial order to its sets (Smyth/Hoare/Egli–Milner).
- In-repo: [T008](../02_THEOREMS_AND_PROOFS/T008-minimal-separating-context-daimon-closed.md)
  (the linear base case), [T006](../02_THEOREMS_AND_PROOFS/T006-first-divergence-locus-e0.md),
  [T007](../02_THEOREMS_AND_PROOFS/T007-minimal-separating-locus.md),
  [C012](C012-separation-minimal-locus.md),
  [Q-040](../01_OPEN_QUESTIONS_REGISTRY.md#q-040) / [Q-041](../01_OPEN_QUESTIONS_REGISTRY.md#q-041),
  [session 05](../10_IDEATION_SESSIONS/05-branching-normalization-o2-2026-06-04.md),
  harness [`branching-normalization.test.ts`](../../tests/bridge/branching-normalization.test.ts),
  order [`separation.ts`](../../packages/ludics-engine/separation.ts),
  extractor [`properTest.ts`](../../packages/ludics-engine/properTest.ts).
