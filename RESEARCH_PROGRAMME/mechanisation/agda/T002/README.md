# T002 — antichain + cone decomposition, Agda mechanisation

Mechanisation of [T002](../../../02_THEOREMS_AND_PROOFS/T002-inc-b-antichain.md)
(`Inc(B)` is an antichain; `B` decomposes into disjoint cones).
Status: **type-checks without postulates or holes** (`--safe
--without-K`). Not a positive settlement of T002 under the
[Theorem Register policy](../../../02_THEOREMS_AND_PROOFS/README.md);
this is *evidence for* T002 only.

## What this proves

The two parts of T002, mirroring the human proof in
[`LUDICS_OQ_JSL_PROOF.md`](../../../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_OQ_JSL_PROOF.md)
§§3–5:

- **Part 1 — antichain** (`Order.Behaviour.antichain`): the minimal
  elements of any setoid partial order form an antichain — if `D₁ ⊑ D₂`
  and both are minimal then `D₁ ≈ D₂`. This is the source's "purely
  order-theoretic … holds for the minimal elements of any partially
  ordered set" observation (§0.3, §5.1), and it discharges with no
  hypotheses beyond the order axioms. The in-`Inc(B)` no-upper-bound
  corollary (`no-upper-bound-in-Inc`) follows.

- **Part 2 — cone decomposition** (`Order.Behaviour.Incarnation`): given
  the Fouqueré–Quatrini uniqueness-of-incarnation theorem — supplied as
  an explicit `Incarnation` **record** (a hypothesis), not an Agda
  `postulate` — we derive:
  - `inc-minimal` : each incarnation lies in `Inc(B)`;
  - `inc-unique` : the incarnation is the *unique* minimal element below
    a design;
  - `cross-cone-incompat` : distinct incarnations have no common upper
    bound anywhere in `B` (§5.2 Cross-Cone Incompatibility);
  - `cone-total` + `cone-disjoint` : the cone-assignment map is total and
    functional, i.e. `B` partitions into cones (§4 Cone Decomposition);
  - `cone-bottom` : each cone has its incarnation as a lower bound,
    matching T001's cone definition `Cᵢ = { D ∈ B : Dᵢ ⊆ D, … }`.

`ListModel` (§2) instantiates the abstract order on the C001a list-design
model (`Carrier = List A`, `⊑` = set-inclusion, `≈` = set-equality `≈ᴰ`),
discharging every order axiom, so the abstract theorems are non-vacuous on
the substrate's designs-as-sets representation.

## Why the F-Q dependency is a record, not a postulate

T002 `depends-on` Fouqueré–Quatrini 2013 uniqueness-of-incarnation. The
antichain half needs none of it; the cone half needs all of it. Exposing
F-Q as the `Incarnation` record keeps the file **postulate-free** (so it
type-checks under `--safe`) while making the dependency visible in the
types: every cone result is literally a function of an `Incarnation`
witness. This is the honest rendering of "given F-Q, the cones partition
`B`", and it isolates exactly which claims ride on the cited theorem.

## Build

Requires:

- Agda 2.7.0.1 or later (tested on 2.7.0.1)
- `agda-stdlib` **v2.0 pinned**

Resolution is via [`../mesh-substrate.agda-lib`](../mesh-substrate.agda-lib),
which puts the shared [`../lib/Order.agda`](../lib/Order.agda) on the
include path (T002's abstract order theory and list-design model now live
there, shared with T001).  Type-check from `mechanisation/agda`:

```sh
agda T002/T002.agda
```

Expected output: clean, no errors, no warnings, no unsolved metas.

## Correspondence to the substrate

| Toy (this file)                        | Substrate object                                  |
|----------------------------------------|---------------------------------------------------|
| `Carrier` / `_⊑_` / `_≈_`              | designs / chronicle-set inclusion / set-equality  |
| `B : Carrier → Set`                    | a behaviour `B = B^⊥⊥`                             |
| `Minimal D`                            | `D ∈ Inc(B)` (minimal element under `⊆`)          |
| `antichain`                            | T002.1 (`Inc(B)` is an antichain)                 |
| `Incarnation` record                   | Fouqueré–Quatrini 2013 uniqueness-of-incarnation  |
| `inc d`                                | `|D|_B`, the incarnation of `D`                   |
| `cross-cone-incompat`                  | §5.2 Cross-Cone Incompatibility                   |
| `cone-total` + `cone-disjoint`         | §4 Cone Decomposition (the partition)             |
| `cone-bottom`                          | the bottom `Dᵢ` of the per-cone JSL (T001)        |
| `ListModel`                            | designs-as-sets (Phase 2f Reading A)              |

## What this cannot check

Per the Register policy and in line with the C001a caveats:

- Faithfulness of the `Incarnation` record to Fouqueré–Quatrini 2013
  (LMCS 9(4:6)) — human review. The record is *asserted*, not built.
- Match of the `List A` model to the substrate's chronicle-tree designs
  — human review (same F2/representation caveat as
  [C001a](../C001/README.md)).
- Finite-generation of `Inc(B)` — assumed in T001/T002 prose, not used
  by the order-theoretic core, hence not modelled here.
