# Ludics Sessions 1 & 2 — Dev-Spec Quality Review Prompt

**Purpose.** Standalone prompt for a dedicated review thread that evaluates
whether `LUDICS_SESSION_1_DEV_SPEC.md` and `LUDICS_SESSION_2_DEV_SPEC.md`
themselves are good specs — i.e., (a) whether they faithfully translated
the Tier-1 conceptual substrate into implementable contracts, and (b)
whether the architectural commitments they made were optimal under the
constraints visible at the time and visible now. Open a fresh conversation,
paste this document as context, and let the model work through the review
in two passes. The session produces `LUDICS_SESSIONS_1_2_SPEC_REVIEW.md`
as its primary deliverable.

**Companion document.** This review is complementary to (not redundant
with) `LUDICS_SESSIONS_1_2_AUDIT_PROMPT.md`. That prompt asks *"does the
code match the spec?"*; this prompt asks *"is the spec the right spec?"*
Run them as parallel threads and triage findings together. A
"code matches spec" finding from the audit becomes "implemented correctly
but rip it out" if this review finds the spec itself was wrong.

**This is a read-only, analytical exercise.** Do not rewrite specs or code
during the review. Record findings, propose alternatives, and let the human
triage.

---

## §0. Inputs

Read these documents in full before starting:

**The specs under review:**

1. `Development and Ideation Documents/ARCHITECTURE/Ludics Generative Substrate Documents/LUDICS_SESSION_1_DEV_SPEC.md`
2. `Development and Ideation Documents/ARCHITECTURE/Ludics Generative Substrate Documents/LUDICS_SESSION_2_DEV_SPEC.md`

**The conceptual substrate the specs were translating from** (Pass A reads
*up* into these):

3. `LUDICS_GENERATIVE_SUBSTRATE.md` — Tier-1 substrate definition: $\iota$,
   $E(D_P)$, $\mathsf{Art}(B)$, witnessing record, T4 separation, fossil
   discipline.
4. `LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md` — the witnessing-record
   protocol the specs operationalise.
5. `LUDICS_OPEN_COMPOSITION_JOINT.md` — the composition story the per-cone
   reframe interacts with.
6. `LUDICS_TRIADS_CLOSURE_AND_CONFIDENCE_ERASURE_FUNCTOR.md` and
   `LUDICS_TRIADS_BRIDGE_AND_CLOSURE_JOIN.md` — bridge to existing Triads
   machinery; the specs assume certain compatibilities.
7. `LUDICS_CONSOLIDATION_AND_DEV_READINESS.md` — OQ register; the specs
   inherited "Closed" / "Open" verdicts that shaped their commitments.
8. `LUDICS_OQ_JSL_PROOF.md` and `LUDICS_ORDER_RELATION_DEFINITION.md` — the
   Phase 2e proof and Phase 2f pre-session definitional clarification.
   Both *post-date* the specs and may have invalidated assumptions.

**Skim, do not deeply read:**
`LUDICS_USEFULNESS_BRAINSTORM.md`, the `LITERATURE_REVIEW_*` docs, and any
`PHASE_2*_PROMPT.md` files — context, not review targets.

---

## §1. Method

The review runs in two passes. Do Pass A first to completion before
starting Pass B — they use different mindsets and contaminating them
weakens both.

### Pass A — Conceptual fidelity

For each contract the specs commit to (Prisma model, MCP tool, manifest
field, scorecard dimension, API route, invariant, lifecycle hook):

1. **Locate the conceptual artefact** the contract is operationalising —
   which definition / theorem / discipline from the substrate docs is
   this the implementation of?
2. **Rate the translation** on five options:
   - **FAITHFUL** — the contract correctly encodes the conceptual
     artefact; no assumptions added or lost.
   - **LOSSY** — the contract drops a property the conceptual artefact
     guarantees (e.g., the spec stores design inclusion as a flat
     pair but loses the chronicle-set inclusion direction).
   - **DISTORTED** — the contract encodes a *different* property and
     calls it the conceptual one (e.g., approximation order vs.
     chronicle-set inclusion — the very confusion Phase 2f pre-session
     clarified).
   - **OVER-COMMITTED** — the contract adds structure the conceptual
     artefact does not justify, narrowing the implementation more than
     necessary (e.g., requiring a total order where the substrate only
     guarantees a partial order).
   - **UNDER-COMMITTED** — the contract is strictly weaker than the
     substrate licenses, leaving useful structure unexposed.
