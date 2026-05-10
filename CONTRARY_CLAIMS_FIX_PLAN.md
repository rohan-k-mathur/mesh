# Contrary Claim System — Fix & Improvement Plan

Source audit: see prior conversation. This doc enumerates concrete tasks in priority order. Each task lists scope, acceptance criteria, and key files.

---

## P0 — Security & correctness (do first)

### 1. Add auth + scoping to DELETE `/api/contraries`
- **Files:** [app/api/contraries/route.ts](app/api/contraries/route.ts#L99-L132)
- **Change:**
  - Call `getCurrentUserId()`; 401 if missing.
  - Require `deliberationId` query param; load row and verify match.
  - Allow only `createdById === userId` OR a moderator/admin of the deliberation.
  - Remove the `// TODO: Add auth check` comment.
- **Accept:** Unauthenticated DELETE → 401. Other-user DELETE → 403. Owner DELETE → 200 with `status="RETRACTED"`.

### 2. Fix `aifToASPIC` shape in transposition route
- **Files:** [app/api/aspic/transposition/generate/route.ts](app/api/aspic/transposition/generate/route.ts#L74-L101)
- **Bug:** Builds `{[claimId]: contraryId[]}` and casts `as any`; translator iterates an object → drops all explicit contraries.
- **Change:** Pass the raw `findMany` rows (with `claim:{text}` and `contrary:{text}` includes) directly, mirroring [evaluate/route.ts](app/api/aspic/evaluate/route.ts#L267-L283).
- **Accept:** Transposition output reflects explicit contraries. Add a unit test that fails before the fix.

### 3. Hide trash button unless owner/moderator in `ClaimContraryManager`
- **Files:** [components/claims/ClaimContraryManager.tsx](components/claims/ClaimContraryManager.tsx#L42-L52,L375-L383)
- **Change:** Wire the existing-but-unused `userId` prop. Only render the Trash icon when `row.createdById === userId` (string compare) or `isModerator`. Pass `userId`/`isModerator` from [ClaimDetailPanel.tsx](components/claims/ClaimDetailPanel.tsx#L331-L338).
- **Accept:** Non-owners see no delete control; owners do.

---

## P1 — Data integrity

### 4. Make duplicate guard direction-aware for asymmetric contraries
- **Files:** [app/api/contraries/create/route.ts](app/api/contraries/create/route.ts#L78-L93)
- **Change:** When `isSymmetric=false`, only block `(claimId, contraryId)` exact match; allow inverse. When `isSymmetric=true`, keep current both-direction block.
- **Accept:** Two asymmetric rows `A→B` and `B→A` can coexist; symmetric duplicates still 409.

### 5. Scope axiom well-formedness check by deliberation; check both sides
- **Files:** [app/api/contraries/create/route.ts](app/api/contraries/create/route.ts#L96-L117)
- **Change:** Filter `argumentPremise.findMany` by `deliberationId`. Check both `claimId` and `contraryId`.
- **Accept:** Axiom usage in another deliberation no longer blocks creation here; both endpoints validated.

### 6. Validate `status` enum + safe BigInt cast in create
- **Files:** [app/api/contraries/route.ts](app/api/contraries/route.ts#L19-L31), [app/api/contraries/create/route.ts](app/api/contraries/create/route.ts#L122)
- **Change:** Constrain `status` to `{ACTIVE,PROPOSED,DISPUTED,RETRACTED}` with 400 on invalid. Wrap `BigInt(userId)` in try/catch → 400 instead of 500.
- **Accept:** `?status=foo` → 400. Non-numeric session id → 400.

### 7. Remove stale `@ts-ignore` for `ClaimContrary`
- **Files:** [app/api/aspic/evaluate/route.ts#L268](app/api/aspic/evaluate/route.ts#L268)
- **Change:** Run `npx prisma generate`; delete the suppression.
- **Accept:** No `@ts-ignore` near the `claimContrary` access; build clean.

---

## P2 — UI surfacing

### 8. Show incoming asymmetric contraries in GET + UI
- **Files:** [app/api/contraries/route.ts](app/api/contraries/route.ts#L36-L40), [ClaimContraryManager.tsx](components/claims/ClaimContraryManager.tsx), [ArgumentCardV2.tsx](components/arguments/ArgumentCardV2.tsx#L1129-L1158)
- **Change:** Optional `?direction=incoming|outgoing|both` (default `both`). Manager renders two sections; badge tooltip distinguishes "contrary to" vs "contradicted by".
- **Accept:** A claim that is *only* on the receiving end of an asymmetric contrary still shows the badge.

### 9. Contrary badge on plain claim cards
- **Files:** components/claims/* (mini-map, list rows), AIF/Dung viewers
- **Change:** Lightweight rose pill (count) reusing the same fetch + `contraries:changed` listener pattern from `ArgumentCardV2`.
- **Accept:** Claims with ≥1 ACTIVE contrary show the badge anywhere they're rendered.

### 10. Render contrary edges in AIF / argument graph viewers
- **Files:** AIF / Dung graph components (search `aif` / `dungViewer`)
- **Change:** Add a dashed rose edge type for explicit contraries; toggle in legend.
- **Accept:** Edges visible alongside attack edges; toggle hides them.

### 11. Delete + view affordance in `QuickContraryDialog` and badge tooltip
- **Files:** [components/arguments/QuickContraryDialog.tsx](components/arguments/QuickContraryDialog.tsx), [ArgumentCardV2.tsx](components/arguments/ArgumentCardV2.tsx#L1129-L1158)
- **Change:** Show recent contraries inside the dialog with delete (owner-gated). Tooltip gets a "Manage…" link opening the dialog.
- **Accept:** Users can delete their own contraries without leaving the argument card.

### 12. Inline "create contrary claim" in `ClaimPicker`
- **Files:** [ClaimContraryManager.tsx#L240](components/claims/ClaimContraryManager.tsx#L240)
- **Change:** Flip `allowCreate` true (or add a "+ New claim" affordance specifically for the contrary slot) and wire to existing claim-create endpoint.
- **Accept:** Author and link a brand-new claim as contrary in one flow.

### 13. Provenance + reason in tooltips and post-create confirmation
- **Files:** badge tooltip in `ArgumentCardV2.tsx`, `QuickContraryDialog.tsx`
- **Change:** Surface `createdBy.username` and `reason` in hover/post-create state.
- **Accept:** No need to open the manager to see who created a contrary and why.

---

## P3 — Schema / lifecycle

### 14. Decide on `PROPOSED` / `DISPUTED` lifecycle
- **Files:** [lib/models/schema.prisma#L2956-L2980](lib/models/schema.prisma#L2956-L2980), API + UI
- **Option A — implement:** Add transition endpoints (`/api/contraries/:id/dispute`, `/resolve`), filter UI by status, badges/colors per status, moderator queue.
- **Option B — remove:** Simplify status to `ACTIVE | RETRACTED`; migration to coerce existing values.
- **Accept:** Schema and code agree; no dead enum values.

### 15. Link a contrary to its ASPIC consequence
- **Files:** badge tooltip / manager footer
- **Change:** "View in ASPIC results" link that scrolls/filters [AspicTheoryPanel] / [GroundedExtensionPanel] to the relevant attack.
- **Accept:** One click from badge → highlighted attack/defeat in the ASPIC panel.

---

## P4 — Tests

### 16. Integration tests for `/api/contraries` (create / get / delete)
- **Files:** new `__tests__/api/contraries.test.ts`
- **Cover:** auth, self-contrary, cross-deliberation, duplicate (sym + asym), axiom guard, soft-delete, owner-only DELETE, status validation.

### 17. Unit test: `aifToASPIC` consumes `ClaimContrary` rows
- **Files:** new `__tests__/aspic/contraries.translation.test.ts`
- **Cover:** symmetric inserts both directions; asymmetric only one; mismatched shape (the transposition bug) regression.

### 18. UI test: badge updates on `contraries:changed`
- **Files:** new `__tests__/components/contraryBadge.test.tsx`
- **Cover:** mount → POST event → count refreshes.

---

## Suggested execution order

1. Task 1 (DELETE auth) + Task 3 (hide trash) — same PR, closes the security gap end-to-end.
2. Task 2 (transposition shape) + Task 7 (`@ts-ignore`) — small, high-signal fixes.
3. Task 16 + Task 17 — lock in the fixes with tests.
4. Tasks 4–6 — data-integrity polish.
5. Tasks 8–9 — broaden UI visibility (highest user-perceived value).
6. Task 14 — make a call on the lifecycle states before building more UI on top.
7. Tasks 10–13, 15, 18 — UX layer and graph visualization.

---

Ready to start on **Task 1 + Task 3** (DELETE auth + trash gating) on your signal.
