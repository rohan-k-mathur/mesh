# Ludics Harmonization — Pass 1: Theoretical Map

> **Session output (planning only, no code changes).** Companion to
> [LUDICS_HARMONIZATION_PASS_2_SPRINT_LIST.md](LUDICS_HARMONIZATION_PASS_2_SPRINT_LIST.md).
> Source documents read for this map:
> - [LUDICS_SYSTEM_ARCHITECTURE.md](LUDICS_SYSTEM_ARCHITECTURE.md) (legacy)
> - All files in [Ludics Generative Substrate Documents/](Ludics%20Generative%20Substrate%20Documents/) (substrate)
> - `prisma/schema.prisma` (authoritative)
> - `scripts/bridge-legacy-to-substrate.ts`, `scripts/backfill-dm-locus-from-aif.ts`
> - `__tests__/invariants/**` and the MCP tool surface in `server.ts`
>
> **Hard constraints in force.** T4 (no `participantId` on default Ludics reads);
> OQ-JSL per-cone result and Inc(B) antichain; no locus prefixes other than `⊢A.`;
> existing invariants (~308) must not regress; `schema.prisma` overrides any doc
> claim that conflicts.

---

## 0. The two layers in one paragraph each

**Legacy Ludics dialogue layer.** Designs are *strategy trees* persisted as
`LudicDesign` rows holding ordered `LudicAct` records over a `LudicLocus`
forest, with interactions persisted as `LudicTrace` rows and per-design
projections as `LudicChronicle`. Dialogue intent is carried by
`DialogueMove`. The layer is *operationally complete* — compile, step,
orthogonality, daimon, concession, fax — but its addressing is participant- and
move-scoped, not behaviour-scoped, and its connection to the argument graph is
ad hoc (some moves carry `payload.locusPath`, some carry `payload.argumentId`,
some carry neither).

**Generative Substrate.** Designs are *chronicle-sets* under a literal
inclusion order `⊑`, grouped into `Behaviour` containers per root locus.
Minimal incarnations form an antichain `Inc(B)` that decomposes `B` into
disjoint *cones*; each cone is a per-cone JSL whose join is literal
chronicle-set union (Phase 2e/2f). Participants do not own designs; instead a
canonical, anonymous `LudicMove` at a locus is *instantiated* by a
`WitnessRecord` binding it to a `DialogueMove` — an idempotent, records-only
operation `ι` that creates no new dialectical nodes. The AIF graph is a thin
DM-index in this layer and is currently read-only.

The harmonization problem is **not** "one of these is wrong." It is: the
legacy layer is the *interaction runtime* (it knows how to walk trees), the
substrate is the *normative semantics* (it knows when two articulations are
the same position, and what positions are even on the table). The plan must
keep both but route writes through a single seam so that
`LudicMove`/`WitnessRecord`/`Design` are populated *whenever* the legacy
`DialogueMove`/`LudicAct` pipeline runs.

---

## 1. Object-level correspondence (legacy → substrate)

Each row states the correspondence as either an explicit *functor* `F` (with
direction and what it preserves/forgets), or an explicit *gap*. Schema
citations are authoritative.

