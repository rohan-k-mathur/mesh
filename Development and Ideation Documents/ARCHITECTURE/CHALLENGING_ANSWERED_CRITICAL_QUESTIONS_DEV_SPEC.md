# Challenging Answered Critical Questions — Dev Spec (Rounds 1–4)

**Status:** dev spec — **Round 4 of N** (Round 1 = skeleton + schema delta; Round 2 =
the four behavioural decisions; Round 3 = concrete contracts: schema, helper,
route, middleware, MCP tool, read surface, tests; Round 4 = the human-facing
filing surface + the two residual policy calls — AI/human friction asymmetry and
depth/termination guardrails). Feature-complete spec; ready to build.
**Owner:** Isonomia argument-write surface / dialectical core
**Derived from:**
[CHALLENGING_ANSWERED_CRITICAL_QUESTIONS_IDEATION.md](CHALLENGING_ANSWERED_CRITICAL_QUESTIONS_IDEATION.md)
(ontology settled there; this spec operationalises it).

**Carried-over settled call (from ideation §4.2 / §7 Q5):**
> An answer — and a challenge to one — materialises as a **scheme-free Claim /
> concession by default**, *not* a full scheme-instance Argument. Promotion to a
> scheme-bearing argument is a deliberate, challenge-triggered escalation. This is
> what keeps the regress finite.

---

## 0. How to read this document

Round 1's job is to make three things precise:

1. **What substrate already exists** (so we build the minimum new surface).
2. **The exact schema delta** (additive, reversible).
3. **The state machine** for an answer's life from `SATISFIED` through `DISPUTED`
   and back.

Round 1 explicitly **defers**: final HTTP request/response shapes, the MCP tool
signature, UI component breakdown, rate-limit constants, and the
synchronous-vs-batch evaluation decision. Those are called out inline as
**`[ROUND 2]`** / **`[ROUND 3]`** so the next pass has a checklist.

---

## 1. Scope

### 1.1 In scope (the feature)

A user (or AI agent over MCP) who disagrees with an **answered** critical question
can **file a challenge**. A challenge:

- is authored as a **scheme-free Claim** (the objection text),
- is wired to the answer via a typed **attack edge** (REBUT / UNDERMINE /
  UNDERCUT),
- is recorded against the CQ via the existing **`CQAttack`** provenance row,
- and, when it succeeds under evaluation, flips the CQ
  `SATISFIED → DISPUTED` — *computed, not voted*.

### 1.2 Out of scope (Round 1, possibly never)

- Re-litigating *unanswered* CQs (those already have the answer/dialogue path).
- The full Ludics dialogue runtime (Stance C) — we borrow its *semantics*
  (burden, termination) but do not require a dialogue engine to ship this.
- Auto-promotion of a challenge-claim into a scheme-instance argument — that is
  the escalation hinge (§7), specified but gated behind an explicit user action.

---

## 2. Substrate that already exists (do NOT rebuild)

Grounded against `lib/models/schema.prisma` as of 2026-06-02.

| Need | Existing primitive | Notes |
|------|--------------------|-------|
| The CQ obligation holder | **`CQStatus`** (L4221) | keyed `(targetType, targetId, schemeKey, cqKey)`; has `statusEnum` incl. `DISPUTED`. |
| The answer record | **`CQResponse`** (L4271) | `groundsText`, `evidenceClaimIds[]`, `sourceUrls[]`, `responseStatus` incl. `CANONICAL`/`SUPERSEDED`. |
| CQ↔attack provenance | **`CQAttack`** (L4348) | links a `CQStatus` to **either** a `ConflictApplication` **or** a `ClaimEdge`. *This is the seam our challenge plugs into.* |
| Lightweight claim→claim attack | **`ClaimEdge`** (L3896) | `fromClaimId`→`toClaimId`, `type: ClaimEdgeType`, `attackType: ClaimAttackType` (REBUTS/UNDERMINES/UNDERCUTS), `targetScope`, `metaJson`. **No Argument required.** |
| Heavyweight claim attack | `ClaimAttack` (L8221) | requires a full `attackingArgument`. **Not** our default path — reserved for escalation (§7). |
| The objection text node | **`Claim`** (L3742) | already carries challenge counters (`challengeCount`, `openChallenges`, `defendedCount`, `concededCount`) + `consensusStatus`. |
| Audit trail | **`CQActivityLog`** (L4368) + `CQAction` enum | needs **one** new action value (§4.2). |

