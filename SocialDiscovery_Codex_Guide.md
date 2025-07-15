Below is a **clean, deduplicated, and fully‑sequenced playbook** for shipping *Social Discovery Engine v2.0* on **Supabase (Postgres + Edge Functions + Storage + pgvector)** and **Vercel (Next.js hosting, serverless/edge, cron, analytics)**.
Copy‑and‑paste each prompt block into **chatgpt.com/codex** (or any Codex‑powered IDE extension) one at a time, review the diff/PR it returns, then move on to the next block. Every block is test‑driven and ends with **“RUN & REPORT.”**

---

# 0  Pre‑Flight Context Prompt  *(paste once per session)*

```txt
You are OpenAI Codex acting as a senior full‑stack engineer at Mesh.
Repository root = https://github.com/mesh‑app/mesh (private).
Create a new <feature‑branch> for each task; open PRs against main.

Current stack
  • Front‑end / API  ▸ Next.js 14 (Edge + Serverless Functions) on Vercel  
  • Database        ▸ Supabase Postgres 16 (pgvector, pg_cron)  
  • Storage         ▸ Supabase Storage buckets  
  • Edge compute    ▸ Supabase Edge Functions (Deno)  
  • Batch           ▸ Vercel Cron Jobs or GitHub Actions  
  • Tooling         ▸ Prisma Client, ESLint + Prettier, Vitest (≥80 % coverage), Conventional Commits  

Reference docs
  • /docs/SRS/SDE_v2.0.pdf   (SRS)  
  • /docs/ARCHITECTURE.md  
  • /docs/READMES/*  

When asked to **RUN & REPORT**, execute  
`pnpm test && pnpm lint && pnpm typecheck` (Node)  
`deno task test`                        (Deno)  
`pytest`                                (Python)  
and summarise results. A failed test/lint aborts the step—nothing is pushed to main.
```

---

# 1  Global Mind‑Set Shifts (AWS → Supabase + Vercel)

| Area                      | Was                                               | **Now**                                                                        |
| ------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------ |
| Infrastructure‑as‑Code    | Terraform (EKS, RDS, S3)                          | **Supabase CLI** migrations + `supabase/config.toml`, **Vercel `vercel.json`** |
| Containers                | k8s Deployments                                   | **No k8s** — Serverless / Edge Functions                                       |
| Stateful Stores           | Aurora PG, Redis, S3, Pinecone                    | **Supabase Postgres + pgvector**, Supabase Storage, Pinecone *or* pgvector ANN |
| Streaming / Feature Store | Kafka + Feast                                     | **pgvector table + Materialised Views**, Supabase Realtime                     |
| Batch                     | Airflow                                           | **pg\_cron**, Vercel Cron, GitHub Actions                                      |
| Secrets                   | AWS Secrets Manager                               | **Supabase `secrets set`** + Vercel Env Vars                                   |
| Removed                   | EKS, Dockerfiles, Redis feature store, Prometheus | (Replaced by stack above)                                                      |

---

# 2  Alpha Phase (Weeks 0 – 4)

### 2.1 Task 1 – Feature‑Store Scaffolding *(pgvector + Materialised View)*

```txt
### Task 1 – Initialise User‑Level Feature Store
Scope
  • Create table `user_taste_vectors` (user_id PK, taste vector(256), traits jsonb, updated_at).
  • Build ANN index with IVFFlat (lists = 100).
  • Materialised view `user_dwell_avg` ← scroll_events.
  • Schedule 5‑min refresh via `pg_cron`.

Files
  ▸ /supabase/migrations/20250715_feature_store.sql  
  ▸ /supabase/config.toml (enable pg_cron extension)

Tests
  • Vitest SQL unit: inserting vector then K‑NN query returns self at rank 1.
  • SQL integration: `REFRESH MATERIALIZED VIEW` completes < 1 s on sample data.

RUN & REPORT
```

---

### 2.2 Task 2 – Extend `UserAttributes` Model

```txt
### Task 2 – Prisma Schema Expansion
Scope
  • Add optional fields: location, birthday, hobbies (String[]), communities (String[]), connectors (Json).
Steps
  1. Update prisma/schema.prisma.
  2. Run `supabase db push` and commit migration.
  3. Update GraphQL mutation `upsertUserAttributes`.
  4. End‑to‑end: onboarding wizard persists attributes.

Tests
  • Vitest resolver unit tests.
  • Playwright e2e: wizard writes & reads back values.

RUN & REPORT
```

---

### 2.3 Task 3 – Embedding Service (v0)