| Legacy entity | Substrate entity | Correspondence | What is preserved | What is forgotten / what is new |
|---|---|---|---|---|
| `LudicLocus(path, dialogueId)` | `LudicMove.locus` (string, e.g. `"⊢A.0.54.1"`) | Functor `F_loc: Locus → Move-address`, injective on `(deliberationId, path)`; prefixes path with `⊢A.`. | Tree shape (parent/child reconstructible from string). | Identity of `LudicLocus.id`; the `parentId` column (substrate addresses are paths, not rows). |
| `LudicDesign(participantId, rootLocusId, acts[])` | `Design(behaviourId, loci[], biorthoClass, premiseClaimIds[])` + the implicit `Behaviour(rootLocus)` | Functor `F_des: LudicDesign → Design`; `loci[]` = `{ a.locus.path : a ∈ acts }`; `behaviourId` derived from `rootLocus`. | The chronicle-set (as a set of loci). | **Ordering inside `acts[]`** (substrate Design is a *set*, not a sequence). **Participant ownership** (substrate Designs are not participant-owned; `Behaviour` is). |
| `LudicAct(polarity, kind, locusId, ramification[], orderInDesign)` | `LudicMove(locus, moveType, stratumLabel)` + a row in `Design.loci[]` | Decomposition functor `F_act: Act ↦ (Move at locus, membership in some Design)`. | Polarity → `moveType ∈ {positive, negative, daimon}`. Locus identity. | `orderInDesign`, `ramification[]`, `expression`, `isAdditive`. The substrate treats acts at the same locus as the same `LudicMove` regardless of which design realises them — moves are *anonymous and shared*. |
| `LudicChronicle(designId, acts[])` | Implicit: each chronicle is a sequence of `LudicMove`s consistent with `Design.loci[]`. | **Gap** — substrate has no chronicle row. Chronicles are reconstructible from the loci-set + the legacy/runtime walk order. | — | The entire row, including `LudicChronicleCache`. (Question: do any reads actually depend on the persisted ordering? See §5 Q2.) |
| `LudicTrace(posDesignId, negDesignId, steps[], status, ...)` | `WitnessRecord` rows (one per walked locus) + per-locus `stratumLabel="walked"` | Functor `F_trace: (one walk by participant p) → set of WitnessRecord(p, m, dm)`. | Which loci were walked; by whom; when. | The *pairing* (two specific designs interacting) and the convergent/divergent *status*. Substrate has no `TraceStatus`; it has a stratification (`walked / witnessable / latent`) over moves, not a 4-valued status on a trace row. |
| `DialogueMove` | `WitnessRecord.dialogueMoveId` (one-to-at-most-one) | Partial functor `F_dm: DM → Witness` (defined when DM resolves to a locus). | The DM itself is unchanged; substrate adds a *binding*. | DMs with `payload.argumentId` only (no locus) currently fail to lift — they live entirely outside the substrate. **This is the population-disjointness problem.** |
| *(no legacy counterpart)* | `Behaviour(deliberationId, rootLocus)` | Orphan. New container for *all* designs at a root locus. | — | Legacy had per-(participant × scope) designs and no shared container. |
| *(no legacy counterpart)* | `DesignInclusion(smallerId, largerId)` | Orphan. Hasse covers of `⊑` within a cone. | — | Legacy had no inclusion order; the closest thing was `LudicCorrespondence` between AIF and ludics. |
| `LudicDesign.referencedScopes[]` / `crossScopeActIds[]` | *(unmodelled in substrate v1)* | **Out of scope for this programme.** Cross-scope reasoning is a substrate-v2 design exercise; v1 substrate covers same-scope designs only. | — | Cross-scope reference structure. (`LudicFaxMap` exists but is dev-only; the active cross-scope mechanism is `referencedScopes`.) |
| `LudicCommitmentElement` / `LudicCommitmentState` / `CommitmentLudicMapping` | *(unmodelled in substrate)* | **Out of scope (deferred to a Session 3 commitment spec).** Substrate must not silently overwrite or invalidate legacy commitment data. | — | Commitment grounding, concession ledger, dialogue↔ludics commitment mapping — all retained on the legacy side. |

**Aggregate reading.** `F_loc`, `F_des`, `F_act`, `F_dm` together are a
faithful but lossy functor `F: Legacy → Substrate`. The forgotten data
(ordering in `acts[]`; trace status; ramification; chronicle row; pairing in
interaction) belongs in the *runtime* not the *semantics*. The substrate's
position is that semantics should not depend on that data; the legacy runtime
can keep it as engine-internal state. The bridge can therefore be made *total*
in `F` (every legacy entity gets a substrate image) without claiming the
inverse `F⁻¹` exists.

---

## 2. Order, cones, antichain, OQ-JSL — what the substrate guarantees, and what legacy data breaks

The substrate's central technical content is:

1. **⊑ is literal chronicle-set inclusion** on `Design.loci[]`. Not an
   approximation order, not a daimon-replacement order. (See
   [LUDICS_ORDER_RELATION_DEFINITION.md](Ludics%20Generative%20Substrate%20Documents/LUDICS_ORDER_RELATION_DEFINITION.md).)
