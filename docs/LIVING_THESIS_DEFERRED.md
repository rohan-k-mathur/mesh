# Living Thesis — Deferred Work

**Purpose:** explicit, auditable record of capabilities intentionally deferred from the active [LIVING_THESIS_ROADMAP.md](LIVING_THESIS_ROADMAP.md). Each entry has a trigger condition for revisiting.

**Vision source:** [LIVING_THESIS_FEATURE_DESCRIPTION.md](LIVING_THESIS_FEATURE_DESCRIPTION.md)

---

## D1 — Auto-snapshot background workers

**What:** automatic `ThesisSnapshot` creation on key events (publish, version bump, N-attack threshold crossed, scheduled cadence).

**Why deferred:** Phase 5 ships user-triggered snapshots only; that's enough to validate the snapshot UX and citation use case. Background workers add infra (BullMQ job, retry/idempotency, dedup) before we know what cadence is right.

**Depends on:** Phase 5 (manual snapshots) shipped and in use.

**Revisit when:**
- Users routinely forget to snapshot before significant changes.
- Citers ask for "what did this thesis look like on date X" and we have no snapshot.
- We launch policy/journalism partnerships that require auditable historical states.

**Implementation sketch:**
- New worker in `workers/` consuming a `thesis-snapshot` BullMQ queue.
- Triggers: `POST /api/thesis/[id]/publish` enqueues a snapshot job; cron route enqueues weekly snapshots for active theses; attack-register webhook enqueues on threshold.
- Idempotency key per `(thesisId, trigger, contentHash)` to prevent duplicates.
- Snapshot row gains a `trigger` enum column (`MANUAL | PUBLISH | VERSION_BUMP | ATTACK_THRESHOLD | SCHEDULED`).

---

## D2 — Canonical user-facing deep-link URLs + embeddable widget

**What:**
- Promote internal `mintMoid` / `mintUrn` IDs to user-facing canonical URLs (`/c/<moid>`, `/a/<moid>`, `/p/<moid>`) that resolve to a live page for the object.
- Embeddable widget (iframe / web component) for citing a deliberation object on third-party sites; auto-audits citation by reflecting current state.

**Why deferred:** internal ids already exist and are usable for in-app navigation (Phase 6 entry-point routing uses `?focus=<id>`). User-facing URL design, slug strategy, OG metadata, and embed security model are a separate workstream.

**Depends on:** Phase 1 (live data) and Phase 2 (inspection drawer) so the canonical pages have something rich to render.

**Revisit when:**
- External outlets (journalists, blogs) want to cite Mesh objects in articles.
- We pursue the "citation as deep linking" property from the vision doc as a marketing surface.
- Search/SEO of individual claims/arguments becomes a goal.

**Implementation sketch:**
- New routes: `app/c/[moid]/page.tsx`, `app/a/[moid]/page.tsx`, `app/p/[moid]/page.tsx` resolving moid → canonical object page (reuses inspector internals as the page body).
- Widget endpoint: `GET /api/embed/[kind]/[moid]` returning a small standalone HTML/JS bundle suitable for `<iframe>` or `<script>` embed.
- OG image generation from current state (label, attack count, last-changed).
- CORS + frame-ancestors policy for the widget.

---

## D3 — SSE/WebSocket transport upgrade

**What:** replace SWR polling against `/api/thesis/[id]/live` with a push-based channel (SSE first, WebSocket if presence/co-editing lands).

**Why deferred:** policy-document update cadence (minutes to hours) makes 30s polling perfectly adequate. Push transport adds connection accounting, auth-on-socket, and back-pressure concerns we don't need yet.

**Depends on:** Phase 1 endpoint shape stable and `?since=<cursor>` semantics defined; Phase 7.1 instrumentation in place to read the trigger signals.

**Revisit when one or more is true:**
- Median time-to-see-attack on a watched thesis exceeds ~30s and users complain.
- Polling load against `/live` exceeds ~5% of total API RPS.
- We ship co-presence on a thesis page (cursors, "X is reading"). Sockets become unavoidable.

**Implementation sketch:**
- Add `GET /api/thesis/[id]/live/stream` (SSE) emitting `{ cursor, deltas }` events against the same shape as the polled endpoint.
- `useThesisLive` gains a transport switch; default polling, optional SSE behind a feature flag.
- Reuse existing Socket.io infra only if WebSocket becomes necessary (presence).

---

## D4 — Chain embedding, enabler panel, justification, reconstruction versioning

