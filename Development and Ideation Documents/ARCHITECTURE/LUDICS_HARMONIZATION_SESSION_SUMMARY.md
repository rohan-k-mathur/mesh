# Ludics Harmonization — Session Summary

> **Type.** Planning session output, no code changes.
> **Date.** 2026-05-27.
> **Outputs.**
> - [LUDICS_HARMONIZATION_PASS_1_THEORETICAL_MAP.md](LUDICS_HARMONIZATION_PASS_1_THEORETICAL_MAP.md)
> - [LUDICS_HARMONIZATION_PASS_2_SPRINT_LIST.md](LUDICS_HARMONIZATION_PASS_2_SPRINT_LIST.md)
> - This summary.

## Problem in one paragraph

The mesh repo runs two Ludics layers in parallel. Legacy
(`LudicDesign`/`LudicAct`/`LudicLocus`/`LudicChronicle`/`LudicTrace`/`DialogueMove`)
is the interaction runtime. Substrate
(`Behaviour`/`Design`/`DesignInclusion`/`LudicMove`/`WitnessRecord`,
articulation lattice, AIF bridge) is the normative semantics. They are
*populated by disjoint paths* — on the canonical fixture
`cmoxol76e03748cssx07tvkhd`, 499 `DialogueMove`s split into 52 Ludics-
bridged + 447 argument-graph-only, with AIF holding zero
`premise`/`conclusion` edges. The plan harmonizes them without retiring
either.

## Central decision

Adopt a **single canonical creation seam** for `DialogueMove` that
transactionally writes legacy row + AIF triple + substrate
`LudicMove`/`WitnessRecord` (and a new `Design` row when the witness is
the first realisation of a chronicle-set). AIF stays — as the canonical
premise/conclusion bridge — and is finally *written* (not just read) by the
seam. `LudicChronicle`/`LudicChronicleCache` retire post-cutover;
`LudicTrace` stays as runtime telemetry. Legacy UI moves onto the substrate
read path.

## Sprint order (full detail in Pass 2)

1. **H0** — invariant snapshot & DM-creation site freeze marker.
2. **H1** — canonical `createDialogueMove` seam (legacy + AIF + substrate
   in one transaction). **Keystone sprint.**
3. **H2** — `lib/ludics/substrate/read.ts` consolidation + lint rule
   forbidding substrate code from reading legacy tables. Also ships
   `lib/ludics/chronicles/reconstruct.ts` so H7's reader migration is
   incremental.
4. **H3** — bridge completion *narrowed* (per 2026-05-27 deliberation):
   bridge fails loud on `LudicAct.isAdditive === true` (separate-cone
   logic deferred); cross-scope designs (non-empty `referencedScopes[]`)
   are skipped with a recorded `bridge-skip-reason: "cross-scope"`.
5. **H4** — backfill `Design.premiseClaimIds[]` via AIF traversal (the 3b
   prompt).
6. **H5** — historical witness backfill; unresolvable DMs tagged
   `payload.unbridgeable: true` with reasons.
7. **H6** — legacy UI tab onto the substrate read path; cone-decomposed
   view replaces any per-participant assumption (absorbs the former
   "fix #4" UI concern).
8. **H7** — drop `LudicChronicle` + `LudicChronicleCache`.
9. **H8** — MCP orientation/tool-cluster cleanup, version bump
   (v1.9.0 → next minor).

> The original H8 ("multi-Design-per-participant structural fix #4")
> was deleted: a direct grep on 2026-05-27 showed no production code path
> depends on uniqueness by `participantId` (no `@@unique`, no
> `findUnique`/`findFirst` by participantId in production source). The UI
> piece folds into H6.

## Invariants added by the plan

- **I-Seam.** Every new `DialogueMove` either has a `WitnessRecord` or
  `payload.unbridgeable: true` with a reason.
- **I-AIF-min.** Every new arg-asserting/attacking DM creates its
  `AifNode` + `AifEdge(premise|conclusion)`.
- **I-Same-Scope.** A substrate `Design` is only created from a legacy
  `LudicDesign` with empty `referencedScopes[]` (cross-scope designs are
  bridge-skipped).
- **I-No-Additive-Silent.** Bridge asserts `LudicAct.isAdditive === false`
  and fails loud otherwise.
- **I-No-Legacy-Read.** Substrate-tagged code may not import
  `LudicDesign`/`LudicAct`/`LudicChronicle*`.
