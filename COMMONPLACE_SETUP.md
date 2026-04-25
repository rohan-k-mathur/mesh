# Commonplace: Initial Setup Guide

How to bootstrap Commonplace as a **fully self-contained** Next.js app inside the Mesh monorepo. The setup procedure does not modify any existing Mesh file, does not extract code out of Mesh, and does not edit the root `package.json` or `tsconfig.json`. Everything lives under a single new directory: `packages/commonplace/`.

The original, extraction-based plan is preserved in [COMMONPLACE_SETUP.original.md](COMMONPLACE_SETUP.original.md) for reference. Use it later if/when shared-code duplication becomes painful enough to justify factoring out an `@app/shared` package. For the MVP, the goal is to add Commonplace to the repo with zero touch on existing files.

---

## 1. Guiding Constraint

**No file outside `packages/commonplace/` is modified by this setup.** Specifically:

- `package.json` (root) — untouched. Yarn workspaces already match `packages/*`, so Commonplace is picked up automatically.
- `tsconfig.json` (root) — untouched. Commonplace defines its own `tsconfig.json` with its own path aliases, scoped to its own directory.
- `app/`, `components/`, `lib/`, `workers/`, `services/` (Mesh) — untouched. Nothing is moved out, no imports are rewritten.
- `prisma/schema.prisma` (Mesh) — untouched. Commonplace uses its own Prisma schema in `packages/commonplace/prisma/` pointing at its own database.

The only side effect of `npm install` at the root is updates to the generated `package-lock.json`. That is unavoidable when adding any workspace and is not a hand-edit of an existing file.

---

## 2. Workspace Layout

```
mesh/
├── app/                    # Mesh (unchanged)
├── components/             # Mesh (unchanged)
├── lib/                    # Mesh (unchanged)
├── workers/                # Mesh (unchanged)
├── packages/
│   ├── sheaf-acl/          # existing (unchanged)
│   └── commonplace/        # ← the entire MVP lives here
│       ├── app/            # Next.js app router
│       │   ├── layout.tsx
│       │   ├── page.tsx
│       │   ├── write/page.tsx
│       │   ├── read/page.tsx
│       │   ├── archive/page.tsx
│       │   ├── entry/[entryId]/page.tsx
│       │   └── api/
│       │       ├── entries/route.ts
│       │       ├── threads/route.ts
│       │       └── versions/route.ts
│       ├── components/     # Commonplace UI
│       ├── lib/
│       │   ├── tiptap/     # vendored generic Tiptap extensions (one-time copy)
│       │   ├── graph/      # vendored generic graph layout functions
│       │   ├── queue.ts    # local BullMQ factory (~20 lines)
│       │   └── versioning.ts # local version-chain types (~20 lines)
│       ├── prisma/
│       │   └── schema.prisma  # own schema, own database
│       ├── workers/
│       │   └── index.ts
│       ├── public/
│       ├── next.config.mjs
│       ├── tailwind.config.ts
│       ├── tsconfig.json
│       ├── package.json
│       └── .env            # COMMONPLACE_DATABASE_URL etc.
```

There is no `packages/shared/`. Anything that would have lived there is either vendored into `packages/commonplace/lib/` (one-time copy of stable generic code) or written fresh inside Commonplace (small patterns not worth a shared package yet).

---

## 3. What Gets Vendored vs. Written Fresh

### 3.1 Vendored from Mesh (one-time copy into `packages/commonplace/lib/`)

These files are domain-agnostic, stable, and small. They are copied — not symlinked, not imported across packages — so Commonplace owns its copy outright.

**Tiptap extensions** → `packages/commonplace/lib/tiptap/`:

| File | Source in Mesh | Notes |
|------|---------------|-------|
| `shared.ts` | `lib/tiptap/extensions/shared.ts` | Core extension bundle |
| `FancyTextStyle.ts` | `lib/tiptap/extensions/FancyTextStyle.ts` | |
| `ssr-text-align.ts` | `lib/tiptap/extensions/ssr-text-align.ts` | |
| `sectionBreak.ts` | `lib/tiptap/extensions/sectionBreak.ts` | |
| `block-move.ts` | `lib/tiptap/extensions/block-move.ts` | |
| `indent.ts` | `lib/tiptap/extensions/indent.ts` | |
| `code-tab.ts` | `lib/tiptap/extensions/code-tab.ts` | |
| `font-family.ts` | `lib/tiptap/extensions/font-family.ts` | |
| `font-size.ts` | `lib/tiptap/extensions/font-size.ts` | |
| `quick-link.ts` | `lib/tiptap/extensions/quick-link.ts` | Useful for internal entry linking |

