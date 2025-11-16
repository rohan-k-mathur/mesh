# Argument Chain Implementation Roadmap - Phase 5: Integration & Polish

## Table of Contents
- [Part 9: Integration with DeepDive v3](#part-9-integration-with-deepdive-v3)
- [Part 10: Testing Strategy](#part-10-testing-strategy)
- [Part 11: Deployment & Production Readiness](#part-11-deployment--production-readiness)

---

## Part 9: Integration with DeepDive v3

### 6.1 DeepDive v3 Integration

#### Task 6.1: Add ArgumentChains Tab to DeepDive v3
**File**: `components/deep-dive-v3/DeepDiveV3Tabs.tsx`

```typescript
import { ArgumentChainsTab } from "./ArgumentChainsTab";

// Add to existing DeepDiveTabs enum:
export enum DeepDiveTab {
  ARGUMENTS = "arguments",
  ARGUMENT_MAP = "argumentMap",
  SCHEME_NET = "schemeNet",
  ARGUMENT_CHAINS = "argumentChains", // NEW
  DISCUSSION = "discussion",
  CITATIONS = "citations",
  SUMMARY = "summary",
}

// Add to tab configuration:
const tabConfig = [
  {
    value: DeepDiveTab.ARGUMENTS,
    label: "Arguments",
    icon: MessageSquare,
  },
  {
    value: DeepDiveTab.ARGUMENT_MAP,
    label: "Map",
    icon: Network,
  },
  {
    value: DeepDiveTab.SCHEME_NET,
    label: "SchemeNet",
    icon: GitBranch,
  },
  {
    value: DeepDiveTab.ARGUMENT_CHAINS, // NEW
    label: "Chains",
    icon: Link2,
  },
  {
    value: DeepDiveTab.DISCUSSION,
    label: "Discussion",
    icon: MessageCircle,
  },
  {
    value: DeepDiveTab.CITATIONS,
    label: "Citations",
    icon: FileText,
  },
  {
    value: DeepDiveTab.SUMMARY,
    label: "Summary",
    icon: BookOpen,
  },
];

// Add to TabsContent components:
<TabsContent value={DeepDiveTab.ARGUMENT_CHAINS} className="flex-1">
  <ArgumentChainsTab deliberationId={deliberationId} />
</TabsContent>
```

**Acceptance Criteria**:
- [x] New tab added to DeepDive navigation
- [x] Tab icon and label
- [x] Tab content area
- [x] Proper routing

**Estimated Time**: 0.5 hours

---

#### Task 6.2: Create ArgumentChainsTab Component
**File**: `components/deep-dive-v3/ArgumentChainsTab.tsx`

```typescript
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Link2, Plus, MoreVertical, Edit, Trash2, Eye, Users, Lock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

interface ArgumentChain {
  id: string;
  name: string;
  description?: string;
  chainType: "causal" | "linear" | "dialectical";
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  creator: {
    name: string;
    image?: string;
  };
  _count: {
    nodes: number;
    edges: number;
    permissions: number;
  };
}

interface ArgumentChainsTabProps {
  deliberationId: string;
}

export function ArgumentChainsTab({ deliberationId }: ArgumentChainsTabProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [chains, setChains] = useState<ArgumentChain[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchChains();
  }, [deliberationId]);

  const fetchChains = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/deliberations/${deliberationId}/argument-chains`);
      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      setChains(data.chains || []);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to load argument chains");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateChain = () => {
    router.push(`/app/deliberations/${deliberationId}/chains/new`);
  };

  const handleOpenChain = (chainId: string) => {
    router.push(`/app/chains/${chainId}`);
  };

  const handleDeleteChain = async (chainId: string) => {
    if (!confirm("Delete this argument chain? This cannot be undone.")) return;

    try {
      const res = await fetch(`/api/argument-chains/${chainId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      setChains((prev) => prev.filter((c) => c.id !== chainId));
      toast.success("Chain deleted");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete chain");
    }
  };

  const getChainTypeColor = (type: string) => {
    switch (type) {
      case "causal":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "linear":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "dialectical":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const canEditChain = (chain: ArgumentChain) => {
    return session?.user?.id === chain.createdBy;
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-4 w-full mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Argument Chains</h2>
            <p className="text-muted-foreground mt-1">
              Connect and analyze multiple arguments across this deliberation
            </p>
          </div>
          <Button onClick={handleCreateChain}>
            <Plus className="h-4 w-4 mr-2" />
            New Chain
          </Button>
        </div>
      </div>

      {/* Chain List */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-4">
          {chains.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Link2 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">No chains yet</h3>
                <p className="text-muted-foreground text-center mb-4 max-w-md">
                  Create your first argument chain to connect and analyze multiple arguments
                  in a structured way.
                </p>
                <Button onClick={handleCreateChain}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Chain
                </Button>
              </CardContent>
            </Card>
          ) : (
            chains.map((chain) => (
              <Card
                key={chain.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleOpenChain(chain.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{chain.name}</CardTitle>
                        <Badge
                          variant="secondary"
                          className={getChainTypeColor(chain.chainType)}
                        >
                          {chain.chainType}
                        </Badge>
                        {chain.isPublic ? (
                          <Eye className="h-4 w-4 text-muted-foreground" title="Public" />
                        ) : (
                          <Lock className="h-4 w-4 text-muted-foreground" title="Private" />
                        )}
                      </div>
                      {chain.description && (
                        <CardDescription className="line-clamp-2">
                          {chain.description}
                        </CardDescription>
                      )}
                    </div>

                    {canEditChain(chain) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenChain(chain.id);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Chain
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteChain(chain.id);
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Chain
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span>
                        {chain._count.nodes} {chain._count.nodes === 1 ? "argument" : "arguments"}
                      </span>
                      <span>
                        {chain._count.edges}{" "}
                        {chain._count.edges === 1 ? "connection" : "connections"}
                      </span>
                      {chain._count.permissions > 0 && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {chain._count.permissions + 1}{" "}
                          {chain._count.permissions + 1 === 1 ? "collaborator" : "collaborators"}
                        </span>
                      )}
                    </div>
                    <div>
                      <span>Updated {formatDistanceToNow(new Date(chain.updatedAt), { addSuffix: true })}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                    <img
                      src={chain.creator.image || "/default-avatar.png"}
                      alt={chain.creator.name}
                      className="h-6 w-6 rounded-full"
                    />
                    <span className="text-sm text-muted-foreground">
                      by {chain.creator.name}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
```

**Acceptance Criteria**:
- [x] Displays all chains for deliberation
- [x] Chain cards with metadata
- [x] Type badges (causal/linear/dialectical)
- [x] Public/private indicators
- [x] Argument/connection counts
- [x] Creator info and timestamps
- [x] Create new chain button
- [x] Edit/delete dropdown (creator only)
- [x] Click to open chain
- [x] Empty state with CTA
- [x] Loading skeletons

**Estimated Time**: 3 hours

---

#### Task 6.3: Link from ArgumentConstructor to Chains
**File**: `components/argumentation/ArgumentConstructor.tsx`

```typescript
import { Button } from "@/components/ui/button";
import { Link2 } from "lucide-react";
import { useRouter } from "next/navigation";

// Add to ArgumentConstructor header/toolbar:
export function ArgumentConstructor({ deliberationId, argumentId }: Props) {
  const router = useRouter();

  const handleOpenChains = () => {
    router.push(`/app/deliberations/${deliberationId}#argumentChains`);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Existing header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2>Construct Argument</h2>
        
        <div className="flex items-center gap-2">
          {/* Existing buttons */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenChains}
            title="Open Argument Chains"
          >
            <Link2 className="h-4 w-4 mr-2" />
            Chains
          </Button>
        </div>
      </div>

      {/* Rest of ArgumentConstructor */}
    </div>
  );
}
```

**Also add "Add to Chain" context menu option**:

```typescript
// In ArgumentConstructor or ArgumentCard:
<DropdownMenu>
  <DropdownMenuTrigger>...</DropdownMenuTrigger>
  <DropdownMenuContent>
    {/* Existing options */}
    <DropdownMenuItem onClick={handleAddToChain}>
      <Link2 className="h-4 w-4 mr-2" />
      Add to Chain
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>

// Handler:
const handleAddToChain = async () => {
  // Open dialog to select chain
  const selectedChainId = await openChainSelector(deliberationId);
  
  if (!selectedChainId) return;

  try {
    const res = await fetch(`/api/argument-chains/${selectedChainId}/nodes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        argumentId: argument.id,
        role: "premise", // or let user select
      }),
    });

    if (!res.ok) throw new Error("Failed to add");

    toast.success("Added to chain");
    router.push(`/app/chains/${selectedChainId}`);
  } catch (error) {
    console.error("Add to chain error:", error);
    toast.error("Failed to add to chain");
  }
};
```

**Acceptance Criteria**:
- [x] "Chains" button in ArgumentConstructor header
- [x] Navigates to DeepDive Chains tab
- [x] "Add to Chain" context menu option
- [x] Chain selector dialog
- [x] Adds argument to selected chain
- [x] Navigates to chain editor

**Estimated Time**: 2 hours

---

#### Task 6.4: SchemeNet Nesting Display
**File**: `components/chains/ArgumentChainNode.tsx`

Update the node to show SchemeNet indicator:

```typescript
import { GitBranch } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function ArgumentChainNode({ data }: NodeProps) {
  const { argument, role, hasSchemeNet } = data;

  return (
    <div className="bg-white border-2 rounded-lg shadow-md p-4 min-w-[280px] max-w-[320px]">
      {/* Existing header */}
      <div className="flex items-center justify-between mb-2">
        <Badge>{role}</Badge>
        {hasSchemeNet && (
          <div
            className="flex items-center gap-1 text-xs text-purple-600"
            title="Contains SchemeNet analysis"
          >
            <GitBranch className="h-3 w-3" />
            <span>SchemeNet</span>
          </div>
        )}
      </div>

      {/* Rest of node */}
      <div className="space-y-2">
        <p className="text-sm font-medium line-clamp-2">{argument.conclusion}</p>
        
        {argument.premises && argument.premises.length > 0 && (
          <div className="text-xs text-muted-foreground">
            {argument.premises.length}{" "}
            {argument.premises.length === 1 ? "premise" : "premises"}
          </div>
        )}

        {/* Click to view SchemeNet */}
        {hasSchemeNet && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 text-xs"
            onClick={() => {
              // Open SchemeNet viewer in modal or side panel
              window.open(`/app/arguments/${argument.id}/scheme-net`, "_blank");
            }}
          >
            <GitBranch className="h-3 w-3 mr-1" />
            View SchemeNet
          </Button>
        )}
      </div>

      {/* Handles for edges */}
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
```

**Update node data fetching**:

```typescript
// In ChainCanvas or data fetching:
const nodeData = {
  argument: node.argument,
  role: node.role,
  hasSchemeNet: node.argument.schemeSteps?.length > 0, // Check if SchemeNet exists
};
```

**Acceptance Criteria**:
- [x] SchemeNet badge on nodes
- [x] Icon indicator
- [x] "View SchemeNet" button
- [x] Opens SchemeNet in new tab/modal
- [x] Check for existence of SchemeNet data

**Estimated Time**: 1.5 hours

---

#### Task 6.5: Navigation Breadcrumbs
**File**: `components/chains/ChainBreadcrumbs.tsx`

```typescript
"use client";

import React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Home, MessageSquare, Link2 } from "lucide-react";

interface ChainBreadcrumbsProps {
  deliberation: {
    id: string;
    title: string;
  };
  chain: {
    id: string;
    name: string;
  };
}

export function ChainBreadcrumbs({ deliberation, chain }: ChainBreadcrumbsProps) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/app">
            <Home className="h-4 w-4" />
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        <BreadcrumbSeparator />
        
        <BreadcrumbItem>
          <BreadcrumbLink href={`/app/deliberations/${deliberation.id}`}>
            <MessageSquare className="h-4 w-4 mr-2" />
            {deliberation.title}
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        <BreadcrumbSeparator />
        
        <BreadcrumbItem>
          <BreadcrumbLink href={`/app/deliberations/${deliberation.id}#argumentChains`}>
            <Link2 className="h-4 w-4 mr-2" />
            Chains
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        <BreadcrumbSeparator />
        
        <BreadcrumbItem>
          <BreadcrumbPage>{chain.name}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
```

**Add to ArgumentChainConstructor**:

```typescript
import { ChainBreadcrumbs } from "./ChainBreadcrumbs";

export function ArgumentChainConstructor({ chainId }: Props) {
  const [chain, setChain] = useState(null);
  const [deliberation, setDeliberation] = useState(null);

  useEffect(() => {
    fetchChainAndDeliberation();
  }, [chainId]);

  return (
    <div className="flex flex-col h-full">
      {/* Breadcrumbs */}
      <div className="p-4 border-b">
        {chain && deliberation && (
          <ChainBreadcrumbs
            deliberation={deliberation}
            chain={chain}
          />
        )}
      </div>

      {/* Rest of constructor */}
    </div>
  );
}
```

**Acceptance Criteria**:
- [x] Breadcrumb navigation
- [x] Home → Deliberation → Chains → Current Chain
- [x] All links functional
- [x] Icons for each level
- [x] Current page highlighted

**Estimated Time**: 1 hour

---

### 6.2 Polish & Refinements

#### Task 6.6: Keyboard Shortcuts
**File**: `components/chains/ArgumentChainConstructor.tsx`

```typescript
import { useEffect, useCallback } from "react";
import { useHotkeys } from "react-hotkeys-hook";

export function ArgumentChainConstructor({ chainId }: Props) {
  const { addNode, deleteSelected, exportChain, fitView } = useChainEditorStore();

  // Keyboard shortcuts
  useHotkeys("ctrl+n, cmd+n", (e) => {
    e.preventDefault();
    // Open argument palette or create node dialog
  });

  useHotkeys("delete, backspace", (e) => {
    e.preventDefault();
    deleteSelected();
  });

  useHotkeys("ctrl+e, cmd+e", (e) => {
    e.preventDefault();
    exportChain();
  });

  useHotkeys("ctrl+f, cmd+f", (e) => {
    e.preventDefault();
    fitView();
  });

  useHotkeys("ctrl+z, cmd+z", (e) => {
    e.preventDefault();
    // Undo last action
  });

  useHotkeys("ctrl+shift+z, cmd+shift+z", (e) => {
    e.preventDefault();
    // Redo last action
  });

  useHotkeys("ctrl+a, cmd+a", (e) => {
    e.preventDefault();
    // Select all nodes
  });

  useHotkeys("?", () => {
    // Open keyboard shortcuts help dialog
    setShowShortcuts(true);
  });

  return (
    <>
      {/* Chain editor */}
      
      {/* Keyboard shortcuts dialog */}
      <KeyboardShortcutsDialog
        open={showShortcuts}
        onOpenChange={setShowShortcuts}
      />
    </>
  );
}
```

**Shortcuts Dialog**:

```typescript
function KeyboardShortcutsDialog({ open, onOpenChange }: Props) {
  const shortcuts = [
    { key: "Ctrl/Cmd + N", action: "New node" },
    { key: "Delete/Backspace", action: "Delete selected" },
    { key: "Ctrl/Cmd + E", action: "Export chain" },
    { key: "Ctrl/Cmd + F", action: "Fit to view" },
    { key: "Ctrl/Cmd + Z", action: "Undo" },
    { key: "Ctrl/Cmd + Shift + Z", action: "Redo" },
    { key: "Ctrl/Cmd + A", action: "Select all" },
    { key: "?", action: "Show shortcuts" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {shortcuts.map((s) => (
            <div key={s.key} className="flex items-center justify-between">
              <span className="text-sm">{s.action}</span>
              <kbd className="px-2 py-1 text-xs bg-muted rounded">{s.key}</kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

**Dependencies**:
```json
{
  "react-hotkeys-hook": "^4.4.1"
}
```

**Acceptance Criteria**:
- [x] Common keyboard shortcuts
- [x] Undo/redo support
- [x] Help dialog (?)
- [x] Cross-platform (Ctrl/Cmd)
- [x] Prevent default browser actions

**Estimated Time**: 2 hours

---

#### Task 6.7: Undo/Redo System
**File**: `lib/stores/chainEditorStore.ts`

```typescript
interface HistoryState {
  nodes: Node[];
  edges: Edge[];
}

interface ChainEditorStore {
  // Existing state...
  history: HistoryState[];
  historyIndex: number;
  maxHistorySize: number;

  // Actions
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

export const useChainEditorStore = create<ChainEditorStore>((set, get) => ({
  // Existing state...
  history: [],
  historyIndex: -1,
  maxHistorySize: 50,

  pushHistory: () => {
    const { nodes, edges, history, historyIndex, maxHistorySize } = get();

    // Create snapshot
    const snapshot: HistoryState = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    };

    // Trim future history if we're not at the end
    const newHistory = history.slice(0, historyIndex + 1);

    // Add snapshot
    newHistory.push(snapshot);

    // Limit history size
    if (newHistory.length > maxHistorySize) {
      newHistory.shift();
    }

    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  undo: () => {
    const { history, historyIndex } = get();

    if (historyIndex <= 0) return;

    const prevIndex = historyIndex - 1;
    const prevState = history[prevIndex];

    set({
      nodes: JSON.parse(JSON.stringify(prevState.nodes)),
      edges: JSON.parse(JSON.stringify(prevState.edges)),
      historyIndex: prevIndex,
    });
  },

  redo: () => {
    const { history, historyIndex } = get();

    if (historyIndex >= history.length - 1) return;

    const nextIndex = historyIndex + 1;
    const nextState = history[nextIndex];

    set({
      nodes: JSON.parse(JSON.stringify(nextState.nodes)),
      edges: JSON.parse(JSON.stringify(nextState.edges)),
      historyIndex: nextIndex,
    });
  },

  canUndo: () => {
    const { historyIndex } = get();
    return historyIndex > 0;
  },

  canRedo: () => {
    const { history, historyIndex } = get();
    return historyIndex < history.length - 1;
  },

  // Modify existing actions to push history:
  addNode: (node) => {
    set((state) => ({ nodes: [...state.nodes, node] }));
    get().pushHistory();
  },

  updateNode: (nodeId, updates) => {
    set((state) => ({
      nodes: state.nodes.map((n) => (n.id === nodeId ? { ...n, ...updates } : n)),
    }));
    get().pushHistory();
  },

  removeNode: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      edges: state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
    }));
    get().pushHistory();
  },

  // Similar for edge operations...
}));
```

**Add undo/redo buttons to toolbar**:

```typescript
<div className="flex items-center gap-1">
  <Button
    variant="ghost"
    size="sm"
    onClick={undo}
    disabled={!canUndo()}
    title="Undo (Ctrl+Z)"
  >
    <Undo className="h-4 w-4" />
  </Button>
  <Button
    variant="ghost"
    size="sm"
    onClick={redo}
    disabled={!canRedo()}
    title="Redo (Ctrl+Shift+Z)"
  >
    <Redo className="h-4 w-4" />
  </Button>
</div>
```

**Acceptance Criteria**:
- [x] History stack (max 50 states)
- [x] Push history on all mutations
- [x] Undo/redo functions
- [x] Keyboard shortcuts integration
- [x] Toolbar buttons with disabled states
- [x] Deep copy to prevent mutations

**Estimated Time**: 2.5 hours

---

#### Task 6.8: Loading States & Error Boundaries
**File**: `components/chains/ChainLoadingStates.tsx`

```typescript
export function ChainLoadingSkeleton() {
  return (
    <div className="flex h-full">
      {/* Sidebar skeleton */}
      <div className="w-64 border-r p-4 space-y-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>

      {/* Canvas skeleton */}
      <div className="flex-1 p-8 space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>

      {/* Analysis sidebar skeleton */}
      <div className="w-96 border-l p-4 space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  );
}

export function ChainErrorState({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex items-center justify-center h-full">
      <Card className="w-96">
        <CardHeader>
          <CardTitle className="text-destructive">Failed to Load Chain</CardTitle>
          <CardDescription>{error.message}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={reset} className="w-full">
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Error Boundary**:

```typescript
"use client";

import React from "react";

export class ChainErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Chain error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ChainErrorState
          error={this.state.error!}
          reset={() => this.setState({ hasError: false, error: null })}
        />
      );
    }

    return this.props.children;
  }
}
```

**Usage**:

```typescript
export default function ChainPage({ params }: { params: { chainId: string } }) {
  return (
    <ChainErrorBoundary>
      <Suspense fallback={<ChainLoadingSkeleton />}>
        <ArgumentChainConstructor chainId={params.chainId} />
      </Suspense>
    </ChainErrorBoundary>
  );
}
```

**Acceptance Criteria**:
- [x] Loading skeleton
- [x] Error boundary component
- [x] Error state with retry
- [x] Suspense integration
- [x] Proper error logging

**Estimated Time**: 1.5 hours

---

#### Task 6.9: Feature Announcement & Onboarding
**File**: `components/chains/ChainOnboarding.tsx`

```typescript
"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Link2, GitBranch, Users, BarChart3 } from "lucide-react";

export function ChainOnboardingDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    // Check if user has seen onboarding
    const hasSeenOnboarding = localStorage.getItem("chain-onboarding-seen");
    if (!hasSeenOnboarding) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem("chain-onboarding-seen", "true");
    }
    setIsOpen(false);
  };

  const features = [
    {
      icon: Link2,
      title: "Connect Arguments",
      description: "Build complex chains by connecting multiple arguments across your deliberation",
    },
    {
      icon: GitBranch,
      title: "SchemeNet Integration",
      description: "View detailed SchemeNet analysis for each argument within the chain",
    },
    {
      icon: Users,
      title: "Real-time Collaboration",
      description: "Work together with live cursor tracking and instant updates",
    },
    {
      icon: BarChart3,
      title: "Chain Analysis",
      description: "Identify critical paths, weak points, and get improvement suggestions",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            🎉 Introducing Argument Chains
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <p className="text-muted-foreground">
            Build and analyze complex argumentative structures by connecting multiple arguments
            in visual chains.
          </p>

          <div className="grid grid-cols-2 gap-4">
            {features.map((feature) => (
              <div key={feature.title} className="flex gap-3 p-4 border rounded-lg">
                <feature.icon className="h-6 w-6 text-primary flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-4">
            <Checkbox
              id="dont-show"
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(checked as boolean)}
            />
            <label htmlFor="dont-show" className="text-sm text-muted-foreground cursor-pointer">
              Don't show this again
            </label>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleClose} className="flex-1">
              Get Started
            </Button>
            <Button variant="outline" onClick={() => window.open("/docs/argument-chains", "_blank")}>
              Learn More
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

**Add to DeepDive or first chain creation**:

```typescript
export function ArgumentChainsTab() {
  return (
    <>
      <ChainOnboardingDialog />
      {/* Rest of tab */}
    </>
  );
}
```

**Also add in-app tooltips for first-time users**:

```typescript
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function ChainFeatureTooltip({ feature, children }: Props) {
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(`chain-tooltip-${feature}`);
    setIsDismissed(!!dismissed);
  }, [feature]);

  const handleDismiss = () => {
    localStorage.setItem(`chain-tooltip-${feature}`, "true");
    setIsDismissed(true);
  };

  if (isDismissed) return <>{children}</>;

  return (
    <Popover defaultOpen>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-2">
          <p className="text-sm">{getTooltipText(feature)}</p>
          <Button size="sm" onClick={handleDismiss}>
            Got it
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
```

**Acceptance Criteria**:
- [x] Onboarding dialog on first visit
- [x] Feature highlights
- [x] "Don't show again" checkbox
- [x] localStorage persistence
- [x] In-app tooltips for key features
- [x] Link to documentation
- [x] Dismissible tooltips

**Estimated Time**: 2 hours

---

**Phase 5 Part 9 Summary**:
- **Total Tasks**: 9 tasks (6.1-6.9)
- **Estimated Time**: 17.5 hours
- **Deliverable**: Complete DeepDive v3 integration, SchemeNet nesting, navigation, keyboard shortcuts, undo/redo, error handling, and onboarding

---

## Part 10: Testing Strategy

### 7.1 Unit Tests

#### Task 7.1: Chain Analysis Utils Tests
**File**: `lib/utils/__tests__/chainAnalysisUtils.test.ts`

```typescript
import {
  findCriticalPath,
  calculateChainMetrics,
  detectWeakLinks,
  generateSuggestions,
} from "../chainAnalysisUtils";

describe("chainAnalysisUtils", () => {
  describe("findCriticalPath", () => {
    it("should find the longest path in a simple chain", () => {
      const nodes = [
        { id: "1", data: { argument: { id: "a1" } } },
        { id: "2", data: { argument: { id: "a2" } } },
        { id: "3", data: { argument: { id: "a3" } } },
      ];

      const edges = [
        { id: "e1", source: "1", target: "2" },
        { id: "e2", source: "2", target: "3" },
      ];

      const result = findCriticalPath(nodes, edges);

      expect(result.path).toEqual(["1", "2", "3"]);
      expect(result.length).toBe(3);
    });

    it("should find the longest path in a branching chain", () => {
      const nodes = [
        { id: "1", data: { argument: { id: "a1" } } },
        { id: "2", data: { argument: { id: "a2" } } },
        { id: "3", data: { argument: { id: "a3" } } },
        { id: "4", data: { argument: { id: "a4" } } },
      ];

      const edges = [
        { id: "e1", source: "1", target: "2" },
        { id: "e2", source: "1", target: "3" },
        { id: "e3", source: "3", target: "4" },
      ];

      const result = findCriticalPath(nodes, edges);

      expect(result.path).toEqual(["1", "3", "4"]);
      expect(result.length).toBe(3);
    });

    it("should handle empty chain", () => {
      const result = findCriticalPath([], []);
      expect(result.path).toEqual([]);
      expect(result.length).toBe(0);
    });

    it("should handle single node", () => {
      const nodes = [{ id: "1", data: { argument: { id: "a1" } } }];
      const result = findCriticalPath(nodes, []);

      expect(result.path).toEqual(["1"]);
      expect(result.length).toBe(1);
    });

    it("should handle cycles gracefully", () => {
      const nodes = [
        { id: "1", data: { argument: { id: "a1" } } },
        { id: "2", data: { argument: { id: "a2" } } },
        { id: "3", data: { argument: { id: "a3" } } },
      ];

      const edges = [
        { id: "e1", source: "1", target: "2" },
        { id: "e2", source: "2", target: "3" },
        { id: "e3", source: "3", target: "1" }, // Cycle
      ];

      // Should not infinite loop
      const result = findCriticalPath(nodes, edges);
      expect(result).toBeDefined();
    });
  });

  describe("calculateChainMetrics", () => {
    it("should calculate correct metrics for simple chain", () => {
      const nodes = [
        { id: "1", data: { argument: { id: "a1", strength: 0.8 } } },
        { id: "2", data: { argument: { id: "a2", strength: 0.9 } } },
      ];

      const edges = [
        { id: "e1", source: "1", target: "2", data: { strength: 0.85 } },
      ];

      const metrics = calculateChainMetrics(nodes, edges);

      expect(metrics.argumentCount).toBe(2);
      expect(metrics.connectionCount).toBe(1);
      expect(metrics.averageArgumentStrength).toBe(0.85);
      expect(metrics.averageConnectionStrength).toBe(0.85);
      expect(metrics.overallStrength).toBeCloseTo(0.85, 2);
    });

    it("should calculate depth correctly", () => {
      const nodes = [
        { id: "1", data: { argument: { id: "a1" } } },
        { id: "2", data: { argument: { id: "a2" } } },
        { id: "3", data: { argument: { id: "a3" } } },
      ];

      const edges = [
        { id: "e1", source: "1", target: "2" },
        { id: "e2", source: "2", target: "3" },
      ];

      const metrics = calculateChainMetrics(nodes, edges);
      expect(metrics.maxDepth).toBe(3);
    });

    it("should identify branch points", () => {
      const nodes = [
        { id: "1", data: { argument: { id: "a1" } } },
        { id: "2", data: { argument: { id: "a2" } } },
        { id: "3", data: { argument: { id: "a3" } } },
      ];

      const edges = [
        { id: "e1", source: "1", target: "2" },
        { id: "e2", source: "1", target: "3" },
      ];

      const metrics = calculateChainMetrics(nodes, edges);
      expect(metrics.branchPoints).toBe(1);
    });
  });

  describe("detectWeakLinks", () => {
    it("should detect weak arguments", () => {
      const nodes = [
        { id: "1", data: { argument: { id: "a1", strength: 0.3 } } },
        { id: "2", data: { argument: { id: "a2", strength: 0.9 } } },
      ];

      const weakLinks = detectWeakLinks(nodes, []);

      expect(weakLinks).toHaveLength(1);
      expect(weakLinks[0].nodeId).toBe("1");
      expect(weakLinks[0].type).toBe("weak_argument");
    });

    it("should detect weak connections", () => {
      const nodes = [
        { id: "1", data: { argument: { id: "a1" } } },
        { id: "2", data: { argument: { id: "a2" } } },
      ];

      const edges = [
        { id: "e1", source: "1", target: "2", data: { strength: 0.2 } },
      ];

      const weakLinks = detectWeakLinks(nodes, edges);

      expect(weakLinks).toHaveLength(1);
      expect(weakLinks[0].edgeId).toBe("e1");
      expect(weakLinks[0].type).toBe("weak_connection");
    });

    it("should detect missing premises", () => {
      const nodes = [
        {
          id: "1",
          data: {
            argument: { id: "a1", premises: [] },
            role: "conclusion",
          },
        },
      ];

      const weakLinks = detectWeakLinks(nodes, []);

      expect(weakLinks).toHaveLength(1);
      expect(weakLinks[0].type).toBe("missing_premises");
    });
  });

  describe("generateSuggestions", () => {
    it("should suggest adding premises to conclusions without support", () => {
      const nodes = [
        {
          id: "1",
          data: {
            argument: { id: "a1" },
            role: "conclusion",
          },
        },
      ];

      const edges = [];

      const suggestions = generateSuggestions(nodes, edges);

      const premiseSuggestion = suggestions.find((s) =>
        s.message.includes("premise")
      );
      expect(premiseSuggestion).toBeDefined();
    });

    it("should suggest connecting isolated nodes", () => {
      const nodes = [
        { id: "1", data: { argument: { id: "a1" } } },
        { id: "2", data: { argument: { id: "a2" } } },
        { id: "3", data: { argument: { id: "a3" } } },
      ];

      const edges = [{ id: "e1", source: "1", target: "2" }];

      const suggestions = generateSuggestions(nodes, edges);

      const isolatedSuggestion = suggestions.find((s) =>
        s.message.includes("isolated")
      );
      expect(isolatedSuggestion).toBeDefined();
    });

    it("should suggest strengthening weak connections", () => {
      const nodes = [
        { id: "1", data: { argument: { id: "a1" } } },
        { id: "2", data: { argument: { id: "a2" } } },
      ];

      const edges = [
        { id: "e1", source: "1", target: "2", data: { strength: 0.3 } },
      ];

      const suggestions = generateSuggestions(nodes, edges);

      const strengthSuggestion = suggestions.find((s) =>
        s.message.includes("strengthen")
      );
      expect(strengthSuggestion).toBeDefined();
    });
  });
});
```

**Acceptance Criteria**:
- [x] Tests for all analysis functions
- [x] Edge cases (empty, single node, cycles)
- [x] Correct metric calculations
- [x] Weak link detection
- [x] Suggestion generation
- [x] 100% code coverage for utils

**Estimated Time**: 3 hours

---

#### Task 7.2: Chain Store Tests
**File**: `lib/stores/__tests__/chainEditorStore.test.ts`

```typescript
import { renderHook, act } from "@testing-library/react";
import { useChainEditorStore } from "../chainEditorStore";

describe("chainEditorStore", () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useChainEditorStore());
    act(() => {
      result.current.setNodes([]);
      result.current.setEdges([]);
      result.current.history = [];
      result.current.historyIndex = -1;
    });
  });

  describe("node operations", () => {
    it("should add node", () => {
      const { result } = renderHook(() => useChainEditorStore());

      const newNode = {
        id: "1",
        type: "argumentNode",
        position: { x: 0, y: 0 },
        data: { argument: { id: "a1" }, role: "premise" },
      };

      act(() => {
        result.current.addNode(newNode);
      });

      expect(result.current.nodes).toHaveLength(1);
      expect(result.current.nodes[0].id).toBe("1");
    });

    it("should update node", () => {
      const { result } = renderHook(() => useChainEditorStore());

      act(() => {
        result.current.addNode({
          id: "1",
          type: "argumentNode",
          position: { x: 0, y: 0 },
          data: { argument: { id: "a1" }, role: "premise" },
        });

        result.current.updateNode("1", {
          position: { x: 100, y: 100 },
        });
      });

      expect(result.current.nodes[0].position).toEqual({ x: 100, y: 100 });
    });

    it("should remove node and cascade delete edges", () => {
      const { result } = renderHook(() => useChainEditorStore());

      act(() => {
        result.current.addNode({
          id: "1",
          type: "argumentNode",
          position: { x: 0, y: 0 },
          data: { argument: { id: "a1" }, role: "premise" },
        });

        result.current.addNode({
          id: "2",
          type: "argumentNode",
          position: { x: 200, y: 0 },
          data: { argument: { id: "a2" }, role: "conclusion" },
        });

        result.current.addEdge({
          id: "e1",
          source: "1",
          target: "2",
          type: "supports",
        });

        result.current.removeNode("1");
      });

      expect(result.current.nodes).toHaveLength(1);
      expect(result.current.edges).toHaveLength(0); // Edge should be removed
    });
  });

  describe("edge operations", () => {
    beforeEach(() => {
      const { result } = renderHook(() => useChainEditorStore());
      act(() => {
        result.current.addNode({
          id: "1",
          type: "argumentNode",
          position: { x: 0, y: 0 },
          data: { argument: { id: "a1" }, role: "premise" },
        });

        result.current.addNode({
          id: "2",
          type: "argumentNode",
          position: { x: 200, y: 0 },
          data: { argument: { id: "a2" }, role: "conclusion" },
        });
      });
    });

    it("should add edge", () => {
      const { result } = renderHook(() => useChainEditorStore());

      act(() => {
        result.current.addEdge({
          id: "e1",
          source: "1",
          target: "2",
          type: "supports",
        });
      });

      expect(result.current.edges).toHaveLength(1);
      expect(result.current.edges[0].source).toBe("1");
      expect(result.current.edges[0].target).toBe("2");
    });

    it("should update edge", () => {
      const { result } = renderHook(() => useChainEditorStore());

      act(() => {
        result.current.addEdge({
          id: "e1",
          source: "1",
          target: "2",
          type: "supports",
          data: { strength: 0.5 },
        });

        result.current.updateEdge("e1", {
          data: { strength: 0.9 },
        });
      });

      expect(result.current.edges[0].data.strength).toBe(0.9);
    });

    it("should remove edge", () => {
      const { result } = renderHook(() => useChainEditorStore());

      act(() => {
        result.current.addEdge({
          id: "e1",
          source: "1",
          target: "2",
          type: "supports",
        });

        result.current.removeEdge("e1");
      });

      expect(result.current.edges).toHaveLength(0);
    });
  });

  describe("history/undo/redo", () => {
    it("should push history on operations", () => {
      const { result } = renderHook(() => useChainEditorStore());

      act(() => {
        result.current.addNode({
          id: "1",
          type: "argumentNode",
          position: { x: 0, y: 0 },
          data: { argument: { id: "a1" }, role: "premise" },
        });
      });

      expect(result.current.history.length).toBeGreaterThan(0);
    });

    it("should undo last action", () => {
      const { result } = renderHook(() => useChainEditorStore());

      act(() => {
        result.current.addNode({
          id: "1",
          type: "argumentNode",
          position: { x: 0, y: 0 },
          data: { argument: { id: "a1" }, role: "premise" },
        });

        result.current.undo();
      });

      expect(result.current.nodes).toHaveLength(0);
    });

    it("should redo undone action", () => {
      const { result } = renderHook(() => useChainEditorStore());

      act(() => {
        result.current.addNode({
          id: "1",
          type: "argumentNode",
          position: { x: 0, y: 0 },
          data: { argument: { id: "a1" }, role: "premise" },
        });

        result.current.undo();
        result.current.redo();
      });

      expect(result.current.nodes).toHaveLength(1);
    });

    it("should not undo when at beginning of history", () => {
      const { result } = renderHook(() => useChainEditorStore());

      act(() => {
        result.current.undo();
      });

      expect(result.current.canUndo()).toBe(false);
    });

    it("should limit history size", () => {
      const { result } = renderHook(() => useChainEditorStore());

      act(() => {
        // Add 60 nodes (more than max history of 50)
        for (let i = 0; i < 60; i++) {
          result.current.addNode({
            id: `${i}`,
            type: "argumentNode",
            position: { x: i * 10, y: 0 },
            data: { argument: { id: `a${i}` }, role: "premise" },
          });
        }
      });

      expect(result.current.history.length).toBeLessThanOrEqual(50);
    });
  });

  describe("selection", () => {
    it("should set selected nodes", () => {
      const { result } = renderHook(() => useChainEditorStore());

      act(() => {
        result.current.setSelectedNodes(["1", "2"]);
      });

      expect(result.current.selectedNodes).toEqual(["1", "2"]);
    });

    it("should delete selected nodes", () => {
      const { result } = renderHook(() => useChainEditorStore());

      act(() => {
        result.current.addNode({
          id: "1",
          type: "argumentNode",
          position: { x: 0, y: 0 },
          data: { argument: { id: "a1" }, role: "premise" },
        });

        result.current.addNode({
          id: "2",
          type: "argumentNode",
          position: { x: 200, y: 0 },
          data: { argument: { id: "a2" }, role: "conclusion" },
        });

        result.current.setSelectedNodes(["1", "2"]);
        result.current.deleteSelected();
      });

      expect(result.current.nodes).toHaveLength(0);
    });
  });
});
```

**Acceptance Criteria**:
- [x] Tests for all store actions
- [x] Node CRUD operations
- [x] Edge CRUD operations
- [x] History/undo/redo logic
- [x] Selection management
- [x] Proper cleanup between tests

**Estimated Time**: 2.5 hours

---

#### Task 7.3: API Route Tests
**File**: `app/api/argument-chains/__tests__/route.test.ts`

```typescript
import { POST } from "../route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

jest.mock("next-auth");
jest.mock("@/lib/prisma", () => ({
  prisma: {
    argumentChain: {
      create: jest.fn(),
    },
    deliberation: {
      findUnique: jest.fn(),
    },
  },
}));

describe("POST /api/argument-chains", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create chain with valid data", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "user1", name: "Test User" },
    });

    (prisma.deliberation.findUnique as jest.Mock).mockResolvedValue({
      id: "delib1",
      members: [{ userId: "user1" }],
    });

    (prisma.argumentChain.create as jest.Mock).mockResolvedValue({
      id: "chain1",
      name: "Test Chain",
      chainType: "linear",
      deliberationId: "delib1",
      createdBy: "user1",
    });

    const request = new Request("http://localhost/api/argument-chains", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Chain",
        chainType: "linear",
        deliberationId: "delib1",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.chain.name).toBe("Test Chain");
  });

  it("should return 401 if not authenticated", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const request = new Request("http://localhost/api/argument-chains", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Chain",
        chainType: "linear",
        deliberationId: "delib1",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it("should return 400 for invalid chain type", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "user1" },
    });

    const request = new Request("http://localhost/api/argument-chains", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Chain",
        chainType: "invalid-type",
        deliberationId: "delib1",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it("should return 403 if not member of deliberation", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "user1" },
    });

    (prisma.deliberation.findUnique as jest.Mock).mockResolvedValue({
      id: "delib1",
      members: [{ userId: "user2" }], // Different user
    });

    const request = new Request("http://localhost/api/argument-chains", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Chain",
        chainType: "linear",
        deliberationId: "delib1",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(403);
  });
});
```

**Run API tests**:
```bash
npm run test -- app/api/argument-chains
```

**Acceptance Criteria**:
- [x] Tests for all HTTP methods (GET, POST, PATCH, DELETE)
- [x] Authentication checks
- [x] Authorization checks
- [x] Input validation
- [x] Error handling
- [x] Database interactions mocked

**Estimated Time**: 4 hours

---

### 7.2 Integration Tests

#### Task 7.4: Chain Creation Flow Tests
**File**: `__tests__/integration/chainCreation.test.tsx`

```typescript
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ArgumentChainConstructor } from "@/components/chains/ArgumentChainConstructor";
import { SessionProvider } from "next-auth/react";

const mockSession = {
  user: { id: "user1", name: "Test User", email: "test@example.com" },
};

global.fetch = jest.fn();

describe("Chain Creation Flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create new chain with arguments", async () => {
    // Mock API responses
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          chain: {
            id: "chain1",
            name: "Test Chain",
            nodes: [],
            edges: [],
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          arguments: [
            { id: "arg1", conclusion: "Test Argument 1" },
            { id: "arg2", conclusion: "Test Argument 2" },
          ],
        }),
      });

    render(
      <SessionProvider session={mockSession}>
        <ArgumentChainConstructor chainId="chain1" />
      </SessionProvider>
    );

    // Wait for chain to load
    await waitFor(() => {
      expect(screen.getByText("Test Chain")).toBeInTheDocument();
    });

    // Open argument palette
    const paletteButton = screen.getByRole("button", { name: /add argument/i });
    await userEvent.click(paletteButton);

    // Select and add argument
    const argument1 = await screen.findByText("Test Argument 1");
    await userEvent.click(argument1);

    // Verify node was added
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/argument-chains/chain1/nodes"),
        expect.objectContaining({ method: "POST" })
      );
    });
  });

  it("should create connection between nodes", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ edge: { id: "e1" } }),
    });

    render(
      <SessionProvider session={mockSession}>
        <ArgumentChainConstructor chainId="chain1" />
      </SessionProvider>
    );

    // Simulate connecting two nodes (ReactFlow interaction)
    // This would require more complex setup with ReactFlow testing utils
  });

  it("should update chain metadata", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ chain: { id: "chain1", name: "Updated Name" } }),
    });

    render(
      <SessionProvider session={mockSession}>
        <ArgumentChainConstructor chainId="chain1" />
      </SessionProvider>
    );

    // Open metadata panel
    const settingsButton = screen.getByRole("button", { name: /settings/i });
    await userEvent.click(settingsButton);

    // Update name
    const nameInput = screen.getByLabelText(/chain name/i);
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "Updated Name");

    // Save
    const saveButton = screen.getByRole("button", { name: /save/i });
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/argument-chains/chain1"),
        expect.objectContaining({
          method: "PATCH",
          body: expect.stringContaining("Updated Name"),
        })
      );
    });
  });
});
```

**Acceptance Criteria**:
- [x] Full chain creation flow
- [x] Add nodes from palette
- [x] Create connections
- [x] Update metadata
- [x] Mock API calls
- [x] User interactions tested

**Estimated Time**: 3 hours

---

#### Task 7.5: Real-time Collaboration Tests
**File**: `__tests__/integration/realtimeCollaboration.test.tsx`

```typescript
import { render, screen, waitFor } from "@testing-library/react";
import { ChainRealtimeClient } from "@/lib/realtime/chainRealtimeClient";

// Mock Supabase
const mockChannel = {
  on: jest.fn().mockReturnThis(),
  subscribe: jest.fn().mockResolvedValue({ status: "SUBSCRIBED" }),
  send: jest.fn(),
  track: jest.fn(),
  unsubscribe: jest.fn(),
};

const mockSupabase = {
  channel: jest.fn().mockReturnValue(mockChannel),
};

jest.mock("@/lib/supabase", () => ({
  supabase: mockSupabase,
}));

describe("Real-time Collaboration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should setup realtime channel on subscribe", async () => {
    const client = new ChainRealtimeClient("chain1", "user1", "Test User");

    await client.subscribe({
      onNodeAdded: jest.fn(),
    });

    expect(mockSupabase.channel).toHaveBeenCalledWith("chain:chain1");
    expect(mockChannel.subscribe).toHaveBeenCalled();
  });

  it("should broadcast node added event", async () => {
    const client = new ChainRealtimeClient("chain1", "user1", "Test User");

    await client.subscribe({});

    await client.broadcastUpdate({
      type: "node_added",
      data: {
        id: "node1",
        argumentId: "arg1",
        role: "premise",
      },
    });

    expect(mockChannel.send).toHaveBeenCalledWith({
      type: "broadcast",
      event: "chain_update",
      payload: expect.objectContaining({
        type: "node_added",
      }),
    });
  });

  it("should receive and handle remote updates", async () => {
    const onNodeAdded = jest.fn();
    const client = new ChainRealtimeClient("chain1", "user1", "Test User");

    await client.subscribe({ onNodeAdded });

    // Simulate receiving broadcast
    const broadcastCallback = mockChannel.on.mock.calls.find(
      (call) => call[0] === "broadcast"
    )[1];

    broadcastCallback({
      payload: {
        userId: "user2",
        type: "node_added",
        data: { id: "node1" },
      },
    });

    expect(onNodeAdded).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "node_added",
        data: { id: "node1" },
      })
    );
  });

  it("should ignore own events", async () => {
    const onNodeAdded = jest.fn();
    const client = new ChainRealtimeClient("chain1", "user1", "Test User");

    await client.subscribe({ onNodeAdded });

    const broadcastCallback = mockChannel.on.mock.calls.find(
      (call) => call[0] === "broadcast"
    )[1];

    // Event from same user
    broadcastCallback({
      payload: {
        userId: "user1", // Same as client
        type: "node_added",
        data: { id: "node1" },
      },
    });

    expect(onNodeAdded).not.toHaveBeenCalled();
  });

  it("should track cursor position", async () => {
    const client = new ChainRealtimeClient("chain1", "user1", "Test User");

    await client.subscribe({});

    await client.updatePresence({
      cursorPosition: { x: 100, y: 200 },
    });

    expect(mockChannel.track).toHaveBeenCalledWith(
      expect.objectContaining({
        cursorPosition: { x: 100, y: 200 },
      })
    );
  });

  it("should cleanup on unsubscribe", async () => {
    const client = new ChainRealtimeClient("chain1", "user1", "Test User");

    await client.subscribe({});
    client.unsubscribe();

    expect(mockChannel.unsubscribe).toHaveBeenCalled();
  });
});
```

**Acceptance Criteria**:
- [x] Realtime client setup
- [x] Broadcast events
- [x] Receive remote updates
- [x] Ignore own events
- [x] Presence tracking
- [x] Proper cleanup

**Estimated Time**: 2.5 hours

---

#### Task 7.6: Chain Analysis Tests
**File**: `__tests__/integration/chainAnalysis.test.tsx`

```typescript
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChainAnalysisDashboard } from "@/components/chains/ChainAnalysisDashboard";

global.fetch = jest.fn();

describe("Chain Analysis", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should display analysis metrics", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        metrics: {
          argumentCount: 5,
          connectionCount: 4,
          overallStrength: 0.75,
          maxDepth: 3,
        },
        criticalPath: ["node1", "node2", "node3"],
        weakLinks: [
          {
            nodeId: "node2",
            type: "weak_argument",
            severity: "warning",
            message: "Argument has low strength",
          },
        ],
        suggestions: [
          {
            id: "s1",
            priority: "high",
            message: "Add supporting premises",
            nodeId: "node2",
          },
        ],
      }),
    });

    render(<ChainAnalysisDashboard chainId="chain1" />);

    // Wait for analysis to load
    await waitFor(() => {
      expect(screen.getByText("5")).toBeInTheDocument(); // Argument count
      expect(screen.getByText("4")).toBeInTheDocument(); // Connection count
    });

    // Check metrics
    expect(screen.getByText(/75%/i)).toBeInTheDocument(); // Overall strength

    // Check weak links
    expect(screen.getByText(/weak argument/i)).toBeInTheDocument();

    // Check suggestions
    expect(screen.getByText(/add supporting premises/i)).toBeInTheDocument();
  });

  it("should highlight critical path", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        metrics: {},
        criticalPath: ["node1", "node2", "node3"],
        weakLinks: [],
        suggestions: [],
      }),
    });

    render(<ChainAnalysisDashboard chainId="chain1" />);

    // Switch to Critical Path tab
    const criticalPathTab = screen.getByRole("tab", { name: /critical path/i });
    await userEvent.click(criticalPathTab);

    await waitFor(() => {
      expect(screen.getByText(/3 arguments/i)).toBeInTheDocument();
    });
  });

  it("should apply suggestion", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          metrics: {},
          criticalPath: [],
          weakLinks: [],
          suggestions: [
            {
              id: "s1",
              priority: "high",
              message: "Add supporting premises",
              nodeId: "node2",
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

    render(<ChainAnalysisDashboard chainId="chain1" />);

    // Switch to Suggestions tab
    const suggestionsTab = screen.getByRole("tab", { name: /suggestions/i });
    await userEvent.click(suggestionsTab);

    // Click apply button
    const applyButton = await screen.findByRole("button", { name: /apply/i });
    await userEvent.click(applyButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/apply-suggestion"),
        expect.anything()
      );
    });
  });
});
```

**Acceptance Criteria**:
- [x] Analysis metrics display
- [x] Critical path visualization
- [x] Weak link detection display
- [x] Suggestions display
- [x] Apply suggestions
- [x] Tab navigation

**Estimated Time**: 2 hours

---

### 7.3 End-to-End Tests

#### Task 7.7: E2E Chain Creation with Playwright
**File**: `e2e/chainCreation.spec.ts`

```typescript
import { test, expect } from "@playwright/test";

test.describe("Argument Chain Creation", () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto("/login");
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/app");
  });

  test("should create new chain from deliberation", async ({ page }) => {
    // Navigate to deliberation
    await page.goto("/app/deliberations/test-delib-id");

    // Switch to Chains tab
    await page.click('text="Chains"');

    // Click create chain button
    await page.click('text="New Chain"');

    // Fill in chain details
    await page.fill('input[name="name"]', "E2E Test Chain");
    await page.fill('textarea[name="description"]', "Created by E2E test");
    await page.selectOption('select[name="chainType"]', "linear");

    // Create chain
    await page.click('button:has-text("Create")');

    // Should navigate to chain editor
    await page.waitForURL(/\/app\/chains\/.+/);

    // Verify chain editor loaded
    await expect(page.locator("text=E2E Test Chain")).toBeVisible();
  });

  test("should add arguments to chain", async ({ page }) => {
    // Navigate to existing chain
    await page.goto("/app/chains/test-chain-id");

    // Wait for editor to load
    await page.waitForSelector('[data-testid="chain-canvas"]');

    // Open argument palette
    await page.click('button:has-text("Add Argument")');

    // Search for argument
    await page.fill('input[placeholder*="Search"]', "climate");
    await page.waitForTimeout(500); // Wait for search

    // Click first argument in results
    await page.click('[data-testid="argument-card"]:first-child');

    // Verify node appears on canvas
    await expect(page.locator('[data-testid="argument-node"]')).toBeVisible();

    // Add second argument
    await page.click('button:has-text("Add Argument")');
    await page.click('[data-testid="argument-card"]:nth-child(2)');

    // Verify two nodes
    await expect(page.locator('[data-testid="argument-node"]')).toHaveCount(2);
  });

  test("should create connection between arguments", async ({ page }) => {
    await page.goto("/app/chains/test-chain-id");

    // Wait for canvas
    await page.waitForSelector('[data-testid="chain-canvas"]');

    // Drag from first node handle to second node
    const sourceHandle = page.locator('[data-testid="node-handle-source"]').first();
    const targetHandle = page.locator('[data-testid="node-handle-target"]').last();

    await sourceHandle.hover();
    await page.mouse.down();
    await targetHandle.hover();
    await page.mouse.up();

    // Connection modal should open
    await expect(page.locator('text="Create Connection"')).toBeVisible();

    // Select connection type
    await page.selectOption('select[name="edgeType"]', "supports");
    await page.fill('input[name="strength"]', "0.8");

    // Create connection
    await page.click('button:has-text("Create")');

    // Verify edge appears
    await expect(page.locator('[data-testid="argument-edge"]')).toBeVisible();
  });

  test("should analyze chain", async ({ page }) => {
    await page.goto("/app/chains/test-chain-id");

    // Open analysis panel
    await page.click('text="Analysis"');

    // Wait for metrics to load
    await page.waitForSelector('[data-testid="chain-metrics"]');

    // Verify metrics displayed
    await expect(page.locator('text="Overall Strength"')).toBeVisible();
    await expect(page.locator('text="Arguments"')).toBeVisible();
    await expect(page.locator('text="Connections"')).toBeVisible();

    // Check critical path
    await page.click('text="Critical Path"');
    await expect(page.locator('[data-testid="critical-path-overlay"]')).toBeVisible();
  });

  test("should export chain as PNG", async ({ page }) => {
    await page.goto("/app/chains/test-chain-id");

    // Open export modal
    await page.click('button:has-text("Export")');

    // Select PNG format
    await page.click('input[value="png"]');

    // Set options
    await page.selectOption('select[name="quality"]', "high");

    // Start download
    const downloadPromise = page.waitForEvent("download");
    await page.click('button:has-text("Download")');

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.png$/);
  });

  test("should share chain", async ({ page }) => {
    await page.goto("/app/chains/test-chain-id");

    // Open export modal
    await page.click('button:has-text("Export")');

    // Switch to Share tab
    await page.click('text="Share"');

    // Generate link
    await page.click('button:has-text("Generate Link")');

    // Wait for link to appear
    await page.waitForSelector('input[readonly][value*="http"]');

    // Copy link
    await page.click('button:has-text("Copy Link")');

    // Verify toast notification
    await expect(page.locator('text="Link copied"')).toBeVisible();
  });
});
```

**Run E2E tests**:
```bash
npx playwright test
```

**Acceptance Criteria**:
- [x] Full user flows tested
- [x] Chain creation
- [x] Add arguments
- [x] Create connections
- [x] Analysis features
- [x] Export functionality
- [x] Share functionality
- [x] Visual verification

**Estimated Time**: 4 hours

---

#### Task 7.8: E2E Real-time Collaboration
**File**: `e2e/realtimeCollaboration.spec.ts`

```typescript
import { test, expect } from "@playwright/test";

test.describe("Real-time Collaboration", () => {
  test("should show live cursor from other user", async ({ browser }) => {
    // Create two contexts (two users)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // Login both users
    await page1.goto("/login");
    await page1.fill('input[name="email"]', "user1@example.com");
    await page1.fill('input[name="password"]', "password");
    await page1.click('button[type="submit"]');

    await page2.goto("/login");
    await page2.fill('input[name="email"]', "user2@example.com");
    await page2.fill('input[name="password"]', "password");
    await page2.click('button[type="submit"]');

    // Both navigate to same chain
    await page1.goto("/app/chains/shared-chain-id");
    await page2.goto("/app/chains/shared-chain-id");

    // Wait for connection
    await page1.waitForSelector('[data-testid="active-users"]');
    await page2.waitForSelector('[data-testid="active-users"]');

    // Move cursor on page2
    await page2.mouse.move(500, 300);

    // Verify cursor appears on page1
    await expect(page1.locator('[data-testid="remote-cursor"]')).toBeVisible();

    await context1.close();
    await context2.close();
  });

  test("should sync node additions", async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // Setup (login and navigate)
    // ... (similar to above)

    // User 1 adds node
    await page1.click('button:has-text("Add Argument")');
    await page1.click('[data-testid="argument-card"]:first-child');

    // Verify node appears on page2
    await expect(page2.locator('[data-testid="argument-node"]')).toBeVisible();

    // Verify toast notification on page2
    await expect(page2.locator('text="User 1 added an argument"')).toBeVisible();

    await context1.close();
    await context2.close();
  });

  test("should handle concurrent edits", async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // Setup...

    // Both users try to update same node simultaneously
    await Promise.all([
      page1.click('[data-testid="node-1"]').then(() => page1.click('button:has-text("Edit")')),
      page2.click('[data-testid="node-1"]').then(() => page2.click('button:has-text("Edit")')),
    ]);

    // One should see conflict notification
    const hasConflict =
      (await page1.locator('text="Edit Conflict"').isVisible()) ||
      (await page2.locator('text="Edit Conflict"').isVisible());

    expect(hasConflict).toBe(true);

    await context1.close();
    await context2.close();
  });
});
```

**Acceptance Criteria**:
- [x] Multi-user scenarios
- [x] Live cursor tracking
- [x] Sync node additions
- [x] Sync node removals
- [x] Conflict detection
- [x] Real-time notifications

**Estimated Time**: 3 hours

---

**Phase 5 Part 10 Summary**:
- **Total Tasks**: 8 tasks (7.1-7.8)
- **Estimated Time**: 24 hours (3 weeks)
- **Deliverable**: Comprehensive test coverage with unit, integration, and E2E tests for all ArgumentChain features

---

## Part 11: Deployment & Production Readiness

### 8.1 Database Migration Strategy

#### Task 8.1: Create Migration Scripts
**File**: `prisma/migrations/YYYYMMDDHHMMSS_add_argument_chains/migration.sql`

```sql
-- Create ArgumentChain table
CREATE TABLE "ArgumentChain" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "chainType" TEXT NOT NULL DEFAULT 'linear',
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "deliberationId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "ArgumentChain_deliberationId_fkey" 
        FOREIGN KEY ("deliberationId") REFERENCES "Deliberation"("id") ON DELETE CASCADE,
    CONSTRAINT "ArgumentChain_createdBy_fkey" 
        FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Create ChainNode table
CREATE TABLE "ChainNode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chainId" TEXT NOT NULL,
    "argumentId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'premise',
    "positionX" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "positionY" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "ChainNode_chainId_fkey" 
        FOREIGN KEY ("chainId") REFERENCES "ArgumentChain"("id") ON DELETE CASCADE,
    CONSTRAINT "ChainNode_argumentId_fkey" 
        FOREIGN KEY ("argumentId") REFERENCES "Argument"("id") ON DELETE CASCADE,
    CONSTRAINT "ChainNode_chainId_argumentId_unique" 
        UNIQUE ("chainId", "argumentId")
);

-- Create ChainEdge table
CREATE TABLE "ChainEdge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chainId" TEXT NOT NULL,
    "sourceNodeId" TEXT NOT NULL,
    "targetNodeId" TEXT NOT NULL,
    "edgeType" TEXT NOT NULL DEFAULT 'supports',
    "strength" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "label" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "ChainEdge_chainId_fkey" 
        FOREIGN KEY ("chainId") REFERENCES "ArgumentChain"("id") ON DELETE CASCADE,
    CONSTRAINT "ChainEdge_sourceNodeId_fkey" 
        FOREIGN KEY ("sourceNodeId") REFERENCES "ChainNode"("id") ON DELETE CASCADE,
    CONSTRAINT "ChainEdge_targetNodeId_fkey" 
        FOREIGN KEY ("targetNodeId") REFERENCES "ChainNode"("id") ON DELETE CASCADE,
    CONSTRAINT "ChainEdge_chainId_source_target_unique" 
        UNIQUE ("chainId", "sourceNodeId", "targetNodeId")
);

-- Create ChainPermission table
CREATE TABLE "ChainPermission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chainId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'viewer',
    "grantedBy" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "ChainPermission_chainId_fkey" 
        FOREIGN KEY ("chainId") REFERENCES "ArgumentChain"("id") ON DELETE CASCADE,
    CONSTRAINT "ChainPermission_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
    CONSTRAINT "ChainPermission_grantedBy_fkey" 
        FOREIGN KEY ("grantedBy") REFERENCES "User"("id") ON DELETE CASCADE,
    CONSTRAINT "ChainPermission_chainId_userId_unique" 
        UNIQUE ("chainId", "userId")
);

-- Create ChainActivity table
CREATE TABLE "ChainActivity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chainId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "details" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "ChainActivity_chainId_fkey" 
        FOREIGN KEY ("chainId") REFERENCES "ArgumentChain"("id") ON DELETE CASCADE,
    CONSTRAINT "ChainActivity_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX "ArgumentChain_deliberationId_idx" ON "ArgumentChain"("deliberationId");
CREATE INDEX "ArgumentChain_createdBy_idx" ON "ArgumentChain"("createdBy");
CREATE INDEX "ArgumentChain_createdAt_idx" ON "ArgumentChain"("createdAt");

CREATE INDEX "ChainNode_chainId_idx" ON "ChainNode"("chainId");
CREATE INDEX "ChainNode_argumentId_idx" ON "ChainNode"("argumentId");

CREATE INDEX "ChainEdge_chainId_idx" ON "ChainEdge"("chainId");
CREATE INDEX "ChainEdge_sourceNodeId_idx" ON "ChainEdge"("sourceNodeId");
CREATE INDEX "ChainEdge_targetNodeId_idx" ON "ChainEdge"("targetNodeId");

CREATE INDEX "ChainPermission_chainId_idx" ON "ChainPermission"("chainId");
CREATE INDEX "ChainPermission_userId_idx" ON "ChainPermission"("userId");

CREATE INDEX "ChainActivity_chainId_createdAt_idx" ON "ChainActivity"("chainId", "createdAt");
CREATE INDEX "ChainActivity_userId_idx" ON "ChainActivity"("userId");
```

**Rollback script**:
**File**: `prisma/migrations/YYYYMMDDHHMMSS_add_argument_chains/rollback.sql`

```sql
-- Drop tables in reverse order (respect foreign keys)
DROP TABLE IF EXISTS "ChainActivity";
DROP TABLE IF EXISTS "ChainPermission";
DROP TABLE IF EXISTS "ChainEdge";
DROP TABLE IF EXISTS "ChainNode";
DROP TABLE IF EXISTS "ArgumentChain";
```

**Migration deployment script**:
**File**: `scripts/deploy-chain-migration.sh`

```bash
#!/bin/bash
set -e

echo "🚀 Deploying Argument Chain Migration"

# Backup database
echo "📦 Creating database backup..."
pg_dump $DATABASE_URL > backups/pre-chain-migration-$(date +%Y%m%d-%H%M%S).sql

# Run migration
echo "🔄 Running Prisma migration..."
npx prisma migrate deploy

# Verify tables
echo "✅ Verifying tables..."
psql $DATABASE_URL -c "\dt ArgumentChain"
psql $DATABASE_URL -c "\dt ChainNode"
psql $DATABASE_URL -c "\dt ChainEdge"

# Generate Prisma client
echo "🔨 Generating Prisma client..."
npx prisma generate

echo "✅ Migration complete!"
```

**Acceptance Criteria**:
- [x] Complete SQL migration script
- [x] All tables and indexes created
- [x] Foreign key constraints
- [x] Rollback script ready
- [x] Backup procedure
- [x] Verification steps

**Estimated Time**: 2 hours

---

#### Task 8.2: Data Validation & Integrity Checks
**File**: `scripts/validate-chain-data.ts`

```typescript
import { prisma } from "@/lib/prisma";

/**
 * Validate chain data integrity after migration
 */
async function validateChainData() {
  console.log("🔍 Validating chain data integrity...\n");

  const issues: string[] = [];

  // 1. Check for orphaned nodes
  const orphanedNodes = await prisma.chainNode.findMany({
    where: {
      OR: [
        { chain: null },
        { argument: null },
      ],
    },
  });

  if (orphanedNodes.length > 0) {
    issues.push(`❌ Found ${orphanedNodes.length} orphaned nodes`);
  } else {
    console.log("✅ No orphaned nodes");
  }

  // 2. Check for orphaned edges
  const orphanedEdges = await prisma.chainEdge.findMany({
    where: {
      OR: [
        { chain: null },
        { sourceNode: null },
        { targetNode: null },
      ],
    },
  });

  if (orphanedEdges.length > 0) {
    issues.push(`❌ Found ${orphanedEdges.length} orphaned edges`);
  } else {
    console.log("✅ No orphaned edges");
  }

  // 3. Check for edges pointing to non-existent nodes
  const allEdges = await prisma.chainEdge.findMany({
    include: {
      sourceNode: true,
      targetNode: true,
    },
  });

  const invalidEdges = allEdges.filter(
    (e) => !e.sourceNode || !e.targetNode
  );

  if (invalidEdges.length > 0) {
    issues.push(`❌ Found ${invalidEdges.length} edges with invalid references`);
  } else {
    console.log("✅ All edges have valid node references");
  }

  // 4. Check for self-referencing edges
  const selfEdges = await prisma.chainEdge.findMany({
    where: {
      sourceNodeId: {
        equals: prisma.chainEdge.fields.targetNodeId,
      },
    },
  });

  if (selfEdges.length > 0) {
    issues.push(`⚠️ Found ${selfEdges.length} self-referencing edges`);
  } else {
    console.log("✅ No self-referencing edges");
  }

  // 5. Check for duplicate nodes (same argument in same chain)
  const duplicateNodes = await prisma.$queryRaw<any[]>`
    SELECT "chainId", "argumentId", COUNT(*) as count
    FROM "ChainNode"
    GROUP BY "chainId", "argumentId"
    HAVING COUNT(*) > 1
  `;

  if (duplicateNodes.length > 0) {
    issues.push(`❌ Found ${duplicateNodes.length} duplicate nodes`);
  } else {
    console.log("✅ No duplicate nodes");
  }

  // 6. Verify permission integrity
  const invalidPermissions = await prisma.chainPermission.findMany({
    where: {
      OR: [
        { chain: null },
        { user: null },
      ],
    },
  });

  if (invalidPermissions.length > 0) {
    issues.push(`❌ Found ${invalidPermissions.length} invalid permissions`);
  } else {
    console.log("✅ All permissions are valid");
  }

  // 7. Check activity log integrity
  const invalidActivities = await prisma.chainActivity.findMany({
    where: {
      OR: [
        { chain: null },
        { user: null },
      ],
    },
  });

  if (invalidActivities.length > 0) {
    issues.push(`❌ Found ${invalidActivities.length} invalid activity logs`);
  } else {
    console.log("✅ All activity logs are valid");
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  if (issues.length === 0) {
    console.log("✅ All validation checks passed!");
    console.log("=".repeat(50));
    process.exit(0);
  } else {
    console.log("❌ Validation failed with issues:");
    issues.forEach((issue) => console.log(`  ${issue}`));
    console.log("=".repeat(50));
    process.exit(1);
  }
}

// Run validation
validateChainData().catch((error) => {
  console.error("Validation error:", error);
  process.exit(1);
});
```

**Run validation**:
```bash
npx tsx scripts/validate-chain-data.ts
```

**Acceptance Criteria**:
- [x] Orphaned record detection
- [x] Invalid reference detection
- [x] Duplicate detection
- [x] Self-reference detection
- [x] Permission integrity checks
- [x] Activity log validation
- [x] Summary report

**Estimated Time**: 1.5 hours

---

### 8.2 Feature Flags & Gradual Rollout

#### Task 8.3: Implement Feature Flag System
**File**: `lib/featureFlags.ts`

```typescript
import { prisma } from "@/lib/prisma";

export enum FeatureFlag {
  ARGUMENT_CHAINS = "argument_chains",
  ARGUMENT_CHAINS_REALTIME = "argument_chains_realtime",
  ARGUMENT_CHAINS_EXPORT = "argument_chains_export",
  ARGUMENT_CHAINS_ANALYSIS = "argument_chains_analysis",
}

interface FeatureFlagConfig {
  enabled: boolean;
  rolloutPercentage: number; // 0-100
  allowedUserIds?: string[];
  allowedDeliberationIds?: string[];
  enabledAt?: Date;
  disabledAt?: Date;
}

/**
 * Check if feature is enabled for user/deliberation
 */
export async function isFeatureEnabled(
  flag: FeatureFlag,
  context: {
    userId?: string;
    deliberationId?: string;
  }
): Promise<boolean> {
  // Check environment variable override
  const envOverride = process.env[`FEATURE_${flag.toUpperCase()}`];
  if (envOverride === "true") return true;
  if (envOverride === "false") return false;

  // Fetch flag config from database
  const config = await getFeatureFlagConfig(flag);

  if (!config.enabled) return false;

  // Check if within enabled date range
  if (config.enabledAt && new Date() < config.enabledAt) return false;
  if (config.disabledAt && new Date() > config.disabledAt) return false;

  // Check explicit allowlists
  if (context.userId && config.allowedUserIds?.includes(context.userId)) {
    return true;
  }

  if (
    context.deliberationId &&
    config.allowedDeliberationIds?.includes(context.deliberationId)
  ) {
    return true;
  }

  // Check rollout percentage (hash-based consistent assignment)
  if (config.rolloutPercentage >= 100) return true;
  if (config.rolloutPercentage <= 0) return false;

  const hash = hashString(context.userId || context.deliberationId || "");
  const bucket = hash % 100;

  return bucket < config.rolloutPercentage;
}

/**
 * Get feature flag configuration
 */
async function getFeatureFlagConfig(
  flag: FeatureFlag
): Promise<FeatureFlagConfig> {
  // In production, fetch from database or config service
  // For now, return default config
  const defaults: Record<FeatureFlag, FeatureFlagConfig> = {
    [FeatureFlag.ARGUMENT_CHAINS]: {
      enabled: true,
      rolloutPercentage: 100,
    },
    [FeatureFlag.ARGUMENT_CHAINS_REALTIME]: {
      enabled: true,
      rolloutPercentage: 50, // 50% rollout
    },
    [FeatureFlag.ARGUMENT_CHAINS_EXPORT]: {
      enabled: true,
      rolloutPercentage: 100,
    },
    [FeatureFlag.ARGUMENT_CHAINS_ANALYSIS]: {
      enabled: true,
      rolloutPercentage: 100,
    },
  };

  return defaults[flag];
}

/**
 * Simple string hash for consistent bucketing
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * React hook for feature flags
 */
export function useFeatureFlag(
  flag: FeatureFlag,
  context: {
    userId?: string;
    deliberationId?: string;
  }
): boolean {
  const [enabled, setEnabled] = React.useState(false);

  React.useEffect(() => {
    isFeatureEnabled(flag, context).then(setEnabled);
  }, [flag, context.userId, context.deliberationId]);

  return enabled;
}
```

**Usage in components**:

```typescript
import { useFeatureFlag, FeatureFlag } from "@/lib/featureFlags";

export function DeepDiveTabs({ deliberationId }: Props) {
  const chainsEnabled = useFeatureFlag(FeatureFlag.ARGUMENT_CHAINS, {
    deliberationId,
  });

  return (
    <Tabs>
      {/* Other tabs */}
      {chainsEnabled && (
        <TabsContent value="argumentChains">
          <ArgumentChainsTab deliberationId={deliberationId} />
        </TabsContent>
      )}
    </Tabs>
  );
}
```

**Acceptance Criteria**:
- [x] Feature flag enum
- [x] Config with rollout percentage
- [x] User/deliberation allowlists
- [x] Date-based enable/disable
- [x] Environment variable overrides
- [x] Consistent hash-based rollout
- [x] React hook for components

**Estimated Time**: 2 hours

---

#### Task 8.4: Gradual Rollout Plan
**File**: `docs/ARGUMENT_CHAIN_ROLLOUT_PLAN.md`

```markdown
# Argument Chain Feature Rollout Plan

## Phase 1: Internal Testing (Week 1)
**Rollout**: 0% public, internal team only

- Enable for specific user IDs (team members)
- Test all core functionality
- Monitor error rates and performance
- Gather internal feedback

**Success Criteria**:
- Zero critical bugs
- All tests passing
- Performance metrics within targets
- Team approval

## Phase 2: Beta Testing (Week 2-3)
**Rollout**: 10% of users, selected beta testers

- Enable for beta user allowlist
- Enable for selected deliberations
- Monitor real-world usage patterns
- Collect user feedback
- Track analytics (usage, engagement)

**Success Criteria**:
- < 1% error rate
- Positive user feedback (> 80% satisfaction)
- No performance degradation
- < 5 reported bugs

## Phase 3: Limited Release (Week 4-5)
**Rollout**: 25% → 50% of users

- Gradual percentage increase
- Monitor key metrics daily
- A/B test impact on engagement
- Optimize based on usage data

**Success Criteria**:
- < 0.5% error rate
- Engagement increase (> 20% of users try feature)
- No infrastructure issues
- Positive support ticket sentiment

## Phase 4: General Availability (Week 6)
**Rollout**: 100% of users

- Full release to all users
- Feature announcement
- Documentation published
- Support team trained

**Success Criteria**:
- Stable performance
- High adoption rate (> 30% monthly active users)
- Positive community feedback
- Feature becomes core workflow

## Rollback Criteria

Immediate rollback if:
- Critical bug affecting data integrity
- Error rate > 5%
- Performance degradation > 50%
- Security vulnerability discovered
- Database corruption detected

## Monitoring Metrics

### Performance
- API response times (p50, p95, p99)
- Database query performance
- Frontend render times
- Realtime connection stability

### Usage
- Chains created per day
- Arguments added per chain
- Active collaborators per chain
- Export/share usage

### Errors
- API error rates by endpoint
- Frontend JavaScript errors
- Database connection errors
- Realtime sync failures

### Business
- User engagement increase
- Time spent in chains
- Deliberation completion rates
- User retention impact
```

**Rollout script**:
**File**: `scripts/update-rollout-percentage.ts`

```typescript
import { prisma } from "@/lib/prisma";

async function updateRollout(percentage: number) {
  if (percentage < 0 || percentage > 100) {
    throw new Error("Percentage must be between 0 and 100");
  }

  console.log(`🚀 Updating rollout to ${percentage}%`);

  // Update feature flag config
  await prisma.featureFlag.update({
    where: { name: "argument_chains" },
    data: { rolloutPercentage: percentage },
  });

  console.log("✅ Rollout updated successfully");
}

const percentage = parseInt(process.argv[2]);
updateRollout(percentage);
```

**Acceptance Criteria**:
- [x] Phased rollout plan
- [x] Success criteria per phase
- [x] Rollback criteria
- [x] Monitoring metrics defined
- [x] Rollout script
- [x] Documentation

**Estimated Time**: 1.5 hours

---

### 8.3 Monitoring & Observability

#### Task 8.5: Setup Application Monitoring
**File**: `lib/monitoring/chainMetrics.ts`

```typescript
import { CloudWatch } from "aws-sdk";

const cloudwatch = new CloudWatch({ region: process.env.AWS_REGION });

export enum ChainMetric {
  CHAIN_CREATED = "ChainCreated",
  NODE_ADDED = "NodeAdded",
  EDGE_ADDED = "EdgeAdded",
  CHAIN_ANALYZED = "ChainAnalyzed",
  CHAIN_EXPORTED = "ChainExported",
  REALTIME_CONNECTION = "RealtimeConnection",
  API_ERROR = "APIError",
  API_LATENCY = "APILatency",
}

/**
 * Record metric to CloudWatch
 */
export async function recordMetric(
  metric: ChainMetric,
  value: number = 1,
  dimensions?: Record<string, string>
) {
  const params = {
    Namespace: "Mesh/ArgumentChains",
    MetricData: [
      {
        MetricName: metric,
        Value: value,
        Unit: "Count",
        Timestamp: new Date(),
        Dimensions: dimensions
          ? Object.entries(dimensions).map(([key, value]) => ({
              Name: key,
              Value: value,
            }))
          : [],
      },
    ],
  };

  try {
    await cloudwatch.putMetricData(params).promise();
  } catch (error) {
    console.error("Failed to record metric:", error);
    // Don't throw - metrics should not break main flow
  }
}

/**
 * Record API latency
 */
export async function recordAPILatency(
  endpoint: string,
  latencyMs: number,
  statusCode: number
) {
  await recordMetric(ChainMetric.API_LATENCY, latencyMs, {
    Endpoint: endpoint,
    StatusCode: statusCode.toString(),
  });
}

/**
 * Record error
 */
export async function recordError(
  errorType: string,
  endpoint?: string,
  message?: string
) {
  await recordMetric(ChainMetric.API_ERROR, 1, {
    ErrorType: errorType,
    Endpoint: endpoint || "unknown",
  });

  // Also log to error tracking (Sentry, etc.)
  console.error(`[ChainError] ${errorType}`, {
    endpoint,
    message,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Middleware to track API metrics
 */
export function withMetrics(handler: Function, endpoint: string) {
  return async (req: Request, ...args: any[]) => {
    const startTime = Date.now();

    try {
      const response = await handler(req, ...args);
      const latency = Date.now() - startTime;

      await recordAPILatency(endpoint, latency, response.status);

      return response;
    } catch (error) {
      const latency = Date.now() - startTime;

      await recordAPILatency(endpoint, latency, 500);
      await recordError(
        error instanceof Error ? error.name : "UnknownError",
        endpoint,
        error instanceof Error ? error.message : undefined
      );

      throw error;
    }
  };
}
```

**Usage in API routes**:

```typescript
import { withMetrics, recordMetric, ChainMetric } from "@/lib/monitoring/chainMetrics";

export const POST = withMetrics(async (req: Request) => {
  // Create chain logic...
  
  await recordMetric(ChainMetric.CHAIN_CREATED, 1, {
    ChainType: body.chainType,
    DeliberationId: body.deliberationId,
  });

  return NextResponse.json({ chain });
}, "/api/argument-chains");
```

**Acceptance Criteria**:
- [x] CloudWatch integration
- [x] Custom metrics defined
- [x] Latency tracking
- [x] Error tracking
- [x] Middleware for automatic tracking
- [x] Dimension support

**Estimated Time**: 2 hours

---

#### Task 8.6: Create Monitoring Dashboard
**File**: `infrastructure/monitoring/chain-dashboard.json`

```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["Mesh/ArgumentChains", "ChainCreated", { "stat": "Sum" }],
          [".", "NodeAdded", { "stat": "Sum" }],
          [".", "EdgeAdded", { "stat": "Sum" }]
        ],
        "period": 300,
        "stat": "Sum",
        "region": "us-east-1",
        "title": "Chain Activity"
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["Mesh/ArgumentChains", "APILatency", { "stat": "Average" }],
          ["...", { "stat": "p95" }],
          ["...", { "stat": "p99" }]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-east-1",
        "title": "API Latency",
        "yAxis": {
          "left": {
            "label": "Milliseconds"
          }
        }
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["Mesh/ArgumentChains", "APIError", { "stat": "Sum" }]
        ],
        "period": 300,
        "stat": "Sum",
        "region": "us-east-1",
        "title": "Error Rate"
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["Mesh/ArgumentChains", "RealtimeConnection", { "stat": "Average" }]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-east-1",
        "title": "Active Realtime Connections"
      }
    },
    {
      "type": "log",
      "properties": {
        "query": "SOURCE '/aws/lambda/mesh-api' | fields @timestamp, @message | filter @message like /ChainError/ | sort @timestamp desc | limit 20",
        "region": "us-east-1",
        "title": "Recent Errors"
      }
    }
  ]
}
```

**Terraform for CloudWatch Alarms**:
**File**: `infrastructure/terraform/monitoring.tf`

```hcl
resource "aws_cloudwatch_metric_alarm" "chain_error_rate" {
  alarm_name          = "mesh-argument-chains-high-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "APIError"
  namespace           = "Mesh/ArgumentChains"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors argument chain API error rate"
  alarm_actions       = [aws_sns_topic.alerts.arn]
}

resource "aws_cloudwatch_metric_alarm" "chain_latency" {
  alarm_name          = "mesh-argument-chains-high-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "APILatency"
  namespace           = "Mesh/ArgumentChains"
  period              = "300"
  statistic           = "Average"
  threshold           = "1000"
  alarm_description   = "This metric monitors argument chain API latency"
  alarm_actions       = [aws_sns_topic.alerts.arn]
}

resource "aws_sns_topic" "alerts" {
  name = "mesh-argument-chains-alerts"
}

resource "aws_sns_topic_subscription" "alerts_email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = "devops@mesh.com"
}
```

**Acceptance Criteria**:
- [x] CloudWatch dashboard JSON
- [x] Key metrics visualized
- [x] Error log queries
- [x] Latency percentiles
- [x] CloudWatch alarms
- [x] SNS notifications
- [x] Terraform infrastructure

**Estimated Time**: 2.5 hours

---

### 8.4 Documentation & Training

#### Task 8.7: User Documentation
**File**: `docs/features/ARGUMENT_CHAINS.md`

```markdown
# Argument Chains

Build and analyze complex argumentative structures by connecting multiple arguments across your deliberation.

## Overview

Argument Chains allow you to:
- **Connect arguments** in causal, linear, or dialectical structures
- **Analyze relationships** between multiple arguments
- **Identify critical paths** through complex argumentation
- **Collaborate in real-time** with other deliberation members
- **Export and share** your chains

## Getting Started

### Creating Your First Chain

1. Navigate to a deliberation
2. Click the **Chains** tab
3. Click **New Chain**
4. Enter a name and description
5. Select chain type:
   - **Causal**: Arguments showing cause-and-effect relationships
   - **Linear**: Sequential argumentation (premise → conclusion)
   - **Dialectical**: Opposing arguments in structured debate

### Adding Arguments

1. In the chain editor, click **Add Argument**
2. Search or select from deliberation arguments
3. Drag argument cards onto the canvas
4. Position nodes as needed

### Creating Connections

1. Hover over an argument node
2. Click and drag from the bottom handle
3. Release over another argument's top handle
4. Select connection type:
   - **Supports**: This argument strengthens the target
   - **Opposes**: This argument weakens the target
   - **Neutral**: Related but no direct support/opposition
5. Set connection strength (0-1)

### Analyzing Your Chain

Click **Analysis** to view:
- **Metrics**: Argument count, connections, depth, overall strength
- **Critical Path**: Longest path through your chain
- **Weak Links**: Arguments or connections that need strengthening
- **Suggestions**: AI-powered recommendations

### Exporting & Sharing

1. Click **Export**
2. Choose format:
   - **PNG/JPEG**: High-quality image
   - **SVG**: Vector graphics for editing
   - **JSON**: Raw data for external tools
   - **PDF**: Comprehensive report with analysis
3. Or click **Share** to generate a public link

## Best Practices

### Structure
- Start with conclusion at the top
- Place premises below
- Group related arguments
- Use auto-layout for clean positioning

### Connections
- Be explicit about support/opposition
- Set realistic strength values
- Label ambiguous connections
- Avoid circular reasoning

### Collaboration
- Communicate changes via activity feed
- Resolve conflicts promptly
- Use comments for discussions
- Respect permission levels

## Keyboard Shortcuts

- `Ctrl/Cmd + N` - Add new argument
- `Delete` - Remove selected nodes
- `Ctrl/Cmd + E` - Export chain
- `Ctrl/Cmd + F` - Fit to view
- `Ctrl/Cmd + Z` - Undo
- `?` - Show all shortcuts

## FAQ

**Q: Can I use the same argument in multiple chains?**
A: Yes! Arguments can appear in multiple chains across your deliberation.

**Q: How do I make my chain public?**
A: Open Settings and toggle "Public Chain". Public chains are visible to all deliberation members.

**Q: What happens if two people edit simultaneously?**
A: The system detects conflicts and prompts you to resolve them.

**Q: Can I nest SchemeNet within chains?**
A: Yes! Click the SchemeNet icon on any node to view detailed internal structure.

## Support

Need help? Contact support@mesh.com or visit our Help Center.
```

**Acceptance Criteria**:
- [x] Complete user guide
- [x] Getting started section
- [x] Step-by-step instructions
- [x] Best practices
- [x] Keyboard shortcuts
- [x] FAQ section
- [x] Support contact

**Estimated Time**: 3 hours

---

#### Task 8.8: Developer Documentation
**File**: `docs/development/ARGUMENT_CHAINS_ARCHITECTURE.md`

```markdown
# Argument Chains Architecture

Technical documentation for developers working on the Argument Chains feature.

## System Overview

```
┌─────────────────────────────────────────────────────┐
│                   Frontend Layer                    │
├─────────────────────────────────────────────────────┤
│  ArgumentChainConstructor (Main Component)          │
│  ├─ ChainCanvas (ReactFlow)                        │
│  ├─ ArgumentPalette (Sidebar)                      │
│  ├─ ChainAnalysisDashboard                         │
│  └─ Real-time Collaboration (Supabase)             │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│                    API Layer                        │
├─────────────────────────────────────────────────────┤
│  /api/argument-chains/*                             │
│  ├─ CRUD operations                                 │
│  ├─ Node/edge management                            │
│  ├─ Analysis endpoints                              │
│  └─ Permission checks                               │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│                  Database Layer                     │
├─────────────────────────────────────────────────────┤
│  ArgumentChain, ChainNode, ChainEdge               │
│  ChainPermission, ChainActivity                    │
│  └─ Indexes for performance                        │
└─────────────────────────────────────────────────────┘
```

## Data Model

### Core Entities

**ArgumentChain**
- Container for chain metadata
- Links to deliberation
- Creator and permissions

**ChainNode**
- Represents argument in chain
- Position (x, y coordinates)
- Role (premise, conclusion, objection)

**ChainEdge**
- Connection between nodes
- Type (supports, opposes, neutral)
- Strength (0-1)

### Relationships

- Chain → Nodes (1:many)
- Chain → Edges (1:many)
- Node → Argument (many:1)
- Edge → Source/Target Nodes (many:1)

## Key Components

### ArgumentChainConstructor

Main container component managing:
- ReactFlow instance
- Zustand state management
- Real-time sync
- Event handling

**Props**:
```typescript
interface Props {
  chainId: string;
}
```

### ChainCanvas

ReactFlow canvas with custom nodes/edges:
- Drag and drop
- Auto-layout (Dagre)
- Connection creation
- Selection handling

### Real-time System

**ChainRealtimeClient**
- Supabase WebSocket channels
- Broadcast events (CRUD operations)
- Presence tracking (cursors, selections)
- Event routing

**Integration**:
```typescript
const client = new ChainRealtimeClient(chainId, userId, userName);
await client.subscribe({
  onNodeAdded: handleRemoteNodeAdded,
  onPresenceChange: updateActiveCursors,
});
```

## API Endpoints

### Chain Management

- `POST /api/argument-chains` - Create chain
- `GET /api/argument-chains/[id]` - Get chain
- `PATCH /api/argument-chains/[id]` - Update chain
- `DELETE /api/argument-chains/[id]` - Delete chain

### Node Management

- `POST /api/argument-chains/[id]/nodes` - Add node
- `PATCH /api/argument-chains/[id]/nodes/[nodeId]` - Update node
- `DELETE /api/argument-chains/[id]/nodes/[nodeId]` - Remove node

### Edge Management

- `POST /api/argument-chains/[id]/edges` - Add edge
- `PATCH /api/argument-chains/[id]/edges/[edgeId]` - Update edge
- `DELETE /api/argument-chains/[id]/edges/[edgeId]` - Remove edge

### Analysis

- `POST /api/argument-chains/[id]/analyze` - Run analysis

## State Management

### Zustand Store

```typescript
interface ChainEditorStore {
  nodes: Node[];
  edges: Edge[];
  selectedNodes: string[];
  history: HistoryState[];
  historyIndex: number;
  
  // Actions
  addNode(node: Node): void;
  updateNode(id: string, updates: Partial<Node>): void;
  removeNode(id: string): void;
  // ... edge actions
  undo(): void;
  redo(): void;
}
```

### History System

- Max 50 states
- Push on every mutation
- Deep copy to prevent mutation

## Performance Optimization

### Database

- Indexes on foreign keys
- Composite indexes for queries
- Connection pooling (Prisma)

### Frontend

- React.memo for expensive components
- Virtualization for large chains (react-window)
- Debounced auto-save (2 seconds)
- Throttled cursor updates (10/sec)

### Real-time

- Message batching
- Presence throttling
- Optimistic updates

## Testing

### Unit Tests
- Utils: `lib/utils/__tests__/`
- Store: `lib/stores/__tests__/`

### Integration Tests
- Components: `__tests__/integration/`

### E2E Tests
- Playwright: `e2e/`

## Deployment

### Feature Flags

```typescript
import { isFeatureEnabled, FeatureFlag } from "@/lib/featureFlags";

if (await isFeatureEnabled(FeatureFlag.ARGUMENT_CHAINS, { userId })) {
  // Show feature
}
```

### Monitoring

- CloudWatch metrics
- Error tracking (Sentry)
- Performance monitoring (New Relic)

### Rollout

- Phase 1: Internal (0%)
- Phase 2: Beta (10%)
- Phase 3: Limited (50%)
- Phase 4: GA (100%)

## Contributing

### Code Style

- Use TypeScript strict mode
- Double quotes for strings
- Functional components with hooks
- Run `npm run lint` before commit

### Pull Request Process

1. Create feature branch
2. Write tests
3. Update documentation
4. Submit PR with description
5. Address review feedback
6. Merge after approval

## Troubleshooting

### Common Issues

**Realtime not working**
- Check Supabase connection
- Verify channel subscription
- Check browser console for errors

**Slow performance**
- Check node count (> 100?)
- Enable React Profiler
- Check network waterfall

**Data inconsistency**
- Run validation script
- Check for orphaned records
- Verify foreign key constraints

## Additional Resources

- [ReactFlow Docs](https://reactflow.dev)
- [Prisma Docs](https://www.prisma.io/docs)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
```

**Acceptance Criteria**:
- [x] Architecture diagram
- [x] Data model documentation
- [x] Component descriptions
- [x] API endpoint reference
- [x] State management docs
- [x] Performance tips
- [x] Testing guide
- [x] Deployment process
- [x] Troubleshooting section

**Estimated Time**: 4 hours

---

**Phase 5 Part 11 Summary**:
- **Total Tasks**: 8 tasks (8.1-8.8)
- **Estimated Time**: 20.5 hours (2.5 weeks)
- **Deliverable**: Production-ready deployment with migrations, feature flags, monitoring, and comprehensive documentation

---

## Phase 5 Complete Summary

**Total Phase 5 Tasks**: 25 tasks (6.1-8.8)
**Total Phase 5 Time**: 62 hours (7-8 weeks)

### Part 9: Integration & Polish (9 tasks, 17.5 hours)
- DeepDive v3 integration
- SchemeNet nesting
- Navigation breadcrumbs
- Keyboard shortcuts
- Undo/redo system
- Error boundaries
- Onboarding

### Part 10: Testing Strategy (8 tasks, 24 hours)
- Unit tests (utils, stores, APIs)
- Integration tests (flows, realtime, analysis)
- E2E tests (Playwright)

### Part 11: Deployment (8 tasks, 20.5 hours)
- Database migrations
- Feature flags
- Gradual rollout
- Monitoring dashboards
- User documentation
- Developer documentation

---

## Complete Roadmap Summary

### All Phases Overview

**Phase 1: Backend Infrastructure** (13 tasks, 18-21 hours)
- Database schema
- API endpoints
- Authentication & permissions
- Type definitions

**Phase 2: Visual Editor & UX** (12 tasks, 25.5-27.5 hours)
- ReactFlow setup
- Custom components
- Drag & drop
- Connection editor

**Phase 3: Analysis Features** (7 tasks, 18.5 hours)
- Critical path algorithms
- Metrics dashboard
- Export functionality
- Chain comparison

**Phase 4: Collaboration** (12 tasks, 24.5 hours)
- Real-time sync
- Cursor tracking
- Activity feed
- Notifications

**Phase 5: Integration & Polish** (25 tasks, 62 hours)
- DeepDive integration
- Testing suite
- Deployment infrastructure

---

**TOTAL IMPLEMENTATION**:
- **69 Tasks**
- **148.5-153 Hours** (~7-10 weeks with team)
- **5 Major Phases**
- **~15,000 Lines of Documentation**

---

🎉 **Argument Chain Implementation Roadmap Complete!**
