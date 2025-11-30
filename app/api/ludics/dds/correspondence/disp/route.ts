/**
 * Disp(D) API Endpoint
 * 
 * Compute all disputes of design D with orthogonal counter-designs
 */

import { NextRequest, NextResponse } from "next/server";
import { computeDisp } from "@/packages/ludics-core/dds/correspondence";
import type { DesignForCorrespondence } from "@/packages/ludics-core/dds/correspondence";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { design, counterDesigns } = body as {
      design: DesignForCorrespondence;
      counterDesigns: DesignForCorrespondence[];
    };

    if (!design) {
      return NextResponse.json(
        { ok: false, error: "design is required" },
        { status: 400 }
      );
    }

    if (!counterDesigns || !Array.isArray(counterDesigns)) {
      return NextResponse.json(
        { ok: false, error: "counterDesigns array is required" },
        { status: 400 }
      );
    }

    // Compute Disp(D)
    const result = computeDisp(design, counterDesigns);

    return NextResponse.json({
      ok: true,
      designId: result.designId,
      disputes: result.disputes,
      count: result.count,
      computedAt: result.computedAt,
    });
  } catch (error: any) {
    console.error("Error computing Disp(D):", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to compute disputes" },
      { status: 500 }
    );
  }
}
