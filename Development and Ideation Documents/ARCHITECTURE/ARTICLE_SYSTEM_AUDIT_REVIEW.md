# Article System Architecture Audit & Review

## Document Purpose
This audit document provides a comprehensive analysis of the Mesh Article System architecture, implementation details, and integration points with the Deliberation system. This review serves as the foundation for the complete architecture document.

---

## Part 1: System Overview & Scope

### 1.1 High-Level Summary

The Mesh Article System is a full-featured content management and publishing platform integrated with the broader Mesh deliberation ecosystem. It provides:

1. **Rich Text Editing** - TipTap-based WYSIWYG editor with advanced formatting
2. **Article Management** - Dashboard for CRUD operations, drafts, and publishing workflow
3. **Reader Experience** - Polished article viewing with templates and hero images
4. **Annotation System** - Text-anchored comment threads (pins)
5. **Deliberation Integration** - Each article automatically spawns a linked deliberation space

### 1.2 Core User Flows

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        ARTICLE LIFECYCLE                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────────────┐  │
│  │ Dashboard│───▶│  Create  │───▶│  Editor  │───▶│    Publish       │  │
│  │ /profile │    │  Draft   │    │  /edit   │    │   /article/[slug]│  │
│  │ /articles│    │          │    │          │    │                  │  │
│  └──────────┘    └──────────┘    └──────────┘    └────────┬─────────┘  │
│                                                            │            │
│                                      ┌─────────────────────▼──────────┐ │
│                                      │     Reader View               │ │
│                                      │  + Comment Pins               │ │
│                                      │  + Deliberation Panel         │ │
│                                      │  + Discussion Link            │ │
│                                      └────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Part 2: Directory Structure & File Inventory

### 2.1 Components Directory
**Path:** `components/article/`

| File | Purpose | Lines |
|------|---------|-------|
| `ArticleEditor.tsx` | Main TipTap editor component with autosave, toolbar, and publishing | ~1211 |
| `ArticleReader.tsx` | Base reader wrapper with template/hero support | ~40 |
| `ArticleReaderWithPins.tsx` | Full reader with annotation pins, comment rail, deliberation panel | ~806 |
| `ArticleCard.tsx` | Card display for article lists | - |
| `ArticleActions.tsx` | Action buttons/dropdowns | - |
| `CommentModal.tsx` | Modal for viewing/replying to comment threads | ~183 |
| `CommentSidebar.tsx` | Alternative sidebar layout for comments | ~40 |
| `DeepDiveBackground.tsx` | Background styling for deliberation section | - |
| `Editor.tsx` | Auxiliary editor utilities | - |
| `HeroRenderer.tsx` | Hero image rendering | - |
| `SectionState.tsx` | Section collapse state management | - |
| `templates.ts` | Article template definitions | - |

**Subdirectories:**
- `editor/` - Editor toolbar components (Toolbar.tsx, SlashCommand.tsx, TemplateSelector.tsx, Outline.tsx)
- `extensions/` - Custom TipTap extensions

### 2.2 App Routes

#### Editor Routes (Route Group: `(editor)`)
```
app/(editor)/article/
├── new/page.tsx              # Creates new draft, redirects to edit
├── by-id/[id]/edit/page.tsx  # Editor view for article by ID
└── styles/                   # Editor-specific styles
```

#### Reader Routes (Route Group: `(by-key)`)
```
app/article/
├── (by-key)/[key]/page.tsx   # Public reader view (by slug or UUID)
├── layout.tsx                # Reader layout with fonts/styles
├── article.templates.css     # Template styles
├── editor.global.css         # Global editor styles
├── rhetoric.css              # Rhetoric UI styles
└── type-tokens.css           # Typography token system
```

#### Dashboard Routes
```
app/(root)/(standard)/profile/articles/
├── page.tsx                  # Server component - fetches initial data
└── ui/ArticlesDashboard.tsx  # Client component - SWR infinite scroll
```

### 2.3 API Routes
```
app/api/articles/
├── route.ts                  # GET (list), POST (create)
├── presign.ts                # S3 presigned URLs for uploads
├── preview/route.ts          # Article preview rendering
├── mine/route.ts             # Current user's articles
└── [id]/
    ├── (by-id)/route.ts      # GET, PATCH, DELETE by ID
    ├── (draft)/draft/route.ts    # PATCH draft content
    ├── (publish)/publish/route.ts # POST publish article
    ├── (restore)/restore/route.ts # POST restore, PUT update
    ├── (revisions)/revisions/route.ts # GET revision history
    └── threads/route.ts      # GET, POST comment threads
```

