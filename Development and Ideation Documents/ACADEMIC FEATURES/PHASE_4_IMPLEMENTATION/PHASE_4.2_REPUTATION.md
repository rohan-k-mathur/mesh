# Phase 4.2: Argumentation-Based Reputation — Part 1

**Sub-Phase:** 4.2 of 4.3  
**Focus:** Scholar Contribution Metrics & Data Model

---

## User Stories

| ID | Story | Priority | Effort |
|----|-------|----------|--------|
| 4.2.1 | As a scholar, I want my contributions tracked granularly, so I get credit for all my work | P0 | L |
| 4.2.2 | As a reader, I want to see a scholar's argumentation history, so I can assess their expertise | P0 | M |
| 4.2.3 | As a reviewer, I want my review quality visible, so I can build a review portfolio | P0 | M |
| 4.2.4 | As an institution, I want contribution metrics, so I can evaluate scholarly impact | P1 | M |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                   REPUTATION SYSTEM                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐    ┌──────────────────┐                    │
│  │  Contribution   │    │   Aggregation    │                    │
│  │    Tracking     │───▶│     Engine       │                    │
│  └─────────────────┘    └──────────────────┘                    │
│         │                       │                                │
│         ▼                       ▼                                │
│  ┌─────────────────┐    ┌──────────────────┐                    │
│  │  • Arguments    │    │  • Defense Rate  │                    │
│  │  • Attacks      │    │  • Attack Prec.  │                    │
│  │  • Defenses     │    │  • Impact Score  │                    │
│  │  • Reviews      │    │  • Consensus %   │                    │
│  │  • Concessions  │    │  • Citations     │                    │
│  └─────────────────┘    └──────────────────┘                    │
│                                │                                 │
│                                ▼                                 │
│                    ┌──────────────────────┐                     │
│                    │   Scholar Profile    │                     │
│                    ├──────────────────────┤                     │
│                    │ • Expertise Areas    │                     │
│                    │ • Contribution Stats │                     │
│                    │ • Review Portfolio   │                     │
│                    │ • Impact Metrics     │                     │
│                    └──────────────────────┘                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Step 4.2.1: Contribution Schema

**File:** `prisma/schema.prisma` (additions)

