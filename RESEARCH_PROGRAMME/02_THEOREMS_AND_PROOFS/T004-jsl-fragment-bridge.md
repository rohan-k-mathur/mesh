# T004 — JSL-fragment interface to the Ambler bridge

> Naming note (2026-05-29). Earlier drafts called this entry "the
> JSL-fragment of the Ambler bridge." After the second-round cross-check,
> the result is more accurately named *the trivial interface*: every
> cone-specific hypothesis (finitely-generated `B`, `Dᵢ ∈ Inc(B)`, cone
> structure) is **inert** in the proof and is used only to invoke T001.
> The substantive content of the Ambler bridge — cartesian closure,
> confidence grading, the erasure square — lives entirely in C001b. We
> keep the name "bridge-fragment" in metadata because it is the citable
> handle from C001/C001a/C001b; the *content* is the universal property
> of `𝟐` in `JSL_⊥`.

- **status:** established
- **closes:** C001a; partially-closes Q-001 (the JSL-fragment half)
- **depends-on:** T001 (per-cone JSL, with the equality convention added 2026-05-29 and audited the same day)
- **proved-by:** drafted 2026-05-28; revised 2026-05-29 in response to second-reader critique (see Cross-check notes)
- **cross-checked-by:** 2026-05-29 review thread — second reader delivered three substantive critiques (the `≈ᴰ` mislocation triangle, the Mac Lane CWM ch. IV miscitation, and the idempotence-vs-bottom-preservation conflation), each of which forced a structural revision. The present entry is the post-revision form; the second reader signed off on the revised statement and proof. The audit of the load-bearing dependency T001 was executed and recorded the same day.
- **cross-check-date:** 2026-05-29
- **last-reviewed:** 2026-05-29
- **source-of-proof:** this file
- **corroborating-mechanisation:** [`../mechanisation/agda/C001/C001a.agda`](../mechanisation/agda/C001/C001a.agda) (Agda 2.8.0; evidence-only — see §Corroborating mechanisation for the relationship to the human proof)
- **build-instructions:** [`../mechanisation/agda/C001/README.md`](../mechanisation/agda/C001/README.md)

## Statement

**Theorem (universal property of `𝟐` in `JSL_⊥`).** Let `𝟐 = \{⊥, *\}`
be the free bounded join-semilattice on one generator (the two-element
bounded JSL, `⊥ ⊔ x = x`, `* ⊔ x = *`, bottom `⊥`). For every bounded
JSL `L`, the evaluation-at-`*` map

> `ev_* : Hom_{JSL_⊥}(𝟐, L) → |L|`,    `h ↦ h(*)`

is a **strict bijection**, natural in `L`, with inverse

> `inv : |L| → Hom_{JSL_⊥}(𝟐, L)`,    `ℓ ↦ ⟨⊥ ↦ ⊥_L,  * ↦ ℓ⟩`.

Both triangles hold on the nose. (Pure universal algebra: the existence
and universal property of free algebras in an equational variety —
Birkhoff 1935; see Burris–Sankappanavar 1981 §II.10 — applied to the
variety `JSL_⊥` and the one-element generating set `\{*\}`.)

**Corollary (the cone instance, named "the bridge-fragment" elsewhere).**
Let `B` be a behaviour in the finitely-generated regime,
`Dᵢ ∈ Inc(B)`, and `Art(Cᵢ) = (Cᵢ, ⊆, ∪)` the per-cone bounded JSL
with bottom `Dᵢ` (T001, strict-set view; see T001 §Equality convention).
Specialising the Theorem at `L = Art(Cᵢ)` yields a strict natural
bijection

> `Hom_{JSL_⊥}(𝟐, Art(Cᵢ)) ≅ Cᵢ`

with `inv(c) = ⟨⊥ ↦ Dᵢ, * ↦ c⟩`. No further verification is required.

There is no residual `≈ᴰ` caveat at the level of T004: the entire
`≈ᴰ`-content has been factored into T001 (the JSL axioms on
representatives), so by the time we have `Art(Cᵢ)` as a bounded JSL the
Corollary is immediate.

Every cone-specific hypothesis (finite generation of `B`, the choice of
`Dᵢ`, the cone structure) is **inert** in the proof; they are all
consumed by the single application of T001 in Lemma 2. This is the
sense in which T004 is a "trivial interface": it is not a bridge in any
cone-specific way, only a citable specialisation of a universal property.

## Proof (human-checked)

