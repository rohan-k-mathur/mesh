// app/api/deliberations/[id]/dialogue-state/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";

const NO_STORE = { headers: { "Cache-Control": "no-store" } } as const;

/**
 * GET /api/deliberations/[id]/dialogue-state?argumentId=xxx
 * 
 * Returns dialogue state for an argument:
 * - totalAttacks: Number of incoming attacks (ArgumentEdges)
 * - answeredAttacks: Number of attacks with GROUNDS responses
 * - moveComplete: Boolean indicating if all attacks have been answered
 * 
 * Used by DialogueStateBadge (Phase 3) to show attack response status.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const deliberationId = params.id;
  const { searchParams } = new URL(req.url);
  const argumentId = searchParams.get("argumentId");

  if (!argumentId) {
    return NextResponse.json(
      { ok: false, error: "Missing argumentId parameter" },
      { status: 400, ...NO_STORE }
    );
  }

  try {
    // 1. Get all incoming attacks for this argument
    const attacks = await prisma.argumentEdge.findMany({
      where: {
        toArgumentId: argumentId,
        deliberationId,
        attackType: { in: ["REBUTS", "UNDERCUTS", "UNDERMINES"] },
      },
      select: {
        id: true,
        attackType: true,
        fromArgumentId: true,
      },
    });

    const totalAttacks = attacks.length;

    // 2. For each attack, check if there's a GROUNDS response
    let answeredAttacks = 0;
    let lastResponseAt: Date | null = null;

    for (const attack of attacks) {
      // Check for GROUNDS moves targeting the attacked argument (this argument)
      // These represent defenses against the attack
      const groundsMove = await prisma.dialogueMove.findFirst({
        where: {
          deliberationId,
          targetType: "argument",
          targetId: argumentId,
          kind: "GROUNDS",
          // Optional: Could filter by createdAt > attack createdAt
        },
        select: {
          id: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      });

      if (groundsMove) {
        answeredAttacks++;
        if (!lastResponseAt || groundsMove.createdAt > lastResponseAt) {
          lastResponseAt = groundsMove.createdAt;
        }
      }
    }

    const moveComplete = totalAttacks > 0 && answeredAttacks === totalAttacks;

    return NextResponse.json(
      {
        ok: true,
        state: {
          totalAttacks,
          answeredAttacks,
          moveComplete,
          lastResponseAt: lastResponseAt?.toISOString(),
        },
      },
      NO_STORE
    );
  } catch (err) {
    console.error("[dialogue-state] Error:", err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Internal server error",
      },
      { status: 500, ...NO_STORE }
    );
  }
}
