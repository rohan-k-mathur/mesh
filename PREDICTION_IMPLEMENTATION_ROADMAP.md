# Claim Prediction & Outcome Tracking — Development Roadmap

**Version**: 1.0  
**Created**: January 31, 2026  
**Status**: In Development  
**Estimated Effort**: 7-9 days

---

## Table of Contents

1. [Overview](#part-1-overview)
2. [Schema Design](#part-2-schema-design)
3. [API Layer](#part-3-api-layer)
4. [Service Layer](#part-4-service-layer)
5. [UI Components](#part-5-ui-components)
6. [Integration Points](#part-6-integration-points)
7. [Testing Strategy](#part-7-testing-strategy)
8. [Rollout Plan](#part-8-rollout-plan)

---

# Part 1: Overview

## 1.1 Feature Summary

**Problem**: Claims in deliberations often make implicit or explicit predictions about the future, but there's no systematic way to track whether these predictions come true. This makes it difficult to assess the reliability of different claims, arguments, and contributors.

**Solution**: Allow users to attach predictions to claims, track outcomes with evidence, and build a track record of prediction accuracy.

## 1.2 User Stories

| ID | As a... | I want to... | So that... |
|----|---------|--------------|------------|
| US-1 | Participant | Attach a prediction to my claim | Others can verify if my reasoning leads to accurate forecasts |
| US-2 | Participant | See predictions others have made | I can evaluate the empirical grounding of claims |
| US-3 | Participant | Record an observed outcome | We can track whether predictions came true |
| US-4 | Moderator | Resolve a prediction with evidence | The community has an official record |
| US-5 | Viewer | See a user's prediction track record | I can assess their forecasting reliability |
| US-6 | System | Identify expired predictions | Users can be reminded to check outcomes |

## 1.3 Key Concepts

| Term | Definition |
|------|------------|
| **Prediction** | A falsifiable statement about future events derived from a claim |
| **Target Date** | When the prediction should be evaluable |
| **Confidence** | Author's stated probability (0.0-1.0) that prediction is correct |
| **Outcome** | Evidence about what actually happened |
| **Resolution** | Final determination: CONFIRMED, DISCONFIRMED, PARTIAL, INDETERMINATE |
| **Track Record** | Aggregate accuracy statistics for a user |

## 1.4 Scope Boundaries

**In Scope:**
- Create/read/update predictions on claims
- Record outcome evidence with links
- Resolve predictions with moderator authority
- Display predictions in claim detail view
- Basic user prediction statistics

**Out of Scope (Future):**
- AI-suggested predictions from claim text
- Prediction markets / betting
- Calibration scoring (Brier scores, log scores)
- Reliability badges on claims/users
- Automated outcome detection
- Community voting on resolutions

---

# Part 2: Schema Design

## 2.1 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Deliberation                             │
└─────────────────────────────────────────────────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                           Claim                                  │
│  + predictions: ClaimPrediction[]                                │
│  + hasPredictions: Boolean                                       │
│  + predictionCount: Int                                          │
│  + confirmedCount: Int                                           │
│  + disconfirmedCount: Int                                        │
└─────────────────────────────────────────────────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ClaimPrediction                             │
│  id: String (cuid)                                               │
│  claimId: String (FK)                                            │
│  deliberationId: String (FK)                                     │
│  predictionText: String                                          │
│  targetDate: DateTime?                                           │
│  confidence: Float (0.0-1.0)                                     │
│  status: PredictionStatus                                        │
│  createdById: String                                             │
│  createdAt: DateTime                                             │
│  resolvedAt: DateTime?                                           │
│  resolvedById: String?                                           │
│  resolution: PredictionResolution?                               │
│  resolutionNote: String?                                         │
└─────────────────────────────────────────────────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                     PredictionOutcome                            │
│  id: String (cuid)                                               │
│  predictionId: String (FK)                                       │
│  outcomeText: String                                             │
│  observedAt: DateTime                                            │
│  evidenceUrl: String?                                            │
│  evidenceType: EvidenceType?                                     │
│  submittedById: String                                           │
│  submittedAt: DateTime                                           │
│  verifiedCount: Int                                              │
│  disputedCount: Int                                              │
└─────────────────────────────────────────────────────────────────┘
```

## 2.2 Prisma Schema

```prisma
// ═══════════════════════════════════════════════════════════════
// CLAIM PREDICTION & OUTCOME TRACKING
// ═══════════════════════════════════════════════════════════════

// Predictions derived from claims - tracks forecasts for verification
model ClaimPrediction {
  id              String   @id @default(cuid())
  
  // ─── Core References ───
  claimId         String
  deliberationId  String
  
  // ─── Prediction Content ───
  predictionText  String   @db.Text       // The actual prediction statement
  targetDate      DateTime?               // When outcome should be observable
  confidence      Float    @default(0.5)  // Author's stated confidence (0.0-1.0)
  
  // ─── Lifecycle ───
  status          PredictionStatus @default(PENDING)
  createdById     String                  // auth_id of creator
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // ─── Resolution ───
  resolvedAt      DateTime?
  resolvedById    String?                 // auth_id of resolver
  resolution      PredictionResolution?
  resolutionNote  String?  @db.Text       // Explanation of resolution
  
  // ─── Relations ───
  claim           Claim        @relation("ClaimPredictions", fields: [claimId], references: [id], onDelete: Cascade)
  deliberation    Deliberation @relation("DeliberationPredictions", fields: [deliberationId], references: [id], onDelete: Cascade)
  outcomes        PredictionOutcome[]
  
  // ─── Indexes ───
  @@index([claimId])
  @@index([deliberationId])
  @@index([deliberationId, status])
  @@index([status])
  @@index([targetDate])
  @@index([createdById])
  @@index([createdById, status])
}

// Prediction lifecycle status
enum PredictionStatus {
  PENDING         // Not yet evaluated - awaiting outcome
  RESOLVED        // Has been resolved with a determination
  WITHDRAWN       // Author withdrew the prediction
  EXPIRED         // Past target date without resolution
}

// Final resolution of a prediction
enum PredictionResolution {
  CONFIRMED           // Prediction was accurate
  DISCONFIRMED        // Prediction was wrong
  PARTIALLY_CONFIRMED // Partially correct
  INDETERMINATE       // Cannot determine (ambiguous, missing data)
}

// Evidence supporting prediction outcomes
model PredictionOutcome {
  id              String   @id @default(cuid())
  predictionId    String
  
  // ─── Outcome Content ───
  outcomeText     String   @db.Text       // Description of what happened
  observedAt      DateTime @default(now()) // When the outcome was observed
  
  // ─── Evidence ───
  evidenceUrl     String?                 // Link to source
  evidenceType    EvidenceType?           // Type of evidence
  evidenceTitle   String?                 // Title/headline of evidence
  
  // ─── Authorship ───
  submittedById   String                  // auth_id of submitter
  submittedAt     DateTime @default(now())
  
  // ─── Community Verification (Future) ───
  verifiedCount   Int      @default(0)    // Users who verified
  disputedCount   Int      @default(0)    // Users who disputed
  
  // ─── Relations ───
  prediction      ClaimPrediction @relation(fields: [predictionId], references: [id], onDelete: Cascade)
  
  // ─── Indexes ───
  @@index([predictionId])
  @@index([submittedById])
  @@index([observedAt])
}

// Type of evidence for outcomes
enum EvidenceType {
  NEWS_ARTICLE    // News report
  OFFICIAL_DATA   // Government or official statistics
  RESEARCH_PAPER  // Academic publication
  PRIMARY_SOURCE  // Original document, recording, etc.
  SOCIAL_MEDIA    // Tweet, post, etc.
  PERSONAL_OBS    // Personal observation
  OTHER           // Other evidence type
}
```

## 2.3 Claim Model Extension

Add to existing `Claim` model:

```prisma
model Claim {
  // ... existing fields ...
  
  // ─── Prediction Tracking ───
  predictions         ClaimPrediction[] @relation("ClaimPredictions")
  hasPredictions      Boolean           @default(false)
  predictionCount     Int               @default(0)
  confirmedCount      Int               @default(0)
  disconfirmedCount   Int               @default(0)
  pendingCount        Int               @default(0)
}
```

## 2.4 Deliberation Model Extension

Add to existing `Deliberation` model:

```prisma
model Deliberation {
  // ... existing fields ...
  
  // ─── Prediction Tracking ───
  predictions         ClaimPrediction[] @relation("DeliberationPredictions")
}
```

## 2.5 Migration SQL (Reference)

```sql
-- CreateEnum
CREATE TYPE "PredictionStatus" AS ENUM ('PENDING', 'RESOLVED', 'WITHDRAWN', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PredictionResolution" AS ENUM ('CONFIRMED', 'DISCONFIRMED', 'PARTIALLY_CONFIRMED', 'INDETERMINATE');

-- CreateEnum
CREATE TYPE "EvidenceType" AS ENUM ('NEWS_ARTICLE', 'OFFICIAL_DATA', 'RESEARCH_PAPER', 'PRIMARY_SOURCE', 'SOCIAL_MEDIA', 'PERSONAL_OBS', 'OTHER');

-- CreateTable
CREATE TABLE "ClaimPrediction" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "deliberationId" TEXT NOT NULL,
    "predictionText" TEXT NOT NULL,
    "targetDate" TIMESTAMP(3),
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "status" "PredictionStatus" NOT NULL DEFAULT 'PENDING',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "resolution" "PredictionResolution",
    "resolutionNote" TEXT,

    CONSTRAINT "ClaimPrediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PredictionOutcome" (
    "id" TEXT NOT NULL,
    "predictionId" TEXT NOT NULL,
    "outcomeText" TEXT NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "evidenceUrl" TEXT,
    "evidenceType" "EvidenceType",
    "evidenceTitle" TEXT,
    "submittedById" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedCount" INTEGER NOT NULL DEFAULT 0,
    "disputedCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PredictionOutcome_pkey" PRIMARY KEY ("id")
);

-- Add columns to Claim
ALTER TABLE "Claim" ADD COLUMN "hasPredictions" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Claim" ADD COLUMN "predictionCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Claim" ADD COLUMN "confirmedCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Claim" ADD COLUMN "disconfirmedCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Claim" ADD COLUMN "pendingCount" INTEGER NOT NULL DEFAULT 0;

-- CreateIndexes
CREATE INDEX "ClaimPrediction_claimId_idx" ON "ClaimPrediction"("claimId");
CREATE INDEX "ClaimPrediction_deliberationId_idx" ON "ClaimPrediction"("deliberationId");
CREATE INDEX "ClaimPrediction_deliberationId_status_idx" ON "ClaimPrediction"("deliberationId", "status");
CREATE INDEX "ClaimPrediction_status_idx" ON "ClaimPrediction"("status");
CREATE INDEX "ClaimPrediction_targetDate_idx" ON "ClaimPrediction"("targetDate");
CREATE INDEX "ClaimPrediction_createdById_idx" ON "ClaimPrediction"("createdById");
CREATE INDEX "ClaimPrediction_createdById_status_idx" ON "ClaimPrediction"("createdById", "status");
CREATE INDEX "PredictionOutcome_predictionId_idx" ON "PredictionOutcome"("predictionId");
CREATE INDEX "PredictionOutcome_submittedById_idx" ON "PredictionOutcome"("submittedById");
CREATE INDEX "PredictionOutcome_observedAt_idx" ON "PredictionOutcome"("observedAt");

-- AddForeignKey
ALTER TABLE "ClaimPrediction" ADD CONSTRAINT "ClaimPrediction_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClaimPrediction" ADD CONSTRAINT "ClaimPrediction_deliberationId_fkey" FOREIGN KEY ("deliberationId") REFERENCES "Deliberation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PredictionOutcome" ADD CONSTRAINT "PredictionOutcome_predictionId_fkey" FOREIGN KEY ("predictionId") REFERENCES "ClaimPrediction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

## 2.6 Type Definitions

```typescript
// types/prediction.ts

export interface ClaimPrediction {
  id: string;
  claimId: string;
  deliberationId: string;
  predictionText: string;
  targetDate: Date | null;
  confidence: number;
  status: PredictionStatus;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
  resolvedById: string | null;
  resolution: PredictionResolution | null;
  resolutionNote: string | null;
  
  // Relations (when included)
  claim?: Claim;
  deliberation?: Deliberation;
  outcomes?: PredictionOutcome[];
  
  // Computed (from API)
  creatorName?: string;
  resolverName?: string;
  outcomeCount?: number;
}

export interface PredictionOutcome {
  id: string;
  predictionId: string;
  outcomeText: string;
  observedAt: Date;
  evidenceUrl: string | null;
  evidenceType: EvidenceType | null;
  evidenceTitle: string | null;
  submittedById: string;
  submittedAt: Date;
  verifiedCount: number;
  disputedCount: number;
  
  // Computed (from API)
  submitterName?: string;
}

export type PredictionStatus = 
  | "PENDING" 
  | "RESOLVED" 
  | "WITHDRAWN" 
  | "EXPIRED";

export type PredictionResolution = 
  | "CONFIRMED" 
  | "DISCONFIRMED" 
  | "PARTIALLY_CONFIRMED" 
  | "INDETERMINATE";

export type EvidenceType = 
  | "NEWS_ARTICLE" 
  | "OFFICIAL_DATA" 
  | "RESEARCH_PAPER" 
  | "PRIMARY_SOURCE" 
  | "SOCIAL_MEDIA" 
  | "PERSONAL_OBS" 
  | "OTHER";

// ─── Request/Response Types ───

export interface CreatePredictionRequest {
  predictionText: string;
  targetDate?: string; // ISO date string
  confidence?: number;
}

export interface CreatePredictionResponse {
  ok: boolean;
  prediction: ClaimPrediction;
}

export interface RecordOutcomeRequest {
  outcomeText: string;
  evidenceUrl?: string;
  evidenceType?: EvidenceType;
  evidenceTitle?: string;
  observedAt?: string; // ISO date string
}

export interface RecordOutcomeResponse {
  ok: boolean;
  outcome: PredictionOutcome;
}

export interface ResolvePredictionRequest {
  resolution: PredictionResolution;
  resolutionNote?: string;
}

export interface ResolvePredictionResponse {
  ok: boolean;
  prediction: ClaimPrediction;
}

export interface PredictionListResponse {
  ok: boolean;
  predictions: ClaimPrediction[];
  total: number;
  hasMore: boolean;
}

export interface UserPredictionStats {
  userId: string;
  totalPredictions: number;
  resolvedCount: number;
  confirmedCount: number;
  disconfirmedCount: number;
  partialCount: number;
  indeterminateCount: number;
  pendingCount: number;
  withdrawnCount: number;
  accuracyRate: number | null; // confirmed / (confirmed + disconfirmed), null if no resolved
  avgConfidence: number;
}
```

---

*Continued in Part 3: API Layer...*

---

# Part 3: API Layer

## 3.1 Endpoint Overview

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/api/deliberation/[id]/claim/[claimId]/prediction` | Create prediction | User |
| GET | `/api/deliberation/[id]/predictions` | List predictions in deliberation | User |
| GET | `/api/prediction/[id]` | Get single prediction with outcomes | User |
| PATCH | `/api/prediction/[id]` | Update prediction (author only) | Author |
| DELETE | `/api/prediction/[id]` | Withdraw prediction (author only) | Author |
| POST | `/api/prediction/[id]/outcome` | Record outcome evidence | User |
| POST | `/api/prediction/[id]/resolve` | Resolve prediction | Moderator |
| GET | `/api/claim/[id]/predictions` | Get predictions for claim | User |
| GET | `/api/user/[id]/predictions` | Get user's prediction track record | User |

## 3.2 Endpoint Specifications

### 3.2.1 Create Prediction

**`POST /api/deliberation/[deliberationId]/claim/[claimId]/prediction`**

Creates a new prediction attached to a claim.

**Request:**
```typescript
interface CreatePredictionRequest {
  predictionText: string;    // Required: The prediction statement
  targetDate?: string;       // Optional: ISO date when outcome expected
  confidence?: number;       // Optional: 0.0-1.0, defaults to 0.5
}
```

**Response (201):**
```typescript
interface CreatePredictionResponse {
  ok: true;
  prediction: {
    id: string;
    claimId: string;
    deliberationId: string;
    predictionText: string;
    targetDate: string | null;
    confidence: number;
    status: "PENDING";
    createdById: string;
    createdAt: string;
    creatorName: string;
  };
}
```

**Errors:**
- 400: Invalid request (missing text, confidence out of range)
- 401: Not authenticated
- 403: Not a participant in deliberation
- 404: Claim or deliberation not found

**Implementation:**
```typescript
// app/api/deliberation/[deliberationId]/claim/[claimId]/prediction/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { getCurrentUserId } from "@/lib/auth";
import { emitBus } from "@/lib/eventBus";

export async function POST(
  request: NextRequest,
  { params }: { params: { deliberationId: string; claimId: string } }
) {
  const { deliberationId, claimId } = params;
  
  // Auth
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  
  // Parse body
  const body = await request.json();
  const { predictionText, targetDate, confidence = 0.5 } = body;
  
  // Validate
  if (!predictionText || typeof predictionText !== "string" || predictionText.trim().length === 0) {
    return NextResponse.json({ ok: false, error: "predictionText is required" }, { status: 400 });
  }
  
  if (confidence < 0 || confidence > 1) {
    return NextResponse.json({ ok: false, error: "confidence must be between 0 and 1" }, { status: 400 });
  }
  
  // Verify claim exists and belongs to deliberation
  const claim = await prisma.claim.findFirst({
    where: { id: claimId, deliberationId },
    select: { id: true, deliberationId: true },
  });
  
  if (!claim) {
    return NextResponse.json({ ok: false, error: "Claim not found" }, { status: 404 });
  }
  
  // Create prediction
  const prediction = await prisma.claimPrediction.create({
    data: {
      claimId,
      deliberationId,
      predictionText: predictionText.trim(),
      targetDate: targetDate ? new Date(targetDate) : null,
      confidence,
      status: "PENDING",
      createdById: userId,
    },
  });
  
  // Update claim counts
  await prisma.claim.update({
    where: { id: claimId },
    data: {
      hasPredictions: true,
      predictionCount: { increment: 1 },
      pendingCount: { increment: 1 },
    },
  });
  
  // Emit event
  emitBus("prediction:created", { predictionId: prediction.id, claimId, deliberationId });
  
  return NextResponse.json({ ok: true, prediction }, { status: 201 });
}
```

---

### 3.2.2 List Predictions in Deliberation

**`GET /api/deliberation/[deliberationId]/predictions`**

Lists predictions with optional filters.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `status` | string | Filter by status (PENDING, RESOLVED, etc.) |
| `claimId` | string | Filter by specific claim |
| `createdById` | string | Filter by creator |
| `limit` | number | Max results (default 50, max 200) |
| `offset` | number | Pagination offset |
| `sort` | string | Sort order: `created`, `targetDate`, `confidence` |
| `order` | string | `asc` or `desc` |

**Response (200):**
```typescript
{
  ok: true,
  predictions: ClaimPrediction[],
  total: number,
  hasMore: boolean,
  limit: number,
  offset: number
}
```

**Implementation:**
```typescript
// app/api/deliberation/[deliberationId]/predictions/route.ts

export async function GET(
  request: NextRequest,
  { params }: { params: { deliberationId: string } }
) {
  const { deliberationId } = params;
  const { searchParams } = new URL(request.url);
  
  const status = searchParams.get("status");
  const claimId = searchParams.get("claimId");
  const createdById = searchParams.get("createdById");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
  const offset = parseInt(searchParams.get("offset") || "0");
  const sort = searchParams.get("sort") || "createdAt";
  const order = searchParams.get("order") || "desc";
  
  const where: Prisma.ClaimPredictionWhereInput = {
    deliberationId,
    ...(status && { status: status as PredictionStatus }),
    ...(claimId && { claimId }),
    ...(createdById && { createdById }),
  };
  
  const [predictions, total] = await Promise.all([
    prisma.claimPrediction.findMany({
      where,
      include: {
        claim: { select: { id: true, text: true } },
        outcomes: { select: { id: true } },
      },
      orderBy: { [sort]: order },
      take: limit,
      skip: offset,
    }),
    prisma.claimPrediction.count({ where }),
  ]);
  
  // Enrich with creator names
  const userIds = [...new Set(predictions.map(p => p.createdById))];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds.map(id => BigInt(id)) } },
    select: { id: true, name: true },
  });
  const userMap = new Map(users.map(u => [u.id.toString(), u.name]));
  
  const enriched = predictions.map(p => ({
    ...p,
    creatorName: userMap.get(p.createdById) || "Unknown",
    outcomeCount: p.outcomes.length,
  }));
  
  return NextResponse.json({
    ok: true,
    predictions: enriched,
    total,
    hasMore: offset + predictions.length < total,
    limit,
    offset,
  });
}
```

---

### 3.2.3 Get Single Prediction

**`GET /api/prediction/[id]`**

Gets a prediction with full details including outcomes.

**Response (200):**
```typescript
{
  ok: true,
  prediction: {
    // ... all fields
    claim: { id, text },
    deliberation: { id, name },
    outcomes: PredictionOutcome[],
    creatorName: string,
    resolverName: string | null
  }
}
```

---

### 3.2.4 Record Outcome

**`POST /api/prediction/[id]/outcome`**

Records evidence about what actually happened.

**Request:**
```typescript
interface RecordOutcomeRequest {
  outcomeText: string;       // Required: Description of what happened
  evidenceUrl?: string;      // Optional: Link to source
  evidenceType?: EvidenceType;
  evidenceTitle?: string;    // Optional: Headline/title
  observedAt?: string;       // Optional: When observed (defaults to now)
}
```

**Response (201):**
```typescript
{
  ok: true,
  outcome: PredictionOutcome
}
```

**Implementation:**
```typescript
// app/api/prediction/[id]/outcome/route.ts

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id: predictionId } = params;
  
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  
  const body = await request.json();
  const { outcomeText, evidenceUrl, evidenceType, evidenceTitle, observedAt } = body;
  
  if (!outcomeText || outcomeText.trim().length === 0) {
    return NextResponse.json({ ok: false, error: "outcomeText is required" }, { status: 400 });
  }
  
  // Verify prediction exists
  const prediction = await prisma.claimPrediction.findUnique({
    where: { id: predictionId },
    select: { id: true, status: true },
  });
  
  if (!prediction) {
    return NextResponse.json({ ok: false, error: "Prediction not found" }, { status: 404 });
  }
  
  if (prediction.status === "WITHDRAWN") {
    return NextResponse.json({ ok: false, error: "Cannot add outcome to withdrawn prediction" }, { status: 400 });
  }
  
  // Create outcome
  const outcome = await prisma.predictionOutcome.create({
    data: {
      predictionId,
      outcomeText: outcomeText.trim(),
      evidenceUrl: evidenceUrl || null,
      evidenceType: evidenceType || null,
      evidenceTitle: evidenceTitle || null,
      observedAt: observedAt ? new Date(observedAt) : new Date(),
      submittedById: userId,
    },
  });
  
  // Emit event
  emitBus("prediction:outcome:added", { predictionId, outcomeId: outcome.id });
  
  return NextResponse.json({ ok: true, outcome }, { status: 201 });
}
```

---

### 3.2.5 Resolve Prediction

**`POST /api/prediction/[id]/resolve`**

Resolves a prediction with a final determination. Requires moderator role or claim owner.

**Request:**
```typescript
interface ResolvePredictionRequest {
  resolution: PredictionResolution;  // CONFIRMED, DISCONFIRMED, etc.
  resolutionNote?: string;           // Optional explanation
}
```

**Response (200):**
```typescript
{
  ok: true,
  prediction: ClaimPrediction  // With updated status and resolution
}
```

**Implementation:**
```typescript
// app/api/prediction/[id]/resolve/route.ts

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id: predictionId } = params;
  
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  
  const body = await request.json();
  const { resolution, resolutionNote } = body;
  
  const validResolutions = ["CONFIRMED", "DISCONFIRMED", "PARTIALLY_CONFIRMED", "INDETERMINATE"];
  if (!resolution || !validResolutions.includes(resolution)) {
    return NextResponse.json({ ok: false, error: "Invalid resolution" }, { status: 400 });
  }
  
  // Get prediction with claim
  const prediction = await prisma.claimPrediction.findUnique({
    where: { id: predictionId },
    include: { claim: true },
  });
  
  if (!prediction) {
    return NextResponse.json({ ok: false, error: "Prediction not found" }, { status: 404 });
  }
  
  if (prediction.status !== "PENDING" && prediction.status !== "EXPIRED") {
    return NextResponse.json({ ok: false, error: "Prediction already resolved or withdrawn" }, { status: 400 });
  }
  
  // Check authorization: prediction creator, claim creator, or moderator
  const canResolve = 
    prediction.createdById === userId ||
    prediction.claim.createdById === userId;
    // TODO: Add moderator check
  
  if (!canResolve) {
    return NextResponse.json({ ok: false, error: "Not authorized to resolve" }, { status: 403 });
  }
  
  // Update prediction
  const updated = await prisma.claimPrediction.update({
    where: { id: predictionId },
    data: {
      status: "RESOLVED",
      resolution,
      resolutionNote: resolutionNote || null,
      resolvedAt: new Date(),
      resolvedById: userId,
    },
  });
  
  // Update claim counts
  const countUpdates: Record<string, { increment?: number; decrement?: number }> = {
    pendingCount: { decrement: 1 },
  };
  
  if (resolution === "CONFIRMED") {
    countUpdates.confirmedCount = { increment: 1 };
  } else if (resolution === "DISCONFIRMED") {
    countUpdates.disconfirmedCount = { increment: 1 };
  }
  
  await prisma.claim.update({
    where: { id: prediction.claimId },
    data: countUpdates,
  });
  
  // Emit event
  emitBus("prediction:resolved", { predictionId, resolution });
  
  return NextResponse.json({ ok: true, prediction: updated });
}
```

---

### 3.2.6 Get User Prediction Track Record

**`GET /api/user/[id]/predictions`**

Gets a user's prediction statistics and history.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `includeHistory` | boolean | Include full prediction list |
| `limit` | number | Max predictions to return |

**Response (200):**
```typescript
{
  ok: true,
  stats: UserPredictionStats,
  predictions?: ClaimPrediction[]  // If includeHistory=true
}
```

**Implementation:**
```typescript
// app/api/user/[id]/predictions/route.ts

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id: targetUserId } = params;
  const { searchParams } = new URL(request.url);
  const includeHistory = searchParams.get("includeHistory") === "true";
  const limit = parseInt(searchParams.get("limit") || "20");
  
  // Get counts by status and resolution
  const predictions = await prisma.claimPrediction.groupBy({
    by: ["status", "resolution"],
    where: { createdById: targetUserId },
    _count: true,
    _avg: { confidence: true },
  });
  
  // Calculate stats
  let total = 0, resolved = 0, confirmed = 0, disconfirmed = 0, partial = 0, indeterminate = 0;
  let pending = 0, withdrawn = 0, expired = 0;
  let confidenceSum = 0, confidenceCount = 0;
  
  for (const row of predictions) {
    const count = row._count;
    total += count;
    
    if (row._avg.confidence) {
      confidenceSum += row._avg.confidence * count;
      confidenceCount += count;
    }
    
    switch (row.status) {
      case "PENDING": pending += count; break;
      case "WITHDRAWN": withdrawn += count; break;
      case "EXPIRED": expired += count; break;
      case "RESOLVED":
        resolved += count;
        switch (row.resolution) {
          case "CONFIRMED": confirmed += count; break;
          case "DISCONFIRMED": disconfirmed += count; break;
          case "PARTIALLY_CONFIRMED": partial += count; break;
          case "INDETERMINATE": indeterminate += count; break;
        }
        break;
    }
  }
  
  const accuracyDenominator = confirmed + disconfirmed;
  const accuracyRate = accuracyDenominator > 0 
    ? confirmed / accuracyDenominator 
    : null;
  
  const stats: UserPredictionStats = {
    userId: targetUserId,
    totalPredictions: total,
    resolvedCount: resolved,
    confirmedCount: confirmed,
    disconfirmedCount: disconfirmed,
    partialCount: partial,
    indeterminateCount: indeterminate,
    pendingCount: pending,
    withdrawnCount: withdrawn,
    accuracyRate,
    avgConfidence: confidenceCount > 0 ? confidenceSum / confidenceCount : 0.5,
  };
  
  // Optionally include history
  let history: ClaimPrediction[] | undefined;
  if (includeHistory) {
    history = await prisma.claimPrediction.findMany({
      where: { createdById: targetUserId },
      include: {
        claim: { select: { id: true, text: true } },
        outcomes: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }
  
  return NextResponse.json({ ok: true, stats, predictions: history });
}
```

---

## 3.3 Event Bus Integration

```typescript
// lib/eventBus.ts - Add prediction events

export type PredictionEventType =
  | "prediction:created"
  | "prediction:updated"
  | "prediction:withdrawn"
  | "prediction:resolved"
  | "prediction:outcome:added";

// Example payloads
interface PredictionCreatedPayload {
  predictionId: string;
  claimId: string;
  deliberationId: string;
}

interface PredictionResolvedPayload {
  predictionId: string;
  resolution: PredictionResolution;
}

interface PredictionOutcomeAddedPayload {
  predictionId: string;
  outcomeId: string;
}
```

---

*Continued in Part 4: Service Layer...*

---

# Part 4: Service Layer

## 4.1 PredictionService

Core service for prediction operations.

```typescript
// services/prediction.ts

import { prisma } from "@/lib/prismaclient";
import { emitBus } from "@/lib/eventBus";
import type { 
  ClaimPrediction, 
  PredictionOutcome, 
  PredictionStatus,
  PredictionResolution,
  UserPredictionStats 
} from "@/types/prediction";

export interface CreatePredictionParams {
  claimId: string;
  deliberationId: string;
  predictionText: string;
  targetDate?: Date;
  confidence?: number;
  createdById: string;
}

export interface RecordOutcomeParams {
  predictionId: string;
  outcomeText: string;
  evidenceUrl?: string;
  evidenceType?: string;
  evidenceTitle?: string;
  observedAt?: Date;
  submittedById: string;
}

export interface ResolvePredictionParams {
  predictionId: string;
  resolution: PredictionResolution;
  resolutionNote?: string;
  resolvedById: string;
}

class PredictionService {
  
  // ═══════════════════════════════════════════════════════════════
  // PREDICTION CRUD
  // ═══════════════════════════════════════════════════════════════
  
  async createPrediction(params: CreatePredictionParams): Promise<ClaimPrediction> {
    const { claimId, deliberationId, predictionText, targetDate, confidence = 0.5, createdById } = params;
    
    // Create prediction
    const prediction = await prisma.claimPrediction.create({
      data: {
        claimId,
        deliberationId,
        predictionText: predictionText.trim(),
        targetDate: targetDate || null,
        confidence: Math.max(0, Math.min(1, confidence)),
        status: "PENDING",
        createdById,
      },
    });
    
    // Update claim aggregates
    await this.updateClaimCounts(claimId);
    
    // Emit event
    emitBus("prediction:created", { predictionId: prediction.id, claimId, deliberationId });
    
    return prediction;
  }
  
  async getPrediction(id: string): Promise<ClaimPrediction | null> {
    return prisma.claimPrediction.findUnique({
      where: { id },
      include: {
        claim: { select: { id: true, text: true, createdById: true } },
        deliberation: { select: { id: true, name: true } },
        outcomes: {
          orderBy: { observedAt: "desc" },
        },
      },
    });
  }
  
  async updatePrediction(
    id: string, 
    data: Partial<Pick<ClaimPrediction, "predictionText" | "targetDate" | "confidence">>
  ): Promise<ClaimPrediction> {
    const prediction = await prisma.claimPrediction.update({
      where: { id },
      data: {
        ...data,
        ...(data.confidence !== undefined && { 
          confidence: Math.max(0, Math.min(1, data.confidence)) 
        }),
      },
    });
    
    emitBus("prediction:updated", { predictionId: id });
    
    return prediction;
  }
  
  async withdrawPrediction(id: string, userId: string): Promise<ClaimPrediction> {
    const prediction = await prisma.claimPrediction.findUnique({
      where: { id },
      select: { createdById: true, status: true, claimId: true },
    });
    
    if (!prediction) throw new Error("Prediction not found");
    if (prediction.createdById !== userId) throw new Error("Not authorized");
    if (prediction.status !== "PENDING") throw new Error("Can only withdraw pending predictions");
    
    const updated = await prisma.claimPrediction.update({
      where: { id },
      data: { status: "WITHDRAWN" },
    });
    
    await this.updateClaimCounts(prediction.claimId);
    emitBus("prediction:withdrawn", { predictionId: id });
    
    return updated;
  }
  
  // ═══════════════════════════════════════════════════════════════
  // OUTCOMES
  // ═══════════════════════════════════════════════════════════════
  
  async recordOutcome(params: RecordOutcomeParams): Promise<PredictionOutcome> {
    const { predictionId, outcomeText, evidenceUrl, evidenceType, evidenceTitle, observedAt, submittedById } = params;
    
    const prediction = await prisma.claimPrediction.findUnique({
      where: { id: predictionId },
      select: { status: true },
    });
    
    if (!prediction) throw new Error("Prediction not found");
    if (prediction.status === "WITHDRAWN") throw new Error("Cannot add outcome to withdrawn prediction");
    
    const outcome = await prisma.predictionOutcome.create({
      data: {
        predictionId,
        outcomeText: outcomeText.trim(),
        evidenceUrl: evidenceUrl || null,
        evidenceType: evidenceType || null,
        evidenceTitle: evidenceTitle || null,
        observedAt: observedAt || new Date(),
        submittedById,
      },
    });
    
    emitBus("prediction:outcome:added", { predictionId, outcomeId: outcome.id });
    
    return outcome;
  }
  
  async getOutcomes(predictionId: string): Promise<PredictionOutcome[]> {
    return prisma.predictionOutcome.findMany({
      where: { predictionId },
      orderBy: { observedAt: "desc" },
    });
  }
  
  // ═══════════════════════════════════════════════════════════════
  // RESOLUTION
  // ═══════════════════════════════════════════════════════════════
  
  async resolvePrediction(params: ResolvePredictionParams): Promise<ClaimPrediction> {
    const { predictionId, resolution, resolutionNote, resolvedById } = params;
    
    const prediction = await prisma.claimPrediction.findUnique({
      where: { id: predictionId },
      select: { status: true, claimId: true },
    });
    
    if (!prediction) throw new Error("Prediction not found");
    if (prediction.status !== "PENDING" && prediction.status !== "EXPIRED") {
      throw new Error("Prediction already resolved or withdrawn");
    }
    
    const updated = await prisma.claimPrediction.update({
      where: { id: predictionId },
      data: {
        status: "RESOLVED",
        resolution,
        resolutionNote: resolutionNote || null,
        resolvedAt: new Date(),
        resolvedById,
      },
    });
    
    await this.updateClaimCounts(prediction.claimId);
    emitBus("prediction:resolved", { predictionId, resolution });
    
    return updated;
  }
  
  // ═══════════════════════════════════════════════════════════════
  // QUERIES
  // ═══════════════════════════════════════════════════════════════
  
  async listForDeliberation(
    deliberationId: string,
    options: {
      status?: PredictionStatus;
      claimId?: string;
      createdById?: string;
      limit?: number;
      offset?: number;
      sort?: string;
      order?: "asc" | "desc";
    } = {}
  ): Promise<{ predictions: ClaimPrediction[]; total: number }> {
    const { status, claimId, createdById, limit = 50, offset = 0, sort = "createdAt", order = "desc" } = options;
    
    const where = {
      deliberationId,
      ...(status && { status }),
      ...(claimId && { claimId }),
      ...(createdById && { createdById }),
    };
    
    const [predictions, total] = await Promise.all([
      prisma.claimPrediction.findMany({
        where,
        include: {
          claim: { select: { id: true, text: true } },
          outcomes: { select: { id: true } },
        },
        orderBy: { [sort]: order },
        take: limit,
        skip: offset,
      }),
      prisma.claimPrediction.count({ where }),
    ]);
    
    return { predictions, total };
  }
  
  async listForClaim(claimId: string): Promise<ClaimPrediction[]> {
    return prisma.claimPrediction.findMany({
      where: { claimId },
      include: {
        outcomes: { orderBy: { observedAt: "desc" } },
      },
      orderBy: { createdAt: "desc" },
    });
  }
  
  async getUserStats(userId: string): Promise<UserPredictionStats> {
    const predictions = await prisma.claimPrediction.groupBy({
      by: ["status", "resolution"],
      where: { createdById: userId },
      _count: true,
      _avg: { confidence: true },
    });
    
    let total = 0, resolved = 0, confirmed = 0, disconfirmed = 0;
    let partial = 0, indeterminate = 0, pending = 0, withdrawn = 0;
    let confidenceSum = 0, confidenceCount = 0;
    
    for (const row of predictions) {
      const count = row._count;
      total += count;
      
      if (row._avg.confidence) {
        confidenceSum += row._avg.confidence * count;
        confidenceCount += count;
      }
      
      switch (row.status) {
        case "PENDING": pending += count; break;
        case "WITHDRAWN": withdrawn += count; break;
        case "RESOLVED":
          resolved += count;
          switch (row.resolution) {
            case "CONFIRMED": confirmed += count; break;
            case "DISCONFIRMED": disconfirmed += count; break;
            case "PARTIALLY_CONFIRMED": partial += count; break;
            case "INDETERMINATE": indeterminate += count; break;
          }
          break;
      }
    }
    
    const denominator = confirmed + disconfirmed;
    
    return {
      userId,
      totalPredictions: total,
      resolvedCount: resolved,
      confirmedCount: confirmed,
      disconfirmedCount: disconfirmed,
      partialCount: partial,
      indeterminateCount: indeterminate,
      pendingCount: pending,
      withdrawnCount: withdrawn,
      accuracyRate: denominator > 0 ? confirmed / denominator : null,
      avgConfidence: confidenceCount > 0 ? confidenceSum / confidenceCount : 0.5,
    };
  }
  
  // ═══════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════
  
  private async updateClaimCounts(claimId: string): Promise<void> {
    const counts = await prisma.claimPrediction.groupBy({
      by: ["status", "resolution"],
      where: { claimId },
      _count: true,
    });
    
    let total = 0, pending = 0, confirmed = 0, disconfirmed = 0;
    
    for (const row of counts) {
      total += row._count;
      if (row.status === "PENDING") pending += row._count;
      if (row.resolution === "CONFIRMED") confirmed += row._count;
      if (row.resolution === "DISCONFIRMED") disconfirmed += row._count;
    }
    
    await prisma.claim.update({
      where: { id: claimId },
      data: {
        hasPredictions: total > 0,
        predictionCount: total,
        pendingCount: pending,
        confirmedCount: confirmed,
        disconfirmedCount: disconfirmed,
      },
    });
  }
  
  // ═══════════════════════════════════════════════════════════════
  // EXPIRATION CHECK (for cron job)
  // ═══════════════════════════════════════════════════════════════
  
  async markExpiredPredictions(): Promise<number> {
    const now = new Date();
    
    const result = await prisma.claimPrediction.updateMany({
      where: {
        status: "PENDING",
        targetDate: { lt: now },
      },
      data: { status: "EXPIRED" },
    });
    
    return result.count;
  }
}

export const predictionService = new PredictionService();
```

## 4.2 Cron Job for Expiration

```typescript
// app/api/_cron/expire-predictions/route.ts

import { NextResponse } from "next/server";
import { predictionService } from "@/services/prediction";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const expiredCount = await predictionService.markExpiredPredictions();
    
    return NextResponse.json({
      ok: true,
      expiredCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to expire predictions:", error);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
```

---

*Continued in Part 5: UI Components...*

---

# Part 5: UI Components

## 5.1 Component Overview

| Component | Purpose | Location |
|-----------|---------|----------|
| `PredictionSection` | Container for predictions on claim detail | `components/predictions/PredictionSection.tsx` |
| `PredictionCard` | Display single prediction | `components/predictions/PredictionCard.tsx` |
| `PredictionCreator` | Modal to create prediction | `components/predictions/PredictionCreator.tsx` |
| `OutcomeRecorder` | Modal to record outcome | `components/predictions/OutcomeRecorder.tsx` |
| `ResolutionModal` | Modal to resolve prediction | `components/predictions/ResolutionModal.tsx` |
| `PredictionBadge` | Small badge on claim card | `components/predictions/PredictionBadge.tsx` |
| `UserPredictionStats` | Track record display | `components/predictions/UserPredictionStats.tsx` |

## 5.2 Component Implementations

### 5.2.1 PredictionSection

Main container for displaying predictions on a claim.

```tsx
// components/predictions/PredictionSection.tsx

"use client";

import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, TrendingUp, TrendingDown, Clock, HelpCircle } from "lucide-react";
import { PredictionCard } from "./PredictionCard";
import { PredictionCreator } from "./PredictionCreator";
import type { ClaimPrediction } from "@/types/prediction";

interface PredictionSectionProps {
  claimId: string;
  deliberationId: string;
  claimText: string;
  canCreate?: boolean;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function PredictionSection({ 
  claimId, 
  deliberationId, 
  claimText,
  canCreate = true 
}: PredictionSectionProps) {
  const [showCreator, setShowCreator] = useState(false);
  
  const { data, mutate, isLoading } = useSWR<{ 
    ok: boolean; 
    predictions: ClaimPrediction[] 
  }>(
    `/api/claim/${claimId}/predictions`,
    fetcher
  );
  
  const predictions = data?.predictions || [];
  
  // Calculate stats
  const stats = {
    total: predictions.length,
    pending: predictions.filter(p => p.status === "PENDING").length,
    confirmed: predictions.filter(p => p.resolution === "CONFIRMED").length,
    disconfirmed: predictions.filter(p => p.resolution === "DISCONFIRMED").length,
  };
  
  const handleCreated = () => {
    setShowCreator(false);
    mutate();
  };
  
  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Predictions
            {stats.total > 0 && (
              <Badge variant="secondary">{stats.total}</Badge>
            )}
          </CardTitle>
          
          {canCreate && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setShowCreator(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Prediction
            </Button>
          )}
        </div>
        
        {/* Stats summary */}
        {stats.total > 0 && (
          <div className="flex gap-3 mt-2 text-sm text-muted-foreground">
            {stats.pending > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {stats.pending} pending
              </span>
            )}
            {stats.confirmed > 0 && (
              <span className="flex items-center gap-1 text-green-600">
                <TrendingUp className="h-3 w-3" />
                {stats.confirmed} confirmed
              </span>
            )}
            {stats.disconfirmed > 0 && (
              <span className="flex items-center gap-1 text-red-600">
                <TrendingDown className="h-3 w-3" />
                {stats.disconfirmed} disconfirmed
              </span>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading predictions...</div>
        ) : predictions.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-6">
            <HelpCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            No predictions yet.
            <br />
            <span className="text-xs">
              Add a prediction to track whether this claim leads to accurate forecasts.
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            {predictions.map(prediction => (
              <PredictionCard 
                key={prediction.id} 
                prediction={prediction}
                onUpdate={() => mutate()}
              />
            ))}
          </div>
        )}
      </CardContent>
      
      {/* Creator Modal */}
      <PredictionCreator
        open={showCreator}
        onOpenChange={setShowCreator}
        claimId={claimId}
        deliberationId={deliberationId}
        claimText={claimText}
        onCreated={handleCreated}
      />
    </Card>
  );
}
```

---

### 5.2.2 PredictionCard

Displays a single prediction with status and actions.

```tsx
// components/predictions/PredictionCard.tsx

"use client";

import { useState } from "react";
import { formatDistanceToNow, format, isPast } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Plus,
  Gavel
} from "lucide-react";
import { OutcomeRecorder } from "./OutcomeRecorder";
import { ResolutionModal } from "./ResolutionModal";
import type { ClaimPrediction } from "@/types/prediction";

interface PredictionCardProps {
  prediction: ClaimPrediction;
  onUpdate: () => void;
}

const STATUS_CONFIG = {
  PENDING: { 
    icon: Clock, 
    color: "bg-yellow-100 text-yellow-800", 
    label: "Pending" 
  },
  RESOLVED: { 
    icon: CheckCircle, 
    color: "bg-green-100 text-green-800", 
    label: "Resolved" 
  },
  WITHDRAWN: { 
    icon: XCircle, 
    color: "bg-gray-100 text-gray-800", 
    label: "Withdrawn" 
  },
  EXPIRED: { 
    icon: AlertCircle, 
    color: "bg-orange-100 text-orange-800", 
    label: "Expired" 
  },
};

const RESOLUTION_CONFIG = {
  CONFIRMED: { color: "bg-green-500", label: "Confirmed ✓" },
  DISCONFIRMED: { color: "bg-red-500", label: "Disconfirmed ✗" },
  PARTIALLY_CONFIRMED: { color: "bg-yellow-500", label: "Partial" },
  INDETERMINATE: { color: "bg-gray-500", label: "Indeterminate" },
};

export function PredictionCard({ prediction, onUpdate }: PredictionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showOutcomeModal, setShowOutcomeModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  
  const statusConfig = STATUS_CONFIG[prediction.status];
  const StatusIcon = statusConfig.icon;
  
  const isOverdue = prediction.targetDate && isPast(new Date(prediction.targetDate)) && prediction.status === "PENDING";
  const outcomeCount = prediction.outcomes?.length || 0;
  
  return (
    <>
      <Card className={`${prediction.status === "WITHDRAWN" ? "opacity-60" : ""}`}>
        <CardContent className="p-4">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              {/* Prediction text */}
              <p className="font-medium text-sm">
                "{prediction.predictionText}"
              </p>
              
              {/* Metadata row */}
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
                {/* Status badge */}
                <Badge variant="outline" className={statusConfig.color}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusConfig.label}
                </Badge>
                
                {/* Resolution badge */}
                {prediction.resolution && (
                  <Badge className={RESOLUTION_CONFIG[prediction.resolution].color}>
                    {RESOLUTION_CONFIG[prediction.resolution].label}
                  </Badge>
                )}
                
                {/* Confidence */}
                <span title="Author's confidence">
                  {Math.round(prediction.confidence * 100)}% confident
                </span>
                
                {/* Target date */}
                {prediction.targetDate && (
                  <span className={isOverdue ? "text-orange-600 font-medium" : ""}>
                    Target: {format(new Date(prediction.targetDate), "MMM d, yyyy")}
                    {isOverdue && " (overdue)"}
                  </span>
                )}
                
                {/* Created */}
                <span>
                  by {prediction.creatorName || "Unknown"} • {formatDistanceToNow(new Date(prediction.createdAt), { addSuffix: true })}
                </span>
              </div>
            </div>
            
            {/* Expand/collapse */}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {outcomeCount > 0 && (
                <span className="ml-1 text-xs">{outcomeCount} outcomes</span>
              )}
            </Button>
          </div>
          
          {/* Expanded content */}
          {expanded && (
            <div className="mt-4 pt-4 border-t">
              {/* Outcomes */}
              {prediction.outcomes && prediction.outcomes.length > 0 ? (
                <div className="space-y-2 mb-4">
                  <h4 className="text-sm font-medium">Recorded Outcomes</h4>
                  {prediction.outcomes.map(outcome => (
                    <div key={outcome.id} className="text-sm bg-muted p-2 rounded">
                      <p>{outcome.outcomeText}</p>
                      {outcome.evidenceUrl && (
                        <a 
                          href={outcome.evidenceUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-xs"
                        >
                          {outcome.evidenceTitle || "View evidence"}
                        </a>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Observed {format(new Date(outcome.observedAt), "MMM d, yyyy")}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mb-4">
                  No outcomes recorded yet.
                </p>
              )}
              
              {/* Resolution note */}
              {prediction.resolutionNote && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium">Resolution Note</h4>
                  <p className="text-sm text-muted-foreground">{prediction.resolutionNote}</p>
                </div>
              )}
              
              {/* Actions */}
              {prediction.status === "PENDING" || prediction.status === "EXPIRED" ? (
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setShowOutcomeModal(true)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Record Outcome
                  </Button>
                  <Button 
                    size="sm" 
                    variant="default"
                    onClick={() => setShowResolveModal(true)}
                  >
                    <Gavel className="h-3 w-3 mr-1" />
                    Resolve
                  </Button>
                </div>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Modals */}
      <OutcomeRecorder
        open={showOutcomeModal}
        onOpenChange={setShowOutcomeModal}
        predictionId={prediction.id}
        onRecorded={() => {
          setShowOutcomeModal(false);
          onUpdate();
        }}
      />
      
      <ResolutionModal
        open={showResolveModal}
        onOpenChange={setShowResolveModal}
        prediction={prediction}
        onResolved={() => {
          setShowResolveModal(false);
          onUpdate();
        }}
      />
    </>
  );
}
```

---

### 5.2.3 PredictionCreator

Modal for creating a new prediction.

```tsx
// components/predictions/PredictionCreator.tsx

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Lightbulb } from "lucide-react";

const schema = z.object({
  predictionText: z.string().min(10, "Prediction must be at least 10 characters"),
  targetDate: z.string().optional(),
  confidence: z.number().min(0).max(1),
});

type FormData = z.infer<typeof schema>;

interface PredictionCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  claimId: string;
  deliberationId: string;
  claimText: string;
  onCreated: () => void;
}

export function PredictionCreator({
  open,
  onOpenChange,
  claimId,
  deliberationId,
  claimText,
  onCreated,
}: PredictionCreatorProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      predictionText: "",
      targetDate: "",
      confidence: 0.5,
    },
  });
  
  const confidence = watch("confidence");
  
  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/deliberation/${deliberationId}/claim/${claimId}/prediction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          predictionText: data.predictionText,
          targetDate: data.targetDate || undefined,
          confidence: data.confidence,
        }),
      });
      
      const result = await response.json();
      
      if (!result.ok) {
        throw new Error(result.error || "Failed to create prediction");
      }
      
      reset();
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Prediction</DialogTitle>
          <DialogDescription>
            Create a falsifiable prediction based on this claim. This helps track whether the claim leads to accurate forecasts.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Source claim */}
          <div className="mb-4 p-3 bg-muted rounded-md text-sm">
            <span className="font-medium">Based on claim:</span>
            <p className="mt-1 text-muted-foreground">"{claimText}"</p>
          </div>
          
          {/* Prediction text */}
          <div className="space-y-2 mb-4">
            <Label htmlFor="predictionText">Prediction</Label>
            <Textarea
              id="predictionText"
              placeholder="If this claim is correct, then..."
              {...register("predictionText")}
              rows={3}
            />
            {errors.predictionText && (
              <p className="text-sm text-red-600">{errors.predictionText.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              <Lightbulb className="h-3 w-3 inline mr-1" />
              Tip: Make your prediction specific and falsifiable.
            </p>
          </div>
          
          {/* Target date */}
          <div className="space-y-2 mb-4">
            <Label htmlFor="targetDate">Target Date (optional)</Label>
            <Input
              id="targetDate"
              type="date"
              {...register("targetDate")}
            />
            <p className="text-xs text-muted-foreground">
              When should we check if this prediction came true?
            </p>
          </div>
          
          {/* Confidence slider */}
          <div className="space-y-2 mb-6">
            <Label>Your Confidence: {Math.round(confidence * 100)}%</Label>
            <Slider
              value={[confidence]}
              onValueChange={([v]) => setValue("confidence", v)}
              min={0}
              max={1}
              step={0.05}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Very unlikely</span>
              <span>50/50</span>
              <span>Very likely</span>
            </div>
          </div>
          
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Prediction
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

---

### 5.2.4 OutcomeRecorder

Modal for recording outcome evidence.

```tsx
// components/predictions/OutcomeRecorder.tsx

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import type { EvidenceType } from "@/types/prediction";

interface OutcomeRecorderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  predictionId: string;
  onRecorded: () => void;
}

const EVIDENCE_TYPES: { value: EvidenceType; label: string }[] = [
  { value: "NEWS_ARTICLE", label: "News Article" },
  { value: "OFFICIAL_DATA", label: "Official Data" },
  { value: "RESEARCH_PAPER", label: "Research Paper" },
  { value: "PRIMARY_SOURCE", label: "Primary Source" },
  { value: "SOCIAL_MEDIA", label: "Social Media" },
  { value: "PERSONAL_OBS", label: "Personal Observation" },
  { value: "OTHER", label: "Other" },
];

interface FormData {
  outcomeText: string;
  evidenceUrl: string;
  evidenceType: EvidenceType | "";
  evidenceTitle: string;
  observedAt: string;
}

export function OutcomeRecorder({
  open,
  onOpenChange,
  predictionId,
  onRecorded,
}: OutcomeRecorderProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      outcomeText: "",
      evidenceUrl: "",
      evidenceType: "",
      evidenceTitle: "",
      observedAt: new Date().toISOString().split("T")[0],
    },
  });
  
  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/prediction/${predictionId}/outcome`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outcomeText: data.outcomeText,
          evidenceUrl: data.evidenceUrl || undefined,
          evidenceType: data.evidenceType || undefined,
          evidenceTitle: data.evidenceTitle || undefined,
          observedAt: data.observedAt || undefined,
        }),
      });
      
      const result = await response.json();
      
      if (!result.ok) {
        throw new Error(result.error || "Failed to record outcome");
      }
      
      reset();
      onRecorded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Record Outcome</DialogTitle>
          <DialogDescription>
            Document what actually happened. Include evidence if available.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Outcome text */}
          <div className="space-y-2 mb-4">
            <Label htmlFor="outcomeText">What happened?</Label>
            <Textarea
              id="outcomeText"
              placeholder="Describe the observed outcome..."
              {...register("outcomeText", { required: "Outcome description is required" })}
              rows={3}
            />
            {errors.outcomeText && (
              <p className="text-sm text-red-600">{errors.outcomeText.message}</p>
            )}
          </div>
          
          {/* Observed date */}
          <div className="space-y-2 mb-4">
            <Label htmlFor="observedAt">When observed</Label>
            <Input
              id="observedAt"
              type="date"
              {...register("observedAt")}
            />
          </div>
          
          {/* Evidence URL */}
          <div className="space-y-2 mb-4">
            <Label htmlFor="evidenceUrl">Evidence Link (optional)</Label>
            <Input
              id="evidenceUrl"
              type="url"
              placeholder="https://..."
              {...register("evidenceUrl")}
            />
          </div>
          
          {/* Evidence type */}
          <div className="space-y-2 mb-4">
            <Label>Evidence Type (optional)</Label>
            <Select onValueChange={(v) => setValue("evidenceType", v as EvidenceType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent>
                {EVIDENCE_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Evidence title */}
          <div className="space-y-2 mb-6">
            <Label htmlFor="evidenceTitle">Evidence Title (optional)</Label>
            <Input
              id="evidenceTitle"
              placeholder="Headline or description..."
              {...register("evidenceTitle")}
            />
          </div>
          
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Record Outcome
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

---

### 5.2.5 ResolutionModal

Modal for resolving a prediction.

```tsx
// components/predictions/ResolutionModal.tsx

"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, XCircle, MinusCircle, HelpCircle } from "lucide-react";
import type { ClaimPrediction, PredictionResolution } from "@/types/prediction";

interface ResolutionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prediction: ClaimPrediction;
  onResolved: () => void;
}

const RESOLUTIONS: { value: PredictionResolution; label: string; icon: any; description: string }[] = [
  { 
    value: "CONFIRMED", 
    label: "Confirmed", 
    icon: CheckCircle,
    description: "The prediction was accurate" 
  },
  { 
    value: "DISCONFIRMED", 
    label: "Disconfirmed", 
    icon: XCircle,
    description: "The prediction was wrong" 
  },
  { 
    value: "PARTIALLY_CONFIRMED", 
    label: "Partially Confirmed", 
    icon: MinusCircle,
    description: "The prediction was partially correct" 
  },
  { 
    value: "INDETERMINATE", 
    label: "Indeterminate", 
    icon: HelpCircle,
    description: "Cannot determine (ambiguous or missing data)" 
  },
];

export function ResolutionModal({
  open,
  onOpenChange,
  prediction,
  onResolved,
}: ResolutionModalProps) {
  const [resolution, setResolution] = useState<PredictionResolution | null>(null);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async () => {
    if (!resolution) {
      setError("Please select a resolution");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/prediction/${prediction.id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resolution,
          resolutionNote: note || undefined,
        }),
      });
      
      const result = await response.json();
      
      if (!result.ok) {
        throw new Error(result.error || "Failed to resolve prediction");
      }
      
      setResolution(null);
      setNote("");
      onResolved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Resolve Prediction</DialogTitle>
          <DialogDescription>
            Determine whether this prediction was accurate based on the recorded outcomes.
          </DialogDescription>
        </DialogHeader>
        
        {/* Prediction reminder */}
        <div className="p-3 bg-muted rounded-md text-sm mb-4">
          <span className="font-medium">Prediction:</span>
          <p className="mt-1">"{prediction.predictionText}"</p>
        </div>
        
        {/* Resolution options */}
        <div className="space-y-2 mb-4">
          <Label>Resolution</Label>
          <RadioGroup 
            value={resolution || ""} 
            onValueChange={(v) => setResolution(v as PredictionResolution)}
          >
            {RESOLUTIONS.map(res => {
              const Icon = res.icon;
              return (
                <div 
                  key={res.value} 
                  className="flex items-center space-x-3 p-3 rounded-md border hover:bg-accent cursor-pointer"
                  onClick={() => setResolution(res.value)}
                >
                  <RadioGroupItem value={res.value} id={res.value} />
                  <Icon className={`h-5 w-5 ${
                    res.value === "CONFIRMED" ? "text-green-600" :
                    res.value === "DISCONFIRMED" ? "text-red-600" :
                    res.value === "PARTIALLY_CONFIRMED" ? "text-yellow-600" :
                    "text-gray-600"
                  }`} />
                  <div className="flex-1">
                    <Label htmlFor={res.value} className="cursor-pointer font-medium">
                      {res.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">{res.description}</p>
                  </div>
                </div>
              );
            })}
          </RadioGroup>
        </div>
        
        {/* Resolution note */}
        <div className="space-y-2 mb-6">
          <Label htmlFor="note">Resolution Note (optional)</Label>
          <Textarea
            id="note"
            placeholder="Explain your reasoning..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
          />
        </div>
        
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !resolution}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Resolve Prediction
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

### 5.2.6 PredictionBadge

Small badge for claim cards showing prediction count/status.

```tsx
// components/predictions/PredictionBadge.tsx

"use client";

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TrendingUp, TrendingDown, Clock } from "lucide-react";

interface PredictionBadgeProps {
  predictionCount: number;
  confirmedCount: number;
  disconfirmedCount: number;
  pendingCount: number;
}

export function PredictionBadge({
  predictionCount,
  confirmedCount,
  disconfirmedCount,
  pendingCount,
}: PredictionBadgeProps) {
  if (predictionCount === 0) return null;
  
  // Determine badge color based on track record
  let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";
  let Icon = Clock;
  
  const resolvedCount = confirmedCount + disconfirmedCount;
  
  if (resolvedCount > 0) {
    const accuracyRate = confirmedCount / resolvedCount;
    if (accuracyRate >= 0.7) {
      variant = "default"; // green-ish
      Icon = TrendingUp;
    } else if (accuracyRate <= 0.3) {
      variant = "destructive";
      Icon = TrendingDown;
    }
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={variant} className="cursor-help">
            <Icon className="h-3 w-3 mr-1" />
            {predictionCount}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs">
            <div>{predictionCount} prediction{predictionCount !== 1 ? "s" : ""}</div>
            {confirmedCount > 0 && <div className="text-green-600">{confirmedCount} confirmed</div>}
            {disconfirmedCount > 0 && <div className="text-red-600">{disconfirmedCount} disconfirmed</div>}
            {pendingCount > 0 && <div className="text-yellow-600">{pendingCount} pending</div>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
```

---

### 5.2.7 UserPredictionStats

User track record display.

```tsx
// components/predictions/UserPredictionStats.tsx

"use client";

import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Target, Clock, CheckCircle, XCircle } from "lucide-react";
import type { UserPredictionStats as Stats } from "@/types/prediction";

interface UserPredictionStatsProps {
  userId: string;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function UserPredictionStats({ userId }: UserPredictionStatsProps) {
  const { data, isLoading } = useSWR<{ ok: boolean; stats: Stats }>(
    `/api/user/${userId}/predictions`,
    fetcher
  );
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5" />
            Prediction Track Record
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }
  
  const stats = data?.stats;
  
  if (!stats || stats.totalPredictions === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5" />
            Prediction Track Record
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No predictions yet.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  const accuracyPercent = stats.accuracyRate !== null 
    ? Math.round(stats.accuracyRate * 100) 
    : null;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5" />
          Prediction Track Record
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Accuracy rate */}
        {accuracyPercent !== null && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">Accuracy Rate</span>
              <span className={`text-lg font-bold ${
                accuracyPercent >= 70 ? "text-green-600" :
                accuracyPercent >= 50 ? "text-yellow-600" :
                "text-red-600"
              }`}>
                {accuracyPercent}%
              </span>
            </div>
            <Progress value={accuracyPercent} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Based on {stats.confirmedCount + stats.disconfirmedCount} resolved predictions
            </p>
          </div>
        )}
        
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span>{stats.totalPredictions} total</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-yellow-600" />
            <span>{stats.pendingCount} pending</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>{stats.confirmedCount} confirmed</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-600" />
            <span>{stats.disconfirmedCount} wrong</span>
          </div>
        </div>
        
        {/* Average confidence */}
        <div className="mt-4 pt-4 border-t text-sm">
          <span className="text-muted-foreground">Average stated confidence: </span>
          <span className="font-medium">{Math.round(stats.avgConfidence * 100)}%</span>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

*Continued in Part 6: Integration Points...*

---

# Part 6: Integration Points

## 6.1 Claim Detail View Integration

Add prediction section to the existing claim detail component.

**File:** `components/claims/ClaimDetailPanel.tsx` (or equivalent)

```tsx
// Add to existing ClaimDetailPanel

import { PredictionSection } from "@/components/predictions/PredictionSection";

export function ClaimDetailPanel({ claim, deliberationId }: Props) {
  return (
    <div>
      {/* Existing claim content */}
      <ClaimHeader claim={claim} />
      <ClaimContent claim={claim} />
      <ClaimEvidence claim={claim} />
      
      {/* NEW: Prediction section */}
      <PredictionSection
        claimId={claim.id}
        deliberationId={deliberationId}
        claimText={claim.text}
        canCreate={true}
      />
      
      {/* Existing sections continue */}
      <ClaimDiscussion claim={claim} />
    </div>
  );
}
```

## 6.2 Claim Card Badge Integration

Add prediction badge to claim cards in lists/graphs.

**File:** `components/claims/ClaimCard.tsx` (or equivalent)

```tsx
// Add to existing ClaimCard

import { PredictionBadge } from "@/components/predictions/PredictionBadge";

export function ClaimCard({ claim }: Props) {
  return (
    <Card>
      <CardContent>
        <div className="flex items-start justify-between">
          <p>{claim.text}</p>
          
          {/* NEW: Prediction badge */}
          {claim.hasPredictions && (
            <PredictionBadge
              predictionCount={claim.predictionCount}
              confirmedCount={claim.confirmedCount}
              disconfirmedCount={claim.disconfirmedCount}
              pendingCount={claim.pendingCount}
            />
          )}
        </div>
        {/* ... rest of card */}
      </CardContent>
    </Card>
  );
}
```

## 6.3 User Profile Integration

Add prediction stats to user profile page.

**File:** `app/profile/[id]/page.tsx` (or equivalent)

```tsx
// Add to existing user profile

import { UserPredictionStats } from "@/components/predictions/UserPredictionStats";

export default function UserProfilePage({ params }: { params: { id: string } }) {
  return (
    <div>
      {/* Existing profile sections */}
      <UserHeader userId={params.id} />
      <UserActivity userId={params.id} />
      
      {/* NEW: Prediction track record */}
      <UserPredictionStats userId={params.id} />
      
      {/* Existing sections continue */}
    </div>
  );
}
```

## 6.4 Deliberation Predictions View

Add a deliberation-wide predictions list view.

**File:** `app/deliberation/[id]/predictions/page.tsx`

```tsx
"use client";

import { useState } from "react";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PredictionCard } from "@/components/predictions/PredictionCard";
import { TrendingUp, Clock, CheckCircle, XCircle } from "lucide-react";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function DeliberationPredictionsPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const queryParams = statusFilter !== "all" ? `?status=${statusFilter}` : "";
  const { data, mutate, isLoading } = useSWR(
    `/api/deliberation/${params.id}/predictions${queryParams}`,
    fetcher
  );
  
  const predictions = data?.predictions || [];
  
  // Calculate summary stats
  const stats = {
    total: data?.total || 0,
    pending: predictions.filter((p: any) => p.status === "PENDING").length,
    confirmed: predictions.filter((p: any) => p.resolution === "CONFIRMED").length,
    disconfirmed: predictions.filter((p: any) => p.resolution === "DISCONFIRMED").length,
  };
  
  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-2">
              <TrendingUp className="h-6 w-6" />
              Predictions
            </CardTitle>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ({data?.total || 0})</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Stats row */}
          <div className="flex gap-4 mt-2 text-sm">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-yellow-600" />
              {stats.pending} pending
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              {stats.confirmed} confirmed
            </span>
            <span className="flex items-center gap-1">
              <XCircle className="h-4 w-4 text-red-600" />
              {stats.disconfirmed} wrong
            </span>
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="text-muted-foreground">Loading...</div>
          ) : predictions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No predictions found.
            </div>
          ) : (
            <div className="space-y-4">
              {predictions.map((prediction: any) => (
                <div key={prediction.id}>
                  {/* Show claim context */}
                  <p className="text-xs text-muted-foreground mb-1">
                    On claim: "{prediction.claim?.text?.substring(0, 100)}..."
                  </p>
                  <PredictionCard 
                    prediction={prediction} 
                    onUpdate={() => mutate()} 
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

## 6.5 Navigation Link

Add predictions link to deliberation navigation.

```tsx
// In deliberation layout or navigation component

<NavLink href={`/deliberation/${deliberationId}/predictions`}>
  <TrendingUp className="h-4 w-4" />
  Predictions
</NavLink>
```

---

# Part 7: Testing Strategy

## 7.1 Unit Tests

### PredictionService Tests

```typescript
// tests/services/prediction.test.ts

import { predictionService } from "@/services/prediction";
import { prisma } from "@/lib/prismaclient";

describe("PredictionService", () => {
  
  beforeEach(async () => {
    // Clean up test data
    await prisma.predictionOutcome.deleteMany({});
    await prisma.claimPrediction.deleteMany({});
  });
  
  describe("createPrediction", () => {
    it("should create a prediction with default confidence", async () => {
      const prediction = await predictionService.createPrediction({
        claimId: "test-claim-id",
        deliberationId: "test-delib-id",
        predictionText: "Test prediction",
        createdById: "test-user-id",
      });
      
      expect(prediction.id).toBeDefined();
      expect(prediction.status).toBe("PENDING");
      expect(prediction.confidence).toBe(0.5);
    });
    
    it("should clamp confidence to 0-1 range", async () => {
      const prediction = await predictionService.createPrediction({
        claimId: "test-claim-id",
        deliberationId: "test-delib-id",
        predictionText: "Test prediction",
        confidence: 1.5,
        createdById: "test-user-id",
      });
      
      expect(prediction.confidence).toBe(1);
    });
    
    it("should update claim counts", async () => {
      await predictionService.createPrediction({
        claimId: "test-claim-id",
        deliberationId: "test-delib-id",
        predictionText: "Test prediction",
        createdById: "test-user-id",
      });
      
      const claim = await prisma.claim.findUnique({
        where: { id: "test-claim-id" },
      });
      
      expect(claim?.hasPredictions).toBe(true);
      expect(claim?.predictionCount).toBe(1);
      expect(claim?.pendingCount).toBe(1);
    });
  });
  
  describe("resolvePrediction", () => {
    it("should resolve prediction and update claim counts", async () => {
      const prediction = await predictionService.createPrediction({
        claimId: "test-claim-id",
        deliberationId: "test-delib-id",
        predictionText: "Test prediction",
        createdById: "test-user-id",
      });
      
      const resolved = await predictionService.resolvePrediction({
        predictionId: prediction.id,
        resolution: "CONFIRMED",
        resolvedById: "resolver-user-id",
      });
      
      expect(resolved.status).toBe("RESOLVED");
      expect(resolved.resolution).toBe("CONFIRMED");
      expect(resolved.resolvedById).toBe("resolver-user-id");
      
      const claim = await prisma.claim.findUnique({
        where: { id: "test-claim-id" },
      });
      
      expect(claim?.confirmedCount).toBe(1);
      expect(claim?.pendingCount).toBe(0);
    });
    
    it("should not resolve already resolved prediction", async () => {
      const prediction = await predictionService.createPrediction({
        claimId: "test-claim-id",
        deliberationId: "test-delib-id",
        predictionText: "Test prediction",
        createdById: "test-user-id",
      });
      
      await predictionService.resolvePrediction({
        predictionId: prediction.id,
        resolution: "CONFIRMED",
        resolvedById: "resolver-user-id",
      });
      
      await expect(
        predictionService.resolvePrediction({
          predictionId: prediction.id,
          resolution: "DISCONFIRMED",
          resolvedById: "resolver-user-id",
        })
      ).rejects.toThrow("already resolved");
    });
  });
  
  describe("getUserStats", () => {
    it("should calculate accuracy rate correctly", async () => {
      // Create 3 predictions: 2 confirmed, 1 disconfirmed
      const predictions = await Promise.all([
        predictionService.createPrediction({
          claimId: "claim-1",
          deliberationId: "delib-1",
          predictionText: "Prediction 1",
          createdById: "test-user",
        }),
        predictionService.createPrediction({
          claimId: "claim-2",
          deliberationId: "delib-1",
          predictionText: "Prediction 2",
          createdById: "test-user",
        }),
        predictionService.createPrediction({
          claimId: "claim-3",
          deliberationId: "delib-1",
          predictionText: "Prediction 3",
          createdById: "test-user",
        }),
      ]);
      
      await predictionService.resolvePrediction({
        predictionId: predictions[0].id,
        resolution: "CONFIRMED",
        resolvedById: "resolver",
      });
      
      await predictionService.resolvePrediction({
        predictionId: predictions[1].id,
        resolution: "CONFIRMED",
        resolvedById: "resolver",
      });
      
      await predictionService.resolvePrediction({
        predictionId: predictions[2].id,
        resolution: "DISCONFIRMED",
        resolvedById: "resolver",
      });
      
      const stats = await predictionService.getUserStats("test-user");
      
      expect(stats.totalPredictions).toBe(3);
      expect(stats.confirmedCount).toBe(2);
      expect(stats.disconfirmedCount).toBe(1);
      expect(stats.accuracyRate).toBeCloseTo(0.667, 2);
    });
  });
});
```

## 7.2 API Tests

```typescript
// tests/api/predictions.test.ts

import { testApiHandler } from "next-test-api-route-handler";
import * as createPredictionHandler from "@/app/api/deliberation/[deliberationId]/claim/[claimId]/prediction/route";

describe("POST /api/deliberation/[id]/claim/[claimId]/prediction", () => {
  
  it("should return 401 if not authenticated", async () => {
    await testApiHandler({
      appHandler: createPredictionHandler,
      params: { deliberationId: "test-delib", claimId: "test-claim" },
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          body: JSON.stringify({ predictionText: "Test" }),
        });
        expect(res.status).toBe(401);
      },
    });
  });
  
  it("should return 400 if predictionText is missing", async () => {
    await testApiHandler({
      appHandler: createPredictionHandler,
      params: { deliberationId: "test-delib", claimId: "test-claim" },
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { Authorization: "Bearer valid-token" },
          body: JSON.stringify({}),
        });
        expect(res.status).toBe(400);
      },
    });
  });
  
  it("should create prediction successfully", async () => {
    await testApiHandler({
      appHandler: createPredictionHandler,
      params: { deliberationId: "test-delib", claimId: "test-claim" },
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { 
            Authorization: "Bearer valid-token",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            predictionText: "This will happen by 2027",
            confidence: 0.8,
          }),
        });
        
        expect(res.status).toBe(201);
        const data = await res.json();
        expect(data.ok).toBe(true);
        expect(data.prediction.predictionText).toBe("This will happen by 2027");
        expect(data.prediction.confidence).toBe(0.8);
      },
    });
  });
});
```

## 7.3 Component Tests

```tsx
// tests/components/PredictionCard.test.tsx

