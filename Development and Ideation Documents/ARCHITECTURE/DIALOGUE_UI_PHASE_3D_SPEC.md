# Spec — Dialogue-UI phase 3d (per-clause polish)

**Status:** proposed
**Author:** auto-generated from Phase 4 deferred closure
**Plan reference:** `Development and Ideation Documents/ARCHITECTURE/SCHEMES_IMPL_PROTOCOL_SOUNDNESS.md` §3.4 (phase 3d)
**Predecessor audit:** [audits/phase4-deferred-closure-20260530.md](../../../audits/phase4-deferred-closure-20260530.md)
**Sister spec:** [LATENT_PANEL_ROOM_MOUNT_SPEC.md](./LATENT_PANEL_ROOM_MOUNT_SPEC.md)

---

## 1. Goal

Bring the move composer (WHY / GROUNDS / CONCEDE / RETRACT) into alignment with the per-clause obligation model shipped in Phase 4:

1. **Burden-aware affordances.** Hide or disable composer buttons that the current user cannot legally execute given the CQ's `burdenOfProof`.
2. **Inline evidence picker on WHY and GROUNDS.** When the CQ has `requiresEvidence=true` and the burden lies with the actor, the composer must collect at least one `evidenceRef` before submission, and forward it via `payload.evidenceRefs`.
3. **PremiseType-tinted sub-locus headers.** When opening or rendering a sub-locus on a CQ whose underlying premise is `ASSUMPTION` or `EXCEPTION`, the header surfaces that fact in the same hint-copy vocabulary used by `LatentObligationsPanel`.

The goal is NOT to redesign the dialogue UX. It is to wire per-CQ metadata (already exposed by `/api/schemes/instances/[id]/protocol-state` and `CriticalQuestion` rows) into the existing forms.

---

## 2. Non-goals

- Replacing or restructuring [components/dialogue/DialogueActionsModal.tsx](../../../components/dialogue/DialogueActionsModal.tsx).
- Designing a new global `EvidencePicker` component. We will extract a minimal local one (`<InlineEvidencePicker>`) and leave full convergence with `AttachEvidenceQuick` / `AttachEvidenceUnpromoted` for a later citation-UX sprint.
- Changing the protocol gate or `dialogueHooks.ts`. The gate already accepts `evidenceRefs` from the obligation row; we only need the composer to write them.
- Touching the legacy [components/claims/CriticalQuestions.tsx](../../../components/claims/CriticalQuestions.tsx) and `CriticalQuestionsV2.tsx`. New work targets V3 only.

---

## 3. Scope — files touched

### 3.1 New files

| Path | Purpose |
|---|---|
| `components/dialogue/InlineEvidencePicker.tsx` | Minimal local evidence-ref collector: URL/DOI input + "add" button → emits `string[]`. Reuses the styling of `AttachEvidenceQuick`. |
| `lib/dialogue/burdenGuards.ts` | Pure helpers: `canPostWhy(burden, isProponent)`, `canPostGrounds(burden, isProponent)`, `canConcede(burden, isProponent)`, `canRetract(burden, isProponent)`, `requiresEvidenceFromActor(cq, isProponent)`. No React, no DB. |
| `__tests__/lib/dialogue/burdenGuards.test.ts` | Jest unit suite for the legality table (see §6.1). |

### 3.2 Modified files

| Path | Change |
|---|---|
| [components/dialogue/DialogueActionsModal.tsx](../../../components/dialogue/DialogueActionsModal.tsx) | Accept new `cqContext.burdenOfProof`, `cqContext.requiresEvidence`, `cqContext.premiseType`. Gate WHY / GROUNDS / CONCEDE / RETRACT buttons through `lib/dialogue/burdenGuards.ts`. Render premiseType-tinted header when `cqContext.premiseType` is non-null. Mount `<InlineEvidencePicker>` inside the WHY → `WhyChallengeModal` step and the GROUNDS → `NLCommitPopover` step when `requiresEvidenceFromActor` is true. |
| [components/dialogue/WhyChallengeModal.tsx](../../../components/dialogue/WhyChallengeModal.tsx) | Add `evidenceRefs: string[]` to the local form state. Append it to the POST body as `payload.evidenceRefs`. Submit button disabled while `requiresEvidence && evidenceRefs.length === 0`. |
| `components/dialogue/NLCommitPopover.tsx` (GROUNDS submitter) | Same delta as `WhyChallengeModal.tsx`. |
| [components/claims/CriticalQuestionsV3.tsx](../../../components/claims/CriticalQuestionsV3.tsx) | Pass `cqContext = { burdenOfProof, requiresEvidence, premiseType }` down to `DialogueActionsModal`. These fields already exist on the CQ rows fetched via `/api/cqs?targetType=...` — no new fetch. Render the existing burden badge plus a small evidence indicator (`getCQEvidenceGuidance` from `lib/utils/cq-burden-helpers.ts`) next to each CQ row. |
| [app/api/dialogue/move/route.ts](../../../app/api/dialogue/move/route.ts) | (Server-side guard, defence-in-depth.) When `kind === "WHY"` or `"GROUNDS"` and the CQ row has `requiresEvidence=true`, return 400 if `payload.evidenceRefs` is missing or empty. The obligation gate already enforces this at *close* time; this enforces it at *post* time so the user gets immediate feedback instead of a downstream close failure. |

