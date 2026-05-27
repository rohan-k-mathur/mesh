# S003 — MCP-authored vs. human-authored argument survival under structural attack

- **status:** pre-registered
- **type:** observational
- **registered-on:** 2026-05-27
- **author:** (programme seed)

## Hypothesis

**H1 (primary, directional).** Holding scheme constant, arguments minted
via the MCP write tools (`propose_argument`, `propose_structured_argument`,
`propose_warrant` — see
[`../../packages/isonomia-mcp/src/server.ts`](../../packages/isonomia-mcp/src/server.ts))
and flagged `authorKind: "AI"` have a *lower 30-day survival rate* under
structural attack than human-authored arguments matched on scheme, room,
and claim-density quintile.

**H2 (secondary).** AI-authored arguments whose warrants have been
ratified (per the AI-warrant ratification gate documented in
[`../../docs/isonomia-overview-general.md`](../../docs/isonomia-overview-general.md)
§IV) have a survival rate *not significantly different* from human-authored
matched controls.

## Design

- **Data source.** Production MCP traffic plus matched human-authored
  arguments. No new instrumentation required: the `authorKind` and
  `aiProvenance` flags are already collected, as is the standing label per
  argument.
- **Sample size.** Open enrollment for 90 days from study start, with
  per-scheme minimum of 30 AI and 30 human-authored arguments. Schemes that
  fail this minimum are dropped from the primary analysis.
- **Survival event.** Standing label changing from
  `untested-supported`/`untested-default` to either `tested-undermined` or
  `tested-attacked` within 30 days of minting.

## Metrics (frozen)

- **Primary:** 30-day survival = 1 − (attack-event rate).
- **Matching covariates:** scheme, room, claim-density quintile of the
  enclosing deliberation at mint time.
- **Subgroup:** by scheme.

## Analysis plan (frozen)

- Stratified Cox proportional-hazards model with `authorKind` as the
  primary covariate, stratified by scheme.
- **Supportive of H1:** hazard ratio AI/human > 1 at α = 0.05 with 95%
  CI excluding 1.
- **Null:** CI overlaps 1.
- **For H2:** repeat the model restricted to AI arguments, comparing
  ratified vs unratified.

## Stopping rule

90 days from study start, no early stopping.

## Data and code

- Source rows: existing `Argument` + provenance tables
- Analysis: `eval/S003-ai-vs-human-survival/`

## Pre-registration freeze

(Hash inserted at first commit.)

## Post-analysis

- Result:
- Surprises:
- Closes: closes Q-008 if H1 is settled in either direction; if null with
  wide CI, feeds Q-008 and triggers replication.
