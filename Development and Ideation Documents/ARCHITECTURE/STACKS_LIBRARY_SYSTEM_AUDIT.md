# Stacks/Library System - Audit & Review Document

## Mesh Platform - System Discovery & Scope Analysis

**Document Type:** Pre-Architecture Audit  
**Version:** 1.0  
**Last Updated:** December 15, 2025  
**Purpose:** Comprehensive review to inform final architecture documentation

---

## 1. Executive Summary

The Stacks/Library system is Mesh's document management and knowledge organization infrastructure. It enables users to upload, organize, and cite PDFs and other documents, while providing deep integration with the deliberation engine for evidence-based argumentation.

### 1.1 Core Concepts

| Concept | Definition |
|---------|------------|
| **Stack** | A curated collection of documents (LibraryPosts) organized by a user |
| **LibraryPost** | Individual document (primarily PDF) with thumbnails and metadata |
| **Source** | Canonical reference entity for citations (URL, DOI, or LibraryPost) |
| **Citation** | Link between a Source and a target (argument, claim, comment, etc.) |
| **Deliberation Host** | A Stack can host a deliberation via `library_stack` host type |

### 1.2 Key Integration Points

1. **Deliberation Engine** - Stacks host deliberations; comments can be "lifted" to claims
2. **Evidence System** - Citations flow from stacks to arguments/claims via Source model
3. **Feed System** - LIBRARY post type displays stacks/documents in social feed
4. **Discussion Thread** - Each stack has a FeedPost-based discussion thread

---

## 2. Data Model Discovery

### 2.1 Primary Models

#### Stack Model
```prisma
model Stack {
  id             String              @id @default(cuid())
  owner_id       BigInt
  name           String
  description    String?
  is_public      Boolean             @default(false)
  order          String[]            // Ordered list of LibraryPost IDs
  created_at     DateTime            @default(now())
  parent_id      String?             // Hierarchical stacks
  slug           String?             @unique
  
  owner          User
  posts          LibraryPost[]
  parent         Stack?              @relation("StackHierarchy")
  children       Stack[]             @relation("StackHierarchy")
  feedPosts      FeedPost[]
  collaborators  StackCollaborator[]
  subscribers    StackSubscription[]
  StackReference StackReference[]

  @@unique([owner_id, name])
}
```

#### LibraryPost Model
```prisma
model LibraryPost {
  id          String   @id @default(cuid())
  uploader_id BigInt
  stack_id    String?
  title       String?
  page_count  Int
  file_url    String           // S3/Supabase URL
  thumb_urls  String[]         // Generated thumbnails
  created_at  DateTime @default(now())

  annotations Annotation[]
  stack       Stack?
  uploader    User
  feedPosts   FeedPost[]
}
```

#### Source Model (Citation Infrastructure)
```prisma
model Source {
  id            String    @id @default(cuid())
  kind          String    // 'article' | 'book' | 'web' | 'dataset' | 'video' | 'other'
  title         String?
  authorsJson   Json?     // [{family, given}] CSL-esque
  year          Int?
  container     String?   // journal / site / channel
  publisher     String?
  doi           String?   @unique
  url           String?   @unique
  platform      String?   // 'arxiv' | 'substack' | 'youtube' | ...
  libraryPostId String?   // Link to LibraryPost (Stack item)
  fingerprint   String?   // SHA1 dedup key
  
  citations Citation[]
  ratings   SourceRating[]
}
```

#### Citation Model
```prisma
model Citation {
  id          String   @id @default(cuid())
  targetType  String   // 'argument' | 'claim' | 'card' | 'comment' | 'move' | 'proposition'
  targetId    String
  sourceId    String
  locator     String?  // 'p. 13', 'fig. 2', '08:14'
  quote       String?  // ≤280 chars
  note        String?
  relevance   Int?     // 1..5

  source Source @relation(fields: [sourceId], references: [id])
  
  @@unique([targetType, targetId, sourceId, locator])
}
```

### 2.2 Supporting Models

