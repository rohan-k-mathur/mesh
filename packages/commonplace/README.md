# Commonplace

Self-contained Next.js app inside the Mesh monorepo. See [../../COMMONPLACE_SETUP.md](../../COMMONPLACE_SETUP.md) for the full setup rationale and roadmap.

## Quick start

```bash
# From repo root, install workspaces
npm install

# Configure environment
cp packages/commonplace/.env.example packages/commonplace/.env
# Edit .env with your COMMONPLACE_DATABASE_URL and UPSTASH_REDIS_URL

# Push schema to your database
npm run -w @app/commonplace db:push

# Run dev server (http://localhost:3100)
npm run -w @app/commonplace dev
```

Mesh continues to run unmodified on port 3000.

## Layout

- `app/` — Next.js app router (routes: `/write`, `/read`, `/archive`, `/entry/[id]`, `/api/*`)
- `lib/tiptap/` — vendored generic Tiptap extensions (one-time copy from Mesh)
- `lib/graph/` — placeholder for Phase 5 citation-graph layouts
- `lib/queue.ts` — BullMQ + Redis connection factory
- `lib/versioning.ts` — version-chain types
- `lib/prisma.ts` — Prisma client singleton
- `lib/extract-plain-text.ts` — Tiptap JSON → searchable plaintext
- `prisma/schema.prisma` — own schema, own database (`COMMONPLACE_DATABASE_URL`)
- `workers/` — background-job entrypoint (BullMQ)

## Path alias

`@cp/*` maps to the package root. Example:

```ts
import { tiptapSharedExtensions } from "@cp/lib/tiptap/shared";
```

The Mesh `@/*` alias is unaffected and unrelated.
