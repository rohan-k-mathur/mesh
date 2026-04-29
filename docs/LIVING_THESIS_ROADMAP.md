# Living Thesis — Development Roadmap

**Status:** Phase 7 complete → Living Thesis V1 shipped (D1–D7 tracked in [LIVING_THESIS_DEFERRED.md](LIVING_THESIS_DEFERRED.md))
**Owner:** Thesis system
**Source vision:** [LIVING_THESIS_FEATURE_DESCRIPTION.md](LIVING_THESIS_FEATURE_DESCRIPTION.md)
**Related:** [../THESIS_ENHANCEMENT_ROADMAP.md](../THESIS_ENHANCEMENT_ROADMAP.md), [../THESIS_ARGUMENTCHAIN_INTEGRATION_ANALYSIS.md](../THESIS_ARGUMENTCHAIN_INTEGRATION_ANALYSIS.md)
**Deferred items:** [LIVING_THESIS_DEFERRED.md](LIVING_THESIS_DEFERRED.md)

---

## Goal

Close the gap between today's static thesis (TipTap document with publish-time snapshot attrs on embedded objects) and the Living Thesis vision: a hypertextual, continuously-updating surface onto the underlying deliberation graph where every claim, argument, attack, and aggregate metric is live, inspectable, and challengeable.

## Decisions locked in

1. **Audience priority:** policy / pragmatics first. Attack register and confidence audit ship before chain embedding.
2. **Live-update transport:** SWR polling against a single batched `/live` endpoint. Designed to be swappable to SSE/WebSocket later (see deferred D3).
3. **Snapshots:** user-triggered only. Background / auto-snapshot workers deferred (D1).
4. **Deep links:** existing internal moid/urn ids only. User-facing canonical URLs and embeddable widgets deferred (D2).

## Current state (baseline)

- **Schema:** `Thesis`, `ThesisProng`, `ThesisProngArgument`, `ThesisSection` exist. No `ThesisSnapshot`, `ThesisPublishedObject`, `ThesisChainReference`, `ThesisConfidence`.
- **API:** CRUD + `/publish` + `/export` exist. No `/live`, `/inspect`, `/attacks`, `/confidence`, `/snapshots`.
- **Components:** [ThesisEditor.tsx](../components/thesis/ThesisEditor.tsx), [ThesisRenderer.tsx](../components/thesis/ThesisRenderer.tsx), [ThesisComposer.tsx](../components/thesis/ThesisComposer.tsx), [view/page.tsx](../app/deliberations/[id]/thesis/[thesisId]/view/page.tsx).
- **TipTap nodes:** [claim-node.tsx](../lib/tiptap/extensions/claim-node.tsx), [argument-node.tsx](../lib/tiptap/extensions/argument-node.tsx), [proposition-node.tsx](../lib/tiptap/extensions/proposition-node.tsx), [citation-node.tsx](../lib/tiptap/extensions/citation-node.tsx), [theorywork-node.tsx](../lib/tiptap/extensions/theorywork-node.tsx). All currently render frozen `attrs`.

---

## Phase 1 — Live binding foundation

**Why first:** every later phase depends on a live data channel from deliberation → thesis page.

### 1.1 Batched live-stats endpoint

- **Path:** `GET /api/thesis/[id]/live`
- **Response shape:**
  ```ts
  {
    cursor: string,             // monotonic; usable later as ?since=
    computedAt: string,
    objects: Record<string, {   // keyed by claimId | argumentId | propositionId
      kind: "claim" | "argument" | "proposition" | "citation",
      label?: "IN" | "OUT" | "UNDEC",
      attackCount: number,
      undefendedAttackCount: number,
      defendedAttackCount: number,
      concededAttackCount: number,
      supportCount: number,
      evidenceCount: number,
      cqSatisfied?: number,
      cqTotal?: number,
      lastChangedAt: string,
      status?: string,          // for propositions: DRAFT/PUBLISHED/CLAIMED
    }>
  }
  ```
- **Implementation:** walk thesis `content` JSON to collect embedded ids; join `ClaimLabel`, `ArgumentEdge` (REBUTS/UNDERCUTS), `CQStatus`, `EvidenceLink`, attack/dispute records. Headers: `Cache-Control: no-store`. Accept `?since=<cursor>` (returns full payload for now; cursor reserved for future delta mode).

