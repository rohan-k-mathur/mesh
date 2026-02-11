/**
 * Phase 3.3: Cross-Room Search Service
 * Enables searching claims across all deliberations,
 * finding related deliberations by shared claims,
 * and getting cross-room status for individual claims.
 */

import { prisma } from "@/lib/prismaclient";
import {
  CrossRoomSearchResult,
  CrossRoomSearchParams,
  RelatedDeliberation,
  ClaimCrossRoomStatus,
} from "./types";

// ─────────────────────────────────────────────────────────
// Cross-Room Search
// ─────────────────────────────────────────────────────────

/**
 * Search claims across all deliberations via canonical claim registry
 */
export async function searchClaimsAcrossRooms(
  params: CrossRoomSearchParams
): Promise<CrossRoomSearchResult[]> {
  const { query, excludeDeliberationId, fields, globalStatus, limit = 20 } = params;

  if (!query || query.length < 2) return [];

  // Build where clause for canonical claims
  const where: Record<string, unknown> = {
    OR: [
      { title: { contains: query, mode: "insensitive" } },
      { representativeText: { contains: query, mode: "insensitive" } },
    ],
  };

  if (fields && fields.length > 0) {
    where.primaryField = { in: fields };
  }

  if (globalStatus) {
    where.globalStatus = globalStatus;
  }

  // Search canonical claims
  const canonicals = await prisma.canonicalClaim.findMany({
    where,
    include: {
      instances: {
        where: excludeDeliberationId
          ? { deliberationId: { not: excludeDeliberationId } }
          : undefined,
        include: {
          claim: {
            select: {
              id: true,
              text: true,
              consensusStatus: true,
              challengeCount: true,
            },
          },
          deliberation: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
    },
    orderBy: [{ totalInstances: "desc" }, { lastActivityAt: "desc" }],
    take: limit,
  });

  // Filter out canonicals with no instances after exclusion
  const filtered = canonicals.filter((c) => c.instances.length > 0);

  return filtered.map((c) => {
    // Calculate match score based on text similarity + instance count
    const queryLower = query.toLowerCase();
    const titleMatch = c.title?.toLowerCase().includes(queryLower) ? 2 : 0;
    const textMatch = c.representativeText?.toLowerCase().includes(queryLower) ? 1 : 0;
    const instanceBoost = Math.min(c.instances.length / 5, 1);
    const matchScore = titleMatch + textMatch + instanceBoost;

    return {
      canonicalClaim: {
        id: c.id,
        slug: c.slug,
        title: c.title,
        representativeText: c.representativeText || undefined,
        globalStatus: c.globalStatus,
        totalInstances: c.totalInstances,
        totalChallenges: c.totalChallenges,
        primaryField: (c as any).primaryField || undefined,
        instances: c.instances.map((inst) => ({
          id: inst.id,
          claimId: inst.claimId,
          claimText: inst.claim.text,
          deliberation: {
            id: inst.deliberation.id,
            title: inst.deliberation.title || "",
          },
          instanceType: inst.instanceType,
          localStatus: inst.localStatus || inst.claim.consensusStatus || undefined,
        })),
      },
      instances: c.instances.map((inst) => ({
        deliberation: {
          id: inst.deliberation.id,
          title: inst.deliberation.title || "",
        },
        claim: {
          id: inst.claim.id,
          text: inst.claim.text,
          status: inst.claim.consensusStatus || "UNDETERMINED",
        },
        challengeCount: inst.claim.challengeCount || 0,
        supportCount: 0,
      })),
      matchScore,
      matchReason: titleMatch > 0 ? "Title match" : "Text match",
    };
  });
}

// ─────────────────────────────────────────────────────────
// Related Deliberations
// ─────────────────────────────────────────────────────────

/**
 * Find deliberations related to a given deliberation by shared canonical claims
 */
export async function findRelatedDeliberations(
  deliberationId: string,
  limit = 10
): Promise<RelatedDeliberation[]> {
  // Get all canonical claim IDs for this deliberation's instances
  const instances = await prisma.claimInstance.findMany({
    where: { deliberationId },
    select: { canonicalClaimId: true },
  });

  const canonicalIds = instances.map((i) => i.canonicalClaimId);

  if (canonicalIds.length === 0) {
    return [];
  }

  // Find other deliberations that share the same canonical claims
  const relatedInstances = await prisma.claimInstance.findMany({
    where: {
      canonicalClaimId: { in: canonicalIds },
      deliberationId: { not: deliberationId },
    },
    include: {
      deliberation: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  // Group by deliberation and count shared claims
  const deliberationMap = new Map<
    string,
    { deliberation: { id: string; title: string }; sharedClaimCount: number }
  >();

  for (const inst of relatedInstances) {
    const existing = deliberationMap.get(inst.deliberationId);
    if (existing) {
      existing.sharedClaimCount++;
    } else {
      deliberationMap.set(inst.deliberationId, {
        deliberation: {
          id: inst.deliberation.id,
          title: inst.deliberation.title || "",
        },
        sharedClaimCount: 1,
      });
    }
  }

  return Array.from(deliberationMap.values())
    .sort((a, b) => b.sharedClaimCount - a.sharedClaimCount)
    .slice(0, limit);
}

// ─────────────────────────────────────────────────────────
// Claim Cross-Room Status
// ─────────────────────────────────────────────────────────

/**
 * Get cross-room status overview for a specific claim
 */
export async function getClaimCrossRoomStatus(
  claimId: string
): Promise<ClaimCrossRoomStatus | null> {
  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
    select: { canonicalClaimId: true },
  });

  if (!claim?.canonicalClaimId) {
    return null;
  }

  const canonical = await prisma.canonicalClaim.findUnique({
    where: { id: claim.canonicalClaimId },
    include: {
      instances: {
        include: {
          claim: {
            select: {
              id: true,
              text: true,
              consensusStatus: true,
              challengeCount: true,
            },
          },
          deliberation: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
    },
  });

  if (!canonical) return null;

  // Aggregate status across instances
  const statusCounts: Record<string, number> = {};
  let totalChallenges = 0;

  for (const inst of canonical.instances) {
    const status = inst.claim.consensusStatus || "UNDETERMINED";
    statusCounts[status] = (statusCounts[status] || 0) + 1;
    totalChallenges += inst.claim.challengeCount || 0;
  }

  return {
    canonicalId: canonical.id,
    globalStatus: canonical.globalStatus,
    totalInstances: canonical.instances.length,
    statusBreakdown: statusCounts,
    totalChallenges,
    instances: canonical.instances.map((inst) => ({
      deliberationId: inst.deliberation.id,
      deliberationTitle: inst.deliberation.title || "",
      claimId: inst.claim.id,
      localStatus: inst.claim.consensusStatus || "UNDETERMINED",
      challengeCount: inst.claim.challengeCount || 0,
    })),
  };
}
