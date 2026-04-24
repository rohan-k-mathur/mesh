# Facilitation API Contract

Status: Draft v0.1 (C0 deliverable)
Parent: [docs/DelibDemocracyScopeC_Roadmap.md](../DelibDemocracyScopeC_Roadmap.md)
Schema reference: [docs/facilitation/MIGRATION_DRAFT.md](MIGRATION_DRAFT.md)

## Conventions

- Base path: `/api`
- Format: JSON, UTF-8.
- Auth: existing session cookie via Next.js auth middleware. Public read variants documented inline.
- Errors: `{ "error": { "code": string, "message": string, "details"?: object } }` with the appropriate HTTP status.
- IDs: cuid.
- Timestamps: ISO 8601 (UTC).
- Validation: Zod schemas in `lib/facilitation/schemas/`. Validation errors return **422** via `apiHelpers.zodError()` (matches Scope A convention).
- Hash-chain validity: every endpoint that returns events also returns `hashChainValid: boolean` and an optional `brokenAtEventId`.

## Authorization matrix

Full table lives in [AUTH_MATRIX.md](AUTH_MATRIX.md). Summary:

| Capability | Required role |
|------|------|
| Open / close / handoff session | deliberation `host` or `facilitator` |
| Apply / dismiss intervention | facilitator of the **active** session only |
| Author / revise question | `facilitator` or `host` |
| Run question check | `facilitator` or `host` |
| Lock question | `facilitator` or `host` (subject to BLOCK-severity gate) |
| Read metrics & events | `facilitator`, `host`, `observer`; redacted on public read |
| Read facilitation report | same as events; public-read variant available |

## Common error codes

| Code | HTTP | Meaning |
|------|------|---------|
| `UNAUTHORIZED` | 401 | No session. |
| `FORBIDDEN` | 403 | Authenticated but role insufficient. |
| `NOT_FOUND` | 404 | Resource does not exist or hidden. |
| `CONFLICT_SESSION_ALREADY_OPEN` | 409 | Attempt to open a second OPEN session for the same deliberation. |
| `CONFLICT_SESSION_INACTIVE` | 409 | Attempt to act on a non-OPEN session (e.g. apply intervention after close). |
| `CONFLICT_QUESTION_LOCKED` | 409 | Attempt to mutate a locked question. |
| `CONFLICT_BLOCK_SEVERITY_UNRESOLVED` | 409 | Attempt to lock a question with an unresolved BLOCK check. |
| `CONFLICT_HANDOFF_PENDING` | 409 | Attempt to start a handoff while one is already PENDING. |
| `VALIDATION_ERROR` | 422 | Zod validation failed; `details` includes field errors. |
| `HASH_CHAIN_VIOLATION` | 500 | Internal hash-chain integrity error (should never reach client; logged + paged). |

---

## 1) Sessions

### `POST /api/deliberations/[id]/facilitation/sessions`

Open a facilitation session. Fails with `CONFLICT_SESSION_ALREADY_OPEN` if one is already OPEN.

Request:
```json
{ "summary": "Tuesday evening session — transit equity, round 2", "isPublic": true }
```

Response 201:
```json
{
  "session": {
    "id": "fs_...",
    "deliberationId": "delib_...",
    "status": "OPEN",
    "isPublic": true,
    "openedAt": "2026-04-22T19:00:00Z",
    "openedById": "auth_facilitator",
    "summary": "Tuesday evening session — transit equity, round 2"
  },
  "genesisEventId": "fe_..."
}
```

Side effects:
- Writes `FacilitationEvent { type: SESSION_OPENED }` (genesis; `hashChainPrev = null`).
- Writes `RoomLogbook { type: FACILITATION_OPENED }`.

### `POST /api/facilitation/sessions/[id]/close`

Close the active session.

Request:
```json
{ "summary": "Closed early; handoff to morning facilitator." }
```

Response 200:
```json
{ "session": { "id": "fs_...", "status": "CLOSED", "closedAt": "...", "closedById": "..." } }
```

Side effects:
- Writes `FacilitationEvent { type: SESSION_CLOSED }`.
- Writes `RoomLogbook { type: FACILITATION_CLOSED }`.
- Triggers `isFinal = true` snapshot pass for all metric kinds.

### `POST /api/facilitation/sessions/[id]/handoff`

Initiate a handoff to another facilitator. The handoff is **not** atomic by itself — the receiver must accept (`/handoffs/[id]/accept`) for the actual session swap to happen.

Request:
```json
{
  "toUserId": "auth_other_facilitator",
  "notesText": "Watch out for the cooldown rule firing on user X.",
  "outstandingInterventionIds": ["fi_1", "fi_3"]
}
```

Response 201:
```json
{
  "handoff": {
    "id": "fh_...",
    "fromSessionId": "fs_...",
    "toUserId": "auth_other_facilitator",
    "status": "PENDING",
    "initiatedAt": "..."
  }
}
```

### `POST /api/facilitation/handoffs/[id]/accept`

