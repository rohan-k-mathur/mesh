# Dialogue Visualization Roadmap: Phases 3-4
## Visual Components & Primary View Integration

**Version:** 1.0  
**Date:** November 2, 2025  
**Status:** Planning Phase  

[← Back to Overview](./DIALOGUE_VISUALIZATION_ROADMAP.md) | [Next: Phases 5-6 →](./DIALOGUE_VISUALIZATION_PHASES_5_6.md)

---

## Phase 3: DM-Node Visual Components (Weeks 7-8)

**Objective:** Create reusable React components for rendering Dialogue Move nodes with distinctive visual styling and interactive behaviors.

### 3.1 DM-Node Component (Core)

**File:** `components/aif/DmNode.tsx` (new)

**Design Specification:**

```
Visual Design for DM-Nodes:
┌─────────────────────────┐
│  DM-Node (Diamond)      │
│                         │
│    ◆ WHY               │ ← Diamond shape
│    Alice → Bob         │ ← Speaker arrow
│    2 min ago           │ ← Timestamp
│    [3↑ 1↓]            │ ← Vote indicators
└─────────────────────────┘

Colors by Locution:
- WHY: Amber/Orange (#F59E0B → #FB923C)
- GROUNDS: Blue (#3B82F6 → #60A5FA)
- CONCEDE: Green (#10B981 → #34D399)
- RETRACT: Gray (#6B7280 → #9CA3AF)
- CLOSE: Red (#EF4444 → #F87171)
- ACCEPT_ARGUMENT: Emerald (#059669 → #10B981)
- THEREFORE: Purple (#8B5CF6 → #A78BFA)
- SUPPOSE: Cyan (#06B6D4 → #22D3EE)
- DISCHARGE: Indigo (#6366F1 → #818CF8)

Interactions:
- Hover: Glow effect, show full details
- Click: Open DialogueMoveDetailsModal
- Right-click: Context menu (View thread, Filter to user, etc.)
```

**Implementation:**

