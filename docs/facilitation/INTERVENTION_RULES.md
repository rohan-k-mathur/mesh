# Facilitation — Intervention Rule Specifications (v1)

Status: Draft v0.1 (C0 deliverable)
Parent: [docs/DelibDemocracyScopeC_Roadmap.md](../DelibDemocracyScopeC_Roadmap.md)
Companion: [docs/facilitation/EQUITY_METRICS.md](EQUITY_METRICS.md)

## Conventions

- A rule is a pure function `(ctx) → FacilitationIntervention | null`.
- Rules live in `lib/facilitation/rules/<ruleName>.ts` and export `{ NAME, VERSION, PRIORITY, run }`.
- The driver in `lib/facilitation/interventionService.ts → recommendNext(sessionId)`:
  1. Loads the latest snapshot per metric for the session.
  2. Iterates `enabledRules` in `lib/facilitation/rules/index.ts`.
  3. For each rule that fires, deduplicates against open `FacilitationIntervention` rows with the same `(ruleName, targetType, targetId)` from the past `dedupeWindow` minutes.
  4. Persists the resulting intervention rows and emits `INTERVENTION_RECOMMENDED` events with `triggeredByMetricSnapshotId` pinned.
- Rule version is stored on every recommendation; behaviour changes → version bump.
- Rules are individually feature-flaggable via `ff_facilitation_rule_<name>`.

## Common rule context

```ts
type RuleContext = {
  sessionId: string;
  deliberationId: string;
  now: Date;
  enrolledAuthIds: string[];
  snapshots: Partial<Record<EquityMetricKind, EquityMetricSnapshot>>;
  recentEvents: DeliberationEventStream; // last hour
  openInterventions: FacilitationIntervention[]; // for dedupe
};
```

Output:

```ts
type RuleOutput =
  | null
  | {
      kind: FacilitationInterventionKind;
      targetType: "CLAIM" | "ARGUMENT" | "USER" | "ROOM";
      targetId: string;
      priority: 1 | 2 | 3 | 4 | 5;
      rationale: { headline: string; details: object };
      suggestedPhrasing: string;
      triggeredByMetric: EquityMetricKind;
      triggeredByMetricSnapshotId: string;
    };
```

## Default priority scale

| Priority | Meaning                                      |
|----------|----------------------------------------------|
| 5        | Critical — equity threshold severely crossed; explicit attention required. |
| 4        | High — sustained imbalance or stale high-weight content. |
| 3        | Medium — emerging pattern; advisory. |
| 2        | Low — informational; cockpit may collapse by default. |
| 1        | Background — surfaced only in detail view. |

The cockpit's intervention queue shows top-K by `priority desc, recommendedAt asc`.

## Dedupe policy

Before persisting, the driver checks for existing open interventions with the same `(ruleName, targetType, targetId)` recommended within `dedupeWindowSeconds`. Default `dedupeWindowSeconds = 600` (10 min). If a duplicate exists, the new recommendation is discarded silently. Each rule may override `dedupeWindowSeconds`.

---

## 1) `unheardSpeakerRule` (v1)

### Trigger
- `snapshots.PARTICIPATION_GINI.value > thresholds.gini` (default `0.65`)
- AND `snapshots.PARTICIPATION_GINI.breakdown.silentEnrolled ≥ thresholds.minSilent` (default `3`)

### Target
- `targetType: "CLAIM"`, `targetId =` highest-weight claim posted in the current session window with at least one active discussant. (If no eligible claim, `targetType: "ROOM"`, `targetId = deliberationId`.)

### Priority
- `5` if Gini > `0.80`
- `4` if Gini > `0.65`

### Rationale shape
```json
{
  "headline": "5 enrolled participants haven't contributed in the last 20 min.",
  "details": {
    "gini": 0.71,
    "silentEnrolled": 5,
    "totalContributions": 47,
    "thresholds": { "gini": 0.65, "minSilent": 3 }
  }
}
```

### Suggested phrasing
> "We haven't heard from everyone yet on **{claimSummary}** — what would this look like from your week-to-week experience?"

### Dedupe window
- 600 s (default)

### Edge cases
- Snapshot is degenerate (`breakdown.degenerate` set) → rule does not fire.

---

## 2) `challengeConcentrationRule` (v1)

### Trigger
- `snapshots.CHALLENGE_CONCENTRATION.value > thresholds.shareTopK` (default `0.60`)
- AND `snapshots.CHALLENGE_CONCENTRATION.breakdown.windowAttackCount ≥ thresholds.minAttacks` (default `5`)

### Target
- `targetType: "ROOM"`, `targetId = deliberationId`. (The remedy is room-wide — broaden the critique base.)

### Priority
- `4` baseline; `5` if `value > 0.80`.

### Rationale shape
```json
{
  "headline": "Top 20% of accounts produced 71% of challenges in the last window.",
  "details": {
    "share": 0.71,
    "topK": 2,
    "windowAttackCount": 22,
    "thresholds": { "shareTopK": 0.60, "minAttacks": 5 }
  }
}
```

### Suggested phrasing
> "We've heard sharp critique from a few voices. Are there counter-views from elsewhere in the room we should put on the table?"

### Dedupe window
- 900 s

---

## 3) `evidenceGapRule` (v1)

