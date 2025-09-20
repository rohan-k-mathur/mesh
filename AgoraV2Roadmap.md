Below is a comprehensive, **post‑V1 roadmap** for Agora as a scholarly lens—designed to be executed in small, PR‑sized steps. It translates the field guide into concrete phases, data models, endpoints, background jobs, UI, QA, and metrics. Keep this document as the living source of truth; each phase lists crisp acceptance criteria and risks.

---

## Guiding principles

* **Be a lens, not a silo:** ingest signals from arXiv/OpenReview/H‑Net/etc., preserve links/DOIs, and map them into **rooms** (deliberations) with visible WHY/GROUNDS/CLOSE.
* **Actionable first:** prioritize features that let users **do** something (add evidence, respond to reviews, vote) rather than just read streams.
* **Provenance everywhere:** every claim/event should be explainable via sources, DOIs, and receipts.
* **PR‑sized delivery:** each milestone names the new Prisma models, routes, bus topics, UI panels, and test fixtures.

---

# Phase 0 — Stabilize V1 (internal spine hardening)

*(Short, to tee up later work.)*

**Goals**

* Finalize Now feed (EventCards with coalescer), FiltersPanel, RightRail basics, Follow UX (done).
* Make SSE bus robust under burst conditions.

**Deliverables**

* ✅ `/api/events` proven under burst (already done).
* ✅ Follow buttons with optimistic UX (done).
* ✅ `/api/hub/deliberations` correctness (done).

**Acceptance**

* Feed stays stable under back‑to‑back emits (1–2s intervals) for 1k events without UI lockups.
* No duplicate events when server restarts mid‑stream.

---

# Phase 1 — Source Ingestion (Preprints & Reviews v1)

### 1A. Provider scaffolding + normalization

**Models (Prisma)**

```prisma
model ExternalSource {
  id           String  @id @default(cuid())
  provider     Provider
  key          String           // e.g., "cs.CL", "H-Announce:CFP", "OpenReview:ICLR2025"
  cursor       String?          // provider-specific ("lastUpdated", page token)
  enabled      Boolean @default(true)
  lastRunAt    DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  @@unique([provider, key])
}

enum Provider { arxiv openreview pubpeer osf ssrn philarchive hal hnet oapen altmetric }

model ExternalItem {
  id           String @id @default(cuid())
  provider     Provider
  externalId   String             // provider-native id (e.g., arXiv:2501.01234)
  doi          String?
  url          String?
  title        String
  authorsJson  Json?
  publishedAt  DateTime?
  rawJson      Json
  fingerprint  String             // stable hash of canonical fields
  deliberationId String?          // room we created/linked to
  createdAt    DateTime @default(now())
  @@unique([provider, externalId])
  @@index([doi])
}
```

**Server**

* `apps/server/ingest/*` pollers:

  * `arxivPoller.ts` (category list → new items)
  * `openReviewPoller.ts` (venue feed → latest notes/decisions)
  * `pubPeerPoller.ts` (by DOI → new comments) *(if no official API, route via approved aggregator or per‑project opts)*

**Routes**

* `POST /api/ingest/run` (dev/admin only) — kicks a named provider/key run.
* `GET /api/ingest/status` — last run times, counts, cursors (for ops).
* **No public surfacing yet.** Events map to internal bus.

**Bus mapping**

* `arxiv:new` → emit `deliberations:created` with `{ id, title, chips: ["preprint","cs.CL"], link, deliberationId }` after creating a room.
* `openreview:note` → emit `comments:changed` (and `decision:changed` on meta decision updates) with links to the OpenReview thread.
* `pubpeer:new` → emit `citations:changed` for rooms matching DOI.

**UI**

* No new UI exposure besides the Now feed listing these events when they map to rooms you follow.

**Acceptance criteria**

* Provider runs are idempotent (same batch twice → zero duplicates).
* New arXiv items in a watched category create **exactly one** room, attach DOI/URL via `/api/citations/resolve`, and show a feed card.
* OpenReview updates produce visible `comments:changed` items linked to the correct room.
* PubPeer comments produce a “post‑pub comment” chip on the room if DOI matches.

**Risks / Mitigation**

* *Rate limits / Terms:* add per‑provider rate caps, backoff; keep rawJson minimal and cache fingerprints.
* *Duplicate works across providers:* dedupe on DOI and normalized title hash; if conflict, prefer DOI match.

