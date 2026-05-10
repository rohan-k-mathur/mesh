# Roadmap: "Google Search for Arguments" — remaining work

**Companion to:** [docs/Argument_Google_Scholar_Audit.md](Argument_Google_Scholar_Audit.md)
**Goal:** finish the consumer-facing + crawlable surfaces of public argument search so the engine that already exists (hybrid RRF retrieval, dialectical-fitness ranking, ClaimReview JSON-LD, MCP tools) becomes a usable destination for humans, search engines, and external tools.

---

## Guiding principles

- **Don't rebuild the engine.** [app/api/v3/search/arguments/route.ts](../app/api/v3/search/arguments/route.ts) and [lib/argument/hybridSearch.ts](../lib/argument/hybridSearch.ts) stay the single source of truth. Every new surface (page, sitemap, RSS, MCP) calls the same API.
- **Substrate-first product framing.** Per [/memories/repo/isonomia-substrate-product-claim.md], the load-bearing value is evaluator-independent provenance + standings. Surface `standingState`, `fitnessBreakdown`, `attestationUrl`, and counter-argument links prominently — not synthesis.
- **Honest-empty over clever-empty.** UI copy must reflect when the corpus is silent rather than fabricating results.
- **Ship in vertical slices.** Each phase below is independently shippable and demoable.

---

## Phase 1 — Consumer search page (the missing UI half of 5.7)

**Outcome:** `https://isonomia.app/search/arguments?q=…` is a real, linkable, crawlable page.

**Status (2026-05-09): SHIPPED except 1.7 (nav entry deferred).**

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 1.1 | Server-rendered search page | [app/search/arguments/page.tsx](../app/search/arguments/page.tsx), [app/search/arguments/layout.tsx](../app/search/arguments/layout.tsx) | ✅ |
| 1.2 | Result card component | [components/search/ArgumentResultCard.tsx](../components/search/ArgumentResultCard.tsx) | ✅ |
| 1.3 | Search form / filter bar | [components/search/SearchControls.tsx](../components/search/SearchControls.tsx) — query, scheme (datalist), sort, mode | ✅ |
| 1.4 | Empty / honest-empty state | inline `EmptyLanding`, `HonestEmpty`, `ErrorState` in `page.tsx` — distinct copy for no-intent / no-results / against-with-no-counters / API failure | ✅ |
| 1.5 | Pagination / "load more" | `Show more results` link bumps `?limit=` up to MAX_LIMIT=50; cursors deferred to Phase 2 | ✅ (interim) |
| 1.6 | Page metadata | `generateMetadata` emits dynamic title/description, canonical, `robots: index, follow`, OG/Twitter cards, alternate JSON / JSON-LD URLs | ✅ |
| 1.7 | Link from primary nav / landing | Deferred — tracked under Phase 3 SEO work | ⏸ |

**Discovery wiring** (added in same pass):

- [app/.well-known/argument-graph/route.ts](../app/.well-known/argument-graph/route.ts) now lists `humanSearchPage` and advertises `mode` on `search`.
- [app/.well-known/llms.txt/route.ts](../app/.well-known/llms.txt/route.ts) now lists `GET /search/arguments?q=...`.

---

## Phase 2 — Quality-filter query params (Track C in the roadmap)

**Outcome:** API and UI expose the filters the AI-EPI roadmap advertised but never wired.

**Status (2026-05-09): SHIPPED.** All four params live, OpenAPI/MCP describe them, and the UI exposes them as a collapsible "Quality filters" panel.

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 2.1 | Add `min_cq_satisfied` (int, default 0) | [app/api/v3/search/arguments/route.ts](../app/api/v3/search/arguments/route.ts) | ✅ |
| 2.2 | Add `min_evidence` (int, counts ClaimEvidence with `contentSha256`) | same | ✅ |
| 2.3 | Add `tested_only` boolean (shorthand for `standingState ∈ {tested-survived, tested-undermined, tested-attacked}`) | same | ✅ |
| 2.4 | Add `since` / `until` ISO date filters on `createdAt` | [app/api/v3/search/arguments/route.ts](../app/api/v3/search/arguments/route.ts), [lib/argument/hybridSearch.ts](../lib/argument/hybridSearch.ts) (HybridFilter date range) | ✅ |
| 2.5 | Update OpenAPI spec | [lib/api/isonomiaOpenapi.ts](../lib/api/isonomiaOpenapi.ts) | ✅ |
| 2.6 | Update MCP tool descriptions | [packages/isonomia-mcp/src/server.ts](../packages/isonomia-mcp/src/server.ts) | ✅ |
| 2.7 | Surface in search UI as toggles/sliders | [components/search/SearchControls.tsx](../components/search/SearchControls.tsx) (collapsible <details> panel) | ✅ |

