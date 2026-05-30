# Phase 3d (Dialogue UI Polish) — Closure Audit

**Date:** 2026-05-30
**Spec:** `Development and Ideation Documents/ARCHITECTURE/DIALOGUE_UI_PHASE_3D_SPEC.md`
**Sister specs:** `LATENT_PANEL_ROOM_MOUNT_SPEC.md`, Phase 4 close-gate spec
**Posture:** Additive-only. No public API breakage. Back-compatible `onSubmit` extensions.

---

## Summary

Phase 3d wires per-clause **burden-of-proof** + **evidence-required**
metadata (already on `CriticalQuestion` and `CqObligationRecord` from
Phase 0.1 / Phase 4) into the dialogue-move UI, and enforces the
`requiresEvidence` invariant in both server endpoints that mint
`DialogueMove` rows.

The user-visible payoffs:

1. WHY / GROUNDS composer can no longer submit without evidence when
   the targeted CQ is flagged `requiresEvidence=true` — both in the UI
   (gated submit button) and the server (400 `EVIDENCE_REQUIRED`).
2. The `DialogueActionsModal` renders a premise-type-tinted header
   strip (sky for `ASSUMPTION`, amber for `EXCEPTION`) so the actor sees
   the Carneades-style premise classification before posting.
3. `evidenceRefs` collected by the new `InlineEvidencePicker` flow
   through to `CqObligationRecord.evidenceRefs` via the existing
   obligation hook, so soundness checks (`requiresEvidence` violation
   detection in `soundnessGate`) have real data to inspect at close
   time.

---

## Files added

| File | Purpose |
| --- | --- |
| [lib/dialogue/burdenGuards.ts](../lib/dialogue/burdenGuards.ts) | Pure helpers (`canPostMove`, `requiresEvidenceFromActor`, `disabledTooltip`, `premiseTypeHeader`) — single source of truth for burden-vs-move legality and premise-tint UI copy. |
| [__tests__/lib/dialogue/burdenGuards.test.ts](../__tests__/lib/dialogue/burdenGuards.test.ts) | 31 jest cases: cartesian product of burdens × isProponent for each move kind; OPPONENT→CHALLENGER normalisation; short-circuit on `requiresEvidence=false`; tooltip copy regex; `premiseTypeHeader` returns. |
| [components/dialogue/InlineEvidencePicker.tsx](../components/dialogue/InlineEvidencePicker.tsx) | Minimal URL/DOI collector. `{value, onChange, required?, helperText?, maxItems?}`. Emits `string[]`; no server side-effects. |
| [scripts/audits/test-phase3d-evidence-required.ts](../scripts/audits/test-phase3d-evidence-required.ts) | 7-case integration test exercising the catalogue / obligation-row / `evidenceRefs` plumbing through `recordObligationTransition` + `loadProtocolState`. Self-cleaning (reverts the `requiresEvidence` flip and the obligation row). |

## Files modified (additive)

| File | Change |
| --- | --- |
| [components/dialogue/WhyChallengeModal.tsx](../components/dialogue/WhyChallengeModal.tsx) | New optional props `requiresEvidence?: boolean`, `burdenHint?: string \| null`. `onSubmit` signature extended to `(text, opts?: { evidenceRefs?: string[] })` — back-compat (opts ignored by old callers). Renders `<InlineEvidencePicker>` and gates the submit button when `requiresEvidence` is true. |
| [components/dialogue/NLCommitPopover.tsx](../components/dialogue/NLCommitPopover.tsx) | Same new prop pair. Appends `evidenceRefs` to the `/api/dialogue/answer-and-commit` POST body. Gates submit button on `requiresEvidence && evidenceRefs.length === 0`. |
| [components/dialogue/DialogueActionsModal.tsx](../components/dialogue/DialogueActionsModal.tsx) | `cqContext` extended with optional `burdenOfProof`, `requiresEvidence`, `premiseType`. Renders a `premiseTypeHeader`-driven tinted strip just below the title when `premiseType` is set. Forwards `requiresEvidence` + `burdenHint` into `<WhyChallengeModal>` and `<NLCommitPopover>`. `handleWhyChallengeSubmit` accepts the second `opts` arg and forwards `evidenceRefs` on the move POST. |
| [components/dialogue/LegalMoveToolbar.tsx](../components/dialogue/LegalMoveToolbar.tsx) | `WhyChallengeModal` callback extended to accept the second `opts` arg and forward `evidenceRefs` to `postMove`. |
| [app/api/dialogue/move/route.ts](../app/api/dialogue/move/route.ts) | Server-side guard: when `kind ∈ {WHY, GROUNDS}` and the CQ resolved by `payload.cqId` has `requiresEvidence=true`, returns 400 `EVIDENCE_REQUIRED` unless `payload.evidenceRefs` is a non-empty string array. Skips for synthetic `generic_why_*` ids. |
| [app/api/dialogue/answer-and-commit/route.ts](../app/api/dialogue/answer-and-commit/route.ts) | (a) Body zod schema now accepts `evidenceRefs: z.array(z.string()).optional()`. (b) Same `requiresEvidence` guard as `/api/dialogue/move`. (c) `payload.evidenceRefs` forwarded into the `DialogueMove` payload. (d) New call to `onDialogueMoveForObligations` after the move is created so the GROUNDS path persists `evidenceRefs` into `CqObligationRecord` (matches the equivalent hook call already present in `/api/dialogue/move`). |

