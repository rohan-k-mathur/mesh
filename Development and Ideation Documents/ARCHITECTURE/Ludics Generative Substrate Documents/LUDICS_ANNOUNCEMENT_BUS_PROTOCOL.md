# LUDICS Announcement Bus — Protocol Spec (WS-5a)

**Status:** Accepted v0.2 · prereq for WS-5b (bus implementation)
**Scope unit:** `deliberationId` (per WS-0 tenant audit, 2026-05-22)
**Companion docs:** `LUDICS_V2_SPRINT_PLAN.md` · `tenant-scope-audit-2026-05-22.md`

> **v0.2 changelog (2026-05-22):** transport switched from Upstash Redis
> Streams (§5) to BullMQ pub-sub on the existing ioredis `connection` from
> `lib/queue.ts`. Rationale + rejected-alternatives table updated in §5.
> Subscriber roster (§7) scoped down to **audit-log only in v0**; UI / MCP
> push / external webhooks moved to deferred-subscriber TODOs in §7.1. See
> §11 for full reconciliation notes.

---

## 1. Motivation

Round 9 shipped four substrate-level announcements as `console.info` side
effects inside the write seams:

| Code | Event           | Emitted from                              |
| ---- | --------------- | ----------------------------------------- |
| A1   | `witness_committed` | `bindParticipantToDesign` (iota write)    |
| A2   | `design_revealed`   | first reveal of a Design in a deliberation |
| A3   | `witness_contested` | contest write seam                        |
| A4   | `witness_rescinded` | `fossilize` / `fossilizeByArgument`       |

These need to leave stdout and become a first-class, durable, replayable
event stream so the dialectical UI, MCP push channel, audit log, and
external webhooks can subscribe without re-reading the DB.

## 2. Event envelope (Zod-validated)

```ts
const AnnouncementEnvelope = z.object({
  eventId:           z.string().uuid(),         // server-generated
  eventType:         z.enum([
    "witness_committed",   // A1
    "design_revealed",     // A2
    "witness_contested",   // A3
    "witness_rescinded",   // A4
  ]),
  version:           z.literal(1),
  scopeId:           z.string(),                // = deliberationId (WS-0)
  actorParticipantId: z.string().nullable(),    // null for system fossils
  subjectId:         z.string(),                // witnessId | designId
  occurredAt:        z.string().datetime(),     // ISO-8601, server clock
  payload:           z.record(z.unknown()),     // event-specific, see §4
});
```

**No `tenantId` field.** Per WS-0, `scopeId === deliberationId` for v2;
when a `Workspace` axis is added, an additive `workspaceId?` field is
permitted but `scopeId` retains its semantic.

## 3. Delivery semantics

- **At-least-once.** Subscribers must be idempotent.
- **Idempotency key:** `(eventType, subjectId, occurredAt)`.
  - `subjectId` collisions across event types are tolerated because the
    tuple includes `eventType`.
  - `occurredAt` is the producer-side wall clock at write-seam commit
    (NOT the bus-arrival time).
- **Ordering:** per-`scopeId` FIFO within a single producer process;
  cross-process ordering is best-effort. Subscribers that need a strict
  per-scope order must dedupe + reorder by `occurredAt` within a small
  window (recommended: 2s).

## 4. Per-event payload schemas

| Event             | Payload fields                                            |
| ----------------- | --------------------------------------------------------- |
| `witness_committed` | `{ witnessId, designId, ludicMoveId, schemeKey, polarity }` |
| `design_revealed`   | `{ designId, locusPath, behaviourId }`                    |
| `witness_contested` | `{ witnessId, contestId, contestKind }`                   |
| `witness_rescinded` | `{ witnessId, retractLayer, retractReason }`              |

`retractLayer` ∈ `argument_superseded | locus_deleted | design_excised | manual_retract` (matches `phase2d-fossil-lifecycle` invariants).

## 5. Transport — BullMQ pub-sub

**Decision (v0.2):** BullMQ on the existing ioredis `connection` from
[lib/queue.ts](../../../lib/queue.ts). Postgres `SubstrateAnnouncement`
row is the source of truth; the queue is only the wake-up signal.