**Explicitly NOT vendored** (Mesh-domain-specific): `citation-node.tsx`, `argument-node.tsx`, `claim-node.tsx`, `proposition-node.tsx`, `draft-claim-node.tsx`, `draft-proposition-node.tsx`, `theorywork-node.tsx`. Commonplace will define its own genre-specific Tiptap nodes (excerpt, meditation, letter) directly in `packages/commonplace/lib/tiptap/nodes/` as they are needed.

**Graph layouts** → `packages/commonplace/lib/graph/layouts.ts`:
Copy the pure layout functions from `components/graph/layouts.ts` (hierarchical, polarized, grounded, temporal, focus). These take `{ nodes, edges }` and return positions; no React, no Cytoscape wrapper. The Cytoscape React wrappers (`AFLens.tsx`, `BipolarLens.tsx`) stay in Mesh — Commonplace will build its own wrapper when Phase 5 (citation graph) lands.

### 3.2 Written fresh inside Commonplace (not vendored)

**`packages/commonplace/lib/queue.ts`** — small enough to write directly rather than share:

```typescript
import { Queue } from "bullmq";
import IORedis from "ioredis";

export function createConnection(redisUrl: string) {
  return new IORedis(redisUrl, { maxRetriesPerRequest: null });
}

export function createQueue(name: string, connection: IORedis) {
  return new Queue(name, { connection });
}
```

**`packages/commonplace/lib/versioning.ts`** — version-chain types specific to the Commonplace schema:

```typescript
export type VersionChangeType =
  | "CREATED"
  | "REVISED"
  | "REFINED"
  | "CORRECTED"
  | "RECLASSIFIED";

export interface VersionChainNode<T> {
  id: string;
  versionNumber: number;
  previousId: string | null;
  body: T;
  changeType: VersionChangeType;
  createdAt: Date;
}
```

The Prisma queries operating on `EntryVersion` are written against Commonplace's own schema in `packages/commonplace/lib/versioning-queries.ts` when needed.

### 3.3 Trade-off

Vendoring duplicates ~10 small, stable files between Mesh and Commonplace. If a bug is fixed in Mesh's copy of a Tiptap extension, it must be manually ported to Commonplace's copy (and vice versa). This is acceptable because:

- The vendored files are stable — they have not changed often in Mesh.
- Divergence is likely anyway as Commonplace adds genre-specific behavior.
- Refactoring to a shared package later is straightforward once the actual sharing surface is known. Premature extraction is harder to undo than late extraction.

If duplication becomes painful, the original extraction-based plan in [COMMONPLACE_SETUP.original.md](COMMONPLACE_SETUP.original.md) is the migration path.

---

## 4. Scaffolding Commonplace

All commands run from the repo root.

### 4.1 Create the Next.js app

```bash
cd packages
npx create-next-app@14 commonplace \
  --typescript --tailwind --eslint \
  --app --src-dir=false --import-alias="@cp/*"
cd ..
```

### 4.2 Replace the generated `package.json`

