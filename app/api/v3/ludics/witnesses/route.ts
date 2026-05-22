/**
 * GET /api/v3/ludics/witnesses
 *
 * Return the witnessing record for a specific Ludics move.
 * Anonymous by default (T4 invariant). Pass includeIdentity=true to opt in.
 *
 * Query params:
 *   ludicMoveId     string   (required)
 *   includeIdentity boolean  (optional, default false)
 *
 * Auth: session cookie or MCP_API_TOKEN bearer.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/serverutils";
import { getWitnessesForMove } from "@/server/ludics/witnessRecord";

export const dynamic = "force-dynamic";

async function resolveCallerUserId(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get("authorization") ?? "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  const expected = process.env.MCP_API_TOKEN;
  if (m && expected && m[1] === expected) {
    return process.env.MCP_AUTHOR_USER_ID ?? "mcp-system";
  }
  return getCurrentUserId();
}

export async function GET(request: NextRequest) {
  const callerId = await resolveCallerUserId(request);
  if (!callerId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const ludicMoveId = searchParams.get("ludicMoveId");
  if (!ludicMoveId) {
    return NextResponse.json(
      { ok: false, error: "Missing required query param: ludicMoveId" },
      { status: 400 }
    );
  }

  const includeIdentity = searchParams.get("includeIdentity") === "true";

  const result = await getWitnessesForMove(ludicMoveId, { includeIdentity });
  return NextResponse.json({ ok: true, ...result });
}
