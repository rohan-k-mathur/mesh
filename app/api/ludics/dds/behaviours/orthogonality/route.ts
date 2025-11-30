/**
 * DDS Phase 5: Orthogonality Checking API
 * POST /api/ludics/dds/behaviours/orthogonality
 * 
 * Checks if two designs are orthogonal (D ⊥ E).
 * Based on Definition 4.3 from Faggian & Hyland (2002):
 * Two designs are orthogonal if their interaction converges.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import {
  checkOrthogonality,
  findCounterDesigns,
  verifyOrthogonality,
} from "@/packages/ludics-core/dds/behaviours";
import type { Action, Dispute } from "@/packages/ludics-core/dds/types";

export async function POST(req: NextRequest) {
  try {
    const { designIdA, designIdB, mode = "check" } = await req.json();

    if (mode === "check") {
      // Check orthogonality between two specific designs
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

      // Fetch any existing disputes between these designs
      const disputes = await prisma.ludicDispute.findMany({
        where: {
          OR: [
            { posDesignId: designIdA, negDesignId: designIdB },
            { posDesignId: designIdB, negDesignId: designIdA },
          ],
        },
      });

      // Convert acts to actions
      const actionsA: Action[] = designA.acts.map((act) => ({
        focus: act.locusPath,
        ramification: (act.subLoci as string[]) || [],
        polarity: (act.polarity as "P" | "O") || "P",
        actId: act.id,
        expression: act.expression || undefined,
        ts: act.createdAt.getTime(),
      }));

      const actionsB: Action[] = designB.acts.map((act) => ({
        focus: act.locusPath,
        ramification: (act.subLoci as string[]) || [],
        polarity: (act.polarity as "P" | "O") || "O",
        actId: act.id,
        expression: act.expression || undefined,
        ts: act.createdAt.getTime(),
      }));

      // Convert disputes
      const disputeData: Dispute[] = disputes.map((d) => ({
        id: d.id,
        dialogueId: d.deliberationId,
        posDesignId: d.posDesignId,
        negDesignId: d.negDesignId,
        pairs: (d.actionPairs as any) || [],
        status: d.status as "ONGOING" | "CONVERGENT" | "DIVERGENT" | "STUCK",
        length: d.length,
      }));

      // Check orthogonality
      const result = checkOrthogonality(actionsA, actionsB, disputeData);

      // Store result in LudicBehaviour if converged
      if (result.converges) {
        await prisma.ludicBehaviour.upsert({
          where: {
            deliberationId_name: {
              deliberationId: designA.deliberationId,
              name: `orth:${designIdA}:${designIdB}`,
            },
          },
          update: {
            designIds: [designIdA, designIdB],
            isClosed: result.converges,
            updatedAt: new Date(),
          },
          create: {
            deliberationId: designA.deliberationId,
            name: `orth:${designIdA}:${designIdB}`,
            designIds: [designIdA, designIdB],
            isClosed: result.converges,
          },
        });
      }

      return NextResponse.json({
        ok: true,
        isOrthogonal: result.converges,
        convergenceLength: result.convergenceLength,
        witnessingDispute: result.witnessingDispute,
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
      });
    } else if (mode === "verify") {
      // Verify orthogonality property with witnesses
      if (!designIdA || !designIdB) {
        return NextResponse.json(
          { ok: false, error: "designIdA and designIdB are required for verify mode" },
          { status: 400 }
        );
      }

      const result = verifyOrthogonality([designIdA], [designIdB]);

      return NextResponse.json({
        ok: true,
        allOrthogonal: result.allOrthogonal,
        pairs: result.pairs,
        summary: {
          totalPairs: result.pairs.length,
          orthogonalCount: result.pairs.filter((p) => p.orthogonal).length,
        },
      });
    } else if (mode === "counter") {
      // Find counter-designs (non-orthogonal designs)
      if (!designIdA) {
        return NextResponse.json(
          { ok: false, error: "designIdA is required for counter mode" },
          { status: 400 }
        );
      }

      // Fetch the design
      const design = await prisma.ludicDesign.findUnique({
        where: { id: designIdA },
        include: { acts: true },
      });

      if (!design) {
        return NextResponse.json(
          { ok: false, error: "Design not found" },
          { status: 404 }
        );
      }

      // Fetch all designs in same deliberation
      const allDesigns = await prisma.ludicDesign.findMany({
        where: {
          deliberationId: design.deliberationId,
          id: { not: designIdA },
        },
        include: { acts: true },
      });

      const actions: Action[] = design.acts.map((act) => ({
        focus: act.locusPath,
        ramification: (act.subLoci as string[]) || [],
        polarity: (act.polarity as "P" | "O") || "P",
        actId: act.id,
      }));

      // Find counter-designs
      const candidateActions = allDesigns.map((d) =>
        d.acts.map((act) => ({
          focus: act.locusPath,
          ramification: (act.subLoci as string[]) || [],
          polarity: (act.polarity as "P" | "O") || "O",
          actId: act.id,
        }))
      );

      const counterResult = findCounterDesigns(actions, candidateActions);

      return NextResponse.json({
        ok: true,
        counterDesigns: counterResult.counterDesigns,
        hasCounterDesigns: counterResult.counterDesigns.length > 0,
        candidatesChecked: candidateActions.length,
      });
    }

    return NextResponse.json(
      { ok: false, error: "Invalid mode. Use: check, verify, or counter" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[DDS Orthogonality Check Error]", error);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const designIdA = url.searchParams.get("designIdA");
    const designIdB = url.searchParams.get("designIdB");

    if (!designIdA) {
      return NextResponse.json(
        { ok: false, error: "designIdA query param required" },
        { status: 400 }
      );
    }

    // Fetch orthogonality records for this design
    const behaviours = await prisma.ludicBehaviour.findMany({
      where: {
        name: { startsWith: `orth:${designIdA}` },
      },
    });

    if (designIdB) {
      // Return specific orthogonality check
      const specific = behaviours.find(
        (b) =>
          b.name === `orth:${designIdA}:${designIdB}` ||
          b.name === `orth:${designIdB}:${designIdA}`
      );

      return NextResponse.json({
        ok: true,
        hasResult: !!specific,
        isOrthogonal: specific?.isClosed ?? null,
        behaviour: specific,
      });
    }

    // Return all orthogonality results for this design
    return NextResponse.json({
      ok: true,
      designId: designIdA,
      orthogonalPairs: behaviours.map((b) => ({
        name: b.name,
        designIds: b.designIds,
        isOrthogonal: b.isClosed,
      })),
      totalPairs: behaviours.length,
    });
  } catch (error: any) {
    console.error("[DDS Orthogonality GET Error]", error);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}
