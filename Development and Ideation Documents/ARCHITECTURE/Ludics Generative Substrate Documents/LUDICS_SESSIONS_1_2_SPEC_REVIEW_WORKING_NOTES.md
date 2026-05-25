# Sessions 1 & 2 Spec Review — Working Notes

**Purpose:** Scratch / accumulating workspace for the read-only spec-quality
review driven by [LUDICS_SESSIONS_1_2_SPEC_REVIEW_PROMPT.md](./LUDICS_SESSIONS_1_2_SPEC_REVIEW_PROMPT.md).
Distilled into the final deliverable
`LUDICS_SESSIONS_1_2_SPEC_REVIEW.md` at Round 7.

**Specs under review:**
- [LUDICS_SESSION_1_DEV_SPEC.md](./LUDICS_SESSION_1_DEV_SPEC.md)
- [LUDICS_SESSION_2_DEV_SPEC.md](./LUDICS_SESSION_2_DEV_SPEC.md)

**Round plan:**
1. Read all §0 inputs (substrate + post-spec resolutions + specs themselves).
2. Pass A — Session 1 phases 1a–1g (substrate↔contract fidelity).
3. Pass A — Session 2 phases 2a–2f.
4. Pass B — Session 1 architectural commitments.
5. Pass B — Session 2 architectural commitments.
6. §4 cross-cutting + regret-check inventory.
7. Compile deliverable.

---

## Round 1 — Orientation

### §0 inputs read in full

| Doc | Lines | Role |
|---|---|---|
| `LUDICS_GENERATIVE_SUBSTRATE.md` | 625 | Tier-1 substrate; 8 regions; T1–T5; Reading C. |
| `LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md` | 710 | ι with I1–I4; exposure map E(D_P); witnessing record; announcement discipline A1–A4. |
| `LUDICS_OPEN_COMPOSITION_JOINT.md` | 450 | Sessions 0c–0e (open behaviours, fossils, subordination, joint saturation J1–J3). |
| `LUDICS_TRIADS_BRIDGE_AND_CLOSURE_JOIN.md` | 421 | Session 0f Triads instance for Reading C; ∨_⊥⊥ join; four algebraic checks restricted to Inc(B). |
| `LUDICS_TRIADS_CLOSURE_AND_CONFIDENCE_ERASURE_FUNCTOR.md` | 536 | Session 0g; CQ1/CQ2/CQ3 proved; U functor; F⊣U adjunction; ε surjectivity = 0g-OQ1. |
| `LUDICS_CONSOLIDATION_AND_DEV_READINESS.md` | 292 | Session 0h; claims register C1–C20 + N-C21–25; tier-map; 12 Tier-1 constructs license Phase 1. |
| `LUDICS_OQ_JSL_PROOF.md` | 175 | Phase 2e; **dated 2026-05-21 — POST both specs**; OUTCOME B mis-attribution + structural refinement. |
| `LUDICS_ORDER_RELATION_DEFINITION.md` | 308 | Phase 2f pre-session; **dated 2026-05-21 — POST both specs**; pins ≤_⊆ as literal chronicle-set inclusion (Reading A); Daimon Lock Lemma. |
| `LUDICS_SESSION_1_DEV_SPEC.md` | 1184 | Written 2026-05-19, completed 2026-05-20. |
| `LUDICS_SESSION_2_DEV_SPEC.md` | 985 | Written 2026-05-20. |

### Timeline pressure (the regret-check fault line)

- Both specs were written **before** Phase 2e and the Phase 2f pre-session, so both spec under the (now-known-false) C1 claim that `(Inc(B), ≤_⊆, ∨_⊥⊥)` is a JSL with a unique bottom |B|.
- Phase 2e (2026-05-21) verdict: **OUTCOME B mis-attribution.** Inc(B) is an antichain; ∨_⊥⊥ exits Inc(B) for every distinct pair; (B, ≤_⊆) decomposes into disjoint cones; **no cross-cone joins exist anywhere in B**.
- Phase 2f pre-session (2026-05-21) verdict: ≤_⊆ is **literal chronicle-set inclusion** (Reading A); Daimon Lock Lemma — designs in same cone share daimon skeleton, differ only in negative branches; within a cone, union = literal ∪ is the join (Outcome I); flagged OQ-C3-thin-cones.

### Key facts that shape the review

1. **Invariant-label collision.** Substrate I1–I4 ([LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md] §1.3) = records-only / idempotence / locus-injectivity / totality-modulo-extension. Spec I1–I4 (Session 1 §1 Cluster D `invariantChecks`) = existing-locus / existing-structure / canon-pipeline-gated / scheme-typed. Same labels, different sets.
2. **C3 per-cone reframe** (forced by Phase 2e) means any spec text depending on global C3, on `compute_articulation_join` as a binary op, or on a unique `bottom` field needs re-evaluation.
3. **OQ-fidelity was open** when Session 1 §3 wrote the 6-dim scorecard; Phase 2f resolved it with `DependencyEdge` + `chain-direction-reversal` (per [LUDICS_CONSOLIDATION_AND_DEV_READINESS.md]). Spec is under-specified relative to what was eventually built.
4. **Intra-spec incoherence already visible:** R5 threshold is `≥ 10` in S1 §5.3 but `> 5` in S1 §3.3 metrics table; Phase 1f delivery note says implementation used 5.
5. **Session 2 §5 (the Phase 2e prompt)** as written predicts the proof will confirm and only conditionally handles a counterexample. The actual outcome was the counterexample, so §5's instructions are stale.

---

## Round 2 — Pass A on Session 1 (phases 1a–1g)

Rating scale: **FAITHFUL** / **LOSSY** (drops information, soft-correct) / **DISTORTED** (changes meaning, hard-wrong) / **OVER-COMMITTED** (asserts more than substrate licenses) / **UNDER-COMMITTED** (silent on something substrate requires).

For each item: **Substrate artefact → spec contract → rating → note**.

### Phase 1a — DB schema (§4.1)

#### A1.1 `LudicMove`
- **Substrate:** Moves in 𝒟_P are nodes in the Ludics design; loci are stable addresses; polarities are {positive, negative, daimon (𝔷)}; "inference" is not a Ludics polarity.
- **Spec:** `moveType: String // "positive" | "negative" | "inference"`.
- **Rating: DISTORTED (low-severity).** The substrate's third polarity is **daimon (𝔷)**, not "inference" ([LUDICS_ORDER_RELATION_DEFINITION.md] §2 Def 2.5). "Inference" appears to be a Mesh-layer concept conflated into the Ludics polarity slot. The Daimon Lock Lemma (Phase 2f) depends critically on daimon being a recognized positive action — there is no way to record a daimon-terminated chronicle with this enum.
- **Unstated assumption:** `stratumLabel` is stored as a column, implying stratum is a property of the move. Substrate defines stratum *relative to the current 𝒟_P and current σ(𝒟_P)* — it shifts as the deliberation evolves. Storing it as a column makes it a denormalized cache; spec doesn't say when it is recomputed.

#### A1.2 `WitnessRecord`
- **Substrate:** Witnessing record Witness(m, w, t, P) = relation external to both layers ([LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md] §1.2 + Region D).
- **Spec:** `ludicMoveId, dialogueMoveId @unique, participantId, canonicalText, schemeKey, timestamp, fossilizedAt, retractReason`.
- **Rating: FAITHFUL.** I3 (distinct W₁ ≠ W₂ for same m → two tuples) is preserved (same `ludicMoveId`, different `dialogueMoveId`). I2 (idempotence on same canonical W) is enforced by `dialogueMoveId @unique`. ✅

#### A1.3 `Design`
- **Substrate:** Design = set of chronicles, finitely-generated, indexed by behaviour; `biorthoClass` = ⊥⊥-equivalence class within a behaviour.
- **Spec:** `Design { behaviourId, deliberationId, loci, premiseClaimIds, biorthoClass, derivedBy }`.
- **Rating: LOSSY → DISTORTED (post-2e).**
  - **LOSSY:** A design is a *set of chronicles*, not a set of loci. `loci: String[]` is the projection onto the locus skeleton — useful but throws away the chronicle structure that the Daimon Lock Lemma rests on. Fossil discipline and the very definition of ⊆ on designs need chronicle-level data. Spec is silent on where chronicles are stored.
  - **DISTORTED (post-2e):** `biorthoClass` as a single hash over the equivalence class is incompatible with cone decomposition. Two designs in different cones cannot be ∼_⊥⊥-equivalent (different incarnations), so the class hash should at least include `incarnationDesignId` (the cone id). As stored, `find_equivalent_articulations` can return cross-cone designs that are *necessarily* inequivalent.
- **Unstated assumption:** `derivedBy: "join" | "meet" | "compression"` — but Phase 2e shows cross-cone joins/meets do not exist; spec needs a `"join-failed"` state or terminal error path for cross-cone attempts.

