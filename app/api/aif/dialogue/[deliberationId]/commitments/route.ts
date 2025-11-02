import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/serverutils";
import { getCommitmentStores } from "@/lib/aif/graph-builder";
import { prisma } from "@/lib/prismaclient";

/**
 * GET /api/aif/dialogue/[deliberationId]/commitments
 * 
 * Returns commitment stores for all participants in a deliberation.
 * Shows which claims each participant has committed to (ASSERT, CONCEDE, THEREFORE)
 * and which they have retracted.
 * 
 * Query params:
 * - participantId (optional): Filter to specific participant
 * - asOf (optional): ISO timestamp to get commitments as of a specific point in time
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { deliberationId: string } }
) {
  try {
    // Get current user ID for authorization
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { deliberationId } = params;

    if (!deliberationId) {
      return NextResponse.json(
        { error: "Missing deliberationId parameter" },
        { status: 400 }
      );
    }

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const participantId = searchParams.get("participantId") || undefined;
    const asOf = searchParams.get("asOf") || undefined;

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

    // Get commitment stores
    const commitments = await getCommitmentStores(
      deliberationId,
      participantId,
      asOf
    );

    return NextResponse.json(commitments, { status: 200 });
  } catch (error) {
    console.error("Error getting commitment stores:", error);
    return NextResponse.json(
      { error: "Failed to get commitment stores" },
      { status: 500 }
    );
  }
}
