import { prisma } from "@/lib/prismaclient";

/**
 * Sync LudicAct rows to AifNode rows for a deliberation.
 * Creates AifNode for each act that doesn't have one.
 * Updates locusPath and locusRole.
 * 
 * Phase 1: Ludics-AIF Integration
 */
export async function syncLudicsToAif(deliberationId: string): Promise<{
  nodesCreated: number;
  nodesUpdated: number;
  edgesCreated: number;
}> {
  let nodesCreated = 0;
  let nodesUpdated = 0;
  let edgesCreated = 0;

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
    return { nodesCreated, nodesUpdated, edgesCreated };
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

  return { nodesCreated, nodesUpdated, edgesCreated };
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
