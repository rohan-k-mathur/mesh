# Stage 1: Pre-Experiment Preparation — Detailed Dev Roadmap

**Companion to:**
- `Multi agent deliberation experiment roadmap.md` (Section 1: Pre-Experiment Preparation)
- `Multi agent deliberation experiment - prerequisite implementation plan.md` (the infra build that must land before Stage 1 begins)

**Date:** May 3, 2026
**Status:** Planning — no code written yet
**Audience:** The author (Rohan) executing this end-to-end; secondarily, future contributors running Experiment 2+ from the same artifacts.

---

## 0. What "Stage 1 done" means

When Stage 1 is complete, you can run a single command that:
1. Reads a topic-pack (framing doc + agent prompts + evidence list) from `experiments/polarization-1/`
2. Provisions the deliberation room, the 5 bot agents, and the pre-seeded evidence Stack
3. Validates that every agent can authenticate, every evidence URL resolves with provenance, every scheme key referenced in the prompts exists in the Walton catalog
4. Emits a `READY_FOR_PHASE_1.json` file with all the IDs and tokens the orchestrator will need

You do not actually run any agents in Stage 1. You produce **artifacts and infrastructure** so that Stage 2 (Phase 1: Claim Topology) starts from a known-good state.

This roadmap fleshes out Section 1.1–1.4 of the master roadmap into concrete deliverables, file structures, and acceptance tests.

---

## 1. Repository Layout

All Stage-1 artifacts live under `experiments/polarization-1/` (workspace-relative). This is a new top-level folder, distinct from `Development and Ideation Documents/Experiments/` (which holds planning docs, not runtime artifacts).

```
experiments/
└── polarization-1/
    ├── FRAMING.md                              # §1.1
    ├── prompts/
    │   ├── 1-claim-analyst.md                  # §1.2
    │   ├── 2-advocate-a.md
    │   ├── 3-advocate-b.md
    │   ├── 4-challenger.md
    │   ├── 5-concession-tracker.md
    │   └── shared/
    │       ├── framing.md                      # symlink to ../../FRAMING.md
    │       ├── scheme-catalog.json             # generated from /api/schemes
    │       ├── move-types.md                   # WHY/GROUNDS/CONCEDE/RETRACT spec
    │       └── output-formats.json             # JSON schemas the orchestrator validates
    ├── evidence/
    │   ├── sources.csv                         # §1.4 — 15–25 rows, hand-curated
    │   └── verification-log.md                 # human verification notes
    ├── orchestrator/                           # §1.3
    │   ├── package.json                        # tsx + zod + anthropic + node-fetch
    │   ├── src/
    │   │   ├── index.ts                        # CLI entrypoint
    │   │   ├── config.ts                       # loads agents.json, FRAMING.md, prompts
    │   │   ├── isonomia-client.ts              # typed wrapper over Isonomia REST
    │   │   ├── anthropic-client.ts             # thin Anthropic wrapper
    │   │   ├── agents/
    │   │   │   ├── types.ts                    # AgentRole, AgentTurnInput, AgentTurnOutput
    │   │   │   ├── claim-analyst.ts            # phase 1 logic
    │   │   │   ├── advocate.ts                 # phase 2 + 3 logic (parameterized A/B)
    │   │   │   ├── challenger.ts               # phase 3 logic
    │   │   │   └── concession-tracker.ts       # phase 3 + 4 logic
    │   │   ├── phases/
    │   │   │   ├── phase-1-topology.ts
    │   │   │   ├── phase-2-arguments.ts
    │   │   │   ├── phase-3-dialectic.ts
    │   │   │   └── phase-4-summary.ts
    │   │   ├── translators/
    │   │   │   ├── argument.ts                 # agent JSON → /api/arguments calls
    │   │   │   ├── attack.ts                   # agent JSON → /api/attacks/create
    │   │   │   ├── move.ts                     # agent JSON → /api/dialogue/move
    │   │   │   └── concession.ts               # agent JSON → CONCEDE/RETRACT moves
    │   │   ├── state/
    │   │   │   ├── refresh.ts                  # GET /api/v3/deliberations/{id}/state
    │   │   │   └── format-for-prompt.ts        # render state for next agent's context
    │   │   └── log/
    │   │       └── round-logger.ts             # JSONL per-round logs
    │   └── tsconfig.json
    ├── setup/
    │   ├── 1-provision-agents.ts               # B1 from prereq plan
    │   ├── 2-create-deliberation.ts            # POST /api/deliberations + ensure
    │   ├── 3-seed-evidence-stack.ts            # B2 — Stack + items + binding
    │   ├── 4-precheck.ts                       # validates scheme keys, URLs, tokens
    │   └── README.md
    ├── runtime/                                # gitignored
    │   ├── agents.json                         # bot tokens (sensitive)
    │   ├── deliberation.json                   # { deliberationId, stackId, evidenceContextId }
    │   ├── READY_FOR_PHASE_1.json              # final gate output
    │   └── logs/
    │       └── setup/
    └── README.md
```

`runtime/` is added to `.gitignore` immediately. Everything else is committed.

---

## 2. §1.1 — Framing Document (`FRAMING.md`)

The roadmap calls for a one-paragraph framing. We'll produce a tighter one-page document because every agent prompt embeds it verbatim, so ambiguity here multiplies across 5 agents × 6 phases.

