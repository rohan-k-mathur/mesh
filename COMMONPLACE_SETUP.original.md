# Commonplace: Initial Setup Guide

How to bootstrap Commonplace as a separate Next.js app inside the Mesh monorepo, reusing specific infrastructure without coupling to the argumentation domain.

---

## 1. Workspace Structure

The monorepo already uses Yarn workspaces (`"workspaces": ["packages/*"]` in root `package.json`). Commonplace will live alongside the existing packages:

```
mesh/
├── app/                    # Mesh Next.js app (unchanged)
├── packages/
│   ├── sheaf-acl/          # existing
│   ├── commonplace/        # ← new Next.js app
│   │   ├── app/            # Next.js app router
│   │   ├── components/     # Commonplace-specific UI
│   │   ├── lib/            # Local utilities
│   │   ├── prisma/         # Own Prisma schema (separate DB)
│   │   ├── workers/        # Commonplace-specific workers
│   │   ├── public/
│   │   ├── next.config.mjs
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   └── shared/             # ← new: extracted shared infra
│       ├── tiptap/         # Tiptap extensions (from lib/tiptap/)
│       ├── graph/          # Graph layouts (from components/graph/)
│       ├── queue/          # BullMQ setup (from lib/queue.ts)
│       └── versioning/     # Revision history patterns (from lib/provenance/)
```

The `packages/shared` package holds infrastructure that both Mesh and Commonplace consume. This avoids duplicating code while keeping domain models separate.

---

## 2. Create the Shared Infrastructure Package

### 2.1 Package scaffold

```bash
mkdir -p packages/shared/{tiptap,graph,queue,versioning}
```

**`packages/shared/package.json`**:
```json
{
  "name": "@app/shared",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    "./tiptap": { "types": "./dist/tiptap/index.d.ts", "default": "./dist/tiptap/index.js" },
    "./graph":  { "types": "./dist/graph/index.d.ts",  "default": "./dist/graph/index.js" },
    "./queue":  { "types": "./dist/queue/index.d.ts",  "default": "./dist/queue/index.js" },
    "./versioning": { "types": "./dist/versioning/index.d.ts", "default": "./dist/versioning/index.js" }
  },
  "scripts": {
    "build": "tsc -p tsconfig.json"
  },
  "peerDependencies": {
    "@tiptap/starter-kit": "^2.0.0",
    "@tiptap/extension-underline": "^2.0.0",
    "@tiptap/extension-highlight": "^2.0.0",
    "@tiptap/extension-link": "^2.0.0",
    "@tiptap/extension-text-style": "^2.0.0",
    "@tiptap/extension-color": "^2.0.0",
    "cytoscape": "^3.30.0",
    "bullmq": "^3.0.0",
    "ioredis": "^5.0.0"
  },
  "devDependencies": {
    "typescript": "^5.5.4"
  }
}
```

### 2.2 What to extract

**Tiptap** — Move these from `lib/tiptap/extensions/` into `packages/shared/tiptap/`:

| File | Keep / Adapt |
|------|-------------|
| `shared.ts` | Keep as-is (core extension bundle) |
| `FancyTextStyle.ts` | Keep |
| `ssr-text-align.ts` | Keep |
| `sectionBreak.ts` | Keep |
| `block-move.ts` | Keep |
| `indent.ts` | Keep |
| `code-tab.ts` | Keep |
| `font-family.ts` | Keep |
| `font-size.ts` | Keep |
| `citation-node.tsx` | **Drop** (Mesh domain-specific) |
| `argument-node.tsx` | **Drop** |
| `claim-node.tsx` | **Drop** |
| `proposition-node.tsx` | **Drop** |
| `draft-claim-node.tsx` | **Drop** |
| `draft-proposition-node.tsx` | **Drop** |
| `theorywork-node.tsx` | **Drop** |
| `quick-link.ts` | Keep (useful for internal linking) |

The domain-specific nodes (argument, claim, proposition) stay in Mesh. Commonplace will define its own Tiptap nodes for entry genres (excerpt, meditation, etc.) in its local codebase.

**Graph layouts** — Extract `components/graph/layouts.ts` into `packages/shared/graph/`. The layout algorithms (hierarchical, polarized, grounded, temporal, focus) are generic graph layout functions that take `{ nodes, edges }` and return positions. The Cytoscape React wrapper components (`AFLens.tsx`, `BipolarLens.tsx`) stay in Mesh — Commonplace will build its own wrapper with its own node/edge types.

