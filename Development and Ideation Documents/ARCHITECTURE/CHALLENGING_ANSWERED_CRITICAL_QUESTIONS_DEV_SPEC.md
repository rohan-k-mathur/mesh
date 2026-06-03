# Challenging Answered Critical Questions — Dev Spec (Round 1: Skeleton & Ontology Mapping)

**Status:** dev spec — **Round 1 of N** (skeleton + substrate mapping + schema delta).
This pass deliberately stops short of final API/MCP/UI contracts; those are Round 2+.
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
- [ ] **Round 2 entry:** resolve §6.1–§6.3 + §6.5, then write `/api/cqs/challenge`
      and `lib/cqs/challengeCq.ts` contracts.

> **Next round focus:** burden placement (§6.1) and reopen-vs-branch (§6.2) — these
> two decisions gate every API contract, so they come first in Round 2.
