# Typology API Contract

Status: Draft v0.1 (B0 deliverable)
Parent: [docs/DelibDemocracyScopeB_Roadmap.md](../DelibDemocracyScopeB_Roadmap.md)
Schema reference: [docs/typology/MIGRATION_DRAFT.md](MIGRATION_DRAFT.md)
Auth matrix: [docs/typology/AUTH_MATRIX.md](AUTH_MATRIX.md)

## Conventions

- Base path: `/api`
- Format: JSON, UTF-8.
- Auth: existing session cookie via Next.js auth middleware. Public-read variants documented inline.
- Errors: `{ "error": { "code": string, "message": string, "details"?: object } }` with the appropriate HTTP status.
- IDs: cuid.
- Timestamps: ISO 8601 (UTC).
- Validation: Zod schemas in `lib/typology/schemas/`. Validation errors return **422** via `apiHelpers.zodError()` (matches Scope A and Scope C convention).
- Hash-chain validity: every endpoint that returns events also returns `hashChainValid: boolean` and an optional `brokenAtEventId`.

## Authorization summary

Full table lives in [AUTH_MATRIX.md](AUTH_MATRIX.md). Summary:

| Capability | Required role |
|------|------|
| Propose tag | deliberation participant (contributor or above) |
| Confirm tag | `facilitator`, `host`, or original proposer of a same-axis candidate |
| Retract tag | original author or `facilitator` / `host` |
| Promote / dismiss candidate | `facilitator` of the **active** session, or `host` |
| Draft / publish / retract summary | `facilitator` or `host`. Edit a DRAFT: original drafter only. |
| Read tags / candidates / summaries / events | `facilitator`, `host`, `observer`; redacted on public read |
| Read typology export | facilitator/host always; anonymous only if `session.isPublic = true` (or deliberation-level `isPublic = true` for deliberation-scoped chains) |

## Common error codes

| Code | HTTP | Meaning |
|------|------|---------|
| `UNAUTHORIZED` | 401 | No session. |
| `FORBIDDEN` | 403 | Authenticated but role insufficient. |
| `NOT_FOUND` | 404 | Resource does not exist or hidden by visibility. |
| `CONFLICT_TARGET_OUTSIDE_DELIBERATION` | 404 | `targetId` does not belong to the deliberation. |
| `CONFLICT_TAG_RETRACTED` | 409 | Attempt to confirm or modify a retracted tag. |
| `CONFLICT_SUMMARY_NOT_DRAFT` | 409 | Attempt to edit a non-DRAFT summary. |
| `CONFLICT_SUMMARY_REFERENCES_RETRACTED_TAG` | 409 | Attempt to publish a summary whose `supportingTagIds` include a retracted tag. |
| `CONFLICT_AXIS_INACTIVE` | 409 | Attempt to propose a tag on an axis where `isActive = false`. |
| `CONFLICT_CANDIDATE_RESOLVED` | 409 | Attempt to act on an already-promoted or already-dismissed candidate. |
| `SNAPSHOT_TOO_LARGE` | 422 | Publish would exceed the 256 KiB `snapshotJson` cap. |
| `VALIDATION_ERROR` | 422 | Zod validation failed; `details` includes field errors. |
| `HASH_CHAIN_VIOLATION` | 500 | Internal hash-chain integrity error (should never reach client; logged + paged). |

---

## 1) Axis registry

### `GET /api/typology/axes`

List registered axes. Public read; no auth required.

Query: none.

Response 200:
```json
{
  "axes": [
    { "id": "ax_v...", "key": "VALUE",     "displayName": "Value",     "description": "...", "colorToken": "amber-500",  "interventionHint": "Surface the values at stake; consider a values-clarification round.", "version": 1, "isActive": true },
    { "id": "ax_e...", "key": "EMPIRICAL", "displayName": "Empirical", "description": "...", "colorToken": "sky-500",    "interventionHint": "Ask for evidence; suggest a fact-finding interlude.",                "version": 1, "isActive": true },
    { "id": "ax_f...", "key": "FRAMING",   "displayName": "Framing",   "description": "...", "colorToken": "violet-500", "interventionHint": "Reframe the question; surface the implicit framing.",                  "version": 1, "isActive": true },
    { "id": "ax_i...", "key": "INTEREST",  "displayName": "Interest",  "description": "...", "colorToken": "rose-500",   "interventionHint": "Disclose stakes; consider a structured interest declaration.",         "version": 1, "isActive": true }
  ]
}
```

---

## 2) Tagging

### `POST /api/deliberations/[id]/typology/tags`

Propose a tag. Sets `confirmedAt = null`. Idempotent on `(deliberationId, targetType, targetId, axisId, authoredById)` — re-tagging the same author/axis/target updates `confidence` / `evidenceText` and emits a fresh `TAG_PROPOSED` event.

