# Ludics Harmonization — Pass 2: Ranked Sprint Plan

> **Session output (planning only, no code changes).** Companion to
> [LUDICS_HARMONIZATION_PASS_1_THEORETICAL_MAP.md](LUDICS_HARMONIZATION_PASS_1_THEORETICAL_MAP.md);
> assumes its terminology, correspondence table, and invariant set.
>
> **Hard constraints.** T4; OQ-JSL; per-cone Inc(B) antichain; locus prefix
> only `⊢A.`; no regression on existing ~308 invariants; `schema.prisma` is
> authoritative.
>
> **Sprint convention.** "H" = harmonization sprint. Each sprint has Goal,
> Files touched, Schema changes, Invariant additions, MCP changes, Migration,
> and Acceptance test. Dependency edges are explicit in §0.

---

## 0. Dependency graph (read top-down)

```
                       H0  invariant-snapshot
                            │
                            ▼
                       H1  creation seam
                       ┌────┼────┐
                       ▼    ▼    ▼
                      H2   H3   H4
                  read-path bridge premise
                  + chron-  (same- backfill
                  reconstr  scope)
                       │    │    │
                       └────┼────┘
                            ▼
                       H5  witness backfill
                            │
                            ▼
                       H6  legacy UI → substrate read path
                            │
                            ▼
                       H7  retire LudicChronicle (+ cache)
                            │
                            ▼
                       H8  MCP orientation cleanup + version bump
```

