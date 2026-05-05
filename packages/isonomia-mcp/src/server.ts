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
 *   • search_arguments     — ranked permalinks by query + filters
 *   • get_argument         — full attestation envelope for a permalink
 *   • get_claim            — claim by MOID + supporting argument permalinks
 *   • find_counterarguments — arguments attacking a target claim
 *   • cite_argument        — citation block (URL + content hash + pull quote)
 *   • propose_argument     — create a new argument (requires API token)
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

const ProposeArgumentInput = z.object({
  claim: z.string().min(1).max(2000).describe("The claim text the argument will conclude with"),
  reasoning: z.string().max(5000).optional().describe("Optional reasoning text"),
  evidence: z
    .array(
      z.object({
        url: z.string().url(),
        title: z.string().max(500).optional(),
        quote: z.string().max(2000).optional(),
      })
    )
    .max(10)
    .optional()
    .default([])
    .describe("Up to 10 evidence sources"),
  deliberationId: z.string().optional(),
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
    name: "search_arguments",
    description:
      "Search Isonomia for public arguments, claims, and counter-arguments by free-text query. Use this as the first step for any debate, controversy, position, objection, rebuttal, supporting reason, or evidence question. Returns ranked permalinks with scheme, conclusion, and an attestation URL. Defaults to mode='hybrid' (pgvector cosine + lexical OR-tokens fused via RRF, K=60) so paraphrased queries hit semantically related arguments even when surface vocabulary differs; pass mode='lexical' for deterministic substring matching or mode='vector' for pure embedding similarity. Supports sort='dialectical_fitness' to rank by tested-and-survived (answered CQs, supports, evidence with provenance, minus open attacks). When sort='dialectical_fitness' is used, each result also carries a `fitnessBreakdown` object decomposing the score into its weighted components (cqAnswered, supportEdges, attackEdges, attackCAs, evidenceWithProvenance) plus the formula weights, so the score is auditable rather than opaque. When mode is hybrid or vector, each result also carries a `hybrid` block (rrfScore, sparseRank, denseRank, denseDistance) so retrieval confidence is auditable.",
    inputSchema: zodToJsonSchema(SearchInput),
    async handler(args) {
      const input = SearchInput.parse(args);
      const url =
        `/api/v3/search/arguments?q=${encodeURIComponent(input.query)}` +
        `&limit=${input.limit}` +
        (input.scheme ? `&scheme=${encodeURIComponent(input.scheme)}` : "") +
        (input.sort ? `&sort=${encodeURIComponent(input.sort)}` : "") +
        (input.mode ? `&mode=${encodeURIComponent(input.mode)}` : "");
      return await isoFetch(url);
    },
  },
  {
    name: "get_argument",
    description:
      "Fetch a structured representation of an argument permalink. Default format='attestation' returns the compact citation envelope (conclusion, premises, scheme, evidence with sha256 + archive URL, dialectical status, standingState). The envelope also carries: `structuredCitations` (canonical CitationBlock[] with url/doi/publisher/quote/quoteAnchor) for citation-grade serialization; `criticalQuestions` (per-CQ status aggregate — `answered`, `partiallyAnswered`, `unanswered` — so consumers can see which CQs are open without inferring from absence); `fitnessBreakdown` decomposing the dialectical-fitness score into weighted contributors; `standingDepth` annotating the standing label with distinct-author challenger/reviewer counts and a `confidence` tier (thin|moderate|dense) so 'tested-survived (1 challenger)' is not read as 'vetted by the field'; and `author.kind` (HUMAN|AI|HYBRID) plus `author.aiProvenance` so AI-authored arguments are explicitly flagged. Pass format='jsonld' for the rich Schema.org composite (Claim + ScholarlyArticle + ClaimReview + AIF) or format='aif' for the AIF-JSON-LD subgraph with critical questions.",
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
    name: "find_counterarguments",
    description:
      "Find counter-arguments, objections, rebuttals, attacks, and dissenting positions against a target claim. Accepts a MOID (preferred) or free text. Returns arguments whose conclusion contests the target; arguments with the same conclusion MOID are excluded so an empty result is honestly empty (no false counters). Defaults to mode='hybrid' so candidate counter-arguments don't have to share surface vocabulary with the target claim (e.g. 'Odgers' shows up against a 'Haidt'-style claim even though the words don't overlap). v0 uses textual stance heuristics; a true negation/contradiction index ships with Track C.2.",
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
      return await isoFetch(`/api/v3/search/arguments?${params.toString()}`);
    },
  },
  {
    name: "cite_argument",
    description:
      "Return a ready-to-paste citation block for an Isonomia argument: canonical permalink, immutable content-hashed URL, retrieval timestamp, conclusion pull quote, dialectical status (with explicit standingState so 'untested-default' is not confused with 'tested-survived'), premise/evidence provenance counters (so unattested premises are surfaced honestly), and — by default — the strongest known counter-argument so the citation arrives with its opposition attached. Pass `format` ('apa' | 'mla' | 'chicago' | 'bibtex' | 'ris' | 'csl') to receive the canonical scholarly citation string in place of the markdown block (AI-EPI E.1). Always returns the Isonomia URN `iso:argument:<shortCode>` (AI-EPI E.2) and a DOI when one is registered.",
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
    name: "propose_argument",
    description:
      "Create a new Isonomia argument from a claim + optional reasoning + evidence. Returns the new permalink, immutable URL, and embed codes. REQUIRES the ISONOMIA_API_TOKEN env var to be set when launching the MCP server.",
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

  // ── Track AI-EPI Pt. 4 — deliberation-scope read tools ─────────
  // These tools operate on a *deliberation*, not on a single
  // argument. They surface the modular computable objects defined in
  // Pt. 4: fingerprint, contested frontier, missing moves, chain
  // exposure, and the synthetic readout that aggregates them.
  // ───────────────────────────────────────────────────────────────

  {
    name: "get_deliberation_fingerprint",
    description:
      "NARROW SLICE — returns ONLY the statistical summary (argumentCount, schemeDistribution, standingDistribution, depthDistribution, medianChallengerCount, cqCoverage, etc.). Prefer `get_synthetic_readout` as your first call: it returns the same fingerprint *plus* frontier, missing moves, chains, refusalSurface, and a hydrated `topArguments` list, all in one round trip. Use this individual tool only when you need the raw fingerprint without paying for the larger composite payload (e.g. quick honesty-check on a different deliberation). The returned `contentHash` is the cache key for every other Pt. 4 readout. A deliberation with `depthDistribution.thin === argumentCount` is articulation-only; do not summarize it as if it were a tested debate.",
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
      "NARROW SLICE — returns ONLY the open-edges projection. Prefer `get_synthetic_readout` first; it includes this same frontier object as `frontier.*` *and* hydrates the heads of both rankings (`topArguments` from loadBearingness, `mostContested` from contestedness). Use this tool only if you've already pulled a synthetic readout and need to re-fetch the frontier alone (rare). Returns: unansweredUndercuts (with `schemeTypical` flag — true when the catalog expects this undercut and no challenger has raised it; false when actively raised but not yet rebutted), unansweredUndermines (premise-level attacks with no counter), unansweredCqs (catalog CQs with no answer), terminalLeaves (un-attacked nodes downstream of attack chains), `loadBearingnessRanking` (degree-based, surfaces foundational arguments), and `contestednessRanking` (counts of unanswered actively-raised attacks per target argument — surfaces tested-undermined material). DO NOT produce 'somewhere between' or 'emerging middle ground' synthesis without naming the specific unanswered moves; the presence of structured unanswered moves makes centrist closure structurally dishonest.",
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
      "NARROW SLICE — returns ONLY the ArgumentChain projection. Prefer `get_synthetic_readout` first; it includes this same object as `chains.*`. Returns ordered argument traversals with chainStanding (worst-link), chainFitness (aggregated breakdown), weakestLink (argument id + reason), plus uncoveredClaims — top-level conclusions with no chain reaching them. NOTE: many deliberations have zero `ArgumentChain` rows because chains are an editor-authored object, not auto-derived from attack/support edges; if `chains.chains` is empty the deliberation is unchained, not unstructured — fall back to `frontier` + `topArguments` from the synthetic readout. Reference chains by id and weakestLink when summarizing; do not invent identifiers.",
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
      "FIRST CALL FOR ANY DELIBERATION SUMMARY. This is the one-stop bundle: composes fingerprint + contested frontier + missing moves + chain exposure + cross-context into a single response, plus `refusalSurface.cannotConcludeBecause` (which conclusions the graph will not currently license, with blockedBy and blockerIds), `topArguments` (top 25 from `loadBearingnessRanking` — foundation-biased, surfaces load-bearing premises), and `mostContested` (top 25 from `contestednessRanking` — surfaces actively-challenged arguments by unanswered-attack count, complementing the load-bearingness view). Each list entry is hydrated with conclusionText (truncated 400 chars), argumentText, primarySchemeKey, standing, cqAnswered/cqRequired, fitness, and authorKind. The two lists answer different questions: `topArguments` = 'what's load-bearing?'; `mostContested` = 'what's actually being challenged?'. Look at both before producing a closer. The honestyLine is a deterministic single-sentence caveat keyed on contentHash. CONTRACT: when refusalSurface is non-empty, you may not produce a closer that resolves a contested question — name the blockers and stop. When refusalSurface is empty *and* fingerprint.depthDistribution.thin is dominant, qualify any standing claim as articulation-stage, not deliberation-stage. Do not synthesize from raw search hits when this is available; reference fields by name (topArguments[i].id, mostContested[i].unansweredAttackCount, chains[i].weakestLink, frontier.unansweredUndercuts, refusalSurface.cannotConcludeBecause).",
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
      "Cross-deliberation projection. Use when local depth is thin (fingerprint.depthDistribution.thin dominant) or when the user asks 'has this been argued elsewhere?' / 'what do other rooms say about X?'. Returns canonicalFamilies (per linked claim: sibling appearances + aggregateAcceptance ∈ {consistent-IN, consistent-OUT, contested, undecided}), plexusEdgesIn (incoming/outgoing argument-import counts), and schemeReuseAcrossRooms (which catalog moves siblings have exercised). The aggregateAcceptance value is a deterministic fold over localStatus enums — do not reinterpret it. An empty canonicalFamilies array means no canonical-claim links exist, NOT that the claim is novel; report this honestly.",
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
      "Convenience alias for `get_synthetic_readout` — identical payload, same fields including `topArguments`. Use this in preference to assembling a summary from `search_arguments` / `get_argument` fetches when the user asks 'summarize this deliberation', 'what's the state of this debate', 'what's the consensus', or any variant. The returned object's `refusalSurface` determines what summary you may produce: any refusal entry forbids closing on the named conclusion. The `honestyLine` should appear verbatim in your output as a caveat. Cite arguments by id from `topArguments` rather than re-fetching individually.",
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
    { capabilities: { tools: {} } }
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
