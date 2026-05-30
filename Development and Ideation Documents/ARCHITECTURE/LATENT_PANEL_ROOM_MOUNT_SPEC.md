# Spec — `LatentObligationsPanel` mounting in room shell

**Status:** proposed
**Author:** auto-generated from Phase 4 deferred closure
**Plan reference:** `Development and Ideation Documents/ARCHITECTURE/SCHEMES_IMPL_PROTOCOL_SOUNDNESS.md` §3.5
**Predecessor audit:** [audits/phase4-deferred-closure-20260530.md](../../../audits/phase4-deferred-closure-20260530.md)
**Sister spec:** [DIALOGUE_UI_PHASE_3D_SPEC.md](./DIALOGUE_UI_PHASE_3D_SPEC.md)

---

## 1. Goal

Mount the already-built [components/room/LatentObligationsPanel.tsx](../../../components/room/LatentObligationsPanel.tsx) into the live room shell so participants can see, per open `SchemeInstance`, which Critical Questions remain in the latent stratum (`status = "not-offered"`) and act on them through the existing dialogue/move flow.

This is plumbing only. The panel, its read endpoint (`GET /api/schemes/instances/[id]/protocol-state`), and the per-row hint copy already ship.

---

## 2. Non-goals

- Changing the panel's component contract (props, fetch behaviour, affordance dispatch).
- Adding new SchemeInstance display surfaces that don't already exist.
- Rebuilding [components/arguments/SchemeInstanceActions.tsx](../../../components/arguments/SchemeInstanceActions.tsx) or its parent list.
- Designing a global "panel registry" or feature-flag layer for the panel.

---

## 3. Mount anchors

> **Implementation note (2026-05-30).** The original draft anchored on
> [components/arguments/ArgumentSchemeList.tsx](../../../components/arguments/ArgumentSchemeList.tsx).
> That iterator works on the `ArgumentSchemeInstance` model (links an
> `Argument` to an `ArgumentScheme` with role/explicitness/order). The
> Phase 4 protocol-state machinery operates on a *different* model,
> `SchemeInstance`, which is keyed by `(targetType, targetId)` and
> carries `status / closedAt / obligations`. The two share an
> `ArgumentScheme.schemeId` but are not linked by FK. The corrected
> anchor below uses the surface that already operates on
> `(targetType, targetId)`.

The panel mounts inside [components/claims/CriticalQuestionsV3.tsx](../../../components/claims/CriticalQuestionsV3.tsx), the canonical per-target CQ display. CriticalQuestionsV3 already receives `targetType`, `targetId`, `deliberationId`, `currentUserId`, and `claimAuthorId` from its three consumers ([ArgumentCardV2](../../../components/arguments/ArgumentCardV2.tsx), [ClaimMiniMap](../../../components/claims/ClaimMiniMap.tsx), [ClaimDetailPanel](../../../components/claims/ClaimDetailPanel.tsx)) — no prop threading required.

Because one claim can carry multiple `SchemeInstance` rows, we introduce a thin wrapper [components/room/LatentObligationsForTarget.tsx](../../../components/room/LatentObligationsForTarget.tsx) that fetches the instance list for a `(targetType, targetId)` and renders one `LatentObligationsPanel` per *open* instance. The base `LatentObligationsPanel` keeps its per-instance contract unchanged.

### 3.1 Diagram

```
ArgumentCardV2 / ClaimMiniMap / ClaimDetailPanel
  └── CriticalQuestionsV3                       (existing per-target CQ display)
        ├── <LatentObligationsForTarget … />     (NEW — wrapper at top of list)
        │     └── [one <LatentObligationsPanel … /> per open SchemeInstance]
        └── (existing CQ list, banner, etc.)
```

### 3.2 Deferred anchors

- `ArgumentSchemeList` / `SchemeInstanceActions` — these iterate the unrelated `ArgumentSchemeInstance` model; they have no `SchemeInstance.id` to pass in, so the panel cannot mount there without a separate target lookup.
- Deliberation-overview admin pages — not the production room surface.
- `ComposedCQsModal` / `SchemeSpecificCQsModal` — modal surfaces; mounting the panel inside a modal inverts the spec's "collapsed by default, quiet stratum" framing.
- `targetType === "argument"` invocations of `CriticalQuestionsV3` — arguments don't carry `SchemeInstance` rows. Wrapper short-circuits when `targetType !== "claim"`.

---

## 4. Required prop plumbing

No new props on `CriticalQuestionsV3` — it already accepts everything the wrapper needs. The wrapper takes the same shape and short-circuits when prereqs are missing.

### 4.1 Source of truth per field

| Prop | Source | Notes |
|---|---|---|
| `targetType` / `targetId` | `CriticalQuestionsV3` props | Wrapper renders nothing when `targetType !== "claim"`. |
| `deliberationId` | `CriticalQuestionsV3` props | Wrapper renders nothing when missing. |
| `currentUserId` | `CriticalQuestionsV3` props | Wrapper renders nothing when anonymous. |
| `isProponent` | `isAuthor` computed inside `CriticalQuestionsV3` | Already derived from `currentUserId === claimAuthorId` (falls back to `createdById`). |
| `instanceId` | Discovered by the wrapper | `GET /api/schemes/instances?targetType=claim&targetId=…` → filter `status === "open"`. |

### 4.2 Prop / API deltas

| File | Change |
|---|---|
| [components/room/LatentObligationsForTarget.tsx](../../../components/room/LatentObligationsForTarget.tsx) | NEW. Wrapper described in §3.1. |
| [components/claims/CriticalQuestionsV3.tsx](../../../components/claims/CriticalQuestionsV3.tsx) | Import the wrapper; mount it at the top of the list when `targetType === "claim" && deliberationId && currentUserId`. No prop changes. |
| [app/api/schemes/instances/route.ts](../../../app/api/schemes/instances/route.ts) | Add `status` and `closedAt` to the GET `select`. Additive — existing consumers ignore extra keys. |

