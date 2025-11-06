import { prisma } from "@/lib/prismaclient";

/**
 * Sync LudicAct rows to AifNode rows for a deliberation.
 * Creates AifNode for each act that doesn't have one.
 * Updates locusPath and locusRole.
 * 
 * Phase 1e: Enhanced with ASPIC+ CA-node generation
 * 
 * When a LudicAct has ASPIC+ metadata in metaJson.aspic, this function:
 * 1. Creates standard I/RA nodes for the act itself
 * 2. Creates CA-nodes representing ASPIC+ attacks/defeats
 * 3. Creates appropriate AifEdges linking attacker → CA → defender
 */
export async function syncLudicsToAif(deliberationId: string): Promise<{
  nodesCreated: number;
  nodesUpdated: number;
  edgesCreated: number;
  caNodesCreated: number; // Phase 1e
}> {
  let nodesCreated = 0;
  let nodesUpdated = 0;
  let edgesCreated = 0;
  let caNodesCreated = 0; // Phase 1e

  // 1. Fetch all LudicActs for this deliberation
  const acts = await prisma.ludicAct.findMany({
    where: { design: { deliberationId } },
    include: {
      design: true,
      locus: true,
    },
    orderBy: { orderInDesign: "asc" },
  });

  if (acts.length === 0) {
    return { nodesCreated, nodesUpdated, edgesCreated, caNodesCreated };
  }

  // 2. Fetch existing AifNodes for these acts (query separately for now)
  const actIds = acts.map((a) => a.id);
  const existingNodes = await (prisma as any).aifNode.findMany({
    where: {
      ludicActId: { in: actIds },
    },
  });
  const nodesByActId = new Map<string, any>(
    existingNodes.map((node: any) => [node.ludicActId, node])
  );

  // 3. For each act, ensure AifNode exists
  for (const act of acts) {
    const locusPath = act.locus?.path ?? "0";
    const locusRole = determineLocusRole(act);
    const existingNode = nodesByActId.get(act.id);
    
    if (!existingNode) {
      // Create new AifNode
      const nodeKind = mapActToNodeKind(act);
      
      try {
        const aifNode = await (prisma as any).aifNode.create({
          data: {
            deliberationId,
            nodeKind,
            ludicActId: act.id,
            locusPath,
            locusRole,
            text: act.expression ?? "",
            nodeSubtype: "ludics_act",
            dialogueMetadata: {
              ...((act.metaJson as any) ?? {}),
              ludicPolarity: act.polarity,
              ludicKind: act.kind,
              isAdditive: act.isAdditive,
              designId: act.designId,
            },
          },
        });
        
        nodesCreated++;
        
        // 4. Create AifEdge for justification pointer
        const justifiedByLocus = (act.metaJson as any)?.justifiedByLocus;
        if (justifiedByLocus) {
          const parentAct = acts.find(
            (a) => a.locus?.path === justifiedByLocus && a.design.id === act.design.id
          );
          
          if (parentAct) {
            const parentNode = nodesByActId.get(parentAct.id);
            if (parentNode) {
              await (prisma as any).aifEdge.create({
                data: {
                  deliberationId,
                  sourceId: aifNode.id,
                  targetId: parentNode.id,
                  edgeRole: "justifiedBy",
                  causedByMoveId: null,
                },
              }).catch(() => {}); // Ignore duplicates
              
              edgesCreated++;
            }
          }
        }
        
        // Phase 1e: Create CA-node if ASPIC+ attack metadata present
        const aspicMeta = (act.metaJson as any)?.aspic;
        if (aspicMeta && aspicMeta.attackType) {
          const caResult = await createCANodeForAspicAttack(
            deliberationId,
            act,
            aifNode,
            aspicMeta,
            acts,
            nodesByActId
          );
          
          if (caResult.caNodeCreated) {
            caNodesCreated++;
            edgesCreated += caResult.edgesCreated;
          }
        }
        
      } catch (err) {
        console.error(`[ludics] Failed to create AifNode for act ${act.id}:`, err);
      }
    } else {
      // Update existing AifNode (in case locus changed)
      try {
        await (prisma as any).aifNode.update({
          where: { id: existingNode.id },
          data: {
            locusPath,
            locusRole,
            text: act.expression ?? existingNode.text,
            nodeSubtype: "ludics_act",
          },
        });
        
        nodesUpdated++;
      } catch (err) {
        console.error(`[ludics] Failed to update AifNode ${existingNode.id}:`, err);
      }
    }
  }

  return { nodesCreated, nodesUpdated, edgesCreated, caNodesCreated };
}

