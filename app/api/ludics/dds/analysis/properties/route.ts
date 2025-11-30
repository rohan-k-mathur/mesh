/**
 * DDS Phase 5: Property Analysis API
 * POST /api/ludics/dds/analysis/properties
 * 
 * Comprehensive property analysis for designs, strategies, and games.
 * Validates theoretical properties from Faggian & Hyland (2002).
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import {
  analyzeDesignProperties,
  analyzeStrategyProperties,
  analyzeGameProperties,
  analyzeComplexity,
  batchAnalyzeDesigns,
} from "@/packages/ludics-core/dds/analysis";
import { constructStrategy } from "@/packages/ludics-core/dds/strategy";
import type { Action, Dispute } from "@/packages/ludics-core/dds/types";

export async function POST(req: NextRequest) {
  try {
    const {
      designId,
      designIds,
      strategyId,
      type = "design", // design, strategy, game, batch
    } = await req.json();

    if (type === "batch" && designIds?.length > 0) {
      // Batch analysis of multiple designs
      const designs = await prisma.ludicDesign.findMany({
        where: { id: { in: designIds } },
        include: { acts: true },
      });

      const designActions = designs.map((d) => ({
        id: d.id,
        actions: d.acts.map((act) => ({
          focus: act.locusPath,
          ramification: (act.subLoci as string[]) || [],
          polarity: (act.polarity as "P" | "O") || "P",
          actId: act.id,
        })),
      }));

      const results = batchAnalyzeDesigns(designActions);

      return NextResponse.json({
        ok: true,
        type: "batch",
        results: results.map((r) => ({
          designId: r.designId,
          properties: r.properties,
          valid: r.valid,
        })),
        summary: {
          total: results.length,
          validCount: results.filter((r) => r.valid).length,
        },
      });
    }

    if (type === "design") {
      if (!designId) {
        return NextResponse.json(
          { ok: false, error: "designId is required for design analysis" },
          { status: 400 }
        );
      }

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
        expression: act.expression || undefined,
      }));

      const properties = analyzeDesignProperties(actions);
      const complexity = analyzeComplexity(actions, [], []);

      return NextResponse.json({
        ok: true,
        type: "design",
        designId,
        properties,
        complexity,
        actCount: actions.length,
      });
    }

    if (type === "strategy") {
      if (!strategyId && !designId) {
        return NextResponse.json(
          { ok: false, error: "strategyId or designId required for strategy analysis" },
          { status: 400 }
        );
      }

      let strategy: any;

      if (strategyId) {
        const strategyRecord = await prisma.ludicStrategy.findUnique({
          where: { id: strategyId },
          include: {
            design: { include: { acts: true } },
            plays: true,
          },
        });

        if (!strategyRecord) {
          return NextResponse.json(
            { ok: false, error: "Strategy not found" },
            { status: 404 }
          );
        }

        const player = strategyRecord.player as "P" | "O";
        strategy = {
          id: strategyRecord.id,
          designId: strategyRecord.designId,
          player,
          plays: strategyRecord.plays.map((p) => ({
            id: p.id,
            strategyId: p.strategyId,
            sequence: (p.actions as any) || [],
            length: (p.actions as any[])?.length || 0,
            isPositive: true,
          })),
          isInnocent: strategyRecord.isInnocent,
        };
      } else {
        // Construct from design
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

        const player = design.participantId === "Proponent" ? "P" : "O";

        const disputes = await prisma.ludicDispute.findMany({
          where: {
            OR: [{ posDesignId: designId }, { negDesignId: designId }],
          },
        });

        const disputeData: Dispute[] = disputes.map((d) => ({
          id: d.id,
          dialogueId: d.deliberationId,
          posDesignId: d.posDesignId,
          negDesignId: d.negDesignId,
          pairs: (d.actionPairs as any) || [],
          status: d.status as "ONGOING" | "CONVERGENT" | "DIVERGENT" | "STUCK",
          length: d.length,
        }));

        strategy = constructStrategy(designId!, player, disputeData);
      }

      const properties = analyzeStrategyProperties(strategy);

      return NextResponse.json({
        ok: true,
        type: "strategy",
        strategyId: strategy.id,
        designId: strategy.designId,
        properties,
        playCount: strategy.plays.length,
        isInnocent: strategy.isInnocent,
      });
    }

    if (type === "game") {
      if (!designId && !designIds?.length) {
        return NextResponse.json(
          { ok: false, error: "designId or designIds required for game analysis" },
          { status: 400 }
        );
      }

      const targetDesignIds = designIds || [designId];

      // Fetch behaviours that form the game
      const behaviours = await prisma.ludicBehaviour.findMany({
        where: {
          OR: targetDesignIds.map((id: string) => ({
            designIds: { has: id },
          })),
        },
      });

      // Construct game data
      const gameData = {
        behaviours: behaviours.map((b) => ({
          id: b.id,
          designIds: b.designIds as string[],
          isClosed: b.isClosed,
        })),
        designCount: targetDesignIds.length,
        behaviourCount: behaviours.length,
      };

      const properties = analyzeGameProperties(gameData);

      return NextResponse.json({
        ok: true,
        type: "game",
        designIds: targetDesignIds,
        properties,
        behaviourCount: behaviours.length,
        isClosed: behaviours.some((b) => b.isClosed),
      });
    }

    return NextResponse.json(
      { ok: false, error: "Invalid type. Use: design, strategy, game, or batch" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[DDS Property Analysis Error]", error);
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
    const type = url.searchParams.get("type") || "summary";

    if (designId) {
      // Get all property information for a design
      const design = await prisma.ludicDesign.findUnique({
        where: { id: designId },
        include: {
          acts: true,
        },
      });

      if (!design) {
        return NextResponse.json(
          { ok: false, error: "Design not found" },
          { status: 404 }
        );
      }

      const strategy = await prisma.ludicStrategy.findFirst({
        where: { designId },
        include: {
          innocenceCheck: true,
          propagationCheck: true,
        },
      });

      const behaviours = await prisma.ludicBehaviour.findMany({
        where: { designIds: { has: designId } },
      });

      return NextResponse.json({
        ok: true,
        designId,
        design: {
          actCount: design.acts.length,
          participantId: design.participantId,
        },
        strategy: strategy
          ? {
              id: strategy.id,
              player: strategy.player,
              isInnocent: strategy.isInnocent,
              playCount: strategy.playCount,
              innocenceCheck: strategy.innocenceCheck,
              propagationCheck: strategy.propagationCheck,
            }
          : null,
        behaviours: behaviours.map((b) => ({
          id: b.id,
          name: b.name,
          isClosed: b.isClosed,
          designCount: (b.designIds as string[]).length,
        })),
      });
    }

    if (deliberationId) {
      // Get summary for all designs in deliberation
      const designs = await prisma.ludicDesign.findMany({
        where: { deliberationId },
        include: {
          _count: { select: { acts: true } },
        },
      });

      const strategies = await prisma.ludicStrategy.findMany({
        where: { design: { deliberationId } },
      });

      const behaviours = await prisma.ludicBehaviour.findMany({
        where: { deliberationId },
      });

      return NextResponse.json({
        ok: true,
        deliberationId,
        summary: {
          designCount: designs.length,
          totalActs: designs.reduce((sum, d) => sum + d._count.acts, 0),
          strategyCount: strategies.length,
          innocentStrategies: strategies.filter((s) => s.isInnocent).length,
          behaviourCount: behaviours.length,
          closedBehaviours: behaviours.filter((b) => b.isClosed).length,
        },
        designs: designs.map((d) => ({
          id: d.id,
          actCount: d._count.acts,
          participantId: d.participantId,
        })),
      });
    }

    return NextResponse.json(
      { ok: false, error: "designId or deliberationId required" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[DDS Property Analysis GET Error]", error);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}
