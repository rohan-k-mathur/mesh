**Software Requirements Specification (SRS)**
**Mesh – Social Discovery Engine v2.0**
Document ID: MESH‑SDE‑SRS‑002 | Revision: 1.0 | Date: 13 July 2025
Author: Product & Platform Engineering, Mesh

---

## Table of Contents

1. Introduction
2. Overall Description
3. System Features & Functional Requirements
4. Non‑Functional Requirements
5. External Interface Requirements
6. System Architecture & Data Flow
7. Data & Model Design
8. Algorithms & Decision Logic
9. User Flows
10. Product Development Roadmap
11. Testing & Validation Strategy
12. Deployment & MLOps Plan
13. Risk & Compliance Management
14. Appendices

---

## 1  Introduction

### 1.1 Purpose

Provide a definitive specification for the next‑generation Social Discovery Engine that:

* Recommends users, rooms, and collaborative opportunities based on multi‑modal signals.
* Maximises meaningful interactions while protecting user privacy and safety.
* Serves as a flagship capability differentiating Mesh from incumbent social platforms.

* Extend v2.0 of the Social Discovery Engine to leverage user‑supplied media “favorites” (music, films, books, podcasts, games) imported from connected services (Spotify, Letterboxd, Goodreads, etc.) or entered manually. The objective is to convert these cultural signals into:

Taste vectors for sub‑second similarity matching.

Psychographic traits for richer explanations and better diversity control.

### 1.2 Scope

Covers backend services, data pipelines, ML models, APIs, and UI components required to ingest signals, compute similarity, rank candidates, explain recommendations, and collect feedback for continuous learning. 

Adds new micro‑services, feature pipelines, LLM‑powered trait extraction, data schemas, and UI surfaces while preserving all previously scoped functionality.

### 1.3 Stakeholders

| Role                  | Responsibility                         |
| --------------------- | -------------------------------------- |
| Product Management    | Vision, KPIs, prioritisation           |
| Platform Engineering  | API & microservice development         |
| Data/ML Engineering   | Feature store, model training, serving |
| Trust & Safety        | Fairness, abuse mitigation             |
| UX & Front‑end        | Discovery surfaces & explainability UI |
| Security & Compliance | GDPR/CCPA alignment                    |

### 1.4 Definitions & Acronyms

* **Feature Store** – Low‑latency store for ML features.
Feature Store -	Postgres (pgvector) table + materialised views providing low‑latency ML features (replaces Redis / Feast).
* **ANN** – Approximate Nearest Neighbour search.
* **DPP** – Determinantal Point Process diversity filter.
* **Two‑Tower** – Neural architecture with separate encoders for query and candidate entities.
* Canonical Media DB (CMD) – Internal catalogue mapping external IDs to a single canonical record.

Taste Vector – 256‑D embedding representing a user’s aggregated media preferences.

Traits JSON – Small JSON blob of personality/intent descriptors inferred offline by an LLM.

### 1.5 References

* Mesh_Roadmap.md
* SocialDiscovery_Codex_Guide.md
* SocialDiscoveryEnginev2.md
* OWASP ASVS v4.0
* ISO/IEC 27001:2022 Controls

---
### Implementation Progress

* **Signal ingestion** via `scroll_events` table and React hook `useScrollAnalytics` is operational.
* **UserAttributes** schema expanded (location, birthday, hobbies, communities) with Supabase migrations.
* **Embedding service** `/api/embed.py` deployed; re-embed worker queues updates.
* **Candidate API** `/api/v2/discovery/candidates` backed by pgvector with Redis caching.
* **Canonical Media** tables and metadata fetcher Edge Function implemented; Spotify ingest worker active.
* **LightGBM ranker** microservice exists with tests but is not yet wired into the API.
* Privacy dashboard, explainability API, diversity filter and trait inference jobs remain **TBD**.


## 2  Overall Description

### 2.1 Product Perspective

