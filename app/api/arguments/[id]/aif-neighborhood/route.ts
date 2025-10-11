/**
 * AIF Neighborhood API Route - Schema Corrected
 * 
 * File: app/api/arguments/[id]/aif-neighborhood/route.ts
 * 
 * FIXED for actual Prisma schema:
 * 1. ArgumentEdge uses fromArgumentId/toArgumentId
 * 2. No ArgumentDiagram linked to Argument
 * 3. Arguments use simple ArgumentPremise -> Claim structure
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';
import type { AifSubgraph, AifNode, AifEdge, AifEdgeRole } from '@/lib/arguments/diagram';
import { expandNeighborhood, buildAifNeighborhood, mapEdgeTypeToAifRole, convertArgumentToAif } from '@/lib/arguments/aif-builder';

interface BuilderOptions {
  depth: number;
  includeSupporting?: boolean;
  includeOpposing?: boolean;
  includePreferences?: boolean;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const argumentId = params.id;
  const url = new URL(req.url);

  // Parse query parameters
  const depth = Number(url.searchParams.get('depth')) || 1;
  const summaryOnly = url.searchParams.get('summaryOnly') === 'true';
  const includeSupporting = url.searchParams.get('includeSupporting') !== 'false';
  const includeOpposing = url.searchParams.get('includeOpposing') !== 'false';
  const includePreferences = url.searchParams.get('includePreferences') !== 'false';

  try {
    // Validate depth
    if (depth < 0 || depth > 5) {
      return NextResponse.json(
        { ok: false, error: 'Depth must be between 0 and 5' },
        { status: 400 }
      );
    }

    // If summary only, return connection counts without full graph
    if (summaryOnly) {
      const summary = await getNeighborhoodSummary(argumentId);
      return NextResponse.json({ ok: true, summary });
    }

    // Build the full AIF neighborhood
    const aif = await buildAifNeighborhood(argumentId, {
      depth,
      includeSupporting,
      includeOpposing,
      includePreferences,
    });

    return NextResponse.json({ ok: true, aif });

  } catch (error) {
    console.error('Error fetching AIF neighborhood:', error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to fetch neighborhood'
      },
      { status: 500 }
    );
  }
}

/**
 * Get summary of neighborhood connections without building full graph
 */
async function getNeighborhoodSummary(argumentId: string) {
  // ✅ Fixed: Use fromArgumentId/toArgumentId
  const [supportingArgs, conflictingArgs] = await Promise.all([
    // Supporting arguments
    prisma.argumentEdge.count({
      where: {
        toArgumentId: argumentId,      // ✅ Fixed field name
        type: 'support',
      },
    }),

    // Conflicting arguments (rebut, undercut)
    prisma.argumentEdge.count({
      where: {
        toArgumentId: argumentId,      // ✅ Fixed field name
        type: { in: ['rebut', 'undercut'] },
      },
    }),
  ]);

  return {
    supportCount: supportingArgs,
    conflictCount: conflictingArgs,
    totalConnections: supportingArgs + conflictingArgs,
  };
}

/**
 * Build AIF neighborhood graph
 */

// async function buildAifNeighborhood(
//   argumentId: string,
//   options: BuilderOptions
// ): Promise<AifSubgraph> {
//   const { depth, includeSupporting = true, includeOpposing = true } = options;

//   // Fetch the root argument with its relations
//   const rootArg = await prisma.argument.findUnique({
//     where: { id: argumentId },
//     include: {
//       scheme: true,
//       conclusion: true,  // Claim via conclusionClaimId
//       premises: {        // ArgumentPremise[]
//         include: {
//           claim: true,
//         }
//       },
//     }
//   });

//   if (!rootArg) {
//     throw new Error(`Argument ${argumentId} not found`);
//   }

//   const nodes: AifNode[] = [];
//   const edges: AifEdge[] = [];
//   const visited = new Set<string>();

//   // Convert root argument to AIF
//   const rootAif = convertArgumentToAif(rootArg);
//   nodes.push(...rootAif.nodes);
//   edges.push(...rootAif.edges);
//   visited.add(argumentId);

//   // Recursively expand neighborhood
//   if (depth > 0) {
//     await expandNeighborhood(
//       argumentId,
//       depth,
//       nodes,
//       edges,
//       visited,
//       { includeSupporting, includeOpposing }
//     );
//   }

//   return { nodes, edges };
// }

