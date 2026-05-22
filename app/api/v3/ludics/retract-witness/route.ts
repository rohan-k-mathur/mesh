/**
 * POST /api/v3/ludics/retract-witness
 *
 * Phase 2d — manual operator retract. Fossilizes a single WitnessRecord
 * without triggering a full argument deletion.
 *
 * Auth: Bearer MCP_API_TOKEN or session cookie.
 *
 * Request body:
 *   witnessId  string  — id of the WitnessRecord to fossilize
 *
 * Success 200:
 *   { ok: true, fossilizedAt: string (ISO-8601) }
 *
 * Errors:
 *   404  — witnessId not found
 *   409  — witnessId already fossilized
 *   400  — bad input shape
 *   401  — unauthenticated
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/serverutils";
import { prisma } from "@/lib/prismaclient";
import { fossilize } from "@/server/ludics/witnessRecord";

export const dynamic = "force-dynamic";

// ── Auth helper (mirrors bind-witness pattern) ────────────────────────────────

async function resolveCallerUserId(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get("authorization") ?? "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  const expected = process.env.MCP_API_TOKEN;
  if (m && expected && m[1] === expected) {
    return process.env.MCP_AUTHOR_USER_ID ?? "mcp-system";
  }
  return getCurrentUserId();
}

// ── Input schema ──────────────────────────────────────────────────────────────

const RetractWitnessSchema = z.object({
  witnessId: z.string().min(1),
});

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const callerId = await resolveCallerUserId(request);
  if (!callerId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const parsed = RetractWitnessSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { witnessId } = parsed.data;

  // Verify existence and current state
  const witness = await prisma.witnessRecord.findUnique({
    where: { id: witnessId },
    select: { id: true, fossilizedAt: true },
  });

  if (!witness) {
    return NextResponse.json(
      { ok: false, error: `WitnessRecord "${witnessId}" not found` },
      { status: 404 },
    );
  }

  if (witness.fossilizedAt !== null) {
    return NextResponse.json(
      {
        ok: false,
        error: `WitnessRecord "${witnessId}" is already fossilized`,
        code: "ALREADY_FOSSILIZED",
        fossilizedAt: witness.fossilizedAt.toISOString(),
      },
      { status: 409 },
    );
  }

  const result = await fossilize(witnessId, "manual_retract");

  return NextResponse.json({
    ok: true,
    fossilizedAt: result.fossilizedAt!.toISOString(),
  });
}
