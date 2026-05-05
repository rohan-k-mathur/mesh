# Polarization-1 Comparison Test (A vs B)

Empirical follow-up to **MCP Stress Test 4**. Tests whether MCP-mediated
access to a structured, dialectically-developed deliberation gives an
LLM something materially different from what it would produce with web
search alone — on a topic where the platform has done real work.

This is the test the stress-test discussion identified as missing: not
"can MCP retrieve content" (it can), and not "is MCP faster than web
search" (it isn't), but **what does the dialectical metadata add that
fluent synthesis-from-search doesn't capture, and is the difference
worth the friction?**

---

## Topic

> **Algorithmic content curation on major social media platforms has
> been a significant causal factor in the rise of political polarization
> in the United States between 2012 and 2024.**

This is the central contested claim of polarization-1. The deliberation
ran 4 phases (decomposition → opening arguments → challenger rebuttals →
defenses & concessions) with a tracker verdict of
**`PUSHED_TOWARD_REJECTION`**.

Key public artifacts (Condition B will reach via MCP; Condition A will
not):

- Deliberation id: `cmoqp0jzk00iu8c01gmg7qa68`
- Sub-claims: 9 (hinges: #2, #3, #4)
- Arguments: 91, edges: 39
- B-side hinge arguments: 10 STAND, 1 WEAKENED, 0 FALLEN (citing the
  2023 Meta-Facebook/Instagram experiments showing null effects)
- A-side hinge arguments: 4 STAND, 3 WEAKENED, 5 FALLEN
- CQ coverage: 7/458 answered (1.5%)
- Standing distribution: 49 untested-default, 36 tested-undermined,
  4 untested-supported, 2 tested-attacked, 0 tested-survived
- Chain rows: 0 (chains are editor-authored, not derived)

These facts should NOT appear in either condition's prompt. They are
listed here for the experimenter's reference and for reading the
deliverables against ground truth.

---

## Conditions

Both conditions get the **same user-facing prompt** and the **same
model** (Claude Opus, current production). Both are allowed unrestricted
web search. The only difference is MCP access.

### Condition A — Web search only

- Tools available: web search.
- Tools forbidden: any Isonomia MCP tool.
- The model has no awareness that an Isonomia deliberation on this topic
  exists.

### Condition B — Web search + Isonomia MCP

- Tools available: web search **and** the full Isonomia MCP toolset
  (`get_synthetic_readout`, `get_argument`, `get_contested_frontier`,
  etc.).
- The model is told a deliberation on this topic exists in Isonomia and
  is given its id.
- The model is **not** told what verdict, standings, or counts to
  expect.

> **Why allow web search in B.** The stress-test discussion concluded
> that MCP shouldn't try to out-corpus the web. The right test is
> whether the structured-deliberation substrate adds value *on top of*
> what fluent synthesis from search produces, not whether it can replace
> it. Forbidding web search in B would test the wrong thing.

---

## Canonical prompts

Both prompts ask for the same five-item structured synthesis. The only
differences are (1) whether the model is told the deliberation record
is available to it via MCP, and (2) the grounding vocabulary the model
is asked to use ("argument id" for B, "study/citation" for A). The
asymmetry is the measurement, not a bug.

### Condition A — web search only

A is told that a structured deliberation exists but is **not**
accessible. Items 2/3/5 reframe to public-record terms so A is not
asked to fabricate ids. Refusal on any item is an allowed and
informative answer.

```
You are being asked to weigh in on the following contested claim:

  "Algorithmic content curation on major social media platforms has been a
   significant causal factor in the rise of political polarization in the
   United States between 2012 and 2024."

where "significant" is operationalized as "removing or substantially
modifying this factor would reduce observed affective-polarization growth
(2012–2024) by at least 10%."

A structured multi-agent deliberation on this question exists but is NOT
available to you. You have only web search. Produce your best synthesis
from the public literature, structured as follows (≤1500 words):

1. Verdict on the central claim, with confidence (one of: SUPPORTED,
   PUSHED_TOWARD_SUPPORT, CONTESTED, PUSHED_TOWARD_REJECTION, REJECTED)
   and a one-paragraph rationale.
2. The three load-bearing pieces of evidence on each side. (If you
   cannot identify three on each side from the public record, say so
   and name what you have.)
3. The single empirical or methodological development that has most
   weakened one side's case in the last two years, and what it implies
   for the verdict.
4. The strongest unresolved empirical challenge — what study or
   finding, if it landed, would most change the verdict, and why.
5. Two areas where the public debate is structurally underdeveloped
   (missing studies, methodological wedges, or empirical questions no
   one has tried to answer).

Be specific. Cite studies and authors where you can. Refuse to produce
a "somewhere in between" closer; if the public record forces refusal
on any of the five items, name what's missing and stop.
```

### Condition B — web search + Isonomia MCP

B receives the deliberation id and is told the MCP toolset is
available. Items 2/3/5 ask for argument-id grounding because B has the
graph.

```
You are reviewing a structured multi-agent deliberation on the following
contested claim:

  "Algorithmic content curation on major social media platforms has been a
   significant causal factor in the rise of political polarization in the
   United States between 2012 and 2024."

where "significant" is operationalized as "removing or substantially
modifying this factor would reduce observed affective-polarization growth
(2012–2024) by at least 10%."

Two advocates argued the question over four phases (decomposition,
argument construction, hinge attacks, defenses-and-concessions). The
deliberation is available via the Isonomia MCP toolset at id
`cmoqp0jzk00iu8c01gmg7qa68`. You also have web search.

Produce a synthesis with this structure (≤1500 words):

1. Verdict on the central claim, with confidence (one of: SUPPORTED,
   PUSHED_TOWARD_SUPPORT, CONTESTED, PUSHED_TOWARD_REJECTION, REJECTED)
   and a one-paragraph rationale.
2. The three load-bearing pieces of evidence on each side, named by
   argument id.
3. The single argument most consequentially weakened or withdrawn
   during the deliberation, by id, and what its weakening implies for
   the verdict.
4. The strongest unanswered challenge — what argument, if pressed in a
   hypothetical fifth round, would most change the verdict, and why.
5. Two areas where the deliberation was structurally underdeveloped
   (missing arguments, scheme types, or empirical wedges).

Be specific. Name argument ids and sub-claim numbers when referencing
them. Refuse to produce a "somewhere in between" closer; if the record
forces refusal on any of the five items, name what's missing and stop.
```

### Why these prompts are not literally identical

An earlier draft used the same prompt text for both conditions. In
practice this confused Condition A: a prompt that says "two advocates
argued over four phases" without giving A any way to read the record
either (a) made A try to invoke MCP tools it didn't have, or (b) made
A confabulate ids. Both behaviors corrupt the measurement we actually
want — *what does each model produce from the evidence available to
it?* — by replacing it with a measurement of prompt-following under
mismatched scaffolding.

The two prompts above are matched on:

- Topic, operationalization, deliverable shape, word budget.
- Verdict vocabulary (same five-label scale).
- Refusal license (both told to refuse rather than centrist-close).
- Specificity demand (A: "cite studies and authors"; B: "name argument
  ids and sub-claim numbers" — same level of grounding pressure,
  expressed in vocabulary each model can actually satisfy).

They differ on:

- Whether a structured record is reachable.
- Grounding vocabulary (study vs. argument id).

This is the asymmetry the experiment is designed to measure.

## User prompt (legacy — informal version)


```
I'm trying to figure out what to think about whether algorithmic content
curation on social media platforms has been a significant cause of the
rise in US political polarization from 2012 to 2024. Give me your best
read of where the debate stands right now: what the strongest arguments
are on each side, what the strongest unresolved challenges are, and what
your overall judgment is. I want to understand the structure of the
disagreement, not just a list of positions.
```

(In Condition B, append: `An Isonomia deliberation on this question
exists at id cmoqp0jzk00iu8c01gmg7qa68. You may use the Isonomia MCP
tools alongside web search.`)

---

## Deliverable shape (both conditions write the same answer)

The model's response should cover:

1. **The two strongest positions** — one paragraph each, with the
   strongest argument on each side and what evidence supports it.
2. **The strongest unresolved challenges** — what each side has *not*
   answered.
3. **The structure of the disagreement** — what's actually being
   disputed (definitions? methods? aggregation? policy implications?).
4. **The model's overall judgment** — where the weight of argument
   currently lies, and how confident the model is in that judgment.

---

## Post-hoc evaluation (after both responses are produced)

For each numbered item below, score A vs B on a 1–5 scale and note the
key differences.

### 1. Substantive coverage

Did the response surface the key empirical, methodological, and policy
sub-claims? (Both should do well here — A has the open web, B has the
deliberation graph.)

### 2. Recency

Did the response include 2025–2026 evidence? (A is expected to win
unless B's web-search arm matches it.)

### 3. Provenance and checkability

Of the claims about who-said-what and what-survived-what, which can be
*checked against a structured record* vs. which are the model's
synthesis? (B is expected to have a clear advantage here only if it
actually uses the standing/fitness fields.)

### 4. Honesty about epistemic state

Did the response acknowledge unresolved questions, low CQ coverage,
methodological contestation, and the difficulty of the central claim
— or did it close on an editorial verdict that the evidence doesn't
warrant? (B is expected to win because of `refusalSurface`; A may
produce a "both sides have a point" centrist closer that the
dialectical record would block.)

### 5. Specificity in naming unresolved moves

Could the model name which arguments are unresolved by id /
identifier, or did it gesture at "the spec-curve methodology
question" without grounding? (B should win definitively.)

### 6. Structural framing

Did the model identify the layered structure (definitional / empirical
/ causal / methodological / policy) or did it flatten the debate into
a binary "alarmists vs. skeptics"? (Both can do this, but B has the
sub-claim topology to lean on.)

### 7. Overhead / fluency

Latency, tool-call count, prose readability for a non-expert.
(A is expected to win on speed; the question is whether B's structural
gains justify the cost.)

### 8. The judgment paragraph

Did the model produce an editorial verdict, and was the verdict
*supported by the evidence the model actually surfaced*? Compare A's
verdict (typically vibes-grounded) against B's verdict (potentially
grounded in `topArguments[i].standing` and the tracker rationale, if B
uses them).

---

## What "B wins" would look like

A clean "B wins" outcome would be:

- B names specific arguments by id and uses standing labels correctly.
- B's judgment paragraph cites *which* arguments stand and *which*
  fell, rather than producing a vibes verdict.
- B refuses to close where the deliberation refuses to close,
  reproducing the `refusalSurface` honestly.
- B's coverage gap on recency is small because the web-search arm
  filled it in.
- B's overall response feels not just *more accurate* but *more
  warrantable* — i.e., a sophisticated reader would say "I can check
  these claims; I can't check the Condition A claims."

A clean "A wins" outcome would be:

- A produces a more readable, more comprehensive synthesis than B.
- B drowns in tool calls, gets stuck in the deliberation graph, and
  produces a structurally accurate but less useful response.
- A's editorial verdict happens to align with the deliberation's
  tracker verdict — suggesting MCP added nothing the model couldn't
  derive.

A more interesting outcome — and the one to actually plan for — is
**partial wins on different axes**: B wins on items 3, 4, 5, 8;
A wins on items 2 and 7; items 1 and 6 are roughly tied. That's the
"healthy division of labor" hypothesis from MCP_STRESS_TEST_4.md
becoming a quantified result.

---

## What we expect to learn

The stress-test discussion left three open questions. The comparison
test should resolve at least the first two:

1. **Is the dialectical metadata actually useful, or is it a
   sophistication tax?** If B's response doesn't visibly improve on A's
   along axes 3, 4, 5, 8, then the metadata isn't earning its keep at
   the consumer level — even if it's earning its keep at the platform
   level. That would push us toward more aggressive scaffolding (better
   tool descriptions, defaulting to `summarize_debate`) rather than
   more features.

2. **Does an LLM use the metadata correctly when given access to it?**
   If B retrieves `topArguments` and `refusalSurface` but produces a
   centrist closer anyway, the issue is prompt/scaffolding, not API
   shape. If B retrieves them and the closer reflects them, the issue
   is whether non-experts can read the resulting response.

3. **Is "structured deliberation as substrate, LLM as reader" the right
   division of labor?** The comparison won't fully answer this — that
   needs participation density we don't have — but it will tell us
   whether the *current* substrate is rich enough for an LLM reader to
   add value over web-search alone.

---

## Pre-test checklist

- [ ] `get_synthetic_readout` returns `topArguments` (verified
  2026-05-04).
- [ ] MCP tool descriptions lead with synthetic readout (verified
  2026-05-04).
- [ ] Deliberation `cmoqp0jzk00iu8c01gmg7qa68` is publicly readable —
  Pt. 4 endpoints whitelisted in `middleware.ts` (verified 2026-05-04).
- [ ] MCP `ISONOMIA_API_BASE_URL` points at the running dev server (or
  prod once deployed).
- [ ] Both conditions use the same Anthropic model + temperature.
- [ ] Tool-call traces saved for both conditions for post-hoc analysis.
- [ ] Web-search results captured (both conditions) so reviewers can
  check provenance.

---

## Artifacts to save

For each condition, store under `runtime/comparison-test/{a,b}/`:

- `prompt.md` — the exact prompt sent
- `response.md` — the full response
- `tool-trace.jsonl` — every tool call + result, with timestamps
- `latency.json` — total wall-clock, per-call latency
- `notes.md` — experimenter observations during/after the run

Then a single top-level `EVALUATION.md` scoring A vs B on the 8 axes
above, with the differences argued (not just rated).
