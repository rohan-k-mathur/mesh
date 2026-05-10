/**
 * GET /api/v3/deliberations/[id]/ecc/confidence?claimId=...&mode=min|product|ds
 *
 * Sprint E1 — `c: Hom(I, claim) → ℳ` evaluated under the requested
 * monoid (Ambler §3 + Lemma 26). The `mode` parameter is a CLOSED enum
 * (ECC plan §4 row 5) — `"min" | "product" | "ds"` only.
 */
import { NextRequest, NextResponse } from "next/server";
import { evaluateConfidence, loadClaimArrow, type Mode } from "@/lib/argumentation/eccLoader";

export const dynamic = "force-dynamic";

const ALLOWED_MODES = new Set<Mode>(["min", "product", "ds"]);

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id: deliberationId } = await ctx.params;
  const url = new URL(req.url);
  const claimId = url.searchParams.get("claimId");
  const modeRaw = (url.searchParams.get("mode") ?? "product").toLowerCase() as Mode;
  if (!claimId) {
    return NextResponse.json(
      { ok: false, error: "claimId query parameter is required" },
      { status: 400 },
    );
  }
  if (!ALLOWED_MODES.has(modeRaw)) {
    return NextResponse.json(
      {
        ok: false,
        error: `mode must be one of: ${Array.from(ALLOWED_MODES).join(", ")}`,
      },
      { status: 400 },
    );
  }

  const loaded = await loadClaimArrow(deliberationId, claimId);
  if (!loaded) {
    return NextResponse.json({
      ok: true,
      deliberationId,
      claimId,
      mode: modeRaw,
      confidence: null,
      reason: "no ArgumentSupport rows for this (deliberation, claim) pair",
    });
  }

  const value = evaluateConfidence(loaded, modeRaw);
  return NextResponse.json({
    ok: true,
    deliberationId,
    claimId,
    mode: modeRaw,
    confidence: value,
    derivationCount: loaded.arrow.derivs.size,
  });
}
