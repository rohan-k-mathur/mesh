/**
 * DDS Games API Route
 * 
 * POST: Create a new game from behaviours
 * GET: List games for a deliberation
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  constructGame,
  getGameSummary,
} from "@/packages/ludics-core/dds/game";
import type { Behaviour } from "@/packages/ludics-core/dds/behaviours/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      deliberationId,
      positiveBehaviourId,
      negativeBehaviourId,
      name,
      maxArenaDepth,
      maxRamification,
    } = body;

    if (!deliberationId || !positiveBehaviourId || !negativeBehaviourId) {
      return NextResponse.json(
        { ok: false, error: "deliberationId, positiveBehaviourId, and negativeBehaviourId are required" },
        { status: 400 }
      );
    }

    // Fetch behaviours from database
    const [posBehaviour, negBehaviour] = await Promise.all([
      prisma.ludicsBehaviour.findUnique({
        where: { id: positiveBehaviourId },
      }),
      prisma.ludicsBehaviour.findUnique({
        where: { id: negativeBehaviourId },
      }),
    ]);

    if (!posBehaviour || !negBehaviour) {
      return NextResponse.json(
        { ok: false, error: "One or both behaviours not found" },
        { status: 404 }
      );
    }

    // Transform to expected format
    const positiveBehaviour: Behaviour = {
      id: posBehaviour.id,
      name: posBehaviour.name || undefined,
      deliberationId: posBehaviour.deliberationId,
      baseDesignIds: (posBehaviour.baseDesignIds as string[]) || [],
      closureDesignIds: (posBehaviour.closureDesignIds as string[]) || [],
      isGame: posBehaviour.isGame,
      isType: posBehaviour.isType,
      dimension: posBehaviour.dimension,
      createdAt: posBehaviour.createdAt,
    };

    const negativeBehaviour: Behaviour = {
      id: negBehaviour.id,
      name: negBehaviour.name || undefined,
      deliberationId: negBehaviour.deliberationId,
      baseDesignIds: (negBehaviour.baseDesignIds as string[]) || [],
      closureDesignIds: (negBehaviour.closureDesignIds as string[]) || [],
      isGame: negBehaviour.isGame,
      isType: negBehaviour.isType,
      dimension: negBehaviour.dimension,
      createdAt: negBehaviour.createdAt,
    };

    // Fetch designs for both behaviours
    const allDesignIds = [
      ...positiveBehaviour.closureDesignIds,
      ...negativeBehaviour.closureDesignIds,
    ];

    const designs = await prisma.ludicsDesign.findMany({
      where: {
        id: { in: allDesignIds },
      },
      include: {
        acts: true,
      },
    });

    // Transform designs
    const designData = designs.map(d => ({
      id: d.id,
      name: d.name || undefined,
      acts: d.acts.map(a => ({
        id: a.id,
        locusPath: a.locusPath,
        ramification: Array.isArray(a.ramification) ? a.ramification as number[] : [],
        polarity: a.polarity,
        kind: a.kind,
        expression: a.expression || undefined,
      })),
      loci: [],
    }));

    // Construct game
    const result = constructGame(
      positiveBehaviour,
      negativeBehaviour,
      designData,
      {
        name,
        maxArenaDepth: maxArenaDepth ?? 4,
        maxRamification: maxRamification ?? 3,
        extractStrategies: true,
      }
    );

    // Store game in database (using LudicGame table)
    const dbGame = await prisma.ludicGame.create({
      data: {
        id: result.game.id,
        deliberationId,
        name: result.game.name,
        positiveBehaviourId: result.game.positiveBehaviourId,
        negativeBehaviourId: result.game.negativeBehaviourId,
        arenaJson: {
          id: result.game.arena.id,
          base: result.game.arena.base,
          moveCount: result.game.arena.moves.length,
        },
        positionsJson: null, // Computed on demand
      },
    });

    return NextResponse.json({
      ok: true,
      game: {
        ...getGameSummary(result.game),
        arena: {
          id: result.game.arena.id,
          base: result.game.arena.base,
          moveCount: result.game.arena.moves.length,
          maxDepth: result.stats.arenaMaxDepth,
        },
      },
      stats: result.stats,
      warnings: result.warnings,
    });
  } catch (error: any) {
    console.error("Game creation error:", error);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const deliberationId = searchParams.get("deliberationId");

    if (!deliberationId) {
      return NextResponse.json(
        { ok: false, error: "deliberationId is required" },
        { status: 400 }
      );
    }

    const games = await prisma.ludicGame.findMany({
      where: { deliberationId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      ok: true,
      games: games.map(g => ({
        id: g.id,
        name: g.name,
        positiveBehaviourId: g.positiveBehaviourId,
        negativeBehaviourId: g.negativeBehaviourId,
        arena: g.arenaJson,
        createdAt: g.createdAt,
      })),
    });
  } catch (error: any) {
    console.error("Game list error:", error);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}
