# Multi-Agent Deliberation Experiment — Prerequisite Implementation Plan

**Companion to:** `Multi agent deliberation experiment roadmap.md`
**Status:** Pre-Stage-1 build plan
**Date:** May 3, 2026
**Audit basis:** Codebase audit performed against the 5-agent orchestrator's needs; verified with targeted reads of `app/api/claims/route.ts`, `app/api/arguments/route.ts`, `app/api/arguments/quick/route.ts`, `app/api/deliberations/ensure/route.ts`, `packages/isonomia-mcp/src/server.ts`.

---

## 0. Executive Summary

The audit's first pass identified four "blocking" gaps. Targeted verification reduces this to **two real critical-path items** plus **one trivial schema patch**, with **four soft gaps** that affect synthesis quality but don't block the experiment:

| # | Item | Audit class | Verified status | Effort |
|---|---|---|---|---|
| **B1** | Agent identity provisioning (5 Firebase bot users + token vault) | Blocking | Confirmed blocking | 3–5h |
| **B2** | Stack → Deliberation evidence binding (write API + per-delib evidence-context read API) | Blocking | Confirmed blocking | 5–8h |
| **B3** | Add `claimType` to `POST /api/claims` Zod schema | Blocking | Already silently shipped — only schema validation missing | 0.5h |
| ~~B4~~ | ~~Argument scheme linking~~ | Blocking | **Not blocking** — `POST /api/arguments` already accepts `schemeId` | 0h |
| ~~B5~~ | ~~`library_stack` host enum~~ | Blocking | **Not blocking** — already in `Allowed` set | 0h |
| **S1** | Concession/retraction history MCP tool | Soft | Confirmed gap; data exists in `DialogueMove` | 3–4h |
| **S2** | CQ → answering-argument linkage in `get_argument` | Soft | Confirmed gap; counts only, no edges | 2–3h |
| **S3** | Per-argument standing timeline (round-by-round transitions) | Soft | Confirmed gap; no snapshot table exists | 5–8h |
| **S4** | Full `DialogueMove` transcript MCP tool | Soft | Confirmed gap; helps synthesis without S1/S3 | 2–3h |
| **H1** | Rate-limit exemption for orchestrator agent user IDs | Hardening | `/api/arguments/quick` rate-limits 20/hr; orchestrator may use `/api/arguments` instead, so likely no fix needed | 0–1h |
| **H2** | Bulk read endpoint (`/api/v3/deliberations/{id}/state`) that fans out fingerprint+frontier+missing-moves+chains in one call | Hardening | Saves 4 round-trips per agent context refresh | 1–2h |

**Total critical-path:** ~9–13h before orchestrator can run.
**Total with soft gaps:** ~22–32h before synthesis Condition B is at full quality.
**Total with hardening:** ~24–35h.

Recommended sequencing: ship **B1 → B3 → B2** in that order (unblocks Phase 1 of the experiment). Ship **S4 → S1 → S2 → S3** in parallel during Phase 2/3 (synthesis happens after Phase 4, so soft gaps can land mid-experiment).

---

## 1. Critical-Path Items

### B1 · Agent Identity Provisioning

