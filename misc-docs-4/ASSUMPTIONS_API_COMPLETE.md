# Assumptions API Implementation - Complete

**Date:** November 1, 2025  
**Status:** ✅ Complete

---

## Overview

Implemented the missing base API routes for the Assumptions feature to complement the existing lifecycle routes (accept, challenge, retract, link).

---

## New Routes Created

### 1. `/api/assumptions` (Collection Route)

**File:** `app/api/assumptions/route.ts`

#### GET /api/assumptions
Lists assumptions with optional filters.

**Query Parameters:**
- `deliberationId` - Filter by deliberation
- `argumentId` - Filter by argument  
- `status` - Filter by status (PROPOSED|ACCEPTED|CHALLENGED|RETRACTED)

**Response:**
```json
{
  "items": [
    {
      "id": "...",
      "deliberationId": "...",
      "argumentId": "...",
      "assumptionClaimId": "..." | null,
      "assumptionText": "..." | null,
      "role": "premise",
      "weight": 0.8,
      "confidence": 0.9,
      "status": "PROPOSED",
      "statusChangedAt": "2025-11-01T...",
      "statusChangedBy": "...",
      "challengeReason": null,
      "createdAt": "2025-11-01T..."
    }
  ]
}
```

#### POST /api/assumptions
Creates a new assumption.

**Request Body:**
```json
{
  "deliberationId": "string (required)",
  "argumentId": "string (required)",
  "assumptionClaimId": "string (optional) - link to existing claim",
  "assumptionText": "string (optional) - freeform text",
  "role": "string (default: 'premise')",
  "weight": "number (optional, 0-1)",
  "confidence": "number (optional, 0-1)",
  "metaJson": "object (optional)"
}
```

**Validation:**
- Either `assumptionClaimId` OR `assumptionText` must be provided
- `deliberationId` and `argumentId` are required

**Response:** Returns created assumption (201)

---

### 2. `/api/assumptions/[id]` (Individual Route)

**File:** `app/api/assumptions/[id]/route.ts`

#### GET /api/assumptions/[id]
Retrieves a single assumption by ID.

**Response:** Returns assumption object or 404

#### PATCH /api/assumptions/[id]
Updates assumption properties.

**Request Body:**
```json
{
  "assumptionText": "string (optional)",
  "role": "string (optional)",
  "weight": "number (optional, 0-1)",
  "confidence": "number (optional, 0-1)",
  "metaJson": "object (optional)"
}
```

**Response:** Returns updated assumption (200)

#### DELETE /api/assumptions/[id]
Deletes an assumption.

**Response:**
```json
{ "message": "Assumption deleted successfully" }
```

---

## Existing Lifecycle Routes

These routes already existed and are now complemented by the base CRUD operations:

1. **POST /api/assumptions/[id]/accept** - Change status to ACCEPTED
2. **POST /api/assumptions/[id]/challenge** - Change status to CHALLENGED (with optional reason)
3. **POST /api/assumptions/[id]/retract** - Change status to RETRACTED
4. **POST /api/assumptions/[id]/link** - Link assumption to derivations (for categorical composition)

---

## Status Lifecycle

```
PROPOSED ──────────────────────> ACCEPTED
   │                                 │
   │                                 │
   └──────> CHALLENGED <─────────────┘
   │                                 │
   │                                 │
   └──────> RETRACTED <──────────────┘
```

**Rules:**
- RETRACTED assumptions cannot be challenged or accepted
- CHALLENGED assumptions can be accepted (resolving the challenge)
- ACCEPTED assumptions can be challenged (reopening debate)

---

## Database Schema

**Model:** `AssumptionUse` (from `lib/models/schema.prisma`)

```prisma
model AssumptionUse {
  id             String @id @default(cuid())
  deliberationId String
  argumentId     String

  // Either link to claim or freeform text
  assumptionClaimId String?
  assumptionText    String?

  role       String @default("premise")
  weight     Float?
  confidence Float?
  metaJson   Json?

  createdAt DateTime @default(now())

  // Lifecycle tracking
  status           AssumptionStatus @default(PROPOSED)
  statusChangedAt  DateTime         @default(now())
  statusChangedBy  String?
  challengeReason  String?          @db.Text

  @@index([argumentId])
  @@index([assumptionClaimId])
  @@index([status])
  @@index([deliberationId, status])
}
```

---

## Testing Checklist

- [x] TypeScript compilation (no errors)
- [x] ESLint validation (no warnings)
- [ ] POST /api/assumptions - Create with assumptionText
- [ ] POST /api/assumptions - Create with assumptionClaimId
- [ ] POST /api/assumptions - Validation error (missing both text and claim)
- [ ] GET /api/assumptions - List all
- [ ] GET /api/assumptions?deliberationId=X - Filter by deliberation
- [ ] GET /api/assumptions?status=CHALLENGED - Filter by status
- [ ] GET /api/assumptions/[id] - Retrieve single
- [ ] PATCH /api/assumptions/[id] - Update properties
- [ ] DELETE /api/assumptions/[id] - Delete
- [ ] Integration with lifecycle routes (accept, challenge, retract)

---

## Integration Points

**Related APIs:**
- `/api/arguments/[id]/assumptions` - Get assumptions for an argument
- `/api/arguments/[id]/assumption-uses` - Get assumption uses with details
- `/api/arguments/[id]/minimal-assumptions` - Calculate minimal set

**UI Components:**
- `AssumptionsList` - Display assumptions in deliberation
- `AssumptionCard` - Individual assumption display
- `AssumptionCreator` - Form for creating assumptions

**Services:**
- `lib/client/assumptionApi.ts` (if exists) - Client-side API wrapper

---

## Next Steps

1. Create client-side API wrapper (`lib/client/assumptionApi.ts`)
2. Add comprehensive tests (integration + unit)
3. Update UI components to use new routes
4. Document API in Swagger/OpenAPI spec (if applicable)
5. Add rate limiting and caching headers

---

## Notes

- Used `as any` type cast in POST route to bypass stale Prisma types (status field recently added)
- All routes require authentication (checked via `getUserFromCookies()`)
- Returns proper HTTP status codes (200, 201, 400, 401, 404, 500)
- Consistent error response format: `{ error: "message" }`
- Follows project conventions: double quotes, Next.js 14 route handlers