### 2.4 Library Functions
```
lib/article/
├── text.ts                   # Plain text extraction, excerpt, reading time
└── wrapSections.ts           # Section break processing for collapsible sections
```

---

## Part 3: Data Model

### 3.1 Prisma Schema - Article Model

```prisma
model Article {
  id               String          @id @default(uuid())
  authorId         String
  title            String
  slug             String          @unique
  heroImageKey     String?
  template         String          @default("standard")
  astJson          Json            # TipTap document JSON
  status           ArticleStatus   @default(DRAFT)
  revisions        Revision[]
  analytics        Json?
  createdAt        DateTime        @default(now())
  updatedAt        DateTime        @updatedAt
  excerpt          String?
  readingTime      Int?            # minutes
  publishedAt      DateTime?
  allowAnnotations Boolean         @default(true)
  revisionId       String?
  threads          CommentThread[]
  deletedAt        DateTime?       # Soft delete
  roomId           String?         # Optional room link

  @@index([authorId, deletedAt, updatedAt])
  @@index([authorId, status, updatedAt])
  @@map("articles")
}

model Revision {
  id        String   @id @default(uuid())
  articleId String
  astJson   Json
  createdAt DateTime @default(now())
  article   Article  @relation(...)
  
  @@map("article_revisions")
}

enum ArticleStatus {
  DRAFT
  PUBLISHED
}
```

### 3.2 Comment Thread Schema

```prisma
model CommentThread {
  id        String    @id @default(uuid())
  articleId String
  anchor    Json      # {startPath, startOffset, endPath, endOffset}
  resolved  Boolean   @default(false)
  createdBy String
  createdAt DateTime  @default(now())
  comments  Comment[]
  article   Article   @relation(...)
}

model Comment {
  id        String   @id @default(uuid())
  threadId  String
  body      String
  createdBy String
  createdAt DateTime @default(now())
  upvotes   Int      @default(0)
  downvotes Int      @default(0)
  thread    CommentThread @relation(...)
}
```

### 3.3 TypeScript Interfaces

```typescript
// types/comments.ts
interface Anchor {
  startPath: number[]     // DOM node path from article root
  startOffset: number     // Character offset within start text node
  endPath: number[]
  endOffset: number
}

interface Comment {
  id: string
  threadId: string
  body: string
  createdBy: string
  createdAt: string
  upvotes: number
  downvotes: number
}

interface CommentThread {
  id: string
  articleId: string
  anchor: Anchor
  resolved: boolean
  createdBy: string
  createdAt: string
  comments: Comment[]
}
```

---

## Part 4: TipTap Editor Architecture

### 4.1 Extension Stack

The editor uses a unified extension set shared between editor and reader:

```typescript
// lib/tiptap/extensions/shared.ts
export function tiptapSharedExtensions() {
  return [
    StarterKit.configure({
      bulletList: { keepMarks: true, keepAttributes: true },
      orderedList: { keepMarks: true, keepAttributes: true },
    }),
    FancyTextStyle,           // Extended TextStyle with data attributes
    Color.configure({ types: ['textStyle'] }),
    Underline,
    Highlight,
    Link.configure({ openOnClick: true, autolink: true }),
    SSRTextAlign.configure({ types: ['heading', 'paragraph'] }),
    SectionBreak,
  ];
}
```

### 4.2 Editor-Only Extensions

```typescript
// ArticleEditor.tsx additional extensions
const extensions = [
  ...tiptapSharedExtensions(),
  CodeBlockLowlight.configure({ lowlight }),
  TaskList, TaskItem,
  CustomImage,        // With caption, align, alt, missingAlt
  PullQuote,          // Block quote styling
  Callout,            // Info/warning blocks
  MathBlock,          // LaTeX block equations
  MathInline,         // Inline LaTeX
  SectionBreak,       // Collapsible sections
  Indent,             // Indentation control
  CodeBlockTab,       // Tab key in code blocks
  MoveBlock,          // Block reordering
  QuickLink,          // Fast link insertion
  TextStyleTokens,    // Token emitters
  BlockStyleTokens,
  Placeholder,
  CharacterCount.configure({ limit: 20000 }),
  SlashCommand,       // / command palette
  // Optional: Collaboration, CollaborationCursor
];
```

### 4.3 Custom Node Types

