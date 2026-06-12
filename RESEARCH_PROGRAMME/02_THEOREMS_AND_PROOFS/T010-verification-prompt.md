# Verification prompt — fully cross-check T010 (the Plexus coherence / pseudofunctor theorem, symbolic layer)

> **Role.** You are an independent second reader. You did **not** author T010 or any of
> its discharge write-ups (D1–D4). Your job is to either (a) sign off on the theorem as
> *established*, or (b) return a numbered list of substantive defects, each with the
> precise location and the minimal repair you believe is required. Default to
> skepticism: a clean sign-off requires that *every* obligation below is discharged. Do
> **not** trust the proof's own summaries — re-derive against the ECC source and the
> test suites. The author's predecessor cross-check of T007 found a *blocking* leastness
> defect (the abstract claim was false against the kernel); the analogous failure mode
> here is **the pentagon "strictness collapse" silently discarding a non-trivial
> coherence cell**, or **a `drift-iso` that is not actually an ECC iso** (so 𝓟° is
> mis-drawn). Hunt for both.
>
> **Target.** [`T010-plexus-coherence-pseudofunctor.md`](T010-plexus-coherence-pseudofunctor.md)
> — the claim that (1) the Plexus bicategory 𝓟 is well-defined and transport `(·)_∗` is a
> lax functor whose comparison 2-cells `γ` are identity-on-total / undefined-on-drop with
> pentagon + triangle holding; (2) `(·)_∗` is a **pseudofunctor** on a region **iff** that
> region is **𝓟°** = the iso-monodromy-free sub-bicategory, and 𝓟° is **maximal**; (3) the
> symbolic theorem is faithful to the live materialized pipeline **exactly on the strict
> materialization path**, a decidable predicate on the `apply` call.
>
> **Scope reminder — what T010 is and is NOT.** T010 is the **symbolic / qualitative**
> coherence result (Direction 4, sub-program A). It redefines / pins the *objects* (the
> bicategory 𝓟, the sub-bicategory 𝓟°) and proves a coherence biconditional over them; it
> does **not** change any production behaviour. It does **not** establish any
> *quantitative* $H^1(\mathbb{R})$ class (that needs an independent per-edge `RoomFunctor`
> transport weight the schema lacks — [Q-042](../01_OPEN_QUESTIONS_REGISTRY.md#q-042)
> quantitative offshoot, **out of scope, still open**). It does **not** lift the one-hop
> production contract (that is a gated PR, not a theorem). It is a theorem about the
> **symbolic** layer and is only *conditionally* faithful to the materialized pipeline —
> the lax-path over-claim is **expected** and is the content of part (3), **not** a defect
> to fix. It does **not** assume either Direction-4 "prize" (the Lawvere enrichment or
> proof-as-Boolean-fragment). A sign-off must confirm: the pentagon/triangle collapse is
> *proved, not assumed*; the iso-closure (not identity-closure) definition of 𝓟° is
> genuine and not smuggled in; the faithfulness boundary is *exact* and honestly bounded;
> and the quantitative offshoot is left open with a back-pointer.
>
> **Programme rules you are bound by.** Read [`README.md`](README.md) (theorem-register
> policy) first. An entry must be (1) stated in formal vocabulary, (2) human-checkable in
> one sitting via lemmas, (3) cross-checked by a non-author, (4) tied to an
> open-question entry it retires or updates ([Q-042](../01_OPEN_QUESTIONS_REGISTRY.md#q-042)).
> Tests are **evidence, not proof**. Record your verdict in the format of the existing
> `## Cross-check notes` sections (see [T006](T006-first-divergence-locus-e0.md) /
> [T008](T008-minimal-separating-context-daimon-closed.md) for the model).

---

## 0. Source materials you must consult (do not work from T010 alone)

- **The theorem.** [`T010-plexus-coherence-pseudofunctor.md`](T010-plexus-coherence-pseudofunctor.md)
- **The conjecture it promotes + its discharge structure.** [`../03_CONJECTURES/C014-plexus-transport-pseudofunctor.md`](../03_CONJECTURES/C014-plexus-transport-pseudofunctor.md)
- **The four discharge write-ups (the source of proof).**
  [`../C014-D1-plexus-bicategory-data-2026-06-08.md`](../C014-D1-plexus-bicategory-data-2026-06-08.md) (bicategory data + W1–W3, the `ECC/≈` quotient),
  [`../C014-D2-plexus-coherence-pentagon-2026-06-08.md`](../C014-D2-plexus-coherence-pentagon-2026-06-08.md) (γ, pentagon, triangle),
  [`../C014-D3-pseudofunctor-monodromy-free-2026-06-08.md`](../C014-D3-pseudofunctor-monodromy-free-2026-06-08.md) (the biconditional + 𝓟° = iso-closure + §7 decision),
  [`../C014-D4-faithfulness-boundary-2026-06-08.md`](../C014-D4-faithfulness-boundary-2026-06-08.md) (symbolic vs materialized).
- **The scope/dependency it executes.** [`../DEV_SPEC-c014-discharge3-plexus-coherence-pentagon-2026-06-07.md`](../DEV_SPEC-c014-discharge3-plexus-coherence-pentagon-2026-06-07.md)
  — §2 (bicategory data), §3 (proof obligations), §4 (faithfulness), §7 (the iso-vs-identity open it resolves).
- **The audit that fixes the framing.** [`../audits/a0-onehop-contract-laxity-vs-policy-2026-06-07.md`](../audits/a0-onehop-contract-laxity-vs-policy-2026-06-07.md)
  — obstruction is **provenance, not categorical**; object composition free; symbolic algebra strict+idempotent; the scalar band is the only one-hop blocker; **laxity lives in materialization**. T010(3) leans on this — confirm the reduction is exact.
- **The empirical origin (B2b) the (⇒) direction reduces to.** [`../10_IDEATION_SESSIONS/07-distributed-semantics-sheaf-cohomology-2026-06-07.md`](../10_IDEATION_SESSIONS/07-distributed-semantics-sheaf-cohomology-2026-06-07.md)
  §3.2 (claim-map monodromy; the live `dropped` witness; exact ℝ-holonomy).
- **The symbolic surface (the carrier).** [`../../lib/argumentation/ecc.ts`](../../lib/argumentation/ecc.ts)
  — `Arrow`, `Functor.mapClaim`, `transport` (strict on derivations), `compose` (builds `df∘dg`, re-associates), `join` (Set-union, idempotent), `minimalAssumptions`. **The proof's `≈` quotient is justified here or nowhere.**
- **The scalar band (L2's object).** [`../../lib/argumentation/transportAggregator.ts`](../../lib/argumentation/transportAggregator.ts)
  — `reduceImportedScores` (positional, no source identity), `combineLocalAndImported`. The L2 double-count lives here.
- **The materialized pipeline (T010(3)'s object).** [`../../app/api/room-functor/apply/route.ts`](../../app/api/room-functor/apply/route.ts)
  + [`../../lib/arguments/structure-import.ts`](../../lib/arguments/structure-import.ts) (`reconstructArgumentStructure`, `recursivelyImportPremises`). **Read the route directly — the two-path claim and the boundary predicate are verified here, not in the write-up.**
- **The probe (H2 / the empirical instrument).** [`../../scripts/plexus-topology-probe.ts`](../../scripts/plexus-topology-probe.ts)
  — `loadDerivationReachability` (the ECC-inter-derivability oracle), the `holonomy` classifier (`closed`/`drift-iso`/`drift-noniso`/`dropped`), the `drift` subcommand witness.
- **The corroborating suites (evidence).** [`../../tests/ecc.test.ts`](../../tests/ecc.test.ts)
  (suites L1, D1, D2, D3, D4) and [`../../tests/transportAggregator.test.ts`](../../tests/transportAggregator.test.ts) (suite L2).

## 1. Definitions are ECC-faithful and over the right objects

1.1 **The `ECC/≈` quotient is necessary and well-formed.** Confirm the derivation-ID
relabeling (L1.2: `transport(F, id_c)` keeps token `ι_c` while moving endpoints;
`compose` builds `df∘dg` and re-associates) genuinely forces a quotient. Verify `≈`
(endpoints + per-derivation assumption sets + multiplicity, **modulo deriv-ID renaming**)
is an equivalence under which `compose` is **strictly** associative + unital. Confirm the
test signature `sig = (from, to, ⋃ assumptions, |derivs|)` is a **complete** invariant for
`≈` on the single-derivation witnesses used — and **flag if any law silently needs
multi-derivation witnesses** where `sig` is incomplete (a real risk: `join` merges
derivation sets, so a multi-deriv arrow's content is not captured by the union of
assumptions alone).

1.2 **The 2-cell definition is a genuine natural transformation.** Confirm `α: F ⇒ F'` =
`(α_c: F(c) → F'(c))_c` with the naturality square `F'(f)∘α_c ≈ α_{c'}∘F(f)` is the
right object (a 2-cell in the bicategory of ECCs), not a weaker "family of arrows with no
naturality". Confirm whiskering and horizontal composition (D1 §1.4) are the standard ones.

1.3 **𝓟° is defined by invertibility, not identity.** Confirm Definition of 𝓟° quantifies
over **invertible** round-trip 2-cells `η` (each `η_c` an ECC iso), and that this is fixed
*before* the biconditional uses it (not circular — the iso-closure choice is justified in
D3 §4 by a standalone fact about drifts between inter-derivable claims, independent of the
theorem it feeds).

## 2. THE CRUX — the pentagon collapse is real, not vacuous (re-derive, do not trust)

> This is the analogue of T007's blocking defect: a coherence argument that *looks* trivial
> because of strictness but is actually hiding a non-identity comparison cell. Re-derive.

2.1 **`γ` is genuinely identity-on-total.** Confirm `(G∘F)(c) = G(F(c))` is **definitional**
(partial-map composition with null propagation, A1's `composeFunctors`), so the component
`(γ_{G,F})_c : G(F(c)) → (G∘F)(c)` has equal source and target and is the identity arrow on
that claim. **Try to break it:** is there any `F, G, c` in the total part where `G(F(c)) ≠
(G∘F)(c)` as *claims* (not just as `≈`-classes)? If `mapClaim` composition is set up so the
two could differ (e.g. a non-deterministic or order-sensitive claim map), `γ` is not the
identity and the collapse fails.

2.2 **The pentagon's two sides agree as 2-cells, and the drop sets are equal.** Re-derive
both reassociation paths `γ_{H,GF}·(H_∗∗γ_{G,F})` and `γ_{HG,F}·(γ_{H,G}∗F_∗)`. Confirm each
is the identity 2-cell on `(H∘G∘F)_∗` over the **common total part**, and — critically —
that the **partial domains coincide** (the drop sets are equal) because `composeFunctors` is
associative (A1). A pentagon that holds on the total part but has *unequal drop sets* on the
two sides is a **defect** — report the witness.

2.3 **W2 (interchange) is what legalizes the manipulation.** Re-prove W2 by hand:
`(δ'·δ)∗(α'·α) ≈ (δ'∗α')·(δ∗α)`. Confirm the pentagon argument actually *uses* W2 (to reorder
the `compose`/`transport` operations under the `γ`'s) and is not silently assuming the
2-cells commute. Confirm the D1 "W2" test is a faithful witness (lands `g_b0 → gpp_b2`, all
four assumptions, one derivation), not a weaker surrogate.

2.4 **The triangle.** Confirm `γ_{F, id_A}` and `γ_{id_B, F}` are the identity on the total
part (reduces to L1.2 per claim), so the unit coherence holds.

## 3. The biconditional and 𝓟°'s maximality reduce correctly

3.1 **The γ↔η bridge.** Re-derive `γ present + invertible ⟺ η_c invertible` componentwise,
using D2's `γ`-shape: `dropped` ⟹ missing `γ` component; `drift-iso` ⟹ invertible `γ`;
`drift-noniso` ⟹ non-invertible `γ`; `closed` ⟹ identity `γ`. Confirm this is an honest
equivalence, not a definition dressed as a lemma.

3.2 **(⇐) and (⇒).** (⇐): on a monodromy-free region every `η_c` invertible ⟹ pseudofunctor.
(⇒): the contrapositive **is** the B2b identification — confirm a `dropped` or `drift-noniso`
claim forces a missing/non-invertible `γ`, and that the live `dropped` witness (session 07
§3.2) is a genuine instance. Confirm the four-fate case split is exhaustive.

3.3 **Maximality.** Re-derive that adding any cycle with non-invertible `η` to a
pseudofunctor region breaks pseudofunctoriality, so 𝓟° (all invertible-η cycles) is the
**largest** such sub-bicategory. Confirm this needs nothing beyond 3.1–3.2.

## 4. The iso-closure decision is a genuine fact (THE SECOND CRUX)

4.1 **A drift-iso is really an ECC iso.** Re-derive: a drift `c → c'` between
**inter-derivable** claims (two-way derivation chain, an `isIsoVia` round-trip to identity in
`ECC/≈`) is an **invertible** 2-cell. **Try to break it:** is `isIsoVia` (two `compose`s ≈
identity) the correct ECC-iso predicate, or could a "two-way derivation" exist that does
*not* compose to identity (e.g. each direction carries assumptions that don't cancel)? If the
round-trip carries net assumptions, it is **not** an iso and the `drift-iso` bucket is
mis-drawn — report it.

4.2 **Identity-closure strictly under-counts 𝓟°.** Confirm that defining 𝓟° by strict
identity `η` (claim-id equality, B2b's raw `closed`) would *exclude* a genuine pseudofunctor
region (the drift-iso), so iso-closure is the *correct* and *strictly larger* definition.
Confirm the D3 §7 / H2 probe refinement (`drift-iso` vs `drift-noniso` via
`loadDerivationReachability`'s two-way reachability) matches the abstract definition, and that
the `drift` subcommand witness (`p → q → p'`, `p ≅ p'`) is honest — re-run it (§6.2).

## 5. The faithfulness boundary is exact, and scope is honest

5.1 **Two materialization paths, read from the route.** Read
[`apply/route.ts`](../../app/api/room-functor/apply/route.ts) directly and confirm: (a) a
**strict** path (`depth>1` and non-empty `claimMap`, new-import branch) routes through
`reconstructArgumentStructure` + `recursivelyImportPremises`; (b) a **lax** path (depth=1, or
empty claimMap, or the materialize-virtual branch) is text-only. Flag any **third** path.

5.2 **Strict preserves, lax strips — the right structure.** Confirm the strict path preserves
the **premise/assumption** structure that witnesses a `drift-iso` (so materialized 2-cells =
symbolic `γ`), and the lax path drops `ArgumentPremise` rows (so a symbolically iso-closed
cycle becomes materially lossy). Confirm the over-claim is **exactly** "symbolic closed/iso
but materially stripped" and that T010(3) states it as a *boundary*, not a bug.

5.3 **The boundary predicate is exactly the route guard.** Confirm
`branch="new" ∧ depth>1 ∧ |claimMap|>0` is the precise guard in the route (the `structure &&
Object.keys(claimMapping).length > 0` condition with `structure` gated on `depth>1`). A
mismatch here means T010(3)'s decidability claim is wrong.

5.4 **Relative-to-the-pipeline, not absolute.** Confirm T010 is stated over the **symbolic**
layer and that every live-data application is gated on the strict path (the T008-faithfulness
analogue), never claimed unconditionally.

5.5 **No overclaim / gating / scope creep.** Confirm T010: claims **no** quantitative
$H^1(\mathbb{R})$ class; does **not** lift the one-hop production contract; does **not** open
any production PR (the L2 origin-dedupe band and the strict-materialization-default stay
*gated on this cross-check*); does **not** assume a Direction-4 prize; closes exactly the
**symbolic** part of [Q-042](../01_OPEN_QUESTIONS_REGISTRY.md#q-042) and leaves the
quantitative offshoot **open** with a back-pointer.

## 6. Corroborating computation (re-run, evidence only)

6.1 Run `npx jest tests/ecc.test.ts tests/transportAggregator.test.ts` → confirm green
(124 + 21 = **145** as of 2026-06-08), including suites **L1, D1, D2, D3, D4** (ecc) and
**L2** (transportAggregator). Confirm each suite tests what its lemma claims (not a weaker
surrogate) — spot-check W2 (D1), the pentagon partial-domain pruning (D2), the four-fate
biconditional (D3), the lax-path over-claim (D4), and the origin-dedupe path-independence (L2).

6.2 Run `npx tsx --env-file=.env scripts/plexus-topology-probe.ts drift` → confirm the seeded
`p → q → p'` cycle (with `p ≅ p'` inter-derivable) reports **`drift-iso=1, in 𝓟°`** and the
verdict note "strict claim-id closure would have mis-flagged this as an obstruction". Then run
`… holonomy` on live data and confirm the live `dropped` witness is unchanged (the B2b
headline). Clean up with `… clean`.

6.3 Optionally build an **independent adversarial witness**: a 3-room cycle with a
`drift-noniso` (a drift between claims with a *one-way* derivation only) and confirm the probe
classifies it **outside 𝓟°** (drift-noniso, an obstruction) — the spot check that the
inter-derivability oracle is not over-permissive.

## 7. Deliver your verdict

Either **sign off** (`established`, with any non-blocking clarifications recorded, in the
`## Cross-check notes` format), or return a **numbered defect list** — each with location,
why it fails (re-derived, not summarized), an empirical witness if applicable, and the minimal
repair. If the pentagon collapse hides a non-identity cell, or a `drift-iso` is not a genuine
ECC iso, or the faithfulness predicate does not match the route — that witness **is** the
deliverable (restrict T010 to the characterized sub-fragment, the C014 negative-settlement
shape). Until a sign-off lands, T010 stays **provisional** and no production change (the L2
origin-dedupe band, strict-materialization-default) may cite it as settled.