import { render, screen, fireEvent } from "@testing-library/react";
import { PredictionCard } from "@/components/predictions/PredictionCard";

const mockPrediction = {
  id: "pred-1",
  claimId: "claim-1",
  deliberationId: "delib-1",
  predictionText: "Test prediction text",
  targetDate: new Date("2027-01-01"),
  confidence: 0.75,
  status: "PENDING" as const,
  createdById: "user-1",
  createdAt: new Date(),
  updatedAt: new Date(),
  resolvedAt: null,
  resolvedById: null,
  resolution: null,
  resolutionNote: null,
  creatorName: "Test User",
  outcomes: [],
};

describe("PredictionCard", () => {
  it("should render prediction text", () => {
    render(<PredictionCard prediction={mockPrediction} onUpdate={() => {}} />);
    expect(screen.getByText(/Test prediction text/)).toBeInTheDocument();
  });
  
  it("should show pending status badge", () => {
    render(<PredictionCard prediction={mockPrediction} onUpdate={() => {}} />);
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });
  
  it("should show confidence percentage", () => {
    render(<PredictionCard prediction={mockPrediction} onUpdate={() => {}} />);
    expect(screen.getByText(/75% confident/)).toBeInTheDocument();
  });
  
  it("should expand to show actions", () => {
    render(<PredictionCard prediction={mockPrediction} onUpdate={() => {}} />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("Record Outcome")).toBeInTheDocument();
    expect(screen.getByText("Resolve")).toBeInTheDocument();
  });
  
  it("should not show actions for resolved prediction", () => {
    const resolved = {
      ...mockPrediction,
      status: "RESOLVED" as const,
      resolution: "CONFIRMED" as const,
    };
    render(<PredictionCard prediction={resolved} onUpdate={() => {}} />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.queryByText("Record Outcome")).not.toBeInTheDocument();
  });
});
```

## 7.4 Manual Testing Checklist

```markdown
### Prediction Creation
- [ ] Can create prediction from claim detail view
- [ ] Prediction text validation works (min 10 chars)
- [ ] Target date picker works
- [ ] Confidence slider works (0-100%)
- [ ] Prediction appears in list after creation
- [ ] Claim badge updates after creation

