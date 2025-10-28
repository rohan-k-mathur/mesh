# CHUNK 6A: Knowledge Base Components

**Phase 6 Focus:** Durability, Citability, Interop — Knowledge Base Architecture

---

## Executive Summary

**Grade: B+ (87%)**

The system implements a **production-ready Knowledge Base (KB)** with 4-level hierarchy: **Spaces** (workspaces) → **Pages** (documents) → **Blocks** (content units) → **Snapshots** (point-in-time versions). The KB architecture supports **8 block types** including `claim`, `argument`, `sheet`, `room_summary`, and `transport`, enabling **transclusion of live deliberation content** into durable KB pages. The `/api/kb/transclude` endpoint provides **batch hydration** of block content from source deliberations, maintaining full provenance metadata. **Live vs. Pinned** semantics allow blocks to track changing deliberation state or freeze at specific snapshots. Primary gaps: minimal UI implementation (editor is bare-bones), no bidirectional linking from deliberations back to KB pages, no search/discovery beyond basic filters, and snapshot restore not implemented.

---

## 1. Knowledge Base Data Models

### 1.1 KbSpace (Workspace Container)

**Purpose:** Top-level container for related KB pages, similar to Notion workspace or Google Drive folder

**File:** `lib/models/schema.prisma` lines 5001-5015

```prisma
model KbSpace {
  id          String       @id @default(cuid())
  slug        String       @unique
  title       String
  summary     String?
  visibility  KbVisibility @default(public)
  kind        KbSpaceKind  @default(personal)
  createdById String
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  pages   KbPage[]
  members KbSpaceMember[]
}
```

**Fields:**
- **`slug`:** Unique identifier for URL routing (e.g., `personal-ab12-xyz`)
- **`visibility`:** `public` | `org` | `followers` | `private` (controls who can view)
- **`kind`:** `personal` | `team` | `org` | `project` (categorizes space type)
- **`createdById`:** Owner user ID

**Relations:**
- **`pages`:** 1:N → KbPage (all pages in this space)
- **`members`:** 1:N → KbSpaceMember (ACL for collaboration)

**Enums:**
```prisma
enum KbVisibility { public, org, followers, private }
enum KbSpaceKind { personal, team, org, project }
```

**Assessment:**
- ✅ **COMPLETE:** Full workspace hierarchy with ACL support
- ✅ **COMPLETE:** Visibility controls integrated
- ⚠️ **PARTIAL:** No workspace-level settings (default eval mode, style theme)
- ❌ **MISSING:** No space nesting (sub-folders)

---

### 1.2 KbSpaceMember (Collaboration ACL)

**Purpose:** Multi-user permissions for shared KB spaces

**Schema:**
```prisma
model KbSpaceMember {
  id        String   @id @default(cuid())
  spaceId   String
  userId    String
  role      KbRole   @default(reader)
  createdAt DateTime @default(now())

  space KbSpace @relation(fields: [spaceId], references: [id], onDelete: Cascade)

  @@unique([spaceId, userId])
  @@index([userId])
}

enum KbRole { owner, editor, commenter, reader }
```

**Roles:**
- **`owner`:** Full admin (delete space, manage members)
- **`editor`:** Create/edit/delete pages and blocks
- **`commenter`:** Read + comment (not yet implemented)
- **`reader`:** View only

**Assessment:**
- ✅ **COMPLETE:** 4-level role hierarchy
- ✅ **COMPLETE:** Unique constraint prevents duplicate members
- ⚠️ **PARTIAL:** Commenter role defined but no comment system
- ❌ **MISSING:** No "pending invite" state (immediately granted on creation)

---

### 1.3 KbPage (Document Container)

**Purpose:** Individual KB document containing ordered blocks

**Schema (lines 5030-5055):**
```prisma
model KbPage {
  id          String       @id @default(cuid())
  spaceId     String
  slug        String
  title       String
  summary     String?
  visibility  KbVisibility @default(public)
  tags        String[]     // small, flexible
  frontmatter Json?        // { defaultLens, eval: { mode, tau }, ... }

  createdById String
  updatedById String?
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  space     KbSpace      @relation(fields: [spaceId], references: [id], onDelete: Cascade)
  blocks    KbBlock[]
  snapshots KbSnapshot[]

  theoryWorks        TheoryWork[]
  TheoryWorkCitation TheoryWorkCitation[]

  @@unique([spaceId, slug])
  @@index([spaceId, updatedAt])
  @@index([createdById, updatedAt])
}
```

**Fields:**
- **`slug`:** Page-level unique identifier within space (e.g., `climate-brief`)
- **`tags`:** String array for categorization (no Tag model, inline storage)
- **`frontmatter`:** JSON for page-level defaults:
  - `defaultLens`: Default view mode for embedded blocks
  - `eval`: `{ mode: 'product'|'min'|'ds', tau: 0.6, imports: 'off'|'all' }`
- **`visibility`:** Can override space-level visibility
- **`updatedById`:** Tracks last editor (nullable for backward compat)

**Relations:**
- **`blocks`:** 1:N → KbBlock (ordered content units)
- **`snapshots`:** 1:N → KbSnapshot (version history)
- **`theoryWorks`:** 1:N → TheoryWork (backward reference for theory integration)

