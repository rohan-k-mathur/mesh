# Typology — UX Wireframes (in-repo)

Status: Draft v0.1 (B0 deliverable)
Parent: [docs/DelibDemocracyScopeB_Roadmap.md](../DelibDemocracyScopeB_Roadmap.md)
Companion: [docs/typology/API.md](API.md)

These wireframes are intentionally low-fidelity ASCII; they exist to align engineering and design on layout, regions, and interaction surfaces before pixel-level design. Pixel comps live in Figma (link TBD). Mirrors the discipline used by [docs/facilitation/WIREFRAMES.md](../facilitation/WIREFRAMES.md).

---

## 1) `DisagreementTagger` — inline on a claim/argument card

The tagger renders inside a popover or expandable section on a claim card in the deliberation map. Default-collapsed; opens via a "Tag disagreement" affordance.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Claim 14                                                                    │
│  "Restore weekend service on Line 14."                                       │
│                                                                              │
│  Tags:  [VALUE 0.7]  [EMPIRICAL 0.5]  [+ tag]                                │
└──────────────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼  (popover, on click of [+ tag])
┌──────────────────────────────────────────────────────────────────────────────┐
│  Tag disagreement on Claim 14                                                │
│                                                                              │
│  Axis     [● VALUE]  [○ EMPIRICAL]  [○ FRAMING]  [○ INTEREST]                │
│            ──────────────────────────                                        │
│            Surface the values at stake; consider a values-clarification      │
│            round.   (axis hint, from registry)                               │
│                                                                              │
│  Confidence  [────────●──]  0.72                                             │
│                                                                              │
│  Evidence                                                                    │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ Two participants cite differing ridership studies on Line 14.          │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  Linked claims (optional)  [+ link claim]                                    │
│    · claim_22 — "2024 ridership figures undercount weekend riders"           │
│                                                                              │
│  [ Cancel ]                                       [ Propose tag ]            │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Existing tags grouped by axis

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Tags on Claim 14                                                            │
│                                                                              │
│  VALUE                                                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │ 0.70 · @kara · "Equity-of-access vs cost-recovery."                  │    │
│  │ confirmed by @rohan · [retract…]                                     │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  EMPIRICAL                                                                   │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │ 0.50 · @sam (PARTICIPANT) · pending — [confirm] [retract…]           │    │
│  │ "Ridership recovery forecasts diverge between 2024 and 2025."        │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Notes**
- The axis pill color comes from `DisagreementAxis.colorToken`.
- The confidence display rounds to 2dp; the underlying decimal is 3dp.
- Pending vs confirmed is the only first-class status visualization; retracted tags are hidden by default with a "show retracted (n)" toggle.

**Accessibility**
- Tagger popover uses `role="dialog"` with `aria-labelledby`.
- Axis radios are a `<fieldset>` with axis hint as `aria-describedby`.
- Confidence slider is a native `<input type="range">` with min/max/step.
- Confirm/retract buttons are reachable in DOM order; `J/K` cycles between tag rows in the list view (matches Scope C cockpit conventions).

---

## 2) `TypologyCandidateQueue` — cockpit tile

