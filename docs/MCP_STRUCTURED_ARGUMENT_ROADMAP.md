# MCP Structured-Argument Write Tool — Roadmap

**Status:** proposed
**Owner:** Isonomia MCP / Argument-write surface
**Companion docs:**
- [`isonomia-overview.md`](isonomia-overview.md) — public MCP capability surface
- [`AI_AUTHORING_POLICY.md`](AI_AUTHORING_POLICY.md) — Track AI-EPI Pt. 3 §5 (AI-author standing rules)
- [`AIF_ASPIC_MESH_MAPPING.md`](AIF_ASPIC_MESH_MAPPING.md) — argument structure semantics
- [`CQ_COMPLETE_IMPLEMENTATION_GUIDE.md`](CQ_COMPLETE_IMPLEMENTATION_GUIDE.md) — critical-question hooks
- [`packages/isonomia-mcp/src/server.ts`](../packages/isonomia-mcp/src/server.ts) — MCP tool registry

---

## 1. Motivation

The current MCP write surface (`propose_argument`, backed by [`app/api/arguments/quick/route.ts`](../app/api/arguments/quick/route.ts)) commits a flat shape:

- 1 `Claim` (the conclusion) + N `ClaimEvidence` rows + 1 `Argument` row whose `text` field holds the LLM's free-text reasoning.
- **No `ArgumentPremise` rows.** The conclusion has no formal supporting claims.
- **No `ArgumentSchemeInstance`.** No scheme = no critical questions = no dialectical obligations surfaced.
- The argument card renders as a "bare assertion" with the warning "*This argument may be a bare assertion*" when the user expands premises.
- Fitness scoring under-reports: `supportEdges = 0` regardless of how rich the LLM's reasoning was, because there are no premise→conclusion edges in the graph.

The full UI flow (`app/api/arguments/route.ts` POST) supports the inference structure — premises as separate `Claim` nodes, scheme assignment, slot/role binding, optional implicit warrant, ASPIC+ rule type. MCP callers cannot reach it because that endpoint requires pre-existing claim IDs, which the LLM has no way to produce in a single round-trip.

**Goal.** Give MCP callers a single-call path to write an argument with explicit premises, an assigned scheme, and (optionally) per-premise evidence — without exposing claim-id juggling.

---

## 2. Capability gap (current vs. target)

| Capability                            | `propose_argument` (today) | Target `propose_structured_argument` |
| ------------------------------------- | -------------------------- | ------------------------------------ |
| Conclusion as `Claim` row             | ✅                         | ✅                                   |
| Free-text reasoning gloss             | ✅ (stored on `Argument.text`) | ✅ (preserved as narrative)        |
| Premises as separate `Claim` rows     | ❌                         | ✅ (minted in same transaction)     |
| `ArgumentPremise` join rows           | ❌                         | ✅                                   |
| Scheme assignment                     | ❌                         | ✅ via `schemeKey`                  |
| `ArgumentSchemeInstance` row          | ❌                         | ✅                                   |
| Critical questions surfaced           | ❌                         | ✅ (lazy; same as UI flow)          |
| ASPIC+ rule type (strict/defeasible)  | ❌                         | ✅ optional                          |
| Implicit warrant                      | ❌                         | ✅ optional                          |
| Per-premise evidence                  | ❌ (conclusion only)       | ⏸ deferred to v1.1                  |
| Slot/role binding by name             | ❌                         | ⏸ deferred to v1.1                  |
| AI-author flagging (`authorKind:"AI"`)| ✅                         | ✅                                   |
| Fire-and-forget provenance enrichment | ✅                         | ✅                                   |
| `provenancePending` response flag     | ✅                         | ✅                                   |

---

## 3. Proposed architecture

### 3.1 Three-step delivery

#### Step 1 — `list_schemes` (read tool)

A discovery tool so the LLM can browse the catalog before picking one. Without this, the model has to guess scheme keys or hard-code them from training data.

**Endpoint:** reuse [`GET /api/schemes`](../app/api/schemes/route.ts).

**MCP tool shape:**
```ts
{
  name: "list_schemes",
  inputSchema: { category?: string, includeExamples?: boolean },
  // returns: [{ key, name, summary, whenToUse, slotHints, examples?, difficulty, materialRelation }]
}
```

**Description (draft):**
> READ TOOL — list the catalog of argumentation schemes (Walton + extensions) available for `propose_structured_argument`. Use this BEFORE writing a structured argument when you're not sure which scheme key matches your reasoning. Each entry has `whenToUse` text and `slotHints` describing the role-slots the scheme expects (e.g. expert_opinion expects an `expert` and a `proposition`). Pass the chosen `key` as `schemeKey` to `propose_structured_argument`.

**Cost:** ~30 min. Read-only, no migration.