```prisma
// ============================================================
// CONTRIBUTION & REPUTATION MODELS
// ============================================================

/// Types of scholarly contributions
enum ContributionType {
  // Argumentation contributions
  ARGUMENT_CREATED        // Created an argument
  ATTACK_INITIATED        // Initiated an attack on an argument
  DEFENSE_PROVIDED        // Defended an argument under attack
  SUPPORT_GIVEN           // Supported another's argument
  EVIDENCE_ADDED          // Added evidence to a claim
  
  // Review contributions
  REVIEW_COMPLETED        // Completed a peer review
  COMMITMENT_MADE         // Made a reviewer commitment
  BLOCKING_CONCERN_RAISED // Raised a blocking concern
  
  // Response contributions
  CONCESSION_MADE         // Made a concession in response
  REVISION_COMPLETED      // Completed a revision
  CLARIFICATION_PROVIDED  // Provided clarification
  
  // Quality indicators
  CONSENSUS_ACHIEVED      // Argument reached consensus
  CHALLENGE_RESOLVED      // Successfully resolved a challenge
  CITATION_RECEIVED       // Argument was cited
}

/// Individual contribution record
model ScholarContribution {
  id              String   @id @default(cuid())
  
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  
  // Contribution type
  type            ContributionType
  
  // Context
  deliberationId  String?
  deliberation    Deliberation? @relation(fields: [deliberationId], references: [id])
  
  argumentId      String?
  argument        Argument? @relation(fields: [argumentId], references: [id])
  
  reviewId        String?
  
  // Contribution details
  details         Json?    // Type-specific details
  
  // Weighting/scoring
  baseWeight      Float    @default(1.0)
  qualityMultiplier Float  @default(1.0)
  impactScore     Float?   // Calculated impact
  
  // Verification
  isVerified      Boolean  @default(false)
  verifiedAt      DateTime?
  
  createdAt       DateTime @default(now())
  
  @@index([userId])
  @@index([type])
  @@index([deliberationId])
  @@index([createdAt])
}

/// Aggregated statistics for a scholar
model ScholarStats {
  id              String   @id @default(cuid())
  
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id])
  
  // ============================================
  // Argumentation metrics
  // ============================================
  totalArguments  Int      @default(0)
  argumentsWithConsensus Int @default(0)
  
  totalAttacks    Int      @default(0)
  successfulAttacks Int    @default(0)  // Led to concession/revision
  
  totalDefenses   Int      @default(0)
  successfulDefenses Int   @default(0)  // Held against attack
  
  // ============================================
  // Review metrics
  // ============================================
  reviewsCompleted Int     @default(0)
  averageReviewDepth Float @default(0)  // Avg commitments per review
  
  blockingConcernsRaised Int @default(0)
  concernsResolved Int     @default(0)  // Blocking concerns that were addressed
  
  // ============================================
  // Response pattern metrics
  // ============================================
  concessionsReceived Int  @default(0)  // Others conceded to this scholar
  concessionsMade Int      @default(0)  // This scholar conceded
  
  // ============================================
  // Impact metrics
  // ============================================
  citationCount   Int      @default(0)
  downstreamUsage Int      @default(0)  // Arguments built on theirs
  
  // ============================================
  // Calculated scores
  // ============================================
  defenseSuccessRate Float @default(0)  // successfulDefenses / totalDefenses
  attackPrecision    Float @default(0)  // successfulAttacks / totalAttacks
  consensusRate      Float @default(0)  // argumentsWithConsensus / totalArguments
  reviewQuality      Float @default(0)  // Calculated review quality score
  
  // Overall reputation score
  reputationScore Float    @default(0)
  
  // Last calculation time
  calculatedAt    DateTime @default(now())
  
  @@index([reputationScore])
}

/// Expertise area tracking
model ScholarExpertise {
  id              String   @id @default(cuid())
  
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  
  // Topic/area
  topicId         String?
  topic           Topic?   @relation(fields: [topicId], references: [id])
  
  customArea      String?  @db.VarChar(200)  // Free-form if no topic
  
  // Evidence
  contributionCount Int    @default(0)
  consensusContributions Int @default(0)
  
  // Calculated expertise level
  expertiseScore  Float    @default(0)
  expertiseLevel  ExpertiseLevel @default(NOVICE)
  
  firstContribution DateTime?
  lastContribution DateTime?
  
  @@unique([userId, topicId])
  @@index([userId])
  @@index([topicId])
}

enum ExpertiseLevel {
  NOVICE          // < 5 contributions
  CONTRIBUTOR     // 5-20 contributions
  ESTABLISHED     // 20-50 contributions
  EXPERT          // 50-100 contributions
  AUTHORITY       // 100+ contributions
}

/// Reviewer-specific profile
model ReviewerProfile {
  id              String   @id @default(cuid())
  
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id])
  
  // Review portfolio stats
  totalReviews    Int      @default(0)
  completedOnTime Int      @default(0)
  
  // Review style
  averageCommitments Float @default(0)
  blockingConcernRate Float @default(0)  // % of reviews with blocking concerns
  
  // Quality metrics
  concernResolutionRate Float @default(0)  // % of concerns that get resolved
  revisionInfluenceRate Float @default(0)  // % of reviews that led to revision
  
  // Specializations
  topSpecialties  Json?    // Array of { topicId, reviewCount }
  
  // Timeliness
  averageResponseDays Float @default(0)
  
  // Trust indicators
  invitationAcceptRate Float @default(0)
  repeatInvitations Int    @default(0)
  
  updatedAt       DateTime @updatedAt
}
```

---

### Step 4.2.2: Contribution Types

**File:** `lib/reputation/types.ts`

