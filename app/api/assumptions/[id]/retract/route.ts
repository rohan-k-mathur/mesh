// app/api/assumptions/[id]/retract/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { getUserFromCookies } from "@/lib/serverutils";

/**
 * POST /api/assumptions/[id]/retract
 * Retract an assumption and change its status to RETRACTED.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromCookies();
    if (!user?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const assumptionId = params.id;

    // Fetch the assumption
    const assumption = await prisma.assumptionUse.findUnique({
      where: { id: assumptionId },
      select: {
        id: true,
        status: true,
        deliberationId: true,
      },
    });

    if (!assumption) {
      return NextResponse.json(
        { error: "Assumption not found" },
        { status: 404 }
      );
    }

    // Validate state transition
    if (assumption.status === "RETRACTED") {
      return NextResponse.json(
        { error: "Assumption is already retracted" },
        { status: 400 }
      );
    }

    // Update status to RETRACTED
    const updated = await prisma.assumptionUse.update({
      where: { id: assumptionId },
      data: {
        status: "RETRACTED",
        statusChangedAt: new Date(),
        statusChangedBy: user.userId.toString(),
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("Error retracting assumption:", error);
    return NextResponse.json(
      { error: "Failed to retract assumption" },
      { status: 500 }
    );
  }
}
