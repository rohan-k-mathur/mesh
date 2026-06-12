# C014 discharge 3 / D4 — the faithfulness boundary: symbolic vs materialized

- **Date:** 2026-06-08
- **Direction:** 4 — Distributed semantics, sub-program A (coherence). **D4 of the discharge-3 dev-spec** ([`DEV_SPEC-c014-discharge3-plexus-coherence-pentagon-2026-06-07.md`](DEV_SPEC-c014-discharge3-plexus-coherence-pentagon-2026-06-07.md) §4).
- **Status:** **DONE (corroborated).** The boundary between where C014-T (symbolic) tracks the live materialized pipeline and where it over-claims is pinned, and **decidable from the `apply` mode**. Corroborated by the green suite **"D4 — faithfulness boundary: symbolic vs materialized (C014 discharge 3)"** in [`tests/ecc.test.ts`](../tests/ecc.test.ts) (8/8; full file 124/124).
- **Builds on:** [D1](C014-D1-plexus-bicategory-data-2026-06-08.md)–[D3](C014-D3-pseudofunctor-monodromy-free-2026-06-08.md) (the symbolic coherence theorem), the [A0 audit](audits/a0-onehop-contract-laxity-vs-policy-2026-06-07.md) §2 (laxity lives in materialization). **Feeds:** the H1–H3 harness and D5 (promotion). Tracks [C014](03_CONJECTURES/C014-plexus-transport-pseudofunctor.md) / [Q-042](01_OPEN_QUESTIONS_REGISTRY.md#q-042).

---

## 0. The headline finding — the faithful region is *reachable*, not hypothetical

Reading [`app/api/room-functor/apply/route.ts`](../app/api/room-functor/apply/route.ts)
against the A0 audit's "apply drops premise rows" claim revealed the audit was **half
right, and the better half is good news.** Materialization has **two** code paths:

| Path | Trigger (in `apply/route.ts`) | Premise (Toulmin) structure | Functor |
|---|---|---|---|
| **STRICT** | `depth > 1` **and** `claimMap` non-empty, on the "new import" branch | **preserved** via [`reconstructArgumentStructure`](../lib/arguments/structure-import.ts) (writes the diagram + `Inference` + **`InferencePremise`** links) + `recursivelyImportPremises` (imports premise *Arguments* the `claimMap` covers) | strict |
| **LAX** | `depth === 1`, **or** empty `claimMap`, **or** the "materialize-virtual" branch | **dropped** (text-only `Argument` + `ArgumentSupport`; no Toulmin/inference structure carried) | lax |

> **Row-name precision (cross-check clarification 2, 2026-06-08).** "Premise/Toulmin
> structure" here means the **diagram-level `InferencePremise`** rows (written by
> `reconstructArgumentStructure`) plus the recursively-imported premise **`Argument`s**
> (`recursivelyImportPremises`, when `claimMap` maps them) — *not* `ArgumentPremise` rows,
> which the strict path does not itself write (the probe's reachability oracle *reads*
> `ArgumentPremise` separately, §2.1 note). The qualitative boundary (strict preserves the
> inference structure that witnesses a `drift-iso`; lax is text-only) and the decidable
> predicate are unchanged; only the earlier prose's row name was loose.

So C014.a's "structure-preserving materialization ⟹ strict materialized functor"
**already partly exists in code** — it's the `depth>1 + claimMap` path. The faithful
region is therefore not a future engineering ask in full; it is a **flag away** on the
existing route, and the gated production change (C014.a) is narrower than the audit
implied: *make the strict path the default / always-on*, not *build it from scratch*.

---

## 1. The boundary (the T008 analogue)

C014-T (D1–D3) is a theorem about **symbolic** transport (the `Functor` / `transport` /
`compose` surface). D4 states, exactly as T008 §Faithfulness states it for the kernel,
where that theorem governs the **live** pipeline:

> **Faithfulness boundary.** On the **strict** materialization path, the materialized
> 2-cells equal the symbolic comparison 2-cells `γ` (D2), so the symbolic region 𝓟°
> (D3) **tracks** the live `claimMapJson` + materialized pipeline: a symbolically
> iso-closed cycle is a genuine pseudofunctor there. On the **lax** path, a
> symbolically iso-closed cycle can be **materially lossy** — the dropped premises are
> exactly the assumptions that witnessed the inter-derivability iso, so the
> *materialized* round-trip arrow is no longer invertible even though the *symbolic*
> one is.