| Model | Purpose |
|-------|---------|
| `StackCollaborator` | RBAC for stack editing (OWNER, EDITOR, VIEWER) |
| `StackSubscription` | User subscriptions for notifications |
| `SourceRating` | Community quality ratings (1-10 scale) |
| `Annotation` | PDF annotations (page, rect, text) |
| `StackReference` | Cross-deliberation references via stacks |

---

## 3. Component Architecture Discovery

### 3.1 Stack Page Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `SortablePdfGrid` | `components/stack/SortablePdfGrid.tsx` | Drag-and-drop PDF tile grid |
| `StackDiscussion` | `components/stack/StackDiscussion.tsx` | Server-rendered comment thread |
| `LiftToDebateButton` | `components/stack/LiftToDebateButton.tsx` | Promotes comment to deliberation claim |
| `CommentComposer` | `components/stack/CommentComposer.tsx` | Comment input with citation attachment |

### 3.2 Citation Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `CitePickerInlinePro` | `components/citations/CitePickerInlinePro.tsx` | Full citation picker (URL/DOI/Library tabs) |
| `CitationCollector` | `components/citations/CitationCollector.tsx` | Collect citations before target exists |
| `LibrarySearchModal` | `components/citations/LibrarySearchModal.tsx` | Search user's library items |
| `CitePickerModal` | `components/citations/CitePickerModal.tsx` | Modal wrapper for CitePickerInlinePro |
| `SourcesSidebar` | `components/citations/SourcesSidebar.tsx` | Display attached sources in sidebar |
| `SourceChip` | `components/citations/SourceChip.tsx` | Inline source badge |

### 3.3 Feed Integration

| Component | Location | Purpose |
|-----------|----------|---------|
| `LibraryCard` | `components/cards/LibraryCard.tsx` | Renders stack/single PDF in feed |
| `StackCarousel` | `components/cards/StackCarousel.tsx` | Carousel of stack thumbnails |

### 3.4 Evidence/Deliberation Integration

| Component | Location | Purpose |
|-----------|----------|---------|
| `EvidenceList` | `components/evidence/EvidenceList.tsx` | All sources in a deliberation with metrics |

---

## 4. API Routes Discovery

### 4.1 Library Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/library/upload` | POST | Upload PDFs with optional previews |
| `/api/library/search` | GET | Search user's library items |
| `/api/library/status` | GET | Check processing status |
| `/api/library/import` | POST | Import from external sources |

### 4.2 Citation Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/citations/resolve` | POST | Find or create Source from URL/DOI/LibraryPost |
| `/api/citations/attach` | POST | Attach Source to target (claim/argument/etc.) |
| `/api/citations/batch` | GET | Fetch citations for multiple targets |
| `/api/citations/format` | GET | Format citations (MLA, APA, etc.) |
| `/api/citations/verify` | POST | Verify URL accessibility |
| `/api/citations/zotero` | POST | Import from Zotero |

### 4.3 Stack Actions (Server Actions)

| Action | File | Purpose |
|--------|------|---------|
| `getStackPageData` | `stack.actions.ts` | Full stack data with posts, viewer context |
| `toggleStackSubscription` | `stack.actions.ts` | Subscribe/unsubscribe |
| `addCollaborator` | `stack.actions.ts` | Add editor/viewer |
| `removeCollaborator` | `stack.actions.ts` | Remove collaborator |
| `setStackOrder` | `stack.actions.ts` | Set custom order of posts |
| `reorderStack` | `stack.actions.ts` | Move single post up/down |
| `addStackComment` | `stack.actions.ts` | Add comment to discussion thread |
| `deleteStackComment` | `stack.actions.ts` | Delete comment |
| `removeFromStack` | `stack.actions.ts` | Detach LibraryPost from stack |

### 4.4 Deliberation Integration Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/comments/lift` | POST | Promote comment to claim in deliberation |
| `/api/deliberations/[id]/sources` | GET | All sources used in a deliberation |
| `/api/sources/[id]/rate` | POST | Rate source quality |

---

## 5. Data Flow Patterns

### 5.1 Upload Flow