#### A1.4 `Behaviour`
- **Substrate:** B = B^⊥⊥, principal at root locus.
- **Spec:** `Behaviour { deliberationId, rootLocus, designs }`.
- **Rating: FAITHFUL,** but **UNDER-COMMITTED** on Inc(B): no `incarnations` relation or `cones` table. Post-Phase-2e the cone decomposition B = ⨆ Cᵢ is structural; not surfacing it in the schema leaves all per-cone discipline (correct C3, correct JSL, correct Art(B)) to application code.

#### A1.5 `DesignInclusion` (added in 1e but listed in 1a delivery record)
- **Substrate:** ≤_⊆ on B is **literal chronicle-set inclusion** (Phase 2f Reading A). Cross-cone edges are impossible (Phase 2e §5.2 Cross-Cone Incompatibility).
- **Spec:** Hasse-DAG edges `{from, to}`, flat across the behaviour.
- **Rating: OVER-COMMITTED.** Schema permits semantically impossible cross-cone edges. No constraint enforces same-cone-only; no constraint enforces Daimon Lock (a `to` design cannot have chronicles past a `from` design's daimon point).

### Phase 1b — Write seam (`bind_participant_to_design`)

#### A2.1 The I1–I4 label collision
- **Substrate I1–I4** ([LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md] §1.3):
  - I1 = Records-only (no structural change to 𝒟_P)
  - I2 = Idempotence under repeated promotion
  - I3 = Injectivity on Ludics side modulo locus equivalence
  - I4 = Totality over canonical pipeline modulo extension (delocation signal)
- **Spec I1–I4** (Cluster D `invariantChecks`):
  - I1 = existing-locus
  - I2 = existing-structure
  - I3 = canon-pipeline-gated
  - I4 = scheme-typed
- **Rating: DISTORTED.** Same labels, *different sets*. The spec set is the gate-check side of substrate **I1 only** (records-only ⇒ locus must exist + structure must exist + canonical text required + scheme typed). Substrate I2 (idempotence) is *not* a returned check (the `dialogueMoveId @unique` enforces it implicitly but no `I2_idempotent` field surfaces it). Substrate I3 (locus injectivity) is *not* checked. Substrate I4 (totality / delocation signal) matches the `409 DELOCATION_REQUIRED` error path — but is renumbered.
- **Recommended action:** Rename the spec's `invariantChecks` to `gate_locusExists / gate_moveExists / gate_canonGated / gate_schemeTyped` and add a separate `substrateI1_recordsOnly / I2_idempotent / I3_locusInjective / I4_total` block tied to the substrate invariants by name.

#### A2.2 Delocation
- **Substrate:** Delocation = structural extension of 𝒟_P by adding a locus; signaled by I4 partiality ([LUDICS_GENERATIVE_SUBSTRATE.md] Region B; [LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md] §1.3 I4).
- **Spec:** `409 DELOCATION_REQUIRED` when `ludicMoveId` is absent from current 𝒟_P.
- **Rating: FAITHFUL.** **UNDER-COMMITTED** on *who* may perform delocation: substrate is explicit that delocation is a separate operation with its own authority discipline; spec does not mention the companion delocation endpoint or its auth model.

#### A2.3 Routing the four call sites
- **Spec claim** (Phase 1b step 5): "Route all four existing call sites (`CommitmentLudicMapping`, `propose_warrant`, `applyToCS`, 'Promote to Ludics') through the write seam."
- **Substrate** ([LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md] §1.4) names exactly these four as instances of ι at different granularities.
- **Rating: FAITHFUL.** Architectural commitment matches the substrate's unification claim. (Pass-B will challenge whether all four should converge on the same write seam or whether granularity should be preserved.)

### Phase 1c — Witnessing reads (Cluster C)

#### A3.1 `get_witnesses` (anonymous-default)
- **Substrate:** T3′ (anonymous polarity) + T4 (dialectical/witnessing separation): dialectical-layer surface is participant-anonymous; identity is opt-in ([LUDICS_GENERATIVE_SUBSTRATE.md] §5; [LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md] §2).
- **Spec:** `includeIdentity: false` by default; `participantId` omitted unless explicit.
- **Rating: FAITHFUL.** Best-fit translation.

#### A3.2 `get_unwitnessed_exposure`
- **Substrate:** E_o ∪ E_ℓ = witnessable + latent strata of the exposure map (σ(𝒟_P)^⊥ minus walked) ([LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md] §2).
- **Spec:** Anti-join `LEFT JOIN WitnessRecord WHERE WitnessRecord.id IS NULL`, filtered by stratum.
- **Rating: FAITHFUL** at the projection level. **UNDER-COMMITTED** on exposure-map computation: presupposes `LudicMove.stratumLabel` is correct but doesn't say when it is recomputed after writes. If the bind seam doesn't relabel walked-vs-witnessable for affected loci, this tool returns stale data.

#### A3.3 `get_instantiation` (the ι inverse)
- **Substrate:** Inverse of ι is the projection π_m : Witness → 𝒟_P.
- **Spec:** `{instantiated, ludicMoveId, locus, moveType, wouldTriggerDelocation}` or `{instantiated: false, wouldTriggerDelocation, candidateLocus}`.
- **Rating: FAITHFUL.** `candidateLocus` is a useful over-commitment — substrate doesn't specify the delocation candidate, spec usefully concretizes "what locus would be added."

### Phase 1d — Structural reads (Clusters A + F)

#### A4.1 `get_exposure_map`
- **Substrate:** E(𝒟_P) = σ(𝒟_P)^⊥ partitioned into walked / witnessable / latent ([LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md] §2). Topology layer in Region B of substrate.
- **Spec:** `strata.{walked, witnessable, latent}` + `topology.{hubSet, loadBearingRanking, totalNodes}`; `stratifyDepth` parameter.
- **Rating: FAITHFUL.** `stratifyDepth` default 1 matches substrate ("small k, e.g. 1"). `max 5` is a spec choice; substrate doesn't bound it.
- **UNDER-COMMITTED:** spec doesn't define E_w / E_o / E_ℓ semantics in the tool description; just labels. A reader of the spec alone cannot tell what "witnessable" means without the substrate doc.

#### A4.2 `get_behaviour_at_locus`
- **Substrate:** B_ℓ at locus ℓ ([LUDICS_OPEN_COMPOSITION_JOINT.md] §0c open behaviours).
- **Spec:** `{behaviourId, locus, incarnationCount, incarnations[], bottom}` — singular `bottom`.
- **Rating: DISTORTED (post-2e).** `bottom: "des_..."` (singular) presupposes a unique minimum. Phase 2e: Inc(B) is an antichain; |Inc(B)| can be ≥ 2. There is no global bottom of B; each cone has its own bottom. Field should be `bottoms: string[]` or `bottomPerCone: Record<coneId, designId>`.

#### A4.3 `get_deliberation_schema`
- **Substrate:** Layered 𝒯_L = (P_L, N_L, ⊥_L) triad; T4 says witness layer is structurally separate.
- **Spec:** Bundles `designTree` (dialectical) + `witnessingSummary` (witness) in one response with explicit walked/witnessable/latent counts.
- **Rating: FAITHFUL.** Explicit separation inside one payload is the right T4 translation.
- **Unstated assumption:** `coverageRatio = walkedLoci / locusCount` is a Mesh-layer original (not substrate-defined). Defensible MCP-product choice but flag as such.

### Phase 1e — Articulation lattice (Cluster B)

#### A5.1 `get_articulation_lattice`
- **Substrate:** Art(B) = (Inc(B), ≤_⊆, ∨_⊥⊥) — the spec writes this exactly.
- **Spec:** `incarnations[]`, single `bottom`, `edges` as inclusion-order DAG.
- **Rating: DISTORTED (post-2e).** Two distortions:
  1. Single `bottom`: same defect as A4.2 — Inc(B) is an antichain of bottoms, one per cone.
  2. `edges` as inclusion-order DAG over `incarnations`: post-2e §5.1, Inc(B) is an *antichain* — there are *no* edges among incarnations. If the lattice is truly (Inc(B), ≤_⊆), `edges` is always empty; if it is actually (B, ≤_⊆) with annotations, that's a different structure but the response shape says "incarnations" not "designs." Title and data shape disagree post-2e.
- **Right shape:** return the *cones* of B, each as a within-cone Hasse DAG with bottom = the cone's incarnation.

#### A5.2 `find_minimal_incarnations`
- **Substrate:** Minimal elements of B under ≤_⊆ = exactly Inc(B) (Fouqueré–Quatrini 2013 uniqueness).
- **Spec:** `{ minimals: DesignSummary[] }`.
- **Rating: FAITHFUL.** Plural by design — the one Cluster-B tool actually correct under cone decomposition.

#### A5.3 `find_equivalent_articulations`
- **Substrate:** ∼_⊥⊥ class within B. Post-2f: same-class designs share an incarnation; equivalence is *within a single cone*.
- **Spec:** Query `Design` rows by same `biorthoClass`.
- **Rating: DISTORTED.** Without including cone identity in `biorthoClass`, two designs in different cones with coincidentally-equal hashes would be returned as "equivalents" but are formally inequivalent. The schema permits the bug.

#### A5.4 `find_substitute_premises`
- **Substrate:** Search over Inc(B_claim) filtering by `premiseClaimIds`.
- **Spec:** Filter incarnations whose `premiseClaimIds` is disjoint from `drop`; `unreachable: true` if none.
- **Rating: FAITHFUL.** Premise-tracking is a Mesh-layer concept tucked onto Ludics designs; substrate doesn't require it but doesn't forbid it.
- **UNDER-COMMITTED** on the substrate-side *necessity proof*: `unreachable: true` is the operational analogue of "the argument is genuinely load-bearing on each dropped premise," which follows from Inc(B) enumeration *only if Inc(B) is computed completely*. Spec is silent on completeness.

#### A5.5 `compress_articulation` (meet)
- **Substrate:** Meet D₁ ∧ D₂ in Art(B) — greatest lower bound under ≤_⊆.
- **Spec:** `{ meet, incomparable }`. Doc-comment: "incomparable: false, meet: null should not occur (the bottom |B| is always a lower bound when B is principal)."
- **Rating: DISTORTED (post-2e).** Doc-comment is wrong. There is no global |B|; each cone has its own bottom. Two designs in different cones have *no* common lower bound in B (Cross-Cone Incompatibility). The output schema accidentally lands in the right shape; the explanatory text needs replacement.

#### A5.6 `compute_articulation_join` ⚠️ *largest single Pass-A finding*
- **Substrate (post-2e):** ∨_⊥⊥ on Inc(B) is **not a binary operation**. Cross-cone inputs have no join in B at all. Same-cone inputs join via literal chronicle-set union (Phase 2f Reading A).
- **Spec:** `{ join: DesignSummary, newLoci, closureSteps }`. Unconditional success shape; the only error-like signal is the `incomparable` flag on `compress_articulation`, *not* on `compute_articulation_join`.
- **Rating: OVER-COMMITTED and DISTORTED.**
  - **OVER-COMMITTED:** assumes every `(designIds[2])` input has a join.
  - **DISTORTED:** `closureSteps` is a ⊥⊥-closure round counter; post-2f the join *within a cone* is literal ∪ (no closure rounds needed); `closureSteps > 0` would actually evidence (a) cross-cone inputs (no join exists) or (b) operation on a different definition of ∨.
- **Required additions** (from [LUDICS_OQ_JSL_PROOF.md] §6 "Required edits"):
  - Add `joinIsMinimal: boolean`.
  - Validate same-cone (|D₁|_B = |D₂|_B); error on cross-cone.
  - Doc-comment: result is in C_i ⊆ B, *not* in Inc(B) unless D₁ = D₂.
- **Regret-check priority: HIGHEST.**

#### A5.7 Backing-claim labels across Cluster B
- All six tools cite C1 as "Tier 1 confirmed-with-caveat." Post-2e: C1 is **Corrected** ([LUDICS_OQ_JSL_PROOF.md] §6). Stable tier annotation in spec is now misleading.
- **Rating: DISTORTED.** Sweep the backing-claims field of every Cluster B tool.

### Phase 1f — Fossil record + briefing fingerprint

#### A6.1 `get_fossil_record`
- **Substrate:** Fossil-record discipline ([LUDICS_OPEN_COMPOSITION_JOINT.md] §0c): retracted moves preserve **locus back-pointer** + reason; not hard-deleted.
- **Spec:** `WHERE fossilizedAt IS NOT NULL`; `retractReason ∈ {argument_superseded, locus_deleted, design_excised, manual_retract}`.
- **Rating: FAITHFUL** on back-pointer + retain-not-delete. **UNDER-COMMITTED** on the substrate-side distinction between "fossil because locus is gone" (Ludics-side excision) vs. "fossil because the act was rescinded" (witness-side rescission). Spec collapses both into one `fossilizedAt` with a `retractReason` tag; layered separation T4 implies these are different layers.

#### A6.2 Briefing fingerprint (§5)
- **Substrate:** Briefing fingerprint is Tier-2 (N-C24) — correctly flagged as "structural conjecture."
- **Spec:** SHA256 over `{hubSet, loadBearingRanking, openExposurePoints, refusalSurface.cannotConcludeBecause, prioritizedOpenCqs[0..14]}`; five rules R1–R5; in-memory `Map` cache.
- **Rating: FAITHFUL** with **intra-spec incoherence:** §5.3 R5 fires on `openExposurePoints` increase by `≥ 10`; §3.3 metrics table uses `> 5`; Phase 1f delivery note says implementation used 5.
- **UNDER-COMMITTED** on **partial-region** scoping: substrate ([LUDICS_OPEN_COMPOSITION_JOINT.md] §0e J1–J3) defines saturation as composable over **regions**; spec computes the fingerprint over the *whole* deliberation. The purpose statement calls it a "partial-region hash" but the hash is global.
- **UNDER-COMMITTED** on **invalidation events**: spec is silent on what triggers fingerprint recomputation (on every read? on write? lazily?).

#### A6.3 The five rules R1–R5
- R1 (hub mutation), R2 (refusal-surface extension), R3 (top-5 load-bearing shift), R4 (CQ priority inversion / new hub-targeting CQ in top 15): **FAITHFUL** to Region B topology.
- R5 (coverage collapse): see A6.2 inconsistency.
- All five rest on Tier-2 N-C24 (correctly flagged).

### Phase 1g — Scorecard + manifest extensions

#### A7.1 Structural manifest (§2)
- **Substrate:** Manifest fields must be (a) graph-deterministic, (b) backed by a named substrate construct, (c) falsifiable against LLM output. The manifest itself is a Mesh-layer original-to-track artifact.
- **Spec:** Nine fields enumerated; four NLP fields explicitly excluded.
- **Rating: FAITHFUL** to the substrate's tier-2 manifest discipline. **OVER-COMMITTED for Phase 1:** `incarnationSet` is listed in §2.2 but §6 (1g delivery) explicitly notes it was not wired — punted to Session 2 Phase 2b. Spec / build mismatch the spec itself acknowledges.
- **UNDER-COMMITTED** on **OQ-fidelity closure deltas**: Phase 2f consolidation added `DependencyEdge` and `chain-direction-reversal`. Spec's six dimensions predate that closure.

#### A7.2 Scorecard (§3)
- **Substrate:** OQ-fidelity was **open** when this spec was written. Spec implicitly *answers* OQ-fidelity by enumerating six dimensions.
- **Rating: UNDER-COMMITTED.** Six dimensions are reasonable but spec doesn't *prove* (or argue) that these six are sufficient to detect any release-blocking LLM error. Substrate would benefit from a coverage argument; absent.
- **Intra-spec incoherence (repeats A6.2):** §3.3 threshold `> 5` vs. §5.3 R5 threshold `≥ 10`.
- **`ConfidentMisstatementKind` enum** — four values listed implicitly (hub-topology-collapsed, refused-conclusion-asserted, cq-priority-inverted, coverage-exposure-zero): **FAITHFUL** under the Mesh-layer scorecard discipline; **UNDER-COMMITTED** on closure (no `incarnation-undercount`, no `dependency-edge`, no `chain-direction-reversal`).

#### A7.3 T4 non-attribution invariant (§4.2)
- **Substrate:** T4 says the dialectical layer's *structure* is independent of participant identity ([LUDICS_GENERATIVE_SUBSTRATE.md] §5 T4).
- **Spec:** Response-layer middleware strips `participantId` from dialectical-layer tool responses; `get_witnesses`/`get_fossil_record`/`bind_participant_to_design` are the only three carriers of identity.
- **Rating: FAITHFUL** — explicit, testable, belt-and-suspenders.
- **Minor over-reach:** `get_fossil_record` returns identity by default (no `includeIdentity` parameter). Substrate T3′ would suggest fossil reads should also default to anonymous unless requested. Spec elects "fossil = provenance" framing.

### Round 2 summary

**Severity tally (by phase):**

| Phase | FAITHFUL | LOSSY | DISTORTED | OVER-COMMITTED | UNDER-COMMITTED |
|---|---|---|---|---|---|
| 1a (DB) | 1 (A1.2) | 1 (A1.3) | 2 (A1.1; A1.3) | 1 (A1.5) | 1 (A1.4) |
| 1b (Write seam) | 1 (A2.2) | 0 | 1 (A2.1) | 0 | 2 (A2.2; A2.3) |
| 1c (Witness reads) | 3 | 0 | 0 | 0 | 1 (A3.2) |
| 1d (Structural reads) | 2 | 0 | 1 (A4.2) | 1 (A4.1) | 1 (A4.1) |
| 1e (Articulation) | 1 (A5.2) | 0 | **5** (A5.1, A5.3, A5.5, A5.6, A5.7) | 1 (A5.6) | 1 (A5.4) |
| 1f (Fossil + fingerprint) | 1 | 0 | 0 | 0 | 3 (A6.1, A6.2 region, A6.2 invalidation) |
| 1g (Scorecard) | 2 | 0 | 0 | 1 (A7.1) | 3 (A7.1, A7.2, A7.3) |

**Top-3 highest-impact Pass-A findings (Session 1):**
1. **A5.6 `compute_articulation_join`** asserts joins always exist; post-2e they don't for cross-cone inputs. The whole Cluster B response shape is built around C1's now-corrected JSL claim. — *Regret-check candidate, rewrite tier.*
2. **A2.1 I1–I4 label collision** in `bind_participant_to_design`. Spec invariant labels collide with substrate invariant labels but enforce different things. — *Augment tier; rename + surface substrate-side checks separately.*
3. **A1.1 `LudicMove.moveType` enum** has "inference" where substrate has "daimon (𝔷)". Daimon Lock Lemma (Phase 2f) cannot be enforced without a daimon polarity. — *Rewrite tier (small).*

---

## Round 3 — Pass A on Session 2 (phases 2a–2f)

For each item: **Substrate artefact → spec contract → rating → note**.

### Phase 2a — Staging migration + performance benchmarks (§1)

#### A8.1 Migration tool choice
- **Substrate:** silent (operational).
- **Spec (§1.2 Step 1):** `npx prisma migrate dev --name "add_ludics_generative_substrate"`.
- **Rating: FAITHFUL** to substrate; **violates repo convention.** `.github/copilot-instructions.md` explicitly: *"do not use 'npx prisma migrate dev' — just use 'npx prisma db push'"*. Cross-cutting / operability — surface in Round 6.

#### A8.2 Seed script (`scripts/seed-ludics-showcase.ts`)
- **Substrate (post-2e):** cones disjoint; `DesignInclusion` edge same-cone only.
- **Spec (§1.2 Step 3):** "Creates two `Design` rows with distinct `loci` subsets and a `DesignInclusion` edge between them (one strictly extends the other)."
- **Rating: UNDER-COMMITTED.** Silent on cone-locality. Naive construction can materialize a cross-cone edge that integration tests then treat as ground truth.

#### A8.3 Performance SLAs
- **Substrate:** silent.
- **Spec:** 500ms / 200ms / 100ms p95 targets.
- **Rating: FAITHFUL.**

#### A8.4 Integration test coverage of R1–R5
- **Substrate:** Tier-2 N-C24 = R1–R5 material-change rules.
- **Spec §1.3 test 11:** stability test only.
- **Rating: UNDER-COMMITTED.** None of R1–R5 invalidation rules exercised against real data through all of Session 2.
- **Status (2026-05-21): RESOLVED.** New end-to-end coverage file [__tests__/invariants/phase1f-r1r5-coverage.test.ts](../../../../__tests__/invariants/phase1f-r1r5-coverage.test.ts) — 7 tests (one per R1/R2/R3/R4/R5 + no-change control + R1>R5 priority). Each rule test mocks `computeSyntheticReadout`/`derivePrioritizedOpenCqs`/`getDeliberationSchema` twice, calls `computeBriefingFingerprint` twice, asserts `lastMaterialChangeRule === "Rx"`, asserts `diffComponents(first.components, second.components)` returns exactly the expected single component (disjointness pin from B5), then on a third mock asserts `checkBriefingFingerprint(…, first.contentHash)` returns `{ stale: "Rx" }`. Module-level cache isolated per test via `delib-r1r5-Rx-N` deliberation IDs. 18 suites / 343 tests green. See §9 of [LUDICS_SESSIONS_1_2_SPEC_REVIEW.md](LUDICS_SESSIONS_1_2_SPEC_REVIEW.md).

#### A8.5 Stratum-label correctness after writes
- **Substrate (echoes A3.2):** stratum is derived from current 𝒟_P and σ(𝒟_P)^⊥; shifts with writes.
- **Spec:** Seed sets `stratumLabel = "walked"` for three moves; no test verifies neighbour relabeling.
- **Rating: UNDER-COMMITTED.** `stratumLabel` treated as static seeded value, not derived state — staleness risk first becomes observable here.

### Phase 2b — `incarnationSet` manifest field (§2)

#### A9.1 `IncarnationSetManifest` shape ⚠️ *largest Pass-A finding for Session 2*
- **Substrate (post-2e):** Inc(B) is an **antichain**; each cone has its own bottom; no global bottom of B.
- **Spec (§2.2):** `{ bottom: DesignSummary | null, minimals: DesignSummary[], totalIncarnations }`.
- **Rating: DISTORTED (post-2e).** Singular `bottom` reifies the obsolete |B|. Right shape post-2e: `{ incarnations: DesignSummary[] }` — `minimals` *is* Inc(B); no separate `bottom`.

#### A9.2 §2.6 framing of co-equal minima as exceptional
- **Spec:** "`minimals.length > 1` only for `small-coequal-hubs-db` — this models the co-equal hub topology where the behaviour has two non-comparable minima." 4/5 fixtures have `minimals.length === 1`.
- **Substrate (post-2e):** Multiple incarnations are *generic*, not exceptional.
- **Rating: DISTORTED.** Spec frames the antichain case as a special Mesh-surface "co-equal hub topology"; post-2e it is the default.

#### A9.3 `claimedMinimalPremiseLociCount` + `ArticulationRecallScore.recall`
- **Substrate (post-2e):** Each incarnation has its own loci set; minimum-commitment is per-cone.
- **Spec (§2.4):** `recall = min(claimedMinimalLociCount, bottomLociCount) / bottomLociCount`.
- **Rating: DISTORTED.** Single-number recall against one `bottom` presupposes unique minimum. Needs per-cone metric or recall vector.

#### A9.4 `ConfidentMisstatementKind: "incarnation-undercount"`
- **Rating: UNDER-COMMITTED.** Adds undercount kind but no `incarnation-miscount-across-cones` (LLM claims one incarnation when |Inc(B)| ≥ 2) or `incarnation-conflation` (merges multiple incarnations into one position) — the more dangerous post-2e misstatements.

#### A9.5 Mock-client behaviour
- **Spec (§2.5):** Perfect-recall path depends on `bottom !== null`.
- **Rating: DISTORTED.** Same singular-bottom defect.

### Phase 2c — AI synthesis workflow (§3)

#### A10.1 `proposeSynthesis` failure model
- **Substrate (post-2e):** ∨_⊥⊥ not a binary op on Inc(B); cross-cone inputs have no join.
- **Spec (§3.3):** Returns `delocationType: "locus-addition-required"` when `newLoci.length > 0`. No `cross-cone-rejected` mode.
- **Rating: OVER-COMMITTED + DISTORTED.** Conflates (a) legitimate within-cone delocation by negative-branch extension (Daimon Lock Lemma) with (b) cross-cone inputs where no join exists at all. The delocation path is offered for the cross-cone case but cannot help.

#### A10.2 Adversarial fixture arithmetic
- **Spec (§3.5):** "`bottom.loci.length` must equal the **sum** of the two input designs' loci."
- **Substrate (post-2f):** within-cone join = literal ∪ ⇒ |L₁ ∪ L₂| ≤ |L₁| + |L₂| (equal only if disjoint), and the cone's bottom-incarnation loci is a *subset* of the join's loci.
- **Rating: DISTORTED.** Sum vs. union; bottom ≠ join. Authored fixture values will mismatch a correct implementation.

#### A10.3 `bottomIncarnation` extension to `SyntheticReadout`
- **Rating: DISTORTED.** Same singular-bottom defect (A4.2/A5.1/A9.1).

#### A10.4 `closureSteps > 5` slow-join logging
- **Spec (§3.6):** "log slow joins (> 5 steps)."
- **Substrate (post-2f):** Within-cone join is literal ∪ ⇒ `closureSteps = 0` always; nonzero = substrate violation.
- **Rating: DISTORTED.** Interpretation stale; should be "alert on `closureSteps > 0`."

#### A10.5 `schemeKey: "synthesis"`
- **Substrate:** schemes are catalog-typed; "synthesis" not in scheme catalog.
- **Spec (§3.3):** auto-binds `schemeKey: "synthesis"`.
- **Rating: UNDER-COMMITTED.** No CQs, validity conditions, or catalog position specified.

#### A10.6 Idempotence test
- **Spec (§3.6):** "calling twice with identical designs → return existing design (same `biorthoClass` hash)."
- **Rating: FAITHFUL** to substrate I2 at the synthesis layer. ✅

### Phase 2d — Fossil retraction lifecycle (§4)

#### A11.1 `argumentId` on `LudicMove`
- **Substrate:** back-pointer lives on witness side, not Ludics move.
- **Spec (§4.4):** Adds `argumentId String?` on `LudicMove`.
- **Rating: LOSSY (architectural).** Reverses back-reference direction; small T4 leak (witness-layer concept reaching into dialectical schema). Defensible for query perf.

#### A11.2 `fossilizeByArgument` fuzzy-text interim
- **Spec (§4.3):** "WHERE … `canonicalText` contains the argument claim. More robust: add `argumentId` column."
- **Rating: UNDER-COMMITTED.** Free-text match has false-positive/negative risk; spec ships both half-measure and full measure without sequencing — which is production path?
- **Status (2026-05-21): RESOLVED.** Fuzzy `canonicalText`-contains path was already deleted in earlier `P1.h.5` hardening. Adjacent gap (seed script never wrote `argumentId` on `LudicMove`) closed in [scripts/seed-ludics-showcase.ts](../../../../scripts/seed-ludics-showcase.ts); 143 staging rows backfilled. Defensive structural-where test T15.2 added to [__tests__/invariants/phase2d-fossil-lifecycle.test.ts](../../../../__tests__/invariants/phase2d-fossil-lifecycle.test.ts) (asserts the lookup `where` clause has exactly `{fossilizedAt, ludicMove}` keys — no `canonicalText`, no `OR`). See §9 of [LUDICS_SESSIONS_1_2_SPEC_REVIEW.md](LUDICS_SESSIONS_1_2_SPEC_REVIEW.md).

#### A11.3 Manual retract endpoint & announcement discipline
- **Substrate:** announcement discipline A1–A4 ([LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md]) is the home of rescission events (currently deferred).
- **Spec (§4.5):** `POST /api/v3/ludics/retract-witness` — silent on announcement integration.
- **Rating: UNDER-COMMITTED.** Defensible interim, but flag.

#### A11.4 `fossilize()` idempotence vs. endpoint 409 — *intra-spec incoherence*
- **Spec (§4.6):** Test 2: "`fossilize()` is idempotent." Test 13: "Manual retract endpoint returns 409 if already fossilized."
- **Rating: INTRA-SPEC INCOHERENCE.** Lower-level function is idempotent; endpoint wrapping it is not. Split behaviour confusing.
- **Status (2026-05-21): RESOLVED.** Direct unit test pins the function-vs-endpoint split: `fossilize()` returns the existing record on second call (no throw); endpoint emits 409 only at the HTTP layer. See §9 of [LUDICS_SESSIONS_1_2_SPEC_REVIEW.md](LUDICS_SESSIONS_1_2_SPEC_REVIEW.md).

#### A11.5 `retractReason` semantics
- Confirms A6.1 LOSSY rating — collapse of two architectural layers (dialectical excision vs. witness rescission) into one column. Phase 2d makes the collapse concrete via lifecycle wiring.

### Phase 2e — Formal proof pass for OQ-JSL (§5)

#### A12.1 The spec's branching anticipates the wrong outcomes ⚠️ *high-impact regret-check item*
- **Spec (§5.2):** "If confirmed: strengthen C1 … / If a counterexample is found: add `joinIsMinimal: boolean` …"
- **Actual outcome** ([LUDICS_OQ_JSL_PROOF.md], 2026-05-21): **OUTCOME B mis-attribution with structural refinement** — neither branch. Carrier of the JSL changes from Inc(B) to per-incarnation cones; (Inc(B), ≤_⊆, ∨_⊥⊥) is not a JSL at all; (B, ≤_⊆) decomposes into disjoint cones; no cross-cone joins exist in B.
- **Rating: UNDER-COMMITTED.** Spec's binary framing missed the third outcome. Required edits per [LUDICS_OQ_JSL_PROOF.md] §6 are far more extensive than anticipated: C1 must be **Corrected**, C3 reframed per-cone (spec doesn't mention C3), `compute_articulation_join` must validate same-cone, Cone Decomposition is a new substrate result requiring new schema concepts.
- **Regret-check priority: HIGHEST.**