Lives inside the Scope C `FacilitationCockpit` as a new "Typology" tile (or tab inside the existing layout). Default-collapsed per the §7 cockpit-overload mitigation.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ TYPOLOGY    role=region   aria-label="Typology candidates"     [collapse ▾]   │
│                                                                              │
│ Axis distribution (confirmed tags this session)                              │
│   VALUE     ███████░░░░░░  7                                                 │
│   EMPIRICAL ████████████   12                                                │
│   FRAMING   ███░░░░░░░░░░  3                                                 │
│   INTEREST  █░░░░░░░░░░░░  1                                                 │
│                                                                              │
│ Candidate queue (4 pending)               [ Draft summary → ]                │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ Pri 4 · EMPIRICAL · interventionSeeder                                   │ │
│ │ Triggered by INTERVENTION_APPLIED (PROMPT_EVIDENCE) on Claim 14          │ │
│ │ "The dispute appears to be evidential — two studies disagree on         │ │
│ │  ridership recovery."                                                    │ │
│ │ [ Promote ]   [ Dismiss… ]                                               │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ Pri 3 · INTEREST · interventionSeeder                                    │ │
│ │ Triggered by INTERVENTION_APPLIED (ELICIT_UNHEARD), Gini 0.71            │ │
│ │ Session-scoped (no specific target)                                      │ │
│ │ [ Promote ]   [ Dismiss… ]                                               │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ Pri 2 · EMPIRICAL · repeatedAttackSeeder                                 │ │
│ │ Argument 88 attacked by 4 distinct authors with differing evidence       │ │
│ │ [ Promote ]   [ Dismiss… ]                                               │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ History (4 promoted · 2 dismissed)                                ▶          │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Notes**
- Empty state distinguishes "no candidates yet" from "API error" — explicit copy lesson from Scope C `InterventionQueue`.
- Promote opens the `DisagreementTagger` popover pre-filled with the candidate's axis + target + rationale (becomes the initial `evidenceText`).
- Dismiss opens a small modal that requires `reason` (parity with intervention dismiss).
- The "Draft summary →" button is disabled when there are zero confirmed tags in the session.

**Promote modal** (when `Promote` is pressed):

```
┌──────────────────────────────────────────────────────────────┐
│ Promote candidate to tag                                     │
│                                                              │
│ Target: Claim 14 · "Restore weekend service on Line 14."     │
│ Axis:   EMPIRICAL  v1                                        │
│ Source: interventionSeeder · ruleVersion 1                   │
│                                                              │
│ Confidence  [────────●──]  0.65                              │
│                                                              │
│ Evidence                                                     │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ The dispute appears to be evidential — two studies      │   │
│ │ disagree on ridership recovery.                         │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                              │
│ Override axis  [ ▾ ]                                         │
│                                                              │
│ [ Cancel ]                            [ Promote and confirm ]│
└──────────────────────────────────────────────────────────────┘
```

---

## 3) `MetaConsensusEditor` — drafting a summary

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Meta-consensus summary v1 (DRAFT)                       session: fs_abc      │
│                                                                              │
│ Agreed on                                                       [ + add ]    │
│ ┌──────────────────────────────────────────────────────────────────────┐    │
│ │ • Weekend service on Line 14 was discontinued in 2023 for budget     │    │
│ │   reasons.                                                            │    │
│ └──────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│ Disagreed on                                                    [ + add ]    │
│ ┌──────────────────────────────────────────────────────────────────────┐    │
│ │ Axis  [ ▾ VALUE ]                                                    │    │
│ │ Summary                                                              │    │
│ │ ┌────────────────────────────────────────────────────────────────┐   │    │
│ │ │ Equity-of-access vs cost-recovery.                             │   │    │
│ │ └────────────────────────────────────────────────────────────────┘   │    │
│ │ Supporting tags  [ + pick ]                                          │    │
│ │   · dt_x — VALUE 0.70 on Claim 14 — @kara                            │    │
│ │   · dt_y — VALUE 0.62 on Argument 33 — @sam                          │    │
│ └──────────────────────────────────────────────────────────────────────┘    │
│ ┌──────────────────────────────────────────────────────────────────────┐    │
│ │ Axis  [ ▾ EMPIRICAL ]                                                │    │
│ │ Summary  "Ridership recovery forecasts (2024 vs 2025 studies)."      │    │
│ │ Supporting tags                                                      │    │
│ │   · dt_z — EMPIRICAL 0.65 on Claim 14 — @rohan (promoted)            │    │
│ └──────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│ Blockers                                                        [ + add ]    │
│ ┌──────────────────────────────────────────────────────────────────────┐    │
│ │ • No reconciled ridership figure between the 2024 and 2025 studies.   │    │
│ └──────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│ Next steps                                                      [ + add ]    │
│ ┌──────────────────────────────────────────────────────────────────────┐    │
│ │ • Request a synthesis brief from the Transit Authority before next   │    │
│ │   session.                                                            │    │
│ └──────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│ Narrative (optional)                                                         │
│ ┌──────────────────────────────────────────────────────────────────────┐    │
│ │ ...prose render that will be saved alongside bodyJson...             │    │
│ └──────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│ [ Save draft ]    [ Preview ]                       [ Publish… ]             │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Publish modal** (when `Publish` is pressed):