| Node | Type | Purpose |
|------|------|---------|
| `pullQuote` | block | Styled quotation |
| `callout` | block | Info/warning/tip boxes |
| `mathBlock` | block atom | LaTeX equations |
| `mathInline` | inline atom | Inline LaTeX |
| `sectionBreak` | block | `<hr data-section-break>` |
| `customImage` | block | Image with caption/alignment |

### 4.4 Text Style Token System

The system uses data attributes for portable styling:

```css
/* type-tokens.css */
[data-ff="system"]   { font-family: var(--ff-system); }
[data-ff="founders"] { font-family: var(--ff-founders); }
[data-fs="12"]       { font-size: 12px; }
[data-fs="16"]       { font-size: 16px; }
[data-clr="accent"]  { color: var(--clr-accent); }
[data-clr="muted"]   { color: var(--clr-muted); }
[data-fw="600"]      { font-weight: 600; }
[data-lh="tight"]    { line-height: 1.2; }
```

---

## Part 5: API Endpoints Deep Dive

### 5.1 Articles List & Create

**`GET /api/articles`**
- Auth: Required
- Query params: `page`, `pageSize`, `q`, `status`, `template`, `view` (active/trash), `sort`
- Response: `{ items: Article[], total, page, pageSize }`

**`POST /api/articles`**
- Auth: Required
- Body: `{ title?, slug?, template?, heroImageKey?, astJson? }`
- Creates draft with status=DRAFT
- Response: `{ id: string }`

### 5.2 Article CRUD

**`GET /api/articles/[id]`** (by-id route)
- Auth: Required + ownership check
- Response: Full article object

**`PATCH /api/articles/[id]`** (by-id route)
- Auth: Required + ownership
- Body: `{ title?, template?, heroImageKey? }`

**`DELETE /api/articles/[id]`** (by-id route)
- Soft delete (sets deletedAt)
- Optional `?hard=1` for permanent delete

### 5.3 Draft & Publish

**`PATCH /api/articles/[id]/draft`**
- Autosave endpoint
- Body: `{ astJson?, template?, heroImageKey?, title? }`
- Used by debounced editor autosave

**`POST /api/articles/[id]/publish`**
- Generates unique slug from title
- Computes excerpt and reading time
- Creates revision snapshot
- Sets status=PUBLISHED, publishedAt
- Creates feed post
- Response: `{ slug, feedPostId? }`

### 5.4 Comment Threads

**`GET /api/articles/[id]/threads`**
- Returns all threads with comments
- Respects `allowAnnotations` flag

**`POST /api/articles/[id]/threads`**
- Body: `{ anchor: Anchor, body: string }`
- Creates thread + initial comment
- Returns created thread

---

## Part 6: Annotation System Architecture

### 6.1 Anchor Mechanism

The annotation system uses DOM path-based anchors that survive re-renders:

```typescript
// Building anchor from selection
function buildAnchorFromSelection(root: HTMLElement, sel: Selection): {
  anchor: Anchor;
  rect: DOMRect;
} | null {
  // 1. Normalize selection to text nodes
  const norm = normalizeRangeToTextNodes(root, range);
  
  // 2. Compute DOM paths from root to text nodes
  const startPath = nodePathFromRoot(root, norm.start);
  const endPath = nodePathFromRoot(root, norm.end);
  
  // 3. Create anchor with offsets
  return {
    anchor: { startPath, startOffset, endPath, endOffset },
    rect: range.getBoundingClientRect()
  };
}
```

### 6.2 Anchor Resolution

```typescript
// Resolving anchor to DOM range
function getAnchorRects(anchor: Anchor, root: HTMLElement): DOMRect[] {
  // Walk paths to find start/end text nodes
  let startNode = root;
  for (const idx of anchor.startPath) startNode = startNode.childNodes[idx];
  
  let endNode = root;
  for (const idx of anchor.endPath) endNode = endNode.childNodes[idx];
  
  // Create range and get client rects
  const range = document.createRange();
  range.setStart(startNode, anchor.startOffset);
  range.setEnd(endNode, anchor.endOffset);
  
  return Array.from(range.getClientRects());
}
```

### 6.3 Visual Components

1. **Pin Layer** - Left gutter with clustered comment indicators
2. **Comment Rail** - Right sidebar with comment previews
3. **Selection Overlay** - Highlight rects for active/hovered threads
4. **Adder Bubble** - "+" button above text selection
5. **Composer Bubble** - Inline comment input form

---

## Part 7: Deliberation Integration

### 7.1 Deliberation Linking

