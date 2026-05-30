# C001b — Ambler-specific remainder of the bridge (cartesian-closed + confidence-graded)

- **status:** **SUPERSEDED 2026-05-29** by [C001b′](C001b-prime-ambler-remainder.md). Retained as historical record. The bridge target (per-cone JSL `Cᵢ`) was diagnosed wrong-level by the [Q-027 audit](../audits/q027-thin-cones-2026-05-29.md): cones in Reading A are too sparse to admit a surjective `ε` onto the Ambler hom-semilattice (Q3 aspirin worked example, both safe and compressed encodings). The audit surfaced the correct bridge target — `𝒫_fin(Inc(B))`, the free JSL on incarnations — at which `ε` is iso for trivial reasons (free extension of a generator-level bijection). C001b′ restates the conjecture at that target and recasts b₁/b₂/b₃ accordingly. The per-cone framing below is preserved because it was a faithful attempt at one substrate reading and remains useful context for why the level-mismatch resolution is the right one.
- **superseded-by:** [C001b′](C001b-prime-ambler-remainder.md)
- **status-original:** open (unblocked 2026-05-29 by [T004](../02_THEOREMS_AND_PROOFS/T004-jsl-fragment-bridge.md))
- **ring:** core
- **tier:** formal
- **depends-on:** [T001](../02_THEOREMS_AND_PROOFS/T001-oq-jsl-per-cone.md), [T002](../02_THEOREMS_AND_PROOFS/T002-design-set-antichain.md), [T004](../02_THEOREMS_AND_PROOFS/T004-jsl-fragment-bridge.md) (the JSL-fragment interface, cited as a lemma)
- **gated-by:** [Q-027](../01_OPEN_QUESTIONS_REGISTRY.md#q-027) (resolved-negative-with-redirect 2026-05-29)
- **parent:** [C001](C001-ambler-bridge-iso.md)
- **sibling:** [C001a](C001a-jsl-fragment-bridge.md) (closed by T004 2026-05-29)
- **linked-open-questions:** [Q-001](../01_OPEN_QUESTIONS_REGISTRY.md#q-001) (Ambler bridge), [Q-010](../01_OPEN_QUESTIONS_REGISTRY.md#q-010) (Singh maintenance-commitment representability), [Q-027](../01_OPEN_QUESTIONS_REGISTRY.md#q-027) (thin-cones; resolved)
- **last-reviewed:** 2026-05-29

> **Reframing note (2026-05-29).** This rewrite absorbs the substrate framing
> already done in
> [`.../LUDICS_TRIADS_CLOSURE_AND_CONFIDENCE_ERASURE_FUNCTOR.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_TRIADS_CLOSURE_AND_CONFIDENCE_ERASURE_FUNCTOR.md)
> Part II. The previous stub treated Ambler 1996 as a black box; the substrate
> had already opened it. The rewrite commits to: (i) `erase = U` is the Kelly
> 1982 §1.2 underlying-ordinary-category functor `U : C_semi → C_plain`; (ii)
> the bridge iso is the counit `ε` of the free/forgetful adjunction `F ⊣ U`
> (Jansana–San Martín 2018 analogue); (iii) the C3 / C001b claim splits into
> three labelled sub-claims (b₁ `ε` surjective, b₂ `ε` injective, b₃ erasure
> square commutes), corresponding exactly to the three-case taxonomy of `ε` in
> the substrate doc §II.4; (iv) per-cone reframe applies — there is no global
> bridge, only per-cone bridges `Cᵢ ≅ U(C_semi(A, Bᵢ))`.

## Substrate context

The bridge sits inside this categorical infrastructure (notation per the
substrate doc; per-cone reframe per Phase 2e/2f):

- **`C_semi`** — the Ambler semilattice-enriched cartesian-closed category
  (Ambler 1996; Krause–Ambler–Elvang-Gøransson–Fox 1995): objects are
  argument types, hom-objects `C_semi(A, B) ∈ JSL` are join-semilattices
  of derivations under Ambler's evidence-combination `∨_A`, composition is
  bilinear, hom-bottoms `⊥_{A,B}` are the no-evidence derivations,
  Dempster–Shafer confidence weights are encoded in the semilattice
  position.
- **`C_plain`** — the Ludics-side plain (Set-enriched) CCC: same objects;
  hom-sets `C_plain(A, B) = Art(B_A) = (Inc(B_A), ≤_⊆, ∨_⊥⊥)` per cone
  per T001; composition is `∨_⊥⊥`-compatible design composition.
- **`U : C_semi → C_plain`** — the **confidence-erasure functor**, Kelly
  1982 §1.2 underlying-ordinary-category construction along the lax
  monoidal forgetful `JSL → Set`. On objects: identity. On hom-objects:
  `|C_semi(A, B)|`, forgetting JSL structure.
- **`F ⊣ U`** — left adjoint = free semilattice enrichment: at `(A, B)`,
  `F(C_plain)(A, B) := 𝓕(C_plain(A, B))` where `𝓕(S)` is the free
  join-semilattice on `S` (finite nonempty subsets ordered by reverse
  inclusion, with join `∪`).
- **Counit** `ε_{A,B} : 𝓕(Inc(B_A)) → C_semi(A, B)`, sending a formal
  finite join `⋁ᵢ |Dᵢ|` to the actual Ambler join `|D₁| ∨_A ⋯ ∨_A |D_k|`.
- **Unit** `η_{A,B} : Inc(B_A) → |C_semi(A, B)|`, sending an incarnation
  to its singleton-as-formal-join, then forgetting structure — i.e. the
  inclusion of incarnations into the Ambler hom-set as the
  minimum-confidence singletons.

T004 settles the **per-cone JSL fragment**: for any bounded `L ∈ JSL_⊥`,
`Hom_{JSL_⊥}(𝟐, L) ≅ |L|` strictly, with `𝟐` the free 1-generated JSL.
That isolates the elementary categorical content; it does **not** speak
to whether `C_semi(A, B)`'s Ambler-specific operators (cartesian closure,
confidence grading) factor through cones, which is what C001b asks.

## Statement (per-cone)

Fix a behaviour `B` and a cone `(Cᵢ, ⊆, ∪, Dᵢ)` per T001. Let `Bᵢ` be
the Ambler argument type whose Ludics-side incarnation poset is `Cᵢ`
(the *choice* of `Bᵢ` is part of the bridge data; the smallest
candidate is `Bᵢ := |Cᵢ| = Dᵢ`, but the bridge is non-trivial precisely
because `C_semi(A, Bᵢ)` carries more structure than `Cᵢ` does, even at
the underlying-set level).

C001b conjectures, in three labelled sub-claims:

**(b₁) Surjectivity of `ε`.** For every cone `Cᵢ` the counit
`ε_{A, Bᵢ} : 𝓕(Cᵢ) → C_semi(A, Bᵢ)` is surjective: every Ambler
derivation in `C_semi(A, Bᵢ)` is the Ambler join of finitely many
Ludics incarnations from `Cᵢ`.

> *Equivalently:* the cone `Cᵢ` is a **generating set** for the Ambler
> hom-semilattice `C_semi(A, Bᵢ)` under `∨_A`. This is the half of C001b
> that the substrate explicitly flagged as "the main open conjecture
> (0g-OQ1)".

**(b₂) Injectivity of `ε`.** For every cone `Cᵢ` the counit
`ε_{A, Bᵢ}` is injective: distinct formal joins of incarnations map to
distinct Ambler derivations. Equivalently, the Ambler hom-semilattice
adds *no* identifications among Ludics incarnations beyond those
already present in `(Cᵢ, ⊆, ∪)`.

> Conditional on b₁, b₂ promotes the bridge to a JSL **isomorphism**;
> without b₂ the bridge survives only as a poset correspondence (case
> (b) of the substrate's §II.4 trichotomy).

**(b₃) Erasure-square commutativity.** The square

```
       Art(Bᵢ)        ≅           U(C_semi(A, Bᵢ))
         │   (b₁ ∧ b₂)                  │
   Art(eraseᵢ) │                  U(C_semi(A, eraseᵢ)) │
         ▼                              ▼
       Art(erase Bᵢ)  ≅          U(C_semi(A, erase Bᵢ))
```

commutes, where the horizontal arrows are `ε^{-1}` from b₁ ∧ b₂ and
`eraseᵢ` is the cone-level instance of `U`. The substantive content of
b₃ is that `U` commutes with the bridge — i.e. that the bridge is a
**natural transformation** in the Ambler argument, not just a
point-wise iso.

**The combined C001b claim** is `b₁ ∧ b₂ ∧ b₃`.

## How Q-027 gates the statement

The statement above takes `⊆` as the Ludics-side carrier order (per T001
under Reading A). [Q-027](../01_OPEN_QUESTIONS_REGISTRY.md#q-027) asks
whether cones-under-`⊆` are thick enough to populate the Ambler hom-set
at all. If Q-027 closes positively (cones are thick enough), the
statement above is well-typed and b₁/b₂/b₃ are the right questions. If
Q-027 closes negatively (cones-under-`⊆` are provably too thin), the
C001b statement must be **re-issued** with the approximation order `⊑`
in place of `⊆`, and T001 reviewed for whether its JSL structure
transfers. **Until Q-027 resolves, b₁ is the wrong question** —
surjectivity onto an empty target is vacuous and uninformative.

The recommended attack order is therefore:

1. **Q-027 small-cone diagnostic.** Worked example, ≥ 3 cones, ≥ 2
   ramifications/cone; enumerate `Cᵢ` and the candidate Ambler image;
   check whether the image is contained in `ε(𝓕(Cᵢ))`.
2. **(If Q-027 positive)** Attack b₁ next: prove generation of the
   Ambler hom-semilattice from `Cᵢ`. Worked example again.
3. **(If b₁ holds)** Attack b₂: faithfulness. The natural obstruction
   is two distinct formal joins (e.g. `{|D₁|, |D₂|}` and `{|D₃|}`) that
   collapse to the same Ambler derivation; b₂ rules this out.
4. **(If b₁ ∧ b₂ hold)** Diagram-chase b₃ from the naturality of `U`
   and the construction of the bridge. The substrate doc §II.2–II.3
   already supplies the categorical machinery.

## Positive settlement

Two written human-checked proofs, cross-checked separately:

1. A proof of (b₁) and (b₂) (the bridge iso at each cone), conditional
   on Q-027 having selected the order. The proof must construct
   `ε^{-1}` explicitly on a worked example and argue that the
   construction extends uniformly across `C_semi`'s operator suite
   (cartesian product, exponential, semilattice join).
2. A diagram-chase proof of (b₃) (erasure-square commutativity),
   building on (b₁ ∧ b₂).

Filed as a theorem `T00N-ambler-remainder.md` under
[`../02_THEOREMS_AND_PROOFS/`](../02_THEOREMS_AND_PROOFS/) with
`closes: C001b` and `partially-closes: Q-001`. (Q-001 then closes
fully, since C001a + C001b together settle the umbrella C001.)

## Negative settlement

A counterexample of the following shape: a cone `Cᵢ`, an `A_Γ`-morphism
`φ ∈ C_semi(A, Bᵢ)` (typically one using a cartesian-closed operator or
a confidence-graded operator absent from the JSL fragment), and an
identification of *which* sub-claim breaks:

- **(b₁ fails)** `φ` has no preimage under `ε` — there is no finite set
  of incarnations whose Ambler join is `φ`. Falsifies (b₁) and a
  fortiori the combined C001b.
- **(b₂ fails)** Two distinct formal joins map to the same `φ`.
  Falsifies (b₂); C001b survives only at the poset level (substrate
  §II.4 case (b)).
- **(b₃ fails)** `(ε^{-1}, eraseᵢ)` and `(eraseᵢ, ε^{-1})` send the
  same `φ` to different `Art(erase Bᵢ)`-images. Falsifies (b₃) even
  with b₁ ∧ b₂ in hand; the bridge is point-wise iso but not natural.

The counterexample must isolate which operator of `C_semi` is
responsible (since the JSL fragment is already settled by T004), and
should be checkable on a finite presentation.

## Why this is mostly human-checked

The Ambler-specific structure is awkward to mechanise in a way that
adds value over a paper diagram chase: operators are few, equations are
diagrammatic, and the assistant's main contribution (managing many
small obligations) is less useful when the obligations are individually
non-trivial diagram commutations. A mechanisation attempt is *not*
ruled out, but should be scoped as a *separate* exploratory artefact
(e.g. in Coq with `coq-mathcomp` for diagram rewriting, or in
`agda-categories` with its setoid layer) rather than extending the
Agda T004 development, because the T004 stack's `_⊆ᴰ_` representation
is too thin for the additional operators (T004 finding F1, F2).

## What this conjecture does *not* cover

- The JSL fragment (closed by [T004](../02_THEOREMS_AND_PROOFS/T004-jsl-fragment-bridge.md); cited as a lemma here).
- The multi-agent extension of the bridge (Reading C, [Q-002](../01_OPEN_QUESTIONS_REGISTRY.md#q-002)).
- Cross-room transport ([Q-006](../01_OPEN_QUESTIONS_REGISTRY.md#q-006)).
- The choice of Ludics-side order (gated by [Q-027](../01_OPEN_QUESTIONS_REGISTRY.md#q-027); see §How Q-027 gates the statement).

## Bibliography

- Ambler 1996, *A categorical approach to the semantics of argumentation*, MSCS 6(2):167–188.
- Krause, Ambler, Elvang-Gøransson & Fox 1995, *A logic of argumentation for reasoning under uncertainty*, Computational Intelligence 11(1):113–131 — the confidence structure that `U` collapses.
- Kelly 1982 (TAC reprint 10, 2005), *Basic Concepts of Enriched Category Theory*, §1.2 — the underlying-ordinary-category 2-functor `(-)_0 : V-CAT → CAT`, instantiated here at `V = JSL`.
- Jansana & San Martín 2018, arXiv:1811.03698 — an analogue of the `F ⊣ U` adjunction between a semilattice-enriched and a weaker algebraic category.
- [`.../LUDICS_TRIADS_CLOSURE_AND_CONFIDENCE_ERASURE_FUNCTOR.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_TRIADS_CLOSURE_AND_CONFIDENCE_ERASURE_FUNCTOR.md) Part II — the substrate framing this rewrite absorbs (definition of `U`, `F ⊣ U`, the three-case `ε` taxonomy which is exactly the (b₁, b₂) decomposition).
- [`.../LUDICS_ORDER_RELATION_DEFINITION.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_ORDER_RELATION_DEFINITION.md) §7.2 — the thin-cones flag that Q-027 formalises.
- [`.../LUDICS_TRIADS_BRIDGE_AND_CLOSURE_JOIN.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_TRIADS_BRIDGE_AND_CLOSURE_JOIN.md) — the Triads bridge that Reading C uses; relevant to the multi-agent extension flagged in §What this conjecture does *not* cover.
- [C001 §Mechanisation strategy](C001-ambler-bridge-iso.md#mechanisation-strategy-agda-exploratory) finding F3 — which content of C001 belongs here vs C001a.
- [C001a](C001a-jsl-fragment-bridge.md) and [T004](../02_THEOREMS_AND_PROOFS/T004-jsl-fragment-bridge.md) — the closed prerequisite.
