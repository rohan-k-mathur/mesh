# ECC Refinement & MCP Integration — Brainstorm + Roadmap

**Status:** Planning / brainstorm
**Date:** May 2026
**Owners:** Deliberation engine + MCP surface
**Companion docs:**
- [AMBLER_PAPER.md](AMBLER_PAPER.md) — primary mathematical source (Ambler 1996)
- [CATEGORICAL_FOUNDATIONS_ARCHITECTURE.md](CATEGORICAL_FOUNDATIONS_ARCHITECTURE.md) — current state
- [AgoraBlueprint.txt](../../Internal_Documents/AgoraBlueprint.txt) — historical, to be demoted
- [packages/isonomia-mcp/src/server.ts](../../packages/isonomia-mcp/src/server.ts) — current MCP surface

**Section 0.5 (corrections after re-reading the paper) below supersedes any conflicting wording in the rest of the document.**

---

## 0. TL;DR

1. The repo has **two parallel implementations** of evidential semantics: a typed but unused `Arrow` algebra in [lib/argumentation/ecc.ts](../../lib/argumentation/ecc.ts), and a working but ad‑hoc numerical pipeline in [evidential/route.ts](../../app/api/deliberations/[id]/evidential/route.ts). The `Arrow` algebra is **dead code outside tests**.
2. Several ECC features specified in `CATEGORICAL_FOUNDATIONS_ARCHITECTURE.md` and in the user's brief are **specified-but-unbuilt**: selected arrows (simple+entire), tensor `⊗` as a first-class operation, internal hom `[A,B]` as an attackable object, the multi-room transport law, culprit-set extraction, and `EnthymemeNudge` emission.
3. The MCP server exposes the **read‑side standings layer** (synthetic readout, frontier, missing moves) but **zero ECC‑grade tools** (no hom‑set queries, no transport, no culprit sets, no enthymeme nudges).
4. `AgoraBlueprint.txt` is a 2024-era system-design doc that the current architecture has already absorbed; salvage the composer UX section, demote the rest.

This doc is the brainstorm + roadmap to close those four gaps in one coordinated sprint.

---

## 0.5. Corrections after re-reading Ambler 1996

A careful re-read of [AMBLER_PAPER.md](AMBLER_PAPER.md) surfaced four corrections to the rest of this document. **Read these before §1.**

### 0.5.1 `selected` and `logical` are distinct predicates

Page 179 of the paper is explicit: "a logical map need not be selected... Conversely, not every selected map can be considered as a logical proof. In the case of 𝒜_Γ, every singleton is selected, yet it may contain free variables in Γ."

We therefore need **two** predicates in the algebra, with different UI semantics:

| Predicate | Paper definition | Mesh meaning | UI badge |
|---|---|---|---|
| **simple** (Def. 8) | Δ_Y ∘ f = (f⊗f) ∘ Δ_X *exactly* | hom-set is a singleton (one canonical derivation) | — |
| **entire** (Def. 8) | t_X = t_Y ∘ f *exactly* | hom-set is non-empty (some support exists) | — |
| **selected** (Def. 8) | simple ∧ entire | exactly one canonical derivation, non-vacuous | "single canonical derivation" |
| **logical** (Def. 17) | smallest class with identities, l, r, a, t, ε; closed under ⊗, ∘, Λ | derivation closure has **no open assumptions in Γ** | "tested-survived / closed proof" |

The "verified" badge in Sprint B4 should be driven by **`isLogical`**, not `isSelected`. `isSelected` becomes a separate, mostly-internal structural flag. The Isonomia `standingState = "tested-survived"` corresponds to `isLogical` (no free variables = no open assumptions).

### 0.5.2 The comonoid law is lax (inequality), and equality holds iff selected

