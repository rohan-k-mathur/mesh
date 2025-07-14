Below is a **“prompt playbook”**—a sequenced set of ready‑to‑paste instructions you can feed into **chatgpt.com/codex** (or any Codex‑powered IDE extension) to implement, validate, and ship every item in the Social Discovery Engine v2.0 SRS. Each prompt block:

1. Sets **scope & acceptance criteria** so Codex knows the “definition of done.”
2. Provides **file/glob references** for rapid grounding (Codex has repository access, but pointing it saves tokens and prevents hallucination).
3. Specifies **coding & testing tasks** in a test‑driven order.
4. Ends with a **“RUN & REPORT”** instruction telling Codex to execute unit tests / linters and summarize results.

> **Tip for live use:** Paste a block, let Codex work, review the diff/PR it produces, then paste the next block.  Never queue multiple blocks at once.

---

## 0  Pre‑flight Context Prompt (paste once per session)

```txt
You are OpenAI Codex acting as a senior full‑stack engineer at Mesh.
Repository root = https://github.com/mesh‑app/mesh (private).
Branch: create <feature-branch> for each task; open PRs against main.
Tech stack:
  • Front‑end: Next.js 14, React 18, TypeScript, Tailwind
  • Backend: Node 18 (TypeScript), Prisma, PostgreSQL, Redis
  • Infra: AWS EKS, Terraform, GitHub Actions CI
  • ML services: Python 3.11 micro‑services deployed via Docker → k8s
Reference docs:
  • /docs/SRS/SDE_v2.0.pdf   (this SRS)
  • /docs/ARCHITECTURE.md
  • /docs/READMES/*
Coding standards: ESLint + Prettier, 80 % test coverage, commit style Conventional Commits.

When asked to “RUN & REPORT,” execute `pnpm test && pnpm lint && pnpm typecheck`
(or equivalent for Python services) and summarise pass/fail.
A failed linter/test terminates the current step; do not push partial code to main.

New high‑level components in v2.1:
  · Canonical Media DB (Aurora / Prisma models)
  · Favorites Connector workers (Node Lambdas)
  · Metadata fetcher + embedding generator
  · Airflow “Favorites Feature Builder” DAG
  · Batch LLM Trait‑Inference job
  · Taste‑aware matching extension
```

---

## 1  Alpha Phase Prompts (Weeks 0‑4)

### 1.1 Feature Store + Behavioural Event Schema

```txt
### Task 1 – Create Feature Store scaffolding
Scope:
  • Introduce Feast (Python) for user‑level features backed by Redis.
  • Add Dockerfile & k8s deployment manifest.
Steps:
  1. Create /services/feature‑store with basic Feast repo.
  2. Define entity `user_id` and feature view `avg_session_dwell_sec_7d` (float).
  3. Add makefile target `make feature‑store-local-up`.
Testing:
  • Unit test: Verify feature ingestion & retrieval in /services/feature‑store/tests/.
Acceptance:
  • All tests pass; docker‑compose up exposes Feast web UI on :8888.
RUN & REPORT


```


### 1.2 Prisma Schema Expansion

```txt
### Task 2 – Extend UserAttributes
Files: prisma/schema.prisma, /apps/web/src/graphql/*
Scope:
  • Add fields: location (String?), birthday (DateTime?), hobbies (String[]), communities (String[])
  • Add connectors (Json) for hashed external IDs.
Steps:
  1. Modify schema and run `pnpm prisma generate`.
  2. Update upsertUserAttributes mutation + validation.
  3. Write migration SQL in prisma/migrations/20250713_user_attributes_expand.
Testing:
  • Unit tests for resolver.
  • e2e test with Playwright: onboarding wizard saves attributes.
RUN & REPORT
```

### 1.3 Initial Two‑Tower Embedding Service

```txt
### Task 3 – Bootstrap embedding micro‑service
Scope:
  • Python FastAPI service `/embed` that accepts user_id → returns 256‑D vector.
  • Very first version: average FastText embeddings of user interests (as placeholder).
Steps:
  1. Create /services/embedding‑svc.
  2. Dockerfile; deploy to k8s namespace “ml”.
  3. Expose gRPC stub for batch embedding.
Testing:
  • pytest covers embed_empty_input, embed_valid_user.
  • k8s health probe passes.
RUN & REPORT
```


### 1.4 Vector DB Integration & Candidate Query API

