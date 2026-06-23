# Attack Ratification — Dev Spec (v1)

**Status:** READY TO BUILD · **Created:** 2026-06-14 · **Owner:** Rohan Mathur
**Decision source:** [`RESEARCH_PROGRAMME/10_IDEATION_SESSIONS/13-attack-ratification-layer-2026-06-14.md`](../RESEARCH_PROGRAMME/10_IDEATION_SESSIONS/13-attack-ratification-layer-2026-06-14.md) — all design decisions (D1–D11) are resolved there. Do not re-litigate decisions here; cite the session.
**Related:** [`PA_NODE_PREFERENCE_INTEGRATION_ROADMAP.md`](PA_NODE_PREFERENCE_INTEGRATION_ROADMAP.md) (built `buildDeliberationGraph`, the enforcement point).

---

## 0. Goal

Give human-authored attacks (`ConflictApplication`s) a ratification gate analogous to AI logicality-on-ratification: a CA is created immediately (attributed, on the record, contestable) but only counts as a **defeat** in the grounded extension once it clears the deliberation's ratification policy. Gates the **attack→defeat seam** the architecture already has.

## 1. Scope

**In (v1):** `ConflictApplication` lifecycle; `ConflictRatification` ledger; `attackRatificationPolicy` resolution (`none`/`single`/`quorum:N`); the enforcement filter; sign-off + withdrawal + retract API; provisional standing label + notification; on-demand recompute; migration via default-backfill.

**Out / deferred (with the session decision that parked each):** `moderator` + `fraction` policies and `REJECTED` state (need governance roles — the deliberation-creation/moderation work; D1/D8); privacy-keyed defaults (need a visibility typology; D1); per-attack-type policies + undercut floor (D3/D9); participant-restricted & reputation-weighted eligibility (D4); reinstatement fast-path (D11); two-grounded-engine convergence (D5).

## 2. Data model (schema delta — `lib/models/schema.prisma`, applied via `prisma db push`)

### 2.1 `ConflictApplication` lifecycle (D8)

Add to the existing model:

```prisma
// Ratification (attack→defeat gate). Status values: PROPOSED | EFFECTIVE | WITHDRAWN.
// String (not a Prisma enum) to match this model's other status fields
// (aspicAttackType, legacyAttackType, …). DEFAULT "EFFECTIVE" is load-bearing:
// `db push` backfills every existing row to EFFECTIVE, so introducing the §4
// filter changes no current standing. New CAs under a gating policy are set to
// "PROPOSED" explicitly at creation (§3.2).
ratificationStatus String   @default("EFFECTIVE")
ratifiedAt         DateTime?
ratifications      ConflictRatification[]

@@index([deliberationId, ratificationStatus]) // the §4 enforcement filter
```

### 2.2 `ConflictRatification` ledger (new model)

```prisma
model ConflictRatification {
  id                    String    @id @default(cuid())
  conflictApplicationId String
  ratifierId            String
  createdAt             DateTime  @default(now())
  withdrawnAt           DateTime? // set on withdrawal; row RETAINED (deliberate, recorded act — D8)

  conflictApplication ConflictApplication @relation(fields: [conflictApplicationId], references: [id], onDelete: Cascade)

  @@unique([conflictApplicationId, ratifierId]) // one live sign-off per ratifier
  @@index([conflictApplicationId])
}
```

A sign-off "counts" iff `withdrawnAt IS NULL`. Withdrawal sets `withdrawnAt` (never deletes), preserving the audit trail; re-signing after withdrawal clears it (upsert).

### 2.3 `DeliberationPref.attackRatificationPolicy` (D1)

```prisma
attackRatificationPolicy String? // null → resolve default from hostType (§3.1). Values: "none" | "single" | "quorum:N"
```

Nullable on purpose: `DeliberationPref` is keyed by `deliberationId` and **created on-demand** — many deliberations have no row. Policy is resolved **on-demand** (§3.1), so absence ⇒ derived default, not a hard error.

### 2.4 Migration

