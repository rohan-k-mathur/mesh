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

Executing the prompts in sequence implements the full **roadmap**, enforces **test‑driven development**, and provides continuous feedback loops so Codex never drifts from specification.  Adjust timelines or split tasks further as team velocity dictates, but keep the *prompt → review → merge* rhythm intact for predictable delivery.