2. **Inc(B) is an antichain.** No two distinct incarnations are comparable;
   they have no upper bound *even in `B`*. (Phase 2e Cross-Cone
   Incompatibility, [LUDICS_OQ_JSL_PROOF.md](Ludics%20Generative%20Substrate%20Documents/LUDICS_OQ_JSL_PROOF.md).)
3. **`B = ⊔ᵢ Cᵢ` (cones partition the behaviour).** Within a cone the
   positive/daimon skeleton is invariant (Daimon Lock Lemma). Across cones,
   joins do not exist.
4. **Per-cone JSL.** `(Cᵢ, ⊑, ∪)` is a JSL with bottom `Dᵢ` and join =
   literal set-union of `loci[]` (Phase 2f Reading A).

**What legacy data threatens.**

- *Ramification with `isAdditive: true`* (`LudicAct.isAdditive`) is an
  *exclusive* branching: only one child may be realised. Under straight
  set-union, two designs that picked different additive children would join
  to a set containing both — violating the additive constraint.
  **Empirical finding:** `isAdditive` defaults to `false` and *no production
  code path ever sets it `true`* — the field is inert today. **Policy
  decision (Q1):** the substrate's *theoretical* position is that
  incompatible additive choices yield *separate cones* (so the additives are
  not silently collapsed). The bridge does not implement separate-cone
  logic in v1; instead it asserts `isAdditive === false` and fails loud if
  encountered (`I-No-Additive-Silent`, see §6.2). The separate-cone
  implementation lights up later when the first additive act lands.
- *Multi-Design-per-participant in legacy* — Pass 1 originally listed this
  as the deferred "fix #4." **Empirical finding:** there is *no*
  `@@unique([deliberationId, participantId])` constraint on `LudicDesign`,
  and every production `findUnique`/`findFirst` keys by `id`, not by
  participant. The substrate is already loose. **Policy decision (Q4):**
  no structural sprint needed; the UI policy (cone-decomposed view rather
  than per-participant view) lands as part of H6.
- *Cross-scope reference structure on `LudicDesign`* — Pass 1 originally
  framed this around `LudicFaxMap`. **Empirical finding:** `LudicFaxMap` is
  dev-only and not called by any production path; the live cross-scope
  mechanism is `LudicDesign.referencedScopes[]` / `crossScopeActIds[]`,
  populated by `compileFromMoves.ts` and read by `delocate.ts` /
  `scopeTraces.ts`. **Policy decision (Q3):** substrate v1 explicitly
  covers *same-scope designs only*. The bridge tags any design with
  non-empty `referencedScopes` as `bridge-skip-reason: "cross-scope"` and
  records it for a later substrate-v2 cross-scope design exercise. The
  substrate does *not* materialise foreign loci into local addressing in
  v1; that was the original Pass 1 default but it loses the "this position
  imports from elsewhere" provenance that the live mechanism carries.
- *`participantId` on `LudicDesign`* is fine *to store* (the substrate stores
  it on `WitnessRecord` too) but must not leak to reads — T4 applies
  uniformly. Any harmonization seam that joins legacy LudicDesign rows into
  substrate read results must strip `participantId`.
- *`LudicCommitmentElement` / concession / commitment-state* — Pass 1
  originally listed this as a "gap going the other way." **Empirical
  finding:** commitments are *active production* (concession protocol,
  promotion flow, baseline ensure, 20+ readers). **Policy decision (Q5):**
  commitments are *explicitly out of scope* for this harmonization
  programme. They remain on the legacy side as canonical. The substrate
  must not silently overwrite or invalidate commitment data; a future
  "Session 3 commitment spec" will define how (and whether) commitments lift
  into the substrate.

**Strengthening.** When the bridge runs, the substrate gains *structural
checks the legacy layer never enforced*: cone-partition validation,
DesignInclusion same-cone constraint, antichain `Inc(B)`. If those checks
flag inconsistencies on real data, the inconsistencies were already latent
in the legacy data — surfacing them is a feature.

---

## 3. AIF graph — current state, possible roles, recommendation

### 3.1 What AIF currently is

Per the bridge scripts and prior session findings:

- `AifNode` exists as a registry of `DialogueMove`s (and as a back-reference
  target from `LudicAct.aifNodeId`).
