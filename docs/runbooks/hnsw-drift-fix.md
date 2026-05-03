# HNSW Drift Fix — Maintenance Runbook

**Status**: Open. **Owner**: TBD. **Estimated window**: 30 min hands-on if option A; ~2–4 h if option B.

## Problem (one paragraph)

Every `prisma db push` against the production Supabase host attempts
`DROP INDEX argument_embedding_hnsw` because that index exists in the
live DB but is **not declared in [`lib/models/schema.prisma`](../../lib/models/schema.prisma)**.
The drop needs `ACCESS EXCLUSIVE` on `Argument`, which can't co-exist
with the `AccessShareLock` continuously held by Supabase's pooled
connections (Realtime/Auth/dev server). It hits Supabase's
server-side `statement_timeout` and the entire push aborts. **Net
effect**: schema changes via `db push` are blocked until this is
resolved. Track AI-EPI Pt. 5 sprint work has been routing around it
via `prisma db execute` + raw SQL files in [`scripts/sql/`](../../scripts/sql/),
but that bypass doesn't scale.

## Verified facts (probed 2026-05-01)

- Index `argument_embedding_hnsw` size: **1.8 MB** over **382 rows** — drop is milliseconds *if it can grab the lock*.
- Index is created by [`scripts/migrate-argument-embedding.ts`](../../scripts/migrate-argument-embedding.ts) line 48 with `m=16, ef_construction=64`.
- Prisma 6.14 has **no `Hnsw` value** in its `@@index(type: ...)` enum, so the index cannot be declared in the schema (option 1 from the original triage is dead).
- Two persistent backend pids hold `AccessShareLock` on `Argument` continuously even when local dev server is down — most likely Supabase Realtime/Auth pooler sessions. They will not yield voluntarily.
- `DROP INDEX CONCURRENTLY` *should* coexist with `AccessShareLock` (it only needs `SHARE UPDATE EXCLUSIVE`), but in our test it hung indefinitely. This is consistent with a long-lived idle-in-transaction holder; concurrent index commands wait for *all* transactions started before them to finish.

## Two options

| | **A. One-shot drop + recreate** | **B. Split embeddings into ignored side-table** |
|---|---|---|
| **Cost** | 30 min, single window | ~2–4 h refactor + data backfill |
| **Recurrence** | Will recur if anyone re-runs `migrate-argument-embedding.ts` against prod after a future `db push` (low risk if deleted from script) | Permanent — Prisma never touches embedding indexes again |
| **Risk** | Brief (seconds) `ACCESS EXCLUSIVE` on `Argument`; reads/writes pause | Multi-file code change, raw SQL must be rewritten, must verify embedding writers in a staging push |
| **Recommended for** | Short-term unblock | Long-term sanity |

**Pick A first**. Plan B as a follow-up sprint task only if HNSW drift recurs or if more out-of-band indexes get added.

---

## Option A — drop and recreate

### Pre-flight

1. Notify on-call channel; expect ~5 s degraded vector-search availability + ~30 s before HNSW rebuild completes.
2. **Stop background workers and dev servers** that hold connections to prod (`yarn worker`, any local `next dev` pointed at the prod DB). They are the source of the persistent `AccessShareLock` that defeated `DROP CONCURRENTLY` in the original probe.
3. Have the direct-connection URL handy: `DIRECT_URL` in [`.env`](../../.env) (port 5432, **not** the 6543 pooler).

### Step 1 — clear the index

Open a `psql` session against `DIRECT_URL` (or run via Node `pg`). Then:

```sql
SET statement_timeout = 0;
SET lock_timeout = '5s';

-- Try the safe path first.
DROP INDEX CONCURRENTLY IF EXISTS argument_embedding_hnsw;
```

If the CONCURRENT drop hangs > ~60 s, it's waiting on a long-lived
session. Identify it:

```sql
SELECT pid, usename, application_name, state,
       NOW() - xact_start AS xact_age,
       NOW() - query_start AS qry_age,
       left(query, 120) AS q
  FROM pg_stat_activity
 WHERE datname = current_database()
   AND state IN ('idle in transaction','active')
 ORDER BY xact_start NULLS LAST;
```

Kill the offender(s):

```sql
SELECT pg_cancel_backend(<pid>);   -- try this first
-- if still stuck:
SELECT pg_terminate_backend(<pid>);
```

(Be careful — don't terminate Supabase's own service users
`supabase_admin`, `supabase_auth_admin`, `supabase_realtime_admin`,
or `pgsodium_keymaker`.)

Then re-run the `DROP INDEX CONCURRENTLY` — it should complete in <1 s.

If even that fails, fall back to a non-concurrent drop in a tiny window:

```sql
SET lock_timeout = '30s';
DROP INDEX IF EXISTS argument_embedding_hnsw;   -- needs ACCESS EXCLUSIVE
```

### Step 2 — verify drift is gone

```bash
npx prisma migrate diff \
  --from-schema-datasource lib/models/schema.prisma \
  --to-schema-datamodel    lib/models/schema.prisma \
  --script
```

Expected output: nothing (or unrelated drift you intend to apply).
If you only see `DROP INDEX … argument_embedding_hnsw` — repeat Step 1.

### Step 3 — push the schema

```bash
npx prisma db push --schema lib/models/schema.prisma --skip-generate
```

Should now exit 0 in seconds.

### Step 4 — rebuild the HNSW index

```bash
yarn tsx scripts/migrate-argument-embedding.ts
```