**Implementation notes:**
  - `since`/`until` push to the DB (cheap); `tested_only`/`min_cq_satisfied`/`min_evidence` are applied AFTER per-row dialectical counters are computed (correct but bounded — candidate pool widens to `4*limit` capped at 200 when any quality filter is active).
  - The `tested_only` definition matches `computeStandingState`: `cqAnswered ≥ 2` OR (`(attackEdges + attackCAs) ≥ 1` AND `supportEdges ≥ 1`).
  - `min_evidence` only counts evidence with a `contentSha256` (provenance-anchored) — unhashed evidence rows do not satisfy it.
  - All five new params echo back on the response under `query.{testedOnly,minCqSatisfied,minEvidence,since,until}` so MCP clients can replay queries.

---

## Phase 3 \u2014 SEO surface ("Google for arguments" actually crawlable)

**Outcome:** Google can discover, index, and cite individual public arguments and the search corpus.

**Status (2026-05-09): code-side SHIPPED (3.1\u20133.3, 3.6). 3.4 / 3.5 are post-deploy ops checks.**

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 3.1 | Sitemap entry for every public argument permalink | [app/sitemap.ts](../app/sitemap.ts) \u2014 caps at 40k argument + 8k claim entries; switches to a sitemap index when the cap bites | \u2705 |
| 3.2 | Sitemap entry for canonical search topics | [app/sitemap.ts](../app/sitemap.ts) \u2014 one entry per known scheme (`/search/arguments?scheme=`), mirrors the SearchControls datalist | \u2705 |
| 3.3 | `robots.txt` allows `/a/*`, `/c/*`, `/search/arguments` | [app/robots.ts](../app/robots.ts) \u2014 also allows `/api/v3/search/`, `/api/a/`, `/api/c/`, `/.well-known/`; disallows `/api/auth/`, `/api/_cron/`, `/api/admin/`, `/test/`, `/quick`, `/inbox`, `/settings`. Emits sitemap pointer. | \u2705 |
| 3.4 | Verify `ClaimReview` JSON-LD passes Google Rich Results Test | manual test against [lib/citations/argumentJsonLd.ts](../lib/citations/argumentJsonLd.ts); fix any schema warnings | \u23f8 ops (run after deploy) |
| 3.5 | Submit to Google Search Console + Bing Webmaster | ops, not code | \u23f8 ops |
| 3.6 | OG image for search result pages | [app/api/og/search/arguments/route.tsx](../app/api/og/search/arguments/route.tsx) \u2014 1200\u00d7630 ImageResponse w/ query, result count, and sort/mode chips. Wired into `app/search/arguments/page.tsx` openGraph + twitter (`summary_large_image`) metadata. | \u2705 |

**Implementation notes:**
  - Sitemap is sourced from `ArgumentPermalink` (the only model that uniquely identifies a public argument), filtered to non-null `shortCode`. Claims surface only when at least one of their `asConclusion` arguments has a permalink \u2014 prevents empty-leaf URLs.
  - `lastModified` for arguments is `ArgumentPermalink.updatedAt` (bumped on graph-state changes that affect the content hash); for claims it falls back to `Claim.createdAt` (no `updatedAt` on the model).
  - Honest-empty: a Prisma error in the sitemap returns just the static landings rather than throwing \u2014 avoids serving a malformed sitemap.
  - Search OG card pulls a live count from the v3 API for the embedded query (one-hour edge cache), so a Slack/Twitter unfurl shows "12 results for \u2018smartphones adolescent depression\u2019" rather than a generic placeholder.

**Done when:** sitemap is reachable, Rich Results Test shows a valid ClaimReview card, and a sample permalink appears in `site:isonomia.app` queries within ~2 weeks.

---

## Phase 4 — Test coverage (currently zero)

**Outcome:** the engine has regression coverage before more consumers depend on it.

