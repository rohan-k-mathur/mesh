# Phase 4.2: Argumentation-Based Reputation — Part 2

**Sub-Phase:** 4.2 of 4.3  
**Focus:** Reviewer Profiles, API Routes & React Query Hooks

---

## Implementation Steps (Continued)

### Step 4.2.6: Reviewer Profile Service

**File:** `lib/reputation/reviewerProfileService.ts`

```typescript
/**
 * Service for managing reviewer profiles
 */

import { prisma } from "@/lib/prisma";
import { ReviewerProfileSummary } from "./types";

/**
 * Update reviewer profile after review completion
 */
export async function updateReviewerProfile(
  userId: string,
  reviewData: {
    reviewId: string;
    commitmentCount: number;
    hasBlockingConcerns: boolean;
    completedOnTime: boolean;
    responseDays: number;
    topicId?: string;
  }
) {
  // Get current profile or create
  const existing = await prisma.reviewerProfile.findUnique({
    where: { userId },
  });

  const totalReviews = (existing?.totalReviews || 0) + 1;
  const completedOnTime =
    (existing?.completedOnTime || 0) + (reviewData.completedOnTime ? 1 : 0);

  // Update running averages
  const prevAvgCommitments = existing?.averageCommitments || 0;
  const newAvgCommitments =
    (prevAvgCommitments * (totalReviews - 1) + reviewData.commitmentCount) /
    totalReviews;

  const prevBlockingRate = existing?.blockingConcernRate || 0;
  const newBlockingRate =
    (prevBlockingRate * (totalReviews - 1) +
      (reviewData.hasBlockingConcerns ? 1 : 0)) /
    totalReviews;

  const prevAvgDays = existing?.averageResponseDays || 0;
  const newAvgDays =
    (prevAvgDays * (totalReviews - 1) + reviewData.responseDays) / totalReviews;

  // Update specialties
  let topSpecialties = (existing?.topSpecialties as any[]) || [];
  if (reviewData.topicId) {
    const specialtyIndex = topSpecialties.findIndex(
      (s) => s.topicId === reviewData.topicId
    );
    if (specialtyIndex >= 0) {
      topSpecialties[specialtyIndex].reviewCount++;
    } else {
      topSpecialties.push({ topicId: reviewData.topicId, reviewCount: 1 });
    }
    // Keep top 5
    topSpecialties = topSpecialties
      .sort((a, b) => b.reviewCount - a.reviewCount)
      .slice(0, 5);
  }

  await prisma.reviewerProfile.upsert({
    where: { userId },
    create: {
      userId,
      totalReviews: 1,
      completedOnTime: reviewData.completedOnTime ? 1 : 0,
      averageCommitments: reviewData.commitmentCount,
      blockingConcernRate: reviewData.hasBlockingConcerns ? 1 : 0,
      averageResponseDays: reviewData.responseDays,
      topSpecialties: topSpecialties as any,
    },
    update: {
      totalReviews,
      completedOnTime,
      averageCommitments: newAvgCommitments,
      blockingConcernRate: newBlockingRate,
      averageResponseDays: newAvgDays,
      topSpecialties: topSpecialties as any,
    },
  });
}

/**
 * Update concern resolution rate
 */
export async function updateConcernResolution(
  userId: string,
  concernsRaised: number,
  concernsResolved: number
) {
  if (concernsRaised === 0) return;

  const rate = concernsResolved / concernsRaised;

  const existing = await prisma.reviewerProfile.findUnique({
    where: { userId },
  });

  if (!existing) return;

  // Weighted average with existing
  const prevRate = existing.concernResolutionRate || 0;
  const prevWeight = existing.totalReviews - 1;
  const newRate = (prevRate * prevWeight + rate) / existing.totalReviews;

  await prisma.reviewerProfile.update({
    where: { userId },
    data: { concernResolutionRate: newRate },
  });
}

/**
 * Track invitation acceptance
 */
export async function trackInvitationResponse(
  userId: string,
  accepted: boolean,
  isRepeatInvitation: boolean
) {
  const existing = await prisma.reviewerProfile.findUnique({
    where: { userId },
  });

  const totalInvitations = (existing?.totalReviews || 0) + 1; // Approximation
  const acceptCount = accepted
    ? (existing?.totalReviews || 0) * (existing?.invitationAcceptRate || 0) + 1
    : (existing?.totalReviews || 0) * (existing?.invitationAcceptRate || 0);

  await prisma.reviewerProfile.upsert({
    where: { userId },
    create: {
      userId,
      invitationAcceptRate: accepted ? 1 : 0,
      repeatInvitations: isRepeatInvitation ? 1 : 0,
    },
    update: {
      invitationAcceptRate: acceptCount / totalInvitations,
      repeatInvitations: isRepeatInvitation
        ? { increment: 1 }
        : existing?.repeatInvitations || 0,
    },
  });
}

/**
 * Get reviewer profile
 */
export async function getReviewerProfile(
  userId: string
): Promise<ReviewerProfileSummary | null> {
  const profile = await prisma.reviewerProfile.findUnique({
    where: { userId },
  });

  if (!profile) return null;

  // Enrich specialties with topic names
  let specialties: ReviewerProfileSummary["topSpecialties"] = [];
  const topSpecialties = profile.topSpecialties as any[] | null;

  if (topSpecialties && topSpecialties.length > 0) {
    const topicIds = topSpecialties.map((s) => s.topicId);
    const topics = await prisma.topic.findMany({
      where: { id: { in: topicIds } },
      select: { id: true, name: true },
    });

    const topicMap = new Map(topics.map((t) => [t.id, t.name]));

    specialties = topSpecialties.map((s) => ({
      topicId: s.topicId,
      topicName: topicMap.get(s.topicId) || "Unknown",
      reviewCount: s.reviewCount,
    }));
  }

  return {
    userId: profile.userId,
    totalReviews: profile.totalReviews,
    completedOnTime: profile.completedOnTime,
    onTimeRate:
      profile.totalReviews > 0
        ? profile.completedOnTime / profile.totalReviews
        : 0,
    averageCommitments: profile.averageCommitments,
    blockingConcernRate: profile.blockingConcernRate,
    concernResolutionRate: profile.concernResolutionRate,
    averageResponseDays: profile.averageResponseDays,
    topSpecialties: specialties,
  };
}

/**
 * Get top reviewers
 */
export async function getTopReviewers(limit = 10) {
  const profiles = await prisma.reviewerProfile.findMany({
    where: { totalReviews: { gte: 3 } }, // At least 3 reviews
    orderBy: [
      { concernResolutionRate: "desc" },
      { totalReviews: "desc" },
    ],
    take: limit,
    include: {
      user: { select: { id: true, name: true, image: true } },
    },
  });

  return profiles.map((p, index) => ({
    rank: index + 1,
    userId: p.userId,
    userName: p.user.name || "Unknown",
    userImage: p.user.image,
    totalReviews: p.totalReviews,
    onTimeRate:
      p.totalReviews > 0 ? p.completedOnTime / p.totalReviews : 0,
    concernResolutionRate: p.concernResolutionRate,
  }));
}
```

