# Auto-Citation Engine

Mesh resolves any URL or DOI you paste into a verified bibliographic
record automatically. You don't need to fill in title, authors, year,
or DOI by hand — the resolver does it.

## What it does

Paste a link in the citation composer (or in the bulk URL field of the
"New Library" modal). Mesh runs the link through a waterfall of
sources, in priority order:

1. **arXiv** — `arxiv.org/abs/...` URLs are looked up via the arXiv API
   and (when the preprint has been published) cross-checked against
   Crossref.
2. **Crossref** — when a DOI is detectable in the URL (`doi.org/...`,
   `/10.xxxx/...` patterns), Mesh fetches the canonical metadata.
3. **Highwire / Dublin Core / OpenGraph** — any page that exposes
   academic metadata via `<meta>` tags is parsed. If a DOI surfaces,
   Mesh upgrades the result to Crossref.
4. **OpenAlex enrichment** — DOIs are cross-referenced against OpenAlex
   to fill in abstracts, concepts, and Open Access PDFs.
5. **AI extraction** — if no structured metadata exists on the page,
   GPT-4o-mini extracts a best-effort bibliographic record. These are
   tagged `confidence: low` and **must be manually verified** before
   publishing.
6. **Wayback** — if the live URL is unreachable, Mesh checks the
   Internet Archive for a snapshot. Successful resolutions are also
   enriched with a stable archive URL when one exists.

## What you'll see in the UI

The citation chip below your URL/DOI input shows the resolution result:

| Badge | Confidence | What it means |
|---|---|---|
| 🟢 verified | `high` | Crossref or arXiv canonical record |
| 🟡 scraped | `medium` | Page metadata only (no DOI on file) |
| ⚪ partial | `low` | AI-extracted; verify before publishing |
| 🟠 unresolved | `none` | No metadata found; URL kept as-is |

Hover the chip for the resolver path (`via crossref (+openalex) ·
142ms`), the DOI when present, and the Wayback snapshot link.

## Confidence policies

- **AI-authored arguments** with empirical schemes (statistical,
  cause-to-effect, expert-opinion, etc.) **require** at least one
  citation with non-`none` confidence. Pure speculation gets rejected.
- **`low`-confidence (LLM)** citations are persisted but flagged in the
  UI. The composer will prompt you to verify or edit before publishing.
- **`none`** citations are kept as URL-only stubs and re-tried after
  24h (in case a DOI gets minted later or the host comes back online).

## Bulk import

Paste up to 200 URLs into the "New Library" modal's URL tab. Mesh
resolves them in the background after the LibraryPosts are created —
the chips hydrate as resolutions complete, no page reload needed.

For programmatic use, hit `POST /api/citations/resolve/bulk` directly
(`Accept: text/event-stream` for per-URL progress events).

## MCP tools (advanced)

LLM agents using the Isonomia MCP server can call `resolve_citation`
or `resolve_citations_bulk` to pre-mint Source rows before proposing
arguments. See `packages/isonomia-mcp/src/server.ts` for the tool
schemas.

## Operator notes

- **Polite-pool envs:** set `CROSSREF_POLITE_EMAIL` and
  `OPENALEX_POLITE_EMAIL` to your contact address. Crossref and
  OpenAlex give polite-pool clients ~5× the rate-limit budget of
  anonymous traffic.
- **Per-host rate limits + circuit breakers:** see
  [`lib/citation/resolve/rateLimit.ts`](../../lib/citation/resolve/rateLimit.ts).
  Five consecutive failures from a host opens the circuit for 60s.
- **Metrics:** `GET /api/citations/resolve/metrics` returns
  in-process counters (cache hit ratio, breakdown by source/confidence,
  per-host breaker states). Resets on restart.
- **Observability:** every resolution emits a single structured log
  line `{evt:"citation.resolve", url, source, confidence, durationMs,
  cached}` to stdout — easy to grep and ship to a log aggregator.
- **Cache TTLs:** successful resolutions cached 30 days (the underlying
  `Source` row is durable); failures retried after 24h.

See [`docs/AUTO_CITATION_ENGINE_ROADMAP.md`](../AUTO_CITATION_ENGINE_ROADMAP.md)
for the full architectural reference.
