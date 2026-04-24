# Facilitation — UX Wireframes (in-repo)

Status: Draft v0.1 (C0 deliverable)
Parent: [docs/DelibDemocracyScopeC_Roadmap.md](../DelibDemocracyScopeC_Roadmap.md)
Companion: [docs/facilitation/API.md](API.md)

These wireframes are intentionally low-fidelity ASCII; they exist to align engineering and design on layout, regions, and interaction surfaces before pixel-level design. Pixel comps live in Figma (link TBD).

## 1) Cockpit page — `/deliberations/[id]/facilitate`

Three-column layout with a slim top bar. **Visible only to facilitators and hosts.**

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│  ◀ Back  ·  Transit equity policy — Tuesday session       [LIVE]   Open 47m  ⌚ 19:47:12     │
│  Session fs_abc · facilitator @rohan ·  [Hand off]  [Close session]   [Minimal mode ◐]        │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
┌──────────────────────────┬──────────────────────────────────────┬───────────────────────────┐
│ EQUITY                   │ EVENT STREAM   role=log              │ INTERVENTIONS  role=feed  │
│                          │                                      │                           │
│ Participation (Gini)     │ • 19:47 INTERVENTION_APPLIED         │ ┌───────────────────────┐ │
│ ▁▂▃▅▆▇█▇▅  0.68 ↑        │   "elicit unheard view on Claim 14"  │ │ Pri 4 · ELICIT_UNHEARD│ │
│ threshold ──────         │   by @rohan                          │ │ Claim 14 · 5 silent   │ │
│                          │ • 19:46 METRIC_THRESHOLD_CROSSED     │ │ Gini 0.71 (snap_…)    │ │
│ Challenge concentration  │   PARTICIPATION_GINI 0.68 → 0.71      │ │ [Apply] [Dismiss…]    │ │
│ ▁▁▂▃▄▅▇█    0.71 ↑       │ • 19:45 INTERVENTION_RECOMMENDED     │ └───────────────────────┘ │
│                          │   challengeConcentrationRule fired   │ ┌───────────────────────┐ │
│ Response latency p50     │ • 19:42 INTERVENTION_DISMISSED       │ │ Pri 3 · COOLDOWN      │ │
│ 184s → 92s ↓             │   "already addressed"                │ │ User A ↔ B (8 turns)  │ │
│                          │ • 19:40 SESSION_OPENED               │ │ [Apply] [Dismiss…]    │ │
│ Attention deficit        │                                      │ └───────────────────────┘ │
│ 7 stale claims           │ ──── load earlier (history) ────     │                           │
│                          │                                      │ History (collapsed)  ▶    │
│ Facilitator load         │                                      │                           │
│ 2 open · 1 dismissed     │                                      │                           │
│                          │ ─────────── Question ─────────────   │                           │
│ [drill down]             │ "Should the city restore weekend     │                           │
│                          │  service on Line 14?"  v2 · LOCKED   │                           │
│                          │ checks: 1 INFO · 1 WARN ack'd        │                           │
│                          │ [Re-open question]                   │                           │
└──────────────────────────┴──────────────────────────────────────┴───────────────────────────┘
```

**Notes**
- Top-right "Minimal mode" toggle hides the left and right columns and shows only the top intervention card + a single rotating metric. Default is full view.
- Sparklines render the per-metric snapshot series for the current session window only.
- Threshold markers (the dashed line in the participation chart) come from `breakdown.thresholds` returned by the metrics endpoint.
- Event stream auto-scrolls; "load earlier" backfills via `?after=` cursor.

**Accessibility**
- Three columns are `<section>` landmarks with explicit `aria-label`.
- Event stream uses `role="log"` with `aria-live="polite"`.
- Intervention queue uses `role="feed"` with each card as `aria-busy="false"` `role="article"`.
- Apply/Dismiss buttons are reachable in DOM order; the keyboard shortcut `J/K` cycles between intervention cards (documented in cockpit help).

## 2) Question authoring & checks

Renders inline above the cockpit's center column when a question is being edited or has unresolved checks.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Question v3 (DRAFT)            framing: ▾ choice              parent: v2    │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │ Should the city restore weekend service on Line 14?                      ││
│  │                                                                          ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  [ Run checks ]   last run: 2 min ago                                        │
│                                                                              │
│  Checks (run_xyz)                                                            │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │ ⓘ INFO    CLARITY      Readability grade 8.4 — within target band        ││
│  │ ⚠ WARN   LEADING      "restore" presupposes prior service               ││
│  │           [acknowledge ☐]   evidence: matched pattern "restore"          ││
│  │ ✕ BLOCK  BALANCE     Choice framing requires balanced options;          ││
│  │           only one option asserted. [resolve to lock]                    ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  [ Lock question ]   ← disabled while any BLOCK is unresolved                │
│  [ View diff vs v2 ▾ ]                                                       │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Lock confirmation modal** (when `Lock` is pressed and any WARN remains unacknowledged):

```
┌──────────────────────────────────────────────────────────────┐
│ Lock question v3                                             │
│                                                              │
│ You have 1 WARN check that will be recorded as              │
│ acknowledged on lock. This is captured in the audit log.    │
│                                                              │
│   ☑ LEADING — "restore" presupposes prior service           │
│                                                              │
│ [ Cancel ]                          [ Confirm and lock ]    │
└──────────────────────────────────────────────────────────────┘
```

## 3) Intervention card (detail)

```
┌─────────────────────────────────────────────────────────────┐
│  Pri 4   ELICIT_UNHEARD              recommended 19:42:08   │
│                                                             │
│  5 enrolled participants haven't contributed in the last    │
│  20 minutes. Participation Gini = 0.71 (above 0.65 threshold)│
│                                                             │
│  Target: Claim 14 — "Restore weekend Line 14"               │
│  Triggered by: PARTICIPATION_GINI · snapshot ems_q4z        │
│  Rule: unheardSpeakerRule v1                                │
│                                                             │
│  Suggested phrasing:                                        │
│  > "We haven't heard from everyone yet on Line 14 —         │
│  >  what would weekend service mean for your week?"         │
│                                                             │
│  [ Apply ]    [ Dismiss… ]                                  │
└─────────────────────────────────────────────────────────────┘
```

**Dismiss modal**:

```
┌──────────────────────────────────────────────────┐
│  Why are you dismissing this intervention?       │
│                                                  │
│  Reason (required)                               │
│  ┌────────────────────────────────────────────┐  │
│  │                                            │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  Tag (optional)                                  │
│  ◯ not_relevant                                  │
│  ◯ already_addressed                             │
│  ◯ wrong_target                                  │
│  ◯ other                                         │
│                                                  │
│  [ Cancel ]              [ Dismiss intervention ]│
└──────────────────────────────────────────────────┘
```

## 4) Handoff dialog

```
┌──────────────────────────────────────────────────────────────┐
│ Hand off facilitation                                        │
│                                                              │
│ To:   ▾ select a facilitator or host                         │
│       @maria  (host)                                         │
│       @sam    (facilitator)                                  │
│                                                              │
│ Notes for the receiver:                                      │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Watch out for the cooldown rule firing on user X…        │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ Snapshot at hand-off:                                        │
│   • 2 outstanding interventions (✓ included)                 │
│   • Participation Gini 0.68                                  │
│   • Challenge concentration 0.71                             │
│   • 7 stale claims                                           │
│                                                              │
│ [ Cancel ]                          [ Send handoff request ] │
└──────────────────────────────────────────────────────────────┘
```

The receiving facilitator sees a top-bar banner: *"Pending facilitation handoff from @rohan — [Accept] [Decline]"*. Accept opens the cockpit on the new session.

## 5) Facilitation report — `/deliberations/[id]/facilitation/report`

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Facilitation Report — Transit equity policy                                  │
│ Sessions: 1 (Tuesday) · Duration 1h 42m                                      │
│ Hash chain: ✓ valid (142 events)                                             │
│ ↗ View Scope A pathway report (City of Portland — PBOT)                      │
│                                                                              │
│ ── Question ───────────────────────────────────────────────────────────────  │
│   v3 LOCKED 19:38   "Should the city restore weekend service on Line 14?"   │
│   checks at lock:  1 INFO · 1 WARN (acknowledged)                            │
│                                                                              │
│ ── Equity metrics (start → final) ────────────────────────────────────────── │
│                                                                              │
│   PARTICIPATION_GINI       0.42 → 0.31  ↓ 11pts                              │
│   CHALLENGE_CONCENTRATION  0.71 → 0.55  ↓ 16pts                              │
│   RESPONSE_LATENCY_P50     184s → 92s   ↓ 50%                                │
│   ATTENTION_DEFICIT        7 → 2 claims                                      │
│   FACILITATOR_LOAD         peak 3 open · final 1 open                        │
│                                                                              │
│   metric calculator versions: v1 across all metrics                          │
│                                                                              │
│ ── Interventions ──────────────────────────────────────────────────────────  │
│   recommended  14                                                            │
│   applied       9 (64%)                                                      │
│   dismissed     4 (28%)                                                      │
│   open at close 1                                                            │
│                                                                              │
│   apply rate by rule:                                                        │
│     unheardSpeakerRule          0.83                                         │
│     challengeConcentrationRule  0.50                                         │
│     evidenceGapRule             0.67                                         │
│                                                                              │
│   dismissal tag distribution:                                                │
│     already_addressed  3                                                     │
│     wrong_target       1                                                     │
│                                                                              │
│ ── Hash-chain attestation ─────────────────────────────────────────────────  │
│   sha256 (last) :  9f3c…b21c                                                 │
│   genesis event :  fe_genesis_…                                              │
│   verify with   :  POST /api/facilitation/sessions/fs_abc/verify             │
│                                                                              │
│ [ Download JSON ]   [ Print to PDF (browser) ]                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

Public-read variant of the report identical in shape but with hashed actor ids and one-sentence intervention rationale summaries.

## 6) Deliberation room integration

The deliberation room gains:

1. **Top-bar tab "Facilitate"** — visible only to facilitator/host roles. Routes to the cockpit.
2. **Inline equity-warning chips** on claim/argument cards when that target is referenced by an active intervention or has crossed `ATTENTION_DEFICIT` / `CHALLENGE_CONCENTRATION` thresholds.

```
   ┌─ Claim card ──────────────────────────────────────────────┐
   │  Restore weekend Line 14 service                          │
   │  by @bilal · 7 challenges · 2 supports                    │
   │  ⚠ stale 22m · 5 silent participants  [Facilitate ▸]      │
   └───────────────────────────────────────────────────────────┘
```

The chip is read-only for non-facilitators; for facilitators it routes to the corresponding card in the intervention queue.

## 7) Open UX questions for C0 review

1. Confirm minimal-mode default for first-time facilitators (new users see minimal mode; power users see full).
2. Confirm `J/K` keyboard navigation for the intervention queue (alternative: arrow keys).
3. Should the dismiss modal allow multi-tag selection or just one tag? **Recommendation**: one tag for v1; revisit if dismissal patterns suggest otherwise.
4. Whether to show a live "facilitator presence" indicator in the deliberation room (so participants know the cockpit is staffed). **Recommendation**: yes, but as a separate Phase C3 deliverable to avoid coupling cockpit shipping to room UI changes.
