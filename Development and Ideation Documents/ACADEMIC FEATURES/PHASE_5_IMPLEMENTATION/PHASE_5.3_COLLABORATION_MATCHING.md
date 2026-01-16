# Phase 5.3: Collaboration Matching (Part 1)

**Sub-Phase:** 5.3 of 5.3  
**Theme:** Finding Research Collaborators Through Argumentation Patterns

---

## Overview

Phase 5.3 implements the collaboration matching system that identifies potential research collaborators based on argumentation patterns, claim similarity, and complementary attack strategies.

### Key Features

1. **Claim Similarity Matching**: Find researchers with similar positions
2. **Complementary Attacks**: "You attack from empirical, they from conceptual"
3. **Research Interest Alignment**: Match by field and methodology
4. **Collaboration Suggestions**: Proactive recommendation engine

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   Collaboration Matching                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │  Claim Analyzer   │    │  Attack Analyzer  │                 │
│  │  ───────────────  │    │  ───────────────  │                 │
│  │  • Similarity     │    │  • Type analysis  │                 │
│  │  • Position       │    │  • Complementary  │                 │
│  │  • Methodology    │    │  • Patterns       │                 │
│  └────────┬─────────┘    └────────┬─────────┘                   │
│           │                       │                              │
│           └───────────┬───────────┘                              │
│                       ▼                                          │
│           ┌──────────────────────┐                               │
│           │   Match Calculator    │                              │
│           │   ─────────────────   │                              │
│           │   • Scoring engine    │                              │
│           │   • Weighting         │                              │
│           │   • Threshold filter  │                              │
│           └──────────┬───────────┘                               │
│                      ▼                                           │
│  ┌──────────────────────────────────────────────────────┐       │
│  │              Collaboration Suggestions                │       │
│  │  ──────────────────────────────────────────────────  │       │
│  │  • Similar claims    • Complementary attacks         │       │
│  │  • Shared interests  • Cross-field potential         │       │
│  └──────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

---

## User Stories

| ID | Story | Priority | Effort |
|----|-------|----------|--------|
| 5.3.1 | As a researcher, I want to find others with similar claims so I can collaborate on shared positions | High | L |
| 5.3.2 | As a researcher, I want to see complementary attackers so I can form stronger arguments together | High | L |
| 5.3.3 | As a user, I want collaboration suggestions based on my research interests | Medium | M |
| 5.3.4 | As a researcher, I want to discover cross-field collaboration opportunities | Medium | M |
| 5.3.5 | As a user, I want to see why a collaboration is suggested (transparency) | Medium | S |
| 5.3.6 | As a researcher, I want to save interesting matches for later contact | Low | S |

---

## Implementation Steps

### Step 5.3.1: Prisma Schema Extensions

**File:** `prisma/schema.prisma` (additions)

