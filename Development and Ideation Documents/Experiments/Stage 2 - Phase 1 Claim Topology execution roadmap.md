# Stage 2: Phase 1 — Claim Topology Execution Roadmap

**Companion to:**
- `Multi agent deliberation experiment roadmap.md` (Section 2 → Phase 1)
- `Stage 1 - Pre-experiment dev roadmap.md` (consumes its outputs)

**Date:** May 3, 2026
**Status:** Planning — depends on Stage 1 completion
**Prereq state assumed at Stage 2 start:**
- `READY_FOR_PHASE_1.json` exists and validates
- Orchestrator CLI is built, dry-run-tested, and frozen at the public-API surface
- `1-claim-analyst.md` prompt and `ClaimAnalystOutput` Zod schema are committed
- Evidence Stack is bound to the deliberation
- Five bot agents are provisioned, each with a working bearer token

---

## 0. What "Stage 2 done" means

When Stage 2 is complete, the deliberation room contains:
1. A **central claim** (representative claim, root of the topology)
2. **6–10 typed sub-claims**, each minted as a Claim and added to the deliberation
3. A **dependency edge structure** between sub-claims, persisted as ClaimEdges
4. A **review report** at `runtime/reviews/phase-1-review.md` with all soft-flag verdicts filled in
5. A **`PHASE_1_COMPLETE.json`** gate file with the canonical claim-index → claim.id mapping that Stage 3 (Phase 2) will use to address sub-claims by stable index

You can run a single command — `yarn orchestrator phase 1 --model-tier=prod` — and produce all of the above with one human review checkpoint in the middle.

This is the experiment's first real run. Token cost is small (one Opus call for the Claim Analyst). The risk is low. The point of Stage 2 is to **prove the orchestrator round-trip works end-to-end against the live deliberation** before we spend Phase 2's larger token budget.

---

## 1. Phase 1 in one diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                         PHASE 1 CONTROL FLOW                      │
└──────────────────────────────────────────────────────────────────┘

  preflight              (validates READY_FOR_PHASE_1.json,
       │                  checks scheme catalog, checks bound stack)
       ▼
  build-context          (loads FRAMING.md + central claim +
       │                  evidence-corpus overview)
       ▼
  claim-analyst.runTurn  ───► Anthropic Opus 4.x ───► raw text
       │                                                  │
       │                                                  ▼
       │                                       parse + validate
       │                                       (Zod hard-track)
       │                                                  │
       │                            ┌────── retry once ◄──┘
       │                            │   (on hard-fail)
       │                            ▼
       │                  ClaimAnalystOutput JSON
       │                            │
       ▼                            ▼
  reviewChecks (soft-track)  →  emit review_flag events
       │                            │
       ▼                            ▼
  translators/topology.ts:
       1. mint root Claim from CENTRAL_CLAIM
       2. for each subClaim: mint Claim (idempotent via mintClaimMoid)
       3. for each subClaim with dependsOn: file ClaimEdge(supports/presupposes)
       4. record canonical index → claim.id map
       │
       ▼
  log round-summary JSON
       │
       ▼
  write PHASE_1_PARTIAL.json   ◄── (state is on-disk; safe to abort here)
       │
       ▼
  yarn orchestrator review --phase 1
       │
       │  (human fills in verdicts: accept | revise | retract)
       │
       ▼
  apply-review-verdicts:
       - "accept" → no-op
       - "revise" → re-prompt Claim Analyst with correction context;
                    re-mint affected sub-claim(s) (deduplicated by hash)
       - "retract" → DELETE filed Claim + dependent edges
       │
       ▼
  finalize: write PHASE_1_COMPLETE.json
       │
       ▼
  STAGE 2 DONE → ready for Stage 3 (Phase 2 Initial Argumentation)
