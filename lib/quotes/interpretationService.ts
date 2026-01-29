/**
 * Interpretation Service
 * 
 * Phase 2.3: Quote Nodes & Argument Quality Gates
 * 
 * Service for managing quote interpretations - allowing scholars
 * to provide different readings of the same textual passage.
 */

import { prisma } from "@/lib/prismaclient";
import {
  CreateInterpretationOptions,
  InterpretationWithVotes,
  InterpretationSummary,
  VoteResult,
  FrameworkStats,
} from "./types";

// ─────────────────────────────────────────────────────────
// Create Interpretation
// ─────────────────────────────────────────────────────────

/**
 * Create a new interpretation of a quote
 */
export async function createInterpretation(
  options: CreateInterpretationOptions,
  userId: string
): Promise<InterpretationSummary> {
  // Verify quote exists
  const quote = await prisma.quoteNode.findUnique({
    where: { id: options.quoteId },
  });

  if (!quote) {
    throw new Error("Quote not found");
  }

  // Verify support/challenge targets exist if provided
  if (options.supportsId) {
    const supportTarget = await prisma.quoteInterpretation.findUnique({
      where: { id: options.supportsId },
    });
    if (!supportTarget) {
      throw new Error("Support target interpretation not found");
    }
  }

  if (options.challengesId) {
    const challengeTarget = await prisma.quoteInterpretation.findUnique({
      where: { id: options.challengesId },
    });
    if (!challengeTarget) {
      throw new Error("Challenge target interpretation not found");
    }
  }

  const interpretation = await prisma.quoteInterpretation.create({
    data: {
      quoteId: options.quoteId,
      interpretation: options.interpretation,
      framework: options.framework,
      methodology: options.methodology,
      supportsId: options.supportsId,
      challengesId: options.challengesId,
      authorId: userId,
    },
    include: {
      author: {
        select: { id: true, name: true, image: true },
      },
    },
  });

  return {
    id: interpretation.id,
    interpretation: interpretation.interpretation,
    framework: interpretation.framework || undefined,
    methodology: interpretation.methodology || undefined,
    author: {
      id: interpretation.author.id,
      name: interpretation.author.name || "Unknown",
      image: interpretation.author.image || undefined,
    },
    voteScore: interpretation.voteScore,
    createdAt: interpretation.createdAt,
  };
}

// ─────────────────────────────────────────────────────────
// Get Interpretations
// ─────────────────────────────────────────────────────────

/**
 * Get all interpretations for a quote
 */
export async function getInterpretations(
  quoteId: string,
  userId?: string
): Promise<InterpretationWithVotes[]> {
  const interpretations = await prisma.quoteInterpretation.findMany({
    where: { quoteId },
    include: {
      author: {
        select: { id: true, name: true, image: true },
      },
      votes: userId
        ? {
            where: { userId },
            select: { vote: true },
          }
        : false,
      supportedBy: {
        include: {
          author: { select: { id: true, name: true, image: true } },
        },
        orderBy: { voteScore: "desc" },
        take: 10,
      },
      challengedBy: {
        include: {
          author: { select: { id: true, name: true, image: true } },
        },
        orderBy: { voteScore: "desc" },
        take: 10,
      },
    },
    orderBy: { voteScore: "desc" },
  });

  return interpretations.map((i) => ({
    id: i.id,
    interpretation: i.interpretation,
    framework: i.framework || undefined,
    methodology: i.methodology || undefined,
    author: {
      id: i.author.id,
      name: i.author.name || "Unknown",
      image: i.author.image || undefined,
    },
    voteScore: i.voteScore,
    userVote: userId && Array.isArray(i.votes) && i.votes[0]?.vote,
    supportedBy: i.supportedBy.map((s) => ({
      id: s.id,
      interpretation: s.interpretation,
      framework: s.framework || undefined,
      methodology: s.methodology || undefined,
      author: {
        id: s.author.id,
        name: s.author.name || "Unknown",
        image: s.author.image || undefined,
      },
      voteScore: s.voteScore,
      createdAt: s.createdAt,
    })),
    challengedBy: i.challengedBy.map((c) => ({
      id: c.id,
      interpretation: c.interpretation,
      framework: c.framework || undefined,
      methodology: c.methodology || undefined,
      author: {
        id: c.author.id,
        name: c.author.name || "Unknown",
        image: c.author.image || undefined,
      },
      voteScore: c.voteScore,
      createdAt: c.createdAt,
    })),
    createdAt: i.createdAt,
  }));
}

