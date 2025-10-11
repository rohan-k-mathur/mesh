/**
 * AIF Builder - Corrected for Actual Schema
 * 
 * File: lib/arguments/aif-builder.ts
 * 
 * KEY FIXES:
 * 1. ArgumentDiagram has NO argumentId - can't be queried by argument
 * 2. ArgumentEdge uses fromArgumentId/toArgumentId (not fromId/toId)
 * 3. Arguments use ArgumentPremise -> Claim structure (simple, no diagram)
 */

import type { AifSubgraph, AifNode, AifEdge, AifEdgeRole, AifNodeKind } from './diagram';
import { prisma } from '@/lib/prismaclient';

export async function buildAifNeighborhood(
  argumentId: string,
  options: {
    depth: number;
    includeSupporting?: boolean;
    includeOpposing?: boolean;
    includePreferences?: boolean;
  }
): Promise<AifSubgraph> {
  const { depth, includeSupporting = true, includeOpposing = true, includePreferences = true } = options;

  // Fetch the root argument with its relations
  const rootArg = await prisma.argument.findUnique({
    where: { id: argumentId },
    include: {
      scheme: true,
      conclusion: true,  // Claim relation via conclusionClaimId
      premises: {        // ArgumentPremise[]
        include: {
          claim: true,   // Each premise's Claim
        }
      },
    }
  });

  if (!rootArg) {
    throw new Error(`Argument ${argumentId} not found`);
  }

  const nodes: AifNode[] = [];
  const edges: AifEdge[] = [];
  const visited = new Set<string>();

  // Convert root argument to AIF
  const rootAif = convertArgumentToAif(rootArg);
  nodes.push(...rootAif.nodes);
  edges.push(...rootAif.edges);
  visited.add(argumentId);

  // Recursively expand neighborhood
  if (depth > 0) {
    await expandNeighborhood(
      argumentId,
      depth,
      nodes,
      edges,
      visited,
      { includeSupporting, includeOpposing, includePreferences }
    );
  }

  return { nodes, edges };
}

export async function expandNeighborhood(
  argumentId: string,
  remainingDepth: number,
  nodes: AifNode[],
  edges: AifEdge[],
  visited: Set<string>,
  filters: { includeSupporting?: boolean; includeOpposing?: boolean; includePreferences?: boolean }
) {
  if (remainingDepth <= 0) return;

  // Build edge type filters based on EdgeType enum
  const edgeTypes: string[] = [];
  if (filters.includeSupporting) {
    edgeTypes.push('support');
  }
  if (filters.includeOpposing) {
    edgeTypes.push('rebut', 'undercut', 'concede');
  }
  // Note: Your schema doesn't have 'prefers' in EdgeType enum
  // EdgeType = support | rebut | undercut | concede

  // Find connected arguments via ArgumentEdge
  const connectedEdges = await prisma.argumentEdge.findMany({
    where: {
      OR: [
        { fromArgumentId: argumentId, type: { in: edgeTypes } },  // ✅ Fixed field name
        { toArgumentId: argumentId, type: { in: edgeTypes } },    // ✅ Fixed field name
      ],
    },
  });

  // Get unique connected argument IDs
  const connectedIds = new Set<string>();
  for (const edge of connectedEdges) {
    if (edge.fromArgumentId !== argumentId && !visited.has(edge.fromArgumentId)) {
      connectedIds.add(edge.fromArgumentId);
    }
    if (edge.toArgumentId !== argumentId && !visited.has(edge.toArgumentId)) {
      connectedIds.add(edge.toArgumentId);
    }
  }

  // Fetch and convert connected arguments
  for (const connectedId of connectedIds) {
    const arg = await prisma.argument.findUnique({
      where: { id: connectedId },
      include: {
        scheme: true,
        conclusion: true,
        premises: {
          include: {
            claim: true,
          }
        },
      }
    });

    if (!arg) continue;

    const aif = convertArgumentToAif(arg);
    nodes.push(...aif.nodes);
    edges.push(...aif.edges);
    visited.add(connectedId);

    // Add relation edges between arguments
    const relatedEdges = connectedEdges.filter(
      e => e.fromArgumentId === connectedId || e.toArgumentId === connectedId
    );

    for (const relEdge of relatedEdges) {
      const role = mapEdgeTypeToAifRole(relEdge.type, relEdge.attackType);
      edges.push({
        id: `edge:${relEdge.id}`,
        from: `RA:${relEdge.fromArgumentId}`,  // ✅ Fixed field name
        to: `RA:${relEdge.toArgumentId}`,      // ✅ Fixed field name
        role: role as AifEdgeRole,
      });
    }

    // Recurse
    if (remainingDepth > 1) {
      await expandNeighborhood(
        connectedId,
        remainingDepth - 1,
        nodes,
        edges,
        visited,
        filters
      );
    }
  }
}

export function mapEdgeTypeToAifRole(
  edgeType: string,
  attackType: string | null
): string {
  // Map EdgeType to AIF roles
  switch (edgeType) {
    case 'support':
      return 'RA';  // Default support
    case 'rebut':
      return 'CA';  // Rebuts are conflict
    case 'undercut':
      return 'CA';  // Undercuts are conflict
    case 'concede':
      return 'RA';  // Concessions support
    default:
      return 'RA';
  }
}

export function convertArgumentToAif(argument: any): AifSubgraph {
  const nodes: AifNode[] = [];
  const edges: AifEdge[] = [];

  // Add RA node for the argument
  const raNodeId = `RA:${argument.id}`;
  nodes.push({
    id: raNodeId,
    kind: 'RA',
    label: argument.text || 'Argument',
    schemeKey: argument.scheme?.key || argument.schemeKey,
  });

  // ✅ SIMPLIFIED: No ArgumentDiagram - just use ArgumentPremise -> Claim
  
  // Add I-nodes for premises (from ArgumentPremise -> Claim)
  for (const premise of argument.premises || []) {
    if (premise.claim) {
      const premiseNodeId = `I:premise:${premise.claim.id}`;
      nodes.push({
        id: premiseNodeId,
        kind: 'I',
        label: premise.claim.text,
      });
      
      edges.push({
        id: `edge:premise:${argument.id}:${premise.claim.id}`,
        from: premiseNodeId,
        to: raNodeId,
        role: 'RA' as AifEdgeRole,
      });
    }
  }

  // Add I-node for conclusion (from Argument.conclusion)
  if (argument.conclusion) {
    const conclusionNodeId = `I:conclusion:${argument.conclusion.id}`;
    nodes.push({
      id: conclusionNodeId,
      kind: 'I',
      label: argument.conclusion.text,
    });

    edges.push({
      id: `edge:conclusion:${argument.id}`,
      from: raNodeId,
      to: conclusionNodeId,
      role: 'RA' as AifEdgeRole,
    });
  }

  return { nodes, edges };
}