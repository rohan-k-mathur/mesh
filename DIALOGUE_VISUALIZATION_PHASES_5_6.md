# Dialogue Visualization Roadmap: Phases 5-6
## Timeline View & Scheme Detail View

**Version:** 1.0  
**Date:** November 2, 2025  
**Status:** Planning Phase  

[← Back to Phases 3-4](./DIALOGUE_VISUALIZATION_PHASES_3_4.md) | [← Main Roadmap](./DIALOGUE_VISUALIZATION_ROADMAP.md)

---

## Phase 5: Timeline View (Narrative Playback) (Weeks 11-12)

**Objective:** Build a secondary visualization mode that shows dialogue moves as a temporal sequence with playback controls, enabling users to "replay" the evolution of a deliberation.

### 5.1 Timeline Component Architecture

**File:** `components/dialogue/DialogueTimeline.tsx` (new)

**Visual Design:**

```
┌─────────────────────────────────────────────────────────────────────┐
│  Dialogue Timeline                                    [⏮ ⏸ ⏭] [⚙️]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Nov 1, 10:00 AM ──────────────────── Now ─────────────────────>   │
│       │                                   │                          │
│       ●───────●────────●──────●─────────●                          │
│       │       │        │      │         │                           │
│      WHY   GROUNDS   WHY   CONCEDE   CLOSE                          │
│     Alice    Bob    Carol    Bob     Alice                          │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Selected Move Details:                                     │   │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │   │
│  │  WHY by Alice                                               │   │
│  │  "What evidence supports this claim?"                       │   │
│  │  Triggered CQ: "Is the source trustworthy?"                 │   │
│  │  ──────────────────────────────────────────────────────     │   │
│  │  [View in Diagram] [Jump to Context]                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Argument Graph Preview (synced to timeline)                  │  │
│  │                                                               │  │
│  │     [I: Claim A]                                             │  │
│  │           ↑                                                   │  │
│  │     [RA: Arg 1]  ← [DM: GROUNDS] (highlighted at t=2)       │  │
│  │           ↑                                                   │  │
│  │     [I: Premise B]                                           │  │
│  │                                                               │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

**Implementation:**

```tsx
// components/dialogue/DialogueTimeline.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Settings,
  ZoomIn,
  ZoomOut,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DialogueMoveWithAif } from "@/types/aif-dialogue";
import { format, formatDistanceToNow } from "date-fns";
import { AifDiagramViewerDagre } from "@/components/map/Aifdiagramviewerdagre";
import { useDialogueAwareGraph } from "@/lib/hooks/useDialogueAwareGraph";

interface DialogueTimelineProps {
  deliberationId: string;
  onMoveSelect?: (moveId: string) => void;
  autoPlay?: boolean;
  playbackSpeed?: number;
}

const MOVE_ICONS = {
  WHY: "❓",
  GROUNDS: "💬",
  CONCEDE: "✅",
  RETRACT: "↩️",
  CLOSE: "🚫",
  ACCEPT_ARGUMENT: "👍",
  THEREFORE: "∴",
  SUPPOSE: "💡",
  DISCHARGE: "⚡"
} as const;

const MOVE_COLORS = {
  WHY: "bg-amber-100 text-amber-900 border-amber-300",
  GROUNDS: "bg-blue-100 text-blue-900 border-blue-300",
  CONCEDE: "bg-green-100 text-green-900 border-green-300",
  RETRACT: "bg-gray-100 text-gray-900 border-gray-300",
  CLOSE: "bg-red-100 text-red-900 border-red-300",
  ACCEPT_ARGUMENT: "bg-emerald-100 text-emerald-900 border-emerald-300",
  THEREFORE: "bg-purple-100 text-purple-900 border-purple-300",
  SUPPOSE: "bg-cyan-100 text-cyan-900 border-cyan-300",
  DISCHARGE: "bg-indigo-100 text-indigo-900 border-indigo-300"
} as const;

