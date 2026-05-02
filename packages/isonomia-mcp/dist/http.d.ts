/**
 * Shared HTTP client + base URL config for Isonomia MCP tools.
 *
 * All tools talk to the live Isonomia API surface. The MCP server itself
 * holds no DB connection — it's a thin, portable adapter.
 *
 * Configuration (env):
 *   ISONOMIA_BASE_URL  Public base, e.g. "https://isonomia.app"
 *                      Defaults to "https://isonomia.app" when unset.
 *   ISONOMIA_API_TOKEN Bearer token. REQUIRED for write tools
 *                      (propose_argument). Read tools work anonymously.
 *   ISONOMIA_TIMEOUT_MS  Per-request timeout (default 30000).
 */
export declare const BASE_URL: string;
export declare const API_TOKEN: string;
export declare const TIMEOUT_MS: number;
export declare const USER_AGENT = "isonomia-mcp/0.1.0 (+https://isonomia.app/mcp)";
export interface IsoFetchInit extends RequestInit {
    /** When true, attaches the bearer token if configured */
    authenticated?: boolean;
    /** When true, returns the raw response body as a string instead of parsing JSON. */
    raw?: boolean;
}
/**
 * Fetch wrapper with timeout + UA + optional bearer + JSON parsing.
 * Throws an Error with a descriptive message on non-2xx, with the body
 * truncated to 500 chars so it surfaces nicely in MCP tool errors.
 */
export declare function isoFetch<T = unknown>(path: string, init?: IsoFetchInit): Promise<T>;
/**
 * Resolve a permalink / shortCode into the canonical shortCode.
 * Accepts:
 *   - "https://isonomia.app/a/Bx7kQ2mN"
 *   - "/a/Bx7kQ2mN"
 *   - "Bx7kQ2mN"
 *   - "Bx7kQ2mN@<hash>"  (immutable form; hash is stripped)
 */
export declare function permalinkToShortCode(input: string): string;