Definition 3 condition 4 gives `Δ_Y ∘ f ≤ (f⊗f) ∘ Δ_X` and `t_X ≥ t_Y ∘ f` — both **inequalities**. Lemma 7 + the converse direction in §2.2 give: **equality holds iff f is selected**. Sprint A2 property tests should include this laxness direction explicitly so a future engineer who "fixes" the inequality into an equality breaks the test (and notices).

### 0.5.3 The confidence monoid is parametric, not a closed three-mode enum

§3 defines `c: 𝒜(A,B) → ℳ` valued in **any** commutative monoid ℳ in `(SLat, ⊗, I)` where the identity T is also top. Lemma 26 says you can compose along any lax SLat-functor `F: ℳ₁ → ℳ₂`. Our `min | product | ds` are three concrete instances:

| Mode | Paper instance | Source |
|---|---|---|
| `min` | weakest-link via `s: vars → [0,1]` and lattice hom `ℓ: 𝒟 → ([0,1], min, 1)` | Example 25 + 27 |
| `product` | `w: 𝒟 → ([0,1], *, 1)` from disjunctive normal form | Example 28 |
| `ds` | probability valuation `p: 𝒟 → [0,1]`, S(φ) = ∨{p(c(a))} | Theorem 30 |

Architectural implication for §2.1's API: the algebra should expose `confidence(arrow, monoid: ConfidenceMonoid)` with a registry of pre-built monoids, not hard-code the three string keys. This makes it cheap to add Example 28's `−log r` work-cost monoid or possibility-theory ℳ later without re-versioning the algebra.

### 0.5.4 The DS branch is governed by Theorem 30, with explicit hypotheses

The DS computation in [evidential/route.ts](../../app/api/deliberations/[id]/evidential/route.ts) is exactly the support function of Theorem 30: `S(φ) = ∨{p(c(a)) | a ∈ 𝒜(I, [[φ]])}`. **Soundness requires** that `p` is a probability valuation on a distributive lattice 𝒟 *and* `c` is a confidence measure into 𝒟. The new code should carry these hypotheses in JSDoc so a future swap of the underlying lattice can't silently invalidate them.

### 0.5.5 Negation correctly stays meta-level

Conclusion §4: "it seems wiser to consider negation as something external to argumentation for the moment." The existing `NegationMap` model (treating ¬φ as a separate object linked at the meta-level) is the **paper-conformant** choice. No change.

### 0.5.6 Aggregation is monotone — undercut is an Isonomia extension, not Ambler

Page 171: "the aggregation of arguments is necessarily monotone. To overturn a decision one must supply a stronger argument on the other side. There is no mechanism for one argument to defeat or undercut another."

Mesh's `EdgeType.undercut` therefore lives **outside** Ambler's algebra. It works by targeting the warrant-as-claim (the internal hom `[A,B]` reified as a `Claim`) and then propagating through assumption retraction (Sprint D). Sprint B's adapter must NOT try to express undercut as a subtraction inside the algebra — it stays a structural attack on the warrant claim, and only assumption retraction lowers support. This is a critical contract for the typed pipeline.

### 0.5.7 Multi-room transport is an Isonomia construction, consistent with but not from Ambler

The formula `Hom_B(I,ψ) = Hom_B^local(I,ψ) ∨ F(Hom_A(I,φ))` from the user's brief is **not** in Ambler — the paper deals with a single category 𝒜_Γ. It is an Isonomia extension that uses Ambler's join (∨ as coproduct in `Hom(A,B)`) to combine local and transported derivations. Sprint C's docs and tool descriptions must label this as an Isonomia construction so we don't mislead readers into thinking the formula is cited from the paper.

### 0.5.8 The belief-revision algorithm in Sprint D is verbatim from Ambler §4

Conclusion §4 specifies exactly what `culpritSets()` should compute: "subsets X of Γ such that each term t_i contains a variable in X... choose [the] suitable culprit set and delet[e] its elements from Γ." In our schema, Γ corresponds to open `AssumptionUse` rows and "deletion" maps to `AssumptionStatus.RETRACTED`. Sprint D is faithful as written.

