/**
 * POST /api/v3/ludics/propose-synthesis
 *
 * Phase 2c write seam — computes the articulation join of two Design rows
 * and, when the join is trivially closed (no new loci required), commits
 * a WitnessRecord.
 *
 * Auth: Bearer MCP_API_TOKEN (env) or session cookie.
 *
 * Request body:
 *   deliberationId  string          — id of the deliberation
 *   designIds       [string,string] — pair of Design row ids to join
 *   canonicalText   string (≥1)     — synthesis statement text
 *
 * Success 200:
 *   { ok: true, result: SynthesisProposalResult }
 *
 * Errors:
 *   409 DELOCATION_REQUIRED  — join requires new loci not yet in D_P
 *   422 EMPTY_CANONICAL_TEXT — canonicalText is blank
 *   404 DESIGNS_NOT_FOUND    — one or both designIds missing
 *   400                      — bad input shape
 *   401                      — unauthenticated
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/serverutils";
import {
  proposeSynthesis,
  SynthesisError,
} from "@/server/ludics/synthesisProposalAgent";

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

const ProposeSynthesisSchema = z.object({
  deliberationId: z.string().min(1),
  designIds: z.tuple([z.string().min(1), z.string().min(1)]),
  canonicalText: z.string().min(1).max(2000),
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

  const parsed = ProposeSynthesisSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const result = await proposeSynthesis({
      ...parsed.data,
      participantId: callerId,
    });
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    if (err instanceof SynthesisError) {
      return NextResponse.json(
        { ok: false, error: err.message, code: err.code },
        { status: err.status },
      );
    }
    console.error("[propose-synthesis] Unexpected error:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
