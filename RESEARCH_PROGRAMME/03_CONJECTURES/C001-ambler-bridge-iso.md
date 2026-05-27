# C001 — The Ambler bridge `Art(B) ≅ Hom_{A_Γ}(A, B)` is a faithful iso modulo the confidence-erasure functor

- **status:** open
- **ring:** core
- **depends-on:** T001 (per-cone JSL structure on B), T002 (antichain)
- **linked-open-questions:** Q-001, Q-010
- **last-reviewed:** 2026-05-27

## Statement

There exist functors `F: Ludics_fg → A_Γ` and `G: A_Γ → Ludics_fg` between a
finitely-generated fragment of the Ludics category and an Ambler-style
semilattice-enriched cartesian-closed category of arguments (Ambler 1996),
together with natural isomorphisms `F ∘ G ≅ Id` and `G ∘ F ≅ Id_{ker(erase)}`
where `erase: A_Γ → A_Γ^{erased}` is the confidence-erasure functor. In
particular, for every behaviour `B`, the per-cone JSL `Art(Cᵢ) = (Cᵢ, ⊆, ∪)`
is isomorphic (as a JSL) to a sub-hom-set of `Hom_{A_Γ}(A, B)` for an
appropriately chosen `A` derived from the cone's incarnation `Dᵢ`.

## Positive settlement

Two written human-checked proofs, cross-checked separately:

1. A construction of `F` and `G` with the unit/counit triangles verified.
2. A worked example on a non-trivial behaviour (≥ 3 cones, ≥ 2 distinct
   ramifications per cone) where the iso is exhibited concretely.

Filed as `T003-ambler-bridge.md` under
[`../02_THEOREMS_AND_PROOFS/`](../02_THEOREMS_AND_PROOFS/) with `closes:
Q-001`.

## Negative settlement

A counterexample of the following shape: a behaviour `B` with cones `C₁, C₂`
and a JSL morphism `φ: Art(C₁) → Art(C₂)` that has no image under any
candidate `F` into `Hom_{A_Γ}` morphisms. The counterexample must be
finite, presentable, and rule out *all* candidate functors `F` (not merely
the naive one).

## Bibliography

- Ambler 1996, *A categorical approach to the semantics of argumentation*,
  MSCS 6(2):167–188.
- Krause, Ambler, Elvang-Gøransson & Fox 1995, *A logic of argumentation for
  reasoning under uncertainty*.
- [`../../Development and Ideation Documents/ARCHITECTURE/Ludics Generative Substrate Documents/LUDICS_TRIADS_BRIDGE_AND_CLOSURE_JOIN.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_TRIADS_BRIDGE_AND_CLOSURE_JOIN.md)
- [`../../Development and Ideation Documents/ARCHITECTURE/Ludics Generative Substrate Documents/LUDICS_TRIADS_CLOSURE_AND_CONFIDENCE_ERASURE_FUNCTOR.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_TRIADS_CLOSURE_AND_CONFIDENCE_ERASURE_FUNCTOR.md)
- [`../../Development and Ideation Documents/ARCHITECTURE/Ludics Generative Substrate Documents/LITERATURE_REVIEW_ROUND_1.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LITERATURE_REVIEW_ROUND_1.md) §3 (C3)
- [`../../Development and Ideation Documents/ARCHITECTURE/Ludics Generative Substrate Documents/LITERATURE_REVIEW_ROUND_2.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LITERATURE_REVIEW_ROUND_2.md) §2.2 (R-C3)
