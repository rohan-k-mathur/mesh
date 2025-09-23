# Software Requirements Specification

**Real‑Time Virtual Flea‑Market (“Mesh Bazaar”)**
*Draft v0.9 – July 24 2025*

---

## 1 · Revision History

| Date       | Version | Author              | Notes                                               |
| ---------- | ------- | ------------------- | --------------------------------------------------- |
| 2025‑07‑24 | 0.9     | Product/Engineering | Initial complete draft based on playbook discussion |

---

## 2 · Introduction

### 2.1 Purpose

This SRS defines the functional, non‑functional, and operational requirements for *Mesh Bazaar*—a real‑time, grid‑based virtual flea‑market module inside the Mesh platform. The document will guide product management, design, engineering, QA, and DevOps through MVP delivery and subsequent iterations.

### 2.2 Scope

Mesh Bazaar enables buyers to **wander**, **converse**, and **transact** with sellers in live “stalls.” The core MVP delivers:

* 2‑D grid navigation (macro map → section pages → stalls)
* Live text chat, optional live video, presence cursors
* Item listing, bargaining, and flash auctions
* Escrow‑based checkout via Stripe
* Basic governance (roles, dispute workflow)

### 2.3 Stakeholders

* **Product** – defines roadmap & KPIs
* **Engineering** – delivers frontend, backend, infra
* **Design & Research** – UX flows, visual identity, usability tests
* **Marketplace Ops** – seller onboarding, moderation, dispute resolution
* **Legal & Compliance** – KYC/AML, consumer protection, data privacy
* **End‑users** – Visitors, Buyers, Sellers, Stewards

### 2.4 Definitions, Acronyms

| Term              | Definition                                                   |
| ----------------- | ------------------------------------------------------------ |
| **Section**       | A 3 × 3 group of stalls addressed by grid coordinate (x,y).  |
| **Stall**         | Individual seller micro‑space.                               |
| **Offer**         | Buyer‑initiated proposed price.                              |
| **Flash Auction** | 30‑300 s timed bid session for a single SKU.                 |
| **Escrow**        | Funds held in trust until item received.                     |
| **CRDT**          | Conflict‑free Replicated Data Type (Y.js) for realtime sync. |

---

## 3 · Overall Description

### 3.1 Product Perspective

Mesh Bazaar is a **module** inside Mesh’s monorepo. It reuses Mesh’s session/auth stack (NextAuth), Supabase for data + realtime, and LiveKit for WebRTC.

### 3.2 User Classes & Characteristics

| Class   | Primary Goals                     | Tech Skill  | Devices             |
| ------- | --------------------------------- | ----------- | ------------------- |
| Visitor | Browse, observe                   | Low         | Desktop, mobile web |
| Buyer   | Chat, bargain, purchase           | Medium      | Desktop preferred   |
| Seller  | List items, stream, manage orders | Medium‑High | Desktop with webcam |
| Steward | Moderate, resolve disputes        | High        | Desktop             |

### 3.3 Operating Environment

* **Frontend**: Next.js 14 (App Router), React 18, React Flow 12, Tailwind CSS.
* **Backend**: Supabase Postgres 15 + Realtime, Redis 7, LiveKit Cloud, Stripe Connect.
* **Infra**: AWS us‑east‑1, Kubernetes (EKS), CloudFront CDN.

### 3.4 Assumptions & Dependencies

* Stripe enables on‑session escrow.
* At least 25 beta sellers commit inventory for soft launch.
* LiveKit SFU scales to >200 viewers per stall.

---

## 4 · Functional Requirements

Requirements follow **MoSCoW** prioritisation: **M**ust, **S**hould, **C**ould, **W**on’t (phase 1).

### 4.1 Navigation & Discovery

| ID    | Requirement                                                                                            | Priority |
| ----- | ------------------------------------------------------------------------------------------------------ | -------- |
| NAV‑1 | System shall render an infinite‑scroll 2‑D macro grid, addressable by integers x & y.                  | M        |
| NAV‑2 | User shall navigate between sections via arrow buttons and WASD keys.                                  | M        |
| NAV‑3 | System shall display a minimap with current position and heat‑map of active users refreshed every 5 s. | S        |
| NAV‑4 | User may click “Teleport” to jump to a random section with > 10 concurrent visitors.                   | C        |

### 4.2 Stall Listing & Management

| ID      | Requirement                                                                            | Priority |
| ------- | -------------------------------------------------------------------------------------- | -------- |
| STALL‑1 | Sellers shall create a stall with name, avatar, cover photos, and location coordinate. | M        |
| STALL‑2 | Sellers shall list items with SKU, photos, price, quantity, shipping rules.            | M        |
| STALL‑3 | System shall surface live badge (🟢) when seller WebSocket + video stream present.     | S        |

### 4.3 Realtime Interaction

