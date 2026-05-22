/**
 * GET /api/v3/ludics/fossil-record
 *
 * Cluster E — `get_fossil_record`
 *
 * Returns the retraction history (fossilized witness records) for a
 * deliberation or specific Ludics move. Fossil records carry locus
 * back-pointers so callers can reconstruct the provenance even after
 * a locus is no longer in the current D_P.
 *
 * Query params:
 *   deliberationId  string   optional — scope to a deliberation
 *   ludicMoveId     string   optional — scope to a specific Ludics move
 *   includeActive   boolean  optional, default false — also count active records
 *   limit           number   optional, default 50 (max 200)
 *
 * At least one of deliberationId or ludicMoveId must be provided.
 *
 * T4 invariant: participantId is omitted from responses by default.
 *
 * Auth: session cookie or MCP_API_TOKEN bearer.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/serverutils";
import { getFossilRecord } from "@/server/ludics/fossilRecord";

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

  const sp = request.nextUrl.searchParams;
  const deliberationId = sp.get("deliberationId") ?? undefined;
  const ludicMoveId = sp.get("ludicMoveId") ?? undefined;
  const includeActive = sp.get("includeActive") === "true";
  const limitRaw = parseInt(sp.get("limit") ?? "50", 10);
  const limit = Number.isNaN(limitRaw) ? 50 : Math.min(Math.max(1, limitRaw), 200);

  if (!deliberationId && !ludicMoveId) {
    return NextResponse.json(
      { ok: false, error: "At least one of deliberationId or ludicMoveId is required" },
      { status: 400 },
    );
  }

  const result = await getFossilRecord({ deliberationId, ludicMoveId, includeActive, limit });
  return NextResponse.json({ ok: true, ...result });
}
