"use client";

/**
 * DDS Phase 3 - Winning Analysis Panel
 * 
 * Analyze strategies and find winning positions.
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

type StrategyAnalysis = {
  strategyId: string;
  player: "P" | "O";
  winRate: number;
  avgMoves: number;
  vsAI: { wins: number; losses: number; draws: number };
  vsRandom: { wins: number; losses: number; draws: number };
};

interface WinningAnalysisPanelProps {
  game: LudicsGame;
}

export function WinningAnalysisPanel({ game }: WinningAnalysisPanelProps) {
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [selectedStrategy, setSelectedStrategy] = React.useState<string | null>(null);
  const [analysis, setAnalysis] = React.useState<StrategyAnalysis | null>(null);
  const [bestStrategies, setBestStrategies] = React.useState<{
    pBest: { strategyId: string; winRate: number } | null;
    oBest: { strategyId: string; winRate: number } | null;
  } | null>(null);
  const [arenaStats, setArenaStats] = React.useState<{
    totalMoves: number;
    maxDepth: number;
    pMoves: number;
    oMoves: number;
    avgRamification: number;
  } | null>(null);

  // Analyze selected strategy
  const analyzeStrategy = async (strategyId: string) => {
    setIsAnalyzing(true);
    setSelectedStrategy(strategyId);
    setAnalysis(null);

    try {
      const res = await fetch("/api/ludics/dds/games/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "analyze_strategy",
          gameId: game.id,
          strategyId,
          simulationConfig: { gameCount: 10 },
          arenaConfig: game.arena,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        const strategy = game.strategies.find((s) => s.id === strategyId);
        setAnalysis({
          strategyId,
          player: strategy?.player || "P",
          winRate: data.analysis.winRate,
          avgMoves: data.analysis.avgMoves,
          vsAI: data.analysis.vsAI,
          vsRandom: data.analysis.vsRandom,
        });
      }
    } catch (err) {
      console.error("Analysis failed:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Find best strategies
  const findBestStrategies = async () => {
    setIsAnalyzing(true);

    try {
      const [pRes, oRes] = await Promise.all([
        fetch("/api/ludics/dds/games/simulate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "find_best",
            gameId: game.id,
            player: "P",
            simulationConfig: { gameCount: 10 },
            arenaConfig: game.arena,
          }),
        }),
        fetch("/api/ludics/dds/games/simulate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "find_best",
            gameId: game.id,
            player: "O",
            simulationConfig: { gameCount: 10 },
            arenaConfig: game.arena,
          }),
        }),
      ]);

      const [pData, oData] = await Promise.all([pRes.json(), oRes.json()]);

      setBestStrategies({
        pBest: pData.ok ? pData.best : null,
        oBest: oData.ok ? oData.best : null,
      });
    } catch (err) {
      console.error("Find best failed:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Analyze arena
  const analyzeArena = async () => {
    setIsAnalyzing(true);

    try {
      const res = await fetch("/api/ludics/dds/games/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "analyze_arena",
          gameId: game.id,
          arenaConfig: game.arena,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setArenaStats(data.analysis);
      }
    } catch (err) {
      console.error("Arena analysis failed:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const pStrategies = game.strategies.filter((s) => s.player === "P");
  const oStrategies = game.strategies.filter((s) => s.player === "O");

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-4">
        <button
          onClick={findBestStrategies}
          disabled={isAnalyzing}
          className="p-4 bg-gradient-to-r from-blue-50 to-rose-50 rounded-lg border hover:shadow-md transition-all text-center"
        >
          <div className="text-2xl mb-2">🏆</div>
          <div className="font-medium">Find Best Strategies</div>
          <div className="text-xs text-slate-500">Compare all strategies</div>
        </button>

        <button
          onClick={analyzeArena}
          disabled={isAnalyzing}
          className="p-4 bg-slate-50 rounded-lg border hover:shadow-md transition-all text-center"
        >
          <div className="text-2xl mb-2">📊</div>
          <div className="font-medium">Analyze Arena</div>
          <div className="text-xs text-slate-500">Arena structure stats</div>
        </button>

        <div className="p-4 bg-slate-50 rounded-lg border text-center">
          <div className="text-2xl mb-2">📈</div>
          <div className="font-medium">Game Balance</div>
          <div className="text-xs text-slate-500">
            {game.strategies.length} strategies total
          </div>
        </div>
      </div>

      {/* Best Strategies Results */}
      {bestStrategies && (
        <div className="grid grid-cols-2 gap-4">
          {/* Best P Strategy */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="font-semibold text-blue-700 mb-3">
              🥇 Best Proponent Strategy
            </h4>
            {bestStrategies.pBest ? (
              <div className="space-y-2">
                <div className="font-mono text-sm bg-white p-2 rounded">
                  {bestStrategies.pBest.strategyId.slice(0, 24)}...
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {(bestStrategies.pBest.winRate * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-blue-500">Win Rate</div>
              </div>
            ) : (
              <div className="text-slate-500 italic">No P strategies</div>
            )}
          </div>

          {/* Best O Strategy */}
          <div className="bg-rose-50 rounded-lg p-4 border border-rose-200">
            <h4 className="font-semibold text-rose-700 mb-3">
              🥇 Best Opponent Strategy
            </h4>
            {bestStrategies.oBest ? (
              <div className="space-y-2">
                <div className="font-mono text-sm bg-white p-2 rounded">
                  {bestStrategies.oBest.strategyId.slice(0, 24)}...
                </div>
                <div className="text-2xl font-bold text-rose-600">
                  {(bestStrategies.oBest.winRate * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-rose-500">Win Rate</div>
              </div>
            ) : (
              <div className="text-slate-500 italic">No O strategies</div>
            )}
          </div>
        </div>
      )}

      {/* Arena Stats */}
      {arenaStats && (
        <div className="bg-slate-50 rounded-lg p-4 border">
          <h4 className="font-semibold mb-4">Arena Statistics</h4>
          <div className="grid grid-cols-5 gap-4">
            <StatBox label="Total Moves" value={arenaStats.totalMoves} />
            <StatBox label="Max Depth" value={arenaStats.maxDepth} />
            <StatBox label="P Moves" value={arenaStats.pMoves} color="blue" />
            <StatBox label="O Moves" value={arenaStats.oMoves} color="rose" />
            <StatBox
              label="Avg Ramification"
              value={arenaStats.avgRamification.toFixed(2)}
            />
          </div>
        </div>
      )}

      {/* Strategy Analysis */}
      <div className="grid grid-cols-2 gap-6">
        {/* Strategy List */}
        <div className="space-y-4">
          <h4 className="font-semibold">Analyze Individual Strategy</h4>

          <div className="space-y-2">
            <div className="text-sm font-medium text-blue-700">P Strategies</div>
            {pStrategies.length === 0 ? (
              <div className="text-sm text-slate-400 italic">None</div>
            ) : (
              <div className="space-y-1">
                {pStrategies.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => analyzeStrategy(s.id)}
                    disabled={isAnalyzing}
                    className={cn(
                      "w-full px-3 py-2 rounded border text-left text-sm transition-colors",
                      selectedStrategy === s.id
                        ? "bg-blue-100 border-blue-400"
                        : "bg-white hover:bg-blue-50 border-slate-200"
                    )}
                  >
                    {s.name || s.id.slice(0, 20)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium text-rose-700">O Strategies</div>
            {oStrategies.length === 0 ? (
              <div className="text-sm text-slate-400 italic">None</div>
            ) : (
              <div className="space-y-1">
                {oStrategies.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => analyzeStrategy(s.id)}
                    disabled={isAnalyzing}
                    className={cn(
                      "w-full px-3 py-2 rounded border text-left text-sm transition-colors",
                      selectedStrategy === s.id
                        ? "bg-rose-100 border-rose-400"
                        : "bg-white hover:bg-rose-50 border-slate-200"
                    )}
                  >
                    {s.name || s.id.slice(0, 20)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Analysis Results */}
        <div className="space-y-4">
          <h4 className="font-semibold">Strategy Analysis</h4>

          {analysis ? (
            <div
              className={cn(
                "rounded-lg p-4 border space-y-4",
                analysis.player === "P" ? "bg-blue-50 border-blue-200" : "bg-rose-50 border-rose-200"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="font-mono text-sm">
                  {analysis.strategyId.slice(0, 20)}...
                </div>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded text-xs font-medium",
                    analysis.player === "P"
                      ? "bg-blue-200 text-blue-700"
                      : "bg-rose-200 text-rose-700"
                  )}
                >
                  {analysis.player}
                </span>
              </div>

              {/* Win Rate */}
              <div className="text-center">
                <div className="text-4xl font-bold">
                  {(analysis.winRate * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-slate-500">Overall Win Rate</div>
              </div>

              {/* Detailed Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded border">
                  <div className="text-sm text-slate-500 mb-1">vs AI</div>
                  <div className="text-green-600">
                    W: {analysis.vsAI.wins}
                  </div>
                  <div className="text-red-600">
                    L: {analysis.vsAI.losses}
                  </div>
                  <div className="text-amber-600">
                    D: {analysis.vsAI.draws}
                  </div>
                </div>
                <div className="bg-white p-3 rounded border">
                  <div className="text-sm text-slate-500 mb-1">vs Random</div>
                  <div className="text-green-600">
                    W: {analysis.vsRandom.wins}
                  </div>
                  <div className="text-red-600">
                    L: {analysis.vsRandom.losses}
                  </div>
                  <div className="text-amber-600">
                    D: {analysis.vsRandom.draws}
                  </div>
                </div>
              </div>

              <div className="text-center text-sm text-slate-500">
                Average game length: {analysis.avgMoves.toFixed(1)} moves
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-lg p-8 border text-center text-slate-500">
              {isAnalyzing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span> Analyzing...
                </span>
              ) : (
                "Select a strategy to analyze"
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatBox({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color?: "blue" | "rose";
}) {
  const colorClasses = color
    ? color === "blue"
      ? "bg-blue-100 text-blue-700"
      : "bg-rose-100 text-rose-700"
    : "bg-white";

  return (
    <div className={cn("p-3 rounded border text-center", colorClasses)}>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}

export default WinningAnalysisPanel;
