
# AI Epistemic Surface — Roadmap Pt. 4

**Theme:** readiness and quality control. Translate the deliberation engine's existing depth into modular, computable, deliberation-scope artifacts that surface as findings — and make the protocol's anti-strawman discipline productive rather than only preventive.

**Companion:** [AI_EPI_ROADMAP_PT_4_BRAINSTORM.md](Development%20and%20Ideation%20Documents/ARCHITECTURE/Embeddable%20Widget%20Feature%20Documents/AI_EPI_ROADMAP_PT_4_BRAINSTORM.md) — the conceptual exposition, prioritization decision (extraction pipeline deferred), and full set of candidate objects. This document is the actionable sprint plan derived from it.

**Posture:** Pt. 4 is *not* a content-generation sprint. It is a readiness sprint — making the platform honest about what it knows, legible to LLM and non-expert consumers, and structurally resistant to the centrist-synthesis failure mode the Pt. 3 stress test surfaced. The corpus accretes from actual use; the engineering budget here goes to the surface that will receive it.

---

## Sprint shape

Eight items, leverage-ranked. Items 1–3 are foundational (everything else depends on them). Items 4–6 are the editorial primitives that change what consumers can do. Items 7–8 are the cold-start handling that does not require new content. Items in *italics* are stretch / next-sprint candidates.

1. **`DeliberationFingerprint` + worker-precomputed materialization** — substrate for everything else
2. **`ContestedFrontier` projection** — the anti-centrist substrate
3. **`MissingMoveReport` + scheme-typical-move catalog** — the productive form of the anti-strawman discipline
4. **`ChainExposure` on the read surface** — addresses the chains-invisible mismatch (independently of D4)
5. **`SyntheticReadout` aggregator + MCP `summarize_debate`** — the editorial primitive, with refusal surface
6. **`DeliberationStateCard` + `FrontierLane` UI primitives** — non-expert legibility, participatory
7. **`CrossDeliberationContext` (canonical-claim families subset)** — cold-start mitigation via cross-room context
8. **AI-as-materials track + engagement-rate telemetry on AI seeds** — guards against the "sophisticated corpse" failure mode
9. *`DialecticalCenterOfGravity` + `ChainSpine` UI* — stretch
10. *`PlexusContextRibbon` + full plexus-edge typing in MCP* — stretch
11. *Thesis ↔ SyntheticReadout disagreement surface* — stretch

Sprint 1 commits to items **1–6**. Item 7 lands in the same sprint if plexus query primitives can be exposed cheaply (canonical-claim subset only). Item 8 ships if items 1–6 land early; otherwise next sprint.

---

## 1 — `DeliberationFingerprint` + materialization worker

**Why first:** every downstream object depends on the deliberation-scope statistics this object exposes. It is also the cheapest single piece of work to ship and the highest single uplift to honesty (a thin deliberation can finally *say* it is thin, at the deliberation scope, in one read).

**Files to touch**

- `lib/deliberation/fingerprint.ts` (new) — `computeFingerprint(deliberationId): Promise<DeliberationFingerprint>`. Pure function over the graph; no caching here. Reuses `classifyStandingConfidence` from `config/standingThresholds.ts` and the per-argument breakdowns from [lib/citations/argumentAttestation.ts](lib/citations/argumentAttestation.ts) (pull `computeFitnessBreakdown`, depth fields). The `contentHash` is `sha256(JSON.stringify(sortedArgumentIds, sortedEdgeIds, sortedSchemes))` — deterministic, cheap, the cache key.
- `lib/models/schema.prisma` — add `DeliberationFingerprintCache` model:
  ```prisma
  model DeliberationFingerprintCache {
    deliberationId String   @id
    contentHash    String
    payload        Json
    computedAt     DateTime @default(now())
    @@index([contentHash])
  }
  ```
  Push via `npx prisma db push`.
