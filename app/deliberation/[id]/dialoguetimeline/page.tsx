// app/deliberation/[id]/dialoguetimeline/page.tsx
"use client";

import { useParams } from "next/navigation";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageSquare,
  FileText,
  AlertCircle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sword,
  Scale,
  ArrowRight,
  Loader2,
  User,
  Clock,
  Filter,
  Download,
} from "lucide-react";
import { useState, useMemo } from "react";
import { format } from "date-fns";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface TimelineEvent {
  id: string;
  type: "dialogue_move" | "argument_created" | "conflict_created" | "preference_created";
  timestamp: string;
  actorId: string;
  actorName: string;
  data: any;
}

interface DialogueMove {
  id: string;
  kind: string;
  actorId: string;
  targetType: string | null;
  targetId: string | null;
  payload: any;
  createdAt: string;
}

/**
 * Get icon and color for dialogue move types
 */
function getMoveIcon(kind: string) {
  const iconMap: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
    ASSERT: {
      icon: <MessageSquare className="h-4 w-4" />,
      color: "bg-blue-500",
      label: "Asserted",
    },
    WHY: {
      icon: <HelpCircle className="h-4 w-4" />,
      color: "bg-amber-500",
      label: "Questioned",
    },
    GROUNDS: {
      icon: <FileText className="h-4 w-4" />,
      color: "bg-green-500",
      label: "Provided Grounds",
    },
    CONCEDE: {
      icon: <CheckCircle2 className="h-4 w-4" />,
      color: "bg-emerald-500",
      label: "Conceded",
    },
    RETRACT: {
      icon: <XCircle className="h-4 w-4" />,
      color: "bg-red-500",
      label: "Retracted",
    },
    CONFLICT: {
      icon: <Sword className="h-4 w-4" />,
      color: "bg-rose-500",
      label: "Conflicted",
    },
    PREFER: {
      icon: <Scale className="h-4 w-4" />,
      color: "bg-purple-500",
      label: "Preferred",
    },
    THEREFORE: {
      icon: <ArrowRight className="h-4 w-4" />,
      color: "bg-indigo-500",
      label: "Concluded",
    },
  };

  return (
    iconMap[kind] || {
      icon: <MessageSquare className="h-4 w-4" />,
      color: "bg-gray-500",
      label: kind,
    }
  );
}

/**
 * Format target text for display
 */
function formatTargetText(move: DialogueMove, claimTexts: Map<string, string>, argTexts: Map<string, string>) {
  if (!move.targetId || !move.targetType) {
    return null;
  }

  if (move.targetType === "claim") {
    const text = claimTexts.get(move.targetId);
    return text ? (
      <span className="text-sm text-gray-700 italic">
        "{text.length > 80 ? text.slice(0, 80) + "..." : text}"
      </span>
    ) : (
      <span className="text-xs text-gray-500 font-mono">{move.targetId.slice(0, 8)}...</span>
    );
  }

  if (move.targetType === "argument") {
    const text = argTexts.get(move.targetId);
    return text ? (
      <span className="text-sm text-gray-700 italic">
        "{text.length > 80 ? text.slice(0, 80) + "..." : text}"
      </span>
    ) : (
      <span className="text-xs text-gray-500 font-mono">{move.targetId.slice(0, 8)}...</span>
    );
  }

  return <span className="text-xs text-gray-500">{move.targetType}</span>;
}

/**
 * Timeline Event Card Component
 */
