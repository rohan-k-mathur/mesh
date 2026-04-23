# Pathways API Contract

Status: Draft v0.1 (A0 deliverable)
Parent: [docs/DelibDemocracyScopeA_Roadmap.md](../DelibDemocracyScopeA_Roadmap.md)
Schema reference: [docs/pathways/MIGRATION_DRAFT.md](MIGRATION_DRAFT.md)

## Conventions

- Base path: `/api`
- Format: JSON. All requests and responses use UTF-8 JSON unless noted.
- Auth: Session cookie via existing Next.js auth middleware. Public read endpoints documented as such.
- Errors: `{ "error": { "code": string, "message": string, "details"?: object } }` with appropriate HTTP status.
- IDs: cuid strings.
- Timestamps: ISO 8601 (UTC).
- Validation: Zod schemas live in `lib/pathways/schemas/`.

## Authorization matrix

| Capability | Required role |
|------|------|
| Create institution | `admin` |
| List institutions | any authenticated user |
| View institution detail | any authenticated user; public for `/public` variant |
| Open pathway | deliberation `host` or `facilitator` |
| Create/edit packet (DRAFT) | deliberation contributor |
| Submit packet | deliberation `host`, `facilitator`, or designated submitter |
| Acknowledge submission | verified `InstitutionMember` of the recipient institution OR `facilitator` (with explicit `channel` annotation) |
| Author response | verified `InstitutionMember` OR `facilitator`-assisted (with `channel` annotation) |
| Add response items | response author |
| Open revision | deliberation `host` or `facilitator` |
| Close pathway | deliberation `host` |
| Read pathway events | deliberation contributor; public if `pathway.isPublic = true` |

## Common error codes

| Code | HTTP | Meaning |
|------|------|---------|
| `UNAUTHORIZED` | 401 | No session. |
| `FORBIDDEN` | 403 | Authenticated but role insufficient. |
| `NOT_FOUND` | 404 | Resource does not exist or visibility hidden. |
| `CONFLICT_PACKET_FROZEN` | 409 | Attempt to mutate a non-DRAFT packet. |
| `CONFLICT_DUPLICATE_SUBMISSION` | 409 | Packet already submitted to this institution. |
| `VALIDATION_ERROR` | 422 | Zod validation failed; `details` includes field errors. |
| `HASH_CHAIN_VIOLATION` | 500 | Internal hash-chain integrity error (should never reach client; logged + paged). |

---

## 1) Institutions

### `POST /api/institutions`

Create an institution. **Admin only.**

Request:
```json
{
  "slug": "city-council-springfield",
  "name": "Springfield City Council",
  "kind": "legislature",
  "jurisdiction": "US-IL-Springfield",
  "contact": {
    "primaryEmail": "clerk@springfield.gov",
    "website": "https://springfield.gov/council"
  },
  "linkedDeliberationId": null
}
```

Response 201:
```json
{
  "institution": {
    "id": "ckxxx...",
    "slug": "city-council-springfield",
    "name": "Springfield City Council",
    "kind": "legislature",
    "jurisdiction": "US-IL-Springfield",
    "verifiedAt": null,
    "linkedDeliberationId": null,
    "createdAt": "2026-04-21T15:04:00Z"
  }
}
```

### `GET /api/institutions`

List institutions.

Query params:
- `kind` — filter by `InstitutionKind`.
- `jurisdiction` — substring match.
- `cursor`, `limit` (default 25, max 100).

Response 200:
```json
{
  "items": [ /* Institution[] */ ],
  "nextCursor": "ckyyy..." | null
}
```

### `GET /api/institutions/[id]`

Detail view.

Response 200:
```json
{
  "institution": { /* Institution */ },
  "members": [ /* InstitutionMember[] */ ],
  "activePathwayCount": 4,
  "responseLatency": {
    "medianAcknowledgementMs": 86400000,
    "medianResponseMs": 1209600000
  }
}
```

---

## 2) Pathways

### `POST /api/deliberations/[id]/pathways`

Open a new pathway from a deliberation to an institution.

Request:
```json
{
  "institutionId": "ckxxx...",
  "subject": "Recommendations on transit equity policy",
  "isPublic": false
}
```

Response 201:
```json
{
  "pathway": {
    "id": "ckpathway...",
    "deliberationId": "ckdelib...",
    "institutionId": "ckxxx...",
    "subject": "Recommendations on transit equity policy",
    "status": "OPEN",
    "isPublic": false,
    "openedAt": "2026-04-21T15:10:00Z",
    "currentPacketId": null
  }
}
```