#### A12.2 Branching language doesn't include "downgrade"
- **Spec:** "Secondary output (if proof is confirmed): targeted edits … upgrading the C1 tier annotation."
- **Actual:** C1 was downgraded from `confirmed-with-caveat` to `Corrected`.
- **Rating: UNDER-COMMITTED.**

#### A12.3 Reference materials
- **Spec (§5.3):** Lists Girard 2001, Melliès 2009, etc.
- **Actual proof draws on:** Fouqueré–Quatrini 2013 (incarnation uniqueness; Cone Decomposition Proposition).
- **Rating: UNDER-COMMITTED.** Key citation missing from spec references.

### Phase 2f — Production readiness (§6)

#### A13.1 Rate limiting on `bind_participant_to_design`
- **Substrate:** silent.
- **Spec (§6.1):** 10 writes/min per `participantId`.
- **Rating: FAITHFUL.** **UNDER-COMMITTED** on cross-participant abuse (one user, N participants) — Pass-B challenge.

#### A13.2 Cache warming (BullMQ)
- **Rating: FAITHFUL.** Operational.

#### A13.3 Observability — `closureSteps` interpretation
- **Spec (§6.3):** "`closureSteps > 5` is a signal of unusual position complexity."
- **Substrate (post-2f):** any nonzero is a substrate violation (echoes A10.4).
- **Rating: DISTORTED.** Interpretation stale; should alert on `closureSteps > 0`.