### Trigger
For each high-weight claim in the current deliberation:
- `claim.supportCount ≥ thresholds.minSupport` (default `3`)
- AND `claim.citationCount = 0`

Fires once per claim per session window.

### Target
- `targetType: "CLAIM"`, `targetId = claim.id`.

### Priority
- `3` baseline; `4` if `claim.supportCount ≥ 6`.

### Rationale shape
```json
{
  "headline": "Claim has 4 supports but no citations yet.",
  "details": {
    "claimId": "c_…",
    "supportCount": 4,
    "citationCount": 0,
    "thresholds": { "minSupport": 3 }
  }
}
```

### Suggested phrasing
> "**{claimSummary}** is gaining support — what evidence would let us check it?"

### Dedupe window
- 1800 s (30 min) — the claim is unlikely to add citations within minutes.

### Edge cases
- Claim was posted by a verified institutional source — suppress (institutional claims often arrive cited via the source itself; the rule would be noisy).

### Triggered metric
- `triggeredByMetric` is `null` because this rule runs off the claim/citation join, not a snapshot. The driver allows `null` here and the API documents it as such. The chain entry's `payloadJson` records the snapshot context for completeness.

> **Open question for C0**: do we want a synthetic `EVIDENCE_GAP` metric to keep "every rule has a snapshot reference" invariant true? **Recommendation**: no for v1 — adds storage churn for no gain; document the exception explicitly.

---

## 4) `staleClaimRule` (v1)

### Trigger
- `snapshots.ATTENTION_DEFICIT.breakdown.staleClaimIds.length ≥ thresholds.minStale` (default `1`)

Fires *once per stale claim*, not once per metric snapshot.

### Target
- `targetType: "CLAIM"`, `targetId = claim.id` for each entry in `staleClaimIds`.

### Priority
- `claim.weight ≥ 6` → `4`
- `claim.weight ∈ [3, 5]` → `3`
- `claim.weight ∈ [1, 2]` → `2`

### Rationale shape
```json
{
  "headline": "High-weight claim has had no reply for 22 minutes.",
  "details": {
    "claimId": "c_…",
    "weight": 6,
    "staleSeconds": 1320,
    "thresholds": { "staleAfterSeconds": 1200 }
  }
}
```

### Suggested phrasing
> "**{claimSummary}** has been quiet for a while — does anyone want to push back, refine, or build on it?"

### Dedupe window
- 1200 s — matches the staleness threshold so the same claim isn't re-flagged inside its own staleness window.

---

## 5) `cooldownRule` (v1)

### Trigger
A rolling-window check independent of metric snapshots:
- Within the last `windowSeconds` (default `300`), there are ≥ `thresholds.turnCount` (default `8`) substantive exchanges between exactly two `auth_id`s targeting the same root claim.

### Target
- `targetType: "USER"`, `targetId = first speaker's auth_id`. (The cockpit will surface both names; targeting one auth_id keeps the row uniquely keyed.)

### Priority
- `2` baseline; `3` if `turnCount ≥ 12`.

### Rationale shape
```json
{
  "headline": "Two participants have exchanged 9 turns in 5 min on Claim 14.",
  "details": {
    "userA": "auth_…",
    "userB": "auth_…",
    "claimId": "c_…",
    "turnCount": 9,
    "windowSeconds": 300,
    "thresholds": { "turnCount": 8 }
  }
}
```

### Suggested phrasing
> "This thread is heating up between two voices. Want to take a beat and bring others in?"

### Dedupe window
- 900 s
- Per-pair dedupe: same `{userA, userB, claimId}` set is matched even if a/b are swapped.

### Triggered metric
- `triggeredByMetric: null` (computed from raw events; same exception as `evidenceGapRule`).

---

## Rule registry

```ts
// lib/facilitation/rules/index.ts
export const RULE_REGISTRY = [
  { name: "unheardSpeakerRule",         version: 1, defaultEnabled: true,  flag: "ff_facilitation_rule_unheard_speaker" },
  { name: "challengeConcentrationRule", version: 1, defaultEnabled: true,  flag: "ff_facilitation_rule_challenge_concentration" },
  { name: "evidenceGapRule",            version: 1, defaultEnabled: true,  flag: "ff_facilitation_rule_evidence_gap" },
  { name: "staleClaimRule",             version: 1, defaultEnabled: true,  flag: "ff_facilitation_rule_stale_claim" },
  { name: "cooldownRule",               version: 1, defaultEnabled: false, flag: "ff_facilitation_rule_cooldown" }, // off by default until calibrated
] as const;
```

## Test coverage requirements (Phase C1)

For each rule:
- Positive case (rule fires; assert intervention shape).
- Negative case immediately below threshold (rule does not fire).
- Boundary case at threshold (assert which side of equality the rule lands on — locked: `>` is fire, `=` is not, except where explicitly stated).
- Dedupe case (existing open intervention suppresses re-recommendation).
- Degenerate-snapshot case (rule does not fire; no exception).
- Suggested phrasing template substitution (`{claimSummary}` resolution).

## Error budget

Rule evaluation is best-effort: if a rule throws, the driver logs the error, emits a `FacilitationEvent { type: METRIC_THRESHOLD_CROSSED, payload: { ruleError: true, ruleName } }` for visibility, and continues to the next rule. One failing rule does not break the whole recommendation cycle.