export function DialogueTimeline({
  deliberationId,
  onMoveSelect,
  autoPlay = false,
  playbackSpeed = 1
}: DialogueTimelineProps) {
  // Fetch dialogue moves
  const { graph, isLoading } = useDialogueAwareGraph({
    deliberationId,
    includeDialogue: true,
    includeMoves: "all"
  });

  const moves = graph?.dialogueMoves || [];
  
  // Timeline state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [speed, setSpeed] = useState(playbackSpeed);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [viewMode, setViewMode] = useState<"compact" | "detailed">("detailed");

  const timelineRef = useRef<HTMLDivElement>(null);
  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-play logic
  useEffect(() => {
    if (isPlaying && currentIndex < moves.length - 1) {
      playbackIntervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => Math.min(prev + 1, moves.length - 1));
      }, 2000 / speed); // Base interval 2s, adjusted by speed
    } else {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
      if (currentIndex >= moves.length - 1) {
        setIsPlaying(false);
      }
    }

    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    };
  }, [isPlaying, currentIndex, moves.length, speed]);

  // Notify parent of selection changes
  useEffect(() => {
    if (moves[currentIndex]) {
      onMoveSelect?.(moves[currentIndex].id);
    }
  }, [currentIndex, moves, onMoveSelect]);

  // Auto-scroll timeline to keep current move visible
  useEffect(() => {
    if (timelineRef.current) {
      const timelineElement = timelineRef.current;
      const moveElement = timelineElement.children[currentIndex] as HTMLElement;
      if (moveElement) {
        moveElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center"
        });
      }
    }
  }, [currentIndex]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (moves.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          No dialogue moves to display. Start a conversation!
        </CardContent>
      </Card>
    );
  }

  const currentMove = moves[currentIndex];
  const firstMoveTime = new Date(moves[0].createdAt);
  const lastMoveTime = new Date(moves[moves.length - 1].createdAt);
  const totalDuration = lastMoveTime.getTime() - firstMoveTime.getTime();

  return (
    <div className="flex flex-col gap-4 w-full h-full">
      {/* Header with Controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Dialogue Timeline
              <Badge variant="secondary">{moves.length} moves</Badge>
            </CardTitle>
            
            {/* Playback Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentIndex(0)}
                disabled={currentIndex === 0}
              >
                <SkipBack className="w-4 h-4" />
              </Button>
              
              <Button
                variant={isPlaying ? "destructive" : "default"}
                size="icon"
                onClick={() => setIsPlaying(!isPlaying)}
                disabled={currentIndex >= moves.length - 1}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentIndex(moves.length - 1)}
                disabled={currentIndex === moves.length - 1}
              >
                <SkipForward className="w-4 h-4" />
              </Button>

              {/* Speed Control */}
              <Select value={String(speed)} onValueChange={(v) => setSpeed(Number(v))}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.5">0.5x</SelectItem>
                  <SelectItem value="1">1x</SelectItem>
                  <SelectItem value="2">2x</SelectItem>
                  <SelectItem value="4">4x</SelectItem>
                </SelectContent>
              </Select>

              {/* Zoom Controls */}
              <div className="flex items-center gap-1 border rounded-md">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.25))}
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-xs px-2">{Math.round(zoomLevel * 100)}%</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.25))}
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>

              {/* View Mode Toggle */}
              <Select value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact">Compact</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <Slider
              value={[currentIndex]}
              min={0}
              max={moves.length - 1}
              step={1}
              onValueChange={([value]) => setCurrentIndex(value)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{format(firstMoveTime, "MMM d, h:mm a")}</span>
              <span>
                Move {currentIndex + 1} of {moves.length}
              </span>
              <span>{format(lastMoveTime, "MMM d, h:mm a")}</span>
            </div>
          </div>

          {/* Timeline Visualization */}
          <div
            ref={timelineRef}
            className="relative overflow-x-auto py-8 px-4"
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: "center",
              transition: "transform 0.2s"
            }}
          >
            <div className="flex items-center gap-4 min-w-max">
              {moves.map((move, index) => {
                const isActive = index === currentIndex;
                const isPast = index < currentIndex;
                const isFuture = index > currentIndex;

                // Calculate position along timeline
                const moveTime = new Date(move.createdAt);
                const relativePosition = 
                  (moveTime.getTime() - firstMoveTime.getTime()) / totalDuration;

                return (
                  <React.Fragment key={move.id}>
                    {/* Move Node */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ 
                        scale: isActive ? 1.2 : 1,
                        opacity: isFuture ? 0.4 : 1
                      }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className="flex flex-col items-center gap-2 cursor-pointer"
                      onClick={() => setCurrentIndex(index)}
                    >
                      {/* Time Label */}
                      <div className="text-xs text-gray-500 whitespace-nowrap">
                        {formatDistanceToNow(moveTime, { addSuffix: false })} ago
                      </div>

                      {/* Node Circle */}
                      <div
                        className={`
                          relative w-16 h-16 rounded-full border-2 flex items-center justify-center
                          transition-all duration-200
                          ${isActive 
                            ? "ring-4 ring-blue-300 ring-opacity-50" 
                            : ""
                          }
                          ${MOVE_COLORS[move.kind as keyof typeof MOVE_COLORS] || "bg-gray-100 border-gray-300"}
                        `}
                      >
                        <span className="text-2xl">
                          {MOVE_ICONS[move.kind as keyof typeof MOVE_ICONS] || "●"}
                        </span>

                        {/* Completion Badge */}
                        {isPast && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        )}
                      </div>

                      {/* Move Label */}
                      <div className="text-center">
                        <Badge variant="outline" className="text-xs">
                          {move.kind}
                        </Badge>
                        <div className="text-xs text-gray-600 mt-1">
                          {move.author?.displayName || move.author?.username || "Unknown"}
                        </div>
                      </div>
                    </motion.div>

                    {/* Connecting Line */}
                    {index < moves.length - 1 && (
                      <div
                        className={`h-0.5 w-24 ${
                          isPast ? "bg-blue-400" : "bg-gray-300"
                        }`}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Move Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Move Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {currentMove.kind} by{" "}
              {currentMove.author?.displayName || currentMove.author?.username}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Timestamp */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              {format(new Date(currentMove.createdAt), "PPpp")}
            </div>

            {/* Illocution */}
            {currentMove.illocution && (
              <div>
                <span className="text-sm font-medium text-gray-700">Illocution: </span>
                <Badge>{currentMove.illocution}</Badge>
              </div>
            )}

            {/* Target */}
            <div>
              <span className="text-sm font-medium text-gray-700">Target: </span>
              <span className="text-sm text-gray-600">
                {currentMove.targetType} ({currentMove.targetId.slice(0, 8)}...)
              </span>
            </div>

            {/* Payload Preview */}
            {currentMove.payload && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700">Payload:</div>
                <pre className="text-xs bg-gray-50 p-3 rounded-md overflow-x-auto max-h-48">
                  {JSON.stringify(currentMove.payload, null, 2)}
                </pre>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button variant="outline" size="sm">
                View in Diagram
              </Button>
              <Button variant="outline" size="sm">
                Jump to Context
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Right: Synced Graph Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Argument State at This Moment</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Mini AIF diagram showing state up to currentIndex */}
            <div className="h-[400px] border rounded-md bg-gray-50">
              {graph && (
                <AifDiagramViewerDagre
                  subgraph={{
                    nodes: graph.nodes.filter((n) => {
                      // Only show nodes created up to current move
                      const nodeMove = graph.dialogueMoves.find(
                        (m) => m.aifRepresentation === n.id
                      );
                      if (nodeMove) {
                        const nodeMoveIndex = moves.findIndex((m) => m.id === nodeMove.id);
                        return nodeMoveIndex <= currentIndex;
                      }
                      return true; // Include non-dialogue nodes
                    }),
                    edges: graph.edges.filter((e) => {
                      // Only show edges created up to current move
                      if (e.causedByDialogueMoveId) {
                        const edgeMoveIndex = moves.findIndex(
                          (m) => m.id === e.causedByDialogueMoveId
                        );
                        return edgeMoveIndex <= currentIndex;
                      }
                      return true;
                    })
                  }}
                  highlightedNodes={[currentMove.aifRepresentation].filter(Boolean) as string[]}
                />
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Showing argument structure up to move {currentIndex + 1}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

**Tasks:**

- [ ] 5.1.1: Create `DialogueTimeline.tsx` with playback controls
- [ ] 5.1.2: Implement auto-play with adjustable speed (0.5x - 4x)
- [ ] 5.1.3: Add timeline scrubber with move markers
- [ ] 5.1.4: Implement zoom controls for timeline density
- [ ] 5.1.5: Add compact/detailed view mode toggle
- [ ] 5.1.6: Sync AIF diagram preview to current timeline position
- [ ] 5.1.7: Add keyboard shortcuts (Space=play/pause, ←/→=step)
- [ ] 5.1.8: Implement "Jump to Move" search functionality

**Estimated Time:** 4 days

---

### 5.2 Timeline Export & Sharing

**File:** `components/dialogue/TimelineExport.tsx` (new)

**Features:**

```tsx
// components/dialogue/TimelineExport.tsx
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";
import { Download, Share2, Film, FileText } from "lucide-react";
import type { DialogueMoveWithAif } from "@/types/aif-dialogue";

interface TimelineExportProps {
  moves: DialogueMoveWithAif[];
  deliberationId: string;
}

export function TimelineExport({ moves, deliberationId }: TimelineExportProps) {
  const [exporting, setExporting] = useState(false);

  const exportAsVideo = async () => {
    // Generate video using canvas/webcodecs
    // Capture each frame of timeline animation
    console.log("Export as video...");
  };

  const exportAsTranscript = () => {
    // Generate Markdown transcript
    const transcript = `# Dialogue Transcript
Deliberation: ${deliberationId}
Total Moves: ${moves.length}

---

${moves.map((move, i) => `
## Move ${i + 1}: ${move.kind}
**Author:** ${move.author?.displayName || "Unknown"}  
**Time:** ${new Date(move.createdAt).toLocaleString()}  
**Target:** ${move.targetType} (${move.targetId})

${move.payload ? `**Details:**\n\`\`\`json\n${JSON.stringify(move.payload, null, 2)}\n\`\`\`\n` : ""}
---
`).join("\n")}
`;

    const blob = new Blob([transcript], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dialogue-transcript-${deliberationId}.md`;
    a.click();
  };

  const shareTimeline = async () => {
    const url = `${window.location.origin}/deliberation/${deliberationId}/timeline`;
    if (navigator.share) {
      await navigator.share({
        title: "Dialogue Timeline",
        text: `Check out this dialogue with ${moves.length} moves`,
        url
      });
    } else {
      navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="w-4 h-4 mr-2" />
          Export/Share
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Timeline</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={exportAsVideo}
            disabled={exporting}
          >
            <Film className="w-4 h-4 mr-2" />
            Export as Video (MP4)
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={exportAsTranscript}
          >
            <FileText className="w-4 h-4 mr-2" />
            Export as Transcript (Markdown)
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={shareTimeline}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share Timeline Link
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

**Tasks:**

- [ ] 5.2.1: Implement Markdown transcript export
- [ ] 5.2.2: Add CSV export for data analysis
- [ ] 5.2.3: Implement video export (canvas recording)
- [ ] 5.2.4: Add share link generation with tracking
- [ ] 5.2.5: Support embedding timeline in external sites

**Estimated Time:** 2 days

---

### 5.3 Timeline Page Integration

**File:** `app/(editor)/deliberation/[id]/timeline/page.tsx` (new)

```tsx
// app/(editor)/deliberation/[id]/timeline/page.tsx

import React from "react";
import { DialogueTimeline } from "@/components/dialogue/DialogueTimeline";
import { TimelineExport } from "@/components/dialogue/TimelineExport";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TimelinePage({ 
  params 
}: { 
  params: { id: string } 
}) {
  return (
    <div className="container mx-auto py-6 space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link href={`/deliberation/${params.id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Deliberation
          </Button>
        </Link>
        
        <TimelineExport 
          moves={[]} // Will be fetched inside component
          deliberationId={params.id}
        />
      </div>

      {/* Timeline Component */}
      <DialogueTimeline 
        deliberationId={params.id}
        autoPlay={false}
      />
    </div>
  );
}
```

**Tasks:**

- [ ] 5.3.1: Create dedicated timeline route
- [ ] 5.3.2: Add "View Timeline" button to deliberation pages
- [ ] 5.3.3: Implement URL query params for sharing specific moments
- [ ] 5.3.4: Add SEO metadata for timeline pages
- [ ] 5.3.5: Test responsive layout on mobile devices

**Estimated Time:** 1 day

---

## Phase 5 Summary

**Duration:** 1.5 weeks  
**Deliverables:**
- ✅ Interactive timeline with playback controls
- ✅ Auto-play with speed adjustment (0.5x - 4x)
- ✅ Synced AIF diagram showing state at each moment
- ✅ Export options (video, transcript, CSV)
- ✅ Dedicated timeline route with sharing
- ✅ Keyboard shortcuts for navigation

**User Experience:**
- Users can replay entire deliberations like a movie
- Scrubber allows jumping to any point in time
- Visual correlation between moves and argument evolution
- Export for presentations and analysis

---

## Phase 6: Scheme Detail View (Provenance Annotations) (Weeks 13-14)

**Objective:** Enhance scheme cards and argument displays with dialogue provenance badges, showing which moves created/answered critical questions.

### 6.1 Scheme Card with Dialogue Annotations

**File:** `components/schemes/SchemeCardWithDialogue.tsx` (new)

**Visual Design:**

```
┌──────────────────────────────────────────────────────────────┐
│  Expert Opinion Scheme                                       │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                               │
│  Premises:                                                    │
│  1. E is an expert in domain D                [✓] Accepted   │
│  2. E asserts proposition P                   [✓] Accepted   │
│                                                               │
│  Conclusion:                                                  │
│  → P is presumably true                       [✓] Accepted   │
│                                                               │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                               │
│  Critical Questions:                                          │
│                                                               │
│  ❓ CQ1: Is E trustworthy?                                   │
│     [WHY by Alice, 2h ago] → [GROUNDS by Bob, 1h ago] ✓     │
│     Status: Answered                                         │
│     ├─ Challenge: "What are E's credentials?"                │
│     └─ Answer: Argument #42 (Click to view)                  │
│                                                               │
│  ❓ CQ2: Is E an expert in the right domain?                 │
│     [WHY by Carol, 30m ago] → [Pending response]            │
│     Status: Open Challenge                                   │
│     └─ No answer yet (⏰ 2h remaining)                       │
│                                                               │
│  ❓ CQ3: Is E's opinion consistent with other experts?       │
│     Status: Not challenged                                   │
│                                                               │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                               │
│  Dialogue History: 3 moves | Last activity: 30m ago          │
│  [View Full Thread] [See in Timeline]                        │
└──────────────────────────────────────────────────────────────┘
```

**Implementation:**

```tsx
// components/schemes/SchemeCardWithDialogue.tsx
"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  Circle, 
  AlertCircle, 
  Clock,
  MessageCircle,
  Eye,
  Calendar
} from "lucide-react";
import type { Argument, CriticalQuestion } from "@prisma/client";
import type { DialogueMoveWithAif } from "@/types/aif-dialogue";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface SchemeCardWithDialogueProps {
  argument: Argument & {
    scheme: { name: string; category: string };
    premises: Array<{ claim: { text: string } }>;
    conclusion: { text: string } | null;
    criticalQuestions: Array<CriticalQuestion & {
      status?: Array<{
        status: string;
        questionMove?: DialogueMoveWithAif | null;
        answerMove?: DialogueMoveWithAif | null;
      }>;
    }>;
  };
  deliberationId: string;
}

export function SchemeCardWithDialogue({
  argument,
  deliberationId
}: SchemeCardWithDialogueProps) {
  const totalCQs = argument.criticalQuestions.length;
  const answeredCQs = argument.criticalQuestions.filter(
    (cq) => cq.status?.[0]?.status === "answered"
  ).length;
  const openCQs = argument.criticalQuestions.filter(
    (cq) => cq.status?.[0]?.status === "pending"
  ).length;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl">
              {argument.scheme.name}
            </CardTitle>
            <Badge variant="outline" className="mt-2">
              {argument.scheme.category}
            </Badge>
          </div>
          
          {/* Dialogue Activity Indicator */}
          <div className="flex flex-col items-end gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              {totalCQs} CQs
            </Badge>
            {openCQs > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {openCQs} open
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Premises */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700">Premises:</h3>
          {argument.premises.map((premise, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">
                {i + 1}. {premise.claim.text}
              </span>
            </div>
          ))}
        </div>

        {/* Conclusion */}
        {argument.conclusion && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700">Conclusion:</h3>
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">→ {argument.conclusion.text}</span>
            </div>
          </div>
        )}

        <div className="border-t pt-4" />

        {/* Critical Questions with Dialogue Provenance */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            Critical Questions:
            <Badge variant="outline" className="text-xs">
              {answeredCQs}/{totalCQs} answered
            </Badge>
          </h3>

          {argument.criticalQuestions.map((cq, index) => {
            const cqStatus = cq.status?.[0];
            const questionMove = cqStatus?.questionMove;
            const answerMove = cqStatus?.answerMove;
            const isAnswered = cqStatus?.status === "answered";
            const isPending = cqStatus?.status === "pending";
            const isNotChallenged = !cqStatus;

            return (
              <div
                key={cq.id}
                className={`
                  p-4 rounded-lg border-2 transition-all
                  ${isAnswered ? "bg-green-50 border-green-200" : ""}
                  ${isPending ? "bg-amber-50 border-amber-200" : ""}
                  ${isNotChallenged ? "bg-gray-50 border-gray-200" : ""}
                `}
              >
                {/* CQ Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-start gap-2 flex-1">
                    <span className="text-lg">
                      {isAnswered ? "✅" : isPending ? "⏳" : "❓"}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">
                        CQ{index + 1}: {cq.question}
                      </p>
                    </div>
                  </div>
                  
                  <Badge 
                    variant={
                      isAnswered ? "default" : 
                      isPending ? "destructive" : 
                      "outline"
                    }
                  >
                    {isAnswered ? "Answered" : 
                     isPending ? "Open" : 
                     "Not Challenged"}
                  </Badge>
                </div>

                {/* Dialogue Moves */}
                {questionMove && (
                  <div className="ml-6 space-y-2">
                    {/* Challenge Move */}
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="bg-amber-100 text-amber-900">
                        WHY
                      </Badge>
                      <span className="text-gray-600">by</span>
                      <span className="font-medium">
                        {questionMove.author?.displayName || "Unknown"}
                      </span>
                      <span className="text-gray-500">
                        {formatDistanceToNow(new Date(questionMove.createdAt), { 
                          addSuffix: true 
                        })}
                      </span>
                    </div>

                    {/* Answer Move */}
                    {answerMove ? (
                      <>
                        <div className="flex items-center gap-2 ml-4">
                          <span className="text-gray-400">→</span>
                          <Badge variant="outline" className="bg-blue-100 text-blue-900">
                            GROUNDS
                          </Badge>
                          <span className="text-gray-600">by</span>
                          <span className="font-medium">
                            {answerMove.author?.displayName || "Unknown"}
                          </span>
                          <span className="text-gray-500">
                            {formatDistanceToNow(new Date(answerMove.createdAt), { 
                              addSuffix: true 
                            })}
                          </span>
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        </div>

                        {/* Link to Answer Argument */}
                        {answerMove.argumentId && (
                          <div className="ml-8 mt-2">
                            <Link href={`/argument/${answerMove.argumentId}`}>
                              <Button variant="link" size="sm" className="h-auto p-0">
                                <Eye className="w-3 h-3 mr-1" />
                                View Answer Argument
                              </Button>
                            </Link>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center gap-2 ml-4 text-sm text-amber-700">
                        <Clock className="w-4 h-4" />
                        <span>Pending response</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="border-t pt-4" />

        {/* Footer Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            <span>
              Last activity:{" "}
              {argument.updatedAt 
                ? formatDistanceToNow(new Date(argument.updatedAt), { addSuffix: true })
                : "Never"}
            </span>
          </div>
          
          <div className="flex gap-2">
            <Link href={`/deliberation/${deliberationId}/timeline?argument=${argument.id}`}>
              <Button variant="outline" size="sm">
                <Calendar className="w-4 h-4 mr-2" />
                See in Timeline
              </Button>
            </Link>
            
            <Button variant="outline" size="sm">
              <MessageCircle className="w-4 h-4 mr-2" />
              View Full Thread
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Tasks:**

- [ ] 6.1.1: Create `SchemeCardWithDialogue.tsx` component
- [ ] 6.1.2: Fetch CQ status with dialogue move provenance
- [ ] 6.1.3: Display challenge/answer move badges with timestamps
- [ ] 6.1.4: Add visual indicators for answered vs open CQs
- [ ] 6.1.5: Link to timeline view filtered to this argument
- [ ] 6.1.6: Add "View Full Thread" button to expand dialogue history
- [ ] 6.1.7: Implement hover tooltips showing full move payload
- [ ] 6.1.8: Add real-time updates when CQs answered (WebSocket/polling)

**Estimated Time:** 4 days

---

### 6.2 Provenance Tooltip Component

**File:** `components/aif/ProvenanceTooltip.tsx` (new)

```tsx
// components/aif/ProvenanceTooltip.tsx
"use client";

import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Info, User, Clock, MessageCircle } from "lucide-react";
import type { DialogueMoveWithAif } from "@/types/aif-dialogue";
import { formatDistanceToNow } from "date-fns";

interface ProvenanceTooltipProps {
  move: DialogueMoveWithAif;
  children: React.ReactNode;
}

export function ProvenanceTooltip({ move, children }: ProvenanceTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-sm p-4">
          <div className="space-y-2">
            {/* Header */}
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-blue-500" />
              <span className="font-semibold">Dialogue Provenance</span>
            </div>

            {/* Move Type */}
            <div className="flex items-center gap-2">
              <Badge>{move.kind}</Badge>
              <Badge variant="outline">{move.illocution}</Badge>
            </div>

            {/* Author */}
            <div className="flex items-center gap-2 text-sm">
              <User className="w-3 h-3 text-gray-500" />
              <span className="text-gray-700">
                {move.author?.displayName || move.author?.username || "Unknown"}
              </span>
            </div>

            {/* Timestamp */}
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-3 h-3 text-gray-500" />
              <span className="text-gray-600">
                {formatDistanceToNow(new Date(move.createdAt), { addSuffix: true })}
              </span>
            </div>

            {/* Votes (if any) */}
            {move.votes && move.votes.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Info className="w-3 h-3 text-gray-500" />
                <span className="text-gray-600">
                  {move.votes.filter(v => v.voteType === "UPVOTE").length} upvotes,{" "}
                  {move.votes.filter(v => v.voteType === "DOWNVOTE").length} downvotes
                </span>
              </div>
            )}

            <div className="text-xs text-gray-500 pt-2 border-t">
              Click for full details
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
```

**Usage Example:**

```tsx
// In any AIF node rendering
<ProvenanceTooltip move={node.dialogueMove}>
  <div className="aif-node">
    {node.text}
  </div>
</ProvenanceTooltip>
```

**Tasks:**

- [ ] 6.2.1: Create reusable provenance tooltip component
- [ ] 6.2.2: Add to all AIF node renderers
- [ ] 6.2.3: Add to scheme card CQ items
- [ ] 6.2.4: Implement click-through to full move details
- [ ] 6.2.5: Add keyboard accessibility (Tab, Enter)

**Estimated Time:** 2 days

---

### 6.3 Integration with Existing Components

**Files to Update:**
- `components/arguments/ArgumentActionsSheet.tsx`
- `components/map/AifDiagramView.tsx`
- `components/schemes/*`

**Changes:**

```tsx
// Add provenance badges to existing argument displays

// Example: In ArgumentActionsSheet.tsx
import { ProvenanceTooltip } from "@/components/aif/ProvenanceTooltip";
import { Badge } from "@/components/ui/badge";

// In render:
{argument.dialogueMove && (
  <ProvenanceTooltip move={argument.dialogueMove}>
    <Badge variant="outline" className="cursor-help">
      <MessageCircle className="w-3 h-3 mr-1" />
      Created by {argument.dialogueMove.kind}
    </Badge>
  </ProvenanceTooltip>
)}
```

**Tasks:**

- [ ] 6.3.1: Add provenance badges to ArgumentActionsSheet
- [ ] 6.3.2: Update AifDiagramView hover states with provenance
- [ ] 6.3.3: Add dialogue activity indicators to argument cards
- [ ] 6.3.4: Update search results to show dialogue context
- [ ] 6.3.5: Add filter by "arguments with dialogue" option
- [ ] 6.3.6: Update argument comparison view with provenance

**Estimated Time:** 2 days

---

### 6.4 CQ Challenge/Answer Flow Enhancement

**File:** `components/dialogue/CqDialogueFlow.tsx` (new)

**Purpose:** Visual flow diagram showing CQ challenge → answer cycle

```tsx
// components/dialogue/CqDialogueFlow.tsx
"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle, Clock } from "lucide-react";
import type { CriticalQuestion } from "@prisma/client";
import type { DialogueMoveWithAif } from "@/types/aif-dialogue";

interface CqDialogueFlowProps {
  criticalQuestion: CriticalQuestion;
  challengeMove?: DialogueMoveWithAif;
  answerMove?: DialogueMoveWithAif;
}

export function CqDialogueFlow({
  criticalQuestion,
  challengeMove,
  answerMove
}: CqDialogueFlowProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-4">
        {/* Critical Question */}
        <div className="flex-shrink-0">
          <div className="text-sm font-medium text-gray-700">Critical Question</div>
          <div className="text-xs text-gray-500 max-w-xs">
            {criticalQuestion.question}
          </div>
        </div>

        <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0" />

        {/* Challenge Move (WHY) */}
        {challengeMove ? (
          <div className="flex-shrink-0">
            <Badge variant="outline" className="bg-amber-100">WHY</Badge>
            <div className="text-xs text-gray-600 mt-1">
              by {challengeMove.author?.displayName}
            </div>
          </div>
        ) : (
          <div className="flex-shrink-0 text-sm text-gray-400">
            Not challenged
          </div>
        )}

        {challengeMove && (
          <>
            <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0" />

            {/* Answer Move (GROUNDS) */}
            {answerMove ? (
              <div className="flex-shrink-0">
                <Badge variant="outline" className="bg-blue-100">GROUNDS</Badge>
                <div className="text-xs text-gray-600 mt-1">
                  by {answerMove.author?.displayName}
                </div>
                <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
              </div>
            ) : (
              <div className="flex-shrink-0 flex items-center gap-2 text-sm text-amber-600">
                <Clock className="w-4 h-4" />
                Pending answer
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
```

**Tasks:**

- [ ] 6.4.1: Create CQ dialogue flow visualization component
- [ ] 6.4.2: Add to scheme cards as expandable section
- [ ] 6.4.3: Show challenge/answer timeline
- [ ] 6.4.4: Add "Challenge this CQ" button for open questions
- [ ] 6.4.5: Add "Provide Answer" button for pending challenges

**Estimated Time:** 2 days

---

## Phase 6 Summary

**Duration:** 1.5 weeks  
**Deliverables:**
- ✅ Scheme cards show dialogue provenance for all CQs
- ✅ Visual indicators for answered vs open challenges
- ✅ Provenance tooltips on all AIF nodes
- ✅ CQ dialogue flow visualization
- ✅ Integration with existing argument views
- ✅ Real-time updates for CQ status changes

**User Experience:**
- Users instantly see which CQs have been challenged
- Clear visual path from challenge to answer
- Hover interactions reveal full dialogue context
- Seamless navigation to timeline for deeper inspection

---

## Phases 5-6 Complete! 🎉

**Combined Duration:** 3 weeks  
**Overall Project Progress:** 80% complete (Phases 1-6 done)

### What's Working Now:

1. **Timeline View** - Users can replay deliberations with playback controls
2. **Provenance Annotations** - Every AIF node and CQ shows its dialogue origin
3. **Integrated Navigation** - Jump between diagram, timeline, and scheme views
4. **Export & Sharing** - Generate transcripts, videos, and shareable links

### Next Steps:

**Continue to:**
- [Phase 7-9: Testing, Performance, Documentation →](./DIALOGUE_VISUALIZATION_PHASES_7_9.md) (coming soon)

**Or return to:**
- [← Phases 3-4](./DIALOGUE_VISUALIZATION_PHASES_3_4.md)
- [← Main Roadmap Overview](./DIALOGUE_VISUALIZATION_ROADMAP.md)

---

## Testing Checklist for Phases 5-6

### Timeline View Tests

- [ ] **T5.1:** Timeline loads with all moves in chronological order
- [ ] **T5.2:** Playback controls work (play, pause, step forward/back)
- [ ] **T5.3:** Speed adjustment changes playback rate correctly
- [ ] **T5.4:** Timeline scrubber allows jumping to any point
- [ ] **T5.5:** Synced AIF diagram updates with timeline position
- [ ] **T5.6:** Zoom controls adjust timeline density
- [ ] **T5.7:** Keyboard shortcuts work (Space, arrows)
- [ ] **T5.8:** Export generates valid Markdown transcript
- [ ] **T5.9:** Share link navigates to correct timeline position
- [ ] **T5.10:** Timeline is responsive on mobile/tablet

### Scheme Provenance Tests

- [ ] **T6.1:** Scheme cards display all CQs with correct status
- [ ] **T6.2:** Challenge moves (WHY) show author and timestamp
- [ ] **T6.3:** Answer moves (GROUNDS) link to created arguments
- [ ] **T6.4:** Provenance tooltips appear on hover
- [ ] **T6.5:** "View Full Thread" navigates to dialogue history
- [ ] **T6.6:** "See in Timeline" jumps to relevant moment
- [ ] **T6.7:** Real-time updates when CQ answered
- [ ] **T6.8:** CQ dialogue flow shows correct sequence
- [ ] **T6.9:** Provenance badges render in all AIF viewers
- [ ] **T6.10:** Accessibility: tooltips work with keyboard navigation

### Integration Tests

- [ ] **T5-6.1:** Timeline → Diagram navigation is seamless
- [ ] **T5-6.2:** Clicking DM-node in diagram shows in timeline
- [ ] **T5-6.3:** Scheme card links to timeline work correctly
- [ ] **T5-6.4:** Provenance data consistent across all views
- [ ] **T5-6.5:** Performance: Timeline with 200+ moves <500ms load

---

**Total Estimated Development Time (Phases 1-6): 12 weeks**  
**Remaining Work (Phases 7-9): 4 weeks**  
**Total Project Timeline: ~16 weeks (4 months)**
