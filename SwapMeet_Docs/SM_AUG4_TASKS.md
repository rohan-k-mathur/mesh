Below is an opinionated, engineering‑discipline–oriented task list that fills every gap in the current Swapmeet implementation **while keeping the pre‑launch stack lightweight and the existing user paths stable**.
For each block you’ll see:

* **Goal** – what “done” looks like.
* **Guard‑rails** – patterns that ensure nothing already working regresses.
* **Step‑by‑step tasks** – in the order you should tackle them, with the smallest safe change first (“make it compile, make it work, then make it fast/pretty”).

The sequence assumes a trunk‑based workflow with short‑lived PRs, feature flags (via a simple boolean column in `FeatureFlag` table + Next.js `/api/flags` endpoint cached in SWR), and CI running type‑checking + unit/integration tests + Playwright smoke tests on every commit.

---

## Foundational guard‑rails (apply to **all** blocks)

| Concern                       | Practice                                                                                                                                                                                                                      |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Schema changes**            | Use Prisma `@@map` to rename columns non‑destructively; ship migrations behind a feature flag and run `prisma migrate deploy` inside a **maintenance window** (or blue/green deploy).                                         |
| **Runtime feature isolation** | Wrap every net‑new UI/route behind `useFeature("xyz")`; default to **off** in production.                                                                                                                                     |
| **Compatibility tests**       | Add a Jest “canary” suite that: 1) hits `/swapmeet/market/0/0`, 2) buys a test item via the Stripe sandbox, 3) places a \$0.01 bid. Failing canaries block merges.                                                            |
| **No new infra**              | Prefer managed or embedded substitutes:<br>- Use Postgres LISTEN/NOTIFY or Supabase Realtime **instead of Redis pub/sub**.<br>- Persist click‑stream to a `telemetry_raw` table; Kafka/ClickHouse can be added later via CDC. |
| **Roll‑back plan**            | Every migration script must have a paired `--down` block; no irreversible DDL before launch.                                                                                                                                  |

---

## Block‑by‑block tasks

### **Block 1 – Macro Grid Navigation**

**Goal**: Visitors can pan the 3×3 market grid, trigger telemetry, and teleport anywhere.

1. **Add `grid_viewed` Telemetry**

   1. Extend schema:

      ```prisma
      model Telemetry {
        id         BigInt @id @default(autoincrement())
        event      String
        coords     String  // “x,y”
        userId     BigInt? // nullable for guests
        createdAt  DateTime @default(now())
        @@index([event, createdAt])
      }
      ```
   2. POST `/api/telemetry` server route; queue insert with `p.map()` to avoid blocking response.
   3. Fire from `useGridNavigator` hook after debounce.
   4. Verify with canary that the row appears.

2. **Teleport Button Logic**

   1. Add `getNearestOpenSection(x,y)` query (simple SQL scanning `Stall.section` vacancies).
   2. Replace hard‑coded `0/0` in `TeleportButton`.
   3. Wrap behind `FEATURE_TELEPORT_V2`.

---

### **Block 2 – Stall Thumbnails & Seller CRUD**

**Goal**: Sellers on‑board, upload multi‑image carousels, and stalls have SEO meta.

1. **Seller Signup + KYC (Stripe Connect)**

   * Add `seller_profile` table (`status: PENDING/VERIFIED`).
   * `/api/seller/onboard` – returns Stripe KYC link, saves `stripeAccountId`.
   * Use **test credentials** only; flag “KYC\_REQUIRED” so production isn’t blocked.

2. **Thumbnail Carousel**

   * Extend `StallImage { stallId, url, position }`.
   * Migrate with `CREATE TABLE …; INSERT INTO StallImage (stallId,url,position) SELECT id,thumbnailUrl,0 FROM Stall;`.
   * Front‑end: `Carousel` component using `embla-carousel-react`.

3. **SEO/OpenGraph**

   * Next.js `generateMetadata` in `[stallSlug]/page.tsx`.
   * SSR fetch stall title + first image; ensure no client‑only code path.

---

### **Block 3 – Stall Detail & Realtime**

**Goal**: Collaborative editing, rich chat, basic moderation.

1. **Y.js CRDT Document (Description & Layout)**

   * Add `/api/stall/:id/doc` returning/storing Y‑updates in **Postgres JSONB** (no Redis).
   * Attach `y-websocket` server on `/api/y/:docId` using `tinyws` package.

2. **Chat Enhancements**

   * Day.js `relativeTime` for timestamps.
   * `@nick.completer` component uses a cached `/api/stall/viewers` list.
   * Profanity check: `leo-profanity` npm; deny on server before broadcast.

---

### **Block 4 – Live Video & Streaming**

**Goal**: Host can broadcast from browser; viewers auto‑join.

1. **Integrate LiveKit Cloud (no self‑host)**

   * Add `.env.local` keys; create `GET /api/livekit-token?room=<stallId>&name=<uid>`.
   * `VideoPane` mounts `LiveKitRoom` when `feature_live_video` flag on.

2. **Broadcast UI**

   * Reuse LiveKit’s `useLocalTracks` to toggle camera/mic.
   * Viewer auto‑join triggered by `stall.live` boolean.

---

### **Block 5 – Bargaining Workflow**

**Goal**: Realtime offers visible to all parties.