### Required sections

```markdown
# Polarization-1 Framing Document

## Central contested claim
[exact text — will become the root claim in the deliberation]

## In-scope
- Platforms: [enumerated list — e.g. Facebook, Instagram, TikTok, YouTube, X]
- Populations: [enumerated — e.g. US adults, EU adolescents]
- Time period: [start year — end year]
- Definition of "polarization": [pick one of affective | ideological-sorting | belief; cite the operationalization]
- Definition of "significant causal factor": [explicit threshold language]

## Out-of-scope (and why)
- [3–5 bullet points listing adjacent questions agents must NOT drift into]

## Evidence types in scope
- [experimental, observational, platform-internal, meta-analytic, etc.]

## Evidence types out of scope
- [op-eds, single anecdotes, partisan think-tank pieces unless cited as primary sources]

## What counts as "established" vs "contested" within the framing
- [a short rubric the Concession Tracker will use as its reference]
```

### Acceptance test

A hand-written checklist of 10 borderline claims (5 in-scope, 5 out-of-scope) is annotated with the expected verdict. Two readers (you + one other) agree on at least 9/10 verdicts using only `FRAMING.md`. If less than 9/10, tighten the framing and re-test.

### Why this matters

The single biggest predictable failure mode for the experiment is **scope drift** — agents arguing about *adjacent* questions (e.g. "are smartphones bad for teens" instead of "does algorithmic curation cause political polarization"). Tight framing is the only defense.

### Effort: 2 hours.

---

## 3. §1.2 — Five Agent System Prompts

Each prompt is a separate `.md` file rendered into a single string at orchestrator startup. The shared prefix (framing, schemes, move types, output formats) is loaded once and concatenated with the role-specific suffix.

### 3.1 Shared prefix (`prompts/shared/`)

#### `framing.md`
Symlink (or copy) of `FRAMING.md`. Embedded verbatim at the top of every agent's system prompt.

#### `scheme-catalog.json`
Generated by `setup/4-precheck.ts` from a live call to `GET /api/schemes`. Trimmed to the fields agents need:

```json
[
  {
    "key": "expert_opinion",
    "name": "Argument from Expert Opinion",
    "description": "...",
    "slots": ["expert", "domain", "claim"],
    "criticalQuestions": [
      { "key": "cq_expertise", "text": "Is the source actually an expert in the relevant domain?" },
      { "key": "cq_consensus", "text": "Is the expert's view consistent with other experts?" }
    ]
  },
  ...
]
```

This is the **Walton taxonomy ground truth**. Agents are explicitly told: "you may ONLY use schemes by `key` from this catalog. Inventing a scheme is forbidden and will be rejected by the platform."

#### `move-types.md`
Spec of the 10 dialogue move kinds (ASSERT, WHY, GROUNDS, RETRACT, CONCEDE, CLOSE, THEREFORE, SUPPOSE, DISCHARGE, ACCEPT_ARGUMENT) and the 3 attack types (REBUTS, UNDERCUTS, UNDERMINES) with `targetScope` semantics. Includes 2–3 worked examples each.

#### `output-formats.json`
Zod-compatible JSON schemas for each agent's allowed output shapes. Examples:

```json
{
  "ClaimAnalystOutput": {
    "phase": "1",
    "centralClaim": "string (verbatim restatement of the central claim)",
    "subClaims": [
      {
        "index": "integer (1-based, sequential, no gaps)",
        "text": "string (single declarative sentence, ≤ 500 chars)",
        "claimType": "EMPIRICAL | NORMATIVE | CONCEPTUAL | CAUSAL | METHODOLOGICAL | INTERPRETIVE | HISTORICAL | COMPARATIVE | META | THESIS",
        "layer": "definitional | empirical | causal | normative",
        "tags": ["string", "..."],
        "dependsOn": ["integer index of another sub-claim (≤ 2 entries, no cycles, depth ≤ 3)"],
        "rationale": "string (≤ 300 chars — why this sub-claim is load-bearing for the central claim)"
      }
    ]
  },
  // ClaimAnalystOutput refusal shape (alternative top-level response):
  // { "error": "FRAMING_AMBIGUOUS" | "CENTRAL_CLAIM_PRESUPPOSES_CONTESTED_DEFINITION" | "INSUFFICIENT_EVIDENCE_DOMAINS",
  //   "details": "string", "suggestedFraming": "string | null" }
  "AdvocateArgumentOutput": {
    "phase": "2|3",
    "arguments": [
      {
        "conclusionClaimIndex": "integer (refers to phase-1 claim list)",
        "premises": [{ "text": "string", "citationToken": "src:* or null" }],
        "schemeKey": "string (must match scheme-catalog.json)",
        "warrant": "string (implicit warrant text) | null"
      }
    ]
  },
  "ChallengerOutput": {
    "phase": "3",
    "attacks": [
      {
        "targetArgumentIndex": "integer",
        "attackType": "REBUTS | UNDERCUTS | UNDERMINES",
        "targetScope": "conclusion | inference | premise",
        "cqKey": "string from the target's scheme",
        "newCounterArgument": "AdvocateArgumentOutput.arguments[0] shape | null"
      }
    ],
    "whyMoves": [{ "targetArgumentIndex": "integer", "rationale": "string" }]
  },
  "ConcessionTrackerOutput": {
    "phase": "3|4",
    "proposals": [
      {
        "advocateRole": "A | B",
        "kind": "RETRACT | CONCEDE | NARROW",
        "targetType": "argument | claim",
        "targetIndex": "integer",
        "rationale": "string",
        "revisedText": "string (only for NARROW)"
      }
    ],
    "stateSummary": "string (only emitted in phase 4)"
  }
}
```