Request:
```json
{
  "sessionId": "fs_abc",                          // optional; null = deliberation-scoped
  "targetType": "CLAIM",                           // CLAIM | ARGUMENT | EDGE
  "targetId": "claim_14",
  "axisKey": "EMPIRICAL",
  "confidence": 0.72,
  "evidenceText": "Two participants cite differing ridership studies on Line 14.",
  "evidenceJson": { "linkedClaimIds": ["claim_22"] }
}
```

Response 201:
```json
{
  "tag": {
    "id": "dt_...",
    "deliberationId": "delib_...",
    "sessionId": "fs_abc",
    "targetType": "CLAIM",
    "targetId": "claim_14",
    "axisKey": "EMPIRICAL",
    "axisVersion": 1,
    "confidence": 0.72,
    "evidenceText": "Two participants cite differing ridership studies on Line 14.",
    "authoredById": "auth_user",
    "authoredRole": "PARTICIPANT",
    "seedSource": "MANUAL",
    "confirmedAt": null,
    "retractedAt": null,
    "createdAt": "2026-04-23T20:14:00Z"
  },
  "eventId": "mce_..."
}
```

Side effects:
- Writes `MetaConsensusEvent { type: TAG_PROPOSED, tagId }` (genesis if first event in scope).
- Writes `RoomLogbook { type: DISAGREEMENT_TAGGED }`.

### `POST /api/typology/tags/[id]/confirm`

Confirm a candidate tag.

Request: `{}`

Response 200:
```json
{ "tag": { "id": "dt_...", "confirmedAt": "...", "confirmedById": "..." }, "eventId": "mce_..." }
```

Side effects:
- Writes `MetaConsensusEvent { type: TAG_CONFIRMED, tagId }`.

### `POST /api/typology/tags/[id]/retract`

Retract a tag. Required `reason`.

Request:
```json
{ "reason": "Tag was on the wrong claim; re-proposed on claim 17." }
```

Response 200:
```json
{ "tag": { "id": "dt_...", "retractedAt": "...", "retractedById": "...", "retractedReasonText": "..." }, "eventId": "mce_..." }
```

422 cases: missing `reason`.

### `GET /api/deliberations/[id]/typology/tags`

List tags.

Query parameters:
- `targetType` — optional filter.
- `targetId` — optional filter.
- `axisKey` — optional filter.
- `sessionId` — optional filter.
- `confirmedOnly` — boolean; default `true` (excludes pending candidates and retracted).
- `cursor` — pagination cursor.
- `limit` — default 50, max 200.

Response 200:
```json
{
  "tags": [ /* DisagreementTag[] (redacted if public) */ ],
  "nextCursor": "tag_..."
}
```

### `GET /api/typology/tags/[id]`

Tag detail. Includes the chain of `TAG_PROPOSED` / `TAG_CONFIRMED` / `TAG_RETRACTED` events for this tag.

Response 200:
```json
{
  "tag": { /* DisagreementTag */ },
  "events": [ /* MetaConsensusEvent[] for this tagId */ ],
  "hashChainValid": true
}
```

---

## 3) Candidates

### `GET /api/facilitation/sessions/[id]/typology/candidates`

Pending candidate queue for a session.

Query parameters:
- `status` — `pending` | `dismissed` | `promoted` | `all`; default `pending`.
- `cursor`, `limit` — same as tags.

Response 200:
```json
{
  "candidates": [
    {
      "id": "tc_...",
      "sessionId": "fs_abc",
      "targetType": "CLAIM",
      "targetId": "claim_14",
      "suggestedAxisKey": "EMPIRICAL",
      "suggestedAxisVersion": 1,
      "seedSource": "INTERVENTION_SEED",
      "rationaleText": "Triggered by INTERVENTION_APPLIED of kind PROMPT_EVIDENCE on Claim 14.",
      "priority": 4,
      "ruleName": "interventionSeeder",
      "ruleVersion": 1,
      "createdAt": "..."
    }
  ],
  "nextCursor": null
}
```

### `POST /api/typology/candidates/[id]/promote`

Promote a candidate to a `DisagreementTag`. Atomic: writes the tag, sets `promotedToTagId`, emits `CANDIDATE_ENQUEUED → TAG_PROPOSED` events.

Request:
```json
{
  "confidence": 0.65,
  "evidenceText": "Confirmed; the dispute centers on the 2024 ridership study.",
  "evidenceJson": { "citationIds": ["cite_8"] },
  "axisOverrideKey": null
}
```

Response 201:
```json
{ "tag": { /* DisagreementTag */ }, "candidateId": "tc_...", "eventId": "mce_..." }
```

409 cases: `CONFLICT_CANDIDATE_RESOLVED` if already promoted or dismissed.

