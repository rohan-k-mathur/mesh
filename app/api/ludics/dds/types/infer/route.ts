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
  inferType,
  structuralInference,
  behavioralInference,
} from "@/packages/ludics-core/dds/types/inference";
import { createType, equivalentTypes } from "@/packages/ludics-core/dds/types/operations";
import type { Action } from "@/packages/ludics-core/dds/types";

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

    // Convert to actions
    const actions: Action[] = design.acts.map((act) => ({
      focus: act.locusPath,
      ramification: (act.subLoci as string[]) || [],
      polarity: (act.polarity as "P" | "O") || "P",
      actId: act.id,
      expression: act.expression || undefined,
    }));

    if (mode === "structural") {
      // Structural type inference based on design shape
      const result = structuralInference(actions);

      return NextResponse.json({
        ok: true,
        designId,
        mode: "structural",
        type: result.type,
        confidence: result.confidence,
        details: result.details,
      });
    } else if (mode === "behavioral") {
      // Behavioral type inference based on interaction patterns
      const behaviours = await prisma.ludicBehaviour.findMany({
        where: {
          deliberationId: design.deliberationId,
          designIds: { has: designId },
        },
      });

      const behaviourData = behaviours.map((b) => ({
        id: b.id,
        designIds: b.designIds as string[],
        isClosed: b.isClosed,
      }));

      const result = behavioralInference(actions, behaviourData);

      return NextResponse.json({
        ok: true,
        designId,
        mode: "behavioral",
        type: result.type,
        confidence: result.confidence,
        behaviourCount: behaviours.length,
        details: result.details,
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

      const compareActions: Action[] = compareDesign.acts.map((act) => ({
        focus: act.locusPath,
        ramification: (act.subLoci as string[]) || [],
        polarity: (act.polarity as "P" | "O") || "P",
        actId: act.id,
      }));

      const typeA = inferType(actions);
      const typeB = inferType(compareActions);
      const equiv = equivalentTypes(typeA.type, typeB.type);

      return NextResponse.json({
        ok: true,
        designA: {
          id: designId,
          type: typeA.type,
          confidence: typeA.confidence,
        },
        designB: {
          id: compareDesignId,
          type: typeB.type,
          confidence: typeB.confidence,
        },
        typeEquivalence: {
          areEquivalent: equiv.equivalent,
          reason: equiv.reason,
        },
      });
    } else {
      // Default: full type inference
      const result = inferType(actions);

      // Create and store type
      const ludicsType = createType(result.type);

      return NextResponse.json({
        ok: true,
        designId,
        mode: "infer",
        type: ludicsType,
        confidence: result.confidence,
        inferenceDetails: result.details,
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

      const actions: Action[] = design.acts.map((act) => ({
        focus: act.locusPath,
        ramification: (act.subLoci as string[]) || [],
        polarity: (act.polarity as "P" | "O") || "P",
        actId: act.id,
      }));

      const result = inferType(actions);

      return NextResponse.json({
        ok: true,
        designId,
        type: result.type,
        confidence: result.confidence,
        details: result.details,
      });
    }

    if (deliberationId) {
      // Get types for all designs in deliberation
      const designs = await prisma.ludicDesign.findMany({
        where: { deliberationId },
        include: { acts: true },
      });

      const types = designs.map((d) => {
        const actions: Action[] = d.acts.map((act) => ({
          focus: act.locusPath,
          ramification: (act.subLoci as string[]) || [],
          polarity: (act.polarity as "P" | "O") || "P",
          actId: act.id,
        }));

        const result = inferType(actions);
        return {
          designId: d.id,
          type: result.type,
          confidence: result.confidence,
        };
      });

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