**What:** the entire integration track from [../THESIS_ARGUMENTCHAIN_INTEGRATION_ANALYSIS.md](../THESIS_ARGUMENTCHAIN_INTEGRATION_ANALYSIS.md):
- `ArgumentChainNode` TipTap extension for embedding chains in thesis content.
- Enabler panel surfaced inside `ProngEditor` and the published view.
- `ArgumentSchemeInstance.justification` field made visible across argument displays.
- Chain ↔ prong conversion APIs.
- Reconstruction versioning (`parentChainId`, `versionLabel`, fork/diff UI).

**Why deferred:** policy/pragmatics audience (Phases 3–4) is the V1 priority. Chain embedding primarily serves the philosophical-reconstruction audience (CPR-style work).

**Depends on:** Phase 1 (live binding pattern) — chain embeds will reuse the same context/transport rather than reinvent it.

**Revisit when:**
- Phases 1–6 are shipped and stable.
- We open the platform to philosophical-reconstruction use cases (Kant CPR, etc.).
- Users start composing theses that reference `ArgumentChain`s and complain about the missing embed.

**Implementation sketch:** see [../THESIS_ARGUMENTCHAIN_INTEGRATION_ANALYSIS.md](../THESIS_ARGUMENTCHAIN_INTEGRATION_ANALYSIS.md) Priorities 1–5 and the 6-week roadmap therein.

---

## Maintenance protocol

- When picking up a deferred item, move it from this file into the active [LIVING_THESIS_ROADMAP.md](LIVING_THESIS_ROADMAP.md) as a new phase and update the roadmap's deferred-list block at the bottom.
- When a new deferral decision is made, add an entry here with the same shape: **What / Why deferred / Depends on / Revisit when / Implementation sketch**.
- Keep `Revisit when` triggers concrete and observable. Vague triggers ("when we have time") tend to mean "never".


---

## D5 — Hash-anchor scrolling for embedded objects

**What:** when a deep link includes `#claim-<id>` (or similar) anchor in addition to `?focus=`, scroll the target node into view rather than only opening the inspector.

**Why deferred:** Phase 6.1 ships `ThesisFocusHandler` that opens the inspector and best-effort scrolls to a `[data-object-id]` element. True hash-anchor navigation (back-button-friendly, browser-native) requires assigning stable DOM ids to every embedded TipTap node, which intersects with the canonical-URL design (D2).

**Depends on:** D2 canonical URL scheme; embedded TipTap node attrs reach DOM as `id` not just `data-*`.

**Revisit when:** we ship D2 and need browser-native anchor scrolling for journalist citations.

**Implementation sketch:**
- Extend each embedded TipTap node renderer to emit `id={`obj-${kind}-${id}`}` alongside existing `data-object-id`.
- `ThesisFocusHandler` updates `window.location.hash` after resolving focus so refresh + back/forward preserve the anchor.

---

## D6 — MOID expansion to non-Claim objects

**What:** today only `Claim` carries a `moid` (used by Phase 6.1 focus resolver and by D2 canonical URLs). Extending stable `moid` handles to `Argument`, `Proposition`, and `Citation` would let canonical short URLs cover every embeddable kind.

**Why deferred:** Claim-only is enough for the V1 citation use case (the journalist-citing-a-claim path in the vision doc). Extending `moid` requires a one-time migration + collision strategy across kinds.

**Depends on:** D2 (canonical URLs); product decision on whether non-Claim objects need shareable short URLs.

**Revisit when:** D2 ships and users start asking to cite arguments/propositions directly.

**Implementation sketch:**
- Add `moid String? @unique` to `Argument`, `Proposition`, `Citation` in `lib/models/schema.prisma`.
- Backfill via `scripts/` one-shot using existing `mintMoid` helper, namespaced per kind to avoid collision.
- Update `app/api/thesis/[id]/focus/route.ts` to try moid lookup against all four kinds (currently Claim-only).

---

## D7 — Structured metric emission (replace `console.info` lines)

**What:** Phase 7.1 emits one structured `console.info` line per reader request (`thesis.reader.poll`). Promote that to a real metrics sink (StatsD, Prometheus, or the platform's existing observability stack) so we can graph p50/p95 latency, payload size buckets, and stale-duration over time.

**Why deferred:** the log-line shape captures every signal we need; aggregation can happen at the log-pipeline layer until volumes justify a dedicated metrics path. The signals exist now — only their visualization is pending.

**Depends on:** Phase 7.1 shipped (it is); platform-level metrics infra decision.

**Revisit when:** we make the SSE upgrade decision (D3) and need historical p95 / payload-size data to justify the trigger.

**Implementation sketch:**
- Wrap `lib/thesis/observability.ts#logReaderPoll` with a metric emitter behind a feature flag.
- Add a Grafana/observability dashboard pinning p50/p95 `latencyMs`, `payloadBytes` histogram, and `staleMs` distribution per endpoint.