### 1.2 `useThesisLive` hook + `ThesisLiveContext`

- **Files:** new `lib/thesis/useThesisLive.ts`, `lib/thesis/ThesisLiveContext.tsx`.
- Single SWR subscription per thesis page. `refreshInterval: 30_000`, `revalidateOnFocus: true`. Bump interval to ~120s when `document.hidden`.
- Per-object lookup: `useThesisLiveObject(id) → LiveStats | undefined`.

### 1.3 Live node bindings

- Retrofit existing TipTap nodes (keep names stable to avoid migrating saved content):
  - [claim-node.tsx](../lib/tiptap/extensions/claim-node.tsx)
  - [argument-node.tsx](../lib/tiptap/extensions/argument-node.tsx)
  - [proposition-node.tsx](../lib/tiptap/extensions/proposition-node.tsx)
  - [citation-node.tsx](../lib/tiptap/extensions/citation-node.tsx)
- In each node view, read live stats from context (fall back to `attrs` when context absent — preserves editor/preview behavior).
- Render: live label dot, attack count badge (red if undefended), evidence count, "updated Xs ago", subtle pulse on change.

### 1.4 View page wiring

- [view/page.tsx](../app/deliberations/[id]/thesis/[thesisId]/view/page.tsx): wrap TipTap render in `<ThesisLiveProvider thesisId>`; render content read-only via the (now live-aware) extensions.
- Composer/editor pages stay non-live (authoring context).

**Exit criteria:** open a published thesis in two tabs; file an attack against an embedded claim from the deliberation; both tabs reflect updated counts and label within ≤30s.

---

## Phase 2 — Inspection drawer

**Why second:** gives every embedded element a single, consistent interaction surface so later phases (attacks, provenance) plug into one component instead of N modals.

### 2.1 `ThesisInspectorDrawer`

- **File:** new `components/thesis/ThesisInspectorDrawer.tsx`.
- Right-side sheet. Tabs:
  - **Overview** — text, scheme, label, author, createdAt, current live stats.
  - **Attacks** — list of attacks against this object with status (defended / undefended / conceded), each linking back to source.
  - **Provenance** — Proposition → Claim → Argument lineage walk (when applicable); shows DialogueMove timeline filtered to this object.
  - **Evidence** — `EvidenceLink` entries with previews.
  - **CQs** (arguments only) — scheme CQs and `CQStatus` answered/unanswered.
  - **History** — created/updated/last-changed timeline.

### 2.2 Element click handlers

- Live nodes dispatch `openInspector({ kind, id })` via `ThesisLiveContext` — no per-node modal logic. Drawer mounts once at the view-page level.

### 2.3 Inspector data endpoint

- `GET /api/thesis/[id]/inspect/[kind]/[objectId]` returning the joined detail blob. Reuses existing per-claim / per-argument detail fetchers where possible. `Cache-Control: no-store`.

**Exit criteria:** every embedded object opens the drawer with at minimum text, label, attack list, evidence count, and lineage to source proposition (when applicable).

---

## Phase 3 — Attack register (policy priority #1)

**Why now:** delivers the "0 undefended attacks isn't an assertion, it's a current state" property from the vision doc.

### 3.1 `ThesisAttackRegister` panel

- **File:** new `components/thesis/ThesisAttackRegister.tsx`.
- Sticky panel on view page (collapsible). Sections: **Undefended** (red), **Defended** (green), **Conceded** (gray).
- Each entry: target object preview, attacker, locution, filed-at; click → scrolls to embedded element + opens inspector on Attacks tab.

### 3.2 Attack-register endpoint

- `GET /api/thesis/[id]/attacks?status=undefended|defended|conceded&since=<cursor>` — server-side filter/sort over Phase 1 data joined with attack records (`ArgumentEdge` UNDERCUTS/REBUTS, dispute records).

### 3.3 "File an attack" inline action

- From inspector Attacks tab → opens existing attack composer prefilled with target.
- Reader must be authed and have permission via `sheaf-acl`. Attack writes to deliberation; surfaces back through the Phase 1 channel on next poll.

