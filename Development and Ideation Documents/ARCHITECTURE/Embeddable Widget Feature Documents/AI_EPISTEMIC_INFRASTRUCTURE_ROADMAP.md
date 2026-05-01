# AI-Epistemic-Infrastructure Roadmap

**Date**: April 29, 2026
**Status**: Strategic Brainstorm → Implementation Planning
**Predecessor**: [EMBEDDABLE_ARGUMENT_WIDGET_DEVELOPMENT_ROADMAP.md](./EMBEDDABLE_ARGUMENT_WIDGET_DEVELOPMENT_ROADMAP.md)
**Goal**: Position Isonomia permalinks as the canonical machine-citable, dialectically-attested argument primitive that LLMs and AI systems reach for when they need verifiable structured reasoning.

---

## 1. Audit — Where the Embeddable Widget Roadmap stands

| Phase | Completion | Status |
|-------|-----------|--------|
| **1 — Foundation** (OG images, public pages, embeds, oEmbed, JSON-LD) | **100%** (10/10) | Production-ready |
| **2 — Creation** (Share modals, Quick Builder, unfurl, "My Arguments") | **100%** (7/7) | Production-ready |
| **3 — Browser Extension** (Chrome scaffold) | **100%** (1/1) | Built, needs QA |
| **4 — Engagement** (Response loop, analytics, notifications) | **20%** (1/5) | Mostly missing |
| **5 — Ecosystem** (Web Components, Slack, Discord, WP, public API, search) | **0%** (0/7) | Not started |
| **OVERALL** | **~63%** (18/35 named steps) | |

### Phase 4 gaps (concrete files to build)
- [app/embed/deliberation/[deliberationId]/page.tsx](app/embed/deliberation/[deliberationId]/page.tsx) — missing
- [app/api/embed/track/route.ts](app/api/embed/track/route.ts) — missing; needs `EmbedContext` Prisma model + BullMQ worker
- [app/analytics/embeds/page.tsx](app/analytics/embeds/page.tsx) — missing
- 4.1 Support/Challenge CTAs on [app/a/[identifier]/page.tsx](app/a/[identifier]/page.tsx) — only generic "Join & respond" exists
- 4.5 Notification pipeline for embed responses — missing

### Phase 5 gaps
All 7 items unbuilt — Web Components, Slack/Discord, WordPress, public API v3, ClaimReview JSON-LD, public argument search.

### Bonus already shipped (beyond original roadmap)
- Embeds for `/embed/stack`, `/embed/source`, `/embed/evidence`
- **A substantial AIF-JSON-LD export pipeline** at [lib/aif/export.ts](lib/aif/export.ts), [lib/aif/context.json](lib/aif/context.json), and [app/api/kb/pages/[id]/export-aif/route.ts](app/api/kb/pages/[id]/export-aif/route.ts).
- **This is the single most strategically valuable asset for the next pivot.**

---

## 2. Strategic Thesis

> **Every Isonomia permalink is an addressable, structured, verifiable, machine-citable epistemic artifact.**
> It carries (a) a canonical claim, (b) attested evidence with provenance, (c) a typed inference (scheme + critical questions), (d) the dialectical context that has tested it (attacks, supports, undercuts, rebuttals, surviving CQs), and (e) a cryptographically stable identifier.
> LLMs and AI agents need exactly this shape of unit when they cite, reason, or are asked to be auditable.

### Three audiences converge on this
1. **Scalable-oversight researchers** (Schmidt Sciences, OpenPhil, ARIA, Anthropic Society & Alignment, METR) — need argument-shaped artifacts that humans and AIs can co-evaluate.
2. **Retrieval-augmented LLM builders** (Perplexity, You, OpenAI, Anthropic, Google) — citations today are URLs. URLs cite *prose*. Isonomia citations would cite *adjudicated reasoning*.
3. **Fact-checking & journalism infrastructure** (ClaimReview consortium, Google Fact Check Tools, IFCN signatories) — already has Schema.org primitives but no source of structured arguments at scale.

### The moat
You already have **AIF-grade argument graphs serialized as JSON-LD with a stable @context**, exposed at stable permalinks, with critical-question state and dialectical history. Nobody else does. The work ahead is *packaging this as a citation primitive* and *exposing the protocol surfaces LLMs already speak*.