- `AifEdge` rows of types `premise` / `conclusion` are essentially **zero in
  production** for the canonical test deliberation
  `cmoxol76e03748cssx07tvkhd`.
- `backfill-dm-locus-from-aif.ts` reads
  `DM ←(AifNode.dialogueMoveId)→ AifNode ─(AifNode.ludicActId)→ LudicAct ─(.locusId)→ LudicLocus`
  to fill `DialogueMove.locusId`. With no edges and few `ludicActId`
  links, it is a no-op on real data.

The empirical split (52 Ludics-bridged DMs vs 447 argument-graph-only DMs)
is a direct consequence: the legacy pipeline writes a `DialogueMove` row,
sometimes stamps `payload.locusPath`, sometimes stamps `payload.argumentId`,
and very rarely creates an `AifNode` linking the two. There is no single
seam that guarantees a DM has both.

### 3.2 Three possible roles, with verdict

| Role | What it means | Verdict |
|---|---|---|
| **Canonical bridge.** AIF is the ground-truth join table between argument graph, dialogue moves, and Ludics. All DMs flow through AIF; all locus attribution flows through AIF; substrate `Design.premiseClaimIds[]` is computed by AIF traversal. | Coherent, well-precedented, but *expensive*: requires an AIF write path on the creation seam and a back-fill across history. | **Recommended for premise/conclusion edges only.** Keep AIF as the *triple registry* (I, RA, CA nodes; their premise/conclusion edges) and treat it as the canonical source of `premiseClaimIds`. |
| **Derived view.** AIF is materialised from a join of `DialogueMove`, `Argument*`, and `WitnessRecord` and is recomputed on demand. | Cheap to maintain, no write-seam change. But loses the ability to *query AIF directly* (e.g. third-party AIF tools); and any consumer that already reads `AifNode` becomes a view-over-view. | Reasonable fallback if Sprint H1 (creation seam) is delayed. |
| **Retire.** Delete `AifNode`/`AifEdge`. | Loses interoperability claims; the substrate `Design.premiseClaimIds[]` becomes the canonical premise binding. | **Not recommended** — the substrate docs (premiseClaimIds 3b backfill prompt) explicitly depend on the AIF graph for the backfill source. Retiring breaks the substrate's own roadmap. |

**Concrete recommendation.** AIF becomes the *canonical bridge* for premise/
conclusion structure (argument graph → loci → designs) and is *written by
the creation seam* (Sprint H1 below). `Design.premiseClaimIds[]` is then
backfilled by walking AIF (Sprint H4, the existing 3b prompt). All other
"is this DM in Ludics?" questions are answered by `WitnessRecord`, not by
AIF.

---

## 4. Witnessing / walked-locus story — what subsumes what

| Legacy artefact | Substrate artefact | Same information? |
|---|---|---|
| `LudicTrace.steps[]` (per interaction) | Sequence of `WitnessRecord` rows with matching `ludicMove.deliberationId` and ascending `timestamp`, filtered to `fossilizedAt = null`. | **Mostly.** The substrate loses the explicit *pairing* (which P design walked against which O design). It gains *anonymity by default* (T4) and a *fossil-record retraction* model. |
| `LudicTrace.status ∈ {ONGOING, CONVERGENT, DIVERGENT, STUCK}` | **No direct analogue.** The substrate's nearest concept is whether the witnessed prefix reaches a `daimon` move; otherwise it talks about strata, not statuses. | **Different categories.** A trace status is a property of an interaction *episode*; substrate stratification is a property of moves *in aggregate*. They are not interchangeable. |
| `LudicChronicle.acts[]` | Reconstructible from `WitnessRecord` rows by participant + design. | **Yes,** *if* witnessing is total (every legacy act has a witness). Currently it is not. |

**Subsumption verdict.**

- `LudicChronicle` and `LudicChronicleCache` are *subsumed* by witness
  traversal once the creation seam is in place and historical witnessing
  is backfilled. They are safe to retire **after** Sprint H1 and Sprint H5.
