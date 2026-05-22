/**
 * GET /api/v3/behaviours/[id]/minimal-incarnations
 *
 * Cluster B — `find_minimal_incarnations`
 *
 * Returns the minimal element(s) of Inc(B) — the Girard incarnation |B| and,
 * if the poset has co-equal minima, all of them.
 *
 * Auth: session cookie or MCP_API_TOKEN bearer.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/serverutils";
import { findMinimalIncarnations } from "@/server/ludics/articulationLattice";

export const dynamic = "force-dynamic";

async function resolveCallerId(req: NextRequest): Promise<string | null> {
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
  const callerId = await resolveCallerId(request);
  if (!callerId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id: behaviourId } = await ctx.params;
  const result = await findMinimalIncarnations(behaviourId);

  return NextResponse.json({ ok: true, ...result });
}
