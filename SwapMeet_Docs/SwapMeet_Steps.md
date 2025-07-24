Below is a **practical implementation playbook** that translates every requirement in the SRS for **Mesh Bazaar** into an ordered, cross‑functional task list.
It assumes a typical Mesh squad structure: **Frontend**, **Backend**, **Realtime & Streaming**, **DevOps/Infra**, **Design & Product**, **QA**, and **Marketplace Ops**.
Work is grouped into **ten milestone blocks**; each block contains granular steps, owners, and acceptance checks.

---

## Block 0 — Foundation & Tooling (Week 0)

| #   | Task                                                                                                        | Owner    | How‑to / Notes                                                                                                                                    |
| --- | ----------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0.1 | **Create mono‑repo packages**: `bazaar-web`, `bazaar-api`, `auction-service`, `moderation-service`, `infra` | Eng lead | Yarn workspaces or Turborepo; enable isolated build caches.                                                                                       |
| 0.2 | **CI/CD pipeline**                                                                                          | DevOps   | GitHub Actions or CircleCI:<br>• Lint + type‑check<br>• Unit tests<br>• Docker build<br>• Push to ECR<br>• Helm deploy to EKS staging.            |
| 0.3 | **Staging environments**                                                                                    | DevOps   | Sub‑domains: `bazaar-stg.mesh.io`, `api-stg.mesh.io`. TLS via ACM; Auth0/NextAuth staging client IDs.                                             |
| 0.4 | **Secrets & config management**                                                                             | DevOps   | HashiCorp Vault or AWS Secrets Mgr; mount via Kubernetes Secrets.                                                                                 |
| 0.5 | **Baseline schemas in Supabase**                                                                            | Backend  | SQL migration with Sqitch or Prisma Migrate. Tables: `section`, `stall`, `item`, `offer`, `order`, `auction`, `bid`, `chat_message`, `user_role`. |
| 0.6 | **RLS policies**                                                                                            | Backend  | Supabase Dashboard → SQL:<br>`CREATE POLICY "buyers read items"...`, etc.                                                                         |

✔ **Exit criteria**: Repo scaffold passes CI; staging stack boots; DB migrations succeed end‑to‑end.

---

## Block 1 — Macro Grid Navigation (Week 1)

| #   | Task                       | Owner              | Instructions                                                                                               |
| --- | -------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------- |
| 1.1 | **Grid coordinate router** | Frontend           | In Next.js App Router: `/market/(x)/(y)` dynamic segments; parse ints; fallback to `0/0`.                  |
| 1.2 | **Section query**          | Frontend + Backend | tRPC procedure `getSection(x,y)` → returns 3×3 stalls + visitor counts. Cache in SWR 5 s.                  |
| 1.3 | **Minimap component**      | Frontend           | Canvas overlay (Pixi JS) sized 200 px; highlight current; call `/analytics/heatmap?window=30s`.            |
| 1.4 | **Keyboard & arrows**      | Frontend           | `useKeyPress(['w','a','s','d'])`; update router push; debounce 150 ms; disable when chat textarea focused. |
| 1.5 | **Telemetry**              | Frontend           | Send `grid_viewed` event (x,y, userID) to Analytics collector.                                             |

✔ **Exit criteria**: User can navigate 50 contiguous sections with p95 cold load < 1 s (ANA‑1 test).

---

## Block 2 — Stall Thumbnails & Seller CRUD (Week 1‑2)

| #   | Task                                                    | Owner         | Instructions                                                                         |
| --- | ------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------ |
| 2.1 | **Seller signup & KYC stub**                            | Ops + Backend | Form collects legal name, bank token (Stripe Connect Express); stub KYC flag.        |
| 2.2 | **Stall dashboard (internal route `/dashboard/stall`)** | Frontend      | Use ShadCN UI DataTable.<br>CRUD via tRPC `createStall`, `updateStall`.              |
| 2.3 | **Image upload (Photos & thumbs)**                      | Frontend      | Supabase Storage bucket `stall-images`; pre‑signed URL; client compress to ≤ 500 KB. |
| 2.4 | **Thumbnail card component**                            | Frontend      | Swiper auto‑rotating images; show 🟢 if `sellerPresence[x]` broadcast in Realtime.   |
| 2.5 | **SEO & share**                                         | Frontend      | Meta OG tags for individual stalls.                                                  |

✔ **Exit criteria**: Sellers create stall, images display on grid, live badge toggles via WS ping.

---

## Block 3 — Stall Detail View & CRDT Document (Week 2)

