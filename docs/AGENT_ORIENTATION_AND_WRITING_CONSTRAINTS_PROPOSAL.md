# Agent Orientation & Writing-Constraints Proposal

**Target:** `packages/isonomia-mcp/src/server.ts` + `app/api/v3/deliberations/[id]/synthetic-readout/route.ts`
**Motivates:** Claude cold-start eval (`experiments/Claude-ISONOMIA_TOOL-feedback-May11v1.md`, lines 328–367). Backlog rows T2.3 (tiered readout) and T3.* (decision-tree / orientation).
**Status:** Draft for review. No code touched yet.

---

## Why

Claude's cold-start eval found that the MCP tool descriptions are accurate per-tool but silent on the framework — `standing`, `MOID`, `refusalSurface`, `chainStanding`, `weakestLink`, depth tiers all had to be reverse-engineered from field names. The fix is three things:

1. A **server-level instructions block** carrying a tight ontology + the "call `get_orientation` first" pointer (~400 tokens, always loaded via MCP `InitializeResult.instructions`).
2. A **`get_orientation` tool** returning the long-form glossary + workflow recipes (~1.5K tokens, opt-in).
3. A **`writingConstraints` object** injected into `get_synthetic_readout` so refusal-surface compliance becomes a contract the agent follows mechanically rather than a comprehension task.

(1) and (2) are pure-content additions. (3) is the small server-side change that does the most to actually shape agent output.

---

## Part 1 — Server `instructions` block (always loaded)

Goes into `new Server({ name, version }, { capabilities: { tools: {} }, instructions: "…" })` in `packages/isonomia-mcp/src/server.ts` ~line 956. MCP clients surface this string to the model on session init.

```text
Isonomia exposes a deliberation as a typed argument graph.

ONTOLOGY (read once):
A deliberation contains arguments. Each argument has a conclusion (a claim,
identified by content-derived MOID — multiple arguments can share one), one or
more premises, and an argumentation scheme (the reasoning pattern: expert-opinion,
analogy, cause-to-effect, IBE, etc.). Arguments connect via typed edges:
support, rebut (attack the conclusion), undercut (attack the inference),
undermine (attack a premise). Each argument carries a STANDING that progresses
untested-default → untested-supported → tested-attacked → tested-undermined →
tested-survived, and a depth tier (thin / moderate / dense) recording how many
independent challengers have engaged. Standing without depth is unreliable:
"tested-undermined by 1 thin challenger" ≠ "tested-undermined by 10 dense ones".
Each scheme has CRITICAL QUESTIONS the literature requires for the scheme to hold;
unanswered CQs are tracked per argument. CHAINS are editor-curated paths through
the graph (premises → conclusion); chainStanding is worst-link, not average.
The REFUSAL SURFACE lists conclusions the graph cannot currently license because
of unanswered attacks; entries are hard constraints, not suggestions.

TOOL SELECTION:
Use IDs correctly — `get_argument` takes an argument id, `find_counterarguments`
takes a claim MOID. They are not interchangeable.

WORKFLOW:
For any deliberation question, call `get_orientation` once, then
`get_synthetic_readout` once. Read its `writingConstraints` before composing
output — it tells you what you must include, what you must not assert, and
what you must hedge. Drill into specific arguments with `get_argument` and
specific claims with `find_counterarguments` only after orientation.
```

Token cost: ~380 tokens. Loaded once per session.

---

## Part 2 — `get_orientation` tool

New tool, no arguments, returns a constant payload. Add to the tool array in `packages/isonomia-mcp/src/server.ts`.

### Tool description (~80 tokens)

```text
Returns the operational glossary, workflow recipes, and worked examples for
this MCP server. Call once at session start before any other Isonomia tool;
costs ~1.5K tokens but eliminates the cold-start round-trips needed to infer
field semantics. Skip on subsequent sessions if the agent already knows the
ontology.
```

### Returned payload (verbatim, structured as Markdown for the model)