- `LudicTrace` is *not fully subsumed*. The trace-as-episode concept (status,
  endedAtDaimonForParticipantId, decisiveIndices, additive choices) is
  useful runtime telemetry the substrate does not aim to replace. Retain
  `LudicTrace` as engine telemetry; do not surface it from substrate-level
  MCP tools.

**Walked-stratum truth.** Once witnessing is the *only* writer of "this move
was walked," the legacy `LudicTrace.status === CONVERGENT` can be re-derived
as "there exists a chain of walked WitnessRecords from the root to a
`daimon` move." This is the cleaner long-term reading.

---

## 5. Open questions — resolutions

All five questions were settled in the deliberation session of 2026-05-27,
informed by an empirical grep of the live codebase. The resolutions are:

- **Q1 — additive sub-trees.** *Theoretical policy:* separate cones per
  incompatible additive choice. *Implementation:* deferred. `isAdditive` is
  inert in production today; bridge fails loud (`I-No-Additive-Silent`) if
  it sees `isAdditive === true`. Separate-cone logic ships when the first
  additive act does.
- **Q2 — chronicle ordering.** No production reader depends on persisted
  `LudicChronicle` ordering; all 50+ readers are narrative reconstruction
  and use trace step order. Safe to retire post-cutover. A
  `reconstructChronicle(designId)` helper lands in H2 so the ~50 readers
  can migrate incrementally; H7 drops the table once grep is clean.
- **Q3 — cross-scope.** `LudicFaxMap` is dev-only; the live mechanism is
  `referencedScopes` on `LudicDesign`. Substrate v1 explicitly covers
  *same-scope only*; cross-scope designs are skipped with a recorded
  reason. A substrate-v2 cross-scope design exercise is deferred.
- **Q4 — multi-Design-per-participant.** Confirmed unnecessary by direct
  grep: no `@@unique([deliberationId, participantId])`, no production code
  filters `findUnique`/`findFirst` by `participantId`. H8 deleted from the
  programme; the substrate UI "cone-decomposed view" requirement folds
  into H6.
- **Q5 — commitments.** Out of scope. `LudicCommitmentElement` and friends
  remain canonical on legacy; substrate must not write or invalidate them.
  A future Session 3 spec defines the commitment lift.

---

## 6. Invariants the unified system must satisfy

This is the *target set*. The first block restates existing invariants the
plan must not weaken; the second block proposes additions the harmonization
makes possible.

### 6.1 Existing invariants — must not regress

| # | Invariant | Source |
|---|---|---|
| I-T4 | `participantId` never appears in default Ludics/substrate reads; only on explicit `includeIdentity: true`. | `__tests__/invariants/**` (T4 suite); `WitnessRecord` ACL. |
| I-1 | `WitnessRecord.dialogueMoveId` is unique (records-only `ι`). | Substrate Session 1 spec; `schema.prisma`. |
| I-2 | `ι` is idempotent on re-promotion. | Substrate Session 1 spec. |
| I-3 | Multiple witnesses may share one `LudicMove`. | Substrate Session 1 spec. |
| I-4 | Witnessing total over the canonical text pipeline, or triggers delocation. | Substrate Session 1 spec. |
| I-Inc | `Inc(B)` is an antichain in `(B, ⊑)`. | Phase 2e proof. |
| I-Cone | Every `DesignInclusion(smaller, larger)` has `smaller`, `larger` in the *same cone*. | Phase 2e Daimon Lock Lemma. |
| I-Join | Same-cone join = literal `loci[]` set-union; cross-cone join rejected. | Phase 2f Reading A. |
| I-Loc | `LudicMove.locus` is unique on `(deliberationId, locus)` and uses only the `⊢A.` prefix. | `schema.prisma`; user constraint. |
| I-308 | All ~308 existing invariant tests pass on every PR. | `__tests__/invariants/**`. |

### 6.2 New invariants the plan should add