### `POST /api/typology/candidates/[id]/dismiss`

Dismiss a candidate. Required `reason`.

Request:
```json
{ "reason": "Already addressed by an existing tag from @kara." }
```

Response 200:
```json
{ "candidate": { "id": "tc_...", "dismissedAt": "...", "dismissedById": "...", "dismissedReasonText": "..." }, "eventId": "mce_..." }
```

---

## 4) Meta-consensus summaries

### `POST /api/deliberations/[id]/typology/summaries`

Draft a summary.

Request:
```json
{
  "sessionId": "fs_abc",                           // optional; null = deliberation-scoped (decision #3)
  "bodyJson": {
    "agreedOn": [
      "Weekend service on Line 14 was discontinued in 2023 for budget reasons."
    ],
    "disagreedOn": [
      {
        "axisKey": "VALUE",
        "summary": "Equity-of-access vs cost-recovery.",
        "supportingTagIds": ["dt_x", "dt_y"]
      },
      {
        "axisKey": "EMPIRICAL",
        "summary": "Ridership recovery forecasts (2024 vs 2025 studies).",
        "supportingTagIds": ["dt_z"]
      }
    ],
    "blockers": [
      "No reconciled ridership figure between the 2024 and 2025 studies."
    ],
    "nextSteps": [
      "Request a synthesis brief from the Transit Authority before next session."
    ]
  },
  "narrativeText": "Optional human prose render."
}
```

Response 201:
```json
{
  "summary": {
    "id": "mcs_...",
    "deliberationId": "delib_...",
    "sessionId": "fs_abc",
    "version": 1,
    "status": "DRAFT",
    "bodyJson": { /* echoed */ },
    "snapshotJson": null,
    "createdAt": "..."
  },
  "eventId": "mce_..."
}
```

Side effects:
- Writes `MetaConsensusEvent { type: SUMMARY_DRAFTED, summaryId }`.

### `PATCH /api/typology/summaries/[id]`

Edit a DRAFT summary. Only the original drafter can edit; only DRAFT status is mutable.

Request: same shape as the draft body, partial.

Response 200:
```json
{ "summary": { /* updated */ } }
```

409 cases: `CONFLICT_SUMMARY_NOT_DRAFT` if status is PUBLISHED or RETRACTED.

### `POST /api/typology/summaries/[id]/publish`

Publish a summary. Freezes `snapshotJson` per decision #4.

Request: `{}`

Response 200:
```json
{
  "summary": {
    "id": "mcs_...",
    "status": "PUBLISHED",
    "publishedAt": "...",
    "publishedById": "...",
    "snapshotJson": { /* frozen */ },
    "snapshotHash": "sha256:..."
  },
  "eventId": "mce_..."
}
```

Side effects:
- Builds `snapshotJson` per the snapshot anchor policy in `MIGRATION_DRAFT.md` §"Snapshot anchor policy".
- Computes `snapshotHash`.
- Writes `MetaConsensusEvent { type: SUMMARY_PUBLISHED, summaryId, payloadJson: { snapshotHash, tagCount, byteLength } }`.
- Writes `RoomLogbook { type: META_CONSENSUS_PUBLISHED }`.

422 cases: `SNAPSHOT_TOO_LARGE` (over 256 KiB).
409 cases: `CONFLICT_SUMMARY_REFERENCES_RETRACTED_TAG`.

### `POST /api/typology/summaries/[id]/retract`

Retract a published summary. Required `reason`.

Request:
```json
{ "reason": "Replaced by version 2; see mcs_xyz." }
```

Response 200:
```json
{ "summary": { "id": "mcs_...", "status": "RETRACTED", "retractedAt": "...", "retractedById": "...", "retractedReasonText": "..." }, "eventId": "mce_..." }
```

