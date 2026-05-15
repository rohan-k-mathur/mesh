# Auto-Citation Engine — Roadmap

**Owner:** TBD  · **Status:** Planning  · **Created:** 2026-05-12
**Related:** T4.1 (provenance gap) in `docs/Deliberation Tooling Backlog and Priority Order.md`

## Goal

Given a URL (or DOI / arXiv ID / ISBN), produce a canonical CSL-JSON citation with verified metadata, store it once, and link it to any `ArgumentSupport` that references the same source. Unblocks T4.1's "require provenance on empirical claims" requirement by making citation hygiene a one-paste action instead of a hand-format chore.

## Non-goals (v1)

- Full reference-manager replacement (Zotero/Mendeley sync already exists).
- Citation *style* rendering beyond CSL-JSON + BibTeX (already covered by `lib/stacks/export/bibtex.ts`).
- PDF parsing / OCR of attached files.
- Automatic citation *suggestion* from claim text (separate feature; this is URL-in only).

## Existing rails (do not rebuild)

- `lib/models/schema.prisma` — `Citation` model (line 1508), `ArgumentSupport.provenanceJson` (line 6703), `sourceUrls String[]` (line 4190), `aiProvenance Json?` (line 2574: `{model, promptHash, sourceUrls[], generatedAt}`).
- `lib/citation/serialize.ts` — `extractDoi(url)`, CSL-shaped serialization with `doi: string | null`.
- `lib/citation/formats.ts` — CSL-JSON type with `DOI?: string`.
- `app/api/reference-managers/[connectionId]/sync/route.ts` — `generateFingerprint(url?, doi?, title?)` for cross-source dedup.
- `app/api/arguments/[id]/aif/route.ts` — already surfaces `ArgumentSupport.provenanceJson` into AIF export.
- `lib/argument/aiAuthoring.ts` — maps `req.sources → sourceUrls` (line 105); natural hook point.
- `lib/stacks/export/bibtex.ts` — DOI-aware BibTeX exporter.
- `app/api/stacks/[id]/items/route.ts` — already accepts `doi` on stack items.

---

## Architecture

### Resolver waterfall

```
URL
 ├─ 1. Canonicalize (strip utm_*, follow redirects, optionally archive.org snapshot)
 ├─ 2. Detect identifier
 │    ├─ DOI in URL/path?       → Crossref content negotiation
 │    ├─ arXiv ID?              → arXiv API (export.arxiv.org/api)
 │    ├─ PubMed / PMC ID?       → NCBI E-utils
 │    ├─ ISBN?                  → OpenLibrary / Google Books
 │    └─ SSRN/OSF/bioRxiv?      → site-specific adapters (defer to v2)
 ├─ 3. HTML metadata scrape
 │    ├─ Highwire Press meta tags (citation_doi, citation_author, citation_journal_title)
 │    ├─ Dublin Core (DC.title, DC.creator, DC.date)
 │    ├─ JSON-LD ScholarlyArticle
 │    └─ OpenGraph / Twitter cards (blogs/news fallback)
 ├─ 4. If a DOI surfaced anywhere, jump back to (2) for authoritative metadata
 ├─ 5. LLM extraction fallback (Haiku 4.5: title/meta/first 2KB → CSL-JSON)
 └─ 6. Manual stub (URL + accessed date, confidence='none')
```

DOI content negotiation is the gold path:
```bash
curl -LH "Accept: application/vnd.citationstyles.csl+json" https://doi.org/<DOI>
```
returns CSL-JSON directly — already our internal shape.

### Source priority

| Source | Coverage | Cost | Notes |
|---|---|---|---|
| Crossref (DOI content-neg) | ~140M scholarly works | free, polite-pool email | primary |
| OpenAlex | superset + abstracts + citation graph | free w/ `mailto=` | secondary enrichment |
| Semantic Scholar | TLDRs, influence | free w/ key, rate-limited | optional v2 |
| arXiv API | preprints | free | needed for ML/physics citations |
| Highwire meta scrape | publisher pages | free | fallback when DOI missing |
| LLM extraction | anything | $$, ~3s | last-resort only |

### Storage model