**Lemma 1 (free bounded JSL on one generator, universal algebra).**
`JSL_⊥` (bounded join-semilattices and bottom-preserving join
morphisms) is an equational variety. By Birkhoff's free-algebra
theorem (Birkhoff 1935; standard textbook reference:
Burris–Sankappanavar 1981, *A Course in Universal Algebra*, §II.10
Theorem 10.10), the free `JSL_⊥`-algebra on any set `X` exists; for
`X = \{*\}` (one generator) it is `𝟐 = \{⊥, *\}`. The universal property
is exactly: for every bounded JSL `L`, `Hom_{JSL_⊥}(𝟐, L) ≅ |L|`
naturally in `L`, by `h ↦ h(*)`, with inverse `ℓ ↦ ⟨⊥ ↦ ⊥_L, * ↦ ℓ⟩`.
This is the Theorem above. □

**Lemma 2 (`Art(Cᵢ)` is a bounded JSL).** By T001, in the strict-set
view of `Cᵢ`. □

**Corollary (the cone instance).** Apply Lemma 1 at `L = Art(Cᵢ)`
(Lemma 2). The bijection is `ev_* : h ↦ h(*)`; the inverse is
`inv(c) = ⟨⊥ ↦ ⊥_{Art(Cᵢ)}, * ↦ c⟩ = ⟨⊥ ↦ Dᵢ, * ↦ c⟩` (T001
identifies the bottom as `Dᵢ`). Both triangles are immediate from
Lemma 1. □

**Naturality (in the JSL argument).** For any bounded-JSL morphism
`f : L → L'`, the square
`ev_* ∘ Hom_{JSL_⊥}(𝟐, f) = f ∘ ev_*`
commutes pointwise: both sides send `h` to `f(h(*))`. This is
naturality in the *JSL variable*; it requires no notion of cone
morphism and holds automatically. □

That is the entire proof. The substrate-specific work all lives in
T001; T004 is a corollary of Birkhoff's free-algebra theorem applied to
`JSL_⊥` at one generator.

### Why the proof is so short

An earlier draft of T004 carried a four-case verification that `inv(c)`
preserves joins. That verification is redundant under the present
framing, and was the source of the `≈ᴰ`-caveat contradictions in that
draft. The redundancy: showing
`inv(c)(x ⊔g y) = inv(c)(x) ⊔ inv(c)(y)` for `x, y ∈ \{⊥, *\}` reduces
to two non-trivial identities in `Art(Cᵢ)` — idempotence `c ⊔ c = c`
(the `(*, *)` case) and `Dᵢ`-absorption `Dᵢ ⊔ c = c ⊔ Dᵢ = c` (the
`(⊥, *)` and `(*, ⊥)` cases, using that `Dᵢ` is the bottom by T001).
Neither identity is *bottom-preservation* in any non-trivial sense:
bottom-preservation of `inv(c)` itself, `inv(c)(⊥) = ⊥_{Art(Cᵢ)}`, is
true by definition of `inv` and needs no verification. What the four
cases really re-derive is the JSL equational theory at `Art(Cᵢ)`,
which is precisely what T001 — under its 2026-05-29 equality
convention — establishes once and for all on the quotient. There is no
work left to do at T004.

## Corroborating mechanisation

[`../mechanisation/agda/C001/C001a.agda`](../mechanisation/agda/C001/C001a.agda)
type-checks (Agda 2.8.0, agda-stdlib v2.0) a *representative-world*
toy: cone elements are `List Move`, and `_≈ᴰ_` is the explicit kernel
"same underlying set" relation between representatives. The toy is
therefore **not a direct mechanisation of T004** (which is stated in
the quotient world); it is a mechanisation of the underlying
representative-level fact whose quotient-collapse is T004.

In particular:

- `fromHom` / `toHom` correspond to `ev_*` / `inv` *up to the quotient*.
- `from-to : ∀ c → fromHom (toHom c) ≡ c` is `refl` because at the `*`
  branch nothing is rearranged.
- `to-from h ⊥g = ≈ᴰ-sym (pres-bot h)`. The `≈ᴰ` step here is the
  representative-world residue of T001's idempotence: in the toy,
  `h(⊥g)` is only `≈ᴰ Dᵢ`, not propositionally `Dᵢ`. Under the T004
  quotient view this step *disappears* and the triangle is strict.
- The four `pres-⊔` cases for `toHom` discharge by
  `⊆ᴰ-++-collapse` + `⊆ᴰ-refl` + the cone witness `proj₂ c`. These
  cases are *not* part of the T004 proof; they are the representative-
  level witnesses that `inv(c)` is well-defined as a *representative*
  of a JSL-morphism, which is the representative-level analogue of
  Lemma 2.

So the mechanisation is best read as evidence for the
*representative-level* obligations that justify T001's equality
convention, not as a re-proof of T004. C001b will eventually need
either a quotient-aware Agda library (e.g. `Setoid`-internal JSLs from
`Relation.Binary.Bundles`) or a canonical-form representation of cone
elements; the present toy chooses neither and so cannot be promoted
beyond evidence.