- `workers/recomputeDeliberationFingerprint.ts` (new) — worker that recomputes on any of: argument insert/update/delete, edge insert/delete, CQ status change, evidence/citation change. Subscribes to existing event streams (or polling fallback if not present — verify in `workers/index.ts`).
- `app/api/v3/deliberations/[id]/fingerprint/route.ts` (new) — GET handler. Reads cache; if stale by `contentHash` mismatch, recomputes inline (cheap) and persists.
- `packages/isonomia-mcp/src/server.ts` — add tool `get_deliberation_fingerprint(deliberationId)`. Description must explicitly tell LLMs: "call this **first** before any other deliberation-scope synthesis; the fields here set the honesty floor for any subsequent claims about the deliberation's epistemic state."

**Schema fields per brainstorm §3.1.** Add one field beyond the brainstorm: `extraction.aiSeededCount` and `extraction.humanEngagementRateOnAiSeeds: number` — populated by item 8; default null in this sprint, wired in item 8.

**Verifier:** `__tests__/lib/deliberationFingerprint.test.ts` — fixture deliberation; assert `contentHash` is stable across reads with no graph mutation; assert `contentHash` changes after any mutation; assert standing distribution sums to argument count; assert CQ coverage components sum to total.

---

## 2 — `ContestedFrontier` projection

**Why second:** this is the single object that makes centrist-synthesis prose structurally hard to construct. An LLM consuming this output has the unanswered moves listed by name and load-bearingness rank; "the truth is somewhere between" cannot be written without lying about a structured field.

**Files to touch**

- `lib/deliberation/frontier.ts` (new) — `computeContestedFrontier(deliberationId): Promise<ContestedFrontier>`. Pulls inbound undercut / undermine / CA edges per argument; cross-references `CQStatus` rows to surface unanswered CQs (re-uses the projection logic already in `buildArgumentAttestation` from [lib/citations/argumentAttestation.ts](lib/citations/argumentAttestation.ts) — extract the catalog-vs-status diff into a shared helper). `loadBearingnessRanking` is computed by removing each argument and recomputing the grounded extension over the CEG; arguments whose removal flips the main-claim label are ranked highest. Use existing `lib/aspic/arguments.ts` for the extension computation.
- `inferenceLocator` is the index of the inference step inside an argument's diagram (already addressable via `lib/arguments/diagram.ts`).
- `terminalLeaves` — graph traversal: any argument with no inbound attacks that sits at a chain-depth ≥ 1 from the main conclusion path. Reuse `lib/db/argument-net-queries.ts` traversal helpers.
- `app/api/v3/deliberations/[id]/frontier/route.ts` (new) — GET; supports `?sortBy=loadBearingness|recency|severity`.
- `packages/isonomia-mcp/src/server.ts` — add tool `get_contested_frontier(deliberationId, sortBy?)`. Description: "use this when asked 'what's unresolved' / 'what would move this debate' / 'what's the strongest open challenge'. Do not produce 'somewhere between' synthesis without first calling this and naming the specific unanswered moves it returns."

**Cross-link to item 3:** `unansweredUndercuts[i].schemeTypical` and `challengerArgumentId: null` for scheme-typical absences come from `MissingMoveReport`. Frontier and missing-moves materialize together.

**Verifier:** `__tests__/lib/contestedFrontier.test.ts` — fixture with 1 argument with answered CQ, 1 with unanswered CQ, 1 with undercut-but-undercut-then-rebutted, 1 terminal leaf. Assert each lands in the correct field. Assert `loadBearingnessRanking` is stable for a fixed graph.

---

## 3 — `MissingMoveReport` + scheme-typical-move catalog

**Why third:** `ContestedFrontier.schemeTypical` flag and `MissingMoveReport.perDeliberation` both depend on a catalog of "moves typically present for scheme X" that does not yet exist as data. This is the work that makes the protocol's anti-strawman discipline *productive* — naming what scheme-typical undercuts are absent, not just preventing un-typed attacks.

**Files to touch**

