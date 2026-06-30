# C004 — joint saturation `σ_joint` is a closure operator, Agda mechanisation

Mechanisation of [C004](../../../03_CONJECTURES/C004-joint-saturation-closure.md)
(`σ_joint` is a closure operator on the product poset of design-sets and
witness-record sets, with a Galois universal property as a corollary).
Status: **type-checks without postulates or holes** (`--safe
--without-K`). The closure/Galois half is *evidence for* C004; **Q-004
front (a) is now discharged on the abstract-AF fragment** — the protocol's
forward-closure operator `Reach` is no longer a bare hypothesis record but
is **constructed** (§4) as reflexive-transitive reachability of the dispute
move-graph, with the three closure axioms proven. The residual is the
faithfulness of the supplied move-graph `_↦_` to the substrate's actual
abstract-AF dispute protocol (human review).

## What this proves

Writing `U = D ∪ moves W` and `R = Reach U`, the operator under test is

```
σ_joint(D , W) = ( Reach(D ∪ moves W) , W )
```

on the componentwise product poset `(𝒫(Moves), ⊆) × (𝒫(Witness), ⊆)` —
the witness component is fixed (Reading C: participation instantiates into
the shared Proponent design, it is not merged in), per
[`LUDICS_OPEN_COMPOSITION_JOINT.md`](../../../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_OPEN_COMPOSITION_JOINT.md)
§0e.1. The module `JointSaturation` discharges the three closure axioms:

- **`σ-ext`** (extensive): `x ⊑ σ x`. On the design side, `D ⊆ U ⊆ Reach U`
  by `inj₁` into the union followed by `reach-ext`; the witness side is
  reflexivity.
- **`σ-mono`** (monotone): `x ⊑ y → σ x ⊑ σ y`. The union map is monotone
  componentwise (`D ⊆ D'` and `moves`-monotonicity feed `inj₁`/`inj₂`),
  then `reach-mono` lifts it through `Reach`.
- **`σ-idem`** (idempotent): `σ (σ x) ≈ σ x`. The load-bearing step: the
  second pass seeds with `R ∪ moves W`, but `moves W ⊆ U ⊆ R` already, so
  that seed collapses to `R` and `reach-idem` finishes. Both inclusions
  of the resulting set-equality `Reach(R ∪ moves W) ≐ R` are proved.

The Galois universal property the conjecture asks for follows
(`§3.1`):

- **`Saturated x = σ x ≈ x`**, the closed (jointly-saturated) elements;
- **`σ-saturated`** : `σ x` is always saturated (`= σ-idem`);
- **`σ-below`** : `Saturated c → x ⊑ c → σ x ⊑ c` — the lower-adjoint half
  of the Galois insertion of `Live` into its saturated elements (the
  `(σ_joint, restrict)` connection);
- **`below-σ`** : `σ x ⊑ c → x ⊑ c`, the companion direction.

`Model` (§5) instantiates the abstract development on the discrete
forward-closure `Reach = id` (already extensive, monotone, idempotent on
the nose) with an arbitrary monotone `moves`, so `ForwardClosure` is
inhabited and the closure-operator development is demonstrably
non-vacuous. `Reach = id` is the empty-move-graph special case of §4.

## Front (a): the substrate `Reach` is reachability (§4)

