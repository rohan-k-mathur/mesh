
# PHASE 2: EVIDENCE UX

**Objective**: Make citations executable, carry evidence through workflows, and add semantic intent to transform Stacks from a collection tool into an evidence-first knowledge platform.

**Timeline**: Weeks 6-9  
**Team**: 1-2 engineers  
**Dependencies**: Phase 1 complete (especially 1.1 StackItem for block references)

---

## 2.1 Citation Anchors

**Priority**: P0 — Core evidence UX improvement  
**Estimated Effort**: 4-5 days  
**Risk Level**: Medium (requires PDF viewer integration)  
**Dependencies**: Existing Annotation model

### 2.1.1 Problem Statement

Current citations have `locator` (e.g., "p. 13") and `quote` fields, but:
- No guarantee the locator deep-links to the actual location
- No connection to PDF annotations/highlights
- Clicking a citation doesn't navigate to the source location
- Web captures and videos have no anchor mechanism

**Goal**: Citations become **executable references** — click to jump to exact location in source.

### 2.1.2 Current State (from schema.prisma)

```prisma
model Citation {
  id          String   @id @default(cuid())
  targetType  String   // 'argument' | 'claim' | 'card' | 'comment' | 'move'
  targetId    String
  sourceId    String
  locator     String?  // 'p. 13', 'fig. 2', timestamp '08:14', etc.
  quote       String?  // short excerpt (<= 280 chars)
  note        String?  // optional note / why relevant
  relevance   Int?     // 1..5 quick signal
  createdById String
  createdAt   DateTime @default(now())
  source      Source   @relation(fields: [sourceId], references: [id])
}

model Annotation {
  id         String   @id @default(cuid())
  post_id    String   // LibraryPost.id
  page       Int
  rect       Json     // {x, y, width, height} or selection coordinates
  text       String   // Selected/highlighted text
  author_id  BigInt
  created_at DateTime @default(now())
  post       LibraryPost @relation(...)
}
```

**Gap**: Citation and Annotation are not linked. A citation can reference a page, but doesn't point to a specific annotation/highlight.

### 2.1.3 Schema Extension

```prisma
model Citation {
  // ... existing fields ...
  
  // ─────────────────────────────────────────────────────────
  // NEW: Anchor fields for executable references
  // ─────────────────────────────────────────────────────────
  anchorType    CitationAnchorType?
  anchorId      String?   // Reference to Annotation.id or other anchor entity
  anchorData    Json?     // Flexible anchor data (coordinates, ranges, etc.)
  
  // Optional: Link back to originating annotation
  annotation    Annotation? @relation(fields: [anchorId], references: [id], onDelete: SetNull)
}

enum CitationAnchorType {
  annotation     // PDF highlight → links to Annotation record
  text_range     // Web capture text selection → anchorData has range
  timestamp      // Video/audio → anchorData has {start, end} seconds
  page           // Page-level reference (no specific selection)
  coordinates    // Image region → anchorData has {x, y, width, height}
}

model Annotation {
  // ... existing fields ...
  
  // NEW: Citations that reference this annotation
  citations     Citation[]
}
```

### 2.1.4 Anchor Data Structures

```typescript
// lib/citations/anchorTypes.ts

export type CitationAnchor = 
  | AnnotationAnchor
  | TextRangeAnchor
  | TimestampAnchor
  | PageAnchor
  | CoordinatesAnchor;

export interface AnnotationAnchor {
  type: "annotation";
  annotationId: string;
  page: number;
  // Denormalized for quick display without fetching annotation
  rect?: { x: number; y: number; width: number; height: number };
}

export interface TextRangeAnchor {
  type: "text_range";
  // For web captures - CSS selector path to element
  startSelector: string;
  startOffset: number;
  endSelector: string;
  endOffset: number;
}

export interface TimestampAnchor {
  type: "timestamp";
  start: number;  // Seconds
  end?: number;   // Optional end time for range
}

export interface PageAnchor {
  type: "page";
  page: number;
}

export interface CoordinatesAnchor {
  type: "coordinates";
  x: number;
  y: number;
  width: number;
  height: number;
}
```

### 2.1.5 Citation Creation with Anchor

```typescript
// app/api/citations/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { getCurrentUserId } from "@/lib/serverutils";

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const {
    targetType,
    targetId,
    sourceId,
    locator,
    quote,
    note,
    relevance,
    // NEW: Anchor fields
    anchorType,
    anchorId,
    anchorData,
  } = await req.json();

  // Validate required fields
  if (!targetType || !targetId || !sourceId) {
    return NextResponse.json(
      { error: "targetType, targetId, and sourceId required" },
      { status: 400 }
    );
  }

  // If anchorType is annotation, verify the annotation exists
  if (anchorType === "annotation" && anchorId) {
    const annotation = await prisma.annotation.findUnique({
      where: { id: anchorId },
      select: { id: true, page: true, rect: true, text: true },
    });
    
    if (!annotation) {
      return NextResponse.json(
        { error: "Annotation not found" },
        { status: 404 }
      );
    }
    
    // Auto-fill locator and quote from annotation if not provided
    const autoLocator = locator || `p. ${annotation.page}`;
    const autoQuote = quote || annotation.text?.slice(0, 280);
    
    const citation = await prisma.citation.create({
      data: {
        targetType,
        targetId,
        sourceId,
        locator: autoLocator,
        quote: autoQuote,
        note,
        relevance,
        anchorType: "annotation",
        anchorId,
        anchorData: { page: annotation.page, rect: annotation.rect },
        createdById: userId,
      },
      include: {
        source: true,
        annotation: true,
      },
    });

    return NextResponse.json({ citation });
  }

  // Non-annotation anchor or no anchor
  const citation = await prisma.citation.create({
    data: {
      targetType,
      targetId,
      sourceId,
      locator,
      quote,
      note,
      relevance,
      anchorType: anchorType || null,
      anchorId: anchorId || null,
      anchorData: anchorData || null,
      createdById: userId,
    },
    include: {
      source: true,
    },
  });

  return NextResponse.json({ citation });
}
```

### 2.1.6 PDF Viewer Integration: "Cite Selection" Flow

```tsx
// components/pdf/PDFSelectionCiteButton.tsx

"use client";

import { useState } from "react";
import { QuoteIcon } from "lucide-react";
import { CreateCitationModal } from "../citations/CreateCitationModal";

interface PDFSelectionCiteButtonProps {
  postId: string;           // LibraryPost.id
  sourceId: string;         // Source.id linked to this PDF
  page: number;
  selectedText: string;
  selectionRect: { x: number; y: number; width: number; height: number };
  onCited: () => void;
}

export function PDFSelectionCiteButton({
  postId,
  sourceId,
  page,
  selectedText,
  selectionRect,
  onCited,
}: PDFSelectionCiteButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [annotationId, setAnnotationId] = useState<string | null>(null);

  const handleCite = async () => {
    // First, create an annotation to persist the highlight
    const res = await fetch("/api/annotations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        post_id: postId,
        page,
        rect: selectionRect,
        text: selectedText,
      }),
    });

    if (res.ok) {
      const { annotation } = await res.json();
      setAnnotationId(annotation.id);
      setModalOpen(true);
    }
  };

  return (
    <>
      <button
        onClick={handleCite}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-md shadow-lg text-sm font-medium hover:bg-primary/90"
      >
        <QuoteIcon className="h-4 w-4" />
        Cite this
      </button>

      <CreateCitationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        sourceId={sourceId}
        prefill={{
          locator: `p. ${page}`,
          quote: selectedText.slice(0, 280),
          anchorType: "annotation",
          anchorId: annotationId!,
          anchorData: { page, rect: selectionRect },
        }}
        onCreated={() => {
          onCited();
          setModalOpen(false);
        }}
      />
    </>
  );
}
```

### 2.1.7 Citation Click Navigation

```typescript
// lib/citations/navigation.ts

import { Citation, Source, Annotation } from "@prisma/client";

export interface CitationNavigationTarget {
  type: "pdf" | "link" | "video" | "text";
  url: string;
  params: Record<string, any>;
}

export function getCitationNavigationTarget(
  citation: Citation & { source: Source; annotation?: Annotation | null }
): CitationNavigationTarget | null {
  const { source, anchorType, anchorData, annotation } = citation;

  // Determine source type from Source.kind or linked LibraryPost
  if (source.libraryPostId) {
    // PDF source
    const page = (anchorData as any)?.page || 1;
    const highlightId = anchorType === "annotation" ? citation.anchorId : null;

    return {
      type: "pdf",
      url: `/library/${source.libraryPostId}`,
      params: {
        page,
        highlight: highlightId,
        // For scroll-to-rect without highlight
        rect: (anchorData as any)?.rect,
      },
    };
  }

  if (source.url) {
    if (anchorType === "timestamp") {
      const data = anchorData as { start: number; end?: number };
      // YouTube/Vimeo timestamp URL
      if (source.platform === "youtube") {
        return {
          type: "video",
          url: `${source.url}&t=${data.start}`,
          params: { start: data.start, end: data.end },
        };
      }
      return {
        type: "video",
        url: source.url,
        params: { start: data.start, end: data.end },
      };
    }

    // Web link
    return {
      type: "link",
      url: source.url,
      params: {
        textRange: anchorType === "text_range" ? anchorData : null,
      },
    };
  }

  return null;
}
```

