/**
 * POST /api/v3/ludics/bind-witness
 *
 * Iota write seam — creates a WitnessRecord after enforcing
 * invariants I1–I4 via the bindParticipantToDesign service.
 *
 * Auth: Bearer MCP_API_TOKEN or session cookie (same pattern as propose-warrant).
 *
 * Request body:
 *   dialogueMoveId  string   — id of the source DialogueMove
 *   ludicMoveId     string   — id of the target LudicMove (I1/I2)
 *   participantId   string   — participant being bound
 *   canonicalText   string   — JSON.stringify({text:…}) from canonicalizeClaimText (I3)
 *   schemeKey?      string   — ArgumentScheme.key (I4; required for inference moves)
 *
 * Success 200:
 *   { ok: true, result: BindResult }
 *
 * Errors:
 *   409 DELOCATION_REQUIRED — ludicMoveId not found / locus absent
 *   422 CANON_GATE_FAILED   — canonicalText failed pipeline validation
 *   422 SCHEME_REQUIRED     — schemeKey invalid or required-but-absent for inference move
 *   400                     — bad input shape
 *   401                     — unauthenticated
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/serverutils";
import {
  bindParticipantToDesign,
  BindError,
} from "@/server/ludics/bindParticipantToDesign";

export const dynamic = "force-dynamic";

// ── Auth helper (mirrors propose-warrant pattern) ─────────────────────────────

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

const BindWitnessSchema = z.object({
  dialogueMoveId: z.string().min(1),
  ludicMoveId: z.string().min(1),
  participantId: z.string().min(1),
  canonicalText: z.string().min(1),
  schemeKey: z.string().optional(),
  /** Phase 2d: optional argumentId back-reference stored on LudicMove. */
  argumentId: z.string().optional(),
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
      { status: 400 }
    );
  }

  const parsed = BindWitnessSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const result = await bindParticipantToDesign(parsed.data);
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    if (err instanceof BindError) {
      return NextResponse.json(
        { ok: false, error: err.message, code: err.code },
        { status: err.status }
      );
    }
    // Unique constraint: this dialogueMoveId was already witnessed
    if (
      typeof (err as any)?.code === "string" &&
      (err as any).code === "P2002"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "dialogueMoveId already has a WitnessRecord — each dialogue move may only witness once",
          code: "ALREADY_WITNESSED",
        },
        { status: 409 }
      );
    }
    console.error("[bind-witness] Unexpected error:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
