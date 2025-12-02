/**
 * AIF/Dialogue Sync for Ludics Actions
 * 
 * Syncs Ludics actions (concessions, daimons, branch closes, force concessions)
 * back to the AIF/ASPIC/Dialogical move systems to maintain consistency.
 */

import { prisma } from "@/lib/prismaclient";

export type LudicsActionType = 
  | "CONCESSION"
  | "FORCE_CONCESSION"
  | "BRANCH_CLOSE"
  | "DAIMON"
  | "ACK";

export interface SyncToAifOptions {
  deliberationId: string;
  actionType: LudicsActionType;
  actorId: string;           // "Proponent" | "Opponent" or userId
  locusPath: string;
  expression?: string;
  targetClaimId?: string;    // Optional: if conceding to a specific claim
  targetArgumentId?: string; // Optional: if conceding to a specific argument
  ludicActId?: string;       // The LudicAct id that triggered this
  ludicDesignId?: string;    // The LudicDesign id
}

/**
 * Maps Ludics action types to DialogueMove kinds
 */
function mapActionToMoveKind(actionType: LudicsActionType): string {
  switch (actionType) {
    case "CONCESSION":
    case "FORCE_CONCESSION":
    case "ACK":
      return "CONCEDE";
    case "BRANCH_CLOSE":
      return "CLOSE";
    case "DAIMON":
      return "ACCEPT_ARGUMENT"; // Daimon = acceptance/termination
    default:
      return "CONCEDE";
  }
}

/**
 * Generate a unique signature for deduplication
 */
function generateSignature(opts: SyncToAifOptions): string {
  return [
    mapActionToMoveKind(opts.actionType),
    opts.actionType,
    opts.locusPath,
    opts.actorId,
    opts.ludicActId ?? Date.now(),
  ].join(":");
}

/**
 * Sync a Ludics action to the AIF/Dialogue systems
 * Creates:
 * 1. A DialogueMove record
 * 2. A DialogueVisualizationNode record
 * 3. Optionally an AifNode (DM-node type)
 */
export async function syncToAif(opts: SyncToAifOptions): Promise<{
  dialogueMoveId: string | null;
  aifNodeId: string | null;
  visualizationNodeId: string | null;
}> {
  const {
    deliberationId,
    actionType,
    actorId,
    locusPath,
    expression,
    targetClaimId,
    targetArgumentId,
    ludicActId,
    ludicDesignId,
  } = opts;

  const moveKind = mapActionToMoveKind(actionType);
  const signature = generateSignature(opts);

  // Check for existing move with same signature (idempotency)
  const existing = await prisma.dialogueMove.findFirst({
    where: { deliberationId, signature },
  });
  
  if (existing) {
    console.log(`[aif-sync] Move already exists for signature: ${signature}`);
    return {
      dialogueMoveId: existing.id,
      aifNodeId: null,
      visualizationNodeId: null,
    };
  }

  // Determine target type and id
  const targetType = targetArgumentId ? "argument" : targetClaimId ? "claim" : "locus";
  const targetId = targetArgumentId ?? targetClaimId ?? locusPath;

  // Find the locus record if it exists
  const locus = await prisma.ludicLocus.findFirst({
    where: { dialogueId: deliberationId, path: locusPath },
  });

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create DialogueMove
      const dialogueMove = await tx.dialogueMove.create({
        data: {
          deliberationId,
          authorId: actorId,
          actorId,
          type: moveKind,
          kind: moveKind,
          targetType,
          targetId,
          signature,
          locusId: locus?.id ?? null,
          endsWithDaimon: actionType === "DAIMON" || actionType === "BRANCH_CLOSE",
          polarity: actorId === "Proponent" ? "P" : "O",
          payload: {
            ludicsAction: actionType,
            locusPath,
            expression,
            ludicActId,
            ludicDesignId,
            syncedAt: new Date().toISOString(),
          },
        },
      });

      // 2. Create DialogueVisualizationNode for visualization system
      const visualizationNode = await tx.dialogueVisualizationNode.create({
        data: {
          deliberationId,
          dialogueMoveId: dialogueMove.id,
          nodeKind: moveKind,
          metadata: {
            ludicsAction: actionType,
            locusPath,
            expression,
            actorId,
          },
        },
      });

      // 3. Create AIF Node (DM-node) for AIF graph representation
      let aifNode = null;
      try {
        aifNode = await tx.aifNode.create({
          data: {
            deliberationId,
            nodeKind: "DM", // Dialogue Move node
            nodeSubtype: "ludics_sync",
            label: `${moveKind} @ ${locusPath}`,
            text: expression ?? `${actionType} at locus ${locusPath}`,
            dialogueMoveId: dialogueMove.id,
            ludicActId: ludicActId ?? null,
            locusPath,
            locusRole: actionType === "DAIMON" ? "daimon" : "responder",
            dialogueMetadata: {
              locution: moveKind,
              speaker: actorId,
              ludicsAction: actionType,
              timestamp: new Date().toISOString(),
            },
          },
        });

        // Update DialogueMove with AIF representation
        await tx.dialogueMove.update({
          where: { id: dialogueMove.id },
          data: { aifRepresentation: aifNode.id },
        });
      } catch (aifErr: any) {
        // AIF node creation is optional - log but don't fail
        console.warn("[aif-sync] Failed to create AIF node:", aifErr.message);
      }

      return {
        dialogueMoveId: dialogueMove.id,
        aifNodeId: aifNode?.id ?? null,
        visualizationNodeId: visualizationNode.id,
      };
    });

    console.log(`[aif-sync] Created DialogueMove ${result.dialogueMoveId} for ${actionType} @ ${locusPath}`);
    return result;
  } catch (err: any) {
    console.error("[aif-sync] Failed to sync:", err.message);
    // Return nulls but don't throw - sync failures shouldn't break ludics operations
    return {
      dialogueMoveId: null,
      aifNodeId: null,
      visualizationNodeId: null,
    };
  }
}