#### A13.4 Auth audit
- **Rating: FAITHFUL.** Operational.

#### A13.5 `BriefingFingerprintHistory` durability
- **Spec (§6.5):** L1 in-memory + L2 DB; upsert by `hash` unique key.
- **Rating: FAITHFUL** on persistence. **UNDER-COMMITTED** on:
  - **L1/L2 cache coherence**: a write to L1 that fails L2 upsert leaves a different server's L1 stale.
  - **`ruleLabel` when multiple rules fire simultaneously**: which is recorded?

#### A13.6 Upsert semantics confusion
- **Spec (§6.6 test):** "`BriefingFingerprintHistory` upsert: `ruleLabel` updated to `'R2'` when rule fires."
- **Analysis:** When R2 fires, the hash itself changes ⇒ a *new* row is written, not an existing row updated. Test wording contradicts schema intent.
- **Rating: DISTORTED (minor).**

### Round 3 summary

**Severity tally (by phase):**

| Phase | FAITHFUL | LOSSY | DISTORTED | OVER-COMMITTED | UNDER-COMMITTED |
|---|---|---|---|---|---|
| 2a (Staging + benchmarks) | 2 (A8.1, A8.3) | 0 | 0 | 0 | 3 (A8.2, A8.4, A8.5) |
| 2b (incarnationSet) | 0 | 0 | **4** (A9.1, A9.2, A9.3, A9.5) | 0 | 1 (A9.4) |
| 2c (Synthesis) | 1 (A10.6) | 0 | **3** (A10.1, A10.2, A10.3, A10.4) | 1 (A10.1) | 1 (A10.5) |
| 2d (Fossil lifecycle) | 0 | 2 (A11.1, A11.5) | 0 | 0 | 3 (A11.2, A11.3, A11.4) |
| 2e (OQ-JSL proof prompt) | 0 | 0 | 0 | 0 | **3** (A12.1, A12.2, A12.3) |
| 2f (Production readiness) | 3 (A13.1, A13.2, A13.4) | 0 | 2 (A13.3, A13.6) | 0 | 2 (A13.1 cross-participant, A13.5) |

