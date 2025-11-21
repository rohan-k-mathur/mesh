/**
 * ThreadedDiscussionTab Component
 * 
 * Reddit/forum-style threaded view for deliberation discussions.
 * Combines propositions, claims, and arguments into unified discussion threads
 * with rich metadata, filtering, and quick actions.
 * 
 * Based on patterns from:
 * - app/deliberation/[id]/dialoguetimeline/page.tsx (threading logic)
 * - components/agora/DebateSheetReader.tsx (metadata badges, filters)
 * - components/discussion/DiscussionView.tsx (forum structure)
 * 
 * Part of DeepDivePanel V3 migration - Option A Implementation
 */

"use client";

import * as React from "react";
import { useState, useMemo, useEffect } from "react";
import useSWR from "swr";
import { format } from "date-fns";
import { BaseTabProps } from "./types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  MessageSquare,
  TrendingUp,
  Network,
  Filter,
  Download,
  RefreshCw,
  User,
  Clock,
  ChevronRight,
  Waypoints,
  Scale,
  FileText,
  BarChart3,
  Calendar,
  X,
} from "lucide-react";
import { SchemeBadge } from "@/components/aif/SchemeBadge";
import { CQStatusIndicator } from "@/components/aif/CQStatusIndicator";
import { AttackBadge } from "@/components/aif/AttackBadge";
import { PreferenceBadge } from "@/components/aif/PreferenceBadge";
import { ArgumentActionsSheet } from "@/components/arguments/ArgumentActionsSheet";
import { MiniNeighborhoodPreview } from "@/components/aif/MiniNeighborhoodPreview";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const fetcher = (url: string) => fetch(url, { cache: "no-store" }).then((r) => r.json());

/**
 * Unified thread node representing any discussion element
 */
interface ThreadNode {
  id: string;
  type: "proposition" | "claim" | "argument" | "dialogue_move";
  text: string;
  authorId: string;
  authorName?: string;
  timestamp: string;

  // Parent-child relationships
  parentId?: string | null;
  targetId?: string | null;
  targetType?: string | null;

  // Metadata
  argumentId?: string;
  claimId?: string;
  schemeKey?: string;
  schemeName?: string;
  cqRequired?: number;
  cqSatisfied?: number;
  support?: number;
  attacks?: { REBUTS: number; UNDERCUTS: number; UNDERMINES: number };
  preferences?: { preferredBy: number; dispreferredBy: number };

  // Thread state
  responses?: ThreadNode[];
  isExpanded?: boolean;
  depth?: number;
}

/**
 * Props for ThreadedDiscussionTab
 */
export interface ThreadedDiscussionTabProps extends BaseTabProps {
  /** Current user ID for actions */
  currentUserId?: string;
}

/**
 * Group items into threads based on reply/target relationships
 */
function buildThreadHierarchy(items: ThreadNode[]): ThreadNode[] {
  const nodeMap = new Map<string, ThreadNode>(items.map((n) => [n.id, { ...n, responses: [], depth: 0 }]));
  const roots: ThreadNode[] = [];

  // First pass: identify roots and build parent-child links
  for (const node of nodeMap.values()) {
    const parentKey = node.parentId || node.targetId;
    if (!parentKey || !nodeMap.has(parentKey)) {
      roots.push(node);
    } else {
      const parent = nodeMap.get(parentKey)!;
      parent.responses = parent.responses || [];
      parent.responses.push(node);
      node.depth = (parent.depth || 0) + 1;
    }
  }

  // Sort roots by timestamp (newest first by default)
  roots.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Recursively sort responses
  const sortResponses = (node: ThreadNode) => {
    if (node.responses && node.responses.length > 0) {
      node.responses.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      node.responses.forEach(sortResponses);
    }
  };
  roots.forEach(sortResponses);

  return roots;
}

/**
 * ThreadCard Component - Renders a single thread with nested responses
 */