---

## 1. Current-state audit

### 1.1 What the ECC module actually implements

[lib/argumentation/ecc.ts](../../lib/argumentation/ecc.ts) (283 LOC) defines:

| Operation | Status | Notes |
|---|---|---|
| `Arrow<A,B>` type with `derivs: Set<DerivationId>` and per-derivation `assumptions` | ✅ implemented | Materializes hom-sets as finite derivation sets |
| `zero(from,to)` | ✅ | Bottom of the hom-set semilattice |
| `join(f,g)` | ✅ | Coproduct ∨ in `Hom(A,B)` with assumption-map merge |
| `compose(g,f)` | ✅ | Cartesian product of derivation pairs, union of assumptions |
| `minimalAssumptions(arrow)` | ✅ | Union of all per-derivation assumptions |
| `derivationsUsingAssumption(arrow,λ)` | ✅ | Reverse index for "what if λ fails?" |
| **`tensor(f,g)` (⊗) for premise conjunction** | ❌ | Not implemented |
| **`internalHom(A,B)` returning a warrant object** | ❌ | Not implemented |
| **`isSelected(arrow)` (simple + entire predicate)** | ❌ | Not implemented; required for projection/duplication laws |
| **`confidence(arrow, mode)` morphism into a monoid** | ❌ | Confidence lives in route.ts, not in the algebra |
| **`transport(F, arrow)` between deliberation categories** | ❌ | RoomFunctor exists at the schema level, not at the algebra level |
| **`culpritSets(claim, target)` for belief revision** | ❌ | §12 of arch doc is unimplemented |

**Consumers:** only [tests/ecc.test.ts](../../tests/ecc.test.ts). Grep for `argumentation/ecc` returns just the test file. The module is correct, well-documented, and not used anywhere in production.

### 1.2 What the production pipeline actually does

[app/api/deliberations/[id]/evidential/route.ts](../../app/api/deliberations/[id]/evidential/route.ts) computes the same things in a different idiom:

```typescript
const compose = (xs: number[], mode: Mode) =>
  !xs.length ? 0 : (mode === 'min' ? Math.min(...xs) : xs.reduce((a,b)=>a*b,1));
const join = (xs: number[], mode: Mode) =>
  !xs.length ? 0 : (mode === 'min' ? Math.max(...xs) : 1 - xs.reduce((a,s)=>a*(1-s),1));
```

This works and is what the rest of the app reads via [lib/client/evidential.ts](../../lib/client/evidential.ts). It loses three things the typed `Arrow` algebra has:

- **Per-derivation provenance.** The route reduces to a scalar `S(φ)` per claim, then re-derives derivation lists from `ArgumentSupport` rows. The `Arrow` round-trip would let "which assumptions does this score depend on?" be a constant-time read off the same object that produced the score.
- **Equational checking.** The `Arrow` form lets us property-test that `compose(g, join(f1,f2)) = join(compose(g,f1), compose(g,f2))` (distributivity) on real deliberation data — the scalar form silently drops this guarantee.
- **Selected-arrow flagging.** Ambler's exact projection/duplication laws only hold on **simple, entire** arrows. The scalar pipeline can't even represent that distinction, let alone enforce it.

### 1.3 What the architecture doc claims vs. what is built

[CATEGORICAL_FOUNDATIONS_ARCHITECTURE.md §13](CATEGORICAL_FOUNDATIONS_ARCHITECTURE.md) grades most rows A. Re-graded against the *typed algebra*:

| Row | Doc grade | Honest grade | Why |
|---|---|---|---|
| Claims as Objects | A | A | `Claim` model is canonical |
| Arguments as Morphisms | A | **B** | Hom-set membership is materialized in `ArgumentSupport`, but `Arrow` is not the runtime type — the route works on scalars |
| Composition (g∘f) | A | **B** | `composed:boolean` is a flag, not a typed composition; `compose()` from `ecc.ts` is unused in prod |
| Join (f∨g) | A | **B** | Numerical noisy-OR works; no derivation-set join in prod |
| Internal Hom `[A,B]` | A | **C** | `Inference` exists and is undercut-targetable, but is not categorically reified — there is no first-class `Warrant` morphism object passed into APIs |
| Tensor (⊗) | A | **C** | `ArgumentPremise` rows model the conjunction, no `tensor()` operation exposed to callers |
| Comonoid (Δ, t) | B+ implicit | **C** | Unimplemented |
| Functor composition (A→B→C) | ❌ missing | ❌ missing | `RoomFunctor` table is one-hop only |
| §12 belief revision (culprit sets, EnthymemeNudge) | (described, no grade) | ❌ missing | Spec only |

The MCP tools' standings/refusal layer ([memory/repo/isonomia-substrate-product-claim.md](memory:repo/isonomia-substrate-product-claim.md)) is the load-bearing product. The ECC algebra is the **principled substrate** that should sit underneath those tools so that "this conclusion is blocked" answers are derived from typed `Arrow` operations, not ad-hoc reductions.

### 1.4 What MCP exposes today

[packages/isonomia-mcp/src/server.ts](../../packages/isonomia-mcp/src/server.ts) — 14 tools, all argument/claim/deliberation reads plus `propose_argument`. None of them:

- Compose two morphisms and return the composite Arrow / its score
- Transport a sub-graph along a `RoomFunctor`
- Compute culprit sets for a rejected claim
- Emit `EnthymemeNudge`s for a target argument
- Surface `selected` arrows distinctly from defeasible ones

This is the explicit integration gap the user named.

---

## 2. Brainstorm — what the refined ECC + MCP surface should look like

### 2.1 Refined `lib/argumentation/ecc.ts`

Add the following without breaking the existing `Arrow / join / compose / zero` API:

```typescript
// ── New surface ────────────────────────────────────────────────

/** Symmetric monoidal product: conjoin premises into a compound source. */
export function tensor<A,B,C,D>(f: Arrow<A,B>, g: Arrow<C,D>): Arrow<[A,C],[B,D]>;

/** Internal hom: warrant object [A,B], itself a first-class claim that can be undercut. */
export type Warrant<A,B> = { kind: "warrant"; from: A; to: B; warrantClaimId: string };
export function internalHom<A,B>(from: A, to: B, warrantClaimId: string): Warrant<A,B>;

/** Structural predicates (Ambler Def. 8). */
export interface ArrowMeta { simple: boolean; entire: boolean }
export function isSimple(arrow: Arrow): boolean;       // |derivs| === 1
export function isEntire(arrow: Arrow): boolean;       // |derivs| >= 1
export function isSelected(arrow: Arrow): boolean;     // simple ∧ entire

/** Logical predicate (Ambler Def. 17): no free variables in Γ.
 *  In Mesh: derivation's assumption-closure has no open AssumptionUse. */
export function isLogical(
  arrow: Arrow,
  isAssumptionOpen: (id: AssumptionId) => boolean
): boolean;

/** Confidence measure: c: Hom(A,B) → ℳ where ℳ is a commutative monoid
 *  in (SLat, ⊗, I) with identity = top. The monoid is a parameter, not
 *  a closed enum (Ambler §3, Lemma 26). */
export interface ConfidenceMonoid<M = number> {
  key: string;                                  // "min" | "product" | "ds" | …
  top: M;                                       // T (also top of the order)
  combine: (x: M, y: M) => M;                  // monoid op (•)
  join: (x: M, y: M) => M;                     // SLat join (∨) on ℳ
  base: (d: DerivationId) => M;                // c on a basic step
}
export const MIN_MONOID: ConfidenceMonoid<number>;
export const PRODUCT_MONOID: ConfidenceMonoid<number>;
export const DS_MONOID: ConfidenceMonoid<{bel:number; pl:number}>;
export function confidence<M>(arrow: Arrow, m: ConfidenceMonoid<M>): M;

/** Transport along a functor F: 𝒟_A → 𝒟_B (RoomFunctor.claimMapJson). */
export interface Functor { mapClaim(id: string): string | null }
export function transport<A,B>(F: Functor, arrow: Arrow<A,B>): Arrow<string,string> | null;

/** Multi-room aggregation: Hom_B(I,ψ) = Hom_B^local(I,ψ) ∨ F(Hom_A(I,φ)). */
export function aggregateAcrossRooms(
  local: Arrow,
  imported: Array<{ functor: Functor; remote: Arrow }>
): Arrow;

/** Belief revision: rank candidate retractions by ⟨coverage, cost⟩. */
export interface CulpritSet {
  assumptions: Set<AssumptionId>;
  badConclusionsExplained: number;
  retractionCost: number;
}
export function culpritSets(
  rejected: Arrow,                    // the OUT-labelled morphism
  context: Arrow[],                   // other morphisms to consider for collateral
): CulpritSet[];                      // ranked, smallest cost first

/** Enthymeme detection: an argument missing an explicit warrant. */
export interface EnthymemeNudge {
  argumentId: string;
  suggestedWarrantText: string;       // LLM-filled at the call site
  missingPremiseRoles: ("warrant" | "background" | "value")[];
}
export function detectEnthymemes(arrow: Arrow, schemes: SchemeCatalog): EnthymemeNudge[];
```