/**
 * Get a single interpretation by ID
 */
export async function getInterpretation(
  interpretationId: string,
  userId?: string
): Promise<InterpretationWithVotes | null> {
  const interpretation = await prisma.quoteInterpretation.findUnique({
    where: { id: interpretationId },
    include: {
      author: {
        select: { id: true, name: true, image: true },
      },
      votes: userId
        ? {
            where: { userId },
            select: { vote: true },
          }
        : false,
      supportedBy: {
        include: {
          author: { select: { id: true, name: true, image: true } },
        },
        orderBy: { voteScore: "desc" },
      },
      challengedBy: {
        include: {
          author: { select: { id: true, name: true, image: true } },
        },
        orderBy: { voteScore: "desc" },
      },
    },
  });

  if (!interpretation) return null;

  return {
    id: interpretation.id,
    interpretation: interpretation.interpretation,
    framework: interpretation.framework || undefined,
    methodology: interpretation.methodology || undefined,
    author: {
      id: interpretation.author.id,
      name: interpretation.author.name || "Unknown",
      image: interpretation.author.image || undefined,
    },
    voteScore: interpretation.voteScore,
    userVote:
      userId && Array.isArray(interpretation.votes) && interpretation.votes[0]?.vote,
    supportedBy: interpretation.supportedBy.map((s) => ({
      id: s.id,
      interpretation: s.interpretation,
      framework: s.framework || undefined,
      methodology: s.methodology || undefined,
      author: {
        id: s.author.id,
        name: s.author.name || "Unknown",
        image: s.author.image || undefined,
      },
      voteScore: s.voteScore,
      createdAt: s.createdAt,
    })),
    challengedBy: interpretation.challengedBy.map((c) => ({
      id: c.id,
      interpretation: c.interpretation,
      framework: c.framework || undefined,
      methodology: c.methodology || undefined,
      author: {
        id: c.author.id,
        name: c.author.name || "Unknown",
        image: c.author.image || undefined,
      },
      voteScore: c.voteScore,
      createdAt: c.createdAt,
    })),
    createdAt: interpretation.createdAt,
  };
}

// ─────────────────────────────────────────────────────────
// Voting
// ─────────────────────────────────────────────────────────

/**
 * Vote on an interpretation (upvote +1 or downvote -1)
 */
export async function voteOnInterpretation(
  interpretationId: string,
  userId: string,
  vote: 1 | -1
): Promise<VoteResult> {
  // Check existing vote
  const existingVote = await prisma.interpretationVote.findUnique({
    where: {
      interpretationId_userId: {
        interpretationId,
        userId,
      },
    },
  });

  if (existingVote) {
    if (existingVote.vote === vote) {
      // Same vote = remove it
      await prisma.$transaction([
        prisma.interpretationVote.delete({
          where: { id: existingVote.id },
        }),
        prisma.quoteInterpretation.update({
          where: { id: interpretationId },
          data: { voteScore: { decrement: vote } },
        }),
      ]);

      const updated = await prisma.quoteInterpretation.findUnique({
        where: { id: interpretationId },
        select: { voteScore: true },
      });

      return { action: "removed", newScore: updated?.voteScore || 0 };
    } else {
      // Different vote = change it (swing by 2)
      await prisma.$transaction([
        prisma.interpretationVote.update({
          where: { id: existingVote.id },
          data: { vote },
        }),
        prisma.quoteInterpretation.update({
          where: { id: interpretationId },
          data: { voteScore: { increment: vote * 2 } },
        }),
      ]);

      const updated = await prisma.quoteInterpretation.findUnique({
        where: { id: interpretationId },
        select: { voteScore: true },
      });

      return { action: "changed", newScore: updated?.voteScore || 0 };
    }
  } else {
    // New vote
    await prisma.$transaction([
      prisma.interpretationVote.create({
        data: {
          interpretationId,
          userId,
          vote,
        },
      }),
      prisma.quoteInterpretation.update({
        where: { id: interpretationId },
        data: { voteScore: { increment: vote } },
      }),
    ]);

    const updated = await prisma.quoteInterpretation.findUnique({
      where: { id: interpretationId },
      select: { voteScore: true },
    });

    return { action: "created", newScore: updated?.voteScore || 0 };
  }
}

