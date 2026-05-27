# T001 — OQ-JSL per-cone

- **status:** established
- **closes:** the per-cone half of OQ-JSL (originally OQ-JSL as stated; reformulated after Phase 2e refuted the whole-of-Inc(B) version)
- **depends-on:** T002 (Inc(B) is an antichain; cone decomposition)
- **proved-by:** Phase 2f formal-proof session, 2026-05-21
- **cross-checked-by:** Round 2 literature review (substrate-internal cross-check against Fouqueré–Quatrini 2013)
- **cross-check-date:** 2026-05-18
- **last-reviewed:** 2026-05-27
- **source-of-proof:** [`../../Development and Ideation Documents/ARCHITECTURE/Ludics Generative Substrate Documents/LUDICS_OQ_JSL_PROOF.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_OQ_JSL_PROOF.md) and [`../../Development and Ideation Documents/ARCHITECTURE/Ludics Generative Substrate Documents/LUDICS_ORDER_RELATION_DEFINITION.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_ORDER_RELATION_DEFINITION.md)

## Statement

Fix a behaviour `B` in the finitely-generated regime. For each incarnation
`Dᵢ ∈ Inc(B)`, the cone

> `Cᵢ := { D ∈ B : Dᵢ ⊆ D, and no Dⱼ ∈ Inc(B), Dⱼ ≠ Dᵢ, satisfies Dⱼ ⊆ D }`

is a join-semilattice `(Cᵢ, ⊆, ∪)` with bottom `Dᵢ`. The join is *literal*
chronicle-set union: for `D, D′ ∈ Cᵢ`, `D ∨ D′ = D ∪ D′ ∈ Cᵢ`. The
positive/daimon skeleton is invariant within a cone (Daimon Lock Lemma).

## Proof (pointer)

See [`.../LUDICS_OQ_JSL_PROOF.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_OQ_JSL_PROOF.md)
§§5–6 for the refutation of the original whole-of-Inc(B) JSL claim and the
construction of the per-cone JSL; and
[`.../LUDICS_ORDER_RELATION_DEFINITION.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_ORDER_RELATION_DEFINITION.md)
for Phase 2f Reading A: the order is literal set inclusion on `Design.loci[]`
and the join is set-union (no `⊥⊥`-closure required inside a cone, because
within a cone the skeleton is locked).

## Cross-check notes

The original C1 claim (Round 1) attributed JSL structure to the whole of
`Inc(B)` under `∨_⊥⊥`; this is refuted by the Cone Decomposition Proposition.
Round 2 confirmed (with caveat) that the *components* — inclusion poset,
incarnation as minimum — are in Fouqueré–Quatrini 2013, but the *per-cone*
JSL specialisation is substrate-original. The proof does not require any
property of `⊥⊥`-closure inside the cone; it follows from the Daimon Lock
Lemma plus closure of `B` under inclusion of sub-designs that retain useful
chronicles.

## What this rules out (for the implementation)

- Any code path that *joins designs across cones by set-union*. Set-union of
  two designs from different cones produces a set with two distinct
  incarnations, which is not a valid Design in the substrate.
- Any storage representation that flattens cones (e.g. a single "behaviour
  view" listing all designs without cone partitioning).
- Any sprint that depends on a single greatest element of `Inc(B)`. There
  isn't one in general; the antichain (T002) prevents this.