/**
 * Determine locus role from act properties
 */
function determineLocusRole(act: any): string {
  if (act.kind === "DAIMON") return "daimon";
  if (act.polarity === "P") return "opener";
  if (act.polarity === "O") return "responder";
  return "neutral";
}

/**
 * Map LudicAct to AifNodeKind
 */
function mapActToNodeKind(act: any): string {
  if (act.kind === "DAIMON") return "DM"; // Dialogue Move (end of sequence)
  
  // Use metaJson to determine if this is tied to an argument/claim
  const meta = act.metaJson as any;
  if (meta?.targetType === "argument") return "RA"; // Inference (RA = Rule Application)
  if (meta?.targetType === "claim") return "I"; // Information
  
  // Default: treat as locution in dialogue
  return "DM";
}

/**
 * Phase 1e: Create CA-node for ASPIC+ attack
 * 
 * Creates a Conflict Application node representing the ASPIC+ attack/defeat,
 * and links attacker → CA → defender with appropriate AifEdges.
 * 
 * @param deliberationId - Deliberation context
 * @param attackerAct - LudicAct containing the attack
 * @param attackerNode - AifNode for the attacker (just created)
 * @param aspicMeta - ASPIC+ metadata from metaJson.aspic
 * @param allActs - All LudicActs for finding defender
 * @param nodesByActId - Existing AifNodes for linking
 * @returns Result with counts
 */
async function createCANodeForAspicAttack(
  deliberationId: string,
  attackerAct: any,
  attackerNode: any,
  aspicMeta: any,
  allActs: any[],
  nodesByActId: Map<string, any>
): Promise<{ caNodeCreated: boolean; edgesCreated: number }> {
  let edgesCreated = 0;

  try {
    // Find defender act by targetId (argument or claim being attacked)
    const defenderId = aspicMeta.defenderId || (attackerAct.metaJson as any)?.targetId;
    if (!defenderId) {
      console.warn(`[ludics] CA-node skipped: no defenderId in ASPIC+ metadata`);
      return { caNodeCreated: false, edgesCreated: 0 };
    }

    // Find the defender's LudicAct by targetId
    const defenderAct = allActs.find(
      (a) => (a.metaJson as any)?.targetId === defenderId
    );

    if (!defenderAct) {
      console.warn(`[ludics] CA-node skipped: defender act not found for ${defenderId}`);
      return { caNodeCreated: false, edgesCreated: 0 };
    }

    const defenderNode = nodesByActId.get(defenderAct.id);
    if (!defenderNode) {
      console.warn(`[ludics] CA-node skipped: defender AifNode not found`);
      return { caNodeCreated: false, edgesCreated: 0 };
    }

    // Create CA-node representing the ASPIC+ attack
    const caNode = await (prisma as any).aifNode.create({
      data: {
        deliberationId,
        nodeKind: "CA", // Conflict Application
        locusPath: attackerAct.locus?.path ?? "0",
        locusRole: "conflict",
        text: `${aspicMeta.attackType} attack`, // e.g., "undermining attack"
        nodeSubtype: "aspic_conflict",
        dialogueMetadata: {
          aspicAttackType: aspicMeta.attackType,
          aspicDefeatStatus: aspicMeta.succeeded,
          attackerId: aspicMeta.attackerId,
          defenderId: aspicMeta.defenderId,
          cqKey: aspicMeta.cqKey,
          cqText: aspicMeta.cqText,
          reason: aspicMeta.reason,
          targetScope: aspicMeta.targetScope,
        },
      },
    });

    // Create edges: attacker → CA → defender
    // Edge 1: Attacker supports the CA-node (source of attack)
    await (prisma as any).aifEdge.create({
      data: {
        deliberationId,
        sourceId: attackerNode.id,
        targetId: caNode.id,
        edgeRole: "attacks_via",
        causedByMoveId: (attackerAct.metaJson as any)?.moveId ?? null,
      },
    }).catch(() => {}); // Ignore duplicates
    edgesCreated++;

    // Edge 2: CA-node targets the defender (attack application)
    await (prisma as any).aifEdge.create({
      data: {
        deliberationId,
        sourceId: caNode.id,
        targetId: defenderNode.id,
        edgeRole: "conflicts_with",
        causedByMoveId: (attackerAct.metaJson as any)?.moveId ?? null,
      },
    }).catch(() => {}); // Ignore duplicates
    edgesCreated++;

    return { caNodeCreated: true, edgesCreated };
  } catch (err) {
    console.error(`[ludics] Failed to create CA-node:`, err);
    return { caNodeCreated: false, edgesCreated: 0 };
  }
}