H0 is a prerequisite that should land before any other harmonization sprint
edits behaviour. H1 unblocks the rest. The original H8 (multi-Design fix
#4) was deleted after the 2026-05-27 deliberation confirmed by direct grep
that no production code requires it (no `@@unique([deliberationId,
participantId])`, no `findUnique`/`findFirst` by participantId in production
source). The UI clarification it would have addressed folds into H6.

---

## H0 — Invariant snapshot & freeze

**Goal.** Capture current pass/fail state of every existing invariant
(`__tests__/invariants/**`) and freeze the legacy-direct DM-creation paths
so they cannot proliferate during H1.

**Files touched.**
- `__tests__/invariants/_snapshot.json` (new — count, names, pass/fail).
- `scripts/snapshot-invariants.ts` (new).
- Existing DM-creation call sites: add an `// HARMONIZATION-FREEZE: …`
  comment marker so any *new* call site is grep-detectable in PRs.

**Schema changes.** None.

**Invariant additions.** None (this sprint *records* invariants, does not
add them).

**MCP changes.** None.

**Migration.** None — read-only.

**Acceptance test.**
- `scripts/snapshot-invariants.ts` exits 0; produces a snapshot with the
  expected ~308 count (record the actual number; the spec uses ~308 as a
  floor, not a ceiling).
- `rg "HARMONIZATION-FREEZE"` returns every site that currently writes a
  `DialogueMove`. Document the list in
  [LUDICS_HARMONIZATION_SESSION_SUMMARY.md](LUDICS_HARMONIZATION_SESSION_SUMMARY.md).

---

## H1 — Canonical DialogueMove creation seam (the keystone sprint)

**Goal.** A single, transactional API path `createDialogueMove(input)` that
atomically writes:
1. the `DialogueMove` row (legacy);
2. the corresponding `AifNode` (and `AifEdge` rows of type `premise` /
   `conclusion` when the move asserts/attacks an argument);
3. the legacy `LudicAct` + `LudicLocus` (so the engine runtime is
   unchanged);
4. the substrate `LudicMove` (idempotent on `(deliberationId, locus)`);
5. the substrate `WitnessRecord` binding `DialogueMove ↔ LudicMove`
   (records-only `ι`, idempotent on `dialogueMoveId`);
6. **(conditional)** a new `Design` row (and `DesignInclusion` covers
   within the cone) iff this witness is the first realisation of a chronicle-set
   not already in `Behaviour.designs`.

All existing DM-creation sites in API routes, workers, and scripts are
**replaced** with calls to this seam. The `HARMONIZATION-FREEZE` markers
from H0 are deleted as each site is converted.

**Files touched.**
- New: `lib/ludics/createDialogueMove.ts` (the seam, transactional).
- Update every site flagged in H0 (likely under `app/api/dialogue/**`,
  `app/api/deliberation/**/moves/**`, `workers/**`, `scripts/seed*`).
- `packages/ludics-engine/aif-sync.ts` — extract the AIF write path into a
  function callable by the seam (don't re-implement).
- `scripts/bridge-legacy-to-substrate.ts` — refactor the per-move logic into
  a reusable function the seam calls.

**Schema changes.** None expected; if a `DialogueMove.unbridgeable` JSON
flag is needed for I-Seam, add it on `payload` (no migration).

**Invariant additions.**
- **I-Seam:** every newly created `DialogueMove` has either a
  `WitnessRecord` row or `payload.unbridgeable: true` with a reason.
- **I-AIF-min:** every newly created `DialogueMove` that asserts/attacks an
  argument has its corresponding `AifNode` + `AifEdge`.
- New tests in `__tests__/invariants/h1-creation-seam.test.ts`.

**MCP changes.** `propose_argument`, `propose_structured_argument`, and
`propose_warrant` internally route through the new seam. Their public
contracts do not change.

**Migration.** None for historical data (H5 handles backfill). New writes go
through the seam from day one.

**Acceptance test.**
- For 100 synthetic DMs created via every modified API route, assert:
  `WitnessRecord.count() === 100` and `AifEdge.where({ edgeType: { in: ['premise','conclusion'] }}).count() ≥ N_arg_moves`.
- `rg "prisma.dialogueMove.create\("` returns *only* the seam file.

---

## H2 — Substrate read-path consolidation (+ chronicle reconstruction helper)

**Goal.** Define and enforce the substrate read path:
`lib/ludics/substrate/read.ts` exposes `getBehaviour`, `getIncarnations`,
`getDesign`, `getWitnesses`, `getExposureMap`, all T4-anonymous by default.
No other module reads `LudicDesign`/`LudicAct`/`LudicChronicle` for
substrate-level questions.

Also ship `lib/ludics/chronicles/reconstruct.ts` exposing
`reconstructChronicle(designId)` that rebuilds the chronicle on demand from
`Design.loci[]` + the relevant `LudicTrace.steps[]` ordering. This is the
seam every current `LudicChronicle` reader will migrate to before H7 drops
the tables.

**Files touched.**
- New: `lib/ludics/substrate/read.ts`.
- New: `lib/ludics/chronicles/reconstruct.ts`.
- Audit and update all MCP substrate tool handlers in `server.ts` (substrate
  cluster) to call the consolidated read path.
- Any analysis modules under `lib/ludics/` that compute substrate facts
  from legacy tables — re-route or mark legacy.

**Schema changes.** None.

**Invariant additions.**
- **I-No-Legacy-Read:** Lint rule (`scripts/lint-no-legacy-ludics-read.ts`)
  fails the build if a substrate-tagged file imports `prisma.ludicDesign`,
  `prisma.ludicAct`, or `prisma.ludicChronicle*`.
- Test: `__tests__/invariants/h2-no-legacy-read.test.ts`.
- `reconstructChronicle` parity test: for a sample of designs, the
  reconstructed chronicle equals the persisted `LudicChronicle.acts[]`
  modulo order-equivalence on the trace step indexing.

**MCP changes.** Substrate-cluster tools become thin wrappers over
`lib/ludics/substrate/read.ts`. No contract change.

**Migration.** None.

**Acceptance test.** Lint passes; substrate tool integration tests still
green; T4 fixture (request without `includeIdentity`) never returns
`participantId`; reconstruct parity test green on the canonical fixture.

---

## H3 — Bridge completion: same-scope only, fail-loud on additive

**Goal.** Make `bridge-legacy-to-substrate.ts` *total in the same-scope,
non-additive subset* of legacy data, with explicit fail-loud handling for
the two carve-outs settled in the 2026-05-27 deliberation:

- **Cross-scope designs** (any `LudicDesign` with non-empty
  `referencedScopes[]` or `crossScopeActIds[]`): bridge does *not*
  materialise the foreign loci. Instead, the design is recorded in a new
  `bridge_skips` log table (or JSONL artefact) with
  `reason: "cross-scope"` and the count of referenced scopes. Cross-scope
  substrate semantics is deferred to a substrate-v2 design exercise.
- **Additive ramifications** (`LudicAct.isAdditive === true`): bridge
  asserts `false` and throws on the first true encountered. Separate-cone
  logic for additives is a follow-on sprint that ships when (and if) the
  first additive act actually lands in production data.

**Files touched.**
- `scripts/bridge-legacy-to-substrate.ts` — add both guards.
- New: `scripts/bridge-skip-report.ts` (summarises the skip log).
- New: `__tests__/integration/h3-bridge-same-scope.test.ts`,
  `h3-bridge-additive-asserts.test.ts`.

**Schema changes.** Optionally add a `BridgeSkip` table
(`id, deliberationId, legacyDesignId, reason, detailJson, createdAt`) if
the skip log needs to be queryable from the UI. If not, JSONL under
`misc-documents/bridge-skips/` is sufficient. Per repo guidance, schema
changes go through `npx prisma db push`.

**Invariant additions.**
- **I-Same-Scope:** no substrate `Design` exists whose underlying legacy
  `LudicDesign` has non-empty `referencedScopes[]`.
- **I-No-Additive-Silent:** the bridge throws on any `LudicAct.isAdditive
  === true`; no substrate write occurs in that case.

**MCP changes.** None.

**Migration.** Re-run bridge on the canonical fixture
`cmoxol76e03748cssx07tvkhd`; expected: skip log enumerates any cross-scope
designs; all other designs bridge cleanly; existing 308 invariants and the
new H3 invariants green.

**Acceptance test.** On the canonical deliberation: skip-log rows for
cross-scope designs are explicit and reviewed; `Design.loci[]` audit finds
zero foreign loci; `prisma.ludicAct` query confirms zero `isAdditive=true`
rows (the fail-loud path is exercised only by a synthetic test, not by
real data).

---

## H4 — Premise/conclusion backfill (the 3b prompt)

**Goal.** Populate `Design.premiseClaimIds[]` by walking AIF
`premise`/`conclusion` edges from each design's loci. Depends on H1 having
populated AIF edges going forward and on H5 backfilling history.

**Files touched.**
- New: `scripts/backfill-design-premise-claims.ts`.
- `lib/ludics/substrate/read.ts` (expose `getPremiseClaims(designId)`).

**Schema changes.** None — `Design.premiseClaimIds[]` already exists.

**Invariant additions.**
- **I-Premise:** `Design.premiseClaimIds[]` = deduped union of
  `ArgumentPremise.claimId` for arguments reachable via AIF edges from any
  locus in `Design.loci[]`.
- Test: `__tests__/invariants/h4-premise-backfill.test.ts`.

**MCP changes.** `get_articulation_lattice`, `find_substitute_premises`,
`compute_articulation_join` return non-empty `premiseClaimIds` on real data.

**Migration.** `scripts/backfill-design-premise-claims.ts --all` over every
deliberation; idempotent.

**Acceptance test.** On the canonical fixture, fraction of `Design` rows
with non-empty `premiseClaimIds` rises from current ~0 to ≥ 80 %.

---

## H5 — Historical witness backfill

**Goal.** For every historical `DialogueMove` that has a resolvable locus
(directly, via `payload.locusPath`, or via AIF traversal), create the
corresponding `LudicMove` (if missing) and `WitnessRecord` row.
Unresolvable DMs are tagged `payload.unbridgeable: true` with reason.

**Files touched.**
- New: `scripts/backfill-witnesses.ts` (wraps existing
  `backfill-dm-locus-from-aif.ts` logic + adds witness row creation).
- Reuse `lib/ludics/createDialogueMove.ts` internals where possible.

**Schema changes.** None.

**Invariant additions.** I-Seam now applies to *all* DMs (historical +
new), not just post-H1.

**MCP changes.** None.

**Migration.** `scripts/backfill-witnesses.ts --all`; idempotent.

**Acceptance test.** On the canonical fixture
`cmoxol76e03748cssx07tvkhd`: the 52 / 447 disjoint split closes to either
"all 499 witnessed" or "X witnessed + (499 − X) tagged unbridgeable with
recorded reasons." Reasons are reviewed and documented.

---

## H6 — Legacy Ludics UI tab onto the substrate read path

**Goal.** `components/deepdive/LudicsPanel.tsx` and friends (`LudicsForest`,
`LociTreeWithControls`, `BehaviourInspector`, `AnalysisPanel`,
`TraceRibbon`) read substrate data via `lib/ludics/substrate/read.ts`
(through SWR fetchers calling MCP tools or thin REST endpoints) instead of
hitting `LudicDesign`/`LudicAct` directly.

`LudicTrace` panels (the runtime telemetry) keep reading legacy — see Pass
1 §4 — but are clearly labeled "interaction telemetry."

**Files touched.**
- `components/deepdive/LudicsPanel.tsx`.
- `components/ludics/**` (audit each).
- `app/api/ludics/**` — endpoints used by UI: identify those that should
  proxy to the substrate read path.

**Schema changes.** None.

**Invariant additions.** None (I-No-Legacy-Read from H2 covers this once
substrate components opt in).

**MCP changes.** None at the protocol level. The UI may call MCP tools
directly for substrate views.

**Migration.** None.

**Acceptance test.** Playwright/Storybook flow: open Ludics panel on the
canonical fixture; verify (a) anonymous by default (T4), (b) shows
cone-decomposed incarnations rather than per-participant designs, (c) no
HTTP request goes to a `LudicDesign`-direct endpoint for substrate views.

---

## H7 — Retire `LudicChronicle` and `LudicChronicleCache`

**Goal.** Drop the two tables (and the per-chronicle reads they back), in
favour of `reconstructChronicle(designId)` from H2. Justified by Pass 1 §4
and the empirical finding (Q2 deliberation): no production reader depends
on persisted row ordering.

**Files touched.**
- `prisma/schema.prisma` — remove the two models and their relations.
- Confirm `rg "ludicChronicle"` returns only the dump script after callers
  have been migrated to `reconstructChronicle` during H2/H6.
- Engine modules under `packages/ludics-engine/` and `lib/ludics/` that
  *write* chronicles (the ~10 sites identified in the deliberation):
  convert to no-op or remove.

**Schema changes.** Drop `LudicChronicle`, `LudicChronicleCache`. Per repo
guidance, `npx prisma db push` (do not use `prisma migrate dev`).

**Invariant additions.** None (deletion).

**MCP changes.** Any tool that referenced chronicles must already have been
moved to substrate reads in H2.

**Migration.** Drop tables. Provide a one-off dump script
(`scripts/dump-chronicles-before-drop.ts`) to a JSONL file in
`misc-documents/` for safety.

**Acceptance test.** Repo-wide grep `rg "LudicChronicle"` returns only the
dump script and historical docs; full test suite green.

---

## H8 — MCP orientation & tool-cluster cleanup, version bump

**Goal.** Update `server.ts` MCP orientation to reflect the unified model:
clearer cluster labels, tool descriptions that reference substrate
terminology consistently, remove or merge any tool whose semantics
duplicate a substrate tool now that the legacy-side data is unified.

**Files touched.**
- `server.ts` (or `packages/isonomia-mcp/src/server.ts`).
- `get_orientation` response payload — bump `orientationVersion` to
  the next minor (e.g. `v1.10.0`); record changes.
- `get_capabilities` — confirm tool count.

**Schema changes.** None.

**Invariant additions.** Orientation snapshot test (assert the new version
string and the new cluster shape).

**MCP changes.** Version bump; possible deprecation of any tool that has
been superseded by a substrate equivalent.

**Migration.** None.

**Acceptance test.** `get_orientation` returns the new version; existing
integration tests for each tool still pass; the orientation document
matches `LUDICS_HARMONIZATION_PASS_1_THEORETICAL_MAP.md` terminology.

---

> ### Note on the deleted H8 (multi-Design-per-participant, deferred fix #4)
>
> The original Pass 2 included a sprint H8 to handle the
> "multi-Design-per-participant" structural fix. The 2026-05-27
> deliberation confirmed by direct grep that this sprint is *not needed*:
> `prisma/schema.prisma` has no `@@unique([deliberationId, participantId])`
> on `LudicDesign`, and every production `findUnique`/`findFirst` call site
> keys by `id`, not by `participantId`. The two `findFirst` sites that
> existed (`scripts/check-acts.ts`, `scripts/check-proponent-acts.ts`) are
> debug scripts that do not filter by participant. The UI clarification
> the sprint would have addressed ("cone-decomposed view rather than
> per-participant view") folds into H6.

---

## Cross-sprint operating notes

- **Schema authority.** Every sprint that *might* touch schema must `read`
  `prisma/schema.prisma` first and reconcile any disagreement with this doc
  in favour of the schema.
- **`prisma db push`, not `migrate dev`.** Repo convention; see
  `.github/copilot-instructions.md`.
- **No new locus prefixes.** Only `⊢A.` (H3 fax materialisation is the
  most likely site to be tempted to invent a prefix; do not).
- **T4 in code review.** Any PR touching substrate read code must include
  a test that requests *without* `includeIdentity` and asserts
  `participantId` is absent.
- **Run `npm run lint` after each sprint** (project requires zero warnings
  per `AGENTS.md`).
- **`predev` runs `@app/sheaf-acl` build** — keep that working through all
  sprints.

---

## Risk register

| Risk | Sprint | Mitigation |
|---|---|---|
| H1 transactional seam creates contention on hot DM tables | H1 | Use Prisma `$transaction` with short critical section; AIF + substrate writes can defer to post-commit hook if contention shows. |
| Bridge skip-log for cross-scope designs grows large enough to be operationally significant | H3 | If skip count is non-trivial on the canonical fixture, pull the substrate-v2 cross-scope design exercise forward rather than letting the skip set accumulate. |
| First production `isAdditive=true` act lands and the bridge throws | H3 | Acceptable — fail-loud is the contract. Mitigation is to schedule the separate-cone follow-on sprint *before* the feature that introduces additivity ships. |
| Historical backfill (H5) tags too many DMs `unbridgeable` to be useful | H5 | Before running across all deliberations, review reasons on the canonical fixture; if a class is large, fix the bridge before tagging. |
| Retiring `LudicChronicle` breaks an unsuspected reader | H7 | H2's lint rule catches *substrate* readers; H2 ships `reconstructChronicle` so migrations can happen incrementally; do a repo-wide grep audit *before* the drop migration. |
| `participantId` leaks through a substrate tool that joined legacy tables | H2, H6 | T4 snapshot test runs in CI; PR template adds a T4 checkbox. |
| Commitment changes propagate only through legacy paths; substrate views show pre-concession state | (out of scope) | Document the boundary in Pass 1 (I-No-Commitment-Write); a future Session 3 commitment spec is required before the substrate can serve as the canonical commitment view. |

---

## Definition of done for the harmonization programme

1. The canonical fixture `cmoxol76e03748cssx07tvkhd` shows zero
   `payload.argumentId`-only DMs (post H5) — either witnessed or explicitly
   tagged `unbridgeable`.
2. All ~308 pre-existing invariants pass; the new harmonization invariants
   (I-Seam, I-AIF-min, I-Same-Scope, I-No-Additive-Silent, I-No-Legacy-Read,
   I-Premise, I-No-Commitment-Write) pass on every PR.
3. The substrate MCP cluster is the *only* substrate read surface; legacy
   reads remain for engine telemetry only.
4. UI substrate views read substrate (cone-decomposed view, not
   per-participant); legacy interaction-telemetry views read legacy and
   are labelled as such.
5. `Design.premiseClaimIds[]` is non-empty for ≥ 80 % of designs on the
   canonical fixture.
6. `LudicChronicle` and `LudicChronicleCache` are removed from the schema.
7. Cross-scope (`referencedScopes`-bearing) designs and additive
   (`isAdditive=true`) acts are explicitly skipped/rejected by the bridge,
   with skip-log entries reviewed.
8. Commitments are untouched by the substrate write path; a Session 3
   commitment spec is filed (not necessarily executed) so the boundary is
   recorded for the next planning cycle.
9. MCP orientation is at the next minor version, with cluster docs aligned
   to this plan.