The `@default("EFFECTIVE")` on §2.1 **is** the backfill — `db push` adds the column with every existing CA already `EFFECTIVE`. No separate backfill script. Verify post-push: `SELECT ratificationStatus, count(*) FROM "ConflictApplication" GROUP BY 1` shows only `EFFECTIVE`. (Repo convention: `db push`, not migrate — CLAUDE.md.)

## 3. Policy model

### 3.1 Resolution (on-demand — touches zero create sites)

```ts
// lib/aspic/ratification/policy.ts (new)
type Policy = { kind: "none" } | { kind: "single" } | { kind: "quorum"; n: number };

async function resolveRatificationPolicy(deliberationId): Promise<Policy> {
  const pref = await prisma.deliberationPref.findUnique({ where: { deliberationId }, select: { attackRatificationPolicy: true } });
  if (pref?.attackRatificationPolicy) return parse(pref.attackRatificationPolicy);
  // No explicit policy → derive default from hostType (D1): free → none, else → single.
  const d = await prisma.deliberation.findUnique({ where: { id: deliberationId }, select: { hostType: true } });
  return d?.hostType === "free" ? { kind: "none" } : { kind: "single" };
}
function threshold(p: Policy): number { return p.kind === "none" ? 0 : p.kind === "single" ? 1 : p.n; }
```

