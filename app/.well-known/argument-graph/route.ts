/**
 * GET /.well-known/argument-graph
 *
 * Track B.1 — machine-readable manifest of Isonomia's argument-graph
 * capabilities. This is the single discovery doc an LLM agent or
 * indexing pipeline should fetch first; it points at every other
 * shape (HTML, JSON-LD, AIF, attestation envelope, MCP, OpenAPI,
 * corpus snapshot).
 *
 * Companion to /.well-known/llms.txt (the human/LLM-readable prose
 * version).
 *
 * Returned as application/json. No auth, edge-cacheable.
 */
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-static";
export const revalidate = 3600;

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://isonomia.app";

const MANIFEST = {
  "$schema":
    "https://isonomia.app/schemas/argument-graph-manifest/v1.json",
  version: "1.0",
  service: {
    name: "Isonomia",
    description:
      "Argument-graph platform exposing every public argument as a machine-citable, dialectically-attested, content-hashed epistemic artifact.",
    baseUrl: BASE_URL,
    licenseCorpus: "CC-BY-4.0",
    licenseCorpusUrl: "https://creativecommons.org/licenses/by/4.0/",
    docs: `${BASE_URL}/.well-known/llms.txt`,
  },
  formats: [
    {
      mediaType: "text/html",
      description: "Human-rendered argument-object landing page.",
    },
    {
      mediaType: "application/ld+json",
      description:
        "Rich JSON-LD: Claim + ScholarlyArticle + ClaimReview + AIF subgraph.",
    },
    {
      mediaType: "application/json",
      description: "AIF graph (RA + I-nodes, conflict, support).",
    },
    {
      mediaType: "application/vnd.isonomia.attestation+json",
      description:
        "Compact citation envelope (the LLM unit). Returned by ?format=attestation.",
    },
  ],
  endpoints: {
    argumentByPermalink: {
      url: `${BASE_URL}/a/{shortCode}`,
      method: "GET",
      contentNegotiation: true,
      description:
        "Resolve a public argument by short code. Honors Accept header for HTML, JSON-LD, AIF.",
    },
    argumentByPermalinkImmutable: {
      url: `${BASE_URL}/a/{shortCode}@{contentHash}`,
      method: "GET",
      description:
        "Immutable form pinned to a specific sha256 content hash. Use for citations that must survive future edits.",
    },
    argumentAttestation: {
      url: `${BASE_URL}/api/a/{shortCode}/aif`,
      method: "GET",
      query: { format: ["aif", "jsonld", "attestation"] },
      description:
        "Argument representation by short code with explicit format selector.",
    },
    claim: {
      url: `${BASE_URL}/api/c/{moid}`,
      method: "GET",
      description:
        "Resolve a claim by canonical MOID with supporting and attacking arguments.",
    },
    search: {
      url: `${BASE_URL}/api/v3/search/arguments`,
      method: "GET",
      query: {
        q: "free-text",
        limit: "1..50",
        scheme: "argumentation scheme key",
        against: "claim moid (returns counter-arguments)",
        sort: ["recent", "dialectical_fitness"],
      },
      description:
        "Public argument search. Use sort=dialectical_fitness for tested-and-survived re-ranking.",
    },
    proposeArgument: {
      url: `${BASE_URL}/api/arguments/quick`,
      method: "POST",
      auth: "bearer",
      description:
        "Quick Argument API. Token-gated; returns a permalink for the newly-created argument.",
    },
    deliberationFingerprint: {
      url: `${BASE_URL}/api/v3/deliberations/{id}/fingerprint`,
      method: "GET",
      description:
        "Track AI-EPI Pt. 4 §1 — deterministic deliberation-scope statistical summary. Returns contentHash that keys every other Pt. 4 readout.",
    },
    deliberationContestedFrontier: {
      url: `${BASE_URL}/api/v3/deliberations/{id}/frontier`,
      method: "GET",
      query: {
        sortBy: ["loadBearingness", "recency", "severity"],
      },
      description:
        "Track AI-EPI Pt. 4 §2 — open dialectical edges (unanswered undercuts, undermines, CQs, terminal leaves) with a load-bearingness ranking. Use before any 'middle ground' or 'consensus' summary.",
    },
    deliberationMissingMoves: {
      url: `${BASE_URL}/api/v3/deliberations/{id}/missing-moves`,
      method: "GET",
      description:
        "Track AI-EPI Pt. 4 §3 — diff between scheme-typical-move catalog and actual graph. Names absent CQs and undercuts by catalog key.",
    },
    deliberationChains: {
      url: `${BASE_URL}/api/v3/deliberations/{id}/chains`,
      method: "GET",
      description:
        "Track AI-EPI Pt. 4 §4 — ArgumentChain projections with chainStanding (worst-link), chainFitness, weakestLink, and uncoveredClaims.",
    },
    deliberationSyntheticReadout: {
      url: `${BASE_URL}/api/v3/deliberations/{id}/synthetic-readout`,
      method: "GET",
      description:
        "Track AI-EPI Pt. 4 §5 — editorial primitive. Composes fingerprint + frontier + missing-moves + chains and exposes refusalSurface.cannotConcludeBecause: a structured enumeration of conclusions the graph will not currently license. Consumers that close on a refused conclusion lie about a structured field.",
    },
    deliberationCrossContext: {
      url: `${BASE_URL}/api/v3/deliberations/{id}/cross-context`,
      method: "GET",
      description:
        "Track AI-EPI Pt. 4 §7 — canonical-claim families across rooms, plexus-edge counts (ArgumentImport), sibling-room scheme reuse. aggregateAcceptance is a deterministic fold over localStatus enums.",
    },
  },
  citation: {
    envelopePath: "/api/a/{shortCode}/aif?format=attestation",
    envelopeMediaType: "application/vnd.isonomia.attestation+json",
    contentAddressing: "sha256",
    immutableUrlPattern: "/a/{shortCode}@{contentHash}",
    fields: [
      "permalink",
      "immutablePermalink",
      "contentHash",
      "version",
      "retrievedAt",
      "conclusion",
      "scheme",
      "premises",
      "evidence[].contentSha256",
      "evidence[].archive.url",
      "dialecticalStatus.criticalQuestionsAnswered",
      "dialecticalStatus.criticalQuestionsRequired",
      "dialecticalStatus.incomingAttacks",
      "dialecticalStatus.incomingSupports",
      "dialecticalStatus.testedness",
      "dialecticalStatus.standingScore",
      "dialecticalStatus.standingState",
    ],
  },
  counterCitation: {
    enabled: true,
    description:
      "Citations include the strongest known counter-argument inline. Use cite_argument (MCP) or fetch ?format=attestation.",
    tool: "cite_argument",
  },
  mcp: {
    transport: "stdio",
    package: "@isonomia/mcp",
    localPackagePath: "packages/isonomia-mcp/dist/server.js",
    spec: "https://modelcontextprotocol.io",
    tools: [
      {
        name: "search_arguments",
        description:
          "Free-text search over public arguments; supports sort=dialectical_fitness re-rank and mode=hybrid|lexical|vector retrieval (hybrid is the default and fuses pgvector cosine + lexical via RRF).",
      },
      {
        name: "get_argument",
        description:
          "Full attestation envelope by permalink, with provenance and dialectical state.",
      },
      {
        name: "get_claim",
        description:
          "Claim by MOID with supporting argument permalinks and attestation URLs.",
      },
      {
        name: "find_counterarguments",
        description:
          "Counter-arguments for a target claim. Honest-empty: returns no results rather than self-counters. Supports mode=hybrid (default) for paraphrase-tolerant candidate recall.",
      },
      {
        name: "cite_argument",
        description:
          "Returns a citation block with provenance counters, standingState classifier, the strongest known objection attached by default, and the Isonomia URN (iso:argument:<shortCode>). Pass format=apa|mla|chicago|bibtex|ris|csl for the canonical scholarly citation string (AI-EPI E.1).",
      },
      {
        name: "propose_argument",
        description:
          "Create a new argument via the Quick Argument API. Token-gated.",
      },
      {
        name: "get_deliberation_fingerprint",
        description:
          "Pt. 4 §1 — deterministic statistical summary of a deliberation. Honesty floor for any deliberation summary; the contentHash is the cache key for every other Pt. 4 readout.",
      },
      {
        name: "get_contested_frontier",
        description:
          "Pt. 4 §2 — open dialectical edges in a deliberation with a load-bearingness ranking. Required before any 'consensus' or 'middle ground' summary.",
      },
      {
        name: "get_missing_moves",
        description:
          "Pt. 4 §3 — diff between scheme-typical moves and what the graph contains. Names absent moves by catalog key.",
      },
      {
        name: "get_chains",
        description:
          "Pt. 4 §4 — ArgumentChain projections with worst-link standing and weakest-link annotations.",
      },
      {
        name: "get_synthetic_readout",
        description:
          "Pt. 4 §5 — composed deliberation readout with refusalSurface.cannotConcludeBecause. The editorial primitive.",
      },
      {
        name: "get_cross_context",
        description:
          "Pt. 4 §7 — canonical-claim families and plexus-edge counts across rooms. Use when local depth is thin.",
      },
      {
        name: "summarize_debate",
        description:
          "Pt. 4 wrapper — forces deliberation summaries through the synthetic-readout primitive instead of free synthesis from search hits.",
      },
    ],
  },
  schemas: {
    aif: {
      url: "http://www.arg.dundee.ac.uk/aif",
      description: "Argument Interchange Format (RA, CA, MA nodes).",
    },
    schemaOrg: {
      types: ["Claim", "ScholarlyArticle", "ClaimReview"],
      activated: true,
    },
    openapi: {
      url: `${BASE_URL}/api/v3/openapi.json`,
      version: "3.1",
      description: "Hand-curated OpenAPI 3.1 spec for the public API.",
    },
    jsonld: {
      contextPrefixes: ["aif", "as", "cq"],
    },
  },
  corpus: {
    available: false,
    plannedDistribution: "huggingface",
    plannedLicense: "CC-BY-4.0",
    plannedMediaType: "application/x-parquet",
    description:
      "Public, dated snapshot of the argument graph including conclusion-claim and full-argument embeddings. Planned: HuggingFace Datasets.",
    contents: [
      "arguments.parquet",
      "claims.parquet",
      "manifest.json",
      "LICENSE.md",
    ],
  },
  capabilities: {
    contentNegotiation: true,
    contentAddressing: true,
    archiveOrgEvidence: true,
    counterCitationReflex: true,
    dialecticalFitnessRanking: true,
    honestEmptyOnSelfCounter: true,
    standingStateClassifier: true,
    immutablePermalinks: true,
    deliberationFingerprint: true,
    contestedFrontier: true,
    missingMovesCatalog: true,
    chainExposure: true,
    syntheticReadoutWithRefusalSurface: true,
    crossDeliberationContext: true,
  },
  meta: {
    generatedAt: new Date().toISOString().slice(0, 10),
    docsHumanReadable: `${BASE_URL}/.well-known/llms.txt`,
    demoExplainer: `${BASE_URL}/test/ai-epistemic`,
  },
};

export async function GET() {
  return NextResponse.json(MANIFEST, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