#### Step 2 — `POST /api/arguments/quick-structured` (new endpoint)

Mints conclusion + premise claims and creates the `Argument` + `ArgumentPremise[]` + (optional) `ArgumentSchemeInstance` in one transaction. Mirrors `quick`'s auth pattern exactly:
- Cookie auth → falls back to MCP bearer (`resolveCitationCallerUserId` + `isMcpBearer`).
- Same Upstash rate limiter (separate prefix `rl:quick_struct_arg`, same 20/h budget).
- Same "My Arguments" deliberation fallback when `deliberationId` omitted.
- Same fire-and-forget `enrichEvidenceProvenanceInBackground`.
- Same `provenancePending` / `retryAfterMs` response shape.
- Same AI-author flagging (`authorKind: "AI"` + `aiProvenance` when MCP bearer).

**Request schema:**
```ts
{
  conclusion: string,           // text → minted as Claim
  premises: Array<{
    text: string,               // text → minted as Claim
    isAxiom?: boolean,          // Phase B, defaults false
    // role?: string,           // v1.1 — slot binding
  }>,                            // 1..10
  reasoning?: string,           // narrative gloss → Argument.text
  schemeKey?: string,           // looked up server-side; omitted → server calls inferAndAssignScheme()
  ruleType?: "STRICT" | "DEFEASIBLE",  // defaults DEFEASIBLE
  ruleName?: string,            // optional name for STRICT rules
  implicitWarrant?: string,
  evidence?: Array<EvidenceItem>,  // attached to conclusion claim (v1)
  isPublic?: boolean,           // mirrors `quick`; defaults true
  deliberationId?: string,
}
```

**Response shape (additive over `quick`):**
```ts
{
  ok: true,
  argument: { id, text, confidence },
  claim: { id: conclusionId, text, moid },
  premises: Array<{ id: premiseClaimId, text, moid }>,
  schemeInstance: { id, schemeId, schemeKey, schemeName } | null,
  // OQ3: missing required slots are NOT thrown — surfaced here as a
  // dialectical obligation the caller can choose to satisfy in v1.1.
  warnings: Array<{ code: "missing_slot" | "premise_deduped" | "scheme_inferred", detail: string }>,
  permalink: { shortCode, slug, url },
  embedCodes: { ... },
  provenancePending: boolean,
  retryAfterMs: number,
}
```

**Scheme resolution (pre-transaction):**
- If `schemeKey` provided → look up `argumentScheme` row; unknown key → 400 `{ error, hint: "call list_schemes" }`.
- If `schemeKey` omitted → call `inferAndAssignScheme(inferenceText, conclusionText)` where `inferenceText = reasoning ?? premises.map(p => p.text).join(" ; ") ?? conclusion`. Record a `scheme_inferred` warning in the response.
- **Slot validation is bypassed in v1.** Do NOT call `validateSlotsAgainstScheme` (it `throw`s on missing required slots — see [app/api/arguments/route.ts](../app/api/arguments/route.ts)). Instead, inline a non-throwing check that emits `missing_slot` warnings. v1.1 will add the proper slot-binding input.

**Transaction boundary:**
1. Mint conclusion `Claim` (upsert by `moid` like `quick` does).
2. Mint premise `Claim`s (parallel upserts; collect IDs). Dedup by `moid` — if two premise texts collapse to one claim, emit a `premise_deduped` warning.
3. Create `ClaimEvidence` rows on conclusion claim.
4. Create `Argument` (conclusionClaimId, resolved schemeId, implicitWarrant, `text = reasoning ?? ""`).
5. Create `ArgumentPremise[]` (one per deduped premise claim) with `skipDuplicates: true`.
6. Call `markArgumentAsComposedInTx` (premise-bearing args must be marked composed).
7. Create `ArgumentSchemeInstance` if `schemeId` resolved (from key OR inference).
8. `ensureArgumentSupportInTx` for the conclusion.
9. Outside the transaction: kick off provenance enrichment.

**Parity decision — `DialogueMove` ASSERT + commitment-contradiction checks.**
The full UI POST creates a `DialogueMove` and runs `checkNewCommitmentContradictions` / `getCommitmentStores`; the existing `quick` route does **neither**. v1 of `quick-structured` matches `quick` (skip both) to preserve parity and ship-velocity. Tracked as a follow-up to back-port to both `quick` paths simultaneously so MCP-authored args appear in dialogue protocol state. Document this gap in the response so callers know `DialogueMove` state will not reflect the assert.

**Validation:**
- Premises: 1..10 (matches UI cap).
- `schemeKey`: as above.
- All text fields: HTML-stripped, length-capped (conclusion 2000, premise 1000, reasoning 5000).
- `isPublic`: defaults true, mirrors `quick`.

