/**
 * AIF Graph Builder - Dialogue-Aware Graph Construction
 * 
 * Purpose: Build complete AIF graphs with optional dialogue move layer
 * Phase: 2.1 - Dialogue Visualization Roadmap
 * Date: November 3, 2025
 * 
 * CRITICAL ARCHITECTURE:
 * - Builds graphs from Argument/Claim/ConflictApplication (NOT AifNode/AifEdge)
 * - Follows proven pattern from generate-debate-sheets.ts
 * - Uses claim-to-argument resolution map for edge derivation
 * - Queries ConflictApplication for attack edges (ArgumentEdge table is empty/legacy)
 * 
 * See: DIALOGUE_VISUALIZATION_ROADMAP.md Phase 2.2
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

  const nodes: AifNodeWithDialogue[] = [];
  const edges: DialogueAwareEdge[] = [];

  // Step 1: Fetch all arguments (RA-nodes) with dialogue provenance
  const argumentsList = await prisma.argument.findMany({
    where: { deliberationId },
    include: {
      conclusion: { select: { id: true, text: true } },
      premises: {
        select: {
          claimId: true,
          claim: { select: { id: true, text: true } },
        },
      },
      createdByMove: includeDialogue
        ? { select: { id: true, kind: true, createdAt: true, actorId: true } }
        : false,
    },
  });

  // Step 2: Build nodes from arguments
  for (const arg of argumentsList) {
    // RA-node (Reasoning Application node)
    nodes.push({
      id: `RA:${arg.id}`,
      nodeType: "aif:RANode",
      text: arg.text || `Argument using ${arg.scheme?.name || "scheme"}`,
      dialogueMoveId: arg.createdByMoveId || null,
      dialogueMove: arg.createdByMove || null,
      dialogueMetadata: arg.createdByMove
        ? {
            locution: arg.createdByMove.kind,
            speaker: arg.createdByMove.actorId,
            speakerName: arg.createdByMove.actorId, // Would need user lookup for display name
            timestamp: arg.createdByMove.createdAt.toISOString(),
            replyToMoveId: null,
          }
        : null,
      nodeSubtype: "standard",
    });

    // I-node for conclusion
    if (arg.conclusion) {
      const conclusionNodeId = `I:${arg.conclusion.id}`;
      if (!nodes.some((n) => n.id === conclusionNodeId)) {
        nodes.push({
          id: conclusionNodeId,
          nodeType: "aif:INode",
          text: arg.conclusion.text,
          dialogueMoveId: null,
          dialogueMove: null,
          dialogueMetadata: null,
          nodeSubtype: "standard",
        });
      }

      // Edge: RA → I (conclusion)
      edges.push({
        id: `edge:${arg.id}:conclusion`,
        source: `RA:${arg.id}`,
        target: conclusionNodeId,
        edgeType: "inference",
        causedByDialogueMoveId: arg.createdByMoveId || null,
      });
    }

    // I-nodes for premises and edges: I → RA
    for (const premise of arg.premises) {
      const premiseINodeId = `I:${premise.claimId}`;

      // Add I-node if not already added
      if (!nodes.some((n) => n.id === premiseINodeId)) {
        nodes.push({
          id: premiseINodeId,
          nodeType: "aif:INode",
          text: premise.claim.text,
          dialogueMoveId: null,
          dialogueMove: null,
          dialogueMetadata: null,
          nodeSubtype: "standard",
        });
      }

      // Edge: I → RA (premise)
      edges.push({
        id: `edge:${premise.claimId}:premise:${arg.id}`,
        source: premiseINodeId,
        target: `RA:${arg.id}`,
        edgeType: "inference",
        causedByDialogueMoveId: arg.createdByMoveId || null,
      });
    }
  }

  // Step 3: Derive attack edges from ConflictApplication (CRITICAL!)
  const conflicts = await prisma.conflictApplication.findMany({
    where: { deliberationId },
    include: includeDialogue
      ? {
          createdByMove: {
            select: { id: true, kind: true, createdAt: true, actorId: true },
          },
        }
      : {},
  });

  // Build claim-to-argument resolution map (follows generate-debate-sheets.ts pattern)
  const claimToArgMap = new Map<string, string>();

  // Map conclusions
  for (const arg of argumentsList) {
    if (arg.conclusionClaimId) {
      claimToArgMap.set(arg.conclusionClaimId, arg.id);
    }
  }

  // Map premises
  const allPremises = await prisma.argumentPremise.findMany({
    where: {
      argument: { deliberationId },
    },
    select: { claimId: true, argumentId: true },
  });

  for (const prem of allPremises) {
    if (!claimToArgMap.has(prem.claimId)) {
      claimToArgMap.set(prem.claimId, prem.argumentId);
    }
  }

  // Resolve conflicts to CA-nodes and edges
  for (const conflict of conflicts) {
    // Resolve claims to arguments
    let fromArgId =
      conflict.conflictingArgumentId ||
      (conflict.conflictingClaimId
        ? claimToArgMap.get(conflict.conflictingClaimId)
        : null);
    let toArgId =
      conflict.conflictedArgumentId ||
      (conflict.conflictedClaimId
        ? claimToArgMap.get(conflict.conflictedClaimId)
        : null);

    if (!fromArgId || !toArgId) continue; // Skip unresolved conflicts

    const caNodeId = `CA:${conflict.id}`;

    // Create CA-node (Conflict Application node)
    nodes.push({
      id: caNodeId,
      nodeType: "aif:CANode",
      text: `${conflict.legacyAttackType || "Attack"}`,
      dialogueMoveId: conflict.createdByMoveId || null,
      dialogueMove: (conflict as any).createdByMove || null,
      dialogueMetadata: (conflict as any).createdByMove
        ? {
            locution: (conflict as any).createdByMove.kind,
            speaker: (conflict as any).createdByMove.actorId,
            speakerName: (conflict as any).createdByMove.actorId,
            timestamp: (conflict as any).createdByMove.createdAt.toISOString(),
            replyToMoveId: null,
          }
        : null,
      nodeSubtype: "standard",
    });

    // Edges: attacking arg → CA, CA → targeted arg
    edges.push({
      id: `edge:${fromArgId}:attacks:${caNodeId}`,
      source: `RA:${fromArgId}`,
      target: caNodeId,
      edgeType: "conflict",
      causedByDialogueMoveId: conflict.createdByMoveId || null,
    });

    edges.push({
      id: `edge:${caNodeId}:targets:${toArgId}`,
      source: caNodeId,
      target: `RA:${toArgId}`,
      edgeType: "conflict",
      causedByDialogueMoveId: conflict.createdByMoveId || null,
    });
  }

  // Step 4: Add dialogue visualization nodes (WHY, CONCEDE, RETRACT, etc.)
  if (includeDialogue) {
    const vizNodes = await prisma.dialogueVisualizationNode.findMany({
      where: { deliberationId },
      include: {
        dialogueMove: {
          select: { id: true, kind: true, createdAt: true, actorId: true, targetType: true, targetId: true },
        },
      },
    });

    for (const vizNode of vizNodes) {
      nodes.push({
        id: `DM:${vizNode.id}`,
        nodeType: `aif:DialogueMove_${vizNode.nodeKind}`,
        text: `${vizNode.nodeKind}`,
        dialogueMoveId: vizNode.dialogueMoveId,
        dialogueMove: vizNode.dialogueMove as any,
        dialogueMetadata: {
          locution: vizNode.nodeKind,
          speaker: vizNode.dialogueMove.actorId,
          speakerName: vizNode.dialogueMove.actorId,
          timestamp: vizNode.createdAt.toISOString(),
          replyToMoveId: null,
        },
        nodeSubtype: "dialogue_move",
      });

      // Create edges for dialogue move interactions (e.g., WHY → RA)
      const metadata = vizNode.metadata as any;
      if (metadata?.targetId && vizNode.dialogueMove.targetType === "argument") {
        // Link WHY/CLOSE/etc to the argument they reference
        const targetArgId = metadata.targetId || vizNode.dialogueMove.targetId;
        edges.push({
          id: `edge:${vizNode.id}:triggers:${targetArgId}`,
          source: `DM:${vizNode.id}`,
          target: `RA:${targetArgId}`,
          edgeType: "triggers",
          causedByDialogueMoveId: vizNode.dialogueMoveId,
        });
      }
    }
  }

  // Step 5: Fetch dialogue moves metadata
  let dialogueMoves: DialogueMoveWithAif[] = [];
  if (includeDialogue) {
    const moveFilter: any = { deliberationId };

    if (includeMoves === "protocol") {
      moveFilter.kind = {
        in: ["WHY", "GROUNDS", "CONCEDE", "RETRACT", "CLOSE", "ACCEPT_ARGUMENT"],
      };
    } else if (includeMoves === "structural") {
      moveFilter.kind = { in: ["THEREFORE", "SUPPOSE", "DISCHARGE"] };
    }

    if (participantFilter) {
      moveFilter.actorId = participantFilter;
    }

    if (timeRange) {
      moveFilter.createdAt = {
        gte: new Date(timeRange.start),
        lte: new Date(timeRange.end),
      };
    }

    dialogueMoves = (await prisma.dialogueMove.findMany({
      where: moveFilter,
      include: {
        createdArguments: { select: { id: true, text: true } },
        createdConflicts: { select: { id: true, legacyAttackType: true } },
      },
      orderBy: { createdAt: "asc" },
    })) as any;
  }

  // Step 6: Build commitment stores
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
    nodes,
    edges,
    dialogueMoves,
    commitmentStores,
    metadata: {
      totalNodes: nodes.length,
      dmNodeCount: nodes.filter((n) => n.nodeSubtype === "dialogue_move").length,
      moveCount: dialogueMoves.length,
      generatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Get dialogue move provenance for a specific node
 * 
 * @param nodeId - The AIF node ID (e.g., "RA:abc123", "I:xyz789")
 * @param deliberationId - The deliberation context
 * @returns Provenance information
 */