That script is idempotent (`CREATE INDEX IF NOT EXISTS`). Build time
is roughly linear in row count; at 382 rows it's <1 s. At 100k rows
expect 30–60 s. The build is `CONCURRENTLY` only if you edit the
script to add it; the current version uses plain `CREATE INDEX`,
which takes `SHARE` lock (blocks writes, allows reads). For larger
tables, change to `CREATE INDEX CONCURRENTLY` first.

### Step 5 — confirm vector search still works

```bash
yarn tsx scripts/verify-vector-search.ts   # or any existing smoke test
```

### Step 6 — prevent recurrence

Add a comment to [`scripts/migrate-argument-embedding.ts`](../../scripts/migrate-argument-embedding.ts) noting that
the HNSW index is intentionally not in `schema.prisma` and warning
that **after every `prisma db push`** the script must be re-run.
Better still, add a CI step that runs `prisma migrate diff --exit-code`
after push to fail builds the moment new drift appears.

---

## Option B — split into an `@@ignore`'d side table

Use this if Option A keeps recurring or if the embeddings table grows
large enough that a `DROP INDEX` window becomes unacceptable.

### Schema change (in [`lib/models/schema.prisma`](../../lib/models/schema.prisma))

Move the four embedding columns off `Argument` into a 1:1 sibling
table that Prisma is told to ignore:

```prisma
model Argument {
  // …existing fields, minus embedding/embeddingHash/embeddingModel/embeddedAt…
  embeddingRow ArgumentEmbedding?
}

/// Embeddings are managed entirely by raw SQL in
/// scripts/migrate-argument-embedding.ts and lib/argument/embedding.ts.
/// Prisma must not touch this table or its indexes.
model ArgumentEmbedding {
  argumentId     String    @id
  embedding      Unsupported("vector(1536)")?
  embeddingHash  String?
  embeddingModel String?
  embeddedAt     DateTime?
  argument       Argument  @relation(fields: [argumentId], references: [id], onDelete: Cascade)

  @@ignore   // <-- the magic line
}
```

After `db push`, Prisma will no longer diff this table or its indexes.

### Code changes — references to audit and rewrite

These were found via a quick grep; treat as a checklist, not exhaustive:

- [`lib/argument/embedding.ts`](../../lib/argument/embedding.ts) — `read+write of embedding/embeddingHash/embeddingModel/embeddedAt`. The raw `UPDATE "Argument" SET "embeddingHash" = $2, …` block at lines 211-214 must target `"ArgumentEmbedding"` and upsert the FK row.
- [`lib/argument/hybridSearch.ts`](../../lib/argument/hybridSearch.ts) — JOIN to `ArgumentEmbedding` on `argumentId` for the cosine top-K.
- [`scripts/backfill-argument-embeddings.ts`](../../scripts/backfill-argument-embeddings.ts) — `select { embeddingHash, embeddingModel }` becomes a `select` of the related `embeddingRow`.
- [`scripts/migrate-argument-embedding.ts`](../../scripts/migrate-argument-embedding.ts) — DDL: `CREATE TABLE "ArgumentEmbedding"` (with FK), then move the column-add and HNSW-index statements onto the new table.
- [`scripts/generateEmbeddings.ts`](../../scripts/generateEmbeddings.ts) — same shape change as above.
- Any consumer of `prisma.argument.findMany({ select: { embedding: true } })` — search for `embedding: true` and `embeddingHash` in `prisma.argument.*` calls.

### Backfill plan

1. `CREATE TABLE "ArgumentEmbedding" (…)` with no data.
2. `INSERT INTO "ArgumentEmbedding" (…) SELECT id, embedding, … FROM "Argument" WHERE embedding IS NOT NULL` — single statement, fast at current row counts.
3. Deploy app code that reads/writes the new table (dual-write window optional but cleaner).
4. `ALTER TABLE "Argument" DROP COLUMN embedding, DROP COLUMN embeddingHash, DROP COLUMN embeddingModel, DROP COLUMN embeddedAt;`  ← **needs maintenance window** (rewrites the table).
5. Recreate the HNSW index on the new table.

### Verification

- `prisma migrate diff` returns empty.
- `lib/argument/hybridSearch.ts` smoke test returns identical top-K to a baseline captured before the migration.
- The status-board endpoint (Track AI-EPI D.5) still resolves embeddings.

---

## Appendix — useful queries during the window

```sql
-- Index size + table size
SELECT pg_size_pretty(pg_relation_size('argument_embedding_hnsw')) AS idx,
       pg_size_pretty(pg_relation_size('"Argument"'))              AS tbl;

-- Who's holding locks on Argument right now
SELECT l.mode, l.granted, l.pid, a.application_name, a.state,
       NOW() - a.xact_start AS xact_age, left(a.query, 120) AS q
  FROM pg_locks l
  JOIN pg_class c   ON c.oid = l.relation
  JOIN pg_stat_activity a ON a.pid = l.pid
 WHERE c.relname = 'Argument'
 ORDER BY a.xact_start NULLS LAST;

-- Server-side default statement_timeout
SHOW statement_timeout;
```

## Why we didn't fix this in the Track-D sprint

Both fixes need either downtime (A) or a multi-file refactor + data
backfill (B). Either is reasonable but neither is in scope for the
attestation/signing work. The bypass — `prisma db execute` + raw
SQL files in [`scripts/sql/`](../../scripts/sql/) (e.g.
`2026-05-author-signing-key.sql`, `2026-05-author-signing-key-fk.sql`)
— is fine for additive changes; it stops working the moment we need
to alter or drop a Prisma-managed object.