Every article automatically gets a linked deliberation when viewed:

```typescript
// app/article/(by-key)/[key]/page.tsx
const deliberationId = await getOrCreateDeliberationId(
  'article',
  article.id,
  article.roomId ?? null,
  userId ?? 'system'
);
```

### 7.2 getOrCreateDeliberationId Function

```typescript
// lib/deepdive/upsert.ts
export async function getOrCreateDeliberationId(
  hostType: 'article' | 'post' | 'room_thread' | ...,
  hostId: string,
  roomId: string | null,
  createdById: string
) {
  // Check for existing deliberation
  const existing = await prisma.deliberation.findFirst({
    where: { hostType, hostId },
  });
  if (existing) return existing.id;

  // Create new deliberation
  const created = await prisma.deliberation.create({
    data: {
      hostType,
      hostId,
      roomId: roomId ?? undefined,
      createdById,
      rule: roomId 
        ? (await prisma.agoraRoom.findUnique(...))?.representationRule ?? 'utilitarian'
        : 'utilitarian',
    },
  });
  return created.id;
}
```

### 7.3 Deliberation Spawn API

**`POST /api/deliberations/spawn`**
- Creates full chain: AgoraRoom → Deliberation → DebateSheet
- Used from dashboard "Open discussion" button
- Body: `{ hostType, hostId, tags?, title? }`
- Response: `{ ok, id, redirect }`

### 7.4 Reader Integration

The `ArticleReaderWithPins` component embeds the deliberation panel:

```tsx
{deliberationId && (
  <section className="relative mt-0">
    <DeepDiveBackdrop attach="absolute"/>
    <h2>Discussion</h2>
    <RhetoricProvider>
      <DialogueTargetProvider>
        <DeepDivePanel deliberationId={deliberationId} />
      </DialogueTargetProvider>
    </RhetoricProvider>
  </section>
)}
```

### 7.5 Navigation Links

- **Article → Deliberation**: "Discussion Page ↗" link in article header
- **Deliberation → Article**: "← Return: [Title]" link in deliberation page

---

## Part 8: Editor Features

### 8.1 Autosave System

```typescript
// Debounced save with abort control
const saveDraft = useCallback(async () => {
  const payload = makePayload();
  const hash = JSON.stringify(payload);
  if (hash === lastSentHash.current) return; // Dedup
  
  inflight.current?.abort();
  const ac = new AbortController();
  inflight.current = ac;
  
  await fetch(`/api/articles/${articleId}/draft`, {
    method: "PATCH",
    body: JSON.stringify(payload),
    signal: ac.signal,
  });
  lastSentHash.current = hash;
}, []);

const debouncedSave = useDebouncedCallback(saveDraft, 800);
```

### 8.2 Local Backup System

```typescript
const LOCAL_KEY = (id: string) => `article_${id}_backup`;

// Save backup on save
localStorage.setItem(LOCAL_KEY(articleId), JSON.stringify({
  ts: Date.now(),
  content: editor.getJSON(),
  template,
  heroImageKey,
}));

// Restore on load
const backup = localStorage.getItem(LOCAL_KEY(articleId));
if (backup && backup.ts > article.updatedAt) {
  // Prompt user to restore
}
```

### 8.3 Publishing Flow

1. Ensure draft is saved (immediate save)
2. POST to `/api/articles/[id]/publish`
3. Server generates slug, computes derived fields
4. Creates revision snapshot
5. Creates feed post (optional)
6. Redirect to published article

### 8.4 Toolbar Features

| Category | Features |
|----------|----------|
| Text Formatting | Bold, Italic, Underline, Strikethrough, Code |
| Lists | Bullet, Ordered, Task |
| Alignment | Left, Center, Right, Justify |
| Typography | Font family, Size, Weight, Line height, Letter spacing |
| Color | Text color, Highlight |
| Blocks | Quote, Heading levels |
| Links | URL insertion |
| Media | Image insertion with cropping |

### 8.5 Slash Commands

```typescript
const COMMANDS = [
  { title: "Image", command: editor => editor.chain().focus().setImage({ src: "" }).run() },
  { title: "Quote", command: editor => editor.chain().focus().setNode("pullQuote").run() },
  { title: "Callout", command: editor => editor.chain().focus().setNode("callout").run() },
  { title: "Latex", command: editor => editor.chain().focus().setNode("mathBlock").run() },
];
```

---

## Part 9: Dashboard Features

### 9.1 SWR Infinite Scroll

