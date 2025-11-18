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
import { computeAspicSemantics, aifToASPIC } from "@/lib/aif/translation/aifToAspic";
import { populateKBPreferencesFromAIF } from "@/lib/aspic/translation/aifToASPIC";
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
      select: { id: true, deliberationId: true, conclusion: true },
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

    // For a complete implementation, we would:
    // 1. Build the full AIF graph for the deliberation
    // 2. Translate to ASPIC+ with preferences
    // 3. Compute defeats
    // 4. Filter defeats involving this argument
    
    // For now, return a simple response that can be enhanced
    // when we have the full deliberation theory building in place
    
    // Fetch preferences to show if any apply to this argument
    const { premisePreferences, rulePreferences } = await populateKBPreferencesFromAIF(deliberationId);
    
    // Count preferences involving this argument (simplified)
    const argWithConclusion = await prisma.argument.findUnique({
      where: { id: argumentId },
      select: {
        schemeId: true,
        conclusion: {
          select: { text: true },
        },
      },
    });

    const conclusionText = argWithConclusion?.conclusion?.text;
    const schemeId = argWithConclusion?.schemeId;

    const relatedPrefs = [
      ...premisePreferences.filter(
        p => p.preferred === conclusionText || p.dispreferred === conclusionText
      ),
      ...rulePreferences.filter(
        p => p.preferred === schemeId || p.dispreferred === schemeId
      ),
    ];

    return NextResponse.json(
      {
        ok: true,
        argumentId,
        deliberationId,
        // Placeholder: Full defeat computation requires complete theory
        defeatsOn: [],
        defeatsBy: [],
        relatedPreferences: relatedPrefs.length,
        preferences: relatedPrefs,
        note: "Full defeat computation requires building complete ASPIC+ theory. Use GET /api/aspic/evaluate for complete semantics.",
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