Side effects:
- Emits `PathwayEvent { eventType: DRAFT_OPENED }`.
- Writes `RoomLogbook { entryType: PATHWAY_OPENED }`.

### `GET /api/deliberations/[id]/pathways`

List pathways for a deliberation.

Response 200:
```json
{
  "items": [
    {
      "id": "ckpathway...",
      "institution": { "id": "...", "name": "...", "kind": "..." },
      "subject": "...",
      "status": "AWAITING_RESPONSE",
      "currentPacketVersion": 2,
      "openedAt": "...",
      "lastEventAt": "..."
    }
  ]
}
```

### `GET /api/pathways/[id]`

Pathway detail with current packet, latest submission, and latest response summary.

Response 200:
```json
{
  "pathway": { /* InstitutionalPathway */ },
  "currentPacket": { /* RecommendationPacket including items */ },
  "latestSubmission": { /* InstitutionalSubmission | null */ },
  "latestResponse": { /* InstitutionalResponse | null */ },
  "metrics": {
    "submissionToAcknowledgementMs": 86400000,
    "acknowledgementToResponseMs": 1209600000,
    "itemDispositionCoverage": 0.83
  }
}
```

### `POST /api/pathways/[id]/revise`

Open a new revision round. Creates a new `RecommendationPacket` with `parentPacketId` set to the prior `currentPacket`.

Request:
```json
{
  "title": "Revised recommendations after council feedback",
  "summary": "Adjustments addressing rejected items in v1."
}
```

Response 201:
```json
{
  "packet": { /* new RecommendationPacket version=N+1 */ }
}
```

Side effects:
- `pathway.status` -> `IN_REVISION`.
- Emits `PathwayEvent { eventType: REVISED }`.
- Writes `RoomLogbook { entryType: PATHWAY_REVISED }`.

### `POST /api/pathways/[id]/close`

Close pathway.

Request:
```json
{ "reason": "Recommendations adopted in resolution 2026-114." }
```

Response 200:
```json
{ "pathway": { "id": "...", "status": "CLOSED", "closedAt": "..." } }
```

### `GET /api/pathways/[id]/events`

Append-only event feed.

Query params:
- `cursor`, `limit` (default 50, max 200).
- `eventType` — optional filter.

Response 200:
```json
{
  "items": [
    {
      "id": "ckevt...",
      "eventType": "SUBMITTED",
      "actor": { "id": "ckuser...", "displayName": "..." },
      "actorRole": "facilitator",
      "payload": { /* event-specific */ },
      "hashChainSelf": "abc123...",
      "hashChainPrev": "...",
      "createdAt": "..."
    }
  ],
  "nextCursor": null,
  "hashChainValid": true
}
```

Public variant: same response if `pathway.isPublic = true`; otherwise 404.

---

## 3) Packets

### `POST /api/pathways/[id]/packets`

Create a draft packet for an open pathway. Fails if `pathway.currentPacket` is already DRAFT (one editable draft at a time).

Request:
```json
{
  "title": "Initial recommendations",
  "summary": "Synthesis of the deliberation's strongest converging arguments."
}
```

Response 201:
```json
{ "packet": { /* RecommendationPacket DRAFT */ } }
```

### `POST /api/packets/[id]/items`

Add an item to a DRAFT packet. Returns 409 `CONFLICT_PACKET_FROZEN` if packet status is not DRAFT.

Request:
```json
{
  "kind": "ARGUMENT",
  "targetType": "argument",
  "targetId": "ckarg...",
  "orderIndex": 3,
  "commentary": "Strongest empirical argument from the climate panel."
}
```

Response 201:
```json
{ "item": { /* RecommendationPacketItem */ } }
```

### `PATCH /api/packets/[id]/items/[itemId]`

Edit commentary or order of a DRAFT packet item.

### `DELETE /api/packets/[id]/items/[itemId]`

Remove a DRAFT packet item. Emits `PathwayEvent { eventType: ITEM_REMOVED }`.

### `POST /api/packets/[id]/submit`

Finalize and submit. Triggers:
1. Snapshot of all items into `snapshotJson` and `snapshotHash`.
2. Creation of `InstitutionalSubmission`.
3. `PathwayEvent { eventType: PACKET_FINALIZED }` then `PathwayEvent { eventType: SUBMITTED }`.
4. `DebateRelease` row linking the packet.
5. `RoomLogbook { entryType: PACKET_SUBMITTED }`.
6. `pathway.status` -> `AWAITING_RESPONSE`, `pathway.currentPacketId` updated.

Request:
```json
{
  "channel": "in_platform",
  "externalReference": null
}
```