```tsx
// components/aif/DmNode.tsx
"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  MessageCircleQuestion, 
  MessageCircleReply, 
  Check, 
  X, 
  Ban, 
  GitBranch,
  Lightbulb,
  Zap 
} from "lucide-react";
import type { DialogueMoveWithAif } from "@/types/aif-dialogue";
import { formatDistanceToNow } from "date-fns";

interface DmNodeProps {
  move: DialogueMoveWithAif;
  position: { x: number; y: number };
  size?: { width: number; height: number };
  isHighlighted?: boolean;
  isFiltered?: boolean;
  onClick?: () => void;
  onHover?: (moveId: string | null) => void;
}

const MOVE_COLORS = {
  WHY: { from: "#F59E0B", to: "#FB923C", icon: MessageCircleQuestion },
  GROUNDS: { from: "#3B82F6", to: "#60A5FA", icon: MessageCircleReply },
  CONCEDE: { from: "#10B981", to: "#34D399", icon: Check },
  RETRACT: { from: "#6B7280", to: "#9CA3AF", icon: X },
  CLOSE: { from: "#EF4444", to: "#F87171", icon: Ban },
  ACCEPT_ARGUMENT: { from: "#059669", to: "#10B981", icon: Check },
  THEREFORE: { from: "#8B5CF6", to: "#A78BFA", icon: GitBranch },
  SUPPOSE: { from: "#06B6D4", to: "#22D3EE", icon: Lightbulb },
  DISCHARGE: { from: "#6366F1", to: "#818CF8", icon: Zap },
} as const;

export function DmNode({
  move,
  position,
  size = { width: 120, height: 120 },
  isHighlighted = false,
  isFiltered = false,
  onClick,
  onHover
}: DmNodeProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const colors = MOVE_COLORS[move.kind as keyof typeof MOVE_COLORS] || {
    from: "#6B7280",
    to: "#9CA3AF",
    icon: MessageCircleQuestion
  };
  
  const Icon = colors.icon;
  
  // Diamond path (rotate square 45 degrees)
  const diamondPath = `
    M ${size.width / 2} 0
    L ${size.width} ${size.height / 2}
    L ${size.width / 2} ${size.height}
    L 0 ${size.height / 2}
    Z
  `;

  return (
    <motion.g
      transform={`translate(${position.x}, ${position.y})`}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: isFiltered ? 0.7 : 1, 
        opacity: isFiltered ? 0.4 : 1 
      }}
      whileHover={{ scale: 1.1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onMouseEnter={() => {
        setIsHovered(true);
        onHover?.(move.id);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        onHover?.(null);
      }}
      onClick={onClick}
      style={{ cursor: "pointer" }}
    >
      {/* Glow effect on hover/highlight */}
      {(isHovered || isHighlighted) && (
        <motion.path
          d={diamondPath}
          fill="none"
          stroke={colors.from}
          strokeWidth="4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          filter="url(#glow)"
        />
      )}
      
      {/* Diamond shape with gradient */}
      <defs>
        <linearGradient id={`gradient-${move.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colors.from} />
          <stop offset="100%" stopColor={colors.to} />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <path
        d={diamondPath}
        fill={`url(#gradient-${move.id})`}
        stroke={isHighlighted ? "#FFF" : colors.from}
        strokeWidth={isHighlighted ? "3" : "2"}
        opacity={isFiltered ? 0.5 : 0.95}
      />
      
      {/* Icon */}
      <foreignObject
        x={size.width / 2 - 16}
        y={size.height / 2 - 32}
        width="32"
        height="32"
      >
        <div className="flex items-center justify-center">
          <Icon className="w-6 h-6 text-white drop-shadow-md" />
        </div>
      </foreignObject>
      
      {/* Label */}
      <text
        x={size.width / 2}
        y={size.height / 2 + 8}
        textAnchor="middle"
        fill="white"
        fontSize="12"
        fontWeight="600"
        className="drop-shadow-md pointer-events-none"
      >
        {move.kind}
      </text>
      
      {/* Compact info (only on hover) */}
      {isHovered && (
        <g>
          {/* Speaker label */}
          <text
            x={size.width / 2}
            y={size.height + 20}
            textAnchor="middle"
            fill="#374151"
            fontSize="10"
            className="pointer-events-none"
          >
            {move.author?.displayName || move.author?.username || "Anonymous"}
          </text>
          
          {/* Timestamp */}
          <text
            x={size.width / 2}
            y={size.height + 35}
            textAnchor="middle"
            fill="#6B7280"
            fontSize="9"
            className="pointer-events-none"
          >
            {formatDistanceToNow(new Date(move.createdAt), { addSuffix: true })}
          </text>
          
          {/* Vote indicators (if votes exist) */}
          {move.votes && move.votes.length > 0 && (
            <text
              x={size.width / 2}
              y={size.height + 50}
              textAnchor="middle"
              fill="#059669"
              fontSize="9"
              className="pointer-events-none"
            >
              {move.votes.filter(v => v.voteType === "UPVOTE").length}↑{" "}
              {move.votes.filter(v => v.voteType === "DOWNVOTE").length}↓
            </text>
          )}
        </g>
      )}
    </motion.g>
  );
}
```

**Tasks:**

- [ ] 3.1.1: Create `DmNode.tsx` component with diamond SVG shape
- [ ] 3.1.2: Implement gradient fills for each move type
- [ ] 3.1.3: Add hover effects with Framer Motion animations
- [ ] 3.1.4: Implement click handler to open details modal
- [ ] 3.1.5: Add vote indicators and timestamp display
- [ ] 3.1.6: Write Storybook stories for all move types
- [ ] 3.1.7: Add accessibility attributes (ARIA labels, keyboard navigation)
- [ ] 3.1.8: Test on different screen sizes (responsive SVG)

**Estimated Time:** 3 days

---

### 3.2 Dialogue Move Details Modal

**File:** `components/aif/DialogueMoveDetailsModal.tsx` (new)

**Implementation:**

```tsx
// components/aif/DialogueMoveDetailsModal.tsx
"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Clock, 
  MessageCircle, 
  GitBranch, 
  ThumbsUp, 
  ThumbsDown 
} from "lucide-react";
import type { DialogueMoveWithAif } from "@/types/aif-dialogue";
import { format } from "date-fns";
import { useNodeDialogueProvenance } from "@/lib/hooks/useDialogueAwareGraph";