```txt
### Task 3 – Bootstrap Embedding Micro‑Service
Scope
  • Python FastAPI `/embed` → returns 256‑D vector (placeholder: avg FastText of interests).
  • Dockerfile *only for local dev*; deploy as **Vercel Python Serverless Function** `/api/embed.py`.
  • Add gRPC stub for batch embedding.

Tests
  • pytest: embed_empty_input → 422; embed_valid_user → 256‑float list.
  • Vercel health check returns 200.

RUN & REPORT
```

---

### 2.4 Task 4 – Candidate Query API + Vector Upsert

```txt
### Task 4 – `/api/v2/discovery/candidates`
Scope
  • On profile save → queue re‑embed & upsert vector to `user_taste_vectors`.
  • API route: `GET ?k=50` → pgvector cosine search; JWT‑protected.

Steps
  1. util/postgresVector.ts – helper for `SELECT … ORDER BY taste <-> $1 LIMIT $k`.
  2. Queue worker: Supabase Edge Function subscribes to `user_attributes_updated`.
  3. API route returns `{userId, score}[]`.

Tests
  • Jest pgmock: two dummy users, expect closest vector returned.
  • 30‑sec Redis memoization to meet p95 ≤ 120 ms.

RUN & REPORT
```

---

### 2.5 Task A1 – Canonical Media DB

```txt
### Task A1 – Canonical Media DB
Scope
  • Append `CanonicalMedia` & `FavoriteItem` models to prisma schema.
  • Seed ≥ 50 k rows (sample dataset) via `scripts/seed_cmd.ts`.

Tests
  • Vitest: `canonicalise("Blade Runner (Final Cut)")` ⇒ `id("tt0083658")`.
  • Seed runs with no PK collisions.

RUN & REPORT
```

---

### 2.6 Task A2 – Spotify Favorites Ingest

```txt
### Task A2 – Spotify OAuth + Ingest Worker
Scope
  • POST `/api/v2/favorites/import/spotify` – exchange code, fetch likes.
  • Upload raw JSON to Supabase Storage bucket `favorites_raw/spotify/${userId}/${ts}.json`
    using `createSignedUploadUrl` (no service‑role key exposed).
  • Track ingest status in Redis `fav:sync:${userId}`.

Tests
  • Jest: token refresh flow, storage upload mocked, status flag toggled.
  • Playwright e2e: connect flow shows “Syncing…”.

RUN & REPORT
```

---

### 2.7 Task A3 – External Metadata Fetcher

```txt
### Task A3 – TMDb / MusicBrainz / OpenLibrary Fetcher
Scope
  • Edge Function `fetch_meta(id)` → `{genres, year, synopsis,…}`.
  • 24 h Redis cache (`meta:${id}`); merge into `CanonicalMedia.metadata`.

Tests
  • Unit: cache hit ratio logic.
  • Contract: TMDb sample response maps correctly to DB row upsert.

RUN & REPORT
```

---

# 3  Beta Phase (Weeks 5 – 10)

### 3.1 Task 5 – Behavioural Event Streaming (Scroll & Dwell)

```txt
### Task 5 – Front‑end Analytics → Supabase Realtime
Scope
  • Emit `scroll_pause` + `dwell_time` events to Postgres table `scroll_events`
    with Row‑Level Security enabled.
  • Supabase Realtime channel `user_behavior` notifies Edge consumers.
  • Materialised view `user_dwell_avg` (7‑day window) already scheduled by Task 1.

Tests
  • Front‑end e2e: scroll generates 200‑OK analytics calls.
  • SQL: dwell view refreshes and row count matches events.

RUN & REPORT
```

---

### 3.2 Task 6 – LightGBM Re‑Ranker Service

```txt
### Task 6 – LightGBM Ranker
Scope
  • Train offline (Python script `/ml/offline_train_ranker.py`) on features parquet.
  • Serve via FastAPI gRPC: `Rank(viewerId, candidateIds[]) → rankedIds[]`.
  • Shadow‑deploy behind GrowthBook flag `discovery_reranker_v2`.

Tests
  • pytest synthetic data ranking.
  • gRPC contract test.

RUN & REPORT
```

---

### 3.3 Task 7 – `<DiscoveryCardStack>` + Feedback Loop

```txt
### Task 7 – Swipe‑to‑Tune Card Stack
Scope
  • React component: swipe right/left POSTs `/api/v2/discovery/feedback`.
  • Feedback enters Redis stream for incremental learner (see Task 13).

Tests
  • React Testing Library: swipe gesture recognised.
  • API rate‑limited to 100 req / min.

RUN & REPORT
```