function TimelineEventCard({
  move,
  isFirst,
  isLast,
  claimTexts,
  argTexts,
}: {
  move: DialogueMove;
  isFirst: boolean;
  isLast: boolean;
  claimTexts: Map<string, string>;
  argTexts: Map<string, string>;
}) {
  const moveInfo = getMoveIcon(move.kind);
  const timestamp = new Date(move.createdAt);

  return (
    <div className="flex gap-4 group">
      {/* Timeline line */}
      <div className="flex flex-col items-center">
        {/* Dot */}
        <div
          className={`${moveInfo.color} w-3 h-3 rounded-full ring-4 ring-white shadow-md transition-transform group-hover:scale-125`}
        />
        {/* Vertical line */}
        {!isLast && (
          <div className="w-0.5 flex-1 bg-gray-200 mt-1" style={{ minHeight: "60px" }} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-8">
        <Card className="surfacev2 group-hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`${moveInfo.color} p-1.5 rounded-lg text-white`}>
                  {moveInfo.icon}
                </div>
                <div>
                  <div className="font-semibold text-sm text-gray-900">{moveInfo.label}</div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <User className="h-3 w-3" />
                    <span>Participant {String(move.actorId).slice(0, 8)}...</span>
                    <span>•</span>
                    <Clock className="h-3 w-3" />
                    <span>{format(timestamp, "MMM d, yyyy 'at' h:mm a")}</span>
                  </div>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px]">
                {move.kind}
              </Badge>
            </div>

            {/* Target content */}
            {move.targetId && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-xs text-gray-500 mb-1">
                  Target: {move.targetType}
                </div>
                {formatTargetText(move, claimTexts, argTexts)}
              </div>
            )}

            {/* Payload details */}
            {move.payload && Object.keys(move.payload).length > 0 && (
              <details className="mt-3">
                <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                  View details
                </summary>
                <pre className="mt-2 text-[10px] bg-gray-100 p-2 rounded overflow-x-auto">
                  {JSON.stringify(move.payload, null, 2)}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Statistics Summary Component
 */
function TimelineStats({ moves }: { moves: DialogueMove[] }) {
  const stats = useMemo(() => {
    const kindCounts: Record<string, number> = {};
    const actorCounts: Record<string, number> = {};

    moves.forEach((move) => {
      kindCounts[move.kind] = (kindCounts[move.kind] || 0) + 1;
      const actorKey = String(move.actorId);
      actorCounts[actorKey] = (actorCounts[actorKey] || 0) + 1;
    });

    return {
      total: moves.length,
      byKind: kindCounts,
      byActor: actorCounts,
      uniqueActors: Object.keys(actorCounts).length,
      timespan:
        moves.length > 0
          ? {
              start: new Date(moves[0].createdAt),
              end: new Date(moves[moves.length - 1].createdAt),
            }
          : null,
    };
  }, [moves]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Total moves */}
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500">Total Moves</div>
        </CardContent>
      </Card>

      {/* Participants */}
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.uniqueActors}</div>
          <div className="text-sm text-gray-500">Participants</div>
        </CardContent>
      </Card>

      {/* Timespan */}
      <Card>
        <CardContent className="p-4">
          <div className="text-sm font-semibold text-gray-900">Duration</div>
          {stats.timespan ? (
            <div className="text-xs text-gray-500 mt-1">
              {format(stats.timespan.start, "MMM d")} →{" "}
              {format(stats.timespan.end, "MMM d, yyyy")}
            </div>
          ) : (
            <div className="text-xs text-gray-500">No data</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Move Type Distribution Chart
 */
function MoveTypeDistribution({ moves }: { moves: DialogueMove[] }) {
  const distribution = useMemo(() => {
    const counts: Record<string, number> = {};
    moves.forEach((move) => {
      counts[move.kind] = (counts[move.kind] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([kind, count]) => ({
        kind,
        count,
        percentage: (count / moves.length) * 100,
        ...getMoveIcon(kind),
      }))
      .sort((a, b) => b.count - a.count);
  }, [moves]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Move Type Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {distribution.map((item) => (
            <div key={item.kind} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className={`${item.color} p-1 rounded text-white`}>
                    {item.icon}
                  </div>
                  <span className="font-medium">{item.label}</span>
                </div>
                <span className="text-gray-600 text-xs">
                  {item.count} ({item.percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`${item.color} h-2 rounded-full transition-all`}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Main Dialogue Timeline Page
 */
export default function DialogueTimelinePage() {
  const params = useParams();
  const deliberationId = params.id as string;

  const [filterKind, setFilterKind] = useState<string | null>(null);
  const [filterActor, setFilterActor] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<"timeline" | "analytics">("timeline");

  // Fetch dialogue moves
  const { data: movesData, error: movesError, isLoading: movesLoading } = useSWR(
    `/api/dialogue/moves?deliberationId=${deliberationId}&limit=500&order=asc`,
    fetcher
  );

  // Fetch deliberation info
  const { data: delibData } = useSWR(
    `/api/deliberations/${deliberationId}`,
    fetcher
  );

  // Extract and fetch claim/argument texts for display
  const claimIds = useMemo(() => {
    if (!movesData?.items) return [];
    return Array.from(
      new Set(
        movesData.items
          .filter((m: DialogueMove) => m.targetType === "claim" && m.targetId)
          .map((m: DialogueMove) => m.targetId)
      )
    );
  }, [movesData]);

  const argIds = useMemo(() => {
    if (!movesData?.items) return [];
    return Array.from(
      new Set(
        movesData.items
          .filter((m: DialogueMove) => m.targetType === "argument" && m.targetId)
          .map((m: DialogueMove) => m.targetId)
      )
    );
  }, [movesData]);

  const { data: claimsData } = useSWR(
    claimIds.length > 0
      ? `/api/claims/batch?ids=${claimIds.join(",")}`
      : null,
    fetcher
  );

  const { data: argsData } = useSWR(
    argIds.length > 0
      ? `/api/arguments/batch?ids=${argIds.join(",")}`
      : null,
    fetcher
  );

  const claimTexts = useMemo(() => {
    const map = new Map<string, string>();
    if (claimsData?.claims) {
      claimsData.claims.forEach((c: any) => map.set(c.id, c.text));
    }
    return map;
  }, [claimsData]);

  const argTexts = useMemo(() => {
    const map = new Map<string, string>();
    if (argsData?.arguments) {
      argsData.arguments.forEach((a: any) => map.set(a.id, a.text));
    }
    return map;
  }, [argsData]);

  // Extract unique actor IDs and fetch user names
  const actorIds = useMemo(() => {
    if (!movesData?.items) return [];
    return Array.from(new Set(movesData.items.map((m: DialogueMove) => m.actorId)));
  }, [movesData]);

  const { data: usersData } = useSWR(
    actorIds.length > 0
      ? `/api/users/batch?ids=${actorIds.join(",")}`
      : null,
    fetcher
  );

  const userNames = useMemo(() => {
    const map = new Map<string, string>();
    if (usersData?.users) {
      usersData.users.forEach((u: any) => {
        const displayName = u.name || u.username || u.email?.split("@")[0] || `User ${u.id.slice(0, 8)}`;
        map.set(u.id, displayName);
      });
    }
    return map;
  }, [usersData]);

  // Filter moves
  const filteredMoves = useMemo(() => {
    if (!movesData?.items) return [];
    let filtered = [...movesData.items];

    if (filterKind) {
      filtered = filtered.filter((m: DialogueMove) => m.kind === filterKind);
    }

    if (filterActor) {
      filtered = filtered.filter((m: DialogueMove) => String(m.actorId) === filterActor);
    }

    // Apply sorting
    filtered.sort((a: DialogueMove, b: DialogueMove) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

    return filtered;
  }, [movesData, filterKind, filterActor, sortOrder]);

  // Get unique move kinds and actors for filters
  const uniqueKinds = useMemo(() => {
    if (!movesData?.items) return [];
    return Array.from(new Set(movesData.items.map((m: DialogueMove) => m.kind)));
  }, [movesData]);

  const uniqueActors = useMemo(() => {
    if (!movesData?.items) return [];
    return Array.from(new Set(movesData.items.map((m: DialogueMove) => String(m.actorId))));
  }, [movesData]);

  if (movesLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading dialogue timeline...</p>
          </div>
        </div>
      </div>
    );
  }

  if (movesError) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <div>
                <div className="font-semibold">Failed to load dialogue timeline</div>
                <div className="text-sm text-red-500 mt-1">{movesError.message}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const moves = filteredMoves as DialogueMove[];

  // Export function
  const handleExport = () => {
    const exportData = moves.map((move) => ({
      timestamp: format(new Date(move.createdAt), "yyyy-MM-dd HH:mm:ss"),
      moveType: move.kind,
      actor: move.actorId,
      targetType: move.targetType,
      targetId: move.targetId,
      targetText: move.targetType === "claim" 
        ? claimTexts.get(move.targetId || "") || ""
        : move.targetType === "argument"
        ? argTexts.get(move.targetId || "") || ""
        : "",
      payload: JSON.stringify(move.payload),
    }));

    // Convert to CSV
    const headers = ["Timestamp", "Move Type", "Actor", "Target Type", "Target ID", "Target Text", "Payload"];
    const csvRows = [
      headers.join(","),
      ...exportData.map((row) =>
        [
          row.timestamp,
          row.moveType,
          row.actor,
          row.targetType,
          row.targetId,
          `"${row.targetText.replace(/"/g, '""')}"`, // Escape quotes
          `"${row.payload.replace(/"/g, '""')}"`,
        ].join(",")
      ),
    ];

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `dialogue-timeline-${deliberationId}-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-gray-900">Dialogue Timeline</h1>
          <div className="flex items-center gap-3">
            {/* Sort dropdown */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
              className="menuv2--lite text-sm  rounded-lg px-2 tracking-wide py-2 "
            >
              <option value="asc">Oldest First</option>
              <option value="desc">Latest First</option>
            </select>
            <button className="btnv2 text-sm rounded-lg px-3 py-2 bg-white/50" onClick={handleExport}>
              <Download className="h-4 w-4 " />
              Export
            </button>
          </div>
        </div>
        {delibData?.deliberation && (
          <p className="text-gray-600">
            {delibData.deliberation.title || `Deliberation ${deliberationId.slice(0, 8)}...`}
          </p>
        )}
      </div>

      {/* View mode tabs */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="mb-6">
        <TabsList >
          <TabsTrigger value="timeline">Timeline View</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Timeline View */}
        <TabsContent value="timeline" className="mt-6">
          {/* Filters */}
          <Card className="mb-6 panelv2 py-2 ">
            <CardContent className="p-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Filters:</span>
                </div>

                {/* Move kind filter */}
                <select
                  value={filterKind || ""}
                  onChange={(e) => setFilterKind(e.target.value || null)}
                  className="menuv2--lite text-sm  rounded-lg px-3 py-1.5"
                >
                  <option value="">All Move Types</option>
                  {uniqueKinds.map((kind) => (
                    <option key={kind} value={kind}>
                      {kind}
                    </option>
                  ))}
                </select>

                {/* Actor filter */}
                <select
                  value={filterActor || ""}
                  onChange={(e) => setFilterActor(e.target.value || null)}
                  className="menuv2--lite text-sm  rounded-lg px-3 py-1.5"
                >
                  <option value="">All Participants</option>
                  {uniqueActors.map((actor) => (
                    <option key={actor} value={actor}>
                      Participant {actor.slice(0, 8)}...
                    </option>
                  ))}
                </select>

                {/* Clear filters */}
                {(filterKind || filterActor) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFilterKind(null);
                      setFilterActor(null);
                    }}
                  >
                    Clear Filters
                  </Button>
                )}

                <div className="ml-auto text-sm text-gray-500">
                  Showing {moves.length} of {movesData?.items?.length || 0} moves
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          {moves.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No dialogue moves found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="pl-4">
              {moves.map((move, index) => (
                <TimelineEventCard
                  key={move.id}
                  move={move}
                  isFirst={index === 0}
                  isLast={index === moves.length - 1}
                  claimTexts={claimTexts}
                  argTexts={argTexts}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Analytics View */}
        <TabsContent value="analytics" className="mt-6">
          <div className="space-y-6">
            <TimelineStats moves={movesData?.items || []} />
            <MoveTypeDistribution moves={movesData?.items || []} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
