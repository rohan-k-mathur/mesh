# \*\*Software Requirements Specification (SRS)

Flowstate — Next‑Generation Flow Builder & Orchestration Engine (v2.0)\*\*

---

## 0  Document History

| Version | Date (YYYY‑MM‑DD) | Author    | Description          |
| ------- | ----------------- | --------- | -------------------- |
| 0.1     | 2025‑07‑13        | R. Mathur | First complete draft |

---

## 1  Introduction

### 1.1 Purpose

This SRS defines the functional, non‑functional, and architectural requirements for Flowstate’s **next‑generation automation builder** (“Flow Builder v2”). It extends the current React‑Flow graph and linear list builders with:

* **Dual‑View Authoring** (graph ↔ list)
* **AI Copilot** (natural‑language → draft workflows, auto‑healing, optimization)
* **Durable Orchestration Runtime** (Temporal‑like)
* **Plugin SDK & Marketplace**
* **Versioning, Observability, and Governance**

### 1.2 Scope

Flow Builder v2 targets small‑to‑medium businesses (SMBs) who automate multi‑step business processes across SaaS tools. The release covers authoring, execution, monitoring, collaboration, and extensibility.

### 1.3 Definitions, Acronyms

* **Flow** – Serialized JSON definition of triggers, actions, branches.
* **Run** – One execution instance of a Flow.
* **Copilot** – AI side‑panel providing NL → Flow generation and recommendations.
* **Hero Node** – Vertical‑specific composite node (e.g., “Drop Countdown” for fashion).
* **DSL** – Flowstate’s internal JSON domain‑specific language.

---

## 2  Overall Description

### 2.1 Product Perspective

Flow Builder v2 is a **core module** inside the Flowstate platform, interacting with:

* **Event Bus** – Publishes/consumes trigger events and logs.
* **Durable Orchestrator** – Executes and persists stateful workflows.
* **Secrets Vault** – Encrypts OAuth tokens & API keys.
* **Plugin Marketplace** – Hosts third‑party triggers/actions.
* **Analytics Service** – Stores metrics for dashboards & AI optimizer.

### 2.2 User Classes & Characteristics

| Class                 | Description                                  | Technical Level |
| --------------------- | -------------------------------------------- | --------------- |
| Owner / Operator      | SMB decision‑maker; designs & monitors flows | Low             |
| Marketing / Ops Staff | Day‑to‑day flow authors                      | Low‑Med         |
| Integration Partner   | Builds plugins                               | Med‑High        |
| Admin                 | Sets org‑wide governance policies            | Med             |
| Developer Advocate    | Maintains examples/templates                 | High            |

### 2.3 Operating Environment

* Web UI: modern browsers (Evergreen).
* Server: Node 18 LTS running in containerized cloud (Kubernetes / ECS).
* Orchestrator: Temporal Cluster (PostgreSQL persistence).
* DB: Postgres 15 (Supabase) for metadata; S3 for artifacts.

---

## 3  System Features & Functional Requirements

### 3.1 Dual‑View Authoring

1. **System shall** render graph view (React Flow) and list view (infinite scroll).
2. **System shall** maintain a single DSL source of truth; switching views never loses data.
3. **System shall** provide a mini‑map and outline for navigation.

### 3.2 AI Copilot

1. **System shall** accept natural‑language prompts and output a draft Flow.
2. **System shall** suggest the next node based on anonymized flow graph embeddings.
3. **System shall** detect runtime errors and surface auto‑fix options.
4. **System shall** run continuous multi‑variant tests and recommend winners.
5. **System shall** require human approval for destructive actions.

### 3.3 Durable Orchestration

1. **System shall** execute each run via Temporal workflows to guarantee:

   * Retry with exponential back‑off
   * Cron & long‑running timers
   * Compensation (sagas)
2. **System shall** support human‑in‑the‑loop tasks (pause until approval).
3. **System shall** surface live state—step, pending, failed—in the UI.

### 3.4 Plugin SDK & Marketplace

1. **System shall** expose TypeScript declaration files for triggers/actions.
2. **SDK shall** auto‑generate configuration UIs from JSON schema.
3. **Marketplace shall** list verified plugins; install process one‑click with OAuth scopes.
4. **Revenue share** shall meter usage by invocations (Stripe Connect).

### 3.5 Versioning & Collaboration

