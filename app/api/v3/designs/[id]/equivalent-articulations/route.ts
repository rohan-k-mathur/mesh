/**
 * GET /api/v3/designs/[id]/equivalent-articulations
 *
 * Cluster B — `find_equivalent_articulations`
 *
 * Returns the ~_⊥⊥ equivalence class of the given design: other designs in
 * the same behaviour that articulate the same position with different
 * premise/move configurations.
 *
 * Auth: session cookie or MCP_API_TOKEN bearer.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/serverutils";
import { findEquivalentArticulations } from "@/server/ludics/articulationLattice";

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

  const { id: designId } = await ctx.params;
  const result = await findEquivalentArticulations(designId);

  return NextResponse.json({ ok: true, ...result });
}