```
User selects PDFs
        │
        ▼
┌────────────────────────────────────────────────────────────┐
│  POST /api/library/upload                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 1. Authenticate user                                 │  │
│  │ 2. getOrCreateStackId (stack-helpers.ts)             │  │
│  │ 3. Upload PDF to Supabase storage (pdfs bucket)      │  │
│  │ 4. Extract/upload previews (pdf-thumbs bucket)       │  │
│  │ 5. Create LibraryPost record                         │  │
│  │ 6. Update stack.order array                          │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
        │
        ▼
LibraryPost created with:
  - file_url (signed Supabase URL)
  - thumb_urls (preview images)
  - stack_id (parent stack)
```

### 5.2 Citation Attachment Flow

```
User clicks "Cite" on PDF tile
        │
        ▼
CiteButton dispatches CustomEvent("composer:cite")
        │
        ▼
CommentComposer.useEffect handler
        │
        ├─── mode: "quick" ──────────────────────────┐
        │                                            │
        │    POST /api/citations/resolve             │
        │    { libraryPostId: "..." }                │
        │         │                                  │
        │         ▼                                  │
        │    Source created/found                    │
        │         │                                  │
        │         ▼                                  │
        │    POST /api/citations/attach              │
        │    { targetType: "comment",                │
        │      targetId: commentId,                  │
        │      sourceId: source.id }                 │
        │                                            │
        └─── mode: "details" ────────────────────────┤
                                                     │
             CitePickerModal opens                   │
             User fills locator/quote/note           │
             Same resolve → attach flow              │
```

### 5.3 Lift to Debate Flow

```
User clicks "Deliberate" on stack comment
        │
        ▼
┌────────────────────────────────────────────────────────────┐
│  POST /api/comments/lift                                   │
│  { commentId, hostType: "stack", hostId: stackId }         │
├────────────────────────────────────────────────────────────┤
│  1. Normalize hostType → DeliberationHostType.library_stack│
│  2. Find or create Deliberation                            │
│  3. Fetch comment text from FeedPost                       │
│  4. Create Claim with text                                 │
│  5. Create DialogueMove (ASSERT) for provenance            │
│  6. Emit bus events for real-time updates                  │
│  7. Return { deliberationId, claimId }                     │
└────────────────────────────────────────────────────────────┘
        │
        ▼
Client redirects to /deliberation/{deliberationId}
```

### 5.4 Evidence Aggregation Flow

```
DeepDivePanelV2 → Sources Tab
        │
        ▼
EvidenceList component
        │
        ▼
GET /api/deliberations/{id}/sources
        │
        ▼
┌────────────────────────────────────────────────────────────┐
│  Query all citations where:                                 │
│    - targetType: "argument", targetId in deliberation args │
│    - targetType: "claim", targetId in deliberation claims  │
├────────────────────────────────────────────────────────────┤
│  Aggregate by Source:                                       │
│    - usageCount                                            │
│    - usedInArguments / usedInClaims                        │
│    - uniqueUsers                                           │
│    - firstUsed / lastUsed                                  │
│    - averageRating (from SourceRating)                     │
└────────────────────────────────────────────────────────────┘
        │
        ▼
Render with sorting (by usage or rating)
```

---

## 6. Key Wiring Patterns

### 6.1 Stack ↔ Deliberation Connection

```
Stack (id: "stack_abc")
    │
    │  hostType: "library_stack"
    │  hostId: "stack_abc"
    │
    ▼
Deliberation (created on first "Lift")
    │
    ├── Claims (from lifted comments)
    ├── Arguments (user-created)
    └── Citations → Sources → may link back to LibraryPosts
```

### 6.2 FeedPost Discussion Thread

```
Stack
    │
    │  ensureStackDiscussionThread()
    │
    ▼
FeedPost (root)
  articleId: "stack:{stackId}"
  type: TEXT
  content: "Discussion for stack '...'"
  stack_id: stackId
    │
    ├── FeedPost (comment 1, parent_id = root)
    ├── FeedPost (comment 2, parent_id = root)
    └── FeedPost (comment N, parent_id = root)
```

