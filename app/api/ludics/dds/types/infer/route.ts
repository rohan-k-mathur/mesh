/**
 * DDS Phase 5: Type Inference API
 * POST /api/ludics/dds/types/infer
 * 
 * Infers the Ludics type of a design based on its structure.
 * Types in Ludics are behaviours, representing interaction capabilities.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import {
  inferTypeStructural,
  inferTypeBehavioural,
  inferDesignType,
  unifyTypes,
} from "@/packages/ludics-core/dds/types/inference";
import type { DesignForCorrespondence } from "@/packages/ludics-core/dds/correspondence/types";

/**
 * Helper to convert Prisma design to DesignForCorrespondence format
 */
function toDesignForCorr(design: {
  id: string;
  deliberationId: string;
  participantId: string;
  acts: Array<{
    id: string;
    designId: string;
    locusPath: string;
    polarity: string;
    subLoci: unknown;
    kind: string;
    expression: string | null;
    orderInDesign: number;
  }>;
}): DesignForCorrespondence {
  return {
    id: design.id,
    deliberationId: design.deliberationId,
    participantId: design.participantId,
    acts: design.acts.map((act) => ({
      id: act.id,
      designId: act.designId,
      locusPath: act.locusPath,
      polarity: act.polarity as "P" | "O",
      ramification: (act.subLoci as (string | number)[]) || [],
      kind: act.kind as "PROPER" | "DAIMON",
      expression: act.expression || undefined,
      orderInDesign: act.orderInDesign,
    })),
  };
}

export async function POST(req: NextRequest) {
  try {
    const { designId, mode = "infer", compareDesignId } = await req.json();

    if (!designId) {
      return NextResponse.json(
        { ok: false, error: "designId is required" },
        { status: 400 }
      );
    }

    // Fetch design
    const design = await prisma.ludicDesign.findUnique({
      where: { id: designId },
      include: { acts: true },
    });

    if (!design) {
      return NextResponse.json(
        { ok: false, error: "Design not found" },
        { status: 404 }
      );
    }

    const designForCorr = toDesignForCorr(design);

    if (mode === "structural") {
      // Structural type inference based on design shape
      const typeStructure = inferTypeStructural(designForCorr);

      return NextResponse.json({
        ok: true,
        designId,
        mode: "structural",
        type: typeStructure,
        confidence: 0.75,
        details: { method: "structural", actCount: design.acts.length },
      });
    } else if (mode === "behavioral") {
      // Behavioral type inference based on interaction patterns
      const allDesigns = await prisma.ludicDesign.findMany({
        where: { deliberationId: design.deliberationId },
        include: { acts: true },
      });

      const allDesignsForCorr = allDesigns.map(toDesignForCorr);
      const typeStructure = await inferTypeBehavioural(designForCorr, allDesignsForCorr);

      return NextResponse.json({
        ok: true,
        designId,
        mode: "behavioral",
        type: typeStructure,
        confidence: 0.8,
        details: { method: "behavioral", designCount: allDesigns.length },
      });
    } else if (mode === "compare" && compareDesignId) {
      // Compare types of two designs
      const compareDesign = await prisma.ludicDesign.findUnique({
        where: { id: compareDesignId },
        include: { acts: true },
      });

      if (!compareDesign) {
        return NextResponse.json(
          { ok: false, error: "Compare design not found" },
          { status: 404 }
        );
      }

      const compareDesignForCorr = toDesignForCorr(compareDesign);
      const typeA = inferTypeStructural(designForCorr);
      const typeB = inferTypeStructural(compareDesignForCorr);
      const unification = unifyTypes(typeA, typeB);

      return NextResponse.json({
        ok: true,
        designA: {
          id: designId,
          type: typeA,
          confidence: 0.75,
        },
        designB: {
          id: compareDesignId,
          type: typeB,
          confidence: 0.75,
        },
        typeEquivalence: {
          areEquivalent: unification !== null,
          substitution: unification ? Object.fromEntries(unification) : null,
        },
      });
    } else {
      // Default: full type inference using both methods
      const allDesigns = await prisma.ludicDesign.findMany({
        where: { deliberationId: design.deliberationId },
        include: { acts: true },
      });

      const allDesignsForCorr = allDesigns.map(toDesignForCorr);
      const result = await inferDesignType(designForCorr, allDesignsForCorr);

      return NextResponse.json({
        ok: true,
        designId,
        mode: "infer",
        type: result.inferredType,
        confidence: result.confidence,
        method: result.method,
        alternatives: result.alternatives,
        inferenceDetails: {
          designCount: allDesigns.length,
        },
      });
    }
  } catch (error: any) {
    console.error("[DDS Type Inference Error]", error);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const designId = url.searchParams.get("designId");
    const deliberationId = url.searchParams.get("deliberationId");

    if (designId) {
      // Get type for specific design
      const design = await prisma.ludicDesign.findUnique({
        where: { id: designId },
        include: { acts: true },
      });

      if (!design) {
        return NextResponse.json(
          { ok: false, error: "Design not found" },
          { status: 404 }
        );
      }

      // Fetch all designs for behavioral inference
      const allDesigns = await prisma.ludicDesign.findMany({
        where: { deliberationId: design.deliberationId },
        include: { acts: true },
      });

      const designForCorr = toDesignForCorr(design);
      const allDesignsForCorr = allDesigns.map(toDesignForCorr);
      const result = await inferDesignType(designForCorr, allDesignsForCorr);

      return NextResponse.json({
        ok: true,
        designId,
        type: result.inferredType,
        confidence: result.confidence,
        method: result.method,
        details: {
          alternatives: result.alternatives,
          designCount: allDesigns.length,
        },
      });
    }

    if (deliberationId) {
      // Get types for all designs in deliberation
      const designs = await prisma.ludicDesign.findMany({
        where: { deliberationId },
        include: { acts: true },
      });

      const allDesignsForCorr = designs.map(toDesignForCorr);

      const typesPromises = allDesignsForCorr.map(async (d) => {
        const result = await inferDesignType(d, allDesignsForCorr);
        return {
          designId: d.id,
          type: result.inferredType,
          confidence: result.confidence,
          method: result.method,
        };
      });

      const types = await Promise.all(typesPromises);

      // Group by type equivalence
      const typeGroups: Record<string, string[]> = {};
      for (const t of types) {
        const typeKey = JSON.stringify(t.type);
        if (!typeGroups[typeKey]) {
          typeGroups[typeKey] = [];
        }
        typeGroups[typeKey].push(t.designId);
      }

      return NextResponse.json({
        ok: true,
        deliberationId,
        designs: types,
        typeGroups: Object.entries(typeGroups).map(([typeKey, designIds]) => ({
          type: JSON.parse(typeKey),
          designIds,
          count: designIds.length,
        })),
        totalDesigns: designs.length,
        uniqueTypes: Object.keys(typeGroups).length,
      });
    }

    return NextResponse.json(
      { ok: false, error: "designId or deliberationId required" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[DDS Type Inference GET Error]", error);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}
