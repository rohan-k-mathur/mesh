/**
 * DDS Games API Route
 * 
 * POST: Create a new game from behaviours
 * GET: List games for a deliberation
 */

import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

// In-memory mock games store for demo
const mockGames: Record<string, Array<{
  id: string;
  name?: string;
  deliberationId: string;
  positiveBehaviourId: string;
  negativeBehaviourId: string;
  arena: any;
  strategies: any[];
  createdAt: Date;
}>> = {};

// Helper to create a simple demo arena
// Following Faggian-Hyland convention:
// - Empty address ("") is root, P plays first
// - Even-length addresses are P's moves
// - Odd-length addresses are O's moves
function createDemoArena(maxDepth: number, maxRamification: number, deliberationId: string) {
  const arenaId = `arena-${uuidv4().slice(0, 8)}`;
  const moves: Array<{
    id: string;
    address: string;
    ramification: number[];
    player: "P" | "O";
    isInitial: boolean;
  }> = [];

  // P's initial move at root (empty address, even length 0)
  const rootRamification = Array.from({ length: Math.min(maxRamification, 3) }, (_, i) => i);
  moves.push({
    id: `move-${arenaId}-root`,
    address: "",
    ramification: rootRamification,
    player: "P",
    isInitial: true,
  });

  // O's responses at depth 1 (addresses "0", "1", "2" - odd length)
  for (let i = 0; i < Math.min(maxRamification, 3); i++) {
    const oAddr = `${i}`;
    const oRamification = maxDepth > 2 
      ? Array.from({ length: Math.min(maxRamification, 2) }, (_, j) => j)
      : [];
    moves.push({
      id: `move-${arenaId}-${oAddr}`,
      address: oAddr,
      ramification: oRamification,
      player: "O",
      isInitial: false,
    });

    // P's responses at depth 2 (addresses "00", "01", etc - even length)
    if (maxDepth > 2) {
      for (let j = 0; j < Math.min(maxRamification, 2); j++) {
        const pAddr = `${oAddr}${j}`;
        const pRamification = maxDepth > 3
          ? Array.from({ length: Math.min(maxRamification, 2) }, (_, k) => k)
          : [];
        moves.push({
          id: `move-${arenaId}-${pAddr}`,
          address: pAddr,
          ramification: pRamification,
          player: "P",
          isInitial: false,
        });

        // O's responses at depth 3 (addresses "000", "001", etc - odd length)
        if (maxDepth > 3) {
          for (let k = 0; k < Math.min(maxRamification, 2); k++) {
            const deepOAddr = `${pAddr}${k}`;
            moves.push({
              id: `move-${arenaId}-${deepOAddr}`,
              address: deepOAddr,
              ramification: [],
              player: "O",
              isInitial: false,
            });
          }
        }
      }
    }
  }

  return {
    id: arenaId,
    base: "<>",
    isUniversal: true,
    deliberationId,
    moves,
  };
}

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

    // Create a demo arena for the game
    const arena = createDemoArena(
      maxArenaDepth ?? 4,
      maxRamification ?? 3,
      deliberationId
    );

    // Create mock strategies
    const strategies = [
      {
        id: `strategy-p-${uuidv4().slice(0, 8)}`,
        gameId: "",
        sourceDesignId: `design-p-${uuidv4().slice(0, 8)}`,
        player: "P" as const,
        name: "Proponent Strategy",
        responseMap: {},
      },
      {
        id: `strategy-o-${uuidv4().slice(0, 8)}`,
        gameId: "",
        sourceDesignId: `design-o-${uuidv4().slice(0, 8)}`,
        player: "O" as const,
        name: "Opponent Strategy",
        responseMap: {},
      },
    ];

    const gameId = `game-${uuidv4().slice(0, 8)}`;
    strategies.forEach(s => s.gameId = gameId);

    const newGame = {
      id: gameId,
      name: name || `Game ${new Date().toISOString().slice(0, 10)}`,
      deliberationId,
      positiveBehaviourId,
      negativeBehaviourId,
      arena: {
        id: arena.id,
        base: arena.base,
        isUniversal: arena.isUniversal,
        moves: arena.moves,
      },
      strategies,
      createdAt: new Date(),
    };

    // Store in mock
    if (!mockGames[deliberationId]) {
      mockGames[deliberationId] = [];
    }
    mockGames[deliberationId].push(newGame);

    return NextResponse.json({
      ok: true,
      game: {
        id: newGame.id,
        name: newGame.name,
        deliberationId: newGame.deliberationId,
        positiveBehaviourId: newGame.positiveBehaviourId,
        negativeBehaviourId: newGame.negativeBehaviourId,
        arena: {
          id: newGame.arena.id,
          base: newGame.arena.base,
          moves: newGame.arena.moves,
          moveCount: newGame.arena.moves.length,
        },
        strategies: newGame.strategies,
      },
      stats: {
        arenaMovesCount: newGame.arena.moves.length,
        strategiesCount: strategies.length,
      },
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
    const gameId = searchParams.get("gameId");

    // Get specific game
    if (gameId) {
      for (const [delibId, games] of Object.entries(mockGames)) {
        const game = games.find(g => g.id === gameId);
        if (game) {
          return NextResponse.json({
            ok: true,
            game: {
              id: game.id,
              name: game.name,
              deliberationId: game.deliberationId,
              positiveBehaviourId: game.positiveBehaviourId,
              negativeBehaviourId: game.negativeBehaviourId,
              arena: game.arena,
              strategies: game.strategies,
            },
          });
        }
      }
      return NextResponse.json(
        { ok: false, error: "Game not found" },
        { status: 404 }
      );
    }

    if (!deliberationId) {
      return NextResponse.json(
        { ok: false, error: "deliberationId is required" },
        { status: 400 }
      );
    }

    const games = mockGames[deliberationId] || [];

    return NextResponse.json({
      ok: true,
      games: games.map(g => ({
        id: g.id,
        name: g.name,
        positiveBehaviourId: g.positiveBehaviourId,
        negativeBehaviourId: g.negativeBehaviourId,
        arena: {
          id: g.arena.id,
          moveCount: g.arena.moves?.length || 0,
        },
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