> **Design note:** resolving from `hostType` on-demand replaces "seed the policy at every deliberation-create site" (the skeleton's plan). It needs no change to `arguments/quick*`, `deliberations/upsert`, `works`, `review`, etc. — the default is derived live; an explicit override is written to `DeliberationPref` only when someone sets one.

### 3.2 Creation status (one change to CA creation)

[`app/api/ca/route.ts`](../app/api/ca/route.ts) POST sets the initial status from the policy:

```ts
const policy = await resolveRatificationPolicy(d.deliberationId);
const ratificationStatus = policy.kind === "none" ? "EFFECTIVE" : "PROPOSED";
// … create with { ratificationStatus, ratifiedAt: policy.kind === "none" ? new Date() : null }
```

CA-creation paths other than `/api/ca` (e.g. the ASPIC→AIF translation, importer) should call the same helper or default to `EFFECTIVE` (system-generated). Audit list in §10.

### 3.3 Mutability + grandfathering (D7)

Editing `attackRatificationPolicy` is allowed mid-deliberation. **Tightening never demotes** existing `EFFECTIVE` CAs. **Loosening** runs a one-shot sweep: any `PROPOSED` CA whose live sign-off count now ≥ the new threshold flips to `EFFECTIVE` (+ `ratifiedAt`). Implemented in the policy-update handler; no scheduled job.

## 4. Enforcement (the gate)

Filter conflicts to `ratificationStatus: "EFFECTIVE"` at every path that reads `ConflictApplication` into a defeat computation:

1. [`lib/aspic/deliberationEvaluation.ts`](../lib/aspic/deliberationEvaluation.ts) `buildDeliberationGraph` — add `ratificationStatus: "EFFECTIVE"` to the `conflictApplication.findMany` where-clause.
2. [`app/api/aspic/evaluate/route.ts`](../app/api/aspic/evaluate/route.ts) — same on its conflict fetch.

**Audit obligation:** grep every `conflictApplication.findMany`/`findFirst` that feeds an ASPIC theory and confirm it filters (or intentionally doesn't — e.g. the CQ/CEG path is out of scope, D5). No other engine change.

Effect is immediate: the next evaluation (these are on-demand) reflects the new status — see §6.

## 5. API surface

All under auth; all reject the CA **author** as ratifier (no self-ratification — mirrors `challengeCq`'s no-self-canonical floor). Eligibility = any authenticated non-author (D4 — *not* sybil-resistant; recorded §9). AI/MCP callers (`authorKind:"AI"` / `mcp-bot`) may NOT ratify (D4).

### 5.1 `POST /api/ca/[id]/ratify` — sign off
1. Auth; load CA; 404 if missing; **403 if caller is the CA author**; 403 if caller resolves to an AI actor.
2. `upsert` `ConflictRatification` on `(conflictApplicationId, ratifierId)` — set `withdrawnAt = null`.
3. Recount live sign-offs; if `≥ threshold(policy)` and status is `PROPOSED` → set `EFFECTIVE` + `ratifiedAt = now`; trigger §6.
4. Return `{ ok, ratificationStatus, signoffs: k, threshold: N }`.

### 5.2 `DELETE /api/ca/[id]/ratify` — withdraw a sign-off
1. Auth; set `withdrawnAt = now` on the caller's row (recorded, not deleted).
2. Recount; if now `< threshold` and status is `EFFECTIVE` → demote to `PROPOSED`, clear `ratifiedAt`; trigger §6. (Deliberate, recorded reversal — D8.)

### 5.3 Author retract → `WITHDRAWN`
Terminal. The CA author retracts the whole CA (route TBD — fold into the existing retraction path / fossil model). `WITHDRAWN` CAs are excluded by the §4 filter and from re-ratification.

### 5.4 Referential / hygiene
Optional cheap referential validation at `/api/ca` (does the conflicted element exist in this deliberation?) — well-formedness, not a semantic judge (D10). Mirrors the PA-node §4.4 validation pattern.

## 6. Recompute & transitions

**The ASPIC standing path is on-demand** — `getArgumentDefeats` / `GET /api/aspic/evaluate` evaluate live, so a status flip is reflected on the *next* call with no recompute job. There is no cached ASPIC standing store today.

- **If/when the Phase 3.2b batch standing endpoint lands** (cached per-deliberation standings), a status flip MUST invalidate that cache.
- `recomputeGroundedForDelib` ([`lib/ceg/grounded.ts:69`](../lib/ceg/grounded.ts)) is the **CEG/claim-level** recompute (a different engine — D5); ratification does not drive it. Do not call it for ASPIC ratification flips.
- For live UI, the §7 notification/standing-label refresh is what surfaces a flip to viewers.

Every transition (ratify, withdraw, demote) is a deliberate, recorded event (session §3) — preserves the no-thrash property.

## 7. UI / surfacing (D6)

### 7.1 Provisional / pending standing label
Extend the Phase 3 standing read-model (`getArgumentDefeats` → `standing`) and [`PreferenceBadge`](../components/aif/PreferenceBadge.tsx) (already shows grounded standing):
- A target with a `PROPOSED` CA against it reads **"contested · pending k/N"**, visually distinct from "defeated".
- An un-ratified-but-uncontested `in` argument reads **provisional** (≈ `untested-default`) vs `tested-survived` (D2). The standing endpoint should return, per argument, the set of `PROPOSED` CAs targeting it (+ k/N) so the badge can render the pending state.
- TODO: thread `ratificationStatus` counts into the standing response (the endpoint already evaluates the deliberation; it can also fetch the per-target `PROPOSED` CA counts cheaply).

### 7.2 Notification (needs a small model addition)
**Finding:** the [`Notification`](../lib/models/schema.prisma) model is BigInt-keyed and social-shaped (`type notification_type`; typed refs for conversation/message/market/trade — no generic deliberation/CA ref). Wiring ratification notifications therefore requires:
1. a new `notification_type` enum value (e.g. `ratification_needed`, `ratification_cleared`); and
2. a reference path to the CA/deliberation — either add `deliberationId String?` + `conflictApplicationId String?` to `Notification`, or stash them in a (new) `metaJson`.

Notify on: a CA needs ratification (→ target author + active participants), and when it clears. Helper alongside [`lib/actions/notification.actions.ts`](../lib/actions/notification.actions.ts). Secondary surfaces (per-deliberation pending queue, facilitation-equity backlog) are optional, post-v1.

## 8. Semantics (reference — session §3)

Ratification **preserves the grounded fixed point** (filters the subgraph + gates timing, not the semantics); **biases toward `in`** (D2); **zero effect on the axiom/strict core**; and is the **only lever** over the always-defeating undercut / assumption-undermine modes that PA-node preferences can't reach (the load-bearing justification). No engine change beyond the §4 filter. Proven mechanics: [`deliberation-evaluation.test.ts`](../__tests__/aspic/deliberation-evaluation.test.ts) (a stored preference flips standing through the DB pipeline) — the ratification flip is the same shape with `ratificationStatus` gating which CAs enter.

## 9. Known limitations (record honestly)

- **Not sybil-resistant in v1** (D4): a determined actor can post-once / sockpuppet a `single` threshold. Reputation-weighting (deferred) is the real fix.
- `moderator`/`fraction`/`REJECTED`/privacy-defaults blocked on governance roles (the deliberation-creation/moderation work — now available; can be picked up as tier-2).
- Ratification debt accepted (D11): a target can sit `out` while its reinstating attack is un-ratified — surfaced via the pending label, not hidden.

## 10. Test plan

- **Unit (policy):** `resolveRatificationPolicy` (`free`→none, else→single, explicit override wins); `threshold`; quorum parse.
- **Unit (API):** self-ratification 403; AI ratifier 403; sign-off below threshold keeps `PROPOSED`; reaching threshold flips `EFFECTIVE`; withdrawal below threshold demotes; re-sign clears `withdrawnAt`. (Handler tests, mocked prisma — mirror [`pa.test.ts`](../__tests__/api/pa.test.ts).)
- **Integration (enforcement):** a `PROPOSED` CA does NOT affect grounded standing; flipping it `EFFECTIVE` makes the target `out`; withdrawing reverts. Extend [`deliberation-evaluation.test.ts`](../__tests__/aspic/deliberation-evaluation.test.ts) — add `ratificationStatus` to the conflict fixtures and assert the filter + flip.
- **Migration:** post-`db push`, all existing CAs are `EFFECTIVE`; standing unchanged vs. pre-deploy.
- **Audit test/grep:** every `conflictApplication.findMany` feeding an ASPIC theory filters on `EFFECTIVE`.

## 11. Rollout safety (staged, each step reversible)

1. **Schema** (`db push`) — adds columns; all existing CAs `EFFECTIVE`; **no behaviour change** (filter not yet added).
2. **Filter** (§4) — still inert (everything `EFFECTIVE`).
3. **Creation status** (§3.2) — new CAs in gating deliberations start `PROPOSED`; existing stay `EFFECTIVE`. First behaviour change; watch a canary deliberation.
4. **Ratify/withdraw API + UI label + notifications.**

## 12. Resolved implementation notes (was §12 TODOs)

- **Enum vs string:** `String @default("EFFECTIVE")` (matches `ConflictApplication`'s other status fields; avoids enum-migration friction). Revisit if a Prisma enum is preferred repo-wide.
- **`quorum:N` encoding:** stored in the single `attackRatificationPolicy` string (`"quorum:3"`), parsed by `resolveRatificationPolicy`. No separate column.
- **Recompute engine:** ASPIC standing is on-demand (no job); CEG `recomputeGroundedForDelib` is a separate engine and must NOT be called for ratification (§6).
- **Policy override surface pre-creation-UX:** API-only for v1 (`PATCH /api/deliberations/[id]/pref` or similar writes `attackRatificationPolicy`); the deliberation-creation/moderation UX exposes it properly in tier-2.
- **Notification model gap:** see §7.2 — needs a new `notification_type` + a deliberation/CA reference; the only schema addition beyond §2.

## 13. Change log

### 2026-06-14 — PR1 (schema + enforcement filter + policy resolver) — uncommitted (working tree)

**Inert foundational layer (rollout stages 1–2). No behaviour change after `db push`.**

- **Schema (§2)** — added to [`lib/models/schema.prisma`](../lib/models/schema.prisma): `ConflictApplication.ratificationStatus String @default("EFFECTIVE")` + `ratifiedAt` + `ratifications[]` + `@@index([deliberationId, ratificationStatus])`; new `ConflictRatification` ledger model (`@@unique([conflictApplicationId, ratifierId])`); nullable `DeliberationPref.attackRatificationPolicy`. Ran **`npx prisma generate`** (schema-only, no DB) so the new fields typecheck.
- **Policy resolver (§3.1)** — [`lib/aspic/ratification/policy.ts`](../lib/aspic/ratification/policy.ts): `parseRatificationPolicy`, `ratificationThreshold`, `resolveRatificationPolicy` (explicit `DeliberationPref` wins, else `hostType` default `free`→none/else→single). Touches **zero** create sites.
- **Enforcement filter (§4)** — added `ratificationStatus: "EFFECTIVE"` to the conflict fetch in [`buildDeliberationGraph`](../lib/aspic/deliberationEvaluation.ts) and [`GET /api/aspic/evaluate`](../app/api/aspic/evaluate/route.ts). Inert: all existing CAs are `EFFECTIVE` by the column default.
- **Tests** — [`ratification-policy.test.ts`](../__tests__/aspic/ratification-policy.test.ts) (parse/threshold/resolve) + a filter-applied assertion in [`deliberation-evaluation.test.ts`](../__tests__/aspic/deliberation-evaluation.test.ts). 19 passing across PR1 + PA regression.
- **DEPLOY REQUIREMENT:** run **`npm run db:push`** to add the columns/table to the DB. The `@default("EFFECTIVE")` backfills existing rows; verify `SELECT ratificationStatus, count(*) FROM "ConflictApplication" GROUP BY 1` → all `EFFECTIVE`. The filter references `ratificationStatus`, so the code must not deploy ahead of the push.
- **Deferred to PR2 (sequencing correction):** the §3.2 **creation-status flip** (new gated CAs → `PROPOSED`) ships *with* the ratify/withdraw API — shipping it alone would strand new attacks `PROPOSED` with no ratification path.

### 2026-06-15 — PR2 (activation: creation-status + ratify/withdraw) — uncommitted (working tree)

**Ratification is now functionally active** (rollout stage 3 + the core API). PR1's `db push` is applied. In a gating deliberation (non-`free` `hostType`, or explicit policy), a new attack no longer affects standing until ratified.

- **Creation-status flip (§3.2)** — [`POST /api/ca`](../app/api/ca/route.ts) now calls `resolveRatificationPolicy` and sets `ratificationStatus` `PROPOSED` (gating) / `EFFECTIVE` (`none`) + `ratifiedAt`. System-generated CAs (translation/import) omit the field → default `EFFECTIVE` (unchanged).
- **Ratify / withdraw API (§5.1/§5.2)** — new [`POST/DELETE /api/ca/[id]/ratify`](../app/api/ca/[id]/ratify/route.ts). POST upserts a sign-off and flips `PROPOSED`→`EFFECTIVE` at threshold; DELETE records a withdrawal (never deletes) and demotes `EFFECTIVE`→`PROPOSED` below threshold. Guards: auth (401), CA not found (404), withdrawn (409), **no self-ratification** (403), **no AI/system ratifiers** (403, v1 denylist heuristic). Standing is on-demand so no recompute job (§6).
- **Tests** — [`ca-ratify.test.ts`](../__tests__/api/ca-ratify.test.ts) (7: auth/404/self/AI/threshold-flip/below-threshold/withdraw-demote). 22 passing across PR1+PR2; full `__tests__/api/` suite green (211) — no regression from the `/api/ca` change.
- **Enforcement note:** the PR1 filter already excludes `PROPOSED` CAs; the mock-based test asserts the `where` clause. A true end-to-end (a `PROPOSED` CA dropping from standing until ratified) is now verifiable against the live DB.
- **Deferred to PR3:** policy-override endpoint + mutability sweep (§3.3); author-retract → `WITHDRAWN` (§5.3); provisional standing label (§7.1); notifications (§7.2, needs the `notification_type` + ref addition).

### 2026-06-15 — PR3 (governance + surfacing: policy override, retract, pending label, notifications) — uncommitted (working tree)

**Closes the v1 scope.** The full lifecycle is now operable and visible: set a policy, gate an attack, ratify/withdraw a sign-off, retract the attack, and see/learn about each state.

- **Policy override + loosening sweep (§3.3)** — new [`GET/PUT /api/deliberations/[id]/ratification-policy`](../app/api/deliberations/[id]/ratification-policy/route.ts). `PUT` validates `"none"|"single"|"quorum:N"`, upserts `DeliberationPref.attackRatificationPolicy` (supplies `profile:"community"` on insert since it has no default), then runs the **loosening sweep**: every `PROPOSED` CA whose live sign-offs now meet the new threshold flips to `EFFECTIVE` (`none` → threshold 0 promotes all, no per-CA count). Tightening only raises the bar — no existing `EFFECTIVE` CA is demoted (D7). API-only for v1 (§12); auth-gated, governance roles deferred.
- **Author retract → `WITHDRAWN` (§5.3)** — new [`POST /api/ca/[id]/retract`](../app/api/ca/[id]/retract/route.ts). Author-only (403 otherwise), terminal, idempotent. Distinct from `DELETE …/ratify` (which withdraws one *sign-off*); this withdraws the whole *attack*. `WITHDRAWN` is excluded by the §4 filter and barred from re-ratification (ratify already 409s on it).
- **Provisional standing label (§7.1)** — new [`getPendingAttacks`](../lib/aspic/deliberationEvaluation.ts) returns `{ count, threshold, topSignoffs }` for the `PROPOSED` CAs targeting an argument (both `conflictedArgumentId` and the conclusion claim; `none` → zero). [`GET …/defeats`](../app/api/arguments/[id]/defeats/route.ts) returns it as `pending`; [`PreferenceBadge`](../components/aif/PreferenceBadge.tsx) renders a blue **"PENDING k/N"** chip — distinct from the red `OUT` defeat state. These CAs are *not* in the grounded extension (the §4 filter excludes them); the label is the only place they surface.
- **Notifications (§7.2)** — schema: two `notification_type` values (`ratification_needed`, `ratification_cleared`) + nullable `Notification.deliberation_id` / `conflict_application_id` scalars (no FK — reasoning layer keys on cuids). Helpers [`createRatification{Needed,Cleared}Notif`](../lib/actions/notification.actions.ts) bridge the `String` actor id → `BigInt` `User.id`, skipping non-numeric (AI) ids and self-notifications. Wired: CA create under a gating policy → **target author** gets `ratification_needed`; a sign-off that flips the CA `EFFECTIVE` → **CA author** gets `ratification_cleared`. Both best-effort (a notification error never fails/rolls back the request). [`NotificationsList`](../app/(root)/(standard)/notifications/NotificationsList.tsx) renders both, linking to `/deliberation/[id]`.
- **Tests** — [`ca-retract.test.ts`](../__tests__/api/ca-retract.test.ts) (5: auth/404/non-author/withdraw/idempotent); [`ratification-policy-route.test.ts`](../__tests__/api/ratification-policy-route.test.ts) (5: auth/validation/upsert/sweep-promote/none-promote-all); [`pending-attacks.test.ts`](../__tests__/aspic/pending-attacks.test.ts) (4: empty/none-short-circuit/top-signoffs/arg-only-target); `ca-ratify.test.ts` extended to mock the notify module + assert the cleared-notif fires on flip (and not below threshold). **21 new/updated tests green**; full `__tests__/api/` + `__tests__/aspic/` run shows only the 2 pre-existing DB-integration suites failing (`translation`, `strictRules.integration`) — unrelated. `npx prisma generate` + targeted `tsc`/`eslint` on all touched files clean.
- **DEPLOY REQUIREMENT:** run **`npm run db:push`** — adds the two enum values + the two nullable `Notification` columns. Nullable/additive, so no backfill; safe before or with the code (the notify helpers no-op gracefully if a column were missing, but the enum values must exist for `create`).
- **Deferred past v1 (unchanged from §1/§9):** participant-fanout notifications + per-deliberation pending queue (v1 notifies only the directly-knowable target/CA authors); `moderator`/`fraction`/`REJECTED` + governance-role-gated policy editing; reputation-weighted / sybil-resistant eligibility; the standing-label "tested-survived vs untested-default" refinement (D2) beyond the pending chip.