---

# Phase 2 — Evidence & DOI UX (Make sources first‑class)

### 2A. One‑click DOI/URL attach polish

**Server**

* Enhance `/api/citations/resolve`: recognize provider patterns (arXiv IDs, DOIs, GitHub releases, Zenodo) and classify `kind: "preprint" | "article" | "dataset" | "software" | "review"`.

**Client**

* Paste box in RightRail “Add source”:

  * Autodetect type, preview title/venue, “Attach” CTA.
  * Small badges on EventCards and room header: `preprint`, `dataset`, `code`.

**Acceptance**

* Paste any DOI/URL → instant preview + success.
* Evidence chips appear consistently and deduplicate across providers.

---

# Phase 3 — Reviews Pane (Make external review legible in the room)

### 3A. ReviewNote model + panel

**Models**

```prisma
model ReviewNote {
  id              String @id @default(cuid())
  provider        Provider
  externalId      String
  deliberationId  String
  kind            ReviewKind   // review | rebuttal | decision
  authorName      String?
  content         String?      // brief excerpt/summary
  url             String
  postedAt        DateTime?
  rawJson         Json
  createdAt       DateTime @default(now())
  @@index([deliberationId])
}

enum ReviewKind { review rebuttal decision }
```

**Server**

* Ingestors normalize OpenReview notes/eLife assessments (if used later) → `ReviewNote`.
* `GET /api/reviews?deliberationId=…` returns latest 5 notes; SSE on `comments:changed | decision:changed` to refresh.

**Client (RightRail)**

