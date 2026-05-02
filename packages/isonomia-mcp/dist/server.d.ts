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
