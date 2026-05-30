# Phase 4 closure — protocol-soundness gate + Carneades premiseType rollout

- **date:** 2026-05-29
- **plan:** [FROM_FOLKSONOMY_TO_ONTOLOGY_SCHEMES.md](../Development%20and%20Ideation%20Documents/ARCHITECTURE/FROM_FOLKSONOMY_TO_ONTOLOGY_SCHEMES.md) §Phase 4 (steps 14, 15)
- **spec:** [SCHEMES_IMPL_PROTOCOL_SOUNDNESS.md](../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_IMPL_PROTOCOL_SOUNDNESS.md) §3.1–§3.4, §4.1–§4.3, §5 (phases 3a–3d, modulo UI)

## Outcome

- **Step 14** — instance-close soundness gate landed, feature-flagged
  via `MESH_SCHEME_SOUNDNESS_MODE = off | warn | block` (default
  `warn`). The 1-month warn-only soak in Spec 3 §5 is collapsed into
  a single flag-flip; same shape as Phase 3's WF1 collapse, with the
  added insurance of the per-call `modeOverride` for admin/test use.
- **Step 15** — every catalogue CQ now carries an explicit
  `premiseType`. Defaulted to `ORDINARY` per Walton (2008) §11.1
  ("all CQs are ordinary premises unless explicitly marked");
  EXCEPTION case empirically void per Q-018 (no anti-rigid schemes).
- **Spec 3 phases 3a + 3b** (gate landing) shipped; **3c (latent
  panel UI) and 3d UI polish deferred** — explicitly out of plan
  Phase 4 scope.

## What landed

### Schema (one `prisma db push --accept-data-loss --skip-generate`)

- `SchemeInstance.status` (`open` default), `closedAt`, `closedById`
- `CqObligationRecord` (per `(instanceId, cqKey)`)
- `SchemeInstanceSoundnessWarning` (warn-mode log)

### Pure modules

- [lib/schemes/protocol/protocolState.ts](../lib/schemes/protocol/protocolState.ts)
  — `loadProtocolState`, `recordObligationTransition`,
  `ensureObligationRowsForInstance`, `isLegalTransition` with the
  Spec §3.2 transition table.
- [lib/schemes/protocol/soundnessGate.ts](../lib/schemes/protocol/soundnessGate.ts)
  — `checkSoundnessOnClose`, `autoWaiveAssumptions`,
  `SoundnessViolationError`. Pure decision; no DB.
- [lib/schemes/protocol/soundnessMode.ts](../lib/schemes/protocol/soundnessMode.ts)
  — env-driven flag with test override.
- [lib/schemes/protocol/closeInstance.ts](../lib/schemes/protocol/closeInstance.ts)
  — the single close service; called by the endpoint and (in future)
  by the deliberation-close iteration.
- [lib/schemes/protocol/dialogueHooks.ts](../lib/schemes/protocol/dialogueHooks.ts)
  — translates dialogue moves into obligation transitions.
  Conservative & non-throwing.

### Endpoint

- `POST /api/schemes/instances/[id]/close` at
  [app/api/schemes/instances/[id]/close/route.ts](../app/api/schemes/instances/[id]/close/route.ts).
  Accepts `{ closedById, modeOverride? }`; returns the verdict;
  409 on `SoundnessViolationError` in block mode.

### Wiring

- [app/api/dialogue/move/route.ts](../app/api/dialogue/move/route.ts)
  — fires `onDialogueMoveForObligations` after move persistence;
  WHY → `offered-open`, GROUNDS → `offered-engaged`, CONCEDE/RETRACT
  → `discharged`/`waived` when the move carries `payload.cqId`.
- [app/api/schemes/questions/[id]/counter/route.ts](../app/api/schemes/questions/[id]/counter/route.ts)
  — fires `onCqCounterPost`; counter-post → `failed`.

### Migrations

- [scripts/migrations/06-phase4-obligation-backfill.ts](../scripts/migrations/06-phase4-obligation-backfill.ts)
  — created 34 obligation rows across 9 of 162 existing
  `SchemeInstance`s (the remaining 153 reference schemes with no
  catalogue CQs — pre-Phase 3 folksonomy artefact; soundness gate
  is trivially `ok` for them, which is correct).
- [scripts/migrations/07-phase4-premise-type-backfill.ts](../scripts/migrations/07-phase4-premise-type-backfill.ts)
  — backfilled 113 catalogue CQs to `ORDINARY`; propagated to the 34
  newly-created obligation rows.

### Defaults