```typescript
/**
 * Types for reputation and contribution system
 */

export type ContributionType =
  | "ARGUMENT_CREATED"
  | "ATTACK_INITIATED"
  | "DEFENSE_PROVIDED"
  | "SUPPORT_GIVEN"
  | "EVIDENCE_ADDED"
  | "REVIEW_COMPLETED"
  | "COMMITMENT_MADE"
  | "BLOCKING_CONCERN_RAISED"
  | "CONCESSION_MADE"
  | "REVISION_COMPLETED"
  | "CLARIFICATION_PROVIDED"
  | "CONSENSUS_ACHIEVED"
  | "CHALLENGE_RESOLVED"
  | "CITATION_RECEIVED";

export type ExpertiseLevel =
  | "NOVICE"
  | "CONTRIBUTOR"
  | "ESTABLISHED"
  | "EXPERT"
  | "AUTHORITY";

export interface ContributionDetails {
  // Context IDs
  deliberationId?: string;
  argumentId?: string;
  reviewId?: string;
  claimId?: string;

  // Type-specific data
  targetUserId?: string;      // For attack/defense
  outcomeSuccess?: boolean;   // For attacks/defenses
  consensusLevel?: number;    // For consensus achievements
  citationCount?: number;     // For citation events
}

export interface ScholarStatsSummary {
  userId: string;
  userName: string;

  // Core metrics
  totalArguments: number;
  argumentsWithConsensus: number;
  consensusRate: number;

  // Combat metrics
  totalAttacks: number;
  successfulAttacks: number;
  attackPrecision: number;

  totalDefenses: number;
  successfulDefenses: number;
  defenseSuccessRate: number;

  // Review metrics
  reviewsCompleted: number;
  reviewQuality: number;

  // Impact
  citationCount: number;
  downstreamUsage: number;

  // Overall
  reputationScore: number;
}

export interface ExpertiseAreaSummary {
  topicId?: string;
  topicName?: string;
  customArea?: string;
  contributionCount: number;
  expertiseScore: number;
  expertiseLevel: ExpertiseLevel;
}

export interface ReviewerProfileSummary {
  userId: string;
  totalReviews: number;
  completedOnTime: number;
  onTimeRate: number;
  averageCommitments: number;
  blockingConcernRate: number;
  concernResolutionRate: number;
  averageResponseDays: number;
  topSpecialties: Array<{
    topicId: string;
    topicName: string;
    reviewCount: number;
  }>;
}

export interface ContributionEvent {
  type: ContributionType;
  userId: string;
  details: ContributionDetails;
  timestamp?: Date;
}

// Weights for different contribution types
export const CONTRIBUTION_WEIGHTS: Record<ContributionType, number> = {
  ARGUMENT_CREATED: 2.0,
  ATTACK_INITIATED: 1.5,
  DEFENSE_PROVIDED: 1.5,
  SUPPORT_GIVEN: 1.0,
  EVIDENCE_ADDED: 1.5,
  REVIEW_COMPLETED: 3.0,
  COMMITMENT_MADE: 0.5,
  BLOCKING_CONCERN_RAISED: 1.0,
  CONCESSION_MADE: 0.5,
  REVISION_COMPLETED: 2.0,
  CLARIFICATION_PROVIDED: 0.5,
  CONSENSUS_ACHIEVED: 3.0,
  CHALLENGE_RESOLVED: 2.5,
  CITATION_RECEIVED: 2.0,
};
```

---

### Step 4.2.3: Contribution Recording Service

**File:** `lib/reputation/contributionService.ts`

