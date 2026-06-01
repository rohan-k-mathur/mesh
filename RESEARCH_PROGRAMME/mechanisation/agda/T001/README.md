# T001 — per-cone join-semilattice, Agda mechanisation

Mechanisation of [T001](../../../02_THEOREMS_AND_PROOFS/T001-oq-jsl-per-cone.md)
(each cone `Cᵢ` is a join-semilattice `(Cᵢ, ⊆, ∪)` with bottom `Dᵢ`,
join = literal chronicle-set union).
Status: **type-checks without postulates or holes** (`--safe
--without-K`). Not a positive settlement of T001 under the
[Theorem Register policy](../../../02_THEOREMS_AND_PROOFS/README.md);
this is *evidence for* T001 only.

## What this proves

Following the **Reading A** human proof in
[`LUDICS_ORDER_RELATION_DEFINITION.md`](../../../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_ORDER_RELATION_DEFINITION.md)
§§4, 6 (order = literal set-inclusion `⊆`; join = set-union `∪`; no
`⊥⊥`-closure inside a cone), the file makes the proof's own split between
the order-theoretic content and the Daimon-Lock dependency:

- **The JSL axioms are pure order theory** (`Order.JoinFromLUB`). A binary
  operation with the three least-upper-bound clauses
  - `ub₁ : a ⊑ (a ⊔ b)`, `ub₂ : b ⊑ (a ⊔ b)`,
  - `lub : a ⊑ c → b ⊑ c → (a ⊔ b) ⊑ c`

  is **idempotent** (`⊔-idem`), **commutative** (`⊔-comm`),
  **associative** (`⊔-assoc`) and **≈-congruent** (`⊔-cong`), discharging
  from antisymmetry alone, with no behaviour, no cone and no Ludics input.
  This is the bulk of T001 and is **unconditional** — it matches the
  source's observation that the JSL laws "are order-theoretic consequences
  of the least-upper-bound property".

- **The per-cone JSL is conditional on the Daimon Lock Lemma**
  (`Order.Cone`). Fixing an incarnation `Dᵢ` and the cone predicate
  `InCone`, the lemma's three consequences — `Dᵢ` is the bottom
  (`cone-bottom`, the very map T002 exports), the cone contains `Dᵢ`
  (`Dᵢ∈`), and set-union stays in the cone (`⊔-closed`) — are supplied as
  explicit **hypotheses**, *not* Agda `postulate`s. From them, together
  with the LUB clauses for set-union, the file derives the full JSL plus
  **bottom neutrality** `Dᵢ ∪ D ≈ D` (`⊔-bot`) and `Dᵢ` as least element
  (`⊥-least`).

- **Non-vacuity** (`ListModel`). The abstract order is instantiated on the
  C001a list-design model (`Carrier = List A`, `⊑` = set-inclusion, `≈` =
  set-equality `≈ᴰ`). Set-union is `_++_`, and its LUB clauses are exactly
  the C001a union lemmas (`∈-++⁺ˡ` / `∈-++⁺ʳ` / `∈-++⁻`). The principal
  up-set `↑Dᵢ` is exhibited as a concrete **inhabited** cone
  (`PrincipalCone`), so the abstract per-cone JSL is non-vacuous on the
  substrate's designs-as-sets representation.

## The equality convention (F2) is faithfully modelled

T001's equality convention (registry §Equality convention) is that cone
elements are *sets* and the JSL axioms hold strictly under set-equality,
but only up to the kernel `≈ᴰ` on a representative data structure. The
mechanisation is the **setoid-internal** reading: every derived axiom is
an `≈`-equality (`⊑-antisym` lands in `≈`), and on the list model
`≈ = ≈ᴰ`. In particular idempotence is `D ++ D ≈ D` even though
`D ++ D ≢ D` propositionally — exactly the F2 setoid point the registry
audit flags.

## Why Daimon-Lock is hypotheses, not postulates

T001 `depends-on` T002 and rests on the Daimon Lock Lemma for
within-cone closure of set-union. The JSL-axiom core needs none of it; the
*cone* needs `cone-bottom`, `Dᵢ∈` and `⊔-closed`. Exposing these as
`Cone` module parameters keeps the file **postulate-free** (so it
type-checks under `--safe`) while making the dependency visible in the
types: every per-cone result is literally a function of those witnesses.
This is the honest rendering of "given the Daimon Lock Lemma, each cone is
a JSL", and it isolates exactly which claims ride on the substrate lemma
versus pure order theory.

## Build

Requires:

- Agda 2.7.0.1 or later (tested on 2.7.0.1)
- `agda-stdlib` **v2.0 pinned**

Resolution is via [`../mesh-substrate.agda-lib`](../mesh-substrate.agda-lib),
which puts the shared [`../lib/Order.agda`](../lib/Order.agda) on the
include path (T001's abstract order theory and list-design model now live
there, shared with T002).  Type-check from `mechanisation/agda`:

```sh
agda T001/T001.agda
```

Expected output: clean, no errors, no warnings, no unsolved metas.

## Correspondence to the substrate

| Toy (this file)                  | Substrate object                                       |
|----------------------------------|--------------------------------------------------------|
| `Carrier` / `_⊑_` / `_≈_`        | designs / chronicle-set inclusion `⊆` / set-equality   |
| `_⊔_` (abstract) / `_++_` (list) | the join `∨` = literal chronicle-set union `∪`         |
| `JoinFromLUB`                    | JSL axioms as order-theoretic LUB consequences (§6)    |
| `Cone` module hypotheses         | the Daimon Lock Lemma (§4) within-cone consequences    |
| `cone-bottom` / `⊥-least`        | `Dᵢ` is the bottom of `Cᵢ` (T002's `cone-bottom`)      |
| `Dᵢ∈`                            | `Dᵢ ∈ Cᵢ` (the incarnation is in its own cone)         |
| `⊔-closed`                       | union of two cone designs stays in the cone            |
| `⊔-bot`                          | bottom neutrality `Dᵢ ∪ D = D`                         |
| `↑Dᵢ` (`PrincipalCone`)          | the principal up-set above `Dᵢ` (an inhabited cone)    |
| `ListModel`                      | designs-as-sets (Phase 2f Reading A)                   |

## What this cannot check

Per the Register policy and in line with the T002 / C001a caveats:

- Faithfulness of the `Cone` hypotheses to the **Daimon Lock Lemma**
  ([`LUDICS_ORDER_RELATION_DEFINITION.md`](../../../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_ORDER_RELATION_DEFINITION.md)
  §4) — human review. The within-cone closure of set-union (`⊔-closed`)
  is the substrate's Forest/Coherence/Positivity argument, *asserted* here
  as a hypothesis, not derived from the chronicle-coherence axioms.
- Match of the `List A` model to the substrate's chronicle-tree designs —
  human review (same F2/representation caveat as
  [T002](../T002/README.md) and [C001a](../C001/README.md)).
- Finite-generation of `Inc(B)` — assumed in T001 prose, not used by the
  order-theoretic core, hence not modelled here.

## Relationship to the other artefacts

- **T002** supplies `cone-bottom` (each cone has its incarnation as a
  lower bound); T001 consumes exactly that as the bottom of the JSL. The
  two files currently re-declare the same abstract `Order` core; a planned
  refactor will lift it into a shared `lib/Order.agda`.
- **C001a / T004** (downstream): the JSL-fragment Ambler bridge. Its
  `⊆ᴰ-++ˡ` / `⊆ᴰ-++ʳ` / `⊆ᴰ-++-collapse` lemmas are the same `_++_` LUB
  clauses reused here, so the per-cone JSL and the bridge share their
  set-union join structure.
