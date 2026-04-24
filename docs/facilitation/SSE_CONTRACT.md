# Facilitation — Polling & SSE Contract (Scope C, §4 / C2.5)

> Cockpit clients consume facilitation state through three read endpoints:
> session events, interventions, and metrics. v1 defines a **polling**
> contract; an **optional SSE upgrade** path is reserved for C3.

---

## 1. Polling Endpoints

| Channel | Endpoint | Default cadence | Auth | Notes |
|---------|----------|-----------------|------|-------|
| Events | `GET /api/facilitation/sessions/:id/events?cursor=&limit=` | **5 s** | session-scoped read | Append-only; cursor is the last seen `event.id`. Always returns `hashChainValid` so the cockpit can surface tampering. |
| Interventions | `GET /api/facilitation/sessions/:id/interventions?status=&cursor=&limit=` | **5 s** | session-scoped read | Default `status=PENDING` for the active queue; cockpit fetches once with `status=` (all) when opening the history pane. |
| Metrics (current) | `GET /api/deliberations/:id/facilitation/metrics?window=current` | **15 s** | deliberation read | Returns latest snapshot per `EquityMetricKind`. Changes on the metric snapshot worker cadence (every 60 s); polling more often is wasteful. |

### Cadence rationale

- 5 s for events + interventions matches the host's perceived latency for
  intervention recommendations and matches the metric snapshot worker's
  staggered emission window.
- 15 s for metrics aligns with the per-minute snapshot worker; a 5 s poll
  would return identical data 11/12 times.
- Clients SHOULD back off (×2, capped at 60 s) on consecutive empty results
  (events) or on `5xx` responses.

### Pagination

All three list endpoints support `cursor=<id>` + `limit` (max 100). Clients
poll forward only — pass the most recent `id` they have seen as `cursor`.

### Hash-chain attestation (events)

The events response includes:

```jsonc
{
  "items": [...],
  "hashChainValid": true,
  "hashChainFailure": { "failedIndex": 17 }   // present only when invalid
}
```

If `hashChainValid === false`, cockpit MUST surface a non-dismissible banner
("Audit chain mismatch — contact admin") and SHOULD stop accepting writes
from that session.

### Public-read redaction

When a viewer has no facilitator/host/observer role but the session has
`isPublic = true`, all three endpoints redact:

- `actorId` → sha256 first-12-hex over `auth_id`.
- Free-text fields (e.g. `dismissedReasonText`, intervention `noteText`,
  question `text` revisions, event `payloadJson` strings) are replaced with
  shape-preserving summaries.

The redaction is applied **server-side**; clients do not need to detect the
mode.

---

## 2. Write Endpoint Echo (no separate channel)

Write endpoints (`POST` open / close / handoff / lock / apply / dismiss /
revise / reopen / check) return the updated entity in their `2xx` response.
Clients SHOULD optimistically merge the response into local state and rely
on the next poll to reconcile downstream events.

The cockpit MUST treat the polled events stream as the source of truth. If
an optimistic update conflicts with a later event, the event wins.

---

## 3. Optional SSE Upgrade (C3, reserved)

When implemented, an SSE stream will be exposed at:

```
GET /api/facilitation/sessions/:id/stream
Accept: text/event-stream
```

Event types (one per `event:` field):

| `event:` | `data:` payload |
|----------|-----------------|
| `event.appended` | `{ id, eventType, createdAt, hashChainSelf }` |
| `intervention.recommended` | `{ id, kind, recommendedAt }` |
| `intervention.applied` | `{ id, appliedAt, appliedById }` |
| `intervention.dismissed` | `{ id, dismissedAt, dismissedReasonTag }` |
| `metric.snapshot` | `{ metricKind, value, windowEnd, isFinal }` |
| `session.handoff.requested` | `{ handoffId, toFacilitatorId }` |
| `session.handoff.resolved` | `{ handoffId, status }` |
| `session.closed` | `{ status, closedAt }` |
| `chain.invalid` | `{ failedIndex }` (terminal — close the stream) |

Clients SHOULD fall back to polling on SSE disconnect with exponential
backoff (1 s, 2 s, 4 s, … capped at 30 s).

The SSE event payload deliberately omits free-text and large blobs; clients
fetch the full row via the matching REST endpoint when they need details.

---

## 4. Versioning & Compatibility

- Polling cadences above are **client recommendations**; the server enforces
  per-IP rate limits at 4× the recommended rate.
- The SSE channel, when added, is purely additive — clients that ignore it
  will continue to function via polling.
- Any future non-additive change to the polling shape will be exposed via a
  `?v=` query parameter; the un-versioned shape is the v1 contract above.