```

---

## 2. The master-roadmap delta we are explicitly handling

The master roadmap (§Phase 1) says:

> "Advocates review and can propose additions (1 response each)"

**We are deferring this to Stage 2.5 or skipping it for v1.** Reasoning:

- The master roadmap's "advocate review" step muddies the role boundaries: in Phase 1, Advocates A and B are supposed to be silent. If they propose sub-claim additions, they are implicitly arguing for which dimensions of the central claim deserve attention — which biases the topology before Phase 2 even starts.
- Better v1 behavior: Phase 1 is **Claim Analyst only**. The human author plays the role of "advocate review" via the soft-flag review pass (§4.4 below). If the topology is missing a dimension a thoughtful person would expect, the author flags the absence and re-prompts.
- This is documented as **Open Question Q1** at the end of this doc; if v2 wants advocate-additions back, it's a small orchestrator extension.

---

## 3. Module-by-module work

This is what gets built in Stage 2 (most of it is the small last mile on top of Stage 1's orchestrator skeleton).

### 3.1 `phases/phase-1-topology.ts`

**Public surface:**
```ts
export async function runPhase1(opts: {
  deliberationId: string;
  modelTier: "dev" | "prod";
  resume?: boolean;          // honor PHASE_1_PARTIAL.json if present
}): Promise<Phase1Result>
```

**`Phase1Result`:**
```ts
type Phase1Result = {
  rootClaimId: string;
  subClaims: Array<{ index: number; claimId: string; layer: Layer; claimType: string }>;
  edges: Array<{ fromIndex: number; toIndex: number; edgeType: "supports" | "presupposes" }>;
  reviewFlags: ReviewFlag[];        // raw — review pass will resolve them
  outputJsonlPath: string;
};
```

**Internal flow:** matches the diagram in §1. Pure orchestration; delegates to translators and the agent module.

### 3.2 `agents/claim-analyst.ts`

**Public surface:**
```ts
export async function runClaimAnalystTurn(input: {
  framing: string;             // contents of FRAMING.md
  centralClaim: string;        // pulled from FRAMING.md "Central contested claim" section
  evidenceCorpusOverview: string;  // pre-rendered prose summary
  modelTier: "dev" | "prod";
}): Promise<{ output: ClaimAnalystOutput; rawText: string; usage: TokenUsage }>
```

**Internal:**
1. Load `prompts/1-claim-analyst.md` as the system prompt.
2. Load `prompts/shared/framing.md` (or use `input.framing` directly).
3. Compose the user message exactly per the prompt's §3 input contract.
4. Call `anthropic.chat({ system, messages, model: tier === "prod" ? OPUS : HAIKU })`.
5. Strip code-fence wrapper, parse JSON, validate with `ClaimAnalystOutputZ`.
6. On Zod fail: append the formatted error to a follow-up user message, retry once.
7. On second Zod fail: throw `HardValidationError` with full payload — orchestrator catches and aborts.

**`ClaimAnalystOutput` Zod schema** (lives in `agents/types.ts`):
```ts
export const ClaimAnalystOutputZ = z.object({
  phase: z.literal("1"),
  centralClaim: z.string().min(20).max(1000),
  subClaims: z.array(z.object({
    index: z.number().int().positive(),
    text: z.string().min(20).max(500),
    claimType: z.enum([
      "EMPIRICAL","NORMATIVE","CONCEPTUAL","CAUSAL","METHODOLOGICAL",
      "INTERPRETIVE","HISTORICAL","COMPARATIVE","META","THESIS",
    ]),
    layer: z.enum(["definitional","empirical","causal","normative"]),
    tags: z.array(z.string()).max(8),
    dependsOn: z.array(z.number().int().positive()).max(2),
    rationale: z.string().min(20).max(300),
  })).min(6).max(10),
}).superRefine((data, ctx) => {
  // Indices are 1..N, no gaps, no duplicates
  const indices = data.subClaims.map(s => s.index).sort((a,b) => a-b);
  indices.forEach((idx, i) => {
    if (idx !== i + 1) ctx.addIssue({ code: "custom", message: `subClaims indices must be 1..N sequential; got ${indices.join(",")}` });
  });
  // dependsOn references valid indices, no self-deps
  for (const sc of data.subClaims) {
    for (const dep of sc.dependsOn) {
      if (dep === sc.index) ctx.addIssue({ code:"custom", message: `subClaim #${sc.index} depends on itself` });
      if (!indices.includes(dep)) ctx.addIssue({ code:"custom", message: `subClaim #${sc.index} depends on missing index ${dep}` });
    }
  }
  // No cycles, depth ≤ 3
  const depth = computeMaxDepth(data.subClaims);
  if (depth > 3) ctx.addIssue({ code:"custom", message: `dependency graph depth ${depth} exceeds 3` });
  if (hasCycle(data.subClaims)) ctx.addIssue({ code:"custom", message: `dependency graph contains a cycle` });
  // claimType ↔ layer matching
  const allowed: Record<string, string[]> = {
    definitional: ["CONCEPTUAL"],
    empirical: ["EMPIRICAL","HISTORICAL","COMPARATIVE","METHODOLOGICAL"],
    causal: ["CAUSAL"],
    normative: ["NORMATIVE","INTERPRETIVE"],
  };
  for (const sc of data.subClaims) {
    if (!allowed[sc.layer].includes(sc.claimType)) {
      ctx.addIssue({ code:"custom", message: `subClaim #${sc.index}: claimType ${sc.claimType} not allowed in layer ${sc.layer}` });
    }
  }
  // All four layers covered
  const layers = new Set(data.subClaims.map(s => s.layer));
  for (const required of ["definitional","empirical","causal","normative"] as const) {
    if (!layers.has(required)) ctx.addIssue({ code:"custom", message: `layer "${required}" has no sub-claim` });
  }
});