**Status (2026-05-09): 4.1–4.3 SHIPPED (21 tests, all green). 4.4 / 4.5 deferred.**

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 4.1 | API integration tests for `/api/v3/search/arguments` | [__tests__/api/v3-search-arguments.test.ts](../__tests__/api/v3-search-arguments.test.ts) — covers `mode`, `sort`, `against`, honest-empty, all 4 Phase 2 quality filters | ✅ |
| 4.2 | Unit tests for `hybridSearchArguments` | [__tests__/lib/hybridSearch.test.ts](../__tests__/lib/hybridSearch.test.ts) — tokenizer, RRF math, sparse/dense fallback, empty-id short-circuit, lexicalCoverage forwarding | ✅ |
| 4.3 | Snapshot test of `ClaimReview` JSON-LD | [__tests__/lib/argumentJsonLd.test.ts](../__tests__/lib/argumentJsonLd.test.ts) — ClaimReview gated on `isTested` AND `conclusion` present, reviewRating wiring | ✅ |
| 4.4 | Smoke test of MCP `search_arguments` against the route | deferred — needs running server fixture; revisit after Phase 3 |
| 4.5 | Playwright e2e: `/search/arguments?q=…` returns results, filters work | deferred — add to `e2e/argument-search.spec.ts` once a seed corpus exists |

**Done when:** `npm run test` covers all four endpoints/components; CI runs them on PR.

---

## Phase 5 — Counter-citation discovery (Track C.3) ✅ SHIPPED

**Outcome:** every result advertises its strongest unanswered attack — enforces the "epistemic honesty" pitch.

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 5.1 | API: optional `include_strongest_counter=true` adds a `strongestCounter` field per result | `app/api/v3/search/arguments/route.ts` — single-fanout helper `fetchStrongestCounters` (one edge query + one conflict-application query + one argument fetch covers all top-K, no N+1). Self-counters excluded by MOID. v0 ranks contesters by `permalink.accessCount desc, createdAt desc` (community-engagement-then-recency proxy); ranking-by-fitness deferred. | ✅ |
| 5.2 | Cap N: only run for top-K results to bound cost | `strongest_counter_k` param, default K=10, max 50 | ✅ |
| 5.3 | UI affordance: each card shows "Strongest counter: …" with link | `ArgumentResultCard.tsx` — renders block when present (with explicit "none on file" honest-empty); consumer page (`app/search/arguments/page.tsx`) opts in by default | ✅ |
| 5.4 | MCP + OpenAPI: expose same flag | `packages/isonomia-mcp/src/server.ts`, `lib/api/isonomiaOpenapi.ts` | ✅ |
| 5.5 | Tests | `__tests__/api/v3-search-arguments.test.ts` — 3 new cases (edge-source attach, honest-null when none, self-counter exclusion by MOID) | ✅ |

**Done when:** an LLM or human consumer of the search API receives the strongest counter alongside each citation by default.

**Follow-ups (deferred):** rank contesters by full dialectical fitness rather than the engagement+recency proxy; surface `against`-mode arguments page result-cards with the same affordance (already inherited via shared component).

---

## Phase 6 — Stance retrieval (Track C.2) ✅ SHIPPED

**Outcome:** "arguments for / arguments against this claim" as separate ranked lists, the killer query for any debate UI.

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 6.1 | New endpoint `GET /api/v3/claims/{moid}/stances` returns `{for: [...], against: [...]}` | `app/api/v3/claims/[moid]/stances/route.ts` (new). Resolves the claim, returns 404 with `error: "claim_not_found"` on miss; both sides honest-empty otherwise. Echoes claim text + counts + browse-more links. | ✅ |
| 6.2 | Build on existing `against` mode + claim-supports query | Symmetric delegation: `for` calls the search route with `?conclusion_moid={moid}` (a new Phase 6 filter), `against` calls it with `?against={moid}`. Both inherit the full result-shape contract — standingState, dialecticalFitness, attestationUrl, hybrid block, strongestCounter — for free. | ✅ |
| 6.3 | OpenAPI + MCP tool `get_claim_stances(moid)` | `lib/api/isonomiaOpenapi.ts` (new path + `StancesResponse` schema; `conclusion_moid` documented on the search params), `packages/isonomia-mcp/src/server.ts` (new `GetClaimStancesInput` zod + `get_claim_stances` tool; `conclusion_moid` added to SearchInput). | ✅ |
| 6.4 | UI: claim page (`app/c/[moid]/page.tsx`) renders dual columns | New "Dialectical view" section renders for/against side-by-side with explicit empty-state copy ("That is honest, not absent"); deep links to full counter-arg search. Falls back gracefully if the stances fetch fails. | ✅ |
| 6.5 | Tests | `__tests__/api/v3-claims-stances.test.ts` — 4 cases: 404 on missing MOID, dual-list happy path with full result shape, honest-empty both sides, `conclusion_moid` propagates to prisma where clause. | ✅ |

