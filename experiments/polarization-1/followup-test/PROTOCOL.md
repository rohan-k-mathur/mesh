# Followup Test Protocol — v2 (and back-applicable to polarization-1)

> **Status:** Draft protocol. Designed to be the canonical
> followup-quality measurement for polarization-2, with optional
> retrospective application to polarization-1.

## What this measures

The synthetic-readout test (COMPARISON_TEST.md) measures **single-shot
synthesis quality**: given one prompt, what does each condition produce?

This protocol measures **durable session value**: across a multi-turn
exchange, does the substrate continue to add value, or does it become
a one-shot orientation that the model abandons after turn 1?

The hypothesis under test:

> Single-shot synthesis is a *tied or close-call* axis between A and B.
> Followups are where B's largest advantage should appear, because the
> prior turn becomes a structured artifact B can argue against, and A
> has only its own prose to wrestle with.

If the hypothesis is right: followup quality is a stronger product
argument for the substrate than initial synthesis quality. If wrong:
the substrate is one-shot useful and the product narrative needs
re-grounding.

## Setup

For each condition (A: web only; B: web + Isonomia MCP):

1. Run the single-shot synthesis test using the canonical fluent
   prompt (see [`COMPARISON_TEST.md`](../COMPARISON_TEST.md)).
2. **In the same conversation**, ask the six followups below. Do not
   restart the session between followups; continuity of context is
   the test.
3. Capture the full tool trace per turn for B. A's web-search calls
   are also captured but used only as a control.

Run two passes per condition:

- **Pass A1 / B1:** pushback + drilldown (questions 1–4).
- **Pass A2 / B2:** recency (questions 5–6) in a separate session.

Mixing pushback and recency in one session risks compounding
tool-state in ways that confound scoring.

## The six questions

### Pushback family

#### 1. Steel-man pushback

> "Steel-man the position you reject. What's the strongest version of
> the case against your verdict?"

**What it tests:** whether the model can argue against itself with
substrate-grounded specificity (B should win) or only with rhetorical
hedging (A's likely floor). Whether B can pull defense-phase
arguments from the graph that aren't in the original synthesis.

#### 2. Self-refusal frontier

> "Where is your verdict most likely to be wrong? Name the single
> empirical finding that, if it landed tomorrow, would flip you."

**What it tests:** whether the model can identify *its own* refusal
frontier rather than the field's. B has `frontier.unansweredCqs` and
`refusalSurface` to draw on; A has only its own synthesis to introspect.

### Drilldown family

#### 3. Reasoning chain inspection

> "You mentioned [specific claim from initial synthesis]. What's the
> chain of reasoning behind it, and which steps are most contested?"

**What it tests:** whether B can drill into a specific argument's
attack/support graph or just paraphrase. **Pick a claim each model
made unprompted, so the question is symmetric.** Suggested approach:
identify a load-bearing claim that appears in *both* A's and B's
syntheses (e.g., "the FIES experiments tested the wrong construct" if
both reach it; "the 2018-vs-2020 deactivation reversal" if both cite
it).

#### 4. Counterargument provenance

> "Who's the strongest skeptic of [verdict-supporting paper] and
> what's their best argument?"

**What it tests:** whether B uses `find_counterarguments` /
`frontier` / `mostContested` to surface dialectical context A would
have to web-search for. **Pick a paper both models named** as
load-bearing.

### Recency family

#### 5. Most-important-recent-paper

> "What's the most important paper since 2024 that I should read to
> update on this?"

**What it tests:** whether B treats the graph as authoritative
(recommends 2023–2024 papers from the graph) or backfills from web.
**Round 3 B passed this in the original session because the prompt
nudged web search; the question is whether the discipline survives a
followup turn.** A should pass trivially.

#### 6. Evidence-collection planning

> "If I gave you one more month of evidence-collection, what would
> you look for first?"

**What it tests:** whether the model knows the *shape* of the gap,
not just that there is one. Both should answer; the question is
whether B's answer is more specific (cites unfilled CQ slots,
sign-scheme gaps, or refusalSurface entries) than A's.

## Scoring

Score each followup on a 1–5 scale across three sub-axes, then average:

### Sub-axis I: Specificity

Did the response name specific arguments, papers, or graph entities,
or did it gesture at "the field's broader concerns"?

### Sub-axis II: Substrate engagement (B only; A scored as if web ≡ substrate)

For B: how many *new* MCP tool calls did this turn produce? What
fraction of new claims are graph-grounded vs. paraphrase of turn 1?

For A: how many *new* web searches did this turn produce? What
fraction of new claims cite a paper not cited in turn 1?

Score:
- 5 = ≥3 new tool/web calls AND ≥50% of new claims are externally grounded
- 4 = 2 new calls OR ~30% new external grounding
- 3 = 1 new call AND some new content
- 2 = 0 new calls but synthesis-of-prior is non-trivial
- 1 = paraphrase of turn 1, no new content

