// app/api/arguments/[id]/schemes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";

export async function GET(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const argumentId = params.id;

    // Fetch all scheme instances for this argument
    const instances = await prisma.argumentSchemeInstance.findMany({
      where: { argumentId },
      include: {
        scheme: {
          select: {
            id: true,
            key: true,
            name: true,
            summary: true,
            premises: true,
            conclusion: true
          }
        }
      },
      orderBy: [
        { isPrimary: "desc" },
        { confidence: "desc" }
      ]
    });

        // If no instances found, check legacy schemeId field on Argument
    let schemes = instances.map((instance: any) => ({
      schemeId: instance.scheme.id,
      schemeKey: instance.scheme.key,
      schemeName: instance.scheme.name || instance.scheme.key,
      schemeSummary: instance.scheme.summary,
      premises: instance.scheme.premises,
      conclusion: instance.scheme.conclusion,
      confidence: instance.confidence,
      isPrimary: instance.isPrimary
    }));

    // Fallback: Check for legacy schemeId field if no instances found
    if (schemes.length === 0) {
      const argument = await prisma.argument.findUnique({
        where: { id: argumentId },
        select: {
          schemeId: true,
          scheme: {
            select: {
              id: true,
              key: true,
              name: true,
              summary: true,
              premises: true,
              conclusion: true
            }
          }
        }
      });

      if (argument?.scheme) {
        schemes = [{
          schemeId: argument.scheme.id,
          schemeKey: argument.scheme.key,
          schemeName: argument.scheme.name || argument.scheme.key,
          schemeSummary: argument.scheme.summary,
          premises: argument.scheme.premises,
          conclusion: argument.scheme.conclusion,
          confidence: 1.0, // Default to 100% for legacy
          isPrimary: true
        }];
      }
    }

    return NextResponse.json(
      {
        argumentId,
        schemes,
        totalCQs: 0 // TODO: Calculate from merged CQs
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error(`[GET /api/arguments/${params.id}/schemes] Error:`, error);
    return NextResponse.json(
      { error: "Failed to fetch schemes" },
      { status: 500 }
    );
  }
}
