/**
 * Argument Scoring API
 * 
 * POST /api/arguments/score
 * Scores partially constructed arguments and provides improvement suggestions.
 * 
 * Phase 3.1: Backend Services
 */

import { NextRequest, NextResponse } from "next/server";
import { argumentGenerationService } from "@/app/server/services/ArgumentGenerationService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      schemeId,
      claimId,
      filledPremises,
    } = body;

    if (!schemeId || !claimId || !filledPremises) {
      return NextResponse.json(
        { error: "schemeId, claimId, and filledPremises are required" },
        { status: 400 }
      );
    }

    const score = await argumentGenerationService.scoreArgument({
      schemeId,
      claimId,
      filledPremises,
    });

    return NextResponse.json({ score }, { status: 200 });
  } catch (error: any) {
    console.error("Error scoring argument:", error);
    return NextResponse.json(
      { error: error.message || "Failed to score argument" },
      { status: 500 }
    );
  }
}