The orchestrator validates every agent response against the relevant schema. Validation failures trigger one retry with the schema error message appended; second failure aborts the round and logs.

**Hard vs. soft constraints — two-track validation.**

Not every constraint in the role prompts can be mechanically validated. The orchestrator distinguishes two tracks:

| Track | Examples | Failure handling |
|---|---|---|
| **Hard (mechanical)** | Schema shape, enum membership, count bounds, DAG depth, scheme-key existence in `scheme-catalog.json`, CQ-key existence on the target scheme, dependency-index validity, claimType↔layer matching | One auto-retry with violation message appended to the agent's user message; second failure aborts the round. |
| **Soft (review-and-flag)** | "No restating established claims," "sub-claims independently arguable," "hinge identification," "NARROW must strictly narrow scope," "Challenger output contains no advocacy," "premise text is genuinely declarative not phrase-fragment" | Output is **accepted** and persisted, but emitted with a `reviewFlag` annotation in the round log. The orchestrator continues. A human review pass (§3.8) inspects flagged outputs after the phase completes. |

**Why two tracks:** retrying an LLM on a fuzzy constraint ("don't restate established claims") with a vague error message rarely produces a better output and burns tokens. Better to accept, flag, and let the author correct or accept post-hoc — a Phase-1 decomposition with one borderline restatement is still usable for Phase 2.

### 3.8 Soft-constraint review-and-flag flow

**Mechanism in the orchestrator:**

1. Each role prompt's hard constraints are encoded as Zod refinements; soft constraints are encoded as **`reviewCheck` functions** in `agents/<role>.ts` that return `{ flag: "ok" | "review" | "warn", reason?: string }`.
2. The orchestrator runs all `reviewCheck`s after the schema validation passes. Any non-`ok` results are emitted to the round log as:
   ```jsonc
   { "ts": "...", "kind": "review_flag", "agent": "claim-analyst", "check": "no_established_restatement",
     "severity": "review", "reason": "sub-claim #2 paraphrases established claim 'affective polarization rose 2012–2024'",
     "subjectIndex": 2 }
   ```
3. The output is still persisted to the deliberation (sub-claims are minted, arguments are filed, etc.).
4. After the phase completes, `yarn orchestrator review --phase N` produces a single Markdown report at `runtime/reviews/phase-N-review.md` listing all flagged items with the agent output, the flag reason, and a fillable verdict block:
   ```markdown
   ## Flag #3 — claim-analyst, sub-claim #2
   **Check:** no_established_restatement
   **Severity:** review
   **Reason:** sub-claim #2 paraphrases established claim 'affective polarization rose 2012–2024'
   **Sub-claim text:** "..."
   **Verdict:** [ ] accept  [ ] revise  [ ] retract  Notes:
   ```
5. The author fills in verdicts. If any verdict is `revise` or `retract`, the orchestrator re-runs the round with the flagged output's correction context appended to the agent's user message (or, for `retract`, deletes the flagged sub-claim/argument/attack from the deliberation before continuing).
6. If all verdicts are `accept`, the phase advances. The review report is committed to git (under `runtime/reviews/`, which is allow-listed in `.gitignore` despite being under `runtime/`) as part of the experiment's audit trail.

**Soft-check inventory (initial; expand as prompts get drafted):**

| Agent | Check name | What it inspects |
|---|---|---|
| `claim-analyst` | `no_established_restatement` | Cosine-similarity > 0.75 between any sub-claim and any item in `FRAMING.md` "Established within the framing" rubric (embedding via OpenAI `text-embedding-3-small` or local model) |
| `claim-analyst` | `hinge_identified` | At least one sub-claim has ≥ 2 inbound `dependsOn` references (heuristic for "hinge") |
| `advocate-a/b` | `premises_are_declarative` | Each premise text passes a sentence-shape check (capitalized first word, terminal punctuation, no leading conjunction) |
| `advocate-a/b` | `evidence_token_resolves` | Every cited `citationToken` exists in the bound evidence context |
| `challenger` | `no_advocacy` | Output contains no first-person position-statements (regex + LLM-judge fallback) |
| `concession-tracker` | `narrow_strictly_narrows` | For every NARROW proposal, the `revisedText` is a strict substring-or-scope-reduction of the original (heuristic + LLM-judge fallback) |

Effort for the review flow: **+2 hours** to the §1.3 orchestrator total (now ~22h).

### 3.2 Role-specific prompts

Each role file is ~2–4 pages and follows this structure:

```markdown
# System: <Role name>

## Your role
<single-sentence description>

## Your scope
<bullet list of what you do and what you don't>

## Inputs you will receive
<spec of the user-message structure the orchestrator will send>

## Outputs you must produce
<reference to output-formats.json schema name>

## Operating constraints
<bullet list of hard constraints — e.g. "every argument must cite at least one citationToken from the bound evidence Stack">

## Worked example
<one full input → output cycle, hand-written>

## Refusal cases
<when to refuse to act and what to emit instead — e.g. "if no scheme in the catalog fits, emit { error: 'NO_FITTING_SCHEME', proposed_alternative: ... }">
```