1. **System shall** create a git‑style commit on every save.
2. **System shall** render graphical diff between versions.
3. **System shall** allow branching & merge with conflict resolution.
4. **System shall** support simultaneous editing with CRDT (Yjs).

### 3.6 Observability & Governance

1. **System shall** store structured logs (JSON) for every node execution.
2. **System shall** expose metrics (duration, cost, success %) via Prometheus.
3. **System shall** trigger alerts based on OPA policies (e.g., “no PII to public Slack”).

---

## 4  Non‑Functional Requirements

| Category        | Requirement                                                 |
| --------------- | ----------------------------------------------------------- |
| Performance     | UI actions < 150 ms; orchestration scheduling latency < 1 s |
| Scalability     | 10k concurrent runs, 100k steps/minute                      |
| Security        | SOC 2; secrets AES‑256‑GCM; short‑lived OAuth tokens        |
| Availability    | 99.9 % monthly (orchestrator, UI, API)                      |
| Accessibility   | WCAG 2.1 AA                                                 |
| Maintainability | Lint & TypeScript strict mode; 90 % unit test coverage      |
| Compliance      | GDPR, CCPA, PCI‑DSS SAQ A (marketplace billing)             |

---

## 5  External Interface Requirements

### 5.1 User Interface

* **Builder UI** (`/flows/:id`): dual‑view toggle, mini‑map, outline pane.
* **Copilot Sidebar**: chat box, suggestions feed, simulation preview.
* **Marketplace**: searchable catalog, install button, billing panel.
* **Run‑Time Monitor**: live swimlane, filter by status, log viewer.

### 5.2 API Interfaces

* **GraphQL** `/api/graphql` – CRUD flows, versions, plugins.
* **Webhook Ingress** `/api/webhook/:plugin` – signed event intake.
* **Plugin Runtime** gRPC – bidirectional stream for action runners.

### 5.3 Communication Interfaces

* **WebSocket** – live updates (Yjs & run status).
* **gRPC** – worker ⇄ Temporal.
* **REST** – fallback for third‑party integrations.

---

## 6  System Architecture

```
 Client (Next.js + Liveblocks/Yjs)
 ├─ Graph & List Builder
 ├─ Copilot Chat
 ├─ Marketplace UI
 │
 API Gateway (GraphQL + REST)
 │
 ├─ Flow Service (CRUD, Versioning)
 ├─ Policy Engine (OPA)
 ├─ Auth Service (JWT/OAuth)
 │
 Event Bus (NATS)
 │
 Temporal Cluster (Durable Orchestrator)
 │   ├─ Core Workflow Workers
 │   └─ Plugin Action Workers (sandboxed)
 │
 Observability Stack
 │   ├─ Prometheus  ◄── Temporal metrics / Node runners
 │   └─ Loki        ◄── Structured logs
 │
 Postgres (metadata, version history)
 Object Store (S3 – large payloads, artifacts)
 Secrets Vault (AWS KMS / Hashicorp Vault)
```

*All services containerized; deployed via GitHub Actions → Kubernetes (Helm charts).*

---

## 7  Data Design (DSL v2 Highlights)

| Field                                                          | Type                       | Notes                                               |
| -------------------------------------------------------------- | -------------------------- | --------------------------------------------------- |
| `id`                                                           | UUID                       | Immutable                                           |
| `name`                                                         | String                     | User‑friendly                                       |
| `nodes[]`                                                      | Array<Node>                | Ordered; each contains `type`, `config`, `position` |
| `edges[]`                                                      | Array<Edge>                | Branching; conditions stored here                   |
| `version`                                                      | Semantic string (`v2.0.3`) |                                                     |
| `meta`                                                         | Object                     | Tags, owner, created\_at, updated\_at               |
| **Change**: `subFlows[]` nested allowed to enable macro nodes. |                            |                                                     |

---

## 8  Product Development Roadmap (12‑Month Horizon)