// ─────────────────────────────────────────────────────────
// Update/Delete Interpretation
// ─────────────────────────────────────────────────────────

/**
 * Update an interpretation (only by author)
 */
export async function updateInterpretation(
  interpretationId: string,
  userId: string,
  updates: {
    interpretation?: string;
    framework?: string;
    methodology?: string;
  }
): Promise<InterpretationSummary> {
  // Check ownership
  const existing = await prisma.quoteInterpretation.findUnique({
    where: { id: interpretationId },
    select: { authorId: true },
  });

  if (!existing) {
    throw new Error("Interpretation not found");
  }

  if (existing.authorId !== userId) {
    throw new Error("Not authorized to edit this interpretation");
  }

  const updated = await prisma.quoteInterpretation.update({
    where: { id: interpretationId },
    data: {
      ...updates,
      updatedAt: new Date(),
    },
    include: {
      author: {
        select: { id: true, name: true, image: true },
      },
    },
  });

  return {
    id: updated.id,
    interpretation: updated.interpretation,
    framework: updated.framework || undefined,
    methodology: updated.methodology || undefined,
    author: {
      id: updated.author.id,
      name: updated.author.name || "Unknown",
      image: updated.author.image || undefined,
    },
    voteScore: updated.voteScore,
    createdAt: updated.createdAt,
  };
}

/**
 * Delete an interpretation (only by author, and only if no votes)
 */
export async function deleteInterpretation(
  interpretationId: string,
  userId: string
): Promise<boolean> {
  const existing = await prisma.quoteInterpretation.findUnique({
    where: { id: interpretationId },
    include: {
      _count: {
        select: { votes: true, supportedBy: true, challengedBy: true },
      },
    },
  });

  if (!existing) {
    throw new Error("Interpretation not found");
  }

  if (existing.authorId !== userId) {
    throw new Error("Not authorized to delete this interpretation");
  }

  if (existing._count.votes > 0) {
    throw new Error("Cannot delete interpretation with votes");
  }

  if (existing._count.supportedBy > 0 || existing._count.challengedBy > 0) {
    throw new Error("Cannot delete interpretation that is referenced by others");
  }

  await prisma.quoteInterpretation.delete({
    where: { id: interpretationId },
  });

  return true;
}

// ─────────────────────────────────────────────────────────
// Framework Statistics
// ─────────────────────────────────────────────────────────

/**
 * Get frameworks used in interpretations for a deliberation
 */
export async function getFrameworksInUse(
  deliberationId: string
): Promise<FrameworkStats[]> {
  const frameworks = await prisma.quoteInterpretation.groupBy({
    by: ["framework"],
    where: {
      quote: {
        OR: [
          {
            usedInClaims: {
              some: {
                claim: { deliberationId },
              },
            },
          },
          {
            usedInArguments: {
              some: {
                argument: { deliberationId },
              },
            },
          },
        ],
      },
      framework: { not: null },
    },
    _count: true,
  });

  const total = frameworks.reduce((sum, f) => sum + f._count, 0);

  return frameworks
    .filter((f) => f.framework)
    .map((f) => ({
      framework: f.framework!,
      count: f._count,
      percentage: total > 0 ? (f._count / total) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Get top interpretations by framework
 */
export async function getTopInterpretationsByFramework(
  framework: string,
  limit = 10
): Promise<InterpretationSummary[]> {
  const interpretations = await prisma.quoteInterpretation.findMany({
    where: {
      framework: {
        contains: framework,
        mode: "insensitive",
      },
    },
    include: {
      author: {
        select: { id: true, name: true, image: true },
      },
    },
    orderBy: { voteScore: "desc" },
    take: limit,
  });

  return interpretations.map((i) => ({
    id: i.id,
    interpretation: i.interpretation,
    framework: i.framework || undefined,
    methodology: i.methodology || undefined,
    author: {
      id: i.author.id,
      name: i.author.name || "Unknown",
      image: i.author.image || undefined,
    },
    voteScore: i.voteScore,
    createdAt: i.createdAt,
  }));
}