```prisma
// ============================================================
// PHASE 5.3: COLLABORATION MATCHING
// ============================================================

enum MatchType {
  SIMILAR_CLAIMS
  COMPLEMENTARY_ATTACKS
  SHARED_INTERESTS
  CROSS_FIELD
  METHODOLOGY_ALIGNMENT
}

enum MatchStatus {
  SUGGESTED
  VIEWED
  SAVED
  DISMISSED
  CONTACTED
}

enum AttackTypeCategory {
  EMPIRICAL
  CONCEPTUAL
  METHODOLOGICAL
  NORMATIVE
  LOGICAL
}

model CollaborationMatch {
  id          String      @id @default(cuid())
  
  // Users involved
  userId      String
  user        User        @relation("UserMatches", fields: [userId], references: [id])
  
  matchedUserId String
  matchedUser   User      @relation("MatchedWith", fields: [matchedUserId], references: [id])
  
  // Match metadata
  matchType   MatchType
  status      MatchStatus @default(SUGGESTED)
  score       Float       // 0-1 similarity/compatibility score
  
  // Explanation
  reasons     MatchReason[]
  
  // Evidence
  sharedClaimIds    String[]  // Claims they both made similar versions of
  complementaryAttackIds String[] // Attacks that complement each other
  sharedFieldIds    String[]  // Academic fields in common
  
  // Timestamps
  generatedAt DateTime    @default(now())
  viewedAt    DateTime?
  savedAt     DateTime?
  dismissedAt DateTime?
  contactedAt DateTime?
  expiresAt   DateTime    // Matches expire after period of inactivity
  
  @@unique([userId, matchedUserId, matchType])
  @@index([userId, status])
  @@index([matchedUserId])
  @@index([score(sort: Desc)])
}

model MatchReason {
  id        String  @id @default(cuid())
  matchId   String
  match     CollaborationMatch @relation(fields: [matchId], references: [id], onDelete: Cascade)
  
  category  String  // "claim_similarity", "attack_complement", etc.
  weight    Float   // Contribution to total score
  
  // Human-readable explanation
  title     String
  description String
  
  // References
  claimAId  String?
  claimBId  String?
  attackAId String?
  attackBId String?
  fieldId   String?
  
  @@index([matchId])
}

model UserAttackProfile {
  id        String  @id @default(cuid())
  userId    String  @unique
  user      User    @relation(fields: [userId], references: [id])
  
  // Attack pattern analysis
  primaryAttackType     AttackTypeCategory?
  secondaryAttackType   AttackTypeCategory?
  
  // Statistics
  empiricalAttackCount      Int @default(0)
  conceptualAttackCount     Int @default(0)
  methodologicalAttackCount Int @default(0)
  normativeAttackCount      Int @default(0)
  logicalAttackCount        Int @default(0)
  totalAttacks              Int @default(0)
  
  // Computed metrics
  attackDiversity      Float @default(0) // Shannon entropy of attack types
  avgAttackStrength    Float @default(0)
  
  // Update tracking
  lastCalculatedAt DateTime @default(now())
  
  @@index([primaryAttackType])
}

model ResearchInterest {
  id        String  @id @default(cuid())
  userId    String
  user      User    @relation(fields: [userId], references: [id])
  
  fieldId   String
  field     AcademicField @relation(fields: [fieldId], references: [id])
  
  // Interest level
  level     String  @default("INTERESTED") // PRIMARY, INTERESTED, EXPLORING
  
  // Keywords and topics
  keywords  String[]
  topics    String[]
  
  createdAt DateTime @default(now())
  
  @@unique([userId, fieldId])
  @@index([userId])
  @@index([fieldId])
}

model MatchConfiguration {
  id          String  @id @default(cuid())
  userId      String  @unique
  user        User    @relation(fields: [userId], references: [id])
  
  // Opt-in/out
  enableMatching      Boolean @default(true)
  enableNotifications Boolean @default(true)
  
  // Preferences
  preferredMatchTypes MatchType[]
  excludedFieldIds    String[]
  minScore            Float @default(0.5)
  
  // Frequency
  maxMatchesPerWeek   Int @default(10)
  
  updatedAt DateTime @default(now())
}
```

---

### Step 5.3.2: TypeScript Types

**File:** `lib/collaboration/types.ts`

```typescript
/**
 * Types for collaboration matching system
 */

// ============================================================
// Enums
// ============================================================

export type MatchType =
  | "SIMILAR_CLAIMS"
  | "COMPLEMENTARY_ATTACKS"
  | "SHARED_INTERESTS"
  | "CROSS_FIELD"
  | "METHODOLOGY_ALIGNMENT";

export type MatchStatus =
  | "SUGGESTED"
  | "VIEWED"
  | "SAVED"
  | "DISMISSED"
  | "CONTACTED";

export type AttackTypeCategory =
  | "EMPIRICAL"
  | "CONCEPTUAL"
  | "METHODOLOGICAL"
  | "NORMATIVE"
  | "LOGICAL";

export type InterestLevel = "PRIMARY" | "INTERESTED" | "EXPLORING";

// ============================================================
// Match Types
// ============================================================

export interface MatchReason {
  id: string;
  category: string;
  weight: number;
  title: string;
  description: string;
  claimAId?: string;
  claimBId?: string;
  attackAId?: string;
  attackBId?: string;
  fieldId?: string;
}

export interface CollaborationMatchData {
  id: string;
  matchType: MatchType;
  status: MatchStatus;
  score: number;
  reasons: MatchReason[];
  sharedClaimIds: string[];
  complementaryAttackIds: string[];
  sharedFieldIds: string[];
  generatedAt: Date;
  viewedAt?: Date;
  savedAt?: Date;
  expiresAt: Date;
  matchedUser: {
    id: string;
    name: string | null;
    image: string | null;
    institution?: string;
    department?: string;
  };
}

export interface MatchSummary {
  id: string;
  matchType: MatchType;
  status: MatchStatus;
  score: number;
  topReason: string;
  matchedUser: {
    id: string;
    name: string | null;
    image: string | null;
  };
  generatedAt: Date;
}

// ============================================================
// Attack Profile Types
// ============================================================

export interface UserAttackProfileData {
  userId: string;
  primaryAttackType?: AttackTypeCategory;
  secondaryAttackType?: AttackTypeCategory;
  attackCounts: {
    empirical: number;
    conceptual: number;
    methodological: number;
    normative: number;
    logical: number;
  };
  totalAttacks: number;
  attackDiversity: number;
  avgAttackStrength: number;
}

export interface AttackPatternComparison {
  userA: UserAttackProfileData;
  userB: UserAttackProfileData;
  complementaryScore: number;
  complementaryTypes: Array<{
    userAType: AttackTypeCategory;
    userBType: AttackTypeCategory;
    synergy: string;
  }>;
}

// ============================================================
// Research Interest Types
// ============================================================

export interface ResearchInterestData {
  id: string;
  fieldId: string;
  fieldName: string;
  level: InterestLevel;
  keywords: string[];
  topics: string[];
}

export interface InterestOverlap {
  sharedFields: string[];
  sharedKeywords: string[];
  overlapScore: number;
}

// ============================================================
// Configuration Types
// ============================================================

export interface MatchConfigurationData {
  enableMatching: boolean;
  enableNotifications: boolean;
  preferredMatchTypes: MatchType[];
  excludedFieldIds: string[];
  minScore: number;
  maxMatchesPerWeek: number;
}

// ============================================================
// Score Calculation Types
// ============================================================

export interface ScoreComponent {
  name: string;
  weight: number;
  rawScore: number;
  weightedScore: number;
  evidence: string[];
}

export interface MatchScoreBreakdown {
  totalScore: number;
  components: ScoreComponent[];
  threshold: number;
  meetsThreshold: boolean;
}

// ============================================================
// Match Type Descriptions
// ============================================================

export const MATCH_TYPE_INFO: Record<
  MatchType,
  { title: string; description: string; icon: string }
> = {
  SIMILAR_CLAIMS: {
    title: "Similar Claims",
    description: "You've made similar arguments on related topics",
    icon: "📝",
  },
  COMPLEMENTARY_ATTACKS: {
    title: "Complementary Attacks",
    description: "Your attack styles complement each other",
    icon: "⚔️",
  },
  SHARED_INTERESTS: {
    title: "Shared Interests",
    description: "You share research interests and fields",
    icon: "🎯",
  },
  CROSS_FIELD: {
    title: "Cross-Field Potential",
    description: "Your different fields could benefit from collaboration",
    icon: "🌉",
  },
  METHODOLOGY_ALIGNMENT: {
    title: "Methodology Alignment",
    description: "You use compatible research methodologies",
    icon: "🔬",
  },
};

export const ATTACK_TYPE_LABELS: Record<AttackTypeCategory, string> = {
  EMPIRICAL: "Empirical (data, evidence, observations)",
  CONCEPTUAL: "Conceptual (definitions, categories, distinctions)",
  METHODOLOGICAL: "Methodological (process, sampling, validity)",
  NORMATIVE: "Normative (values, ethics, should-statements)",
  LOGICAL: "Logical (consistency, inference, structure)",
};
```