### 2.1.8 Citation Card with Click-to-Navigate

```tsx
// components/citations/CitationCard.tsx

"use client";

import { useRouter } from "next/navigation";
import { ExternalLinkIcon, FileTextIcon, VideoIcon, QuoteIcon } from "lucide-react";
import { getCitationNavigationTarget } from "@/lib/citations/navigation";

interface CitationCardProps {
  citation: CitationWithSourceAndAnnotation;
  compact?: boolean;
}

export function CitationCard({ citation, compact }: CitationCardProps) {
  const router = useRouter();
  const navTarget = getCitationNavigationTarget(citation);

  const handleClick = () => {
    if (!navTarget) return;

    if (navTarget.type === "pdf") {
      // Navigate to PDF viewer with anchor params
      const params = new URLSearchParams();
      if (navTarget.params.page) params.set("page", String(navTarget.params.page));
      if (navTarget.params.highlight) params.set("highlight", navTarget.params.highlight);
      
      router.push(`${navTarget.url}?${params.toString()}`);
    } else if (navTarget.type === "video") {
      // Open video at timestamp
      window.open(navTarget.url, "_blank");
    } else {
      // Open link
      window.open(navTarget.url, "_blank");
    }
  };

  const TypeIcon = navTarget?.type === "pdf" 
    ? FileTextIcon 
    : navTarget?.type === "video" 
      ? VideoIcon 
      : ExternalLinkIcon;

  return (
    <div
      onClick={handleClick}
      className="group cursor-pointer p-3 rounded-lg border hover:border-primary/50 hover:bg-muted/50 transition-all"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-md bg-muted">
          <TypeIcon className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Source title */}
          <div className="font-medium text-sm line-clamp-1">
            {citation.source.title || "Untitled Source"}
          </div>

          {/* Locator */}
          {citation.locator && (
            <div className="text-xs text-muted-foreground">
              {citation.locator}
            </div>
          )}

          {/* Quote */}
          {!compact && citation.quote && (
            <blockquote className="mt-2 text-sm italic text-muted-foreground border-l-2 pl-2 line-clamp-2">
              "{citation.quote}"
            </blockquote>
          )}

          {/* Note */}
          {!compact && citation.note && (
            <p className="mt-1 text-xs text-muted-foreground">
              {citation.note}
            </p>
          )}
        </div>

        {/* Navigate indicator */}
        <ExternalLinkIcon className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
}
```

### 2.1.9 PDF Viewer: Highlight on Navigation

```tsx
// components/pdf/PDFViewer.tsx (partial - highlight handling)

"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

interface PDFViewerProps {
  postId: string;
  fileUrl: string;
}

export function PDFViewer({ postId, fileUrl }: PDFViewerProps) {
  const searchParams = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [highlightRect, setHighlightRect] = useState<any>(null);

  // Handle navigation from citation click
  useEffect(() => {
    const pageParam = searchParams.get("page");
    const highlightParam = searchParams.get("highlight");

    if (pageParam) {
      const page = parseInt(pageParam, 10);
      if (!isNaN(page)) {
        setCurrentPage(page);
        scrollToPage(page);
      }
    }

    if (highlightParam) {
      // Fetch annotation to get rect
      fetchAnnotationAndHighlight(highlightParam);
    }
  }, [searchParams]);

  const fetchAnnotationAndHighlight = async (annotationId: string) => {
    const res = await fetch(`/api/annotations/${annotationId}`);
    if (res.ok) {
      const { annotation } = await res.json();
      setCurrentPage(annotation.page);
      scrollToPage(annotation.page);
      
      // Flash highlight effect
      setHighlightRect(annotation.rect);
      setTimeout(() => {
        // Remove flash after animation
      }, 2000);
    }
  };

  const scrollToPage = (page: number) => {
    // Implementation depends on PDF library (pdf.js, react-pdf, etc.)
    const pageElement = document.getElementById(`pdf-page-${page}`);
    pageElement?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="relative">
      {/* PDF rendering here */}
      
      {/* Highlight overlay */}
      {highlightRect && (
        <div
          className="absolute bg-yellow-300/50 animate-pulse pointer-events-none"
          style={{
            left: `${highlightRect.x}%`,
            top: `${highlightRect.y}%`,
            width: `${highlightRect.width}%`,
            height: `${highlightRect.height}%`,
          }}
        />
      )}
    </div>
  );
}
```

### 2.1.10 Acceptance Criteria

| Criterion | Test |
|-----------|------|
| Annotation creates citation anchor | Select text in PDF → Cite → citation has anchorType=annotation |
| Auto-fill from annotation | Cite selection → locator and quote pre-filled |
| Click navigates to PDF page | Click citation → PDF opens at correct page |
| Highlight shown on navigation | Navigate with highlight param → rect flashes |
| Video timestamp works | Citation to YouTube → opens at timestamp |
| Web text range stored | Create citation from web capture → anchorData has range |

---

## 2.2 Lift Carries Citations

**Priority**: P0 — Critical workflow improvement  
**Estimated Effort**: 2-3 days  
**Risk Level**: Low (additive logic)  
**Dependencies**: Lift route exists at `app/api/comments/lift/route.ts`

### 2.2.1 Problem Statement

The "lift" workflow converts a stack comment into a deliberation claim. Currently:
- Claim is created from comment text ✓
- DialogueMove is created for provenance ✓
- **Citations are NOT copied** ✗

This breaks the evidence chain. Users who cite sources in their comments lose that evidence when the comment becomes a claim.

### 2.2.2 Current Lift Route (Verified)

```typescript
// app/api/comments/lift/route.ts (current)
const claim = await prisma.claim.create({
  data: {
    text: text.slice(0, 4000),
    createdById: String(userId),
    moid: `cm-${commentId}-${Date.now()}`,
    deliberationId: d.id,
  },
});

const move = await prisma.dialogueMove.create({
  data: {
    deliberationId: d.id,
    targetType: "claim",
    targetId: claim.id,
    kind: "ASSERT",
    payload: { text: claim.text },
    actorId: String(userId),
    signature: `lift:${commentId}:${Date.now()}`,
  },
});
// No citation copying!
```

### 2.2.3 Updated Lift Route with Citation Copying

```typescript
// app/api/comments/lift/route.ts (updated)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { getCurrentUserId } from "@/lib/serverutils";
import { emitBus } from "@/lib/server/bus";
import { DeliberationHostType } from "@prisma/client";

function normalizeHostType(input: string): DeliberationHostType {
  if (Object.values(DeliberationHostType).includes(input as DeliberationHostType)) {
    return input as DeliberationHostType;
  }
  if (input === "stack" || input === "stacks" || input === "library") {
    return DeliberationHostType.library_stack;
  }
  return DeliberationHostType.library_stack;
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const { commentId, hostType, hostId, as = "claim" } = await req.json();
    if (!commentId || !hostType || !hostId) {
      return NextResponse.json(
        { error: "commentId, hostType, hostId required" },
        { status: 400 }
      );
    }
    if (as !== "claim") {
      return NextResponse.json({ error: "Unsupported lift type" }, { status: 400 });
    }

    const hostTypeEnum = normalizeHostType(String(hostType));
    const hostIdStr = String(hostId);

    // Find-or-create deliberation
    let d = await prisma.deliberation.findFirst({
      where: { hostType: hostTypeEnum, hostId: hostIdStr },
      select: { id: true },
    });
    if (!d) {
      d = await prisma.deliberation.create({
        data: {
          hostType: hostTypeEnum,
          hostId: hostIdStr,
          createdById: String(userId),
        },
        select: { id: true },
      });
    }

    // Fetch comment
    const post = await prisma.feedPost.findUnique({
      where: { id: BigInt(commentId) },
      select: { content: true },
    });
    if (!post) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    const text = (post.content ?? "").trim();
    if (!text) {
      return NextResponse.json({ error: "Cannot lift an empty comment" }, { status: 400 });
    }

    // Create claim
    const claim = await prisma.claim.create({
      data: {
        text: text.slice(0, 4000),
        createdById: String(userId),
        moid: `cm-${commentId}-${Date.now()}`,
        deliberationId: d.id,
      },
      select: { id: true, text: true },
    });

    // Create dialogue move
    const move = await prisma.dialogueMove.create({
      data: {
        deliberationId: d.id,
        targetType: "claim",
        targetId: claim.id,
        kind: "ASSERT",
        payload: { text: claim.text },
        actorId: String(userId),
        signature: `lift:${commentId}:${Date.now()}`,
      },
      select: { id: true },
    });

    // ─────────────────────────────────────────────────────────────
    // NEW: Copy citations from comment to claim
    // ─────────────────────────────────────────────────────────────
    const commentCitations = await prisma.citation.findMany({
      where: {
        targetType: "comment",
        targetId: String(commentId),
      },
      select: {
        sourceId: true,
        locator: true,
        quote: true,
        note: true,
        relevance: true,
        anchorType: true,
        anchorId: true,
        anchorData: true,
        createdById: true,
      },
    });

    const copiedCitations = [];
    for (const citation of commentCitations) {
      const newCitation = await prisma.citation.create({
        data: {
          targetType: "claim",
          targetId: claim.id,
          sourceId: citation.sourceId,
          locator: citation.locator,
          quote: citation.quote,
          note: citation.note,
          relevance: citation.relevance,
          anchorType: citation.anchorType,
          anchorId: citation.anchorId,
          anchorData: citation.anchorData ?? undefined,
          createdById: String(userId), // Lifter becomes creator of new citation
        },
      });
      copiedCitations.push(newCitation);
    }

    // Emit events
    emitBus("deliberations:created", {
      id: d.id,
      deliberationId: d.id,
      hostType: hostTypeEnum,
      hostId: hostIdStr,
      source: "lift",
    });
    emitBus("dialogue:moves:refresh", {
      moveId: move.id,
      deliberationId: d.id,
      kind: "ASSERT",
    });
    
    // NEW: Emit citation event
    if (copiedCitations.length > 0) {
      emitBus("citations:lifted", {
        claimId: claim.id,
        citationCount: copiedCitations.length,
        fromCommentId: commentId,
      });
    }

    return NextResponse.json({
      deliberationId: d.id,
      claimId: claim.id,
      citationsCopied: copiedCitations.length,
    });
  } catch (e) {
    console.error("lift error", e);
    return NextResponse.json({ error: "Lift failed" }, { status: 500 });
  }
}
```