- `config/schemeMoveCatalog.ts` (new) — for each scheme key, list expected critical questions (already covered by existing CQ catalog) **plus** expected undercut types. Schema:
  ```ts
  type SchemeMoveCatalog = Record<string, {
    expectedCqKeys: string[];               // re-export from existing CQ registry for stability
    expectedUndercutTypes: Array<{
      key: string;                          // e.g. "false-cause", "circularity", "ad-hominem-bypass"
      label: string;
      severity: "scheme-required" | "scheme-recommended";
    }>;
    expectedSchemeFamilies: string[];       // for cross-scheme mediator detection
  }>;
  ```
  Seed with the schemes already in active use: `cause-to-effect`, `expert-opinion`, `sign`, `practical-reasoning`, `negative-consequences`, `analogy`. Other schemes left as `expectedUndercutTypes: []` until catalogued — the report degrades gracefully.
- `lib/deliberation/missingMoves.ts` (new) — `computeMissingMoves(deliberationId): Promise<MissingMoveReport>`. Per-argument: catalog vs present diff. Per-deliberation: enumerate `schemesUnused` against the topic's typical scheme set (start with a static heuristic — flag if `cause-to-effect` is present without `expert-opinion`, or if all arguments are `sign` with no `cause-to-effect`); `metaArgumentsAbsent` true if no argument targets the deliberation itself; `crossSchemeMediatorsAbsent` true if no `practical-reasoning` argument bridges otherwise-disconnected sub-debates.
- `app/api/v3/deliberations/[id]/missing-moves/route.ts` (new) — GET.
- `packages/isonomia-mcp/src/server.ts` — add tool `get_missing_moves(deliberationId)`. Description: "use when asked 'what's underdeveloped' / 'what would strengthen this debate'. The output names absent scheme-typical moves; cite the missing items by name rather than gesturing at 'framing' or 'nuance'."
- Update `ContestedFrontier` (item 2) to consume this report and populate `schemeTypical` flags.

**Verifier:** `__tests__/lib/missingMoves.test.ts` — fixture `cause-to-effect` argument with no recorded `false-cause` undercut; assert it appears in `expectedUndercutTypes` minus `presentUndercutTypes`. Fixture deliberation with only `sign` schemes; assert `schemesUnused` includes `cause-to-effect` and `expert-opinion`.

---

## 4 — `ChainExposure` on the read surface

**Why now:** chains are built but invisible to MCP, attestation envelopes, and (via D4) Living Thesis. This sprint un-blocks chains independently of D4 — `ChainExposure` is a read-side projection over the existing `ArgumentChain` records and does not require D4's write-side work. An LLM can finally ground sentences like "the empirical-side spine runs A→B→C; weakest link is B (depth thin, CQ confounding unanswered)."

**Files to touch**

- `lib/deliberation/chainExposure.ts` (new) — `computeChainExposure(deliberationId): Promise<ChainExposure>`. For each `ArgumentChain` in the deliberation: traverse arguments[], pull each one's `FitnessBreakdown` and `StandingDepth` from the existing attestation pipeline, aggregate `chainFitness` (sum components, normalize), pick `chainStanding` as the worst standing in the chain (the chain is no stronger than its weakest argument), compute `weakestLink` as the argument with lowest fitness *or* most-unanswered CQs (whichever signal is more decisive — record the reason). `uncoveredClaims`: top-level claims (ones that are conclusions in the deliberation) with no chain reaching them.
- `app/api/v3/deliberations/[id]/chains/route.ts` (new) — GET.
- `packages/isonomia-mcp/src/server.ts` — add tool `get_chains(deliberationId)`. Description: "use when asked about main lines of argument or 'what should I read first'. Returns ordered chains with weakest-link annotation; reference these by id when summarizing."
- Attestation envelope ([app/api/a/[shortCode]/route.ts](app/api/a/[shortCode]/route.ts)): if the cited argument participates in any chain, include the chain ids in the envelope.

**D4 relationship:** unchanged. Living Thesis embedding of chains (D4) is a separate write-side workstream; `ChainExposure` is read-side projection and ships now.

**Verifier:** `__tests__/lib/chainExposure.test.ts` — fixture chain A→B→C with B having lowest fitness; assert `weakestLink.argumentId === B`. Assert chain standing equals worst-of standings. Assert top-level claim with no chain appears in `uncoveredClaims`.