- **I-Premise.** `Design.premiseClaimIds[]` = deduped union of
  `ArgumentPremise.claimId` reachable via AIF from the design's loci.
- **I-No-Commitment-Write.** Substrate write path never touches
  `LudicCommitmentElement` / `LudicCommitmentState` /
  `CommitmentLudicMapping`.

## Hard constraints honoured

T4 (no `participantId` on default Ludics reads). OQ-JSL per-cone JSL +
`Inc(B)` antichain unchanged. Locus prefix stays `⊢A.`. All ~308 existing
invariants must remain green at every step. `schema.prisma` is
authoritative (any doc/spec disagreement defers to schema).

## Resolved questions (post-deliberation 2026-05-27)

All five Pass 1 §5 open questions were settled in a deliberation session
informed by direct grep evidence on the live codebase.

- **Q1 — additive sub-trees.** *Theoretical:* separate cones per
  incompatible additive choice. *Implementation:* deferred. Field is
  inert in production today; bridge fails loud (`I-No-Additive-Silent`)
  when it encounters `isAdditive === true`. Separate-cone logic ships
  when (if) the first additive act lands.
- **Q2 — chronicle ordering.** No production reader depends on persisted
  `LudicChronicle` row ordering. Retire after H7. H2 ships a
  `reconstructChronicle(designId)` helper so the ~50 readers migrate
  incrementally.
- **Q3 — cross-scope.** `LudicFaxMap` is dev-only with no production
  callers. The live cross-scope mechanism is
  `LudicDesign.referencedScopes[]`. Substrate v1 covers **same-scope
  only**; cross-scope substrate semantics is a deferred substrate-v2
  design exercise.
- **Q4 — multi-Design-per-participant.** Grep confirmed: no
  `@@unique([deliberationId, participantId])` on `LudicDesign`; no
  production `findUnique`/`findFirst` by `participantId`. **H8 deleted
  from the programme.** UI piece folds into H6 (cone-decomposed view).
- **Q5 — commitments.** Out of scope. `LudicCommitmentElement`,
  `LudicCommitmentState`, `CommitmentLudicMapping` remain canonical on
  legacy (5–8 writers, 20+ readers, all production). Substrate write
  path must not modify them (`I-No-Commitment-Write`). A future Session
  3 commitment spec defines the lift.

## Definition of done (programme-level)

- Canonical fixture has zero unbridged arg-only DMs.
- 308 + 7 new invariants green (I-Seam, I-AIF-min, I-Same-Scope,
  I-No-Additive-Silent, I-No-Legacy-Read, I-Premise,
  I-No-Commitment-Write).
- Substrate read surface is the only one for substrate questions.
- `Design.premiseClaimIds[]` non-empty for ≥80 % of designs on the
  fixture.
- `LudicChronicle*` dropped.
- Cross-scope and additive carve-outs explicitly recorded
  (bridge-skip-log reviewed; no `isAdditive=true` rows in production).
- Commitments untouched by substrate write path; Session 3 commitment
  spec filed for the next cycle.
- MCP orientation at next minor, cluster docs aligned to Pass 1.

## Next action

Implementation session pick-up point: H0. Run the snapshot script first;
then begin H1 by inventorying every site under `app/api/**` and `workers/**`
that calls `prisma.dialogueMove.create(...)`.

## H0 status (2026-05-27)

**Done.**

- `scripts/snapshot-invariants.ts` created; `npm run snapshot:invariants`
  produces `__tests__/invariants/_snapshot.json`. Baseline: **17 files, 272
  static `it`/`test` cases**. (`.each(...)` table-driven loops under-count;
  spec's ~308 is the floor reached once jest expands table cases at
  runtime. Run `npm run snapshot:invariants:run` to record authoritative
  pass/fail.)
- `HARMONIZATION-FREEZE (H0)` comment markers added to every legacy-direct
  `prisma.dialogueMove.create|createMany|upsert` site in production paths
  (20 markers across 17 files). New PRs that introduce another such site
  will be grep-detectable.

**Frozen production DM-creation sites** (these are the H1 conversion
backlog):

