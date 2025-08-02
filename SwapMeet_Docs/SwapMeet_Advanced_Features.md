Below is a menu of **twelve add‑on workstreams** that sit *on top of* your existing ten‑block playbook. Each is scoped as a one‑to‑two‑week mini‑sprint with clear exit criteria.  Pick and choose the ones that align with your vision, capacity, and launch timeline; none of them conflict with the architecture you already have (Next .js + Supabase + LiveKit + Stripe).

---

### ⚡ Block 11 — Joy & Game Loops

**Goal:** make visiting Swapmeet feel like an event, not a transaction.

| Task                                       | Owner                 | Notes / Acceptance                                                                                                                                                                                                                                               |
| ------------------------------------------ | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 11.1 **Visitor “Passport” & Badges**       | Frontend <br> Backend | Mint a non‑transferable NFT‑ish row (`user_passport`) when someone first enters.  Earn stamps for *first bid, first chat, first sale, opening day attendance*, etc.  Display in profile drawer.  ✔ Exit: Badge pops within 200 ms of event, stored idempotently. |
| 11.2 **Daily Quests / Scavenger Hunts**    | Product <br> Realtime | YAML config `{ clue, coord, reward_xp }`; on discovery, emit `quest_complete` event → toast + confetti.                                                                                                                                                          |
| 11.3 **Seasonal “Market Day” Theme Packs** | Design                | Swap CSS variables & Lottie header once per quarter (e.g., retro‑8‑bit, summer‑night‑bazaar).  Feature‑flagged via LaunchDarkly.                                                                                                                                 |

---

### 🔍 Block 12 — Discovery & Personalization

**Goal:** buyers find *serendipitous* stalls in <10 s.

| Task                                               | Owner                 | Notes / Acceptance                                                                                                                                                     |
| -------------------------------------------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 12.1 **LLM Concierge Chatbot**                     | Backend               | RAG over `item.title + item.tags + stall.about`; respond to “I’m looking for vintage band tees < \$40”.  Calls your existing `getSection` until 3 candidates returned. |
| 12.2 **Follow & Notify**                           | Frontend <br> Backend | `followed_stall` table; WebPush + e‑mail on new item, auction start, live video.                                                                                       |
| 12.3 **Collaborative Filtering “Hot Stalls” Rail** | Data                  | Nightly ClickHouse → Supabase materialized view computing Jaccard similarity between visitor click paths.  ✔ Exit: CTR on rail ≥ 15 %.                                 |

---

### 🎥 Block 13 — Immersive Stalls

**Goal:** turn the 2‑D grid into an *experience*.

* **13.1 3‑D Stall Diorama (Three.js)** — optional toggle renders items as floating pedestals; camera pans with WASD.
* **13.2 Spatial Audio Room Ambience** — loopable background track per stall; LiveKit `AudioTrack` for ambience channel.
* **13.3 AR Try‑On / Preview** — QuickLook (iOS) + Model‑Viewer (Android/desktop) for items with `glb/usdz` asset.

---

### 🤝 Block 14 — Social Commerce

* **Group‑Buy Price Drops** — Stripe PaymentIntent in `setup` mode until *n* reservations reached.
* **Bundle Builder** — drag multiple items to cart → seller quote combined shipping.
* **Co‑hosted Stalls** — multiple sellers broadcast to the same LiveKit room, splitting payout via Stripe’s `application_fee_amount`.

---

### 🛡️ Block 15 — Reputation, Trust & Safety

| Item                        | Detail                                                                                                             |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Seller & Buyer scorecards   | `reputation_score` calculated from dispute rate, on‑time shipment, chat toxicity, charge‑backs.  Visible on hover. |
| AI Counterfeit Scan         | HuggingFace ViT fine‑tuned on brand logos; flag probability > 0.9.                                                 |
| Graph‑based Fraud Detection | Neo4j “multiple accounts, same device” pattern alert; nightly e‑mail to Ops.                                       |

---

### 📈 Block 16 — Advanced Analytics & Experimentation

* **Unified Event Log** in ClickHouse → OpenTelemetry traces → Grafana tempo.
* **Feature‑Flag Experiments** — LaunchDarkly “passport\_badges\_v1” A/B; stats baked into ClickHouse with rough‑CID anonymization.
* **Real‑time Heat‑Map Tint via WebSocket** — push *delta* updates every 2 s instead of polling REST.

---

### 📱 Block 17 — Mobile‑First Polish

* Top‑of‑thumb nav bar, pull‑to‑refresh grid, haptic feedback on bid win, installable PWA.
* Device‑aware video encoding ladder (1080p → 480p) for bandwidth savings.

---

### 🌐 Block 18 — International & Accessibility

* **i18n JSON pipeline** (Locale‑based dynamic import).
* **Currency Auto‑convert** with Stripe FX rates.
* **WCAG 2.2**: focus rings, prefers‑reduced‑motion, ARIA live regions for auction countdowns.

---

### 📦 Block 19 — Logistics & Post‑Purchase Delight

* **Shippo/EasyPost integration** ­— live shipping rates, label purchase, tracking webhook → order timeline.
* **Unboxing Photo Review** — buyer uploads image; on approve, passport earns “Verified Reviewer” stamp.

---

### 🌱 Block 20 — Platform & Extensibility

* **GraphQL or Public tRPC Gateway** for third‑party bots (price trackers, affiliate bloggers).
* **Swapmeet → Discord Bridge** posting new auctions to a designated server channel.
* **Plugin Marketplace** — allow sellers to install mini‑apps (e.g., spin‑the‑wheel discount) sandboxed in iframe with postMessage.

---

### 🛠️ Block 21 — DevEx & Reliability

* **Blue/Green Deploy on EKS** with automatic 30‑second weighted shift.
* **Chaos Monkey on AuctionService** (terminate pods during bids; verify state).
* **End‑to‑End Playwright Suite** running against Preview URLs per PR.

---

### 🔐 Block 22 — Compliance & FinCEN Futures

* **Automated 1099‑K Generator** (TaxBit API).
* **Sanction List Screening** (Stripe Radar → denylist feed).
* **SOC 2 Type I Audit Prep** — evidence gathering scripts, Vanta export.

---

### 🧪 Block 23 — R‑and‑D “Moonshots”

| Idea                  | Why it’s unique                                                                                                             |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| *AI Price Coach*      | Whisper → transcribe seller’s live video, LLM suggests markdown (“Comps average \$45; start at \$39?”) displayed privately. |
| *Hologram Pop‑Up*     | Use Looking‑Glass WebXR; top sellers can project a rotatable holo of their product.                                         |
| *On‑Chain Provenance* | For collectibles, mint an ERC‑6551 “token‑bound account” so every resale keeps item history immutably.                      |

---

## How to Integrate Without Derailing Timelines

1. **Prioritise delight blocks (11‑13) for MVP++** – they add emotional stickiness with limited backend risk.
2. **Run blocks 15 & 16 in parallel** – trust & analytics can mature quietly while core UX ships.
3. **Treat blocks 20‑23 as optional “stretch” epics** gated behind \*\*>70 % OKR completion\*\* of Blocks 0‑10.

By layering these streams onto your solid foundation, Swapmeet can evolve from a *functional* virtual flea‑market into a **one‑of‑a‑kind social bazaar** that keeps visitors exploring, bargaining, and coming back for the next quest, quest reward, or flash auction thrill.
