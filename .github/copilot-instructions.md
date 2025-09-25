# Copilot instructions for the Mesh repo

Short, targeted guidance so an AI coding agent can be productive in this monorepo.

- Repo shape: Next.js 14 + TypeScript front-end in `app/`, many React components in `components/`, backend/worker code under `workers/`, `scripts/`, and microservices under `services/`. There is a small monorepo workspace: `packages/*` (see `packages/sheaf-acl`).
- Build/runtime: Project targets Node 18+. The canonical install step in docs is `yarn install` (see `AGENTS.md`), but all runnable scripts live in `package.json` and can be run with `npm run <script>` or `yarn <script>`.

Key scripts to run locally (refer to `package.json`):
- `dev` — Next dev server (app router). Use this to iterate on UI: `yarn dev` or `npm run dev`.
- `build` / `start` — Next production build and start.
- `lint` — run `next lint` (run after edits).
- `test` — runs `jest` for unit tests; `vitest` is also available under `vitest` script.
- `worker` — start project workers (`workers/index.ts`) via `tsx` (reads `.env`).
- `predev` / `prebuild` — build step for `@app/sheaf-acl` workspace; many scripts expect this package to be built first.
- `db:push`, `migrate`, `prisma generate` hooks — Prisma is used; `postinstall` runs `prisma generate` automatically.
- `gen:db:types` — generates Supabase types and requires env vars: `SUPABASE_PROJECT_ID` (and usually `SUPABASE_ACCESS_TOKEN` for `prepare:db:types`).

Type & path conventions
- Path alias `@/*` maps to the repo root (see `tsconfig.json`). You will also see `swapmeet-api` and `@app/sheaf-acl` path mappings.
- Files use TypeScript with `strict: true`. Keep double quotes in TS/TSX files (project convention in `AGENTS.md`).

Runtime & integrations to be aware of
- Databases: Prisma/Postgres; Supabase codegen used (`gen:db:types`).
- Caches/queues: Redis (Upstash) and BullMQ; background jobs live in `workers/` and some API cron routes under `app/api/_cron/`.
- Vector/embeddings: Pinecone present in deps.
- Cloud: AWS SDK (S3, KMS, SES) used in server code; secrets often come from env or k8s/aws infra in CI.
- Third-party services: OpenAI, Stripe, Firebase, LiveKit, Supabase — expect environment variables for service credentials.

Code patterns and locations (examples)
- Next app routes and server handlers: `app/api/**/route.ts` (example: `app/api/_cron/close_auctions/route.ts`). Follow existing patterns for request handlers and exported GET/POST functions.
- Server-only code lives under `app/server/` and `server/` directories. Use existing modules to find shared utilities in `lib/`, `util/`, and `services/`.
- Reusable UI lives under `components/` and is strongly typed; prefer existing component props patterns when adding new UI.

Developer workflow checklist for changes
1. Install deps: `yarn install` (recommended per `AGENTS.md`).
2. Build workspace pieces if needed: `npm run -w @app/sheaf-acl build` or run `predev` automatically by `npm run dev`.
3. Run dev server: `yarn dev`.
4. Run lint: `npm run lint` (fix or format to match project rules — double quotes).
5. Run unit tests: `npm run test` (jest) or `npm run vitest` for package-specific tests.
6. For DB work: set env vars and run `npm run gen:db:types` or `npm run db:push` / `npm run migrate` as appropriate.

When editing: prioritize small focused changes. Preserve existing export shapes and public APIs (many services and other packages import internal modules). If you must change a package public interface, update `packages/sheaf-acl` build and search usages across the repo.

Troubleshooting tips
- If types fail across the repo, ensure `@app/sheaf-acl` is built (predev/prebuild). Run `npm run acl:build` or `npm run -w @app/sheaf-acl build`.
- If Supabase types generation errors: confirm `SUPABASE_PROJECT_ID` / `SUPABASE_ACCESS_TOKEN` env vars.
- Worker/local background jobs: `npm run worker` (reads `.env`); nodemon is used for watch in `watch:worker`.

Files to reference while coding
- `package.json` — authoritative scripts
- `tsconfig.json` — path aliases and strict TS settings
- `AGENTS.md` — project-specific dev guidance (yarn, lint conventions)
- `prisma/` and `supabase/` related scripts — DB schema and generators
- `app/api/` and `workers/` — where backend/cron/worker logic lives

If anything here is unclear or you want me to expand examples (code snippets for a new API route, PR checklist, or a short test harness), tell me which area and I'll iterate.