---

## 5 — `SyntheticReadout` aggregator + MCP `summarize_debate`

**Why now:** this is the editorial primitive — the single object an LLM should be reading when asked to summarize. Without this, even items 1–4 still leave consumers to integrate the components themselves. The `refusalSurface` is the load-bearing piece; it is what makes the centrist-synthesis closer structurally unavailable.

**Files to touch**

- `lib/deliberation/syntheticReadout.ts` (new) — `computeSyntheticReadout(deliberationId): Promise<SyntheticReadout>`. Composes items 1–4 outputs plus item 7's cross-context (null when not yet shipped). Computes `refusalSurface.cannotConcludeBecause` per the rule formalized in brainstorm §8.2: any conclusion C is `cannot-license` if the support graph for C has at least one inbound undercut or undermine that is unanswered *and* is not itself attacked. Implement via grounded-extension membership (re-use `lib/aspic/arguments.ts`); for each main-claim conclusion not in the grounded extension, walk the unanswered attack chain and report the blocker ids. `honestyLine` is a deterministic single-sentence template — *not free prose*; example template: `"This deliberation has {argumentCount} arguments, {challengersMedian} median challengers per argument, and {cqCoverage}% catalog-CQ coverage. {chainCount} chain(s) reach the main conclusion; {refusalCount} potential conclusions are not licensed by the current graph."`
- `app/api/v3/deliberations/[id]/synthetic-readout/route.ts` (new) — GET.
- `packages/isonomia-mcp/src/server.ts` — add tool `get_synthetic_readout(deliberationId)` and a wrapper tool `summarize_debate(deliberationId)` whose description explicitly says: "this is the editorial primitive. Do not synthesize from raw search hits when this is available. Reference fields by name (chains[i].weakestLink, frontier.unansweredCqs, refusalSurface.cannotConcludeBecause). If the readout's refusalSurface is non-empty, do not produce a closer that resolves a contested question — name the blockers and stop."
- Update `cite_argument` description: "when the cited argument is in a deliberation, prefer including a one-line `honestyLine` from `get_synthetic_readout` rather than an editorial summary."

**Hard invariant:** `SyntheticReadout` carries no free-prose fields beyond `honestyLine`. Every other field is structured. This is the contract that makes the object resistant to centrist-synthesis prose pulled from a flat reading.

**Verifier:** `scripts/verify-synthetic-readout.ts` — for a fixture deliberation, assert (a) all components present, (b) `refusalSurface.cannotConcludeBecause` references only blocker-ids that exist in the graph, (c) `honestyLine` is a deterministic function of the contentHash.

---

## 6 — `DeliberationStateCard` + `FrontierLane` UI primitives

**Why now:** items 1–5 produce the substrate for non-expert legibility. Without these UI primitives, the substrate ships only to LLMs and the human surface remains the existing tab-heavy DeepDivePanel. Both surfaces must move forward together; the human surface is also the participation gate (FrontierLane converts read-only fields into composer-prefilled CTAs).

**Files to touch**

- `components/deliberation/DeliberationStateCard.tsx` (new) — single horizontal card, fits 200vh px. Renders: `argumentCount`, `participantCount`, `medianChallengerDepth`, `cqCoverage%`, top-2 frontier items (with `loadBearingness` icon), top-1 missing move (by severity). Click any item → opens the relevant deliberation tab focused on that argument/CQ. Used at the top of the existing DeepDivePanel and as the embeddable widget header.
- `components/deliberation/FrontierLane.tsx` (new) — horizontal scroll lane of frontier items. Each card shows: target argument title, the unanswered move (CQ prompt / undercut type / undermined premise text), severity, and a one-click "Open this thread" CTA. CTA dispatches into the existing composer with prefilled scheme + target. Reuses [components/dialogue/DialogueActionsButton.tsx](components/dialogue/DialogueActionsButton.tsx) plumbing for the prefill.
- `components/deepdive/DeepDivePanelV2.tsx` — mount `DeliberationStateCard` at the top, above the tabs. Mount `FrontierLane` as a new tab between Debate and Arguments (label: *Frontier*).
- `components/embeddable/IsonomiaWidget.tsx` (or current entry point — verify path) — replace the existing argument-list-only widget header with `DeliberationStateCard` so embedded consumers get the honesty floor first.
- `components/thesis/ThesisRenderer.tsx` — add a sidebar entry that renders `SyntheticReadout.honestyLine` and a single-click "see protocol readout" button that opens the readout in a drawer. This is the *Thesis ↔ SyntheticReadout coexistence* surface (brainstorm §5.5); the full disagreement-detection surface (brainstorm §8.4) is deferred.

