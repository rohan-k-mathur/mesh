Audit: "Google Search for Arguments" feature for Isonomia
What this feature is
Two related strands in the roadmap, often referred to as the "Google Scholar / Google Search for arguments" play:

Public argument search — Phase 5.7 of the embeddable widget roadmap. A search interface over all public Isonomia arguments by topic / claim text / evidence, with an API endpoint and a public web page.
Google Search visibility (ClaimReview) — Phase 5.6. Emit Schema.org ClaimReview JSON-LD so Isonomia arguments surface as fact-check cards in Google Search results.
Plus the supporting Track C (argument-native retrieval) from AI_EPISTEMIC_INFRASTRUCTURE_ROADMAP.md.

Status by component
✅ Shipped — Search API (the engine)
route.ts is fully implemented and quite mature:

q free-text, limit, scheme filter, against={claimMoid} for counter-arg discovery
sort=recent | dialectical_fitness (re-ranks by CQs answered + supports − attacks − conflicts + provenance-bearing evidence; weights live in argumentAttestation.ts)
mode=lexical | hybrid | vector — Track C.1 hybrid retrieval is shipped: pgvector cosine + sparse OR-tokens fused with Reciprocal Rank Fusion (K=60). See hybridSearch.ts and the query embedding cache.
Honest-empty semantics (returns count:0, results:[], never 404s on miss)
Counter-arg against mode now uses structural edges (rebut/undercut + ConflictApplication) rather than the old text-overlap heuristic; excludes self-counters by MOID
Each result carries attestationUrl, standingState, lexicalCoverage, and (in hybrid/vector mode) a hybrid block with rrfScore, sparseRank, denseRank, denseDistance for auditable retrieval
Public CORS headers; cache-friendly
✅ Shipped — MCP surface
server.ts wraps the API as search_arguments and find_counterarguments tools (default mode=hybrid), so any LLM with MCP can already "search Isonomia for arguments." This is exercised in the MCP_STRESS_TEST_*.md docs.

✅ Shipped — Discovery surfaces
route.ts — manifest pointing at the search API
route.ts — advertises both ?sort=dialectical_fitness and ?against= modes
isonomiaOpenapi.ts — OpenAPI 3.1 with rich, LLM-tuned descriptions; rendered at /api/v3/docs
✅ Shipped — Schema.org ClaimReview (Phase 5.6)
argumentJsonLd.ts:217 emits ClaimReview JSON-LD inline on every public argument page (app/a/[identifier]/page.tsx) — gated on dialecticalStatus.isTested (the activation rule the roadmap called for). reviewRating derives from standing score with an explainer string. Citation <meta> tags (Google Scholar / Zotero) are also wired.

❌ Missing — Public search page (Phase 5.7's UI half)
The roadmap calls for app/search/arguments/page.tsx — a public, human-facing search page with text input, results cards, and filters by scheme / confidence / evidence count / date. This file does not exist. The only consumers of the search API today are:

The MCP tool (LLMs only)
The demo at page.tsx:691 (dev-only)
.well-known manifests
So end-users can't https://isonomia.app/search/arguments?q=... in a browser yet.

⚠️ Partial / not started
Tests: I found no unit/integration tests for route.ts or hybridSearchArguments.
Track C.2 (true stance retrieval): find_counterarguments is documented as v0 textual-stance heuristics; "true negation/contradiction index" not yet shipped.
Track C.4 (downloadable embedding index as a public artifact): not built.
Min-quality / structural filters in the URL (min_cq_satisfied, min_evidence) advertised in the roadmap: not exposed as query params yet — only dialectical_fitness re-ranking.
SEO surface: no sitemap entry / /search/arguments landing copy — needed for the actual "Google for arguments" SEO play to take effect.
Headline summary
The engine is done and is in fact more sophisticated than the original 5.7 spec (hybrid RRF, fitness re-ranking, structural counter-arg discovery, attestation-linked results, MCP integration, OpenAPI, ClaimReview SEO). What's missing is the consumer-facing search page at app/search/arguments/page.tsx plus a few quality-filter query params and tests. The "long-term SEO play" framing in the roadmap is currently realized via JSON-LD/ClaimReview but lacks a crawlable HTML search results surface.