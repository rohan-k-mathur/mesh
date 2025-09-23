## Deferred Ideas Backlog

*A quick‑reference note set for features you’d like to tackle later.*
*(Created 5 Aug 2025 – feel free to copy this into your own docs or task tracker.)*

---

### 1 · Post scheduling & cross‑posting

* **Scope** – Add date‑time picker and “Also post to…” checklist in the post‑composer modal.
* **Targets** – Start with Reddit & Bluesky (both have well‑documented APIs) and leave provider list extensible.
* **Tech hooks** – Use a queue (e.g., BullMQ on Redis) to hold scheduled jobs; abstract “publisher” interface per network.
* **UX note** – Show a small calendar/clock icon on drafts that are scheduled; allow “unschedule” in the same menu.

### 2 · Showcase feed for the landing demo

* **Goal** – Eye‑catching carousel/grid that cycles through real user posts of *all* media types during Loom video demos.
* **Filter** – Pull the last 50 public posts, de‑duplicate by creator, randomise order every page load.
* **Implementation tip** – Use a read‑only “demo mode” API route to avoid impacting analytics.

### 3 · Finish SwapMeet auction flow

* **Remaining pieces** –

  1. Bid confirmation modal ➜ SSE updates ➜ winning‑bid settlement.
  2. Seller “accept” & payment‑capture step.
* **Edge cases** – Concurrent bids at deadline; retry logic if payment fails.

### 4 · Image options panel (site builder + article editor)

* **Controls** – Crop, focal point, filters, alt‑text, lazy‑load toggle, aspect‑ratio presets.
* **Shared component** – Build once as `<ImageSettingsDrawer>` and reuse.

### 5 · Site‑builder toolbox → CSS/Tailwind link

* **Vision** – Side panel listing common styling tokens (spacing, colour, typography). Selecting a block writes Tailwind classes into its props.
* **Dev hint** – Keep design‑system tokens in a JSON file so both Tailwind config and UI read from one source.

### 6 · Word‑game deep‑dive

* **Research tasks** – Compare NYT Spelling Bee, Wordle, Knotwords. Record mechanics that drive retention (daily streaks, share‑cards).
* **Deliverable** – 2‑3 paper prototypes + MDA (Mechanics‑Dynamics‑Aesthetics) analyses.

### 7 · Inline “Edit” on user posts

* **Minimal path** – Three‑dot menu ➜ *Edit* ➜ opens composer with prefilled content; retain original `id`.
* **Audit** – Log edit history for moderation rollback.

### 8 · Standalone PDF / library feature (à la are.na)

* **Features** – Upload PDFs, annotate, tag, organise into “Stacks”; each PDF gets preview thumbnails.
* **Infra** – Use PDF.js for rendering; store page images in S3 for fast thumbnails.

### 9 · Edge‑case solutions (happy + unhappy paths)

* **Plan** – Create checklist for each core flow (auth, post, payment) covering timeout, offline, permission‑error, 500s.
* **Outcome** – Short‑circuit UI that shows actionable fallback (“Try again”, “Save locally”).

### 10 · Polish onboarding flow

* **Refinements** – Reduce steps to three: account basics ➜ interest pickers ➜ first action (follow, post).
* **Metrics** – Track bounce at each step; A/B test copy & illustrations.

### 11 · User rating from up/down votes

* **Formula** – Wilson score or Bayesian average to avoid small‑sample bias.
* **UI** – Toggle in feed: *Show posts ≥ 3★*. Optional sort “Highest‑rated creators first”.

### 12 · Custom visibility & groups

* **Concept** – Friend lists & named groups (JSON array of `user_ids`) stored per owner.
* **Composer UI** – Visibility dropdown: Public / Followers / Custom Groups.
* **Access check** – Middleware on read queries; cache in Redis for speed.

### 13 · Goodreads social discovery

* **Integration** – OAuth import of shelves; show “Currently reading” widget in profile.
* **Side effect** – Book metadata can seed personalised recommendations or inline affiliate links.

### 14 · Advanced prediction market & halfway features

* **Prediction markets** – Expand contract types: scalar, binary, continuous‑liquidity AMM.
* **Halfway page** – Finish venue‑finder UX; add mobile map gestures & share‑link.

### 15 · Dedicated quality‑assurance day

* **Checklist** – Cypress e2e, Playwright browser matrix, Vercel preview perf, OWASP ZAP scan, Dependabot review.
* **Outcome** – Release gate: all critical tests must pass before prod deploy.

### 16 · Room Shards (micro‑community sovereignty)

* **Workflow** –

  1. Admin hits **Decentralise Room**.
  2. Wizard provisions S3 bucket + KMS key + tenant row.
  3. Prisma schema switch on `tenant_id` via middleware.
* **Portability** – One‑click export (`.tar.gz`) + `docker‑compose.yml` for Mesh‑Lite self‑host restore.
* **Security** – Room‑level encryption; cost billed to room owner’s AWS account via STS‑assumed role.

---

### How to use this document

Copy it into your Notion, wiki, or issue tracker, and turn each heading into an epic when you’re ready. Priorities, timelines, and acceptance criteria can be fleshed out later without losing today’s spark of the idea.