export async function getNodeProvenance(nodeId: string, deliberationId: string) {
  const [nodeType, id] = nodeId.split(":");

  if (nodeType === "RA") {
    // Argument node
    const argument = await prisma.argument.findUnique({
      where: { id },
      include: {
        createdByMove: {
          select: { id: true, kind: true, createdAt: true, actorId: true },
        },
        conclusion: { select: { id: true, text: true } },
        premises: {
          select: { claim: { select: { id: true, text: true } } },
        },
      },
    });

    if (!argument) {
      throw new Error(`Argument ${id} not found`);
    }

    // Find dialogue moves that reference this argument
    const referencingMoves = await prisma.dialogueMove.findMany({
      where: {
        deliberationId,
        OR: [
          { targetId: id, targetType: "argument" },
          { argumentId: id },
        ],
      },
      orderBy: { createdAt: "asc" },
    });

    return {
      node: {
        id: nodeId,
        type: "argument",
        text: argument.text,
      },
      createdBy: argument.createdByMove
        ? {
            dialogueMoveId: argument.createdByMove.id,
            kind: argument.createdByMove.kind,
            participantId: argument.createdByMove.actorId,
            timestamp: argument.createdByMove.createdAt.toISOString(),
          }
        : null,
      referencedIn: referencingMoves.map((move) => ({
        dialogueMoveId: move.id,
        kind: move.kind,
        participantId: move.actorId,
        timestamp: move.createdAt.toISOString(),
      })),
    };
  } else if (nodeType === "I") {
    // Claim node
    const claim = await prisma.claim.findUnique({
      where: { id },
      include: {
        introducedByMove: includeDialogue
          ? { select: { id: true, kind: true, createdAt: true, actorId: true } }
          : false,
      },
    });

    if (!claim) {
      throw new Error(`Claim ${id} not found`);
    }

    return {
      node: {
        id: nodeId,
        type: "claim",
        text: claim.text,
      },
      createdBy: (claim as any).introducedByMove
        ? {
            dialogueMoveId: (claim as any).introducedByMove.id,
            kind: (claim as any).introducedByMove.kind,
            participantId: (claim as any).introducedByMove.actorId,
            timestamp: (claim as any).introducedByMove.createdAt.toISOString(),
          }
        : null,
      referencedIn: [],
    };
  }

  throw new Error(`Unsupported node type: ${nodeType}`);
}