**Top-3 highest-impact Pass-A findings (Session 2):**
1. **A12.1 Phase 2e proof prompt anticipates the wrong outcomes.** Binary "confirm/counterexample" framing missed mis-attribution with structural refinement; following §5.2 verbatim would produce a misleading C1 update. — *Regret-check, rewrite tier.*
2. **A9.1 `IncarnationSetManifest` singular `bottom`.** Reifies obsolete unique-bottom assumption; cascades into recall metric, mock client, all five corpus fixtures, 22 tests. — *Regret-check, rewrite tier.*
3. **A10.1 `proposeSynthesis` failure model.** Conflates same-cone-needs-new-locus with cross-cone-no-join; assumes all input pairs joinable. — *Regret-check, rewrite tier.*

**Cross-cutting note (for Round 6):** the same Phase-2e cone-decomposition defect drives the largest finding in Round 2 (A5.6) and three of the top findings in Round 3 (A9.1, A10.1, A12.1). Regret-check inventory will be tightly clustered around this single conceptual update.

---

## Round 4 — Pass B on Session 1 commitments

Six highest-impact commitments. Scoring axes 1–5 each: **C**orrectness, **P**erformance, **O**perability, **E**volvability, **Cog**nitive load. Total /25.

### B1 — Articulation join algorithm (cluster A5.6, A4.x)

**Spec decision (S1 §3.2):** Eager closure under ⊥⊥. `compute_articulation_join(designIds[])` returns `(joinDesign, newLoci, delocationType, closureSteps)`. Asserts join exists.

| Alt | Description | C | P | O | E | Cog | Total |
|---|---|---|---|---|---|---|---|
| 1 (spec) | Eager closure, asserts join exists | 2 | 2 | 3 | 2 | 3 | **12** |
| 2 ⭐ | Discriminated result: `{ kind: "same-cone-join" \| "cross-cone-no-join" \| "same-cone-no-extension", ... }` | 5 | 4 | 5 | 5 | 4 | **23** |
| 3 | Two-call API: `find_cone(designId)` + `join_within_cone(coneId, designIds[])` | 5 | 5 | 4 | 5 | 3 | **22** |