The full text of each prompt is drafted in §3.3–3.7 below as outlines.

### 3.3 Claim Analyst (`prompts/1-claim-analyst.md`)

**Role:** Decompose the central claim into 6–10 typed, dependency-tagged sub-claims.

**Hard constraints:**
- Must produce 6 ≤ N ≤ 10 sub-claims.
- Every sub-claim has a `claimType` from the canonical enum (see B3 in prereq plan).
- Sub-claims must collectively cover all four layers: definitional, empirical, causal, normative/policy. Output is rejected if any layer is empty.
- Dependencies are local — a sub-claim depends on at most 2 others, by index. No cycles.
- Sub-claim text is parseable as a single declarative sentence (≤ 500 chars).

**Refusal cases:**
- If the framing is internally inconsistent: emit `{ error: "FRAMING_AMBIGUOUS", details: [...] }`.
- If the central claim already presupposes a contested definitional sub-claim: surface this in the output before decomposing.

**Phase coverage:** Phase 1 only.

### 3.4 Advocate A (`prompts/2-advocate-a.md`)

**Role:** Argue the *causal-link* position. Construct 4–6 scheme-annotated arguments per Phase 2 round; defend against challenges in Phase 3.

**Hard constraints:**
- Every argument cites ≥1 evidence source by `citationToken` from `EVIDENCE_CONTEXT` (passed in the user message).
- Every argument specifies a `schemeKey` from the Walton catalog. No invented schemes.
- Each argument's `premises[].text` is a complete declarative sentence — these will become standalone claims in the deliberation, so they must be assertions in their own right, not phrase fragments.
- No preemptive hedging ("some might object…") in initial arguments. Wait for the Challenger to surface objections.
- During Phase 3, response to a challenge uses one of the allowed move types: `GROUNDS`, `ACCEPT_ARGUMENT` (decline to defend), or a new counter-argument.
- May not retract on own initiative — only the Concession Tracker proposes retractions.

**Refusal cases:**
- If no source in the bound corpus supports a position the agent would otherwise take: emit `{ skipped: true, reason: "NO_GROUND_TRUTH_EVIDENCE" }`. The orchestrator surfaces this in the round log.
- If a challenge demands a CQ-answer but the answering evidence isn't in the bound corpus: emit `GROUNDS_DECLINED` with rationale, which the Concession Tracker will read.

**Phase coverage:** Phases 2–3.

### 3.5 Advocate B (`prompts/3-advocate-b.md`)

Same shape as Advocate A. Position: *the causal link is overstated, evidence is mixed or insufficient*. All other constraints identical. Symmetric instruction set so neither advocate is structurally favored.

### 3.6 Challenger (`prompts/4-challenger.md`)

**Role:** Stress-test arguments from both advocates. File 2–4 challenges per Phase 3 round.

**Hard constraints:**
- **Must attack both advocates each round.** If only one side has live arguments unanswered, file at least one challenge against the other side's strongest argument anyway. Single-sided rounds are rejected by the orchestrator.
- Each attack identifies the specific CQ from the target argument's scheme. The CQ must come from `scheme-catalog.json[targetScheme].criticalQuestions[]`. Inventing CQs is rejected.
- Attacks are typed: REBUTS / UNDERCUTS / UNDERMINES, with required `targetScope`.
  - REBUTS → targetScope=conclusion (default) or premise
  - UNDERCUTS → targetScope=inference
  - UNDERMINES → targetScope=premise (specific premise index required)
- The Challenger **does not advocate**. Output containing position-statements is rejected.
- May propose new counter-arguments only as REBUTS/UNDERMINES with full scheme + evidence — using the same `AdvocateArgumentOutput` shape.

**Refusal cases:**
- If all CQs for an argument are answered or have produced a concession: skip that argument explicitly and document `{ skippedArgument: idx, reason: "ALL_CQS_RESOLVED" }`.

**Phase coverage:** Phase 3 only.

### 3.7 Concession Tracker (`prompts/5-concession-tracker.md`)

**Role:** Watch the dialectic. After each Phase 3 round, propose RETRACT / CONCEDE / NARROW for advocate positions that have moved. Produce final state summary in Phase 4.

**Hard constraints:**
- Must read the orchestrator-supplied dialectical state (standings, attack register, CQ status, transcript) — proposals are grounded in observable changes, not the agent's opinion.
- For NARROW, the `revisedText` must be a strict scope-narrowing of the original claim: drops a population, time period, platform, or evidence type. Cannot ADD content.
- Proposals are ranked by confidence; only top-3 are surfaced per round to keep advocate response burden bounded.
- Phase 4 stateSummary follows a fixed template (see below). Free-form prose outside the template is rejected.

**Phase 4 state-summary template:**

```markdown
# Polarization-1 — Final Dialectical State

## Original central claim
…

## Final central claim (after concessions)
… (or "unchanged")

## Sub-claims: original → final
| # | original text | final text | concession kind | rationale |

## Argument standings at termination
| # | conclusion | scheme | standing | challenger count | CQ answered/total | survived? |

## Open critical questions
… enumerated by argument index

## Concession history (chronological)
… sourced from get_concession_history MCP tool

## Dialectical trajectory (≤200 words)
… one paragraph, claims-and-evidence-grounded

## What this deliberation does NOT settle
… enumerated
```

