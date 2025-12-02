"use client";

/**
 * DDS Phase 3 - Game Simulator Panel
 * 
 * Run simulations between strategies and analyze results.
 */

import * as React from "react";
import { cn } from "@/lib/utils";

type GameStrategy = {
  id: string;
  gameId: string;
  sourceDesignId: string;
  player: "P" | "O";
  name?: string;
};

type LudicsGame = {
  id: string;
  arena: {
    id: string;
    moves: any[];
  };
  strategies: GameStrategy[];
};

type SimulationResult = {
  pStrategy: string;
  oStrategy: string;
  games: number;
  pWins: number;
  oWins: number;
  draws: number;
  avgMoves: number;
  avgDuration: number;
};

type BatchResult = {
  totalSimulations: number;
  proponentWins: number;
  opponentWins: number;
  draws: number;
  proponentWinRate: number;
  opponentWinRate: number;
  averageMoves: number;
};

interface GameSimulatorPanelProps {
  game: LudicsGame;
}

export function GameSimulatorPanel({ game }: GameSimulatorPanelProps) {
  const [mode, setMode] = React.useState<"single" | "batch" | "tournament">("single");
  const [selectedPStrategy, setSelectedPStrategy] = React.useState<string>("");
  const [selectedOStrategy, setSelectedOStrategy] = React.useState<string>("");
  const [numGames, setNumGames] = React.useState(10);
  const [isRunning, setIsRunning] = React.useState(false);
  const [results, setResults] = React.useState<SimulationResult | null>(null);
  const [batchResults, setBatchResults] = React.useState<BatchResult | null>(null);
  const [tournamentResults, setTournamentResults] = React.useState<{
    matchups: number;
    rankings: Array<{ strategyId: string; player: "P" | "O"; wins: number; losses: number }>;
  } | null>(null);

  const pStrategies = game.strategies.filter((s) => s.player === "P");
  const oStrategies = game.strategies.filter((s) => s.player === "O");

  const runSingleSimulation = async () => {
    if (!selectedPStrategy || !selectedOStrategy) return;

    setIsRunning(true);
    setResults(null);

    try {
      const res = await fetch("/api/ludics/dds/games/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "simulate",
          gameId: game.id,
          pStrategyId: selectedPStrategy,
          oStrategyId: selectedOStrategy,
          arenaConfig: game.arena,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setResults({
          pStrategy: selectedPStrategy,
          oStrategy: selectedOStrategy,
          games: 1,
          pWins: data.result.winner === "P" ? 1 : 0,
          oWins: data.result.winner === "O" ? 1 : 0,
          draws: data.result.winner === "draw" ? 1 : 0,
          avgMoves: data.result.moveCount,
          avgDuration: data.result.duration,
        });
      }
    } catch (err) {
      console.error("Simulation failed:", err);
    } finally {
      setIsRunning(false);
    }
  };

  const runBatchSimulation = async () => {
    if (!selectedPStrategy || !selectedOStrategy) return;

    setIsRunning(true);
    setBatchResults(null);

    try {
      const res = await fetch("/api/ludics/dds/games/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "batch_simulate",
          gameId: game.id,
          pStrategyId: selectedPStrategy,
          oStrategyId: selectedOStrategy,
          gameCount: numGames,
          arenaConfig: game.arena,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setBatchResults({
          totalSimulations: data.result.games,
          proponentWins: data.result.pWins,
          opponentWins: data.result.oWins,
          draws: data.result.draws,
          proponentWinRate: data.result.pWinRate,
          opponentWinRate: data.result.oWinRate,
          averageMoves: data.result.avgMoves,
        });
      }
    } catch (err) {
      console.error("Batch simulation failed:", err);
    } finally {
      setIsRunning(false);
    }
  };

  const runTournament = async () => {
    setIsRunning(true);
    setTournamentResults(null);

    try {
      const res = await fetch("/api/ludics/dds/games/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "tournament",
          gameId: game.id,
          simulationConfig: { gameCount: 5 },
          arenaConfig: game.arena,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setTournamentResults(data.tournament);
      }
    } catch (err) {
      console.error("Tournament failed:", err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mode Selector */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-lg w-fit">
        {(["single", "batch", "tournament"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-colors",
              mode === m
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            {m === "single" && "🎯 Single Game"}
            {m === "batch" && "📊 Batch Simulation"}
            {m === "tournament" && "🏆 Tournament"}
          </button>
        ))}
      </div>

      {/* Single/Batch Mode */}
      {(mode === "single" || mode === "batch") && (
        <div className="grid grid-cols-2 gap-6">
          {/* Strategy Selection */}
          <div className="space-y-4">
            <h4 className="font-semibold">Select Strategies</h4>

            {/* P Strategy */}
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-2">
                Proponent Strategy (P)
              </label>
              <select
                value={selectedPStrategy}
                onChange={(e) => setSelectedPStrategy(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a strategy...</option>
                {pStrategies.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name || s.id.slice(0, 16)}
                  </option>
                ))}
              </select>
            </div>

            {/* O Strategy */}
            <div>
              <label className="block text-sm font-medium text-rose-700 mb-2">
                Opponent Strategy (O)
              </label>
              <select
                value={selectedOStrategy}
                onChange={(e) => setSelectedOStrategy(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500"
              >
                <option value="">Select a strategy...</option>
                {oStrategies.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name || s.id.slice(0, 16)}
                  </option>
                ))}
              </select>
            </div>

            {/* Batch Settings */}
            {mode === "batch" && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Number of Games: {numGames}
                </label>
                <input
                  type="range"
                  min={5}
                  max={100}
                  step={5}
                  value={numGames}
                  onChange={(e) => setNumGames(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            )}

            {/* Run Button */}
            <button
              onClick={mode === "single" ? runSingleSimulation : runBatchSimulation}
              disabled={!selectedPStrategy || !selectedOStrategy || isRunning}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isRunning ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span> Running...
                </span>
              ) : mode === "single" ? (
                "▶️ Run Simulation"
              ) : (
                `▶️ Run ${numGames} Simulations`
              )}
            </button>
          </div>

          {/* Results */}
          <div className="space-y-4">
            <h4 className="font-semibold">Results</h4>

            {/* Single Game Result */}
            {mode === "single" && results && (
              <div className="bg-slate-50 rounded-lg p-4 border space-y-3">
                <div className="text-center text-2xl font-bold">
                  {results.pWins > 0 && (
                    <span className="text-blue-600">P Wins! 🎉</span>
                  )}
                  {results.oWins > 0 && (
                    <span className="text-rose-600">O Wins! 🎉</span>
                  )}
                  {results.draws > 0 && (
                    <span className="text-amber-600">Draw 🤝</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-white p-3 rounded border">
                    <div className="text-2xl font-bold">{results.avgMoves}</div>
                    <div className="text-xs text-slate-500">Moves</div>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <div className="text-2xl font-bold">{results.avgDuration}ms</div>
                    <div className="text-xs text-slate-500">Duration</div>
                  </div>
                </div>
              </div>
            )}

            {/* Batch Results */}
            {mode === "batch" && batchResults && (
              <div className="bg-slate-50 rounded-lg p-4 border space-y-4">
                <div className="text-center text-lg font-semibold">
                  {batchResults.totalSimulations} Games Completed
                </div>

                {/* Win Rate Bar */}
                <div className="h-8 rounded overflow-hidden flex">
                  <div
                    className="bg-blue-500 flex items-center justify-center text-white text-xs font-medium"
                    style={{ width: `${batchResults.proponentWinRate * 100}%` }}
                  >
                    {batchResults.proponentWins}P
                  </div>
                  <div
                    className="bg-amber-400 flex items-center justify-center text-white text-xs font-medium"
                    style={{
                      width: `${((batchResults.draws / batchResults.totalSimulations) * 100)}%`,
                    }}
                  >
                    {batchResults.draws}D
                  </div>
                  <div
                    className="bg-rose-500 flex items-center justify-center text-white text-xs font-medium"
                    style={{ width: `${batchResults.opponentWinRate * 100}%` }}
                  >
                    {batchResults.opponentWins}O
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div className="bg-blue-50 p-2 rounded">
                    <div className="font-bold text-blue-700">
                      {(batchResults.proponentWinRate * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-blue-600">P Win Rate</div>
                  </div>
                  <div className="bg-amber-50 p-2 rounded">
                    <div className="font-bold text-amber-700">
                      {batchResults.averageMoves.toFixed(1)}
                    </div>
                    <div className="text-xs text-amber-600">Avg Moves</div>
                  </div>
                  <div className="bg-rose-50 p-2 rounded">
                    <div className="font-bold text-rose-700">
                      {(batchResults.opponentWinRate * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-rose-600">O Win Rate</div>
                  </div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {((mode === "single" && !results) || (mode === "batch" && !batchResults)) && !isRunning && (
              <div className="bg-slate-50 rounded-lg p-8 border text-center text-slate-500">
                Select strategies and run a simulation to see results
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tournament Mode */}
      {mode === "tournament" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">Round-Robin Tournament</h4>
              <p className="text-sm text-slate-500">
                All P strategies vs all O strategies ({pStrategies.length} × {oStrategies.length} matchups)
              </p>
            </div>
            <button
              onClick={runTournament}
              disabled={isRunning || pStrategies.length === 0 || oStrategies.length === 0}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {isRunning ? "Running Tournament..." : "🏆 Run Tournament"}
            </button>
          </div>

          {/* Tournament Results */}
          {tournamentResults && (
            <div className="space-y-4">
              {/* Rankings */}
              <div className="bg-white rounded-lg border overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 border-b font-semibold">
                  Strategy Rankings
                </div>
                <div className="divide-y">
                  {tournamentResults.rankings.map((rank, idx) => (
                    <div
                      key={rank.strategyId}
                      className="px-4 py-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                            idx === 0 && "bg-yellow-100 text-yellow-700",
                            idx === 1 && "bg-slate-200 text-slate-600",
                            idx === 2 && "bg-amber-100 text-amber-700",
                            idx > 2 && "bg-slate-100 text-slate-500"
                          )}
                        >
                          {idx + 1}
                        </span>
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-xs font-medium",
                            rank.player === "P"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-rose-100 text-rose-700"
                          )}
                        >
                          {rank.player}
                        </span>
                        <span className="font-mono text-sm">
                          {rank.strategyId.slice(0, 16)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-green-600 font-medium">
                          {rank.wins} wins
                        </span>
                        <span className="text-red-600">
                          {rank.losses} losses
                        </span>
                        <span className="text-slate-500">
                          ({((rank.wins / (rank.wins + rank.losses)) * 100 || 0).toFixed(0)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-center text-sm text-slate-500">
                Tournament completed: {tournamentResults.matchups} matchups played
              </div>
            </div>
          )}

          {/* Empty State */}
          {!tournamentResults && !isRunning && (
            <div className="bg-slate-50 rounded-lg p-8 border text-center text-slate-500">
              {pStrategies.length === 0 || oStrategies.length === 0
                ? "Need at least one strategy for each player to run tournament"
                : "Click 'Run Tournament' to start a round-robin competition"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default GameSimulatorPanel;