**Cost:** ~4–6 hours (was ~2h — revised after accounting for the slot-validation rewrite, warning surface, dedup handling, and integration tests). No schema migration.

#### Step 3 — `propose_structured_argument` (MCP tool)

Wires the new endpoint into the MCP server.

**Description (draft):**
> WRITE TOOL — **PREFER THIS OVER `propose_argument` whenever the user's claim has reasons that should be made explicit** (premises → conclusion structure), or when matching a known argumentation scheme matters (expert opinion, practical reasoning, cause-to-effect, analogy, sign, etc.). Use `propose_argument` only for one-line bare assertions. Each premise is committed as a separate `Claim` node, allowing later challenges to undermine specific premises rather than the whole argument. If you're unsure which scheme to use, call `list_schemes` first. Returns the same fields as `propose_argument` plus `premises[]` and `schemeInstance`.

Same MCP-bearer auth, same `ISONOMIA_API_TOKEN` requirement, same trigger-phrase loudness as `propose_argument`. Cross-refs:
- → `list_schemes` first if scheme unknown
- → `resolve_citation` first for any DOI/arXiv evidence
- → `get_argument` after to verify standing/fitness (with `retryAfterMs` delay)
- → `propose_warrant` to attach an inference-license warrant separately

**Cost:** ~30 min.

### 3.2 Tool surface after delivery

| Tool                            | When to use |
| ------------------------------- | ----------- |
| `propose_argument`              | One-line claim, no premises worth naming |
| **`propose_structured_argument`** (new) | Claim + ≥1 explicit premise; or scheme assignment matters |
| `propose_warrant`               | Attach an inference-license warrant to an existing argument |
| `list_schemes` (new)            | Browse catalog before picking a scheme key |
| `get_argument`                  | Verify round-trip; check fitness/standing (post-`retryAfterMs`) |
| `resolve_citation`              | DOI/arXiv → canonical URL before passing as evidence |

---

## 4. Resolved design decisions

1. **Scheme inference fallback.** Omitted `schemeKey` → server calls `inferAndAssignScheme(reasoning ?? premises.join(" ; ") ?? conclusion, conclusionText)`. Wrong-but-present scheme is preferable to null because it surfaces CQs. Response includes `scheme_inferred` warning.

2. **Per-premise evidence.** Deferred to v1.1. v1: all evidence attaches to the conclusion claim (matches `quick` behavior).

3. **Slot/role binding.** Deferred to v1.1. v1: do **not** call the throwing `validateSlotsAgainstScheme`; emit non-fatal `missing_slot` warnings instead so writes never 500 on inferred schemes with required slots (e.g. `expert_opinion`).

4. **CQ pre-seeding.** Deferred. CQs continue to be computed lazily on read.

5. **`reasoning` field.** Kept. Stored on `Argument.text` as a narrative gloss; structured premises remain the formal object. Note: this means `Argument.text` holds the reasoning gloss, NOT the conclusion text — UI/fitness code must continue keying on `conclusionClaim.text` (already the case).

6. **Standing.** No change. Standing is determined by `authorKind`; structured AI-authored args enter at `untested-default` per [`AI_AUTHORING_POLICY.md`](AI_AUTHORING_POLICY.md).

7. **Rate-limit budget.** Shared `rl:quick_arg` prefix with `propose_argument`. Single 20/h budget across both write tools.

8. **`mint_claim` standalone tool.** Deferred. Reconsider if users want to build chains via reusable claim ids.

9. **Orientation update (NEW).** The MCP server's `get_orientation` payload (see [packages/isonomia-mcp/src/server.ts](../packages/isonomia-mcp/src/server.ts) — `ORIENTATION_PAYLOAD`) and tool-routing recipes must be updated when shipping, otherwise tool discoverability lags (lesson from the original `propose_argument` rollout). Bump `ORIENTATION_VERSION`.

---

## 5. Test plan

- **Unit:** schema validation (premise length, scheme-key lookup, claim minting upsert by `moid`).
- **Integration (jest):** end-to-end POST → assert Argument + ArgumentPremise[] + ArgumentSchemeInstance rows exist with correct shape; verify `authorKind:"AI"` on MCP bearer; verify provenance enrichment triggered.
- **MCP smoke:** Claude Desktop test prompt:
  > "Propose a structured argument to Isonomia with the conclusion 'Adolescents should not consume regular caffeine' and three premises about sleep, neurodevelopment, and behavior. Use the practical_reasoning scheme."
- **Routing test:** confirm `propose_structured_argument` wins over `propose_argument` for prompts containing "premises", "reasons", "because", "argument with reasoning structure".

---

## 6. Out of scope (v1)