### 5.1 Queue layout

```ts
// lib/queue.ts (additive)
export const substrateAnnouncementQueue = new Queue(
  "substrate-announcement",
  { connection },
);
```

- One queue: `substrate-announcement`.
- Job name: the `eventId` (cuid). Job data: the bare envelope.
- Default job opts: `{ attempts: 5, backoff: { type: "exponential", delay: 1000 }, removeOnComplete: 1000, removeOnFail: 1000 }`.
- Worker: [workers/ludics/announcementDispatcher.ts](../../../workers/ludics/announcementDispatcher.ts) (registered via top-level `import` in `workers/index.ts`, per the `workers/reembed.ts` self-register pattern).

### 5.2 Producer flow (`publish`)

1. Generate `eventId = cuid()`.
2. `prisma.substrateAnnouncement.create({ data: envelope })`.
   - On `P2002` (duplicate `(eventType, subjectId, occurredAt)`): swallow,
     log at `debug`, return ok. Makes `publish` idempotent without caller
     cooperation.
3. `substrateAnnouncementQueue.add(eventId, envelope, jobOpts)`.
4. If step 3 throws, the row is still persisted — the dispatcher's
   `replayUndelivered()` sweep (§6.1) picks it up on the next worker tick.

### 5.3 Failure semantics

- **Producer-side:** if `prisma.create` throws (non-P2002), the producer
  call throws. Callers that publish from within a request handler MUST
  wrap in `try/catch` at the seam and log — bus failures MUST NOT fail
  the user-facing operation. (See §8 emit-site checklist.)
- **Worker-side:** BullMQ default retries (5 attempts, exponential).
  On terminal failure the job moves to BullMQ's failed-jobs registry;
  `SubstrateAnnouncement.deliveredAt` remains `null`. Replay sweep
  picks them up.

### 5.4 Rejected alternatives

| Option | Why rejected for v0 |
| ------ | ------------------- |
| **Postgres LISTEN/NOTIFY** | 8 KB payload cap; same-region only; no built-in retry; weak reconnection semantics. |
| **Upstash Redis Streams (REST)** — *was v0.1 default* | Adds a new client surface (`XADD`/`XREADGROUP` over REST) the repo does not yet exercise for delivery. The v0.1 rationale cited consumer-group per-subscriber cursors — but v0 ships with **one** subscriber (audit log, §7), so cursors are not needed yet. Reconsider when subscriber count grows past two and per-subscriber retention diverges. Tracked as **TODO[BUS.STREAMS-UPGRADE]** in §7.1. |
| **BullMQ pub-sub (selected)** | Reuses `lib/queue.ts` `connection`; mirrors `workers/reembed.ts` worker pattern; built-in retries + DLQ; ordering caveat acceptable because subscribers sort by `occurredAt` (§3). |

### 5.5 Ordering caveat

BullMQ does not guarantee per-`(eventType, subjectId)` ordering across
worker concurrency. Subscribers that require ordering MUST sort by
`occurredAt` server-side; the audit-log subscriber in v0 does not
require ordering.

## 6. Persistence (audit + replay)

