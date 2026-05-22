/**
 * POST /api/v3/articulations/compress
 *
 * Cluster B — `compress_articulation`
 *
 * Given two or more design ids, returns their meet D1 ∧ D2 in Art(B) —
 * the minimum-commitment design that both articulations extend.
 *
 * Body: { "designIds": string[] }
 *
 * Auth: session cookie or MCP_API_TOKEN bearer.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/serverutils";
import { compressArticulation } from "@/server/ludics/articulationLattice";

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

  const result = await compressArticulation(designIds);
  return NextResponse.json({ ok: true, ...result });
}