**Verifier:** Playwright e2e at `e2e/deliberation-state-card.spec.ts`. Mount a deliberation with known fingerprint; assert the card renders the expected counts; assert clicking a frontier item opens the prefilled composer with the correct target.

---

## 7 — `CrossDeliberationContext` (canonical-claim families subset)

**Why now (or stretch):** addresses the cold-start case directly — a thin local deliberation can borrow density from cross-room appearances of the same canonical claim. The plexus infrastructure is mostly built ([lib/crossDeliberation/canonicalRegistryService.ts](lib/crossDeliberation/canonicalRegistryService.ts)); this work exposes the subset cheaply via MCP/UI. Full plexus-edge typing in MCP is deferred (item 10).

**Files to touch**

- `lib/deliberation/crossContext.ts` (new) — `computeCrossDeliberationContext(deliberationId): Promise<CrossDeliberationContext>`. For each claim in the deliberation, look up its canonical-claim family via the existing canonical registry; for each sibling appearance, pull the local label and the standing distribution computed from item 1's fingerprint cache. `aggregateAcceptance` is a deterministic rule: `consistent-IN` if every appearance is IN, `consistent-OUT` if every appearance is OUT, `contested` if both IN and OUT appearances exist, `undecided` otherwise. `plexusEdgesIn` and `argumentImports` come from existing schema. `schemeReuseAcrossRooms` is a fold over sibling deliberations' fingerprints' `schemeDistribution`.
- `app/api/v3/deliberations/[id]/cross-context/route.ts` (new) — GET.
- `packages/isonomia-mcp/src/server.ts` — add tool `get_cross_context(deliberationId)`. Description: "use when local depth is thin (`fingerprint.depthDistribution.thin` dominant). The canonical-claim family may carry context the local room does not."
- `lib/deliberation/syntheticReadout.ts` (item 5) — populate `cross` field once this lands.
- UI: tiny `PlexusContextRibbon` under the deliberation title is **deferred to item 10**; in this sprint, `cross` is exposed only via MCP/API.

**Defer-or-ship decision:** ship this in sprint 1 if items 1–6 land in the first ~60% of sprint capacity; otherwise punt to sprint 2.

**Verifier:** `__tests__/lib/crossContext.test.ts` — fixture canonical claim appearing in 3 deliberations with different labels; assert `aggregateAcceptance: "contested"`. Assert `schemeReuseAcrossRooms` aggregates correctly.

---

## 8 — AI-as-materials track + engagement-rate telemetry on AI seeds

**Why included:** this is the structural defense against the "sophisticated corpse" failure mode (Pt. 3 §5 retrospective, brainstorm §6 *Engagement-rate as a quality signal*). It also reframes Pt. 3's AI-authoring track from auditor-of-finished-arguments to author-of-from-materials, aligning with the extraction-pipeline integration story in the brainstorm.

**Files to touch — telemetry side**

