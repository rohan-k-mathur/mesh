# C014 discharge 3 / D1 — the Plexus bicategory 𝓟: data and well-definedness

- **Date:** 2026-06-08
- **Direction:** 4 — Distributed semantics, sub-program A (coherence). **D1 of the discharge-3 dev-spec** ([`DEV_SPEC-c014-discharge3-plexus-coherence-pentagon-2026-06-07.md`](DEV_SPEC-c014-discharge3-plexus-coherence-pentagon-2026-06-07.md) §2, §5).
- **Status:** **DONE (corroborated).** The bicategory data is written down precisely; the three well-definedness lemmas **W1** (vertical composition associative + unital), **W2** (the interchange law), **W3** (naturality preserved under composition) are stated, proved, and corroborated by the green suite **"D1 — Plexus bicategory well-definedness (C014 discharge 3)"** in [`tests/ecc.test.ts`](../tests/ecc.test.ts) (6/6; full file 101/101).
- **Feeds:** D2 (pentagon/triangle), D3 (pseudofunctor⟺monodromy-free), and the Direction-5 Agda signature. Tracks [C014](03_CONJECTURES/C014-plexus-transport-pseudofunctor.md) / [Q-042](01_OPEN_QUESTIONS_REGISTRY.md#q-042).
- **Depends on:** L1 ([`tests/ecc.test.ts`](../tests/ecc.test.ts) "L1 — transport is a strict 1-functor"), L2 ([`tests/transportAggregator.test.ts`](../tests/transportAggregator.test.ts)), the symbolic surface [`lib/argumentation/ecc.ts`](../lib/argumentation/ecc.ts).

---

## 0. The quotient we work in (the L1 finding, systematized)

L1.2 found that `transport` is strict on derivation **IDs**: it never renames the
internal token, so `transport(F, id_c)` lands on an identity arrow on `F(c)` but keeps
the source token. More generally, `compose(g, f)` builds composite derivation IDs
`df∘dg` and **re-associates the ID string** under nested composition. So on the *nose*
the ECC is only a bicategory up to derivation-ID bookkeeping.

> **Convention (D1).** All of D1–D3 work in the **quotient ECC** `ECC/≈`, where two
> arrows are identified, `a ≈ a'`, iff they have the **same endpoints**, the **same
> derivation count**, and the **same per-derivation assumption sets** (as a multiset),
> **modulo a renaming of derivation IDs**. Equivalently: forget the *names* of
> derivations, keep their *assumption content* and *multiplicity*.

In `ECC/≈`, `compose` is **strictly** associative and unital (the ID re-association is
quotiented away), so the structure below is a genuine bicategory. The mechanized
(Agda) version realizes `≈` as a setoid/quotient on the derivation carrier; the L1
finite-set carrier carries over verbatim. The corroboration suite compares arrows by
the faithful signature

$$\mathrm{sig}(a) \;=\; \big(\, a.\mathrm{from},\; a.\mathrm{to},\; \textstyle\bigcup_d \mathrm{assumptions}(d),\; |a.\mathrm{derivs}|\,\big)$$

on **single-derivation witnesses**, where `sig` is a complete invariant for `≈`.

> **Test-coverage caveat (cross-check clarification 3, 2026-06-08).** `sig` collapses the
> per-derivation assumption *multiset* to a flat union $\bigcup_d \mathrm{assumptions}(d)$,
> so it is a **complete** `≈`-invariant only on **single-derivation** arrows — and all
> D1–D3 corroboration uses such witnesses. The underlying laws (W1–W3, pentagon) hold for
> **multi-derivation** 2-cells too: `compose`/`join` genuinely associate and interchange on
> derivation multisets, with the per-triple assumption unions invariant under
> reassociation, so the *proof* covers the multi-derivation case; only the *suite* is
> restricted to single-derivation witnesses. This is a coverage caveat, not a soundness
> gap. (A multi-derivation harness would key on the full per-derivation assumption multiset,
> not the flat union.)

---

## 1. The bicategory data 𝓟

### 1.1 0-cells — rooms

A 0-cell is a **room**, modeled as an Evidential Closed Category (ECC) over
[`lib/argumentation/ecc.ts`](../lib/argumentation/ecc.ts): objects are **claims**,
hom-sets are sets of **arrows** `Arrow = { from, to, derivs, assumptions }` (a finite
set of derivations, each carrying an assumption set), composition is `compose`, the
hom-set order/join is `join`, and `zero(a,b)` is the bottom (empty) arrow.

### 1.2 1-cells — transport functors

A 1-cell `F: A → B` is a **transport functor**: the object action is a **partial map
on claims** `F.mapClaim : Claim_A ⇀ Claim_B` (`Functor` in the surface), and the
arrow action is `transport(F, ·)`, which relabels endpoints through `mapClaim` and
**carries derivations verbatim** (L1.1). `transport(F, a)` is defined iff both
endpoints of `a` have images.

- **1-composition** `G ∘ F`: partial-map composition with null propagation on objects
  (A1, associative — [`tests/ecc.test.ts`](../tests/ecc.test.ts) "A1"); on arrows
  `transport(G∘F, ·) = transport(G, transport(F, ·))` on the common domain (L1.5).
- **Identity 1-cell** `id_A`: `mapClaim = id`, `transport(id_A, ·) = ` relabel-by-
  identity (`≈` the identity-on-arrows by L1.2).

By **L1**, `F ↦ transport(F, ·)` is a *strict* 1-functor on `ECC/≈` (L1.1–L1.5).

### 1.3 2-cells — claim-alignment witnesses

For parallel 1-cells `F, F' : A → B`, a **2-cell** `α : F ⇒ F'` is a family

$$\alpha \;=\; \big(\, \alpha_c : F(c) \to F'(c) \,\big)_{c \in \mathrm{Ob}(A)}$$

of **arrows in room `B`** (each `α_c` an ECC arrow from `F(c)` to `F'(c)`), **natural**
in source arrows: for every `A`-arrow `f : c → c'`,

$$F'(f) \circ \alpha_c \;\approx\; \alpha_{c'} \circ F(f) \qquad \text{(in } \mathrm{ECC}/\approx\text{)}.$$

Reading: `α_c` witnesses that the two `claimMapJson` alignments `F, F'` send `A.c` to
**inter-derivable** `B`-claims (C014 §Definition). Implemented in the suite as
`TwoCell = Map<sourceClaimId, Arrow>`.

### 1.4 Composition of 2-cells

- **Vertical** `β · α` (for `α : F⇒F'`, `β : F'⇒F''`): per claim
  `(β·α)_c = compose(β_c, α_c) : F(c) → F''(c)`.
- **Identity 2-cell** `id_F`: `(id_F)_c = id_{F(c)}` (the trivial arrow on `F(c)`).
- **Left whiskering** `G ∗ α` (for `α : F⇒F'`, `G : B→C`): `(G∗α)_c = transport(G, α_c)`.
- **Right whiskering** `δ ∗ F` (for `δ : G⇒G'`, `F : A→B`): `(δ∗F)_c = δ_{F(c)}`.
- **Horizontal** `δ ∗ α` (for `α : F⇒F' : A→B`, `δ : G⇒G' : B→C`), a 2-cell
  `G∘F ⇒ G'∘F'`:
  $$(δ ∗ α)_c \;=\; \delta_{F'(c)} \circ \mathrm{transport}(G, \alpha_c) \;\approx\; \mathrm{transport}(G', \alpha_c) \circ \delta_{F(c)},$$
  the two expressions equal by naturality of `δ`.

---

## 2. Well-definedness lemmas

### W1 — vertical composition is associative + unital

> **(W1)** In `ECC/≈`: `(γ·β)·α ≈ γ·(β·α)`, and `id_{F'}·α ≈ α ≈ α·id_F`.

*Proof.* Per claim, both are statements about `compose`. Associativity:
`compose(compose(γ_c, β_c), α_c)` and `compose(γ_c, compose(β_c, α_c))` differ only by
re-association of the composite derivation-ID strings, which `≈` quotients; endpoints
and the accumulated assumption union are identical. Unit: `compose(id_{F'(c)}, α_c)`
and `compose(α_c, id_{F(c)})` add an empty assumption set and an identity token, so
both `≈ α_c` (this is exactly the L1.2 "identity up to derivation relabeling"). ∎

*Corroboration:* `W1.1` (associativity, endpoints `b0→b3`, assumptions `{λα,λβ,λγ}`)
and `W1.2` (both unit laws) — green.

### W2 — the interchange law (the genuinely 2-categorical check)

> **(W2)** For vertically composable `α : F⇒F'`, `α' : F'⇒F''` (over `A→B`) and
> `δ : G⇒G'`, `δ' : G'⇒G''` (over `B→C`):
> $$(\delta' · \delta) ∗ (\alpha' · \alpha) \;\approx\; (\delta' ∗ \alpha') · (\delta ∗ \alpha).$$

*Proof.* Fix a source claim `c`. Both sides are arrows `G(F(c)) → G''(F''(c))`. Write
`a = α_c`, `a' = α'_c` (so `(α'·α)_c = a'∘a`), and `d_b = δ_b`, `d'_b = δ'_b`.
Using functoriality of `transport(G, ·)` (L1.3: `G(a'∘a) ≈ G(a')∘G(a)`) and naturality
of `δ, δ'` to slide the `δ`-components past the `G`-images, the left side expands to

$$ (d'_{F''(c)} ∘ d_{F''(c)}) ∘ G(a' ∘ a) \;\approx\; d'_{F''(c)} ∘ d_{F''(c)} ∘ G(a') ∘ G(a), $$

