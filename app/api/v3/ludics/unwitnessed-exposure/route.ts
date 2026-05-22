/**
 * GET /api/v3/ludics/unwitnessed-exposure
 *
 * Returns LudicMoves in a deliberation that have no active WitnessRecord
 * (structural objections not yet addressed via the ι(·) write seam).
 *
 * Query params:
 *   deliberationId   string                           (required)
 *   stratum          "witnessable" | "latent" | "all" (optional, default "witnessable")
 *   limit            number 1-100                     (optional, default 20)
 *
 * Auth: session cookie or MCP_API_TOKEN bearer.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/serverutils";
import { getUnwitnessedExposure, ExposureStratum } from "@/server/ludics/exposure";

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

const VALID_STRATA = new Set<ExposureStratum>(["witnessable", "latent", "all"]);

export async function GET(request: NextRequest) {
  const callerId = await resolveCallerUserId(request);
  if (!callerId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  const deliberationId = searchParams.get("deliberationId");
  if (!deliberationId) {
    return NextResponse.json(
      { ok: false, error: "Missing required query param: deliberationId" },
      { status: 400 }
    );
  }

  const rawStratum = (searchParams.get("stratum") ?? "witnessable") as ExposureStratum;
  if (!VALID_STRATA.has(rawStratum)) {
    return NextResponse.json(
      { ok: false, error: `Invalid stratum. Must be one of: witnessable, latent, all` },
      { status: 400 }
    );
  }

  const rawLimit = parseInt(searchParams.get("limit") ?? "20", 10);
  const limit = Number.isNaN(rawLimit) ? 20 : Math.min(Math.max(rawLimit, 1), 100);

  const result = await getUnwitnessedExposure(deliberationId, rawStratum, limit);
  return NextResponse.json({ ok: true, ...result });
}