Two options, pick one in Phase 1:

- **(A) Reuse `Citation` model.** Add `cslJson Json`, `resolvedFrom String` (e.g. `crossref|openalex|highwire|llm-haiku`), `resolvedAt DateTime`, `confidence String` (`high|medium|low|none`), `urlHash String @unique`. Cheaper migration; `generateFingerprint` becomes the dedup key.
- **(B) New `CitationResolution` cache table.** Keeps `Citation` semantically pure; resolution is a separate concern.

Lean toward (A) unless `Citation` is already in heavy use with conflicting semantics (verify in Phase 0).

### Hook points

- **Composer**: paste URL into argument source field → debounced `POST /api/citations/resolve` → chip auto-fills with `author (year). title.` and stores resolved CSL on `ArgumentSupport.provenanceJson.citations[]`.
- **Orchestrator (T4.1)**: in `lib/argument/aiAuthoring.ts`, after `sourceUrls` mapping, await `resolveAll(sourceUrls)` and stuff into `aiProvenance.citations`. Empirical-scheme validator rejects mints with zero high/medium-confidence resolutions.
- **MCP tool surface**: `resolve_citation(url)` for advocate/challenger agents to call *before* claim mint.
- **Bulk import**: paste list of URLs → producer-consumer → write to a Stack.

---

## Phased roadmap

### Phase 0 — Audit & confirm (½ day)

- [ ] Read full `Citation` model + count rows / find existing writers; decide storage option (A) vs (B).
- [ ] Verify `generateFingerprint` is exported from a reusable location; if not, lift it to `lib/citation/fingerprint.ts`.
- [ ] Confirm `ArgumentSupport.provenanceJson` shape currently in use (any callers reading specific keys?).
- [ ] Pick a polite-pool email for Crossref/OpenAlex UA string; add to env (`CITATION_RESOLVER_CONTACT_EMAIL`).

**Deliverable:** decision note appended to this doc with chosen storage option + migration plan.

### Phase 1 — MVP resolver (Crossref + Highwire only) (1-2 days)

- [ ] `lib/citation/resolve/types.ts` — `ResolvedCitation`, `ResolverSource`, `Confidence`.
- [ ] `lib/citation/resolve/canonicalize.ts` — strip tracking params, follow redirects (HEAD with timeout).
- [ ] `lib/citation/resolve/crossref.ts` — DOI → CSL-JSON via content negotiation.
- [ ] `lib/citation/resolve/highwire.ts` — fetch HTML, parse `<meta name="citation_*">` tags.
- [ ] `lib/citation/resolve/index.ts` — `resolveUrlToCitation(url): Promise<ResolvedCitation | null>` waterfall.
- [ ] In-process LRU cache (no DB writes yet) keyed by canonical URL hash.
- [ ] Unit tests with fixtured HTML / mocked fetch (Nature, NEJM, arXiv landing, blog post).

**Deliverable:** function callable from a script; can resolve a known DOI and a known publisher page.

### Phase 2 — Persistence + API route (1 day)

- [ ] Schema migration per Phase 0 decision (add columns to `Citation` or create `CitationResolution`).
- [ ] `lib/citation/store.ts` — `upsertResolvedCitation(resolved)` keyed by fingerprint.
- [ ] `POST /api/citations/resolve` — auth-gated, body `{ url }`, returns `{ citation, source, confidence, cached: bool }`. Rate-limit per user.
- [ ] Token-bucket per host inside resolver (Crossref polite-pool friendly).
- [ ] Integration test against the live route with a couple of known-good URLs.

**Deliverable:** `curl POST /api/citations/resolve -d '{"url":"..."}'` returns CSL-JSON; second call hits cache.

### Phase 3 — OpenAlex + arXiv adapters (½ day)

- [ ] `lib/citation/resolve/openalex.ts` — DOI lookup + abstract enrichment.
- [ ] `lib/citation/resolve/arxiv.ts` — `arXiv:NNNN.NNNNN` detection + Atom feed parse.
- [ ] Resolver merges Crossref (authoritative) + OpenAlex (enrichment: abstract, concepts, OA URL).

