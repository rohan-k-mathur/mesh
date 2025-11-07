import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";

/**
 * GET /api/contraries?deliberationId=xxx&claimId=yyy
 * Fetch explicit contrary relationships
 * 
 * Query params:
 * - deliberationId (required): Filter by deliberation
 * - claimId (optional): Filter to contraries of a specific claim
 * - status (optional): Filter by status (default: ACTIVE)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const deliberationId = searchParams.get("deliberationId");
    const claimId = searchParams.get("claimId");
    const status = searchParams.get("status") || "ACTIVE";

    if (!deliberationId) {
      return NextResponse.json(
        { error: "Missing required parameter: deliberationId" },
        { status: 400 }
      );
    }

    // Build where clause
    const where: any = {
      deliberationId,
      status,
    };

    // If claimId provided, find contraries of that specific claim
    // (either as claimId or contraryId)
    if (claimId) {
      where.OR = [
        { claimId },
        { contraryId: claimId, isSymmetric: true }, // Include symmetric contraries
      ];
    }

    const contraries = await prisma.claimContrary.findMany({
      where,
      include: {
        claim: {
          select: {
            id: true,
            text: true,
          },
        },
        contrary: {
          select: {
            id: true,
            text: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            username: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Convert BigInt to string for JSON serialization
    const serializedContraries = contraries.map((contrary) => ({
      ...contrary,
      createdById: contrary.createdById.toString(),
      createdBy: {
        ...contrary.createdBy,
        id: contrary.createdBy.id.toString(),
      },
    }));

    return NextResponse.json({
      success: true,
      contraries: serializedContraries,
      count: serializedContraries.length,
    });
  } catch (error) {
    console.error("[Contraries API] Error fetching contraries:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/contraries?contraryId=xxx
 * Remove a contrary relationship (creator only)
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const contraryId = searchParams.get("contraryId");

    if (!contraryId) {
      return NextResponse.json(
        { error: "Missing required parameter: contraryId" },
        { status: 400 }
      );
    }

    // TODO: Add auth check - only creator or moderator can delete
    // For now, just set status to RETRACTED
    const updated = await prisma.claimContrary.update({
      where: { id: contraryId },
      data: { status: "RETRACTED" },
    });

    return NextResponse.json({
      success: true,
      contraryId: updated.id,
    });
  } catch (error) {
    console.error("[Contraries API] Error deleting contrary:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