---

### Step 4.2.7: Reputation API Routes

**File:** `app/api/reputation/stats/[userId]/route.ts`

```typescript
/**
 * Scholar stats endpoint
 */

import { NextRequest, NextResponse } from "next/server";
import { getScholarStats, recalculateScholarStats } from "@/lib/reputation/statsService";

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const stats = await getScholarStats(params.userId);

    if (!stats) {
      return NextResponse.json(
        { error: "Stats not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Force recalculation
    const stats = await recalculateScholarStats(params.userId);
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error recalculating stats:", error);
    return NextResponse.json(
      { error: "Failed to recalculate stats" },
      { status: 500 }
    );
  }
}
```

**File:** `app/api/reputation/leaderboard/route.ts`

```typescript
/**
 * Reputation leaderboard endpoint
 */

import { NextRequest, NextResponse } from "next/server";
import { getReputationLeaderboard } from "@/lib/reputation/statsService";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const topicId = searchParams.get("topicId") || undefined;

    const leaderboard = await getReputationLeaderboard({ limit, topicId });

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
```

**File:** `app/api/reputation/expertise/[userId]/route.ts`

```typescript
/**
 * Scholar expertise endpoint
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserExpertise } from "@/lib/reputation/expertiseService";

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const expertise = await getUserExpertise(params.userId);
    return NextResponse.json(expertise);
  } catch (error) {
    console.error("Error fetching expertise:", error);
    return NextResponse.json(
      { error: "Failed to fetch expertise" },
      { status: 500 }
    );
  }
}
```