**Deliverable:** arXiv preprints resolve; Crossref hits include abstract+OA-link from OpenAlex.

### Phase 4 — Orchestrator integration (T4.1) (1 day)

- [ ] In `lib/argument/aiAuthoring.ts`, after `sourceUrls` mapping, call `resolveAll(sourceUrls)` (parallel, bounded concurrency 3, soft-fail per URL).
- [ ] Write resolved citations to `aiProvenance.citations[]` and to `ArgumentSupport.provenanceJson`.
- [ ] Empirical-scheme validator: reject mint if `sources.length > 0 && resolved.filter(c => c.confidence !== 'none').length === 0`.
- [ ] Update P2/P3 advocate prompts: instruct agents to include real URLs/DOIs and mention that `resolve_citation` runs automatically.
- [ ] Re-run a small Phase 7 batch on a test deliberation; check `cqCoverage` + per-arg `provenanceJson.citations` populated.

**Deliverable:** new empirical args produced by orchestrator carry verified citation metadata; reflects in AIF export.

### Phase 5 — Composer UI (1-2 days)

- [ ] Argument composer source-input change handler → debounced resolve call → chip rendering (`Author et al. (Year). Title.`) with hover for full citation.
- [ ] Confidence badge (green / yellow / gray) + "edit metadata" affordance for low-confidence results.
- [ ] Loading + error states; offline-graceful (degrades to URL chip).
- [ ] Visual reuse of existing stack-item / source UI primitives where possible.

**Deliverable:** user pastes URL into composer, sees parsed citation chip within ~1s on cache hit, ~2s cold.

### Phase 6 — LLM fallback + archive snapshots (½ day)

- [ ] `lib/citation/resolve/llm.ts` — Haiku 4.5 prompt that returns strict CSL-JSON or `null`. Validate with Zod before accepting.
- [ ] `lib/citation/resolve/archive.ts` — query Wayback (`http://archive.org/wayback/available?url=...`); store `archiveUrl` alongside.
- [ ] Mark LLM-resolved citations with `confidence: 'low'` and require user confirmation in composer.

**Deliverable:** non-academic blog/news links produce *something* citable; dead links resolve to archive snapshots.

### Phase 7 — Bulk import + MCP tool (½ day)

- [ ] `POST /api/citations/resolve/bulk` — accepts URL array, returns per-URL results with progress (or stream via SSE).
- [ ] Wire into stack import flow.
- [ ] Expose `resolve_citation` as an MCP tool to orchestrator agents.

**Deliverable:** advocate/challenger agents can call resolver pre-mint; bulk-paste-into-stack works.

### Phase 8 — Hardening (½ day) ✅ COMPLETE

- [x] Per-host rate limits + circuit breakers (`lib/citation/resolve/rateLimit.ts`: token bucket per host + 5-failure / 60s breaker; wired into `safe*` helpers in resolver index).
- [x] Crossref/OpenAlex polite-pool UA string verified (Crossref: `MeshApp/1.0 (mailto:${CROSSREF_POLITE_EMAIL})`; OpenAlex: `?mailto=` query param on every URL — preferred polite-pool mechanism).
- [x] Cache TTL policy: 30 days for successful resolutions, 24h for failures (`lib/citation/resolve/index.ts`).
- [x] Observability: every resolution emits `{evt:"citation.resolve", url, source, confidence, durationMs, cached}` JSON log line; in-process counters via `lib/citation/telemetry.ts` exposed at `GET /api/citations/resolve/metrics` (returns counters + per-host breaker states).
- [x] Documentation: `docs/user-guide/auto-citation.md`.

---

## Hard parts to watch

- **Paywalled pages**: can't scrape Highwire tags; rely on Crossref via DOI when present.
- **News/blogs**: no DOI; OG + meta only → mark `low` and require user confirm.
- **URL canonicalization**: same paper has 5 URLs (publisher / DOI / PubMed / preprint / ResearchGate) — dedup must use `doi || normalized title+author+year`, not URL.
- **Rate limits**: Crossref polite pool wants `User-Agent: ... mailto=...`; OpenAlex same.
- **LLM hallucinated DOIs**: validate by round-tripping (`HEAD https://doi.org/<doi>`) before trusting.
- **Stale snapshots**: store Wayback URL so citations remain verifiable.
- **Provenance of the resolution itself**: always store `resolvedFrom` so audits can find LLM-sourced metadata.