Receiving facilitator accepts. **Atomic transaction**: closes prior session (`status = HANDED_OFF`), opens a new session, copies `outstandingInterventionIds` association, marks the handoff `ACCEPTED`.

Request: empty body.

Response 200:
```json
{
  "handoff": { "id": "fh_...", "status": "ACCEPTED", "toSessionId": "fs_new_..." },
  "session": { "id": "fs_new_...", "status": "OPEN", "openedById": "auth_other_facilitator" }
}
```

Side effects:
- New session genesis event `SESSION_OPENED` references the prior chain via `payloadJson.handoffFromSessionId`.
- Both old and new sessions get `RoomLogbook { type: FACILITATION_HANDOFF }` mirror entries.

---

## 2) Questions

### `POST /api/deliberations/[id]/facilitation/questions`

Author a new question or revise an existing one. Pass `parentQuestionId` to revise.

Request:
```json
{
  "text": "Should the city restore weekend service on Line 14?",
  "framingType": "choice",
  "parentQuestionId": null
}
```

Response 201:
```json
{
  "question": {
    "id": "fq_...",
    "deliberationId": "delib_...",
    "version": 1,
    "text": "...",
    "framingType": "choice",
    "lockedAt": null,
    "authoredById": "auth_..."
  }
}
```

### `POST /api/facilitation/questions/[id]/check`

Run the quality assistant against the current question text. Stores `FacilitationQuestionCheck` rows grouped by `runId`. Returns the full run.

Request: empty body. (Optional `{ "lexiconOverrideKey": "legal" }` to swap the jargon lexicon.)

Response 200:
```json
{
  "runId": "run_...",
  "ranAt": "...",
  "checks": [
    { "id": "fc_1", "kind": "CLARITY", "severity": "INFO", "messageText": "Readability grade 8.4" },
    { "id": "fc_2", "kind": "LEADING", "severity": "WARN", "messageText": "Detected presupposition: 'restore' assumes prior service.", "evidence": { "matchedPattern": "restore" } },
    { "id": "fc_3", "kind": "BALANCE", "severity": "BLOCK", "messageText": "Choice framing requires balanced options; only one option is asserted." }
  ],
  "summary": { "info": 1, "warn": 1, "block": 1 }
}
```

### `POST /api/facilitation/questions/[id]/lock`

Lock the question for use in the deliberation. Fails with `CONFLICT_BLOCK_SEVERITY_UNRESOLVED` if any BLOCK check from the latest run is unresolved. WARN checks must be acknowledged inline.

Request:
```json
{
  "acknowledgedCheckIds": ["fc_2"]
}
```

Response 200:
```json
{
  "question": { "id": "fq_...", "lockedAt": "...", "lockedById": "..." }
}
```

---

## 3) Interventions and events

### `GET /api/facilitation/sessions/[id]/interventions`

Ranked feed. Default returns top 5 active recommendations.

Query: `?limit=5&includeHistory=false`

Response 200:
```json
{
  "active": [
    {
      "id": "fi_...",
      "kind": "ELICIT_UNHEARD",
      "targetType": "CLAIM",
      "targetId": "claim_...",
      "priority": 4,
      "ruleName": "unheardSpeakerRule",
      "ruleVersion": 1,
      "rationale": { "headline": "5 enrolled participants haven't contributed in 20 min", "details": { "gini": 0.71, "silentCount": 5 } },
      "triggeredByMetric": "PARTICIPATION_GINI",
      "triggeredByMetricSnapshotId": "ems_..."
    }
  ],
  "history": []
}
```

### `POST /api/facilitation/interventions/[id]/apply`

Log application. Writes `FacilitationEvent { INTERVENTION_APPLIED }` plus `RoomLogbook` mirror.

Request:
```json
{ "noteText": "Posted invitation prompt to room." }
```

Response 200:
```json
{ "intervention": { "id": "fi_...", "appliedAt": "...", "appliedById": "..." } }
```

Errors: `CONFLICT_SESSION_INACTIVE` if session is not OPEN.

### `POST /api/facilitation/interventions/[id]/dismiss`