### 6.3 Source Resolution Pipeline

```
Input (one of):
  - url: "https://..."
  - doi: "10.xxx/yyy"
  - libraryPostId: "clxxxx"
        │
        ▼
/api/citations/resolve
        │
        ├── Compute fingerprint (SHA1 of canonical url|doi|libraryPostId)
        │
        ├── Check existing by fingerprint, url, or doi
        │
        └── Create if not found:
            {
              kind: inferType(url),  // 'web', 'arxiv', etc.
              url: canonicalUrl(url),
              doi: doi,
              libraryPostId: libraryPostId,
              fingerprint: computed,
              platform: inferPlatform(url)
            }
        │
        ▼
Return { source: { id, title, url, ... } }
```

---

## 7. Component Interaction Patterns

### 7.1 SortablePdfGrid

```tsx
// Drag-and-drop reordering with optimistic updates
<DndContext onDragEnd={onDragEnd}>
  <SortableContext items={items}>
    {items.map(tile => (
      <SortableTile
        key={tile.id}
        tile={tile}
        editable={editable}
        stackId={stackId}
      />
    ))}
  </SortableContext>
</DndContext>

// Hidden form submits to setStackOrder server action
<form action={setStackOrder}>
  <input name="stackId" value={stackId} />
  <input name="orderJson" ref={orderInputRef} />
</form>
```

### 7.2 CommentComposer Citation Integration

```tsx
// Listen for cite events from PDF tiles
useEffect(() => {
  async function handleCite(ev: CustomEvent) {
    const { mode, libraryPostId, locator, quote, note } = ev.detail;
    
    // Ensure we have a comment to attach to
    const targetId = await ensureTargetComment();
    
    if (mode === "quick") {
      // Immediate: resolve + attach
      const { source } = await resolveSource({ libraryPostId });
      await attachCitation({ targetType: "comment", targetId, sourceId: source.id });
    } else {
      // Open modal for detailed citation
      setModalOpen(true);
    }
  }
  
  window.addEventListener("composer:cite", handleCite);
  return () => window.removeEventListener("composer:cite", handleCite);
}, [...]);
```

### 7.3 EvidenceList with Quality Ratings

```tsx
// Fetch sources for deliberation
const { data, mutate } = useSWR(
  `/api/deliberations/${deliberationId}/sources`,
  fetcher
);

// Sort by usage or rating
const sortedSources = useMemo(() => {
  if (sortBy === "usage") {
    return [...sources].sort((a, b) => b.usageCount - a.usageCount);
  }
  return [...sources].sort((a, b) => 
    (b.averageRating || 0) - (a.averageRating || 0)
  );
}, [sources, sortBy]);

// Submit rating
async function submitRating(sourceId: string, rating: number) {
  await fetch(`/api/sources/${sourceId}/rate`, {
    method: "POST",
    body: JSON.stringify({ rating })
  });
  mutate(); // Refresh
}
```

---

## 8. Cross-Cutting Concerns

### 8.1 Authorization Model

| Actor | Stack Access | Actions |
|-------|--------------|---------|
| Owner | Full | CRUD, manage collaborators, delete |
| Editor | Edit | Add/remove posts, reorder, comment |
| Viewer | Read | View, comment, subscribe |
| Subscriber | Read (if public) | View, comment |
| Public | Read (if public) | View only |

### 8.2 Real-Time Events (Bus)

| Event | Payload | Trigger |
|-------|---------|---------|
| `stacks:changed` | `{ stackId, op, postId? }` | Add/remove/reorder posts |
| `comments:changed` | `{ stackId, op }` | Add/delete comments |
| `deliberations:created` | `{ id, hostType, hostId }` | Lift creates deliberation |
| `dialogue:moves:refresh` | `{ moveId, deliberationId }` | Lift creates move |
| `citations:changed` | `{ targetType, targetId }` | Attach citation |

### 8.3 Storage Architecture