```typescript
const getKey = (index: number, prev: PageData | null) => {
  if (prev && (!prev.items || prev.items.length === 0)) return null;
  const params = new URLSearchParams({
    page: String(index + 1),
    pageSize: String(pageSize),
    q, view, sort: "updatedAt:desc",
  });
  if (status !== "ALL") params.set("status", status);
  if (template !== "ALL") params.set("template", template);
  return `/api/articles?${params.toString()}`;
};

const { data, size, setSize, isValidating, mutate } = useSWRInfinite(
  getKey, fetcher, { revalidateFirstPage: true, parallel: true }
);
```

### 9.2 Optimistic Updates

```typescript
async function rename(id: string, title: string) {
  // Optimistic update in SWR cache
  mutate(pages => pages?.map(p => ({
    ...p,
    items: p.items.map(it => it.id === id ? { ...it, title } : it),
  })), { revalidate: false });
  
  // Then update server
  await fetch(`/api/articles/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ title }),
  }).catch(() => mutate()); // Rollback on error
}
```

### 9.3 Filters & Views

| Filter | Options |
|--------|---------|
| Search | Title/slug text search |
| Status | All, Draft, Published |
| Template | All, Standard, Feature |
| View | Active, Trash (archived) |
| Sort | Updated at (desc) |

---

## Part 10: SSR Rendering

### 10.1 Server-Side HTML Generation

```typescript
// app/article/(by-key)/[key]/page.tsx
const html = generateHTML(article.astJson, [
  ...tiptapSharedExtensions(),
  CodeBlockLowlight.configure({ lowlight }),
  TaskList, TaskItem,
  CustomImage, PullQuote, Callout, MathBlock, MathInline,
  Link, ParagraphKeepEmptySSR,
  TextStyleTokens, BlockStyleTokens,
]);
```

### 10.2 SSR Extensions

Special extensions for server-side rendering:
- `SSRTextAlign` - Outputs `data-text-align` attributes
- `TextStyleTokens` - Emits `data-fs`, `data-ff`, `data-clr` attributes
- `BlockStyleTokens` - Block-level data attributes
- `ParagraphKeepEmptySSR` - Preserves empty paragraphs

---

## Part 11: Security & Authorization

### 11.1 Authentication Flow

```typescript
// All API routes check authentication
const user = await getUserFromCookies();
if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
```

### 11.2 Ownership Checks

```typescript
// Articles are protected by ownership
const article = await prisma.article.findUnique({ where: { id } });
if (!article || article.authorId !== user.userId.toString()) {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
```

### 11.3 Content Sanitization

```typescript
// Paste handling with DOMPurify
function sanitizeAndNormalize(html: string) {
  const clean = DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style', 'id', 'name'],
  });
  // Map styles to data tokens
  // Convert legacy elements
  return doc.body.innerHTML;
}
```

---

## Part 12: Integration Points Summary

### 12.1 External Integrations

| System | Integration Point |
|--------|------------------|
| Deliberation | `getOrCreateDeliberationId`, `DeepDivePanel` |
| Feed System | `createFeedPost` on publish |
| Auth System | `getUserFromCookies`, `getCurrentUserId` |
| Storage (S3) | Presigned URLs for images |
| Rooms (Agora) | Optional `roomId` linking |

### 12.2 Context Providers

The reader component wraps deliberation with context providers:
```tsx
<RhetoricProvider>
  <DialogueTargetProvider>
    <DeepDivePanel deliberationId={deliberationId} />
  </DialogueTargetProvider>
</RhetoricProvider>
```

---

## Part 13: Known Issues & Gaps

### 13.1 Current Limitations

1. **Collaboration** - WebSocket collab disabled (`COLLAB_ENABLED = false`)
2. **Comment Auth** - Uses `"anon"` placeholder for comment `createdBy`
3. **Section Collapse** - `wrapSections` commented out in reader
4. **Revision UI** - Revisions exist but no UI to view/restore

### 13.2 Future Considerations

1. Real-time collaborative editing
2. Comment reactions beyond upvote/downvote
3. Rich comment formatting
4. Mention system in comments
5. Export (PDF, Markdown)
6. SEO metadata generation
7. Analytics dashboard

---

## Next Steps

This audit will inform the complete architecture document covering:
1. System component diagrams
2. Data flow sequences
3. API contracts
4. Extension documentation
5. Integration specifications
6. Security model
7. Performance considerations

---

*Document generated: 2024-12-15*
*Scope: Complete article system audit for Mesh platform*