The implementations stay pure (no I/O, no Prisma) so they can be reused by the route, by workers, and by the MCP server.

### 2.2 Wiring the algebra into the production pipeline

Two-step migration (no UI break):

1. **Adapter layer.** Add `lib/argumentation/eccAdapter.ts` that builds `Arrow` objects from `ArgumentSupport + DerivationAssumption + ArgumentPremise` rows, runs the typed algebra, and returns the same `{ support, dsSupport, hom, ... }` payload `evidential/route.ts` returns today. Cut the route over to call the adapter — the JSON shape is unchanged, but the math is now provably the algebra.
2. **Selected-arrow tagging.** Backfill `ArgumentSupport.metaJson.selected = { simple, entire }` from existing data (a derivation is *simple* when it has no shared premise; *entire* when its assumption set is empty or all-accepted). Surface a `selected: boolean` field in the evidential payload. UI gets a "verified" badge for free.

### 2.3 Multi-room transport, end-to-end

`RoomFunctor.claimMapJson` already gives us the object-level `F`. The new pieces:

- `aggregateAcrossRooms()` in the algebra (above).
- A worker (`workers/transport-aggregator.ts`) that, on `RoomFunctor` upsert, recomputes the destination room's evidential payload using the new aggregator and writes a denormalized snapshot to a new `RoomTransportSnapshot` table (hash-keyed by `{toRoomId, fromRoomId, claimMapHash}` for idempotency).
- Read API surfaces the imported contribution as a separate band: `support[claimId] = { local, imported, total }` instead of a flat number. This is the visible payoff of the categorical formula and matches the user's example: "the total evidence for ψ in room B is the join of the local evidence in room B and the transported evidence from room A."

### 2.4 Belief revision flow, end-to-end

When `ClaimLabel.label === "OUT"` is written or a `WHY` move closes without grounds:

1. `culpritSets()` runs over the rejected claim's full hom-set. (Pure function; uses already-loaded `Arrow`s.)
2. Top-3 retraction proposals get queued as `BeliefRevisionProposal` rows (new table) with `{ assumptionIds[], coverage, cost }`.
3. UI emits a side-panel "Suggested retractions" affordance on the claim's expanded view; clicking marks the chosen `AssumptionUse.status = RETRACTED` and triggers `batchLazyRecompute()`.
4. In parallel, `detectEnthymemes()` over all arguments concluding the claim emits `EnthymemeNudge` events; the composer renders an inline "your argument is missing an explicit warrant — state it?" prompt.

