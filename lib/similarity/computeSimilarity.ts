/**
 * Phase 3.4.2: Similarity Computation
 * 
 * Computes similarity scores between deliberations and stacks
 * based on topic overlap, citation similarity, and participant overlap.
 */

import { prisma } from "@/lib/prismaclient";

export interface SimilarityScore {
  id: string;
  type: "deliberation" | "stack";
  title: string;
  score: number;
  reasons: string[];
  metadata?: {
    sharedSources?: number;
    sharedTopics?: number;
    overlapRatio?: number;
  };
}

/**
 * Find deliberations related to the given deliberation
 * based on shared sources and topic overlap
 */
export async function findRelatedDeliberations(
  deliberationId: string,
  limit: number = 10
): Promise<SimilarityScore[]> {
  // Get current deliberation's characteristics
  const current = await prisma.deliberation.findUnique({
    where: { id: deliberationId },
    include: {
      citations: {
        select: { sourceId: true },
      },
    },
  });

  if (!current) return [];

  const currentSourceIds = new Set(current.citations.map((c) => c.sourceId));

  // If no sources, can't compute similarity
  if (currentSourceIds.size === 0) return [];

  // Get topics from current sources
  const sources = await prisma.source.findMany({
    where: { id: { in: Array.from(currentSourceIds) } },
    select: { topics: true },
  });

  const currentTopics = new Set<string>();
  for (const source of sources) {
    const topics = (source.topics as string[]) || [];
    topics.forEach((t) => {
      const normalized = t.trim().toLowerCase();
      if (normalized) currentTopics.add(normalized);
    });
  }

  // Find other public deliberations with citations
  const otherDelibs = await prisma.deliberation.findMany({
    where: {
      id: { not: deliberationId },
      isPublic: true,
      citations: { some: {} },
    },
    select: {
      id: true,
      title: true,
      citations: {
        select: { sourceId: true },
      },
    },
    take: 100, // Limit for performance
  });

  // Score each deliberation
  const scores: SimilarityScore[] = [];

  for (const delib of otherDelibs) {
    const reasons: string[] = [];
    let score = 0;

    // Source overlap
    const delibSourceIds = new Set(delib.citations.map((c) => c.sourceId));
    const sharedSources = [...currentSourceIds].filter((id) =>
      delibSourceIds.has(id)
    );

    if (sharedSources.length > 0) {
      const sourceScore = sharedSources.length * 10;
      score += sourceScore;
      reasons.push(`${sharedSources.length} shared source${sharedSources.length > 1 ? "s" : ""}`);
    }

    // Topic overlap (only compute if we have topics)
    let sharedTopicsCount = 0;
    if (currentTopics.size > 0) {
      const delibSources = await prisma.source.findMany({
        where: { id: { in: Array.from(delibSourceIds) } },
        select: { topics: true },
      });

      const delibTopics = new Set<string>();
      for (const source of delibSources) {
        const topics = (source.topics as string[]) || [];
        topics.forEach((t) => {
          const normalized = t.trim().toLowerCase();
          if (normalized) delibTopics.add(normalized);
        });
      }

      const sharedTopics = [...currentTopics].filter((t) => delibTopics.has(t));
      sharedTopicsCount = sharedTopics.length;

      if (sharedTopicsCount > 0) {
        const topicScore = sharedTopicsCount * 5;
        score += topicScore;
        reasons.push(`${sharedTopicsCount} shared topic${sharedTopicsCount > 1 ? "s" : ""}`);
      }
    }

    if (score > 0) {
      scores.push({
        id: delib.id,
        type: "deliberation",
        title: delib.title,
        score,
        reasons,
        metadata: {
          sharedSources: sharedSources.length,
          sharedTopics: sharedTopicsCount,
        },
      });
    }
  }

  // Sort by score and return top N
  return scores
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Find stacks related to a deliberation
 * based on shared sources
 */
export async function findRelatedStacks(
  deliberationId: string,
  limit: number = 10
): Promise<SimilarityScore[]> {
  // Get current deliberation's sources
  const current = await prisma.deliberation.findUnique({
    where: { id: deliberationId },
    include: {
      citations: {
        select: { sourceId: true },
      },
    },
  });

  if (!current) return [];

  const currentSourceIds = new Set(current.citations.map((c) => c.sourceId));

  // If no sources, can't find related stacks
  if (currentSourceIds.size === 0) return [];

  // Find stack items with overlapping sources
  const stackItems = await prisma.stackItem.findMany({
    where: {
      sourceId: { in: Array.from(currentSourceIds) },
      stack: {
        visibility: { in: ["public", "unlisted"] },
      },
    },
    include: {
      stack: {
        select: {
          id: true,
          name: true,
          visibility: true,
          _count: { select: { items: true } },
        },
      },
    },
  });

  // Group by stack and count overlaps
  const stackScores = new Map<
    string,
    { stack: typeof stackItems[0]["stack"]; sharedCount: number }
  >();

  for (const item of stackItems) {
    const existing = stackScores.get(item.stackId);
    if (existing) {
      existing.sharedCount++;
    } else {
      stackScores.set(item.stackId, {
        stack: item.stack,
        sharedCount: 1,
      });
    }
  }

  // Convert to scores
  const scores: SimilarityScore[] = [];

  for (const [stackId, data] of stackScores) {
    const totalItems = data.stack._count.items;
    const overlapRatio = totalItems > 0 ? data.sharedCount / totalItems : 0;
    const score = data.sharedCount * 10 + overlapRatio * 20;

    const reasons: string[] = [
      `${data.sharedCount} shared source${data.sharedCount > 1 ? "s" : ""}`,
    ];
    
    if (overlapRatio >= 0.5) {
      reasons.push(`${Math.round(overlapRatio * 100)}% overlap`);
    }

    scores.push({
      id: stackId,
      type: "stack",
      title: data.stack.name,
      score,
      reasons,
      metadata: {
        sharedSources: data.sharedCount,
        overlapRatio,
      },
    });
  }

  return scores
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Find sources related to a given source
 * based on shared topics or citations in same deliberations
 */
export async function findRelatedSources(
  sourceId: string,
  limit: number = 10
): Promise<SimilarityScore[]> {
  const source = await prisma.source.findUnique({
    where: { id: sourceId },
    select: {
      id: true,
      topics: true,
      citations: {
        select: { deliberationId: true },
      },
    },
  });

  if (!source) return [];

  const sourceTopics = new Set<string>(
    ((source.topics as string[]) || []).map((t) => t.trim().toLowerCase()).filter(Boolean)
  );
  const sourceDelibIds = new Set(
    source.citations.map((c) => c.deliberationId).filter((id): id is string => id !== null)
  );

  // Find sources in same deliberations
  const coOccurringCitations = await prisma.citation.findMany({
    where: {
      deliberationId: { in: Array.from(sourceDelibIds) },
      sourceId: { not: sourceId },
    },
    select: {
      sourceId: true,
      source: {
        select: {
          id: true,
          title: true,
          topics: true,
        },
      },
    },
  });

  // Score each related source
  const scoreMap = new Map<string, { source: any; coOccur: number; topicOverlap: number }>();

  for (const citation of coOccurringCitations) {
    if (!citation.source) continue;

    const existing = scoreMap.get(citation.sourceId);
    if (existing) {
      existing.coOccur++;
    } else {
      const relatedTopics = new Set<string>(
        ((citation.source.topics as string[]) || []).map((t) => t.trim().toLowerCase()).filter(Boolean)
      );
      const sharedTopics = [...sourceTopics].filter((t) => relatedTopics.has(t));
      
      scoreMap.set(citation.sourceId, {
        source: citation.source,
        coOccur: 1,
        topicOverlap: sharedTopics.length,
      });
    }
  }

  // Convert to scores
  const scores: SimilarityScore[] = [];

  for (const [id, data] of scoreMap) {
    const score = data.coOccur * 5 + data.topicOverlap * 3;
    const reasons: string[] = [];

    if (data.coOccur > 0) {
      reasons.push(`cited together ${data.coOccur} time${data.coOccur > 1 ? "s" : ""}`);
    }
    if (data.topicOverlap > 0) {
      reasons.push(`${data.topicOverlap} shared topic${data.topicOverlap > 1 ? "s" : ""}`);
    }

    if (reasons.length > 0) {
      scores.push({
        id,
        type: "deliberation", // Reusing type for sources
        title: data.source.title,
        score,
        reasons,
      });
    }
  }

  return scores
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