**Assessment:**
- ✅ **COMPLETE:** Full CRUD metadata with tags and frontmatter
- ✅ **COMPLETE:** Slug uniqueness per space
- ⚠️ **PARTIAL:** No status field (`draft` | `published` | `archived`)
- ⚠️ **PARTIAL:** No template system (can't clone page structure)

---

### 1.4 KbBlock (Content Unit)

**Purpose:** Individual content block (paragraph, image, claim embed, argument diagram)

**Schema (lines 5057-5073):**
```prisma
model KbBlock {
  id          String      @id @default(cuid())
  pageId      String
  ord         Int
  type        KbBlockType
  live        Boolean     @default(true) // live vs pinned
  dataJson    Json        // discriminated payload by `type`
  pinnedJson  Json?       // when !live, frozen data
  citations   Json?       // [{ kind, id, uri, note }]
  createdById String
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  page KbPage @relation(fields: [pageId], references: [id], onDelete: Cascade)

  @@index([pageId, ord])
}

enum KbBlockType {
  text
  image
  link
  claim
  claim_set
  argument
  sheet
  room_summary
  transport
  evidence_list
  cq_tracker
  plexus_tile
  theory_work
  theory_section
}
```

**Fields:**
- **`ord`:** Ordering within page (integer, allows reordering)
- **`type`:** Discriminator for `dataJson` payload schema
- **`live`:** Boolean toggle:
  - `true` → block queries live data from deliberation (changes with updates)
  - `false` → block frozen at `pinnedJson` snapshot (immutable)
- **`dataJson`:** Type-specific payload (see §2 for schemas)
- **`pinnedJson`:** Frozen data when `live=false` (copy of dataJson at pin time)
- **`citations`:** Array of provenance links (kind, id, uri, note)

**Block Types:**

| Type | Purpose | Live Data Source |
|------|---------|------------------|
| **`text`** | Markdown/Lexical rich text | N/A (user-authored) |
| **`image`** | Image with caption | N/A (static URL) |
| **`link`** | External URL with preview | N/A (static URL) |
| **`claim`** | Single claim with confidence | `/api/deliberations/{id}/evidential` |
| **`claim_set`** | Multiple claims with filters | `/api/deliberations/{id}/evidential` (filtered) |
| **`argument`** | Argument diagram | `/api/arguments/{id}?view=diagram` |
| **`sheet`** | Debate sheet (2-level) | `/api/sheets/{id}` |
| **`room_summary`** | Top-K claims from deliberation | `/api/deliberations/{id}/evidential` (sorted) |
| **`transport`** | Functor claim map + proposals | `/api/room-functor/{map,preview}` |
| **`evidence_list`** | Evidence nodes for target | `/api/evidence/{id}/links` |
| **`cq_tracker`** | Unresolved CQs for scheme | `/api/schemes/{id}/cqs` |
| **`plexus_tile`** | Mini plexus network view | `/api/agora/network` (filtered) |
| **`theory_work`** | Theory work dossier | `/api/works/{id}/dossier` |

**Assessment:**
- ✅ **COMPLETE:** 14 block types covering core use cases
- ✅ **COMPLETE:** Live vs. pinned semantics implemented
- ⚠️ **PARTIAL:** No block-level permissions (inherits page ACL)
- ⚠️ **PARTIAL:** No block comments/annotations
- ❌ **MISSING:** No block version history (only page-level snapshots)

---

### 1.5 KbSnapshot (Version History)

**Purpose:** Point-in-time capture of page + all blocks for restore/export

**Schema (lines 5075-5084):**
```prisma
model KbSnapshot {
  id          String   @id @default(cuid())
  pageId      String
  label       String?
  atTime      DateTime @default(now())
  createdById String
  manifest    Json     // { page, blocks: [{id, live, pinnedJson?, liveHash?}] }

  page KbPage @relation(fields: [pageId], references: [id], onDelete: Cascade)

  @@index([pageId, atTime])
}
```

**Fields:**
- **`label`:** Optional human-readable name (e.g., "Pre-review v1")
- **`atTime`:** Snapshot timestamp (default: now)
- **`manifest`:** JSON containing:
  ```json
  {
    "page": { "id", "title", "slug", "frontmatter", "tags", "visibility" },
    "blocks": [
      { "id", "type", "ord", "live", "liveHash": 123, "pinnedJson": {...} }
    ]
  }
  ```
- **`liveHash`:** For live blocks, stores `JSON.stringify(dataJson).length` to detect changes

**Use Cases:**
1. **Export:** Generate PDF/JSON from snapshot (immutable past state)
2. **Restore:** Recreate page from snapshot (rollback edits)
3. **Diff:** Compare current page vs. snapshot to show changes
4. **Citation:** Reference specific version in academic writing

**Assessment:**
- ✅ **COMPLETE:** Snapshot creation endpoint (`POST /api/kb/pages/:id/snapshot`)
- ⚠️ **PARTIAL:** No render-from-snapshot UI (planned via `?asOf=snapshotId`)
- ❌ **MISSING:** No restore workflow (snapshot → recreate blocks)
- ❌ **MISSING:** No diff view (compare two snapshots)

---

## 2. KB API Endpoints

### 2.1 Space Management

#### POST `/api/kb/spaces` (Create Workspace)
**Not Yet Implemented** — currently auto-creates personal space on first page creation

**Expected:**
```json
POST /api/kb/spaces
{
  "title": "Research Project 2025",
  "slug": "research-2025",
  "visibility": "team",
  "kind": "project"
}
→ { "ok": true, "space": { "id", "slug", "title", ... } }
```

#### GET `/api/kb/spaces/:id` (Fetch Workspace)
**Not Yet Implemented**

**Expected:**
```json
GET /api/kb/spaces/sp_abc123
→ {
  "ok": true,
  "space": { "id", "title", "slug", "visibility", "kind", "createdAt", "updatedAt" },
  "members": [{ "userId", "role", "createdAt" }],
  "pages": [{ "id", "title", "slug", "updatedAt" }]
}
```

---

### 2.2 Page CRUD

#### POST `/api/kb/pages/route.ts` (Create Page)

**Implementation:** `/app/api/kb/pages/route.ts` (52 lines)

**Behavior:**
1. Fetch or create personal space for current user (slug: `personal-{userIdPrefix}-{random}`)
2. Create page with auto-generated ID (`pg_{random}`)
3. Slug: `untitled-{random}`, Title: `"Untitled"`
4. Return page ID for redirect

**Code:**
```typescript
const page = await prisma.kbPage.create({
  data: {
    id: `pg_${Math.random().toString(36).slice(2, 10)}`,
    space: { connect: { id: space.id } },
    slug: `untitled-${Math.random().toString(36).slice(2, 6)}`,
    title: 'Untitled',
    visibility: 'private' as any,
    tags: [],
    createdById: userId,
  },
  select: { id: true },
});
```

**Assessment:**
- ✅ **COMPLETE:** Auto-creates personal space on first use
- ✅ **COMPLETE:** Returns page ID for client-side redirect
- ⚠️ **PARTIAL:** No explicit space selection (always personal)
- ❌ **MISSING:** No template support (can't clone existing page)

---

#### GET `/api/kb/pages/:id` (Fetch Page)

**Implementation:** `/app/api/kb/pages/[id]/route.ts` lines 17-27

**Behavior:**
1. Load page metadata (title, spaceId, tags, frontmatter)
2. Check ACL via `requireKbRole(req, { spaceId, need: 'reader' })`
3. Attempt editor check (sets `canEdit: boolean`)
4. Return page + canEdit flag

**Response:**
```json
{
  "ok": true,
  "page": {
    "id": "pg_abc123",
    "title": "Climate Policy Brief",
    "spaceId": "sp_xyz",
    "tags": ["climate", "policy"],
    "frontmatter": { "eval": { "mode": "product", "tau": 0.6 } },
    "canEdit": true,
    "updatedAt": "2025-01-15T10:30:00Z"
  }
}
```

**Assessment:**
- ✅ **COMPLETE:** ACL enforcement via `requireKbRole`
- ✅ **COMPLETE:** Returns `canEdit` for conditional UI
- ⚠️ **PARTIAL:** Does not return blocks (separate endpoint)
- ❌ **MISSING:** No view analytics (who viewed, when)

---

#### PATCH `/api/kb/pages/:id` (Update Page Metadata)

**Implementation:** `/app/api/kb/pages/[id]/route.ts` lines 29-57

**Behavior:**
1. Load page, check ACL (`editor` role required)
2. Accept partial updates: `{ title?, summary?, tags?, frontmatter? }`
3. Validate tags (array of strings, max 16)
4. Update and return new `updatedAt`

**Example:**
```json
PATCH /api/kb/pages/pg_abc123
{ "title": "Updated Title", "tags": ["new-tag"] }
→ { "ok": true, "page": { "id", "title", "updatedAt" } }
```

**Assessment:**
- ✅ **COMPLETE:** Partial update semantics
- ✅ **COMPLETE:** Tags validation (max 16)
- ⚠️ **PARTIAL:** No slug update (immutable after creation)
- ❌ **MISSING:** No activity log (who changed what)

---

### 2.3 Block CRUD

#### POST `/api/kb/pages/:id/blocks` (Add Block)
**Not Implemented** — exists but not exposed in actual route structure

**Expected Location:** `/app/api/kb/pages/[id]/blocks/route.ts`

**Current Workaround:** Direct POST to `/api/kb/blocks` with `pageId` in body

---

#### POST `/api/kb/blocks` (Create Block)

**Implementation:** `/app/api/kb/blocks/route.ts` (40 lines)

**Behavior:**
1. Validate `{ pageId, type, ord?, data? }`
2. Check ACL via `requireKbRole(req, { pageId, need: 'editor' })`
3. Auto-compute `ord` if not provided (max + 1)
4. Set default `dataJson` based on type:
   - `text` → `{ md: '', lexical: null }`
   - `claim` → `{}`
   - etc.
5. Return created block

**Code:**
```typescript
const max = await prisma.kbBlock.aggregate({ where: { pageId }, _max: { ord: true } });
const nextOrd = ord ?? ((max._max.ord ?? -1) + 1);

const created = await prisma.kbBlock.create({
  data: {
    pageId, ord: nextOrd, type,
    dataJson: (type === 'text') ? { md: '', lexical: null } : (data ?? {}),
    createdById: 'system'
  },
  select: { id: true, pageId: true, ord: true, type: true, dataJson: true, live: true, updatedAt: true }
});
```

**Assessment:**
- ✅ **COMPLETE:** Auto-ordering via `ord` field
- ✅ **COMPLETE:** Type-specific defaults
- ⚠️ **PARTIAL:** Always sets `createdById: 'system'` (should be current user)
- ❌ **MISSING:** No reorder endpoint (must manually update `ord` values)

---

#### PATCH `/api/kb/blocks/:id` (Update Block)
**Inferred from UI code** — not confirmed in API routes

**Expected Behavior:**
```json
PATCH /api/kb/blocks/kb_xyz
{
  "live": false,
  "pinnedJson": { "text": "Frozen claim", "bel": 0.85 }
}
→ { "ok": true, "block": { "id", "live", "pinnedJson", "updatedAt" } }
```

**Use Cases:**
- Toggle live → pinned (freeze block at current state)
- Update dataJson for text/image/link blocks
- Reorder via `ord` update

---

#### DELETE `/api/kb/blocks/:id` (Delete Block)
**Inferred from UI code** — not confirmed in API routes

**Expected:**
```json
DELETE /api/kb/blocks/kb_xyz
→ { "ok": true }
```

---

### 2.4 Transclusion API (Batch Hydration)

#### POST `/api/kb/transclude` (Resolve Block Content)

**Purpose:** Batch-fetch live data for multiple blocks from source deliberations

**Implementation:** `/app/api/kb/transclude/route.ts` (226 lines) ⭐⭐⭐⭐⭐

**Request Schema:**
```typescript
{
  spaceId: string;
  eval: {
    mode: 'product'|'min'|'ds';
    tau?: number;          // confidence threshold
    imports: 'off'|'materialized'|'virtual'|'all';
  };
  at?: string | null;      // ISO datetime for snapshot (not yet used)
  items: [
    { kind: 'claim', id: string, lens?: string, roomId?: string },
    { kind: 'argument', id: string, lens?: string },
    { kind: 'room_summary', id: string, limit?: number },
    { kind: 'sheet', id: string, lens?: string },
    { kind: 'transport', fromId: string, toId: string },
    { kind: 'theory_work', id: string, lens?: 'summary'|'structure'|'full' }
  ]
}
```

**Response Schema:**
```typescript
{
  ok: true,
  items: [
    {
      kind: 'claim',
      id: string,
      live: boolean,
      pinnedAt: string | null,
      lens: string,
      data: { text, bel, pl, top: [{ argumentId, score }], roomId },
      provenance: { source: 'deliberation', roomId, endpoints: [...] },
      actions: { openRoom, openSheet }
    },
    // ... other items
  ],
  errors: [{ index: number, code: string, message?: string, ref: any }]
}
```

**Workflow:**

1. **ACL Check:** Verify user has `reader` role for `spaceId`
2. **Claim Resolution:** For `claim` blocks:
   - Lookup `roomId` from `Claim.deliberationId` if not provided
   - Call `/api/deliberations/{roomId}/evidential?mode={eval.mode}&imports={eval.imports}`
   - Extract `{ bel, pl, top }` from evidential response
   - Return claim data + provenance + actions

3. **Argument Resolution:** For `argument` blocks:
   - Call `/api/arguments/{id}?view=diagram`
   - Return diagram data + provenance

4. **Room Summary:** For `room_summary` blocks:
   - Call `/api/deliberations/{id}/evidential`
   - Sort claims by confidence DESC
   - Take top-K (default 5, max 50)
   - Return claim list + provenance

5. **Sheet Resolution:** For `sheet` blocks:
   - Call `/api/sheets/{id}`
   - Return sheet nodes + edges + provenance

6. **Transport Resolution:** For `transport` blocks:
   - Call `/api/room-functor/map?from={fromId}&to={toId}`
   - If `lens=map_proposals`, also call `/api/room-functor/preview`
   - Return claimMap + proposals + provenance

7. **Theory Work Resolution:** For `theory_work` blocks:
   - Call `/api/works/{id}/dossier?format=json`
   - Return theory work structure + provenance

8. **Error Handling:** If any item fails, push to `errors` array with index + ref, continue

**Code Example (Claim):**
```typescript
if (it.kind === 'claim') {
  const roomId = it.roomId ?? (await findClaimRoomId(it.id));
  if (!roomId) { results.push(null); errors.push({ index:i, code:'not_found', ref:it }); continue; }
  
  const qs = new URLSearchParams({ mode: body.eval.mode, imports: body.eval.imports });
  if (body.eval.tau != null) qs.set('confidence', String(body.eval.tau));

  const ev = await fetch(`${origin}/api/deliberations/${roomId}/evidential?${qs}`, {
    headers: authHeaders, redirect: 'manual'
  });
  if (!ev.ok) throw new Error(`evidential HTTP ${ev.status}`);
  const ej = await ev.json();

  const bel = ej?.dsSupport?.[it.id]?.bel ?? ej?.support?.[it.id] ?? 0;
  const pl  = ej?.dsSupport?.[it.id]?.pl  ?? bel;
  const node = (ej?.nodes || []).find((n:any)=>n.id===it.id);
  const top  = node?.top ?? [];

  results.push({
    kind:'claim', id: it.id, live:true, pinnedAt:null, lens: it.lens ?? 'belpl',
    data: { text: node?.text ?? '', bel, pl, top, roomId },
    provenance: { source:'deliberation', roomId, endpoints:[`GET /api/deliberations/${roomId}/evidential?${qs}`] },
    actions: { openRoom:`/deliberation/${roomId}`, openSheet:`/sheets/delib:${roomId}` }
  });
}
```

**Assessment:**
- ✅ **COMPLETE:** Batch resolution with error handling
- ✅ **COMPLETE:** Full provenance tracking (source, endpoints, actions)
- ✅ **COMPLETE:** Auth header forwarding for private deliberations
- ✅ **COMPLETE:** 6 block types supported (claim, argument, room_summary, sheet, transport, theory_work)
- ⚠️ **PARTIAL:** No caching (every page load fetches live data)
- ⚠️ **PARTIAL:** No snapshot support (`at` parameter ignored)
- ❌ **MISSING:** No batch optimization (sequential fetches, could parallelize)

---

### 2.5 Snapshot Management

#### POST `/api/kb/pages/:id/snapshot` (Create Snapshot)

**Implementation:** `/app/api/kb/pages/[id]/snapshot/route.ts` (38 lines)

**Behavior:**
1. Load page + all blocks (with `dataJson`, `pinnedJson`, `ord`)
2. Build manifest JSON:
   ```json
   {
     "page": { "id", "title", "slug", "frontmatter", "tags", "visibility" },
     "blocks": [
       { "id", "type", "ord", "live", "liveHash": 123, "pinnedJson": {...} }
     ]
   }
   ```
3. Create `KbSnapshot` record with `atTime = now()`
4. Return `{ id, atTime }`

**Code:**
```typescript
const manifest = {
  page: { id: page.id, title: page.title, slug: page.slug, frontmatter: page.frontmatter, tags: page.tags, visibility: page.visibility },
  blocks: page.blocks.map(b => ({
    id: b.id, type: b.type, ord: b.ord, live: b.live,
    liveHash: b.live ? JSON.stringify(b.dataJson ?? {}).length : undefined,
    pinnedJson: !b.live ? (b.pinnedJson ?? b.dataJson ?? {}) : undefined
  }))
};

const snap = await prisma.kbSnapshot.create({
  data: { pageId: page.id, label: label ?? null, createdById: 'system', manifest },
  select: { id:true, atTime:true }
});
```

**Assessment:**
- ✅ **COMPLETE:** Captures page + block state
- ✅ **COMPLETE:** `liveHash` enables change detection
- ⚠️ **PARTIAL:** Always sets `createdById: 'system'` (should be current user)
- ❌ **MISSING:** No automatic snapshots (e.g., daily, before major edits)
- ❌ **MISSING:** No snapshot list UI

---

#### GET `/api/kb/pages/:id/render?asOf=<snapshotId>` (Render Snapshot)
**Not Yet Implemented**

**Expected:**
1. Load snapshot by ID or closest to ISO datetime
2. Render blocks from `manifest.blocks[].pinnedJson` or fetch live data if `live=true` at snapshot time
3. Return rendered block view models + provenance

---

## 3. KB UI Components

### 3.1 KbPageEditor.tsx (Main Editor Shell)

**File:** `components/kb/KbPageEditor.tsx` (97 lines)

**Features:**
- **Block Addition:** Dropdown menu (`+ block`) with 8 block types
- **Block Rendering:** Loops through `page.blocks` and renders via `KbBlockRenderer`
- **Live/Pin Toggle:** Each block shows "Pin (freeze)" or "Unpin (live)" button
- **Delete:** Inline delete button per block
- **Snapshot:** Top-right "snapshot" button creates version

**Code:**
```tsx
async function addBlock(type:string) {
  await fetch(`/api/kb/pages/${pageId}/blocks`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ type, data: defaultDataFor(type) })
  });
  mutate();
}

async function toggleLive(id:string, live:boolean) {
  await fetch(`/api/kb/blocks/${id}`, {
    method:'PATCH', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ live })
  });
  mutate();
}
```

**UI Layout:**
```
┌─────────────────────────────────────────────────┐
│ [Title]                      [+ block ▼] [snapshot] │
│ /kb/sp_xyz/page-slug                               │
├─────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────┐   │
│ │ CLAIM        [pinned]     [Unpin] [Delete]│   │
│ │ "AI adoption reduces costs"                │   │
│ │ Bel 85% • Pl 85%                           │   │
│ │ [provenance: deliberation • product]       │   │
│ └───────────────────────────────────────────┘   │
│ ┌───────────────────────────────────────────┐   │
│ │ TEXT                      [Pin] [Delete]   │   │
│ │ Write here…                                │   │
│ └───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

**Assessment:**
- ✅ **COMPLETE:** Basic editor with CRUD operations
- ⚠️ **PARTIAL:** No rich text editor for text blocks (shows "Write here…" placeholder)
- ⚠️ **PARTIAL:** No drag-and-drop reorder
- ⚠️ **PARTIAL:** No block search/filter
- ❌ **MISSING:** No undo/redo
- ❌ **MISSING:** No keyboard shortcuts (e.g., `/` for slash command)
- ❌ **MISSING:** No real-time collaboration

---

### 3.2 KbBlockRenderer.tsx (Block Type Router)

**File:** `components/kb/KbBlockRenderer.tsx` (inferred from imports)

**Purpose:** Route block rendering to type-specific components

**Expected Structure:**
```tsx
export function KbBlockRenderer({ block, hydrated }: { block: any; hydrated: boolean }) {
  if (!hydrated && needsHydration(block.type)) {
    return <div>Loading {block.type}…</div>;
  }

  switch (block.type) {
    case 'text': return <TextBlock data={block.dataJson} />;
    case 'claim': return <ClaimBlock env={block.env} />;
    case 'argument': return <ArgumentBlock env={block.env} />;
    case 'sheet': return <SheetBlock env={block.env} />;
    case 'room_summary': return <RoomSummaryBlock env={block.env} />;
    case 'transport': return <TransportBlock env={block.env} />;
    default: return <div>Unknown block type: {block.type}</div>;
  }
}
```

**Assessment:**
- ✅ **COMPLETE:** Type-specific rendering
- ⚠️ **PARTIAL:** No error boundaries (block render error crashes page)
- ❌ **MISSING:** No lazy loading (all blocks render immediately)

---

### 3.3 ClaimBlock.tsx (Claim Embed)

**File:** `components/kb/blocks/ClaimBlock.tsx` (27 lines)

**Features:**
- Displays claim text + confidence (Bel/Pl)
- Shows top 3 arguments (truncated IDs + scores)
- Provenance chip with source + eval mode

**Code:**
```tsx
export function ClaimBlock({ env }: { env: any }) {
  if (!env?.data) return null;
  const { text, bel, pl, top, roomId } = env.data;
  return (
    <div className="rounded border bg-white/70 p-3">
      <div className="text-sm font-medium mb-1">{text || '—'}</div>
      <div className="text-[11px] text-slate-700">Bel {Math.round((bel ?? 0)*100)}% • Pl {Math.round((pl ?? bel ?? 0)*100)}%</div>
      {Array.isArray(top) && top.length > 0 && (
        <ul className="mt-1 text-[12px] text-slate-700 list-disc ml-5">
          {top.slice(0,3).map((t: any) => (
            <li key={t.argumentId}>arg {t.argumentId.slice(0,8)}… • {Math.round((t.score ?? 0)*100)}%</li>
          ))}
        </ul>
      )}
      <div className="mt-2">
        <ProvenanceChip item={env.data} />
      </div>
    </div>
  );
}
```

**Assessment:**
- ✅ **COMPLETE:** Clean, readable claim display
- ⚠️ **PARTIAL:** No click-to-expand arguments
- ⚠️ **PARTIAL:** No confidence explanation (why 85%?)
- ❌ **MISSING:** No claim history (how has confidence changed over time?)

---

### 3.4 SheetBlock.tsx (Debate Sheet Embed)

**File:** `components/kb/blocks/SheetBlock.tsx` (17 lines)

**Features:**
- Displays sheet title + node count
- Provenance chip

**Code:**
```tsx
export function SheetBlock({ env }: { env: any }) {
  const s = env?.data;
  return (
    <div className="rounded border bg-white/70 p-3">
      <div className="text-sm font-semibold mb-1">{s?.title ?? 'Sheet'}</div>
      <div className="text-[11px] text-slate-600">nodes {s?.nodes?.length ?? 0}</div>
      <div className="mt-2">
        <ProvenanceChip item={env} />
      </div>
    </div>
  );
}
```

**Assessment:**
- ✅ **COMPLETE:** Minimal sheet preview
- ⚠️ **PARTIAL:** No inline sheet viewer (shows count only)
- ❌ **MISSING:** No "Open Sheet" button in actions

---

### 3.5 ProvenanceChip.tsx (Source Attribution)

**File:** `components/kb/ProvenanceChip.tsx` (57 lines)

**Features:**
- Shows live/pinned status as badge
- Displays source (deliberation, argument, sheet, room_functor)
- Optional "Pin here" / "Unpin" button for toggle

**Code:**
```tsx
export function ProvenanceChip({
  item, blockId, canToggle
}: { item:any; blockId?:string; canToggle?:boolean }) {
  const live = item?.live !== false;
  async function togglePin() {
    if (!blockId) return;
    let pinnedJson:any = null;
    if (live) {
      const one = Array.isArray(item) ? item[0] : item;
      pinnedJson = one || null;
    }
    const r = await fetch(`/api/kb/blocks/${blockId}`, {
      method:'PATCH', headers:{'Content-Type':'application/json'},
      body: JSON.stringify(live ? { live:false, pinnedJson } : { live:true, pinnedJson:null })
    });
    if (!r.ok) alert('Pin/unpin failed');
  }

  return (
    <div className="inline-flex items-center gap-2 text-[11px] text-slate-700">
      <span className="rounded border bg-white/70 px-1.5 py-[1px]">{live ? 'live' : 'pinned'}</span>
      <span className="text-slate-500">•</span>
      <span>{item?.provenance?.source ?? '—'}</span>
      {canToggle && blockId && (
        <>
          <span className="text-slate-500">•</span>
          <button className="underline" onClick={togglePin}>
            {live ? 'Pin here' : 'Unpin'}
          </button>
        </>
      )}
    </div>
  );
}
```

**Assessment:**
- ✅ **COMPLETE:** Live/pinned visual distinction
- ✅ **COMPLETE:** Inline pin toggle
- ⚠️ **PARTIAL:** No source link (should be clickable to source deliberation)
- ⚠️ **PARTIAL:** No timestamp ("live as of 2025-01-15")
- ❌ **MISSING:** No "updated 2 hours ago" relative time

---

### 3.6 NewKbButton.tsx (Quick Create)

**File:** `components/kb/NewKbButton.tsx` (inferred)

**Expected Behavior:**
- Button: "+ New KB Page"
- Click → POST `/api/kb/pages` → redirect to `/kb/pages/{id}`

**Assessment:**
- ⚠️ **PARTIAL:** Exists but not reviewed in detail
- ❌ **MISSING:** No "New from Template" option

---

## 4. Provenance Tracking

### 4.1 Source Attribution

**Every hydrated block includes provenance metadata:**

```json
{
  "kind": "claim",
  "id": "cl_xyz",
  "live": true,
  "pinnedAt": null,
  "lens": "belpl",
  "data": { "text": "...", "bel": 0.85, "pl": 0.85, "roomId": "delib_abc" },
  "provenance": {
    "source": "deliberation",
    "roomId": "delib_abc",
    "endpoints": ["GET /api/deliberations/delib_abc/evidential?mode=product"]
  },
  "actions": {
    "openRoom": "/deliberation/delib_abc",
    "openSheet": "/sheets/delib:delib_abc"
  }
}
```

**Fields:**
- **`source`:** Origin type (`deliberation`, `argument`, `sheet`, `room_functor`)
- **`roomId`:** Source deliberation ID (for bidirectional linking)
- **`endpoints`:** Array of API calls used to fetch data (for debugging)
- **`actions`:** UI links to open source in full view

**Assessment:**
- ✅ **COMPLETE:** Full provenance chain tracked
- ✅ **COMPLETE:** Actions for navigation to source
- ⚠️ **PARTIAL:** No "cited by" backlinks (deliberation doesn't know KB pages reference it)
- ❌ **MISSING:** No provenance export (JSON-LD, RDF)

---

### 4.2 Live vs. Pinned Semantics

**Live Block (`live=true`):**
- **Behavior:** Every page load fetches current data from source deliberation
- **Use Case:** Research brief that updates as debate progresses
- **Pros:** Always current, no manual refresh
- **Cons:** Can change unexpectedly, breaks citation if source deliberation changes

**Pinned Block (`live=false`):**
- **Behavior:** Frozen at `pinnedJson` snapshot (copy of data at pin time)
- **Use Case:** Academic paper citation, policy brief submitted for review
- **Pros:** Immutable, citable with version ID
- **Cons:** Stale data, no automatic updates

**Toggle Workflow:**
1. User clicks "Pin here" on live claim block
2. Client fetches current `/api/kb/transclude` data
3. Client sends `PATCH /api/kb/blocks/{id}` with `{ live: false, pinnedJson: {current data} }`
4. Block now displays `pinnedJson`, ignores future deliberation changes

**Assessment:**
- ✅ **COMPLETE:** Two-mode semantics implemented
- ✅ **COMPLETE:** UI toggle in ProvenanceChip
- ⚠️ **PARTIAL:** No visual diff (what changed since pinning?)
- ⚠️ **PARTIAL:** No "update pin" option (re-pin at new snapshot)
- ❌ **MISSING:** No "last synced" timestamp for live blocks

---

### 4.3 Citations Field (Inline References)

**Schema:** `KbBlock.citations: Json?`

**Expected Structure:**
```json
[
  { "kind": "doi", "id": "10.1234/example", "uri": "https://doi.org/10.1234/example", "note": "Fig 3" },
  { "kind": "url", "uri": "https://example.com/report", "note": "Section 2.1" },
  { "kind": "argument", "id": "arg_xyz", "uri": "/api/arguments/arg_xyz", "note": "Premise 2" }
]
```

**Use Cases:**
- Academic citation tracking
- Evidence provenance for fact-checking
- Export to BibTeX / EndNote

**Assessment:**
- ✅ **COMPLETE:** Schema defined and stored
- ❌ **MISSING:** No UI to add/edit citations
- ❌ **MISSING:** No citation rendering in block view
- ❌ **MISSING:** No bibliography generation

---

## 5. KB-DebateSheet Integration

### 5.1 Forward References (KB → Debate)

**Mechanism:** KB blocks embed deliberation content via `/api/kb/transclude`

**Block Types with Deliberation Links:**

| Block Type | Source API | Integration Point |
|------------|------------|-------------------|
| **`claim`** | `/api/deliberations/{id}/evidential` | Single claim with confidence |
| **`claim_set`** | `/api/deliberations/{id}/evidential` | Filtered claim list |
| **`argument`** | `/api/arguments/{id}?view=diagram` | Argument diagram |
| **`room_summary`** | `/api/deliberations/{id}/evidential` | Top-K claims |
| **`sheet`** | `/api/sheets/{id}` | Full debate sheet |
| **`transport`** | `/api/room-functor/{map,preview}` | Functor claim mapping |

**Example Workflow:**
1. User creates KB page "AI Policy Brief"
2. Adds `claim` block with ID `cl_xyz` from deliberation `delib_abc`
3. Page load calls `/api/kb/transclude` with `items: [{ kind:'claim', id:'cl_xyz' }]`
4. Transclude fetches `/api/deliberations/delib_abc/evidential`
5. Returns claim text + confidence + top arguments
6. ClaimBlock renders with provenance chip showing "deliberation • product"

**Assessment:**
- ✅ **COMPLETE:** 6 block types support deliberation embedding
- ✅ **COMPLETE:** Live data fetched on every page load
- ⚠️ **PARTIAL:** No caching (performance impact for large pages)
- ⚠️ **PARTIAL:** No prefetching (sequential API calls)

---

### 5.2 Backward References (Debate → KB)
**Not Implemented**

**Expected Feature:**
- Deliberation page shows "Cited in KB Pages" section
- Lists KB pages that reference this deliberation's claims/arguments
- Clicking opens KB page in new tab

**Implementation Gap:**
- No `DebateCitation` model linking deliberations to KB pages
- No API endpoint to query "which KB pages cite this deliberation?"
- No UI component to display citations

**Recommendation:**
```prisma
model DebateCitation {
  id             String @id @default(cuid())
  deliberationId String
  kbPageId       String
  kbBlockId      String
  citationType   String // 'claim' | 'argument' | 'sheet'
  createdAt      DateTime @default(now())

  @@unique([deliberationId, kbPageId, kbBlockId])
  @@index([deliberationId])
}
```

**Assessment:**
- ❌ **MISSING:** No backward reference tracking
- ❌ **MISSING:** No "Cited in" UI on deliberation pages
- **Future Work:** Implement bidirectional linking for full knowledge graph

---

### 5.3 Sheet Block Integration

**Current Implementation:**
- `SheetBlock` displays sheet title + node count only
- No inline sheet viewer (shows summary)

**Expected Enhancement:**
- Render debate sheet nodes as tree view
- Click node → expand to show argument diagram
- Provenance: "Sheet from deliberation {id}, updated {date}"

**Assessment:**
- ⚠️ **PARTIAL:** Minimal sheet preview
- ❌ **MISSING:** No inline DebateSheetReader component
- ❌ **MISSING:** No sheet filtering (e.g., show only accepted nodes)

---

## 6. Gaps & Recommendations

### 6.1 Critical Gaps

#### ⚠️ **No Bidirectional Linking (Debate → KB)**
**Impact:** HIGH  
**Description:** Deliberations don't know which KB pages cite them. Cannot answer "where is this claim used?"  
**Recommendation:**
- Add `DebateCitation` model tracking deliberationId → kbPageId → kbBlockId
- Create endpoint: `GET /api/deliberations/{id}/citations → { pages: [{id, title, blockCount}] }`
- Add "Cited in KB Pages" section to deliberation UI

---

#### ⚠️ **Minimal UI Implementation**
**Impact:** HIGH  
**Description:** KbPageEditor is bare-bones. No rich text editing, drag-and-drop, real-time collaboration.  
**Recommendation:**
- Integrate Lexical or TipTap for rich text blocks
- Add block reordering via drag handle
- Implement `/` slash commands for quick block insertion
- Add undo/redo stack

---

#### ⚠️ **No Search/Discovery**
**Impact:** MEDIUM  
**Description:** No way to find KB pages across spaces. Tags exist but no tag browser.  
**Recommendation:**
- Implement `GET /api/kb/search?q={query}&space={id}&tags={tag1,tag2}`
- Add full-text search via Postgres `to_tsvector`
- Create KB dashboard with recent pages, popular tags, trending topics

---

#### ⚠️ **Snapshot Restore Not Implemented**
**Impact:** MEDIUM  
**Description:** Snapshots created but no restore workflow. Can't rollback edits or compare versions.  
**Recommendation:**
- Implement `POST /api/kb/pages/:id/restore?snapshotId={id}` endpoint
- Restore logic: Delete current blocks, recreate from `manifest.blocks[]`
- Add snapshot list UI with "Restore" button per snapshot

---

#### ⚠️ **No Batch Optimization in Transclude**
**Impact:** MEDIUM  
**Description:** `/api/kb/transclude` fetches items sequentially. 50 claim blocks = 50 serial API calls.  
**Recommendation:**
- Group items by type (all claims, all arguments, etc.)
- Batch fetch: Single evidential call for all claims in same deliberation
- Parallelize cross-type fetches (claims || arguments || sheets)
- Add response caching (30s TTL for live blocks)

---

### 6.2 Enhancement Opportunities

#### 🔧 **Block Templates**
**Priority:** MEDIUM  
**Description:** Reusable block patterns (e.g., "Policy Analysis Template" with structure: Summary → Claims → Evidence → Conclusion).  
**Implementation:**
- Add `KbTemplate` model with `blocksJson: [{type, dataJson}]`
- Endpoint: `POST /api/kb/pages?templateId={id}` creates page with blocks pre-populated
- UI: Template picker in "New Page" flow

---

#### 🔧 **Comments & Annotations**
**Priority:** MEDIUM  
**Description:** Inline comments on KB blocks for collaborative review.  
**Implementation:**
- Add `KbComment` model: `{ blockId, userId, text, createdAt }`
- Endpoint: `POST /api/kb/blocks/:id/comments`
- UI: Comment sidebar showing all comments per block

---

#### 🔧 **Export Formats**
**Priority:** HIGH  
**Description:** Export KB pages to PDF, Markdown, JSON-LD for external use.  
**Implementation:**
- Endpoint: `GET /api/kb/pages/:id/export?format={pdf|md|json-ld}&asOf={snapshotId}`
- PDF: Server-side rendering via Puppeteer
- Markdown: Convert blocks to Markdown syntax
- JSON-LD: AIF-compatible export for interop with AIFDB

---

#### 🔧 **Real-Time Collaboration**
**Priority:** LOW  
**Description:** Multiple users editing same KB page simultaneously (Google Docs-style).  
**Implementation:**
- WebSocket server for presence + cursors
- Operational Transform or CRDT for text block merging
- Show "User X is viewing" avatars in header

---

#### 🔧 **Block History (Version Control)**
**Priority:** MEDIUM  
**Description:** Track changes to individual blocks (not just page-level snapshots).  
**Implementation:**
- Add `KbBlockHistory` model: `{ blockId, dataJson, changedById, changedAt }`
- Store snapshot on every PATCH to block
- UI: "View History" button per block → timeline of changes

---

## 7. Code Quality & Patterns

### 7.1 Strengths

1. **Clear ACL Enforcement:** `requireKbRole` guard consistently used across endpoints
2. **Provenance Tracking:** Full source attribution in transclude response
3. **Live vs. Pinned:** Elegant two-mode semantics for versioning
4. **Type Safety:** Zod schemas for API validation
5. **Block Extensibility:** 14 block types with discriminated union via `type` field

---

### 7.2 Technical Debt

1. **Hardcoded `createdById: 'system'`:** Should use current user from auth context
2. **No Caching:** Every page load fetches live data (performance impact)
3. **Sequential Fetches:** Transclude API calls items one-by-one (slow for large pages)
4. **No Error Boundaries:** Block render errors crash entire page
5. **Minimal UI:** KbPageEditor is prototype-level (no rich text, drag-and-drop)

---

## 8. Integration with Categorical Architecture

### 8.1 KB as Knowledge Fabric Layer

**Categorical Interpretation:**

The Knowledge Base sits **above** the Plexus as a **persistent projection layer**:

```
Category MESH:
  - Objects: Deliberations (evidential closed categories)
  - 1-Morphisms: Functors (RoomFunctor, ArgumentImport)
  - 2-Morphisms: (not yet implemented)

Meta-Layer PLEXUS:
  - Objects: Deliberations
  - Morphisms: Typed edges (xref, imports, overlap, etc.)

Projection Layer KB:
  - Objects: KbPages (documents)
  - Morphisms: Block embeddings (claim → page, sheet → page)
  - Purpose: Make deliberation content **citable and durable**
```

**KB as Persistent View:**
- KB pages are **named, versioned projections** of deliberation state
- Blocks are **morphisms** from deliberation entities to KB pages
- Snapshots are **immutable past states** (temporal modality)

---

### 8.2 Provenance as Natural Transformation

**Interpretation:**

Provenance tracking implements a **natural transformation** between live and pinned functors:

```
Live Functor L: Deliberation → KbPage
  L(claim_id) = current confidence from evidential API

Pinned Functor P: Deliberation → KbPage
  P(claim_id) = frozen confidence at pin time

Natural Transformation η: L ⇒ P
  η_claim: L(claim) → P(claim)  (pin action)
```

**Naturality Condition:**
- For any deliberation update `f: φ → φ'`, the diagram commutes:
```
L(φ) ----η_φ----> P(φ)
  |                 |
L(f)|               |P(f) = identity
  |                 |
L(φ')---η_φ'----> P(φ')
```

**Assessment:**
- ✅ **CONCEPTUAL COMPLETE:** Live → pinned transformation is functorial
- ⚠️ **PARTIAL:** No composition tracking (can't chain pin → unpin → re-pin)
- ❌ **MISSING:** No functor law verification (does pin preserve structure?)

---

## 9. Overall Assessment

### 9.1 Architecture Score

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| **Data Models** | A (92%) | 4-level hierarchy complete, snapshot support, provenance fields |
| **API Endpoints** | B+ (87%) | Transclude API excellent, but missing restore, search, reorder |
| **UI Components** | C+ (77%) | Bare-bones editor, no rich text, minimal block types rendered |
| **Provenance Tracking** | A- (90%) | Full source attribution, live/pinned semantics, but no backlinks |
| **DebateSheet Integration** | B (83%) | Forward references complete, but no backward citations |
| **Snapshot/Versioning** | B- (80%) | Creation works, but no restore, diff, or auto-snapshot |
| **Search/Discovery** | D (65%) | Tags exist but no search UI, no full-text index |

**Overall Grade: B+ (87%)**

---

### 9.2 Comparison to Other Phases

| Phase | Focus | Grade | Status |
|-------|-------|-------|--------|
| **1-2** | AIF Types + Evidential Category | A+ (96%) | Strong categorical foundations |
| **3** | Schemes + Dialogue Protocol | A (93%) | Comprehensive argumentation logic |
| **4** | Two-Level UI | A- (90%) | Professional visualizations |
| **5** | Plexus + Cross-Room | A- (90%) | Sophisticated network topology |
| **6A** | Knowledge Base | B+ (87%) | Solid architecture, minimal UI |

**KB Trade-off:** Strong backend/data architecture but limited UI implementation. Production-ready for API-driven workflows, needs polish for end-user editing experience.

---

## 10. Key Findings for Architecture Review

1. **KB implements full workspace hierarchy** (Space → Page → Block → Snapshot) with ACL and visibility controls
2. **Transclude API is sophisticated** — batch hydration with provenance tracking, 6 block types supported
3. **Live vs. pinned semantics provide dual-mode versioning** for mutable research vs. immutable citations
4. **14 block types defined** including claim, argument, sheet, room_summary, transport, theory_work
5. **Provenance fully tracked** in transclude response (source, endpoints, actions) enabling bidirectional nav
6. **UI is minimal** — bare-bones editor with no rich text, drag-and-drop, or real-time collaboration
7. **No backward linking** — deliberations don't know which KB pages cite them (critical gap for knowledge graph)
8. **Snapshot restore not implemented** — can create snapshots but not rollback or compare versions

**Phase 6A demonstrates strong data architecture and API design but requires significant UI development to match Plexus/DebateSheet polish level.**

---

## 11. Next Phase Preview

**Phase 6B: AIF Export & Seeding**

**Expected Analysis:**
- AIF-JSON-LD export format compliance
- Round-trip import/export testing (export → import → same structure)
- Seed scripts for realistic test fixtures
- Integration with external tools (AIFDB, Carneades, ArgML)

**Key Questions:**
- Can debates be exported as valid AIF-JSON-LD?
- Do seed scripts create realistic test fixtures?
- Is round-trip import/export working?
- What is the interop story with other argumentation platforms?

---

**End of CHUNK 6A**

**Phase 6A Complete:** Knowledge Base architecture analyzed with grade B+ (87%). System demonstrates strong data models, excellent transclusion API, and comprehensive provenance tracking, but requires UI polish (rich text editor, drag-and-drop, search) and bidirectional linking (debate → KB citations) to match other system components' maturity level.