| ID   | Requirement                                                                      | Priority |
| ---- | -------------------------------------------------------------------------------- | -------- |
| RT‑1 | System shall join buyer to stall chat via WebSocket automatically on stall open. | M        |
| RT‑2 | Buyers may send text messages, emojis, and `/offer` commands.                    | M        |
| RT‑3 | Seller may start/stop LiveKit stream; viewers auto‑play muted.                   | S        |
| RT‑4 | Presence cursors shall show other buyers’ pointer positions on item hover.       | C        |

### 4.4 Bargaining & Flash Auctions

| ID     | Requirement                                                                                 | Priority |
| ------ | ------------------------------------------------------------------------------------------- | -------- |
| DEAL‑1 | Buyer may create an Offer specifying price and optional note.                               | M        |
| DEAL‑2 | Seller shall Accept, Counter, or Reject an Offer; outcome syncs to all viewers in < 300 ms. | M        |
| DEAL‑3 | Seller may initiate flash auction with reserve price and 30‑300 s duration.                 | S        |
| DEAL‑4 | Highest bid shall auto‑checkout if payment method on file.                                  | S        |

### 4.5 Checkout & Escrow

| ID    | Requirement                                                                                             | Priority |
| ----- | ------------------------------------------------------------------------------------------------------- | -------- |
| PAY‑1 | Buyer shall add items to basket and pay via Stripe Checkout.                                            | M        |
| PAY‑2 | System shall hold funds in escrow (Stripe balance with separate ledger).                                | M        |
| PAY‑3 | Buyer may mark order “Received & OK” to release funds; system auto‑release after 10 days if no dispute. | M        |
| PAY‑4 | Refunds processed via Stripe API within 48 h of dispute resolution.                                     | S        |

### 4.6 Governance & Moderation

| ID    | Requirement                                                             | Priority |
| ----- | ----------------------------------------------------------------------- | -------- |
| GOV‑1 | Repeat IP‑flagged messages trigger auto‑mute for 15 minutes.            | M        |
| GOV‑2 | Stewards may move stalls to new coordinates through admin UI.           | S        |
| GOV‑3 | AI classifier shall check uploaded images for nudity & trademark logos. | C        |

### 4.7 Analytics

| ID    | Requirement                                                                     | Priority |
| ----- | ------------------------------------------------------------------------------- | -------- |
| ANA‑1 | System shall log page views, stall dwell time, chat count, offers, conversions. | M        |
| ANA‑2 | Real‑time heat‑map tiles aggregated per section every 30 s.                     | S        |

---

## 5 · Non‑Functional Requirements

| Category          | Requirement                                                                                    |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| **Performance**   | Stall chat latency ≤ 300 ms, auction bid propagation ≤ 150 ms, 95‑th percentile.               |
| **Scalability**   | Support 10 k concurrent visitors, 1 k concurrent stalls. Horizontal auto‑scaling on CPU >65 %. |
| **Reliability**   | 99.5 % uptime SLA MVP; reactive fail‑over for Redis and Postgres replicas.                     |
| **Security**      | PCI‑DSS SAQ‑A compliance, JWT‑based auth, rate limit 100 messages/minute/user.                 |
| **Privacy**       | GDPR & CCPA compliant; data‑subject deletion within 30 days.                                   |
| **Accessibility** | WCAG 2.1 AA—keyboard navigation; captions for seller video.                                    |
| **Localization**  | Unicode & RTL ready; MVP English only.                                                         |

---

## 6 · External Interface Requirements

* **REST/GraphQL** – internal BFF for Next.js to Supabase RPC.
* **Webhook** – Stripe payment events.
* **WebSocket** – Supabase Realtime (chat, offers) over `wss://realtime.supabase.io`.
* **WebRTC** – LiveKit SFU for video streams (VP8, Opus).
* **Admin CLI** – Steward moderation commands `mesh-admin move-stall --id --x --y`.

---

## 7 · System Architecture

```
User Browser ──HTTP/2──► Next.js Edge (Vercel) ──gRPC──► API Gateway
  │                                      │
  │                                      ├─► Supabase Realtime (WS)  ←┐
  │                                      ├─► Postgres (RLS, PGVector) │
  │                                      ├─► Redis (Auctions)         │
  │                                      └─► Stripe API               │
  └─WebRTC (UDP)─► LiveKit Cloud ◄────────┘
```

### 7.1 Core Services

| Service                 | Tech              | Responsibility                       |
| ----------------------- | ----------------- | ------------------------------------ |
| **Marketplace‑API**     | TypeScript, tRPC  | CRUD stalls, items, offers, orders   |
| **Auction‑Service**     | Go, Redis Pub/Sub | Authoritative timers, bid validation |
| **Moderation‑Service**  | Python FastAPI    | Image/voice AI, policy enforcement   |
| **Analytics‑Collector** | ClickHouse        | Event ingestion, KPI dashboards      |

### 7.2 Data Model (simplified ERD)

```
User 1─∞ Stall 1─∞ Item 1─∞ Offer
User 1─∞ Order 1─∞ OrderLine
Item 1─∞ Auction 1─∞ Bid
Stall 1─∞ ChatMessage
Section(x,y) 1─∞ Stall
```

