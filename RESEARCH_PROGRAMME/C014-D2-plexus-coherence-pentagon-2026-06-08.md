# C014 discharge 3 / D2 — the comparison 2-cells γ, pentagon and triangle

- **Date:** 2026-06-08
- **Direction:** 4 — Distributed semantics, sub-program A (coherence). **D2 of the discharge-3 dev-spec** ([`DEV_SPEC-c014-discharge3-plexus-coherence-pentagon-2026-06-07.md`](DEV_SPEC-c014-discharge3-plexus-coherence-pentagon-2026-06-07.md) §3.1–§3.3, §5).
- **Status:** **DONE (corroborated).** The comparison 2-cells `γ` are defined; the **pentagon** (associativity coherence) and **triangle** (unit coherence) are proved and corroborated by the green suite **"D2 — comparison 2-cells γ, pentagon + triangle (C014 discharge 3)"** in [`tests/ecc.test.ts`](../tests/ecc.test.ts) (7/7; full file 108/108).
- **Builds on:** [D1](C014-D1-plexus-bicategory-data-2026-06-08.md) (bicategory data + W1–W3, esp. the interchange law W2), L1 (transport is a strict 1-functor). **Feeds:** D3 (pseudofunctor⟺monodromy-free), D5 (promotion). Tracks [C014](03_CONJECTURES/C014-plexus-transport-pseudofunctor.md) / [Q-042](01_OPEN_QUESTIONS_REGISTRY.md#q-042).

---

## 0. The one-line result

> Because object-level composition is the **on-the-nose** partial-map composite (A1)
> and `transport` is **strict** (L1), the comparison 2-cell `γ_{G,F}` is the **identity
> arrow** on `(G∘F)(c)` wherever the claim survives, and **undefined** exactly where it
> drops. So the pentagon and triangle are not calculations — both sides collapse to the
> identity 2-cell on the **common total domain**, and coherence is **partial-domain
> bookkeeping**. The dev-spec §3.2 prediction holds.

This is *why* discharge 3 is tractable: strictness collapses the hard coherence
calculation. The only non-vacuous content is that the partial domains match on both
sides of each diagram — which they do because `composeFunctors` is associative (A1).

---

## 1. The comparison 2-cell γ

For composable 1-cells `F: A→B` and `G: B→C`, the **comparison 2-cell**

$$\gamma_{G,F} \;:\; G_\ast \circ F_\ast \;\Rightarrow\; (G\circ F)_\ast$$

is a 2-cell between parallel functors `A→C`. Its component at a source claim `c` is an
arrow in room `C`:

$$(\gamma_{G,F})_c \;:\; G(F(c)) \;\longrightarrow\; (G\circ F)(c).$$

But `(G∘F)(c) = G.mapClaim(F.mapClaim(c)) = G(F(c))` **definitionally** (this is exactly
what `composeFunctors` computes — D1 §1.2). So when `c` is in the **total part**
(both `F(c)` and `G(F(c))` defined), source and target of `(γ_{G,F})_c` coincide, and

$$(\gamma_{G,F})_c \;=\; \mathrm{id}_{(G\circ F)(c)} \quad\text{(the trivial arrow on that claim).}$$

When `c` **drops** (`F(c)` or `G(F(c))` undefined), there is no claim to witness and
`γ` has **no component** at `c`. Implemented as `gamma(G, F, srcClaims)` returning a
`Map<sourceClaim, Arrow>` keyed only on the total part.

**§3.1 corroboration (3 tests, green):**
- `γ_{G,F}` components are identity arrows on `(G∘F)(c)` (`isIdentityArrow`: equal
  endpoints, one trivial derivation, no assumptions);
- `γ` is undefined exactly where a claim drops (a partial `G` that drops `by` yields a
  `γ` with no `y` component);
- `dom(γ_{G,F})` equals the total part of `G∘F` (the strict composite agrees).

**Invertibility (the L1.5 consequence).** Since each present component is an identity
arrow, every `γ` is **invertible on its domain** (the identity is its own inverse) — i.e.
transport is not merely lax but **strict on the total part**, and *pseudo* exactly when
no claim drops. This is the bridge to D3 (𝓟° = no drift/drop), recorded here but used
there.

---

## 2. The pentagon (associativity coherence)

For `A →^F B →^G C →^H D`, the two reassociations of `H_∗(G_∗ F_∗) ⇒ (HGF)_∗` agree:

$$
\gamma_{H,\,G\circ F}\,\cdot\,(H_\ast \ast \gamma_{G,F})
\;\;=\;\;
\gamma_{H\circ G,\,F}\,\cdot\,(\gamma_{H,G} \ast F_\ast).
$$

(Here `·` is vertical composition, `∗` whiskering — both from D1 §1.4.)

**Proof.** Restrict to the total part (claims `c` with `F(c)`, `G(F(c))`, `H(G(F(c)))`
all defined). On it:

- `(H_∗ ∗ γ_{G,F})_c = transport(H, id_{(G∘F)(c)}) ≈ id_{(H∘G∘F)(c)}` (L1.2: transport
  preserves identities up to deriv relabeling);
- `(γ_{H,GF})_c = id_{(H∘G∘F)(c)}`;
- so the **LHS** is `compose(id, id) ≈ id_{(H∘G∘F)(c)}`.
- `(γ_{H,G} ∗ F_∗)_c = (γ_{H,G})_{F(c)} = id_{(H∘G)(F(c))} = id_{(H∘G∘F)(c)}`;
- `(γ_{HG,F})_c = id_{((H∘G)∘F)(c)} = id_{(H∘G∘F)(c)}`;
- so the **RHS** is `compose(id, id) ≈ id_{(H∘G∘F)(c)}`.

Both sides are the identity 2-cell on `(H∘G∘F)_∗` over the total part. The total parts
coincide because `composeFunctors` is associative (A1): `H∘(G∘F)` and `(H∘G)∘F` have the
same `mapClaim` (`null` on the same claims). Hence LHS = RHS. ∎

The only place the 2-dimensional structure is *used* is implicit: the vertical
composites and whiskerings are the D1 operations, and **W2 (interchange)** is what
guarantees the two ways of assembling them agree — without it, the `compose`/`transport`
operations underlying the `γ`'s could not be reordered. Here every component is the
identity so the reorder is trivial, but the *legality* of the manipulation is W2.

**§3.2 corroboration (2 tests, green):**
- the pentagon equality on a fully-total `{x,y}` fixture (both sides collapse to the
  identity 2-cell on `(H∘G∘F)_∗`, components `dx, dy`);
- **partial-domain robustness:** an `H` that drops `cy` prunes `y` **identically** on
  both paths (`sig2(lhs) === sig2(rhs)`, both keyed `["x"]`) — the bookkeeping content
  of the theorem, made a regression test.

---

## 3. The triangle (unit coherence)

With `id_A` the identity transport functor (`mapClaim = id`, `transport = ` relabel-by-
identity), the unit comparisons are isomorphisms:

$$\gamma_{F,\,\mathrm{id}_A} \;:\; F_\ast \circ (\mathrm{id}_A)_\ast \Rightarrow (F\circ \mathrm{id}_A)_\ast,
\qquad
\gamma_{\mathrm{id}_B,\,F} \;:\; (\mathrm{id}_B)_\ast \circ F_\ast \Rightarrow (\mathrm{id}_B\circ F)_\ast.$$

Since `F∘id_A = F = id_B∘F` on objects, each component is `id_{F(c)}` on the total part.
**Proof:** direct from §1 (γ is identity on the total part) with one factor the identity
functor; reduces to L1.2 per claim. ∎

**§3.3 corroboration (2 tests, green):** both `γ_{F, id_A}` and `γ_{id_B, F}` are
identity arrows on `F(c)` over `{x,y}` (components `bx, by`).

---

## 4. What D2 establishes, and the hand-off to D3

**Established.** `𝓟` is a bicategory and transport `(·)_∗` is a **lax functor** into it
whose comparison 2-cells `γ` are **identity on the total part** and **undefined on drops**;
the pentagon and triangle hold, reduced (as predicted) to partial-domain bookkeeping
legalized by W2. Equivalently: **transport is strict on the total part and lax only
through partiality** — there is no coherence obstruction *within* the total part.

**Hand-off to D3.** D2 showed every `γ` is invertible *on its domain* (identity ⇒
invertible). D3's job is the biconditional: transport is a **pseudofunctor** (every `γ`
total, i.e. no missing components) **iff** the region is **monodromy-free** (no cycle
drifts or drops a claim). D2 supplies the (⇐) direction's engine (γ identity on the
total part); D3 supplies (⇒) via the B2b identification (`dropped`/`drifted` ⟹ a missing
or non-invertible component).

**The §7 open enters at D3, not here.** D2's `γ` is literally the identity on the total
part, so its invertibility is unconditional and the iso-vs-identity question does **not**
arise. It first bites in D3, where 𝓟° must be defined by **invertible** round-trip
2-cells (claim-closed *up to ECC iso*) to handle a drift between inter-derivable claims —
and where the probe's `closed`/`drifted` boundary is refined from claim-id equality to
ECC inter-derivability (dev-spec §7).

**Direction-5 note.** The pentagon/triangle proofs are `id`-collapse arguments over a
decidable total-domain predicate — straightforward to mechanize once D1's `ECC/≈` setoid
and the `Bicategory`/`LaxFunctor` records are in place (gated on D1–D3 on paper).
