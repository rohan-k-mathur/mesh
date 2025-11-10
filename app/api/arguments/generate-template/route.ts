/**
 * Template Generation API
 * 
 * POST /api/arguments/generate-template
 * Creates structured argument templates with guidance and prefilled data.
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
      attackType,
      targetCQ,
      prefilledData,
    } = body;

    if (!schemeId || !claimId) {
      return NextResponse.json(
        { error: "schemeId and claimId are required" },
        { status: 400 }
      );
    }

    const template = await argumentGenerationService.generateTemplate({
      schemeId,
      claimId,
      attackType,
      targetCQ,
      prefilledData,
    });

    return NextResponse.json({ template }, { status: 200 });
  } catch (error: any) {
    console.error("Error generating template:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate template" },
      { status: 500 }
    );
  }
}
