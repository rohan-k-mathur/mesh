/**
 * GET /api/arguments/[id]/defeats?deliberationId=xxx
 * 
 * Get defeats on and by a specific argument
 * Returns both:
 * - Defeats ON this argument (arguments that defeat this one)
 * - Defeats BY this argument (arguments this one defeats)
 * 
 * Useful for UI tooltips and preference visualization
 */

import { NextRequest, NextResponse } from "next/server";
import { getArgumentDefeats } from "@/lib/aspic/deliberationEvaluation";
import { prisma } from "@/lib/prismaclient";

const NO_STORE = { headers: { "Cache-Control": "no-store" } } as const;

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const argumentId = params.id;
    const url = new URL(req.url);
    const deliberationId = url.searchParams.get("deliberationId");

    if (!deliberationId) {
      return NextResponse.json(
        { error: "deliberationId query parameter required" },
        { status: 400, ...NO_STORE }
      );
    }

    // Verify argument exists and belongs to deliberation
    const argument = await prisma.argument.findUnique({
      where: { id: argumentId },
      select: { id: true, deliberationId: true },
    });

    if (!argument) {
      return NextResponse.json(
        { error: "Argument not found" },
        { status: 404, ...NO_STORE }
      );
    }

    if (argument.deliberationId !== deliberationId) {
      return NextResponse.json(
        { error: "Argument does not belong to specified deliberation" },
        { status: 400, ...NO_STORE }
      );
    }

    // Real defeat computation (Phase 2.1): build the deliberation theory with
    // stored preferences and extract defeats involving this argument.
    const { defeatsBy, defeatedBy } = await getArgumentDefeats(deliberationId, argumentId);

    // Accurate preference counts straight from PA rows (cheap, no theory needed).
    const [preferred, dispreferred] = await Promise.all([
      prisma.preferenceApplication.count({ where: { deliberationId, preferredArgumentId: argumentId } }),
      prisma.preferenceApplication.count({ where: { deliberationId, dispreferredArgumentId: argumentId } }),
    ]);

    return NextResponse.json(
      {
        ok: true,
        argumentId,
        deliberationId,
        defeatsBy,   // arguments THIS argument defeats
        defeatedBy,  // arguments that defeat THIS argument
        preferenceStats: { preferred, dispreferred },
      },
      NO_STORE
    );
  } catch (error) {
    console.error("Error fetching argument defeats:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch argument defeats",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500, ...NO_STORE }
    );
  }
}