- Per-premise evidence attachment.
- Scheme slot/role binding by name.
- Eager CQ row creation.
- Standalone `mint_claim` tool.
- Multi-argument chain construction.
- Argument-net / scheme-net composition.
- Editing/updating existing arguments via MCP.
- Premise reuse across arguments by claim id.

---

## 7. Phasing summary

| Step | Deliverable | Effort | Blocker |
| ---- | ----------- | ------ | ------- |
| 1    | `list_schemes` MCP tool | 30 min | none |
| 2    | `POST /api/arguments/quick-structured` endpoint | ~4–6 h | none |
| 3    | `propose_structured_argument` MCP tool | 30 min | Step 2 |
| 4    | Jest integration tests (incl. inferred-scheme + missing-slot warning paths) | ~1.5 h | Step 2 |
| 5    | `get_orientation` payload + tool-routing recipe update; bump `ORIENTATION_VERSION` | 30 min | Step 3 |
| 6    | Claude Desktop smoke + tune trigger phrases | iterative | Steps 1-3 |

Total estimated effort to ship v1: **~7–9 hours of focused work** plus iteration on trigger-phrase loudness.

---

## 8. Success criteria

- Claude Desktop can write a 3-premise expert-opinion argument from a single user prompt without explicit tool naming.
- Resulting argument card shows the 3 premises in the "Premises" section (no "bare assertion" warning).
- Scheme badge displays correctly with the assigned scheme name.
- Critical questions appear under the conclusion claim.
- Fitness reflects supportEdges from premises (≥ 1.5 for a 3-premise + 1-evidence argument: 3×0.5 + 1×0.25).
- `authorKind:"AI"` flag set; `aiProvenance` records `tool: "propose_structured_argument"`.

---

## 9. v1.1 backlog

Tickets queued from v1 ship + Claude Desktop smoke tests. Ordered by priority.

### 9.1 Per-premise evidence attachment (PRIORITY)

**Status.** Open. Bumped from "v1.1 deferred" to top of queue after the 2026-05-14 smoke test (see [experiments/Claude-ISONOMIA_TOOL-feedback-May14_v2.md](../experiments/Claude-ISONOMIA_TOOL-feedback-May14_v2.md)).

**Motivating evidence.** In the second caffeine smoke test, Claude wrote a 5-premise structured argument and *narrated* a distinct evidence source per premise (PLOS for neurocognitive, Riley for cardiovascular, JAH for behavioral, biorxiv for AAP guidance). The v1 endpoint silently dropped that mapping: `app/api/arguments/quick-structured/route.ts` attaches `evidence[]` to the conclusion claim only. The argument page therefore renders a single evidence cluster rather than the per-premise citations the model intended. The structural surface is exactly the place where this gap is most visible — a structured-argument writer that flattens citation provenance back onto the conclusion partly defeats the purpose of premise decomposition.

**Scope.**
- Extend `PremiseInputSchema` in `app/api/arguments/quick-structured/route.ts` with `evidence?: EvidenceItem[]` (cap ≤ 5 per premise; reuse the existing `EvidenceItemSchema`).
- Keep top-level `evidence[]` on the request body (still attaches to conclusion claim — backward compatible).
- After premise dedup, attach per-premise evidence to each minted premise claim using the same `EvidenceLink` path the conclusion uses today. Skip premises that were deduped against another premise or against the conclusion (the surviving claim already gets its merged evidence from the first writer; emit a `premise_evidence_merged` warning).
- Update `propose_structured_argument` MCP tool input schema (`packages/isonomia-mcp/src/server.ts`) to mirror the per-premise `evidence` field with a 1-line jsdoc example.
- Update Recipe E.2 in `orientation.ts` to show per-premise evidence as the recommended pattern; bump `ORIENTATION_VERSION` to 1.4.0.

**Provenance enrichment.** Per-premise EvidenceLinks must enqueue the same provenance worker as conclusion-level ones; verify `enqueueProvenanceForLinks` accepts an arbitrary claim id, not just the conclusion's.

**Tests.**
- Integration: 5-premise argument with 1 evidence per premise → assert 5 EvidenceLink rows, each pointing at the matching premise claim id.
- Dedup interaction: two premises with identical text + different evidence → surviving claim gets union of both evidence lists; `premise_evidence_merged` warning emitted.
- Backward compat: existing top-level-only evidence still attaches to conclusion (existing test should pass unchanged).

**Effort.** ~2–3 h (endpoint + MCP schema + 3 tests + orientation copy).

**Out of scope (still).** Slot/role binding by name and `mint_claim` standalone tool remain deferred until a real use case forces them.

### 9.2 Other v1.1 items (unchanged)

- Slot/role binding by name (Walton CQ slots).
- DialogueMove ASSERT + commitment-contradiction back-port to both `/quick` and `/quick-structured`.
- Iterative trigger-phrase tuning from smoke-test logs.