Log dismissal. **`reasonText` is required** (decision #4); `reasonTag` is optional but strongly encouraged.

Request:
```json
{ "reasonText": "Already addressed by user prompt 30 seconds ago.", "reasonTag": "already_addressed" }
```

Response 200:
```json
{ "intervention": { "id": "fi_...", "dismissedAt": "...", "dismissedById": "...", "dismissedReasonTag": "already_addressed" } }
```

Errors: `VALIDATION_ERROR` (`reasonText` empty); `CONFLICT_SESSION_INACTIVE`.

### `GET /api/facilitation/sessions/[id]/events`

Append-only event feed.

Query: `?after=<eventId>&limit=100&type=INTERVENTION_APPLIED,SESSION_CLOSED`

Response 200:
```json
{
  "events": [
    { "id": "fe_...", "eventType": "INTERVENTION_APPLIED", "actorId": "auth_...", "actorRole": "facilitator", "createdAt": "...", "payload": { "interventionId": "fi_..." }, "hashChainSelf": "abcdef..." }
  ],
  "hashChainValid": true,
  "brokenAtEventId": null
}
```

Public-read variant (`isPublic = true` session): `actorId` is hashed (`sha256(actorId)[:12]`) and rationale fields summarized.

---

## 4) Equity metrics

### `GET /api/deliberations/[id]/facilitation/metrics`

Latest snapshot per metric for the active (or most recently closed) session.

Query: `?sessionId=fs_...&window=current` — `window` ∈ `current` (default, latest snapshot) | `final` (forces `isFinal = true` lookup).

Response 200:
```json
{
  "sessionId": "fs_...",
  "snapshots": [
    {
      "id": "ems_...",
      "metricKind": "PARTICIPATION_GINI",
      "metricVersion": 1,
      "value": "0.683421",
      "windowStart": "...",
      "windowEnd": "...",
      "breakdown": { "topAuthorShare": 0.41, "silentEnrolled": 5 },
      "isFinal": false
    }
  ]
}
```

### `GET /api/deliberations/[id]/facilitation/metrics/history`

Series for charting. Honors the post-30-day downsample (decision #3).

Query: `?sessionId=fs_...&metricKind=PARTICIPATION_GINI&from=...&to=...`

Response 200:
```json
{
  "metricKind": "PARTICIPATION_GINI",
  "metricVersion": 1,
  "series": [
    { "id": "ems_...", "windowEnd": "...", "value": "0.61" },
    { "id": "ems_...", "windowEnd": "...", "value": "0.68" }
  ],
  "downsampled": false
}
```

---

## 5) Reporting

### `GET /api/deliberations/[id]/facilitation/report`

Compiled facilitation report (JSON canonical). HTML rendering lives in the UI layer (`/deliberations/[id]/facilitation/report`).

Query: `?sessionId=fs_...` (omit for cross-session deliberation rollup).

Response 200 (single-session shape):
```json
{
  "deliberationId": "delib_...",
  "session": {
    "id": "fs_...",
    "openedAt": "...", "closedAt": "...", "openedById": "...", "closedById": "..."
  },
  "questionVersions": [
    { "version": 1, "text": "...", "lockedAt": "...", "checkSummary": { "info": 1, "warn": 1, "block": 0 } }
  ],
  "metrics": {
    "PARTICIPATION_GINI":   { "start": "0.42", "end": "0.31", "metricVersion": 1, "isFinalId": "ems_..." },
    "CHALLENGE_CONCENTRATION": { "start": "0.71", "end": "0.55", "metricVersion": 1, "isFinalId": "ems_..." },
    "RESPONSE_LATENCY_P50": { "start": "184", "end": "92", "metricVersion": 1, "isFinalId": "ems_..." },
    "ATTENTION_DEFICIT":    { "start": "7", "end": "2", "metricVersion": 1, "isFinalId": "ems_..." },
    "FACILITATOR_LOAD":     { "start": "0", "end": "1", "metricVersion": 1, "isFinalId": "ems_..." }
  },
  "interventions": {
    "recommended": 14,
    "applied": 9,
    "dismissed": 4,
    "openAtClose": 1,
    "applyRateByRule": { "unheardSpeakerRule": 0.83, "challengeConcentrationRule": 0.5 },
    "dismissalReasonTagDistribution": { "already_addressed": 3, "wrong_target": 1 }
  },
  "handoffs": [],
  "hashChain": { "valid": true, "eventCount": 142, "lastHash": "..." },
  "scopeAReportUrl": null
}
```

Public-read variant: same shape with `actorId`-bearing fields hashed and `interventions[*].rationale` summarized to a single sentence (no `breakdownJson` inlined).

---

## 6) Cross-link to Scope A pathways

When a deliberation has both an active facilitation session and an open Scope A pathway, the Scope A pathway report (`GET /api/pathways/[id]/report`) gains an additional optional field:

```json
{ "facilitationReportUrl": "/api/deliberations/<id>/facilitation/report?sessionId=fs_..." }
```

This is an **additive** change to the Scope A response shape; existing consumers ignore unknown keys. No new edges are added to the Plexus network in v1.

---

## 7) Live update channel

The cockpit subscribes to a Server-Sent Events channel:

`GET /api/facilitation/sessions/[id]/stream` — `text/event-stream`

Event names: `event` (any new `FacilitationEvent`), `metric` (new snapshot), `intervention` (new or status-changed intervention). Payloads mirror the relevant REST response shapes. SSE auth uses the same session cookie; on auth failure the connection closes with `event: error` and HTTP 401 on the initial response. Polling fallback: clients poll `/events`, `/metrics`, and `/interventions` every 10 s if SSE is unavailable.

---

## 8) Schema location

All Zod schemas live under `lib/facilitation/schemas/` with one file per resource:

- `sessionSchemas.ts`
- `questionSchemas.ts`
- `interventionSchemas.ts`
- `metricSchemas.ts`
- `reportSchemas.ts`

Tests reference these schemas directly (no duplicate validators).