---

## Success metrics

- ≥95% of orchestrator-produced empirical args carry `confidence ∈ {high, medium}` citations after Phase 4.
- Cache hit rate ≥70% within a single deliberation after warmup.
- p50 resolve latency: <500ms cached, <1.5s cold (Crossref happy path), <4s LLM fallback.
- T4.1 closeable: empirical-scheme mints without resolved citations drop to 0.

---

## Open questions

- Storage option (A vs B) — answered in Phase 0.
- Should we cache *negative* resolutions (URL → nothing) and for how long?
- Do we want per-tenant resolver budgets (cost containment for LLM fallback)?
- Should challenger CQ-raises also auto-resolve any URLs they cite, or only advocate mints?

---

## Phase 0 — Audit findings & decisions (2026-05-13)

The roadmap's storage A/B framing was based on the assumption that the
`Citation` model holds bibliographic metadata. That assumption was wrong.
The audit changes the picture as follows.

### A. The bibliographic record is `Source`, not `Citation`

`Citation` (`lib/models/schema.prisma:1508`) is the **(target → source) edge**:
`{ targetType, targetId, sourceId, locator, quote, note, relevance, intent,
anchorType, anchorId, anchorData }`. It carries no CSL-shaped metadata.

`Source` (`lib/models/schema.prisma:1410`) is the bibliographic record and
already has every field a resolver needs:

- `kind`, `title`, `authorsJson`, `year`, `container`, `publisher`,
  `volume`, `issue`, `pages`, `doi @unique`, `url @unique`, `platform`,
  `accessedAt`, `archiveUrl`, `fingerprint`.
- Resolution lifecycle: `verificationStatus`, `verifiedAt`,
  `lastCheckedAt`, `canonicalUrl`, `httpStatus`, `httpStatusHistory`,
  `contentHash`, `contentChangedAt`, `enrichmentStatus`, `enrichedAt`,
  `enrichmentSource` (already an enum that includes
  `crossref|semantic_scholar|openalex`).
- Identifiers / enrichment: `identifierType`, `openAlexId`, `authorOrcids`,
  `abstractText`, `keywords`, `pdfUrl`, `pdfHash`.
- Hardening: `archiveStatus`, `localArchivePath`, `retractionStatus`,
  `correctionStatus`, etc.

Citation counts: 20+ existing readers of `prisma.citation.*` across
workers, timeline, claim/argument routes, and stack discussion. Migrating
or repurposing `Citation` is **not viable** without a coordinated rewrite.

### B. The Crossref + OpenAlex resolver also already exists

- `lib/integrations/crossref.ts` — exports `resolveDOI(doi)`,
  `resolveDOIs(doi[])`, `normalizeDOI`, `isValidDOI`.
- `lib/integrations/openAlex.ts` — exports `enrichFromOpenAlex(doi)`.
- `lib/sources/databases/{crossref,openAlex}.ts` — second resolver layer
  used by the academic-search flow.
- `app/api/sources/route.ts` already implements DOI → Crossref →
  OpenAlex enrichment → `Source` upsert with fingerprint dedup.
- Polite-pool env vars already established and used in production code:
  `CROSSREF_POLITE_EMAIL` and `OPENALEX_POLITE_EMAIL` (see
  `lib/sources/databases/crossref.ts:24` and `openAlex.ts:25`). A second
  pair `CROSSREF_EMAIL` / `OPENALEX_EMAIL` is referenced only inside an
  archived design doc — do not introduce a third name like
  `CITATION_RESOLVER_CONTACT_EMAIL`.

What is **missing**, and what this engine actually needs to build:

1. URL canonicalization + redirect-following (no `lib/citation/resolve/canonicalize.ts` yet).
2. **DOI extraction from arbitrary URLs** (the existing path requires a DOI input).
3. Highwire `<meta name="citation_*">` scraper for publisher pages without a discoverable DOI.
4. arXiv adapter (the existing rails are DOI-only).
5. Wayback / archive snapshot lookup.
6. LLM extraction fallback with Zod-validated CSL output.
7. The orchestration waterfall + per-host rate limiting + an LRU/DB cache for resolved-from-URL lookups.
8. A single public entry point: `resolveUrlToSource(url): Promise<Source | null>`.