```
┌──────────────────────────────────────────────────────────────┐
│ Publish summary v1                                           │
│                                                              │
│ Snapshot will freeze:                                        │
│   · 3 tags (1 VALUE, 1 VALUE, 1 EMPIRICAL)                  │
│   · 2 claims (Claim 14 v3, Claim 22 v1)                      │
│   · 1 argument (Argument 33 v2)                              │
│                                                              │
│ Estimated snapshot size: 12 KiB / 256 KiB cap                │
│                                                              │
│ After publish:                                               │
│   · Subsequent edits to source claims will not mutate this  │
│     summary.                                                 │
│   · A revision requires a new version row (parentSummaryId).│
│                                                              │
│ [ Cancel ]                              [ Confirm and publish ]│
└──────────────────────────────────────────────────────────────┘
```

**Notes**
- `axisKey` per `disagreedOn` row populates from the registry; disabled options when `isActive = false`.
- Tag picker is filtered to confirmed tags in this session (or the whole deliberation when summary is deliberation-scoped).
- Validation banner appears at the top when any `disagreedOn` row references a retracted tag.

---

## 4) `MetaConsensusSummaryCard` — read-only render

Used in the cockpit, the pathway report, and the public deliberation view. Same component, different chrome.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Meta-consensus summary v1                              [HASH ✓]  PUBLISHED   │
│ Session: Tuesday evening · transit equity                                    │
│ Published 2026-04-22 21:14 UTC by @rohan                                     │
│                                                                              │
│ Agreed on                                                                    │
│   • Weekend service on Line 14 was discontinued in 2023 for budget reasons.  │
│                                                                              │
│ Disagreed on                                                                 │
│   ▸ VALUE — Equity-of-access vs cost-recovery.        2 supporting tags ▾    │
│   ▸ EMPIRICAL — Ridership recovery forecasts.         1 supporting tag ▾     │
│                                                                              │
│ Blockers                                                                     │
│   • No reconciled ridership figure between the 2024 and 2025 studies.        │
│                                                                              │
│ Next steps                                                                   │
│   • Request a synthesis brief from the Transit Authority.                    │
│                                                                              │
│ ── Hash chain attestation ──                                                 │
│ Chain: 142 events · last hash: sha256:a4c3…b7  ·  snapshotHash: sha256:9e1…2 │
└──────────────────────────────────────────────────────────────────────────────┘
```

Drill-down (expanding `▸ VALUE — …`):

```
   ▾ VALUE — Equity-of-access vs cost-recovery.                                │
       · dt_x  · 0.70 · Claim 14 — @kara                                       │
         "Equity-of-access weighed heavier in the 2019 vote."                  │
       · dt_y  · 0.62 · Argument 33 — @sam                                     │
         "Cost-recovery framing dominates the agency's 2025 brief."            │
```

**Notes**
- `[HASH ✓]` badge reuses the Scope A / Scope C `ChainValidityBadge` component.
- In the public-read variant, author handles render as the 12-char hashed prefix.
- The card is fully renderable from `snapshotJson` alone — no live tag fetch required, which is what makes it embeddable in the institutional pathway report.

---

## 5) Map integration — axis badges on claim/argument cards

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Claim 14                                                  [V][E][F]         │
│  "Restore weekend service on Line 14."                                       │
│                                                                              │
│  ▲ supported by 8     ▼ attacked by 3                                        │
│                                                                              │
│  ── Tagged disagreement ──                                                   │
│  V  Value (1)        E  Empirical (1)        F  Framing (1)                  │
└──────────────────────────────────────────────────────────────────────────────┘
```