Side effects:
- Writes `MetaConsensusEvent { type: SUMMARY_RETRACTED, summaryId }`.
- Writes `RoomLogbook { type: META_CONSENSUS_RETRACTED }`.
- `snapshotJson` is **not** cleared (open issue #5 in MIGRATION_DRAFT — defaulted to retain).

### `GET /api/deliberations/[id]/typology/summaries`

List summaries.

Query parameters:
- `sessionId` — optional filter; pass `null` literal to filter to deliberation-scoped.
- `all` — boolean; default `false` returns the latest PUBLISHED per `(sessionId, parentChain)`. `true` returns full history.
- `cursor`, `limit` — pagination.

Response 200:
```json
{
  "summaries": [ /* MetaConsensusSummary[] */ ],
  "nextCursor": null
}
```

### `GET /api/typology/summaries/[id]`

Summary detail with rendered tag references.

Response 200:
```json
{
  "summary": { /* MetaConsensusSummary */ },
  "supportingTags": [ /* DisagreementTag[] dereferenced from snapshotJson */ ],
  "renderedNarrative": "Markdown render of bodyJson + narrativeText",
  "events": [ /* events for this summaryId */ ],
  "hashChainValid": true
}
```

---

## 5) Events

### `GET /api/deliberations/[id]/typology/events`

Append-only event feed. Mirrors Scope C's `events` route shape.

Query parameters:
- `sessionId` — optional filter; pass `null` to filter to deliberation-scoped chain.
- `eventType` — optional filter (`MetaConsensusEventType` value).
- `cursor`, `limit` — pagination.

Response 200:
```json
{
  "events": [ /* MetaConsensusEvent[] (redacted if public) */ ],
  "nextCursor": null,
  "hashChainValid": true,
  "brokenAtEventId": null
}
```

---

## 6) Reporting integration (additive to Scopes A + C)

### Scope A — `GET /api/pathways/[id]` (additive fields)

The existing endpoint gains two optional fields. **No breaking changes**.

```json
{
  "pathway": {
    "id": "pw_...",
    "currentMetaConsensusSummaryId": "mcs_...",   // NEW: deliberation-level latest published summary
    "packets": [
      {
        "id": "rp_...",
        "items": [
          {
            "id": "rpi_...",
            "metaConsensusSummaryId": "mcs_..."   // NEW: optional; per-item link when applicable
          }
        ]
      }
    ]
  }
}
```

Both new fields are absent (not `null`) when the deliberation has no published summaries — additive contract preserved.

### Scope C — `GET /api/facilitation/sessions/[id]/export` (unchanged)

Scope B does **not** modify the canonical facilitation export envelope. Per the hand-off contract (`docs/facilitation/scope-b-handoff.md` §5), Scope C remains the sole owner of that schema.

### Scope B — `GET /api/deliberations/[id]/typology/export`

Parallel canonical envelope owned by Scope B.

Headers:
- `X-Typology-Export-Schema: 1.0.0`
- `Content-Type: application/json; charset=utf-8`

Response 200:
```json
{
  "schemaVersion": "1.0.0",
  "generator": "mesh-typology",
  "generatedAt": "2026-04-23T21:00:00Z",
  "deliberationId": "delib_...",
  "axes": [ /* DisagreementAxis[] pinned by version */ ],
  "tags": [ /* DisagreementTag[] full history */ ],
  "summaries": [ /* MetaConsensusSummary[] with snapshotJson */ ],
  "events": [ /* MetaConsensusEvent[] full chain */ ],
  "hashChain": {
    "valid": true,
    "failedIndex": null,
    "eventCount": 142,
    "firstHash": "sha256:...",
    "lastHash": "sha256:..."
  }
}
```

Access:
- Facilitator/host of the deliberation: always.
- Anonymous: only when *every* in-scope chain belongs to a deliberation/session with `isPublic = true`. If any chain is private, the response is 404 for anonymous readers (no partial-anonymous variant in v1).

Compatibility rules: same as Scope C export — additions non-breaking, removals/renames bump the major version, named subscribers (currently: institutional report consumers) are notified per the downstream hand-off contract (B4.3).

---

## 7) Versioning policy

Mirrors Scope C. Surface table for Scope B:

| Surface | Version field | Bump trigger |
|---------|---------------|--------------|
| Tag / candidate / summary REST shapes | _unversioned at the route_; gated by `axisVersion` on tags | Removal/rename of a documented field |
| Canonical typology export | `schemaVersion` at root + `X-Typology-Export-Schema` header | Removal/rename of any top-level field or row field |
| Pathway report additive fields | _unversioned_; additive only | Hard rule: never breaking |
| Hash-chain algorithm | `lib/pathways/chain.ts` impl | Coordinated across A + C + B |

When breaking the typology export, Scope B MUST:

1. Open a tracking issue tagged `scope-handoff-break`.
2. Notify named subscribers (currently: institutional report consumers) at least one release in advance.
3. Ship the breaking change behind a feature flag where feasible.

---

## 8) Reference files

- `lib/typology/tagService.ts` — tag CRUD + idempotent upsert.
- `lib/typology/candidateService.ts` — queue.
- `lib/typology/summaryService.ts` — drafting, publish, snapshot.
- `lib/typology/typologyEventService.ts` — chain wrapper (wraps `lib/pathways/chain.ts`).
- `lib/typology/axisRegistry.ts` — DB-backed registry reader.
- `lib/typology/subscribers/facilitationSeeder.ts` — Scope C event-bus subscriber.
- `lib/typology/exportService.ts` — canonical export builder.
- `lib/typology/analyticsService.ts` — deliberation rollup.
- `lib/typology/schemas/` — Zod schemas for every request/response.
- `lib/models/schema.prisma` — authoritative row shapes.
