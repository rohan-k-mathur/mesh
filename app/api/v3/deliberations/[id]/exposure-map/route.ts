/**
 * GET /api/v3/deliberations/[id]/exposure-map
 *
 * Cluster A — `get_exposure_map`
 *
 * Returns the stratified opposition space E(D_P) for a deliberation,
 * partitioned into walked / witnessable / latent strata with optional
 * topology annotation (hub set, load-bearing ranking) and cascade
 * propagation.
 *
 * Query params:
 *   claimId         string   (optional — scope to sub-design rooted at claim)
 *   stratifyDepth   integer  (optional, default 1, max 5)
 *   includeCascade  boolean  (optional, default false)
 *   includeTopology boolean  (optional, default true)
 *
 * Auth: session cookie or MCP_API_TOKEN bearer.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/serverutils";
import { computeExposureMap } from "@/server/ludics/exposureMap";

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

  const claimId = searchParams.get("claimId") ?? undefined;
  const rawDepth = parseInt(searchParams.get("stratifyDepth") ?? "1", 10);
  const stratifyDepth = Number.isNaN(rawDepth) ? 1 : Math.min(Math.max(rawDepth, 0), 5);
  const includeCascade = searchParams.get("includeCascade") === "true";
  const includeTopology = searchParams.get("includeTopology") !== "false";

  const result = await computeExposureMap(deliberationId, {
    claimId,
    stratifyDepth,
    includeCascade,
    includeTopology,
  });

  return NextResponse.json({ ok: true, deliberationId, ...result });
}