### C. `ArgumentSupport.provenanceJson` shape — actual usage

Grep across the repo (14 hits) shows only **two keys** are read today:

- `kind` (string: `"import"` is the only checked value).
- `fromDeliberationId` (string), with `fingerprint` (string) carried alongside.

Readers: AIF route (`app/api/arguments/[id]/aif/route.ts`),
deliberation evidential routes (v1 + v3 ECC), `arguments/full` route,
room-functor apply route. No reader inspects a `citations[]` field today,
so adding `provenanceJson.citations: ResolvedCitation[]` is **safe and
non-breaking**.

### D. Storage decision — Option C: reuse `Source`

Reject both options the roadmap proposed:

- **Option A** (extend `Citation`): wrong table; would silently change the
  semantics of an edge model with 20+ readers.
- **Option B** (new `CitationResolution` cache table): redundant; `Source`
  already has every field plus the resolution-lifecycle columns Phase 1.1
  added in production.

**Adopt Option C: the resolver writes to `Source`.** The auto-citation
engine is a **new front door** (`resolveUrlToSource(url)`) sitting on top
of the existing `resolveDOI` + `enrichFromOpenAlex` pipeline, plus the
non-DOI adapters listed in B.1–B.7. ArgumentSupport links to resolved
work via `provenanceJson.citations[]`, where each entry is
`{ sourceId, locator?, quote?, confidence }` — small, auditable, and
already compatible with the existing edge model (entries can be
materialized into `Citation` rows when a real attestation is created).

### E. Migration plan (Phase 2)

No DB migration is required. The work is:

1. Add `Source.lastResolveAttemptAt: DateTime?` and
   `Source.resolveError: String?` to record failed resolution attempts and
   gate retries (Phase 8 hardening).
2. Add a partial index on `Source.fingerprint` if not already present (it
   is nullable but heavily used for dedup).
3. Optionally add `Source.resolverVersion: String?` so future resolver
   changes can trigger targeted re-resolution.

Everything else lands as new files under `lib/citation/resolve/*` and a
new route `POST /api/citations/resolve` that returns
`{ source, source: ResolverSource, confidence, cached: bool }`.

### F. Phase 0 deliverables completed

- [x] `Citation` vs `Source` audit (above).
- [x] `provenanceJson` shape audit (only `{kind, fromDeliberationId, fingerprint}` consumed).
- [x] Polite-pool env vars confirmed (`CROSSREF_POLITE_EMAIL` / `OPENALEX_POLITE_EMAIL`); no new var needed.
- [x] `generateFingerprint` lifted to `lib/citation/fingerprint.ts` and the three duplicate copies (`app/api/sources/route.ts`, `app/api/sources/import/route.ts`, `app/api/reference-managers/[connectionId]/sync/route.ts`) now import from it. Behavior is byte-for-byte identical so existing `Source.fingerprint` values stay valid.

### G. Knock-on edits to later phases

- **Phase 1** title becomes "MVP URL→Source resolver (canonicalize + DOI extraction + Highwire)". The Crossref adapter step is replaced by a thin wrapper around the existing `resolveDOI`. New scope: `lib/citation/resolve/{types,canonicalize,extractDoi,highwire,index}.ts`.
- **Phase 2** drops the new-table option; the migration is the small `Source` column additions in §E.
- **Phase 3** OpenAlex adapter is also a wrapper around existing `enrichFromOpenAlex`; only arXiv is genuinely net-new.
- **Phase 4** orchestrator integration writes to `Source` (upsert) + `ArgumentSupport.provenanceJson.citations[]` (each entry pointing at a `sourceId`), not to a parallel resolution store.
- **Phase 6** LLM fallback writes to `Source` with `enrichmentSource = "llm"` and `verificationStatus = unverified`; round-trip any minted DOI through `resolveDOI` before persisting.
