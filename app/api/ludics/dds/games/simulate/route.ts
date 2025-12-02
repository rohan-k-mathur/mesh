/**
 * DDS Game Simulation API Route
 * 
 * POST: Run game simulations between strategies or AI
 */

import { NextRequest, NextResponse } from "next/server";
import {
  initializeGame,
  simulateGame,
  simulateVsAI,
  simulateRandomGame,
  batchSimulate,
  runTournament,
  analyzeStrategy,
  findBestStrategy,
  encodeGameState,
} from "@/packages/ludics-core/dds/game";
import {
  createUniversalArena,
} from "@/packages/ludics-core/dds/arena";
import type { LudicsGame, SimulationConfig, AIDifficulty } from "@/packages/ludics-core/dds/game";
import type { UniversalArena } from "@/packages/ludics-core/dds/arena";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      action,
      arenaConfig,
      gameId,
      simulationConfig,
    } = body;

    // Build arena
    let arena: UniversalArena;
    if (arenaConfig?.moves) {
      arena = arenaConfig as UniversalArena;
    } else {
      arena = createUniversalArena({
        maxDepth: arenaConfig?.maxDepth ?? 4,
        maxRamification: arenaConfig?.maxRamification ?? 3,
      });
    }

    // Build minimal game object
    const game: LudicsGame = {
      id: gameId || `sim-${Date.now()}`,
      deliberationId: body.deliberationId || "sim",
      positiveBehaviourId: "sim-p",
      negativeBehaviourId: "sim-o",
      arena,
      strategies: [],
    };

    switch (action) {
      case "simulate": {
        // Run a simulation between two strategies
        const { pStrategyId, oStrategyId } = body;
        
        if (!pStrategyId || !oStrategyId) {
          return NextResponse.json(
            { ok: false, error: "pStrategyId and oStrategyId are required" },
            { status: 400 }
          );
        }

        const config: SimulationConfig = simulationConfig || {
          maxMoves: 100,
          timeout: 5000,
        };

        const result = simulateGame(game, pStrategyId, oStrategyId, config);

        return NextResponse.json({
          ok: true,
          result: {
            winner: result.winner,
            moveCount: result.moveCount,
            duration: result.duration,
            trace: result.trace.map(entry => ({
              moveNumber: entry.moveNumber,
              player: entry.player,
              address: entry.move.address,
              source: entry.source,
            })),
          },
        });
      }

      case "simulate_vs_ai": {
        // Run a simulation: strategy vs AI
        const { strategyId, strategyPlayer } = body;
        
        if (!strategyId || !strategyPlayer) {
          return NextResponse.json(
            { ok: false, error: "strategyId and strategyPlayer are required" },
            { status: 400 }
          );
        }

        const config: SimulationConfig = simulationConfig || {
          maxMoves: 100,
          timeout: 5000,
        };

        const result = simulateVsAI(game, strategyId, strategyPlayer, config);

        return NextResponse.json({
          ok: true,
          result: {
            winner: result.winner,
            moveCount: result.moveCount,
            duration: result.duration,
            trace: result.trace.map(entry => ({
              moveNumber: entry.moveNumber,
              player: entry.player,
              address: entry.move.address,
              source: entry.source,
            })),
          },
        });
      }

      case "simulate_random": {
        // Run a random simulation (baseline)
        const config: SimulationConfig = simulationConfig || {
          maxMoves: 100,
        };

        const result = simulateRandomGame(game, config);

        return NextResponse.json({
          ok: true,
          result: {
            winner: result.winner,
            moveCount: result.moveCount,
            duration: result.duration,
          },
        });
      }

      case "batch_simulate": {
        // Run multiple simulations between two strategies
        const { pStrategyId, oStrategyId, gameCount } = body;
        
        if (!pStrategyId || !oStrategyId) {
          return NextResponse.json(
            { ok: false, error: "pStrategyId and oStrategyId are required" },
            { status: 400 }
          );
        }

        const config: SimulationConfig = {
          ...simulationConfig,
          gameCount: gameCount || 10,
        };

        const result = batchSimulate(game, pStrategyId, oStrategyId, config);

        return NextResponse.json({
          ok: true,
          result: {
            pStrategy: result.pStrategy,
            oStrategy: result.oStrategy,
            games: result.games,
            pWins: result.pWins,
            oWins: result.oWins,
            draws: result.draws,
            pWinRate: result.pWins / result.games,
            oWinRate: result.oWins / result.games,
            avgMoves: result.avgMoves,
            avgDuration: result.avgDuration,
          },
        });
      }

      case "tournament": {
        // Run a tournament between all strategy pairs
        const config: SimulationConfig = simulationConfig || {
          gameCount: 5,
        };

        const { results, rankings } = runTournament(game, config);

        return NextResponse.json({
          ok: true,
          tournament: {
            matchups: results.length,
            rankings,
            results: results.map(r => ({
              pStrategy: r.pStrategy,
              oStrategy: r.oStrategy,
              pWins: r.pWins,
              oWins: r.oWins,
              draws: r.draws,
            })),
          },
        });
      }

      case "analyze_strategy": {
        // Analyze a specific strategy's performance
        const { strategyId } = body;
        
        if (!strategyId) {
          return NextResponse.json(
            { ok: false, error: "strategyId is required" },
            { status: 400 }
          );
        }

        const config: SimulationConfig = simulationConfig || {
          gameCount: 10,
        };

        const analysis = analyzeStrategy(game, strategyId, config);

        return NextResponse.json({
          ok: true,
          analysis: {
            strategyId,
            winRate: analysis.winRate,
            avgMoves: analysis.avgMoves,
            vsAI: analysis.vsAI,
            vsRandom: analysis.vsRandom,
          },
        });
      }

      case "find_best": {
        // Find best strategy for a player
        const { player } = body;
        
        if (!player || (player !== "P" && player !== "O")) {
          return NextResponse.json(
            { ok: false, error: "player must be 'P' or 'O'" },
            { status: 400 }
          );
        }

        const config: SimulationConfig = simulationConfig || {
          gameCount: 10,
        };

        const best = findBestStrategy(game, player, config);

        return NextResponse.json({
          ok: true,
          best: best || null,
        });
      }

      case "analyze_arena": {
        // Analyze the arena structure
        return NextResponse.json({
          ok: true,
          analysis: {
            totalMoves: arena.moves.length,
            maxDepth: Math.max(...arena.moves.map(m => m.address.length), 0),
            pMoves: arena.moves.filter(m => m.player === "P").length,
            oMoves: arena.moves.filter(m => m.player === "O").length,
            avgRamification: arena.moves.length > 0 
              ? arena.moves.reduce((sum, m) => sum + m.ramification.length, 0) / arena.moves.length
              : 0,
            strategies: {
              total: game.strategies.length,
              pStrategies: game.strategies.filter(s => s.player === "P").length,
              oStrategies: game.strategies.filter(s => s.player === "O").length,
            },
          },
        });
      }

      default:
        return NextResponse.json(
          { ok: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error("Simulation error:", error);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}
