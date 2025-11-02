# Phase 2: Dialogue-Aware AIF API Testing Guide

## Overview

Phase 2 implementation is complete. We have created:
- **lib/aif/graph-builder.ts**: Core utility functions for building dialogue-aware AIF graphs
- **3 API endpoints**: For retrieving graphs, node provenance, and commitment stores

## Files Created

### Core Utility (lib/aif/graph-builder.ts)
Functions:
1. `buildDialogueAwareGraph(deliberationId, options)` - Build complete AIF graph with dialogue layer
2. `getNodeProvenance(nodeId)` - Get dialogue move history for a specific node
3. `getCommitmentStores(deliberationId, participantId?, asOf?)` - Track claim commitments over time

### API Endpoints

#### 1. GET /api/aif/graph-with-dialogue
**Purpose**: Retrieve complete AIF graph with dialogue layer

**Query Parameters**:
- `deliberationId` (required): ID of the deliberation
- `participantId` (optional): Filter to specific participant's contributions
- `startTime` (optional): ISO timestamp for time range start
- `endTime` (optional): ISO timestamp for time range end
- `includeDialogue` (optional): Whether to include DM-nodes (default: true)

**Example Request**:
```bash
curl -X GET "http://localhost:3000/api/aif/graph-with-dialogue?deliberationId=YOUR_DELIB_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response Structure**:
```json
{
  "nodes": [
    {
      "id": "uuid",
      "nodeKind": "DM",
      "deliberationId": "uuid",
      "dialogueMoveId": "uuid",
      "dialogueMetadata": {
        "moveKind": "ASSERT",
        "actorId": "bigint",
        "timestamp": "ISO8601"
      }
    }
  ],
  "edges": [
    {
      "id": "uuid",
      "sourceId": "uuid",
      "targetId": "uuid",
      "edgeRole": "triggers",
      "causedByMoveId": "uuid"
    }
  ],
  "dialogueMoves": [
    {
      "id": "uuid",
      "kind": "ASSERT",
      "actorId": "bigint",
      "createdAt": "ISO8601",
      "aifRepresentation": "uuid"
    }
  ],
  "commitmentStores": {
    "userId1": ["claimId1", "claimId2"],
    "userId2": ["claimId3"]
  },
  "metadata": {
    "totalNodes": 100,
    "dmNodeCount": 50,
    "moveCount": 50,
    "generatedAt": "ISO8601"
  }
}
```

#### 2. GET /api/aif/nodes/[nodeId]/provenance
**Purpose**: Get dialogue move provenance for a specific AIF node

**Path Parameters**:
- `nodeId` (required): ID of the AIF node

**Example Request**:
```bash
curl -X GET "http://localhost:3000/api/aif/nodes/YOUR_NODE_ID/provenance" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response Structure**:
```json
{
  "nodeId": "uuid",
  "createdBy": {
    "dialogueMoveId": "uuid",
    "participantId": "bigint",
    "timestamp": "ISO8601",
    "kind": "ASSERT"
  },
  "causedEdges": [
    {
      "id": "uuid",
      "targetId": "uuid",
      "edgeRole": "triggers",
      "moveKind": "WHY"
    }
  ],
  "referencedIn": [
    {
      "dialogueMoveId": "uuid",
      "participantId": "bigint",
      "timestamp": "ISO8601",
      "kind": "GROUNDS"
    }
  ],
  "timeline": [
    {
      "event": "created",
      "timestamp": "ISO8601",
      "participantId": "bigint",
      "details": "Created by ASSERT move"
    }
  ]
}
```

#### 3. GET /api/aif/dialogue/[deliberationId]/commitments
**Purpose**: Get commitment stores for all participants in a deliberation

**Path Parameters**:
- `deliberationId` (required): ID of the deliberation

**Query Parameters**:
- `participantId` (optional): Filter to specific participant
- `asOf` (optional): ISO timestamp to get commitments as of a specific point in time