### 3.4 Per-element badges

- Live node renders `⚔ N` (red) when `undefendedAttackCount > 0`, else `🛡` (green) when defended attacks exist, else nothing.

**Exit criteria:** an external authed reader can file an attack from the published thesis page; the page's attack register reflects it on next poll; the corresponding embedded element flips to red.

---

## Phase 4 — Confidence audit (policy priority #2)  ✅

**Why now:** delivers the "0.84 isn't asserted — it's inspectable to its computation" property.

**Status:** complete.
- 4.1 ✅ formula in [lib/thesis/confidence.ts](../lib/thesis/confidence.ts) (per-prong + per-thesis, weights sum to 1, level thresholds, pure functions).
- 4.2 ✅ endpoint at [app/api/thesis/[id]/confidence/route.ts](../app/api/thesis/[id]/confidence/route.ts) returning `{ computedAt, overall, prongs }`.
- 4.3 ✅ [components/thesis/ConfidenceBadge.tsx](../components/thesis/ConfidenceBadge.tsx) with hover-card audit popover (formula, each input × weight, contribution bars, deep-link refs via `openInspector`, recompute button, `computed Xs ago`).
- 4.4 ✅ overall badge mounted on [view page](../app/deliberations/[id]/thesis/[thesisId]/view/page.tsx); per-prong badge wired into prong headers in [ThesisRenderer.tsx](../components/thesis/ThesisRenderer.tsx). `useOpenInspector` no-ops outside a `ThesisLiveProvider`, so non-live render contexts stay safe.

---

## Phase 5 — Snapshots (user-triggered only)  ✅

**Why now:** clarifies live-vs-frozen and gives citers a stable reference point. Auto-snapshots deferred (D1).

**Status:** complete.
- 5.1 ✅ `ThesisSnapshot` model added in [lib/models/schema.prisma](../lib/models/schema.prisma) (`@@map("thesis_snapshots")`) with `contentJson`, `statsSnapshot`, `confidenceSnapshot`, `attacksSnapshot`, `parentSnapshotId` self-relation. Run `npx prisma db push` when DB is reachable.
- 5.2 ✅ endpoints: `POST/GET /api/thesis/[id]/snapshots`, `GET /api/thesis/[id]/snapshots/[snapshotId]`, `POST /api/thesis/[id]/snapshots/[snapshotId]/compare?against=<id|live>`. Author-only create; freeze fans out to `/live`, `/confidence`, `/attacks?status=all` payloads.
- 5.3 ✅ [ThesisSnapshotManager](../components/thesis/ThesisSnapshotManager.tsx) panel mounted on view page; frozen snapshot view at [view/snapshot/[snapshotId]/page.tsx](../app/deliberations/[id]/thesis/[thesisId]/view/snapshot/[snapshotId]/page.tsx) renders without `ThesisLiveProvider` and shows a permanent amber "frozen snapshot, not live" banner.
- 5.4 ✅ [ThesisSnapshotDiff](../components/thesis/ThesisSnapshotDiff.tsx) viewer + diff page at [view/snapshot/[snapshotId]/diff/page.tsx](../app/deliberations/[id]/thesis/[thesisId]/view/snapshot/[snapshotId]/diff/page.tsx). Renders per-object stat deltas (added/removed/changed/unchanged), confidence Δ overall + per prong.
- 5.5 ✅ Auto-snapshot deferral noted at top of [snapshots/route.ts](../app/api/thesis/[id]/snapshots/route.ts) (see D1).

---

## Phase 6 — Alternate traversals & provenance hypertext

**Status:** complete.

**Why now:** delivers the "navigable surface, not a linear read" property.

### 6.1 Entry-point routing ✅

