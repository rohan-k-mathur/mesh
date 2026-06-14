# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

This repo (npm package `ephemera`, product name **Isonomia** / **Mesh**) is a Next.js 14 App Router monorepo that fuses two layers under one data model:

- **Social layer (MESH)** — chronological feed with eight post types, profiles/follows, rooms & lounges, spatial canvas, sheaf-based layered messaging with drifts, proposals, polls, articles, document libraries.
- **Reasoning layer (Isonomia)** — formal deliberation: ASPIC+ argumentation with Walton schemes and auto-generated critical questions (CQs), Ludics proof-theory engine, typed dialogue protocols with commitment stores, a category-theoretic evidence/confidence algebra, and the Plexus cross-room transport network.

Any social artifact can be upgraded to its formal counterpart through a single reversible action (discussion → deliberation, comment → claim, annotation → proposition). `README.md` has the full conceptual model; read it before large reasoning-layer changes.

## Commands

```bash
npm run dev            # Next dev server (runs predev: builds @app/sheaf-acl first)
npm run build          # Production build (runs prebuild: builds @app/sheaf-acl)
npm run lint           # next lint — run after edits
npm test               # jest (unit tests in tests/ and __tests__/)
npm run vitest         # vitest (used for package-level tests)
npm run acl:test       # vitest run packages/sheaf-acl
npm run worker         # start background workers (workers/index.ts via tsx, reads .env)
```

Run a single jest test: `npx jest path/to/file.test.ts` or `npx jest -t "test name substring"`.

Custom lint invariant: `npm run lint:no-legacy-ludics-read` — enforces that no file under `lib/ludics/substrate/**` reads legacy Ludics tables (`prisma.ludicDesign`, `ludicAct`, `ludicChronicle`, `ludicChronicleCache`). The only permitted legacy reader is `lib/ludics/chronicles/reconstruct.ts`.

## Database (Prisma + Supabase + Postgres)

- **The Prisma schema is at `lib/models/schema.prisma`, not the default `prisma/` location** (configured via `prisma.config.ts`). It is a single ~10.5k-line file with ~376 models.
- **Use `npm run db:push` (`prisma db push`), NOT `prisma migrate dev`.** This is a hard project convention.
- `postinstall` runs `prisma generate` automatically. After schema edits run `npm run db:push` (its `post:` hook regenerates Supabase types via `gen:db:types`, which needs `SUPABASE_PROJECT_ID` / `SUPABASE_ACCESS_TOKEN`).
- If TS/Prisma client types look stale but you've verified the models and DB are correct, it's a local caching issue — restart the TS server / regenerate and proceed.
- `npm run db:studio` opens Prisma Studio.

## Architecture & layout

- **`app/`** — Next.js App Router. Route groups like `(root)`, `(auth)`, `(dashboard)`, `(editor)`, `(kb)`. API handlers are `app/api/**/route.ts` (exported `GET`/`POST` etc.); cron routes under `app/api/_cron/`. The API surface is very large (arguments, claims, citations, deliberations, dialogue, cqs, aif, ludics, plexus, etc.) — search for an existing sibling route and mirror its shape.
- **`components/`** — strongly-typed React UI; reuse existing prop patterns.
- **`lib/`** — the bulk of domain logic, organized by subsystem (`aif/`, `aspic/`, `ludics/`, `dialogue/`, `argumentation/`, `confidence/`, `citation/`, `cq/`, `deliberation/`, `plexus`/`crossDeliberation/`, `evidential/`, etc.). Shared utilities also live in `util/` and `services/`.
- **`workers/`** — BullMQ/cron background jobs (confidence decay, re-embedding, source verification/archiving, knowledge-graph build, transport aggregation). Redis is Upstash; vectors via Pinecone.
- **`services/`** — Python 3.11 microservices (embedding, ranker, explainer, feature-store) deployed via Docker → k8s.
- **`packages/*`** — npm workspaces. `@app/sheaf-acl` (sheaf access-control) **must be built before dev/build** and is depended on widely — if cross-repo types break, rebuild it (`npm run acl:build`). `isonomia-mcp` is the Model Context Protocol server; rebuild with `npm run mcp:rebuild` then restart Claude Desktop. Other packages: `aif-core`, `ludics-core`/`-engine`/`-react`/`-rest`, `dialogue`, `entail`, `commonplace`, `ui`, etc.

## Conventions

- TypeScript `strict: true`. **Use double quotes** for string literals in TS/TSX.
- Path alias `@/*` maps to the repo root (e.g. `@/lib/...`). `@app/sheaf-acl` resolves to the package source.
- Keep changes focused and preserve existing export shapes — many packages/services import internal modules directly.
- Node 18+. Both `npm run <script>` and `yarn <script>` work; docs reference `yarn install`.

## Integrations expecting env vars

OpenAI / DeepSeek (LLM extraction), Stripe, Firebase, LiveKit, Supabase, AWS (S3/KMS/SES), Pinecone, Upstash Redis.
