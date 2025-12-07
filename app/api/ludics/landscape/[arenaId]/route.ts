/**
 * DDS Landscape API Route
 * 
 * GET /api/ludics/landscape/[arenaId] - Get landscape visualization data
 * POST /api/ludics/landscape/[arenaId] - Compute detailed landscape analysis
 * 
 * Uses Phase 4 landscape module to generate heat maps, position strength
 * analysis, flow paths, critical points, and tree layouts.
 */

import { NextRequest, NextResponse } from "next/server";
import { arenaById } from "../../arenas/route";

// Phase 4 Landscape imports
import {
  generateLandscapeData,
  layoutAsTree,
  findCriticalPoints,
  extractFlowPaths,
  landscapeToJSON,
  landscapeToSVG,
} from "@/packages/ludics-core/dds/landscape/visualization-data";
import {
  analyzePositionStrength,
  analyzeAllPositions,
  runSimulations,
  hasWinningStrategy,
} from "@/packages/ludics-core/dds/landscape/position-analyzer";
import {
  converges,
  computeOrthogonal,
  computeBiorthogonalClosure,
  computeBehaviour,
} from "@/packages/ludics-core/dds/landscape/behaviour-computer";
import {
  checkBehaviourCompleteness,
  checkDesignCompleteness,
  findMissingDesigns,
  validateBehaviourStructure,
} from "@/packages/ludics-core/dds/landscape/completeness-checker";
import {
  analyzeFullLandscape,
  quickStrengthCheck,
} from "@/packages/ludics-core/dds/landscape";

import type { LandscapeData, HeatMapCell } from "@/packages/ludics-core/dds/landscape/visualization-data";
import type { PositionStrength } from "@/packages/ludics-core/dds/landscape/position-analyzer";
import type { LudicDesignTheory, LudicBehaviourTheory } from "@/packages/ludics-core/dds/types";

interface RouteParams {
  params: Promise<{ arenaId: string }>;
}