**Key consequence:** the decided ontology ("challenge = scheme-free claim attached
by an attack edge, linked to the CQ") is almost entirely expressible with
**`Claim` + `ClaimEdge` + `CQAttack`** — all three already exist. The schema delta
(§4) is therefore small.

---

## 3. Ontology → object mapping (the heart of Round 1)

How each conceptual object from the ideation doc lands on real tables:

| Ideation concept | Concrete object | Status |
|------------------|-----------------|--------|
| **Answer** (the thing being challenged) | `CQResponse` (canonical) **+ a derived "answer-claim"** materialising its `groundsText` as a `Claim` | answer-claim is **new** (§4.1) |
| **Challenge** (the objection) | a **`Claim`** (scheme-free) authored by the challenger | reuses `Claim` |
| **The attack relation** | a **`ClaimEdge`** from challenge-claim → answer-claim, `attackType ∈ {REBUTS, UNDERMINES, UNDERCUTS}` | reuses `ClaimEdge` |
| **CQ ↔ challenge provenance** | a **`CQAttack`** row with `claimEdgeId` set | reuses `CQAttack` |
| **"CQ is now contested"** | `CQStatus.statusEnum = DISPUTED` | reuses enum value |
| **Audit** | `CQActivityLog` rows | +1 new `CQAction` (§4.2) |

### 3.1 The three challenge types (map to attack edge `attackType`)

Straight from ASPIC+ (`lib/aspic/attacks.ts`), specialised to "attack on an answer":

- **REBUT** → "the CQ is **not** actually satisfied" (attacks the answer's
  *conclusion*, i.e. the satisfaction itself).
- **UNDERMINE** → "your cited **evidence** doesn't hold" (attacks an
  `evidenceClaimId` / `sourceUrl` the answer leans on).
- **UNDERCUT** → "valid point, **wrong CQ** / your grounds don't bear on *this*
  question" (attacks the *relevance/inference* from grounds to satisfaction).

`ClaimEdge.attackType` + `targetScope` already encode exactly this triple.

---

## 4. Schema delta (additive, reversible)

> All changes are additive. Apply with `npx prisma db push` (repo convention — not
> `migrate dev`). No column is dropped or retyped.

### 4.1 Answer-claim materialisation — link a `CQResponse` to its claim

A canonical answer needs a backing `Claim` so it can be the *target* of a
`ClaimEdge`. Add a nullable back-pointer on `CQResponse`:

```prisma
model CQResponse {
  // ...existing fields...
  // The scheme-free Claim that materialises this answer's groundsText so the
  // answer can be the TARGET of a challenge edge. Lazily created on first
  // challenge (or eagerly at canonicalisation — see §6.1). Nullable: most
  // answers never get materialised because they're never challenged.
  answerClaimId String?  @db.VarChar(30)
  answerClaim   Claim?   @relation("CQAnswerClaim", fields: [answerClaimId], references: [id], onDelete: SetNull)
}
```

…and the reciprocal back-relation on `Claim`:

```prisma
model Claim {
  // ...existing relations...
  cqAnswerFor CQResponse[] @relation("CQAnswerClaim")
}
```

**Materialisation policy (decided): lazy.** The answer-claim is created the first
time the answer is challenged, not at answer time. Rationale: most answers are
never contested (ideation §4.1 — regress is *potential*), so eager materialisation
would mint dead claim nodes. `[ROUND 2]` confirm lazy vs. eager once we see write
volume.

### 4.2 One new audit action

```prisma
enum CQAction {
  // ...existing...
  CHALLENGE_FILED   // a challenge-claim + attack edge was filed against an answer
}
```

(Reopen/resolve transitions reuse `STATUS_CHANGED`.)

### 4.3 What we are **NOT** adding (and why)

- **No new "Challenge" model.** A challenge *is* a `Claim` + `ClaimEdge` +
  `CQAttack`. Introducing a parallel table would fork the attack semantics we
  already evaluate in `lib/aspic/`.
- **No defeat/preference fields here.** `ConflictApplication.aspicDefeatStatus`
  already models "attack succeeded as defeat." If we route challenges through
  `ClaimEdge` we evaluate defeat in the semantics layer, not a new column.
  `[ROUND 2]` decide whether challenge defeat-status needs persistence or is
  recomputed.

---

## 5. State machine

### 5.1 CQ status transitions (only the new edges shown bold)

```
OPEN ──answer──▶ PENDING_REVIEW ──canonical──▶ SATISFIED
                                                  │
                                   **challenge filed & succeeds**
                                                  ▼
                                              DISPUTED
                                                  │
                          ┌───────────────────────┼───────────────────────┐
              **new canonical answer**   **challenge withdrawn**   **challenge defeated**
                          ▼                        ▼                       ▼
                      SATISFIED                SATISFIED               SATISFIED
```

- `SATISFIED → DISPUTED` is the **only** new *entry* transition. It fires when a
  challenge is filed **and** (per §6.2) clears its bar.
- All three exits return to `SATISFIED` — but via different actors/mechanisms
  (new canonical answer supersedes; challenger withdraws; challenge is itself
  defeated). `[ROUND 2]` decide whether "reopen the same CQStatus" vs. "branch a
  lineage" (ideation §7 Q2) changes any of these.

### 5.2 Answer-claim / challenge-claim lifecycle

- Challenge-claim: an ordinary `Claim`; participates in `consensusStatus`
  machinery already on `Claim`.
- Answer-claim: created lazily (§4.1); on supersession of the underlying
  `CQResponse`, the answer-claim is **retained** (history), edge stays for audit.

---

## 6. Open behavioural decisions surfaced for Round 2

These are the ideation §7 questions, now sharpened against the substrate. Each
needs a decision before Round 2 can write API contracts.

1. **`[ROUND 2]` Does filing a challenge flip to `DISPUTED` immediately, or only
   after the challenge clears a bar?** (ideation Q1 — burden placement.) Substrate
   hook: `BurdenOfProof` per CQ + `ConflictApplication.aspicDefeatStatus`.
2. **`[ROUND 2]` Reopen vs. branch** on a successful challenge (ideation Q2).
   Substrate hook: `CQResponse` supersession chain (lineage already exists).
3. **`[ROUND 2]` Granularity:** one "Challenge" affordance that infers attack type,
   or three explicit affordances (ideation Q3). Maps to `ClaimEdge.attackType`.
4. **`[ROUND 3]` AI vs. human symmetry** (ideation Q4). `CQResponse.contributorId`
   + provenance already distinguishes self-canonicalised AI answers.
5. **`[ROUND 2]` Escalation trigger:** the exact user action that promotes a
   challenge-claim from scheme-free `ClaimEdge` to a full `ClaimAttack`
   (attacking *Argument*) — i.e. "demand structured grounds" (ideation Q5 residue).
6. **`[ROUND 3]` Evaluation cadence:** synchronous defeat check on edge-create vs.
   periodic ASPIC+ recompute (ideation Q6; touches
   [ARGUMENTATION_SEMANTICS_CONSOLIDATION_ROADMAP.md](ARGUMENTATION_SEMANTICS_CONSOLIDATION_ROADMAP.md)).
7. **`[ROUND 3]` Product termination guardrails** (ideation Q7): depth indicators,
   collapse-deep-branches.

---

## 7. Provisional surface inventory (to be filled in Round 2/3)

Listed now only so the shape of the work is visible.

- **`[ROUND 2]` HTTP:** `POST /api/cqs/challenge` — body `{ cqStatusId,
  attackType, groundsText, evidenceClaimIds?, sourceUrls?, requestId? }`; creates
  challenge-claim + (lazy) answer-claim + `ClaimEdge` + `CQAttack` + activity log
  in one transaction; idempotent on `requestId`. Mirrors `/api/cqs/answer`.
- **`[ROUND 2]` MCP tool:** `challenge_critical_question` — sibling of
  `answer_critical_question`; same session-identity discipline; **no**
  self-canonical floor (challenging is not self-discharging). Tool #55.
- **`[ROUND 3]` Read surface:** extend the attestation / `get_argument` CQ
  aggregate so each answered CQ can also expose `challenges[]` (count + status),
  and the public argument page renders a "Challenged" state on the
  `AnsweredCriticalQuestions` card.
- **`[ROUND 3]` UI:** challenge affordance on each answered-CQ card; "Disputed"
  badge; challenge thread.

---

## 8. Phased build outline (provisional — firmed in later rounds)

- **P1 — schema + write core.** §4 delta; transactional challenge-create helper
  (`lib/cqs/challengeCq.ts`); `POST /api/cqs/challenge`; unit tests. No UI.
- **P2 — status semantics.** `SATISFIED → DISPUTED` flip per the Round-2 burden
  decision; exits back to `SATISFIED`; activity logging.
- **P3 — read surfaces.** Attestation + `get_argument` expose challenge state.
- **P4 — MCP tool.** `challenge_critical_question` + orientation bump.
- **P5 — public UI.** Challenge affordance + disputed state on the argument page.
- **P6 — escalation.** The scheme-free→scheme-instance promotion path (§6.5).

---

## 9. Round-1 exit checklist

- [x] Substrate inventory complete (§2) — challenge path is `Claim`+`ClaimEdge`+`CQAttack`.
- [x] Ontology→object mapping fixed (§3).
- [x] Minimal additive schema delta drafted (§4): `CQResponse.answerClaimId` +
      `CQAction.CHALLENGE_FILED`.
- [x] State machine sketched (§5).
- [x] Round-2/3 decision queue enumerated (§6) and tied to substrate hooks.
- [x] **Round 2 complete (§10):** burden placement, reopen-vs-branch, granularity,
      and escalation trigger all decided + grounded against real substrate.
- [ ] **Round 3 entry:** write the `/api/cqs/challenge` + `lib/cqs/challengeCq.ts`
      contracts on top of §10, then the MCP tool + UI.

> **Next round focus:** burden placement (§6.1) and reopen-vs-branch (§6.2) — these
> two decisions gate every API contract, so they come first in Round 2.

---

## 10. Round 2 — Behavioural decisions (grounded)

Round 2 resolves §6.1–§6.3 and §6.5. Two substrate facts discovered during
grounding **drive** these decisions and must be stated up front:

- **FACT A — defeat evaluation is batch, not synchronous.** Defeat is computed by
  `recomputeGroundedForDelib(deliberationId)` in [lib/ceg/grounded.ts](../../lib/ceg/grounded.ts)
  (grounded labels over claim edges). The preference-aware `checkDefeatStatus()` in
  [lib/aspic/conflictHelpers.ts](../../lib/aspic/conflictHelpers.ts) is a **stub,
  not wired into production.** ⇒ We cannot block a status flip on a real-time
  "the challenge defeats the answer" verdict. Any design that *requires* synchronous
  defeat is non-shippable today.
- **FACT B — the write is mostly composition.** A unified attack API already
  exists: `createClaimEdgeAttack()` → `createClaimAttack()` (ClaimEdge upsert with
  `metaJson:{cqKey,schemeKey,source}`) → `linkToCQStatus()` (CQStatus upsert +
  `CQAttack.create`), in [app/api/attacks/create/route.ts](../../app/api/attacks/create/route.ts)
  and [lib/argumentation/createClaimAttack.ts](../../lib/argumentation/createClaimAttack.ts).
  The challenge helper **composes** these rather than re-implementing edge/attack
  creation.
- **FACT C — burden is per-CQ and already modelled.** `CriticalQuestion.burdenOfProof`
  (`PROPONENT | CHALLENGER | OPPONENT`, OPPONENT→CHALLENGER) + `requiresEvidence`
  ([lib/models/schema.prisma](../../lib/models/schema.prisma) `model CriticalQuestion`).
  Resolved scheme→`cqs`→`cqKey` exactly as `answerOverMcp.ts` already does.

### 10.1 Decision §6.1 — Burden placement: **"contest marks, evaluation confirms"**

**Decided:** a well-formed challenge flips `SATISFIED → DISPUTED` **immediately on
filing.** It does *not* wait for a defeat verdict. The flip is gated only by an
**admissibility bar**, not a defeat bar.

Rationale, grounded in the product thesis ("challenges cannot be silently ignored;
an unanswered challenge is itself a recorded datum") and `CQStatusEnum.DISPUTED`'s
own definition ("Conflicting responses **or new challenges**"):

- DISPUTED means *"a structural contester is on file,"* not *"the answer lost."*
  That is **computed, not voted** in the honest sense — the presence of a typed
  attack edge is a structural fact, not a popularity tally. (This supersedes the
  Round-1 phrasing "challenge filed **& succeeds**" in §5.1: success is *not* the
  gate; admissibility is.)
- FACT A makes this the *only* shippable option: we cannot compute "succeeds"
  synchronously, so blocking the flip on it would mean challenges never register.

**The admissibility bar (burden-aware), evaluated synchronously at file-time:**

1. `groundsText` present, length 10..5000 (mirrors the answer route).
2. Evidence (≥1 of `evidenceClaimIds` / `sourceUrls`) is **required** when ANY of:
   - `attackType === UNDERMINE` (you're contesting evidence — bring some), OR
   - the CQ's `requiresEvidence === true`, OR
   - the CQ's `burdenOfProof` normalises to `CHALLENGER` (the challenger carries
     the evidential burden for this CQ, so a bare assertion is inadmissible).
   Otherwise evidence is optional (e.g. a PROPONENT-burden REBUT/UNDERCUT may be a
   pure reasoning objection).
3. Reuse the existing evidence-claim existence check from the answer path.

A challenge that fails the bar is rejected `422` with a typed warning
(`CQ_CHALLENGE_NEEDS_EVIDENCE` / `CQ_CHALLENGE_GROUNDS_TOO_SHORT`) and **does not**
flip status.

**Burden also fixes *who owns the exit* from DISPUTED** (consumed in §10.2):

| CQ `burdenOfProof` | After DISPUTED, who must move to return to SATISFIED |
|--------------------|------------------------------------------------------|
| `PROPONENT` (default) | the **answer author / proponent** — post a new canonical answer or a defense. If they don't, it *stays* DISPUTED (the obligation is visibly open). |
| `CHALLENGER` / `OPPONENT` | the **challenger** already discharged their evidential burden at file-time (bar rule 2); the proponent *may* rebut, but silence does **not** auto-resolve. |

The **defeat verdict** from batch `recomputeGroundedForDelib` is surfaced as an
*evaluation overlay* on the disputed CQ (answer-claim `IN`/`OUT`), informing — but
not gating — resolution. `[ROUND 3]` decides whether an `OUT` answer-claim auto-
proposes reopening or just badges it.

### 10.2 Decision §6.2 — Reopen vs. branch: **reopen the singleton; lineage via existing chains**

**Decided: reopen the same `CQStatus`.** Not a branch.

This is **forced by the substrate, not merely preferred:** `CQStatus` has
`@@unique([targetType, targetId, schemeKey, cqKey])` — there is structurally **one**
obligation row per (target, scheme, CQ). You cannot fork it without inventing a new
key. So:

- The contested CQ **reopens in place**: `statusEnum SATISFIED → DISPUTED`. The
  current canonical `CQResponse` **stays `CANONICAL`** (it is still the standing
  answer, now flagged contested) until a *new* answer supersedes it via the
  **existing supersession chain** (`responseStatus CANONICAL → SUPERSEDED`).
- **History is preserved without branching** because two chains already exist:
  (a) the `CQResponse` supersession chain = the *answer* history; (b) accreting
  `CQAttack` rows on the same `CQStatus` = the *challenge* history. Together they
  form one auditable obligation thread.
- **Branching is not lost — it relocates to escalation (§10.4).** When a challenge
  escalates into a full scheme-instance argument, *that argument* gets its own
  `CQStatus` rows keyed by its own `argumentId`. New obligation nodes appear there,
  naturally, instead of by forking this CQStatus.

**Exit transitions (replacing the Round-1 §5.1 sketch):**

```
SATISFIED ──admissible challenge filed──▶ DISPUTED
DISPUTED  ──new canonical answer (supersedes prior)──▶ SATISFIED
DISPUTED  ──all challenges withdrawn/resolved──▶ SATISFIED
DISPUTED  ──challenge-claim itself defeated (batch eval: challenge-claim OUT)──▶ SATISFIED
```

All three exits return to `SATISFIED` on the **same** CQStatus row; none mint a new
one. `STATUS_CHANGED` logs each transition; `CHALLENGE_FILED` logs the entry.

### 10.3 Decision §6.3 — Granularity: **one affordance, explicit type, server-validated**

**Decided:** a single "Challenge" affordance that **requires the user to pick the
attack type** (REBUT / UNDERMINE / UNDERCUT) via a labelled selector — *not* a
type-inferring single button, and *not* three separate top-level buttons.

- One entry point keeps the UI calm (one button on each answered-CQ card) while the
  **type is explicit in the payload** (`attackType` is required, not inferred),
  because the admissibility bar (§10.1 rule 2) is *type-dependent* — inferring the
  type server-side would make the evidence requirement unpredictable to the user.
- The selector uses the §3.1 plain-language framing, not jargon:
  - REBUT → *"This CQ isn't actually satisfied"*
  - UNDERMINE → *"The evidence cited doesn't hold"* (⇒ evidence required)
  - UNDERCUT → *"Valid point, but it doesn't address this question"*
- Maps 1:1 to `ClaimEdge.attackType` + `targetScope` (`conclusion`/`premise`/`inference`).

### 10.4 Decision §6.5 — Escalation trigger: **explicit "demand structured grounds," never automatic**

**Decided:** a challenge stays a **scheme-free `Claim` + `ClaimEdge`** unless a
participant takes an explicit, separate action to escalate it into a full
scheme-instance argument (a `ClaimAttack` backed by an attacking `Argument`).

- **Default path (cheap, finite):** every challenge is the lightweight
  claim+edge+CQAttack from §3. This is what keeps the regress finite (ideation
  §4.2) — a scheme-free challenge-claim carries **no CQs of its own**, so it is a
  valid terminal node.
- **Escalation (deliberate, rare):** the proponent (or the challenger) may invoke
  *"demand structured grounds"* — operationalised as a distinct action that:
  1. promotes the challenge-claim into / attaches a scheme-instance `Argument`
     (concluding the challenge-claim), filed as a `ClaimAttack`
     ([schema.prisma](../../lib/models/schema.prisma) `model ClaimAttack`, which
     *requires* an `attackingArgument`), and
  2. **only now** does the challenge acquire its own scheme + CQ catalogue
     (one level deeper), reproducing the answer↔challenge pattern recursively
     **by explicit human/agent choice**, never automatically.
- **Who may escalate & burden:** escalation is the formal way to discharge a
  PROPONENT-burden "why?" — the proponent demands the challenger structure their
  objection; or the challenger volunteers structure to strengthen it. `[ROUND 3]`
  fixes the exact actor permissions + whether escalation is a new MCP verb or a
  flag on the challenge call.

**Net:** automatic depth is impossible (§4 finite-regress guarantee preserved);
depth only ever appears when someone *pays for it* with an explicit escalation
action — which is exactly the "scrutiny proportional to contestation" property.

### 10.5 Consequences for the build plan (refines §7–§8)

- `lib/cqs/challengeCq.ts` **composes** `createClaimEdgeAttack` /
  `createClaimAttack` / `linkToCQStatus` (FACT B) inside one transaction, adding:
  lazy answer-claim materialisation (§4.1), the §10.1 admissibility bar, the
  `SATISFIED → DISPUTED` flip (§10.2), and `CHALLENGE_FILED` logging. It does **not**
  re-implement edge/attack writes.
- `POST /api/cqs/challenge` mirrors `/api/cqs/answer` auth + `rl:cq_challenge`
  rate-limit + public-API allowlist; request body now **requires** `attackType`
  and conditionally requires evidence per §10.1.
- No dependency on synchronous defeat (FACT A): the disputed state is honest about
  being *"contested, evaluation pending,"* and batch grounded recompute feeds the
  overlay asynchronously.

### 10.6 Still deferred to Round 3

- §6.4 AI-vs-human challenge symmetry (lower friction to challenge a
  self-canonicalised AI answer?).
- §6.6 evaluation cadence (when/how often to run `recomputeGroundedForDelib` after
  a challenge; debounce per deliberation).
- §6.7 product termination guardrails (depth indicators, collapse-deep-branches).
- Final HTTP/MCP/UI contracts (now unblocked by §10.1–§10.4).

---

## 11. Round 3 — Concrete contracts (implementation-ready)

Round 3 turns §10 into exact file-level contracts. **One grounding correction**
discovered while reading the helpers:

> **CORRECTION to §10.5's "composes the helpers" wording.** The reusable helpers
> `createClaimAttack` ([lib/argumentation/createClaimAttack.ts](../../lib/argumentation/createClaimAttack.ts))
> and `linkToCQStatus` ([app/api/attacks/create/route.ts](../../app/api/attacks/create/route.ts))
> both write through the **global `prisma` client, not a transaction handle**, and
> `createClaimAttack`'s `Suggestion` union only covers `undercut`/`rebut` — it has
> **no `undermine` case** (UNDERMINE needs `attackType:"UNDERMINES",
> targetScope:"premise"`). To keep the challenge write atomic *and* support all
> three attack types, `challengeCq.ts` **inlines the equivalent `tx`-scoped writes**
> and reuses only the *suggestion→edge mapping*. We do **not** call the global-client
> helpers from inside our transaction.

### 11.1 Schema delta (final form — confirms §4)

Two additive changes, applied with `npx prisma db push`:

```prisma
model CQResponse {
  // ...existing fields...
  answerClaimId String?
  answerClaim   Claim?  @relation("CQAnswerClaim", fields: [answerClaimId], references: [id], onDelete: SetNull)
  @@index([answerClaimId])
}

model Claim {
  // ...existing relations...
  cqAnswerFor CQResponse[] @relation("CQAnswerClaim")
}

enum CQAction {
  // ...existing...
  CHALLENGE_FILED
}
```

> `answerClaimId` is a plain cuid FK (the Round-1 `@db.VarChar(30)` annotation is
> dropped — `Claim.id` is a default cuid `String`, so the column type must match
> `Claim.id` exactly; no length cap).

### 11.2 `lib/cqs/challengeCq.ts` — the core helper

Mirrors the shape of `answerOverMcp.ts` (auth-agnostic; caller passes resolved
`userId`). Single export `challengeCriticalQuestion(input)`.

**Types:**

```ts
export type ChallengeCQErrorCode =
  | "CQ_ARGUMENT_NOT_FOUND"
  | "CQ_NOT_FOUND"            // no such CQ on the argument's schemes
  | "CQ_AMBIGUOUS_SCHEME"     // cqKey on >1 scheme, no schemeKey given
  | "CQ_NOT_ANSWERED"         // CQStatus missing / not SATISFIED / no canonical response
  | "CQ_CHALLENGE_NEEDS_EVIDENCE"
  | "CQ_EVIDENCE_NOT_FOUND"
  | "CQ_DUPLICATE_CHALLENGE"; // same contributor already has an open challenge edge on this answer

export type ChallengeAttackKind = "REBUT" | "UNDERMINE" | "UNDERCUT";

export interface ChallengeCQInput {
  userId: string;            // resolved caller id (MCP → "mcp-bot")
  argumentId: string;
  cqKey: string;
  schemeKey?: string;        // disambiguates inherited CQs
  attackType: ChallengeAttackKind;   // REQUIRED (§10.3 — never inferred)
  groundsText: string;       // 10..5000, zod-enforced at route
  evidenceClaimIds?: string[];
  sourceUrls?: string[];
  requestId?: string;        // idempotency (mirrors answer path)
}

export type ChallengeCQResult =
  | { ok: false; status: number; code: ChallengeCQErrorCode; error: string }
  | {
      ok: true;
      status: number;
      cqStatusId: string;
      challengeClaimId: string;   // the new scheme-free objection claim
      answerClaimId: string;      // lazily materialised (§4.1) target
      claimEdgeId: string;        // the typed attack edge
      cqAttackId: string;         // CQ↔attack provenance row
      cqStatusEnum: string;       // "DISPUTED" on success
      attackType: ChallengeAttackKind;
      permalink: string | null;
      idempotentReplay?: true;
    };
```

**`attackType` → ClaimEdge mapping (covers all three; fills the helper's gap):**

| `attackType` | `ClaimEdge.type` | `ClaimEdge.attackType` | `targetScope` |
|--------------|------------------|------------------------|---------------|
| REBUT | `rebuts` | `REBUTS` | `conclusion` |
| UNDERMINE | `rebuts` | `UNDERMINES` | `premise` |
| UNDERCUT | `rebuts` | `UNDERCUTS` | `inference` |

(`ClaimEdgeType` has no dedicated attack member beyond `rebuts`; the attack
semantics live on `attackType` + `targetScope`, matching existing rows.)

**Algorithm (steps 1–6 are pure validation; 7 is the single transaction):**

1. **Load argument** + `argumentSchemes.scheme.{key,cqs.{cqKey},...}` *plus* per-CQ
   `burdenOfProof` + `requiresEvidence`. (Extends the `answerOverMcp` select with
   the two burden fields — see §11.2.1.) `404 CQ_ARGUMENT_NOT_FOUND` if missing.
2. **Resolve `(schemeKey, cqKey)`** with the *exact* logic from `answerOverMcp`
   (lowercase match; single-match auto-resolve; `CQ_AMBIGUOUS_SCHEME` on >1).
3. **Load the CQStatus** on `@@unique([targetType,targetId,schemeKey,cqKey])` with
   `canonicalResponse {id, groundsText, answerClaimId}`. Require
   `statusEnum === "SATISFIED"` **and** a non-null `canonicalResponseId` →
   else `409 CQ_NOT_ANSWERED` ("you can only challenge an answered CQ").
4. **Admissibility bar (§10.1).** Compute via the *existing* shipped guard
   `requiresEvidenceFromActor(cq, /*isProponent*/ false)` from
   [lib/dialogue/burdenGuards.ts](../../lib/dialogue/burdenGuards.ts) (the
   challenger is **never** the proponent → `isProponent = false`; the guard folds
   in the `OPPONENT → CHALLENGER` normalisation and the `requiresEvidence` master
   switch). Then:
   `evidenceRequired = attackType === "UNDERMINE" || requiresEvidenceFromActor(cq, false)`.
   UNDERMINE *always* needs evidence (you are attacking the cited evidence itself).
   If required and `evidenceClaimIds.length + sourceUrls.length === 0` →
   `422 CQ_CHALLENGE_NEEDS_EVIDENCE`. (`groundsText` length is enforced by the
   route zod schema, so no separate code is needed here.)
5. **Verify evidence claims exist** (reuse the answer path's `findMany` count
   check) → `400 CQ_EVIDENCE_NOT_FOUND`.
6. **Idempotency / duplicate guard.**
   - If `requestId` present and a prior `CQAttack` carries it (via the edge's
     `metaJson.requestId`), **replay** that result (`idempotentReplay: true`).
   - Else, **duplicate guard**: reject `409 CQ_DUPLICATE_CHALLENGE` if this
     `userId` already authored an *open* challenge edge against this answer-claim
     (a `ClaimEdge` whose `from` claim was created by this user and whose
     `metaJson.cqStatusId` matches and is not withdrawn). Keeps one live objection
     per challenger per answer (mirrors the answer path's duplicate-pending guard).
7. **Transaction (`prisma.$transaction`)** — all writes via `tx`:
   1. **Lazy answer-claim (§4.1).** If `canonicalResponse.answerClaimId` is null:
      create a scheme-free `Claim` (`text = canonicalResponse.groundsText`
      truncated/normalised, `deliberationId = argument.deliberationId`,
      `createdById = canonical response's contributorId` so authorship stays with
      the answerer), then set `CQResponse.answerClaimId`. Else reuse it.
   2. **Challenge-claim.** Create a scheme-free `Claim` (`text = groundsText`,
      `deliberationId`, `createdById = userId`). This is the objection node; it
      carries **no scheme**, hence **no CQs** (the §4.2 finite-regress guarantee).
   3. **Attack edge.** `tx.claimEdge.upsert` on
      `unique_from_to_type_attack`, fields per the mapping table above,
      `metaJson = { cqKey, schemeKey, cqStatusId, source: "cq-challenge",
      requestId }`.
   4. **CQ↔attack provenance.** `tx.cQAttack.create({ cqStatusId,
      claimEdgeId: edge.id, conflictApplicationId: null, createdById: userId })`.
   5. **Status flip (§10.1/§10.2).** If `cqStatus.statusEnum === "SATISFIED"`:
      `update statusEnum → "DISPUTED"` (canonical response **stays CANONICAL** —
      §10.2). Idempotent if already DISPUTED.
   6. **Audit.** `tx.cQActivityLog.create({ action: "CHALLENGE_FILED", actorId:
      userId, metadata: { attackType, claimEdgeId, challengeClaimId,
      evidenceCount, sourceCount } })`.
8. **Permalink** via the same `getPermalinkSafe(argumentId)` and return the result.

> **No synchronous defeat call (FACT A).** The helper never invokes ASPIC+/grounded
> evaluation. `recomputeGroundedForDelib(argument.deliberationId)` is triggered
> *out of band* (§11.6) and feeds the overlay, never the flip.

#### 11.2.1 Burden lookup — extend the scheme select

`answerOverMcp` selects only `cqs: { select: { cqKey: true } }`. The challenge path
needs the burden fields for the §10.1 bar, so its argument load uses:

```ts
cqs: { select: { cqKey: true, burdenOfProof: true, requiresEvidence: true } }
```

The bar is evaluated with `requiresEvidenceFromActor(cq, false)` (§11.2 step 4) —
do **not** re-implement the `OPPONENT → CHALLENGER` normalisation; it lives inside
that guard.

> **Semantics note.** This intentionally tightens §10.1's first-draft wording. The
> earlier draft used an OR that demanded evidence whenever burden was CHALLENGER
> *even if* `requiresEvidence` was false. That diverges from the rest of the
> dialogue layer, where `requiresEvidence` is the master switch. Aligning to
> `requiresEvidenceFromActor` keeps one consistent evidence rule across the codebase;
> UNDERMINE is the only challenge-specific addition (it always needs evidence).

### 11.3 `POST /api/cqs/challenge` — the route

A near-clone of [app/api/cqs/answer/route.ts](../../app/api/cqs/answer/route.ts):

- `export const dynamic = "force-dynamic";`
- Auth: `resolveCitationCallerUserId(req)` → `401` if null.
- Rate limit: **new** Upstash fixed-window `Ratelimit`, prefix `"rl:cq_challenge"`,
  **20/h** (challenges are heavier-touch than answers; lower budget). `429` on
  exceed.
- Body zod:

```ts
const ChallengeCQSchema = z.object({
  argumentId: z.string().min(1),
  cqKey: z.string().min(1),
  schemeKey: z.string().min(1).optional(),
  attackType: z.enum(["REBUT", "UNDERMINE", "UNDERCUT"]),   // REQUIRED
  groundsText: z.string().min(10).max(5000),
  evidenceClaimIds: z.array(z.string()).optional().default([]),
  sourceUrls: z.array(z.string().url()).optional().default([]),
  requestId: z.string().min(1).max(200).optional(),
});
```

- Calls `challengeCriticalQuestion({ userId, ...parsed.data })`.
- Success response (`200`, or `201` on first create — use `result.status`):

```jsonc
{
  "ok": true,
  "cqStatusId": "…",
  "challengeClaimId": "…",
  "answerClaimId": "…",
  "claimEdgeId": "…",
  "cqAttackId": "…",
  "cqStatusEnum": "DISPUTED",
  "attackType": "UNDERMINE",
  "permalink": "https://isonomia.app/a/…",
  "idempotentReplay": true   // only on replay
}
```

- Error response mirrors the answer route: `{ ok:false, error, code }` at
  `result.status`.

### 11.4 `middleware.ts` — public-API allowlist

Add directly beneath the existing `cqs/answer` entry:

```ts
// CQ-challenge write seam for the MCP `challenge_critical_question` tool
// (route enforces bearer / session; status flip is server-gated).
/^\/api\/cqs\/challenge\/?$/,
```

### 11.5 MCP tool — `challenge_critical_question` (tool #55)

In [packages/isonomia-mcp/src/server.ts](../../packages/isonomia-mcp/src/server.ts),
sibling of `answer_critical_question`. **No self-canonical floor** (challenging is
not self-discharging — you are contesting, not answering).

- **Input (zod → `zodToJsonSchema`):** `argumentId`, `cqKey`, `schemeKey?`,
  `attackType` (enum `REBUT|UNDERMINE|UNDERCUT`), `groundsText` (10..5000),
  `evidenceClaimIds?`, `sourceUrls?`, `sessionId?` (carried for parity/telemetry
  even though there's no self-canonical use), `requestId?`.
- **Handler:** `isoFetch("/api/cqs/challenge", { method: "POST", body })`; surface
  `cqStatusEnum`, `attackType`, the four ids, and `permalink` back to the agent.
- **Description copy** must state the §10.1 rule plainly: *"Filing an admissible
  challenge marks the critical question DISPUTED immediately; it does not by itself
  defeat the answer. UNDERMINE (and any challenger-burden CQ) requires at least one
  piece of evidence."*
- **Counts to bump** (per the MCP build conventions in repo memory):
  - `grep -cE '^    name: "' src/server.ts` → **55**.
  - Orientation: `ORIENTATION_VERSION` bump (next after 1.17.0), Cluster 3 tool
    count 5→6, add a Recipe (E.5 "contest an answered CQ"), and a
    `SERVER_INSTRUCTIONS` line. Rebuild `dist`.

### 11.6 Read surface + UI

- **`[evaluation cadence — §6.6 decided here]`** After a successful challenge, fire
  a **best-effort, non-blocking** `recomputeGroundedForDelib(argument.deliberationId)`
  (same call the claim-edges route already makes) so the answer-claim/challenge-claim
  get grounded labels. Do it *after* the transaction commits, fire-and-forget
  (`void recompute().catch(() => {})`); never block the response on it. Debounce is
  unnecessary at current volume — revisit if challenge rate climbs.
- **Attestation / `get_argument`:** extend the answered-CQ aggregate so each item
  can carry `challenged: boolean` + `challengeCount: number` + `cqStatusEnum`. The
  attestation already exposes `cqStatusId`; add a single grouped count query over
  `CQAttack` by `cqStatusId`. (Detailed shape: a follow-on; this round fixes the
  fields.)
- **Public page UI:** extend
  [components/citation/AnsweredCriticalQuestions.tsx](../../components/citation/AnsweredCriticalQuestions.tsx):
  when `cqStatusEnum === "DISPUTED"`, render an amber **"Disputed"** badge on the
  card header (alongside the emerald "Answered" treatment) and a muted
  *"N challenge(s) on file"* line. The challenge-filing affordance itself
  (authenticated) is a separate interactive client component — `[ROUND 4]` (the
  public page is a server component; filing needs a client island + auth).

### 11.7 Tests — `__tests__/api/cq-challenge.test.ts`

Mirror `__tests__/api/cq-answer.test.ts` (9-case pattern). Minimum cases:

1. Happy REBUT on a SATISFIED CQ → `DISPUTED`, edge+CQAttack+challenge-claim+lazy
   answer-claim created, `CHALLENGE_FILED` logged.
2. UNDERMINE with **no** evidence → `422 CQ_CHALLENGE_NEEDS_EVIDENCE`; no status
   change, no rows written.
3. UNDERMINE **with** evidence → success.
4. Challenger-burden CQ **with `requiresEvidence:true`** + bare REBUT (no evidence)
   → `422` (the burden-driven evidence rule fires via `requiresEvidenceFromActor`).
   Companion: same CQ with `requiresEvidence:false` + bare REBUT → **success** (the
   master switch is off; confirms the aligned AND semantics, §11.2.1).
5. Challenge on an **unanswered** CQ (OPEN/PENDING_REVIEW) → `409 CQ_NOT_ANSWERED`.
6. Unknown argument → `404 CQ_ARGUMENT_NOT_FOUND`.
7. Ambiguous cqKey across schemes, no `schemeKey` → `400 CQ_AMBIGUOUS_SCHEME`.
8. Idempotent replay (same `requestId`) → second call returns
   `idempotentReplay:true`, no duplicate edge.
9. Duplicate live challenge by same user → `409 CQ_DUPLICATE_CHALLENGE`.
10. Lazy answer-claim reuse: a second (different-user) challenge reuses the
    existing `answerClaimId` rather than minting a second answer-claim.

### 11.8 Build / apply order (P1–P5 from §8, now concrete)

1. Schema delta (§11.1) → `npx prisma db push` → `prisma generate`.
2. `lib/cqs/challengeCq.ts` (§11.2) + unit-level test of the helper.
3. `POST /api/cqs/challenge` (§11.3) + `middleware.ts` allowlist (§11.4).
4. `__tests__/api/cq-challenge.test.ts` (§11.7) → `npx jest`.
5. MCP tool (§11.5) → `cd packages/isonomia-mcp && npm run build`; verify tool
   count 55 + orientation bump.
6. Read surface + `AnsweredCriticalQuestions` disputed badge (§11.6).

### 11.9 Round 3 exit checklist

- [x] Final schema delta (§11.1) — corrects the Round-1 column-type annotation.
- [x] Helper contract `challengeCq.ts` (§11.2) incl. the §10.1 admissibility bar,
      lazy materialisation, all-three attackType mapping, and the
      non-transactional-helper correction.
- [x] Route + zod + rate-limit + middleware (§11.3–§11.4).
- [x] MCP tool #55 contract + count/orientation bumps (§11.5).
- [x] Read surface fields + disputed badge; §6.6 cadence decided (§11.6).
- [x] Test matrix (§11.7).
- [ ] **Build entry:** execute §11.8 in order.

> **Deferred to Round 4:** the authenticated *client-side* challenge-filing island
> on the public page; §6.4 AI-vs-human friction asymmetry; §6.7 depth guardrails.

---

## 12. Round 4 — Human filing surface + residual policy

Round 4 closes the three Round-3 deferrals. The **API surface is already complete**
(§11) — Round 4 adds the *human* entry point and the last two product decisions.
One grounding fact drives the whole client design:

> **GROUNDING — the challenge route already authenticates browser humans.**
> `resolveCitationCallerUserId(req)` ([lib/citation/mcpAuth.ts](../../lib/citation/mcpAuth.ts))
> is **bearer-first with a cookie fallback to `getCurrentUserId()`**
> ([lib/serverutils.ts](../../lib/serverutils.ts)). So a signed-in human posting
> from the browser (same-origin cookie) hits the *same* `POST /api/cqs/challenge`
> with **no new auth surface**. Round 4 therefore needs **no server changes** — only
> a client island that POSTs with `credentials: "include"`.

### 12.1 Decision §6.4 — AI vs. human challenge friction: **symmetric admission, asymmetric prompting**

**Decided:** the *admissibility bar is identical* for AI and human challengers (the
structural rule in §10.1/§11.2 step 4 does not branch on `authorKind`). What
differs is **surfacing**, not gating:

- **Why symmetric admission.** The bar is about *evidential structure*
  (`requiresEvidenceFromActor` + UNDERMINE), which is a property of the **CQ and the
  attack type**, not of who is filing. Making AI-authored answers *easier* to
  challenge would encode a trust asymmetry into the substrate that the batch
  evaluator (`recomputeGroundedForDelib`) does not honour — the grounded labelling
  treats every edge identically. A two-tier bar would desync the UI affordance from
  the actual defeat semantics. So **the rule stays single-tier.**
- **Where the asymmetry lives (prompting + provenance).** The answer being
  challenged carries `authorKind` + `aiProvenance` (read exactly as
  `isSelfCanonicalEligible` does in [lib/cqs/answerOverMcp.ts](../../lib/cqs/answerOverMcp.ts)).
  When the canonical answer was **self-canonicalised by an AI** (`authorKind ∈
  {AI,HYBRID}` AND `aiProvenance.via` starts `mcp`), the card shows a muted
  *"answered by an AI agent"* provenance line and the challenge affordance copy
  nudges harder: *"This answer was self-asserted by an AI and has not yet been
  independently contested — your challenge is especially valuable."* Human-answered
  CQs get the neutral copy. **No payload or status difference** — purely an
  encouragement/disclosure layer.
- **Read-surface need:** the answered-CQ aggregate (§11.6) must additionally expose
  `answerAuthorKind: "AI"|"HUMAN"|"HYBRID"` and `answerSelfCanonical: boolean`
  (derived with the same predicate as `isSelfCanonicalEligible`, minus the
  session-match clause — here we only care *that* it was AI-self-asserted, not
  whether the current caller's session matches). One extra select on the canonical
  `CQResponse.contributor`/`argument.authorKind`; no new query.

### 12.2 Decision §6.7 — Termination guardrails: **depth is bounded by escalation, surfaced by a ledger**

**Decided:** there is **no unbounded recursion to guard against at the default
layer**, so the guardrail is a *disclosure* mechanism, not a hard cap on challenges.
Grounded reasoning:

- **The finite-regress guarantee already caps depth structurally (§4.2/§10.4).** A
  default challenge is a **scheme-free `Claim`** which carries **no CQs**, so it is a
  terminal node — you cannot "challenge the challenge" through the CQ machinery.
  Depth only appears via the **explicit escalation** to a scheme-instance argument
  (§10.4), and that path already rides the ASPIC+ argument builder whose
  `maxDepth = 5` constant ([lib/aspic/arguments.ts](../../lib/aspic/arguments.ts))
  bounds structured-argument nesting. **So there is no new depth limit to invent** —
  challenges fan *out* (many challenges on one CQ), they do not nest *down*.
- **What actually needs guarding: fan-out noise, not depth.** A popular CQ can
  accrete many `CQAttack` rows. The guardrail is therefore a **challenge ledger**
  on the DISPUTED card: show `challengeCount` (the §11.6 grouped count), collapse
  beyond the first N (default 3) behind a *"show N more challenges"* disclosure, and
  order by recency. This reuses the `Claim` counters already in the schema
  (`challengeCount`, `openChallenges`, `defendedCount`, `concededCount`) for the
  per-challenge-claim sub-status, exactly as [app/c/[moid]/page.tsx](../../app/c/%5Bmoid%5D/page.tsx)
  already renders `"↓ N challenges"`.
- **Escalation depth indicator.** When a challenge *has* been escalated to a
  scheme-instance argument (§10.4), badge it *"structured"* and link to that
  argument's own page (which has its own CQ surface). The depth indicator is thus
  "is this challenge flat or structured," a single boolean per challenge — never an
  unbounded tree the public card must render inline.
- **Product stop-rule.** The obligation thread *terminates* the moment the CQ
  returns to `SATISFIED` via any §10.2 exit. There is no "infinite dispute" state:
  DISPUTED is a flag with named exits, and `recomputeGroundedForDelib` decides the
  answer-claim's `IN`/`OUT` overlay independently. No countdown, no auto-archive
  needed for v1; revisit only if a single CQ exceeds, say, 20 live challenges.

### 12.3 The client filing island

A new authenticated client island, mounted *inside* the existing (server)
`AnsweredCriticalQuestions` card. Because the card is rendered by a server
component, the interactive piece must be a separate `"use client"` child.

**Component tree:**

```
AnsweredCriticalQuestions            (server, §11.6 — adds Disputed badge + ledger)
 └─ ChallengeCqAffordance            (NEW "use client" — per answered-CQ card)
     ├─ useSession()  →  lib/useSession.ts (fetch /api/me; { session, loading })
     ├─ <button> "Challenge this answer"   (rendered only when session present)
     └─ <ChallengeCqDialog>            (NEW "use client" — modal form)
          ├─ attackType selector (REBUT | UNDERMINE | UNDERCUT) — §10.3 labels
          ├─ groundsText textarea (10..5000, live counter)
          ├─ evidence inputs (claimId chips + sourceUrl list)
          │     · required-state driven by selected attackType (UNDERMINE) and
          │       the CQ's burden flag passed down from the server card
          └─ submit → POST /api/cqs/challenge (credentials:"include")
```

**Props passed from the server card** (so the client never re-fetches):
`{ argumentId, cqKey, schemeKey, cqRequiresEvidence: boolean, cqBurden:
"PROPONENT"|"CHALLENGER"|"OPPONENT", answerSelfCanonical: boolean }`.

**Signed-out behaviour:** `useSession` returns `session === null` → render a muted
*"Sign in to challenge"* link (to the existing auth entry), **not** the form. No
anonymous challenges (the route would 401 anyway; we gate in UI to avoid a dead
submit).

**Client-side admissibility mirror (UX only, never the source of truth):**
compute `evidenceRequired = attackType === "UNDERMINE" || (cqRequiresEvidence &&
cqBurden !== "PROPONENT")` — the *same* predicate as the server `requiresEvidenceFromActor`
bar — to disable submit + show an inline hint *before* the round-trip. The **server
remains authoritative**: a 422 `CQ_CHALLENGE_NEEDS_EVIDENCE` is still handled and
shown, in case the mirror drifts.

**Submit + optimistic update:**

```ts
const res = await fetch("/api/cqs/challenge", {
  method: "POST",
  headers: { "content-type": "application/json" },
  credentials: "include",
  body: JSON.stringify({ argumentId, cqKey, schemeKey, attackType,
    groundsText, evidenceClaimIds, sourceUrls, requestId }),
});
```

- `requestId` = a `crypto.randomUUID()` minted once per dialog open (idempotency
  across double-submits, matching §11.2 step 6).
- On `ok` → close dialog, optimistically flip the card to the amber **DISPUTED**
  state (§11.6) and increment the local challenge count; the next server render
  reconciles. On error → keep dialog open, map `result.code` to a field-level
  message (e.g. `CQ_CHALLENGE_NEEDS_EVIDENCE` → highlight the evidence section;
  `CQ_DUPLICATE_CHALLENGE` → *"you already have an open challenge on this answer"*).

**Error-code → UI copy map** (reuses §11.2 codes; no new ones):

| code | surface |
|------|---------|
| `CQ_CHALLENGE_NEEDS_EVIDENCE` (422) | inline on evidence section |
| `CQ_DUPLICATE_CHALLENGE` (409) | banner; offer link to existing challenge |
| `CQ_NOT_ANSWERED` (409) | toast + auto-refresh (state drifted) |
| `CQ_EVIDENCE_NOT_FOUND` (400) | inline on the offending claimId chip |
| 401 (no session) | shouldn't occur (UI-gated) → fall back to sign-in link |

### 12.4 Server touch-ups required for Round 4 (small)

Round 4 is *mostly* client, but the §11.6 read aggregate needs three more fields so
the card can render the badge, the ledger, and the AI-provenance nudge **without a
second round-trip**:

1. `cqStatusEnum` (already in §11.6).
2. `challengeCount: number` (already in §11.6 grouped count).
3. **NEW:** `cqRequiresEvidence: boolean` + `cqBurden` (so the client mirror can
   pre-validate) — already selected by the challenge route (§11.2.1); expose the
   same two fields on the read aggregate.
4. **NEW:** `answerSelfCanonical: boolean` + `answerAuthorKind` (§12.1) — one select
   on the canonical response's argument `authorKind` + `aiProvenance`.

No new endpoints, no schema change beyond §11.1.

### 12.5 Round 4 build order (continues §11.8)

7. Extend the read aggregate (attestation / `get_argument` join) with the four
   §12.4 fields.
8. `components/citation/AnsweredCriticalQuestions.tsx` — Disputed badge + challenge
   ledger (collapse beyond 3) + AI-provenance line (server-side, §12.1/§12.2).
9. `components/citation/ChallengeCqAffordance.tsx` + `ChallengeCqDialog.tsx` (NEW
   `"use client"`, §12.3).
10. Wire `requestId` + optimistic state; map error codes to copy.
11. Playwright happy-path + signed-out + 422-evidence cases (`e2e/`), mirroring the
    answer-flow e2e if present.

### 12.6 Round 4 exit checklist

- [x] §6.4 decided — symmetric admission, asymmetric prompting/disclosure (§12.1).
- [x] §6.7 decided — depth bounded structurally; ledger + escalation badge, no hard
      challenge cap (§12.2).
- [x] Client island component tree, auth gating, optimistic update, error map
      (§12.3) — grounded on the existing `useSession` + cookie-fallback route.
- [x] Minimal read-aggregate additions enumerated (§12.4) — no schema/endpoint
      changes beyond §11.1.
- [x] Build order appended (§12.5).
- [ ] **Implementation:** execute §11.8 then §12.5 in order.

> **Spec is now feature-complete.** Every ideation §7 question (Q1–Q7) has a
> grounded decision; every surface (schema, helper, route, middleware, MCP tool,
> read aggregate, server card, client island, tests) has a contract. The only thing
> left is to build it (§11.8 → §12.5).
