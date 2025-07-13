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

### 1.2 Scope

Covers backend services, data pipelines, ML models, APIs, and UI components required to ingest signals, compute similarity, rank candidates, explain recommendations, and collect feedback for continuous learning.

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
* **ANN** – Approximate Nearest Neighbour search.
* **DPP** – Determinantal Point Process diversity filter.
* **Two‑Tower** – Neural architecture with separate encoders for query and candidate entities.

### 1.5 References

* Mesh\_Roadmap.md
* Social\_Discovery\_Engine\_Roadmap.md (superseded by this SRS)
* OWASP ASVS v4.0
* ISO/IEC 27001:2022 Controls

---

## 2  Overall Description

### 2.1 Product Perspective

The engine is a **platform‑level service** consumed by multiple front‑end surfaces (feed, profile sidebar, live rooms). It runs independent micro‑services but shares Mesh’s common infra: Next.js front‑end, AWS EKS, managed PostgreSQL, and Redis.

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

### 2.3 User Classes

* **General Users** – consume suggestions and connect.
* **Creators** – seek collaborators; higher weight on complementary skills.
* **Moderators** – audit signals & resolve reports.

### 2.4 Operating Environment

* Cloud: AWS us‑east‑1 (primary), us‑west‑2 (DR). or Supabase
* Runtime: Node 18, Python 3.11
* Model Serving: NVIDIA T4 GPUs (SageMaker or k8s w/ Triton).

### 2.5 Assumptions & Dependencies

* OAuth integrations (Spotify, GitHub, etc.) remain read‑only.
* Event streaming (Kafka) is available cluster‑wide.
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

---

## 5  External Interface Requirements

### 5.1 API Endpoints (REST unless noted)

| Route                             | Verb | Auth | Description                        |
| --------------------------------- | ---- | ---- | ---------------------------------- |
| `/api/v2/discovery/candidates`    | GET  | JWT  | Query top‑K user matches.          |
| `/api/v2/discovery/rooms`         | GET  | JWT  | Recommended live rooms.            |
| `/api/v2/discovery/why/:targetId` | GET  | JWT  | Fetch explanation object.          |
| `/grpc/reranker.Rank`             | gRPC | mTLS | Internal use – re‑ranking service. |

### 5.2 UI Components

* **Suggestion Carousel** – home feed & profile sidebar.
* **Swipe‑to‑tune Card Stack** – optional “More / Less like this”.
* **Privacy Dashboard** – settings → discovery data.

### 5.3 Data Connectors

OAuth 2.0 flows (Spotify, GitHub, Goodreads) with minimal scopes; refresh tokens encrypted in AWS KMS.

---

## 6  System Architecture & Data Flow

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

---

## 7  Data & Model Design

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

### 7.2 Feature Groups (Feast)

| Entity   | Feature                      | Type       |
| -------- | ---------------------------- | ---------- |
| user\_id | avg\_session\_dwell\_sec\_7d | float      |
| user\_id | music\_genre\_vect           | float\[32] |
| user\_id | harassment\_score            | float      |

### 7.3 Model Specs

| Model               | Input                           | Output           | Update Cadence    |
| ------------------- | ------------------------------- | ---------------- | ----------------- |
| Two‑Tower v2        | static profile + dynamic intent | 256‑D vector     | daily & on‑demand |
| LightGBM Ranker v1  | concat(user, target) features   | propensity score | weekly            |
| Toxicity Classifier | text snippets                   | 0‑1 score        | monthly           |

---

## 8  Algorithms & Decision Logic

```
Algorithm RecommendUsers(u):
  Q ← VectorDB.nn_search(Embed(u), topK=300)
  C ← LightGBM.rank(u, Q)
  C' ← FilterSafety(C, threshold=0.8)
  S ← DPP_Diversity(C', N=10, λ=0.3)
  return Explain(S, u)
```

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

### 9.2 Discovery Interaction

1. Carousel renders 10 cards.
2. User swipes right → **Feedback Event** (`positive_signal`).
3. Connection request sent; on acceptance, feature `mutual_follow` toggled → retraining weight++.

### 9.3 Privacy Audit

1. Settings → Discovery Data.
2. List of signal categories with toggles.
3. Saving triggers event `signal_opt_out`; Feature Store masks features and schedules re‑embedding.

### 9.4 Live Room Matchmaking

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
| **Continuous** | NA   | • Online learning loop • Federated POC • Graph contrastive v3                               | Quarterly model refresh; retention lift ≥ 12 %     |

---

## 11  Testing & Validation Strategy

| Layer        | Tests                                                                  |
| ------------ | ---------------------------------------------------------------------- |
| Unit         | Input validation, feature transformations, SHAP explanation mapping    |
| Integration  | End‑to‑end API latency, cache fallbacks                                |
| Offline Eval | MAP\@10, nDCG, diversity entropy, fairness ratios                      |
| Online AB    | Connection acceptance, 7‑day conversation depth, safety incident delta |
| Security     | OWASP ASVS L2; dependency scanning (Snyk)                              |
| Privacy      | Synthetic DSAR runs; opt‑out propagation <15 min                       |

---

## 12  Deployment & MLOps Plan

* **CI/CD** – GitHub Actions → Terraform → ArgoCD for k8s objects; model CI via MLflow.
* **Blue/Green Serving** – New model versions get 5 % traffic until rollback window passes.
* **Feature Drift Alerts** – Great Expectations rules + Prometheus; Slack pager.
* **Retraining Schedule** – LightGBM weekly; Two‑Tower daily incremental + full monthly.

---

## 13  Risk & Compliance Management

| Risk                  | Impact               | Mitigation                                                |
| --------------------- | -------------------- | --------------------------------------------------------- |
| Model bias            | Reputational & legal | Fairness audits + bias‑mitigation techniques              |
| Vector DB outage      | Recs unavailable     | Fallback to set‑intersection v1 via feature flag          |
| Privacy breach        | Regulatory fines     | Data minimisation, rotating encryption keys, DPIA reviews |
| Connector API changes | Data loss            | Version pinning, contract tests, graceful degradation     |

---

## 14  Appendices

* A. Data Dictionary (extended).
* B. SHAP → Phrase mapping table.
* C. Experiment KPI Definitions.
* D. Change Log Template.

---

### Next Actions

1. Kick‑off Feature Store implementation (Eng lead).
2. Draft UX for explainability & privacy screens (Design).
3. Finalise Vector DB vendor contract (Ops).
4. Schedule Security & Privacy design review by Week 2.

---

**End of Document**
