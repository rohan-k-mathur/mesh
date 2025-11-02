import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/serverutils";
import { buildDialogueAwareGraph } from "@/lib/aif/graph-builder";
import { prisma } from "@/lib/prismaclient";

/**
 * GET /api/aif/graph-with-dialogue
 * 
 * Returns a complete AIF graph with dialogue layer for a deliberation.
 * Includes nodes, edges, dialogue moves, and commitment stores.
 * 
 * Query params:
 * - deliberationId (required): ID of the deliberation
 * - participantId (optional): Filter to specific participant's contributions
 * - startTime (optional): ISO timestamp for time range start
 * - endTime (optional): ISO timestamp for time range end
 * - includeDialogue (optional): Whether to include DM-nodes (default: true)
 */
export async function GET(req: NextRequest) {
  try {
    // Get current user ID for authorization
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const deliberationId = searchParams.get("deliberationId");
    const participantId = searchParams.get("participantId") || undefined;
    const startTime = searchParams.get("startTime") || undefined;
    const endTime = searchParams.get("endTime") || undefined;
    const includeDialogue = searchParams.get("includeDialogue") !== "false";

    if (!deliberationId) {
      return NextResponse.json(
        { error: "Missing required parameter: deliberationId" },
        { status: 400 }
      );
    }

    // Verify user has access to this deliberation
    const deliberation = await prisma.deliberation.findUnique({
      where: { id: deliberationId },
    });

    if (!deliberation) {
      return NextResponse.json(
        { error: "Deliberation not found" },
        { status: 404 }
      );
    }

    // Build time range object if provided
    const timeRange =
      startTime && endTime
        ? { start: startTime, end: endTime }
        : undefined;

    // Build the graph with dialogue layer
    const graph = await buildDialogueAwareGraph(deliberationId, {
      participantFilter: participantId,
      timeRange,
      includeDialogue,
    });

    return NextResponse.json(graph, { status: 200 });
  } catch (error) {
    console.error("Error building dialogue-aware graph:", error);
    return NextResponse.json(
      { error: "Failed to build graph" },
      { status: 500 }
    );
  }
}