### 2.2.4 Optional: Track Lifted Citation Provenance

If you want to trace lifted citations back to their original:

```prisma
model Citation {
  // ... existing fields ...
  
  // NEW: Provenance tracking for lifted citations
  liftedFromCitationId String?
  liftedFromCitation   Citation?  @relation("CitationLift", fields: [liftedFromCitationId], references: [id], onDelete: SetNull)
  liftedCitations      Citation[] @relation("CitationLift")
}
```

Updated copy logic:

```typescript
const newCitation = await prisma.citation.create({
  data: {
    // ... existing fields ...
    liftedFromCitationId: citation.id, // Track provenance
  },
});
```

### 2.2.5 LiftToDebateButton Update (Optional UI Enhancement)

```tsx
// components/stack/LiftToDebateButton.tsx (enhanced)

"use client";

import { useState } from "react";
import { ArrowUpIcon, CheckIcon, FileTextIcon } from "lucide-react";

interface LiftToDebateButtonProps {
  commentId: string;
  hostType: string;
  hostId: string;
  citationCount?: number; // NEW: Show citation count
}

export default function LiftToDebateButton({
  commentId,
  hostType,
  hostId,
  citationCount = 0,
}: LiftToDebateButtonProps) {
  const [lifting, setLifting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; citationsCopied?: number } | null>(null);

  async function handleLift() {
    setLifting(true);
    setResult(null);

    const res = await fetch("/api/comments/lift", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId, hostType, hostId, as: "claim" }),
    });

    let json: any = null;
    try {
      json = await res.json();
    } catch {}

    if (res.ok && json?.deliberationId) {
      setResult({ success: true, citationsCopied: json.citationsCopied });
      
      // Redirect after brief success message
      setTimeout(() => {
        location.href = `/deliberation/${json.deliberationId}`;
      }, 1500);
    } else {
      setResult({ success: false });
      alert(json?.error || `Lift failed (HTTP ${res.status})`);
    }

    setLifting(false);
  }

  if (result?.success) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <CheckIcon className="h-4 w-4" />
        <span>
          Lifted
          {result.citationsCopied ? ` with ${result.citationsCopied} citation(s)` : ""}
        </span>
      </div>
    );
  }

  return (
    <button
      onClick={handleLift}
      disabled={lifting}
      className="btnv2 btnv2--sm text-xs px-3 py-1.5 ml-2 flex items-center gap-1.5"
    >
      <ArrowUpIcon className="h-3.5 w-3.5" />
      {lifting ? "Lifting..." : "Deliberate"}
      {citationCount > 0 && (
        <span className="flex items-center gap-0.5 text-muted-foreground">
          <FileTextIcon className="h-3 w-3" />
          {citationCount}
        </span>
      )}
    </button>
  );
}
```

### 2.2.6 Acceptance Criteria

| Criterion | Test |
|-----------|------|
| Citations copied on lift | Comment with 3 citations → lift → claim has 3 citations |
| Original citations preserved | After lift, comment still has its citations |
| Anchor data preserved | Citation with anchorType=annotation → copied citation has same anchor |
| Empty comment blocked | Try to lift empty comment → error |
| Response includes count | Lift API returns `citationsCopied: N` |
| Provenance tracked (optional) | Copied citation has `liftedFromCitationId` set |

---

## 2.3 Citation Intent

**Priority**: P1 — Semantic evidence layer  
**Estimated Effort**: 2 days  
**Risk Level**: Low (additive schema + UI)  
**Dependencies**: 2.1 (Citation model updated)

### 2.3.1 Problem Statement

Current citations are semantically neutral — they don't indicate whether the source:
- **Supports** the claim
- **Refutes** the claim
- Provides **context/background**
- **Defines** a term
- Describes **methodology**

Are.na doesn't need this (it's a moodboard). But for deliberation, knowing evidence intent enables:
- Pro/con grouping in UI
- "Evidence balance" metrics
- Prompts for missing counter-evidence

### 2.3.2 Schema Addition

```prisma
model Citation {
  // ... existing fields ...
  
  // NEW: Semantic intent
  intent CitationIntent @default(supports)
}

enum CitationIntent {
  supports      // Evidence in favor of the claim
  refutes       // Evidence against the claim
  context       // Background/contextual information
  defines       // Defines a key term
  method        // Describes methodology
  background    // General background reading
  acknowledges  // Acknowledges opposing view without refuting
  example       // Provides an example/case study
}
```

### 2.3.3 Intent Selector Component

```tsx
// components/citations/IntentSelector.tsx

"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ThumbsUpIcon,
  ThumbsDownIcon,
  InfoIcon,
  BookOpenIcon,
  FlaskConicalIcon,
  BookmarkIcon,
  MessageSquareIcon,
  LightbulbIcon,
} from "lucide-react";

type Intent = 
  | "supports" 
  | "refutes" 
  | "context" 
  | "defines" 
  | "method" 
  | "background" 
  | "acknowledges"
  | "example";

interface IntentSelectorProps {
  value: Intent;
  onChange: (value: Intent) => void;
  compact?: boolean;
}

const intentOptions: {
  value: Intent;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}[] = [
  {
    value: "supports",
    label: "Supports claim",
    shortLabel: "Supports",
    icon: ThumbsUpIcon,
    color: "text-green-600",
  },
  {
    value: "refutes",
    label: "Refutes claim",
    shortLabel: "Refutes",
    icon: ThumbsDownIcon,
    color: "text-red-600",
  },
  {
    value: "context",
    label: "Provides context",
    shortLabel: "Context",
    icon: InfoIcon,
    color: "text-blue-600",
  },
  {
    value: "defines",
    label: "Defines term",
    shortLabel: "Defines",
    icon: BookOpenIcon,
    color: "text-purple-600",
  },
  {
    value: "method",
    label: "Methodology",
    shortLabel: "Method",
    icon: FlaskConicalIcon,
    color: "text-amber-600",
  },
  {
    value: "background",
    label: "Background reading",
    shortLabel: "Background",
    icon: BookmarkIcon,
    color: "text-gray-600",
  },
  {
    value: "acknowledges",
    label: "Acknowledges counterpoint",
    shortLabel: "Acknowledges",
    icon: MessageSquareIcon,
    color: "text-orange-600",
  },
  {
    value: "example",
    label: "Example / case study",
    shortLabel: "Example",
    icon: LightbulbIcon,
    color: "text-teal-600",
  },
];

export function IntentSelector({ value, onChange, compact }: IntentSelectorProps) {
  const selected = intentOptions.find((o) => o.value === value);

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={compact ? "w-32" : "w-48"}>
        <SelectValue>
          <div className="flex items-center gap-2">
            {selected && (
              <>
                <selected.icon className={`h-4 w-4 ${selected.color}`} />
                <span>{compact ? selected.shortLabel : selected.label}</span>
              </>
            )}
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {intentOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <div className="flex items-center gap-2">
              <option.icon className={`h-4 w-4 ${option.color}`} />
              <span>{option.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Badge version for display
export function IntentBadge({ intent }: { intent: Intent }) {
  const option = intentOptions.find((o) => o.value === intent);
  if (!option) return null;

  return (
    <span className={`inline-flex items-center gap-1 text-xs ${option.color}`}>
      <option.icon className="h-3 w-3" />
      {option.shortLabel}
    </span>
  );
}
```

### 2.3.4 Evidence Balance Computation