```txt
### Task 4 – Integrate Pinecone + create `/api/v2/discovery/candidates`
Files: /apps/web/src/pages/api/v2/discovery/candidates.ts
Scope:
  • Upsert vectors from embedding‑svc to Pinecone.
  • Implement API route:
      query params: `k=number` (default 50)
      auth: JWT
Steps:
  1. Add util pineconeClient.ts.
  2. On user profile save, enqueue job to (re)‑embed and upsert vector.
  3. API route: cosine similarity search → return array of {userId, score}.
Testing:
  • Jest mock for Pinecone.
  • Integration test with two dummy users.
RUN & REPORT
```

### Task A1 – Build Canonical Media DB
Scope:
  • Add Prisma models CanonicalMedia & FavoriteItem (see SRS §7.1).
  • Provision Aurora PostgreSQL via Terraform module infra/aurora_media.
  • Seed CMD with initial TMDb movie dump (top 50 k titles).
Steps:
  1. prisma/schema.prisma – append models.
  2. prisma/migrations – create migration + run generate.
  3. scripts/seed_cmd.ts – pull & insert sample dataset.
  4. Terraform: create aws_rds_cluster & secrets.
Tests:
  • Vitest unit: canonicalise("Blade Runner (Final Cut)") === id("tt0083658").
  • Integration: seed script inserts ≥50 k rows without PK collision.
RUN & REPORT