**Queue** — Extract the connection + queue factory pattern from `lib/queue.ts` into `packages/shared/queue/`:

```typescript
// packages/shared/queue/index.ts
import { Queue } from "bullmq";
import IORedis from "ioredis";

export function createConnection(redisUrl: string) {
  return new IORedis(redisUrl, { maxRetriesPerRequest: null });
}

export function createQueue(name: string, connection: IORedis) {
  return new Queue(name, { connection });
}
```

Individual queue definitions and workers stay in each app. Only the setup pattern is shared.

**Versioning** — Extract the revision-history data patterns from `lib/provenance/` into `packages/shared/versioning/`. This is primarily the *types and interfaces* — `VersionChangeType` enum, the version-chain data structure, the diff-comparison interface. The actual Prisma queries stay in each app because they'll operate on different schemas.

### 2.3 Update Mesh to consume shared

After extraction, update Mesh's imports:

```typescript
// Before (in Mesh):
import { tiptapSharedExtensions } from "@/lib/tiptap/extensions/shared";

// After:
import { tiptapSharedExtensions } from "@app/shared/tiptap";
```

Update root `tsconfig.json` paths:

```json
"paths": {
  "@/*": ["./*"],
  "@app/sheaf-acl": ["packages/sheaf-acl/src/index.ts"],
  "@app/shared/*": ["packages/shared/src/*"]
}
```

---

## 3. Create the Commonplace App

### 3.1 Scaffold

```bash
cd packages
npx create-next-app@14 commonplace \
  --typescript --tailwind --eslint \
  --app --src-dir=false --import-alias="@cp/*"
```

Then edit `packages/commonplace/package.json`:

```json
{
  "name": "@app/commonplace",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3100",
    "build": "next build",
    "start": "next start -p 3100",
    "lint": "next lint",
    "db:push": "prisma db push",
    "db:studio": "npx prisma studio",
    "worker": "tsx -r dotenv/config workers/index.ts"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "@prisma/client": "^5.0.0",
    "@app/shared": "workspace:*",
    "@tiptap/react": "^2.0.0",
    "@tiptap/starter-kit": "^2.0.0",
    "@tiptap/extension-underline": "^2.0.0",
    "@tiptap/extension-highlight": "^2.0.0",
    "@tiptap/extension-link": "^2.0.0",
    "@tiptap/extension-text-style": "^2.0.0",
    "@tiptap/extension-color": "^2.0.0",
    "cytoscape": "^3.33.0",
    "bullmq": "^3.0.0",
    "ioredis": "^5.0.0",
    "zod": "^3.0.0"
  },
  "devDependencies": {
    "typescript": "^5.5.4",
    "prisma": "^5.0.0",
    "tailwindcss": "^3.0.0",
    "tsx": "^4.0.0"
  }
}
```

### 3.2 TypeScript config