### Outcome Recording
- [ ] Can record outcome on pending prediction
- [ ] Evidence URL field accepts valid URLs
- [ ] Evidence type dropdown works
- [ ] Outcome appears in prediction detail
- [ ] Cannot record outcome on withdrawn prediction

### Resolution
- [ ] Can resolve pending prediction
- [ ] All resolution types work (Confirmed, Disconfirmed, Partial, Indeterminate)
- [ ] Resolution note is saved
- [ ] Claim counts update after resolution
- [ ] Cannot resolve already resolved prediction

### User Stats
- [ ] Stats display on user profile
- [ ] Accuracy rate calculates correctly
- [ ] Stats update after resolution

### Deliberation View
- [ ] Predictions list shows all predictions
- [ ] Filter by status works
- [ ] Pagination works (if >50 predictions)

### Edge Cases
- [ ] Empty states display correctly
- [ ] Loading states display correctly
- [ ] Error handling shows user-friendly messages
- [ ] Works on mobile viewports
```

---

# Part 8: Rollout Plan

## 8.1 Phase 1: Schema & Backend (Day 1-2)

**Tasks:**
1. Add Prisma models to schema
2. Run migration
3. Add Claim model extensions
4. Implement PredictionService
5. Create type definitions

**Validation:**
- Schema deploys without errors
- Service unit tests pass
- Types compile correctly

## 8.2 Phase 2: API Layer (Day 3-4)

**Tasks:**
1. Create all API endpoints
2. Add authentication/authorization
3. Implement event bus integration
4. Add cron job for expiration

**Validation:**
- API tests pass
- Manual endpoint testing via curl/Postman
- Event bus emits correctly

## 8.3 Phase 3: UI Components (Day 5-7)

**Tasks:**
1. Create all React components
2. Integrate with claim detail view
3. Add prediction badge to claim cards
4. Add user stats to profile
5. Create deliberation predictions page

**Validation:**
- Component tests pass
- Visual QA in browser
- Responsive design check

## 8.4 Phase 4: Polish & Testing (Day 8-9)

**Tasks:**
1. End-to-end manual testing
2. Fix bugs found in testing
3. Performance optimization if needed
4. Documentation updates
5. Feature flag setup (if doing gradual rollout)

**Validation:**
- All checklist items pass
- No console errors
- Performance acceptable (<200ms API responses)

## 8.5 Launch Checklist

```markdown
### Pre-Launch
- [ ] All tests passing
- [ ] Schema migration verified on staging
- [ ] API endpoints working on staging
- [ ] UI tested on staging
- [ ] Mobile responsive verified
- [ ] Error tracking configured (Sentry)
- [ ] Analytics events added (if applicable)