New Prisma model (WS-5b, NOT in this doc's scope to add):

```prisma
model SubstrateAnnouncement {
  id                 String   @id @default(cuid())
  eventId            String   @unique
  eventType          String
  version            Int      @default(1)
  scopeId            String
  actorParticipantId String?
  subjectId          String
  occurredAt         DateTime
  insertedAt         DateTime @default(now())
  payload            Json

  @@index([scopeId, occurredAt(sort: Desc)])
  @@index([subjectId])
  @@index([eventType, occurredAt(sort: Desc)])
}
```

Write order: **DB insert first, BullMQ `queue.add` second**, both AFTER
the write-seam transaction commits (post-`$transaction`, post-idempotency
check — see §8). If the queue enqueue fails, a periodic sweeper
(`replayUndelivered()`) republishes rows where `deliveredAt IS NULL AND occurredAt < now() - interval '5 minutes'`. DB is the source of truth;
the bus is the delivery channel.

### 6.1 Replay / undelivered sweep

The dispatcher exposes a `replayUndelivered()` helper. Scheduling it on
a cron is **out of scope for v0** — the helper exists and can be called
from a future cron route, but no scheduler wires it up yet. Tracked as
**TODO[BUS.SWEEP-CRON]** in §7.1.

## 7. Subscriber roster

### 7.0 v0 ships with **one** subscriber: audit log

[workers/ludics/announcementDispatcher.ts](../../../workers/ludics/announcementDispatcher.ts)
is both the BullMQ worker AND the v0 audit-log subscriber. On each job
it:

1. Re-validates the envelope with `AnnouncementEnvelope.parse(...)`.
2. Calls `console.info({ event: "substrate_announcement", ...envelope })`.
3. Updates `SubstrateAnnouncement.deliveredAt = new Date()`.

Retry policy comes from BullMQ job opts (§5.1): 5 attempts, exponential
backoff. Terminal failures land in BullMQ's failed-jobs registry; the
replay sweep (§6.1) re-enqueues them.

**The `console.info` from `app/api/v3/ludics/retract-witness/route.ts`
(`event: "witness_rescinded"`) is retained in addition to the bus emit.**
This is a deliberate dual-emit during the transition window:

- Regression-proofs [__tests__/invariants/phase2d-fossil-lifecycle.test.ts](../../../__tests__/invariants/phase2d-fossil-lifecycle.test.ts) T13/T13b, which assert on the route's `console.info`.
- Sprint-plan acceptance gate is satisfied literally without test churn.
- Cleanup tracked as **TODO[BUS.AUDIT-CONSOLE-REMOVAL]** below.

### 7.1 Deferred subscribers + cleanup TODOs (NOT in v0)

These are **not** shipped in v0 but the protocol is sized to accept them
without breaking changes. Each is a separate workstream.

| ID | Description | Open questions to resolve when picking up |
| -- | ----------- | ----------------------------------------- |
| **TODO[BUS.UI-PUSH]** | Dialectical-layer UI push (SSE or WebSocket). Per-`deliberationId` filter. | Auth boundary: re-use the WS-3 scoped JWT? SSE vs WS for our edge runtime? |
| **TODO[BUS.MCP-PUSH]** | MCP push channel: subscriber turns envelopes into MCP notifications. | Per-connection filter granularity; MCP back-pressure semantics. |
| **TODO[BUS.WEBHOOKS]** | External webhooks: per-subscriber URL registry, signing (HMAC), per-subscriber retry+DLQ. | Subscriber registry schema; secret rotation; rate-limit policy per URL. |
| **TODO[BUS.STREAMS-UPGRADE]** | If subscriber count grows past two AND per-subscriber retention/replay diverges, revisit Upstash Redis Streams (the v0.1 design). | When does consumer-group cursor management actually pay for the new client surface? |
| **TODO[BUS.SWEEP-CRON]** | Schedule `replayUndelivered()` on a cron route under `app/api/_cron/`. | Cadence (1m? 5m?); upper bound on sweep batch size. |
| **TODO[BUS.AUDIT-SPLIT]** | Move the audit-log subscriber out of the dispatcher into its own subscriber module once a second subscriber lands (avoids dispatcher fan-out becoming a god module). | Subscriber registration API. |
| **TODO[BUS.AUDIT-CONSOLE-REMOVAL]** | Remove the route-level `console.info` in `retract-witness/route.ts` and migrate phase2d T13/T13b to spy on `publish(...)` instead. Slated for **v2.5 cutover** alongside the legacy MCP bearer removal. | None — purely a test refactor. |
| **TODO[BUS.A3-EMIT]** | Add A3 `witness_contested` emit at the contest write seam when the challenge layer lands. | Locate write seam; payload shape per §4. |

## 8. Producer integration points (WS-5b refactor)

The `publishAnnouncement(env)` helper lives in
[lib/ludics/announcementBus.ts](../../../lib/ludics/announcementBus.ts) and:

1. Validates `env` against `AnnouncementEnvelope` (throws on failure —
   never silently drops).
2. Writes the `SubstrateAnnouncement` row (P2002 swallowed per §5.2).
3. `substrateAnnouncementQueue.add(eventId, env, jobOpts)`.
4. Returns `{ ok: true, eventId }` on success.

Each producer site MUST:

1. Compute `occurredAt` from the canonical action timestamp, not
   `new Date()` at the publish site. This keeps the idempotency triple
   `(eventType, subjectId, occurredAt)` stable across re-emits.
2. Call `publish(...)` AFTER the persistence boundary (post-`$transaction`, post-idempotency-check).
3. Wrap the `publish(...)` call in `try/catch`; log on failure; never
   let bus failures fail the user-facing operation.
4. Pass `scopeId` (= `deliberationId`) explicitly; if unavailable at
   the site, lift it.

Call sites:
- A1 `witness_committed`: [server/ludics/bindParticipantToDesign.ts](../../../server/ludics/bindParticipantToDesign.ts) — emit after `const witness = await prisma.$transaction(...)`. `occurredAt = witness.timestamp.toISOString()`.
- A2 `design_revealed`: [server/ludics/synthesisProposalAgent.ts](../../../server/ludics/synthesisProposalAgent.ts) — emit after `const witness = await createWitnessRecord(...)`, BEFORE the fresh-commit return. NOT on the idempotent `existing` branch.
- A3 `witness_contested`: deferred (TODO[BUS.A3-EMIT] in §7.1).
- A4 `witness_rescinded`: [app/api/v3/ludics/retract-witness/route.ts](../../../app/api/v3/ludics/retract-witness/route.ts) — emit after the existing `console.info(...)` and BEFORE the response. Keep the `console.info` (see §7.0 dual-emit). `occurredAt = result.fossilizedAt.toISOString()`.

## 9. Backwards compatibility

Round 9's `console.info` lines stay in place during v2.0 (mirror mode
for `witness_rescinded`; see §7.0). Removed at v2.5 alongside the legacy
MCP bearer — see **TODO[BUS.AUDIT-CONSOLE-REMOVAL]** in §7.1.