---

## 5. Mount-site behaviour

### 5.1 Visibility rule

The panel is rendered only when:
- `schemeInstance.status === "open"`, AND
- `currentUserId` is non-null (anonymous viewers don't see affordances).

When `status !== "open"`, the panel is not mounted — closed instances surface their soundness state through the existing `SchemeInstanceActions` dropdown, not through latent obligations. (Per Phase 4 closure, `closeSchemeInstance` transitions status and clears the panel's relevance.)

### 5.2 Collapse state

The panel manages its own collapsed/open state internally; the mount site does not control or persist it. Per Spec §3.5: collapsed by default. The mount site MAY pass `defaultOpen={true}` from an admin-only debug variant of `SchemeManagementPanel` (out of scope for Phase 1).

### 5.3 Layout

Rendered as a direct sibling beneath `SchemeInstanceActions`, inside the same row container, with no additional surrounding chrome. The panel's own border and quiet styling supply the visual frame.

---

## 6. Implementation outline

1. **Edit** `app/api/schemes/instances/route.ts` GET to include `status` and `closedAt` in the `select`. (Additive — no consumer change required.)
2. **Create** `components/room/LatentObligationsForTarget.tsx` per §3.1.
3. **Edit** `components/claims/CriticalQuestionsV3.tsx`: import the wrapper and mount it inside the main `return` block, immediately above the contextual help banner, gated by `targetType === "claim" && deliberationId && currentUserId`. Pass `isProponent={!!isAuthor}`.
4. **Verify** no consumer of `CriticalQuestionsV3` needs new props — the mount is purely additive at the bottom of the existing prop chain. `tsc --noEmit` should be clean.

---

## 7. Test plan

### 7.1 Component — `__tests__/components/room/LatentObligationsPanel.mount.test.tsx` (new)

Render `ArgumentSchemeList` with a synthetic argument carrying one open `SchemeInstance` and assert:
1. `LatentObligationsPanel` is in the DOM with the expected `instanceId`.
2. When `schemeInstance.status === "closed"`, the panel is NOT mounted.
3. When `currentUserId === argument.authorId`, the panel receives `isProponent={true}` (assert via `data-testid` or a small visibility-of-affordance-label check: "Offer pre-emptively" vs "Raise as opponent").

Use MSW or a fetch mock to stub `/api/schemes/instances/[id]/protocol-state` with a fixture containing one `not-offered` row.

### 7.2 Smoke — `scripts/audits/test-latent-panel-mount-smoke.ts` (new, optional)

A tiny tsx script that:
- Picks a live open `SchemeInstance` whose scheme has `not-offered` obligations.
- Hits `GET /api/schemes/instances/[id]/protocol-state` directly (the same fetch the panel makes).
- Asserts the response shape matches what the component expects (presence of `instance.id`, `obligations[].cqKey`, etc.).

This is the "API contract under the mounted panel still holds" guard.

### 7.3 Regression baseline (must remain green)

```
npx jest __tests__/lib/schemes/                                          → 44/44
npx tsx --env-file=.env scripts/audits/test-phase4-close-gate.ts         → 6/6
npx tsx --env-file=.env scripts/audits/test-phase4-deferred.ts           → 9/9
```

---

## 8. Acceptance criteria

1. Loading any room view that renders `ArgumentCardV2` shows, for every open `SchemeInstance` on every argument, a collapsed "Latent obligations (N unraised)" row beneath the scheme's action dropdown.
2. Expanding the panel fetches `/api/schemes/instances/[id]/protocol-state` once and renders one row per `not-offered` CQ.
3. Clicking "Raise as opponent" (non-proponent) or "Offer pre-emptively" (proponent) successfully POSTs to `/api/dialogue/move`, the panel refetches, and the row disappears (transitioned to `offered-open`).
4. Closing an instance (via `SchemeInstanceActions` → close, or via the close API) removes the panel from the row on next render.
5. No console warnings about missing props on `ArgumentCardV2` / `SchemeManagementPanel` / `ArgumentSchemeList`.
6. `tsc --noEmit` clean.
7. All baseline suites green.

---

## 9. Sequencing & milestones

- **M1.** Thread `deliberationId`, `currentUserId`, `argumentAuthorId` through the three components; verify with `tsc --noEmit`.
- **M2.** Mount the panel conditionally per §5.1.
- **M3.** Component test + (optional) smoke script.
- **M4.** Closure audit.

M1 and M2 can land in a single PR; M3 typically lands alongside.

---

## 10. Risk & rollback

- **Risk: missing `deliberationId` at a call site.** Detected by `tsc --noEmit`; fall back to optional-prop strategy per §6.
- **Risk: noisy UI for arguments with many schemes.** Mitigated by collapsed-by-default; each panel is a single ~24px row in collapsed state.
- **Risk: fetch cost.** One `GET /api/schemes/instances/[id]/protocol-state` per *expanded* panel. The panel guards against fetching while collapsed (`useEffect(open && !data)`). No additional cost on closed-by-default render.
- **Rollback:** delete the mount block in `ArgumentSchemeList.tsx`. The panel component and endpoint remain shipped but unmounted; consumers are unaffected.

---

## 11. Out-of-scope follow-ons

- Mounting on `CriticalQuestionsV3` / modals / admin pages (see §3.2).
- A "show closed instances' historical obligations" mode — closed instances are read-only and out of scope for the latent stratum.
- Per-user persisted collapse state.
- Real-time refresh via the existing SSE/bus infrastructure (today the panel refetches only on its own affordance dispatch; a passive "someone else raised it" update is a follow-on).