- `app/api/arguments/route.ts` (1)
- `app/api/arguments/[id]/cqs/[cqKey]/ask/route.ts` (1)
- `app/api/attacks/create/route.ts` (1)
- `app/api/attacks/undercut/route.ts` (1)
- `app/api/aif/conflicts/route.ts` (1)
- `app/api/ca/route.ts` (2)
- `app/api/comments/lift/route.ts` (1)
- `app/api/commitments/export-from-ludics/route.ts` (1)
- `app/api/cq/route.ts` (1)
- `app/api/cqs/dialogue-move/route.ts` (2)
- `app/api/dialogue/answer-and-commit/route.ts` (1)
- `app/api/dialogue/move/route.ts` (1)
- `app/api/missing-premises/[id]/accept/route.ts` (1)
- `app/api/monological/bridge/route.ts` (1, batched upsert)
- `app/api/non-canonical/approve/route.ts` (1)
- `app/api/smoke_seed/route.ts` (2)
- `experiments/polarization-1/orchestrator/translators/dialogue-move-mint.ts` (1)

**Not marked** (out of scope for H1 conversion): seed scripts under
`scripts/seed*.ts`, debug scripts (`scripts/test-*`,
`scripts/ludics-qa.ts`, `scripts/ludicsPatterns.ts`, etc.), integration
tests under `__tests__/integration/**`, and engine tests under
`packages/ludics-engine/__tests__/**` — these construct DMs directly to
exercise the legacy pipeline by design.

**Next:** H1. Begin by sketching `lib/ludics/createDialogueMove.ts` and
extracting the AIF-edge write path from
`packages/ludics-engine/aif-sync.ts` (or equivalent) into a reusable
function the seam will call.

## H1 status (2026-05-29) — seam landed, call-site conversion pending

**Done.**

- `lib/ludics/createDialogueMove.ts` — the keystone seam. One
  `prisma.$transaction` that writes (1) `DialogueMove` with P2002
  dedup on `(deliberationId, signature)`, (2) AIF graph for
  argument-targeted moves by delegating to the pre-existing
  `services/aif/syncArgument.syncArgumentToAif` (no duplication), (3)
  `Behaviour` upsert on `(deliberationId, "⊢A.0")`, (4) `LudicMove`
  upsert on `(deliberationId, locus)`, (5) `WitnessRecord` create
  idempotent on `dialogueMoveId`. Returns
  `{ move, deduplicated, aif, ludicMoveId, witnessRecordId, unbridgeable }`.
- `__tests__/invariants/h1-creation-seam.test.ts` — 10 invariants
  covering I-Seam, I-AIF-min, the dedup path, the auto-`unbridgeable`
  path, caller-supplied `unbridgeable`, idempotent re-runs, non-argument
  targets, `syncAif: false`, AIF helper failure isolation, and
  `LudicMove.moveType` selection across `WHY`/`ATTACK`/`ASSERT`/`GROUNDS`/
  `DAIMON`/`CLOSE`/polarity overrides. All green.
- `_snapshot.json` refreshed: **18 files, 282 cases** (+1 file, +10 cases).