1. **Offer Parsing & Validation**

   * Backend: add Prisma `Offer.status` enum (PENDING/ACCEPTED/REJECTED).
   * SSE channel (`/api/offers/stream?stallId=`) that LISTENs Postgres channel `offers_changed`.

2. **Frontend OfferLadder**

   * Subscribe to SSE; optimistic local update; reconciles on ACK.

---

### **Block 6 – Checkout, Escrow & Orders**

**Goal**: Full cart drawer, order tracking, escrow cron.

1. **Cart Drawer**

   * Zustand store `cartSlice`; SSR‑safe localStorage persistence.
   * Drawer component accessible from any page.

2. **Order Timeline**

   * `/orders/[id]` page showing Stripe status, shipping, escrow release ETA.

3. **Escrow Release Cron**

   * Vercel/Render cron hits `/api/escrow/release` daily; marks orders `FULFILLED` → `RELEASED` after `x days` unless dispute flagged.

---

### **Block 7 – Flash Auction Service**

**Goal**: Reliable close‑out + payment capture without Redis.

1. **Move close logic to Postgres advisory locks**
   Use `SELECT pg_try_advisory_lock(auctionId)` before finalize.

2. **Payment Capture**

   * On finalize, call `stripe.paymentIntents.capture`.
   * Update `Order` rows.

3. **Load‑test**

   * K6 script in `/scripts/auction.k6.js`; CI job flags >99th percentile latency.

---

### **Block 8 – Governance & Steward Tools**

**Goal**: Admins can jump anywhere, escalate roles, resolve disputes.

1. **Role System**

   * Add `role` column to `User` (USER, STEWARD, ADMIN).
   * `/api/admin/teleport?x=&y=` protected by role check.

2. **Dispute Handling**

   * `dispute` table; `/api/disputes` CRUD for stewards.
   * UI badge on order timeline if dispute open.

3. **Image AI Scan**

   * Use `@cloudinary/url-gen` + Cloudinary “Moderation” add‑on (no self‑host ML).

---

### **Block 9 – Analytics & Heat‑Map**

**Goal**: Viewer counts tint minimap in near‑real‑time.

1. **Replace Kafka with Postgres CDC**

   * Insert clickstream into `telemetry_raw`.
   * Debounce Cloudflare Worker every 30 s to compute section heat and upsert into `section_heat`.

2. **WebSocket Broadcast**

   * `/api/heat/stream` uses `supabase.realtime` channel `section_heat_changed`.

3. **Canvas Tinting**

   * Minimap subscribes and smoothly animates tint via requestAnimationFrame.

---

### **Block 10 – Soft‑Launch & Hardening**

**Goal**: Confidence before the first external users arrive.

1. **Security Review**

   * Run `npx prisma studio` read‑only role tests.
   * Use `npm audit --production`.

2. **Load Testing**

   * K6 scenarios: browsing grid, joining live video, 50 concurrent checkouts.

3. **Incident Run‑books**

   * `docs/ops/playbooks.md`: How to roll back, mute stall, block user, pause payments.

---

## Later Priority Blocks

### **Block 12 – Discovery & Personalization**

1. **12.1 LLM Concierge Bot**

   * Embed `item.title`, `item.tags`, `stall.about` with open‑source `sentence-transformers/all‑MiniLM‑L6‑v2`; store in `pgvector`.
   * `POST /api/bot/search` does hybrid BM25 + vector search across items, returns up to three stalls (for now reuse existing `getSection`).

2. **12.2 Follow & Notify**

   * `followed_stall` table (`buyerId`, `stallId`, `createdAt`).
   * WebPush subscription saved per user; worker triggers on `item.created`, `auction.created`, `stall.live = true`.
   * Opt‑in gate behind `feature_follow_notify`.

---

### **Block 19 – Logistics & Post‑Purchase Delight**

1. **Shippo / EasyPost**

   * Serverless function `/api/shipping/rates` requests live rates using demo API key.
   * `ShippingDrawer` added to checkout when address entered.
   * Webhook `/api/shipping/track` updates `order.timeline`.

2. **Unboxing Photo Review**

   * Extend `OrderReview` with `photoUrl`; uses existing Supabase storage.
   * When steward approves, insert `passport_stamp` row (`"Verified Reviewer"`).

---

## Recommended execution order & sizing

| Sprint      | Focus                                | Blocks tackled |
| ----------- | ------------------------------------ | -------------- |
| 0 (1 wk)    | Guard‑rails, Telemetry, Teleport fix | 1              |
| 1 (1 wk)    | Seller onboarding, Carousel, SEO     | 2              |
| 2 (1 wk)    | CRDT doc, chat polish                | 3              |
| 3–4 (2 wks) | Live video + Offer ladder            | 4 & 5          |
| 5–6 (2 wks) | Cart, escrow cron, auction finalize  | 6 & 7          |
| 7 (1 wk)    | Governance tools                     | 8              |
| 8 (1 wk)    | Real‑time heat‑map, analytics        | 9              |
| 9 (1 wk)    | Load/security hardening              | 10             |
| Post‑launch | Discovery, logistics                 | 12, 19         |

This roadmap keeps every sprint deployable, avoids heavyweight infra until user traction warrants it, and leaves clear off‑ramps (feature flags + down migrations) should any piece need to be rolled back.
