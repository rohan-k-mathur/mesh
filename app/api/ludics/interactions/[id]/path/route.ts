/**
 * DDS Interaction Path Extraction API Route
 * 
 * GET /api/ludics/interactions/[id]/path - Extract visitable paths
 * POST /api/ludics/interactions/[id]/path - Extract with options
 * 
 * Uses Phase 3 extraction module to extract paths, incarnations,
 * completions, and narrative representations from interactions.
 */

import { NextRequest, NextResponse } from "next/server";
import { interactionStore } from "../../route";

// Phase 3 Extraction imports
import {
  extractPath,
  extractAllPaths,
  validatePath,
  comparePaths,
  mergePaths,
} from "@/packages/ludics-core/dds/extraction/path-extractor";
import {
  computeIncarnation,
  computeView,
  justifies,
  hasJustifyingPositive,
} from "@/packages/ludics-core/dds/extraction/incarnation";
import {
  completeDesign,
  isChronicleComplete,
  addDaimonEnding,
} from "@/packages/ludics-core/dds/extraction/completion";
import {
  formatAsNarrative,
  narrativeToMarkdown,
  narrativeToJSON,
  narrativeToPlainText,
  narrativeToHTML,
} from "@/packages/ludics-core/dds/extraction/narrative-formatter";

import type { VisitablePath, Chronicle } from "@/packages/ludics-core/dds/extraction/path-extractor";
import type { LudicDesignTheory } from "@/packages/ludics-core/dds/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/ludics/interactions/[id]/path
 * Extract paths from completed or in-progress interaction
 * 
 * Query params:
 * - format: "json" | "markdown" | "html" | "plaintext" (default: "json")
 * - includeIncarnation: "true" | "false" (default: "false")
 * - includeAllPaths: "true" | "false" (default: "false")
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "json";
    const includeIncarnation = searchParams.get("includeIncarnation") === "true";
    const includeAllPaths = searchParams.get("includeAllPaths") === "true";

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Interaction ID is required" },
        { status: 400 }
      );
    }

    const interaction = interactionStore.get(id);
    if (!interaction) {
      return NextResponse.json(
        { ok: false, error: "Interaction not found" },
        { status: 404 }
      );
    }

    // Convert interaction move history to a design for extraction
    const design = interactionToDesign(interaction);

    // Extract the primary path
    const primaryPath = extractPath(design);

    // Optionally extract all paths (branching)
    let allPaths: VisitablePath[] = [];
    if (includeAllPaths) {
      allPaths = extractAllPaths(design);
    }

    // Validate the path
    const validation = validatePath(primaryPath, design);

    // Optionally compute incarnation
    let incarnation: LudicDesignTheory | null = null;
    if (includeIncarnation && primaryPath.chronicle) {
      incarnation = computeIncarnation(design, primaryPath.chronicle);
    }

    // Format narrative
    const narrative = formatAsNarrative(primaryPath, {
      includeTimestamps: true,
      includeDepthInfo: true,
      includePolarityInfo: true,
    });

    // Convert to requested format
    let formattedOutput: string;
    switch (format) {
      case "markdown":
        formattedOutput = narrativeToMarkdown(narrative);
        break;
      case "html":
        formattedOutput = narrativeToHTML(narrative);
        break;
      case "plaintext":
        formattedOutput = narrativeToPlainText(narrative);
        break;
      case "json":
      default:
        formattedOutput = narrativeToJSON(narrative);
        break;
    }

    // Build chronicle info
    const chronicleInfo = primaryPath.chronicle ? {
      id: primaryPath.chronicle.id,
      length: primaryPath.chronicle.sequence.length,
      isComplete: isChronicleComplete(primaryPath.chronicle),
      hasDaimon: primaryPath.chronicle.hasDaimon,
    } : null;

    return NextResponse.json({
      ok: true,
      interactionId: id,
      path: {
        id: primaryPath.id,
        length: primaryPath.sequence.length,
        sequence: primaryPath.sequence.map(action => ({
          focus: action.focus,
          polarity: action.polarity,
          ramification: action.ramification,
        })),
        chronicle: chronicleInfo,
      },
      validation: {
        isValid: validation.isValid,
        errors: validation.errors,
        warnings: validation.warnings,
      },
      narrative: {
        format,
        content: formattedOutput,
        title: narrative.title,
        moveCount: narrative.moves.length,
      },
      allPaths: includeAllPaths ? allPaths.map(p => ({
        id: p.id,
        length: p.sequence.length,
        isMainPath: p.id === primaryPath.id,
      })) : undefined,
      incarnation: incarnation ? {
        actionCount: incarnation.actions.length,
        hasBaseAction: incarnation.actions.some(a => a.focus === ""),
      } : undefined,
      stats: {
        totalMoves: interaction.moveHistory.length,
        pMoves: interaction.moveHistory.filter(m => m.player === "P").length,
        oMoves: interaction.moveHistory.filter(m => m.player === "O").length,
        maxDepth: Math.max(...interaction.moveHistory.map(m => m.address.length), 0),
      },
    });
  } catch (error: any) {
    console.error("[Path Extraction GET Error]", error);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ludics/interactions/[id]/path
 * Extract paths with detailed options
 * 
 * Body:
 * - format?: "json" | "markdown" | "html" | "plaintext"
 * - includeAllPaths?: boolean
 * - computeIncarnation?: boolean
 * - computeViews?: boolean
 * - completeIfNeeded?: boolean
 * - compareWith?: string[] (other interaction IDs to compare)
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      format = "json",
      includeAllPaths = false,
      computeIncarnation: doIncarnation = false,
      computeViews: doViews = false,
      completeIfNeeded = false,
      compareWith = [],
    } = body;

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Interaction ID is required" },
        { status: 400 }
      );
    }

    const interaction = interactionStore.get(id);
    if (!interaction) {
      return NextResponse.json(
        { ok: false, error: "Interaction not found" },
        { status: 404 }
      );
    }

    // Convert to design
    let design = interactionToDesign(interaction);

    // Optionally complete the design
    let wasCompleted = false;
    if (completeIfNeeded) {
      const completed = completeDesign(design);
      if (completed.actions.length > design.actions.length) {
        design = completed;
        wasCompleted = true;
      }
    }

    // Extract primary path
    const primaryPath = extractPath(design);

    // Extract all paths if requested
    let allPaths: VisitablePath[] = [];
    if (includeAllPaths) {
      allPaths = extractAllPaths(design);
    }

    // Compute incarnation if requested
    let incarnation: LudicDesignTheory | null = null;
    if (doIncarnation && primaryPath.chronicle) {
      incarnation = computeIncarnation(design, primaryPath.chronicle);
    }

    // Compute views if requested
    let views: { pView: any; oView: any } | null = null;
    if (doViews && primaryPath.chronicle) {
      const position = pathToPosition(primaryPath);
      const pView = computeView(design, position, "P");
      const oView = computeView(design, position, "O");
      views = { pView, oView };
    }

    // Compare with other interactions if requested
    let comparisons: Array<{
      otherId: string;
      similarity: number;
      divergencePoint: number | null;
    }> = [];

    if (compareWith.length > 0) {
      for (const otherId of compareWith) {
        const otherInteraction = interactionStore.get(otherId);
        if (otherInteraction) {
          const otherDesign = interactionToDesign(otherInteraction);
          const otherPath = extractPath(otherDesign);
          const comparison = comparePaths(primaryPath, otherPath);
          comparisons.push({
            otherId,
            similarity: comparison.similarity,
            divergencePoint: comparison.divergencePoint,
          });
        }
      }
    }

    // Format narrative
    const narrative = formatAsNarrative(primaryPath, {
      includeTimestamps: true,
      includeDepthInfo: true,
      includePolarityInfo: true,
    });

    let formattedOutput: string;
    switch (format) {
      case "markdown":
        formattedOutput = narrativeToMarkdown(narrative);
        break;
      case "html":
        formattedOutput = narrativeToHTML(narrative);
        break;
      case "plaintext":
        formattedOutput = narrativeToPlainText(narrative);
        break;
      case "json":
      default:
        formattedOutput = narrativeToJSON(narrative);
        break;
    }

    // Validation
    const validation = validatePath(primaryPath, design);

    return NextResponse.json({
      ok: true,
      interactionId: id,
      path: {
        id: primaryPath.id,
        length: primaryPath.sequence.length,
        sequence: primaryPath.sequence,
        chronicle: primaryPath.chronicle ? {
          id: primaryPath.chronicle.id,
          length: primaryPath.chronicle.sequence.length,
          isComplete: isChronicleComplete(primaryPath.chronicle),
          hasDaimon: primaryPath.chronicle.hasDaimon,
        } : null,
      },
      validation,
      narrative: {
        format,
        content: formattedOutput,
      },
      allPaths: includeAllPaths ? allPaths.map(p => ({
        id: p.id,
        length: p.sequence.length,
        sequence: p.sequence,
      })) : undefined,
      incarnation: incarnation ? {
        id: incarnation.id,
        actionCount: incarnation.actions.length,
        actions: incarnation.actions,
      } : undefined,
      views,
      comparisons: comparisons.length > 0 ? comparisons : undefined,
      processing: {
        wasCompleted,
        pathsExtracted: includeAllPaths ? allPaths.length : 1,
        incarnationComputed: doIncarnation,
        viewsComputed: doViews,
      },
    });
  } catch (error: any) {
    console.error("[Path Extraction POST Error]", error);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Convert interaction state to a LudicDesignTheory for extraction
 */
function interactionToDesign(interaction: any): LudicDesignTheory {
  const actions = interaction.moveHistory.map((move: any, idx: number) => ({
    actId: `act-${idx}`,
    focus: move.address,
    ramification: move.ramification,
    polarity: move.player,
  }));

  // Check if interaction ended with daimon (stuck state)
  const hasDaimon = interaction.result?.endReason === "stuck" ||
                    interaction.result?.endReason === "daimon";

  return {
    id: `design-from-${interaction.id}`,
    polarity: "P", // Convention: design from P's perspective
    base: "",
    actions,
    hasDaimon,
    metadata: {
      sourceInteractionId: interaction.id,
      extractedAt: new Date().toISOString(),
    },
  };
}

/**
 * Convert path to position for view computation
 */
function pathToPosition(path: VisitablePath): any {
  return {
    address: path.sequence[path.sequence.length - 1]?.focus || "",
    actions: path.sequence,
    depth: path.sequence.length,
  };
}
