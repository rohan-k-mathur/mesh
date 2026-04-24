# Scope B Hand-off Contract

**Status:** Draft 1.0 (April 2026, accompanies Scope C Phase C4)
**Owner:** Facilitation team
**Consumers:** Scope B (Disagreement Typology) — additional consumers will be added by name as they subscribe.

---

## 1. Purpose

Scope C produces three durable artifacts that Scope B consumes:

1. **Hash-chained `FacilitationEvent` log** per session (real-time stream).
2. **Canonical session export** (offline / archival).
3. **Cross-deliberation analytics rollup** (aggregate context).

This document is the contract for those artifacts. Scope C MUST NOT introduce
Scope B-specific fields; Scope B builds its own subscriber and adapter layer
on top of the shapes documented here.

---

## 2. Event stream contract

### 2.1 Subscribe

In-process subscribers register via:

```ts
import { subscribeFacilitationEvents } from "@/lib/facilitation/eventBus";
import { FacilitationEventType } from "@/lib/facilitation/types";

subscribeFacilitationEvents(
  "scope-b/typology-seeder",
  async ({ event }) => {
    // event is a Prisma FacilitationEvent row
  },
  {
    eventTypes: [
      FacilitationEventType.INTERVENTION_APPLIED,
      FacilitationEventType.METRIC_THRESHOLD_CROSSED,
    ],
  },
);
```

Subscribers are keyed by name; re-registering with the same name replaces the
previous registration (HMR / test friendly).

### 2.2 Delivery semantics

| Property              | Value                                                                                  |
| --------------------- | -------------------------------------------------------------------------------------- |
| Ordering              | Per-process, in registration order.                                                    |
| Cardinality           | At-most-once. No replay buffer.                                                        |
| Failure policy        | Subscriber errors are caught and logged. They never propagate to the write path.       |
| Transactional safety  | Best-effort. Publish fires after `appendEvent` returns; if a parent transaction rolls back, subscribers may observe a "ghost" event. |
| Replay                | Pull from `GET /api/facilitation/sessions/:id/events` (paginated). Authoritative.      |

**Subscribers MUST be defensive:**

- Idempotent on `event.id`.
- Treat the published row as eventually consistent — re-read by id when authoritative state matters.
- Never rely on inter-event ordering across sessions; only intra-session ordering is preserved by the hash chain.

### 2.3 Envelope shape

```ts
interface FacilitationEventEnvelope {
  schemaVersion: "1.0.0";
  publishedAt: Date;
  event: PrismaFacilitationEvent; // see lib/models/schema.prisma
}
```

Field additions are non-breaking. Field removals/renames bump the major
version of `schemaVersion` and require coordinated subscriber updates.

### 2.4 Event types Scope B subscribes to (v1)

| Event                        | Trigger                                        | Why Scope B cares                              |
| ---------------------------- | ---------------------------------------------- | ---------------------------------------------- |
| `INTERVENTION_APPLIED`       | Facilitator applies a recommendation.          | Seeds disagreement-typology candidates from the underlying `targetType`/`targetId`. |
| `METRIC_THRESHOLD_CROSSED`   | Equity metric crosses warn/alert threshold.    | Flags sessions where structural imbalance may indicate a typology axis worth labeling. |

Other event types (`SESSION_OPENED`, handoff events, etc.) are still
delivered to subscribers if they did not pass `eventTypes`. The filter is
opt-in.

---

## 3. Canonical export

`GET /api/facilitation/sessions/:id/export` returns a versioned JSON
envelope:

```ts
interface CanonicalFacilitationExport {
  schemaVersion: "1.0.0"; // semver — major bump = breaking
  generator: "mesh-facilitation";
  generatedAt: string;    // ISO-8601
  session: { /* … */ };
  questions: Array<{ /* … */ }>;
  interventions: Array<{ /* … */ }>;
  metricSnapshots: Array<{ /* … */ }>;
  events: Array<{ /* full chain */ }>;
  hashChain: { valid; failedIndex?; eventCount; firstHash; lastHash };
  rollup: FacilitationReport;
}
```

**Compatibility rules:**

- Adding optional fields → non-breaking.
- Removing or renaming any field → breaking; bump major.
- Reordering fields → non-breaking. Consumers MUST parse by name.
- All time values are ISO-8601 strings (UTC).

Access:

- Facilitator/host of the deliberation: always.
- Anonymous: only when the session has `isPublic = true`.

The export is suitable for offline hash-chain re-verification using the
same `computeEventHash` algorithm in `lib/pathways/hashChain.ts`.

---

## 4. Cross-deliberation analytics

`GET /api/deliberations/:id/facilitation/analytics` returns the rollup
described in `lib/facilitation/analyticsService.ts`. Scope B should treat
this as advisory context — it is recomputed on each request and is not
hash-attested.

---

## 5. Versioning policy

| Surface                          | Version field                       | Bump trigger                     |
| -------------------------------- | ----------------------------------- | -------------------------------- |
| Event bus envelope               | `schemaVersion` in envelope         | Removal/rename in `event` row    |
| Canonical export                 | `schemaVersion` at root             | Removal/rename of any top-level field or row field |
| Analytics rollup                 | _unversioned_                        | Soft-versioned; additive only    |
| Hash-chain algorithm             | `lib/pathways/hashChain.ts` impl    | Coordinated across A + C         |

When breaking a published surface, Scope C MUST:

1. Open a tracking issue tagged `scope-handoff-break`.
2. Notify named subscribers (currently: Scope B) at least one release in advance.
3. Ship the breaking change behind a feature flag where feasible.

---

## 6. Out of scope

The following are explicitly NOT part of this contract:

- **Cross-process delivery.** The event bus is in-process. Cross-process
  fan-out is each subscriber's responsibility (BullMQ, Redis pub/sub, etc.).
- **Webhook delivery to external systems.** Future addition; would live
  alongside the bus, not replace it.
- **PDF / human-readable export.** The HTML report
  (`app/deliberations/[id]/facilitation/report/page.tsx`) is the canonical
  human view; PDF is deferred until a partner requires it.
- **Scope-B-specific schema.** Disagreement-typology types live in Scope B.
  Scope C never imports from Scope B.

---

## 7. Reference files

- `lib/facilitation/eventBus.ts` — subscribe / publish.
- `lib/facilitation/exportService.ts` — canonical export builder.
- `lib/facilitation/analyticsService.ts` — deliberation rollup.
- `lib/facilitation/reportService.ts` — per-session rollup.
- `lib/facilitation/types.ts` — event / kind enums.
- `lib/models/schema.prisma` — authoritative row shapes.
