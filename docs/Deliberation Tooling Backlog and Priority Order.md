# Deliberation Tooling Backlog and Priority Order

Cross-surface backlog covering the **MCP tool surface**, **synthetic-readout
shape**, **chain prose views**, **chain fitness**, and the **orchestrator**
(Phase 7 onward). Sources:

- `experiments/Claude-ISONOMIA_TOOL-feedback-May11v1.md` — external
  validation transcript (Claude Desktop, MCP-mediated synthesis on
  Arm-B `cmoxol76e03748cssx07tvkhd`).
- `docs/Chain Essay Prose Generator refinement backlog.md` — prose-view
  detail (items P5–P15 in the table below).
- Internal chain-architect implementation memos.
- `Development and Ideation Documents/Experiments/Multi agent deliberation experiment - prerequisite implementation plan.md`.

Last updated: 2026-05-11.

---

## Recently shipped (2026-05-11)

| Done | What | Files |
|---|---|---|
| ✅ | `meanChallengerCount` added to `DeliberationFingerprint` | `lib/deliberation/fingerprint.ts` |
| ✅ | `challengerCoverage` + `medianChallengerCountAmongChallenged` (7c) | `lib/deliberation/fingerprint.ts` |
| ✅ | New honestyLine + StateCard stats | `lib/deliberation/syntheticReadout.ts`, `components/deliberation/DeliberationStateCard.tsx` |
| ✅ | `FINGERPRINT_VERSION = "v2"` stamp mixed into `contentHash` | `lib/deliberation/fingerprint.ts` |
| ✅ | MCP tool description updated for new fields | `packages/isonomia-mcp/src/server.ts` |
| ✅ | T1.1 — `refusalSurface[i].blockerSummaries` (one-sentence preview per blocker) | `lib/deliberation/syntheticReadout.ts` |
| ✅ | T1.2 — `standingDepth` + `challengerCount` + `reviewerCount` per `topArguments`/`mostContested` entry | `lib/deliberation/chainExposure.ts`, `lib/deliberation/syntheticReadout.ts` |
| ✅ | T1.5 — chain fitness now weights inbound attacks by attacker standing (refuted ≈ 0, unanswered = full) | `lib/deliberation/chainExposure.ts` |
| ✅ | T2.7 — verified `loadBearingnessRanking` is full arg list (143/143 on Arm B); MCP description clarified | `packages/isonomia-mcp/src/server.ts` |
| ✅ | T1.3 — `find_counterarguments` / search now tag every result with `scope: "within" \| "cross"`, attach `deliberation: {id,title}`, expose `?within_deliberation=` + `?scope=within\|cross\|both`, return `scopeBreakdown`, and stable-sort within-hits ahead of cross-hits inside the active sort key | `app/api/v3/search/arguments/route.ts`, `packages/isonomia-mcp/src/server.ts` |
| ✅ | T1.4 — `ChainRefusalBanner` surfaces `refusalSurface.cannotConcludeBecause` at the top of Essay + Brief views; filters to entries whose `conclusionClaimId` appears in the chain; renders weakest-link blocker + up to 2 inline blocker previews (from T1.1's `blockerSummaries`); honest-empty when no chain conclusion is blocked | `components/chains/ChainRefusalBanner.tsx`, `components/chains/ChainEssayView.tsx`, `components/chains/ChainProseView.tsx` |
| ✅ | T1.6 — external-validation note + Tier 1 design decisions persisted to repo memory | `/memories/repo/synthetic-readout-friction-fixes-2026-05-11.md` |
| ✅ | `FINGERPRINT_VERSION` bumped to v4 (auto-evicts stale cache) | `lib/deliberation/fingerprint.ts` |

External validation (verbatim from Claude Desktop transcript):

> *"The weakest-link semantics are the most valuable part. … The chainStanding
> = worst-link design is also the right call epistemically."*

> *"The refusal surface is doing its job: it correctly identifies that no
> major conclusion can be closed."*

The mechanics worked end-to-end on the first external test. Hypothesis B
(MCP-mediated synthesis qualitatively superior to from-scratch) is
empirically supported on a single trial; remaining work is friction-reduction.

---

## Prioritization legend

- **Tier 1 — cheap & high-leverage.** ≤4hr each, immediate UX or
  epistemic-honesty improvement, no architectural risk.
- **Tier 2 — medium-leverage.** Half-day to two-day items; usually require
  a translator or new prompt; queue after Tier 1.
- **Tier 3 — design-level.** Sprint-shaped, require schema or
  orchestrator-architecture decisions; record now, plan later.
- **Tier 4 — content/process.** Not code changes; prompt-engineering for
  the next experiment iteration.

---

## Tier 1 — execute now

| ID | Title | Surface | Source | Notes |
|---|---|---|---|---|
| **T1.1** | ~~Hydrate `refusalSurface[i].blockerIds` with one-sentence summaries~~ ✅ shipped 2026-05-11 | synthetic-readout | external | Field is now `blockerSummaries: string[]`, parallel-indexed to `blockerIds`, ~160-char truncation. Verified: Arm B emits the field on all 33 refusal entries. |
| **T1.2** | ~~Surface confidence tier (`thin`/`moderate`/`dense`) in `topArguments` and `mostContested`~~ ✅ shipped 2026-05-11 | synthetic-readout | external | Each entry now carries `standingDepth` + `challengerCount` + `reviewerCount`. Verified on Arm B: all 25 topArgs flagged `"thin"` (consistent with `depthDistribution.thin = 126`). |
| **T1.3** | ~~Tag intra- vs. inter-deliberation results in `find_counterarguments`~~ ✅ shipped 2026-05-11 | MCP + API | external (revised) | Every result row now carries `scope: "within" \| "cross"` + `deliberation: {id,title}`. New params: `within_deliberation=<id>` (anchor) and `scope=within\|cross\|both` (default `both`). Response carries `scopeBreakdown: {within, cross}` when both scopes are returned. Within-deliberation hits are stable-sorted ahead of cross hits inside the active sort key, so they aren't pushed off the page. MCP `find_counterarguments` description updated to instruct callers to pass `within_deliberation` whenever summarising a single deliberation, and explicitly frames cross hits as the graph-of-graphs cross-pollination signal rather than noise. Verified on Arm B: `?q=affective+polarization&within_deliberation=…&scope=both` returns `scopeBreakdown:{within:1,cross:7}` with the within hit at index 0; `&scope=within` returns only the intra-room hit. |
| **T1.4** | ~~Surface `refusalSurface` banner in Essay + Brief views~~ ✅ shipped 2026-05-11 | UI | external | New `ChainRefusalBanner` component (`components/chains/ChainRefusalBanner.tsx`) wired into both `ChainEssayView` and `ChainProseView`. Pulls `/api/v3/deliberations/[id]/synthetic-readout?view=compact`, intersects `refusalSurface.cannotConcludeBecause[].conclusionClaimId` with the chain's node conclusion ids, renders amber banner with headline ("This chain's conclusion is blocked by N unanswered objections"), weakest-link blocker label, and up to 2 inline blocker preview lines drawn from T1.1's `blockerSummaries`. Honest-empty: renders nothing when no chain conclusion is in the refusal surface (absence of refusal ≠ presence of support). |
| **T1.5** | ~~Fix chain-fitness flat-counting of rebutted vs unanswered attacks~~ ✅ shipped 2026-05-11 | scoring | external | `chainExposure.ts` now applies `attackerCredibility(standing)` (undermined→0.1, attacked→0.5, else→1.0) before summing inbound attacks into `chainFitness`. Per-arg fitness keeps flat counting (cross-deliberation comparability). Verified on Arm B: Chain-3 fitness moved from −7.0 → −5.11 (about 27% of attack penalty was from refuted attackers). |
| **T1.6** | ~~Persist external-validation note + new backlog items to repo memory~~ ✅ shipped 2026-05-11 | memory | self | Captured to `/memories/repo/synthetic-readout-friction-fixes-2026-05-11.md`: T1.1–T1.5 + T2.7 outcomes, attackerCredibility ladder, FINGERPRINT_VERSION bump pattern (now v4), within-first sort centralisation, ChainRefusalBanner honest-empty rule, MCP rebuild reminder, Arm B verification curl commands, T2.1 next-sprint pointer. |

**Estimated total Tier 1: ~1 day.** Do before the next external test run so the synthesis is structurally cleaner.

---

## Tier 2 — execute after Tier 1

| ID | Title | Surface | Source | Notes |
|---|---|---|---|---|
| **T2.1** | ~~Phase 7 — CQ-raise round~~ ✅ shipped 2026-05-12 | orchestrator | internal + external | New Phase 7 module: 3 challenger agents (advocate-a, advocate-b, methodologist) each pick up to N (default 8) catalog CQs to raise on load-bearing arguments owned by other sides. **No new arguments minted** — translator (`cq-raise-mint.ts`) only POSTs `/api/arguments/{id}/cqs/{cqKey}/ask` (opens CQStatus + WHY move) then `/api/ca` (anchors challenger event for `challengerAuthorsByArg`). Targets are pre-ranked from the synthetic readout's `loadBearingnessRanking` + `contestednessRanking` + chain-architect node set; voice menu = the agent's own already-minted P2/P3/P4 args; CQ catalog loaded fresh from `prisma.criticalQuestion`; existing CQStatus rows are pre-filtered (per-agent + cross-agent) so duplicates don't waste raises. Soft-degrades per-raise failures into `CHALLENGES.md`. Wired through `phaseNameFor(7) → "phase-7-cq-raise"` and `finalize --phase 7 → finalizePhase7`. New `AgentTierRole = "challenger"` opted into `opus-critical` preset. Files: `prompts/12-challenger.md`, `agents/challenger-schema.ts`, `agents/challenger.ts`, `phases/phase-7-cq-raise.ts`, `translators/cq-raise-mint.ts`, `finalize/phase-7-finalize.ts`. |
| **T2.2** | `get_chain_walk` MCP tool | MCP | external | Returns chain nodes in topological order with edges rendered as readable transitions. Two-for-one: improves MCP surface AND gives the chain-essay refactor (P5–P12) a clean intermediate representation to target. |
| **T2.3** | Tiered `get_synthetic_readout` views | synthetic-readout + MCP | external | Add `?view=summary` (~5KB: fingerprint + refusalSurface + chain names + honestyLine), keep `compact` (~45KB) and `full`. Lets LLMs orient first, drill in second. |
| **T2.4** | Prose-view structural redesign (items 5–7 from prose backlog) | UI | both | Honor `epistemicStatus`, `dialecticalRole`, edge-type discourse markers. **Prerequisite for any LLM polish work.** External review: *"polishing bad structure just produces fluent bad structure."* |
| **T2.5** | Conclusion synthesis (item 11 from prose backlog) | UI | both | Chain conclusion should report (a) which premises survived, (b) which objections fell, (c) the residual contested band — not restate the thesis. Same data primitives as T1.4. |
| **T2.6** | Cheap prose bug fixes (items 1–4 from prose backlog) | UI | internal | Intro splice grammar, premise lowercasing, antithesis-claim wrong-target, CQ rendering for expert audience. |
| **T2.7** | ~~Investigate empty `loadBearingnessRanking` in readout~~ ✅ shipped 2026-05-11 | synthetic-readout | external | **Not a bug.** Live curl on Arm B returned all 143 args in `loadBearingnessRanking` and 25 hydrated entries in `topArguments`. The reviewer's empty observation likely reflected a stale `DeliberationFingerprintCache` row from before the per-arg hydration shipped (now auto-evicted by `FINGERPRINT_VERSION` bumps). MCP description for `get_contested_frontier` updated to state explicitly that emptiness only occurs when the deliberation has zero arguments — never a 'minimum density' gate — so empty ≠ withheld. |

**Estimated total Tier 2: 4–6 days.** T2.1 is the single biggest deliberation-quality lever; the rest improve consumer-facing prose surfaces.

---

## Tier 3 — design-level (record, plan separately)

| ID | Title | Surface | Source | Notes |
|---|---|---|---|---|
| **T3.1** | Hybrid auto-derived + editor-curated chains | chain authoring | external | Auto-trace candidate chains from graph topology (top-down through support edges, highest-degree paths); let editors prune/merge/label. Solves "97 uncovered claims" + "wrong three hinges" problems. **Prototype-first.** Pure graph topology doesn't yield "the three most important reasoning paths" without a notion of claim importance that isn't purely structural — degree alone over-weights well-supported peripherals and under-weights load-bearing nodes with thin support. Build a one-off prototype against the current Arm-B deliberation as a test bed (does the auto-derivation recover the editor's three chains? if not, what signal is missing?) before committing to schema changes. |
| **T3.2** | LLM polish path for prose views | UI | internal (item 10) | Gated behind feature flag + per-`(chainId, tone, audience)` cache. Blocked by T2.4 — polish must follow structural correctness. |
| **T3.3** | "Walk me through this graph" interactive query tool | MCP | external | Lighter-weight than full `get_synthetic_readout` for conversational exploration: *"given this deliberation, what arguments bear on claim X, sorted by fitness."* Different ergonomic primitive than today's read-then-synthesize loop. |
| **T3.4** | CQ-draft assistance tool | MCP | external | Take an `(argumentId, cqKey)` pair and return the CQ text + argument premises/conclusion formatted as a draft prompt. **Bridges diagnostic surface and orchestrator.** Today's flow: MCP consumer identifies a weak argument → files a CQ-coverage observation → waits for next phase. With this tool, a human or agent can propose a CQ answer immediately on the same call, and Phase 7 (T2.1) becomes interactive rather than batched. Promote toward Tier 2 once T2.1 ships and we know which CQ keys are most-raised. |
| **T3.5** | Phase-N counter-defense layering revisit | orchestrator | internal | Iter-3 multi-round phases (P3-round2, P4-subround-b) didn't asymptote where we wanted. T2.1 (CQ-raise) is the cheaper alternative; revisit only if CQ-raise also stalls. |

---

## Tier 4 — content / next-experiment-iteration

These aren't code changes; they're prompt or process changes for the next
multi-agent deliberation run.

| ID | Title | Where | Source |
|---|---|---|---|
| **T4.1** | Require evidence rows with DOI/URL when citing studies | P2/P3 prompts | external | "Zero evidence with provenance" was the most-cited content gap. Empirical args reference Guess et al., Piccardi et al. without anchoring metadata. |
| **T4.2** | Add a `conjunction-of-causes` advocate role | orchestrator config | external | Current 3-agent setup polarizes into pro/skeptical/methodologist. The most-likely actual answer ("multiple causes each <10%") has no one defending it. |
| **T4.3** | Require meta-arguments in a dedicated phase | orchestrator phases | external | Missing-moves analysis showed zero meta-arguments (arguments about argument quality) and zero cross-scheme mediators. Add a P3.5 or P5.5 designed to surface these. |
| **T4.4** | Increase participant count target ≥ 5 | experiment design | external | 3 participants × 143 arguments → disagreement map reflects participant framings as much as the issue. |

---

## Cross-references

- Prose-view item numbers (5–15) live in
  `docs/Chain Essay Prose Generator refinement backlog.md` and are
  referenced from T1.4, T1.5, T2.4, T2.5, T2.6, T3.2 above.
- External validation transcript:
  `experiments/Claude-ISONOMIA_TOOL-feedback-May11v1.md`.
- Schema cache invalidation contract:
  `FINGERPRINT_VERSION` constant in `lib/deliberation/fingerprint.ts`.
  Bump when readout shape changes.
