/**
 * POST /api/v3/articulations/join
 *
 * Cluster B — `compute_articulation_join`
 *
 * Computes D1 ∨_⊥⊥ D2 := (D1 ∪ D2)^⊥⊥ — the smallest behaviour-closed
 * design containing all supplied designs. Creates a new Design row with
 * derivedBy: "join" when none exists.
 *
 * Body: { "designIds": string[] }
 *
 * Auth: session cookie or MCP_API_TOKEN bearer.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/serverutils";
import { computeArticulationJoin } from "@/server/ludics/articulationLattice";

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

export async function POST(request: NextRequest) {
  const callerId = await resolveCallerId(request);
  if (!callerId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  if (
    !body ||
    typeof body !== "object" ||
    !Array.isArray((body as Record<string, unknown>).designIds)
  ) {
    return NextResponse.json(
      { ok: false, error: "Body must include designIds: string[]" },
      { status: 400 },
    );
  }

  const designIds: string[] = (body as Record<string, unknown>).designIds as string[];
  if (designIds.length < 2) {
    return NextResponse.json(
      { ok: false, error: "designIds must contain at least 2 ids" },
      { status: 400 },
    );
  }

  const result = await computeArticulationJoin(designIds);

  if (!result) {
    return NextResponse.json(
      { ok: false, error: "No designs found for the given ids" },
      { status: 404 },
    );
  }

  // Phase 2e/2f: cross-cone is a value, not an error. Return 200 with the
  // discriminator so callers can branch on `result.kind`.
  return NextResponse.json({ ok: true, ...result });
}
