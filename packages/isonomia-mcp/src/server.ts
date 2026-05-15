#!/usr/bin/env node
/**
 * Isonomia MCP Server (Track B.2)
 * ──────────────────────────────────────────────────────────────────
 *
 * A Model Context Protocol stdio server that exposes Isonomia's
 * argument-graph as structured tools for LLM clients (Claude Desktop,
 * Cursor, Cline, Continue, etc.).
 *
 * Tools:
 *   • get_orientation      — operational glossary + workflow recipes (cold-start primer)
 *   • search_arguments     — ranked permalinks by query + filters
 *   • get_argument         — full attestation envelope for a permalink
 *   • get_claim            — claim by MOID + supporting argument permalinks
 *   • find_counterarguments — arguments attacking a target claim
 *   • cite_argument        — citation block (URL + content hash + pull quote)
 *   • resolve_citation     — Auto-Citation Engine: URL/DOI → verified Source row
 *   • resolve_citations_bulk — Auto-Citation Engine: bulk URL → Source resolver
 *   • list_schemes         — catalog of argumentation schemes (read primer for `propose_structured_argument`)
 *   • propose_argument     — create a new (bare) argument (requires API token)
 *   • propose_structured_argument — create an argument with explicit premises + scheme (requires API token)
 *
 *   Pt. 4 deliberation-scope tools (read-only):
 *   • get_deliberation_fingerprint — honesty floor for any summary
 *   • get_contested_frontier       — open dialectical edges
 *   • get_missing_moves            — scheme-typical absences
 *   • get_chains                   — chain exposure with weakest link
 *   • get_synthetic_readout        — editorial primitive with refusalSurface
 *   • get_cross_context            — canonical-claim families, plexus edges
 *   • summarize_debate             — wrapper for the readout
 *   • get_deliberation_evidence_context — pre-bound source corpus (B2)
 *
 *   Sprint E ECC tools (typed-algebra, deterministic, no LLM in loop):
 *   • ecc_arrow                       — typed `Hom(I, claim)` + Ambler Def. 8/17 meta
 *   • ecc_culprits                    — Ambler §4 retraction candidates per claim
 *   • ecc_confidence                  — confidence(arrow, monoid), closed enum
 *   • ecc_enthymemes                  — detectEnthymemes() per arg or per delib
 *   • ecc_transport                   — read RoomTransportSnapshot rows (one-hop)
 *   • ecc_aggregate                   — { local, imported, total } band per claim
 *   • ecc_evidential                  — typed evidential projection per delib
 *   • ecc_belief_revision_proposals   — cached BeliefRevisionProposal rows (Sprint D1)
 *   • propose_warrant                 — internal-hom write (AI-authored, awaiting ratification)
 *
 * Run:
 *   ISONOMIA_BASE_URL=https://isonomia.app \
 *   ISONOMIA_API_TOKEN=...                 \
 *   isonomia-mcp
 *
 * Claude Desktop config (~/Library/Application Support/Claude/claude_desktop_config.json):
 *   {
 *     "mcpServers": {
 *       "isonomia": {
 *         "command": "node",
 *         "args": ["/abs/path/to/packages/isonomia-mcp/dist/server.js"],
 *         "env": {
 *           "ISONOMIA_BASE_URL": "https://isonomia.app",
 *           "ISONOMIA_API_TOKEN": "<optional, only for propose_argument>"
 *         }
 *       }
 *     }
 *   }
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { BASE_URL, API_TOKEN, isoFetch, permalinkToShortCode } from "./http.js";
import {
  SERVER_INSTRUCTIONS,
  ORIENTATION_PAYLOAD,
  ORIENTATION_VERSION,
  computeOrientationContentHash,
} from "./orientation.js";

// ============================================================
// Tool input schemas
// ============================================================

const SearchInput = z.object({
  query: z.string().min(1).describe("Free-text query against argument and conclusion text"),
  limit: z.number().int().min(1).max(50).optional().default(10),
  scheme: z
    .string()
    .optional()
    .describe("Optional scheme key filter, e.g. 'expert_opinion', 'analogy'"),
  sort: z
    .enum(["recent", "dialectical_fitness"])
    .optional()
    .default("recent")
    .describe(
      "Ranking. 'recent' = newest first. 'dialectical_fitness' = tested-and-surviving first (answered CQs + supports + provenance-bearing evidence, minus inbound attacks)."
    ),
  mode: z
    .enum(["lexical", "hybrid", "vector"])
    .optional()
    .default("hybrid")
    .describe(
      "Retrieval mode. 'hybrid' (default for MCP) fuses pgvector cosine recall with lexical OR-token recall via Reciprocal Rank Fusion (K=60) — best for natural-language and paraphrased queries. 'lexical' is exact-vocabulary substring matching — best when you already know corpus terminology and want deterministic recall. 'vector' is pure semantic / embedding similarity — best when surface vocabulary is unlikely to match. Each result carries a `hybrid` block (`rrfScore`, `sparseRank`, `denseRank`, `denseDistance`) so confidence is auditable."
    ),  tested_only: z
    .boolean()
    .optional()
    .describe(
      "Phase 2 quality filter. When true, only return arguments whose computed standingState is one of tested-attacked, tested-undermined, or tested-survived — i.e. that have actually been challenged in the graph. Use this when the caller wants 'arguments with skin in the game,' not arguments-as-stated."
    ),
  min_cq_satisfied: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe(
      "Phase 2 quality filter. Minimum number of SATISFIED (or PARTIALLY_SATISFIED) critical-question statuses recorded against the argument. Higher values surface arguments whose scheme-typical CQs have been actively answered."
    ),
  min_evidence: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe(
      "Phase 2 quality filter. Minimum count of evidence rows on the conclusion claim with a contentSha256 (provenance-anchored evidence). Use min_evidence=1 to demand at least one citable source."
    ),
  since: z
    .string()
    .optional()
    .describe("ISO-8601 date or datetime; lower bound on argument createdAt."),
  until: z
    .string()
    .optional()
    .describe("ISO-8601 date or datetime; upper bound on argument createdAt."),
  conclusion_moid: z
    .string()
    .optional()
    .describe(
      "Phase 6 — claim MOID. When set, restricts results to arguments whose conclusion is this claim (the 'for' stance). Symmetric to the `find_counterarguments` tool but inline in search."
    ),
  include_strongest_counter: z
    .boolean()
    .optional()
    .describe(
      "Phase 5 counter-citation discovery. When true, each result is enriched with a `strongestCounter` block (or `null` when none on file) pointing at the most-engaged structural contester to its conclusion claim. Self-counters (same conclusion MOID) are excluded so an absence is honest."
    ),
  strongest_counter_k: z
    .number()
    .int()
    .min(1)
    .max(50)
    .optional()
    .describe(
      "How many top results to enrich with strongestCounter (default 10). Only meaningful when include_strongest_counter=true."
    ),
});

const GetArgumentInput = z.object({
  permalink: z
    .string()
    .min(1)
    .describe("Argument permalink URL, /a/<shortCode>, or bare shortCode (immutable @hash form accepted)"),
  format: z
    .enum(["attestation", "jsonld", "aif"])
    .optional()
    .default("attestation")
    .describe(
      "Representation to return. 'attestation' (default) is the compact citation envelope an LLM should embed when it cites Isonomia. 'jsonld' is a rich Schema.org composite (Claim + ScholarlyArticle + ClaimReview + AIF) for downstream agents that consume Schema.org. 'aif' is the AIF-JSON-LD argument-graph subgraph with critical questions and inbound conflict/preference nodes."
    ),
});

const GetClaimInput = z.object({
  moid: z.string().min(1).describe("Claim MOID (content-derived id)"),
});

const GetClaimStancesInput = z.object({
  moid: z.string().min(1).describe("Claim MOID (content-derived id)."),
  limit: z
    .number()
    .int()
    .min(1)
    .max(50)
    .optional()
    .default(10)
    .describe("Max results per stance."),
  sort: z
    .enum(["recent", "dialectical_fitness"])
    .optional()
    .default("dialectical_fitness")
    .describe(
      "Per-stance ordering. Default re-ranks each list by tested-and-survived (answered CQs + supports + provenance, minus open attacks).",
    ),
  include_strongest_counter: z
    .boolean()
    .optional()
    .describe(
      "When true, attach a `strongestCounter` block to each result on both sides — useful for one-shot dual-column rendering.",
    ),
});

const FindCounterargumentsInput = z.object({
  claim_moid: z
    .string()
    .optional()
    .describe("MOID of the target claim. Either claim_moid or claim_text is required."),
  claim_text: z
    .string()
    .optional()
    .describe("Free-text claim. Used when no MOID is known."),
  limit: z.number().int().min(1).max(25).optional().default(10),
  mode: z
    .enum(["lexical", "hybrid", "vector"])
    .optional()
    .default("hybrid")
    .describe(
      "Retrieval mode for the candidate pool. 'hybrid' (default) fuses pgvector cosine + lexical via RRF — best when the counter-argument may not share surface vocabulary with the target claim. See `search_arguments` for a fuller description of each mode."
    ),
  within_deliberation: z
    .string()
    .optional()
    .describe(
      "Anchor deliberation id. When supplied, every result is tagged `scope: 'within' | 'cross'` against this anchor and the response carries a `scopeBreakdown` count, so intra-deliberation hits are visually distinguishable from cross-deliberation analogies. Without this, no scope tagging is performed and behaviour matches the legacy global search.",
    ),
  scope: z
    .enum(["within", "cross", "both"])
    .optional()
    .default("both")
    .describe(
      "How to filter against `within_deliberation`. 'within' = only intra-deliberation hits; 'cross' = only OTHER deliberations; 'both' (default) = both, with intra-deliberation results stable-sorted ahead of cross hits inside the active sort key. Has no effect when `within_deliberation` is unset.",
    ),
});

const CiteArgumentInput = z.object({
  permalink: z.string().min(1).describe("Argument permalink URL or shortCode"),
  pullQuoteMaxChars: z.number().int().min(40).max(800).optional().default(280),
  includeStrongestObjection: z
    .boolean()
    .optional()
    .default(true)
    .describe(
      "When true (default), also fetch the strongest known counter-argument to this argument's conclusion and include it in the citation block, so the cited claim arrives with its dialectical opposition attached."
    ),
  format: z
    .enum(["markdown", "apa", "mla", "chicago", "bibtex", "ris", "csl"])
    .optional()
    .default("markdown")
    .describe(
      "Citation rendering format. 'markdown' (default) returns the Isonomia citation block with provenance + strongest-objection. 'apa' / 'mla' / 'chicago' return plain-text scholarly citations (AI-EPI E.1). 'bibtex' / 'ris' return reference-manager import strings. 'csl' returns CSL-JSON. The structured fields (permalink, contentHash, dialecticalStatus, etc.) are always included regardless of format."
    ),
});

// ── Auto-Citation Engine (docs/AUTO_CITATION_ENGINE_ROADMAP.md, Phase 7) ──
// resolve_citation lets an orchestrator agent pre-mint a verified
// `Source` row for any URL/DOI before citing it. The waterfall is
// Crossref → arXiv → Highwire (DC/OG) → LLM → Wayback fallback, with
// per-host rate-limit + 6h LRU + Wayback archive enrichment.
const ResolveCitationInput = z.object({
  url: z
    .string()
    .url()
    .describe(
      "URL or DOI URL to resolve (e.g. 'https://doi.org/10.1038/nature14539', 'https://arxiv.org/abs/1706.03762', or any web URL). Single-URL form."
    ),
  persistEmpty: z
    .boolean()
    .optional()
    .describe(
      "When true, persist a bare URL stub even when no metadata could be resolved (confidence='none'). Default false — unresolvable URLs are returned but not stored."
    ),
});

const ResolveCitationsBulkInput = z.object({
  urls: z
    .array(z.string().url())
    .min(1)
    .max(200)
    .describe(
      "URLs to resolve in a single batch. Server-side dedup is applied. Hard cap 200/request to keep one client from monopolising the outbound rate-limit budget."
    ),
  concurrency: z
    .number()
    .int()
    .min(1)
    .max(10)
    .optional()
    .describe("Max inflight resolutions. Default 3."),
  persistEmpty: z.boolean().optional(),
});

const ProposeArgumentInput = z.object({
  claim: z.string().min(1).max(2000).describe("The claim text the argument will conclude with"),
  reasoning: z.string().max(5000).optional().describe("Optional reasoning text"),
  evidence: z
    .array(
      z.object({
        url: z.string().url(),
        title: z.string().max(500).optional(),
        quote: z
          .string()
          .max(2000)
          .optional()
          .describe(
            "Verbatim excerpt from the source. Use when you can quote directly. If both quote and summary are provided, summary wins.",
          ),
        summary: z
          .string()
          .max(2000)
          .optional()
          .describe(
            "Paraphrased claim about what the source establishes. Use when recording a position rather than excerpting. Treated identically to quote for fitness scoring (which keys on URL provenance hash, not text).",
          ),
      })
    )
    .max(10)
    .optional()
    .default([])
    .describe("Up to 10 evidence sources. Each item should provide quote OR summary (not both)."),
  deliberationId: z.string().optional(),
});

// ── propose_structured_argument input ──────────────────────────────
const ProposeStructuredArgumentInput = z.object({
  conclusion: z
    .string()
    .min(1)
    .max(2000)
    .describe(
      "The conclusion the argument supports. Will be minted as a `Claim` row (content-hashed via MOID).",
    ),
  premises: z
    .array(
      z.object({
        text: z
          .string()
          .min(1)
          .max(1000)
          .describe("Premise text. Each premise becomes its own Claim row, so attackers can later undermine specific premises rather than the whole argument."),
        isAxiom: z
          .boolean()
          .optional()
          .default(false)
          .describe("Mark this premise as an axiom (no further justification expected). Defaults false."),
      }),
    )
    .min(1)
    .max(10)
    .describe("1–10 premises. Premises that hash to the same content as each other or as the conclusion will be deduped (surfaced as `premise_deduped` warnings)."),
  reasoning: z
    .string()
    .max(5000)
    .optional()
    .describe(
      "Free-text narrative gloss tying the premises to the conclusion. Stored on `Argument.text` as a readable summary alongside the structured premises (which remain the formal object).",
    ),
  schemeKey: z
    .string()
    .max(100)
    .optional()
    .describe(
      "Argumentation-scheme key (e.g. 'expert_opinion', 'practical_reasoning', 'cause_to_effect'). Call `list_schemes` first if unsure. If omitted, the server infers a scheme from the reasoning + premises and returns a `scheme_inferred` warning.",
    ),
  ruleType: z
    .enum(["STRICT", "DEFEASIBLE"])
    .optional()
    .default("DEFEASIBLE")
    .describe("ASPIC+ rule type. Almost always 'DEFEASIBLE'; use 'STRICT' only for definitional / mathematical inferences."),
  ruleName: z.string().max(200).optional().describe("Optional human-readable name for STRICT rules."),
  implicitWarrant: z
    .string()
    .max(2000)
    .optional()
    .describe("Optional inference-license warrant text. For richer warrants attached to an existing argument, use `propose_warrant` instead."),
  evidence: z
    .array(
      z.object({
        url: z.string().url(),
        title: z.string().max(500).optional(),
        quote: z.string().max(2000).optional(),
        summary: z.string().max(2000).optional(),
      }),
    )
    .max(10)
    .optional()
    .default([])
    .describe(
      "Up to 10 evidence sources. **v1 attaches all evidence to the conclusion claim** (per-premise evidence ships in v1.1). Each item should provide `quote` OR `summary`. Pair with `resolve_citation` first when given a DOI / arXiv id / publisher URL.",
    ),
  isPublic: z.boolean().optional().default(true),
  deliberationId: z
    .string()
    .optional()
    .describe("Target deliberation id. Omit to land in the caller's 'My Arguments' room."),
});

// ── list_schemes (read tool) ────────────────────────────────────
// Discovery primer for the upcoming `propose_structured_argument`
// write tool: lets an LLM browse the scheme catalog and pick a
// `schemeKey` rather than guessing one. Backed by GET /api/schemes,
// projected down to fields useful for scheme selection.
const ListSchemesInput = z.object({
  clusterTag: z
    .string()
    .optional()
    .describe(
      "Optional filter by `clusterTag` (e.g. 'expert', 'causal', 'practical', 'analogical'). Schemes are grouped by clusterTag in the catalog; pass this when you already know the family of reasoning you're after.",
    ),
  includeExamples: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      "When true, include the `examples` array per scheme (concrete worked examples). Off by default to keep payloads small — each example can be ~100 tokens.",
    ),
  limit: z
    .number()
    .int()
    .min(1)
    .max(200)
    .optional()
    .default(100)
    .describe("Max number of schemes to return. Default 100; the catalog is small (~30–60 schemes) so the default usually returns everything."),
});

// ── Track AI-EPI Pt. 4 — deliberation-scope read tools ──────────

const DeliberationIdInput = z.object({
  deliberationId: z
    .string()
    .min(1)
    .describe("Deliberation id (cuid)"),
});

const FrontierInput = z.object({
  deliberationId: z.string().min(1).describe("Deliberation id (cuid)"),
  sortBy: z
    .enum(["loadBearingness", "recency", "severity"])
    .optional()
    .default("loadBearingness")
    .describe(
      "Order of returned items. 'loadBearingness' (default) ranks by frontier impact; 'severity' surfaces scheme-required items first; 'recency' uses argument creation order.",
    ),
});

// ── Sprint E (ECC) — typed-algebra tools backed by /api/v3/deliberations/[id]/ecc/* ──

const EccDelibClaimInput = z.object({
  deliberationId: z.string().min(1).describe("Deliberation id (cuid)"),
  claimId: z.string().min(1).describe("Claim id (cuid) within that deliberation"),
});

const EccDelibClaimModeInput = EccDelibClaimInput.extend({
  mode: z
    .enum(["min", "product", "ds"])
    .optional()
    .default("product")
    .describe(
      "Confidence monoid (closed enum, ECC plan \u00a74 row 5). 'min' = weakest-link (Ambler Ex. 25); 'product' = noisy-OR (Ambler Ex. 28); 'ds' = Dempster-Shafer {bel,pl} (Ambler Thm. 30). No caller-supplied monoids.",
    ),
});

const EccEnthymemesInput = z.object({
  deliberationId: z.string().min(1),
  argumentId: z
    .string()
    .optional()
    .describe(
      "When supplied, runs detectEnthymemes against this single argument. When omitted, scans every argument with a primary scheme assignment in the deliberation.",
    ),
});

const EccTransportInput = z.object({
  deliberationId: z
    .string()
    .min(1)
    .describe("Destination deliberation (where imported support lands)."),
  fromRoomId: z
    .string()
    .optional()
    .describe(
      "Source deliberation. Omit to return every cached snapshot landing on the destination.",
    ),
});

const EccAggregateInput = EccDelibClaimInput.extend({
  mode: z
    .enum(["min", "product"])
    .optional()
    .default("product")
    .describe(
      "Aggregation monoid. DS-mode aggregation is not cached and is therefore not supported here; ask the local /confidence tool for ds.",
    ),
});

const EccEvidentialInput = z.object({
  deliberationId: z.string().min(1),
  mode: z.enum(["min", "product", "ds"]).optional().default("product"),
  imports: z
    .enum(["off", "materialized", "virtual", "all"])
    .optional()
    .default("off")
    .describe(
      "Whether to fold transported support from other rooms into the result. 'materialized' uses the cached `RoomTransportSnapshot` rows; 'virtual' uses live `ArgumentImport` rows; 'all' uses both.",
    ),
});

const EccDelibIdInput = z.object({
  deliberationId: z.string().min(1),
});

const ProposeWarrantInput = z.object({
  deliberationId: z.string().min(1),
  argumentId: z.string().min(1).describe("Host argument id; the warrant attaches as an AssumptionUse on this argument."),
  warrantText: z.string().min(1).max(2000).describe("The proposed warrant text. Will become a new Claim + AI-authored Argument."),
  authorKind: z
    .enum(["AI", "HYBRID"])
    .optional()
    .default("AI")
    .describe("Provenance flag. Both AI and HYBRID warrants are non-logical until a HUMAN explicitly ratifies (ECC plan \u00a74 row 3)."),
  model: z.string().optional().describe("Model identifier (e.g. 'claude-opus-4.7'). Stored under aiProvenance.model."),
  promptHash: z.string().optional(),
  sourceUrls: z.array(z.string().url()).optional(),
  hint: z.string().optional(),
});

// ============================================================
// Tool registry
// ============================================================

interface ToolSpec {
  name: string;
  description: string;
  inputSchema: any; // JSON Schema
  handler: (args: any) => Promise<unknown>;
}

const tools: ToolSpec[] = [
  {
    name: "get_orientation",
    description:
      "Returns the operational glossary, workflow recipes, and worked examples for this MCP server. Call ONCE at session start before any other Isonomia tool — costs ~1.5K tokens but eliminates the cold-start round-trips needed to infer field semantics (standing, MOID, refusalSurface, depth tiers, writingConstraints). Output includes a `version` and `contentHash` so clients can cache it across sessions and skip re-reading when the hash hasn't changed.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    async handler() {
      return {
        version: ORIENTATION_VERSION,
        contentHash: computeOrientationContentHash(),
        format: "markdown",
        payload: ORIENTATION_PAYLOAD,
      };
    },
  },
  {
    name: "search_arguments",
    description:
      "Search Isonomia for public arguments, claims, and counter-arguments by free-text query. Use this as the first step for any debate, controversy, position, objection, rebuttal, supporting reason, or evidence question. Returns ranked permalinks with scheme, conclusion, and an attestation URL. Defaults to mode='hybrid' (pgvector cosine + lexical OR-tokens fused via RRF, K=60) so paraphrased queries hit semantically related arguments even when surface vocabulary differs; pass mode='lexical' for deterministic substring matching or mode='vector' for pure embedding similarity. Supports sort='dialectical_fitness' to rank by tested-and-survived (answered CQs, supports, evidence with provenance, minus open attacks). When sort='dialectical_fitness' is used, each result also carries a `fitnessBreakdown` object decomposing the score into its weighted components (cqAnswered, supportEdges, attackEdges, attackCAs, evidenceWithProvenance) plus the formula weights, so the score is auditable rather than opaque. When mode is hybrid or vector, each result also carries a `hybrid` block (rrfScore, sparseRank, denseRank, denseDistance) so retrieval confidence is auditable. Phase 2 quality filters — tested_only (only arguments that have been challenged in the graph), min_cq_satisfied (minimum answered critical-questions), min_evidence (minimum provenance-anchored evidence rows on the conclusion), and since/until (ISO-8601 date range on createdAt) — narrow results to arguments that meet a higher quality bar. → next: for any deliberation you summarise, call get_synthetic_readout and obey its writingConstraints before composing prose; for a single citation, call get_argument and hedge per its standingState.",
    inputSchema: zodToJsonSchema(SearchInput),
    async handler(args) {
      const input = SearchInput.parse(args);
      const url =
        `/api/v3/search/arguments?q=${encodeURIComponent(input.query)}` +
        `&limit=${input.limit}` +
        (input.scheme ? `&scheme=${encodeURIComponent(input.scheme)}` : "") +
        (input.sort ? `&sort=${encodeURIComponent(input.sort)}` : "") +
        (input.mode ? `&mode=${encodeURIComponent(input.mode)}` : "") +
        (input.tested_only ? `&tested_only=1` : "") +
        (input.min_cq_satisfied != null ? `&min_cq_satisfied=${input.min_cq_satisfied}` : "") +
        (input.min_evidence != null ? `&min_evidence=${input.min_evidence}` : "") +
        (input.since ? `&since=${encodeURIComponent(input.since)}` : "") +
        (input.until ? `&until=${encodeURIComponent(input.until)}` : "") +
        (input.conclusion_moid ? `&conclusion_moid=${encodeURIComponent(input.conclusion_moid)}` : "") +
        (input.include_strongest_counter ? `&include_strongest_counter=1` : "") +
        (input.strongest_counter_k != null ? `&strongest_counter_k=${input.strongest_counter_k}` : "");
      return await isoFetch(url);
    },
  },
  {
    name: "get_argument",
    description:
      "Fetch a structured representation of an argument permalink. Default format='attestation' returns the compact citation envelope (conclusion, premises, scheme, evidence with sha256 + archive URL, dialectical status, standingState). The envelope also carries: `structuredCitations` (canonical CitationBlock[] with url/doi/publisher/quote/quoteAnchor) for citation-grade serialization; `criticalQuestions` (per-CQ status aggregate — `answered`, `partiallyAnswered`, `unanswered` — so consumers can see which CQs are open without inferring from absence); `fitnessBreakdown` decomposing the dialectical-fitness score into weighted contributors; `standingDepth` annotating the standing label with distinct-author challenger/reviewer counts and a `confidence` tier (thin|moderate|dense) so 'tested-survived (1 challenger)' is not read as 'vetted by the field'; and `author.kind` (HUMAN|AI|HYBRID) plus `author.aiProvenance` so AI-authored arguments are explicitly flagged. Pass format='jsonld' for the rich Schema.org composite (Claim + ScholarlyArticle + ClaimReview + AIF) or format='aif' for the AIF-JSON-LD subgraph with critical questions. → also use this to verify the round-trip after `propose_argument` writes a new argument. → next: if standingState is not 'tested-survived' with standingDepth.confidence ≥ moderate, hedge per the parent deliberation's writingConstraints (or refuse if it appears in mustNotAssert); do not cite as settled evidence.",
    inputSchema: zodToJsonSchema(GetArgumentInput),
    async handler(args) {
      const input = GetArgumentInput.parse(args);
      const sc = permalinkToShortCode(input.permalink);
      return await isoFetch(
        `/api/a/${encodeURIComponent(sc)}/aif?format=${encodeURIComponent(input.format)}`,
      );
    },
  },
  {
    name: "get_claim",
    description:
      "Look up a claim by its MOID and return the canonical text plus supporting argument permalinks and evidence.",
    inputSchema: zodToJsonSchema(GetClaimInput),
    async handler(args) {
      const input = GetClaimInput.parse(args);
      return await isoFetch(`/api/c/${encodeURIComponent(input.moid)}`);
    },
  },
  {
    name: "get_claim_stances",
    description:
      "Phase 6 — stance retrieval. Given a claim MOID, return two ranked lists of public arguments: `for` (arguments whose conclusion is the claim) and `against` (structural contesters: rebut/undercut argument-edges + conflict-applications). Both lists carry the full search-result shape (standingState, dialecticalFitness, attestationUrl, hybrid block) so any client that already understands a search result understands a stance result. Self-counters are excluded by MOID. Honest-empty: an empty list means no public arguments are on file for that side, not a 404. Pass include_strongest_counter=true to additionally attach a `strongestCounter` block to each result on both sides — useful for showing 'argument X (best counter to it: Y)' on a claim page. The killer query for any debate UI: one call gives you the dual-column 'arguments for / arguments against' view. → next: read writingConstraints from the parent deliberation's get_synthetic_readout before composing 'for/against' prose; an empty side is honestly empty, not balanced — do not invent symmetry.",
    inputSchema: zodToJsonSchema(GetClaimStancesInput),
    async handler(args) {
      const input = GetClaimStancesInput.parse(args);
      const params = new URLSearchParams();
      params.set("limit", String(input.limit));
      if (input.sort) params.set("sort", input.sort);
      if (input.include_strongest_counter) params.set("include_strongest_counter", "1");
      return await isoFetch(
        `/api/v3/claims/${encodeURIComponent(input.moid)}/stances?${params.toString()}`,
      );
    },
  },
  {
    name: "find_counterarguments",
    description:
      "Find counter-arguments, objections, rebuttals, attacks, and dissenting positions against a target claim. Accepts a MOID (preferred) or free text. Returns arguments whose conclusion contests the target; arguments with the same conclusion MOID are excluded so an empty result is honestly empty (no false counters). Defaults to mode='hybrid' so candidate counter-arguments don't have to share surface vocabulary with the target claim (e.g. 'Odgers' shows up against a 'Haidt'-style claim even though the words don't overlap). **When you are summarising a single deliberation, ALWAYS pass `within_deliberation=<that-deliberation-id>` so each result carries `scope: 'within' | 'cross'` and the response includes a `scopeBreakdown` count.** Cross-deliberation hits are NOT noise — they are the graph-of-graphs cross-pollination signal that surfaces structurally analogous arguments from sibling debates (e.g. specification-curve methodology imported from the adolescent-mental-health debate into a polarization debate). Use `scope='within'` only when you explicitly want to ignore cross-context analogies. v0 uses textual stance heuristics; a true negation/contradiction index ships with Track C.2. → next: cross-check each counter against get_synthetic_readout.refusalSurface and writingConstraints.mustNotAssert before treating it as a defeater; an unanswered counter promotes its target into the refusal surface.",
    inputSchema: zodToJsonSchema(FindCounterargumentsInput),
    async handler(args) {
      const input = FindCounterargumentsInput.parse(args);
      if (!input.claim_moid && !input.claim_text) {
        throw new Error("Provide claim_moid or claim_text");
      }
      const params = new URLSearchParams();
      params.set("limit", String(input.limit));
      if (input.claim_moid) params.set("against", input.claim_moid);
      if (input.claim_text) params.set("q", input.claim_text);
      if (input.mode) params.set("mode", input.mode);
      if (input.within_deliberation)
        params.set("within_deliberation", input.within_deliberation);
      if (input.scope) params.set("scope", input.scope);
      return await isoFetch(`/api/v3/search/arguments?${params.toString()}`);
    },
  },
  {
    name: "cite_argument",
    description:
      "Return a ready-to-paste citation block for an Isonomia argument: canonical permalink, immutable content-hashed URL, retrieval timestamp, conclusion pull quote, dialectical status (with explicit standingState so 'untested-default' is not confused with 'tested-survived'), premise/evidence provenance counters (so unattested premises are surfaced honestly), and — by default — the strongest known counter-argument so the citation arrives with its opposition attached. Pass `format` ('apa' | 'mla' | 'chicago' | 'bibtex' | 'ris' | 'csl') to receive the canonical scholarly citation string in place of the markdown block (AI-EPI E.1). Always returns the Isonomia URN `iso:argument:<shortCode>` (AI-EPI E.2) and a DOI when one is registered. → next: if the returned standingState is not 'tested-survived', reproduce the matching hedge from writingConstraints.shouldHedge alongside the citation; never present a citation as a settled fact when its standing is thin/undermined/undercut.",
    inputSchema: zodToJsonSchema(CiteArgumentInput),
    async handler(args) {
      const input = CiteArgumentInput.parse(args);
      const sc = permalinkToShortCode(input.permalink);
      const att = (await isoFetch(`/api/a/${encodeURIComponent(sc)}/aif?format=attestation`)) as any;
      const conclusion: string = att?.conclusion?.text ?? att?.text ?? "";
      const pullQuote =
        conclusion.length > input.pullQuoteMaxChars
          ? conclusion.slice(0, input.pullQuoteMaxChars - 1).trimEnd() + "…"
          : conclusion;

      // Track AI-EPI E.1 — when a non-markdown format is requested, fetch
      // the canonical scholarly citation from the cite endpoint so MCP
      // consumers and the website always render the same string.
      let formattedCitation: string | null = null;
      if (input.format !== "markdown") {
        formattedCitation = (await isoFetch(
          `/api/a/${encodeURIComponent(sc)}/cite?format=${input.format}`,
          { raw: true }
        )) as string;
      }

      const ds = att?.dialecticalStatus ?? {};

      // Premise / evidence provenance counters. The attestation envelope
      // already carries the full premise + evidence arrays; we surface
      // counts here so a model citing this argument is forced to notice
      // unattested premises rather than having to derive it.
      const premises: any[] = Array.isArray(att?.premises) ? att.premises : [];
      const evidence: any[] = Array.isArray(att?.evidence) ? att.evidence : [];
      const premiseCount = premises.length;
      const evidenceAttachedCount = evidence.length;
      const evidenceWithProvenanceCount = evidence.filter(
        (e: any) => !!(e?.contentSha256 || e?.archive?.url)
      ).length;

      // Explicit standingState — Claude-feedback fix. The raw standingScore
      // is non-obvious (e.g. 1.0 can mean 'scheme requires 0 CQs and nothing
      // attacks it' rather than 'survived attack'). standingState classifies
      // the score so consumers can't misread it.
      const testedness: string | undefined = ds.testedness;
      const incomingAttacks = Number(ds.incomingAttacks ?? 0);
      const standingScore = ds.standingScore;
      let standingState: "untested-default" | "untested-supported" | "tested-attacked" | "tested-survived" | "tested-undermined";
      if (testedness === "untested" || (Number(ds.criticalQuestionsAnswered ?? 0) === 0 && incomingAttacks === 0)) {
        standingState = Number(ds.incomingSupports ?? 0) > 0 ? "untested-supported" : "untested-default";
      } else if (incomingAttacks > 0 && Number(ds.criticalQuestionsAnswered ?? 0) === 0) {
        standingState = "tested-undermined";
      } else if (incomingAttacks > 0) {
        standingState = "tested-attacked";
      } else {
        standingState = "tested-survived";
      }

      // Counter-citation reflex (Claude-feedback fix). Surface the strongest
      // known counter-argument inline so a model can never cite this argument
      // without seeing what attacks it. Honest-empty is the failure mode, not
      // a false counter.
      let strongestObjection: any = null;
      if (input.includeStrongestObjection && att?.conclusion?.moid) {
        try {
          const params = new URLSearchParams();
          params.set("against", att.conclusion.moid);
          params.set("limit", "1");
          params.set("sort", "dialectical_fitness");
          const counters = (await isoFetch(
            `/api/v3/search/arguments?${params.toString()}`
          )) as any;
          const top = counters?.results?.[0];
          if (top) {
            strongestObjection = {
              permalink: top.permalink,
              shortCode: top.shortCode,
              conclusionText: top.conclusion?.text ?? null,
              scheme: top.scheme?.key ?? null,
              dialecticalFitness: top.dialecticalFitness ?? null,
              attestationUrl: top.attestationUrl,
            };
          }
        } catch {
          // honest-empty if the counter lookup fails
          strongestObjection = null;
        }
      }

      const provenanceLine =
        evidenceAttachedCount === 0 && premiseCount > 0
          ? `Provenance: ⚠ ${premiseCount} premise(s) asserted, 0 with attached evidence`
          : `Provenance: ${evidenceWithProvenanceCount}/${evidenceAttachedCount} evidence items have content hash; ${premiseCount} premise(s)`;

      // Track AI-EPI Pt. 3 §3 — surface participation depth so a
      // "tested-survived (1 challenger)" label can't be misread as
      // "vetted by the field."
      const sd = (att?.dialecticalStatus?.standingDepth ?? null) as
        | { challengers: number; independentReviewers: number; confidence: string }
        | null;
      const standingDepthLine = sd
        ? `Depth: ${sd.challengers} challenger(s), ${sd.independentReviewers} reviewer(s), confidence=${sd.confidence}`
        : `Depth: n/a`;

      // Track AI-EPI Pt. 3 §2 — unanswered critical questions, named.
      const cq = (att?.criticalQuestions ?? null) as
        | { total: number; answered: any[]; partiallyAnswered: any[]; unanswered: any[] }
        | null;
      const cqLine = cq
        ? `CQs: ${cq.answered.length}/${cq.total} answered, ${cq.partiallyAnswered.length} partial, ${cq.unanswered.length} unanswered`
        : `CQs: no scheme catalog attached`;

      // Track AI-EPI Pt. 3 §5 — explicit AI-authored flag in the citation.
      const ak = (att?.author?.kind ?? "HUMAN") as "HUMAN" | "AI" | "HYBRID";
      const authorLine =
        ak === "HUMAN"
          ? ""
          : `\nAuthor: AI-drafted (${ak}; model=${(att?.author?.aiProvenance as any)?.model ?? "unknown"})`;

      const objectionLine = strongestObjection
        ? `\nStrongest objection: [${strongestObjection.shortCode}](${strongestObjection.permalink}) — "${(strongestObjection.conclusionText ?? "").slice(0, 160)}"`
        : input.includeStrongestObjection
        ? `\nStrongest objection: none on file (no counter-arguments indexed against this conclusion)`
        : "";

      const markdown =
        `> ${pullQuote}\n\n` +
        `— [Isonomia argument ${sc}](${att?.permalink ?? `${BASE_URL}/a/${sc}`}) ` +
        `(version ${att?.version ?? "?"}, ${att?.contentHash ?? "no-hash"})\n\n` +
        `Immutable: ${att?.immutablePermalink ?? "n/a"}\n` +
        `Retrieved: ${att?.retrievedAt ?? new Date().toISOString()}\n` +
        `Dialectical: ${ds.criticalQuestionsAnswered ?? 0}/${ds.criticalQuestionsRequired ?? 0} CQs answered, ` +
        `${ds.incomingAttacks ?? 0} attacks, standing=${standingScore ?? "n/a"} (${standingState})\n` +
        cqLine + `\n` +
        standingDepthLine + `\n` +
        provenanceLine +
        authorLine +
        objectionLine;

      return {
        permalink: att?.permalink ?? `${BASE_URL}/a/${sc}`,
        immutablePermalink: att?.immutablePermalink ?? null,
        // Track AI-EPI E.2 — Isonomia URN ("iso:argument:<shortCode>") +
        // its canonical resolver URL. Always returned so MCP consumers
        // can persist a stable identifier independent of the URL form.
        isoId: att?.isoId ?? `iso:argument:${sc}`,
        isoUrl: att?.isoUrl ?? `${BASE_URL}/iso/argument/${sc}`,
        doi: att?.doi ?? null,
        format: input.format,
        contentHash: att?.contentHash ?? null,
        version: att?.version ?? null,
        retrievedAt: att?.retrievedAt ?? new Date().toISOString(),
        pullQuote,
        dialecticalStatus: { ...ds, standingState },
        // Track AI-EPI Pt. 3 §2/§3/§5/§7 — lift the new structured fields
        // straight from the attestation so MCP consumers don't have to
        // re-fetch a different format.
        criticalQuestions: cq,
        standingDepth: sd,
        author: att?.author ?? null,
        structuredCitations: Array.isArray((att as any)?.structuredCitations)
          ? (att as any).structuredCitations
          : [],
        provenance: {
          premiseCount,
          evidenceAttachedCount,
          evidenceWithProvenanceCount,
          unattestedPremises: evidenceAttachedCount === 0 && premiseCount > 0,
        },
        strongestObjection,
        // When a scholarly format was requested, the canonical citation
        // string from the cite endpoint replaces the markdown block; the
        // markdown block is still surfaced too so dialectical context
        // never gets lost.
        markdown: formattedCitation ?? markdown,
        ...(formattedCitation !== null ? { markdownContext: markdown } : {}),
      };
    },
  },
  {
    name: "resolve_citation",
    description:
      "Auto-Citation Engine (Phase 7). Resolve a single URL or DOI into a verified bibliographic record by running the Crossref → arXiv → Highwire (DC/OG) → LLM → Wayback waterfall, and persist the result as a Source row keyed by DOI > fingerprint > URL. Returns `{ source, citation, resolvedFrom, enrichedBy[], confidence, archiveUrl, durationMs, cached, warnings, derivedIdentifiers }`. `confidence` ∈ 'high' (Crossref/arXiv), 'medium' (Highwire scrape), 'low' (LLM extraction — verify before publishing!), 'none' (unresolvable; archiveUrl may still be set). `derivedIdentifiers.{doi,arxivId}` is populated even when confidence='none' — the URL itself often embeds a DOI we extracted before the publisher 403'd, and that DOI is still attachable to evidence. → pair with `propose_argument` (call this FIRST when the user gives you a DOI, arXiv id, or bare URL, then attach the resolved metadata to evidence). → also: `resolve_citations_bulk` for multi-URL imports. REQUIRES the ISONOMIA_API_TOKEN env var.",
    inputSchema: zodToJsonSchema(ResolveCitationInput),
    async handler(args) {
      if (!API_TOKEN) {
        throw new Error(
          "resolve_citation requires the ISONOMIA_API_TOKEN env var. Restart the MCP server with a valid bearer token."
        );
      }
      const input = ResolveCitationInput.parse(args);
      return await isoFetch("/api/citations/resolve-url", {
        method: "POST",
        authenticated: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: input.url, persistEmpty: input.persistEmpty }),
      });
    },
  },
  {
    name: "resolve_citations_bulk",
    description:
      "Auto-Citation Engine bulk (Phase 7). Resolve up to 200 URLs in one round-trip; useful for stack imports or when seeding a deliberation with a literature list. Returns `{ results: ResolvedCitationRecord[], total }`; each record has the same shape as `resolve_citation` (without the chip-projection `citation` field) including `derivedIdentifiers` even on confidence='none' rows. Server applies dedup + bounded concurrency (default 3, max 10). → pair with `propose_argument` for each result you want to record; → see `resolve_citation` for the single-URL variant and full field semantics. REQUIRES the ISONOMIA_API_TOKEN env var.",
    inputSchema: zodToJsonSchema(ResolveCitationsBulkInput),
    async handler(args) {
      if (!API_TOKEN) {
        throw new Error(
          "resolve_citations_bulk requires the ISONOMIA_API_TOKEN env var. Restart the MCP server with a valid bearer token."
        );
      }
      const input = ResolveCitationsBulkInput.parse(args);
      return await isoFetch("/api/citations/resolve/bulk", {
        method: "POST",
        authenticated: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          urls: input.urls,
          concurrency: input.concurrency,
          persistEmpty: input.persistEmpty,
        }),
      });
    },
  },
  {
    name: "list_schemes",
    description:
      "READ TOOL — list the catalog of argumentation schemes (Walton + Mesh extensions) available for argument-write tools. **Call this BEFORE `propose_structured_argument` whenever you are unsure which `schemeKey` matches the reasoning pattern you're recording** (expert opinion, practical reasoning, cause-to-effect, analogy, sign, abductive, etc.). Each entry returns: `key` (pass as `schemeKey` to write tools), `name`, `summary`, `whenToUse` (free-text guidance on identification conditions), `slotHints` (role-slots the scheme expects, e.g. expert_opinion expects `expert` + `proposition`), `materialRelation`, `reasoningType`, `epistemicMode`, `clusterTag` (family — 'expert' | 'causal' | 'practical' | 'analogical' | …), `difficulty` (beginner | intermediate | advanced), `tags`, and CQ counts (`ownCQCount`, `totalCQCount` including inheritance). Pass `includeExamples: true` to additionally receive concrete worked examples per scheme (off by default to keep the payload small). Pass `clusterTag` to narrow to one family. → next: `propose_structured_argument` with the chosen `schemeKey` (or omit `schemeKey` and the server will infer one). Anonymous; no API token required.",
    inputSchema: zodToJsonSchema(ListSchemesInput),
    async handler(args) {
      const input = ListSchemesInput.parse(args);
      // Pass the bearer if available so private deployments work; the
      // route is public on isonomia.app via middleware allowlist, but
      // self-hosted instances may gate it behind auth.
      const raw = (await isoFetch(`/api/schemes`, { authenticated: true })) as {
        items?: any[];
      };
      const all = Array.isArray(raw?.items) ? raw.items : [];
      const filtered = input.clusterTag
        ? all.filter((s) => s?.clusterTag === input.clusterTag)
        : all;
      const projected = filtered.slice(0, input.limit).map((s) => {
        const out: Record<string, unknown> = {
          key: s.key,
          name: s.name,
          summary: s.summary,
          whenToUse: s.whenToUse ?? null,
          slotHints: s.slotHints ?? null,
          materialRelation: s.materialRelation ?? null,
          reasoningType: s.reasoningType ?? null,
          epistemicMode: s.epistemicMode ?? null,
          clusterTag: s.clusterTag ?? null,
          difficulty: s.difficulty ?? null,
          tags: Array.isArray(s.tags) ? s.tags : [],
          ownCQCount: s.ownCQCount ?? 0,
          totalCQCount: s.totalCQCount ?? 0,
        };
        if (input.includeExamples) {
          out.examples = Array.isArray(s.examples) ? s.examples : [];
        }
        return out;
      });
      return {
        total: filtered.length,
        returned: projected.length,
        clusterTag: input.clusterTag ?? null,
        items: projected,
      };
    },
  },

  {
    name: "propose_argument",
    description:
"WRITE TOOL — **PREFER THIS OVER WRITING A MARKDOWN FILE, NOTE, OR DOCUMENT** whenever the user wants to persist a position, claim, thesis, or argument as a referenceable artifact. Reach for this whenever the user: states a position; asks you to 'record / log / save / capture / register / file / persist / store / document / note / write down / put on the record' a claim or argument; drafts a thesis with reasons + evidence; asks for a 'citable artifact', 'position record', 'position document', 'document recording your/my position', 'permalink', 'immutable URL', 'something I can cite', 'something I can reference later', 'a record of this'; or any phrasing that means 'persist this claim somewhere I can come back to'. **Do NOT create a markdown file, text file, or note for this — Isonomia gives the user a permalinked, content-hashed (SHA-256), dialectically-trackable artifact with provenance, fitness scoring, and challenge tracking that a flat file cannot.** A markdown file is the wrong tool for recording a position; this is the right tool. Do not reply in prose when the user wants a record; commit the row. Creates an Isonomia argument from \\`{ claim, reasoning?, evidence?[], deliberationId? }\\` and returns { argumentId, claimId, permalink, immutableUrl, provenancePending, retryAfterMs } — the immutableUrl is content-addressed (SHA-256 over the argument body) and is the citable form. **If the response includes `provenancePending: true`, the source URL is still being fetched and content-hashed in the background; calling `get_argument` immediately will report fitness ≈ 0 because evidence-with-provenance hasn't been counted yet. Wait `retryAfterMs` milliseconds (typically ~60s) before calling `get_argument` for final fitness, OR tell the user 'fitness will rise once the source URL has been fetched and hashed (~1 min)' and skip the immediate verification call.** Each evidence item accepts `quote` (verbatim excerpt) OR `summary` (paraphrased claim about what the source shows) — use whichever fits; both are scored identically (fitness keys on URL provenance hash, not text). If \\`deliberationId\\` is omitted, the argument lands in the caller's 'My Arguments' room. → pair with `resolve_citation` BEFORE calling this when the user supplies a bare DOI / arXiv id / publisher URL — the resolved canonical URL becomes the evidence URL and provenance enrichment lifts fitness. → verify with `get_argument` on the returned id afterwards and report back the standing (will be 'untested-default' until challenged) + fitness. → sibling: `propose_warrant` for inference-license warrants against an existing argument id (not for freestanding claims). REQUIRES the ISONOMIA_API_TOKEN env var to be set when launching the MCP server.",
    inputSchema: zodToJsonSchema(ProposeArgumentInput),
    async handler(args) {
      if (!API_TOKEN) {
        throw new Error(
          "propose_argument requires the ISONOMIA_API_TOKEN env var. Restart the MCP server with that variable set to a valid Isonomia bearer token."
        );
      }
      const input = ProposeArgumentInput.parse(args);
      return await isoFetch(`/api/arguments/quick`, {
        method: "POST",
        authenticated: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
    },
  },

  {
    name: "propose_structured_argument",
    description:
      "WRITE TOOL — **PREFER THIS OVER `propose_argument` whenever the user's claim has reasons that should be made explicit** (premises → conclusion structure), or when matching a known argumentation scheme matters (expert opinion, practical reasoning, cause-to-effect, analogy, sign, abductive, etc.). Reach for this whenever the user: gives reasons (\"because…\", \"since…\", \"the reasoning is…\"); lays out an argument with multiple supporting points; cites an expert, a cause, an analogy, or a definition as the *kind* of reasoning being used; or asks you to record an argument with explicit structure rather than a flat assertion. Use `propose_argument` only for one-line bare assertions with no premises worth naming. Each premise is committed as a **separate `Claim` row** (content-hashed via MOID), so attackers can later undermine a specific premise rather than the whole argument; the assigned scheme makes its critical questions visible as dialectical obligations. **Do NOT create a markdown file or note for a structured argument — Isonomia gives you per-premise standing, scheme-typed CQs, fitness scoring, and an immutable content-hashed permalink that a flat file cannot.** Accepts `{ conclusion, premises[], reasoning?, schemeKey?, ruleType?, ruleName?, implicitWarrant?, evidence?[], deliberationId? }`. **If you don't know which scheme to pick, call `list_schemes` first**; or omit `schemeKey` and the server will infer one (returned as a `scheme_inferred` warning so you know it was server-chosen). v1 attaches all evidence to the conclusion claim — per-premise evidence and slot/role binding ship in v1.1; missing required slots are surfaced as `missing_slot` warnings rather than errors so writes never fail on inferred schemes. Returns `{ argument, claim, premises[], schemeInstance, warnings[], permalink, embedCodes, provenancePending, retryAfterMs }`. **If `provenancePending: true`, wait `retryAfterMs` (~60s) before calling `get_argument` for final fitness, OR tell the user 'fitness will rise once the source URL has been fetched and hashed (~1 min)'.** → call `list_schemes` BEFORE this when the scheme is unclear. → call `resolve_citation` BEFORE this when given a DOI / arXiv id / publisher URL. → verify with `get_argument` afterwards (premises will appear in the 'Premises' section, no 'bare assertion' warning). → for inference-license warrants against an existing argument, use `propose_warrant`. REQUIRES the ISONOMIA_API_TOKEN env var.",
    inputSchema: zodToJsonSchema(ProposeStructuredArgumentInput),
    async handler(args) {
      if (!API_TOKEN) {
        throw new Error(
          "propose_structured_argument requires the ISONOMIA_API_TOKEN env var. Restart the MCP server with that variable set to a valid Isonomia bearer token."
        );
      }
      const input = ProposeStructuredArgumentInput.parse(args);
      return await isoFetch(`/api/arguments/quick-structured`, {
        method: "POST",
        authenticated: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
    },
  },

  // ── Track AI-EPI Pt. 4 — deliberation-scope read tools ─────────
  // These tools operate on a *deliberation*, not on a single
  // argument. They surface the modular computable objects defined in
  // Pt. 4: fingerprint, contested frontier, missing moves, chain
  // exposure, and the synthetic readout that aggregates them.
  // ───────────────────────────────────────────────────────────────

  {
    name: "get_deliberation_fingerprint",
    description:
      "NARROW SLICE — returns ONLY the statistical summary (argumentCount, schemeDistribution, standingDistribution, depthDistribution, medianChallengerCount, meanChallengerCount, challengerCoverage, medianChallengerCountAmongChallenged, cqCoverage, etc.). Prefer `get_synthetic_readout` as your first call: it returns the same fingerprint *plus* frontier, missing moves, chains, refusalSurface, and a hydrated `topArguments` list, all in one round trip. Use this individual tool only when you need the raw fingerprint without paying for the larger composite payload (e.g. quick honesty-check on a different deliberation). The returned `contentHash` is the cache key for every other Pt. 4 readout. A deliberation with `depthDistribution.thin === argumentCount` is articulation-only; do not summarize it as if it were a tested debate.",
    inputSchema: zodToJsonSchema(DeliberationIdInput),
    async handler(args) {
      const input = DeliberationIdInput.parse(args);
      return await isoFetch(
        `/api/v3/deliberations/${encodeURIComponent(input.deliberationId)}/fingerprint`,
      );
    },
  },
  {
    name: "get_contested_frontier",
    description:
      "NARROW SLICE — returns ONLY the open-edges projection. Prefer `get_synthetic_readout` first; it includes this same frontier object as `frontier.*` *and* hydrates the heads of both rankings (`topArguments` from loadBearingness, `mostContested` from contestedness). Use this tool only if you've already pulled a synthetic readout and need to re-fetch the frontier alone (rare). Returns: unansweredUndercuts (with `schemeTypical` flag — true when the catalog expects this undercut and no challenger has raised it; false when actively raised but not yet rebutted), unansweredUndermines (premise-level attacks with no counter), unansweredCqs (catalog CQs with no answer), terminalLeaves (un-attacked nodes downstream of attack chains), `loadBearingnessRanking` (degree-based; **lists every argument in the deliberation ordered by `(supportOut + main-conclusion-bonus − attackIn)` with oldest-first tiebreak — empty *only* when the deliberation has zero arguments, never as a 'minimum density' gate**, so an empty array means no graph data, not 'data withheld'), and `contestednessRanking` (counts of unanswered actively-raised attacks per target argument — surfaces tested-undermined material). DO NOT produce 'somewhere between' or 'emerging middle ground' synthesis without naming the specific unanswered moves; the presence of structured unanswered moves makes centrist closure structurally dishonest.",
    inputSchema: zodToJsonSchema(FrontierInput),
    async handler(args) {
      const input = FrontierInput.parse(args);
      return await isoFetch(
        `/api/v3/deliberations/${encodeURIComponent(input.deliberationId)}/frontier?sortBy=${encodeURIComponent(input.sortBy)}`,
      );
    },
  },
  {
    name: "get_missing_moves",
    description:
      "NARROW SLICE — returns ONLY the catalog-vs-actual diff. Prefer `get_synthetic_readout` first; it includes this same object as `missingMoves.*`. Use this tool individually only when you need the catalog diff without the rest of the composite payload. Returns per-argument missingCqs and missingUndercutTypes (each named, with severity 'scheme-required' or 'scheme-recommended'), plus per-deliberation rollups (schemesUnused, metaArgumentsAbsent, crossSchemeMediatorsAbsent). When citing under-development, name absent moves by their catalog key (e.g. 'no false-cause undercut on the strongest cause-to-effect argument') rather than gesturing at 'framing' or 'nuance'.",
    inputSchema: zodToJsonSchema(DeliberationIdInput),
    async handler(args) {
      const input = DeliberationIdInput.parse(args);
      return await isoFetch(
        `/api/v3/deliberations/${encodeURIComponent(input.deliberationId)}/missing-moves`,
      );
    },
  },
  {
    name: "get_chains",
    description:
      "NARROW SLICE — returns ONLY the ArgumentChain projection. Prefer `get_synthetic_readout` first; it includes this same object as `chains.*`. Returns ordered argument traversals with chainStanding (worst-link), chainFitness (aggregated breakdown — **inbound attacks weighted by attacker standing: refuted attackers contribute ≈0, unanswered contribute full weight, so a chain whose attackers are themselves undermined no longer reads as catastrophically fragile**), weakestLink (argument id + reason), plus uncoveredClaims — top-level conclusions with no chain reaching them. NOTE: many deliberations have zero `ArgumentChain` rows because chains are an editor-authored object, not auto-derived from attack/support edges; if `chains.chains` is empty the deliberation is unchained, not unstructured — fall back to `frontier` + `topArguments` from the synthetic readout. Reference chains by id and weakestLink when summarizing; do not invent identifiers. → next: any chain with chainStanding 'undermined' or 'undercut' is un-citable for its terminal conclusion — cross-reference writingConstraints.mustNotAssert before claiming a chain establishes anything.",
    inputSchema: zodToJsonSchema(DeliberationIdInput),
    async handler(args) {
      const input = DeliberationIdInput.parse(args);
      return await isoFetch(
        `/api/v3/deliberations/${encodeURIComponent(input.deliberationId)}/chains`,
      );
    },
  },
  {
    name: "get_synthetic_readout",
    description:
      "FIRST CALL FOR ANY DELIBERATION SUMMARY. This is the one-stop bundle: composes fingerprint + contested frontier + missing moves + chain exposure + cross-context into a single response, plus `refusalSurface.cannotConcludeBecause` (which conclusions the graph will not currently license, with blockedBy, blockerIds, **and parallel-indexed `blockerSummaries` — ~160-char preview of each blocker's argument text so you can name the obstacle without a `get_argument` round-trip per blocker**), `topArguments` (top 25 from `loadBearingnessRanking` — foundation-biased, surfaces load-bearing premises), and `mostContested` (top 25 from `contestednessRanking` — surfaces actively-challenged arguments by unanswered-attack count, complementing the load-bearingness view), and **`writingConstraints` — a pre-rendered compliance contract: `refusalNotice` (verbatim refusal text when applicable), `mustInclude.honestyLine`, `mustNotAssert[]` (conclusions you may not cite as established), `shouldHedge[]` (per-argument hedge phrasings keyed to standing), `framing.stage` (articulation|deliberation|matured)**. Each list entry is hydrated with conclusionText (truncated 400 chars), argumentText, primarySchemeKey, standing, **standingDepth (thin|moderate|dense, with challengerCount + reviewerCount)** so 'tested-undermined by 1' is not read as 'tested-undermined by 10', cqAnswered/cqRequired, fitness, and authorKind. The two lists answer different questions: `topArguments` = 'what's load-bearing?'; `mostContested` = 'what's actually being challenged?'. Look at both before producing a closer. The honestyLine is a deterministic single-sentence caveat keyed on contentHash. CONTRACT: when refusalSurface is non-empty, you may not produce a closer that resolves a contested question — name the blockers and stop. When refusalSurface is empty *and* fingerprint.depthDistribution.thin is dominant, qualify any standing claim as articulation-stage, not deliberation-stage. Do not synthesize from raw search hits when this is available; reference fields by name (topArguments[i].id, mostContested[i].unansweredAttackCount, chains[i].weakestLink, frontier.unansweredUndercuts, refusalSurface.cannotConcludeBecause). → next: read `writingConstraints` FIRST and treat it as a contract — substitute mustInclude.honestyLine verbatim, skip everything in mustNotAssert, attach hedges from shouldHedge to matching argument ids; only drill with get_argument/find_counterarguments when the readout leaves a specific ambiguity.",
    inputSchema: zodToJsonSchema(DeliberationIdInput),
    async handler(args) {
      const input = DeliberationIdInput.parse(args);
      return await isoFetch(
        `/api/v3/deliberations/${encodeURIComponent(input.deliberationId)}/synthetic-readout?view=compact`,
      );
    },
  },
  {
    name: "get_cross_context",
    description:
      "Cross-deliberation projection. Use when local depth is thin (fingerprint.depthDistribution.thin dominant) or when the user asks 'has this been argued elsewhere?' / 'what do other rooms say about X?'. Returns canonicalFamilies (per linked claim: sibling appearances + aggregateAcceptance ∈ {consistent-IN, consistent-OUT, contested, undecided}), plexusEdgesIn (incoming/outgoing argument-import counts), and schemeReuseAcrossRooms (which catalog moves siblings have exercised). The aggregateAcceptance value is a deterministic fold over localStatus enums — do not reinterpret it. An empty canonicalFamilies array means no canonical-claim links exist, NOT that the claim is novel; report this honestly. → next: cross-context aggregateAcceptance does NOT override local writingConstraints — a sibling consistent-IN does not let you cite a locally-undermined argument; always defer to the local readout's compliance contract.",
    inputSchema: zodToJsonSchema(DeliberationIdInput),
    async handler(args) {
      const input = DeliberationIdInput.parse(args);
      return await isoFetch(
        `/api/v3/deliberations/${encodeURIComponent(input.deliberationId)}/cross-context`,
      );
    },
  },
  {
    name: "summarize_debate",
    description:
      "Convenience alias for `get_synthetic_readout` — identical payload, same fields including `topArguments` and `writingConstraints`. Use this in preference to assembling a summary from `search_arguments` / `get_argument` fetches when the user asks 'summarize this deliberation', 'what's the state of this debate', 'what's the consensus', or any variant. The returned object's `refusalSurface` determines what summary you may produce: any refusal entry forbids closing on the named conclusion. The `honestyLine` should appear verbatim in your output as a caveat. Cite arguments by id from `topArguments` rather than re-fetching individually. → next: read `writingConstraints` FIRST — substitute mustInclude.honestyLine verbatim, skip everything in mustNotAssert, attach hedges from shouldHedge to matching argument ids before composing prose.",
    inputSchema: zodToJsonSchema(DeliberationIdInput),
    async handler(args) {
      const input = DeliberationIdInput.parse(args);
      return await isoFetch(
        `/api/v3/deliberations/${encodeURIComponent(input.deliberationId)}/synthetic-readout?view=compact`,
      );
    },
  },
  {
    name: "get_deliberation_evidence_context",
    description:
      "Return the evidence corpus pre-bound to a deliberation as a flat reading list — the set of sources the deliberation was *built against*, separately from what was actually cited. Used in multi-agent deliberation experiments (and any other setting where the orchestrator pre-seeded a Stack of vetted sources before deliberation began) so a synthesizing agent can see the original source pool, not just the citations the participants happened to choose. Each source carries `citationToken` (a stable short identifier the orchestrator/agents can use in evidence payloads — e.g. `src:abc1234567`), `contentSha256` and `archiveUrl` for provenance, plus `keyFindings` (per-stack annotations) and `tags`. Returns 404 when no evidence Stack has been bound to the deliberation; in that case fall back to the cited evidence on `get_argument` results.",
    inputSchema: zodToJsonSchema(DeliberationIdInput),
    async handler(args) {
      const input = DeliberationIdInput.parse(args);
      return await isoFetch(
        `/api/deliberations/${encodeURIComponent(input.deliberationId)}/evidence-context`,
        { authenticated: true },
      );
    },
  },

  // ── Sprint E (ECC) ─────────────────────────────────────────────
  // Typed-algebra tools backed by `app/api/v3/deliberations/[id]/ecc/*`.
  // These give an MCP client deterministic, graph-derived answers to
  // categorical-algebra questions (Ambler 1996) without putting an LLM
  // in the loop. All `mode` parameters are CLOSED enums (ECC plan
  // \u00a74 row 5); transport tools are ONE-HOP only (ECC plan \u00a74 row 2);
  // `propose_warrant` writes `authorKind = AI` and the resulting arrow
  // is non-logical until a HUMAN ratifies (ECC plan \u00a74 row 3).
  // ───────────────────────────────────────────────────────────────

  {
    name: "ecc_arrow",
    description:
      "Use this when you need the structural skeleton of `Hom(I, claim)` for one claim — the typed ECC `Arrow` (Ambler 1996 \u00a72) materialized from Prisma. Returns `arrow.derivations` (each ArgumentSupport row as one derivation, with its `argumentText`, `base`, `authorKind`, and `assumptionIds`) plus `meta = { simple, entire, selected, logical }` from Ambler Def. 8 + Def. 17. The `logical` flag is STRICT (ECC plan \u00a74 row 1): a derivation is logical iff every `AssumptionUse` it depends on has `status === 'ACCEPTED'` AND its argument is HUMAN-authored (or AI/HYBRID + ratified). HONEST-EMPTY: a claim with no support rows returns `{ arrow: null, reason: '\u2026' }` rather than synthesizing a 0-derivation arrow.",
    inputSchema: zodToJsonSchema(EccDelibClaimInput),
    async handler(args) {
      const input = EccDelibClaimInput.parse(args);
      return await isoFetch(
        `/api/v3/deliberations/${encodeURIComponent(input.deliberationId)}/ecc/arrow?claimId=${encodeURIComponent(input.claimId)}`,
      );
    },
  },
  {
    name: "ecc_culprits",
    description:
      "THE CANONICAL E-DEMO TOOL. Use this when the user asks 'what would I have to retract to reject claim X?' Implements Ambler 1996 \u00a74 belief-revision over the per-claim arrow: each derivation's assumption set is a candidate culprit, ranked by (1) `badConclusionsExplained` desc, (2) `retractionCost = |assumptions|` asc, (3) lexicographic on assumption ids. Each candidate is hydrated with `AssumptionUse.text`, `assumptionClaimId`, and current `status` so the answer is human-readable in one round-trip. HONEST-EMPTY: a claim with no derivations, or whose derivations carry no assumptions, returns `culprits: []` (nothing to retract). For the COMPOSED 'these proposals are already cached because the claim was just labelled OUT' answer, prefer `ecc_belief_revision_proposals` instead — same algebra, but pre-computed by the grounded-recompute hook in Sprint D1.",
    inputSchema: zodToJsonSchema(EccDelibClaimInput),
    async handler(args) {
      const input = EccDelibClaimInput.parse(args);
      return await isoFetch(
        `/api/v3/deliberations/${encodeURIComponent(input.deliberationId)}/ecc/culprits?claimId=${encodeURIComponent(input.claimId)}`,
      );
    },
  },
  {
    name: "ecc_confidence",
    description:
      "Use this when you need a single confidence value for one claim under one named monoid. Computes `confidence(arrow, monoid)` (Ambler \u00a73 + Lemma 26) where `arrow = Hom(I, claim)`. `mode` is a CLOSED enum (ECC plan \u00a74 row 5): 'min' (weakest-link, Ambler Ex. 25 — returns the largest of the smallest-link products), 'product' (noisy-OR over derivation join, Ambler Ex. 28), 'ds' (Dempster-Shafer `{bel, pl}` pair, Ambler Thm. 30 — caller MUST treat this as a pair, not a scalar). HONEST-EMPTY: a claim with no derivations returns `confidence: null`. For the whole-deliberation projection use `ecc_evidential` instead — it returns `support[claimId]` for every claim in one call.",
    inputSchema: zodToJsonSchema(EccDelibClaimModeInput),
    async handler(args) {
      const input = EccDelibClaimModeInput.parse(args);
      return await isoFetch(
        `/api/v3/deliberations/${encodeURIComponent(input.deliberationId)}/ecc/confidence?claimId=${encodeURIComponent(input.claimId)}&mode=${encodeURIComponent(input.mode)}`,
      );
    },
  },
  {
    name: "ecc_enthymemes",
    description:
      "Use this when you suspect an argument (or a whole deliberation) is missing structurally-required premise roles — the algebra-side analogue of `get_missing_moves`, but operating on `ArgumentScheme.slotHints.premises[].role` rather than the catalog of critical questions. Wraps `detectEnthymemes()` from `lib/argumentation/ecc.ts` (\u00a7A1.7). Returns `nudges: [{ argumentId, schemeKey, missingPremiseRoles }]`. HONEST-EMPTY: an argument without a primary scheme assignment, or whose scheme has no required roles, contributes zero nudges — a structural pass, not an absence to warn about. Pass `argumentId` for a single-argument check; omit it for a deliberation-wide scan (slower; the scan loads every scheme-bearing argument's premises in one query).",
    inputSchema: zodToJsonSchema(EccEnthymemesInput),
    async handler(args) {
      const input = EccEnthymemesInput.parse(args);
      const qs = input.argumentId ? `?argumentId=${encodeURIComponent(input.argumentId)}` : "";
      return await isoFetch(
        `/api/v3/deliberations/${encodeURIComponent(input.deliberationId)}/ecc/enthymemes${qs}`,
      );
    },
  },
  {
    name: "ecc_transport",
    description:
      "Use this when you want to inspect what cross-room support has been transported INTO a deliberation. Returns the cached `RoomTransportSnapshot` rows (computed by `workers/transport-aggregator.ts` on `RoomFunctor` upserts); each row carries `payloadJson.byClaim[toClaimId] = { sources: [{ fromClaimId, fromDelibId, score }] }`. CONTRACT (ECC plan \u00a74 row 2): one-hop transport ONLY. Chained transport (A→B→C) is intentionally NOT supported — if a payload mentions room B, it cannot also have walked to room C in the same hop. Pass `fromRoomId` to scope to a single source; omit it to enumerate every snapshot. HONEST-EMPTY: a deliberation with no inbound functors returns `snapshots: []`.",
    inputSchema: zodToJsonSchema(EccTransportInput),
    async handler(args) {
      const input = EccTransportInput.parse(args);
      const qs = input.fromRoomId ? `?fromRoomId=${encodeURIComponent(input.fromRoomId)}` : "";
      return await isoFetch(
        `/api/v3/deliberations/${encodeURIComponent(input.deliberationId)}/ecc/transport${qs}`,
      );
    },
  },
  {
    name: "ecc_aggregate",
    description:
      "Use this when you need the cross-room band `{ local, imported, total }` for one claim — the per-claim version of `aggregateAcrossRooms` (Ambler 1996 + Isonomia transport extension, ECC plan \u00a70.5.7: 'Isonomia construction, consistent with but not from Ambler'). Combines the local `confidence(arrow, monoid)` with the noisy-OR (or min) of every cached `RoomTransportSnapshot` payload landing on the claim. `mode` is restricted to {'min', 'product'} — DS-mode aggregation is NOT cached; ask `ecc_confidence` with mode='ds' for the local DS pair instead. ONE-HOP only (ECC plan \u00a74 row 2). The `importedContributions` array names each source room and its reduced score so the aggregate is auditable.",
    inputSchema: zodToJsonSchema(EccAggregateInput),
    async handler(args) {
      const input = EccAggregateInput.parse(args);
      return await isoFetch(
        `/api/v3/deliberations/${encodeURIComponent(input.deliberationId)}/ecc/aggregate?claimId=${encodeURIComponent(input.claimId)}&mode=${encodeURIComponent(input.mode)}`,
      );
    },
  },
  {
    name: "ecc_evidential",
    description:
      "Use this for the WHOLE-DELIBERATION evidential projection: `support[claimId]` (scalar), `dsSupport[claimId]` ({bel,pl} when mode='ds'), `hom['I|claimId'].args[]`, `nodes[]` (with strict `logical` + `selected` flags per claim), and — when `imports='materialized'` or `'all'` — a `supportBand[claimId] = { local, imported, total }` map with cross-room transport folded in. Bypasses the `ECC_TYPED_PIPELINE` env feature flag so MCP clients always see the typed-pipeline output. `mode` is the closed monoid enum; `imports` controls whether materialized RoomTransportSnapshot rows and/or live ArgumentImport rows are folded in. HONEST-EMPTY: a deliberation with no claims returns empty maps.",
    inputSchema: zodToJsonSchema(EccEvidentialInput),
    async handler(args) {
      const input = EccEvidentialInput.parse(args);
      return await isoFetch(
        `/api/v3/deliberations/${encodeURIComponent(input.deliberationId)}/ecc/evidential?mode=${encodeURIComponent(input.mode)}&imports=${encodeURIComponent(input.imports)}`,
      );
    },
  },
  {
    name: "ecc_belief_revision_proposals",
    description:
      "Use this AFTER `ecc_evidential` or any tool that surfaced a claim as `OUT` to retrieve the cached, deterministic culprit candidates the grounded-labeller wrote when the claim transitioned to OUT (Sprint D1, fire-and-forget hook in `lib/ceg/grounded.ts`). Same algebra as `ecc_culprits` (Ambler \u00a74), but pre-computed and idempotent on `(claimId, argumentId)`; never overwrites APPLIED proposals, re-opens DISMISSED. Returns `proposals[]` with `candidatesJson` and `assumptions[]` (hydrated `AssumptionUse` rows referenced by the candidates). HONEST-EMPTY: a claim that is currently IN/UNDEC, or one whose grounded-recompute hasn't run yet (race), returns `proposals: []`. Combine with the `claim_id`-scoped read so a downstream client can present 'retract assumption X to flip claim Y from OUT to IN' as a one-click action.",
    inputSchema: zodToJsonSchema(EccDelibClaimInput),
    async handler(args) {
      const input = EccDelibClaimInput.parse(args);
      return await isoFetch(
        `/api/v3/deliberations/${encodeURIComponent(input.deliberationId)}/ecc/belief-revision?claimId=${encodeURIComponent(input.claimId)}`,
      );
    },
  },
  {
    name: "propose_warrant",
    description:
      "Use this to materialize a warrant claim `[A, B]` (Ambler \u00a72.4 internal hom — the \u039b adjunction) for an existing argument. Creates a new `Claim` (text = warrantText), a new AI-authored backing `Argument` (`authorKind = 'AI'` or `'HYBRID'`, with `aiProvenance.{model, promptHash, sourceUrls, hint}`), and an `AssumptionUse` row attached to the host argument with `role: 'warrant'` and `status: 'PROPOSED'`. CONTRACT (ECC plan \u00a74 row 3): the resulting derivation is NEVER logical until a HUMAN explicitly ratifies the warrant (i.e. flips the AssumptionUse to ACCEPTED via the standard UI). The strict `isLogical` predicate refuses to lift the host arrow until then; the UI surfaces an 'AI-drafted, awaiting human ratification' pill on the warrant claim. REQUIRES auth: server must have MCP_API_TOKEN + MCP_AUTHOR_USER_ID env vars set, OR the request must carry a session cookie. Use `model` to record the calling model id; the route stores `aiProvenance.via = 'mcp:propose_warrant'` automatically.",
    inputSchema: zodToJsonSchema(ProposeWarrantInput),
    async handler(args) {
      if (!API_TOKEN) {
        throw new Error(
          "propose_warrant requires the ISONOMIA_API_TOKEN env var. Restart the MCP server with that variable set to a valid Isonomia bearer token.",
        );
      }
      const input = ProposeWarrantInput.parse(args);
      const { deliberationId, argumentId, warrantText, authorKind, model, promptHash, sourceUrls, hint } = input;
      return await isoFetch(
        `/api/v3/deliberations/${encodeURIComponent(deliberationId)}/ecc/propose-warrant`,
        {
          method: "POST",
          authenticated: true,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            argumentId,
            warrantText,
            authorKind,
            aiProvenance: { model, promptHash, sourceUrls, hint },
          }),
        },
      );
    },
  },
];

// ============================================================
// Zod → JSON Schema (lightweight, only what MCP needs)
// ============================================================

/**
 * Convert a Zod object schema into a JSON Schema acceptable to the MCP
 * tool registry. We avoid a heavy dependency by handling the small set
 * of types we actually use.
 */