and the right side (vertical composite of the two horizontal composites) expands to

$$ \big(d'_{F''(c)} ∘ G'(a')\big) ∘ \big(d_{F'(c)} ∘ G(a)\big). $$

Naturality of `δ` at the arrow `a' : F'(c) → F''(c)` gives `d_{F''(c)} ∘ G(a') ≈ G'(a') ∘ d_{F'(c)}`,
which rewrites the left expansion into the right. All steps are equalities in `ECC/≈`
(L1.3 + naturality), so the two sides agree. ∎

*Corroboration:* `W2` — both sides `g_b0 → gpp_b2`, assumptions `{λα,λαp,λδ,λδp}`, one
derivation — green. This is the one law that genuinely uses the 2-dimensional
structure (the others are 1-categorical per claim); it passing is the substantive D1
result.

### W3 — naturality is preserved under composition

> **(W3)** If `α : F⇒F'` and `β : F'⇒F''` are 2-cells (each natural), then `β·α` is
> natural; and for any `G : B→C`, the whisker `G∗α` is natural.

*Proof.* Vertical: at `f : c → c'`,
`F''(f) ∘ (β·α)_c = F''(f) ∘ β_c ∘ α_c ≈ β_{c'} ∘ F'(f) ∘ α_c ≈ β_{c'} ∘ α_{c'} ∘ F(f) = (β·α)_{c'} ∘ F(f)`,
using naturality of `β` then of `α`. Whisker: at `f`,
`(G∘F')(f) ∘ (G∗α)_c = G(F'(f)) ∘ G(α_c) ≈ G(F'(f) ∘ α_c) ≈ G(α_{c'} ∘ F(f)) ≈ (G∗α)_{c'} ∘ (G∘F)(f)`,
using `transport(G, ·)` functoriality (L1.3, L1.5) and naturality of `α`. ∎