3. **Flag unstated assumptions.** Where the spec introduces a property
   not visible in the substrate (e.g., uniqueness, monotonicity,
   commutativity), note it and check whether it follows from the
   substrate or is a fresh axiom.

### Pass B — Architectural quality

For each major architectural commitment, force the reviewer to consider
alternatives. The commitments to walk:

- **Prisma model decomposition** — five models (`LudicMove`, `WitnessRecord`,
  `Design`, `Behaviour`, `DesignInclusion`). Why these five? Why not four
  (fold `DesignInclusion` into a self-join on `Design`)? Why not six
  (separate `IncarnationCone`)?
- **MCP tool granularity** — ~14 tools in six clusters. Why this
  cardinality? Why not three coarse-grained tools? Why not 30 fine-grained?
- **Manifest field set** — what's in, what's deliberately out, what was
  added late (`incarnationSet` in 2b, `dependencyEdges` in 2f-OQ4).
- **Scorecard weighting and the `ConfidentMisstatementKind` enum** — which
  misstatements are release-blocking vs. soft? Are the boundaries defensible?
- **Fossil discipline placement** — `fossilize()` as a callable function vs.
  a DB trigger vs. an event-bus subscriber.
- **Briefing-fingerprint cache backend** — in-memory `Map` in Session 1,
  Redis in Session 2. Was the staged migration the right call or
  premature commitment to one backend?
- **Rate limiting choice (2f)** — Redis/Upstash + 10/min per `participantId`
  on `bind_participant_to_design`. Is `participantId` the right key? Why
  not per-tenant or per-session?
- **Cache-warming via BullMQ (2f)** — vs. lazy hydration, vs. a periodic
  worker. What invariants does each preserve / break?
- **Per-cone reframe of C3 (2e)** — vs. the original global statement. Was
  the reframe the minimum-disruption fix, or did it close off useful
  generality?

For each commitment:

1. **State the chosen design** in one paragraph.
2. **Propose ≥2 alternatives.** They must be plausible, not strawmen.
3. **Score each (chosen + alternatives) on five axes**, 1–5:
   - **Correctness** — does it preserve the substrate's invariants?
   - **Performance** — operational cost at expected scale.
   - **Operability** — debuggability, observability, blast radius of
     failure.
   - **Evolvability** — cost of changing the choice later when new OQs
     close.
   - **Cognitive load** — surface area an implementer / agent must hold
     in working memory.
4. **Pick a winner** and state whether the spec's choice wins or loses.
   Where the spec loses, write a one-paragraph "what should it have been"
   recommendation.

---

## §2. Session 1 review checklist (per phase)

For each phase, run Pass A on every contract and Pass B on every major
commitment. Reference the spec section number explicitly.

### Phase 1a — Prisma models (§4 / Phase 1a in Session 1 spec)
- Pass A: each of the five models against `LUDICS_GENERATIVE_SUBSTRATE.md`
  and `LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md`. Does
  `DesignInclusion` faithfully encode chronicle-set inclusion (Reading A,
  per `LUDICS_ORDER_RELATION_DEFINITION.md`)? Does `WitnessRecord` carry
  the locus back-pointer discipline?
- Pass B: model decomposition (above), primary key choice, index strategy.

### Phase 1b — 14-tool MCP surface (§1)
- Pass A: each tool against the substrate concept it exposes. Are
  `compute_articulation_join` and `get_articulation_lattice` faithful to
  $\mathsf{Art}(B)$? Does `bind_participant_to_design` faithfully encode
  $\iota$?
- Pass B: tool granularity, cluster organisation, the choice to keep all
  29 pre-existing tools alongside (vs. deprecating overlaps).

