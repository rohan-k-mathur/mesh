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
 *   ISONOMIA_TIMEOUT_MS  Per-request timeout (default 15000).
 */

export const BASE_URL =
  process.env.ISONOMIA_BASE_URL?.replace(/\/+$/, "") || "https://isonomia.app";

export const API_TOKEN = process.env.ISONOMIA_API_TOKEN || "";

export const TIMEOUT_MS = Number(process.env.ISONOMIA_TIMEOUT_MS ?? 15000) || 15000;

export const USER_AGENT = "isonomia-mcp/0.1.0 (+https://isonomia.app/mcp)";

export interface IsoFetchInit extends RequestInit {
  /** When true, attaches the bearer token if configured */
  authenticated?: boolean;
}

/**
 * Fetch wrapper with timeout + UA + optional bearer + JSON parsing.
 * Throws an Error with a descriptive message on non-2xx, with the body
 * truncated to 500 chars so it surfaces nicely in MCP tool errors.
 */
export async function isoFetch<T = unknown>(
  path: string,
  init: IsoFetchInit = {}
): Promise<T> {
  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const headers = new Headers(init.headers);
  headers.set("User-Agent", USER_AGENT);
  if (init.authenticated && API_TOKEN) {
    headers.set("Authorization", `Bearer ${API_TOKEN}`);
  }
  if (!headers.has("Accept")) headers.set("Accept", "application/json");

  try {
    const res = await fetch(url, { ...init, headers, signal: controller.signal });
    const text = await res.text();
    if (!res.ok) {
      const snippet = text.length > 500 ? text.slice(0, 500) + "…" : text;
      throw new Error(`HTTP ${res.status} ${res.statusText} from ${url}: ${snippet}`);
    }
    if (!text) return {} as T;
    try {
      return JSON.parse(text) as T;
    } catch {
      // For endpoints that return JSON-LD with extra profile parameters in
      // Content-Type, .json() can over-strictly bail — we already got text.
      return JSON.parse(text) as T;
    }
  } catch (err: any) {
    if (err?.name === "AbortError") {
      throw new Error(`Request to ${url} timed out after ${TIMEOUT_MS}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Resolve a permalink / shortCode into the canonical shortCode.
 * Accepts:
 *   - "https://isonomia.app/a/Bx7kQ2mN"
 *   - "/a/Bx7kQ2mN"
 *   - "Bx7kQ2mN"
 *   - "Bx7kQ2mN@<hash>"  (immutable form; hash is stripped)
 */
export function permalinkToShortCode(input: string): string {
  let s = input.trim();
  // Strip URL prefix
  const m = s.match(/\/a\/([^/?#@]+)/);
  if (m) s = m[1];
  // Strip immutable @hash suffix
  const at = s.indexOf("@");
  if (at !== -1) s = s.slice(0, at);
  return s;
}
