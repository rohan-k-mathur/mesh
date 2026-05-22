/**
 * GET /api/v3/behaviours/[id]/articulation-lattice
 *
 * Cluster B — `get_articulation_lattice`
 *
 * Returns the articulation lattice Art(B) = (Inc(B), ≤_⊆, ∨_⊥⊥) for the
 * behaviour identified by [id], as a navigable poset of incarnations.
 *
 * Query params:
 *   representatives  "incarnations" | "raw"  (default: "incarnations")
 *
 * Auth: session cookie or MCP_API_TOKEN bearer.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/serverutils";
import { getArticulationLattice } from "@/server/ludics/articulationLattice";

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
  const { searchParams } = new URL(request.url);
  const rep = searchParams.get("representatives") ?? "incarnations";
  if (rep !== "incarnations" && rep !== "raw") {
    return NextResponse.json(
      { ok: false, error: "representatives must be 'incarnations' or 'raw'" },
      { status: 400 },
    );
  }

  const result = await getArticulationLattice(behaviourId, rep);
  if (!result) {
    return NextResponse.json(
      { ok: false, error: "Behaviour not found or has no designs" },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, ...result });
}