---

## 3. Five Capability Tracks

Ordered by *leverage per unit of work*, not by dependency. Each is independently shippable; each strengthens the LLM-citable pitch.

### Track A — Make every permalink machine-first, not just human-first

The current `/a/{id}` page emits `CreativeWork` JSON-LD. Upgrade it to a **machine-grade epistemic record**.

#### A.1 — Multi-format content negotiation at the same permalink
- `Accept: text/html` → human page (current)
- `Accept: application/ld+json` → full AIF-JSON-LD subgraph (claim + premises + scheme + CQ state + attacks/supports + evidence with provenance hashes)
- `Accept: application/json` → compact API representation
- `?format=aif|jsonld|argdown|sadface|markdown|bibtex` query fallbacks

Argdown, SADFace and AIF are the three formats the argumentation-research community actually consumes. Bibtex/CSL-JSON gets you into Zotero, citation managers, and academic workflows immediately.

#### A.2 — Promote the JSON-LD from `CreativeWork` to a richer composite
At [app/a/[identifier]/page.tsx](app/a/[identifier]/page.tsx#L146):
- `@type: ["CreativeWork", "Claim", "ScholarlyArticle"]` with the AIF context aliased
- Inline the conclusion claim, premise claims, scheme name + scheme URI, evidence as `citation: [{@type:"WebPage", url, sha256, archivedAt}]`
- Emit `Schema.org/ClaimReview` when the argument has been dialectically tested (≥2 critical questions answered, or ≥1 attack with response) — this is roadmap 5.6 but with a real activation rule
- Add `sameAs` linking to the AIF export URL so crawlers connect the human and machine views

#### A.3 — Stable content addressing
- Compute a `sha256` of the canonical AIF subgraph (claim text + premise MOIDs + scheme id + evidence hashes) and surface it as `version` and `contentHash` in metadata
- Bump on edits (already have `bumpPermalinkVersion`); expose `/a/{id}@{hash}` immutable URLs for citation-stability
- This is the difference between "I cited a Reddit post" and "I cited an artifact whose state is provable"

#### A.4 — Evidence provenance hardening
- On evidence creation, server-side fetch and store: `sha256(body)`, `archive.org/web/save` snapshot URL, fetched HTTP headers, `Last-Modified`, content-type
- Surface this in the JSON-LD as `WebPage.identifier` (sha256) and `archivedAt`
- Now an LLM citing your permalink can *prove* what the source said when the argument was made

---

### Track B — Become the protocol surface LLMs reach for

Where the pitch lands. Build the *minimum viable AI-citation API*.

#### B.1 — `/.well-known/llms.txt` and `/.well-known/argument-graph`
The emerging conventions for telling LLMs how to consume your site. Document the AIF-JSON-LD endpoint, the search API, the content-negotiation rules. Cheap, signals seriousness.

#### B.2 — MCP server (`packages/isonomia-mcp`)
Model Context Protocol is the de-facto standard for connecting LLMs to structured data. Tools to expose:
- `search_arguments(query, filters)` → ranked argument permalinks
- `get_argument(permalink)` → AIF-JSON-LD subgraph + dialectical state
- `get_claim(moid)` → claim with its supporting and attacking arguments
- `find_counterarguments(claim_text)` → semantic search over attacking arguments
- `cite_argument(permalink)` → returns canonical citation block (URL + content hash + pull quote + attestation)
- `propose_argument(claim, evidence)` → calls the Quick Argument API, returns permalink (this is the wedge — LLMs become argument *creators*; every Isonomia citation is an LLM-produced verifiable artifact)

Ship this *before* the public REST API v3. MCP gets you Anthropic, Cursor, Claude Desktop, Cline, and dozens of other clients adoption literally the day you publish.

#### B.3 — OpenAPI 3.1 spec for the public API
With semantic descriptions tuned for LLM tool-calling. Even before you ship the API, the spec is a recruiting document: you can hand it to any agent framework and it understands what your system does.

#### B.4 — Attestation envelope for every retrieval response
```json
{
  "argument": {...},
  "attestation": {
    "permalink": "https://isonomia.app/a/Bx7kQ2mN",
    "contentHash": "sha256:...",
    "version": 3,
    "retrievedAt": "2026-04-29T12:34:56Z",
    "evidenceProvenance": [{"url":"...", "sha256":"...", "archivedUrl":"..."}],
    "dialecticalStatus": {
      "attacks": 2, "attacksResponded": 2,
      "criticalQuestionsRequired": 5, "criticalQuestionsAnswered": 4,
      "currentStandingScore": 0.78
    }
  }
}
```
This is the unit an LLM should embed in its response when it cites. It's verifiable, dated, and dialectically scored. **That's the pitch.**

---

### Track C — Argument-native search & retrieval

Makes Phase 5.7 (Public Argument Search) land properly.

#### C.1 — Hybrid retrieval pipeline
Combine existing Pinecone vectors with argument-graph–aware re-ranking:
- Embed the *conclusion claim* separately from the *full argument prose* (different retrieval intents: "what's the claim?" vs. "what's the reasoning?")
- Re-rank by dialectical fitness: arguments that have survived more critical questions, that have lower undercut counts, that have higher-provenance evidence rank higher
- Expose this via `/api/v3/search/arguments?q=...&min_cq_satisfied=3&min_evidence=2&scheme=ExpertOpinion`

#### C.2 — Stance retrieval
Given a claim, retrieve "arguments *for*" and "arguments *against*" as separate ranked lists. The killer query for any AI debate, deliberation-coach, or fact-check pipeline.

#### C.3 — Counter-citation discovery
When an LLM wants to cite an Isonomia argument, also surface "the strongest unanswered attack on this argument right now." Force epistemic honesty into the citation primitive itself. **No other citation system in the world does this.**

#### C.4 — Embeddings as a public artifact
Publish a downloadable, dated embedding index of public arguments under a research license. Lets external researchers and LLM labs index your corpus without scraping.

---

### Track D — Federated, signed, portable arguments

The long-arc pitch to scalable-oversight funders.

#### D.1 — Cryptographically signed arguments
Optionally sign the canonical AIF subgraph hash with the author's key (Ed25519, can piggyback on Firebase Auth or DID). Now the permalink is a *signed attestation* — you can verify "person X authored this argument at time T with this evidence" without trusting Isonomia.

#### D.2 — W3C Verifiable Credentials wrapping
Each argument permalink can also be served as a VC. Connects you to the entire decentralized identity / receipts / attestation ecosystem (Bluesky AT Protocol, did:web, etc.) — exactly where the AI-epistemic-infrastructure conversation is happening right now.

#### D.3 — AIF/Argdown federation protocol
Define an inbound endpoint that ingests AIF-JSON-LD subgraphs from external systems (other Isonomia deployments, ARG-tech tools, OVA, MonkeyPuzzle). Now arguments are portable across the open argumentation ecosystem and Isonomia is the hub. Broadens the scholarly-infrastructure pitch from "our tool" to "the protocol-layer player".

#### D.4 — Replication / archival partnerships
Internet Archive's Argument Web corpus, AIFdb at Dundee. One email from the right researcher and you have institutional legitimacy.

---

### Track E — The "scholarly object" UX

Make the artifact feel like something an academic would cite.

#### E.1 — Citation block on every public page
APA, MLA, Chicago, BibTeX, CSL-JSON. One click to copy. Includes content hash + retrieved-at. Zotero browser extension auto-detects via `<meta name="citation_*">` (you already half-have this in the metadata stub at roadmap 1.3 — finish it).

#### E.2 — DOI-style identifiers
Isonomia issues a permanent identifier (e.g., `iso:10.0001/Bx7kQ2mN`) for every argument. Optionally mint actual DOIs via [Crossref](https://www.crossref.org/) or [DataCite](https://datacite.org/) for arguments above a quality threshold. **The move that gets you cited in real academic papers.**

#### E.3 — "Argument Object" landing page polish
The `/a/{id}` page should feel like a journal article landing page — abstract (claim), authors, scheme (≈ "method"), evidence (≈ "references"), critical questions answered (≈ "peer review responses"), citations of *this* argument elsewhere on the web (track via embed analytics — Phase 4.3).

#### E.4 — "Cited by" graph
Every argument page shows the arguments that cite it (via support/attack edges *and* via web embeds). Google Scholar's "cited by N" — the single feature that made it the standard.

---

## 4. Four-Week Minimum-Viable-Pitch Sequencing

Goal: have something concrete to walk into a Schmidt / OpenPhil / scalable-oversight conversation with within a month.

### Week 1 — Track A.1, A.2, A.3
Content negotiation, richer JSON-LD with ClaimReview activation, content hashing.
- **Deliverable**: `curl -H "Accept: application/ld+json" isonomia.app/a/{id}` returns full AIF subgraph with content hash and dialectical state.

### Week 2 — Track B.2
MCP server.
- **Deliverable**: A working MCP server you can install in Claude Desktop in three lines, with `search_arguments`, `get_argument`, and `propose_argument` tools.

### Week 3 — Track C.1 + C.2 + finish Phase 4.3 embed tracking
Hybrid retrieval, stance retrieval, embed analytics infrastructure.
- **Deliverable**: `/api/v3/search/arguments?q=...&stance=against` returns ranked counter-arguments with attestation envelopes.

### Week 4 — Track E.1 + E.2 + demo
Citation blocks, identifier scheme, one-page demo.
- **Deliverable**: A demo where Claude (via MCP) answers a contested question, cites three Isonomia permalinks with attestation envelopes, and surfaces the strongest unanswered attack on each.

That demo *is* the pitch. It shows:
1. Machine-citable structured arguments
2. Verifiable provenance
3. Dialectical honesty (counter-arguments surfaced, not hidden)
4. Standards-grounded (AIF, JSON-LD, MCP, Schema.org)
5. Shippable today on existing infrastructure

---

## 5. Recommended First Two Tasks

The two highest-leverage starts, both building on existing AIF-JSON-LD infrastructure (~80% there):

1. **A.1 + A.2** (content negotiation + richer JSON-LD with content hashing) — 1–2 day implementation that immediately changes what every existing permalink *means*.
2. **B.2** (MCP server) — the demo-ready artifact that converts the pitch from slides into something you can run live.

Suggested order: **start with A.1 + A.2** since it's a small, contained change that upgrades the value of every argument already in the system, then layer B.2 on top.

---

## 6. Cross-Cutting Considerations

### Standards alignment
- **AIF** (Argument Interchange Format) — already in [lib/aif/context.json](lib/aif/context.json)
- **Schema.org** Claim, ClaimReview, ScholarlyArticle, CreativeWork
- **JSON-LD 1.1** with stable `@context`
- **MCP** (Model Context Protocol) — Anthropic's open standard
- **OpenAPI 3.1** for REST surface
- **W3C Verifiable Credentials** (Track D)
- **CSL-JSON / BibTeX** for citation managers
- **Argdown / SADFace** for argumentation research community

### Security & abuse
- Signed attestations must be revocable (revocation list endpoint)
- Content-hash immutable URLs (`/a/{id}@{hash}`) require careful caching to avoid stale-state confusion
- MCP `propose_argument` tool needs strong rate limiting and abuse heuristics — LLMs will spam
- Evidence archival must respect robots.txt and site terms; use archive.org as the canonical snapshot rather than mirroring ourselves

### Performance
- AIF subgraph generation per permalink request: cache aggressively, invalidate on `bumpPermalinkVersion`
- MCP server should be a stateless wrapper over the public API — no separate DB layer
- Embedding the dialectical-status calculation into the attestation envelope: precompute on argument-graph mutations, store on `ArgumentPermalink`

### Funder-facing positioning
- One-pager: "Isonomia: an open epistemic infrastructure for verifiable AI citation"
- Demo video: Claude using MCP to answer a contested question with attested counter-arguments surfaced
- Whitepaper: AIF + dialectical status + content hashing → a primitive for scalable oversight
- Open the MCP server, the JSON-LD context, and the OpenAPI spec under permissive licenses; keep the corpus and the deliberation product proprietary

---

*This roadmap is a living document. Each track is independently shippable. The first contained move (Track A.1 + A.2) upgrades every existing permalink in the system, no migrations or coordinated rollouts required.*