/**
 * Batch sync multiple Ludics actions
 */
export async function syncBatchToAif(
  actions: SyncToAifOptions[]
): Promise<{ synced: number; failed: number }> {
  let synced = 0;
  let failed = 0;

  for (const action of actions) {
    const result = await syncToAif(action);
    if (result.dialogueMoveId) {
      synced++;
    } else {
      failed++;
    }
  }

  return { synced, failed };
}

/**
 * Create edges in AIF graph connecting the new node to related nodes
 * (e.g., concession node connected to the argument it concedes to)
 */
export async function createAifEdgesForSync(
  aifNodeId: string,
  targetArgumentId?: string,
  targetClaimId?: string
): Promise<void> {
  if (!aifNodeId) return;

  try {
    // Get the node to find its deliberationId
    const node = await prisma.aifNode.findUnique({
      where: { id: aifNodeId },
      select: { deliberationId: true },
    });
    if (!node) return;

    // Find target I-nodes or RA-nodes to connect to
    if (targetArgumentId) {
      // Find the RA node for this argument
      const raNode = await prisma.aifNode.findFirst({
        where: {
          deliberationId: node.deliberationId,
          nodeKind: "RA",
          dialogueMetadata: {
            path: ["argumentId"],
            equals: targetArgumentId,
          },
        },
      });

      if (raNode) {
        await prisma.aifEdge.create({
          data: {
            deliberationId: node.deliberationId,
            sourceId: aifNodeId,
            targetId: raNode.id,
            edgeRole: "answers", // Concession answers the challenge
          },
        });
      }
    }

    if (targetClaimId) {
      // Find the I-node for this claim
      const iNode = await prisma.aifNode.findFirst({
        where: {
          deliberationId: node.deliberationId,
          nodeKind: "I",
          dialogueMetadata: {
            path: ["claimId"],
            equals: targetClaimId,
          },
        },
      });

      if (iNode) {
        await prisma.aifEdge.create({
          data: {
            deliberationId: node.deliberationId,
            sourceId: aifNodeId,
            targetId: iNode.id,
            edgeRole: "answers", // Concession accepts the claim
          },
        });
      }
    }
  } catch (err: any) {
    console.warn("[aif-sync] Failed to create edges:", err.message);
  }
}
