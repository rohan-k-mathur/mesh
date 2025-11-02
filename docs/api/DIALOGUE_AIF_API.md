# Dialogue-Aware AIF API Documentation

**Version:** 1.0  
**Date:** November 2, 2025  
**Status:** Phase 2 Implementation (Planned)

## Overview

This API provides endpoints for fetching and manipulating Argument Interchange Format (AIF) graphs enhanced with dialogue move provenance. These endpoints enable visualization of deliberation dialogues overlaid on argument structures.

**Key Capabilities:**
- Fetch complete AIF graphs with optional dialogue layer
- Query dialogue move provenance for individual nodes
- Filter graphs by participant, time range, or move type
- Reconstruct dialogue timelines with argument context

---

## Authentication

All endpoints require authentication via Supabase session token.

**Authorization Header:**
```
Authorization: Bearer <supabase-jwt-token>
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid session token
- `403 Forbidden` - User lacks permission to access deliberation

---

## Endpoints

### 1. Get Dialogue-Aware AIF Graph

Fetch a complete AIF graph for a deliberation with optional dialogue move layer.

**Endpoint:** `GET /api/aif/graph-with-dialogue`

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `deliberationId` | string | Yes | - | UUID of the deliberation |
| `includeDialogue` | boolean | No | `false` | Include DM-nodes in graph? |
| `includeMoves` | string | No | `"all"` | Filter moves: `"all"`, `"protocol"`, `"structural"` |
| `participantFilter` | string | No | - | Filter to specific user's moves (UUID) |
| `timeRange` | string | No | - | ISO 8601 range: `"start:end"` |
| `maxDepth` | number | No | `3` | Maximum argument neighborhood depth |

**Response Schema:**

```typescript
{
  graph: {
    nodes: AifNodeWithDialogue[];
    edges: DialogueAwareEdge[];
  };
  dialogueMoves: DialogueMoveWithAif[];
  commitmentStores: Record<string, string[]>; // userId -> claimIds[]
  metadata: {
    totalNodes: number;
    dmNodeCount: number;
    moveCount: number;
    generatedAt: string; // ISO 8601
    filters: {
      participant?: string;
      timeRange?: { start: string; end: string };
    };
  };
}
```

**Example Request:**

```bash
curl -X GET "https://mesh.app/api/aif/graph-with-dialogue?deliberationId=delib-123&includeDialogue=true&participantFilter=user-456" \
  -H "Authorization: Bearer eyJhbGc..."
```

**Example Response:**

```json
{
  "graph": {
    "nodes": [
      {
        "id": "DM:move-abc",
        "nodeKind": "DM",
        "nodeSubtype": "WHY",
        "dialogueMoveId": "move-abc",
        "dialogueMetadata": {
          "locution": "question",
          "speaker": "user-456",
          "timestamp": "2025-11-02T14:30:00Z",
          "targetNodeIds": ["RA:arg-xyz"]
        },
        "dialogueMove": {
          "id": "move-abc",
          "kind": "WHY",
          "participantId": "user-456"
        }
      },
      {
        "id": "RA:arg-xyz",
        "nodeKind": "RA",
        "argumentId": "arg-xyz",
        "schemeKey": "expert-opinion",
        "label": "Expert testimony supports claim"
      }
    ],
    "edges": [
      {
        "id": "edge-001",
        "sourceId": "DM:move-abc",
        "targetId": "RA:arg-xyz",
        "edgeRole": "repliesTo",
        "causedByMoveId": "move-abc",
        "metadata": {
          "timestamp": "2025-11-02T14:30:00Z"
        }
      }
    ]
  },
  "dialogueMoves": [
    {
      "id": "move-abc",
      "kind": "WHY",
      "participantId": "user-456",
      "timestamp": "2025-11-02T14:30:00Z",
      "aifRepresentation": "DM:move-abc"
    }
  ],
  "commitmentStores": {
    "user-456": ["claim-001", "claim-002"]
  },
  "metadata": {
    "totalNodes": 2,
    "dmNodeCount": 1,
    "moveCount": 1,
    "generatedAt": "2025-11-02T15:00:00Z",
    "filters": {
      "participant": "user-456"
    }
  }
}
```

**Error Codes:**
- `400 Bad Request` - Invalid deliberationId or filter parameters
- `404 Not Found` - Deliberation does not exist
- `422 Unprocessable Entity` - Invalid timeRange format

---

### 2. Get Node Provenance

Retrieve dialogue move provenance information for a specific AIF node.

**Endpoint:** `GET /api/aif/nodes/[nodeId]/provenance`

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `nodeId` | string | AIF node ID (e.g., `"RA:arg-123"`, `"DM:move-456"`) |

**Response Schema:**

```typescript
{
  node: AifNodeWithDialogue;
  createdBy: {
    dialogueMoveId: string;
    participantId: string;
    timestamp: string;
    kind: string; // Move kind (WHY, ASSERT, etc.)
  } | null;
  causedEdges: {
    id: string;
    targetId: string;
    edgeRole: string;
    moveKind: string;
  }[];
  referencedIn: {
    dialogueMoveId: string;
    participantId: string;
    timestamp: string;
    kind: string;
  }[];
  timeline: {
    event: "created" | "referenced" | "attacked" | "supported";
    moveId: string;
    participantId: string;
    timestamp: string;
  }[];
}
```

**Example Request:**

```bash
curl -X GET "https://mesh.app/api/aif/nodes/RA:arg-123/provenance" \
  -H "Authorization: Bearer eyJhbGc..."