The engine is a **platform‑level service** consumed by multiple front‑end surfaces (feed, profile sidebar, live rooms). It runs independent micro‑services but shares Mesh’s common infra: Next.js front‑end, AWS EKS, managed PostgreSQL, and Redis /// SUPABASE + VERCEL.

Discovery v2.1 remains a platform service but now exposes an additional Favorites Pipeline (batch) and Favorites Connector API (real‑time).


| Area                          | AWS‑based Playbook                       | Supabase + Vercel Variant                                                                                                      |
| ----------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Infrastructure‑as‑Code**    | Terraform modules (EKS, RDS, S3, Lambda) | Supabase CLI migrations + `supabase/config.toml`; Vercel `vercel.json`                                                         |
| **Container Orchestration**   | k8s Deployments, Dockerfiles             | *None for back‑end* – compute runs as<br>• Vercel serverless/edge functions (Node, Python)<br>• Supabase Edge Functions (Deno) |
| **Stateful Stores**           | Aurora Postgres, Redis, S3, Pinecone     | Supabase Postgres (pgvector, pg\_cron), Supabase Storage; Pinecone **or** pgvector IVFFlat/HNSW                                |
| **Streaming / Feature Store** | Kafka + Feast (+Redis online)            | pgvector table + Materialised Views; realtime events via Supabase Realtime or Vercel Analytics                                 |
| **Batch Orchestration**       | Airflow on EKS / SageMaker Batch         | Supabase `pg_cron`, Vercel Cron Jobs, or GitHub Actions‑scheduled workflows                                                    |
| **Secrets / Config**          | AWS Secrets Manager                      | Supabase encrypted secrets (`supabase secrets set`) + Vercel Environment Variables                                             |


### 2.2 System Context

```
+-----------+         +-------------------+         +------------------+
|  Clients  | <REST/> | Discovery Gateway | <gRPC/> | Recommender Core |
+-----------+         +-------------------+         +------------------+
       ^                    |                              |
       |                    |-> Feature Store (Feast)      |
       |                    |-> Vector DB (Pinecone)       |
       |                    |-> Graph DB (Neo4j)           |
       |                    |                              |
       |<-- WS / SSE ------ |   Real‑time Match Service    |
```

2.2.1 System Context (updated)

            +─────────────── 1  OAuth/CSV ────────────────+
            |                                              |
┌───────────▼───────────┐        2 Metadata fetch        ┌─▼───────────────┐
│    Connectors &       │ ─────────────────────────────▶ │ Canonical Media │
│ Manual Uploads (UI)   │                                │      DB         │
└───────────▲───────────┘                                └───┬─────────────┘
            | 5 Traits JSON                                   │3 Embeddings
            |                                                 ▼
            |       ┌────────────────────────────┐     ┌──────────────┐
            └──────▶│  Favorites Feature Builder │────▶│ Vector +     │
                    │   (Airflow / Python)       │     │ Feature Store│
                    └──────────┬─────────────────┘     └─────┬────────┘
                               │                            7│
                               │6 Persist & Cache            ▼
                         ┌─────▼────────┐              ┌─────────────┐
                         │Batch LLM for │              │ Discovery   │
                         │Trait Inference│────────────▶│ Engine Core │
                         └──────────────┘    traits    └─────────────┘


### 2.3 User Classes

* **General Users** – consume suggestions and connect.
* **Creators** – seek collaborators; higher weight on complementary skills.
* **Moderators** – audit signals & resolve reports.

### 2.4 Operating Environment

2.4 Operating Environment
Layer	Runtime
Front‑end & APIs	Next.js 14 on Vercel Edge Runtime / Node 18
Serverless Back‑end	Vercel Functions (Node 18) & Supabase Edge Functions (Deno 1.41)
Database	Supabase Postgres 16 + pgvector 0.6.2
Batch & Cron	Supabase pg_cron, Vercel Cron, GitHub Actions
ML Serving	FastAPI on Vercel Python Functions (CPU) or GPU runner when required