```typescript
// lib/citations/evidenceBalance.ts

import { prisma } from "@/lib/prismaclient";

export interface EvidenceBalance {
  supports: number;
  refutes: number;
  context: number;
  other: number;
  total: number;
  balance: "pro" | "con" | "balanced" | "neutral";
  ratio: number; // supports / (supports + refutes), NaN if both 0
}

export async function computeEvidenceBalance(
  targetType: string,
  targetId: string
): Promise<EvidenceBalance> {
  const citations = await prisma.citation.groupBy({
    by: ["intent"],
    where: { targetType, targetId },
    _count: { id: true },
  });

  const counts: Record<string, number> = {};
  let total = 0;
  for (const row of citations) {
    counts[row.intent] = row._count.id;
    total += row._count.id;
  }

  const supports = counts.supports || 0;
  const refutes = counts.refutes || 0;
  const context = (counts.context || 0) + (counts.background || 0) + (counts.defines || 0);
  const other = total - supports - refutes - context;

  let balance: EvidenceBalance["balance"];
  if (supports === 0 && refutes === 0) {
    balance = "neutral";
  } else if (supports > refutes * 2) {
    balance = "pro";
  } else if (refutes > supports * 2) {
    balance = "con";
  } else {
    balance = "balanced";
  }

  const ratio = supports + refutes > 0 ? supports / (supports + refutes) : NaN;

  return { supports, refutes, context, other, total, balance, ratio };
}
```

### 2.3.5 Grouped Citation List

```tsx
// components/citations/GroupedCitationList.tsx

"use client";

import { useMemo } from "react";
import { CitationCard } from "./CitationCard";
import { IntentBadge } from "./IntentSelector";
import { ThumbsUpIcon, ThumbsDownIcon, InfoIcon } from "lucide-react";

interface GroupedCitationListProps {
  citations: CitationWithSource[];
  showGroups?: boolean;
}

export function GroupedCitationList({ 
  citations, 
  showGroups = true 
}: GroupedCitationListProps) {
  const grouped = useMemo(() => {
    if (!showGroups) return { all: citations };

    const groups: Record<string, CitationWithSource[]> = {
      supports: [],
      refutes: [],
      context: [],
    };

    for (const citation of citations) {
      const intent = citation.intent || "supports";
      if (intent === "supports") {
        groups.supports.push(citation);
      } else if (intent === "refutes") {
        groups.refutes.push(citation);
      } else {
        groups.context.push(citation);
      }
    }

    return groups;
  }, [citations, showGroups]);

  if (!showGroups) {
    return (
      <div className="space-y-2">
        {citations.map((c) => (
          <CitationCard key={c.id} citation={c} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Supporting Evidence */}
      {grouped.supports.length > 0 && (
        <div>
          <h4 className="flex items-center gap-2 text-sm font-medium text-green-700 mb-2">
            <ThumbsUpIcon className="h-4 w-4" />
            Supporting Evidence ({grouped.supports.length})
          </h4>
          <div className="space-y-2">
            {grouped.supports.map((c) => (
              <CitationCard key={c.id} citation={c} />
            ))}
          </div>
        </div>
      )}

      {/* Refuting Evidence */}
      {grouped.refutes.length > 0 && (
        <div>
          <h4 className="flex items-center gap-2 text-sm font-medium text-red-700 mb-2">
            <ThumbsDownIcon className="h-4 w-4" />
            Counter-Evidence ({grouped.refutes.length})
          </h4>
          <div className="space-y-2">
            {grouped.refutes.map((c) => (
              <CitationCard key={c.id} citation={c} />
            ))}
          </div>
        </div>
      )}

      {/* Context/Other */}
      {grouped.context.length > 0 && (
        <div>
          <h4 className="flex items-center gap-2 text-sm font-medium text-blue-700 mb-2">
            <InfoIcon className="h-4 w-4" />
            Context & Background ({grouped.context.length})
          </h4>
          <div className="space-y-2">
            {grouped.context.map((c) => (
              <CitationCard key={c.id} citation={c} />
            ))}
          </div>
        </div>
      )}

      {/* Missing evidence prompt */}
      {grouped.supports.length > 0 && grouped.refutes.length === 0 && (
        <div className="p-3 rounded-lg border border-dashed border-amber-300 bg-amber-50 dark:bg-amber-950/20">
          <p className="text-sm text-amber-700 dark:text-amber-400">
            ⚠️ No counter-evidence cited. Consider adding sources that challenge this claim for epistemic balance.
          </p>
        </div>
      )}
    </div>
  );
}
```

### 2.3.6 Acceptance Criteria

| Criterion | Test |
|-----------|------|
| Intent field in schema | Citation can have intent set |
| Default is supports | New citation without intent → supports |
| Intent selector works | Change intent in UI → saved correctly |
| Grouped display | Claim with mixed intents → shows Pro/Con/Context groups |
| Balance computed | 3 supports, 1 refutes → ratio = 0.75 |
| Missing evidence prompt | Only supports → shows "no counter-evidence" warning |

---

## 2.4 Evidence List Upgrades

**Priority**: P1 — UX polish for evidence management  
**Estimated Effort**: 3-4 days  
**Risk Level**: Low (UI components + API filtering)  
**Dependencies**: 2.1 (Citation anchors), 2.3 (Citation intent)

### 2.4.1 Problem Statement

Current evidence/citation lists are flat and unsorted:
- No filtering by intent, source type, or relevance
- No sorting (chronological only)
- No search within citations
- No bulk operations (delete multiple, change intent)
- No "evidence map" visualization

**Goal**: Rich evidence list with filtering, sorting, search, and optional visualization.

### 2.4.2 Evidence List API

```typescript
// app/api/citations/list/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { getCurrentUserId } from "@/lib/serverutils";
import { Prisma } from "@prisma/client";

interface CitationListParams {
  targetType: string;
  targetId: string;
  intent?: string | string[];
  sourceKind?: string | string[];
  minRelevance?: number;
  search?: string;
  sortBy?: "createdAt" | "relevance" | "source" | "intent";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  
  const targetType = searchParams.get("targetType");
  const targetId = searchParams.get("targetId");
  
  if (!targetType || !targetId) {
    return NextResponse.json(
      { error: "targetType and targetId required" },
      { status: 400 }
    );
  }

  // Parse filters
  const intentParam = searchParams.get("intent");
  const intents = intentParam ? intentParam.split(",") : undefined;
  
  const sourceKindParam = searchParams.get("sourceKind");
  const sourceKinds = sourceKindParam ? sourceKindParam.split(",") : undefined;
  
  const minRelevance = searchParams.get("minRelevance")
    ? parseInt(searchParams.get("minRelevance")!, 10)
    : undefined;
  
  const search = searchParams.get("search") || undefined;
  
  const sortBy = (searchParams.get("sortBy") as CitationListParams["sortBy"]) || "createdAt";
  const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "desc";
  
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
  const skip = (page - 1) * limit;

  // Build where clause
  const where: Prisma.CitationWhereInput = {
    targetType,
    targetId,
  };

  if (intents && intents.length > 0) {
    where.intent = { in: intents as any };
  }

  if (minRelevance) {
    where.relevance = { gte: minRelevance };
  }

  if (search) {
    where.OR = [
      { quote: { contains: search, mode: "insensitive" } },
      { note: { contains: search, mode: "insensitive" } },
      { locator: { contains: search, mode: "insensitive" } },
      { source: { title: { contains: search, mode: "insensitive" } } },
      { source: { authorsJson: { string_contains: search } } },
    ];
  }

  if (sourceKinds && sourceKinds.length > 0) {
    where.source = {
      ...((where.source as object) || {}),
      kind: { in: sourceKinds },
    };
  }

  // Build orderBy
  let orderBy: Prisma.CitationOrderByWithRelationInput;
  switch (sortBy) {
    case "relevance":
      orderBy = { relevance: sortOrder };
      break;
    case "source":
      orderBy = { source: { title: sortOrder } };
      break;
    case "intent":
      orderBy = { intent: sortOrder };
      break;
    case "createdAt":
    default:
      orderBy = { createdAt: sortOrder };
  }

  // Execute query
  const [citations, total] = await Promise.all([
    prisma.citation.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        source: {
          select: {
            id: true,
            kind: true,
            title: true,
            authorsJson: true,
            year: true,
            url: true,
            doi: true,
            libraryPostId: true,
          },
        },
        annotation: {
          select: {
            id: true,
            page: true,
            rect: true,
            text: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    }),
    prisma.citation.count({ where }),
  ]);

  // Compute facets for filter UI
  const facets = await prisma.citation.groupBy({
    by: ["intent"],
    where: { targetType, targetId },
    _count: { id: true },
  });

  const intentFacets = facets.reduce(
    (acc, f) => {
      acc[f.intent] = f._count.id;
      return acc;
    },
    {} as Record<string, number>
  );

  return NextResponse.json({
    citations,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    facets: {
      intent: intentFacets,
    },
  });
}
```

### 2.4.3 Evidence List Filter Bar