| Quarter     | Sprint | Milestone               | Description                                |
| ----------- | ------ | ----------------------- | ------------------------------------------ |
| **Q3‑2025** | 0      | Telemetry & Shadow Mode | Passive record of existing v1 flows        |
|             | 1      | Dual‑View MVP           | Graph <‑> List, mini‑map                   |
|             | 2      | Copilot v1              | NL → draft flow, step suggestions          |
| **Q4‑2025** | 3      | Temporal Orchestrator   | Durable runs, retries                      |
|             | 4      | Versioning & Diff       | Commits, rollback                          |
|             | 5      | Plugin SDK (alpha)      | Build three internal hero nodes            |
| **Q1‑2026** | 6      | Marketplace & Billing   | Stripe Connect, revenue share              |
|             | 7      | AI Auto‑Healing         | Runtime error diagnostics, fix suggestions |
|             | 8      | Governance Policies     | OPA integration, org settings UI           |
| **Q2‑2026** | 9      | Optimization Engine     | Multi‑armed bandit testing                 |
|             | 10     | Advanced Collaboration  | Live cursors, comment threads              |
|             | 11     | Public GA Launch        | Marketing push, partner integrations       |

---

## 9  User Flows

### 9.1 Create & Publish Flow (Beginner Mode)

1. **Dashboard → “New Automation”**
2. Choose **Guided Recipe** → answer 3 domain‑specific questions.
3. Copilot generates draft; user reviews in list view.
4. Click **Simulate** → payload preview.
5. Click **Publish to Staging** (behind toggle).
6. After test run succeeds, **Promote to Production**.

### 9.2 Power User Flow: NL Prompt

1. Open builder, press **⌘ / (Copilot)**.
2. Type prompt *“When a new paid Shopify order arrives, wait 10 days, DM customer on Instagram asking for UGC, split test copy A/B.”*
3. Copilot renders graph; placeholders highlighted in yellow.
4. User fills missing credentials, saves.

### 9.3 Plugin Author Flow

1. Dev opens **Developer Console → “Create Plugin”**.
2. Completes JSON manifest; uploads TypeScript action file.
3. CLI validates schema, pushes to marketplace staging.
4. Automated review runs security checks; admin approves.

### 9.4 Error Auto‑Healing Flow

1. Run fails → step turns red in swimlane.
2. Copilot surfaces analysis (“Expired IG token”).
3. Click **Apply Fix** → OAuth refresh flow opens.
4. Copilot re‑queues failed step; run completes.

---

## 10  Analytical & Monitoring Plan

* **Instrumentation**: Mixpanel events for builder interactions.
* **Metrics**:

  * Time‑to‑First‑Automation
  * Hours saved (self‑reported survey + heuristic)
  * Self‑healed failures %
* **Dashboards**: Grafana boards per org, per flow.
* **Alerting**: PagerDuty route for orchestrator SLA breaches.

---

## 11  Risk Management

| Risk              | Likelihood | Impact | Mitigation                                         |
| ----------------- | ---------- | ------ | -------------------------------------------------- |
| API deprecations  | Medium     | High   | Connector contract tests + canary monitors         |
| AI hallucination  | Medium     | Medium | Human‑in‑loop checkpoints, simulation              |
| Flow sprawl       | High       | Medium | Ownership tags, dormant‑flow sweeper               |
| Marketplace abuse | Low        | High   | Code scanning, permission scopes, revenue clawback |

---

## 12  Compliance & Security Controls

* Data processing addendum (DPA) for EU customers
* Encryption in transit (TLS 1.3) & at rest
* Annual penetration testing
* SOC 2 Type II audit by Q4‑2026
* SAST/DAST pipelines in CI

---

## 13  Glossary of Planning Methods Incorporated

* **MoSCoW Prioritization** – backlog labels (Must/Should/Could/Won’t).
* **RACI Matrix** – defined per milestone (Owner, Dev, QA, Docs).
* **OKRs** – quarterly objectives mapped to roadmap milestones.
* **Agile Scrum** – 2‑week sprints; Definition of Done includes tests, docs, telemetry.

---

## 14  Acceptance Criteria Checklist (Excerpt)

| #  | Requirement                                           | Test Method                    |
| -- | ----------------------------------------------------- | ------------------------------ |
|  1 | Switching between graph & list preserves flow         | Cypress E2E                    |
|  2 | Copilot prompt generates at least 80 % valid nodes    | Unit test with prompt fixtures |
|  3 | Temporal retries recover failed HTTP 500 within 1 min | Integration test               |
|  4 | Plugin install requires explicit OAuth scope grant    | Security test                  |
|  5 | Version diff highlights added, changed, removed nodes | Snapshot test                  |

---

### **End of Document**

This specification is intended to serve engineering, product, design, QA, and partner teams as the single authoritative reference for Flow Builder v2 development and launch.
