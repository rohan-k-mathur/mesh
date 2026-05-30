# Phase 4 deferred items — closure audit
**Date:** 2026-05-30  
**Plan:** `Development and Ideation Documents/ARCHITECTURE/FROM_FOLKSONOMY_TO_ONTOLOGY_SCHEMES.md`  
**Spec:** `Development and Ideation Documents/ARCHITECTURE/SCHEMES_IMPL_PROTOCOL_SOUNDNESS.md` §3.4–§3.5  
**Prior closure:** `audits/phase4-closure-20260529.md`

## Scope

The Phase 4 closure deferred three items "out of plan Phase 4 scope":

1. **Spec 3 phase 3c** — `LatentObligationsPanel.tsx` UI (surface unraised CQs in-room).
2. **Spec 3 phase 3d** — per-clause UI polish (burden / evidence / premiseType hint copy).
3. **Deliberation-wide close iteration** — flagged as a substrate-level gap because no deliberation-close lifecycle exists today.

This audit documents all three shipped.

## Item 1 — Latent obligations panel + read-only API

New endpoint: [app/api/schemes/instances/[id]/protocol-state/route.ts](app/api/schemes/instances/%5Bid%5D/protocol-state/route.ts)
- `GET` returns the SchemeInstance metadata, the cataloged CQ definitions (text / attackType / targetScope / cqId), and the per-CQ obligation status loaded via `loadProtocolState`.
- Lazy-backfills obligation rows for instances created pre-Phase 4 by calling `ensureObligationRowsForInstance(id)`.
- No write side effects; cache-control `no-store` via `dynamic = "force-dynamic"`.

New component: [components/room/LatentObligationsPanel.tsx](components/room/LatentObligationsPanel.tsx)
- Collapsed by default per Spec §3.5 framing copy ("latent stratum is information, not pressure").
- Renders one row per obligation in `status === "not-offered"`; "All obligations engaged" empty-state when none latent.
- Header copy: *"CQs that have not yet been raised against this scheme-instance. The scheme's claim is provisionally accepted only as long as these remain unraised."*
- Affordances dispatch into the existing dialogue/move flow:
  - **Raise as opponent** (default): `POST /api/dialogue/move` with `kind=WHY`, `payload.cqId`, `payload.raisedBy=opponent`. Picked up by `onDialogueMoveForObligations` and transitions the obligation to `offered-open`.
  - **Offer pre-emptively** (proponent only): same dispatch, `payload.raisedBy=proponent-preemptive`.

## Item 2 — Per-clause UI polish (panel rows)

Hint copy on each row uses [lib/utils/cq-burden-helpers.ts](lib/utils/cq-burden-helpers.ts):
- `getBurdenBadgeText` / `getBurdenBadgeColor` — colored proponent/challenger pill.
- `getCQBurdenExplanation(burden, premiseType)` — human-readable burden allocation sentence.
- `getCQEvidenceGuidance(burden, premiseType, true)` — amber-tinted prompt when `requiresEvidence`.
- `getPremiseTypeDisplay(premiseType)` — appended to badge line when non-null.
- EXCEPTION premises render an italic note: *"Carneades exception: the challenger must establish that this exception applies."*

**Out of scope (flagged as follow-on):** the *dialogue-side* phase 3d work — inline evidence picker on the WHY/GROUNDS forms, burden-aware disabling of Concede/Retract buttons, sub-locus headers tinted by premiseType — requires a redesign of the existing dialogue UI (`components/claims/CriticalQuestionsV3.tsx`, the move composer) rather than additive copy. Tracked for the next dialogue-UI sprint.

## Item 3 — Deliberation-wide close iteration

New service: [lib/schemes/protocol/closeDeliberation.ts](lib/schemes/protocol/closeDeliberation.ts)
- `closeAllSchemeInstancesForDeliberation(deliberationId, { closedById, modeOverride?, stopOnBlock? })`.
- Collects open SchemeInstances by joining `targetType=claim` rows whose `targetId ∈ claims-of-deliberation`, plus `targetType=card` rows when the Card model carries `deliberationId` (queried defensively — try/catch around the optional column).
- Iterates `closeSchemeInstance` for each id; catches `SoundnessViolationError` into `summary.blocked` and continues unless `stopOnBlock=true`. Other errors bubble.
- Returns a `DeliberationCloseSummary` with `scanned`, `closed`, `warnings`, `blocked[]`.

New endpoint: [app/api/deliberations/[id]/close-scheme-instances/route.ts](app/api/deliberations/%5Bid%5D/close-scheme-instances/route.ts)
- `POST` with body `{ closedById, modeOverride?, stopOnBlock? }` validated by zod.
- Returns 200 on clean run, 207 (Multi-Status) when some instances were blocked, 500 on unexpected error.

**Design note — substrate gap.** No deliberation-close lifecycle exists in the substrate today. We did not invent one. The endpoint above is the callable handle (admin / future cron); when a deliberation-close lifecycle lands, it should call `closeAllSchemeInstancesForDeliberation` directly rather than hit the HTTP route.

## Tests

New file: [scripts/audits/test-phase4-deferred.ts](scripts/audits/test-phase4-deferred.ts)
- Picks a live SchemeInstance whose scheme has ≥1 catalogue CQ, validates `loadProtocolState` returns populated obligations and at least one is `not-offered`.
- Picks a live deliberation with an open SchemeInstance on a claim and runs `closeAllSchemeInstancesForDeliberation` in `modeOverride: "off"` (so the gate is skipped, no risk to production data). Re-opens the closed rows at the end so the test is idempotent.
- Asserts `summary.scanned ≥ 1`, `summary.deliberationId` echoes input, `summary.blocked` is `[]` in off-mode.
- Asserts `closeSchemeInstance` remains callable (import-surface smoke).

**Verification (2026-05-30):**
```
$ npx jest __tests__/lib/schemes/                            → 44/44 pass
$ npx tsx --env-file=.env scripts/audits/test-phase4-close-gate.ts → 6/6 pass
$ npx tsx --env-file=.env scripts/audits/test-phase4-deferred.ts   → 9/9 pass
```

## Files added

```
app/api/schemes/instances/[id]/protocol-state/route.ts
app/api/deliberations/[id]/close-scheme-instances/route.ts
components/room/LatentObligationsPanel.tsx
lib/schemes/protocol/closeDeliberation.ts
scripts/audits/test-phase4-deferred.ts
audits/phase4-deferred-closure-20260530.md
```

## Files modified

None. All three items shipped as additive surfaces — no edits to existing routes, schema, or core services.

## Production posture (unchanged)

Per Phase 4 closure: `MESH_SCHEME_SOUNDNESS_MODE=warn` by default. Flip to `block` after the `SchemeInstanceSoundnessWarning` log plateaus. The deliberation iteration honours the same flag (and accepts per-call `modeOverride`), so an admin can dry-run a batch close in `off` mode before flipping.

## Remaining follow-ons (next sprint)

1. **Dialogue-UI phase 3d.** Inline evidence picker on WHY/GROUNDS, burden-disabled close buttons, premiseType-tinted sub-locus headers. Requires `CriticalQuestionsV3.tsx` redesign.
2. **Deliberation-close lifecycle.** Substrate gap. When a deliberation moves to a terminal state (concluded / archived), it should fire a hook that calls `closeAllSchemeInstancesForDeliberation`. No such terminal-state machine exists yet.
3. **Panel placement.** `LatentObligationsPanel` is built but not yet mounted into a room view; that lives downstream once the room shell consumes the component (the SchemePicker / SchemeInstanceActions surfaces are the natural anchors).