---

### Step 5.3.3: Attack Profile Service

**File:** `lib/collaboration/attackProfileService.ts`

```typescript
/**
 * Service for analyzing user attack patterns
 */

import { prisma } from "@/lib/prisma";
import { AttackTypeCategory, UserAttackProfileData } from "./types";

/**
 * Categorize an attack based on its content
 */
export function categorizeAttack(attack: {
  type: string;
  content: string;
}): AttackTypeCategory {
  const content = attack.content.toLowerCase();
  const type = attack.type.toLowerCase();

  // Check for empirical markers
  if (
    content.includes("evidence") ||
    content.includes("data") ||
    content.includes("study") ||
    content.includes("observation") ||
    content.includes("experiment") ||
    type.includes("empirical")
  ) {
    return "EMPIRICAL";
  }

  // Check for methodological markers
  if (
    content.includes("method") ||
    content.includes("sample") ||
    content.includes("validity") ||
    content.includes("reliability") ||
    content.includes("procedure") ||
    type.includes("method")
  ) {
    return "METHODOLOGICAL";
  }

  // Check for normative markers
  if (
    content.includes("should") ||
    content.includes("ought") ||
    content.includes("value") ||
    content.includes("ethical") ||
    content.includes("moral") ||
    type.includes("normative")
  ) {
    return "NORMATIVE";
  }

  // Check for logical markers
  if (
    content.includes("contradiction") ||
    content.includes("inconsisten") ||
    content.includes("fallacy") ||
    content.includes("inference") ||
    content.includes("deduction") ||
    type.includes("logical")
  ) {
    return "LOGICAL";
  }

  // Default to conceptual
  return "CONCEPTUAL";
}

/**
 * Calculate Shannon entropy for attack diversity
 */
function calculateDiversity(counts: number[]): number {
  const total = counts.reduce((a, b) => a + b, 0);
  if (total === 0) return 0;

  const probabilities = counts.map((c) => c / total).filter((p) => p > 0);
  const entropy = -probabilities.reduce(
    (sum, p) => sum + p * Math.log2(p),
    0
  );

  // Normalize to 0-1 (max entropy for 5 categories is log2(5) ≈ 2.32)
  return entropy / Math.log2(5);
}

/**
 * Calculate or update a user's attack profile
 */
export async function calculateAttackProfile(
  userId: string
): Promise<UserAttackProfileData> {
  // Get all attacks by this user
  const attacks = await prisma.aIFAttack.findMany({
    where: { attackerId: userId },
    select: {
      id: true,
      type: true,
      attackingClaim: {
        select: { content: true },
      },
    },
  });

  // Count attacks by category
  const counts = {
    EMPIRICAL: 0,
    CONCEPTUAL: 0,
    METHODOLOGICAL: 0,
    NORMATIVE: 0,
    LOGICAL: 0,
  };

  for (const attack of attacks) {
    const category = categorizeAttack({
      type: attack.type || "",
      content: attack.attackingClaim?.content || "",
    });
    counts[category]++;
  }

  const total = attacks.length;
  const countArray = Object.values(counts);

  // Determine primary and secondary types
  const sortedTypes = (Object.entries(counts) as [AttackTypeCategory, number][])
    .sort((a, b) => b[1] - a[1])
    .filter(([, count]) => count > 0);

  const primaryAttackType = sortedTypes[0]?.[0] || null;
  const secondaryAttackType = sortedTypes[1]?.[0] || null;

  // Calculate diversity
  const attackDiversity = calculateDiversity(countArray);

  // Calculate average attack strength (placeholder - would need actual strength data)
  const avgAttackStrength = 0.5;

  // Update or create profile
  const profile = await prisma.userAttackProfile.upsert({
    where: { userId },
    update: {
      primaryAttackType,
      secondaryAttackType,
      empiricalAttackCount: counts.EMPIRICAL,
      conceptualAttackCount: counts.CONCEPTUAL,
      methodologicalAttackCount: counts.METHODOLOGICAL,
      normativeAttackCount: counts.NORMATIVE,
      logicalAttackCount: counts.LOGICAL,
      totalAttacks: total,
      attackDiversity,
      avgAttackStrength,
      lastCalculatedAt: new Date(),
    },
    create: {
      userId,
      primaryAttackType,
      secondaryAttackType,
      empiricalAttackCount: counts.EMPIRICAL,
      conceptualAttackCount: counts.CONCEPTUAL,
      methodologicalAttackCount: counts.METHODOLOGICAL,
      normativeAttackCount: counts.NORMATIVE,
      logicalAttackCount: counts.LOGICAL,
      totalAttacks: total,
      attackDiversity,
      avgAttackStrength,
    },
  });

  return {
    userId,
    primaryAttackType: profile.primaryAttackType as AttackTypeCategory | undefined,
    secondaryAttackType: profile.secondaryAttackType as AttackTypeCategory | undefined,
    attackCounts: {
      empirical: counts.EMPIRICAL,
      conceptual: counts.CONCEPTUAL,
      methodological: counts.METHODOLOGICAL,
      normative: counts.NORMATIVE,
      logical: counts.LOGICAL,
    },
    totalAttacks: total,
    attackDiversity,
    avgAttackStrength,
  };
}

/**
 * Get user's attack profile (cached)
 */
export async function getAttackProfile(
  userId: string
): Promise<UserAttackProfileData | null> {
  const profile = await prisma.userAttackProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    return null;
  }

  return {
    userId,
    primaryAttackType: profile.primaryAttackType as AttackTypeCategory | undefined,
    secondaryAttackType: profile.secondaryAttackType as AttackTypeCategory | undefined,
    attackCounts: {
      empirical: profile.empiricalAttackCount,
      conceptual: profile.conceptualAttackCount,
      methodological: profile.methodologicalAttackCount,
      normative: profile.normativeAttackCount,
      logical: profile.logicalAttackCount,
    },
    totalAttacks: profile.totalAttacks,
    attackDiversity: profile.attackDiversity,
    avgAttackStrength: profile.avgAttackStrength,
  };
}

/**
 * Calculate complementary attack score between two users
 */
export function calculateComplementaryScore(
  profileA: UserAttackProfileData,
  profileB: UserAttackProfileData
): number {
  // Users complement each other if they have different primary attack types
  if (!profileA.primaryAttackType || !profileB.primaryAttackType) {
    return 0;
  }

  let score = 0;

  // Different primary types = complementary (up to 0.4)
  if (profileA.primaryAttackType !== profileB.primaryAttackType) {
    score += 0.4;
  }

  // If user A's weak type is user B's strong type (up to 0.3)
  const aWeakTypes = getWeakTypes(profileA);
  const bStrongTypes = getStrongTypes(profileB);
  const complementaryStrong = aWeakTypes.filter((t) =>
    bStrongTypes.includes(t)
  );
  score += Math.min(0.3, complementaryStrong.length * 0.15);

  // Vice versa (up to 0.3)
  const bWeakTypes = getWeakTypes(profileB);
  const aStrongTypes = getStrongTypes(profileA);
  const complementaryStrong2 = bWeakTypes.filter((t) =>
    aStrongTypes.includes(t)
  );
  score += Math.min(0.3, complementaryStrong2.length * 0.15);

  return Math.min(1, score);
}

function getStrongTypes(profile: UserAttackProfileData): AttackTypeCategory[] {
  const { attackCounts, totalAttacks } = profile;
  if (totalAttacks === 0) return [];

  const threshold = 0.2; // At least 20% of attacks
  const strong: AttackTypeCategory[] = [];

  if (attackCounts.empirical / totalAttacks >= threshold) strong.push("EMPIRICAL");
  if (attackCounts.conceptual / totalAttacks >= threshold) strong.push("CONCEPTUAL");
  if (attackCounts.methodological / totalAttacks >= threshold) strong.push("METHODOLOGICAL");
  if (attackCounts.normative / totalAttacks >= threshold) strong.push("NORMATIVE");
  if (attackCounts.logical / totalAttacks >= threshold) strong.push("LOGICAL");

  return strong;
}

function getWeakTypes(profile: UserAttackProfileData): AttackTypeCategory[] {
  const { attackCounts, totalAttacks } = profile;
  if (totalAttacks === 0) return [];

  const threshold = 0.1; // Less than 10% of attacks
  const weak: AttackTypeCategory[] = [];

  if (attackCounts.empirical / totalAttacks < threshold) weak.push("EMPIRICAL");
  if (attackCounts.conceptual / totalAttacks < threshold) weak.push("CONCEPTUAL");
  if (attackCounts.methodological / totalAttacks < threshold) weak.push("METHODOLOGICAL");
  if (attackCounts.normative / totalAttacks < threshold) weak.push("NORMATIVE");
  if (attackCounts.logical / totalAttacks < threshold) weak.push("LOGICAL");

  return weak;
}
```

