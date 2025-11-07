// app/api/deliberations/[id]/challenges-on-user/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";

const NO_STORE = { headers: { "Cache-Control": "no-store" } } as const;

/**
 * GET /api/deliberations/[id]/challenges-on-user?userId=X
 * 
 * Fetch all WHY dialogue moves targeting a specific user's work.
 * Used by DiscourseDashboard "Actions on My Work" panel.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const deliberationId = params.id;
  const userId = req.nextUrl.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json(
      { error: "userId query parameter required" },
      { status: 400, ...NO_STORE }
    );
  }

  try {
    // Find all claims authored by this user
    const userClaims = await prisma.claim.findMany({
      where: {
        deliberationId,
        createdById: userId,
      },
      select: { id: true, text: true },
    });

    // Find all arguments authored by this user
    const userArguments = await prisma.argument.findMany({
      where: {
        deliberationId,
        authorId: userId,
      },
      select: { 
        id: true, 
        text: true,
        claim: {
          select: { text: true },
        },
      },
    });

    const userClaimIds = userClaims.map((c) => c.id);
    const userArgumentIds = userArguments.map((a) => a.id);

    // Find all WHY moves targeting user's claims or arguments
    const whyMoves = await prisma.dialogueMove.findMany({
      where: {
        deliberationId,
        kind: "WHY",
        OR: [
          {
            targetType: "claim",
            targetId: { in: userClaimIds },
          },
          {
            targetType: "argument",
            targetId: { in: userArgumentIds },
          },
        ],
        actorId: { not: userId }, // Exclude user's own WHY moves
      },
      orderBy: { createdAt: "desc" },
    });

    // Format for dashboard
    const formatted = whyMoves.map((move) => {
      // Find target text
      const targetText = 
        userClaims.find((c) => c.id === move.targetId)?.text ||
        userArguments.find((a) => a.id === move.targetId)?.claim?.text ||
        "";

      return {
        id: move.id,
        challengerId: move.actorId,
        challengerName: null, // TODO: Fetch user names
        targetType: move.targetType,
        targetId: move.targetId,
        targetText,
        payload: move.payload,
        createdAt: move.createdAt,
        responded: false, // TODO: Check if user has responded with GROUNDS
      };
    });

    return NextResponse.json(formatted, NO_STORE);
  } catch (err) {
    console.error("[GET /api/deliberations/[id]/challenges-on-user] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch challenges" },
      { status: 500, ...NO_STORE }
    );
  }
}
