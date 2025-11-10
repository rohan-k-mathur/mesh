/**
 * Attack Suggestion API
 * 
 * POST /api/arguments/suggest-attacks
 * Generates strategic attack suggestions for a target argument based on
 * critical question analysis.
 * 
 * Phase 3.1: Backend Services
 */

import { NextRequest, NextResponse } from "next/server";
import { argumentGenerationService } from "@/app/server/services/ArgumentGenerationService";

export async function POST(request: NextRequest) {
  try {
    // 1. Parse request body
    const body = await request.json();
    const {
      targetClaimId,
      targetArgumentId,
      userId,
      context,
    } = body;

    if (!targetClaimId) {
      return NextResponse.json(
        { error: "targetClaimId is required" },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // 2. Generate suggestions
    const suggestions = await argumentGenerationService.suggestAttacks({
      targetClaimId,
      targetArgumentId,
      userId,
      context,
    });

    // 4. Return suggestions
    return NextResponse.json({ suggestions }, { status: 200 });
  } catch (error: any) {
    console.error("Error generating attack suggestions:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate attack suggestions" },
      { status: 500 }
    );
  }
}
