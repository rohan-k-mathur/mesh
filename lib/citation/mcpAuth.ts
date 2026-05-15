/**
 * Shared-secret MCP bearer-token auth for the citation routes.
 *
 * Mirrors the pattern used by
 * `app/api/v3/deliberations/[id]/ecc/propose-warrant/route.ts`: when an
 * `Authorization: Bearer <token>` header exactly matches the server's
 * `MCP_API_TOKEN` env var, the caller is treated as the configured MCP
 * bot user (`MCP_AUTHOR_USER_ID`, default `"mcp-bot"`). Otherwise we
 * fall back to the session-cookie / Firebase-ID-token path that
 * `getCurrentUserId` already implements.
 *
 * Required because the citation MCP tools (`resolve_citation`,
 * `resolve_citations_bulk`) send a static `ISONOMIA_API_TOKEN` as a
 * bearer header — that token is not a Firebase ID token, so the
 * default `getCurrentUserId` path always rejects it.
 *
 * Returns the caller's user-id as a string (the citation store keys on
 * string userId), or `null` when the request is unauthenticated.
 */

import type { NextRequest } from "next/server";
import { getCurrentUserId } from "@/lib/serverutils";

/**
 * Returns true when the request carries an `Authorization: Bearer
 * <MCP_API_TOKEN>` header matching the server-side shared secret.
 * Useful for callers that need to flag the resulting row as
 * AI-authored (e.g. `authorKind = AI` on Argument) per Track AI-EPI
 * Pt.3 §5, separate from just resolving a user-id.
 */
export function isMcpBearer(req: NextRequest): boolean {
  const auth = req.headers.get("authorization") ?? "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  const expected = process.env.MCP_API_TOKEN;
  return Boolean(m && expected && m[1] === expected);
}

export async function resolveCitationCallerUserId(
  req: NextRequest,
): Promise<string | null> {
  if (isMcpBearer(req)) {
    return process.env.MCP_AUTHOR_USER_ID || "mcp-bot";
  }
  try {
    const sessionUserId = await getCurrentUserId();
    return sessionUserId == null ? null : String(sessionUserId);
  } catch {
    return null;
  }
}
