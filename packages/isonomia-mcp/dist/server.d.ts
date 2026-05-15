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
export {};