**Done when:** any claim MOID resolves to two ranked lists with attestations.

**Follow-ups (deferred):** add support-edge inheritance to the "for" side (an argument that supports another argument concluding to the claim is implicitly for the claim too); add an `include_strongest_counter` shorthand to surface the dialectical counter-pair on each `for` row in one shot.

---

## Phase 7 — Public corpus artifact (Track C.4)

**Outcome:** a downloadable, dated embedding + metadata index researchers and LLM labs can ingest without scraping.

| # | Task | File(s) |
|---|------|---------|
| 7.1 | Nightly cron job: dump `{argumentId, conclusionMoid, contentHash, embedding, scheme, standingState, fitness}` to JSONL | `workers/exportPublicCorpus.ts` (new), wired in `workers/index.ts` |
| 7.2 | Upload to S3 with date-stamped key + "latest" pointer | reuse existing AWS SDK helpers |
| 7.3 | Public download URL listed in `/.well-known/argument-graph` | extend [app/.well-known/argument-graph/route.ts](../app/.well-known/argument-graph/route.ts) |
| 7.4 | License + datasheet | `docs/public-corpus-datasheet.md` (new) — CC-BY-4.0, retrieval semantics, known limits |

**Done when:** `curl https://isonomia.app/corpus/latest.jsonl.gz` returns a valid dump, advertised in the discovery manifest.

---

## Sequencing recommendation

The phases above are largely independent, but the high-leverage critical path is:

1. **Phase 1** (consumer page) — unlocks every external-user use case and makes the audit's headline gap concrete.
2. **Phase 4** (tests) — done in parallel with Phase 1 since the engine is now load-bearing.
3. **Phase 2** (quality filters) — small, finishes the original 5.7 spec.
4. **Phase 3** (SEO) — flips the "Google for arguments" pitch from latent to live.
5. **Phase 5** (counter-citation) — strongest differentiator vs. a plain LLM-with-web-search.
6. **Phase 6** (stance retrieval) — depends on nothing prior; can slot in any time after Phase 2.
7. **Phase 7** (corpus dump) — externally-facing, can be deferred until after a credibility milestone.

---

## Out of scope (intentional)

- **Holistic-quality LLM-judge eval of search results.** Per substrate-product-claim memo, same-family LLM-judge eval is order-effect-contaminated. Measurement should be observable artifact features (citation counts, CQ coverage, standings consistency), not "is the synthesis better."
- **Personalized ranking / engagement signals.** Public corpus is order-deterministic by design.
- **A separate semantic index outside Postgres/pgvector.** The hybrid pipeline already covers retrieval-quality needs; defer Pinecone/Weaviate migration.

---

## Locked decisions (resolved 2026-05-09)

1. **Route group:** new minimal `(public)` shell, mirroring `/a/[identifier]`. SEO + LCP win.
2. **Default search mode:** `hybrid` (matches MCP). UI exposes a "Match exact words" toggle that flips to `lexical`.
3. **JSON surface:** single canonical endpoint at `/api/v3/search/arguments`. The page emits `<link rel="alternate" type="application/json" href="/api/v3/search/arguments?…">` and `<link rel="alternate" type="application/ld+json" …>` in `<head>` for discovery. No `?format=json` on the page route.
4. **Sitemap:** sitemap index from day one, child sitemaps chunked by `createdAt` month, ~5,000 URLs per child. No migration ever.

The pro/con analysis that produced these decisions is preserved below.

---

## Open questions (analysis archive)

### Q1 — Should `/search/arguments` live under `(root)` or get its own route group?