---

### 3.4 Task 8 – Privacy Dashboard MVP

```txt
### Task 8 – Discovery Data Settings
Scope
  • Route `/settings/discovery`: toggles for Interests, Behavioural Data, External Connectors.
  • PATCH `/api/v2/discovery/privacy` → mask feature group + schedule re‑embed.

Tests
  • Cypress: opt‑out “Behavioural Data” → feature masked flag true.
  • Unit: re‑embed job enqueued.

RUN & REPORT
```

---

### 3.5 Task B1 – Media Embedding API (Vercel)

```txt
### Task B1 – media‑embedding‑api
Scope
  • Vercel Python Function `/api/embed.py`  
      – POST {mediaId} → fetch metadata → OpenAI text‑embedding‑3‑large  
      – Store 768‑D fp16 in `CanonicalMedia.embedding`.  
  • Skip OpenAI call if embedding exists.

Tests
  • pytest: `embed_existing_returns_cached`.
  • Vitest TS mock call from builder job.

RUN & REPORT
```

---

### 3.6 Task B2 – Nightly Favorites Feature Builder

```txt
### Task B2 – favorites_feature_builder (Vercel Cron 02:00 UTC)
Scope
  1. Load new `FavoriteItem` rows.  
  2. Ensure embeddings via media‑embedding‑api.  
  3. Per user: build 256‑D taste_vector (PCA) → `user_taste_vectors`.  
  4. Log token usage.

Tests
  • Great Expectations: ≥ 95 % favorites have embedding.
  • Dag integrity via `pytest-airflow`.

RUN & REPORT
```

---

### 3.7 Task B3 – Taste‑Aware Candidates API

````txt
### Task B3 – taste‑aware candidates
Scope
  • SQL:  
    ```sql
    SELECT user_id, taste <-> $1 AS dist
    FROM user_taste_vectors
    ORDER BY dist
    LIMIT 200;
    ```  
  • Merge with Two‑Tower list; dedupe; 30 s Redis cache.

Tests
  • Jest: union without duplicates.
  • k6 load: 500 rps ≤ 120 ms p95 (mock pgvector).

RUN & REPORT
````

---

### 3.8 Task B4 – `<FavoritesManager>` UI

```txt
### Task B4 – Favorites Manager
Scope
  • Route `/settings/favorites`: connector status chips, manual add autocomplete (CMD search API).
  • Show last‑sync timestamp via `/favorites/status`.

Tests
  • RTL: autocomplete debounce 150 ms.
  • axe‑core: WCAG 2.1 AA pass.

RUN & REPORT
```

---

# 4  GA Phase (Weeks 11 – 18)

### 4.1 Task 9 – Post‑Ranking Diversity & Safety Filter

```txt
### Task 9 – post_rank_filter service
Scope
  • Determinantal Point Process (DPP) diversity, harassment_score filter > 0.8, ±10 % gender parity.

Tests
  • Unit: DPP coverage.
  • Integration: 100‑candidate fixture passes safety & diversity.

RUN & REPORT
```

---

### 4.2 Task 10 – Explainability API

```txt
### Task 10 – /api/v2/discovery/why/:targetId
Scope
  • SHAP on LightGBM to select top 2 features.  Map via /config/explain_map.json.  
  • Locales: en, es; cached.

Tests
  • Jest: outputs `{reason_en, reason_es}`.
  • Perf: < 20 ms via cache.

RUN & REPORT
```

---

### 4.3 Task 11 – Experimentation Framework

```txt
### Task 11 – GrowthBook Roll‑out
Scope
  • Flag `discovery_reranker_v2`, assignment logging, Grafana dashboard.

Tests
  • Unit: flag evaluation.
  • Integration: hold‑out bypasses reranker.

RUN & REPORT
```

---

### 4.4 Task 12 – i18n & Accessibility Polish

```txt
### Task 12 – Localization & a11y
Scope
  • Spanish translations, keyboard nav for Card Stack.

Tests
  • jest‑axe, i18next snapshots.

RUN & REPORT
```

---

### 4.5 Task G1 – Trait‑Inference Batch Job

```txt
### Task G1 – batch_trait_inference (GitHub Actions weekly)
Scope
  • For each user: top 15 favorites → GPT‑4o prompt → traits JSON (validate against schema).  
  • Write to `user_taste_vectors.traits`.

Budget ≤ $0.02 / active user / month.

Tests
  • pytest: JSONSchema validation retry logic.
  • Cost monitor unit test.

RUN & REPORT
```

