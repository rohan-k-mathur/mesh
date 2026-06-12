# Dev spec — C014 discharge 3: the Plexus lax-functor coherence (pentagon) theorem

- **Date:** 2026-06-07
- **Direction:** 4 — Distributed semantics, sub-program A (coherence) — the genuine categorical content of [C014](03_CONJECTURES/C014-plexus-transport-pseudofunctor.md), the remaining discharge after L1 (strict-1-functor lemma) and L2 (band origin-dedupe) landed 2026-06-07.
- **Status:** **COMPLETE (2026-06-08).** Discharge 3 done (D1–D4 + H2); the theorem is filed as [T010](02_THEOREMS_AND_PROOFS/T010-plexus-coherence-pseudofunctor.md) (**established** — cross-checked / signed off 2026-06-08, three non-blocking clarifications addressed). D5 promotion done; production PRs may now cite T010 but are individually gated. _Original scope:_ the smallest sound proof of the coherence biconditional's hard half — *the sub-bicategory of Plexus on which transport is a **pseudofunctor** is exactly the claim-map-monodromy-free region.* Paper-first; mechanization (Direction 5) optional and gated on the paper.
- **Owner / tracking:** [Q-042](01_OPEN_QUESTIONS_REGISTRY.md#q-042) (the coherence question), [C014](03_CONJECTURES/C014-plexus-transport-pseudofunctor.md) (the biconditional this discharges).
- **Depends on:** the **L1 lemma** ([`tests/ecc.test.ts`](../tests/ecc.test.ts) suite "L1 — transport is a strict 1-functor") and the **L2 property test** ([`tests/transportAggregator.test.ts`](../tests/transportAggregator.test.ts) suite "L2 — band soundness needs origin dedupe"); the [A0 audit](audits/a0-onehop-contract-laxity-vs-policy-2026-06-07.md); the symbolic surface [`lib/argumentation/ecc.ts`](../lib/argumentation/ecc.ts) (`Functor`, `transport`, `compose`, `join`); session [07 §1, §3.2](10_IDEATION_SESSIONS/07-distributed-semantics-sheaf-cohomology-2026-06-07.md).

---

## 0. One-paragraph statement

L1 proved transport is a **strict 1-functor on the symbolic ECC layer** and L2 proved
the **scalar band is sound once it dedupes by ultimate origin**. What remains is the
2-dimensional fact that organizes them: that assembling rooms (0-cells), transport
functors (1-cells), and claim-alignment 2-cells into the bicategory **𝓟** satisfies
the coherence axioms (the **pentagon** for associativity of 1-cell composition and the
**triangle** for units), and that **transport is a pseudofunctor** — its comparison
2-cells $\gamma_{G,F}: G_*\circ F_* \Rightarrow (G\circ F)_*$ are **invertible** —
*exactly* on the sub-bicategory where no claim drifts or drops around any cycle. This
spec scopes that proof: define the bicategory data precisely, discharge the two
coherence diagrams, prove the pseudofunctor ⟺ monodromy-free equivalence, and pin the
faithful boundary (where the abstract result tracks the live `claimMapJson` data).

## 1. Goal and non-goals

**Goal.** A paper proof (citable, in [`02_THEOREMS_AND_PROOFS/`](02_THEOREMS_AND_PROOFS/)
when settled) of:

> **C014-T (Plexus coherence).** 𝓟 is a bicategory; transport `(·)_*` is a lax functor
> into it; and `(·)_*` restricts to a **pseudofunctor** on the full sub-bicategory
> 𝓟° ⊆ 𝓟 spanned by the rooms and transport functors whose every directed cycle is
> **claim-closed** (the round-trip comparison 2-cell `η` is invertible). On 𝓟°,
> multi-hop transport composes with invertible comparison 2-cells; off it, the
> one-hop contract is the correct conservative default.

**Non-goals (explicit, to prevent scope creep).**
- **No production code change.** This is a proof about the *symbolic* layer
  (`lib/argumentation/ecc.ts`) and the *abstract* band (L2's `reduceImportedByOrigin`).
  Shipping path-provenance / origin-dedupe to `transportAggregator` and
  structure-preserving materialization to `apply/route.ts` stay **gated** behind the
  settled theorem.
- **No quantitative cohomology.** C014-T certifies *qualitative* soundness only. The
  non-trivial $H^1(\mathbb{R})$ needs a per-edge transport weight the schema lacks
  ([Q-042 offshoot (b)](01_OPEN_QUESTIONS_REGISTRY.md#q-042)); out of scope here.
- **No materialization laxity proof.** C014.a (structure-preserving `apply` ⟹ strict
  materialized functor) is a *separate* engineering theorem on the DB pipeline; this
  spec is the symbolic/abstract coherence only. Materialization laxity is referenced
  as the one remaining source of non-invertible 2-cells, not discharged here.

## 2. The bicategory data 𝓟 (must be written down precisely first)

The single largest risk is hand-waving the 2-cells. Pin every cell:

| Cell | Object | Source of truth |
|---|---|---|
| **0-cells** | rooms = ECCs `(Ob = claims, Hom = arrows under `join`)` | [`lib/argumentation/ecc.ts`](../lib/argumentation/ecc.ts) `Arrow` |
| **1-cells** `F: A → B` | transport functor: partial claim map `mapClaim` + arrow action `transport(F, ·)` | `Functor`, `transport` |
| **1-cell composition** `G ∘ F` | partial-map composition with null propagation | A1 test `composeFunctors` (associative — proved) |
| **2-cells** `α: F ⇒ F'` | family `(α_c: F(c) → F'(c))_c` of room-`B` arrows, natural in source arrows | **C014 §Definition** — the new object |
| **vertical comp** `β·α` | per-claim `compose` of the witness arrows in `B` | `compose` |
| **horizontal comp** `α ∗ φ` | whiskering: transport a 2-cell through a functor | *to define (§3.1)* |
| **identity 2-cell** `id_F` | per-claim identity arrow `id_{F(c)}` | L1.2 (up to deriv relabeling) |

**Required well-definedness lemmas (small, mostly L1/L2 corollaries):**
- **(W1)** vertical composition is associative + unital — inherited from `compose`
  associativity (already an ECC test) applied per claim.
- **(W2)** the **interchange law** (horizontal ∘ vertical = vertical ∘ horizontal)
  holds — the one genuinely 2-categorical check; reduces to `compose`/`transport`
  commuting, which L1.3 (transport preserves composition) underwrites.
- **(W3)** 2-cells are natural: the square `F'(f) ∘ α_c = α_{c'} ∘ F(f)` holds for
  every source arrow `f` — this is the *definition's* side-condition; show it is
  preserved by vertical and horizontal composition.

## 3. Proof obligations (in dependency order)

### 3.1 Whiskering and the comparison 2-cells `γ`

Define horizontal composition / whiskering of a 2-cell through a transport functor
(`α ∗ F` and `G ∗ α`), then the **comparison 2-cell**
`γ_{G,F}: G_* ∘ F_* ⇒ (G∘F)_*`. Because `transport` is strict on derivations (L1.1)
and object composition is the on-the-nose partial-map composite (A1), the *expected*
result is `γ_{G,F} = identity` **wherever both endpoints have images** — i.e. transport
is not merely lax but **strict on the total part**, and the only lax/degenerate
components are at claims that **drop** (no image under `F` or `G∘F`). Make this precise:
`γ_{G,F}` is invertible at claim `c` iff `c` has an image under both `G_*∘F_*` and
`(G∘F)_*` (and they agree, which L1.5 gives).

### 3.2 The pentagon (associativity coherence)

For composable `A →^F B →^G C →^H D`, the two ways of reassociating
`H_*(G_* F_*)` ⇒ `(H G F)_*` via `γ` agree:

$$
\gamma_{H,GF}\circ(H_*\!\ast\gamma_{G,F}) \;=\; \gamma_{HG,F}\circ(\gamma_{H,G}\ast F_*).
$$

**Expected discharge:** since object composition is associative on the nose (A1's
associativity test) and `γ` is the identity on the total part (§3.1), both sides are
the identity 2-cell on the common total part and undefined on the common drop set —
so the pentagon is **trivially satisfied on the strict part**, and the content is
purely *bookkeeping of the partial domains*. The proof is a domain-tracking argument,
not a calculation. (This is why discharge 3 is tractable: strictness collapses the
hard coherence calculation.)

### 3.3 The triangle (unit coherence)

With `id_A` the identity transport functor (`mapClaim = id`, `transport = ` relabel-by-
identity), show `γ_{F, id_A}` and `γ_{id_B, F}` are the unit isomorphisms. Reduces to
L1.2 (preserves identities up to deriv relabeling) per claim.

### 3.4 Pseudofunctor ⟺ monodromy-free (the load-bearing equivalence)

The theorem's biconditional half. Define 𝓟° = the full sub-bicategory on rooms +
transport functors such that **every directed cycle is claim-closed** (B2b's
`closed` outcome for every start claim: the round-trip 2-cell `η` is the identity).
Prove:

> `(·)_*` is a **pseudofunctor** when restricted to 𝓟° (all `γ` invertible), and 𝓟°
> is the **largest** such sub-bicategory: off 𝓟° some cycle has a `drifted`/`dropped`
> claim ⟹ the corresponding `η_c` is non-invertible/undefined ⟹ some `γ` along that
> cycle is non-invertible.

**Direction (⇐):** on 𝓟°, §3.1 gives every `γ` invertible (identity on a total domain).
**Direction (⇒):** the contrapositive *is* the B2b identification — a `drifted` claim is
a non-identity `η_c` (non-invertible in general because ECC arrows are not invertible:
a derivation `c → c'` rarely has a two-way inverse), a `dropped` claim is an undefined
`η_c`. This is exactly what [`scripts/plexus-topology-probe.ts holonomy`](../scripts/plexus-topology-probe.ts)
measures; the live run already exhibits one `dropped` witness (session 07 §3.2).

## 4. The faithfulness boundary (mirror T008's discipline)

State explicitly where the abstract result tracks the live `claimMapJson` data, and
where it does not — the analogue of T008 §Faithfulness:

1. **Faithful region.** When the materialized functor is **strict** (premise structure
   preserved — C014.a), the symbolic 2-cells computed from `claimMapJson` equal the
   abstract `γ`. Then "the live cycle is claim-closed" (probe `holonomy`) ⟺ "transport
   is a pseudofunctor here" (C014-T).
2. **Unfaithful region.** When `apply/route.ts` drops premise rows, the *materialized*
   functor is lax even where the symbolic one is strict — so a cycle can be
   symbolically claim-closed yet materially lossy. There the probe's `closed` verdict
   over-claims pseudofunctoriality. **C014-T must be stated over the symbolic layer and
   flagged as conditional on C014.a for the materialized pipeline.**
3. **Minimality of 𝓟°** is claimed only up to the symbolic layer; the materialized
   boundary is C014.a's job.

> **Prime invariant (must be enforced in the statement):** C014-T is a theorem about
> **symbolic** transport; every application to the live Plexus is gated on the
> materialized functor being strict (C014.a). Violating this re-introduces exactly the
> laxity A0 §2 localized to `apply`.

## 5. Deliverables

- **D1 — bicategory write-up** (§2): all cells + W1–W3 well-definedness, including the
  interchange law. The reusable artifact (also the Direction-5 Agda signature).
  **✅ DONE 2026-06-08** — [`C014-D1-plexus-bicategory-data-2026-06-08.md`](C014-D1-plexus-bicategory-data-2026-06-08.md); W1–W3 proved + corroborated by suite "D1 — Plexus bicategory well-definedness" in [`tests/ecc.test.ts`](../tests/ecc.test.ts) (6/6 green, file 101/101). Works in the quotient `ECC/≈` (derivation-ID relabeling, the L1.2 finding systematized).
- **D2 — coherence proof** (§3.1–§3.3): whiskering, `γ`, pentagon, triangle — the
  strictness-collapses-coherence argument.
  **✅ DONE 2026-06-08** — [`C014-D2-plexus-coherence-pentagon-2026-06-08.md`](C014-D2-plexus-coherence-pentagon-2026-06-08.md); `γ` is identity on the total part / undefined on drops, pentagon + triangle reduce to partial-domain bookkeeping (legalized by W2), corroborated by suite "D2 — comparison 2-cells γ, pentagon + triangle" in [`tests/ecc.test.ts`](../tests/ecc.test.ts) (7/7 green, file 108/108).
- **D3 — the equivalence** (§3.4): pseudofunctor ⟺ 𝓟° claim-closed, with the B2b
  identification as the (⇒) engine.
  **✅ DONE 2026-06-08** — [`C014-D3-pseudofunctor-monodromy-free-2026-06-08.md`](C014-D3-pseudofunctor-monodromy-free-2026-06-08.md); biconditional proved, maximality of 𝓟° shown, and the **§7 open resolved**: 𝓟° is **iso-closure** (claim-closed up to ECC iso), strictly larger than identity-closure. Corroborated by suite "D3 — pseudofunctor ⟺ monodromy-free" in [`tests/ecc.test.ts`](../tests/ecc.test.ts) (8/8 green, file 116/116). Forces a probe refinement (B2b `closed`/`drifted` → ECC inter-derivability), logged in §5 of the write-up — not yet applied.
- **D4 — faithfulness boundary** (§4): symbolic vs materialized, the C014.a gate.
  **✅ DONE 2026-06-08** — [`C014-D4-faithfulness-boundary-2026-06-08.md`](C014-D4-faithfulness-boundary-2026-06-08.md); the boundary is **decidable from the `apply` mode** (`depth>1 + non-empty claimMap` = strict/faithful; else lax/over-claims). **Finding:** the strict structure-preserving path *already exists* in [`apply/route.ts`](../app/api/room-functor/apply/route.ts) (via `reconstructArgumentStructure`), so C014.a is "make it the default," not "build it." Corroborated by suite "D4 — faithfulness boundary" in [`tests/ecc.test.ts`](../tests/ecc.test.ts) (8/8 green, file 124/124).
- **D5 — promotion:** on settlement, migrate C014 → `02_THEOREMS_AND_PROOFS/` as the
  Plexus coherence theorem, update [Q-042](01_OPEN_QUESTIONS_REGISTRY.md#q-042) and
  C014 `status: proven`, and **unlock the gated production changes** (path-provenance
  band + origin dedupe from L2; structure-preserving materialization from C014.a) as
  separate, individually-approved PRs.
  **✅ DONE (theorem filed + cross-checked) 2026-06-08** — [T010](02_THEOREMS_AND_PROOFS/T010-plexus-coherence-pseudofunctor.md) (**established** — independent non-author sign-off 2026-06-08; verification prompt [T010-verification-prompt.md](02_THEOREMS_AND_PROOFS/T010-verification-prompt.md)). C014 status → *promoted → T010 (established)*; Q-042 symbolic part discharged, quantitative offshoot still open. **Production PRs may now cite T010 as settled** — not opened yet (individually gated decisions): (i) L2 origin-dedupe band in `transportAggregator` + `sources[]` path provenance; (ii) make the strict materialization path the default in `apply/route.ts`. No production code changed.

## 6. Corroboration harness (test-then-prove, mirrors the programme)

Before/alongside the paper, extend the existing artifacts (all **test-only**):
- **H1 — pentagon witness.** Over small random `claimMap` chains `A→B→C→D` (finite
  claim sets), assert both pentagon paths agree on the total part and have equal drop
  sets. Extends the A1 suite in [`tests/ecc.test.ts`](../tests/ecc.test.ts).
- **H2 — `γ` invertibility ⟺ claim-closure.** Generate random cycles, run the probe's
  `holonomy` classification, and assert `γ` invertible exactly when every start claim
  is `closed`. Extends [`scripts/plexus-topology-probe.ts`](../scripts/plexus-topology-probe.ts).
  **✅ DONE 2026-06-08** — the D3 §7 refinement is **applied** to the probe: `holonomy` now
  splits `drifted` into `drift-iso` (ECC-inter-derivable ⇒ in 𝓟°) vs `drift-noniso`
  (obstruction) via a two-way derivation-reachability oracle, with a new `drift`
  subcommand seeding a live drift-iso witness (reports `drift-iso=1, in 𝓟°`). The B2b
  headline is unchanged (the live obstruction was a `dropped`).
- **H3 — faithfulness counterexample.** A fixture where the symbolic functor is strict
  but a (simulated) premise-dropping materialization is lax, freezing the §4.2
  over-claim so the boundary is a regression test, not just prose.

## 7. Risks and the one genuine open

- **Low risk (mechanical):** pentagon/triangle (§3.2–§3.3) — strictness collapses them
  to domain bookkeeping. Expected to go through.
- **Low risk:** the equivalence (§3.4 ⇐) — direct from §3.1.
- **The one genuine open (§3.4 ⇒):** whether a `drifted` `η_c` is *always*
  non-invertible. ECC arrows are generally non-invertible, but a drift `c → c'` where
  `c` and `c'` are **inter-derivable** (a two-way `join`-iso) would be an *invertible*
  2-cell — a claim-closed-up-to-iso cycle that is **not** identity-closed. **Decision to
  make in the proof:** define 𝓟° by **invertible** `η` (claim-closed *up to ECC iso*),
  not strict identity `η`. This is the mathematically correct definition and the probe's
  `closed`/`drifted` boundary must be refined to *iso vs non-iso*, not *identity vs
  non-identity*. **Flag for the probe:** B2b currently tests claim-id equality; under
  this spec it should test ECC-inter-derivability. Logged as the single substantive
  refinement discharge 3 forces back onto the empirical layer.

## 8. Sequencing

D1 → D2 → D3 → D4 → (H1–H3 alongside) → D5. The §7 open (iso-vs-identity 𝓟°
definition) is resolved at the top of D3 and back-propagated to the probe before H2.
Direction-5 mechanization (Agda bicategory + pseudofunctor) is **optional**, gated on
D1–D3 landing on paper, and would reuse the L1 finite-set carrier.

**Progress:** D1–D4 ✅ + **H2 ✅** (2026-06-08). §7 resolved (𝓟° = iso-closure). The symbolic theorem C014-T + its live-faithfulness boundary are complete; the faithful region is the *existing* strict materialization path; the probe is refined to ECC inter-derivability (`drift` subcommand green). H1 ≈ D2 tests, H3 ≈ D4 lax block — the harness is effectively covered. Remaining: **D5 promotion** (migrate C014 → a theorem file; flip `status: proven`; open the gated production PRs: L2 origin-dedupe band + make strict materialization the default).
