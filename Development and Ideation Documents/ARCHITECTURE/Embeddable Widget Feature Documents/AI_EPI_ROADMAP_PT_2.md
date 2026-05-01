
# Next sprint plan — B.1 + B.3 + C.4

Three work items, all complementary: B.1 and B.3 are *discovery* surfaces (how do LLMs/agents *find* the API), C.4 is a *bulk* surface (how do labs index the corpus without scraping). All three are independent, all three are demoable.

---

## B.1 — `/.well-known/llms.txt` + `/.well-known/argument-graph`

**Why**: cheapest signal of seriousness. `llms.txt` is the emerging convention (Mintlify, Anthropic, Vercel all have one). `argument-graph` is our novel addition — an Isonomia-native discovery doc.

**Files to create**

- `app/.well-known/llms.txt/route.ts` — returns `text/markdown`. Static-ish, generated per-deploy. Sections: who we are, the canonical retrieval shapes, the MCP server, key endpoints, citation contract, license.
- `app/.well-known/argument-graph/route.ts` — returns `application/json`. Machine-readable manifest of our argument-graph capabilities. Shape draft:
  ```json
  {
    "version": "1.0",
    "service": { "name": "Isonomia", "baseUrl": "...", "license": "..." },
    "formats": ["text/html", "application/ld+json", "application/json", "attestation"],
    "endpoints": {
      "argumentByPermalink": "/a/{shortCode}",
      "argumentByPermalinkImmutable": "/a/{shortCode}@{contentHash}",
      "argumentAttestation": "/api/a/{shortCode}/aif?format=attestation",
      "search": "/api/v3/search/arguments",
      "claim": "/api/v3/claims/{moid}"
    },
    "mcp": {
      "transport": "stdio",
      "package": "@isonomia/mcp",
      "tools": ["search_arguments", "get_argument", "get_claim", "find_counterarguments", "cite_argument", "propose_argument"]
    },
    "schemas": {
      "aif": "https://www.arg.dundee.ac.uk/aif/aif.owl",
      "schemaOrg": ["Claim", "ScholarlyArticle", "ClaimReview"],
      "openapi": "/api/v3/openapi.json"
    },
    "citation": {
      "envelope": "/api/a/{shortCode}/aif?format=attestation",
      "contentAddressing": "sha256",
      "immutableUrlPattern": "/a/{shortCode}@{hash}"
    },
    "counterCitation": { "enabled": true, "tool": "cite_argument" }
  }
  ```
- Add discovery hints in the root layout `<head>`: `<link rel="alternate" type="application/json" title="Isonomia argument-graph manifest" href="/.well-known/argument-graph" />`.

**Verifier**: `scripts/verify-wellknown.ts` — fetch both endpoints, assert 200 + content-type + presence of required keys + that `argument-graph.endpoints.search` actually responds 200.

---

## B.3 — OpenAPI 3.1 spec for the public API

**Why**: turns the public API into a recruiting document. Any LangGraph / AutoGen / CrewAI / OpenAI-Agents pipeline can ingest the spec and call us out of the box. Pairs naturally with B.1 (linked from `argument-graph.schemas.openapi`).

**Approach: hand-curated, not generated.** We have ~6 endpoints worth shipping publicly. Hand-writing keeps the descriptions LLM-tool-call-quality (the actual win) and avoids dragging Prisma types into a public contract.

**Files to create**