**Recommendation:** Alt-2. Preserves single-call surface; makes cross-cone failure explicit; minimal AI-consumer churn.

### B2 — `stratumLabel` storage (A3.2)

**Spec decision (S1 §1):** `LudicMove.stratumLabel` stored as Prisma column (`walked | witnessable | latent`).

| Alt | Description | C | P | O | E | Cog | Total |
|---|---|---|---|---|---|---|---|
| 1 (spec) | Stored column, manual maintenance | 2 | 5 | 3 | 2 | 4 | **16** |
| 2 | Derived view / on-demand compute | 5 | 2 | 4 | 5 | 3 | **19** |
| 3 | Materialized view + write-time invalidate | 4 | 5 | 3 | 4 | 3 | **19** |
| 4 ⭐ | Hybrid: stored cache + verify-on-read | 5 | 4 | 4 | 4 | 4 | **21** |

**Recommendation:** Alt-4 (read-through cache with verify-on-read). Small read amplification for correctness; avoids distributed-invalidation cost.

### B3 — `retractReason` enum collapse (A6.1)

**Spec decision (S1 §1):** Single `retractReason` enum on `WitnessRecord`, four values.

| Alt | Description | C | P | O | E | Cog | Total |
|---|---|---|---|---|---|---|---|
| 1 (spec) | Flat enum (collapses dialectical-side and witness-side reasons) | 3 | 5 | 4 | 2 | 3 | **17** |
| 2 ⭐ | Tagged columns: `retractLayer + retractReason: string` | 5 | 5 | 4 | 4 | 4 | **22** |
| 3 | Separate `RetractionEvent` table with polymorphic `cause` FK | 5 | 3 | 3 | 5 | 3 | **19** |

**Recommendation:** Alt-2 (tagged columns). Preserves T4 layer separation; minimal schema impact.

### B4 — Terminology cluster (A1.1, A2.1)

**Spec decisions:** `LudicMove.moveType` uses `inference` not `daimon`; spec I1–I4 collides with substrate I1–I4.

| Alt | Description | C | P | O | E | Cog | Total |
|---|---|---|---|---|---|---|---|
| 1 (spec) | Keep `inference`; document mapping; tolerate I1–I4 collision | 3 | 5 | 3 | 2 | 1 | **14** |
| 2 ⭐ | Rename `inference → daimon`; renumber spec invariants S1–S4 | 5 | 5 | 5 | 5 | 5 | **25** |
| 3 | Keep DB column; alias at API + code layer | 4 | 5 | 4 | 4 | 3 | **20** |

**Recommendation:** Alt-2. Session 1 just shipped; consumer surface small; lifetime cost of collision >> one-time rename.

**Status (2026-05-21): SHIPPED.** Discovery on entry: most of B4 had already landed silently. Prisma schema at [lib/models/schema.prisma](../../../../lib/models/schema.prisma) line 10258 already declares `moveType String   // "positive" | "negative" | "daimon"`; [server/ludics/bindParticipantToDesign.ts](../../../../server/ludics/bindParticipantToDesign.ts) already returns `invariantChecks: {S1_existingLocus, S2_existingStructure, S3_canonPipelineGated, S4_schemeTyped}`; MCP response shape already uses S1–S4. This round patched the four stale-label doc-comment sites: `bindParticipantToDesign.ts` doc comment (`"inference move" → "daimon move"`); [app/api/v3/ludics/bind-witness/route.ts](../../../../app/api/v3/ludics/bind-witness/route.ts) header (I1–I4 → S1–S4 + daimon wording); [__tests__/invariants/phase1b-bind-seam.test.ts](../../../../__tests__/invariants/phase1b-bind-seam.test.ts) header + 4 section comments + 1 `it(…)` title; [packages/isonomia-mcp/src/server.ts](../../../../packages/isonomia-mcp/src/server.ts) ~L1751 tool description (I1/I2/I3 → S1/S2/S3 in contract + error-code mapping). No behavioural change; `packages/isonomia-mcp/dist/server.js` not hand-edited (regenerates from src). AIF-domain `targetScope: "inference"` in `experiments/polarization-1*` is intentionally untouched (different concept: AIF premise/inference/conclusion attack scope, not Ludics polarity). 18 suites / 343 tests still green. See §9 of [LUDICS_SESSIONS_1_2_SPEC_REVIEW.md](LUDICS_SESSIONS_1_2_SPEC_REVIEW.md).

### B5 — Briefing fingerprint hash (Tier-2 N-C24)

**Spec decision (S1 §5.3):** Single SHA256 over 15-field deterministic JSON.

| Alt | Description | C | P | O | E | Cog | Total |
|---|---|---|---|---|---|---|---|
| 1 (spec) | Single SHA256 | 4 | 5 | 3 | 3 | 4 | **19** |
| 2 ⭐ | Component vector `{ hubHash, refusalHash, claimGraphHash, ... }` + merged signature | 5 | 4 | 5 | 5 | 4 | **23** |
| 3 | Merkle tree over component hashes | 5 | 4 | 4 | 5 | 3 | **21** |

**Recommendation:** Alt-2 (component vector). Pairs with R1–R5 instrumentation; additive field evolution without global cache invalidation.

**Status (2026-05-21): SHIPPED (additive variant).** `ComponentHashVector { hubs, frontier, refusal, witnessing }` added to `BriefingFingerprintResult` in [server/ludics/briefingFingerprint.ts](../../../../server/ludics/briefingFingerprint.ts). Disjoint partition over `MaterialFields`; `refusalCount` omitted (derivable from `refusalConclusionIds`). `evaluateStalenessRules` accepts optional `(prevComponents, currComponents)` and skips rules whose owning component is unchanged (R1↔hubs, R2↔refusal, R3/R4↔frontier, R5↔witnessing). `contentHash` kept byte-stable (additive, not replacing) to preserve pinned `manifest.contentHash` values in the v2 corpus fixtures. Consistency invariant pinned in tests: `contentHash` change ⇒ ≥ 1 component change. New file [__tests__/invariants/phase1f-fingerprint-components.test.ts](../../../../__tests__/invariants/phase1f-fingerprint-components.test.ts). See §9 of [LUDICS_SESSIONS_1_2_SPEC_REVIEW.md](LUDICS_SESSIONS_1_2_SPEC_REVIEW.md).

### B6 — MCP auth model (T5 surface)

**Spec decision (S1 §6):** Shared `MCP_API_TOKEN` bearer; caller-asserted `participantId`; rate-limit by `participantId`.

| Alt | Description | C | P | O | E | Cog | Total |
|---|---|---|---|---|---|---|---|
| 1 (spec) | Shared bearer + caller-asserted `participantId` | 3 | 5 | 4 | 3 | 4 | **19** |
| 2 | Per-tenant signed JWT | 5 | 4 | 3 | 5 | 3 | **20** |
| 3 | mTLS + per-agent client certs | 5 | 4 | 2 | 3 | 2 | **16** |
| 4 ⭐ | Scoped session tokens bound to `(deliberationId, participantId)`, short TTL | 5 | 5 | 4 | 4 | 4 | **22** |

**Recommendation:** Alt-4 for production hardening. Spec's current path acceptable for early deployment; flag as known T5 evolution path.

### Round 4 summary

| Commitment | Spec total | Best alt total | Δ | Tier |
|---|---|---|---|---|
| B1 Articulation join | 12 | 23 (Alt-2) | **+11** | **Rewrite** |
| B4 Terminology | 14 | 25 (Alt-2) | **+11** | **Rewrite** |
| B3 `retractReason` | 17 | 22 (Alt-2) | +5 | Augment |
| B2 `stratumLabel` storage | 16 | 21 (Alt-4) | +5 | Augment |
| B5 Briefing fingerprint | 19 | 23 (Alt-2) | +4 | Augment |
| B6 MCP auth | 19 | 22 (Alt-4) | +3 | Fine v1; augment v2 |

**Pattern (Δ):** B1 and B4 score ≤14/25 — spec contract is structurally weaker than an obvious alternative, not just suboptimal. B1 ties to Phase-2e cone-decomposition cluster (will recur in Round 5). B4 is low-cost, high-value, should happen before consumer lock-in.

**Pattern (cost of change):** B4 + B5 low-risk; B1 requires API change; B2 + B3 require schema + migration + backfill; B6 forward-only.

---

## Round 5 — Pass B on Session 2 commitments

Six highest-impact commitments. Same scoring rubric.

### B7 — `IncarnationSetManifest` shape (A9.1)

**Spec (S2 §2.2):** `{ bottom: DesignSummary | null, minimals: DesignSummary[], totalIncarnations }`.

| Alt | Description | C | P | O | E | Cog | Total |
|---|---|---|---|---|---|---|---|
| 1 (spec) | Singular `bottom` + `minimals[]` | 1 | 5 | 3 | 1 | 2 | **12** |
| 2 ⭐ | Drop `bottom`; `{ incarnations: DesignSummary[], totalIncarnations }` | 5 | 5 | 4 | 5 | 5 | **24** |
| 3 | Per-cone: `{ cones: Array<{ coneId, bottom, members[] }> }` | 5 | 4 | 5 | 5 | 4 | **23** |