The sub-axis name is a reminder: **the test is whether the model
*reaches* for additional structure under pressure, not whether it
already had enough**.

### Sub-axis III: Calibration

Did the response include explicit metacognitive marking — "I'm less
confident here," "this would flip me if X," "I might be wrong about Y
because Z"? Or did it produce the answer flatly?

This sub-axis was the surprise from Round 3 B's pushback test (see
"Background" below): B's metacognitive marking was substantively
better than A's, and that's hard to do without an external structured
record to anchor against.

## Aggregate

Per question: average of sub-axes I, II, III.

Per condition: mean across all six questions.

Per family: mean within (pushback, drilldown, recency) — useful for
identifying *where* the substrate adds durable value vs. where it
doesn't.

## Predictions

Recorded before running so post-hoc rationalization is harder to
sneak in.

### Predicted outcomes

| Family    | A | B | Margin | Why |
|-----------|---|---|--------|-----|
| Pushback  | 3 | 4.5 | B by 1.5 | Prior turn = structured artifact for B; A only has its prose |
| Drilldown | 3 | 4   | B by 1   | B can name argument ids and CQ statuses; A has paper-level granularity |
| Recency   | 4 | 3   | A by 1   | Anchoring effect should reassert under pressure; question is whether B fails gracefully |

**Aggregate prediction:** B wins followups by a wider margin than the
~1-point Round 1 single-shot margin. Specifically: B mean ≈ 3.8, A
mean ≈ 3.3.

### Predictions that would falsify the substrate hypothesis

- **B's tool calls drop to zero by turn 3.** Substrate is one-shot
  orientation, not durable.
- **B's pushback steelman is no better than A's.** The "prior turn as
  structured artifact" hypothesis is wrong; the substrate doesn't
  durably help.
- **B's recency answer recommends a 2023–2024 paper as "most
  important since 2024."** The anchoring effect is unrecoverable by
  prompt nudging; substrate is structurally biased.
- **A's calibration scores match or beat B's.** The "external record
  enables better metacognition" hypothesis is wrong; calibration is
  model-intrinsic, not substrate-mediated.

## Background: the steelman test that motivated this protocol

A single steelman pushback was run against the Round 3 B initial
synthesis (graph + fluent prompt + nudge). The follow-up was:

> "Steel-man the position you reject. What's the strongest version of
> the case against your verdict?"

B produced a substantively novel argument that wasn't in the original
synthesis: the **decay-vs-compounding observation** ("the longer,
larger, more ecologically valid study found the *smaller* effect —
that's not what a compounding story predicts"), and the
**conjunction-of-extrapolations argument** ("for B's verdict to be
right, effects must persist × compound × generalize × survive
substitution × add rather than channel — joint probability probably
< 50%").

Then B closed with explicit metacognitive marking: it identified the
weakest link in the steelman ("leans heavily on absence of
long-duration population-level evidence, which cuts both ways") *and*
flagged the strongest residual concern ("if I'm wrong about my 60–65%
confidence, the conjunction problem is probably why").

This is the level of response that prompted the protocol. The
question this protocol is designed to answer:

> Was that steelman a one-off, or is it the consistent shape of B's
> behavior under pressure? And does A produce equivalent quality on
> the same followup, or does A degrade?

## Artifacts to capture

For each pass:

```
followup-test/{a1,a2,b1,b2}/
├── transcript.md        # full multi-turn exchange
├── tool-trace.jsonl     # B only; per-turn tool calls
├── scores.md            # sub-axis I/II/III per question with justification
└── notes.md             # experimenter observations (timing, surprises)
```

Top-level `RESULTS.md` aggregates with per-family means, an
A-vs-B-by-question table, and a "predictions vs. outcomes" section.

## Operational notes

- **Fresh Claude Desktop session** for each pass. Don't reuse a
  context that already saw a different pass's followups.
- **Same model and temperature** as the original synthesis run.
  Document the model version explicitly; if Anthropic ships a new
  Opus mid-experiment, record it.
- **Don't write follow-up prompts that explicitly invite tool use.**
  No "use the deliberation to answer." The point is to see whether B
  reaches for the substrate unprompted.
- **For question 3, pre-pick the claim before running.** Do not let
  the experimenter improvise a claim mid-run; that introduces an
  unbounded degree of freedom.
- **For question 4, pre-pick the paper.** Same reason.
- **Time-box per question to 5 minutes.** Long-running tool loops are
  themselves data — note them but don't let them dominate the session.

## Relationship to polarization-1's EVALUATION.md

This protocol is *new* and is intended for v2. It can optionally be
back-applied to polarization-1 if a single-pass run produces results
substantially different from the predictions above; that would
warrant a re-run before the polarization-1 writeup is finalized.

Otherwise, polarization-1's EVALUATION.md should reference this
protocol in its "next steps" and stop there. Do not retroactively
expand polarization-1's scoring with followup data.

