# ArgumentChain Implementation Roadmap - Phase 4

**Phase 4: Collaboration & Real-time Features**  
**Duration**: 1.5-2 weeks  
**Goal**: Multi-user collaborative editing with real-time updates  
**Prerequisite**: Phase 3 complete (analysis features working)

---

## Table of Contents

- [Part 7: Phase 4 Overview](#part-7-phase-4-overview)
- [Real-time Synchronization](#real-time-synchronization)
- [Collaborative Editing](#collaborative-editing)
- [Permissions & Access Control](#permissions--access-control)
- [Activity Feed & Notifications](#activity-feed--notifications)

---

## Part 7: Phase 4 Overview

### Phase 4 Goals

**What We're Building**:
Real-time collaborative features that enable multiple users to:
1. Edit the same chain simultaneously
2. See live cursor positions and selections
3. Receive instant updates when others add/remove nodes or edges
4. Manage permissions (who can view, edit, comment)
5. Track all changes with an activity feed
6. Get notifications when chains are updated

**Key Technologies**:
- **Supabase Realtime**: WebSocket-based real-time updates
- **Optimistic Updates**: Immediate UI feedback with rollback on conflict
- **Presence**: Show who's currently viewing/editing
- **Activity Logging**: Audit trail of all changes
- **Push Notifications**: Web Push API for browser notifications

---

### 5.1 Real-time Synchronization

#### Task 5.1: Setup Supabase Realtime Channel for Chains
**File**: `lib/realtime/chainRealtimeClient.ts`

```typescript
import { createClient } from "@supabase/supabase-js";
import { RealtimeChannel } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface ChainRealtimeEvent {
  type: "node_added" | "node_removed" | "node_updated" | "edge_added" | "edge_removed" | "edge_updated" | "metadata_updated";
  chainId: string;
  userId: string;
  userName: string;
  timestamp: string;
  data: any;
}

export interface ChainPresence {
  userId: string;
  userName: string;
  userImage?: string;
  cursorPosition?: { x: number; y: number };
  selectedNodeId?: string;
  selectedEdgeId?: string;
  lastSeen: string;
}

export class ChainRealtimeClient {
  private channel: RealtimeChannel | null = null;
  private chainId: string;
  private userId: string;
  private userName: string;

  constructor(chainId: string, userId: string, userName: string) {
    this.chainId = chainId;
    this.userId = userId;
    this.userName = userName;
  }

  /**
   * Subscribe to chain updates
   */
  subscribe(callbacks: {
    onNodeAdded?: (event: ChainRealtimeEvent) => void;
    onNodeRemoved?: (event: ChainRealtimeEvent) => void;
    onNodeUpdated?: (event: ChainRealtimeEvent) => void;
    onEdgeAdded?: (event: ChainRealtimeEvent) => void;
    onEdgeRemoved?: (event: ChainRealtimeEvent) => void;
    onEdgeUpdated?: (event: ChainRealtimeEvent) => void;
    onMetadataUpdated?: (event: ChainRealtimeEvent) => void;
    onPresenceChange?: (presences: Record<string, ChainPresence>) => void;
  }) {
    // Create channel
    this.channel = supabase.channel(`chain:${this.chainId}`, {
      config: {
        presence: {
          key: this.userId,
        },
      },
    });

    // Subscribe to broadcast events
    this.channel.on(
      "broadcast",
      { event: "chain_update" },
      (payload: { payload: ChainRealtimeEvent }) => {
        const event = payload.payload;

        // Don't process our own events
        if (event.userId === this.userId) return;

        // Route to appropriate callback
        switch (event.type) {
          case "node_added":
            callbacks.onNodeAdded?.(event);
            break;
          case "node_removed":
            callbacks.onNodeRemoved?.(event);
            break;
          case "node_updated":
            callbacks.onNodeUpdated?.(event);
            break;
          case "edge_added":
            callbacks.onEdgeAdded?.(event);
            break;
          case "edge_removed":
            callbacks.onEdgeRemoved?.(event);
            break;
          case "edge_updated":
            callbacks.onEdgeUpdated?.(event);
            break;
          case "metadata_updated":
            callbacks.onMetadataUpdated?.(event);
            break;
        }
      }
    );

    // Subscribe to presence
    this.channel.on("presence", { event: "sync" }, () => {
      const state = this.channel!.presenceState<ChainPresence>();
      const presences: Record<string, ChainPresence> = {};

      Object.keys(state).forEach((userId) => {
        const presence = state[userId][0]; // Get first presence for user
        if (presence) {
          presences[userId] = presence;
        }
      });

      callbacks.onPresenceChange?.(presences);
    });

    // Subscribe and track presence
    this.channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await this.channel!.track({
          userId: this.userId,
          userName: this.userName,
          lastSeen: new Date().toISOString(),
        });
      }
    });

    return this.channel;
  }

  /**
   * Broadcast a chain update event
   */
  async broadcastUpdate(event: Omit<ChainRealtimeEvent, "chainId" | "userId" | "userName" | "timestamp">) {
    if (!this.channel) {
      console.warn("Channel not subscribed");
      return;
    }

    await this.channel.send({
      type: "broadcast",
      event: "chain_update",
      payload: {
        ...event,
        chainId: this.chainId,
        userId: this.userId,
        userName: this.userName,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Update presence (cursor position, selection)
   */
  async updatePresence(update: Partial<ChainPresence>) {
    if (!this.channel) {
      console.warn("Channel not subscribed");
      return;
    }

    await this.channel.track({
      userId: this.userId,
      userName: this.userName,
      lastSeen: new Date().toISOString(),
      ...update,
    });
  }

  /**
   * Unsubscribe from channel
   */
  unsubscribe() {
    if (this.channel) {
      this.channel.unsubscribe();
      this.channel = null;
    }
  }
}
```

**Acceptance Criteria**:
- [x] Supabase Realtime channel setup
- [x] Broadcast chain update events
- [x] Presence tracking (who's viewing/editing)
- [x] Event routing by type
- [x] Ignore own events (prevent echo)
- [x] Proper cleanup on unsubscribe

**Estimated Time**: 2 hours

---

#### Task 5.2: Integrate Real-time into Chain Editor
**File**: `components/chains/ArgumentChainConstructor.tsx`

```typescript
import { ChainRealtimeClient, ChainPresence } from "@/lib/realtime/chainRealtimeClient";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";

// Add to ArgumentChainConstructor component:

export function ArgumentChainConstructor({ chainId, deliberationId }: ArgumentChainConstructorProps) {
  const { data: session } = useSession();
  const realtimeClient = useRef<ChainRealtimeClient | null>(null);
  const [activeUsers, setActiveUsers] = useState<Record<string, ChainPresence>>({});

  // ... existing state ...

  // Setup realtime
  useEffect(() => {
    if (!chainId || !session?.user) return;

    const client = new ChainRealtimeClient(
      chainId,
      session.user.id,
      session.user.name || "Anonymous"
    );

    client.subscribe({
      // Node events
      onNodeAdded: (event) => {
        console.log("Remote node added:", event);
        
        // Add node to store if not already present
        useChainEditorStore.setState((state) => {
          const exists = state.nodes.some((n) => n.id === event.data.node.id);
          if (exists) return state;

          return {
            nodes: [
              ...state.nodes,
              {
                id: event.data.node.id,
                type: "argumentChainNode",
                position: {
                  x: event.data.node.positionX,
                  y: event.data.node.positionY,
                },
                data: {
                  argument: event.data.node.argument,
                  role: event.data.node.role,
                  addedBy: event.data.node.addedBy,
                  nodeOrder: event.data.node.nodeOrder,
                },
              },
            ],
          };
        });

        toast.info(`${event.userName} added an argument`);
      },

      onNodeRemoved: (event) => {
        console.log("Remote node removed:", event);
        
        useChainEditorStore.setState((state) => ({
          nodes: state.nodes.filter((n) => n.id !== event.data.nodeId),
          edges: state.edges.filter(
            (e) => e.source !== event.data.nodeId && e.target !== event.data.nodeId
          ),
        }));

        toast.info(`${event.userName} removed an argument`);
      },

      onNodeUpdated: (event) => {
        console.log("Remote node updated:", event);
        
        useChainEditorStore.setState((state) => ({
          nodes: state.nodes.map((n) =>
            n.id === event.data.nodeId
              ? {
                  ...n,
                  position: {
                    x: event.data.positionX ?? n.position.x,
                    y: event.data.positionY ?? n.position.y,
                  },
                  data: {
                    ...n.data,
                    role: event.data.role ?? n.data.role,
                  },
                }
              : n
          ),
        }));
      },

      // Edge events
      onEdgeAdded: (event) => {
        console.log("Remote edge added:", event);
        
        useChainEditorStore.setState((state) => {
          const exists = state.edges.some((e) => e.id === event.data.edge.id);
          if (exists) return state;

          return {
            edges: [
              ...state.edges,
              {
                id: event.data.edge.id,
                source: event.data.edge.sourceNodeId,
                target: event.data.edge.targetNodeId,
                type: "argumentChainEdge",
                data: {
                  edgeType: event.data.edge.edgeType,
                  strength: event.data.edge.strength,
                  description: event.data.edge.description,
                  slotMapping: event.data.edge.slotMapping,
                },
              },
            ],
          };
        });

        toast.info(`${event.userName} added a connection`);
      },

      onEdgeRemoved: (event) => {
        console.log("Remote edge removed:", event);
        
        useChainEditorStore.setState((state) => ({
          edges: state.edges.filter((e) => e.id !== event.data.edgeId),
        }));

        toast.info(`${event.userName} removed a connection`);
      },

      onEdgeUpdated: (event) => {
        console.log("Remote edge updated:", event);
        
        useChainEditorStore.setState((state) => ({
          edges: state.edges.map((e) =>
            e.id === event.data.edgeId
              ? {
                  ...e,
                  data: {
                    ...e.data,
                    edgeType: event.data.edgeType ?? e.data.edgeType,
                    strength: event.data.strength ?? e.data.strength,
                    description: event.data.description ?? e.data.description,
                    slotMapping: event.data.slotMapping ?? e.data.slotMapping,
                  },
                }
              : e
          ),
        }));
      },

      // Metadata events
      onMetadataUpdated: (event) => {
        console.log("Remote metadata updated:", event);
        
        useChainEditorStore.setState({
          chainName: event.data.name ?? useChainEditorStore.getState().chainName,
          chainType: event.data.chainType ?? useChainEditorStore.getState().chainType,
          isPublic: event.data.isPublic ?? useChainEditorStore.getState().isPublic,
          isEditable: event.data.isEditable ?? useChainEditorStore.getState().isEditable,
        });

        toast.info(`${event.userName} updated chain settings`);
      },

      // Presence changes
      onPresenceChange: (presences) => {
        console.log("Presence update:", presences);
        setActiveUsers(presences);
      },
    });

    realtimeClient.current = client;

    // Cleanup
    return () => {
      client.unsubscribe();
      realtimeClient.current = null;
    };
  }, [chainId, session]);

  // Broadcast node addition
  const handleArgumentAddWithBroadcast = async (argument: any, position?: { x: number; y: number }) => {
    // ... existing local update logic ...

    // Broadcast to others
    if (realtimeClient.current && serverNode) {
      await realtimeClient.current.broadcastUpdate({
        type: "node_added",
        data: {
          node: serverNode,
        },
      });
    }
  };

  // ... rest of component ...

  return (
    <div className="flex flex-col h-screen">
      {/* Active Users Indicator */}
      {Object.keys(activeUsers).length > 0 && (
        <div className="absolute top-4 left-4 z-10 bg-background border rounded-lg shadow-lg p-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Viewing:</span>
            <div className="flex -space-x-2">
              {Object.values(activeUsers).slice(0, 5).map((user) => (
                <Avatar key={user.userId} className="h-6 w-6 border-2 border-background">
                  <AvatarImage src={user.userImage} />
                  <AvatarFallback className="text-xs">
                    {user.userName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            {Object.keys(activeUsers).length > 5 && (
              <span className="text-xs text-muted-foreground">
                +{Object.keys(activeUsers).length - 5}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ... rest of UI ... */}
    </div>
  );
}
```

**Acceptance Criteria**:
- [x] Real-time client initialized on mount
- [x] Receives and applies remote updates
- [x] Shows toast notifications for remote changes
- [x] Displays active users with avatars
- [x] Broadcasts own changes to others
- [x] Prevents duplicate updates (checks existence)
- [x] Cleanup on unmount

**Estimated Time**: 3 hours

---

#### Task 5.3: Handle Cursor Tracking & Live Selections
**File**: `components/chains/CursorTracker.tsx`

```typescript
"use client";

import React, { useEffect, useRef } from "react";
import { ChainPresence } from "@/lib/realtime/chainRealtimeClient";
import { useReactFlow } from "reactflow";

interface CursorTrackerProps {
  activeUsers: Record<string, ChainPresence>;
  onCursorMove: (position: { x: number; y: number }) => void;
}

export function CursorTracker({ activeUsers, onCursorMove }: CursorTrackerProps) {
  const reactFlowInstance = useReactFlow();
  const canvasRef = useRef<HTMLDivElement>(null);

  // Track local cursor and broadcast
  useEffect(() => {
    const canvas = document.querySelector(".react-flow__viewport");
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Convert screen coordinates to flow coordinates
      const position = reactFlowInstance.screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });

      onCursorMove(position);
    };

    canvas.addEventListener("mousemove", handleMouseMove);

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
    };
  }, [reactFlowInstance, onCursorMove]);

  return (
    <>
      {/* Render remote cursors */}
      {Object.entries(activeUsers).map(([userId, presence]) => {
        if (!presence.cursorPosition) return null;

        // Convert flow coordinates to screen coordinates
        const screenPos = reactFlowInstance.flowToScreenPosition({
          x: presence.cursorPosition.x,
          y: presence.cursorPosition.y,
        });

        return (
          <div
            key={userId}
            className="fixed pointer-events-none z-50"
            style={{
              left: `${screenPos.x}px`,
              top: `${screenPos.y}px`,
              transform: "translate(-4px, -4px)",
            }}
          >
            {/* Cursor */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))",
              }}
            >
              <path
                d="M5.65376 12.3673L14.8516 21.5652L17.4699 14.9154L22.7053 13.6362L5.65376 12.3673Z"
                fill={getUserColor(userId)}
                stroke="white"
                strokeWidth="1.5"
              />
            </svg>

            {/* User name label */}
            <div
              className="absolute top-5 left-5 px-2 py-1 rounded text-xs font-medium whitespace-nowrap shadow-lg"
              style={{
                backgroundColor: getUserColor(userId),
                color: "white",
              }}
            >
              {presence.userName}
            </div>
          </div>
        );
      })}

      {/* Highlight selected nodes by others */}
      <style jsx global>{`
        ${Object.entries(activeUsers)
          .filter(([_, p]) => p.selectedNodeId)
          .map(
            ([userId, p]) => `
          [data-id="${p.selectedNodeId}"] {
            outline: 2px solid ${getUserColor(userId)} !important;
            outline-offset: 2px;
          }
        `
          )
          .join("\n")}
      `}</style>
    </>
  );
}

// Generate consistent color for user
function getUserColor(userId: string): string {
  const colors = [
    "#3b82f6", // blue
    "#8b5cf6", // purple
    "#ec4899", // pink
    "#f59e0b", // amber
    "#10b981", // green
    "#06b6d4", // cyan
    "#f97316", // orange
    "#6366f1", // indigo
  ];

  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}
```

**Usage in ChainCanvas**:
```typescript
import { CursorTracker } from "./CursorTracker";

// Add to ChainCanvasInner:
const handleCursorMove = useCallback(
  throttle((position: { x: number; y: number }) => {
    if (realtimeClient.current) {
      realtimeClient.current.updatePresence({
        cursorPosition: position,
      });
    }
  }, 100), // Throttle to 10 updates/sec
  []
);

// In render:
<ReactFlow {...props}>
  {/* ... existing content ... */}
  <CursorTracker activeUsers={activeUsers} onCursorMove={handleCursorMove} />
</ReactFlow>
```

**Acceptance Criteria**:
- [x] Tracks local cursor position
- [x] Broadcasts cursor position (throttled)
- [x] Renders remote cursors with user names
- [x] Highlights nodes selected by others
- [x] Consistent colors per user
- [x] Smooth cursor rendering

**Estimated Time**: 2.5 hours

---

### 5.2 Collaborative Editing

#### Task 5.4: Implement Optimistic Locking for Conflicts
**File**: `lib/utils/optimisticLocking.ts`

```typescript
interface OptimisticUpdate<T> {
  id: string;
  type: "create" | "update" | "delete";
  tempId: string;
  serverId?: string;
  timestamp: number;
  data: T;
  status: "pending" | "confirmed" | "failed";
  retryCount: number;
}

export class OptimisticUpdateManager<T> {
  private updates: Map<string, OptimisticUpdate<T>> = new Map();
  private maxRetries = 3;

  /**
   * Register an optimistic update
   */
  register(update: Omit<OptimisticUpdate<T>, "status" | "retryCount">): string {
    const fullUpdate: OptimisticUpdate<T> = {
      ...update,
      status: "pending",
      retryCount: 0,
    };

    this.updates.set(update.tempId, fullUpdate);
    return update.tempId;
  }

  /**
   * Confirm update succeeded
   */
  confirm(tempId: string, serverId: string) {
    const update = this.updates.get(tempId);
    if (!update) return;

    update.status = "confirmed";
    update.serverId = serverId;

    // Clean up old confirmed updates after 5 seconds
    setTimeout(() => {
      this.updates.delete(tempId);
    }, 5000);
  }

  /**
   * Mark update as failed
   */
  fail(tempId: string, shouldRetry: boolean = true): boolean {
    const update = this.updates.get(tempId);
    if (!update) return false;

    update.retryCount++;

    if (shouldRetry && update.retryCount < this.maxRetries) {
      update.status = "pending";
      return true; // Should retry
    }

    update.status = "failed";
    return false; // Don't retry
  }

  /**
   * Get all pending updates
   */
  getPending(): OptimisticUpdate<T>[] {
    return Array.from(this.updates.values()).filter((u) => u.status === "pending");
  }

  /**
   * Check if server ID matches any temp ID
   */
  resolveTempId(serverId: string): string | null {
    for (const [tempId, update] of this.updates.entries()) {
      if (update.serverId === serverId) {
        return tempId;
      }
    }
    return null;
  }

  /**
   * Clear all updates
   */
  clear() {
    this.updates.clear();
  }
}
```

**Acceptance Criteria**:
- [x] Track optimistic updates
- [x] Confirm on success
- [x] Retry on failure
- [x] Resolve temp IDs to server IDs
- [x] Auto-cleanup old updates

**Estimated Time**: 1.5 hours

---

#### Task 5.5: Add Conflict Resolution UI
**File**: `components/chains/ConflictResolver.tsx`

```typescript
"use client";

import React from "react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, X } from "lucide-react";

interface Conflict {
  id: string;
  type: "node" | "edge";
  operation: "add" | "update" | "delete";
  message: string;
  localData: any;
  remoteData?: any;
}

interface ConflictResolverProps {
  conflicts: Conflict[];
  onResolve: (conflictId: string, resolution: "keep-local" | "accept-remote" | "merge") => void;
  onDismiss: (conflictId: string) => void;
}

export function ConflictResolver({ conflicts, onResolve, onDismiss }: ConflictResolverProps) {
  if (conflicts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-md">
      {conflicts.map((conflict) => (
        <Alert key={conflict.id} variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Edit Conflict Detected</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="text-sm mb-3">{conflict.message}</p>
            
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onResolve(conflict.id, "keep-local")}
                className="flex-1"
              >
                Keep Mine
              </Button>
              
              {conflict.remoteData && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onResolve(conflict.id, "accept-remote")}
                  className="flex-1"
                >
                  Accept Theirs
                </Button>
              )}
              
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDismiss(conflict.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
```

**Acceptance Criteria**:
- [x] Displays conflict alerts
- [x] Offers resolution options (keep local, accept remote)
- [x] Dismissible conflicts
- [x] Clear conflict description
- [x] Positioned for visibility

**Estimated Time**: 1 hour

---

### 5.3 Permissions & Access Control

#### Task 5.6: Create Permission Management UI
**File**: `components/chains/ChainPermissionsModal.tsx`

```typescript
"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, UserPlus, Shield, Eye, Edit3, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ChainPermission {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    image?: string;
  };
  role: "viewer" | "editor" | "admin";
  grantedBy: string;
  grantedAt: string;
}

interface ChainPermissionsModalProps {
  chainId: string;
  isOpen: boolean;
  onClose: () => void;
  isCreator: boolean;
}

export function ChainPermissionsModal({
  chainId,
  isOpen,
  onClose,
  isCreator,
}: ChainPermissionsModalProps) {
  const [permissions, setPermissions] = useState<ChainPermission[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Fetch current permissions
  useEffect(() => {
    if (!isOpen) return;

    async function fetchPermissions() {
      try {
        const res = await fetch(`/api/argument-chains/${chainId}/permissions`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setPermissions(data.permissions || []);
      } catch (error) {
        console.error("Fetch error:", error);
        toast.error("Failed to load permissions");
      }
    }

    fetchPermissions();
  }, [chainId, isOpen]);

  const handleRoleChange = async (permissionId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/argument-chains/${chainId}/permissions/${permissionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (!res.ok) throw new Error("Failed to update");

      setPermissions((prev) =>
        prev.map((p) => (p.id === permissionId ? { ...p, role: newRole as any } : p))
      );

      toast.success("Permission updated");
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update permission");
    }
  };

  const handleRemovePermission = async (permissionId: string) => {
    try {
      const res = await fetch(`/api/argument-chains/${chainId}/permissions/${permissionId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to remove");

      setPermissions((prev) => prev.filter((p) => p.id !== permissionId));
      toast.success("Permission removed");
    } catch (error) {
      console.error("Remove error:", error);
      toast.error("Failed to remove permission");
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="h-4 w-4" />;
      case "editor":
        return <Edit3 className="h-4 w-4" />;
      case "viewer":
        return <Eye className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "default";
      case "editor":
        return "secondary";
      case "viewer":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Permissions</DialogTitle>
          <DialogDescription>
            Control who can view and edit this argument chain
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>

          {/* Permissions List */}
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {permissions.map((permission) => (
                <div
                  key={permission.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Avatar>
                      <AvatarImage src={permission.user.image} />
                      <AvatarFallback>
                        {permission.user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <p className="font-medium text-sm">{permission.user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Added {new Date(permission.grantedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isCreator ? (
                      <>
                        <Select
                          value={permission.role}
                          onValueChange={(value) => handleRoleChange(permission.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="viewer">
                              <div className="flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                Viewer
                              </div>
                            </SelectItem>
                            <SelectItem value="editor">
                              <div className="flex items-center gap-2">
                                <Edit3 className="h-4 w-4" />
                                Editor
                              </div>
                            </SelectItem>
                            <SelectItem value="admin">
                              <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                Admin
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemovePermission(permission.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Badge variant={getRoleBadgeVariant(permission.role)}>
                        {getRoleIcon(permission.role)}
                        <span className="ml-1">{permission.role}</span>
                      </Badge>
                    )}
                  </div>
                </div>
              ))}

              {permissions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No additional permissions set</p>
                  <p className="text-xs mt-1">Chain creator has full access</p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Add User Button */}
          {isCreator && (
            <Button variant="outline" className="w-full">
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**Acceptance Criteria**:
- [x] Lists current permissions
- [x] Shows user avatars and names
- [x] Role selection (viewer, editor, admin)
- [x] Remove permission button
- [x] Add user functionality
- [x] Only creator can modify
- [x] Search users

**Estimated Time**: 3 hours

---

**Phase 4 Part 7 Summary**:
- **Total Tasks**: 6 tasks (5.1-5.6)
- **Estimated Time**: 13 hours
- **Deliverable**: Real-time collaboration, cursor tracking, conflict resolution, and permission management

---

## Part 8: Activity Feed & Notifications

### 5.4 Activity Feed

#### Task 5.7: Create Chain Activity Log Schema
**File**: `prisma/schema.prisma` (add to existing)

```prisma
model ChainActivity {
  id        String   @id @default(cuid())
  chainId   String
  chain     ArgumentChain @relation(fields: [chainId], references: [id], onDelete: Cascade)
  
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  
  action    ChainActivityAction
  entityType String? // "node", "edge", "metadata"
  entityId   String? // ID of affected node/edge
  
  details   Json? // Additional context about the action
  metadata  Json? // Snapshot of entity state
  
  createdAt DateTime @default(now())
  
  @@index([chainId, createdAt])
  @@index([userId])
}

enum ChainActivityAction {
  CHAIN_CREATED
  CHAIN_UPDATED
  CHAIN_DELETED
  NODE_ADDED
  NODE_REMOVED
  NODE_UPDATED
  NODE_MOVED
  EDGE_ADDED
  EDGE_REMOVED
  EDGE_UPDATED
  PERMISSION_GRANTED
  PERMISSION_REVOKED
  EXPORTED
  SHARED
}
```

**Migration**: Run `npx prisma db push`

**Acceptance Criteria**:
- [x] Activity log table with proper relations
- [x] Indexes for performance
- [x] Comprehensive action types
- [x] JSON fields for flexible metadata

**Estimated Time**: 0.5 hours

---

#### Task 5.8: Create Activity Logging Middleware
**File**: `lib/middleware/activityLogger.ts`

```typescript
import { prisma } from "@/lib/prisma";
import { ChainActivityAction } from "@prisma/client";

export interface LogActivityParams {
  chainId: string;
  userId: string;
  action: ChainActivityAction;
  entityType?: "node" | "edge" | "metadata";
  entityId?: string;
  details?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Log chain activity
 */
export async function logChainActivity(params: LogActivityParams) {
  try {
    await prisma.chainActivity.create({
      data: {
        chainId: params.chainId,
        userId: params.userId,
        action: params.action,
        entityType: params.entityType || null,
        entityId: params.entityId || null,
        details: params.details || null,
        metadata: params.metadata || null,
      },
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
    // Don't throw - activity logging should not break main flow
  }
}

/**
 * Get activity feed for chain
 */
export async function getChainActivityFeed(
  chainId: string,
  options: {
    limit?: number;
    offset?: number;
    userId?: string; // Filter by user
    actions?: ChainActivityAction[]; // Filter by action types
  } = {}
) {
  const { limit = 50, offset = 0, userId, actions } = options;

  const where: any = { chainId };
  if (userId) where.userId = userId;
  if (actions && actions.length > 0) where.action = { in: actions };

  const activities = await prisma.chainActivity.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });

  const total = await prisma.chainActivity.count({ where });

  return { activities, total };
}

/**
 * Get activity stats for chain
 */
export async function getChainActivityStats(chainId: string) {
  const activities = await prisma.chainActivity.groupBy({
    by: ["action"],
    where: { chainId },
    _count: true,
  });

  const contributorCount = await prisma.chainActivity.groupBy({
    by: ["userId"],
    where: { chainId },
    _count: true,
  });

  const recentActivity = await prisma.chainActivity.findFirst({
    where: { chainId },
    orderBy: { createdAt: "desc" },
  });

  return {
    actionCounts: activities.reduce((acc, a) => {
      acc[a.action] = a._count;
      return acc;
    }, {} as Record<string, number>),
    contributorCount: contributorCount.length,
    lastActivityAt: recentActivity?.createdAt || null,
  };
}
```

**Update API routes to log activities**:

Example in `app/api/argument-chains/[chainId]/nodes/route.ts`:
```typescript
import { logChainActivity } from "@/lib/middleware/activityLogger";

// After creating node:
await logChainActivity({
  chainId,
  userId: session.user.id,
  action: "NODE_ADDED",
  entityType: "node",
  entityId: node.id,
  details: {
    argumentId: node.argumentId,
    role: node.role,
  },
  metadata: {
    argumentConclusion: node.argument.conclusion,
  },
});
```

**Acceptance Criteria**:
- [x] Activity logging function
- [x] Get activity feed with pagination
- [x] Filter by user and action types
- [x] Activity stats (counts, contributors)
- [x] Error handling (doesn't break main flow)
- [x] Integrated into API routes

**Estimated Time**: 2 hours

---

#### Task 5.9: Create ChainActivityFeed Component
**File**: `components/chains/ChainActivityFeed.tsx`

```typescript
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Activity,
  Plus,
  Minus,
  Edit,
  Move,
  Link,
  Share2,
  Download,
  Settings,
  RefreshCw,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface ChainActivity {
  id: string;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: any;
  metadata?: any;
  createdAt: string;
  user: {
    id: string;
    name: string;
    image?: string;
  };
}

interface ChainActivityFeedProps {
  chainId: string;
}

export function ChainActivityFeed({ chainId }: ChainActivityFeedProps) {
  const [activities, setActivities] = useState<ChainActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const fetchActivities = async (reset: boolean = false) => {
    setIsLoading(true);
    try {
      const currentOffset = reset ? 0 : offset;
      const params = new URLSearchParams({
        limit: "20",
        offset: currentOffset.toString(),
      });

      if (filter !== "all") {
        params.append("action", filter);
      }

      const res = await fetch(`/api/argument-chains/${chainId}/activity?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();

      if (reset) {
        setActivities(data.activities);
        setOffset(20);
      } else {
        setActivities((prev) => [...prev, ...data.activities]);
        setOffset((prev) => prev + 20);
      }

      setHasMore(data.activities.length === 20);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to load activity");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities(true);
  }, [chainId, filter]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case "NODE_ADDED":
        return <Plus className="h-4 w-4 text-green-600" />;
      case "NODE_REMOVED":
        return <Minus className="h-4 w-4 text-red-600" />;
      case "NODE_UPDATED":
      case "NODE_MOVED":
        return <Move className="h-4 w-4 text-blue-600" />;
      case "EDGE_ADDED":
        return <Link className="h-4 w-4 text-green-600" />;
      case "EDGE_REMOVED":
        return <Link className="h-4 w-4 text-red-600" />;
      case "EDGE_UPDATED":
        return <Edit className="h-4 w-4 text-blue-600" />;
      case "CHAIN_UPDATED":
        return <Settings className="h-4 w-4 text-blue-600" />;
      case "EXPORTED":
        return <Download className="h-4 w-4 text-purple-600" />;
      case "SHARED":
        return <Share2 className="h-4 w-4 text-purple-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionText = (activity: ChainActivity) => {
    const { action, details, metadata } = activity;

    switch (action) {
      case "NODE_ADDED":
        return (
          <>
            added argument{" "}
            {metadata?.argumentConclusion && (
              <span className="font-medium">"{metadata.argumentConclusion.substring(0, 40)}..."</span>
            )}
          </>
        );
      case "NODE_REMOVED":
        return "removed an argument";
      case "NODE_UPDATED":
        return details?.role
          ? `changed argument role to ${details.role}`
          : "updated an argument";
      case "NODE_MOVED":
        return "moved an argument";
      case "EDGE_ADDED":
        return (
          <>
            added connection{" "}
            {details?.edgeType && (
              <Badge variant="outline" className="ml-1">
                {details.edgeType}
              </Badge>
            )}
          </>
        );
      case "EDGE_REMOVED":
        return "removed a connection";
      case "EDGE_UPDATED":
        return "updated a connection";
      case "CHAIN_CREATED":
        return "created this chain";
      case "CHAIN_UPDATED":
        return "updated chain settings";
      case "PERMISSION_GRANTED":
        return (
          <>
            granted{" "}
            <Badge variant="secondary" className="mx-1">
              {details?.role}
            </Badge>
            access to {details?.targetUserName}
          </>
        );
      case "PERMISSION_REVOKED":
        return `revoked access from ${details?.targetUserName}`;
      case "EXPORTED":
        return `exported as ${details?.format?.toUpperCase()}`;
      case "SHARED":
        return "generated shareable link";
      default:
        return action.toLowerCase().replace(/_/g, " ");
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Activity className="h-4 w-4" />
            Activity Feed
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-32 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activity</SelectItem>
                <SelectItem value="NODE_ADDED">Nodes Added</SelectItem>
                <SelectItem value="NODE_REMOVED">Nodes Removed</SelectItem>
                <SelectItem value="EDGE_ADDED">Edges Added</SelectItem>
                <SelectItem value="EDGE_REMOVED">Edges Removed</SelectItem>
                <SelectItem value="CHAIN_UPDATED">Settings</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => fetchActivities(true)}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-96">
          <div className="p-4 space-y-4">
            {activities.length === 0 && !isLoading && (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No activity yet</p>
              </div>
            )}

            {activities.map((activity) => (
              <div key={activity.id} className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={activity.user.image} />
                  <AvatarFallback className="text-xs">
                    {activity.user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-1">
                  <div className="flex items-start gap-2">
                    {getActionIcon(activity.action)}
                    <p className="text-sm flex-1">
                      <span className="font-medium">{activity.user.name}</span>{" "}
                      {getActionText(activity)}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}

            {hasMore && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => fetchActivities(false)}
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : "Load More"}
              </Button>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
```

**Acceptance Criteria**:
- [x] Displays chronological activity feed
- [x] User avatars and names
- [x] Action-specific icons and colors
- [x] Contextual descriptions
- [x] Filter by action type
- [x] Pagination (load more)
- [x] Refresh button
- [x] Empty state
- [x] Relative timestamps

**Estimated Time**: 3 hours

---

### 5.5 Notifications

#### Task 5.10: Create Notification System
**File**: `lib/notifications/chainNotifications.ts`

```typescript
import { prisma } from "@/lib/prisma";

export interface ChainNotification {
  id: string;
  userId: string;
  chainId: string;
  type: "mention" | "reply" | "permission_granted" | "chain_updated" | "conflict";
  title: string;
  message: string;
  actionUrl?: string;
  read: boolean;
  createdAt: Date;
}

/**
 * Create notification for user
 */
export async function createChainNotification(params: {
  userId: string;
  chainId: string;
  type: ChainNotification["type"];
  title: string;
  message: string;
  actionUrl?: string;
}) {
  try {
    await prisma.notification.create({
      data: {
        userId: params.userId,
        type: `chain_${params.type}`,
        title: params.title,
        message: params.message,
        data: {
          chainId: params.chainId,
          actionUrl: params.actionUrl,
        },
        read: false,
      },
    });

    // Optionally send push notification
    await sendPushNotification(params.userId, {
      title: params.title,
      body: params.message,
      url: params.actionUrl,
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}

/**
 * Notify chain collaborators of updates
 */
export async function notifyChainCollaborators(params: {
  chainId: string;
  excludeUserId: string; // User who made the change
  title: string;
  message: string;
  actionUrl?: string;
}) {
  try {
    // Get all users with access to chain
    const chain = await prisma.argumentChain.findUnique({
      where: { id: params.chainId },
      include: {
        permissions: {
          include: { user: true },
        },
        deliberation: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!chain) return;

    const usersToNotify = new Set<string>();

    // Add creator
    usersToNotify.add(chain.createdBy);

    // Add users with explicit permissions
    chain.permissions.forEach((p) => usersToNotify.add(p.userId));

    // If public, add all deliberation members
    if (chain.isPublic) {
      chain.deliberation.members.forEach((m) => usersToNotify.add(m.userId));
    }

    // Remove the user who made the change
    usersToNotify.delete(params.excludeUserId);

    // Create notifications
    await Promise.all(
      Array.from(usersToNotify).map((userId) =>
        createChainNotification({
          userId,
          chainId: params.chainId,
          type: "chain_updated",
          title: params.title,
          message: params.message,
          actionUrl: params.actionUrl,
        })
      )
    );
  } catch (error) {
    console.error("Failed to notify collaborators:", error);
  }
}

/**
 * Send browser push notification
 */
async function sendPushNotification(
  userId: string,
  notification: {
    title: string;
    body: string;
    url?: string;
  }
) {
  // Check if user has push subscription
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  if (subscriptions.length === 0) return;

  // Use web-push library to send
  const webpush = require("web-push");

  webpush.setVapidDetails(
    "mailto:support@mesh.com",
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  const payload = JSON.stringify({
    title: notification.title,
    body: notification.body,
    icon: "/icon-192.png",
    badge: "/badge-72.png",
    url: notification.url || "/",
  });

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload
        );
      } catch (error) {
        console.error("Push notification failed:", error);
        // Remove invalid subscription
        if ((error as any).statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } });
        }
      }
    })
  );
}
```

**Add to `package.json`**:
```json
{
  "web-push": "^3.6.6"
}
```

**Acceptance Criteria**:
- [x] Create notification function
- [x] Notify all chain collaborators
- [x] Browser push notifications
- [x] Remove invalid subscriptions
- [x] Error handling

**Estimated Time**: 2 hours

---

#### Task 5.11: Create NotificationCenter Component
**File**: `components/chains/NotificationCenter.tsx`

```typescript
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Bell, Check, CheckCheck, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  read: boolean;
  createdAt: string;
}

export function NotificationCenter() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications?limit=20");
      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: "POST",
      });

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Mark read error:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications/read-all", {
        method: "POST",
      });

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Mark all read error:", error);
      toast.error("Failed to mark all as read");
    }
  };

  const dismissNotification = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
      });

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      toast.success("Notification dismissed");
    } catch (error) {
      console.error("Dismiss error:", error);
      toast.error("Failed to dismiss notification");
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    if (notification.data?.actionUrl) {
      router.push(notification.data.actionUrl);
      setIsOpen(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={markAllAsRead}
              className="h-8"
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="h-96">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="h-12 w-12 mb-2 opacity-50" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-accent cursor-pointer transition-colors ${
                    !notification.read ? "bg-accent/50" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm">{notification.title}</p>
                        {!notification.read && (
                          <div className="h-2 w-2 rounded-full bg-blue-600 mt-1" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>

                    <div className="flex flex-col gap-1">
                      {!notification.read && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          className="h-6 w-6 p-0"
                          title="Mark as read"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          dismissNotification(notification.id);
                        }}
                        className="h-6 w-6 p-0"
                        title="Dismiss"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
```

**Acceptance Criteria**:
- [x] Bell icon with unread count badge
- [x] Popover with notification list
- [x] Mark individual as read
- [x] Mark all as read
- [x] Dismiss notifications
- [x] Click to navigate to action URL
- [x] Relative timestamps
- [x] Visual indicator for unread
- [x] Polling for new notifications

**Estimated Time**: 2.5 hours

---

#### Task 5.12: Integrate Activity Feed and Notifications
**File**: `components/chains/ArgumentChainConstructor.tsx`

```typescript
import { ChainActivityFeed } from "./ChainActivityFeed";
import { NotificationCenter } from "./NotificationCenter";

// Add to ArgumentChainConstructor:

// Update the layout to include activity feed:
<div className="flex flex-1 overflow-hidden">
  <ArgumentPalette {...props} />
  <ChainCanvas {...props} />
  
  {/* Right sidebar with tabs */}
  <div className="w-96 border-l flex flex-col">
    <Tabs defaultValue="analysis" className="flex-1">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="analysis">Analysis</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
      </TabsList>
      
      <TabsContent value="analysis" className="flex-1">
        <ChainAnalysisDashboard chainId={chainId} />
      </TabsContent>
      
      <TabsContent value="activity" className="flex-1">
        <ChainActivityFeed chainId={chainId} />
      </TabsContent>
    </Tabs>
  </div>
</div>

// Add NotificationCenter to header:
<ChainMetadataPanel {...props}>
  <NotificationCenter />
</ChainMetadataPanel>
```

**Update API routes to send notifications**:

Example in `app/api/argument-chains/[chainId]/nodes/route.ts`:
```typescript
import { notifyChainCollaborators } from "@/lib/notifications/chainNotifications";

// After creating node and logging activity:
await notifyChainCollaborators({
  chainId,
  excludeUserId: session.user.id,
  title: "Argument Added",
  message: `${session.user.name} added an argument to ${chain.name}`,
  actionUrl: `/app/chains/${chainId}`,
});
```

**Acceptance Criteria**:
- [x] Activity feed in right sidebar
- [x] Tab navigation (Analysis/Activity)
- [x] Notification center in header
- [x] Notifications sent on chain updates
- [x] Real-time activity updates

**Estimated Time**: 1.5 hours

---

**Phase 4 Part 8 Summary**:
- **Total Tasks**: 6 tasks (5.7-5.12)
- **Estimated Time**: 11.5 hours
- **Deliverable**: Complete activity logging, activity feed, and notification system

**Phase 4 Complete Summary**:
- **Total Tasks**: 12 tasks (5.1-5.12)
- **Estimated Time**: 24.5 hours (1.5-2 weeks)
- **Deliverable**: Full collaboration suite with real-time sync, cursor tracking, permissions, activity feed, and notifications

**Next**: Phase 5 will cover Integration & Polish - the final phase bringing everything together with DeepDive v3 integration, testing, and production readiness.