**Recommendation:** Alt-2 as minimum-disruption fix; Alt-3 once MCP consumers need explicit cone identity.

### B8 — `proposeSynthesis` failure model (A10.1)

**Spec (S2 §3.3):** Assumes join exists; signals new-locus needs via `delocationType: "locus-addition-required"`.

| Alt | Description | C | P | O | E | Cog | Total |
|---|---|---|---|---|---|---|---|
| 1 (spec) | Assume joinable; conflate delocation w/ cross-cone failure | 2 | 4 | 3 | 2 | 3 | **14** |
| 2 ⭐ | Discriminated: `{ kind: "synthesized" \| "cross-cone-rejected" \| "same-cone-already-exists" \| "delocation-required" }` | 5 | 4 | 5 | 5 | 4 | **23** |
| 3 | Two-step: `validate_same_cone → synthesize` | 5 | 5 | 4 | 4 | 3 | **21** |

**Recommendation:** Alt-2. Mirrors B1's discriminated-union pattern; consistent surface across articulation API.

### B9 — `fossilizeByArgument` lookup strategy (A11.2)

**Spec (S2 §4.3):** Ships both fuzzy `canonicalText contains` interim path AND `argumentId` column in the same phase.

| Alt | Description | C | P | O | E | Cog | Total |
|---|---|---|---|---|---|---|---|
| 1 (spec) | Dual path (fuzzy text + `argumentId` column) | 3 | 3 | 2 | 3 | 2 | **13** |
| 2 ⭐ | `argumentId`-only — block phase 2d on column landing | 5 | 5 | 5 | 5 | 5 | **25** |
| 3 | Event-bus: argument-delete emits event; subscriber fossilizes by `argumentId` | 5 | 4 | 4 | 5 | 3 | **21** |

**Recommendation:** Alt-2. Fuzzy text-match has nontrivial false-positive risk on production data; cost of column-first sequencing is small; cost of a single FP fossilization is potentially user-visible corruption.

**Status (2026-05-21): SHIPPED (variant).** Fuzzy `canonicalText`-contains path was already removed in earlier `P1.h.5` hardening — Alt-2 is effectively the live behaviour. Remaining adjacent gap (seed script never set `argumentId` on `LudicMove` rows, leaving the column-first lookup empty-handed for 143 fixture rows) closed in [scripts/seed-ludics-showcase.ts](../../../../scripts/seed-ludics-showcase.ts) (L85–L116); staging rows backfilled idempotently. Structural-where contract pinned by T15.2 in [__tests__/invariants/phase2d-fossil-lifecycle.test.ts](../../../../__tests__/invariants/phase2d-fossil-lifecycle.test.ts): asserts the `where` clause keys are exactly `{fossilizedAt, ludicMove}` — no `canonicalText`, no `OR`. See §9 of [LUDICS_SESSIONS_1_2_SPEC_REVIEW.md](LUDICS_SESSIONS_1_2_SPEC_REVIEW.md).

### B10 — OQ-JSL proof prompt outcome model (A12.1)

**Spec (S2 §5.2):** Binary "if confirmed / if a counterexample is found (add `joinIsMinimal` flag)."

| Alt | Description | C | P | O | E | Cog | Total |
|---|---|---|---|---|---|---|---|
| 1 (spec) | Binary confirm / counterexample-with-flag | 1 | 5 | 2 | 1 | 3 | **12** |
| 2 ⭐ | Three-bucket: confirm / refute-with-local-flag / refute-with-structural-refinement (rewrite downstream contracts) | 5 | 5 | 5 | 5 | 4 | **24** |
| 3 | Pre-proof exploratory pass; then formalize strongest open conjecture | 5 | 3 | 4 | 4 | 3 | **19** |

**Recommendation:** Alt-2 as a **permanent template** for formal-proof spec sections. Third bucket (structural refinement) is the historically common outcome.

**Status (2026-05-21): SHIPPED (template archived in place).** [LUDICS_SESSION_2_DEV_SPEC.md](LUDICS_SESSION_2_DEV_SPEC.md) §5 has been rewritten as a 3-paragraph pointer block (`## §5. Phase 2e — Formal Proof Pass (OQ-JSL) *[ARCHIVED post-review]*`) summarising **Outcome B — mis-attribution with structural refinement** (Inc(B) is an antichain; ∨_⊥⊥ is per-cone; (B, ≤_⊆) decomposes into disjoint cones), with links to authoritative records [LUDICS_OQ_JSL_PROOF.md](LUDICS_OQ_JSL_PROOF.md) + [LUDICS_ORDER_RELATION_DEFINITION.md](LUDICS_ORDER_RELATION_DEFINITION.md). Verbatim provenance archive at [LUDICS_SESSION_2_DEV_SPEC.archived.md](LUDICS_SESSION_2_DEV_SPEC.archived.md) (`## Archived §5 — Phase 2e — Formal Proof Pass (OQ-JSL)`). Downstream-sections-rewritten list (§2, §3, §6.3, S1 §1 Cluster B) and lessons-captured paragraph included in the replacement. The three-bucket template recommendation itself (Alt-2) has not yet been written up as a reusable spec template doc — logged for a future round.

### B11 — Rate-limit key (A13.1)

**Spec (S2 §6.1):** 10 writes/min per `participantId`.

| Alt | Description | C | P | O | E | Cog | Total |
|---|---|---|---|---|---|---|---|
| 1 (spec) | Per-`participantId` | 3 | 5 | 4 | 3 | 4 | **19** |
| 2 ⭐ | Compound: `(tenantId, participantId)` + `(tenantId, ipAddress)` secondary cap | 5 | 4 | 4 | 4 | 3 | **20** |
| 3 | Per-IP only | 2 | 5 | 5 | 3 | 5 | **20** |
| 4 | Token-bucket by `(deliberationId, participantId)` with burst | 4 | 4 | 4 | 5 | 3 | **20** |

**Recommendation:** Alt-2 (compound). Closes the "one user with N participants" abuse vector.

### B12 — `BriefingFingerprintHistory` cache coherence (A13.5)

**Spec (S2 §6.5):** L1 in-process Map + L2 DB upsert; no cross-instance L1 coherence protocol.

| Alt | Description | C | P | O | E | Cog | Total |
|---|---|---|---|---|---|---|---|
| 1 (spec) | L1 in-memory + L2 DB, implicit coherence | 2 | 5 | 3 | 3 | 3 | **16** |
| 2 ⭐ | Drop L1; L2 + Redis read-through cache (single shared) | 5 | 4 | 5 | 5 | 5 | **24** |
| 3 | L1 + L2 + Redis pub/sub invalidation on hash-change | 5 | 5 | 3 | 4 | 3 | **20** |

**Recommendation:** Alt-2. L1 micro-optimization not worth the split-brain risk; Redis is already in the stack.

### Round 5 summary

| Commitment | Spec total | Best alt total | Δ | Tier |
|---|---|---|---|---|
| B7 `IncarnationSetManifest` shape | 12 | 24 (Alt-2) | **+12** | **Rewrite** |
| B10 OQ-JSL proof outcome model | 12 | 24 (Alt-2) | **+12** | **Rewrite (template)** |
| B9 `fossilizeByArgument` lookup | 13 | 25 (Alt-2) | **+12** | **Rewrite** |
| B8 `proposeSynthesis` failure model | 14 | 23 (Alt-2) | +9 | **Rewrite** |
| B12 Fingerprint cache coherence | 16 | 24 (Alt-2) | +8 | Augment (high priority) |
| B11 Rate-limit key | 19 | 20 (Alt-2) | +1 | Fine v1; augment v2 |

**Pattern:** Session 2 has **four Rewrite-tier** items vs. Session 1's two. Three of four (B7, B8, B10) trace to the same Phase-2e cone-decomposition root cause. B9 is independent (sequencing decision, not substrate-fidelity).

**Combined Sessions 1 + 2:**
- **Rewrite-tier (6):** B1, B4, B7, B8, B9, B10.
- **Augment-tier (5):** B2, B3, B5, B12, + B11 deferred.
- **4 of 6 rewrite items trace to one root cause:** obsolete singular-bottom assumption (post-2e). Round 6 regret-check inventory will be tightly clustered.

---

## Round 6 — Cross-cutting + regret-check inventory

### §1 — Cross-cutting themes

#### T1 — Pre-Phase-2e singular-bottom assumption (DOMINANT THEME)
**13 distinct findings** across both specs trace to one root cause: both specs assume Inc(B) has a unique bottom |B|.

| Session | Findings |
|---|---|
| S1 Pass A | A4.2, A5.1, A5.6 |
| S1 Pass B | B1 |
| S2 Pass A | A9.1, A9.2, A9.3, A9.5, A10.1, A10.3, A10.4, A12.1 |
| S2 Pass B | B7, B8, B10 |

