"use client";

import React, { useState, useEffect } from "react";
import useSWR from "swr";

/**
 * DialogueInspector - A comprehensive debug component to visualize the entire
 * dialogue state including claims, arguments, moves, CQs, and legal actions.
 * 
 * Usage:
 * <DialogueInspector
 *   deliberationId="delib_123"
 *   targetType="claim"
 *   targetId="claim_456"
 * />
 */

type TargetType = "claim" | "argument" | "card";

interface DialogueInspectorProps {
  deliberationId: string;
  targetType: TargetType;
  targetId: string;
  locusPath?: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function DialogueInspector({
  deliberationId,
  targetType,
  targetId,
  locusPath = "0",
}: DialogueInspectorProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "moves" | "legal" | "cqs" | "raw">("overview");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Fetch target data (claim or argument)
  const { data: targetData } = useSWR(
    targetType === "claim"
      ? `/api/claims/${targetId}`
      : targetType === "argument"
      ? `/api/arguments/${targetId}`
      : null,
    fetcher
  );

  // Fetch dialogue moves
  const { data: movesData } = useSWR(
    `/api/deliberations/${deliberationId}/moves?limit=100`,
    fetcher
  );

  // Fetch legal moves
  const { data: legalMovesData } = useSWR(
    `/api/dialogue/legal-moves?deliberationId=${deliberationId}&targetType=${targetType}&targetId=${targetId}&locusPath=${locusPath}`,
    fetcher
  );

  // Fetch CQs (if target is a claim)
  const { data: cqsData } = useSWR(
    targetType === "claim" ? `/api/cqs?targetType=claim&targetId=${targetId}` : null,
    fetcher
  );

  // Fetch CQ attachments
  const { data: attachmentsData } = useSWR(
    targetType === "claim" ? `/api/cqs/attachments?targetType=claim&targetId=${targetId}` : null,
    fetcher
  );

  // Filter moves related to this target
  const targetMoves = React.useMemo(() => {
    if (!movesData?.moves) return [];
    return movesData.moves.filter(
      (m: any) => m.targetId === targetId || m.payload?.targetId === targetId
    );
  }, [movesData, targetId]);

  const toggleExpand = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="dialogue-inspector border-2 border-purple-500 rounded-lg bg-white shadow-lg p-4 my-4">
      {/* Header */}
      <div className="border-b border-purple-300 pb-3 mb-4">
        <h2 className="text-xl font-bold text-purple-900 flex items-center gap-2">
          🔍 Dialogue Inspector
          <span className="text-xs font-mono bg-purple-100 px-2 py-1 rounded">
            {targetType}:{targetId.slice(-8)}
          </span>
        </h2>
        <p className="text-xs text-gray-600 mt-1">
          Deliberation: <span className="font-mono">{deliberationId.slice(-8)}</span> | Locus: <span className="font-mono">{locusPath}</span>
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-4 border-b border-gray-200">
        {[
          { id: "overview", label: "📊 Overview" },
          { id: "moves", label: "💬 Moves" },
          { id: "legal", label: "⚖️ Legal Actions" },
          { id: "cqs", label: "❓ Critical Qs" },
          { id: "raw", label: "🔧 Raw Data" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "text-purple-700 border-b-2 border-purple-700"
                : "text-gray-600 hover:text-purple-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            {/* Target Info */}
            <Section title="🎯 Target" defaultExpanded>
              <InfoRow label="Type" value={targetType} />
              <InfoRow label="ID" value={targetId} mono />
              {targetData && (
                <>
                  <InfoRow label="Text" value={targetData.text || targetData.claim?.text || "N/A"} />
                  {targetType === "argument" && (
                    <>
                      <InfoRow
                        label="Conclusion Claim"
                        value={targetData.conclusionClaimId || "N/A"}
                        mono
                      />
                      <InfoRow label="Scheme" value={targetData.scheme?.name || "None"} />
                    </>
                  )}
                  {targetType === "claim" && (
                    <>
                      <InfoRow label="Deliberation" value={targetData.deliberationId?.slice(-8) || "N/A"} mono />
                      <InfoRow label="Created" value={new Date(targetData.createdAt).toLocaleString()} />
                    </>
                  )}
                </>
              )}
            </Section>

            {/* Quick Stats */}
            <Section title="📈 Quick Stats">
              <div className="grid grid-cols-2 gap-4">
                <StatCard
                  label="Dialogue Moves"
                  value={targetMoves.length}
                  color="blue"
                />
                <StatCard
                  label="Legal Actions"
                  value={legalMovesData?.moves?.filter((m: any) => !m.disabled).length || 0}
                  color="green"
                />
                <StatCard
                  label="Critical Questions"
                  value={cqsData?.cqs?.length || 0}
                  color="amber"
                />
                <StatCard
                  label="Open CQs"
                  value={cqsData?.cqs?.filter((cq: any) => !cq.satisfied).length || 0}
                  color="rose"
                />
              </div>
            </Section>

            {/* Latest Activity */}
            <Section title="⏱️ Latest Activity">
              {targetMoves.slice(0, 5).map((move: any, idx: number) => (
                <div key={idx} className="flex items-start gap-2 p-2 bg-gray-50 rounded mb-2">
                  <span className="text-xs font-mono bg-blue-100 px-2 py-1 rounded">
                    {move.kind}
                  </span>
                  <div className="flex-1 text-sm">
                    <div className="font-medium text-gray-700">
                      {move.payload?.expression || move.payload?.brief || "No content"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(move.createdAt).toLocaleString()} | Actor: {move.actorId.slice(-6)}
                    </div>
                  </div>
                </div>
              ))}
              {targetMoves.length === 0 && (
                <p className="text-sm text-gray-500 italic">No moves yet</p>
              )}
            </Section>
          </div>
        )}

        {/* MOVES TAB */}
        {activeTab === "moves" && (
          <div className="space-y-3">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-gray-700">
                All Moves ({targetMoves.length})
              </h3>
              <button
                onClick={() => window.location.reload()}
                className="text-xs px-2 py-1 bg-blue-100 hover:bg-blue-200 rounded"
              >
                🔄 Refresh
              </button>
            </div>
            {targetMoves.map((move: any, idx: number) => (
              <MoveCard key={move.id} move={move} index={idx} />
            ))}
            {targetMoves.length === 0 && (
              <EmptyState message="No dialogue moves for this target yet" />
            )}
          </div>
        )}

        {/* LEGAL ACTIONS TAB */}
        {activeTab === "legal" && (
          <div className="space-y-3">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-gray-700">
                Legal Moves ({legalMovesData?.moves?.length || 0})
              </h3>
              <div className="text-xs text-gray-500">
                Available: {legalMovesData?.moves?.filter((m: any) => !m.disabled).length || 0} |
                Disabled: {legalMovesData?.moves?.filter((m: any) => m.disabled).length || 0}
              </div>
            </div>
            {legalMovesData?.moves?.map((move: any, idx: number) => (
              <LegalMoveCard key={idx} move={move} />
            ))}
            {!legalMovesData?.moves?.length && (
              <EmptyState message="No legal moves computed yet" />
            )}
          </div>
        )}

        {/* CQS TAB */}
        {activeTab === "cqs" && (
          <div className="space-y-3">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-gray-700">
                Critical Questions ({cqsData?.cqs?.length || 0})
              </h3>
              {targetType !== "claim" && (
                <p className="text-xs text-amber-600">⚠️ CQs only available for claims</p>
              )}
            </div>
            {cqsData?.cqs?.map((cq: any, idx: number) => (
              <CQCard key={idx} cq={cq} attachments={attachmentsData?.attachments || []} />
            ))}
            {targetType === "claim" && cqsData?.cqs?.length === 0 && (
              <EmptyState message="No critical questions for this claim" />
            )}
          </div>
        )}

        {/* RAW DATA TAB */}
        {activeTab === "raw" && (
          <div className="space-y-4">
            <RawDataSection title="Target Data" data={targetData} />
            <RawDataSection title="Moves Data" data={movesData} />
            <RawDataSection title="Legal Moves Data" data={legalMovesData} />
            <RawDataSection title="CQs Data" data={cqsData} />
            <RawDataSection title="Attachments Data" data={attachmentsData} />
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function Section({
  title,
  children,
  defaultExpanded = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2 bg-gray-50 hover:bg-gray-100 text-left font-semibold text-sm text-gray-700 flex items-center justify-between"
      >
        {title}
        <span className="text-gray-400">{isExpanded ? "▼" : "▶"}</span>
      </button>
      {isExpanded && <div className="p-4 space-y-2">{children}</div>}
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between items-start text-sm">
      <span className="font-medium text-gray-600 min-w-[120px]">{label}:</span>
      <span className={`text-gray-900 text-right flex-1 ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "blue" | "green" | "amber" | "rose";
}) {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200 text-blue-900",
    green: "bg-green-50 border-green-200 text-green-900",
    amber: "bg-amber-50 border-amber-200 text-amber-900",
    rose: "bg-rose-50 border-rose-200 text-rose-900",
  };

  return (
    <div className={`border rounded-lg p-3 ${colorClasses[color]}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs font-medium mt-1">{label}</div>
    </div>
  );
}

function MoveCard({ move, index }: { move: any; index: number }) {
  const [expanded, setExpanded] = useState(false);

  const forceIcons: Record<string, string> = {
    ATTACK: "⚔️",
    SURRENDER: "🏳️",
    NEUTRAL: "●",
  };
  const forceIcon = forceIcons[move.payload?.force || "NEUTRAL"] || "●";

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3 py-2 bg-gray-50 hover:bg-gray-100 text-left flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono bg-purple-100 px-2 py-1 rounded">
            #{index + 1} {move.kind}
          </span>
          <span className="text-sm">{forceIcon}</span>
          <span className="text-xs text-gray-600 font-mono">
            {move.id.slice(-8)}
          </span>
        </div>
        <span className="text-xs text-gray-500">
          {new Date(move.createdAt).toLocaleTimeString()}
        </span>
      </button>
      {expanded && (
        <div className="p-3 bg-white space-y-2 text-sm">
          <div>
            <span className="font-semibold">Expression:</span>{" "}
            {move.payload?.expression || move.payload?.brief || "N/A"}
          </div>
          <div>
            <span className="font-semibold">Locus:</span>{" "}
            <code>{move.payload?.locusPath || "0"}</code>
          </div>
          <div>
            <span className="font-semibold">Actor:</span>{" "}
            <code>{move.actorId}</code>
          </div>
          {move.payload?.cqId && (
            <div>
              <span className="font-semibold">CQ ID:</span>{" "}
              <code>{move.payload.cqId}</code>
            </div>
          )}
          {move.signature && (
            <div>
              <span className="font-semibold">Signature:</span>{" "}
              <code className="text-xs break-all">{move.signature}</code>
            </div>
          )}
          {move.payload?.acts && (
            <div>
              <span className="font-semibold">Acts:</span>
              <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                {JSON.stringify(move.payload.acts, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LegalMoveCard({ move }: { move: any }) {
  const forceIcons: Record<string, string> = {
    ATTACK: "⚔️",
    SURRENDER: "🏳️",
    NEUTRAL: "●",
  };
  const forceIcon = forceIcons[move.force] || "●";

  const relevanceColor = move.relevance === "likely" ? "text-green-600" : move.relevance === "unlikely" ? "text-amber-600" : "text-gray-400";

  return (
    <div
      className={`border rounded-lg p-3 ${
        move.disabled ? "bg-gray-50 opacity-60" : "bg-white"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-sm font-semibold">{move.kind}</span>
            <span>{forceIcon}</span>
            {move.relevance && (
              <span className={`text-xs ${relevanceColor}`}>
                {move.relevance === "likely" ? "●" : "○"}
              </span>
            )}
            {move.disabled && (
              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                DISABLED
              </span>
            )}
          </div>
          <div className="text-sm text-gray-700">{move.label}</div>
          {move.reason && (
            <div className="text-xs text-gray-500 italic mt-1">{move.reason}</div>
          )}
          {move.payload && (
            <div className="text-xs text-gray-600 mt-2">
              <span className="font-semibold">Payload:</span>{" "}
              <code>{JSON.stringify(move.payload).slice(0, 100)}...</code>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CQCard({ cq, attachments }: { cq: any; attachments: any[] }) {
  const attachment = attachments.find((a) => a.cqKey === cq.key);
  const isAnswered = cq.satisfied || attachment?.status === "answered";

  return (
    <div
      className={`border rounded-lg p-3 ${
        isAnswered ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs bg-white px-2 py-1 rounded">
            {cq.key}
          </span>
          <span className="text-xs">
            {isAnswered ? "✅" : "⏳"}
          </span>
        </div>
        <span
          className={`text-xs px-2 py-1 rounded ${
            isAnswered
              ? "bg-green-200 text-green-800"
              : "bg-amber-200 text-amber-800"
          }`}
        >
          {isAnswered ? "Answered" : "Open"}
        </span>
      </div>
      <div className="text-sm text-gray-900 font-medium mb-1">
        {cq.question}
      </div>
      {cq.description && (
        <div className="text-xs text-gray-600">{cq.description}</div>
      )}
      {attachment && (
        <div className="text-xs text-gray-500 mt-2">
          <span className="font-semibold">Attached:</span> {attachment.claimId?.slice(-8) || "N/A"}
        </div>
      )}
    </div>
  );
}

function RawDataSection({ title, data }: { title: string; data: any }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-left font-mono text-sm font-semibold flex items-center justify-between"
      >
        {title}
        <span className="text-gray-400">{expanded ? "▼" : "▶"}</span>
      </button>
      {expanded && (
        <div className="p-3 bg-gray-50">
          <pre className="text-xs overflow-x-auto whitespace-pre-wrap break-words">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-8 text-gray-500 italic">
      <div className="text-4xl mb-2">📭</div>
      {message}
    </div>
  );
}