### 1.1 Why lax breaks it (the mechanism)

A D3 `drift-iso` is witnessed by inter-derivable claims — and the witness is an ECC
arrow carrying the **assumptions** (premises) that make the two-way derivation go
through. Lax materialization produces a **text-only** arrow: `materializeLax` strips
`minimalAssumptions` to `∅`. With the witnessing premises gone, the materialized arrow
can no longer round-trip to identity, so the materialized round-trip 2-cell `η` is
**not invertible** — the cycle is materially outside 𝓟° even though symbolically inside.
*Corroboration:* `lax materialization is UNFAITHFUL` block — a symbolic arrow with
assumptions `{λ1, λ2}` materializes (lax) to one with `∅`, and the over-claim is made
the explicit assertion `symClosed && !matFaithful`.

### 1.2 Why strict preserves it

Strict materialization carries the derivation token and its assumption set verbatim
(modeled by `materializeStrict = id` on arrows), so the materialized iso witness equals
the symbolic one and the invertibility verdict is unchanged. *Corroboration:* `strict
materialization is FAITHFUL` block — assumptions `{λ1, λ2}` survive; an identity-like
round trip stays an iso under `isIsoVia`.

---

## 2. The boundary is decidable from the `apply` mode (the C014.a gate)

Unlike T008 (where faithfulness depended on a semantic property of the *test*), D4's
boundary is a **syntactic predicate on the call**: the strict path is taken iff
`branch === "new" && depth > 1 && |claimMap| > 0` — exactly the route's guard
`structure && Object.keys(claimMapping).length > 0` with `structure` gated on `depth>1`.
*Corroboration:* the `boundary is decidable from the apply mode` block — `isStrictPath`
returns true only for `(depth>1, claimMap≠∅, new)`, false for depth=1, empty claimMap,
and the always-text-only materialize-virtual branch.

> **Prime invariant (for the C014-T statement):** C014-T is a theorem about **symbolic**
> transport; any application to the live Plexus is **gated on the strict materialization
> path** (`depth>1 + non-empty claimMap`). On the lax path the probe's `closed`/`iso`
> verdict **over-claims** pseudofunctoriality and must be reported as *symbolic only*.

---

## 3. What D4 establishes, and the consequences

**Established.** The symbolic coherence theorem C014-T (D1–D3) is **conditionally faithful
to the live pipeline**: faithful exactly on the strict materialization path, over-claiming
on the lax path, with the boundary a decidable function of the `apply` call. This is the
analogue of T008 §Faithfulness and the last piece of *reasoning* in discharge 3.

**Consequences (all gated, none auto-applied):**
1. **C014.a is narrower than thought.** Structure-preserving materialization is not a
   greenfield build; the strict path exists. The gated production change is to **make it
   the default** (or to gate transport UI on it), not to write it.
2. **The probe must report a faithfulness caveat.** When the live
   [`scripts/plexus-topology-probe.ts`](../scripts/plexus-topology-probe.ts) classifies a
   cycle as `closed`/`iso`, that is a **symbolic** verdict; it is faithful to materialized
   reality only if the imports along the cycle used the strict path. Logged as a probe
   annotation (with the D3 `drift-iso` refinement), to apply before H2.
3. **The lax-path over-claim is now a regression fixture** (the D4 `the over-claim is
   exactly…` test), so the boundary is a guarded property, not just prose — exactly the
   H3 deliverable's intent, brought forward.

**Hand-off to H1–H3 + D5.** With D1–D4 done, the symbolic theorem is complete and its
live-faithfulness boundary pinned. Remaining in discharge 3: the corroboration harness
(H1 pentagon witness — partly covered by the D2 tests; H2 `γ`-invertibility ⟺ claim-
closure on the *refined* probe; H3 faithfulness counterexample — covered by the D4 lax
block) and **D5 promotion** (migrate C014 → a theorem file, flip `status`, and open the
gated production PRs: L2 origin-dedupe band + making the strict materialization path the
default).

**Direction-5 note.** D4's boundary is a decidable predicate on the import call, so it
mechanizes as a guard, not a proof obligation; the Agda model carries C014-T over the
symbolic carrier and exposes the strict-path predicate as the faithfulness side-condition.
