import { Prisma } from "@prisma/client";

// Full chain with all relations
export type ArgumentChainWithRelations = Prisma.ArgumentChainGetPayload<{
  include: {
    creator: {
      select: {
        id: true;
        name: true;
        image: true;
      };
    };
    deliberation: {
      select: {
        id: true;
        title: true;
      };
    };
    nodes: {
      include: {
        argument: {
          include: {
            conclusion: {
              select: {
                id: true;
                text: true;
              };
            };
            argumentSchemes: {
              include: {
                scheme: true;
              };
            };
            schemeNet: {
              include: {
                steps: {
                  include: {
                    scheme: true;
                  };
                  orderBy: {
                    stepOrder: "asc";
                  };
                };
              };
            };
          };
        };
        contributor: {
          select: {
            id: true;
            name: true;
            image: true;
          };
        };
      };
      orderBy: {
        nodeOrder: "asc";
      };
    };
    edges: {
      include: {
        sourceNode: {
          include: {
            argument: {
              select: {
                id: true;
                text: true;
                conclusion: {
                  select: {
                    id: true;
                    text: true;
                  };
                };
              };
            };
          };
        };
        targetNode: {
          include: {
            argument: {
              select: {
                id: true;
                text: true;
                conclusion: {
                  select: {
                    id: true;
                    text: true;
                  };
                };
              };
            };
          };
        };
      };
    };
  };
}>;

// Chain summary (for list views)
export type ArgumentChainSummary = Prisma.ArgumentChainGetPayload<{
  include: {
    creator: {
      select: {
        id: true;
        name: true;
        image: true;
      };
    };
    _count: {
      select: {
        nodes: true;
        edges: true;
      };
    };
  };
}>;

// Node with argument
export type ArgumentChainNodeWithArgument = Prisma.ArgumentChainNodeGetPayload<{
  include: {
    argument: {
      include: {
        argumentSchemes: {
          include: {
            scheme: true;
          };
        };
        schemeNet: {
          include: {
            steps: {
              include: {
                scheme: true;
              };
              orderBy: {
                stepOrder: "asc";
              };
            };
          };
        };
      };
    };
    contributor: {
      select: {
        id: true;
        name: true;
        image: true;
      };
    };
  };
}>;

// Edge with nodes
export type ArgumentChainEdgeWithNodes = Prisma.ArgumentChainEdgeGetPayload<{
  include: {
    sourceNode: {
      include: {
        argument: {
          select: {
            id: true;
            text: true;
          };
        };
      };
    };
    targetNode: {
      include: {
        argument: {
          select: {
            id: true;
            text: true;
          };
        };
      };
    };
  };
}>;

// Analysis result types
export interface ChainAnalysis {
  complexity: {
    nodeCount: number;
    edgeCount: number;
    averageDegree: number;
    maxDepth: number;
    rootNodes: string[];
    conclusionNodes: string[];
  };
  criticalPath: {
    nodes: string[];
    edges: string[];
    overallStrength: number;
    weakestLink: {
      edgeId: string;
      sourceNodeId: string;
      targetNodeId: string;
      strength: number;
    } | null;
  } | null;
  suggestions: Array<{
    type: "disconnected_nodes" | "weak_links" | "circular_dependency";
    message: string;
    affectedNodes: string[];
  }>;
  
  // Phase 3 Lite: Basic scheme aggregation
  schemeInfo?: {
    /** Total arguments with at least one scheme assigned */
    argumentsWithSchemes: number;
    /** Total arguments with a SchemeNet (multi-step reasoning) */
    argumentsWithSchemeNets: number;
    /** Aggregated scheme usage across all chain nodes */
    schemeCounts: Array<{
      schemeId: string;
      schemeName: string;
      schemeKey: string;
      count: number;
    }>;
    /** Arguments lacking scheme assignment (potential gaps) */
    unstructuredArguments: string[];
  };
}

// ReactFlow node data
export interface ChainNodeData {
  argument: ArgumentChainNodeWithArgument["argument"];
  role?: string;
  addedBy: {
    id: string;
    name: string | null;
    image: string | null;
  };
  nodeOrder: number;
  isHighlighted?: boolean;
  targetType?: "NODE" | "EDGE";
  targetEdgeId?: string | null;
}

// ReactFlow edge data
export interface ChainEdgeData {
  edgeType: string;
  strength: number;
  description?: string | null;
  slotMapping?: any;
  isTargeted?: boolean;
  attackCount?: number;
}