### 3.3 Unchanged contracts

- `dialogueHooks.onDialogueMoveForObligations` continues to consume `payload.cqId`. No new keys required.
- `loadProtocolState` already returns `evidenceRefs: string[]` per obligation; the close gate already reads it via `checkSoundnessOnClose`.
- The `CqObligationRecord` schema does not change.

---

## 4. Behavioural rules

### 4.1 Burden-legality table

For a given CQ with `burdenOfProof` and an actor with `isProponent: boolean`:

| Move | `PROPONENT` burden | `CHALLENGER` burden |
|---|---|---|
| `WHY` | challenger only (`!isProponent`) | challenger only (`!isProponent`) |
| `GROUNDS` | proponent only (`isProponent`) | challenger only (`!isProponent`) |
| `CONCEDE` | proponent only | challenger only |
| `RETRACT` | proponent only | challenger only |

Buttons for moves the actor cannot legally post are rendered as **disabled with tooltip** ("Only the proponent / challenger can …"), not hidden — visibility of the option clarifies the protocol.

> **Note:** `OPPONENT` exists in the `BurdenOfProof` enum but is unused in catalogue CQs today; the guard treats it as a synonym for `CHALLENGER`. Documented in `lib/dialogue/burdenGuards.ts`.

### 4.2 Evidence-required rule

```
requiresEvidenceFromActor(cq, isProponent) :=
    cq.requiresEvidence === true
 && ((cq.burdenOfProof === "PROPONENT"   && isProponent) ||
     (cq.burdenOfProof === "CHALLENGER"  && !isProponent) ||
     (cq.burdenOfProof === "OPPONENT"    && !isProponent))
```

When true:
- The composer mounts `<InlineEvidencePicker>`.
- Submit is disabled while `evidenceRefs.length === 0`.
- `payload.evidenceRefs` is included in the POST body verbatim (no de-duping client-side; the server may normalize).

When false (either `requiresEvidence=false`, or burden lies with the *other* party):
- The picker is not rendered.
- `payload.evidenceRefs` is omitted from the body.

### 4.3 PremiseType-tinted sub-locus header

When `cqContext.premiseType` is non-null, the modal's header row appends a small italic line below the CQ text:

| `premiseType` | Header copy |
|---|---|
| `ORDINARY` | (nothing; default) |
| `ASSUMPTION` | *Assumption — accepted unless explicitly challenged.* |
| `EXCEPTION` | *Exception — the challenger must establish that this exception applies.* |

Copy sourced from `getPremiseTypeDisplay` + existing strings in `lib/utils/cq-burden-helpers.ts`. No new copy keys.

Colour tint (Tailwind classes): `ASSUMPTION` → `border-l-2 border-sky-300`; `EXCEPTION` → `border-l-2 border-amber-300`. Quiet.

---

## 5. API & wire-format deltas

### 5.1 `POST /api/dialogue/move` request body

Adds optional `payload.evidenceRefs: string[]`. No other body changes.

```jsonc
{
  "deliberationId": "…",
  "targetType": "claim",
  "targetId": "…",
  "kind": "WHY",
  "payload": {
    "cqId": "…",
    "schemeKey": "expert_opinion",
    "expression": "…",
    "evidenceRefs": ["https://…", "doi:10.…"]   // NEW
  }
}
```

### 5.2 Server-side enforcement (defence-in-depth)

In [app/api/dialogue/move/route.ts](../../../app/api/dialogue/move/route.ts), before the existing handler logic:

```ts
if ((kind === "WHY" || kind === "GROUNDS") && payload.cqId) {
  const cq = await prisma.criticalQuestion.findUnique({
    where: { id: payload.cqId },
    select: { requiresEvidence: true },
  });
  if (cq?.requiresEvidence && !(payload.evidenceRefs?.length > 0)) {
    return NextResponse.json(
      { error: "evidenceRefs required for this CQ" },
      { status: 400 }
    );
  }
}
```

Skipped for the `generic_why_*` synthetic CQ ids (those have no underlying row; the obligation hook already filters them out).

### 5.3 Obligation row update

The existing `dialogueHooks.onDialogueMoveForObligations` continues to handle the transition. We extend it so that when `payload.evidenceRefs` is present, the helper writes them onto `CqObligationRecord.evidenceRefs` via the existing `recordObligationTransition` call.