**Timeline:** S1 written 2026-05-19 → completed 2026-05-20. S2 written 2026-05-20. Phase 2e proof landed 2026-05-21. Specs predate OQ resolution by 1–2 days. Not a quality failure; sequencing artifact. Regret-check is large and tightly clustered.

#### T2 — Terminology drift from substrate
| Drift | Spec | Substrate | Finding |
|---|---|---|---|
| Move type | `inference` | `daimon` | A1.1 |
| Invariant labels | I1–I4 | I1–I4 (different content) | A2.1 |
| Antichain incarnations | "co-equal hub topology" | generic Inc(B) | A9.2 |
| `closureSteps` | "slow joins" (perf) | substrate violation (correctness) | A10.4, A13.3 |
| Synthesis scheme | `schemeKey: "synthesis"` | not in catalog | A10.5 |

One coordinated terminology pass eliminates all five.

#### T3 — Stratification and freshness treated as static, not derived
| Storage choice | Substrate truth | Risk | Finding |
|---|---|---|---|
| `stratumLabel` column | derived from current 𝒟_P | neighbour recompute on writes | A3.2, A8.5, B2 |
| `bottom: DesignSummary` | per-cone, derived from Inc(B) | Inc(B) writes invalidate | A9.1 |
| Single SHA256 fingerprint | derived from 15 fields | opaque to which R1–R5 fired | B5 |
| L1 in-process cache | derived from L2 | cross-instance split-brain | A13.5, B12 |

Common remedy: verify-on-read, component vectors, or single-shared-cache. Spec defaults to staleness-prone option in every case.

#### T4 — Architectural layer leakage (T4 boundary violations)
- **A11.1:** `argumentId` on `LudicMove` — witness-layer concept reaches into dialectical schema.
- **A6.1 / A11.5 / B3:** `retractReason` flat enum collapses dialectical-side + witness-side reasons.
- **A11.3:** Manual retract endpoint silent on announcement discipline (A1–A4 unowned).

#### T5 — Operational concerns added without substrate hooks
All FAITHFUL on Pass-A but under-specified failure modes: cross-participant abuse, concurrent rule firing, cache coherence. A13.1, A13.5, A13.6.

#### T6 — Test discipline gaps
- R1–R5 invalidation rules **0/5 exercised against real data** through end of S2 (A8.4).
- Stratum-recompute never tested (A8.5).
- Function-layer vs. endpoint-layer idempotence mismatch (A11.4).
- Fixture arithmetic broken post-2e (A10.2).

#### T7 — Repo-convention violation
A8.1 — `prisma migrate dev` against AGENTS.md / `.github/copilot-instructions.md` directive (`prisma db push`).

### §2 — Regret-check inventory

#### OQs closed since spec was written
| OQ | Resolution | Date | Affects |
|---|---|---|---|
| OQ-JSL | Outcome B mis-attribution; Inc(B) antichain; JSL carrier is per-cone C_i | 2026-05-21 | S1 §3.2, S2 §2, §3, §5, §6.3 |
| ∨_⊥⊥ within-cone semantics | Literal chronicle-set union | 2026-05-21 | S1 §3.2, S2 §3.5 |
| Cone Decomposition | (B, ≤_⊆) = disjoint union of cones; ∨ same-cone only | 2026-05-21 | S1 §3.2, S2 §2.6, §3.3 |
| Daimon Lock Lemma | Same-cone designs share positive skeleton | 2026-05-21 | S2 §1 seed |

#### Stale-on-arrival sections (cannot be augmented — substrate result changed)
| Section | Why stale | Evidence | Tier |
|---|---|---|---|
| S1 §3.2 `compute_articulation_join` | Lattice with unique bottom; assumes join exists | A5.6, B1 | **REWRITE** |
| S2 §2 `incarnationSet` manifest + recall | Singular `bottom`, single-number recall | A9.1, A9.3, B7 | **REWRITE** |
| S2 §3 `proposeSynthesis` | Assumes joinable; conflates failures; fixture arithmetic wrong | A10.1, A10.2, A10.3, B8 | **REWRITE** |
| S2 §5 OQ-JSL proof prompt | Proof has executed with Outcome B; branching misses it | A12.1, B10 | **ARCHIVE** w/ pointer to LUDICS_OQ_JSL_PROOF.md |
| S2 §6.3 `closureSteps` observability paragraph | "Slow join" wrong; nonzero = substrate violation | A10.4, A13.3 | **REWRITE** |
| S2 §1.2 seed script | Silent on cone-locality | A8.2 | **REWRITE** |

#### Three-bin triage — full coverage

| Section | Tier | Trigger |
|---|---|---|
| S1 §1 Prisma core shapes | AUGMENT | B3, B4 |
| S1 §1 `LudicMove.moveType` enum | AUGMENT | B4 (rename) |
| S1 §1 `stratumLabel` column | AUGMENT | B2 (verify-on-read) |
| S1 §1 `retractReason` | AUGMENT | B3 (tagged cols) |
| S1 §2.1 Invariants I1–I4 | AUGMENT | B4 (renumber) |
| S1 §3.2 articulation join | **REWRITE** | T1 |
| S1 §4 Auth + MCP tools | FINE v1 / AUGMENT v2 | B6 |
| S1 §5.3 fingerprint hash | AUGMENT | B5 (component vector) |
| S1 §6 test harness | FINE | — |
| S2 §1.1 migration command | AUGMENT | T7 |
| S2 §1.2 seed script | **REWRITE** | A8.2 |
| S2 §1.3 integration tests | AUGMENT | A8.4 (R1–R5), A8.5 (stratum) |
| S2 §1 perf SLAs | FINE | — |
| S2 §2 `IncarnationSetManifest` | **REWRITE** | T1 |
| S2 §3 `proposeSynthesis` | **REWRITE** | T1 |
| S2 §4 fossil lifecycle | AUGMENT | B9, B3, A11.4 |
| S2 §5 OQ-JSL proof prompt | **ARCHIVE** | Already executed |
| S2 §6.1 rate-limit | AUGMENT | B11 |
| S2 §6.2 cache warming | FINE | — |
| S2 §6.3 observability paragraph | **REWRITE** | T1 |
| S2 §6.4 auth extraction | FINE | — |
| S2 §6.5 `BriefingFingerprintHistory` | AUGMENT | B12 |

**Counts:** 7 REWRITE/ARCHIVE · 12 AUGMENT · 5 FINE.

### §3 — Open questions surfaced

1. **OQ-C3-thin-cones** — formal characterization of "thin cones"; affects whether per-cone join can be sub-linear.
2. **Cone identity in MCP surface** — `coneId` exposed, or `incarnations[]` sufficient? Decides B7 Alt-2 vs. Alt-3.
3. **Cross-cone synthesis semantics** — Mesh-layer "discourse synthesis" beyond substrate ∨_⊥⊥?
4. **Announcement discipline ownership** — A1–A4 currently unowned by both substrate and spec.
5. **Concurrent rule firing for `ruleLabel`** — when R1 and R2 fire together, which is recorded?
6. **`closureSteps > 0` policy** — hard error / soft alert / drop-result?

### §4 — Risk-weighted priority for downstream specs

1. **Tier-1 blockers (do first):**
   - B4 terminology pass (rename `inference`, renumber I1–I4).
   - REWRITE S2 §2 manifest shape.
   - REWRITE S1 §3.2 articulation join.
   - ARCHIVE S2 §5 with pointer to [LUDICS_OQ_JSL_PROOF.md].

2. **Tier-2 high-priority (before next AI-facing feature):**
   - REWRITE S2 §3 `proposeSynthesis`.
   - AUGMENT S2 §4 — drop fuzzy fossilize path.
   - AUGMENT S2 §6.5 — drop L1; Redis-only.

3. **Tier-3 hygiene (do when touching area):** B5, B2, B3, B11, T7.

4. **Tier-4 future-proofing:** B6 scoped session tokens.

---

## Round 7 — Distill into deliverable

**Status: COMPLETE.** Final deliverable produced at [LUDICS_SESSIONS_1_2_SPEC_REVIEW.md](LUDICS_SESSIONS_1_2_SPEC_REVIEW.md).

Structure of deliverable (matches §5 of [LUDICS_SESSIONS_1_2_SPEC_REVIEW_PROMPT.md](LUDICS_SESSIONS_1_2_SPEC_REVIEW_PROMPT.md)):
- §1 Executive summary (15 lines)
- §2 Pass A findings table (Session 1: 17 rows; Session 2: 24 rows)
- §3 Pass B findings table (12 rows)
- §4 Cross-cutting findings (7 subsections T1–T7)
- §5 Regret-check inventory (4 closed OQs; 6 stale-on-arrival sections; risk-weighted dependency order)
- §6 Triage (7 REWRITE/ARCHIVE · 12 AUGMENT · 5 FINE)
- §7 Outstanding questions (7 items)
- §8 Closing observations (meta-finding + pattern of strength + pattern of weakness + sequencing lesson)

Working notes file retained as the audit trail.