### 2.5 New MCP tools

Eight new read tools and one new write tool. All names match the existing naming convention (`get_*` / `compute_*`; writes are explicit verbs).

| Tool | Purpose | Payload |
|---|---|---|
| `get_hom_set` | `Hom_𝒟(A, B)` for a deliberation | `{ deliberationId, fromClaimId, toClaimId } → { derivations: [{argumentId, assumptions, base, selected}], aggregate: {join, mode} }` |
| `compose_morphisms` | Type-checked composition `g∘f` | `{ deliberationId, firstArgumentId, secondArgumentId } → Arrow + composedScore` — refuses with explicit reason if `f.to ≠ g.from` |
| `compute_aggregate_across_rooms` | The transport law in tool form | `{ targetDeliberationId, targetClaimId } → { local, imported: [{ fromDelib, throughFunctorId, contribution }], total }` |
| `get_culprit_sets` | Top-K ranked retraction candidates | `{ deliberationId, rejectedClaimId, k? } → CulpritSet[]` |
| `get_enthymeme_nudges` | Missing-warrant prompts for an argument | `{ argumentId } → EnthymemeNudge[]` |
| `get_warrant` | Internal-hom lookup (the warrant claim/CQs/attacks) | `{ argumentId, inferenceId? } → { warrantClaimId, undercuts: [argumentId], cqs }` |
| `get_selected_arrows` | Filter to simple+entire arrows for a claim | `{ deliberationId, claimId } → derivations[]` — feeds "vetted-only" reading mode |
| `propose_warrant` (write) | Materialize a stated warrant for an enthymeme | `{ argumentId, warrantText, evidence? } → { warrantClaimId, permalink }` — companion to `propose_argument` |

Tool descriptions follow the existing pattern: lead with the synthetic readout context, name the return-shape fields explicitly so LLMs cite by id, and surface honest-empty outcomes (no false transports, no hallucinated culprits) as the failure mode. See [memory/repo/isonomia-substrate-product-claim.md](memory:repo/isonomia-substrate-product-claim.md) for the contract.

### 2.6 MCP integration cross-checks against the substrate-product claim

The substrate's load-bearing product is "evaluator-independent provenance and standings." The new tools fit cleanly:

- `get_culprit_sets`, `get_enthymeme_nudges`, `compute_aggregate_across_rooms` are **deterministic graph-derived** outputs. They survive the same-family-eval contamination problem because no LLM evaluator is in the loop.
- They *expand* the refusal surface: a downstream LLM consuming `get_synthetic_readout` should now see "and here are the assumptions you would have to retract to license closure on X" or "and here is the missing warrant the composer is prompting authors for" — both are deterministic functions of the graph.
- `propose_warrant` is the only write; it routes through the same authentication path as `propose_argument` and produces an attestation envelope so the warrant is itself citeable.

---

## 3. Roadmap (sprint-shaped, no estimates)

### Sprint A — Algebra refinement (no production impact)

- A1. Add `tensor`, `internalHom`/`Warrant`, `isSimple`/`isEntire`/`isSelected`/`isLogical`/`ArrowMeta`, parametric `ConfidenceMonoid` + `MIN_MONOID`/`PRODUCT_MONOID`/`DS_MONOID` + `confidence`, `transport`, `aggregateAcrossRooms`, `culpritSets`, `detectEnthymemes` to [lib/argumentation/ecc.ts](../../lib/argumentation/ecc.ts).
- A2. Extend [tests/ecc.test.ts](../../tests/ecc.test.ts) with property tests: associativity, distributivity, identity, **comonoid laxness in both directions** (Δ_Y∘f ≤ (f⊗f)∘Δ_X and t_X ≥ t_Y∘f, with equality iff selected), `isLogical ⇒ confidence = top` (Lemma 23.1), Theorem 30 support-soundness on the DS monoid, transport-preserves-composition, culprit-coverage monotonicity.
- A3. Document the equational laws explicitly as `@invariant` JSDoc so the algebra serves as the spec; cite Ambler section/lemma numbers so the source is traceable.

