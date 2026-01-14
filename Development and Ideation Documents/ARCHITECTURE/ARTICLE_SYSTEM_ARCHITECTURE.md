# Article System Architecture & Design

## Mesh Platform - Comprehensive Technical Specification

**Version:** 1.0  
**Last Updated:** December 15, 2024  
**Document Type:** End-to-End System Architecture

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Overview](#2-system-overview)
3. [Architecture Diagrams](#3-architecture-diagrams)
4. [Data Models](#4-data-models)
5. [Component Architecture](#5-component-architecture)
6. [API Specifications](#6-api-specifications)
7. [Editor System](#7-editor-system)
8. [Reader System](#8-reader-system)
9. [Annotation System](#9-annotation-system)
10. [Social Feed Integration](#10-social-feed-integration)
11. [Deliberation Integration](#11-deliberation-integration)
12. [Security & Authorization](#12-security--authorization)
13. [Performance Considerations](#13-performance-considerations)
14. [Appendices](#14-appendices)

---

## 1. Executive Summary

### 1.1 Purpose

The Mesh Article System is a sophisticated content creation and publishing platform that integrates seamlessly with the platform's deliberation and argumentation infrastructure. It enables users to create rich, magazine-quality articles that serve as hosts for structured discourse.

### 1.2 Key Capabilities

| Capability | Description |
|------------|-------------|
| **Rich Text Editing** | TipTap-based WYSIWYG editor with typography controls, media embedding, LaTeX math, and custom blocks |
| **Publishing Workflow** | Draft → Edit → Autosave → Publish lifecycle with revision history |
| **Text Annotations** | DOM-anchored comment threads attached to text selections |
| **Deliberation Hosting** | Each article automatically hosts a deliberation space for structured discourse |
| **Template System** | Configurable visual layouts ("standard", "feature", etc.) |
| **Dashboard Management** | Full CRUD with search, filtering, trash/restore, pagination |

### 1.3 Technology Stack

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Editor:** TipTap v2 (ProseMirror-based)
- **Backend:** Next.js API Routes, Prisma ORM
- **Database:** PostgreSQL
- **Storage:** AWS S3 (via Supabase presigned URLs)
- **State Management:** SWR, React State

---

## 2. System Overview

### 2.1 Architectural Principles

1. **Separation of Concerns** - Editor, Reader, and Dashboard are distinct components
2. **Server-First Rendering** - Articles rendered server-side for SEO and performance
3. **Optimistic Updates** - Dashboard actions feel instant with background sync
4. **Portable Content** - TipTap JSON AST enables cross-platform rendering
5. **Deliberation-Native** - Articles are first-class deliberation hosts

### 2.2 System Boundaries

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              MESH ARTICLE SYSTEM                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────────┐ │
│  │   Dashboard     │    │     Editor      │    │         Reader              │ │
│  │                 │    │                 │    │                             │ │
│  │ • List articles │    │ • TipTap core   │    │ • SSR HTML generation       │ │
│  │ • Search/filter │    │ • Toolbar       │    │ • Annotation pins           │ │
│  │ • CRUD actions  │    │ • Slash cmds    │    │ • Comment rail/modal        │ │
│  │ • Pagination    │    │ • Autosave      │    │ • Deliberation panel        │ │
│  │ • Bulk ops      │    │ • Hero images   │    │ • Template rendering        │ │
│  └────────┬────────┘    └────────┬────────┘    └──────────────┬──────────────┘ │
│           │                      │                             │                │
│           └──────────────────────┼─────────────────────────────┘                │
│                                  │                                              │
│                                  ▼                                              │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                           API LAYER                                       │  │
│  │                                                                           │  │
│  │  /api/articles     /api/articles/[id]/draft    /api/articles/[id]/publish │  │
│  │  /api/articles/[id]/threads                    /api/deliberations/spawn   │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                  │                                              │
│                                  ▼                                              │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                         DATA LAYER                                        │  │
│  │                                                                           │  │
│  │  Article ─────────────────────────────────────────────────────────────┐  │  │
│  │     │                                                                  │  │  │
│  │     ├─── Revision[]     (version snapshots)                           │  │  │
│  │     ├─── CommentThread[] ─── Comment[]  (annotations)                 │  │  │
│  │     └─── Deliberation (1:1 via hostType/hostId)                       │  │  │
│  │              │                                                         │  │  │
│  │              ├─── AgoraRoom                                           │  │  │
│  │              └─── DebateSheet ─── Arguments, Claims, etc.             │  │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 User Journeys

#### Journey 1: Article Creation & Publishing

```
User                    Dashboard                  API                    Database
  │                         │                       │                         │
  │── Click "New" ─────────▶│                       │                         │
  │                         │─── POST /articles ───▶│                         │
  │                         │                       │─── INSERT article ─────▶│
  │                         │◀── { id } ────────────│                         │
  │◀── Redirect /edit ──────│                       │                         │
  │                         │                       │                         │
  │── Edit content ────────────────────────────────────────────────────────────│
  │                         │                       │                         │
  │── (800ms debounce) ─────────────────────────────│                         │
  │                         │── PATCH /draft ──────▶│                         │
  │                         │                       │─── UPDATE astJson ─────▶│
  │                         │                       │                         │
  │── Click "Publish" ──────│                       │                         │
  │                         │── POST /publish ─────▶│                         │
  │                         │                       │─── UPDATE status ──────▶│
  │                         │                       │─── INSERT revision ────▶│
  │                         │                       │─── createFeedPost ─────▶│
  │◀── Redirect /article/slug ─────────────────────│                         │
```

#### Journey 2: Article Reading with Deliberation

```
User                    Article Page               API                  Deliberation
  │                         │                       │                         │
  │── GET /article/[slug] ─▶│                       │                         │
  │                         │─── prisma.article ───▶│                         │
  │                         │─── getOrCreateDelibId ────────────────────────▶│
  │                         │◀── deliberationId ────────────────────────────│
  │                         │─── generateHTML() ────│                         │
  │◀── Rendered article ────│                       │                         │
  │                         │                       │                         │
  │── Select text ──────────│                       │                         │
  │── Click "+" ────────────│                       │                         │
  │── Submit comment ───────│                       │                         │
  │                         │── POST /threads ─────▶│                         │
  │                         │◀── thread ────────────│                         │
  │◀── Pin appears ─────────│                       │                         │
  │                         │                       │                         │
  │── Click "Discussion" ───────────────────────────────────────────────────▶│
  │                         │                       │       DeepDivePanel     │
```

---

## 3. Architecture Diagrams

### 3.1 Component Hierarchy

```
                              ArticleReaderWithPins
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
              ArticleReader      Annotation Layer    DeepDivePanel
                    │                  │                  │
            ┌───────┴───────┐    ┌─────┴─────┐      ┌─────┴─────┐
            │               │    │           │      │           │
         HeroRenderer   HTML Content   CommentRail  RhetoricProvider
                                 │           │           │
                           SelectionBubble   │     DialogueTargetProvider
                                 │           │           │
                           CommentModal ─────┘     DeepDivePanelV2
```

### 3.2 Editor Component Hierarchy

```
                              ArticleEditor
                                    │
         ┌────────────┬─────────────┼─────────────┬─────────────┐
         │            │             │             │             │
     Toolbar    TemplateSelector  EditorContent   Outline    HeroUpload
         │                          │
    ┌────┼────┐                     │
    │    │    │                     │
 Formatting Alignment Typography   TipTap Core
 Buttons   Buttons   Selects            │
                                   ┌────┴────┐
                                   │         │
                              Extensions  ProseMirror
```

### 3.3 Data Flow: Autosave Pipeline

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         AUTOSAVE PIPELINE                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐            │
│  │  Editor  │──▶│ onChange │──▶│ Debounce │──▶│ makeHash │            │
│  │  Update  │   │ Handler  │   │  800ms   │   │          │            │
│  └──────────┘   └──────────┘   └──────────┘   └────┬─────┘            │
│                                                      │                  │
│                                               ┌──────▼──────┐          │
│                                               │ Hash Changed?│          │
│                                               └──────┬──────┘          │
│                                                      │                  │
│                                    ┌─────────────────┼─────────────────┐│
│                                    │ YES             │ NO              ││
│                                    ▼                 ▼                 ││
│                            ┌──────────────┐  ┌──────────────┐         ││
│                            │ Abort Inflight│  │    Skip      │         ││
│                            └──────┬───────┘  └──────────────┘         ││
│                                   │                                    ││
│                                   ▼                                    ││
│                            ┌──────────────┐                           ││
│                            │ PATCH /draft │                           ││
│                            └──────┬───────┘                           ││
│                                   │                                    ││
│                                   ▼                                    ││
│                            ┌──────────────┐                           ││
│                            │ Update Hash  │                           ││
│                            │ localStorage │                           ││
│                            └──────────────┘                           ││
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.4 Annotation System Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      ANNOTATION CREATION FLOW                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  User Selects Text                                                       │
│         │                                                                │
│         ▼                                                                │
│  ┌──────────────────┐                                                   │
│  │ onMouseUpCapture │ ◀─────────────────────────────────────────┐      │
│  └────────┬─────────┘                                            │      │
│           │                                                      │      │
│           ▼                                                      │      │
│  ┌──────────────────────────┐                                   │      │
│  │ window.getSelection()   │                                    │      │
│  │ → Is collapsed?          │                                   │      │
│  └────────┬─────────────────┘                                   │      │
│           │                                                      │      │
│      ┌────┴────┐                                                │      │
│      │         │                                                │      │
│    YES        NO                                                │      │
│      │         │                                                │      │
│      ▼         ▼                                                │      │
│  ┌──────┐  ┌──────────────────────┐                            │      │
│  │ Clear │  │ buildAnchorFromSel() │                            │      │
│  │ Adder │  └────────┬─────────────┘                            │      │
│  └──────┘            │                                          │      │
│                      ▼                                          │      │
│           ┌──────────────────────┐                             │      │
│           │ normalizeToTextNodes │                             │      │
│           └────────┬─────────────┘                             │      │
│                    │                                            │      │
│                    ▼                                            │      │
│           ┌──────────────────────┐                             │      │
│           │ nodePathFromRoot()   │                             │      │
│           │ for start + end      │                             │      │
│           └────────┬─────────────┘                             │      │
│                    │                                            │      │
│                    ▼                                            │      │
│           ┌──────────────────────┐                             │      │
│           │ setAdder({ anchor,   │                             │      │
│           │   rect })            │                             │      │
│           └────────┬─────────────┘                             │      │
│                    │                                            │      │
│                    ▼                                            │      │
│           ┌──────────────────────┐                             │      │
│           │ Show "+" Button      │                             │      │
│           └────────┬─────────────┘                             │      │
│                    │                                            │      │
│                    ▼                                            │      │
│           ┌──────────────────────┐                             │      │
│           │ User clicks "+"      │                             │      │
│           │ → setBubble()        │                             │      │
│           └────────┬─────────────┘                             │      │
│                    │                                            │      │
│                    ▼                                            │      │
│           ┌──────────────────────┐                             │      │
│           │ Show Composer        │                             │      │
│           │ User enters comment  │                             │      │
│           └────────┬─────────────┘                             │      │
│                    │                                            │      │
│                    ▼                                            │      │
│           ┌──────────────────────┐                             │      │
│           │ POST /threads        │                             │      │
│           │ { anchor, body }     │                             │      │
│           └────────┬─────────────┘                             │      │
│                    │                                            │      │
│                    ▼                                            │      │
│           ┌──────────────────────┐                             │      │
│           │ setThreads(prev ⊕    │                             │      │
│           │   newThread)         │──────────────────────────────┘      │
│           └────────┬─────────────┘                                      │
│                    │                                                    │
│                    ▼                                                    │
│           ┌──────────────────────┐                                     │
│           │ Pin appears in       │                                     │
│           │ left gutter + rail   │                                     │
│           └──────────────────────┘                                     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Data Models

### 4.1 Article Entity

```prisma
model Article {
  // Identity
  id           String        @id @default(uuid())
  authorId     String        // Foreign key to User
  slug         String        @unique
  
  // Content
  title        String
  heroImageKey String?       // S3 object key
  template     String        @default("standard")
  astJson      Json          // TipTap ProseMirror JSON
  
  // Publishing
  status       ArticleStatus @default(DRAFT)
  publishedAt  DateTime?
  
  // Derived
  excerpt      String?       // First ~1200 chars
  readingTime  Int?          // Estimated minutes
  
  // Metadata
  analytics    Json?         // View counts, etc.
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  deletedAt    DateTime?     // Soft delete
  
  // Settings
  allowAnnotations Boolean   @default(true)
  
  // Relations
  revisions    Revision[]
  threads      CommentThread[]
  roomId       String?       // Optional Agora room link
  
  @@index([authorId, deletedAt, updatedAt])
  @@index([authorId, status, updatedAt])
  @@map("articles")
}

enum ArticleStatus {
  DRAFT
  PUBLISHED
}
```

### 4.2 Revision Entity

```prisma
model Revision {
  id        String   @id @default(uuid())
  articleId String
  astJson   Json     // Snapshot of content at publish time
  createdAt DateTime @default(now())
  
  article   Article  @relation(fields: [articleId], references: [id], onDelete: Cascade)
  
  @@map("article_revisions")
}
```

### 4.3 Comment Thread & Comment

```prisma
model CommentThread {
  id        String    @id @default(uuid())
  articleId String
  anchor    Json      // Anchor type (see below)
  resolved  Boolean   @default(false)
  createdBy String
  createdAt DateTime  @default(now())
  
  comments  Comment[]
  article   Article   @relation(fields: [articleId], references: [id])
  
  @@index([articleId])
}

model Comment {
  id        String        @id @default(uuid())
  threadId  String
  body      String
  createdBy String
  createdAt DateTime      @default(now())
  upvotes   Int           @default(0)
  downvotes Int           @default(0)
  
  thread    CommentThread @relation(fields: [threadId], references: [id])
  
  @@index([threadId])
}
```

### 4.4 TypeScript Type Definitions

```typescript
// types/comments.ts

/**
 * Anchor represents a text selection within the article DOM.
 * Uses path-based addressing for stability across re-renders.
 */
interface Anchor {
  /** Array of child indices from root to start text node */
  startPath: number[];
  /** Character offset within start text node */
  startOffset: number;
  /** Array of child indices from root to end text node */
  endPath: number[];
  /** Character offset within end text node */
  endOffset: number;
}

interface Comment {
  id: string;
  threadId: string;
  body: string;
  createdBy: string;
  createdAt: string;    // ISO string
  upvotes: number;
  downvotes: number;
}

interface CommentThread {
  id: string;
  articleId: string;
  anchor: Anchor;
  resolved: boolean;
  createdBy: string;
  createdAt: string;    // ISO string
  comments: Comment[];
}

// Dashboard types
interface ArticleItem {
  id: string;
  title: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED";
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  heroImageKey: string | null;
  template: string;
}
```

### 4.5 TipTap AST Structure

```typescript
// Example TipTap document JSON (astJson field)
interface TipTapDocument {
  type: "doc";
  content: TipTapNode[];
}

interface TipTapNode {
  type: string;           // "paragraph", "heading", "bulletList", etc.
  attrs?: Record<string, any>;
  content?: TipTapNode[];
  marks?: TipTapMark[];
  text?: string;          // For text nodes
}

interface TipTapMark {
  type: string;           // "bold", "italic", "textStyle", etc.
  attrs?: Record<string, any>;
}

// Example document
const exampleDoc: TipTapDocument = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 1 },
      content: [{ type: "text", text: "Article Title" }]
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "This is " },
        { 
          type: "text", 
          text: "bold", 
          marks: [{ type: "bold" }] 
        },
        { type: "text", text: " text." }
      ]
    },
    {
      type: "mathBlock",
      attrs: { latex: "E = mc^2" }
    }
  ]
};
```

---

## 5. Component Architecture

### 5.1 ArticleEditor Component

**Location:** `components/article/ArticleEditor.tsx`

**Props:**
```typescript
interface ArticleEditorProps {
  articleId: string;
}
```

**State:**
| State Variable | Type | Purpose |
|----------------|------|---------|
| `template` | string | Current template ("standard", "feature") |
| `heroImageKey` | string \| null | S3 key for hero image |
| `heroPreview` | string \| null | Local preview URL |
| `isDirty` | boolean | Unsaved changes indicator |
| `title` | string | Article title |
| `counter` | {words, chars} | Character count |
| `initialJson` | any | Loaded article content |
| `publishing` | boolean | Publishing in progress |

**Key Functions:**
```typescript
// Payload construction
const makePayload = () => ({
  astJson: editor.getJSON(),
  template,
  heroImageKey,
  title: title?.trim() || undefined
});

// Debounced save
const saveDraft = async () => {
  const payload = makePayload();
  const hash = JSON.stringify(payload);
  if (hash === lastSentHash.current) return;
  
  inflight.current?.abort();
  inflight.current = new AbortController();
  
  await fetch(`/api/articles/${articleId}/draft`, {
    method: "PATCH",
    body: JSON.stringify(payload),
    signal: inflight.current.signal
  });
  
  lastSentHash.current = hash;
};

// Publishing
const publishArticle = async () => {
  await saveDraftImmediate();
  const res = await fetch(`/api/articles/${articleId}/publish`, {
    method: "POST",
    body: JSON.stringify({
      astJson: editor.getJSON(),
      template,
      heroImageKey,
      title
    })
  });
  const { slug } = await res.json();
  router.replace(`/article/${slug}`);
};
```

### 5.2 ArticleReaderWithPins Component

**Location:** `components/article/ArticleReaderWithPins.tsx`

**Props:**
```typescript
interface Props {
  template: string;
  heroSrc?: string | null;
  html: string;                    // Pre-rendered HTML
  threads: CommentThread[];
  articleSlug: string;
  title?: string;
  currentUser?: unknown;
  deliberationId?: string;
}
```

**State:**
| State Variable | Type | Purpose |
|----------------|------|---------|
| `threads` | CommentThread[] | All comment threads |
| `openId` | string \| null | Currently highlighted thread |
| `activeThread` | CommentThread \| null | Thread open in modal |
| `bubble` | {anchor, rect, text} \| null | Comment composer state |
| `adder` | {anchor, rect} \| null | "+" button state |
| `hoverId` | string \| null | Hovered thread for highlight |
| `tick` | number | Force re-render on scroll/resize |

**Key Functions:**
```typescript
// Build anchor from selection
function buildAnchorFromSelection(
  root: HTMLElement,
  sel: Selection
): { anchor: Anchor; rect: DOMRect } | null;

// Resolve anchor to DOM rects
function getAnchorRects(
  anchor: Anchor,
  root: HTMLElement
): DOMRect[];

// Create new comment thread
async function createThread() {
  const res = await fetch(
    `/api/articles/${articleSlug}/threads`,
    {
      method: "POST",
      body: JSON.stringify({ anchor: bubble.anchor, body: draftBody })
    }
  );
  const created = await res.json();
  setThreads(prev => [created, ...prev]);
  setOpenId(created.id);
  setBubble(null);
}

// Scroll to thread anchor
function scrollToThread(t: CommentThread) {
  const rects = getAnchorRects(t.anchor, containerRef.current);
  const y = window.scrollY + rects[0].top - 350;
  window.scrollTo({ top: y, behavior: "smooth" });
}
```

### 5.3 ArticlesDashboard Component

**Location:** `app/(root)/(standard)/profile/articles/ui/ArticlesDashboard.tsx`

**Props:**
```typescript
interface Props {
  initialItems: Item[];
  initialNextCursor: { updatedAt: string; id: string } | null;
  pageSize: number;
}
```

**SWR Infinite Configuration:**
```typescript
const getKey = (index: number, prev: PageData | null) => {
  if (prev && (!prev.items || prev.items.length === 0)) return null;
  
  const params = new URLSearchParams({
    page: String(index + 1),
    pageSize: String(pageSize),
    q,
    view,
    sort: "updatedAt:desc"
  });
  
  if (status !== "ALL") params.set("status", status);
  if (template !== "ALL") params.set("template", template);
  
  return `/api/articles?${params.toString()}`;
};

const { data, size, setSize, isValidating, mutate } = useSWRInfinite<PageData>(
  getKey,
  fetcher,
  {
    revalidateFirstPage: true,
    persistSize: true,
    parallel: true,
    fallbackData: [{ items: initialItems }]
  }
);
```

**Optimistic Update Pattern:**
```typescript
async function remove(id: string) {
  if (!confirm("Move to Trash?")) return;
  
  // Optimistic: remove from cache immediately
  mutate(
    pages => pages?.map(p => ({
      ...p,
      items: p.items.filter(it => it.id !== id)
    })),
    { revalidate: false }
  );
  
  toast.success("Moved to Trash");
  
  // Sync to server
  await fetch(`/api/articles/${id}`, { method: "DELETE" })
    .finally(() => mutate());  // Revalidate on completion
}
```

---

## 6. API Specifications

### 6.1 Articles List & Create

#### `GET /api/articles`

**Purpose:** List articles for current user

**Authentication:** Required (cookie-based)

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number (1-indexed) |
| `pageSize` | number | 20 | Items per page (1-100) |
| `q` | string | "" | Search query (title/slug) |
| `status` | enum | null | DRAFT \| PUBLISHED |
| `template` | string | null | Filter by template |
| `view` | string | "active" | "active" \| "trash" |
| `sort` | string | "updatedAt:desc" | field:direction |

**Response:**
```typescript
{
  items: {
    id: string;
    title: string;
    slug: string;
    status: "DRAFT" | "PUBLISHED";
    createdAt: string;
    updatedAt: string;
    heroImageKey: string | null;
    template: string;
  }[];
  total: number;
  page: number;
  pageSize: number;
}
```

#### `POST /api/articles`

**Purpose:** Create new article draft

**Body (all optional):**
```typescript
{
  title?: string;          // Default: "Untitled"
  slug?: string;           // Default: nanoid()
  template?: string;       // Default: "standard"
  heroImageKey?: string | null;
  astJson?: TipTapDocument; // Default: empty doc
}
```

**Response:** `{ id: string }` (201 Created)

### 6.2 Article CRUD

#### `GET /api/articles/[id]`

**Purpose:** Get single article by ID

**Authorization:** Owner only

**Response:** Full article object

#### `PATCH /api/articles/[id]`

**Purpose:** Update article metadata

**Body:**
```typescript
{
  title?: string;
  template?: string;
  heroImageKey?: string | null;
}
```

#### `DELETE /api/articles/[id]`

**Purpose:** Soft delete (or hard delete)

**Query:** `?hard=1` for permanent deletion

### 6.3 Draft Save

#### `PATCH /api/articles/[id]/draft`

**Purpose:** Autosave draft content

**Body:**
```typescript
{
  astJson?: TipTapDocument;
  template?: string;
  heroImageKey?: string | null;
  title?: string;
}
```

**Response:** `{ ok: true }`

### 6.4 Publishing

#### `POST /api/articles/[id]/publish`

**Purpose:** Publish article

**Processing Steps:**
1. Validate ownership
2. Resolve final title (body > current > AST-derived > "Untitled")
3. Generate unique slug from title
4. Compute excerpt and reading time
5. Update article (status=PUBLISHED, publishedAt)
6. Create revision snapshot
7. Create feed post (optional)

**Response:** `{ slug: string, feedPostId?: string }`

### 6.5 Comment Threads

#### `GET /api/articles/[id]/threads`

**Purpose:** List comment threads for article

**Response:**
```typescript
{
  id: string;
  articleId: string;
  anchor: Anchor;
  resolved: boolean;
  createdBy: string;
  createdAt: string;
  comments: Comment[];
}[]
```

#### `POST /api/articles/[id]/threads`

**Purpose:** Create new comment thread

**Body:**
```typescript
{
  anchor: Anchor;
  body: string;  // Initial comment text
}
```

**Response:** Created thread with comments

---

## 7. Editor System

### 7.1 TipTap Extension Architecture

The editor uses a layered extension system with shared base extensions:

```typescript
// Shared extensions (used by both editor and reader SSR)
// lib/tiptap/extensions/shared.ts
export function tiptapSharedExtensions() {
  return [
    StarterKit.configure({
      bulletList: { keepMarks: true, keepAttributes: true },
      orderedList: { keepMarks: true, keepAttributes: true },
    }),
    FancyTextStyle,      // Extended TextStyle with typography tokens
    Color.configure({ types: ['textStyle'] }),
    Underline,
    Highlight,
    Link.configure({ openOnClick: true, autolink: true }),
    SSRTextAlign.configure({ types: ['heading', 'paragraph'] }),
    SectionBreak,
  ];
}
```

### 7.2 Custom Node Extensions

#### PullQuote
```typescript
const PullQuote = Node.create({
  name: "pullQuote",
  group: "block",
  content: "inline*",
  addAttributes() {
    return {
      alignment: { default: "left" }
    };
  },
  renderHTML({ HTMLAttributes }) {
    return ["blockquote", mergeAttributes(HTMLAttributes, {
      class: `pull-quote ${HTMLAttributes.alignment}`
    }), 0];
  }
});
```

#### Callout
```typescript
const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "paragraph+",
  addAttributes() {
    return {
      type: { default: "info" }  // info, warning, tip, danger
    };
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, {
      class: `callout ${HTMLAttributes.type}`
    }), 0];
  }
});
```

#### MathBlock
```typescript
const MathBlock = Node.create({
  name: "mathBlock",
  group: "block",
  atom: true,
  addAttributes() {
    return {
      latex: { default: "" }
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(({ node }) => (
      <div
        className="math-block"
        dangerouslySetInnerHTML={{
          __html: katex.renderToString(node.attrs.latex, { throwOnError: false })
        }}
      />
    ));
  }
});
```

#### SectionBreak
```typescript
// lib/tiptap/extensions/sectionBreak.ts
export const SectionBreak = Node.create({
  name: 'sectionBreak',
  group: 'block',
  atom: true,
  parseHTML() {
    return [{ tag: 'hr[data-section-break]' }];
  },
  renderHTML() {
    return ['hr', { 'data-section-break': '1' }];
  }
});
```

### 7.3 Typography Token System

The system uses data attributes for portable, semantic styling:

```typescript
// FancyTextStyle extension attributes
{
  fontFamily: { 
    parseHTML: el => el.getAttribute('data-ff'),
    renderHTML: attrs => ({ 'data-ff': attrs.fontFamily })
  },
  fontSize: {
    parseHTML: el => el.getAttribute('data-fs'),
    renderHTML: attrs => ({ 'data-fs': attrs.fontSize })
  },
  color: {
    parseHTML: el => el.getAttribute('data-clr'),
    renderHTML: attrs => ({ 'data-clr': attrs.color })
  },
  fontWeight: {
    parseHTML: el => el.getAttribute('data-fw'),
    renderHTML: attrs => ({ 'data-fw': attrs.fontWeight })
  },
  lineHeight: {
    parseHTML: el => el.getAttribute('data-lh'),
    renderHTML: attrs => ({ 'data-lh': attrs.lineHeight })
  },
  letterSpacing: {
    parseHTML: el => el.getAttribute('data-ls'),
    renderHTML: attrs => ({ 'data-ls': attrs.letterSpacing })
  },
  textTransform: {
    parseHTML: el => el.getAttribute('data-tt'),
    renderHTML: attrs => ({ 'data-tt': attrs.textTransform })
  }
}
```

**CSS Token Resolution:**
```css
/* type-tokens.css */

/* Font Families */
[data-ff="system"]   { font-family: var(--ff-system); }
[data-ff="founders"] { font-family: var(--ff-founders); }
[data-ff="bugrino"]  { font-family: var(--ff-bugrino); }
[data-ff="newedge"]  { font-family: var(--ff-newedge); }
[data-ff="kolonia"]  { font-family: var(--ff-kolonia); }

/* Font Sizes */
[data-fs="12"] { font-size: 12px; }
[data-fs="14"] { font-size: 14px; }
[data-fs="16"] { font-size: 16px; }
[data-fs="18"] { font-size: 18px; }
[data-fs="20"] { font-size: 20px; }
[data-fs="24"] { font-size: 24px; }
[data-fs="32"] { font-size: 32px; }
[data-fs="48"] { font-size: 48px; }

/* Colors */
[data-clr="accent"] { color: var(--clr-accent); }
[data-clr="muted"]  { color: var(--clr-muted); }
[data-clr="red"]    { color: var(--clr-red); }

/* Font Weights */
[data-fw="300"] { font-weight: 300; }
[data-fw="400"] { font-weight: 400; }
[data-fw="500"] { font-weight: 500; }
[data-fw="600"] { font-weight: 600; }
[data-fw="700"] { font-weight: 700; }
[data-fw="800"] { font-weight: 800; }

/* Line Heights */
[data-lh="tight"]  { line-height: 1.2; }
[data-lh="normal"] { line-height: 1.5; }
[data-lh="loose"]  { line-height: 1.8; }

/* Letter Spacing */
[data-ls="tight"]  { letter-spacing: -0.02em; }
[data-ls="normal"] { letter-spacing: 0; }
[data-ls="wide"]   { letter-spacing: 0.05em; }

/* Text Transform */
[data-tt="upper"]     { text-transform: uppercase; }
[data-tt="lower"]     { text-transform: lowercase; }
[data-tt="caps"]      { text-transform: capitalize; }
[data-tt="smallcaps"] { font-variant: small-caps; }
```

### 7.4 Slash Command System

```typescript
// components/article/editor/SlashCommand.tsx
const COMMANDS = [
  {
    title: "Image",
    command: (editor) => editor.chain().focus().setImage({ src: "" }).run()
  },
  {
    title: "Quote",
    command: (editor) => editor.chain().focus().setNode("pullQuote").run()
  },
  {
    title: "Callout",
    command: (editor) => editor.chain().focus().setNode("callout").run()
  },
  {
    title: "Latex",
    command: (editor) => editor.chain().focus().setNode("mathBlock").run()
  }
];

const SlashCommand = Extension.create({
  name: "slash-command",
  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        char: "/",
        items: ({ query }) =>
          COMMANDS.filter(item =>
            item.title.toLowerCase().startsWith(query.toLowerCase())
          ),
        command: ({ editor, range, props }) => {
          props.command(editor);
          editor.commands.deleteRange(range);
        },
        render: () => ({
          onStart: (props) => { /* tippy popup */ },
          onUpdate: (props) => { /* update popup */ },
          onExit: () => { /* destroy popup */ }
        })
      })
    ];
  }
});
```

### 7.5 Paste Handling & Sanitization

```typescript
// Content sanitization for pasted HTML
function sanitizeAndNormalize(html: string) {
  // 1. DOMPurify sanitization
  const clean = DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style', 'id', 'name']
  });

  const doc = new DOMParser().parseFromString(clean, 'text/html');

  // 2. Convert inline styles to data tokens
  doc.querySelectorAll('[style]').forEach(el => {
    const st = el.style;
    
    if (st.color) {
      el.setAttribute('data-clr', colorToToken(st.color));
      st.removeProperty('color');
    }
    if (st.fontSize) {
      el.setAttribute('data-fs', sizeToToken(st.fontSize));
      st.removeProperty('font-size');
    }
    // ... weight, transform, etc.
  });

  // 3. Convert legacy <a name="x"> to id
  doc.querySelectorAll('a[name]').forEach(a => {
    if (!a.id) a.id = a.getAttribute('name');
    a.removeAttribute('name');
  });

  // 4. Convert double empty paragraphs to section breaks
  const ps = Array.from(doc.querySelectorAll('p'));
  for (let i = 0; i < ps.length - 1; i++) {
    if (isEmpty(ps[i]) && isEmpty(ps[i+1])) {
      const hr = doc.createElement('hr');
      hr.setAttribute('data-section-break', '1');
      ps[i].replaceWith(hr);
      ps[i+1].remove();
    }
  }

  return doc.body.innerHTML;
}

// Editor configuration
const editor = useEditor({
  extensions,
  editorProps: {
    transformPastedHTML: (html) => sanitizeAndNormalize(html),
    handlePaste: () => false  // Use default insertion after transform
  }
});
```

### 7.6 Toolbar Architecture

```typescript
// components/article/editor/Toolbar.tsx

const Toolbar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) return null;

  // Button helper
  const btn = (icon, onClick, active = false) => (
    <button
      onClick={onClick}
      className={`p-1.5 rounded ${active ? "bg-neutral-200" : "hover:bg-neutral-100"}`}
    >
      {icon}
    </button>
  );

  return (
    <div className="toolbar">
      {/* Text Formatting */}
      {btn(<Bold/>, () => editor.chain().focus().toggleBold().run(), 
           editor.isActive('bold'))}
      {btn(<Italic/>, () => editor.chain().focus().toggleItalic().run(),
           editor.isActive('italic'))}
      
      {/* Lists */}
      {btn(<List/>, () => editor.chain().focus().toggleBulletList().run(),
           editor.isActive('bulletList'))}
      {btn(<ListOrdered/>, () => editor.chain().focus().toggleOrderedList().run(),
           editor.isActive('orderedList'))}
      
      {/* Alignment */}
      {btn(<AlignLeft/>, () => editor.chain().focus().setTextAlign('left').run())}
      {btn(<AlignCenter/>, () => editor.chain().focus().setTextAlign('center').run())}
      
      {/* Typography Dropdowns */}
      <IconSelect 
        title="Font Family" 
        icon={<Type/>}
        onChange={(e) => editor.chain().focus()
          .setMark('textStyle', { fontFamily: e.target.value }).run()}
      >
        <option value="system">System Sans</option>
        <option value="founders">Founders</option>
        <option value="bugrino">Bugrino</option>
      </IconSelect>
      
      <IconSelect 
        title="Font Size" 
        icon={<ZoomIn/>}
        onChange={(e) => editor.chain().focus()
          .setMark('textStyle', { fontSize: e.target.value }).run()}
      >
        {["12", "14", "16", "18", "20", "24", "32", "48"].map(s => (
          <option key={s} value={s}>{s}px</option>
        ))}
      </IconSelect>
    </div>
  );
};
```

---

## 8. Reader System

### 8.1 Server-Side Rendering

```typescript
// app/article/(by-key)/[key]/page.tsx

export default async function ArticlePage({ params }: { params: { key: string } }) {
  // 1. Fetch article (by UUID or slug)
  const where = /^[0-9a-f-]{36}$/i.test(params.key) 
    ? { id: params.key } 
    : { slug: params.key };
  
  const article = await prisma.article.findUnique({ where });
  if (!article) notFound();

  // 2. Get/create deliberation
  const userId = await getCurrentUserId().catch(() => null);
  const deliberationId = await getOrCreateDeliberationId(
    'article', article.id, article.roomId, userId ?? 'system'
  );

  // 3. Fetch comment threads
  const threads = await prisma.commentThread.findMany({
    where: { articleId: article.id },
    include: { comments: { orderBy: { createdAt: "asc" } } }
  });

  // 4. Generate HTML from TipTap JSON
  const lowlight = createLowlight();
  lowlight.register("js", javascript);
  lowlight.register("ts", typescript);
  
  const html = generateHTML(article.astJson, [
    ...tiptapSharedExtensions(),
    CodeBlockLowlight.configure({ lowlight }),
    TaskList, TaskItem,
    CustomImage, PullQuote, Callout, MathBlock, MathInline,
    Link, ParagraphKeepEmptySSR,
    TextStyleTokens, BlockStyleTokens
  ]);

  // 5. Render page
  return (
    <>
      <Link href={`/deliberation/${deliberationId}`}>
        Discussion Page ↗
      </Link>
      <ArticleReaderWithPins
        template={article.template}
        heroSrc={article.heroImageKey}
        html={html}
        threads={threads}
        articleSlug={params.key}
        title={article.title}
        deliberationId={deliberationId}
      />
    </>
  );
}
```

### 8.2 Template System

```typescript
// Article templates define visual layout
type Template = "standard" | "feature" | "minimal" | "magazine";

// ArticleReader component applies template class
const ArticleReader = ({ template, heroSrc, title, children }) => (
  <article className={clsx(template, 'w-full mx-auto')}>
    {title && (
      <header className="mb-4">
        <h1 className="text-4xl font-semibold text-center">{title}</h1>
      </header>
    )}
    <hr className="border-slate-700/70" />
    {heroSrc && (
      <img src={heroSrc} className="mb-8 w-full rounded-lg object-cover" />
    )}
    {children}
  </article>
);
```

**Template CSS:**
```css
/* article.templates.css */

.standard {
  max-width: 720px;
  padding: 0 1rem;
}

.feature {
  max-width: 960px;
}
.feature h1 { font-size: 3rem; }
.feature .hero { height: 60vh; object-fit: cover; }

.magazine {
  max-width: 1200px;
  display: grid;
  grid-template-columns: 1fr 2fr;
}

.minimal {
  max-width: 600px;
  font-family: var(--ff-serif);
}
```

### 8.3 Section Collapse System

```typescript
// lib/article/wrapSections.ts
export function wrapSections(html: string) {
  const { document } = parseHTML(`<div id="x">${html}</div>`);
  const root = document.getElementById('x');

  // Split content at section breaks
  const kids = Array.from(root.childNodes);
  const sections: Node[][] = [];
  let bucket: Node[] = [];

  for (const n of kids) {
    if (isSectionBreak(n)) {
      if (bucket.length) sections.push(bucket);
      bucket = [];
    } else {
      bucket.push(n);
    }
  }
  if (bucket.length) sections.push(bucket);

  // Wrap each section in <details>
  sections.forEach((nodes, idx) => {
    const details = document.createElement('details');
    details.className = 'article-section';
    details.setAttribute('data-section-index', String(idx));

    const summary = document.createElement('summary');
    summary.className = 'article-section-summary';
    summary.textContent = extractSummary(nodes);

    details.appendChild(summary);
    nodes.forEach(n => details.appendChild(n));
    root.appendChild(details);
  });

  return root.innerHTML;
}

function isSectionBreak(node) {
  return node?.matches?.('hr[data-section-break]');
}

function extractSummary(nodes) {
  // Use first heading or first paragraph text
  const heading = nodes.find(n => /^H[1-4]$/.test(n.tagName));
  if (heading) return heading.textContent.trim().slice(0, 140);
  
  const p = nodes.find(n => n.tagName === 'P');
  return (p?.textContent || 'Section').trim().slice(0, 140);
}
```

---

## 9. Annotation System

### 9.1 Anchor Data Structure

The anchor system uses DOM path-based addressing for stable text references:

```typescript
interface Anchor {
  startPath: number[];   // [0, 2, 0] = root → 1st child → 3rd child → 1st child
  startOffset: number;   // Character position within text node
  endPath: number[];     
  endOffset: number;
}
```

**Example:**
```html
<article id="root">         <!-- path: [] -->
  <p>                       <!-- path: [0] -->
    Hello                   <!-- path: [0, 0] (text node) -->
    <strong>world</strong>  <!-- path: [0, 1] -->
  </p>
</article>
```

Selecting "world" would produce:
```typescript
{
  startPath: [0, 1, 0],   // p → strong → text
  startOffset: 0,
  endPath: [0, 1, 0],
  endOffset: 5
}
```

### 9.2 Building Anchors from Selection

```typescript
function buildAnchorFromSelection(
  root: HTMLElement,
  sel: Selection
): { anchor: Anchor; rect: DOMRect } | null {
  if (!sel.rangeCount) return null;
  
  const range = sel.getRangeAt(0);
  if (range.collapsed) return null;

  // Normalize to text nodes (selection might be on element boundaries)
  const norm = normalizeRangeToTextNodes(root, range);
  if (!norm) return null;

  const { start, startOffset, end, endOffset } = norm;
  
  // Compute paths from root to each text node
  const startPath = nodePathFromRoot(root, start);
  const endPath = nodePathFromRoot(root, end);

  // Get visual rect for positioning
  const rect = range.getBoundingClientRect();
  const base = root.getBoundingClientRect();
  const localRect = new DOMRect(
    rect.left - base.left,
    rect.top - base.top,
    rect.width,
    rect.height
  );

  return {
    anchor: { startPath, startOffset, endPath, endOffset },
    rect: localRect
  };
}

function nodePathFromRoot(root: Node, target: Node): number[] {
  const path: number[] = [];
  let n: Node | null = target;
  
  while (n && n !== root) {
    const parent = n.parentNode;
    if (!parent) break;
    
    const idx = Array.prototype.indexOf.call(parent.childNodes, n);
    path.unshift(idx);
    n = parent;
  }
  
  return path;
}
```

### 9.3 Resolving Anchors to DOM

```typescript
function getAnchorRects(anchor: Anchor, root: HTMLElement): DOMRect[] {
  // Walk paths to find start node
  let startNode: Node | null = root;
  for (const idx of anchor.startPath) {
    startNode = startNode?.childNodes[idx] ?? null;
  }
  
  // Walk paths to find end node
  let endNode: Node | null = root;
  for (const idx of anchor.endPath) {
    endNode = endNode?.childNodes[idx] ?? null;
  }
  
  if (!startNode || !endNode) return [];

  // Ensure we have text nodes
  const start = startNode.nodeType === Node.TEXT_NODE 
    ? startNode as Text 
    : firstTextNodeWithin(startNode);
  const end = endNode.nodeType === Node.TEXT_NODE
    ? endNode as Text
    : firstTextNodeWithin(endNode, 'backward');
    
  if (!start || !end) return [];

  // Create range and get rects
  const range = document.createRange();
  range.setStart(start, anchor.startOffset);
  range.setEnd(end, anchor.endOffset);

  const base = root.getBoundingClientRect();
  return Array.from(range.getClientRects()).map(rect =>
    new DOMRect(
      rect.left - base.left,
      rect.top - base.top,
      rect.width,
      rect.height
    )
  );
}
```

### 9.4 Visual Components

#### Pin Layer (Left Gutter)
```tsx
<div className="absolute inset-y-0 left-[-40px] w-4">
  {clusters.map((cluster, i) => {
    if (cluster.items.length > 3 && !expanded) {
      // Collapsed cluster badge
      return (
        <div style={{ top: cluster.top }}>
          <button onClick={() => expand(cluster)}>
            {cluster.items.length}
          </button>
        </div>
      );
    }
    
    // Individual pins with collision avoidance
    const positions = solveCollisions(cluster.items.map(id => ({
      id,
      top: positions[id]?.top ?? 0
    })));
    
    return positions.map(pos => (
      <button
        style={{ top: pos.top }}
        onClick={() => scrollToThread(threads.find(t => t.id === pos.id))}
        className={activeId === pos.id ? "active" : ""}
      />
    ));
  })}
</div>
```

#### Comment Rail (Right Side)
```tsx
<div className="absolute right-0 w-[320px]" style={{ height: railHeight }}>
  {threads.map(thread => {
    const pos = positions[thread.id];
    return (
      <button
        style={{ top: pos?.top ?? 0 }}
        onClick={() => {
          setActiveThread(thread);
          scrollToThread(thread);
        }}
        className={clsx(
          "absolute right-0 w-[170px] text-left px-2 py-1 rounded-md",
          openId === thread.id && "ring-2 ring-indigo-400"
        )}
      >
        {thread.comments[0]?.body.slice(0, 60)}
      </button>
    );
  })}
</div>
```

#### Selection Adder Bubble
```tsx
{adder && (
  <button
    className="absolute z-30 bg-indigo-300 rounded-xl p-1.5"
    style={{
      top: adder.rect.top + 6,
      left: adder.rect.left + adder.rect.width / 2 - 12
    }}
    onMouseDown={(e) => e.preventDefault()}  // Keep selection
    onClick={() => {
      setBubble({
        anchor: adder.anchor,
        rect: adder.rect,
        text: window.getSelection()?.toString().slice(0, 280) ?? ""
      });
      setAdder(null);
    }}
  >
    <CommentIcon />
  </button>
)}
```

#### Comment Composer
```tsx
{bubble && (
  <div
    className="absolute z-30 w-80 bg-slate-100/30 backdrop-blur rounded-xl border-2"
    style={{
      top: bubble.rect.top - 56,
      left: bubble.rect.left + 100
    }}
  >
    <div className="p-3 border-b text-xs text-neutral-600">
      {bubble.text}
    </div>
    <div className="p-2 space-y-2">
      <textarea
        value={draftBody}
        onChange={(e) => setDraftBody(e.target.value)}
        placeholder="Add a comment…"
        rows={3}
      />
      <div className="flex justify-end gap-4">
        <button onClick={() => setBubble(null)}>Cancel</button>
        <button onClick={createThread}>Comment</button>
      </div>
    </div>
  </div>
)}
```

### 9.5 Collision Avoidance

```typescript
type PinPos = { id: string; top: number; left: number };

function solveCollisions(items: PinPos[], minGap = 18): PinPos[] {
  // Sort by vertical position
  const sorted = [...items].sort((a, b) => a.top - b.top);
  
  // Push down overlapping items
  let lastBottom = -Infinity;
  for (const pin of sorted) {
    if (pin.top < lastBottom + minGap) {
      pin.top = lastBottom + minGap;
    }
    lastBottom = pin.top;
  }
  
  return sorted;
}

function clusterByTop(
  positions: Record<string, DOMRect | undefined>,
  threshold = 40
): Cluster[] {
  const entries = Object.entries(positions)
    .filter(([, r]) => r)
    .map(([id, r]) => ({ id, top: r!.top }))
    .sort((a, b) => a.top - b.top);

  const clusters: Cluster[] = [];
  
  for (const entry of entries) {
    const last = clusters[clusters.length - 1];
    
    if (!last || Math.abs(entry.top - last.top) > threshold) {
      // New cluster
      clusters.push({ top: entry.top, items: [entry.id] });
    } else {
      // Add to existing cluster
      last.items.push(entry.id);
      // Adjust centroid
      last.top = (last.top * (last.items.length - 1) + entry.top) / last.items.length;
    }
  }
  
  return clusters;
}
```

---

## 10. Social Feed Integration

The article system integrates with Mesh's social-media-style feed to create a Substack/Bluesky discovery experience. When articles are published, they appear as discoverable posts in the home feed.

### 10.1 Feed Integration Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      ARTICLE → SOCIAL FEED PIPELINE                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌────────────────┐                                                             │
│  │  Article       │                                                             │
│  │  (Published)   │                                                             │
│  └───────┬────────┘                                                             │
│          │                                                                       │
│          │ POST /api/articles/[id]/publish                                      │
│          │                                                                       │
│          ▼                                                                       │
│  ┌────────────────────────────────────────────────────────────────────────┐    │
│  │                        PUBLISH ROUTE                                    │    │
│  │                                                                         │    │
│  │  1. Update article (status=PUBLISHED)                                  │    │
│  │  2. Create revision snapshot                                           │    │
│  │  3. createFeedPost({ type: ARTICLE, content: ArticlePayload })  ──────┼────┤
│  └────────────────────────────────────────────────────────────────────────┘    │
│                                                                     │           │
│                                                                     ▼           │
│                                                    ┌─────────────────────┐     │
│                                                    │     FeedPost        │     │
│                                                    │                     │     │
│                                                    │  type: ARTICLE      │     │
│                                                    │  content: JSON      │     │
│                                                    │  articleId: FK      │     │
│                                                    │  author_id          │     │
│                                                    └──────────┬──────────┘     │
│                                                               │                 │
│  ┌───────────────────────────────────────────────────────────┼────────────────┐│
│  │                          HOME FEED                         │                ││
│  │                                                            ▼                ││
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────────┐    ││
│  │  │  PostCard   │    │  PostCard   │    │  PostCard (type=ARTICLE)    │    ││
│  │  │  (TEXT)     │    │  (IMAGE)    │    │                             │    ││
│  │  │             │    │             │    │  ┌───────────────────────┐  │    ││
│  │  │             │    │             │    │  │    ArticleCard        │  │    ││
│  │  │             │    │             │    │  │                       │  │    ││
│  │  │             │    │             │    │  │  • Hero Image         │  │    ││
│  │  │             │    │             │    │  │  • Title              │  │    ││
│  │  │             │    │             │    │  │  • Excerpt            │  │    ││
│  │  │             │    │             │    │  │  • Preview Modal      │  │    ││
│  │  │             │    │             │    │  │  • Read Link          │  │    ││
│  │  │             │    │             │    │  └───────────────────────┘  │    ││
│  │  └─────────────┘    └─────────────┘    └─────────────────────────────┘    ││
│  └────────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 10.2 Article Feed Payload

When an article is published, a structured JSON payload is created:

```typescript
// Payload stored in FeedPost.content for ARTICLE type
interface ArticleFeedPayload {
  kind: 'article';              // Type discriminator
  articleId: string;            // Article UUID
  slug: string;                 // URL-friendly identifier
  title: string;                // Article title
  heroImageKey: string | null;  // S3 key for hero image
  excerpt: string | null;       // First ~1200 chars
  readingTime: number | null;   // Estimated minutes
}

// Created in publish route
const payload: ArticleFeedPayload = {
  kind: 'article',
  articleId: updated.id,
  slug: updated.slug,
  title: updated.title,
  heroImageKey: updated.heroImageKey ?? null,
  excerpt: updated.excerpt ?? null,
  readingTime: updated.readingTime ?? null
};

// Stored via createFeedPost
await createFeedPost({
  postType: feed_post_type.ARTICLE,
  caption: updated.title ?? 'Untitled',
  imageUrl: updated.heroImageKey ?? undefined,
  content: JSON.stringify(payload),
  articleId: updated.id,
});
```

### 10.3 Home Page Component

**Location:** `app/(root)/(standard)/page.tsx`

```typescript
export default async function Home() {
  // Fetch feed posts (includes articles)
  const posts = await fetchFeedPosts();
  const user = await getUserFromCookies();
  if (!user) redirect("/login");

  return (
    <div>
      <Modal />
      {posts.length === 0 ? (
        <p className="no-result">Nothing found</p>
      ) : (
        <RealtimeFeed
          initialPosts={posts}
          initialIsNext={false}
          roomId="global"
          postTypes={[]}
          currentUserId={user.userId}
          animated={false}
        />
      )}
    </div>
  );
}
```

### 10.4 RealtimeFeed Component

**Location:** `components/shared/RealtimeFeed.tsx`

The RealtimeFeed handles infinite scroll loading and renders posts using PostCard:

```typescript
interface Props {
  initialPosts: any[];
  initialIsNext: boolean;
  roomId?: string;
  postTypes?: realtime_post_type[];
  currentUserId?: bigint;
  animated?: boolean;
}

export default function RealtimeFeed({
  initialPosts,
  roomId,
  postTypes,
  currentUserId,
  animated = false,
}: Props) {
  // Configure fetch function based on room/type
  const fetchPage = useMemo(() => {
    if (roomId && postTypes && postTypes.length > 0) {
      // Room-specific realtime posts
      return async (page: number) => {
        const params = new URLSearchParams({
          roomId,
          page: page.toString(),
          types: postTypes.join(","),
        });
        const res = await fetch(`/api/realtime-posts?${params.toString()}`);
        return res.json();
      };
    }
    // Global feed (includes articles)
    return async (_page: number) => {
      const res = await fetch(`/api/feed`);
      return { posts: await res.json(), isNext: false };
    };
  }, [roomId, postTypes]);

  // Infinite scroll hook
  const { posts, loaderRef, loading } = useInfiniteRealtimePosts(
    fetchPage, initialPosts, initialIsNext
  );

  // Map database rows to UI props
  const isRealtime = Boolean(roomId && postTypes?.length);
  const isFeed = roomId === "global" && (!postTypes || postTypes.length === 0);
  const mapper = isRealtime ? mapRealtimePost : mapFeedPost;

  return (
    <section className="flex flex-col gap-8">
      {posts.map((post) => {
        const mapped = mapper(post);
        return (
          <PostCard
            key={post.id.toString()}
            {...mapped}
            currentUserId={currentUserId}
            isRealtimePost={isRealtime}
            isFeedPost={isFeed}
          />
        );
      })}
      <div ref={loaderRef} className="h-1" />
      {loading && <Spinner />}
    </section>
  );
}
```

### 10.5 PostCard Article Rendering

**Location:** `components/cards/PostCard.tsx`

PostCard is a polymorphic component that renders different post types. For articles:

```typescript
// Type guard for article payload
type ArticleFeedPayload = {
  kind: 'article';
  slug: string;
  title?: string;
  heroImageKey?: string | null;
  excerpt?: string | null;
  readingTime?: number | null;
  articleId?: string | null;
};

const isArticleMeta = (v: any): v is ArticleFeedPayload =>
  v && typeof v === 'object' && v.kind === 'article' && typeof v.slug === 'string';

// In PostCard component
{type === "ARTICLE" && (() => {
  const meta = parseJson<any>(content);

  // New structured payload
  if (isArticleMeta(meta)) {
    return (
      <div className="w-full flex px-8 flex-1 justify-center items-center">
        <ArticleCard
          postId={id}
          meta={{
            articleId: meta.articleId ?? null,
            slug: meta.slug,
            title: meta.title ?? "Untitled",
            heroImageKey: meta.heroImageKey ?? null,
            excerpt: meta.excerpt ?? null,
            readingTime: meta.readingTime ?? null,
          }}
        />
      </div>
    );
  }

  // Legacy fallback: content === "/article/slug"
  if (typeof content === 'string' && content.startsWith('/article/')) {
    return (
      <Link href={content}>
        <button className="px-2 py-1 border rounded text-sm">View article</button>
      </Link>
    );
  }

  return null;
})()}
```

### 10.6 ArticleCard Component

**Location:** `components/article/ArticleCard.tsx`

A rich card display for articles in the feed:

```typescript
export type ArticleMeta = {
  articleId?: string | null;
  slug: string;
  title: string;
  heroImageKey?: string | null;
  excerpt?: string | null;
  readingTime?: number | null;
};

export default function ArticleCard({ 
  meta, 
  postId 
}: { 
  meta: ArticleMeta; 
  postId: bigint;
}) {
  const href = `/article/${meta.slug}`;

  return (
    <div className="flex flex-1 w-[500px] h-[500px] shadow-xl rounded-xl border border-amber-400">
      <div className="rounded-xl flex-1 border bg-white/70 overflow-y-auto w-full h-full">
        
        {/* Hero Image */}
        {meta.heroImageKey && (
          <div className="relative w-full">
            <Image
              src={meta.heroImageKey}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        )}
        
        <div className="py-4 px-5">
          <div className="flex">
            {/* Title with link */}
            <Link href={href} className="block">
              <h3 className="text-[1.32rem] tracking-wider font-semibold leading-snug line-clamp-2">
                {meta.title}
              </h3>
            </Link>
            
            {/* Action buttons */}
            <div className="flex w-full mb-2 justify-end items-end gap-2">
              {/* Preview Modal */}
              <Dialog>
                <DialogTrigger asChild>
                  <button className="px-1 py-0 text-slate-600 border rounded text-[.7rem]">
                    Preview
                  </button>
                </DialogTrigger>
                <ArticlePostModal slug={meta.slug} />
              </Dialog>
              
              {/* Read Link */}
              <Link href={href} className="px-1 py-0 border rounded text-[.7rem]">
                Read
              </Link>
            </div>
          </div>
          
          <hr />
          
          {/* Excerpt */}
          {meta.excerpt && (
            <p className="mt-2 text-[.9rem] text-neutral-800 line-clamp-10">
              {meta.excerpt}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
```

### 10.7 Feed Fetching

**Location:** `lib/actions/feed.actions.ts`

```typescript
export async function fetchFeedPosts() {
  // Clean up expired posts
  await archiveExpiredFeedPosts();

  const user = await getUserFromCookies();
  const currentUserId = user?.userId ? BigInt(user.userId) : null;

  const rows = await prisma.feedPost.findMany({
    where: {
      isPublic: true,
      parent_id: null,  // Top-level posts only
      OR: [
        { expiration_date: null },
        { expiration_date: { gt: new Date() } },
      ],
    },
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      type: true,
      content: true,          // Contains article payload JSON
      library_post_id: true,
      stack_id: true,
      image_url: true,
      portfolio: true,
      video_url: true,
      caption: true,
      like_count: true,
      _count: { select: { children: true } },
      expiration_date: true,
      created_at: true,
      predictionMarket: { /* ... */ },
      productReview: { /* ... */ },
      author: {
        select: { id: true, name: true, image: true, username: true }
      },
      // Current user's like status
      likes: currentUserId ? {
        where: { user_id: currentUserId },
        take: 1
      } : false,
    },
  });

  return rows.map(row => ({
    ...row,
    currentUserLike: row.likes?.[0] ?? null,
  }));
}
```

### 10.8 Post Mapping

**Location:** `lib/transform/post.ts`

```typescript
export const mapFeedPost = (dbRow: any): BasePost => ({
  id: dbRow.id,
  canonicalId: dbRow.type === "PREDICTION"
    ? dbRow.id
    : dbRow.postId ?? dbRow.id,
  author: dbRow.author,
  type: dbRow.type,
  content: dbRow.content ?? null,        // Article payload JSON here
  roomPostContent: dbRow.roomPostContent ?? null,
  image_url: dbRow.image_url ?? null,
  portfolio: dbRow.portfolio ?? null,
  productReview: dbRow.productReview ?? null,
  video_url: dbRow.video_url ?? null,
  caption: dbRow.caption ?? null,
  likeCount: dbRow.like_count ?? 0,
  commentCount: dbRow._count?.children ?? 0,
  expirationDate: dbRow.expiration_date ?? null,
  currentUserLike: dbRow.currentUserLike ?? null,
  createdAt: dbRow.created_at
    ? new Date(dbRow.created_at).toISOString()
    : new Date().toISOString(),
});
```

### 10.9 Feed Post Types

```typescript
// Prisma enum for post types
enum feed_post_type {
  TEXT
  IMAGE
  IMAGE_COMPUTE
  VIDEO
  MUSIC
  GALLERY
  DRAW
  LIVECHAT
  ENTROPY
  PORTFOLIO
  PRODUCT_REVIEW
  PREDICTION
  ROOM_CANVAS
  LIBRARY
  ARTICLE           // <-- Article post type
}
```

### 10.10 Discovery Features Summary

| Feature | Implementation |
|---------|----------------|
| **Rich Article Cards** | `ArticleCard` with hero image, title, excerpt |
| **Preview Modal** | `ArticlePostModal` for quick preview without navigation |
| **Direct Read Link** | Link to full article reader |
| **Social Actions** | Like, Share, Comment (inherited from PostCard) |
| **Infinite Scroll** | `useInfiniteRealtimePosts` hook |
| **Author Attribution** | Profile image, name, timestamp |
| **Reading Time** | Displayed in card metadata |

---

## 11. Deliberation Integration

### 11.1 Integration Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ARTICLE ↔ DELIBERATION INTEGRATION                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐                         ┌─────────────────────────────┐   │
│  │   Article   │                         │        Deliberation         │   │
│  │             │                         │                             │   │
│  │  id         │◄─────────────────┐     │  id                         │   │
│  │  title      │                  │     │  hostType = 'article'       │   │
│  │  astJson    │                  └─────│  hostId = article.id        │   │
│  │  roomId? ───┼───────────┐            │  createdById                │   │
│  │             │           │            │  agoraRoomId ────────┐      │   │
│  └─────────────┘           │            │  title               │      │   │
│                            │            │  tags                │      │   │
│                            │            └──────────────────────┼──────┘   │
│                            │                                   │          │
│                            ▼                                   ▼          │
│                  ┌─────────────────┐              ┌─────────────────┐    │
│                  │   AgoraRoom     │◄─────────────│  DebateSheet    │    │
│                  │                 │              │                 │    │
│                  │  id             │              │  id             │    │
│                  │  slug           │              │  deliberationId │    │
│                  │  title          │              │  roomId         │    │
│                  │  representationRule            │  scope          │    │
│                  └─────────────────┘              │  roles          │    │
│                                                   └─────────────────┘    │
│                                                                           │
│  Navigation:                                                              │
│    Article ──[Discussion Page ↗]──▶ Deliberation Page                    │
│    Deliberation ──[← Return]──▶ Article                                  │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 10.2 Deliberation Creation

```typescript
// lib/deepdive/upsert.ts
export async function getOrCreateDeliberationId(
  hostType: 'article' | 'post' | 'room_thread' | ...,
  hostId: string,
  roomId: string | null,
  createdById: string
): Promise<string> {
  // Check for existing deliberation
  const existing = await prisma.deliberation.findFirst({
    where: { hostType, hostId },
    select: { id: true }
  });
  
  if (existing) return existing.id;

  // Determine voting rule
  const rule = roomId
    ? (await prisma.agoraRoom.findUnique({
        where: { id: roomId },
        select: { representationRule: true }
      }))?.representationRule ?? 'utilitarian'
    : 'utilitarian';

  // Create new deliberation
  const created = await prisma.deliberation.create({
    data: {
      hostType,
      hostId,
      roomId: roomId ?? undefined,
      createdById: String(createdById),
      rule
    },
    select: { id: true }
  });
  
  return created.id;
}
```

### 10.3 Deliberation Spawn (Full Chain)

```typescript
// app/api/deliberations/spawn/route.ts
export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  const { hostType, hostId, tags, title } = await req.json();

  // Step 1: Create AgoraRoom
  const roomSlug = await ensureUniqueSlug(
    slugify(title?.slice(0, 30) || `room-${Date.now()}`)
  );
  
  const room = await prisma.agoraRoom.create({
    data: {
      slug: roomSlug,
      title: title || `Room ${Date.now()}`,
      visibility: 'public'
    }
  });

  // Step 2: Create Deliberation
  const deliberation = await prisma.deliberation.create({
    data: {
      hostType,
      hostId,
      createdById: String(userId),
      agoraRoomId: room.id,
      title,
      tags: tags || []
    }
  });

  // Step 3: Create DebateSheet
  await prisma.debateSheet.create({
    data: {
      id: `delib:${deliberation.id}`,
      title: title || `Delib ${deliberation.id.slice(0, 6)}`,
      scope: 'deliberation',
      roles: ['Proponent', 'Opponent', 'Curator'],
      deliberationId: deliberation.id,
      roomId: room.id,
      createdById: String(userId)
    }
  });

  emitBus("deliberations:created", { id: deliberation.id });
  
  return NextResponse.json({
    ok: true,
    id: deliberation.id,
    redirect: `/deliberation/${deliberation.id}`
  });
}
```

### 10.4 Embedded Deliberation Panel

```tsx
// In ArticleReaderWithPins
{deliberationId && (
  <section className="relative mt-0">
    <DeepDiveBackdrop attach="absolute" />
    
    <h2 className="text-4xl font-semibold text-center my-4">
      Discussion
    </h2>
    
    <div className="border-b border-slate-700/70 w-[75%] mx-auto mb-2" />
    
    <div className="px-10">
      <RhetoricProvider>
        <DialogueTargetProvider>
          <DeepDivePanel deliberationId={deliberationId} />
        </DialogueTargetProvider>
      </RhetoricProvider>
    </div>
  </section>
)}
```

### 10.5 Navigation Between Article and Deliberation

**Article → Deliberation:**
```tsx
// In article reader header
<NextLink
  href={`/deliberation/${deliberationId}`}
  className="py-2 px-2 bg-white/20 rounded-xl"
  prefetch
>
  Discussion Page ↗
</NextLink>
```

**Deliberation → Article:**
```tsx
// app/deliberation/[id]/page.tsx
const article = delib.hostType === "article"
  ? await prisma.article.findUnique({
      where: { id: delib.hostId },
      select: { slug: true, title: true }
    })
  : null;

// In render
{article && (
  <NextLink
    href={`/article/${article.slug}`}
    className="absolute left-0 top-0 text-xs font-semibold"
  >
    ← Return{article.title ? `: ${article.title}` : ""}
  </NextLink>
)}
```

---

## 12. Security & Authorization

### 11.1 Authentication Flow

```typescript
// All API routes use cookie-based auth
import { getUserFromCookies } from '@/lib/serverutils';

export async function handler(req: Request) {
  const user = await getUserFromCookies();
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthenticated' },
      { status: 401 }
    );
  }
  
  // Continue with authenticated request
  const userId = user.userId.toString();
}
```

### 11.2 Ownership Verification

```typescript
// Pattern for all article mutations
async function verifyOwnership(articleId: string, userId: string) {
  const article = await prisma.article.findUnique({
    where: { id: articleId }
  });
  
  if (!article || article.authorId !== userId) {
    return { error: 'Not found', status: 404 };
  }
  
  return { article };
}

// Usage in API routes
export async function PATCH(req, { params }) {
  const user = await getUserFromCookies();
  if (!user) return unauthorized();
  
  const { article, error, status } = await verifyOwnership(
    params.id,
    user.userId.toString()
  );
  
  if (error) return NextResponse.json({ error }, { status });
  
  // Proceed with update
}
```

### 11.3 Content Sanitization

```typescript
// HTML sanitization for pasted content
import DOMPurify from 'dompurify';

function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style', 'id', 'name']
  });
}
```

### 11.4 Input Validation

```typescript
// Zod schemas for API inputs
import { z } from 'zod';

const CreateArticleSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  slug: z.string().optional(),
  template: z.string().optional(),
  heroImageKey: z.string().nullable().optional(),
  astJson: z.unknown().optional()
});

const PatchDraftSchema = z.object({
  astJson: z.any().optional(),
  template: z.string().optional(),
  heroImageKey: z.string().nullable().optional(),
  title: z.string().min(1).max(200).optional()
});
```

### 11.5 Annotation Access Control

```typescript
// Check if annotations are allowed
export async function GET(req, { params }) {
  const article = await prisma.article.findUnique({
    where: { id: params.id }
  });
  
  if (!article) return notFound();
  
  // Respect article setting
  if (article.allowAnnotations === false) {
    return NextResponse.json([], { status: 200 });
    // Or return 403 if you want to block completely
  }
  
  // Return threads
}
```

---

## 13. Performance Considerations

### 12.1 Server-Side Rendering

- Articles are rendered server-side for fast initial load
- TipTap `generateHTML` produces static HTML
- No hydration required for article content (static HTML)
- Interactive elements (annotations) hydrate on client

### 12.2 Autosave Optimization

```typescript
// Debouncing
const debouncedSave = useDebouncedCallback(saveDraft, 800);

// Deduplication
if (JSON.stringify(payload) === lastSentHash.current) return;

// Abort-on-change
inflight.current?.abort();
const ac = new AbortController();
inflight.current = ac;

await fetch(url, { signal: ac.signal });
```

### 12.3 SWR Infinite Scroll

```typescript
// Parallel fetching for better UX
useSWRInfinite(getKey, fetcher, {
  parallel: true,           // Fetch pages in parallel
  persistSize: true,        // Keep size across re-mounts
  revalidateFirstPage: true // Always fresh first page
});

// Optimistic updates
mutate(pages => /* transform */, { revalidate: false });
```

### 12.4 Annotation Performance

- Positions computed in `useMemo` with dependencies on `[threads, html, tick]`
- Scroll/resize events debounced via `tick` counter
- ResizeObserver for efficient container monitoring
- Collision solving is O(n log n) due to sorting

### 12.5 Database Indexes

```prisma
model Article {
  @@index([authorId, deletedAt, updatedAt])
  @@index([authorId, status, updatedAt])
}

model CommentThread {
  @@index([articleId])
}

model Comment {
  @@index([threadId])
}
```

---

## 14. Appendices

### Appendix A: File Reference

| Path | Purpose |
|------|---------|
| `components/article/ArticleEditor.tsx` | Main editor component |
| `components/article/ArticleReader.tsx` | Base reader wrapper |
| `components/article/ArticleReaderWithPins.tsx` | Full reader with annotations |
| `components/article/ArticleCard.tsx` | Article display card for social feed |
| `components/article/CommentModal.tsx` | Comment thread modal |
| `components/article/editor/Toolbar.tsx` | Editor toolbar |
| `components/article/editor/SlashCommand.tsx` | Slash command extension |
| `components/cards/PostCard.tsx` | Universal post card (handles ARTICLE type) |
| `components/shared/RealtimeFeed.tsx` | Infinite scroll feed component |
| `app/(editor)/article/new/page.tsx` | Create new article |
| `app/(editor)/article/by-id/[id]/edit/page.tsx` | Edit article |
| `app/article/(by-key)/[key]/page.tsx` | View article |
| `app/(root)/(standard)/page.tsx` | Home page feed |
| `app/(root)/(standard)/profile/articles/` | Dashboard |
| `app/api/articles/` | API routes |
| `app/api/feed/route.ts` | Feed API endpoint |
| `lib/tiptap/extensions/shared.ts` | Shared TipTap extensions |
| `lib/deepdive/upsert.ts` | Deliberation creation |
| `lib/article/text.ts` | Text extraction utilities |
| `lib/article/wrapSections.ts` | Section processing |
| `lib/actions/feed.actions.ts` | Feed fetching actions |
| `lib/actions/feedpost.actions.ts` | Feed post creation |
| `lib/transform/post.ts` | Post data mappers |
| `types/comments.ts` | TypeScript types |

### Appendix B: Environment Variables

```env
# Required for article system
DATABASE_URL=          # PostgreSQL connection
SUPABASE_URL=          # For presigned URLs
SUPABASE_ANON_KEY=     # Supabase auth
```

### Appendix C: API Quick Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/articles` | GET | List user's articles |
| `/api/articles` | POST | Create new draft |
| `/api/articles/[id]` | GET | Get article by ID |
| `/api/articles/[id]` | PATCH | Update metadata |
| `/api/articles/[id]` | DELETE | Soft delete |
| `/api/articles/[id]/draft` | PATCH | Save draft content |
| `/api/articles/[id]/publish` | POST | Publish article |
| `/api/articles/[id]/restore` | POST | Restore from trash |
| `/api/articles/[id]/threads` | GET | List comment threads |
| `/api/articles/[id]/threads` | POST | Create comment thread |
| `/api/deliberations/spawn` | POST | Create deliberation chain |

### Appendix D: Glossary

| Term | Definition |
|------|------------|
| **AST** | Abstract Syntax Tree - TipTap document JSON structure |
| **Anchor** | DOM path-based reference to a text selection |
| **Thread** | Comment thread attached to an anchor |
| **Deliberation** | Structured discourse space linked to content |
| **Template** | Visual layout preset for articles |
| **Pin** | Visual marker for a comment thread in the gutter |

---

## Document Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-12-15 | Initial comprehensive documentation |

---

*This document is part of the Mesh Platform Architecture Documentation Suite.*
*For questions or updates, consult the ArgumentChainDevelopmentDocuments folder.*