### Launch
- [ ] Deploy schema migration
- [ ] Deploy backend code
- [ ] Deploy frontend code
- [ ] Verify in production
- [ ] Monitor error rates
- [ ] Monitor performance

### Post-Launch
- [ ] Monitor user adoption
- [ ] Gather feedback
- [ ] Plan iteration based on usage
```

---

## Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Schema deployed | ✓ | Migration successful |
| API latency | <200ms p95 | APM monitoring |
| Prediction creation rate | >5% of empirical claims | `COUNT(predictions) / COUNT(claims WHERE type='empirical')` |
| Resolution rate | >50% of predictions | `COUNT(status=RESOLVED) / COUNT(*)` |
| User engagement | >10% of active users create predictions | DAU with predictions / total DAU |
| Bug rate | <5 bugs in first week | Issue tracker |

---

## Future Enhancements (Out of Scope)

For future consideration:
1. **AI-suggested predictions** - Use LLM to suggest predictions from claim text
2. **Prediction markets** - Allow betting on outcomes
3. **Calibration scoring** - Brier scores, log scores for accuracy
4. **Reliability badges** - Show badges on users/claims based on track record
5. **Automated outcome detection** - Use news APIs to detect when predictions resolve
6. **Community voting** - Let community vote on resolutions for disputed cases
7. **Prediction reminders** - Notify users when target dates approach

---

*End of Roadmap Document*
