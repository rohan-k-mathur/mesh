# Ludics API Reference

**Version:** 1.0  
**Date:** November 27, 2025  
**Phase 4 Scoped Designs:** Supported  
**Base Path:** `/api/ludics`

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Common Parameters](#common-parameters)
4. [Core Endpoints](#core-endpoints)
   - [Compile](#post-apilud icscompile)
   - [Step](#post-apiludics step)
   - [Compile-Step](#post-apiludicscompile-step)
   - [Designs](#get-apiludicsdesigns)
   - [Acts](#post-apiludicsacts)
5. [Analysis Endpoints](#analysis-endpoints)
   - [Orthogonal](#get-apiludicsorthogonal)
   - [Insights](#get-apiludicsinsights)
6. [Advanced Operations](#advanced-operations)
   - [Fax](#post-apilud icsfax)
   - [Delocate](#post-apiludicsdelocate)
   - [Uniformity](#get-apiludicsuniformitycheck)
7. [Error Codes](#error-codes)
8. [Examples](#examples)

---

## Overview

The Ludics API provides programmatic access to dialogical logic operations for deliberations. All endpoints support **Phase 4 scoped designs** (multi-scope deliberations).

### Base URL

```
https://mesh.app/api/ludics
```

### Content Type

All POST/PUT requests must use:
```
Content-Type: application/json
```

### Response Format

All responses follow this structure:

```typescript
// Success
{
  ok: true,
  data: { ... }
}

// Error
{
  ok: false,
  error: {
    code: string,
    message: string,
    info?: any
  }
}
```

---

## Authentication

All endpoints require authentication via session cookie or API key.

**Session Cookie:**
```bash
Cookie: next-auth.session-token=<token>
```

**API Key (Future):**
```bash
Authorization: Bearer <api-key>
```

---

## Common Parameters

### Deliberation ID

Most endpoints require `deliberationId` to identify the deliberation:

```typescript
deliberationId: string  // Format: "D_<cuid>"
```

### Scope Parameter (Phase 4)

Many endpoints accept optional `scope` parameter for multi-scope operations:

```typescript
scope?: string  // Examples:
                // - null or "legacy" → legacy mode (all moves)
                // - "topic:climate" → topic-based scope
                // - "actors:Alice-Bob" → actor-pair scope
                // - "arg:A_xyz" → argument scope
```

**Behavior:**
- **Omitted/null:** Legacy mode (backward compatible)
- **Provided:** Filters to specified scope only

### Scoping Strategy

For compilation, specify how to group moves into scopes:

```typescript
scopingStrategy?: "legacy" | "topic" | "actor-pair" | "argument"
// Default: "legacy"
```

---

## Core Endpoints

### POST /api/ludics/compile

Compile dialogue moves into Ludics designs.

#### Request Body

```typescript
{
  deliberationId: string;
  scopingStrategy?: "legacy" | "topic" | "actor-pair" | "argument";
  force?: boolean;  // Skip lock check
}
```

#### Response

```typescript
{
  ok: true;
  designs: Array<{
    id: string;
    participantId: "Proponent" | "Opponent";
    scope: string | null;
    scopeType: string | null;
    scopeMetadata: {
      label?: string;
      [key: string]: any;
    } | null;
    actCount: number;
  }>;
  scopes: string[];  // List of unique scopes
}
```

#### Example

```bash
curl -X POST https://mesh.app/api/ludics/compile \
  -H "Content-Type: application/json" \
  -d '{
    "deliberationId": "D_abc123",
    "scopingStrategy": "topic"
  }'
```

```json
{
  "ok": true,
  "designs": [
    {
      "id": "LD_xyz1",
      "participantId": "Proponent",
      "scope": "topic:climate",
      "scopeType": "topic",
      "scopeMetadata": {
        "label": "Climate Policy",
        "topicId": "T_climate"
      },
      "actCount": 12
    },
    {
      "id": "LD_xyz2",
      "participantId": "Opponent",
      "scope": "topic:climate",
      "scopeType": "topic",
      "scopeMetadata": {
        "label": "Climate Policy",
        "topicId": "T_climate"
      },
      "actCount": 8
    }
  ],
  "scopes": ["topic:climate", "topic:budget"]
}
```

#### Notes

- **Idempotent:** Wipes existing designs and recompiles
- **Locking:** Respects compile lock (set `force: true` to override)
- **Performance:** O(N×M) where N=moves, M=scopes

---

### POST /api/ludics/step

Run interaction step between Proponent and Opponent designs.

#### Query Parameters (GET variant)

```
?deliberationId=<id>&scope=<scope>
```

#### Request Body (POST variant)

```typescript
{
  dialogueId: string;  // Same as deliberationId
  posDesignId?: string;  // Optional: specify P design
  negDesignId?: string;  // Optional: specify O design
  scope?: string;  // Optional: filter by scope
  startPosActId?: string;  // Optional: resume from act
  phase?: "neutral" | "proponent-begins" | "opponent-begins";
  fuel?: number;  // Max interaction pairs (default: 1000)
  compositionMode?: "assoc" | "partial" | "spiritual";
  testers?: Array<{  // Consensus testers
    kind: "herd-to" | "timeout-draw";
    parentPath: string;
    child?: string;
    atPath?: string;
  }>;
}
```

#### Response

```typescript
{
  ok: true;
  trace: {
    pairs: Array<{
      posActId: string;
      negActId: string;
      locusPath: string;
    }>;
    status: "converged" | "diverged" | "fuel-exhausted";
    decisiveIndices?: number[];  // Indices of decisive steps
  };
  proId: string;
  oppId: string;
}
```

#### Example (GET with scope)

```bash
curl "https://mesh.app/api/ludics/step?deliberationId=D_abc&scope=topic:climate"
```

```json
{
  "ok": true,
  "trace": {
    "pairs": [
      { "posActId": "LA_1", "negActId": "LA_2", "locusPath": "0.1" },
      { "posActId": "LA_3", "negActId": "LA_4", "locusPath": "0.1.1" }
    ],
    "status": "converged",
    "decisiveIndices": [1]
  },
  "proId": "LD_xyz1",
  "oppId": "LD_xyz2"
}
```

#### Example (POST with testers)

```bash
curl -X POST https://mesh.app/api/ludics/step \
  -H "Content-Type: application/json" \
  -d '{
    "dialogueId": "D_abc",
    "posDesignId": "LD_p1",
    "negDesignId": "LD_o1",
    "fuel": 2048,
    "testers": [
      {
        "kind": "herd-to",
        "parentPath": "0.1",
        "child": "2"
      }
    ]
  }'
```

#### Notes

- **Scope Behavior:** 
  - If `scope` provided: finds P/O in that scope
  - If `posDesignId`/`negDesignId` provided: uses those directly
  - Otherwise: picks first P/O pair found (legacy)
- **Fuel:** Prevents infinite loops; defaults to 1000 pairs
- **Testers:** Guide interaction toward specific outcomes

---

### POST /api/ludics/compile-step

Convenience endpoint: compile then step in one call.

#### Request Body

```typescript
{
  deliberationId: string;
  scopingStrategy?: "legacy" | "topic" | "actor-pair" | "argument";
  scope?: string;  // Which scope to step after compiling
  fuel?: number;
  phase?: "neutral" | "proponent-begins" | "opponent-begins";
}
```

#### Response

Same as `/api/ludics/step` response.

#### Example

```bash
curl -X POST https://mesh.app/api/ludics/compile-step \
  -H "Content-Type: application/json" \
  -d '{
    "deliberationId": "D_abc",
    "scopingStrategy": "topic",
    "scope": "topic:climate"
  }'
```

#### Notes

- **Use Case:** Quick iteration during development
- **Performance:** Same as calling compile + step separately
- **Scope:** Compiles all scopes but only steps specified scope

---

### GET /api/ludics/designs

Fetch all Ludics designs for a deliberation.

#### Query Parameters

```
?deliberationId=<id>&scope=<scope>
```

#### Response

```typescript
{
  ok: true;
  designs: Array<{
    id: string;
    deliberationId: string;
    participantId: "Proponent" | "Opponent";
    scope: string | null;
    scopeType: string | null;
    scopeMetadata: any;
    rootLocusId: string;
    semantics: string;
    hasDaimon: boolean;
    version: number;
    createdAt: string;
    updatedAt: string;
    acts: Array<{
      id: string;
      kind: "PROPER" | "DAIMON";
      polarity: "P" | "O" | null;
      locusPath: string;
      ramification: string[];
      expression: string | null;
      isAdditive: boolean;
      orderInDesign: number;
      metaJson: any;
    }>;
  }>;
}
```

#### Example

```bash
curl "https://mesh.app/api/ludics/designs?deliberationId=D_abc&scope=topic:climate"
```

```json
{
  "ok": true,
  "designs": [
    {
      "id": "LD_p1",
      "participantId": "Proponent",
      "scope": "topic:climate",
      "scopeType": "topic",
      "scopeMetadata": { "label": "Climate Policy" },
      "acts": [
        {
          "id": "LA_1",
          "kind": "PROPER",
          "polarity": "P",
          "locusPath": "0.1",
          "expression": "Carbon tax is effective",
          "ramification": ["1"],
          "isAdditive": false
        }
      ]
    }
  ]
}
```

#### Notes

- **Scope Filter:** If `scope` provided, returns only designs in that scope
- **Acts Included:** Full act tree returned (use with caution for large deliberations)
- **Performance:** O(N) where N = design count

---

### POST /api/ludics/acts

Append acts to an existing design.

#### Request Body

```typescript
{
  designId: string;
  acts: Array<{
    kind: "PROPER" | "DAIMON";
    polarity?: "P" | "O";
    locusPath: string;
    ramification?: string[];
    expression?: string;
    isAdditive?: boolean;
    metaJson?: any;
  }>;
}
```

#### Response

```typescript
{
  ok: true;
  actIds: string[];  // IDs of created acts
}
```

#### Example

```bash
curl -X POST https://mesh.app/api/ludics/acts \
  -H "Content-Type: application/json" \
  -d '{
    "designId": "LD_p1",
    "acts": [
      {
        "kind": "DAIMON",
        "locusPath": "0.1.2"
      }
    ]
  }'
```

```json
{
  "ok": true,
  "actIds": ["LA_new1"]
}
```

#### Notes

- **Use Case:** Manually add convergence markers (daimon) or additional acts
- **Validation:** Checks locus path validity and ramification consistency
- **Order:** Acts appended in order provided

---

## Analysis Endpoints

### GET /api/ludics/orthogonal

Check if Proponent and Opponent designs are orthogonal (converge).

#### Query Parameters

```
?deliberationId=<id>&scope=<scope>
```

#### Response

```typescript
{
  ok: true;
  orthogonal: boolean;
  trace?: {
    pairs: Array<{ posActId: string; negActId: string; locusPath: string }>;
    status: "converged" | "diverged";
  };
}
```

#### Example

```bash
curl "https://mesh.app/api/ludics/orthogonal?deliberationId=D_abc&scope=topic:climate"
```

```json
{
  "ok": true,
  "orthogonal": true,
  "trace": {
    "pairs": [ ... ],
    "status": "converged"
  }
}
```

#### Notes

- **Scope Required (Phase 4):** Always specify scope for meaningful result
- **Legacy Mode:** Omit scope to check global orthogonality (may be meaningless for multi-topic)
- **Performance:** Runs full step interaction internally

---

### GET /api/ludics/insights

Fetch cached Ludics insights for a deliberation.

#### Query Parameters

```
?deliberationId=<id>
```

#### Response

```typescript
{
  ok: true;
  insights: {
    orthogonal: boolean;
    convergencePoint: string | null;
    actCount: number;
    stepCount: number;
    decisiveSteps: number[];
    computedAt: string;
  } | null;
}
```

#### Example

```bash
curl "https://mesh.app/api/ludics/insights?deliberationId=D_abc"
```

```json
{
  "ok": true,
  "insights": {
    "orthogonal": true,
    "convergencePoint": "0.1.2",
    "actCount": 24,
    "stepCount": 12,
    "decisiveSteps": [3, 7, 10],
    "computedAt": "2025-11-27T10:30:00Z"
  }
}
```

#### Notes

- **Caching:** Results cached for 60 seconds
- **Invalidation:** Auto-invalidated on compile/step
- **Scope Support:** Future enhancement (currently global)

---

## Advanced Operations

### POST /api/ludics/fax

Perform fax (delocation) operation to resolve locus path conflicts.

#### Request Body

```typescript
{
  designId: string;
  targetLocusPath: string;
  operation: "shift" | "clone";
  newBasePath?: string;
}
```

#### Response

```typescript
{
  ok: true;
  modifiedActIds: string[];
  newActIds?: string[];  // If operation=clone
}
```

#### Example

```bash
curl -X POST https://mesh.app/api/ludics/fax \
  -H "Content-Type: application/json" \
  -d '{
    "designId": "LD_p1",
    "targetLocusPath": "0.1",
    "operation": "shift",
    "newBasePath": "0.2"
  }'
```

#### Notes

- **Use Case:** Resolve path collisions when merging designs
- **Shift:** Moves acts to new path (destructive)
- **Clone:** Copies acts to new path (preserves original)

---

### POST /api/ludics/delocate

Rename loci to avoid collisions (batch fax operation).

#### Request Body

```typescript
{
  designId: string;
  mappings: Record<string, string>;  // oldPath → newPath
}
```

#### Response

```typescript
{
  ok: true;
  updatedCount: number;
}
```

#### Example

```bash
curl -X POST https://mesh.app/api/ludics/delocate \
  -H "Content-Type: application/json" \
  -d '{
    "designId": "LD_p1",
    "mappings": {
      "0.1": "0.3",
      "0.1.1": "0.3.1"
    }
  }'
```

---

### GET /api/ludics/uniformity/check

Check if a design satisfies uniformity constraints.

#### Query Parameters

```
?designId=<id>
```

#### Response

```typescript
{
  ok: true;
  uniform: boolean;
  violations: Array<{
    locusPath: string;
    reason: string;
  }>;
}
```

#### Example

```bash
curl "https://mesh.app/api/ludics/uniformity/check?designId=LD_p1"
```

```json
{
  "ok": true,
  "uniform": false,
  "violations": [
    {
      "locusPath": "0.1.1",
      "reason": "Inconsistent ramification at additive locus"
    }
  ]
}
```

---

## Error Codes

### Standard Errors

| Code | HTTP Status | Meaning |
|------|-------------|---------|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | User lacks permission for deliberation |
| `NOT_FOUND` | 404 | Deliberation/design/act not found |
| `VALIDATION_ERROR` | 400 | Invalid request body/parameters |
| `INTERNAL` | 500 | Server error |

### Ludics-Specific Errors

| Code | HTTP Status | Meaning |
|------|-------------|---------|
| `COMPILATION_LOCKED` | 423 | Another compilation in progress |
| `NO_DESIGNS` | 404 | No designs found for deliberation/scope |
| `NO_PO_PAIR` | 404 | Missing Proponent or Opponent design |
| `INVALID_LOCUS_PATH` | 400 | Malformed locus path (e.g., "0.1.a") |
| `RAMIFICATION_CONFLICT` | 400 | Ramification doesn't match child loci |
| `DIVERGENCE_DETECTED` | 200 | Not an error; trace status="diverged" |
| `FUEL_EXHAUSTED` | 200 | Not an error; trace status="fuel-exhausted" |

### Error Response Example

```json
{
  "ok": false,
  "error": {
    "code": "NO_PO_PAIR",
    "message": "Missing Proponent design in scope: topic:climate",
    "info": {
      "scope": "topic:climate",
      "foundDesigns": ["LD_o1"]
    }
  }
}
```

---

## Examples

### Example 1: Complete Workflow (Topic Scoping)

```typescript
// 1. Compile with topic scoping
const compileRes = await fetch('/api/ludics/compile', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    deliberationId: 'D_abc',
    scopingStrategy: 'topic'
  })
});
const { designs, scopes } = await compileRes.json();
// scopes = ["topic:climate", "topic:budget"]

// 2. Step each scope
for (const scope of scopes) {
  const stepRes = await fetch(
    `/api/ludics/step?deliberationId=D_abc&scope=${scope}`
  );
  const { trace } = await stepRes.json();
  console.log(`${scope}: ${trace.status}`);
}

// 3. Check orthogonality per scope
for (const scope of scopes) {
  const orthRes = await fetch(
    `/api/ludics/orthogonal?deliberationId=D_abc&scope=${scope}`
  );
  const { orthogonal } = await orthRes.json();
  console.log(`${scope}: ${orthogonal ? 'converged' : 'diverged'}`);
}
```

### Example 2: Append Daimon to Close Discussion

```typescript
// Find Opponent design in scope
const designs = await fetch(
  `/api/ludics/designs?deliberationId=D_abc&scope=topic:climate`
).then(r => r.json());

const oppDesign = designs.designs.find(d => d.participantId === 'Opponent');

// Append daimon at locus 0.1.2
await fetch('/api/ludics/acts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    designId: oppDesign.id,
    acts: [
      {
        kind: 'DAIMON',
        locusPath: '0.1.2'
      }
    ]
  })
});

// Re-step to see convergence
const stepRes = await fetch(
  `/api/ludics/step?deliberationId=D_abc&scope=topic:climate`
);
const { trace } = await stepRes.json();
console.log(trace.status); // "converged"
```

### Example 3: Attach Consensus Testers

```typescript
// Force convergence at locus 0.1 by herding to child 2
await fetch('/api/ludics/step', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    dialogueId: 'D_abc',
    posDesignId: 'LD_p1',
    negDesignId: 'LD_o1',
    fuel: 2048,
    testers: [
      {
        kind: 'herd-to',
        parentPath: '0.1',
        child: '2'
      }
    ]
  })
});
```

### Example 4: Batch Orthogonality Check

```typescript
// Check all scopes in parallel
const deliberationId = 'D_abc';
const scopes = ['topic:climate', 'topic:budget', 'topic:health'];

const results = await Promise.all(
  scopes.map(async (scope) => {
    const res = await fetch(
      `/api/ludics/orthogonal?deliberationId=${deliberationId}&scope=${scope}`
    );
    const { orthogonal } = await res.json();
    return { scope, orthogonal };
  })
);

console.table(results);
// ┌─────────┬──────────────────┬────────────┐
// │ (index) │      scope       │ orthogonal │
// ├─────────┼──────────────────┼────────────┤
// │    0    │ 'topic:climate'  │    true    │
// │    1    │ 'topic:budget'   │   false    │
// │    2    │ 'topic:health'   │    true    │
// └─────────┴──────────────────┴────────────┘
```

---

## Best Practices

### 1. Always Specify Scope (Phase 4)

```typescript
// ❌ Bad (ambiguous with multiple scopes)
await fetch('/api/ludics/step?deliberationId=D_abc');

// ✅ Good (explicit scope)
await fetch('/api/ludics/step?deliberationId=D_abc&scope=topic:climate');
```

### 2. Cache Design IDs

```typescript
// ❌ Bad (fetches designs every time)
for (let i = 0; i < 10; i++) {
  const designs = await fetch('/api/ludics/designs?deliberationId=D_abc');
  // ... use designs
}

// ✅ Good (fetch once, reuse)
const designs = await fetch('/api/ludics/designs?deliberationId=D_abc')
  .then(r => r.json());

for (let i = 0; i < 10; i++) {
  // ... use cached designs
}
```

### 3. Handle Fuel Exhaustion

```typescript
const { trace } = await fetch('/api/ludics/step', { ... }).then(r => r.json());

if (trace.status === 'fuel-exhausted') {
  // Retry with more fuel
  await fetch('/api/ludics/step', {
    body: JSON.stringify({ ...params, fuel: 5000 })
  });
}
```

### 4. Use Compile-Step for Development

```typescript
// ✅ Quick iteration during development
await fetch('/api/ludics/compile-step', {
  method: 'POST',
  body: JSON.stringify({
    deliberationId: 'D_abc',
    scopingStrategy: 'topic',
    scope: 'topic:climate'
  })
});
```

### 5. Parallelize Scope Operations

```typescript
// ✅ Step all scopes in parallel
await Promise.all(
  scopes.map(scope => 
    fetch(`/api/ludics/step?deliberationId=D_abc&scope=${scope}`)
  )
);
```

---

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/compile` | 10 req | 1 min |
| `/step` | 60 req | 1 min |
| `/compile-step` | 10 req | 1 min |
| `/designs` | 120 req | 1 min |
| `/acts` | 30 req | 1 min |
| `/orthogonal` | 60 req | 1 min |

**Note:** Limits are per user, not per deliberation.

---

## Changelog

### Version 1.0 (November 27, 2025)
- Initial API reference documentation
- Phase 4 scoped designs support documented
- All core endpoints documented with examples

---

## Support

For questions or issues:
- **Documentation:** See `SCOPED_DESIGNS_USER_GUIDE.md` for user-facing guide
- **Architecture:** See `LUDICS_SYSTEM_ARCHITECTURE_MAP.md` for technical details
- **Issues:** File bug reports in GitHub repository

---

**Happy building!** 🚀