### Task A2 – OAuth + ingest worker
Files: /connectors/spotify/*
Scope:
  • Implement POST /api/v2/favorites/import/spotify.
  • Exchange code for access token (scope: user‑library‑read).
  • Lambda writes raw liked tracks JSON to S3 s3://favorites_raw/spotify/<userId>/dt.json.
  • Write ingest status to Redis key fav:sync:<userId>.
Tests:
  • Jest: token refresh, S3 putObject mock, status flag toggled.
  • e2e (Playwright): connect flow redirects, shows “Syncing…”.
RUN & REPORT


### Task A3 – TMDb / MusicBrainz / OpenLibrary fetcher
Scope:
  • Serverless function fetch_meta(id) → {genres, year, synopsis, …}
  • 24 h Redis cache (key: meta:<id>).
  • Store merged metadata JSON in CanonicalMedia.metadata.
Tests:
  • Unit: cache hit ratio logic.
  • Contract test: TMDb response → mapper → CMD row upsert.
RUN & REPORT



---

## 2  Beta Phase Prompts (Weeks 5‑10)

### 2.1 Behavioural Event Streaming

```txt
### Task 5 – Kafka event pipeline
Scope:
  • Emit `scroll_pause` and `dwell_time` events from front‑end → Kafka topic `user_behavior`.
  • Flink job aggregates 7‑day avg dwell.
Steps:
  1. Add analytics hook in /apps/web/src/utils/analytics.ts.
  2. Define Flink job in /streaming/dwell_aggregate.
  3. Write to Feast table.
Testing:
  • Unit test Flink window aggregation using testcontainers.
  • Front‑end e2e: simulate scroll, assert POST /analytics success 200.
RUN & REPORT
```

### 2.2 LightGBM Re‑Ranker

```txt
### Task 6 – LightGBM ranker micro‑service
Scope:
  • Train model using offline features (script in /ml/offline_train_ranker.py).
  • gRPC `Rank(request: {viewerId, candidateIds[]}) → rankedIds[]`
Steps:
  1. Create training pipeline reading S3 parquet generated by Airflow.
  2. Serialize model; load in FastAPI service.
  3. Add unit test with synthetic data.
RUN & REPORT
```

### 2.3 Swipe‑to‑Tune Card Stack & Feedback Loop

```txt
### Task 7 – UI & signal ingestion
Scope:
  • React component <DiscoveryCardStack>.
  • Swipe right → POST /api/v2/discovery/feedback {targetId, type:'positive'}
  • Negative swipes likewise.
  • Feedback writes to Feature Store real‑time queue (Redis stream).
Testing:
  • React Testing Library – swipe gestures.
  • API tests: rate‑limiting 100 req/min.
RUN & REPORT
```

### 2.4 Privacy Dashboard MVP

```txt
### Task 8 – Discovery Data settings screen
Scope:
  • Path: /settings/discovery
  • Toggle list: Interests, Behavioural Data, External Connectors.
  • PATCH /api/v2/discovery/privacy.
  • When toggled off, mask feature group in Feast and schedule re‑embedding.
Testing:
  • Cypress e2e: opt‑out “Behavioural Data” → verify Feature Store mask flag set.
RUN & REPORT
```
### Task B1 – media‑embedding‑svc
Scope:
  • FastAPI `/embed` POST {id, text} → 768‑D using OpenAI text-embedding-3-large.
  • Check Redis md5 cache before call.
  • Quantise to fp16 & store in CanonicalMedia.embedding.
  • Dockerfile & k8s Deployment.
Tests:
  • pytest: cache bypass, resizing to 768‑floats.
  • k8s healthcheck responds 200.
RUN & REPORT

### Task B2 – favorites_feature_builder DAG
Scope:
  • Nightly @02:00 UTC.
  • Steps:
      1) Load new FavoriteItem rows.
      2) Ensure embeddings exist via media‑embedding‑svc.
      3) Per‑user: build 256‑D taste_vector (PCA reduce).
      4) feast.online_write(user_id, taste_vector).
  • Log token usage metrics.
Tests:
  • Great Expectations: >95 % favorites have embedding.
  • DAG unit via pytest‑airflow: dag.test_dag_integrity().
RUN & REPORT

### Task B3 – taste‑aware candidates
Files: /apps/web/src/pages/api/v2/discovery/candidates.ts
Scope:
  • Fetch top200 ANN neighbours from taste_vector (pinecone).
  • Merge with existing Two‑Tower list; deduplicate.
  • Preserve latency budget with Redis memoisation 30 s.
Tests:
  • Jest: response contains union without dupes.
  • k6 load: 500 rps ≤120 ms p95 (mock pinecone).
RUN & REPORT

### Task B4 – <FavoritesManager> component
Scope:
  • Route /settings/favorites.
  • Show connectors status chips + manual add autocomplete (CMD search API).
  • Display last sync timestamp (from /favorites/status).
Tests:
  • RTL: autocomplete debounce 150 ms.
  • axe‑core: component is WCAG 2.1 AA compliant.
RUN & REPORT


---

## 3  GA Phase Prompts (Weeks 11‑18)

### 3.1 Diversity & Safety Guardrails

```txt
### Task 9 – Post‑ranking filter service
Scope:
  • Implement Determinantal Point Process (DPP) diversity algorithm.
  • Integrate harassment_score filter >0.8.
  • Enforce ±10 % demographic parity across gender_inferred label.
Files: /services/post_rank_filter/*
Testing:
  • Unit tests for DPP set coverage.
  • Integration test using fixture of 100 candidates with varied scores.
RUN & REPORT
```

### 3.2 Explainability Service

```txt
### Task 10 – `/api/v2/discovery/why/:targetId`
Scope:
  • Use SHAP on LightGBM to pick top 2 features.
  • Map to phrase via /config/explain_map.json.
  • Locales: en, es.
Testing:
  • Jest tests: verify output keys {reason_en, reason_es}.
  • Perf: <20 ms per call via caching.
RUN & REPORT
```

### 3.3 A/B Framework & Metrics

```txt
### Task 11 – GrowthBook rollout
Scope:
  • Instrument flag `discovery_reranker_v2`.
  • Add assignment logging to Experiment DB.
  • Dashboard in Grafana: connection_accept_rate, conversation_depth.
Testing:
  • Unit test flag evaluation.
  • Integration test: user in holdout cohort bypasses re‑ranker.
RUN & REPORT
```

### 3.4 Localization & Accessibility

```txt
### Task 12 – i18n & a11y polish
Scope:
  • Add Spanish translations for discovery components.
  • Ensure card stack supports keyboard navigation (WCAG 2.1 AA).
Testing:
  • jest‑axe for accessibility.
  • React i18next snapshot tests.
RUN & REPORT
```
Trait Inference Batch Job
### Task G1 – batch_trait_inference
Scope:
  • Weekly Airflow DAG:
       – Pull top 15 favorites / user.
       – Build prompt (docs/LLM_PROMPTS.md).
       – Call GPT‑4o (temperature 0.2).
       – Validate against /schemas/traits.schema.json.
       – Feast.online_write(user_id, traits_json).
  • Budget: ≤0.02 USD / active user / month.
Tests:
  • pytest: JSON validation fail → retries 3, quarantines user.
  • Cost monitor unit: sample calc < budget.
RUN & REPORT

Taste‑Based Explainability
### Task G2 – why/:targetId enhancements
Scope:
  • If traits overlap ≥1 key, include chip “Both appreciate X”.
  • Explanations pulled from cached traits_json only.
  • Locales: en, es (use i18n JSON).
Tests:
  • jest: no live LLM call path.
  • RTL: chip renders Spanish when locale=es.
RUN & REPORT

Opt‑Out & Redact Flow
### Task G3 – favorites opt‑out
Scope:
  • Toggle in Privacy Dashboard → PATCH /api/v2/discovery/privacy {"favorites": false}
  • Backend:
       – Deletes taste_vector & traits_json from Feast.
       – Sets redis flag for user fallback path.
  • Re‑enable recomputes vectors next nightly DAG.
Tests:
  • Cypress: toggle off → discover slate uses generic embeddings.
  • Unit: Feast delete called, redis flag set.
RUN & REPORT


---

## 4  Continuous Improvement Prompts

### 4.1 Online Learning Job

```txt
### Task 13 – Online learner
Scope:
  • Batch incremental LightGBM update every 30 min using feedback events.
  • Auto‑shadow deploy model version; promote on metrics threshold success.
Testing:
  • Unit test incremental training function.
  • Canary deployment test script.
RUN & REPORT
```

### 4.2 Federated Learning POC

```txt
### Task 14 – Federated embeddings experiment
Scope:
  • Use Flower framework; train interest embeddings on device simulator.
  • Compare cosine@10 against centralised baseline.
Testing:
  • Notebook with experiment results saved to /experiments/federated_2025‑Q4.ipynb.
No immediate RUN & REPORT (research deliverable).
```

Open‑Source Embedding POC
### Task C1 – replace text-embedding-3-large with all-mpnet-base-v2
Scope:
  • A/B flag `oss_embeddings_v1`.
  • Benchmark cosine@10 vs. baseline; report latency & dollar cost.
No RUN & REPORT yet (research deliverable).

Weekly Cost Regression Guard
### Task C2 – prom_cost_regression
Scope:
  • Prometheus alert: embedding_tokens_weekly > budget *1.1.
  • Terraform alertmanager rule + Slack webhook #discovery‑alerts.
RUN & REPORT


---

## 5  Global Regression & Release Prompt

```txt
### Final Task – Regression & Release Prep
Scope:
  • Run full monorepo test suite, lint, typecheck.
  • Terraform plan & k8s manifests rendered via Helmfile.
  • Bump version to v2.0.0 in CHANGELOG.md.
  • Generate release notes Markdown from Conventional Commits.
RUN & REPORT
```
### Final Task – v2.1 release gate
Scope:
  • Run full test matrix (web, py, infra).
  • Helmfile template render –> kubeval.
  • Changelog auto‑generate v2.1.0.
  • Create GitHub Release draft, attach migration docs.
RUN & REPORT


---

### How This Playbook Ensures Coverage & Quality

| SRS Section           | Prompt Coverage    | Validation                                  |
| --------------------- | ------------------ | ------------------------------------------- |
| Data Model Expansion  | 1.2                | Prisma migration tests                      |
| Signal Ingestion      | 1.1, 2.1           | Unit + Flink container tests                |
| Embedding / Vector    | 1.3, 1.4           | pytest, integration tests                   |
| Re‑Ranker & Diversity | 2.2, 3.1           | gRPC tests, DPP unit tests                  |
| UI Integration        | 2.3, 2.4, 3.2, 3.4 | RTL, Cypress, jest‑axe                      |
| Metrics & A/B         | 3.3, 4.1           | Grafana dashboards, GrowthBook flags        |
| Privacy & Safety      | 2.4, 3.1           | Opt‑out propagation test, guardrail filters |
| MLOps                 | every RUN & REPORT | CI pass gate before merge                   |

| SRS Section                  | Tasks Above | Key Validation                         |
| ---------------------------- | ----------- | -------------------------------------- |
| Canonical Media DB           | A1          | Seed >50 k rows; dedup pass rate       |
| Favorites Connectors         | A2, B4      | OAuth flow e2e + sync status UI        |
| Metadata + Embeddings        | A3, B1      | 95 % coverage; cache hit unit tests    |
| Taste Vector & Feature Store | B2          | GE tests; <90 min DAG for 10 M users   |
| Taste‑Aware Matching         | B3          | p95 latency + union correctness        |
| Trait Inference (LLM)        | G1          | JSONSchema validation; cost monitor    |
| Explanations & UI            | G2, B4      | i18n + no live LLM calls               |
| Privacy / Opt‑Out            | G3          | Feast delete & slate fallback verified |
| Cost & Monitoring            | C1, C2      | Prometheus alert; A/B cost reduction   |


Executing the prompts in sequence implements the full **roadmap**, enforces **test‑driven development**, and provides continuous feedback loops so Codex never drifts from specification.  Adjust timelines or split tasks further as team velocity dictates, but keep the *prompt → review → merge* rhythm intact for predictable delivery.
