# Session 13 — Attack ratification: gating when a human-authored CA counts as a defeat

**Date:** 2026-06-14
**Direction:** Deliberation-integrity cluster (attack admissibility / governance) — engineering. Outside the six-direction theory spine; a governance sibling to the [PA-node preference work](../../docs/PA_NODE_PREFERENCE_INTEGRATION_ROADMAP.md) it grew out of.
**Status:** **DECISIONS RESOLVED (2026-06-14) — ready for dev spec.** All eleven decision questions D1–D11 are settled (§4 inline + §5 summary); the architectural fit and candidate model are fixed. No schema touched; no conjecture promoted. Next: the dev spec (§6).

> **Provenance.** Emerged from a review of the ASPIC+ defeat pipeline during PA-node Phase 2/3 work. Two findings seeded it: (a) an **undercut always becomes a defeat** with no preference check ([`lib/aspic/defeats.ts:51-59`](../../lib/aspic/defeats.ts)), and (b) the **raw CA-creation endpoint** gates only on auth + structural validity, with no semantic/social admissibility bar ([`app/api/ca/route.ts`](../../app/api/ca/route.ts)). The question: can we give *human* attacks the same kind of ratification gate AI-authored material already faces (logicality-on-ratification, overview §IV)?

---

## 0. The idea, stated crisply

Today a `ConflictApplication` (CA) authored by any logged-in user is, the moment it exists, eligible to become a **defeat** in the grounded extension — knocking its target `out`. There is no human-side analogue of the AI-ratification gate.

**Proposal:** make a CA's *defeat effect* conditional on **ratification**, under a **per-deliberation policy**. The CA is still created immediately — attributed, visible, contestable, on the record — but it does **not** translate into a contrary/attack during evaluation until it clears the deliberation's ratification bar. Policies range from `none` (current behaviour) through `single` (one non-author sign-off — the proposed default), `quorum:N`, `moderator`, to `fraction` (e.g. majority of active participants).

The crisp framing: **ratification gates the edge between "attack on the record" and "defeat in the extension"** — a seam the architecture already has.

---

## 1. The live surfaces (what already exists)

Grounding the brainstorm in real code so it targets the substrate, not an abstraction.

| Surface | Where | Note (verified 2026-06-14) |
|---|---|---|
| The attack→defeat **seam** | [`lib/cqs/challengeCq.ts:11-12`](../../lib/cqs/challengeCq.ts) | A CQ challenge flips SATISFIED→**DISPUTED** but explicitly does **not** defeat: *"admissibility-gated, NOT defeat-gated — defeat evaluation is batch."* Precedent for "on the record but not yet effective." |
| Defeat engine | [`lib/aspic/defeats.ts`](../../lib/aspic/defeats.ts) | Undercut → **always** defeats (`:51-59`, no preference check); assumption-undermine → always (`:66-78`); rebut / ordinary-premise-undermine → **preference-gated** (`:81-94`). Ratification is a *more general* guardrail than preferences — it gates **all** types, including undercuts preferences can't touch. |
| Undercut generation (formal guard) | [`lib/aspic/attacks.ts:204-243`](../../lib/aspic/attacks.ts) | An undercut only forms if the target rule is **defeasible + named** and the attacker's conclusion is the **contrary of the rule name** n(r). The engine won't manufacture an undercut from unrelated text — but a *well-formed-but-bogus* CA still passes. |
| **Enforcement point (already built)** | [`lib/aspic/deliberationEvaluation.ts`](../../lib/aspic/deliberationEvaluation.ts) `buildDeliberationGraph` | Phase 2.1 helper: fetches `conflictApplication` rows → CA-nodes. **A single `where` filter here (`ratificationStatus: EFFECTIVE`) is the whole enforcement mechanism.** Same filter in `GET /api/aspic/evaluate`'s conflict fetch. |
| Per-deliberation config precedent | `DeliberationPref` ([`lib/models/schema.prisma:4926`](../../lib/models/schema.prisma)) | Already holds per-deliberation thresholds (`minRelevance`/`minSufficiency`/`minAcceptability`). A `attackRatificationPolicy` field slots in beside it. |
| Lifecycle-enum precedent | `CQStatusEnum` (`OPEN \| PENDING_REVIEW \| PARTIALLY_SATISFIED \| SATISFIED \| DISPUTED`) | The model already carries staged-status enums; a CA `PROPOSED → EFFECTIVE` lifecycle is the same shape. |
| Recompute trigger | `recomputeGroundedForDelib` ([`lib/cqs/challengeCq.ts:454`](../../lib/cqs/challengeCq.ts)) | Already fired after a challenge; a ratification flip reuses it to recompute standing out-of-band. |
| AI-ratification precedent | overview §IV (logicality gating) | AI-authored material is flagged `authorKind:"AI"` and stays non-logical until a human ratifies. This proposal is the **human-attack analogue**. |
| Governance surfaces | overview §VI (facilitation cockpit + role gating), §V (argumentation-based reputation), notification pipeline | The `moderator` policy and ratifier-eligibility / reputation-weighting options ride existing infrastructure. |
| CA creation (the soft entry) | [`app/api/ca/route.ts:29-41`](../../app/api/ca/route.ts) | Auth (401) + Zod structural validation (exactly-one conflicting/conflicted). **No semantic or social admissibility bar.** This is the gap ratification closes. |