### Phase 1c — Structural manifest (§2)
- Pass A: each manifest field against the substrate property it computes.
  Anything claimed mechanical that is actually heuristic?
- Pass B: the field set as a whole — too small / too large? Schema
  evolution path?

### Phase 1d — Fidelity scorecard (§3)
- Pass A: each scorecard dimension against the conceptual notion of
  fidelity (T4 separation, witnessable vs. latent vs. walked).
- Pass B: weighting, the release-blocking boundary, whether the scorecard
  is a measurement or an enforcement mechanism (and whether that's the
  right framing).

### Phase 1e — Non-attribution DB invariant (§4)
- Pass A: does the schema constraint faithfully encode the substrate's
  non-attribution discipline, or only a weaker projection?
- Pass B: invariant placement (schema constraint vs. service guard vs.
  application layer); what attacks does each defend against?

### Phase 1f — Briefing-fingerprint API (§5)
- Pass A: do the five material-change rules cover the substrate's notion
  of material change? Anything classifiable as material that none of the
  five catches?
- Pass B: API shape, the in-memory cache choice (later revised in 2f).

### Phase 1g — 169 invariant tests
- Pass A: do the invariants tested correspond to substrate invariants, or
  only to spec'd contracts? (Tests can pass while substrate invariants
  silently fail.)
- Pass B: test architecture, mock strategy, the choice to mock Prisma
  globally vs. use a test DB.

---

## §3. Session 2 review checklist (per phase)

### Phase 2a — Staging migration + benchmarks (§1)
- Pass A: do the benchmarks measure the substrate-relevant operations, or
  only easy-to-measure proxies?
- Pass B: `db push` vs. generated migration; benchmark coverage; what
  performance OQs the benchmarks were meant to close.

### Phase 2b — `incarnationSet` manifest field (§2)
- Pass A: faithful encoding of $\mathsf{Inc}(B)$? Note that Phase 2e
  proved this is an antichain — was the manifest field shaped before or
  after that knowledge was available?
- Pass B: representation (set of design IDs vs. structured object), where
  in the manifest it lives.

### Phase 2c — AI synthesis workflow (§3)
- Pass A: does the workflow respect the substrate's compositional
  discipline (T4, $\iota$ invariants I1–I4)?
- Pass B: tool sequencing, error-handling boundaries, idempotency of
  `bind_participant_to_design`.

### Phase 2d — Fossil retraction lifecycle (§4)
- Pass A: does the lifecycle preserve the fossil-record discipline from
  the substrate? Are locus back-pointers correctly maintained on
  retraction?
- Pass B: hook placement (deletion handler vs. event bus vs. periodic
  reconciliation); failure modes (partial retraction).

### Phase 2e — OQ-JSL formal proof (§5)
- Pass A: does the corrected C1 statement faithfully encode the proof's
  conclusion? Cross-check against `LUDICS_OQ_JSL_PROOF.md`. Also
  cross-check against `LUDICS_ORDER_RELATION_DEFINITION.md` (Phase 2f
  pre-session) — has the order-ambiguity resolution been propagated into
  every spec contract that depended on $\leq_\subseteq$?
- Pass B: the per-cone reframe vs. alternatives (e.g., restating C3 with
  $\sqsubseteq$ instead of $\subseteq$, as flagged in the new
  `OQ-C3-thin-cones` row).

### Phase 2f — Production readiness (§6)
- Pass A: do the rate-limit / cache-warm / auth / durability commitments
  preserve substrate invariants under concurrency and restart?
- Pass B: full forced-alternatives walk on each of the four sub-items
  (rate limiting, BullMQ cache warming, auth audit, fingerprint
  durability).

---

## §4. Cross-cutting checks

After per-phase review, run these:

1. **Inter-session coherence.** Did Session 2 silently re-interpret any
   Session 1 contract? (Common failure mode: Session 1 spec'd a
   `Design.kind` enum, Session 2 added a value to it without updating the
   Session 1 doc.)
