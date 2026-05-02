# Multi-Agent Deliberation Experiment: Roadmap Outline

## Algorithmic Content Curation & Political Polarization

### Experiment via Isonomia Platform APIs

---

## 0. Experiment Summary

**Central hypothesis:** A synthesis produced by an LLM consuming a dense, dialectically-tested deliberation graph (via MCP) will be measurably superior — in claim qualification, concession tracking, uncertainty localization, evidence attribution, and actionability — to a synthesis produced from scratch by the same model on the same topic.

**Secondary hypothesis:** The value of the deliberation graph comes specifically from dialectical structure (standing states, CQ coverage, concession sequences, scheme labels), not merely from evidence access. This is testable by comparing the MCP synthesis against a synthesis given the same evidence without the dialectical metadata.

**Topic:** Algorithmic content curation and political polarization.

**Rationale for topic:** Connects to existing platform content (the living thesis demo on recommendation algorithms and democratic contexts), sits at the intersection of empirical contestation and policy relevance, has enough published evidence to ground claims but isn't so media-saturated that agents will simply recapitulate op-ed positions. Sufficient complexity to produce genuine dialectical structure across empirical, normative, and policy layers.

**Method:** Five asymmetric AI agents conduct a structured multi-round deliberation through Isonomia's production APIs. Results are verified, then consumed by a separate LLM via MCP to produce a synthesis. Three output conditions are compared.

---

## 1. Pre-Experiment Preparation

### 1.1 Central Contested Claim & Framing Document

Write a one-paragraph framing document defining the central contested claim precisely. All agents argue about this claim; vague framing causes agents to address adjacent but different questions, producing dialogue that looks productive but is ships passing.

**Candidate central claim:** "Algorithmic content curation systems, as currently deployed by major platforms, are a significant causal factor in increasing political polarization among their users."

**Framing document should specify:**
- Scope: which platforms, which populations, what time period
- What counts as "political polarization" (affective polarization, ideological sorting, belief polarization — these are different)
- What "significant causal factor" means (not merely correlated, not the sole cause, but a substantial contributor)
- What evidence types are relevant (experimental, observational, cross-national comparative, platform internal research)

**Deliverable:** `FRAMING.md` — 1 page, precise enough that two readers would agree on what claims fall inside vs. outside scope.

### 1.2 Agent System Prompts

Write five system prompts, one per agent role. Each prompt should include:

- The framing document (identical across all agents)
- The agent's specific role and constraints
- Isonomia's argumentation scheme definitions (the 60+ Walton schemes with CQ lists)
- Dialogue move type definitions (WHY, RETRACT, CONCEDE, THEREFORE, SUPPOSE)
- ASPIC+ attack type definitions (rebut, undermine, undercut)
- Output format specifications (structured JSON matching the platform's API input schemas)

**Agent roles:**

**Agent 1 — Claim Analyst (structuring, non-adversarial)**
- Decomposes the central claim into sub-claims
- Tags each sub-claim by type: empirical, normative, definitional, methodological, causal, predictive
- Proposes a claim topology (which sub-claims are independent, which depend on others)
- Does not advocate for or against any position
- Operates in Phase 1 only

**Agent 2 — Advocate A (pro-causal-link)**
- Argues that algorithmic curation is a significant causal factor in polarization
- Constraint: every argument must cite specific evidence (source, finding, date)
- Constraint: every argument must specify an argumentation scheme from the Walton taxonomy
- Constraint: must not preemptively address objections in initial arguments (let the challenger surface them)
- Operates in Phases 2–3

**Agent 3 — Advocate B (skeptical/alternative-explanations)**
- Argues that the causal link is overstated, that polarization has other primary drivers, or that the evidence is insufficient
- Same constraints as Advocate A: evidence-grounded, scheme-specified, no preemptive hedging
- Operates in Phases 2–3

**Agent 4 — Challenger (stress-testing, non-partisan)**
- Raises critical questions against arguments from both advocates
- Files WHY challenges when claims lack justification
- Identifies unanswered CQs for each scheme and targets the weakest
- Does not advocate for a position — tests whatever exists
- Critical role: must attack *both sides* to prevent the dialogue from becoming one-sided
- Operates in Phase 3

**Agent 5 — Concession Tracker (meta-dialectical)**
- Monitors the dialogue state after each Phase 3 round
- Identifies when an advocate's position has been sufficiently undermined to warrant RETRACT or scope-narrowing CONCEDE
- Proposes revised claims when concession is warranted
- Produces the final state summary in Phase 4
- Operates in Phases 3–4

**Deliverable:** Five system prompt files, each 2–4 pages, with structured output format specs.

### 1.3 API Integration Layer

Build (or script) the glue between the Anthropic API and Isonomia's platform APIs, so that agent outputs translate directly into platform actions.

**Required API endpoints to integrate:**

- `POST /api/deliberations` — Create the deliberation room
- `POST /api/deliberations/[id]/claims` — File claim atoms
- `POST /api/deliberations/[id]/arguments` — Create scheme-annotated arguments (conclusion, premises, warrant, scheme, evidence)
- `POST /api/deliberations/[id]/attacks` — File ASPIC+ attacks (rebut, undermine, undercut with target selection)
- Dialogue action endpoints — File WHY, CONCEDE, RETRACT moves
- `GET /api/deliberations/[id]/arguments` — Retrieve current argument state for agent context windows

**Implementation approach:**

- A Node/TS orchestrator script that:
  1. Calls the Anthropic API with the appropriate agent system prompt + current deliberation state
  2. Parses the agent's structured JSON output
  3. Translates it into the appropriate Isonomia API call(s)
  4. Records the round for logging/debugging
  5. Fetches updated deliberation state for the next agent's context

- The orchestrator manages turn order and phase transitions
- Each round's full state is logged (agent input context, raw output, API calls made, API responses)

**Deliverable:** `orchestrator.ts` — script that manages the agent-platform loop.

### 1.4 Evidence Source List (Pre-Seeding)

Compile a reference list of 15–25 key sources on algorithmic curation and polarization. These serve two purposes: giving the advocate agents real sources to cite (reducing hallucination risk) and providing the evidence verification baseline.

**Source categories to cover:**
- Platform internal research (Facebook whistleblower documents, Twitter algorithmic amplification study — Huszár et al. 2022)
- Experimental studies (Bail et al. 2018 — exposure to opposing views; Guess et al. 2023 — Facebook/Instagram deactivation experiments)
- Observational/cross-national studies (Boxell et al. 2017 — polarization trends in countries with varying internet penetration)
- Review/meta-analyses (Lorenz-Spreen et al. 2023 systematic review)
- Critical/skeptical literature (Prior 2013 on media choice; Gentzkow & Shapiro on echo chambers)
- Policy/institutional reports (EU DSA impact assessments, UNESCO reports)

**Implementation:** Ingest these into a dedicated Isonomia Stack with citation anchors, so advocates can cite them with platform-native provenance. This also tests the Stacks→Deliberation evidence flow.

**Deliverable:** Populated Isonomia Stack with 15–25 sources, each with at least one key finding annotated.

---

## 2. Dialogue Execution

### Phase 1: Claim Topology (1 round)

**Actor:** Agent 1 (Claim Analyst)

**Process:**
1. Feed the framing document to the Claim Analyst
2. Agent decomposes the central claim into 6–10 sub-claims
3. Each sub-claim is typed (empirical/normative/definitional/causal/methodological)
4. Agent proposes dependency structure (which sub-claims support or presuppose others)
5. Advocates review and can propose additions (1 response each)

**Platform actions:**
- Create the deliberation room
- File each sub-claim via the claims API
- Tag claims with types and domain tags

**Termination:** Claim map agreed by all agents (or after advocate additions).

**Deliverable:** A populated claim topology in the deliberation room with 6–10 typed, tagged claims.

### Phase 2: Initial Argumentation (2–3 rounds)

**Actors:** Agents 2 & 3 (Advocates A & B)

**Process:**
1. Each advocate selects sub-claims relevant to their position
2. Each advocate constructs 4–6 scheme-annotated arguments, each grounded in evidence from the pre-seeded Stack
3. Arguments specify: conclusion (linked to a claim), premises (with source citations), argumentation scheme, and evidence links
4. No attacks filed in this phase — advocates build their positive cases
5. Multiple rounds if needed to cover core sub-claims

**Per-argument output format (from agent, translated to API):**
```
{
  conclusion: "claim text",
  premises: ["premise 1 text", "premise 2 text"],
  scheme: "cause_to_effect" | "expert_opinion" | "sign" | etc.,
  evidence: [{ source_id, passage, page }],
  warrant: "implicit warrant text" | null
}
```

**Constraints:**
- Maximum 5–8 arguments per advocate (keeps evidence verification manageable)
- Each argument must cite at least one source from the pre-seeded Stack
- Scheme must be selected from Walton taxonomy, not invented

**Platform actions:**
- Create arguments via the arguments API with scheme classification
- Link evidence citations to Stack sources
- All arguments enter at `untested-default` standing

**Termination:** Both advocates have filed arguments covering their core sub-claims, or 3 rounds elapsed.

**Deliverable:** 8–16 scheme-annotated arguments in the deliberation room, all at `untested-default`.

### ⚠ Evidence Verification Checkpoint #1

**Actor:** Human

**Process:**
1. Export all citations from Phase 2 arguments
2. For each citation: verify source exists, verify the cited finding is accurately characterized, verify the statistical claim (if any) is correct
3. Flag any fabricated or mischaracterized evidence
4. For flagged items: either correct with a real source (if one supports the claim) or remove the argument

**Expected effort:** 1–3 hours depending on citation count (target: 15–30 citations total across both advocates).

**Deliverable:** Verification log with pass/fail per citation. Corrected or removed arguments as needed.

### Phase 3: Dialectical Testing (4–6 rounds)

**Actors:** Agents 2, 3, 4, 5 (Advocates, Challenger, Concession Tracker)

**Round structure (repeats 4–6 times):**

1. **Challenger turn:** Agent 4 reviews current argument state. For each argument, identifies the weakest unanswered critical question based on the scheme's CQ list. Files 2–4 challenges per round (WHY moves, CQ-targeted attacks). Attacks must specify: target argument, attack type (rebut/undermine/undercut), and the specific CQ or premise being challenged.

2. **Advocate response turns:** Each advocate responds to challenges against their arguments. Available moves:
   - Provide Grounds — answer the challenge with new evidence or reasoning
   - Answer Clarification — respond to a clarification request
   - Defend Premise — argue in support of a challenged premise
   - Rebut Exception — counter a counterexample
   - Add Evidence — provide additional supporting evidence
   - Or: decline to respond (which the concession tracker will note)

3. **Concession Tracker turn:** Agent 5 reviews the round's exchanges. Assesses whether any advocate should:
   - RETRACT a claim (the challenge was decisive and unanswered)
   - CONCEDE a qualified version (the universal claim fails but a narrower version holds)
   - Narrow scope (the claim holds for a specific population/platform/time period but not generally)
   Proposes specific revised claim text when concession is warranted.

4. **Advocate concession response:** Advocates accept or reject proposed concessions. If accepted, the CONCEDE or RETRACT is filed via the dialogue action endpoints.

**Platform actions per round:**
- File attacks via attacks API (rebut/undermine/undercut)
- File dialogue moves (WHY challenges, CONCEDE, RETRACT)
- Advocates create new arguments or file defense responses
- Standing states update based on dialectical interaction (arguments move from `untested-default` to `tested-*` states)

**Termination conditions (whichever comes first):**
- All CQs for all arguments are either answered or have produced a concession
- 6 rounds completed
- Two consecutive rounds produce no new substantive moves (fixed point)

**Deliverable:** A fully tested deliberation with standing states, attack registers, concession history, and CQ coverage data — all tracked by the platform's production machinery.

### ⚠ Evidence Verification Checkpoint #2

**Actor:** Human

**Process:** Same as Checkpoint #1, but for any new citations introduced during Phase 3 (evidence added in defense of challenged arguments).

**Expected effort:** 30–90 minutes (fewer new citations than Phase 2).

### Phase 4: Synthesis Preparation (1 round)

**Actor:** Agent 5 (Concession Tracker)

**Process:**
1. Produce a structured state summary of the deliberation:
   - Claims: original vs. conceded/narrowed versions, with concession rationale
   - Arguments: standing state, CQ coverage, evidence density, attack history
   - Open questions: CQs that were raised but never answered
   - Dialectical trajectory: what moved, what didn't, where positions converged
2. This summary is *not* the synthesis — it's the structured input that the synthesis LLM will consume via MCP

**Platform actions:**
- No new deliberation actions
- Summary exported as a structured document attached to the deliberation

**Deliverable:** Final state summary in the deliberation room.

---

## 3. Synthesis Evaluation

### 3.1 Three Output Conditions

**Condition A — Unassisted baseline (control):**
- Fresh Opus instance, no Isonomia access, no special evidence
- Prompt: "What is the current state of evidence and debate on whether algorithmic content curation causes political polarization? Provide a synthesis suitable for a policy-maker or educator."
- This may already be partially available from the incognito test; re-run with the exact prompt for consistency

**Condition B — MCP synthesis from deliberation (treatment):**
- Fresh Opus instance with MCP access to the populated deliberation room
- Prompt: "Using the Isonomia deliberation on algorithmic content curation and political polarization, assess the arguments, evaluate which positions have survived dialectical testing, and produce a synthesis suitable for a policy-maker or educator. Be specific about what has been conceded, what remains contested, and what critical questions are still open."
- The model uses `search_arguments`, `find_counterarguments`, `get_argument`, `get_claim` MCP tools to explore the deliberation

**Condition C — Evidence-only control (isolating dialectical structure):**
- Fresh Opus instance, no Isonomia access, but given the same source evidence as a structured reading list
- Provide: the verified citations from the pre-seeded Stack, with key findings summarized
- Do NOT provide: standing states, CQ status, concession history, scheme labels, attack registers
- Prompt: identical to Condition B but referencing the evidence list instead of Isonomia
- This isolates whether value comes from dialectical metadata or evidence access

### 3.2 Evaluation Dimensions

Each output is evaluated on five dimensions:

1. **Claim qualification precision:** Does the synthesis specify exactly what is and isn't supported, with explicit scope conditions? Or does it gesture vaguely at "nuance" and "it's complicated"?

2. **Concession tracking:** Does the synthesis report what was conceded and why, showing how positions evolved? Or does it present only final positions as if they were always the view?

3. **Uncertainty localization:** Does the synthesis identify *specific* open questions (named CQs, unresolved empirical disputes)? Or does it hedge globally ("more research is needed")?

4. **Evidence attribution:** Are claims grounded in specific sources with enough detail to verify? Or attributed to "studies show" and "researchers have found"?

5. **Actionability:** Could a policy-maker or educator take specific action based on the synthesis's recommendations? Or only on its general vibes?

### 3.3 Evaluation Method

**Option A — Self-evaluation (minimum viable):**
- Score each output on each dimension (1–5 scale) with written justification
- Fastest but least credible; useful for internal iteration

**Option B — Blind expert evaluation (recommended):**
- Present all three outputs to 3–5 domain-knowledgeable readers
- Randomize order and remove identifying information (no mention of "Isonomia," "MCP," or "deliberation" in the outputs)
- Each reader ranks the three outputs on each dimension
- Readers drawn from: CS&S advisory network, COMMA contacts, deliberative democracy practitioners from outreach list
- Small sample but produces externally credible results

**Option C — Hybrid:**
- Self-evaluation for rapid iteration
- Blind expert evaluation for the final write-up

### 3.4 Success Criteria

The experiment supports the platform's value proposition if:
- Condition B > Condition A on at least 3 of 5 dimensions (deliberation-mediated synthesis beats unassisted)
- Condition B > Condition C on at least 2 of 5 dimensions (dialectical structure adds value beyond evidence access alone)
- The dimensions where B outperforms are specifically claim qualification, concession tracking, and uncertainty localization (the structurally-grounded dimensions, not just evidence attribution)

The experiment is *most* informative if it also reveals:
- Which dimensions show the largest gap (tells you where the platform's value is concentrated)
- Whether Condition C ≈ Condition A (evidence alone doesn't help much) or C > A (evidence helps but structure helps more) — both are interesting findings with different implications

---

## 4. Post-Experiment Outputs

### 4.1 The Deliberation Itself

The populated deliberation room is a permanent platform artifact: the first fully-realized multi-agent deliberation on Isonomia. With evidence verified and standing states computed, it serves as:
- A demo for the CS&S application (concrete evidence of what the platform produces)
- MCP demo content (richer than the current smartphone debate — more arguments, actual tested-survived/tested-attacked standings from dialectical interaction, concession history)
- Embeddable argument cards for the distribution layer
- Potential source for a living thesis on the topic

### 4.2 Experiment Write-Up

A document covering: hypothesis, method, results, and implications. Dual-purpose:

**For CS&S application:** Demonstrates the platform's value proposition empirically. Shows that structured deliberation produces measurably different (and on specific dimensions, superior) outputs compared to unstructured LLM synthesis. Addresses the cold-start question by showing that the multi-agent approach can bootstrap deliberation density while the standing system correctly distinguishes simulated from genuine dialectical testing.

**For COMMA / academic outreach:** A short paper or extended abstract on "Structured Deliberation as LLM Substrate: Does Dialectical Metadata Improve AI-Generated Policy Synthesis?" Directly relevant to the computational argumentation community's interest in practical applications of ASPIC+ and Walton schemes.

**For the blog / public communication:** A more accessible version: "We had five AI agents argue about whether social media algorithms cause polarization, then asked a sixth AI to read the debate and write a summary. Here's what happened — and why it matters that the arguing was structured."

### 4.3 Methodology Artifact

The orchestrator script, system prompts, and evaluation rubric become reusable infrastructure for running future multi-agent experiments on other topics. This is the beginning of the "AI-seeded deliberation" capability from the extraction pipeline roadmap (Section 10.5 — AI-authored arguments with first-class provenance), implemented through the experiment rather than as a standalone feature.

---

## 5. Estimated Timeline & Effort

| Phase | Task | Est. Effort | Dependencies |
|---|---|---|---|
| 1.1 | Framing document | 2 hours | None |
| 1.2 | Agent system prompts (5) | 4–6 hours | 1.1, scheme definitions |
| 1.3 | Orchestrator script | 4–8 hours | Familiarity with platform APIs |
| 1.4 | Evidence source list & Stack | 3–4 hours | 1.1 |
| 2.P1 | Claim topology (run) | 1 hour | 1.1–1.4 |
| 2.P2 | Initial argumentation (run) | 2–3 hours | P1 |
| 2.V1 | Evidence verification #1 | 1–3 hours | P2 |
| 2.P3 | Dialectical testing (run) | 3–5 hours | V1 |
| 2.V2 | Evidence verification #2 | 0.5–1.5 hours | P3 |
| 2.P4 | Synthesis preparation (run) | 1 hour | P3 |
| 3 | Run three synthesis conditions | 1–2 hours | P4 |
| 3.3 | Evaluation (self or blind) | 2–6 hours | 3 |
| 4 | Write-up | 4–8 hours | 3.3 |
| | **Total** | **~25–45 hours** | |

Approximately 3–5 focused working days. Can be spread across 1–2 weeks.

---

## 6. Risk Register

| Risk | Impact | Mitigation |
|---|---|---|
| Agent hallucination of evidence | Fabricated citations enter deliberation base, corrupting provenance | Evidence verification checkpoints; pre-seeded Stack limits citation scope |
| Agents converge on training-data consensus | Dialogue looks productive but produces no genuine dialectical tension | Asymmetric role design; Challenger agent attacks both sides; Concession Tracker enforces position movement |
| Orchestrator bugs corrupt deliberation state | Invalid API calls produce malformed arguments or broken attack relations | Log every API call/response; dry-run with a test deliberation first |
| Evidence verification bottleneck | Manual citation checking takes longer than expected | Limit advocates to 5–8 arguments each; use pre-seeded Stack to constrain citation space |
| Synthesis evaluation is inconclusive | All three conditions produce roughly equivalent outputs | Still informative — tells you that on this topic, dialectical structure doesn't add much. Document as a finding, not a failure |
| Blind evaluators unavailable | Can't recruit 3–5 readers in time | Fall back to self-evaluation for initial pass; pursue blind evaluation for write-up |
| MCP tool surface doesn't expose enough data | Synthesizing LLM can't access concession history, CQ status, or standing metadata | Check MCP tool coverage before running Condition B; extend tools if needed (this becomes a platform improvement item) |

---

## 7. Decision Log

Decisions made in this conversation that should be preserved:

| Decision | Rationale | Date |
|---|---|---|
| Topic: algorithmic curation & polarization | Connects to existing platform content (living thesis demos); empirically contested; sufficient evidence base; not over-saturated in training data | 2026-05-01 |
| Use platform production APIs, not scratch | Produces genuine deliberation records with hash chains, standing states, fitness scores; MCP consumer sees real platform data; avoids curation confound | 2026-05-01 |
| Five asymmetric agents, not two symmetric debaters | Avoids performative disagreement; separates structuring, advocating, challenging, and concession-tracking roles; challenger attacks both sides | 2026-05-01 |
| Evidence verification as mandatory human step | Prevents hallucination propagation through agent dialogue; essential for credibility of results | 2026-05-01 |
| Three-condition comparison (A/B/C) | Isolates dialectical structure value from evidence access value; makes results interpretable | 2026-05-01 |
| Pre-seed evidence into Isonomia Stack | Reduces hallucination risk; tests Stacks→Deliberation evidence flow; gives advocates real sources | 2026-05-01 |