**Key observation.** The hard part of "make defeats conditional" is usually *where to enforce it without scattering logic*. Here it's already centralised: every defeat-bearing evaluation path runs through a conflict fetch → CA-node translation. Gate that one fetch and unratified attacks are inert everywhere, while remaining fully present as records.

---

## 2. The candidate model

**2.1 Lifecycle on `ConflictApplication`.** `PROPOSED → EFFECTIVE`, plus `WITHDRAWN` / `REJECTED`. Only `EFFECTIVE` rows are translated into contraries/attacks. New CAs start `PROPOSED` (or `EFFECTIVE` immediately under policy `none`).

**2.2 Per-deliberation policy** (field on `DeliberationPref` or a sibling `DeliberationAttackPolicy`):
- `none` — CA effective on creation (today's behaviour; preserves the current UX where chosen).
- `single` — **proposed default**: one **non-author** participant signs off.
- `quorum:N` — N distinct non-author sign-offs.
- `moderator` — a facilitator/role-gated approval (rides §VI role-gating).
- `fraction` — e.g. majority of currently-active participants.

**2.3 Sign-off ledger.** A `ConflictRatification` row per sign-off (`conflictApplicationId`, `ratifierId`, `decision`, `createdAt`). When the policy threshold is met, flip the CA to `EFFECTIVE`, stamp `ratifiedAt`, and fire `recomputeGroundedForDelib`. Withdrawal that drops the count below threshold reverts to `PROPOSED` and recomputes (retraction is already first-class — fossil retractions).

**2.4 Enforcement.** The `where: { ratificationStatus: 'EFFECTIVE' }` filter in `buildDeliberationGraph` and the `/api/aspic/evaluate` conflict fetch. Nothing else in the engine changes.

**2.5 Invariants borrowed from the AI/CQ precedents.**
- **No self-ratification** (mirrors challengeCq's "no self-canonical floor") — the author's own creation never counts toward its own threshold.
- **Human-only ratifiers by default**, consistent with logicality-on-ratification.
- The CA is **always on the record** regardless of status — ratification gates *effect*, never *existence/visibility*.

---

## 3. Semantic implications: reinstatement, ratification debt, and the defeasible-periphery scoping

Worked through against the canonical reinstatement chain — A (in) ← B attacks A (A out) ← C attacks B (B out, **A reinstated**).

**3.1 Ratification preserves the grounded fixed point; it filters the subgraph and gates the timing.** Grounded extension is computed not over *all* attacks but over the **ratified defeat subgraph**. So the chain becomes a sequence of gated, attributed transitions: ratify B→A (A flips out), assert C (no edge yet — asserting is free), ratify C→B (B out, A reinstated). **If every attack eventually ratifies, the extension is identical to today's.** Ratification changes neither the semantics nor the eventual fixed point — only *which subgraph the semantics runs over* and *when* each flip happens. The non-monotonic in→out→in "bounce" still exists in principle, but each flip is now a recorded community act, not a side-effect of someone typing an attack. **This is the core value: speculative / bad-faith attacks never perturb standing; accepted ones "mean more."**

**3.2 Ratification biases the extension toward IN — and that bias *is* D2.** It raises the cost of the only operation that produces `out` (a defeat) while leaving the operation that produces `in` (assertion) free. So the system tilts toward "un-defeated." Read as a feature: a high bar to declare something refuted. Read as a risk: the status quo is harder to dislodge. Same coin — the dynamics-side view of the incumbency-asymmetry fork (§4 D2).

**3.3 Ratification debt (new — drives D11).** Under *partial* ratification the chain can rest in a state the full graph wouldn't: ratify B→A but leave C→B un-ratified, and **A stays `out` even though C exists and would reinstate it** — the defence is stuck in the queue. Call it *ratification debt*. Two readings: (i) it is **role-neutral** — the reinstating attack C→B faces the *same* bar as the original B→A, so ratification privileges neither attackers nor defenders, only "community-accepted moves perturb the graph" (a clean neutrality property); (ii) it introduces **latency asymmetry** — a window where an attack has landed but its rebuttal hasn't cleared. Whether that window is acceptable, or a reinstating attack deserves a faster/auto path, is **D11**.

**3.4 The defeasible-periphery scoping (the load-bearing justification).** Two facts make ratification the *right* tool for the *right* layer:
- **It has zero effect on the certain core.** Axioms and strict rules are unattackable — you cannot undermine an axiom, rebut a strict-only conclusion, or undercut a strict rule (the undercut generator requires a *defeasible* named rule, [`attacks.ts:218`](../../lib/aspic/attacks.ts)). The certain core is `in` regardless of ratification. Everything ratification governs lives in the defeasible periphery — which, as observed, is the vast majority of real content. Correct scoping: a periphery-governance tool, and the periphery is where all the motion is.
- **It is the *only* lever over the dominant attack modes.** Undercuts always defeat ([`defeats.ts:51-59`](../../lib/aspic/defeats.ts)) and assumption-undermines always defeat ([`defeats.ts:66-78`](../../lib/aspic/defeats.ts)) — both bypass the preference gate. Only rebuts and ordinary-premise undermines are preference-moderated. In an assumption-heavy graph the always-defeating modes dominate, so **PA-node preferences are structurally powerless over the majority case, and ratification is the one mechanism that reaches it.** This is the cleanest argument for the whole layer.

## 4. Open decision questions (the queue for the next session)

These are the forks to resolve before the dev spec. None is settled here.

- **D1 — Small-deliberation deadlock. RESOLVED (2026-06-14): hostType-seeded explicit policy.** `attackRatificationPolicy` is an explicit field on `DeliberationPref`, **defaulted at creation** by `hostType` (`free` → `none`, else → `single`) and overridable. `hostType` only *seeds* the default — it is never consulted at evaluation time — so the design needs no participation typology that doesn't exist. Solves the deadlock (personal `free` delibs don't gate). Timeout auto-ratify offered as **opt-in**, not default. **Scoping finding (2026-06-14):** the personal / open / private typology is **not wired** — `Deliberation` has no `visibility`/participant field; `free` is the de-facto personal type (Quick-Argument on-ramp); the `Visibility` enum lives on other models; `Room` carries only `kind` (realtime/async). Privacy-keyed defaults are blocked on new schema (see *Dependencies & adjacent threads*, §6).
- **D2 — Incumbency asymmetry. RESOLVED (2026-06-14): asymmetric gating + honest standing (option C).** Attacks are gated; assertions stay free (preserves the asserting-is-free on-ramp). The incumbency bias is *disclosed, not hidden*: an un-ratified-but-uncontested `in` argument carries a **provisional** label (natural-language equivalent of the existing `untested-default`), distinct from `tested-survived`. Symmetric assertion-ratification rejected (taxes contribution, fights overview §IV). The §3.2 in-bias is accepted *as surfaced*.
- **D3 — Undercuts stricter. RESOLVED (2026-06-14): defer the floor; uniform gating in v1.** A precise "undercuts can't be `none`" floor would need to target *multi-party* deliberations, but that isn't a clean field (D1 finding), and `hostType !== 'free'` is too coarse. With policy now explicit and sensibly defaulted, a `none` on a shared deliberation is a deliberate opt-in by whoever set it. Revisit a per-type / per-attack-type floor once a participation/visibility typology exists.
- **D4 — Ratifier eligibility + AI sign-offs. RESOLVED (2026-06-14): any authenticated non-author; AI human-only.** v1 lets **any authenticated non-author** ratify (simplest); **AI sign-offs do not count** toward the threshold (mirrors logicality-on-ratification — the point is a human check). **Known v1 limitation, recorded:** *not sybil-resistant* — a determined actor can post-once / sockpuppet a `single` threshold. Refinements deferred (improve resistance later, no schema churn): participant-restriction (derive participants from authored `DialogueMove`/`Argument`) → reputation-weighting (§V).
- **D5 — Unify with the CQ-challenge DISPUTED flow, or parallel? RESOLVED (2026-06-14): parallel for now; document the unification path as later work.** Code finding: a CQ challenge creates a **`ClaimEdge` + `CQAttack`** (not a `ConflictApplication`; `conflictApplicationId: null`) and recomputes the **CEG/claim-level grounded** ([`lib/ceg/grounded`](../../lib/ceg/grounded)), whereas ratification gates the **ASPIC `ConflictApplication`→defeat** path ([`lib/aspic/deliberationEvaluation.ts`](../../lib/aspic/deliberationEvaluation.ts)). **Two grounded engines already run in parallel.** Ratification governs the ASPIC path; the CQ-DISPUTED flag stays the CEG path's own marker. Both adopt the **same conceptual model** (on-record-but-not-effective, no self-ratification) so a later convergence is clean. The two-engines convergence is **out of this spec's scope** (see Later Work, §6).
- **D6 — Pending-state surfacing + notification. RESOLVED (2026-06-14): provisional standing label + notification pipeline.** Surface a `PROPOSED` CA via (i) a **standing label** — "contested · pending k/N" reusing the D2 *provisional* vocabulary, visually distinct from "defeated" — and (ii) the **existing notification pipeline** (notify the target's author + active participants when a CA needs ratification and when it clears). A per-deliberation pending-ratifications queue + facilitation-equity backlog are optional secondary surfaces left to the dev spec.
- **D7 — Policy mutability mid-deliberation. RESOLVED (2026-06-14): mutable + grandfather.** The policy can change mid-deliberation (a legitimate facilitator act). Already-`EFFECTIVE` CAs stay effective — tightening **never** retroactively demotes; loosening **may** auto-promote `PROPOSED` CAs that now clear the lower bar. Keeps standing free of retroactive yanks (same "no silent standing changes" theme as the migration backfill).
- **D8 — Revocation semantics. RESOLVED (2026-06-14): withdrawal demotes; v1 states PROPOSED/EFFECTIVE/WITHDRAWN.** A ratifier may withdraw a sign-off; if that drops an `EFFECTIVE` CA below threshold it demotes to `PROPOSED` and standing recomputes — **but withdrawal is itself a deliberate, recorded, accountable act** (same friction as the original sign-off), so reversal is meaningful, not casual churn (preserves "every transition is a deliberate recorded event"). The CA *author* may retract the whole CA → terminal **`WITHDRAWN`** (fossilised). v1 lifecycle = **`PROPOSED ⇄ EFFECTIVE`, `→ WITHDRAWN`**; **`REJECTED`** (explicit deliberation-level vote-down) is **reserved for the `moderator`/governance path**, deferred with the deliberation-creation dependency.
- **D9 — Scope of gating. RESOLVED (2026-06-14): uniform.** The policy gates all CA types equally in v1 (undercut / rebut / undermine). Per-attack-type policies are a future refinement, coupled with the deferred D3 floor.
- **D10 — Subsumes the `/api/ca` hardening gap? RESOLVED (2026-06-14): confirmed — no separate semantic bar in v1.** Where a non-`none` policy is in force (shared deliberations), ratification gates the attack→defeat edge *upstream of* the always-defeats rule, so a bogus undercut can be created but cannot take effect unratified — the semantic-admissibility concern is subsumed. The residual `none`-policy case is **personal `free`** deliberations, which are single-author (negligible abuse vector). No separate `/api/ca` admissibility bar needed. **Orthogonal hygiene (optional):** cheap *referential* validation at `/api/ca` (does the conflicted element exist in this deliberation?) is fine to add — it is well-formedness, not a gibberish judge.
- **D11 — Ratification debt / reinstatement latency (from §3.3). RESOLVED (2026-06-14): accept the latency; surface it.** Reinstating attacks face the *same* bar — preserving role-neutrality and avoiding both the "is-this-reinstating?" detection and its gaming vector (mislabelling an attack as reinstating to skip the bar). The debt is made **visible** by the D6 pending label (a target can read as `out` with a pending attack on its defeater), so it is surfaced, not hidden — consistent with the D2 honesty principle. Revisit a reinstatement fast-path only if usage shows debt is a real pain point.

---

## 5. Decisions recorded (resolved / parked / conjecture)

- **Resolved (architecture):** ratification gates the **attack→defeat seam**, enforced as a `ratificationStatus` filter at `buildDeliberationGraph` (+ the evaluate conflict fetch). The CA stays on the record regardless of status. This is the load-bearing design commitment everything else hangs on.
- **Resolved (consistency invariants):** no self-ratification; human-only ratifiers by default; ratification gates *effect*, never *existence/visibility* — mirroring the AI-logicality and CQ-challenge precedents.
- **Lean (not resolved — D1):** default policy keys off deliberation type (`none` personal / `single` facilitated), with optional timeout auto-ratify, rather than a global `single`.
- **Parked (D2):** symmetric assertion-ratification — flagged as the deepest fork; off the build path unless explicitly chosen.
- **Conjecture/observation (D10):** ratification **subsumes** the raw-`/api/ca` undercut-hardening gap, because it gates the attack→defeat edge *upstream of* the always-defeats rule — so a bogus undercut can be created but cannot take effect unratified. To be confirmed against whether `/api/ca` still wants its own bar.
- **Resolved (semantics — §3):** ratification **preserves the grounded fixed point** — it filters the subgraph and gates transition timing, not the semantics; it **biases the extension toward `in`** (the dynamics-side view of D2); it has **zero effect on the axiom/strict core**; and it is the **only lever** over the always-defeating undercut / assumption-undermine modes that PA-node preferences cannot reach. The last point is the load-bearing justification for the layer.
- **Resolved (policy mechanics — D1/D3/D7/D9, 2026-06-14):** policy is an **explicit, overridable `attackRatificationPolicy` on `DeliberationPref`**, defaulted at creation by `hostType` (`free`→`none`, else→`single`); **gating is uniform** across attack types in v1; policy is **mutable mid-deliberation with grandfathering** (no retroactive demotion); the undercut floor and per-attack-type policies are **deferred** pending a participation/visibility typology. Self-ratification disallowed; timeout auto-ratify is opt-in.
- **Resolved (eligibility + UX — D4/D6/D11, 2026-06-14):** any **authenticated non-author** ratifies (v1 — **not sybil-resistant**; participant/reputation gating deferred); **AI sign-offs don't count** (human-only); pending CAs surfaced via a **provisional / "pending k/N" standing label + the notification pipeline**; **ratification debt accepted and surfaced** (no reinstatement fast-path).
- **Resolved (lifecycle + subsumption — D8/D10, 2026-06-14):** withdrawal demotes `EFFECTIVE`→`PROPOSED` (deliberate/recorded; recompute), author retraction → `WITHDRAWN`; **v1 states `PROPOSED`/`EFFECTIVE`/`WITHDRAWN`**, `REJECTED` deferred with the `moderator` path. Ratification **subsumes** the `/api/ca` semantic-admissibility gap wherever a non-`none` policy is in force; no separate bar in v1 (optional cheap referential check).
- **All eleven decisions D1–D11 are resolved (2026-06-14).** The design is fixed; the file is ready to seed the dev spec (§6).

**No-premature-premise rule honored:** no production schema touched; no conjecture promoted; the model in §2 is a candidate, not a commitment.

---

## 6. Path to the dev spec

1. ~~**Resolve D1–D11**~~ — **DONE (2026-06-14).** All eleven settled (§4/§5).
2. **Dev spec** — **READY TO BUILD (fleshed out 2026-06-14):** [`docs/ATTACK_RATIFICATION_DEV_SPEC.md`](../../docs/ATTACK_RATIFICATION_DEV_SPEC.md). Concrete schema delta (`ConflictApplication.ratificationStatus String @default("EFFECTIVE")` — the default *is* the backfill — + `ratifiedAt`; new `ConflictRatification` ledger; nullable `DeliberationPref.attackRatificationPolicy`); on-demand `resolveRatificationPolicy` (derives `hostType` default → **touches zero create sites**); the §4 enforcement filter; ratify/withdraw/retract API with the self-ratification + AI-exclusion guards; provisional standing label; staged reversible rollout. **Two findings carried into the spec:** ASPIC standing is on-demand so ratification needs no recompute job (the CEG `recomputeGroundedForDelib` is a *separate* engine, D5); and the `Notification` model is BigInt/social-shaped, so wiring needs a new `notification_type` + a deliberation/CA reference (the only schema addition beyond the core).
3. **Build** against the spec, recorded in an implementation log here (mirroring [11b](11b-practical-reasoning-enhancements-2026-06-12.md)).

> **Migration safety note (pre-recorded for the spec):** introducing the filter without backfilling every existing `ConflictApplication` to `EFFECTIVE` would silently drop all current defeats from every deliberation's standing. The schema delta and the backfill must ship together.

### Dependencies & adjacent threads (out of this spec's scope)

- **Deliberation-creation UX (separate dev thread — SPEC SKELETON SEEDED 2026-06-14: [`docs/DELIBERATION_CREATION_DEV_SPEC.md`](../../docs/DELIBERATION_CREATION_DEV_SPEC.md)).** Today the main creation pathway is **article-attached auto-creation** (the deliberation is minted alongside the article); there is no smooth "create a deliberation from scratch" flow. A first-class flow — e.g. a **"New deliberation"** entry on the Agora home, **name-at-creation** (editable), and assignment of **visibility** and **governance / moderators** — is a prerequisite for two ratification features that are *parked* on it: (i) **privacy-keyed policy defaults** (needs the visibility typology D1 found missing), and (ii) a meaningful **`moderator` policy option** (needs governance roles to exist on the deliberation). Spun up as its own dev thread; ratification v1 ships without it (hostType-seeded default + explicit override do not depend on it).

### Later work (out of this spec's scope)

- **Two-grounded-engine convergence (from D5).** The platform runs two grounded computations in parallel: **CEG / claim-level** (`ClaimEdge` + `CQAttack`, recomputed via [`lib/ceg/grounded`](../../lib/ceg/grounded), driven by the CQ-challenge DISPUTED flow) and **ASPIC** (`ConflictApplication`, [`lib/aspic/deliberationEvaluation.ts`](../../lib/aspic/deliberationEvaluation.ts) / `GET /api/aspic/evaluate`). Ratification gates the ASPIC path now; both adopt the same on-record-but-not-effective vocabulary so a future merge is clean. Whether the two engines *should* converge (and onto which) predates ratification and is its own architectural question — file separately when it surfaces.

### Theory-spine seams (analysis only — no obligation on this spec)

Ratification operates on the layer that *produces* the abstract AF `⇝` the Dung–Ludics bridge consumes, so it composes with the theory spine as an upstream AF transformation rather than colliding with any theorem. Three contact points, recorded so the links are discoverable from the theory side:

- **A candidate `{B_t}` driver for [Q-005 / C005](../01_OPEN_QUESTIONS_REGISTRY.md#q-005).** The §3.1 sequence of ratification flips *is* a directed system: each flip is a recorded transition `F_t → F_{t+1}` adding one attack edge to the ratified subgraph, and "if every attack eventually ratifies, the extension is identical to today's" is a colimit statement (`F_full` = colimit). Registered as a `candidate-driver` on Q-005 — a product-grounded, fully-attributed instance to test the directedness/colimit check against, instead of a synthetic sequence.
- **A scoping note for the additive frontier ([session 12](12-additive-frontier-preferred-stable-multiagent-2026-06-14.md) §3.1).** [T005](../02_THEOREMS_AND_PROOFS/T005-grounded-ludics-keystone.md) is parametric in `F`, so running the bridge on the ratified subgraph `F_rat` is benign for **grounded**. **Preferred/stable are edge-sensitive**, and *ratification debt* (§3.3) is exactly a partial subgraph — so the preferred-axis lift (C011) inherits a "which subgraph (full vs ratified)" obligation and the realizability fallback gains a governance dimension. Noted there as a scoping obligation, not an obstruction.
- **Honesty alignment (D2 ⇄ bridge scoping).** Once production runs the bridge on `F_rat`, "standing is a theorem" is honestly "standing-over-the-ratified-subgraph is a theorem" — the proof-layer twin of D2's provisional / `tested-survived` standing labels. The two honesty disciplines reinforce: an `in` argument can truthfully read both "un-defeated in the ratified subgraph" (governance) and "winning by interaction over that subgraph" (proof).
- *(Speculative, not wired.)* Resonance with the **participant axis** ([Q-002 / C002](../03_CONJECTURES/C002-reading-c-conservative.md)): ratification decides which community-accepted moves perturb the graph, which rhymes with Reading C's behaviour-borne Opponent / witness-set membership — but they live at different layers (pre-translation AF vs post-translation Ludics), so this is a thematic note, not a dependency.
