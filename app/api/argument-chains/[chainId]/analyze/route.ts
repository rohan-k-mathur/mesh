import { NextRequest } from "next/server";
import { getUserFromCookies } from "@/lib/serverutils";
import { prisma } from "@/lib/prismaclient";
import {
  findCriticalPath,
  detectCycles,
  calculateChainStrength,
  type CriticalPath,
  type Cycle,
  type ChainStrength,
} from "@/lib/utils/chainAnalysisUtils";
import type { Node, Edge } from "reactflow";
import type { ChainNodeData, ChainEdgeData } from "@/lib/types/argumentChain";

/**
 * POST /api/argument-chains/[chainId]/analyze
 * 
 * Run computational analysis on an argument chain:
 * - Critical path detection (strongest reasoning path)
 * - Cycle detection (circular reasoning)
 * - Chain strength calculation (WWAW formula)
 * - AI suggestions for improvements (Task 3.4 - not yet implemented)
 * 
 * Authentication: Required (must be chain creator or node contributor)
 * 
 * @example Request
 * POST /api/argument-chains/chain_abc123/analyze
 * 
 * @example Response
 * {
 *   "criticalPath": {
 *     "nodeIds": ["node1", "node2", "node3"],
 *     "avgStrength": 0.85,
 *     "weakestLink": { "nodeId": "node2", "edgeStrength": 0.75 }
 *   },
 *   "cycles": [],
 *   "strength": {
 *     "overallStrength": 0.82,
 *     "vulnerableNodes": ["node4"],
 *     "strongNodes": ["node1", "node3"]
 *   },
 *   "suggestions": []
 * }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { chainId: string } }
) {
  try {
    // Authentication
    const user = await getUserFromCookies();
    if (!user) {
      return Response.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { chainId } = params;

    // Fetch chain with all nodes and edges
    const chain = await prisma.argumentChain.findUnique({
      where: { id: chainId },
      include: {
        creator: { select: { id: true } },
        nodes: {
          include: {
            argument: {
              select: {
                id: true,
                text: true,
                conclusionClaimId: true,
                conclusion: {
                  select: {
                    id: true,
                    text: true,
                  },
                },
              },
            },
            contributor: { select: { id: true } },
          },
          orderBy: { nodeOrder: "asc" },
        },
        edges: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!chain) {
      return Response.json(
        { error: "Argument chain not found" },
        { status: 404 }
      );
    }

    // Permission check: user must be creator or contributor
    const isCreator = chain.creator.id === user.userId;
    const isContributor = chain.nodes.some(
      (node: any) => node.contributor.id === user.userId
    );

    if (!isCreator && !isContributor) {
      return Response.json(
        { error: "You do not have permission to analyze this chain" },
        { status: 403 }
      );
    }

    // Transform Prisma data to ReactFlow format for analysis
    const nodes: Node<ChainNodeData>[] = chain.nodes.map((node: any) => ({
      id: node.id,
      type: "argumentNode",
      position: { x: node.positionX || 0, y: node.positionY || 0 },
      data: {
        argument: node.argument, // Pass full argument object
        role: node.role,
        nodeOrder: node.nodeOrder,
        addedBy: {
          id: node.contributor.id.toString(),
          name: null,
          image: null,
        },
      },
    }));

    const edges: Edge<ChainEdgeData>[] = chain.edges.map((edge: any) => ({
      id: edge.id,
      source: edge.sourceNodeId,
      target: edge.targetNodeId,
      type: "chainEdge",
      data: {
        edgeType: edge.edgeType,
        strength: edge.strength,
        description: edge.description,
      },
    }));

    // Run analysis algorithms (Tasks 3.1, 3.2, 3.3)
    const criticalPath = findCriticalPath(nodes, edges);
    const cycles = detectCycles(nodes, edges);
    const strength = calculateChainStrength(nodes, edges);

    // Task 3.4: AI suggestions (placeholder - will implement in separate task)
    const suggestions: any[] = [];

    // Build response
    const analysis = {
      criticalPath: serializeCriticalPath(criticalPath),
      cycles: cycles.map(serializeCycle),
      strength: serializeStrength(strength),
      suggestions,
      metadata: {
        analyzedAt: new Date().toISOString(),
        nodeCount: nodes.length,
        edgeCount: edges.length,
        structureType: strength.structureType,
      },
    };

    return Response.json(analysis);
  } catch (error) {
    console.error("Error analyzing argument chain:", error);
    return Response.json(
      {
        error: "Failed to analyze argument chain",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// Serialization Helpers
// ============================================================================

/**
 * Serialize critical path for JSON response
 */
function serializeCriticalPath(path: CriticalPath) {
  return {
    nodeIds: path.nodeIds,
    totalStrength: Number(path.totalStrength.toFixed(3)),
    avgStrength: Number(path.avgStrength.toFixed(3)),
    weakestLink: {
      nodeId: path.weakestLink.nodeId,
      edgeStrength: Number(path.weakestLink.edgeStrength.toFixed(3)),
    },
    pathLength: path.pathLength,
  };
}

/**
 * Serialize cycle for JSON response
 */
function serializeCycle(cycle: Cycle) {
  return {
    nodeIds: cycle.nodeIds,
    severity: cycle.severity,
    avgStrength: Number(cycle.avgStrength.toFixed(3)),
    description:
      cycle.severity === "error"
        ? "Strong circular reasoning detected (high confidence edges)"
        : "Weak circular pattern detected (may be intentional dialectical loop)",
  };
}

/**
 * Serialize strength analysis for JSON response
 */
function serializeStrength(strength: ChainStrength) {
  // Convert Map to plain object for JSON
  const nodeStrengthsObject: Record<string, number> = {};
  strength.nodeStrengths.forEach((value, key) => {
    nodeStrengthsObject[key] = Number(value.toFixed(3));
  });

  return {
    overallStrength: Number(strength.overallStrength.toFixed(3)),
    nodeStrengths: nodeStrengthsObject,
    vulnerableNodes: strength.vulnerableNodes,
    strongNodes: strength.strongNodes,
    structureType: strength.structureType,
  };
}