**Done when:** `yarn test ecc` exercises every public function; no production code changes.

### Sprint B — Adapter + selected-arrow tagging

- B1. `lib/argumentation/eccAdapter.ts` builds `Arrow` objects from Prisma rows.
- B2. `evidential/route.ts` routes its math through the adapter behind a feature flag (`ECC_TYPED_PIPELINE=1`) so we can A/B the JSON output and confirm parity.
- B3. Add `ArgumentSupport.metaJson.{simple,entire,selected,logical}` backfill script + write-time tagging in `batchLazyRecompute`. `logical` is computed from the assumption closure (no `PROPOSED|CHALLENGED` `AssumptionUse` reachable via `DerivationAssumption.inferredFrom`).
- B4. Surface `logical: boolean` in `EvNode` + `MorphismCard` + `HomSetConfidencePanel` as the **"tested-survived" badge** (the Isonomia standing semantics, per §0.5.1). `selected` stays an internal structural field surfaced only to advanced/audit views.
- B5. **Contract test**: assert that the typed pipeline never lowers support in response to an `undercut` edge — undercut effects must propagate exclusively via assumption retraction (§0.5.6).

**Done when:** flag-on payload byte-identical to flag-off on a representative deliberation; "verified" badge renders.

### Sprint C — Multi-room transport materialization

- C1. New `RoomTransportSnapshot` Prisma model `{ id, toRoomId, fromRoomId, claimMapHash, payloadJson, computedAt }`.
- C2. `workers/transport-aggregator.ts` listens for `RoomFunctor` upserts and `ArgumentSupport` writes in source rooms; recomputes snapshots.
- C3. `evidential/route.ts` reads snapshots + local data and returns the `{ local, imported, total }` band.
- C4. UI: `DebateSheetReader` import-mode selector (already present) gains an "imported" sub-bar in support visualization.

**Done when:** turning on a `RoomFunctor` between two demo deliberations changes downstream support scores and the change is visible in the UI without a manual refresh.

### Sprint D — Belief revision flow

- D1. `BeliefRevisionProposal` Prisma model + write hook on `ClaimLabel` transition to `OUT`.
- D2. UI: "Suggested retractions" panel on the claim detail.
- D3. `detectEnthymemes` wired into the argument composer — inline nudge after a publish that lacks an explicit warrant.
- D4. Click-through: retracting an `AssumptionUse` triggers `batchLazyRecompute` and re-labels affected claims.

**Done when:** rejecting a claim in a seeded demo deliberation produces a ranked retraction list; clicking one flips downstream labels.

### Sprint E — MCP integration

- E1. Implement the eight read tools and `propose_warrant` in [packages/isonomia-mcp/src/server.ts](../../packages/isonomia-mcp/src/server.ts), each backed by a corresponding API route under `app/api/v3/deliberations/[id]/ecc/*`.
- E2. Tool descriptions follow the existing voice: lead with "Use this when…", name the response fields LLMs should cite, mark honest-empty as the desired failure mode.
- E3. `npm run mcp:rebuild`; smoke-test against Claude Desktop and the polarization-1 orchestrator.
- E4. Add the new tools to the `/.well-known/argument-graph` discovery doc and the [isonomiaOpenapi.ts](../../lib/api/isonomiaOpenapi.ts) manifest.

**Done when:** an MCP client can ask "what would I have to retract to reject claim X in this deliberation?" and get a deterministic, graph-derived answer with no LLM in the loop.

### Sprint F — Documentation cleanup

