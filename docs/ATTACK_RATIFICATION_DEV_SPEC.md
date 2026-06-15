# Attack Ratification — Dev Spec (v1)

**Status:** SKELETON · **Created:** 2026-06-14 · **Owner:** Rohan Mathur
**Decision source:** [`RESEARCH_PROGRAMME/10_IDEATION_SESSIONS/13-attack-ratification-layer-2026-06-14.md`](../RESEARCH_PROGRAMME/10_IDEATION_SESSIONS/13-attack-ratification-layer-2026-06-14.md) — all design decisions (D1–D11) are resolved there; this spec turns them into an implementation plan. Do not re-litigate decisions here; cite the session.
**Related:** [`PA_NODE_PREFERENCE_INTEGRATION_ROADMAP.md`](PA_NODE_PREFERENCE_INTEGRATION_ROADMAP.md) (sibling governance work; built `buildDeliberationGraph`, the enforcement point).

> Section bodies are stubs to be fleshed out. Each carries the resolved decision + a **TODO** for the implementation detail.

---

## 0. Goal

Give human-authored attacks (`ConflictApplication`s) a ratification gate analogous to AI logicality-on-ratification: a CA is created immediately (attributed, on the record, contestable) but only counts as a **defeat** in the grounded extension once it clears the deliberation's ratification policy. Gates the **attack→defeat seam** the architecture already has.

## 1. Scope

**In (v1):** lifecycle on `ConflictApplication`; `ConflictRatification` ledger; `attackRatificationPolicy` on `DeliberationPref` with policies `none`/`single`/`quorum:N`; enforcement filter; sign-off + withdrawal API; provisional standing label + notification; recompute on transition; migration backfill.

**Out / deferred:** `moderator` + `fraction` policies (need governance roles — parked on the deliberation-creation UX thread); privacy-keyed defaults (need a visibility typology, [§1 D1 finding](../RESEARCH_PROGRAMME/10_IDEATION_SESSIONS/13-attack-ratification-layer-2026-06-14.md)); `REJECTED` state (with `moderator`); per-attack-type policies + undercut floor (D3/D9); participant-restricted & reputation-weighted eligibility (D4); reinstatement fast-path (D11); two-grounded-engine convergence (D5).

## 2. Data model (schema delta — `lib/models/schema.prisma`)

**2.1 `ConflictApplication` lifecycle (D8).** Add `ratificationStatus` enum field: `PROPOSED | EFFECTIVE | WITHDRAWN` (default per policy at creation). Add `ratifiedAt DateTime?`.
- TODO: enum name (`CARatificationStatus`?); index on `(deliberationId, ratificationStatus)` for the enforcement filter.

**2.2 `ConflictRatification` ledger (new table).** `id`, `conflictApplicationId`, `ratifierId`, `createdAt`, `withdrawnAt DateTime?` (withdrawal is recorded, not deleted — D8 "deliberate, recorded act").
- TODO: unique `(conflictApplicationId, ratifierId)` (one live sign-off per ratifier); relation back to `ConflictApplication`.

**2.3 `DeliberationPref.attackRatificationPolicy` (D1).** String/enum: `none | single | quorum:N`. Defaulted at deliberation creation by `hostType` (`free`→`none`, else→`single`); overridable.
- TODO: encode `quorum:N` (separate `quorumN Int?` vs parse the string); where the default is applied (every `deliberation.create` site — see §3.1).

**2.4 Migration + backfill (CRITICAL — must ship together).** Backfill **every existing `ConflictApplication` to `EFFECTIVE`** so introducing the filter doesn't silently drop all current defeats from every deliberation's standing. `db push` per repo convention.
- TODO: write the backfill; verify count; dry-run on a copy.

## 3. Policy model

**3.1 Default seeding (D1).** At every deliberation-create site, set `attackRatificationPolicy` from `hostType`. `hostType` only *seeds*; never read at eval time.
- TODO: enumerate create sites (`app/api/arguments/quick*`, `deliberations/upsert`, `works`, `review`, `evidentialdev/seed-aif-debate`, `deepdive/upsert`); centralise the seeding helper.

**3.2 Threshold evaluation.** `none` → effective on create; `single` → 1 non-author sign-off; `quorum:N` → N distinct non-author sign-offs.

**3.3 Mutability + grandfathering (D7).** Policy editable mid-deliberation; tightening never demotes `EFFECTIVE` CAs; loosening may auto-promote `PROPOSED` CAs that now clear the lower bar.
- TODO: the auto-promote sweep on loosening; recompute trigger.