**Problem.** The orchestrator drives 5 distinct LLM agents that each file moves attributed to a specific identity. Isonomia auth is Firebase-backed: there is no service-account or bot-user pattern. Manually creating 5 Firebase users and pasting tokens into `.env` is brittle (tokens expire, can't be rotated) and doesn't scale to follow-up experiments.

**Deliverable.** A reusable script that provisions N bot users and emits long-lived API tokens the orchestrator can use.

**Design.**

1. **Add a `User.kind` enum field** if it doesn't already exist:
   - `human | bot | service`
   - Bot users are real Firebase users but flagged for downstream UI filtering (so the feed can hide bot-only activity, the analytics dashboard can split human vs. bot engagement, etc.).

2. **New script: `scripts/experiments/provision-agents.ts`.**
   - Inputs: `--count 5 --label-prefix "polarization-exp-1" --kind bot`
   - For each agent:
     - Create Firebase user via Admin SDK with deterministic email `polarization-exp-1-agent-{N}@bots.isonomia.app`
     - Mint a long-lived custom token (Firebase custom tokens, then exchange for ID token via REST)
     - Insert/upsert into `User` with `kind = "bot"`, `displayName = "Claim Analyst" | "Advocate A" | …`
     - Create a `Participant` row pre-bound to the experiment's deliberation (after deliberation exists)
   - Output: `agents.json` with `{ agentRole, userId, displayName, idToken, refreshToken, expiresAt }[]`

3. **New script: `scripts/experiments/refresh-agent-tokens.ts`.**
   - Reads `agents.json`, refreshes any expiring tokens via the Firebase REST refresh endpoint, writes back.
   - Orchestrator calls this before each phase (idempotent).

4. **`User.kind` propagation.**
   - Touch the 2–3 places in the feed/analytics layer that should respect bot filtering — but only minimally. Out-of-scope: building a UI for bot-flag toggling. In-scope: ensure `extraction.articulationOnly` and `authorCount.aiSeededRatio` in `DeliberationFingerprint` correctly count bot users in the AI bucket.

**Risks.**
- Firebase refresh tokens technically don't expire but can be revoked. Provision script should be re-runnable safely (upsert semantics).
- Don't commit `agents.json` — add to `.gitignore` immediately.

**Acceptance test.**
- Run `provision-agents.ts --count 5`, then `curl -H "Authorization: Bearer $(jq -r .[0].idToken agents.json)" http://localhost:3000/api/me` returns the bot user.
- Posting an argument as agent 2 shows `authorId = polarization-exp-1-agent-2`'s userId.

---

### B2 · Stack → Deliberation Evidence Binding

**Problem.** Phase 1.4 of the roadmap requires pre-seeding 15–25 verified sources into a Stack so advocates can cite them with platform-native provenance. Two sub-gaps:

1. **No HTTP endpoint to write StackItems** from the orchestrator. The library `lib/stacks/stackItemWriter.ts` has `AddBlockToStack` / `AddStackEmbed` but nothing exposed.
2. **No "evidence context" endpoint per deliberation** that an agent can call to list "the sources available to me as evidence in this deliberation."

**Deliverable.** Two endpoints + one MCP tool.

**Design.**

#### B2.a · `POST /api/stacks/{stackId}/items`

```ts
// Body
{
  itemKind: "url" | "doi" | "pdf";  // pdf out-of-scope for v1; agents use url/doi
  url?: string;         // for url
  doi?: string;         // for doi
  title?: string;
  authors?: string[];
  publishedAt?: string; // ISO
  abstract?: string;
  keyFindings?: string[]; // free-form annotations the orchestrator pre-fills
  tags?: string[];
}

// Response
{ stackItemId, sourceId, contentSha256?, archive?: { url, capturedAt } }
```

- Wraps `AddBlockToStack`. SSRF-guard via existing `isSafePublicUrl`.
- Triggers existing `enrichEvidenceProvenanceInBackground` for sha256 + archive.org capture.
- Auth: requires Stack write permission (owner/editor).

#### B2.b · `POST /api/deliberations/{id}/evidence-context`

Idempotent binding: links a Stack as the deliberation's evidence corpus. One Stack per deliberation for v1 (extend later if needed).

```ts
// Body
{ stackId: string }

// Response
{ deliberationId, stackId, sourceCount }
```

- Persists in a small new join table `DeliberationEvidenceContext { deliberationId @unique, stackId, boundAt, boundById }` — minimal; doesn't disturb existing `library_stack` host type, which is for the inverse case (Stack hosts a deliberation).
- The `library_stack` host type is the right primitive *if* the deliberation is created **from** the Stack. For pre-seeded experimental evidence, an explicit binding is clearer than overloading host type.

#### B2.c · `GET /api/deliberations/{id}/evidence-context`

Returns the bound Stack's items as a flat reading list, suitable for prepending to agent prompts:

```ts
{
  stack: { id, name, sourceCount },
  sources: [
    { sourceId, url, doi, title, authors, publishedAt, keyFindings, tags,
      contentSha256, archiveUrl, citationToken: "src:abc123" }
  ]
}
```

- `citationToken` is a stable short identifier the agents are instructed to use in their `evidence[]` payloads when calling `POST /api/arguments`. The orchestrator resolves the token to a real source URL before persisting.

#### B2.d · MCP tool: `get_deliberation_evidence_context`

Mirrors B2.c. Lets the synthesis LLM (Condition B) see what evidence corpus the deliberation was built against, separately from what was actually cited.

**Risks.**
- Don't conflate this with the existing `library_stack` host type. Two distinct relationships (Stack-hosts-Deliberation vs. Stack-bound-as-evidence).
- Source dedup must use the existing SHA1 fingerprinting pipeline so the same DOI ingested twice produces one Source.

**Acceptance test.**
- Pre-seed 15 sources via `POST /api/stacks/{id}/items` looped from a CSV.
- `POST /api/deliberations/{id}/evidence-context` binds them.
- `GET /api/deliberations/{id}/evidence-context` returns 15 sources with stable `citationToken`s.
- Agent 2 cites `citationToken: "src:abc123"`; orchestrator translates to URL when calling `POST /api/arguments`.
- The resulting argument's `Citation` row points to the correct `Source`.

---

### B3 · Validate `claimType` in `POST /api/claims`

**Problem.** The route already passes `claimType` through to Prisma but doesn't validate it. Agents could pass garbage and silently corrupt typing.

**Deliverable.** Add `claimType` to the Zod schema with an enum constraint.

**Design.** One-file edit in [app/api/claims/route.ts](app/api/claims/route.ts):

```ts
const ClaimTypeEnum = z.enum([
  "EMPIRICAL", "NORMATIVE", "DEFINITIONAL", "CAUSAL",
  "METHODOLOGICAL", "INTERPRETIVE", "HISTORICAL", "CONCEPTUAL",
  "COMPARATIVE", "META", "THESIS",
]); // mirror lib/claims/extraction.ts AcademicClaimType

const PromoteSchema = z.object({
  deliberationId: z.string().optional(),
  text: z.string().min(1).optional(),
  claimType: ClaimTypeEnum.optional(),
  target: z.object({
    type: z.enum(["argument", "card"]),
    id: z.string(),
  }).optional(),
});
```

Then read `input.claimType` from the parsed object instead of `normalized.claimType`. Already-stored claims are unaffected.

**Acceptance test.**
- `POST /api/claims { text: "X", claimType: "EMPIRICAL" }` → 201, claim has `claimType="EMPIRICAL"`.
- `POST /api/claims { text: "X", claimType: "garbage" }` → 400.

---

## 2. Soft Gaps (Synthesis-Quality)

These don't block the orchestrator but materially affect Condition B's output. The roadmap's central hypothesis depends on the synthesis LLM being able to read concession history, CQ status with provenance, and standing transitions — currently the MCP surface only gives current-state snapshots.

### S1 · Concession/Retraction History MCP Tool

**Problem.** `DialogueMove` rows for `CONCEDE` and `RETRACT` exist with timestamps and rationale payloads, but no MCP tool surfaces them. The synthesis LLM can see *current* standing but not *what changed*.

**Deliverable.**

#### S1.a · `GET /api/v3/deliberations/{id}/concessions`

```ts
{
  events: [
    {
      moveId, kind: "CONCEDE" | "RETRACT" | "NARROW_SCOPE",
      actorId, actorDisplayName, actorKind: "human" | "bot",
      targetType, targetId, targetText,
      rationale: string,        // from payload
      revisedClaimText?: string,  // for narrow-scope/concede
      timestamp,
      roundNumber?: number,     // if orchestrator tags moves with round metadata
    }
  ]
}
```

- `NARROW_SCOPE` is not a current move kind — the roadmap calls for the Concession Tracker to propose narrowed claims. Implement as `CONCEDE` with `payload.revisedClaimText` set; the endpoint splits them out for the consumer.

#### S1.b · MCP tool: `get_concession_history`

Wraps S1.a. Returned shape is consumed verbatim by the Condition B synthesis prompt.

**Effort.** ~3–4h. Pure read endpoint; no schema changes.

**Acceptance test.**
- After Phase 3, `get_concession_history` returns ≥1 event per advocate (assuming the dialogue produced any movement).
- Each event's `targetText` matches the original claim/argument text at the time of concession.

---

### S2 · CQ → Answering-Argument Linkage

**Problem.** `get_argument` returns `criticalQuestions: { answered: 3, unanswered: 2 }` but doesn't say *which arguments answered which CQ*. The synthesis LLM can't trace "what specifically responded to the cherry-picking CQ."

**Deliverable.** Extend the existing CQ status model to record the answering argument's id, and surface it through MCP.

**Design.**

1. **Schema.** The CQ status table (per audit, addressed via `targetType_targetId_schemeKey_cqKey` composite key) likely already has an `answeredByArgumentId` field — verify in `prisma/schema.prisma` under `CriticalQuestionStatus` or similar. If absent, add:
   ```prisma
   model CriticalQuestionStatus {
     // … existing fields
     answeredByArgumentId String?
     answeredByArgument   Argument? @relation(fields: [answeredByArgumentId], references: [id])
     answeredByMoveId     String?   // optional: the GROUNDS DialogueMove
   }
   ```
2. **Write path.** `POST /api/arguments/[id]/cqs/[cqKey]/answer` should already record this — verify and fix if it doesn't.
3. **Read path.** Extend `get_argument` MCP output:
   ```diff
     criticalQuestions: {
       total: 5,
       answered: [
   -    "cq_evidence_quality",
   +    { key: "cq_evidence_quality", answeredByPermalink: "/a/X9k…", answeredByMoveId: "mv_…" }
       ],
       unanswered: ["cq_alternative_explanation"],
     }
   ```

**Effort.** ~2–3h if the column exists; ~3–5h if a migration is needed.

**Acceptance test.**
- Agent files a GROUNDS move targeting argument A's `cq_alternative_explanation`.
- `get_argument(A.permalink).criticalQuestions.answered` includes that CQ with `answeredByPermalink` pointing to the GROUNDS-spawned argument.

---

### S3 · Per-Argument Standing Timeline

**Problem.** `standingState` is a current snapshot. After Phase 3, the synthesis LLM has no way to say "this argument moved from `tested-attacked` after round 3 to `tested-survived` after round 5 because the Challenger conceded the CQ." This is the most expensive of the soft gaps.

**Deliverable.** A snapshot table + read endpoint + MCP tool.

**Design.**

1. **Schema.** New table:
   ```prisma
   model ArgumentStandingSnapshot {
     id             String   @id @default(cuid())
     argumentId     String
     argument       Argument @relation(fields: [argumentId], references: [id], onDelete: Cascade)
     standingState  String   // enum-shaped string
     standingScore  Float?
     incomingAttacks Int
     incomingSupports Int
     cqAnswered     Int
     cqOpen         Int
     contentHash    String   // hash of the snapshot fields, for dedup
     triggeredByMoveId String?  // move that caused this snapshot
     createdAt      DateTime @default(now())
     @@index([argumentId, createdAt])
     @@unique([argumentId, contentHash])
   }
   ```

2. **Write trigger.** Wherever standing recomputation runs (look in `lib/ceg/grounded.ts` or similar — `recomputeGroundedForDelib` is referenced in `app/api/claims/route.ts`), append a snapshot on state change. Use the `contentHash` unique index to skip no-op snapshots.

3. **Read.** `GET /api/v3/arguments/{id}/standing-timeline` → ordered array.

4. **MCP.** Extend `get_argument` with optional `?include=standing_timeline`, OR add a new dedicated tool `get_argument_timeline` (cleaner; doesn't bloat the default envelope).

**Effort.** ~5–8h. Migration + trigger wiring is the bulk; endpoint is trivial.

**Risks.**
- Don't snapshot on every read or every unrelated event — only on actual state transitions.
- Snapshot tables grow unboundedly; acceptable for a research-scale deliberation but document a retention policy as a TODO.

**Acceptance test.**
- After Phase 3, an argument that was attacked then defended shows ≥3 snapshots: initial `untested-default`, then `tested-attacked`, then `tested-survived`.
- Each snapshot's `triggeredByMoveId` resolves to the dialogue move that caused the transition.

---

### S4 · Full DialogueMove Transcript MCP Tool

**Problem.** Even without S1/S3 fully implemented, exposing the raw `DialogueMove` log gives the synthesis LLM enough to reconstruct the dialectical trajectory. This is the cheapest "good enough" bridge.

**Deliverable.** `get_dialogue_transcript(deliberationId)` MCP tool.

**Design.**

```ts
// MCP tool output
{
  moves: [
    {
      moveId, kind, // ASSERT | WHY | GROUNDS | CONCEDE | RETRACT | …
      actorId, actorDisplayName, actorKind,
      targetType, targetId, targetText,
      payload,    // raw — the synthesis LLM can interpret
      timestamp,
      replyToMoveId?, // threading
    }
  ]
}
```

- One DB query (`prisma.dialogueMove.findMany({ where: { deliberationId }, orderBy: createdAt asc, include: { actor: true } })`).
- Hard cap at e.g. 1000 moves to avoid context bombs; paginate if exceeded.

**Effort.** ~2–3h.

**Acceptance test.**
- For a deliberation with N dialogue moves, the tool returns exactly N (or paginated to the cap).
- Move ordering is deterministic and stable across calls.

---

## 3. Hardening Items

### H1 · Rate Limit & Endpoint Choice

The `/api/arguments/quick` rate limit (20/hr/user) only matters if the orchestrator uses that endpoint. Since orchestrator agents will use **`POST /api/arguments`** (richer schema, accepts `schemeId`/`slots`) instead of `/quick`, this is **not a blocker**.

**Action.** Document this in the orchestrator README. Optionally add a `bot`-kind exemption to the quick-route limiter in case any tooling uses it.

**Effort.** ~30min docs + 30min optional exemption.

---

### H2 · Bulk Deliberation State Endpoint

**Problem.** Each agent context refresh currently requires 4 round-trips: `fingerprint`, `frontier`, `missing-moves`, `chains`. With 5 agents × 6 rounds × 4 calls = 120 round-trips during Phase 3 alone.

**Deliverable.** `GET /api/v3/deliberations/{id}/state?include=fingerprint,frontier,missing-moves,chains,concessions,transcript` — server-side fan-out, single response.

**Design.** Use `Promise.all` over the existing handlers' library functions (don't double-cache; respect existing `DeliberationFingerprintCache`). Pass a comma-separated `include` list; default to all.

**Effort.** ~1–2h.

**Acceptance test.** Single call returns object with all requested keys; missing keys throw 400.

---

## 4. Build Sequence

```
Day 1 (critical-path unblock; ~9–13h)
├── B3  Add claimType to Zod schema             0.5h
├── B1  Provision script + User.kind            3–5h
│       └── Run once to create 5 bots
├── B2a POST /api/stacks/{id}/items             1.5h
├── B2b POST /api/deliberations/{id}/evidence-context  1.5h
├── B2c GET  /api/deliberations/{id}/evidence-context  1h
└── B2d MCP tool: get_deliberation_evidence_context    1h

Day 2 (synthesis-quality; ~12–18h, can overlap with Phase 2/3 of experiment)
├── S4  Transcript MCP tool                     2–3h
├── S1  Concession history endpoint + MCP       3–4h
├── S2  CQ → answering-argument linkage         2–5h
└── S3  Standing timeline (snapshot table + trigger + endpoint + MCP)  5–8h

Day 3 (hardening; ~2–3h, optional pre-Phase-1)
├── H1  Rate-limit docs/exemption               1h
└── H2  Bulk state endpoint                     1–2h
```

**Earliest date orchestrator can run end-to-end:** end of Day 1.
**Earliest date Condition B synthesis is at full quality:** end of Day 2.

---

## 5. What This Plan Deliberately Does Not Do

- **Does not redesign the MCP server.** All new tools are additive; existing 13 are unchanged.
- **Does not change auth.** Bot users go through the same Firebase pipeline; no service-account shortcut.
- **Does not surface bot-vs-human differentiation in user-facing UI.** That's a separate product question. The bot flag is internal and only feeds the existing `articulationOnly` honesty signal.
- **Does not generalize "experiment infrastructure" beyond this experiment.** If we do follow-up experiments, the provisioning script and evidence-binding endpoints are reusable, but no "Experiments" UI. Premature.
- **Does not build a dedicated agent log viewer.** Orchestrator's per-round logs (input context, raw output, API calls) live as JSON files in `logs/experiments/polarization-1/`. Inspect with `jq`.

---

## 6. Resolved Decisions

All open questions resolved 2026-05-03:

1. **Bot user emails.** Synthetic `@bots.isonomia.app` domain. Pattern: `polarization-exp-1-agent-{1..5}@bots.isonomia.app`. Firebase custom-token auth doesn't require deliverable email; synthetic subdomain keeps bot accounts clearly tagged in the `User` table and avoids leaking bot identity into a real inbox.
2. **Stack ownership.** Owned by the human author (Firebase auth id `nqMa4rb8gQZ71fWLkIId4Qjqcby1`). Manageable from the regular Stacks UI before, during, and after the experiment.
3. **Snapshot retention (S3).** Keep forever. No pruning. Snapshots are research data and will be referenced by future write-ups.
4. **MCP tool naming.** Confirmed. New tools added to `packages/isonomia-mcp/src/server.ts`:
   - `get_concession_history`
   - `get_dialogue_transcript`
   - `get_argument_timeline`
   - `get_deliberation_evidence_context`
5. **Doc location.** This plan and the roadmap now live in `Development and Ideation Documents/Experiments/`.

---

## Appendix: Verified Endpoint Paths (audit ground truth)

| Capability | Endpoint | Status |
|---|---|---|
| Create deliberation | `POST /api/deliberations` + `POST /api/deliberations/ensure` | ✅ |
| Create claim (with `claimType`) | `POST /api/claims` | ✅ (validate schema — B3) |
| Create scheme-annotated argument | `POST /api/arguments` (accepts `schemeId`, `slots`) | ✅ |
| List schemes + CQ keys | `GET /api/schemes` | ✅ |
| File attack | `POST /api/attacks/create` | ✅ |
| File dialogue move | `POST /api/dialogue/move` | ✅ |
| Answer a CQ | `POST /api/arguments/[id]/cqs/[cqKey]/answer` | ✅ (verify it records `answeredByArgumentId` — S2) |
| Read deliberation state | `GET /api/v3/deliberations/{id}/{fingerprint,frontier,missing-moves,chains,synthetic-readout,cross-context}` | ✅ |
| Create Stack | `POST /api/stacks` | ✅ |
| Add items to Stack | *missing* | ❌ (B2a) |
| Bind Stack as evidence corpus | *missing* | ❌ (B2b) |
| Concession history | *missing* | ❌ (S1) |
| Dialogue transcript | *missing* | ❌ (S4) |
| Standing timeline | *missing* | ❌ (S3) |
| MCP: 13 existing tools | `packages/isonomia-mcp/src/server.ts` | ✅ |
| MCP: 4 new tools (B2d, S1, S3, S4) | *missing* | ❌ |