* **“Reviews & Responses”** card:

  * Latest N notes, label (Review #, Decision), link out.
  * Quick action: “Draft GROUNDS responding to Review #2” (opens composer prefilled with quote link).

**Acceptance**

* When OpenReview updates, the RightRail list refreshes via SSE.
* Clicking a review CTA opens the WHY/GROUNDS composer anchored to the room.

**Risk**

* Provider drift → keep parser modules versioned and unit‑tested with fixtures.

---

# Phase 4 — Humanities Stream (H‑Net / HAL / OAPEN / Annotations)

### 4A. CFPs & network news

* **Provider:** `hnetPoller.ts` → `ExternalItem` with `chips: ["cfp","history"]`, no room creation by default; “Create discussion” CTA on feed card.

### 4B. OA monographs (OAPEN/HAL)

* For OA books with chapter structure, create a room with **chapter anchors** in the RightRail (quick links).
* Treat the landing DOI as primary; if chapters have DOIs, attach as EvidenceLink children.

### 4C. Annotations

* If a room links to a public web/PDF, show a **“Annotate via Hypothesis”** button (link‑out). Optional: fetch counts per URL and display as a chip.

**Acceptance**

* H‑Net CFPs appear in “All” and “Following” if user follows the tag; “Open discussion” instantly spawns a room with prefilled context.
* OA monograph room shows chapter links; evidence chips visible for each DOI.

---

# Phase 5 — Tasklets & Thresholds (Make “what to do now” obvious)

### 5A. Thresholds service

**Server**

* `lib/services/thresholds.ts` with:

  * `calcCQCompleteness(roomId)` → `{ satisfied, required, pct }`
  * `calcEvidenceSufficiency(roomId)` → `{ have, need, pct }`
  * `calcParticipation(roomId)` → `{ voters, min, pct }`

**Client**

* **Threshold Chips** on room header and RightRail (green when ≥ targets).
* “Confirm” CTA appears only when all go green.

### 5B. Tasklets service

**Model**

```prisma
model Tasklet {
  id             String @id @default(cuid())
  deliberationId String
  kind           TaskletKind // add_evidence | draft_grounds | summarize_review | check_license
  targetType     String      // claim | argument | review
  targetId       String
  prompt         String
  status         String @default("open") // open | done | skipped
  createdAt      DateTime @default(now())
  doneAt         DateTime?
  @@index([deliberationId])
}
```

**Server**

* `GET /api/tasklets?deliberationId=…` generates on the fly (or persists) based on:

  * Open CQs (from `/api/dialogue/legal-moves`)
  * Evidence counts vs. thresholds
  * ReviewNotes present without linked responses
  * Dataset DOI without license detected → “check\_license”

**Client (RightRail)**

* “**Act now**” checklist (max 5). Completing one shows ✓ and emits `dialogue:moves:refresh`.

**Acceptance**

* Completing a task updates chips and potentially enables Confirm.

---

# Phase 6 — People & Credit (ORCID + CRediT roles)

### 6A. ORCID linking

**Models**

```prisma
model ORCIDLink {
  id        String @id @default(cuid())
  userId    String @unique
  orcid     String @unique
  createdAt DateTime @default(now())
}
```

**Server**

* OAuth dance (ORCID public scope). Store ORCID id; don’t store long‑lived tokens unless needed for read operations.

**Client**

* Profile: “Connect ORCID” button; ORCID chip on contributions.

### 6B. CRediT roles from Crossref

* When `/api/citations/resolve` sees Crossref metadata with CRediT, attach roles to EvidenceLinks and surface credit chips in the room.

**Acceptance**

* Users can connect ORCID and see their chip appear on contributions they authored.
* If CRediT is present for a DOI, roles appear in an expandable list (“Conceptualization, Software, …”).

---

# Phase 7 — Discovery & Navigator (XRef + threads)

### 7A. XRef (planned in your backlog)

**Models**

```prisma
model XRef {
  id        String @id @default(cuid())
  fromType  String
  fromId    String
  toType    String
  toId      String
  relation  String   // supports | refutes | duplicate | related | cites
  metaJson  Json?
  createdAt DateTime @default(now())
  @@index([toType, toId])
}
```

**Routes**

* `GET /api/xref?toType=deliberation&toId=…`
* `POST /api/xref` (create)

**Client**

* RightRail **Navigator** lists parents/siblings/children by relation.
* `/agora/threads` shows clusters (thread lens) as cards; click → forum or deep dive.

**Acceptance**

* Selecting a feed item with `deliberationId` populates Navigator with at least parents/children.
* Thread lens groups ≥ 2 rooms via `related` or `duplicate` links.

---

# Phase 8 — Preservation & Provenance cues

**Server**

* Extend `/api/citations/resolve` to store `archivedUrl` if Wayback save exists.
* Optional: flag known preservation (CLOCKSS/Portico) if detectable via metadata providers.

**Client**

* Evidence chip shows “archived ✓” when an archived URL exists; “Save snapshot” CTA otherwise.

**Acceptance**

* Each DOI/URL shows whether an archived copy exists.
* Clicking “Save snapshot” records a task or triggers a server job (depending on policy).

---

# Phase 9 — Governance, Moderation, and Ethics

**Policies**

* Terms for third‑party data use; respect robots and provider ToS.
* Community guidelines for review summaries and PubPeer references.

**Tech**

* Flagging on rooms/moves (reuse your existing moderation primitives).
* Rate limiting per user for ingestion‑triggered actions.

**Acceptance**

* Abusive content can be flagged and hidden pending review.
* Providers can be disabled per key from an admin UI.

---

# Phase 10 — Externalization (Public APIs & webhooks)

**Routes**

* `GET /api/public/rooms?query=…` (read‑only, cursor‑paged).
* `GET /api/public/room/[id]/events`
* `POST /api/webhooks/agora` (partners subscribe to decision receipts or evidence changes)

**Security**

* Token‑scoped access; per‑route rate limits; audit logs.

**Acceptance**

* Partners can fetch public rooms and listen for `decision:changed` without seeing private content.

---

## API & Event Index (new/extended)

**New**

* `POST /api/ingest/run` *(admin)*
* `GET /api/ingest/status`
* `GET /api/reviews?deliberationId=…`
* `GET /api/tasklets?deliberationId=…`
* `GET /api/xref?...`, `POST /api/xref`
* `GET /api/public/*` (Phase 10)

**Extended**

* `/api/citations/resolve` → classify kind; add `archivedUrl`; enrich Crossref/CRediT.
* `/api/agora/sidebar?deliberationId=…` → add `reviews[]` and `tasklets[]` stubs.

**Bus topics (added)**

* `reviews:changed`, `tasklets:changed`, `ingest:ran`, `follow:changed` (already emitting locally)

---

## UI Inventory (ship order)

1. **RightRail**

   * Reviews & Responses (Phase 3)
   * Act Now (Tasklets) (Phase 5)
   * Navigator (XRef) (Phase 7)
2. **FiltersPanel**

   * Hub snapshot (already planned)
   * Humanities CFP list (Phase 4)
3. **Now Feed**

   * New content types: “CFP”, “Monograph”, “Post‑pub comment”, “Decision”
   * Evidence badges on cards
4. **Room header**

   * Threshold chips + Confirm CTA (Phase 5)
   * Preservation badge (Phase 8)

---

## Ops, Telemetry, QA

**Observability**

* Emit `metrics:ingest` (per provider: fetched, deduped, created, linked).
* Track `latency:ingest→card` (time from provider event to feed card visible).
* Track `tasklets:complete` and `confirm:gate` rates.

**QA/Fixtures**

* `tests/fixtures/arxiv/*.json`, `openreview/*.json`, `pubpeer/*.json`, `crossref/*.json`
* Unit tests for normalizers: stable fingerprints, DOI detection, kind classification.
* Integration tests for end‑to‑end: ingest → `ExternalItem` → room created → event emitted → card rendered.

**Performance**

* Provider pollers run in short, bounded batches; use cursors; enqueue next batch via BullMQ.
* Backpressure: if SSE queue grows, coalesce provider events by room (you already have coalescer logic—reuse it on the server).

---

## Data migration plan (Prisma)

1. Add enums/models (`Provider`, `ExternalSource`, `ExternalItem`, `ReviewNote`, `Tasklet`, `XRef`, `ORCIDLink`).
2. Backfill: try to match existing rooms by DOI/title fingerprint to populate `ExternalItem.deliberationId`.
3. Create indexes: `(provider, externalId)`, `doi`, `deliberationId`.

---

## Security & Compliance

* Obey provider ToS and robots; don’t store non‑public data.
* Keep rawJson minimal (only what’s needed to render provenance).
* Store ORCID id; avoid long‑lived tokens unless a feature requires them.
* Clear “source of truth” disclaimers on review summaries.

---

## Rollout strategy (feature flags)

* `ff/ingest-arxiv`, `ff/ingest-openreview`, `ff/reviews-pane`, `ff/tasklets`, `ff/xref`, `ff/hnet`, `ff/oapen`, `ff/orcid`, `ff/public-api`
* Start with arXiv + OpenReview in a staging room tag; then progressively light up flags.

---

## T‑shirt sizing (for planning only)

* **S**: endpoint scaffolds, simple UI cards, chips, basic pollers.
* **M**: normalization with dedupe, tasklet generator, XRef Navigator, ORCID OAuth.
* **L**: robust provider adapters with backoff, reviews pane with parsing variants, public API/webhooks.

---

## Open questions (to resolve before Phases 3–5)

* Do we want to **auto‑spawn rooms** for every preprint, or only upon a follow/signal threshold?
* Minimum viable **thresholds** for Confirm (defaults vs. per‑room config)?
* PubPeer licensing/quoting: show excerpt vs. link‑only?
* For OA monographs, do we represent *chapters* as XRefs or as **section anchors** in a single room?

---

### Ready-to-implement PR seeds (copy/paste checklist)

**PR‑1:** `ExternalSource`/`ExternalItem` models + `/api/ingest/status`
**PR‑2:** `arxivPoller.ts` (one category) → `deliberations:created` + evidence attach
**PR‑3:** `openReviewPoller.ts` (one venue) → `ReviewNote`, `reviews:changed` + RightRail card
**PR‑4:** `/api/citations/resolve` kind classification + evidence badges
**PR‑5:** `lib/services/thresholds.ts` + header chips + Confirm gating
**PR‑6:** `Tasklet` model + `/api/tasklets` + RightRail checklist
**PR‑7:** `XRef` model + `GET/POST /api/xref` + Navigator
**PR‑8:** ORCID link (OAuth flow) + profile chip
**PR‑9:** Humanities adapters: `hnetPoller.ts`, `oapenPoller.ts` (room w/ chapter anchors)
**PR‑10:** Preservation badges (archive URL) and “Save snapshot” action

---

This roadmap keeps each step small and testable, lines up with your existing bus/topics, and grounds Agora in the real scholarly stream while preserving deliberation as the core interaction. When you’re ready to start Phase 1, I can draft the exact payload contracts and file stubs for `arxivPoller.ts` and `openReviewPoller.ts` to match your repo layout.


--

Ideation Session: 

"In order to better work out the full potential of the feature spaces within agora, lets walk through a case study of how scientific/humanities research communities exchange ideas, papers, discuss their discipline etc -- what is the current infrastructure that supports this kind of communication in formal research/ scholarly environments"

Here’s a compact “field guide” to how research communities actually move ideas around today—STEM *and* humanities—followed by the gaps that keep showing up and where Agora can plug in.

---

## A. How scholars exchange work today (two quick case studies)

### Case 1 — AI/CS or physics group (fast‑cycle, preprint‑driven)

1. **Discovery.** People scan arXiv feeds and topic alerts; search across OpenAlex/Semantic Scholar to map a subfield and who’s publishing with whom. ([arXiv][1])
2. **Draft & share early.** They post a **preprint** to arXiv (with versioning, no peer‑review by arXiv), then circulate links in Slack/Twitter/Mastodon and lab lists. ([arXiv][1])
3. **Open review (conference track).** For ICLR/NeurIPS‑style venues, submissions run through **OpenReview** with public discussion threads during the rebuttal phase; ICLR’s CFP explicitly describes the public, logged‑in discussion model. ([ICLR][2])
4. **Code & data.** Repos go to GitHub; releases are archived to **Zenodo** to mint a DOI; datasets land in **Figshare/Dryad/Zenodo** depending on norms. ([GitHub Docs][3])
5. **Identity & metadata.** Authors attach **ORCID** iDs; journals/publishers register DOIs and metadata through **Crossref**. ([ORCID][4])
6. **Publish‑then‑review models.** In parts of life sciences, **eLife** “reviewed preprints” attach public reviews and an editorial assessment to the preprint (no accept/reject). ([eLife][5])
7. **After publication.** Post‑pub discussion occurs on **PubPeer**, and attention signals are tracked by **Altmetric** and others. ([The Journalist's Resource][6])
8. **Long‑term preservation.** Libraries mirror content via **LOCKSS/CLOCKSS** or **Portico**; institutions preserve local outputs in **DSpace** repositories. ([LOCKSS Program][7])

### Case 2 — History/Philosophy/Literature group (slower cycle, book‑centric)

1. **Discovery.** Scholars work through **JSTOR/Project MUSE** and track authoritative monographs; OA monographs increasingly surface via **OAPEN/Open Book Publishers**. ([About JSTOR][8])
2. **Community exchange.** Calls for papers and field news run on **H‑Net** networks and H‑Announce; working papers may appear in **Humanities Commons CORE**, **SSRN**, or field repositories like **PhilArchive**. ([H-Net Networks][9])
3. **Open repositories.** In Europe (esp. France), **HAL** serves as a national open archive spanning disciplines, including the humanities. ([about.hal.science][10])
4. **Annotation & seminars.** Reading groups use **Hypothes.is** for social annotation over PDFs/web pages, often paired with Zoom/colloquia. ([Hypothesis][11])
5. **Identity/metadata & preservation** are similar to STEM: ORCID/Crossref for IDs/DOIs; library IRs + LOCKSS/Portico for durable access. ([ORCID][4])

---

## B. The backbone infrastructure (what’s actually doing the work)

* **Identifiers & registries:** ORCID for people; DOI via Crossref (and DOI Foundation) for articles/books/data/code; ROR for orgs (adjacent). ([ORCID][4])
* **Preprints:** arXiv (STEM), OSF Preprints aggregator, SSRN (social sciences/law), PhilArchive (philosophy), HAL (multidisciplinary). ([arXiv][1])
* **Open peer‑review platforms:** OpenReview (ICLR et al.), “publish‑then‑review” at eLife; overlay journals like **Discrete Analysis**/**Quantum** built on arXiv. ([ICLR][2])
* **Discovery & graphs:** OpenAlex (open catalog), Semantic Scholar (AI‑assisted search). ([OpenAlex Documentation][12])
* **Data/code repositories:** Zenodo, Figshare, Dryad; many mint DOIs and integrate with ORCID. ([Zenodo][13])
* **Impact & discussion:** Altmetric (attention “donut”/score), PubPeer (post‑publication peer review). ([Altmetric][14])
* **Preservation & institutional repositories:** LOCKSS/CLOCKSS, Portico, and DSpace‑based IRs. ([LOCKSS Program][7])
* **Process standards:** FAIR data principles; TOP Guidelines; CRediT (contributor roles); Registered Reports workflow. ([Nature][15])
* **Submission/workflow systems:** For journals: ScholarOne/Editorial Manager; for conferences: Microsoft CMT/EasyChair; for LaTeX collaboration: Overleaf. ([Silverchair][16])

---

## C. Where the pain shows up (patterns across fields)

1. **Fragmentation of the “conversation.”** Announcements on H‑Net, reviews on OpenReview, datasets on Zenodo, code on GitHub, comments on PubPeer—context is scattered and ephemeral. ([H-Net Networks][17])
2. **Discovery ≠ understanding.** Graphs like OpenAlex/Semantic Scholar surface *papers*, not *what the community thinks about them right now*. ([OpenAlex Documentation][12])
3. **Review opacity (outside a few venues).** Open commentary is rich in AI/CS and eLife’s model, but most journals keep reviews closed. ([ICLR][2])
4. **Provenance & credit.** Contributions beyond authorship (data curation, software, conceptualization) are often invisible unless journals enforce **CRediT**. ([CRediT][18])
5. **Reproducibility & data stewardship.** FAIR/TOP compliance varies widely; linking claims to data/code remains manual in most workflows. ([Nature][15])
6. **Long‑term access anxiety.** Individual links rot; institutional preservation is robust but invisible to researchers. ([LOCKSS Program][7])

---

## D. What this suggests for **Agora** (features that matter)

Below, each item maps to our existing stack (events bus, dialogue moves, citations) and to “rooms” as the unit of deliberation.

### 1) Ingest the scholarly *stream* into the Now feed

* **Preprint watchers** (arXiv categories; OSF/SSRN/PhilArchive/HAL): create `deliberations:created` for a new paper with auto‑chips (field, venue, year) and attach the DOI/URL via **/api/citations/resolve**. ([arXiv][1])
* **Open review hooks** (OpenReview): create `votes:changed`/`decision:changed`/`comments:changed` proxies as the discussion evolves, linking to rebuttals. ([ICLR][2])
* **Post‑pub signals** (PubPeer, Altmetric): surface “new comment” and “attention spike” events for followed rooms as low‑noise chips. ([The Journalist's Resource][6])

**Why this works in Agora:** our SSE bus + coalescer already compresses bursts; these sources just become new event producers.

### 2) Evidence that stays attached

* **One‑click DOI attach**: paste any DOI/URL → `/api/citations/resolve` dedupes, fingerprints, and Wayback‑saves; render source chips (“preprint”, “dataset”, “code release”). (We already have resolve+attach; just add DOI/UI affordances.) ([www.crossref.org][19])
* **Data/code affordances**: treat Zenodo/Figshare/Dryad DOIs as first‑class **EvidenceLink** with badges (“dataset”, “software”), and show basic FAIR hints (has license? has README?). ([Zenodo][13])

### 3) Make *review* visible, even when it lives elsewhere

* For rooms tied to OpenReview or eLife, show a **Review pane** in the Right Rail: latest reviews, author responses, and status (“public review open”, “editorial assessment posted”). ([ICLR][2])
* For traditional journals, let users add a **summarized review** as a WHY/GROUNDS move with a citation to the published article; gate it with our CQ schema.

### 4) People & credit, not just papers

* **ORCID linking** on user profiles and contributor chips in a room; show **CRediT roles** captured from Crossref metadata when available. ([ORCID][4])

### 5) Tasklets that help the field right now

* **“Act now” list** in Right Rail:

  * “Add evidence to claim X” (under‑evidenced threshold),
  * “Draft a GROUNDS move responding to Review #2,”
  * “Check dataset DOI/licensing,”
  * “Summarize PubPeer thread for this room.”
    These derive from `/api/dialogue/legal-moves` + simple heuristics.

### 6) Preservation & provenance cues

* Show **archive status** (LOCKSS/Portico/IR present?) next to canonical links when we can detect it; if absent, prompt a “Save to Web Archive” action. ([LOCKSS Program][7])

### 7) Humanities‑specific helpers

* **H‑Net/Humanities Commons inbox**: ingest CFPS/announcements the user follows into Agora feed with “Join CFP” or “Propose panel” CTAs. ([H-Net Networks][9])
* **Book‑first** rooms: when an OA monograph (OAPEN/OBP) appears, create a room seeded with chapter anchors; Right Rail links to a Hypothes.is layer for group annotation. ([oapen.org][20])

---

## E. Minimal tech to ship first (fits our current stack)

1. **Source adapters** (server cron or webhook → bus):

   * `arxiv:new` → `deliberations:created` (+ `/api/citations/resolve` on DOI/URL). ([arXiv][1])
   * `openreview:note` → `comments:changed` w/ linkback. ([ICLR][2])
   * `pubpeer:new` → `citations:changed` chip “post‑pub comment”. ([The Journalist's Resource][6])

2. **RightRail: Reviews & Tasklets**

   * `/api/agora/sidebar?deliberationId=…` returns `{ calls[], votes[], receipts[], reviews[] }` (we already scoped this); render a “Review & respond” card.

3. **Evidence badges + thresholds**

   * Small service that inspects each attached DOI’s type (Crossref/OpenAlex) and sets badges + “evidence sufficiency” % (to drive our **Threshold chips**). ([www.crossref.org][19])

---

## F. Why this maps well to scholarly norms

* It respects **existing identifiers and standards** (ORCID, DOI/Crossref, CRediT, FAIR/TOP) rather than inventing new ones. ([ORCID][4])
* It **mirrors real venues**—arXiv, OpenReview, H‑Net, OAPEN/JSTOR/MUSE—so Agora becomes the *lens* on top of the stream, not another silo. ([arXiv][1])
* It keeps **deliberation** (WHY/GROUNDS/CLOSE) where Agora shines, while linking out for full texts, reviews, and datasets.

If you want, I can sketch the exact event payloads for `arxiv:new`, `openreview:note`, and `pubpeer:new` and how they map into our existing `AgoraEvent` shape and bus topics.

[1]: https://arxiv.org/?utm_source=chatgpt.com "arXiv.org e-Print archive"
[2]: https://iclr.cc/Conferences/2025/CallForPapers?utm_source=chatgpt.com "Call for Papers"
[3]: https://docs.github.com/articles/referencing-and-citing-content?utm_source=chatgpt.com "Referencing and citing content"
[4]: https://orcid.org/?utm_source=chatgpt.com "ORCID iD"
[5]: https://elifesciences.org/inside-elife/14e77604/elife-s-new-model-what-is-a-reviewed-preprint?utm_source=chatgpt.com "eLife's New Model: What is a Reviewed Preprint?"
[6]: https://journalistsresource.org/home/pubpeer-research-misconduct-tips-journalists/?utm_source=chatgpt.com "5 tips for using PubPeer to investigate scientific research ..."
[7]: https://www.lockss.org/?utm_source=chatgpt.com "LOCKSS Program"
[8]: https://about.jstor.org/?utm_source=chatgpt.com "About JSTOR: Home"
[9]: https://networks.h-net.org/?utm_source=chatgpt.com "H-Net Commons Homepage | H-Net"
[10]: https://about.hal.science/en/?utm_source=chatgpt.com "HAL is a multidisciplinary open archive ..."
[11]: https://web.hypothes.is/?utm_source=chatgpt.com "Collaborate & Annotate with Hypothesis | Online Annotation Tool"
[12]: https://docs.openalex.org/?utm_source=chatgpt.com "OpenAlex technical documentation: Overview"
[13]: https://about.zenodo.org/?utm_source=chatgpt.com "Zenodo: About"
[14]: https://www.altmetric.com/about-us/our-data/donut-and-altmetric-attention-score/?utm_source=chatgpt.com "The donut and Altmetric Attention Score"
[15]: https://www.nature.com/articles/sdata201618?utm_source=chatgpt.com "The FAIR Guiding Principles for scientific data ..."
[16]: https://www.silverchair.com/products/scholarone-manuscripts/?utm_source=chatgpt.com "ScholarOne Manuscripts - Silverchair"
[17]: https://networks.h-net.org/h-announce?utm_source=chatgpt.com "H-Announce | H-Net"
[18]: https://credit.niso.org/?utm_source=chatgpt.com "CRediT – Contributor Role Taxonomy"
[19]: https://www.crossref.org/services/content-registration/?utm_source=chatgpt.com "Content Registration"
[20]: https://www.oapen.org/?utm_source=chatgpt.com "OAPEN: Online Library and Publication Platform"