// async function expandNeighborhood(
//   argumentId: string,
//   remainingDepth: number,
//   nodes: AifNode[],
//   edges: AifEdge[],
//   visited: Set<string>,
//   filters: { includeSupporting?: boolean; includeOpposing?: boolean }
// ) {
//   if (remainingDepth <= 0) return;

//   // Build edge type filters
//   const edgeTypes: string[] = [];
//   if (filters.includeSupporting) {
//     edgeTypes.push('support');
//   }
//   if (filters.includeOpposing) {
//     edgeTypes.push('rebut', 'undercut', 'concede');
//   }

//   // ✅ Fixed: Use fromArgumentId/toArgumentId
//   const connectedEdges = await prisma.argumentEdge.findMany({
//     where: {
//       OR: [
//         { fromArgumentId: argumentId, type: { in: edgeTypes } },
//         { toArgumentId: argumentId, type: { in: edgeTypes } },
//       ],
//     },
//   });

//   // Get unique connected argument IDs
//   const connectedIds = new Set<string>();
//   for (const edge of connectedEdges) {
//     if (edge.fromArgumentId !== argumentId && !visited.has(edge.fromArgumentId)) {
//       connectedIds.add(edge.fromArgumentId);
//     }
//     if (edge.toArgumentId !== argumentId && !visited.has(edge.toArgumentId)) {
//       connectedIds.add(edge.toArgumentId);
//     }
//   }

//   // Fetch and convert connected arguments
//   for (const connectedId of connectedIds) {
//     const arg = await prisma.argument.findUnique({
//       where: { id: connectedId },
//       include: {
//         scheme: true,
//         conclusion: true,
//         premises: {
//           include: {
//             claim: true,
//           }
//         },
//       }
//     });

//     if (!arg) continue;

//     const aif = convertArgumentToAif(arg);
//     nodes.push(...aif.nodes);
//     edges.push(...aif.edges);
//     visited.add(connectedId);

//     // Add relation edges between arguments
//     const relatedEdges = connectedEdges.filter(
//       e => e.fromArgumentId === connectedId || e.toArgumentId === connectedId
//     );

//     for (const relEdge of relatedEdges) {
//       const role = mapEdgeTypeToAifRole(relEdge.type);
//       edges.push({
//         id: `edge:${relEdge.id}`,
//         from: `RA:${relEdge.fromArgumentId}`,  // ✅ Fixed field name
//         to: `RA:${relEdge.toArgumentId}`,      // ✅ Fixed field name
//         role: role as AifEdgeRole,
//       });
//     }

//     // Recurse
//     if (remainingDepth > 1) {
//       await expandNeighborhood(
//         connectedId,
//         remainingDepth - 1,
//         nodes,
//         edges,
//         visited,
//         filters
//       );
//     }
//   }
// }

// function mapEdgeTypeToAifRole(edgeType: string): string {
//   switch (edgeType) {
//     case 'support':
//       return 'RA';
//     case 'rebut':
//     case 'undercut':
//       return 'CA';
//     case 'concede':
//       return 'RA';
//     default:
//       return 'RA';
//   }
// }

// function convertArgumentToAif(argument: any): AifSubgraph {
//   const nodes: AifNode[] = [];
//   const edges: AifEdge[] = [];

//   // Add RA node for the argument
//   const raNodeId = `RA:${argument.id}`;
//   nodes.push({
//     id: raNodeId,
//     kind: 'RA',
//     label: argument.text || 'Argument',
//     schemeKey: argument.scheme?.key || argument.schemeKey,
//   });

//   // Add I-nodes for premises (ArgumentPremise -> Claim)
//   for (const premise of argument.premises || []) {
//     if (premise.claim) {
//       const premiseNodeId = `I:premise:${premise.claim.id}`;
//       nodes.push({
//         id: premiseNodeId,
//         kind: 'I',
//         label: premise.claim.text,
//       });
      
//       edges.push({
//         id: `edge:premise:${argument.id}:${premise.claim.id}`,
//         from: premiseNodeId,
//         to: raNodeId,
//       });
//     }
//   }

//   // Add I-node for conclusion (Argument.conclusion)
//   if (argument.conclusion) {
//     const conclusionNodeId = `I:conclusion:${argument.conclusion.id}`;
//     nodes.push({
//       id: conclusionNodeId,
//       kind: 'I',
//       text: argument.conclusion.text,
//       label: argument.conclusion.text,
//     });

//     edges.push({
//       id: `edge:conclusion:${argument.id}`,
//       from: raNodeId,
//       to: conclusionNodeId,
//       role: 'RA',
//     });
//   }

//   return { nodes, edges };
// }