```typescript
/**
 * Service for recording and tracking contributions
 */

import { prisma } from "@/lib/prisma";
import {
  ContributionType,
  ContributionDetails,
  ContributionEvent,
  CONTRIBUTION_WEIGHTS,
} from "./types";

/**
 * Record a contribution
 */
export async function recordContribution(event: ContributionEvent) {
  const { type, userId, details, timestamp } = event;

  // Calculate base weight
  const baseWeight = CONTRIBUTION_WEIGHTS[type] || 1.0;

  // Calculate quality multiplier based on type and details
  const qualityMultiplier = calculateQualityMultiplier(type, details);

  // Create contribution record
  const contribution = await prisma.scholarContribution.create({
    data: {
      userId,
      type,
      deliberationId: details.deliberationId,
      argumentId: details.argumentId,
      reviewId: details.reviewId,
      details: details as any,
      baseWeight,
      qualityMultiplier,
      createdAt: timestamp || new Date(),
    },
  });

  // Trigger stats update (async, don't await)
  updateScholarStatsAsync(userId).catch(console.error);

  return contribution;
}

/**
 * Record multiple contributions in batch
 */
export async function recordContributions(events: ContributionEvent[]) {
  const contributions = await prisma.$transaction(
    events.map((event) =>
      prisma.scholarContribution.create({
        data: {
          userId: event.userId,
          type: event.type,
          deliberationId: event.details.deliberationId,
          argumentId: event.details.argumentId,
          reviewId: event.details.reviewId,
          details: event.details as any,
          baseWeight: CONTRIBUTION_WEIGHTS[event.type] || 1.0,
          qualityMultiplier: calculateQualityMultiplier(
            event.type,
            event.details
          ),
          createdAt: event.timestamp || new Date(),
        },
      })
    )
  );

  // Update stats for all unique users
  const userIds = [...new Set(events.map((e) => e.userId))];
  userIds.forEach((userId) =>
    updateScholarStatsAsync(userId).catch(console.error)
  );

  return contributions;
}

/**
 * Get contributions for a user
 */
export async function getUserContributions(
  userId: string,
  options?: {
    type?: ContributionType;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
  }
) {
  const where: any = { userId };

  if (options?.type) {
    where.type = options.type;
  }

  if (options?.fromDate || options?.toDate) {
    where.createdAt = {};
    if (options.fromDate) where.createdAt.gte = options.fromDate;
    if (options.toDate) where.createdAt.lte = options.toDate;
  }

  return prisma.scholarContribution.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: options?.limit,
    include: {
      deliberation: { select: { id: true, title: true } },
      argument: { select: { id: true, summary: true } },
    },
  });
}

/**
 * Get contribution summary by type
 */
export async function getContributionSummary(userId: string) {
  const contributions = await prisma.scholarContribution.groupBy({
    by: ["type"],
    where: { userId },
    _count: { id: true },
    _sum: { baseWeight: true, qualityMultiplier: true },
  });

  return contributions.map((c) => ({
    type: c.type,
    count: c._count.id,
    totalWeight: (c._sum.baseWeight || 0) * (c._sum.qualityMultiplier || 1),
  }));
}

/**
 * Calculate quality multiplier based on contribution type and details
 */
function calculateQualityMultiplier(
  type: ContributionType,
  details: ContributionDetails
): number {
  let multiplier = 1.0;

  switch (type) {
    case "ATTACK_INITIATED":
    case "DEFENSE_PROVIDED":
      // Bonus if attack/defense was successful
      if (details.outcomeSuccess) {
        multiplier = 1.5;
      }
      break;

    case "CONSENSUS_ACHIEVED":
      // Scale with consensus level
      if (details.consensusLevel) {
        multiplier = 1 + (details.consensusLevel * 0.5);
      }
      break;

    case "CITATION_RECEIVED":
      // Scale with citation count
      if (details.citationCount) {
        multiplier = Math.min(1 + (details.citationCount * 0.1), 3.0);
      }
      break;

    case "REVIEW_COMPLETED":
      // Could factor in review depth, timeliness, etc.
      multiplier = 1.0;
      break;
  }

  return multiplier;
}

/**
 * Async function to update scholar stats
 */
async function updateScholarStatsAsync(userId: string) {
  // Import here to avoid circular dependency
  const { recalculateScholarStats } = await import("./statsService");
  await recalculateScholarStats(userId);
}
```

---

### Step 4.2.4: Stats Calculation Service

**File:** `lib/reputation/statsService.ts`