| Option | Pros | Cons |
|---|---|---|
| **A. Under `(root)`** (existing app shell) | Inherits nav, auth context, theme, user menu — feels "part of the product." Zero new layout work. Cross-link affordances (open in new tab into the editor) work for free. | Heavier first paint (full app shell). Authenticated chrome may distract a logged-out visitor arriving from Google. SEO bots see app-shell noise above the fold. |
| **B. New minimal route group** (e.g. `(public)` or `(search)`) | Lean shell → faster LCP, better Core Web Vitals → better SEO ranking. Cleaner social/OG previews. Easy to A/B test landing copy. Aligns with how `/a/[identifier]` already renders standalone. | Duplicates header/footer code. Loses in-context nav for logged-in users (need a "Back to app" affordance). Slight risk of design drift. |

**Recommendation:** **B**, mirroring how `/a/[identifier]` is already a standalone scholarly-object page. SEO is the whole point of Phase 3, and we already have a precedent for the lean public shell.

---

### Q2 — Default `mode` for the consumer page: `hybrid`, `lexical`, or `vector`?

| Option | Pros | Cons |
|---|---|---|
| **A. `hybrid` (default)** | Matches MCP default (consistency across surfaces). Best recall on paraphrased queries — the documented win for "smartphones teen" → "adolescent" failure mode. RRF is robust when one signal is weak. Auditable (`hybrid` block per result). | Costs an embedding compute per uncached query. Pgvector latency adds ~50–150ms. Slightly less predictable for "find this exact phrase" intent. |
| **B. `lexical`** | Cheapest, most predictable, no embedding cost. Power users can reason about why a result appears. Zero infra dependency. | Misses paraphrases — the round-2 stress-test failure mode reappears. Diverges from MCP default → two surfaces give different results for the same query. |
| **C. `vector`** | Pure semantic — best for exploratory queries. | Worst for proper-noun / exact-quote queries. Embedding-only is a known weak default elsewhere. |

**Recommendation:** **A (`hybrid`)** as default with a visible mode selector, matching MCP. Add a "Match exact words" affordance that flips to lexical for users with that intent.

---

### Q3 — JSON-feed alternate on the search page itself, or rely solely on the v3 API?

| Option | Pros | Cons |
|---|---|---|
| **A. Add `?format=json` / `Accept: application/json` on the page route** | Single URL works for humans and crawlers (LLM browsers, RSS-style consumers). Mirrors content negotiation already used on `/a/[identifier]`. Discovery-friendly: the visible URL *is* the API URL. | Two routes serving similar JSON (page + `/api/v3/search/arguments`) — drift risk. Extra surface to test. Caching semantics get fuzzier. |
| **B. Rely solely on the v3 API** | One canonical JSON endpoint. Clear separation of concerns: page = HTML, API = JSON. Already documented in OpenAPI. `<link rel="alternate" type="application/json" href="/api/v3/search/arguments?…">` covers discovery. | One extra hop for casual scrapers. Less obvious to LLM agents that the page they're reading has a structured equivalent. |

**Recommendation:** **B**, but emit `<link rel="alternate" type="application/json" href="/api/v3/search/arguments?…">` and `<link rel="alternate" type="application/ld+json" …>` in `<head>` so discovery still works. Keep one canonical JSON endpoint.

---

### Q4 — Sitemap: single file vs. sitemap index, and at what threshold?

| Option | Pros | Cons |
|---|---|---|
| **A. Single `sitemap.xml`** | Simplest. No index-of-indices to maintain. Fine while corpus < ~10k arguments. | Google hard-limits a sitemap to **50,000 URLs / 50 MB uncompressed**. Hitting that mid-growth forces an emergency migration. Slow to regenerate as corpus grows. |
| **B. Sitemap index from day one** (`/sitemap.xml` → child sitemaps paginated by date or shard) | Future-proof; trivial to add new child sitemaps. Each child re-generates independently → cheaper incremental builds. Standard pattern (matches how Reddit/StackOverflow do it). | Slightly more code now. Overkill while corpus is small. |

**Recommendation:** **B** with a simple chunking scheme (e.g. 5,000 permalinks per child, partitioned by `createdAt` month). Cost is one extra route + a generator helper; payoff is no migration ever. Threshold for forcing the migration if we delay: when public-permalink count crosses ~5,000.