```tsx
// components/citations/EvidenceFilterBar.tsx

"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  SearchIcon,
  FilterIcon,
  SortAscIcon,
  SortDescIcon,
  XIcon,
} from "lucide-react";

interface EvidenceFilters {
  intents: string[];
  sourceKinds: string[];
  minRelevance: number | null;
  search: string;
  sortBy: "createdAt" | "relevance" | "source" | "intent";
  sortOrder: "asc" | "desc";
}

interface EvidenceFilterBarProps {
  filters: EvidenceFilters;
  onChange: (filters: EvidenceFilters) => void;
  facets?: {
    intent: Record<string, number>;
  };
}

const intentOptions = [
  { value: "supports", label: "Supports", color: "bg-green-100 text-green-800" },
  { value: "refutes", label: "Refutes", color: "bg-red-100 text-red-800" },
  { value: "context", label: "Context", color: "bg-blue-100 text-blue-800" },
  { value: "defines", label: "Defines", color: "bg-purple-100 text-purple-800" },
  { value: "method", label: "Method", color: "bg-amber-100 text-amber-800" },
  { value: "background", label: "Background", color: "bg-gray-100 text-gray-800" },
];

const sourceKindOptions = [
  { value: "article", label: "Article" },
  { value: "book", label: "Book" },
  { value: "website", label: "Website" },
  { value: "video", label: "Video" },
  { value: "paper", label: "Paper" },
];

const sortOptions = [
  { value: "createdAt", label: "Date Added" },
  { value: "relevance", label: "Relevance" },
  { value: "source", label: "Source Title" },
  { value: "intent", label: "Intent" },
];

export function EvidenceFilterBar({
  filters,
  onChange,
  facets,
}: EvidenceFilterBarProps) {
  const [searchInput, setSearchInput] = useState(filters.search);

  const toggleIntent = (intent: string) => {
    const newIntents = filters.intents.includes(intent)
      ? filters.intents.filter((i) => i !== intent)
      : [...filters.intents, intent];
    onChange({ ...filters, intents: newIntents });
  };

  const handleSearch = () => {
    onChange({ ...filters, search: searchInput });
  };

  const clearFilters = () => {
    setSearchInput("");
    onChange({
      intents: [],
      sourceKinds: [],
      minRelevance: null,
      search: "",
      sortBy: "createdAt",
      sortOrder: "desc",
    });
  };

  const hasActiveFilters =
    filters.intents.length > 0 ||
    filters.sourceKinds.length > 0 ||
    filters.minRelevance ||
    filters.search;

  return (
    <div className="space-y-3 p-3 bg-muted/30 rounded-lg border">
      {/* Search row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search citations..."
            className="pl-9"
          />
        </div>
        <Button onClick={handleSearch} variant="secondary" size="sm">
          Search
        </Button>
      </div>

      {/* Intent filter chips */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-muted-foreground self-center mr-1">
          <FilterIcon className="h-3 w-3 inline mr-1" />
          Intent:
        </span>
        {intentOptions.map((intent) => {
          const count = facets?.intent?.[intent.value] || 0;
          const isActive = filters.intents.includes(intent.value);
          return (
            <button
              key={intent.value}
              onClick={() => toggleIntent(intent.value)}
              className={`
                px-2 py-1 rounded-full text-xs font-medium transition-all
                ${isActive ? intent.color + " ring-2 ring-offset-1 ring-primary" : "bg-muted text-muted-foreground hover:bg-muted/80"}
              `}
            >
              {intent.label}
              {count > 0 && (
                <span className="ml-1 opacity-70">({count})</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Sort and additional filters */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Sort:</span>
          <Select
            value={filters.sortBy}
            onValueChange={(v) =>
              onChange({ ...filters, sortBy: v as EvidenceFilters["sortBy"] })
            }
          >
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() =>
              onChange({
                ...filters,
                sortOrder: filters.sortOrder === "asc" ? "desc" : "asc",
              })
            }
          >
            {filters.sortOrder === "asc" ? (
              <SortAscIcon className="h-4 w-4" />
            ) : (
              <SortDescIcon className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Min relevance:</span>
          <Select
            value={filters.minRelevance?.toString() || "any"}
            onValueChange={(v) =>
              onChange({
                ...filters,
                minRelevance: v === "any" ? null : parseInt(v, 10),
              })
            }
          >
            <SelectTrigger className="w-20 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="3">3+</SelectItem>
              <SelectItem value="4">4+</SelectItem>
              <SelectItem value="5">5</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-8 text-xs text-muted-foreground"
          >
            <XIcon className="h-3 w-3 mr-1" />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
```

### 2.4.4 Full Evidence Panel Component

```tsx
// components/citations/EvidencePanel.tsx

"use client";

import { useState, useEffect, useCallback } from "react";
import { EvidenceFilterBar } from "./EvidenceFilterBar";
import { GroupedCitationList } from "./GroupedCitationList";
import { CitationCard } from "./CitationCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PlusIcon,
  LayoutGridIcon,
  ListIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import { CreateCitationModal } from "./CreateCitationModal";

interface EvidencePanelProps {
  targetType: string;
  targetId: string;
  canEdit?: boolean;
}

interface EvidenceFilters {
  intents: string[];
  sourceKinds: string[];
  minRelevance: number | null;
  search: string;
  sortBy: "createdAt" | "relevance" | "source" | "intent";
  sortOrder: "asc" | "desc";
}

export function EvidencePanel({
  targetType,
  targetId,
  canEdit = false,
}: EvidencePanelProps) {
  const [citations, setCitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [facets, setFacets] = useState<{ intent: Record<string, number> }>({
    intent: {},
  });
  const [filters, setFilters] = useState<EvidenceFilters>({
    intents: [],
    sourceKinds: [],
    minRelevance: null,
    search: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [viewMode, setViewMode] = useState<"list" | "grouped">("grouped");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchCitations = useCallback(async () => {
    setLoading(true);

    const params = new URLSearchParams({
      targetType,
      targetId,
      page: String(pagination.page),
      limit: String(pagination.limit),
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    });

    if (filters.intents.length > 0) {
      params.set("intent", filters.intents.join(","));
    }
    if (filters.sourceKinds.length > 0) {
      params.set("sourceKind", filters.sourceKinds.join(","));
    }
    if (filters.minRelevance) {
      params.set("minRelevance", String(filters.minRelevance));
    }
    if (filters.search) {
      params.set("search", filters.search);
    }

    const res = await fetch(`/api/citations/list?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setCitations(data.citations);
      setPagination(data.pagination);
      setFacets(data.facets);
    }

    setLoading(false);
  }, [targetType, targetId, filters, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchCitations();
  }, [fetchCitations]);

  const handleFilterChange = (newFilters: EvidenceFilters) => {
    setFilters(newFilters);
    setPagination((p) => ({ ...p, page: 1 })); // Reset to page 1 on filter change
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">
          Evidence
          {pagination.total > 0 && (
            <span className="text-muted-foreground font-normal ml-2">
              ({pagination.total})
            </span>
          )}
        </h3>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === "grouped" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 px-2 rounded-r-none"
              onClick={() => setViewMode("grouped")}
            >
              <LayoutGridIcon className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 px-2 rounded-l-none"
              onClick={() => setViewMode("list")}
            >
              <ListIcon className="h-4 w-4" />
            </Button>
          </div>

          {canEdit && (
            <Button size="sm" onClick={() => setShowCreateModal(true)}>
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Citation
            </Button>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <EvidenceFilterBar
        filters={filters}
        onChange={handleFilterChange}
        facets={facets}
      />

      {/* Citation list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : citations.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No citations found.</p>
          {filters.search || filters.intents.length > 0 ? (
            <p className="text-sm mt-1">Try adjusting your filters.</p>
          ) : canEdit ? (
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setShowCreateModal(true)}
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add your first citation
            </Button>
          ) : null}
        </div>
      ) : viewMode === "grouped" ? (
        <GroupedCitationList citations={citations} showGroups={true} />
      ) : (
        <div className="space-y-2">
          {citations.map((c) => (
            <CitationCard key={c.id} citation={c} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page === 1}
            onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page === pagination.totalPages}
            onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
          >
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Create modal */}
      <CreateCitationModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        targetType={targetType}
        targetId={targetId}
        onCreated={() => {
          setShowCreateModal(false);
          fetchCitations();
        }}
      />
    </div>
  );
}
```

### 2.4.5 Bulk Operations API

```typescript
// app/api/citations/bulk/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { getCurrentUserId } from "@/lib/serverutils";

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { action, citationIds, data } = await req.json();

  if (!action || !citationIds || !Array.isArray(citationIds) || citationIds.length === 0) {
    return NextResponse.json(
      { error: "action and citationIds[] required" },
      { status: 400 }
    );
  }

  // Verify ownership of all citations
  const citations = await prisma.citation.findMany({
    where: { id: { in: citationIds } },
    select: { id: true, createdById: true },
  });

  const ownedIds = citations
    .filter((c) => c.createdById === userId)
    .map((c) => c.id);

  if (ownedIds.length !== citationIds.length) {
    return NextResponse.json(
      { error: "You can only modify your own citations" },
      { status: 403 }
    );
  }

  switch (action) {
    case "delete": {
      await prisma.citation.deleteMany({
        where: { id: { in: ownedIds } },
      });
      return NextResponse.json({ deleted: ownedIds.length });
    }

    case "updateIntent": {
      if (!data?.intent) {
        return NextResponse.json({ error: "data.intent required" }, { status: 400 });
      }
      await prisma.citation.updateMany({
        where: { id: { in: ownedIds } },
        data: { intent: data.intent },
      });
      return NextResponse.json({ updated: ownedIds.length, intent: data.intent });
    }

    case "updateRelevance": {
      if (typeof data?.relevance !== "number") {
        return NextResponse.json({ error: "data.relevance required" }, { status: 400 });
      }
      await prisma.citation.updateMany({
        where: { id: { in: ownedIds } },
        data: { relevance: data.relevance },
      });
      return NextResponse.json({ updated: ownedIds.length, relevance: data.relevance });
    }

    default:
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  }
}
```

### 2.4.6 Bulk Selection UI Hook

```tsx
// hooks/useBulkSelection.ts