### 2.5 Assumptions & Dependencies

* OAuth integrations (Spotify, GitHub, etc.) remain read‑only.
* Event streaming (Kafka) is available cluster‑wide.
* pgvector ANN index satisfies ≤50 ms p99 for 10 M vectors; Pinecone fallback is optional.
Kafka cluster available Supabase Realtime provides row‑level event streaming.


* Pinecone or Qdrant meets <50 ms p99 vector query SLA.

---

## 3  System Features & Functional Requirements

| ID        | Feature                          | Functional Requirements                                                                                                      |
| --------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **FR‑01** | **Signal Ingestion**             | Collect behavioural events (scroll pause, dwell, reactions) at ≤5 s end‑to‑end lag; store in Feature Store keyed by user ID. |
| **FR‑02** | **Attribute Expansion**          | Persist location, birthday, hobbies, communities, external connectors (hashed) via `UserAttributes` schema.                  |
| **FR‑03** | **Two‑Tower Embedding Service**  | Generate 256‑D vectors at profile update or every 24 h; write to Vector DB.                                                  |
| **FR‑04** | **Candidate Generation API**     | `/api/v2/discovery/candidates` returns top‑K (K configurable, default 50) similar users within 100 ms (cache‑miss).          |
| **FR‑05** | **Graph‑Aware Re‑Ranker**        | Re‑rank candidates with LightGBM using graph, recency, and safety features; expose gRPC endpoint.                            |
| **FR‑06** | **Diversity Filter**             | Ensure final slate of N (default 10) meets diversity constraints (MMR λ ≥ 0.3).                                              |
| **FR‑07** | **Explainability Service**       | Provide 1‑2 textual reasons mapped to top feature contributions; support EN/ES locales.                                      |
| **FR‑08** | **Privacy Dashboard**            | UI screen to view & toggle off signals (granularity: interest, connector, behaviour). Changes propagate within 15 min.       |
| **FR‑09** | **Safety & Fairness Guardrails** | Block or down‑rank users with harassment score > 0.8; enforce demographic parity ±10 %.                                      |
| **FR‑10** | **Feedback Loop**                | Store swipe‑left/right, click, connection acceptance; feed online learner every 30 min.                                      |
| **FR‑11** | **Real‑time Match (Rooms)**      | For active rooms, compute attendee‑to‑viewer similarity in <500 ms using in‑memory Faiss.                                    |
| **FR‑12** | **A/B Experimentation**          | Feature flags and assignment persisted; metrics logged to Experiment DB.                                                     |
| --------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **FR‑13** | **Favorites Connectors & Manual Entry** | a) OAuth adapters retrieve latest “liked/saved/5‑star” items. b) Manual entry modal supports title auto‑complete via CMD. c) Delta sync nightly.                               |
| **FR‑14** | **Canonical Media DB**                  | Store canonical records keyed by IMDb tt/MBID/ISBN. Must de‑duplicate variants (“Blade Runner – Final Cut”). TTL for metadata cache = 30 days.                                 |
| **FR‑15** | **Favorites Feature Builder**           | Nightly Airflow DAG creates: 1) per‑title 768‑D embedding (if missing). 2) per‑user 256‑D taste vector (PCA‑reduced, recency & rating weighted). Persist to Vector DB & Feast. |
| **FR‑16** | **Trait Inference Service**             | Weekly (or profile‑change>10 %) batch job sends top 15 favorites → GPT‑4o prompt; validates JSONSchema; stores `traits` (max 2 kB/user) in Feature Store.                      |
| **FR‑17** | **Taste‑Aware Matching Extension**      | Candidate generation first unions ANN on taste\_vector (top 200) with existing Two‑Tower results, then deduplicates. Latency budget unchanged (≤120 ms p95).                   |
| **FR‑18** | **Taste‑Based Explanations**            | `why/:targetId` endpoint may reference trait overlap (“Both enjoy cerebral sci‑fi”). Source text must come from cached Traits JSON, never live LLM call.                       |
| **FR‑19** | **Opt‑out / Redact Favorites**          | User toggle removes taste\_vector and traits within 15 min; system falls back to generic embeddings until re‑enabled.       
|

