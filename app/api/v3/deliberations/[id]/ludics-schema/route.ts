/**
 * GET /api/v3/deliberations/[id]/ludics-schema
 *
 * Cluster F — `get_deliberation_schema`
 *
 * Returns the structural schema of a deliberation's Ludics layer:
 * locus count, optional design tree, and witnessing-coverage summary.
 * This is the orientation-level read for the Ludics layer.
 *
 * Query params:
 *   includeDesignTree  boolean  (optional, default true)
 *
 * Auth: session cookie or MCP_API_TOKEN bearer.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/serverutils";
import { getDeliberationSchema } from "@/server/ludics/deliberationSchema";

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

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const callerId = await resolveCallerUserId(request);
  if (!callerId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id: deliberationId } = await ctx.params;
  const { searchParams } = new URL(request.url);
  const includeDesignTree = searchParams.get("includeDesignTree") !== "false";

  const result = await getDeliberationSchema(deliberationId, includeDesignTree);
  if (!result) {
    return NextResponse.json({ ok: false, error: "Deliberation not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, ...result });
}