This template is what the synthesis LLM (Condition B) consumes via MCP. **Designing it well is the highest-leverage Stage 1 deliverable** because the experiment's central hypothesis depends on the synthesis LLM having structured access to dialectical metadata.

**Phase coverage:** Phases 3–4.

### Effort

- Shared prefix files: 3 hours
- 5 role prompts (each 1 hour, plus 2 hours review across all): 7 hours
- Output schema authoring + validation harness: 2 hours
- **Total §1.2: ~12 hours**

---

## 4. §1.3 — Orchestrator (`orchestrator/`)

### 4.1 Architectural choices

**Language:** TypeScript via `tsx` (matches Isonomia repo conventions).

**Process model:** Single-process, sequential phases. No concurrency between agents in a round. Within a round, agent turns serialize. This is intentional — the experiment's value depends on each agent seeing the cumulative state, not on throughput.

**Anthropic API surface used:** Messages API with system prompt + user message structure. No tool-use (the agents emit JSON in their text response, which the orchestrator parses; this is simpler than wiring MCP into the agent loop and matches the roadmap's "agents are LLMs producing structured outputs" spec).

**Model:** Claude Opus 4.x for all 5 agents in v1 production runs. **Two-tier model config**, selected via `--model-tier` CLI flag (and `MODEL_TIER` env var):

| Tier | Model | Use |
|---|---|---|
| `dev` (default for `--dry-run` and integration tests) | Claude Haiku 4.x (cheap/fast) | Wiring tests, translator debugging, smoke runs. Output quality is **not** evaluated. |
| `prod` (required for any run that produces logged experimental data) | Claude Opus 4.x | All 5 agents. v1 standardizes on Opus across the board. |

Asymmetric model choice (e.g. Sonnet for Challenger only) is a follow-up experiment. The orchestrator refuses to advance any phase command without an explicit `--model-tier=prod` flag if the deliberation is flagged `experimentMode: true` in `runtime/deliberation.json` — this prevents accidentally burning a real experiment on the cheap tier.

**Authentication mode:** Each agent has its own bearer token loaded from `runtime/agents.json` (provisioned via prereq B1). The Isonomia client switches `Authorization: Bearer …` per call based on the active agent role.

**Retry policy:**
- Anthropic 429/5xx: exponential backoff, 3 retries, then fail the round.
- Isonomia 4xx (validation failure on agent output translation): one retry with the validation error appended to the agent's user message; second failure aborts the round and logs.
- Isonomia 5xx: 3 retries with backoff; persistent failure aborts the experiment.
- Schema validation failure on agent output: one retry with the Zod error stringified into the user message.

**Logging:** JSONL per round at `runtime/logs/round-{phase}-{round}-{agentRole}.jsonl`. One line per event:

```jsonc
{ "ts": "...", "kind": "agent_input", "agent": "advocate-a", "messages": [...] }
{ "ts": "...", "kind": "agent_raw_output", "agent": "advocate-a", "text": "..." }
{ "ts": "...", "kind": "agent_parsed_output", "agent": "advocate-a", "json": {...} }
{ "ts": "...", "kind": "isonomia_call", "method": "POST", "path": "/api/arguments", "body": {...}, "response": {...} }
{ "ts": "...", "kind": "round_summary", "phase": 3, "round": 2, "movesCreated": 7, "argumentsCreated": 3, "attacksCreated": 4 }
```

This format is grep-able, jq-queryable, and replayable.

### 4.2 The premise-claim-minting problem (critical design)

**Verified ground truth:** `POST /api/arguments` requires `premiseClaimIds: string[]`. Premise *text* is not accepted — premises must already be Claim records in the deliberation.

**Implication for the orchestrator:** When an Advocate emits an argument with 3 premise sentences, the orchestrator must:

1. For each premise, mint a `Claim` via `POST /api/claims { text, deliberationId, claimType: "EMPIRICAL" /* or inferred */ }`.
2. Record the returned `claim.id` in a per-round `claimRegistry`.
3. Mint a `Claim` for the conclusion (or look it up if it's already in the topology from Phase 1).
4. Then call `POST /api/arguments` with the resolved IDs.

**Idempotency:** `mintClaimMoid` produces a stable hash from text, so duplicate premises (across agents or rounds) collapse into the same Claim. This is a feature — when both advocates assert "Adolescent depression rose post-2012," that should be one canonical claim that both reference.

**`claimType` for derived premise claims:** Default to `"EMPIRICAL"` unless the agent explicitly tags. The Claim Analyst's Phase-1 outputs are tagged; downstream-derived premises during Phase 2/3 default to empirical. Document this clearly in `translators/argument.ts`.

### 4.3 The state-refresh contract

After each agent turn, the orchestrator:
1. Calls `GET /api/v3/deliberations/{id}/state?include=fingerprint,frontier,missing-moves,chains,transcript,concessions` (the new bulk endpoint from H2 in the prereq plan).
2. Renders a structured `DeliberationContext` block via `state/format-for-prompt.ts`.
3. Passes this as the next agent's user-message content (along with role-specific instructions for the round).

The `DeliberationContext` is **prose-formatted** for LLM consumption, not raw JSON, because LLMs reason better over labeled prose than JSON for context windows of this size. Example skeleton:

```
## Deliberation state (round 3 of phase 3)

Fingerprint: 14 arguments (8 by Advocate A, 6 by Advocate B), 11 claims,
  CQ coverage 17/35 answered. Standing: 3 tested-survived, 6 tested-attacked,
  5 untested-default.

### Active arguments (indexed for your reference)

[#1] Advocate A — "Smartphone-based social media use is a primary cause
     of post-2012 adolescent depression."
     Scheme: cause_to_effect. Standing: tested-attacked. CQs: 1/5 answered.
     Premises: [P1, P2, P3]. Evidence: [src:haidt-2024, src:hhs-2023]
     Last move: GROUNDS by Advocate A in round 2 (answered cq_alternative_explanation).

[#2] Advocate B — ...

### Open critical questions (load-bearing first)

- Argument [#1] · cq_alternative_explanation · UNDERCUT severity HIGH
- ...

### Recent concessions
- (none in this round)

### Your task this turn
<role-specific>
```

This formatter is the most LLM-quality-sensitive component of the orchestrator. Spend time on it.

### 4.4 Module-by-module spec

| Module | Responsibility | Public surface |
|---|---|---|
| `isonomia-client.ts` | Typed wrapper over every Isonomia REST call the orchestrator makes. Handles auth header switching, retry, logging. | `client.createClaim()`, `client.createArgument()`, `client.createAttack()`, `client.fileMove()`, `client.getState()`, `client.getEvidenceContext()` |
| `anthropic-client.ts` | Thin Anthropic Messages API wrapper. Token bookkeeping. | `chat({ system, messages, model })` |
| `agents/types.ts` | `AgentRole`, `AgentTurnInput`, `AgentTurnOutput` discriminated unions per role. | Types only. |
| `agents/<role>.ts` | Per-role turn function: assembles system+user message, calls Anthropic, parses, validates. | `runTurn(input): Promise<output>` |
| `phases/phase-N-*.ts` | Orchestration logic per phase: turn ordering, termination conditions, between-turn state refresh. | `runPhase(deliberationId): Promise<PhaseResult>` |
| `translators/<kind>.ts` | Pure functions converting agent output → Isonomia API call sequences. Handle premise-claim-minting and ID resolution. | `translate(output, registry): Promise<IsonomiaCall[]>` |
| `state/refresh.ts` | Wraps the bulk state endpoint. Memoizes within a turn. | `getState(deliberationId): Promise<State>` |
| `state/format-for-prompt.ts` | Renders State → human-readable prose context block. | `format(state, role, phase, round): string` |
| `log/round-logger.ts` | JSONL writer. | `logger.event(kind, payload)` |
| `index.ts` | CLI: parses `--phase`, `--resume-from-round`, `--dry-run`. | Top-level entry. |

### 4.5 CLI shape

```bash
# From experiments/polarization-1/orchestrator/
yarn orchestrator phase 1                        # runs Phase 1 (Claim Topology)
yarn orchestrator phase 2 --max-rounds 3
yarn orchestrator phase 3 --max-rounds 6
yarn orchestrator phase 4
yarn orchestrator state                          # prints current deliberation state, no LLM calls
yarn orchestrator dry-run phase 3 --round 1      # mock Anthropic responses from fixtures
yarn orchestrator export-final-state > runtime/final-state.json   # for synthesis stage
```

`--dry-run` is critical for development: it replays canned agent outputs from `tests/fixtures/` against the real Isonomia API (which can be pointed at a local dev DB). This is how you debug translators without burning Anthropic tokens.

### 4.6 Pre-flight validation (in `index.ts`)

Before any phase command runs, the orchestrator validates:
- `runtime/agents.json` exists and all 5 tokens authenticate against `/api/me`.
- `runtime/deliberation.json` references a real deliberation the bot agents are participants of.
- `prompts/shared/scheme-catalog.json` matches a freshly-fetched `/api/schemes` (warn if the catalog has drifted; abort if any scheme key referenced in a prompt is missing).
- The bound evidence context returns ≥ N sources (configurable per topic; default 15).
- Anthropic API key is present.

Missing preconditions abort with actionable error messages.

### Effort

- Skeleton + isonomia-client + anthropic-client: 4 hours
- Translators (claim-mint, argument, attack, move): 4 hours
- Phase orchestration logic: 4 hours
- State formatter: 3 hours
- CLI + dry-run + fixtures: 3 hours
- Logging + observability: 2 hours
- **Total §1.3: ~20 hours**

This is more than the master roadmap's 4–8 hour estimate. The estimate gap is real: the master roadmap assumes "familiarity with platform APIs" (which we have) but elides the premise-claim-minting design, the state formatter, and the dry-run harness. Each of those is real work that pays back during phases 2–3.

---

## 5. §1.4 — Evidence Stack Pre-Seeding

### 5.1 Source list (`evidence/sources.csv`)

CSV columns:

| col | meaning |
|---|---|
| `citationToken` | stable short ID, e.g. `src:haidt-2024-anxious-generation` |
| `category` | `platform-internal | experimental | observational | meta-analytic | skeptical | policy-report` |
| `url` | primary URL |
| `doi` | DOI if available |
| `title` | full title |
| `authors` | semicolon-separated |
| `publishedAt` | ISO date |
| `keyFindings` | 2–3 bullet strings, semicolon-separated |
| `tags` | semicolon-separated free tags |
| `priority` | `core | supporting` — core sources must be cited by both advocates if relevant |

Target distribution (per master roadmap §1.4):
- 3–4 platform-internal (e.g. Huszár et al. 2022, Meta internal documents)
- 4–5 experimental (Bail 2018, Guess 2023×2, Levy 2021)
- 3–4 observational/cross-national (Boxell 2017, Lorenz-Spreen 2023)
- 2–3 meta-analytic / systematic reviews
- 3–4 skeptical literature (Prior 2013, Gentzkow & Shapiro)
- 2–3 policy/institutional (DSA impact, UNESCO)

**Total: 17–23 sources.** Hand-curated by the author.

### 5.2 Verification before seeding

Each row in `sources.csv` is verified manually before `setup/3-seed-evidence-stack.ts` runs:
- URL resolves and content matches title.
- DOI resolves to the same paper.
- Authors and date are correct.
- Each `keyFindings` bullet is a paraphrase of a verified finding in the source — *not* a fabricated summary.

This is the work the master roadmap calls out as the dominant Stage-1 manual effort. Budget 3–4 hours.

### 5.3 Seeding script (`setup/3-seed-evidence-stack.ts`)

```ts
// Pseudocode
const stack = await isonomia.createStack({
  name: "Polarization-1 Evidence Corpus",
  visibility: "public",      // public from the start — corpus is a deliverable
  ownerId: HUMAN_USER_ID,    // nqMa4rb8gQZ71fWLkIId4Qjqcby1
});

for (const row of sources) {
  await isonomia.addStackItem(stack.id, {
    itemKind: row.doi ? "doi" : "url",
    url: row.url,
    doi: row.doi,
    title: row.title,
    authors: row.authors.split(";"),
    publishedAt: row.publishedAt,
    keyFindings: row.keyFindings.split(";"),
    tags: row.tags.split(";"),
  });
}

await isonomia.bindEvidenceContext(deliberationId, stack.id);

// Validate
const ctx = await isonomia.getEvidenceContext(deliberationId);
assert(ctx.sources.length === sources.length);
assert(ctx.sources.every(s => s.contentSha256 || s.archive?.url));  // provenance landed
```

Provenance enrichment runs in the background per the existing pipeline; the script polls until every source has either a `contentSha256` or an `archive.url`, then writes `runtime/deliberation.json`.

### 5.4 Failure handling

- If a URL fails SSRF check: row marked `seedingError` in a sidecar log, rest continue.
- If a DOI fails to resolve: try `crossref.org/openurl` fallback; if still fails, record and continue.
- If background provenance enrichment doesn't complete within 10 min: the precheck script (§4.6) will refuse to advance to Phase 1 until at least 80% of sources have provenance. Author retries seeding for the laggards.

### Effort

- CSV authoring: 3 hours
- Manual verification: 3–4 hours
- Seed script: 1.5 hours
- Verification log writeup: 1 hour
- **Total §1.4: ~8–10 hours**

---

## 6. Setup-Phase Commands (the Stage-1 entrypoint)

```bash
# One-time
yarn setup:provision-agents     # B1 — creates 5 bots, writes runtime/agents.json
yarn setup:create-deliberation  # POST /api/deliberations + adds bots as participants
yarn setup:seed-evidence        # B2 — Stack + items + binding
yarn setup:precheck             # full pre-flight; emits READY_FOR_PHASE_1.json or aborts
```

`READY_FOR_PHASE_1.json` shape:

```json
{
  "experimentId": "polarization-1",
  "deliberationId": "delib_…",
  "stackId": "stk_…",
  "evidenceContextSourceCount": 19,
  "agents": {
    "claim-analyst":     { "userId": "bot_…", "displayName": "Claim Analyst (bot)" },
    "advocate-a":        { "userId": "bot_…", "displayName": "Advocate A (bot)" },
    "advocate-b":        { "userId": "bot_…", "displayName": "Advocate B (bot)" },
    "challenger":        { "userId": "bot_…", "displayName": "Challenger (bot)" },
    "concession-tracker":{ "userId": "bot_…", "displayName": "Concession Tracker (bot)" }
  },
  "schemeCatalogHash": "sha256:…",
  "preflightAt": "2026-05-04T…"
}
```

Phase commands in §4.5 refuse to run unless this file exists and `schemeCatalogHash` still matches the live catalog.

---

## 7. Acceptance Criteria for Stage 1

The author can declare Stage 1 done when ALL of the following hold:

1. `experiments/polarization-1/FRAMING.md` passes the 9/10 borderline-claim test from §2.
2. All 5 agent prompt files exist and have been read end-to-end at least once.
3. `prompts/shared/scheme-catalog.json` matches the live `/api/schemes` output (verified by `setup:precheck`).
4. `output-formats.json` has Zod schemas the orchestrator imports and validates against in unit tests.
5. `evidence/sources.csv` has 15–25 rows; every row's URL+DOI resolves; verification log signed off.
6. `setup:seed-evidence` ran successfully; ≥ 80% of sources have provenance (sha256 or archive snapshot).
7. `setup:precheck` exits 0 and writes `READY_FOR_PHASE_1.json`.
8. `yarn orchestrator dry-run phase 1` runs with mocked Anthropic responses and produces the expected Isonomia API call sequence (asserted in tests).
9. `yarn orchestrator phase 1` is **not** run yet — that's Stage 2.

---

## 8. Estimated Effort & Timeline

| Section | Hours |
|---|---|
| §1.1 Framing | 2 |
| §1.2 Agent prompts | 12 |
| §1.3 Orchestrator | 20 |
| §1.4 Evidence Stack | 8–10 |
| Integration + acceptance testing | 4 |
| **Total Stage 1** | **46–48 hours** |

Plus prerequisite plan items (B1, B2, B3, optionally H2): ~10–13 hours that must precede Stage 1 deliverables that depend on them.

**Calendar projection:** 7–10 focused working days for one person, spread across 2–3 calendar weeks to allow for evidence verification and prompt iteration. This is significantly more than the master roadmap's 13–18 hour estimate for §1.1–§1.4 — the gap is real and explained by:
- Premise-claim-minting design + state-formatter complexity (orchestrator)
- Output-schema design and validation harness (prompts)
- Provenance enrichment and verification (evidence)

If this timeline is uncomfortable, the highest-value cuts in priority order are:
1. Skip dry-run harness (–3h, but pay back in token costs and debug time)
2. Use raw JSON state instead of prose state formatter (–3h, but synthesis quality may suffer)
3. Reduce evidence corpus to 12–15 sources (–2h)

The framing doc, output schemas, premise-claim-minting, and concession-tracker template are not cuttable — they each compound across the whole experiment.

---

## 9. What Stage 2 Inherits

The Stage 2 roadmap (Phase 1: Claim Topology) will assume:

- The orchestrator CLI exists and `yarn orchestrator phase 1` is the only command Stage 2 needs to invoke.
- The deliberation, evidence Stack, and agents are already provisioned.
- The Claim Analyst prompt is finalized; iteration on prompt content during Stage 2 is allowed but the orchestrator interface is frozen.
- The output schema for `ClaimAnalystOutput` is locked; if it needs to change, that's a Stage-1 amendment.

---

## 10. Resolved Decisions for Stage 1

1. **Model choice (all 5 agents):** Standardize on **Claude Opus 4.x** for production / experimental runs. Per-role asymmetry deferred to a follow-up experiment.
2. **Dev/test model:** Use a **cheap/fast tier** (Claude Haiku 4.x) for any run whose purpose is wiring/correctness rather than experimental data — i.e. `--dry-run`, integration tests, smoke runs. The orchestrator exposes `--model-tier=dev|prod` (default `dev`) and refuses to run a `experimentMode: true` deliberation on `dev`. See §4.1.
3. **Bot displayNames:** All five agents carry the **`(bot)` suffix** in their `displayName` (e.g. `Claim Analyst (bot)`). Provisioning script B1 enforces this. `User.kind = "bot"` provides the structured signal; the suffix provides immediate visual provenance for any human who happens to view the room.
4. **Evidence Stack visibility:** **Public from creation.** The corpus is a research deliverable in its own right and there's no reason to hide it. Reflected in §5.3 seed-script pseudocode.
5. **Token cost ceiling:** ~$70–100 per full Opus run accepted. Dev-tier runs are ~10–20× cheaper, so unlimited within reason.

---

## Appendix A · Verified API endpoint contracts the orchestrator depends on

| Call | Endpoint | Required body | Returns |
|---|---|---|---|
| Mint Claim | `POST /api/claims` | `{ text, deliberationId?, claimType? }` | `{ claim: { id, moid, text, ... }, created }` |
| Create Argument | `POST /api/arguments` | `{ deliberationId, authorId, conclusionClaimId, premiseClaimIds[], schemeId?, slots?, text?, implicitWarrant?, premisesAreAxioms?, ruleType?, ruleName? }` | `{ argument: { id, ... }, ... }` (auto-creates `ArgumentSchemeInstance` if `schemeId` provided) |
| Create Attack | `POST /api/attacks/create` | `{ deliberationId, targetType, targetId, attackerType, attackerId, attackType, targetScope?, cqKey?, cqText?, schemeKey?, source? }` | `{ ... }` (auto-routes ClaimEdge vs ConflictApplication, auto-records DialogueMove) |
| File Move | `POST /api/dialogue/move` | `{ deliberationId, targetType, targetId, kind, payload?, replyToMoveId?, replyTarget?, postAs?, autoCompile?, autoStep?, phase? }` | `{ move: { id, ... } }` (GROUNDS auto-creates an Argument) |
| Read State (bulk) | `GET /api/v3/deliberations/{id}/state?include=…` | n/a | composite of fingerprint, frontier, missing-moves, chains, transcript, concessions |
| Evidence Context | `GET /api/deliberations/{id}/evidence-context` | n/a | `{ stack, sources[] }` |
| Schemes Catalog | `GET /api/schemes` | n/a | `[{ key, name, description, slots, criticalQuestions[] }]` |

Italicized endpoints depend on prereq items still to be built:
- `GET /api/v3/deliberations/{id}/state` — H2 (bulk endpoint)
- `GET /api/deliberations/{id}/evidence-context` — B2c

Without those, the orchestrator can still run by fanning out 4–5 sub-calls per refresh, but cleanliness suffers.