Primary keys are ULIDs; spatial index on `section` for fast query.

---

## 8 · User Flows & Sequence Diagrams

### 8.1 Walk‑Up & Purchase

1. **Navigate** → Macro Grid → Section page.
2. Click stall thumbnail.
3. System loads stall CRDT document; joins chat.
4. Buyer adds item to basket → Checkout → Stripe escrow.
5. Seller ships → Buyer confirms → Escrow release.

### 8.2 Offer / Counter Sequence

```
Buyer → WS: Offer(price)
Server → Seller: toast
Seller → WS: Counter(newPrice)
Buyer → Confirm
Server → Both: OfferAccepted
Server → Stripe: PaymentIntent.capture
```

### 8.3 Flash Auction

```
Seller → AuctionService: startAuction(itemId, reserve, duration)
AuctionService → WS(room): auctionStarted
Buyer(s) → WS: bid(amount)
AuctionService → WS(room): highBidUpdated
time⟶up → AuctionService: finalize
AuctionService → Stripe: capture(highestBidder)
```

---

## 9 · Quality Assurance Plan

* **Unit Tests** – ≥ 80 % coverage for marketplace API.
* **Load Tests** – k6 scripts for 1 k chat msgs/s, 500 bids/s.
* **Security Tests** – OWASP ZAP scan on staging weekly.
* **Usability Tests** – 10 participant sessions pre‑MVP (task completion < 90 s target).
* **Beta “Market Day”** – live chaos testing with real sellers.

---

## 10 · Monitoring & Logging

| Layer     | Tooling                      | Alerts                       |
| --------- | ---------------------------- | ---------------------------- |
| API & Web | Datadog APM, Sentry          | p95 latency > 500 ms         |
| DB        | Supabase Dashboard           | CPU > 75 %, slow query > 1 s |
| Auctions  | Redis keyspace notifications | missed tick                  |
| Stripe    | Webhook failure              | retry > 3                    |

---

## 11 · Risk Management

| Risk                     | Likelihood | Impact | Mitigation                                         |
| ------------------------ | ---------- | ------ | -------------------------------------------------- |
| Auction sniping exploits | Medium     | High   | Server authoritative bids, commit‑reveal if needed |
| LiveKit bandwidth spikes | Low        | Medium | Adaptive simulcast, overflow viewers to HLS        |
| Fraudulent sellers       | Medium     | High   | KYC + rolling reserve on payouts                   |

---

## 12 · Product Development Roadmap

### 12.1 Six‑Week MVP (Q3 2025)

| Week | Engineering               | Product/Design      | QA                |
| ---- | ------------------------- | ------------------- | ----------------- |
| 1    | Grid nav, DB schema       | Wireframes          | Unit test harness |
| 2    | Stall view, chat          | Hi‑fi mock          | Functional tests  |
| 3    | Seller dashboard, video   | UX polish           | Stream tests      |
| 4    | Offers, escrow            | Pricing & fee model | Payment tests     |
| 5    | Auction service, presence | Comms plan          | Load test         |
| 6    | Soft‑launch event         | Feedback survey     | Bug triage        |

### 12.2 Beta → GA (Q4 2025)

* **Mobile‑responsive** redesign
* **Governance portal** for Stewards
* **Heat‑map & analytics** public API
* **Internationalisation** (EN→ES, FR)

### 12.3 Post‑MVP (2026+)

AR View, Theme Days, Collaborative Booths, Social Presence Layer, NFT Tickets.

---

## 13 · RACI Matrix (Excerpt)

| Activity          | Product | Eng | Design | Ops | Legal | QA |
| ----------------- | ------- | --- | ------ | --- | ----- | -- |
| Grid spec         | A       | R   | C      |     |       |    |
| Payment flow      | C       | R   |        | C   | A     |    |
| Moderation policy | C       |     |        | R   | A     |    |
| Load testing      |         | R   |        | C   |       | A  |

(A = Accountable, R = Responsible, C = Consulted)

---

## 14 · Acceptance Criteria (MVP)

1. User can navigate ≥ 50 contiguous sections with ≤ 1000 ms cold‑load.
2. Chat message round‑trip ≤ 300 ms (95‑th).
3. Offers process end‑to‑end (create → accept → capture) without error ≥ 99 % of attempts.
4. Flash auction handles ≥ 200 bids/min without missed high‑bid events.
5. 0 P1 security vulnerabilities in OWASP scan.

---

## 15 · Appendices

* **Glossary** (see §2.4)
* **DB Schema DDL (link)**
* **API Contract (OpenAPI spec)**
* **Wireframe PDFs** (pending)

---

### Next Actions

1. **Sign‑off** on SRS by all stakeholders by *Aug 1 2025*.
2. Kick‑off sprint 0 for infra scaffolding & CI/CD hardening.
3. Schedule design review of stall detail UI (target *Aug 5*).

---

*Prepared for Mesh Inc.*
