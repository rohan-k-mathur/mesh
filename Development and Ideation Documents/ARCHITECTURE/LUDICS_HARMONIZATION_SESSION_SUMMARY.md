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
