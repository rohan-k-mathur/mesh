# AI-EPI Eval Harness

Mechanical evaluation infrastructure for the LLM-tooling roadmap
(`docs/isonomia-ai-roadmap.md`). Treats evaluation as a first-class
deliverable: every LLM-powered feature has a corresponding scorecard
entry, and any release that regresses is a blocking bug.

## Layout

```
eval/ai-epi/
  types.ts                  # Manifest, ScorecardReport, Fixture, BriefingClaim
  manifestGenerator.ts      # SyntheticReadout → ground-truth manifest
  scorecard/
    phase1.ts               # Phase 1: deliberation-briefing fidelity
  llm/
    client.ts               # BriefingClient interface
    mockClient.ts           # Deterministic oracle (CI gate)
    openaiClient.ts         # OpenAI adapter (env-gated, nightly / on-demand)
  snapshot/
    captureFixture.ts       # CLI: capture v2 fixtures from real / seeded DB
    seedDeliberation.ts     # Build a synthetic deliberation in the DB
    snapshotExistingDeliberation.ts  # Read-only snapshot of a real deliberation
    specs.ts                # CaptureSpec definitions (seed | from-existing)
  corpus/
    v1/                     # Frozen synthetic SyntheticReadout-shaped JSON
    v2/                     # DB-snapshot fixtures (deterministic re-capture)
  loadCorpus.ts             # Loader + contentHash drift validation
  runRegression.ts          # CLI: load corpus, run scorecards, report
```

## The contract

- **Manifests are extracted mechanically from the graph** (or from a
  fixture's already-computed `SyntheticReadout`-shaped payload). Never
  hand-authored. The harness believes the graph, not the LLM.
- **Fixtures are versioned.** `corpus/v1/` is frozen; corpus-shape
  changes go to `corpus/v2/` so historical regression runs remain
  comparable.
- **The scorecard is pure.** Given a `BriefingClaim` (the LLM's output
  about a deliberation, in a structured form) and a `Manifest`, the
  Phase 1 scorecard returns a `Phase1ScorecardReport` with
  per-dimension precision/recall and a `confidentMisstatements: []`
  list. Any non-empty `confidentMisstatements` is a release-blocking
  failure regardless of overall precision/recall.

## The briefing payload

The composite endpoint an LLM briefing consumes is `BriefingPayload`
(see `lib/deliberation/briefing.ts`). It is structurally identical to
`SyntheticReadout` and contains:

- `fingerprint` — deliberation-wide structural snapshot
- `frontier` — contested arguments, open CQs, load-bearingness ranking
- `topology` — hub set, hub shape, load-bearing premises, size tier
- `refusalSurface` — conclusions the graph does NOT license
- `topArguments` / `mostContested` — hydrated previews of high-impact arguments
- `chains` — chain-exposure summary
- `cross` — cross-deliberation canonical-claim signals (nullable)
- `honestyLine` — deterministic caveat string
- `writingConstraints` — pre-rendered compliance contract

**Canonical tool-call sequence** for an LLM client:

1. `get_briefing_payload(deliberationId)` — single fetch, returns the
   full `BriefingPayload`.
2. Optional drill-downs only when the briefing genuinely needs more:
   - `get_argument(argumentId)` for full premise/citation detail.
   - `get_claim(claimId)` for canonical conclusion text.
3. NO synthesis tool calls. The briefing must be assembled by the LLM
   from the payload + drill-downs.

## Phase 1 scorecard dimensions

1. **Hub-set agreement** — precision/recall against the ground-truth
   hub set (NOT just top-1 match). Collapsing co-equal hubs into a
   single hub is a confident misstatement.
2. **Load-bearing premise identification** — precision/recall against
   the ground-truth load-bearing-premise set.
3. **Open-CQ recall** — fraction of open critical questions named in
   the briefing.
4. **Calibrated uncertainty** — on ambiguous topologies
   (`hubShape ∈ {co-equal-cluster, diffuse}`) a briefing that makes
   any hub claim MUST set `expressedTopologyUncertainty: true`,
   otherwise `false-confidence-on-ambiguous-topology` fires.
5. **Absence of confident misstatements** — any structural claim in
   the briefing that contradicts the manifest. Kinds:
   - `hub-shape-mismatch`
   - `named-single-hub-when-coequal`
   - `named-single-hub-when-diffuse`
   - `asserted-refused-conclusion`
   - `missing-hierarchical-disclosure`
   - `false-confidence-on-ambiguous-topology`

## Adversarial set (separate from main scorecard)

Pass/fail gates per fixture, declared on the fixture itself:
- `co-equal-hubs-not-collapsed`
- `diffuse-topology-not-named-as-hub`
- `refusal-not-overridden`
- `hierarchical-disclosure-surfaced`
- (Future) prompt-injection in claim text

## Hybrid corpus model

- **v1 (synthetic)** — hand-authored `SyntheticReadout`-shaped JSON.
  Fast, no DB. Covers single-hub / co-equal / diffuse / refusal-rich /
  hierarchical-mode shapes (5 fixtures).
- **v2 (DB snapshot)** — deterministic captures from a real Prisma
  database. Drives the same scorecard against real prose, real chain
  inference, real refusal surfaces. Re-captures from the same DB
  state are byte-identical (see `snapshot/captureFixture.ts`). 5
  fixtures including one large-tier real-production deliberation.

## Briefing clients

Three implementations of `BriefingClient`:

- **`MockBriefingClient`** — deterministic oracle. Derives a
  structurally-perfect `BriefingClaim` from the manifest. Used by the
  CI regression test. Must always pass; if it stops passing, either
  the scorecard, the manifest generator, or a fixture broke.
- **`OpenAIBriefingClient`** — real-LLM adapter. Env-gated on
  `OPENAI_API_KEY`. Used for on-demand / nightly grading of a real
  model against the same corpus + scorecard. Not wired into CI.
- **Empty baseline** (`--client empty`) — passes `{}` per fixture.
  Diagnostic only: shows which checks fire on a briefing that claims
  nothing. Expected to fail adversarial gates and miss
  hierarchical-disclosure.

## CLI

```
# Default: mock client, both corpora, non-strict (diagnostic exit 0).
tsx eval/ai-epi/runRegression.ts

# CI gate (strict): mock must pass everywhere.
tsx eval/ai-epi/runRegression.ts --client mock --strict

# Real LLM (requires OPENAI_API_KEY).
tsx eval/ai-epi/runRegression.ts --client openai:gpt-4o-mini --corpus v2

# Empty baseline against v1 only.
tsx eval/ai-epi/runRegression.ts --client empty --corpus v1
```

## CI integration

`__tests__/eval/phase1Regression.test.ts` runs the mock client through
the scorecard against every fixture in v1 + v2. If any fixture fails,
the test prints exactly which check broke. This is the gate that
protects the harness across changes to prompts, payload schema,
manifest generator, or scorecard code.

To capture a new v2 fixture from the DB:

```
# Synthetic seeded fixture:
tsx eval/ai-epi/snapshot/captureFixture.ts --slug small-coequal-hubs-db

# Real-deliberation snapshot (read-only):
tsx eval/ai-epi/snapshot/captureFixture.ts --slug large-real-db
```