- New focus resolver: [GET /api/thesis/[id]/focus](../app/api/thesis/[id]/focus/route.ts) accepts `?ref=<idOrMoid>&hint=<kind?>` and returns `{kind, id}`. Falls back from Claim.moid → direct id lookup across claim/argument/proposition/citation.
- New client handler: [ThesisFocusHandler](../components/thesis/ThesisFocusHandler.tsx) mounted inside `ThesisLiveProvider` in [view/page.tsx](../app/deliberations/[id]/thesis/[thesisId]/view/page.tsx). Reads `?focus=`/`?tab=`/`?hint=`, resolves via the focus endpoint, scrolls the matching `[data-{kind}-id]` node into view, and dispatches `openInspector({kind, id, tab})`. Deduped per signature.
- Exit criteria met: `…/view?focus=<claimMoid>&tab=attacks` lands with the inspector pre-opened on that claim's Attacks tab.

### 6.2 Provenance walks in inspector ✅

- [ObjectRow](../components/thesis/ThesisInspectorDrawer.tsx) extended with optional `onOpen` → renders as an interactive `button` with hover + open chip.
- [ProvenanceTab](../components/thesis/ThesisInspectorDrawer.tsx) wires every lineage entry (sourceProposition, promotedClaim, conclusion, premises, asConclusionOf, asPremiseIn) to `useOpenInspector()` so users can walk claim ↔ proposition ↔ argument lineage with single clicks. No new endpoints — reuses Phase 2 inspect data.

### 6.3 "Used in" backlinks ✅

- New endpoint [GET /api/objects/[kind]/[id]/backlinks](../app/api/objects/[kind]/[id]/backlinks/route.ts) returns:
  - `theses`: rows whose `thesisClaimId`/`prong.mainClaimId`/`prong.arguments.argumentId` matches, plus a content-walk fallback that scans `thesis.content` JSON via `collectEmbeddedObjects` for embedded refs.
  - `arguments`: claims-only — returns arguments where the object is `conclusion` or a `premise.claim`.
  - `claims`: propositions-only — returns the promoted claim (via `Proposition.promotedClaimId`).
- ProvenanceTab loads backlinks lazily via SWR (30s dedupe) and renders a new "Used in" footer section with thesis cards (deep-link to `/deliberations/[id]/thesis/[thesisId]/view`) and click-to-open argument/claim rows.

**Deferred:**

- Hash anchors per prong/section: not needed for the journalist exit-criteria flow; `?focus=` already covers stable deep-linking. Add later if requested for in-page navigation.
- Server-side MOID expansion to argument/proposition/citation: only Claim has `moid` today; revisit if other models grow stable external ids.

---

## Phase 7 — Hardening & doc ✅ complete

### 7.1 Polling instrumentation ✅

- [observability.ts](../lib/thesis/observability.ts) emits a single structured `console.info` line (`thesis.reader.poll`) per reader request with `endpoint`, `thesisId`, `latencyMs`, `payloadBytes`, `objectCount`, `staleMs`, `cursor`, `status`, `requestId`.
- Wired into `/live`, `/attacks`, `/confidence`, `/inspect/[kind]/[objectId]`.
- These signals gate the SSE/WS upgrade decision (D3). Promotion to a real metrics sink is tracked as **D7**.

### 7.2 Permissions audit ✅

- [permissions.ts](../lib/thesis/permissions.ts) exposes `checkThesisReadable`, `checkThesisWritable`, `filterReadableTheses`.
- Read rule: author OR `status === "PUBLISHED"` OR deliberation participant (via [`isDeliberationParticipant`](../lib/cqs/permissions.ts)).
- Wired into every Phase 1–6 reader endpoint (`/live`, `/attacks`, `/confidence`, `/inspect`, `/focus`, `/snapshots GET`).
- Cross-thesis [`/api/objects/[kind]/[id]/backlinks`](../app/api/objects/[kind]/[id]/backlinks/route.ts) redacts draft theses by other authors that the caller cannot see.
- `packages/sheaf-acl` was reviewed and intentionally **not used** here — it models per-message audience selectors, not deliberation membership.

### 7.3 Vision-doc status appendix ✅

- Appendix A added to [LIVING_THESIS_FEATURE_DESCRIPTION.md](LIVING_THESIS_FEATURE_DESCRIPTION.md) mapping every vision claim → shipped phase or deferred ID.

### 7.4 Deferred ledger current ✅

