# C014 discharge 3 / D3 — pseudofunctor ⟺ monodromy-free, and the iso-closure decision

- **Date:** 2026-06-08
- **Direction:** 4 — Distributed semantics, sub-program A (coherence). **D3 of the discharge-3 dev-spec** ([`DEV_SPEC-c014-discharge3-plexus-coherence-pentagon-2026-06-07.md`](DEV_SPEC-c014-discharge3-plexus-coherence-pentagon-2026-06-07.md) §3.4, §7).
- **Status:** **DONE (corroborated).** The biconditional is proved and the dev-spec §7 open is **resolved**: 𝓟° is defined by **invertible** round-trip 2-cells (claim-closed *up to ECC iso*), strictly larger than identity-closure. Corroborated by the green suite **"D3 — pseudofunctor ⟺ monodromy-free (C014 discharge 3)"** in [`tests/ecc.test.ts`](../tests/ecc.test.ts) (8/8; full file 116/116).
- **Builds on:** [D1](C014-D1-plexus-bicategory-data-2026-06-08.md) (bicategory data), [D2](C014-D2-plexus-coherence-pentagon-2026-06-08.md) (`γ` identity on the total part / undefined on drops). **Feeds:** D4 (faithfulness boundary), D5 (promotion), and a **refinement back onto the probe** (B2b). Tracks [C014](03_CONJECTURES/C014-plexus-transport-pseudofunctor.md) / [Q-042](01_OPEN_QUESTIONS_REGISTRY.md#q-042).

---

## 0. The theorem

> **C014-T (Plexus coherence, D3 half).** Transport `(·)_∗` restricted to a region of 𝓟
> is a **pseudofunctor** (every comparison 2-cell `γ` present and invertible) **iff** the
> region is **monodromy-free in the iso sense** — every directed cycle's round-trip
> 2-cell `η` is **invertible** (the claim returns to itself *up to ECC iso*). 𝓟° is the
> **largest** such sub-bicategory; off it, one-hop is the correct default.

---

## 1. The round-trip 2-cell η and its four fates

A directed cycle of transport functors `W = F_n ∘ ⋯ ∘ F_1 : A → A` carries a **round-trip
2-cell** `η : id_A ⇒ W`, with component at a source claim `c` an arrow `η_c : c → W(c)`.
By the claimMap composite walked around the cycle (exactly what
[`scripts/plexus-topology-probe.ts holonomy`](../scripts/plexus-topology-probe.ts) computes),
`η_c` has one of four fates:

| Fate | Condition | `η_c` | invertible? |
|---|---|---|---|
| **closed** | `W(c) = c` | `id_c` | ✅ (identity) |
| **drift-iso** | `W(c) = c' ≠ c`, `c ≅ c'` in the ECC | iso arrow `c → c'` | ✅ |
| **drift-noniso** | `W(c) = c' ≠ c`, not inter-derivable | arrow `c → c'`, no inverse | ❌ |
| **dropped** | `W(c)` undefined (partial functor) | missing | ❌ (absent) |

`η_c` is invertible **iff** the fate is `closed` or `drift-iso`. This is the predicate
`etaInvertible` in the suite, with the iso check `isIsoVia(fwd, back)` a *real* ECC
round-trip test (`compose(back, fwd) ≈ id` and `compose(fwd, back) ≈ id`).

## 2. The link to γ (from D2)

D2 established: the comparison 2-cell `γ` is the **identity on the total part** and
**undefined on a drop**. Reading that around a cycle:

- a **dropped** claim ⟹ a **missing** `γ` component (no claim to witness) ⟹ `γ` not total;
- a **drift-iso** claim lifts to an **invertible** `γ` component (the iso witnesses the
  comparison);
- a **drift-noniso** claim gives a **non-invertible** `γ` component;
- a **closed** claim gives the identity `γ` (invertible).

So "every `γ` present and invertible" (pseudofunctor) **≡** "every `η_c` invertible"
(monodromy-free, iso sense), component by component. This is `gammaOk = etaInvertible`
in the suite — the bridge that makes the biconditional definitional once η's fates are
fixed.

## 3. The biconditional

> `isPseudofunctor(region) ≡ isMonodromyFreeIso(region)`.

**(⇐)** On a monodromy-free region every `η_c` is invertible ⟹ every `γ` present and
invertible (D2 + §2) ⟹ pseudofunctor. *Corroboration:* a region `[closed, drift-iso,
closed]` is both monodromy-free and a pseudofunctor — green.

**(⇒)** Contrapositive, the **B2b identification**: off the monodromy-free region some
cycle has a `dropped` (missing `γ`) or `drift-noniso` (non-invertible `γ`) claim ⟹ not a
pseudofunctor. *Corroboration:* `[closed, dropped]` (B2b's live witness — the dropped
claim the probe found in real data) and `[closed, drift-noniso]` both fail both
predicates — green. The pointwise test `isPseudofunctor ≡ isMonodromyFreeIso` over all
four fates closes it.

**Maximality.** Adding any cycle with a non-invertible `η` to a pseudofunctor region
breaks pseudofunctoriality, so such a cycle lies in **no** pseudofunctor sub-bicategory ⟹
𝓟° (all invertible-η cycles) is the largest. *Corroboration:* extending `[closed]` by
`dropped` drops out of pseudofunctor — green.

## 4. The §7 decision — RESOLVED: 𝓟° is iso-closure, strictly larger than identity-closure

The dev-spec §7 flagged the one genuine open: is a `drift` *always* non-invertible? **No.**
A drift `c → c'` between **inter-derivable** claims (a two-way ECC iso) is an **invertible**
2-cell. Therefore:

> **Decision.** 𝓟° is defined by **invertible** `η` (claim-closed *up to ECC iso*), **not**
> strict identity `η`. Identity-closure ⊊ iso-closure.

*Why it matters (the substantive D3 content, not bookkeeping):* defining 𝓟° by strict
identity — i.e. B2b's `closed` outcome, which tests **claim-id equality** — would **wrongly
exclude** a perfectly coherent region: a cycle that drifts a claim to an inter-derivable
synonym is a pseudofunctor (transport composes soundly there) yet is *not* identity-closed.
*Corroboration:* the suite's `§7` block exhibits a `drift-iso` that (a) is a genuine ECC
iso (`isIsoVia` true), (b) lies in 𝓟° under the iso definition, but (c) is marked
`drifted` (excluded) by a strict-identity classifier — the over-strict error made
executable. A `drift-noniso` is correctly out under both definitions, confirming the
boundary is exactly **ECC inter-derivability**, not claim-id equality.

## 5. The refinement this forces back onto the probe (B2b)

[`scripts/plexus-topology-probe.ts`](../scripts/plexus-topology-probe.ts) currently
classifies a round-trip as `closed` / `drifted` / `dropped` by **claim-id equality**
(`landing === start`). Under D3 that boundary is too strict: a `drifted` landing on an
**inter-derivable** claim is still inside 𝓟°. 

> **Action item for B2b (✅ APPLIED 2026-06-08, "H2"):** the `holonomy` classifier in
> [`scripts/plexus-topology-probe.ts`](../scripts/plexus-topology-probe.ts) now refines the
> `closed` bucket to "returns to an **ECC-inter-derivable** claim" via a two-way
> derivation-reachability oracle (`loadDerivationReachability`: `ArgumentPremise` +
> `Argument.(conclusionClaimId ?? claimId)` ⇒ `premise → conclusion` edges, two-way
> reachability), splitting `drifted` into **`drift-iso`** (counted *inside* 𝓟°, not an
> obstruction) and **`drift-noniso`** (genuine obstruction). The `dropped` witness is
> unaffected. Corroborated on live-seeded data by the new `drift` subcommand (a 2-room
> cycle drifting `p → q → p'` with `p ≅ p'` inter-derivable): the run reports
> `drift-iso=1, in 𝓟°`, and the verdict notes *"strict claim-id closure would have
> mis-flagged this as an obstruction."* The B2b *headline* is unchanged (the live
> obstruction was a `dropped`, still out); only the `drifted` bucket gained precision.