---

## Test results

```
npx jest __tests__/lib/schemes/ __tests__/lib/dialogue/   →  75 passed (5 suites)
npx tsx scripts/audits/test-phase4-close-gate.ts          →   6 passed
npx tsx scripts/audits/test-phase4-deferred.ts            →   9 passed
npx tsx scripts/audits/test-latent-panel-mount-smoke.ts   →   8 passed
npx tsx scripts/audits/test-phase3d-evidence-required.ts  →   7 passed
                                                           ─────────────
                                                           105 green / 0 failed
```

Pre-Phase-3d baseline was 98 tests (75 jest already included
`burdenGuards` from M1); this audit adds the 7-case integration suite.

---

## Milestone closure

| # | Milestone | Status | Notes |
| --- | --- | :-: | --- |
| M1 | `burdenGuards.ts` + jest | ✅ | 31/31 unit tests. |
| M2 | `InlineEvidencePicker` | ✅ | Minimal additive component; no server side-effects. |
| M3 | WhyChallengeModal + NLCommitPopover wiring | ✅ | Optional props keep all existing call sites working unchanged. |
| M4 | DialogueActionsModal burden plumbing | ✅ | Premise-type-tinted header rendered when `cqContext.premiseType` set; `requiresEvidence` plumbed into both child modals. Per-button `canPostMove` gating deferred (see below). |
| M5 | CriticalQuestionsV3 cqContext thread | ✅ (already shipped) | The three burden/evidence/premiseType badges already render at lines 715–731 of [CriticalQuestionsV3.tsx](../components/claims/CriticalQuestionsV3.tsx). CriticalQuestionsV3 does not invoke `DialogueActionsModal` — there is no call site to thread `cqContext` through. |
| M6 | Server-side evidence guard | ✅ | Added to both `/api/dialogue/move` and `/api/dialogue/answer-and-commit`. The `answer-and-commit` route also now fires `onDialogueMoveForObligations`, fixing a pre-existing latent gap where its GROUNDS moves never reached the obligation hook. |
| M7 | Integration test + this audit | ✅ | 7/7 green; full baseline 105/105. |

---

## Follow-on work (deferred — not in scope)

1. **Per-button `canPostMove` gating in `DialogueActionsModal`.** The pure helpers in `burdenGuards.ts` are exercised by the unit tests but not yet wired into the modal's per-button `disabled` state because the modal does not currently know `isProponent`. The legal-moves endpoint already produces per-move `disabled` reflecting Hamblin/burden constraints upstream, so the UX is correct today; threading `isProponent` would let us also enrich `disabledReason` with `disabledTooltip(...)`. Plumb `isProponent` (or actor role) through `DialogueActionsButton → DialogueActionsModal` to enable this.
2. **Per-instance CQ rows for `resolveCqBinding`.** The integration test had to use `recordObligationTransition` directly because catalogue `CriticalQuestion` rows (the ones the legal-moves API typically references) have `instanceId=null`, which `resolveCqBinding` rejects (it requires both `cqKey` and `instanceId`). In production, the path runs end-to-end whenever the move payload carries a CQ-id from a per-instance row. Materialising per-instance `CriticalQuestion` rows alongside `CqObligationRecord` rows (in `ensureObligationRowsForInstance`) would make the hook work for catalogue ids too and simplify the test harness. Tracked as a Phase-5 candidate.
3. **Unified `EvidencePicker`.** `InlineEvidencePicker` does not yet merge with `AttachEvidenceQuick` / `AttachEvidenceUnpromoted` from [components/monological/ToulminBox.tsx](../components/monological/ToulminBox.tsx). Spec §11 deferred this consolidation; the inline picker is intentionally minimal (no server POSTs, no promotion semantics).
4. **Card targetType for the latent panel API.** `LatentObligationsForTarget` already short-circuits when `targetType !== "claim"`; extending `/api/schemes/instances?targetType=card&targetId=…` is the path to retire that guard. Mentioned in the latent-panel mount audit too.

---

## Safety / posture

- **Back-compat:** Every change is additive. `WhyChallengeModal.onSubmit`'s second-arg extension is opt-in; existing call sites (LegalMoveToolbar, DialogueActionsModal) were both updated in the same PR-equivalent and pass through the new arg correctly.
- **Server enforcement:** The 400 guard runs **after** `cqId`-required validation and **before** `validateMove`, so a payload missing both `cqId` and `evidenceRefs` reports the most actionable error first.
- **Failure mode of the requiresEvidence lookup:** if the prisma lookup itself throws, we log and proceed (non-fatal) rather than spuriously block legitimate submissions during DB hiccups. This matches the project-wide "warn-before-block" convention for soundness gates (cf. `MESH_SCHEME_SOUNDNESS_MODE` default `warn`).
- **Test cleanup:** The integration test snapshots and reverts both the `CriticalQuestion.requiresEvidence` flag (if it flipped one) and the `CqObligationRecord` status + `evidenceRefs` in a `finally` block, so repeated runs are idempotent.

---

_Phase 3d closed. Ready to proceed to whatever the user selects next._