**Deliberate deferrals (documented in the seam's doc-comment).**

- `Design` row materialisation stays in the bridge / compile path. The
  spec's per-move Design write is conditional on "first realisation of a
  chronicle-set not already in `Behaviour.designs`", which only becomes
  knowable after `compileFromMoves` runs.
- `LudicAct` / `LudicLocus` are still produced by
  `packages/ludics-engine/compileFromMoves.ts` (delete-and-recreate); the
  seam does not touch them.
- The `services/aif/syncArgument.ts` helper already implements the AIF
  contract the seam needs (premise/conclusion/asserts edges). No
  extraction from `packages/ludics-engine/aif-sync.ts` was necessary;
  `aif-sync.ts` (which itself creates DMs for CONCEDE/DAIMON sync) will
  be folded into the seam during call-site conversion.

**Call-site conversion (2026-05-29 / continuation).**

- **Pilot.** `app/api/dialogue/move/route.ts` converted first to
  validate seam shape under the busiest production path. Replaced the
  27-line P2002 try/catch + dedup-fetch with a single
  `await createDialogueMove({...})`; freeze marker removed; typecheck
  clean.
- **Mass conversion.** Remaining 19 sites converted in two batches:
  - 16 simple sites (single argument-or-claim DM creates) swapped via
    one `multi_replace_string_in_file`: `attacks/create`,
    `attacks/undercut`, `arguments/[id]/cqs/[cqKey]/ask`, `arguments`,
    `comments/lift`, `non-canonical/approve`,
    `cqs/dialogue-move` (×2), `cq`, `smoke_seed` (×2),
    `aif/conflicts`, `missing-premises/[id]/accept`, `ca` (×2),
    `experiments/polarization-1/.../dialogue-move-mint`.
  - 3 special-case sites:
    - `app/api/dialogue/answer-and-commit/route.ts` — GROUNDS move with
      Argument back-link; legacy `findFirst` fallback dropped (seam
      handles dedup).
    - `app/api/commitments/export-from-ludics/route.ts` — runs inside
      an outer `prisma.$transaction(async (tx) => {...})`. To preserve
      atomicity the seam was extended with an optional
      `options.tx?: Prisma.TransactionClient`; when present the seam
      runs its body on the caller's tx instead of opening its own.
      All 10 invariants still green after that refactor.
    - `app/api/monological/bridge/route.ts` — converted the batched
      `prisma.$transaction(movesToUpsert.map(prisma.dialogueMove.upsert))`
      into a sequential `for (const cfg of movesToUpsert)` loop calling
      the seam. P2002 dedup matches the original `update: {}` no-op
      upsert semantics. The `Parameters<typeof prisma.dialogueMove.upsert>`
      type expression on `movesToUpsert` was inlined to a literal
      shape.
- **Imports.** Each converted file now imports
  `import { createDialogueMove } from "@/lib/ludics/createDialogueMove"`.

**Acceptance — H1 done.**

- `rg "HARMONIZATION-FREEZE" --type ts` — **0 matches.**
- `rg "prisma\.dialogueMove\.(create|upsert)\(" --type ts` — only the
  out-of-scope sites remain (seed scripts under `scripts/seed*`,
  `scripts/test-*`, `scripts/ludicsPatterns.ts`,
  `scripts/fix-argument-move.ts`, `scripts/backfill-commitment-alignment.ts`,
  `__tests__/integration/cq-to-aif-provenance.test.ts`, and
  `packages/ludics-engine/__tests__/scopedDesigns.test.ts`). These
  exercise the legacy pipeline directly by design.
- `npx tsc --noEmit -p tsconfig.json` — only the pre-existing
  `app/robots.ts(10,17)` / `(10,50)` errors remain (unchanged from H0
  baseline).
- `npx jest __tests__/invariants/h1-creation-seam.test.ts` —
  **10/10 green.**
- `_snapshot.json` re-run: **18 files, 282 cases** (unchanged — the
  seam tests were already counted in the previous refresh).

**Next.** H2 — substrate read-path consolidation
(`lib/ludics/substrate/read.ts`) plus the `chronicles/reconstruct.ts`
helper. Awaiting explicit go-ahead before opening H2.

## Forward-compatibility (FQ-substrate-v1) — 2026-05-30

Per [LUDICS_HARMONIZATION_PASS_1_THEORETICAL_MAP.md §9](LUDICS_HARMONIZATION_PASS_1_THEORETICAL_MAP.md#9-substrate-v1-commitments-and-the-bfmell-question)
this whole programme is now formally tagged **FQ-substrate-v1**. A
future Basaldella–Faggian designs-with-repetitions migration
(Q-030 Phase 2+, MELL coverage) would land as a separately-scoped
*substrate-v2* and is not on the H0–H8 schedule.

**What we shipped in H1 sits on the "survives v2 unchanged" list.** The
`createDialogueMove` seam, the AIF p/c bridge it writes through, the
records-only `WitnessRecord` `ι`, T4 anonymity, the `⊢A.` locus prefix,
and `I-No-Commitment-Write` are all orthogonal to the design-notion
choice (FQ vs BF). H2's planned `reconstructChronicle` and chronicle
retirement (H7) are also on that list.

**One v1/v2 diff target is touched by H1's seam:** the `LudicMove`
upsert key `(deliberationId, locus)` (`I-Loc`). Under BF, coherence
allows distinct negative moves at the same address, so v2 may relax
this to `(deliberationId, locus, moveType, repetitionTag)`. A
forward-compat note now lives in the seam doc-comment so a future v2
schema migration has a clear hook. **No v1 change required.**

The other four v1 commitments named as v2 diff targets (`I-Inc`
antichain, `I-Cone`/`I-Join` cone partition under FQ separation,
`Design.loci[]` as a set, `I-No-Additive-Silent`) live in
substrate-side code and proofs we do not modify here; they are correct
as written for v1.

---

## H2 status (2026-05-30) — substrate read consolidation + chronicle reconstruction

H2 lands the **single substrate read path** plus the **chronicle
reconstruction helper** that future readers will use once H7 drops
`LudicChronicle` / `LudicChronicleCache`.

### Files added

- `lib/ludics/substrate/read.ts` — façade exporting `getBehaviour`,
  `getDesign`, `getIncarnations`, `getWitnesses`, `getExposureMap`.
  T4-anonymous by default; the only identity knob is
  `getWitnesses(_, { includeIdentity: true })`, which forwards to the
  canonical `findByLudicMoveId` overload chain. New thin readers:
  `getBehaviour` (`prisma.behaviour.findUnique`), `getDesign`
  (`prisma.design.findUnique`); the rest are typed re-exports of the
  T4-clean `server/ludics/*` functions.
- `lib/ludics/chronicles/reconstruct.ts` — `reconstructChronicle(designId)`
  rebuilds the chronicle on demand from `LudicAct.orderInDesign`,
  returning `{ actId, order }[]` in canonical order. Drop-in
  replacement for the row-set readers currently fetch from
  `prisma.ludicChronicle.findMany`. Survives H7 because `LudicAct`
  is *not* on the H7 retirement list. Deliberately scoped *outside*
  `lib/ludics/substrate/**` so the no-legacy-read lint can keep its
  bright-line rule.
- `scripts/lint-no-legacy-ludics-read.ts` — enforces invariant
  **I-No-Legacy-Read**: regex over source under `lib/ludics/substrate/**`
  rejecting `prisma.ludicDesign|ludicAct|ludicChronicle|ludicChronicleCache`.
  Block-comment-aware so JSDoc that names the forbidden APIs in prose
  does not trip the rule. Wired as `npm run lint:no-legacy-ludics-read`.
- `__tests__/invariants/h2-no-legacy-read.test.ts` — invariant test
  shadow of the lint, so the rule fires even when the standalone CLI
  is not invoked.
- `__tests__/invariants/h2-reconstruct-chronicle-parity.test.ts` —
  three-case parity test (typical, empty, ordering preserved). Uses
  the H1 mock-prisma pattern (`jest.mock("@/lib/prismaclient", …)`).

### Acceptance evidence

- `npx tsc --noEmit -p tsconfig.json` — clean modulo the pre-existing
  `app/robots.ts(10,17)/(10,50)` errors that predate this programme.
- `npx jest __tests__/invariants/` — 20 suites / 326 passing + 1 todo.
  H2 contributed two new suites (4 cases).
- `npm run lint:no-legacy-ludics-read` — exits 0 against `main`.
- Snapshot refreshed: `__tests__/invariants/_snapshot.json` now reports
  **20 files / 286 cases** (up from 18 / 282 at H1 close).

### Invariant added

- **I-No-Legacy-Read.** Files under `lib/ludics/substrate/**` may not
  read `prisma.ludicDesign | ludicAct | ludicChronicle | ludicChronicleCache`.
  Enforced by `scripts/lint-no-legacy-ludics-read.ts` and
  `__tests__/invariants/h2-no-legacy-read.test.ts`. The
  `lib/ludics/chronicles/reconstruct.ts` helper is the deliberate,
  scoped escape hatch and is *not* under enforcement.

### Deferred follow-up (intentional, named)

The Pass 2 §H2 spec also calls for migrating the substrate MCP tool
handlers in `packages/isonomia-mcp/src/server.ts` to call the
consolidated read path. The façade re-exports (and where new, mirrors)
the same names handlers already use, so this migration is an
import-path swap with no runtime change. Tracked as a non-blocking
follow-up to keep H2 a clean "add façade + lint" landing; it is
*not* a prerequisite for H3.

### Forward-compat (FQ-substrate-v1 → BF substrate-v2)

The H2 façade's public signatures do not assume any of the v1-specific
`LudicMove` keying (the place where v2 will diverge per Pass 1 §9).
All five public functions return data shapes that survive a v2 BF
migration unchanged. The chronicle reconstruction helper is likewise
v1/v2-stable because `LudicAct.orderInDesign` is preserved across the
substrate version line.

### Next: H3

H3 — bridge same-scope and fail-loud-on-additive (Pass 2 sprint list
lines 182–224). Begins with a recon of the existing AIF↔Ludics bridge
write paths and the additive-locus invariant test surface.