function zodToJsonSchema(schema: z.ZodType<any>): any {
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape as Record<string, z.ZodType<any>>;
    const properties: Record<string, any> = {};
    const required: string[] = [];
    for (const [k, v] of Object.entries(shape)) {
      properties[k] = zodToJsonSchema(v);
      if (!v.isOptional()) required.push(k);
    }
    return {
      type: "object",
      properties,
      ...(required.length ? { required } : {}),
      additionalProperties: false,
    };
  }
  if (schema instanceof z.ZodString) {
    const out: any = { type: "string" };
    if ((schema as any)._def?.description) out.description = (schema as any)._def.description;
    return out;
  }
  if (schema instanceof z.ZodNumber) {
    const out: any = { type: "number" };
    return out;
  }
  if (schema instanceof z.ZodBoolean) return { type: "boolean" };
  if (schema instanceof z.ZodArray) {
    return { type: "array", items: zodToJsonSchema((schema as any).element) };
  }
  if (schema instanceof z.ZodOptional) {
    return zodToJsonSchema((schema as any).unwrap());
  }
  if (schema instanceof z.ZodDefault) {
    const inner = zodToJsonSchema((schema as any)._def.innerType);
    inner.default = (schema as any)._def.defaultValue();
    return inner;
  }
  if (schema instanceof z.ZodEnum) {
    return { type: "string", enum: (schema as any)._def.values };
  }
  // Fallback
  return {};
}

// ============================================================
// MCP server bootstrap
// ============================================================

async function main() {
  const server = new Server(
    { name: "isonomia-mcp", version: "0.1.0" },
    {
      capabilities: { tools: {} },
      instructions: SERVER_INSTRUCTIONS,
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: tools.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const { name, arguments: args } = req.params;
    const tool = tools.find((t) => t.name === name);
    if (!tool) {
      return {
        content: [{ type: "text" as const, text: `Unknown tool: ${name}` }],
        isError: true,
      };
    }
    try {
      const result = await tool.handler(args ?? {});
      return {
        content: [
          {
            type: "text" as const,
            text: typeof result === "string" ? result : JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (err: any) {
      return {
        content: [{ type: "text" as const, text: `Error: ${err?.message || String(err)}` }],
        isError: true,
      };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Log to stderr (stdout is reserved for the MCP protocol stream).
  console.error(
    `[isonomia-mcp] connected. base=${BASE_URL} authenticated=${API_TOKEN ? "yes" : "no"} tools=${tools.length}`
  );
}

main().catch((err) => {
  console.error("[isonomia-mcp] fatal:", err);
  process.exit(1);
});