System Features & Functional Requirements
All FR‑IDs retained; implementation notes updated:

FR‑01 – Signal ingestion now uses Supabase Realtime triggers; end‑to‑end lag unchanged (≤ 5 s).

FR‑02 – No change.

FR‑03 – Two‑Tower embedding served by Vercel Python Function /api/embed.py; vectors stored in pgvector.

FR‑04 – Candidate API calls SQL ORDER BY taste <-> $1 instead of Pinecone SDK when local ANN used.

FR‑05 – Re‑ranker remains gRPC FastAPI but is deployed as Vercel Python Function; mTLS inside Vercel’s private network.

FR‑06 ‑ FR‑12 – Logic unchanged, underlying infra swapped.

FR‑13 ‑ FR‑19 – Unchanged; nightly & weekly jobs moved to Vercel Cron / GitHub Actions and Supabase pg_cron (see §4).



2.1 Product Perspective
Major stack pivot – Discovery v2.1 now runs entirely on Supabase (Postgres + Edge Functions + Storage + pgvector) and Vercel (Next.js Edge & Serverless Functions, Cron, Analytics). AWS EKS, Redis, S3, Lambda are no longer used for Discovery components.

Area	Legacy (AWS)	Current (Supabase + Vercel)
Infrastructure‑as‑Code	Terraform modules	Supabase CLI migrations; Vercel vercel.json
Container Orchestration	k8s Deployments	Serverless / Edge Functions (Node 18, Python 3.11, Deno)
Stateful Stores	Aurora Postgres, Redis, S3, Pinecone	Supabase Postgres 16 (pgvector, pg_cron); Supabase Storage; Pinecone or pgvector IVFFlat/HNSW
Streaming / Feature Store	Kafka + Feast (+Redis)	Supabase Realtime channels; pgvector table + materialised views
Batch Orchestration	Airflow on EKS / SageMaker Batch	Supabase pg_cron, Vercel Cron Jobs, GitHub Actions
Secrets / Config	AWS Secrets Manager	supabase secrets + Vercel Environment Variables
Observability	Prometheus stack	Vercel Analytics, Supabase Logs + Logflare + Grafana Cloud

System Context (updated)