export const ClaimAnalystRefusalZ = z.object({
  error: z.enum([
    "FRAMING_AMBIGUOUS",
    "CENTRAL_CLAIM_PRESUPPOSES_CONTESTED_DEFINITION",
    "INSUFFICIENT_EVIDENCE_DOMAINS",
  ]),
  details: z.string().max(500),
  suggestedFraming: z.string().nullable(),
});

export const ClaimAnalystResponseZ = z.union([ClaimAnalystOutputZ, ClaimAnalystRefusalZ]);
```

A refusal aborts the run with a clear error. Author either edits `FRAMING.md` and re-runs, or treats the refusal as research data ("the framing has a structural issue we need to address").

### 3.3 `translators/topology.ts`

The new translator. Stage 1 specified `translators/{argument,attack,move,concession}.ts`; Phase 1 needs a topology translator we add now.

**Public surface:**
```ts
export async function translateClaimAnalystOutput(
  output: ClaimAnalystOutput,
  ctx: { deliberationId: string; authorId: string /* claim-analyst bot id */; client: IsonomiaClient; logger: RoundLogger }
): Promise<{
  rootClaimId: string;
  subClaims: Array<{ index: number; claimId: string }>;
  edges: Array<{ fromIndex: number; toIndex: number; edgeType: "supports" | "presupposes" }>;
}>
```

**Steps:**

1. **Mint the root claim** (the central contested claim). Call `POST /api/claims { text: output.centralClaim, deliberationId, claimType: "CAUSAL" /* the central claim is causal in this experiment; configurable per topic */ }`. Record `rootClaimId`.

2. **Mark it as the deliberation's representative claim.** **Audit result (May 3, 2026):** The `Deliberation` Prisma model has **no `representativeClaimId` field** today. Stage-2 prereq (~30 min):
   - Add `representativeClaimId String?` to the `Deliberation` model in `lib/models/schema.prisma` with a nullable `Claim?` relation (`onDelete: SetNull`).
   - Run `npx prisma db push` (per repo convention).
   - Create `PATCH /api/deliberations/[id]/representative-claim/route.ts` accepting `{ claimId: string }`, validating that the claim belongs to the deliberation, gated by Firebase auth + creator-or-admin check.
   - Optionally extend the existing `PATCH /api/deliberations/[id]/settings` allowlist to include `representativeClaimId` for symmetry.
   Until this is shipped, fall back to relying solely on the `topology-root` Claim tag (Q3 belt-and-suspenders) and resolve the root by tag at read time.

3. **Mint each sub-claim.** Loop over `output.subClaims` in index order, calling `POST /api/claims { text, deliberationId, claimType: subClaim.claimType }`. Record each returned `claim.id` keyed by `subClaim.index` in `subClaimsById`.

   Idempotency note: `mintClaimMoid` deduplicates by stable hash of normalized text. If a sub-claim text happens to collide with an existing claim in this deliberation (unlikely in Phase 1 since the room is fresh), the existing claim is reused rather than duplicated. Logged at `kind: "claim_dedupe"`.

4. **File dependency edges.** For each sub-claim with `dependsOn`, file an edge from the dependent's claim to the depended-upon claim. Edge type:
   - For now: `"supports"` (the depended-upon claim is upstream — its truth bears on the dependent's truth).
   - Future enhancement: distinguish `"presupposes"` (the dependent claim is meaningless without the upstream resolved) from `"supports"` (the upstream is one of several things that bear on the dependent). Stage 2 v1 uses `"supports"` uniformly.

   **Audit result (May 3, 2026):** A public write endpoint exists at `POST /api/claims/[id]/edges` (per-claim, not a generic `/api/claims/edges`). Body shape: `{ toClaimId: string, type: "supports" | "rebuts", attackType?: "REBUTS" | "SUPPORTS" | "UNDERCUTS" | "UNDERMINES", targetScope?: "premise" | "inference" | "conclusion" }`. Auth: Firebase. Upserts on the unique constraint `(fromClaimId, toClaimId, type, attackType)`. The `[id]` path param is `fromClaimId`. **No new endpoint needed.** Update `IsonomiaClient.createClaimEdge(fromClaimId, body)` accordingly.

5. **Edge from each sub-claim to the root claim.** Every sub-claim implicitly bears on the root (the central claim). Call `POST /api/claims/[subClaimId]/edges { toClaimId: rootClaimId, type: "supports" }` for each. This makes the graph navigable from root to any sub-claim and back.

6. **Tag claims with topology metadata.** Each sub-claim Claim gets:
   - A tag `phase-1-topology`
   - A tag for its layer (`layer:definitional`, etc.)
   - A tag for its index (`topology-index:N`) — primary lookup key for downstream phases
   
   The root Claim additionally gets `topology-root` and a `central-claim-type:CAUSAL` tag (Q3 belt-and-suspenders, since the `representativeClaimId` field may not be live on day one).
   
   Tagging via existing `Claim.tags[]` Prisma field. If no public API exists for tag mutation, use the orchestrator's privileged write (the bot agent's own claim creation).

7. **Return the index → claim.id map** for the orchestrator to persist.

**Logging:** every `POST /api/claims` and `POST /api/claims/[id]/edges` call is logged via `RoundLogger` with full request/response.

**Retract path (used by `--apply` on retract verdicts):** **Audit result (May 3, 2026):** there is no `DELETE` endpoint for `ClaimEdge`. ClaimEdges are only removed via cascade on Claim deletion. Implication for `--apply`:
- For `retract`, the orchestrator deletes the *Claim* (cascades the edges automatically). This is the desired behavior anyway — a retracted sub-claim shouldn't leave dangling edges.
- If a future verdict ever needs to remove an edge while preserving both endpoint claims (unlikely in Phase 1; possible later), a small `DELETE /api/claims/edges/[edgeId]` endpoint (~15 min) becomes a Stage-3+ prereq. Not needed for Stage 2.

### 3.4 `state/format-for-prompt.ts` extension

Phase 1 doesn't need a state-formatter (it's the deliberation's first turn — there is no prior state). But after Phase 1 completes, the formatter must know how to render the topology for Phase 2's first turn. Stage 2 includes:

```ts
export function formatTopologyForPrompt(opts: {
  rootClaimText: string;
  subClaims: Array<{ index: number; text: string; layer: string; claimType: string; dependsOn: number[] }>;
}): string;
```

Output is a labeled-prose block like:

```
## Phase-1 Claim Topology

