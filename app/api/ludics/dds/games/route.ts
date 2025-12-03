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

// Helper to create a balanced demo arena where both P and O can win
// Following Faggian-Hyland convention:
// - Empty address ("") is root, P plays first
// - Even-length addresses are P's moves (depth 0, 2, 4...)
// - Odd-length addresses are O's moves (depth 1, 3, 5...)
// - A player loses when stuck (no available moves on their turn)
// 
// For P to win: terminal position where currentPlayer = O (O stuck)
// For O to win: terminal position where currentPlayer = P (P stuck)
//
// Design: Create a balanced tree with terminals at various depths
function createDemoArena(maxDepth: number, maxRamification: number, deliberationId: string) {
  const arenaId = `arena-${uuidv4().slice(0, 8)}`;
  const moves: Array<{
    id: string;
    address: string;
    ramification: number[];
    player: "P" | "O";
    isInitial: boolean;
  }> = [];

  // Helper to determine player from address length
  const getPlayer = (addr: string): "P" | "O" => addr.length % 2 === 0 ? "P" : "O";

  // P's initial move at root (empty address, even length 0)
  // Give root 3 branches for variety
  moves.push({
    id: `move-${arenaId}-root`,
    address: "",
    ramification: [0, 1, 2],
    player: "P",
    isInitial: true,
  });

  // Branch 0: P-favoring (leads to O getting stuck)
  // Path: "" -> "0" -> "00" -> "000" (O terminal, P wins)
  //                         -> "001" (O terminal, P wins)
  //                -> "01" -> "010" (O terminal, P wins)
  moves.push({ id: `move-${arenaId}-0`, address: "0", ramification: [0, 1], player: "O", isInitial: false });
  moves.push({ id: `move-${arenaId}-00`, address: "00", ramification: [0, 1], player: "P", isInitial: false });
  moves.push({ id: `move-${arenaId}-01`, address: "01", ramification: [0], player: "P", isInitial: false });
  // O's terminal moves (P plays, O responds, O has no continuation = O stuck next turn = P wins)
  // Wait - that's wrong! If O plays "000" with ramification [], then it's P's turn, P is stuck, O wins!
  // 
  // To make P win: O must get stuck. For O to get stuck, P must play a move that leaves O with nothing.
  // P plays at even depth, O plays at odd depth.
  // If P plays a move at depth 4 (even) with ramification [], then it's O's turn (depth 5), O has nothing → O stuck → P wins!

  // Let me redesign:
  // Depth 0: P "" ramification [0,1,2]
  // Depth 1: O "0", "1", "2" ramification varies
  // Depth 2: P "00", "01", etc
  // Depth 3: O "000", "001", etc
  // Depth 4: P "0000" with ramification [] → O stuck → P wins!
  // Depth 3: O "010" with ramification [] → P stuck → O wins!

  // Branch 0: Deep game, P can win
  moves.push({ id: `move-${arenaId}-000`, address: "000", ramification: [0], player: "O", isInitial: false });
  moves.push({ id: `move-${arenaId}-001`, address: "001", ramification: [], player: "O", isInitial: false }); // P stuck → O wins
  moves.push({ id: `move-${arenaId}-0000`, address: "0000", ramification: [], player: "P", isInitial: false }); // O stuck → P wins
  moves.push({ id: `move-${arenaId}-010`, address: "010", ramification: [], player: "O", isInitial: false }); // P stuck → O wins

  // Branch 1: O-favoring (shorter paths where P gets stuck)
  moves.push({ id: `move-${arenaId}-1`, address: "1", ramification: [0, 1], player: "O", isInitial: false });
  moves.push({ id: `move-${arenaId}-10`, address: "10", ramification: [0], player: "P", isInitial: false });
  moves.push({ id: `move-${arenaId}-11`, address: "11", ramification: [], player: "P", isInitial: false }); // O stuck → P wins
  moves.push({ id: `move-${arenaId}-100`, address: "100", ramification: [0], player: "O", isInitial: false });
  moves.push({ id: `move-${arenaId}-1000`, address: "1000", ramification: [], player: "P", isInitial: false }); // O stuck → P wins

  // Branch 2: Mixed outcomes  
  moves.push({ id: `move-${arenaId}-2`, address: "2", ramification: [0, 1], player: "O", isInitial: false });
  moves.push({ id: `move-${arenaId}-20`, address: "20", ramification: [0, 1], player: "P", isInitial: false });
  moves.push({ id: `move-${arenaId}-21`, address: "21", ramification: [0], player: "P", isInitial: false });
  moves.push({ id: `move-${arenaId}-200`, address: "200", ramification: [], player: "O", isInitial: false }); // P stuck → O wins
  moves.push({ id: `move-${arenaId}-201`, address: "201", ramification: [0], player: "O", isInitial: false });
  moves.push({ id: `move-${arenaId}-2010`, address: "2010", ramification: [], player: "P", isInitial: false }); // O stuck → P wins
  moves.push({ id: `move-${arenaId}-210`, address: "210", ramification: [], player: "O", isInitial: false }); // P stuck → O wins

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