```markdown
# Isonomia Agent Orientation

## Glossary (operational meanings)

- **argument** — A scheme-typed inference: premises + conclusion + scheme key.
  Identified by an `id` (cuid). Use this id with `get_argument`, `cite_argument`,
  `get_chains` (within `chains[].edges`).

- **claim / MOID** — A conclusion's content-derived identifier. Multiple
  arguments can share a MOID (different reasonings, same conclusion). Use this
  with `find_counterarguments` and `get_claim`. Do not pass an argument id where
  a MOID is expected.

- **scheme** — The reasoning pattern. Examples: `expert_opinion`, `analogy`,
  `cause_to_effect`, `inference_to_best_explanation`. Each scheme has its own
  catalog of critical questions.

- **standing** — Lifecycle label, ordered:
  `untested-default` < `untested-supported` < `tested-attacked` <
  `tested-undermined` < `tested-survived`. Operational meaning when writing:
  - `untested-*`: do not assert as established. "X has been argued" is fine;
    "X is shown" is not.
  - `tested-attacked`: under active challenge, no resolution. Hedge.
  - `tested-undermined`: an attack has succeeded against this argument's
    premise/inference and has not been answered. Do NOT cite as evidence for
    the conclusion. Cite as "this line of reasoning is currently undermined."
  - `tested-survived`: an attack was raised and answered. May cite as standing
    evidence — but check `standingDepth` first.

- **standingDepth** — `{ tier: "thin" | "moderate" | "dense", challengerCount,
  reviewerCount }`. A `tested-survived` at `thin` depth (1 challenger) is much
  weaker than at `dense` (≥3 independent challengers + ≥2 reviewers). Always
  qualify standing claims by depth.

- **fitness** — A weighted sum (NOT a probability, NOT 0-1). Negative means
  inbound attacks outweigh supports. Components are in `fitnessBreakdown`.
  Inbound attacks are weighted by attacker standing — refuted attackers
  contribute ≈0, unanswered contribute full weight.

- **chain** — Editor-curated traversal of the graph from premises to a
  conclusion. `chainStanding` is the WORST-link standing in the chain (not
  average). `weakestLink` names the bottleneck argument.

- **refusalSurface** — `{ cannotConcludeBecause: [{ claimMoid, blockedBy,
  blockerIds, blockerSummaries }] }`. Conclusions the graph cannot license.
  These are hard constraints — your output must not assert any listed
  conclusion. Use `blockerSummaries` to name the obstacle in prose.

- **honestyLine** — A deterministic single-sentence caveat keyed on
  `contentHash`. Include verbatim in any synthesis output.

- **frontier** — Open dialectical edges: `unansweredUndercuts`,
  `unansweredUndermines`, `unansweredCqs`. Each carries a `schemeTypical` flag
  — true means the catalog expected this challenge and nobody raised it.

- **missingMoves** — Catalog-vs-actual diff. `missingCqs`,
  `missingUndercutTypes`, plus deliberation-level rollups
  (`metaArgumentsAbsent`, `crossSchemeMediatorsAbsent`).

- **writingConstraints** — Pre-computed compliance contract on the readout.
  Read this BEFORE composing output; see Part 3 below.

## Workflow recipes

### Recipe A — Synthesize the state of a debate

1. `get_synthetic_readout(deliberationId)`.
2. Read `writingConstraints`:
   - Insert `mustInclude.honestyLine` verbatim into your output.
   - Do not assert any claim listed in `mustNotAssert`.
   - Hedge any claim listed in `shouldHedge` with the supplied phrasing hint.
3. For structure, walk `chains[]` in order — each has `weakestLink` and
   `chainStanding`. Frame each chain by what survives, not just what's claimed.
4. Use `topArguments` for load-bearing premises, `mostContested` for active
   disputes. Do NOT call `get_argument` per node — they're hydrated.
5. Stop. Do not invent a closer; localize uncertainty to specific claims.

### Recipe B — Explore "what's pushing back on claim X?"

1. From the readout (or `get_claim`), get the claim's MOID.
2. `find_counterarguments(claimMoid, deliberationId)` — pass deliberationId to
   scope to this debate (omit it for cross-deliberation discovery, which is a
   different question).
3. For each returned counterargument, check its `standing` and `standingDepth`
   before treating it as a real challenge. A `untested-default` counterargument
   is a registered objection, not a proven one.

### Recipe C — Walk a chain step by step

1. From the readout, pick a `chains[i]` by id.
2. The chain's `edges[]` is in topological order. Each edge has
   `{ from, to, edgeType }` where edgeType ∈ support/rebut/undercut/undermine.
3. The chain's nodes are hydrated in `chains[i].nodes[]` with `argumentText`,
   `standing`, `standingDepth`. Walk in order; narrate each edge as
   "X supports Y" / "X undercuts Y's inference" / etc.
4. The `weakestLink` is the node where the chain's standing collapses — start
   diagnosis there.

### Recipe D — Help answer an open critical question

1. `get_synthetic_readout` → `frontier.unansweredCqs[]` lists open CQs by
   argument id and CQ key.
2. `get_argument(argumentId)` to fetch the full attestation (premises,
   conclusion, scheme, evidence).
3. The CQ key maps to the scheme catalog — its meaning is determined by the
   scheme, not by the argument. Treat the CQ as: "what would the literature
   require to answer this for THIS scheme on THIS argument?"
4. If composing a draft answer, structure it as a new argument that either
   supports the original (CQ-as-rebutted) or as an undercut of the original
   (CQ-as-conceded). Do not write CQ answers as free-form commentary.

## Things to avoid

- Synthesizing from raw `search_arguments` hits when `get_synthetic_readout`
  is available. The readout is the editorial primitive; search is for lookup.
- Treating `tested-undermined` as "weak but cite-able." It means an attack
  has succeeded and not been answered. Do not use it as supporting evidence.
- Conflating argument-as-stated with argument-as-tested. A 143-argument
  deliberation with `depthDistribution.thin` dominant is articulation-stage,
  not deliberation-stage; standing labels mean less.
- Asserting a claim listed in `refusalSurface.cannotConcludeBecause`. Even
  with strong-looking supports, the unanswered attacks are dispositive.
- Inventing argument or chain IDs. All references must come from tool output.
```

