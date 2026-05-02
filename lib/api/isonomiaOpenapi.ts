/**
 * Hand-curated OpenAPI 3.1 spec for the Isonomia public AI-citation API.
 *
 * Track B.3 of the AI-Epistemic-Infrastructure roadmap.
 *
 * Single source of truth, imported by:
 *   - app/api/v3/openapi.json/route.ts  (serves the spec)
 *   - app/api/v3/docs/page.tsx          (renders the spec via Scalar)
 *   - scripts/verify-openapi.ts         (validates + smoke-tests it)
 *
 * Distinct from lib/api/openapi.ts (the older Mesh Evidence API spec) —
 * this spec covers only the AI-citation surface (search, argument
 * resolution, claim lookup, authoring, discovery manifests).
 *
 * Hand-written rather than generator-emitted: descriptions are tuned for
 * LLM tool-calling, and Prisma model shapes stay out of the public
 * contract.
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://isonomia.app";

export const ISONOMIA_OPENAPI_SPEC = {
  openapi: "3.1.0",
  info: {
    title: "Isonomia AI-Citation API",
    version: "v3",
    summary:
      "Argument-graph platform exposing every public argument as a machine-citable, dialectically-attested, content-hashed epistemic artifact.",
    description: [
      "Isonomia's public API is the HTTP surface of the AI-citation primitive.",
      "Every public argument has a stable permalink whose canonical AIF subgraph is content-addressed (sha256), dialectically scored (CQ counts, attacks/supports), and citation-ready out of the box.",
      "Companion surfaces:",
      "  * Discovery manifest: GET /.well-known/argument-graph",
      "  * Human/LLM-readable docs: GET /.well-known/llms.txt",
      "  * MCP server (stdio, 6 tools): @isonomia/mcp",
      "Use this spec to wire Isonomia into LangGraph, AutoGen, CrewAI, OpenAI Agents, or any other tool-calling framework. Every operation description is tuned for LLM consumption.",
    ].join("\n"),
    license: {
      name: "API: see repository · Corpus: CC-BY-4.0",
      url: "https://creativecommons.org/licenses/by/4.0/",
    },
    contact: { name: "Isonomia", url: BASE_URL },
    "x-mcp-server": {
      package: "@isonomia/mcp",
      transport: "stdio",
      tools: [
        "search_arguments",
        "get_argument",
        "get_claim",
        "find_counterarguments",
        "cite_argument",
        "propose_argument",
      ],
    },
  },
  servers: [
    { url: BASE_URL, description: "Production" },
    { url: "http://localhost:3000", description: "Local development" },
  ],
  externalDocs: {
    description: "AI-Epistemic-Infrastructure explainer",
    url: `${BASE_URL}/test/ai-epistemic`,
  },
  tags: [
    { name: "Search", description: "Free-text and dialectical-fitness ranked search over public arguments." },
    { name: "Argument", description: "Resolve a public argument by permalink. Content-negotiated; supports AIF, JSON-LD, and a compact attestation envelope." },
    { name: "Claim", description: "Resolve a canonical claim by MOID with its supporting argument permalinks." },
    { name: "Authoring", description: "Create new public arguments. Token-gated. Mirrors MCP propose_argument." },
    { name: "Discovery", description: "Machine-readable manifests advertising this API to LLM agents." },
  ],
  paths: {
    "/api/v3/search/arguments": {
      get: {
        tags: ["Search"],
        operationId: "searchArguments",
        summary: "Search public arguments",
        description:
          "Full-text search over public Isonomia arguments. Use sort=dialectical_fitness to re-rank by tested-and-survived signals (CQ answers + inbound supports - inbound attacks - conflict applications + evidence with provenance). Set against={claimMoid} to retrieve counter-arguments to a target claim; results exclude self-counters by MOID. Each result includes the permalink, a separate URL to its compact attestation envelope, the primary argumentation scheme, and (when sort=dialectical_fitness) a numeric fitness score.",
        parameters: [
          { name: "q", in: "query", required: false, schema: { type: "string" }, description: "Free-text query, matched against argument text and conclusion-claim text.", example: "social media adolescent depression" },
          { name: "limit", in: "query", required: false, schema: { type: "integer", minimum: 1, maximum: 50, default: 10 }, description: "Maximum results to return (1..50, default 10)." },
          { name: "scheme", in: "query", required: false, schema: { type: "string" }, description: "Filter by primary argumentation scheme key (e.g. expert_opinion, cause_to_effect)." },
          { name: "against", in: "query", required: false, schema: { type: "string" }, description: "Claim MOID. Returns arguments whose conclusion attacks/contradicts that claim (counter-argument discovery). Excludes self-counters." },
          { name: "sort", in: "query", required: false, schema: { type: "string", enum: ["recent", "dialectical_fitness"], default: "recent" }, description: "recent (default; createdAt desc) or dialectical_fitness (re-ranks by tested-and-survived)." },
        ],
        responses: {
          "200": {
            description: "Ranked list of public arguments. Honest-empty: returns ok:true with results:[] rather than 404 when nothing matches.",
            content: { "application/json": { schema: { $ref: "#/components/schemas/SearchResponse" } } },
          },
        },
      },
    },
    "/api/a/{shortCode}/aif": {
      get: {
        tags: ["Argument"],
        operationId: "getArgumentRepresentation",
        summary: "Get argument representation (AIF / JSON-LD / attestation)",
        description:
          "Returns the structured representation of a public argument. The format query parameter selects the shape: aif (default; AIF-JSON-LD subgraph with CQs and inbound conflict/preference nodes), jsonld (rich composite Schema.org Claim + ScholarlyArticle + ClaimReview + AIF), or attestation (the compact citation envelope an LLM should embed when it cites). All three shapes ship with ETag (the sha256 content hash), Link headers pointing at the canonical permalink and alternate forms, and X-Isonomia-* metadata headers.",
        parameters: [
          { name: "shortCode", in: "path", required: true, schema: { type: "string" }, description: "Short code from a permalink (e.g. Bx7kQ2mN). May also accept the immutable form shortCode@contentHash." },
          { name: "format", in: "query", required: false, schema: { type: "string", enum: ["aif", "jsonld", "attestation"], default: "aif" }, description: "aif (default), jsonld, or attestation. The attestation form is the LLM-citation unit." },
        ],
        responses: {
          "200": {
            description: "Structured argument representation. ETag is the sha256 content hash; clients can revalidate cheaply via If-None-Match.",
            headers: {
              ETag: { description: "sha256 over the canonical AIF subgraph.", schema: { type: "string" } },
              "X-Isonomia-Content-Hash": { description: "Same as ETag without quotes.", schema: { type: "string" } },
              "X-Isonomia-Permalink-Version": { description: "Monotonically-increasing version of the argument graph state.", schema: { type: "integer" } },
              "X-Isonomia-Permalink": { description: "Canonical mutable permalink URL.", schema: { type: "string", format: "uri" } },
              Link: { description: "rel=canonical (mutable permalink) + rel=alternate links to all three formats.", schema: { type: "string" } },
            },
            content: {
              "application/ld+json": { schema: { $ref: "#/components/schemas/ArgumentJsonLd" } },
              "application/vnd.isonomia.attestation+json": { schema: { $ref: "#/components/schemas/AttestationEnvelope" } },
            },
          },
          "304": { description: "If-None-Match matched the current ETag." },
          "404": { description: "No public argument with this short code.", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      head: {
        tags: ["Argument"],
        operationId: "headArgumentRepresentation",
        summary: "Probe an argument's current content hash",
        description:
          "Cheap probe that returns ETag + X-Isonomia-Content-Hash + X-Isonomia-Permalink-Version without paying for graph assembly. Use this to detect whether a previously-cached argument has changed.",
        parameters: [{ name: "shortCode", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Headers only." },
          "404": { description: "No public argument with this short code." },
        },
      },
    },
    "/api/c/{moid}": {
      get: {
        tags: ["Claim"],
        operationId: "getClaim",
        summary: "Get a claim by canonical MOID",
        description:
          "Returns the claim text, its evidence (with contentSha256 and archive.org snapshot URL when available), and the public arguments whose conclusion is this claim (the 'arguments for' side). Counter-arguments to the claim live separately and should be retrieved via GET /api/v3/search/arguments?against={moid}.",
        parameters: [{ name: "moid", in: "path", required: true, schema: { type: "string" }, description: "Canonical MOID for the claim." }],
        responses: {
          "200": { description: "Claim with supporting argument permalinks.", content: { "application/json": { schema: { $ref: "#/components/schemas/ClaimResponse" } } } },
          "404": { description: "No claim with this MOID.", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/arguments/quick": {
      post: {
        tags: ["Authoring"],
        operationId: "proposeArgument",
        summary: "Create a new public argument (Quick Argument API)",
        description:
          "Creates a Claim + ClaimEvidence rows + Argument + permalink in one atomic call. Token-gated via Authorization: Bearer <Firebase ID token>. Returns the new permalink, embed codes, and the canonical claim. This is the HTTP surface MCP's propose_argument tool calls. Rate-limited to 20 arguments per user per hour.",
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ProposeArgumentInput" } } } },
        responses: {
          "200": { description: "Argument created. Permalink is immediately public.", content: { "application/json": { schema: { $ref: "#/components/schemas/ProposeArgumentResponse" } } } },
          "400": { description: "Validation failure.", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "401": { description: "Missing or invalid bearer token.", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "429": { description: "Rate limit exceeded (20/hour/user).", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/.well-known/argument-graph": {
      get: {
        tags: ["Discovery"],
        operationId: "getArgumentGraphManifest",
        summary: "Machine-readable discovery manifest",
        description:
          "Single discovery doc that points an LLM at every other shape (HTML, JSON-LD, AIF, attestation envelope, MCP tools, OpenAPI spec, corpus snapshot). Fetch this first; everything else is reachable from here.",
        responses: { "200": { description: "Argument-graph manifest.", content: { "application/json": { schema: { type: "object" } } } } },
      },
    },
    "/.well-known/llms.txt": {
      get: {
        tags: ["Discovery"],
        operationId: "getLlmsTxt",
        summary: "Human/LLM-readable companion to the discovery manifest",
        description:
          "Markdown summary of canonical retrieval shapes, citation contract, MCP tools, and corpus access. Mirrors the JSON manifest at /.well-known/argument-graph in prose form.",
        responses: { "200": { description: "Markdown body.", content: { "text/markdown": { schema: { type: "string" } } } } },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT (Firebase ID token)",
        description: "Firebase ID token. Obtain via /api/auth/extension-token or any other Firebase auth flow.",
      },
    },
    schemas: {
      Error: { type: "object", required: ["ok"], properties: { ok: { type: "boolean", enum: [false] }, error: { type: "string" } } },
      Scheme: {
        type: "object",
        description: "Argumentation scheme (Walton typology).",
        properties: { key: { type: "string", example: "expert_opinion" }, name: { type: "string" }, title: { type: "string", nullable: true } },
      },
      Conclusion: {
        type: "object",
        properties: { claimId: { type: "string" }, moid: { type: "string", description: "Canonical claim identifier." }, text: { type: "string" } },
      },
      Premise: { type: "object", properties: { moid: { type: "string" }, text: { type: "string" } } },
      EvidenceProvenance: {
        type: "object",
        properties: {
          uri: { type: "string", format: "uri" },
          contentSha256: { type: "string", nullable: true, description: "sha256 of the response body when fetched server-side. null when fetch failed or hasn't happened yet." },
          archive: {
            type: "object",
            nullable: true,
            properties: { url: { type: "string", format: "uri", nullable: true }, capturedAt: { type: "string", format: "date-time", nullable: true } },
          },
          fetchedAt: { type: "string", format: "date-time", nullable: true },
          contentType: { type: "string", nullable: true },
        },
      },
      Testedness: {
        type: "string",
        enum: ["untested", "lightly_tested", "well_tested"],
        description: "Coarse bucket derived from CQ answer count + inbound traffic. Prefer StandingState for richer signal.",
      },
      StandingState: {
        type: "string",
        enum: ["untested-default", "untested-supported", "tested-attacked", "tested-undermined", "tested-survived"],
        description: "Classifier over standingScore + inbound traffic + CQ work. Prefer this over the raw numeric score; robust to the no-signal case.",
      },
      DialecticalStatus: {
        type: "object",
        properties: {
          incomingAttacks: { type: "integer", minimum: 0 },
          incomingSupports: { type: "integer", minimum: 0 },
          incomingAttackEdges: { type: "integer", minimum: 0 },
          criticalQuestionsRequired: { type: "integer", minimum: 0 },
          criticalQuestionsAnswered: { type: "integer", minimum: 0 },
          criticalQuestionsOpen: { type: "integer", minimum: 0 },
          isTested: { type: "boolean" },
          testedness: { $ref: "#/components/schemas/Testedness" },
          standingScore: { type: "number", format: "double", nullable: true, description: "Composite score in [0, 1]. null when there's no signal - never a misleading 1.0." },
          standingState: { $ref: "#/components/schemas/StandingState" },
        },
      },
      AttestationEnvelope: {
        type: "object",
        description: "Compact citation unit. The shape an LLM should embed when it cites Isonomia.",
        required: ["permalink", "contentHash", "version", "retrievedAt"],
        properties: {
          permalink: { type: "string", format: "uri" },
          immutablePermalink: { type: "string", format: "uri", description: "Mutable permalink with @{contentHash} appended." },
          contentHash: { type: "string", description: "sha256:<hex> over the canonical AIF subgraph." },
          version: { type: "integer", minimum: 1 },
          retrievedAt: { type: "string", format: "date-time" },
          conclusion: { $ref: "#/components/schemas/Conclusion" },
          scheme: { $ref: "#/components/schemas/Scheme", nullable: true },
          premises: { type: "array", items: { $ref: "#/components/schemas/Premise" } },
          evidence: { type: "array", items: { $ref: "#/components/schemas/EvidenceProvenance" } },
          dialecticalStatus: { $ref: "#/components/schemas/DialecticalStatus" },
          author: {
            type: "object",
            nullable: true,
            properties: { username: { type: "string" }, name: { type: "string" } },
          },
        },
      },
      ArgumentJsonLd: {
        type: "object",
        description: "Rich composite JSON-LD: AIF subgraph + Schema.org Claim + ScholarlyArticle + ClaimReview, with an iso:attestation envelope layered on top so a single fetch yields both the structural graph and the citation primitive. Shape varies with format=aif vs jsonld.",
        additionalProperties: true,
      },
      ArgumentSearchResult: {
        type: "object",
        properties: {
          argumentId: { type: "string" },
          permalink: { type: "string", format: "uri" },
          shortCode: { type: "string" },
          version: { type: "integer" },
          text: { type: "string" },
          conclusion: { $ref: "#/components/schemas/Conclusion", nullable: true },
          scheme: { $ref: "#/components/schemas/Scheme", nullable: true },
          standingState: { $ref: "#/components/schemas/StandingState", description: "5-bucket dialectical-standing classifier surfaced inline so a single search call gives an LLM enough signal to rank without per-result attestation fetches." },
          accessCount: { type: "integer" },
          createdAt: { type: "string", format: "date-time", nullable: true },
          attestationUrl: { type: "string", format: "uri", description: "Direct URL to the compact attestation envelope (?format=attestation)." },
          dialecticalFitness: { type: "number", format: "double", description: "Only present when sort=dialectical_fitness. Composite re-rank score." },
        },
      },
      SearchResponse: {
        type: "object",
        required: ["ok", "count", "results"],
        properties: {
          ok: { type: "boolean", enum: [true] },
          query: {
            type: "object",
            properties: {
              q: { type: "string" },
              limit: { type: "integer" },
              scheme: { type: "string", nullable: true },
              against: { type: "string", nullable: true },
              againstClaimText: { type: "string", nullable: true },
              sort: { type: "string", enum: ["recent", "dialectical_fitness"] },
            },
          },
          count: { type: "integer" },
          results: { type: "array", items: { $ref: "#/components/schemas/ArgumentSearchResult" } },
        },
      },
      ClaimEvidenceItem: {
        type: "object",
        properties: {
          uri: { type: "string", format: "uri" },
          title: { type: "string", nullable: true },
          citation: { type: "string", nullable: true },
          contentSha256: { type: "string", nullable: true },
          archivedUrl: { type: "string", nullable: true },
        },
      },
      ClaimResponse: {
        type: "object",
        required: ["ok", "claim"],
        properties: {
          ok: { type: "boolean", enum: [true] },
          claim: {
            type: "object",
            properties: {
              id: { type: "string" },
              moid: { type: "string" },
              text: { type: "string" },
              createdAt: { type: "string", format: "date-time", nullable: true },
              evidence: { type: "array", items: { $ref: "#/components/schemas/ClaimEvidenceItem" } },
            },
          },
          arguments: {
            type: "object",
            properties: {
              supporting: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    argumentId: { type: "string" },
                    permalink: { type: "string", format: "uri" },
                    shortCode: { type: "string" },
                    version: { type: "integer" },
                    text: { type: "string" },
                    createdAt: { type: "string", format: "date-time", nullable: true },
                    attestationUrl: { type: "string", format: "uri", description: "One-call hop to the compact attestation envelope (contentHash, immutable permalink, dialectical status)." },
                  },
                },
              },
            },
          },
        },
      },
      ProposeArgumentEvidence: {
        type: "object",
        required: ["url"],
        properties: {
          url: { type: "string", format: "uri" },
          title: { type: "string", maxLength: 500 },
          quote: { type: "string", maxLength: 2000 },
        },
      },
      ProposeArgumentInput: {
        type: "object",
        required: ["claim"],
        properties: {
          claim: { type: "string", minLength: 1, maxLength: 2000, description: "The conclusion claim. HTML is stripped server-side." },
          reasoning: { type: "string", maxLength: 5000, description: "Optional inferential prose." },
          evidence: { type: "array", maxItems: 10, items: { $ref: "#/components/schemas/ProposeArgumentEvidence" }, default: [] },
          deliberationId: { type: "string", description: "Optional. If omitted, the argument is filed in the user's auto-created 'My Arguments' standalone deliberation." },
          isPublic: { type: "boolean", default: true },
        },
      },
      ProposeArgumentResponse: {
        type: "object",
        required: ["ok", "argument", "claim", "permalink"],
        properties: {
          ok: { type: "boolean", enum: [true] },
          argument: { type: "object", properties: { id: { type: "string" }, text: { type: "string" }, confidence: { type: "number", nullable: true } } },
          claim: { type: "object", properties: { id: { type: "string" }, text: { type: "string" }, moid: { type: "string" } } },
          permalink: { type: "object", properties: { shortCode: { type: "string" }, slug: { type: "string", nullable: true }, url: { type: "string", format: "uri" } } },
          embedCodes: { type: "object", properties: { link: { type: "string", format: "uri" }, iframe: { type: "string" }, markdown: { type: "string" }, plainText: { type: "string" } } },
        },
      },
    },
  },
} as const;