---

### Step 5.3.4: Claim Similarity Service

**File:** `lib/collaboration/claimSimilarityService.ts`

```typescript
/**
 * Service for finding similar claims between users
 */

import { prisma } from "@/lib/prisma";

interface ClaimWithEmbedding {
  id: string;
  content: string;
  userId: string;
  fieldId?: string;
  embedding?: number[];
}

interface SimilarClaimPair {
  claimAId: string;
  claimBId: string;
  similarity: number;
  content: {
    claimA: string;
    claimB: string;
  };
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Find similar claims between two users
 */
export async function findSimilarClaimsBetweenUsers(
  userAId: string,
  userBId: string,
  minSimilarity: number = 0.7
): Promise<SimilarClaimPair[]> {
  // Get claims from both users
  const [claimsA, claimsB] = await Promise.all([
    prisma.aIFClaim.findMany({
      where: { authorId: userAId },
      select: {
        id: true,
        content: true,
        authorId: true,
      },
    }),
    prisma.aIFClaim.findMany({
      where: { authorId: userBId },
      select: {
        id: true,
        content: true,
        authorId: true,
      },
    }),
  ]);

  const similarPairs: SimilarClaimPair[] = [];

  // Compare all pairs (for MVP - later use vector search)
  for (const claimA of claimsA) {
    for (const claimB of claimsB) {
      const similarity = calculateTextSimilarity(claimA.content, claimB.content);

      if (similarity >= minSimilarity) {
        similarPairs.push({
          claimAId: claimA.id,
          claimBId: claimB.id,
          similarity,
          content: {
            claimA: claimA.content,
            claimB: claimB.content,
          },
        });
      }
    }
  }

  return similarPairs.sort((a, b) => b.similarity - a.similarity);
}

/**
 * Simple text similarity using Jaccard index on word sets
 * (Replace with embedding similarity for production)
 */
function calculateTextSimilarity(textA: string, textB: string): number {
  const wordsA = new Set(
    textA
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 3)
  );
  const wordsB = new Set(
    textB
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 3)
  );

  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  const intersection = new Set([...wordsA].filter((w) => wordsB.has(w)));
  const union = new Set([...wordsA, ...wordsB]);

  return intersection.size / union.size;
}

/**
 * Find users with similar claims to a given user
 */
export async function findUsersWithSimilarClaims(
  userId: string,
  limit: number = 20
): Promise<Array<{ userId: string; similarClaimCount: number; avgSimilarity: number }>> {
  // Get user's claims
  const userClaims = await prisma.aIFClaim.findMany({
    where: { authorId: userId },
    select: { id: true, content: true },
  });

  if (userClaims.length === 0) return [];

  // Get other users' claims
  const otherClaims = await prisma.aIFClaim.findMany({
    where: { authorId: { not: userId } },
    select: {
      id: true,
      content: true,
      authorId: true,
    },
  });

  // Calculate similarity scores per user
  const userScores = new Map<string, { count: number; totalSim: number }>();

  for (const userClaim of userClaims) {
    for (const otherClaim of otherClaims) {
      const similarity = calculateTextSimilarity(
        userClaim.content,
        otherClaim.content
      );

      if (similarity >= 0.5) {
        const existing = userScores.get(otherClaim.authorId) || {
          count: 0,
          totalSim: 0,
        };
        existing.count++;
        existing.totalSim += similarity;
        userScores.set(otherClaim.authorId, existing);
      }
    }
  }

  // Convert to array and sort
  const results = Array.from(userScores.entries())
    .map(([otherUserId, { count, totalSim }]) => ({
      userId: otherUserId,
      similarClaimCount: count,
      avgSimilarity: totalSim / count,
    }))
    .sort((a, b) => b.avgSimilarity - a.avgSimilarity)
    .slice(0, limit);

  return results;
}

/**
 * Calculate overall claim similarity score between two users
 */
export async function calculateClaimSimilarityScore(
  userAId: string,
  userBId: string
): Promise<{ score: number; similarPairs: SimilarClaimPair[] }> {
  const similarPairs = await findSimilarClaimsBetweenUsers(userAId, userBId, 0.5);

  if (similarPairs.length === 0) {
    return { score: 0, similarPairs: [] };
  }

  // Score based on number and quality of similar claims
  const avgSimilarity =
    similarPairs.reduce((sum, p) => sum + p.similarity, 0) / similarPairs.length;

  // Normalize by expected number of matches (diminishing returns)
  const countFactor = Math.min(1, similarPairs.length / 5);

  const score = avgSimilarity * 0.6 + countFactor * 0.4;

  return { score, similarPairs: similarPairs.slice(0, 5) };
}
```