**File:** `app/api/reputation/topic/[topicId]/experts/route.ts`

```typescript
/**
 * Topic experts endpoint
 */

import { NextRequest, NextResponse } from "next/server";
import { getTopicExperts } from "@/lib/reputation/expertiseService";

export async function GET(
  req: NextRequest,
  { params }: { params: { topicId: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    const experts = await getTopicExperts(params.topicId, limit);

    return NextResponse.json(experts);
  } catch (error) {
    console.error("Error fetching experts:", error);
    return NextResponse.json(
      { error: "Failed to fetch experts" },
      { status: 500 }
    );
  }
}
```

**File:** `app/api/reputation/reviewer/[userId]/route.ts`

```typescript
/**
 * Reviewer profile endpoint
 */

import { NextRequest, NextResponse } from "next/server";
import { getReviewerProfile } from "@/lib/reputation/reviewerProfileService";

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const profile = await getReviewerProfile(params.userId);

    if (!profile) {
      return NextResponse.json(
        { error: "Reviewer profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error fetching reviewer profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviewer profile" },
      { status: 500 }
    );
  }
}
```

**File:** `app/api/reputation/contributions/[userId]/route.ts`

```typescript
/**
 * User contributions endpoint
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getUserContributions,
  getContributionSummary,
} from "@/lib/reputation/contributionService";

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const summary = searchParams.get("summary") === "true";
    const type = searchParams.get("type") as any;
    const limit = parseInt(searchParams.get("limit") || "50");

    if (summary) {
      const summaryData = await getContributionSummary(params.userId);
      return NextResponse.json(summaryData);
    }

    const contributions = await getUserContributions(params.userId, {
      type,
      limit,
    });

    return NextResponse.json(contributions);
  } catch (error) {
    console.error("Error fetching contributions:", error);
    return NextResponse.json(
      { error: "Failed to fetch contributions" },
      { status: 500 }
    );
  }
}
```

---

### Step 4.2.8: React Query Hooks

**File:** `lib/reputation/hooks.ts`

```typescript
/**
 * React Query hooks for reputation system
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ScholarStatsSummary,
  ExpertiseAreaSummary,
  ReviewerProfileSummary,
} from "./types";

// ===============================
// Query Keys
// ===============================

export const reputationKeys = {
  all: ["reputation"] as const,
  stats: () => [...reputationKeys.all, "stats"] as const,
  userStats: (userId: string) => [...reputationKeys.stats(), userId] as const,
  leaderboard: (filters?: Record<string, any>) =>
    [...reputationKeys.all, "leaderboard", filters] as const,
  expertise: () => [...reputationKeys.all, "expertise"] as const,
  userExpertise: (userId: string) =>
    [...reputationKeys.expertise(), userId] as const,
  topicExperts: (topicId: string) =>
    [...reputationKeys.expertise(), "topic", topicId] as const,
  reviewer: () => [...reputationKeys.all, "reviewer"] as const,
  reviewerProfile: (userId: string) =>
    [...reputationKeys.reviewer(), userId] as const,
  contributions: () => [...reputationKeys.all, "contributions"] as const,
  userContributions: (userId: string) =>
    [...reputationKeys.contributions(), userId] as const,
};

// ===============================
// Stats Hooks
// ===============================

export function useScholarStats(userId: string) {
  return useQuery({
    queryKey: reputationKeys.userStats(userId),
    queryFn: async (): Promise<ScholarStatsSummary> => {
      const res = await fetch(`/api/reputation/stats/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useRecalculateStats(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/reputation/stats/${userId}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to recalculate stats");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: reputationKeys.userStats(userId),
      });
    },
  });
}

// ===============================
// Leaderboard Hook
// ===============================