- F1. Update [CATEGORICAL_FOUNDATIONS_ARCHITECTURE.md §13 Implementation Status Matrix](CATEGORICAL_FOUNDATIONS_ARCHITECTURE.md) with the honest grades from §1.3 above, then re-grade A as each sprint lands.
- F2. Demote [AgoraBlueprint.txt](../../Internal_Documents/AgoraBlueprint.txt) to `Internal_Documents/_archive/AgoraBlueprint.2024.txt`; replace with a 20-line stub pointing to (a) `CATEGORICAL_FOUNDATIONS_ARCHITECTURE.md` for substrate, (b) this file for the algebra+MCP roadmap, (c) a new `ARGUMENT_COMPOSER_ROADMAP.md` for the connective-aware UI section salvaged from the original.
- F3. Add a "Categorical algebra" section to the MCP server's README enumerating the new tools and the equational laws they expose.

---

## 4. Settled design decisions

The five questions raised in the v1 of this doc have been resolved by the owner. These are now **binding contracts** for Sprint A onward; deviation requires re-opening the question.

| # | Decision | Implication |
|---|---|---|
| 1 | **`isLogical` is strict (paper-aligned).** A derivation is logical iff its assumption closure contains zero `AssumptionUse` rows whose `status ∈ {PROPOSED, CHALLENGED}`. | Sprint B3's tagger filters on `status === ACCEPTED` only (RETRACTED also fails). Sprint A2 adds a property test asserting `isLogical(arrow) ⇒ confidence(arrow, m) === m.top` for every registered monoid (Lemma 23.1). The "tested-survived" badge in Sprint B4 reads exclusively from this strict predicate. |
| 2 | **Transport is one-hop only for now.** `aggregateAcrossRooms` accepts `Array<{functor, remote}>` where each `functor` is a single `RoomFunctor`; multi-hop chains (A→B→C) are deferred. | Sprint A1 omits functor composition. Sprint C2's worker rebuilds snapshots only for direct `RoomFunctor` rows — no transitive walk. The MCP `compute_aggregate_across_rooms` tool description must say "direct one-hop transport only; chained transport (A→B→C) is not currently supported." Revisit when a real use case appears. |
| 3 | **AI-proposed warrants auto-flag `author.kind = AI`.** A warrant created via `propose_warrant` is never `isLogical` until a human explicitly claims it. | Sprint E1's `propose_warrant` writes `author.kind = AI` and `author.aiProvenance` from the calling MCP context (model id from request headers). The `isLogical` predicate in Sprint A1 takes an extra check: arrows whose underlying argument has `author.kind ∈ {AI, HYBRID}` and no human ratification record return `false` regardless of assumption closure. UI shows an "AI-drafted, awaiting human ratification" pill on the warrant claim. |
| 4 | **Belief-revision UX is inline nudges only.** No moderator-level revision view in this sprint. | Sprint D2's "Suggested retractions" panel renders on the claim detail only, scoped to the viewing user's perspective. No deliberation-wide review queue. Sprint D's done-criterion still holds: rejecting a claim produces a ranked list and clicking flips downstream labels — just without the moderator dashboard. |
| 5 | **Confidence monoid registry is closed with an admin extension path.** Only `MIN_MONOID`, `PRODUCT_MONOID`, `DS_MONOID` are exported by default; `registerConfidenceMonoid(monoid)` is a typed but server-side-only function. | Sprint A1: registry is a private module-level `Map<string, ConfidenceMonoid<any>>` with the three built-ins seeded; `registerConfidenceMonoid` is exported but not wired to any HTTP path. Sprint E1 MCP tools take `mode: "min" | "product" | "ds"` as a closed enum — no caller-supplied monoids. Adding a fourth (e.g. work-cost from Ambler Example 28) is a code change requiring code review, not a runtime extension. |

With those locked in, **Sprint A is ready to start.** Subsequent sprints inherit these decisions verbatim.