import { useState, useCallback } from "react";

export function useBulkSelection<T extends { id: string }>(items: T[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(items.map((i) => i.id)));
  }, [items]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds]
  );

  const selectedItems = items.filter((i) => selectedIds.has(i.id));

  return {
    selectedIds,
    selectedItems,
    selectedCount: selectedIds.size,
    toggle,
    selectAll,
    deselectAll,
    isSelected,
    hasSelection: selectedIds.size > 0,
    allSelected: selectedIds.size === items.length && items.length > 0,
  };
}
```

### 2.4.7 Bulk Actions Toolbar

```tsx
// components/citations/BulkActionsToolbar.tsx

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Trash2Icon, TagIcon, StarIcon, ChevronDownIcon, XIcon } from "lucide-react";
import { IntentSelector } from "./IntentSelector";

interface BulkActionsToolbarProps {
  selectedCount: number;
  onDelete: () => Promise<void>;
  onChangeIntent: (intent: string) => Promise<void>;
  onChangeRelevance: (relevance: number) => Promise<void>;
  onCancel: () => void;
}

export function BulkActionsToolbar({
  selectedCount,
  onDelete,
  onChangeIntent,
  onChangeRelevance,
  onCancel,
}: BulkActionsToolbarProps) {
  const [loading, setLoading] = useState(false);

  const handleAction = async (action: () => Promise<void>) => {
    setLoading(true);
    try {
      await action();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
      <span className="text-sm font-medium">
        {selectedCount} selected
      </span>

      <div className="flex-1" />

      {/* Change Intent */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={loading}>
            <TagIcon className="h-4 w-4 mr-1" />
            Set Intent
            <ChevronDownIcon className="h-4 w-4 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {["supports", "refutes", "context", "defines", "method", "background"].map(
            (intent) => (
              <DropdownMenuItem
                key={intent}
                onClick={() => handleAction(() => onChangeIntent(intent))}
              >
                {intent.charAt(0).toUpperCase() + intent.slice(1)}
              </DropdownMenuItem>
            )
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Change Relevance */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={loading}>
            <StarIcon className="h-4 w-4 mr-1" />
            Set Relevance
            <ChevronDownIcon className="h-4 w-4 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {[5, 4, 3, 2, 1].map((r) => (
            <DropdownMenuItem
              key={r}
              onClick={() => handleAction(() => onChangeRelevance(r))}
            >
              {"★".repeat(r)}{"☆".repeat(5 - r)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete */}
      <Button
        variant="destructive"
        size="sm"
        disabled={loading}
        onClick={() => handleAction(onDelete)}
      >
        <Trash2Icon className="h-4 w-4 mr-1" />
        Delete
      </Button>

      {/* Cancel */}
      <Button variant="ghost" size="sm" onClick={onCancel}>
        <XIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}
```

### 2.4.8 Acceptance Criteria

| Criterion | Test |
|-----------|------|
| Filter by intent | Select "supports" filter → only supporting citations shown |
| Filter by relevance | Set min relevance 4 → only 4-5 star citations shown |
| Search works | Search "Smith" → finds citations with Smith in source/quote |
| Sort by relevance | Sort by relevance desc → highest rated first |
| Pagination works | 50+ citations → page navigation appears and works |
| Facet counts shown | Filter chips show count per intent type |
| View mode toggle | Switch between grouped and flat list views |
| Bulk delete | Select 3 citations → delete → all removed |
| Bulk intent change | Select 5 citations → set intent "refutes" → all updated |

---

## Phase 2 Completion Checklist

### Pre-Launch Requirements

| Item | Owner | Status |
|------|-------|--------|
| 2.1 Citation anchor schema migration | Backend | ☐ |
| 2.1 Annotation ↔ Citation relation added | Backend | ☐ |
| 2.1 PDF selection cite flow | Frontend | ☐ |
| 2.1 Citation click navigation | Frontend | ☐ |
| 2.1 PDF highlight on navigation | Frontend | ☐ |
| 2.2 Lift route copies citations | Backend | ☐ |
| 2.2 Lift provenance tracking (optional) | Backend | ☐ |
| 2.2 Lift button shows citation count | Frontend | ☐ |
| 2.3 Citation intent enum added | Backend | ☐ |
| 2.3 Intent selector component | Frontend | ☐ |
| 2.3 Grouped citation list | Frontend | ☐ |
| 2.3 Evidence balance computation | Backend | ☐ |
| 2.3 Missing evidence prompt | Frontend | ☐ |
| 2.4 Evidence list API with filters | Backend | ☐ |
| 2.4 Filter bar component | Frontend | ☐ |
| 2.4 Full evidence panel | Frontend | ☐ |
| 2.4 Bulk operations API | Backend | ☐ |
| 2.4 Bulk selection UI | Frontend | ☐ |

### Testing Requirements

| Test Type | Coverage |
|-----------|----------|
| Unit tests | Citation anchor serialization/deserialization |
| Unit tests | Evidence balance computation edge cases |
| Unit tests | Lift citation copy logic |
| Integration tests | PDF cite → create citation → navigate back |
| Integration tests | Lift comment with citations → verify claim has citations |
| Integration tests | Bulk operations → verify batch update/delete |
| E2E tests | Full evidence workflow from PDF selection to deliberation |

### Migration Checklist

| Step | SQL/Prisma | Notes |
|------|------------|-------|
| 1 | Add `anchorType`, `anchorId`, `anchorData` to Citation | Nullable, no breaking change |
| 2 | Add `intent` to Citation with default `supports` | Nullable first, then backfill |
| 3 | Add Citation → Annotation relation | Optional relation |
| 4 | Add `liftedFromCitationId` (optional) | For provenance tracking |
| 5 | Run backfill: set existing citations to intent=supports | Safe default |
| 6 | Create indexes on new filter fields | `intent`, `anchorType` |

### Performance Considerations

| Concern | Mitigation |
|---------|-----------|
| Evidence list queries | Index on (targetType, targetId, intent) |
| Facet computation | Cache facet counts, refresh on citation change |
| PDF highlight loading | Lazy-load annotation data on navigation |
| Bulk operations | Batch in chunks of 100 |

### Rollback Plan

1. **Schema rollback**: All new fields are nullable; can remove without data loss
2. **Lift fallback**: Old lift behavior (no citation copy) is safe fallback
3. **UI fallback**: Intent selector → hide behind feature flag
4. **Filter fallback**: Remove filter bar, show simple list

---

**Estimated Phase 2 Duration**: 3-4 weeks

---

# APPENDICES

## Appendix A: Complete Prisma Schema Additions

This appendix consolidates all schema changes from Phases 1 and 2 into a single reference.

### A.1 New Models

```prisma
// ─────────────────────────────────────────────────────────────
// PHASE 1.1: StackItem Join Table
// ─────────────────────────────────────────────────────────────

model StackItem {
  id            String   @id @default(cuid())
  stackId       String
  
  // Polymorphic block reference
  blockType     StackBlockType
  blockId       String   // LibraryPost.id, Link.id, Text.id, or Stack.id
  
  // Ordering
  position      Int
  
  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  addedById     String
  
  // Relations
  stack         Stack    @relation(fields: [stackId], references: [id], onDelete: Cascade)
  addedBy       Profile  @relation(fields: [addedById], references: [id])
  
  // Ensure unique position per stack and unique block per stack
  @@unique([stackId, blockType, blockId])
  @@index([stackId, position])
  @@index([blockId, blockType])
}

enum StackBlockType {
  post       // LibraryPost (PDF, image, etc.)
  link       // External URL
  text       // Text/markdown block
  stack      // Embedded stack
}

// ─────────────────────────────────────────────────────────────
// PHASE 1.2: Link Block
// ─────────────────────────────────────────────────────────────

model LinkBlock {
  id            String    @id @default(cuid())
  url           String
  
  // Metadata (populated by background job)
  title         String?
  description   String?
  imageUrl      String?
  siteName      String?
  favicon       String?
  
  // Processing status
  status        LinkBlockStatus @default(pending)
  lastFetchedAt DateTime?
  fetchError    String?
  
  // Timestamps
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  createdById   String
  
  // Relations
  createdBy     Profile   @relation(fields: [createdById], references: [id])
  
  @@index([url])
  @@index([createdById])
}

enum LinkBlockStatus {
  pending
  processing
  completed
  failed
}

// ─────────────────────────────────────────────────────────────
// PHASE 1.2: Text Block
// ─────────────────────────────────────────────────────────────

model TextBlock {
  id          String   @id @default(cuid())
  content     String   // Markdown or plain text
  format      TextBlockFormat @default(markdown)
  
  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdById String
  
  // Relations
  createdBy   Profile  @relation(fields: [createdById], references: [id])
  
  @@index([createdById])
}

enum TextBlockFormat {
  markdown
  plain
}
```

### A.2 Modified Models

```prisma
// ─────────────────────────────────────────────────────────────
// Stack Model Updates
// ─────────────────────────────────────────────────────────────

model Stack {
  // ... existing fields ...
  
  // PHASE 1.1: Replace String[] order with StackItem relation
  // DEPRECATED: order String[] — remove after migration
  items         StackItem[]
  
  // PHASE 1.4: Stack embeds (stacks that embed this stack)
  embeddedIn    StackItem[] @relation("EmbeddedStack")
  
  // PHASE 1.5: Visibility modes
  visibility    StackVisibility @default(private)
}

enum StackVisibility {
  private      // Only owner can view
  unlisted     // Anyone with link can view, not in search/discovery
  public       // Fully public, appears in search/discovery
  collaborative // Multiple editors
}

// ─────────────────────────────────────────────────────────────
// Citation Model Updates (Phase 2)
// ─────────────────────────────────────────────────────────────

model Citation {
  // ... existing fields ...
  
  // PHASE 2.1: Anchor fields for executable references
  anchorType          CitationAnchorType?
  anchorId            String?
  anchorData          Json?
  
  // PHASE 2.2: Lift provenance (optional)
  liftedFromCitationId String?
  liftedFromCitation   Citation?  @relation("CitationLift", fields: [liftedFromCitationId], references: [id], onDelete: SetNull)
  liftedCitations      Citation[] @relation("CitationLift")
  
  // PHASE 2.3: Semantic intent
  intent              CitationIntent @default(supports)
  
  // Relation to Annotation (for PDF anchors)
  annotation          Annotation? @relation(fields: [anchorId], references: [id], onDelete: SetNull)
  
  @@index([intent])
  @@index([anchorType])
}

enum CitationAnchorType {
  annotation     // PDF highlight → links to Annotation record
  text_range     // Web capture text selection
  timestamp      // Video/audio timestamp
  page           // Page-level reference
  coordinates    // Image region
}

enum CitationIntent {
  supports
  refutes
  context
  defines
  method
  background
  acknowledges
  example
}

// ─────────────────────────────────────────────────────────────
// Annotation Model Updates (Phase 2.1)
// ─────────────────────────────────────────────────────────────

model Annotation {
  // ... existing fields ...
  
  // PHASE 2.1: Citations that reference this annotation
  citations     Citation[]
}
```

### A.3 Full Schema Diff Summary

| Model | Field/Relation | Type | Phase | Notes |
|-------|---------------|------|-------|-------|
| StackItem | (new model) | Model | 1.1 | Join table for polymorphic blocks |
| LinkBlock | (new model) | Model | 1.2 | External URL with metadata |
| TextBlock | (new model) | Model | 1.2 | Markdown/plain text block |
| StackBlockType | (new enum) | Enum | 1.1 | post, link, text, stack |
| LinkBlockStatus | (new enum) | Enum | 1.2 | pending, processing, completed, failed |
| TextBlockFormat | (new enum) | Enum | 1.2 | markdown, plain |
| StackVisibility | (new enum) | Enum | 1.5 | private, unlisted, public, collaborative |
| CitationAnchorType | (new enum) | Enum | 2.1 | annotation, text_range, timestamp, page, coordinates |
| CitationIntent | (new enum) | Enum | 2.3 | supports, refutes, context, defines, method, background, acknowledges, example |
| Stack.items | StackItem[] | Relation | 1.1 | Replace String[] order |
| Stack.visibility | StackVisibility | Field | 1.5 | Default: private |
| Citation.anchorType | CitationAnchorType? | Field | 2.1 | Nullable |
| Citation.anchorId | String? | Field | 2.1 | Nullable |
| Citation.anchorData | Json? | Field | 2.1 | Nullable |
| Citation.intent | CitationIntent | Field | 2.3 | Default: supports |
| Citation.liftedFromCitationId | String? | Field | 2.2 | Optional provenance |
| Annotation.citations | Citation[] | Relation | 2.1 | Inverse relation |

---

## Appendix B: API Endpoint Reference

### B.1 Phase 1 Endpoints

#### Stack Items (1.1)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/stacks/[stackId]/items` | Add block to stack | Required |
| DELETE | `/api/stacks/[stackId]/items/[itemId]` | Remove block from stack | Required |
| PUT | `/api/stacks/[stackId]/items/reorder` | Reorder items | Required |
| GET | `/api/blocks/[blockType]/[blockId]/contexts` | Get all stacks containing block | Required |

##### POST `/api/stacks/[stackId]/items`

**Request Body:**
```json
{
  "blockType": "post" | "link" | "text" | "stack",
  "blockId": "string",
  "position": "number (optional, defaults to end)"
}
```

**Response:**
```json
{
  "item": {
    "id": "string",
    "stackId": "string",
    "blockType": "string",
    "blockId": "string",
    "position": "number",
    "createdAt": "ISO date"
  }
}
```

##### PUT `/api/stacks/[stackId]/items/reorder`

**Request Body:**
```json
{
  "orderedItemIds": ["itemId1", "itemId2", "itemId3"]
}
```

**Response:**
```json
{
  "success": true,
  "itemCount": 3
}
```

#### Link Blocks (1.2)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/blocks/link` | Create link block | Required |
| GET | `/api/blocks/link/[id]` | Get link block | Required |

##### POST `/api/blocks/link`

**Request Body:**
```json
{
  "url": "https://example.com/article",
  "stackId": "optional - auto-add to stack"
}
```

**Response:**
```json
{
  "link": {
    "id": "string",
    "url": "string",
    "status": "pending",
    "createdAt": "ISO date"
  },
  "stackItem": { /* if stackId provided */ }
}
```

#### Text Blocks (1.2)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/blocks/text` | Create text block | Required |
| PUT | `/api/blocks/text/[id]` | Update text block | Required |
| GET | `/api/blocks/text/[id]` | Get text block | Required |

#### Visibility (1.5)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| PUT | `/api/stacks/[stackId]/visibility` | Update visibility | Required |

**Request Body:**
```json
{
  "visibility": "private" | "unlisted" | "public" | "collaborative"
}
```

#### Export (1.6)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/stacks/[stackId]/export` | Export stack | Optional* |

*Depends on stack visibility

**Query Parameters:**
- `format`: `json` | `bibtex` | `markdown` | `ris`
- `includeMetadata`: `true` | `false`
- `includeNested`: `true` | `false`

### B.2 Phase 2 Endpoints

#### Citations (2.1, 2.3, 2.4)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/citations` | Create citation with anchor | Required |
| GET | `/api/citations/list` | List citations with filters | Required |
| POST | `/api/citations/bulk` | Bulk operations | Required |

##### POST `/api/citations`

**Request Body:**
```json
{
  "targetType": "claim" | "argument" | "comment",
  "targetId": "string",
  "sourceId": "string",
  "locator": "p. 13 (optional)",
  "quote": "excerpt (optional)",
  "note": "why relevant (optional)",
  "relevance": "1-5 (optional)",
  "intent": "supports" | "refutes" | "context" | ... (optional)",
  "anchorType": "annotation" | "timestamp" | ... (optional)",
  "anchorId": "annotation ID (optional)",
  "anchorData": "JSON (optional)"
}
```

##### GET `/api/citations/list`

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| targetType | string | Required |
| targetId | string | Required |
| intent | string | Comma-separated intents |
| sourceKind | string | Comma-separated source kinds |
| minRelevance | number | Minimum relevance score |
| search | string | Search in quote/note/source |
| sortBy | string | createdAt, relevance, source, intent |
| sortOrder | string | asc, desc |
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 50, max: 100) |

**Response:**
```json
{
  "citations": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 127,
    "totalPages": 3
  },
  "facets": {
    "intent": {
      "supports": 45,
      "refutes": 12,
      "context": 70
    }
  }
}
```

##### POST `/api/citations/bulk`

**Request Body:**
```json
{
  "action": "delete" | "updateIntent" | "updateRelevance",
  "citationIds": ["id1", "id2", "id3"],
  "data": {
    "intent": "refutes",     // for updateIntent
    "relevance": 5           // for updateRelevance
  }
}
```

#### Lift (2.2)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/comments/lift` | Lift comment to claim | Required |

**Request Body (unchanged, enhanced response):**
```json
{
  "commentId": "string",
  "hostType": "stack",
  "hostId": "string",
  "as": "claim"
}
```

**Response (enhanced):**
```json
{
  "deliberationId": "string",
  "claimId": "string",
  "citationsCopied": 3
}
```

#### Annotations (2.1)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/annotations` | Create annotation | Required |
| GET | `/api/annotations/[id]` | Get annotation | Required |

---

## Appendix C: Component Index

### C.1 Phase 1 Components

| Component | Path | Description |
|-----------|------|-------------|
| `StackItemCard` | `components/stack/StackItemCard.tsx` | Polymorphic block card renderer |
| `PostBlockCard` | `components/stack/cards/PostBlockCard.tsx` | LibraryPost card |
| `LinkBlockCard` | `components/stack/cards/LinkBlockCard.tsx` | External link card |
| `TextBlockCard` | `components/stack/cards/TextBlockCard.tsx` | Text/markdown card |
| `EmbeddedStackCard` | `components/stack/cards/EmbeddedStackCard.tsx` | Nested stack preview |
| `ConnectModal` | `components/stack/ConnectModal.tsx` | Add block to stacks modal |
| `ConnectButton` | `components/stack/ConnectButton.tsx` | Trigger for connect modal |
| `ContextsPanel` | `components/stack/ContextsPanel.tsx` | Show all stacks containing block |
| `VisibilitySelector` | `components/stack/VisibilitySelector.tsx` | Visibility mode dropdown |
| `ExportMenu` | `components/stack/ExportMenu.tsx` | Export format selection |
| `CreateLinkBlockModal` | `components/stack/CreateLinkBlockModal.tsx` | Create link block |
| `CreateTextBlockModal` | `components/stack/CreateTextBlockModal.tsx` | Create text block |

### C.2 Phase 2 Components

| Component | Path | Description |
|-----------|------|-------------|
| `CitationCard` | `components/citations/CitationCard.tsx` | Single citation with click-to-navigate |
| `CreateCitationModal` | `components/citations/CreateCitationModal.tsx` | Create citation with anchor |
| `IntentSelector` | `components/citations/IntentSelector.tsx` | Citation intent dropdown |
| `IntentBadge` | `components/citations/IntentSelector.tsx` | Intent display badge |
| `GroupedCitationList` | `components/citations/GroupedCitationList.tsx` | Pro/con/context grouping |
| `EvidenceFilterBar` | `components/citations/EvidenceFilterBar.tsx` | Filter/sort controls |
| `EvidencePanel` | `components/citations/EvidencePanel.tsx` | Full evidence list with filters |
| `BulkActionsToolbar` | `components/citations/BulkActionsToolbar.tsx` | Bulk selection actions |
| `PDFSelectionCiteButton` | `components/pdf/PDFSelectionCiteButton.tsx` | "Cite this" on PDF selection |
| `LiftToDebateButton` | `components/stack/LiftToDebateButton.tsx` | Enhanced with citation count |

### C.3 Hooks

| Hook | Path | Description |
|------|------|-------------|
| `useBulkSelection` | `hooks/useBulkSelection.ts` | Selection state management |
| `useStackPermissions` | `hooks/useStackPermissions.ts` | Permission checking |

### C.4 Utilities

| Utility | Path | Description |
|---------|------|-------------|
| `canViewStack` | `lib/stacks/permissions.ts` | Visibility permission check |
| `canEditStack` | `lib/stacks/permissions.ts` | Edit permission check |
| `getCitationNavigationTarget` | `lib/citations/navigation.ts` | Compute navigation URL |
| `computeEvidenceBalance` | `lib/citations/evidenceBalance.ts` | Pro/con ratio |
| `generateBibTeX` | `lib/export/bibtex.ts` | BibTeX generator |
| `generateMarkdown` | `lib/export/markdown.ts` | Markdown generator |
| `generateRIS` | `lib/export/ris.ts` | RIS generator |

---

## Appendix D: Migration Scripts

### D.1 Phase 1.1: StackItem Migration

```sql
-- Step 1: Create StackItem table
CREATE TABLE "StackItem" (
    "id" TEXT NOT NULL,
    "stackId" TEXT NOT NULL,
    "blockType" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "addedById" TEXT NOT NULL,

    CONSTRAINT "StackItem_pkey" PRIMARY KEY ("id")
);

-- Step 2: Create indexes
CREATE UNIQUE INDEX "StackItem_stackId_blockType_blockId_key" 
ON "StackItem"("stackId", "blockType", "blockId");

CREATE INDEX "StackItem_stackId_position_idx" 
ON "StackItem"("stackId", "position");

CREATE INDEX "StackItem_blockId_blockType_idx" 
ON "StackItem"("blockId", "blockType");

-- Step 3: Add foreign keys
ALTER TABLE "StackItem" ADD CONSTRAINT "StackItem_stackId_fkey" 
FOREIGN KEY ("stackId") REFERENCES "Stack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StackItem" ADD CONSTRAINT "StackItem_addedById_fkey" 
FOREIGN KEY ("addedById") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
```

### D.2 Backfill Script (TypeScript)

```typescript
// scripts/backfill-stack-items.ts

import { prisma } from "@/lib/prismaclient";

async function backfillStackItems() {
  const stacks = await prisma.stack.findMany({
    where: {
      order: { isEmpty: false },
    },
    select: {
      id: true,
      order: true,
      owner_id: true,
    },
  });

  console.log(`Found ${stacks.length} stacks with order arrays`);

  let created = 0;
  let skipped = 0;

  for (const stack of stacks) {
    for (let i = 0; i < stack.order.length; i++) {
      const blockId = stack.order[i];

      // Check if StackItem already exists
      const existing = await prisma.stackItem.findFirst({
        where: {
          stackId: stack.id,
          blockType: "post",
          blockId: blockId,
        },
      });

      if (existing) {
        skipped++;
        continue;
      }

      await prisma.stackItem.create({
        data: {
          stackId: stack.id,
          blockType: "post",
          blockId: blockId,
          position: i,
          addedById: stack.owner_id,
        },
      });
      created++;
    }
  }

  console.log(`Created ${created} StackItems, skipped ${skipped} duplicates`);
}

backfillStackItems()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

---

# FINAL SUMMARY

## What We've Specified

This document provides complete implementation specifications for **Phase 1 (Are.na Parity)** and **Phase 2 (Evidence UX)** of the Stacks improvement initiative.

### Phase 1 Deliverables (Weeks 1-5)

| Feature | Benefit |
|---------|---------|
| **1.1 StackItem Join Table** | Blocks can belong to multiple stacks, proper ordering |
| **1.2 Block Types** | Links and text blocks alongside PDFs |
| **1.3 Connect UI** | One-click add to any stack, see all contexts |
| **1.4 Stack Embeds** | Nest stacks with cycle prevention |
| **1.5 Visibility Modes** | Private/unlisted/public/collaborative sharing |
| **1.6 Export** | BibTeX, Markdown, RIS export for citations |

### Phase 2 Deliverables (Weeks 6-9)

| Feature | Benefit |
|---------|---------|
| **2.1 Citation Anchors** | Click citation → jump to exact location |
| **2.2 Lift Carries Citations** | Evidence follows claims into deliberation |
| **2.3 Citation Intent** | Pro/con semantic tagging for evidence |
| **2.4 Evidence List** | Filter, sort, search, bulk operations |

## Implementation Order Recommendation

```
Week 1-2: 1.1 StackItem Migration (foundation for all features)
Week 2-3: 1.2 Block Types + 1.3 Connect UI
Week 3-4: 1.4 Stack Embeds + 1.5 Visibility
Week 4-5: 1.6 Export + Phase 1 testing
Week 6-7: 2.1 Citation Anchors + 2.2 Lift Carries Citations
Week 7-8: 2.3 Citation Intent + 2.4 Evidence List
Week 8-9: Phase 2 testing + polish
```

## Key Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Blocks per stack (avg) | 12 | 25+ |
| Blocks in multiple stacks | 0% | 30%+ |
| Citations with anchors | 0% | 80%+ |
| Citations lifted with claims | 0% | 100% |
| Evidence with intent set | 0% | 70%+ |

## Dependencies & Prerequisites

- [ ] Prisma schema access and migration permissions
- [ ] PDF viewer modification access (for 2.1)
- [ ] Background job queue (BullMQ) for link processing (1.2)
- [ ] Feature flag system for gradual rollout

## Risk Summary

| Risk | Mitigation |
|------|-----------|
| StackItem migration data loss | Dual-write period, keep old `order` column |
| PDF viewer integration complexity | Start with page-level anchors, add rect later |
| Performance at scale | Indexes on all filter fields, pagination required |
| UI complexity | Feature flags, progressive disclosure |

---

**Total Estimated Duration**: 8-9 weeks  
**Team Size**: 1-2 engineers  
**Review Checkpoints**: End of Phase 1, End of Phase 2

---

*End of STACKS_IMPROVEMENT_PHASES_1_2.md — Phases 1 & 2 Complete Specification*

*Continue to STACKS_IMPROVEMENT_PHASE_3.md for Phase 3 (AI-Enhanced Curation) specification.*
