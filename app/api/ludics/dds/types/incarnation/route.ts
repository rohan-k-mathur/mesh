/**
 * DDS Phase 5: Incarnation Checking API
 * POST /api/ludics/dds/types/incarnation
 * 
 * Checks if a design is incarnated in another design (D ⊂ E).
 * Based on Definition 4.12 from Faggian & Hyland (2002):
 * D is incarnated in E if D is less defined than E.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import {
  checkIncarnation,
  laxIncarnation,
  sharpIncarnation,
} from "@/packages/ludics-core/dds/types/incarnation";
import type { Action } from "@/packages/ludics-core/dds/types";

export async function POST(req: NextRequest) {
  try {
    const { designIdA, designIdB, mode = "check" } = await req.json();

    if (!designIdA || !designIdB) {
      return NextResponse.json(
        { ok: false, error: "designIdA and designIdB are required" },
        { status: 400 }
      );
    }

    // Fetch designs
    const [designA, designB] = await Promise.all([
      prisma.ludicDesign.findUnique({
        where: { id: designIdA },
        include: { acts: true },
      }),
      prisma.ludicDesign.findUnique({
        where: { id: designIdB },
        include: { acts: true },
      }),
    ]);

    if (!designA || !designB) {
      return NextResponse.json(
        { ok: false, error: "One or both designs not found" },
        { status: 404 }
      );
    }

    // Convert to actions
    const actionsA: Action[] = designA.acts.map((act) => ({
      focus: act.locusPath,
      ramification: (act.subLoci as string[]) || [],
      polarity: (act.polarity as "P" | "O") || "P",
      actId: act.id,
      expression: act.expression || undefined,
    }));

    const actionsB: Action[] = designB.acts.map((act) => ({
      focus: act.locusPath,
      ramification: (act.subLoci as string[]) || [],
      polarity: (act.polarity as "P" | "O") || "P",
      actId: act.id,
      expression: act.expression || undefined,
    }));

    let result: any;

    if (mode === "lax") {
      // Lax incarnation check (allows partial overlap)
      result = laxIncarnation(actionsA, actionsB);
    } else if (mode === "sharp") {
      // Sharp incarnation check (strict subset)
      result = sharpIncarnation(actionsA, actionsB);
    } else {
      // Standard incarnation check
      result = checkIncarnation(actionsA, actionsB);
    }

    return NextResponse.json({
      ok: true,
      isIncarnated: result.isIncarnated,
      mode,
      direction: `${designIdA} ⊂ ${designIdB}`,
      details: {
        designA: {
          id: designIdA,
          actCount: actionsA.length,
        },
        designB: {
          id: designIdB,
          actCount: actionsB.length,
        },
      },
      incarnationDetails: result.details || null,
    });
  } catch (error: any) {
    console.error("[DDS Incarnation Check Error]", error);
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

    if (!designId) {
      return NextResponse.json(
        { ok: false, error: "designId query param required" },
        { status: 400 }
      );
    }

    // Fetch the design and its deliberation context
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

    // Fetch related designs from same deliberation
    const relatedDesigns = await prisma.ludicDesign.findMany({
      where: {
        deliberationId: design.deliberationId,
        id: { not: designId },
      },
      include: { acts: true },
    });

    // Convert target design to actions
    const targetActions: Action[] = design.acts.map((act) => ({
      focus: act.locusPath,
      ramification: (act.subLoci as string[]) || [],
      polarity: (act.polarity as "P" | "O") || "P",
      actId: act.id,
    }));

    // Check incarnation relationships
    const incarnatedIn: string[] = [];
    const incarnates: string[] = [];

    for (const related of relatedDesigns) {
      const relatedActions: Action[] = related.acts.map((act) => ({
        focus: act.locusPath,
        ramification: (act.subLoci as string[]) || [],
        polarity: (act.polarity as "P" | "O") || "P",
        actId: act.id,
      }));

      // Check if target is incarnated in related
      const forwardResult = checkIncarnation(targetActions, relatedActions);
      if (forwardResult.isIncarnated) {
        incarnatedIn.push(related.id);
      }

      // Check if related is incarnated in target
      const reverseResult = checkIncarnation(relatedActions, targetActions);
      if (reverseResult.isIncarnated) {
        incarnates.push(related.id);
      }
    }

    return NextResponse.json({
      ok: true,
      designId,
      incarnationRelationships: {
        incarnatedIn, // Designs that this design is incarnated in (D ⊂ E)
        incarnates,   // Designs incarnated in this design (E ⊂ D)
      },
      summary: {
        incarnatedInCount: incarnatedIn.length,
        incarnatesCount: incarnates.length,
        totalRelated: relatedDesigns.length,
      },
    });
  } catch (error: any) {
    console.error("[DDS Incarnation GET Error]", error);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}