`packages/commonplace/package.json`:

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
    "db:studio": "prisma studio",
    "prisma:generate": "prisma generate",
    "worker": "tsx -r dotenv/config workers/index.ts",
    "postinstall": "prisma generate"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "@prisma/client": "^5.0.0",
    "@tiptap/react": "^2.0.0",
    "@tiptap/starter-kit": "^2.0.0",
    "@tiptap/extension-underline": "^2.0.0",
    "@tiptap/extension-highlight": "^2.0.0",
    "@tiptap/extension-link": "^2.0.0",
    "@tiptap/extension-text-style": "^2.0.0",
    "@tiptap/extension-color": "^2.0.0",
    "cytoscape": "^3.30.0",
    "bullmq": "^3.0.0",
    "ioredis": "^5.0.0",
    "zod": "^3.0.0"
  },
  "devDependencies": {
    "typescript": "^5.5.4",
    "prisma": "^5.0.0",
    "tailwindcss": "^3.0.0",
    "tsx": "^4.0.0",
    "dotenv": "^16.0.0"
  }
}
```

The Prisma client output is local to this package (see schema below), so Commonplace's `prisma generate` does not interfere with Mesh's `prisma generate`.

### 4.3 TypeScript config (scoped to this package)

`packages/commonplace/tsconfig.json`:

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
      "@cp/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

The `@cp/*` alias is local to Commonplace. The root `tsconfig.json`'s `@/*` alias still points at the Mesh repo root and is unaffected.

### 4.4 Next.js config

`packages/commonplace/next.config.mjs`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // No transpilePackages needed — nothing is shared from outside this package.
};

export default nextConfig;
```

### 4.5 Vendor the generic files

```bash
mkdir -p packages/commonplace/lib/tiptap packages/commonplace/lib/graph

# Tiptap extensions (generic only)
cp lib/tiptap/extensions/{shared,FancyTextStyle,ssr-text-align,sectionBreak,block-move,indent,code-tab,font-family,font-size,quick-link}.ts \
   packages/commonplace/lib/tiptap/

# Graph layouts (pure functions only)
cp components/graph/layouts.ts packages/commonplace/lib/graph/layouts.ts
```

After copying, fix any internal import paths inside the copied files so they resolve within `packages/commonplace/lib/tiptap/` (e.g. if `shared.ts` references sibling files, the relative paths should still work since the directory structure is preserved). The original Mesh files are untouched.

---

## 5. Commonplace Data Model

Commonplace uses its own Prisma schema and its own Postgres database. Mesh's `prisma/schema.prisma` is untouched.

`packages/commonplace/prisma/schema.prisma`:

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
  plainText String     @map("plain_text")

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  authorId  String   @map("author_id")
  author    Author   @relation(fields: [authorId], references: [id])
  threadId  String?  @map("thread_id")
  thread    Thread?  @relation(fields: [threadId], references: [id])

  versions  EntryVersion[]

  sourceId  String? @map("source_id")
  source    Source? @relation(fields: [sourceId], references: [id])

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
  RECLASSIFIED
}

model EntryVersion {
  id            String            @id @default(cuid())
  entryId       String            @map("entry_id")
  entry         Entry             @relation(fields: [entryId], references: [id], onDelete: Cascade)
  versionNumber Int               @map("version_number")
  body          Json
  plainText     String            @map("plain_text")
  genre         EntryGenre
  changeType    VersionChangeType @default(CREATED)
  changeNote    String?           @map("change_note")
  previousId    String?           @map("previous_id")
  previous      EntryVersion?     @relation("chain", fields: [previousId], references: [id])
  next          EntryVersion?     @relation("chain")
  createdAt     DateTime          @default(now()) @map("created_at")

  @@unique([entryId, versionNumber])
  @@index([entryId, createdAt])
  @@map("entry_versions")
}

// ─── Threads (Meditation Themes) ────────────────────────

model Thread {
  id          String    @id @default(cuid())
  name        String?
  description String?
  authorId    String    @map("author_id")
  author      Author    @relation(fields: [authorId], references: [id])
  entries     Entry[]
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  archivedAt  DateTime? @map("archived_at")

  @@index([authorId, updatedAt])
  @@map("threads")
}

// ─── Sources (for Excerpts) ─────────────────────────────

model Source {
  id        String   @id @default(cuid())
  title     String
  author    String?
  url       String?
  isbn      String?
  publisher String?
  year      Int?
  locator   String?
  entries   Entry[]
  createdAt DateTime @default(now()) @map("created_at")

  @@map("sources")
}

// ─── Cross-References ───────────────────────────────────

enum LinkType {
  REFERENCE
  DEVELOPS
  RESPONDS_TO
  CONTRADICTS
  SHARED_SOURCE
}

model EntryLink {
  id        String   @id @default(cuid())
  fromId    String   @map("from_id")
  from      Entry    @relation("from", fields: [fromId], references: [id], onDelete: Cascade)
  toId      String   @map("to_id")
  to        Entry    @relation("to", fields: [toId], references: [id], onDelete: Cascade)
  type      LinkType @default(REFERENCE)
  note      String?
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

Key points:

- **Separate database.** `COMMONPLACE_DATABASE_URL` is a different Postgres instance (or at minimum a different schema/database) from Mesh's `DATABASE_URL`. No shared tables.
- **Local Prisma client output.** `../node_modules/.prisma/commonplace-client` keeps Commonplace's generated client out of Mesh's `node_modules/.prisma/client`. Imports use `import { PrismaClient } from "@prisma/client"` resolved through Commonplace's own `node_modules`.
- **`body` is Tiptap JSON.** Same document format the vendored extensions produce.
- **`plainText` column.** Extracted on save for full-text search without parsing JSON.
- **`EntryVersion` chain.** Mirrors Mesh's `ClaimVersion` pattern conceptually but is a fresh implementation against this schema.

---

## 6. App Skeleton

```
packages/commonplace/app/
├── layout.tsx              # Root layout (minimal chrome, max-w-2xl)
├── page.tsx                # Landing → redirects to /write
├── write/page.tsx          # Capture mode (primary entry point)
├── read/
│   ├── page.tsx            # Thread browser
│   └── [threadId]/page.tsx # Single thread reader
├── archive/page.tsx        # Long-view mode
├── entry/[entryId]/page.tsx # Entry + revision history
└── api/
    ├── entries/route.ts
    ├── threads/route.ts
    └── versions/route.ts
```

### 6.1 Root layout

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
        <main className="mx-auto max-w-2xl px-6 py-12">{children}</main>
      </body>
    </html>
  );
}
```

### 6.2 Capture mode stub

```tsx
// packages/commonplace/app/write/page.tsx
"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { tiptapSharedExtensions } from "@cp/lib/tiptap/shared";

export default function WritePage() {
  const editor = useEditor({
    extensions: [
      ...tiptapSharedExtensions(),
      // Commonplace genre-specific nodes go here as they are built.
    ],
    editorProps: {
      attributes: {
        class: "prose prose-stone max-w-none focus:outline-none min-h-[60vh]",
      },
    },
    autofocus: true,
  });

  return <EditorContent editor={editor} />;
}
```

The import uses `@cp/lib/tiptap/shared`, the local alias defined in Commonplace's own `tsconfig.json`. There is no cross-package import.

---

## 7. Environment & Dev Workflow

### 7.1 Environment variables

`packages/commonplace/.env` (gitignored, local to the package). The MVP uses Supabase Postgres with Prisma; both pooled and direct URLs are required so migrations bypass the pooler:

```env
# Pooled (port 6543) — runtime
COMMONPLACE_DATABASE_URL="postgresql://postgres.<project-ref>:<password>@<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
# Direct (port 5432) — migrations / prisma db push
COMMONPLACE_DIRECT_URL="postgresql://postgres.<project-ref>:<password>@<region>.pooler.supabase.com:5432/postgres"

# Supabase JS client (Phase 1+ auth)
NEXT_PUBLIC_SUPABASE_URL="https://<project-ref>.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_..."

UPSTASH_REDIS_URL=""   # optional; needed in Phase 4+
```

See [packages/commonplace/.env.example](packages/commonplace/.env.example) for the concrete project values. Mesh's `.env` is untouched and unrelated.

### 7.2 Commands

All run from the repo root unless noted.

```bash
# First time (after creating packages/commonplace/):
npm install                              # picks up the new workspace, updates package-lock.json

# Push Commonplace schema to its database:
npm run -w @app/commonplace db:push

# Generate the Commonplace Prisma client:
npm run -w @app/commonplace prisma:generate

# Run Commonplace dev server (port 3100):
npm run -w @app/commonplace dev

# Run Commonplace workers:
npm run -w @app/commonplace worker

# Mesh continues to work exactly as before, unmodified:
npm run dev    # Mesh on port 3000
```

> Note: AGENTS.md mentions yarn, but the repo's actual lockfile is `package-lock.json`, so npm is the working package manager. Both work via workspaces; we use npm here to match the existing lockfile.

If you prefer shorter commands, add aliases to your shell rather than to the root `package.json` — that keeps the no-touch promise.

```bash
# In ~/.zshrc, optional:
alias cp:dev='npm run -w @app/commonplace dev'
alias cp:worker='npm run -w @app/commonplace worker'
alias cp:db:push='npm run -w @app/commonplace db:push'
```

### 7.3 Build dependency chain

```
@app/commonplace   ← self-contained; no internal-package builds required first
@app/sheaf-acl     ← Mesh's prebuild (unchanged)
ephemera (root)    ← Mesh (unchanged)
```

No `predev` or `prebuild` hooks need to be added at the root.

---

## 8. What This Self-Contained Setup Gives You

| Capability | Source |
|---|---|
| Rich-text editing with formatting, section breaks, alignment | Vendored Tiptap extensions in `packages/commonplace/lib/tiptap/` |
| Same document JSON format as Mesh | Same vendored extensions |
| Background-job infrastructure (BullMQ + Redis) | Local 20-line `lib/queue.ts` |
| Graph layout algorithms (for Phase 5 citation graph) | Vendored `lib/graph/layouts.ts` |
| Revision-chain data shape | Local `lib/versioning.ts` + Prisma schema |
| Genre-specific Tiptap nodes | Built fresh in `packages/commonplace/lib/tiptap/nodes/` per phase |
| Cytoscape React wrapper | Built fresh when Phase 5 needs it |
| Prisma queries for `EntryVersion` | Written against Commonplace's own schema |

---

## 9. First Working Milestone (Phase 1)

After this setup completes you should be able to:

1. `yarn workspace @app/commonplace dev` → server on `localhost:3100`.
2. Navigate to `/write` → Tiptap editor with full formatting, autofocused, minimal chrome.
3. Save an entry → persisted to the Commonplace Postgres database with genre classification.
4. View an entry at `/entry/[id]` → rendered from Tiptap JSON with revision history.
5. Browse threads at `/read` → list of named themes with entry counts and last-updated dates.
6. Mesh `yarn dev` continues to work on `localhost:3000`, completely unaffected.

---

## 10. Development Roadmap

### Phase 0 — Self-Contained Scaffold
Create `packages/commonplace/` with Next.js app, own Prisma schema, vendored Tiptap files, vendored graph layouts, local queue/versioning helpers. Verify `yarn install` succeeds, the Commonplace dev server starts on port 3100, and Mesh continues to work unmodified on port 3000. No user-facing features — just plumbing.

### Phase 1 — Capture Mode
Tiptap editor at `/write` with minimal chrome. Entry CRUD API routes. Genre selection (subtle post-write prompt). Thread assignment for meditations. Plaintext extraction on save for search. Auth (likely Firebase, matching Mesh's pattern but with its own Firebase project). This phase produces a usable writing tool.

### Phase 2 — Revision System
`EntryVersion` chain creation on every save. Revision timeline UI on the entry detail page. Genre-reclassification tracked as a version event. Change notes (optional annotations on why a revision was made). Revision-as-first-class-object commitment realized.

### Phase 3 — Reading Mode
Thread browser at `/read` — list of named themes sorted by recency, with entry counts and date ranges. Thread detail view in chronological order. Inline revision markers. Cross-reference links rendered inline. Full-text search across the archive.

### Phase 4 — Temporal Views
The three horizon modes: one-week, six-month, multi-year. Curated representations of archive activity over time. Theme activity heatmap or timeline. Dormant/emerging/active thread classification. Likely requires a background worker for periodic archive-state snapshots.

### Phase 5 — Citation & Source Graph
Source model with bibliographic metadata. Excerpt entries linked to sources with locator. Source detail view showing all excerpts drawn from a given text. Citation graph visualization using the vendored Cytoscape layouts — entries as nodes, `EntryLink` edges rendered by type. Build the Cytoscape React wrapper here, fresh, with Commonplace's own node/edge rendering.

### Phase 6 — Production Mode
Artifact composition — select entries, arrange them into a structured document. Provenance metadata preserved. Export to Markdown, HTML, and print-ready PDF.

### Phase 7 — Physical Production
LaTeX or Typst pipeline for typeset print artifacts. Yearly or custom-range bound volumes. Integration with print-on-demand or local PDF download.

### Phase 8 — Privacy Hardening (Optional / Long-term)
Local-first storage layer (Yjs/automerge on SQLite or IndexedDB). End-to-end encrypted sync. Zero-telemetry architecture. Defer indefinitely if not needed.

### Phase 9 — Optional: Extract `@app/shared`
Only when duplication between Mesh and Commonplace becomes painful (likely never for the vendored Tiptap extensions, possibly relevant if both apps grow shared graph or queue patterns). The migration path is documented in [COMMONPLACE_SETUP.original.md](COMMONPLACE_SETUP.original.md).

### Not Planned
- AI integration into the writing practice (per the document's explicit stance)
- Social features beyond deliberate letter exchange
- Productivity metrics, streaks, or gamification
- Mobile app (responsive web is sufficient initially)