## 10. Open questions (resolve in WS-5b or later)

- **OQ-Bus-1:** Per-scope retention horizon. Default proposal:
  indefinite in `SubstrateAnnouncement`; BullMQ `removeOnComplete: 1000`
  / `removeOnFail: 1000` for the queue.
- **OQ-Bus-3:** Schema-evolution policy — do we bump `version` per event
  type independently, or globally? v0 ships `version: 1` globally.
- **OQ-Bus-4:** Whether `witness_contested` should carry the full
  contest payload or just the FK (current spec: FK only, payload
  fetched lazily). Resolves when **TODO[BUS.A3-EMIT]** is picked up.
- ~~**OQ-Bus-2:** Cross-region replication strategy when we add a second
  Upstash region.~~ — moot under BullMQ; revisit only if
  **TODO[BUS.STREAMS-UPGRADE]** fires.

## 11. Reconciliation notes (v0.1 → v0.2)

- **Transport:** v0.1 chose Upstash Redis Streams. v0.2 switches to
  BullMQ pub-sub. The v0.1 rejection of BullMQ ("no persistent log;
  subscribers offline at publish time lose the event") is nullified by
  the DB-first architecture both designs share — offline subscribers
  replay from `SubstrateAnnouncement` via `replayUndelivered()` (§6.1).
  BullMQ wins on already-in-stack vs new client surface.
- **Subscribers:** v0.1 listed 4 baseline subscribers. v0.2 ships only
  audit-log; UI / MCP / webhooks move to §7.1 TODOs with explicit
  open-questions sections so future workstreams have a starting point.
- **Schema:** unchanged from v0.1 §6 except dropping the
  Redis-streams-specific `bus:announce:*` key references in prose.
- **Envelope:** unchanged from v0.1 §2. Field names (`scopeId`,
  `actorParticipantId`, `subjectId`, `occurredAt`, `payload`, `version`)
  are preserved — no envelope churn between v0.1 and v0.2.

---

**Exit criterion for WS-5a:** this doc accepted; ready to start WS-5b
(implementation + Prisma model + test suite).
