/**
 * orientation.ts — Server-level instructions block + `get_orientation`
 * tool payload for the Isonomia MCP server.
 *
 * Why this exists:
 *   The MCP tool descriptions are accurate per-tool but silent on the
 *   framework. Cold-start agents (Claude eval, May 2026) had to
 *   reverse-engineer `standing`, `MOID`, `refusalSurface`, `chain`,
 *   depth tiers from field names. This module fixes that by:
 *
 *     1. SERVER_INSTRUCTIONS — short ontology + workflow pointer,
 *        loaded once per session via MCP `InitializeResult.instructions`.
 *     2. ORIENTATION_PAYLOAD — long-form glossary + workflow recipes,
 *        returned by the `get_orientation` tool only when called.
 *
 * Both are pragmatic (what do I do with this data?) rather than
 * theoretical (why is the data structured this way?). No argumentation-
 * theory background; every term is defined by its writing-time
 * implications.
 *
 * Versioning: ORIENTATION_VERSION bumps when the payload changes so
 * clients can cache it across sessions without re-reading.
 */
/**
 * Bump when ORIENTATION_PAYLOAD changes. Returned alongside the payload
 * as `version`; agents can hash + cache against this.
 */
export declare const ORIENTATION_VERSION: "1.3.0";
/**
 * Loaded once per MCP session via `InitializeResult.instructions`.
 * Target: ~400 tokens. Keep tight; the long form lives in
 * ORIENTATION_PAYLOAD.
 */
export declare const SERVER_INSTRUCTIONS = "Isonomia exposes a deliberation as a typed argument graph.\n\nONTOLOGY (read once):\nA deliberation contains arguments. Each argument has a conclusion (a claim, identified by content-derived MOID \u2014 multiple arguments can share one), one or more premises, and an argumentation scheme (the reasoning pattern: expert-opinion, analogy, cause-to-effect, IBE, etc.). Arguments connect via typed edges: support, rebut (attack the conclusion), undercut (attack the inference), undermine (attack a premise). Each argument carries a STANDING that progresses untested-default \u2192 untested-supported \u2192 tested-attacked \u2192 tested-undermined \u2192 tested-survived, and a depth tier (thin / moderate / dense) recording how many independent challengers have engaged. Standing without depth is unreliable: \"tested-undermined by 1 thin challenger\" \u2260 \"tested-undermined by 10 dense ones\". Each scheme has CRITICAL QUESTIONS the literature requires for the scheme to hold; unanswered CQs are tracked per argument. CHAINS are editor-curated paths through the graph (premises \u2192 conclusion); chainStanding is worst-link, not average. The REFUSAL SURFACE lists conclusions the graph cannot currently license because of unanswered attacks; entries are hard constraints, not suggestions.\n\nTOOL SELECTION:\nUse IDs correctly \u2014 `get_argument` takes an argument id, `find_counterarguments` takes a claim MOID. They are not interchangeable.\n\nWORKFLOW:\nFor any deliberation question, call `get_orientation` once at session start, then `get_synthetic_readout` once per deliberation. Read its `writingConstraints` before composing output \u2014 it tells you what you must include, what you must not assert, and what you must hedge. Drill into specific arguments with `get_argument` and specific claims with `find_counterarguments` only after orientation.\n\nWRITING TO THE GRAPH (these tools commit rows; treat as first-class, not as fallback):\nWhenever the user states a position, asks you to \"record / log / capture / save / register\" a claim or counter-claim, drafts a thesis, or sketches an evidence-backed argument, reach for a write tool instead of replying in prose. Two write surfaces:\n  \u2022 `propose_argument` \u2014 bare assertion. `{ claim, reasoning?, evidence?[], deliberationId? }`. Use only when the user has a one-line claim with no premises worth naming.\n  \u2022 `propose_structured_argument` \u2014 PREFER THIS whenever the user gives reasons (\"because\u2026\", \"since\u2026\"), names an argumentation pattern (expert opinion, analogy, cause-to-effect, practical reasoning), or expects per-premise standing/CQs. `{ conclusion, premises[], reasoning?, schemeKey?, evidence?[], deliberationId? }`. Each premise becomes its own Claim row, so attackers can later undermine specific premises rather than the whole argument. If unsure which scheme applies, call `list_schemes` first; or omit `schemeKey` and the server will infer one (returned as a `scheme_inferred` warning).\nBoth tools return a permalink + immutable content-addressed URL. Omit `deliberationId` to land in the caller's \"My Arguments\" room; pass one to land in a specific debate. For warrants/inference-licenses against an existing argument, use `propose_warrant`. After any write, call `get_argument` on the returned id (after `retryAfterMs` if `provenancePending` is true) to verify the round-trip before claiming success. Do not invent ids or permalinks \u2014 only echo what the write tool returned.";
/**
 * Returned by the `get_orientation` tool. Markdown-formatted for direct
 * model consumption. Target: ~1.5K tokens.
 */
export declare const ORIENTATION_PAYLOAD: string;
/**
 * Stable content hash for the orientation payload, derived from the
 * version + payload string. Lets clients cache across sessions.
 *
 * Implementation: simple FNV-1a over the version+payload to avoid a
 * crypto dep in this small package. Stable across runs as long as the
 * inputs don't change.
 */
export declare function computeOrientationContentHash(): string;