The transition itself does not change (WHY → `offered-open`, GROUNDS → `offered-engaged`); only the `evidenceRefs` column is now populated by the move-post path instead of waiting for close.

---

## 6. Test plan

### 6.1 Jest — `lib/dialogue/burdenGuards.test.ts` (new)

- Cartesian product `{burden: PROPONENT|CHALLENGER|OPPONENT} × {isProponent: true|false}` × `{move: WHY|GROUNDS|CONCEDE|RETRACT}` → legality table from §4.1.
- `requiresEvidenceFromActor` truth table including `requiresEvidence: false` short-circuit.
- Target: 24 cases.

### 6.2 Jest — `__tests__/components/dialogue/composerBurdenGating.test.tsx` (new)

- Renders `DialogueActionsModal` with mocked `cqContext`.
- Asserts that WHY is disabled when `cqContext.burdenOfProof = "PROPONENT"` and `isProponent = true`.
- Asserts the disabled-tooltip text is present.
- Asserts `<InlineEvidencePicker>` mounts iff `requiresEvidenceFromActor` is true.

### 6.3 Integration — `scripts/audits/test-phase3d-evidence-required.ts` (new)

- Pick a live CQ with `requiresEvidence=true`.
- POST a WHY to `/api/dialogue/move` without `evidenceRefs` → expect 400.
- POST the same WHY with one ref → expect 200, then `loadProtocolState` shows `evidenceRefs.length === 1` on that obligation row.
- POST the matching GROUNDS without `evidenceRefs` → expect 400; then with → expect 200 and transition to `offered-engaged`.
- Idempotency: revert moves at the end (delete the test moves) so the script can re-run.

### 6.4 Regression baseline (must remain green)

```
npx jest __tests__/lib/schemes/                                          → 44/44
npx tsx --env-file=.env scripts/audits/test-phase4-close-gate.ts         → 6/6
npx tsx --env-file=.env scripts/audits/test-phase4-deferred.ts           → 9/9
```

---

## 7. Acceptance criteria

A reviewer should be able to verify, in order:

1. **Legality.** In the modal, a logged-in user who is the *proponent* of a claim sees the WHY button on a `PROPONENT`-burden CQ visibly disabled with the correct tooltip; switching to a non-proponent enables it.
2. **Evidence gating.** On a CQ with `requiresEvidence=true` and matching burden, the WHY submit button stays disabled until the user enters at least one URL/DOI. Submitting without one is rejected by the server too (verifiable via the integration script).
3. **Persistence.** After a WHY post with `evidenceRefs`, `GET /api/schemes/instances/[id]/protocol-state` shows the refs on the matching obligation row.
4. **Header tint.** A CQ whose underlying premise is `EXCEPTION` shows the amber left-border and italic "challenger must establish" line in the modal header.
5. **Regression.** All three baseline suites green.
6. **No schema migration.** `npx prisma db push` reports "Already in sync".

---

## 8. Sequencing & estimate-free milestones

Milestones, not estimates:

- **M1.** `lib/dialogue/burdenGuards.ts` + unit tests. Pure, no UI risk.
- **M2.** `<InlineEvidencePicker>` extracted from `AttachEvidenceQuick` pattern; standalone.
- **M3.** `WhyChallengeModal` + GROUNDS popover wired to picker and `payload.evidenceRefs`.
- **M4.** `DialogueActionsModal` burden-gates the four move buttons; header tinted.
- **M5.** `CriticalQuestionsV3` threads `cqContext` down.
- **M6.** Server-side evidence-required guard in `app/api/dialogue/move/route.ts`.
- **M7.** Integration script + closure audit.

M1–M2 can land independently; M3 onward is a chain.

---

## 9. Risk & rollback

- **Risk: false-positive burden disablement** if `isProponent` resolution is wrong. Mitigation: M5 must read proponent identity from the same source `CriticalQuestionsV3` uses for `claimAuthorId` (already present on its props).
- **Risk: server-side guard breaks ad-hoc CQs** (`generic_why_*`). Mitigation: skip clause in §5.2 explicitly excludes synthetic ids — same filter as `dialogueHooks.onDialogueMoveForObligations`.
- **Rollback:** all changes additive except the server-side 400 in §5.2. To roll back, remove the guard block; the UI gating degrades quietly (forms just don't pre-disable submit) without breaking existing posts.

---

## 10. Out-of-scope follow-ons

- Unifying `<InlineEvidencePicker>` with `AttachEvidenceQuick` / `AttachEvidenceUnpromoted` into a single `EvidencePicker` package.
- Promoting `evidenceRefs` from `string[]` to a richer `EvidenceRef { uri, kind, addedAt, addedBy }` shape — would touch the obligation gate, the close audit, and the Carneades evaluator.
- Burden-gating for the legacy `CriticalQuestionsV2.tsx` and `CriticalQuestions.tsx`. Deprecate or migrate callers; do not back-port.