- `lib/argument/aiAuthoring.ts` — add `recordAiDraftEngagement(argumentId, kind: "attack" | "support" | "cqAnswer")` which inserts into a new `AiDraftEngagement` table indexed on (argumentId, occurredAt). Hook this into the existing dialogue-move/CQ-answer pipelines so any human action against an AI-authored argument is recorded.
- `lib/models/schema.prisma` — add `AiDraftEngagement` model. `npx prisma db push`.
- `lib/deliberation/fingerprint.ts` (item 1) — populate `extraction.aiSeededCount` (count of `authorKind: "AI"` arguments) and `extraction.humanEngagementRateOnAiSeeds` (rolling 30-day rate from the new table). Add a derived classification: `articulationOnly: boolean` set true when `aiSeededRatio > 0.5 && humanEngagementRateOnAiSeeds < threshold`.
- `DeliberationStateCard` (item 6) — when `articulationOnly` is true, render a clear chip: "Articulation only — not yet deliberation. {N} AI-drafted arguments, {M} engaged by humans." This is the protective UI surface.

**Files to touch — materials track**

- `lib/argument/materialsAuthoring.ts` (new) — `proposeMaterialCard({ deliberationId, kind: "claim" | "evidence" | "premise-candidate", text, sources, scheme?, model, promptHash })`. Persists a `MaterialCard` record. Materials *do not* mint a permalink, do not enter the argument graph, and are invisible to all retrieval that gates on `permalink: { isNot: null }` — same invariant as the existing `createAiDraft`. Materials live on the `FrontierLane` as raw substrate.
- `lib/models/schema.prisma` — add `MaterialCard` model with fields `deliberationId, kind, text, sources Json, scheme String?, aiProvenance Json, assembledIntoArgumentId String?` (set when a human assembles materials into an argument via the FrontierLane composer). `npx prisma db push`.
- `app/api/v3/deliberations/[id]/materials/route.ts` (new) — POST (token-gated, AI agent only) + GET (frontier consumers).
- `packages/isonomia-mcp/src/server.ts` — add tool `propose_materials(deliberationId, kind, ...)`. Description must explicitly state: "Materials are *substrate for human authoring*, not arguments. They are invisible to public retrieval and have no standing. Only humans assembling them via the FrontierLane composer mints an argument. Use this in preference to `propose_argument` when the goal is to extend articulation density on a thin deliberation."
- `docs/MATERIALS_AUTHORING_POLICY.md` (new) — short companion to existing `docs/AI_AUTHORING_POLICY.md`. Two invariants: (1) materials never auto-publish; (2) materials never affect standing or fingerprint counts (they are not arguments).

**Verifier:** `__tests__/api/materials.test.ts` — assert proposing a material does not increment `argumentCount` on the fingerprint, does not produce a permalink, and is invisible to `search_arguments`. `__tests__/lib/aiEngagement.test.ts` — assert engagement events update `humanEngagementRateOnAiSeeds`; assert `articulationOnly` flag flips correctly at threshold.

---

## Cross-cutting checks

- **Caching strategy.** Items 1–7 all materialize from the same `contentHash`. Each new endpoint should read its precomputed payload from a per-object cache table keyed on `(deliberationId, contentHash)` and recompute inline on miss. The fingerprint-recompute worker (item 1) should fan out to refresh dependent caches in the same job.
- **MCP tool description discipline.** Same principle as Pt. 3: every new tool description must explicitly tell the LLM *when to call it* and *what the field shapes prevent*. The Pt. 3 stress test only worked because tool descriptions told the model what was available and what it meant.
- **`/.well-known/argument-graph`** — advertise the new endpoints under `endpoints` and the new object schemas under `formats`.
- **OpenAPI spec** — add `DeliberationFingerprint`, `ContestedFrontier`, `MissingMoveReport`, `ChainExposure`, `CrossDeliberationContext`, `SyntheticReadout`, `MaterialCard` to `components.schemas`. Add the new endpoints under `paths`.
- **Embeddable widget.** Items 6 and 8's surface changes apply to the embedded widget too — the widget should be the cleanest possible expression of the readiness-and-honesty posture.
- **Re-run `MCP_STRESS_TEST_4` after the sprint.** The model should now be able to (a) read a `SyntheticReadout` and ground its summary in `chains[i].weakestLink` and `frontier.unansweredCqs`; (b) refuse to produce a "somewhere between" closer when `refusalSurface.cannotConcludeBecause` is non-empty; (c) name absent scheme-typical moves from `MissingMoveReport`; (d) recognize `articulationOnly: true` and qualify any standing claim accordingly. If any of those still require LLM inference, the surface is not done.