```typescript
/**
 * Service for calculating and aggregating scholar statistics
 */

import { prisma } from "@/lib/prisma";
import { ScholarStatsSummary, ExpertiseLevel } from "./types";

/**
 * Recalculate all stats for a scholar
 */
export async function recalculateScholarStats(
  userId: string
): Promise<ScholarStatsSummary> {
  // Get all contributions
  const contributions = await prisma.scholarContribution.findMany({
    where: { userId },
  });

  // Count by type
  const counts: Record<string, number> = {};
  const successCounts: Record<string, number> = {};

  contributions.forEach((c) => {
    counts[c.type] = (counts[c.type] || 0) + 1;

    // Track successes
    const details = c.details as any;
    if (details?.outcomeSuccess) {
      successCounts[c.type] = (successCounts[c.type] || 0) + 1;
    }
  });

  // Calculate stats
  const totalArguments = counts.ARGUMENT_CREATED || 0;
  const argumentsWithConsensus = counts.CONSENSUS_ACHIEVED || 0;

  const totalAttacks = counts.ATTACK_INITIATED || 0;
  const successfulAttacks = successCounts.ATTACK_INITIATED || 0;

  const totalDefenses = counts.DEFENSE_PROVIDED || 0;
  const successfulDefenses = successCounts.DEFENSE_PROVIDED || 0;

  const reviewsCompleted = counts.REVIEW_COMPLETED || 0;
  const blockingConcernsRaised = counts.BLOCKING_CONCERN_RAISED || 0;
  const concernsResolved = counts.CHALLENGE_RESOLVED || 0;

  const concessionsReceived = contributions.filter(
    (c) => c.type === "CONCESSION_MADE" && (c.details as any)?.targetUserId === userId
  ).length;
  const concessionsMade = counts.CONCESSION_MADE || 0;

  const citationCount = counts.CITATION_RECEIVED || 0;
  const downstreamUsage = contributions.filter(
    (c) =>
      c.type === "SUPPORT_GIVEN" && (c.details as any)?.targetUserId === userId
  ).length;

  // Calculate rates
  const defenseSuccessRate =
    totalDefenses > 0 ? successfulDefenses / totalDefenses : 0;
  const attackPrecision =
    totalAttacks > 0 ? successfulAttacks / totalAttacks : 0;
  const consensusRate =
    totalArguments > 0 ? argumentsWithConsensus / totalArguments : 0;

  // Calculate review quality (placeholder formula)
  const reviewQuality = calculateReviewQuality(
    reviewsCompleted,
    blockingConcernsRaised,
    concernsResolved
  );

  // Calculate overall reputation
  const reputationScore = calculateReputationScore({
    totalArguments,
    consensusRate,
    defenseSuccessRate,
    attackPrecision,
    reviewsCompleted,
    reviewQuality,
    citationCount,
  });

  // Upsert stats
  const stats = await prisma.scholarStats.upsert({
    where: { userId },
    create: {
      userId,
      totalArguments,
      argumentsWithConsensus,
      totalAttacks,
      successfulAttacks,
      totalDefenses,
      successfulDefenses,
      reviewsCompleted,
      blockingConcernsRaised,
      concernsResolved,
      concessionsReceived,
      concessionsMade,
      citationCount,
      downstreamUsage,
      defenseSuccessRate,
      attackPrecision,
      consensusRate,
      reviewQuality,
      reputationScore,
      calculatedAt: new Date(),
    },
    update: {
      totalArguments,
      argumentsWithConsensus,
      totalAttacks,
      successfulAttacks,
      totalDefenses,
      successfulDefenses,
      reviewsCompleted,
      blockingConcernsRaised,
      concernsResolved,
      concessionsReceived,
      concessionsMade,
      citationCount,
      downstreamUsage,
      defenseSuccessRate,
      attackPrecision,
      consensusRate,
      reviewQuality,
      reputationScore,
      calculatedAt: new Date(),
    },
  });

  // Get user info for summary
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  return {
    userId,
    userName: user?.name || "Unknown",
    totalArguments,
    argumentsWithConsensus,
    consensusRate,
    totalAttacks,
    successfulAttacks,
    attackPrecision,
    totalDefenses,
    successfulDefenses,
    defenseSuccessRate,
    reviewsCompleted,
    reviewQuality,
    citationCount,
    downstreamUsage,
    reputationScore,
  };
}

/**
 * Get scholar stats
 */
export async function getScholarStats(
  userId: string
): Promise<ScholarStatsSummary | null> {
  const stats = await prisma.scholarStats.findUnique({
    where: { userId },
    include: {
      user: { select: { name: true } },
    },
  });

  if (!stats) return null;

  return {
    userId: stats.userId,
    userName: stats.user.name || "Unknown",
    totalArguments: stats.totalArguments,
    argumentsWithConsensus: stats.argumentsWithConsensus,
    consensusRate: stats.consensusRate,
    totalAttacks: stats.totalAttacks,
    successfulAttacks: stats.successfulAttacks,
    attackPrecision: stats.attackPrecision,
    totalDefenses: stats.totalDefenses,
    successfulDefenses: stats.successfulDefenses,
    defenseSuccessRate: stats.defenseSuccessRate,
    reviewsCompleted: stats.reviewsCompleted,
    reviewQuality: stats.reviewQuality,
    citationCount: stats.citationCount,
    downstreamUsage: stats.downstreamUsage,
    reputationScore: stats.reputationScore,
  };
}

/**
 * Get leaderboard
 */
export async function getReputationLeaderboard(options?: {
  limit?: number;
  topicId?: string;
}) {
  const stats = await prisma.scholarStats.findMany({
    orderBy: { reputationScore: "desc" },
    take: options?.limit || 20,
    include: {
      user: { select: { id: true, name: true, image: true } },
    },
  });

  return stats.map((s, index) => ({
    rank: index + 1,
    userId: s.userId,
    userName: s.user.name || "Unknown",
    userImage: s.user.image,
    reputationScore: s.reputationScore,
    totalArguments: s.totalArguments,
    consensusRate: s.consensusRate,
    citationCount: s.citationCount,
  }));
}

/**
 * Calculate review quality score
 */
function calculateReviewQuality(
  reviewsCompleted: number,
  blockingConcernsRaised: number,
  concernsResolved: number
): number {
  if (reviewsCompleted === 0) return 0;

  // Base score from volume
  const volumeScore = Math.min(reviewsCompleted / 10, 1) * 30;

  // Score from raising meaningful concerns
  const concernScore =
    reviewsCompleted > 0
      ? Math.min(blockingConcernsRaised / reviewsCompleted, 0.5) * 40
      : 0;

  // Score from concerns being resolved (indicates constructive feedback)
  const resolutionScore =
    blockingConcernsRaised > 0
      ? (concernsResolved / blockingConcernsRaised) * 30
      : 15; // Neutral if no blocking concerns

  return volumeScore + concernScore + resolutionScore;
}

/**
 * Calculate overall reputation score
 */
function calculateReputationScore(params: {
  totalArguments: number;
  consensusRate: number;
  defenseSuccessRate: number;
  attackPrecision: number;
  reviewsCompleted: number;
  reviewQuality: number;
  citationCount: number;
}): number {
  const {
    totalArguments,
    consensusRate,
    defenseSuccessRate,
    attackPrecision,
    reviewsCompleted,
    reviewQuality,
    citationCount,
  } = params;

  // Volume component (max 25)
  const volumeScore = Math.min(totalArguments / 100, 1) * 25;

  // Quality component (max 25)
  const qualityScore =
    (consensusRate * 0.4 + defenseSuccessRate * 0.3 + attackPrecision * 0.3) * 25;

  // Review component (max 25)
  const reviewScore =
    Math.min(reviewsCompleted / 20, 1) * 12.5 + (reviewQuality / 100) * 12.5;

  // Impact component (max 25)
  const impactScore = Math.min(citationCount / 50, 1) * 25;

  return volumeScore + qualityScore + reviewScore + impactScore;
}
```