Response 200:
```json
{
  "packet": { /* RecommendationPacket SUBMITTED */ },
  "submission": { /* InstitutionalSubmission */ }
}
```

Errors:
- `409 CONFLICT_PACKET_FROZEN` if not DRAFT.
- `409 CONFLICT_DUPLICATE_SUBMISSION` if already submitted to this institution at this version.

---

## 4) Submissions and responses

### `POST /api/submissions/[id]/acknowledge`

Mark a submission as acknowledged by the institution.

Request:
```json
{
  "acknowledgedAt": "2026-04-22T09:00:00Z",
  "channelOverride": null,
  "note": "Received by clerk's office."
}
```

Response 200:
```json
{ "submission": { "id": "...", "acknowledgedAt": "...", "acknowledgedById": "..." } }
```

Side effects: `PathwayEvent { eventType: ACKNOWLEDGED }`.

### `POST /api/submissions/[id]/responses`

Record a structured response. May be authored by an institutional member (in-platform) or a facilitator (assisted intake, with `channel` annotation).

Request:
```json
{
  "respondedAt": "2026-05-10T14:30:00Z",
  "dispositionSummary": "Adopted 4 of 7 recommendations; 2 deferred pending budget review.",
  "responseStatus": "PARTIAL",
  "channelHint": "formal_intake"
}
```

Response 201:
```json
{ "response": { /* InstitutionalResponse */ } }
```

Side effects:
- `PathwayEvent { eventType: RESPONSE_RECEIVED }`.
- `RoomLogbook { entryType: RESPONSE_RECEIVED }`.
- `pathway.status` -> `IN_REVISION` if any item disposition is `MODIFIED` or `REJECTED` (configurable in service layer).

### `POST /api/responses/[id]/items`

Add per-item dispositions.

Request:
```json
{
  "items": [
    {
      "packetItemId": "ckitem1...",
      "disposition": "ACCEPTED",
      "rationaleText": "Aligns with committee priorities.",
      "evidenceCitations": []
    },
    {
      "packetItemId": "ckitem2...",
      "disposition": "REJECTED",
      "rationaleText": "Cost projection exceeded available appropriation.",
      "evidenceCitations": [
        { "uri": "https://...", "title": "FY26 budget brief" }
      ]
    }
  ]
}
```

Response 201:
```json
{ "items": [ /* InstitutionalResponseItem[] */ ] }
```

Side effects:
- One `PathwayEvent { eventType: ITEM_DISPOSITIONED }` per item.
- Recomputes packet-level rollup (derived).

---

## 5) Plexus network extension

### `GET /api/agora/network`

Existing endpoint extended to include institution nodes and two new edge types.

New node type entries:
```json
{
  "id": "inst_ckxxx...",
  "type": "institution",
  "label": "Springfield City Council",
  "kind": "legislature",
  "linkedDeliberationId": null
}
```

New edge type entries:
```json
{
  "id": "pathway_ckpathway...",
  "type": "institutional_pathway",
  "source": "delib_ckdelib...",
  "target": "inst_ckxxx...",
  "metadata": {
    "pathwayId": "ckpathway...",
    "status": "AWAITING_RESPONSE",
    "currentPacketVersion": 2
  }
}
```

```json
{
  "id": "response_ckresp...",
  "type": "pathway_response",
  "source": "inst_ckxxx...",
  "target": "delib_ckdelib...",
  "metadata": {
    "pathwayId": "ckpathway...",
    "responseStatus": "PARTIAL",
    "acceptedRatio": 0.57
  }
}
```

Backwards compatibility: clients filtering by known `type` values continue to work; institution nodes and new edge types are additive.

---

## 6) Public read variants

When `pathway.isPublic = true`:
- `GET /api/pathways/[id]` — accessible without authentication, with private actor data redacted (`actor.displayName` collapsed to organization role).
- `GET /api/pathways/[id]/events` — accessible without authentication.
- All other endpoints remain private.

Visibility gate: pathway public flag AND parent deliberation visibility allow public read (locked decision #3).

---

## 7) Webhook / event hooks (internal, Phase A4)

Internal event bus emits the following for downstream consumers (Scope C cockpit will subscribe):

- `pathway.opened`
- `packet.submitted`
- `submission.acknowledged`
- `response.received`
- `response.item.dispositioned`
- `pathway.revised`
- `pathway.closed`

Payloads include the corresponding entity ID and the originating `PathwayEvent.id`.

---

## 8) OpenAPI generation note

A machine-readable OpenAPI spec will be generated from the Zod schemas in `lib/pathways/schemas/` as part of A2.2 and committed to `docs/pathways/openapi.yaml`. This document is the authoritative source until then.