| #   | Task                       | Owner    | Instructions                                                                       |
| --- | -------------------------- | -------- | ---------------------------------------------------------------------------------- |
| 3.1 | **Y.js document schema**   | Realtime | `root: { chat:Array, offers:Array, presence:Object }`. Store doc ID = stall ULID.  |
| 3.2 | **Chat panel UI**          | Frontend | Autoscroll; Day.js timestamps; `@username` autocompletion.                         |
| 3.3 | **Item grid inside stall** | Frontend | Card with image, price, inventory; onClick → Drawer.                               |
| 3.4 | **Presence cursors**       | Frontend | HSL color per session; throttled `mousemove` broadcast 30 Hz.                      |
| 3.5 | **Moderation hooks**       | Backend  | Supabase Function `after insert ChatMessage` → check regex banned words; flag row. |

✔ **Exit criteria**: Two browsers see each other’s cursors and chat; DB rows appear; profanity flagged.

---

## Block 4 — Live Video & Streaming (Week 3)

| #   | Task                       | Owner    | Instructions                                                                              |
| --- | -------------------------- | -------- | ----------------------------------------------------------------------------------------- |
| 4.1 | **Integrate LiveKit SDK**  | Realtime | Create LiveKit room per stall; token from backend signed with sellerID, TTL 12 h.         |
| 4.2 | **Seller broadcast UI**    | Frontend | Start/Stop buttons; choose camera/mic; show viewer count via `room.participants`.         |
| 4.3 | **Viewer auto‑join muted** | Frontend | When `sellerLive=true`, client join as subscriber; auto‑play with `playsInline`, `muted`. |
| 4.4 | **Adaptive simulcast**     | Realtime | Enable VP8 simulcast 1080p/480p; LiveKit auto selects.                                    |

✔ **Exit criteria**: Seller streams, 20 viewer tabs receive, bandwidth < 2 Mbps average.

---

## Block 5 — Bargaining Workflow (Week 4)

| #   | Task                       | Owner    | Instructions                                                                     |
| --- | -------------------------- | -------- | -------------------------------------------------------------------------------- |
| 5.1 | **Offer table & API**      | Backend  | Columns: `id, itemId, buyerId, price_cents, status, message`. Index on `itemId`. |
| 5.2 | **/offer command parsing** | Frontend | Regex `/offer \$?(\d+)`; open modal pre‑filled.                                  |
| 5.3 | **Realtime offer updates** | Realtime | Push Y.js update on create/accept/counter; reflect in offers ladder UI.          |
| 5.4 | **Toast & sound alerts**   | Frontend | Use `react-hot-toast`; distinct audio for counter.                               |

✔ **Exit criteria**: Offer roundtrip < 300 ms (RT‑2, DEAL‑2).

---

## Block 6 — Checkout, Escrow & Orders (Week 4)

| #   | Task                       | Owner    | Instructions                                                                                     |
| --- | -------------------------- | -------- | ------------------------------------------------------------------------------------------------ |
| 6.1 | **Cart & checkout drawer** | Frontend | Persist to localStorage; `stripe.checkout.sessions.create` with `payment_intent_data[metadata]`. |
| 6.2 | **Webhook handler**        | Backend  | Route `/webhooks/stripe` validates sig, updates `order` & `order_line` to `PAID_ESCROW`.         |
| 6.3 | **Order tracking page**    | Frontend | `/orders/:id`; buyer confirm received.                                                           |
| 6.4 | **Escrow release cron**    | Backend  | Scheduled job daily: auto‑release orders older than 10 days without dispute.                     |

✔ **Exit criteria**: Test card purchase flows to paid; order moves to `RELEASED` when confirmed.

---

## Block 7 — Flash Auction Service (Week 5)

| #   | Task                | Owner    | Instructions                                                                           |
| --- | ------------------- | -------- | -------------------------------------------------------------------------------------- |
| 7.1 | **Go microservice** | Backend  | `POST /auction/start`, `POST /auction/bid`; Redis key `auction:<id>` with `zset` bids. |
| 7.2 | **WebSocket relay** | Realtime | AuctionService publishes `bidUpdate`; Supabase Broadcast channel `auction:<id>`.       |
| 7.3 | **Client bid UI**   | Frontend | Numeric stepper, high‑bid animate, countdown (hooks to server time).                   |
| 7.4 | **Capture payment** | Backend  | On finalize, call `stripe.paymentIntents.capture`.                                     |

✔ **Exit criteria**: Simulated 100 bids/auction processed; winner auto‑charged.

---

## Block 8 — Governance & Steward Tools (Week 5‑6)