**Example Request**:
```bash
curl -X GET "http://localhost:3000/api/aif/dialogue/YOUR_DELIB_ID/commitments" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response Structure**:
```json
{
  "userId1": [
    {
      "claimId": "uuid",
      "text": "Claim text",
      "addedAt": "ISO8601",
      "status": "active",
      "addedBy": "ASSERT"
    },
    {
      "claimId": "uuid",
      "text": "Retracted claim",
      "addedAt": "ISO8601",
      "retractedAt": "ISO8601",
      "status": "retracted"
    }
  ],
  "userId2": [...]
}
```

## Testing Steps

### 1. Find a Test Deliberation ID

First, find a deliberation ID to test with:

```sql
-- In Supabase SQL editor
SELECT id, title FROM "Deliberation" LIMIT 5;
```

### 2. Verify Migration Data Exists

Check that the migration created DM-nodes:

```sql
-- Count DM-nodes by deliberation
SELECT 
  "deliberationId",
  COUNT(*) as dm_node_count
FROM aif_nodes
WHERE "nodeKind" = 'DM'
GROUP BY "deliberationId"
LIMIT 10;
```

### 3. Test the Graph API

**Option A: Using curl**
```bash
# Replace YOUR_DELIB_ID with actual deliberation ID
curl -X GET "http://localhost:3000/api/aif/graph-with-dialogue?deliberationId=YOUR_DELIB_ID" \
  -H "Cookie: YOUR_SESSION_COOKIE"
```

**Option B: Using browser**
1. Start dev server: `npm run dev`
2. Open browser and authenticate
3. Navigate to: `http://localhost:3000/api/aif/graph-with-dialogue?deliberationId=YOUR_DELIB_ID`

### 4. Test the Provenance API

Find a node ID first:
```sql
SELECT id, "nodeKind", "dialogueMoveId" 
FROM aif_nodes 
WHERE "nodeKind" = 'DM' 
LIMIT 1;
```

Then test:
```bash
curl -X GET "http://localhost:3000/api/aif/nodes/YOUR_NODE_ID/provenance" \
  -H "Cookie: YOUR_SESSION_COOKIE"
```

### 5. Test the Commitments API

```bash
curl -X GET "http://localhost:3000/api/aif/dialogue/YOUR_DELIB_ID/commitments" \
  -H "Cookie: YOUR_SESSION_COOKIE"
```

### 6. Test Filters

**Filter by participant**:
```
/api/aif/graph-with-dialogue?deliberationId=ID&participantId=USER_ID
```

**Filter by time range**:
```
/api/aif/graph-with-dialogue?deliberationId=ID&startTime=2024-01-01T00:00:00Z&endTime=2024-12-31T23:59:59Z
```

**Exclude dialogue layer**:
```
/api/aif/graph-with-dialogue?deliberationId=ID&includeDialogue=false
```

## Expected Results

### Successful Responses
- Status: 200 OK
- Response body: JSON matching the structures above
- All fields populated with actual data from the database

### Error Cases
- 401 Unauthorized: User not authenticated
- 404 Not Found: Deliberation or node doesn't exist
- 500 Internal Server Error: Database or logic error (check server logs)

## Debugging

If you encounter errors:

1. **Check server logs**: Look for console.error output in terminal
2. **Verify migration**: Ensure 207 DM-nodes exist in database
3. **Check Prisma client**: Run `npx prisma generate` if types are missing
4. **Inspect database**: Use Supabase SQL editor to verify data structure

### Useful Debug Queries

```sql
-- Check DM-nodes exist
SELECT COUNT(*) FROM aif_nodes WHERE "nodeKind" = 'DM';

-- Check edges exist
SELECT COUNT(*) FROM aif_edges WHERE "causedByMoveId" IS NOT NULL;

-- Check DialogueMove links
SELECT COUNT(*) FROM "DialogueMove" WHERE "aifRepresentation" IS NOT NULL;

-- Sample DM-node with metadata
SELECT id, "nodeKind", "dialogueMetadata" 
FROM aif_nodes 
WHERE "nodeKind" = 'DM' 
LIMIT 1;
```

## Next Steps

After successful testing:
1. Create front-end components to visualize dialogue-aware graphs
2. Integrate with existing AIF diagram components
3. Add real-time updates via WebSocket/polling
4. Implement advanced querying (conflict detection, commitment history)

## Notes

- All endpoints require authentication via `getCurrentUserId()`
- Database uses PascalCase for columns (`"deliberationId"`, not `deliberation_id`)
- Prisma types may need `(prisma as any)` cast for AifNode/AifEdge until TypeScript LSP refreshes
- Commitment stores track ASSERT, CONCEDE, THEREFORE (add claims) and RETRACT (remove claims)
- Timeline events show provenance: created, referenced, attacked, supported
