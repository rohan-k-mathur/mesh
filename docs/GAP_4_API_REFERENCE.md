# Gap 4: Per-Derivation Assumption Tracking API Reference

## Overview
This document provides comprehensive API reference for the per-derivation assumption tracking system implemented as part of Gap 4 resolution (January 2025).

**Related Documents:**
- `GAP_4_BACKEND_DESIGN.md` - Design specification
- `PHASE_4_COMPLETE.md` - Evidential API integration
- `PHASE_5_COMPLETE.md` - Client wrapper functions

---

## Table of Contents
1. [Database Schema](#database-schema)
2. [API Endpoints](#api-endpoints)
3. [Client Wrappers](#client-wrappers)
4. [Usage Examples](#usage-examples)
5. [Error Handling](#error-handling)
6. [Migration Guide](#migration-guide)

---

## Database Schema

### DerivationAssumption Table

```sql
CREATE TABLE "DerivationAssumption" (
  id              TEXT PRIMARY KEY DEFAULT cuid(),
  derivationId    TEXT NOT NULL REFERENCES "ArgumentSupport"(id) ON DELETE CASCADE,
  assumptionId    TEXT NOT NULL REFERENCES "AssumptionUse"(id) ON DELETE CASCADE,
  weight          REAL NOT NULL DEFAULT 0.6,
  status          TEXT NOT NULL DEFAULT 'ACCEPTED',
  inferredFrom    TEXT REFERENCES "DerivationAssumption"(id) ON DELETE SET NULL,
  createdAt       TIMESTAMP NOT NULL DEFAULT now(),
  updatedAt       TIMESTAMP NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_deriv_assump UNIQUE(derivationId, assumptionId)
);

CREATE INDEX idx_deriv_assumption_derivation ON "DerivationAssumption"(derivationId);
CREATE INDEX idx_deriv_assumption_assumption ON "DerivationAssumption"(assumptionId);
CREATE INDEX idx_deriv_assumption_status ON "DerivationAssumption"(status);
CREATE INDEX idx_deriv_assumption_inferred ON "DerivationAssumption"(inferredFrom);
```

### Field Descriptions

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | string | Yes | cuid() | Unique identifier |
| `derivationId` | string | Yes | - | References `ArgumentSupport.id` |
| `assumptionId` | string | Yes | - | References `AssumptionUse.id` |
| `weight` | number | Yes | 0.6 | Confidence weight (0.0 to 1.0) |
| `status` | enum | Yes | "ACCEPTED" | One of: ACCEPTED, CANDIDATE, REJECTED |
| `inferredFrom` | string? | No | null | Transitive assumption tracking |
| `createdAt` | timestamp | Yes | now() | Record creation time |
| `updatedAt` | timestamp | Yes | now() | Last update time |

### Relationships

```
ArgumentSupport (Derivation)
    ↓ (1:N)
DerivationAssumption
    ↓ (N:1)
AssumptionUse
    ↓ (N:1)
Claim (Assumption Content)
```

---

## API Endpoints

### 1. GET /api/derivations/[id]/assumptions

Fetch all assumptions for a specific derivation.

#### Request

**URL Parameters:**
- `id` (required): Derivation ID (ArgumentSupport.id)

**Query Parameters:**
- `includeAll` (optional): If `"true"`, includes CANDIDATE and REJECTED assumptions. Default: false (only ACCEPTED)

**Example:**
```
GET /api/derivations/cm12345abcde/assumptions
GET /api/derivations/cm12345abcde/assumptions?includeAll=true
```

#### Response

**Status Codes:**
- `200 OK`: Success
- `404 Not Found`: Derivation not found
- `500 Internal Server Error`: Database error

**Body:**
```typescript
{
  ok: boolean;
  derivationId: string;
  assumptions: Array<{
    id: string;
    derivationId: string;
    assumptionId: string;
    weight: number;
    status: "ACCEPTED" | "CANDIDATE" | "REJECTED";
    inferredFrom: string | null;
    createdAt: string;  // ISO 8601
    updatedAt: string;  // ISO 8601
    assumptionUse?: {
      id: string;
      claimId: string;
      claim: {
        text: string;
      };
    };
  }>;
}
```

**Example Response:**
```json
{
  "ok": true,
  "derivationId": "cm12345abcde",
  "assumptions": [
    {
      "id": "cmhf0s9nx00008cxe2pko9rvj",
      "derivationId": "cm12345abcde",
      "assumptionId": "cm98765zyxwv",
      "weight": 0.9,
      "status": "ACCEPTED",
      "inferredFrom": null,
      "createdAt": "2025-01-30T12:34:56Z",
      "updatedAt": "2025-01-30T12:34:56Z",
      "assumptionUse": {
        "id": "cm98765zyxwv",
        "claimId": "cmclaim123",
        "claim": {
          "text": "The data is accurate"
        }
      }
    }
  ]
}
```

---

### 2. POST /api/assumptions/[id]/link

Link an assumption to a derivation (or update existing link). **Idempotent operation.**

#### Request

**URL Parameters:**
- `id` (required): Assumption ID (AssumptionUse.id)

**Headers:**
- `Content-Type: application/json`

**Body:**
```typescript
{
  derivationId: string;        // Required
  weight: number;              // Required (0.0 to 1.0)
  status?: "ACCEPTED" | "CANDIDATE" | "REJECTED";  // Optional (default: "ACCEPTED")
  inferredFrom?: string;       // Optional (transitive assumption ID)
}
```

**Validation:**
- `weight`: Must be between 0 and 1 (inclusive)
- `status`: Must be valid enum value
- `inferredFrom`: Must be valid DerivationAssumption ID or null

**Example:**
```json
POST /api/assumptions/cm98765zyxwv/link
Content-Type: application/json

{
  "derivationId": "cm12345abcde",
  "weight": 0.85,
  "status": "ACCEPTED"
}
```

#### Response

**Status Codes:**
- `200 OK`: Success (created or updated)
- `400 Bad Request`: Invalid body (validation error)
- `404 Not Found`: Assumption not found
- `500 Internal Server Error`: Database error

**Body:**
```typescript
{
  ok: boolean;
  link: {
    id: string;
    derivationId: string;
    assumptionId: string;
    weight: number;
    status: "ACCEPTED" | "CANDIDATE" | "REJECTED";
    inferredFrom: string | null;
    createdAt: string;
    updatedAt: string;
  };
}
```

**Example Response:**
```json
{
  "ok": true,
  "link": {
    "id": "cmnew12345",
    "derivationId": "cm12345abcde",
    "assumptionId": "cm98765zyxwv",
    "weight": 0.85,
    "status": "ACCEPTED",
    "inferredFrom": null,
    "createdAt": "2025-01-30T12:40:00Z",
    "updatedAt": "2025-01-30T12:40:00Z"
  }
}
```

---

### 3. GET /api/arguments/[id]/minimal-assumptions

Compute the minimal set of assumptions for an argument with criticality scores.

#### Request

**URL Parameters:**
- `id` (required): Argument ID

**Example:**
```
GET /api/arguments/cmarg123456/minimal-assumptions
```

#### Response

**Status Codes:**
- `200 OK`: Success
- `404 Not Found`: Argument not found
- `500 Internal Server Error`: Database error

**Body:**
```typescript
{
  ok: boolean;
  argumentId: string;
  minimalSet: Array<{
    assumptionId: string;
    assumptionText: string;
    usedByDerivations: string[];   // Derivation IDs using this assumption
    criticalityScore: number;      // 0.0 to 1.0
  }>;
  meta: {
    totalDerivations: number;
    uniqueAssumptions: number;
  };
}
```

**Criticality Score Formula:**
```
criticalityScore = usedByDerivations.length / totalDerivations
```

A score of 1.0 means this assumption is used by ALL derivations (highly critical).

**Example Response:**
```json
{
  "ok": true,
  "argumentId": "cmarg123456",
  "minimalSet": [
    {
      "assumptionId": "cm98765zyxwv",
      "assumptionText": "The data is accurate",
      "usedByDerivations": ["cm12345abcde", "cm12345fghij"],
      "criticalityScore": 1.0
    },
    {
      "assumptionId": "cm54321abc",
      "assumptionText": "The model is unbiased",
      "usedByDerivations": ["cm12345abcde"],
      "criticalityScore": 0.5
    }
  ],
  "meta": {
    "totalDerivations": 2,
    "uniqueAssumptions": 2
  }
}
```

---

### 4. GET /api/deliberations/[id]/assumption-graph

Fetch the complete assumption dependency graph for a deliberation (suitable for D3.js visualization).

#### Request

**URL Parameters:**
- `id` (required): Deliberation ID

**Example:**
```
GET /api/deliberations/cmdelib123/assumption-graph
```

#### Response

**Status Codes:**
- `200 OK`: Success
- `404 Not Found`: Deliberation not found
- `500 Internal Server Error`: Database error

**Body:**
```typescript
{
  ok: boolean;
  deliberationId: string;
  nodes: Array<{
    id: string;
    type: "claim" | "argument" | "derivation" | "assumption";
    text?: string;
  }>;
  edges: Array<{
    source: string;
    target: string;
    type: "supports" | "uses" | "inferred";
    weight?: number;
  }>;
  meta: {
    claimNodes: number;
    argumentNodes: number;
    derivationNodes: number;
    assumptionNodes: number;
    totalEdges: number;
  };
}
```

**Node Types:**
- `claim`: Deliberation claims (conclusions)
- `argument`: Supporting arguments
- `derivation`: Specific inference paths (ArgumentSupport)
- `assumption`: Background assumptions (AssumptionUse)

**Edge Types:**
- `supports`: Argument → Claim (support relationship)
- `uses`: Derivation → Assumption (depends on)
- `inferred`: Assumption → Assumption (transitive, via `inferredFrom`)

**Example Response:**
```json
{
  "ok": true,
  "deliberationId": "cmdelib123",
  "nodes": [
    {
      "id": "claim1",
      "type": "claim",
      "text": "Climate change is real"
    },
    {
      "id": "arg1",
      "type": "argument",
      "text": "Temperature records show warming trend"
    },
    {
      "id": "deriv1",
      "type": "derivation"
    },
    {
      "id": "assump1",
      "type": "assumption",
      "text": "Temperature data is reliable"
    }
  ],
  "edges": [
    {
      "source": "arg1",
      "target": "claim1",
      "type": "supports"
    },
    {
      "source": "deriv1",
      "target": "assump1",
      "type": "uses",
      "weight": 0.9
    }
  ],
  "meta": {
    "claimNodes": 1,
    "argumentNodes": 1,
    "derivationNodes": 1,
    "assumptionNodes": 1,
    "totalEdges": 2
  }
}
```

---

## Client Wrappers

All client wrapper functions are available in `lib/client/evidential.ts`.

### fetchDerivationAssumptions

```typescript
async function fetchDerivationAssumptions(
  derivationId: string,
  includeAll?: boolean
): Promise<DerivationAssumption[]>
```

**Example:**
```typescript
import { fetchDerivationAssumptions } from "@/lib/client/evidential";

// Get accepted assumptions only
const assumptions = await fetchDerivationAssumptions("cm12345abcde");

// Get all assumptions (including candidates/rejected)
const allAssumptions = await fetchDerivationAssumptions("cm12345abcde", true);

console.log(`Found ${assumptions.length} assumptions`);
```

---

### linkAssumptionToDerivation

```typescript
async function linkAssumptionToDerivation(params: {
  assumptionId: string;
  derivationId: string;
  weight: number;
  status?: "ACCEPTED" | "CANDIDATE" | "REJECTED";
  inferredFrom?: string;
}): Promise<DerivationAssumption>
```

**Example:**
```typescript
import { linkAssumptionToDerivation } from "@/lib/client/evidential";

// Link assumption with high confidence
const link = await linkAssumptionToDerivation({
  assumptionId: "cm98765zyxwv",
  derivationId: "cm12345abcde",
  weight: 0.9
});

console.log(`Linked: ${link.id}`);

// Update existing link (idempotent)
const updated = await linkAssumptionToDerivation({
  assumptionId: "cm98765zyxwv",
  derivationId: "cm12345abcde",
  weight: 0.95  // Updated weight
});
```

---

### fetchMinimalAssumptions

```typescript
async function fetchMinimalAssumptions(
  argumentId: string
): Promise<MinimalAssumptionsResponse>
```

**Example:**
```typescript
import { fetchMinimalAssumptions } from "@/lib/client/evidential";

const result = await fetchMinimalAssumptions("cmarg123456");

console.log(`Argument has ${result.meta.totalDerivations} derivations`);
console.log(`Uses ${result.meta.uniqueAssumptions} assumptions`);

for (const assump of result.minimalSet) {
  console.log(
    `${assump.assumptionText}: ${(assump.criticalityScore * 100).toFixed(0)}% critical`
  );
}
```

---

### fetchAssumptionGraph

```typescript
async function fetchAssumptionGraph(
  deliberationId: string
): Promise<AssumptionGraphResponse>
```

**Example:**
```typescript
import { fetchAssumptionGraph } from "@/lib/client/evidential";
import * as d3 from "d3";

const graph = await fetchAssumptionGraph("cmdelib123");

// Use with D3.js force simulation
const simulation = d3.forceSimulation(graph.nodes)
  .force("link", d3.forceLink(graph.edges).id(d => d.id))
  .force("charge", d3.forceManyBody().strength(-300))
  .force("center", d3.forceCenter(width / 2, height / 2));

console.log(`Graph has ${graph.meta.totalEdges} edges`);
```

---

## Usage Examples

### Example 1: Linking Assumptions to a New Derivation

```typescript
import { linkAssumptionToDerivation } from "@/lib/client/evidential";

async function setupDerivationAssumptions(
  derivationId: string,
  assumptions: Array<{ id: string; weight: number }>
) {
  const links = [];
  
  for (const assump of assumptions) {
    try {
      const link = await linkAssumptionToDerivation({
        assumptionId: assump.id,
        derivationId: derivationId,
        weight: assump.weight
      });
      links.push(link);
      console.log(`✅ Linked assumption ${assump.id} with weight ${assump.weight}`);
    } catch (error) {
      console.error(`❌ Failed to link ${assump.id}:`, error);
    }
  }
  
  return links;
}

// Usage
await setupDerivationAssumptions("cm12345abcde", [
  { id: "assump1", weight: 0.9 },
  { id: "assump2", weight: 0.75 },
  { id: "assump3", weight: 0.6 }
]);
```

---

### Example 2: Displaying Critical Assumptions in UI

```typescript
import { fetchMinimalAssumptions } from "@/lib/client/evidential";

async function renderCriticalAssumptions(argumentId: string) {
  const result = await fetchMinimalAssumptions(argumentId);
  
  // Filter for highly critical assumptions (>80%)
  const critical = result.minimalSet.filter(
    a => a.criticalityScore > 0.8
  );
  
  if (critical.length === 0) {
    return <div>No critical assumptions</div>;
  }
  
  return (
    <div>
      <h3>Critical Assumptions (required for {result.meta.totalDerivations} derivations)</h3>
      <ul>
        {critical.map(assump => (
          <li key={assump.assumptionId}>
            <strong>{assump.assumptionText}</strong>
            <span> ({(assump.criticalityScore * 100).toFixed(0)}% critical)</span>
            <small> Used by: {assump.usedByDerivations.length} derivations</small>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

### Example 3: Visualizing Assumption Dependencies with D3.js

```typescript
import { fetchAssumptionGraph } from "@/lib/client/evidential";
import * as d3 from "d3";

async function renderAssumptionGraph(
  deliberationId: string,
  svgElement: SVGSVGElement
) {
  const graph = await fetchAssumptionGraph(deliberationId);
  
  const width = 800;
  const height = 600;
  
  // Color by node type
  const colorScale = d3.scaleOrdinal()
    .domain(["claim", "argument", "derivation", "assumption"])
    .range(["#4CAF50", "#2196F3", "#FF9800", "#9C27B0"]);
  
  // Create simulation
  const simulation = d3.forceSimulation(graph.nodes)
    .force("link", d3.forceLink(graph.edges)
      .id(d => d.id)
      .distance(100))
    .force("charge", d3.forceManyBody().strength(-300))
    .force("center", d3.forceCenter(width / 2, height / 2));
  
  // Render edges
  const svg = d3.select(svgElement);
  const link = svg.selectAll("line")
    .data(graph.edges)
    .enter().append("line")
    .attr("stroke", "#999")
    .attr("stroke-width", d => d.weight ? d.weight * 3 : 1);
  
  // Render nodes
  const node = svg.selectAll("circle")
    .data(graph.nodes)
    .enter().append("circle")
    .attr("r", 8)
    .attr("fill", d => colorScale(d.type));
  
  // Update positions on tick
  simulation.on("tick", () => {
    link
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);
    
    node
      .attr("cx", d => d.x)
      .attr("cy", d => d.y);
  });
}
```

---

## Error Handling

All endpoints return consistent error responses:

```typescript
{
  ok: false;
  error: string;  // Human-readable error message
}
```

### Common Errors

**404 Not Found:**
```json
{
  "ok": false,
  "error": "Derivation not found"
}
```

**400 Bad Request (Validation):**
```json
{
  "ok": false,
  "error": "weight must be between 0 and 1"
}
```

**500 Internal Server Error:**
```json
{
  "ok": false,
  "error": "Database query failed"
}
```

### Client-Side Error Handling

```typescript
import { linkAssumptionToDerivation } from "@/lib/client/evidential";

try {
  const link = await linkAssumptionToDerivation({
    assumptionId: "invalid-id",
    derivationId: "cm12345",
    weight: 0.9
  });
} catch (error) {
  if (error.message.includes("404")) {
    console.error("Assumption or derivation not found");
  } else if (error.message.includes("400")) {
    console.error("Invalid parameters");
  } else {
    console.error("Unexpected error:", error);
  }
}
```

---

## Migration Guide

### For Existing Code Using AssumptionUse

**Old approach (argument-level):**
```typescript
// Query assumptions per argument
const assumptions = await prisma.assumptionUse.findMany({
  where: { argumentId: "arg123" }
});
```

**New approach (per-derivation):**
```typescript
// 1. Get all derivations for the argument
const derivations = await prisma.argumentSupport.findMany({
  where: { argumentId: "arg123" },
  select: { id: true }
});

// 2. Get per-derivation assumptions
const assumptions = await prisma.derivationAssumption.findMany({
  where: {
    derivationId: { in: derivations.map(d => d.id) }
  },
  include: {
    assumptionUse: {
      include: {
        claim: true
      }
    }
  }
});
```

**Or use the client wrapper:**
```typescript
import { fetchDerivationAssumptions } from "@/lib/client/evidential";

// Fetch for each derivation
const allAssumptions = [];
for (const deriv of derivations) {
  const assumptions = await fetchDerivationAssumptions(deriv.id);
  allAssumptions.push(...assumptions);
}
```

### Backward Compatibility

The evidential API (`/api/deliberations/[id]/evidential`) maintains backward compatibility:

1. **Tries per-derivation first**: Uses `DerivationAssumption` table
2. **Falls back to argument-level**: Uses `AssumptionUse` table if no per-derivation data
3. **Aggregates across derivations**: Combines assumption weights from all derivations

**No migration required for existing deliberations** - they will continue to work using the legacy `AssumptionUse` table until per-derivation data is added.

---

## Performance Considerations

### Indexing

All critical query paths are indexed:
- `derivationId` (most common query)
- `assumptionId` (reverse lookup)
- `status` (filtering)
- `inferredFrom` (transitive queries)

### Caching

Consider caching assumption graph results:
```typescript
import { fetchAssumptionGraph } from "@/lib/client/evidential";
import { cache } from "react";

export const getCachedGraph = cache(async (deliberationId: string) => {
  return fetchAssumptionGraph(deliberationId);
});
```

### Batch Operations

For bulk linking, use transactions:
```typescript
await prisma.$transaction(async (tx) => {
  for (const link of links) {
    await tx.derivationAssumption.upsert({
      where: {
        derivationId_assumptionId: {
          derivationId: link.derivationId,
          assumptionId: link.assumptionId
        }
      },
      create: link,
      update: { weight: link.weight }
    });
  }
});
```

---

## Testing

### Unit Tests

Test files:
- `lib/argumentation/ecc.test.ts` (30 tests, all passing)
- Tests cover: Arrow type, minimalAssumptions(), derivationsUsingAssumption(), compose()

### Integration Tests

Test scripts:
- `scripts/test-endpoints-simple.ts` - Database query verification
- `scripts/test-evidential-integration.ts` - Evidential API integration
- `scripts/verify-phase4.ts` - Quick verification

### Manual Testing

```bash
# Create test data
npx tsx scripts/create-test-data.ts

# Verify database queries
npx tsx scripts/test-endpoints-simple.ts

# Test evidential integration
npx tsx scripts/test-evidential-integration.ts
```

---

## See Also

- `GAP_4_BACKEND_DESIGN.md` - Full implementation design
- `PHASE_4_COMPLETE.md` - Evidential API integration details
- `PHASE_5_COMPLETE.md` - Client wrapper implementation
- `docs/agora-architecture-review/CHUNK_2A_IMPLEMENTATION_STATUS.md` - Gap 4 status update
