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

    // Format response
    const schemes = instances.map((instance) => ({
      schemeId: instance.scheme.id,
      schemeKey: instance.scheme.key,
      schemeName: instance.scheme.name || instance.scheme.key,
      schemeSummary: instance.scheme.summary,
      premises: instance.scheme.premises,
      conclusion: instance.scheme.conclusion,
      confidence: instance.confidence,
      isPrimary: instance.isPrimary
    }));

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