## Cross-check notes

**Cross-check closed 2026-05-29.** The second reader's substantive
critiques were:

1. The original Statement, Proof, and Agda-summary sections held three
   mutually contradictory claims about whether `inv ∘ ev_*` was strict
   or held only up to `≈ᴰ`. The `≈ᴰ`-caveat was mis-located between
   the quotient and representative worlds.
   **Resolution.** All `≈ᴰ`-content factored into T001's 2026-05-29
   equality convention; T004 now states a strict bijection in the
   strict-set view. The Agda artefact is honestly described as
   evidence for the representative-level obligations, not as a
   mechanisation of T004.
2. Lemma 1 was cited to Mac Lane *CWM* ch. IV (general adjunction
   theory). The fact actually wanted is the existence of free algebras
   in an equational variety — Birkhoff 1935; standard textbook
   reference Burris–Sankappanavar 1981 §II.10 Theorem 10.10.
   **Resolution.** Citation corrected; Lemma 1 reformulated as the
   universal property of `𝟐` in `JSL_⊥`, with the cone instance
   demoted to a one-line Corollary.
3. The earlier draft's four-case `pres-⊔` verification was described as
   checking "idempotence, neutrality, commutativity" — imprecise. The
   identities actually re-derived are *idempotence* `c ⊔ c = c` and
   *`Dᵢ`-absorption* `Dᵢ ⊔ c = c ⊔ Dᵢ = c`. Bottom-preservation of
   `inv(c)` itself is true by definition of `inv` and is not what the
   four cases verify.
   **Resolution.** Re-labelled accurately in §Why the proof is so short.

The T001 audit (recorded at
[T001 §Audit (2026-05-29)](T001-oq-jsl-per-cone.md#audit-2026-05-29--representative-vs-quotient-equality))
was executed against the two source-of-proof documents end-to-end and
confirmed that the equality convention is a clarification, not an
extension. T004's load-bearing premise therefore holds.

The second reader independently re-checked the post-revision Theorem
and Corollary (universal property of `𝟐` in `JSL_⊥` + specialisation
at `Art(Cᵢ)` via T001), the Birkhoff citation, the bottom-preservation
relabelling, the audit conclusion, and the boundary between T004
(JSL-fragment interface, no bridge content) and C001b (the actual
bridge: cartesian closure, confidence grading, erasure square). No
residual concerns.

## What this rules out (for the implementation)

- Any code path that represents cone elements concretely (lists,
  multisets, serialised trees) **and** assumes propositional equality
  between cone-level operations without quotienting by `≈ᴰ` (or
  equivalently, without canonicalising representatives). The
  substrate's existing chronicle-set semantics already implies this;
  the warning is for any future refactor.
- Any "shortcut" that constructs `h : 𝟐 → Art(Cᵢ)` from a cone element
  without using the bottom `Dᵢ` as the image of `⊥`. The free
  adjunction unit forces `h(⊥) = ⊥_{Art(Cᵢ)} = Dᵢ`; other choices break
  `pres-⊥` and so do not produce a JSL-morphism.

## Open follow-up

- **T001 risk-surface audit — done (2026-05-29).** All cone-specific
  content of T004 was pushed into T001 via the 2026-05-29 equality
  convention; the audit recorded in [T001 §Audit](T001-oq-jsl-per-cone.md#audit-2026-05-29--representative-vs-quotient-equality)
  confirms the convention is a clarification, not an extension. T004's
  load-bearing premise therefore holds. The remaining (separate)
  implementation-level obligation — that concrete design
  representations be quotiented or canonicalised — is repeated in
  §What this rules out below and tracked at the implementation review
  layer.
- **C001b** (the Ambler-specific remainder: cartesian closure,
  confidence grading, erasure square) is now unblocked. T004 may be
  cited as the JSL-fragment interface. Note that T004 carries **no**
  bridge-specific content; the actual bridge work is all in C001b.
  Beware the C001b-relevant concern flagged in T001's audit closing
  paragraph ("thin cones" under Reading (A); see
  [LUDICS_ORDER_RELATION_DEFINITION.md §7.2](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_ORDER_RELATION_DEFINITION.md)).
- **Cone-variance naturality.** A clean statement requires a category
  `Cone(B)` of cones of `B` with cone-morphisms, plus a functor
  `Art : Cone(B) → JSL_⊥`. Substrate work, deferred; not load-bearing
  for C001b.
- **Strict mechanisation of T004.** Either upgrade
  [C001a.agda](../mechanisation/agda/C001/C001a.agda) to use a setoid-
  internal JSL bundle from agda-stdlib, or replace representatives with
  a canonical-form data structure for cone elements (sorted,
  deduplicated). Either route would let the mechanisation track the
  T004 statement directly rather than its representative-level shadow.