```
Supabase Storage
├── pdfs/                    # Raw PDF files
│   └── {userId}/{fileHash}.pdf
└── pdf-thumbs/              # Generated thumbnails
    └── {userId}/{fileHash}.png
```

---

## 9. Feed Integration Details

### 9.1 LIBRARY Post Type

```typescript
// FeedPost with type: "LIBRARY"
{
  id: bigint,
  type: "LIBRARY",
  stack_id: string | null,        // For stack posts
  library_post_id: string | null, // For single PDF posts
  content: JSON.stringify({...}), // Fallback metadata
  image_url: string | null,       // Cover image
  caption: string | null
}
```

### 9.2 Feed Hydration

```typescript
// feed.actions.ts - hydrates LIBRARY posts with covers
const hydrated = rowsWithLike.map((r) => {
  if (r.type !== "LIBRARY") return r;
  
  if (r.stack_id && stackCovers[r.stack_id]) {
    const { urls, size } = stackCovers[r.stack_id];
    return {
      ...r,
      library: { 
        kind: "stack", 
        stackId: r.stack_id, 
        coverUrls: urls, 
        size 
      },
    };
  }
  
  if (r.library_post_id) {
    return {
      ...r,
      library: { 
        kind: "single", 
        libraryPostId: r.library_post_id, 
        coverUrl: singleCovers[r.library_post_id] 
      },
    };
  }
  
  return r;
});
```

---

## 10. Discovery Summary

### 10.1 Files Audited

| Category | Files |
|----------|-------|
| **Server Actions** | `lib/actions/stack.actions.ts` (500 lines) |
| **Helpers** | `lib/server/stack-helpers.ts` |
| **Stack Components** | `components/stack/*.tsx` (4 files) |
| **Citation Components** | `components/citations/*.tsx` (9 files) |
| **Card Components** | `components/cards/LibraryCard.tsx`, `StackCarousel.tsx` |
| **Evidence Components** | `components/evidence/EvidenceList.tsx` |
| **API Routes** | `app/api/library/*`, `app/api/citations/*` |
| **Page Routes** | `app/stacks/[slugOrId]/page.tsx` |
| **Schema** | `lib/models/schema.prisma` (Stack, LibraryPost, Source, Citation) |

### 10.2 Integration Touchpoints

1. **Deliberation System**
   - `DeliberationHostType.library_stack`
   - `/api/comments/lift` route
   - `StackReference` model for cross-deliberation edges

2. **Evidence System**
   - `Source` ↔ `Citation` relationship
   - `EvidenceList` component aggregates by deliberation
   - Quality ratings via `SourceRating`

3. **Feed System**
   - `feed_post_type.LIBRARY`
   - `LibraryCard` component
   - Hydration in `feed.actions.ts`

4. **Real-Time System**
   - Bus events for stacks/comments changes
   - `CustomEvent("composer:cite")` for citation flow

### 10.3 Key Architectural Decisions

1. **FeedPost as Discussion Thread** - Stack discussions reuse FeedPost model with `parent_id` for comments
2. **Source Deduplication** - SHA1 fingerprint prevents duplicate sources
3. **Polymorphic Citations** - `targetType` + `targetId` pattern supports multiple target types
4. **Optimistic UI** - SortablePdfGrid uses local state with form submission
5. **Server Actions** - Most stack mutations use Next.js server actions

---

## 11. Recommendations for Architecture Document

### 11.1 Sections to Include

1. System Overview with architecture diagrams
2. Complete data model documentation
3. Component hierarchy and responsibilities
4. API specifications with request/response formats
5. Citation pipeline deep-dive
6. Deliberation integration patterns
7. Feed integration patterns
8. Security and authorization model
9. Performance considerations
10. Cross-deliberation referencing (StackReference)

### 11.2 Diagrams Needed

1. High-level system architecture
2. Data model ER diagram
3. Upload flow sequence
4. Citation attachment flow
5. Lift-to-debate flow
6. Evidence aggregation flow
7. Component tree

---

*This audit document provides the foundation for the comprehensive Stacks/Library System Architecture document.*