*Corroboration:* `W3.0` (the witness `α` is natural at `f`), `W3.1` (vertical comp
preserves it), `W3.2` (whiskering preserves it) — green.

---

## 3. What D1 establishes, and the hand-off to D2

**Established.** `𝓟 = (rooms, transport functors, claim-alignment 2-cells)` with the
compositions of §1.4 is well-defined data in `ECC/≈`: vertical composition is a
category on each hom-category (W1), the two compositions interchange (W2), and
2-cells are closed under the compositions (W3). Together with the strict 1-functor
structure (L1), this is exactly the data a bicategory and a lax functor into it
require — **minus** the coherence 2-cells `γ` and their pentagon/triangle, which are
**D2**.

**Hand-off to D2.** D2 defines the comparison 2-cells `γ_{G,F} : G_*∘F_* ⇒ (G∘F)_*`
(via the whiskering of §1.4) and discharges the pentagon/triangle. By L1's strictness,
`γ` is expected to be the **identity on the total part** (claims with images under both
composites), so the coherence diagrams should reduce to *partial-domain bookkeeping*
rather than calculation (dev-spec §3.2). W2 is the lemma that makes that reduction
legal: it is what lets the `γ`'s be slid around the pentagon without reordering the
underlying `compose`/`transport` operations.

**Direction-5 note.** The data above is the intended **Agda signature**: 0-/1-/2-cells
as the L1 finite-set carrier, `ECC/≈` as a setoid on derivations, and W1–W3 as the
`Category`/`Bicategory`-record fields. Mechanization is gated on D2–D3 landing on paper
(dev-spec §8).

**The §7 open carried forward.** The dev-spec §7 decision — define 𝓟° (the
pseudofunctor region, D3) by **invertible** round-trip 2-cells (claim-closed *up to ECC
iso*), not strict identity — is **not** needed for D1 (W1–W3 hold for all 2-cells,
invertible or not). It first bites in D3, and the probe's `closed`/`drifted` refinement
(claim-id equality → ECC inter-derivability) happens there.