---

### Step 4.2.5: Expertise Tracking Service

**File:** `lib/reputation/expertiseService.ts`

```typescript
/**
 * Service for tracking scholar expertise areas
 */

import { prisma } from "@/lib/prisma";
import { ExpertiseLevel, ExpertiseAreaSummary } from "./types";

/**
 * Update expertise for a contribution in a topic
 */
export async function trackExpertise(
  userId: string,
  topicId: string | null,
  customArea: string | null,
  contributedToConsensus: boolean = false
) {
  // Build unique key
  const where = topicId
    ? { userId_topicId: { userId, topicId } }
    : undefined;

  if (!topicId && !customArea) return;

  if (topicId) {
    // Upsert for topic-based expertise
    await prisma.scholarExpertise.upsert({
      where: where!,
      create: {
        userId,
        topicId,
        contributionCount: 1,
        consensusContributions: contributedToConsensus ? 1 : 0,
        firstContribution: new Date(),
        lastContribution: new Date(),
        expertiseScore: calculateExpertiseScore(1, contributedToConsensus ? 1 : 0),
        expertiseLevel: getExpertiseLevel(1),
      },
      update: {
        contributionCount: { increment: 1 },
        consensusContributions: contributedToConsensus
          ? { increment: 1 }
          : undefined,
        lastContribution: new Date(),
      },
    });

    // Recalculate level
    const updated = await prisma.scholarExpertise.findUnique({
      where: where!,
    });

    if (updated) {
      await prisma.scholarExpertise.update({
        where: where!,
        data: {
          expertiseScore: calculateExpertiseScore(
            updated.contributionCount,
            updated.consensusContributions
          ),
          expertiseLevel: getExpertiseLevel(updated.contributionCount),
        },
      });
    }
  }
}

/**
 * Get expertise areas for a user
 */
export async function getUserExpertise(
  userId: string
): Promise<ExpertiseAreaSummary[]> {
  const expertise = await prisma.scholarExpertise.findMany({
    where: { userId },
    include: {
      topic: { select: { id: true, name: true } },
    },
    orderBy: { expertiseScore: "desc" },
  });

  return expertise.map((e) => ({
    topicId: e.topicId || undefined,
    topicName: e.topic?.name || undefined,
    customArea: e.customArea || undefined,
    contributionCount: e.contributionCount,
    expertiseScore: e.expertiseScore,
    expertiseLevel: e.expertiseLevel as ExpertiseLevel,
  }));
}

/**
 * Get top experts for a topic
 */
export async function getTopicExperts(
  topicId: string,
  limit = 10
): Promise<
  Array<{
    userId: string;
    userName: string;
    expertiseLevel: ExpertiseLevel;
    contributionCount: number;
  }>
> {
  const experts = await prisma.scholarExpertise.findMany({
    where: { topicId },
    orderBy: { expertiseScore: "desc" },
    take: limit,
    include: {
      user: { select: { id: true, name: true } },
    },
  });

  return experts.map((e) => ({
    userId: e.userId,
    userName: e.user.name || "Unknown",
    expertiseLevel: e.expertiseLevel as ExpertiseLevel,
    contributionCount: e.contributionCount,
  }));
}

/**
 * Calculate expertise score
 */
function calculateExpertiseScore(
  contributionCount: number,
  consensusContributions: number
): number {
  const volumeScore = Math.log10(contributionCount + 1) * 40;
  const qualityScore =
    contributionCount > 0
      ? (consensusContributions / contributionCount) * 60
      : 0;

  return Math.min(volumeScore + qualityScore, 100);
}

/**
 * Get expertise level from contribution count
 */
function getExpertiseLevel(contributionCount: number): ExpertiseLevel {
  if (contributionCount >= 100) return "AUTHORITY";
  if (contributionCount >= 50) return "EXPERT";
  if (contributionCount >= 20) return "ESTABLISHED";
  if (contributionCount >= 5) return "CONTRIBUTOR";
  return "NOVICE";
}

/**
 * Get expertise level thresholds for display
 */
export function getExpertiseLevelInfo(level: ExpertiseLevel) {
  const info: Record<
    ExpertiseLevel,
    { minContributions: number; label: string; color: string }
  > = {
    NOVICE: { minContributions: 0, label: "Novice", color: "gray" },
    CONTRIBUTOR: { minContributions: 5, label: "Contributor", color: "blue" },
    ESTABLISHED: { minContributions: 20, label: "Established", color: "green" },
    EXPERT: { minContributions: 50, label: "Expert", color: "purple" },
    AUTHORITY: { minContributions: 100, label: "Authority", color: "gold" },
  };

  return info[level];
}
```

---

## Phase 4.2 Part 1 Checklist

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 1 | Contribution schema | `prisma/schema.prisma` | 📋 Part 1 |
| 2 | ScholarStats schema | `prisma/schema.prisma` | 📋 Part 1 |
| 3 | ScholarExpertise schema | `prisma/schema.prisma` | 📋 Part 1 |
| 4 | ReviewerProfile schema | `prisma/schema.prisma` | 📋 Part 1 |
| 5 | Reputation types | `lib/reputation/types.ts` | 📋 Part 1 |
| 6 | Contribution service | `lib/reputation/contributionService.ts` | 📋 Part 1 |
| 7 | Stats service | `lib/reputation/statsService.ts` | 📋 Part 1 |
| 8 | Expertise service | `lib/reputation/expertiseService.ts` | 📋 Part 1 |

---

## Next: Part 2

Continue to Phase 4.2 Part 2 for:
- Reviewer Profile Service
- API Routes for Reputation
- React Query Hooks
- UI Components (ScholarProfile, ReputationBadge, Leaderboard)

---

*End of Phase 4.2 Part 1*
