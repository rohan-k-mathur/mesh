/**
 * AIF Graph Builder - Dialogue-Aware Graph Construction
 * 
 * Purpose: Build complete AIF graphs with optional dialogue move layer
 * Phase: 2.1 - Dialogue Visualization Roadmap
 * Date: November 2, 2025
 * 
 * This module provides functions to construct AIF graphs from database records,
 * including dialogue move provenance when requested.
 */

import { prisma } from "@/lib/prismaclient";
import type {
  AifGraphWithDialogue,
  AifNodeWithDialogue,
  DialogueAwareEdge,
  DialogueMoveWithAif,
  BuildGraphOptions,
} from "@/types/aif-dialogue";

/**
 * Build a dialogue-aware AIF graph for a deliberation
 * 
 * @param deliberationId - The deliberation to fetch the graph for
 * @param options - Options for filtering and customizing the graph
 * @returns Complete AIF graph with nodes, edges, and optional dialogue moves
 */
export async function buildDialogueAwareGraph(
  deliberationId: string,
  options: Partial<BuildGraphOptions> = {}
): Promise<AifGraphWithDialogue> {
  const {
    includeDialogue = false,
    includeMoves = "all",
    participantFilter,
    timeRange,
  } = options;

  // Build where clause for filtering
  const whereClause: any = { deliberationId };

  // Add participant filter if provided
  if (participantFilter && includeDialogue) {
    whereClause.dialogueMetadata = {
      path: ["speaker"],
      equals: participantFilter,
    };
  }

  // Fetch all AIF nodes for this deliberation
  const nodesPromise = (prisma as any).aifNode.findMany({
    where: whereClause,
    include: {
      dialogueMove: includeDialogue,
      outgoingEdges: true,
      incomingEdges: true,
    },
  });

  // Fetch all AIF edges for this deliberation
  const edgesPromise = (prisma as any).aifEdge.findMany({
    where: { deliberationId },
    include: {
      causedByMove: includeDialogue,
    },
  });

  // Fetch dialogue moves if requested
  let dialogueMovesPromise: Promise<any[]> | null = null;
  if (includeDialogue) {
    const moveWhereClause: any = { deliberationId };
    
    if (participantFilter) {
      moveWhereClause.actorId = participantFilter;
    }
    
    if (timeRange) {
      moveWhereClause.createdAt = {
        gte: new Date(timeRange.start),
        lte: new Date(timeRange.end),
      };
    }

    dialogueMovesPromise = prisma.dialogueMove.findMany({
      where: moveWhereClause,
      orderBy: { createdAt: "asc" },
      include: {
        aifNode: true,
        createdAifNodes: true,
        causedEdges: true,
      },
    } as any);
  }

  // Execute all queries in parallel
  const [nodes, edges, dialogueMoves] = await Promise.all([
    nodesPromise,
    edgesPromise,
    dialogueMovesPromise || Promise.resolve([]),
  ]);

  // Filter nodes based on includeDialogue option
  let filteredNodes = nodes;
  if (!includeDialogue) {
    // Exclude DM-nodes if dialogue layer not requested
    filteredNodes = nodes.filter((node: any) => node.nodeKind !== "DM");
  }

  // Parse dialogue metadata for nodes with it
  const nodesWithDialogue: AifNodeWithDialogue[] = filteredNodes.map((node: any) => ({
    ...node,
    dialogueMetadata: node.dialogueMetadata
      ? (typeof node.dialogueMetadata === "string"
          ? JSON.parse(node.dialogueMetadata)
          : node.dialogueMetadata)
      : undefined,
  }));

  // Transform edges to DialogueAwareEdge
  const dialogueAwareEdges: DialogueAwareEdge[] = edges.map((edge: any) => ({
    id: edge.id,
    sourceId: edge.sourceId,
    targetId: edge.targetId,
    edgeRole: edge.edgeRole as any,
    causedByMoveId: edge.causedByMoveId || undefined,
    deliberationId: edge.deliberationId,
    createdAt: edge.createdAt,
  }));

  // Transform dialogue moves
  const movesWithAif: DialogueMoveWithAif[] = dialogueMoves.map((move: any) => ({
    ...move,
    aifRepresentation: move.aifRepresentation || undefined,
    aifNode: move.aifNode || undefined,
    createdAifNodes: move.createdAifNodes || [],
    causedEdges: move.causedEdges || [],
  }));

  // Build commitment stores (map of userId -> claimIds they've committed to)
  const commitmentStores: Record<string, string[]> = {};
  if (includeDialogue) {
    for (const move of dialogueMoves) {
      const actorId = move.actorId;
      if (!commitmentStores[actorId]) {
        commitmentStores[actorId] = [];
      }

      // Add claims from ASSERT, CONCEDE, THEREFORE moves
      if (["ASSERT", "CONCEDE", "THEREFORE"].includes(move.kind)) {
        if (move.targetType === "claim" && move.targetId) {
          if (!commitmentStores[actorId].includes(move.targetId)) {
            commitmentStores[actorId].push(move.targetId);
          }
        }
      }

      // Remove claims from RETRACT moves
      if (move.kind === "RETRACT" && move.targetType === "claim" && move.targetId) {
        const index = commitmentStores[actorId].indexOf(move.targetId);
        if (index > -1) {
          commitmentStores[actorId].splice(index, 1);
        }
      }
    }
  }

  return {
    nodes: nodesWithDialogue,
    edges: dialogueAwareEdges,
    dialogueMoves: movesWithAif,
    commitmentStores,
    metadata: {
      totalNodes: nodesWithDialogue.length,
      dmNodeCount: nodesWithDialogue.filter((n: AifNodeWithDialogue) => n.nodeKind === "DM").length,
      moveCount: movesWithAif.length,
      generatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Get dialogue move provenance for a specific AIF node
 * 
 * @param nodeId - The AIF node ID to get provenance for
 * @returns Provenance information including creating move, references, and timeline
 */
export async function getNodeProvenance(nodeId: string) {
  // Fetch the node with all its edges and dialogue move relationships
  const node = await (prisma as any).aifNode.findUnique({
    where: { id: nodeId },
    include: {
      dialogueMove: true,
      outgoingEdges: {
        include: {
          causedByMove: true,
          target: true,
        },
      },
      incomingEdges: {
        include: {
          causedByMove: true,
          source: true,
        },
      },
    },
  });

  if (!node) {
    throw new Error(`Node ${nodeId} not found`);
  }

  // Get the dialogue move that created this node
  const createdBy = node.dialogueMove
    ? {
        dialogueMoveId: node.dialogueMove.id,
        participantId: node.dialogueMove.actorId,
        timestamp: node.dialogueMove.createdAt.toISOString(),
        kind: node.dialogueMove.kind,
      }
    : null;

  // Get edges caused by dialogue moves
  const causedEdges = node.outgoingEdges
    .filter((edge: any) => edge.causedByMoveId)
    .map((edge: any) => ({
      id: edge.id,
      targetId: edge.targetId,
      edgeRole: edge.edgeRole,
      moveKind: edge.causedByMove?.kind || "",
    }));

  // Find all dialogue moves that reference this node
  const referencingMoves = await prisma.dialogueMove.findMany({
    where: {
      OR: [
        { targetId: nodeId.replace(/^(I|RA|CA|PA):/, "") },
        { argumentId: nodeId.replace(/^RA:/, "") },
      ],
    },
    orderBy: { createdAt: "asc" },
  });

  const referencedIn = referencingMoves.map((move) => ({
    dialogueMoveId: move.id,
    participantId: move.actorId,
    timestamp: move.createdAt.toISOString(),
    kind: move.kind,
  }));

  // Build timeline of events for this node
  const timeline = [
    ...(createdBy
      ? [
          {
            event: "created" as const,
            moveId: createdBy.dialogueMoveId,
            participantId: createdBy.participantId,
            timestamp: createdBy.timestamp,
          },
        ]
      : []),
    ...referencedIn.map((ref) => ({
      event: (ref.kind === "REBUT" || ref.kind === "UNDERCUT"
        ? "attacked"
        : ref.kind === "SUPPORT"
        ? "supported"
        : "referenced") as "referenced" | "attacked" | "supported",
      moveId: ref.dialogueMoveId,
      participantId: ref.participantId,
      timestamp: ref.timestamp,
    })),
  ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return {
    node: {
      ...node,
      dialogueMetadata: node.dialogueMetadata
        ? (typeof node.dialogueMetadata === "string"
            ? JSON.parse(node.dialogueMetadata)
            : node.dialogueMetadata)
        : undefined,
    },
    createdBy,
    causedEdges,
    referencedIn,
    timeline,
  };
}

/**
 * Get commitment store for all participants in a deliberation
 * 
 * @param deliberationId - The deliberation ID
 * @param participantId - Optional: filter to specific participant
 * @param asOf - Optional: point-in-time query (defaults to now)
 * @returns Commitment stores with claim details
 */
export async function getCommitmentStores(
  deliberationId: string,
  participantId?: string,
  asOf?: string
) {
  const moveWhereClause: any = { deliberationId };
  
  if (participantId) {
    moveWhereClause.actorId = participantId;
  }
  
  if (asOf) {
    moveWhereClause.createdAt = {
      lte: new Date(asOf),
    };
  }

  const moves = await prisma.dialogueMove.findMany({
    where: moveWhereClause,
    orderBy: { createdAt: "asc" },
  });

  // Build commitment stores
  const commitmentStores: Record<string, any> = {};

  for (const move of moves) {
    const actorId = move.actorId;
    if (!commitmentStores[actorId]) {
      commitmentStores[actorId] = {
        claimIds: [],
        claims: [],
      };
    }

    // Add claims
    if (["ASSERT", "CONCEDE", "THEREFORE"].includes(move.kind)) {
      if (move.targetType === "claim" && move.targetId) {
        if (!commitmentStores[actorId].claimIds.includes(move.targetId)) {
          commitmentStores[actorId].claimIds.push(move.targetId);
          commitmentStores[actorId].claims.push({
            id: move.targetId,
            committedAt: move.createdAt.toISOString(),
            committedByMove: move.id,
            status: "active",
          });
        }
      }
    }

    // Remove claims
    if (move.kind === "RETRACT" && move.targetType === "claim" && move.targetId) {
      const index = commitmentStores[actorId].claimIds.indexOf(move.targetId);
      if (index > -1) {
        commitmentStores[actorId].claimIds.splice(index, 1);
        const claim = commitmentStores[actorId].claims.find(
          (c: any) => c.id === move.targetId
        );
        if (claim) {
          claim.status = "retracted";
        }
      }
    }
  }

  // Fetch claim details
  for (const actorId in commitmentStores) {
    const claimIds = commitmentStores[actorId].claimIds;
    if (claimIds.length > 0) {
      const claims = await prisma.claim.findMany({
        where: { id: { in: claimIds } },
        select: { id: true, text: true },
      });

      // Merge claim text into commitment store
      commitmentStores[actorId].claims = commitmentStores[actorId].claims.map(
        (claim: any) => {
          const claimData = claims.find((c) => c.id === claim.id);
          return {
            ...claim,
            text: claimData?.text || "",
          };
        }
      );
    }
  }

  return {
    commitments: commitmentStores,
    metadata: {
      deliberationId,
      asOf: asOf || new Date().toISOString(),
      participantCount: Object.keys(commitmentStores).length,
    },
  };
}
