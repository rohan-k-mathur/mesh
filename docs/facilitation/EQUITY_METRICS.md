# Facilitation — Equity Metric Specifications (v1)

Status: Draft v0.1 (C0 deliverable)
Parent: [docs/DelibDemocracyScopeC_Roadmap.md](../DelibDemocracyScopeC_Roadmap.md)
Schema: [docs/facilitation/MIGRATION_DRAFT.md](MIGRATION_DRAFT.md) — `EquityMetricSnapshot`

## Conventions

- Every metric is a **pure function** `(events, window) → { value: number, breakdown: object }`.
- Calculators live in `lib/facilitation/metrics/<metricKind>.ts`.
- Each metric pins its `metricVersion` (decision #3); a behaviour change → version bump → old snapshots interpreted at their original version forever.
- All calculators are deterministic (no `Date.now()`, no `Math.random`); time is always passed in via the `window` argument.
- Breakdown JSON is documented per metric below; each metric ships with a JSON schema in `lib/facilitation/metrics/schemas/`.
- All counts and shares are computed over events whose `createdAt ∈ [windowStart, windowEnd)` unless stated.
- "Author" means `auth_id` of the participant.

## Common types

```ts
type Window = { start: Date; end: Date }; // half-open [start, end)

type EquityCalculator = (input: {
  events: DeliberationEventStream;
  enrolledAuthIds: string[]; // participants known to be in the room
  window: Window;
  thresholds?: Record<string, number>; // per-deliberation overrides
}) => { value: number; breakdown: object };
```

`DeliberationEventStream` exposes typed accessors over the existing tables:

```ts
events.messages(window): { authorId, createdAt }[]
events.arguments(window): { authorId, createdAt, claimId? }[]
events.attacks(window):   { fromAuthorId, fromAuthorTargetClaimId, createdAt }[]
events.supports(window):  { fromAuthorId, fromAuthorTargetClaimId, createdAt }[]
events.repliesTo(claimId, window): { authorId, createdAt }[]
events.claims(window): { id, authorId, createdAt, supportCount, citationCount }[]
events.interventions(sessionId): FacilitationIntervention[]
```

---

## 1) `PARTICIPATION_GINI`  (v1)

### Intent
Quantify how unequally contributions are distributed across enrolled participants. 0 = perfect equality (everyone contributes the same); 1 = one person does everything.

### Inputs
- `messages(window)` ∪ `arguments(window)` — combined contribution stream.
- `enrolledAuthIds` — denominator population.

### Formula
For per-author contribution counts `c[1..n]` (including a `0` for every enrolled participant who didn't contribute in the window):

```
sortedAsc(c)
G = ( Σ_i (2i − n − 1) · c[i] ) / ( n · Σ_i c[i] )
```

Standard Gini coefficient on counts. Range `[0, 1]`. Rounded to 6 decimal places.

### Edge cases
| Case | Behaviour |
|------|-----------|
| `enrolledAuthIds.length < 2` | Return `value = 0`, `breakdown.degenerate = "fewer-than-2-enrolled"`. Rules engine treats degenerate metrics as "no signal". |
| `Σc = 0` (no contributions in window) | Return `value = 0`, `breakdown.degenerate = "no-contributions-in-window"`. |
| Author appears in stream but not in `enrolledAuthIds` | Add them to the population (they self-enrolled by speaking). Record under `breakdown.implicitEnrollments`. |

### Breakdown shape
```json
{
  "n": 12,
  "totalContributions": 47,
  "topAuthorShare": 0.34,
  "silentEnrolled": 5,
  "implicitEnrollments": ["auth_…"],
  "thresholds": { "warn": 0.5, "block": 0.65 }
}
```

### Default thresholds (override per deliberation)
- WARN: `0.50`
- BLOCK (rule-firing): `0.65`

### Fixtures
- `tests/facilitation/fixtures/gini_uniform.json` → expected `0.0`
- `tests/facilitation/fixtures/gini_one_speaker.json` → expected `1.0`
- `tests/facilitation/fixtures/gini_skewed.json` → expected `0.683421` (golden-master)
- `tests/facilitation/fixtures/gini_no_contributions.json` → expected degenerate

---

## 2) `CHALLENGE_CONCENTRATION`  (v1)

### Intent
Measure whether challenges (attacks) are dominated by a small group of accounts. Symptom of monopolized critique.

### Inputs
- `attacks(window)` — incoming challenge edges.

### Formula
1. Count attacks per `fromAuthorId` in window → `c[author]`.
2. Sort authors by count descending.
3. Take the top `k` accounts where `k = max(1, ceil(0.20 · uniqueAttackers))` (top quintile).
4. `value = sum(c[top-k]) / sum(c[all])`.

Range `[0, 1]`. 1.0 = top quintile produced 100% of challenges; lower is more distributed.

### Edge cases
| Case | Behaviour |
|------|-----------|
| `attacks(window).length = 0` | `value = 0`, `breakdown.degenerate = "no-challenges-in-window"`. |
| `uniqueAttackers = 1` | `value = 1.0`, `breakdown.note = "single-attacker"`. |

### Breakdown shape
```json
{
  "windowAttackCount": 22,
  "uniqueAttackers": 6,
  "topK": 2,
  "topKShare": 0.71,
  "topKAuthorIds": ["auth_…", "auth_…"],
  "thresholds": { "warn": 0.5, "block": 0.6 }
}
```

> **Note**: `topKAuthorIds` is stripped on public-read (see `redactForPublicRead`).

### Default thresholds
- WARN: `0.50`
- BLOCK (rule-firing): `0.60`

---

## 3) `RESPONSE_LATENCY_P50`  (v1)

### Intent
Median time, in seconds, from a claim or argument being posted until its **first substantive reply**.

### Definitions
- *Substantive reply* = an `argument`, `attack`, or `support` whose `targetClaimId` matches and whose author ≠ the original author.
- A reaction (emoji, like) is **not** substantive. Mention notifications are not substantive.

### Formula
For every `claim` (and top-level argument) `c` whose `createdAt ∈ window`:
- `firstReplyAt(c)` = min `createdAt` over `events.repliesTo(c.id, allTime)` filtered for substantive + foreign-author.
- If no reply yet by `windowEnd`, set `latency(c) = windowEnd − c.createdAt` and mark as **right-censored** in the breakdown.

`value = median(latency(c) for c in window) seconds`.

### Edge cases
| Case | Behaviour |
|------|-----------|
| No claims/arguments in window | `value = 0`, `breakdown.degenerate = "no-targets-in-window"`. |
| All targets right-censored | Compute median from censored values; flag `breakdown.allCensored = true`. |

### Breakdown shape
```json
{
  "sampleSize": 14,
  "censoredCount": 3,
  "p25": 38.2,
  "p50": 92.0,
  "p75": 211.4,
  "p95": 480.0,
  "thresholds": { "warn": 300, "block": 600 }
}
```

### Default thresholds (seconds)
- WARN: `300` (5 min)
- BLOCK: `600` (10 min)

---

## 4) `ATTENTION_DEFICIT`  (v1)

### Intent
Identify high-weight claims that have gone unanswered for too long. Emits a *count* (for the metric) and a *list* (for the rules engine to target).

### Inputs
- `claims(allTime)` filtered to `deliberationId`.
- `events.repliesTo(claim.id, allTime)`.

### Formula
For each claim `c`:
- `weight(c) = supportCount + 2 · citationCount` (citations weighted higher because they imply external commitment).
- `staleAge(c) = windowEnd − max(c.createdAt, lastReplyAt(c))`.
- `c is stale ⟺ weight(c) ≥ 1 AND staleAge(c) > thresholds.staleAfterSeconds`.

`value = count(stale claims)`.

### Edge cases
| Case | Behaviour |
|------|-----------|
| Deliberation has no claims | `value = 0`, breakdown empty. |
| Claim weight = 0 | Excluded; low-weight claims are not flagged as deficits. |

### Breakdown shape
```json
{
  "staleClaimIds": [
    { "claimId": "c_…", "weight": 3, "staleSeconds": 1820 }
  ],
  "thresholds": { "staleAfterSeconds": 1200, "warn": 5, "block": 8 }
}
```

The rules engine reads `staleClaimIds` directly; `value` exists for charts.

### Default thresholds
- `staleAfterSeconds`: `1200` (20 min)
- WARN: `5` stale claims
- BLOCK: `8` stale claims

---

## 5) `FACILITATOR_LOAD`  (v1)

### Intent
Self-monitoring metric for the facilitator. Composite of pending interventions and time since last facilitator action.

### Inputs
- `events.interventions(sessionId)` filtered to `appliedAt = null AND dismissedAt = null` (active queue).
- `FacilitationEvent` stream for the session, restricted to `actorRole = facilitator`.

### Formula
- `openCount = active queue size`.
- `lastActionAgo = (windowEnd − max(facilitatorEvent.createdAt) || sessionOpenedAt)` in seconds.
- `value = openCount + (lastActionAgo / 300)` — i.e. each 5 min of inactivity counts as one extra open intervention. Capped at `value ≤ 20`.

### Edge cases
| Case | Behaviour |
|------|-----------|
| Session not yet open | metric not computed. |
| `openCount = 0` and `lastActionAgo < 300` | `value = 0` (no load). |

### Breakdown shape
```json
{
  "openCount": 2,
  "lastActionAgo": 412,
  "lastActionEventId": "fe_…",
  "thresholds": { "warn": 4, "block": 8 }
}
```

### Default thresholds
- WARN: `4` (e.g. 4 open interventions OR ~20 min inactive)
- BLOCK (advisory only — does not gate anything): `8`

---

## Worker cadence and snapshot lifecycle (decision #3)

- Worker `workers/facilitation/snapshotWorker.ts` runs every **60 seconds per OPEN session** (BullMQ delayed-repeat job).
- For each metric, the worker:
  1. Reads the relevant slice of the deliberation event stream.
  2. Calls the calculator.
  3. Writes one `EquityMetricSnapshot` row (`metricVersion` from `lib/facilitation/metrics/<kind>.ts → VERSION` constant).
  4. Compares the new value to the previous snapshot's value. If the comparison crosses any per-metric threshold, also writes a `FacilitationEvent { METRIC_THRESHOLD_CROSSED }`.
  5. Invokes the rules engine with the freshly-written snapshot ids; the engine creates `FacilitationIntervention` rows and writes `INTERVENTION_RECOMMENDED` events that **reference** the snapshot ids in `triggeredByMetricSnapshotId`.
- On `SESSION_CLOSED`:
  1. The worker performs a final pass writing `isFinal = true` snapshots.
  2. The session's `closeService` writes `SESSION_CLOSED` event.
- Downsample job (separate, runs daily):
  1. For each session with `closedAt < now() − 30 days`, walk the snapshots per `(sessionId, metricKind)`.
  2. Bucket by 5-minute `windowEnd`, keep one row per bucket (the latest in the bucket wins).
  3. **Never delete** rows where `isFinal = true` OR id appears in any `FacilitationIntervention.triggeredByMetricSnapshotId` OR `FacilitationEvent.metricSnapshotId`.

## Test coverage requirements (Phase C1)

- Each metric: ≥ 4 fixture cases (uniform, skewed, degenerate, edge boundary).
- Every threshold pair (`warn`, `block`) has a fixture exactly at the boundary.
- Snapshot determinism: re-running the calculator on the same fixture twice produces byte-identical `breakdown` JSON.
- Version pinning: a v2 calculator with different output reads existing v1 snapshots without re-derivation.