---

### Step 5.3.5: Match Generation Service

**File:** `lib/collaboration/matchService.ts`

```typescript
/**
 * Main service for generating collaboration matches
 */

import { prisma } from "@/lib/prisma";
import { addDays } from "date-fns";
import {
  MatchType,
  CollaborationMatchData,
  MatchSummary,
  MatchReason,
  ScoreComponent,
  MatchScoreBreakdown,
} from "./types";
import {
  calculateAttackProfile,
  getAttackProfile,
  calculateComplementaryScore,
} from "./attackProfileService";
import { calculateClaimSimilarityScore } from "./claimSimilarityService";

const MATCH_EXPIRY_DAYS = 30;
const DEFAULT_MIN_SCORE = 0.5;

/**
 * Generate matches for a user
 */
export async function generateMatchesForUser(
  userId: string
): Promise<string[]> {
  // Get user's configuration
  const config = await prisma.matchConfiguration.findUnique({
    where: { userId },
  });

  if (config && !config.enableMatching) {
    return [];
  }

  const minScore = config?.minScore || DEFAULT_MIN_SCORE;
  const preferredTypes = config?.preferredMatchTypes || [
    "SIMILAR_CLAIMS",
    "COMPLEMENTARY_ATTACKS",
    "SHARED_INTERESTS",
  ];

  // Calculate user's attack profile if needed
  await calculateAttackProfile(userId);

  // Find potential matches
  const potentialMatches = await findPotentialMatches(userId);
  const newMatchIds: string[] = [];

  for (const candidateId of potentialMatches) {
    // Calculate scores for each match type
    const matchResults = await evaluateMatch(
      userId,
      candidateId,
      preferredTypes,
      minScore
    );

    for (const result of matchResults) {
      if (result.score >= minScore) {
        const match = await createOrUpdateMatch(userId, candidateId, result);
        if (match) {
          newMatchIds.push(match.id);
        }
      }
    }
  }

  return newMatchIds;
}

/**
 * Find potential match candidates
 */
async function findPotentialMatches(userId: string): Promise<string[]> {
  // Get users who:
  // 1. Have made claims in similar fields
  // 2. Have participated in same arguments
  // 3. Have similar research interests

  const userFields = await prisma.researchInterest.findMany({
    where: { userId },
    select: { fieldId: true },
  });

  const fieldIds = userFields.map((f) => f.fieldId);

  // Find users with overlapping interests
  const candidates = await prisma.researchInterest.findMany({
    where: {
      fieldId: { in: fieldIds },
      userId: { not: userId },
    },
    select: { userId: true },
    distinct: ["userId"],
  });

  // Also find users who have attacked or been attacked by this user's claims
  const interactedUsers = await prisma.aIFAttack.findMany({
    where: {
      OR: [
        { targetClaim: { authorId: userId } },
        { attackingClaim: { authorId: userId } },
      ],
    },
    select: {
      targetClaim: { select: { authorId: true } },
      attackingClaim: { select: { authorId: true } },
    },
  });

  const interactedUserIds = new Set(
    interactedUsers.flatMap((a) => [
      a.targetClaim?.authorId,
      a.attackingClaim?.authorId,
    ])
  );
  interactedUserIds.delete(userId);

  // Combine and dedupe
  const allCandidates = new Set([
    ...candidates.map((c) => c.userId),
    ...interactedUserIds,
  ]);

  // Remove already-matched users with active matches
  const existingMatches = await prisma.collaborationMatch.findMany({
    where: {
      userId,
      status: { in: ["SUGGESTED", "VIEWED", "SAVED"] },
      expiresAt: { gt: new Date() },
    },
    select: { matchedUserId: true },
  });

  const existingMatchedIds = new Set(existingMatches.map((m) => m.matchedUserId));

  return Array.from(allCandidates).filter(
    (id) => id && !existingMatchedIds.has(id)
  ) as string[];
}

/**
 * Evaluate a potential match
 */
async function evaluateMatch(
  userAId: string,
  userBId: string,
  types: MatchType[],
  minScore: number
): Promise<
  Array<{
    type: MatchType;
    score: number;
    reasons: Omit<MatchReason, "id" | "matchId">[];
    evidence: {
      sharedClaimIds: string[];
      complementaryAttackIds: string[];
      sharedFieldIds: string[];
    };
  }>
> {
  const results: Array<{
    type: MatchType;
    score: number;
    reasons: Omit<MatchReason, "id" | "matchId">[];
    evidence: {
      sharedClaimIds: string[];
      complementaryAttackIds: string[];
      sharedFieldIds: string[];
    };
  }> = [];

  // Similar Claims
  if (types.includes("SIMILAR_CLAIMS")) {
    const { score, similarPairs } = await calculateClaimSimilarityScore(
      userAId,
      userBId
    );

    if (score >= minScore * 0.8) {
      results.push({
        type: "SIMILAR_CLAIMS",
        score,
        reasons: similarPairs.slice(0, 3).map((pair, i) => ({
          category: "claim_similarity",
          weight: 1 / (i + 1),
          title: "Similar Position",
          description: `Both made similar claims: "${pair.content.claimA.slice(0, 100)}..."`,
          claimAId: pair.claimAId,
          claimBId: pair.claimBId,
        })),
        evidence: {
          sharedClaimIds: similarPairs.map((p) => p.claimAId),
          complementaryAttackIds: [],
          sharedFieldIds: [],
        },
      });
    }
  }

  // Complementary Attacks
  if (types.includes("COMPLEMENTARY_ATTACKS")) {
    const [profileA, profileB] = await Promise.all([
      getAttackProfile(userAId),
      getAttackProfile(userBId),
    ]);

    if (profileA && profileB) {
      const score = calculateComplementaryScore(profileA, profileB);

      if (score >= minScore * 0.8) {
        const reasons: Omit<MatchReason, "id" | "matchId">[] = [];

        if (
          profileA.primaryAttackType &&
          profileB.primaryAttackType &&
          profileA.primaryAttackType !== profileB.primaryAttackType
        ) {
          reasons.push({
            category: "attack_complement",
            weight: 0.5,
            title: "Complementary Attack Styles",
            description: `You specialize in ${profileA.primaryAttackType.toLowerCase()} attacks, they in ${profileB.primaryAttackType.toLowerCase()}`,
          });
        }

        results.push({
          type: "COMPLEMENTARY_ATTACKS",
          score,
          reasons,
          evidence: {
            sharedClaimIds: [],
            complementaryAttackIds: [],
            sharedFieldIds: [],
          },
        });
      }
    }
  }

  // Shared Interests
  if (types.includes("SHARED_INTERESTS")) {
    const [interestsA, interestsB] = await Promise.all([
      prisma.researchInterest.findMany({
        where: { userId: userAId },
        include: { field: { select: { id: true, name: true } } },
      }),
      prisma.researchInterest.findMany({
        where: { userId: userBId },
        include: { field: { select: { id: true, name: true } } },
      }),
    ]);

    const fieldIdsA = new Set(interestsA.map((i) => i.fieldId));
    const sharedFields = interestsB.filter((i) => fieldIdsA.has(i.fieldId));

    if (sharedFields.length > 0) {
      const score = Math.min(1, sharedFields.length / 3);

      results.push({
        type: "SHARED_INTERESTS",
        score,
        reasons: sharedFields.slice(0, 3).map((field) => ({
          category: "shared_interest",
          weight: 1 / sharedFields.length,
          title: "Shared Field",
          description: `Both interested in ${field.field.name}`,
          fieldId: field.fieldId,
        })),
        evidence: {
          sharedClaimIds: [],
          complementaryAttackIds: [],
          sharedFieldIds: sharedFields.map((f) => f.fieldId),
        },
      });
    }
  }

  return results;
}

/**
 * Create or update a match record
 */
async function createOrUpdateMatch(
  userId: string,
  matchedUserId: string,
  matchData: {
    type: MatchType;
    score: number;
    reasons: Omit<MatchReason, "id" | "matchId">[];
    evidence: {
      sharedClaimIds: string[];
      complementaryAttackIds: string[];
      sharedFieldIds: string[];
    };
  }
): Promise<{ id: string } | null> {
  const expiresAt = addDays(new Date(), MATCH_EXPIRY_DAYS);

  const match = await prisma.collaborationMatch.upsert({
    where: {
      userId_matchedUserId_matchType: {
        userId,
        matchedUserId,
        matchType: matchData.type,
      },
    },
    update: {
      score: matchData.score,
      sharedClaimIds: matchData.evidence.sharedClaimIds,
      complementaryAttackIds: matchData.evidence.complementaryAttackIds,
      sharedFieldIds: matchData.evidence.sharedFieldIds,
      expiresAt,
      generatedAt: new Date(),
    },
    create: {
      userId,
      matchedUserId,
      matchType: matchData.type,
      score: matchData.score,
      sharedClaimIds: matchData.evidence.sharedClaimIds,
      complementaryAttackIds: matchData.evidence.complementaryAttackIds,
      sharedFieldIds: matchData.evidence.sharedFieldIds,
      expiresAt,
      reasons: {
        createMany: {
          data: matchData.reasons,
        },
      },
    },
    select: { id: true },
  });

  return match;
}

/**
 * Get matches for a user
 */
export async function getMatchesForUser(
  userId: string,
  options?: {
    status?: string[];
    type?: MatchType[];
    limit?: number;
  }
): Promise<MatchSummary[]> {
  const where: any = {
    userId,
    expiresAt: { gt: new Date() },
  };

  if (options?.status) {
    where.status = { in: options.status };
  }
  if (options?.type) {
    where.matchType = { in: options.type };
  }

  const matches = await prisma.collaborationMatch.findMany({
    where,
    orderBy: { score: "desc" },
    take: options?.limit || 20,
    include: {
      matchedUser: {
        select: { id: true, name: true, image: true },
      },
      reasons: {
        take: 1,
        orderBy: { weight: "desc" },
      },
    },
  });

  return matches.map((m) => ({
    id: m.id,
    matchType: m.matchType as MatchType,
    status: m.status as any,
    score: m.score,
    topReason: m.reasons[0]?.title || "Potential collaboration",
    matchedUser: {
      id: m.matchedUser.id,
      name: m.matchedUser.name,
      image: m.matchedUser.image,
    },
    generatedAt: m.generatedAt,
  }));
}

/**
 * Get full match details
 */
export async function getMatchDetails(
  matchId: string
): Promise<CollaborationMatchData | null> {
  const match = await prisma.collaborationMatch.findUnique({
    where: { id: matchId },
    include: {
      matchedUser: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      reasons: true,
    },
  });

  if (!match) return null;

  return {
    id: match.id,
    matchType: match.matchType as MatchType,
    status: match.status as any,
    score: match.score,
    reasons: match.reasons.map((r) => ({
      id: r.id,
      category: r.category,
      weight: r.weight,
      title: r.title,
      description: r.description,
      claimAId: r.claimAId || undefined,
      claimBId: r.claimBId || undefined,
      attackAId: r.attackAId || undefined,
      attackBId: r.attackBId || undefined,
      fieldId: r.fieldId || undefined,
    })),
    sharedClaimIds: match.sharedClaimIds,
    complementaryAttackIds: match.complementaryAttackIds,
    sharedFieldIds: match.sharedFieldIds,
    generatedAt: match.generatedAt,
    viewedAt: match.viewedAt || undefined,
    savedAt: match.savedAt || undefined,
    expiresAt: match.expiresAt,
    matchedUser: {
      id: match.matchedUser.id,
      name: match.matchedUser.name,
      image: match.matchedUser.image,
    },
  };
}

/**
 * Update match status
 */
export async function updateMatchStatus(
  matchId: string,
  userId: string,
  status: "VIEWED" | "SAVED" | "DISMISSED" | "CONTACTED"
): Promise<void> {
  const updateData: any = { status };

  switch (status) {
    case "VIEWED":
      updateData.viewedAt = new Date();
      break;
    case "SAVED":
      updateData.savedAt = new Date();
      break;
    case "DISMISSED":
      updateData.dismissedAt = new Date();
      break;
    case "CONTACTED":
      updateData.contactedAt = new Date();
      break;
  }

  await prisma.collaborationMatch.updateMany({
    where: { id: matchId, userId },
    data: updateData,
  });
}
```

---

## Phase 5.3 Part 1 Checklist

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 1 | Prisma schema | `prisma/schema.prisma` | ✅ |
| 2 | TypeScript types | `lib/collaboration/types.ts` | ✅ |
| 3 | Attack profile service | `lib/collaboration/attackProfileService.ts` | ✅ |
| 4 | Claim similarity service | `lib/collaboration/claimSimilarityService.ts` | ✅ |
| 5 | Match generation service | `lib/collaboration/matchService.ts` | ✅ |

---

*Continued in Part 2: API Routes, Hooks & UI Components*
