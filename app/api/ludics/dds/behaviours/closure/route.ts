/**
 * DDS Phase 5: Biorthogonal Closure API
 * POST /api/ludics/dds/behaviours/closure
 * 
 * Computes the biorthogonal closure of a set of designs (D⊥⊥).
 * Based on Section 4.2 from Faggian & Hyland (2002).
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import {
  biorthogonalClosure,
  isClosed,
  closureIterate,
} from "@/packages/ludics-core/dds/behaviours";
import type { Action } from "@/packages/ludics-core/dds/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const maxIterations = body.maxIterations || 10;
    const mode = body.mode || "closure";
    
    // Support both designIds and strategyIds
    let designIds = body.designIds;
    
    // If strategyIds provided, look up the associated designIds
    if (body.strategyIds && Array.isArray(body.strategyIds) && body.strategyIds.length > 0) {
      const strategies = await prisma.ludicStrategy.findMany({
        where: { id: { in: body.strategyIds } },
        select: { id: true, designId: true },
      });
      designIds = strategies.map(s => s.designId);
    }

    if (!designIds || !Array.isArray(designIds) || designIds.length === 0) {
      return NextResponse.json(
        { ok: false, error: "designIds or strategyIds array is required" },
        { status: 400 }
      );
    }

    // Fetch all designs
    const designs = await prisma.ludicDesign.findMany({
      where: { id: { in: designIds } },
      include: { acts: true },
    });

    if (designs.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No designs found" },
        { status: 404 }
      );
    }

    // Convert to actions
    const designActions: Action[][] = designs.map((d) =>
      d.acts.map((act) => ({
        focus: act.locusPath,
        ramification: (act.subLoci as string[]) || [],
        polarity: (act.polarity as "P" | "O") || "P",
        actId: act.id,
        expression: act.expression || undefined,
      }))
    );

    // Fetch potential counter-designs from same deliberation
    const deliberationIds = [...new Set(designs.map((d) => d.deliberationId))];
    const potentialCounters = await prisma.ludicDesign.findMany({
      where: {
        deliberationId: { in: deliberationIds },
        id: { notIn: designIds },
      },
      include: { acts: true },
    });

    const counterActions: Action[][] = potentialCounters.map((d) =>
      d.acts.map((act) => ({
        focus: act.locusPath,
        ramification: (act.subLoci as string[]) || [],
        polarity: (act.polarity as "P" | "O") || "O",
        actId: act.id,
      }))
    );

    if (mode === "check") {
      // Check if current set is already closed
      const closedResult = isClosed(designActions, counterActions);

      return NextResponse.json({
        ok: true,
        isClosed: closedResult.isClosed,
        reason: closedResult.reason,
        designIds,
        designCount: designs.length,
      });
    } else if (mode === "iterate") {
      // Perform single closure iteration
      const iterateResult = closureIterate(designActions, counterActions);

      return NextResponse.json({
        ok: true,
        originalCount: iterateResult.original.length,
        closedCount: iterateResult.closed.length,
        newDesignsAdded: iterateResult.closed.length - iterateResult.original.length,
        iteration: 1,
      });
    } else {
      // Full biorthogonal closure
      const closureResult = biorthogonalClosure(
        designActions,
        counterActions,
        maxIterations
      );

      // Store the behaviour record for the closed set
      if (designs.length > 0) {
        const behaviourName = `closure:${designIds.slice(0, 3).join(":")}${designIds.length > 3 ? `:+${designIds.length - 3}` : ""}`;

        await prisma.ludicBehaviour.upsert({
          where: {
            deliberationId_name: {
              deliberationId: designs[0].deliberationId,
              name: behaviourName,
            },
          },
          update: {
            designIds: closureResult.closedDesignIds || designIds,
            isClosed: closureResult.isClosed,
            closureIterations: closureResult.iterations,
            updatedAt: new Date(),
          },
          create: {
            deliberationId: designs[0].deliberationId,
            name: behaviourName,
            designIds: closureResult.closedDesignIds || designIds,
            isClosed: closureResult.isClosed,
            closureIterations: closureResult.iterations,
          },
        });
      }

      return NextResponse.json({
        ok: true,
        isClosed: closureResult.isClosed,
        iterations: closureResult.iterations,
        originalCount: closureResult.originalCount,
        closedCount: closureResult.closedCount,
        closedDesignIds: closureResult.closedDesignIds,
        converged: closureResult.converged,
      });
    }
  } catch (error: any) {
    console.error("[DDS Closure Error]", error);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const deliberationId = url.searchParams.get("deliberationId");
    const behaviourId = url.searchParams.get("behaviourId");

    if (behaviourId) {
      // Get specific behaviour
      const behaviour = await prisma.ludicBehaviour.findUnique({
        where: { id: behaviourId },
      });

      if (!behaviour) {
        return NextResponse.json(
          { ok: false, error: "Behaviour not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        ok: true,
        behaviour: {
          id: behaviour.id,
          name: behaviour.name,
          designIds: behaviour.designIds,
          isClosed: behaviour.isClosed,
          closureIterations: behaviour.closureIterations,
          createdAt: behaviour.createdAt,
          updatedAt: behaviour.updatedAt,
        },
      });
    }

    if (!deliberationId) {
      return NextResponse.json(
        { ok: false, error: "deliberationId or behaviourId required" },
        { status: 400 }
      );
    }

    // Get all behaviours for deliberation
    const behaviours = await prisma.ludicBehaviour.findMany({
      where: {
        deliberationId,
        name: { startsWith: "closure:" },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      ok: true,
      deliberationId,
      behaviours: behaviours.map((b) => ({
        id: b.id,
        name: b.name,
        designCount: (b.designIds as string[]).length,
        isClosed: b.isClosed,
        iterations: b.closureIterations,
        createdAt: b.createdAt,
      })),
      totalBehaviours: behaviours.length,
    });
  } catch (error: any) {
    console.error("[DDS Closure GET Error]", error);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}