interface DialogueMoveDetailsModalProps {
  move: DialogueMoveWithAif | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DialogueMoveDetailsModal({
  move,
  open,
  onOpenChange
}: DialogueMoveDetailsModalProps) {
  const { provenance } = useNodeDialogueProvenance(
    move?.aifRepresentation || "",
    move?.deliberationId || ""
  );

  if (!move) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Badge variant="outline" className="text-base">
              {move.kind}
            </Badge>
            Dialogue Move Details
          </DialogTitle>
          <DialogDescription>
            Complete information about this dialogue action
          </DialogDescription>
        </DialogHeader>

        {/* Author & Timestamp */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-gray-500" />
            <span className="font-medium">
              {move.author?.displayName || move.author?.username || "Anonymous"}
            </span>
            {move.author?.username && (
              <span className="text-gray-500">@{move.author.username}</span>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            {format(new Date(move.createdAt), "PPpp")}
          </div>
        </div>

        <Separator />

        {/* Illocution & Target */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm">Move Properties</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Illocution:</span>
              <span className="ml-2 font-medium">{move.illocution || "N/A"}</span>
            </div>
            <div>
              <span className="text-gray-500">Target Type:</span>
              <span className="ml-2 font-medium">{move.targetType}</span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-500">Target ID:</span>
              <code className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                {move.targetId}
              </code>
            </div>
          </div>
        </div>

        {/* Payload (if exists) */}
        {move.payload && (
          <>
            <Separator />
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Payload</h3>
              <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">
                {JSON.stringify(move.payload, null, 2)}
              </pre>
            </div>
          </>
        )}

        {/* Reply Thread */}
        {move.replyToMoveId && (
          <>
            <Separator />
            <div className="space-y-2">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <GitBranch className="w-4 h-4" />
                Reply Thread
              </h3>
              <p className="text-sm text-gray-600">
                This move replies to:{" "}
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {move.replyToMoveId}
                </code>
              </p>
              <Button variant="outline" size="sm">
                View Thread
              </Button>
            </div>
          </>
        )}

        {/* Created AIF Nodes */}
        {move.createdAifNodes && move.createdAifNodes.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Created AIF Nodes</h3>
              <div className="space-y-2">
                {move.createdAifNodes.map((node) => (
                  <div
                    key={node.id}
                    className="text-sm bg-blue-50 p-2 rounded border border-blue-200"
                  >
                    <div className="font-medium">{node.nodeType}</div>
                    <div className="text-gray-600 text-xs">{node.text}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Votes */}
        {move.votes && move.votes.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Community Votes
              </h3>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <ThumbsUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">
                    {move.votes.filter(v => v.voteType === "UPVOTE").length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <ThumbsDown className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium">
                    {move.votes.filter(v => v.voteType === "DOWNVOTE").length}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Provenance (if loaded) */}
        {provenance && (
          <>
            <Separator />
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Provenance Trail</h3>
              <p className="text-sm text-gray-600">
                This move is part of a larger dialogue chain...
              </p>
              {/* TODO: Add provenance visualization */}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

**Tasks:**

- [ ] 3.2.1: Create modal component with Shadcn Dialog
- [ ] 3.2.2: Display all move metadata (author, timestamp, payload)
- [ ] 3.2.3: Show reply thread with "View Thread" button
- [ ] 3.2.4: List created AIF nodes with links
- [ ] 3.2.5: Show vote counts and voter list
- [ ] 3.2.6: Add "View in Context" button (navigate to argument)
- [ ] 3.2.7: Implement keyboard shortcuts (Esc to close, arrows to navigate)

**Estimated Time:** 2 days

---

### 3.3 Dialogue Edge Component

**File:** `components/aif/DialogueEdge.tsx` (new)

**Visual Design:**

```
Edge Types:
1. triggers: DM-node (WHY) ──────> CQ (dashed amber line)
2. answers: DM-node (GROUNDS) ──> Argument (solid blue line)
3. repliesTo: DM-node ─┬─> DM-node (thin gray line with arrow)
4. commitsTo: DM-node (CONCEDE) ──> I-node (dotted green line)
```

**Implementation:**

```tsx
// components/aif/DialogueEdge.tsx
"use client";

import React from "react";
import { motion } from "framer-motion";
import type { DialogueAwareEdge } from "@/types/aif-dialogue";

interface DialogueEdgeProps {
  edge: DialogueAwareEdge;
  sourcePos: { x: number; y: number };
  targetPos: { x: number; y: number };
  isHighlighted?: boolean;
}

const EDGE_STYLES = {
  triggers: { 
    color: "#F59E0B", 
    strokeDasharray: "5,5", 
    strokeWidth: 2,
    opacity: 0.7
  },
  answers: { 
    color: "#3B82F6", 
    strokeDasharray: "none", 
    strokeWidth: 3,
    opacity: 0.9
  },
  repliesTo: { 
    color: "#6B7280", 
    strokeDasharray: "none", 
    strokeWidth: 1.5,
    opacity: 0.5
  },
  commitsTo: { 
    color: "#10B981", 
    strokeDasharray: "2,3", 
    strokeWidth: 2,
    opacity: 0.7
  },
  inference: {
    color: "#8B5CF6",
    strokeDasharray: "none",
    strokeWidth: 2,
    opacity: 0.6
  },
  conflict: {
    color: "#EF4444",
    strokeDasharray: "none",
    strokeWidth: 2,
    opacity: 0.8
  },
  preference: {
    color: "#10B981",
    strokeDasharray: "none",
    strokeWidth: 2,
    opacity: 0.6
  }
} as const;

export function DialogueEdge({
  edge,
  sourcePos,
  targetPos,
  isHighlighted = false
}: DialogueEdgeProps) {
  const style = EDGE_STYLES[edge.edgeType] || EDGE_STYLES.inference;
  
  // Calculate curved path (Bezier curve)
  const dx = targetPos.x - sourcePos.x;
  const dy = targetPos.y - sourcePos.y;
  const cx1 = sourcePos.x + dx * 0.3;
  const cy1 = sourcePos.y;
  const cx2 = targetPos.x - dx * 0.3;
  const cy2 = targetPos.y;
  
  const pathData = `
    M ${sourcePos.x} ${sourcePos.y}
    C ${cx1} ${cy1}, ${cx2} ${cy2}, ${targetPos.x} ${targetPos.y}
  `;

  return (
    <motion.g
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: isHighlighted ? 1 : style.opacity }}
      transition={{ duration: 0.5 }}
    >
      {/* Glow effect on highlight */}
      {isHighlighted && (
        <path
          d={pathData}
          fill="none"
          stroke={style.color}
          strokeWidth={style.strokeWidth + 4}
          strokeDasharray={style.strokeDasharray}
          opacity={0.3}
          filter="url(#edgeGlow)"
        />
      )}
      
      {/* Main edge */}
      <path
        d={pathData}
        fill="none"
        stroke={style.color}
        strokeWidth={style.strokeWidth}
        strokeDasharray={style.strokeDasharray}
        markerEnd="url(#arrowhead)"
      />
      
      {/* Arrowhead marker */}
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 z" fill={style.color} />
        </marker>
        <filter id="edgeGlow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Edge label (for dialogue edges) */}
      {(edge.edgeType === "triggers" || edge.edgeType === "answers") && (
        <text
          x={(sourcePos.x + targetPos.x) / 2}
          y={(sourcePos.y + targetPos.y) / 2 - 5}
          textAnchor="middle"
          fill={style.color}
          fontSize="10"
          fontWeight="600"
          className="pointer-events-none"
        >
          {edge.edgeType}
        </text>
      )}
    </motion.g>
  );
}
```

**Tasks:**

- [ ] 3.3.1: Create edge component with SVG path rendering
- [ ] 3.3.2: Implement Bezier curve calculations for smooth edges
- [ ] 3.3.3: Add distinct styles for each edge type (colors, dashing)
- [ ] 3.3.4: Implement arrowhead markers
- [ ] 3.3.5: Add edge labels for dialogue-specific edges
- [ ] 3.3.6: Animate path drawing on mount (Framer Motion)
- [ ] 3.3.7: Add hover effects showing edge metadata

**Estimated Time:** 2 days

---

### 3.4 Dialogue Layer Toggle Control

**File:** `components/aif/DialogueLayerControl.tsx` (new)

**Implementation:**

```tsx
// components/aif/DialogueLayerControl.tsx
"use client";

import React from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Users, Filter } from "lucide-react";

interface DialogueLayerControlProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  moveFilter: "all" | "protocol" | "structural";
  onMoveFilterChange: (filter: "all" | "protocol" | "structural") => void;
  participantFilter: string | null;
  onParticipantFilterChange: (participantId: string | null) => void;
  participants: Array<{ id: string; name: string }>;
  dmNodeCount: number;
}

export function DialogueLayerControl({
  enabled,
  onEnabledChange,
  moveFilter,
  onMoveFilterChange,
  participantFilter,
  onParticipantFilterChange,
  participants,
  dmNodeCount
}: DialogueLayerControlProps) {
  return (
    <div className="flex flex-col gap-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Main toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-blue-600" />
          <Label htmlFor="dialogue-toggle" className="font-semibold">
            Dialogue Layer
          </Label>
          {enabled && (
            <Badge variant="secondary" className="text-xs">
              {dmNodeCount} moves
            </Badge>
          )}
        </div>
        <Switch
          id="dialogue-toggle"
          checked={enabled}
          onCheckedChange={onEnabledChange}
        />
      </div>

      {/* Filters (only visible when enabled) */}
      {enabled && (
        <>
          <div className="h-px bg-gray-200" />
          
          {/* Move type filter */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Filter className="w-4 h-4" />
              Move Type
            </div>
            <Select value={moveFilter} onValueChange={onMoveFilterChange as any}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Moves</SelectItem>
                <SelectItem value="protocol">
                  Protocol Only (WHY, GROUNDS, CONCEDE)
                </SelectItem>
                <SelectItem value="structural">
                  Structural Only (THEREFORE, SUPPOSE)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Participant filter */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Users className="w-4 h-4" />
              Participant
            </div>
            <Select 
              value={participantFilter || "all"} 
              onValueChange={(val) => onParticipantFilterChange(val === "all" ? null : val)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All participants" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Participants</SelectItem>
                {participants.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}
    </div>
  );
}
```

**Tasks:**

- [ ] 3.4.1: Create control panel component with Shadcn UI
- [ ] 3.4.2: Add toggle switch for enabling/disabling dialogue layer
- [ ] 3.4.3: Add move type filter dropdown (all/protocol/structural)
- [ ] 3.4.4: Add participant filter dropdown
- [ ] 3.4.5: Display live count of visible DM-nodes
- [ ] 3.4.6: Persist filter state in URL params or localStorage
- [ ] 3.4.7: Add keyboard shortcuts (D to toggle, F to focus filters)

**Estimated Time:** 2 days

---

## Phase 3 Summary

**Duration:** 2 weeks  
**Deliverables:**
- ✅ DmNode component with animations and interactions
- ✅ DialogueMoveDetailsModal for deep inspection
- ✅ DialogueEdge component for relationship visualization
- ✅ DialogueLayerControl for user-facing filters
- ✅ Storybook documentation for all components
- ✅ Unit tests with 80%+ coverage

**Integration Points:**
- Components ready to integrate into existing AIF viewers
- State management hooks for filters and selections
- Event handlers for click/hover/right-click actions

---

## Phase 4: Primary View Implementation (Weeks 9-10)

**Objective:** Integrate DM-nodes and dialogue edges into existing AIF diagram viewers with seamless toggle functionality.

### 4.1 Extend AifDiagramView Component

**File:** `components/map/AifDiagramView.tsx` (modify existing)

**Changes Required:**

```tsx
// ADD: New imports
import { DmNode } from "@/components/aif/DmNode";
import { DialogueEdge } from "@/components/aif/DialogueEdge";
import { DialogueMoveDetailsModal } from "@/components/aif/DialogueMoveDetailsModal";
import { DialogueLayerControl } from "@/components/aif/DialogueLayerControl";
import { useDialogueAwareGraph } from "@/lib/hooks/useDialogueAwareGraph";

// ADD: New props
interface AifDiagramViewProps {
  // ... existing props ...
  includeDialogue?: boolean;
  dialogueMoveFilter?: "all" | "protocol" | "structural";
  dialogueParticipantFilter?: string | null;
}

export default function AifDiagramView({
  deliberationId,
  includeDialogue = false,
  dialogueMoveFilter = "all",
  dialogueParticipantFilter = null,
  // ... existing props ...
}: AifDiagramViewProps) {
  // Fetch dialogue-aware graph
  const { graph, isLoading, error } = useDialogueAwareGraph({
    deliberationId,
    includeDialogue,
    includeMoves: dialogueMoveFilter,
    participantFilter: dialogueParticipantFilter || undefined
  });

  const [selectedMove, setSelectedMove] = useState<DialogueMoveWithAif | null>(null);
  const [highlightedMoveId, setHighlightedMoveId] = useState<string | null>(null);

  // Existing layout logic...
  // ... 

  return (
    <div className="relative w-full h-full">
      {/* Control Panel */}
      <div className="absolute top-4 right-4 z-10">
        <DialogueLayerControl
          enabled={includeDialogue}
          onEnabledChange={(enabled) => {
            // Update URL params or parent state
          }}
          moveFilter={dialogueMoveFilter}
          onMoveFilterChange={(filter) => {
            // Update filter
          }}
          participantFilter={dialogueParticipantFilter}
          onParticipantFilterChange={(id) => {
            // Update filter
          }}
          participants={/* derive from graph.dialogueMoves */[]}
          dmNodeCount={graph?.nodes.filter(n => n.nodeSubtype === "dialogue_move").length || 0}
        />
      </div>

      {/* Main SVG Canvas */}
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
        {/* Existing I-nodes, RA-nodes, CA-nodes, PA-nodes... */}
        {nodes.map((node) => {
          if (node.nodeSubtype === "dialogue_move") {
            // Render DM-node
            return (
              <DmNode
                key={node.id}
                move={graph.dialogueMoves.find(m => m.aifRepresentation === node.id)!}
                position={nodePositions[node.id]}
                isHighlighted={highlightedMoveId === node.dialogueMoveId}
                onClick={() => setSelectedMove(/* find move */)}
                onHover={setHighlightedMoveId}
              />
            );
          } else {
            // Render standard AIF node
            return (
              <StandardAifNode key={node.id} node={node} {...props} />
            );
          }
        })}

        {/* Edges */}
        {edges.map((edge) => {
          if (edge.causedByDialogueMoveId) {
            // Render dialogue-aware edge
            return (
              <DialogueEdge
                key={edge.id}
                edge={edge}
                sourcePos={nodePositions[edge.source]}
                targetPos={nodePositions[edge.target]}
                isHighlighted={highlightedMoveId === edge.causedByDialogueMoveId}
              />
            );
          } else {
            // Render standard edge
            return (
              <StandardEdge key={edge.id} edge={edge} {...props} />
            );
          }
        })}
      </svg>

      {/* Details Modal */}
      <DialogueMoveDetailsModal
        move={selectedMove}
        open={!!selectedMove}
        onOpenChange={(open) => !open && setSelectedMove(null)}
      />
    </div>
  );
}
```

**Tasks:**

- [ ] 4.1.1: Add dialogue props to AifDiagramView component signature
- [ ] 4.1.2: Integrate `useDialogueAwareGraph` hook for data fetching
- [ ] 4.1.3: Add conditional rendering for DM-nodes vs standard nodes
- [ ] 4.1.4: Integrate DialogueLayerControl in viewer UI
- [ ] 4.1.5: Wire up state management for filters and selections
- [ ] 4.1.6: Update layout algorithm to position DM-nodes correctly
- [ ] 4.1.7: Test with real deliberation data (>50 nodes)
- [ ] 4.1.8: Ensure backward compatibility (dialogue layer OFF by default)

**Estimated Time:** 4 days

---

### 4.2 Update AIF Layout Algorithm

**File:** `lib/aif/layout.ts` (create or modify existing layout logic)

**Challenge:** DM-nodes need special positioning relative to the nodes they affect.

**Layout Strategy:**

```
1. Base Layout (Standard AIF):
   - Use existing ELK/Dagre layout for I-nodes, RA-nodes, CA-nodes, PA-nodes
   
2. DM-Node Positioning:
   WHY move → Position near CQ it triggers (offset above)
   GROUNDS move → Position near RA-node it creates (offset to left)
   CONCEDE move → Position near I-node it commits to (offset below)
   THEREFORE/SUPPOSE → Position near premises (offset to right)
   
3. Edge Routing:
   - Dialogue edges use separate layer (z-index below standard edges)
   - Avoid overlapping with standard argument structure
```

**Implementation:**

```typescript
// lib/aif/layout.ts

import type { AifNodeWithDialogue, DialogueAwareEdge } from "@/types/aif-dialogue";

interface LayoutOptions {
  width: number;
  height: number;
  includeDialogue: boolean;
}

export async function layoutDialogueAwareGraph(
  nodes: AifNodeWithDialogue[],
  edges: DialogueAwareEdge[],
  options: LayoutOptions
): Promise<Record<string, { x: number; y: number }>> {
  const positions: Record<string, { x: number; y: number }> = {};

  // Step 1: Layout standard AIF nodes using ELK
  const standardNodes = nodes.filter(n => n.nodeSubtype !== "dialogue_move");
  const standardPositions = await elkLayout(standardNodes, edges, options);
  Object.assign(positions, standardPositions);

  if (!options.includeDialogue) {
    return positions;
  }

  // Step 2: Position DM-nodes relative to affected nodes
  const dmNodes = nodes.filter(n => n.nodeSubtype === "dialogue_move");

  for (const dmNode of dmNodes) {
    const move = dmNode.dialogueMove;
    if (!move) continue;

    // Find target node(s) this move affects
    const affectedEdges = edges.filter(e => e.source === dmNode.id);
    
    if (affectedEdges.length > 0) {
      const targetNode = nodes.find(n => n.id === affectedEdges[0].target);
      const targetPos = positions[targetNode?.id || ""];

      if (targetPos) {
        // Position based on move type
        switch (move.kind) {
          case "WHY":
            // Above and slightly left of CQ
            positions[dmNode.id] = {
              x: targetPos.x - 80,
              y: targetPos.y - 100
            };
            break;
          case "GROUNDS":
            // Left of created RA-node
            positions[dmNode.id] = {
              x: targetPos.x - 150,
              y: targetPos.y
            };
            break;
          case "CONCEDE":
          case "RETRACT":
            // Below I-node
            positions[dmNode.id] = {
              x: targetPos.x,
              y: targetPos.y + 100
            };
            break;
          default:
            // Default: offset to avoid overlap
            positions[dmNode.id] = {
              x: targetPos.x + 100,
              y: targetPos.y - 50
            };
        }
      }
    } else {
      // No affected nodes: position at periphery
      positions[dmNode.id] = {
        x: options.width - 150,
        y: 50 + Object.keys(positions).length * 30
      };
    }
  }

  return positions;
}

// Wrapper for ELK layout engine
async function elkLayout(
  nodes: AifNodeWithDialogue[],
  edges: DialogueAwareEdge[],
  options: LayoutOptions
): Promise<Record<string, { x: number; y: number }>> {
  // Use existing ELK integration from components/map/Aifdagrelayout.tsx
  // ... implementation ...
  return {};
}
```

**Tasks:**

- [ ] 4.2.1: Create `lib/aif/layout.ts` with layout algorithm
- [ ] 4.2.2: Implement DM-node positioning rules for each move type
- [ ] 4.2.3: Integrate with existing ELK/Dagre layout engine
- [ ] 4.2.4: Add collision detection to avoid node overlap
- [ ] 4.2.5: Optimize for large graphs (>100 nodes)
- [ ] 4.2.6: Write unit tests with mock graph data
- [ ] 4.2.7: Benchmark performance (target <50ms for 100 nodes)

**Estimated Time:** 4 days

---

### 4.3 Update Other AIF Viewers

**Files to Modify:**
- `components/map/AifDiagramViewInteractive.tsx`
- `components/map/AifDiagramViewSemanticZoom.tsx`
- `components/map/Aifdiagramviewerdagre.tsx`

**Changes:**
- Add `includeDialogue` prop to all viewers
- Integrate DM-node rendering
- Ensure consistent behavior across viewers

**Tasks:**

- [ ] 4.3.1: Update AifDiagramViewInteractive with dialogue support
- [ ] 4.3.2: Update AifDiagramViewSemanticZoom with dialogue support
- [ ] 4.3.3: Update Aifdiagramviewerdagre with dialogue support
- [ ] 4.3.4: Test node expansion/collapse with dialogue layer
- [ ] 4.3.5: Test semantic zoom with DM-nodes
- [ ] 4.3.6: Test Dagre layout with dialogue edges
- [ ] 4.3.7: Update viewer selector component to show dialogue toggle

**Estimated Time:** 3 days

---

### 4.4 Integration Testing & Bug Fixes

**Test Scenarios:**

1. **Basic Functionality**
   - [ ] Toggle dialogue layer on/off without errors
   - [ ] DM-nodes render at correct positions
   - [ ] Clicking DM-node opens details modal
   - [ ] Hovering shows tooltips with timestamps
   
2. **Filters**
   - [ ] "Protocol only" filter shows WHY, GROUNDS, CONCEDE
   - [ ] "Structural only" filter shows THEREFORE, SUPPOSE, DISCHARGE
   - [ ] Participant filter shows only selected user's moves
   - [ ] Combining filters works correctly

3. **Performance**
   - [ ] Render time <100ms for 50-node graph with dialogue
   - [ ] Smooth animations (60fps) when toggling layer
   - [ ] No memory leaks during repeated toggle

4. **Edge Cases**
   - [ ] Empty deliberation (no moves) doesn't crash
   - [ ] Dialogue layer with no DM-nodes shows empty state
   - [ ] Orphaned DM-nodes (no target) position correctly
   - [ ] Very long move chains don't cause layout issues

**Tasks:**

- [ ] 4.4.1: Write integration test suite (Playwright/Cypress)
- [ ] 4.4.2: Test on staging environment with real data
- [ ] 4.4.3: Fix any layout bugs discovered
- [ ] 4.4.4: Optimize rendering performance if needed
- [ ] 4.4.5: User acceptance testing with 3-5 test users
- [ ] 4.4.6: Document known limitations and workarounds

**Estimated Time:** 3 days

---

## Phase 4 Summary

**Duration:** 2 weeks  
**Deliverables:**
- ✅ All AIF viewers support dialogue layer toggle
- ✅ DM-nodes integrated with proper layout algorithm
- ✅ Filters working (move type, participant)
- ✅ Details modal accessible from any DM-node
- ✅ Performance targets met (<100ms render)
- ✅ Integration tests passing with real data

**User Experience:**
- Users can enable dialogue layer with one click
- Visual distinction between protocol vs structural moves
- Hover interactions reveal move details
- Click interactions open full move information
- Filter controls allow focused analysis

---

## Next Steps

**Continue to:**
- [Phase 5-6: Timeline & Scheme Views →](./DIALOGUE_VISUALIZATION_PHASES_5_6.md) (coming soon)
- [Phase 7-9: Testing, Performance, Documentation →](./DIALOGUE_VISUALIZATION_PHASES_7_9.md) (coming soon)

**Or return to:**
- [← Main Roadmap Overview](./DIALOGUE_VISUALIZATION_ROADMAP.md)

---

**Total Progress: Phases 1-4 Complete = 53% of Project** 🎯