Hovering an axis pill reveals a tooltip:

```
   ┌────────────────────────────────────────────────────────────┐
   │ EMPIRICAL — confidence 0.65                                │
   │ "Ridership recovery forecasts diverge between 2024 and     │
   │  2025."                                                    │
   │ Tagged by @rohan · confirmed                               │
   └────────────────────────────────────────────────────────────┘
```

**Map filter** — adds a toggle to the existing map filter bar:

```
   ☑ Show only typed disagreements      Axis: [ ALL ▾ ]
```

---

## 6) Pathway report integration

The `metaConsensus` block renders inside the pathway report below each `RecommendationPacketItem` it applies to, plus a deliberation-level "Remaining disagreements" section at the top of the report.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Pathway PW-2026-014 — Transit Equity Working Group                          │
│  Submitted 2026-04-23 · responded 2026-05-04                                 │
│                                                                              │
│  ── Remaining disagreements ──                                               │
│  Latest meta-consensus summary v2 (PUBLISHED 2026-04-22)   [open ▸]          │
│   ▸ VALUE: Equity-of-access vs cost-recovery (2 tags)                        │
│   ▸ EMPIRICAL: Ridership forecasts (1 tag)                                   │
│   ▸ FRAMING: Service vs subsidy framing (1 tag)                              │
│                                                                              │
│  ── Packet items ──                                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │ Item 1 — Claim 14 — "Restore weekend service on Line 14."            │    │
│  │                                                                      │    │
│  │   Disposition: ACCEPTED                                              │    │
│  │   Response excerpt: "Aligned with our 2026 service plan."            │    │
│  │                                                                      │    │
│  │   ── Meta-consensus context ──                                       │    │
│  │   Tagged disagreements at packet submission:                         │    │
│  │     · VALUE (0.70) · "Equity-of-access vs cost-recovery."            │    │
│  │     · EMPIRICAL (0.65) · "Ridership recovery forecasts."             │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  Hash chain attestation (pathway · facilitation · meta-consensus)            │
│   pathway:        sha256:b1a4…7c   ✓                                         │
│   facilitation:   sha256:d3e2…9f   ✓                                         │
│   meta-consensus: sha256:a4c3…b7   ✓                                         │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Notes**
- The meta-consensus context per item is derived from `RecommendationPacketItem.snapshotJson` at submission time — it does not refetch live tags. This guarantees the institutional report stays reproducible from the packet snapshot alone.
- The three-chain attestation block at the bottom is the visible payoff of the parallel hash-chain machinery used by Scope A, Scope C, and Scope B.

---

## 7) Demo page — `app/test/typology-features/page.tsx`

Mirrors the polish established by [app/test/facilitation-features/page.tsx](../../app/test/facilitation-features/page.tsx):

- Gradient background, sticky header with gradient axis-icon + badges (`Scope B ready` / `4 axes seeded` / `LLM deferred`).
- ContextBanner with deliberation id picker (Use / Clear / Browse mine).
- Color-coded `AxisLegend` (4 axes from registry).
- 3-tile `TypologyStatusStrip` (tags · candidates · summaries).
- White-pill `TabsList` with `gap-1.5` triggers: Tagger · Candidates · Summary editor · Summary card · Pathway report integration.
- Each tab renders inside a `FullHeightCard` with shadow.
- Footer with `LLM-deferred` and `cross-room reconciliation deferred` chips.

Smoke test: `__tests__/app/typology-features.demo.test.ts` — mirrors the 7-case Scope C smoke test (renders, has badges, tabs switch, ContextBanner accepts an id, etc.).