/**
 * GET /api/ludics/landscape/[arenaId]
 * Get landscape visualization data for an arena
 * 
 * Query params:
 * - format: "json" | "svg" (default: "json")
 * - includeHeatMap: "true" | "false" (default: "true")
 * - includeFlowPaths: "true" | "false" (default: "false")
 * - includeCriticalPoints: "true" | "false" (default: "false")
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { arenaId } = await params;
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "json";
    const includeHeatMap = searchParams.get("includeHeatMap") !== "false";
    const includeFlowPaths = searchParams.get("includeFlowPaths") === "true";
    const includeCriticalPoints = searchParams.get("includeCriticalPoints") === "true";

    if (!arenaId) {
      return NextResponse.json(
        { ok: false, error: "Arena ID is required" },
        { status: 400 }
      );
    }

    const arena = arenaById.get(arenaId);
    if (!arena) {
      return NextResponse.json(
        { ok: false, error: "Arena not found" },
        { status: 404 }
      );
    }

    // Convert arena to designs for landscape generation
    const designs = arenaToDesigns(arena);

    // Generate landscape data
    const landscape = generateLandscapeData(designs);

    // Get tree layout
    const treeLayout = layoutAsTree(landscape);

    // Optionally find critical points
    let criticalPoints: any[] = [];
    if (includeCriticalPoints) {
      criticalPoints = findCriticalPoints(landscape);
    }

    // Optionally extract flow paths
    let flowPaths: any[] = [];
    if (includeFlowPaths) {
      flowPaths = extractFlowPaths(landscape);
    }

    // Format output
    if (format === "svg") {
      const svg = landscapeToSVG(landscape, {
        width: 800,
        height: 600,
        showHeatMap: includeHeatMap,
        showFlowPaths: includeFlowPaths,
      });

      return new NextResponse(svg, {
        headers: {
          "Content-Type": "image/svg+xml",
        },
      });
    }

    // JSON format (default)
    const json = landscapeToJSON(landscape);

    return NextResponse.json({
      ok: true,
      arenaId,
      landscape: {
        id: landscape.id,
        nodeCount: landscape.nodes.length,
        edgeCount: landscape.edges.length,
        maxDepth: Math.max(...landscape.nodes.map(n => n.depth), 0),
      },
      heatMap: includeHeatMap ? landscape.heatMap : undefined,
      treeLayout: {
        root: treeLayout.root,
        levels: treeLayout.levels,
        totalNodes: treeLayout.nodes.length,
      },
      criticalPoints: includeCriticalPoints ? criticalPoints : undefined,
      flowPaths: includeFlowPaths ? flowPaths : undefined,
      stats: {
        pPositions: landscape.nodes.filter(n => n.player === "P").length,
        oPositions: landscape.nodes.filter(n => n.player === "O").length,
        terminalNodes: landscape.nodes.filter(n => n.isTerminal).length,
        branchingPoints: landscape.nodes.filter(n => n.children.length > 1).length,
      },
      json: format === "json" ? json : undefined,
    });
  } catch (error: any) {
    console.error("[Landscape GET Error]", error);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ludics/landscape/[arenaId]
 * Compute detailed landscape analysis
 * 
 * Body:
 * - computeStrength?: boolean - Run position strength analysis
 * - runSimulations?: boolean - Run game simulations
 * - simulationCount?: number - Number of simulations (default: 100)
 * - computeBehaviours?: boolean - Compute orthogonal/biorthogonal
 * - checkCompleteness?: boolean - Check behaviour completeness
 * - generateVisualization?: boolean - Generate full visualization data
 * - designs?: Design[] - Optional specific designs to analyze
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { arenaId } = await params;
    const body = await req.json();
    const {
      computeStrength = true,
      runSimulationsFlag = false,
      simulationCount = 100,
      computeBehaviours = false,
      checkCompleteness = false,
      generateVisualization = true,
      designs: providedDesigns,
    } = body;

    if (!arenaId) {
      return NextResponse.json(
        { ok: false, error: "Arena ID is required" },
        { status: 400 }
      );
    }

    const arena = arenaById.get(arenaId);
    if (!arena) {
      return NextResponse.json(
        { ok: false, error: "Arena not found" },
        { status: 404 }
      );
    }

    // Use provided designs or generate from arena
    const designs: LudicDesignTheory[] = providedDesigns || arenaToDesigns(arena);

    // Results container
    const results: any = {
      arenaId,
      designCount: designs.length,
    };

    // Generate base landscape
    if (generateVisualization) {
      const landscape = generateLandscapeData(designs);
      const treeLayout = layoutAsTree(landscape);
      const criticalPoints = findCriticalPoints(landscape);
      const flowPaths = extractFlowPaths(landscape);

      results.landscape = {
        id: landscape.id,
        nodeCount: landscape.nodes.length,
        edgeCount: landscape.edges.length,
        nodes: landscape.nodes,
        edges: landscape.edges,
        heatMap: landscape.heatMap,
      };
      results.treeLayout = treeLayout;
      results.criticalPoints = criticalPoints;
      results.flowPaths = flowPaths;
    }

    // Position strength analysis
    if (computeStrength) {
      const positions = designs.flatMap(d => 
        d.actions.map(a => ({
          address: a.focus,
          currentPlayer: a.polarity,
          depth: a.focus.length,
        }))
      );

      // Quick strength check for overview
      const quickCheck = quickStrengthCheck(designs);
      
      // Full analysis for all positions
      const allStrengths = analyzeAllPositions(designs, arena);

      results.strengthAnalysis = {
        quickCheck,
        positions: allStrengths.map(s => ({
          address: s.position.address,
          player: s.position.currentPlayer,
          score: s.score,
          winProbability: s.winProbability,
          strategicValue: s.strategicValue,
          hasWinningStrategy: s.hasWinningStrategy,
        })),
        stats: {
          avgScore: allStrengths.reduce((sum, s) => sum + s.score, 0) / allStrengths.length,
          maxScore: Math.max(...allStrengths.map(s => s.score)),
          minScore: Math.min(...allStrengths.map(s => s.score)),
          winningStrategyCount: allStrengths.filter(s => s.hasWinningStrategy).length,
        },
      };
    }

    // Simulations
    if (runSimulationsFlag) {
      const simResults = runSimulations(designs, arena, {
        simulationCount,
        maxMoves: 50,
      });

      results.simulations = {
        count: simulationCount,
        pWins: simResults.pWins,
        oWins: simResults.oWins,
        draws: simResults.draws,
        avgMoveCount: simResults.avgMoveCount,
        winRate: {
          P: simResults.pWins / simulationCount,
          O: simResults.oWins / simulationCount,
        },
      };
    }

    // Behaviour computation
    if (computeBehaviours) {
      // Separate P and O designs
      const pDesigns = designs.filter(d => d.polarity === "P");
      const oDesigns = designs.filter(d => d.polarity === "O");

      // Compute orthogonal and biorthogonal
      const orthogonal = computeOrthogonal(pDesigns);
      const biorthogonal = computeBiorthogonalClosure(pDesigns);
      const behaviour = computeBehaviour(designs);

      results.behaviours = {
        orthogonal: {
          designCount: orthogonal.length,
          designs: orthogonal.map(d => ({
            id: d.id,
            actionCount: d.actions.length,
            polarity: d.polarity,
          })),
        },
        biorthogonal: {
          designCount: biorthogonal.length,
          isClosed: biorthogonal.length === pDesigns.length,
        },
        combined: {
          id: behaviour.id,
          designCount: behaviour.designs.length,
          isComplete: behaviour.metadata?.isComplete ?? false,
        },
      };

      // Check convergence between designs
      const convergenceMatrix: boolean[][] = [];
      for (let i = 0; i < designs.length; i++) {
        convergenceMatrix[i] = [];
        for (let j = 0; j < designs.length; j++) {
          if (i !== j && designs[i].polarity !== designs[j].polarity) {
            convergenceMatrix[i][j] = converges(designs[i], designs[j]);
          } else {
            convergenceMatrix[i][j] = false;
          }
        }
      }
      results.convergenceMatrix = convergenceMatrix;
    }

    // Completeness check
    if (checkCompleteness) {
      const behaviour: LudicBehaviourTheory = {
        id: `behaviour-${arenaId}`,
        designs,
        base: "",
        metadata: {},
      };

      const completeness = checkBehaviourCompleteness(behaviour);
      const missingDesigns = findMissingDesigns(behaviour);
      const validation = validateBehaviourStructure(behaviour);

      results.completeness = {
        isComplete: completeness.isComplete,
        coverage: completeness.coverage,
        missingPositions: completeness.missingPositions,
        missingDesigns: missingDesigns.map(d => ({
          id: d.id,
          polarity: d.polarity,
          actionCount: d.actions.length,
        })),
        validation: {
          isValid: validation.isValid,
          errors: validation.errors,
          warnings: validation.warnings,
        },
      };
    }

    // Full landscape analysis (combines multiple analyses)
    const fullAnalysis = analyzeFullLandscape(designs, arena);
    results.fullAnalysis = {
      summary: fullAnalysis.summary,
      recommendations: fullAnalysis.recommendations,
    };

    return NextResponse.json({
      ok: true,
      ...results,
    });
  } catch (error: any) {
    console.error("[Landscape POST Error]", error);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Convert arena moves to designs for landscape analysis
 */
function arenaToDesigns(arena: any): LudicDesignTheory[] {
  const pActions: any[] = [];
  const oActions: any[] = [];

  for (const move of arena.moves) {
    const action = {
      actId: move.id,
      focus: move.address,
      ramification: move.ramification,
      polarity: move.player,
    };

    if (move.player === "P") {
      pActions.push(action);
    } else {
      oActions.push(action);
    }
  }

  const designs: LudicDesignTheory[] = [];

  if (pActions.length > 0) {
    designs.push({
      id: `design-p-${arena.id}`,
      polarity: "P",
      base: "",
      actions: pActions,
      hasDaimon: false,
    });
  }

  if (oActions.length > 0) {
    designs.push({
      id: `design-o-${arena.id}`,
      polarity: "O",
      base: "",
      actions: oActions,
      hasDaimon: false,
    });
  }

  return designs;
}