Token cost: ~1500 tokens. Loaded only when the agent calls `get_orientation`.

---

## Part 3 — `writingConstraints` block on the readout

The single highest-leverage server-side change. Add to the synthetic-readout response so the agent's compliance task becomes "follow the contract" instead of "interpret refusal-surface semantics."

### Shape

Append to the top-level readout response:

```ts
type WritingConstraints = {
  /** Things the agent's output MUST include verbatim or by reference. */
  mustInclude: {
    honestyLine: string;                        // verbatim sentence
    refusalNotice?: string | null;              // pre-rendered "this debate cannot be closed because..." sentence when refusalSurface non-empty
  };
  /** Claims (by MOID) the agent MUST NOT assert as established.
   *  Derived from refusalSurface.cannotConcludeBecause. */
  mustNotAssert: Array<{
    claimMoid: string;
    claimTextPreview: string;                   // ≤160 chars
    reason: string;                             // pre-rendered "blocked by N unanswered undercuts on argument cmox..."
    blockerIds: string[];
  }>;
  /** Claims the agent MUST hedge when discussing.
   *  Derived from arguments at tested-undermined / tested-attacked, or
   *  arguments at any standing with thin depth. */
  shouldHedge: Array<{
    target: { kind: "argument" | "claim"; id: string };
    standing: string;                           // e.g. "tested-undermined"
    depthTier: "thin" | "moderate" | "dense";
    suggestedFraming: string;                   // e.g. "this argument is currently challenged by 3 unanswered objections"
  }>;
  /** Whole-deliberation framing the agent should adopt. */
  framing: {
    stage: "articulation" | "deliberation" | "matured";  // derived from depthDistribution
    advisoryNote: string;                                 // e.g. "depthDistribution.thin dominant — frame as articulation, not consensus"
  };
};
```