## 4. Enforcement (the one-line gate)

Filter conflicts to `ratificationStatus: 'EFFECTIVE'` at:
- [`lib/aspic/deliberationEvaluation.ts`](../lib/aspic/deliberationEvaluation.ts) `buildDeliberationGraph` (the `conflictApplication.findMany`).
- `GET /api/aspic/evaluate`'s conflict fetch.
- TODO: audit for any *other* path that reads `ConflictApplication` into a defeat computation; confirm the CEG/claim path (D5) is intentionally untouched.

## 5. API surface

**5.1 Sign-off** `POST /api/ca/[id]/ratify` — auth; **reject self-ratification** (author ≠ ratifier — mirror challengeCq's no-self-canonical floor); eligibility = any authenticated non-author (D4); on threshold met → flip `EFFECTIVE`, stamp `ratifiedAt`, recompute.
**5.2 Withdraw** `POST /api/ca/[id]/ratify` `DELETE` (or `/unratify`) — records `withdrawnAt`; if below threshold → demote `EFFECTIVE`→`PROPOSED`, recompute.
**5.3 Author retract** the CA → `WITHDRAWN` (terminal, fossilised).
- TODO: AI/MCP callers — sign-offs from `authorKind:"AI"` / `mcp-bot` must NOT count (D4); referential validation hygiene at `/api/ca` (D10, optional).

## 6. Recompute & transitions

Reuse `recomputeGroundedForDelib` pattern (fire-and-forget, out-of-band) on every status flip. Every transition is a deliberate recorded event (§3 of the session — preserves the no-thrash property).
- TODO: which grounded recompute (ASPIC vs CEG); debounce if many sign-offs land together.

## 7. UI / surfacing (D6)

**7.1 Provisional standing label.** Reuse the existing standing vocabulary — a `PROPOSED` CA's target reads **"contested · pending k/N"**, distinct from "defeated"; an un-ratified-but-uncontested `in` argument reads **provisional** (≈ `untested-default`) vs `tested-survived` (D2).
- TODO: thread `ratificationStatus` + sign-off counts into the standing read-model and the argument card / `PreferenceBadge`-adjacent surfaces.

**7.2 Notification.** Notify the target's author + active participants when a CA needs ratification and when it clears, via the existing notification pipeline.
- TODO: notification event types; optional per-deliberation pending-ratifications queue + facilitation-equity backlog (secondary).

## 8. Semantics (reference — see session §3)

Ratification preserves the grounded fixed point (filters subgraph + gates timing, not semantics); biases toward `in`; zero effect on the axiom/strict core; **the only lever over the always-defeating undercut / assumption-undermine modes preferences can't reach** (the load-bearing justification). No engine changes beyond the §4 filter.

## 9. Known limitations (record honestly)

- **Not sybil-resistant in v1** (D4): a determined actor can post-once / sockpuppet a `single` threshold. Reputation-weighting (deferred) is the real fix.
- `moderator`/`fraction`/`REJECTED`/privacy-defaults all **blocked on the deliberation-creation UX thread**.
- Ratification debt accepted (D11): a target can sit `out` while its reinstating attack is un-ratified — surfaced via the pending label, not hidden.

## 10. Test plan

- Unit: threshold logic (none/single/quorum); self-ratification rejected; AI sign-off ignored; withdrawal demotes; grandfathering on policy change.
- Integration: a `PROPOSED` CA does NOT affect grounded standing; ratifying it flips the target `out`; withdrawing reverts. (Extend the [`deliberation-evaluation.test.ts`](../__tests__/aspic/deliberation-evaluation.test.ts) harness — mocked prisma + real `computeAspicSemantics`.)
- Migration: backfill sets all existing CAs `EFFECTIVE`; standing unchanged pre/post deploy.

## 11. Rollout safety

Schema delta + backfill ship together (§2.4). Stage: migrate+backfill → deploy filter (no behaviour change, all `EFFECTIVE`) → enable default-seeding for new deliberations → ship sign-off API + UI. Each step independently reversible.

## 12. Open implementation questions

- TODO: enum/field names; `quorum:N` encoding.
- TODO: which recompute engine + debounce.
- TODO: notification event taxonomy.
- TODO: where the policy override is exposed pre-creation-UX (API-only for v1? thin settings affordance?).

## 13. Change log

_(none yet — skeleton)_