This keeps the discipline of the programme: a theorem (D3) sharpens an empirical
instrument (the probe) rather than the reverse.

> **Instrument-fidelity caveat (cross-check clarification 1, 2026-06-08).** The probe's
> `interDerivable = reach(r,a,b) ∧ reach(r,b,a)` is two-way *premise→conclusion
> reachability* at the **claim level** and **ignores assumptions**, whereas the symbolic
> 𝓟° predicate `isIsoVia` requires the round-trip to compose to an **assumption-free**
> identity in `ECC/≈`. So the probe's `drift-iso` bucket is a **necessary-but-not-sufficient**
> proxy: it can *over-count* 𝓟° when the two-way derivations carry net assumptions. **T010(2)
> is unaffected** — it is defined and tested with the strict `isIsoVia`; this rides alongside
> the D4 "probe verdict is symbolic only" annotation. A future probe refinement would also
> check assumption cancellation before counting a landing as `drift-iso`.

## 6. What D3 establishes, and the hand-off to D4

**Established.** The coherence biconditional: transport is a pseudofunctor on 𝓟° = the
iso-monodromy-free region, and 𝓟° is maximal. Combined with D1 (bicategory data) and D2
(`γ`, pentagon, triangle), the **symbolic** half of C014-T is complete — modulo migration
to a theorem file (D5).

**Hand-off to D4.** D3 is a theorem about **symbolic** transport. D4 (the faithfulness
boundary) must state where the symbolic 𝓟° tracks the *live* `claimMapJson` + materialized
pipeline: when `apply/route.ts` drops premise rows the *materialized* functor is lax even
where the symbolic one is strict, so a symbolically-iso-closed cycle can be materially
lossy. C014-T is therefore stated over the symbolic layer and **gated on C014.a**
(structure-preserving materialization) for any live-data claim — the analogue of T008's
faithfulness lemma.

**Direction-5 note.** The biconditional is a pointwise equivalence of two decidable
predicates over the four-fate classifier; mechanizing it needs only D1's `ECC/≈` setoid
plus a decidable ECC-iso predicate (two-way `compose`-to-identity), both within the L1
finite-set carrier.