2. **OQ closure timing.** Walk every OQ in
   `LUDICS_CONSOLIDATION_AND_DEV_READINESS.md` that closed *after* the
   spec that depended on it. Did the spec commit to a fallback that the
   later closure made obsolete? **Regret check** — for each such OQ, ask
   "if we had known the closure verdict when writing the spec, would the
   spec have been different?" Especially: OQ-fidelity (closed 2f),
   OQ-JSL (closed 2e), the order-ambiguity (resolved 2f pre-session).
3. **Stated-but-unenforced invariants.** Every place a spec says "must"
   without specifying *who* enforces it. List them.
4. **Observability gap.** What can fail silently in production under
   these specs? Which substrate invariants have no monitoring surface?
5. **Deferred-item inventory.** Both specs explicitly defer items.
   Re-examine each deferral: was it the right deferral (genuine future
   work) or a hidden incompleteness (the spec couldn't decide and punted)?
6. **Tier-1-to-Tier-2 promotion path.** The substrate doc distinguishes
   Tier-1 (substrate) from Tier-2 (interface). Did the specs respect the
   boundary, or do they leak Tier-1 concepts into Tier-2 surfaces (or
   vice versa)?

---

## §5. Deliverable

Produce `LUDICS_SESSIONS_1_2_SPEC_REVIEW.md` with:

- **Executive summary** (≤15 lines): top three fidelity findings, top
  three architectural findings, and a single sentence per session
  ("Session 1 spec is mostly faithful with [X] notable distortions and
  [Y] architectural calls worth revisiting; Session 2 spec is …").

- **Pass A findings table.** Columns: Phase, Contract, Substrate
  artefact, Rating (FAITHFUL / LOSSY / DISTORTED / OVER-COMMITTED /
  UNDER-COMMITTED), Evidence, Notes.

- **Pass B findings table.** Columns: Phase, Commitment, Spec choice,
  Alternatives considered, Winner, Did spec win?, Recommendation.

- **Cross-cutting findings** (one subsection per §4 check).

- **Regret-check inventory** (from §4.2), as its own section, since this
  is the highest-value output: it identifies specs that should be
  rewritten now that OQs they predated have closed.

- **Triage** of all findings into three bins:
  - **Spec is wrong — rewrite.** Highest priority. These should be
    fixed before any new code is written against the affected sections.
  - **Spec is right but under-specified — augment.** Add the missing
    invariant / failure mode / enforcement point.
  - **Spec is fine — kept for the record.** No action; documented for
    future reviewers.

- **Outstanding questions for the implementation thread or for fresh
  conceptual sessions** — anything the review surfaced but could not
  resolve from spec + substrate reading alone.

---

## §6. Scope-out

- **Do not audit code.** Spec review reads spec ↔ substrate, not spec ↔
  code. The companion `LUDICS_SESSIONS_1_2_AUDIT_PROMPT.md` does the
  spec ↔ code direction; running them together gives the full picture.
- **Do not rewrite the specs.** Record findings only. Spec rewrites are
  a separate, deliberate action by the human after triage.
- **Do not re-derive conceptual proofs.** `LUDICS_OQ_JSL_PROOF.md` and
  `LUDICS_ORDER_RELATION_DEFINITION.md` are inputs; treat them as ground
  truth.
- **Do not propose new features.** Scope is "is the spec we have the
  right spec?", not "what else should the spec have included?" The one
  exception is *substrate-licensed* features the spec missed — those are
  UNDER-COMMITTED findings in Pass A.
- **Do not audit Sessions 0a–0h conceptual work.** Those are inputs to
  this review; reviewing them is a separate exercise.

---

## §7. Recommended working order

1. Read all §0 inputs in full — especially the substrate doc; it is the
   ground truth for Pass A.
2. **Pass A first**, all of it, both sessions, before starting Pass B.
   Pass A is convergent (faithful or not); Pass B is divergent
   (alternatives explored). Doing them concurrently contaminates both.
3. **Pass B** — work session by session. Allow more time for Session 2
   commitments; they're more architecturally consequential (rate
   limiting, cache backend, lifecycle hooks).
4. **§4 cross-cutting**, especially the regret check.
5. Compile §5 deliverable.

Budget roughly equal time across the two passes. The triage in §5 is
where the value lands — leave time for it.