```

**Example Response:**

```json
{
  "node": {
    "id": "RA:arg-123",
    "nodeKind": "RA",
    "argumentId": "arg-123",
    "schemeKey": "modus-ponens",
    "label": "If P then Q; P; therefore Q"
  },
  "createdBy": {
    "dialogueMoveId": "move-001",
    "participantId": "user-alice",
    "timestamp": "2025-11-02T10:00:00Z",
    "kind": "THEREFORE"
  },
  "causedEdges": [
    {
      "id": "edge-101",
      "targetId": "I:claim-999",
      "edgeRole": "conclusion",
      "moveKind": "THEREFORE"
    }
  ],
  "referencedIn": [
    {
      "dialogueMoveId": "move-002",
      "participantId": "user-bob",
      "timestamp": "2025-11-02T10:15:00Z",
      "kind": "WHY"
    },
    {
      "dialogueMoveId": "move-003",
      "participantId": "user-charlie",
      "timestamp": "2025-11-02T10:30:00Z",
      "kind": "REBUT"
    }
  ],
  "timeline": [
    {
      "event": "created",
      "moveId": "move-001",
      "participantId": "user-alice",
      "timestamp": "2025-11-02T10:00:00Z"
    },
    {
      "event": "referenced",
      "moveId": "move-002",
      "participantId": "user-bob",
      "timestamp": "2025-11-02T10:15:00Z"
    },
    {
      "event": "attacked",
      "moveId": "move-003",
      "participantId": "user-charlie",
      "timestamp": "2025-11-02T10:30:00Z"
    }
  ]
}
```

**Error Codes:**
- `400 Bad Request` - Invalid nodeId format
- `404 Not Found` - Node does not exist

---

### 3. Get Dialogue Timeline

Retrieve chronological timeline of dialogue moves with AIF context.

**Endpoint:** `GET /api/aif/dialogue/[deliberationId]/timeline`

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `deliberationId` | string | UUID of the deliberation |

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `participantFilter` | string | No | - | Filter to specific user (UUID) |
| `startDate` | string | No | - | Start of time range (ISO 8601) |
| `endDate` | string | No | - | End of time range (ISO 8601) |
| `limit` | number | No | `100` | Max events to return |
| `offset` | number | No | `0` | Pagination offset |

**Response Schema:**

```typescript
{
  events: {
    id: string;
    timestamp: string;
    participantId: string;
    moveKind: string;
    dmNodeId: string | null;
    affectedNodes: string[]; // AIF node IDs
    affectedEdges: string[]; // AIF edge IDs
    description: string; // Human-readable summary
  }[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}
```

**Example Request:**

```bash
curl -X GET "https://mesh.app/api/aif/dialogue/delib-123/timeline?limit=10&offset=0" \
  -H "Authorization: Bearer eyJhbGc..."
```

**Example Response:**

```json
{
  "events": [
    {
      "id": "move-001",
      "timestamp": "2025-11-02T10:00:00Z",
      "participantId": "user-alice",
      "moveKind": "ASSERT",
      "dmNodeId": "DM:move-001",
      "affectedNodes": ["I:claim-123"],
      "affectedEdges": ["edge-101"],
      "description": "Alice asserted: 'Climate change is accelerating'"
    },
    {
      "id": "move-002",
      "timestamp": "2025-11-02T10:15:00Z",
      "participantId": "user-bob",
      "moveKind": "WHY",
      "dmNodeId": "DM:move-002",
      "affectedNodes": ["I:claim-123"],
      "affectedEdges": ["edge-102"],
      "description": "Bob asked: 'Why do you think that?'"
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

**Error Codes:**
- `400 Bad Request` - Invalid date range or pagination parameters
- `404 Not Found` - Deliberation does not exist

---

### 4. Get Commitment Store

Retrieve current commitment store for all participants in a deliberation.

**Endpoint:** `GET /api/aif/dialogue/[deliberationId]/commitments`

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `deliberationId` | string | UUID of the deliberation |

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `participantId` | string | No | - | Filter to specific participant |
| `asOf` | string | No | `now` | Point-in-time query (ISO 8601) |

**Response Schema:**

```typescript
{
  commitments: Record<string, {
    claimIds: string[];
    claims: {
      id: string;
      text: string;
      committedAt: string;
      committedByMove: string;
      status: "active" | "retracted";
    }[];
  }>;
  metadata: {
    deliberationId: string;
    asOf: string;
    participantCount: number;
  };
}
```

**Example Request:**

```bash
curl -X GET "https://mesh.app/api/aif/dialogue/delib-123/commitments?participantId=user-alice" \
  -H "Authorization: Bearer eyJhbGc..."
```

**Example Response:**

```json
{
  "commitments": {
    "user-alice": {
      "claimIds": ["claim-001", "claim-002"],
      "claims": [
        {
          "id": "claim-001",
          "text": "Climate change is accelerating",
          "committedAt": "2025-11-02T10:00:00Z",
          "committedByMove": "move-001",
          "status": "active"
        },
        {
          "id": "claim-002",
          "text": "Renewable energy is cost-effective",
          "committedAt": "2025-11-02T10:30:00Z",
          "committedByMove": "move-005",
          "status": "active"
        }
      ]
    }
  },
  "metadata": {
    "deliberationId": "delib-123",
    "asOf": "2025-11-02T15:00:00Z",
    "participantCount": 1
  }
}
```

**Error Codes:**
- `400 Bad Request` - Invalid asOf timestamp
- `404 Not Found` - Deliberation does not exist

---

## Rate Limiting

All endpoints are rate-limited to prevent abuse:

- **Authenticated users:** 100 requests per minute
- **Premium users:** 500 requests per minute

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1730563200
```

**Error Response (429 Too Many Requests):**
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 60
}
```

---

## Caching

Responses are cached using `SWR` strategy with the following TTLs:

| Endpoint | Cache TTL | Revalidation |
|----------|-----------|--------------|
| `/graph-with-dialogue` | 5 minutes | On mutation |
| `/nodes/[id]/provenance` | 10 minutes | On mutation |
| `/timeline` | 2 minutes | On mutation |
| `/commitments` | 1 minute | On mutation |

**Cache Headers:**
```
Cache-Control: public, s-maxage=300, stale-while-revalidate=600
```

**Invalidation:** Cache is invalidated when new dialogue moves are created in the deliberation.

---

## Error Handling

All endpoints follow consistent error format:

```json
{
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "deliberationId is required",
    "details": {
      "parameter": "deliberationId",
      "expected": "string (UUID)"
    }
  }
}
```

**Common Error Codes:**

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_PARAMETER` | 400 | Missing or malformed query parameter |
| `UNAUTHORIZED` | 401 | Missing or invalid auth token |
| `FORBIDDEN` | 403 | User lacks permission |
| `NOT_FOUND` | 404 | Resource does not exist |
| `UNPROCESSABLE_ENTITY` | 422 | Valid syntax but semantically incorrect |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## TypeScript SDK

A TypeScript client is available for type-safe API consumption:

```typescript
import { DialogueAifClient } from "@/lib/api/dialogue-aif-client";

const client = new DialogueAifClient({ 
  baseUrl: "https://mesh.app/api",
  token: supabaseSession.access_token 
});

// Fetch graph with dialogue layer
const { graph, dialogueMoves } = await client.getGraphWithDialogue({
  deliberationId: "delib-123",
  includeDialogue: true,
  participantFilter: "user-456"
});

// Get node provenance
const provenance = await client.getNodeProvenance("RA:arg-123");

// Get timeline
const timeline = await client.getDialogueTimeline("delib-123", {
  limit: 50,
  offset: 0
});

// Get commitments
const commitments = await client.getCommitments("delib-123", {
  participantId: "user-alice"
});
```

---

## Performance Considerations

### Graph Query Optimization

- **Indexing:** All foreign keys (deliberationId, dialogueMoveId, sourceId, targetId) are indexed
- **Joins:** Use Prisma's `include` to fetch relations in single query
- **Batch Loading:** Dialogue moves fetched in batches of 100
- **Depth Limiting:** Neighborhood expansion limited to depth 5 (default 3)
- **Node Limiting:** Maximum 200 nodes per graph (configurable)

### Recommended Queries

**Fast Queries (< 100ms):**
- Fetch graph for deliberation with < 50 moves
- Get provenance for single node
- Fetch commitments for single participant

**Moderate Queries (100-500ms):**
- Fetch graph for deliberation with 50-200 moves
- Get timeline with filtering
- Fetch commitments for all participants

**Slow Queries (> 500ms):**
- Fetch graph for deliberation with > 200 moves
- Deep neighborhood expansion (depth > 3)
- Full timeline without pagination

**Optimization Tips:**
- Use `participantFilter` to reduce move count
- Use `timeRange` to limit scope
- Set `includeDialogue=false` if DM-nodes not needed
- Paginate timeline requests

---

## Testing

API endpoints can be tested using the included test suite:

```bash
# Run integration tests
npm run test:integration -- --grep "Dialogue AIF API"

# Test specific endpoint
npm run test:integration -- --grep "GET /api/aif/graph-with-dialogue"
```

**Test Coverage:**
- ✅ Authentication validation
- ✅ Parameter validation
- ✅ Filtering logic (participant, time range)
- ✅ Pagination
- ✅ Error handling
- ✅ Rate limiting
- ✅ Cache headers

---

## Implementation Status

| Endpoint | Status | Target Release |
|----------|--------|----------------|
| `GET /graph-with-dialogue` | 🟡 Planned | Phase 2.1 (Week 3) |
| `GET /nodes/[id]/provenance` | 🟡 Planned | Phase 2.2 (Week 3) |
| `GET /timeline` | 🟡 Planned | Phase 2.3 (Week 4) |
| `GET /commitments` | 🟡 Planned | Phase 2.4 (Week 4) |

**Phase 1 Prerequisites:**
- ✅ Database schema extensions (AifNode, AifEdge)
- ✅ AIF ontology definitions
- ✅ TypeScript type definitions
- 🟡 Migration script (Phase 1.4)

---

## Related Documentation

- **Roadmap:** [`DIALOGUE_VISUALIZATION_ROADMAP.md`](../agora-architecture-review/DIALOGUE_VISUALIZATION_ROADMAP.md)
- **Architecture Review:** [`AIF_DIAGRAM_SYSTEM_ARCHITECTURE_REVIEW.md`](../agora-architecture-review/AIF_DIAGRAM_SYSTEM_ARCHITECTURE_REVIEW.md)
- **Phase 1 Progress:** [`DIALOGUE_VIZ_PHASE_1_PROGRESS.md`](../agora-architecture-review/DIALOGUE_VIZ_PHASE_1_PROGRESS.md)
- **AIF Ontology:** [`lib/aif/ontology.ts`](../../lib/aif/ontology.ts)
- **Type Definitions:** [`types/aif-dialogue.ts`](../../types/aif-dialogue.ts)

---

## Changelog

### Version 1.0 (November 2, 2025)
- Initial API specification
- Defined 4 core endpoints
- Added authentication and rate limiting specs
- Documented error handling and caching strategy