**`packages/commonplace/tsconfig.json`**:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["DOM", "DOM.Iterable", "ES2020"],
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "baseUrl": ".",
    "paths": {
      "@cp/*": ["./*"],
      "@app/shared/*": ["../shared/src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 3.3 Next.js config

**`packages/commonplace/next.config.mjs`**:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@app/shared"],
};

export default nextConfig;
```

### 3.4 Root package.json scripts

Add to the root `package.json` scripts:

```json
"cp:dev": "npm run -w @app/commonplace dev",
"cp:build": "npm run -w @app/commonplace build",
"cp:worker": "npm run -w @app/commonplace worker",
"cp:db:push": "npm run -w @app/commonplace db:push"
```

---

## 4. Commonplace Data Model (Own Prisma Schema)

Commonplace gets its own Prisma schema pointing at its own database. This is the core divergence from Mesh — separate data, separate domain.

**`packages/commonplace/prisma/schema.prisma`**:

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/.prisma/commonplace-client"
}

datasource db {
  provider = "postgresql"
  url      = env("COMMONPLACE_DATABASE_URL")
}

// ─── Entry System ───────────────────────────────────────

enum EntryGenre {
  EXCERPT       // passage from a source text
  OBSERVATION   // something noticed in experience
  MEDITATION    // sustained thought on a named theme
  DIALOGUE      // imagined conversation
  LETTER        // written to a specific addressee
  LIST          // accumulating inventory
  FRAGMENT      // uncategorized
}

model Entry {
  id        String     @id @default(cuid())
  genre     EntryGenre @default(FRAGMENT)
  body      Json       // Tiptap JSON document
  plainText String     @map("plain_text") // searchable plaintext extraction

  // Temporal structure (primary architectural dimension)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relations
  authorId  String   @map("author_id")
  author    Author   @relation(fields: [authorId], references: [id])
  threadId  String?  @map("thread_id")
  thread    Thread?  @relation(fields: [threadId], references: [id])

  // Revision chain
  versions  EntryVersion[]

  // Citation (for excerpts)
  sourceId  String? @map("source_id")
  source    Source? @relation(fields: [sourceId], references: [id])

  // Cross-references
  outgoingLinks EntryLink[] @relation("from")
  incomingLinks EntryLink[] @relation("to")

  @@index([authorId, createdAt])
  @@index([genre, createdAt])
  @@index([threadId, createdAt])
  @@map("entries")
}

// ─── Revision History ───────────────────────────────────

enum VersionChangeType {
  CREATED
  REVISED
  REFINED
  CORRECTED
  RECLASSIFIED  // genre changed
}

model EntryVersion {
  id              String            @id @default(cuid())
  entryId         String            @map("entry_id")
  entry           Entry             @relation(fields: [entryId], references: [id], onDelete: Cascade)
  versionNumber   Int               @map("version_number")
  body            Json              // Tiptap JSON at this version
  plainText       String            @map("plain_text")
  genre           EntryGenre
  changeType      VersionChangeType @default(CREATED)
  changeNote      String?           @map("change_note")
  previousId      String?           @map("previous_id")
  previous        EntryVersion?     @relation("chain", fields: [previousId], references: [id])
  next            EntryVersion?     @relation("chain")
  createdAt       DateTime          @default(now()) @map("created_at")

  @@unique([entryId, versionNumber])
  @@index([entryId, createdAt])
  @@map("entry_versions")
}

// ─── Threads (Meditation Themes) ────────────────────────

model Thread {
  id          String   @id @default(cuid())
  name        String?  // named themes; null = unnamed/emerging
  description String?
  authorId    String   @map("author_id")
  author      Author   @relation(fields: [authorId], references: [id])
  entries     Entry[]
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  archivedAt  DateTime? @map("archived_at") // dormant themes

  @@index([authorId, updatedAt])
  @@map("threads")
}

// ─── Sources (for Excerpts) ─────────────────────────────

model Source {
  id        String   @id @default(cuid())
  title     String
  author    String?  // source author, not archive author
  url       String?
  isbn      String?
  publisher String?
  year      Int?
  locator   String?  // page number, chapter, timestamp
  entries   Entry[]
  createdAt DateTime @default(now()) @map("created_at")

  @@map("sources")
}

// ─── Cross-References ───────────────────────────────────

enum LinkType {
  REFERENCE         // explicit cross-reference
  DEVELOPS          // this entry develops that one
  RESPONDS_TO       // this entry responds to that one
  CONTRADICTS       // this entry contradicts that one
  SHARED_SOURCE     // linked through same source
}

model EntryLink {
  id       String   @id @default(cuid())
  fromId   String   @map("from_id")
  from     Entry    @relation("from", fields: [fromId], references: [id], onDelete: Cascade)
  toId     String   @map("to_id")
  to       Entry    @relation("to", fields: [toId], references: [id], onDelete: Cascade)
  type     LinkType @default(REFERENCE)
  note     String?  // why this link exists
  createdAt DateTime @default(now()) @map("created_at")

  @@unique([fromId, toId, type])
  @@map("entry_links")
}

// ─── Author ─────────────────────────────────────────────

model Author {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  entries   Entry[]
  threads   Thread[]
  createdAt DateTime @default(now()) @map("created_at")

  @@map("authors")
}
```

Key design decisions in this schema:

- **`body` is Tiptap JSON** — the same document format used by Mesh's editor. This means shared extensions render identically.
- **`plainText` column** — extracted on save for full-text search without parsing JSON.
- **`EntryVersion` chain** — mirrors the `ClaimVersion` pattern from Mesh's provenance system. Each version links to its predecessor, forming a navigable revision chain.
- **`Thread`** — the meditation-thread concept. Entries optionally belong to a named theme. Threads can be archived (dormant) but never deleted.
- **`EntryLink`** — typed edges between entries, supporting the graph-of-entries view. Types are inspired by the document's description of thematic resonance and developmental predecessors.
- **Separate database** — `COMMONPLACE_DATABASE_URL` env var. Completely isolated from Mesh's data.

---

## 5. Commonplace App Skeleton

### 5.1 Minimal app routes

```
packages/commonplace/app/
├── layout.tsx              # Root layout (minimal chrome)
├── page.tsx                # Landing → redirects to /write
├── write/
│   └── page.tsx            # Capture mode (primary entry point)
├── read/
│   ├── page.tsx            # Thread browser
│   └── [threadId]/
│       └── page.tsx        # Single thread reader
├── archive/
│   └── page.tsx            # Long-view mode (temporal horizons)
├── entry/
│   └── [entryId]/
│       └── page.tsx        # Single entry with revision history
├── api/
│   ├── entries/
│   │   └── route.ts        # Entry CRUD
│   ├── threads/
│   │   └── route.ts        # Thread CRUD
│   └── versions/
│       └── route.ts        # Version history
└── globals.css             # Tailwind + Commonplace typography
```

### 5.2 Root layout

```tsx
// packages/commonplace/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Commonplace",
  description: "Infrastructure for personal memory",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-stone-50 text-stone-900 antialiased">
        <main className="mx-auto max-w-2xl px-6 py-12">
          {children}
        </main>
      </body>
    </html>
  );
}
```

The layout is deliberately minimal — `max-w-2xl`, generous padding, no sidebar, no navbar. The document's emphasis on "minimal chrome" and contemplative pacing starts here.

### 5.3 Capture mode stub

```tsx
// packages/commonplace/app/write/page.tsx
"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { tiptapSharedExtensions } from "@app/shared/tiptap";

export default function WritePage() {
  const editor = useEditor({
    extensions: [
      ...tiptapSharedExtensions(),
      // Commonplace-specific extensions will go here
    ],
    editorProps: {
      attributes: {
        class: "prose prose-stone max-w-none focus:outline-none min-h-[60vh]",
      },
    },
    autofocus: true,
  });

  return (
    <div>
      <EditorContent editor={editor} />
    </div>
  );
}
```

---

## 6. Environment & Dev Workflow

### 6.1 Environment variables

**`packages/commonplace/.env`** (gitignored):

```env
COMMONPLACE_DATABASE_URL="postgresql://user:pass@localhost:5432/commonplace"
UPSTASH_REDIS_URL="redis://..."
```

### 6.2 Development commands

```bash
# From repo root:

# First time setup
yarn install
npm run -w @app/shared build

# Push Commonplace schema to its database
npm run -w @app/commonplace db:push

# Run Commonplace dev server (port 3100, separate from Mesh on 3000)
npm run cp:dev

# Run Commonplace workers
npm run cp:worker

# Run Mesh alongside (separate terminal)
yarn dev
```

### 6.3 Build dependency chain

```
@app/shared          ← build first (tsc)
@app/sheaf-acl       ← build first (tsc) — only needed for Mesh
@app/commonplace     ← next build (consumes @app/shared)
ephemera (root)      ← next build (consumes @app/shared + @app/sheaf-acl)
```

Update root `package.json` to add a predev for shared:

```json
"precp:dev": "npm run -w @app/shared build"
```

---

## 7. What Each Cherry-Picked Piece Gives You

| Shared piece | What Commonplace gets | What it still needs to build |
|---|---|---|
| **Tiptap extensions** | Rich text editing with formatting, section breaks, text alignment, font control. Same document format as Mesh. | Genre-specific Tiptap nodes (excerpt with source citation, meditation with thread header, letter with addressee). |
| **Graph layouts** | Temporal spiral layout, hierarchical layout, ego/focus layout — all applicable to entry/theme graphs. | A Cytoscape React wrapper component with entry-specific node rendering and theme-based coloring. |
| **Queue infrastructure** | BullMQ + Redis connection factory. Can immediately define Commonplace queues (embedding, OCR, export). | Individual workers: plaintext extraction, embedding generation, PDF typesetting. |
| **Versioning patterns** | Version-chain data structures and diff interfaces. The conceptual pattern for `EntryVersion`. | Prisma queries for the Commonplace schema, version-diff UI component, revision timeline visualization. |

---

## 8. First Working Milestone

After completing this setup, you should be able to:

1. `npm run cp:dev` → Commonplace dev server running on `localhost:3100`
2. Navigate to `/write` → Tiptap editor with full formatting, autofocused, minimal chrome
3. Save an entry → persisted to the Commonplace Postgres database with genre classification
4. View entry at `/entry/[id]` → rendered from Tiptap JSON with revision history
5. Browse threads at `/read` → list of named themes with entry counts and last-updated dates

This is the "capture mode" from the document — cursor in a text field, minimal chrome, you write. Everything else (reading mode, long-view mode, production mode, physical production) builds on this foundation.

---

## 9. Development Roadmap

### Phase 0 — Scaffold & Shared Extraction
Extract `@app/shared` package from Mesh (Tiptap extensions, graph layouts, queue factory, versioning types). Scaffold `@app/commonplace` Next.js app with its own Prisma schema, Tailwind config, and dev scripts. Verify both apps build and run simultaneously. No user-facing features — just plumbing.

### Phase 1 — Capture Mode
The primary entry point. Tiptap editor at `/write` with minimal chrome. Entry CRUD API routes. Genre selection (subtle post-write prompt — excerpt, observation, meditation, dialogue, letter, list, fragment). Thread assignment for meditations (create new theme or attach to existing). Plaintext extraction on save for search. Auth (likely Firebase, matching Mesh's pattern). This phase produces a usable writing tool.

### Phase 2 — Revision System
`EntryVersion` chain creation on every save. Revision timeline UI on the entry detail page — navigate any prior state, see the diff between versions, read the entry at any point in its history. Genre-reclassification tracked as a version event. Change notes (optional annotations on why a revision was made). This is the "revision as first-class object" commitment.

### Phase 3 — Reading Mode
Thread browser at `/read` — list of named themes sorted by recency, with entry counts and date ranges. Thread detail view showing entries in chronological order with genre indicators. Inline revision markers (show when an entry was last revised). Cross-reference links rendered inline. Full-text search across the archive. This phase makes the archive navigable.

### Phase 4 — Temporal Views
The three horizon modes: one-week (current work), six-month (seasonal development), multi-year (long arc). These are not search — they are curated representations of archive activity over time. Theme activity heatmap or timeline. Dormant/emerging/active thread classification. This is the "long-view mode" — the examination-of-conscience interface. Likely requires a background worker for periodic archive-state snapshots.

### Phase 5 — Citation & Source Graph
Source model with bibliographic metadata. Excerpt entries linked to sources with locator (page, chapter, timestamp). Source detail view showing all excerpts drawn from a given text. Citation graph visualization using shared Cytoscape layouts — entries as nodes, `EntryLink` edges rendered by type. Theme-level graph (threads as supernodes, shared sources and cross-references as edges). This is the graph-of-graphs concept.

### Phase 6 — Production Mode
Artifact composition — select entries from the archive, arrange them into a structured document (essay, letter, collection). Provenance metadata preserved (which entries contributed, which revisions were drawn on). Export to Markdown, HTML, and print-ready PDF. Typography and layout controls for the PDF output (serif body, proper margins, running headers). This is where the archive produces outward-facing artifacts.

### Phase 7 — Physical Production
LaTeX or Typst pipeline for beautifully typeset print artifacts. Yearly or custom-range bound volumes — the user selects a time range or theme, the system generates a print-ready PDF with proper typography, front matter, and index. Integration with a print-on-demand service (Lulu, Blurb) or just PDF download for local printing. This closes the physical-digital loop.

### Phase 8 — Privacy Hardening (Optional / Long-term)
Local-first storage layer (Yjs/automerge on SQLite or IndexedDB). End-to-end encrypted sync. Zero-telemetry architecture. This is the most architecturally demanding phase and fundamentally changes the data layer. Only pursue if the project reaches the scale where the privacy commitment matters practically. Can be deferred indefinitely — the server-side version from Phases 0–7 is fully functional without it.

### Not Planned
- AI integration into the writing practice (per the document's explicit stance)
- Social features beyond deliberate letter exchange
- Productivity metrics, streaks, or gamification
- Mobile app (responsive web is sufficient initially)
