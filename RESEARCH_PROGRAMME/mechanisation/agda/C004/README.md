# C004 — joint saturation `σ_joint` is a closure operator, Agda mechanisation

Mechanisation of [C004](../../../03_CONJECTURES/C004-joint-saturation-closure.md)
(`σ_joint` is a closure operator on the product poset of design-sets and
witness-record sets, with a Galois universal property as a corollary).
Status: **type-checks without postulates or holes** (`--safe
--without-K`). This is *evidence for* C004 only — the conjecture's
`status` remains **open**, since the protocol's forward-closure operator
`Reach` enters as a hypothesis record rather than a settled construction.

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

`Model` (§4) instantiates the abstract development on the discrete
forward-closure `Reach = id` (already extensive, monotone, idempotent on
the nose) with an arbitrary monotone `moves`, so `ForwardClosure` is
inhabited and the closure-operator development is demonstrably
non-vacuous.

## Why `Reach` is a record, not a postulate

C004 `depends-on` the protocol's forward-closure operator `Reach` (C002,
C003 supply the underlying move-graph and participation extraction). That
operator is itself only conjectural at the substrate level, so it is
exposed as a `ForwardClosure` **record** of hypotheses — its three
closure axioms `reach-ext` / `reach-mono` / `reach-idem` are *fields*, not
Agda `postulate`s. This keeps the artefact `--safe` while making the
dependency visible in the types: every closure result for `σ_joint` is
literally a function of a `ForwardClosure` witness (and a monotone
`moves`). It is the honest rendering of "given that `Reach` is a closure
operator, so is `σ_joint`", and it isolates exactly which claims ride on
the unsettled forward-closure construction.

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
| `moves` / `moves-mono`         | the ι-binding extraction `moves(Witness)` (monotone)      |
| `Live = M.Pred × Wt.Pred`      | the live-deliberation poset `P = (𝒫(Moves),⊆)×(𝒫(Wit),⊆)` |
| `σ`                            | `σ_joint`                                                 |
| `σ-ext` / `σ-mono` / `σ-idem`  | the three closure axioms                                  |
| `Saturated` / `σ-below`        | the saturated poset and the `(σ_joint, restrict)` Galois half |
| `Latent` / `drainage` (§3.2)   | the latent stratum `Λ(B,W)` and the drainage corollary ([T014](../../02_THEOREMS_AND_PROOFS/T014-exposure-map-drainage.md)) |
| `Model` (`Reach = id`)         | non-vacuity witness                                       |

## What this cannot check

Per the Register policy and in line with the T001/T002 caveats:

- Faithfulness of the `ForwardClosure` record to the substrate's actual
  forward-closure operator (C002/C003) — human review. The record is
  *asserted*, not built; that is exactly why C004's status stays `open`.
- Faithfulness of `moves` to the real ι-binding witness extraction —
  human review.
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
  *depends on* the asserted `Reach`, so it inherits C004 front (a)'s open
  status.