┌──────────────────── Clients (Web / Mobile) ───────────────────┐
│   ↓ REST / GraphQL / SSE                                      │
│   /api/v2/discovery/* (Next.js Edge & Serverless Functions)   │
└──────────────┬───────────────────────┬────────────────────────┘
               │                       │
               │                       │  Supabase Realtime channel
               │                       └────────▶ "user_behavior"
               ▼
┌────────────────────── Discovery Core (Node 18) ───────────────┐
│  • Candidate Generation (pgvector K‑NN)                       │
│  • LightGBM Re‑Ranker (Python, gRPC)                          │
│  • DPP Diversity & Safety Filter                              │
└────────┬──────────────────────────┬───────────────────────────┘
         │                          │
         │                          │
         ▼                          ▼
┌─────────────── pgvector Feature Store ────────────────┐   ┌──── Canonical Media DB ────┐
│ user_taste_vectors (256‑D)                            │   │ media metadata + 768‑D emb │
└────────────────────────────────────────────────────────┘   └────────────────────────────┘


---

## 4  Non‑Functional Requirements

| Category               | Specification                                                                      |
| ---------------------- | ---------------------------------------------------------------------------------- |
| **Performance**        | p95 latency: 120 ms (cached), 200 ms (cold) for candidate API.                     |
| **Scalability**        | 10 M MAU; 2 k events/s peak; horizontal auto‑scaling pods.                         |
| **Reliability**        | 99.9 % monthly SLA; multi‑AZ deployments; circuit‑breakers.                        |
| **Security & Privacy** | JWT auth, mTLS between services, AES‑256 at rest; GDPR/CCPA DSAR support <30 days. |
| **Fairness**           | Disparate impact ratio between protected classes 0.8–1.25.                         |
| **Observability**      | OpenTelemetry traces, Prometheus metrics, Grafana alerts.                          |
| **Maintainability**    | Clean Architecture, 80 % unit‑test coverage, ESLint & Prettier gates.              |
Cost – Net new monthly infra budget ≤ 10 % of discovery OPEX. Guard‑rails:

Embedding cache hit ≥ 95 %.

LLM batch runtime < 4 h / week, <$0.02 per active user / month.

Performance – Favorites DAG completes ≤ 90 min for 10 M users.

Non‑Functional Requirements
Category	New Specification
Performance	unchanged
Scalability	10 M MAU on single Postgres cluster + read replicas; Vercel auto‑scale functions
Reliability	99.9 % SLA; Supabase HA Postgres + Vercel Global Edge Network
Security & Privacy	JWT (JWE) auth, Row‑Level Security (RLS) rules, Supabase Secrets
Observability	Vercel Analytics, Supabase Logs (Logflare), Grafana Cloud
Cost	Net new infra ≤ 10 % discovery OPEX; Logflare alert triggers when embedding spend > 1.1× budget

---

## 5  External Interface Requirements

### 5.1 API Endpoints (REST unless noted)

| Route                             | Verb | Auth | Description                        |
| --------------------------------- | ---- | ---- | ---------------------------------- |
| `/api/v2/discovery/candidates`    | GET  | JWT  | Query top‑K user matches.          |
| `/api/v2/discovery/rooms`         | GET  | JWT  | Recommended live rooms.            |
| `/api/v2/discovery/why/:targetId` | GET  | JWT  | Fetch explanation object.          |
| `/grpc/reranker.Rank`             | gRPC | mTLS | Internal use – re‑ranking service. |
| Route                                | Verb | Auth | Description                                    |
| ------------------------------------ | ---- | ---- | ---------------------------------------------- |
| `/api/v2/favorites/import/:service`  | POST | JWT  | Trigger on‑demand OAuth ingest (Spotify, etc.) |
| `/api/v2/favorites/manual`           | POST | JWT  | Add or edit manual favorite items.             |
| `/api/v2/discovery/favorites/status` | GET  | JWT  | Sync status, last processed date.              |


### 5.2 UI Components

* **Suggestion Carousel** – home feed & profile sidebar.
* **Swipe‑to‑tune Card Stack** – optional “More / Less like this”.
* **Privacy Dashboard** – settings → discovery data.

### 5.3 Data Connectors

OAuth 2.0 flows (Spotify, GitHub, Goodreads) with minimal scopes; refresh tokens encrypted in AWS KMS.

---

## 6  System Architecture & Data Flow

(updated): 6.1 Pipeline Summary (re‑written)
Client Analytics → Supabase Row Inserts (scroll_events).

Materialised View user_dwell_avg refreshes via pg_cron every 5 min.

Profile updates trigger Supabase Edge Function → enqueue re‑embed to /api/embed.py.

Nightly Vercel Cron job builds taste vectors (PCA) and upserts to user_taste_vectors.

Candidate API (Next.js Edge) executes pgvector ANN search, merges with Two‑Tower list.

LightGBM Re‑Ranker reorders slate; result passes through DPP & Guardrails micro‑service.

Explanation API fetches SHAP‑mapped reasons; caches in Supabase table why_cache.

legacy:

1. **Event Ingestion** – Web/mobile clients → Kafka topics (`user_behavior`, `content_view`).
2. **Stream Processing** – Flink jobs aggregate into session‑level features; push to **Feature Store** (Feast on Redis).
3. **Offline Feature ETL** – Nightly Airflow DAG populates training datasets in S3 + Athena.
4. **Model Training** – SageMaker pipelines retrain Two‑Tower and LightGBM; models versioned in **Model Registry**.
5. **Model Serving** – Triton server exposes `/infer`; predictions cached in Redis.
6. **Vector DB** – Pinecone hosts user embeddings; queried by **Candidate Generator** service.
7. **Graph DB** – Neo4j stores social graph metrics; consulted during re‑ranking.
8. **Diversity & Guardrail Filter** – Node service applies DPP & safety rules; outputs final slate to **Discovery Gateway**.
9. **API Gateway** – Edge Lambdas / Next.js API routes deliver results to clients.
10. **Observability Stack** – OTEL collectors → Tempo (traces), Loki (logs), Prometheus (metrics).
11. 
Favorites Connector Workers – Node18 lambdas pulling external libraries; push raw JSON to S3 favorites_raw/.

Canonical Media DB – Aurora PostgreSQL with nightly metadata refresh jobs.

Embedding Generator – Python container (Torch) calling text-embedding-3-large; cached in Redis (media_emb:<md5>).

Trait Inference – Batch LLM job (SageMaker Batch or Cloud Run) → JSON validated → Feature Store (traits_json).

---

## 7  Data & Model Design
Tables & schemas already updated in v1.0; only backend path changes.

Added: supabase/migrations/20250715_feature_store.sql defining user_taste_vectors.


### 7.1 Core Tables (PostgreSQL via Prisma)

```prisma
model UserAttributes {
  userId      String  @id
  location    String? @index
  birthday    DateTime?
  hobbies     String[] // text array
  communities String[]
  connectors  Json     // hashed external IDs
  updatedAt   DateTime @updatedAt
}
```
Additional Tables
prisma
Copy
model FavoriteItem {
  userId     String  @index
  mediaId    String  // foreign key to CanonicalMedia.id
  rating     Int?    // 1‑5
  addedAt    DateTime @default(now())
}

model CanonicalMedia {
  id        String @id           // imdb_tt, mbid, isbn, etc.
  title     String
  mediaType String               // MOVIE, SONG, BOOK, ...
  metadata  Json                 // genres, themes, mood, year
  embedding Float[]              // 768‑D
  updatedAt DateTime @updatedAt
}


### 7.2 Feature Groups (Feast)

| Entity   | Feature                      | Type       |
| -------- | ---------------------------- | ---------- |
| user\_id | avg\_session\_dwell\_sec\_7d | float      |
| user\_id | music\_genre\_vect           | float\[32] |
| user\_id | harassment\_score            | float      |
| Entity   | Feature       | Type        |
| -------- | ------------- | ----------- |
| user\_id | taste\_vector | float\[256] |
| user\_id | traits\_json  | bytes       |


### 7.3 Model Specs

| Model               | Input                           | Output           | Update Cadence    |
| ------------------- | ------------------------------- | ---------------- | ----------------- |
| Two‑Tower v2        | static profile + dynamic intent | 256‑D vector     | daily & on‑demand |
| LightGBM Ranker v1  | concat(user, target) features   | propensity score | weekly            |
| Toxicity Classifier | text snippets                   | 0‑1 score        | monthly           |

---

## 8  Algorithms & Decision Logic


Algorithm RecommendUsers(u):
  P  ← TasteANN(u.taste_vector, topK=200)
  Q  ← VectorDB.nn_search(Embed(u), topK=300)
  C0 ← UNIQUE(P ∪ Q)
  C1 ← LightGBM.rank(u, C0, extra_feats = overlap(traits))
  C2 ← FilterSafety(C1)
  S  ← DPP_Diversity(C2, N=10)
  return Explain(S, u)

* **FilterSafety** removes users with high harassment\_score or block relation.
* **DPP\_Diversity** optimises for dissimilarity while retaining relevance.
* **Explain** selects top 2 SHAP features and maps to human‑readable phrases.

---

## 9  User Flows

### 9.1 Onboarding & Intent Capture

1. User signs up → chooses base interests & goals (“find collaborators”).
2. OAuth connector prompts (optional).
3. Two‑Tower embedding computed; candidate API pre‑warmed.
4. First suggestion slate delivered to home feed.

### 9.2 Favorites Import
User taps “Connect Spotify” → OAuth → success banner.

Backend queues ingest; UI shows Syncing….

Within 5 min taste_vector ready; slate refreshes silently.

Weekly email “Your cultural twin is Alex – because you both love mid‑2000 s synth‑pop.”

### 9.3 Manual Entry
Auto‑complete field backed by CMD; debounce 150 ms.

On submit, preview card shows poster/cover art + “Added”.

Undo available for 10 s.

### 9.4 Discovery Interaction

1. Carousel renders 10 cards.
2. User swipes right → **Feedback Event** (`positive_signal`).
3. Connection request sent; on acceptance, feature `mutual_follow` toggled → retraining weight++.

### 9.5 Privacy Audit

1. Settings → Discovery Data.
2. List of signal categories with toggles.
3. Saving triggers event `signal_opt_out`; Feature Store masks features and schedules re‑embedding.

### 9.6 Live Room Matchmaking

1. User opens live music room.
2. Client emits `room_context` vector.
3. Real‑time Match Service queries in‑memory index for active users with cosine > 0.7.
4. “People to invite” panel populates within 300 ms.

---

## 10  Product Development Roadmap

| Phase          | Timeline    | Milestones                                                                                  | Exit Criteria                                      |
| -------------- | ----------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| **Alpha**      | NA   | • Feature Store (redis) • Vector DB seeded • v1 embeddings (static)                         | Internal dog‑food accuracy ≥ 0.6 AUC               |
| **Beta**       | NA  | • Behavioural signals pipeline • LightGBM ranker • Swipe‑to‑tune UI • Privacy Dashboard MVP | 10 % user cohort; KPI: +8 % connection acceptance  |
| **GA**         | NA | • Diversity filter • Safety guardrails • A/B infra • Localization EN/ES • Audit logs        | 100 % rollout; SLA, privacy & fairness metrics met |
| **Continuous** | NA   | • Online learning loop • Federated POC • Graph contrastive v3                               | Quarterly model 
refresh; retention lift ≥ 12 %     |


| Phase | Milestones (Supabase + Vercel)                                                                                       | Exit Criteria                           |
| ----- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| Alpha | Feature‑store table + pg\_cron view, profile embeddings, **Spotify connector via Supabase Storage**                  | Internal dogfood AUC ≥ 0.6              |
| Beta  | Behavioural event pipeline (**Supabase Realtime**), LightGBM ranker (Vercel Python), Swipe UI, Privacy Dashboard MVP | 10 % cohort, +8 % connection acceptance |
| GA    | Diversity filter, guardrails, GrowthBook, i18n, **Logflare cost alert**                                              | 100 % rollout                           |


---
| Phase       | Extra Milestones (Favorites track)                                                           |
| ----------- | -------------------------------------------------------------------------------------------- |
| **Alpha**   | Build Canonical Media DB seed + import UI (read‑only).                                       |
| **Beta**    | Embedding generator + nightly taste vectors; ANN blended into candidate API for 10 % cohort. |
| **GA**      | LLM trait inference, opt‑out UI, taste‑based explanations; 100 % rollout.                    |
| **Phase 3** | Cost‑down: switch to open‑source embeddings + Mixtral fine‑tunings.                          |


## 11  Testing & Validation Strategy

| Layer        | Tests                                                                  |
| ------------ | ---------------------------------------------------------------------- |
| Unit         | Input validation, feature transformations, SHAP explanation mapping    |
| Integration  | End‑to‑end API latency, cache fallbacks                                |
| Offline Eval | MAP\@10, nDCG, diversity entropy, fairness ratios                      |
| Online AB    | Connection acceptance, 7‑day conversation depth, safety incident delta |
| Security     | OWASP ASVS L2; dependency scanning (Snyk)                              |
| Privacy      | Synthetic DSAR runs; opt‑out propagation <15 min                       |
Schema tests – Great Expectations: CMD completeness ≥ 95 % essential metadata.

Offline eval (favorites) – Precision@10 uplift ≥ 5 % vs. control on “shared favorites” cohort.

Cost regression – Prometheus alert if weekly embedding spend > budget.
---

## 12  Deployment & MLOps Plan

* **CI/CD** – GitHub Actions → Terraform → ArgoCD for k8s objects; model CI via MLflow.
* **Blue/Green Serving** – New model versions get 5 % traffic until rollback window passes.
* **Feature Drift Alerts** – Great Expectations rules + Prometheus; Slack pager.
* **Retraining Schedule** – LightGBM weekly; Two‑Tower daily incremental + full monthly.
Favorites DAG image built via GitHub Actions → Airflow via Helm chart.

LLM batch job triggered by Airflow sensor; outputs uploaded to S3 & Feature Store.

Canary: first 100 k users each Saturday 01:00‑03:00 UTC.

| Aspect         | From                                | **To**                                                                                |
| -------------- | ----------------------------------- | ------------------------------------------------------------------------------------- |
| CI/CD          | GitHub Actions ➜ Terraform ➜ ArgoCD | **GitHub Actions ➜ Supabase CLI (`db push`, migrations) ➜ Vercel CLI (`--prebuilt`)** |
| Model Registry | MLflow + S3                         | **Weights & hash recorded in Git tags; artefacts stored in GitHub Releases**          |
| Serving        | Triton on k8s                       | **Vercel Python Functions**                                                           |
| Canary         | 5 % via k8s service mesh            | **GrowthBook flag + Vercel traffic splitting**                                        |



---

## 13  Risk & Compliance Management

| Risk                  | Impact               | Mitigation                                                |
| --------------------- | -------------------- | --------------------------------------------------------- |
| Model bias            | Reputational & legal | Fairness audits + bias‑mitigation techniques              |
| Vector DB outage      | Recs unavailable     | Fallback to set‑intersection v1 via feature flag          |
| Privacy breach        | Regulatory fines     | Data minimisation, rotating encryption keys, DPIA reviews |
| Connector API changes | Data loss            | Version pinning, contract tests, graceful degradation     |
| Risk                          | Mitigation                                  |
| ----------------------------- | ------------------------------------------- |
| API quota exhaustion (TMDb …) | 24 h cache + exponential back‑off.          |
| LLM PII leakage in prompts    | Strip user names; log‑redaction middleware. |
| Copyright on poster images    | Store URLs only, proxy via img cache.       |

---

## 14  Appendices

* A. Data Dictionary (extended).
* B. SHAP → Phrase mapping table.
* C. Experiment KPI Definitions.
* D. Change Log Template.
* E. Canonical Media Source List & Licenses
F. LLM Prompt Library & JSONSchema
G. Favorites Opt‑out Data‑Flow Diagram

---

### Next Actions

1. Kick‑off Feature Store implementation (Eng lead).
2. Draft UX for explainability & privacy screens (Design).
3. Finalise Vector DB vendor contract (Ops).
4. Schedule Security & Privacy design review by Week 2.

Next Actions (Favorites Work‑Stream)
Infra – Provision Aurora CMD cluster & S3 favorites_raw.

Eng – Ship MVP Spotify adapter + TMDb fetcher (owner: @media‑ingest).

ML – Evaluate text-embedding-3-large vs. all-mpnet-base-v2 on 5 k movie synopsis set.

UX – Wireframe “Favorites” tab in onboarding & settings.

Next Actions (updated)
Run supabase db push to create user_taste_vectors and pg_cron schedule.

Deploy /api/embed.py to Vercel; verify health.

Finish Logflare cost‑alert SQL & webhook.

Schedule security & privacy review (Week 2).

Favorites Work‑Stream actions remain identical but reference Supabase instead of S3/Aurora.



---

**End of Document**
