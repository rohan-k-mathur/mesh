# LatentObligationsPanel mounting — closure audit
**Date:** 2026-05-30
**Spec:** `Development and Ideation Documents/ARCHITECTURE/LATENT_PANEL_ROOM_MOUNT_SPEC.md`
**Predecessor:** [phase4-deferred-closure-20260530.md](./phase4-deferred-closure-20260530.md)

## Outcome
Latent obligations panel is now mounted in the live room surface. Any room view that renders `CriticalQuestionsV3` against a claim with one or more open `SchemeInstance` rows will display, at the top of the CQ panel, a collapsed-by-default "Latent obligations" row per instance.

## Mid-implementation correction

The spec originally anchored on [components/arguments/ArgumentSchemeList.tsx](../components/arguments/ArgumentSchemeList.tsx). During recon I discovered the substrate carries **two distinct models** that share `ArgumentScheme` but are otherwise unrelated:

| Model | Purpose | Used by |
|---|---|---|
| `ArgumentSchemeInstance` | Links an `Argument` to an `ArgumentScheme` with role/explicitness/order. No protocol state. | `ArgumentSchemeList`, `SchemeInstanceActions`, scheme-management UI. |
| `SchemeInstance` | Targets a claim/card via `(targetType, targetId)`. Carries Phase 4 `status / closedAt / obligations`. | `loadProtocolState`, the close gate, `LatentObligationsPanel`. |

`ArgumentSchemeList` iterates the wrong model — its rows have no `SchemeInstance.id` and no protocol state. Mounting there would have required a per-row target lookup with no clear semantics for the argument → claim mapping.

The corrected anchor is [components/claims/CriticalQuestionsV3.tsx](../components/claims/CriticalQuestionsV3.tsx), which already operates on `(targetType, targetId)` pairs that map directly to `SchemeInstance.targetType/targetId` and already receives the auth/proponent context. The spec has been amended in place (§3.0, §3.1, §3.2, §4, §6) with an "Implementation note" block flagging the correction.

## Files

**Added**
- [components/room/LatentObligationsForTarget.tsx](../components/room/LatentObligationsForTarget.tsx) — wrapper that fetches `SchemeInstance` rows for `(targetType, targetId)` and renders one `LatentObligationsPanel` per open instance.
- [scripts/audits/test-latent-panel-mount-smoke.ts](../scripts/audits/test-latent-panel-mount-smoke.ts) — 8/8 pass.

**Modified**
- [components/claims/CriticalQuestionsV3.tsx](../components/claims/CriticalQuestionsV3.tsx) — import + mount block at top of the list, gated by `targetType === "claim" && deliberationId && currentUserId`. `isProponent={!!isAuthor}` re-uses the existing author-detection logic.
- [app/api/schemes/instances/route.ts](../app/api/schemes/instances/route.ts) — added `status` and `closedAt` to the GET `select`. Additive.

**No changes** to `ArgumentSchemeList`, `SchemeManagementPanel`, `ArgumentCardV2`, the panel itself, the protocol-state endpoint, the close gate, the schema, or any dialogue route.

## Behaviour

- The wrapper short-circuits silently when `targetType !== "claim"`, when `currentUserId` is absent, when the listing endpoint errors, or when there are no open instances. It is invisible in those cases — no chrome, no loading skeleton at the mount site.
- When at least one open instance exists, the wrapper renders one `LatentObligationsPanel` per instance, stacked. Each panel is collapsed by default and only fetches its protocol-state when expanded (the panel already has `useEffect(open && !data)` cost-guarding).
- Argument-mode invocations of `CriticalQuestionsV3` (e.g. argument-level CQ surfaces) get no panel — argument rows don't carry `SchemeInstance` protocol state.

## Verification (2026-05-30)

```
$ npx tsx --env-file=.env scripts/audits/test-latent-panel-mount-smoke.ts → 8/8
$ npx jest __tests__/lib/schemes/                                          → 44/44
$ npx tsx --env-file=.env scripts/audits/test-phase4-close-gate.ts         → 6/6
$ npx tsx --env-file=.env scripts/audits/test-phase4-deferred.ts           → 9/9
```

Total: 67/67. No regressions.

## Risk & rollback

- **Risk:** the listing endpoint's new `status` field could collide with a consumer that already had a local `status` shape. Searched the repo; only `SchemeOverlayFetch.tsx` and `SchemePicker.tsx` consume `/api/schemes/instances`, and neither references `.status` on the instance row.
- **Rollback:** revert the mount block in `CriticalQuestionsV3.tsx`. The wrapper component and endpoint delta remain shipped but unmounted; no consumer is affected.

## Still deferred (follow-on)

1. **Card-targeted `SchemeInstance`s.** Listing endpoint currently rejects `targetType !== "claim"` with a 400. When card surfaces start mounting `CriticalQuestionsV3` (or equivalent), the endpoint and the wrapper's `canQuery` guard need a card branch.
2. **Real-time refresh.** The panel refetches on its own affordance dispatch; passive updates from other actors' moves are out of scope for Phase 1 (would hook into the existing SSE/bus surface).
3. **Per-user persisted collapse state.** Today each panel is collapsed by default per page load.
4. **Dialogue-UI phase 3d** — next sprint, per [DIALOGUE_UI_PHASE_3D_SPEC.md](../Development%20and%20Ideation%20Documents/ARCHITECTURE/DIALOGUE_UI_PHASE_3D_SPEC.md).