function ThreadCard({
  node,
  isExpanded,
  onToggle,
  onNodeClick,
  onPreview,
  depth = 0,
  userNames,
  aifMetadata,
}: {
  node: ThreadNode;
  isExpanded: boolean;
  onToggle: () => void;
  onNodeClick: (node: ThreadNode) => void;
  onPreview: (nodeId: string) => void;
  depth?: number;
  userNames: Map<string, string>;
  aifMetadata: Map<string, any>;
}) {
  const timestamp = new Date(node.timestamp);
  const hasResponses = node.responses && node.responses.length > 0;
  const authorName = node.authorName || userNames.get(node.authorId) || `User ${node.authorId?.slice(0, 8)}`;

  // Get AIF metadata if available
  const aif = node.argumentId ? aifMetadata.get(node.argumentId) : null;

  // Calculate indent based on depth (max 3 levels)
  const indent = Math.min(depth, 3) * 2; // 2rem per level

  return (
    <div className="thread-card" style={{ marginLeft: depth > 0 ? `${indent}rem` : 0 }}>
      <Card className={`sidebarv2 group-hover:shadow-md transition-shadow ${depth === 0 ? "border-l-4 border-l-indigo-500" : ""}`}>
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2 flex-1">
              {/* Type icon */}
              <div className={`p-2 rounded-lg ${
                node.type === "proposition" ? "bg-sky-500" :
                node.type === "claim" ? "bg-indigo-500" :
                node.type === "argument" ? "bg-purple-500" :
                "bg-gray-500"
              } text-white`}>
                <MessageSquare className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-500 uppercase">
                    {node.type}
                  </span>
                  {depth > 0 && (
                    <span className="text-xs text-gray-400">→ Reply</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <User className="h-3 w-3" />
                  <span>{authorName}</span>
                  <span>•</span>
                  <Clock className="h-3 w-3" />
                  <span>{format(timestamp, "MMM d, yyyy 'at' h:mm a")}</span>
                  {hasResponses && (
                    <>
                      <span>•</span>
                      <span className="text-indigo-600 font-medium">
                        {node.responses!.length} {node.responses!.length === 1 ? "response" : "responses"}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {hasResponses && (
                <Button variant="ghost" size="sm" onClick={onToggle} className="h-8 w-8 p-0">
                  <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                </Button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="mb-3">
            <p className="text-sm text-gray-800 leading-relaxed">
              {node.text}
            </p>
          </div>

          {/* Metadata badges */}
          {(aif || node.support != null) && (
            <div className="flex flex-wrap gap-2 mb-3">
              {aif?.scheme && (
                <SchemeBadge schemeKey={aif.scheme.key} schemeName={aif.scheme.name} />
              )}
              {aif?.cq && (
                <CQStatusIndicator required={aif.cq.required} satisfied={aif.cq.satisfied} />
              )}
              {aif?.attacks && (
                <AttackBadge attacks={aif.attacks} />
              )}
              {aif?.preferences && (
                <PreferenceBadge
                  preferredBy={aif.preferences.preferredBy}
                  dispreferredBy={aif.preferences.dispreferredBy}
                />
              )}
              {node.support != null && (
                <Badge variant="secondary" className="text-xs">
                  Support: {(node.support * 100).toFixed(0)}%
                </Badge>
              )}
            </div>
          )}

          {/* Support bar */}
          {node.support != null && (
            <div className="mb-3">
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all"
                  style={{ width: `${Math.max(0, Math.min(1, node.support)) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNodeClick(node)}
              className="text-xs text-indigo-600 hover:underline font-medium"
            >
              View Details
            </button>
            {node.argumentId && (
              <button
                onClick={() => onPreview(node.id)}
                className="text-xs text-gray-600 hover:underline flex items-center gap-1"
              >
                <Waypoints className="w-3 h-3" />
                Preview Network
              </button>
            )}
            <button className="text-xs text-gray-600 hover:underline">
              Reply
            </button>
            <button className="text-xs text-gray-600 hover:underline">
              Support
            </button>
            <button className="text-xs text-gray-600 hover:underline">
              Attack
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Nested responses */}
      {isExpanded && hasResponses && (
        <div className="mt-3 space-y-3">
          {node.responses!.map((response) => (
            <ThreadCard
              key={response.id}
              node={response}
              isExpanded={true} // Auto-expand nested responses (can make configurable)
              onToggle={() => {}} // Nested responses don't collapse individually
              onNodeClick={onNodeClick}
              onPreview={onPreview}
              depth={depth + 1}
              userNames={userNames}
              aifMetadata={aifMetadata}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Statistics Summary Component
 */
function ThreadStats({ threads, totalItems }: { threads: ThreadNode[]; totalItems: number }) {
  const stats = useMemo(() => {
    const typeCount: Record<string, number> = {};
    const countTypes = (node: ThreadNode) => {
      typeCount[node.type] = (typeCount[node.type] || 0) + 1;
      node.responses?.forEach(countTypes);
    };
    threads.forEach(countTypes);

    return {
      threads: threads.length,
      totalItems,
      byType: typeCount,
    };
  }, [threads, totalItems]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <Card className="surfacev2 panel-edge">
        <CardContent className="p-3">
          <div className="text-2xl font-bold text-gray-900">{stats.threads}</div>
          <div className="text-xs text-gray-500">Threads</div>
        </CardContent>
      </Card>
      <Card className="surfacev2 panel-edge">
        <CardContent className="p-3">
          <div className="text-2xl font-bold text-gray-900">{stats.totalItems}</div>
          <div className="text-xs text-gray-500">Total Items</div>
        </CardContent>
      </Card>
      <Card className="surfacev2 panel-edge">
        <CardContent className="p-3">
          <div className="text-2xl font-bold text-gray-900">{stats.byType.argument || 0}</div>
          <div className="text-xs text-gray-500">Arguments</div>
        </CardContent>
      </Card>
      <Card className="surfacev2 panel-edge">
        <CardContent className="p-3">
          <div className="text-2xl font-bold text-gray-900">{stats.byType.proposition || 0}</div>
          <div className="text-xs text-gray-500">Propositions</div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Main ThreadedDiscussionTab Component
 */
export function ThreadedDiscussionTab({
  deliberationId,
  currentUserId,
  className,
}: ThreadedDiscussionTabProps) {
  const [viewMode, setViewMode] = useState<"timeline" | "analytics">("timeline");
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterScheme, setFilterScheme] = useState<string | null>(null);
  const [filterOpenCQs, setFilterOpenCQs] = useState(false);
  const [sortOrder, setSortOrder] = useState<"chrono" | "support" | "activity">("chrono");
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const [dateRange, setDateRange] = useState<{ start: string | null; end: string | null }>({
    start: null,
    end: null,
  });

  // Modal state
  const [previewNodeId, setPreviewNodeId] = useState<string | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [actionsSheetOpen, setActionsSheetOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<ThreadNode | null>(null);

  // TODO: Fetch real data - these are placeholder queries
  // In production, create unified API endpoint that returns all discussion items
  const { data: propositionsData } = useSWR(
    `/api/deliberations/${deliberationId}/propositions?limit=100`,
    fetcher
  );

  const { data: claimsData } = useSWR(
    `/api/deliberations/${deliberationId}/claims?limit=100`,
    fetcher
  );

  const { data: aifData } = useSWR(
    `/api/deliberations/${deliberationId}/arguments/aif?limit=100`,
    fetcher
  );

  // Fetch user names for authors
  const authorIds = useMemo(() => {
    const ids = new Set<string>();
    // Extract unique author IDs from all data sources
    // TODO: Implement based on actual data structure
    return Array.from(ids);
  }, []);

  const { data: usersData } = useSWR(
    authorIds.length > 0 ? `/api/users/batch?ids=${authorIds.join(",")}` : null,
    fetcher
  );

  const userNames = useMemo(() => {
    const map = new Map<string, string>();
    if (usersData?.users) {
      usersData.users.forEach((u: any) => {
        const displayName = u.name || u.username || `User ${u.id.slice(0, 8)}`;
        map.set(u.id, displayName);
      });
    }
    return map;
  }, [usersData]);

  // Build AIF metadata lookup
  const aifMetadata = useMemo(() => {
    const map = new Map<string, any>();
    if (aifData?.items) {
      aifData.items.forEach((item: any) => {
        map.set(item.id, item.aif);
      });
    }
    return map;
  }, [aifData]);

  // Convert data to unified ThreadNode format
  const allNodes = useMemo((): ThreadNode[] => {
    const nodes: ThreadNode[] = [];

    // Add propositions
    if (propositionsData?.propositions) {
      propositionsData.propositions.forEach((p: any) => {
        nodes.push({
          id: p.id,
          type: "proposition",
          text: p.text || p.content || "",
          authorId: p.authorId || p.createdById || "",
          timestamp: p.createdAt,
          parentId: p.replyToId || null,
        });
      });
    }

    // Add claims
    if (claimsData?.claims) {
      claimsData.claims.forEach((c: any) => {
        nodes.push({
          id: c.id,
          type: "claim",
          text: c.text,
          authorId: c.authorId || c.createdById || "",
          timestamp: c.createdAt,
          claimId: c.id,
          parentId: c.replyToId || null,
        });
      });
    }

    // Add arguments (with AIF metadata)
    if (aifData?.items) {
      aifData.items.forEach((arg: any) => {
        const aif = arg.aif || {};
        nodes.push({
          id: arg.id,
          type: "argument",
          text: arg.text || arg.conclusion?.text || "",
          authorId: arg.authorId || arg.createdById || "",
          timestamp: arg.createdAt,
          argumentId: arg.id,
          claimId: arg.conclusionClaimId,
          schemeKey: aif.scheme?.key,
          schemeName: aif.scheme?.name,
          cqRequired: aif.cq?.required,
          cqSatisfied: aif.cq?.satisfied,
          support: arg.support,
          attacks: aif.attacks,
          preferences: aif.preferences,
        });
      });
    }

    return nodes;
  }, [propositionsData, claimsData, aifData]);

  // Apply filters
  const filteredNodes = useMemo(() => {
    let filtered = [...allNodes];

    if (filterType) {
      filtered = filtered.filter((n) => n.type === filterType);
    }

    if (filterScheme) {
      filtered = filtered.filter((n) => n.schemeKey === filterScheme);
    }

    if (filterOpenCQs) {
      filtered = filtered.filter((n) => {
        return n.cqRequired && n.cqSatisfied != null && n.cqSatisfied < n.cqRequired;
      });
    }

    if (dateRange.start || dateRange.end) {
      filtered = filtered.filter((n) => {
        const nodeDate = new Date(n.timestamp);
        if (dateRange.start && nodeDate < new Date(dateRange.start)) return false;
        if (dateRange.end) {
          const endDate = new Date(dateRange.end);
          endDate.setHours(23, 59, 59, 999);
          if (nodeDate > endDate) return false;
        }
        return true;
      });
    }

    return filtered;
  }, [allNodes, filterType, filterScheme, filterOpenCQs, dateRange]);

  // Build thread hierarchy
  const threads = useMemo(() => {
    const hierarchy = buildThreadHierarchy(filteredNodes);

    // Apply sorting
    if (sortOrder === "support") {
      hierarchy.sort((a, b) => (b.support || 0) - (a.support || 0));
    } else if (sortOrder === "activity") {
      // Sort by number of responses
      hierarchy.sort((a, b) => (b.responses?.length || 0) - (a.responses?.length || 0));
    }
    // "chrono" is already applied in buildThreadHierarchy

    return hierarchy;
  }, [filteredNodes, sortOrder]);

  // Get unique schemes for filter
  const availableSchemes = useMemo(() => {
    const schemes = new Set<string>();
    allNodes.forEach((n) => {
      if (n.schemeKey) schemes.add(n.schemeKey);
    });
    return Array.from(schemes).sort();
  }, [allNodes]);

  // Toggle thread expansion
  const toggleThread = (threadId: string) => {
    setExpandedThreads((prev) => {
      const next = new Set(prev);
      if (next.has(threadId)) {
        next.delete(threadId);
      } else {
        next.add(threadId);
      }
      return next;
    });
  };

  // Handle node click
  const handleNodeClick = (node: ThreadNode) => {
    if (!node.argumentId) return;
    setSelectedNode(node);
    setActionsSheetOpen(true);
  };

  // Handle preview
  const handlePreview = (nodeId: string) => {
    setPreviewNodeId(nodeId);
    setPreviewModalOpen(true);
  };

  // Fetch neighborhood for preview
  const previewedArgumentId = useMemo(() => {
    if (!previewNodeId) return null;
    const node = allNodes.find((n) => n.id === previewNodeId);
    return node?.argumentId || null;
  }, [previewNodeId, allNodes]);

  const { data: neighborhoodData, error: neighborhoodError, isLoading: neighborhoodLoading } = useSWR(
    previewedArgumentId ? `/api/arguments/${previewedArgumentId}/aif-neighborhood?depth=1` : null,
    fetcher
  );

  return (
    <div className={className}>
      {/* Overview Bar */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-slate-200 p-3 rounded-lg mb-4">
        <div className="flex items-center justify-between mb-3">
          <ThreadStats threads={threads} totalItems={allNodes.length} />

          <div className="flex items-center gap-2">
            {/* Quick action launchers to other tabs */}
            <Button variant="outline" size="sm" title="View Argument Map">
              <Network className="w-4 h-4 mr-1" />
              Map
            </Button>
            <Button variant="outline" size="sm" title="View Ludics">
              <Scale className="w-4 h-4 mr-1" />
              Ludics
            </Button>
            <Button variant="outline" size="sm" title="View Analytics">
              <BarChart3 className="w-4 h-4 mr-1" />
              Analytics
            </Button>
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <Filter className="w-4 h-4 text-gray-500" />
          
          <select
            className="menuv2--lite text-sm rounded-lg px-3 py-1.5"
            value={filterType || ""}
            onChange={(e) => setFilterType(e.target.value || null)}
          >
            <option value="">All types</option>
            <option value="proposition">Propositions</option>
            <option value="claim">Claims</option>
            <option value="argument">Arguments</option>
          </select>

          <select
            className="menuv2--lite text-sm rounded-lg px-3 py-1.5"
            value={filterScheme || ""}
            onChange={(e) => setFilterScheme(e.target.value || null)}
          >
            <option value="">All schemes</option>
            {availableSchemes.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>

          <label className="text-xs inline-flex items-center gap-1">
            <input
              type="checkbox"
              checked={filterOpenCQs}
              onChange={(e) => setFilterOpenCQs(e.target.checked)}
            />
            Open CQs only
          </label>

          <select
            className="menuv2--lite text-sm rounded-lg px-3 py-1.5 ml-auto"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
          >
            <option value="chrono">Chronological</option>
            <option value="support">By Support</option>
            <option value="activity">Most Active</option>
          </select>

          {(filterType || filterScheme || filterOpenCQs) && (
            <button
              className="text-xs text-red-600 hover:underline"
              onClick={() => {
                setFilterType(null);
                setFilterScheme(null);
                setFilterOpenCQs(false);
              }}
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="space-y-4">
        <TabsList className="font-normal tracking-wide">
          <TabsTrigger value="timeline">
            <MessageSquare className="w-4 h-4 mr-2" />
            Discussion
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <TrendingUp className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-4">
          {threads.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No discussion items found</p>
                <p className="text-xs text-gray-400 mt-2">
                  {allNodes.length > 0
                    ? "Try adjusting your filters"
                    : "Be the first to start the discussion!"}
                </p>
              </CardContent>
            </Card>
          ) : (
            threads.map((thread) => (
              <ThreadCard
                key={thread.id}
                node={thread}
                isExpanded={expandedThreads.has(thread.id)}
                onToggle={() => toggleThread(thread.id)}
                onNodeClick={handleNodeClick}
                onPreview={handlePreview}
                userNames={userNames}
                aifMetadata={aifMetadata}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card className="panelv2">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Discussion Analytics</h3>
              <p className="text-sm text-gray-600">
                Analytics view coming soon: activity heatmap, participation stats, trending topics, etc.
              </p>
              {/* TODO: Add charts similar to DialogueTimeline analytics */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Modal */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="max-w-[750px] bg-white/15 backdrop-blur-md border-2 border-white rounded-xl">
          <DialogHeader>
            <DialogTitle className="tracking-wide font-medium">AIF Neighborhood Preview</DialogTitle>
          </DialogHeader>
          <div className="py-0">
            <MiniNeighborhoodPreview
              data={neighborhoodData}
              loading={neighborhoodLoading}
              error={neighborhoodError}
              maxWidth={700}
              maxHeight={400}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Argument Actions Sheet */}
      {selectedNode && (
        <ArgumentActionsSheet
          open={actionsSheetOpen}
          onOpenChange={setActionsSheetOpen}
          deliberationId={deliberationId}
          authorId={currentUserId || ""}
          selectedArgument={{
            id: selectedNode.argumentId || selectedNode.id,
            text: selectedNode.text,
            conclusionText: selectedNode.text,
            schemeKey: selectedNode.schemeKey,
          }}
          onRefresh={() => {
            // Trigger data refresh
            // TODO: Implement refresh mechanism
          }}
        />
      )}
    </div>
  );
}