- [LIVING_THESIS_DEFERRED.md](LIVING_THESIS_DEFERRED.md) now tracks **D1–D7**: D1 auto-snapshots, D2 canonical URLs, D3 SSE/WS, D4 chain embedding, **D5** hash-anchor scrolling, **D6** MOID expansion to non-Claim objects, **D7** structured metric emission.

---

## Sequencing summary

```
Phase 1  Live binding         (foundation; everything depends on /live)
Phase 2  Inspection drawer    (single interaction surface)
Phase 3  Attack register      ← policy/pragmatics priority #1
Phase 4  Confidence audit     ← policy/pragmatics priority #2
Phase 5  Snapshots (manual)
Phase 6  Traversals & provenance hypertext
Phase 7  Hardening & doc
─────────
Deferred (see LIVING_THESIS_DEFERRED.md):
  D1  Auto-snapshot background workers
  D2  Canonical user-facing deep-link URLs + embeddable widget
  D3  SSE/WebSocket transport upgrade
  D4  Chain embedding + enabler panel + justification + reconstruction versioning
  D5  Hash-anchor scrolling for embedded objects
  D6  MOID expansion to non-Claim objects
  D7  Structured metric emission (replace console.info lines)
```

## Status tracker

| Phase | Status | Notes |
|---|---|---|
| 1. Live binding | ✅ complete | 1.1 endpoint, 1.2 context/hook, 1.3 four nodes retrofitted, 1.4 view page swapped from hand-rolled renderer to `ThesisLiveContent` (real TipTap, read-only) |
| &nbsp;&nbsp;1.1 `/api/thesis/[id]/live` | ✅ shipped | [route.ts](../app/api/thesis/[id]/live/route.ts); batched stats, `?since=` reserved for delta mode |
| &nbsp;&nbsp;1.2 `ThesisLiveContext` + hooks | ✅ shipped | [ThesisLiveContext.tsx](../lib/thesis/ThesisLiveContext.tsx); SWR 30s active / 120s hidden; inspector pub/sub channel ready for Phase 2 |
| &nbsp;&nbsp;1.3 Live node bindings | ✅ shipped | [LiveBadgeStrip.tsx](../lib/thesis/LiveBadgeStrip.tsx) + retrofits in claim/argument/proposition/citation node views; pulse on change; click → `openInspector` |
| &nbsp;&nbsp;1.4 View page wiring | ✅ shipped | [ThesisLiveContent.tsx](../components/thesis/ThesisLiveContent.tsx) replaces hand-rolled `ContentNode` renderer in [view/page.tsx](../app/deliberations/[id]/thesis/[thesisId]/view/page.tsx); page wrapped in `<ThesisLiveProvider>` |
| 2. Inspection drawer | ✅ complete | [ThesisInspectorDrawer.tsx](../components/thesis/ThesisInspectorDrawer.tsx) subscribes to live pub/sub; tabs: Overview / Attacks / Provenance / Evidence / CQs (History deferred). Endpoint at [inspect route](../app/api/thesis/[id]/inspect/[kind]/[objectId]/route.ts); right-side `<Sheet>` mounted once at view-page level |
| 3. Attack register | ✅ complete | [ThesisAttackRegister.tsx](../components/thesis/ThesisAttackRegister.tsx) sticky panel under thesis content; SWR-polled [register endpoint](../app/api/thesis/[id]/attacks/route.ts) groups undefended/defended (conceded reserved). Inline `FileAttackForm` in inspector Attacks tab posts to `/api/claims` + `/api/attacks` (REBUTS/UNDERMINES/UNDERCUTS for claim targets); arg targets deferred. Per-element badges from Phase 1.3 cover 3.4 |
| 4. Confidence audit | ✅ complete | policy priority #2 |
| 5. Snapshots (manual) | ✅ complete | manual capture + diff against live or other snapshot |
| 6. Traversals & provenance | ✅ complete | prong outline, used-in backlinks, provenance lineage, deep-link `?focus=&tab=&hint=` |
| 7. Hardening & doc | ✅ complete | 7.1 reader-poll instrumentation, 7.2 read/write permission gates wired into every reader endpoint + backlinks redaction, 7.3 vision-doc Appendix A, 7.4 deferred ledger D5–D7 added |