| # | Invariant | Enforced by |
|---|---|---|
| I-Seam | Every `DialogueMove` created after the cutover has either (a) a non-null `locusId` *and* a corresponding `WitnessRecord` row, or (b) an explicit `payload.unbridgeable: true` flag with a recorded reason. **No silent disjointness.** | Sprint H1. |
| I-AIF-min | Every `DialogueMove` that asserts/attacks an argument creates (or finds) the corresponding `AifNode` + `AifEdge(premise|conclusion)` rows. | Sprint H1 + H4. |
| I-Same-Scope | A substrate `Design` is only created from a legacy `LudicDesign` with empty `referencedScopes[]`. Cross-scope designs are skipped with a recorded `bridge-skip-reason: "cross-scope"`. | Sprint H3. |
| I-No-Additive-Silent | The bridge asserts `LudicAct.isAdditive === false` for every act it processes and fails loud otherwise. Separate-cone handling for additives is a follow-on. | Sprint H3. |
| I-No-Legacy-Read | Substrate MCP tools and substrate-facing UI never read `LudicDesign`/`LudicAct`/`LudicChronicle` directly; they read through the substrate read path. | Sprint H2 + H6. |
| I-Premise | `Design.premiseClaimIds[]` is the deduped union of `ArgumentPremise.claimId` for every argument reachable from the design's loci through AIF edges. | Sprint H4. |
| I-No-Commitment-Write | The substrate write path never creates, modifies, or deletes `LudicCommitmentElement`, `LudicCommitmentState`, or `CommitmentLudicMapping` rows. Commitments are legacy-canonical until a Session 3 spec lands. | Sprint H1. |

### 6.3 Invariants explicitly *not* added (and why)

- We do **not** require `LudicTrace.status` to be re-derivable from
  `WitnessRecord` *as a hard invariant* — runtime telemetry is allowed to
  diverge from semantic state (see §4).
- We do **not** require one-to-one `LudicDesign ↔ Design` rows. The legacy
  may carry alternative drafts that never lifted to a substrate Design
  (e.g. compiled-but-never-walked designs). The bridge is partial in this
  direction by design.

---

## 7. The harmonization in one diagram

```
                          DialogueMove.create()
                                  │
                                  ▼
                  ┌────────────────────────────────────┐
                  │   Creation Seam  (Sprint H1)       │
                  │   single API path, transactional   │
                  └──────┬──────────────┬──────────────┘
                         │              │
                ┌────────┘              └────────────┐
                ▼                                     ▼
        ┌──────────────┐                  ┌───────────────────┐
        │  AIF triple  │                  │  Legacy runtime   │
        │  (I, RA/CA,  │                  │  LudicAct +       │
        │   p/c edges) │                  │  LudicLocus +     │
        └──────┬───────┘                  │  LudicTrace step  │
               │                          └─────────┬─────────┘
               │                                    │
               │ ι (records-only)                   │
               └──────────────┬─────────────────────┘
                              ▼
                  ┌────────────────────────────────────┐
                  │  Substrate write  (LudicMove,      │
                  │  WitnessRecord, Design, Behaviour, │
                  │  DesignInclusion within cone)      │
                  └─────────────────┬──────────────────┘
                                    │
                                    ▼
                  ┌────────────────────────────────────┐
                  │  Substrate read path (MCP + UI)    │
                  │  T4-anonymous by default           │
                  └────────────────────────────────────┘

       Legacy UI  ─ reads ─►  Substrate read path  (Sprint H6, was: legacy direct)
       Legacy engine  ─ retains ─►  LudicTrace as runtime telemetry (kept)
       LudicChronicle / LudicChronicleCache  ─ retired after H1 + H5  (Sprint H7)
```

---

## 8. Summary

The two layers are not redundant. The legacy layer is the *interaction
runtime* and should keep being the runtime. The substrate is the *normative
semantics* — what positions are on the table, when two articulations are the
same, when a synthesis is licensed. They are kept in sync by routing every
new `DialogueMove` through a single transactional creation seam that writes
(legacy row → AIF triple → substrate `LudicMove`/`WitnessRecord` and, where
the move is the first instantiation of a new articulation, a new `Design` in
the appropriate cone).

The substrate's guarantees (Inc(B) antichain, per-cone JSL, OQ-JSL,
witnessing records-only) all survive harmonization *provided* (a) the
bridge stays loud on `isAdditive === true` until separate-cone logic ships,
(b) the bridge skips cross-scope designs (non-empty `referencedScopes`)
rather than silently materialising them, (c) the substrate write path is
the sole writer of `LudicMove`/`WitnessRecord` and *never* touches
commitment tables, (d) AIF edges are written by the creation seam so
`Design.premiseClaimIds[]` can be backfilled meaningfully.