export function useReputationLeaderboard(options?: {
  limit?: number;
  topicId?: string;
}) {
  const params = new URLSearchParams();
  if (options?.limit) params.set("limit", options.limit.toString());
  if (options?.topicId) params.set("topicId", options.topicId);

  return useQuery({
    queryKey: reputationKeys.leaderboard(options),
    queryFn: async () => {
      const res = await fetch(`/api/reputation/leaderboard?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ===============================
// Expertise Hooks
// ===============================

export function useUserExpertise(userId: string) {
  return useQuery({
    queryKey: reputationKeys.userExpertise(userId),
    queryFn: async (): Promise<ExpertiseAreaSummary[]> => {
      const res = await fetch(`/api/reputation/expertise/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch expertise");
      return res.json();
    },
    enabled: !!userId,
  });
}

export function useTopicExperts(topicId: string, limit = 10) {
  return useQuery({
    queryKey: reputationKeys.topicExperts(topicId),
    queryFn: async () => {
      const res = await fetch(
        `/api/reputation/topic/${topicId}/experts?limit=${limit}`
      );
      if (!res.ok) throw new Error("Failed to fetch experts");
      return res.json();
    },
    enabled: !!topicId,
  });
}

// ===============================
// Reviewer Profile Hooks
// ===============================

export function useReviewerProfile(userId: string) {
  return useQuery({
    queryKey: reputationKeys.reviewerProfile(userId),
    queryFn: async (): Promise<ReviewerProfileSummary> => {
      const res = await fetch(`/api/reputation/reviewer/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch reviewer profile");
      return res.json();
    },
    enabled: !!userId,
  });
}

// ===============================
// Contributions Hooks
// ===============================

export function useUserContributions(
  userId: string,
  options?: { type?: string; limit?: number }
) {
  const params = new URLSearchParams();
  if (options?.type) params.set("type", options.type);
  if (options?.limit) params.set("limit", options.limit.toString());

  return useQuery({
    queryKey: [...reputationKeys.userContributions(userId), options],
    queryFn: async () => {
      const res = await fetch(
        `/api/reputation/contributions/${userId}?${params.toString()}`
      );
      if (!res.ok) throw new Error("Failed to fetch contributions");
      return res.json();
    },
    enabled: !!userId,
  });
}

export function useContributionSummary(userId: string) {
  return useQuery({
    queryKey: [...reputationKeys.userContributions(userId), "summary"],
    queryFn: async () => {
      const res = await fetch(
        `/api/reputation/contributions/${userId}?summary=true`
      );
      if (!res.ok) throw new Error("Failed to fetch contribution summary");
      return res.json();
    },
    enabled: !!userId,
  });
}

// ===============================
// Current User Shorthand Hooks
// ===============================

export function useMyStats() {
  return useQuery({
    queryKey: [...reputationKeys.stats(), "me"],
    queryFn: async () => {
      const res = await fetch("/api/reputation/stats/me");
      if (!res.ok) throw new Error("Failed to fetch my stats");
      return res.json();
    },
  });
}

export function useMyExpertise() {
  return useQuery({
    queryKey: [...reputationKeys.expertise(), "me"],
    queryFn: async () => {
      const res = await fetch("/api/reputation/expertise/me");
      if (!res.ok) throw new Error("Failed to fetch my expertise");
      return res.json();
    },
  });
}
```

---

## Phase 4.2 Part 2 Checklist

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 1 | Reviewer profile service | `lib/reputation/reviewerProfileService.ts` | 📋 Part 2 |
| 2 | Stats API route | `app/api/reputation/stats/[userId]/route.ts` | 📋 Part 2 |
| 3 | Leaderboard API | `app/api/reputation/leaderboard/route.ts` | 📋 Part 2 |
| 4 | Expertise API | `app/api/reputation/expertise/[userId]/route.ts` | 📋 Part 2 |
| 5 | Topic experts API | `app/api/reputation/topic/[topicId]/experts/route.ts` | 📋 Part 2 |
| 6 | Reviewer profile API | `app/api/reputation/reviewer/[userId]/route.ts` | 📋 Part 2 |
| 7 | Contributions API | `app/api/reputation/contributions/[userId]/route.ts` | 📋 Part 2 |
| 8 | React Query hooks | `lib/reputation/hooks.ts` | 📋 Part 2 |

---

## Next: Part 3

Continue to Phase 4.2 Part 3 for:
- ScholarProfile UI Component
- ReputationBadge Component
- ExpertiseDisplay Component
- Leaderboard Component
- ContributionHistory Component

---

*End of Phase 4.2 Part 2*