---

### 4.6 Task G2 – Trait‑Based Explainability

```txt
### Task G2 – why/:targetId enhancements
Scope
  • If trait overlap ≥ 1 → chip “Both appreciate X”.  Locales en, es.

Tests
  • Jest: no live LLM call.
  • RTL: Spanish chip renders when locale = es.

RUN & REPORT
```

---

### 4.7 Task G3 – Favorites Opt‑Out Flow

```txt
### Task G3 – favorites opt‑out
Scope
  • Toggle in Privacy Dashboard ⇒ PATCH `/api/v2/discovery/privacy {"favorites": false}`  
  • Backend deletes vectors/traits, sets Redis fallback flag; re‑enable triggers nightly rebuild.

Tests
  • Cypress: toggle → generic slate served.
  • Unit: Feast delete + Redis flag set.

RUN & REPORT
```

---

# 5  Continuous Improvement

### 5.1 Task 13 – Online Incremental Learner

```txt
### Task 13 – online_lightgbm_update
Scope
  • Every 30 min, train LightGBM on feedback stream; shadow deploy; promote on metric threshold.

Tests
  • Unit: incremental training.
  • Canary deployment script.

RUN & REPORT
```

---

### 5.2 Task 14 – Federated Embeddings PoC *(research)*

```txt
### Task 14 – federated_embeddings_experiment
Scope
  • Flower framework; compare cosine@10 vs central baseline.
Deliverable = notebook `/experiments/federated_2025‑Q4.ipynb` (no RUN & REPORT).
```

---

### 5.3 Task C1 – Open‑Source Embedding A/B

```txt
### Task C1 – oss_embeddings_v1
Scope
  • Replace OpenAI model with `all‑mpnet-base-v2` under GrowthBook flag; benchmark latency & cost.

No RUN & REPORT yet (research).
```

---

### 5.4 Task C2 – Cost Regression Alert

```txt
### Task C2 – cost_regression_logflare
Scope
  • Supabase Logflare source `openai_embeddings`.  
  • SQL alert: SUM(token_cost) > budget × 1.1 over 7 d ⇒ webhook to #discovery‑alerts.  
  • Commit dashboard JSON under /infra/logflare/.

Tests
  • Vitest: alert query returns rows when threshold breached.

RUN & REPORT
```

---

# 6  Release Gate

```txt
### Final Task – v2.1 release gate (Supabase + Vercel)
Scope
  • `pnpm test | deno task test | pytest` all green.  
  • `supabase db diff --linked` shows zero drift.  
  • `vercel --prod --prebuilt` succeeds.  
  • Generate CHANGELOG.md; create GitHub Release draft with migration docs.

RUN & REPORT
```

---

## How the Playbook Maps to the SRS

| SRS Area              | Tasks            | Validation                           |
| --------------------- | ---------------- | ------------------------------------ |
| Data Model Expansion  | 2                | Prisma migration tests               |
| Signal Ingestion      | 1, 5             | SQL view + e2e scroll tests          |
| Embedding & Vectors   | 3, 4, B1‑B3      | pytest, integration, k6              |
| Re‑Ranker & Diversity | 6, 9             | gRPC + DPP tests                     |
| UI & Explainability   | 7, 8, 10, 12, G2 | RTL, Cypress, jest‑axe               |
| Metrics & A/B         | 11, 13           | Grafana dashboards, GrowthBook flags |
| Privacy & Safety      | 8, 9, G3         | Opt‑out propagation, safety filters  |
| Cost & Monitoring     | C1, C2           | Logflare alert, cost benchmarks      |
| Release & CI          | Final Task       | Full test suite, zero‑drift DB       |

---

### Progress Summary

* Tasks 1–4 and A1–A3 completed: feature store, schema expansion, embedding microservice, candidate API, canonical media DB, Spotify ingest and metadata fetcher.
* Task 5 implemented via `useScrollAnalytics` and Supabase realtime; data flows into materialised views.
* LightGBM ranker service (Task 6) present with tests but not yet integrated.
* Later tasks (7+, B‑series, G‑series) including privacy dashboard, taste-aware API and cost alerts remain outstanding.

### Using the Playbook

1. **Copy** the Pre‑Flight prompt into Codex to establish context.
2. **Work top‑to‑bottom, one block at a time.** Wait for each RUN & REPORT summary; merge or fix before continuing.
3. **Never queue multiple blocks.** The incremental, test‑driven rhythm is what keeps the implementation aligned with the SRS.

Happy shipping!