---

## Open questions deferred to sprint 2 or beyond

- **`DialecticalCenterOfGravity`** — included in brainstorm §3.4, deferred here. Implementation requires the loadBearingness ranking from item 2 plus ludic motif structure extraction from `lib/ludics/`. Worth shipping once items 1–8 land and the editorial substrate has been exercised.
- **Full plexus-edge typing in MCP / `PlexusContextRibbon` UI** — item 7 ships only the canonical-claim subset of cross-context. The full plexus-edge surface (typed edges, room functor adaptations) is sprint 2.
- **Thesis ↔ SyntheticReadout disagreement detection** — brainstorm §8.4. When a human Thesis and the protocol readout diverge, that is itself a finding. Detecting and surfacing the divergence is a sprint-2 candidate; this sprint only ensures the two surfaces coexist (item 6 mounts the readout next to the thesis).
- **Refusal-surface formalism stress test** — the rule in item 5 (grounded-extension projection) is the right starting point, but adversarial fixtures (cyclic attacks, preference-ordered defeat) may expose edge cases. Keep an eye on this once the verifier in item 5 starts running against real deliberations.
- **Extraction pipeline** — explicitly deferred per [AI_EPI_ROADMAP_PT_4_BRAINSTORM.md](Development%20and%20Ideation%20Documents/ARCHITECTURE/Embeddable%20Widget%20Feature%20Documents/AI_EPI_ROADMAP_PT_4_BRAINSTORM.md) §0a. Not on the Pt. 4 critical path.

---

## Appendix A — Sprint sequencing rationale

1. **Items 1 → 2 → 3 are strictly sequential.** Frontier needs fingerprint's contentHash for caching. Missing-moves needs frontier's structure to wire `schemeTypical`.
2. **Items 4, 5 can parallelize once 1–3 land.** Chain exposure has no dependency on the readout aggregator; the readout aggregator consumes both in parallel.
3. **Item 6 (UI) lags items 1–5 by ~1–2 days** — the substrate must exist before the card can render anything meaningful. Skeleton with mocks can start immediately for layout iteration.
4. **Item 7 ships in sprint 1 if capacity allows; otherwise sprint 2.** Decision point at sprint mid-week.
5. **Item 8 ships last.** It depends on item 1's fingerprint having an `extraction` field stub (already specified above) and on the FrontierLane composer surface from item 6 to consume materials.

## Appendix B — Pt. 3 → Pt. 4 lineage (ratified)

| Pt. 3 shipped | Pt. 4 consumer |
|---|---|
| `FitnessBreakdown` ([lib/citations/argumentAttestation.ts](lib/citations/argumentAttestation.ts)) | `DeliberationFingerprint`, `ChainExposure.chainFitness` |
| `CriticalQuestionsAggregate` (same file) | `ContestedFrontier.unansweredCqs`, `MissingMoveReport.perArgument` |
| `StandingDepth` (same file + [config/standingThresholds.ts](config/standingThresholds.ts)) | `DeliberationFingerprint.depthDistribution`; honesty floor across all readouts |
| `CitationBlock` ([lib/citation/serialize.ts](lib/citation/serialize.ts)) | unchanged; canonical evidence shape across all new objects |
| AI authoring ([lib/argument/aiAuthoring.ts](lib/argument/aiAuthoring.ts), [docs/AI_AUTHORING_POLICY.md](docs/AI_AUTHORING_POLICY.md)) | extended by item 8: engagement telemetry + materials-authoring track |

| Pt. 3 deferred | Pt. 4 framing |
|---|---|
| #4 Topology endpoint | absorbed into `ChainExposure` (item 4) and (deferred) `DialecticalCenterOfGravity` |
| #6 Scheme-typed query | absorbed into `MissingMoveReport.perDeliberation.schemesUnused`; refinement to `search_arguments` is a low-cost follow-up |