- `app/api/v3/openapi.json/route.ts` — returns the spec as JSON. (Edge-cacheable, regenerated on deploy.)
- `app/api/v3/docs/page.tsx` — embed [Scalar](https://github.com/scalar/scalar) or [Stoplight Elements](https://github.com/stoplightio/elements) rendering of the spec. (Scalar is one `<script>` tag — zero ceremony.)
- openapi.ts — the spec object as a TypeScript const, so it can be shared between the route and verifier. Defines:
  - `info`: title, version, contact, license, `x-mcp-server` extension pointing at the npm package
  - `servers`: prod + staging
  - `paths`:
    - `GET /api/v3/search/arguments` (query, limit, scheme, against, sort)
    - `GET /a/{shortCode}` (with `Accept` header variants documented)
    - `GET /a/{shortCode}@{contentHash}` (immutable form)
    - `GET /api/a/{shortCode}/aif` (with `format` query: `aif|jsonld|attestation`)
    - `GET /api/v3/claims/{moid}`
    - `POST /api/v3/arguments` (Quick Argument API; token-gated)
  - `components.schemas`: `AttestationEnvelope`, `CitationBlock`, `ArgumentSearchResult`, `Claim`, `Scheme`, `EvidenceProvenance`, `DialecticalStatus`, `StandingState` enum
  - Every operation has a verbose `description` written for LLM tool-calling (mirror the keyword density we put in MCP descriptions)

**Verifier**: `scripts/verify-openapi.ts` — fetch `/api/v3/openapi.json`, parse with `@apidevtools/swagger-parser` (it ships an OpenAPI 3.1 validator), assert no errors. Then for each `path`, do a smoke `GET` (or skipped for `POST /arguments`) and assert the response shape matches the declared schema.

---

## C.4 — Public embedding artifact

**Why**: the move that lets external researchers and LLM labs treat Isonomia as a *corpus*, not a *site*. Also a natural deliverable to attach to a Schmidt/OpenPhil grant: "we shipped an open dataset."

**Approach: nightly snapshot, S3-hosted, manifest-fronted.**

**Files / infra**

- `scripts/build-embedding-snapshot.ts` — long-running script. Iterates all public arguments (`permalink: { isNot: null }`), computes (or pulls from Pinecone) the conclusion-claim embedding + the full-argument embedding, packages as Parquet. Output:
  - `arguments.parquet` — columns: `permalinkShortCode`, `immutablePermalink`, `contentHash`, `claimMoid`, `claimText`, `argumentText`, `schemeKey`, `createdAt`, `version`, `dialecticalState` (json), `claimEmbedding` (vector), `argumentEmbedding` (vector)
  - `claims.parquet` — columns: `moid`, `text`, `supportingArgCount`, `attackingArgCount`, `embedding`
  - `manifest.json` — snapshot metadata (date, commit SHA, row counts, embedding model + dim, sha256 of each file, license)
  - `LICENSE.md` — **CC-BY 4.0** (decided 2026-04-30: maximizes lab uptake; the live attestation API + counter-citation reflex remains where the leverage lives)
  - README.md — schema + load examples (HuggingFace `datasets`, DuckDB, polars)
- Upload via existing AWS SDK to `s3://isonomia-public-data/snapshots/YYYY-MM-DD/`. Maintain `s3://isonomia-public-data/snapshots/latest/` symlink-equivalent (copy on success).
- `app/api/v3/embeddings/manifest/route.ts` — proxies `manifest.json` from S3 with a 1-hour cache. Public, signed-URL-free.
- `app/api/v3/embeddings/download/route.ts?file=arguments.parquet` — returns a short-lived presigned S3 URL (5-minute TTL). Records anonymous download stats.
- page.tsx — add a small "Public corpus" callout in the **Audience** section linking to the manifest.
- BullMQ cron in workers to run the snapshot weekly (start there; daily once stable).

**Verifier**: `scripts/verify-embedding-snapshot.ts` — parse `manifest.json`, assert all listed files have matching sha256 from S3 HEAD, parse `arguments.parquet` row 0, assert schema.

**Open product questions** (worth deciding before coding):
1. ~~License~~ — **decided: CC-BY 4.0** for the corpus snapshot. Rationale: SA scares legal teams (treated like GPL); NC blocks the "corpus labs train on" goal that justifies the deliverable; CC-BY matches the Pile/RedPajama/Dolma/OpenAlex pattern. Live API + attestation envelopes remain on standard terms.
2. Embedding model — re-use whatever populates Pinecone, or pin to OpenAI `text-embedding-3-large` for portability? (Pinning is friendlier to external consumers.)
3. PII / opt-out — ship author handles or anonymized author IDs? Default to handles, allow author opt-out via a profile flag.

---

## Sequencing (one sprint, three days each, parallelizable)

| Day | Track | Work |
|---|---|---|
| 1 | B.1 | Both `.well-known` routes + verifier + `<link>` in head |
| 2–3 | B.3 | OpenAPI spec hand-write + Scalar docs page + verifier |
| 3–5 | C.4 | Snapshot script + S3 plumbing + manifest endpoint + verifier |
| 5 | All | Wire each into `argument-graph` manifest. Update `/test/ai-epistemic` track-status pills (`planned` → `shipped`). Update README. |

**Definition of done**: 4 verifiers green (`verify-attestation`, `verify-mcp`, `verify-wellknown`, `verify-openapi`, `verify-embedding-snapshot` = 5 total), `/.well-known/argument-graph` is the single discovery doc that points an LLM at *all* of our shapes (HTML, JSON-LD, AIF, attestation, MCP, OpenAPI, embeddings), and the demo page reflects the new shipped state.

---

## Two open product questions before we code

1. ~~**C.4 license**~~ — **decided: CC-BY 4.0** (see C.4 section above).
2. **C.4 distribution** — confirm we have an S3 bucket (or CloudFront-fronted bucket) we're willing to make public-read. If not, alternative is HuggingFace Datasets (free, gives us a built-in audience surface; downside: less infra control).

Pick a starting track and I'll start implementing — my recommendation is **B.1 first** (it's a half-day of work and unblocks pointing the world at B.3 and C.4 once they land).