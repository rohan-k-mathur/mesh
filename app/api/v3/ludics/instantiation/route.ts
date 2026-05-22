/**
 * GET /api/v3/ludics/instantiation
 *
 * Look up which Ludics node a given dialogueMoveId instantiates via ι(·).
 * Returns instantiated: true with locus data if found, false otherwise.
 *
 * Query params:
 *   dialogueMoveId  string  (required)
 *
 * Auth: session cookie or MCP_API_TOKEN bearer.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/serverutils";
import { getInstantiation } from "@/server/ludics/instantiation";

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

  const { searchParams } = new URL(request.url);
  const dialogueMoveId = searchParams.get("dialogueMoveId");
  if (!dialogueMoveId) {
    return NextResponse.json(
      { ok: false, error: "Missing required query param: dialogueMoveId" },
      { status: 400 }
    );
  }

  const result = await getInstantiation(dialogueMoveId);
  return NextResponse.json({ ok: true, ...result });
}
