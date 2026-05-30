# C001a — JSL-fragment of the Ambler bridge: `Art(Cᵢ) ≅ Hom_{JSL}(𝟐, Art(Cᵢ))`

- **status:** closed by [T004](../02_THEOREMS_AND_PROOFS/T004-jsl-fragment-bridge.md) (2026-05-29; cross-check closed same day)
- **ring:** core
- **depends-on:** T001 (per-cone JSL), T002 (Inc(B) antichain)
- **parent:** [C001](C001-ambler-bridge-iso.md)
- **sibling:** [C001b](C001b-ambler-remainder.md)
- **linked-open-questions:** [Q-001](../01_OPEN_QUESTIONS_REGISTRY.md#q-001--is-the-ambler-bridge-artb--hom_a_a-b-a-faithful-isomorphism-or-only-a-structure-preserving-functor)
- **last-reviewed:** 2026-05-28

## Statement

For every cone `Cᵢ` of every behaviour `B` in the finitely-generated
regime, the per-cone JSL `Art(Cᵢ) = (Cᵢ, ⊆, ∪)` (T001) is in iso with
the JSL-hom set out of the free 1-generated JSL:

> `Art(Cᵢ) ≅ Hom_{JSL}(𝟐, Art(Cᵢ))`

where:

- `𝟐 = {⊥, *}` is the free JSL on one generator (the two-element JSL
  with `⊥ ⊔ x = x` and `* ⊔ x = *`),
- `Hom_{JSL}(–, –)` denotes JSL-homomorphisms (maps preserving `⊥` and
  `⊔`),
- the iso is **strict** in the quotient/strict-set view of `Cᵢ`
  (T001 §Equality convention); representative-level mechanisations carry
  a residual `≈ᴰ` setoid that disappears under the quotient.

The iso is the unit of the free/forgetful adjunction between `Set`
(or `Pointed Set`) and `JSL`, instantiated at `Cᵢ`. The maps are:

- `fromHom : Hom_{JSL}(𝟐, Art(Cᵢ)) → Cᵢ`,    `h ↦ h(*)`
- `toHom : Cᵢ → Hom_{JSL}(𝟐, Art(Cᵢ))`,        `c ↦ (⊥ ↦ Dᵢ, * ↦ c)`

with `fromHom ∘ toHom = id` and `toHom ∘ fromHom = id` both holding
strictly in the quotient view (T001 §Equality convention).

## Positive settlement

Two written human-checked proofs, cross-checked separately, of:

1. The two maps `fromHom` and `toHom` (or equivalent constructions);
2. The triangle equations `fromHom ∘ toHom ≡ id` and
   `toHom ∘ fromHom ≈ id`, with explicit treatment of the setoid `≈ᴰ`
   used on the codomain;
3. A statement clarifying that this iso is **not** specific to the
   Ambler signature — it is the standard free-1-generator JSL
   adjunction unit, applicable to *any* JSL.

Filed as [T004 — JSL-fragment of the Ambler bridge](../02_THEOREMS_AND_PROOFS/T004-jsl-fragment-bridge.md)
under [`../02_THEOREMS_AND_PROOFS/`](../02_THEOREMS_AND_PROOFS/) with
`closes: C001a` and `partially-closes: Q-001`. Status is provisional
until a second reader cross-checks.

## Negative settlement

A behaviour `B`, a cone `Cᵢ`, and a JSL-hom `h : 𝟐 → Art(Cᵢ)` such that
`toHom (fromHom h) ≉ h` (i.e., the two triangles fail even up to
`≈ᴰ`). This would mean either (a) the per-cone JSL structure (T001) is
mis-stated, or (b) `≈ᴰ` is the wrong setoid for the bridge. Either is
substrate-relevant.

## What this conjecture does *not* cover

- The confidence-erasure functor (deferred to C001b).
- The cartesian-closed and additive structure of `A_Γ` (Ambler 1996)
  beyond the JSL fragment (deferred to C001b).
- The bridge for multi-generator `A` (i.e., free JSL on `n` generators,
  `n > 1`); the toy uses `n = 1` because `Hom_{JSL}(𝟐, –) ≅ id` is the
  cleanest statement. A multi-generator version would track a tuple of
  cone elements but adds no new substrate insight.

## Mechanisation

A representative-level toy lives at
[`../mechanisation/agda/C001/C001a.agda`](../mechanisation/agda/C001/C001a.agda)
(2026-05-28; Agda 2.8.0 + agda-stdlib v2.0). It type-checks without
postulates or holes, but carries an explicit `≈ᴰ` setoid because cone
elements are represented as `List Move` rather than as quotient classes.
Under T001's equality convention (2026-05-29) the `≈ᴰ` content belongs
to T001, not to T004; the toy is therefore **evidence for the
representative-level obligations** that justify the quotient view, not a
direct mechanisation of T004. See
[T004 §Corroborating mechanisation](../02_THEOREMS_AND_PROOFS/T004-jsl-fragment-bridge.md#corroborating-mechanisation).

## Bibliography

- Ambler 1996, *A categorical approach to the semantics of
  argumentation*, MSCS 6(2):167–188 (the umbrella reference; C001a
  isolates the JSL fragment from Ambler's broader construction).
- Mac Lane, *Categories for the Working Mathematician*, ch. IV
  (free/forgetful adjunctions; the structural content of this
  conjecture).
- [C001 §Mechanisation strategy](C001-ambler-bridge-iso.md#mechanisation-strategy-agda-exploratory)
  for the findings F1/F2/F3 that motivated splitting C001.