| #   | Task                     | Owner          | Instructions                                                             |
| --- | ------------------------ | -------------- | ------------------------------------------------------------------------ |
| 8.1 | **Role escalation flow** | Ops + Backend  | Steward table; sellers vote, Ops approve; NextAuth session claims.       |
| 8.2 | **Move stall admin UI**  | Frontend       | `/admin/sections`; drag & drop; writes `stall.section_x`.                |
| 8.3 | **Dispute ticketing**    | Frontend + Ops | Remix existing Mesh Zendesk integration; link orders.                    |
| 8.4 | **Image AI scan**        | Moderation     | Invoke AWS Rekognition; save detection score. Auto‑reject > 0.88 nudity. |

✔ **Exit criteria**: Steward moves stall; flagged image blocked; dispute can refund.

---

## Block 9 — Analytics & Heat‑Map (Week 6)

| #   | Task                           | Owner    | Instructions                                                       |
| --- | ------------------------------ | -------- | ------------------------------------------------------------------ |
| 9.1 | **Event schema to ClickHouse** | DevOps   | Kafka topic `bazaar.events`; `INSERT` via Debezium CDC or Segment. |
| 9.2 | **Heat‑map generator**         | Backend  | Lambda every 30 s aggregates counts into `section_activity` table. |
| 9.3 | **Minimap overlay**            | Frontend | WebSocket subscribe `heatmap`; tint squares via alpha value.       |
| 9.4 | **Dashboard**                  | Product  | Metabase boards: DAU, GMV, offer‑to‑view, conversion.              |

✔ **Exit criteria**: Minimap shows live crowd; dashboard queries succeed < 1 s.

---

## Block 10 — Soft‑Launch “Market Day” & Hardening (Week 6)

| #    | Task                          | Owner          | Instructions                                                  |
| ---- | ----------------------------- | -------------- | ------------------------------------------------------------- |
| 10.1 | **Load & chaos tests**        | QA             | k6 script 10 k VUs; network jitter; verify auction integrity. |
| 10.2 | **Security review**           | Security       | OWASP ZAP scan; rectify P1 issues.                            |
| 10.3 | **Seller onboarding webinar** | Ops            | Walk‑through; collect feedback.                               |
| 10.4 | **Go live toggle**            | Product/DevOps | Flip WAF rule to allow public, announce on Discord.           |
| 10.5 | **Post‑mortem doc**           | All            | 24 h after event: WHAT WENT WELL / IMPROVE.                   |

✔ **Exit criteria**: ≥ 25 sellers live, ≥ 200 buyers, ≥ 50 completed orders, no Sev‑1 incidents.

---

## Ongoing & Post‑MVP Tasks

1. **Mobile‑first responsive overhaul** (start sprint 7).
2. **Internationalisation pipeline** (i18n JSON, linguist hire).
3. **AR view prototype** (Three.js + WebXR) in R\&D branch.
4. **Advanced fraud analytics** (device fingerprinting, velocity checks).
5. **Rolling reserve & dynamic fee engine** (risk‑based).

---

### Development Conventions & Tips

* **Branch naming**: `feat/bazaar/<block>-<short-desc>` (e.g., `feat/bazaar/5-bargaining-ui`).
* **Pull‑request template**: link SRS requirement ID(s), screenshot/gif, test instructions.
* **Feature flags**: LaunchDarkly keys `bazaar_offers`, `bazaar_auctions`.
* **Error budgets**: 0.5 % latency SLO burn before freeze.
* **Documentation**: Storybook stories for every composite component; OpenAPI generated from tRPC router.
* **Security**: All user‑generated images in separate origin; CSP `sandbox` for markdown in item descriptions.

---

## Who Does What (Condensed RACI)

| Area           | Frontend | Backend | Realtime | DevOps | Product | QA |
| -------------- | -------- | ------- | -------- | ------ | ------- | -- |
| Grid & Minimap | R        | C       | C        |        | A       | C  |
| Checkout       | C        | R       |          |        | A       | R  |
| Streaming      | C        | C       | R        |        | A       | C  |
| Auctions       | C        | R       | C        |        | A       | R  |
| Governance UI  | R        | C       |          |        | A       | C  |

---

## Final Checklist Before GA

1. **All P0/P1 Bugs closed** in Jira.
2. **Pen‑test certificate** filed.
3. **Stripe live keys** switched, 1 ¢ test transaction verified.
4. **Disaster‑recovery runbook** signed off (RTO < 4 h).
5. **Marketing assets & FAQ** published.

---

By following these blocks sequentially—while running **daily stand‑ups** and **weekly demos**—the team can stand up a compliant, performant, and delightful virtual flea‑market in roughly **six calendar weeks**. Adjust block staffing or overlap if your velocity differs, and treat each block’s exit criteria as the formal acceptance gateway before proceeding.

Happy building—see you on Market Day!