Pass 2 turns this into a concrete sprint ordering.

---

## 9. Substrate-v1 commitments and the BF/MELL question

> Added 2026-05-30 from the [Q-030 Phase 1 lit audit](MALL%E2%86%92MELL%20Incarnation%20Upgrade%20for%20the%20Isonomia%20Ludics%20Substrate.md) and [`RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md`](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md#q-030) Q-030/Q-032/Q-035. *Forward-compatibility note only — does not change H0–H8.*

This programme is the **FQ-substrate-v1 harmonization**. It commits to Fouquéré–Quatrini–style linear incarnation as the substrate's base design notion, and to the FQ/Girard separation property (every behaviour distinguishes its designs by some test). Both commitments are **correct for v1** and unaffected by H0–H8.

A separate, much larger architectural question — **[Q-030](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md#q-030): should the substrate upgrade to Basaldella–Faggian designs-with-repetitions for MELL coverage?** — is open and recommended (on literature grounds) to land as a future *substrate-v2*. Q-030 Phase 1 (literature review) is complete; Phases 2–5 are gated by [Q-031](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md#q-031), [Q-033](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md#q-033), [Q-034](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md#q-034), [Q-035](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md#q-035) and would proceed independently of harmonization.

**Five v1 commitments that a v2 BF migration would have to revisit** (named here so v2 has a clean diff target):

| v1 commitment | v1 source | v2 implication under BF designs-with-repetitions |
|---|---|---|
| `I-Inc` — `Inc(B)` is an antichain in `(B, ⊑)` | §6.1; T002; FQ Props 5.2/5.3 | BF proves *no* antichain/minimality theorem on materiality (Def 11.5). Restate via Sironi principal sets, antichain-up-to-repetition-equivalence, or canonical-representative selection — [Q-032](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md#q-032). |
| `I-Cone`, `I-Join` — cones partition `B`; join is literal `loci[]` set-union | §2; §6.1; Phase 2e Daimon Lock + Cross-Cone Incompatibility | The distinguishing-test step uses FQ/Girard separation. Separation **fails** under BF non-uniformity. Cones-partition picture may need replaying via orthogonality-quotient classes — [Q-035](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md#q-035). |
| `Design.loci[]` is a *set* (ordering forgotten) | §1 `F_des` row | BF strategies can visit the same address multiple times (τ-sum, VAM "Copies" property). v2 likely needs `loci[]: { locus, multiplicity }[]` or a `LociRepetition` join — schema-level change. |
| `LudicMove` unique on `(deliberationId, locus)` (`I-Loc`) | §6.1; `schema.prisma` | BF coherence (Def 7.2) allows `s.m`, `s.n` at the same address when both are negative. Likely relax to `(deliberationId, locus, moveType, repetitionTag)`. |
| `I-No-Additive-Silent` — separate-cone-per-additive-choice (theoretical), fail-loud (impl) | §2 Q1; §6.2; Pass 2 H3 | BF τ-sums encode non-determinism directly; additive turn-on under v2 may be τ-sum-natural rather than separate-cone-natural. Couples to BF-MELLS additive extension or Terui c-designs ([Q-033](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md#q-033), [Q-034](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md#q-034)). |

**What is *not* on this list** (i.e. survives a v2 migration unchanged): the `createDialogueMove` seam (H1), `reconstructChronicle` (H2), AIF as premise/conclusion bridge (§3), witnessing / `WitnessRecord` records-only `ι` (§4), T4 anonymity, locus prefix `⊢A.`, `Design.premiseClaimIds[]`, `I-No-Commitment-Write`, the cross-scope same-scope-only carve-out, and chronicle retirement (H7). These all live above or beside the design-notion choice.

**Recommended posture.** Ship FQ-v1 (H0–H8) on the schedule already planned. Treat any v2 BF migration as a separately-scoped programme that follows Q-030's Phase 2–5 workflow (see Q-030 in the registry). The v1 invariants above are correct as written *and* are the diff target for v2 — no rewrites required pre-emptively.