Q-004 front (a) asked to replace the `ForwardClosure` hypothesis record
with the substrate's actual forward-closure operator. Now that Reading-C
participation closure is fixed on the abstract-AF fragment
([T012](../../02_THEOREMS_AND_PROOFS/T012-reading-c-conservative.md),
resolving [Q-002](../../01_OPEN_QUESTIONS_REGISTRY.md#q-002)), that operator
is **reflexive-transitive reachability along the dispute move-graph**: for
a move-step relation `_↦_`, `Reach P` is every move reachable from a move
of `P` by following move-graph edges. Module `Reachability` (§4):

- defines `_↦⋆_`, the reflexive-transitive closure (`ε` / `_◅_`), and
  `_⋆∘_`, path concatenation;
- defines `Reach P y = ∃ x. x ∈ P × x ↦⋆ y`;
- **proves** `reach-ext` (extensivity, the empty path `ε`), `reach-mono`
  (monotonicity, re-seed the same path) and `reach-idem` (idempotence,
  path concatenation), packaged as `reachForwardClosure : ForwardClosure`.

The three closure axioms are therefore **theorems of the construction**,
not fields of a hypothesis record, and the whole `JointSaturation`
development runs unchanged on this genuine operator (it is already
parametric in `fc : ForwardClosure`). Module `AbstractAF` (§6) fixes
`_↦_` to the attack-induced dispute edges `_↣_`, the abstract-AF instance
per T012's participation closure. The discharge is uniform in the
move-graph, so it holds for every abstract AF.

## Why `Reach` was a record, and what front (a) changed

C004 `depends-on` the protocol's forward-closure operator `Reach` (C002,
C003 supply the underlying move-graph and participation extraction). Until
front (a), that operator was exposed as a `ForwardClosure` **record** of
hypotheses — its three closure axioms `reach-ext` / `reach-mono` /
`reach-idem` as *fields*, not Agda `postulate`s — keeping the artefact
`--safe` while making the dependency visible in the types. §4 now
**supplies a genuine inhabitant** of that record: reachability of the
move-graph, with the axioms proven. The record interface is retained so
that `JointSaturation` stays parametric (and so the identity/empty-graph
witness still type-checks), but the substrate operator is no longer
merely asserted — every closure result for `σ_joint` is now a function of
a *constructed* `ForwardClosure`, modulo move-graph faithfulness.

The shared closure theory lives in
[`../lib/Closure.agda`](../lib/Closure.agda) (the `Powerset` module:
predicates, `⊆`/`≐`, binary union with its universal property), the
closure-theory companion to [`../lib/Order.agda`](../lib/Order.agda).

## Build

Requires:

- Agda 2.7.0.1 or later (tested on 2.7.0.1)
- `agda-stdlib` **v2.0 pinned**

Resolution is via [`../mesh-substrate.agda-lib`](../mesh-substrate.agda-lib),
which puts the shared [`../lib/Closure.agda`](../lib/Closure.agda) on the
include path. Type-check from `mechanisation/agda`:

```sh
agda C004/C004.agda
```

Expected output: clean, no errors, no warnings, no unsolved metas.

## Correspondence to the substrate

| Toy (this file)                | Substrate object                                          |
|--------------------------------|-----------------------------------------------------------|
| `Move` / `Wit`                 | protocol moves / witnessing acts (records)                |
| `Powerset.Pred`                | a set of moves / a set of witness-records                 |
| `ForwardClosure` record        | the protocol's forward-closure operator `Reach`           |
| `Reachability` / `reachForwardClosure` (§4) | the substrate `Reach` = move-graph reachability (front (a)) |
| `_↦⋆_` / `_⋆∘_`                | dispute-line reachability and its concatenation           |
| `AbstractAF` (`_↣_`) (§6)      | the abstract-AF instance: attack-induced dispute edges (T012) |
| `moves` / `moves-mono`         | the ι-binding extraction `moves(Witness)` (monotone)      |
| `Live = M.Pred × Wt.Pred`      | the live-deliberation poset `P = (𝒫(Moves),⊆)×(𝒫(Wit),⊆)` |
| `σ`                            | `σ_joint`                                                 |
| `σ-ext` / `σ-mono` / `σ-idem`  | the three closure axioms                                  |
| `Saturated` / `σ-below`        | the saturated poset and the `(σ_joint, restrict)` Galois half |
| `Latent` / `drainage` (§3.2)   | the latent stratum `Λ(B,W)` and the drainage corollary ([T014](../../02_THEOREMS_AND_PROOFS/T014-exposure-map-drainage.md)) |
| `Model` (`Reach = id`)         | non-vacuity witness (empty-move-graph special case of §4)  |

## What this cannot check

Per the Register policy and in line with the T001/T002 caveats:

- Faithfulness of the move-graph step relation `_↦_` (`_↣_` in the
  abstract-AF instance) to the substrate's actual dispute protocol —
  human review. Front (a) **constructs** `Reach` as reachability of a
  *supplied* move-graph and proves the closure axioms; what stays outside
  Agda is that this move-graph is the faithful abstract-AF dispute graph
  (C002/C003, now fixed for the abstract-AF fragment by
  [T012](../../02_THEOREMS_AND_PROOFS/T012-reading-c-conservative.md)). The
  axioms are no longer asserted, only the relation's faithfulness is.
- Faithfulness of `moves` to the real ι-binding witness extraction —
  human review.
- ASPIC+ / structured-`B` lift of the move-graph is out of scope (T012
  abstract-AF limit); the §4 discharge is uniform in `_↦_` so it carries
  to any move-graph the structured layer supplies.
- The **drainage corollary** is now mechanised at its `⊆`-antitone core
  (§3.2: `Latent` / `drainage` / `walked-not-latent` / `promoted-drains`;
  see [T014](../../02_THEOREMS_AND_PROOFS/T014-exposure-map-drainage.md)),
  but two things stay outside Agda: (i) the **cardinality** form
  `|Λ_{t+1}| ≤ |Λ_t|` and strict-decrease *counting* (argued on paper from
  `⊆` over a finite frontier `B`); (ii) the **modelling choices** the
  theorem rests on — the fixed behaviour frontier `B` as the universe (vs.
  the growing `S_t`), the **accrual** (no-retraction) scope, and **LB2**
  (union reachability) — which are faithfulness obligations for human
  review, exactly like the `ForwardClosure` record. The drainage core still
  *depends on* `Reach`; with front (a) it now rides on the §4 reachability
  construction (and its move-graph faithfulness obligation) rather than on
  a bare hypothesis record.