### Derivation rules (deterministic, no LLM)

| Field | Rule |
|---|---|
| `mustInclude.honestyLine` | Existing `honestyLine` field, copied. |
| `mustInclude.refusalNotice` | Non-null iff `refusalSurface.cannotConcludeBecause.length > 0`. Template: `"This deliberation has {N} blocked conclusion(s); {M} are load-bearing for the question as framed."` |
| `mustNotAssert[]` | One entry per `refusalSurface.cannotConcludeBecause[i]`. `reason` rendered from `blockedBy` + first `blockerSummaries` entry. |
| `shouldHedge[]` | Union of: arguments where `standing ∈ {tested-undermined, tested-attacked}`, and arguments where `standingDepth.tier === "thin"` regardless of standing. Cap at top 25 by `loadBearingness` so the list stays bounded. |
| `framing.stage` | `articulation` if `depthDistribution.thin / argumentCount > 0.5`; `matured` if `depthDistribution.dense / argumentCount > 0.3`; else `deliberation`. |
| `framing.advisoryNote` | Templated from chosen stage. |

### Why this matters

Today, an agent gets the data it needs (refusal surface, standings, depths) but has to *interpret* it into writing rules. That interpretation is where the eval shows agents fail — Claude correctly read the refusal surface but the prose-output paths (Essay view, etc.) don't honor standings. With `writingConstraints`, the rules are pre-rendered. Even an agent that skipped orientation can comply by literally substituting `mustInclude.honestyLine` and skipping anything in `mustNotAssert`.

### Cost

- Server-side compute: O(refusalSurface + topArguments) — already in memory when the readout is built. Negligible.
- Payload size: ~2-4 KB on a typical readout. Acceptable.
- Risk: low. Additive field; existing consumers ignore it.

---

## Part 4 — Per-tool description tweaks (smallest delta)

For each tool that returns standing-bearing data, append one line of the form:

```text
→ next: read writingConstraints before composing output; drill with get_argument/find_counterarguments only as needed.
```

Cuts ~30 tokens off the average tool description that currently re-explains
standing inline; net token savings on the tool list.

---

## Implementation order (recommended)

If we ship before the citation engine work:

1. **Part 3 first** (`writingConstraints` derivation in
   `app/api/v3/deliberations/[id]/synthetic-readout/route.ts`). Pure server
   change, no MCP edits, immediately improves output quality for every existing
   client. ~½ day.
2. **Part 1** (server `instructions` block in
   `packages/isonomia-mcp/src/server.ts`). Pure content. ~30 min.
3. **Part 2** (`get_orientation` tool). Pure content + 20 lines of plumbing.
   ~½ hour.
4. **Part 4** (per-tool `→ next` hints). Mechanical edit pass. ~30 min.

Total: ~1 day end-to-end.

## What this defers

- T2.3 tiered readout (`?view=summary`). `writingConstraints` partially
  obviates the urgency — the issue isn't payload size, it's compliance.
  Tiered views still worth doing later for token economy on simple summary
  questions.
- T3.3 interactive query tool. Still useful but lower priority once
  orientation lands.
- A Markdown agent-playbook doc. The `get_orientation` payload IS the
  playbook; no need for a duplicate static doc.

## Open questions

- Should `writingConstraints.shouldHedge` include suggested phrasing per
  standing label (more prescriptive) or just flag the target (lighter touch)?
  Drafted as prescriptive above; willing to soften.
    - keep it prescriptive for now
- Should `get_orientation` return a contentHash so agents can cache it
  per-server-version? Probably yes; ~5 lines.
    - yes
- Do we want a `get_orientation` *prompt* (MCP `prompts` capability) in
  addition to the tool, so clients that surface prompts can offer it as a
  one-click action? Defer; tool form is enough for v1.
```
    - defer