Central claim: "Algorithmic content curation on major social media platforms…"

Sub-claims (referenced by index throughout this deliberation):

[#1] (definitional / DEFINITIONAL) Listening homogeneity is operationalizable as…
[#2] (empirical / EMPIRICAL, depends on #1) Aggregate music-listening homogeneity…
…
```

This block is embedded in every Phase 2/3 agent's user message, so the formatter needs to be stable (the index assignments must not change once Phase 1 closes).

### 3.5 `orchestrator review --phase N` CLI

**Public surface:**
```bash
yarn orchestrator review --phase 1 [--produce-report] [--apply]
```

- Without flags: opens `runtime/reviews/phase-1-review.md` if it exists; if not, runs `--produce-report`.
- `--produce-report`: gathers all `review_flag` events from `runtime/logs/round-1-*.jsonl`, generates the Markdown report described in Stage 1 §3.8, writes to `runtime/reviews/phase-1-review.md`. Refuses to overwrite an existing report unless `--force`.
- `--apply`: parses verdicts from the Markdown report and produces an action plan. `accept` → no-op. `revise` → re-prompts Claim Analyst with correction context, re-mints the affected sub-claim, updates index-mapping. `retract` → calls `DELETE /api/claims/[id]` (or appropriate soft-delete) and removes related edges.

**Verdict-parsing rules:** report parser looks for fenced verdict blocks of the form:
```markdown
**Verdict:** [x] accept  [ ] revise  [ ] retract  Notes: looks fine
```

Exactly one box must be checked per flag. Multiple checks or zero checks → parser exits 1 with an actionable error pointing to the malformed flag.

**Idempotency:** running `--apply` twice is safe: the report is rewritten with `**Applied:** 2026-…` markers; flags already applied are skipped.

### 3.6 Gate file: `PHASE_1_COMPLETE.json`

Written by `phases/phase-1-topology.ts` after `--apply` completes successfully and all flags are accepted/applied.

```json
{
  "phase": 1,
  "completedAt": "2026-…",
  "deliberationId": "delib_…",
  "rootClaimId": "clm_root_…",
  "topology": {
    "1": { "claimId": "clm_…", "text": "...", "layer": "definitional", "claimType": "DEFINITIONAL", "dependsOn": [] },
    "2": { "claimId": "clm_…", "text": "...", "layer": "empirical",   "claimType": "EMPIRICAL",    "dependsOn": [1] },
    "...": "..."
  },
  "edges": [
    { "from": 2, "to": 1, "type": "supports" },
    { "from": 2, "to": "root", "type": "supports" },
    "..."
  ],
  "reviewSummary": {
    "totalFlags": 4,
    "accepted": 3,
    "revised": 1,
    "retracted": 0,
    "reportPath": "runtime/reviews/phase-1-review.md"
  },
  "tokenUsage": { "input": 12483, "output": 1842, "modelTier": "prod" }
}
```

Stage 3 (Phase 2) refuses to start without this file.

---

## 4. The five micro-tasks of Stage 2

In execution order:

### 4.1 Pre-flight (15 min, mostly automated)

```bash
yarn orchestrator preflight --phase 1
```

Checks:
- `READY_FOR_PHASE_1.json` exists, agents authenticate, deliberation exists.
- `prompts/1-claim-analyst.md` exists and `ClaimAnalystOutputZ.parse(parseExampleFromPrompt(promptText))` succeeds (catches drift between prompt and schema).
- Anthropic API key valid; `--model-tier=prod` and `experimentMode: true` agree (or warn).
- Bound evidence corpus has ≥ 15 sources.
- Deliberation room is empty of claims (Phase 1 should be the first write).

Aborts with actionable errors on any failure.

### 4.2 Run Phase 1 (1 LLM call + ~10–20 Isonomia API calls; ~2–3 minutes)

```bash
yarn orchestrator phase 1 --model-tier=prod
```

This is the actual run. The Claim Analyst executes once, the topology is filed to the deliberation, the round JSONL is written, and `PHASE_1_PARTIAL.json` is produced.

If anything goes wrong mid-flight (Anthropic 5xx after retries, Isonomia 5xx, network), the orchestrator aborts. State on the platform is messy but recoverable: `--resume` reuses any already-minted claims (idempotency via stable-hash) and continues from the last successful API call.

Token cost (Opus): roughly 8K input (prompt + framing + corpus overview) + 2K output ≈ **~$0.40 per Phase 1 run**. Cheap.

### 4.3 Read the round log and the topology (10–15 min, human)

The author opens `runtime/logs/round-1-claim-analyst.jsonl` and `PHASE_1_PARTIAL.json` and:

- Reads each sub-claim text. Asks: would a careful researcher write this?
- Inspects the dependency graph. Is the hinge identified? Is depth reasonable?
- Reads the Claim Analyst's `rationale` for each sub-claim. Does it bear on the central claim?

This is informal — there's no checkbox. But this is also the moment when the author either trusts the topology enough to run the review pass, or rejects the whole Phase 1 and re-runs from scratch with a tightened framing.

### 4.4 Review pass (15–60 min, human)

```bash
yarn orchestrator review --phase 1 --produce-report
# author opens runtime/reviews/phase-1-review.md, fills in verdicts
yarn orchestrator review --phase 1 --apply
```

Soft-flag inventory the author will see for Phase 1 (per Stage 1 §3.8):

- `no_established_restatement`: any sub-claim with > 0.75 cosine similarity to an item in `FRAMING.md` "Established within the framing." Each flagged sub-claim gets a verdict.
- `hinge_identified`: warning if no sub-claim has ≥ 2 inbound dependsOn references. Single warning, no per-flag verdict.
- `layer_balance` (added in Stage 2): warning if the layer distribution is severely skewed (e.g. 7 empirical, 1 each of the others). Author may choose to re-run Phase 1 or accept.

The author also performs **manual reviews** not covered by automated flags:

- **Coverage check:** does the topology actually decompose the central claim, or does it dance around it?
- **Independence check:** are sub-claims independently arguable, or are several rephrasings of the same proposition?
- **Tractability check:** could a competent advocate mount a 4–6-argument case on each sub-claim using the bound corpus?

If any manual check fails, the author edits the report to add a verdict like `**Verdict:** [x] revise  Notes: sub-claims #4 and #5 are restatements; collapse #5 into #4's dependsOn`. The `--apply` step honors these.

### 4.5 Finalize (1 min)

```bash
yarn orchestrator finalize --phase 1
```

Validates that the on-platform state matches `PHASE_1_PARTIAL.json` (claims exist, edges exist, no orphans), writes `PHASE_1_COMPLETE.json`, prints a one-screen summary, and exits 0.

If the on-platform state diverges from the partial (e.g. an admin manually deleted a claim, or a previous `--apply` left state inconsistent), `finalize` refuses and points to a `runtime/reviews/phase-1-divergence.md` describing exactly what's off.

---

## 5. Acceptance criteria for Stage 2

Stage 2 is done when ALL of the following hold:

1. `yarn orchestrator phase 1 --model-tier=prod` exits 0 and produces `PHASE_1_PARTIAL.json`.
2. The deliberation contains exactly 1 root claim and 6–10 sub-claims with the expected `topology-index:N` tags.
3. ClaimEdges exist between every dependent sub-claim and its dependency, and from every sub-claim to the root.
4. `runtime/logs/round-1-claim-analyst.jsonl` contains the full input/output cycle and is replayable.
5. `runtime/reviews/phase-1-review.md` exists with all flag verdicts filled in (no unparsed `[ ] accept [ ] revise [ ] retract` blocks).
6. `yarn orchestrator review --phase 1 --apply` exits 0; the report shows `**Applied:** <ts>` next to every actionable verdict.
7. `PHASE_1_COMPLETE.json` exists, validates against the gate-file schema, and matches the live deliberation state.
8. The author has personally read every sub-claim text and signed off (informal — but if the author hasn't, Phase 2 is premature).

---

## 6. Effort estimate

| Component | Hours |
|---|---|
| `phases/phase-1-topology.ts` orchestration | 2 |
| `agents/claim-analyst.ts` + `ClaimAnalystOutputZ` Zod (most already drafted in §3.2) | 2 |
| `translators/topology.ts` (root claim + sub-claims + edges + tags) | 3 |
| `state/format-for-prompt.ts` topology renderer | 1 |
| `orchestrator review --produce-report` and `--apply` CLI | 4 |
| `orchestrator finalize` + divergence detection | 2 |
| `PHASE_1_COMPLETE.json` schema + validator | 0.5 |
| Stage-2 prereqs (representativeClaimId schema field + setter endpoint; ClaimEdge endpoint already exists — audit confirmed May 3, 2026) | 0.5 |
| Integration testing in dry-run mode | 2 |
| **Total Stage 2 build** | **~16.5 hours** |
| First Phase 1 run + review pass + finalize (one-time, billed separately) | ~1 hour |

Orchestrator-as-of-end-of-Stage-1 is only ~70% of what Stage 2 needs; the review CLI and the topology translator are the new chunks. Most of the "review CLI" hours are the verdict parser and the apply-with-idempotency logic, not the Markdown emission.

---

## 7. Risks and how we mitigate them

| Risk | Likelihood | Mitigation |
|---|---|---|
| Claim Analyst produces a topology that's structurally fine but conceptually weak (bland decomposition) | Medium | Author's manual coverage/tractability check in §4.4. If weak, re-run with a tightened framing or a temperature change. Phase 1 is cheap to re-run. |
| Sub-claim text collides on stable-hash with a leftover claim from a prior test run | Low (deliberation is fresh) | Preflight asserts the deliberation is empty of claims. If it isn't, the orchestrator refuses to start. |
| `POST /api/claims/[id]/edges` endpoint doesn't exist as a public API surface | ~~Medium~~ **Resolved (audit, May 3, 2026)** | Endpoint exists at `POST /api/claims/[id]/edges` accepting `{ toClaimId, type, attackType?, targetScope? }`, Firebase-auth-gated, upserts on unique `(from, to, type, attackType)`. No prereq work. |
| `Deliberation.representativeClaimId` setter doesn't have a public endpoint | ~~Medium~~ **Resolved (audit, May 3, 2026): field is missing from schema** | Stage-2 prereq, ~30 min: add nullable `representativeClaimId` to `Deliberation` model in `lib/models/schema.prisma`, `npx prisma db push`, create `PATCH /api/deliberations/[id]/representative-claim` route. Fallback if not shipped: rely on `topology-root` Claim tag for root resolution. |
| `DELETE /api/claims/edges/[id]` doesn't exist; can't remove an edge without deleting a claim | Low for Phase 1 | `--apply` retract path always deletes the *Claim* (cascades edges). Edge-only deletion is a Stage-3+ prereq if ever needed (~15 min). |
| Author's review-pass verdicts produce non-idempotent state (e.g. retracting a sub-claim with downstream edges that were already filed) | Medium | `--apply` runs in a transaction-like manner: edges first deleted, then claims, then re-mints if any. Logged step-by-step. |
| The orchestrator's `--resume` after a mid-Phase-1 abort produces duplicate claims because `mintClaimMoid` doesn't dedupe at the deliberation level | Low | Verified: `mintClaimMoid` is global by hash; same-text claim is reused. Test this in dry-run before first prod run. |
| Soft-flag false positives swamp the review pass (e.g. cosine threshold too low, every sub-claim flags) | Medium | Embedding model and threshold are configurable. First run, observe flag rate; tune threshold to a target of ≤30% of sub-claims flagged. |

---

## 8. What Stage 3 (Phase 2) inherits

The Stage 3 roadmap will assume:

- `PHASE_1_COMPLETE.json` exists, validates, and is treated as immutable. Stage 3 does not re-run Phase 1 or modify the topology.
- The deliberation has a populated topology accessible via the canonical `topology-index:N` tag and `PHASE_1_COMPLETE.json` index → claim.id map.
- The `formatTopologyForPrompt` formatter is finalized; Phase 2 agents see the topology as labeled prose.
- `translators/topology.ts` is read-only from Phase 2's perspective (no new sub-claims; if a Phase-2 advocate proposes one, the orchestrator either rejects or routes it to a "supplementary claim" path documented in Stage 3).

The single most important thing Stage 3 inherits is the **stable index → claimId mapping**. Every Phase 2/3 agent will refer to sub-claims by their index in their structured output (`conclusionClaimIndex: 4`); the orchestrator translates index → claimId via the gate file.

---

## 9. Open questions for Stage 2

**Q1. Should advocates propose sub-claim additions in Phase 1 (per master roadmap)?**
**Recommendation:** No, for v1. The author's manual review pass plays this role with less risk of structural bias. If v2 wants advocate-additions, add an optional Phase-1.5 step.
--agree with recommendation

**Q2. Edge type: just `"supports"` or distinguish `"presupposes"`?**
**Recommendation:** Just `"supports"` for v1. Adding the `presupposes` distinction adds prompt-engineering surface (Claim Analyst would have to tag each `dependsOn` with edge type) and the downstream phases don't currently use it. Document as a v2 extension.
--v2 extension

**Q3. Do we tag the root claim with anything special, or rely solely on `Deliberation.representativeClaimId`?**
**Recommendation:** Tag with both `topology-root` and the layer/claimType of the central claim, in addition to setting `representativeClaimId`. Belt-and-suspenders.
--agree with recommendation

**Q4. What happens if the Claim Analyst returns a refusal (`FRAMING_AMBIGUOUS` etc.)?**
**Recommendation:** Treat as research data. The orchestrator persists the refusal to `runtime/refusals/phase-1-refusal.json`, prints `suggestedFraming` to stdout, and exits 2 (distinct from the abort code 1). Author edits `FRAMING.md` and re-runs `phase 1`.
--agree with recommendation

**Q5. Re-runs after `retract` verdicts — do we re-run the entire Phase 1 turn, or just re-prompt for a replacement sub-claim?**
**Recommendation:** Just re-prompt for a replacement, with the retracted sub-claim's text and the retraction reason in the user message. Re-running the entire turn would change all the indices and break the cleanly-numbered structure the human just reviewed.
--agree with recommendation

---

## 10. Calendar projection

Stage 2 build: **~2 working days** for one person.
First Phase 1 production run + review + finalize: **~1 working hour** spread over a couple of hours' calendar time (LLM call returns fast; review pass is the dominant cost).

If the topology comes out weak on the first try and the framing needs revision, expect 1–2 additional Phase 1 runs (~30 min each, plus framing edits). Budget Stage 2 calendar at **3–4 days end-to-end** including framing iteration.