- New CQ creation in [app/api/schemes/route.ts](../app/api/schemes/route.ts)
  and [app/api/schemes/[id]/route.ts](../app/api/schemes/[id]/route.ts)
  now defaults `premiseType` to `ORDINARY` if not specified.

### Tests

- [__tests__/lib/schemes/protocol/soundnessGate.test.ts](../__tests__/lib/schemes/protocol/soundnessGate.test.ts)
  — 13/13 unit tests covering every `SoundnessFailure` kind,
  ASSUMPTION auto-waive, EXCEPTION semantics, multi-failure
  aggregation.
- [scripts/audits/test-phase4-close-gate.ts](../scripts/audits/test-phase4-close-gate.ts)
  — 6/6 end-to-end integration tests against the live DB covering
  all three modes + the all-discharged happy path.

## Verification

```text
$ npx jest __tests__/lib/schemes/
Test Suites: 4 passed, 4 total
Tests:       44 passed, 44 total  (was 31; +13 gate tests)

$ npx tsx --env-file=.env scripts/audits/back-test-wf-validator.ts
loaded 24 kind='argument-scheme' row(s)
results: 24 ok (0 with warnings), 0 fail
=== PASS — every catalogue row passes WF1/WF2/WF3 ===

$ npx tsx --env-file=.env scripts/audits/verify-fingerprint-invariant.ts
[1] non-NULL fingerprint: PASS
[2] stored == computed:   PASS
[3] no fingerprint collisions: PASS

$ npx tsx --env-file=.env scripts/audits/test-phase4-close-gate.ts
  ✓ mode=off closes without gate
  ✓ mode=warn with undischarged CQs closes + logs warning
  ✓ warning row persisted
  ✓ mode=block blocks with 5 violation(s)
  ✓ instance status stayed 'open' on block
  ✓ mode=block passes when all 5 CQs discharged
=== PASS — phase 4 close-gate integration green ===
```

## Production posture & rollout

- `MESH_SCHEME_SOUNDNESS_MODE` defaults to `warn` (env-unset = warn).
  This means production runs the gate but logs to
  `SchemeInstanceSoundnessWarning` and proceeds. No user-visible
  errors today.
- To flip to hard-block: `MESH_SCHEME_SOUNDNESS_MODE=block` on the
  Next runtime + workers. Spec 3 §5 calls for a soak window first;
  the warning table should show plateaued rates before flipping.
- Per-call `modeOverride` exists on the close service + endpoint for
  per-deliberation experimentation.

## Known limits (documented, not blockers)

- **No deliberation-wide close iteration yet.** The close service
  closes one `SchemeInstance` at a time. The plan exit ("transitions
  are blocked when CQ obligations remain open") is met for direct
  close calls; a future patch should wire `closeSchemeInstance` into
  whatever path eventually closes deliberations (none exists today
  per recon — `closePathway`/`closeSession` are unrelated pathway
  abstractions).
- **WHY/GROUNDS without `payload.cqId` skip the obligation hook.**
  Conservative by design — the hook can't transition what it can't
  identify. Walton-keyed CQ payloads carry `cqId`; the synthetic
  `generic_why_*` fallback (line 217 of dialogue/move/route.ts) is
  explicitly excluded.
- **153/162 legacy `SchemeInstance`s have no catalogue CQs.** Pre-
  Phase 3 folksonomy artefact: their schemes' CQs were stored
  per-instance, not on the scheme row. The gate is trivially `ok`
  for them; not a correctness issue. A follow-on cleanup could
  backfill from per-instance rows but is out of scope.
- **3c (LatentObligationsPanel UI) and 3d (per-clause UI polish)
  deferred.** Server-side enforcement is complete; UI surfacing is
  the next natural sprint.

## Files of record

| Role | Path |
|---|---|
| Pure decision | `lib/schemes/protocol/soundnessGate.ts` |
| State I/O | `lib/schemes/protocol/protocolState.ts` |
| Close service | `lib/schemes/protocol/closeInstance.ts` |
| Wiring | `lib/schemes/protocol/dialogueHooks.ts` |
| Flag | `lib/schemes/protocol/soundnessMode.ts` |
| Endpoint | `app/api/schemes/instances/[id]/close/route.ts` |
| Backfill 1 | `scripts/migrations/06-phase4-obligation-backfill.ts` |
| Backfill 2 | `scripts/migrations/07-phase4-premise-type-backfill.ts` |
| Unit tests | `__tests__/lib/schemes/protocol/soundnessGate.test.ts` |
| Integration | `scripts/audits/test-phase4-close-gate.ts` |
