/**
 * GET /api/v3/deliberations/[id]/behaviour-at-locus
 *
 * Cluster F — `get_behaviour_at_locus`
 *
 * Returns the behaviour B_ℓ at a given locus in the deliberation:
 * all incarnations (Designs) spanning that locus, with stratum labels
 * and WitnessRecord-coverage fitness.
 *
 * Query params:
 *   locus  string  (required)
 *
 * Auth: session cookie or MCP_API_TOKEN bearer.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/serverutils";
import { getBehaviourAtLocus } from "@/server/ludics/behaviourAtLocus";

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
  const locus = searchParams.get("locus");
  if (!locus) {
    return NextResponse.json(
      { ok: false, error: "Missing required query param: locus" },
      { status: 400 },
    );
  }

  const result = await getBehaviourAtLocus(deliberationId, locus);
  if (!result) {
    return NextResponse.json(
      { ok: false, error: "No behaviour found at the given locus" },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, ...result });
}
